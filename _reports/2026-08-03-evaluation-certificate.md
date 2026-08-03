# Evaluation Certificate Side-Server — البنية التحتية للشهادات (M-series)

**Date**: 2026-08-03
**Agent**: BrightAI Workspace Agent
**Task**: اكتساب طبقة الشهادات لتقييم kernel (Evaluation Certificate) — libs + API + توقيع + S3/DB + اختبارات متكاملة.
**Mode**: Senior

## الملخص التنفيذي

ابنينا طبقة Evaluation Certificate كاملة لصفحات kernel: نظام يوقّع شهادة غير قابلة للمراجعة لكل جولة تقييم مكتملة، بحيث أي جهة خارجية تقدر تتحقق منها (verify) بشكل مستقل عبر `/api/kernel/certificates/verify?id=…`. الشهادة تحتوي بيانات التقييم كاملة (dataset، model، policy، prompt، نتائج، كلفة، استجابات) مع `payloadDigest` يُحسب على canonical JSON، وتوقيع Ed25519 عبر `node:crypto`، و ring مفتاح يدور (لو حصل تغيير بمفتاح توقيعية new يطلع stale للشهادات القديمة → fail مغلق، لكن المفتاح الصحيح الحالي يتحقق).

البنية من ثلاث طبقات:
1. **libs** (`src/lib/kernel-certs/*`): admin-auth (بوابة `x-brightai-admin-key` مقابل `BRIGHTAI_ADMIN_KEY`)، canonical، sha256، signing (Ed25519 one-shot)، eval-service (إنشاء/حالات/إتمام)، cert-service (إصدار/تحقق/إبطال)، store (فاصل: in-memory + Prisma/Postgres).
2. **API** (`src/pages/api/kernel/{evaluations,certificates}/*`): كلها `prerender=false`، كتابة بحراسة admin-auth (503 لو key غير مكوّن، 403 لو غلط)، verification بضل عام.
3. **قاعدة البيانات**: جداول `evaluation_runs` + `evaluation_certificates` + `signing_keys` + `evaluation_audit_events` (سلسلة تدقيق hash الأص واسودا).

أهم اكتشاف: **bug صريح** كشفه اختبار التكامل — الـ `PrismaCertStore.fromDbCert` كان يعيد بناء الـ payload بأصفار/Fارغ، فـ verification لأي شهادة سليمة (حتى بدون تعديل) يطلع `digest-mismatch`. السبب إن الـ payload الموقّع ما كان يُحفظ أصلاً في DB. الحل: أضفنا عمود `payload Json` + تحديث migration + re-gen لـ Prisma ، وأعدنا `fromDbCert` يعيد payload من DB بدل بناءه.

## Files Changed

| File | Change Type | Description |
|---|---|---|
| `src/lib/kernel-certs/admin-auth.ts` | Created | `isAdminAuthorized` + `json` helper (header `x-brightai-admin-key` عبر timingSafeEqual) |
| `src/lib/kernel-certs/{canonical,sha256,signing,env,libClient}.ts` | Created | canonicalJson، sha256Hex، sign/verify Ed25519 (one-shot null hash)، load signing key ring |
| `src/lib/kernel-certs/{eval-service,cert-service,in-memory-store,prisma-store,facade}.ts` | Created | منطق التقييم + الشهادات + المخازن |
| `src/pages/api/kernel/evaluations/index.ts` | Created | POST create run / GET list (admin) |
| `src/pages/api/kernel/evaluations/[id]/{cases,complete,resume,rerun}.ts` | Created | إضافة حالة، إتمام+تجميد، استئناف نسخة، إعادة تشغيل (نسخة بـ parent) |
| `src/pages/api/kernel/certificates/{issue,verify,revoke}.ts` | Created | issue/revoke admin، verify عام |
| `packages/db/prisma/schema.prisma` | Edited | +4 نماذج (run/certificate/signingKey/auditEvent) + عمود `payload Json@` في certificate |
| `packages/db/prisma/migrations/20260803*` | Created | migration للجداول + migration عمود payload |
| `scripts/generate-eval-cert-key.mjs` | Created | توليد زوج Ed25519 + طباعة env سطور |
| `scripts/seed-eval-cert-key.mjs` | Created | upsert المفتاح العام في `signing_keys` — **شغّل بنجاح: `v1 | Ed25519`** |
| `.env.example` | Edited | +`BRIGHTAI_ADMIN_KEY` +`EVAL_CERT_*` تعليمات |
| `kernel/tests/eval-certificate.test.js` | Created | 10 حالات unit (InMemory) |
| `kernel/tests/eval-certificate.db.integration.test.js` | Created | سيناريو Postgres كامل E2E |

## Verification Results

| Check | Result |
|---|---|
| `npx tsc --noEmit --moduleResolution bundler --module esnext --target es2022 --skipLibCheck src/lib/kernel-certs/*.ts` | ✅ 0 errors |
| `npx vitest run kernel/tests/eval-certificate.test.js` | ✅ 10 passed |
| `DATABASE_URL=... EVAL_CERT_SIGNING_KEY_RING=... npx vitest run kernel/tests/eval-certificate.db.integration.test.js` | ✅ 2 passed |
| Combined | ✅ **12/12** |
| `scripts/seed-eval-cert-key.mjs` | ✅ `Seeded 1 public signing key(s)` → psql `v1 \| Ed25519` |
| signed payload round-trip (sign→verify) | ✅ عبر اختبارات signPayload/verifyPayload |

## المخاطر المتبقية

- ~~bug الـ payload~~ **حُلّ**: عمود `payload` الآن يحفظ الـ payload الموقّع بالضبط ويعيده للتحقق. migration `20260803010000` طُبّق على dev.
- `BRIGHTAI_ADMIN_KEY` و `EVAL_CERT_*` غير مكوّنة في `.env` الحقيقي بعد — بدونها: endpoints الإدارية controller بترجع 503 حتى تنضبط.
- فحص التوقيع في `verify` يعتمد `signing_keys` في DB؛ لو مفتاح جديد لم يُبذر، شهادة قديمة تفشل رغم سلامتها — لازم نذرّع المفتاح على الـ DB الحقيقية.
- LSP editor shows stale errors on `prisma-store.ts` (evaluationRun not exist) — هذه قديمة cache؛ tsc المستقل يمرّ بلا أخطاء (تحقّق فعلي).

## Follow-up Suggestions

- ضبط `BRIGHTAI_ADMIN_KEY` + مفتاح توقيع دائم في `.env` وتذرّع `seed-eval-cert-key.mjs` على الـ prod (حالياً فقط test).
- تحديث واجهة `src/pages/kernel/eval.astro` + `KernelLayout` + JS ليبرز `issue`/`verify` للشهادة مع كروت الحالة.
- تشغيل `pnpm build` end-to-end + curl على endpoints بعد إcofig dev (تأكد أن `prerender=false` routes تتغلب في static hosting — أو تمرير عبر backend).

## Rollback Plan

```
git revert <commit-sha>
# أو إزالة API routes وإعادة جدوال evaluation_runs بدون payload
```