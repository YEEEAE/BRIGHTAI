// Single source of truth for the E2E acceptance surface.
//
// `e2e-acceptance.mjs` executes exactly this list and
// `test-manifest-guard.mjs` cross-checks it against the filesystem, so an
// orphan `scripts/e2e-*.mjs` file can never silently escape acceptance and a
// registry entry can never point at a deleted file.
//
// Each suite runs against its own isolated SQLite database and port;
// ordering only matters for determinism of the report.

export const CANONICAL_E2E_SUITES = [
  ['admin-users', 'scripts/e2e-admin-users.mjs'],
  ['auth-lockout', 'scripts/e2e-auth-lockout.mjs'],
  ['task-shared', 'scripts/e2e-task-shared.mjs'],
  ['delete-request', 'scripts/e2e-delete-request.mjs'],
  ['dashboard', 'scripts/e2e-dashboard.mjs'],
  ['a11y', 'scripts/e2e-a11y.mjs'],
  ['backup', 'scripts/e2e-backup.mjs'],
  ['search', 'scripts/e2e-search.mjs'],
  ['findings', 'scripts/e2e-findings.mjs'],
  ['lab-nav', 'scripts/e2e-lab-nav.mjs'],
  ['lab-suggest', 'scripts/e2e-lab-suggest.mjs'],
  ['lab-form', 'scripts/e2e-lab-form.mjs'],
  ['lab-tests', 'scripts/e2e-lab-tests.mjs'],
  ['lab-review', 'scripts/e2e-lab-review.mjs'],
  ['lab-products', 'scripts/e2e-lab-products.mjs'],
  ['lab-equipment', 'scripts/e2e-lab-equipment.mjs'],
  ['lab-maintenance', 'scripts/e2e-lab-maintenance.mjs'],
  ['lab-calibration', 'scripts/e2e-lab-calibration.mjs'],
  ['lab-documents', 'scripts/e2e-lab-documents.mjs'],
  ['lab-acknowledgements', 'scripts/e2e-lab-acknowledgements.mjs'],
  ['lab-calendar', 'scripts/e2e-lab-calendar.mjs'],
  ['lab-retests', 'scripts/e2e-lab-retests.mjs'],
  ['lab-notifications', 'scripts/e2e-lab-notifications.mjs'],
  ['lab-data-quality', 'scripts/e2e-lab-data-quality.mjs'],
  ['lab-search', 'scripts/e2e-lab-search.mjs'],
  ['reports', 'scripts/e2e-reports.mjs'],
];

// scripts/e2e-*.mjs files that are intentionally NOT standalone suites.
// Anything on disk matching scripts/e2e-*.mjs must appear either in
// CANONICAL_E2E_SUITES or in this map, otherwise the guard fails.
export const E2E_SCRIPT_CLASSIFICATIONS = new Map([
  // Pure data module: exports this registry for the runner and the guard.
  ['scripts/e2e-registry.mjs', 'registry-data-module'],
  // The orchestrator itself; it is the process that consumes the registry.
  ['scripts/e2e-acceptance.mjs', 'meta-orchestrator'],
  // Executed directly by the runner's two-phase restart persistence check
  // (create stage, server restart, verify stage) — not a standalone suite.
  ['scripts/e2e-persistence.mjs', 'runner-persistence-phase'],
  // Spec module imported by the registered wrapper scripts/e2e-search.mjs;
  // it executes inside the `search` suite process.
  ['scripts/e2e-task-search.mjs', 'spec-imported-by:scripts/e2e-search.mjs'],
]);
