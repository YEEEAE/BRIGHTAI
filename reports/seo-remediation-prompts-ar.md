# برومبتات تنفيذية لإصلاح SEO والفهرسة في Bright AI

هذا الملف يجمع برومبتات كاملة وجاهزة للاستخدام لمعالجة مشاكل SEO والفهرسة والزحف التي ظهرت في المستودع.  
كل برومبت مكتوب ليعمل على المشروع المحلي نفسه، ويطلب تنفيذًا فعليًا مبنيًا على الملفات لا على افتراضات عامة.

## طريقة الاستخدام

- استخدم `Prompt 0` إذا أردت تنفيذ خطة إصلاح شاملة على دفعات.
- استخدم أي برومبت تخصصي إذا أردت إصلاح محور واحد فقط.
- لا تخلط بين الصفحات العامة والصفحات الداخلية أو التطبيقية أثناء التنفيذ.
- بعد كل برومبت، اطلب تنفيذ التعديل نفسه لا مجرد التحليل.

---

## Prompt 0: برومبت رئيسي شامل

```text
أنت تعمل على مستودع Bright AI المحلي. المطلوب تنفيذ إصلاحات SEO وفهرسة حقيقية داخل الملفات، وليس تقديم تقرير جديد.

السياق:
- المشروع يحتوي مشاكل موثقة في canonical و hreflang و sitemap والروابط الداخلية والصفحات الضعيفة والمحتوى الإنجليزي وبعض الصفحات الداخلية المتسربة للفهرسة.
- اعتمد فقط على الملفات داخل المستودع.
- لا تفترض أي route أو صفحة غير موجودة فعليًا.
- ميّز دائمًا بين:
  1) الصفحات العامة القابلة للفهرسة
  2) الصفحات الداخلية أو التطبيقية أو الإدارية أو صفحات الأدوات الخاصة

الأهداف:
1. إصلاح canonical في الصفحات العامة فقط
2. إصلاح hreflang بحيث لا يشير إلا إلى صفحات موجودة فعليًا
3. تنظيف sitemap.xml بحيث يحتوي فقط على الصفحات العامة الصحيحة
4. إصلاح الروابط الداخلية المكسورة
5. منع الصفحات الداخلية أو الضعيفة أو الإدارية من تلويث الفهرسة
6. تحسين الصفحات الضعيفة جدًا التي يجب أن تبقى عامة، أو إخراجها من الفهرسة إذا لم تكن جاهزة
7. تقليل الضجيج في structured data

الملفات ذات الأولوية:
- /Users/yzydalshmry/Desktop/BRIGHTAI/sitemap.xml
- /Users/yzydalshmry/Desktop/BRIGHTAI/_headers
- /Users/yzydalshmry/Desktop/BRIGHTAI/_redirects
- /Users/yzydalshmry/Desktop/BRIGHTAI/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/services/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/services/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/docs.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy-en.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/ai-scolecs/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/interview/pages/support-ai/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/mais-OBM/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/frontend/js/schema-loader.js

قواعد التنفيذ:
- اقرأ الملفات أولًا ثم نفّذ.
- لا تعدّل خارج النطاق المطلوب.
- لا تضف npm packages.
- إذا وجدت pattern متكرر في template أو script أو partial أصلح المصدر بدل الترقيع اليدوي إن أمكن.
- استخدم noindex فقط عندما تكون الصفحة غير مناسبة للفهرسة فعلًا.
- لا تترك hreflang لنسخة لغة غير موجودة.
- لا تترك صفحة عامة بcanonical خاطئ أو مفقود.
- لا تترك sitemap.xml يحتوي روابط غير قابلة للفهرسة أو بدائل لغة وهمية.

المخرجات المطلوبة:
- نفّذ الإصلاحات
- اعرض ملخصًا موجزًا بما تغيّر
- اذكر ما الذي بقي ويحتاج قرارًا تحريريًا أو تجاريًا
- اذكر الملفات المعدلة
```

