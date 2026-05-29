أكيد أ.يزيد. هذي برومتات جاهزة تنسخها لأي Agent مثل Codex / Cursor / Claude Code / Copilot. نفّذها **بالترتيب** لأن بعضها يعتمد على الثاني.

## البرومبت 1: تجهيز فرع إصلاحات كامل

```text
أنت Senior Frontend + Technical SEO Engineer. اعمل على مشروع BrightAI في المستودع الحالي.

المطلوب:
1. أنشئ فرع جديد باسم:
fix/technical-seo-core-audit

2. لا تغيّر الهوية البصرية ولا التصميم العام.
3. لا تحذف صفحات أو ملفات إلا إذا كانت مكررة أو broken بشكل مؤكد.
4. قبل أي تعديل، افحص هذه الملفات:
- _redirects
- robots.txt
- sitemap.xml
- sitemap-pages.xml
- docs/index.html
- docs/ai-firewall/index.html
- solutions/ai-firewall/index.html
- frontend/js/unified-header.js
- package.json
- scripts/seo-ci-check.mjs
- scripts/internal-links-audit.mjs إن وجد

5. بعد كل تعديل شغّل:
npm run seo:check
npm run seo:gate
npm run internal-links:audit
npm run performance:budget

إذا فشل أي أمر، أصلح السبب ولا تتجاهله.

اكتب تقرير مختصر في نهاية التنفيذ يوضح:
- الملفات التي عدلتها
- سبب التعديل
- نتيجة أوامر الفحص
- أي مشاكل بقيت تحتاج تدخل يدوي
```

---

## البرومبت 2: إصلاح مشكلة `/docs/` والـ redirects

```text
افحص ملف _redirects وملفات sitemap/canonical المتعلقة بمسار /docs/.

المشكلة:
يوجد تضارب محتمل بين:
- /docs/
- /docs/docs/
- canonical الخاص بصفحة docs
- روابط sitemap التي تشير إلى /docs/

المطلوب:
1. اجعل /docs/ هو المسار الرسمي النهائي لمركز الوثائق.
2. أزل أو عدّل أي redirect يحوّل /docs أو /docs/ إلى /docs/docs/.
3. تأكد أن canonical في docs/index.html هو:
https://brightai.site/docs/

4. تأكد أن sitemap.xml و sitemap-pages.xml لا يحتويان على /docs/docs/ إلا إذا كان هذا ملفًا فعليًا مطلوبًا، والأفضل عدم استخدامه.
5. أضف redirects فقط من المسارات القديمة إلى /docs/، مثل:
   /docs.html -> /docs/
   /docs/index.html -> /docs/

6. لا تغيّر محتوى الصفحة نفسها إلا إذا كان لازمًا لإصلاح الروابط.

Acceptance Criteria:
- /docs/ لا يتحول إلى /docs/docs/
- sitemap يشير إلى /docs/
- canonical self-referencing
- npm run seo:gate ينجح
```

---

## البرومبت 3: إصلاح الربط الداخلي داخل مركز الوثائق

```text
افتح docs/index.html وأصلح روابط البطاقات الداخلية.

المشكلة:
بطاقات الوثائق مثل AI Firewall وAI Audit Trail وAI Governance Platform تشير إلى /docs/ بدل صفحاتها الفعلية.

المطلوب:
استبدل روابط البطاقات كالتالي:

AI Governance Platform -> /docs/ai-governance-platform/
AI Firewall -> /docs/ai-firewall/
AI Audit Trail -> /docs/ai-audit-trail/
Human Approval Layer -> /docs/human-approval-layer/
AI Evidence File -> /docs/ai-evidence-file/
حوكمة الذكاء الاصطناعي في السعودية -> /docs/ai-governance-saudi-arabia/
إدارة مخاطر الذكاء الاصطناعي -> /docs/ai-risk-management/
PDPL والذكاء الاصطناعي -> /docs/pdpl-ai-governance/
NCA ECC وحوكمة AI -> /docs/nca-ecc-ai-governance/
جاهزية تدقيق الذكاء الاصطناعي -> /docs/ai-audit-readiness/

أضف وصفًا مختصرًا لكل بطاقة إن كان ناقصًا، لكن لا تكثر الكلام.

Acceptance Criteria:
- لا توجد بطاقة داخل docs/index.html رابطها /docs/ إلا بطاقة الرجوع للمركز نفسه إن وجدت.
- كل رابط يشير إلى صفحة موجودة فعليًا.
- npm run internal-links:audit ينجح.
```

