## [2026-11-08] — ملف LLMs فعلي و20 مقال معرفة جديد
### تم التنفيذ
- بناءً على توضيح المالك، كُتبت المقالات العشرون التي كانت قيد الإعداد؛ مصدرها `src/data/knowledge-guides.ts`، وتُعرض عبر `knowledge/[article].astro` بمصادر أولية وأمثلة افتراضية وجداول وFAQ وروابط فعلية.
- المعرفة الحالية 32 مقالًا، والمسارات العامة 56 منها 55 في sitemap. كل المقالات ظاهرة في HTML مركز المعرفة وقابلة للبحث؛ استُعيد 45 رابطًا سياقيًا، وصار جدول التحويلات 117 تحويلًا.
- `public/llms.txt` ملف فعلي يتجدد أثناء البناء ويطابق نسخة dist ويضم الـ55 صفحة. لم تُنشر الوثائق الداخلية أو مسارات البوابة والمصادقة أو المحاكاة noindex.
- عُدّلت أعداد Registry وImplementation Register وMaster Context. التنبيهات التخصصية السابقة باقية؛ لا ادعاء اعتماد قانوني/طبي أو نشر فعلي.
### الملفات المتأثرة
- `src/data/{knowledge-guides,knowledge}.ts`, `src/pages/knowledge/[article].astro`, `src/server/knowledge/catalog.ts`, `public/llms.txt`, `redirects.json`, `scripts/{seo-build,verify-routes}.mjs` ومقالات الروابط السابقة.
- الدليل والقائمة والمصادر: `Audit/knowledge-publication-2026-11-08/{REPORT.md,articles.json}`. نُقلت تقارير SEO السابقة بواسطة عمل آخر إلى `Audit/outhers/seo-saudi-2026-11-08/` وحُفظ هذا النقل.
### التحقق
- Build: PASS؛ فحص HTTP النهائي: 55 صفحة، 32 مقالًا، 2880 مرجعًا، 117 تحويلًا/234 GET-HEAD، صفر روابط مكسورة أو صفحات معزولة؛ تطابق الكتالوج وllms مع المخرجات PASS. بحث المعرفة 3 PASS؛ diff/صياغة JS PASS.
- Playwright لعينة المقال الجديد عند 360/1440: لا تجاوز أفقي وجدول قابل للتركيز؛ البحث عن Shadow يظهر المقال الصحيح. لا تدقيق وصول شامل أو اعتماد تخصصي.
### النتيجة
- **الحالة:** اكتملت الكتابة والتجهيز التقني محليًا؛ النشر والاعتماد التخصصي NOT PERFORMED. لا commit/push/deploy أو تعديل بيئة/قاعدة بيانات. الفهرسة والنقرات والاستشهادات بعد النشر NOT MEASURED.

## [2026-11-08] — تحسين SEO السعودي وتغطية الصفحات والتحويلات
### تم التنفيذ
- تحقق البناء من كل الصفحات العامة الـ35 في sitemap، وأصبح `scripts/seo-build.mjs` يطابق الخريطة بالـHTML الفعلي ويولد `llms.txt` بنفس الصفحات دون المصادقة أو البوابة أو المحاكاة غير المفهرسة.
- استُكمل `redirects.json` إلى 77 تحويلًا؛ عقد التشغيل الحالي `npm start` → `scripts/server.mjs` لتطبيق 301 قبل الملفات الثابتة. تشغيل `dist/server/entry.mjs` مباشرة لا يطبق هذه الطبقة؛ المهايئ ما زال standalone.
- عولج 58 رابطًا إلى 20 مقالًا غير موجود (49 وصلة نصية أزيلت مع إبقاء النص، و9 بطاقات أعيد ربطها بمحتوى موجود)، وحُسنت metadata للمنتجات والقطاعات للسوق السعودي مع إبقاء المنتجات مخططة.
- تقرير GA4 المرفق: 111 مشاهدة لعنوان 404 و7 جلسات بحث عضوي و26 مستخدمًا نشطًا من السعودية؛ لا نقرات GSC أو CTR أو ترتيب كلمات. Ahrefs: BLOCKED — Insufficient plan.
### الملفات المتأثرة
- `astro.config.mjs`, `redirects.json`, `package.json`, `scripts/{seo-build,server,verify-routes}.mjs`, `src/server/seo/redirects.mjs`؛ صفحات المعرفة والمنتجات والقطاعات.
- الدليل والتغطية: `Audit/seo-saudi-2026-11-08/REPORT.md` و`public-pages.json`؛ تحديث عقد التشغيل في `docs/APP-PORTAL-RUNTIME-HANDOFF.md`.
### التحقق
- Build وdiff وصياغة JS: PASS؛ تغطية 35 صفحة و77 تحويلًا، 154 GET/HEAD، 1767 مرجعًا، صفر روابط مكسورة/صفحات معزولة؛ اختبارات بحث المعرفة 3 PASS.
- Playwright للمقال المتأثر عند 360/1440: لا تجاوز أفقي؛ البوابة بقيت 503/noindex/no-store. المنشور: `.html` للمقال الرئيسي ما زال 404 و`llms.txt` قديم بتاريخ 2026-09-03؛ هذه لقطة قبل النشر.
### النتيجة
- **الحالة:** DONE محليًا؛ الإنتاج NOT DEPLOYED. تحسن النقرات والترتيب والاستشهادات NOT MEASURED؛ يلزم نشر المالك والتحقق من CDN وGSC. لا commit/push/deploy أو تعديل بيئة/قاعدة بيانات.

