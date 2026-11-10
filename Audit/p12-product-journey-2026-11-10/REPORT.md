# P12 — ربط رحلة المنتجات RTL

2026-11-10، الرياض. HEAD `3374941afbb5a38ebfbfd39b586142dbe5a3b1ad` + تغييرات هذه المهمة المحلية؛ الفرع `main`. Node `22.22.2`، Astro standalone، Chrome headless. لا نشر أو commit أو كتابة خارجية أو قراءة أسرار. ظهر تعديل مستقل في `Audit/EXECUTION-PROMPTS.md` أثناء العمل؛ محفوظ دون مساس.

## نطاق التسليم

- **DONE LOCAL:** كتالوج المنتجات الخمسة وتفاصيلها ← دخول Kernel مع حفظ المنتج ← العودة إلى المنتج/الكتالوج/البوابة ← تواصل بشأن تقييم أو اشتراك مستقل. قائمة مسارات عامة مشتركة يستخدمها Core والتنقل؛ HTML بلا روابط متداخلة.
- **DONE LOCAL:** قائمة سماح دقيقة لـ`returnTo`، رفض الوجهات الخارجية/المشفرة/Auth/Kernel والاستعلامات، والعودة إلى منتج واحد فقط بعد رد Dashboard يؤكد المؤسسة و`enabled` والوجهة المطابقة. كل API يعيد فرض الهوية والعضوية والاستحقاق؛ روابط الواجهة لا تمنحها.
- **DONE LOCAL:** خصوصية Auth مثل App: `private, no-store` و`noindex` و`Vary`؛ دون إضافة تتبع. canonical وsitemap محفوظان، وllms أعيد توليده من أوصاف الصفحات.
- **توجيه المستخدم اللاحق:** الإضافات العامة محايدة، بلا شارات حالة إتاحة أو وعد «جرّب الآن». أزيلت شارات الإتاحة وعباراتها المباشرة من الكتالوج/وصف التفاصيل. لم تتغير بنية الهيدر والهيرو وConstellation وترتيب الأقسام؛ أزيلت عبارة الإتاحة من الفقرة الافتتاحية فقط استجابة للتصحيح. الشرح التعليمي للنطاق ورسائل رفض العمليات القائمة محفوظان.
- **PARTIAL:** ربط الدخول مثبت بوحدات الاختبار وتنقل الزائر؛ نجاح جلسة مخولة ورفض عضوية حقيقية من المتصفح لم يُختبرا هنا.
- **BLOCKED / NOT RUN:** رحلة Trial فعلية، الحصة والانتهاء والنتيجة والدليل بعد حفظ عملية حقيقية، ثم استلام طلب اشتراك فعلي. دورة P06-A موجودة بالمصدر؛ لا تفويض لتفعيل P06-B أو إنشاء مؤسسات/منح/حصص أو تطبيق migrations. لم نضف أرقام حصة أو نجاحًا أو إيصالًا وهميًا. تبقى نتائج العمليات وروابط أدلتها القائمة دون تغيير؛ لا يُعد فحص التنقل اختبارًا لها. P19/P20 وتحقق المنتج والاعتمادات متطلبات مستقلة.
- **NOT RUN:** التشغيل المنشور. لم يُستخدم سجل Render/Neon التاريخي كحكم حالي على الإتاحة، ولم يُفحص حساب إنتاج أو مزود AI.

## مصفوفة المسارات

`entry(slug)` = `/app/kernel/?returnTo=` ثم ترميز `/app/<slug>/`؛ لا بيانات حساسة في الاستعلام.

