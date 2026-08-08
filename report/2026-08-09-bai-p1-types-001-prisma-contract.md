# BAI-P1-TYPES-001 — شدّ عقد أنواع Prisma + CI drift gate

> تاريخ: 2026-08-09
> النطاق: `packages/db/src/client.ts` + `scripts/verify-prisma-drift.mjs` (جديد) + `package.json` + `.github/workflows/ci-build-guard.yml`
> Priority: P1 · Complexity: M · Risk: Med

---

## الملخص التنفيذي

المهمة وصلت بادّعاء إن `npm run typecheck` يفشل بـ 42 خطأ (40× TS2305 + 2× TS7006) على نفس الـ commit. بعد تشخيص منهجي وإعادة إنتاج، اتّضح إن **المشكلة منحلّة فعليًا على `main`** عبر `pretypecheck → db:generate` hook المُتبت منذ `2a3ddffc` (2026-07-18) + `postinstall: "prisma generate"` في `packages/db`. تقرير الأوديت بُني على commit مستقل (`5d6efbe3`) **مو موجود في تاريخنا أصلًا**.

بس فيه **ثغرتان حقيقيتان** سدّيتهم في هذي المهمة:

1. **TS7006 implicit-any + casts قبيحة** في `packages/db/src/client.ts:90,121,103,125` — `tx` بلا نوع، و `fn(tx as unknown as Parameters<typeof fn>[0])`. هذي تظهر كـ TS7006 لو فُقد الـ generated client (clean clone يشتغّل tsc مباشرة بدون pretypecheck).
2. **ما فيه drift-detection** بين `schema.prisma` والـ generated client — الـ CI يتشيك إن الـ client "وُلّد" بس ما يقارن المحتوى. هذي بالظبط فئة الانحراف اللي كسرت typecheck في الأوديت.

الحل: استبدلت `Omit<PrismaClient, …>` اليدوي بـ `Prisma.TransactionClient` المُولَّد (= نفس النوع بس بمصدر واحد صريح)، وشلت الـ casts، وكتبت `scripts/verify-prisma-drift.mjs` كـ CI gate صريح.

---

## التشخيص (مُعاد إنتاجه ومُتحقَّق منه)

### السؤال الجوهري: الـ schema ناقصة ولا types.ts متأخرة؟

**الجواب: لا هذا ولا ذاك.** على `main` الحالي (`f36068ca`):

| المصدر | الحالة |
|---|---|
| `schema.prisma` | ✅ كل الـ models/enums موجودة (29 model + 24 enum) |
| `types.ts` imports | ✅ كلها موجودة في الـ generated client |
| `node_modules/.prisma/client/index.d.ts` exports | ✅ كل الأسماء (`OnboardingProgress`, `DataExportRequest`, `LeadQueue`, `Subscription`, `LeadQueueStatus`, `Role`, …) موجودة |
| `pretypecheck → db:generate` hook | ✅ مُتبت منذ `2a3ddffc` (2026-07-18) |
| `packages/db/package.json` postinstall | ✅ `"prisma generate"` |

### إعادة إنتاج فشل الأوديت

حذفت `node_modules/.prisma/client/` وشغّلت `tsc --noEmit` مباشرة (بدون pretypecheck). النتيجة: **~47 خطأ TS2305** مطابقة لوصف الأوديت. السبب: الـ generated client مو مُتبت في الـ repo (طبيعي، في `.gitignore` فعليًا كـ artifact)، فأي بيئة ما ولّدته قبل الفحص تشوف `@prisma/client` ما يصدّر شي.

هذا يفسر ليش الأوديت شاف الفشل: بيئته شغّلت typecheck بدون ما يولّد الـ client أولًا (إمّا pretypecheck ما اشتغل، أو فُحص tsc مباشرة). على `main` الـ hook يحل هذا، بس كان يحجب المشكلة بدل ما يعالجها كـ contract صريح.

### الثغرات الحقيقية المتبقية

**1. TS7006 في `client.ts`:**
```ts
// قبل:
return db.$transaction(async (tx) => {           // ← tx: implicit any (TS7006)
  // …
  return fn(tx as unknown as Parameters<typeof fn>[0]);  // ← cast قبيح يخفي الانحراف
});

// بعد:
return db.$transaction(async (tx: TransactionClient) => {  // ← نوع صريح
  // …
  return fn(tx);                                            // ← لا cast
});
```
الـ `TransactionClient` نوع مُولَّد من Prisma (= `Omit<PrismaClient, ITXClientDenyList>`) — بالظبط نوع الـ `tx` اللي الكود يبيه.

