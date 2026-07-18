# Phase 0 — Reconnaissance + Plan
**Date**: 2026-07-18 23:43 +03:00
**Agent**: BrightAI Workspace Agent
**Scope**: Inventory + Risk Register + Written Plan for the P0/P1/P2 phased execution (per the role brief)
**Mode**: Senior — read-only, no file edits beyond this report

> **STOP**: هذا تقرير استطلاع فقط. ما تمسّنا أي ملف. الـ commit يكون من المستخدم، الدفع عبر main فقط PR، لا branch جديد (per brain line 18).

---

## 1. ملخص تنفيذي (Executive Summary)

المشروع monorepo فيه **3 منتجات متشابكة** تحت سقف واحد:

1. **Astro marketing site (root)** — 190 صفحة prerendered + 4 SSR routes (chat, csrf, lead, csp-report, health) عبر `@astrojs/node` (hybrid model — Astro 6.4.6 ما عنده `output: 'hybrid'` صريح). Groq primary + Gemini fallback. Redis-backed chat sessions مع in-memory degraded mode.
2. **Next.js 15 dashboard (`apps/dashboard`)** — multi-tenant عبر Clerk + subdomain middleware. 22+ routes (pages + API). RLS enforced على 18 جدول. RBAC matrix. Stripe billing (SAR plans). Hash-chained AuditLog. API-key auth للـ firewall.
3. **Workspace packages** — `config` (env + RBAC + constants)، `db` (Prisma 24 model + RLS + seed)، `firewall-detectors` (PII regex + NER + Arabic names + SAUDI_ID + redaction)، `lead-queue` (durable outbox + idempotency + retention).

الـ CI الحالي قوي (7 jobs: install, typecheck, lint, **test (firewall only)**, build-astro, build-dashboard, seo-gates, security-scan). **بس في فجوات حرجة**:

- **P0-1 (Confirmed)**: 6 dashboard pages + 1 API route يقرأون بـ `dbServiceRole` (BYPASSRLS) مع manual `organizationId` filter — **هذا يخالف قاعدة RLS enforcement**. أي نسيان للـ filter = تسريب بين الـ tenants.
- **P0-2 (Confirmed)**: vitest في CI يـ run فقط على `apps/dashboard` (firewall tests). Test suites في root (`scripts/*.test.mjs`) و packages (`packages/{db,firewall-detectors,lead-queue}/tests/`) و root vitest workspace مو في CI.
- **P0-3 (Confirmed)**: ما في Sentry / structured logging / audit-failure alert path. الموجود: `console.error` فقط.
- **P0-4 (Confirmed)**: ما في dashboard deploy pipeline. `deploy.yml` بس IndexNow trigger بعد Render deploy.
- **P0-5 (Confirmed)**: 20 ملف `src/pages` و `src/components` فيها كلمات "متوافق"/"معتمد" بدون guard. مثال: `index.astro:13` فيه "متوافق" 13 مرة. "certified" و "guaranteed" = 0 (الحمدلله).
- **P0-6 (Confirmed)**: `/kernel/*` pages (11 صفحة) تتـ render من `src/data/migrated-pages/kernel-*.json`. ما في badge "Demo" ثابت عليها.
- **P0-7 (Partial)**: Stripe webhook عنده `lastStripeEventId UNIQUE` + P2002 catch — **جيد**. Clerk webhook: يحتاج تحقق منفصل (مبدئياً optimistic).
- **P1-4 (Confirmed)**: الـ firewall يفحص آخر user message بس (الكود يقوله صراحة في chat/completions: "only the last user message — same as OpenAI does for safety filters"). **هذا فجوة أمنية** — PII في رسائل سابقة يتسرب.
- **P1-2 (Confirmed)**: الـ firewall يستخدم `DEFAULT_POLICY` ثابت. الـ `Policy` model في DB موجود، بس ما يربط مع firewall route. **لازم نربط policy per org.**

الـ risks الأخرى (P1-1, P1-3, P1-5) موجودة في الكود بس مو حرجة مثل اللي فوق.

---

## 2. Repository Inventory

