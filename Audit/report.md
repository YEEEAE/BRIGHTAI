# التقرير الختامي المحدّث لتدقيق BRIGHTAI

**المستودع:** [github.com/YEEEAE/BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI)  
**الموقع:** [brightai.live](https://brightai.live/)  
**تاريخ الفحص:** 25 نوفمبر 2026  
**نطاق الفحص:** الكود المنشور، الموقع الحي، المسارات، المعمارية، الأمن، تجربة المستخدم، التصميم، SEO/GEO، الربط الداخلي، الجاهزية التشغيلية، ومطابقة الوعود للواقع.

> **مهم:** هذا تدقيق مبني على القراءة والفحص الخارجي للنسخة الحالية. لم أمتلك صلاحية تشغيل `npm install` أو `npm run build` أو اختبارات Playwright داخل بيئة المستودع، لذلك لا أعتبر نجاح البناء والاختبارات مثبتًا إلا حيث يوجد دليل حي أو ملف اختبار واضح.

---

## 1. الخلاصة التنفيذية

BRIGHTAI تحسن بوضوح في **اللغة، الشفافية، تصميم الموقع، فصل التجارب التعليمية عن المنتجات التشغيلية، والربط الداخلي**. النسخة الحالية أصبحت أكثر نضجًا من النسخ السابقة، خصوصًا لأنها لا تدعي أن المنتجات تعمل فعليًا دون إثبات.

لكن ما زالت توجد فجوة كبيرة بين:

1. **موقع تسويقي/تعليمي متقن.**
2. **منصة SaaS مؤسسية جاهزة للاستخدام التجاري.**

الموقع نفسه يصرح بأن تشغيل المنتجات غير متحقق، وأن المختبرات تعتمد على بيانات اصطناعية ومحاكاة محلية. صفحة المنتجات تسمي خمسة منتجات وKernel، لكنها تذكر بوضوح أن الروابط لا تعني وجود خدمات متصلة حاليًا. [Source](https://brightai.live/products/)

أكبر ملاحظة تشغيلية مؤكدة حاليًا:

- المسار العام `https://brightai.live/healthz` يرجع **404** بدل استجابة صحة تشغيلية.
- بعض مسارات التطبيق والبوابة تعطي 404 أو غير متاحة خارجيًا.
- يوجد كود متقدم للبوابة، المصادقة، قاعدة البيانات، وواجهات API، لكن الربط الفعلي المنشور بينها وبين الإنتاج غير مثبت.
- توجد إجراءات جيدة للحماية، لكن سياسة CSP الكاملة لا تُفرض افتراضيًا؛ بل تعمل في وضع `Report-Only` حتى يتم تفعيل المتغير `AIGAS_CSP_ENFORCE=true`.

---

# 2. النتيجة الرقمية

## الدرجة الإجمالية الحالية: **72.4 / 100**

هذه الدرجة تعكس جودة المشروع كـ **موقع ومنصة تجريبية موثوقة وقابلة للتطوير**، وليست درجة جاهزية SaaS مؤسسي كامل.

| المحور | الوزن | التقييم |
|---|---:|---:|
| جودة الكود والمعمارية | 15% | **78%** |
| الأمن والخصوصية | 15% | **76%** |
| جاهزية SaaS والتشغيل | 15% | **52%** |
| سلامة API والمصادقة والعزل | 10% | **70%** |
| تجربة المستخدم UX | 12% | **81%** |
| التصميم البصري UI/RTL | 10% | **84%** |
| الربط الداخلي والتنقل | 8% | **84%** |
| SEO/GEO/AEO والمحتوى | 8% | **82%** |
| الاختبارات وDevOps | 5% | **55%** |
| الموثوقية والشفافية التجارية | 2% | **88%** |
| **المجموع** | **100%** | **72.4%** |

## تفسير سريع للنتيجة

- **80–90:** ناضج جدًا كموقع تجريبي وتعليمي.
- **70–79:** جيد وقابل للتطوير، لكن غير جاهز بعد كمنصة إنتاج مؤسسية.
- **60–69:** يحتاج إصلاحات جوهرية قبل الاعتماد.
- **أقل من 60:** غير مناسب للإطلاق التجاري.

BRIGHTAI حاليًا في منطقة **جيدة ولكن قبل الإطلاق المؤسسي**.

---

# 3. ما تم إنجازه بشكل جيد

## 3.1 فصل واضح بين الديمو والمنتج الحقيقي

هذه من أقوى نقاط النسخة الحالية.

صفحات المنتجات تقول صراحة إن الأمثلة:

- محلية أو تعليمية.
- تستخدم بيانات اصطناعية.
- لا تتصل بمزود AI في الوضع المحلي.
- لا تثبت وجود خدمة إنتاجية.
- لا تثبت مستوى حماية أو اعتمادًا تنظيميًا.

مثلًا، صفحة Firewall توضّح أن الفحص الحالي **مطابقة حرفية وقاعدة Demo** وليس فحصًا أمنيًا أو دلاليًا حقيقيًا. [Source](https://brightai.live/products/firewall/)

وهذا أفضل بكثير من استخدام عبارات تسويقية مثل “حماية كاملة” أو “امتثال مضمون”.

## 3.2 الشفافية التجارية ممتازة

صفحة Trust من أفضل الصفحات في المشروع؛ فهي تفرق بين:

- التصور المستهدف.
- الدليل التشغيلي.
- الشهادة.
- الادعاء التسويقي.
- التشغيل الفعلي.

كما توضح أن الموردين، مناطق المعالجة، مدد الاحتفاظ، الشهادات، والتدقيقات الأمنية غير مثبتة حاليًا. [Source](https://brightai.live/trust/)

هذا يقلل المخاطر القانونية والتسويقية ويزيد الثقة.

## 3.3 الهوية البصرية أصبحت متماسكة

الموقع يستخدم:

- هوية عربية واضحة.
- تصميم RTL فعلي.
- خطوط عربية مخصصة.
- مساحات بيضاء جيدة.
- نظام صفحات داخلي متناسق.
- تنقل موحد.
- روابط واضحة بين المنتجات والـKernel ومركز المعرفة.

الصفحات لا تبدو كقوالب SaaS عامة، بل لها هوية مميزة مرتبطة بالحوكمة والأمان.

## 3.4 بنية Astro مناسبة للمشروع

ملف إعداد Astro يوضح استخدام:

- Astro SSR.
- Node adapter بوضع standalone.
- Sitemap.
- أدوات مخصصة للـSEO.
- build version.
- فلترة الصفحات القابلة للفهرسة.

هذا اختيار مناسب لموقع محتوى سريع مع بوابة تطبيق مستقبلية. [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/astro.config.mjs)

## 3.5 طبقات حماية جيدة مبدئيًا

الكود الحالي يحتوي على إجراءات جيدة، منها:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options`
- `Permissions-Policy`
- `Referrer-Policy`
- `Cross-Origin-Resource-Policy`
- `X-Robots-Tag` للبوابة الخاصة.
- `Cache-Control: private, no-store` للمساحات الخاصة.
- التعامل مع `Authorization` و`Cookie` عبر `Vary`.
- تطبيع المسارات لمنع تجاوز بوابة `/app`.
- حماية مبدئية من الطلبات غير المسموحة.

هذه ليست بديلًا عن اختبار أمني مستقل، لكنها بداية جيدة.

## 3.6 حماية جيدة في معالج Kernel API

ملف HTTP المركزي يطبق عدة ضوابط جيدة:

- التحقق من الهوية قبل تنفيذ الطلب.
- التحقق من Origin في عمليات الكتابة.
- اشتراط `application/json`.
- تحديد حجم الطلب إلى 4096 بايت.
- رفض الحقول غير المعروفة.
- تحديد UUID.
- Rate limit مبدئي لعمليات الكتابة.
- عدم إعادة أخطاء قاعدة البيانات التفصيلية للمستخدم.
- تسجيل فشل الخدمة بصورة غير مباشرة.

[Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/kernel/http.mjs)

لكن توجد ملاحظة مهمة: معدل الطلبات الموجود **مؤقت داخل الذاكرة**، ولذلك لا يكفي للحماية في بيئة متعددة النسخ أو خلف Load Balancer.

---

# 4. أهم المشكلات الحالية

## P0 — حرجة قبل الإطلاق التجاري

## 4.1 مسار الصحة العام يرجع 404

تم اختبار:

```text
https://brightai.live/healthz
```

والنتيجة الحالية:

```text
HTTP 404
```

[Source](https://brightai.live/healthz)

في المقابل، المستودع يحتوي على مسار `src/pages/healthz.ts` مخصص لفحص جاهزية خدمة Node. هذا يعني وجود احتمال قوي لواحد من التالي:

1. النسخة المنشورة لا تحتوي على آخر build.
2. المسار المنشور مختلف عن المسار الموجود في المصدر.
3. النشر الحالي Static أو يمر عبر Redirect/Router غير متوافق.
4. الـhealth route لا يعمل بسبب إعدادات Render أو Astro adapter.
5. يوجد اختلاف بين بيئة المصدر وبيئة الإنتاج.

**الأثر:**

- مراقبة الخدمة لن تستطيع الاعتماد على `/healthz`.
- أنظمة uptime monitoring قد تعتبر التطبيق متعطلًا.
- لا يوجد إثبات خارجي أن خدمة SSR أو قاعدة البيانات جاهزة.
- يصعب ربط Deploy معين بحالة تشغيل فعلية.

### الإجراء المطلوب

اعتماد مسارين منفصلين:

```text
/healthz
```

لفحص العملية فقط، ويجب أن يكون سريعًا ولا يعتمد على قاعدة البيانات.

```text
/readyz
```

لفحص:

- اتصال قاعدة البيانات.
- حالة المصادقة.
- حالة الخدمات الخارجية الضرورية.
- نسخة التطبيق.
- حالة migrations.

ويجب أن ترجع الاستجابة JSON موحدًا، مثل:

```json
{
  "status": "ok",
  "version": "commit-sha",
  "dependencies": {
    "database": "ok",
    "auth": "ok"
  }
}
```

لا تجعل فشل مزود AI يجعل `healthz` يفشل؛ هذا يخص `readyz` أو فحصًا منفصلًا.

---

## 4.2 مسارات التطبيق والـAPI غير مثبتة في الإنتاج

تمت ملاحظة أن:

- `/app/kernel/`
- `/app/trial/`
- `/app/api/trial`

لم تكن متاحة عبر الموقع العام أثناء الفحص الخارجي.

هذا لا يثبت بالضرورة وجود خطأ في الكود، لكنه يثبت أن **المسار غير متاح خارجيًا حاليًا**. يجب عدم تقديم تجربة تسجيل أو Trial على أنها جاهزة قبل إثبات المسار كاملًا.

### مطلوب

اختبار نشر حقيقي يشمل:

1. فتح `/auth/sign-up/`.
2. إنشاء مستخدم تجريبي.
3. تسجيل الدخول.
4. فتح `/app/`.
5. إنشاء Workspace.
6. فتح كل منتج.
7. تنفيذ API read.
8. تنفيذ API write.
9. تسجيل الخروج.
10. إعادة استخدام رابط قديم أو جلسة قديمة.

---

## 4.3 لا يوجد إثبات كافٍ لنجاح CI/CD

ملف workflow المتوقع:

```text
.github/workflows/ci.yml
```

لم يكن قابلًا للقراءة من المسار المتوقع أثناء الفحص.

بالتالي لا أستطيع اعتبار الآتي مثبتًا:

- أن كل Pull Request يمر عبر Build.
- أن اختبارات SEO تعمل تلقائيًا.
- أن اختبارات Accessibility تعمل تلقائيًا.
- أن Secrets غير مكشوفة.
- أن migrations تُراجع تلقائيًا.
- أن Deployment مرتبط بـcommit محدد.

### الإجراء المطلوب

إضافة Pipeline إلزامي يتضمن:

```bash
npm ci
npm run build
npm run test:seo
npm run test:healthz
npm run test:accessibility:smoke
npm audit --audit-level=high
```

والأفضل إضافة:

```bash
npm run test:auth:e2e
```

مع بيئة اختبار منفصلة وقاعدة بيانات مؤقتة.

---

# 5. تدقيق الكود والمعمارية

## الدرجة: 78%

## نقاط قوية

ملف `package.json` يظهر وجود أوامر واضحة:

- build
- preview
- start
- اختبارات auth
- اختبارات accessibility/performance
- اختبارات SEO
- اختبارات healthz

[Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/package.json)

كما أن المعمارية تفصل نسبيًا بين:

```text
src/pages
src/components
src/server/kernel
src/server/observability
src/server/seo
src/server/*products
migrations
tests
scripts
```

وهذا أفضل من وضع المنطق كله داخل صفحات Astro.

## النواقص

### 5.1 غياب طبقة Domain واضحة

لا يزال من المهم فصل:

```text
HTTP handlers
Application services
Domain rules
Database repositories
External providers
```

بدل أن تتوزع قواعد المنتج بين:

- صفحات Astro.
- `service.mjs`.
- `core.mjs`.
- handlers.
- migration logic.

### 5.2 عدم وجود عقود API موحدة كافية

يجب تعريف مخططات صريحة باستخدام Zod أو Valibot أو JSON Schema، مثل:

```text
TrialStartRequest
TrialStartResponse
WorkspaceResponse
ProductDecisionResponse
AuditEventResponse
```

وجود دالة `exact()` مفيد، لكنه ليس بديلًا عن validation typed schema شامل.

### 5.3 خطورة الاعتماد على متغيرات البيئة دون Startup Validation

ملف البيئة يقرأ القيم وقت التشغيل، لكن يجب إضافة فحص عند بدء التطبيق:

- `DATABASE_URL`
- `NEON_AUTH_BASE_URL`
- مفاتيح JWT
- إعدادات مزود AI
- `AIGAS_CSP_ENFORCE`
- بيئة التشغيل
- URLs المسموحة

يجب أن يفشل التطبيق مبكرًا برسالة آمنة إذا كان الإعداد ناقصًا.

---

# 6. الأمن والخصوصية

## الدرجة: 76%

## نقاط جيدة

ملف Middleware يطبق مجموعة واسعة من headers الأمنية، ويفصل المسارات العامة عن مسارات `/app`. كما أن الكود يضع مسارات البوابة الخاصة في وضع:

```text
private, no-store
```

ويضع:

```text
X-Robots-Tag: noindex, nofollow
```

على الأسطح الخاصة. [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/middleware.ts)

## الملاحظة الأهم: CSP ليست Enforcement دائمًا

ملف سياسة الأمان يوضح أن:

- السياسة الأساسية مفعلة.
- السياسة الكاملة قد تعمل `Report-Only`.
- تفعيل السياسة الكاملة يعتمد على:

```text
AIGAS_CSP_ENFORCE=true
```

[Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/observability/security-policy.mjs)

هذا مفهوم أثناء التطوير، لكنه غير كافٍ كحالة نهائية.

### المطلوب

قبل الإنتاج:

1. جمع CSP reports.
2. إصلاح أي مصادر غير مطلوبة.
3. تفعيل:

```text
AIGAS_CSP_ENFORCE=true
```

4. استخدام nonce بدل `unsafe-inline` متى أمكن.
5. إضافة `report-to` أو Endpoint مخصص للتقارير.
6. منع أن تصبح تقارير CSP مصدر تسريب بيانات.

## 6.1 Rate limit داخل الذاكرة غير مناسب للتوسع

في `http.mjs` توجد خريطة داخل الذاكرة لحساب الطلبات. هذا جيد كـabuse guard محلي، لكنه:

- لا يعمل بصورة موحدة بين نسخ متعددة.
- يختفي عند إعادة تشغيل العملية.
- لا يحمي إذا تغيرت الجهة التي تستقبل الطلب.
- لا يطبق على كل المسارات بالضرورة.

### المطلوب

استخدام Rate Limit موزع، مثل:

- Redis.
- Upstash.
- Neon جدول عدادات مضبوط.
- Rate limiter أمامي من Render/Cloudflare.

مع مفاتيح منفصلة لـ:

```text
IP
user_id
workspace_id
endpoint
operation
```

---

# 7. المصادقة والعزل متعدد المستأجرين

## الدرجة: 70%

وجود ملفات للمصادقة، الوصول، قاعدة البيانات، والسياسات مؤشر جيد. لكن الجاهزية لا تثبت بالقراءة فقط.

يجب إثبات التالي باختبارات فعلية:

| الاختبار | الحالة الحالية |
|---|---|
| مستخدم A لا يرى Workspace B | غير مثبت |
| مستخدم في Workspace A لا يقرأ Ledger B | غير مثبت |
| تغيير `workspace` في Query لا يرفع الصلاحيات | غير مثبت |
| Role منخفض لا ينفذ Admin operation | غير مثبت |
| JWT قديم أو خاطئ يُرفض | غير مثبت خارجيًا |
| حذف العضوية يلغي الوصول فورًا | غير مثبت |
| دعوة المستخدم لا تسمح بتجاوز workspace | غير مثبت |
| سجلات التدقيق لا تكشف النص السري | غير مثبت |

### المطلوب إضافته

اختبارات عزل آلية من نوع:

```text
tenant-isolation.test.mjs
authorization-matrix.test.mjs
workspace-boundary.test.mjs
role-escalation.test.mjs
session-revocation.test.mjs
```

ولا يكفي اختبار نجاح المستخدم الصحيح؛ يجب اختبار المستخدم الخطأ.

---

# 8. تجربة المستخدم UX

## الدرجة: 81%

## نقاط قوية

- رحلة الموقع مفهومة نسبيًا.
- مركز المعرفة ظاهر.
- المنتجات الخمسة لها أدوار واضحة.
- كل منتج يشرح “جرّب هذا” و“سترى”.
- وجود Kernel كطبقة مشتركة مشروح بوضوح.
- الموقع يميز بين المختبر العام وطلب الوصول والحساب ومساحة العمل.
- صفحة التواصل لا تدعي أن الرسالة وصلت تلقائيًا.
- الصفحة توضح أن البريد وواتساب قنوات خارجية وأن الإرسال يحتاج تنفيذ المستخدم.

صفحة التواصل صادقة جدًا بخصوص أن الموقع لا يستطيع تأكيد الإرسال أو التسليم. [Source](https://brightai.live/contact/)

## نقاط الضعف

### 8.1 كثرة التحفظات قد تربك المستخدم

الشفافية ممتازة، لكن بعض الصفحات تحتوي على تكرار متواصل لعبارات:

- غير متحقق.
- ليس منتجًا فعليًا.
- لا يثبت التشغيل.
- لا تستخدم بيانات حقيقية.
- ليس اعتمادًا.
- لا توجد أسعار نهائية.

هذه العبارات ضرورية قانونيًا، لكن تكرارها قد يجعل المستخدم يشعر أن المنتج “غير موجود” بدل أن يفهم أنه في مرحلة Demo/Pre-Beta.

### الحل

استخدم نظام حالة مرئي وموحد:

```text
DEMO — يعمل محليًا
PREVIEW — يحتاج وصولًا
PILOT — متاح بموافقة
PRODUCTION — متاح بعقد
```

ثم ضع التفاصيل في صندوق موحد بدل تكرار الفقرات.

### 8.2 المسار التجاري غير مباشر

المستخدم الذي يريد:

```text
تجربة
طلب عرض
فتح حساب
فهم المنتج
```

يحتاج التنقل بين صفحات متعددة.

اقترح إضافة CTA ثابت في كل صفحة منتج:

```text
جرّب المثال
اطلب وصولًا تجريبيًا
اطلب عرضًا مؤسسيًا
راجع دليل الأمان
```

### 8.3 لا توجد حالة نجاح مؤكدة للتواصل

الاعتماد على mailto وWhatsApp مناسب مبدئيًا، لكنه لا ينتج:

- رقم طلب.
- تاريخ إرسال.
- Confirmation.
- CRM lead.
- موافقة على الخصوصية.
- تتبع متابعة.

عند الانتقال التجاري يجب بناء Contact API بسيط مع:

- CAPTCHA أو Turnstile.
- Honeypot.
- Rate limit.
- Consent.
- رقم طلب.
- رسالة نجاح.
- عدم حفظ نص حساس دون ضرورة.

---

# 9. التصميم وواجهة المستخدم

## الدرجة: 84%

طبقت في التقييم مبادئ مهارة **web-artifacts-builder** التي طلبتها، خصوصًا:

- تجنب مظهر AI النمطي.
- عدم الإفراط في البطاقات الدائرية.
- عدم استخدام تدرجات بنفسجية عامة.
- بناء واجهة لها شخصية بصرية.
- التركيز على التسلسل الهرمي، الحالات، والوصولية بدل الزخرفة فقط.

المهارة نفسها توصي ببناء واجهات React/Vite/Tailwind عند إنشاء Artifact مستقل، وتؤكد تجنب “AI slop” مثل البطاقات الموحدة والتدرجات المبالغ فيها. [Source](https://raw.githubusercontent.com/anthropics/skills/main/skills/web-artifacts-builder/SKILL.md)

> لم أنفذ `npx skills add` داخل المستودع لأن بيئة المحادثة لا توفر Terminal أو صلاحية تعديل ملفات GitHub. لكنني استخدمت إرشادات المهارة كمعايير تدقيق تصميمية. كذلك، موقعكم مبني على Astro وليس React Artifact، لذلك استخدمت المبادئ البصرية والاختبارية المناسبة بدل فرض Stack مختلف.

## ملاحظات تصميمية

### نقاط قوية

- RTL حاضر فعليًا.
- الألوان مرتبطة بالهوية.
- العناوين ذات تسلسل جيد.
- الـbreadcrumb مفيد.
- وجود skip link في الموقع المنشور نقطة ممتازة.
- صفحة 404 مصممة وليست صفحة افتراضية.
- النماذج والرحلات تعتمد على النص أكثر من الزخرفة.

### تحسينات مطلوبة

1. توحيد حالات المنتج بصريًا.
2. رفع وضوح CTA الأساسي.
3. زيادة التباين لبعض النصوص الثانوية.
4. اختبار 320px و375px و768px.
5. اختبار لوحة مفاتيح كامل.
6. إضافة focus states أكثر وضوحًا.
7. تقليل الاعتماد على الحركة في صفحات الرحلة.
8. توفير `prefers-reduced-motion`.
9. استخدام screenshots حقيقية للتطبيق عند توفره، بدل الاكتفاء بالتصور.
10. توفير حالات:
   - Loading
   - Empty
   - Error
   - Success
   - Permission denied
   - Offline

---

# 10. الربط الداخلي والتنقل

## الدرجة: 84%

## نقاط جيدة

خريطة Sitemap المنشورة واسعة وتشمل:

- الصفحة الرئيسية.
- المنتجات.
- Kernel.
- صفحات القطاعات.
- مركز المعرفة.
- صفحات الامتثال.
- الخصوصية.
- الأسعار.
- الثقة.
- الخدمات.
- الحلول.

[Source](https://brightai.live/sitemap-0.xml)

والـrobots.txt يسمح بالزحف ويشير إلى Sitemap رسمي. [Source](https://brightai.live/robots.txt)

## المشاكل

### 10.1 يجب فصل الروابط العامة عن المسارات غير المتاحة

إذا كانت روابط:

```text
/auth/sign-up/
/app/
/app/trial/
/app/api/
```

غير جاهزة فعليًا، فلا ينبغي أن تظهر كرحلة أساسية مفتوحة للمستخدم العام.

### 10.2 احتمالية وجود روابط توحي بالتفعيل

صفحة المنتجات تعرض:

```text
المختبر العام
طلب الوصول
الحساب
مساحة العمل
المنتج
```

وهذا جيد من ناحية تصور الرحلة، لكنه يحتاج Labels أكثر وضوحًا إذا لم تكن هذه الأجزاء مفعلة:

```text
قريبًا
يتطلب وصولًا
غير متاح للعامة
```

### 10.3 يلزم اختبار روابط آلي

أضف اختبارًا يفحص:

- كل الروابط الداخلية.
- كل صفحات Sitemap.
- عدم وجود 404.
- عدم وجود Redirect chain.
- صحة canonical.
- صحة trailing slash.
- تطابق الروابط المنشورة مع المسارات الفعلية.

---

# 11. SEO وGEO وAEO

## الدرجة: 82%

## نقاط قوية

- Sitemap موجود.
- robots.txt موجود.
- الموقع يستخدم عناوين عربية واضحة.
- صفحات المعرفة منظمة حسب موضوعات عالية القيمة.
- هناك ربط بين المنتج والمحتوى التعليمي.
- الموقع لا يخلط دائمًا بين المحتوى التعليمي والاستشارة القانونية.
- وجود صفحة ثقة وامتثال يساعد على بناء E-E-A-T.
- وجود صفحات مؤلفين ومراجعين يمكن أن يكون مفيدًا إذا تم ربطه بهويات حقيقية موثقة.

## النواقص

### 11.1 المحتوى يحتاج أدلة خارجية منظمة

الكثير من المقالات جيدة تحريريًا، لكن السلطة الرقمية لن تُبنى فقط من كثرة الصفحات. تحتاجون إلى:

- مراجع رسمية.
- روابط SDAIA وNCA وPDPL الرسمية.
- تاريخ مراجعة واضح.
- اسم مراجع متخصص حقيقي.
- نطاق المراجعة.
- روابط خارجية موثوقة.
- صفحات مؤلفين تحتوي مؤهلات قابلة للتحقق.

### 11.2 Schema يحتاج تدقيقًا مستقلًا

أوصي بإضافة ومراجعة:

```text
Organization
WebSite
WebPage
BreadcrumbList
Article
Person
FAQPage
SoftwareApplication
Product
```

لكن لا تستخدم `Product` أو `SoftwareApplication` بادعاءات لا يثبتها المنتج فعليًا.

### 11.3 مركز المعرفة واسع لكنه يحتاج عناقيد

بدل أن تكون 32 صفحة منفصلة فقط، أضف صفحات Hub مثل:

```text
حوكمة الذكاء الاصطناعي في السعودية
الخصوصية والـPDPL والذكاء الاصطناعي
أمن نماذج الذكاء الاصطناعي
إدارة مخاطر الذكاء الاصطناعي
دليل المشتري المؤسسي
```

مع روابط داخلية منهجية.

---

# 12. الجاهزية التجارية وSaaS

## الدرجة: 52%

هذه أضعف نقطة في المشروع حاليًا، ليس بسبب سوء التصميم، بل لأن أدلة التشغيل الفعلي غير كافية.

صفحة الأسعار صريحة في أن الأسعار والحصص وSLA النهائية غير معتمدة، وأن تجربة 48 ساعة ومسارات الـPilot ليست تفعيلًا تجاريًا تلقائيًا. [Source](https://brightai.live/pricing/)

## ما ينقص قبل اعتبار المنتج SaaS جاهزًا

### الحسابات والمؤسسات

- تسجيل مستخدم.
- تحقق بريد.
- إنشاء مؤسسة.
- دعوات.
- أدوار.
- إزالة عضو.
- SSO/SAML أو خارطة طريق واضحة.
- MFA.
- استرداد حساب.
- تعطيل حساب.
- سجل جلسات.
- جلسات قابلة للإلغاء.

### الاشتراكات والفوترة

- خطط واضحة.
- Usage metering.
- Quotas.
- Cost ceiling.
- Invoices.
- Tax/VAT handling.
- Trial expiration.
- Downgrade/upgrade.
- إلغاء.
- فشل الدفع.
- منع تجاوز الحصة.

### التشغيل

- Backups.
- Restore drill.
- Migration rollback.
- Incident response.
- Status page.
- SLA.
- RPO/RTO.
- مراقبة.
- تنبيهات.
- إدارة أسرار.
- فصل بيئات dev/staging/prod.

### البيانات والخصوصية

- DPA.
- قائمة معالجي البيانات.
- مناطق التخزين والمعالجة.
- سياسة الاحتفاظ والحذف.
- DSAR.
- تصدير البيانات.
- حذف المؤسسة.
- سياسة No-Training قابلة للإثبات التعاقدي.
- سجل وصول إداري.

---

# 13. ترتيب الأولويات

## المرحلة الأولى — خلال 24 إلى 72 ساعة

1. إصلاح `/healthz`.
2. إنشاء `/readyz`.
3. التحقق من أن Production مبني من آخر commit.
4. نشر رقم commit في Header أو endpoint.
5. التأكد من حالة `/app` و`/app/api`.
6. تفعيل CSP enforcement بعد اختبار المتصفح.
7. إصلاح أو توثيق CI.
8. فحص كل روابط Sitemap ضد 404.
9. إضافة Badge موحد لحالة كل منتج.
10. منع أي CTA يوحي بتفعيل غير موجود.

## المرحلة الثانية — خلال أسبوع

1. اختبارات عزل Tenant كاملة.
2. اختبارات Auth end-to-end.
3. اختبار جميع الأدوار.
4. Rate limit موزع.
5. Startup environment validation.
6. API schemas.
7. Error codes موحدة.
8. Contact flow قابل للتتبع.
9. Monitoring وAlerting.
10. اختبار mobile/accessibility حقيقي.

## المرحلة الثالثة — قبل Pilot

1. SSO/MFA.
2. Audit export.
3. Data retention.
4. Backup/restore drill.
5. Incident response.
6. DPA وشروط الخدمة.
7. قائمة الموردين.
8. مناطق المعالجة.
9. Cost controls.
10. Pilot acceptance criteria.

## المرحلة الرابعة — قبل الإطلاق التجاري

1. تدقيق اختراق مستقل.
2. مراجعة قانونية للـPDPL والعقود.
3. مراجعة عزل المؤسسات.
4. اختبار ضغط.
5. Disaster recovery.
6. SLA موثق.
7. دعم وتذاكر.
8. Billing production.
9. Status page.
10. إثباتات تشغيلية قابلة للتنزيل.

---

# 14. التقرير النهائي المختصر حسب الحالة

## جاهز الآن

- الموقع العام.
- المحتوى التعليمي.
- مركز المعرفة.
- المختبرات المحلية الاصطناعية.
- الهوية البصرية.
- الشفافية في وصف الحالة.
- البنية الأولية للكود.
- أساسيات headers الأمنية.
- أساس جيد للـSEO.

## جاهز جزئيًا

- Kernel.
- Auth.
- Database.
- API.
- Portal.
- Trial.
- Product services.
- Observability.
- migrations.

هذه موجودة في المصدر بدرجات مختلفة، لكن لا يوجد إثبات كافٍ أنها تعمل بصورة صحيحة في الإنتاج.

## غير جاهز للإعلان كمنتج مؤسسي

- SaaS متعدد المؤسسات.
- Trial إنتاجي.
- Workspace production.
- AI provider integration.
- Billing.
- SLA.
- Data residency.
- No-training evidence.
- Enterprise SSO.
- Incident operations.
- Backup/restore.
- Security audit.

---

# 15. الحكم النهائي

## الحكم العام: **GO للموقع التجريبي، NO للإطلاق المؤسسي الكامل**

### مناسب الآن لـ:

- عرض الفكرة.
- نشر محتوى الحوكمة.
- بناء الثقة.
- عرض نماذج UX.
- مختبرات تعليمية.
- التواصل مع العملاء المحتملين.
- الحصول على Feedback.
- Pilot داخلي غير حساس.

### غير مناسب حاليًا لـ:

- بيانات عملاء حقيقية.
- بيانات شخصية أو سرية.
- إعلان SaaS عام.
- وعود تشغيلية.
- ادعاء امتثال.
- ربط نماذج AI إنتاجية دون اختبارات.
- بيع Enterprise license قبل إثبات التشغيل.
- Air-Gapped أو On-Premise production.

---

# 16. برومبتات ختامية قوية

يمكنك نسخ البرومبتات التالية وتشغيلها على وكيل برمجي أو داخل بيئة Claude Code/Cursor/Codex. الأفضل تنفيذها بالترتيب.

---

## Prompt 1 — إصلاح الجاهزية التشغيلية

```text
أنت Principal Platform Engineer.

راجع مستودع BRIGHTAI كاملًا، وحدد الفرق بين:
- الكود الموجود في المصدر
- المسارات المبنية
- المسارات المنشورة فعليًا
- إعدادات Render/Node/Astro
- حالة healthz وreadyz

المطلوب:
1. اجعل /healthz يرجع 200 JSON لفحص العملية فقط.
2. أنشئ /readyz لفحص قاعدة البيانات والإعدادات الأساسية.
3. أضف version وcommit SHA في الاستجابة.
4. لا تكشف أسرارًا أو connection strings.
5. أضف اختبارات Node لكل الحالات:
   - healthy
   - database unavailable
   - missing environment
   - malformed request
6. تحقق من trailing slash وredirect behavior.
7. حدث README بتعليمات اختبار الإنتاج.
8. لا تعتبر وجود الملف دليلًا على عمله؛ شغّل build والاختبارات وأبلغ عن الفشل الحقيقي.

المخرجات:
- patch كامل
- قائمة الملفات المعدلة
- نتائج npm run build
- نتائج اختبارات healthz/readyz
- أي مخاطر متبقية
```

---

## Prompt 2 — تدقيق Auth وTenant Isolation

```text
أنت PostgreSQL Security Engineer وSaaS Authorization Auditor.

دقق جميع مسارات:
- authentication
- authorization
- workspace
- membership
- role checks
- product access
- audit access
- trial access

أنشئ مصفوفة صلاحيات تشمل:
- anonymous
- authenticated user
- workspace member
- workspace admin
- operator
- suspended user
- deleted member

اختبر أن:
1. مستخدم A لا يستطيع قراءة أو تعديل Workspace B.
2. تغيير workspace ID في query أو body لا يغير نطاق الصلاحيات.
3. المستخدم الموقوف يرفض فورًا.
4. حذف العضوية يلغي الوصول.
5. لا يوجد IDOR.
6. لا توجد صلاحية تعتمد على قيمة يرسلها العميل فقط.
7. كل query تستخدم tenant boundary صريحة.
8. RLS مفعلة حيث يلزم.
9. audit events لا تكشف نصوصًا سرية.
10. كل رفض صلاحية له status/code موحد.

المخرجات:
- authorization matrix
- اختبارات فشل واختبارات نجاح
- قائمة جميع المسارات غير المحمية
- إصلاحات مباشرة
- تقرير بما لا يمكن إثباته
```

---

## Prompt 3 — تثبيت CSP والأمن المتصفح

```text
أنت Application Security Engineer.

راجع middleware وsecurity-policy وجميع layouts وinline scripts وexternal resources.

المطلوب:
1. اجمع كل مصادر script/style/font/image/connect/frame.
2. تحقق من أن CSP لا تستخدم unsafe-eval.
3. قلل unsafe-inline أو استبدله بـnonce/hash.
4. اختبر auth flow وGA4 وAstro assets.
5. فعّل Content-Security-Policy بدل Report-Only بعد نجاح الاختبار.
6. أضف CSP report endpoint آمنًا ومحدودًا.
7. لا تسجل query parameters الحساسة.
8. تحقق من:
   - HSTS
   - Referrer-Policy
   - Permissions-Policy
   - X-Frame-Options
   - frame-ancestors
   - CORP/COOP/CORS
9. اكتب Browser smoke test يثبت headers لكل من:
   - public page
   - auth page
   - app page
   - API read
   - API write

المخرجات:
- security headers matrix
- CSP النهائية
- نتائج Playwright
- قائمة المصادر المسموحة ولماذا
```

---

## Prompt 4 — إصلاح API Contracts

```text
أنت Enterprise API Architect.

راجع جميع API handlers في BRIGHTAI.

المطلوب:
1. عرّف request/response schemas typed.
2. ارفض الحقول الزائدة.
3. تحقق من أنواع البيانات والأطوال والقيم.
4. وحد شكل الأخطاء:
   {
     code,
     message,
     dependencyStatus,
     requestId
   }
5. أضف request ID آمنًا.
6. لا تعيد stack traces أو SQL errors.
7. افصل validation عن business logic.
8. أضف idempotency للعمليات الحساسة.
9. أضف pagination وحدودًا للنتائج.
10. وثق status codes.
11. أضف contract tests لكل endpoint.
12. تحقق أن CORS وOrigin لا يستخدمان قيمة العميل بصورة غير آمنة.

المخرجات:
- API contract document
- schemas
- tests
- قائمة breaking changes
- migration plan
```

---

## Prompt 5 — رفع جاهزية SaaS

```text
أنت Enterprise SaaS Architect.

حوّل BRIGHTAI من portal تجريبي إلى خطة SaaS قابلة للتشغيل، دون الادعاء بأن أي جزء جاهز قبل إثباته.

غطِّ:
- organizations
- workspaces
- invitations
- roles
- MFA
- SSO roadmap
- quotas
- trial expiry
- billing boundaries
- usage metering
- provider cost ceiling
- audit export
- retention/deletion
- backup/restore
- incident response
- support workflow
- status page
- SLA/RPO/RTO

قسّم العمل إلى:
P0 launch blocker
P1 pilot blocker
P2 enterprise maturity

أعط لكل بند:
- requirement
- owner
- database impact
- API impact
- UI impact
- security impact
- test required
- evidence required

لا تستخدم عبارات مثل enterprise-ready أو compliant إلا إذا كان هناك دليل قابل للتحقق.
```

---

## Prompt 6 — تدقيق UX/UI باستخدام Web Artifacts Builder

```text
أنت Product Designer وFrontend Accessibility Engineer.

استخدم مبادئ web-artifacts-builder:
- لا تستخدم تصميم AI نمطيًا.
- تجنب البطاقات المتشابهة والتدرجات الزائدة.
- حافظ على شخصية BRIGHTAI.
- ركز على التسلسل الهرمي، الحالات، وقابلية الاستخدام.
- لا تغيّر Astro إلى React إلا إذا كان هناك سبب تقني واضح.

راجع:
- الصفحة الرئيسية
- المنتجات
- صفحات المنتجات الخمسة
- Kernel
- pricing
- trust
- contact
- 404
- auth/app عندما تصبح متاحة

المطلوب:
1. أنشئ UX audit لكل صفحة.
2. حدد CTA الرئيسي والثانوي.
3. أضف product status badge.
4. صمم حالات loading/empty/error/success/denied/offline.
5. اختبر 320px و375px و768px و1440px.
6. اختبر RTL.
7. اختبر keyboard navigation.
8. اختبر screen reader labels.
9. أضف reduced motion.
10. قلل التحفظات المتكررة دون حذف التحذيرات المهمة.
11. اجعل فرق DEMO/PREVIEW/PILOT/PRODUCTION ظاهرًا بصريًا.
12. قدم patch وليس توصيات فقط.

المخرجات:
- UX scorecard
- accessibility issues
- screenshots قبل/بعد
- قائمة الملفات المعدلة
- اختبار Playwright
```

---

## Prompt 7 — SEO/GEO/AEO نهائي

```text
أنت Technical SEO وGEO Auditor.

راجع الموقع والمستودع معًا.

افحص:
- title
- meta description
- canonical
- robots
- sitemap
- hreflang
- Arabic RTL metadata
- Open Graph
- Twitter cards
- JSON-LD
- BreadcrumbList
- Article
- Organization
- Person
- FAQ
- internal links
- orphan pages
- 404 links
- redirect chains
- page speed
- knowledge graph clarity

المطلوب:
1. أنشئ keyword/topic map عربيًا وإنجليزيًا.
2. أنشئ knowledge hubs.
3. اربط كل صفحة منتج بمحتوى تعليمي وCTA تجاري.
4. لا تستخدم Product schema لمنتج غير متاح.
5. أظهر status وlast reviewed وreviewer لكل دليل.
6. اربط المصادر الرسمية الخارجية.
7. اختبر sitemap ضد الإنتاج.
8. لا تنشئ ادعاءات امتثال غير موثقة.
9. أضف FAQ فقط إذا كان المحتوى ظاهرًا للمستخدم.
10. أنشئ تقريرًا بدرجات SEO/GEO/AEO مع أدلة.

المخرجات:
- SEO fixes
- schema fixes
- internal linking map
- 90-day content plan
- tests
```

---

## Prompt 8 — اختبار نهائي قبل الإطلاق

```text
أنت Release Manager مستقل.

لا تفترض نجاح أي شيء من وجود الملفات.

نفذ بوابة إطلاق BRIGHTAI التالية:

A. Build
- npm ci
- npm run build

B. Tests
- npm run test:seo
- npm run test:healthz
- npm run test:accessibility:smoke
- npm run test:auth:e2e

C. Runtime
- healthz
- readyz
- public pages
- auth pages
- app routes
- API read/write

D. Security
- headers
- CSP
- cookie flags
- IDOR
- tenant isolation
- rate limiting
- secret scanning
- dependency audit

E. UX
- mobile
- RTL
- keyboard
- reduced motion
- errors
- offline
- empty states

F. SEO
- sitemap
- robots
- canonical
- structured data
- no broken internal links

أخرج قرارًا واحدًا فقط:
- GO
- CONDITIONAL GO
- NO-GO

مع:
- blockers
- severity
- evidence
- exact reproduction steps
- owner
- recommended fix
```

---

## Prompt 9 — تحديث الوثائق والادعاءات

```text
أنت Technical Writer وCompliance Evidence Manager.

راجع كل النصوص التسويقية والتقنية في BRIGHTAI.

ابحث عن:
- claim غير مثبت
- كلمة compliance دون نطاق
- كلمة secure دون دليل
- كلمة production دون تشغيل
- كلمة Saudi-hosted دون إثبات
- كلمة no-training دون عقد أو إعداد
- كلمة air-gapped دون اختبار
- كلمة enterprise-ready دون معايير قبول

صنّف كل عبارة إلى:
- مثبتة
- مدعومة جزئيًا
- غير مثبتة
- يجب حذفها

استبدل العبارات المبالغ فيها بلغة دقيقة:
- مستهدف
- تجريبي
- محاكاة
- متاح بموافقة
- يحتاج إثباتًا
- غير متحقق خارجيًا

حافظ على اللغة العربية الواضحة، ولا تجعل التحفظات تقتل تجربة المستخدم.

المخرجات:
- claims register
- النص قبل/بعد
- source/evidence لكل claim
- قائمة صفحات تحتاج تحديثًا
```

---

# 17. قرار الإطلاق المقترح

## الآن

```text
GO — Public Demo / Educational Website
```

## بعد إصلاح healthz والربط والاختبارات

```text
CONDITIONAL GO — Closed Pilot with synthetic or approved low-risk data
```

## لا تستخدم هذا التصنيف حاليًا

```text
NO — General Enterprise SaaS
NO — Production customer data
NO — Compliance claim
NO — Air-gapped/on-premise guarantee
```

## الهدف الواقعي بعد الإصلاحات

رفع التقييم من:

```text
72.4%
```

إلى:

```text
82–86%
```

بعد إثبات:

- health/readiness.
- CI.
- Auth.
- Tenant isolation.
- API contracts.
- CSP enforcement.
- Monitoring.
- Backup/restore.
- Pilot evidence.

والوصول إلى أكثر من **90%** يتطلب إضافة تدقيق أمني مستقل، اختبارات اختراق، عمليات SaaS مكتملة، ودليل إنتاج قابل للتحقق—not مجرد تحسينات واجهة أو محتوى.