---

## البرومبت 4: إصلاح Schema في صفحات Docs

```text
افحص كل صفحات docs/*/index.html وخصوصًا:
- docs/ai-firewall/index.html
- docs/ai-audit-trail/index.html
- docs/ai-evidence-file/index.html
- docs/ai-governance-platform/index.html
- docs/human-approval-layer/index.html
- docs/pdpl-ai-governance/index.html
- docs/nca-ecc-ai-governance/index.html
- docs/ai-risk-management/index.html
- docs/ai-audit-readiness/index.html
- docs/ai-governance-saudi-arabia/index.html

المشكلة:
بعض JSON-LD WebPage وBreadcrumb وFAQ يشير إلى /docs/ بدل الصفحة الحالية.

المطلوب:
لكل صفحة:
1. اجعل canonical مطابقًا لمسار الصفحة.
2. اجعل WebPage @id بالشكل:
https://brightai.site/{page-path}/#webpage

3. اجعل WebPage url بالشكل:
https://brightai.site/{page-path}/

4. اجعل BreadcrumbList @id بالشكل:
https://brightai.site/{page-path}/#breadcrumb

5. اجعل آخر breadcrumb item يشير إلى الصفحة الحالية وليس /docs/.
6. إذا وُجد FAQPage، اجعل @id بالشكل:
https://brightai.site/{page-path}/#faq

7. لا تكرر نفس Schema مرتين داخل الصفحة. إن وجدت أكثر من JSON-LD متضارب، وحّدها في graph واحد نظيف.

Acceptance Criteria:
- كل صفحة Docs لها Schema self-referencing.
- لا توجد صفحة docs فرعية فيها WebPage url = https://brightai.site/docs/
- JSON-LD صالح بدون أخطاء parsing.
- npm run seo:gate ينجح.
```

---

## البرومبت 5: تنظيف FAQ Schema من الأسئلة غير الطبيعية

```text
افحص FAQPage schema في صفحات:
- solutions/ai-firewall/index.html
- docs/ai-firewall/index.html
- pricing/index.html
- أي صفحة تحتوي FAQPage

المشكلة:
بعض الأسئلة داخل FAQ schema ليست أسئلة طبيعية، وبعضها طويل جدًا أو مأخوذ من أقسام كاملة.

المطلوب:
1. اجعل كل Question.name سؤالًا واضحًا وقصيرًا.
2. لا تستخدم عناوين مثل "التزامات PDPL" أو "القطاع المالي" كسؤال.
3. لا تجعل السؤال أطول من 120 حرفًا.
4. لا تجعل الإجابة أطول من 350 حرفًا إلا عند الحاجة.
5. يجب أن تكون كل أسئلة FAQ موجودة ظاهريًا في محتوى الصفحة، وليس فقط داخل schema.
6. احذف FAQPage من أي صفحة لا تعرض FAQ فعليًا.

أمثلة أسئلة جيدة:
- كيف يمنع AI Firewall تسريب البيانات الحساسة؟
- هل يعمل AI Firewall مع ChatGPT وGemini؟
- هل يحذف النظام البيانات أم يخفيها فقط؟
- كيف يساعد BrightAI في جاهزية PDPL؟
- هل يحتاج استخدام AI إلى موافقة بشرية دائمًا؟

Acceptance Criteria:
- لا توجد FAQ schema بأسئلة طويلة جدًا أو غير طبيعية.
- كل FAQ في Schema لها مقابل ظاهر في الصفحة.
- JSON-LD valid.
```

---

## البرومبت 6: إزالة JavaScript المكسور من صفحات Docs

