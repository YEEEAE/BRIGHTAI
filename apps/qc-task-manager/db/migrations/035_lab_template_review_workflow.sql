-- QC-LAB-TEMPLATE-WORKFLOW-V2-016
-- Migration 034 is already deployed for template submission policy; this is
-- the next sequential, row-preserving migration for the review lifecycle.

ALTER TABLE lab_test_template_versions ADD COLUMN status TEXT NOT NULL DEFAULT 'DRAFT'
  CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SUPERSEDED'));
ALTER TABLE lab_test_template_versions ADD COLUMN submitted_by INTEGER REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE lab_test_template_versions ADD COLUMN submitted_at TEXT;
ALTER TABLE lab_test_template_versions ADD COLUMN reviewed_by INTEGER REFERENCES users(id) ON DELETE RESTRICT;
ALTER TABLE lab_test_template_versions ADD COLUMN reviewed_at TEXT;
ALTER TABLE lab_test_template_versions ADD COLUMN approved_at TEXT;

UPDATE lab_test_template_versions
SET status = CASE WHEN approved_by IS NOT NULL THEN 'APPROVED' ELSE 'DRAFT' END;
