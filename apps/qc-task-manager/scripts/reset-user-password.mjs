// Reset one account's password from the command line.
//
// Run: QC_NEW_PASSWORD='…' pnpm auth:reset-password -- --user=admin
//
// Operator recovery path for a deployment nobody can sign in to any more.
// ADMIN_DEFAULT_PASSWORD cannot rescue such a service: src/lib/seed.ts only
// reads it while the users table is empty, so an existing database keeps the
// password its accounts were created with.
//
// The new password is read from the environment, never from argv, so it stays
// out of shell history and out of the process list on a shared host.

import { getDb, resolveDatabasePath } from '../src/lib/db.ts';
import { resetPassword } from '../src/lib/users.ts';
import { MIN_PASSWORD_LENGTH } from '../src/lib/task-policy.ts';

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((value) => value.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

const username = arg('user') ?? 'admin';
const newPassword = process.env.QC_NEW_PASSWORD ?? '';

if (newPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `[reset-user-password] QC_NEW_PASSWORD must be set and at least ${MIN_PASSWORD_LENGTH} characters.`,
  );
  process.exit(1);
}

const db = getDb();
const target = db
  .prepare('SELECT id, username, role FROM users WHERE username = ?')
  .get(username);

if (!target) {
  console.error(
    `[reset-user-password] no account named "${username}" in ${resolveDatabasePath()}.`,
  );
  process.exit(1);
}

// resetPassword() is the same code path as an admin reset in /admin/users: it
// revalidates the policy, clears any brute-force lock, appends to the user
// audit chain, and re-flags must_change_password. The target doubles as the
// actor because a CLI operator has no session, and an unattributed password
// change would leave the audit chain silent about how the account came back.
const result = resetPassword({ id: target.id, username: target.username }, target.id, newPassword);

if (!result.ok) {
  console.error(`[reset-user-password] ${result.error}`);
  process.exit(1);
}

console.log(
  `[reset-user-password] ${target.username} (${target.role}) updated in ${resolveDatabasePath()}.`,
);
console.log(
  '[reset-user-password] account is flagged must_change_password — the first sign-in lands on /account/security.',
);