```text
افحص صفحات docs التي تحتوي سكربت بهذا الشكل أو مشابه له:

<script>
  }
  });
</script>

المطلوب:
1. احذف أي script block مكسور أو غير مستخدم.
2. لا تحذف سكربتات ضرورية مثل unified-header.js أو production-runtime إلا إذا ثبت أنها تسبب خطأ.
3. تأكد أن كل صفحة HTML لا تحتوي JavaScript syntax error.
4. افحص خصوصًا:
- docs/index.html
- docs/ai-firewall/index.html
- بقية docs/*/index.html

Acceptance Criteria:
- لا توجد أقواس JS يتيمة.
- لا يوجد script فارغ أو مكسور.
- الصفحة تعمل بدون console syntax error.
```

---

## البرومبت 7: تحسين Core Web Vitals للصفحة الرئيسية

```text
حسّن Core Web Vitals للصفحة الرئيسية index.html بدون تغيير الهوية البصرية.

ركز على:
- LCP
- INP
- CLS
- Mobile performance

المشاكل المحتملة:
- Canvas animation في hero يعمل مبكرًا.
- unified-header يتم حقنه عبر JS.
- كثرة CSS/JS قبل ظهور المحتوى.
- تحميل الخط والصورة والأنيميشن في البداية.

المطلوب:
1. اجعل Canvas animation لا يبدأ إلا بعد:
   - requestIdleCallback إن كان مدعومًا
   - أو بعد setTimeout بسيط
   - أو بعد أول تفاعل للمستخدم على الموبايل

2. على الموبايل، استخدم fallback CSS background بدل Canvas إن كان الجهاز ضعيفًا:
   - hardwareConcurrency <= 4
   - أو prefers-reduced-motion
   - أو max-width <= 768px

3. لا تجعل Canvas يؤخر ظهور H1 أو CTA.
4. تأكد أن H1 والCTA الأساسيين يظهران بدون انتظار JS.
5. راجع preload:
   - الشعار فقط إذا كان مستخدمًا فوق fold
   - الخط الرسمي
6. لا تضف مكتبات جديدة.

Acceptance Criteria:
- لا يتأخر hero text بسبب Canvas.
- Canvas لا يعمل على prefers-reduced-motion.
- Animation لا يؤثر على أول تفاعل.
- التصميم يبقى قريب جدًا من الحالي.
```

---

## البرومبت 8: تحسين الهيدر للـ SEO والـ UX

```text
راجع frontend/js/unified-header.js وطريقة حقن الهيدر.

المشكلة:
الهيدر كامل يتم حقنه عبر JavaScript، وهذا قد يضعف الروابط الأساسية في HTML الأولي.

المطلوب:
1. لا تكسر نظام الهيدر الحالي.
2. أضف fallback navigation بسيط داخل HTML في الصفحات الأساسية أو عبر template إن وجد، بحيث تظهر أهم الروابط حتى لو تعطل JS:
   - الرئيسية /
   - الحلول /services/ أو /solutions/ai-governance-platform/
   - AI Firewall /solutions/ai-firewall/
   - AI Audit Trail /solutions/ai-audit-trail/
   - الوثائق /docs/
   - الأسعار /pricing/
   - التواصل /contact/

3. اجعل fallback مخفيًا بصريًا بعد تحميل الهيدر أو مستبدلًا بطريقة آمنة.
4. لا تكرر nav بشكل يربك القارئ أو قارئ الشاشة.
5. حافظ على ARIA attributes في الهيدر الحالي.

Acceptance Criteria:
- روابط التنقل الأساسية موجودة في HTML حتى قبل تنفيذ JS.
- لا يوجد duplicate navigation مزعج للمستخدم.
- الهيدر الحالي يستمر بالعمل.
- accessibility لا تتضرر.
```

---

## البرومبت 9: إنشاء صفحة BOFU لتقييم جاهزية حوكمة AI

