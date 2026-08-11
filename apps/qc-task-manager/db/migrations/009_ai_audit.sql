CREATE TABLE IF NOT EXISTS ai_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  request_reference TEXT NOT NULL UNIQUE,
  response_reference TEXT,
  success INTEGER NOT NULL CHECK (success IN (0, 1)),
  failure_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ai_audit_user_created ON ai_audit_log(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_audit_feature_created ON ai_audit_log(feature, created_at);