## [2026-11-08] — حفظ مساحة الأمان لمؤشر الفهرس على الجوال
### تم التنفيذ
- استعاد موضع `section-compass` الثابت إزاحة `safe-area` داخل قاعدة `max-width:650px` بدل أن تُسقطها قاعدة الجوال الأضيق.
- بقيت البنية والنصوص والروابط والهيدر والهيرو والشعار دون تغيير.
- 21st أعاد نمط `Dashboard Sidebar` (14941)؛ لم يُنقل مكوّن React لأن الحالة تخص مؤشر قراءة في موقع عام. Lazyweb أعاد `Tool lazyweb_search not found`، ولم يتوفر Figma fileKey ملائم أو MCP لـMade Good Designs.
### الملفات المتأثرة
- `src/styles/interior.css`
### التحقق
- `git diff --check`: PASS. فحص المصدر يؤكد أن قاعدة 650px تحفظ `env(safe-area-inset-bottom)`؛ المعاينة المحلية: BLOCKED — `astro dev` فشل في فتح `127.0.0.1:4338` بسبب `listen EPERM`. لقطة الموقع المنشور للمعرفة على 390×844 لا تمثل التغيير المحلي.
- Build والاختبارات: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** PARTIAL — إصلاح CSS محلي، دون تحقق مرئي بعد التعديل.
### ملاحظات / مشاكل مفتوحة
- لم تتوفر معاينة محلية بعد التغيير؛ لم يُنشر أو يُرفع أي شيء.

## [2026-11-08] — توضيح حالات Ledger وHuman Gate
### تم التنفيذ
- رُبطت شارات Human Gate بحالة الطلب القادمة من الخادم؛ الانتظار كهرماني والاعتماد البنفسجي والتنفيذ الأخضر، مع بقاء نص الحالة ومسار القرار كما هما.
- أضيف تمييز بصري لحالة سلامة كل حدث في جدول Ledger بحسب القيمة الفعلية، ويظهر `UNVERIFIED` تحذيريًا دون استنتاج نجاح.
- لُوّنت رسائل Firewall حسب حالة الخطأ أو التحميل الناجح؛ لم تتغير قواعد السياسة أو API أو الخدمات.
- المراجع: 21st `Audit Log Table` (29266) و`Approval Card` (36498). Figma بلا ملف BRIGHT AI محدد؛ Lazyweb tool غير متاح (`Tool lazyweb_search not found`)؛ Made Good Designs غير معروضة في الجلسة.
### الملفات المتأثرة
- `src/scripts/human-gate.ts`, `src/scripts/ledger.ts`
- `src/styles/human-gate.css`, `src/styles/ledger.css`, `src/styles/firewall.css`
### التحقق
- `git diff --check`: PASS. Playwright المحلي على 390px مع بيانات اصطناعية مؤقتة: لا تجاوز لعرض الصفحة؛ حالة `UNVERIFIED` ظلت داخل منطقة تمرير الجدول، وتباينت شارات الطلب حسب قيم الحالة.
- Chrome DevTools: BLOCKED لأن ملف المتصفح مشغول؛ استُخدم Playwright للمعاينة. لا تسجيل دخول أو API actions أو بيانات فعلية. Build والاختبارات: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** PARTIAL — صقل واجهة محلي، دون تحقق من حالات مستخدم موثقة/خلفية أو من المتصفح الأساسي.
### ملاحظات / مشاكل مفتوحة
- الوصول إلى بيانات المؤسسة الفعلية لم يُستخدم ولم يُتحقق؛ معاينة الحالات المحمية كانت اصطناعية فقط.

## [2026-11-08] — تحسين Shell مساحة العمل ونماذج Auth
### تم التنفيذ
- أضيف عنوان الصفحة الحالية في شريط App، وصار مؤشر التنقل النشط يستخدم حدًا منطقيًا مناسبًا لـRTL؛ الروابط والشعار والهيدر العام وHero وConstellation لم تتغير.
- وجّه التسجيل والدخول التركيز لأول حقل غير صالح، وأظهر حالة بدء التحقق من الجلسة.
- منع قبول الدعوة من تكرار الإجراء أثناء الطلب مع توضيح حالة الانشغال؛ بقي التحقق الخادمي وNeon Auth وRBAC كما هي.
- المرجع: 21st `Dashboard Shell` (43212) لهرمية shell وحالة التنقل؛ Figma لا fileKey؛ Lazyweb استدعى الاسم لكن الخادم أعاد `Tool lazyweb_search not found`؛ Chrome العام `/app/` = 404 والمحلي حُجب بـ`listen EPERM`؛ Made Good Designs غير متاح.
### الملفات المتأثرة
- `src/layouts/AppLayout.astro`, `src/styles/kernel.css`, `src/pages/auth/sign-up.astro`, `src/pages/auth/accept-invitation.astro`, `src/scripts/kernel.ts`
### التحقق
- `git diff --check`: PASS. Build/tests: NOT RUN حسب الطلب. المعاينة المحلية بعد التعديل: BLOCKED بسبب منع فتح المنفذ.
### النتيجة
- **الحالة:** PARTIAL — تعديل محلي؛ تحقق الواجهة بالمتصفح غير متاح.
### ملاحظات / مشاكل مفتوحة
- لم تُثبت إتاحة `/app/*` في الإنتاج؛ لم يُنفذ تسجيل دخول أو إجراء دعوة.

