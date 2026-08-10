// Authentication: password hashing/verification + session management.
//
// Sessions are server-side rows in the relational `sessions(token, user_id, …)`
// table; the browser only holds the opaque random token in an HttpOnly cookie.
// SessionData (username/role/fullName) is derived from the users row at read
// time, so role/name changes take effect on the next request for that session.

import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { getDb, toBool } from './db';
import type { Role, SessionData, User } from './types';

const COOKIE_NAME = 'qc_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

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

/** Verify credentials and return the user, or null on failure. */
export function verifyCredentials(
  username: string,
  password: string,
): User | null {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (!toBool(Number(row.is_active))) return null;

  const ok = bcrypt.compareSync(password, String(row.password_hash));
  if (!ok) return null;
  return rowToUser(row);
}

/** Create a session row and return the opaque token to store in the cookie. */
export function createSession(user: User): string {
  const db = getDb();
  const token = randomBytes(32).toString('hex');
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

export { COOKIE_NAME, SESSION_TTL_MS };
