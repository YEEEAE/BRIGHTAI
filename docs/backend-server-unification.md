# توثيق دمج الخادم: `backend/` + `server/`

**التاريخ:** 2026-02-23  
**القرار:** اعتماد `backend/` كمصدر الشفرة الوحيد (Single Source of Truth)

## الهدف
إزالة الازدواجية بين خادمين متوازيين (`backend/` و`server/`) وتوحيد نقاط النهاية ومكونات التكوين والميدل وير في مسار تشغيلي واحد.

## مصدر الحقيقة الجديد
- المسار الرسمي للخادم: `backend/`
- نقطة التشغيل الرسمية: `backend/server.js`
- أوامر التشغيل الحالية في `package.json` بقيت صحيحة لأنها تشير إلى `backend/server.js`

## الملفات المدموجة (تم ترقية `backend/` من `server/`)
| الحالة | الملف في `backend/` | المصدر المدموج |
|---|---|---|
| محدث | `backend/server.js` | `server/index.js` (مع تحويل imports من `endpoints` إلى `routes`) |
| محدث | `backend/config/index.js` | `server/config/index.js` |
| محدث | `backend/middleware/rateLimiter.js` | `server/middleware/rateLimiter.js` |
| محدث | `backend/routes/summary.js` | `server/endpoints/summary.js` |
| محدث | `backend/routes/medical.js` | `server/endpoints/medical.js` |
| جديد | `backend/utils/cache.js` | `server/utils/cache.js` |
| محدث | `backend/middleware/README.md` | توثيق متوافق مع البنية الموحدة |

## الملفات التي كانت متطابقة (لم تتطلب نقل من `server/`)
- `backend/routes/chat.js`
- `backend/routes/search.js`
- `backend/routes/groq.js`
- `backend/utils/errorHandler.js`
- `backend/utils/sanitizer.js`
- `backend/utils/sessionStore.js`

## الملفات المحذوفة
تم حذف مجلد `server/` كاملاً بعد اكتمال الدمج، ويشمل:
- `server/index.js`
- `server/config/index.js`
- `server/endpoints/chat.js`
- `server/endpoints/search.js`
- `server/endpoints/groq.js`
- `server/endpoints/medical.js`
- `server/endpoints/summary.js`
- `server/middleware/rateLimiter.js`
- `server/middleware/README.md`
- `server/utils/cache.js`
- `server/utils/errorHandler.js`
- `server/utils/sanitizer.js`
- `server/utils/sessionStore.js`
- `server/.DS_Store`

## توحيد نقاط النهاية المطلوبة
تم توحيد وإبقاء endpoints التالية ضمن `backend/server.js`:
- `POST /api/ai/chat`
- `POST /api/ai/search`
- جميع مسارات `POST /api/groq/*` (بما فيها `stream`, `ocr`, `extract-text`, `transcribe`, `medical-agent`, `faq`, `medical-archive`)

## توحيد التكوين والميدل وير
- التكوين الموحد في `backend/config/index.js`
- الميدل وير الموحد في `backend/middleware/rateLimiter.js` مع دعم `memory/redis`
- إضافة كاش موحد للتلخيص في `backend/utils/cache.js`

## تغييرات سلوكية مهمة بعد الدمج
1. **Summary endpoint** يدعم caching (HIT/MISS header) ورسائل خطأ معيارية.
2. **Medical endpoint** تم إصلاحه لاستخدام `config.gemini.endpoint` بدل حقل غير معرف (`baseUrl`).
3. **تكامل rate limiter** تم تعديله في `backend/server.js` ليتوافق مع middleware غير المتزامن (async) بدون تعليق الطلبات.
4. **API Docs endpoint** تم دمجه في السيرفر الموحد:
   - `GET /api/docs`
   - `GET /api/docs/openapi.yaml`

## التحقق بعد الدمج
- تم تحميل ملفات السيرفر الموحّد بنجاح عبر Node بدون أخطاء استيراد.
- تم التحقق من توفر exports الأساسية (summary/medical/rateLimiter/cache/config).

## ملاحظات تشغيل
- لا حاجة لتعديل أوامر التشغيل الحالية (`npm run server`, `npm run server:dev`).
- أي تطوير لاحق للخادم يجب أن يتم تحت `backend/` فقط.
