# Ledger foundation evidence — 2026-11-01

Reference HEAD: `9e93cda38cad9b271bd9b766e05f73f9db475057`, main, plus this task's local changes. Initial working tree clean (`core.fsmonitor=false` avoids local fsmonitor IPC error).

- Neon MCP: **BLOCKED**, authorization error. Direct catalog-only READ ONLY transaction: **PASS**, four public Kernel tables, Ledger table absent. No remote DDL/DML and no `.env` changes.
- `npm run build`, `tsc --noEmit`: **PASS**. Existing Zod bundler annotation warnings remain.
- Kernel/Firewall/Ledger unit and HTTP protection tests: **13 PASS**. Includes forged JWT protection inherited from Kernel, canonical timestamp/metadata stability, tamper mismatch, malformed candidate, size/origin/content-type validation and redacted server errors.
- Disposable PostgreSQL 16 + actual Ledger service/HTTP handler: **1 PASS**. Migrated Kernel 0001 + Ledger 0003 only, committed event then read it through a fresh operation, matched digest, rejected modified candidate, enforced role and tenant boundaries for list/detail/verify/export/create, rejected content injection, bounded/filtered pages, denied changed/revoked roles and banned identity, detected modified stored data, and rolled back creation when Kernel audit failed. HTTP identity is injected for this service integration test; it is not a real Neon login test.
- Playwright MCP on built Astro server, unauthenticated: **PASS** at 360/1440px, no page overflow, no analytics request, private area hidden, noindex, visible keyboard focus. List/detail/export without identity return 401 and private/no-store. Chrome DevTools was unavailable because its browser profile was already in use; Playwright provided the fallback.
- Full authenticated browser UI/Neon user journey: **NOT RUN**, local Auth Origin remains unresolved and Ledger migration is not approved/applied remotely. Private UI table/dialog actions have not been exercised in an authenticated browser.
- No full-product acceptance or commercial release claims. No production migration, commit, push, deployment, price/license activation, customer-content use or AI-provider call.

Review `docs/LEDGER-DEVELOPMENT.md` for routes, permission matrix, canonicalization, changed files, setup needs and explicitly deferred LD requirements. Remaining decisions: approved development target and migration, runtime role/grants, real Auth user journey. Storage/Data API are unnecessary for this slice.
