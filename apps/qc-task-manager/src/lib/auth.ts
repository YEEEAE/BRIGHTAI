// Authentication: password hashing/verification + session management.
//
// Sessions are server-side rows in the relational `sessions(token, user_id, …)`
// table; the browser only holds the opaque random token in an HttpOnly cookie.
// SessionData (username/role/fullName) is derived from the users row at read
// time, so role/name changes take effect on the next request for that session.

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { getDb, toBool } from './db';
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

/** Create a session row and return the opaque token to store in the cookie. */
export function createSession(user: User): string {
  const db = getDb();
  const token = randomUUID(); // opaque random token, per spec
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
              u.is_active AS is_active
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
      }
    | undefined;
  if (!row) return null;

  // Expired session: purge and treat as absent.
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  // User deactivated since session was issued: drop it.
  if (!toBool(row.is_active)) return null;

  return {
    userId: row.user_id,
    username: row.username,
    role: row.role,
    fullName: row.full_name,
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
