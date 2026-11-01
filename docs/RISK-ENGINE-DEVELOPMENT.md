# Risk Engine — local foundation

Date: 2026-11-01. Scope: a small persisted, rules-only slice authorized by the owner; not the complete RE-01–RE-05 product or a commercial release.

## Actual behavior

`/app/risk-engine/` uses the existing AppLayout, Neon Auth session and Kernel server identity/membership guards. No marketing layout, analytics, storage uploads or AI provider calls are added. OWNER/ADMIN can create/update assets and create assessments; MEMBER can list assets and read assessment history. The asset owner is descriptive text, not a permission grant. Workspace selection is checked against the verified user's DB memberships on every operation; tenant/user/result fields in request bodies are rejected.

Assets store name, owner, purpose, data classification and a monotonically increasing version. A changed field increments the version; a no-op does not. Every created/changed version is also stored in append-only `aigas_re_asset_revisions` with actor and database time. Assessment insertion locks the asset and requires the caller's expected version. A stale edit/evaluation returns 409. Every assessment stores a server-created asset snapshot, likelihood/impact, both reasons, proposed controls and their rationale, result/explanation, method version, DB time and verified evaluator ID. New assessments and asset revisions append; no update/delete API exists, and SQL triggers reject row update/delete. This is not a guarantee against a privileged database administrator.

The latest assessment is current only when its asset version matches. Otherwise the list shows `REASSESSMENT_REQUIRED`, preserves the prior assessment, and the detail view compares the latest assessed snapshot with current fields. Asset lists support tenant-scoped search and data-classification/risk-level filters; summary counts come from the same tenant's current DB records and exclude stale assessments from risk tiers. Asset lists, asset revisions and assessment history are paginated, 25 rows per page. Kernel basic audit is written in the same transaction; audit failure rolls back the asset/revision/assessment. No Firewall, Human Gate or Ledger tables or product entitlements are required.

## Draft method

`draft-likelihood-impact-v1`: integer likelihood 1–3 × impact 1–3. Products 1–2 → LOW, 3–4 → MEDIUM, 6–9 → HIGH. Values 5/7/8 cannot occur. Both axes, all nine cells, thresholds and draft status appear in initial HTML. Browser preview uses the server-rendered matrix; the server recomputes results and rejects client-supplied risk levels, snapshots, evaluator or method. Proposed default controls are retained alongside the user's control rationale; they do not certify that controls are implemented.

This is human-entered deterministic estimation, not calibrated statistical probability, contextual AI, regulatory methodology, approval, compliance certification or an automatic block. All changes to the four descriptive asset fields conservatively require reevaluation.

## Implemented local API

All paths end in `/`. `Authorization: Bearer <Neon session JWT>` is required; JWT signature/issuer/expiry plus actual active user/membership are checked by existing Kernel code. No test identity bypass is present in production handlers. Optional `workspace` selects an authorized membership, never establishes one. Mutations require same-origin `Origin`, JSON and an 8KB streamed body limit. Responses use private/no-store and noindex headers. Errors do not expose connection strings or internal SQL.

| Method | Path under `/app/api/risk-engine/` | Body / response |
| --- | --- | --- |
| GET | `assets/?page=1&q=&classification=&risk_level=` | tenant-filtered assets, DB-derived summary and filtered count, memberships, selected tenant/role, canWrite, page, hasMore |
| POST | `assets/` | name, owner, purpose, data_classification → asset (201) |
| PATCH | `assets/{assetId}/` | all four asset fields + asset_version → saved asset |
| GET | `assets/{assetId}/assessments/?page=1` | asset, assessments, canWrite, page, hasMore |
| POST | `assets/{assetId}/assessments/` | asset_version, likelihood, impact, likelihood_reason, impact_reason, controls_reason → assessment (201) |
| GET | `assets/{assetId}/revisions/?page=1` | append-only asset version snapshots with actor/time, tenant-scoped |

Classifications: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED. Name/owner: 2–120 characters; purpose/reasons/controls: 2–500 after trimming. Server-generated IDs, timestamps and outcome fields cannot be supplied. Mutation retries are not deduplicated; after an ambiguous connection loss, refresh and inspect history before resubmitting. No usage billing, quota or idempotency guarantee is claimed.

