-- 020_lab_sample_status.sql — per-sample traceability status + structural freeze.
--
-- Each lab_test_samples row already carries its stable identifier
-- (LAB-TEST-%05d-SNN), sample_no, part_name and result. This migration adds a
-- per-sample `status` lifecycle column (PENDING → TESTED → APPROVED, VOID when
-- the test is voided) and enforces sample stability STRUCTURALLY:
--
--   1. sample_identifier can never change (BEFORE UPDATE trigger) — identifiers
--      are deterministic from test_number + sample_no and stay stable forever,
--      not just after approval.
--   2. Once the parent test is APPROVED (or VOID) the sample rows are frozen:
--      any UPDATE or DELETE aborts. Approval-time code writes the APPROVED
--      sample status BEFORE flipping the record status, inside the same
--      transaction, so the freeze can never block the approval itself.
--
-- The test record itself is NOT duplicated — samples keep referencing the
-- single canonical lab_test_records row.

ALTER TABLE lab_test_samples ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING'
  CHECK (status IN ('PENDING','TESTED','APPROVED','VOID'));

-- Backfill existing rows from the stored record/sample state (no invention).
UPDATE lab_test_samples
SET status = CASE
  WHEN EXISTS (SELECT 1 FROM lab_test_records t
               WHERE t.id = lab_test_samples.test_id AND t.status = 'APPROVED') THEN 'APPROVED'
  WHEN EXISTS (SELECT 1 FROM lab_test_records t
               WHERE t.id = lab_test_samples.test_id AND t.status = 'VOID') THEN 'VOID'
  WHEN result IS NOT NULL THEN 'TESTED'
  ELSE 'PENDING'
END;

-- Identifiers are immutable — before AND after approval.
CREATE TRIGGER IF NOT EXISTS lab_sample_identifier_immutable
BEFORE UPDATE ON lab_test_samples
WHEN OLD.sample_identifier IS NOT NEW.sample_identifier
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples.sample_identifier is immutable');
END;

-- Approved/voided tests: sample rows are frozen entirely.
CREATE TRIGGER IF NOT EXISTS lab_sample_frozen_after_approval_update
BEFORE UPDATE ON lab_test_samples
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples rows are frozen after test approval');
END;

CREATE TRIGGER IF NOT EXISTS lab_sample_frozen_after_approval_delete
BEFORE DELETE ON lab_test_samples
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_samples rows are frozen after test approval');
END;
