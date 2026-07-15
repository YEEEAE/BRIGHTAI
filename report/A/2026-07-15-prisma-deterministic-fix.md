# Prisma Deterministic Fix — إزالة CRITICAL-02 (Schema Drift + Generation Lifecycle)

**Date**: 2026-07-15
**Agent**: BrightAI Workspace Agent
**Task ID**: PRISMA-DETERMINISTIC-FIX-2026-07-15
**Mode**: Senior
**Related KI**: KI-DASH-002 (open → **resolved**)
**Predecessor**: DASHBOARD-BUILD-FIX-2026-07-15 (CRITICAL-01)

---

## الملخص التنفيذي

كان `pnpm dashboard:build` يكمل بنجاح الـ webpack phase لكن يفشل تحت typecheck بـ 40+ errors بسبب **Prisma schema drift**. الـ root cause الفعلي أعمق: **الـ Prisma client ما كان مولّد أصلاً** قبل هذا الـ fix — `node_modules/.pnpm/@prisma+client@.../index.d.ts` غير موجود، يعني أي clone جديد ما يقدر يستورد types من `@prisma/client` أو `@brightai/db`.

طبّقت 3 محاور:

1. **Schema/code alignment**: رجّعت الـ schema fields عشان تطابق اللي الكود والـ seed والـ tests يستخدمونه فعلاً. الـ schema كان renamed بعيداً عن الكود. الـ fix: 5 renames + 2 additions في `schema.prisma`، 10 fixes في `seed.ts`، 4 surgical fixes في dashboard code. **أصغر تغيير بـ LoC مقارنة بـ rename الكود كله (15+ ملف)**.

2. **Generation lifecycle**: أضفت `"postinstall": "prisma generate"` لـ `packages/db/package.json`. أي clone جديد + `pnpm install` يولّد الـ client تلقائياً. يضمن deterministic generation عبر كل البيئات.

3. **Transaction types**: أصلحت 2 type issues:
   - `packages/db/src/client.ts`: `readonly` array incompatibility → mutable `Array<'warn' | 'error'>`.
   - `apps/dashboard/lib/session.ts`: `runInTenantContext` يستخدم `Prisma.TransactionClient` (canonical Prisma 5 type) بدل `Omit<PrismaClient, '$connect' | '$disconnect' | ...>` الـ fragile.

**النتيجة**: صفر errors TypeScript على `apps/dashboard` و `packages/db`. الـ `next build` ينجح full pipeline. الـ firewall vitest tests 70/70 (لا regression). CRITICAL-02 مرفوع.

---

## الملفات المتغيّرة

