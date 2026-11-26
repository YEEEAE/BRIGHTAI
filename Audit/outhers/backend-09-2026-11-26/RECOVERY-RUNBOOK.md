# Recovery runbook — draft, no external actions authorized

1. Preserve server request/correlation IDs, deployment SHA and sanitized error code; do not collect prompts, provider tokens, authorization headers or personal content.
2. For an unknown provider outcome or a stuck Secure Chat reservation, do not replay. Identify the actual request and reservation through authorized scoped operations, reconcile provider billing/usage if available, and obtain an operator-approved correction procedure. Current source intentionally preserves the reservation; no safe automatic reconciliation interface has been established here.
3. On policy, review, membership or target version change, reject stale approval and require a fresh evaluation. Do not manually mark a grant consumed or approved to bypass the service.
4. On missing mandatory evidence or DB failure, treat the protected action as unconfirmed; investigate the transaction and service status. Do not edit old Ledger events or create a retrospective success claim.
5. On unavailable readiness, preserve the closed gate; verify configuration and runtime role without printing secrets. `docs/HEALTHZ-READINESS.md` and `docs/NODE-P0-DEPLOY-HANDOFF.md` describe the existing probes and handoff.

This is an investigation guide, not a tested production recovery procedure. Backup/restore, failure injection, restart and external reconciliation remain unverified for this release.
