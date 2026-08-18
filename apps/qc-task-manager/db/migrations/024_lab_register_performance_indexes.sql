-- QC Laboratory register/summary performance indexes (SQL audit).
--
-- Closes the remaining full-scan and temp-sort hot paths in the lab modules
-- that migrations 012/015 did not cover. Every index backs at least one query
-- path confirmed in src/lib/lab (register lists, dashboard/overview feeds,
-- template drill-down counts, retest and acknowledgement filters):
--
--   lab_test_records
--     - updated_at            default register sort (updated_at DESC) + the
--                             recent-tests feed on /lab overview
--     - created_by            employee scope (tested_by = ? OR created_by = ?)
--     - template_id           template drill-down COUNT per row (LIST_SELECT)
--                             + register template filter
--     - template_version_id   per-version test COUNT in template detail
--   lab_test_retests
--     - status                dashboard status counts + open-retests feed
--     - updated_at            open-retests ORDER BY updated_at DESC + sort
--   lab_equipment_calibration
--     - (equipment_id, created_at)  per-equipment "latest calibration" top-1
--                             lookup (ORDER BY created_at DESC LIMIT 1) that
--                             runs for every equipment row on overview loads
--   lab_document_acknowledgements
--     - status                dashboard pending count + register filter
--     - assigned_at           default register sort
--   lab_documents
--     - owner_id              owner filter + owner dropdown
--     - product_id            product filter + product dropdown
--     - updated_at            default register sort
--
-- Deliberately NOT indexed (reasons for the audit record):
--   - default updated_at sorts on the tiny master-data tables (lab_equipment,
--     lab_products, lab_test_templates) — sub-100-row tables where a temp sort
--     is cheaper than index maintenance on every edit.
--   - qc_audit_log — append-heavy timeline already served by the existing
--     entity index; no filter column query is hot enough to justify write cost.
--   - COLLATE NOCASE code-uniqueness lookups and date()/LEFT JOIN query-level
--     issues are not fixable with an index and are out of scope.
--
-- Additive only: CREATE INDEX IF NOT EXISTS, no data change, no table change.

CREATE INDEX IF NOT EXISTS idx_lab_tests_updated_at ON lab_test_records(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_tests_created_by ON lab_test_records(created_by);
CREATE INDEX IF NOT EXISTS idx_lab_tests_template ON lab_test_records(template_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_template_version ON lab_test_records(template_version_id);
CREATE INDEX IF NOT EXISTS idx_lab_retests_status ON lab_test_retests(status);
CREATE INDEX IF NOT EXISTS idx_lab_retests_updated_at ON lab_test_retests(updated_at);
CREATE INDEX IF NOT EXISTS idx_lab_equip_cal_equipment_created ON lab_equipment_calibration(equipment_id, created_at);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_status ON lab_document_acknowledgements(status);
CREATE INDEX IF NOT EXISTS idx_lab_doc_ack_assigned_at ON lab_document_acknowledgements(assigned_at);
CREATE INDEX IF NOT EXISTS idx_lab_documents_owner ON lab_documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_product ON lab_documents(product_id);
CREATE INDEX IF NOT EXISTS idx_lab_documents_updated_at ON lab_documents(updated_at);