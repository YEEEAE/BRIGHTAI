# Human Gate foundation evidence — 2026-11-01

Outcome: local foundation implemented, **PARTIAL operationally**. No commit, push, deploy, production mutation, new dependency, secret change or marketing page change.

- Source scope/file manifest and exact API contract: `docs/HUMAN-GATE-DEVELOPMENT.md`.
- Neon MCP table inspection: BLOCKED (authorization unavailable). Direct configured Neon connection: READ ONLY catalog inspection PASS; exactly `aigas_tenants`, `aigas_memberships`, `aigas_product_access`, `aigas_audit_events` found in public application tables. Human Gate tables absent. `0004_aigas_human_gate.sql` remains unapplied to Neon.
- Build: PASS. TypeScript (`tsc --noEmit`): PASS. Unit/HTTP regression suite Kernel + Firewall + Ledger + Human Gate: **15 PASS**.
- Isolated PostgreSQL **16** + actual HTTP handler/service SQL: **1 PASS**. Covers durable creation/readback, PENDING enforcement, self-approval/self-rejection denial, MEMBER denial, tenant isolation, forbidden fields, invalid scope/reason, independent approval/rejection, terminal decisions, execution by requester only, idempotent completion and audit, real concurrent decision contention (one 200 and one 409), role revocation, banned user, rollback of create/decision/completion when auditing fails. No Ledger migration installed.
- Local built server `http://127.0.0.1:4398/app/human-gate/`, Playwright MCP: PASS at 360×800 and 1440×1000; no horizontal overflow, private content hidden without identity, zero GA/GTM resource requests. API anonymous GET returns 401 and `Cache-Control: private, no-store`. Browser did not exercise authenticated forms or decisions.
- Real two-user Neon login/UI journey: NOT RUN (no approved local Auth origin; HG migration not authorized on production). No claim of end-to-end Neon acceptance or public availability.
- Deferred features remain listed in development guide; broad product acceptance matrix is not marked PASS.
