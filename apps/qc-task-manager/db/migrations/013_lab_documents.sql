-- QC Laboratory controlled documents: SOP/WI library (PROMPT 02;
-- docs/QC-LAB-ARCHITECTURE.md §7/§8).
--
-- Document identity is separate from content: lab_documents holds the stable
-- identity (code, title, type, ownership, dates) while lab_document_versions
-- holds immutable numbered versions. Editing an APPROVED document creates a
-- NEW DRAFT version; the approved version never mutates. Approving version N
-- supersedes version N-1. SUPERSEDED/ARCHIVED versions stay readable for
-- historical reference, and approved test records keep document snapshots
-- (migration 012) so they never re-resolve to the current version.
--
-- content_md is the source of truth (Markdown authored in the internal
-- editor); content_html_sanitized is a server-side rendered cache — document
-- content is untrusted input and is sanitized before rendering.
-- current_version_id is added via ALTER TABLE after the versions table
-- exists (same pattern as migration 006 / 011).

CREATE TABLE IF NOT EXISTS lab_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SOP','WI')),
  description TEXT,
  product_id INTEGER REFERENCES lab_products(id) ON DELETE SET NULL,
  owner_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  approver_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED')),
  effective_date TEXT,
  review_due_date TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS lab_document_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES lab_documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  content_md TEXT NOT NULL,
  content_html_sanitized TEXT,
  change_summary TEXT,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','IN_REVIEW','APPROVED','SUPERSEDED','ARCHIVED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (document_id, version)
);

ALTER TABLE lab_documents ADD COLUMN current_version_id INTEGER REFERENCES lab_document_versions(id) ON DELETE SET NULL;

-- Typed links between documents and equipment/products/templates. Relationships
-- are FK-by-id at the referenced tables; this table stores the polymorphic
-- edge with a CHECKed entity_type (the app layer validates entity_id against
-- the referenced table).
CREATE TABLE IF NOT EXISTS lab_document_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL REFERENCES lab_documents(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EQUIPMENT','PRODUCT','TEMPLATE')),
  entity_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Version-specific acknowledgement: one row per (document_version, user).
CREATE TABLE IF NOT EXISTS lab_document_acknowledgements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_version_id INTEGER NOT NULL REFERENCES lab_document_versions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
  acknowledged_at TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACKNOWLEDGED')),
  UNIQUE (document_version_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_documents_code ON lab_documents(code);
CREATE INDEX IF NOT EXISTS idx_lab_documents_type_status ON lab_documents(type, status);
CREATE INDEX IF NOT EXISTS idx_lab_documents_review_due ON lab_documents(review_due_date);
CREATE INDEX IF NOT EXISTS idx_lab_doc_versions_document ON lab_document_versions(document_id, version);
CREATE INDEX IF NOT EXISTS idx_lab_doc_links_document ON lab_document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_links_entity ON lab_document_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_version ON lab_document_acknowledgements(document_version_id);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_user ON lab_document_acknowledgements(user_id);
