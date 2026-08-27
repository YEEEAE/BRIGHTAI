// Authentication: password hashing/verification + session management.
//
// Sessions are server-side rows in the relational `sessions(token, user_id, …)`
// table; the browser only holds the opaque random token in an HttpOnly cookie.
// SessionData (username/role/fullName) is derived from the users row at read
// time, so role/name changes take effect on the next request for that session.

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { getDb, toBool } from './db';
import { passwordResetSchema } from './validation';
import type { Role, SessionData, User } from './types';

const COOKIE_NAME = 'qc_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours (per spec)

// Brute-force protection (per spec): lock the account for 10 minutes after
// five consecutive failed login attempts.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const MAX_FAILED_ATTEMPTS_PER_IP = 20;
// A real bcrypt hash of a throwaway string. Used on the unknown-username path
// so login takes the same time whether or not the account exists — otherwise
// the missing-user branch returns before bcrypt runs and an attacker can
// enumerate usernames by timing.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('brightai-qc-dummy-password', 10);

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: Number(row.id),
    username: String(row.username),
    full_name: String(row.full_name),
    role: row.role as Role,
    department: String(row.department),
    can_create_tasks: toBool(Number(row.can_create_tasks)),
    is_active: toBool(Number(row.is_active)),
    must_change_password: toBool(Number(row.must_change_password ?? 0)),
    password_changed_at: row.password_changed_at == null ? null : String(row.password_changed_at),
    created_at: String(row.created_at),
  };
}

/** Look up a user by id, or null if missing/inactive. */
export function getUserById(id: number): User | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!row) return null;
  const user = rowToUser(row);
  return user.is_active ? user : null;
}

/**
 * True if a username exists but the account has been deactivated. Used by the
 * login handler to show a distinct "account disabled" message instead of a
 * generic bad-credentials error.
 */
export function isUserDisabled(username: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT is_active FROM users WHERE username = ?')
    .get(username) as { is_active: number } | undefined;
  if (!row) return false;
  return Number(row.is_active) !== 1;
}

/** Result of a credential check — richer than `User | null` so callers can
 * distinguish a locked account from plain bad credentials. */
export type LoginResult =
  | { status: 'ok'; user: User }
  | { status: 'locked'; lockedUntil: string }
  | { status: 'invalid' };

