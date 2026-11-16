# BRIGHT AI / AIGAS — حزمة تجربة المنتجات للجميع
**13 برومبت تنفيذية جديدة | 16 نوفمبر 2026 | مرجع: YEEEAE/BRIGHTAI**

> **الهدف:** تحويل تجربة AIGAS من شرح تعليمي جذاب إلى **ستة مختبرات تفاعلية فورية للجميع دون تسجيل** (المنتجات الخمسة + Kernel)، مع مسار آخر لتجربة تشغيلية ذاتية لمدة 48 ساعة للمستخدم المسجل عندما تثبت جاهزية الخدمة والهوية والأمان. لا نفتح بيانات أو صلاحيات الإنتاج للضيف كي نحقق هذا الهدف.

## نتيجة تحليل التغييرات الفعلية

| المجال | الدليل الحالي | الاستنتاج |
|---|---|---|
| GitHub | مقارنة `a6f3551071bb12102957f556bb3badb21cb80b3c` مع `54ba24cfe2531a5646e0c206fae7328d2e72a2e2`: **23 commit** و244 سجل ملف (99 إضافة، 46 تعديل، 99 إعادة تسمية) | تغييرات فعلية كثيرة، لكن إعادة تسمية تقارير `Audit/` لا تعني إغلاق متطلب تشغيلي |
| تجارب الوصول | `src/server/kernel/exploration.mjs`, `operator-exploration.mjs`, `migrations/0033_aigas_exploration.sql` أُضيفت | مسار استكشاف للـTenant مدته 48 ساعة، محدود بـ`dashboard/list/browse`، ليس تجربة عامة مجهولة الهوية |
| Secure Chat | `src/server/secure-chat/integration.mjs` أُضيف مع حراسة سياق وسياسات | مصدر لتكامل المحادثة؛ ليس دليلًا على نجاح اتصال نموذج حقيقي أو عرض Trial للعامة |
| التصميم | تحسينات `src/styles/variables.css`, `src/styles/experience.css`, `ProductJourney.astro`, `solutions/index.astro` وتقرير D05 للتباين | الهوية قوية ومتماسكة؛ يجب الحفاظ عليها والبناء فوقها |
| Neon Production | **31 جدولًا** لـAIGAS، 31 مع RLS، **سياستان على جدولين**، جدول exploration مفقود، فرع production غير محمي | P0: لا تفتح تشغيلًا حقيقيًا متعدد المؤسسات قبل الإغلاق الأمني |
| Neon Staging | **42 جدولًا** لـAIGAS، 42 مع RLS، **90 سياسة على 42 جدولًا**، جدول exploration موجود | تقدم مؤكد؛ الفرق مع الإنتاج يحتاج فحص migrations والصلاحيات والعزل؛ العدد ليس برهان أمن بذاته |
| Render | `render.yaml` يعرّف Node Web Service؛ اتصال Render أعاد `forbidden` لقراءة workspace | نوع الخدمة المنشورة الحالي **غير متحقق مباشرة** عبر موصل Render |
| الموقع الحي (16 نوفمبر) | `/`, `/products/`, صفحات المنتجات الخمس, `/kernel/` = HTTP 200؛ `/app/`, `/app/kernel/`, مسارات `/app/*` للمنتجات = 404 | رابط «الدخول إلى المساحة» يؤدي إلى انسداد فعلي؛ لا دليل نشر SSR متاح للعامة |
| المختبرات الحالية | صفحات المنتج تصرّح «توضيح تعليمي · لا اتصال بخدمة» وCTA تجربة عامة غير واضح | الموجودة **نماذج مفاهيم** وليست تجربة تشغيلية مُثبتة |
| UX | Desktop متناسق أسود/بنفسجي/ذهبي وعربي؛ الهاتف 390px دون تجاوز أفقي، لكن ارتفاع الصفحات والتكدس يبعدان المستخدم عن أول تجربة | حافظ على المظهر، وقلّص عدد الخطوات قبل أول قيمة عملية |

