# Ledger append signatures — 2026-11-26

Status PARTIAL. Migration 0050 introduces tenant-scoped append-only Ed25519 signature receipts, with signature insertion in the event transaction. Append and replay require a configured key and a valid signature on the current tail; an unsigned historical tail therefore blocks new appends until an approved transition is designed. No old event was re-signed. Chain and standalone signed-export verification require every event signature under the configured single key, in addition to the canonical hash chain. Key rotation and a trusted historical public-key registry are not implemented.

Local evidence: PostgreSQL 18 disposable database and HTTP integration PASS, including no key, unsigned tail, delete refusal, tenant isolation, replay and signed export. Focused tests 33 PASS; Astro build PASS. No target deployment or database migration performed. A local key is not evidence of operational approval.

Still incomplete: provider usage and all human decision binding, verifiable redacted export, approved retention and lifecycle, key rotation, and verification in the required environment. Tail deletion remains undetectable without an independent anchor. An externally effective tool call inside a transaction may outlive a failed commit. LD-01–04 remain NOT PASS_VERIFIED in the target environment.
