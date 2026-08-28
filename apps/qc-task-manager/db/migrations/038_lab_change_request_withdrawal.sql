-- 038_lab_change_request_withdrawal.sql — allow requesters to withdraw pending proposals.
-- SQLite requires rebuilding the table to extend its CHECK constraint.
-- brightai:allow-destructive

CREATE TABLE lab_change_requests_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EQUIPMENT','PRODUCT','CALIBRATION','RETEST_REQUEST')),
  operation TEXT NOT NULL CHECK (operation IN ('CREATE','UPDATE')),
  entity_id INTEGER,
  base_updated_at TEXT,
  base_snapshot_json TEXT,
  proposed_snapshot_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
  requested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  review_note TEXT,
  applied_entity_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

INSERT INTO lab_change_requests_new (
  id, entity_type, operation, entity_id, base_updated_at, base_snapshot_json,
  proposed_snapshot_json, status, requested_by, reviewed_by, review_note,
  applied_entity_id, created_at, reviewed_at
)
SELECT
  id, entity_type, operation, entity_id, base_updated_at, base_snapshot_json,
  proposed_snapshot_json, status, requested_by, reviewed_by, review_note,
  applied_entity_id, created_at, reviewed_at
FROM lab_change_requests;

DROP TABLE lab_change_requests;
ALTER TABLE lab_change_requests_new RENAME TO lab_change_requests;
CREATE INDEX idx_lab_change_requests_status_created ON lab_change_requests(status, created_at);
CREATE INDEX idx_lab_change_requests_requester_status ON lab_change_requests(requested_by, status);
CREATE INDEX idx_lab_change_requests_target ON lab_change_requests(entity_type, entity_id, status);
