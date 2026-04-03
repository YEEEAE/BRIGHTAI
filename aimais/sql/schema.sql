CREATE TABLE IF NOT EXISTS rejection_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_date TEXT NOT NULL,
  item_code TEXT NOT NULL,
  machine_name TEXT NOT NULL DEFAULT '',
  produced_qty REAL NOT NULL DEFAULT 0,
  rejected_qty REAL NOT NULL DEFAULT 0,
  reject_pct REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS daily_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  owner_name TEXT DEFAULT 'Quality Manager',
  due_date TEXT,
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  progress_note TEXT DEFAULT '',
  progress_percent INTEGER DEFAULT 0,
  updated_at TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS future_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  horizon_label TEXT DEFAULT '30 days',
  objective TEXT NOT NULL,
  owner_name TEXT DEFAULT 'Operations Team',
  status TEXT DEFAULT 'planned',
  impact_score INTEGER DEFAULT 80,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS handover_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shift_label TEXT NOT NULL,
  speaker_name TEXT NOT NULL,
  summary TEXT NOT NULL,
  blockers TEXT DEFAULT '',
  next_step TEXT DEFAULT '',
  mood TEXT DEFAULT 'steady',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS executive_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  period_label TEXT,
  summary TEXT,
  risks TEXT,
  recommendations TEXT,
  recipients TEXT,
  generated_by TEXT DEFAULT 'system',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS import_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_file TEXT NOT NULL,
  sheet_name TEXT,
  row_count INTEGER,
  latest_month TEXT,
  matched_fields TEXT,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  token TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  ip TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric TEXT NOT NULL UNIQUE,
  target_pct REAL NOT NULL DEFAULT 2.0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS file_watch (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  file_path TEXT NOT NULL,
  last_mtime_ms INTEGER NOT NULL DEFAULT 0,
  last_check_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_import_at DATETIME,
  row_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'never_imported'
);

CREATE INDEX IF NOT EXISTS idx_rr_date ON rejection_records(report_date);
CREATE INDEX IF NOT EXISTS idx_rr_item ON rejection_records(item_code);
CREATE INDEX IF NOT EXISTS idx_rr_machine ON rejection_records(machine_name);
CREATE INDEX IF NOT EXISTS idx_rr_item_date ON rejection_records(item_code, report_date);
CREATE INDEX IF NOT EXISTS idx_rr_item_machine_date ON rejection_records(item_code, machine_name, report_date);
CREATE INDEX IF NOT EXISTS idx_rr_pct ON rejection_records(reject_pct DESC);
CREATE INDEX IF NOT EXISTS idx_import_history_imported_at ON import_history(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_status_due_date ON daily_tasks(status, due_date);
CREATE INDEX IF NOT EXISTS idx_future_plans_status_impact ON future_plans(status, impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_handover_notes_created_at ON handover_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executive_reports_created_at ON executive_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_actor ON user_sessions(actor);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity, entity_id);

INSERT OR IGNORE INTO kpi_targets (metric, target_pct)
VALUES ('overall', 2.0);

INSERT OR IGNORE INTO file_watch
  (id, file_path, last_mtime_ms)
VALUES
  (1, 'Rejection_Slip_Report.xlsx', 0);
