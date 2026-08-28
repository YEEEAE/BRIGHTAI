// Embedded migration registry — the single source of truth for the SQL that
// ships inside the production bundle. When the deployed server entry has no
// db/migrations directory next to it, the migration runner falls back to this
// registry, so it must mirror the repository files exactly.
//
// CONTRACT (guarded by scripts/test-embedded-migration-parity.mjs):
//   1. Every entry imports its migration file with `?raw` — NEVER inline a
//      source string. `?raw` inlines the exact file bytes at build time, so
//      the bundle stays byte-for-byte identical to db/migrations/.
//   2. `file` is the exact repository filename; its numeric prefix is the
//      sequential version and its suffix is the recorded name. Reserved slots
//      (e.g. 031_reserved.sql) keep the history contiguous without changing
//      any applied migration.
//   3. Applied migrations are immutable — edit nothing here in a way that
//      changes a checksum; the runner's drift guard rejects mismatched
//      databases at boot.
//
// Data-only and side-effect-free: tests import this module without opening a
// database connection. The exports are frozen so no runtime code can mutate
// the history between readMigrations() calls.

import initialMigrationSql from '../../db/migrations/001_initial.sql?raw';
import legacyMigrationSql from '../../db/migrations/002_legacy_schema_reconciliation.sql?raw';
import slaMigrationSql from '../../db/migrations/003_sla_engine.sql?raw';
import qcOperationsMigrationSql from '../../db/migrations/004_qc_operations.sql?raw';
import evidenceTemplatesMigrationSql from '../../db/migrations/005_evidence_templates.sql?raw';
import workflowMigrationSql from '../../db/migrations/006_workflow_engine.sql?raw';
import dashboardReportsMigrationSql from '../../db/migrations/007_dashboard_reports.sql?raw';
import auditIntegrityMigrationSql from '../../db/migrations/008_audit_integrity.sql?raw';
import aiAuditMigrationSql from '../../db/migrations/009_ai_audit.sql?raw';
import aiEvidenceStatusMigrationSql from '../../db/migrations/010_ai_evidence_status.sql?raw';
import labCoreMasterDataMigrationSql from '../../db/migrations/011_lab_core_master_data.sql?raw';
import labTestsMigrationSql from '../../db/migrations/012_lab_tests.sql?raw';
import labDocumentsMigrationSql from '../../db/migrations/013_lab_documents.sql?raw';
import labViewsMigrationSql from '../../db/migrations/014_lab_views.sql?raw';
import labTestsRegisterIndexesSql from '../../db/migrations/015_lab_tests_register_indexes.sql?raw';
import labProductEquipmentSql from '../../db/migrations/016_lab_product_equipment.sql?raw';
import labTemplateEquipmentSql from '../../db/migrations/017_lab_template_equipment.sql?raw';
import labEquipmentCalibrationStatusSql from '../../db/migrations/018_lab_equipment_calibration_status.sql?raw';
import labRetestOriginalSnapshotSql from '../../db/migrations/019_lab_retest_original_snapshot.sql?raw';
import labSampleStatusSql from '../../db/migrations/020_lab_sample_status.sql?raw';
import labTestFindingsSql from '../../db/migrations/021_lab_test_findings.sql?raw';
import notificationsEntityHrefSql from '../../db/migrations/022_notifications_entity_href.sql?raw';
import labDocumentsApprovalMetadataSql from '../../db/migrations/023_lab_documents_approval_metadata.sql?raw';
import labRegisterPerformanceIndexesSql from '../../db/migrations/024_lab_register_performance_indexes.sql?raw';
import notificationDedupeKeySql from '../../db/migrations/025_notification_dedupe_key.sql?raw';
import labTestEnvironmentReadingsSql from '../../db/migrations/026_lab_test_environment_readings.sql?raw';
import labChangeRequestsSql from '../../db/migrations/027_lab_change_requests.sql?raw';
import labTestFormAlignmentSql from '../../db/migrations/028_lab_test_form_alignment.sql?raw';
import wiCatalogMigrationSql from '../../db/migrations/029_wi_catalog_import.sql?raw';
import auditDurabilityMigrationSql from '../../db/migrations/030_audit_durability.sql?raw';
import reservedMigrationSql from '../../db/migrations/031_reserved.sql?raw';
import qcAuditTaskIdentityMigrationSql from '../../db/migrations/032_qc_audit_task_identity.sql?raw';
import wiProvenanceMigrationSql from '../../db/migrations/033_wi_provenance.sql?raw';
import templateSubmissionPolicyMigrationSql from '../../db/migrations/034_template_submission_policy.sql?raw';
import labTemplateReviewWorkflowMigrationSql from '../../db/migrations/035_lab_template_review_workflow.sql?raw';
import passwordLifecycleMigrationSql from '../../db/migrations/036_password_lifecycle.sql?raw';
import userAuditLogMigrationSql from '../../db/migrations/037_user_audit_log.sql?raw';
import labChangeRequestWithdrawalSql from '../../db/migrations/038_lab_change_request_withdrawal.sql?raw';

