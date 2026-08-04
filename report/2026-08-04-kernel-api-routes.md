# تقرير: بناء API routes لمنصة شهادات التقييم (Phase 2)

**التاريخ**: 2026-08-04
**الوكيل**: BrightAI Workspace Agent
**المهمة**: بناء 5 API routes تربط الـ Frontend بالـ Backend لمنصة شهادات التقييم (evaluations + certificates + audit)
**الوضع**: مكتمل — 4 من 5 routes جديدة (الأولى موجودة مسبقًا)

## الملخص التنفيذي

المهمة كانت بناء 5 API routes في `src/pages/api/kernel/` حسب spec Phase 2.
المسار الأول (`evaluations/index.ts`) كان موجودًا بالفعل من 2026-08-03.
أكملنا الـ 4 المسارات المتبقية + أضفنا 2 دوال مخزن جديدة (listCerts, listAuditEvents) + اختبارات وحدوية جديدة.

البناء نجح (125 صفحة، 0 أخطاء). الاختبارات الوحدوية 12/12 ✅.
الاختبارات التكاملية لا تشتغل في هذه البيئة بسبب مشكلة في صيغة `.env` (مشكلة موجودة مسبقًا، مو من تعديلي).

## الملفات المتأثرة

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/pages/api/kernel/evaluations/[id].ts` | **جديد** | GET تفاصيل run + PATCH تحديث + DELETE رفض |
| `src/pages/api/kernel/certificates/index.ts` | **جديد** | GET قائمة شهادات + POST إصدار شهادة |
| `src/pages/api/kernel/certificates/[id]/verify.ts` | **جديد** | POST تحقق من شهادة عبر مسار REST |
| `src/pages/api/kernel/audit/index.ts` | **جديد** | GET قائمة أحداث التدقيق |
| `src/lib/kernel-certs/cert-service.ts` | **تعديل** | أضيف `listCerts(limit?)` في واجهة CertStore |
| `src/lib/kernel-certs/prisma-store.ts` | **تعديل** | أضيف `listCerts()` + `listAuditEvents()` + `StoredAuditEvent` |
| `kernel/tests/eval-certificate.test.js` | **تعديل** | أضيف اختبارات وحدوية للـ reject + listCerts |
| `kernel/tests/eval-certificate.db.integration.test.js` | **تعديل** | أضيف اختبار تكاملي للـ listCerts + listAuditEvents |

## ما بقي كما هو (محمي)

- `certificates/issue.ts` و `certificates/verify.ts` (GET) و `certificates/revoke.ts` — بقوا كـ backward-compat
- `evaluations/index.ts` — موجود مسبقًا، لم يُلمس
- جميع ملفات `kernel-certs/` الأخرى (signing.ts, eval-service.ts, canonical.ts, sha256.ts, admin-auth.ts, in-memory-store.ts, facade.ts) — لم تُلمس
- `public/_redirects`, `public/_headers`, `public/robots.txt` — لم تُلمس
- أي محتوى عربي منشور — لم يُغيّر

## التحقق

| التحقق | النتيجة |
|---|---|
| `npm run build:client` | ✅ 0 أخطاء |
| `npx tsc --noEmit` | ✅ 0 أخطاء من ملفاتي (4 أخطاء مسبقة في ملفات أخرى) |
| `npx astro build` | ✅ 125 صفحة، 0 أخطاء |
| `npx vitest run kernel/tests/eval-certificate.test.js` | ✅ 12/12 |
| `npx vitest run kernel/tests/eval-certificate.db.integration.test.js` | ⚠️ 3 skipped (مشكلة صيغة .env موجودة مسبقًا) |
| `grep` للـ routes الجديدة في `dist/server/` | ✅ كل الـ 5 handlers مدمجة |

## المخاطر المتبقية

- الاختبارات التكاملية (DB integration) لا تشتغل في هذه البيئة بسبب `EVAL_CERT_SIGNING_KEY_RING` بصيغة JSON مشوهة في `.env` — مشكلة موجودة مسبقًا (قبل تعديلي).
- الـ `verifyUrl` في `buildPayload` يشير لا يزال للـ GET route القديم (`/api/kernel/certificates/verify?id=`). الـ POST route الجديد (`/api/kernel/certificates/[id]/verify`) هو المسار الجديد المفضل. الشهادات القديمة تبقى صالحة عبر المسار القديم.
- الـ `certificates/index.ts` POST يشترك في المنطق مع `issue.ts` — تكرار بسيط (~25 سطر). مقبول لأن كل route مستقل ويتبع نفس نمط المشروع.

## الخطوة التالية المقترحة

- إصلاح صيغة `.env` للـ `EVAL_CERT_SIGNING_KEY_RING` (تخزين JSON بدون outer quotes) عشان تشتغل الاختبارات التكاملية في CI المحلي.
- تحديث `buildPayload` في `cert-service.ts` لتغيير `verifyUrl` من `?id=` إلى `/api/kernel/certificates/[id]/verify` (اختياري — مسار REST أنظف).
- إضافة rate limiting (100/Min/IP) للـ routes الجديدة — مفقود حاليًا في الـ routes الموجودة أيضًا.
