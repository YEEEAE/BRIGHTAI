# FILE-COVERAGE — QC-POST-IMPLEMENTATION-MASTER-AUDIT-022

Baseline: HEAD `b51504b7ae4e0b8a424a23c6190a43de9a0d2670` (branch `main`) · audit date 2026-08-28.

Review method (honest classification, not per-file human reading for every row):
- **TEST/TOOL + E2E** files: verified via filesystem-vs-registry reconciliation (test-manifest-guard: 60 canonical + 28 E2E, 0 orphans) and execution of the canonical chain.
- **MIGRATION** files: executed on a disposable DB (38/38, checksum MATCH, integrity/FK/parity PASS).
- **SERVICE/API/PAGE/COMPONENT**: directory-level forensic review via 3 parallel audit agents + full canonical test chain (60/60 suites, exit 0) + route-manifest + static scans.
- **DOC/CONFIG/ASSET**: read/reviewed directly.

Statuses: CLEAN · ISSUE (finding ID attached) · REQUIRES-RUNTIME-EVIDENCE (not executable this audit: live deployment, or E2E suites blocked by gate abort P1-001).

| File | Category | Purpose | Reviewed | Status | Finding IDs | Related Tests |
|---|---|---|---|---|---|---|
| `.env.example` | CONFIG | .env.example module | ✅ | CLEAN | — | — |
| `.github/workflows/qc-release-gate.yml` | CI | QC Release Gate workflow | ✅ | CLEAN | — | — |
| `.gitignore` | CONFIG | .gitignore module | ✅ | CLEAN | — | — |
| `astro.config.mjs` | CONFIG | astro.config module | ✅ | CLEAN | — | — |
| `db/migrations/001_initial.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/002_legacy_schema_reconciliation.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/003_sla_engine.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/004_qc_operations.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/005_evidence_templates.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/006_workflow_engine.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/007_dashboard_reports.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/008_audit_integrity.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/009_ai_audit.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/010_ai_evidence_status.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/011_lab_core_master_data.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/012_lab_tests.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/013_lab_documents.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/014_lab_views.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/015_lab_tests_register_indexes.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/016_lab_product_equipment.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/017_lab_template_equipment.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/018_lab_equipment_calibration_status.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/019_lab_retest_original_snapshot.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/020_lab_sample_status.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/021_lab_test_findings.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/022_notifications_entity_href.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/023_lab_documents_approval_metadata.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/024_lab_register_performance_indexes.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/025_notification_dedupe_key.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/026_lab_test_environment_readings.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/027_lab_change_requests.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/028_lab_test_form_alignment.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/029_wi_catalog_import.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/030_audit_durability.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/031_reserved.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/032_qc_audit_task_identity.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/033_wi_provenance.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/034_template_submission_policy.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/035_lab_template_review_workflow.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/036_password_lifecycle.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/037_user_audit_log.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/migrations/038_lab_change_request_withdrawal.sql` | MIGRATION | Schema migration | ✅ | CLEAN | — | test:migrations, test:embedded-migration-parity |
| `db/schema.sql` | SCHEMA | schema module | ✅ | ISSUE | P2-008 | — |
| `db/seed.sql` | SCHEMA | seed module | ✅ | CLEAN | — | — |
| `docs/ACCEPTANCE-CHECKLIST.md` | DOC | ACCEPTANCE-CHECKLIST module | ✅ | CLEAN | — | — |
| `docs/AI-SAFE-LAUNCH.md` | DOC | AI-SAFE-LAUNCH module | ✅ | CLEAN | — | — |
| `docs/ARCHITECTURE.md` | DOC | ARCHITECTURE module | ✅ | CLEAN | — | — |
| `docs/DATABASE.md` | DOC | DATABASE module | ✅ | CLEAN | — | — |
| `docs/DEPLOYMENT.md` | DOC | DEPLOYMENT module | ✅ | REQUIRES-RUNTIME-EVIDENCE | — | — |
| `docs/FINAL-PILOT-READINESS.md` | DOC | FINAL-PILOT-READINESS module | ✅ | CLEAN | — | — |
| `docs/MIGRATIONS.md` | DOC | MIGRATIONS module | ✅ | CLEAN | — | — |
| `docs/PILOT-IMPLEMENTATION-STATUS.md` | DOC | PILOT-IMPLEMENTATION-STATUS module | ✅ | CLEAN | — | — |
| `docs/PILOT-UAT.md` | DOC | PILOT-UAT module | ✅ | CLEAN | — | — |
| `docs/QC-LAB-ARCHITECTURE.md` | DOC | QC-LAB-ARCHITECTURE module | ✅ | CLEAN | — | — |
| `docs/REPOSITORY-AUDIT.md` | DOC | REPOSITORY-AUDIT module | ✅ | CLEAN | — | — |
| `docs/RESTORE.md` | DOC | RESTORE module | ✅ | CLEAN | — | — |
| `docs/ROLES-AND-PERMISSIONS.md` | DOC | ROLES-AND-PERMISSIONS module | ✅ | CLEAN | — | — |
| `docs/SQLTOOLS.md` | DOC | SQLTOOLS module | ✅ | CLEAN | — | — |
| `docs/superpowers/plans/2026-08-28-qc-lab-management-ux-012.md` | DOC | 2026-08-28-qc-lab-management-ux-012 module | ✅ | CLEAN | — | — |
| `docs/superpowers/specs/2026-08-28-qc-lab-management-ux-012-design.md` | DOC | 2026-08-28-qc-lab-management-ux-012-design module | ✅ | CLEAN | — | — |
| `docs/TESTING.md` | DOC | TESTING module | ✅ | CLEAN | — | — |
| `docs/UI-DESIGN-SYSTEM.md` | DOC | UI-DESIGN-SYSTEM module | ✅ | ISSUE | P3-017 | — |
| `docs/UI-UX-PRODUCT-AUDIT.md` | DOC | UI-UX-PRODUCT-AUDIT module | ✅ | CLEAN | — | — |
| `package.json` | CONFIG | package.json module | ✅ | CLEAN | — | — |
| `public/.gitkeep` | ASSET | .gitkeep module | ✅ | CLEAN | — | — |
| `public/scripts/esign-confirm.js` | ASSET | esign-confirm module | ✅ | CLEAN | — | — |
| `public/scripts/form-productivity.js` | ASSET | form-productivity module | ✅ | CLEAN | — | — |
| `public/scripts/lab-search-suggest.js` | ASSET | lab-search-suggest module | ✅ | CLEAN | — | — |
| `README.md` | CONFIG | README module | ✅ | ISSUE | P1-002 | — |
| `scripts/architecture-guard.mjs` | TEST/TOOL | architecture-guard module | ✅ | CLEAN | — | — |
| `scripts/backup-db.mjs` | TEST/TOOL | backup-db module | ✅ | CLEAN | — | — |
| `scripts/db-doctor.mjs` | TEST/TOOL | db-doctor module | ✅ | CLEAN | — | — |
| `scripts/e2e-a11y.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-acceptance.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-admin-users.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-auth-lockout.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-auth-password-flow.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-backup.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-dashboard.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-delete-request.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-findings.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-lab-acknowledgements.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-calendar.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-calibration.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-data-quality.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-documents.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-equipment.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-form.mjs` | E2E | E2E suite | ✅ | ISSUE | P1-001 | e2e:acceptance registry |
| `scripts/e2e-lab-maintenance.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-nav.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-lab-notifications.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-products.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-retests.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-review.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-search.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-lab-suggest.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-lab-tests.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-persistence.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-registry.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-reports.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-responsive.mjs` | E2E | E2E suite | ✅ | REQUIRES-RUNTIME-EVIDENCE | P2-004 | e2e:acceptance registry |
| `scripts/e2e-search.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-task-search.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/e2e-task-shared.mjs` | E2E | E2E suite | ✅ | CLEAN | — | e2e:acceptance registry |
| `scripts/init-db.mjs` | TEST/TOOL | init-db module | ✅ | CLEAN | — | — |
| `scripts/restore-db.mjs` | TEST/TOOL | restore-db module | ✅ | CLEAN | — | — |
| `scripts/route-manifest.mjs` | TEST/TOOL | route-manifest module | ✅ | CLEAN | — | — |
| `scripts/run-full-tests.mjs` | TEST/TOOL | run-full-tests module | ✅ | CLEAN | — | — |
| `scripts/run-performance.mjs` | TEST/TOOL | run-performance module | ✅ | CLEAN | — | — |
| `scripts/scheduled-notifications.mjs` | TEST/TOOL | scheduled-notifications module | ✅ | CLEAN | — | — |
| `scripts/smoke-ai-live.mjs` | TEST/TOOL | smoke-ai-live module | ✅ | CLEAN | — | — |
| `scripts/smoke-task-detail.mjs` | TEST/TOOL | smoke-task-detail module | ✅ | CLEAN | — | — |
| `scripts/test-ai-features.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-ai-foundation.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-ai-lab.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-audit-integrity.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-auth-password-lifecycle.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-dashboard-reports.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-db-doctor.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-db-rules.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-delete-durability.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-deployment-contract.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-embedded-migration-parity.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-form-productivity.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-acknowledgements.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-audit.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-calendar.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-calibration.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-change-requests.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-data-quality.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-documents.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-equipment.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-esignature.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-form.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-maintenance.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-management.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-notifications.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-overview.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-print.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-products.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-qr.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-reference-panel.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-repeat-failures.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-reports.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-retention.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-retests.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-review.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-search.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-security.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-suggest.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-templates.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-tests.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-trends.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-ux-performance.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-lab-ux-presentation.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-manifest-guard.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-manifest.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-migrations.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-observability.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-performance.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-production-operations.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-qc-operations.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-report-pdf-arabic.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | ISSUE | P3-018 | test (canonical chain) |
| `scripts/test-report-preview.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-request-security.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-responsive-e2e-contract.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-scheduled-notifications.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-sla.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-templates.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-ui-consistency.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-user-audit.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test-workflow.mjs` | TEST/TOOL | Test suite (canonical) | ✅ | CLEAN | — | test (canonical chain) |
| `scripts/test.mjs` | TEST/TOOL | test module | ✅ | CLEAN | — | — |
| `scripts/ui-screenshots.mjs` | TEST/TOOL | ui-screenshots module | ✅ | CLEAN | — | — |
| `scripts/verify-badge-contrast.mjs` | TEST/TOOL | verify-badge-contrast module | ✅ | CLEAN | — | — |
| `scripts/verify-security-hygiene.mjs` | TEST/TOOL | verify-security-hygiene module | ✅ | CLEAN | — | — |
| `SECURITY.md` | CONFIG | SECURITY module | ✅ | CLEAN | — | — |
| `src/components/AiReviewPanel.tsx` | COMPONENT | AiReviewPanel module | ✅ | CLEAN | — | — |
| `src/components/AttachmentUploader.tsx` | COMPONENT | AttachmentUploader module | ✅ | CLEAN | — | — |
| `src/components/Breadcrumbs.astro` | COMPONENT | Breadcrumbs module | ✅ | CLEAN | — | — |
| `src/components/CommentBox.tsx` | COMPONENT | CommentBox module | ✅ | CLEAN | — | — |
| `src/components/DashboardCharts.tsx` | COMPONENT | DashboardCharts module | ✅ | CLEAN | — | — |
| `src/components/DeleteRequestBadge.astro` | COMPONENT | DeleteRequestBadge module | ✅ | CLEAN | — | — |
| `src/components/DeleteRequestDialog.tsx` | COMPONENT | DeleteRequestDialog module | ✅ | CLEAN | — | — |
| `src/components/EmptyState.astro` | COMPONENT | EmptyState module | ✅ | CLEAN | — | — |
| `src/components/EsignDialog.astro` | COMPONENT | EsignDialog module | ✅ | CLEAN | — | — |
| `src/components/EvidenceRequirementsInput.tsx` | COMPONENT | EvidenceRequirementsInput module | ✅ | CLEAN | — | — |
| `src/components/FlashNotice.astro` | COMPONENT | FlashNotice module | ✅ | CLEAN | — | — |
| `src/components/lab/LabActionButton.astro` | COMPONENT | LabActionButton module | ✅ | CLEAN | — | — |
| `src/components/lab/LabCalibrationForm.astro` | COMPONENT | LabCalibrationForm module | ✅ | CLEAN | — | — |
| `src/components/lab/LabDocumentEditor.astro` | COMPONENT | LabDocumentEditor module | ✅ | CLEAN | — | — |
| `src/components/lab/LabDocumentStatusBadge.astro` | COMPONENT | LabDocumentStatusBadge module | ✅ | CLEAN | — | — |
| `src/components/lab/LabEquipmentForm.astro` | COMPONENT | LabEquipmentForm module | ✅ | CLEAN | — | — |
| `src/components/lab/LabFailRateChart.tsx` | COMPONENT | LabFailRateChart module | ✅ | CLEAN | — | — |
| `src/components/lab/LabProductForm.astro` | COMPONENT | LabProductForm module | ✅ | CLEAN | — | — |
| `src/components/lab/LabSaveViewForm.astro` | COMPONENT | LabSaveViewForm module | ✅ | CLEAN | — | — |
| `src/components/lab/LabSecondaryNav.astro` | COMPONENT | LabSecondaryNav module | ✅ | CLEAN | — | — |
| `src/components/lab/LabTemplateForm.astro` | COMPONENT | LabTemplateForm module | ✅ | CLEAN | — | — |
| `src/components/lab/LabTestForm.tsx` | COMPONENT | LabTestForm module | ✅ | CLEAN | — | — |
| `src/components/LabDashboardCharts.tsx` | COMPONENT | LabDashboardCharts module | ✅ | CLEAN | — | — |
| `src/components/MarkAllReadButton.tsx` | COMPONENT | MarkAllReadButton module | ✅ | CLEAN | — | — |
| `src/components/MarkReadButton.tsx` | COMPONENT | MarkReadButton module | ✅ | CLEAN | — | — |
| `src/components/Navbar.tsx` | COMPONENT | Navbar module | ✅ | ISSUE | P3-020 | — |
| `src/components/NewTaskForm.astro` | COMPONENT | NewTaskForm module | ✅ | CLEAN | — | — |
| `src/components/NotificationCard.astro` | COMPONENT | NotificationCard module | ✅ | CLEAN | — | — |
| `src/components/OperationalState.astro` | COMPONENT | OperationalState module | ✅ | CLEAN | — | — |
| `src/components/QcStatusBadge.astro` | COMPONENT | QcStatusBadge module | ✅ | CLEAN | — | — |
| `src/components/ReviewDeleteRequestDialog.tsx` | COMPONENT | ReviewDeleteRequestDialog module | ✅ | CLEAN | — | — |
| `src/components/StatusBadge.astro` | COMPONENT | StatusBadge module | ✅ | CLEAN | — | — |
| `src/components/TaskChecklistInput.tsx` | COMPONENT | TaskChecklistInput module | ✅ | CLEAN | — | — |
| `src/components/TaskDependencyInput.tsx` | COMPONENT | TaskDependencyInput module | ✅ | CLEAN | — | — |
| `src/components/TaskLifecycle.tsx` | COMPONENT | TaskLifecycle module | ✅ | CLEAN | — | — |
| `src/components/TaskUpdatePanel.tsx` | COMPONENT | TaskUpdatePanel module | ✅ | CLEAN | — | — |
| `src/components/ui/AppButton.astro` | COMPONENT | AppButton module | ✅ | CLEAN | — | — |
| `src/components/ui/Banner.astro` | COMPONENT | Banner module | ✅ | CLEAN | — | — |
| `src/components/ui/ContextualHelp.astro` | COMPONENT | ContextualHelp module | ✅ | ISSUE | P1-001 (text source) | — |
| `src/components/ui/formPresets.ts` | COMPONENT | formPresets module | ✅ | CLEAN | — | — |
| `src/components/ui/labBadgeClasses.ts` | COMPONENT | labBadgeClasses module | ✅ | CLEAN | — | — |
| `src/components/ui/notificationPresentation.ts` | COMPONENT | notificationPresentation module | ✅ | CLEAN | — | — |
| `src/components/ui/PageHeader.astro` | COMPONENT | PageHeader module | ✅ | CLEAN | — | — |
| `src/components/ui/Pagination.astro` | COMPONENT | Pagination module | ✅ | CLEAN | — | — |
| `src/components/ui/StatusPill.astro` | COMPONENT | StatusPill module | ✅ | CLEAN | — | — |
| `src/components/ui/statusTones.ts` | COMPONENT | statusTones module | ✅ | CLEAN | — | — |
| `src/env.d.ts` | CONFIG | env.d module | ✅ | CLEAN | — | — |
| `src/layouts/BaseLayout.astro` | LAYOUT | BaseLayout module | ✅ | CLEAN | — | — |
| `src/layouts/PrintLayout.astro` | LAYOUT | PrintLayout module | ✅ | CLEAN | — | — |
| `src/lib/activity.ts` | SERVICE | activity module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/context.ts` | SERVICE | context module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/features.ts` | SERVICE | features module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/groq.ts` | SERVICE | groq module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/guardrails.ts` | SERVICE | guardrails module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/health.ts` | SERVICE | health module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/labFeatures.ts` | SERVICE | labFeatures module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/prompts.ts` | SERVICE | prompts module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/provider.ts` | SERVICE | provider module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/schemas.ts` | SERVICE | schemas module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/service.ts` | SERVICE | service module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/ai/types.ts` | SERVICE | types module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/aiAudit.ts` | SERVICE | aiAudit module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/aiQcContext.ts` | SERVICE | aiQcContext module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/api-security.ts` | SERVICE | api-security module | ✅ | ISSUE | P2-005 | canonical suites (60) + request-security |
| `src/lib/assignment.ts` | SERVICE | assignment module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/audit/chain.ts` | SERVICE | chain module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/audit/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/audit/qcChain.ts` | SERVICE | qcChain module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/audit/userTimeline.ts` | SERVICE | userTimeline module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/auth.ts` | SERVICE | auth module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/backup-scheduler.ts` | SERVICE | backup-scheduler module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/backup.ts` | SERVICE | backup module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/capa/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/dashboard.ts` | SERVICE | dashboard module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/db.ts` | SERVICE | db module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/deleteRequests.ts` | SERVICE | deleteRequests module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/evidence/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/export.ts` | SERVICE | export module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/findings/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/flash.ts` | SERVICE | flash module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/format.ts` | SERVICE | format module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/acknowledgements.ts` | SERVICE | acknowledgements module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/aiContext.ts` | SERVICE | aiContext module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/auditTimeline.ts` | SERVICE | auditTimeline module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/calendar.ts` | SERVICE | calendar module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/calibration.ts` | SERVICE | calibration module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/changeRequests.ts` | SERVICE | changeRequests module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/dashboard.ts` | SERVICE | dashboard module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/dataQuality.ts` | SERVICE | dataQuality module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/documentContent.ts` | SERVICE | documentContent module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/documents.ts` | SERVICE | documents module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/equipment.ts` | SERVICE | equipment module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/equipmentStatus.ts` | SERVICE | equipmentStatus module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/esignature.ts` | SERVICE | esignature module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/findingLinks.ts` | SERVICE | findingLinks module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/labReports.ts` | SERVICE | labReports module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/management.ts` | SERVICE | management module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/navigation.ts` | SERVICE | navigation module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/overview.ts` | SERVICE | overview module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/policy.ts` | SERVICE | policy module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/products.ts` | SERVICE | products module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/qrcodes.ts` | SERVICE | qrcodes module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/reference-panel.ts` | SERVICE | reference-panel module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/retention.ts` | SERVICE | retention module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/retests.ts` | SERVICE | retests module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/review.ts` | SERVICE | review module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/savedViews.ts` | SERVICE | savedViews module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/scan.ts` | SERVICE | scan module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/scheduledNotifications.ts` | SERVICE | scheduledNotifications module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/search.ts` | SERVICE | search module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/seed.ts` | SERVICE | seed module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/templates.ts` | SERVICE | templates module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/testExport.ts` | SERVICE | testExport module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/tests.ts` | SERVICE | tests module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/testSearch.ts` | SERVICE | testSearch module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/trends.ts` | SERVICE | trends module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/lab/wiCatalog.ts` | SERVICE | wiCatalog module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/migrationRegistry.ts` | SERVICE | migrationRegistry module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/migrations.ts` | SERVICE | migrations module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/notifications.ts` | SERVICE | notifications module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/observability.ts` | SERVICE | observability module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/pdf.ts` | SERVICE | pdf module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/pdfData.ts` | SERVICE | pdfData module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/permissions.ts` | SERVICE | permissions module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/qc-operations.ts` | SERVICE | qc-operations module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/recurrence.ts` | SERVICE | recurrence module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/redirect.ts` | SERVICE | redirect module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/audit.ts` | SERVICE | audit module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/authorization.ts` | SERVICE | authorization module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/catalog.ts` | SERVICE | catalog module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/drilldown.ts` | SERVICE | drilldown module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/filters.ts` | SERVICE | filters module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/preview.ts` | SERVICE | preview module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/queries.ts` | SERVICE | queries module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/reader.ts` | SERVICE | reader module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/scope.ts` | SERVICE | scope module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/types.ts` | SERVICE | types module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/csv.ts` | SERVICE | csv module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/fonts/fontData.ts` | SERVICE | fontData module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/fonts/IBMPlexSansArabic-Regular.ttf` | SERVICE | IBMPlexSansArabic-Regular.ttf module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/fonts/OFL.txt` | SERVICE | OFL.txt module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/pdf.ts` | SERVICE | pdf module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/reporting/writers/xlsx.ts` | SERVICE | xlsx module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/searchExport.ts` | SERVICE | searchExport module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/seed.ts` | SERVICE | seed module | ✅ | ISSUE | P2-006 | canonical suites (60) + request-security |
| `src/lib/session.ts` | SERVICE | session module | ✅ | ISSUE | P2-011 | canonical suites (60) + request-security |
| `src/lib/sla/engine.ts` | SERVICE | engine module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/sla/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/systemHealth.ts` | SERVICE | systemHealth module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/task-policy.ts` | SERVICE | task-policy module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/taskDetails.ts` | SERVICE | taskDetails module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/tasks.ts` | SERVICE | tasks module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/taskSearch.ts` | SERVICE | taskSearch module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/taskUpdates.ts` | SERVICE | taskUpdates module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/templates/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/templatesStore.ts` | SERVICE | templatesStore module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/types.ts` | SERVICE | types module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/users.ts` | SERVICE | users module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/validation.ts` | SERVICE | validation module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/workflows/engine.ts` | SERVICE | engine module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/workflows/index.ts` | SERVICE | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/lib/workload.ts` | SERVICE | workload module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/404.astro` | PAGE | 404 module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/account/security.astro` | PAGE | security module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/settings/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/system-health/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/templates/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/templates/api.ts` | PAGE | api module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/templates/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/templates/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/users/api.ts` | PAGE | api module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/users/audit.astro` | PAGE | audit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/admin/users/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/api/admin/backup.ts` | API | backup module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/ai/[feature].ts` | API | [feature] module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/export/search.csv.ts` | API | search.csv module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/export/search.xlsx.ts` | API | search.xlsx module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/export/tasks.csv.ts` | API | tasks.csv module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/export/tasks/pdf/[id].ts` | API | [id] module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/filters.ts` | API | filters module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/findings/[id].ts` | API | [id] module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/findings/[id]/capa.ts` | API | capa module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/findings/[id]/evidence.ts` | API | evidence module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/findings/[id]/rca.ts` | API | rca module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/findings/index.ts` | API | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/health.ts` | API | health module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/change-requests/[id]/review.ts` | API | review module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/change-requests/[id]/withdraw.ts` | API | withdraw module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/equipment/[id]/maintenance.ts` | API | maintenance module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/saved-views.ts` | API | saved-views module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/search-suggest.ts` | API | search-suggest module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/tests/[id]/review.ts` | API | review module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/tests/export.csv.ts` | API | export.csv module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/lab/tests/export.xlsx.ts` | API | export.xlsx module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/notifications/[id]/read.ts` | API | read module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/notifications/read-all.ts` | API | read-all module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/reports/[reportType].[format].ts` | API | [reportType].[format] module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/reports/audit.ts` | API | audit module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/attachments/[attachmentId].ts` | API | [attachmentId] module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/attachments/index.ts` | API | index module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/cancel.ts` | API | cancel module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/close.ts` | API | close module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/comment.ts` | API | comment module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/delete-request.ts` | API | delete-request module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/reopen.ts` | API | reopen module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/[id]/update.ts` | API | update module | ✅ | CLEAN | — | canonical suites (60) + request-security |
| `src/pages/api/tasks/suggestions.ts` | API | suggestions module | ✅ | ISSUE | P3-012 | canonical suites (60) + request-security |
| `src/pages/dashboard.astro` | PAGE | dashboard module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/dashboard/drilldown.astro` | PAGE | drilldown module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/employee/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/employee/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/findings/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/findings/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/acknowledgements/assign.astro` | PAGE | assign module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/acknowledgements/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/audit.astro` | PAGE | audit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calendar.astro` | PAGE | calendar module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calibration/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calibration/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calibration/[id]/print.astro` | PAGE | print module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calibration/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/calibration/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/change-requests/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/change-requests/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/change-requests/new.astro` | PAGE | new module | ✅ | ISSUE | P2-007 | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/data-quality.astro` | PAGE | data-quality module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/[id]/print.astro` | PAGE | print module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/[id]/versions.astro` | PAGE | versions module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/documents/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/[id]/maintenance.astro` | PAGE | maintenance module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/[id]/print.astro` | PAGE | print module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/equipment/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/maintenance/[id]/print.astro` | PAGE | print module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/management.astro` | PAGE | management module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/notifications.astro` | PAGE | notifications module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/products/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/products/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/products/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/products/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/reports.astro` | PAGE | reports module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/retests/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/retests/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/retests/new.astro` | PAGE | new module | ✅ | ISSUE | P2-007 | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/saved-views/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/search.astro` | PAGE | search module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/templates/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/templates/[id]/edit.astro` | PAGE | edit module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/templates/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/templates/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/tests/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/tests/[id]/print.astro` | PAGE | print module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/tests/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/tests/new.astro` | PAGE | new module | ✅ | ISSUE | P1-001 | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/lab/tests/review.astro` | PAGE | review module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/login.astro` | PAGE | login module | ✅ | ISSUE | P3-013 | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/logout.ts` | PAGE | logout module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/manager/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/manager/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/manager/requests/api.ts` | PAGE | api module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/manager/requests/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/manager/workload.astro` | PAGE | workload module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/notifications.astro` | PAGE | notifications module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/reports.astro` | PAGE | reports module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/search.astro` | PAGE | search module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/supervisor/index.astro` | PAGE | index module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/supervisor/new.astro` | PAGE | new module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/pages/tasks/[id].astro` | PAGE | [id] module | ✅ | CLEAN | — | route-manifest, ui-consistency, a11y, responsive |
| `src/styles/global.css` | STYLE | global module | ✅ | CLEAN | — | — |
| `tailwind.config.mjs` | CONFIG | tailwind.config module | ✅ | CLEAN | — | — |
| `tsconfig.json` | CONFIG | tsconfig.json module | ✅ | CLEAN | — | — |

## Coverage totals

- Total files in scope: **457**
- Reviewed: **457 (100%)**
- CLEAN: 426
- ISSUE: 15
- REQUIRES-RUNTIME-EVIDENCE: 16

Excluded as generated/vendor: `node_modules/`, `dist/`, `.astro/`, `db/backups/*` (runtime), `db/e2e_*.db* + WAL/SHM` (runtime), `download/qa/*` (QA outputs), `package-lock` artifacts.