---

## Prompt 1: إصلاح canonical بالكامل

```text
أنت تعمل داخل مستودع Bright AI. المطلوب إصلاح جميع مشاكل canonical في الصفحات العامة.

افعل الآتي:
1. افحص كل صفحة HTML عامة قابلة للفهرسة
2. قارن canonical الحالي بالمسار النهائي الحقيقي الذي يجب أن تُفهرس عليه الصفحة
3. أصلح أي canonical مفقود أو خاطئ أو غير متوافق مع المسار النهائي
4. لا تضف canonical لصفحات الخطأ أو الصفحات الإدارية إلا إذا كان ذلك جزءًا من نمط تقني مقصود
5. تأكد أن canonical يستخدم URL النهائي نفسه من دون خلط بين:
   - `.html`
   - `/index.html`
   - trailing slash
   - slug encoded vs decoded

ملفات متأثرة معروفة:
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/docs.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/sectors/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/mais-OBM/index.html
- مجموعة مقالات عربية قديمة في /Users/yzydalshmry/Desktop/BRIGHTAI/blog/
- صفحات tender/interview الداخلية التي يجب حسمها بين canonical صحيح أو noindex صريح

أمثلة مشكلات يجب إصلاحها:
- canonical يشير إلى slug عربي غير percent-encoded بينما النظام الداخلي يعتبر النسخة النهائية percent-encoded
- canonical يشير إلى `/en/docs/` بينما الصفحة هي `/en/docs/docs`
- canonical مفقود تمامًا في بعض الصفحات

التنفيذ المطلوب:
- عدّل الملفات فعليًا
- إذا كانت الصفحة لا يجب أن تكون indexable، لا تكتفِ بإصلاح canonical بل عالج وضعها بالكامل
- في النهاية اعرض قائمة الصفحات التي تم إصلاح canonical لها
```

---

## Prompt 2: إصلاح hreflang على مستوى الصفحات والسايت ماب

```text
أنت تعمل داخل مستودع Bright AI. المطلوب إصلاح hreflang بالكامل بناءً على الصفحات الموجودة فعليًا فقط.

المشكلة الحالية:
- توجد عشرات إشارات hreflang وبدائل en-US لصفحات لا وجود لها فعليًا
- بعض الصفحات تضع hreflang إلى `index.html` بدل URL النهائي
- بعض الصفحات العربية تضع x-default أو ar-SA بشكل غير متسق
- بعض الصفحات الإنجليزية تكرر en-US على URL خاطئ

الهدف:
1. كل صفحة عامة يجب أن تضع hreflang صحيحًا فقط إذا كان لها counterpart حقيقي
2. إذا لم توجد نسخة لغة مقابلة، أزل hreflang الوهمي بدل الإبقاء عليه
3. self-reference يجب أن يطابق canonical النهائي بالضبط
4. x-default يجب أن يشير إلى الصفحة الافتراضية الصحيحة
5. نظّف hreflang من الصفحات الداخلية وnoindex

ابدأ بهذه الملفات:
- /Users/yzydalshmry/Desktop/BRIGHTAI/sitemap.xml
- /Users/yzydalshmry/Desktop/BRIGHTAI/ai-scolecs/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/docs.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/docs/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/privacy-policy-en.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/terms-and-conditions.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/terms-and-conditions-en.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/tenders/landing.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/tenders/landing.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/interview/pages/support-ai/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/privacy-cookies/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/terms/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/sitemap/index.html

مهم:
- لا تنشئ hreflang لصفحة غير موجودة على القرص
- لا تعتمد على تخمين مسار `en/...`
- إذا كانت الصفحة قانونية أو utility ولا تحتاج بديلًا لغويًا فعليًا، اترك فقط ما هو صحيح
- أصلح أيضًا hreflang داخل sitemap.xml وليس داخل HTML فقط

المخرجات:
- نفّذ التعديلات
- أعرض مجموعات اللغة التي أصبحت صحيحة
- أعرض الصفحات التي أزيل منها hreflang لأن البديل غير موجود
```