/** Rate limit failed login attempts from one client IP in the lock window. */
function isIpRateLimited(ipAddress: string | null | undefined): boolean {
  if (!ipAddress) return false;
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS count FROM login_attempts
       WHERE ip_address = ? AND succeeded = 0
         AND datetime(created_at) >= datetime('now', '-10 minutes')`,
    )
    .get(ipAddress) as { count: number };
  return Number(row.count) >= MAX_FAILED_ATTEMPTS_PER_IP;
}

/**
 * Append a row to the login_attempts audit table (username + IP + outcome).
 *
 * Audit logging must NEVER break authentication: if the insert fails (disk,
 * schema drift, …) the login proceeds normally and we log the failure to the
 * console instead of turning the attempt into a 500.
 */
function recordLoginAttempt(
  username: string,
  ipAddress: string | null | undefined,
  succeeded: boolean,
): void {
  try {
    const db = getDb();
    db.prepare(
      'INSERT INTO login_attempts (username, ip_address, succeeded) VALUES (?, ?, ?)',
    ).run(username, ipAddress ?? null, succeeded ? 1 : 0);
  } catch (err) {
    console.error(`[auth] login_attempts audit write failed (login continues): ${(err as Error).message}`);
  }
}

/**
 * Verify credentials with brute-force protection.
 *
 * Failed attempts are counted per account (users.failed_login_attempts). After
 * MAX_FAILED_ATTEMPTS consecutive failures the account locks for
 * LOCK_DURATION_MS (users.locked_until) and login is refused even with the
 * correct password; a successful login (or lock expiry) resets the counter.
 * Every attempt is appended to login_attempts for the audit trail. Unknown
 * usernames return the same generic result as wrong passwords (no enumeration).
 */
export function verifyCredentials(
  username: string,
  password: string,
  ipAddress?: string | null,
): LoginResult {
  const db = getDb();
  // Apply the IP gate before any account-specific work. It deliberately maps
  // to the generic external login failure to prevent account enumeration.
  if (isIpRateLimited(ipAddress)) {
    bcrypt.compareSync(password, DUMMY_PASSWORD_HASH);
    recordLoginAttempt(username, ipAddress, false);
    return { status: 'invalid' };
  }
  const row = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as Record<string, unknown> | undefined;

  // Unknown username → generic failure (nothing to lock, but keep the audit).
  // Run a real bcrypt compare against a dummy hash so the response time does
  // not reveal whether the username exists (timing-based enumeration).
  if (!row) {
    bcrypt.compareSync(password, DUMMY_PASSWORD_HASH);
    recordLoginAttempt(username, ipAddress, false);
    return { status: 'invalid' };
  }
  const userId = Number(row.id);
  // Deactivated accounts never authenticate. Use the dummy hash too so this
  // branch is indistinguishable from an unknown username to remote callers.
  if (!toBool(Number(row.is_active))) {
    bcrypt.compareSync(password, DUMMY_PASSWORD_HASH);
    recordLoginAttempt(username, ipAddress, false);
    return { status: 'invalid' };
  }

  const now = Date.now();
  const lockedUntil = row.locked_until ? new Date(String(row.locked_until)).getTime() : 0;

  // Lock active: refuse even a correct password until the lock expires.
  if (lockedUntil > now) {
    recordLoginAttempt(username, ipAddress, false);
    return { status: 'locked', lockedUntil: String(row.locked_until) };
  }
  // Lock expired: clear it and give the account a fresh set of attempts.
  if (lockedUntil > 0) {
    db.prepare(
      'UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?',
    ).run(userId);
  }

  const ok = bcrypt.compareSync(password, String(row.password_hash));
  if (ok) {
    db.prepare(
      `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ?
       WHERE id = ?`,
    ).run(new Date().toISOString(), userId);
    recordLoginAttempt(username, ipAddress, true);
    return { status: 'ok', user: rowToUser(row) };
  }

  // Consecutive failures: increment the counter, lock at the threshold.
  const attempts = Number(row.failed_login_attempts ?? 0) + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const until = new Date(now + LOCK_DURATION_MS).toISOString();
    db.prepare(
      'UPDATE users SET failed_login_attempts = 0, locked_until = ? WHERE id = ?',
    ).run(until, userId);
    recordLoginAttempt(username, ipAddress, false);
    return { status: 'locked', lockedUntil: until };
  }
  db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?').run(attempts, userId);
  recordLoginAttempt(username, ipAddress, false);
  return { status: 'invalid' };
}

/**
 * Re-authentication helper for high-authority actions (e-signature step).
 * Verifies the CURRENT user's password against the stored bcrypt hash with a
 * constant-time comparison (bcrypt.compareSync). It deliberately does NOT
 * touch sessions, failed_login_attempts, or login_attempts — the session is
 * never reissued and login lockout state is unaffected. Unknown ids run a
 * dummy compare so timing does not reveal whether the id exists.
 */
export function verifyPasswordForUser(userId: number, password: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(userId) as { password_hash?: unknown } | undefined;
  if (!row || typeof row.password_hash !== 'string' || row.password_hash.length === 0) {
    bcrypt.compareSync(password, DUMMY_PASSWORD_HASH);
    return false;
  }
  return bcrypt.compareSync(password, row.password_hash);
}

/** Result of a self-service password change. Errors are user-facing messages
 * that never echo the password values or the stored hash. */
export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/**
 * Self-service password change (account security page + forced first-login
 * flow). Verifies the CURRENT password, validates the new password against the
 * existing policy (passwordResetSchema), clears must_change_password, stamps
 * password_changed_at, and invalidates every OTHER session for the user —
 * the session that performed the change stays valid (it is re-issued never;
 * the existing opaque token simply survives, per the current session model).
 *
 * Nothing about the passwords or hashes is ever logged.
 */
export function changeOwnPassword(
  userId: number,
  currentPassword: string,
  newPassword: string,
  currentToken: string | null | undefined,
): ChangePasswordResult {
  const validation = passwordResetSchema.safeParse({ newPassword });
  if (!validation.success) {
    return { ok: false, error: validation.error.issues[0]?.message ?? 'Invalid password.' };
  }

  const db = getDb();
  const row = db
    .prepare('SELECT password_hash FROM users WHERE id = ?')
    .get(userId) as { password_hash?: unknown } | undefined;
  // Unknown id: run the dummy compare so timing does not reveal it, then fail
  // with the same message as a wrong current password (no enumeration).
  if (!row || typeof row.password_hash !== 'string' || row.password_hash.length === 0) {
    bcrypt.compareSync(currentPassword, DUMMY_PASSWORD_HASH);
    return { ok: false, error: 'Current password is incorrect.' };
  }
  if (!bcrypt.compareSync(currentPassword, row.password_hash)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  const now = new Date().toISOString();
  const apply = db.transaction(() => {
    db.prepare(
      `UPDATE users SET password_hash = ?, must_change_password = 0, password_changed_at = ?, updated_at = ?
       WHERE id = ?`,
    ).run(hash, now, now, userId);
    // Requirement: every OTHER session for this user dies immediately; the
    // current one keeps the user signed in so the flow ends without a re-login.
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?').run(
      userId,
      currentToken ?? '',
    );
  });
  apply();
  return { ok: true };
}

/** Create a session row and return the opaque token to store in the cookie. */
export function createSession(user: User): string {
  const db = getDb();
  const token = randomBytes(32).toString('base64url'); // 256-bit opaque token
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`,
  ).run(token, user.id, expiresAt);
  return token;
}

