-- QC Task Manager — seed data (reference SQL).
--
-- The AUTHORITATIVE seed runs at process startup via src/lib/seed.ts, which
-- generates a fresh bcrypt hash of ADMIN_DEFAULT_PASSWORD (fallback 'admin123').
-- This file is kept as documentation and for out-of-band bootstrapping via the
-- SQLTools SQLite extension; the password_hash below is a PLACEHOLDER and must
-- be replaced with a real bcrypt hash before use.
--
-- Behaviour: seed runs only when the users table is empty (handled in seed.ts).

INSERT INTO users (username, password_hash, full_name, role, department, can_create_tasks, is_active)
VALUES (
  'admin',
  '$2a$10$REPLACE_WITH_REAL_BCRYPT_HASH_OF_admin123',
  'Administrator',
  'admin',
  'QC',
  1,
  1
);
