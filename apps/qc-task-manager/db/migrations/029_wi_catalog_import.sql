-- QC-LAB-WI-CATALOG-007
-- Paper index metadata only. This migration adds source provenance fields;
-- the post-migration importer inserts the 33 controlled catalog identities
-- after legitimate users have been seeded. No content, versions, or audit
-- actors are created from the paper index.
ALTER TABLE lab_documents ADD COLUMN source_revision INTEGER NULL;
ALTER TABLE lab_documents ADD COLUMN source_date TEXT NULL;
ALTER TABLE lab_documents ADD COLUMN source_register_code TEXT NULL;
ALTER TABLE lab_documents ADD COLUMN source_class TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_lab_documents_source_register
  ON lab_documents(source_register_code, type, source_revision);
