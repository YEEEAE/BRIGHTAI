-- QC Laboratory Test Register index coverage (PROMPT 06, /lab/tests).
--
-- Migration 012 already indexes the register's equality-filter columns
-- (status, test_type, product_id, equipment_id, tested_by, created_at,
-- final_result). The register also filters and searches by Lot Number and
-- Sampling Area — add B-tree indexes for those two TEXT columns so the
-- filtered/sorted register stays backed by an index on every supported
-- search/filter field ("indexed fields" requirement of the Tests page).
--
-- Additive only: CREATE INDEX IF NOT EXISTS, no data change, no table change.
-- An index on a TEXT column also accelerates prefix (LIKE 'x%') matching.

CREATE INDEX IF NOT EXISTS idx_lab_tests_lot ON lab_test_records(lot_number);
CREATE INDEX IF NOT EXISTS idx_lab_tests_sampling_area ON lab_test_records(sampling_area);