```text
أنشئ صفحة جديدة عالية التحويل:

Path:
assessment/ai-governance-readiness/index.html

الهدف:
صفحة BOFU لاستهداف الباحثين عن تقييم جاهزية حوكمة الذكاء الاصطناعي في الشركات السعودية.

Primary Keyword:
تقييم جاهزية حوكمة الذكاء الاصطناعي

Secondary Keywords:
AI governance assessment Saudi Arabia
AI compliance readiness
جاهزية تدقيق الذكاء الاصطناعي
تقييم مخاطر الذكاء الاصطناعي
حوكمة الذكاء الاصطناعي للشركات السعودية

المطلوب في الصفحة:
1. Title:
تقييم جاهزية حوكمة الذكاء الاصطناعي للشركات السعودية | BrightAI

2. Meta description:
قيّم جاهزية مؤسستك لاستخدام الذكاء الاصطناعي بأمان عبر فحص المخاطر، البيانات، الموافقات، وسجلات التدقيق مع BrightAI.

3. H1 واضح.
4. فقرة افتتاحية تجيب مباشرة على نية البحث.
5. أقسام:
   - لمن هذا التقييم؟
   - ماذا نفحص؟
   - مخرجات التقييم
   - لماذا BrightAI؟
   - خطوات العمل
   - FAQ
   - CTA للتواصل أو واتساب

6. روابط داخلية إلى:
   /solutions/ai-governance-platform/
   /solutions/ai-firewall/
   /solutions/ai-audit-trail/
   /docs/ai-audit-readiness/
   /contact/

7. Schema:
   WebPage
   BreadcrumbList
   FAQPage إذا ظهرت الأسئلة في الصفحة

8. أضف الصفحة إلى sitemap.xml و sitemap-pages.xml إن كان التوليد يدويًا أو حدّث سكربت التوليد إن كان آليًا.

Acceptance Criteria:
- الصفحة indexable
- canonical self-referencing
- CTA واضح فوق fold
- روابط داخلية فعلية
- لا تستخدم كلام قانوني كضمان امتثال
```

---

## البرومبت 10: إنشاء صفحة PDPL + ChatGPT

```text
أنشئ صفحة جديدة:

Path:
docs/pdpl-chatgpt-data-protection/index.html

Primary Keyword:
ChatGPT والبيانات الشخصية في السعودية

Secondary Keywords:
PDPL ChatGPT Saudi Arabia
حماية البيانات الشخصية في الذكاء الاصطناعي
استخدام ChatGPT في الشركات السعودية
منع تسريب البيانات للذكاء الاصطناعي
PII masking AI
AI Firewall Saudi Arabia

المطلوب:
1. Title:
ChatGPT والبيانات الشخصية في السعودية: كيف تستخدم AI بدون تسريب بيانات؟ | BrightAI

2. Meta description:
دليل عملي للشركات السعودية لاستخدام ChatGPT والذكاء الاصطناعي مع حماية البيانات الشخصية، تنقية PII، وسجل تدقيق متوافق تشغيليًا مع PDPL.

3. المحتوى:
- مقدمة مباشرة
- أمثلة على بيانات لا يجب إرسالها للنماذج
- جدول: نوع البيانات / الخطر / الإجراء المناسب
- كيف يساعد AI Firewall
- متى نحتاج Human Approval
- كيف يفيد Audit Trail
- Checklist للشركات
- FAQ
- CTA

4. الروابط الداخلية:
   /solutions/ai-firewall/
   /solutions/ai-audit-trail/
   /solutions/human-approval-layer/
   /docs/pdpl-ai-governance/
   /pdpl-statement/
   /contact/

5. أضفها إلى sitemap إن لزم.
6. أضفها إلى docs/index.html كبطاقة ضمن "أدلة تنفيذية".

Acceptance Criteria:
- الصفحة ليست استشارة قانونية.
- اللغة سعودية مهنية وواضحة.
- تحتوي أمثلة عملية.
- FAQ طبيعي.
```

---

## البرومبت 11: إنشاء صفحة NCA ECC Controls Mapping

