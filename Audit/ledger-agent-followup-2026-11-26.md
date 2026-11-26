# Ledger agent follow-up — 2026-11-26

Status: PARTIAL. Agent runtime now requires a recorded Ledger projection, including before tool execution and outbox retry. Kernel audit uses the actual audit ID, preserving replay identity. Agent evidence adds run, correlation, causation and agent version references to allowlisted hashed metadata. Paused steps produce evidence. Successful product projections explicitly return `recorded:true`.

Verification: 23 focused in-memory/HTTP and existing Ledger tests PASS; `npm run build` PASS. `tests/ledger-db.test.mjs` SKIP: no database fixture supplied. Tests do not establish live database behavior. The tool and dispatch calls remain inside a transaction: an external effect cannot be rolled back if a later commit fails. Provider usage and all human decisions are not covered.

LD-01–04: NOT PASS_VERIFIED in the required environment. Approved signing and key lifecycle, signed verification/export, retention policy, provider usage and independent end-to-end database evidence remain incomplete. Existing prefix verification is unsigned; it does not establish authenticity or tail completeness. Runtime now fails closed when Ledger is unavailable or not entitled, potentially making agent operations unavailable until configured. No deployment or remote database changes performed.