| صفحة المصدر | الرابط/الإجراء | الوجهة | شرط الدخول الفعلي | نتيجة الفحص |
|---|---|---|---|---|
| `/products/` | تفاصيل Firewall / دخول / تقييم | `/products/firewall/`، `entry(firewall)`، `/contact/?topic=…` | التفاصيل والتواصل عامان؛ العمليات تتحقق خادميًا | PASS محلي |
| `/products/` | تفاصيل Ledger / دخول / تقييم | `/products/ledger/`، `entry(ledger)`، `/contact/?topic=…` | كما سبق | PASS محلي |
| `/products/` | تفاصيل Human Gate / دخول / تقييم | `/products/human-gate/`، `entry(human-gate)`، `/contact/?topic=…` | كما سبق | PASS محلي |
| `/products/` | تفاصيل Risk Engine / دخول / تقييم | `/products/risk-engine/`، `entry(risk-engine)`، `/contact/?topic=…` | كما سبق | PASS محلي |
| `/products/` | تفاصيل Secure Chat / دخول / تقييم | `/products/secure-chat/`، `entry(secure-chat)`، `/contact/?topic=…` | كما سبق؛ الإرسال يفرض اعتماد النموذج والمزود أيضًا | PASS للتنقل محليًا |
| تفاصيل كل منتج | الدخول إلى مساحة المنتج | `entry(slug)` | Portal gate ثم Auth وعضوية واستحقاق/مخطط من الخادم | PASS للزائر والـselector؛ جلسة مخولة NOT RUN |
| Kernel | إنشاء حساب ثم متابعة | `/auth/sign-up/?returnTo=…` ثم Kernel ثم `/app/<slug>/?workspace=…` | allowlist قبل Auth، لا تحويل تلقائي عند إغلاق Portal، Dashboard مخول قبل وجهة المنتج | unit PASS؛ متصفح مخول NOT RUN |
| Kernel | فتح منتج من لوحة البوابة | `/app/<slug>/?workspace=…` | `href` الخادمي المسموح والمطابق | منطق العودة unit PASS؛ E2E مخول NOT RUN |
| `/app/<slug>/` | breadcrumbs والعودة | صفحة المنتج العامة، `/products/`، `/app/kernel/` | لا بيانات خاصة في رابط العودة العام | PASS بالنقر للخمسة |
| `/app/<slug>/` | الدخول بحسابك بعد انتهاء جلسة | `entry(slug)` | إعادة تحقق Auth وعضوية واستحقاق؛ لا loop | selector/reload/back PASS؛ انتهاء جلسة متصفح NOT RUN |
| تفاصيل/مساحة كل منتج | تواصل بشأن التقييم / طلب اشتراك مستقل | `/contact/?topic=…` | فتح صفحة التواصل فقط؛ mailto لا يثبت إرسالًا أو استلامًا | PASS للوجهة؛ لم تُرسل رسالة |
| العملية ← النتيجة ← الدليل | صفحات/مراجع المنتجات القائمة | وفق صلاحيات API القائمة | حفظ حقيقي/عضوية/عقد المنتج | NOT RUN؛ لم يُخترع رابط دليل أو بيانات |

## الملفات وسبب التغيير

- `src/shared/product-navigation.mjs`: تعريف المنتجات ومساراتها ونطاق التقييم، وتوابع القائمة المسموحة والوجهة المعتمدة؛ بيانات عامة فقط. `src/server/kernel/core.mjs` يعيد استخدام التعريف دون تغيير قرار الوصول.
- `src/components/ProductJourney.astro` و`src/pages/products/{index,[product]}.astro`: إجراءات منفصلة في الكتالوج والتفاصيل مع حفظ ترتيب المحتوى وهوية التصميم؛ `public/llms.txt` ناتج أوصاف الصفحات الحالية.
- `src/layouts/AppLayout.astro`: تنقل المنتجات وموقع الصفحة وروابط التفاصيل والكتالوج والبوابة والتواصل. `src/pages/app/{firewall,ledger,human-gate}/index.astro` و`src/components/RiskWorkspace.astro`: روابط الدخول تحمل المنتج الصحيح؛ Secure Chat يستفيد من الروابط المشتركة دون تعديل واجهته.
- `src/pages/app/kernel/index.astro` و`src/scripts/kernel.ts` و`src/pages/auth/sign-up.astro`: حفظ المنتج خلال الدخول وإنشاء الحساب، والعودة المشروطة بقرار Dashboard، وتعليمات الانضمام/التواصل عند غياب الوصول.
- `src/middleware.ts`: تطبيق سياسة الخصوصية الخاصة على صفحات Auth أيضًا، دون تغيير gate App أو حراس API.
- `tests/product-navigation.test.mjs` و`scripts/verify-product-journey.mjs`: اختبار قائمة السماح/الوصول والتنقل الفعلي والروابط ومقاسات RTL.

## التحقق والأدلة

| الأمر/الفحص | النتيجة | الحد |
|---|---|---|
| `npm run build` | PASS؛ 55 صفحة عامة | تحذيرات Astro عن request.headers في prerender محفوظة؛ ليس دليل نشر |
| `node --test tests/product-navigation.test.mjs tests/kernel.test.mjs tests/trial.test.mjs tests/identity.test.mjs` | 17 PASS / 0 FAIL / 0 SKIP | هوية EdDSA وصلاحيات وتجربة بوحدات محلية؛ يشمل رفض JWT موقّع منتهي في `identity.test.mjs`، وليس انتهاء جلسة متصفح |
| `node scripts/verify-node-runtime.mjs` | 14 PASS / 1 SKIP / 0 FAIL | closed gate503، encoded alias، 401، خصوصية؛ فحص DB الإيجابي متجاوز لعدم إعداد DB محلية |
| `BRIGHTAI_PLAYWRIGHT_MODULE=<installed-playwright>/index.mjs node scripts/verify-product-journey.mjs` | PASS للسيناريوهات السبعة؛ 31 وجهة محلية 200 | خادم معزول بلا Auth/DB، لا ردود API مصطنعة ولا حسابات |
| `node scripts/verify-routes.mjs http://127.0.0.1:4413` على خادم معزول | 55 صفحة، 2911 مرجعًا، 80 مسارًا، 117 تحويلًا، 234 فحص طريقة، 0 orphan / 0 broken | الروابط والموارد العامة وSEO؛ ليس E2E لعمليات المنتجات |
| `npm run internal-links:audit` | NOT AVAILABLE | المهارة أشارت لأمر غير موجود في manifest؛ استُخدم verify-routes وفحص DOM بدلًا منه؛ لم يُضف script شكلي |
| `git diff --check` | PASS | نطاق ملفات هذه المهمة؛ التعديل المستقل محفوظ |