**2. لا drift-detection صريح:** الـ CI يتشيك `test -d …/.prisma/client` (الوجود الفيزيائي للـ directory) بس ما يتحقق إن المحتوى يطابق الـ schema.

---

## التغييرات

### 1. `packages/db/src/client.ts`
- `import { PrismaClient, Prisma } from '@prisma/client'` (أضفت `Prisma`).
- `export type TransactionClient = Prisma.TransactionClient` (نوع مختصر موثّق).
- `withTenant` + `withServiceRole`: `tx: TransactionClient` صريح + `fn(tx)` مباشرة (لا cast).
- **لا `as any`، لا `@ts-ignore`، لا `as unknown`** (قيد المهمة محترم).

### 2. `scripts/verify-prisma-drift.mjs` (جديد)
- يقرأ models/enums من `schema.prisma` (line-scan على `model X {` / `enum Y {`).
- يقرأ exports من `node_modules/.prisma/client/index.d.ts` (regex على `export type X = $Result.DefaultSelection` للـ models و `export type X = $Enums.X` للـ enums).
- exit 0 لو متزامنين، exit 1 مع diff per-symbol لو فيه drift، exit 2 fatal.
- مُختبَر: لقّط drift حقيقي لما حذفت `LeadQueue` model + `Role` enum يدويًا.

### 3. `package.json` (الجذر)
- `"verify:prisma:drift": "node scripts/verify-prisma-drift.mjs"` (بعد `verify:csp-drift`).

### 4. `.github/workflows/ci-build-guard.yml`
- Step جديد `Verify Prisma schema ↔ generated client drift` بعد `Generate Prisma client` في job الـ `install`.

---

## القيود المحترَمة

| القيد (من المهمة) | كيف احتُرم |
|---|---|
| ممنوع `as any` / `@ts-ignore` لإسكات TS2305 | ✅ ما فيه ولا واحد جديد؛ شلت اثنين `as unknown` موجودين |
| لا تغيير database semantics بدون migration | ✅ ما لمست `schema.prisma` ولا migrations |
| لا خلط مع UI refactor | ✅ كل التغييرات في `packages/db/` + `scripts/` + CI |
| TS7006 بأنواع صريحة لا any | ✅ `Prisma.TransactionClient` |
| CI check يمنع تكرار الانحراف | ✅ `verify-prisma-drift.mjs` + CI step |

---

## التحقق

| الخطوة | الأمر | النتيجة |
|---|---|---|
| Clean CI simulation | `rm -rf node_modules/.prisma/client` | ✅ حُذف |
| Generation | `pnpm --filter @brightai/db db:generate` | ✅ ولّد الـ client |
| Typecheck (كل workspaces) | `npm run typecheck` | ✅ 5/5 Done، **0 أخطاء** |
| Drift gate | `npm run verify:prisma:drift` | ✅ exit 0، 29 model + 24 enum متزامنين |
| Build | `npm run build` | ✅ EXIT=0، purge-css + patch-entry نجحوا |
| قيد الـ casts | `grep -rE "as any\|@ts-ignore\|as unknown" packages/db/src/` | ✅ 0 نتائج |

**Acceptance criteria كلها تحقّقت:**
- [x] `npm run typecheck` ينجح من clean install — صفر أخطاء.
- [x] كل import في `types.ts` موجود في generated client أو معرّف كـ domain type.
- [x] ما فيه ولا cast جديد يخفي TS2305.
- [x] CI check يمنع تكرار الانحراف (`verify-prisma:drift`).

---

## المخاطر المتبقية

1. **الـ drift gate field-level ما يدقق:** السكربت يتحقق إن كل model/enum موجود، بس ما يتحقق إن الحقول (columns, relations) متطابقة. هذي مسؤولية `prisma generate` نفسه. لو حاب توسّعه مستقبلًا، يقدر يقارن `Prisma.X Payload` types بدل بس الوجود.
2. **الـ step الموجود في CI هش:** `test -d …/@prisma+client@5.22.0_prisma@5.22.0/…` مقيّد بإصدار محدد — لو تدرّج Prisma، الـ check يكسر. ما لمسته (خارج نطاق المهمة) بس يستاهل متابعة مستقلة.

---

## Rollback

`git revert` لتغييرات `client.ts` + `package.json` + `ci-build-guard.yml`، وحذف `scripts/verify-prisma-drift.mjs`. ما فيه UI surface متأثر، ما فيه migration، ما فيه تغيير database.