**مهم:** تقرير 11 نوفمبر ذكر Staging بـ36 جدولًا و77 سياسة؛ قراءة Neon المباشرة الآن 42/90. لا تتعامل مع لقطتين تاريخيتين كأنهما قياس واحد. نتائج PASS المحلية في `Audit/` ليست LIVE PASS.

## القرار التنفيذي: تجربتان، وليس زرًا وهميًا

**A — Public Interactive Lab:** لجميع الزوار بلا حساب ولا بطاقة، للمنتجات الخمسة والـKernel. التفاعل حقيقي في الواجهة: إدخال، تشغيل سيناريو، تغيير حالة، قرار، سبب، إعادة ضبط، وتبديل منتج. **البيانات والأحداث اصطناعية**، والتنفيذ حتمي محلي أو خدمة Sandbox معزولة خاضعة للحصص؛ لا بيانات عملاء ولا صلاحيات Tenant ولا AI خارجي غير معتمد. شارة ثابتة وصغيرة «مختبر تفاعلي · بيانات افتراضية».

**B — 48-Hour Operational Trial:** تسجيل موثق وإنشاء مؤسسة تجربة وعزل عضوية وحصص ومنح مستقلة، ولمدة 48 ساعة خادمية. وظائف AI الخارجية لا تُفعل دون موافقة provider والسياسة والميزانية ومكان معالجة البيانات. الاستكشاف العام A يبقى متاحًا حتى عند عدم جاهزية B.

**C — Enterprise:** مسار الترخيص والاشتراك والشراء منفصل؛ لا اشتراك مدفوع تلقائيًا بعد انتهاء التجربة.

### فلسفة التصميم

اعتمد هوية BRIGHT AI الحالية لا نسخًا بصريًا لأحد. الألوان المرجعية المصدرية: `--color-void: #000000`، `--color-electric-iris: #8052ff`، `--color-saffron-spark: #ffb829`، `--color-action-hover-strong: #6f43e6`، خط Plex Arabic، Dark UI فقط، RTL. استلهم وضوح مهام Linear/Stripe/Vercel ومختبرات الحوكمة التفاعلية مثل Lxium وVerko، وليس ألوانهم أو شاشاتهم حرفيًا. **حافظ على Hero/Constellation/Brand Logo ونصوصها وروابطها وسلوكها الحالي كما هو**. لا تستبدلها بقالب Dashboard تجاري عام.

### تعليمات إلزامية تُطبّق على كل برومبت

1. اعمل على نسخة محلية في OpenCode. قبل أي تعديل: `git status` و`git rev-parse HEAD`، قراءة ملفات المسؤولية، ومقارنة الحل بما نُفّذ. **إياك أن تعيد كتابة ميزة موجودة أو تدّعي أن ملفًا منشورًا لمجرد وجوده في GitHub.**
2. يجوز تنفيذ تغييرات الكود **محليًا عند تشغيل المالك للبرومبت**. يُمنع تلقائيًا: `git push`، `git commit`، PR، تعديل DNS/Render/Neon Production أو أسرارها، إرسال رسائل، تكوين خدمة مدفوعة، أو بيانات حقيقية. أي تغيير خارجي يحتاج موافقة المالك المستقلة.
3. لا تفتح RLS أو Data API أو `anonymous` للوصول إلى بيانات مؤسسات، ولا تستخدم Staging الحالية كـSandbox عام؛ ابنِ Demo منفصلًا تمامًا عن قاعدة البيانات الفعلية عند الحاجة.
4. لا تُقدّم محاكاة بعنوان «حماية AI حقيقية» أو «موافقة بشرية معتمدة» أو «امتثال تنظيمي مثبت». إتاحة الواجهة لا تُساوي نجاح منتج إنتاجي.
5. طبّق Arabic RTL و`bdi dir="ltr"` لأسماء التقنية، Logical CSS Properties، حالات Empty/Loading/Error/Blocked/Success، keyboard/focus وreduced-motion، وتباين نص صغير WCAG AA. لا تجعل الشكل على حساب قراءة البيانات.
6. كل برومبت يُسلّم تقريرًا قصيرًا: التغييرات المحلية والملفات، دليل بصري/وظيفي، نتيجة LOCAL/STAGING/LIVE لكل شرط، أسباب التعطل، وما يحتاج تفويض مشغّل. لا تفتح Issue في Linear أو تحفظ Figma أو MagicPath بلا طلب مباشر.

