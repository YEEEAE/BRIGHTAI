# BRIGHTAI — Repository SEO Discovery Audit

التاريخ: 17 نوفمبر 2026 (Asia/Riyadh). الحالة: **التدقيق مكتمل ضمن الحدود الموضحة؛ الإصلاحات المحلية المتحققة مكتملة؛ اختلافات النشر والتحرير مفتوحة**.

مرجع البداية: `bbcd8546086b6e3c3ad8370ad396e23ae1f70938`؛ الإصلاحات في working tree، دون commit أو push أو deploy. بدأ الطلب تشخيصيًا، ثم أجاز المستخدم صراحة حفظ التقرير وتنفيذ الإصلاحات محليًا.

## المخرجات ونطاق الجدول

- [ROUTES.csv](ROUTES.csv): 119 صفًا للمسارات ومخططات المسارات الحالية، يشمل صف README المحذوف لتتبع الإصلاح؛ 118 مسارًا/مخططًا باقياً بعد الإصلاح.
- [ROUTES-before.csv](ROUTES-before.csv): نفس نطاق المستودع قبل الإصلاحات، بناء ناجح مطابق للـlockfile.
- [ROUTES-all-discovered.csv](ROUTES-all-discovered.csv): 492 URL/مخططًا فريدًا؛ يضم مسارات المستودع، 138 تحويلًا، وروابط حية قديمة اكتُشفت من sitemap وOpenSEO والـHTML. ليست 492 صفحة مفهرسة، والمسارات الديناميكية تمثل عائلة غير محدودة لا سجلات فعلية.
- [STATIC-ASSETS.csv](STATIC-ASSETS.csv): 12 موردًا عامًا ثابتًا؛ بيانات title/H1/Schema لا تنطبق على الخطوط والصور والملفات النصية.

كل صف في الجدول يحمل URL، مصدر الملف، SSR/prerender، public/private، status المتوقع والمحلي والحي، robots، canonical، title، description، H1، الكلمات، Schema، الروابط الواردة والصادرة، sitemap، llms، CTA، معلومات المؤلف والمراجعة، المخاطر، الثقة ومصدر الدليل. أُضيفت أعمدة تميز sitemap القديم عن الحالي، والبوابة المغلقة عن المفتوحة بلا جلسة.

**UNKNOWN/N/A ليس صفرًا أو نجاحًا**. الصفحات الحية التي لا مصدر لها في المستودع لا يمكن تحديد SSR/prerender الخاص بها من HTML وحده. تصنيف private يصف مساحة العمل المحمية؛ صفحة Auth نقطة دخول عامة noindex وليست بيانات خاصة منشورة.

## منهجية ومصدر الحقيقة

1. قراءة Project Mind وREADME والتعليمات والمهارات ذات الصلة؛ جرد وقراءة آلية كاملة لـ216 ملف مصدر Astro/TS/JS/MJS/MD تحت `src`، مع مراجعة مالكي المسارات والبيانات وlayouts وmiddleware وNode wrapper وSEO integration. [بصمات المصادر قبل التعديل](evidence/before/source-read-manifest.json).
2. توسعة `getStaticPaths` من بيانات المنتجات والقطاعات والأركان و32 مقالًا، ثم مطابقة المسارات مع **64 ملف HTML قبل الإصلاح، و63 بعد إزالة README**. لا استنتاج لدور صفحة من اسمها فقط.
3. `npm ci --no-audit --no-fund` داخل نسخة مؤقتة معزولة، وبناء عبر Node 22.22.3 وAstro 6.4.8 المحدد في lockfile. مطابقة جميع ملفات `src` و`scripts` بين نسخة البناء والمستودع النهائي؛ لا فروق. [provenance](evidence/after/provenance.json).
4. تحليل HTML المنتج فعليًا للصفحات prerender؛ وفحص Node SSR عبر `scripts/server.mjs` بلا تحميل `.env`، مرة بالبوابة مغلقة وأخرى مفتوحة بلا جلسة. اختبار API بقراءات GET فقط، دون POST أو سجلات مستخدمين أو تغيير بيانات.
5. GET مباشر للمسارات الحية، sitemap القديم والحالي و138 alias. زيارة browser لصفحة Firewall مع query؛ canonical والعنوان وrobots وH1 وSchema بقيت مطابقة للـHTML، لكن اختبار DOM بعد JavaScript **عينة فقط** وليس زحفًا متصفحياً لكل صفحة.
6. عد الكلمات: نص `main` الأولي، بعد استبعاد script/style/svg/noscript/template وhidden/aria-hidden. يشمل labels والتنقل داخل main؛ ليس قياسًا لغويًا دقيقًا ولا إثباتًا للظهور عبر CSS أو لاحقاً عبر التفاعل.
7. الروابط الواردة: صفحات مصدر فريدة، مع استبعاد self-links؛ يحتفظ الدليل المفصل بالـanchors. graph البناء كامل ضمن HTML الحالي؛ graph الموقع الحي محدود بما جرى اكتشافه، لذلك غياب رابط حي لا يثبت اليُتم.

