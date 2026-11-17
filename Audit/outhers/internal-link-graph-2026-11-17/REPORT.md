# مراجعة دلالة الروابط الداخلية — 2026-11-17

الحالة: DONE محليًا؛ لا commit أو push أو نشر. المرجع هو HTML المبني من شجرة العمل، وليس عدد الروابط في المصدر.

## الخريطة والدليل

- [قبل التعديل](before/graph.json): 71 مستند HTML و2861 ظهورًا لرابط داخلي، دون روابط مكسورة قابلة للرصد. هذا لم يثبت جودة العلاقات التحريرية.
- [بعد التعديل](after/graph.json): 71 مستندًا و2886 ظهورًا لرابط؛ يحتفظ كل edge بالمصدر والوجهة والاستعلام وfragment ونص الرابط وسياقه ورقم السطر في HTML. الأعداد تشمل التكرار والتنقل المشترك ولا تمثل عدد العلاقات المفيدة.
- [جدول الروابط](after/edges.csv)، [رسم DOT](after/graph.dot)، [الخلاصة](after/summary.json). JSON يحوي درجات الوصول والروابط الواردة من المحتوى مستقلة عن التنقل.
- 64 صفحة عامة مفهرسة، كلها قابلة للوصول خلال نقرة أو نقرتين من الرئيسية. `/docs/` و`/products/` و`/contact/` بعمق1؛ `/resources/` و`/solutions/` بعمق2. العمق الأقصى3 يخص بعض صفحات المحاكاة غير المفهرسة.
- غير المتصل من الرئيسية: `/404.html` وثلاث صفحات authors غير مفهرسة تحمل بدائل الهوية التحريرية؛ ليست صفحات هبوط رئيسية ولا أُضيفت روابط مصطنعة إليها.

## الفجوات الدلالية وما تغير

1. اختيار أول ثلاثة أدلة في التصنيف كان يعتمد ترتيب المصفوفة. أصبحت العلاقات مختارة بحسب السؤال التالي: 12 دليلًا بعلاقات صريحة، وإعادة استخدام علاقات `guide.related` التحريرية لـ20 دليلًا. لا fallback حسب التصنيف؛ إضافة دليل بلا علاقة أو مسار عملي توقف البناء.
2. الأدلة الديناميكية كانت تعرض علاقاتها التحريرية ثم قسمًا عامًا ثانيًا. أزيل التكرار وأصبح لكل دليل قسم واحد من ثلاثة أدلة مكملة. لا روابط جديدة داخل كل فقرة؛ الروابط العملية في قسم ختامي محدود من3–4وجهات.
3. كل دليل يرتبط بأصل عملي مناسب وبالمنتج ذي التجربة التعليمية وبالتواصل، مع قطاع محدد فقط حيث يدل موضوع الدليل عليه. نصوص الوجهات تصف الأصل أو المنتج أو دليل القطاع، ولا تعد بتشغيل فعلي أو اعتماد.
4. صفحات الصحة والمال تصل الآن إلى الدليل القطاعي المتخصص بدل دليل عام؛ القطاعات الأربعة تربط أصلًا عمليًا مناسبًا إلى جانب الدليل والمنتج الموجودين.
5. رابط فتح المقال في نتائج البحث يحمل اسمًا قابلًا للوصول يذكر عنوانه. عناوين الروابط في أقسام المقالات المرتبطة هي عناوين الوجهات الفعلية.
6. توسيع `from` داخل main إلى الموارد والقطاعات والمنتجات والمحاكاة والتواصل؛ العودة إلى `/docs/` على نفس الأصل فقط، مع whitelist لفلاتر البحث وhash موضع التمرير، دون تمرير السياق للروابط الخارجية. الفهرس وحالة البحث والعرض تبقى متاحة؛ دون JavaScript تبقى الروابط والفهرس الثابتان، ولا يُدّعى حفظ الفلاتر الديناميكية.

## المسارات العملية

| فهم المشكلة | اتخاذ قرار / أصل عمل | تجربة تعليمية | تواصل |
|---|---|---|---|
| `/knowledge/pdpl-and-ai/` ثم تصنيف البيانات والإقامة والعقود بحسب السؤال | `/resources/ai-use-policy/` | `/products/firewall/#lab` | `/contact/` مع موضوع مناسب |
| `/knowledge/ai-governance-financial-sector/` ↔ `/solutions/finance/` | `/resources/ai-risk-register/` | `/products/risk-engine/#lab` | `/contact/` |
| `/knowledge/ai-governance-committee-raci/` | `/resources/responsibility-evidence-matrix/` | `/products/human-gate/#lab` | `/contact/` |
| `/knowledge/ai-audit-trail/` | `/resources/responsibility-evidence-matrix/` | `/products/ledger/#lab` | `/contact/` |

الأسهم خيارات متابعة بحسب الحاجة، وليست إجبارًا على فتح كل وجهة. مراجعة القرار والاختصاص البشري موضحة في المحتوى؛ المحاكاة ليست اعتمادًا مؤسسيًا.

