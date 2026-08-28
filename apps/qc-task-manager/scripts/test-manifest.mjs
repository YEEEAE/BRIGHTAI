export const META_TEST_SCRIPTS = new Set(['test', 'test:manifest', 'test:architecture']);

// scripts/test-*.mjs files that are intentionally NOT canonical suites.
// `test-manifest-guard.mjs` scans the filesystem, so every file matching the
// convention must be either the target of a registered test:* command or
// explicitly classified here with a reason. Keep this list small and honest.
export const TEST_SCRIPT_CLASSIFICATIONS = new Map([
  // Pure data module: exports the registry consumed by the guard and
  // run-full-tests.mjs. Not an executable test.
  ['scripts/test-manifest.mjs', 'registry-data-module'],
  // The guard itself; it IS the test:manifest command.
  ['scripts/test-manifest-guard.mjs', 'meta-guard:command test:manifest'],
  // Manual PDF diagnostic (PROMPT 50): generates an artifact for visual
  // inspection via --artifact/--keep-artifact, never part of the canonical
  // chain. KNOWN BROKEN at HEAD (open defect, do not register silently):
  // fails "Arabic location drawn visually ordered", "diacritic cell drawn
  // via mark positioning path", "Report ID data under Report ID header",
  // then crashes TypeError at scripts/test-report-pdf-arabic.mjs:160
  // (locData undefined). Fix + registration is a dedicated follow-up task.
  ['scripts/test-report-pdf-arabic.mjs', 'manual-diagnostic:known-broken (see reason)'],
  ['scripts/test-responsive-e2e-contract.mjs', 'contract-guard:responsive E2E wiring'],
]);

export const CANONICAL_TEST_SCRIPTS = [
  'test:migrations',
  'test:auth-password-lifecycle',
  'test:user-audit',
  'test:embedded-migration-parity',
  'test:schema-reference',
  'test:route-manifest',
  'test:domain',
  'test:sla',
  'test:workflow',
  'test:audit-integrity',
  'test:delete-durability',
  'test:ai-foundation',
  'test:ai-features',
  'test:ai-lab',
  'test:dashboard-reports',
  'test:report-preview',
  'test:qc-operations',
  'test:templates',
  'test:db-rules',
  'test:lab-overview',
  'test:lab-management',
  'test:lab-form',
  'test:form-productivity',
  'test:lab-tests',
  'test:lab-review',
  'test:lab-products',
  'test:lab-equipment',
  'test:lab-maintenance',
  'test:lab-calibration',
  'test:lab-print',
  'test:lab-qr',
  'test:lab-documents',
  'test:lab-acknowledgements',
  'test:lab-retests',
  'test:lab-calendar',
  'test:lab-notifications',
  'test:scheduled-notifications',
  'test:lab-repeat-failures',
  'test:lab-data-quality',
  'test:lab-reports',
  'test:lab-retention',
  'test:lab-audit',
  'test:lab-templates',
  'test:lab-reference-panel',
  'test:lab-security',
  'test:request-security',
  'test:observability',
  'test:lab-esignature',
  'test:lab-suggest',
  'test:lab-search',
  'test:badge-contrast',
  'test:status-semantics',
  'test:lab-ux-presentation',
  'test:lab-ux-performance',
  'test:lab-trends',
  'test:lab-change-requests',
  'test:db-doctor',
  'test:production-operations',
  'test:deployment-contract',
  'test:responsive-e2e-contract',
  'test:performance',
  'test:ui-consistency',
];