### تصحيح نتيجة البيئة المبكرة

`node_modules` في المستودع كان يحتوي Astro **7.4.12** بينما lockfile يثبت **6.4.8**. خطأ compile في `pdpl-and-ai.astro:448` و500 في `/docs/` ظهرا في البيئة غير المطابقة. **البناء المطابق للـlockfile نجح قبل الإصلاحات وبعدها**؛ لذلك لا يُسجل خطأ PDPL كعيب بناء مؤكد في العقد الحالي، ولا تُستخدم نتائجه لاكتشاف صفحات يتيمة. لم نغير manifest أو lockfile أو نثبت dependencies داخل المستودع الأصلي.

## النتائج ذات الأولوية والثقة

| ID | النتيجة | الدليل | الثقة | الحالة بعد التنفيذ المحلي |
|---|---|---|---|---|
| F01 | اختلاف كبير بين المنشور والمصدر: 235 صفحة حية 200 قابلة للفهرسة ظاهريًا، لا يملكها مسار حالي ولا تحويل مسجل | `live-extra-routes.json.gz`؛ أمثلة `/customers/` و`/en/` و`/hub/ai-governance/` | عالية لغياب المصدر والحالة؛ نية إبقائها غير معروفة | مفتوح تشغيليًا؛ لا حذف أو تحويل جماعي بلا خريطة وجهات معتمدة |
| F02 | التحويلات 138 صحيحة محليًا، لكن حيًا 77×200 و61×404 دون 301 | `postbuild-redirects.json` وlive-extra؛ `scripts/server.mjs` يطبقها قبل static | عالية | لا خلل مثبت في جدول المصدر؛ يحتاج نشر Node/origin/edge الصحيح |
| F03 | `/sitemap.xml` الحي ما زال يسرد 264 رابطًا، بينما `/sitemap-index.xml` الحالي والبناء يسردان 57 صفحة | ملفات قوائم sitemap، وGSC آخر تنزيل مسجل 8 نوفمبر | عالية | التحويل المحلي `/sitemap.xml`→`/sitemap-index.xml` مثبت؛ الحي مفتوح |
| F04 | رابط التسجيل الحي `/auth/sign-up/` يعيد404 من 7 صفحات عامة منها المنتجات | [live-broken-links](evidence/live-broken-links.json) | عالية | SSR المحلي200 وnoindex؛ إصلاح النشر مطلوب؛ لم نستبدل CTA السليم بوجهة شكلية |
| F05 | ملف Markdown فارغ أنشأ `/README/` عامًا200 بلا title/description/canonical/robots؛ استبعاده من sitemap لم يمنع نشره | baseline وGET؛ `src/pages/README.md` كان صفر bytes | عالية | **FIXED LOCAL**: حذف الملف الفارغ، آخر bundle يعيد404 |
| F06 | 6 مختبرات demo افتقدت description | HTML قبل التعديل؛ `/demo/*` noindex | عالية؛ الأثر البحثي محدود لكونها noindex | **FIXED LOCAL**: أوصاف توضح المحاكاة وحدودها؛ noindex محفوظ |
| F07 | حارس البناء السابق تجاهل HTML بلا robots لأنه يفحص فقط index, follow حرفيًا | `scripts/seo-build.mjs` قبل التعديل وREADME | عالية | **FIXED LOCAL**: كل HTML يحتاج robots صريحًا فريدًا وعنوانًا ووصفًا، ثم يتحقق indexable canonical/sitemap |
| F08 | 11 صفحة أقل من300 كلمة داخل main؛ منها services وpillars و3 قطاعات | الكلمات في ROUTES.csv | متوسطة كمرشحات تحريرية فقط | مفتوح للمراجعة حسب غرض الصفحة؛ لم نضف حشوًا لبلوغ حد عددي |
| F09 | 12 مقالًا تصرح بأن اعتماد المراجعة التخصصية مطلوب؛ 20 دليلًا تعرض تاريخ إعداد/تحديث دون اعتماد مراجع مسمى | محتوى ArticleContext والمقالات وعمود review_information | عالية للنص؛ مؤهلات وموافقة المراجع غير متحققة | مفتوح تحريريًا؛ لا اختلاق لمؤلف أو اعتماد أو خبرة |
| F10 | `/404/` الحي يعيد200، بينما الخادم المحلي يعيد404 | before route evidence | عالية | عيب نشر/استجابة حي؛ local صحيح |
| F11 | OpenSEO أبلغ وصف solutions بطول161 مقابل حد الأداة160 | [OpenSEO issues](evidence/openseo-issues.json) | عالية للعد؛ منخفضة للأثر | معلوماتي؛ لا يعد حرف واحد خطأ فهرسة ولا يوجد حد مضمون لعرض الوصف |
| F12 | dependencies المحلية لا تطابق lockfile | تثبيت Astro7 مقابل lock6؛ البناء المعزولنجح | عالية | موثق؛ يلزم استخدام تثبيت نظيف مطابق للـlockfile عند التشغيل، دون ترقية غير مصرح بها |

