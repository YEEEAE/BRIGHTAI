# تقرير التحقق الحي من Redirects على الإنتاج

**المشروع:** BrightAI  
**النطاق المفحوص:** `https://brightai.site`  
**تاريخ التنفيذ:** 24 أبريل 2026  
**طريقة التحقق:** `curl -I -L` على الإنتاج مع مقارنة `expected behavior` المستخرج من:

- [render.yaml](/Users/yzydalshmry/Desktop/BRIGHTAI/render.yaml)
- [_redirects](/Users/yzydalshmry/Desktop/BRIGHTAI/_redirects)
- [redirects.json](/Users/yzydalshmry/Desktop/BRIGHTAI/redirects.json)
- [brightai/جدول.csv](/Users/yzydalshmry/Desktop/BRIGHTAI/brightai/جدول.csv)

---

## الملخص التنفيذي

النتيجة الحالية تؤكد أن **قواعد redirects الموجودة في الكود ليست مطبقة بالكامل على الإنتاج**.

ضمن عينة من **21 رابطاً** قديماً أو غير معياري:

- **2 فقط** تصرفت كما هو متوقع
- **19 رابطاً** فشل في إعطاء السلوك المتوقع من الكود

أنماط الفشل الفعلية على الإنتاج كانت:

- روابط يفترض أن تعطي `301` لكنها ترجع `404`
- روابط يفترض أن تعطي `301` لكنها ترجع `200` مباشرة على المسار القديم
- روابط بدون trailing slash يفترض أن تُوحَّد، لكنها ما زالت تُخدم كنسخة `200`

---

## قراءة سريعة

| المؤشر | القيمة |
|---|---:|
| حجم العينة | 21 |
| نجاح مطابق للتوقع | 2 |
| فشل عن التوقع | 19 |
| نسبة النجاح | 9.5% |
| نسبة الفشل | 90.5% |

---

## جدول المطابقة

| Old URL | Expected From Code | Actual On Production | الحالة |
|---|---|---|---|
| `https://brightai.site/frontend/pages/blogger/nca-compliance` | `301` → `https://brightai.site/blog/nca-compliance/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/try/index.html` | `301` → `https://brightai.site/try/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/frontend/pages/ai-bots/BrightProject/index.html` | `301` → `https://brightai.site/ai-bots/BrightProject/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/frontend/pages/ai-bots/BrightSales/index.html` | `301` → `https://brightai.site/ai-bots/BrightSales/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/frontend/pages/ai-bots/BrightRecruiter/index.html` | `301` → `https://brightai.site/ai-bots/BrightRecruiter/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/frontend/pages/ai-workflows/index.html` | `301` → `https://brightai.site/ai-workflows/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/frontend/pages/our-products/index.html` | `301` → `https://brightai.site/services/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/ai-bots/index.html` | `301` → `https://brightai.site/ai-bots/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/about-us/index.html` | `301` → `https://brightai.site/about/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/contact/index.html` | `301` → `https://brightai.site/contact/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/ai-agent/index.html` | `301` → `https://brightai.site/ai-agent/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/consultation/index.html` | `301` → `https://brightai.site/consultation/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/data-analysis/index.html` | `301` → `https://brightai.site/data-analysis/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/smart-medical-archive/index.html` | `301` → `https://brightai.site/smart-medical-archive/` | `404` بدون redirect | فشل |
| `https://brightai.site/frontend/pages/smart-automation/index.html` | `301` → `https://brightai.site/smart-automation/` | `404` بدون redirect | فشل |
| `http://www.brightai.site/` | التحويل إلى النطاق المعياري `https://brightai.site/` | وصل إلى `https://brightai.site/` عبر redirectين | نجاح جزئي مقبول |
| `https://www.brightai.site/` | `301` → `https://brightai.site/` | وصل إلى `https://brightai.site/` عبر redirect واحد | نجاح |
| `https://brightai.site/smart-automation.html` | `301` → `https://brightai.site/smart-automation/` | `404` بدون redirect | فشل |
| `https://brightai.site/ai-agent.html` | `301` → `https://brightai.site/ai-agent/` | `404` بدون redirect | فشل |
| `https://brightai.site/ai-workflows` | `301` → `https://brightai.site/ai-workflows/` | `200` على نفس الرابط | فشل |
| `https://brightai.site/docs` | `301` → `https://brightai.site/docs/` | `200` على نفس الرابط | فشل |

