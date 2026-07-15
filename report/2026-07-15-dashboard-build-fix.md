# Dashboard Build Fix — إزالة مانع إطلاق CRITICAL-01 تحت Node 22

**Date**: 2026-07-15
**Agent**: BrightAI Workspace Agent
**Task ID**: DASHBOARD-BUILD-FIX-2026-07-15
**Mode**: Senior
**Related KI**: KI-DASH-001 (resolved)، KI-DASH-002 (open — منفصل)

---

## الملخص التنفيذي

كان `pnpm dashboard:build` يفشل تحت Node 22.22.3 بثلاث errors متشابكة: (1) `app/layout.tsx` يستورد `@clerk/localizations` والحزمة مو مثبَّتة، (2) webpack يحاول bundle الـ native binaries `onnxruntime-node/bin/napi-v6/{darwin,linux,win32}/*/onnxruntime_binding.node` — يفشل parsing لأن `.node` مو JS، (3) خلف هذه الـ failures: tsconfig invalid value + ESLint plugin مفقود + **schema drift واسع** بين `apps/dashboard/**` و `packages/db/prisma/schema.prisma` (40+ TS errors — CRITICAL-02 منفصل، تحت).

طبّقت الحلّ كوحدة واحدة قابلة للـ rollback:
1. **Localization dep**: `@clerk/localizations@3.37.8` + `@clerk/nextjs@6.12.0` exact (caret كان يـ pull `6.39.5` اللي peers تضيق Next `^15.2.3+` — غير متوافق مع الـ pinned `15.1.6`).
2. **Next config match**: `serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node']` — Next 15 يترك Node يحلّ native modules وقت التشغيل. webpack ما يـ parse الـ binaries بعد الآن.
3. **TS pre-existing bugs**: `tsconfig.json` `ignoreDeprecations: "6.0"` → `"5.0"` (invalid value كان يكسر `tsc --noEmit` فوراً).
4. **ESLint deps**: `@eslint/eslintrc` + `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` كـ devDeps (الـ rule `@typescript-eslint/no-unused-vars` كان معرَّف بدون plugin).

**النتائج**:
- ✅ `pnpm exec vitest run` → **70/70** tests passed عبر 5 ملفات (regex + redaction + token-vault + piidetector + **NER with model load**).
- ✅ `pnpm run build` → "Compiled successfully" (webpack ✅).
- ❌ `pnpm exec tsc --noEmit` → **40+ errors** — كلها schema drift (CRITICAL-02 منفصل).

**الـ constraint محفوظ**: لا تعطيل NER بصمت، لا mock production. NER يبقى lazy-loaded عبر `await import('@huggingface/transformers')` في `lib/firewall/detectors/ner.ts:83`، يحمّل `Xenova/bert-base-multilingual-cased-ner-hrl` بنجاح (2 ثانية cold start، verified by vitest).

---

## الملفات المتغيّرة

| File | Change Type | الوصف |
|---|---|---|
| `apps/dashboard/package.json` | Edited | + `@clerk/localizations@3.37.8`, pinned `@clerk/nextjs@6.12.0` exact (was `^6.12.0` — caret كان يـ pull 6.39.5 مع peers incompatible). + devDeps: `@eslint/eslintrc@^3.3.6`, `@typescript-eslint/eslint-plugin@^8.63.0`, `@typescript-eslint/parser@^8.63.0`. |
| `apps/dashboard/next.config.mjs` | Edited | + `serverExternalPackages: ['@huggingface/transformers', 'onnxruntime-node']` مع comment يوثّق السبب. |
| `apps/dashboard/tsconfig.json` | Edited | `"ignoreDeprecations": "6.0"` → `"5.0"` (was invalid value). |
| `apps/dashboard/app/(app)/dashboard/page.tsx` | Edited | Line 40: defensive `?? 'مستخدم'` fallback (يحمي ضد User بدون اسم — نادر بس ممكن في test fixtures). |
| `pnpm-lock.yaml` | Auto-regenerated | pnpm يعيد حلّ الـ dependency graph بعد كل install. |
| `apps/dashboard/next-env.d.ts` | Auto-regenerated | Next.js يولّد هذا تلقائياً في كل build. |
| `apps/dashboard/next.config.mjs.bak.20260715` | Created (backup) | Pre-fix snapshot للـ rollback. |
| `apps/dashboard/package.json.bak.20260715` | Created (backup) | Pre-fix snapshot للـ rollback. |

