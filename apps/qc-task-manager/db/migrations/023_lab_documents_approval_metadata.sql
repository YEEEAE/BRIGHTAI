-- QC Laboratory document approval date (PROMPT 27, page reference §56).
--
-- lab_documents (013) already carries approver_id, but the matching approval
-- date was never created. The Data Quality module reports "missing approval
-- metadata" for APPROVED documents, so the date column must exist to carry
-- (and verify) that metadata. It is nullable: draft/in-review documents
-- legitimately have none, and historical APPROVED rows simply surface as
-- data-quality findings until an owner records the approval — nothing is
-- backfilled or rewritten.
ALTER TABLE lab_documents ADD COLUMN approved_at TEXT;