---

## P01 — تدقيق دلتا HEAD وخريطة إغلاق المتطلبات | P0
**التبعيات:** لا شيء.

أنت Principal Software Auditor + Product Architect. افحص الآن `YEEEAE/BRIGHTAI`، لا تكرر التقرير العام. مرجع مقارنة `a6f3551071bb12102957f556bb3badb21cb80b3c`، وآخر رأس معروف `54ba24cfe2531a5646e0c206fae7328d2e72a2e2` لكن اعتمد HEAD عند وقت التشغيل. اقرأ `Audit/brightai-closure/EXECUTIVE-CLOSURE.md` وتقارير D01/D02/D05/D06/D07 و`ProductExperience.astro` و`ProductJourney.astro` و`src/pages/products/*` و`src/pages/app/*` و`render.yaml` و`migrations/0032*` و`0033*`.

**المهام:** فصل ملفات إعادة التسمية والتقارير عن تغييرات المصدر؛ تحديد الميزات المكتملة محليًا والمعلقة حيًا؛ مسح CTA لكل منتج ومدى صحته (لا يكفي رابط 200)، تسجيل HTTP على كل منتج وكل `/app` و`/healthz` وAPI، مراجعة شاشات 1440 و390 وبيانات تنفيذ سيناريو، وتحضير Gap Register قابل للإغلاق. صنف كل عنصر `SOURCE_ONLY`, `LOCAL_VERIFIED`, `STAGING_VERIFIED`, `LIVE_VERIFIED`, `BLOCKED`, `UNKNOWN`. أنشئ خريطة تبعيات P02–P13 من **نواقص مثبتة**، واحذف أي عمل مكرر.

**القبول:** جرد بأدلة ملف/سطر ومسار URL ولقطة شاشة حيث أمكن، ومصفوفة لست تجارب. لا تستنتج نجاح Live من اختبارات محلية.

## P02 — فك 404 وتشغيل أصل Astro SSR | P0
**التبعيات:** P01.

أنت Astro 6 + Render Node DevOps Engineer. `astro.config.mjs` مصدر SSR، و`render.yaml` يعرف Node Web Service و`npm ci && npm run build` و`npm start` و`/healthz/`؛ لكن الموقع يرد 404 على `/app/*`، وموصل Render لم يسمح بالقراءة في هذه الجولة. افحص `scripts/server.mjs`, middleware, redirects, Node adapter, session/auth, `AIGAS_APP_ENABLED`, health readiness، وأصل كل path.

**نفّذ محليًا:** إصلاحات المصدر اللازمة فقط، ثم خطة مشغّل لتهيئة خدمة Node مستقلة، environment **أسماء فقط** دون أسرار، cache bypass لكل `/app/*`, no-store/noindex وCSP وTLS، ومطابقة Build SHA مع Deploy SHA، وخطة rollback. لا تنشئ HTML ثابتًا تحت `/app/*` يوهم أن الواجهة عملت، ولا تنقل DNS أو تنشر دون تصريح. تحقق أن API يعطي JSON وأن غياب الجلسة يتعامل برسالة دخول صحيحة، لا 404، مع `returnTo` ضمن allowlist.