### مرشحات قلة المحتوى

| المسار | كلمات main |
|---|---:|
| `/terms/` | 238 |
| `/about/` | 277 |
| `/trust/` | 296 |
| `/kernel/` | 240 |
| `/services/` | 217 |
| `/solutions/government/` | 287 |
| `/solutions/healthcare/` | 296 |
| `/solutions/enterprise/` | 297 |
| `/pillars/safety/` | 181 |
| `/pillars/transparency/` | 160 |
| `/pillars/privacy/` | 191 |

هذه الأعداد لا تعني أن الصفحات معيبة أو تحتاج نصًا أطول تلقائيًا. الأولوية للتحقق من إجابة الصفحة عن حاجة الزائر؛ لا يُستنتج ترتيب أو عقوبة من عدد الكلمات.

## تغطية الطلب: ما ثبت وما لم يثبت

| الفحص | النتيجة | الثقة والحدود |
|---|---|---|
| canonical خاطئ | صفر في57 صفحة البناء العامة؛ self canonical ثابت بلا query | عالية للـHTML الحالي؛ لا يثبت اختيار Google |
| canonical متغير | 15 فحصًا لخمسة مسارات مع query؛ canonical نظيف ثابت | عالية للعينة؛ [الدليل](evidence/before/canonical-query-tests.json) |
| صفحات يتيمة | صفر في graph البناء، وجميع57 قابلة للوصول من الرئيسية | عالية محليًا؛ المرشح المبكر data-governance-vs-ai-governance أُلغي بعد بناء docs الصحيح |
| روابط404 | صفر broken references في فاحص البناء؛ self-reference داخل صفحة404 نفسها لا يُحسب كرابط محتوى مكسور | عالية محليًا؛ CTA التسجيل الحي مكسور كما في F04 |
| صفحات مكررة | لا title أو description أو متن main متطابق في57 صفحة عامة | عالية للتطابق الحرفي؛ لا يثبت غياب تداخل النية البحثية |
| products/solutions متشابهة جدًا | أعلى Jaccard لخماسيات كلمات النص الأولي في العينة الحالية0.204؛ لا دليل على near-duplicate قوي بهذا المقياس | متوسطة؛ القالب متكرر لكن المحتوى يختلف؛ ليست دراسة cannibalization أو embedding شاملة |
| صفحة عامة غير مقصودة | README المحلي الفارغ ثبت وأُزيل؛235 صفحة حية إضافية تحتاج تحديد النية | عالية للسلوك، غير معروفة لنية نشر الصفحات القديمة |
| app/auth/api قابلة للفهرسة | لا app/auth في sitemap أو llms؛ app مغلق503/noindex وAuth200/noindex محليًا؛ GET API يرفض بحسب method/auth | عالية للطلبات المجهولة المفحوصة؛ robots.txt يسمح بالزحف، وهذا لا يلغي noindex؛ POST/بيانات المؤسسات خارج النطاق |
| title/description |57/57 عامة كاملة؛ demo6 أوصاف أُصلحت؛ غياب وصف على private AppLayout مقصود خارج الفهرسة | عالية للـHTML المنتج |
| Schema مقابل المحتوى | JSON-LD كله parseable؛ أسئلة وأجوبة FAQ تطابق النص بعد التطبيع؛ لا mismatch مثبت | عالية للفحص الآلي، متوسطة دلاليًا؛ لا شهادة rich-results ولا تحقق قانوني لكل ادعاء |
| معلومات المؤلف والمراجع | إسناد مؤسسي ظاهر؛ لا إثبات مراجع متخصص معتمد | عالية للنص، غير متحققة للخبرة/الاعتماد |
| HTML المصدر مقابل الناتج | wrappers تضيف Organization/WebSite/BreadcrumbList وcanonical وreader headings/TOC من المصدر؛ title/description/H1/Schema في HTML العام مكتملة | عالية للتوسعة والبناء؛ لا معنى لمقارنة نص Astro حرفيًا بHTML؛ DOM بعدJS عينة فقط |
| sitemap/llms |57/57 indexable في كليهما؛ لا app/auth/demo فيهما | عالية محليًا؛ llms يتضمن أيضًا رابط خريطة XML، لذلك عددURLs النصية58 ليس58 صفحة |

