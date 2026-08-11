-- brightai:allow-destructive
-- Rebuild the attachment table to add the explicit AI_PENDING state while
-- preserving every existing metadata field and BLOB.
CREATE TABLE task_attachments_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_hash TEXT,
  file_data BLOB NOT NULL,
  is_evidence INTEGER NOT NULL DEFAULT 0 CHECK (is_evidence IN (0,1)),
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  evidence_type TEXT,
  evidence_label TEXT,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'manual_upload',
  collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  collected_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (verification_status IN ('UNVERIFIED', 'AI_PENDING', 'VALID', 'REJECTED', 'AI_REVIEWED', 'HUMAN_VERIFIED'))
);
INSERT INTO task_attachments_new (id, task_id, uploaded_by, file_name, mime_type, file_size, file_hash, file_data, is_evidence, uploaded_at, evidence_type, evidence_label, description, source, collected_by, collected_at, verification_status)
SELECT id, task_id, uploaded_by, file_name, mime_type, file_size, file_hash, file_data, is_evidence, uploaded_at, evidence_type, evidence_label, description, source, collected_by, collected_at, verification_status FROM task_attachments;
DROP TABLE task_attachments;
ALTER TABLE task_attachments_new RENAME TO task_attachments;
CREATE INDEX IF NOT EXISTS idx_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON task_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_attachments_evidence_type ON task_attachments(evidence_type);
