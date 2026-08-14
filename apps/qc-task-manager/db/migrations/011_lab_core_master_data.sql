-- brightai:allow-destructive
-- QC Laboratory core master data (PROMPT 02; docs/QC-LAB-ARCHITECTURE.md §8).
--
-- Part 1 rebuilds qc_audit_log with extended CHECK constraints so laboratory
-- entities and actions fit the SAME audit system (no parallel lab audit log).
-- The rebuild is row-preserving: every existing row is copied verbatim, then
-- the old table is dropped and the new one renamed. The destructive marker
-- above makes the migration engine take an automatic VACUUM INTO backup
-- before applying this file.
--
-- Part 2 creates the laboratory master-data tables (products, equipment,
-- maintenance, calibration, test templates and template versions). Test
-- records (012) and controlled documents (013) depend on these.
--
-- FK policy follows db/schema.sql: CASCADE for owned child rows, RESTRICT for
-- audit-critical actor references, SET NULL for optional references.
-- applicable_sop_id/applicable_wi_id/sop_id/wi_id forward-reference
-- lab_documents, created by migration 013 in the same startup — SQLite
-- resolves FK targets at DML time, and both migrations apply before any data.

-- ── Part 1: qc_audit_log CHECK extension (guarded, row-preserving rebuild) ──
CREATE TABLE qc_audit_log_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('FINDING','RCA','CAPA','EVIDENCE','LAB_TEST','LAB_RETEST','LAB_PRODUCT','LAB_TEMPLATE','LAB_EQUIPMENT','LAB_EQUIPMENT_MAINTENANCE','LAB_EQUIPMENT_CALIBRATION','LAB_DOCUMENT','LAB_DOCUMENT_VERSION')),
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
  SELECT id, entity_type, entity_id, task_id, actor_id, action, old_value, new_value, note, created_at
  FROM qc_audit_log;
DROP TABLE qc_audit_log;
ALTER TABLE qc_audit_log_new RENAME TO qc_audit_log;
CREATE INDEX IF NOT EXISTS idx_qc_audit_entity ON qc_audit_log(entity_type,entity_id,created_at);

-- ── Part 2: laboratory master data ──

-- Test template identity (AIR/VACUUM). Versioned content lives in
-- lab_test_template_versions; current_version_id is added below after that
-- table exists. Template code is stable across versions.
CREATE TABLE IF NOT EXISTS lab_test_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  test_type TEXT NOT NULL CHECK (test_type IN ('air','vacuum')),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','ACTIVE','ARCHIVED')),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Equipment registry. status_raw stores the supplied business value VERBATIM
-- (mixed/multilingual statuses included); the UI maps it for display/filtering
-- only — no data normalization (Open Decision D-1). serial_number is nullable
-- for genuinely missing legacy data. Retirement is is_archived, never a
-- hard delete (test records RESTRICT on equipment_id).
CREATE TABLE IF NOT EXISTS lab_equipment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  location TEXT,
  status_raw TEXT NOT NULL,
  serial_number TEXT,
  notes TEXT,
  is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Append-only maintenance history (no fabricated events, no edits).
CREATE TABLE IF NOT EXISTS lab_equipment_maintenance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  maintenance_date TEXT,
  issue TEXT,
  maintenance_type TEXT,
  description TEXT,
  technician_vendor TEXT,
  status TEXT,
  completed_date TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Calibration records are historical entries. The register's UI state
-- (Compliant / Due Soon / Due Today / Overdue / Not Compliant / Unknown) is
-- DERIVED at read time from the dates — never stored as a second enum.
CREATE TABLE IF NOT EXISTS lab_equipment_calibration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  last_calibrated_at TEXT,
  calibration_due_at TEXT,
  provider TEXT,
  certificate_reference TEXT,
  result TEXT,
  next_due_at TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Product Master. Tests reference products by id; approved tests additionally
-- keep a product_snapshot_json copy (written at approval time).
CREATE TABLE IF NOT EXISTS lab_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  connector_type TEXT,
  default_test_type TEXT CHECK (default_test_type IN ('air','vacuum')),
  default_template_id INTEGER REFERENCES lab_test_templates(id) ON DELETE SET NULL,
  applicable_sop_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  applicable_wi_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Versioned template content. parameters_json holds the reference display
-- values (standard parameter / acceptance criteria / holding time) that a
-- test record snapshots at approval. Approved versions are immutable
-- (enforced by the service layer; versioning never mutates in place).
CREATE TABLE IF NOT EXISTS lab_test_template_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL REFERENCES lab_test_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  default_sample_count INTEGER CHECK (default_sample_count IS NULL OR default_sample_count > 0),
  parameters_json TEXT NOT NULL DEFAULT '{}',
  connector_choices_json TEXT,
  applicable_product_id INTEGER REFERENCES lab_products(id) ON DELETE SET NULL,
  applicable_equipment_id INTEGER REFERENCES lab_equipment(id) ON DELETE SET NULL,
  sop_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  wi_id INTEGER REFERENCES lab_documents(id) ON DELETE SET NULL,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (template_id, version)
);

ALTER TABLE lab_test_templates ADD COLUMN current_version_id INTEGER REFERENCES lab_test_template_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lab_products_code ON lab_products(code);
CREATE INDEX IF NOT EXISTS idx_lab_products_active ON lab_products(is_active);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_code ON lab_equipment(code);
CREATE INDEX IF NOT EXISTS idx_lab_equipment_archived ON lab_equipment(is_archived);
CREATE INDEX IF NOT EXISTS idx_lab_equip_maint_equipment ON lab_equipment_maintenance(equipment_id, maintenance_date);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_equipment ON lab_equipment_calibration(equipment_id, calibration_due_at);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_due ON lab_equipment_calibration(calibration_due_at);
CREATE INDEX IF NOT EXISTS idx_lab_templates_code ON lab_test_templates(code);
CREATE INDEX IF NOT EXISTS idx_lab_template_versions_template ON lab_test_template_versions(template_id, version);