## [2026-11-08] — صقل صفحات الثقة والتسعير والتواصل والقانونية
### تم التنفيذ
- حسّن `pages.css` التدرج البصري للصفحات التعريفية، وربط تعريف مؤسسة مُشرقة وBRIGHT AI بمنظومة AIGAS بصريًا دون تعديل المحتوى.
- أعاد تدفق صفوف جدول الثقة على الجوال، وصقل مقارنة السعر/التجربة ووضوح حدود الحقول والتركيز؛ بقي `mailto` كما هو.
- حسّن مقياس قراءة الخصوصية والشروط دون تغيير نص قانوني، وأبرز 404 ومسارات الرجوع الموجودة.
- مرجع 21st: `Feature Comparison Table` (21218)؛ لم تُنقل بنية React أو أسعار. Figma بلا ملف مشروع متاح؛ تعذر Lazyweb وChrome DevTools؛ Made Good Designs غير متاح.
### الملفات المتأثرة
- `src/styles/pages.css`
### التحقق
- `git diff --check`: PASS بعد إصلاح ترتيب السجل؛ الهيدر وHero و`Constellation` والصفحات الأخرى لم تتغير.
- المعاينة المرئية وBuild والاختبارات: NOT RUN؛ خادم التطوير المحلي حُجب بـ`listen EPERM`، وتعذر Chrome DevTools.
### النتيجة
- **الحالة:** PARTIAL — التغييرات محلية، والسلوك المرئي لم يُتحقق منه بالمتصفح.
### ملاحظات / مشاكل مفتوحة
- لم يُفحص فرق النشر؛ لا commit/push/deploy.

## [2026-11-08] — صقل مركز المعرفة والقارئ
### تم التنفيذ
- ضُغطت مجموعة فلاتر المنتجات على الجوال، ونُقلت التصنيفات من تمرير داخلي إلى تمرير الصفحة عند قصر ارتفاع العرض؛ بقيت المدخلات والروابط والنصوص والكتالوج كما هي.
- تحسّن الفصل البصري بين نوع المقال وإجراءاته ومعاينته، وأضيف تفاعل بصري لبطاقات الأدلة المرتبطة.
- المراجع: 21st `Table of Content` (22596) و`Table of Contents` (appica-dev، 34517)؛ Lazyweb لقطة GitHub `Ebooks & Whitepapers`. Figma بلا `fileKey` متاح؛ Made Good Designs غير متاح في الأدوات.
### الملفات المتأثرة
- `src/styles/knowledge-center.css`, `src/styles/knowledge-reader.css`
### التحقق
- Chrome محلي 1440×768 و390 و320: بلا تجاوز أفقي؛ تمرير التصنيفات داخليًا أُزيل عند ارتفاع 768؛ فتح المعاينة على 390 بقي ضمن التدفق. ارتفاع أدوات البحث/الفلاتر 552→485px على 390 و652→583px على 320. مقالة `/knowledge/ai-governance-saudi/` عرضت 3 روابط ذات صلة وعملت حالتها المرئية.
- Chrome للموقع المنشور: `/docs/` ظل بارتفاع 552px عند 390؛ التغيير محلي وغير منشور. `git diff --check`: PASS. Build/tests: NOT RUN حسب الطلب.
### النتيجة
- **الحالة:** DONE محليًا؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- Lazyweb `lazyweb_search` غير موجود، وسجل الشاشة عبر بديله يحتاج ترقية؛ استُخدمت لقطة عامة متاحة. لم يتوفر ملف BRIGHT AI في Figma ولا خادم Made Good Designs في هذه الجلسة.
- خادم التطوير أظهر تحذير `Astro.request.headers` عند prerender لـ`/docs/` ومقال المعرفة؛ لم يُبحث لأنه خارج تعديل CSS.