---

## Prompt 3: تنظيف sitemap.xml بالكامل

```text
أنت تعمل على ملف sitemap.xml في مستودع Bright AI. المطلوب تحويله إلى sitemap نظيف عالي الثقة.

القواعد:
1. ضم فقط الصفحات العامة القابلة للفهرسة فعلًا
2. استبعد أي صفحة:
   - noindex
   - داخلية أو إدارية
   - تحويلية
   - canonicalها غير صحيح
   - counterpart لغويها غير صحيح إذا كان hreflang مستخدمًا
3. لا تضف أي alternate hreflang لا يملك ملفًا فعليًا
4. لا تضع صفحات قانونية أو utility منخفضة القيمة إذا كان قرار المشروع استبعادها
5. لا تضع صفحات app داخل السايت ماب

راجع بشكل خاص:
- الصفحات العربية القديمة في /blog/ التي canonicalها مكسور
- /en/services/
- /privacy-cookies/
- /terms/
- /sitemap/
- /mais-OBM/
- /interview/pages/*
- /tenders/*
- /en/tenders/*

اعتمد على الملفات الفعلية فقط، ثم:
- حدّث sitemap.xml
- إذا كان هناك script مولد للسايت ماب، أصلحه أيضًا حتى لا يعيد إنتاج الخطأ

الملفات المرجعية:
- /Users/yzydalshmry/Desktop/BRIGHTAI/sitemap.xml
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/generate-sitemap-all-pages.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-url-map.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/reports/sitemap-quality-report.md

المخرجات:
- نفّذ التعديل
- اذكر عدد الروابط النهائية
- اذكر أهم الصفحات التي أُزيلت من السايت ماب ولماذا
- اذكر أهم الصفحات التي أُضيفت أو أُعيدت بعد التصحيح
```

---

## Prompt 4: إصلاح الروابط الداخلية المكسورة والمعمارية

```text
أنت تعمل على تحسين الربط الداخلي في Bright AI. المطلوب إصلاح الروابط الداخلية المكسورة، ثم تقوية بنية الربط حول الصفحات المحورية.

المشكلة المؤكدة:
- هناك نمط مكرر لروابط داخلية تشير إلى `/ai-bots/` رغم أن هذا المسار العام غير موجود
- هذا النمط موجود في الصفحة الرئيسية وصفحات الخدمات والقطاعات وAI Agent وغيرها

المرجع الأساسي:
- /Users/yzydalshmry/Desktop/BRIGHTAI/reports/internal-links/broken_links_before.md

ابدأ بإصلاح هذا النمط في:
- /Users/yzydalshmry/Desktop/BRIGHTAI/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/services/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/about/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/ai-agent/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/ai-agent/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/health/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/health/index.html
- كل ملفات sectors المتأثرة

المطلوب:
1. استبدل كل رابط مكسور بمسار صالح ومقصود
2. لا تغيّر الرابط إلا إذا كنت متأكدًا من الوجهة الصحيحة
3. بعد الإصلاح، حسّن الربط حول hubs التالية:
   - /
   - /services/
   - /blog/
   - /docs/
   - /sectors
4. أضف روابط سياقية بين:
   - صفحات الخدمات
   - صفحات القطاعات
   - المقالات الداعمة
   - صفحات docs

الهدف:
- تقليل الصفحات اليتيمة
- رفع topical authority
- تحسين اكتشاف الصفحات المهمة

المخرجات:
- نفّذ الإصلاح
- اذكر الروابط المكسورة التي تم تصحيحها
- اذكر الصفحات التي ما زالت تحتاج قرارًا معماريًا
```

---

## Prompt 5: معالجة الصفحات الضعيفة أو placeholder

