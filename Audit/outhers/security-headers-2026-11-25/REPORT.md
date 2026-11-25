# ترويسات الأمان وCSP في BRIGHTAI

تُفرض السياسة على استجابات التطبيق من `npm start`، بما فيها HTML المولّد مسبقًا والملفات الثابتة التي يتولاها محوّل Astro قبل middleware. ويطبق Astro middleware السياسة نفسها على المسارات الخادمية. التحقق في هذه الوثيقة محلي.

## مصفوفة الترويسات

| الترويسة | عام `/` | Auth `/auth/sign-up/` | App `/app/firewall/` | API قراءة وكتابة `/app/api/trial/` |
|---|---|---|---|---|
| Content-Security-Policy | مفروضة | مفروضة | مفروضة | مفروضة |
| CSP `frame-ancestors` | `'self'` | `'none'` | `'none'` | `'none'` |
| CSP `frame-src` | `'none'` | `'none'` | `'none'` | `'none'` |
| X-Frame-Options | `SAMEORIGIN` | `DENY` | `DENY` | `DENY` |
| Referrer-Policy | `strict-origin-when-cross-origin` | `no-referrer` | `no-referrer` | `no-referrer` |
| Strict-Transport-Security | `max-age=15552000` مع HTTPS أو ترويسة الوكيل | نفسه | نفسه | نفسه |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(), payment=(), usb=()` | نفسها | نفسها | نفسها |
| CORP / COOP | `same-origin` لكليهما | نفسها | نفسها | نفسها |
| CORS | لا `Access-Control-Allow-Origin` أو `Access-Control-Allow-Credentials` | نفسها | نفسها | نفسها |
| X-Content-Type-Options | `nosniff` | نفسها | نفسها | نفسها |
| Cache-Control | حسب المسار | `private, no-store, max-age=0` | نفسها | نفسها |

يبقى HSTS بلا `includeSubDomains` أو `preload`. عند إنهاء TLS أمام Node يعتمد العقد على ضبط الوكيل لـ`X-Forwarded-Proto`. حارس Origin الخاص بكتابات التطبيق والمصادقة مستقل عن CORS. يتضمن مختبر المنتجات سياسة `meta` إضافية تقيّد النماذج و`base-uri` أكثر.

## السياسة النهائية والمصادر

| التوجيه | المصادر وسبب السماح |
|---|---|
| `default-src` / `base-uri` / `form-action` | `'self'` للأصل نفسه |
| `object-src` / `frame-src` / `script-src-attr` | `'none'` |
| `script-src` | `'self'` لوحدات Astro وملفات القياس والمصادقة. `https://www.googletagmanager.com` لمحمّل GA4. ثلاث بصمات SHA-256 لتهيئة GA4 في التطبيق وصفحة إغلاق البوابة، ونسخة Cloudflare، وإشارة JavaScript في صفحتي المعرفة. |
| `style-src` | `'self'` لملفات CSS الخارجية. للأجزاء الخاصة بصمة SHA-256 لكتلة CSS الثابتة في استجابة إغلاق البوابة. |
| `style-src-attr` | `'unsafe-inline'` لخصائص CSS الموجودة في أيقونات المنتجات والرسوم ومؤشرات الصفحات. استجابة Secure Chat تمنعها بـ`'none'`. |
| `font-src` | `'self'` لملفات IBM Plex Arabic المحلية وأصول الخطوط المبنية. |
| `img-src` | `'self'` لأصول الصور والأيقونات، وتُسمح `https://www.googletagmanager.com` و`https://*.google-analytics.com` لطلبات الصور الخاصة بالقياس. |
| `connect-src` | `'self'` لـ`/auth/api/` وواجهات التطبيق والمراقبة والقياس. `https://*.google-analytics.com` و`https://*.analytics.google.com` و`https://*.googletagmanager.com` لطلبات GA4. اتصال Neon من الخادم. |
| `frame-ancestors` | `'self'` للعام و`'none'` لـAuth/App. |
| `report-uri` | `/api/security/csp-report/`، وجهة من الأصل نفسه. |

في Secure Chat تقتصر السكربتات والاتصالات على `'self'`، والصور على `'self'`. يتجاوز Cloudflare Worker المحلي حقن GA4 على هذا المسار. تُعرض JSON-LD وبيانات فهرس المعرفة كبيانات JSON غير تنفيذية. روابط التنقل والمراجع الخارجية لا تُحمّل سكربتات أو CSS أو خطوطًا في الصفحة.

