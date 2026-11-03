# الخصوصية والأمن — ضوابط مصدرية ومتطلبات تشغيل مستهدفة

> **الحالة:** مرجع محلي. يفرّق هذا المستند بين ما هو **موجود في كود المصدر** (`SOURCE_PRESENT`)، وما هو **متطلب تشغيلي مستهدف** (`TARGET_REQUIREMENT`) لم يُبنَ بعد، وما يبقى **غير متحقق** (`NOT_VERIFIED`). لا يُعد هذا المستند شهادة امتثال ولا نتيجة اختبار أمني.
> **تاريخ:** 2026-11-03 | **النطاق:** Astro 6 + `@astrojs/node` (standalone) + Neon Auth + `pg` + Secure Chat/AIGAS Kernel داخل هذا المستودع.
> **العلاقة بوثائق أخرى:** عزل المؤسسات وRLS في `docs/DATA-ACCESS-AND-RLS.md`؛ تشغيل البوابة في `docs/APP-PORTAL-RUNTIME-HANDOFF.md`؛ حماية فرع قاعدة البيانات في `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md`؛ سياسة التجربة في `docs/ENTERPRISE-TRIAL-POLICY.md`.

---

## 1. كيف تُقرأ الحالات

| الحالة | المعنى |
|---|---|
| `SOURCE_PRESENT` | موجود في كود المصدر ومقروء في هذه المراجعة؛ لم يُشغّل ولا يُثبت سلوك الإنتاج |
| `TARGET_REQUIREMENT` | مطلوب تشغيليًا/تعاقديًا، غير منفذ في هذا المستودع |
| `BLOCKED` | يحتاج اعتماد مالك/مشغّل أو قرارًا قانونيًا أو بنية غير موجودة |
| `NOT_VERIFIED` | لا دليل مستقل (اختبار، تشغيل، سجل بيئة) |

نجاح `build` أو وجود control في الكود **لا يعني** امتثالًا أو جاهزية إنتاج.

---

## 2. ضوابط موجودة في المصدر

### 2.1 رمز الدخول Authentication token — `SOURCE_PRESENT`

| الضابط | الموضع |
|---|---|
| القراءة من ترويسة `Authorization: Bearer` فقط، بحد أقصى 16384 حرفًا | `src/server/kernel/auth.mjs` |
| تحقق JWT بـ`EdDSA` مع `issuer` و`sub/exp/iat` و`maxTokenAge: 15m` | `src/server/kernel/auth.mjs` |
| رفض الهوية المجهولة (`role: 'anonymous'` / `is_anonymous`) | `src/server/kernel/auth.mjs` |
| `sub` يجب أن يكون UUID صالحًا | `src/server/kernel/auth.mjs` |
| JWKS يجب أن يكون `https` وبنفس أصل `NEON_AUTH_BASE_URL` | `src/server/kernel/auth.mjs` |
| الرمز لا يُخزن في `localStorage`/`sessionStorage`؛ يبقى في ذاكرة الصفحة عبر عميل Neon Auth | `src/scripts/workspace-context.ts` |
| إعادة الطلب بعد 401 مقصورة على `GET`؛ لا يُعاد إرسال عملية كتابة | `src/scripts/workspace-context.ts` |

**غير متحقق:** لا فحص متصفح أو تكامل Auth فعلي في هذه المهمة، ولا يوجد مستخدم/جلسة على البيئة المرجعية.

### 2.2 CSRF / Origin / CORS — `SOURCE_PRESENT`

- كل مسار كتابة يرفض `Origin` غير مطابق لأصل الطلب: `kernelHandler` (`src/server/kernel/http.mjs`)، وSecure Chat (`src/pages/app/api/secure-chat/messages.ts`)، وLedger وHuman Gate وRisk Engine وFirewall.
- استثناء Firewall الوحيد: `enforce` من عميل تكامل بدون `Origin` مع `Bearer` صالح (`src/server/firewall/http.mjs`). لا مصادقة بكوكي في أي مسار منتج، ولذلك لا يوجد CSRF قائم على الكوكي.
- **لا توجد ترويسة `Access-Control-Allow-Origin`** في المصدر أو `src/middleware.ts`؛ أي أن المتصفح لا يستطيع قراءة استجابات API من أصل آخر.