## التحقق

- build PASS مع اعتماد lockfile الحالي Astro6.4.8 في `/tmp/brightai-resources-verify`؛ تطابق `src` مع شجرة العمل مثبت بـrsync checksum. node_modules الجذر غير مطابق للعقد ويتطلب Node أعلى، ولم يُعدّل. سجل البناء `/tmp/internal-links-final-build.log`.
- HTML PASS: جميع الصفحات والأقسام المستهدفة والتحميلات؛ صفر missing target أو broken anchor أو رابط إلى redirect alias أو anchor فارغ. GET مباشر لـ135 وجهة path/query فريدة: كلها200، دون اتباع تحويلات؛ لذا لا سلاسل أو حلقات في وجهات الروابط المبنية. لا تشمل هذه النتيجة كل redirects القديمة التي لا يشير إليها HTML.
- مستند404 يحتوي رابط تخطٍّ إلى قسمه المحلي؛ لا يُطلب HTTP مستقل لهذا fragment ولا يعد رابطًا ميتًا إلى صفحة أخرى.404 نفسه يبقى404.
- unit PASS: خمس حالات لفاحص graph تشمل الصفحة المفقودة والقسم المفقود والتحويل والروابط الخارجية والاسم المتاح وسياق التنقل.
- Chrome PASS:32دليلًا ×390/1440 =64عرضًا، RTL، دون overflow، فهرس موجود وثلاثة أدلة مكملة ومسار عملي3–4وجهات؛ [browser.json](browser.json).
- مساران كاملان ×390/1440: بحث وفلاتر وعرض موسع →دليل→دليل مرتبط→فهرس بالقفز والتركيز→منتج/مختبر→تواصل→استعادة نتائج البحث وhash موضع العودة. رفض `from=https://example.org/`؛ no-JS يحفظ الروابط والفهرس.
- Browser MCP:القطاعات الأربعة ×390/1440، كلها200 ودون overflow؛ عناوين الوجهات المتخصصة والأصول والمنتجات مطابقة. لم تُرسل رسالة أو نموذج.
- git diff --check PASS. Graphify graph/tool غير متاحين؛ لا تثبيت.

## إعادة التشغيل

```sh
python3 tests/internal-link-graph.test.py
python3 scripts/internal-link-graph.py /path/to/dist/client /path/to/output --base http://127.0.0.1:4467
PLAYWRIGHT_MODULE=/path/to/playwright/index.mjs node audit/internal-link-graph-2026-11-17/verify-browser.mjs
```

أمر `npm run internal-links:audit` غير معرف في package.json الحالي؛ استُخدم فاحص HTML المرفق بدل سكربت مفترض.

## حدود الدليل

النشر والموقع الحي وقياس تحسن الاكتشاف أو التحويل عبر Analytics NOT RUN. لا يُستنتج أثر SEO من زيادة الروابط. فحص المتصفح لا يثبت قبول قارئ شاشة شاملًا. الموارد ليست كلها مناسبة لكل واقعة؛ روابط القطاع مقتصرة على السياقات الصريحة.

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: Semantic internal linking and rendered-HTML graph
Files Scanned: 71 rendered HTML files
References Checked: 2886 internal anchor occurrences; 135 HTTP destinations
Issues Found: 0 final structural issues
Issues Fixed: Relevance/order and duplicated related sections; Kernel lab destination corrected during verification
Issues Requiring Manual Review: 0 within local rendered links
--- FIXED ---
KnowledgeReader → explicit editorial relationships and practical next steps
SectorContentExtension → specialized sector guides and practical resources
Knowledge context → preserved return path across the journey
--- NEEDS MANUAL REVIEW ---
None
--- WARNINGS ---
Local artifact only; no deployment. Built-in npm audit command absent.
=== END REPORT ===
```

```text
=== CONTENT INTEGRITY REPORT ===
Trigger: Next-step links and related-guide selection
Content Reviewed: 32 guide relationship sets and 4 sector next-step paragraphs
Review Depth: section and cross-reference
--- CRITICAL ISSUES (must fix) ---
None
--- HIGH ISSUES (should fix) ---
Array-order recommendations and duplicate related sections → curated, single section
--- MEDIUM ISSUES (quality improvement) ---
Generic sector destinations → specialist guides and practical resources
--- LOW ISSUES (polish) ---
Generic article action accessible name → includes destination title
--- INTEGRATION SUMMARY ---
New content fits: yes; next steps explain why each destination helps
Flow preserved: yes; TOC and return context checked in Chrome
Consistency maintained: yes; educational status retained
Cross-references valid: yes; rendered targets and fragments checked
--- STATISTICS ---
Issues Found: 1 high pattern, 1 medium pattern, 1 low pattern
Issues Auto-Fixed: 3 patterns repaired and reviewed
Issues Needing Manual Review: 0 within changed copy
Content Quality Score: 8/10 editorial judgment; not a measured user outcome
=== END REPORT ===
```