**القبول:** وثيقة مسارات Node الفعلية، `healthz` يعتمد التبعيات، و6/6 مساحة تطبيق قابلة للوصول على origin مفحوص أو حالة BLOCKED واضحة مع خطوات Render للمشغّل؛ لا تدّع نشرًا حيًا حتى التحقق.

## P03 — نظام واجهات عالمي وهوية BRIGHT AI وتجربة مركز المنتجات | P1
**التبعيات:** P01.

أنت Principal UI/UX + RTL Product Designer. احتفظ بهوية `src/styles/variables.css` وبـHero وConstellation والشعار ورابطهما ونصوصهما **دون مساس**. هدفك `/products/` ومساحات التجربة، لا تجميل الصفحة الرئيسية. اقرأ كل tokens ومكونات `PageShell`, `ProductCatalog`, `ProductExperience`, `ProductJourney`, `AppLayout` قبل التنفيذ.

**نفّذ:** تصميم **Experience Hub** فيه 5 بطاقات منتجات + مدخل Kernel، لكل منتج «جرّب الآن» يؤدي إلى المختبر العام مباشرة و«تجربة تشغيلية 48 ساعة» إلى Auth. مثال مبسط/غاية/النتيجة المتوقعة داخل البطاقة من دون حشو. ضع أول تجربة فوق النصوص التسويقية الطويلة، وحافظ على النظام اللوني والحركات الهادئة. ابنِ App Shell موحد: Sidebar ثابت على الديسكتوب، Header يحدد المنتج وسياقه، منطقة تفاعل كبيرة، Inspector للسبب/الدليل، قائمة جوال غير متداخلة، حفظ خطوة التنقل بين المختبرات. واجهة كل منتج **مختلفة في طبيعة المهمة** لا قالب Stat Cards متكرر. Mobile-first (360/390px)، Typography عربية، لا light theme جديد.

**القبول:** أول CTA مفيد واضح دون scroll طويل، انتقال دون dead-end، No horizontal overflow، قابلية لوحة المفاتيح وfocus، تباين hover≥4.5:1 للنص الصغير، وreduced-motion. اجعل التصميم أقرب لجودة المنتجات العالمية **داخل العلامة الحالية**.

## P04 — محرك Public Interactive Sandbox لجميع الزوار | P0
**التبعيات:** P01 وP03.

أنت Sandbox Security Architect + Frontend Engineer. وفّر 6 مسارات مستقرة مثل `/demo/firewall/`, `/demo/ledger/`, `/demo/human-gate/`, `/demo/risk-engine/`, `/demo/secure-chat/`, `/demo/kernel/` أو مسارات مكافئة موثقة. **لا تسجيل ولا بطاقة ولا provider credentials ولا اتصال بقاعدة مؤسسات الإنتاج.** عام للعرض فقط، لا يفتح `/app/api/*` لضيف مجهول.

**نفّذ:** محرك سيناريوهات اصطناعية مشتركة مع عقود بيانات واضحة `scenario → input → decision → explanation → reset`; واجهة حقيقية للأزرار والمدخلات، استجابة ترتبط بمعطيات المستخدم، أخطاء مفهومة، ومخرجات demo موسومة. من الأفضل أن تعمل المحاكاة deterministic في المتصفح، ويمكن Backend معزول فقط عند وجود سبب تقني وضوابط rate/body limits. لا تُرسل input أو identifiers إلى analytics/logs؛ وإذا احتجت حفظ جلسة فليكن محليًا وبلا PII. شارة ثابتة مختصرة «مختبر تفاعلي · بيانات افتراضية»، لا تنشر claims أن هذا مسار الحماية الإنتاجي.

**القبول:** 6/6 مختبر عام يفتح ويعمل مباشرة بلا Auth؛ سيناريوهان مختلفان لكل منتج، تغيير المدخلات يغيّر النتيجة، Reset يعمل، الهاتف ولوحة المفاتيح سليمان، 0 وصول لمستأجر أو API محمي.

