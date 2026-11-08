# AIGAS Risk Engine — staging verification plan (synthetic only)

Status: **PREPARED, NOT RUN**. This document is an execution plan for an approved isolated staging target. It is not evidence that the application, database or UI works. Production is out of scope.

## Preconditions and approvals

| Item | Required owner | State |
| --- | --- | --- |
| Isolated staging database/branch with synthetic data only | DB owner + Security | NOT APPROVED |
| Apply `0005`, `0008`, `0015`, `0021`, `0026` in order | DB owner + Security | NOT RUN |
| Two synthetic identities: evaluator and independent OWNER/ADMIN | Product owner + Security | NOT CREATED |
| Auth origin and workspace configured for staging | Platform operator | NOT VERIFIED |
| Browser/HTTP evidence retained under `Audit/` | Release owner | NOT RUN |

Do not use customer data, real provider keys, production DSNs or production sessions. Do not describe this plan as an ISO 27005/31000, SDAIA, NCA or PDPL assessment. The method remains `draft-likelihood-impact-v1` and the acceptance policy remains `risk-acceptance-policy-v1`.

## Proposed synthetic fixtures

Use names such as `Synthetic hiring assistant`, `Synthetic public FAQ bot` and `Synthetic document summarizer`. Do not include real customer names, emails, phone numbers, contracts, health data or credentials.

## Cases

| ID | Scenario | Expected result |
| --- | --- | --- |
| RE-S1 | Create asset with synthetic fields; save revision | Asset version 1, revision 1, status `NOT_ASSESSED` |
| RE-S2 | Edit a field | Version increments, revision 2 appended, `REASSESSMENT_REQUIRED` |
| RE-S3 | No-op edit | No version increment, `changed:false` |
| RE-S4 | Assess 1×2 as evaluator | `LOW`, score 2, immutable assessment row |
| RE-S5 | Assess 3×3 | `HIGH`, `requires_human_review:true`, no deployment authority |
| RE-S6 | Open treatment with no residual estimate | Saved; residual fields null |
| RE-S7 | `MITIGATED` without residual | `400 RESIDUAL_ASSESSMENT_REQUIRED` |
| RE-S8 | `ACCEPTED` without review date | `400 ACCEPTANCE_REVIEW_REQUIRED` |
| RE-S9 | `ACCEPTED` with residual 1×1 and 20+ character rationale, by independent OWNER | Saved; `acceptance.residual_level=LOW`, policy version recorded |
| RE-S10 | HIGH inherent or HIGH residual accepted by the evaluator | `403 ACCEPTANCE_POLICY_DENIED` with self-acceptance reason |
| RE-S11 | HIGH accepted by ADMIN | `403 ACCEPTANCE_POLICY_DENIED` with OWNER-required reason |
| RE-S12 | Stale assessment or stale treatment version | `409`; no row written |
| RE-S13 | After acceptance, edit the asset or add a new assessment | Previous plan requires review; acceptance is not current |
| RE-S14 | Acceptance review date passes | `ACCEPTANCE_REVIEW_DUE` state appears in detail/actions |
| RE-S15 | Export as OWNER | `risk-register-v2`, same tenant only, no user IDs/snapshots/evidence/data context |
| RE-S16 | Export as MEMBER | `403` |
| RE-S17 | Export > 10000 assets | `422 EXPORT_TOO_LARGE`, no partial file |
| RE-S18 | Missing `0026` columns | `503 RISK_ENGINE_SCHEMA_MISSING`; no successful-save message |
| RE-S19 | Archived asset | Assessment/treatment writes rejected; history remains readable |
| RE-S20 | Keyboard/360px/1440px | Matrix columns and order unchanged; no horizontal page overflow; focus visible; 44px targets |

## Execution commands for the authorized operator

Run only after the approvals above. Use a disposable staging database; never point these at Neon production.

```bash
# 1. Apply migrations in order on the approved staging target.
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0005_aigas_risk_engine.sql
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0008_aigas_risk_engine_lifecycle.sql
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0015_aigas_risk_engine_asset_context_residual_risk.sql
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0021_aigas_risk_engine_acceptance_guard.sql
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 -f migrations/0026_aigas_risk_engine_residual_and_acceptance_policy.sql

# 2. Syntax/unit/DB checks (the DB test skips unless the URL is a localhost disposable DB).
node --check src/server/risk-engine/core.mjs
node --check src/server/risk-engine/service.mjs
node --check src/server/risk-engine/http.mjs
node --experimental-strip-types --check src/scripts/risk-engine.ts
node --test tests/risk-engine.test.mjs
RISK_ENGINE_TEST_DATABASE_URL="$STAGING_LOCAL_URL" node --test tests/risk-engine-db.test.mjs

# 3. Build and HTTP smoke only on the staging host.
npm run build
```

## Evidence to retain

- Migration output and `\d+ public.aigas_re_treatment_revisions` showing the residual columns and constraints.
- `SELECT proname, prosrc FROM pg_proc WHERE proname='aigas_re_guard_treatment'` showing the policy checks.
- Request/response pairs for RE-S7 to RE-S12 and RE-S15 to RE-S18, with synthetic IDs only.
- Before/after export checks proving the same tenant and the absence of user IDs/snapshots/evidence/data context.
- Browser screenshots at 360px and 1440px proving the matrix columns/order and the record-state messages.

## Exit criteria

The slice may move from `SOURCE_PRESENT` to `RUNTIME_VERIFIED` only when every case above has evidence, the export is checked for redaction, and the DB owner confirms the constraints and trigger. It still does not become `APPROVED` for production, beta, ISO alignment or regulatory compliance; those decisions belong to the product owner, security/privacy, legal and the release owner.
