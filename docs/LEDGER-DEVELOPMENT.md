# Ledger foundation — local implementation

Status on 2026-11-01: **PARTIAL operationally**. `/app/ledger/` and its protected server paths are implemented. A disposable local PostgreSQL test proves event creation, committed readback, digest comparison, JSON export, permissions and isolation. A real Neon user journey is **NOT RUN**. No commercial availability, signature, legal proof or compliance claim follows from these checks.

Pre-final slice on 2026-11-01 (local only): the event list also supports a bounded `q` search over event UUID and synthetic decision reference, migration `0003` rejects ordinary row updates/deletes with a trigger, and missing schema/database privilege failures have explicit 503 codes. This is append-only behavior for the foundation path, not protection from a database owner who can alter or disable the trigger.

## Configuration and migration

- Reuses Kernel's existing `DATABASE_URL`, `NEON_AUTH_BASE_URL` (or `NEON_AUTH_URL`) and `NEON_AUTH_JWKS_URL` (or `NEON_JWKS_URL`). Existing `.env` is ignored and was left unchanged. No storage, Data API or AI provider is needed for this slice.
- Neon MCP failed authorization. Direct read-only catalog inspection found the four Kernel tables and no `aigas_ld_events`. The currently linked branch is production; **0003 was not applied remotely**. Previous permission for Kernel's 0001 does not authorize this migration.
- Review `migrations/0003_aigas_ledger.sql`, then apply on an approved isolated development database with Kernel 0001. Firewall 0002 is not a dependency. Do not run migrations automatically during build/startup.
- Review runtime DB role/grants before deployment. RLS is enabled without browser/Data API policies or PUBLIC grants. Tests use a local table owner; they do not prove production role least privilege. Scope checks run server-side for every operation and lock membership during the transaction.
- Auth remains Kernel's verified EdDSA/JWKS flow and active Auth-directory membership. Workspace selection chooses an existing membership; it cannot create authority. No new login or trusted-domain configuration is introduced. Local Neon login still needs the previously documented Origin/user-journey validation.

## Implemented routes and permissions

All routes require a Kernel Bearer session. `workspace` is an optional membership selector, not a trusted tenant claim; tenant scope is resolved from the database. Responses are private/no-store and noindex, without Analytics. Mutating requests require same-origin JSON and are streamed with an 8192-byte cap.

| Route | Method | Kernel role | Behavior |
|---|---|---|---|
| `/app/api/ledger/events/` | GET | OWNER / ADMIN / MEMBER | Scoped list; `q` (up to 80 chars, UUID/decision reference only), `type`, `period=all/1/7/30`, `page=1..100`; 25 rows/page |
| `/app/api/ledger/events/` | POST | OWNER / ADMIN | Synthetic event with `{event_type,scenario}` only |
| `/app/api/ledger/events/{eventId}/` | GET | OWNER / ADMIN / MEMBER | One event from the selected membership |
| `/app/api/ledger/events/{eventId}/verify/` | POST | OWNER / ADMIN / MEMBER | Recalculate stored event, or compare optional `candidate` to the persisted digest |
| `/app/api/ledger/events/{eventId}/export/` | GET | OWNER / ADMIN | Single JSON attachment, profile, integrity result and explicit limitations |

No update/delete route, production event ingestion, independent verifier, signed bundle, idempotency/billing, Legal Hold, retention engine or encrypted fallback is implemented. The proposed `/v1/ledger/` API contract remains a future full-product target; these foundation endpoints are deliberately smaller.

Creation accepts types `synthetic.test.created` / `synthetic.review.recorded` and scenarios `integrity-check` / `access-check`. The server generates event UUID, tenant, source `ledger.synthetic-lab`, policy label `foundation-v1`, actor, UTC timestamp, synthetic decision UUID and digest. The policy label is an implementation profile, not an approved customer policy. Metadata is exactly `synthetic=true`, enumerated `scenario`/`outcome`, and `decision_ref` UUID. No arbitrary text, prompts, conversations, tokens or secrets can be supplied for persistence. This phase records synthetic events honestly; it does not backfill fake security activity or wire optional product integrations.

Creation and the minimal Kernel audit marker share a transaction. No persistence receipt is returned before commit; audit failure rolls back the event. Export writes a minimal Kernel audit marker. Kernel's basic audit implementation remains independent of Ledger tables and commercial access.

## Digest profile: `aigas-ledger-sha256-v1`

UTF-8 `JSON.stringify` of an array with this fixed order:

```text
[profile, tenant_id, event_id, source, event_type, policy_version,
 {synthetic, scenario, outcome, decision_ref}, created_at_UTC_ISO_milliseconds, created_by]
```

Metadata keys are reconstructed in the exact order above, independently of JSONB order. The digest itself is excluded. Timestamp precision is milliseconds in SQL and serialization. SHA-256 is lower-case hex; comparison uses `timingSafeEqual`.

Verification returns `MATCH`, `MISMATCH` or `INDETERMINATE` (malformed/unsupported event). Infrastructure/auth failures are non-2xx, and the interface says verification could not complete. Optional `candidate` must contain exactly the seven non-tenant, non-hash event fields; its hash is compared against the **stored** hash, never a caller-provided hash. Candidate tenant comes from the scoped stored row. The UI's tamper check only changes an in-memory synthetic outcome; it never writes back the original event. Migration `0003` also installs a trigger rejecting ordinary `UPDATE` and `DELETE`; a database owner can still alter the schema or disable the trigger.

An administrator able to rewrite both row and digest can defeat this consistency check. It cannot prove origin independently, completeness, deletion/reordering, clock correctness, legal admissibility or decision correctness. **LD-02 and LD-06 remain partial**, LD-03/LD-05 advanced controls and LD-07 integrations remain deferred. No blockchain, PKI, key rotation or independent offline tool is included.

## Verification and exact changed files

Evidence: `Audit/2026-11-01-ledger-foundation.md`.

```sh
node --test tests/ledger.test.mjs
# Use a fresh disposable local database with no preexisting schemas/data:
LEDGER_TEST_DATABASE_URL=postgresql://127.0.0.1:55483/postgres node --test tests/ledger-db.test.mjs
npm run build
```

Current pre-final checks: build PASS; Ledger unit 3 PASS; disposable PostgreSQL 14 integration 1 PASS (synthetic-only); local standalone HTTP `/app/` 302, `/app/ledger/` 200, unauthenticated Ledger API 401 with private/no-store and noindex. Signed-in Neon journey remains NOT RUN. A generic TypeScript command is not a manifest script and is omitted here.

This slice changed `src/server/ledger/{core,service}.mjs`, `src/pages/app/ledger/index.astro`, `src/scripts/ledger.ts`, `migrations/0003_aigas_ledger.sql`, `tests/ledger{,-db}.test.mjs`, this document and `.agents/mind/01-mind-latest.md`. No dependencies, environment values, shared protected marketing files or remote resources changed.