## P05 — تجربة AIGAS Firewall ذات القرارات الخمسة | P1
**التبعيات:** P04.

أنت AI Safety Interaction Engineer. ابنِ Workspace قرار عملي لا مخططًا ثابتًا. المستخدم يختار مثالًا اصطناعيًا أو يكتب نصًا قصيرًا ثم يضغط «افحص الطلب»؛ يرى **الإدخال → قاعدة demo → قرار → السبب → المخرج**. غطِّ الحالات `ALLOW`, `WARN`, `REDACT`, `ESCALATE`, `BLOCK` بمسمياتها العربية الدقيقة، مع سياسة demo حتمية معلنة وسيناريو لكل قرار؛ لا عشوائية ولا claim فحص أمني حقيقي.

عند `REDACT` اعرض Before/After بمعرّف خيالي واضح، وعند `ESCALATE` رابطًا يحول لسيناريو Human Gate الافتراضي فقط، وعند `BLOCK` لا تتيح زر موافقة يتجاوز الحظر. Inspector لقاعدة المثال والسبب، وحالات Empty/Too-long/Loading/Reset/Blocked. تجاهل النصوص المحرجة في محتوى التحليلات؛ لا مزوّد AI خارجي. استثمر `DecisionCircuit.astro` و`RedactionDemo.astro` دون تكرار مكون متكامل.

**القبول:** خمس قرارات تفاعلية، خمسة أسباب مقروءة، input مؤثر، لا كتابة إنتاجية أو حراس وهميون.

## P06 — تجربة AIGAS Ledger والتحقق من دليل متسلسل | P1
**التبعيات:** P04.

أنت Audit Evidence Product Designer. سيناريو المستخدم: حدث افتراضي → أضف حدثين → Timeline → افتح سجلًا → «تحقق من السلسلة» → «غيّر حدثًا» → اكتشاف الخلل. أظهر تفاصيل event وactor مستعار ووقت وسبب وreference والـhash بطريقة تربط الرسوم بالبيانات؛ لا تحوّل الشيفرة إلى صورة.

يمكن بناء hash chain محلية عبر Web Crypto إذا كان الوصف صادقًا؛ اكتب «تحقق من مثال تجريبي في المتصفح» لا ادعاء audit-grade immutability إنتاجية. زر Export اختياري ينتج JSON محليًا بوسم `DEMO / SYNTHETIC` بلا أدلة مستخدم. ربط سيناريو Firewall/Human Gate demo للمشاهدة معزول عن production Ledger. على الجوال يظهر Timeline ثم Inspector. حالات sequence valid/altered/empty واضحة دون لون فقط.

**القبول:** تعديل سجل يغيّر نتيجة التحقق مع بيان موضع الخلل؛ التصدير قابل للفتح وبدون أسرار.

## P07 — تجربة AIGAS Human Gate ودورة الموافقة البشرية | P1
**التبعيات:** P04.

أنت Workflow Product Lead + Security UX. أنشئ Queue اصطناعيًا يضم pending/decided/cancelled بواجهات عملية: اختر طلبًا، افتح «لماذا يحتاج موافقة»، بدّل **Persona افتراضي داخل demo فقط** (مقدم/مراجع مخوّل)، ثم وافق/ارفض/اطلب توضيحًا مع سبب. لا تربط تبديل persona بصلاحيات فعلية.

اعكس lifecycle الحقيقي كما تصفه خدمات `src/server/human-gate` والـmigrations؛ تجنب حالات مخترعة تناقض الخادم. مثال فصل المهام: مقدم الطلب لا يوافق على طلبه؛ إظهار سبب المنع. فرّق «سُجّل قرار بشري» عن «سمح النظام بالتنفيذ»، مع رفض/إلغاء/انتهاء تفويض ومؤشر واضح لصاحب الصلاحية. تكامل `ESCALATE` من المختبر العام Firewall وحدث اصطناعي إلى Ledger بدون API حقيقي.

