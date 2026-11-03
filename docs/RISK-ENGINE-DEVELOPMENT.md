# Risk Engine — local implementation

Date: 2026-11-01. Scope: a small persisted, rules-only slice authorized by the owner; not the complete RE-01–RE-05 product or a commercial release.

## Lifecycle closure (2026-11-03, local source only)

- One declared method object (`METHOD`) now travels with list/history/treatment/export responses: concrete axes, 1–2 / 3–4 / 6–9 bands, inherent-vs-residual meaning, and explicit limits. It states that the method is a draft, human-entered deterministic estimate, not a calibrated probability, AI analysis, ISO/SDAIA approval or compliance claim; no 0–100 scale is introduced.
- Asset edits return `changed_fields`, `reassessment_required`, and `treatment_review_required`. An assessment counts only when its `asset_version` matches the current asset; stale scores remain readable as history and never become a current LOW. Read endpoints use `FOR SHARE`; only mutations take `FOR UPDATE`, so multi-query detail reads are consistent without serializing other readers.
- Treatment acceptance remains an administrative decision. The service requires a recorded rationale of at least 20 characters for `ACCEPTED`, keeps the existing independent-OWNER rule for HIGH, returns an `acceptance` record with the actor role and risk level, and states `deployment_authorized:false` and `policy_override:false`. `migrations/0021_aigas_risk_engine_acceptance_guard.sql` mirrors the rationale rule in SQL, but it is a local draft and is **not applied**.
- Export now includes the declared method, `authorization_scope`, and `data_quality` counts (assessed / not assessed / reassessment required / treatment review required / missing review date / accepted), while keeping tenant scope and the 10000-asset ceiling.
- The UI explains inherent vs residual risk, shows that a missing/current-version assessment yields “needs assessment” rather than LOW, and labels acceptance as a recorded administrative decision that does not authorize deployment.

Verification for this closure: `node --check` on the changed `.mjs` files and `git diff --check` only. Build, lint, typecheck, tests, browser, PostgreSQL and Neon writes were **NOT RUN** at the owner’s request. Migration 0021 requires human approval and an isolated target; production is untouched.

## Asset context and residual-risk extension (2026-11-03)

Local source now records data context, provider/model identifiers, a free-text organization-reported approval status, and ACTIVE/RETIRED lifecycle. The approval field is descriptive and unverified; retirement is reversible through a new asset revision and preserves assessment/treatment history. Each edit remains tenant-scoped and creates an append-only asset snapshot; restoring an older snapshot is a new edit, never a rewrite.

Treatment revisions separately capture control steps and a required residual-risk narrative. Residual risk has no numeric score. HIGH from the existing draft likelihood×impact rule is labelled as requiring human review; the assessment itself never grants deployment authority, and no separate approval/deployment integration is present in this local slice. This draft score/range remains unapproved per PRODUCT-SPEC.

Local additive schema file `migrations/0015_aigas_risk_engine_asset_context_residual_risk.sql` was applied to production on 2026-11-03 at the owner's explicit request. Post-apply schema inspection confirmed all six asset columns and `residual_risk_description`, including defaults and CHECK constraints. No branch was created. Runtime/auth/role/RLS behavior and application use remain NOT VERIFIED.

## Current lifecycle extension (2026-11-01)

State: `IMPLEMENTED_NOT_RUNTIME_VERIFIED`. No tests, builds, lint, typecheck, HTTP smoke or browser tools were run for this extension, at the owner's request. Earlier verification below is historical and does not cover this implementation.

`/app/risk-engine/{assetId}/` shares the existing workspace UI with the registry. Assessments now include `method_name`, optional `evidence_references` (up to 1000 characters), and a server-selected `previous_assessment_id`. Earlier immutable assessments are retained. The existing OWNER/ADMIN write contract is preserved; MEMBER remains read-only.

Treatment is a separate append-only history, bound to an exact assessment and asset version. OWNER/ADMIN save full revisions with descriptive `owner`, `status` (`OPEN`, `IN_PROGRESS`, `MITIGATED`, `ACCEPTED`), `control_description`, optional `review_on` (YYYY-MM-DD), and required `rationale`. Saves require `asset_version`, `assessment_id`, and `treatment_version` (0 for first save). An asset lock and expected treatment version reject stale writes. HIGH acceptance requires OWNER distinct from the evaluator, enforced in both service and SQL trigger. A new assessment or asset version makes the previous treatment require review; neither acceptance nor mitigation changes the risk score or authorizes deployment.

All write bodies additionally require `synthetic_data_confirmed: true`; the UI requires an unchecked acknowledgement each time. Real customer data is not enabled through this route. This declaration does not automatically inspect or certify submitted text. No provider/training, analytics or browser persistence is added.

Additional local APIs (all use the same Kernel identity, membership, product access and private/no-store boundary):

