# فحوص تشغيل خدمة BRIGHTAI على Node

`/healthz` يفحص استجابة العملية ويعيد `200` مع `status: "ok"` و`version` و`commit`.
`/readyz` يفحص PostgreSQL وتهيئة Auth واتساق هوية النشر. يستخدم Render `/readyz/` في الـBlueprint. مسار `/app/api/kernel/health/` يبقى فحص المنتج ويخضع لبوابة التطبيق.

يستقبل `npm start` صيغتي المسارين مباشرة. يعيد `HEAD` ترويسات JSON ورمز الحالة بجسم فارغ، وتعيد الطرق الأخرى `405` مع `Allow: GET, HEAD`. يرفض مدخل Node الطلبات المشوهة بـ`400` قبل تشغيل الفحوص.

تتضمن استجابات الفحص `Cache-Control: no-store, max-age=0` وترويسات منع كاش CDN و`X-Robots-Tag: noindex, nofollow`. تبقى سياسة Astro `trailingSlash: 'always'` للصفحات العامة. استخدم `npm start` لفحص سلوك الإنتاج، لأن Astro يشغّل canonical redirect عند الوصول إليه مباشرة دون مدخل Node الخاص بالمشروع.

## 3. العقد الثابت

تحتوي استجابة GET للجاهزية بحالة 200 على المفاتيح التالية:

```json
{
  "schema": 1,
  "version": "2.0.0",
  "commit": "<40-character git SHA>",
  "status": "ready",
  "state": "ready",
  "checkedAt": "ISO-8601",
  "dependencies": {
    "database": "READY | UNCONFIGURED | SCHEMA_MISSING | PRIVILEGE_DENIED | UNAVAILABLE | UNKNOWN",
    "auth": "READY | UNCONFIGURED | UNREACHABLE | UNKNOWN",
    "authProbe": "ACTIVE | CACHED | SKIPPED | UNKNOWN",
    "portal": "ENABLED | DISABLED | UNKNOWN"
  },
  "release": { "commit": "…", "consistent": true, "artifact": { }, "deploy": { } },
  "service": { "id": "…", "name": "…", "type": "…" },
  "error": null
}
```

- يكتب البناء الإصدار وSHA في `dist/server/version.json`. يمكن أن تكون الهوية `null` عند غياب البيانات، ويرفضها فحص ما بعد النشر.
- `release` و`service` حقول هوية إضافية ثابتة، وليست إعدادات سرية.
- يعيد HTTP 503 عقد الخطأ المشترك مع `X-Request-ID`. تستخدم الصفحة العامة `/status/` التقرير الداخلي لعرض تفاصيل الجاهزية. [عقد API](API-CONTRACT.md)
- `release`/`service` تكون `null` فقط إذا تعذّر بناء هوية العملية.
- أي تقرير داخلي لا يطابق العقد يُعامل كـ503 وليس 200.

## 4. الحالات ورمز HTTP

| الحالة الداخلية | المعنى | HTTP |
|---|---|---|
| `ready` | DB جاهز، Auth مهيأ، إصدار البناء متسق | 200 |
| `setup_required` | DB أو Auth غير مهيأ | 503 |
| `blocked` | schema ناقص، صلاحية مرفوضة، أو تعارض commit | 503 |
| `unavailable` | DB لا يستجيب أو Auth غير قابل للوصول أو فحص فاشل | 503 |

`status` = `ready` فقط عندما `state` = `ready`. البوابة المغلقة
(`AIGAS_APP_ENABLED=false`) لا تُفشل الجاهزية؛ تُبلَّغ كـ`portal: DISABLED`.

فحص Auth الشبكي اختياري عبر `AIGAS_HEALTH_AUTH_PROBE=true`، بحد 2 ثانية
وذاكرة 15 ثانية. بدونه يُبلَّغ Auth المهيأ كـ`READY` مع `authProbe: SKIPPED`.

## 5. منع التسريب

الاستجابة لا تحتوي أبدًا:

- `DATABASE_URL` أو أي DSN أو host أو port.
- مفاتيح أو tokens أو cookies.
- أسماء أدوار قاعدة البيانات (`aigas_runtime` وغيرها).
- رسائل PostgreSQL الخام أو `permission denied` أو stack traces.

`probeDatabase` في `db.mjs` يعيد حالة فقط، ويحوّل `42501` إلى
`PRIVILEGE_DENIED` وأي خطأ آخر إلى `UNAVAILABLE`. استُخرج إنشاء `pg.Client`
داخل `try` حتى لا يتحول DSN مشوّه إلى استثناء يفلت من العقد.

## 6. تشغيل الاختبارات

اتبع أوامر [فحص الإنتاج في README](../README.md#فحص-تشغيل-node-بعد-النشر-على-render). استخدم `--require-ready` عند فحص النسخة المنشورة حتى يفشل الاختبار إذا أعاد `/readyz` الرمز `503`.

يقبل Render استجابة `2xx` أو `3xx` خلال خمس ثوانٍ ويرصد فشل الخدمة أثناء النشر وبعده. لهذا يختبر الـsmoke الوصول المباشر ويرفض أي تحويل. تعطل الاعتماديات المتكرر قد يوقف توجيه الطلبات ويعيد تشغيل العملية وفق سياسة Render. [توثيق فحوص Render](https://render.com/docs/health-checks)

فحص PostgreSQL يتحقق من الاتصال ودور التشغيل ووجود `public.aigas_tenants`. تحقق الترحيلات وصلاحيات المنتجات وعزل المؤسسات له اختبارات مستقلة. يختبر الفحص الشبكي لـAuth مفاتيح JWKS عند تفعيله.
