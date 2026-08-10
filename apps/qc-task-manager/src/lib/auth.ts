// Authentication: password hashing/verification + session management.
// Sessions are server-side rows in the `sessions` table; the browser only holds
// an opaque random token in a signed HttpOnly cookie.

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
    email: (row.email as string) ?? null,
    role: row.role as Role,
    can_create_tasks: toBool(Number(row.can_create_tasks)),
    is_active: toBool(Number(row.is_active)),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
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
  const data: SessionData = {
    userId: user.id,
    username: user.username,
    role: user.role,
    fullName: user.full_name,
  };
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(
    `INSERT INTO sessions (id, data, expires_at) VALUES (?, ?, ?)`,
  ).run(token, JSON.stringify(data), expiresAt);
  return token;
}

/** Read a session by token, deleting it if expired. Returns the payload or null. */
export function getSession(token: string | null | undefined): SessionData | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare('SELECT data, expires_at FROM sessions WHERE id = ?')
    .get(token) as { data: string; expires_at: string } | undefined;
  if (!row) return null;

  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    return null;
  }
  try {
    return JSON.parse(row.data) as SessionData;
  } catch {
    return null;
  }
}

/** Delete a session (logout). */
export function destroySession(token: string | null | undefined): void {
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE id = ?').run(token);
}

export { COOKIE_NAME, SESSION_TTL_MS };