## الإضافات المستخدمة

- **OpenSEO**: مشروع `42dc000d-5c6a-4016-8710-f9a88d5be3b4`؛ تدقيق `3ac86631-1d42-4350-af16-3028f0508ba3` اكتمل عند **50/50** بسبب الحد المجاني، مع282 URL لم يزحف إليها. سجل مشكلتين: حد الزحف وطول الوصف. لا تعني قلة مشاكله سلامة المستودع أو تغطية كل الصفحات. [التدقيق في OpenSEO](https://app.openseo.so/p/42dc000d-5c6a-4016-8710-f9a88d5be3b4/audit?auditId=3ac86631-1d42-4350-af16-3028f0508ba3).
- **Google Search Console by HYPD**: اكتشاف property الفعلية `sc-domain:brightai.live`؛ sitemap المسجل `/sitemap.xml` submitted264، آخر download `2026-11-08T16:21:17.138Z`،0warnings/0errors. فحص `/products/firewall/` و`/knowledge/pdpl-and-ai/` أعاد **URL is unknown to Google** دون googleCanonical؛ ليس404 ولا إثبات مشكلة canonical. قيمة indexed0 في sitemap غير مستخدمة كعدد مفهرس.
- **Windsor GA4**: اتصال BRIGHT AI مثبت؛ قراءة81 page_path خلال18 أكتوبر–14 نوفمبر2026. مثال `/products/firewall/` sessions23 و`/app/` sessions15. وجود page_path لا يثبت نجاح الصفحة أو مصدر الزيارة أو فهرستها؛ لا نجمع sessions عبر page_path تجنبًا للتكرار.
- **Semrush**: اكتشاف تقارير Domain Overview أعاد `available:false` لعدم توفر API units. لم تُشتر وحدات ولم تُختلق rankings أو keyword volumes.

## الإصلاحات والتحقق النهائي

- حذف `src/pages/README.md` الفارغ؛ لا محتوى ضاع ولا redirect إلى صفحة غير مرتبطة.
- إضافة meta description إلى القالب المشترك للمختبرات الستة مع إبقاء noindex.
- تقوية `scripts/seo-build.mjs` لفحص كل HTML، وإضافة4 اختبارات انحدار meaningful للحالات التي كان الحارس يتجاهلها.
- **unit:4 PASS**؛ **build:PASS،57 صفحة عامة**؛ **route verification:57 صفحة،32 مقالًا،3304 مراجع،113 مسار موارد فريدًا،276 فحص تحويل GET/HEAD،0 orphan،0 broken references**.
- فحص HTTP مستقل على bundle أُعيد تشغيله بعد التغيير: README404؛ demo6×200 بأوصاف وغير مفهرسة. [الدليل](evidence/after/fixed-routes.json).
- راجع [سجل البناء](evidence/after/build.log)، [اختبارات الحارس](evidence/after/unit.log)، [فاحص المشروع](evidence/after/route-check.log).

## المتبقي وحدود التسليم

لم ننشر ولم نغير DNS/Render/Cloudflare أو GSC submissions، ولم ننفذ redirects جديدة للصفحات القديمة بلا خريطة محتوى. يحتاج إغلاق F01–F04/F10 نشرًا تشغيليًا معتمدًا ومراجعة بقايا المحتوى القديم ثم إعادة GET وفحص Google بعد الزحف. ملف `render.yaml` الحالي يصف Node ويشغل `npm start` بالفعل؛ تغيير الكود وحده لا يثبت تطبيقه على الأصل الحي.

معلومات اعتماد المؤلف والمراجع وقلة المحتوى تحتاج أدلة وقرارات تحريرية، ولا تعالج باختلاق خبرات أو حشو نص. لم تُجر رحلة مستخدم مصادق أو مراجعة قانونية أو فحص rich-results خارجي أو Core Web Vitals، وهي ليست جزءًا مثبتًا من هذا التدقيق. **PASS ≠ RELEASED**.
