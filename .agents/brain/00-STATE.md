---
file: 00-STATE.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
version: 2.7.78
agent_version: v2.3
last_updated: 2026-08-11 05:30 +03:00
deployed_version: غير موثّق (آخر deployed معروف: kernel-approvals commit e796cb77 في KRN-APPROVALS-M19؛ باقي الـ entries "verified locally" — القاعدة: المستخدم يلتزم وينشر بنفسه)
skills_ready: 7
---

# 00-STATE.md — الحقيقة الحالية للمشروع

> هذا الملف = **الوضع الراهن** المستخرَج من `02-LEDGER.md` (القاعدة: آخر قيمة في الـ ledger تفوز).
> **اقرأ هذا الملف كاملًا قبل أي مهمة** (القاعدة صفر) — ثم `01-DECISIONS.md`.
> أي رقم هنا مصدره entry فعلي في الـ ledger. لو رقم مو موثّق مكتوب "غير موثّق".
> القاعدة المطلقة: **ممنوع `git push` / `git commit` من الوكيل — المستخدم يلتزم وينشر بنفسه** (موثّقة في كل الـ entries الأخيرة).

---

## 1. الستاك والبنية الحالية

| الطبقة | التقنية | المصدر في الـ ledger |
|---|---|---|
| الموقع الرئيسي | Astro static prerender (`dist/client/` بعد node adapter) + `@astrojs/sitemap` | CSP-FIX / KRN-SC-M15 |
| لوحة التحكم | Next.js dashboard (`apps/dashboard/`) | مشار إليها في بنية الـ monorepo (AGENTS.md) |
| إدارة مهام الجودة | `apps/qc-task-manager` — Astro SSR + Tailwind + SQLite (better-sqlite3) | QC-SCHEMA-002 |
| إدارة الحزم | pnpm workspaces — الفلترة: `--filter @brightai/qc-task-manager` | QC-SCHEMA-002 |
| قاعدة البيانات (Prisma) | `packages/db` — Prisma + Postgres (29 model + 24 enum) | BAI-P1-TYPES-001 |
| الاستضافة | `node dist/server/entry.mjs` (standalone entry) + Cloudflare edge على الإنتاج؛ سكربتات post-build تلطّخ الـ entry (`patch-server-entry`) | KRN-JOURNEY-FIX / KRN-PG-FIX-01 |
| عدد المهارات الجاهزة | 7 (skills_ready) | front-matter brain.md |

## 2. الأرقام الحية (آخر قيمة موثّقة تفوز)

| المقياس | القيمة | آخر توثيق |
|---|---|---|
| QC test suite (`pnpm test`) | **89/89 ✅** (73 سابقة + 16 فحص init-db migration) | QC-DB-INIT-MIGRATE-001 |
| قبلها | 73/73 | QC-SCHEMA-002 / QC-DB-LAYER-001 / QC-ADMIN-USERS-002 |
| QC E2E admin-users | **49/49 ✅** (PORT=4398) | QC-ADMIN-USERS-002 |
| QC E2E auth-lockout | **42/42 ✅** (PORT=4323) | QC-AUTH-LOCKOUT-001 |
| QC E2E dashboard | **30/30 ✅** | QC-SCHEMA-002 (regression) |
| QC E2E delete-request | **31/31 ✅** | QC-SCHEMA-002 (regression) |
| QC DB — الجداول | **12 جدول** | QC-DB-INIT-MIGRATE-001 |
| QC DB — الفهارس | **26 فهرس** (تحقق إقلاع validateSchema) | QC-DB-LAYER-001 |
| QC DB — migrations الأعمدة | **19 عمود عبر ALTER** (COLUMN_MIGRATIONS) | QC-DB-INIT-MIGRATE-001 |
| QC schema conformance | 25/25 + 16/16 | QC-SCHEMA-002 |
| kernel axe WCAG 2.2 AA | **21/21 صفحة = 0 مخالفات** | KRN-M29-QA |
| kernel responsive | **80 combo / 0 failing** (16 صفحة × 5 viewports) | KRN-M29-QA |
| kernel CWV (Slow 4G) | **LCP 3.5–4.5s ❌ FAIL** · CLS 0.03–1.14 ❌ · TTFB 2–16ms ✅ | KRN-RERUN-AUDIT (كتلة يتيمة تحت KRN-TYPE-001) |
| sitemap URLs | **258 URL** | BAI-SEO-004-S7 |
| hreflang sets | 259 sets (0 أخطاء) | BAI-SEO-004-S7 |
| build HTML | 275 HTML / 251 URLs (مرجع متكرر) | CSS Cleanup / RSS Feeds |
| Prisma contract | 38/38 pass (`npm test`) بعد `pnpm db:generate` | BAI-P1-TEST-001 (كتلة يتيمة) |
| Prisma drift gate | 29 model + 24 enum متزامنين (exit 0) | BAI-P1-TYPES-001 |
| AI crawlers | 17 crawler × 5 مسارات = 90 استدعاء كلها 200 | BAI-IDX-CRAWL |
| orphan pages | **0** (كان 22) | BAI-IDX-04 |
| CSS bundle (gz) | 19.91KB (حد 50KB) | CSS Cleanup |
| عداد audit الحتمي | 12,483 سجل | KRN-AUDIT-M |