```text
أنت تعمل على Bright AI. المطلوب تحديد الصفحات العامة الضعيفة جدًا ثم اتخاذ قرار صحيح لكل صفحة: تحسينها أو إخراجها من الفهرسة.

الصفحات ذات الأولوية:
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/services/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/mais-OBM/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/sectors/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/data-analysis-en.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/solutions-ocr-en.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/docs/consultation-en.html

قواعد القرار:
1. إذا كانت الصفحة جزءًا أساسيًا من العرض التجاري أو البنية التسويقية، حسّنها إلى مستوى منافس
2. إذا كانت الصفحة مؤقتة أو داخلية أو ليست جاهزة، اجعلها noindex
3. لا تترك صفحة عامة بعنوان قوي ومحتوى شبه فارغ
4. حافظ على لغة الصفحة واتجاهها الصحيح

لصفحة /en/services/ خصوصًا:
- النص الحالي placeholder وضعيف جدًا
- إمّا أن تبني صفحة خدمات إنجليزية حقيقية بمحتوى مؤسسي قوي
- أو أن تجعلها noindex مؤقتًا وتزيلها من hreflang والسitemap

المخرجات:
- نفّذ القرار المناسب لكل صفحة
- اذكر لماذا اخترت improve أو noindex
- اعرض الملفات المعدلة
```

---

## Prompt 6: إخراج الصفحات الداخلية والتطبيقية من الفهرسة

```text
أنت تعمل على Bright AI. المطلوب تنظيف الفهرسة من الصفحات الداخلية أو التشغيلية أو الإدارية التي لا يجب أن تنافس في Google.

افحص هذه المسارات:
- /Users/yzydalshmry/Desktop/BRIGHTAI/interview/pages/
- /Users/yzydalshmry/Desktop/BRIGHTAI/tenders/
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/tenders/
- /Users/yzydalshmry/Desktop/BRIGHTAI/mais-OBM/
- أي صفحة dashboard أو compare أو settings أو reports أو support flow ليست صفحة تسويقية

المطلوب:
1. تأكد من وجود `noindex, nofollow, noarchive` في كل الصفحات الداخلية
2. أضف حماية على مستوى `_headers` إذا كانت الصفحة تُخدم كملف ثابت
3. احذف hreflang من الصفحات الداخلية
4. تأكد أنها ليست موجودة في sitemap.xml
5. إن كانت هناك صفحات redirect-like داخل HTML، لا تجعلها تبدو صفحات SEO

انتبه:
- `tenders/index.html` قد تكون صفحة عامة تسويقية، فلا تعاملها كصفحات dashboard
- ميّز بين landing page عامة وبين dashboard داخلي

المخرجات:
- نفّذ التعديلات
- اذكر كل مسار داخلي تم حسمه
- اذكر أي صفحة بقيت عامة عمدًا ولماذا
```

---

## Prompt 7: تحسين النسخة الإنجليزية المؤسسية

```text
أنت تعمل على تحسين المحتوى الإنجليزي في Bright AI ليتوافق مع سوق B2B السعودي ونبرة enterprise احترافية.

المشكلة:
- توجد صياغات إنجليزية غير مؤسسية أو عامية أو مبالغ فيها
- هذا يضعف الثقة وE-E-A-T ويشوّه الانطباع التجاري

ابدأ بهذه الملفات:
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/services/index.html
- أي صفحة إنجليزية أخرى تحتوي نبرة غير احترافية أو metadata غير مناسب

التعليمات:
1. أعد كتابة العناوين والوصف والفقرات الأساسية بنبرة:
   - enterprise
   - confident
   - clear
   - suitable for Saudi decision-makers
2. أزل أي تعبيرات عامية أو مبالغات تسويقية رخيصة
3. حافظ على intent الحالي للصفحة
4. لا تجعل النص ترجمة حرفية ركيكة من العربية
5. حسّن metadata أيضًا إذا كانت متأثرة

مثال على النوع غير المقبول:
- sick ai tools
- badass ai software
- make decision-making a breeze

المخرجات:
- نفّذ إعادة الصياغة
- اذكر الملفات التي حُسّنت
- اذكر أي صفحات ما زالت تحتاج مراجعة بشرية تسويقية لاحقة
```

