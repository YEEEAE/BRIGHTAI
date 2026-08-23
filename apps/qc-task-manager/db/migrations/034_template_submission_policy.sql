-- QC-LAB-FORM-UX-INTEGRITY-015 — opt-in submission policy per approved template.
-- Default 0 preserves the existing optional-template behavior for every template.
ALTER TABLE lab_test_template_versions ADD COLUMN requires_approved_template_for_submission INTEGER NOT NULL DEFAULT 0 CHECK (requires_approved_template_for_submission IN (0,1));