الأدلة: [browser-results.json](browser-results.json)، [browser.log](browser.log)، [routes.log](routes.log)، [unit.log](unit.log)، [runtime.log](runtime.log)، [build.log](build.log). اللقطات: [360](catalog-360.png)، [390](catalog-390.png)، [768](catalog-768.png)، [1440](catalog-1440.png).

المتصفح الفعلي: نقر تفاصيل كل منتج ثم الدخول، إعادة تحميل تحتفظ بالمنتج، رجوع إلى التفاصيل، فتح مساحة المنتج مباشرة ثم العودة إلى الكتالوج، RTL وعدم overflow في المقاسات الأربعة، Enter من لوحة المفاتيح، ورفض external returnTo. صفحة App المعروضة بلا هوية هي shell فقط؛ APIs الخمسة ترفض بلا Authorization بـ401، وBearer مع Auth غير مهيأ بـ503 `AUTH_SETUP_REQUIRED`، دون بيانات خاصة.

سُجل 25 تحذير Chrome: `Transition was aborted because of invalid state. ViewTransition opt-in disabled` بين public (تفعّل cross-document transitions) وApp (لا تفعّلها). التنقل والوجهة نجحا؛ لا أخطاء script أخرى. التحذيرات كاملة في JSON، ومراجعة الحركة P23؛ لا ادعاء إتاحة شاملة أو أداء مقاس.

