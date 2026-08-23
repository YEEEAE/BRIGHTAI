-- brightai:allow-destructive
-- Preserve QC/Lab audit history when its originating task is deleted. task_id
-- is historical identity only; actor_id remains an immutable user reference.
CREATE TABLE qc_audit_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE','LAB_TEST','LAB_RETEST','LAB_PRODUCT','LAB_TEMPLATE','LAB_EQUIPMENT','LAB_EQUIPMENT_MAINTENANCE','LAB_EQUIPMENT_CALIBRATION','LAB_DOCUMENT','LAB_DOCUMENT_VERSION','LAB_CHANGE_REQUEST')),
  entity_id INTEGER NOT NULL,
  task_id INTEGER,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('CREATE','UPDATE','STATUS_TRANSITION','APPROVAL','REJECTION','CLOSURE','REOPEN','SUBMIT','REQUEST_CHANGES','VOID','SUPERSEDE','ACKNOWLEDGE','LINK','UNLINK','VERSION')),
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  previous_hash TEXT,
  event_hash TEXT
);

INSERT INTO qc_audit_log_new (id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at, previous_hash, event_hash)
  SELECT id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at, previous_hash, event_hash
  FROM qc_audit_log
  ORDER BY id ASC;
DROP TABLE qc_audit_log;
ALTER TABLE qc_audit_log_new RENAME TO qc_audit_log;
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type,entity_id,created_at);