| File | Change Type | الوصف |
|---|---|---|
| `packages/db/prisma/schema.prisma` | Edited | 5 field renames + 2 field additions. User: `name→fullName`, `nameAr→fullNameAr`, `locale→primaryLocale`. Domain: `verified→isVerified`. Invitation: `tokenHash→token`. + `Policy.priority Int @default(0)`. + `Membership.acceptedAt DateTime?`. |
| `packages/db/package.json` | Edited | + `"postinstall": "prisma generate"` lifecycle script. |
| `packages/db/src/client.ts` | Edited | `log` array: dropped `as const`, type cast to mutable `Array<'warn' \| 'error'>` (compatible with Prisma's `(LogLevel \| LogDefinition)[]`). |
| `packages/db/prisma/seed.ts` | Edited | 10 fixes surfaced بعد أول `prisma generate`. enum value drift (`DOMAIN_ALLOW/PII_BLOCK/REVIEW_REQUIRED → CUSTOM/DATA_PRIVACY/ACCESS_CONTROL`)، `sslStatus: 'ACTIVE' → 'SSL_ACTIVE'`, `emailVerified: new Date() → true`, `reviewNote → reviewNotes`, `keyHash → hashedKey`, `keyPrefix → prefix`, `currentStep: 'CONNECT_INTEGRATION' → 'FIRST_INTEGRATION'`, `status: 'CONNECTED' → 'ACTIVE'`, `ipHash → hash`, `configEncrypted → config`, إزالة `primaryLocale` من Organization create. |
| `apps/dashboard/lib/session.ts` | Edited | + `import type { Prisma } from '@brightai/db'`. `runInTenantContext` يستخدم `Prisma.TransactionClient` بدل `Omit<PrismaClient, ...>`. `fullNameAr: undefined ?? null` (was `undefined`، schema wants `string \| null`). |
| `apps/dashboard/lib/tenant.ts` | Edited | إزالة `deletedAt: null` من Domain query (الحقل مو موجود في الـ schema). |
| `apps/dashboard/lib/firewall/llm/groq-client.ts` | Edited | + `let finalUsage: ... \| null = null;` بعد `let finalModel` (كان undefined variable). |
| `apps/dashboard/app/api/webhooks/clerk/route.ts` | Edited | `emailVerified: new Date() → true` (schema is Boolean). |

**ما تمس**: كل الـ Astro marketing files، `lib/firewall/detectors/ner.ts`، NER tests، firewall logic، الـ firewall test helpers، `middleware.ts`، `app/(app)/layout.tsx`.

---

## نتائج التحقق

| Check | Result | Notes |
|---|---|---|
| `pnpm exec tsc --noEmit` (dashboard) | ✅ **صفر errors** | من 40+ errors → 0. |
| `pnpm exec tsc --noEmit` (packages/db) | ✅ **صفر errors** | من 10 seed errors → 0. |
| `pnpm run build` (next build full pipeline) | ✅ **نجح** | webpack + ESLint + typecheck. 22 routes compiled (api/firewall/* + dashboard + policies + requests + team + invitation + sign-in/sign-up + settings/* + welcome + unauthorized). Middleware: 76.8 kB. |
| `pnpm exec vitest run` | ✅ **70/70 passed** | regex 31 + redaction 10 + token-vault 7 + piidetector 9 + ner 13 with model load. No regression vs CRITICAL-01 state. |
| `pnpm exec prisma generate` (manual) | ✅ Generated Prisma Client v5.22.0 in 173ms | All required exports present (User, Membership, Invitation, Policy, Domain, enums). |
| `postinstall: "prisma generate"` lifecycle | ✅ registered | `pnpm install` on clean clone auto-generates client. |
| Deterministic generation | ✅ Idempotent | Re-running `prisma generate` produces identical output. |

**Generation lifecycle test (simulated)**:
- Pre-fix state: `node_modules/.pnpm/@prisma+client@.../index.d.ts` كان **غير موجود** — يعني `import { db } from '@brightai/db'` كان يفشل لو الـ client ما اتولّد يدوياً.
- Post-fix state: `prisma generate` ينتج `index.d.ts` مع كل الـ types. الـ `postinstall` script يضمن هذا على أي clone جديد.

---

## Risks المتبقية

### Production rollout (مهم — خارج نطاق هذا الـ brief)
- **DB production** قد يحتوي على schema بـ `name/nameAr/locale/verified/tokenHash` الـ قديم. لو تنشر schema الجديد بدون migration، يفشل الـ startup.
- **mitigation**: قبل deploy للإنتاج، شغّل `pnpm --filter @brightai/db db:migrate:dev --name rename_user_fields_to_fullName` → راجع الـ migration SQL → ادفعها مع deploy → `pnpm --filter @brightai/db db:migrate:deploy`.

### KI-DASH-003 (open — security)
- `app/invitation/[token]/page.tsx` يستخدم raw token في `where: { token: ... }` لكن schema field `token` يُفترض يكون hash. الـ code يحتاج `sha256(rawToken)` قبل lookup.
- **خارج نطاق هذا الـ brief** — CRITICAL-02 كان عن schema drift، مو security fix.
- mitigation: منفصل KI، منفصل fix.

### CI install time
- `prisma generate` على كل `pnpm install` يضيف ~5-10s. negligible في dev، لكن لو يصير bottleneck في CI، mitigation: cache `node_modules/.prisma/` بين runs.

### `runInTenantContext` type signature change
- لو أحد استخدم الـ callback مع type يتوقع full `PrismaClient` (مو `Prisma.TransactionClient`)، الـ types ما تطابق.
- **الـ runtime صحيح** (الـ transaction callback يستلم transaction client). الـ type change هو الـ correct fix.
- mitigation: لا شيء — أي code كان bug.

---

## Follow-up Suggestions

1. **أولوية #1 — KI-DASH-003 (security fix)**: `app/invitation/[token]/page.tsx` لازم يـ hash raw token قبل `where: { token: tokenHash }` lookup.
2. **أولوية #2 — CI guard**: أضف `scripts/verify-prisma-generated.mjs` يفحص إن `node_modules/.pnpm/@prisma+client@.../index.d.ts` موجود بعد `pnpm install`. يشغّل في `verify:all`.
3. **أولوية #3 — Production migration**: قبل launch، شغّل `db:migrate:dev` → راجع SQL → ادفعها.
4. **أولوية #4 — Seed cleanup**: الـ seed.ts الآن فيه 200+ سطر. ممكن يستفيد من data factories (`@brightai/test-utils` أو ما شابه).

---

## خطة الـ Rollback

per brief: "الرجوع إلى commit schema/client السابق".

```bash
cd /Users/yzydalshmry/Desktop/BRIGHTAI

# 1. رجّع كل التغييرات كوحدة واحدة
git revert <commit-sha>  # يحتوي schema + client + postinstall + كل الـ code sync

# 2. احذف الـ Prisma client generated عشان يجبر regeneration على install الجاي
rm -rf node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0

# 3. ارجع للـ lockfile + install من جديد
pnpm install --frozen-lockfile

# 4. (اختياري) أوقف postinstall مؤقتاً لو يـ conflict مع rolled-back schema
# (بحذف السطر من packages/db/package.json)

# KI-DASH-002 يرجع لـ open.
# CRITICAL-01 (KI-DASH-001) ما يتأثر.
```

**Rollback safety**: كل التغييرات reversible بـ `git revert` واحد. الـ Prisma client regeneration idempotent.

---

## الـ commit message المقترح

```
fix(db): make Prisma client generation deterministic + remove CRITICAL-02

The Prisma client was never generated in this repo (node_modules/.pnpm/
@prisma+client@.../index.d.ts was missing), causing 40+ TS errors in the
dashboard and 10 errors in seed.ts when types finally became available.

Fix (single atomic unit, reversible via `git revert`):

1. Generation lifecycle:
   - Add `"postinstall": "prisma generate"` to packages/db/package.json
     so every clone auto-generates the client after `pnpm install`.

2. Schema/code alignment (rename schema to match the dominant code):
   - User.name → fullName, nameAr → fullNameAr, locale → primaryLocale
   - Domain.verified → isVerified
   - Invitation.tokenHash → token
   - + Policy.priority Int @default(0)
   - + Membership.acceptedAt DateTime?
   These align with what lib/session.ts, app/(app)/* pages, seed.ts,
   and rls-isolation.test.ts already reference. Zero code changes
   needed in 15+ dashboard files.

3. Transaction types:
   - packages/db/src/client.ts: dropped `as const` on log array — Prisma
     expects mutable `(LogLevel | LogDefinition)[]`, not readonly tuple.
   - apps/dashboard/lib/session.ts: `runInTenantContext` uses
     `Prisma.TransactionClient` (canonical Prisma 5 type) instead of
     the fragile `Omit<PrismaClient, '$connect' | '$disconnect' | ...>`.

4. Code sync fixes (surfaced by first prisma generate):
   - groq-client.ts: declare `finalUsage` variable (was undefined).
   - webhook/clerk/route.ts: emailVerified: new Date() → true (Boolean).
   - tenant.ts: remove `deletedAt: null` from Domain query.
   - session.ts: `fullNameAr ?? null` to match schema's `string | null`.
   - seed.ts: 10 enum value / field name fixes (see report).

Verification:
- pnpm exec tsc --noEmit (dashboard) → 0 errors (was 40+)
- pnpm exec tsc --noEmit (packages/db) → 0 errors (was 10)
- pnpm run build (full pipeline) → success, 22 routes compiled
- pnpm exec vitest run → 70/70 passed (no regression)
- prisma generate → deterministic, idempotent, completes in 173ms

Note for production rollout:
  Before deploying, run `pnpm --filter @brightai/db db:migrate:dev
  --name rename_user_fields_to_fullName` and review the migration SQL.
  Then `pnpm --filter @brightai/db db:migrate:deploy` against prod.

Closes: #CRITICAL-02
Refs: KI-DASH-002 (this), KI-DASH-003 (security follow-up)
```

---

## الخلاصة

- ✅ CRITICAL-02 — **resolved** (schema drift + generation lifecycle + transaction types).
- ✅ CRITICAL-01 — preserved (لا regression).
- ✅ Firewall tests — preserved (70/70).
- ⚠️ KI-DASH-003 (security — invitation token hashing) — open، منفصل.
- 🎯 **التوصية**: قبل launch، شغّل migration script + عالج KI-DASH-003.