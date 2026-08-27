-- 036_password_lifecycle.sql
--
-- First-login password lifecycle for the employee pilot.
--
-- must_change_password: set when an account's current password was chosen by
-- someone else (admin-created users, admin password resets) or by the seeder
-- (pilot accounts boot with the shared ADMIN_DEFAULT_PASSWORD). A flagged
-- account may only reach the password-change flow and logout until the
-- password is changed (enforced in src/middleware.ts).
--
-- password_changed_at: timestamp of the last user-completed password change
-- (NULL until the first self-service change). Admin resets also stamp it.
--
-- Backfill: every existing account keeps must_change_password = 0 — this
-- migration must not lock existing operators out mid-pilot; new flags are set
-- going forward by createUser/resetPassword/seed.

ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (must_change_password IN (0, 1));
ALTER TABLE users ADD COLUMN password_changed_at TEXT;