Browser MCP الأول أعاد `NO_BROWSER_PROFILE`؛ CUA انتهى بمهلة اتصال. لذلك استُخدم Chrome المثبت عبر Playwright المحلي بدل افتراض الاتصال. مرجع تصميم اختياري قُرئ من [Made Good Designs](https://madegooddesigns.com/inspiration/ui/navigation-header-web-minimal-be01b47155e9)؛ لم يُنسخ الهيدر أو يُستبدل تصميم المشروع. Graphify وأمره غير متوفرين، ولم يُثبّت شيء.

## مراجعة الروابط والمحتوى

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: Product catalogue, authenticated entry, and workspace return links
Files Scanned: 55 rendered public pages + 12 target journey pages
References Checked: 2911 public references + 31 unique journey destinations
Issues Found: 0
Issues Fixed: 0
Issues Requiring Manual Review: 0
--- FIXED ---
None
--- NEEDS MANUAL REVIEW ---
None
--- WARNINGS ---
The skill's npm audit script is absent; existing route audit and browser DOM checks used.
Authenticated operation/evidence links are not covered by the visitor crawl.
=== END REPORT ===
```

```text
=== CONTENT INTEGRITY REPORT ===
Trigger: Added product journey actions and removed public availability labels per user correction
Content Reviewed: ProductJourney, catalogue/details, AppLayout, Kernel intent, Auth continuation
Review Depth: section
--- CRITICAL ISSUES (must fix) ---
None
--- HIGH ISSUES (should fix) ---
None
--- MEDIUM ISSUES (quality improvement) ---
None
--- LOW ISSUES (polish) ---
None
--- INTEGRATION SUMMARY ---
New content fits: yes - neutral actions and synthetic evaluation scope
Flow preserved: yes - section order unchanged
Consistency maintained: yes - shared canonical product paths, optional integration and separate subscription
Cross-references valid: yes - local route and browser scans
--- STATISTICS ---
Issues Found: 0
Issues Auto-Fixed: 0
Issues Needing Manual Review: 0
Content Quality Score: 8/10 - concise and consistent; authenticated journey still needs runtime review
=== END REPORT ===
```

## التراجع

إزالة إضافات هذه المهمة المحددة أو استعادة نسخها السابقة بمراجعة diff؛ إعادة تعريف المنتجات/روابط الدخول السابقة عند إزالة الملف المشترك، دون حذف صفحات أو مساس ببيانات أو تعديل مستقل. لا تستخدم reset أو restore جماعيًا؛ توجد تغييرات متزامنة. لا إعادة تفعيل أو تعطيل تجارب ولا تراجع DB ضمن هذه المهمة.


## تحسين التصميم والحركة — توجيه المستخدم اللاحق

أُعيد تشكيل القسم إلى بطاقة افتتاحية واسعة وأربع بطاقات في عمودين، ثم عمود واحد على الجوال؛ أسماء المنتجات وترتيبها وروابطها محفوظة. `ProductCatalog.astro` يملك التخطيط والعناوين والفهرس، و`ProductSchematic.astro` يرسم SVG زخرفية مستقلة لكل منتج، و`product-showcase.ts` يضيف reveal مرة واحدة وموضع المنتج في الفهرس وتفاعل إضاءة زخرفي. لا نتائج أو أرقام تشغيل مصطنعة في الرسومات. `ProductJourney.astro` يملك أزرار الدخول والتقييم الجديدة مع أسماء وصول كاملة رغم اختصار النص المرئي.

الحركة: `transform/opacity` عبر WAAPI وCSS، reveal480ms وفاصل45ms، وتفاعل مؤشر/ضغط120–220ms من tokens المشروع. النص العربي يتحرك ككلمات كاملة دون تفكيك الحروف. لا مكتبة إنتاج جديدة أو حلقة حركة مستمرة أو إخفاء محتوى قبل JavaScript. Hover خلف شرط pointer:fine؛ reduced-motion يلغي الحركة المكانية ويوقف WAAPI الجاري؛ الفهرس والروابط الأساسية HTML عادي.

**التحقق النهائي:** build55 وunit17 وroutes55/2911 مرجعًا/80 مسارًا PASS، صفر orphan/broken. Chrome360/390/768/1440: قياسات RTL/reveal وأهداف44px PASS؛ hover للرسم PASS؛ reduced-motion دون حركة مكانية جارية PASS؛ no-JS يعرض البطاقات الخمس ويفتح التفاصيل PASS؛ صفر script errors في فحص التصميم. أُعيد فحص رحلة التنقل كاملة بعد تغيير الأزرار. تفاصيل [design-results.json](design-results.json)، [design.log](design.log)، والفحص القابل للتكرار `scripts/verify-product-showcase.mjs`.

**المعاينة:** [سطح المكتب](showcase-1440.png)، [الجوال390](showcase-390.png)، [360](showcase-360.png)، [768](showcase-768.png). اللقطات معزولة للقسم؛ يخفي خيار screenshot فقط رابط skip وsection-compass الثابتين خارج القسم؛ لم تتغير عناصر الهيدر أو سلوكهما في المصدر. فُحص رابط skip الفعلي قبل التصوير: خارج viewport بلا تركيز كما صُمم.

**مراجعة الجودة:** المسافات منتظمة مع اختلاف مقصود في أحجام البطاقات؛ هرم النص واضح؛ تسميات الأفعال مختصرة مع aria-label كامل؛ المحاذاة مشتركة؛ المقاسات الأربعة بلا قص؛ تخطيط واسع ثم2×2 يقلل التكرار. فحص قواعد الحركة: لا transition:all أو scale0 أو حركة hover غير مشروطة أو تحريك width/height في الإضافات؛ لا ادعاء أداء مقاس أو WCAG شامل.

**الإضافات المختارة:** Better Design نفّذ check_comprehension؛ النتيجة الأولى سجلت طولًا إرشاديًا16ثانية، وبعد تقصير تسميات الأفعال اجتازت بطاقة المنتج الفحص (13كلمة/تقدير10ثوانٍ، تقدير آلي وليس بحث مستخدم). MagicPath استُخدم لقراءة معايير magicpath-design ومراجعة craft فقط؛ لم يُنشأ Canvas أو مورد بعيد. UI UX Designer: قُرئت مهارتا ui-ux-designer وmicrointeractions-motion وطُبقت قواعد الهدف44px/التسلسل/RTL/تقليل الحركة. Modern Web Guidance: جُلبت guides `motion,natural-interactions,interactive-content-reveal` عبر npx بمخزن /tmp؛ لم تتغير dependencies أو إعدادات الإضافة. الأداة نبّهت إلى إصدار أحدث للمهارة، ولم تُعدل تلقائيًا. استُخدم أيضًا مرجع [UI by Made Good Designs — editorial feature grid](https://madegooddesigns.com/inspiration/ui/feature-grid-web-editorial-cf97b2e973e0) للتسلسل والمسافات، دون نسخ ألوانه أو خطه أو هيكله إلى المشروع.

التسليم المحلي للتصميم **DONE LOCAL**؛ اختبار العمليات والحصة والجلسة المخولة والنشر بقي بنفس الحدود المذكورة أعلاه.