**القبول:** دورة كاملة في المحاكاة، رفض مخالفة Separation of Duties، سبب لكل حالة، لا اعتمادات إنتاجية.

## P08 — تجربة AIGAS Risk Engine وتوضيح المخاطر المتبقية | P1
**التبعيات:** P04.

أنت Enterprise AI Risk Product Designer. اجعل المستخدم يختار أصلًا/حالة استخدام خيالية، يحدد السياق واحتمال الضرر وأثره، يرى Matrix تفاعلية مع درجة أولية **معلّلة كمنهج demo**، يختار إجراء معالجة وضابطًا، فيرى الخطر المتبقي وأسباب تغيره. أنشئ تصميم «أصل → خطر → تقدير → معالجة → قبول/مراجعة» مع Inspector للمالك والمراجعة والافتراضات.

لا تُنسب العتبات أو النتائج إلى ISO/NIST أو جهات رقابية دون مصدر معتمد؛ لا تدع الزائر يقبل مخاطر مؤسسة حقيقية. تغيير الضوابط أو الأصل يعيد الحساب الفوري؛ صدّر ملخصًا تجريبيًا بعلامة Synthetic، واجعل تمييز initial/residual/accepted واضحًا بوسم نصي. استثمر `RiskWorkspace.astro` أو الكود الحالي قبل تكراره.

**القبول:** اختياران مختلفان ينتجان مخرجات مختلفة مفهومة، تفسير السبب، تخطيط واضح عند 390px.

## P09 — تجربة AIGAS Secure Chat بمحادثة محكومة | P1
**التبعيات:** P04.

أنت Conversation Design Lead + Privacy Architect. لا تعرض واجهة توهم أن نموذج Groq أو مزودًا معتمدًا يرد فعليًا إذا لم يثبت ذلك. المختبر العام يوفر محرر نص ورسائل وسيناريوهات «طلب عام/بيانات افتراضية حساسة/طلب ترفضه السياسة»، و**ردود محاكاة محددة** وقرارًا موضحًا لـFirewall/Kernel وإظهار redact قبل/بعد. اكتب «رد محاكاة» بمحاذاة الرد، مع copy/new chat/reset، loader ورسائل خطأ ولا حفظ لمحتوى الحوار في analytics.

للتجربة التشغيلية 48h فقط، اربط `src/server/secure-chat/integration.mjs` و`service.mjs` ومسار `models.ts` بعد إثبات Auth + tenant + provider approval + policy ALLOW + quota + region + egress + cost cap؛ لا تفتح fallback لمزود خارجي أو تقبل مدلولات الدور القادمة من العميل. شاشات الـDemo العامة تظل تعمل حتى عند غياب provider حقيقي. واجهة تشبه تطبيق محادثة راقيًا ضمن BRIGHT AI، لا سبورة رسوم بيانية.

**القبول:** ثلاثة سيناريوهات تعطي قرارات ورسائل مختلفة محليًا و0 إفشاء محتوى؛ Live send يُعلن READY فقط بعد رسالة نموذج فعلية بإذن.

## P10 — AIGAS Kernel: رحلة وحدة تجمع المنتجات | P1
**التبعيات:** P05–P09.

أنت AI Governance Product Architect. ابنِ Demo Kernel كـControl Center مصغر: يختار الزائر Asset وسياسة وهمية وتصنيف بيانات، يرى **سياسة → فحص Firewall → خطر/مراجعة Human Gate → قرار → دليل Ledger** مع سبب كل خطوة. عرض أقرب للواجهات العالمية: Sidebar منتجات، main flow، inspector للدليل والسبب؛ لا يختزل Kernel في بطاقات «عدد المستخدمين/السياسات» غير المفيدة.

