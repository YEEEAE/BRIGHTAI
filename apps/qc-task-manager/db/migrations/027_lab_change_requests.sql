-- 027_lab_change_requests.sql — controlled laboratory contributor proposals.
-- The audit rebuild is row-preserving and extends the existing shared log;
-- there is intentionally no second change-request audit table.
-- brightai:allow-destructive

CREATE TABLE qc_audit_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE','LAB_TEST','LAB_RETEST','LAB_PRODUCT','LAB_TEMPLATE','LAB_EQUIPMENT','LAB_EQUIPMENT_MAINTENANCE','LAB_EQUIPMENT_CALIBRATION','LAB_DOCUMENT','LAB_DOCUMENT_VERSION','LAB_CHANGE_REQUEST')),
  entity_id INTEGER NOT NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN','SUBMIT','REQUEST_CHANGES','VOID','SUPERSEDE','ACKNOWLEDGE','LINK','UNLINK','VERSION')),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
INSERT INTO qc_audit_log_new (id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at)
  SELECT id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at FROM qc_audit_log;
DROP TABLE qc_audit_log;
ALTER TABLE qc_audit_log_new RENAME TO qc_audit_log;
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type, entity_id, created_at);

CREATE TABLE IF NOT EXISTS lab_change_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EQUIPMENT','PRODUCT','CALIBRATION','RETEST_REQUEST')),
  operation TEXT NOT NULL CHECK (operation IN ('CREATE','UPDATE')),
  entity_id INTEGER,
  base_updated_at TEXT,
  base_snapshot_json TEXT,
  proposed_snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  applied_entity_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_status_created ON lab_change_requests(status, created_at);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_requester_status ON lab_change_requests(requested_by, status);
CREATE INDEX IF NOT EXISTS idx_lab_change_requests_target ON lab_change_requests(entity_type, entity_id, status);