## 3. حالة قاعدة البيانات (QC Task Manager)

| البند | القيمة الرسمية | المصدر |
|---|---|---|
| متغير البيئة الرسمي | **`QC_DATABASE_PATH`** (`QC_DB_PATH` = alias قديم مقبول) | QC-DB-LAYER-001 |
| المسار الافتراضي (fallback) | `<app>/db/qc_tasks.db` (أي `apps/qc-task-manager/db/qc_tasks.db`) | QC-DB-LAYER-001 |
| الـ pragmas الأربعة | `journal_mode = WAL` · `foreign_keys = ON` · `busy_timeout = 5000` · `synchronous = NORMAL` | QC-DB-LAYER-001 |
| الـ migrations | `COLUMN_MIGRATIONS` (19 عمود) + `migrateDeleteRequests` — **تتزامن بين `db.ts` و `init-db.mjs`** | QC-DB-INIT-MIGRATE-001 |
| التصديرات | `db` (Proxy كسول) · `query` · `transaction` · `closeDatabase` + `validateSchema` عند الإقلاع | QC-DB-LAYER-001 |
| seed | 4 حسابات (admin/manager/supervisor/employee) تجري فقط لو `users` فاضي · `seed.sql` صار `INSERT OR IGNORE` (idempotent) | QC-DB-LAYER-001 · QC-SEED-IDEMPOTENT-001 |
| الوصول (SQLTools) | `.vscode/settings.json` اتصال "QC Tasks DB" جاهز — **gitignored**؛ SQLTools يمسك الـ DB الحقيقي (لا تقتله) | QC-DB-LAYER-001 |

## 4. الأوامر المعتمدة

| الأمر | العدد/الدور | المصدر |
|---|---|---|
| `pnpm build` (جذر الموقع) | exit 0 — 275 HTML / 251 URLs | CSS Cleanup |
| `NODE_ENV=production pnpm build` (QC) | **إلزامي** (وإلا كوكي الجلسة يخسر `Secure`) | QC-AUTH-LOCKOUT-001 |
| `pnpm typecheck` (QC) | 0 errors (7 hints معروفة) | QC-ADMIN-USERS-002 |
| `npm run typecheck` (جذر) | 5/5 Done 0 أخطاء | BAI-P1-TYPES-001 |
| `pnpm test` (QC) | **89/89** (73 + 16 migration) | QC-DB-INIT-MIGRATE-001 |
| `pnpm db:init` (QC) | `migrated 19 new column(s)` — آمن على DB قديمة + idempotent | QC-DB-INIT-MIGRATE-001 |
| `pnpm db:generate` (جذر) | توليد Prisma client قبل الاختبارات | BAI-P1-TEST-001 |
| `npm run verify:prisma:drift` | 29 model + 24 enum — CI gate | BAI-P1-TYPES-001 |
| `pnpm test:chat-session` | 16/16 (يتطلب ts-loader + strip-types) | BAI-P1-TEST-001 |
| `node scripts/verify-approvals.mjs` | 15/15 | KRN-APPROVALS-M19 |
| `npm run verify:audit` | 12/12 | KRN-AUDIT-M |
| `npm run verify:replay` | 27/27 | KRN-REPLAY-M20 |
| `npm run verify:reports` | 25/25 | KRN-REPORTS-STATS-M23-M24 |
| `npm run verify:stats` | 22/22 | KRN-REPORTS-STATS-M23-M24 |
| `npm run verify:models` | 25/25 | KRN-MODELS-CONNECTORS-API-M25-M26-M27 |
| `npm run verify:connectors` | 22/22 | KRN-MODELS-CONNECTORS-API-M25-M26-M27 |
| e2e QC scripts | `e2e-admin-users.mjs` 49 · `e2e-auth-lockout.mjs` 42 · `e2e-dashboard.mjs` 30 · `e2e-delete-request.mjs` 31 | QC-* |

## 5. المشاكل المفتوحة