**ملاحظة:** الاستثناء أعلاه قرار تكامل مقصود وليس منحة وصول؛ أي توسعة له تحتاج مراجعة أمنية مستقلة.

### 2.3 الكاش والفهرسة — `SOURCE_PRESENT`

- مسارات `/app/*` و`/app/api/*`: `Cache-Control: private, no-store, max-age=0` + `CDN-Cache-Control` + `Cloudflare-CDN-Cache-Control` + `X-Robots-Tag: noindex, nofollow` + `Vary: Authorization, Cookie` (`src/middleware.ts`, `src/layouts/AppLayout.astro`).
- استجابة البوابة المغلقة (`503`) تحمل نفس منع الكاش والفهرسة (`src/server/kernel/unavailable.mjs`).
- كل استجابات API الخاصة تضيف `private, no-store` و`noindex` عبر `contractHeaders`.

### 2.4 ترويسات الاستجابة — `SOURCE_PRESENT` بعد هذه المهمة

| الترويسة | القيمة |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` لمنطقة `/app` وكل API؛ `SAMEORIGIN` للعام |
| `Content-Security-Policy` | `frame-ancestors` + `base-uri 'self'` + `form-action 'self'` + `object-src 'none'`؛ تُدمج مع أي سياسة يضيفها المسار بدل استبدالها |
| `Referrer-Policy` | `no-referrer` لمنطقة `/app`، `strict-origin-when-cross-origin` للعام |
| `Permissions-Policy` | تعطيل الكاميرا والميكروفون والموقع |
| `Strict-Transport-Security` | `max-age=15552000` عند تأكيد HTTPS فقط |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Permitted-Cross-Domain-Policies` | `none` |

**ليست سياسة سكربتات كاملة:** لا `script-src` ولا `style-src` ولا `connect-src`، وبالتالي لا ادعاء حماية XSS شاملة. إضافة `unsafe-inline` أو `unsafe-eval` تبقى ممنوعة دون مراجعة سياسة موثقة.

### 2.5 بوابة `/app` لا تُتجاوز بمسار مُرمّز — `SOURCE_PRESENT` بعد هذه المهمة

Astro يطابق المسارات على مسار **مفكوك الترميز**، بينما الـmiddleware يستقبل المسار كما وصل. لذلك أصبح `src/middleware.ts` يطبّع المسار (فك `%xx`، دمج الشرطات، حلّ `.`/`..`) قبل قرار البوابة، ويغلق البوابة على المسار الخام **أو** المطبّع. بدون ذلك، كان `/%61pp/...` يصل إلى صفحة `/app` بينما يتخطى بوابة الإغلاق وترويسات `no-store`.

### 2.6 البيئة والأسرار — `SOURCE_PRESENT`

- قراءة الإعداد على الخادم فقط عبر `src/server/kernel/env.mjs`؛ لا `PUBLIC_*` ولا `import.meta.env` ولا حقن إعدادات في HTML.
- القيمة الوحيدة التي تصل للعميل هي `data-auth-url`، وهي أصل خدمة Neon Auth العام اللازم لتهيئة عميل الدخول؛ ليست سرًا. لا تُعرض `NEON_AUTH_JWKS_URL` ولا `DATABASE_URL` ولا أي مفتاح.
- البوابة مغلقة افتراضيًا: `AIGAS_APP_ENABLED=false` يتغلب دائمًا؛ `true` وحده يفتح تشغيلًا غير تطويري؛ غياب العلم يفتح `astro dev` فقط.
- لا DSN/مفتاح/توكن يُعاد في أي حزمة استجابة؛ `connectionPrivilege` يعيد `{ rlsEnforced }` فقط.
- الأسرار تُمرر عبر لوحة الخدمة (`sync: false` في `render.yaml`) ولا تدخل المستودع.

### 2.7 الأخطاء والاستجابات — `SOURCE_PRESENT`

- كل الأخطاء غير المعروفة تتحول إلى رمز ثابت ورسالة عربية عامة (`DB_UNAVAILABLE`, `SECURE_CHAT_UNAVAILABLE`, `FIREWALL_UNAVAILABLE`, …) بحالة `503`.
- لا تُعاد رسالة السائق أو رمز SQL الخام؛ فقط رموز تصنيف مثل `KERNEL_SCHEMA_MISSING` و`KERNEL_DB_PRIVILEGE`.
- لا تُعاد نصوص المحادثة أو نتيجة المزود في أي رسالة خطأ؛ وSecure Chat يعلن `saved:false, contentStored:false`.