| Method | Path under `/app/api/risk-engine/` | Contract |
| --- | --- | --- |
| GET | `assets/?assessment_status=` | Adds NOT_ASSESSED / REASSESSMENT_REQUIRED / ASSESSED filter |
| GET | `assets/{assetId}/treatments/?page=1` | Treatment revisions, latest assessment/plan, stale flag, role capabilities |
| POST/PATCH | `assets/{assetId}/treatments/` | Full treatment revision with expected versions and synthetic acknowledgement; 201 after commit |
| GET | `actions/?page=1&treatment_status=&due=1` | Latest plan per asset; due means today/overdue in Asia/Riyadh |
| GET | `export/` | OWNER/ADMIN only; JSON organization summary of all assets and latest assessment/method/treatment, audited before response |

Export ignores UI filters and includes stale flags and scope limitations. A technical ceiling of 10000 assets rejects oversize exports rather than truncating; this is not a commercial quota. File download requires authenticated fetch and remains in memory until download. Assessment, asset and treatment histories remain available through their paginated endpoints.

For a fresh approved development target, apply `0005_aigas_risk_engine.sql`, `0008_aigas_risk_engine_lifecycle.sql`, then `0015_aigas_risk_engine_asset_context_residual_risk.sql`; the latter retains all existing history and only adds fields. Kernel access additionally uses administration migration 0006. Do not run unrelated product migrations as a prerequisite. A later local draft, `0021_aigas_risk_engine_acceptance_guard.sql`, only replaces the treatment guard function to require a 20-character acceptance rationale; it is review-only and has not been applied anywhere.

Neon MCP read-only inspection on 2026-11-03 found the sole branch `production` / `br-young-bird-b43proeb` in `young-frog-60183055` / `neondb`; `aigas_re_assets`, `aigas_re_asset_revisions`, `aigas_re_assessments`, and `aigas_re_treatment_revisions` are present. The inspected schemas do not yet include the 0015 fields. No development branch is available, so no schema change was applied. Runtime role/RLS, actual Auth flow and deployment remain external prerequisites.

## Earlier foundation behavior (historical description; extension above takes precedence)

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
| POST | `assets/` | name, owner, purpose, data_classification, optional context/provider/model fields, approval_status (descriptive only), lifecycle_status → asset (201) |
| PATCH | `assets/{assetId}/` | all asset fields + asset_version → saved asset/revision |
| DELETE | `assets/{assetId}/` | soft archive with reason, asset_version and synthetic-data acknowledgement; retains asset and history, appends a new version |
| GET | `assets/{assetId}/assessments/?page=1` | asset, assessments, canWrite, page, hasMore |
| POST | `assets/{assetId}/assessments/` | asset_version, likelihood, impact, likelihood_reason, impact_reason, controls_reason → assessment (201) |
| GET | `assets/{assetId}/revisions/?page=1` | append-only asset version snapshots with actor/time, tenant-scoped |

Classifications: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED. Name/owner/provider/model references: 2–120 when populated; purpose/reasons/control and residual-risk narrative: 2–500 after trimming. Approval status is free text only and is not verified. Lifecycle status is ACTIVE/RETIRED; archived items retain their full history. Server-generated IDs, timestamps and outcome fields cannot be supplied. Mutation retries are not deduplicated; after an ambiguous connection loss, refresh and inspect history before resubmitting. No usage billing, quota or idempotency guarantee is claimed.

The existing `docs/products/risk-engine/API-CONTRACT.yaml` remains a broader future `/v1/risk/` proposal. It is not the implemented route contract above.

## Environment and migration boundary

Neon MCP inspection on 2026-11-03 found project `young-frog-60183055`, sole branch `br-young-bird-b43proeb` (production), database `neondb`. After explicit owner authorization, migration 0015 was applied in one transaction. Follow-up schema inspection confirmed `data_context`, `provider_reference`, `model_reference`, `model_version`, `approval_status`, `lifecycle_status`, and `residual_risk_description` with their defaults/check constraints. No branch was created; `.env` was not changed. Runtime/Auth/RLS behavior remains unverified.

`migrations/0005_aigas_risk_engine.sql` is review-only and requires `0001_aigas_kernel.sql`. It creates the asset, immutable asset-revision and assessment tables, history indexes and append-only triggers, with RLS enabled on all three tables and PUBLIC access revoked. The original 0005 slice was applied to disposable local PostgreSQL; this follow-up adding asset revisions was **not re-tested** because the execution sandbox denied PostgreSQL shared memory. It was **not applied to Neon**. No dev branch was created, and the production migration permission previously granted for Kernel does not cover this migration.

Before connected use: approve a development DB target and migration, review a least-privilege server DB role and its RLS access path (no permissive browser grants), and verify real Neon user/organization flows. Existing local Auth origin restrictions remain unchanged. Signed-out UI keeps all organization data/forms hidden and directs users to Kernel. Missing Auth config reports setup required; missing tables or DB errors fail closed without a successful-save claim.

## Historical verification and limits (not rerun for lifecycle extension)

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