export interface EmbeddedMigration {
  readonly file: string;
  readonly source: string;
}

export const EMBEDDED_MIGRATIONS: readonly EmbeddedMigration[] = Object.freeze([
  Object.freeze({ file: '001_initial.sql', source: initialMigrationSql }),
  Object.freeze({ file: '002_legacy_schema_reconciliation.sql', source: legacyMigrationSql }),
  Object.freeze({ file: '003_sla_engine.sql', source: slaMigrationSql }),
  Object.freeze({ file: '004_qc_operations.sql', source: qcOperationsMigrationSql }),
  Object.freeze({ file: '005_evidence_templates.sql', source: evidenceTemplatesMigrationSql }),
  Object.freeze({ file: '006_workflow_engine.sql', source: workflowMigrationSql }),
  Object.freeze({ file: '007_dashboard_reports.sql', source: dashboardReportsMigrationSql }),
  Object.freeze({ file: '008_audit_integrity.sql', source: auditIntegrityMigrationSql }),
  Object.freeze({ file: '009_ai_audit.sql', source: aiAuditMigrationSql }),
  Object.freeze({ file: '010_ai_evidence_status.sql', source: aiEvidenceStatusMigrationSql }),
  Object.freeze({ file: '011_lab_core_master_data.sql', source: labCoreMasterDataMigrationSql }),
  Object.freeze({ file: '012_lab_tests.sql', source: labTestsMigrationSql }),
  Object.freeze({ file: '013_lab_documents.sql', source: labDocumentsMigrationSql }),
  Object.freeze({ file: '014_lab_views.sql', source: labViewsMigrationSql }),
  Object.freeze({ file: '015_lab_tests_register_indexes.sql', source: labTestsRegisterIndexesSql }),
  Object.freeze({ file: '016_lab_product_equipment.sql', source: labProductEquipmentSql }),
  Object.freeze({ file: '017_lab_template_equipment.sql', source: labTemplateEquipmentSql }),
  Object.freeze({ file: '018_lab_equipment_calibration_status.sql', source: labEquipmentCalibrationStatusSql }),
  Object.freeze({ file: '019_lab_retest_original_snapshot.sql', source: labRetestOriginalSnapshotSql }),
  Object.freeze({ file: '020_lab_sample_status.sql', source: labSampleStatusSql }),
  Object.freeze({ file: '021_lab_test_findings.sql', source: labTestFindingsSql }),
  Object.freeze({ file: '022_notifications_entity_href.sql', source: notificationsEntityHrefSql }),
  Object.freeze({ file: '023_lab_documents_approval_metadata.sql', source: labDocumentsApprovalMetadataSql }),
  Object.freeze({ file: '024_lab_register_performance_indexes.sql', source: labRegisterPerformanceIndexesSql }),
  Object.freeze({ file: '025_notification_dedupe_key.sql', source: notificationDedupeKeySql }),
  Object.freeze({ file: '026_lab_test_environment_readings.sql', source: labTestEnvironmentReadingsSql }),
  Object.freeze({ file: '027_lab_change_requests.sql', source: labChangeRequestsSql }),
  Object.freeze({ file: '028_lab_test_form_alignment.sql', source: labTestFormAlignmentSql }),
  Object.freeze({ file: '029_wi_catalog_import.sql', source: wiCatalogMigrationSql }),
  Object.freeze({ file: '030_audit_durability.sql', source: auditDurabilityMigrationSql }),
  Object.freeze({ file: '031_reserved.sql', source: reservedMigrationSql }),
  Object.freeze({ file: '032_qc_audit_task_identity.sql', source: qcAuditTaskIdentityMigrationSql }),
  Object.freeze({ file: '033_wi_provenance.sql', source: wiProvenanceMigrationSql }),
  Object.freeze({ file: '034_template_submission_policy.sql', source: templateSubmissionPolicyMigrationSql }),
  Object.freeze({ file: '035_lab_template_review_workflow.sql', source: labTemplateReviewWorkflowMigrationSql }),
  Object.freeze({ file: '036_password_lifecycle.sql', source: passwordLifecycleMigrationSql }),
  Object.freeze({ file: '037_user_audit_log.sql', source: userAuditLogMigrationSql }),
  Object.freeze({ file: '038_lab_change_request_withdrawal.sql', source: labChangeRequestWithdrawalSql }),
]);