## [2026-11-08] — صقل التعليم والرسوم التفاعلية للصفحات الداخلية
### تم التنفيذ
- أضيفت وسوم `Educational` للمحاكاة والرسوم والمسارات التعليمية، و`Planned` لمجموعة المنتجات المرتبطة في التصور؛ لم تعرض أي حالة تشغيلية متحققة لعدم وجود دليل تشغيلي.
- رُبطت أرقام عقد `SectorDiagram` بصفوف الأسئلة، وصارت المرحلة المفتوحة تبرز مسارها بصريًا؛ بقيت الرسوم توضيحية وبدون اتصال تشغيلي.
- تحسنت قراءة رموز الأركان وتدفق موضوعات الاستفسار بخطوات مرقمة، مع إبقاء النصوص والأقسام وترتيبها ووظائفها.
- مراجع: 21st `Timeline-02` (بنية نقاط رأسية واضحة)؛ Figma لا ملف BRIGHTAI محدد؛ Lazyweb تعذر (`lazyweb_search` غير موجود في السيرفر)؛ Made Good Designs غير متاح.
### الملفات المتأثرة
- `src/pages/kernel.astro`, `src/pages/pillars/[pillar].astro`, `src/pages/solutions/[sector].astro`, `src/pages/services.astro`
- `src/components/PageMotionStudy.astro`, `src/components/SectorDiagram.astro`, `src/styles/interior-motion.css`
### التحقق
- Chrome محلي 320/390/1440 على الخدمات والأركان والقطاعات وKernel: `scrollWidth == innerWidth`؛ بقاء أعداد الأقسام؛ فتح تفاصيل القطاع أبرز المسار والعقد المطابقة.
- `git diff --check`: PASS. build/tests/النشر: NOT RUN بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- خادم dev أصدر تحذير `Astro.request.headers` مع صفحات prerendered؛ الاستجابات كانت 200 والتحذير خارج ملفات الواجهة المعدلة.

## [2026-11-03] — صقل أقسام الرئيسية: حوكمة، مشكلة، ركائز، خطوات، بطاقات
### تم التنفيذ
- `governance-statement`: رُفع حد الشفافية من `.1` إلى `.72` فبقيت العبارة الثانية مقروءة أثناء التمرير بدل أن تختفي، وأصبح التشديد الكهرماني بوزن 600 مع `text-wrap: balance`؛ العبارتان والنص والتتابع كما هما.
- `#problem .problem-copy`: النص على `--color-text-copy`، CTA أبيض بسهم كهرماني، وحد داخلي علوي؛ مواضع العمودين والسهم لم تتغير.
- `#principles .pillar`: إطار 1px `--border-strong` وradius 12، حلقة focus كهرمانية عبر `:focus-within`، أيقونة `clamp(96px,8.6vw,124px)`، رقم الركن على نفس السطر البصري، وشرطة قصيرة قبل الملاحظة، وسهم CTA كهرماني.
- `#how-it-works .steps`: أرقام دائرية 34px (28px على 390) بوزن 600، وأسهم 18px بلا إطار متمركزة تحت الرقم، واتجاه التدرج صار 260deg لـRTL؛ لا خطوة جديدة ولا تغيير نص.
- `home-products`/`#solutions`: radius 12 موحد، نص الوصف على `--color-text-copy`، ودفعة 3px لأسهم الروابط على hover/focus فقط؛ الترتيب والمصفوفة لم يتغيرا.
- `site.css`/`experience.css`/`pages.css`/`ProductIcon.astro` لم تُعدّل: الأولى مشتركة وقد تمس الهيدر/الهيرو، والأخيرة غير مستخدمة في الرئيسية.
- مراجع: 21st `How It Works Timeline` (أرقام دائرية وتسلسل)؛ Lazyweb `OpenAI Frontier` و`Zscaler Risk360` (هرمية بطاقات المنتج)؛ MGD `Harvard Bridge Plaque` (وزن/تباين العنوان التحريري)؛ Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المستودع.
### الملفات المتأثرة
- `src/pages/index.astro`
### التحقق
- Chrome محلي (dev 4331) 1440/1024/390/320: `scrollWidth == innerWidth`، console بلا أخطاء؛ focus على رابط الركن يعطي `rgb(255,184,41)` وحدًا داخليًا؛ hover القطاع `translateY(-2px)` والسهم `translateX(-3px)`؛ reduced-motion: `animation:none` و`0s` وشفافية 1.
- الهيرو/الهيدر محفوظان: H1 100px@1440 و54px@390، زر الهيرو radius 24 و`0.2s`، header 108/160. `git diff --check`: PASS. build/tests/نشر: NOT RUN بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- لا توجد حالة تعلّم مرتبطة بالتمرير في الخطوات؛ لذلك لم يُغيَّر توقيت حالة غير موجودة. لقطات المقارنة أُزيلت بعد الفحص (ملفات مؤقتة).

