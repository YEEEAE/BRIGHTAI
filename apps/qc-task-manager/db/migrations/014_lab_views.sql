-- QC Laboratory saved views (PROMPT 02; docs/QC-LAB-ARCHITECTURE.md §8/D-3).
--
-- User-scoped saved lab filters, following the exact shape and scoping of the
-- existing saved_filters table (user_id CASCADE, name, JSON payload,
-- created_at). A separate lab table is used instead of altering saved_filters
-- because the existing table is owned by the task-search flow; lab filter
-- payloads are validated against a lab parameter allowlist by the application
-- layer — never arbitrary SQL.
--
-- lab_calendar_items is deliberately NOT created: calendar events are derived
-- at read time from calibration, maintenance, document-review and
-- acknowledgement dates (docs/QC-LAB-ARCHITECTURE.md §14).

CREATE TABLE IF NOT EXISTS lab_saved_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lab_saved_views_user ON lab_saved_views(user_id);