---

## أهم الاستنتاجات

### 0. فحص المستودع الحالي لا يدعم فرضية وجود `frontend/pages/`

تم فحص المشروع المحلي بعد التدقيق الحي، وكانت النتيجة:

- المجلد `frontend/pages/` **غير موجود** في المستودع الحالي
- الروابط الحرجة داخل [render.yaml](/Users/yzydalshmry/Desktop/BRIGHTAI/render.yaml) موجودة فعلاً بصيغة `301`
- ترتيبها المحلي يأتي قبل كثير من الـ rewrites العامة

هذا مهم جداً، لأنه يعني أن سبب الفشل لم يعد يمكن تفسيره محلياً بـ:

- "وجود ملفات قديمة داخل المشروع الحالي"
- أو "غياب قواعد redirect من الكود"

وبالتالي، الاحتمال الأقوى الآن هو:

- **drift بين إعداد خدمة Render الحية وما هو موجود في المستودع**
- أو أن الخدمة الحالية لا تطبق `render.yaml` الجاري في `main` كما هو متوقع
- أو أن آخر deploy حي لا يطابق القواعد الحالية رغم أن محتوى الموقع نفسه يتحدث جزئياً

### 1. فشل واسع في تطبيق Redirects القديمة

الروابط الأقدم من نوع `/frontend/pages/...` لا تتصرف على الإنتاج كما هو معرف في الكود. بعضها:

- يرجع `404`
- وبعضها يظل مفتوحاً بحالة `200` على المسار القديم

وهذا أسوأ من مجرد نقص تجميلي، لأنه يبقي Google أمام:

- target قديم قابل للوصول
- أو target قديم مكسور
- بدون نقل واضح للإشارات إلى الصفحة المعيارية

### 2. سياسة trailing slash ليست مطبقة حيّاً بالكامل

رابطا:

- `https://brightai.site/ai-workflows`
- `https://brightai.site/docs`

يفترض أن يتحولا إلى النسخ المنتهية بـ `/`، لكن الإنتاج يعيد `200` على النسخة غير المعيارية نفسها.

### 3. روابط `.html` القديمة الحرجة ما زالت تفشل

رابطا:

- `https://brightai.site/smart-automation.html`
- `https://brightai.site/ai-agent.html`

يفترض أن يعطيا `301`، لكنهما يرجعان `404`.

### 4. توحيد `www` يعمل أفضل من بقية الفئات

نسختا:

- `http://www.brightai.site/`
- `https://www.brightai.site/`

تصلان فعلاً إلى النطاق المعياري، لكن نسخة `http://www` تمر بخطوتين redirect، لا بخطوة واحدة نظيفة.

---

## الخلاصة العملية

من منظور SEO تقني، طبقة `redirect intent` في الكود جيدة نظرياً، لكن **طبقة التنفيذ على الإنتاج غير متطابقة معها حالياً**.

المشكلة لم تعد: "هل القواعد موجودة؟"  
بل أصبحت: "لماذا لا تُنفَّذ هذه القواعد حيّاً على `brightai.site` رغم وجودها في المستودع؟"

وهذا يفسر مباشرة ما ظهر في تقرير الفهرسة الأساسي:

- `404` على روابط كان يفترض أن تتحول
- نسخ non-canonical ما زالت تعمل بحالة `200`
- تعثر نقل الإشارات إلى النسخ النهائية

---

## التوصية التالية

الخطوة المنطقية التالية هي تنفيذ **Post-deploy redirect remediation**:

1. التحقق من أن خدمة `brightai-site` على Render مربوطة فعلاً بآخر commit على `main`.
2. التحقق من أن الخدمة نفسها **تقرأ Blueprint / render.yaml الحالي** وليس إعداداً يدوياً أقدم داخل Dashboard.
3. إذا كانت الخدمة غير متزامنة مع Blueprint، يجب عمل sync من Dashboard أو إعادة ربط الخدمة بتعريف `render.yaml`.
4. بعد ذلك فقط:
   - نشر تحديث جديد
   - تنفيذ `Purge Everything` في Cloudflare
   - إعادة تشغيل نفس عينة `curl -I -L`
5. إصدار تقرير `before/after` نهائي يثبت انتقال العينة من `404/200` إلى `301`.
