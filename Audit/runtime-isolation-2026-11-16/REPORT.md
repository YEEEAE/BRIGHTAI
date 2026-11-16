# Local runtime isolation closure — 2026-11-16

- PostgreSQL 18.6 Homebrew, disposable Unix-socket clusters; no database connection to Neon.
- Order tests: 6 PASS. Rehearsal: PASS, fresh 32 receipts, historical delta 33 receipts; final captured security postures identical.
- Runtime matrix: 84/84 PASS (74 existing checks plus 10 bootstrap/invitation checks), zero failures.
- All public AIGAS tables have restrictive client-deny policies; client grants revoked on exploration/self-service tables.
- Runtime NOINHERIT login + SET LOCAL ROLE aigas_runtime proves guarded creation and acceptance; direct tenant INSERT fails 42501. Missing/banned actors, invalid names, wrong invitation actor and consumed invitation after revocation are rejected.
- 0033/0034 unchanged. 0035 also validates the existing ledger CHECK to close the observed fresh/delta validation-state mismatch.
- Rehearsal's stale hardcoded resume expectation was updated to derive the current suffix; final posture equality now has an executed assertion.
- Invitation SQL function is implemented and verified directly; administration.mjs / invitation HTTP route remains unchanged, outside the requested file scope. HTTP invitation integration is still open.
- No external migration, deploy, commit or push. External application requires PROMPT-05 approval.
