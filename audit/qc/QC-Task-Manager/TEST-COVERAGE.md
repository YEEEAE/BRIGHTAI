# Test Coverage

`test:manifest` reports 65 canonical test suites, 28 canonical E2E suites, 4 classified non-runnable test scripts, and 4 classified E2E scripts.

Manifest, route manifest, architecture, migration tests/parity, schema reference, security hygiene, deployment contract, production operations, badge contrast, typecheck/build, the full 65-suite unit chain, and the full E2E acceptance aggregate passed as recorded in `FINAL-EVIDENCE-LEDGER.md`.

The first sandbox attempts exposed an environment limitation: Corepack cache permissions and localhost `listen EPERM`. With an isolated temporary Corepack directory and a permitted localhost runner, both final aggregates passed. The sandbox limitation remains documented but is not a product failure.

`scripts/test-report-pdf-arabic.mjs` is classified as a manual known-broken diagnostic and is not a canonical green suite.