## [2026-11-03] — فهرس الأقسام على الجوال: فتح/إغلاق آمن، وحذف الفهرس المكرر
### تم التنفيذ
- `section-compass` لم يعد يُثبَّت في نهاية المستند على الجوال؛ صار كشفًا ثابتًا أسفل الحافة (`position:fixed` + `env(safe-area-inset-bottom)`) بارتفاع لوحة `min(50svh,320px)`، ويُغلق بـEscape أو لمس خارجي أو اختيار رابط، مع حلقة تركيز على `summary`.
- منع تغطية CTA: مراقب واحد يخفي الفهرس حين يدخل أي `.button` داخل الشريط السفلي (96px)، ويبقى ظاهرًا إن كان التركيز داخله؛ و`footerInView` بديل عن إخفاء `hidden` المباشر.
- حذف الفهرس المكرر من `/privacy/` و`/terms/`: الشرط صار `!reading`، فلم تعد الصفحات التي تملك `document-toc` تحمل compass ثانيًا (و`docs`/`knowledge` كما كانت).
- `document-toc` صار فهرسًا مقروءًا على سطح المكتب (روابط inline بدل تفاصيل مطوية دائمًا) وكشفًا واحدًا على الجوال عبر `data-document-toc`؛ والضغط على الرابط ينقل التركيز للعنوان ويغلق الكشف على الهواتف.
- `:target` صار واضحًا (تسطير كهرماني) وحلقة تركيز على العناوين القابلة للتركيز، و`scroll-margin-block-start` صار `clamp(24px,4vh,56px)`؛ ووُحّد مؤشر القسم الحالي على الكهرماني في Compass وdocument-toc و`KnowledgeReader` (بدل البنفسجي هناك).
- فواصل Breadcrumb صارت `aria-hidden` بدل نص «/» يُقرأ لقارئ الشاشة. لم تُلمس الهيدر/الهيرو/Constellation/النصوص/الترتيب.
- مراجع: 21st `Table of Contents` (appica-dev، scroll-spy يبرز العنوان الظاهر — الاسترجاع التفصيلي وصل حد الخطة)؛ Lazyweb `notion`/`arista-networks` سطح مكتب و`confluence` جوال (عنوان + وقت قراءة ثم فهرس مختصر)؛ MGD `Church Historical Sign` لوزن الفواصل؛ Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المستودع.
### الملفات المتأثرة
- `src/components/PageShell.astro`, `src/components/InteriorController.astro`, `src/styles/interior.css`, `src/styles/knowledge-reader.css`
### التحقق
- Chrome محلي (dev 4331) بمقاسات 320/360/390/1440: compass ثابت 184px على الجوال ولا تجاوز أفقي في 10 مسارات، ويختفي عند CTA (قيس `hidden=true` عند تداخل الزر)، وEnter/Escape يعملان ويعيدان التركيز؛ `/privacy/` بلا compass وبلا TOC مطوي على سطح المكتب؛ النقر يعطي `#document-heading-3` + underline + تركيز؛ active في `/knowledge/..` كهرماني `rgb(255,184,41)`. console: بلا أخطاء.
- `git diff --check`: PASS. build/lint/typecheck/tests/نشر: NOT RUN بطلب الدفعة؛ لا commit/push.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED.
### ملاحظات / مشاكل مفتوحة
- `knowledge-center.css` لم يُعدّل: لا تداخل `sticky` فعلي في `/docs/` ولا حاجة لتغيير (الترويسة غير مثبتة أصلًا).
- على الجوال قد يظهر الفهرس فوق زاوية بطاقة أثناء التمرير (طبقة عائمة مقصودة)؛ لا يغطي زرًا أو نصًا، ويختفي عند CTA/الفوتر.


## [2026-11-03] — خريطة النظام: تتبّع مسار واحد، بديل نصي، وإصلاح أزرار ghost
### تم التنفيذ
- `SystemMap`: أُضيف `pathLength="1"` فصارت الأسلاك خطوطًا متصلة بدل نمط 100px؛ عند hover/focus تُرسم وصلة المنتج المختار وحدها خلال 700ms (داخل 550–900) ثم تستقر، وتخفت الأربع الأخرى إلى `.26` مع بقاء أسماء كل العقد. أُبطلت حركة `draw-route` الجماعية على أي hover عبر تجاوز بخصوصية أعلى في `interior-motion.css` (بدون تعديل `experience.css`).
- أُضيف بديل نصي `<ul class="map-index">` بخمسة روابط (44px) داخل الشكل، ويعمل أيضًا كوسيلة إيضاح لأن JS الحالي يقرأ أي رابط `/products/` ويضيء وصلته. صُحّح انزياح bidi للأرقام والأسماء اللاتينية بـ`text-align:end` فأصبحت على حافة قراءة البطاقة.
- 320px: صف الرقم أصبح inline مع العنوان وأُزيل تزاحم بطاقتي Secure Chat/Ledger مع نواة AIGAS Kernel؛ لا تجاوز أفقي ولا نص مقصوص.
- `button.ghost` في `KernelSequence` و`RedactionDemo` كان يعرض chrome المتصفح الرمادي (لا خلفية/حد من `.ghost`)؛ عولج محليًا في نطاق `interior-motion.css` فقط.
- `DecisionCircuit`: عند اختيار قرار تخفت المسارات الأربعة الأخرى إلى `.3` فيُقرأ المسار المختار وحده دون تغيير المنطق أو النصوص.
- متروك بقصد: خريطتا Decision Journey في `/kernel/` وKnowledge Connections في `/docs/` — الأولى تكرر K1–K4 القائمة في `KernelSequence`، والثانية تكرر فهرس الأدلة ومساحة المنتجات القائمين؛ شرط الدفعة يمنع القسم المكرر.
### الملفات المتأثرة
- `src/components/SystemMap.astro`, `src/styles/interior-motion.css`
### التحقق
- Chrome محلي (dev 4331) على `/products/` و`/products/firewall/` و`/kernel/` و`/pillars/privacy/` بمقاسات 1440 و390 و320: لا تجاوز أفقي ولا أخطاء console؛ hover/focus يضيء سلكًا واحدًا 700ms والبقية `.26`؛ reduced-motion يعطي `animation:none` و`0s`؛ زر ghost صار 48px بحد `--ui-line` بدل الرمادي الأصلي.
- `git diff --check`: PASS. build/lint/tests/نشر وFigma: NOT RUN / NOT APPLICABLE بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- سطر نواة الخريطة الفرعي بقي 9px على الجوال: أي زيادة إلى 10.5px تجعله أوسع من الفراغ بين بطاقتي 05 و02 فيُرسم تحتهما.
- `docs/` و`kernel/` لم يُضف إليهما قسم جديد للأسباب أعلاه.

