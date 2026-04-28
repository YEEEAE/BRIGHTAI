معك حق. فحصت ملف المشروع الحالي + ملف الملخص. الخلاصة: شغل كبير انعمل، لكن فيه نقاط لازم تنمسك قبل أي نشر نهائي.

اعتمدت على ملخص العمل المرفق، وفيه موضح أن المشروع صار يفصل بين صفحات الخدمات داخل** **`services/` والديموهات داخل** **`demo/`، وأنه تمت إضافة محرك موحد لديموهات وكلاء الذكاء الاصطناعي وربطها بـ** **`/api/ai/chat/completions`.
لكن من فحص الـ ZIP نفسه، وجدت أن بعض المسارات القديمة ما زالت مستخدمة في** **`services/index.html`، خصوصاً** **`interview/` و `try/data-analyzer/` و `ai-bots/BrightSupport/`.

---

## نتيجة الفحص السريع

### الموجود حالياً في** **`demo/`

وجدت ديموهات موجودة فعلياً مثل:

```txt
demo/ai-scolecs/
demo/ai-tenders-analysis/
demo/brightproject/
demo/brightsales/
demo/competitor-analysis-agent/
demo/custom-ai-agent/
demo/marketing-ai-agent/
demo/marketing-automation/
demo/ocr-demo/
demo/opportunity-discovery-agent/
demo/seo-ai-agent/
demo/smart-hospital-management/
demo/smart-medical-archive/
demo/supply-chain-optimization/
```

### المنتجات في** **`services/index.html` التي لا تملك ديمو داخل** **`/demo/`

هذه أهم الفجوات:

| المنتج                                            | الديمو الحالي   | المشكلة                                            | المسار المقترح                                  |
| ------------------------------------------------------- | --------------------------- | --------------------------------------------------------- | ------------------------------------------------------------ |
| نظام الاستقطاب / التوظيف الذكي | `/interview/`             | خارج `/demo/`                                       | `/demo/smart-hiring-system/`                               |
| منصة البيانات                               | `/try/data-analyzer/`     | خارج `/demo/`                                       | `/demo/data-analyzer/`                                     |
| وكيل محلل بيانات                          | `/try/data-analyzer/`     | خارج `/demo/`                                       | `/demo/data-analyzer/`                                     |
| خدمة العملاء                                 | `/ai-bots/BrightSupport/` | خارج `/demo/`                                       | `/demo/customer-service-automation/`                       |
| HR Automation                                           | لا يوجد               | يحتاج ديمو أو ربط بديمو التوظيف | `/demo/hr-automation/` أو `/demo/smart-hiring-system/` |
| approvals automation                                    | لا يوجد               | يحتاج ديمو                                       | `/demo/approvals-automation/`                              |
| operational reports                                     | لا يوجد               | يحتاج ديمو                                       | `/demo/operational-reports-automation/`                    |
| social data analysis                                    | لا يوجد               | يحتاج ديمو                                       | `/demo/social-data-analysis/`                              |
| AI consulting                                           | لا يوجد               | يحتاج ديمو تأهيل/تشخيص                 | `/demo/ai-consulting/`                                     |

### ملاحظات تقنية مهمة

وجدت أن** **`services/index.html` يحتوي تكرار مفاتيح داخل كائنات المنتجات لبعض الوكلاء، مثل** **`custom-ai-agent` و `competitor-analysis-agent` حيث تكررت** **`demoUrl` و `demoLabel` و `hasLiveDemo` أكثر من مرة. هذا لا يكسر** **`JSON.parse` غالباً لأن آخر قيمة تفوز، لكنه كود غير نظيف وقد يسبب أخطاء مستقبلية في التوليد أو التعديل.

أيضاً يوجد سكربت:

```txt
scripts/check-api-base-consistency.mjs
```

وفيه مسار ثابت:

```txt
/Users/yzydalshmry/Desktop/BRIGHTAI
```

هذا يعمل على جهازك فقط، لكنه يسبب فشل في أي بيئة مختلفة مثل CI أو Render أو جهاز آخر. الأفضل تغييره إلى:

```js
const repoRoot = process.cwd();
```

