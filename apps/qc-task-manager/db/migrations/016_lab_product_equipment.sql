-- QC Laboratory Product Master ↔ Equipment link (PROMPT 08).
--
-- "Related Equipment" on the Product Master is a many-to-many relationship
-- stored by canonical id (never equipment names as text). CASCADE on both
-- sides: master rows own their links outright, and equipment retirement is
-- is_archived (never a hard delete), so the CASCADE is a safety net only.

CREATE TABLE IF NOT EXISTS lab_product_equipment (
  product_id INTEGER NOT NULL REFERENCES lab_products(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES lab_equipment(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (product_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_product_equipment_equipment
  ON lab_product_equipment(equipment_id);
