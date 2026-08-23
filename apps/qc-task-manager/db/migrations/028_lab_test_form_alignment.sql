-- QC-LAB-FR-MA-018-ALIGNMENT-005 — additive paper-form alignment.
-- Measurements stay TEXT and legacy columns remain untouched.
ALTER TABLE lab_test_records ADD COLUMN testing_date TEXT NULL;
ALTER TABLE lab_test_records ADD COLUMN actual_force TEXT NULL;
ALTER TABLE lab_test_records ADD COLUMN torque_value TEXT NULL;
ALTER TABLE lab_test_records ADD COLUMN humidity_measured TEXT NULL;

ALTER TABLE lab_test_samples ADD COLUMN applied_pressure TEXT NULL;
ALTER TABLE lab_test_samples ADD COLUMN volume_liter TEXT NULL;

ALTER TABLE lab_test_template_versions ADD COLUMN effective_date TEXT NULL;
