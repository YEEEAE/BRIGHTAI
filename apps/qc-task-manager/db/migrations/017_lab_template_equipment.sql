-- QC Laboratory Test Template ↔ Equipment link + explicit template_id on
-- test records (PROMPT 10).
--
-- "Equipment compatibility" on a test template is a many-to-many relationship
-- stored by canonical id (mirrors lab_product_equipment from 016). CASCADE on
-- both sides: links are owned outright and equipment retirement is
-- is_archived (never a hard delete), so the CASCADE is a safety net only.
--
-- lab_test_records gains an explicit template_id next to the existing
-- template_version_id: a test created from a template stores BOTH the
-- template identity and the exact version it was created from (versioned
-- templates must never silently point tests at newer versions).

CREATE TABLE IF NOT EXISTS lab_template_equipment (
  template_id INTEGER NOT NULL REFERENCES lab_test_templates(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (template_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_template_equipment_equipment
  ON lab_template_equipment(equipment_id);

ALTER TABLE lab_test_records ADD COLUMN template_id INTEGER REFERENCES lab_test_templates(id) ON DELETE RESTRICT;