### 2.1 Apps (pnpm workspaces)

| App | Stack | Routes/Pages | Status |
|---|---|---|---|
| `apps/dashboard` | Next.js 15 + Clerk + Prisma | 22+ pages + 14 API routes | ✅ builds in CI |
| (root) Astro | Astro 6.4.6 + `@astrojs/node` | 190 pages + 4 SSR routes | ✅ builds in CI |
| `apps/marketing` | (planned — not yet moved) | — | ⏳ future refactor |

**Dashboard pages** (`apps/dashboard/app/`):
- `(app)/dashboard` — home metrics
- `(app)/policies` — read-only (P1-2 needed)
- `(app)/requests` — placeholder (P1-1 needed)
- `(app)/audit` — audit log viewer
- `(app)/team` — members
- `(onboarding)/welcome` + `(onboarding)/step/[step]` — 5-step wizard
- `(settings)/settings/{tenant,security,features,usage,sso,profile,billing}`
- `(auth)/sign-in[[...sign-in]]`, `(auth)/sign-up[[...sign-up]]`, `(auth)/unauthorized`
- `invitation/[token]`

**Dashboard API routes** (`apps/dashboard/app/api/`):
- `health` (public)
- `firewall/chat/completions`, `firewall/health`, `firewall/redact`, `firewall/transcribe`
- `audit/list`, `audit/verify`
- `webhooks/clerk`, `webhooks/stripe`
- `billing/checkout`, `billing/portal`, `billing/cancel`, `billing/resume`

**Marketing SSR API routes** (`src/pages/api/`):
- `ai/chat` (Groq + Gemini + Redis session)
- `csrf-token`, `csp-report`, `health`, `lead`

### 2.2 Packages

| Package | Purpose | Models/Files | RLS? |
|---|---|---|---|
| `@brightai/config` | env validation (Zod) + RBAC matrix + constants + feature flags | 6 src files | n/a |
| `@brightai/db` | Prisma client + RLS wrapper + seed | 24 models + 7 migrations + 1 RLS test | ✅ 18 tables with FORCE RLS |
| `@brightai/firewall-detectors` | PII regex + Arabic names + SAUDI_ID + NER + redaction | 4 detectors + 5 test files | n/a |
| `@brightai/lead-queue` | Durable outbox + idempotency + retention sweep | 5 modules + 5 test files | n/a |

### 2.3 Prisma Models (24) — `packages/db/prisma/schema.prisma`

**Core**: Organization, User, Membership, Invitation, Passkey, TwoFactorBackupCode, Session
**Compliance**: OrganizationCompliance, Policy, AIRequest
**Integrations**: Integration, ApiKey
**Audit/Evidence**: AuditLog (hash-chained), TokenMapping (AES-256-GCM vault)
**Tenant infra**: Domain, OnboardingProgress
**PDPL**: DataExportRequest, DataDeletionRequest
**Billing**: Subscription (Stripe mirror), FeatureFlag, OrgFeatureFlag
**Usage**: AiUsageEntry, SamlConnection (SSO-001)
**Out-of-band**: LeadQueue (durable outbox, no RLS)

### 2.4 RLS (Postgres) — `packages/db/prisma/policies/rls.sql`

- 3 roles: `brightai_app` (RLS), `brightai_service` (BYPASSRLS), `brightai_readonly` (RLS, read-only)
- 18 tables with `FORCE ROW LEVEL SECURITY`
- `is_service_role()`, `current_org_id()`, `current_user_id()`, `set_tenant_context()` UDFs
- AuditLog hash-chain trigger (per-tenant prevHash)
- Convenience: `withTenant(orgId, userId, fn)` + `withServiceRole(fn)` in `packages/db/src/client.ts`
- `rls-isolation.test.ts` يثبت العزل بين tenants (لكن مو في CI)

### 2.5 Firewall — `apps/dashboard/lib/firewall/`

