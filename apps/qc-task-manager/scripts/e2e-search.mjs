// E2E acceptance entry for ADVANCED TASK SEARCH.
//
// The full spec lives in e2e-task-search.mjs (already wired to run against a
// live server sharing QC_DATABASE_PATH). This module is the thin acceptance
// entry used by the e2e-acceptance.mjs orchestrator so every suite in that
// runner has a stable, labelled entry point:
//
//   e2e-search  →  ./e2e-task-search.mjs
//
// Importing the spec executes it in this process: it uses top-level await,
// prints its own ok() counters, cleans up its fixtures, and calls
// process.exit(1) itself when any assertion fails — so the exit code of this
// process is the suite result.

await import('./e2e-task-search.mjs');