وصل مختبرات المنتجات عبر Scenario ID اصطناعي قابل للاستمرار بين الصفحات، دون user ID أو tenant ID أو PII في URL. Kernel **بنية مشتركة لا تُفوتر منفصلًا**. داخل `/app/kernel/` الحقيقي حافظ على صلاحيات OWNER/ADMIN/MEMBER وسياسات المستأجر من الخادم و`src/server/kernel/guidance.mjs`، ولا تمنح Operator authority لأي UI. لكل نتيجة CTA «جرب المنتج التالي» أو «ابدأ 48 ساعة» مع توضيح شروط التشغيل.

**القبول:** يكمل ضيف مجهول رحلة كاملة من السياسة إلى الدليل ويستطيع الرجوع دون فقد السياق العام؛ لا تعرض أي لوحة Tenant حقيقية لعامة الزوار.

## P11 — إغلاق فجوة Neon والعزل والصلاحيات | P0
**التبعيات:** P01 وP02. **مرحلة تخطيط أولًا، لا ترحيل إنتاج دون تصريح منفصل.**

أنت PostgreSQL 18 Engineer + SaaS Security Architect. المصدر الحالي Production 31 جدولًا مع RLS وسياسات على جدولين فقط؛ Staging 42 جدولًا و90 سياسة، وجداول Exploration هناك فقط. راجع ledger الـmigrations حتى `0033_aigas_exploration.sql` مع ترتيب الاعتماديات والـchecksums وRole Grants وSQL SECURITY DEFINER. راجع owner bypass وFORCE RLS وruntime الأقل صلاحية و`aigas_tenant_scope`، وحسابات الفرع وحمايته.

ضع Delta migration plan مع restore/rollback واضح، فحوص عزل Tenant A/B الاصطناعية وتحقق أن Auth identity وtenant membership لا تأتي من query parameter. اكتشف أي مسارات API تفتح تنفيذ غير مقصود. راجع 48h grant consumption atomicity وrevocation، وسقف الاستهلاك. لا تطبق الأمر على Neon Production، ولا تنشئ فروعًا/تعدل حماية دون موافقة المالك. لا تستخدم Staging كـPublic Demo مباشرة.

**القبول:** Staging verification موثق وخطة Production معتمدة قبل تطبيقها؛ تجربة Live 48 ساعة مغلقة حتى تنجح RLS/identity/role isolation على المصدر العامل. المختبر العام مستقل ويمكن فتحه بأمان قبل Live.

## P12 — تجربة تشغيلية ذاتية 48 ساعة لكل المنتجات | P1
**التبعيات:** P02 وP10 وP11.

أنت Product Growth Engineer + Identity & FinOps Security Lead. أعط الزائر خيارين واضحين من صفحة كل منتج: **«جرّب المختبر الآن بلا حساب»** و«ابدأ تجربة تشغيلية 48 ساعة». سجل المستخدم ببريد موثق، أنشئ Tenant تجريبيًا معزولًا ببيانات Synthetic، عضوية صحيحة، منحًا محدودة متدرجة حسب جاهزية المنتج، وحصة/تاريخ انتهاء من الخادم. لا تطلب بطاقة، ولا تعطي حسابًا متعدد الأغراض تجاوزًا للصلاحيات.

صمم Trial Home تعرض منتجات 5/5، Kernel، الوقت والحصص الباقية، العمليات المسموحة وحالة كل تكامل: `DEMO AVAILABLE`, `TRIAL LIMITED`, `PROVIDER APPROVAL REQUIRED`. الأزرار تحقق الإذن من الخادم، لا من LocalStorage. انتهاء 48 ساعة يعطّل العمليات فورًا ويعرض التحويل الاختياري للتواصل/الترخيص؛ لا تحويل مالي تلقائي. مزود AI الحقيقي يظل محجوبًا حتى توافق السياسة والمنطقة والتكلفة والاعتماد، مع بقاء Public Demo لكل المنتجات.

**القبول:** رحلة مستخدم مسجل على بيئة معزولة فعلية، من Email verification إلى Tenant وGrants ثم المنتج وانتهاء الصلاحية، مع إثبات رفض عبور tenant وأحداث تدقيق منقاة. لا تستبدل غياب Provider برد وهمي يبدو Live.