---

## Prompt 8: تحسين Structured Data وتقليل الضجيج

```text
أنت تعمل على Bright AI. المطلوب مراجعة structured data داخل الصفحات العامة وتقليل الأنواع غير المفيدة أو المتقادمة، مع الحفاظ على الأنواع الداعمة فعلًا للـ SEO.

راجع:
- /Users/yzydalshmry/Desktop/BRIGHTAI/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/ai-agent/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/ai-agent/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/data-analysis/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/data-analysis/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/demo/ocr-demo/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/frontend/js/schema-loader.js

المطلوب:
1. احصر أنواع schema الموجودة
2. أزل أو استبدل الأنواع التي لا تقدم قيمة حقيقية
3. خفف الاعتماد على:
   - HowTo
   - FAQPage المكرر على عدد كبير من الصفحات بلا حاجة
4. ثبّت الأنواع المهمة:
   - Organization
   - Service
   - BreadcrumbList
   - Article / BlogPosting عند الحاجة
   - ContactPage أو WebPage أو WebSite عند الحاجة
5. لا تضع FAQPage إلا إذا كانت الأسئلة جزءًا حقيقيًا من الصفحة ومفيدة للمستخدم

المخرجات:
- نفّذ التعديلات
- اذكر ما أزلته وما أبقيته ولماذا
- اذكر الصفحات التي أصبحت بياناتها المنظمة أنظف وأكثر اتساقًا
```

---

## Prompt 9: تحسين Metadata وOG وTwitter في الصفحات الناقصة

```text
أنت تعمل على Bright AI. المطلوب سد فجوات metadata الاجتماعية والبحثية في الصفحات التي ينقصها OG أو Twitter أو وصف مناسب.

التركيز على:
- /Users/yzydalshmry/Desktop/BRIGHTAI/demo/ocr-demo/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/demo/pricing/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/demo/resources/report-ai-saudi-2026/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/try/data-analyzer/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/try/data-quality/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/try/text-analysis/index.html
- /Users/yzydalshmry/Desktop/BRIGHTAI/en/services/index.html

المطلوب:
1. تأكد من وجود:
   - title
   - meta description
   - og:title
   - og:description
   - og:image
   - og:url
   - twitter:card
   - twitter:title
   - twitter:description
2. اجعل الوصف صادقًا ومتوافقًا مع محتوى الصفحة الفعلي
3. لا تكرر وصفًا عامًا لا يميز الصفحة
4. حافظ على نفس النبرة المؤسسية للموقع

المخرجات:
- نفّذ التعديل
- اذكر الصفحات التي كانت ناقصة وما الذي أُضيف لها
```

---

## Prompt 10: إعادة بناء صفحة القطاعات كـ hub حقيقية

```text
أنت تعمل على Bright AI. المطلوب تحويل صفحة /sectors إلى hub تسويقية قوية بدل أن تبقى صفحة ضعيفة ومعزولة.

المشاكل الحالية:
- canonical غير متسق
- الصفحة معزولة نسبيًا
- لا تقوم بدور hub قوي للقطاعات

الملف:
- /Users/yzydalshmry/Desktop/BRIGHTAI/sectors/index.html

المطلوب:
1. إصلاح canonical وmetadata
2. رفع المحتوى إلى مستوى hub page حقيقية
3. ربطها بكل صفحات القطاعات الفرعية الموجودة فعليًا
4. إضافة تمهيد يشرح منطق القطاعات وخدمات Bright AI لكل قطاع
5. تحسين internal linking منها وإليها
6. إذا كان هناك بديل إنجليزي حقيقي فادعمه، وإذا لا يوجد فلا تعلن hreflang وهمي

المخرجات:
- نفّذ التعديل
- اذكر كيف أصبحت الصفحة أكثر قابلية للتصنيف والاكتشاف
```

---

## Prompt 11: إصلاح مسارات Legacy والمقالات العربية القديمة