---

## 3. السجلات والتنقيح

### 3.1 الوضع الحالي — `SOURCE_PRESENT`

- **لا يوجد تسجيل تطبيقي** (`console.*` / `stdout` / `stderr`) في `src/`؛ تم التحقق بالبحث في المصدر أثناء هذه المهمة.
- `pool.on('error')` في `src/server/kernel/db.mjs` يتجاهل الخطأ بهدف عدم إسقاط العملية، ولا يطبع سلسلة الاتصال.
- سجل التدقيق (`audit` في `src/server/kernel/service.mjs`) **Metadata فقط**: `tenant_id`, `actor_user_id`, `action`, `correlation_id`, `policy_version`, `idempotency_key`. لا يحفظ أجسام الطلبات أو الأسماء أو البريد أو نصوص AI، ويُرفض أي حقل خارج الشكل المسموح.
- Secure Chat يسجّل أحداث المنع والطلب دون متن المحادثة (`auditBlocked`).

### 3.2 ما ليس تحت سيطرتنا — `NOT_VERIFIED`

سجلات منصة الاستضافة (Render)، وسجلات شبكة/Edge/CDN، وسجلات Neon، وسجلات مزود AI عند تفعيله: لم تُفحص ولا توجد سياسة احتفاظ معتمدة لها. لا تدّعِ أن هذه السجلات «بلا محتوى» أو «بلا PII».

### 3.3 قاعدة إلزامية عند إضافة تسجيل مستقبلي

1. لا JWT، ولا `Authorization`، ولا DSN، ولا مفاتيح مزود، ولا متن محادثة، ولا بريد/هاتف/هوية في أي سجل.
2. سجّل المعرّفات (`request_id`, `correlation_id`, `tenant_id`, `user_id`) والرموز (`code`, `dependencyStatus`, `status`) فقط.
3. عند الحاجة لاستكشاف خطأ، سجّل **نوع** الخطأ ورمزه، لا رسالته الخام.
4. الوصول للسجلات يكون بأقل صلاحية ومؤقتًا ومدققًا، ويُقاس ضد سياسة الاحتفاظ المعتمدة.

---

## 4. التعامل مع الحوادث Incident handling — `TARGET_REQUIREMENT`

**غير منفذ.** لا يوجد اليوم: جهة اتصال أمنية معلنة، حالة on-call، تصنيف شدة معتمد، مسار إبلاغ العميل، ولا صفحة حالة عامة.

المطلوب قبل أي وعد تعاقدي:

| البند | المتطلب | الحالة |
|---|---|---|
| تصنيف الشدة والأثر | تعريف مستويات + معايير تصعيد مكتوبة | `TARGET_REQUIREMENT` |
| مسار الإبلاغ | قناة مصرح بها + جهة مسؤولة + زمن استجابة داخلي | `BLOCKED` — يحتاج قرار مالك |
| احتواء الحادث | إجراءات عزل جلسة/مفتاح/مستأجر دون كشف غيره | `TARGET_REQUIREMENT` |
| إخطار الأطراف | نص ونافذة إشعار بحسب العقد واللوائح | `BLOCKED` — قرار قانوني |
| أدلة الحادث | حفظ Metadata كافٍ دون محتوى حساس | `SOURCE_PRESENT` جزئيًا (Audit Kernel) |
| مراجعة لاحقة | تقرير سبب جذري وإجراءات تصحيح | `TARGET_REQUIREMENT` |

لا يُترجم تنفيذ جزء من هذه البنود إلى «امتثال» أو «SLA» أو «شهادة».

---

## 5. الاحتفاظ بالسجلات Log retention — `TARGET_REQUIREMENT`

- لا توجد مدة احتفاظ معتمدة لأي فئة: أحداث التدقيق، سجلات المنصة، طلبات Secure Chat الوصفية، أو حزم الأدلة.
- `retention_class` في التصميم ما زال `PENDING_APPROVAL`.
- Secure Chat يعلن صراحةً `retention.enabled=false` و`contentStored=false`؛ هذا **إقرار بعدم وجود سياسة حفظ معتمدة للمتن**، وليس سياسة «zero retention» تجارية.
- قيم مثل `support_log_retention` و`backup_purge_schedule` و`legal_hold_authority` غير محسومة (انظر `docs/ENTERPRISE-TRIAL-POLICY.md` §10.4).