بالنسبة للـ SEO وAI Search: لا نقدر نضمن “التصدر”، والأصح كتابة البرومبتات بصياغة تمنع الوعود المطلقة. Google توضح أن SEO لا يحتوي أسراراً تضمن المركز الأول، وأن أفضل الممارسات تحسن فرص الظهور فقط. ([Google for Developers](https://developers.google.com/search/docs/fundamentals/seo-starter-guide "https://developers.google.com/search/docs/fundamentals/seo-starter-guide")) كما أن الظهور في ميزات AI في Google يعتمد أساساً على نفس أساسيات SEO: السماح بالزحف، الروابط الداخلية، تجربة صفحة جيدة، المحتوى النصي المهم، والبيانات المنظمة المطابقة للمحتوى المرئي. ([Google for Developers](https://developers.google.com/search/docs/appearance/ai-features?hl=ar "https://developers.google.com/search/docs/appearance/ai-features?hl=ar"))

---

# 1) برومبت نقل** **`interview/` إلى** **`/demo/smart-hiring-system/`

```txt
أنت Senior Frontend Engineer + Technical SEO Migration Specialist.

أعمل على مشروع Bright AI في هذا المسار:
/Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
نقل ديمو التوظيف الذكي من:

/Users/yzydalshmry/Desktop/BRIGHTAI/interview

إلى:

/Users/yzydalshmry/Desktop/BRIGHTAI/demo/smart-hiring-system

مع إصلاح كل الروابط الداخلية والـ SEO والـ canonical والـ render redirects.

مهم:
لا تحذف المحتوى قبل التأكد أن المسار الجديد يعمل.
لا تكسر صفحة الخدمة:
services/smart-hiring-system.html
أو المسار:
services/smart-hiring-system/

الهدف:
- يكون الديمو التفاعلي داخل /demo/smart-hiring-system/
- تكون صفحة الخدمة داخل /services/smart-hiring-system/ أو services/smart-hiring-system.html
- كل أزرار “جرّب نظام التوظيف الذكي” تذهب إلى /demo/smart-hiring-system/
- كل الروابط القديمة إلى /interview/ تتحول إلى redirects آمنة

نفّذ الخطوات التالية:

1. أنشئ المجلد:
demo/smart-hiring-system/

2. انقل:
interview/index.html
إلى:
demo/smart-hiring-system/index.html

3. إن وجدت ملفات داخل:
interview/pages/
أو ملفات JS/CSS مرتبطة بالتوظيف، انقلها أو حدّث مراجعها حسب الحاجة.

4. حدّث داخل demo/smart-hiring-system/index.html:
- canonical من https://brightai.site/interview/ إلى https://brightai.site/demo/smart-hiring-system/
- og:url إلى https://brightai.site/demo/smart-hiring-system/
- أي JSON-LD url إلى https://brightai.site/demo/smart-hiring-system/
- أي BreadcrumbList ليكون:
  الرئيسية > الديموهات > نظام التوظيف الذكي
- أضف رابط واضح إلى صفحة الخدمة:
  /services/smart-hiring-system/
  أو الملف الصحيح الموجود في المشروع

5. أصلح مشكلة H1:
إذا وجدت أكثر من H1 في صفحة التوظيف، اجعل H1 واحد فقط.
العنوان الأساسي المقترح:
"جرّب نظام التوظيف الذكي بالذكاء الاصطناعي"

واجعل العنوان الآخر H2 أو div.

6. حدّث services/index.html:
داخل product id:
smart-hiring-system

غيّر:
demoUrl: "https://brightai.site/interview/"

إلى:
demoUrl: "https://brightai.site/demo/smart-hiring-system/"

وتأكد أن demoLabel مناسب:
"جرّب نظام التوظيف الذكي"

7. ابحث في كل المشروع عن:
- /interview/
- https://brightai.site/interview/
- href="/interview/"
- href='\/interview\/'

واستبدل روابط الديمو فقط إلى:
/demo/smart-hiring-system/

لكن لا تستبدل روابط redirect القديمة داخل render.yaml إلا حسب الخطوة التالية.

8. حدّث render.yaml:
أضف redirects:

- source: /interview
  destination: /demo/smart-hiring-system/

- source: /interview/
  destination: /demo/smart-hiring-system/

- source: /interview/index.html
  destination: /demo/smart-hiring-system/

- source: /job.MAISco
  destination: /demo/smart-hiring-system/

- source: /job.MAISco/
  destination: /demo/smart-hiring-system/

إذا توجد rewrites قديمة لـ /interview، احذفها أو غيّرها إلى redirects حتى لا تبقى نسخة مكررة قابلة للفهرسة.

9. حدّث sitemap.xml:
أضف:
https://brightai.site/demo/smart-hiring-system/

واحذف أو لا تفهرس:
https://brightai.site/interview/

10. تأكد أن الديمو يستخدم Gemini عبر Backend فقط:
- endpoint يجب أن يكون /api/ai/chat/completions
- لا يوجد GEMINI_API_KEY في الواجهة
- لا يوجد fetch مباشر إلى generativelanguage.googleapis.com

11. أضف CTA داخل صفحة الديمو:
- العودة إلى صفحة الخدمة
- اطلب نظام توظيف مخصص
- أرسل تقرير المرشح عبر واتساب
- احجز ديمو مباشر

12. اختبار نهائي:
افحص:
- /demo/smart-hiring-system/
- /services/smart-hiring-system/
- services/index.html
- sitemap.xml
- render.yaml

ثم شغّل:
npm run internal-links:audit
npm run smoke-test:config
npm run seo:html:check

إذا فشل smoke-test بسبب مسار ثابت في scripts/check-api-base-consistency.mjs، أصلحه باستخدام:
const repoRoot = process.cwd();

المخرجات المطلوبة:
- الملفات المنقولة
- الملفات المعدلة
- كل الروابط التي تغيرت
- حالة Gemini API
- حالة SEO
- أي روابط مكسورة متبقية
```

---

# 2) برومبت نقل** **`try/` إلى** **`/demo/data-analyzer/`

```txt
أنت Senior Frontend Engineer + Data Product UX Specialist + SEO Migration Auditor.

أعمل على مشروع Bright AI في:
/Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
نقل ديمو تحليل البيانات من:

/Users/yzydalshmry/Desktop/BRIGHTAI/try

إلى:

/Users/yzydalshmry/Desktop/BRIGHTAI/demo/data-analyzer

مع إصلاح كل الروابط الداخلية، خصوصاً أن services/index.html حالياً يربط منتجات إلى:
https://brightai.site/try/data-analyzer/

الهدف:
- يكون ديمو تحليل البيانات داخل /demo/data-analyzer/
- كل المنتجات المرتبطة بتحليل البيانات تستخدم هذا المسار
- لا تبقى روابط ديمو خارج /demo/
- تبقى صفحة الخدمة /services/data-platform/ صفحة SEO تسويقية

نفّذ الآتي:

1. أنشئ:
demo/data-analyzer/

2. انقل الملفات:
try/index.html
try/data-analyzer/index.html إن وجد
try/data-quality/index.html إن وجد
try/text-analysis/index.html إن وجد

إلى بنية منظمة:

demo/data-analyzer/index.html
demo/data-quality/index.html
demo/text-analysis/index.html

إذا كان try/index.html هو صفحة هب للتجارب، انقلها إلى:
demo/data-tools/index.html
أو ادمج أهم روابطها داخل demo/index.html

3. حدّث canonical و og:url:
من:
https://brightai.site/try/
https://brightai.site/try/data-analyzer/

إلى:
https://brightai.site/demo/data-analyzer/

4. حدّث الخدمات التالية في services/index.html:

product id:
data-platform

غيّر demoUrl من:
https://brightai.site/try/data-analyzer/

إلى:
https://brightai.site/demo/data-analyzer/

product id:
data-analyst-agent

غيّر demoUrl من:
https://brightai.site/try/data-analyzer/

إلى:
https://brightai.site/demo/data-analyzer/

5. ابحث في كل المشروع عن:
- /try/
- /try/data-analyzer/
- /try/data-quality/
- /try/text-analysis/
- https://brightai.site/try/
- https://brightai.site/try/data-analyzer/

واستبدل الروابط حسب الخريطة:

/try/ → /demo/data-tools/ أو /demo/
/try/data-analyzer/ → /demo/data-analyzer/
/try/data-quality/ → /demo/data-quality/
/try/text-analysis/ → /demo/text-analysis/

6. حدّث صفحات الخدمة:
- services/data-platform.html
- services/data-analyst-agent.html إن وجدت
- services/social-data-analysis.html إن كانت تربط إلى try/data-analyzer

كل CTA يجب أن يشير إلى:
/demo/data-analyzer/

7. حدّث render.yaml:
أضف redirects:

- source: /try
  destination: /demo/data-analyzer/

- source: /try/
  destination: /demo/data-analyzer/

- source: /try/index.html
  destination: /demo/data-analyzer/

- source: /try/data-analyzer
  destination: /demo/data-analyzer/

- source: /try/data-analyzer/
  destination: /demo/data-analyzer/

- source: /try/data-analyzer/index.html
  destination: /demo/data-analyzer/

- source: /try/data-quality
  destination: /demo/data-quality/

- source: /try/text-analysis
  destination: /demo/text-analysis/

8. حدّث sitemap.xml:
أضف:
https://brightai.site/demo/data-analyzer/
https://brightai.site/demo/data-quality/
https://brightai.site/demo/text-analysis/
إذا كانت الصفحات موجودة فعلياً.

واحذف أو لا تفهرس:
https://brightai.site/try/
https://brightai.site/try/data-analyzer/

9. حسّن صفحة demo/data-analyzer/index.html:
- H1 واحد
- عنوان واضح:
  "جرّب محلل البيانات الذكي للشركات"
- أضف Result Dashboard
- أضف Sample Data
- أضف CTA إلى:
  /services/data-platform/
  /services/data-analyst-agent/
- أضف WhatsApp summary
- تأكد من RTL والجوال

10. تحقق من Gemini:
- لا يوجد API Key في الواجهة
- لا يوجد fetch مباشر إلى Gemini
- كل الطلبات تمر عبر /api/ai/chat/completions أو gateway موحد
- أضف fallback result

11. شغّل الفحوص:
npm run internal-links:audit
npm run smoke-test:config
npm run seo:html:check

المخرجات المطلوبة:
- خريطة النقل
- الملفات المعدلة
- روابط try القديمة التي تم إصلاحها
- حالة كل ديمو جديد
- أي روابط مكسورة متبقية
```

---

# 3) برومبت اكتشاف المنتجات التي لا تملك ديمو داخل** **`/demo/`

```txt
أنت QA Auditor + Product Catalog Integrity Engineer.

افحص الملف:
/Users/yzydalshmry/Desktop/BRIGHTAI/services/index.html

واستخرج مصفوفة المنتجات:
const products = [...]

المطلوب:
اكتشف كل منتج لا يملك ديمو فعلي داخل:
/Users/yzydalshmry/Desktop/BRIGHTAI/demo/

خطوات الفحص:

1. لكل product:
- اقرأ id
- name
- slug
- sku
- url
- demoUrl
- demoLabel
- hasLiveDemo

2. إذا كان demoUrl موجوداً:
تحقق هل يبدأ بـ:
https://brightai.site/demo/
أو:
/demo/

إذا لا يبدأ بـ /demo/، اعتبره يحتاج Migration.

3. إذا كان demoUrl يبدأ بـ /demo/:
استخرج slug بعد /demo/
وتحقق من وجود:
demo/[slug]/index.html
أو demo/[slug]/

4. إذا لا يوجد demoUrl:
افحص هل يوجد مجلد مطابق في demo:
- demo/[id]/
- demo/[slug]/
- demo/[sku]/

5. أنشئ تقرير جدول:

الأعمدة:
- product id
- name
- service URL
- current demoUrl
- demo folder exists?
- issue type:
  - missing_demo_url
  - demo_outside_demo_path
  - demo_folder_missing
  - shared_demo
  - ok
- recommended demo path
- recommended action

6. حسب الفحص الحالي، انتبه لهذه المنتجات:
- smart-hiring-system: الديمو الحالي /interview/ ويجب نقله إلى /demo/smart-hiring-system/
- data-platform: الديمو الحالي /try/data-analyzer/ ويجب نقله إلى /demo/data-analyzer/
- data-analyst-agent: يستخدم /try/data-analyzer/ ويجب أن يستخدم /demo/data-analyzer/
- customer-service-automation: يستخدم /ai-bots/BrightSupport/ ويجب نقله أو نسخه إلى /demo/customer-service-automation/
- hr-automation: لا يملك demoUrl
- approvals-automation: لا يملك demoUrl
- operational-reports-automation: لا يملك demoUrl
- social-data-analysis: لا يملك demoUrl
- ai-consulting: لا يملك demoUrl

7. أصلح فقط إذا طلبت منك صراحة.
في هذه المهمة أعطني التقرير فقط بدون تعديل.
```

---

# 4) برومبت إصلاح المنتجات الناقصة وربطها بـ** **`/demo/`

```txt
بناءً على تقرير المنتجات التي لا تملك ديمو داخل /demo/، نفّذ إصلاحاً منظماً.

المطلوب:
توحيد كل demoUrl داخل services/index.html بحيث تكون كل الديموهات تحت /demo/.

الخريطة المطلوبة:

smart-hiring-system:
من: https://brightai.site/interview/
إلى: https://brightai.site/demo/smart-hiring-system/

data-platform:
من: https://brightai.site/try/data-analyzer/
إلى: https://brightai.site/demo/data-analyzer/

data-analyst-agent:
من: https://brightai.site/try/data-analyzer/
إلى: https://brightai.site/demo/data-analyzer/

customer-service-automation:
من: https://brightai.site/ai-bots/BrightSupport/
إلى: https://brightai.site/demo/customer-service-automation/

hr-automation:
أضف demoUrl:
https://brightai.site/demo/hr-automation/

approvals-automation:
أضف demoUrl:
https://brightai.site/demo/approvals-automation/

operational-reports-automation:
أضف demoUrl:
https://brightai.site/demo/operational-reports-automation/

social-data-analysis:
أضف demoUrl:
https://brightai.site/demo/social-data-analysis/

ai-consulting:
أضف demoUrl:
https://brightai.site/demo/ai-consulting/

قواعد:
- لا تضف demoUrl إذا لم تنشئ صفحة الديمو المقابلة.
- إن لم تكن صفحة الديمو موجودة، أنشئ placeholder premium demo page فيها نموذج تأهيل بسيط وCTA، وليس صفحة فارغة.
- كل صفحة ديمو يجب أن تحتوي:
  - title
  - meta description
  - canonical
  - H1 واحد
  - طريقة الاستخدام
  - Sample Data
  - CTA إلى صفحة الخدمة
  - CTA واتساب
  - fallback result
  - لا API key في الواجهة

نظّف تكرار المفاتيح داخل products:
- لا يتكرر demoUrl أكثر من مرة داخل نفس product
- لا يتكرر demoLabel أكثر من مرة
- لا يتكرر hasLiveDemo أكثر من مرة

بعد الإصلاح شغّل:
npm run internal-links:audit
npm run seo:html:check

وأعطني:
- المنتجات التي تم إصلاحها
- صفحات الديمو التي تم إنشاؤها
- الروابط التي تم تحديثها
- المشاكل المتبقية
```

---

# 5) برومبت تحسين عالمي لكل** **`/demo/`

هذا هو البرومبت الكبير لتحسين كل الديموهات UX + Performance + SEO + AEO/EAO + HEO + GEO + AI Search.

```txt
أنت Principal Product Designer + Senior Frontend Performance Engineer + Technical SEO/AEO/GEO Strategist.

أعمل على مشروع Bright AI في:
/Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
تحسين كل صفحات الديمو داخل:

/demo/

لتصبح صفحات تجربة عالمية Premium، مقنعة تجارياً، سريعة، قابلة للفهرسة، ومهيأة للظهور في Google وAI Search ونتائج الإجابات.

مهم:
لا تَعِد بتصدر مضمون.
اتبع أفضل ممارسات Google:
- محتوى مفيد للناس أولاً
- لا keyword stuffing
- لا doorway pages
- بيانات منظمة مطابقة للمحتوى المرئي
- روابط داخلية واضحة
- تجربة صفحة ممتازة
- إمكانية الزحف والفهرسة
- المحتوى المهم يكون نصياً وليس مخفياً داخل JS فقط

النطاق:
كل ملف:
demo/*/index.html

مع التركيز على:
- demo/smart-hiring-system/
- demo/data-analyzer/
- demo/customer-service-automation/
- demo/custom-ai-agent/
- demo/competitor-analysis-agent/
- demo/seo-ai-agent/
- demo/marketing-ai-agent/
- demo/opportunity-discovery-agent/
- demo/marketing-automation/
- demo/supply-chain-optimization/
- demo/smart-medical-archive/
- demo/smart-hospital-management/
- demo/ocr-demo/
- demo/ai-scolecs/
- demo/brightproject/
- demo/brightsales/
- demo/ai-tenders-analysis/

أولاً: UX العالمي
لكل ديمو أضف أو حسّن:

1. Hero واضح خلال 5 ثواني
- اسم الديمو
- المشكلة التي يحلها
- النتيجة التي سيحصل عليها المستخدم
- زر "استخدم مثال جاهز"
- زر "ابدأ التجربة"
- زر "اطلب نسخة مخصصة"

2. طريقة الاستخدام
قسم بعنوان:
"كيف تستخدم التجربة؟"
4 خطوات:
- اختر السيناريو
- أدخل بيانات بسيطة
- شغّل الذكاء الاصطناعي
- شاهد التقرير واطلب النسخة المخصصة

3. نموذج إدخال مختصر
- لا تجعل النموذج طويلاً
- اعرض الوضع السريع أولاً
- أخفِ التفاصيل المتقدمة داخل Advanced Settings

4. Sample Data
كل ديمو يجب أن يحتوي 2 إلى 4 أمثلة جاهزة حسب القطاع السعودي.

5. Loading Experience
اعرض مراحل احترافية:
- فهم السياق
- تحليل البيانات
- بناء المؤشرات
- توليد التوصيات
- تجهيز التقرير

6. Result Dashboard
لا تعرض JSON خام.
كل نتيجة يجب أن تظهر في:
- Executive Summary
- Score / Readiness Index
- Key Insights
- Risks
- Recommended Actions
- ROI or Business Impact
- Integration Readiness
- Next Steps
- CTA

7. Error State
إذا فشل AI:
- رسالة مفهومة
- fallback result
- زر إعادة المحاولة
- لا تكشف raw error أو API details

8. CTA تجاري بعد النتيجة
- احجز ديمو مباشر
- اطلب عرض سعر
- أرسل التقرير عبر واتساب
- حمّل التقرير

ثانياً: Performance
لكل ديمو:

1. استخدم ملفات CSS/JS مشتركة قدر الإمكان.
2. لا تكرر inline CSS ضخم في كل صفحة.
3. استخدم defer لكل JS غير حرج.
4. استخدم preconnect فقط للمصادر المستخدمة فعلاً.
5. أصلح missing assets:
- /assets/images/Gemini.png
- /frontend/js/vendor/iconify-icon.min.js
- /assets/css/extracted-inline-styles.css
- /assets/css/design-tokens.css
- /assets/css/ux-audit-fixes.css
- /assets/js/demo-experience-loader.js

إما أن:
- تنشئ الملفات فعلاً
أو
- تستبدل المراجع بملفات موجودة
أو
- تحذفها إذا لم تعد مطلوبة

6. راقب حجم الصفحة.
أي صفحة demo فوق 150KB HTML تحتاج تنظيف أو نقل CSS/JS إلى ملفات مشتركة.

7. أضف lazy loading للصور غير الحرجة.
8. لا تستخدم صور مفقودة أو غير مضغوطة.
9. تأكد من mobile responsiveness.
10. حسّن CLS:
- أضف width/height للصور
- لا تضف عناصر dynamic بدون مساحة محجوزة

ثالثاً: SEO
لكل ديمو:

1. title فريد:
صيغة:
"جرّب [اسم النظام] بالذكاء الاصطناعي | Bright AI"

2. meta description فريد:
يشرح التجربة والنتيجة بدون مبالغة.

3. canonical:
يجب أن يشير إلى نفس صفحة الديمو:
https://brightai.site/demo/[slug]/

4. H1 واحد فقط.

5. H2 منظمة:
- ما الذي يفعله الديمو؟
- طريقة الاستخدام
- جرّب بسيناريو جاهز
- ماذا ستظهر النتيجة؟
- لماذا Bright AI؟
- الأسئلة الشائعة

6. FAQ:
أضف 4 إلى 6 أسئلة لكل ديمو:
- هل التجربة مجانية؟
- هل يمكن ربطها ببيانات الشركة؟
- هل يدعم العربية؟
- هل البيانات آمنة؟
- ما الفرق بين الديمو والنسخة المخصصة؟

7. JSON-LD:
أضف:
- SoftwareApplication
- Service
- FAQPage
- BreadcrumbList

وتأكد أن structured data مطابق لما يظهر على الصفحة.

8. روابط داخلية:
كل ديمو يجب أن يربط إلى:
- صفحة الخدمة الرسمية
- /services/
- /demo/
- صفحة تواصل أو واتساب
- ديموهات قريبة

9. لا تستخدم noindex على الديموهات إلا إذا كان قراراً مقصوداً.

رابعاً: AEO / EAO / Answer Engine Optimization
لكل ديمو:

1. أضف فقرة إجابة مباشرة تحت H1:
"هذا الديمو يساعدك على ... خلال ... عبر ..."

2. أضف Quick Answer Box:
- لمن هذه التجربة؟
- ماذا تحتاج لتجربتها؟
- ماذا ستحصل بعد التشغيل؟
- هل يمكن تخصيصها؟

3. أضف أسئلة بصيغة طبيعية:
- كيف أستخدم وكيل SEO؟
- كيف يساعد نظام التوظيف الذكي؟
- كيف أكتشف عملاء محتملين بالذكاء الاصطناعي؟
- كيف أحلل بيانات شركتي؟

4. اجعل الإجابات مختصرة وواضحة وقابلة للاقتباس من محركات الإجابة.

خامساً: HEO — Human Experience Optimization
لكل ديمو:

1. اجعل النص يخاطب صاحب القرار السعودي مباشرة.
2. أضف أمثلة قطاعات سعودية:
- عيادات
- متاجر إلكترونية
- تعليم
- لوجستيات
- مقاولات
- شركات خدمات
- مصانع
- جهات تدريبية

3. أضف مؤشرات ثقة:
- يدعم العربية
- قابل للربط مع أنظمة الشركة
- صلاحيات وصول
- Audit Trail
- لا ترفع بيانات حساسة في النسخة العامة

4. أضف Microcopy واضح للأزرار والحقول.
5. اجعل الصفحة تقود المستخدم إلى قرار:
جرّب → شاهد نتيجة → اطلب نسخة مخصصة.

سادساً: GEO — Generative Engine Optimization
لكل ديمو:

1. أضف تعريف واضح للمنتج في بداية الصفحة.
2. أضف entity-rich content:
- Bright AI
- اسم المنتج
- السوق السعودي
- القطاع المستهدف
- المشكلة
- المخرجات
- التكاملات

3. أضف "ملخص قابل للاقتباس":
قسم بعنوان:
"ملخص التجربة"
فيه 3 إلى 5 نقاط قصيرة.

4. أضف comparison content:
"قبل Bright AI / بعد Bright AI"

5. أضف use cases منظمة:
- الحالة
- المدخلات
- مخرجات الديمو
- الأثر التجاري

6. أضف schema واضح ومتطابق مع المحتوى.

سابعاً: AI Search
لكل ديمو:

1. اجعل المحتوى المهم نصياً في HTML وليس فقط مولداً بجافاسكربت.
2. لا تخفِ المعلومة الأساسية داخل tabs لا تُحمّل إلا بعد تفاعل.
3. أضف FAQ واضح.
4. أضف internal links قوية.
5. أضف أسماء الخدمات بشكل موحد:
- نظام التوظيف الذكي
- منصة تحليل البيانات
- وكيل SEO
- وكيل تسويق
- وكيل تحليل المنافسين
- وكيل اكتشاف الفرص
6. أضف صفحات الخدمة كمرجع رئيسي لكل ديمو.

ثامناً: Gemini API
لكل ديمو:

1. لا تستخدم Gemini API مباشرة من المتصفح.
2. كل الطلبات تمر عبر:
   /api/ai/chat/completions
3. لا يوجد GEMINI_API_KEY في الواجهة.
4. كل ديمو له:
- demoType أو agentType
- schemaName
- locale: ar-SA
- sourcePage
- fallbackResult
5. لا تعرض JSON خام.
6. لا ترجع raw backend errors للمستخدم.

تاسعاً: الاختبار
بعد التحسين شغّل:
npm run internal-links:audit
npm run seo:html:check
npm run smoke-test:config
npm run performance:budget

إذا فشل smoke-test بسبب مسار ثابت في scripts/check-api-base-consistency.mjs، أصلحه:
const repoRoot = process.cwd();

المخرجات:
- جدول كل demo
- UX status
- SEO status
- AEO/GEO status
- Gemini status
- Performance status
- الملفات المعدلة
- المشاكل المتبقية
```

---

# 6) برومبت تحسين ديمو واحد بأقصى جودة

استخدمه عندما تريد تحسين صفحة واحدة فقط:

```txt
حسّن الديمو التالي بأعلى جودة عالمية:

المسار:
[ضع مسار الديمو هنا]

أريدك تحوله إلى تجربة Premium Sales Demo.

المطلوب:
1. Hero قوي
2. إجابة مباشرة تحت H1
3. طريقة الاستخدام
4. Sample Data
5. نموذج إدخال مختصر
6. Advanced Settings
7. Loading stages
8. Result Dashboard
9. Fallback Result
10. Error State
11. CTA تجاري
12. WhatsApp Summary
13. Download/Print Report
14. FAQ
15. JSON-LD:
- SoftwareApplication
- Service
- FAQPage
- BreadcrumbList
16. روابط داخلية:
- صفحة الخدمة
- كل الخدمات
- ديموهات قريبة
- التواصل
17. لا يوجد API key في الواجهة
18. لا fetch مباشر إلى Gemini
19. كل AI call عبر /api/ai/chat/completions
20. يدعم RTL والجوال
21. لا يوجد H1 مكرر
22. لا توجد assets مكسورة
23. لا توجد وعود تصدر أو عائد مضمونة

اكتب المحتوى بصياغة سعودية تنفيذية، تخاطب صاحب القرار وتدفعه لطلب النسخة المخصصة.

في النهاية أعطني:
- الملفات المعدلة
- قبل/بعد
- اختبارات التشغيل
- أي مشاكل متبقية
```

---

# 7) برومبت تنظيف المشروع

```txt
أنت Senior Codebase Cleanup Engineer.

أعمل على مشروع Bright AI:
 /Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
تنظيف المشروع بدون كسر أي صفحة أو مسار إنتاج.

ابدأ بتقرير فقط، ثم أصلح المشاكل الآمنة.

نطاق التنظيف:

1. الملفات والمجلدات الثقيلة
افحص:
- node_modules داخل ZIP أو repo
- .venv
- .git داخل النسخ المرسلة
- reports القديمة
- tmp
- .DS_Store
- ملفات duplicate
- ملفات min قديمة غير مستخدمة
- ملفات backup
- ملفات " 2.js" مثل search 2.js

لا تحذف إلا بعد التأكد أنها غير مستخدمة.

2. assets مكسورة
ابحث عن مراجع مفقودة:
- /assets/images/Gemini.png
- /frontend/js/vendor/iconify-icon.min.js
- /assets/css/extracted-inline-styles.css
- /assets/css/design-tokens.css
- /assets/css/ux-audit-fixes.css
- /assets/js/demo-experience-loader.js

ثم قرر:
- إنشاء الملف
- نقل المرجع إلى ملف موجود
- حذف المرجع إذا غير مستخدم

3. منتجات services/index.html
نظف:
- تكرار demoUrl
- تكرار demoLabel
- تكرار hasLiveDemo
- slug غير مطابق لـ id إذا يسبب لبس
- demoUrl خارج /demo/
- products بدون demoUrl ولا سبب واضح

4. مسارات قديمة
ابحث عن:
- /interview/
- /try/
- /try/data-analyzer/
- /ai-bots/BrightSupport/
- /smart-medical-archive/
- /health/
- /tenders/

وتأكد أنها إما:
- redirects في render.yaml
أو
- روابط محدثة إلى /demo/

5. SEO cleanup
لكل HTML:
- H1 واحد
- title موجود
- meta description موجود
- canonical صحيح
- og:url صحيح
- لا canonical يشير لمسار قديم
- لا noindex غير مقصود

6. JS cleanup
- لا console.log حساس
- لا raw error للمستخدم
- لا API keys
- لا fetch مباشر إلى Gemini
- لا ملفات JS مكررة تؤدي نفس العمل

7. Build scripts
أصلح أي سكربت يستخدم مسار ثابت مثل:
/Users/yzydalshmry/Desktop/BRIGHTAI

واستبدله بـ:
const repoRoot = process.cwd();

8. .gitignore
تأكد من تجاهل:
node_modules/
.venv/
.env
.env.local
reports/
tmp/
.DS_Store
.render-static/
*.log

9. ZIP hygiene
أضف سكربت أو تعليمات لإنشاء ZIP نظيف بدون:
- node_modules
- .git
- .venv
- reports
- tmp
- .agents إذا ليست مطلوبة للإنتاج

10. اختبارات بعد التنظيف:
شغّل:
npm run internal-links:audit
npm run seo:html:check
npm run smoke-test:config
npm run build

المخرجات:
- ما تم حذفه
- ما تم تعديله
- ما لم يتم حذفه ولماذا
- حجم المشروع قبل/بعد
- حالة الروابط
- حالة build
- مشاكل متبقية
```

---

# 8) برومبت ما قد تكون نسيته أو تخطيته

هذا مهم جداً. يعطي الوكيل مهمة اكتشاف الفجوات التي لم نطلبها صراحة.

```txt
أنت Principal Product Launch Auditor + SEO/AI Search Risk Reviewer.

أريدك تفحص مشروع Bright AI من زاوية الأشياء التي قد نكون نسيناها أو لم نعرف أنها مهمة.

لا تركز فقط على المطلوب السابق.
ابحث عن الفجوات التي تمنع المشروع من أن يكون جاهزاً للنشر والبيع.

افحص المحاور التالية:

1. Product Completeness
- هل كل منتج في services/index.html له صفحة خدمة؟
- هل كل منتج يحتاج ديمو لديه ديمو؟
- هل كل ديمو له CTA واضح؟
- هل يوجد منتجات مكررة أو متداخلة؟
- هل أسماء المنتجات موحدة بين service و demo و sitemap و schema؟

2. Conversion Readiness
- هل كل صفحة تقود إلى واتساب أو طلب عرض؟
- هل CTA واضح فوق الصفحة وبعد النتيجة؟
- هل يوجد Lead Capture؟
- هل يوجد WhatsApp summary تلقائي؟
- هل يوجد سبب مقنع للشراء الآن؟

3. Trust & Compliance
- هل صفحات الصحة والطب تحتوي Disclaimers؟
- هل صفحات التوظيف تمنع التحيز؟
- هل تحليل المنافسين لا يوحي باختراق؟
- هل اكتشاف العملاء لا يوحي بجمع بيانات شخصية عشوائية؟
- هل التسويق لا يضمن نتائج مالية؟
- هل SEO لا يضمن المركز الأول؟
- هل توجد سياسة خصوصية واضحة مرتبطة من الديموهات؟

4. AI Safety
- هل كل ديمو له system prompt آمن؟
- هل كل ديمو له schemaName؟
- هل كل ديمو له fallback؟
- هل أخطاء Gemini لا تظهر خام للمستخدم؟
- هل لا يوجد API key في الواجهة؟
- هل لا يوجد fetch مباشر إلى Gemini؟

5. Technical SEO
- sitemap.xml محدث؟
- robots.txt صحيح؟
- canonical صحيح؟
- hreflang صحيح؟
- لا duplicate canonical؟
- لا صفحات orphan؟
- لا روابط داخلية مكسورة؟
- لا noindex غير مقصود؟
- JSON-LD صالح ومتطابق مع المحتوى؟

6. AI Search / GEO
- هل كل صفحة تحتوي إجابة مختصرة واضحة؟
- هل المحتوى المهم نصي وليس فقط JS؟
- هل توجد FAQ؟
- هل توجد مقارنة قبل/بعد؟
- هل توجد use cases؟
- هل توجد entity consistency؟
- هل اسم Bright AI واضح ككيان؟

7. Performance
- حجم HTML معقول؟
- CSS/JS غير مكرر؟
- صور مضغوطة؟
- lazy loading؟
- defer scripts؟
- لا assets مفقودة؟
- لا CLS واضح؟

8. Analytics
- هل GA4 موجود؟
- هل أحداث الديمو موجودة؟
- demo_started
- sample_loaded
- ai_result_generated
- whatsapp_clicked
- lead_submitted
- report_downloaded

9. Accessibility
- labels للحقول
- aria-live للنتائج
- أزرار بأسماء واضحة
- تباين ألوان جيد
- keyboard navigation
- focus states
- RTL صحيح

10. Deployment
- render.yaml لا يحتوي rewrites قديمة تسبب duplicate pages
- build scripts لا تستخدم مسارات ثابتة
- npm build يعمل
- static publish ينقل الملفات المطلوبة
- redirects للمسارات القديمة موجودة
- لا ملفات ضخمة تدخل في النشر بدون داعي

11. Content Quality
- لا وعود مبالغ فيها
- لا كلمات حشو
- لا فقرات مكررة بين الصفحات
- لا placeholder
- لا TODO
- لا نصوص إنجليزية غير مبررة
- لغة سعودية احترافية

12. Security
- لا مفاتيح
- لا secrets
- لا tokens
- لا بيانات اختبار تبدو حقيقية
- لا console.log حساس
- لا raw stack traces

المخرجات:
أعطني تقريراً بالصيغة التالية:

أولاً: Top 10 Critical Issues
ثانياً: Top 20 High-Impact Improvements
ثالثاً: المنتجات التي تحتاج ديمو
رابعاً: الصفحات التي تحتاج SEO Fix
خامساً: الديموهات التي تحتاج UX Fix
سادساً: مشاكل AI/Gemini
سابعاً: مشاكل الروابط والمسارات
ثامناً: مشاكل الأداء
تاسعاً: خطة تنفيذ 3 أيام
عاشراً: Checklist جاهزية النشر

لا تصلح أي شيء قبل التقرير.
```

---

# 9) برومبت QA نهائي بعد كل النقل والتحسين

```txt
أنت Release QA Lead.

بعد نقل interview و try إلى demo، وتحسين كل صفحات demo، نفّذ اختبار نهائي شامل.

افحص:

1. الديموهات الجديدة:
- /demo/smart-hiring-system/
- /demo/data-analyzer/
- /demo/data-quality/
- /demo/text-analysis/
- /demo/customer-service-automation/ إن تم إنشاؤه

2. كل الديموهات القديمة:
- /demo/custom-ai-agent/
- /demo/competitor-analysis-agent/
- /demo/seo-ai-agent/
- /demo/marketing-ai-agent/
- /demo/opportunity-discovery-agent/
- /demo/marketing-automation/
- /demo/supply-chain-optimization/
- /demo/ocr-demo/
- /demo/smart-medical-archive/
- /demo/smart-hospital-management/
- /demo/ai-scolecs/
- /demo/brightproject/
- /demo/brightsales/
- /demo/ai-tenders-analysis/

3. تحقق لكل صفحة:
- تفتح
- title
- meta description
- canonical
- og:url
- H1 واحد
- CTA إلى الخدمة
- CTA واتساب
- Sample Data
- Loading State
- Result Dashboard
- Error State
- Fallback
- لا JSON خام
- لا API key
- لا fetch مباشر إلى Gemini
- mobile responsive
- RTL صحيح

4. تحقق من services/index.html:
- كل product له service URL صالح
- كل product له demoUrl صالح إن كان product قابل للتجربة
- لا demoUrl خارج /demo/
- لا duplicate keys داخل products
- لا slug مضلل

5. تحقق من render.yaml:
- redirects القديمة موجودة
- لا rewrite يسبب duplicate content لمسار قديم
- /interview يذهب إلى /demo/smart-hiring-system/
- /try/data-analyzer يذهب إلى /demo/data-analyzer/
- /ai-bots/BrightSupport يذهب إلى /demo/customer-service-automation/ إن تم نقله

6. تحقق من sitemap.xml:
- يحتوي صفحات /demo/ الجديدة
- لا يحتوي صفحات قديمة مثل /interview/ أو /try/ إذا تم تحويلها
- lastmod محدث

7. شغّل:
npm run smoke-test:config
npm run internal-links:audit
npm run seo:html:check
npm run performance:budget
npm run build

8. إذا فشل أي اختبار:
- صنّفه Critical / High / Medium / Low
- أصلح Critical و High فقط
- لا تغيّر التصميم بلا داعي

المخرجات:
- Release status: Ready / Not Ready
- جدول كل صفحة
- الأخطاء التي تم إصلاحها
- الأخطاء المتبقية
- أوامر الاختبار ونتائجها
- توصية النشر
```

---

## ترتيب التنفيذ الأفضل

نفّذ بهذا الترتيب، لا تخلط كل شيء مرة واحدة:

```txt
1. برومبت اكتشاف المنتجات التي لا تملك ديمو
2. برومبت نقل interview إلى demo/smart-hiring-system
3. برومبت نقل try إلى demo/data-analyzer
4. برومبت إصلاح المنتجات الناقصة وربطها بـ demo
5. برومبت تحسين كل /demo/
6. برومبت التنظيف
7. برومبت ما قد تكون نسيته
8. برومبت QA النهائي
```

أهم شيء الآن: لا تبدأ بتحسينات SEO قبل نقل** **`interview` و `try`. النقل أولاً، ثم إصلاح** **`services/index.html`، ثم التحسينات. otherwise بتضطر تعدّل نفس الروابط مرتين.



أكيد. هذا برومبت شامل لتوحيد Gemini AI API داخل:

```txt
/Users/yzydalshmry/Desktop/BRIGHTAI/backend
```

والتحقق أن كل صفحات** **`/demo/` مربوطة به وتعمل بشكل صحيح بدون مفاتيح مكشوفة أو ربط مباشر من الواجهة.

---

# برومبت توحيد Gemini API لكل صفحات الديمو

```txt
أنت Senior Backend AI Engineer + Full-Stack QA Auditor + Security Reviewer.

أعمل على مشروع Bright AI في المسار:

/Users/yzydalshmry/Desktop/BRIGHTAI

المطلوب:
توحيد كل تكاملات Gemini AI داخل Backend فقط، ثم التحقق أن كل صفحات الديمو داخل /demo/ تستخدم هذا التكامل الموحد وتعمل بشكل صحيح.

المسار الأساسي للـ Backend:

/Users/yzydalshmry/Desktop/BRIGHTAI/backend

الهدف النهائي:
- كل ديمو يرسل طلباته إلى Backend داخلي.
- كل Backend AI requests تمر عبر ملف Gemini Gateway موحد.
- لا يوجد أي API Key في الواجهة.
- لا يوجد fetch مباشر من المتصفح إلى Gemini.
- كل ديمو يستقبل نتيجة منظمة قابلة للعرض.
- كل ديمو يحتوي fallback و error handling.
- كل صفحات /demo/ تعمل بدون كسر.

ابدأ بفحص بنية المشروع ولا تفترض أسماء الملفات.

ابحث أولاً عن ملفات Gemini أو AI الموجودة:
- backend/server.js
- backend/services/aiGateway.js
- backend/services/geminiGateway.js
- backend/services/geminiClient.js
- backend/services/unifiedAiGateway.js
- backend/routes/
- backend/controllers/
- backend/middleware/
- assets/js/gemini-demo-engine.js
- assets/js/ai-agent-demo-suite.js
- assets/js/live-demo-apps.js
- frontend/js/demo-experience.js

إذا وجدت أكثر من ملف يتعامل مع Gemini:
لا تحذف مباشرة.
أنشئ طبقة موحدة واجعل الباقي يستدعيها أو يتحول إليها تدريجياً.

المطلوب تنفيذياً:

## المرحلة 1: اكتشاف بنية الذكاء الاصطناعي الحالية

افحص كل المشروع وابحث عن:

- GEMINI_API_KEY
- GOOGLE_API_KEY
- generativelanguage.googleapis.com
- google.generativeai
- @google/generative-ai
- GoogleGenerativeAI
- Gemini
- gemini
- /api/ai/
- chat/completions
- responseMimeType
- responseSchema
- schemaName
- demoType
- agentType
- fetch(

اعطني تقريراً قبل التعديل يحتوي على:
- كل الملفات التي تحتوي تكامل Gemini
- كل endpoints الخاصة بالذكاء الاصطناعي
- كل ملفات frontend التي تستدعي AI
- هل يوجد API Key في frontend؟
- هل يوجد fetch مباشر إلى Gemini؟
- هل يوجد أكثر من gateway؟
- هل يوجد ديموهات تستخدم endpoints مختلفة؟

بعد التقرير، ابدأ الإصلاح.

## المرحلة 2: إنشاء أو تثبيت Gemini Gateway موحد

اعتمد ملفاً واحداً داخل backend ليكون المصدر الموحد، ويفضل:

backend/services/aiGateway.js

إذا الملف موجود، حسّنه بدلاً من إنشاء ملف جديد.
إذا غير موجود، أنشئه.

يجب أن يدعم الملف الموحد الآتي:

1. قراءة GEMINI_API_KEY من environment فقط:
- process.env.GEMINI_API_KEY
- أو process.env.GOOGLE_API_KEY كـ fallback إن كان مستخدماً في المشروع

ممنوع نهائياً:
- hardcoded API key
- إرسال API key للواجهة
- تسجيل API key في logs

2. دالة موحدة مثل:

async function runGeminiCompletion({
  model,
  messages,
  system,
  temperature,
  maxOutputTokens,
  responseFormat,
  schemaName,
  schema,
  demoType,
  agentType,
  locale,
  sourcePage,
  safetyProfile,
  metadata
})

3. دعم الرسائل بصيغة قريبة من OpenAI:
messages: [
  { role: "system", content: "..." },
  { role: "user", content: "..." }
]

ثم تحويلها داخلياً إلى صيغة Gemini.

4. دعم structured output:
إذا جاء response_format من النوع:
{
  "type": "json_schema",
  "json_schema": {
    "name": "...",
    "schema": {}
  }
}

حوّله إلى Gemini generationConfig بما يناسب:
- responseMimeType: "application/json"
- responseSchema إن كان مدعوماً في المكتبة/النمط الحالي

إذا كان responseSchema غير متاح في النسخة الحالية:
- استخدم responseMimeType: "application/json"
- أضف تعليمات صارمة داخل prompt لإرجاع JSON فقط
- أضف JSON parsing و validation بعد الرد

5. دعم schemaName:
أنشئ mapping موحد للـ schemas مثل:

const demoSchemas = {
  recruitmentSchema,
  smartHiringSchema,
  medicalArchiveSchema,
  dataAnalyzerSchema,
  dataPlatformSchema,
  educationSchema,
  hospitalOpsSchema,
  documentAutomationSchema,
  customerSupportSchema,
  marketingAutomationSchema,
  supplyChainSchema,
  customAiAgentSchema,
  competitorAnalysisAgentSchema,
  seoAgentSchema,
  marketingAgentSchema,
  opportunityDiscoveryAgentSchema,
  aiConsultingSchema,
  approvalsAutomationSchema,
  hrAutomationSchema,
  operationalReportsSchema,
  socialDataAnalysisSchema
}

واسمح أيضاً بالأسماء التالية كـ aliases:
- recruitment
- smart_hiring_system
- medical_archive
- data_analyzer
- data_platform
- education
- hospital_ops
- document_automation
- customer_support
- marketing_automation
- supply_chain
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- ai_consulting
- approvals_automation
- hr_automation
- operational_reports
- social_data_analysis

6. دعم fallback آمن:
إذا فشل Gemini:
- رجّع JSON error مفهوم
- لا ترجع raw stack trace
- لا ترجع API key
- لا ترجع تفاصيل حساسة
- status code مناسب
- message عربي مناسب للواجهة

مثال:
{
  "ok": false,
  "error": {
    "code": "AI_PROVIDER_UNAVAILABLE",
    "message_ar": "تعذر تشغيل التحليل الآن. يمكنك استخدام المثال الجاهز أو إعادة المحاولة."
  }
}

7. Logs آمنة:
سجّل فقط:
- requestId
- demoType
- agentType
- schemaName
- sourcePage
- latency
- success/fail

لا تسجل:
- API keys
- ملفات مرفوعة كاملة
- بيانات شخصية
- محتوى طبي حساس
- CV كامل
- رسائل عملاء كاملة

8. Safety profiles:
أضف إعداد safetyProfile حسب نوع الديمو:
- healthcare
- recruitment
- education
- marketing
- competitor_intelligence
- sales_leads
- general_business

كل profile يضيف system safety instructions مناسبة.

## المرحلة 3: توحيد Backend Endpoints

افحص backend/server.js أو routes.

أنشئ أو ثبّت endpoint موحد:

POST /api/ai/chat/completions

يقبل body مثل:

{
  "model": "gemini-2.5-flash",
  "demoType": "seo_agent",
  "agentType": "seo_agent",
  "schemaName": "seoAgentSchema",
  "locale": "ar-SA",
  "sourcePage": "/demo/seo-ai-agent/",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "seoAgentSchema",
      "schema": {}
    }
  },
  "temperature": 0.2
}

ويرجع:

{
  "ok": true,
  "provider": "gemini",
  "model": "...",
  "requestId": "...",
  "data": {}
}

أو إذا كان المشروع يستخدم response مباشرة:
حافظ على التوافق، لكن وثّقه.

أي endpoints قديمة مثل:
- /api/ai/gemini
- /api/ai/demo
- /api/ai/openai-chat
- /api/ai/ocr
- /api/ai/medical

لا تكسرها.
اجعلها تستدعي نفس aiGateway.js داخلياً أو ترجع redirect داخلي منطقي.
الأهم أن لا يبقى فيها Gemini logic مكرر.

## المرحلة 4: توحيد Frontend AI Client

افحص ملفات الواجهة:
- assets/js/gemini-demo-engine.js
- assets/js/ai-agent-demo-suite.js
- assets/js/live-demo-apps.js
- frontend/js/demo-experience.js
- أي JS داخل demo/*

المطلوب:
كل ديمو يجب أن يستخدم function موحدة مثل:

window.BrightAI.generateDemoResult({
  demoType,
  agentType,
  schemaName,
  sourcePage,
  userInputs,
  systemPrompt,
  taskPrompt,
  fallbackResult
})

هذه الدالة يجب أن ترسل إلى:

/api/ai/chat/completions

ممنوع:
- fetch مباشر إلى Gemini
- API Key في localStorage/sessionStorage
- إدخال API Key من المستخدم في واجهة الإنتاج
- نسخ logic Gemini في كل صفحة ديمو

إذا وجدت صفحات تطلب من المستخدم إدخال Gemini API Key:
- أزل ذلك من واجهة الإنتاج
- أبقِ خيار dev فقط إن كان مفيداً، لكن مخفي أو محمي ببيئة development
- اجعل الديمو يستخدم Backend دائماً

## المرحلة 5: ربط كل صفحات /demo/

افحص كل مجلد داخل:

/Users/yzydalshmry/Desktop/BRIGHTAI/demo/

لكل ملف:
demo/*/index.html

تحقق من:
- وجود script لمحرك الديمو الموحد
- وجود data-demo-type أو data-agent-demo أو ما يعادله
- وجود schemaName واضح
- وجود fallbackResult
- وجود زر تشغيل AI
- وجود زر Sample Data
- وجود Result Dashboard
- وجود Error State
- عدم عرض JSON خام للمستخدم

الديموهات التي يجب فحصها على الأقل:

- /demo/smart-hiring-system/
- /demo/data-analyzer/
- /demo/data-quality/
- /demo/text-analysis/
- /demo/customer-service-automation/
- /demo/custom-ai-agent/
- /demo/competitor-analysis-agent/
- /demo/seo-ai-agent/
- /demo/marketing-ai-agent/
- /demo/opportunity-discovery-agent/
- /demo/marketing-automation/
- /demo/supply-chain-optimization/
- /demo/ocr-demo/
- /demo/smart-medical-archive/
- /demo/smart-hospital-management/
- /demo/ai-scolecs/
- /demo/brightproject/
- /demo/brightsales/
- /demo/ai-tenders-analysis/

إذا كان بعض هذه المجلدات غير موجود:
- لا تفشل المهمة بالكامل
- اذكرها في التقرير
- إذا كانت مذكورة في services/index.html كـ demoUrl، اعتبرها مشكلة High

## المرحلة 6: Schemas المطلوبة

تأكد أن هذه schemas موجودة أو أن هناك بدائل مكافئة:

1. smartHiringSchema
2. dataAnalyzerSchema
3. dataQualitySchema
4. textAnalysisSchema
5. customerSupportSchema
6. customAiAgentSchema
7. competitorAnalysisAgentSchema
8. seoAgentSchema
9. marketingAgentSchema
10. opportunityDiscoveryAgentSchema
11. marketingAutomationSchema
12. supplyChainSchema
13. documentAutomationSchema
14. medicalArchiveSchema
15. hospitalOpsSchema
16. educationSchema
17. projectManagementSchema
18. salesAgentSchema
19. tenderAnalysisSchema
20. aiConsultingSchema
21. approvalsAutomationSchema
22. hrAutomationSchema
23. operationalReportsSchema
24. socialDataAnalysisSchema

إذا كانت بعض الديموهات لا تحتاج schema معقد:
استخدم genericDemoSchema مؤقتاً، لكن سجّل ذلك كـ Warning.

كل schema يجب أن ينتج:
- executive_summary_ar
- score أو readiness_score إن مناسب
- key_insights
- risks
- recommended_actions
- business_impact_ar
- integration_readiness
- next_action_ar
- whatsapp_summary_ar

## المرحلة 7: اختبارات تشغيل Backend

أنشئ أو حسّن سكربت اختبار مثل:

scripts/test-gemini-unified-api.mjs

يختبر endpoint:

POST /api/ai/chat/completions

لكل demoType أساسي، باستخدام payload صغير و sample data.

يجب أن يختبر:
- status code
- JSON صالح
- ok true أو error مفهوم
- data object موجود
- لا raw HTML
- لا raw stack trace
- لا API key
- schema fields الأساسية موجودة

اختبر على الأقل:
- smart_hiring_system
- data_analyzer
- customer_support
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- marketing_automation
- supply_chain
- document_automation
- medical_archive
- hospital_ops
- education

أضف script في package.json إن مناسب:
"test:ai-gateway": "node scripts/test-gemini-unified-api.mjs"

لكن لا تكسر package.json.

## المرحلة 8: اختبارات Frontend Static Audit

أنشئ أو حسّن سكربت مثل:

scripts/audit-demo-ai-bindings.mjs

يفحص كل demo/*/index.html ويتأكد من:
- لا يوجد generativelanguage.googleapis.com
- لا يوجد GEMINI_API_KEY
- لا يوجد GOOGLE_API_KEY
- لا يوجد apiKey في HTML
- يوجد /api/ai/chat/completions أو محرك موحد يستدعيه
- يوجد schemaName أو data-schema
- يوجد demoType أو agentType
- يوجد fallback
- يوجد Error State
- يوجد Sample Data

أضف script:
"audit:demo-ai": "node scripts/audit-demo-ai-bindings.mjs"

## المرحلة 9: إصلاح مشاكل متوقعة

أصلح هذه الأنماط إن وجدتها:

1. صفحة Demo تستدعي Gemini مباشرة:
حوّلها إلى /api/ai/chat/completions.

2. صفحة Demo تحتوي حقل API Key:
أزله من الإنتاج.

3. ديمو يستخدم endpoint قديم:
إما حدّثه للموحد أو اجعل endpoint القديم يستدعي gateway الموحد.

4. ديمو يعرض JSON خام:
أضف renderer أو fallback dashboard.

5. ديمو بدون fallback:
أضف fallbackResult مناسب.

6. ديمو بدون schemaName:
أضف schemaName مطابق.

7. Backend يرجع raw error:
نظف error response.

8. script يستخدم مسار ثابت:
استبدل:
"/Users/yzydalshmry/Desktop/BRIGHTAI"
بـ:
process.cwd()

## المرحلة 10: أوامر الاختبار النهائية

بعد الإصلاح شغّل المتاح فقط من package.json:

- npm run audit:demo-ai
- npm run test:ai-gateway
- npm run smoke-test:config
- npm run internal-links:audit
- npm run seo:html:check
- npm run build

إذا أي سكربت غير موجود:
لا تخترعه في التقرير.
إما أضفه إذا كان ضمن المهمة، أو اذكر أنه غير موجود.

## المرحلة 11: التقرير النهائي

أعطني تقريراً بالعربية بهذه البنية:

### 1. ملخص تنفيذي
- هل تم توحيد Gemini API؟
- ما هو الملف الموحد؟
- هل كل الديموهات تستخدمه؟
- هل توجد مفاتيح مكشوفة؟
- هل المشروع جاهز للنشر من ناحية AI؟

### 2. ملف Gateway الموحد
- المسار
- الدوال الرئيسية
- endpoints التي تستخدمه
- schemas المدعومة
- safety profiles

### 3. جدول الديموهات
لكل ديمو:
- المسار
- demoType
- schemaName
- endpoint
- fallback موجود؟
- error state موجود؟
- يستخدم gateway الموحد؟
- الحالة: Pass / Warning / Fail
- الملاحظة

### 4. مشاكل تم إصلاحها
- الملف
- المشكلة
- الإصلاح
- السبب

### 5. مشاكل متبقية
صنفها:
- Critical
- High
- Medium
- Low

### 6. اختبارات
- الأمر
- النتيجة
- ملاحظات

### 7. توصية النشر
- Ready
- Ready with warnings
- Not ready

### 8. خطوات لاحقة
- تحسينات اختيارية
- تحسينات ضرورية
- ديون تقنية
```

---

# برومبت مختصر للتدقيق فقط بدون تعديل

استخدم هذا إذا تبغى أولاً تقرير بدون ما يلمس الملفات:

```txt
أنت AI Integration QA Auditor.

افحص مشروع Bright AI في:

/Users/yzydalshmry/Desktop/BRIGHTAI

بدون تعديل أي ملف.

المطلوب:
تدقيق توحيد Gemini API لكل صفحات الديمو داخل /demo/ والتحقق أنها تستخدم Backend الموحد داخل:

/Users/yzydalshmry/Desktop/BRIGHTAI/backend

افحص:
- backend/server.js
- backend/services/
- assets/js/
- frontend/js/
- demo/*/index.html
- services/index.html

ابحث عن:
- GEMINI_API_KEY
- GOOGLE_API_KEY
- generativelanguage.googleapis.com
- GoogleGenerativeAI
- @google/generative-ai
- /api/ai/chat/completions
- /api/ai/
- schemaName
- demoType
- agentType
- fallbackResult
- fetch(

أعطني تقريراً فقط يحتوي:

1. ما هو ملف Gemini Gateway الحالي؟
2. ما هي endpoints الخاصة بالذكاء الاصطناعي؟
3. هل يوجد أي API Key في الواجهة؟
4. هل يوجد fetch مباشر إلى Gemini؟
5. كل ديمو داخل /demo/:
   - المسار
   - endpoint المستخدم
   - schemaName
   - demoType أو agentType
   - fallback موجود؟
   - error state موجود؟
   - الحالة Pass/Warning/Fail
6. الديموهات غير المرتبطة بالموحد
7. الديموهات التي تحتاج schema
8. الملفات التي يجب تعديلها
9. خطة إصلاح مرتبة حسب الأولوية

لا تعدّل أي ملف.
```

---

# برومبت إصلاح مباشر بعد التقرير

```txt
بناءً على تقرير تدقيق Gemini API السابق، أصلح مشاكل الربط فقط.

القواعد:
- لا تعيد تصميم الصفحات.
- لا تغيّر محتوى SEO إلا إذا كان ضرورياً.
- لا تنقل ملفات.
- لا تحذف endpoints قديمة إذا كانت مستخدمة.
- لا تكشف API key.
- لا تضف fetch مباشر إلى Gemini.
- كل AI request يجب أن يمر عبر backend/services/aiGateway.js أو Gemini Gateway الموحد.
- كل demo يجب أن يستخدم /api/ai/chat/completions أو endpoint موحد يستدعي gateway نفسه.
- أضف fallbackResult و error state للصفحات الناقصة.
- أضف schemaName و demoType للصفحات الناقصة.
- نظف أي raw JSON display.

بعد الإصلاح:
- شغّل audit:demo-ai إن كان موجوداً.
- شغّل internal-links:audit.
- شغّل smoke-test:config.
- شغّل build.

أعطني:
- الملفات المعدلة
- المشاكل التي تم حلها
- الديموهات التي أصبحت Pass
- المشاكل المتبقية
```

---

# برومبت اختبار API Gateway فقط

```txt
اختبر Gemini API Gateway الموحد فقط في مشروع Bright AI.

المسار:
/Users/yzydalshmry/Desktop/BRIGHTAI/backend

المطلوب:
1. شغّل Backend محلياً حسب package.json.
2. اختبر endpoint:
POST /api/ai/chat/completions

3. أرسل payload تجريبي لكل demoType:
- smart_hiring_system
- data_analyzer
- customer_support
- custom_ai_agent
- competitor_analysis_agent
- seo_agent
- marketing_agent
- opportunity_discovery_agent
- marketing_automation
- supply_chain
- document_automation
- medical_archive
- hospital_ops
- education

4. لكل payload استخدم:
{
  "model": "gemini-2.5-flash",
  "demoType": "...",
  "agentType": "...",
  "schemaName": "...",
  "locale": "ar-SA",
  "sourcePage": "/demo/.../",
  "messages": [
    {
      "role": "system",
      "content": "أنت مساعد تحليلي يعيد JSON منظم فقط."
    },
    {
      "role": "user",
      "content": "استخدم بيانات تجريبية مختصرة واعد تقريراً عربياً منظماً."
    }
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "...",
      "schema": {}
    }
  },
  "temperature": 0.2
}

5. تحقق أن response:
- status 200 أو error مفهوم
- JSON صالح
- لا يحتوي API key
- لا يحتوي stack trace
- لا يحتوي raw provider error
- يحتوي data أو error منظم
- يحترم schema قدر الإمكان

6. أنشئ تقرير:
- demoType
- schemaName
- status
- JSON valid
- gateway used
- notes
```

---

## ترتيب الاستخدام الأفضل

ابدأ بهذا:

```txt
نفّذ برومبت التدقيق فقط بدون تعديل.
```

بعد التقرير:

```txt
نفّذ برومبت إصلاح مباشر بعد التقرير.
```

ثم:

```txt
نفّذ برومبت اختبار API Gateway فقط.
```

وبعدها شغّل QA النهائي للديموهات.
