-- Dashboard reports: append-only generation audit and resolved scope metadata.
CREATE TABLE IF NOT EXISTS report_audit_log (
  report_id TEXT PRIMARY KEY,
  report_type TEXT NOT NULL,
  generated_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  filters_json TEXT NOT NULL,
  generated_at TEXT NOT NULL DEFAULT (datetime('now')),
  format TEXT NOT NULL CHECK (format IN ('csv', 'xlsx', 'pdf')),
  data_scope_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  row_count INTEGER,
  failure_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_audit_actor_time
  ON report_audit_log(generated_by, generated_at);

CREATE INDEX IF NOT EXISTS idx_report_audit_type_time
  ON report_audit_log(report_type, generated_at);