**العائق:** تحديد المدة يحتاج قرار مالك + تصنيف بيانات + مراجعة قانونية، ثم تنفيذ آلي للتنظيف. لا يُكتب رقم في الكود أو الموقع قبل ذلك.

---

## 6. حذف البيانات وخروج العميل Data deletion & customer exit — `TARGET_REQUIREMENT`

- لا يوجد مسار حذف منفذ للمستأجر أو المستخدم أو المحتوى. حالات الخروج/الحذف في لوحة Kernel معلنة `POLICY_PENDING_APPROVAL` ولا تنفذ حذفًا.
- لا يوجد تصدير خروج شامل (بيانات + سياسات + أصول + أدلة) كحزمة معتمدة؛ توجد تصديرات جزئية داخل المنتجات فقط.
- لا توجد آلية «محو مثبت» ولا وعد بمحو النسخ الاحتياطية.

المتطلب المستهدف:

1. تعريف نطاق الحذف: ما يُحذف فعليًا، وما يبقى تحت Legal Hold أو التزام قانوني.
2. مهلة معتمدة بين الطلب والتنفيذ، وتأكيد كتابي عند الإنهاء.
3. تعامل مستقل مع النسخ الاحتياطية (جدول تنقية) دون ادعاء حذف فوري.
4. إثبات: تقرير حذف + سجل تدقيق Metadata، بلا كشف بيانات مستأجر آخر.

**BLOCKED:** كل ما سبق يحتاج اعتمادًا وقرارًا قانونيًا ومهاجر/أداة تشغيل غير موجودة. حتى ذلك الحين لا يجوز وعد عميل بمحو أو خروج فوري.

---

## 7. On-Premise وAir-Gapped — `TARGET_REQUIREMENT`

هذه أنماط **مستهدفة** في البنية (`docs/INTEGRATION-AND-DEPLOYMENT.md` §17 و`docs/PLATFORM-ARCHITECTURE.md` §19)، وليست مبنية في هذا المستودع:

- لا حزمة تثبيت محلية، ولا ترخيص موقّع قابل للتحقق دون اتصال.
- لا Metering محلي، ولا IdP محلي، ولا Backup/DR محلي موثق.
- لا يوجد إثبات تشغيل دون DNS/Internet/NTP سحابي.

**العائق:** Air-Gapped يحتاج مسار إصدار واعتماد وتوقيع وتحديث/تراجع مستقلًا. لا تُباع كخدمة قبل وجود هذه البنية وأدلة تشغيل فعلية.

---

## 8. علاقة الأمن التطبيقي بعزل المؤسسات

### 8.1 لقطة قراءة فقط من Neon (2026-11-03)

| البند | المرصود | الأثر على الخصوصية/الأمن |
|---|---|---|
| عدد الجداول | 31، كلها `RLS` مفعّل | لا يعني عزلًا فعليًا مع دور يتجاوز RLS |
| السياسات | سياسيتان فقط على جدولين | الوصول الفعلي **default deny** لا نتيجة منح مكتمل |
| `aigas_runtime` | غير موجود | لا دور تشغيل مقيّد حتى الآن |
| أدوار `rolbypassrls` | 4 | `DATABASE_URL` الحالي مالك متجاوز |
| Data API | `active` على `public` | سطح وصول عميل مباشر يحتاج تعطيلًا أو تقييدًا |
| منطقة المشروع | `aws-us-east-2` | **لا يوجد إثبات إقامة بيانات سعودية**؛ أي ادعاء يحتاج قرارًا وبنية جديدة |
| اتصالات عامة | `block_public_connections=false`، `allowed_ips` فارغة | سطح شبكة مفتوح يحتاج تقييدًا من المشغّل |
| حماية الفروع | `protected:false` | لا حماية لفرع `production` |
| بيانات العمل/المستخدمون | صفر | لا يمكن بناء ادعاء تشغيلي على هذا الفراغ |

هذه لقطة مؤرخة، تُعاد قراءتها قبل أي قرار. القيم لا تُستخدم في أي واجهة أو استجابة.

### 8.2 حدود العزل الحالية

