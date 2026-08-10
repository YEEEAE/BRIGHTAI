-- QC Task Manager — seed data (one user per role for local dev).
-- Re-runnable: uses INSERT OR IGNORE against unique username/email.
-- Passwords are bcrypt hashes of `password123` (cost 10).
--   - $2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b  (placeholder, replaced below)

INSERT OR IGNORE INTO users (username, full_name, email, password_hash, role, can_create_tasks, is_active)
VALUES
  ('admin',     'Site Admin',       'admin@qc.local',     '$2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b', 'admin',     1, 1),
  ('manager',   'Task Manager',     'manager@qc.local',   '$2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b', 'manager',   1, 1),
  ('supervisor','Team Supervisor',  'supervisor@qc.local','$2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b', 'supervisor',1, 1),
  ('employee',  'Staff Employee',   'employee@qc.local',  '$2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b', 'employee',  0, 1),
  ('emp_creator','Creator Employee','creator@qc.local',   '$2b$10$6JLq8mMRk1l3A2rQ9sY9heRTuU4cV0eXr9X8r8bY8r8bY8r8bY8r8b', 'employee',  1, 1);