| Module | Purpose | Tested? |
|---|---|---|
| `auth/api-key.ts` | Bearer API-key → org | ✅ (integration.test) |
| `detectors/{regex,arabic-names,ner,piidetector}.ts` | PII detection | ✅ (4 tests) |
| `engine/redaction.ts` | mask/redact/tokenize/block | ✅ (redaction.test) |
| `engine/streaming-redaction.ts` | chunk-level redaction | ✅ (streaming-redaction.test) |
| `audit/audit-writer.ts` | persist + hash | ✅ (audit-durability.test) |
| `audit/durable.ts` | closed-failure semantics | ✅ (audit-durability.test) |
| `audit/hashchain.ts` | verify chain | ✅ (hashchain-tamper.test) |
| `vault/token-vault.ts` | AES-256-GCM tokenization | ✅ (vault-roundtrip.test) |
| `ratelimit/redis-bucket.ts` | 60/min/org token bucket | partial (no degraded-mode test) |

### 2.6 CI — `.github/workflows/`

| Workflow | Jobs | Status |
|---|---|---|
| `ci-build-guard.yml` | install → typecheck + lint + test (firewall) + build-astro + build-dashboard → seo-gates + security-scan → ci-success | ✅ green |
| `seo-guard.yml` | legacy fallback | ⚠️ single-job |
| `a11y.yml` | axe scan | ✅ |
| `deploy.yml` | **IndexNow trigger only** (post Render deploy, no actual deploy) | ❌ no dashboard deploy |

**CI test scope today**: only `pnpm exec vitest run --root apps/dashboard` (firewall tests). Missing from CI:
- `pnpm --filter @brightai/db db:rls:test` (cross-tenant leak test — exists, not in CI)
- `pnpm test` (root chat-session + csrf)
- `pnpm --filter @brightai/firewall-detectors test` (5 tests in workspace)
- `pnpm --filter @brightai/lead-queue test` (4 tests in workspace)
- 17 root `scripts/*.test.mjs` (legacy-seo-surface, content-acceptance, headers-config, etc.)

### 2.7 Test Inventory (~40 files, verified count = 40)

| Workspace | Path | Count |
|---|---|---|
| Root | `scripts/*.test.mjs` | 17 |
| Dashboard | `apps/dashboard/tests/{firewall,api,billing,feature-flags}` | 14 |
| DB | `packages/db/tests` | 1 |
| Firewall-detectors | `packages/firewall-detectors/tests` | 4 (+ 1 dup "k3-policy 2.ts") |
| Lead-queue | `packages/lead-queue/tests` | 4 (+ 1 helpers) |
| **Total** | | **40** |

### 2.8 Env Vars (names only — never values, per system prompt)

From `.env.example`:
- **Auth**: `JWT_SECRET`, `SESSION_SECRET`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `DASHBOARD_TOKEN`, `DASHBOARD_PASSWORD_HASH`
- **AI providers**: `GEMINI_API_KEY`, `GOOGLE_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY` + model names + endpoints
- **DB**: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_SERVICE` (implied — used in `dbServiceRole`)
- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
- **Redis**: `REDIS_URL`, `CHAT_SESSION_TTL_MS`, `CHAT_SESSION_MAX_ITEMS`, `CHAT_SESSION_MAX_CHARS`
- **Rate limit / body**: `RATE_LIMIT_REQUESTS_PER_MINUTE`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_STORAGE`, `MAX_BODY_BYTES`, `OCR_MAX_BODY_BYTES`, `MAX_UPLOAD_BODY_BYTES`
- **AI gateway**: `AI_GATEWAY_TIMEOUT_MS`, `AI_GATEWAY_MOCK_MODE`, `NVIDIA_REGION`, `NVIDIA_DATA_RESIDENCY`, `NVIDIA_KERNEL_TIMEOUT_MS`
- **Observability**: `LOG_LEVEL`, `GA4_MEASUREMENT_ID`, `GA4_API_SECRET`, `ANALYTICS_WEBHOOK_KEY` (⚠️ no Sentry DSN)
- **Chat API**: `BRIGHTAI_CHAT_KEY`, `CHAT_STREAMING_ENABLED`, `ALLOWED_ORIGINS`
- **Misc**: `NODE_ENV`, `PORT`, `EXCEL_FILE_PATH`, `FOCUS_API_URL`, `FOCUS_API_TOKEN`