- الاتصال الخادمي الحالي: دور مالك `rolbypassrls=true`؛ لذلك العزل الفعلي يعتمد على شروط `tenant_id` الصريحة في الاستعلامات، لا على RLS.
- Data API مفعّل على `public`، والمنح والسياسات غير مكتملة؛ التفاصيل في `docs/DATA-ACCESS-AND-RLS.md` مع خطة `0018`/`0019` غير المطبقة.
- لا يجوز الاستناد إلى «RLS مفعّل» كإثبات عزل، ولا إلى «GRANT مغلق» كإثبات أمان؛ الفحص هو `role × schema exposure × RLS policy × predicate source`.
- مواءمة سدايا/PDPL/NCA **ليست** اعتمادًا مثبتًا بوجود controls في الكود.
- **إقامة البيانات:** المشروع الحالي في `aws-us-east-2`. لا يجوز وصف المنصة بالاستضافة السعودية أو الاستقلال المحلي؛ نقل المنطقة/إنشاء مشروع سعودي قرار مالك + مراجعة قانونية + خطة ترحيل، ولم يُنفَّذ.

---

## 9. تدوير الأسرار — مطلوب من المشغّل `BLOCKED`

خلال تطوير سابق تعرّضت قيم إعداد في سياقات غير إنتاجية. لا تُطبع هنا ولا تُرسل عبر أي قناة:

1. **دوّر** كل مفتاح/توكن لامس بيئة تطوير أو محادثة أو لقطة شاشة: `DATABASE_URL` (كلمة مرور دور قاعدة البيانات)، `NEON_AUTH_*` عند وجود سر، وأي `AIGAS_SC_*_API_KEY` إن أُنشئ لاحقًا.
2. أنشئ القيم الجديدة في Secret Store الخاص بالخدمة (`sync: false`)، لا في المستودع ولا في `.env` متتبع.
3. تحقق أن القيم القديمة باطلة، وسجّل تاريخ التدوير (بلا قيم) في سجل تشغيلي داخلي.
4. بعد التدوير، أعد التحقق من `/app/api/kernel/health` واتصال القاعدة.

هذا إجراء مشغّل؛ **لم يُنفذ** في هذه المهمة ولم تُرسل أي رسالة خارجية.

---

## 10. العوائق الحالية

| العائق | الأثر |
|---|---|
| لا جهة إشعار أمنية ولا on-call ولا صفحة حالة | لا يمكن وعد عميل بزمن استجابة أو إشعار حادث |
| لا سياسة احتفاظ معتمدة | لا ادعاء zero retention ولا مدة حفظ |
| لا مسار حذف/خروج منفذ | لا ادعاء محو عند إنهاء الخدمة |
| لا On-Prem/Air-Gapped مبني | لا بيع كنمط نشر |
| RLS/GRANT/Data API غير مكتملة | العزل الحالي مشروط بشروط الاستعلام الصريحة |
| لا مفتاح/نموذج AI معتمد (`APPROVED_MODELS=[]`) | Secure Chat لا يرسل أي محتوى |
| فرع Neon `production` غير محمي | يحتاج Runbook `docs/NEON-BRANCH-PROTECTION-RUNBOOK.md` |
| لا اختبار اختراق أو E2E أو مراجعة مستقلة | كل ما سبق `NOT_VERIFIED` أمنيًا |

---

## 11. حالة التحقق في هذه المهمة

| البند | الدليل | الحالة |
|---|---|---|
| لا تسريب أسرار إلى العميل | فحص المصدر: لا `PUBLIC_*`، لا حقن إعدادات | `SOURCE_PRESENT` |
| لا تسجيل JWT/DSN/مفتاح/متن | فحص المصدر: لا `console.*` في `src/` | `SOURCE_PRESENT` |
| Origin على كل كتابة | فحص مسارات الكتابة | `SOURCE_PRESENT` |
| no-store/noindex لمنطقة `/app` | `src/middleware.ts` + `AppLayout` | `SOURCE_PRESENT` |
| إغلاق مسار مُرمّز لبوابة `/app` | `normalizePath` في `src/middleware.ts` | `SOURCE_PRESENT` |
| تشغيل/اختبار/بناء/اختراق/نشر | لم يُشغّل بطلب المهمة | `NOT RUN` / `NOT_VERIFIED` |

لا يُصدر هذا المستند شهادة Go-Live ولا نتيجة اختبار أمني.