| المشكلة | متى اكتُشفت | الحالة | entry في الـ ledger |
|---|---|---|---|
| `TypeError: e is not a constructor` على `/kernel/` — `KernelProductTour.astro` `import('driver.js')` interop فاشل | 2026-08-09 | open | KRN-RERUN-AUDIT (تحت KRN-TYPE-001) |
| `playground` يطلب `/js/pii-detector` بلا `.js` → 404 → **PII masking معطّل** | 2026-08-09 | open | KRN-RERUN-AUDIT |
| `evidence` يطلب `/js/certificate-verifier` بلا `.js` → 404 → **التحقق من الشهادات معطّل** (السبب الجذري: `moduleResolution: "bundler"` بلا امتداد في الإخراج) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| `datasets` عند 320px overflow +215px (`ds-dist` + `k-topbar__search`) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| 7 حقول بلا labels في playground | 2026-08-09 | open | KRN-RERUN-AUDIT |
| تباين `muted_on_elevated` = 4.3:1 (FAIL AA للنص الصغير) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| Role-aware nav غير منفّذ (CISO=Analyst = نفس الـ 19 رابط) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| `compliance` "تقرير PDF" = `window.print()` (P0 غير محلول) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| kernel CWV: LCP 3.5–4.5s ❌ + CLS 0.03–1.14 ❌ (Slow 4G) | 2026-08-09 | open | KRN-RERUN-AUDIT |
| `seo:legacy` (393 redirect ناقص) + `seo:content` (trust/index.html "not found") — يفحصان `dist/` بدل `dist/client/` | 2026-08-01 | open (قائم مسبقًا — خارج نطاق M15) | KRN-SC-M15 |
| `link-graph-validator --strict` exit 1 — يفحص `dist/` بدل `dist/client/` | 2026-08-09 | open (bug مُسبق مستقل) | SRC-LINK-REPAIR |
| `normalizeSitePath`/`canonicalizeSitePath` ما يدعم URLs كاملة | 2026-08-09 | open (موثّق — workaround regex) | SRC-LINK-REPAIR |
| فجوة تغطية: rate limit (429) + SSE/non-streaming contract غير مغطّاة — `BAI-P1-TEST-002` مقترح | 2026-08-09 | open (مؤجّل) | BAI-P1-TEST-001 |
| `verify-prisma-drift.mjs` field-level ما يدقق (existence-only) | 2026-08-09 | open (موثّق) | BAI-P1-TYPES-001 |
| CI step قديم `test -d …/@prisma+client@5.22.0…` هش (مقيّد بإصدار) | 2026-08-09 | open (يستاهل إصلاح مستقل) | BAI-P1-TYPES-001 |
| `lint:tokens` — 9 مخالفات hex مسبقة (سطور 4723-4739 `.kernel-ap-pii--*`) — قرار بعدم الإصلاح (تكسر تظليل PII) | 2026-08-01 | **won't fix — مقصود** | KRN-APPROVALS-M19.1 (تحت KRN-REPLAY-M20) |
| `verify-post-deploy` security headers: `x-frame-options SAMEORIGIN` متوقع `DENY` + `spec.mustMatch.test is not a function` | 2026-08-08 | open (خارج نطاق BAI-IDX-CRAWL) | BAI-IDX-CRAWL |
| `pagesOutsideSitemap=2` + `noHrefLinks=19` (audit خارج النطاق) | 2026-08-08 | open | BAI-IDX-04 |
| انجراف migrated/fresh DB: القديمة تبقى بحالات قديمة (بدون cancelled/urgent) + mime/size nullable | 2026-08-11 | open (موثّق في README) | QC-SCHEMA-002 |
| انجراف مقصود schema↔validation: DB تقبل cancelled/urgent + task-policy (4 حالات/3 أولويات) ترفض urgent | 2026-08-11 | open (للمستقبل — لا كسر حالي) | QC-SCHEMA-002 |
| `notifications` table موجودة لكن التطبيق يستخدم الإشعارات المشتقة (الربط المستقبلي متروك) | 2026-08-11 | open (متروك عمدًا) | QC-SCHEMA-002 |
| `qc_tasks 3.db` ملف شارد قديم (1 مستخدم) — gitignored، غير متعامل معه | 2026-08-11 | open (موثّق) | QC-DB-INIT-MIGRATE-001 |
| `KernelPageHeader.astro` غير مستخدم + مقياسه يشذ — لو استُخدم لازم يتحول لأدوار `--k-type-*` | 2026-08-09 | open | KRN-TYPE-001 |

## 6. الحالة غير الملتزمة (uncommitted)

كل الـ entries الأخيرة (2026-08-09 وما بعد) حالتها **"uncommitted — المستخدم يلتزم"**. الملفات المتأثرة حاليًا (git status عند بدء الجلسة):
- `M .agents/brain.md` (هذه إعادة الهيكلة)
- `M apps/qc-task-manager/db/seed.sql` (INSERT OR IGNORE — QC-SEED-IDEMPOTENT-001)

آخر deployed موثّق: commit `e796cb77` (KRN-APPROVALS-M19, 2026-08-01). ما بعدها = verified locally فقط، لم يُرصَد deploy.

## 7. القواعد المطلقة (من الـ preamble الأصلي)

- **لا commits من الوكيل** — المستخدم يلتزم بنفسه.
- **لا branch جديد نهائيًا** — الدفع عبر `main` الحالي فقط (PR).
- هذا مشروع **Astro**.
- الكتابة في الـ brain فقط بعد التحقق من نجاح التغيير.
- اللغة: عامية سعودية في الشرح + English في الكود والـ identifiers.