The existing `docs/products/risk-engine/API-CONTRACT.yaml` remains a broader future `/v1/risk/` proposal. It is not the implemented route contract above.

## Environment and migration boundary

Neon MCP read-only inspection on 2026-11-01 succeeded for project `young-frog-60183055`, branch `br-young-bird-b43proeb` (production), database `neondb`: Auth plus Kernel's four public tables exist; no Risk Engine tables exist. Existing local DATABASE_URL, NEON_AUTH_BASE_URL and NEON_AUTH_JWKS_URL were present. `.env` is ignored and was not changed. No credentials are needed for local source work; no additional Storage/Data API configuration is required for this slice.

`migrations/0005_aigas_risk_engine.sql` is review-only and requires `0001_aigas_kernel.sql`. It creates the asset, immutable asset-revision and assessment tables, history indexes and append-only triggers, with RLS enabled on all three tables and PUBLIC access revoked. The original 0005 slice was applied to disposable local PostgreSQL; this follow-up adding asset revisions was **not re-tested** because the execution sandbox denied PostgreSQL shared memory. It was **not applied to Neon**. No dev branch was created, and the production migration permission previously granted for Kernel does not cover this migration.

Before connected use: approve a development DB target and migration, review a least-privilege server DB role and its RLS access path (no permissive browser grants), and verify real Neon user/organization flows. Existing local Auth origin restrictions remain unchanged. Signed-out UI keeps all organization data/forms hidden and directs users to Kernel. Missing Auth config reports setup required; missing tables or DB errors fail closed without a successful-save claim.

## Verification and limits

- `npm run build`, `tsc --noEmit --noUncheckedSideEffectImports`: PASS.
- `node --test tests/kernel.test.mjs tests/firewall.test.mjs tests/ledger.test.mjs tests/human-gate.test.mjs tests/risk-engine.test.mjs`: 17 PASS.
- `RISK_ENGINE_TEST_DATABASE_URL` set explicitly to an empty disposable localhost DB, then `node --test tests/risk-engine-db.test.mjs`: 1 PASS. Includes real PostgreSQL 16 + service/HTTP persistence, snapshot history, expected matrix outcomes, roles/tenant rejection, forged input denial, version conflicts, concurrent updates/evaluation, pagination, append-only protection, audit rollback and banned-user denial. Only Kernel + Risk Engine migrations were installed. HTTP identity is injected in this harness, not a real Neon login.
- Chrome DevTools MCP: signed-out page at actual 360px and 1440px has no document overflow, 9 labeled matrix cells, hidden private data, no Analytics, visible focus and unauthorized API 401/private-no-store. Playwright MCP was busy; Chrome supplied browser evidence. Authenticated browser workflow and real Neon account isolation: NOT RUN.

Use only synthetic non-sensitive test inputs pending environment/privacy approval. No model training/external provider calls, trial activation, enterprise approvals, automatic enforcement, pricing, production availability, commit, push or deploy. RE-01 and manual-change portion of RE-04 are partial; RE-02 has a rules-only draft subset; RE-03 hierarchical policy and RE-05 review workflow remain deferred. Do not label the full capabilities WORKING from these local checks.

## Changed-file inventory for this slice

- `src/layouts/AppLayout.astro` — system navigation only.
- `src/pages/app/risk-engine/index.astro`.
- `src/pages/app/api/risk-engine/assets/index.ts`.
- `src/pages/app/api/risk-engine/assets/[assetId]/index.ts`.
- `src/pages/app/api/risk-engine/assets/[assetId]/assessments.ts`.
- `src/pages/app/api/risk-engine/assets/[assetId]/revisions.ts`.
- `src/server/risk-engine/core.mjs`, `service.mjs`, `http.mjs`.
- `src/scripts/risk-engine.ts`, `src/styles/risk-engine.css`.
- `migrations/0005_aigas_risk_engine.sql`.
- `tests/risk-engine.test.mjs`, `tests/risk-engine-db.test.mjs`.
- `docs/RISK-ENGINE-DEVELOPMENT.md`.
- `docs/products/risk-engine/FEATURE-STATUS.yaml`, `API-CONTRACT.yaml` (local slice pointer; future contract unchanged).
- `Audit/2026-11-01-risk-engine-foundation.md`.
- `.agents/mind/01-mind-latest.md` (local context record).