**ما تمس**: `lib/firewall/**` (كله — NER/ONNX logic محفوظ)، `middleware.ts`، `app/(app)/layout.tsx`، `app/api/health/route.ts`، `app/api/firewall/health/route.ts`، `lib/session.ts` (schema drift منفصل في KI-DASH-002)، كل الـ `packages/db/**`.

---

## نتائج التحقق

| Check | Result | Notes |
|---|---|---|
| `pnpm exec vitest run` | ✅ **70/70 passed** | regex (31) + redaction (10) + token-vault (7) + piidetector (9) + **ner (13 with model load OK)**. |
| `pnpm exec vitest run tests/firewall/ner.test.ts` | ✅ 13/13 | NER model `Xenova/bert-base-multilingual-cased-ner-hrl` يحمّل عبر dynamic import + ONNX runtime يحلّ native binding بشكل صحيح (Node runtime، مو webpack-bundled). |
| `pnpm run build` (webpack phase) | ✅ "Compiled successfully" | كل الـ ONNX native modules externalized. webpack warnings فقط (autoprefixer + cache serializer) — non-blocking. |
| `pnpm exec tsc --noEmit` | ❌ **40+ errors** | كلها schema drift — `lib/session.ts` + 10 ملفات dashboard + 3 ملفات packages/db. KI-DASH-002 منفصل. |
| `pnpm run build` (full pipeline: compile + lint + typecheck) | ❌ **fails on typecheck** | webpack ينجح، ESLint ينجح (مع الـ plugins المضافة)، typecheck يفشل. **ما في BUILD_ID**، `next start` ما يشتغل. |

**الـ NER verification بالتفصيل** (`tests/firewall/ner.test.ts`، 13 اختبار):
- ✅ Pipeline lazy-load عبر `await import('@huggingface/transformers')` — يعمل production-correct.
- ✅ `Xenova/bert-base-multilingual-cased-ner-hrl` يحمّل من cache (2 ثانية cold start).
- ✅ Arabic name detection يعمل (`detectAndRedact` مع NER enabled).
- ✅ Fallback إلى regex-only عند `FIREWALL_NER_ENABLED=false` — يـ passes smoke test.
- ✅ `isNerReady()` يـ reflect الـ state الصحيح.

---

## Risks المتبقية

### CRITICAL-02 (KI-DASH-002) — خارج نطاق هذا الـ brief
- 40+ TS errors بسبب Prisma schema drift. **أكبر blocker للـ launch الفعلي**.
- يحتاج قرار معماري منفصل: rename الكود (15+ ملف) ولا Prisma migration يضيف الحقول القديمة.
- user اختار "وقف + توثيق كنطاق منفصل" — الخيار الأسلم. لكن `pnpm dashboard:build` ما يكمّل بدون حلّ هذا.

### Peer dep warning (تحذير، مو error)
- `@clerk/shared@3.47.x` يحب `react@~19.0.3` (patch-level exact).
- المشروع عنده `react@19.0.0` — تحذير peer، ما يكسر build.
- لو ظهرت runtime issues مع Clerk → bump React إلى `19.0.3+` (commit منفصل).

### tsconfig fix
- `"6.0"` كان invalid value، صححت إلى `"5.0"`. ما عندي record ليش كان `"6.0"` (anticipating TS 6.0؟ typo؟).
- لو أحد رجعها لـ `"6.0"`، `tsc --noEmit` يفشل فوراً — اكتشاف سريع.

### Backups `.bak.20260715`
- ملفات إضافية في `apps/dashboard/`. **لازم تُحذف مع الـ commit النهائي** (clean rollback story).
- موجودة الآن للـ safety فقط.

---

## Follow-up Suggestions

1. **أولوية #1 — KI-DASH-002 (CRITICAL-02)**: اتخاذ قرار معماري + تنفيذ. لو rename الكود، شغل ESLint + tsc + vitest بعد كل batch. لو Prisma migration، شغل `pnpm --filter @brightai/db db:migrate:dev` + تحقق من الـ seed + tests.
2. **أولوية #2 — CI guard للـ schema drift**: أضف `scripts/verify-prisma-schema-sync.mjs` يفحص إن كل `Pick<Model, ...>` في الـ dashboard يطابق الـ Prisma schema fields. يشغّل في `verify:all` script.
3. **أولوية #3 — pnpm peer dep hardening**: أضف `.npmrc` مع `strict-peer-dependencies=true` عشان pnpm يفشل بدل ما يحذّر. الـ current config permissive جداً.
4. **أولوية #4 — تقسيم الـ typecheck errors**: عزل schema drift errors في تقرير منفصل (مثل `report/2026-07-15-dashboard-schema-drift.md`) عشان يبقى الـ build blocker منفصل عن CRITICAL-01.

