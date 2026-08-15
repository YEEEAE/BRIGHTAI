-- QC Laboratory test ↔ QC Finding traceability links (PROMPT 20 —
-- Investigation / NCR / CAPA hooks).
--
-- This links a laboratory test to an EXISTING QC Finding — the NCR-like
-- entity owned by the QC Operations domain (qc_findings, migration 004). It
-- is deliberately NOT a second quality-management workflow: findings, RCA,
-- CAPA and their state machines remain owned by src/lib/qc-operations.ts and
-- the findings/capa domain rules. CAPA is reached transitively through the
-- finding's own 1:1 qc_capa row (Test → Finding → CAPA). There is no
-- investigation entity in the system, so only finding links are modelled.
--
-- RESTRICT on both sides: a finding that a lab test references cannot be
-- deleted, and a test record carrying a finding link cannot be deleted
-- either — quality traceability survives. Every link/unlink writes a
-- LAB_TEST/LINK or LAB_TEST/UNLINK row in the shared qc_audit_log (never a
-- second audit system).

CREATE TABLE IF NOT EXISTS lab_test_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE RESTRICT,
  finding_id INTEGER NOT NULL REFERENCES qc_findings(id) ON DELETE RESTRICT,
  note TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (test_id, finding_id)
);

CREATE INDEX IF NOT EXISTS idx_lab_test_findings_test ON lab_test_findings(test_id);
CREATE INDEX IF NOT EXISTS idx_lab_test_findings_finding ON lab_test_findings(finding_id);