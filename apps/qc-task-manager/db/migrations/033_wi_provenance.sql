-- QC-WI-PROVENANCE-014
-- SQLite requires a table rebuild to make created_by nullable safely.
-- brightai:allow-destructive safe row-preserving rebuild
-- brightai:foreign-keys-off required while replacing a referenced parent table
CREATE TABLE lab_documents_033_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SOP','WI')),
  description TEXT,
  product_id INTEGER REFERENCES lab_products(id) ON DELETE SET NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  approver_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  current_version_id INTEGER REFERENCES lab_document_versions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED')),
  effective_date TEXT,
  review_due_date TEXT,
  approved_at TEXT,
  source_revision INTEGER,
  source_date TEXT,
  source_register_code TEXT,
  source_class TEXT,
  creation_origin TEXT NOT NULL DEFAULT 'USER' CHECK (creation_origin IN ('USER','SOURCE_IMPORT')),
  source_page INTEGER,
  source_row_no INTEGER,
  imported_at TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

WITH source_rows AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS source_row_no
  FROM lab_documents
  WHERE source_register_code = 'F-4-2-1-2'
    AND type = 'WI' AND status = 'DRAFT'
    AND current_version_id IS NULL AND owner_id IS NULL
)
INSERT INTO lab_documents_033_new (
  id, code, title, type, description, product_id, owner_id, reviewer_id,
  approver_id, current_version_id, status, effective_date, review_due_date,
  approved_at, source_revision, source_date, source_register_code, source_class,
  creation_origin, source_page, source_row_no, imported_at, created_by,
  created_at, updated_at
)
SELECT d.id, d.code, d.title, d.type, d.description, d.product_id, d.owner_id,
       d.reviewer_id, d.approver_id, d.current_version_id, d.status,
       d.effective_date, d.review_due_date, d.approved_at, d.source_revision,
       d.source_date, d.source_register_code, d.source_class,
       CASE WHEN s.id IS NOT NULL THEN 'SOURCE_IMPORT' ELSE 'USER' END,
       CASE WHEN s.id IS NOT NULL THEN 1 ELSE NULL END, s.source_row_no,
       CASE WHEN s.id IS NOT NULL THEN COALESCE(d.created_at, datetime('now')) ELSE NULL END,
       CASE WHEN s.id IS NOT NULL THEN NULL ELSE d.created_by END,
       d.created_at, d.updated_at
FROM lab_documents d
LEFT JOIN source_rows s ON s.id = d.id;

DROP TABLE lab_documents;
ALTER TABLE lab_documents_033_new RENAME TO lab_documents;

CREATE INDEX IF NOT EXISTS idx_lab_documents_code ON lab_documents(code);
CREATE INDEX IF NOT EXISTS idx_lab_documents_type_status ON lab_documents(type, status);
CREATE INDEX IF NOT EXISTS idx_lab_documents_review_due ON lab_documents(review_due_date);
CREATE INDEX IF NOT EXISTS idx_lab_documents_owner ON lab_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_product ON lab_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_updated_at ON lab_documents(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_documents_source_register ON lab_documents(source_register_code, type, source_revision);