---

## خطة الـ Rollback

لو احتجت ترجع كل التغييرات (per brief: "revert dependency/config changes as one unit"):

```bash
cd /Users/yzydalshmry/Desktop/BRIGHTAI

# 1. رجّع الملفات المعدّلة
git checkout -- apps/dashboard/package.json \
                apps/dashboard/next.config.mjs \
                apps/dashboard/tsconfig.json \
                "apps/dashboard/app/(app)/dashboard/page.tsx"

# 2. احذف الـ backups
rm apps/dashboard/next.config.mjs.bak.20260715 \
   apps/dashboard/package.json.bak.20260715

# 3. ارجع للـ lockfile السابق
pnpm install --frozen-lockfile

# 4. (اختياري) تحقق إن الحالة رجعت
pnpm exec tsc --noEmit --project apps/dashboard  # يفشل فوراً — CRITICAL-01 رجع
```

**Rollback safety**:
- كل التغييرات reversible بـ `git checkout`.
- ما في تغيير على git remote (committed: pending — user commits per project convention).
- الـ backups `.bak.20260715` تسهّل الـ manual rollback بدون git.
- CRITICAL-01 يرجع لوحده. **CRITICAL-02 ما يتأثر** (كان موجود قبل، ما عدّلنا الـ schema أو الـ schema-dependent code).

---

## الـ commit message المقترح

```
fix(dashboard): remove CRITICAL-01 build blocker under Node 22

pnpm dashboard:build was failing due to three intertwined errors:

1. app/layout.tsx imports @clerk/localizations (missing dep)
2. webpack tries to bundle onnxruntime-node native binaries (.node files
   fail to parse as JS)
3. ESLint plugin @typescript-eslint missing; tsconfig has invalid
   ignoreDeprecations: "6.0"

Fix (single atomic unit, reversible via `git checkout`):

- Install @clerk/localizations@3.37.8 + pin @clerk/nextjs@6.12.0 exact
  (caret was pulling 6.39.5 with Next ^15.2.3+ peer incompatible with
  pinned Next 15.1.6)
- Add `serverExternalPackages: ['@huggingface/transformers',
  'onnxruntime-node']` to next.config.mjs — Next 15 lets Node resolve
  native modules at runtime, no webpack parsing of .node binaries
- Fix tsconfig ignoreDeprecations "6.0" → "5.0"
- Install @eslint/eslintrc + @typescript-eslint/eslint-plugin + parser
  as devDeps
- Defensive `?? 'مستخدم'` fallback in dashboard/page.tsx:40

Constraints respected:
- No NER mocking — lib/firewall/detectors/ner.ts unchanged, still
  lazy-loads via `await import('@huggingface/transformers')`
- No silent disabling — server-only boundary preserved
- Production-real verification — vitest NER test loads the actual
  Xenova/bert-base-multilingual-cased-ner-hrl model (~2s cold start)

Verification:
- pnpm exec vitest run → 70/70 passed (regex + redaction + token-vault
  + piidetector + ner)
- pnpm run build → "Compiled successfully" (webpack ✅)

Discovered (separate scope, NOT fixed here):
KI-DASH-002 — Prisma schema drift (User.fullName → name, Domain
relations, etc.) causes 40+ TS errors that fail the typecheck phase.
See report/2026-07-15-dashboard-build-fix.md for details.

Closes: #CRITICAL-01
Refs: KI-DASH-001 (this), KI-DASH-002 (follow-up)
```

---

## الخلاصة

- ✅ CRITICAL-01 — **resolved** (الـ blocker الأصلي راح).
- ⚠️ CRITICAL-02 — **open** (schema drift، منفصل، يحتاج نطاق جديد).
- 🎯 **التوصية**: لو الهدف launch قبل حلّ CRITICAL-02، الـ launch dashboard ما يكتمل. الحلّ إمّا schema migration (يخدم الكود الموجود) ولا refactor شامل للكود (يخدم schema الموجود). كلاهما ≥ ساعة عمل + اختبار.