## [2026-11-03] — ترشيد حركة الصفحات الداخلية وعزل عنوان الهيرو عن قاعدة h1 العامة
### تم التنفيذ
- أُزيلت قاعدة `h1 { animation: title-in }` العامة من `experience.css` مع keyframeها؛ الفحص أثبت أنها كانت بلا أثر فعلي (`.interior-page h1` تمنعها و`.hero h1` تتجاوزها) وكانت خطرًا على الهيرو عند إعادة ترتيب CSS. لا تغيير بصري في الهيرو/الهيدر.
- كشف حركة العنوان في `interior-motion.ts` فقد كان `clipPath: inset(0 0 20% 0)` يقص ذيول الحروف العربية 480ms؛ صارت `title` = opacity .88 + translateY(6px) بلا قص، و`rise` 12→8px، والرسم 800→700ms مع stagger ≤200ms (السقف 900ms).
- حُذف نبض `.map-core` (900ms) لأنه زخرفة تنافس رسم الأسلاك في المنطقة نفسها؛ بقي ظهور اللوحة + draw واحد.
- `MotionController` صار one-way: مجموعة `pending` تُفرغ بعد أول ظهور، فتبديل `prefers-reduced-motion` لا يعيد تشغيل الصفحة، و`settle()` يوقف المراقب نهائيًا.
- جُمّعت استجابة أزرار قرار Firewall في مالك واحد داخل `interior-motion.ts` (state + label + نتيجة + packet) وأُزيلت النسخة المكررة و`animate` من `InteriorController`.
- وُحّدت مدة `.sequence-stages` و`.lock-shackle` و`.ghost` و`.map-path` على `--ui-fast/--ui-state` بدل 160/220ms مكتوبة.
- مراجع: 21st `Underline Tabs` (المؤشر يحمل الحالة والمحتوى ثابت)؛ Lazyweb `campsite`/`chameleon`/`appcues` (feedback عند نقطة الإجراء لا احتفال ملء الشاشة)؛ MGD لا مرجع Motion فعلي ⇒ اعتُمد مبدأ الهرمية الساكنة (Church Historical Sign). Figma NOT APPLICABLE — لا fileKey/رابط BRIGHT AI في المصدر.
### الملفات المتأثرة
- `src/styles/experience.css`, `src/styles/interior-motion.css`, `src/components/MotionController.astro`, `src/components/InteriorController.astro`, `src/scripts/interior-motion.ts`
### التحقق
- Chrome محلي (dev 4331) 1440/390/320 على `/`, `/products/`, `/products/firewall/`, `/kernel/`, `/docs/`: بلا تجاوز أفقي وبلا أخطاء console؛ إطارات عنوان الداخل بلا `clipPath`؛ تقليل الحركة = 0 WAAPI وopacity 1 مع بقاء التفاعل يعمل؛ الهيرو كما هو (h1 animation none، radius 24، 0.2s، header 108px)؛ `git diff --check`: PASS.
- build/lint/typecheck/tests/نشر: NOT RUN بطلب الدفعة. تغيير التفضيل الحي لم يُرصد عبر CDP لأن emulation لا يطلق `MediaQueryList.change`؛ مسار `settle` مُتحقق مصدريًا فقط.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- تُرك hover `.catalog-row` بتغيّر `padding-inline` (reflow) لأنه قرار تصميمي خارج نطاق الدفعة؛ و`InteriorMotion.astro` بلا تعديل لأن init/teardown الحالي متوازن.
- `/auth/*` فقدت ارتفاع العنوان 10px بعد إزالة قاعدة h1 العامة؛ لا أثر على الهيرو أو المحتوى.