### 2.9 Recent Work Surface (per `brain.md` Change Ledger)

- ~30 production scripts at root (`scripts/INVENTORY.md` exists, 199 scripts total inventoried).
- `apps/dashboard` is at 22+ routes, mature enough to be pilot-ready after P0/P1 fixes.
- Astro marketing site: 190 pages, kernel has interactive AI assistant (BAI-KRN-002 M1 ✅, M2/M3 pending).
- Many SEO/CRO/Schema improvements done (BAI-SEO-003-S1/S4/S6, BAI-CRO-003, BAI-VOC-001-C).
- META-CHANGES.csv (5.8KB) tracks CSV diff history.

---

## 3. Risk Register (P0/P1/P2)

### P0 — Security & Production Gates (must do before pilot)

| ID | Risk | Severity | Evidence | Acceptance |
|---|---|---|---|---|
| **P0-1** | **Tenant isolation not enforced in execution path** — 6 dashboard pages + 1 API route use `dbServiceRole` (BYPASSRLS) for reads with manual `organizationId` filter. Any bug in the manual filter = cross-tenant data leak. | **Critical** | `grep -rn dbServiceRole apps/dashboard/app` returns 21 sites; 7 are reads on tenant-scoped tables (policies, requests, dashboard, audit, team, onboarding, audit/list) | Migrate to `withTenant(orgId, userId, fn)` in all read paths. Allowed `dbServiceRole` sites: Clerk webhook, Stripe webhook, migrations/seed, api-key resolution, hash-chain writer (documented). Add cross-tenant leak test to CI. |
| **P0-2** | **CI test gate incomplete** — only `apps/dashboard` vitest runs in CI. Root scripts/tests + workspace package tests not in CI. | High | `ci-build-guard.yml` job "test" runs `vitest run --root apps/dashboard` only. Root has 17 `.test.mjs` files + 9 in packages/{db,firewall-detectors,lead-queue} | Add a `test-all` job in `ci-build-guard.yml` that runs `pnpm -r test` (or each workspace test individually) as required. CI fails when any test fails. |
| **P0-3** | **No observability / no audit-failure alerts** — no Sentry, no structured logging, no alert path on `logAuditFailure`. | High | `.env.example` has no `SENTRY_DSN`; `lib/firewall/audit/durable.ts` has `logAuditFailure` (not yet verified to alert). | Add Sentry (or equivalent) to dashboard server + marketing SSR routes. Structured JSON logging with request IDs. Alert path on `logAuditFailure`. Verify a thrown error in a route appears in error tracker with org context and NO PII. |
| **P0-4** | **No dashboard deploy pipeline** — `deploy.yml` is just a post-deploy IndexNow trigger. | High | `.github/workflows/deploy.yml` is 661 bytes, has only `indexnow` job. | New `dashboard-deploy.yml`: build dashboard → run `prisma migrate deploy` against staging DB → smoke-test `/api/health` → production gate. Document rollback (previous image + migrate resolve). Dry-run on a PR. |
| **P0-5** | **Banned-claims copy in marketing** — 20+ files in `src/pages` and `src/components` use absolute "متوافق" / "معتمد" without guard. `index.astro` has "متوافق" 13 times. | High | `grep -rn "متوافق" src/pages` → 10 files; `grep -rn "معتمد" src/pages` → 10 files | Replace with support-oriented phrasing per Section 11 guardrails. Add CI copy-lint script (regex list of banned claims) that fails CI. banned-claims scan returns zero. |
| **P0-6** | **No demo labeling on /kernel/* pages** — 11 pages render from `kernel-*.json` static data with no persistent "Demo" badge. | Medium | `src/pages/kernel/` has 13 .astro files; `src/data/migrated-pages/kernel-*.json` has 10 JSON files. No demo badge in layouts. | Add a persistent, visible "عرض توضيحي / Demo" badge to all kernel pages (and the dynamic `[slug].astro` template). Screenshot evidence. |
| **P0-7** | **Webhook idempotency for Clerk not verified** — Stripe is correct (uses `lastStripeEventId UNIQUE` + P2002 catch). Clerk needs same. | Medium | Stripe webhook verified to handle idempotency. Clerk webhook code at `apps/dashboard/app/api/webhooks/clerk/route.ts` not yet read in full. | Read Clerk webhook fully. Verify signature check. Add event-id dedup (insert into a `WebhookEvent` table or use Clerk's svix-id). Replaying the same event twice produces exactly one state change. Test it. |

### P1 — Product Differentiators (needed for pilot close)

| ID | Risk | Severity | Evidence | Acceptance |
|---|---|---|---|---|
| **P1-1** | **No approval workflow** — `AIRequest` model has status PENDING/APPROVED/REJECTED/AUTO_APPROVED, but no approve/reject server actions exist. `/requests` page is placeholder. | High | `apps/dashboard/app/(app)/requests/page.tsx` is placeholder. No `actions/approve` or `actions/reject` in the app dir. | Add server actions gated by RBAC (approver roles). Status transitions audited via hash chain. Requester notification hook (email or in-app). Full pending→approved/rejected flow with audit rows. |
| **P1-2** | **Policy CRUD missing + firewall ignores per-org policy** — firewall uses `DEFAULT_POLICY` constant, not the org's `Policy` from DB. | High | `chat/completions/route.ts:117` — `policy: { ...DEFAULT_POLICY, ... }`. Policy model exists, is read-only in UI. | Add Policy create/edit/activate in dashboard. Modify firewall route to load active policy per org (cache 30s, fallback to DEFAULT on miss). Integration test: changing policy changes firewall behavior. |
| **P1-3** | **Audit evidence export + chain verify UI incomplete** — `/api/audit/verify` exists, but no CSV/PDF export with verification result. | Medium | `audit/verify` route exists. No export endpoint found. | Add CSV + PDF export of AuditLog ranges including chain-verification result. "Verify chain" button wired to `/api/audit/verify`. Tampering a row in a test DB makes verification fail. |
| **P1-4** | **Firewall scans only the last user message** — PII in earlier messages leaks. | **Critical** | `chat/completions/route.ts:140` — comment: "Input PII pass (only the last user message — same as OpenAI does for safety filters)". `lastUserIdx` is computed. | Modify firewall to scan ALL messages (system, user, assistant history). Test proving PII in an earlier message is redacted before the LLM call. |
| **P1-5** | **No real org-scoped usage analytics** — `AiUsageEntry` exists in DB but no dashboard home wires it. | Medium | `(app)/dashboard/page.tsx` uses `dbServiceRole.policy.count` + `aIRequest.count` + `membership.count` (not usage). | Wire dashboard home to `AiUsageEntry`: requests/day, detections by PII type, blocked count, top users. Real data only. |

### P2 — Later (not in current scope)

| ID | Risk | Notes |
|---|---|---|
| P2-1 | Marketing /kernel/* pages API still call brightai-api.onrender.com in some places | Need refactor/cleanup ticket (per brain user profile) |
| P2-2 | Light theme not supported | Project is dark-only |
| P2-3 | CSS bundle still 175KB raw (render-blocking resolved, but raw size over budget) | Update `performance:budget` script to measure gzipped transferSize |
| P2-4 | KI-SYNTAX-2026-07-18-001 — 4 broken scripts causing 4 SyntaxErrors × 190 pages = 760 events | Defer |
| P2-5 | No PII in logs guard (no automated detection of PII in stderr) | Defer to P0-3 |

---

## 4. Decision Questions for Founder Approval (per Section 17)

> These are STOP conditions. I will not proceed without your answer.

1. **Data residency / processor jurisdiction** (Section 17.b): Clerk and Groq are **non-Saudi** processors. For PDPL-sensitive enterprise pilots, do we (a) accept this for Phase 1 and disclose, (b) require a Saudi-region deployment, or (c) self-host a Saudi region? This affects the dashboard's hosting strategy.
2. **CI test-gate scope** (P0-2): Do we add all 40 test files to CI, or prioritize a subset (e.g. firewall + rls-isolation + chat-session + csrf) and add others incrementally? Adding all at once increases CI time (~2-3 min more) but gives a stronger gate.
3. **Dashboard deploy pipeline** (P0-4): Do we add a full production deploy pipeline (with staging gate + migration), or just a staging-only deploy for now and deploy to production via Render dashboard?
4. **Compliance copy changes** (P0-5): Are you OK to mass-rewrite "متوافق"/"معتمد" across `src/pages` and `src/components` per the Section 11 guardrails? This is ~20 files of marketing copy.
5. **Banned-claims scope** (P0-5): Should the CI regex cover both Arabic and English terms? E.g. "متوافق", "معتمد", "certified", "compliant", "guaranteed", "endorsed", "SAMA-approved"?
6. **Webhook idempotency** (P0-7): Should we add a generic `WebhookEvent` table (Clerk + Stripe + future) or keep per-webhook dedup?
7. **P1-2 (per-org policy in firewall)**: Do we want hot-reload of policy (30s cache) or hard reload per request? Hot-reload needs `withTenant` migration to complete first (P0-1 dependency).

---

## 5. Execution Plan (proposed, awaits approval)

### Phase 0 — Reconnaissance (current)
- ✅ Inventory + risk register + plan written.
- ⏳ Awaiting founder decision on Section 4 questions.

### Phase 1 — P0 Security & Production Gates (estimated 3-5 days of work, ordered)

**P0-1 — Tenant isolation** (largest P0, blocks many other changes)
1. Inventory every `dbServiceRole` call site. Classify: read (→ withTenant) vs write (manual filter OK if user context exists).
2. For each read site, refactor to `withTenant(orgId, userId, fn)`.
3. Add a **cross-tenant leak test** to `packages/db/tests/` (org A cannot read org B policies/requests/audit) and wire it into CI.
4. Add a CI lint rule (or grep) that fails the build if `dbServiceRole` is imported in a read path.

**P0-2 — CI test gate**
1. Add a `test-all` job in `ci-build-guard.yml` that runs:
   - `pnpm -r test` (workspaces)
   - `pnpm --filter @brightai/db db:rls:test` (requires Postgres in CI; use a service container)
2. Make it a required job for `ci-success`.

**P0-3 — Observability**
1. Add Sentry (Next.js + Astro Node adapter) with org-scoped context.
2. Structured JSON logger with request ID (use `pino` or similar).
3. Wire `logAuditFailure` to Sentry as a high-severity alert.
4. **PII guard**: scrub PII patterns from logs before sending.

**P0-4 — Dashboard deploy pipeline**
1. New workflow: `dashboard-deploy.yml`.
2. Steps: install → migrate deploy (against staging DB) → build → smoke test `/api/health` → production gate.
3. Document rollback in `report/`.

**P0-5 — Banned-claims copy lint**
1. Write `scripts/lint-banned-claims.mjs` (regex list).
2. Run on `src/pages` and `src/components`.
3. Mass-rewrite existing matches to support-oriented phrasing.
4. Wire into `ci-build-guard.yml` as required.

**P0-6 — Demo labeling on /kernel/**
1. Add a persistent `<DemoBadge />` component to all kernel pages.
2. Add to `BaseLayout` for `/kernel/*` route group.
3. Screenshot evidence.

**P0-7 — Webhook idempotency (Clerk)**
1. Read Clerk webhook in full.
2. Add event-id dedup (either generic `WebhookEvent` table or per-webhook).
3. Test replay produces exactly one state change.

### Phase 2 — P1 Product Differentiators (after Phase 1 ships)

Order: **P1-4 first** (full-conversation scanning — security critical, blocks the pilot). Then P1-2 (policy management) + P1-1 (approval workflow) in parallel. P1-3 (audit export) and P1-5 (usage analytics) after.

**P1-4 — Full-conversation firewall scan** (P0-1 must complete first for org context)
1. Modify `chat/completions/route.ts` to scan ALL `messages[]`, not only the last user message.
2. Update streaming redaction accordingly.
3. Add a test: PII in message index 0 is redacted.

**P1-2 — Policy management CRUD**
1. Add Policy create/edit/activate server actions.
2. Modify firewall route to load active policy per org (30s cache).
3. Integration test: changing policy changes firewall behavior.

**P1-1 — Approval workflow**
1. Approve/reject server actions gated by RBAC.
2. Status transitions audited.
3. Notification hook (in-app first, email later).

**P1-3 — Audit export + verify UI**
1. CSV + PDF export of AuditLog ranges.
2. "Verify chain" button in UI.

**P1-5 — Usage analytics**
1. Wire `(app)/dashboard/page.tsx` to `AiUsageEntry` table (via `withTenant`).
2. Real data only.

### Phase 3 — Dashboard Experience (after P1 ships)

Per the role brief Section 9: 3 screens (نظرة عامة، الأدلة والتدقيق، السياسات والموافقات). Real data, Arabic-first RTL, loading/empty/error states.

### Verification Protocol (after every phase)

Per Section 13 of the role brief:
- `pnpm db:generate`
- `pnpm -r typecheck`
- `pnpm -r lint`
- all vitest suites (after P0-2)
- `pnpm --filter @brightai/db db:rls:test` (after P0-1)
- dashboard build
- marketing astro build
- banned-claims copy scan (after P0-5)
- axe pass on changed dashboard screens (after P3)

---

## 6. STOP — awaiting decision

**I am stopping here per Phase 0 protocol.** No file edits were made beyond this report.

**Required from founder**:
1. Review this plan.
2. Answer the 7 decision questions in Section 4.
3. Approve Phase 1 start (P0-1 to P0-7 in order).
4. Confirm: do I commit (per brain line 18, user commits), or do you want me to suggest commit messages + a PR and you push?

**Risks I will NOT execute without explicit approval**:
- Anything in Section 17 of the role brief (production credentials, data-residency decisions, pricing changes, deleting marketing pages, legal wording beyond guardrails, data-losing migrations, demo-vs-production ambiguity).

---

## 7. Appendices

### A. Files I read during this reconnaissance
- `AGENTS.md` (172KB — top 200 lines), `CLAUDE.md` (identical), `.agents/brain.md` (top 300 lines)
- `package.json` (root), `pnpm-workspace.yaml`, `MONOREPO.md`
- `.env.example`, `.github/workflows/ci-build-guard.yml`, `.github/workflows/deploy.yml`
- `astro.config.mjs` (top 100 lines)
- `packages/db/prisma/schema.prisma` (full)
- `packages/db/prisma/policies/rls.sql` (full)
- `packages/db/src/client.ts` (full)
- `packages/config/src/rbac.ts` (full)
- `apps/dashboard/middleware.ts` (full)
- `apps/dashboard/app/api/webhooks/stripe/route.ts` (full)
- `apps/dashboard/app/api/firewall/chat/completions/route.ts` (full)
- `apps/dashboard/app/api/audit/verify/route.ts` (full)
- `src/pages/api/ai/chat.ts` (top 150 lines — heavy file, will read in full during P1-4)
- `packages/db/tests/rls-isolation.test.ts` (top 60 lines)

### B. Greps I ran
- `grep -rn dbServiceRole apps/dashboard` → 21 sites, classified in P0-1
- `grep -rn "متوافق" src/pages` → 10 files
- `grep -rn "معتمد" src/pages` → 10 files
- `grep -rn "certified" src/pages` → 0
- `grep -rn "guaranteed" src/pages` → 0
- `find . -name "*.test.*" -not -path "*/node_modules/*"` → 40 files

### C. Counts verified
- 190 Astro pages
- 22+ dashboard pages
- 14 dashboard API routes
- 4 marketing SSR API routes
- 24 Prisma models
- 18 RLS-enforced tables
- 11 kernel marketing pages
- 40 vitest test files
- 7 CI jobs in ci-build-guard
- 0 dashboard deploy workflow

---

**Status**: Plan ready for review. STOPPED.
