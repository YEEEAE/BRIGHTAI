-- 026_lab_test_environment_readings.sql — session environmental readings log
-- (PROMPT 51).
--
-- The printed form captures Temperature (Measured) once
-- (lab_test_records.temperature_measured). This migration adds an OPTIONAL,
-- SUPPLEMENTARY per-test readings log WITHOUT changing that headline field's
-- meaning: each row records one timestamped environmental observation taken
-- during the session — timestamp + temperature, with optional humidity and a
-- free-text note. Only fields the form already implies; no scientific
-- requirement is invented anywhere.
--
-- Snapshot-safe by structure: rows belong to the parent test (FK RESTRICT)
-- and are frozen once the test reaches APPROVED or VOID — any UPDATE or DELETE
-- aborts (the same structural freeze migration 020 applies to sample rows).
-- Draft-stage saves replace the draft's rows wholesale through the service
-- layer (src/lib/lab/tests.ts), and every modification lands on the shared
-- qc_audit_log as part of the LAB_TEST/UPDATE diff — never a second audit
-- system.

CREATE TABLE IF NOT EXISTS lab_test_environment_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id INTEGER NOT NULL REFERENCES lab_test_records(id) ON DELETE RESTRICT,
  reading_at TEXT NOT NULL,
  temperature TEXT NOT NULL,
  humidity TEXT,
  notes TEXT,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_lab_test_env_readings_test ON lab_test_environment_readings(test_id);

CREATE TRIGGER IF NOT EXISTS lab_env_reading_frozen_after_approval_update
BEFORE UPDATE ON lab_test_environment_readings
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_environment_readings rows are frozen after test approval');
END;

CREATE TRIGGER IF NOT EXISTS lab_env_reading_frozen_after_approval_delete
BEFORE DELETE ON lab_test_environment_readings
WHEN EXISTS (SELECT 1 FROM lab_test_records t
             WHERE t.id = OLD.test_id AND t.status IN ('APPROVED','VOID'))
BEGIN
  SELECT RAISE(ABORT, 'lab_test_environment_readings rows are frozen after test approval');
END;