[تعريف CSP والبصمات الفعلية](../../src/server/observability/security-policy.mjs) · [مواصفة CSP](https://www.w3.org/TR/CSP3/) · [مراجع Google للوسم وCSP](https://developers.google.com/tag-platform/security/guides/csp)

### قيم الترويسة المرسلة

**العام**

```http
Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self' https://www.googletagmanager.com 'sha256-kbWqACrSLys44xLn8eH8N6slPUGW61wmDsUE4JbnwE0=' 'sha256-/ahxh2pzUcFi1E9lm6ltoUB1mNeCC4QSX0TWwNtcszc=' 'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='; script-src-attr 'none'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' https://www.googletagmanager.com https://*.google-analytics.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'none'; frame-ancestors 'self'; report-uri /api/security/csp-report/
```

**Auth وApp وواجهاتهما**

```http
Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self' https://www.googletagmanager.com 'sha256-kbWqACrSLys44xLn8eH8N6slPUGW61wmDsUE4JbnwE0=' 'sha256-/ahxh2pzUcFi1E9lm6ltoUB1mNeCC4QSX0TWwNtcszc=' 'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='; script-src-attr 'none'; style-src 'self' 'sha256-BdNspLynP6vZMI4tacHjKIg8mS2Jnj3CAcxWk92zRKc='; style-src-attr 'unsafe-inline'; img-src 'self' https://www.googletagmanager.com https://*.google-analytics.com; font-src 'self'; connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com; frame-src 'none'; frame-ancestors 'none'; report-uri /api/security/csp-report/
```

**Secure Chat عند فتح البوابة**

```http
Content-Security-Policy: default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'sha256-BdNspLynP6vZMI4tacHjKIg8mS2Jnj3CAcxWk92zRKc='; style-src-attr 'none'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; report-uri /api/security/csp-report/
```

## بلاغات CSP والخصوصية

تقبل الوجهة `POST` بصيغة `application/csp-report` حتى 8 KiB عبر قراءة محدودة، وبمهلة ثانيتين وحد 120 محاولة في الدقيقة لكل عملية Node. ترفض الطلبات المعلمة cross-site والأنواع غير المتوقعة. تحفظ عدادات مؤقتة في ذاكرة العملية حسب قائمة توجيهات ثابتة. لا تسجّل جسم الطلب أو عناوين URL أو query أو referrer أو عينات السكربت أو معرّف العميل، ولا ترجع جسمًا للمستخدم. لا توجد وجهة SIEM أو تجميع بين النسخ. تكوين سجلات Cloudflare وRender خارج دليل هذا الفحص.

[معالج البلاغات](../../src/server/observability/csp-report.mjs)

## إعادة التحقق

```sh
npm run build
npm run test:security:smoke
node --test tests/csp-report.test.mjs tests/observability.test.mjs tests/ga4-edge-worker.test.mjs
KERNEL_AUTH_E2E_DATABASE_URL=<disposable-local-postgresql-url> npm run test:auth:e2e
```

## نتائج التحقق

- بناء Astro ناجح وتحقق تكامل خريطة الموقع لـ64 صفحة.
- Chrome عبر Playwright اجتاز 77 مستندًا مبنيًا، وصفحات Auth وApp وSecure Chat، وفحص ترويسات API لكل من GET وPOST وOPTIONS. تحقق من تحميل JavaScript وCSS والخطوط من أصول Astro ومن شرط HSTS خلف وكيل HTTPS محاكى وغيابه على HTTP المباشر.
- تحقق Chrome من تحميل بديل محلي لمحمّل GA4، وتهيئة واحدة، ووصول طلب جمع محاكى عبر CSP، وحذف `code` من عنوان GA4. وتحقق من غياب الوسم في Secure Chat.
- حجب Chrome سكربتًا مضمّنًا دون بصمة. أرسل المتصفح بلاغًا تلقائيًا وأعاد الخادم 204. اجتازت الطلبات اختبارات النوع والحجم والحمولة غير الصالحة ورفض cross-site.
- 35 اختبار Node ناجحًا لسياسة الترويسات والبلاغات ومطابقة بصمة Cloudflare والإعفاء الخاص بـSecure Chat.
- اجتاز Chrome وPostgreSQL 18 تدفق Neon Auth الاصطناعي للتسجيل والتحقق وتسجيل الدخول والجلسة والدعوة والتجربة. تحققت ترويسة CSP على ردود قراءة وكتابة ناجحة بعد المصادقة. أعيد اختبار المتصفح على نسخة بناء معزولة من الملفات النهائية.
- GA4 ingestion وتسليم البريد الحقيقي وترويسات Cloudflare وRender لم تُختبر. التعديل محلي.