## [2026-11-03] — توحيد أيقونات المنتج/المعرفة وحالات الأسطح والأزرار في صفحات الداخل
### تم التنفيذ
- وُحّد الرمز البصري: `ProductIcon` و`KnowledgeIcon` على شبكة 24 و`vector-effect="non-scaling-stroke"` بعرض 1.6px، فبقي السطر نفسه عند 24 و34 و46px بدل أن يثقل مع التكبير؛ `KnowledgeIcon` صار يقبل 16/20/24/32 و`label` اختياريًا. لم يُستخدم درع العلامة كأيقونة قسم.
- صُقلت أسطح البطاقات: بطاقات التسويق ثابتة بلا Hover، ولا تتجاوب إلا البطاقات/الصفوف التي تحتوي رابطًا فعليًا أو زرًا ممكنًا (`catalog-row`, `map-node`, `product-card`). وُحّدت نصف الأقطار على رموز `radius-*` القائمة وأضيف حد داخلي هادئ.
- الأزرار: Primary/Secondary/Ghost على ارتفاع ولمسة تركيز متسقة، ومُنع hover/transform على المعطّل؛ تظهر حالات kernel غير المهيأة (dashed + نص) منفصلة عن الفشل الأحمر، وأضيفت أشكال صغيرة (دائرة/معيّن/مربع) لحالات `health-state` و`availability` و`connection` حتى لا يكون اللون وحده دلالة.
- Knowledge Center: أُوقف Hover على الأزرار المعطّلة أثناء التحميل/غياب JS، ورُفع زر المسح إلى 44px، ووُحّدت radii وفواصل الحالة، وأضيف مؤشر جهة لـ`kc-product-status`. النصوص والروابط والترتيب لم تتغير.
- MCP: 21st `Button` (originui) + `Multi state badge` + `Base Input` (variants/focus/disabled)؛ Lazyweb `eeye-digital-security` (Cybersecurity dashboard: حالة أعلى الشاشة ثم تفاصيل)؛ MGD `check` (Heroicons/Lucide، 24 grid، round caps)؛ Figma متصل لكن لا fileKey/رابط BRIGHT AI في المصدر ⇒ NOT APPLICABLE. لم يُنشأ تصميم خارجي.
### الملفات المتأثرة
- `src/components/ProductIcon.astro`, `src/components/KnowledgeIcon.astro`
- `src/styles/interior.css`, `src/styles/pages.css`, `src/styles/knowledge-center.css`, `src/styles/kernel.css`
### التحقق
- Chrome محلي (dev 4399): `/products/`, `/products/firewall/`, `/docs/`, `/pricing/`, `/app/kernel/` عند 1440 و390 و320: لا تجاوز أفقي، لا خطأ CSS، الأيقونة 34px بسماكة 1.6، ghost 44px وحلقة تركيز 2px كهرمانية، reduced-motion = 0s. حالة البحث الفارغة تعمل بأيقونة ونص. لقطات بعد التعديل فقط؛ baseline قبل التعديل NOT CAPTURED، والمقارنة مع الإنتاج NOT RUN.
- `git diff --check`: PASS. build/lint/tests/اختبارات آلية/نشر: NOT RUN حسب طلب الدفعة. `504 Outdated Optimize Dep` ظهر من Vite بعد HMR وليس خطأ صفحة (كل المسارات 200).
### النتيجة
- **الحالة:** DONE محليًا للصفحات المتاحة؛ NOT_RUNTIME_VERIFIED. لا commit/push/deploy ولا تغيير Neon/GitHub. `PageShell` بلا تعديل لأن أي تغيير فيه قد يمس فروض الصفحة المشتركة دون حاجة.
### ملاحظات / مشاكل مفتوحة
- الفحص البصري عيّنة لا تغطية لكل تركيبات الحالات؛ حالات `error/success` الحقيقية تحتاج بيانات تشغيل لا تتوفر محليًا. بناء الإنتاج نفسه NOT RUN.


## [2026-11-03] — توحيد رموز الحركة والقراءة العربية في CSS العام
### تم التنفيذ
- أصبح `variables.css` المصدر الوحيد للحركة/السهولة و`theme.css` نقطة استيراد بلا تعريفات (أُزيل تكرار radius وinterior aliases). أُضيفت `--color-text-copy`, `--motion-hover:140ms`, `--motion-state:220ms`, `--transition-control`، و`--radius-system: var(--radius-control)`.
- حُذفت رموز النوع/الزوايا الميتة غير المستخدمة (`--text-heading*`, `--leading-heading*`, `--text-display`, `--radius-nav/cards/tags`, `--font-ppneuemontreal`) بعد التأكد من صفر استدعاءات.
- القراءة: `.page .lead` وinterior copy على alias واحد؛ `.interior-page .note` 14→15px؛ caption الخريطة وfigcaption/map-status 11→12px؛ استُبدل 15 تكرار `#bdbdbd` في `interior.css` بـ`--color-text-muted` دون تغيير القيمة.
- العزل: `unicode-bidi: isolate` لـ`.latin` وأرقام/IDs/عناوين المنتجات اللاتينية؛ لا تقسيم حروف ولا تتبع سالب. حركة الأزرار 220→140ms عبر `--transition-control`، والهيرو محفوظ بـ`0.2s` وradius 24.
- مراجع: 21st (Typography primitives: hierarchy = size/weight/space)؛ Lazyweb (Basedash dark dashboard: surface/border hierarchy)؛ MGD (Neon Arabic Poster, Duo Security brand guidelines للتباين)؛ Figma NOT APPLICABLE — لا fileKey/رابط تصميم في المستودع.
### الملفات المتأثرة
- `src/styles/{variables,theme,site,experience,interior}.css`, `src/styles/tokens.json`.
### التحقق
- `tokens.json` JSON صالح و`git diff --check`: PASS. Chrome محلي 1440/390/320 على `/`, `/products/`, `/products/firewall/`, `/docs/`: لا تجاوز أفقي؛ الهيرو/الهيدر/Constellation بلا تغيير (H1 54px@390، زر Hero radius 24 و0.2s)؛ reduced-motion يعطي 0ms. build/tests/نشر: NOT RUN بطلب الدفعة.
### النتيجة
- **الحالة:** DONE محليًا — NOT_RUNTIME_VERIFIED؛ لا commit/push/deploy.
### ملاحظات / مشاكل مفتوحة
- `docs/BRAND-AND-DESIGN-SYSTEM.md` يذكر تضارب radius قديم لم يعد قائمًا؛ تحديثه يحتاج دفعة توثيق منفصلة. الفحص البصري عيّنة لا تغطية شاملة.