## P13 — قبول شامل UX/الأمان/SEO وإطلاق مرحلي | P0/P1
**التبعيات:** P02–P12.

أنت UX Researcher + Accessibility Lead + Privacy Engineer + Release Manager. افحص بنسخة متصفح القراءة/بيئة معزولة: `/products/`, 5 صفحات منتج، `/kernel/`, 6 demos، و`/app/*`. المطلوب **مسار مستخدم كامل** لا HTTP 200 فقط: اختيار مثال → إدخال → تشغيل → نتيجة → سبب → Reset؛ من دون تسجيل في demos العامة، وتسجيل حقيقي للـTrial في بيئة معزولة عند اكتمال الأمان.

افحص 360/390/768/1440px وKeyboard/Focus/RTL/`bdi` وReduced Motion وWCAG 2.2 AA كهدف لا كادعاء شهادة، no horizontal overflow أو Sidebar يغطي CTA. قس LCP/INP/CLS مقابل baseline، وحافظ على Hero وConstellation دون تغييرها بصريًا. راجع canonical والسitemap وOpenGraph للمختبرات العامة، واجعل App الخاص `noindex/no-store`. راجع Network Payloads لـGA4/PostHog/Sentry حتى لا تُرسل prompts أو email أو token أو query خاصة؛ عند عدم وجود وصول للبيانات ضع NOT VERIFIED.

أنتج matrix 6×9: المنتج/مدخل demo/نجاح بدون حساب/تفاعلات/حالة التطبيق/Trial/موبايل/خصوصية/الدليل. صنف الموانع P0/P1/P2 وأعط قرارات مستقلة **PUBLIC_DEMO_GO/NO-GO**, **TRIAL_48H_GO/NO-GO**, **ENTERPRISE_GO/NO-GO**. لا تكتب GO إلا بالدليل، ولا تعمل Push/Deploy/DNS/Neon edits من غير تفويض واضح.

---

## الروابط والأدلة

- [GitHub — BRIGHTAI](https://github.com/YEEEAE/BRIGHTAI)
- [مقارنة baseline مع أحدث Commit مفحوص](https://github.com/YEEEAE/BRIGHTAI/compare/a6f3551071bb12102957f556bb3badb21cb80b3c...54ba24cfe2531a5646e0c206fae7328d2e72a2e2)
- [Executive Closure](https://github.com/YEEEAE/BRIGHTAI/blob/main/Audit/brightai-closure/EXECUTIVE-CLOSURE.md)
- [مكوّن المختبرات الحالي](https://github.com/YEEEAE/BRIGHTAI/blob/main/src/components/ProductExperience.astro)
- [الهوية المرئية الحالية](https://github.com/YEEEAE/BRIGHTAI/blob/main/src/styles/variables.css)
- [مخطط منح الاستكشاف](https://github.com/YEEEAE/BRIGHTAI/blob/main/migrations/0033_aigas_exploration.sql)
- [Runtime Blueprint](https://github.com/YEEEAE/BRIGHTAI/blob/main/render.yaml)
- [BRIGHT AI الموقع](https://brightai.live/)
- [BRIGHT AI المنتجات](https://brightai.live/products/)
- [Lxium Interactive AI Governance](https://lxium.com/aigov) و[Verko Product Demo](https://verko.ai/demo): مراجع بنية تجربة، وليست قوالب للنسخ.

**تحفظ:** نتائج Neon والمتصفح قراءة مباشرة بتاريخ 16 نوفمبر 2026، وأوصاف التغييرات من GitHub وتقارير المستودع. Render Connector: FORBIDDEN، لذلك لم أتحقق من Deploy فعلي. **لم أجرِ أي تعديلات على GitHub أو Neon أو Render أو الموقع في هذه المحادثة.**