```text
أنشئ صفحة جديدة:

Path:
docs/nca-ecc-ai-controls-mapping/index.html

Primary Keyword:
NCA ECC AI governance

Secondary Keywords:
ضوابط الأمن السيبراني والذكاء الاصطناعي
امتثال الذكاء الاصطناعي NCA
AI audit trail cybersecurity
AI risk scoring
تصنيف بيانات الذكاء الاصطناعي

المطلوب:
1. Title:
مواءمة استخدام الذكاء الاصطناعي مع NCA ECC | BrightAI

2. Meta description:
دليل عملي يوضح كيف تساعد ضوابط BrightAI مثل AI Firewall وAudit Trail وHuman Approval في تشغيل استخدامات AI بطريقة قابلة للمراجعة أمنيًا.

3. المحتوى:
- لماذا تحتاج استخدامات AI لضوابط أمنية؟
- جدول mapping:
  المتطلب الأمني / خطر AI / ضابط BrightAI المقترح
- أمثلة على Audit Logs
- تصنيف البيانات داخل prompts
- الموافقات البشرية للقرارات الحساسة
- Evidence File
- Checklist
- FAQ
- CTA

4. الروابط الداخلية:
   /solutions/ai-governance-platform/
   /solutions/ai-firewall/
   /solutions/ai-audit-trail/
   /solutions/ai-evidence-file/
   /docs/nca-ecc-ai-governance/
   /contact/

5. أضف الصفحة إلى docs/index.html و sitemap.

Acceptance Criteria:
- لا تدّعي امتثال قانوني مضمون.
- استخدم عبارة "يدعم الجاهزية التشغيلية" بدل "يضمن الامتثال".
- الصفحة تقرأ كدليل تنفيذي لا مقال عام.
```

---

## البرومبت 12: إنشاء Trust Center

```text
أنشئ صفحة Trust Center جديدة:

Path:
trust/index.html

الهدف:
تعزيز الثقة للجهات الحكومية والشركات المنظمة.

المطلوب:
1. Title:
مركز الثقة والأمان | BrightAI

2. Meta description:
تعرف على ضوابط الأمان والخصوصية والحوكمة في BrightAI، وكيف ندعم جاهزية المؤسسات السعودية لاستخدام الذكاء الاصطناعي بأمان.

3. المحتوى:
- مقدمة عن الأمان والخصوصية
- كيف نحمي البيانات
- AI Firewall
- Audit Trail
- Human Approval
- Evidence File
- خيارات النشر: سحابي / هجين / معزول
- Security headers والسياسات التقنية
- الامتثال التشغيلي: PDPL, NCA ECC, ISO/IEC 42001, ISO/IEC 27001, ISO/IEC 23894, NIST AI RMF
- تنبيه مهم:
  إذا لم توجد شهادات رسمية مثبتة داخل المشروع، استخدم عبارة:
  "مبني وفق ممارسات ومعايير..." 
  ولا تستخدم عبارة "حاصلين على شهادات" إلا إذا وُجدت ملفات تحقق أو روابط رسمية.

4. أضف قسم:
   "مستندات يمكن توفيرها عند الطلب"
   - Security overview
   - Data processing agreement
   - AI governance controls summary
   - Deployment architecture

5. CTA:
   اطلب ملف الأمان المؤسسي
   تواصل مع BrightAI

6. روابط داخلية:
   /privacy-policy/
   /data-processing-agreement/
   /solutions/ai-firewall/
   /solutions/ai-audit-trail/
   /contact/

Acceptance Criteria:
- لا توجد ادعاءات شهادات غير مثبتة.
- الصفحة تصلح للعميل enterprise.
- أضفها للهيدر أو footer إن وجد.
- أضفها للسitemap.
```

---

## البرومبت 13: توحيد اسم البراند

```text
افحص استخدامات اسم العلامة في الصفحات العامة.

المشكلة:
يوجد تداخل بين BrightAI و Bright AI و برايت آي و مُشرقة للذكاء الاصطناعي.

المطلوب:
1. اعتمد الاسم التجاري الأساسي:
BrightAI

2. استخدم "برايت آي" فقط عند الحاجة بالعربي في النصوص التسويقية.
3. لا تستخدم "Bright AI" إلا إذا كان موجودًا في ملفات قانونية أو عنوان رسمي لا يجب تغييره.
4. لا تغيّر أسماء الملفات أو الصور.
5. حدّث:
- title
- meta description
- og:site_name
- schema Organization name
- H1/H2 عند الحاجة

6. انتبه لا تكسر SEO القديم بشكل مبالغ. في أول ظهور داخل الصفحة يمكن كتابة:
BrightAI "برايت آي"

Acceptance Criteria:
- توحيد واضح للبراند.
- عدم كسر canonical أو URLs.
- لا توجد صياغات متضاربة في الصفحة الواحدة.
```