## [2026-11-03] — جرد UI محمي وتحسين دلالي محدود لفهرس المنتجات
### تم التنفيذ
- أضيف `ui_batch_baseline` إلى Registry: توسيع 5 منتجات/4 قطاعات/3 أركان و12 مقالاً، ملكية CSS والمكونات المشتركة، وترتيب أقسام الصفحات الأربع وحدود التجميد للدفعات التالية. صُحح عداد ملفات API في السجل إلى 29؛ لا تغيير API.
- رُبط قسما الفهرس والتحقق في `products/index.astro` بعنوانيهما الحاليين عبر أربع سمات فقط؛ لا تغيير نصوص أو روابط أو CSS أو ترتيب أو هيدر/هيرو/شعار.
- مراجع Lazyweb: bettermode/services وGitbook؛ MGD: Architectural Blueprint Sheet (مطابقة جزئية). Figma لم يعرض ملف مشروع أو رابطاً صالحاً للاكتشاف؛ لا تصميم خارجي أُنشئ.
### الملفات المتأثرة
- `src/pages/products/index.astro`, `docs/WEBSITE-PAGE-REGISTRY.yaml`, `.agents/mind/01-mind-latest.md`.
### التحقق
- YAML وdiff وفحص تطابق المصدر بعد استبعاد السمات الأربع: PASS. Chrome للعام والنسخة الحالية `/`, `/products/`, `/docs/`, `/contact/` عند 1440 و390 فعلياً: لا تجاوز أفقي بالعينة. مرجعَا العناوين موجودان وفريدان.
- المعاينة الحالية أُطلقت على 4322؛ عملية سابقة تشغل 4321 واستُبعدت من الدليل. resize إلى 390 أعطى 500 أولاً، ثم أُعيد بمحاكاة viewport مؤكدة 390.
- Build/tests وإرسال النماذج والنشر: NOT RUN. الجرد الدلالي التفصيلي لكل صفحة عامة و320px والوصول الشامل: NOT VERIFIED.
### النتيجة
- **الحالة:** PARTIAL للجرد الشامل؛ التحسين المحدود منفذ محلياً. لا commit/push/deploy أو تغيير خارجي.
## [2026-11-08] — Baseline release وTraceability للبوابة والمنتجات
### تم التنفيذ
- أُعيدت مراجعة HEAD الحالي `55cd41567d82439790acbd871f917905df89e78a` ومخطط Neon الحالي والمتصفح العام؛ لا تغيير كود منتج أو مورد خارجي.
- Neon production: 31 جدول AIGAS مع RLS، سياستان على جدولين فقط، 124 امتياز DML لـ`authenticated`، `neondb_owner` يتجاوز RLS، Data API نشط على `public`، ولا توجد سجلات في الجداول التشغيلية المفحوصة أو مستخدمون/جلسات Auth.
- فحص `/app/*` للصفحات السبع وHealth API أعاد 404؛ Origin وSHA المنشور غير معروفين. `0013` موجود جزئيًا دون chain guard، و`0015/0020/0021` لها أدلة مخطط؛ migrations الباقية مذكورة في سجل التتبع.
- أُعيد تجميع مرجع 15 prompt من النسخ المحلية المنفصلة؛ حُفظت النسخة المعدلة مسبقًا في مجلد التسليم كما هي.
### الملفات المتأثرة
- `Audit/outhers/RELEASE-TRACEABILITY-BASELINE-2026-11-08.md`, `Audit/outhers/ALL-15-OPENCODE-MCP-PROMPTS.md`
- `README.md`, `docs/MASTER-AGENT-CONTEXT.md`, `docs/CURRENT-IMPLEMENTATION-REGISTER.md`, `docs/RELEASE-BLOCKERS-REGISTER.md`, `docs/FINAL-RELEASE-HANDOFF.md`, `docs/DATA-ACCESS-AND-RLS.md`, `docs/APP-PORTAL-RUNTIME-HANDOFF.md`
### التحقق
- Neon read-only catalog/counts/config: PASS؛ public browser routes: 404 on all 8 URLs; local source + docs review: PASS.
- Build, tests, lint, migration, deployment: NOT RUN / NOT PERFORMED per scope.
### النتيجة
- **الحالة:** DONE — سجل محلي متسق ومؤرخ؛ إتاحة المنتج والعزل التشغيلي لا تزال BLOCKED/NOT VERIFIED.
### ملاحظات / مشاكل مفتوحة
- يلزم اعتماد مشغل النشر ومالك المنصة لتحديد Origin/نسخة النشر؛ مشغل Neon والأمن لمراجعة/تطبيق least privilege على staging؛ والمالك/الأمن/الخصوصية/القانوني لاعتماد المزودين وأي إتاحة beta.