```text
أنت تعمل على Bright AI. المطلوب تنظيف إرث المقالات القديمة العربية التي تعاني من canonical mismatch أو اختلاف بين slug الفعلي والنسخة النهائية.

راجع الملفات داخل:
- /Users/yzydalshmry/Desktop/BRIGHTAI/blog/

التركيز على:
- المقالات العربية القديمة ذات الأسماء الطويلة
- أي صفحة canonicalها لا يطابق URL النهائي
- أي صفحة hreflang فيها يشير إلى slug مختلف عن canonical
- أي صفحة عامة مستبعدة من السايت ماب بسبب canonical_mismatch

المطلوب:
1. حدّد URL النهائي الذي يجب اعتماده لكل مقال
2. وحّد canonical داخله
3. وحّد hreflang أو أزله إن لم يوجد counterpart
4. تأكد من أن السايت ماب يستخدم النسخة نفسها
5. إن احتجت redirect، حدّث `_redirects`

المخرجات:
- نفّذ الإصلاح
- اذكر قائمة المقالات التي كانت مستبعدة وعادت صالحة للفهرسة
```

---

## Prompt 12: إصلاح مولدات المشروع حتى لا تعود الأخطاء

```text
أنت لا تصلح الصفحات يدويًا فقط، بل تصلح أيضًا المصدر الذي يعيد إنتاج الأخطاء في Bright AI.

راجع هذه الملفات:
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/generate-sitemap-all-pages.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/html-seo-governor.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-url-map.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/scripts/seo-health-check.mjs
- /Users/yzydalshmry/Desktop/BRIGHTAI/frontend/js/schema-loader.js

المطلوب:
1. امنع المولدات من إنشاء hreflang لصفحات غير موجودة
2. امنعها من استخدام `index.html` داخل hreflang إذا كان المسار النهائي slash URL
3. امنعها من إنشاء canonical مخالف للمسار النهائي
4. امنعها من إبقاء صفحات internal/app ضمن الصفحات العامة القابلة للفهرسة
5. أضف قواعد تحقق تمنع عودة:
   - missing canonical
   - hreflang وهمي
   - sitemap alternate target missing
   - internal broken links known pattern `/ai-bots/`

المخرجات:
- عدّل scripts نفسها
- اذكر ما الذي أصبح محكومًا تلقائيًا بعد التعديل
```

---

## Prompt 13: برومبت تدقيق نهائي بعد الإصلاح

```text
أنت تعمل على Bright AI بعد تنفيذ إصلاحات SEO. المطلوب تدقيق نهائي للتأكد أن المشاكل السابقة أُغلقت فعليًا.

نفّذ ما يلي:
1. افحص كل صفحات HTML العامة
2. تحقّق من:
   - canonical
   - hreflang
   - noindex للصفحات الداخلية
   - sitemap coverage
   - internal links
   - OG/Twitter coverage
   - الصفحات الضعيفة أو placeholder
3. شغّل أي scripts تدقيق محلية موجودة في المشروع
4. اذكر فقط:
   - ما تم إصلاحه فعلًا
   - ما فشل
   - ما بقي قرارًا تحريريًا أو تجاريًا

التقرير المطلوب:
- Executive summary قصير
- قائمة blockers المتبقية فقط
- قائمة الصفحات التي أصبحت جاهزة للفهرسة
- قائمة الصفحات التي يجب أن تبقى noindex
```

---

## ملاحظات تنفيذية

- إذا كان الهدف رفع الزيارات بسرعة، ابدأ بالترتيب:
  1. `Prompt 2`
  2. `Prompt 1`
  3. `Prompt 3`
  4. `Prompt 4`
  5. `Prompt 5`
  6. `Prompt 7`
  7. `Prompt 8`
  8. `Prompt 13`

- إذا كان الهدف منع تكرار الأعطال مستقبلًا، نفّذ `Prompt 12` بعد أول دفعة إصلاحات.