---

## البرومبت 14: تحسين صفحة About لتكون بشرية أكثر

```text
أعد كتابة وتحسين about/index.html بدون تغيير التصميم العام.

المشكلة:
النص الحالي SEO-like وقالب، مثل "دليل عملي من Bright AI حول شركة ذكاء اصطناعي وطنية في الرياض".

المطلوب:
1. اجعل الصفحة تبدو كصفحة شركة حقيقية، لا مقال SEO.
2. ركز على:
- من هي BrightAI؟
- لماذا موجودة؟
- ما المشكلة التي تحلها؟
- لماذا السوق السعودي يحتاج AI Safety OS؟
- كيف تختلف عن شركات AI العامة؟
- من تخدم؟
- كيف تبدأ العلاقة مع العميل؟

3. حافظ على الكلمة الأساسية:
شركة ذكاء اصطناعي في الرياض
لكن لا تكررها بطريقة مزعجة.

4. اجعل H1:
BrightAI: شركة سعودية تبني طبقة أمان وحوكمة للذكاء الاصطناعي

5. Meta description:
BrightAI شركة سعودية من الرياض تساعد المؤسسات على استخدام الذكاء الاصطناعي بأمان عبر AI Firewall، Audit Trail، الموافقات البشرية، وملفات الأدلة.

6. أضف روابط داخلية:
   /solutions/ai-governance-platform/
   /solutions/ai-firewall/
   /docs/ai-governance-saudi-arabia/
   /trust/
   /contact/

Acceptance Criteria:
- النص طبيعي وبشري.
- أقل تكرار للكلمات المفتاحية.
- يحافظ على SEO المحلي.
- يدعم ثقة العملاء.
```

---

## البرومبت 15: فحص نهائي شامل قبل الدمج

```text
نفّذ فحص نهائي شامل بعد كل الإصلاحات.

المطلوب:
1. شغّل:
npm run build
npm run seo:check
npm run seo:gate
npm run internal-links:audit
npm run performance:budget
npm run sitemap:generate

2. افحص يدويًا:
- /
- /docs/
- /docs/ai-firewall/
- /solutions/ai-firewall/
- /pricing/
- /about/
- /assessment/ai-governance-readiness/
- /trust/

3. تحقق من:
- canonical self-referencing
- sitemap يحتوي الصفحات الجديدة
- لا توجد روابط داخلية مكسورة
- لا يوجد FAQ schema سيء
- لا يوجد JS syntax error
- لا يوجد redirect chain
- CTA ظاهر فوق fold
- الصفحة تعمل على mobile

4. اكتب تقرير نهائي باسم:
report/IMPLEMENTATION-FIXES-SUMMARY.md

يحتوي:
- ملخص الإصلاحات
- الملفات المعدلة
- الصفحات الجديدة
- نتائج الأوامر
- المشاكل المتبقية
- توصيات المرحلة التالية

Acceptance Criteria:
- كل أوامر الفحص تنجح أو يتم توثيق سبب الفشل بوضوح.
- لا يتم الدمج إلى main قبل نجاح الفحوصات.
```

---

أفضل ترتيب تنفيذ:

1. البرومبت 1
2. البرومبت 2
3. البرومبت 3
4. البرومبت 4
5. البرومبت 5
6. البرومبت 6
7. البرومبت 15
8. بعدها صفحات النمو: 9، 10، 11، 12
9. ثم تحسينات الثقة والأسلوب: 13، 14

ابدأ بالإصلاحات التقنية قبل إنشاء صفحات جديدة، لأن المحتوى الجديد ما يستفيد إذا الربط والـ schema والـ redirects فيها مشاكل.