/** Read a session by token, deleting it if expired. Returns the payload or null. */
export function getSession(token: string | null | undefined): SessionData | null {
  if (!token) return null;
  const db = getDb();
  // Join sessions → users so SessionData is derived from the live user row.
  const row = db
    .prepare(
      `SELECT s.expires_at AS expires_at,
              u.id AS user_id, u.username AS username, u.role AS role, u.full_name AS full_name,
              u.is_active AS is_active, u.must_change_password AS must_change_password
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ?`,
    )
    .get(token) as
    | {
        expires_at: string;
        user_id: number;
        username: string;
        role: Role;
        full_name: string;
        is_active: number;
        must_change_password: number;
      }
    | undefined;
  if (!row) return null;

  // Expired session: purge and treat as absent.
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  // User deactivated since session was issued: drop it.
  if (!toBool(row.is_active)) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return {
    userId: row.user_id,
    username: row.username,
    role: row.role,
    fullName: row.full_name,
    mustChangePassword: toBool(Number(row.must_change_password)),
  };
}

/** Delete a session (logout). */
export function destroySession(token: string | null | undefined): void {
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

/** Extract the value of `name` from a raw Cookie header. */
function cookieValue(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    const value = part.slice(idx + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}

/**
 * Resolve the current session (if any) straight from a Request object.
 * Reads the `qc_session` cookie, validates the token + expiry, joins the users
 * row, and returns null when the session is absent/expired or the user is
 * inactive. Safe to call with any Request (middleware, pages, endpoints).
 */
export function getSessionUser(request: Pick<Request, 'headers'>): SessionData | null {
  const header = request.headers.get('cookie') ?? '';
  const token = cookieValue(header, COOKIE_NAME);
  return getSession(token);
}

/**
 * Authorization gate: true only when the user exists AND their role is in the
 * allowed list. Accepts either a SessionData (middleware/locals) or a User.
 */
export function requireRole(
  user: SessionData | User | null | undefined,
  roles: Role[],
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export { COOKIE_NAME, SESSION_TTL_MS, MAX_FAILED_ATTEMPTS, LOCK_DURATION_MS };
