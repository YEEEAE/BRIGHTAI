-- QC Laboratory retests — original-test snapshot at retest creation (§46–§47).
--
-- The retest register must preserve WHY the retest exists even if the
-- original record is later voided or its workflow state changes: the original
-- result and original final status are frozen as columns on the retest row at
-- creation time, inside the retest transaction. The original test row itself
-- is NEVER modified by a retest (ON DELETE RESTRICT, D-5).
ALTER TABLE lab_test_retests ADD COLUMN original_result TEXT;
ALTER TABLE lab_test_retests ADD COLUMN original_status TEXT;
