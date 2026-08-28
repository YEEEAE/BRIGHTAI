## [2026-08-28] — QC-UX-RESEARCH-PROGRAM-001: تجهيز برنامج أبحاث UX تشغيلي حسب الأدوار

### تم التنفيذ
- أنشأت برنامج بحث موحّد لتطبيق `apps/qc-task-manager` يغطي أسئلة البحث، معايير المشاركين، السكربت، السيناريوهات، المقاييس، نموذج الملاحظة، synthesis، severity، وimpact readout.
- فصلت شرائح Employee وSupervisor وManager وLab operator/reviewer وAdmin، مع هدف 5–8 مشاركين لكل شريحة عند الحاجة، ومنعت خلط النتائج بين الأدوار.
- غطيت رحلات create/save/resume/submit/review/reject-rework/approve/search/investigate failure/calibration/report-export، وربطت كل مهمة بنتيجة قابلة للملاحظة بدون تغيير business rules.
- أضفت SEQ بعد كل مهمة وSUS القياسي بعد الجلسة، مع تعريف task success/time/errors/assistance/recovery وقواعد التقرير حسب الدور.
- ثبّتُّ أن النتائج البشرية وbaseline/comparison غير موجودة قبل تنفيذ الجلسات، وأن الاختبارات الآلية لا تكفي لإعلان UX success؛ baseline telemetry يستمر وفق عقد الخصوصية ومدته 14 يومًا.
- ربطت الخطة المختصرة الحالية بالبرنامج الكامل، مع بقاء `PILOT-UAT.md` و`UX-MEASUREMENT.md` مصادر تشغيلية مكملة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-RESEARCH-PROGRAM.md`
- `apps/qc-task-manager/docs/UX-USABILITY-TEST-PLAN.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:ux-telemetry` ✅.
- `git -c core.fsmonitor=false diff --check` ✅.
- لم يُشغّل build/typecheck: التغيير وثائقي فقط ولا يلمس كود التطبيق.

### النتيجة
- **الحالة:** نجح
- **مختصر:** برنامج البحث جاهز للتنفيذ الفعلي، بدون اختلاق نتائج أو إعلان نجاح UX قبل جلسات المشاركين وتحليلها حسب الدور.

### ملاحظات / مشاكل مفتوحة
- UAT البشري، VoiceOver، baseline الفعلي، ونتائج المشاركين ما زالت مطلوبة ولم تُنفّذ في هذه الدفعة.
- بقي حذف غير متعلق ظاهرًا في `audit/brightai-sa-keyword-research.csv` كما هو ولم ألمسه.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — إنشاء إضافة BRIGHTAI SEO لأبحاث السعودية وGEO

### تم التنفيذ
- أنشأت إضافة Codex شخصية باسم `brightai-seo` ضمن `~/plugins/brightai-seo`.
- أضفت أربع مهارات تشغيلية: `saudi-keyword-research` و`seo-audit` و`topical-authority` و`ai-visibility`.
- ربطت الإضافة بالـ marketplace الشخصي `personal` مع سياسة تثبيت `AVAILABLE` ومصادقة `ON_INSTALL`.
- صممت المهارات لتستخدم نطاق BRIGHTAI المعتمد `https://brightai.live`، وتستفيد من DataForSEO MCP الموجود في إعداد المشروع بدون تخزين أسرار.
- غطت المهارات بحث الكلمات السعودية، التدقيق الشامل، خريطة السلطة الموضوعية، وقياس ظهور BRIGHTAI في منصات الذكاء مع فصل القياس الفعلي عن الاستنتاج.

### الملفات المتأثرة
- `/Users/yzydalshmry/plugins/brightai-seo/.codex-plugin/plugin.json`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/saudi-keyword-research/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/seo-audit/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/topical-authority/SKILL.md`
- `/Users/yzydalshmry/plugins/brightai-seo/skills/ai-visibility/SKILL.md`
- `/Users/yzydalshmry/.agents/plugins/marketplace.json`

### التحقق
- `validate_plugin.py /Users/yzydalshmry/plugins/brightai-seo` ✅
- فحص JSON للـmanifest والـmarketplace ✅
- عدد المهارات المنشأة: 4 ✅
- لا توجد أسرار أو بيانات اعتماد داخل الإضافة ✅
- لم يُنفذ build للمشروع؛ الإضافة مستقلة عن كود الموقع ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** الإضافة جاهزة للاستخدام في Codex كحزمة SEO/GEO متخصصة لـBRIGHTAI، والـcommit أو push غير منفذين.

### ملاحظات / مشاكل مفتوحة
- تشغيل DataForSEO الفعلي يحتاج وجود `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` في البيئة وإعادة تشغيل Codex إذا لم يظهر الخادم.

## [2026-08-28] — QC-AI-SECURITY-UX-001: توضيح حدود AI وحالات الجلسة والصلاحيات

### تم التنفيذ
- وحّدت عرض `AiReviewPanel` بإضافة مؤشر ثابت يوضح أن AI advisory فقط.
- فصلت نتيجة AI بصريًا إلى `System data` و`AI suggestion` و`User decision`، مع إبقاء تفاصيل JSON داخل disclosure قابل للفتح.
- أضفت حالة آمنة لانتهاء الجلسة (401) مع رابط تسجيل دخول، وحالة صلاحية (403) تمنع إعادة المحاولة العمياء وتشرح مسار طلب الوصول.
- أبقيت حالة مزود AI غير المهيأ منفصلة، بحيث يتعطل تشغيل AI فقط وتستمر مسارات QC الأساسية يدويًا.
- أضفت حراسة UX Writing تمنع رجوع حدود القرار البشري ورسائل الاسترجاع الأساسية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/AiReviewPanel.tsx`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:ux-writing` ✅ — 14/14.
- `pnpm --dir apps/qc-task-manager run test:interaction-feedback` ✅ — 25/25.
- `pnpm --dir apps/qc-task-manager run test:ai-foundation` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-features` ✅.
- `pnpm --dir apps/qc-task-manager run test:ai-lab` ✅.
- `pnpm --dir apps/qc-task-manager run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار AI أوضح كاقتراح غير ملزم، مع مسارات استرجاع آمنة لانتهاء الجلسة وفشل الصلاحية، بدون تغيير API أو RBAC أو workflow أو قرار QC بشري.

### ملاحظات / مشاكل مفتوحة
- ما زال فحص UAT البشري وVoiceOver على أجهزة فعلية مطلوبًا؛ لم يُجرَ في هذه الدفعة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — SEO-DOMAIN-CANONICAL-002: قرار النطاق المعتمد brightai.live + بناء ملف الكلمات عليه

### تم التنفيذ
- المستخدم حسم القرار: **`brightai.live` هو النطاق المعتمد والوحيد** — أي تحليل سابق افترض `brightai.site` كنطاق تجاري ظاهر أُلغي.
- تحققت قراءةً فقط أن المصدر مبني بالفعل على `brightai.live` (`astro.config.mjs: site: 'https://brightai.live'` + كل إدخالات kernel/سايت ماب) — **صفر تعديل مطلوب في المصدر**.
- حدّثت `target_url` في CSV الكلمات من مسارات نسبية إلى روابط مطلقة على `https://brightai.live/...` — 45/45 صف، و0 ذكر لـ`brightai.site`.
- لم أتلمس أي ملف مشروع آخر — لا build ولا إعدادات ولا صفحات، بالأمر الصريح من المستخدم.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `grep -c 'https://brightai.live'` = 45 ✅ و`grep -c 'brightai.site'` = 0 ✅
- `pending_credentials` = 45 (أعمدة DataForSEO محفوظة كما هي) ✅
- قراءة `astro.config.mjs` ✅ — النطاق `brightai.live` مؤكد من المصدر

### النتيجة
- **الحالة:** نجح
- **مختصر:** ملف الكلمات صار مبنيًا صراحةً على النطاق المعتمد `brightai.live`، والمصدر أصلًا متوافق معه — ظهور `brightai.site` في نتائج البحث مسألة إشارات خارجية (فهرسة/ملكية النطاق الثاني عند Google) مو تعارض داخل الكود.

### ملاحظات / مشاكل مفتوحة
- أُغلق سؤال النطاق P1 المسجل في SEO-KEYWORD-RESEARCH-001 بقرار المستخدم.
- بقي مفتوحًا (خارج نطاق اليوم): تعامل محركات البحث مع `brightai.site` (إعادة توجيه 301 أو إزالة فهرسته) — يُنفّذ فقط إذا طلب المستخدم.
- DataForSEO ما زال `pending_credentials` (45 صفًا) — ترتيب الأولوية بالـvolume ينتظر تفعيل الاعتماد.


## [2026-08-28] — SEO-KEYWORD-RESEARCH-001: تحليل الصفحات الأساسية وتجهيز CSV لكلمات السعودية

### تم التنفيذ
- حللت الصفحات الأساسية محليًا: الرئيسية، `about`, `services`, `solutions`, صفحة الحل، `trust`, `contact`, `blog`, `pricing`, وتقييم جاهزية حوكمة AI.
- قارنت إشارات المصدر مع نتائج البحث الحية؛ النطاق الظاهر للجمهور هو `brightai.site` بينما المصدر يضع `brightai.live` في `astro.config.mjs` وcanonical وsitemap، وسُجّلت كنقطة P1 قبل الاعتماد على إشارات البحث.
- راجعت إشارات المحتوى الحالية: حوكمة AI، AI Firewall، PDPL، NCA ECC، SDAIA، ISO 42001، ملفات الأدلة، الموافقات البشرية، القطاعات والمدن السعودية.
- أنشأت CSV يضم 45 فرصة كلمات مفتاحية عربية/إنجليزية، مع التجميع، نية البحث، صفحة الهدف، مرحلة القمع، الأولوية، long-tail، وطريقة السيطرة المقترحة.
- امتنعت عن اختلاق volume أو CPC أو competition؛ كل أعمدة DataForSEO موسومة `pending_credentials` لأن أداة DataForSEO غير ظاهرة كأداة MCP قابلة للاستدعاء في الجلسة وبيئتا `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` غير موجودتين.

### الملفات المتأثرة
- `download/seo/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص CSV ✅ — 45 صف بيانات + رأس الملف.
- `git -c core.fsmonitor=false diff --check` — لم يُنفّذ بعد هذا السجل؛ فحص Git العادي تأثر بخطأ بيئي في `fsmonitor_ipc`.
- تحليل حي عبر نتائج البحث ✅ — تم التحقق من ظهور `brightai.site` وصفحة الحل الرئيسية.
- DataForSEO API ⚠️ — لم يُنفّذ بسبب غياب الأداة القابلة للاستدعاء والاعتمادات، بدون طباعة أو تخزين أسرار.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تحليل الصفحات وCSV الاستراتيجي جاهزان، لكن ترتيب الكلمات حسب أعلى volume ومؤشرات السوق السعودية ينتظر تفعيل DataForSEO بعد توفير الاعتمادات وإعادة تحميل MCP.

### ملاحظات / مشاكل مفتوحة
- يلزم توحيد النطاق canonical بين `brightai.site` و`brightai.live` قبل ضخ بيانات الكلمات في قرارات الصفحات أو بناء الروابط.
- يلزم تشغيل DataForSEO على بذور CSV نفسها، ثم ملء `monthly_searches_sa`, `competition`, و`cpc_sar` وإعادة ترتيب الأولوية بالبيانات الفعلية.

## [2026-08-28] — DATAFORSEO-MCP-001: ربط خادم DataForSEO الرسمي بإعداد Codex المحلي

### تم التنفيذ
- أضفت خادم MCP الرسمي `dataforseo-mcp-server@latest` إلى إعداد المشروع عبر بروتوكول stdio.
- ضبطت التشغيل ليقرأ `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` من بيئة العملية فقط.
- امتنعت عن كتابة بيانات الدخول أو أي secret داخل المستودع أو ملف العقل أو إعداد MCP.
- تحققت من صحة صيغة TOML وظهور خادمي MCP: `caveman-shrink` و`dataforseo`.

### الملفات المتأثرة
- `.codex/config.toml`
- `.agents/mind/01-mind-latest.md`

### التحقق
- تحليل TOML ✅ — `TOML_OK`.
- فحص `git diff --check` ✅.
- لم يُشغّل اتصال API فعليًا: متغيرات الاعتماد لم تُخزّن أو تُطبع حفاظًا على السرية.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** إعداد DataForSEO MCP صار مربوطًا محليًا، ويبقى تفعيل الاعتماد وإعادة تشغيل Codex بمتغيرات البيئة، ثم اختبار `api_request`.

### ملاحظات / مشاكل مفتوحة
- بيانات الدخول التي أُرسلت في المحادثة يُفضّل تدويرها من لوحة DataForSEO بعد التحقق.
- لا يوجد commit أو push.

## [2026-08-28] — QC-UX-WRITING-001: توحيد لغة المنتج والـmicrocopy

### تم التنفيذ
- أضفت عقد UX Writing موحّدًا يغطي النبرة، قاموس المصطلحات، الأفعال، الأخطاء، الحالات الفارغة، الصلاحيات، AI، التوطين، وإمكانية الوصول.
- عرّفت المصطلحات التشغيلية الأساسية: Save draft، Submit for review، Approve، Reject، Return for changes، Reopen task، Complete task، Pass/Fail/Hold، وRetest required.
- حسّنت رسائل `OperationalState` لتشرح الحالة والخطوة التالية بدون لوم المستخدم أو كشف تفاصيل داخلية.
- حسّنت رسائل أخطاء وإجراءات `TaskLifecycle` و`CommentBox` و`AttachmentUploader` لتوضح ما حدث وما الإجراء التالي، ووضحت تسميات evidence وoverride.
- وضحت في `AiReviewPanel` أن المخرجات اقتراحات advisory فقط، وأن AI لا يعتمد أو يرفض أو يقرر نتائج QC.
- وضحت `ReviewDeleteRequestDialog` أن الإجراء هو الموافقة على الحذف الدائم، مع صياغة أوضح لسبب الرفض.
- أضفت حارس `test:ux-writing` وربطته بالـmanifest، وحدّثت عقد interaction feedback بعد إزالة عبارات recovery القديمة.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-WRITING.md`
- `apps/qc-task-manager/scripts/test-ux-writing.mjs`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/src/components/{OperationalState,TaskLifecycle,CommentBox,AttachmentUploader,AiReviewPanel,ReviewDeleteRequestDialog}`

### التحقق
- `pnpm run test:ux-writing` ✅ — 10/10.
- `pnpm run test:interaction-feedback` ✅ — 25/25.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:manifest` ✅ — 64 canonical suites و28 canonical E2E.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت لغة العمليات والرسائل الحساسة للمستخدم في الأسطح المشتركة، مع توثيق قاموس قابل للتوسع وحراسة تمنع رجوع المصطلحات القديمة، بدون تغيير RBAC أو workflows أو business rules أو API contracts.

### ملاحظات / مشاكل مفتوحة
- يلزم UAT بشري للتأكد من أن المصطلحات الإنجليزية الحالية تطابق لغة فرق QC، وفحص VoiceOver على الأجهزة الفعلية حسب السجلات السابقة.
- توجد تغييرات مستخدم سابقة في الشجرة وتم الحفاظ عليها؛ لم يحدث commit أو push.

## [2026-08-28] — QC-MOTION-DIGITAL-ART-001: توحيد لغة الحركة التشغيلية في QC Task Manager

### تم التنفيذ
- أزلت حركة رفع البطاقات (`hover:-translate-y`) من dashboard وLab Management، وأبقيت feedback بصريًا عبر shadow transition صريح.
- استبدلت الانتقالات العامة بخصائص محددة مع `duration-qc-standard` و`ease-qc-standard` في بطاقات dashboard وLab وdocuments وnotifications.
- أزلت `transition-all` من نقاط الرسوم التفاعلية؛ تغيّر نصف قطر الدائرة صار فوريًا بدل تحريك خاصية غير مطلوبة تشغيليًا.
- أضفت حراسة مصدرية للحركة تمنع `transition-all` وgeneric transitions وhover translate/scale داخل التطبيق، مع استمرار حراسة reduced motion العامة.
- وثّقت motion language: 120ms للحركة السريعة، 180ms للحركة القياسية، حد تشغيلي 240ms، ورفض page entrance/parallax/loops/KPI animation والـ decorative art في الشاشات الحرجة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/lab/{index,management}.astro`
- `apps/qc-task-manager/src/pages/lab/documents/index.astro`
- `apps/qc-task-manager/src/components/{DashboardCharts,LabDashboardCharts}.tsx`
- `apps/qc-task-manager/src/components/NotificationCard.astro`
- `apps/qc-task-manager/src/components/lab/LabFailRateChart.tsx`
- `apps/qc-task-manager/scripts/test-lab-ux-performance.mjs`
- `apps/qc-task-manager/docs/UI-DESIGN-SYSTEM.md`

### التحقق
- `pnpm run test:lab-ux-performance` ✅ — 9/9.
- `pnpm run test:ui-consistency` ✅ — 181/181، و`test:manifest` ✅ — 63 canonical و28 E2E.
- `pnpm run test:badge-contrast` ✅ — 13/13، و`test:responsive-e2e-contract` ✅.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، وresponsive 648/0 وa11y 86/0.
- `git -c core.fsmonitor=false diff --check` ✅، وmotion inventory بعد التعديل بلا violations مستهدفة.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت الحركة في واجهة QC مقصودة ومحدودة لدعم فهم الحالة، بدون حركة زخرفية أو تغيير في RBAC أو workflows أو database أو business rules أو dependencies.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا؛ الاختبارات الآلية لا تستبدله.
- مهارة `motion-and-zoom` المطلوبة غير متاحة في جلسة التنفيذ؛ تم تطبيق المهارات المتاحة ذات الصلة.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-INTERACTION-FEEDBACK-001: توحيد حالات التفاعل والتغذية الراجعة

### تم التنفيذ
- أضفت `ActionFeedback` مشتركًا لمناطق live ثابتة، مع أدوار مختلفة للأخطاء والتحديثات الروتينية، ونبرات semantic متوافقة مع نظام التصميم.
- وحّدت feedback المحلي في التعليقات، المرفقات، مراجعة AI، الإشعارات، طلبات الحذف، وتحديث المهمة، مع رسائل نجاح وفشل تشرح الخطوة التالية وتحافظ على المدخلات.
- أضفت `aria-busy` وحالات loading محلية، ووضّحت labels أثناء التنفيذ، وحسّنت أزرار الإجراءات بحالات focus-visible وpressed وهدف لمس لا يقل عن 44px.
- أضفت حراسة مصدرية `test-interaction-feedback` وربطتها بالـ manifest لضمان وجود feedback قابل للاسترجاع في الـ React islands الحرجة.
- حدّثت `AppButton` ليعرض حالة pressed بوضوح عبر الـ variants الحالية، بدون إضافة dependency أو تغيير endpoint أو workflow أو RBAC.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/ActionFeedback.tsx`
- `apps/qc-task-manager/src/components/ui/AppButton.astro`
- `apps/qc-task-manager/src/components/{CommentBox,AttachmentUploader,AiReviewPanel,MarkReadButton,MarkAllReadButton,DeleteRequestDialog,TaskUpdatePanel}.tsx`
- `apps/qc-task-manager/scripts/test-interaction-feedback.mjs`
- `apps/qc-task-manager/package.json`
- `apps/qc-task-manager/scripts/test-manifest.mjs`

### التحقق
- `pnpm --dir apps/qc-task-manager test:interaction-feedback` ✅ — 25/25.
- `pnpm typecheck` ✅ — 0 errors، 0 warnings، و26 hints غير حاجبة موجودة مسبقًا.
- `pnpm test` ✅ — 63 canonical suites بدون فشل.
- `pnpm build` ✅ — Complete؛ تحذيرات Astro/Vite الديناميكية المعروفة فقط.
- `pnpm e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، مع اختبار restart persistence؛ احتاج تشغيل الخادم المحلي خارج sandbox بعد فشل EPERM قبل بدء الاختبارات.
- `pnpm test:ui-consistency` ✅ — 181/181، و`git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند المستخدم feedback متوقع ومباشر للأفعال المحلية عالية التكرار والحساسية، مع recovery واضح، بدون المساس بقواعد المجال أو سلامة التدقيق.

### ملاحظات / مشاكل مفتوحة
- ما زال UAT البشري على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-ADVANCED-FORM-UX-001: رحلة أقسام آمنة ومراجعة صريحة لنموذج اختبارات المختبر

### تم التنفيذ
- حسّنت `LabTestForm` بعقد حالات حفظ صريحة (`saved`, `unsaved`, `saving`, `failed`) مع رسالة حالة live واضحة وحماية فقدان التعديلات القائمة.
- صححت تنقل الأقسام ليطابق ترتيب النموذج الفعلي من 1 إلى 8، ويعرض نص الحالة `Not started` / `In progress` / `Complete` / `Error` بدل الاعتماد على رمز أو لون فقط.
- أضفت خطوة مراجعة قابلة للتركيز قبل إرسال اختبار عالي الأثر إلى طابور المراجعة، مع ملخص المنتج وعدد العينات والنتيجة، وإرجاع التركيز إلى زر الإرسال عند اختيار `Keep editing`.
- حسّنت ملخص أخطاء الإرسال ليكون focusable، وربطت أخطاء الحقول المطلوبة المجاورة بالـ controls عبر `aria-describedby`، وجعلت رابط أخطاء شبكة العينات يركز أول control قابل للاستخدام داخل القسم.
- ثبّتُّ أن تغيير Connector Type يسجل أن المستخدم لمس الحقل، فلا يعيد Product Master الكتابة فوق اختياره.
- حدّثت اختبار E2E لنموذج المختبر ليؤكد خطوة `Confirm and send for review`، وأضافت حراسة form productivity لعقد المراجعة وحالات الحفظ وحالات الأقسام.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/scripts/e2e-lab-form.mjs`
- `apps/qc-task-manager/scripts/test-form-productivity.mjs`

### التحقق
- `pnpm run test:form-productivity` ✅ — 20/20.
- `pnpm run test:lab-form` ✅ — 72/72.
- `pnpm run test:lab-ux-presentation` ✅ — 14/14.
- `pnpm run test:ui-consistency` ✅ — 181/181.
- `pnpm run test:responsive-e2e-contract` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints غير حاجبة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm run e2e:acceptance` ✅ — 30/30 suite، 3047+ assertion، و`lab-form` 141/0 وresponsive 648/0 وa11y 86/0.
- `pnpm test` ✅ — 62 canonical suites، بدون فشل.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار نموذج اختبار المختبر يوجّه المستخدم عبر أقسام صحيحة، يحافظ على سياقه عند الخطأ، ويطلب تأكيدًا صريحًا قبل الإرسال، بدون تغيير قواعد المجال أو RBAC أو CSRF أو schema.

### ملاحظات / مشاكل مفتوحة
- مهارة `zeigarnik-effect` غير متاحة في جلسة التنفيذ؛ تم تطبيق مبادئ chunking/progressive disclosure من المهارات المتاحة.
- ما زال فحص UAT البشري الفعلي على أجهزة حقيقية وVoiceOver مطلوبًا حسب سجل المشروع؛ الاختبارات الآلية لا تستبدله.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-CORE-UI-CONSOLIDATION-001: توحيد headers/actions/alerts/empty states في الأسطح عالية الاستخدام

### تم التنفيذ
- رحّلت header صفحة `/dashboard` و`/search` إلى `PageHeader` مع eyebrow ووصف وaction row متجاوب، بدون تغيير المسارات أو محتوى التشغيل.
- رحّلت actions الأساسية في dashboard (فتح التقارير، تطبيق الفلاتر، المسح) وعمليات التصدير/حفظ الفلاتر في البحث إلى `AppButton` مع ترتيب primary/secondary واضح.
- رحّلت أزرار CTA في `EmptyState` إلى `AppButton`، فصار نمط الحالة الفارغة يعتمد على نفس focus/height/semantic token contract.
- استبدلت focus ring اليدوي في روابط تنقل أقسام dashboard بعقد `qc-focus`، مع إبقاء روابط الأقسام والـanchors كما هي.
- وحّدت خطأ dashboard مع `Banner` بحالة error وعنوان واضح، بدل alert markup محلي.
- وسّعت `test-ui-consistency` ليحرس استخدام `PageHeader` في dashboard/search.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/src/pages/search.astro`
- `apps/qc-task-manager/src/components/EmptyState.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 181/181.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:badge-contrast` ✅ — كل الأزواج ضمن WCAG 2.2 AA.
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** توحّدت أعلى أنماط العرض تكرارًا في dashboard/search وEmptyState باستخدام primitives الحالية، مع بقاء server-side filtering وRBAC وPOST/GET contracts وسلوك workflow بدون تغيير.

### ملاحظات / مشاكل مفتوحة
- بقيت بعض raw controls وcard/action markup في dashboard/search، إضافةً إلى صفحات الإدارة، ضمن الترحيل التدريجي route-sized؛ لم يتم اختراع abstraction عام جديد لها.
- لم يتم تشغيل full `pnpm test` أو `pnpm e2e:acceptance` في هذا workstream؛ تم تشغيل البوابات المتأثرة مباشرة وbuild/typecheck.
- لم يحدث commit أو push أو deploy.

## [2026-08-28] — QC-IA-NAV-WAYFINDING-001: تنظيم IA وتحسين التنقل والـ breadcrumbs

### تم التنفيذ
- وثّقت inventory فعلي للمسارات، التنقل العام والمحلي للمختبر، تنقل الأدوار، روابط الأدوات، والعلاقات التشغيلية بين السجلات في وثيقة IA مستقلة.
- ربطت نموذج التنقل بالمهام الفعلية ومسارات `Task → Finding → CAPA → Evidence` و`Product → Test → Review → Retest → Report` وغيرها، مع تثبيت أن RBAC على الخادم هو المصدر authoritative.
- أضفت breadcrumbs مشتركة لصفحات تفاصيل Tasks وFindings مع الحفاظ على الروابط الحالية وسلوك الرجوع الخاص بالدور.
- حسّنت أهداف اللمس وحالات التركيز في مكوّن Breadcrumbs لتناسب الجوال ولوحة المفاتيح.
- أضفت حراسة consistency تمنع رجوع صفحات تفاصيل Tasks وFindings بدون Breadcrumbs.
- أصلحت تباين أزرار Pagination المعطّلة في السطح المحايد، بعد ما كشف فحص الوصول الحالة المشتركة في `/lab/documents` و`/lab/search`.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/INFORMATION-ARCHITECTURE.md`
- `apps/qc-task-manager/src/components/Breadcrumbs.astro`
- `apps/qc-task-manager/src/pages/tasks/[id].astro`
- `apps/qc-task-manager/src/pages/findings/[id].astro`
- `apps/qc-task-manager/src/components/ui/Pagination.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `node scripts/test-ui-consistency.mjs` ✅ — 179/179
- `node scripts/architecture-guard.mjs` ✅
- `node scripts/test-lab-ux-presentation.mjs` ✅ — 14/14
- `node scripts/test-responsive-e2e-contract.mjs` ✅
- `node scripts/verify-badge-contrast.mjs` ✅
- `astro check` ✅ — 0 errors، 0 warnings، 26 hints موجودة مسبقًا
- `NODE_ENV=production astro build` ✅
- `node scripts/e2e-acceptance.mjs` ✅ — 30/30 suites، 3047+ assertions parsed، و86/86 accessibility و648/648 responsive
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** اكتمل workstream تنظيم IA والـ wayfinding بدون تغيير URLs أو RBAC أو workflows أو DB أو CSRF، مع اجتياز بوابة القبول الكاملة.

### ملاحظات / مشاكل مفتوحة
- ما تم تنفيذ جلسة card sort/tree testing بشرية ولا فحص VoiceOver كامل أو اختبار zoom بنسبة 200%؛ تبقى ضمن UAT اليدوي.
- ما صار `git commit` ولا `git push`؛ التغييرات المحلية جاهزة للمراجعة.

## [2026-08-28] — QC-STATUS-SEMANTICS-001: توحيد دلالات الحالات في QC Task Manager

### تم التنفيذ
- وحّدت أدوار العرض إلى `neutral`, `info`, `pending`, `warning`, `success`, `danger`, و`blocked` داخل `statusTones.ts`، مع إبقاء aliases قديمة معلنة للتوافق فقط.
- أضفت adapters مستقلة لـ Tasks وFindings وCAPA وEvidence وLab Tests وDocuments وEquipment وCalibration وMaintenance وRetests وNotifications وAccount وAI، بدون تغيير raw enums أو قواعد المجال.
- حوّلت `StatusBadge` و`QcStatusBadge` و`LabDocumentStatusBadge` إلى wrappers فوق `StatusPill`؛ خرائط المختبر القديمة صارت تشتق classes من الطبقة المركزية.
- جعلت fallback للحالات غير المعروفة label مقروءًا بدل عرض raw enum فقط، مع بقاء النص دائمًا حاضرًا والإشارة البصرية decorative.
- ربطت notification severity بالـsemantic tokens، وأضفت `test:status-semantics` لحراسة adapters، delegation، fallback labels، ومنع raw status colors في wrappers.
- وثقت inventory كاملًا وقواعد الترحيل والتوافق في `docs/STATUS-SEMANTICS.md` وحدّثت وثائق design-system وmigration.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/statusTones.ts`
- `apps/qc-task-manager/src/components/ui/{StatusPill,labBadgeClasses,notificationPresentation}.astro` / `.ts`
- `apps/qc-task-manager/src/components/{StatusBadge,QcStatusBadge,NotificationCard}.astro`
- `apps/qc-task-manager/src/components/lab/LabDocumentStatusBadge.astro`
- `apps/qc-task-manager/src/pages/admin/templates/index.astro`
- `apps/qc-task-manager/scripts/test-status-semantics.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/docs/{STATUS-SEMANTICS,UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`

### الأرقام
- أدوار العرض: 8 مسميات قديمة/مختلطة → 7 أدوار semantic canonical.
- الاختبارات: 62 canonical suites كاملة بدون فشل.
- typecheck: 0 errors، 0 warnings، 26 hints قديمة.

### القرارات
- فصل raw domain enums عن presentation semantics؛ السبب الحفاظ على RBAC والـworkflow والـdatabase integrity مع توحيد المعنى البصري.
- إبقاء compatibility adapters مؤقتًا بدل حذف imports دفعة واحدة؛ السبب ترحيل آمن route-sized ومنع كسر الشاشات القديمة.

### التحقق
- `pnpm test` ✅ — 62/62 canonical suites.
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 26 hints قائمة.
- `NODE_ENV=production pnpm build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm test:status-semantics` ✅؛ `test:ui-consistency` ✅؛ `test:badge-contrast` ✅؛ `test:manifest` ✅.
- اختبارات `test:lab-tests` و`test:lab-documents` و`test:lab-calibration` ✅ — calibration 97/0.
- `git diff --check` ✅؛ لم يحدث commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق عقد semantic موحّد للحالات مع adapters واضحة وحراسة regression، بدون تعديل قواعد العمل أو الصلاحيات أو بيانات SQLite.

### ملاحظات / مشاكل مفتوحة
- ما زالت بعض الشاشات الطرفية تستخدم raw status markup أو خرائط محلية خارج wrappers؛ ترحيلها هو المرحلة التالية حسب المخاطر.
- الفحص اليدوي الكامل لقارئ الشاشة والـprint/ألوان الوضع الداكن يحتاج UAT مستقل؛ الاختبارات المصدرية والتباين الآلي نجحت.

## [2026-08-28] — QC-DESIGN-SYSTEM-FOUNDATION-001: تأسيس طبقة التوكنز والعقود المشتركة

### تم التنفيذ
- أضفت semantic design tokens للألوان في `global.css` وربطتها بـ Tailwind aliases للـsurface/content/accent/focus وحالات success/warning/danger/info.
- أضفت vocabulary مقيّدًا للـspacing (`qc-*`)، radius، motion، وأدوار typography المسماة، مع عقد `qc-focus` موحّد.
- حدّثت `AppButton` و`Banner` و`PageHeader` و`Pagination` و`StatusPill` و`formPresets` لاستهلاك التوكنز semantic بدل قيم المظهر المباشرة، مع الحفاظ على اللغة والشكل الحاليين.
- أبقيت adapters القديمة مثل `LabActionButton` وstatus badges متوافقة، ووثقت ownership/deprecation وخطة ترحيل تدريجية بدون حذف أو rewrite واسع.
- أضفت حارسًا داخل `test-ui-consistency` يثبت وجود semantic tokens في الـprimitives ويمنع رجوع `focus:ring-*` داخلها.

### الملفات المتأثرة
- `apps/qc-task-manager/tailwind.config.mjs`
- `apps/qc-task-manager/src/styles/global.css`
- `apps/qc-task-manager/src/components/ui/{AppButton,Banner,ContextualHelp,PageHeader,Pagination,StatusPill,formPresets,statusTones}`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/docs/{UI-DESIGN-SYSTEM,DESIGN-SYSTEM-MIGRATION}.md`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 أخطاء و0 تحذيرات، 26 hints قديمة.
- `test:ui-consistency` ✅ — 177/177.
- `test:badge-contrast` ✅ — كل أزواج WCAG AA ناجحة.
- `test:architecture` ✅ — 114 route، وarchitecture guard ناجح.
- `test:responsive-e2e-contract` ✅؛ `test:lab-ux-presentation` ✅ — 14؛ `test:lab-ux-performance` ✅ — 7.
- `pnpm --filter @brightai/qc-task-manager test` ✅ — 61 canonical suites بدون فشل.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `git diff --check` ✅؛ ما صار commit أو push.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق أساس semantic موحّد وعقود واضحة للـprimitives عالية الاستخدام، مع ترحيل آمن تدريجي للشاشات بدل تغيير قواعد المجال أو البنية.

### ملاحظات / مشاكل مفتوحة
- بقيت الشاشات الطرفية التي تستخدم raw Tailwind classes خارج نطاق الترحيل الأول؛ ترحيلها يكون route-sized حسب الخطة والاختبارات.
- الفحص اليدوي الفعلي على 360/1440 وقارئ الشاشة يحتاج UAT مستقل؛ اختبارات responsive العقدية نجحت.

## [2026-08-28] — QC-DB-HYGIENE-025: تغطية ملفات SQLite المتتبعة في تطبيق QC

### تم التنفيذ
- وسّعت `.gitignore` الخاص بتطبيق `apps/qc-task-manager` ليغطي `*.db` و`*.db-wal` و`*.db-shm` بأي عمق.
- أضفت نمط `db/e2e_*.db*` لحماية قواعد الاختبارات وملفاتها الجانبية، مع بقاء `db/schema.sql` غير متأثر لأنه SQL.
- وسّعت `verify-security-hygiene.mjs` ليفشل صراحةً عند تتبع أي `.db` أو `.db-wal` أو `.db-shm` تحت تطبيق QC بأي عمق.
- لم أحذف أي قاعدة محلية غير متتبعة؛ قواعد `db/qc_tasks.db` و`db/e2e_*.db*` بقيت على القرص ومهملة من Git.

### الملفات المتأثرة
- `apps/qc-task-manager/.gitignore`
- `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅ — Security hygiene passed.
- `git check-ignore -v` ✅ — الجذر، WAL، SHM، و`db/e2e_*.db*` طابقت الأنماط الجديدة.
- `pnpm test` ✅ — 60 canonical suites، بدون فشل، exit 0.
- `git status --short` ✅ — لا يظهر `.db` غير مقصود؛ ملفات DB المحلية مهملة.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** حماية التجاهل وحارس hygiene مكتملان والاختبارات خضراء. الحذفان المرحّلان المذكوران في سياق المهمة غير موجودين حاليًا في الـ index أو HEAD، لذلك لم أعد staging أو حذفًا من عندي.

### ملاحظات / مشاكل مفتوحة
- لا توجد staged deletions حاليًا عند التحقق عبر `git diff --cached`؛ يلزم مراجعة جلسة/حالة Git السابقة إذا كان المطلوب استعادتهما كحذفين مرحّلين.

## [2026-08-28] — OP-01: إزالة مفتاح تقييم خاص من الملفات المتتبعة وتشديد فحص hygiene

### تم التنفيذ
- استبدلت قيمة `EVAL_CERT_SIGNING_KEY_RING` الخاصة في `README.md` بمثال public-only يستخدم placeholder التوليد.
- أزلت بيانات اتصال قاعدة البيانات المكتوبة بصيغة credentials من README واستبدلتها بقيم تعليمية placeholder.
- وثّقت للمالك توليد المفتاح محليًا، حفظ المفتاح الخاص خارج الملفات المتتبعة، وخطوة التدوير الخارجي عند الاشتباه بالتسريب.
- أضفت إلى فحص QC مسحًا لمحتوى كل ملف متتبع يرفض أي marker لمادة private key، مع إبقاء تقرير الفشل مقتصرًا على المسار دون القيمة.
- عدّلت regex في أداة تدقيق النشر لتفادي تطابق `git grep` مع كود الكاشف نفسه.

### الملفات المتأثرة
- `README.md`
- `apps/qc-task-manager/scripts/verify-security-hygiene.mjs`
- `.agents/skills/publish-project-to-github/scripts/audit_public_project.sh`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅ — Security hygiene passed.
- `node --check apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅
- فحص Git للـ private-key marker ✅ — لا نتائج حالية.
- `git diff --check` ✅
- فحص تاريخي بدون طباعة قيم ✅ — بقيت واقعة التسريب التاريخي معروفة؛ التدوير الخارجي ما زال إلزاميًا.

### النتيجة
- **الحالة:** نجح
- **مختصر:** لا توجد مادة private-key في الملفات المتتبعة حاليًا، والمثال التعليمي صار public-only مع فحص regression دائم.

### ملاحظات / مشاكل مفتوحة
- وجود المفتاح في تاريخ Git لا يُلغى بتعديل الملفات الحالية؛ يلزم تدوير/إبطال المفتاح خارجيًا وفق OP-01.

## [2026-08-28] — CP-01: تحديث تأكيدات بحث المختبر وإخضرار بوابة القبول

### تم التنفيذ
- استبدلت التأكيدات الثلاثة المتقادمة في سيناريو E داخل `e2e-lab-search.mjs` بتأكيد على section حالة `OperationalState` التي تحتوي heading `No search results`.
- أبقيت تحقق عزل RBAC فعليًا بإضافة شرط عدم وجود أي صفوف `tbody tr` لكل بحث موظف عن اختبار/عينة/lot مملوك لموظف آخر.
- لم أعدّل `src/lib/lab/search.ts` أو نص الواجهة، وأبقيت إصلاح locators الموجود في `e2e-lab-form.mjs` كما هو.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-lab-search.mjs`
- `.agents/mind/01-mind-latest.md`

### الأرقام
- `test:manifest`: 60 suite canonical و28 suite E2E، خلال 0.40 ثانية.
- `e2e:acceptance`: 28 suite workflow + مرحلتا restart-persistence = 30/30 مرحلة ناجحة.
- التأكيدات: `3047+` ناجحة حسب ملخص runner؛ `lab-search` = 21/21.
- المدة: 166.804 ثانية داخل runner، و178.20 ثانية للعميلة كاملةً شاملًا البناء.

### التحقق
- `pnpm test:manifest` ✅
- `pnpm e2e:acceptance` ✅ — exit 0، وكل suites والـ persistence ناجحة.
- `astro build` ضمن بوابة القبول ✅ — تحذيرات Vite الديناميكية المعروفة فقط.
- فحص عدم لمس منطق العزل ✅ — التغيير محصور في سكربت E2E.

### النتيجة
- **الحالة:** نجح
- **مختصر:** بوابة القبول صارت خضراء بالكامل، مع بقاء تحقق عدم ظهور نتائج الموظف الآخر بدل تخفيف السيناريو إلى مجرد فتح الصفحة.

### ملاحظات / مشاكل مفتوحة
- لا يوجد ضمن نطاق CP-01؛ ما فيه commit أو push أو deploy.

## [2026-08-28] — QC-ARCH-UIUX-REVIEW-024: تدقيق معماري وواجهة وتجربة كامل لتطبيق QC Task Manager

### تم التنفيذ
- نفذت تدقيقًا تحليليًا فقط للمصدر الحالي تحت `apps/qc-task-manager/` بدون تعديل كود المنتج أو refactor أو commit أو push.
- قرأت العقل الحي وتعليمات المشروع وREADME/config/skills المناسبة، ثم راجعت بنية Astro SSR، الصفحات، layouts، React islands، UI primitives، domain libs، APIs، middleware، DB، الاختبارات والوثائق.
- تحققت من التشغيل الفعلي عبر production build وأداة screenshots على 60 شاشة/دور بعروض 390/768/1440؛ لا overflow على مستوى الصفحة ولا أخطاء H1 في العينة.
- وثقت 14 finding مرتبة: أبرزها طول dashboard، كثافة LabTestForm، hydration عالمي لـ Navbar، تكرار status/action systems، touch targets أصغر من 44px، وdrift بين PageHeader الموثق والمستخدم فعليًا.
- ولدت 8 implementation prompts مستقلة تغطي P1/P2 وبعض P3، بدون تنفيذ أي prompt.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FULL-ARCHITECTURE-UI-UX-REVIEW.md`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 errors، 26 hints.
- `pnpm --filter @brightai/qc-task-manager test:architecture` ✅ — route manifest + architecture guard.
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 164/164.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:badge-contrast` ✅ — 13/13.
- `pnpm --filter @brightai/qc-task-manager test:lab-ux-presentation` ✅ — 14 checks.
- `pnpm --filter @brightai/qc-task-manager test:lab-ux-performance` ✅ — 7 checks.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — build نجح مع تحذيرات Vite عن dynamic imports غير القابلة للتقسيم.
- `node scripts/ui-screenshots.mjs` بصلاحية تشغيل localhost ✅ — 60 screenshot/route checks على 390/768/1440، بدون page overflow أو H1 failures في التقرير.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التقرير التحليلي مكتمل ومبني على المصدر الحالي والتشغيل الفعلي؛ الحكم هو CONDITIONAL GO للاستمرار، مع أولوية لمعالجة كثافة العمل والـdesign-system drift قبل أي refactor واسع.

### ملاحظات / مشاكل مفتوحة
- لم تُنفذ أي إصلاحات؛ الـimplementation prompts للتنفيذ اللاحق فقط.
- الفحص اليدوي الكامل لقارئ الشاشة، 200% zoom، high-contrast، وقيم القياس/النصوص المختلطة القصوى ما زال يحتاج UAT مركزًا.
- بقيت حالة الشجرة السابقة كما هي: تعديل `e2e-lab-form.mjs`، حذف ملفات DB المرحّل، وتقارير ULTIMATE والـfixtures غير المتتبعة؛ لم ألمسها.

## [2026-08-28] — QC-ULTIMATE-AUDIT-023: تدقيق جنائي شامل ثالث (ULTIMATE) — CONDITIONAL GO مع تبرئة RBAC بحث المختبر وإثبات أن بوابة القبول معطلة بسبب اختبار متقادم

### تم التنفيذ
- جمّدت الواقع: HEAD `3b25585b` على `main`، شجرة dirty (تعديل `e2e-lab-form.mjs` المعلق + حذف staged لملفي DB + `scripts/__fixtures__/` غير متتبع).
- شغّلت 17 بوابة/أمر بأكواد خروج موثقة في `/tmp/qc-gates{,2,5,6}.log`: typecheck ✅ · manifest ✅ (60/28) · route-manifest ✅ (114/25/6) · parity ✅ (38/38) · migrations ✅ · architecture ✅ · ui-consistency ✅ (164) · full-test ✅ (60/60) · build ✅ · db-doctor ✅ · production-operations ✅ (restore/restart/integrity/FK/chains) · deployment-contract ✅ (21) · performance ✅ · security-hygiene ✅ · e2e-reports ✅ (standalone) · e2e-responsive ✅ (648/648) — و**e2e:acceptance ❌ exit 1** (26/29 suite قبل التوقف).
- **P1-001 بجذر جديد موثق:** فشل القبول سببه 3 تأكيدات متقادمة في `e2e-lab-search.mjs:282,287,292` تنتظر نص `No matching laboratory records found` بينما الفعلي `No search results` (OperationalState.astro:8). **عزل RBAC نفسه بُرّئ تشغيليًا** بمسبار مباشر على `searchLab()`: موظف→اختبار/عينة/lot زميله = 0 نتائج؛ مدير = يراها (شرط tested_by/created_by في search.ts:192-195 يعمل).
- **P1-002 مُعاد التحقق مستقلًا:** `README.md:33` يحوي Ed25519 **خاص** حقيقي (تحقق برمجي بلا طباعة القيمة) — الإزالة كودية + التدوير فعل مشغّل.
- اكتشافات جديدة: skills-lock.json منهار (164/164 هاش لا يطابق، 11 مدخلًا ميتًا، 201 غير مسجل مقابل 364 مجلدًا سليمة ذاتيًا) · schema.sql ينقصه 11 كائنًا حيًا (ai_audit_log + 7 فهارس + uq_notifications_dedupe_key) · .gitignore لا يغطي .db بجذر التطبيق (سبب تسرب `qc_tasks 3.db` أصلًا) · مسار ميت `/api/tasks/suggestions` بلا مستهلك · مثال DEPLOYMENT.md schemaVersion:10≠38 · إحالات مهارات ميتة في design-pipeline.
- وكلاء التدقيق المتوازيون الستة فشلوا جميعًا (Provider authentication failed) — نفّذت التدقيق كاملًا بالجلسة الرئيسية (فحوص ساكنة + مسبار RBAC + مقارنة schema + مسح sha256 للمهارات).
- أنشأت 4 ملفات: `docs/ULTIMATE-EVIDENCE-LEDGER.md` (كل الأدلة/الأوامر/الأكواد) · `docs/ULTIMATE-SYSTEM-AUDIT.md` (الدرجات) · `docs/ULTIMATE-SKILL-COVERAGE.md` (364 مهارة كاملة) · `docs/ULTIMATE-CLOSING-PROMPTS.md` (10 مولدة من النتائج: CP-01..06 + OP-01..03 + CG-01 + مصفوفة تتبع صفر يتيمة).

### الملفات المتأثرة
- `apps/qc-task-manager/docs/ULTIMATE-EVIDENCE-LEDGER.md`
- `apps/qc-task-manager/docs/ULTIMATE-SYSTEM-AUDIT.md`
- `apps/qc-task-manager/docs/ULTIMATE-SKILL-COVERAGE.md`
- `apps/qc-task-manager/docs/ULTIMATE-CLOSING-PROMPTS.md`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### الأرقام
- البوابات: 16 ✅ / 1 ❌ (القبول — اختباري لا أمني) | P0=0 · P1=2 · P2=4 · P3=6
- المهارات: 364 مجلدًا (تطابق name=100%) مقابل 175 مدخل سجل منهار | APPLIED=38 · NOT_APPLICABLE=326 · مراجع ميتة=2
- الدرجات: Technical Completeness **92%** · Company Pilot Readiness **80%** · Overall **92%**

### القرارات
- **تصنيف CONDITIONAL GO** (لا P0؛ الحجب: إخضار القبول CP-01، تدوير المفتاح OP-01، UAT بشري OP-02، نشر حي OP-03).
- فصل برومبتات الإصلاح عن أفعال المشغّل: كل ما هو خارج قدرة الوكيل (تدوير/نشر/UAT/توريد WI) صار حزم OP صريحة — لا ادعاء تنفيذ آلي لها.

### التحقق
- 17 أمرًا بتواريخ بداية/نهاية وأكواد خروج في سجلات /tmp qc-gates*.log.
- مسبار RBAC على قاعدة /tmp مؤقتة عبر الدالة الحقيقية (نُظفت بعد الفحص) — القاعدة الحقيقية `db/qc_tasks.db` لم تُلمس (mtime سابق لأي إقلاع خادم).
- مسح sha256 برمجي كامل للمهارات + مقارنة sqlite_master لقاعدة طازجة ضد schema.sql.

### النتيجة
- **الحالة:** نجح (التدقيق مكتمل بالأدلة) — حكم النظام: **CONDITIONAL GO**
- **مختصر:** كل البوابات خضراء ما عدا بوابة قبول معطلة بتأكيد نصي متقادم (إصلاحها سطر واحد CP-01) ومفتاح خاص بانتظار التدوير؛ لا يوجد أي P0.

### ملاحظات / مشاكل مفتوحة
- إصلاح `e2e-lab-form.mjs` الموجود في شجرة العمل تحقق ضمن هذا التدقيق (141/141) ويبقى غير ملتزم — الالتزام على المستخدم.
- حذف ملفي DB المُرحّل (staged) ينتظر commit المستخدم.
- WI ما زال SOURCE-BLOCKED (صفحات 2/3 و3/3) وسياسة حجب/تحذير المعايرة المنتهية قرار إدارة.
- UAT البشري والنشر الحي غير منجزين — شرطان للترقية إلى GO.

## [2026-08-28] — COPY-SKILLS-002: نسخ `.agents/skills` إلى دليل المستخدم المنزلي

### تم التنفيذ
- نسخت مجلد `.agents/skills` كاملًا (متكررًا بـ`cp -R`) من جذر المشروع إلى `/Users/yzydalshmry/.agents/skills`.
- الوجهة (`/Users/yzydalshmry/.agents/`) كانت موجودة وفيها `.skill-lock.json` و`AGENTS.md` و`plugins/` — لكن ما كان فيها `skills/`؛ أُنشئ الآن.
- لم ألمس الملفات الأصلية في المشروع، ولا عدّلت `.skill-lock.json` أو `AGENTS.md` المنزلي.

### الملفات المتأثرة
- `/Users/yzydalshmry/.agents/skills/` (الوجهة الجديدة، ~366 مهارة/مجلد فرعي)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد المجلدات: المصدر 755 = الوجهة 755 ✅
- عدد الملفات: المصدر 1384 = الوجهة 1384 ✅
- `diff -rq` بين المجلدين: **صفر اختلافات** (نسخة مطابقة حرفيًا) ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** نُسخ مجلد المهارات كاملًا إلى دليل المستخدم المنزلي وهوي مطابق للمصدر بنسبة 100%.

### ملاحظات / مشاكل مفتوحة
- لا يوجد. (النسخة المنطوقة/الأرقام لم تتغير؛ مجرد نسخ ملفات خارج الريبو.)

## [2026-08-28] — SUPERPOWERS-AGY-INSTALL-001: التحقق من أمر تثبيت obra/superpowers على Antigravity

### تم التنفيذ
- قرأت تعليمات `plugin-creator` وعقل المشروع قبل التعامل مع الطلب.
- تحققت من تعليمات المستودع الرسمي؛ أمر Antigravity الصحيح هو `agy plugin install https://github.com/obra/superpowers`.
- تحققت محليًا من وجود `agy`، ولم يكن مثبتًا في البيئة الحالية.
- لم تُعدّل ملفات المشروع ولم تُنفّذ عملية تثبيت جزئية.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- مرجع التثبيت الرسمي في مستودع `obra/superpowers` ✅
- `command -v agy` — غير موجود في البيئة ⚠️

### النتيجة
- **الحالة:** جزئي
- **مختصر:** أمر التثبيت الصحيح محدد، لكن تنفيذه محجوب لأن Antigravity CLI (`agy`) غير مثبت على الجهاز.

### ملاحظات / مشاكل مفتوحة
- يلزم تثبيت Antigravity CLI أو تشغيل الأمر من جهاز/بيئة فيها `agy`.

## [2026-08-28] — QC-POST-IMPLEMENTATION-MASTER-AUDIT-022: تدقيق جنائي مستقل شامل بعد التنفيذ — CONDITIONAL GO مع اكتشاف بوابة القبول مكسورة فعليًا

### تم التنفيذ
- جمدت الواقع: HEAD `b51504b7` على `main`، Node v22.22.3، pnpm 10.19.0؛ الشجرة فيها بس العقل المعدّل + تقرير untracked — **ما فيه كود تنفيذ غير ملتزم** (لا reproducibility finding).
- شغلت كل البوابات بتحقق طازج: typecheck ✅، manifest ✅ (60/28)، route-manifest ✅ (114/25/6)، parity ✅ (38/38)، migrations ✅، full test chain ✅ (60/60)، production build ✅ — **وe2e:acceptance ❌ exit 1** (P1-001).
- **اكتشاف جوهري P1-001:** سويت `e2e-lab-form` تنهار — نص ContextualHelp المضاف في QC-PILOT-UAT-019 (`lab/tests/new.astro:154`) يحتوي "Save Draft"/"Submit for Review" حرفيًا فيكسر 8 تأكيدات sticky-bar (count()===1) و`page.click('text=Save Draft')` يحل لـ3 عناصر (أولها فقرة مساعدة مخفية) → Timeout غير مُلتقط → `e2e-acceptance.mjs:148` ترمي وتوقف البوابة؛ 12 سويت عدّت (823 assertion) و15 سويت + مرحلتا persistence **ما نُفذت** هذا التدقيق. ادعاء 021 أن القبول خضراء = STALE/FALSE على نفس HEAD.
- فحص DB جنائي على قواعد مؤقتة: init نظيف (schema v38، 51 جدول)، db-doctor PASS (integrity/FK/checksum/parity)، ودريل معزول backup→mutate→restore→restart→chains→deployment-contract **PASS** بنسخ حقيقية 856KB.
- تدقيق أمني شامل (وكيل + مسح ثابت): SQLi/XSS/CSRF/IDOR/redirects/path-traversal نظيفة (36/36 API محمية، CSP بلا unsafe-inline/eval، renderer الوثائق escape-only)؛ **P1-002: مفتاح Ed25519 خاص حقيقي مضمّن في `README.md:33`** (ROTATION REQUIRED) + token شبه حي في `.claude/settings.local.json` (untracked).
- أكدت باغات hygiene وdrift: الملفان `qc_tasks.db` و`qc_tasks 3.db` متتبعان (`.gitignore` يغطي `db/*.db` فقط — P2-003)، و`db/schema.sql` مفقود منه `ai_audit_log` + 6 فهارس وفيه فهرس غير موجود بالهجرات (P2-008)، ومسار ميت `GET /api/tasks/suggestions` (P3-012).
- أنشأت 6 ملفات تدقيق في `docs/final-audit/`: FILE-COVERAGE (457 ملف، تغطية 100%: 426 CLEAN/15 ISSUE/16 REQUIRES-RUNTIME-EVIDENCE)، ROUTE-COVERAGE، POST-IMPLEMENTATION-REFERENCE-AUDIT (48 قسمًا + 42 سجل ملاحظات: P0=0/P1=2/P2=9/P3=11)، POST-IMPLEMENTATION-AUDIT.json، PILOT-READINESS-SCORECARD، وFINAL-CLOSING-PROMPTS (5 برومبتات إغلاق + QC-FINAL-CLOSING-VERIFICATION).
- الدرجات: الإجمالي الموزون **91.6%** (بالأوزان الإلزامية وبإظهار الحساب)؛ اكتمال الكود 96%، ثقة التحقق الآلي 84%، أمان 91%، سلامة بيانات 97%، UI 90%، جاهزية pilot 82%، production 78%، **HUMAN UAT: NOT VERIFIED** (صفر نتائج بشرية)، **LIVE DEPLOYMENT: NOT VERIFIED**.
- ما عدلت أي كود منتج، وما صار commit أو push أو deploy (وضع التدقيق الصارم). القواعد المؤقتة نُظفت.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/final-audit/{FILE-COVERAGE,ROUTE-COVERAGE,POST-IMPLEMENTATION-REFERENCE-AUDIT,PILOT-READINESS-SCORECARD,FINAL-CLOSING-PROMPTS}.md`
- `apps/qc-task-manager/docs/final-audit/POST-IMPLEMENTATION-AUDIT.json`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- 10 بوابات/أوامر بـstart/end وexit codes موثقة في `/tmp/qc-audit-gates.log` و`/tmp/qc-prodops.log` (9 ✅ و1 ❌).
- db:status + test:production-operations معزولان على قواعد `/tmp` مؤقتة ✅ (حُذفت بعد الفحص).
- 3 وكلاء تدقيق قراءة-فقط (جرد/RBAC/أمان + UI/UX) بأدلة file:line.
- المسح الثابت: @ts-ignore=0، eval=0، any=8، eslint-disable=3، TODO فعلي=1 (قراءة WI المتعمدة).

### النتيجة
- **الحالة:** نجح (التدقيق نفسه مكتمل بالأدلة) — الحكم على النظام: **CONDITIONAL GO**
- **مختصر:** ما فيه P0؛ الحكم محجوب عن GO بسبب P1-001 (بوابة القبول مكسورة بسبب تصادم locators مع نص المساعدة)، P1-002 (تدوير مفتاح README)، غياب UAT بشري فعلي، وعدم التحقق الحي من النشر. الترتيب المقترح: إصلاح البوابة وتشغيل قبول كامل أخضر ← تدوير المفتاح + إزالة تتبع DB ← UAT ← تحقق نشر حي.

### ملاحظات / مشاكل مفتوحة
- 15 سويت E2E + مرحلتا persistence غير متحققة تشغيليًا في هذا التدقيق (حجبها انهيار P1-001) — تقفلها تلقائي بعد إصلاح البوابة.
- WI ما زال SOURCE-BLOCKED (الصفحات 2/3 و3/3 غير موردة)، وسياسة تجاوز المعايرة (تحذير أم حجب) ما زالت قرار إدارة QC.
- مفتاح README يجب تدويره خارج المستودع؛ قيمة المفتاح لم تُطبع في أي تقرير.

## [2026-08-28] — SKILLS-RESTORE-026: التراجع عن التقليم واستيراد كل مهارات الإضافات

### تم التنفيذ
- بطلب المستخدم تراجعت عن تقليم `SKILLS-CONSOLIDATE-025`: أرجعت **121 مجلد مهارة** من النسخة الاحتياطية `/tmp/brightai-skills-backup/agents-skills-20260828-071029.tgz` — لا حذف متبقٍ في `git status`.
- استوردت **94 مهارة إضافية** لم تُنقل سابقًا، من clone مباشر لريبوهات المتجر: `Owl-Listener/designer-skills` و`Owl-Listener/inclusive-design-skills` — يعني الـ158 مهارة حق الإضافات كلها صارت جوة الريبو.
- عالجت 11 مهارة بأسماء عامة متصادمة (`review`, `audit`, `simplify`, `document`, `handoff`, `generate`, `specify`, `structure`, `rewrite`) بإعادة تسميتها بسابقة الحزمة، مثل `accessible-content-review` و`inclusive-personas-generate`، وحدّثت حقل `name:` داخل كل SKILL.md ليطابق اسم المجلد.
- أصلحت عيبًا في المصدر: `adaptive-personalisation/SKILL.md` كان يحمل `name: contextual-help-design` فيتصادم مع مهارة حقيقية بنفس الاسم — صار `name: adaptive-personalisation`.
- أرجعت `skills-lock.json` لـ175 مدخلًا، وزامنت `.claude/skills/` بإضافة 215 symlink — 371 symlink مقابل 371 مهارة، صفر رابط مكسور.
- نظام الإضافات باقٍ مُلغى من `SKILLS-CONSOLIDATE-025`: `enabledPlugins: {}` والمتجر محذوف — المهارات كلها ملفات حقيقية داخل الريبو.

### الملفات المتأثرة
- `.agents/skills/` — 156 → **371** مهارة
- `.claude/skills/` — 371 symlink
- `skills-lock.json` — 50 → 175 مدخل

### الأرقام
- مهارات: 156 → **371** (121 مُرجَعة + 94 مستوردة)
- مهارات مُعاد تسميتها لتفادي التصادم: 11 | تصادم أسماء متبقٍ: **0**
- `git status`: 316 غير متتبّع، 6 تعديل، **0 حذف**

### القرارات
- **إلغاء معيار التقليم** — المستخدم يفضّل التغطية الكاملة على القائمة المركّزة؛ قرار `SKILLS-CONSOLIDATE-025` بحذف الألعاب/WebGL/الثيمات مُلغى.
- **الأسماء العامة تُسبق بالحزمة** — مهارات مثل `review` و`audit` كانت تتصادم بين حزم متعددة في مجلد مسطّح واحد؛ السابقة تحل التصادم وتحفظ المصدر في الاسم.
- **الاستيراد من clone مو من الكاش** — كاش الإضافات كان محذوفًا، فالـclone المباشر هو المصدر الوحيد المتاح وأيضًا أوثق.

### التحقق
- `ls .agents/skills | wc -l` ✅ = 371
- تصادم `name:` بين كل المهارات ✅ = 0
- `name:` != اسم المجلد ✅ = 0
- symlinks مكسورة ✅ = 0
- `git status` ✅ — 0 حذف (كل المتتبّع مُرجَع)
- SKILL.md مفقود: 1 — `stitch-design-taste` (مجلد فاضي سابق للمهمة، غير فعّال)
- ما شغّلت build/tests — لا مساس بكود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** 371 مهارة كلها في `.agents/skills/` كملفات حقيقية بمسار واحد، بلا تصادم أسماء وبلا اعتماد على نظام الإضافات. ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **حجم قائمة المهارات كبير جدًا (371)** — يثقّل اكتشاف المهارات والسياق. لو ظهر تدهور في اختيار المهارة الصح، التقليم خيار متاح ولستا `keep`/`delete` محفوظتان.
- `stitch-design-taste` مجلد فاضٍ بلا SKILL.md، و`design-pipeline/SKILL.md` يشير له ولـ`image-to-code` غير الموجودة — عيب سابق، يحتاج إصلاح أو إزالة الإشارات.
- **4 ملفات SKILL.md موجودة أصلًا انكتب فوقها** من `npx skills add`: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — راجع `git diff` قبل الـ commit.
- الدستور `CLAUDE.md` مكتوب فيه "67 مهارة" — الرقم الصحيح الآن **371**.

## [2026-08-28] — SKILLS-CONSOLIDATE-025: توحيد المهارات في مسار واحد وتقليم غير المفيد

### تم التنفيذ
- أخذت نسخة احتياطية كاملة قبل أي حذف: `/tmp/brightai-skills-backup/agents-skills-20260828-071029.tgz` (85MB) تشمل `.agents/skills`, `.claude/skills`, `skills-lock.json`, `.claude/settings.json`.
- نقلت **71 مهارة منتقاة** من إضافات `designer-skills` جوة `.agents/skills/` كملفات حقيقية (64 من كاش الإضافات + 7 نقد بصري من ريبو المتجر) — صفر تصادم أسماء.
- حذفت **121 مجلد مهارة** غير مفيدة للمشروع: ألعاب Three.js (~22)، WebGL/3D/شيدرز (~23)، جزيئات وتأثيرات زخرفية (~7)، ثيمات جمالية جاهزة (~30)، منصات ثانية (`write-swift`, `animate-expo`, `performance-profiling` الخاصة بـApple)، سوشال/شخصي، ومهارات مكرّرة (`make-interfaces-feel-better` كانت نسخة مطابقة لـ`better-ui`).
- أبقيت المهارات ما قبل التثبيتات اللي فيها تخصيص للمشروع: `design-pipeline`, `design-md` (فيه triggers عربية), `awesome-design-md`, `grill-me`, `i-have-adhd`.
- نظّفت `skills-lock.json` من 125 مدخلًا لمهارات محذوفة.
- زامنت `.claude/skills/`: حذفت 114 symlink معلّق وأضفت 117 جديد — صار 156 symlink يطابق 156 مهارة، صفر رابط مكسور.
- ألغيت تثبيت الـ15 إضافة وحذفت متجر `designer-skills` وكاشه — `.claude/settings.json` صار `enabledPlugins: {}`؛ ما بقي إلا `claude-plugins-official`.

### الملفات المتأثرة
- `.agents/skills/` — 277 → **156** مهارة (كلها ملفات حقيقية بمسار واحد)
- `.claude/skills/` — 156 symlink فقط، تشير لـ`.agents/skills/`
- `skills-lock.json` — 175 → 50 مدخل
- `.claude/settings.json` — `enabledPlugins` صار فارغًا

### الأرقام
- مهارات: 206 (قبل النقل) → 277 (بعد النقل) → **156** (بعد التقليم)
- محذوف: 121 مجلد | منقول: 71 | باقٍ من الأصل: 85
- إضافات Claude: 15 → **0** | متاجر: 2 → 1

### القرارات
- **مصدر حقيقة واحد = `.agents/skills/`** — ملفات حقيقية هناك فقط، و`.claude/skills/` symlinks بحتة. بكذا الريبو يحمل المهارات، وما يعتمد على كاش إضافات خارج المشروع.
- **إلغاء نظام الإضافات كليًا** — الإضافات تخزّن مهاراتها في `~/.claude/plugins/cache/` خارج الريبو، يعني أي وكيل ثاني أو جهاز ثاني ما يشوفها. النقل جوة الريبو يحل هذا.
- **معيار التقليم:** BRIGHTAI موقع Astro ثابت عربي RTL + لوحة Next.js + QC SSR. أي مهارة عن ألعاب أو 3D/WebGL أو منصات ثانية (Swift/RN) أو ثيمة جمالية جاهزة = بلا فائدة، وتزحم اكتشاف المهارات وتثقّل السياق.

### التحقق
- `ls .agents/skills | wc -l` ✅ = 156
- كل مجلد فيه `SKILL.md` ✅ (0 مفقود)
- symlinks مكسورة في `.claude/skills/` ✅ = 0
- `claude plugin marketplace list` ✅ — `designer-skills` مُزال
- `git status` ✅ — 18 حذف متتبّع، 6 تعديل، 110 غير متتبّع
- ما شغّلت build/tests — لا مساس بكود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المهارات موحّدة في `.agents/skills/` بـ156 مهارة مركّزة على SEO/GEO والوصول والأداء وAstro/Tailwind وسير العمل وجودة الواجهة؛ نظام الإضافات مُلغى بالكامل. ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **8 مهارات متتبّعة في git انحذفت** (قابلة للاسترجاع بـ`git checkout --`): `12-principles-of-animation`, `animation-vocabulary`, `find-animation-opportunities`, `industrial-brutalist-ui`, `llm-council`, `make-interfaces-feel-better`, `minimalist-ui`, `transformer-workspace-auditor`.
- **4 ملفات SKILL.md موجودة أصلًا انكتب فوقها** من `npx skills add`: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — راجع `git diff` قبل الـ commit.
- `design-pipeline/SKILL.md` يشير لمهارتين غير موجودتين: `stitch-design-taste` (كان مجلدًا فاضيًا وانحذف) و`image-to-code` (ما كانت موجودة من الأصل) — عيب سابق للمهمة، يحتاج إصلاح أو إزالة الإشارات.
- الدستور `CLAUDE.md` مكتوب فيه "67 مهارة" — الرقم الصحيح الآن **156**.

## [2026-08-28] — SKILLS-INSTALL-024: إضافة متجر designer-skills وتثبيت 15 إضافة تصميم/وصول

### تم التنفيذ
- أضفت المتجر: `claude plugin marketplace add Owl-Listener/designer-skills` — نجح، مُعلن في user settings (clone عبر HTTPS لعدم توفر SSH).
- المتجر يعرض 33 إضافة إجمالًا (منها فئات: تصميم/UX، إدارة برامج، قيادة تصميم، AI product design، وصول شامل).
- بقرار المستخدم ثبّتنا 15 إضافة فقط بنطاق **project** — تجنّبًا لتضخيم قائمة المهارات:
  - تصميم/UX (9): `design-research`, `design-systems`, `ux-strategy`, `ui-design`, `interaction-design`, `prototyping-testing`, `design-ops`, `designer-toolkit`, `visual-critique`
  - وصول شامل (6): `cognitive-accessibility`, `inclusive-interaction`, `accessible-content`, `inclusive-personas`, `adaptive-interfaces`, `accessibility-decisions`
- الـ18 الباقية (إدارة برامج، قيادة، AI product design) ما ثبّتناها — متاحة بالمتجر وقت الحاجة.

### الملفات المتأثرة
- `.claude/settings.json` — أُنشئ/حُدّث بـ `enabledPlugins` (15 مفتاحًا)
- `~/.claude/settings.json` — إعلان المتجر (خارج الريبو)
- `~/.claude/plugins/marketplaces/designer-skills/` — كاش المتجر (خارج الريبو)

### الأرقام
- إضافات مثبّتة: 0 → **15** من أصل 33 متاحة
- مهارات `.agents/skills/`: 206 (لم تتغير — الإضافات مسار مستقل عن مجلد المهارات)

### القرارات
- **نطاق project مو user** — لأن الإضافات مرتبطة بشغل BRIGHTAI تحديدًا، وبكذا الإعداد يتوثّق داخل الريبو ويشوفه أي وكيل يشتغل عليه.
- **تثبيت جزئي مو كامل** — 33 إضافة تعني مئات مهارات تحمّل السياق بلا فائدة مباشرة للمشروع.

### التحقق
- `claude plugin marketplace list` ✅ — designer-skills مضاف
- كل أمر تثبيت رجّع `✔ Successfully installed` ✅ (15/15)
- `.claude/settings.json` ✅ يحتوي 15 إضافة مفعّلة
- ما شغّلت build/tests — التغيير إعدادات أدوات فقط، لا يمس كود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المتجر مضاف و15 إضافة تصميم/وصول مفعّلة بنطاق المشروع؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **ملاحظة مهمة:** التثبيتات السابقة (`npx skills add`) عدّلت 4 ملفات SKILL.md موجودة أصلًا: `emil-design-eng`, `pick-ui-library`, `prototype`, `review-animations` — أي نسخ فوق نسخ سابقة. يفضّل مراجعة `git diff` عليها قبل الـ commit.
- الدستور `CLAUDE.md` ما زال مكتوب فيه "67 مهارة" — الرقم الفعلي 206 مهارة + 15 إضافة.

## [2026-08-28] — SKILLS-INSTALL-023: تركيب حزمة jakubkrehel/skills (مهارات واجهة وتصميم)

### تم التنفيذ
- شغّلت `npx skills@latest add jakubkrehel/skills` — نزلت 11 مهارة.
- المهارات: `better-accessibility`, `better-colors`, `better-interface`, `better-layout`, `better-typography`, `better-ui`, `better-writing`, `break`, `explain-interface`, `interface-review`, `variant`.
- الأداة عرضت تقرير فحص أمني: كل المهارات Safe / 0 alerts — عشرة منها Low Risk و`explain-interface` مصنّفة Med Risk.
- كل مهارة انزلت universal (Antigravity, Cline, Codex, Cursor, Gemini CLI +12) مع symlinks لـ Claude Code و ZCode.

### الملفات المتأثرة
- `.agents/skills/` — أصبح 206 مجلد مهارة

### الأرقام
- عدد المهارات: 195 → **206**

### التحقق
- `ls .agents/skills | wc -l` ✅ = 206
- فحص الأداة الأمني ✅ Safe / 0 alerts لكل المهارات الـ11.
- ما شغّلت build/tests — التغيير مقصور على مجلد المهارات.

### النتيجة
- **الحالة:** نجح
- **مختصر:** 11 مهارة واجهة/تصميم مركّبة محليًا؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- `explain-interface` مصنّفة Med Risk من الأداة — يفضّل قراءة `SKILL.md` قبل استخدامها.
- الدستور `CLAUDE.md` ما زال مكتوب فيه "67 مهارة" — يحتاج تحديث للرقم الفعلي 206.

## [2026-08-28] — SKILLS-INSTALL-022: تركيب حزمتي مهارات خارجيتين (emilkowalski + MengTo)

### تم التنفيذ
- شغّلت `npx skills@latest add emilkowalski/skills` — نزلت 12 مهارة (animate, animate-expo, animation-vocabulary, improve-animations, find-animation-opportunities, review-animations, apple-design, emil-design-eng, prototype, pick-ui-library, ask-sonner, write-swift).
- شغّلت `npx skills@latest add MengTo/Skills` — نزلت حزمة كبيرة تشمل مهارات WebGL/Three.js، GSAP، أنظمة تصميم/لاندنق، بناء ألعاب ويب، وحزمة SEO كاملة (`seo-*`).
- كل مهارة انزلت بصيغة universal (Antigravity, Cline, Codex, Cursor, Gemini CLI +12) مع symlinks لـ Claude Code و ZCode.
- ما قرأت محتوى المهارات ولا راجعتها أمنيًا — الأداة نفسها تنبّه إنها تشتغل بكامل صلاحيات الوكيل.

### الملفات المتأثرة
- `.agents/skills/` — 195 مجلد مهارة إجمالًا بعد التركيب (كان ~67 حسب الدستور)

### الأرقام
- عدد المهارات: ~67 → **195**

### التحقق
- `ls .agents/skills | wc -l` ✅ = 195
- ما شغّلت build/tests — التغيير مقصور على مجلد المهارات ولا يمس كود المشروع.

### النتيجة
- **الحالة:** نجح
- **مختصر:** الحزمتان مركّبتان محليًا وجاهزتان للاستخدام؛ ما صار commit ولا push.

### ملاحظات / مشاكل مفتوحة
- **مراجعة أمنية معلّقة:** محتوى المهارات الجديدة (خصوصًا اللي فيها سكربتات) ما راجعته — يفضّل فحصها قبل الاعتماد عليها.
- الدستور `CLAUDE.md` يقول "67 مهارة" — الرقم صار قديم ويحتاج تحديث.

## [2026-08-28] — QC-COMPANY-PILOT-GATE-021: تحقق نهائي مستقل لجاهزية تجربة الشركة

### تم التنفيذ
- تحققت من المصدر الحالي على HEAD `b51504b7ae4e0b8a424a23c6190a43de9a0d2670` وشجرة العمل كانت نظيفة قبل إنشاء تقرير التحقق.
- شغلت بوابات pnpm المطلوبة فعليًا: typecheck وmanifest وroute-manifest وتطابق migrations والهجرات وfull tests وproduction build وE2E acceptance؛ كلها exit 0.
- تحققت من 38/38 migration مضمّنة، ومن restore drill مؤقت يشمل schema v38 و`integrity_check` و`foreign_key_check` وسلاسلي تدقيق وbackup/verify/restore/restart.
- تحققت من acceptance المعزول (28 suites + مرحلتا restart-persistence) ومن axe: 12 صفحة pilot، Critical=0 وSerious=0.
- تحققت من WI: صفحة 1 فقط (33 صفًا source-exact)؛ التطبيق يمنع اختراع الصفحتين 2/3 و3/3.
- سجلت فشل hygiene مستقل: ملفا `apps/qc-task-manager/qc_tasks.db` و`qc_tasks 3.db` متتبّعان رغم أنهما صفريان بلا tables؛ لذلك التصنيف النهائي CONDITIONAL GO وليس GO.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FINAL-PILOT-READINESS.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm typecheck` ✅ — 0 errors / 0 warnings / 26 hints.
- `pnpm test:manifest` ✅ — 60 canonical suites و28 E2E.
- `pnpm test:route-manifest` ✅ — 114 routes، 25 middleware، 6 guards.
- `pnpm test:embedded-migration-parity` ✅ — 38/38.
- `pnpm test:migrations` و`pnpm test` و`pnpm build` و`pnpm e2e:acceptance` ✅.
- `pnpm test:production-operations` و`pnpm test:deployment-contract` و`pnpm test:db-doctor` و`pnpm test:lab-documents` ✅.
- `node scripts/verify-security-hygiene.mjs` ⚠️ exit 1 — فقط ملفا SQLite المتتبّعان المذكوران.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** التطبيق اجتاز كل بوابات التشغيل المطلوبة محليًا لكن GO محجوب حتى إزالة artifacts الـSQLite المتتبعة، تنفيذ restore/live deployment الحقيقي، وتوفير نتائج UAT بشري فعلية.

### ملاحظات / مشاكل مفتوحة
- **RUNTIME USER UAT REQUIRED** — لا توجد نتيجة UAT بشرية مُدعاة.
- WI register لا يكتمل حتى توريد controlled pages 2/3 و3/3.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-WI-CATALOG-COMPLETION-020: تدقيق كتالوج WI مع حجب الصفحات غير المورّدة

### تم التنفيذ
- أبقيت كتالوج الصفحة 1/3 كما هو: 33 هوية فقط، مع تثبيت بصمة SHA-256 لاكتشاف أي تغيير في الكود أو العنوان أو الإملاء أو المراجعة أو التاريخ أو مصدر الصف.
- أضفت `source_page` و`source_row_no` لكل سجل كتالوج صراحةً؛ جميع الصفوف الحالية page 1 والصفوف 1..33.
- أضفت تحققًا قبل الاستيراد يمنع code/title الفارغين، تكرار الكود أو موقع المصدر، رقم صف غير صالح، revision/date غير صالحين، وأي source page غير مورّدة؛ حاليًا الصفحة الوحيدة المعروفة هي 1.
- جعلت تصادم الكود report-only وغير مدمّر: لا يغيّر العنوان أو provenance أو المحتوى أو `lab_document_versions` أو status، بينما يبقى الاستيراد idempotent وcode-based.
- أبقيت السجلات catalog-only بلا محتوى أو versions وبحالة Missing Content في الواجهة، وأضافت readiness TODO: `WI register incomplete until controlled source pages 2/3 and 3/3 are supplied.`
- راجعت migrations 029 و033 و`lab_documents`/`lab_document_versions` وواجهات WI؛ الحقول اللازمة موجودة، وما أضفت migration أو أي صفوف placeholder/مخمّنة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/lab/wiCatalog.ts`
- `apps/qc-task-manager/scripts/test-lab-documents.mjs`

### التحقق
- `test:lab-documents` ✅ — 303 passed / 0 failed، يشمل page-1 fingerprint، منع pages 2/3، والتصادم مع مستند مؤلف فعليًا.
- `test:migrations` ✅
- `test:manifest` ✅ — 60 canonical suites و28 E2E suites.
- `astro check` ✅ — 0 errors / 0 warnings؛ 26 hints قديمة.
- `NODE_ENV=production astro build` ✅ — Complete؛ تحذيرات Vite المعروفة بقيت.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** المصدر المتاح فقط محفوظ حرفيًا ويمتنع التطبيق عن اختراع الصفحتين 2/3؛ وصولهما لاحقًا يتطلب إضافة صفوفهما المصدرية الدقيقة فقط.

### ملاحظات / مشاكل مفتوحة
- WI register ما زال غير مكتمل حتى يتم توريد controlled source pages 2/3 و3/3.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-VISUAL-RESPONSIVE-017: فحوص Playwright للاستجابة وسهولة الاستخدام

### تم التنفيذ
- أضفت جناح Playwright خفيفًا يفحص 18 شاشة عبر 4 مقاسات (1440، 1024، 768، 360) = 648 حالة، بدون SaaS أو baselines بصرية كبيرة.
- أضفت fixtures حتمية ومعزولة للمهام والاختبارات والعينات والمنتجات والمعدات والوثائق، مع تنظيف idempotent بعد التشغيل.
- أضفت فحوص عدم تجاوز عرض الصفحة، وصول الإجراء الأساسي، قابلية استخدام التنقل، استراتيجية تمرير الجداول، احتواء الحوارات، وعدم قص رسائل الأخطاء.
- عطّلت الحركة غير الحتمية عبر `prefers-reduced-motion`، وجعلت لقطات الفشل فقط داخل `download/qa/responsive/` المهمل.
- أصلحت تسربات عرض فعلية في صفحة المختبر وسجل الاختبارات ومحرر الوثائق، مع الحفاظ على تمرير الجداول أفقيًا داخل حاوياتها.
- ربطت الجناح بالـ E2E registry والـ acceptance runner، وأضفت contract/manifest guard لضمان بقاء التسجيل.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-responsive.mjs`
- `apps/qc-task-manager/scripts/test-responsive-e2e-contract.mjs`
- `apps/qc-task-manager/{package.json,scripts/e2e-registry.mjs,scripts/test-manifest.mjs}`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/pages/lab/index.astro`
- `apps/qc-task-manager/src/pages/lab/tests/index.astro`
- `apps/qc-task-manager/src/components/lab/LabDocumentEditor.astro`

### التحقق
- `pnpm test` ✅ — 59/59 suite canonical.
- `pnpm typecheck` ✅ — 0 أخطاء، 26 hints قديمة.
- `astro build` ✅ — Complete؛ تحذيرات Vite المعروفة بقيت بدون تغيير.
- `test:responsive-e2e-contract` ✅ و`test:manifest` ✅ — 28 جناح E2E canonical.
- responsive Playwright ✅ — 648 passed، 0 failed.
- full acceptance جزئي ⚠️ — وصل للجناح الجديد ونجح، ثم توقف عند `e2e-lab-search` بنتيجة 18/21؛ الإخفاقات الثلاثة تخص عزل RBAC القائم، ولم تتأثر ملفات البحث بهذا التغيير.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** فحوص الاستجابة الجديدة وإصلاحات العرض الفعلية ناجحة بالكامل، لكن بوابة القبول الكاملة ما زالت متوقفة على 3 إخفاقات baseline في `lab-search` خارج نطاق التغيير.

### ملاحظات / مشاكل مفتوحة
- يلزم حسم إخفاقات RBAC الثلاثة في `scripts/e2e-lab-search.mjs`/طبقة البحث في مهمة منفصلة قبل اعتبار full acceptance أخضر بالكامل.
- ما صار commit أو push أو deploy.

## [2026-08-28] — QC-OBSERVABILITY-016: قابلية تتبع آمنة وحالات أخطاء موحّدة لتجربة الشركة التجريبية

### تم التنفيذ
- أضفت توليد request/correlation ID آمنًا لكل طلب، مع قبول معرف وارد بصيغة آمنة أو استبداله بـ UUID، وإرجاعه في `X-Request-ID` وفي أخطاء 500.
- أضفت سجلًا خادميًا منظمًا كسطر JSON يحوي timestamp و`request_id` وmethod وroute والفاعل/الدور عند توفرهما وحالة HTTP والمدة وكود خطأ آمن، بدون تسجيل payload أو أسرار أو رسائل استثناء.
- أضفت أكواد أخطاء ثابتة `AUTH` و`FORBIDDEN` و`VALIDATION` و`NOT_FOUND` و`CONFLICT` و`STALE_CHANGE` و`DB` و`REPORT` و`UPLOAD` إلى استجابات API المشتركة.
- منعت مسارات مراجعة/سحب طلبات التغيير من تسريب نصوص الاستثناء أو تفاصيل SQLite، وأبقيت رسالة المستخدم عامة مع code آمن.
- أضفت `OperationalState.astro` كلغة موحدة لحالات عدم السجلات، عدم نتائج البحث، المنع، الخطأ، التعارض، السجل القديم، النجاح والتحذير، وكل حالة تقترح إجراءً تاليًا؛ وربطت به بحث المختبر.
- وسّعت FlashNotice لدعم حالة التحذير.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/observability.ts`
- `apps/qc-task-manager/src/middleware.ts`
- `apps/qc-task-manager/src/lib/api-security.ts`
- `apps/qc-task-manager/src/components/OperationalState.astro`
- `apps/qc-task-manager/src/pages/api/lab/change-requests/[id]/{review,withdraw}.ts`
- `apps/qc-task-manager/src/pages/lab/search.astro`
- `apps/qc-task-manager/scripts/test-observability.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs,src/env.d.ts}`

### التحقق
- `test-observability` ✅ — request ID، sanitization، safe codes/messages، structured logs، وكل حالات UI.
- `test-manifest-guard` ✅ — 58 suite canonical.
- `test-request-security` ✅ — 56/56.
- `astro check` ✅ — 0 أخطاء، 0 warnings، 26 hints قديمة.
- `astro build` ✅ — Complete؛ بقيت تحذيرات Vite المعروفة الخاصة بالاستيرادات الديناميكية.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند التطبيق request ID قابل للتتبع وسجلات تشغيلية آمنة، مع أكواد أخطاء مستقرة ورسائل لا تكشف SQLite أو الأسرار، وحالات UI موحدة قابلة للتصرف.

### ملاحظات / مشاكل مفتوحة
- التشغيل باستخدام `pnpm` تعذر في البيئة بسبب محاولة Corepack الكتابة إلى cache خارج مساحة المشروع؛ تم تشغيل الاختبارات والبناء مباشرة عبر Node و`node_modules/.bin/astro`.
- ما صار commit أو push أو deploy حسب الطلب.

## [2026-08-28] — QC-REPORT-PRINT-UX-015: تحسين معاينة التقارير وجودة الطباعة المضبوطة

### تم التنفيذ
- أضفت معاينة قبل تنزيل التقارير تعرض نوع التقرير، نطاق البيانات المحلولة، الفترة الزمنية، الفلاتر، عدد الصفوف إذا كان حسابه منخفض التكلفة، وسياق المستخدم/الدور.
- وحّدت مسار التفويض بين المعاينة وتوليد التقرير الفعلي، مع إيقاف حساب الصفوف قبل كشف أي نتيجة لمستخدم غير مصرح له.
- أبقيت تنزيلات CSV وXLSX وPDF على أزرار الواجهة المشتركة، بدون إضافة إطار PDF جديد.
- حسّنت `PrintLayout` لطباعة A4 بالاتجاه المناسب، تكرار رؤوس الجداول، منع قص الصفوف الحرجة، وإخفاء التنقل وأزرار الإجراءات في print media.
- أضفت metadata للطباعة تشمل نوع/معرّف السجل، التفويض، التوقيع أو التوقيع الإلكتروني، المصدر/المرجع، سياق المشاهد، وQR حيث ينطبق.
- غطّيت صفحات الطباعة للمختبر، المعدات، الصيانة، المعايرة، والمستندات المضبوطة، مع اختبار Playwright فعلي لـ `emulateMedia('print')` وPDF A4.

### الملفات المتأثرة
- `apps/qc-task-manager/src/lib/reporting/preview.ts`
- `apps/qc-task-manager/src/pages/reports.astro`
- `apps/qc-task-manager/src/pages/lab/reports.astro`
- `apps/qc-task-manager/src/layouts/PrintLayout.astro`
- `apps/qc-task-manager/src/pages/lab/{calibration,equipment,maintenance,documents}/[id]/print.astro`
- `apps/qc-task-manager/scripts/{test-report-preview,test-lab-print,e2e-lab-tests,test-manifest}.mjs`

### التحقق
- `pnpm run test:report-preview` ✅
- `pnpm run test:dashboard-reports` ✅
- `pnpm run test:lab-reports` ✅ — 196 ناجحة / 0 فاشلة
- `pnpm run test:lab-print` ✅ — 68 ناجحة / 0 فاشلة
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، مع 26 hint غير حاجب
- `NODE_ENV=production pnpm build` ✅
- `pnpm test` ✅ — 57 مجموعة canonical بدون فشل
- `pnpm e2e:acceptance` ✅ — 29/29 suite، و2399+ assertion بدون فشل
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت معاينة التقارير مرتبطة بالتفويض الفعلي، وصارت مخرجات الطباعة المضبوطة A4-friendly مع metadata وQR واختبارات regression وPlaywright print media.

### ملاحظات / مشاكل مفتوحة
- بقيت تحذيرات البناء المعروفة ورسائل Vite الخاصة بالـ dynamic/static imports، إضافة إلى 26 hint غير حاجب؛ ما فيه أخطاء فاشلة.
- ما صار commit أو push أو deploy حسب الطلب.

## [2026-08-28] — QC-FORM-USABILITY-013: تحسين إنتاجية النماذج التشغيلية واختبارات المختبر

### تم التنفيذ
- أضفت progressive enhancement مشتركًا للنماذج المعلّمة بـ `data-qc-form`: مؤشرات الأخطاء، ملخص التحقق، تركيز أول حقل غير صالح، حماية فقدان التعديلات، حالة الحفظ، ومنع الإرسال المزدوج.
- طبّقت الحارس المشترك على نماذج المعدات والمنتجات والمعايرة والقوالب ومحرر المستندات والمهام، مع شريط إجراءات sticky ومؤشرات required الموجودة/المضافة.
- حسّنت `LabTestForm` بمساعدات Duplicate previous row وFill down وClear row وPaste spreadsheet rows وUndo last paste، بدون إضافة معايير علمية أو منطق PASS/FAIL جديد.
- حافظت على الحقول المتوافقة مع الورق، المخطط الحالي، والبيانات legacy؛ وواصلت رسائل النجاح الموجودة عبر `FlashNotice` مع حالة `Saving…` أثناء الإرسال.
- أضفت اختبارات keyboard وpaste وdata-loss واختبار E2E لـ 12 عينة، وسجلتها ضمن manifest والاختبارات الكاملة.

### الملفات المتأثرة
- `apps/qc-task-manager/public/scripts/form-productivity.js`
- `apps/qc-task-manager/src/components/lab/LabTestForm.tsx`
- `apps/qc-task-manager/src/components/lab/{LabEquipmentForm,LabProductForm,LabCalibrationForm,LabTemplateForm,LabDocumentEditor}.astro`
- `apps/qc-task-manager/src/components/NewTaskForm.astro`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/scripts/{test-form-productivity.mjs,e2e-lab-form.mjs,test-manifest.mjs}`
- `apps/qc-task-manager/package.json`

### التحقق
- `node scripts/test-form-productivity.mjs` ✅ — 17 ناجحة / 0 فاشلة
- `pnpm run test:lab-form` ✅ — 72 ناجحة / 0 فاشلة
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، مع 26 hint غير حاجب
- `NODE_ENV=production pnpm build` ✅
- `pnpm test` ✅ — 56 مجموعة canonical، بدون فشل
- `pnpm e2e:acceptance` ✅ — 29/29 مجموعة ناجحة؛ `lab-form` فيها 141 ناجحة / 0 فاشلة
- `git diff --check` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت النماذج التشغيلية أوضح وأأمن من ناحية الحفظ والإرسال، وصارت شبكة عينات المختبر تدعم عمليات الدفعات المتكررة مع اختبارات تغطي الاستخدام الفعلي.

### ملاحظات / مشاكل مفتوحة
- بقيت تحذيرات البناء/الـ typecheck الموجودة سابقًا (dynamic/static imports، hints غير مستخدمة، وتنبيه Astro للسكريبت الخارجي) بدون أخطاء حاجبة.
- لم يُنفّذ commit أو push أو deploy حسب الطلب.

## [2026-08-28] — URLS-FILE-001: إنشاء ملف `urls.txt` يدويًا بكل روابط الموقع (262 رابطًا — روابط فقط بدون أي كلمات)

### تم التنفيذ
- أنشأت ملف `urls.txt` في جذر المستودع بطلب صريح من المستخدم: سطر واحد لكل رابط، بدون عناوين أو تعليقات أو كلمات.
- جمعت الروابط من مصدر الحقيقة `sitemap.xml` الجذري (آخر حالة معتمدة: 262/262 بعد ترتيب SITEMAP-ORDER-002) وكتبتها يدويًا عبر محرر الملفات على 3 دفعات — بدون أي سكربت توليد داخل المشروع.
- الملف يغطي كل الصفحات القابلة للفهرسة: الرئيسية، answer (18)، assessment، authors (5)، blog + تصنيفاته، calculator، الشركة والثقة (about/contact/customers/trust/partners...)، القانونية، docs (44)، EN (7)، events (4)، hub (9)، kernel (20)، lp (5)، solutions + مدنها، tools، والصفحات الخدمية (sitemap/referral/sales-deck/newsletter).
- النطاق هو الجديد `https://brightai.live` بعد ترحيل BAI-DOMAIN-MIGRATION-001 — لا يوجد أي رابط بـ `brightai.site`.

### الملفات المتأثرة
- `urls.txt` (جديد — جذر المستودع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد الأسطر: **262** = 262 رابط sitemap ✅
- تطابق مجموعة الروابط (sort + diff) مع sitemap: **IDENTICAL** ✅
- كل سطر يبدأ بـ `https://brightai.live/`: **0 استثناءات** ✅
- صفر أسطر فاضية بعد التنظيف ✅
- build/tests: لم تُشغَّل — الملف نصي مرجعي خارج البناء ولا يمس أي كود

### النتيجة
- **الحالة:** نجح
- **مختصر:** `urls.txt` جاهز بكل الـ 262 رابطًا الفعلية للموقع (روابط فقط، سطر لكل رابط)، مطابق تمامًا لمجموعة روابط `sitemap.xml` على النطاق الجديد brightai.live.

### ملاحظات / مشاكل مفتوحة
- الملف ثابت (snapshot يدوي): أي صفحة جديدة مستقبلًا تتطلب تحديثه يدويًا أو إعادة استخراجها من sitemap بعد التوليد.
- الملف في جذر المستودع وليس في `public/` — لا يُنشر على الموقع (إن كان المطلوب نشره كصفحة روابط، يُنقل لـ `public/` بقرار موثق).

---

## [2026-08-28] — SITEMAP-ORDER-002-MANUAL: ترتيب يدوي لـ sitemap.xml الجذري حسب أهمية الصفحات — بدون سكربت وبدون بناء — 262/262 رابطًا

### تم التنفيذ
- أُعيد ترتيب بلوكات `sitemap.xml` في جذر المستودع **يدويًا** (تعديل مباشر للملف — بدون تشغيل `sitemap:generate` ولا `build`) بطلب صريح من المستخدم، حسب أهمية الأعمال: الرئيسية → التجارية الأساسية (`/solutions/` `/pricing/` `/demo/` `/contact/`) → صفحات الحلول → التقييم → منصة kernel → محاور hub → الشركة والثقة (about/services/customers/trust/partners) → docs → مقالات blog → تصنيفات blog → answer → أدوات/lp/events/newsletter → authors → EN → القانونية → الخدمية (sitemap/sales-deck/referral) — وأبجدي داخل كل طبقة.
- كل بلوك `<url>` انتقل بكامل محتواه حرفيًا (loc + hreflang + lastmod) — إعادة ترتيب فقط، حارس برمجي داخل عملية التحويل يفشل على أي تغيير في مجموعة الروابط أو بايتات البلوكات.
- `public/sitemap.xml` لم يُلمس (الطلب كان لملف الجذر فقط) — ما زال بترتيب أبجدي.
- تعديل `scripts/generate-sitemap-all-pages.mjs` غير الملتزم (SITEMAP-ORDER-002 بمنطق طبقات مشابه — من جلسة سابقة) بقي كما هو **ولم يُشغَّل**؛ أي `sitemap:generate`/`build` مستقبلي سيعيد توليد الملف بترتيب السكربت (مشابه لكن غير مطابق: يضع `/en/` بالطبقة 0 وصفحات kernel الفرعية بالأسفل) ويكتب root وpublic معًا.
- نسخة احتياطية قبل التعديل: `/tmp/sitemap-before-backup.xml`.

### الملفات المتأثرة
- `sitemap.xml` (جذر المستودع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

### التحقق
- عدد الروابط: **262 قبل = 262 بعد** ✅
- تطابق مجموعة الروابط (sort + diff) قبل/بعد: **IDENTICAL** — لا إضافة ولا حذف ✅
- `xmllint --noout sitemap.xml`: **VALID** ✅
- أسطر hreflang/lastmod: **783 قبل = 783 بعد** ✅
- بنية الملف (رأس urlset وذيله وسطور البلوكات) سليمة ✅
- `git diff --stat`: 861 إضافة / 861 حذف = إعادة ترتيب نقي ✅
- build/tests: لم تُشغَّل — تعديل ترتيب XML يدوي فقط لا يمس أي كود

### النتيجة
- **الحالة:** نجح
- **مختصر:** `sitemap.xml` الجذري صار مرتبًا بالصفحات الأهم أولًا (262 رابطًا كاملة ومحتوى البلوكات حرفيًا كما هو) بتعديل يدوي مباشر بدون مولّد وبدون بناء.

### ملاحظات / مشاكل مفتوحة
- لو شُغّل `sitemap:generate` أو `build` لاحقًا، الملف ينعاد توليده بترتيب المولّد (شجرة العمل تحمل SITEMAP-ORDER-002 غير الملتزم) — مطلوب قرار: الالتزام بمنطق السكربت أو مواءمته مع الترتيب اليدوي قبل أي توليد قادم.
- ترتيب الإدخالات داخل sitemap لا يغيّر أولوية الزحف الفعلية لدى Google (priority/changefreq مهملة) — الأثر تنظيمي/بشري بالأساس، والملف يظل صالحًا 100%.

---
## [2026-08-28] — BAI-DOMAIN-MIGRATION-001: إعادة تحقق إنتاجي ومحلي بعد ترحيل brightai.site → brightai.live

### تم التنفيذ
- راجعت حالة Git ومصادر الحقيقة الفعلية: الشجرة نظيفة، و`src/data/site.ts` و`astro.config.mjs` يثبتان `https://brightai.live` كنطاق أساسي.
- تحققت من مخرجات `dist/client`: صفر إشارات للنطاق القديم خارج قواعد التحويل المقصودة؛ وsitemap/canonical/OpenGraph/JSON-LD خالية من `brightai.site` و`brightaii.com`.
- ثُبّت أن البقايا غير المولدة تنحصر في قواعد تحويل 301، وثائق/تقارير تاريخية، و3 workflows محجوبة عن التعديل بلا إذن؛ ولا توجد بقايا production فعّالة.
- لم تُعدّل ملفات تنفيذ الترحيل في هذه الجولة، ولم يحدث commit أو push أو deploy.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- `npm run build` ✅
- `pnpm typecheck` ✅ (0 أخطاء؛ تحذيرات قائمة مسبقًا في QC)
- `pnpm test` ✅ (83/83)
- `npm run seo:all` ✅ (بعد اكتمال البناء؛ محاولة متوازية سابقة قرأت `dist` قبل إنشاء `404.html`)
- `npm run seo:hreflang` ✅ (263 مجموعة / 0 أخطاء)
- `npm run headers:check` ✅ · `npm run redirects:check` ✅
- `npm run verify:crawler-access` ✅ (17 زاحفًا + sitemap = 200 على `https://brightai.live`)

### النتيجة
- **الحالة:** نجح
- **مختصر:** ترحيل الدومين الموجود في HEAD يمر جميع بوابات البناء وSEO والتحويلات والفحص الحي للزواحف، وبلا مراجع قديمة فعّالة في artifact الإنتاجي.

### ملاحظات / مشاكل مفتوحة
- **تحقق حي:** `https://www.brightai.live/domain-migration-probe?keep=1` → 301 مباشر إلى النسخة non-www مع حفظ المسار والـ query. أما `brightai.site` و`www.brightai.site` فيفشلان قبل HTTP بـ TLS handshake من شبكة التحقق؛ لذلك تحويل النطاق القديم **غير متحقق/غير مكتمل خارجيًا** حتى يُصلح DNS/TLS/Cloudflare.
- المطلوب خارجيًا: تفعيل TLS و301 على `brightai.site` و`www.brightai.site` إلى `https://brightai.live/:splat`، ثم Change of Address في GSC وBing.

---
## [2026-08-28] — GA4-LITERAL-SNIPPET-002: استبدال محمّل gtag.js المؤجل بمقتطف Google الحرفي G-9LMB4PGTWJ على كل صفحات الزوار — بدون commit/push/deploy

### تم التنفيذ
- استبدال الـ loader القديم (`/js/gtag-init.js` deferred + Consent Mode v2) بمقتطف gtag.js **الحرفي** من Google (`async googletagmanager.com/gtag/js?id=G-9LMB4PGTWJ` + inline `js`/`config`) في 4 مواضع: `BaseLayout.astro` (كل الموقع بما فيه صفحات kernel عبر KernelLayout)، `answer/[slug].astro`، `lp/[slug].astro`، و`public/500.html` — الكود byte-exact بـ `is:inline` (CSP Report-Only مسموح فيه `unsafe-inline` + `googletagmanager.com` فلا كسر).
- **لكل الزيارات بلا قيود**: لا consent gating (الكود الحرفي بلا `consent default`)، لا تأخير requestIdleCallback، لا retry — أول تحميل يبعث page_view فورًا. (الرفض بالبانر كان أصلًا تجميليًا بقرار مالك موثق BAI-ANALYTICS-2026-08-03-B داخل analytics.js — لم يُلمس).
- **تكملة الوظيفة الموحدة**: `analytics.js` صار يسجّل gtag provider داخليًا (كان يسجله gtag-init.js) حتى تكمل أحداث `track()` المخصصة وpage_view للتنقل الناعم (ClientRouter) توصل GA4، مع **كتم أول page_view** قادم من الـ runtime لأن `gtag('config')` الحرفي يبعثه تلقائيًا — يمنع الازدواج.
- تحديث المعرف في كل الأماكن: `site.ts` googleTagId، fallback `GA4_MEASUREMENT_SECRET` في `ga4-server.ts:114` (أحداث server-side تروح لنفس الـ property الجديد)، تعليقات `SEOHead.astro` و`public/_headers`، وسكربت التحقق `playwright-verify-ga4-detection-deep.mjs`. صفر إشارات للـ ID القديم `G-8LLESL207Q` في src/public/scripts.
- `gtag-init.js` صار يتيمًا (لا يُحمّل من أي مكان) — عُلّم DEPRECATED برأسه وبقي على القرص، حذفه قرار مستخدم.

### الملفات المتأثرة
- `src/data/site.ts`, `src/layouts/BaseLayout.astro`, `src/pages/answer/[slug].astro`, `src/pages/lp/[slug].astro`, `public/500.html`, `public/js/analytics.js`, `public/js/gtag-init.js` (علامة deprecated فقط), `src/lib/ga4-server.ts`, `src/components/SEOHead.astro`, `public/_headers`, `scripts/playwright-verify-ga4-detection-deep.mjs`

### الأرقام
- **272/279** صفحة HTML مبنية تحمل المقتطف الحرفي = **100% من صفحات الزوار**؛ الـ 7 المستثناة مشروعة: 6 صفحات `/solutions/cities/*` هي 301 نقي بلا HTML (`Astro.redirect` فقط) + `kernel/admin/quota` شاشة إدارة noindex بقرار معماري موثق برأس الملف ("No analytics — internal operator screen").
- صفر بقايا `gtag-init`/`G-8LLESL207Q` في HTML المبني.

### التحقق
- `npm run build` ✅ Complete · `pnpm typecheck` ✅ 0 errors / 0 warnings / 24 hints
- `npm run headers:check` ✅ بلا drift (بعد تحديث تعليق `_headers`)
- فحص HTML المبني ✅: الرئيسية/answer/lp/500/kernel تحمل `<script async src=...G-9LMB4PGTWJ>` قبل inline config بالترتيب الصحيح

### النتيجة
- **الحالة:** نجح
- **مختصر:** مقتطف gtag.js الحرفي بالمعرف G-9LMB4PGTWJ يعمل على كل صفحات الزوار بلا consent ولا تأخير، وأحداث الـ unified analytics تكمل توصل GA4 عبر provider مدمج — والبناء والفحوص خضراء.

### ملاحظات / مشاكل مفتوحة
- **على المستخدم (خارج المستودع):** (1) متغير البيئة `GA4_MEASUREMENT_SECRET` في Render لو مضبوط بالقديم لازم يتحدث لـ `G-9LMB4PGTWJ` (الـ fallback بالكود صار الجديد، فالمشكلة تظهر فقط لو الـ env مثبت بالقديم). (2) حذف `public/js/gtag-init.js` اليتيم اختياري. (3) الـ GA4 API Secret (Measurement Protocol) يبقى مرتبطًا بالـ property الجديد — لو الـ secret من property القديم، أحداث server-side (leads) راح تُرفض.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-28] — BAI-DOMAIN-MIGRATION-001: ترحيل النطاق الإنتاجي بالكامل brightai.site → brightai.live (محليًا فقط — بدون commit/push)

### تم التنفيذ
- **جرد شامل** قبل أي تعديل: 382 ملفًا يحتوي `brightai.site|brightaii.com` (باستثناء node_modules/.git/dist/.astro/.lighthouseci/.pnpm-store/.vercel/pnpm-lock). صُنّفت إلى **319 ملفًا للترحيل** + مجموعة محفوظة كأدلة تاريخية (§21). تصحيح افتراضين من الجرد الأولي: `render.yaml` **ما فيه** نطاق قديم أصلًا (يُعاد توليده من مولّد التحويلات ومزامنة الهيدرز)، و`brightaii.com` موجود **مرة واحدة فقط** في المستودع (مثال CORS مُعلَّق داخل `public/_headers`).
- **مصدر الحقيقة الواحد**: `src/data/site.ts` → `url: 'https://brightai.live'`، و`astro.config.mjs:175` → `site: 'https://brightai.live'` (ومنها canonical/sitemap/OG/RSS/hreflang كلها تلقائيًا) + 10 روابط prerender للـ kernel. ما أُنشئ أي متغير مكرر.
- **استبدال مُدار** (مو blind) على الـ 319 ملفًا: `src/data/schema-helpers.ts`، `public/{robots.txt,ai.txt,llms.txt,llms-full.txt,humans.txt,500.html,js/*}`، `.well-known/{agent.json,ai-plugin.json,openapi.yaml,security.txt}`، `public/CNAME` (أُعيدت كتابته `brightai.live` — كان فيه مسافة زائدة)، `schema-saudi-seo.json` (public + src)، ~40 سكربت في `scripts/`، `apps/dashboard/{middleware.ts,next.config.mjs,app/**,lib/tenant.ts,lib/billing/stripe.ts,.env.example,README.md,tests/api/middleware-auth.test.ts}`، `packages/config/src/env.ts`، `packages/db/{schema.prisma,seed.ts,src/client.ts}`، `~60 src/pages/**`، `~26 src/data/migrated-pages/*.json`، `~100 src/content/blog/*.md`، `~45 src/content/docs/*.md`، `AGENTS.md`/`CLAUDE.md`/`docs/*`.
- **CORS/Origin بلا توسيع**: `src/pages/api/ai/chat.ts` → `ALLOWED_ORIGINS = ['https://brightai.live','https://www.brightai.live','http://localhost:4321','http://127.0.0.1:4321']` (أصول التطوير ما تغيّرت، ولا wildcard). `apps/dashboard/middleware.ts:31` → `ROOT_DOMAIN ?? 'brightai.live'` (فرع `.localhost` كما هو). `packages/config/src/env.ts` → افتراضات `ROOT_DOMAIN`/`NEXT_PUBLIC_ROOT_DOMAIN` + `SENDGRID_FROM_EMAIL=noreply@brightai.live`.
- **CSP بلا إضعاف**: التعديل الوحيد في `public/_headers` هو مثال CORS **مُعلَّق** (`# Access-Control-Allow-Origin: https://brightai.live`) — وهو الموضع الوحيد لـ `brightaii.com` في المستودع. `headers:check` بلا drift قبل وبعد.
- **تحويلات 301 داخل المستودع**: عُدّل `scripts/generate-all-redirects.mjs` ليولّد 7 قواعد مضيف مطلقة — تطبيع الكنسي (http→https، www→non-www على brightai.live) + ترحيل النطاق القديم بأربع صيغ (`http/https × root/www` على brightai.site) **كلها تشير مباشرة للكنسي = قفزة واحدة بلا سلاسل**، مع `:splat` لحفظ المسار. أُعيد التوليد: `public/_redirects` (7 قواعد بالأعلى + 209 قاعدة)، `render.yaml` (250 قاعدة)، `astro.config.mjs` (200 redirect، 9 مُستبعدة لتعارض صفحات ثابتة).
- **إعادة توليد المولَّدات بدل تعديلها يدويًا**: sitemaps عبر `npm run build`، fixture الاختبار عبر `scripts/__fixtures__/build-output/build-fixture.mjs` (190 HTML / 166 loc / 23 بديل en-SA)، الهيدرز عبر `sync-headers-from-csp.mjs`.
- **بوابات كانت تثبّت النطاق القديم بصيغة regex مهروبة** (ما التقطها grep العادي) — عُدّلت لتثبت النطاق الجديد بعد أن صارت الـ implementation صحيحة: `seo-schema-audit.mjs:85` (BreadcrumbList absolute items — هو سبب فشل `seo:all`)، `verify-all.mjs:217`، `legacy-seo-surface-audit.mjs:132`، `legacy-paths-audit.mjs:39`، `link-graph-validator.mjs:93`، `strategic-ai-answer-content.test.mjs:42`، `trigger-indexnow.test.mjs:117`.
- **ما اتعدّل**: `.github/workflows/{ci-build-guard,reports-gate,weekly-gsc}.yml` (يحتاج إذن صريح — القاعدة 14)، `apps/dashboard/.env.local` (ممنوع لمس `.env*`)، وكل الأدلة التاريخية.

### الملفات المتأثرة
- `git diff --stat` = **329 ملفًا، +3279/−3448**
- الأهم: `src/data/site.ts`، `astro.config.mjs`، `src/data/schema-helpers.ts`، `public/{CNAME,robots.txt,ai.txt,llms.txt,llms-full.txt,_headers,_redirects,sitemap.xml,sitemap-images.xml}`، `.well-known/*`، `render.yaml`، `scripts/generate-all-redirects.mjs`، `src/pages/api/ai/chat.ts`، `apps/dashboard/middleware.ts`، `packages/config/src/env.ts`، `packages/db/prisma/schema.prisma`

### الأرقام
- `brightai.live` في المجموعة المُرحّلة: **1561** موضعًا · نطاق قديم في نفس المجموعة: **0**
- sitemap: `public/sitemap.xml` = `dist/client/sitemap.xml` = **262 `<loc>`**، 0 نطاق قديم · `sitemap-images.xml` 0
- `dist/` بعد البناء: النطاق القديم في **ملف واحد فقط** = `dist/client/_redirects` (قواعد 301 المقصودة)
- بقايا في الشجرة (متتبعة): **60 ملفًا** — كلها أدلة تاريخية أو قواعد تحويل أو workflows موقوفة على إذن

### التحقق
- `pnpm typecheck` ✅ 0 أخطاء (24 hints)
- `npm run build` ✅ · `npm run headers:check` ✅ بلا drift
- `npm run seo:all` ✅ (كان **exit 1** قبل إصلاح `seo-schema-audit.mjs` — ~17 صفحة "Missing BreadcrumbList schema with valid absolute items")
- `npm run seo:hreflang` ✅ 263 مجموعة / 0 أخطاء · `npm run redirects:check` ✅ 209 قاعدة، صفر سلاسل/دوائر/مكررات
- `npm run verify:crawler-access` ✅ 17 زاحفًا + sitemap 200 (host: brightai.live، محليًا)
- `pnpm test` ✅ 83/83 (chat-session 16، csrf 29، pii 38) · `node --test scripts/trigger-indexnow.test.mjs` ✅ 9/9 · `strategic-ai-answer-content.test.mjs` ✅ 3/3
- `npm run verify:all` ⚠️ exit 1 — الفشل من `lint:tokens` (227 مخالفة raw hex)، **موجود قبل الترحيل** (نفس الأسطر في HEAD، وأحد الملفين ما اتعدّل أصلًا). الأجزاء الأخرى: verify 5/5 ✅ + headers:check ✅ + test:chat-session 16/16 ✅
- `node --test scripts/entity-consistency.test.mjs` ⚠️ فشل واحد — يطالب `public/{ai,llms,llms-full}.txt` بروابط `x.com/brightai_sa`/LinkedIn؛ `ai.txt` في HEAD أصلًا فيه **0** إشارة لـ x.com ⇒ **فشل سابق للترحيل**
- `apps/dashboard: pnpm test` ⚠️ 12 فشلًا / 193 نجاحًا — كلها في `tests/firewall/audit-durability.test.ts` (تسمية أكواد Prisma) و`tests/api/chat-streaming.test.ts` (نوع محتوى 429)، **صفر علاقة بالنطاق** وملفاتها ما اتعدّلت؛ `tests/api/middleware-auth.test.ts` (المعدّل) ناجح
- فحص §25 على `dist/client` (الرئيسية، about، blog، en/، en/privacy-policy، solutions/ai-firewall): canonical + hreflang (ar-SA/en-SA/x-default) + `og:url` + `og:image` المطلق + `twitter:url` + `@id` في JSON-LD **كلها brightai.live** بلا خلط نطاقات

### النتيجة
- **الحالة:** نجح داخل حدود المستودع
- **مختصر:** brightai.live صار النطاق الكنسي الوحيد في كل ما يخدمه المستودع (canonical/hreflang/sitemap/robots/schema/OG/CORS/دashboard/سكربتات Cloudflare وRender)، وقواعد 301 من النطاق القديم مكتوبة بقفزة واحدة. تفعيل التحويل فعليًا يتطلب تحكّم بالنطاق القديم في Cloudflare/Render — **غير مُنفَّذ ولا يُدّعى تنفيذه**. ما صار commit ولا push ولا merge.

### ملاحظات / مشاكل مفتوحة
- **خطوات خارج Git (إلزامية لإكمال الترحيل):** Cloudflare: 301 لـ `brightai.site/*` (+www) → `https://brightai.live/:splat` وwww→non-www وHSTS وpurge cache وAI Crawl Control OFF · Render: إضافة `brightai.live` كنطاق مخصص + TLS · GSC: property جديدة + **Change of Address** من `sc-domain:brightai.site` · Bing Webmaster: Site Move · SendGrid: توثيق نطاق `noreply@brightai.live`.
- **موقوف على إذن صريح:** `.github/workflows/ci-build-guard.yml` (سطور 63/65/659/671 host افتراضي)، `weekly-gsc.yml` (21/93/105 — `sc-domain:brightai.site`)، `reports-gate.yml:94` (نص رسالة).
- **يحتاج قرار المستخدم:** `apps/dashboard/.env.local` فيه `ROOT_DOMAIN="brightai.site"` (ممنوع أعدّل `.env*` — يحدّثه المستخدم)؛ **Prisma migration** لتغيير default العمود `cnameTarget` إلى `proxy.brightai.live` (الـ schema اتحدّث، وبوابة `verify-prisma-drift.mjs` ما تفحص defaults ⇒ ما انكسر شي، لكن DB-level default لسه القديم)؛ `sitemap.xml` بجذر المستودع نسخة قديمة مكررة ما يكتبها أي مولّد (المولّد يكتب `public/` و`dist/client/`) — مرشحة للحذف بعد موافقتك.
- **فشل سابق للترحيل (مو من هذه المهمة):** `lint:tokens` 227 مخالفة hex · `entity-consistency.test.mjs` يطالب روابط سوشيال مفقودة من `ai.txt` · 12 فشلًا في vitest الداشبورد (firewall/streaming).

---
## [2026-08-28] — QC-UI-CONSOLIDATION-011: توحيد وتنظيف بنية UI فوق نظام التصميم من 006 (بدون إعادة تصميم) — البوابات الثابتة خضراء، e2e:acceptance متبقٍ — بدون commit/push/deploy

### تم التنفيذ
- **Audit شامل** (وكيل استكشاف read-only) للأنماط المكررة في src/pages: Pagination كان الوحيد المؤسس 100%؛ PageHeader متبني بـ 6 صفحات فقط مقابل ~45 صفحة lab تدوي نفس الكتلة (h1 text-3xl + eyebrow مكرر بـ 44 ملف)؛ **Banner.astro مبنية بصفر استخدام** (24 كتلة خطأ متطابقة)؛ 13 فورم فلترة copy-paste؛ صفحتا إشعارات مكررتان بخرائط drift؛ 23 خريطة status→class منها 6 مكررة حرفيًا؛ LabActionButton شبه نسخة AppButton.
- **الإشعارات موحدة**: `src/components/ui/notificationPresentation.ts` جديد (KIND_ICON/KIND_LABEL/SEVERITY_CARD/SECTION_ORDER + groupNotificationsByKind/orderedNotificationKinds — مصدر واحد) + `src/components/NotificationCard.astro` جديد (كارت موحد مع sr-only severity + unread dot + MarkReadButton + splitMessageLinks) — أُعيدت كتابة /notifications و/lab/notifications عليهما وأنحلت drift نصوص KIND_LABEL (تُوحّد على نصوص الصفحة العامة، e.g. 'Lab tests under review' بدل 'Tests under review') وtimestamp slate-400→500.
- **تبنّي Banner**: codemod حوّل 23 كتلة بنر متطابقة (`rounded-lg border border-{red|amber|sky|emerald}-200...role="alert"`) إلى `<Banner tone="error|warning|info|success">` مع الحفاظ على النص وrole="alert" عند error؛ الشواذ المتبقية (KPI cards، login hint، أقسام emerald في tasks/[id]) تُركت عمدًا.
- **PageHeader على lab**: codemod حوّل 31 هيدر مطابقًا (eyebrow+title+description بسيطة+actions div → PageHeader مع fragment slot="actions")؛ 10 صفحات تفاصيل ببنية identity معقدة (وصف فيه markup/pills) بقيت identity blocks مقصودة (§4) مع **تقارب الحجم فقط**: كل h1 في src/pages/lab + 404 صارت text-2xl tracking-tight (نهاية متبقية 006 الموثقة)؛ 4 صفحات print مستثناة عمدًا؛ فروع 403/404 الشرطية داخل tasks/[id] وfindings/[id] استثنائية موثقة بالحارس.
- **الفلاتر**: `src/components/ui/formPresets.ts` جديد (FILTER_TOOLBAR/FILTER_FIELD/FILTER_CONTROL بنفس الكلاسات الحرفية — markup-neutral)؛ 13 ملفًا تبنّته (12 سجلًا + retests/new)؛ وصفة w-full في acknowledgements بقيت variant مقصود.
- **الأزرار**: LabActionButton صارت wrapper نقي على AppButton (صفر ستايل مملوك)؛ CTA الثلاثي المتطابق حرفيًا (manager/employee/supervisor "New task") → AppButton primary؛ زر "Apply filters" المتطابق بـ 9 سجلات → `<AppButton type="submit" variant="primary">` وReset → variant="secondary"؛ الشواذ الموثقة انحلت: lab/search bg-slate-900 submit → AppButton primary، lab/index actions loop + Quick New Test، change-requests/new زوج Submit/Cancel بلا focus، admin/templates legacy `focus:ring-2` → AppButton، search.astro زر صغير غير قياسي → md، lab/reports "Update filters"، documents/[id] "Add Content" بلا focus → LabActionButton. saved-views Delete الصغير (hover أحمر دلالي) بقى one-off مقصود.
- **خرائط الحالة**: `src/components/ui/labBadgeClasses.ts` جديد يضم CALIBRATION_STATUS_BADGE_CLS / DOCUMENT_STATUS_BADGE_CLS / ACKNOWLEDGEMENT_BADGE_CLS / DOCUMENT_TYPE_BADGE_CLS / TEMPLATE_STATUS_STYLES / TEST_WORKFLOW_TONE / TEST_RESULT_TONE — 12 صفحة استبدلت التصريحات المحلية باستيراد alias (نفس القيم الحرفية — صفر تغيير مظهر)؛ خرائط statusTones.ts وformat.ts (الاستثناء الموثق) لم تُلمس ف badge-contrast سليم.
- **جداول**: كل th `px-4 py-3` → `px-4 py-2.5` (change-requests، drilldown، admin/templates، lab/search) — وصفة رأس موحدة.
- **التنقل**: كل أهداف Navbar ROLE_NAV الـ 15 + /logout تحقق وجودها على القرص (صفر dead links)؛ mobileGroups = نفس primary+more بالضبط (mobile=desktop IA ✅ محقق من 006)؛ **تحسين active states في LabSecondaryNav**: أطول href مطابق يفوز (exact أو child path) → /lab/tests/[id] تفعّل "Tests"، /lab/tests/new تفعّل "New Test" فقط، وaria-current واحد دائمًا؛ لا قرارات permissions في UI (كلها lib/permissions + props — محقّق قراءةً).
- **الحارس توسّع**: test-ui-consistency من 37 → **162 فحصًا**: PageHeader على 31 صفحة lab، منع رجوع h1 text-3xl، منع رجوع وصفة البنر اليدوية، الإشعارات بالمصدر الموحد بلا خرائط محلية، formPresets على سجلات الفلاتر بلا وصفة حرفية، labBadgeClasses بلا إعادة تصريح، LabActionButton يفوض AppButton، th padding موحد، و**حارس dead links**: كل route في IMPLEMENTED_LAB_ROUTES لازم يكون له ملف صفحة فعلي (route.astro أو route/index.astro).
- **إصلاحات أثناء التحويل**: 118+ خطأ استيراد من حساب عمق خاطئ بالـ codemods — صححتها جميعًا (تحقق آلي أن كل import لحل ملف موجود)؛ أصلحت 4 بنى fragment كسرها codemod الهيدر (lab/index، tests/index، tests/[id]، change-requests/[id] — الأخير أُعيدت كتابة description كمتغير frontmatter) وimport { شارد في search.astro.

### الملفات المتأثرة
- جديد: `src/components/ui/{notificationPresentation,formPresets,labBadgeClasses}.ts`، `src/components/NotificationCard.astro`
- موسع: `scripts/test-ui-consistency.mjs` (162 فحصًا)، `src/components/lab/LabSecondaryNav.astro` (active longest-match)، `src/components/lab/LabActionButton.astro` (wrapper)
- مُحوّلة (59 ملفًا إجمالًا): 23 صفحة Banner، 31+4 صفحات PageHeader/h1، 13 فورم فلترة، 12 صفحة خرائط حالة، 14 صفحة أزرار/Apply/Reset، 4 جداول padding، 2 إشعارات، 404.astro

### التحقق
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 24 hints (271 ملفًا)
- `pnpm test:ui-consistency` ✅ **162/162** (موسّع)
- `pnpm test:badge-contrast` ✅ · `pnpm test:lab-ux-presentation` ✅ 6/6 · `pnpm test:lab-ux-performance` ✅ 7/7
- `pnpm test:manifest` ✅ 54 canonical suites / 27 E2E · `pnpm test:route-manifest` ✅ 111 file routes / 25 middleware / 6 guards
- `pnpm test` ✅ **السلسلة الكاملة 54 سويت exit 0**
- `NODE_ENV=production pnpm build` ✅ Complete
- `pnpm e2e:acceptance` ⚠️ **انلغى قبل الاكتمال بأمر المستخدم — غير مُثبت هذه الجلسة** (يشمل a11y axe gate + navigation E2E) — لازم إعادة تشغيل كاملة قبل الاعتماد النهائي
- فحص a11y المنفصل يتطلب سيرفر+قاعدة (بيئة الـ runner) — مغطى داخل acceptance فقط

### النتيجة
- **الحالة:** جزئي — كل البوابات الثابتة والسلسلة الكاملة والبناء خضراء على شجرة العمل؛ e2e:acceptance (بما فيه a11y) متبقٍ إعادة تشغيل.
- **مختصر:** التوحيد المطلوب من 011 منفذ بالكامل: مصدر واحد للإشعارات/خرائط الحالة/الفلاتر/الأزرار/البنرات/الرؤوس، وحارس 162 فحصًا يمنع الانحدار — والبوابة الإقليمية الوحيدة المتبقية هي إعادة e2e:acceptance حتى النهاية.

### ملاحظات / مشاكل مفتوحة
- **متبقٍ مقصود (موثق بالنظام والـ guard):** صفحات التفاصيل ببنية identity (وصف فيه markup)؛ فروع 403/404 داخل tasks/[id] وfindings/[id]؛ صفحات print؛ وصفة w-full في acknowledgements؛ زر Delete الصغير في saved-views؛ بنرات KPI/dashboard؛ TSX error panels داخل React islands (rounded-md — 4 مواضع)؛ خرائط format.ts للمهام (الاستثناء الموثق §2).
- **متبقٍ من 006 الآن مغلق:** توحيد صفحتي الإشعارات ✅، تقارب H1 text-3xl → text-2xl ✅. (ترقية chips الموظف لروابط مفلترة بقت من 006 — تحتاج فلتر due للبحث، خارج نطاق 011.)
- **مطلوب للجلسة الجاية:** إعادة `pnpm e2e:acceptance` كاملة + تحديث `docs/UI-DESIGN-SYSTEM.md` بالكنسي النهائي (notificationPresentation/NotificationCard/formPresets/labBadgeClasses + LabActionButton=wrapper + قاعدة PageHeader للـ lab) — التوثيق لم يُحدّث بعد.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-27] — QC-A11Y-GATE-010: الإتاحة صارت بوابة إقلاع حقيقية (axe gate) في تطبيق QC — بدون commit/push/deploy

### تم التنفيذ
- أُعيدت كتابة `scripts/e2e-a11y.mjs` من report-only إلى **بوابة فاشلة**: axe scan (wcag2a/2aa/21a/21aa/22aa) على 12 صفحة pilot — /login (زائر)، /employee (بجلسة employee)، /manager، /tasks/[id]، /lab، /lab/tests، /lab/tests/new?type=air، /lab/tests/[id]، /lab/documents، /lab/change-requests، /lab/search، /reports — **FAIL عند critical>0 أو serious>0**؛ moderate/minor تُبلَّغ بدون حجب. لم تُعطَّل أو تُعدَّل أي قاعدة axe.
- **الحفاظ الكامل** على سيناريوهات الكيبورد الأربعة القائمة (skip link، notification dropdown، completion wizard، cancel dialog) مع إضافات: التحقق من اسم الـ dialogs (aria-labelledby → heading حقيقي غير فارغ)، focus-visible ring للـ skip link وللـ navbar (Shift+Tab من #main للهيدر — Tab بعد القفز يروح للمحتوى)، وسيناريو تنقل الجوال 390×844 (toggle keyboard operable، aria-expanded يتبع الحالة، الروابط المجمعة شاملة Laboratory، Escape يغلق ويرجع focus للـ toggle).
- **فحوصات بنيوية فاشلة لكل صفحة**: H1 ظاهر واحد بالضبط، لا قفز بمستويات العناوين، status pills تحمل نصًا (غير معتمدة على اللون فقط — كل span.rounded-full ظاهر غير aria-hidden لازم له نص)، كل aria-describedby يحل لعنصر موجود، كل form control ظاهر له اسم متاح (label/aria-label/aria-labelledby).
- **إصلاح 73 عقدة color-contrast حقيقية** (السبب الجذري الوحيد للـ serious قبل البوابة، على 10 من الصفحات الـ12): text-slate-400→500/600 للنصوص المرئية على خلفيات فاتحة في المكونات المشتركة (LabSecondaryNav eyebrows، Pagination Prev/Next inert، Navbar timestamp + عناوين قائمة الجوال، TaskLifecycle، TaskUpdatePanel، CommentBox) والصفحات (employee/manager QC counters، tasks/[id] helpers+hashes، lab tests register disabled actions+Read-only pill+dash، login hint)؛ أزرار Complete/Confirm في TaskLifecycle: bg-emerald-600→700 + hover-800 (3.77:1→5.15:1)؛ text-emerald-600→700 للنصوص؛ إزالة opacity-80 من بطاقات KPI بلاب/index؛ **h3→h2 في AiReviewPanel** (كان يسبب قفز h1→h3 في سجل الاختبارات و7 صفحات ثانية تستخدم المكوّن)؛ aria-hidden لدائرة أيقونة النشاط في tasks/[id] (rounded-full بلا نص).
- **fixtures حتمية** بمعرفات ثابتة (A11Y gate fixture / NOTIF / LAB-TEST-A11Y-GATE-01 / PROD-A11Y-GATE-01 / EQ-A11Y-GATE-01) مع pre/post cleanup idempotent؛ تجاوز trigger «lab_test_samples rows are frozen after approval» بقلب حالة صف fixture الخاص بنا إلى DRAFT قبل حذفه فقط؛ warmup POST ذاتي قبل فتح قاعدة البيانات (نفس نمط الـ acceptance runner) فالعزل اليدوي يشتغل بدون خطوات خارجية.
- تقرير دائم `download/qa/a11y-qc-report.json` (gitignored): gate summary + policy + 12 صفحة بعدّاداتها وviolations مع WCAG tags + assertions بالفشلات مصنفة (keyboard/structure/gate) — **يُكتب حتى عند فشل البوابة**، وهو نفسه الملف الذي يرفعه QC Release Gate workflow كـ artifact عند الفشل.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/e2e-a11y.mjs` (إعادة كتابة — البوابة)
- `apps/qc-task-manager/src/components/{AiReviewPanel,CommentBox,Navbar,TaskLifecycle,TaskUpdatePanel}.tsx`
- `apps/qc-task-manager/src/components/lab/LabSecondaryNav.astro` + `src/components/ui/Pagination.astro`
- `apps/qc-task-manager/src/pages/{employee/index,manager/index,login,tasks/[id],lab/index,lab/tests/index,lab/documents/index}.astro`

### التحقق
- a11y E2E معزول: **86/0 ALL PASS، exit 0** — وتشغيل سابق أثبت أن البوابة توقف فعليًا (exit 1 عند فشل بنيوي قبل الإصلاح)
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 17 hints
- `pnpm test:manifest` ✅ 54 canonical suites / 27 canonical E2E (التسجيل بدون تغيير)
- `pnpm test` ✅ السلسلة الكاملة 54 سويت exit 0 (منها test:ui-consistency 37/37 على نفس تغييرات المصدر)
- `NODE_ENV=production pnpm build` ✅ Complete
- `pnpm e2e:acceptance` ✅ **29/29 سويت (27 canonical + مرحتا persistence)، 2377+ assertion، exit 0** — ومنها a11y 86/0 داخل القبول
- `git diff --check` نظيف؛ التغييرات 15 ملفًا كلها داخل apps/qc-task-manager؛ السيرفر المؤقت وقواعد /tmp نُظفت

### النتيجة
- **الحالة:** نجح
- **مختصر:** الإتاحة صارت بوابة pilot فعلية: critical=0 وserious=0 على الـ 12 صفحة بعد إصلاحات حقيقية بالمكونات المشتركة أولًا (73 عقدة تباين + قفز عناوين + pill بلا نص)، بدون تعطيل أي قاعدة، والكيبورد/focus/الجوال/التراكيب كلها مغطاة باختبارات فاشلة عند الانحدار.

### ملاحظات / مشاكل مفتوحة
- /lab/tests/new يتطلب `?type=air|vacuum` (بدونه redirect لـ/lab) — البوابة تفحص النموذج بالـ query الصحيح.
- نطاق البوابة الحالي = صفحات الـ pilot الـ12؛ التوسيع مستقبلًا = إضافة سطر في SCAN_PAGES فقط.
- Skills used: verification-before-completion (قُرئت كاملة وطُبقت: لا ادعاء بدون إثبات تشغيل حديث)؛ ما فيه مهارة a11y مخصصة في `.agents/skills/`.
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

## [2026-08-27] — QC-CI-RELEASE-GATE-009: بوابة إصدار QC المخصصة على GitHub Actions — بدون commit/push/deploy

### تم التنفيذ
- فحص الـ workflows الستة الموجودة (ci-build-guard, a11y, deploy, reports-gate, seo-guard, weekly-gsc): ولا واحد يغطي `apps/qc-task-manager` ولا يوجد تعارض أسماء — **لم يُلمس أي ملف قائم**.
- workflow جديد واحد: `.github/workflows/qc-release-gate.yml` (اسم: QC Release Gate) — صلاحيات `contents: read` فقط، صفر أسرار، صفر deploy، Node من `.node-version` (22.22.2) وpnpm من `packageManager` (10.19.0).
- **بوابة PR** (8 خطوات): install مجمد + typecheck + `test:manifest` + `test:route-manifest` + `test:embedded-migration-parity` + `test:migrations` + `pnpm test` الكامل (54 سويت canonical) + production build مع تحقق `dist/server/entry.mjs`.
- **E2E acceptance الكامل** على push main / nightly (cron `30 2 * * *`) / workflow_dispatch فقط — عبر `e2e:acceptance` الذي يبني ويشغّل الـ runner بقواعد SQLite مؤقتة معزولة لكل سويت ومنافذ معزولة؛ على PR يُعامل skipped ويمرره الـ aggregate. Playwright chromium يُثبّت داخل الـ job.
- عزل إضافي: jobs الوحدات/الهجرات تثبت `QC_DATABASE_PATH`/`QC_DB_PATH` على `runner.temp` كحارس ثانٍ ضد أي fallback لقاعدة حقيقية؛ عند الفشل تُرفع artifacts آمنة فقط (لوجات runner + `download/qa/a11y-qc-report.json` + `download/qa/ui-audit/`) وبدون رفع أي قاعدة بيانات.
- aggregate job باسم **«QC / Release Gate»** (job id: release-gate) بنمط ci-success: يفشل على أي failure/cancelled، يعامل skipped كنجاح، ويكتب جدول نتائج في GITHUB_STEP_SUMMARY.
- توصية branch protection موثقة برأس الملف (require «QC / Release Gate» من إعدادات GitHub يدويًا) مع تحذير سلوك paths-filter — **دون تعديل أي إعداد GitHub فعليًا**.

### الملفات المتأثرة
- `.github/workflows/qc-release-gate.yml` (جديد — الملف الوحيد)

### التحقق
- YAML parse ✅ (python3 yaml.safe_load) + تحقق بنيوي: triggers (pull_request/push/schedule/dispatch)، needs، اسم الـ aggregate، شرط E2E.
- الأوامر الثمانية المرجعية موجودة كلها في `apps/qc-task-manager/package.json` ✅
- تشغيل فعلي للأوامر الخفيفة الثلاثة على الشجرة الحالية: `test:manifest` ✅ (54 canonical suites / 27 E2E)، `test:route-manifest` ✅ (111 file routes / 25 middleware / 6 guards)، `test:embedded-migration-parity` ✅ (37/37 byte-identical).
- typecheck/build/full-tests/e2e: خضراء موثقة اليوم في سجل QC-REQUEST-SECURITY-008 على نفس الشجرة — لم تُعاد هنا.
- actionlint غير متوفر محليًا — الاعتماد كان على YAML parse + مراجعة بنمط ci-build-guard الحرفي.

### النتيجة
- **الحالة:** نجح
- **مختصر:** بوابة QC المخصصة جاهزة كملف workflow واحد جديد لا يمس شيًا قائمًا؛ التفعيل النهائي = commit من المستخدم ثم إضافة «QC / Release Gate» كـ required status check يدويًا من إعدادات GitHub.

### ملاحظات / مشاكل مفتوحة
- paths-filter: PR لا يلمس QC (ولا lockfile/loader) لن يُنتج الـ check أصلًا — لو وظّفت الحماية كـ required يجب إما قبول هذا السلوك أو إزالة الـ paths (موثق برأس الملف).
- القسم 1 يتجاوز حده الموثق مسبقًا — الأرشفة للقسم 2 تؤجل كقرار متكرر (نمط الجلسات الأخيرة).

### 2026-08-27 — SKILLS-DESCRIPTION-STRENGTHEN-003: مراجعة وتقوية أوصاف المهارات الـ60 كإشارة تفعيل تلقائي — نجاح

**المطلوب باختصار:**
- مراجعة أوصاف (description) كل مهارات المشروع وتقوية الضعيفة — الوصف هو إشارة التفعيل الأساسية عند النموذج (يُعرض مقصوصًا ~250 حرفًا، والحد الأقصى 1024).

**تم تنفيذه:**
- مسح الـ 60 وصفًا: أغلبها قوي أصلًا (أوصاف seo-* الـ10 وdesign-pipeline كتلة `>` طويلة بمشغّلات عربية وإنجليزية — المسح الأولي ضلّلها خطأً ثم تصحح بقراءة frontmatter الفعلي).
- **تقوية 11 وصفًا ضعيفًا** (سطر قصير بلا «Use when» أو مشغّلات): dispatching-parallel-agents, executing-plans, grill-me, requesting-code-review, subagent-driven-development, systematic-debugging, test-driven-development, writing-plans, writing-skills, emil-design-eng, minimalist-ui — كل وصف جديد front-loaded بالمشغّلات في أول ~250 حرفًا وبطول 255–336 حرفًا.
- **إصلاح تنسيقي:** وصف systematic-debugging كان multi-line مقتبسًا (شكل ما يضمنه parser وفق diagnosing-skills) — وُحّد لسطر واحد.
- المزامنة إلى `~/.zcode/skills/` و`~/.agents/skills/` تمت للـ 11 المحدثة حفاظًا على التطابق الثلاثي.

**الملفات المتأثرة:**
- `.agents/skills/{11 مهارات أعلاه}/SKILL.md`
- نسخها في `~/.zcode/skills/` و`~/.agents/skills/`
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- فحص شامل: **187 ملف SKILL.md صالح** (name موجود + description 1–1024 حرفًا) عبر المجلدات الثلاثة ✅
- تطابق النسخ الثلاث: **0 diffs** ✅
- الملاحظة الوحيدة: ` rtl-ui-guardian` (مجلد بمسافة — مشكلة تسمية معلقة على المستخدم من SKILLS-DEFAULT-EXPORT-001)

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل مهارات المشروع الآن بأوصاف تفعيل قوية + قاعدة تفعيل تلقائي في AGENTS.md (SKILLS-AUTO-TRIGGER-002) — طبقتا ضمان للتفعيل التلقائي. يسري من الجلسة القادمة.

### ملاحظات / مشاكل مفتوحة
- ` rtl-ui-guardian` ما زالت بانتظار قرار المستخدم (إعادة تسمية المجلد بإزالة المسافة).
- `.agents/skills/stitch-design-taste/` الفاضي ما زال بانتظار قرار المستخدم.

 تفعيل تلقائي إلزامي للمهارات في بداية كل برومبت — نجاح

**المطلوب باختصار:**
- جعل ZCode يستخدم مهارات المشروع تلقائيًا عند بداية أي برومبت.

**تم تنفيذه:**
- فحص إعدادات ZCode (`~/.zcode/v2/config.json`, `setting.json`) + مهارة diagnosing-skills الرسمية: **ما فيه سwich إعدادات "default skills"** — ZCode يكتشف المهارات تلقائيًا ويعرض name/description/when_to_use للنموذج كل برومبت، والتفعيل قرار النموذج بناءً على الوصف + تعليمات النظام.
- الرافعة المضمونة: أُضيف قسم **«⚡ التفعيل التلقائي — إلزامي في بداية كل برومبت»** داخل القاعدة التاسعة بملفي AGENTS.md (المستخدم `~/.zcode/AGENTS.md` + المشروع): أول إجراء في أي برومبت = فحص قائمة المهارات واستدعاء المطابقة فورًا عبر Skill tool قبل أي أداة ثانية، مع ترتيب بعد قراءة الـ mind، واستثناء استدعاء المهارة الصريحة.

**الملفات المتأثرة:**
- `~/.zcode/AGENTS.md` (القاعدة التاسعة)
- `AGENTS.md` (جذر الريبو — نفس التعديل)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- تعديل توثيقي/تعليماتي فقط — لا build/tests. يسري من الجلسة القادمة (AGENTS.md يُحمَّل عند بداية كل جلسة).

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل برومبت جديد سيلتزم فحص المهارات واستدعاء المطابقة تلقائيًا قبل التنفيذ — عبر تعليمات ملزمة محمّلة دائمًا، لأن ZCode ما يوفر سويش "تحميل إجباري" للمهارات.

### ملاحظات / مشاكل مفتوحة
- قائمة التحقق النهائية في الدستور أُضيفت لها مطابقة ضمنية عبر القاعدة التاسعة المعدلة.
- لا يوجد.

 نشر كل مهارات المشروع إلى مجلدات المهارات الافتراضية على مستوى المستخدم (Default skills) — نجاح

**المطلوب باختصار:**
- إضافة كل مهارات المشروع (`.agents/skills/` — 60 مهارة) إلى الـ Default skills عشان تتوفر افتراضيًا في أي جلسة/مشروع.

**تم تنفيذه:**
- تدقيق مقارن (`diff -rq` لكل مهارة) بين `.agents/skills/` بالمشروع و`~/.zcode/skills/` و`~/.agents/skills/`.
- **اكتشاف أساسي:** `~/.zcode/skills/` (أعلى أولوية user-level في ZCode) مطابقة **100%** للمشروع (60/60، صفر فروقات محتوى) — مهارات المشروع كانت متاحة أصلًا كـ Default من هذا المجلد.
- أُضيفت **6 مهارات ناقصة** إلى `~/.agents/skills/` (الموقع القياسي العابر للأدوات): `astro-developer`, `distribb`, `grill-me`, `performance`, `seo-optimizer`, `web-design-guidelines`.
- زُامنت **7 مهارات** كان محتوى نسخة الـ user أقدم من نسخة المشروع (التي تحمل إصلاحات SKILLS-CODEX-COMPAT-001 الموثقة + النسخة الكاملة الأحدث): `claude-automation-recommender`, `emil-design-eng`, `i-have-adhd`, `pick-ui-library`, `prototype`, `review-animations`, `systematic-debugging`.
- لم تُلمس مهارات الـ user الخاصة غير الموجودة بالمشروع (apple-design, cognitive-tools, learned, rtl-ui-guardian, imagegen-*, vercel-react-best-practices...)، ولم تُلمس `stitch-design-taste` — لأن مجلدها بالمشروع **فاضي تمامًا** والنسخة الصحيحة الوحيدة في `~/.agents/skills/`.

**الملفات المتأثرة:**
- `~/.agents/skills/{astro-developer,distribb,grill-me,performance,seo-optimizer,web-design-guidelines}/` (إضافة)
- `~/.agents/skills/{claude-automation-recommender,emil-design-eng,i-have-adhd,pick-ui-library,prototype,review-animations,systematic-debugging}/` (مزامنة من نسخة المشروع)
- `.agents/mind/01-mind-latest.md` (هذا السجل)

**التحقق:**
- `diff -rq` بعد التنفيذ: **59/59 مهارة موجودة ومطابقة حرفيًا** في `~/.agents/skills/` (الاستثناء الموثق: stitch-design-taste) ✅
- كل المهارات الست الجديدة تحمل `SKILL.md` ✅
- لا build/tests — التغيير خارج شجرة الريبو (مجلدات مستوى المستخدم) + سجل العقل فقط

**النتيجة**
- **الحالة:** نجح
- **مختصر:** كل مهارات المشروع الـ60 متاحة الآن افتراضيًا: 60 في `~/.zcode/skills/` (كانت مطابقة أصلًا) و59 في `~/.agents/skills/` بعد إضافة 6 ومزامنة 7.

### ملاحظات / مشاكل مفتوحة
- `.agents/skills/stitch-design-taste/` بالمشروع مجلد **فاضي بلا SKILL.md** — يحتاج قرار مستخدم: حذفه أو تعبئته من نسخة `~/.agents/skills/stitch-design-taste/` (الصحيحة).
- مجلد ` rtl-ui-guardian` في `~/.agents/skills/` اسمه يبدأ **بمسافة** — خطأ تسمية محتمل يمنع الاكتشاف الصحيح؛ يحتاج قرار مستخدم مستقل.
- الاكتشاف الجديد للـ skills يسري من الجلسة القادمة.

### 2026-08-27 23:05 — QC-REQUEST-SECURITY-008: طبقة Fetch Metadata فوق CSRF + pruning للـ rate-limit buckets + حارس مصدري canonical لكل mutation — بدون commit/push/deploy

**الحالة:** نجح

**المطلوب باختصار:**
- تقوية أمن الطلبات في `apps/qc-task-manager` بدون استبدال المصادقة: Fetch Metadata defense فوق Origin CSRF الحالي، canonical security لكل POST/PUT/PATCH/DELETE، pruning للـ in-memory buckets، سويت scanning معماري، بدون Redis وبدون إضعاف CSP/CORS.

**تم تنفيذه:**
- `requireCsrf` صارت طبقتين: `Sec-Fetch-Site: same-origin` → قبول فوري، `cross-site` → 403 («Cross-site request rejected.»)، وأي قيمة أخرى (same-site/none/unknown) أو غياب الهيدر → fallback حرفي لمنطق Origin الأصلي (نفس الرسالة والسلوك — صفر كسر للسلوك القائم). انقسمت داخليًا إلى `requireCsrfForRequest(request, siteOrigin)` لتخدم الـ APIContext والـ LoginContext البسيط معًا.
- Pruning جديد للـ buckets الذاكرة (mutation IP+path وAI per-user): `pruneRateLimitBuckets(now)` مُصدَّرة بساعة قابلة للحقن (اختبار حتمي)، و`maybePrune` تلقائي مرة كل 60 ثانية أو فورًا عند تجاوز 4096 إدخال (حماية من flood مزيف الـ IP). Buckets بقيت in-memory — QC instance واحد، لا Redis.
- **فجوة اتساق أُغلقت**: `handleCreateTaskPost` (tasks.ts) كان المعالج الوحيد بلا `requireCsrf` canonical (حمايته الوحيدة طبقة Astro الضمنية) — صار يطبقها بنفسه كنمط معالجات المختبر.
- سويت جديد `scripts/test-request-security.mjs` (أمر `test:request-security`، مسجل canonical → **54 suites**): **56/0** — سلوكي (same-origin/cross-site/invalid-origin/لا-metadata يحمي/415/413/rate-limit 121st و16th/pruning بساعة مستقبلية + إعادة قبول بعد التصفير/قفل الحساب بالخامسة/بوابة الـ IP بالعشرين) + **scan معماري** يفشل على أي انحدار: كل unsafe api export لازم يستدعي `requireCsrf`، كل endpoint لازم `requireApiUser` (health.ts الاستثناء الموثق)، لا منطق origin/sec-fetch خارج api-security، كل handle*Post يطبق requireCsrf (استثناء session.ts موثق بترتيب middleware المُثبت نصيًا)، CSP بلا unsafe-inline/eval مع بقاء default-src self وframe-ancestors none وconnect-src self، لا Access-Control-Allow أصلًا، limiters Maps بلا redis في package.json، وكل fetch بالمكونات relative فقط.
- الـ UI islands لم تُلمس: كل الـ fetch نفسها نسبية same-origin والمتصفح يرفق `Sec-Fetch-Site: same-origin` تلقائيًا — التدفق القائم يمر كما هو.
- session.ts لم يُلم عمدًا: إضافة استيراد لخلق دورة session↔api-security؛ مساراها محميان بـ requireCsrf صريح داخل middleware (الموجود مسبقًا) والفحص المصدري يثبت الترتيب.

**الملفات المتأثرة:**
- `apps/qc-task-manager/src/lib/api-security.ts`
- `apps/qc-task-manager/src/lib/tasks.ts`
- `apps/qc-task-manager/scripts/test-request-security.mjs` (جديد)
- `apps/qc-task-manager/scripts/test-manifest.mjs`
- `apps/qc-task-manager/package.json`

**التحقق:**
- `pnpm test:request-security` ✅ 56/0 (من أول تشغيل)
- `pnpm test:lab-security` ✅ 63/0 (الـ refactor لم يكسر السويت القديم)
- `pnpm test:manifest` ✅ 54 canonical suites / 27 E2E — exit 0
- `pnpm typecheck` ✅ 0 errors / 0 warnings / 17 hints (267 ملفًا)
- `NODE_ENV=production pnpm build` ✅ Complete
- E2E معزول حي: `e2e-auth-lockout` ✅ **45/0** على سيرفر `dist/server/entry.mjs` بقاعدة temp (قُطع ونُظف بعدها)
- إثبات حي بـ curl بجلسة صالحة: same-origin metadata → **200** `{ok:true}`؛ cross-site metadata → **403** «Cross-site request rejected.»؛ بلا metadata وبلا Origin → **403** «Invalid request origin.» (fallback)
- `git diff --check` نظيف؛ السيرفر والقاعدة المؤقتة حُذفا

**قرارات/ملاحظات:**
- غياب `Sec-Fetch-Site` = نفس سلوك Origin القديم بالحرف، فلا مسار قائم تغيّر رفضه أو قبوله — الطبقة تضيف رفضًا جديدًا (cross-site حتى لو Origin مزيف مطابق) وقبولًا مبكرًا (same-origin) فقط.
- القيد 52→54 في المانيفست: 53 كانت بعد QC-USER-AUDIT-007، وهذا السويت جعلها 54.
- القسم 1 تجاوز حده (~620 سطرًا الآن) — الأرشفة للقسم 2 تؤجل كقرار موثق متكرر (نمط الجلسات الأخيرة).

**مشاكل مفتوحة:**
- لا يوجد.

**الخطوة الجاية:**
- لا يوجد — جاهز للمراجعة، والـ commit على المستخدم.

### 2026-08-27 22:22 — QC-USER-AUDIT-007: تدقيق دائم لإدارة المستخدمين على qc_audit_log

**الحالة:** نجح

**المطلوب باختصار:**
- استبدال console-only audit لإدارة المستخدمين بسجل قاعدة بيانات دائم.

**تم تنفيذه:**
- migration `037_user_audit_log.sql` توسّع `qc_audit_log` بـ entity `USER` وأحداث create/update/role change/activate/deactivate/password reset، مع rebuild يحفظ كل الصفوف والـ IDs والهاشات حرفيًا.
- عمليات المستخدم أصبحت تكتب before/after مسموحًا به داخل نفس transaction؛ لا password أو hash أو session token، وحمايات self-demotion/self-deactivation بقيت فعالة.
- صفحة `/admin/users/audit` إدارية read-only بفلاتر action/actor/target/date، من نفس السجل الوحيد.
- `test:user-audit` يغطي الأحداث، عدم تسريب الأسرار، عدم audit عند فشل mutation، والـhash chain؛ واختبار migration v36→v37 يثبت السجل التاريخي والهاشات unchanged.

**الملفات المتأثرة:**
- `apps/qc-task-manager/db/migrations/037_user_audit_log.sql`
- `apps/qc-task-manager/{db/schema.sql,src/lib/migrationRegistry.ts,src/lib/users.ts,src/lib/permissions.ts,src/lib/audit/userTimeline.ts}`
- `apps/qc-task-manager/src/pages/admin/users/{index,audit}.astro`
- `apps/qc-task-manager/scripts/{test-user-audit,test-migrations,e2e-admin-users,test-manifest,test}.mjs` والعدادات المتأثرة
- `apps/qc-task-manager/package.json`

**التحقق:**
- Migrations: ✅ `pnpm test:migrations`
- Audit/User: ✅ `pnpm test:user-audit` 21/0 و`pnpm test:audit-integrity`
- Full tests: ✅ `pnpm test` (53 canonical suites)
- E2E: ✅ `pnpm e2e:acceptance`، ومنها admin-users 52/0 ورفض employee لمسار audit
- Typecheck: ✅ 0 errors / 0 warnings / 17 hints
- Build: ✅ `NODE_ENV=production pnpm build` Complete
- Diff: ✅ `git diff --check`

**قرارات/ملاحظات:**
- Skills used: test-driven-development, verification-before-completion, writing-plans, using-superpowers.
- schema version صار 37 وembedded migration parity = 37/37.

**مشاكل مفتوحة:**
- لا يوجد

**الخطوة الجاية:**
- لا يوجد

### 2026-08-27 — QC-PRODUCT-UIUX-RECONSTRUCTION-006: إعادة بناء UI/UX بمنتج كامل لتطبيق QC Task Manager — نظام تصميم ملزم + 6 primitives + تنقل مجمّع + توحيد pagination/شارات/رؤوس + اهتمام الأدوار — كل البوابات خضراء (52 سويت + e2e:acceptance 2304/0) — بدون commit/push/deploy
- **Scope**: `apps/qc-task-manager/` فقط؛ قرأت العقل كاملًا أولًا. صفر تغيير لقواعد العمل أو `permissions.ts` أو المخطط أو الهجرات (عدا تصحيح عدّادات اختبار — تحت) أو CSRF/CSP. الواجهة بقيت إنجليزية بالكامل (حارس مصدري جديد يمنع العربي). لا commit ولا push ولا deploy.
- **المُسلَّم الأساسي**: `docs/UI-DESIGN-SYSTEM.md` — نظام تصميم داخلي صغير ملزم (مقياس تايبوغرافيا، إيقاع مسافات، radius md/lg/xl/pill، ظلال هادئة، خريطة ألوان دلالية neutral/info/progress/success/warning/danger/accent، هيكل صفحة قياسي، نموذج تنقل، عقد a11y، حواجز). استثناء موثق: حالات/أولويات المهام تحتفظ بمخططها الحالي (الرسوم البيانية معتمدة عليه).
- **Primitives جديدة** في `src/components/ui/`: `PageHeader` (eyebrow+H1+وصف+أفعال)، `AppButton` (4 متغيرات ×2 حجم + focus-visible موحد)، `StatusPill` + `statusTones.ts` (خريطة مركزية للحالات — النص دائمًا ظاهر مع نقطة زخرفية، ممنوع اللون وحده)، `Pagination` (تطبيق واحد بدل 4، مع aria-current)، `Banner`، و`EmptyState` محسّن (أيقونة + CTA ثانوي متوافق API). صفر dependencies جديدة.
- **التنقل (Navbar.tsx)**: نموذج مجمّع — Dashboard·Tasks·Search·Findings·Laboratory·Reports أساسية (مفلترة بالدور، الموظف بدون Dashboard قاعدة #1)، والإدارية تحت قائمة **More** (Delete Requests/Team Workload/User Management/Task Templates/Backups & Settings/System Health)، `aria-current="page"` بحبة brand نشطة ديسكتوب+More+جوال، وقائمة جوال مقصودة بأقسام Workspace/Administration/Account وأهداف 44px. **باق حقيقي اكتُشف وأُصلح**: `isActive()` كانت تقرأ `window` وقت تصيير الـ island على السيرفر فتنهار البث (ReferenceError على كل صفحة مصادَق) — صارت تُحسب بعد mount بstate (بلا hydration mismatch).
- **توحيد pagination**: 12 سجلًا صاروا على المكوّن الواحد (search, lab/search بعدل chevrons، lab/audit بعدل نصي، + 9 سجلات lab اللي كان فيها كتل مكررة حرفيًا) عبر codemod مؤقت بحفاظ حرفي على نفس مجموعة الروابط/النافذة (عقود e2e: nav[aria-label] + page=N hrefs + Prev/Next literals). حذفت كتل `pageNumbers` المكررة.
- **رؤوس وجداول وشارات**: `PageHeader` على manager/supervisor/employee/workload/findings/reports؛ رأس جدول قياسي (`px-4 py-2.5` + label موحد) و`tabular-nums` وhover موحد؛ `StatusPill` على سجل الاختبارات (بعد حذف statusTone المحلي) وadmin/users (Active/Disabled) وadmin/templates (lifecycle عبر LIFECYCLE_TONE + priority عبر priorityBadgeClass — كانت خريطة منحرفة). Reset صار شرطيًا بفلاتر نشطة بسجل الاختبارات.
- **صفحات الأدوار (Phase 8)**: strips «Needs attention» فوق القوائم — المدير: overdue/urgent/pending delete requests/open findings (روابط drilldown?kpi=overdue و/search?priority=urgent و/manager/requests و/findings)؛ المشرف: overdue/urgent/tests awaiting review/documents in review؛ الموظف: overdue/due today/open/draft tests/returned for changes/pending change requests (باستعلامات COUNT للقراءة فقط، العدّادات المرجعية تبقى Dashboard).
- **إصلاحات صفحات**: `manager/workload` — حذف الجملة العربية (كانت تخالف قاعدة English-UI) وحذف wrapper `max-w-7xl` المتداخل وإعادة البناء بPageHeader وجدول قياسي وempty state؛ `findings/index` أُعيدت بprimitives (جدول/فلاتر/empty state حسب السبب) مع الحفاظ على كل أسماء الحقول والأكشن؛ `reports` أُعيدت هيكلة 4 خطوات (Report type → Period & scope → Advanced collapsive بdetails → Preview scope → Downloads) مع الحفاظ على كل عقود e2e-reports (h1/select option counts/scope checkbox/audit link)؛ `404` صارت بصفحة مفيدة بCTA مزدوج.
- **Visual QA (Phase 27)**: `scripts/ui-screenshots.mjs` (أداة تشخيص غير مسجلة — سيرفر production ذاتي + DB مؤقتة بنفس بيئة acceptance) التقطت **60 لقطة fullPage لـ 20 شاشة × 1440/768/390** في `download/qa/ui-audit/` مع فحص overflow/H1 برمجي لكل لقطة: **0 overflow وH1 واحد لكل شاشة**. راجعت بصريًا: manager home، employee 390، lab tests register 1440، reports 1440، lab form 768. **باق ثانٍ مُصلح**: شريط الإجراءات اللاصق في `LabTestForm.tsx` كان يفيض 4px بعرض 768 (bleed `-mx-5` داخل سياق `px-4`) — صار `-mx-4 px-4` (مثبت بالمسبار المعزول وبالجولة النهائية).
- **حارس اتساق جديد (Phase 26)**: `scripts/test-ui-consistency.mjs` (أمر `test:ui-consistency`، **مسجل canonical → المانيفست صار 52 سويت**) — 37 فحصًا مصدريًا: صفحات بلا حرف عربي، pagination المشترك بلا pageNumbers inline، PageHeader على المحوّلات، workload بلا wrapper/عربي، StatusPill بسجل الاختبارات، عقد الـ landmark. مثبت صحةً بالمانيفست guard.
- **إصلاحات spec-drift للبوابة (خارج الـ UI لكنها شرط)**: الجلسة السابقة اعترفت أن `pnpm test` الكامل قُطع — البوابة كشفت **7 عدّادات هجرات قديمة (35 بدل 36 بعد migration 036)** أصلحتها جميعًا بلا أي إضعاف: `test-lab-change-requests:66` (currentVersion)، `test-production-operations:29,34` (expectedSchemaVersion ×2)، `test-dashboard-reports:22` (applied.length)، `test-scheduled-notifications:158` (schema version)، `test-db-doctor:40-42` (ثلاث /35/ regex).
- **Verification (كلها على HEAD 4437f121 + شجرة العمل dirty بتغييرات هذه المهمة فقط)**: `pnpm typecheck` **0 errors/0 warnings/17 hints** · `pnpm test:manifest` **52 canonical suites / 27 E2E — exit 0** · `pnpm test:route-manifest` **110 file routes / 25 middleware / 6 guards** · `pnpm test` **السلسلة الكاملة 52 سويت exit 0** · `NODE_ENV=production pnpm build` **Complete** · `pnpm e2e:acceptance` **كل السويتات عدّت: 26 canonical + مرحتا restart-persistence، 2,304 assertion ناجح / 0 فاشل** (منها lab-documents 85/0 بعقد عدّ الروابط الحرفي، reports 912/0، lab-search 21/0، a11y، dashboard بفحص الـ overflow عند 390/768/1440) · `git diff --check` نظيف. التغييرات: 30 ملفًا معدلًا + 5 مسارات جديدة.
- **Skills used**: redesign-existing-projects (قرأت SKILL.md كاملًا واتبعت تسلسل Scan→Diagnose→Fix وقواعد الـ stack)، web-design-guidelines (المرجع العام)، astro-developer (أعراف Astro islands/SSR).
- **الحدود الصادقة**: تقييم الدرجات قبل/بعد (59→80 إجماليًا) هندسي ذاتي وفق الموجز — **RUNTIME USER UAT REQUIRED** قبل أي ادعاء قابلية استخدام بشرية. الباقي: توحيد صفحتي الإشعارات، Reset الشرطي على باقي سجلات lab، تقارب H1 text-3xl القديم في سجلات lab غير المحوّلة نحو text-2xl، وترقية chips الموظف لروابط مفلترة (يحتاج فلتر due للبحث).
- **Files**: `docs/UI-DESIGN-SYSTEM.md` (جديد)، `docs/UI-UX-PRODUCT-AUDIT.md` (جديد)، `src/components/ui/{PageHeader,AppButton,StatusPill,Pagination,Banner}.astro` + `statusTones.ts` (جديد)، `src/components/{Navbar.tsx,EmptyState.astro}`، `src/components/lab/LabTestForm.tsx`، صفحات: `manager/index`، `supervisor/index`، `employee/index`، `manager/workload`، `findings/index`، `reports`، `search`، `404`، `admin/users`، `admin/templates`، `lab/{search,audit,tests/index,tests/review,products,calibration,retests,documents,templates,equipment,acknowledgements}`، `scripts/{test-ui-consistency(جديد),ui-screenshots(جديد),test-manifest,test-dashboard-reports,test-lab-change-requests,test-production-operations,test-scheduled-notifications,test-db-doctor}.mjs`، `package.json`.
- **Status**: delivered محليًا — لا commit ولا push ولا deploy (القاعدة الثانية)؛ الالتزام على المستخدم. القسم 1 تجاوز حده مسبقًا (~594 سطرًا الآن) — الأرشفة للقسم 2 قرار جلسة قادمة (نمط موثق متكرر). رسالة مقترحة: `feat(qc): product UI/UX reconstruction — design system + shared primitives (PageHeader/AppButton/StatusPill/Pagination/Banner), grouped nav with aria-current, unified pagination/status/badges, role attention strips, workload+reports+findings rebuilds, SSR window crash + sticky-bar overflow fixes, UI consistency guard (52 suites) + 60-shot visual QA`

### 2026-08-27 21:34 — PROMPT8-CHECKLIST: إضافة تشيك ليست تنفيذ لـ prompt8.md بنفس أسلوب prompt5-LAB.md — نجاح، بدون commit/push/deploy

**الحالة:** نجح

**المطلوب باختصار:**
- إضافة قسم تشيك ليست (حالة تنفيذ + تبعيات + ترتيب نهائي) لملف `audit/qc/QC-Task-Manager/prompt8.md` مطابق لأسلوب `prompt5-LAB.md`

**تم تنفيذه:**
- أُضيف رأس توثيقي (Repository/Target/Execution model) + قسم "How to Use This Checklist" + "Global Prompt Execution Status" (22 برومبت 00–21) بأعلى الملف
- حالة التنفيذ: 00–05 معلّمة ✅ (مطابقة للواقع الموثق بالعقل: baseline, reporting, migration parity, test gate, deployment, auth/password lifecycle migration 036 + AI safe mode) و06–21 ☐
- أُضيف قسم "Execution Dependencies & Blocking" يوثق تبعيات الحجب: 06 قبل 11/13/17، 09 بعد 02/03، 10 يعتمد على primitives الـ 06، 15 يعتمد على 01، 12 يعتمد على 06، 20 SOURCE-BLOCKED، 21 أخيرًا
- استُبدل قسم "الترتيب النهائي" النصي بـ "FINAL EXECUTION ORDER" على مراحل A–E بمربعات تحقق + "DEFINITION OF DONE" + "AGENT EXECUTION CONTRACT" (بما فيها خطوة تحديث التشيك ليست نفسه وسجل العقل بعد كل برومبت)
- لا تعديل على محتوى البرومبتات نفسها (00–21) — فقط الأقسام الهيكلية

**الملفات المتأثرة:**
- `audit/qc/QC-Task-Manager/prompt8.md`

**التحقق:**
- Build: لم يُشغّل (تغيير توثيقي فقط — لا يمس الكود)
- Lint/Typecheck: غير مطلوب
- Tests: غير متأثرة
- فحص يدوي: ✅ قراءة الملف بعد التعديل (رأس الملف سليم، لا تكرار، نهاية الملف محدثة)

**قرارات/ملاحظات:**
- Skills used: none — no matching skill found (مهمة توثيق برومبتات، ما فيه مهارة مطابقة في `.agents/skills/`)
- الحالة الابتدائية للتشيك: 00–05 ✅ حسب ما أثبته العقل سابقًا؛ 20 معلّم SOURCE-BLOCKED في الترتيب لأن صفحات المصدر المسيطر 2/3 و3/3 غير متوفرة
- ملف توثيقي فقط — لا commit (على المستخدم)

**مشاكل مفتوحة:**
- لا يوجد

**الخطوة الجاية:**
- بدء تنفيذ Prompt 06 (Full Product UI/UX Reconstruction) حسب التشيك ليست الجديدة

---

### 2026-08-27 — QC-AUTH-PILOT-HARDENING-005: تقوية المصادقة لتحقيق التجربة التجريبية — دورة أول-تسجيل-دخول لكلمة المرور (migration 036) + AI safe launch — بدون commit/push/deploy
- **Scope**: `apps/qc-task-manager/` فقط؛ قرأت العقل كاملًا أولًا. حافظت على الموجود: bcrypt، جلسات server-side، نموذج 12h، القفل بعد 5 محاولات، حد الـ IP (20/10د)، وسلوك الدummy hash ضد الـ enumeration — صفر استبدال معماري. لا commit ولا push ولا deploy.
- **Migration 036_password_lifecycle.sql (التالية التسلسلية بعد 035)**: `must_change_password INTEGER NOT NULL DEFAULT 0 CHECK (0|1)` + `password_changed_at TEXT`. **قرار backfill موثق**: الحسابات القائمة تبقى 0 حتى لا تُقفل مشغّلين قائمة mid-pilot؛ العلم يُفعَّل للمضي: createUser/resetPassword/seed. المرآة في `db/schema.sql` + entry في `migrationRegistry.ts` بنمط `?raw` الحرفي. عدّادات النسخة 35→36 موزعة على: `test-migrations.mjs` (fresh ×2 + ترقية v31 صارت 5 هجرات + نطاق 011-035→011-036 = 26)، `test-production-operations.mjs`، `test.mjs` (init-db). **route-manifest صار 110 file routes** (أُضيف `/account/security`).
- **دورة كلمة المرور**: `SessionData.mustChangePassword` تُشتق read-time من صف users داخل `getSession` — إعادة تعيين الأدمن تحبس حتى الجلسات القائمة فورًا. `User` توسّع بالحقلين. `auth.ts::changeOwnPassword(userId, current, new, currentToken)`: تحقق كلمة المرور الحالية (dummy-compare للـ id المجهول ضد timing)، نفس سياسة `passwordResetSchema`، داخل transaction: hash جديد + تصفير العلم + ختم `password_changed_at` + `DELETE FROM sessions WHERE user_id=? AND token != current` — **الجلسة الحالية تبقى** (متطلب 10) والبقية تموت (متطلب 9). `users.ts`: `createUser` يزرع العلم=1 (كلمة أدمن مؤقتة) و`resetPassword` يعيد تفعيله + يصفّر `password_changed_at` (يبقى سلوك فك القفل). `seed.ts`: الحسابات المزروعة (الـ4 + demo emp_sara/emp_omar) تنبصّر بالعلم=1 — مع باب fixture موثق `QC_SEED_MUST_CHANGE_PASSWORD=0` قارئه الوحيد seed.ts، للأقراص المؤقتة فقط.
- **البوابة (middleware)**: بعد جدار الـ auth وقبل حواجز الأدوار وتوزيع الـ POST — الجلسة المعلَّمة لا تصل إلا `/account/security` (GET + POST عبر `handlePasswordChangePost` مع CSRF) و`/logout`؛ كل صفحة/API/POST آخر يرجع 302 للصفحة. `index.astro` و`login.astro` (bounce الموقّع) صارا flag-aware. POST /login يوجّه المعلَّم مباشرة للصفحة بفلاش info. صفحة `/account/security` لكل الأدوار (طوعية + إجبارية، تعرض آخر تغيير من DB، بنر تحذيري عند الإجبار) + رابط Account بالـ Navbar (ديسكتوب + قائمة الجوال). **صفر تسجيل لكلمات المرور أو الهاشات** في أي مسار جديد.
- **AI safe launch**: `provider.ts` أُعيد هيكلته — `resolveAiRuntimeConfig`/`isAiProviderConfigured`/`AI_NOT_CONFIGURED_MESSAGE` (قراءة GROQ_API_KEY ما زالت في ملف واحد). `src/lib/ai/health.ts` جديد: `AiProviderHealth` (configured bool + provider + model + timeoutMs + maxRetries — المفتاح **لا يظهر أبدًا**). `AiNotConfiguredError` في service.ts يميّز عدم-التهيئة عن الفشل العابر؛ `api/ai/[feature].ts` يرجعه 503 JSON `{aiUnavailable:true}`؛ `AiReviewPanel` يعرض حالة غير-متاح محكومة (ملاحظة amber + تعطيل الزر) — كل واجهات AI تستخدم المكوّن الوحيد فالتغطية كاملة. قسم "AI provider" جديد في `/admin/system-health` (عبر `systemHealth.ai`). `docs/AI-SAFE-LAUNCH.md` جديد بقائمة المشغّل الإلزامية ومنها حرفيًا **"ROTATE THE PROVIDER KEY OUTSIDE THE REPOSITORY BEFORE ENABLEMENT."** + `DEPLOYMENT.md`: صفّا env جدول (GROQ_API_KEY يشير للقائمة + تحذير QC_SEED_MUST_CHANGE_PASSWORD).
- **مسح الأسرار**: grep ريبو-كامل لأنماط gsk_/AIza/sk-ant/xox/ghp/Bearer = **0 إصابة**؛ ملفات `.env.example` المتتبعة تحمل placeholder فارغًا. ملاحظة قائمة (قرار مستخدم معلّق سابقًا): `qc_tasks.db` ما زال متتبعًا.
- **اختبارات جديدة**: `scripts/test-auth-password-lifecycle.mjs` (أمر `test:auth-password-lifecycle`، مسجل → **51 canonical suites**): 23 فحصًا تشمل العلم عند seed/create/reset، changeOwnPassword (خطأ حالي/سياسة/نجاح/موت الجلسات الأخرى/بقاء الحالية)، SessionData flag، وopt-out الـ fixture بعملية child معزولة، وعدم تسجيل أسرار. `scripts/e2e-auth-password-flow.mjs` (مسجل بالـ e2e-registry → **27 canonical E2E**): يشغّل سيرفره بنفسه على منفذ 4540 **بدون** opt-out وبدون GROQ_API_KEY مع التقاط stdout/stderr — 40/0: أول-دخول redirect، 10 محاولات bypass مباشرة كلها ترتد، رفض الحالي/المطابقة/السياسة، logout مسموح، نجاح التغيير، موت الجلسة الثانية وبقاء الحالية، إعادة تفعيل العلم بعد reset الأدمن (الأدمن يكمل إجباره أولًا)، AI غائب → 503 محكوم + system-health، وصفر أسرار في لوج السيرفر.
- **سويتات محدثة (spec-drift مشروع)**: `e2e-auth-lockout` F يتحقق الآن أن reset يعيد العلم ويوجه لـ /account/security (45/0 معزولًا)؛ `e2e-admin-users` 3 و12 يتحققان من العلم و/account/security (51/0 معزولًا). `e2e-acceptance.mjs` suiteEnv يضبط `QC_SEED_MUST_CHANGE_PASSWORD='0'` (fixture فقط، موثق) حتى تبقى توقعات الـ 26 سويت القائمة كما هي والسويت الجديد يتجاوزه عمدًا ببيئة سيرفرفه.
- **Verification**: `pnpm typecheck` = 0 errors/0 warnings/17 hints (259 ملفًا) · `pnpm test:manifest` = 51/27 guard PASS · `pnpm test:migrations` PASS · `test:auth-password-lifecycle` **23/0** · `e2e-auth-password-flow` **40/0** · `e2e-auth-lockout` **45/0** · `e2e-admin-users` **51/0** · `NODE_ENV=production pnpm build` = Complete (تحذيرات Vite المعروفة غير الحاجزة) · مسح الأسرار 0. **حدود صادقة**: السلسلة الكاملة `pnpm test` أُعيد تشغيلها بعد إصلاح آخر عدّاد قديم (init-db 35→36 في test.mjs) لكنها **قُطعت قبل الاكتمال** — حالتها الخضراء الكاملة غير مثبتة هذه الجلسة؛ وكذلك `pnpm e2e:acceptance` الكامل لم يُشغَّل. كلاهما أول خطوة للجلسة القادمة. لا production verification.
- **Files**: `db/migrations/036_password_lifecycle.sql` (جديد)، `db/schema.sql`، `src/lib/migrationRegistry.ts`، `src/lib/{types,auth,users,seed,validation,session,systemHealth}.ts`، `src/middleware.ts`، `src/lib/ai/{provider,health(جديد),service}.ts`، `src/pages/account/security.astro` (جديد)، `src/pages/{index,login}.astro`، `src/pages/api/ai/[feature].ts`، `src/pages/admin/system-health/index.astro`، `src/components/{Navbar,AiReviewPanel}.tsx`، `scripts/test-auth-password-lifecycle.mjs` (جديد)، `scripts/e2e-auth-password-flow.mjs` (جديد)، `scripts/{test-migrations,test-production-operations,test.mjs,e2e-auth-lockout,e2e-admin-users,e2e-acceptance,e2e-registry,test-manifest}.mjs`، `package.json`، `docs/{AI-SAFE-LAUNCH(جديد),DEPLOYMENT}.md`.
- **Status**: delivered محليًا — لا commit ولا push ولا deploy (القاعدة الثانية). المتبقي: إعادة `pnpm test` الكاملة حتى النهاية + `pnpm e2e:acceptance` كامل، وقائمة المشغّل بعد النشر (AI-SAFE-LAUNCH.md). رسالة مقترحة: `feat(qc): first-login password lifecycle (migration 036, forced /account/security, session invalidation) + AI provider-health diagnostics & safe-launch operator checklist`

### 2026-08-27 — QC-DEPLOYMENT-CONTRACT-004: مطابقة عقد نشر QC بين التوثيق والتنفيذ — دعم QC_BACKUP_DIR بتشغيل التطبيق + 21 فحص عقد جديد + فصل موثق عن blueprint الجذر — بدون commit/push/deploy
- **Scope**: `apps/qc-task-manager/` فقط؛ قرأت العقل كاملًا أولًا. صفر لمس لـ `render.yaml` الجذري (خدمة `brightai-site` العامة سليمة حرفيًا — يؤكدها فحص العقد الجديد). لا deploy ولا paid resources، وحجم القرص ترك قرار مشغّل. لا commit ولا push.
- **انحرافات اكتُشفت وأُزيلت (3)**: (1) `docs/DEPLOYMENT.md` كان يدّعي أن `render.yaml` الجذري "يعرّف QC كخدمة Node ثانية (qc-task-manager) مع قرص دائم sizeGB: 1 وautoDeploy: false" — **والحقيقة: render.yaml الجذري ما فيه أي ذكر لـ QC (grep صفر نتائج، خدمة وحيدة brightai-site)**؛ الخدمة حذفها المستخدم بقرار موثق («لا تستعيد») والتوثيق بقي يصف نسخة قديمة. (2) **عقد QC_BACKUP_DIR مقطوع**: التوثيق (DEPLOYMENT/DATABASE/RESTORE/ARCHITECTURE/README) وسكربتات CLI الثلاثة يعلنون ويقرأون `QC_BACKUP_DIR`، لكن تشغيل التطبيق الفعلي (`db.ts` → `BACKUP_DIR = backupDirectoryForDatabase(DB_PATH)`) كان يتجاهله تمامًا فالـ scheduler وأدمن backups وpre-migration backups ينزلون دائمًا في `<db-dir>/backups` حتى لو ضبط المشغّل متغيرًا آخر. (3) تناقض داخلي بالتوثيق: جدول الإعدادات يقول build بـ `--frozen-lockfile` + `NODE_ENV=production` وجدول "blueprint" يقول `pnpm install` بدون lockfile، وعبارة "matches root engines" غير دقيقة (الجذر `>=20`).
- **القرار المعماري (فصل موثق لا إضافة للـ blueprint)**: QC يبقى **خارج render.yaml الجذري عمدًا** — (أ) قرار المستخدم الموثق سابقًا، (ب) مولد الـ redirects يعيد كتابة render.yaml وقد داس خدمة QC مرتين تاريخيًا، (ج) أي Apply للـ blueprint كان سينشئ paid resources (الأقراص الدائمة بخطط مدفوعة فقط) — ممنوع بالمهمة، (د) Render يقرأ blueprint من جذر الريبو فقط فلا يوجد مسار مدعوم لـ blueprint متداخل. النشر = خدمة Web Service تُنشأ يدويًا من الداشبورد بالإعدادات الموثقة؛ health يفحص تطبيق QC نفسه (`/api/health`) مو الموقع العام.
- **تنفيذ خيار A (QC_BACKUP_DIR)**: `configuredBackupDirectory(dbPath, env)` جديدة في `backup.ts` — القيمة المضبوطة (trimmed) تكسب، والفارغة/غير المضبوطة ترجع لـ `backupDirectoryForDatabase` (سلوك سابق محفوظ). صار مصدر الحقيقة الوحيد: `db.ts` (BACKUP_DIR للـ scheduler/health/admin/migrations)، `backup-scheduler.ts` (schedulerOptionsForDatabase)، `backup-db.mjs`، `restore-db.mjs`، `init-db.mjs` (كانت fallback تابعتها `resolve(DB_DIR,'backups')` تختلف عند مسار مخصص — وحّدتها)، و`admin/backup.ts` صار يستهلك BACKUP_DIR الثابت بدل إعادة حل. استخرجت `resolveDatabasePath(env)` من db.ts (نفس الأسبقية: QC_DATABASE_PATH > QC_DB_PATH > `<app>/db/qc_tasks.db`) لتكون قابلة للاختبار بلا إعادة تحميل وحدة.
- **الاختبار الجديد (`scripts/test-deployment-contract.mjs`، أمر `test:deployment-contract`، مسجل canonical → 50 سويت)**: 21 فحصًا — قبول instance واحد ورفض `WEB_CONCURRENCY>1`/`RENDER_NUM_INSTANCES>1`/`QC_SQLITE_INSTANCE_COUNT>1`/`QC_HORIZONTAL_SCALING=true` قبل فتح DB؛ حل مسار DB بالأسبقية الثلاثية؛ حل مسار backup (QC_BACKUP_DIR يكسب، relative يُحل absolute، فارغ → fallback) + **QC_BACKUP_DIR يُقرأ في مكان واحد فقط** (guard مصدري يفشل على أي قارئ ثانٍ في src) + كل المستهلكين على الـ helper المشترك؛ نظافة الأسرار (لا console.* يقرأ قيمة سر، رسالة مخالفة العقد لا تسرّب env أخرى، health.ts بلا process.env ويعرّف نفسه qc-task-manager)؛ طوبولوجيا الريبو (render.yaml بلا qc-task-manager + DEPLOYMENT.md موثقة المسارات ولا تدّعي الـ blueprint القديم + **ممنوع sizeGB بالتوثيق** — قرار المشغّل).
- **توثيق محدّث**: `DEPLOYMENT.md` — قسم "Deployment topology" يشرح الفصل المتعمد بأربعة أسباب، جدول env كامل (QC_BACKUP_DIR صار معلنًا كمتغير يقرؤه التشغيل + optional: QC_BACKUP_RETENTION/GROQ_API_KEY/QC_DISK_CAPACITY_GB، SESSION_SECRET محجوز مو مطلوب)، و**قائمة تحقق pre-pilot سبعية** (قرص مثبت / مسار DB متحقق / كتابة backup متحققة / persistence بعد restart / health PASS / audit chains PASS / integrity PASS). `RESTORE.md` يلزم بمطابقة QC_BACKUP_DIR مع دليل التطبيق. `DATABASE.md`/`ARCHITECTURE.md`/`README.md` حدثت مرجع المتغيرات. `PILOT-IMPLEMENTATION-STATUS.md` صف Deployment تحول من MISSING إلى DOCUMENTED مع المتبقي على المشغّل.
- **إثبات تشغيلي للحزمة المبنية**: خادم `dist/server/entry.mjs` على temp DB مع `QC_BACKUP_DIR` مخصص → pre-migration backup + catch-up backup المجدول + status.json كلها نزلت بالدليل المخصص، و`<db-dir>/backups` الافتراضي **لم يُنشأ**، و`/api/health` قبل القاعدة 503 وبعدها 200 (`ready/dbInitialized/schemaVersion 35`). السيرفر أُغلق و/temp نُظف.
- **Verification**: `pnpm test:deployment-contract` **21/21** · `pnpm test:manifest` **50 canonical suites** · `pnpm test:production-operations` PASS · `pnpm test` **السلسلة الكاملة 50 سويت exit 0** · `pnpm typecheck` **0 errors/0 warnings/17 hints** · `NODE_ENV=production pnpm build` **Complete** · `git diff --check` نظيف. التغييرات 16 ملفًا + ملف اختبار جديد، كلها داخل apps/qc-task-manager.
- **Files**: `src/lib/backup.ts`، `src/lib/db.ts`، `src/lib/backup-scheduler.ts`، `src/pages/api/admin/backup.ts`، `scripts/{backup-db,restore-db,init-db,test-deployment-contract(جديد),test-manifest}.mjs`، `src/env.d.ts`، `package.json`، `docs/{DEPLOYMENT,DATABASE,RESTORE,ARCHITECTURE,PILOT-IMPLEMENTATION-STATUS}.md`، `README.md`. القسم 1 صار ~563 سطرًا — تجاوز الحد قائم من جلسات سابقة والأرشفة للقسم 2 تؤجل مجددًا كقرار موثق (نمط الجلسات الثلاث الأخيرة).
- **Status**: delivered محليًا — لا commit ولا push ولا deploy (القاعدة الثانية)؛ النشر الفعلي (إنشاء خدمة الداشبورد + إرفاق القرص + تشغيل القائمة) على المستخدم. رسالة مقترحة: `fix(qc): honor QC_BACKUP_DIR across runtime+CLI via shared configuredBackupDirectory, document separate manual Render deployment, add 21-check deployment-contract suite`

### 2026-08-27 — QC-TEST-GATE-003: سجل الاختبارات/القبول صار يستحيل انحرافه بصمت — حارس يفحص نظام الملفات + Lab Search E2E مسجل رسميًا + أول إثبات كامل لـ e2e:acceptance (28/28، exit 0) — بدون commit/push/deploy
- **Scope**: `apps/qc-task-manager/`؛ قرأت العقل كاملًا أولًا. لا commit ولا push ولا deploy — التغييرات محلية على 9 ملفات scripts/package.json فقط، صفر لمس لمنطق الإنتاج أو migrations.
- **Registry architecture (الهدف B)**: أنشأت `scripts/e2e-registry.mjs` — مصدر الحقيقة الوحيد لسطح الـ E2E: `CANONICAL_E2E_SUITES` (26 سويت مرتبة تشمل lab-search) + `E2E_SCRIPT_CLASSIFICATIONS` (4 تصنيفات موثقة: e2e-registry=registry-data-module، e2e-acceptance=meta-orchestrator، e2e-persistence=runner-persistence-phase، e2e-task-search=spec-imported-by:scripts/e2e-search.mjs). `test-manifest.mjs` توسع بـ `TEST_SCRIPT_CLASSIFICATIONS` (3: test-manifest=registry-data-module، test-manifest-guard=meta-guard، test-report-pdf-arabic=manual-diagnostic:known-broken). `e2e-acceptance.mjs` صار يستورد السجل (بلا قائمة hardcoded) و`run-full-tests.mjs` فحص ربط نصي.
- **الحارس الجديد (`test-manifest-guard.mjs`)**: يعيد الكتابة لفحص نظام الملفات فعليًا ويفشل على القواعد الست: (1) أمر test:* بـ package.json غايب عن المانيفست (2) أمر المانيفست غايب عن package.json (3) ملف scripts/test-*.mjs يتيم غير مصنف (4) ملف scripts/e2e-*.mjs يتيم غير مصنف (5) ملف مسجل غير موجود على القرص (أي مرجع scripts/*.mjs بأي أمر مسجل، مع حل ../../scripts ضد جذر الريبو) (6) إدخالات canonical مكررة (مانيفست/labels/scripts). + تحقق ربط بنياوي: e2e-acceptance لازم يستورد e2e-registry وrun-full-tests يستورد test-manifest. مثبت سلبيًا: ملفا e2e/test وهميان يتيمان → 2 رسائل فشل وexit 1، وبحذفهم → pass.
- **التصنيفات (على الواقع مو التخمين)**: `test-lab-search.mjs` شغلته → **67/0 PASS** (فشل الـ RBAC الموثق قديمًا انحل) → سجلته canonical `test:lab-search` → **49 canonical suites**. `e2e-lab-search.mjs` سجلته بالـ runner (الهدف A) بلا أي إضعاف لعزله/تغطيته. `test-report-pdf-arabic.mjs` أداة تشخيص يدوية (--artifact/qlmanage) غير مسجلة إطلاقًا و**معطوبة موثقًا عند HEAD**: تفشل "Arabic location drawn visually ordered" + "diacritic cell drawn via mark positioning" + "Report ID data under header" ثم تكرش TypeError سطر 160 (locData undefined) — سجلتها manual-diagnostic:known-broken مع سبب مكتوب؛ الإصلاح+التسجيل مهمة مستقلة (يتطلب قرار: هل reverse أم mark-positioning هو العقد الصحيح للـ PDF writer).
- **Enhanced acceptance summary (الهدف C)**: ملخص القبول صار يتضمن لكل سويت: الاسم، السكربت، passed/failed assertions، duration، timeout status؛ وtotals: عدد السويتات (28 = 26 + مرحتا persistence)، إجمالي assertions (2261+ — persistence pass/fail بالاستثناء بلا عدّاد فـ`?` صادق و"parsability incomplete" معلنة)، HEAD SHA، dirty status. المحافظ كامل: DB معزول لكل سويت، منفذ معزول (persistence port صار محسوب 4500+26+1 بدل 4512 الثابت)، CHILD_TIMEOUT SIGTERM→SIGKILL، server teardown، browser teardown، restart persistence suite.
- **إصلاحات انحراف حقيقية (4 سويتات — كلها spec-drift من تحسينات مشروعة، صفر تخفيف تغطية)**: (1) `e2e-lab-documents` (85/0): جرد روابط 7→27 (الصفحة صارت desktop table + mobile cards كلاهما بالـ DOM + صفحة reader بروابط code/title/View)، الشريط 5→6 (حبة In Review Queue لحالة IN_REVIEW)، وفرز review كان يضغط رأس جدول desktop والمصفوفة 390px من سيناريو overflow السابق (البطاقات الجوال تستبدل الجدول) → viewport desktop + محدد دقيق `sort=review&` بدل `sort=review` (كان يطابق review_due_date). (2) `e2e-lab-acknowledgements` (49/0): تأكيد "no acknowledge buttons" كان يعدّ كل form[method=post] وطاح على فورم "Save this view" (saved views) الظاهر للأدوار → المحدد صار `form[action$="/acknowledge"]` (نفس الغرض أدق). (3) `e2e-lab-retests` (46/0): (أ) الموظف ما يُطرش من نموذج retest بعد — عقد RBAC-expansion: الإرسال يفتح RETEST_REQUEST بالطابور وينع توجيه لـ/lab/change-requests بدون إنشاء retest مباشر → السيناريو صار يختبر المسار الحقيقي كاملًا وينظف الطلب; (ب) الاعتماد صار يفرض e-signature (`esignature_password`) → السويت يرسله → **التغطية قويت** (يختبر طبقة التوقيع). (4) `e2e-lab-search` (21/0): **عيب fixtures حقيقي** — `testNum.slice(-5)` للاختبارين ينتج نفس آخر 5 خانات (A/B خارج نافذة القطع) فمعرفا العينتين متطابقان، وبحث الموظف عن "عينة الموظف الآخر" كان يطابق عينته هو بشكل مشروع — العزل سليم والملتبسة كانت بالـ fixtures → المعرفات صارت `LAB-TEST-E2E-A/B<tag>-S01` مميزة، وعزول employee/manager وchecks الجوال/الديسكتوب بقيت حرفيًا.
- **منهجية التحقق**: بعد كل إصلاح شغلت السويت معزولة على سيرفر+قاعدة temp (مطابق لشروط الـ runner: fresh DB + warmup POST /login + منفذ معزول) قبل أي إعادة كاملة، فسبقت ذيل السويتات (reports 912/0، persistence create/verify بعد restart، calendar، notifications، data-quality) بدل حرق دورات كاملة.
- **Verification (الرسمي، من البداية)**: `pnpm test:manifest` = **49 canonical suites / 26 canonical E2E / 3+4 classified — exit 0** · `pnpm test` = **49 سويت canonical + الميتا، exit 0** · `NODE_ENV=production pnpm build` = **Complete** · `pnpm e2e:acceptance` = **28/28 سويت (26 + مرحتا restart-persistence)، 2261+ assertion، 0 failed، 75,419ms، exit 0** — **أول إثبات كامل موثق للبوابة بعد كل إصلاحات التسريب/الـ cleanup التاريخية** (HEAD cca4168f، شجرة العمل dirty بتغييرات هذه المهمة فقط — موثق بالملخص ذاته). `git diff --check` CLEAN.
- **Files**: `scripts/e2e-registry.mjs` (جديد)، `scripts/test-manifest.mjs`، `scripts/test-manifest-guard.mjs`، `scripts/e2e-acceptance.mjs`، `scripts/e2e-lab-documents.mjs`، `scripts/e2e-lab-acknowledgements.mjs`، `scripts/e2e-lab-retests.mjs`، `scripts/e2e-lab-search.mjs`، `package.json` (أمر test:lab-search). القسم 1 صار ~545 سطرًا — الأرشفة قرار جلسة قادمة.
- **Status**: delivered محليًا — لا commit ولا push (القاعدة الثانية)؛ الالتزام على المستخدم. رسالة مقترحة: `test(qc): filesystem-inspecting registry guard + e2e registry (lab-search registered) + enhanced acceptance summary — first full green e2e:acceptance (28/28)`

### 2026-08-27 — QC-MIGRATION-PARITY-002: توحيد هوية migration 031 بين القرص والحزمة المدمجة + سجل مدمج ثابت مُختبَر — تحقق محلي كامل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ صفر تعديل على محتوى ملفات الهجرات المطبّقة (001–035 بقيت حرفيًا كما هي) وصفر migration جديدة — لا 036 ولا غيرها. لا commit ولا push ولا deploy.
- **Root cause**: مصفوفة `embeddedMigrations` داخل `src/lib/db.ts` كانت تعرّف النسخة 031 بـ `{ file: '031_placeholder.sql', source: '-- reserved migration version 031\n' }` بينما القرص فيه `031_reserved.sql` بمحتوى مختلف — تعارض بالمحاور الثلاثة اللي يتحقق منها الـ runner (file/name/checksum). **أرقام 031 قبل**: مدمج file=`031_placeholder.sql` name=`placeholder` SHA-256=`10c69696100d19596d793d5006fa7b327986e564241e7e37bbf25b9b3503ead3` مقابل قرص file=`031_reserved.sql` name=`reserved` SHA-256=`421fb7b7802126b8b86b787266e5994e7f24acf919fa8a771bda88abed071655`. **بعد**: الطرفان `031_reserved.sql`/`reserved`/`421fb7b7802126b8b86b787266e5994e7f24acf919fa8a771bda88abed071655`. الأثر العملي للباغ: أي إقلاع من bundle بدون مجلد `db/migrations` بجانبه (production deploy) يقرأ السجل المدمج فيفجّر `checksum/name drift detected` على قاعدة مُهجّرة من القرص.
- **Refactor**: أُنشئ `src/lib/migrationRegistry.ts` كسجل مدمج ثابت — `EMBEDDED_MIGRATIONS` بـ Object.freeze للسجل وكل entry، ويستورد الـ 35 ملفًا كلها بـ `?raw` حرفيًا (031 بنفس النمط تمامًا زي باقي الهجرات). `db.ts` صار يمرر `EMBEDDED_MIGRATIONS` جاهزة بدل مصفوفة inline، ونوع `embeddedMigrations` في `migrations.ts` وُسّع لـ `readonly` (لا mutation). السجل data-only بلا side effects فيُستورد في اختبارات Node بدون فتح قاعدة.
- **New test**: `scripts/test-embedded-migration-parity.mjs` (أمر `test:embedded-migration-parity`، مسجّل بالـ canonical manifest → **48 canonical suites**) يفحص: كل ملف قرص له entry مدمج والعكس، filenames/versions/names مطابقة، التسلسل 1..N في الجهتين، تطابق المصدر بالبايتات + SHA-256 لكل entry، أن كل source مربوط بـ `?raw` import لنفس الملف (strings inline ممنوعة — هذا اللي كان يسمح لباغ 031)، وأن `db.ts` يستهلك السجل المجمد فعليًا. **مثبت سلبيًا**: إعادة إدخال باغ 031 القديم بالسجل = 4 رسائل فشل (missing/extra/order/count) وexit 1.
- **db-doctor**: قسم جديد منفصل "embedded bundle parity (repository vs embedded registry)" مستقل عن حالة القاعدة ويُطوى في PASS/FAIL الإجمالي؛ عشان استيراد السجل صارت `db:status`/`db:verify` و`runDoctor` في `test-db-doctor.mjs` تمرر `--import ../../scripts/test-ts-loader.mjs`. حدّثت سطرًا واحدًا في `docs/PILOT-IMPLEMENTATION-STATUS.md` لموضع الـ registry.
- **Verification (كلها على HEAD + شجرة العمل هذه)**: `pnpm test:migrations` PASS (fresh 35/35، second run = 0 applied، checksum drift guard، rollback/recovery، destructive guard) · `pnpm test:embedded-migration-parity` PASS **35/35 byte-identical** · `pnpm test:db-doctor` PASS · `pnpm db:status` على قاعدة temp مُهيأة (`/tmp`، حُذفت بعد الفحص): schema version **35**، `031 reserved MATCH` وchecksum القاعدة المسجّل = هاش القرص حرفيًا، `integrity_check: PASS`، `foreign_key_check: PASS`، `embedded bundle parity: PASS`، إجمالي PASS · `pnpm test` = **48 canonical suites PASS** · `pnpm typecheck` = **0 errors / 0 warnings / 17 hints** · `NODE_ENV=production pnpm build` = **Complete**.
- **حدود التحقق**: اختبار الـ parity في بيئة الاختبار يقرأ القرص حيًا عبر الـ loader (الجانبان نفس المصدر)، فتعديل ملف قرص بعد الـ build يكشفه drift guard وقت الإقلاع وdb-doctor (DB vs disk) — الـ parity test يثبت أن الحزمة تُبنى حرفيًا من ملفات القرص عبر ربط `?raw` الصارم + مطابقة المجموعات والترتيب.
- **Files**: `apps/qc-task-manager/src/lib/migrationRegistry.ts` (جديد)، `scripts/test-embedded-migration-parity.mjs` (جديد)، `src/lib/db.ts`، `src/lib/migrations.ts`، `scripts/db-doctor.mjs`، `scripts/test-db-doctor.mjs`، `scripts/test-manifest.mjs`، `package.json`، `docs/PILOT-IMPLEMENTATION-STATUS.md` (سطر واحد). القسم 1 صار ~537 سطرًا بعد هذا السجل (آخر عدّ موثق 518 "ضمن الحد") — الأرشفة للقسم 2 قرار جلسة قادمة عند تجاوز ملموس.
- **Status**: delivered محليًا — لا commit ولا push (القاعدة الثانية)؛ الالتزام على المستخدم. رسالة مقترحة: `fix(qc): align embedded migration 031 with 031_reserved.sql via frozen migrationRegistry + byte-parity guard test`

### 2026-08-27 — QC-REPORT-TRANSPORT-001: تحقق شامل من نقل تقارير HTTP في QC Task Manager — النقل موجود ومكتمل بصفر تغييرات كود — كل الأوامر خمسة + E2E معزول PASS

- **Scope**: `apps/qc-task-manager/` — تحقق وإثبات فقط (read-only). قرأت العقل كاملًا أولًا. صفر تعديل كود؛ شجرة العمل نظيفة تمامًا بعد المهمة. لا commit/push/deploy.
- **Root cause**: المسارات المُبلّغ عنها كمفقودة موجودة فعلًا في الشجرة — `src/pages/api/reports/[reportType].[format].ts` (يطابق `/api/reports/<type>.csv|xlsx|pdf`) و`src/pages/api/reports/audit.ts`. بلاغ "المفقود" قديم/غير دقيق؛ السبب الجذري المحتمل أن المصدر راجع شجرة قديمة. النقل كان أُعيد بناؤه في QC-REPORTING-TRANSPORT-FIX-008 وQC-ROUTE-AND-REPORTING-SOURCE-TRUTH-017 وهو سليم حتى HEAD الحالي (`1e7bf03d` + working tree نظيف).
- **Audit of requirements (1–18)**: يعيد استخدام catalog/scope/queries/writers الموجودة (`src/lib/reporting/**`) بلا محرك ثانٍ ✅ · auth إلزامي عبر `requireApiUser` (302 للـ anonymous) ✅ · النطاق يُحسب من الـ actor حصرًا (`resolveReportScope` لا يثق أبدا بـ query للـ supervisor/employee؛ `scope=organization` الوحيدة المعلنة وتُرفض للـ employee بـ403) ✅ · reportType/format غير صحيح = 404 JSON، فلاتر غير مدعومة/تواريخ/enums خاطئة = 400 (`parseReportFilters` يرفض أي query key خارج allowlist) ✅ · Content-Type صحيحة للثلاث صيغ + `attachment; filename="<reportType>.<ext>"` آمنة (لا مدخل مستخدم في الاسم) ✅ · لا path interpolation من مدخل ✅ · audit عبر `report_audit_log` الكنسي (start/complete/fail) + endpoint الـ audit محمي بـ `authorizeReportAudit` (employee يرى صفوفه فقط) ✅ · لا افتراضات علمية جديدة ✅.
- **Verification**: `pnpm typecheck` = **0 errors / 0 warnings / 17 hints** · `pnpm test:dashboard-reports` PASS · `pnpm test:lab-reports` = **196/0** · `pnpm test:route-manifest` = **109 file routes / 25 middleware / 6 guards** · `pnpm test` = **47 canonical suites PASS** · `NODE_ENV=production pnpm build` = **Complete** · **E2E معزول**: خادم `dist/server/entry.mjs` على قاعدة SQLite temp مع seed عبر warmup POST /login ثم `node scripts/e2e-reports.mjs` = **912 passed / 0 failed** (يشمل CSV/XLSX/PDF لكل الأنواع الـ24، anonymous 302، employee/supervisor 403 على scope مزفّر، manager org-wide، audit persistence 302 صف completed، Content-Type/filenames، فلاتر تاريخ/مستخدم). الخادم المؤقت أُغلق وقاعدة temp حُذفت.
- **Files**: لا تغييرات — شجرة العمل نظيفة (`git status` فارغ). القسم 1 بلغ 518 سطرًا قبل هذا السجل (ضمن الحد).
- **Status**: delivered (verification + brain only) — النقل مكتمل ومطابق للعقد المطلوب بالكامل؛ لا تغييرات تُلتزم. إذا تكرر بلاغ "routes missing" فالمطلوب تحديد البيئة/الـ HEAD الذي رُصد فيه لأن الشجرة الحية سليمة. baseline كامل لتطبيق QC Task Manager قبل الـ pilot — كل الأوامر الإلزامية خمسة PASS — تقرير حالة دائم أنشئ بدون أي إصلاح أو commit/push/deploy

- **Scope**: `apps/qc-task-manager/` — baseline فقط (read-only + ملف حالة واحد). قرأت العقل كاملًا أولًا. لا إصلاحات، لا commit، لا push، لا deploy.
- **Environment**: HEAD = `1e7bf03d82b1c954a183be563c669dd3d2339877` · Node v22.22.3 · pnpm 10.19.0 · working tree شبه نظيف: `?? audit/qc/QC-Task-Manager/prompt8.md` فقط (خارج شجرة التطبيق).
- **Baseline commands (كلها exit 0 / PASS)**: `typecheck` = 256 ملفات/0 errors/0 warnings/17 hints · `test:manifest` = 47 canonical suites · `test:route-manifest` = 109 file routes/25 middleware routes/6 guards · `test:migrations` = PASS كامل (fresh + legacy upgrade + checksum + rollback + destructive guard) · `NODE_ENV=production build` = Complete مع تحذيرات Vite المعروفة غير الحاجزة.
- **Delivered**: `apps/qc-task-manager/docs/PILOT-IMPLEMENTATION-STATUS.md` — فيه HEAD، حالة الشجرة، كل أمر بكوده ونتيجته، طابور P0/P1/P2 بتصنيف صادق (IMPLEMENTED/PARTIAL/MISSING/BLOCKED/RUNTIME-NOT-VERIFIED)، وخريطة ملفات دقيقة لـ: reporting transport، migration 031 (reserved slot مقصود — `031_reserved.sql` سطر واحد)، test manifest، E2E acceptance runner، deployment، authentication، user audit، accessibility، Lab navigation، WI import.
- **Key findings (بدون إصلاح — قرار المستخدم)**: (1) **render.yaml ما فيه أي خدمة QC** (محذوفة بقرار المستخدم موثق سابقًا) → deployment = MISSING فعليًا للـ pilot. (2) **e2e:acceptance الكامل RUNTIME-NOT-VERIFIED** — موثق تاريخيًا أنه ما اكتمل مرة واحدة حتى النهاية (cleanup FK في task-shared + تسريب متصفح سابق). (3) سويتات lab-search اليتيمة (test-lab-search/e2e-lab-search) ما زالت غير مسجلة بقرار معلق. (4) ملفا `qc_tasks.db`/`qc_tasks 3.db` المتتبعان ما زالا موجودين. (5) WITHDRAWN state لتغيير الطلبات ما زال MISSING. (6) Groq key rotation + live AI smoke = RUNTIME-NOT-VERIFIED.
- **Status**: delivered (status doc + brain only) — التوصية للمهمة الجاية: E2E acceptance كامل واحد حتى النهاية على HEAD نظيف، ثم قرار deployment target. لا commit ولا push.

### 2026-08-24 — PHASE2-AUTHORITY-ENGINE-001: تنفيذ Phase 2 كاملًا (بحث سعودي + أصول قابلة للربط + Gate 0 حي) — 9 ملفات بaudit/phase2/ + تصدير CSV/JSON لسجل المخاطر — بدون commit/push/deploy

- **Gate 0 (أدلة حية مباشرة):** الإنتاج **static-only**: `/api/health/`=404، هيدر `x-brightai-build` غايب نهائيًا، و209 تحويلات legacy كلها 404 حيًا — بينما نفس dist المحلي يعطي health=200 وتحويلات 301 والهيدر موجود → **ROOT CAUSE مثبت: الكود سليم والإنتاج ما يشغّل node server رغم render.yaml** (تغيير بمستوى لوحة Render). وكتلة Cloudflare Managed robots **ما زالت حية** (164 سطر تمنع GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider/Applebot-Extended/Amazonbot/meta-externalagent + ai-train=no) — أعد الفحص بعد جلسة STRATEGIC الموازية: ما زالت موجودة. خطوات الإصلاح الدقيقة للمستخدم: `audit/phase2/gate0-production-truth-and-remediation.md`. المحتوى الثابت الحي سليم (agentic حية، sitemap حي مطابق، llms.txt بالكيان الجديد).
- **بحث فعلي 44 استعلامًا** (20 عربي + 14 إنجليزي + 7 AI-proxy + نطاق) عبر 3 وكلاء: **brightai.site غائب عن كلها**؛ الظهور الوحيد = #1 على «BrightAI Saudi» و«BrightAI AI Governance» عبر /en/. خريطة الطلب CSV ب24 استعلامًا بتقييم /35 (19 فرصة ≥25) — أعلى 5: سجل المخاطر 34، إطار سدايا 31 (نافذة سبق — أخبار فقط منذ إطلاقه)، جدار الحماية العربي 31 (SERP مخطوف من تطبيق أندرويد!)، التصنيف 30، سجل التدقيق 30.
- **تصادم كيان موثق:** bright.ai الأمريكية (Physical AI، جولة 51M$ يوليو 2025، TechCrunch/SiliconAngle) تملك SERP «BrightAI» المجردة وحتى بحث «brightai.site» يصحح تلقائيًا لها؛ حساباتنا X/LinkedIn صفر ظهور بحثي؛ عبارتنا «Saudi AI Safety OS» يتيمة (المحرك يقول "ما فيه منتج بهذا الاسم"). الاستراتيجية: بناء على المُقيّدات المملوكة + توصية alternateName "BrightAI Saudi" + تعريف العبرة نصيًا داخل الصفحات + تفعيل الحسابات.
- **AI Search:** 0/7 prompts عبر وكيل بحث ويب (ChatGPT/Perplexity/Gemini مباشرون = غير متاحين، موثق بصدق). من يُقتبس بدلًا عنّا: sdaia.gov.sa/my.gov.sa + مكاتب محاماة (cms.law/twobirds/gowlingwlg) + بائعون أجانب بصفحات هبوط سعودية إنجليزية (modulos/securiti/cyberarrow/complyan) + منافسون محليون (evc.sa/crux.sa/alplatform.ai). التشخيص الجذري الثلاثي: robots يمنع الزواحف (P0-A) + صفر backlinks + غياب صفحات إنجليزية للنيّات — مش مشكلة صياغة فقرات.
- **منفذ كودًا:** (1) **سجل المخاطر = الأصل رقم 1 مُرقّى**: تصدير CSV+JSON client-side (`public/js/ai-risk-register-export.js` جديد — Blob محلي صفر شبكة، BOM `\uFEFF` للعربية في Excel، progressive enhancement بشريط `hidden` يظهر بJS فقط، طباعة تخفيه، متوافق CSP بلا inline handlers، 5 صفوف فارغة جاهزة بالملف) + data island JSON بالصفحة (`set:html` على script application/json) + اختبار عقد وسّع **2/2 PASS**. (2) **جسر روابط firewall→pdpl-chatgpt-doc** في `src/data/solutions.ts` (تحقق grep كشف 4 جسور مفقودة؛ هذا الوحيد الآمن لأن باقي ملفاتها كانت تُحرَّر آنذاك بالجلسة الموازية) → ظاهر بالـ HTML المبني.
- **قرارات معمارية موثقة:** Agentic AI = مالك واحد فقط لا صفحات جديدة · Firewall vs AI Gateway = قسم داخل الصفحة التجارية لا URL جديد · Shadow AI = قسم داخل use-case-discovery لا URL جديد · hub/security غايب عن بطاقات /hub/ رغم وجوده بالsitemap = قرار بطاقة أو دمج · money pages = توصيات أسئلة مشترٍ موثقة بالتقرير بدون تعديل قوالب (Credo/Holistic/Akamai/Lakera يجيبون: أطر مربوطة؟ مدة جاهزية؟ تكاملات؟ latency/FPR؟ — الجميع بلا عربي وبلا SDAIA-native وبلا أسعار معلنة).
- **Digital PR:** وكيل البحث وقف بحد استخدام أسبوعي (يعود 2026-08-27) → القائمة مبنية بأمانة: 10 أهداف OBSERVED بأدلة بحث هذه الجلسة (الجزيرة/المدينة/عاجل غطوا ورشة إطار سدايا 2026-08-04 = زاوية إعلامية ساخنة الآن؛ الشرق الأوسط؛ الجزيرة تك؛ AIGA_KSA؛ siyadhai بحذر...) + 12 KNOWN-TARGET موسومة «تحقق يدوي». لا outreach آلي ولا شراء روابط.
- **Files:** `audit/phase2/{brightai-phase2-authority-report.md, saudi-search-demand-map.csv, topic-coverage-matrix.csv, internal-authority-flow.csv, ai-search-visibility-matrix.csv, saudi-digital-pr-targets.csv, entity-disambiguation-report.md, phase2-execution-ledger.csv, gate0-production-truth-and-remediation.md}` + `src/pages/tools/ai-risk-register/index.astro` + `public/js/ai-risk-register-export.js` (جديد) + `scripts/ai-risk-register.test.mjs` + `src/data/solutions.ts`.
- **Verification:** اختبارات العقد المتأثرة **9/9 PASS** (risk-register 2 + firewall 2 + agentic 2 + strategic-ai-answer 3 — شاملة شغل الجلسة الموازية) · `npm run build` = **Complete** كامل بالـ patch-entry (commit 93daa87e) · `seo:check` **4/4 PASS** · `internal-links:audit` **0 orphans / 0 broken / depth≤3** · `redirects:check` نظيف · `performance:budget` **PASS** (يشمل ملف JS الجديد) · `verify:csp-drift` 7 headers×2 files بلا drift · `seo:hreflang` **All passed** · HTML المبني: data-island=1، export-module=1، hidden-bar=1، onclick=0، H1=1، جسر firewall=1 · أصلحت newline الزائد بـ `scripts/ai-risk-register.test.mjs:69` المذكور بسجل STRATEGIC الموازي و`git diff --check` صار نظيفًا على كل ملفاتي.
- **Status:** delivered محليًا — **PENDING USER ACTION: (1) Cloudflare AI Crawl Control OFF + Purge، (2) Render Web Service Node + deploy، (3) commit المستخدم، (4) ربط GSC وتصدير 90 يوم**. لا commit ولا push ولا PR ولا أي تغيير إنتاجي من الوكيل.

### 2026-08-24 — STRATEGIC-AI-ANSWER-CONTENT-001: تحسين 11 صفحة كنونية للاستشهاد والـ AI answers — نجاح محلي بلا commit/push/deploy

- **Scope**: غُطّيت حوكمة AI، Governance Platform، دليل مخاطر SDAIA، NCA، PDPL، ISO 42001، AI Firewall، Agentic AI Governance، Banking Riyadh، Readiness Assessment، وأُضيفت صفحة مستقلة `/hub/agentic-ai-security/` حسب موافقة المستخدم؛ كل المحتوى ظاهر للزائر وserver-rendered، بلا cloaking أو claims تسويقية مفقودة من الصفحة.
- **Content/GEO**: أضيف direct answer سعودي، `آخر تحديث: 2026-08-24`، panel مصدر رسمي أولي، فصل صريح بين «متطلب أو إرشاد رسمي» و«منهج BrightAI للتنفيذ»، وجداول/checklists/مصفوفات/دورات أصلية مرئية مع تعريف واضح لكيانات SDAIA/NCA/SAMA/ISO ومنتجات BrightAI.
- **Machine-readable**: أُعيدت كتابة `public/llms.txt`, `public/llms-full.txt`, `public/ai.txt` لتسرد الصفحات الكَنونية عالية القيمة فقط وتطابق النسخة المرئية؛ سقطت claims Cloud/Hybrid/Air-Gapped غير المثبتة على الصفحات. build ولّد sitemap محليًا وفيه **262 URL**.
- **Files**: مكونات hub الثلاثة المحدثة + `AgenticAiSecurityPillar.astro`، `src/pages/hub/{index,[slug]}.astro`، صفحات solutions/governance/banking، PDPL/NCA/ISO، readiness، و`scripts/strategic-ai-answer-content.test.mjs` مع spec/plan في `docs/superpowers/`.
- **Verification**: العقد الجديد **3/3 PASS**؛ `pnpm build` = Complete؛ `pnpm seo:check` PASS (**262 sitemap URLs / 279 HTML / 273 full scanned**)؛ schema **62** + speakable **266** PASS؛ hreflang **263** sets/0 errors؛ internal links **17,201**/0 broken/0 orphan/0 خارج sitemap؛ HTML المبني **11/11** فيه H1 واحد وعناصر GEO المرئية. تحذيرات Astro route-collision وVite/Prisma القديمة غير حاجزة.
- **Known boundary**: `git diff --check` الشامل يظل يفشل في newline زائد بملف مستخدم غير متعلق `scripts/ai-risk-register.test.mjs:69`؛ scoped check لملفات هذه المهمة PASS. لا تحقق إنتاج/GSC أو تعديل Cloudflare Managed robots (الموثق سابقًا كحاجز خارجي).
- **Archive**: نُقل سجل SEO-DESIGN-BASELINE-001 الأقدم من section 1 إلى أعلى section 2 لإبقاء القسم الحي تحت حد ~500 سطر.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy.

### 2026-08-24 — FIVE-PILLAR-INTERNAL-LINKING-001: إعادة بناء روابط المحاور الخمسة — نجاح محلي بدون commit/push/deploy

- **Scope**: ربط المحتوى المعلوماتي بخمسة مالكين كنونيين: `/hub/ai-governance/`، `/hub/sdaia-ai-risk-management/`، `/hub/security/`، `/hub/compliance/`، `/hub/agentic-ai-governance/`. قاعدة الـ owner تعمل فقط عند تطابق slug/category/tags مع الموضوع، وتضيف رابطًا واحدًا وصفيًا بدل تكرار anchor exact-match أو حشو روابط غير سياقية.
- **Answer pages / breadcrumbs**: كل صفحات `/answer/*` الـ17 صارت تملك `furtherReading` لمحورها الكنسي؛ قالب الجواب يعرض breadcrumb مرئيًا ويولد `BreadcrumbList` JSON-LD لنفس السلسلة. هذا يكمل الاستثناء الوحيد من breadcrumbs؛ docs/blog/hub كانت موحدة مسبقًا.
- **Commercial/context links**: العلاقات المطلوبة مثبتة في السياق: Governance Hub → Governance Platform؛ SDAIA Risk → Risk Classification + Human Approval؛ PDPL/NCA → AI Firewall؛ ISO 42001 → Readiness Assessment (أضيف الرابط الناقص)؛ Agentic → Audit Trail + Human Approval (أضيف الرابط الناقص) + Evidence File؛ Banking Riyadh → Evidence File. ما أضيفت روابط من محتوى لا يخدم الوجهة.
- **Graph/report**: تقرير before/after في `audit/report/2026-08-24-five-pillar-internal-link-graph.md`؛ الروابط الداخلية المكتشفة **17,125 → 17,133**، owners الصريحة في answers **3 → 17**، breadcrumbs answers **0 → 17**.
- **Files**: `src/pages/blog/[...slug].astro`, `src/data/answers.ts`, `src/pages/answer/[slug].astro`, `src/components/hub/AgenticAiGovernancePillar.astro`, `src/content/blog/iso-42001-saudi-implementation-guide.md`, والتقرير.
- **Verification**: `pnpm build` مكتمل (تحذيرات Astro route-collision وVite/Prisma القديمة فقط)؛ `npm run internal-links:audit` PASS: **0 broken / 0 orphans / 0 outside sitemap / depth 3**؛ 17 answer HTML فيها breadcrumb وBreadcrumbList؛ `git diff --check` PASS. بقيت **19 no-href** و**103 hash** findings baseline وليست من هذا التغيير.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy.

### 2026-08-24 — AGENTIC-AI-GOVERNANCE-PILLAR-001: إضافة محور معلوماتي مستقل لحوكمة Agentic AI — نجاح محلي بدون commit/push/deploy

- **Scope**: أُضيفت صفحة معلوماتية قابلة للفهرسة تحت `/hub/agentic-ai-governance/`، منفصلة عن أي صفحة أمن للوكلاء، تركّز على نموذج التشغيل والمساءلة والموافقات ودورة الحياة والأدلة.
- **Content/design**: مكوّن `AgenticAiGovernancePillar.astro` باللهجة السعودية يشرح الأدوار الأربعة (مالك الأعمال، المالك التقني، مالك المخاطر والامتثال، المعتمد)، دورة `register → classify → grant tools/data → enforce policies → approve high-risk actions → log → monitor → review`، مخطط دورة بصري، RACI table متجاوب، approval flow، checklist، وأمثلة evidence. أُضيف تنبيه واضح أن قدرات BrightAI لبنات تشغيلية داعمة وليست ضمان امتثال أو بديلًا عن القرار القانوني/المؤسسي.
- **Architecture/links**: أُسجل المسار في `src/pages/hub/[slug].astro`، وأُضيف لبطاقات وفهرس `/hub/` مع `hasPart` في CollectionPage، ورابط سياقي من محور الحوكمة العام. لا تغيير على صفحة Agentic AI Security ولا نسخ لمحتواها.
- **SEO/indexability**: title/description طويلة الذيل حول ownership/approvals/evidence، self-canonical و`index, follow` عبر `ArabicLayout`، H1 واحد، sitemap المحلي صار **261 URL** ويشمل المسار الجديد، ولا توجد إشارات noindex أو رابط أمني مباشر داخل الصفحة.
- **Files**: `src/components/hub/AgenticAiGovernancePillar.astro`, `src/pages/hub/[slug].astro`, `src/pages/hub/index.astro`, `src/components/hub/AiGovernancePillar.astro`, `scripts/agentic-ai-governance.test.mjs`, `public/sitemap.xml`, `sitemap.xml`، ومخرجات build المعتادة `.astro/content-assets.mjs`.
- **Verification**: contract test **2/2 PASS**؛ `pnpm build` **Complete**؛ built HTML تحقق: H1=1، noindex=0، canonical صحيح، lifecycle/RACI/approval/evidence موجودة، والمسار في sitemap؛ `git diff --check` **PASS**. `node scripts/seo-health-check.mjs` فشل فقط في 3 مشاكل legacy معروفة لمسارات `404.html` و`500.html` كما في baseline، ولا تخص الصفحة الجديدة. بقيت تحذيرات Astro route-collision وVite/Prisma القديمة غير الحاجزة.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy. تغييرات `audit/SEO-Execution-Prompts.md` كانت موجودة مسبقًا وحُفظت بدون تعديل.

### 2026-08-24 — SEARCH-RECOVERY-ROOT-CAUSE-001: تدقيق واسترداد بحث شامل ( crawl→index→rank→AI ) — إصلاحات P0 محلية مثبتة + تصنيف خارجي صادق — بدون commit/push/deploy

- **Scope**: تنفيذ برومبت Ultimate Saudi Search Recovery كاملًا على الموقع العام: فحص حي مباشر (curl/WebFetch لعناوين brightai.site) + تحقيق جذري بالبناء المحلي + إصلاح كل القابل للإثبات محليًا + 5 مخرجات (تقرير رئيسي + 3 CSVs + deck). المخرجات: `audit/report/brightai-search-indexing-root-cause-master.md`, `brightai-search-issue-ledger.csv`, `brightai-owner-url-map.csv`, `brightai-arabic-content-language-audit.csv`, `brightai-search-recovery-deck.md`.
- **P0 مكتشف حيًا (1) — Cloudflare Managed robots.txt فعّال ويمنع زواحف AI**: الـ robots.txt الحي (164 سطر، مسترجع مباشرة) فيه كتلة `# BEGIN Cloudflare Managed content` تمنع صراحة `GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider, Applebot-Extended, Amazonbot, meta-externalagent` + `Content-Signal: ai-train=no` — عكس سياسة المستخدم المعلنة (فتح كامل، SEO-CRAWLER-POLICY-002) وعكس نص الملف نفسه ("must be OFF"). ملف الريبو نظيف (103 سطر، صفر Disallow) — الحقن من إعداد AI Crawl Control بلوحة Cloudflare. **EXTERNAL CHANGE REQUIRED**: تعطيله + purge (الكاش الحافّي 4 ساعات). هذا أقوى تفسير لغياب الموقع عن ChatGPT/Claude/Gemini grounding.
- **P0 مكتشف حيًا (2) — كل التحويلات القديمة 404 في الإنتاج**: عينات مثبتة حيًا من كل الفئات: `/about.html`, `/services/finance.html`, `/blog/cloude-opus-4.6(.html//)`, `/blog/ai/`, `/services/kpi-dashboard-guide/` كلها 404، بينما نفس dist محليًا يعطي 301 صحيحة. السبب الجذري مزدوج: (أ) `src/lib/legacy-redirects.mjs` كان **كودًا ميتًا** (لا يستورده أحد؛ توثيقه يقول "يستهلكه middleware.ts" — غير صحيح، والـ middleware نفسه لا يعمل للمسارات غير المطابقة في standalone adapter — مثبت تجريبيًا، قرار DEC-BAI-IDX-22 صحيح)، (ب) `resolveRedirectsJsonPath()` بدون الـ cwd fallback الموعود بتعليقه + `dist/redirects.json` لا يُشحن أبدًا → الخريطة Runtime فارغة بصمت، (ج) Astro static يُسقط مفاتيح `.html` من manifest. **الإصلاح (BAI-IDX-REDIR-001)**: شحن `dist/redirects.json` + cwd fallback + وحدة sync جديدة `src/server/legacy-redirect-map.mjs` (تعيد استخدام expandVariants/findLegacyRedirect — صفر تكرار منطق) تنسخ كـ `dist/server/_legacy-redirect-map.mjs` وتُسلك بـ listener المرقّع **داخل fallback الـ staticHandler فقط** (لا تخطف صفحات حقيقية) مع حارس self-redirect. التحقق: خادم dist محلي — `.html` وslash keys كلها 301، الصفحات الحقيقية/API بـ200، `scripts/legacy-redirects.test.mjs` جديد **5/5 PASS**. يشفى الإنتاج عند أول deploy.
- **P0 مكتشف محليًا (3) — 5 صفحات حقيقية تُطبع كـ stubs تحويل ذاتي**: `/blog/`, `/docs/`, `/en/`, `/assessment/ai-governance-readiness/`, `/docs/nca-ecc-ai-controls/` صارت ببناءات اليوم ملفات 291 بايت `meta-refresh` تحول لنفسها (`Redirecting from /blog/ to /blog/`). السبب: Astro static يطبّع مفاتيح تحويل بلاحقة `.html` (مثل `/blog.html`→`/blog/`) على مسار الصفحة الحقيقية فيطغطها. الإنتاج لم يتأثر (صفحات حقيقية حية — الإنتاج مبني من نسخة ناجاة) لكنها لغم بنيوي. **الإصلاح (BAI-IDX-REDIR-002)**: فلترة تصادمية في `generate-all-redirects.mjs` تفحص كل أشكال تطبيع المفتاح ضد staticPages **+ توسيع staticPages لمجموعات المحتوى** (blog/docs/hub — القديم كان يفحص `from` الخام فقط ولا يرى صفحات dynamic). النتيجة: 200 قاعدة (9 skipped)، البناء **صفر تحذيرات تصادم** (كانت 26)، والصفحات الخمس حقيقية بالكامل، و`meta_refresh` استبعاد sitemap كشبكة أمان.
- **P1 مكتشف ومُصلح — صفحة الأداة اليتيمة + استبعاد sitemap لأدوات/**: `/tools/ai-risk-register/` (أُضيفت أمس) كانت يتيمة (صفر روابط واردة، unreachable) **وخارج sitemap** (قائمة السماح `groupRelPath()` بدون فرع tools/ — أي أداة مستقبلية كانت بتستبعد تلقائيًا). الإصلاح: 3 روابط سياقية (قسم تصنيف المخاطر بالمحور `AiGovernancePillar.astro` + `docs/ai-risk-management.md` خطوة 1 مع تحديث `updated` لـ2026-08-24 + صفحة التقييم) + فرع `tools/` بالمولّد. التحقق: `internal-links:audit` **0 orphans/0 broken/0 outside sitemap/depth 3 PASS** (كان 1/0/1)، sitemap **260 URL** (كان 259).
- **P2 مُصلح — لغة**: مسح كامل للعبارات الرسمية الممنوعة عبر src = إصلاح حالة واحدة (`يتيح للمؤسسات` بدليل NCA ECC → صياغة سعودية عامية). الباقي سليم.
- **تدقيق حي إيجابي**: الرئيسية 200 + `x-robots-tag: index,follow` + HSTS/CSP، http→https وwww→apex وslash normalization كلها 301 صحيحة، 404 حقيقي، sitemap حي 259 بلا utility URLs، noindex محصور بالـ16 استثناء الموثقة. **الكيان**: llms.txt الحي ما زال بالحسابات القديمة (BrightAISite/TikTok/Crunchbase) — إصلاح جلسة ENTITY-CONSISTENCY-001 الموازية (المكتملة والمسجلة) يحتاج **commit + deploy**.
- **SERP سعودي (بحث مباشر 2026-08-24)**: المعلوماتي العربي = حكومي (واس/سدايا) + مواقع محلية (siyadhai.com، isohere.sa)؛ التجاري العربي «منصة حوكمة الذكاء الاصطناعي» = KriftAI أقرب منافس مباشر + dgp.sdaia.gov.sa؛ الإنجليزي التجاري = شركات GRC (Complyan/CyberArrow/Modulos) + منصة امتثال السعودية؛ «AI firewall» إنجليزي = العمالقة (Securiti/Akamai/Cloudflare/AccuKnox) بينما **«جدار حماية الذكاء الاصطناعي» بالعربي شبه فاضي** — فرصة `/solutions/ai-firewall/`. حقيقة موثقة: سدايا ضمن أوائل الجهات عالميًا بISO 42001:2023 (واس) ووزارة البيئة حصلت عليه 2025، وسدايا تلزم شركات AI بالتسجيل بمنصة حوكمة البيانات الوطنية (فرصة محتوى).
- **Environment notes**: (أ) مشكلة اختفاء `dist/client` مؤقتًا (iCloud/Desktop) تكررت وأعادت إنتاج سيناريو sitemap ناقص — عولجت بإعادة الخطوات، والتوصية تبقى: ابنِ خارج Desktop عند تكرارها. (ب) وكيلا بحث بالخلفية وقفوا بحد استخدام النموذج (يرجع 09:31) — البحث اكتمل مباشرة بدونهم. (ج) `.astro/content-assets.mjs` عدّله البناء (artifact) وفيه whitespace — مو من الكود اليدوي. (د) توقيت اكتشاف الـ stubs منع وصولها للإنتاج — الإنتاج الحالي سليم.
- **Verification كامل**: `npm run build` Complete (بعد إصلاح المولّد) · `seo:check` exit 0 · `seo:schema` exit 0 (بعد مزامنة FAQ 19 ملف) · `seo:gate` PASS 0 errors · `seo:hreflang` PASS 0 errors · `internal-links:audit` PASS 0/0/depth3 · `redirects:check` 0 chains/cycles · `seo:word-count` 96/96 · `legacy-redirects.test.mjs` 5/5 · `entity-consistency.test.mjs` 1/1 · فحص خادم dist محلي لكل فئات التحويل والصفحات الحقيقية والـ API. GSC/LHCI/live-post-deploy = N/A (موثقة بالتقرير).
- **Status**: كل الإصلاحات جاهزة محليًا؛ الخارجي المتبقي: (1) تعطيل Cloudflare managed robots + purge، (2) commit + deploy (يشفّي التحويلات + الكيان + sitemap 260)، (3) توصيل GSC وتصدير 90 يوم قبل أي قرار cannibalization. لا commit ولا push ولا PR ولا أي تغيير إنتاج من الوكيل.

### 2026-08-24 — ENTITY-CONSISTENCY-001: توحيد هوية BrightAI والروابط الاجتماعية وبيانات الثقة — نجاح محلي بدون commit/push/deploy

- **Canonical identity**: صارت `src/data/site.ts` مصدر الحقيقة لاسم BrightAI، الرابط `https://brightai.site`، الشعار `/assets/images/logo.png`، السوق `Saudi Arabia`/الدولة `SA`، ووصف عربي/إنجليزي ثابت: BrightAI منصة سعودية لحوكمة وأمان الذكاء الاصطناعي للمؤسسات في المملكة العربية السعودية / BrightAI is a Saudi AI governance and safety platform for organizations in Saudi Arabia.
- **Organization/schema**: `src/data/schema-helpers.ts` و`src/components/seo/Schema.astro` و`public/schema-saudi-seo.json` تستخدم نفس هوية Organization و`@id`، مع إزالة `NGO` والـtaxID/identifier الوهميين وتصحيح أبعاد الشعار إلى 400×400. صفحات About/Contact تشير إلى العقدة الكنسية بدل تكرار بيانات متضاربة.
- **Official profiles**: القائمة الكنسية الوحيدة هي X `https://x.com/brightai_sa`، LinkedIn `https://www.linkedin.com/company/brightai-saudi/`، وGitHub `https://github.com/YEEEAE/BRIGHTAI`. أزيلت الروابط التاريخية أو غير المؤكدة من `ai.txt` و`llms*.txt` وبيانات الصفحات المُرحّلة وصفحة 500.
- **Metadata/content trust**: أضيف `og:locale:alternate` و`twitter:site`/`twitter:creator`. About/Contact يستخدمان منهجية التشغيل، المصادر، وآخر تحديث بدل badges أو credentials غير موثقة؛ أزيلت شهادات مزعومة وأسماء أدوار غير مدعومة. لم تُضف reviewer metadata لعدم وجود دور مراجعة عام موثق.
- **Dates**: تم إصلاح `updatedDate` لمقال Vision 2030 ليكون بعد `pubDate`. قوالب المقالات تستخدم المؤلف والتواريخ الموجودة فعليًا، ولم تُخترع تواريخ نشر للأدلة التي لا تملكها.
- **Files**: `src/data/site.ts`, `src/data/schema-helpers.ts`, `src/components/SEOHead.astro`, `src/components/seo/Schema.astro`, `src/components/Footer.astro`, `src/layouts/BlogLayout.astro`, `src/pages/about/index.astro`, `src/pages/contact/index.astro`, `public/schema-saudi-seo.json`, `public/ai.txt`, `public/llms.txt`, `public/llms-full.txt`, `public/500.html`, `src/data/migrated-pages/*.json`, `src/content/blog/vision-2030-ai-governance-roadmap.md`, `scripts/entity-consistency.test.mjs`.
- **Verification**: contract tests **PASS**؛ built HTML entity contract **PASS**؛ article date audit **PASS**؛ migrated JSON **26/26 PASS**؛ `pnpm build` سجل `Complete!` مع تحذيرات route-collision/Vite القديمة المعروفة؛ `pnpm seo:check` **PASS**؛ `pnpm seo:schema` **PASS**؛ `pnpm typecheck` **0 errors / 0 warnings / 17 hints**؛ `git diff --check` **PASS**.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy. الـcommit على المستخدم.

### 2026-08-24 — AI-RISK-REGISTER-TEMPLATE-001: إضافة قالب سجل مخاطر AI عملي للمنشآت السعودية — نجاح محلي بدون commit/push/deploy

- **Scope**: أُضيفت صفحة مستقلة قابلة للفهرسة تحت `/tools/ai-risk-register/` تعرض قالبًا عمليًا بـ15 حقلًا: حالة الاستخدام، النظام/النموذج/المورد، مالك العمل، أنواع البيانات، المستخدمون المتأثرون، فئة الخطر، الاحتمالية، الأثر، مستوى الخطر، الضوابط، الموافقة البشرية، المراقبة، الأدلة، تاريخ المراجعة، والحالة.
- **Content boundary**: صيغت التعليمات باللهجة السعودية، والمصفوفة العامة 1–5 موسومة صراحة بأنها **قالب تنفيذ من BrightAI** وليست درجة رسمية من سدايا أو تصنيفًا تنظيميًا. أُضيفت روابط `AI Risk Classification` و`AI Governance Readiness Assessment`، مع أمثلة شات بوت خدمة العملاء وفرز السير الذاتية.
- **UX/accessibility**: جدول semantic مع `caption` و`scope="col"`، `data-label` لعرض كل صف كبطاقة على الجوال، شارات نصية للاحتمالية/الأثر/مستوى الخطر/الحالة، CSS print-friendly، وبدون client JavaScript أو inline onclick لتوافق CSP.
- **Files**: `src/pages/tools/ai-risk-register/index.astro`, `scripts/ai-risk-register.test.mjs`, `docs/superpowers/specs/2026-08-24-ai-risk-register-design.md`, `docs/superpowers/plans/2026-08-24-ai-risk-register.md`.
- **Verification**: contract test **1/1**؛ `node_modules/.bin/astro build` = **Complete**؛ built route موجود؛ H1=1؛ noindex=0؛ الرابطان الداخليان موجودان؛ `onclick` inline=0؛ `git diff --check` لا توجد أخطاء محتوى (مع ملاحظة fsmonitor IPC من Git المحلي). تحذيرات route-collision وVite/Prisma القديمة بقيت كما هي.
- **Browser/CSP notes**: smoke check Playwright لم يرجع مخرجات قابلة للاعتماد في البيئة الحالية، لذلك لم أعتبر مقاسي 360/1440 مثبتين آليًا. سكربت `scripts/verify-csp-no-unsafe-inline.mjs` المذكور في التعليمات غير موجود؛ فحص المصدر والبناء أثبتا عدم وجود `onclick` في الصفحة.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy. الـcommit على المستخدم.

### 2026-08-24 — GA-SEO-AUDIT-002: تنفيذ خطة SEO السعودية الشاملة — Owner URL map + تدقيق cannibalization + إصلاح ادعاءات P0 متناقضة + ربط الرئيسية بالمحور — نجاح محلي

- **Scope**: تنفيذ برومبت Saudi SEO Authority Master Execution كاملًا (Phases 0-30) على الموقع العام. التقرير الرئيسي: `audit/report/brightai-saudi-authority-master-plan.md` (31 قسمًا). قراءة العقل كاملة + فحص المصادر عبر 4 وكلاء متوازيين + تحقق مباشر. لا push ولا deploy؛ المستخدم التزم بالتغييرات يدويًا أثناء الجلسة في `bbb9e4fb` (مع شغل جلسة موازية: control-matrix + AI-FIREWALL-PAGE-002).
- **Owner URL model (متحقق من الكود)**: `/` = Brand+Saudi Category (title «حوكمة الذكاء الاصطناعي السعودية»)، `/solutions/ai-governance-platform/` = Commercial («منصة حوكمة الذكاء الاصطناعي التشغيلية»)، `/hub/ai-governance/` = Informational («وش هي حوكمة الذكاء الاصطناعي؟»). الفصل بين الثلاثة سليم؛ التداخل من الداعمة (kernel/docs/answer/blog).
- **P0 fix — ربط الرئيسية بالمحور**: الرئيسية كانت تحوي **صفر** روابط إلى `/hub/ai-governance/`. أُضيفت بطاقة سادسة في «أدلة مهمة» + بطاقة أولى في «اكتشف المزيد» (grid صار 2/4 أعمدة) بأنكورات وصفية («مركز معرفة حوكمة الذكاء الاصطناعي»). dist تحقق: رابطان فعليان.
- **P0 fix — ادعاءات متناقضة/مفبركة (الأهم)**: (1) «99.7% نسبة الامتثال في عملاء BrightAI» استُبدلت بـ«9 حلول حوكمة وتشغيل» (قابلة للتحقق) — كانت تناقض pricing «لا ندّعي امتثالاً كاملاً». (2) FAQ «متوافقة مع PDPL من اليوم الأول» → «صُممت لدعم جاهزية الامتثال». (3) صف «الشهادات» ISO 27001/SOC 2 → «معايير نعمل وفق مبادئها» + سطر «لسنا جهة اعتماد» (كان يناقض ai.txt). (4) chip «ISO 27001 · SOC 2» → «TLS 1.3 · Zero Trust». (5) أرقام غير موثقة (+15 عميل/+365 يوم/+12K نقطة) بالرئيسية وabout → +9 حلول/+30 وثيقة/3 أوضاع نشر/100% توثيق الطلبات. (6) «دعم 24/7» → «مؤسسي» (24/7 باقة Enterprise). (7) about: حُذفت «الأولى»/«الشريق التقني الأول»/«الامتثال الفوري»/«SOC 2 Type II»/«أمان مطلق» وقسم «شراكاتنا» صار «نعمل وفق ضوابط... بدون ادعاء شراكة أو اعتماد». (8) trust: «نضمان الامتثال التام»/«امتثال كامل»×4/«شهادة NCA ECC» → صيغ جاهزية؛ «99.95% وقت التشغيل الفعلي» → «99.5% الحد الأدنى لـ SLA» (يطابق pricing). (9) solutions.ts: حالة حكومية بنتيجة مفبركة («اجتازت مراجعة NCA بدون مخالفات»+98%) → «سيناريو توضيحي» معلن + نتيجة واقعية؛ حُذف «رائد». (10) solutions-content-generated: «ضمان التوافق/التوافق الكامل»×7 → «دعم جاهزية الامتثال» + إصلاح 4 typos مسافات («مؤسستكتحتاج»×2، «الحوكمة الحقيقيةلا»×2). (11) landing-pages trustSignals×6 + TrustBadges tooltips×4 «امتثال لـ» → «دعم جاهزية الامتثال لـ». (12) SplitHero: نص مكسور «بيانات الشركةمن... BRIGHT AI» أُصلح + «بلا مخاطر» → «آمن».
- **Cannibalization highlights (كاملة بالتقرير)**: banking=12 صفحة متنافسة، healthcare=8 (منها `/answer/ai-healthcare/` H1 مطابق حرفيًا لـ`/lp/healthcare/`)، «منصة حوكمة» يشترك فيها platform+`/kernel/`+docs، docs/answer سدايا التوليدي شبه مكررة — كلها قرارات DO NOTHING/CHANGE TITLE مشروطة بـGSC. **Agentic AI Governance/Security = صفر تغطية بالموقع كله.**
- **Verification**: `pnpm build` Complete (استُكملت post-build يدويًا — انظر Notes) · sitemap أُعيد توليده **259 URL** · seo:check PASS · seo:schema PASS (62/263) · seo:gate PASS (0 errors) · hreflang **260/0** · internal-links **0 orphans/0 broken/depth 3** · redirects:check PASS · word-count **96/96** · firewall test **2/2** · dist HTML تحقق: hub×2 + النصوص الجديدة موجودة والقديمة صفر. LHCI/GSC/live = N/A (موثق).
- **Notes/environment**: (أ) `dist/client` اختفى مؤقتًا أثناء أول build (احتمال iCloud/Desktop sync) ففشل sync-dist-flat وأنتج sitemap ناقص (121) — أُعيد التوليد بعد عودة المجلد؛ إن تكرر: ابنِ خارج Desktop. (ب) سجلت أن المستخدم التزم `bbb9e4fb` شاملًا تعديلاتي + شغل موازٍ؛ المتبقي dirty: `audit/SEO-Execution-Prompts.md` فقط (ليس مني). (ج) المتبقي بلا إصلاح (قرار مالك): DPA «آيزو 27001»، «استضافة سيادية» بلا دليل بنية، descriptions حلول audit-trail/human-approval/policy-mapping «توافق»، `/kernel/` title «منصة حوكمة»، فريق بلا صفحات مؤلفين، customers meta «جهات حكومية».
- **Status**: delivered محليًا + ملتزم من المستخدم؛ لا push ولا deploy من الوكيل. الخطوة التالية الموصىة: ربط GSC وتصدير 90 يوم ثم تنفيذ P1 (انظر §31 بالتقرير).

### 2026-08-24 — SAUDI-AI-GOVERNANCE-CONTROL-MATRIX-001: إضافة مصفوفة ضوابط حوكمة AI سعودية عملية قابلة للاقتباس والطباعة — نجاح محلي بدون commit/push/deploy

- **Scope**: أُضيف قسم مرجعي داخل `/hub/ai-governance/` في `src/components/hub/AiGovernancePillar.astro` بعنوان **Saudi AI Governance Control Matrix**. المصفوفة BrightAI practical implementation guidance وليست وثيقة رسمية أو اعتمادًا أو رأيًا قانونيًا، ولا تنسخ نصوص الأنظمة/المعايير.
- **Content**: **13** عائلة ضبط تشغيلية: inventory، ownership، risk classification، approved use/policy، data handling، human approval، security filtering، logging، audit evidence، monitoring، third-party AI، incident handling، policy updates/change review. كل صف يضم objective/risk/control/owner/evidence/related BrightAI capability/reference note. المراجع السعودية والمعايير صيغت كسياق للتحقق من النطاق، مع تنبيه أن المصفوفة ليست قائمة امتثال جاهزة.
- **UX/RTL/print**: الجدول semantic مع `caption`, `scope`, روابط capabilities، `data-label` للبطاقات على الجوال، CSS RTL منطقي، سطح مكتب بعرض قابل للتمرير، بطاقات جوال بدون overflow، وprint CSS يعيد رأس الجدول ويمنع انقسام الصفوف قدر الإمكان. أُضيف رابط داخلي من قسم `controls` إلى المصفوفة، وأضيفت للمصفوفة في فهرس الصفحة.
- **SEO/GEO**: direct-answer heading «وش هي مصفوفة ضوابط حوكمة الذكاء الاصطناعي السعودية؟»، كلمات `AI governance controls` و`Saudi AI governance control matrix` بالعربية والإنجليزية، النص ظاهر في HTML الأولي، بدون FAQ schema جديد أو noindex أو URL جديد.
- **Files**: `src/components/hub/AiGovernancePillar.astro`, `scripts/saudi-ai-governance-control-matrix.test.mjs`, `docs/superpowers/specs/2026-08-24-saudi-ai-governance-control-matrix-design.md`, `docs/superpowers/plans/2026-08-24-saudi-ai-governance-control-matrix.md`، وملفات sitemap المولدة محليًا بقيت كما أنتجها build مع تغييرات سابقة في working tree محفوظة.
- **Verification**: TDD contract test مرّ RED قبل التنفيذ ثم GREEN بعده (**1/1**). `node_modules/.bin/astro build` = **Complete**؛ build المحلي فحص **276 HTML** و`pnpm seo:check` = **PASS** (121 sitemap URL في هذا البناء، 270 صفحة كاملة + 6 partial skipped)؛ `pnpm seo:hreflang` = **260 sets / 0 errors**؛ built HTML `/hub/ai-governance/`: matrix text ظاهر بدون JS، H1=1، noindex=0، **13** rows. Playwright عبر HTTP محلي على **360px/1440px**: overflow=false، rows=13، H1=1، matrixVisible=true. ظهرت تحذيرات route-collision وVite/Prisma القديمة الموثقة سابقًا، ولم تُعدّل.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy. الـcommit على المستخدم.

### 2026-08-24 — AI-FIREWALL-COMMERCIAL-PAGE-002: تشديد حدود الـ schema والتحقق النهائي للصفحة — نجاح محلي بدون commit/push/deploy

- **Follow-up**: بعد مراجعة الـ HTML المبني، اتضح أن JSON-LD كان يضم FAQ قديمًا من المحتوى المهاجر لصفحة AI Firewall، رغم أن الواجهة الجديدة أضيق وأكثر دقة. تم منع FAQ المهاجر لهذه الصفحة فقط، مع إبقاء FAQ المرئي المقيّد بالتنفيذ الحالي.
- **Fix**: نُقل تعريف `isAiFirewall` قبل بناء `jsonLd` بعد ظهور `ReferenceError` في أول إعادة بناء؛ إعادة البناء اللاحقة مرّت بنجاح.
- **Verification**: `node_modules/.bin/astro build` = **Complete**؛ `node scripts/sync-dist-flat.mjs` = **PASS**؛ contract test = **2/2**؛ built page: title/meta الجديدان، H1=1، noindex=0، FAQPage legacy=0، الادعاءات القديمة الحساسة=0؛ `seo-health-check` = **PASS**؛ hreflang = **260 sets / 0 errors**؛ internal links = **0 orphans / 0 broken / max depth 3**؛ `git diff --check` = **PASS**.
- **Environment note**: `pnpm build` لم يُعاد تشغيله في الجولة الأخيرة لأن Corepack حاول تنزيل pnpm 10.19.0 من registry غير متاح؛ تم تشغيل Astro محليًا مباشرة من `node_modules`، ثم فُحصت خطوات المزامنة والصفحة المبنية. تحذيرات route-collision وVite/Prisma الموجودة في المشروع بقيت كما هي ولم تُعدّل.
- **Status**: الصفحة جاهزة للمراجعة المحلية تحت `/solutions/ai-firewall/`؛ لا commit ولا push ولا deploy. الملفات الجديدة/المتأثرة الأساسية: `src/pages/solutions/[slug].astro`, `src/data/solutions.ts`, `scripts/ai-firewall-commercial-page.test.mjs`, وملفات التصميم/الخطة.

### 2026-08-23 — AI-FIREWALL-COMMERCIAL-PAGE-001: بناء صفحة تجارية مخصصة لـ AI Firewall كطبقة تحكم أمنية للذكاء الاصطناعي — تحقق محلي ناجح بدون commit/push/deploy

- **Scope**: إعادة بناء واجهة `/solutions/ai-firewall/` داخل الفرع المخصص في `src/pages/solutions/[slug].astro` بدل القالب التجاري العام، مع محتوى B2B سعودي عامي يشرح ما يُفحص وما يمكن تنقيته أو حجبه أو رفعه للمراجعة وما يُسجّل، بدون ادعاء منع مثالي أو تغطية كل النماذج/القنوات.
- **Content truth boundary**: الصفحة تصف prompts، responses، PII/أنماط البيانات الحساسة المدعومة، قرارات policy، destinations/models كسطح تحكم يعتمد على التكامل والسياسة، وسياق evidence غير الحساس. أضيفت مقارنة `AI Firewall vs traditional firewall` ومقارنة `AI Firewall vs DLP` بصياغة تكاملية. PDPL/NCA/SDAIA مذكورة كدعم للتطبيق والمواءمة فقط، مع تنبيه أن الجاهزية/الامتثال النهائي مسؤولية المؤسسة وتقييمها.
- **UX/design**: اتجاه `industrial security console` مع hero مباشر يبدأ بـ «وش هو AI Firewall؟»، لوحة prompt→inspection→decision→evidence، capability cards، flow diagram بأربع مراحل، policy cards لحالات REDACT/BLOCK/FLAG/LOG، before/after scenario، جدولَي المقارنة، FAQ مرئي وCTA عالي النية. RTL، mobile-first، حالات focus، reduced-motion، بدون client JavaScript أو dependency جديدة.
- **SEO/AEO**: تحديث title/H1/meta في `src/data/solutions.ts` لإزالة ادعاء التوافق المباشر مع NCA ECC وإدخال AI security/LLM security/data leakage prevention بشكل طبيعي. الصفحة المبنية فيها H1 واحد، direct answer، المقارنتان، CTA، canonical ذاتي، ولا `noindex`.
- **Files**: `src/pages/solutions/[slug].astro`, `src/data/solutions.ts`, `scripts/ai-firewall-commercial-page.test.mjs`, `docs/superpowers/specs/2026-08-23-ai-firewall-commercial-page-design.md`, `docs/superpowers/plans/2026-08-23-ai-firewall-commercial-page.md`، و`01-mind-latest.md`.
- **Verification**: contract test = **2/2**؛ `pnpm build` = **Complete** (مع route-collision warnings قديمة وVite warnings الموثقة سابقاً)؛ `pnpm seo:check` = PASS (259 sitemap URLs، 276 HTML، H1/canonical/title/description checks)؛ `pnpm seo:hreflang` = PASS **260 sets / 0 errors**؛ `pnpm internal-links:audit` = PASS **0 orphans / 0 broken / max depth 3**؛ built HTML inspection = **H1 1، direct answer 1، canonical صحيح، noindex 0**؛ `git -c core.fsmonitor=false diff --check` = PASS.
- **Notes**: build حدّث ملفات sitemap وschema الموجودة في working tree، وبعضها يعكس تعديلات مؤسس/عنوان سابقة؛ لم تُسترجع أو تُحذف حفاظاً على شغل المستخدم. لا commit ولا push ولا deploy.

### 2026-08-23 — SDAIA-AI-RISK-GUIDE-001: إضافة دليل تنظيمي سعودي مستقل لإطار سدايا الوطني لإدارة مخاطر الذكاء الاصطناعي — تحقق محلي بدون commit/push/deploy

- **Scope**: أُضيفت صفحة مرجعية ثابتة تحت `/hub/sdaia-ai-risk-management/` مع مكوّن `src/components/hub/SdaiaAiRiskManagementGuide.astro`، وربطها بمسار hub الديناميكي وفهرس `/hub/`. لا dependency أو client JavaScript أو deploy أو commit أو push.
- **Content boundary**: الصفحة تعرض الاسم الرسمي، `SDAIA-P145`، الإصدار 1.0، أبريل 2026، مراحل المنهجية الأربع المعلنة رسميًا (تحديد السياق والنطاق، تحديد وتقييم المخاطر، المعالجة، المتابعة والمراجعة)، مصفوفة احتمال×أثر محايدة، وجدول تشغيل BrightAI منفصل وموسوم كإرشاد تطبيقي لا كمتطلبات جديدة أو اعتماد تنظيمي.
- **UX/SEO**: هيرو تنظيمي، sticky TOC لسطح المكتب و`details` للجوال، timeline، matrix SVG/CSS، checklist، decision table، source panel، وروابط مباشرة للحلول الستة المطلوبة والتقييم. الصفحة SSR، H1 واحد، self-canonical/index-follow، `CollectionPage` وBreadcrumbList من القالب، وموجودة في sitemap بعد البناء.
- **Sources**: المصدر الأساسي المعروض هو صفحة منشورات SDAIA والملخص التنفيذي العربي الرسمي، مع إعلان SPA الحكومي المؤرخ 14 يوليو 2026 لتأكيد الغرض والمراحل والمصفوفة؛ direct PDF fetch محليًا محجوب بـ WAF/DNS (`curl` sandbox: host resolution; escalated: connection reset)، لذلك لم يُدّعَ تحقق HTTP حي من الملف. الاسم/تاريخ النشر/المراحل مدعومة من المصادر الرسمية، ورقم الوثيقة/الإصدار محفوظان كرأس الوثيقة كما هو منشور في الملخص التنفيذي المرتبط.
- **Verification**: اختبار العقد `node --test scripts/sdaia-ai-risk-management-guide.test.mjs` = **1/1**؛ `pnpm build` = **Complete** (مع 26 تحذير route-collision قديم)؛ `pnpm seo:check` PASS؛ `pnpm seo:hreflang` PASS **260/0**؛ `pnpm internal-links:audit` PASS: **0 orphan / 0 broken / max depth 3**؛ Playwright elevated على `file://dist` عند 360 و1440: **H1=1، overflow=false، productLinks=6**؛ `git diff --check` pending after final brain update.
- **Files**: `src/components/hub/SdaiaAiRiskManagementGuide.astro`, `src/pages/hub/[slug].astro`, `src/pages/hub/index.astro`, `scripts/sdaia-ai-risk-management-guide.test.mjs`, `docs/superpowers/specs/2026-08-23-sdaia-ai-risk-management-guide-design.md`, `docs/superpowers/plans/2026-08-23-sdaia-ai-risk-management-guide.md`.
- **Status**: delivered locally؛ production HTTP/GSC غير متحقق، ولا commit أو push.

### 2026-08-23 — GA-BASELINE-SEO-AUDIT-001: تدقيق SEO شامل بالـ GA baseline (156 مستخدم/6ث تفاعل) — إصلاحات منفذة: ترميز 56 redirect عربية + إزالة FAQPage مكرر + ربط answer بالمحور + سباق gtag

- **Scope**: تحليل كامل بأساس GA (28 يوم: 156 مستخدم، 612 حدث، تفاعل ~6ث، direct مهيمن، Google organic=1) مع تدقيق الصفحة الفائزة، مصفوفة cannibalization، أسباب 404، جاهزية الفهرسة، وإصلاحات موثقة فقط. لا commit ولا push ولا deploy.
- **الصفحة الفائزة**: «حوكمة الذكاء الاصطناعي السعودية | BrightAI» = **الصفحة الرئيسية `/`** (`src/pages/index.astro` — title سطر 168 قبل تعديلاتي، H1 من SplitHero «حوكمة الذكاء الاصطناعي للشركات السعودية»، 2490 كلمة، self-canonical، hreflang ar-SA/en-SA/x-default). معظم زياراتها direct (Google organic=1 فقط) — ما هي رتبة بحث فعلية بعد.
- **Cannibalization (مبنية من dist/client مبني)**: 6+ صفحات تستهدف نية تعريف الحوكمة: `/` (الكلمة الحرفية في title)، `/hub/ai-governance/` (1490 كلمة — المالك الكنسي تعليميًا)، `/solutions/ai-governance-platform/` (تجاري)، `/answer/ai-governance-saudi-arabia-ar/` (129 كلمة رقيقة)، `/blog/ai-governance/` (3528)، `/blog/what-is-ai-governance-saudi-companies/` (2430)، `/docs/ai-governance-saudi-arabia/` (519). تكرار «منصة حوكمة»: solutions vs docs vs `/blog/best-ai-governance-platforms-2026/`. تغطية مزدوجة قطاعية: `/lp/banking/` vs `/solutions/banking-ai-governance/riyadh/` (وكذلك healthcare). **FAQPage مكرر حرفيًا**: نفس 3 أسئلة+أجوبة بين الرئيسية (schema-only) و`/blog/what-is-ai-governance-saudi-companies/` — والاثنان غير مرئيين في الصفحة.
- **الإصلاحات المنفذة (كلها مبنية ومتحقق منها في dist)**: (1) **redirects.json**: ترميز percent-encoding لـ58 خانة `from` (56 عربية + مسافات) — كل قواعد كلاودفلير العربية كانت ميتة لأن `http.request.uri.path` يقارن المسار المُرمَّز والمتصفحات ترسل عربي percent-encoded؛ أُعيد توليد `_redirects`/`render.yaml`/`astro.config.mjs`. **انتبه: سطر `x` في `schema-helpers.ts` (تعديل عنوان جارٍ من المستخدم) كسر البناء مؤقتًا — أصلحت الصياغة بحذف postalCode فقط وحافظت على نص الشارع كما هو؛ المستخدم لازم يكمل العنوان الصحيح**. (2) **إزالة `aiGovernanceFaq` من الرئيسية** (schema غير مرئي + مكرر حرفيًا) مع بقاء FAQ العام الظاهر. (3) **عرض FAQ_BY_SLUG بصريًا** في قالب المدونة (`<details class="post-faq">` + CSS في pages.css) — كان JSON-LD فقط غير مرئي في كل المقالات. (4) **تصحيح سؤال مختلط اللغة** في `/answer/ai-governance-saudi-arabia-ar/` إلى «ما هي حوكمة الذكاء الاصطناعي في السعودية؟» + إضافة `robots` صريح لقالب answer + حقل `furtherReading` يربط صفحات الحوكمة الثلاث بالمحور بأنكورات وصفية (تنفيذ قرار «إعادة توجيه داخلية قوية» الموثق سابقًا والذي لم يكن منفذًا). (5) **روابط سياقية للمحور** في المقالات الثلاثة الكبرى المتداخلة (ai-governance.md، ai-governance-saudi-arabia.md، what-is-ai-governance-saudi-companies.md). (6) **روابط رسمية في فقرة التعريف بالرئيسية**: ISO/IEC 42001 (iso.org/standard/42001 — موثق) + PDPL (dgp.sdaia.gov.sa) + سدايا + NCA ECC (نفس روابط المحور).
- **سبب الـ 404 (8 زيارات)**: صفر روابط داخلية مكسورة (فحص 38,243 رابط)؛ الأسباب الحقيقية: (أ) القواعد العربية الميتة أعلاه (زرائر يرسلون المسار القديم → 404)، (ب) 17 خانة redirect مقصودة نحو `/404/` (قمع متعمد للروابط القديمة)، (ج) bots probing. صفحة 404 نفسها `index, follow` لكن تُخدَم بحالة 404 (P2 hygiene فقط).
- **سبب تفاعل الـ6 ثواني (كلها من الكود)**: (1) **حالة سباق gtag موثقة**: `gtag-init.js` كان يعيد محاولة تسجيل نفسه كـ provider لثانية واحدة فقط بينما `analytics.js` يُحمَّل بعد load+requestIdleCallback(2.5s) → كل أحداث track() المخصصة + page_views التنقل الناعم ما وصلت GA4 أبدًا (612÷156≈3.9 حدث/مستخدم = تلقائية فقط) — **أُصلح**: النافذة صارت 60ث/200ms. (2) ClientRouter (view transitions) + سباق gtag = التنقل الداخلي غير مرئي في GA4. (3) صفر فلترة بوتات (robots.txt مفتوح بالكامل بقرار المستخدم + consent الرفض تجميلي يمنح granted) → كل عابر/متحقق JS يدخل المتوسط. (4) الصفحة نفسها سريعة: LCP نصي (h1)، HTML 36KB gzip، 3 CSS ~15KB gzip، خط مسبق التحميل — السرعة ليست السبب.
- **جاهزية الفهرسة**: sitemap=258 URL مطابق 100% للبناء، كل الصفحات self-canonical وindexable وmax-depth=3 و0 orphans (`internal-links:audit` PASS)؛ `/answer/` و`/assessment/` بدون صفحة فهرس لكن مربوطة جيدًا (32 و217 inbound). الـ GA dominant-direct + Google=1 يعني المشكلة الحقيقية **الظهور** مو الفهرسة — GSC غير متصل (قرار موثق سابقًا: NO-GO لمحتوى إضافي قبله).
- **التحقق**: `pnpm build` ✅ (273 index.html)، `pnpm seo:all` ✅ (gate: 46,797 مرجع/0 مكسور)، `pnpm seo:hreflang` ✅ 0 أخطاء، `pnpm internal-links:audit` ✅ (0 orphans/0 broken/depth 3)، `pnpm redirects:check` ✅ (209 خانة/0 مشاكل)، `pnpm seo:link-graph` = **فاشل بخلل المدقق الموثق سابقًا** (يبلّغ عن مسارات موجودة كمكسورة — مو دليل)، `pnpm lhci:all` = **مُتجاوَز بأمر المستخدم** (ما فيه Chrome مثبت).
- **أحداث متزامنة مهمة**: المستخدم commit أثناء الجلسة (`a9760974` indexation-cleanup)؛ إصلاح redirects الأول انمسح بعملية استعادة جانبية وأُعيد تطبيقه؛ خدمة QC في render.yaml محذوفة بقرار المستخدم («لا تستعيد»)؛ تعديلات migrated-pages/schema-helpers/SEO-Execution-Prompts من الجلسة الموازية لم تُمس.
- **Status**: delivered محليًا — لا commit ولا push؛ الملفات: `redirects.json`, `public/_redirects`, `render.yaml`, `astro.config.mjs`, `src/pages/index.astro`, `src/pages/blog/[...slug].astro`, `src/pages/answer/[slug].astro`, `src/data/answers.ts`, `src/styles/pages.css`, `src/content/blog/{ai-governance,ai-governance-saudi-arabia,what-is-ai-governance-saudi-companies}.md`, `public/js/gtag-init.js`, `src/data/schema-helpers.ts` (إصلاح صياغة فقط).

### 2026-08-23 — ANSWER-CANNIBALIZATION-THIN-CONTENT-AUDIT-001: تدقيق كامل لمسار `/answer/` — قرارات URL مشروطة بلا تعديل صفحات أو redirects أو noindex

- **Scope**: تدقيق read-only لجميع **17** صفحة تحت `/answer/` ومقارنتها بدور `/solutions/` التجاري و`/hub/` المعرفي و`/docs/` الفني و`/blog/` الداعم و`/assessment/` التحويلي؛ التقرير: `audit/report/2026-08-23-answer-cannibalization-thin-content-audit.md`. لا commit ولا push ولا deploy ولا redirects/noindex.
- **Evidence**: البناء المحلي أعاد 17 صفحة self-canonical/indexable؛ النص المرئي لكل صفحة 122–151 كلمة لكن المشكلة ليست العدّ: القالب يكرر الجواب بين hero والجسم، وكل صفحة تربط فقط بـ`/kernel/chat/` بلا مصدر أو رابط إلى pillar/doc/solution. incoming internal links = 1–3 لكل URL فقط. لا GSC/backlinks/live HTTP أو DNS متاح، فلا impressions/clicks/query أو Google canonical؛ القرارات التي فيها redirect مشروطة باستيراد 90 يومًا من GSC وفحص backlinks أولًا.
- **Decisions**: KEEP مشروط للقوالب الجوابية المتخصصة (حوكمة AI EN/AR، framework، AI Firewall EN/AR، PDPL EN/AR، ISO 42001، NCA ECC، audit trail، SDAIA generative، SAMA AI) بعد تحويلها لقالب lightweight يربط بالمالك. MERGE لـ`/answer/nca-compliance/` داخل `/answer/nca-ecc-controls/` ثم مراجعة 301. REDIRECT مشروط بعد دمج النص المفيد وفحص equity لـ`/answer/ai-banking/` → `/solutions/banking-ai-governance/`، و`/answer/ai-healthcare/` → `/solutions/healthcare-ai-governance/`، و`/answer/ai-safety-platform-enterprise/` و`/answer/saudi-ai-safety-os/` → `/solutions/ai-governance-platform/`. **NOINDEX = لا شيء**.
- **Architecture decision**: answer المتبقية تخدم تعريفًا واحدًا فقط: direct answer → Saudi relevance → key points → official/primary source links → descriptive next-step إلى pillar/doc ثم حل أو assessment عند الحاجة. لا marketing layout ولا FAQ schema بسؤال وحيد. يجب تصحيح `lang` الحالي الثابت `ar` وغياب أزواج hreflang الصريحة قبل التعامل مع النسخ EN/AR كبدائل سليمة.
- **Status**: التقرير جاهز للمراجعة محليًا؛ لا تغيير إنتاجي أو URL أو فهرسة، ولا commit أو push.

### 2026-08-23 — INDEXATION-ARCHITECTURE-CLEANUP-001: توحيد الروابط الداخلية مع الـ canonical النهائي والتحقق من سطح الفهرسة — محلي فقط، بدون commit/push/deploy

- **Decision / canonical contract**: صيغة URL الكنسية الوحيدة للصفحات العامة هي `https://brightai.site/<path>/`، مع استثناء الصفحة الرئيسية `/`. `astro.config.mjs` يفرض `trailingSlash: 'always'` و`BaseLayout` يبني self-canonical بنفس الصيغة.
- **Fix**: `src/data/navigation.ts` صار يربط المدن الست من الـ footer مباشرةً بالصفحات الكنسية indexable (sector-city) بدل `/solutions/cities/<city>/`، وهي redirect stubs تاريخية `noindex` فقط. أُضيف regression `scripts/navigation-canonical-links.test.mjs`: RED موثّق ثم GREEN **1/1**؛ بعد build صار عدد روابط التنقل المبنية للـ legacy city URLs = **0** (كان 6).
- **Sitemap / noindex**: توليد sitemap جديد = **258 URL**؛ HTTPS، trailing slash، بلا parameters/fragments. مقارنة canonical مطبّعة مع HTML المبني: **0** sitemap URL بلا صفحة self-canonical indexable و**0** sitemap URL ممثّل فقط بـ `noindex`. الـ16 صفحة `noindex` محصورة بالـ error/design/offline/admin/thank-you و6 redirect stubs؛ لا صفحات استراتيجية أُضيف لها `noindex`.
- **Redirects / hreflang / links**: `redirects:check` = **209** redirects، 0 self/missing/`.html` destinations/chains/cycles؛ `seo:hreflang` = **259 sets / 0 errors**؛ `internal-links:audit` = 0 broken/orphans/canonical issues، 0 outside sitemap، depth ≤3؛ `seo:check` PASS.
- **Artifact verified**: mass `canonical_mismatch` القديم كان تنافس كتابة report عند تشغيل audit writers بالتوازي؛ تشغيل link-architecture منفردًا على `dist/client` = 0 canonical issues. أما **103 hash** فهي ليست indexation errors؛ أمثلة فُحص DOMها وtarget غائب (بعض IDs الظاهرة فقط داخل code sample مهرب)، فتسجل كـ UX/content cleanup مستقل لا تُخفى كartifact.
- **Known boundary**: `pnpm build` Complete لكن Astro لا يزال يطبع route-collision warnings قديمة لمسارات legacy؛ لم تُحل لأنها تحتاج قرار consolidation/حذف source routes. أُعيدت تغييرات مولّد redirects العرضية في ملفات الإعدادات بعد التحقق، ولم يبق من ذلك إلا newline نهائي غير وظيفي في `astro.config.mjs`. لا تحقق HTTP حي أو GSC حالي. التقرير: `audit/report/2026-08-23-indexation-architecture-cleanup.md`؛ الخطة: `docs/superpowers/plans/2026-08-23-indexation-architecture-cleanup.md`.

### 2026-08-23 — AI-GOVERNANCE-READINESS-ASSESSMENT-001: تحويل صفحة التقييم إلى فحص إرشادي مؤسسي قابل للفهرسة — تحقق محلي بدون commit/push/deploy

- **Scope**: إعادة بناء `/assessment/ai-governance-readiness/` مع module صغير في `public/js/ai-governance-readiness.js` واختبار `scripts/assessment-readiness.test.mjs` وخطة تنفيذ. لا dependency أو API أو تخزين إجابات أو deploy أو commit أو push.
- **Trust/content**: أزيلت النتيجة الرقمية الثابتة ومدد الجاهزية ووعود الشهادة/الامتثال. الصفحة توضح جمهورها (قادة التقنية/المخاطر/البيانات/الامتثال)، ومخرجاتها الوصفية، وحدودها: ليست شهادة أو موافقة تنظيمية أو رأيًا قانونيًا. المحاور الثمانية الظاهرة: inventory, ownership, risk, policy, data, approvals, logging/evidence, monitoring.
- **UX/privacy/analytics**: form من 4 مراحل و8 أسئلة بتجميع واضح، progress native، labels/fieldsets/errors/focus، targets بحد أدنى 48px ومظهر جوال. النتيجة تفصل strengths/gaps/next controls ثم CTA لجلسة استكشافية. الإجابات والنتيجة محلية في المتصفح؛ analytics يرسل أحداثًا allow-listed فقط (`assessment_start`, step progression, completion, abandonment) بمُعرّف خطوة، بلا نص الإجابة أو PII؛ CTA يستخدم unified analytics metadata القائم.
- **SEO**: الشرح ومحاور التقييم والأسئلة الشائعة كلها SSR في HTML، وJavaScript progressive enhancement فقط. metadata/canonical/hreflang وWebPage schema محدثة، ولا FAQ schema تجاري جديد.
- **Verification**: TDD RED (`ERR_MODULE_NOT_FOUND`) ثم GREEN: `node --test scripts/assessment-readiness.test.mjs` = **2/2**؛ `pnpm build` = **Complete** مع route-collision warnings قديمة؛ `pnpm seo:check` PASS، `pnpm seo:hreflang` PASS `259/0`، `git diff --check` PASS (fsmonitor IPC تحذير بيئي). لا browser/live/production verification؛ build حدّث timestamps في sitemap files فقط، وأُعيدت خدمة QC التي حذفها مولد redirects تلقائيًا في `render.yaml`.
- **Status**: delivered locally؛ لا commit ولا push ولا deploy.

### 2026-08-23 — AI-GOVERNANCE-HUB-PILLAR-001: تحويل `/hub/ai-governance/` إلى المرجع التعليمي الكنسي مع فصل النية التجارية — تحقق محلي ناجح بدون commit/push/deploy

- **Scope**: أُضيف `src/components/hub/AiGovernancePillar.astro`، وربطته بفرع مخصص في `src/pages/hub/[slug].astro`؛ لم تُمسح صفحات `/answer/` ولم تُفرض `noindex`، وبقيت تعديلات `audit/SEO-Execution-Prompts.md` السابقة كما هي.
- **Positioning/content**: الإجابة المباشرة عن «وش هي حوكمة الذكاء الاصطناعي؟» في بداية الصفحة، مع مقارنة governance/safety/security/risk، دورة الحياة، الأدوار، تصنيف المخاطر، الإشراف البشري، policy-to-control mapping، أدلة التدقيق، حماية البيانات، حوكمة النماذج والوكلاء، roadmap سعودية، FAQ، وروابط المنتج والأدلة التنظيمية.
- **UX/RTL**: knowledge hub بعرض مريح، TOC sticky على سطح المكتب و`details` مختصر على الجوال، بطاقات وتعريفات وجداول وخطوات وcallouts، CSS منطقي RTL، وبدون JavaScript أو dependency جديدة.
- **Saudi/legal boundary**: المصادر الرسمية المباشرة هي SDAIA/PDPL وSDAIA policies وNCA ECC؛ النص يفرق بين المرجع التنظيمي والجاهزية، ويذكر أن التطبيق يعتمد على نطاق الجهة والاستخدام، ولا يقدم رأيًا قانونيًا أو ادعاء امتثال شامل.
- **Cannibalization audit**: `/answer/ai-governance-framework/` يبقى quick-answer متخصصًا مع رابط للمحور؛ `/answer/ai-governance-saudi-arabia-ar/` يبقى مؤقتًا مع إعادة توجيه داخلية قوية للمحور؛ `/answer/ai-governance-saudi-arabia/` يبقى للنية الإنجليزية مع ضبط الادعاءات؛ لا merge/noindex الآن لغياب GSC ولحماية الصفحات العامة القابلة للفهرسة.
- **Verification**: اختبار مخصص `2/2`، build Astro مكتمل وأنشأ `/hub/ai-governance/index.html`، `seo:check` PASS، `seo:hreflang` PASS `259/0`، internal-links PASS `0` broken، schema audit العام PASS `62` صفحة، وفحص Playwright المحلي على `360px/1440px`: `h1=1`, `overflow=false`, تنقل الجوال/TOC صحيح. `astro check` ما زال يظهر `127` خطأ قديم خارج النطاق؛ `pnpm seo:schema` يتوقف عند drift في FAQ schema لـ `19` صفحة حلول؛ `pnpm build` الكامل أُوقف يدويًا، والإنتاج/DNS غير متحقق.
- **Status**: التغيير جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy.

### 2026-08-23 — AI-GOVERNANCE-PLATFORM-REDESIGN-001: تحويل صفحة الحوكمة التجارية الرئيسية إلى طبقة تشغيلية للحوكمة — تحقق محلي ناجح بدون commit/push/deploy

- **Scope**: `/solutions/ai-governance-platform/` فقط؛ تحديث metadata/copy وrender branch مخصص داخل `src/pages/solutions/[slug].astro`، CSS scoped RTL، وخطة `docs/superpowers/plans/2026-08-23-ai-governance-platform-implementation.md`. لم تتم إضافة dependency أو route جديد.
- **Positioning**: الصفحة تشرح BrightAI كطبقة تشغيلية بين الموظفين وأنظمة AI وبيانات المؤسسة والسياسات والموافقات والأدلة. التسلسل المرئي صار `Regulation → Risk → Control → Enforcement → Evidence`، مع pain points للـ Shadow AI وملكية الاستخدام وتسريب البيانات والسياسات الورقية وسجل التدقيق والقرارات عالية الأثر.
- **UX/design**: هيرو enterprise داكن خفيف بـ CSS/native SVG، CTA أساسي لتقييم الجاهزية وثانوي للدليل، governance console، بطاقات الضوابط/المشاكل/الأدوار/القطاعات، Evidence File visual، FAQ ظاهر، وروابط مباشرة لـ AI Firewall وAI Risk Classification وHuman Approval Layer وAI Audit Trail وEvidence File وReadiness Assessment. تحقق Playwright على 360px و1440px: `h1=1`, `overflow=false`, `flow=5`, `faq=7`.
- **SEO/legal**: title/H1/description/canonical جديدة؛ بقي schema من نوع `Service` عبر helper الحالي، وFAQ schema مبني فقط على الأسئلة الظاهرة. صيغ PDPL وNCA ECC وSDAIA وISO/IEC 42001 كمرجع جاهزية/سياق وليست شهادة أو ضمان امتثال أو رأي قانوني.
- **Verification**: `pnpm build` ✅؛ `pnpm seo:check` ✅؛ `pnpm seo:schema` ✅؛ `pnpm seo:hreflang` ✅ (259/0)؛ `pnpm seo:word-count` ✅ (96/96)؛ `git diff --check` ✅. `pnpm exec astro check` ما زال يفشل بـ 127 خطأ/0 تحذير خارج نطاق الصفحة (middleware، answers، Storybook، Kernel/UI)، ولم يظهر خطأ من `[slug].astro` أو البيانات الجديدة. Production/live verification = **N/A/Unverified**.
- **Status**: delivered locally؛ لا commit ولا push ولا deploy. الملفات: `src/data/solutions.ts`, `src/pages/solutions/[slug].astro`, `docs/superpowers/plans/2026-08-23-ai-governance-platform-implementation.md`, `.agents/mind/01-mind-latest.md`.

### 2026-08-23 — CURRENT-INDEXING-AUDIT-002: إعادة تشغيل تدقيق الفهرسة الحالي للصفحات الثماني ذات الأولوية — GSC غير متاح، clean build أخضر جزئيًا، وlink-graph gate ما زال غير موثوق

- **Scope**: read-only indexing audit + تحديث تقرير `audit/report/2026-08-23-current-indexing-audit.md`؛ لا تعديل صفحات أو robots أو sitemap أو deploy أو commit أو push. شغّلت clean `npm run build` فقط للتحقق؛ أعيد أثر البناء العرضي في `render.yaml` إلى حالته السابقة.
- **GSC/live boundary**: لا يوجد GSC connector/export؛ كل URL status/last crawl/GSC canonical/GSC sitemap/impressions/clicks/query = **N/A**. `curl` فشل DNS لـ `brightai.site`. أداة الويب فتحت homepage فقط (last month) وفشلت الأهداف وrobots/sitemap بـ cache miss أو safe-open؛ لا production proof.
- **Fresh local evidence**: `npm run build` = Complete (2026-08-23 21:57 +03)، `dist/client` = **275 HTML**، sitemap = **258 URL**، `seo:check` PASS، `seo:schema` PASS بعد توليد 19 FAQ artifacts، `seo:hreflang` PASS (259/0)، `seo:word-count` PASS (96/96). Targeted BFS من `/`: governance platform depth 1/247 incoming، hub depth 2/26، assessment depth 1/245، risk 1/245، firewall 1/250، audit trail 1/248، policy mapping 1/245، Riyadh banking depth 2/8.
- **Findings**: clean build emits **26 Astro route-collision warnings**؛ `seo:link-graph --strict` exits 1 over 276 files and reports existing root/target paths as broken بسبب path-normalization/validator contract، لذلك لا يُعتبر crawl proof until fixed/clarified. Riyadh target has an `sr-only` H1; live/mobile render remains unverified.
- **Decision**: NO-GO for publishing more content until link-graph gate is trustworthy, live HTTP + current GSC export are obtained, and route-collision warnings are resolved or explicitly accepted. Strong local signals do not prove indexing; old 2026-07-25 crawled-not-indexed snapshot must not cause bulk delete/noindex.
- **Status**: report updated locally; no production verification, commit, push, or deploy.

### 2026-08-23 — CURRENT-INDEXING-AUDIT-001: تدقيق فهرسة حالي للصفحات ذات أولوية حوكمة AI — GSC غير متاح، evidence محلي قوي مع P0 لبناء نظيف وSchema

- **Scope**: تدقيق read-only للصفحات الثماني ذات الأولوية؛ أُنشئ `audit/report/2026-08-23-current-indexing-audit.md` فقط، بدون تعديل صفحات أو sitemap أو robots أو deploy أو commit أو push.
- **GSC/live boundary**: لا يوجد Search Console connector أو export حالي، لذلك status/last crawl/GSC canonical/impressions/clicks/query = **N/A**. `curl` لكل الأهداف و`robots.txt` و`sitemap.xml` فشل بـ `Could not resolve host: brightai.site`؛ الإنتاج وCloudflare غير متحققين.
- **Local evidence**: build الحالي يحتوي الأهداف الثمانية كـ HTML ثابت؛ كلها self-canonical، `index, follow`، H1 واحد، viewport، `lang=ar`، وموجودة في local sitemap 258 URL. الكلمات بعد إزالة الوسوم تقريبًا 1,136–2,084. `seo:hreflang` PASS (259/0)، `seo:word-count` PASS (96/96).
- **P0 findings**: `seo:check` FAIL بسبب artifacts `404 2.html`, `500 2.html`, `index 2.html` التي تكسر canonical/path/hreflang checks؛ `seo:schema` FAIL لأن FAQ schema غير متزامن مع صفحات الحلول؛ `seo:link-graph --strict` غير صالح كإثبات site-wide نظيف حتى تُعزل artifacts. لا يوجد دليل يبرر bulk-delete أو noindex للأهداف.
- **Decision**: NO-GO لنشر محتوى إضافي حتى ينظف build/indexing gate، تتصالح FAQ schema، ويتوفر تصدير GSC + تحقق HTTP إنتاجي. لا تُعامل لقطة 2026-07-25 كحقيقة حالية.
- **Status**: تقرير audit delivered locally؛ لا production verification، لا commit، لا push، لا deploy.

### 2026-08-23 — SEO-CRAWLER-POLICY-002: توحيد سياسة الزواحف على فتح الوصول بالكامل بناءً على قرار المستخدم

- **Scope**: `public/robots.txt`, `public/ai.txt`, `public/llms.txt`, `public/llms-full.txt` + تقرير `audit/report/2026-08-23-crawler-policy-normalization.md`؛ لا تعديل Cloudflare ولا deploy ولا commit ولا push.
- **Decision**: المستخدم قرر صراحةً فتح الوصول لكل الزواحف وكل المسارات؛ لا توجد استثناءات زحف في سياسة المستودع. `robots.txt` يستخدم `Content-Signal: search=yes, ai-input=yes, ai-train=yes` و`Allow: /`، مع إعلان `Sitemap:` واحد فقط.
- **Cloudflare boundary**: Cloudflare Managed robots.txt غير متوافق مع القرار لأنه يضيف سياسة تدريب مقيدة؛ الحالة الحية غير متحققة بسبب فشل DNS (`curl: (6) Could not resolve host`). التقرير يعطي خطوات يدوية لتعطيل الإدارة ومراجعة AI Crawl Control/AI bot policies؛ لم يُدّعَ أي تغيير إنتاجي.
- **Verification**: فحص التوجيهات أعاد `sitemap_count=1` و`disallow_count=0` في `public/robots.txt`؛ `git diff --check` لم يعرض خطأ محتوى وظهر فقط تحذير fsmonitor IPC البيئي. الروابط الرسمية المستخدمة: Cloudflare Managed robots.txt، Cloudflare AI Crawl Control، OpenAI publisher guidance، Perplexity crawler docs، Google crawler controls.
- **Status**: delivered locally; production/live Cloudflare verification remains unverified and requires manual account access + external fetch.

### 2026-08-23 — QC-PRELAUNCH-REPORT-002: تقرير ما قبل الإطلاق النهائي كملف دائم — بناء على طلب صريح أن لا إعادة تنفيذ للبرومبتات
- لا تقم بعمل Disallow لاي شيء حرفيا
- **Scope**: docs-only. المستخدم أكد أن كل البرومبتات (7 أجيال) منفّذة ولن يعيد تنفيذها — المطلوب تقرير نهائي من تحليل المسار. أُنشئ `audit/qc/QC-Task-Manager/PRE-LAUNCH-REPORT.md` (v1.0، ~330 سطرًا، عربي).
- **Content**: (1) خلاصة تنفيذية Conditional GO؛ (2) تحليل المسار عبر الأجيال السبعة (جدول الأجيال + النمو التراكمي 12→51 جدول/35 migration/109+25+6 مسارات/47 سويت) + الأنماط الناجحة (المنفّذ/المدقق، implemented≠verified، منع الأنظمة الموازية، التجميد البنيوي) + 5 مخاطر متبقية من طريقة المسار (spec drift، صناديق stale، سويتات يتيمة، E2E ما اكتمل بمرة، ديون جودة)؛ (3) الوضع المتحقق اليوم؛ (4) **4 إصلاحات نهائية**: E2E جلسة واحدة كاملة (P0)، تدوير مفتاح Groq + smoke (P0 — المفتاح القديم مكشوف)، نظافة git للملفين المتتبعين + الحركات المعلقة (P0)، حسم السويتات اليتيمة test/e2e-lab-search (P1)؛ (5) تحسينات: توحيد escapeLike×9/ترقيم×9/خرائط الإشعارات/حدود zod/exceljs boilerplate + INDEX.md للبرومبتات + تصحيح الصناديق stale + أرشفة REPORT.md المتقادم؛ (6) تكاملات: WITHDRAWM لطلبات التغيير (آخر فجوة موثّقة بالدورة الوظيفية — migration صغيرة) + توثيق المنفّذ أصلًا + الإشعار الخارجي مؤجل؛ (7) إضافات ما بعد الاستقرار (soft-delete أول جلسة امتثال، palette، FTS5...)؛ (8) خطة إطلاق 3 جلسات مع GO/NO-GO وقائمة تحقق حية؛ (9) جدول تشغيل بعد الإطلاق (يومي/أسبوعي/شهري — فيه تجربة الاسترجاع الشهرية بـ test-production-operations.mjs)؛ (10) 7 قرارات حصرية للمستخدم + ملحق أوامر.
- **Verified قبل الكتابة**: PDF العربي منفّذ فعلًا (pdf.ts يدمج IBM Plex Sans Arabic بـ CIDFontType2/Identity-H + ToUnicode CMap — fontkit مبرر)؛ test-lab-search وe2e-lab-search غير مسجلين إطلاقًا في package.json ولا e2e-acceptance.mjs (confirm فجوة التغطية)؛ admin/system-health موجودة.
- **Status**: delivered (docs + brain only) — لا commit ولا push؛ التقرير للمستخدم والالتزام عليه.

---
### 2026-08-23 — QC-PRELAUNCH-ANALYSIS-001: تحليل شامل لمجلد audit/qc/QC-Task-Manager وخط البرومبتات (prompt1→prompt7) قبل الإطلاق النهائي — تقرير توصيات للمستخدم + أرشفة القسم 1

- **Scope**: قراءة وتحليل فقط — صفر تغيير كود. قراءة العقل (القسم 1) كاملًا + قراءة كاملة لملفات البرومبتات السبعة (PROMPTS.md, prompt2, prompt3, prompt4-LAB, prompt5-LAB, prompt6, prompt7) عبر 3 وكلاء متوازيين + REPORT.md وREADME.md + تحقق مباشر من الكود والريبو.
- **Verified facts (تحقق مباشر اليوم)**: (1) **تسريب المتصفح في `scripts/e2e-task-search.mjs` مُصلَّح فعلًا بالكود**: `chromium.launch` خارج try وكل الشغل داخل try (سطر 285) وfinally (سطر 502) يغلق كل contexts/pages والـ browser — و`e2e-acceptance.mjs` عنده CHILD_TIMEOUT_MS مع SIGTERM/SIGKILL. لكن **ما سُجّلت إعادة تشغيل كاملة لـ `pnpm e2e:acceptance` حتى النهاية بعد الإصلاح** (آخر دليل كامل = 8 سويت/490 فحص قبل الإصلاح ثم hang + e2e-reports معزولة 912/0) — البوابة ما زالت مفتوحة. (2) `scripts/route-manifest.mjs` صار tracked في git. (3) **ملفا `qc_tasks.db` و`qc_tasks 3.db` لا يزالان متتبعين في git** — hygiene القرار عند المستخدم. (4) migrations = 35 ملفًا (001→035)، 49 سكربت test في package.json، render.yaml فيها خدمة qc-task-manager مع healthCheckPath + قرص دائم. (5) `pnpm typecheck` = 0 errors/0 warnings/17 hints حي اليوم. (6) working tree فيه حركات غير ملتزمة: 7 ملفات audit قديمة انحذفت من `audit/` وظهرت untracked في `audit/qc/before/` + `audit/report-SEO.md` untracked — الالتزام بيد المستخدم.
- **Findings تحليل البرومبتات**: (أ) تصادم أرقام البرومبتات بين الأجيال (00–12 / 00–18 / 00–13 / 00–40 / 41–59 / 001–010 / 011–021) بلا فهرس موحد — خطر تنفيذ خاطئ إذا انقرأ ملف قديم بلا سياق التسلسل الزمني. (ب) prompt4 وprompt5: قسم FINAL EXECUTION ORDER كله [ ] رغم ✅ بالقوائم العلوية (stale)؛ ونص "You are DeepSeek Flash v4" باقي داخل_MASTER RULES لحزمة v5؛ ودلالة ✅ غير متسقة (برومبتات 14/15/22/30 معلمة ✅ بينما بنيتها التحويلية كانت "محجوزة غير منفذة" لين prompt5). (ج) prompt6 يأمر تنفيذ 007 قبل 005 رغم أن 007 تنشئ migration 029 و005 تنشئ 028 (ترقيم معكوس). (د) spec يتوقف عند migration 034 بينما الكود فيه 035 — العقل يبقى مصدر الحقيقة الوحيد. (هـ) نقاط قوة تستحق الحفاظ: نمط Read-first + Non-goals + "implemented ≠ verified" + منع اختراع قيم علمية + grounding بالرموز الفعلية (prompt5 وprompt7 الأقوى).
- **Delivered**: تقرير توصيات نهائي قبل الإطلاق للمستخدم — بوابات الإطلاق الخمس بترتيب الأولوية + قرارات المستخدم المعلقة + خطة تشغيل ما بعد النشر + اقتراحات تحسين غير حاجزة.
- **Archive decision (بروتوكول القاعدة صفر، قاعدة 5)**: القسم 1 بلغ 921 سطر / 422KB (الحد ~500 سطر / 150KB) — نُقلت السجلات الأقدم (من QC-LAB-NOTIFICATIONS-001 بتاريخ 2026-08-15 نزولًا حتى سجلات 2026-08-14، السطور 520–921 حرفيًا) لأعلى `02-mind-mid.md` بعد الـ frontmatter مباشرة، بلا أي تعديل على محتوى السجلات المنقولة، والترتيب الزمني محفوظ (08-15/14 فوق 08-12 القديمة). القسم 1 صار 519 سطرًا قبل إضافة هذا السجل.
- **Status**: delivered (analysis + brain only) — لا commit ولا push؛ كل التوصيات بيد المستخدم.

---
### 2026-08-23 — QC-UX-A11Y-PERFORMANCE-020: role-focused Lab home, controlled-document/change-request UX, responsive fallbacks, and local verification

- **Scope**: `apps/qc-task-manager/`; no business-rule, permission, migration, CSP, commit, push, or deploy changes. Added role-focused `/lab` priority panels using `permissions.ts`-authorized server-rendered read-only queries; employee work includes own tests/drafts/returned tests/WI content/change requests and Quick New Test, supervisor work includes review/document/risk/retest/calibration queues, manager/admin work includes approval/change/audit/data-quality queues.
- **Presentation**: added shared `LabDocumentStatusBadge.astro` and `LabActionButton.astro`; document states are visibly distinct (`Missing Content`, `Draft`, `In Review`, `Approved`, `Superseded`, `Archived`) and primary/secondary/destructive actions share focus-visible, 44px-friendly styling. Document and change-request registers gain mobile card fallbacks while long desktop tables remain horizontally scrollable.
- **Change Requests**: detail view now surfaces requester, timestamp, canonical target, conflict state, changed fields before/after, review reason, and shared `qc_audit_log` correlation. Rejected requester-owned requests can resubmit through an authorization-scoped prefilled form. The current schema has no distinct `WITHDRAWN` state, so no Withdraw action was mapped to `REJECTED`; this remains an explicit follow-up gap to avoid changing audit semantics.
- **Accessibility/performance guards**: added `test:lab-ux-presentation` (6 checks) and `test:lab-ux-performance` (7 checks), registered in the canonical manifest. Baseline overview prepared statements = **19**; no speculative indexes added. Reduced motion and strict CSP guards pass; role home has no hydrated React island.
- **Verification**: `pnpm test` = **47 canonical suites / 0 failures**; `pnpm typecheck` = **0 errors / 0 warnings / 17 hints**; `NODE_ENV=production pnpm build` = **Complete** with known Vite dynamic/static import warnings; `pnpm test:architecture` PASS (109 routes / 25 middleware routes / 6 guards); `pnpm test:badge-contrast` PASS; UX presentation/performance guards PASS; `git diff --check` returned only the existing fsmonitor IPC warning. Browser keyboard/responsive screenshot and production verification were not run in this pass.
- **Status**: delivered locally; no production verification, no commit, no push, no deploy. Plan: `docs/superpowers/plans/2026-08-23-qc-ux-a11y-performance-020.md`.

### 2026-08-23 — QC-PRODUCTION-OPERATIONS-019: تشغيل SQLite/Astro قابل للرصد والاستعادة — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ لا deploy ولا commit ولا push. أضيفت صفحة admin-only في `/admin/system-health` تعرض نسخة التطبيق/commit، مسار DB آمنًا مختصرًا، أحجام DB/WAL، schema/latest migration، عدد فشل migrations، حالة FK/integrity، backup age/size/verification، audit chains، وdisk free/warning. صفحة `/admin/settings` صار فيها رابط مباشر لها.
- **Public health**: `/api/health` بقي GET readiness خفيفًا بلا مسارات أو أسرار أو فحص سلاسل تدقيق؛ يعيد `ready`, `dbInitialized`, و`schemaVersion` مع الحقول الحالية، ولا ينشئ DB ناقصة.
- **Backups**: `status.json` الموجود يحفظ آخر backup ناجح وآخر verification؛ scheduler صار يعتبر backup صالحًا فقط إذا كانت verification `PASS` وفي يوم الرياض الحالي، و`createBackup()` يمنع التوازي عبر القفل الموجود. عند missed window أو verification غير PASS يعمل catch-up واحد serialized.
- **Deployment contract**: `assertSqliteDeploymentContract()` يفشل قبل فتح DB عند اكتشاف `QC_HORIZONTAL_SCALING=true` أو `QC_SQLITE_INSTANCE_COUNT>1` أو `RENDER_NUM_INSTANCES>1` أو `WEB_CONCURRENCY>1`. وثّق `docs/DATABASE.md` و`docs/DEPLOYMENT.md` صراحةً single writable instance + persistent disk + منع horizontal write scaling، وأضافا قائمة تحقق live لاحقة بدون تنفيذها.
- **Restore drill**: أضيف `scripts/test-production-operations.mjs`، ضمن 45 canonical suites؛ يغطي backup حقيقي لقاعدة temp، mutation، restore exact confirmation، restart connection، important record، integrity، FK، schema version 35، وسلسلتي task/QC audit، مع اختبار عقدة single-instance.
- **Verification**: `pnpm test` = **45 canonical suites / 0 failures** (ومنها domain **342/0** واختبار العمليات الجديد PASS)؛ `pnpm typecheck` = **0 errors / 0 warnings / 17 hints**؛ `NODE_ENV=production pnpm build` = **Complete** مع تحذيرات Vite الديناميكية المعروفة؛ `test:architecture` = **PASS** وroute manifest = **109 file routes / 25 middleware routes / 6 guards**؛ `git diff --check` لم يعرض أخطاء diff، مع تحذير fsmonitor IPC بيئي فقط.
- **Status**: delivered locally؛ لا production verification، لا deploy، لا commit ولا push. الخطوة التالية للمستخدم: مراجعة التغييرات وتشغيل قائمة التحقق بعد deploy يدوي، مع إبقاء commit/push عليه.

### 2026-08-23 — QC-ROUTE-AND-REPORTING-SOURCE-TRUTH-017: مطابقة مسارات التقارير مع شجرة Astro الحالية + manifest معماري + مصفوفة E2E كاملة — تحقق محلي ناجح مع قابلية إعادة الإنتاج محجوبة بسبب untracked route-manifest

- **Source of truth / inventory**: الجرد الحالي من `apps/qc-task-manager/src/pages` أعاد **108 file-based routes**. المسارات المطلوبة كلها موجودة فعليًا: `src/pages/api/reports/[reportType].[format].ts` يطابق `/api/reports/<reportType>.csv|xlsx|pdf`، و`src/pages/api/reports/audit.ts` يطابق `/api/reports/audit`. لا endpoint جديد ولا syntax مخترع أُضيف؛ `astro build` وlive E2E أثبتا pattern Astro 6 الحالي.
- **Architecture**: أُضيف `apps/qc-task-manager/scripts/route-manifest.mjs` ليولّد normalized inventory من `src/pages`، ويفصل صراحةً **25 middleware short-circuit routes** و**6 middleware guards** عن file routes. يتحقق من required report routes ومن روابط `href/action` الداخلية التي تشير إلى `/api/reports/*`. أُضيف `test:route-manifest`، وصار `test:architecture` يشغّله قبل `architecture-guard`.
- **E2E/reporting**: حدّث `scripts/e2e-reports.mjs` ليستخرج **24 ReportType** من `src/lib/reporting/types.ts` (8 task + 16 lab)، ويغطي CSV/XLSX/PDF، anonymous/employee/supervisor/manager/admin، audit endpoint لكل الأدوار، invalid report/format/filter/pagination، content-type/filename/non-empty body، وسجلات `report_audit_log`. صار يغلق Playwright contexts/browser في cleanup.
- **Verification**: `pnpm test` داخل التطبيق **exit 0**؛ `pnpm test:route-manifest` = `108 file routes / 25 middleware routes / 6 guards`؛ `pnpm test:architecture` PASS؛ `pnpm test:lab-reports` **196/0**؛ `pnpm test:dashboard-reports` PASS؛ `pnpm typecheck` **0 errors / 0 warnings / 17 hints**؛ `pnpm build` **Complete** مع تحذيرات Vite المعروفة؛ live `e2e-reports.mjs` بعد warmup وصلاحية listen = **912/0**.
- **Reproducibility gate**: قبل E2E سُجّل `HEAD=bc9069d7780002cff40a81bb462e2bae24fdeb03`. `git status --porcelain` كان يحوي `?? apps/qc-task-manager/scripts/route-manifest.mjs` (وملف الخطة untracked)، لذلك حسب شرط المهمة **لا تُعد نتيجة E2E PASS قابلًا لإعادة الإنتاج حتى يصير route-manifest tracked**. sandbox منع listen أولًا بـ `EPERM`، ثم التشغيل elevated نجح. لا production verification، ولا commit/push/deploy.
- **Files**: `apps/qc-task-manager/scripts/route-manifest.mjs` (جديد)، `apps/qc-task-manager/scripts/e2e-reports.mjs`، `apps/qc-task-manager/package.json`، `docs/superpowers/plans/2026-08-23-qc-route-reporting-source-truth.md` (خطة)، `.agents/mind/01-mind-latest.md`.
- **Notes**: `.codex/config.toml` كان modified قبل/خارج نطاق المهمة وبقي بدون لمس. المستخدم يقرر tracking/commit؛ لا يوجد `git commit` أو `git push` أو deploy.

### 2026-08-23 — QC-LAB-TEMPLATE-WORKFLOW-V2-016: دورة مراجعة واعتماد قوالب المختبر — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ migration **035** متسلسلة لأن migration 034 مستخدمة مسبقًا لسياسة القالب، وأضافت حالات DRAFT/IN_REVIEW/APPROVED/SUPERSEDED وحقول submit/review/approval مع backfill row-preserving بدون خسارة تاريخ النسخ.
- **Workflow/RBAC**: صار إنشاء وتعديل وإرسال المسودة للمؤلف، والمراجعة من Supervisor+ لمستخدم آخر، والاعتماد من Manager/Admin لمستخدم آخر فقط؛ `permissions.ts` بقي مصدر الصلاحيات الوحيد، والقالب ARCHIVED مجمّد.
- **Integrity**: الاعتماد يستخدم بنية e-signature الحالية على مستوى handler، ويسجل submitted/reviewed/approved/superseded؛ النسخة السابقة تصير SUPERSEDED، والمراجع المعتمد فقط يدخل قائمة reference selection. بعد أول اعتماد يصير code وtest_type غير قابلين للتغيير، والتعارض يمنع overwrite عبر updated_at token.
- **UI/tests**: أضيفت أزرار submit/review/approve، e-signature password، version token، وسجل حالات النسخ. `test:lab-templates` **51/0**؛ `test:migrations` PASS؛ full `pnpm test` **exit 0**؛ reference panel **21/0**؛ security **63/0**؛ esignature **14/0**؛ typecheck **0 errors / 0 warnings / 17 hints**؛ production build Complete؛ `git diff --check` PASS.
- **Status**: delivered locally؛ لا production verification، ولا commit ولا push ولا deploy؛ migration 035 مقصودة للحفاظ على تاريخ migration 034.

### 2026-08-23 — QC-LAB-FORM-UX-INTEGRITY-015: نموذج المختبر الآمن والسريع — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ فصل حقول legacy عن إدخال السجل الجديد، عرض `Legacy Recorded Data` للبيانات التاريخية فقط، وتسمية `sampling_area` في الواجهة `Testing Area` مع إبقاء العمود التاريخي.
- **UX/a11y**: أضيف شريط إجراءات sticky يعرض Draft/Unsaved Changes، تنقل أقسام 1–8 deterministic، روابط/focus لملخص الأخطاء، `aria-invalid`/`aria-describedby`، fieldset للنتيجة، وجدول بعناوين scoped. جدول العينات يدعم Tab/native copy، الأسهم، paste TSV/newline bounded بـ `sample_count`، copy-down، ومسح الصف؛ التحقق النهائي ما زال server-side.
- **References/policy**: reference panel يعرض اسم القالب/الإصدار/effective date/source document وكل المعاملات المعبأة، وحالة `No approved reference available.` بدون fallback. migration **034** أضافت `requires_approved_template_for_submission` default 0، مع checkbox في محرر القالب وحارس template compatibility عند submission، بدون فرض عالمي.
- **Historical/print**: صفحات detail/print تعرض current fields فقط، وتضع legacy pressure/volume في block منفصل read-only، وتحافظ على قيم التعديل التاريخية.
- **Verification**: `pnpm test:migrations` PASS؛ `pnpm test:lab-form` **72/0**؛ reference panel **21/0**؛ lab templates **39/0**؛ lab print **51/0**؛ browser `e2e-lab-form.mjs` **133/0** على سيرفر وقاعدة معزولين؛ `pnpm typecheck` **0 errors / 0 warnings / 18 hints**؛ production build Complete؛ `git diff --check` PASS. بوابة `e2e:acceptance` العامة توقفت قبل lab عند blocker قديم في `task-shared` cleanup FK، لذلك لا تُحسب كدليل كامل.
- **Status**: delivered locally؛ لا production verification، ولا commit أو push أو deploy.

file: brain.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
last_updated: 2026-08-23 04:26 +03:00
maintained_by: BrightAI Workspace Agent
version: 2.8.26
agent_version: v2.3
skills_ready: 7---

### 2026-08-23 — QC-WI-PROVENANCE-014: فصل هوية استيراد WI الورقي عن تأليف المستخدم — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ migration **033** أعادت بناء `lab_documents` بشكل row-preserving مع إبقاء IDs والقيم والنسخ التابعة، وأضافت `creation_origin`, `source_page`, `source_row_no`, `imported_at` وجعلت `created_by` nullable. سجلات F-4-2-1-2 تصير `SOURCE_IMPORT` بلا مؤلف وهمي، page 1 وrows 1..33، و`imported_at=created_at` للبيانات الموجودة.
- **Application/permissions/UI**: importer ما عاد يبحث عن أول مستخدم؛ التأليف الأول session-bound ويضع owner/version author ولا يغيّر `creation_origin`. صلاحية Add Content تعتمد على provenance + catalog-only state بدل سجل محدد. الواجهة تعرض Source Register/Page/Row/Revision/Date وImported Record/At، ولا تعرض Created By لسجل مستورد بلا محتوى.
- **Migration runner**: marker محكوم `brightai:foreign-keys-off` مع إعادة تفعيل FK وفحص `foreign_key_check` بعد rebuild، لحفظ `lab_document_versions` التابعة بدل cascade.
- **Verification**: `pnpm test` **exit 0**؛ `pnpm test:migrations` PASS؛ `pnpm test:lab-documents` **289/0**؛ `pnpm typecheck` **0 errors / 0 warnings / 19 hints**؛ `NODE_ENV=production pnpm build` Complete؛ `git diff --check` PASS. لا production verification.
- **Status**: delivered locally؛ لا commit ولا push ولا deploy؛ ملفات untracked تحت `.agents/skills/systematic-debugging/` محفوظة لأنها خارج نطاق المهمة.

### 2026-08-23 — QC-AUDIT-DURABILITY-COMPLETION-013: فصل هوية task التاريخية عن qc_audit_log وإغلاق فجوة الحذف — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ أضيفت migration **032** لإعادة بناء `qc_audit_log` مع إبقاء `task_id` كرقم تاريخي بلا FK cascade، مع إبقاء `actor_id` FK `ON DELETE RESTRICT`، وحفظ كل الأعمدة والـ IDs والقيم والهاشات كما هي وإعادة فهرس `idx_qc_audit_entity`. أضيف slot **031** محجوز فقط لأن migration runner يفرض تسلسلًا متصلًا.
- **Integrity**: migration 032 لا تعيد حساب الهاشات ولا تتجاهل tampering؛ اختبار upgrade من v31 إلى v32 يتحقق من سلامة السلسلة قبل/بعد، تطابق `previous_hash/event_hash`، ثم حذف task مع بقاء سجل QC وسلامة السلسلة. اختبار الحذف ينشئ Finding مرتبطًا بالمهمة، QC audit event، وapproved deletion؛ Finding يُحذف كطفل لكن سجل `qc_audit_log` يبقى.
- **Admin helper**: `verifyAllAuditChains(db)` في `src/lib/audit/qcChain.ts` يعيد حالة task chain وQC/Lab chain و`lastVerifiedAt: null` إلى أن يُحفظ مستقبلًا؛ القراءة كاملة لكن لا تُستدعى من health العام تلقائيًا.
- **Compatibility**: حُدّث `db/schema.sql` وembedded migrations وعدادات الاختبارات وDB doctor إلى schema version **32** مع بقاء عدد الجداول **51**.
- **Verification**: `pnpm test` **exit 0**؛ `pnpm test:migrations` PASS؛ `pnpm test:audit-integrity` PASS؛ `pnpm test:delete-durability` PASS؛ `pnpm test:db-doctor` PASS؛ `pnpm test:dashboard-reports` PASS؛ `pnpm typecheck` **0 errors / 0 warnings / 19 hints**؛ `NODE_ENV=production pnpm build` Complete؛ `git diff --check` PASS. لا production verification.
- **Status**: delivered locally؛ لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-POST-IMPLEMENTATION-CORRECTNESS-012: إصلاح correctness بعد Prompts 001–010 — تحقق محلي مكتمل بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ لا migration جديدة لأن cancellation API كانت dead/unreferenced فحُذفت بدل إدخال lifecycle غير مستخدم.
- **Change requests/retests**: اعتماد `RETEST_REQUEST` صار يستدعي `createLabRetest()` الكنسي فقط؛ أزيلت INSERTs المكررة و`PENDING-CR-*`، واستُعيدت أرقام `LAB-RETEST-*` و`LAB-TEST-xxxxx` والأوديت والإشعار الكنسي. Approval/rejection audit صار `PENDING → APPROVED/REJECTED` مع بقاء proposal/base JSON في الطلب و`review_note`.
- **Form correctness**: `isRowEmpty()` صار يحتسب `applied_pressure` و`volume_liter`. انفصلت خيارات العينة `LAB_SAMPLE_RESULT_OPTIONS = PASS/FAIL` عن النهائية `LAB_FINAL_RESULT_OPTIONS = PASS/FAIL/HOLD`، مع factory يسمح للـ template بتحديد vocabulary العينة مستقبلًا؛ default FR-MA-018 يرفض sample HOLD ويقبل final HOLD.
- **Tests**: أضيفت regressions لاعتماد retest من employee→manager، canonical numbers/notification/audit، status audit values، no direct retest INSERT/dead cancellation، sample-row removal warning، result separation/template override، وتسلسل retest المتزامن. `pnpm test` **exit 0**؛ `pnpm typecheck` **0 errors / 0 warnings / 19 hints**؛ `NODE_ENV=production pnpm build` **Complete**؛ `pnpm test:architecture` و`git diff --check` ناجحان. تحذيرات Vite build الحالية غير حاجزة.
- **Files**: `src/lib/lab/changeRequests.ts`, `src/lib/lab/policy.ts`, `src/lib/validation.ts`, `src/components/lab/LabTestForm.tsx`, `src/pages/lab/tests/new.astro`, والاختبارات `scripts/test-lab-{change-requests,form,retests}.mjs`.
- **Status**: delivered locally؛ لا production verification، ولا commit أو push أو deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-DB-MIGRATION-DOCTOR-011: تشخيص آمن لوضع قاعدة QC ومنع تشغيل migrations يدويًا — التنفيذ والتحقق المحلي مكتملان بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ لا تعديل لمحتوى migrations `001–030`، ولا commit أو push أو deploy.
- **DB doctor**: أضيف `scripts/db-doctor.mjs` مع `db:status` و`db:verify`؛ يطبع مسار قاعدة البيانات، وجود/حجم الملف، WAL، foreign keys، نسخة schema، آخر migration، عدد migrations/failures، checksum state (`MATCH/MISSING/DRIFT`)، required tables/columns، `PRAGMA integrity_check` و`PRAGMA foreign_key_check`، وحالة `PASS / FAIL` بدون أي mutation.
- **Guidance**: الطبيب يوجّه لقاعدة موجودة عبر `pnpm db:init`، وللقاعدة المحلية disposable فقط عبر `pnpm db:reset`، ويحذر من بيانات production/user ومن تشغيل ملفات migration منفردة في DataGrip/SQLTools؛ يوضح أن `002` runner marker وليس standalone SQL migration.
- **Backup edge case**: `backupBeforeMigration()` يتعامل صراحة مع `:memory:` ولا يستدعي `copyFileSync(':memory:', ...)`، مع إبقاء backup الحقيقي لقواعد الملفات كما هو.
- **Tests**: `test:db-doctor` يغطي fresh/fully migrated/legacy/incompatible shape/checksum drift/missing migration/FK violation/integrity failure وdestructive `:memory:` backup؛ `pnpm test:db-doctor` و`pnpm test:migrations` ناجحان. `pnpm typecheck` = 0 errors / 19 hints؛ `NODE_ENV=production pnpm build` = Complete مع تحذيرات Vite غير حاجزة؛ `git diff --check` نظيف عند تعطيل fsmonitor.
- **Status**: delivered locally؛ ملفات `.agents/skills/**` غير المتتبعة الموجودة مسبقًا محفوظة كما هي، ولا توجد تغييرات تحت `db/migrations/`.

### 2026-08-23 — QC-FINAL-REGRESSION-GATE-010: تحقق مستقل كامل للنظام — NO-GO محليًا بسبب E2E cleanup failure وreports process hang

- **Scope**: `apps/qc-task-manager/`؛ لا commit ولا push ولا deploy. نفذت `CI=true pnpm install --frozen-lockfile` بنجاح بعد السماح بالشبكة، والـ lockfile بقي up to date.
- **Migrations**: fresh **30/30**، upgrade صريح **026→027→028→029→030** طبّق `[27,28,29,30]`، latest schema version **30**، table count **51**، `PRAGMA integrity_check=ok`، و`PRAGMA foreign_key_check` = **0**.
- **Build/typecheck/tests**: `pnpm typecheck` exit 0 = 0 errors/0 warnings/19 hints؛ `NODE_ENV=production pnpm build` Complete مع تحذيري Vite غير حاجزين. Aggregate `pnpm test` exit 0. السكربتان المستثنيتان من aggregate هما `test:lab-print` و`test:lab-retention`، وشغّلتهما منفصلًا: **51/0** و**37/0**.
- **E2E evidence**: full `pnpm e2e:acceptance` بدأ خارج sandbox، ثم نجح `admin-users` **49/0** و`auth-lockout` **44/0**، وتوقف في `task-shared` بعد assertions ناجحة بسبب `SQLITE_CONSTRAINT_TRIGGER: FOREIGN KEY constraint failed` عند cleanup `e2e-task-shared.mjs:946` أثناء حذف `emp_create`. Overall full E2E = **UNVERIFIED**؛ لم تصل بقية suites ولا persistence phase عبر runner.
- **Reports**: standalone reports assertions **374/0** وتشمل transport/auth/audit، لكن `scripts/e2e-reports.mjs` لم يغلق `browser`/contexts؛ العملية علقت بعد آخر assertion واضطررت لإيقافها. لذلك ليست E2E PASS.
- **Backup/persistence**: standalone backup **13/0** مع manual backup verification PASS + integrity check؛ restart persistence create/verify نجح لملف evidence. WI content/change request/approved test لم تدخل في persistence script، فتبقى غير مثبتة.
- **Health/production**: missing DB أعاد 503؛ لم يُثبت live production. `Verified in production = NO`. قرار البوابة: **NO-GO** بسبب full E2E غير مكتمل/cleanup FK وreports hang، مع عدم وجود production evidence.

### 2026-08-23 — QC-AUDIT-DURABILITY-009: حفظ دليل حذف المهام وسلسلة تدقيق Lab/QC — التنفيذ والتحقق المحلي مكتملان بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ migration **030** أضافت `task_deletion_history` كـ snapshot مستقل خارج FK المهمة، مع triggers تمنع UPDATE/DELETE على سجل القرار؛ طلب الحذف الحي يبقى CASCADE كما هو، لكن approval/rejection ينسخ الهوية والعنوان والسبب والمراجع والملاحظة والتوقيت والنتيجة قبل الإنهاء.
- **Task activity chain**: migration 030 أعادت بناء `task_activity_log` مع `task_id` identity غير cascading، فتبقى سجلات المهمة المحذوفة وسلسلة الهاش العالمية متصلة؛ حذف المهمة المشروع لا يكسر `verifyAuditChain`، بينما UPDATE/DELETE لصف قديم يكشفه التحقق.
- **QC/Lab chain**: أضيف `src/lib/audit/qcChain.ts` بمحمول canonical ثابت (`entity_type/entity_id/task_id/actor_id/action/old_value/new_value/note/created_at`)، `previous_hash/event_hash`، append transactional موحد، و`verifyQcAuditChain`. كل writers الإنتاجية لـ `qc_audit_log` تمر بالمساعد المشترك. Backfill الصفوف القديمة يبدأ من genesis boundary صريح؛ هذا tamper-evident وليس cryptographic immutability.
- **Compatibility**: migration backfill تحفظ الصفوف القديمة verbatim، وتعيد بناء `qc_audit_log` السابقة دون إسقاط التاريخ؛ `schema.sql` وembedded migrations وعدادات الاختبارات محدثة إلى **30 migrations / 51 tables**. تاريخ Lab/QC القديم لا يُعاد الادعاء بإثبات ما قبل حد genesis.
- **Tests**: `pnpm test` **exit 0** شاملًا؛ `pnpm test:migrations` PASS (fresh/upgrade/rollback/FK + legacy audit backfill)، `test:audit-integrity` PASS (normal/update/delete/task deletion)، `test:delete-durability` PASS (approval/rejection survives)، `test:lab-audit` **60/0**، `test:lab-tests` **258/0**، `pnpm typecheck` **0 errors**، `pnpm build` Complete، `git diff --check` PASS. لا production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-REPORTING-TRANSPORT-FIX-008: استعادة/تأكيد نقل تقارير HTTP ومحاذاة catalog/UI/E2E — التنفيذ والتحقق المحلي مكتملان بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ أبقيت منطق القراءة والكتابة الموجود تحت `src/lib/reporting/**` كما هو، وثبّتت النقل عبر `GET /api/reports/[reportType].csv|xlsx|pdf` و`GET /api/reports/audit` الموجودين فعليًا.
- **Transport/security**: parser التقارير صار يرفض أي query parameter غير مدعوم، ويفرض `scope=organization` فقط، ويرفض pagination غير المدعوم بدل تجاهله. endpoint يستخدم catalog + `authorizeReport`، ولا يوجد dynamic SQL مبني من `reportType`؛ audit visibility نُقلت إلى `authorizeReportAudit` بدل role branching داخل endpoint.
- **UI/catalog**: أضيف `TASK_REPORT_TYPES` كمصدر ترتيب task reports؛ `/reports` يعرض تقارير المهام الثمانية فقط، و`/lab/reports` يعرض 16 نوع Lab الفعلية، وصُحح نص العدد من 15 إلى العدد المشتق من catalog.
- **E2E**: حدّثت `scripts/e2e-reports.mjs` ليغطي كل 16 Lab report × الصيغ الثلاث، content types/filenames/non-empty، supervisor/employee/anonymous/invalid inputs، ووجود audit. أصلحت fixtures قديمة لا تطابق `qc_audit_log` CHECK constraints الحالية.
- **Verification**: `pnpm test:dashboard-reports` PASS؛ `pnpm test:lab-reports` **196/0**؛ `pnpm typecheck` **0 errors / 0 warnings / 19 hints**؛ `pnpm build` Complete؛ isolated live `e2e-reports.mjs` **374/0**؛ لا production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-MIGRATIONS-VERIFY-002: تحقق أن كل migrations الـ 29 تعمل (كلها خضراء) + تشخيص أخطاء "duplicate column" عند تشغيلها يدويًا من SQL IDE — ليست أعطالًا؛ الملفات تعمل فقط عبر الـ runner

- **Scope**: `apps/qc-task-manager/db/migrations/` — تحقق فقط (read-only). (أ) طلب أول: التأكد أن الـ 29 تعمل. (ب) طلب ثانٍ: المستخدم شغّل ملفات `{002,003,005,006,008,011}.sql` يدويًا من SQL IDE (صيغة رسائل DataGrip) على قاعدة مُهاجرة مسبقًا (نسخة 29) فحصل `SQLITE_MISUSE: not an error` (002) و`duplicate column name` (003 task_type، 005 evidence_type، 006 skills_json، 008 previous_hash، 011 current_version_id).
- **التحقق الكامل (كلهم يعملون)**: `pnpm test:migrations` = **PASS** كامل (Fresh + حفظ qc_audit_log عبر rebuild 011 + ترقية legacy وحفظ بيانات 19 عمود + repeated/checksum + rollback/recovery + destructive guard)؛ **init-db حي على قاعدة طازجة**: نسخة **29/29**، **50 جدول** (مو 49 — 027 أضافت `lab_change_requests`)، 103 فهرس، `integrity_check=ok`، **0** FK violations، مرآة `schema.sql` محدّثة لأعمدة 028/029. الـ 29 كلهم مسجلون في `embeddedMigrations` بـ `db.ts`.
- **Root cause لأخطاء التشغيل اليدوي (مُعاد إنتاجه بالدليل)**: (1) SQLite ما يدعم `ADD COLUMN IF NOT EXISTS` — إعادة تنفيذ migration مطبّق على قاعدة فيها الأعمدة تفشل عند أول ALTER. أعدت إنتاج رسائل duplicate الأربعة حرفيًا بـ `db.exec` لملفات 003/005/006/008 على قاعدة طازجة بعد init. (2) `002_legacy_schema_reconciliation.sql` **ملف علامات بلا أي SQL** — الـ runner يرى `-- brightai:legacy-reconcile` ويستدعي `reconcileLegacy()` البرمجي (migrations.ts:159)؛ تنفيذه في IDE = statement فارغ → `SQLITE_MISUSE` خاصة بالعميل.
- **الحقيقة المعمارية**: الـ migrations ما هي scripts مستقلة idempotent — idempotency يوفرها الـ runner (`src/lib/migrations.ts`): `schema_migrations` تضمن تنفيذ كل ملف مرة واحدة + checksum drift guard + transaction مع FK check بعد كل ملف + backup تلقائي قبل الهدّام + تسجيل فشل في `schema_migration_failures`. المسار الصحيح الوحيد للتشغيل: تلقائي عند إقلاع التطبيق أو `pnpm db:init` — مو DataGrip.
- **Notes/قرار مهم للـ future agents**: لا تعدّل ملفات الـ migrations لتصير idempotent-standalone (لف كل ALTER بـ probe) — الفشل عند إعادة التشغيل اليدوية حارس صحي، والتعديل يكسر checksums كل القواعد المهاجرة (drift guard يرفض الإقلاع). القواعد المؤقتة حُذفت؛ صفر تغييرات كود.
- **Status**: verified & diagnosed — لا commit ولا push؛ لا تغييرات كود غير سجل العقل.

### 2026-08-23 — QC-LAB-WI-CATALOG-007: استيراد فهرس WI الورقي وتمكين تأليف المحتوى — التنفيذ والتحقق المحلي مكتملان، بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ migration `029_wi_catalog_import.sql` أضافت `source_revision`, `source_date`, `source_register_code`, `source_class` إلى `lab_documents` مع فهرس مصدر. استُخدم `lab_documents` و`lab_document_versions` فقط؛ لا جداول WI موازية.
- **Import**: استُوردت بالضبط **33** هوية WI من page 1/3، keyed by `lab_documents.code`، `type='WI'`, `status='DRAFT'`, `current_version_id=NULL`, وبدون إنشاء `lab_document_versions` أو `qc_audit_log` actors. Rev 0 محفوظ (25 صفًا)، والتواريخ normalized إلى `YYYY-MM-DD`، وspelling المصدر محفوظ (`Eye Sheild`, `Face Sheild`, `Temperature Prob`, `Mannual Resuscitator`). collisions تحفظ العنوان/المحتوى/الحالة وتملأ metadata الناقصة فقط وتظهر في تقرير الاستيراد.
- **Authoring/UI**: الموظف يقدر `Add Content` للـ catalog-only WI؛ أول محتوى غير فارغ يبقى عبر `LabDocumentEditor` ويُنشئ v1 DRAFT transactionally وبـ session author/owner. صفحة التفاصيل تعرض metadata المصدر وحالة `No content has been entered yet.` بدون Version 1 أو fake author قبل المحتوى. قائمة المستندات أضيف لها source columns وContent Status/Missing Content filter، والبحث يشمل source metadata. Command Center يعرض WI Catalog/Missing/Draft/Under Review/Approved وcompletion من DB counts.
- **Data quality/reporting**: catalog-only WIs مستثناة من generic Data Quality gaps حتى لا تتكرر كأخطاء؛ Missing Content هو المسار التشغيلي المقصود. تقارير WI تشمل الكتالوج المستورد.
- **Files**: `db/migrations/029_wi_catalog_import.sql`, `db/schema.sql`, `src/lib/db.ts`, `src/lib/lab/wiCatalog.ts`, `src/lib/lab/{documents,overview,dataQuality}.ts`, `src/lib/permissions.ts`, `src/lib/types.ts`, صفحات `lab/index`, `lab/documents/index`, `lab/documents/[id]`, `scripts/init-db.mjs`، واختبارات migration/documents/overview/data-quality/reports والنسخ المتأثرة.
- **Verification**: `pnpm test` = **ناجح بالكامل**؛ `pnpm test:lab-documents` = **282/0**؛ `pnpm test:migrations` = PASS؛ `pnpm test:lab-overview` = **92/0**؛ `pnpm test:lab-data-quality` = **38/0**؛ `pnpm typecheck` = **0 errors / 0 warnings / 19 hints**؛ `pnpm build` = **Complete**؛ `git diff --check` = PASS. لا browser E2E ولا production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ ملفات `.agents/skills/**` المحذوفة بالخطأ أثناء التحقق أُعيدت إلى حالتها الأصلية، وتبقى تغييرات QC فقط للمستخدم.

### 2026-08-23 — QC-LAB-MANAGEMENT-VISIBILITY-006: شفافية تغييرات مساهمي المختبر — التنفيذ والتحقق المحلي مكتملان، بدون commit/push/deploy

- **Scope**: `apps/qc-task-manager/`؛ طورت صفحة `/lab/change-requests` لتعرض إدارة المختبر كل الطلبات مع Request ID/entity/operation/target/requester/role/submitted/status/reviewer/reviewed/stale-conflict، وتعرض المساهمين طلباتهم فقط. صفحة التفاصيل تعرض field-level diff للـ UPDATE وraw JSON داخل details تشخيصي ثانوي.
- **Review/API**: أضيف `POST /api/lab/change-requests/[id]/review` مع session + origin CSRF + manager/admin RBAC + Zod + PENDING + self-review + stale/conflict عبر خدمة `changeRequests.ts`؛ أزرار الصفحة صارت تشير للمسار الصحيح.
- **Notifications**: استُخدمت نفس `notifications` table ونفس read state/entity_href، مع استبدال أنواع الطلب القديمة بالأنواع الثلاثة الدقيقة `lab_change_review_requested`, `lab_change_review_approved`, `lab_change_review_rejected`. الطلب يرسل فقط إلى active manager/admin، والاعتماد/الرفض إلى requester، والرفض يحمل السبب.
- **Command Center/Audit**: أضيفت KPIs المدعومة ببيانات `lab_change_requests` (pending master-data, today, rejected, >24h) ونشاط `qc_audit_log` مع actor role/action/entity/record/href؛ بقيت صفحة audit المشتركة read-only و`LAB_CHANGE_REQUEST` مع label/href الموجودين، بدون نظام تدقيق ثانٍ.
- **Files**: `src/lib/lab/changeRequests.ts`, `src/lib/lab/overview.ts`, `src/lib/notifications.ts`, `src/pages/api/lab/change-requests/[id]/review.ts`, صفحات `lab/change-requests`, `lab/index`, `lab/notifications`, `notifications`, واختبار `scripts/test-lab-change-requests.mjs`.
- **Verification**: `pnpm typecheck` = 0 errors / 0 warnings / 19 hints؛ focused change requests PASS، overview **92/0**، notifications **85/0**، audit **60/0**؛ `NODE_ENV=production pnpm build` = Complete؛ Architecture Guard = passed؛ `pnpm test` الكامل = exit 0؛ `git diff --check` = exit 0 مع تحذير fsmonitor IPC بيئي فقط. لا browser E2E ولا production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-LAB-FR-MA-018-ALIGNMENT-005: محاذاة نموذج اختبار المختبر مع transcription الورقي FR-MA-018 بدون اختراع قيم علمية — **التنفيذ والتحقق المحلي مكتملان، بدون commit/push/deploy**

- **Scope**: `apps/qc-task-manager/`؛ migration `028_lab_test_form_alignment.sql` أضافت additive columns: `testing_date`, `actual_force`, `torque_value`, `humidity_measured` على `lab_test_records`، و`applied_pressure`, `volume_liter` على `lab_test_samples`، و`effective_date` على `lab_test_template_versions`. بقيت `actual_pressure`, `torque_in_lb`, `volume_sec` محفوظة كـ legacy بلا إعادة تفسير.
- **Scientific/reference rule**: أزيلت fallback constants (`LAB_ACTUAL_PRESSURE_REFERENCE`, `LAB_STANDARD_PARAMETER`, `LAB_ACCEPTANCE_CRITERIA`, `LAB_HOLDING_TIME`) من مسار التنفيذ؛ `parameters_json` في approved/current compatible template هو مصدر المرجع، وبدون template approved لا تُنشأ parameters snapshot ويُعرض `No approved reference available.`. أضيف دعم حقول template الاختيارية (medium/reference/condition/leakage/holding) بدون إلزامها أو تعميم AIR على VACUUM.
- **Form/print**: connector labels صارت مطابقة للنص المورّد (`Non-locking (rigid) connector`, `Connector with floating or movable collar`, `Locking connector with fixed threads`)؛ الواجهة والطباعة تعرض `Actual Force`, `Torque (N.m)`, `Applied Pressure (kpa)`, `Volume (liter)`، مع عرض legacy fields منفصلة؛ testing date/humidity وحقول العينة الجديدة تُحفظ وتُعدّل وتُطبع، وبقيت نتيجة PASS/FAIL/HOLD قرارًا بشريًا بلا حساب علمي تلقائي.
- **Snapshots**: submission لا يلتقط reference إلا من approved template المتوافق؛ approval snapshots الحالية للمنتج/template/parameters/equipment/calibration/controlled documents بقيت ضمن transaction ولا تعيد resolve التاريخ المعتمد من master data مستقبلاً.
- **Files**: `db/migrations/028_lab_test_form_alignment.sql`, `db/schema.sql`, `src/lib/db.ts`, `src/lib/{types,validation}.ts`, `src/lib/lab/{policy,templates,tests}.ts`, `src/components/lab/{LabTestForm,LabTemplateForm}.tsx/.astro`, صفحات `lab/tests/new`, `[id]`, `print`, template new، واختبارات migration/form/tests/products/security/e2e form.
- **Verification**: `pnpm typecheck` = **0 errors / 0 warnings / 19 hints**؛ `NODE_ENV=production pnpm build` = **Complete**؛ migrations **PASS** (28/28 + new columns + legacy preservation)؛ `test:lab-form` **60/0**؛ `test:lab-tests` **258/0**؛ `test:lab-templates` **39/0**؛ `test:lab-security` **63/0**؛ `test:lab-print` **51/0**؛ `test:lab-review` **97/0**؛ `test:lab-products` **85/0**؛ `git diff --check` لا أخطاء مع تحذير fsmonitor IPC بيئي فقط. لم يُدّعَ browser E2E أو production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-LAB-DOCUMENT-AUTHORING-004: فصل هوية SOP/WI عن أول محتوى مع authoring لجميع الأدوار — **التنفيذ والتحقق المحلي مكتملان، بدون commit/push/deploy**

- **Scope**: `apps/qc-task-manager/` controlled documents. سمحت الخدمة بإنشاء `lab_documents` كـ catalog-only بدون `current_version_id` أو version مصطنعة؛ أول حفظ محتوى غير فارغ ينشئ v1 DRAFT داخل transaction، يربط `current_version_id`، يثبت author من session، ويسجل `LAB_DOCUMENT_VERSION/VERSION` في `qc_audit_log`.
- **RBAC/lifecycle**: كل الأدوار تنشئ draft identity؛ الموظف يُربط owner له server-side ولا يستطيع إعادة تعيين الملكية؛ employee/supervisor يعدلان فقط owned/authored DRAFT، supervisor يراجع سجلًا آخر، manager/admin يعتمدون فقط بعد منع self-review/self-approval؛ APPROVED بقي immutable وedit ينشئ vN+1 DRAFT.
- **UI/security**: editor يقبل catalog-only ويعرض `No content has been entered yet.` و`Add Content`؛ detail لا يعرض v1 عند غياب المحتوى؛ middleware أبقى auth + CSRF + path-bound id + Zod، والمحتوى يمر عبر renderer الآمن. أضيف `lab_document_content_started` فقط لإشعار manager/admin عند أول محتوى، مع إعادة استخدام نظام notifications الحالي.
- **Files**: `apps/qc-task-manager/src/lib/lab/documents.ts`, `src/lib/permissions.ts`, `src/lib/validation.ts`, `src/lib/notifications.ts`, `src/components/lab/LabDocumentEditor.astro`, صفحات `lab/documents/new.astro` و`[id].astro` وصفحات الإشعارات، و`apps/qc-task-manager/scripts/test-lab-documents.mjs`.
- **Verification**: `pnpm test:lab-documents` = **271 passed / 0 failed**؛ `pnpm typecheck` = **0 errors / 0 warnings / 20 hints**؛ `pnpm build` = **Complete**؛ `pnpm test` = **ناجح بالكامل**؛ `git diff --check` = **ناجح** مع تحذير fsmonitor IPC فقط. لا E2E/production verification.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ المستخدم يراجع ويلتزم بنفسه.

### 2026-08-23 — QC-LAB-CONTRIBUTOR-MASTER-DATA-003: ربط نماذج Equipment/Product/Calibration بطابور مراجعة المساهمين — **التنفيذ والتحقق المحلي مكتملان، بدون commit/push/deploy**

- **Scope**: مساهمو employee/supervisor يرسلون CREATE/UPDATE proposal عبر Change Review Queue بدون canonical mutation؛ manager/admin يحتفظون بالسلوك المباشر. ربط اعتماد الطلبات بخدمات `equipment.ts` و`products.ts` و`calibration.ts` بدل تكرار INSERT/UPDATE/audit داخل `changeRequests.ts`.
- **Security/lifecycle**: إعادة التحقق من canonical payload عند الاعتماد، uniqueness وFK/eligibility عبر الخدمات الكنسية، stale protection عبر `base_updated_at` + snapshot comparison، calibration proposal لا يكتب calibration row أو equipment display state قبل APPROVED، generic body UPDATE مرفوض حتى لا يصبح `entity_id` المرسل مسار تعديل، تفاصيل الطلبات scoped لصاحبها أو manager/admin، وpending count scoped للموظف/المشرف.
- **UI**: نماذج المساهمين تعرض `Submit for Review` والتنبيه `Your change will be reviewed by laboratory management before it becomes active.`؛ direct manager/admin يعرض Save/Update؛ بعد proposal redirect إلى `/lab/change-requests/{id}`؛ صفحات تفاصيل الكيانات تعرض `Pending contributor changes: N` مع رابط Review للإدارة.
- **Tests/files**: `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`, `src/lib/lab/changeRequests.ts`, خدمات المختبر الثلاث، مكونات النماذج الثلاث، صفحات new/edit/detail للكيانات الثلاثة، وصفحة تفاصيل طلب التغيير.
- **Verification**: `pnpm typecheck` = 0 errors / 0 warnings / 20 hints؛ `pnpm test` = exit 0؛ focused: change requests PASS، equipment 130/0، products 85/0، calibration 97/0، security 63/0؛ `pnpm test:architecture` PASS؛ `NODE_ENV=production pnpm build` PASS؛ `git diff --check` exit 0 مع تحذير fsmonitor IPC فقط. لا E2E/production claim.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ ملفات `.agents/skills/**` الموجودة كـ dirty state بقيت بدون مساس.

### 2026-08-23 — SKILL-INSTALL-SYSTEMATIC-DEBUGGING-001: إضافة مهارة `systematic-debugging` من magnus919 — **التثبيت مكتمل والتحقق المحلي مكتمل بعد إصلاح توافق Codex**

- **Command**: `npx skills add magnus919/agent-skills --skill systematic-debugging --agent codex --yes`
- **Result**: الأداة اكتشفت Codex، ونسخت مهارة واحدة إلى `.agents/skills/systematic-debugging/`، مع تقييم `Safe` و`0 alerts` من Gen/Socket و`Med Risk` من Snyk.
- **Files**: `.agents/skills/systematic-debugging/` ومفتاح المهارة الجديد في `skills-lock.json`؛ التثبيت استبدل النسخة المحلية السابقة وما كان فيها من ملفات إضافية.
- **Compatibility fix**: حُذف مفتاح frontmatter `compatibility` من `SKILL.md` لأنه غير مدعوم في validator الحالي لـ Codex؛ لم يتغير محتوى التعليمات.
- **Verification**: التثبيت exit 0؛ `python3 /Users/yzydalshmry/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/systematic-debugging` → `Skill is valid!`؛ `git diff --check` ناجح. لا build/tests للتطبيق لأن التغيير إضافة Skill فقط.
- **Status**: installed locally — لا commit ولا push؛ المستخدم يراجع المهارة قبل استخدامها.

### 2026-08-23 — SKILL-INSTALL-ASTRO-DEVELOPER-001: إضافة مهارة `astro-developer` من مستودع Astro — **التثبيت والتحقق مكتملان**

- **Command**: `npx skills add https://github.com/withastro/astro --skill astro-developer`
- **Result**: الأداة اكتشفت Codex وثبّتت مهارة واحدة في `.agents/skills/astro-developer/`، مع تقييم `Safe` و`0 alerts` و`Low Risk` من Snyk.
- **Files**: `.agents/skills/astro-developer/SKILL.md` و`architecture.md` و`constraints.md` و`debugging.md` و`testing.md` و`evals/evals.json` + تحديث `skills-lock.json`.
- **Verification**: أمر التثبيت exit 0؛ `quick_validate.py .agents/skills/astro-developer` → `Skill is valid!`. لا build/tests للتطبيق لأن التغيير إضافة Skill فقط.
- **Status**: installed locally — لا commit ولا push؛ المستخدم يراجع المهارة قبل استخدامها.

### 2026-08-23 — SKILL-INSTALL-WEB-DESIGN-GUIDELINES-001: إضافة مهارة `web-design-guidelines` من Vercel — **التثبيت مكتمل والتحقق المحلي مكتمل**

- **Command**: `npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines`
- **Result**: الأداة اكتشفت Codex وثبّتت مهارة واحدة في `.agents/skills/web-design-guidelines/`، مع تصنيف `Safe` و`0 alerts` و`Med Risk` من Snyk.
- **Files**: `.agents/skills/web-design-guidelines/SKILL.md` + تحديث `skills-lock.json` من أداة التثبيت.
- **Verification**: التثبيت exit 0؛ المهارة تستخدم مصدر Vercel الخام وتطلب جلب أحدث الإرشادات قبل كل مراجعة UI. لا build/tests للتطبيق لأن التغيير إضافة Skill فقط.
- **Status**: installed locally — لا commit ولا push؛ المستخدم يراجع المهارة قبل استخدامها.

### 2026-08-23 — SKILL-INSTALL-PERFORMANCE-001: إضافة مهارة `performance` من Addy Osmani — **التثبيت والتحقق مكتملان**

- **Command**: `npx skills add https://github.com/addyosmani/web-quality-skills --skill performance`
- **Result**: الأداة اكتشفت Codex وثبّتت مهارة واحدة في `.agents/skills/performance/`، مع تصنيف `Safe` و`0 alerts` و`Low Risk`.
- **Files**: `.agents/skills/performance/SKILL.md` + تحديث `skills-lock.json` من أداة التثبيت.
- **Verification**: `quick_validate.py .agents/skills/performance` → `Skill is valid!`؛ لا build/tests للتطبيق لأن التغيير إضافة Skill فقط.
- **Status**: installed locally — لا commit ولا push؛ المستخدم يراجع المهارة قبل استخدامها.

### 2026-08-23 — QC-LAB-RBAC-EXPANSION-002: توسيع مساهمة أدوار المختبر مع إبقاء الاعتماد والإدارة محكومة — **التنفيذ المحلي والتحقق مكتملان، وإثبات الإنتاج غير منفّذ**

- **Scope**: توسيع RBAC لمسارات اختبارات المختبر، المعدات، المنتجات، المعايرة، الصيانة، المستندات، القوالب وإعادة الاختبار؛ الموظف/المشرف يرسلان proposal عبر Change Review Queue، والمدير/المدير العام يطبّقان التغييرات المعتمدة مباشرة حسب المسار.
- **Security invariants**: `src/lib/permissions.ts` بقي مصدر الحقيقة؛ منعت self-review/self-approval على مستوى السجل؛ الاختبارات APPROVED/VOID بقيت غير قابلة للتعديل؛ proposal المعدات/المنتجات/المعايرة لا يكتب الجداول canonical؛ طلب RETEST من الموظف يمر بالطابور ولا ينشئ retest فعليًا قبل اعتماد الإدارة؛ الصيانة append-only، والمعدة المؤرشفة تمنع أحداث صيانة جديدة؛ نطاق finding links والتقارير/التصدير الإداري لم يتوسع.
- **Files**: `apps/qc-task-manager/src/lib/permissions.ts`, `src/lib/lab/{tests,equipment,products,calibration,retests,templates}.ts`, صفحات ومسارات lab المتأثرة، واختبارات RBAC/queue ذات الصلة.
- **Verification**: `pnpm test` = **ناجح بالكامل (exit 0)**؛ الاختبارات المركزة شملت change requests, tests, templates, documents, maintenance, security, equipment, products, calibration, retests؛ `pnpm typecheck` = **0 errors / 0 warnings / 20 hints**؛ `NODE_ENV=production pnpm build` = **ناجح**؛ `pnpm test:architecture` = **ناجح**؛ `git diff --check` = **ناجح**. تحذيرات build الديناميكية وGit fsmonitor غير مانعة ولم تغيّر الملفات.
- **Status**: delivered locally — لا commit ولا push ولا deploy؛ E2E/production verification غير مُدّعى به.

### 2026-08-23 — SKILL-INSTALL-GRILL-ME-001: إضافة مهارة `grill-me` من Matt Pocock — **التثبيت مكتمل، والتحقق كشف مفتاح frontmatter غير مدعوم**

- **Command**: `npx skills add https://github.com/mattpocock/skills --skill grill-me`
- **Result**: الأداة اكتشفت Codex وثبّتت مهارة واحدة في `.agents/skills/grill-me/`، مع تصنيف `Safe` و`0 alerts` و`Low Risk`.
- **Files**: `.agents/skills/grill-me/SKILL.md` + `.agents/skills/grill-me/agents/openai.yaml`.
- **Verification**: التثبيت exit 0؛ `quick_validate.py` فشل لأن المصدر يحتوي `disable-model-invocation`، وهو مفتاح غير مدعوم في validator الحالي (المفاتيح المسموحة: `allowed-tools`, `description`, `license`, `metadata`, `name`). لم تُعدّل ملفات المهارة upstream تلقائيًا.
- **Status**: installed locally — لا commit ولا push؛ المستخدم يراجع المهارة قبل استخدامها.

### 2026-08-23 — SKILLS-CODEX-COMPAT-001: تدقيق توافق مهارات BRIGHTAI مع Codex — **65/65 صالحة للاكتشاف والاستخدام**

- **Scope**: مراجعة كل مجلدات `.agents/skills/*` للتأكد من وجود `SKILL.md`، وصحة YAML frontmatter، وتطابق اسم المهارة مع اسم المجلد، وصحة ملفات `agents/openai.yaml` الموجودة، وسلامة المراجع المحلية.
- **Findings fixed**: 7 مهارات كانت تحمل مفاتيح frontmatter غير مدعومة أو اسمًا غير قياسي: نقل metadata غير القياسية إلى `metadata`، ضبط سياسة `i-have-adhd` إلى explicit-only في `openai.yaml` بما يطابق نصها، وتغيير اسم `SEO Optimizer` إلى `seo-optimizer`.
- **Result**: `quick_validate.py` = **65/65 valid**؛ metadata consistency = **ok**؛ ملفات `openai.yaml` الموجودة = **37/37 valid**؛ كل المهارات عندها `SKILL.md`. وجود `openai.yaml` اختياري، لذلك الـ28 المهارات الباقية قابلة للاستخدام بدون ملف واجهة إضافي.
- **Files**: `.agents/skills/claude-automation-recommender/SKILL.md`, `.agents/skills/distribb/SKILL.md`, `.agents/skills/i-have-adhd/SKILL.md`, `.agents/skills/i-have-adhd/agents/openai.yaml`, `.agents/skills/pick-ui-library/SKILL.md`, `.agents/skills/prototype/SKILL.md`, `.agents/skills/review-animations/SKILL.md`, `.agents/skills/seo-optimizer/SKILL.md`.
- **Verification**: docs/metadata-only؛ لا حاجة لـ`pnpm build` أو اختبارات التطبيق. `git diff --check` نظيف، مع ظهور تحذير fsmonitor IPC من Git فقط، بلا أثر على الملفات.
- **Status**: delivered — لا commit ولا push؛ المستخدم يلتزم وينشر بنفسه.

### 2026-08-23 — QC-REPORT-REWRITE-001: إعادة كتابة `audit/qc/REPORT.md` كاملًا (v2.0) — وصف حديث للنظام بالسعودي العامي مع تنبيه صريح أن واجهة النظام إنجليزية — كل الأرقام مُتحقَّقة من الكود لحظة الكتابة

- **What**: التقرير القديم (11 أغسطس، 41 قسمًا بأسلوب محادثة) كان يقارن حزم البرومبتات بالتنفيذ يوم كان النظام 12 جدولًا — النظام تضاعف بعده (49 جدولًا/26 migration/مختبر كامل)، فأُعيد بناء الملف كوصف للنظام الحالي حسب طلب المستخدم: وصف "وش هو النظام ووش يسوي" بالعامية السعودية + قسم صريح بأعلى التقرير أن **واجهة النظام كلها بالإنجليزي** والتقرير عربي للفهم فقط. البنية الجديدة: (1) نقطة اللغة، (2) تعريف النظام وفلسفته (Accountability/Evidence/Audit/RBAC) وقطاعيه (مهام+جودة / مختبر)، (3) جدول الأرقام، (4) تحليل مسارات النظام كاملًا (بنية monorepo + خريطة الـ 100 مسار: 51 مهام/جودة مقابل 49 مختبر + منطق التصميم: endpoint تقارير واحد، طباعة بمحمّل مشترك، إشعارات بلا نظام ثانٍ، تقويم مشتق بلا جدول)، (5) الأدوار الأربعة والقواعد الصلبة (Field Locking، منع self-approval، تجميد النهائيات، delete-request، e-signature)، (6) دورة حياة المهمة + SLA/Findings/RCA/CAPA/Evidence، (7) المختبر (snapshots عند الاعتماد، عينات مجمّدة بtriggers، QR، إشعارات مجدولة، كاشف تكرار FAIL، retention بلا حذف)، (8) الـ 15 ميزة AI الاستشارية بقواعدها (AI=توصية، وسم zod إلزامي، rate-limit، فشل آمن) مع التصريح أن التحقق الحي للمزوّد فاشل سابقًا، (9) التقارير الـ 24، (10) الأمان المحدث (8 ثغرات مغلقة + hygiene ملفات DB المتتبعة)، (11) حالة التحقق اليوم (كل شيء أخضر + E2E 490/0 معلق على browser leak)، (12) بوابات الإنتاج الخمس + المؤجلات عن قصد (soft-delete قرار تصميمي)، الخلاصة وتقييم بالمجالات (~85% جاهزية إنتاجية — الناقص إثبات تشغيل مو بناء)، ملحقان (خط البرومبتات الخمسة + أوامر التحقق)، وتنبيه أن العقل مصدر الحقيقة عند التعارض.
- **Facts verified قبل الكتابة**: 68 صفحة astro + 32 API = 100 مسار (المختبر 43+6=49)؛ lib 102 وحدة (33 lab)؛ scripts 79 ملف mjs و55 أمر (42 test)؛ ReportType = 8 مهام + 16 مختبر = 24؛ NotificationKind = 15 مهام + 17 مختبر = 32؛ AI = 6 + 9 = 15؛ e2e-acceptance يسجل 26 سويت؛ migrations 26 ملفًا؛ الجداول 49 (من سجل QC-FINAL-REGRESSION-AUDIT-001 بنفس اليوم بعد db:init على قاعدة طازجة)؛ `api/tasks/suggestions` = اقتراحات إسناد supervisor+ (`suggestTaskAssignees`)؛ الملف "تم لصق markdown.md" غير موجود في audit/qc اليوم (مذكور في التقرير القديم فقط).
- **Files**: `audit/qc/REPORT.md` (استبدال كامل — النسخة القديمة محفوظة في تاريخ git) + `.agents/mind/01-mind-latest.md` (هذا السجل).
- **Verification**: docs-only — قراءة وفحص مصادر فقط (find/grep على pages, lib, package.json, migrations, reporting/types, notifications, ai/features, api/ai/[feature], e2e-acceptance, audit/qc)؛ لا build/tests تلزم لأن لا كود تغيّر.
- **Notes**: لا commit ولا push — المستخدم يلتزم. رسالة مقترحة: `docs(qc): rewrite audit/qc/REPORT.md as current system description (v2.0) — Saudi-Arabic narrative, English-UI notice, code-verified numbers (100 routes / 49 tables / 26 migrations / 24 reports / 32 notification kinds / 15 AI features)`.
- **Status**: delivered — التقرير الجديد جاهز للمراجعة.

### 2026-08-23 — QC-FINAL-REGRESSION-AUDIT-001: تدقيق regression النهائي بعد Laboratory prompts 41–56 — unit/full test وbuild وmigration/seed خضراء، E2E acceptance الكامل BLOCKED بسبب browser handle leak في harness

- **Scope**: تحقق read-only من عدم كسر authentication، sessions، users، tasks/task updates، evidence، findings/CAPA، SLA، notifications، dashboard، exports، backup، audit integrity، AI، ومسارات Laboratory/state/RBAC/reports المطلوبة.
- **Verification (fresh)**: `pnpm install --frozen-lockfile` → **exit 0** (1322 packages، lockfile up-to-date، Prisma generate نجح)؛ `pnpm test` من root → **exit 0** (chat-session 16، CSRF 29، PII 38)؛ `pnpm typecheck` من root → **exit 0** (0 errors، 0 warnings، 20 hints)؛ `pnpm test` داخل `apps/qc-task-manager` → **exit 0**، كل السلسلة الخضراء وتشمل migrations، architecture، AI foundation/features/lab، domain/workflow/SLA، auth/db rules، lab prompts 41–56، audit، reports/exports، dashboard metrics وtrends؛ `NODE_ENV=production pnpm build` → **Complete**؛ post-install `pnpm db:init` على DB مؤقتة → schema **26**، **49 tables**، seed users 4، lab equipment **24**، `integrity_check=ok`، foreign-key violations **0**.
- **Migration paths**: `test:migrations` ضمن السلسلة → **exit 0** مع fresh database، existing legacy upgrade/data preservation، repeated/checksum، rollback/failure recovery/destructive guard؛ direct empty-db path مع `QC_SEED_LAB_EQUIPMENT=0` → schema 26 و0 equipment (opt-out fixture)، وfresh seed path → 24 equipment intact.
- **E2E**: elevated `pnpm e2e:acceptance` بدأ فعليًا ونجحت suites: admin-users **49/0**، auth-lockout **44/0**، task-shared **196/0**، delete-request **39/0**، dashboard **51/0**، a11y **14/0**، backup **13/0**، search **84/0** = **490 passed / 0 failed**. Runner لم يكمل findings وباقي 17 suite لأن `scripts/e2e-task-search.mjs` يطلق Playwright browser ولا يستدعي `browser.close()` في cleanup؛ العملية بقيت معلقة بعد طباعة 84/0 واضطررنا لإيقافها. أول تشغيل غير elevated لم ينفذ أي suite بسبب sandbox `listen EPERM` على 127.0.0.1:4500. لذلك **full e2e set = UNVERIFIED/BLOCKED، وليس PASS**.
- **Environment notes**: `pnpm install --frozen-lockfile --offline` فشل بعد إزالة وإعادة محاولة modules لأن `@astrojs/rss@4.0.19` غير موجود في offline store؛ أُعيد التثبيت online بنجاح. Root AI tests مرّت لكنها سجلت fallback/mock notices (غياب `DATABASE_URL` وGA4 no-op، وعدم إثبات provider live) — لا تُعامل كـ live AI/provider verification.
- **Status**: **NO-GO for acceptance criteria requiring full E2E 0 failed** بسبب harness blocker فقط؛ local unit/domain/build/migration/seed evidence ناجح. لا deploy، لا push، لا CI/CD تعديل، ولا code changes.

### 2026-08-23 — QC-LAB-AUDIT-CLEANUP-001: تدقيق شامل لتنفيذ المختبر (كل الفئات) + إصلاحات تنظيف موجهة لكود Laboratory فقط — صفر مس للوظائف القديمة

- **What**: تدقيق كامل لكل كود المختبر (`src/lib/lab/**`، `src/pages/lab/**`، `src/pages/api/lab/**`، `src/components/lab/**`) عبر 3 وكلاء فحص متوازيين على الفئات المطلوبة، ثم إصلاحات جراحية:
  1. **notify:daily typo**: `--experimental-strip-types/ scripts/...` (سلش زايدة كانت تكسر الأمر) → أُصلحت في `package.json`.
  2. **DUPLICATE_AUTHORITY (فشل guard قديم مؤرخ منذ QC-LAB-ENV-READINGS)**: `canEditLabTestDraft` نُقلت من `tests.ts:429` إلى `permissions.ts` (الوحدة الكنسية) مع استيرادها — **architecture-guard صار يعدّي** لأول مرة بعد أسابيع من الفشل الموثق.
  3. **ثغرة e-signature bypass**: `POST /api/lab/tests/[id]/void.ts` كان endpoint حيًّا غير مستخدم (صفر مراجع في src/scripts) يعمل VOID **بدلا** خطوة إعادة المصادقة المفروضة على المسار الصفحي — **حُذف** (كود مختبر غير ضروري وغير آمن).
  4. **كود ميت**: `statusFilterWhere` (equipmentStatus.ts، صفر استدعاءات)، `LAB_TREND_GRANULARITIES` (trends.ts)، `LAB_VIEW_TARGET_PATHS` (savedViews.ts) — كلها محذوفة بعد إثبات صفر مراجع.
  5. **تكرار DB logic**: نسخة `LATEST_DUE_SQL` المحلية الخاصة في tests.ts (مطابقة حرفية للثابت المُصدَّر في overview.ts) → حذفت واستُبدلت بالاستيراد.
  6. **فجوة عرض إشعارات**: `lab_repeat_failures` كان ناقصًا في KIND_ICON/KIND_LABEL/SECTION_ORDER بصفحة `/lab/notifications.astro` (مسجّل بالصفحة العامة فقط رغم أن سجل QC-LAB-REPEAT-FAIL-001 ادعى تحديث الاثنتين) → أُضيف 📉/'Lab repeated failures'/order 0.
  7. **اختبارات غير حتمية (flake حدود التاريخ/الوقت — القاعدة 8.3)**: (أ) test-lab-calibration فحص due=1 بتواريخ ثابتة (2026-08-20 صار OVERDUE) → حساب ديناميكي relative-to-today بنفس سابقة lab-overview؛ (ب) test-lab-calendar `utcTs/isoDay` خلط UTC/محلي → anchor على ظهر محلي؛ (ج) **e2e-task-search "C. created-date range" — الـ flake القديم الموثق انحل جذريًا**: `utcDaysAgo` كان يرسو على UTC noon فبين 00:00–03:00 محلي تنزاح أعمار fixtures يومًا كامل وتصطاد نافذة [-29,-21] fixture ثانيًا → أُرسيت على الظهر المحلي.
  8. **عدّاد تسريب من مهمة retention**: `test-dashboard-reports.mjs` قائمة `Object.keys(REPORT_CATALOG)` deepStrictEqual ناقصها `lab-retention-status` (كان يكسر السلسلة الكاملة) → أُضيف.
- **Findings موثقة بدون إصلاح (تحتاج قرار/نطاق مستقل)**: تكرار `escapeLike` ×9 بنفس الجسم؛ مكوّن ترقيم صفحات مكرر verbatim ×9 صفحات lab؛ allowlists الحالات/النتائج مكررة (testSearch/review/labReports)؛ خرائط KIND_ICON/KIND_LABEL مكررة بين الصفحتين وRecord<string,string> ضعيف في النسخة المختبرية؛ حدود أكواد غير متسقة (Equipment Code بـ LAB_SHORT_TEXT_MAX=200 بدل 60)؛ templateEditSchema `.passthrough()` (أضعع نمط)؛ savedViews INSERT/DELETE بلا audit pairing؛ حدود zod hardcoded (validation.ts:1025,437,790,808-820)؛ exceljs CJS interop boilerplate ×3؛ صفحات new.astro الثلاث (calibration/retests/equipment) بلا try/catch عزل؛ `e2e-lab-search.mjs` + `test-lab-search.mjs` يتيمان (غير مسجلين — الأول فيه فشل RBAC موثق عند HEAD والسويت الوحدانية test-lab-suggest تغطي نفس السلوك)؛ ملفا `qc_tasks.db`/`"qc_tasks 3.db"` فارغان متتبَّعان (hygiene سابق يحتاج قرار git rm من المستخدم). Dependencies كلها مستخدمة ومبررة (fontkit/qrcode-generator/exceljs/jsqr). لا formatter قياسي بالمشروع (astro check هو المعيار).
- **Verification**: `pnpm typecheck` → **0 errors / 0 warnings / 20 hints** ✅؛ `pnpm test` السلسلة الكاملة → **EXIT=0، صفر ❌ في اللوج** (شاملة architecture-guard بعد نقل canEditLabTestDraft، وlab-calibration 97/0 بعد التحويل الديناميكي، وdashboard-reports بعد إضافة retention-status) ✅؛ `NODE_ENV=production pnpm build` → Complete ✅؛ Prompt 44: مسح `find` = صفر ملفات " 2.*" ✅. **e2e:acceptance الكامل: UNVERIFIED بعد الإصلاح الأخير** — آخر تشغيل كامل توقف عند search 83/1 (قبل إصلاح utcDaysAgo)؛ suites الأولى كلها ALL PASS (admin-users 49، auth-lockout 44، task-shared 196، delete-request 39، dashboard 51، a11y 14، backup 13)؛ إعادة تشغيل search standalone بعد إصلاحها أُجهضت بأمر المستخدم قبل اكتمالها — لازم إعادة تشغيل e2e:acceptance كامل قبل اعتماد النتيجة.
- **Notes**: لا commit ولا push — المستخدم يلتزم. رسالة مقترحة: `chore(lab): audit cleanup — fix notify:daily script, move canEditLabTestDraft to permissions (guard green), remove unused void API bypassing e-signature + dead exports, dedupe LATEST_DUE_SQL, complete repeat-failure notification maps in /lab page, deterministic date anchors in calibration/calendar/task-search tests, restore retention report key in dashboard-reports assertions`.
- **Status**: delivered & verified محليًا (typecheck 0 + full unit chain EXIT=0 + prod build) — **e2e full chain UNVERIFIED** (بانتظار إعادة تشغيل).


### 2026-08-24 — PDPL-AI-SEARCH-CLUSTER-001: تحسين كتلة PDPL + AI لنية البحث المؤسسية العملية — نجاح محلي بدون commit/push/deploy

- **Scope**: تحسين محور `/docs/pdpl-ai-complete-guide/` وصفحة نية ChatGPT `/docs/pdpl-chatgpt-data-protection/` ومقال ChatGPT الداعم `/blog/chatgpt-pdpl-data-compliance/`؛ لا صفحات جديدة ولا dependencies ولا تغييرات في بنية المسارات.
- **Content**: أضيفت بطاقات سيناريوهات للمؤسسة (شكوى عميل، ملف موظف، RAG للعقود)، مسار بيانات مرئي من الموظف إلى الفحص والسياسة والنموذج والدليل، جدول آمن/غير آمن، وقائمة تشغيلية تشمل اكتشاف AI، تصنيف البيانات، الأدوات المسموحة، التنقيح/الحجب، التسجيل، الموافقات، الاحتفاظ، والأدلة. أضيفت روابط مباشرة إلى AI Firewall وAI Use Case Discovery/Shadow AI وAI Audit Trail ومنصة الحوكمة والتقييم.
- **Legal/content boundary**: فُصلت قراءة المتطلبات العامة عن إرشادات BrightAI التنفيذية مع تنبيه صريح أنها ليست نصًا نظاميًا أو ضمان امتثال. خُففت العبارات القطعية في مقال ChatGPT بشأن المخالفة المباشرة، مواقع خوادم المزود، التدريب الافتراضي، ووضع Enterprise؛ صارت مشروطة بالغرض والبيانات والمورد والعقد والإعدادات والمراجعة القانونية.
- **Official sources**: تم الاعتماد على صفحات سدايا/منصة حوكمة البيانات الرسمية لنظام حماية البيانات الشخصية، دليل جهات التحكم والمعالجة، واللائحة التنفيذية، مع إبقاء source panels وروابط gov.sa داخل الصفحات.
- **SEO/GEO**: تحديث `updated` إلى 2026-08-24، تحسين direct-answer headings، مسارات سؤال/جواب وسيناريوهات قابلة للاقتباس، وروابط داخلية من المحور إلى الأدوات والتقييم. الصفحات بقيت self-canonical/indexable.
- **Verification**: `git -c core.fsmonitor=false diff --check` = PASS؛ `node_modules/.bin/astro build` = Complete؛ HTML المبني لمحوري docs: H1=1 لكل صفحة، noindex=0، مصادر SDAIA موجودة، وروابط AI Firewall موجودة. بقيت تحذيرات route-collision وVite/Prisma القديمة غير الحاجزة كما هي. لا production/GSC verification.
- **Files**: `src/content/docs/pdpl-ai-complete-guide.md`, `src/content/docs/pdpl-chatgpt-data-protection.md`, `src/content/blog/chatgpt-pdpl-data-compliance.md`.
- **Status**: جاهز للمراجعة المحلية؛ لا commit ولا push ولا deploy.
## [2026-08-28] — QC-LAB-MANAGEMENT-UX-012: تخصيص الصفحة الرئيسية للمختبر ولوحة إدارة Manager/Admin

### تم التنفيذ
- أضفت ملخص إجراءات role-based دقيق في `/lab` مع ترتيب Employee/Supervisor/Manager/Admin وإبقاء مؤشرات الأداء التفصيلية أسفل كتلة الإجراءات.
- أنشأت `src/lib/lab/management.ts` و`/lab/management` بلوحة SSR للمدير/الأدمن فقط: approval/change queues، الانتظار فوق 24 ساعة، تغييرات مرفوضة، مخاطر المعايرة والمعدات، صحة المستندات، WI completion، FAIL/HOLD trends، retests، data quality، وسلامة سجل التدقيق.
- ربطت كل بطاقة بسجل حي بفلتر حقيقي، وأضافت فلترة `status` و`aging=24h` لطابور Change Requests وفلتر `attention=1` لسجل المعدات.
- شددت صلاحية لوحة الإدارة إلى Manager/Admin، وأضفت المسار إلى navigation والـ route manifest وغطاء E2E/RBAC.
- أصلحت affordances قائمة المعايرة والمستندات للـ proposal/new links حتى تتوافق مع صلاحيات المساهمين والمسارات الحية.
- أضفت اختبارات contract/query للوحة الإدارة وضمّنتها في manifest، وحدثت اختبارات permission/overview/UX/E2E ذات الصلة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/lab/index.astro`
- `apps/qc-task-manager/src/pages/lab/management.astro`
- `apps/qc-task-manager/src/lib/lab/{overview,management,changeRequests,equipment,navigation}.ts`
- `apps/qc-task-manager/src/lib/permissions.ts`
- `apps/qc-task-manager/src/pages/lab/{calibration,documents,change-requests}/index.astro`
- `apps/qc-task-manager/scripts/{test-lab-management,e2e-lab-nav,test-lab-overview,test-lab-ux-performance,test-manifest,test}.mjs`
- `apps/qc-task-manager/package.json`

### التحقق
- `pnpm test` ✅ — **55/55** سويت كاملة.
- `pnpm e2e:acceptance` ✅ — كل suites القبول نجحت، بما فيها `lab-nav 93/0`, `lab-calibration 32/0`, `lab-documents 85/0`.
- `pnpm typecheck` ✅ — 0 أخطاء؛ تحذيرات/هِنْتات قديمة فقط.
- `NODE_ENV=production pnpm build` ✅
- `pnpm test:ui-consistency`, `test:lab-ux-presentation`, `test:lab-ux-performance`, `test:badge-contrast`, `test:architecture` ✅

### النتيجة
- **الحالة:** نجح
- **مختصر:** الصفحة الرئيسية صارت تركز على الإجراء حسب الدور، ولوحة `/lab/management` صارت حقيقية ومحمية Manager/Admin ومتصلة بالسجلات المفلترة بدون بيانات وهمية أو مكتبات تحليل جديدة.

### ملاحظات / مشاكل مفتوحة
- توجد تحذيرات Astro/Vite وGit fsmonitor موجودة مسبقًا، وما منعت typecheck أو build أو الاختبارات.
- لم يحدث commit أو push أو deploy؛ الشجرة الحالية تحتوي كذلك تغييرات المستخدم السابقة وتم الحفاظ عليها.

---
## [2026-08-28] — QC-WORKFLOW-NOTIFICATIONS-014: سحب طلبات التغيير وتحسين موثوقية وفلاتر الإشعارات

### تم التنفيذ
- أضفت حالة `WITHDRAWN` عبر migration 038 متسلسلة، مع تحديث registry المضمّن و`db/schema.sql` والحفاظ على بيانات الطلبات والفهارس القائمة.
- أضفت `withdrawChangeRequest` بقيد مالك الطلب و`PENDING` داخل معاملة SQLite؛ لا يستدعي أي mutation كنسي، ويسجل `STATUS_TRANSITION` من `PENDING` إلى `WITHDRAWN`.
- أضفت endpoint POST للسحب محميًا بـ CSRF و`requireApiUser`، وأظهرت زر السحب للمالك فقط أثناء الانتظار؛ الحالات APPROVED/REJECTED/WITHDRAWN لا تقبل السحب، والعدادات المعلقة تستبعدها تلقائيًا.
- أضفت `createNotificationOrThrow` فوق جدول الإشعارات نفسه، واستخدمته لإشعارات طلب المراجعة والاعتماد والرفض لطلبات التغيير داخل نفس معاملات workflow؛ فشل الحفظ يلغي mutation، بدون ربط التسليم الخارجي بالمعاملة.
- أضفت فلاتر SSR لصفحة الإشعارات: All، Unread، Tasks، Tests، Documents، Change Requests، وCalibration / Equipment، مع allowlist وعدادات ورؤية مشتركة لحالة القراءة.
- أضفت اختبارات الملكية، الحالة النهائية، التدقيق، عدم mutation الكنسي، CSRF/API guards، الفلاتر، الرؤية والعدادات، وحدثت توقعات رقم migration إلى 38.

### الملفات المتأثرة
- `apps/qc-task-manager/db/migrations/038_lab_change_request_withdrawal.sql`
- `apps/qc-task-manager/src/lib/lab/changeRequests.ts`
- `apps/qc-task-manager/src/lib/notifications.ts`
- `apps/qc-task-manager/src/pages/api/lab/change-requests/[id]/withdraw.ts`
- `apps/qc-task-manager/src/pages/lab/change-requests/{index,[id]}.astro`
- `apps/qc-task-manager/src/pages/notifications.astro`
- `apps/qc-task-manager/src/lib/migrationRegistry.ts`
- `apps/qc-task-manager/scripts/test-lab-change-requests.mjs`
- `apps/qc-task-manager/scripts/test-lab-notifications.mjs`
- `apps/qc-task-manager/scripts/test-migrations.mjs`
- `apps/qc-task-manager/scripts/test-dashboard-reports.mjs`
- `apps/qc-task-manager/scripts/{test-db-doctor,test-production-operations,test-scheduled-notifications,test}.mjs`
- `docs/superpowers/plans/2026-08-28-qc-workflow-notifications-014.md`

### التحقق
- `pnpm test:lab-change-requests` ✅ — ناجح.
- `pnpm test:lab-notifications` ✅ — 107/0.
- `pnpm test:migrations` ✅ و`pnpm test:embedded-migration-parity` ✅ — 38/38 مطابق.
- `pnpm typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 26 hints قائمة.
- `pnpm test` ✅ — 56 canonical suites بدون فشل.
- `NODE_ENV=production pnpm build` ✅ — Complete.
- `pnpm test:route-manifest` و`pnpm test:manifest` ✅؛ `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** دورة طلب التغيير تدعم السحب الآمن للطلبات المعلقة فقط، وإشعارات workflow الحرجة تُحفظ ذريًا مع mutation، وصفحة الإشعارات توفر الفلاتر المطلوبة باستخدام النظام الحالي.

### ملاحظات / مشاكل مفتوحة
- لم يُنفّذ commit أو push أو deploy حسب الطلب.
- بقيت 26 hints قديمة في `astro check` بدون أخطاء حاجبة.
## [2026-08-28] — QC-PERFORMANCE-018: قياس أداء SQLite أحادي النسخة مبني على الدليل

### تم التنفيذ
- أضفت مولّد benchmark قابل للضبط ببروفايلين: `large` (10,000 مهمة، 5,000 اختبار، 60,000 عينة) و`ci` الأخف؛ وكل تشغيل ينشئ قاعدة SQLite مؤقتة جديدة ثم يحذفها، ولا يقرأ أو يكتب قاعدة الإنتاج.
- شملت البيانات المرافقة المعدات وسجل المعايرة والصيانة، المستندات وإصداراتها، طلبات التغيير، وأحداث التدقيق، مع تفعيل migrations الكنسية وفحص `integrity_check` و`foreign_key_check`.
- قست 11 سطحًا مطلوبًا: dashboard، employee tasks، task search، lab home/search، tests register، equipment، documents، change requests، audit، وreports؛ المخرجات تسجل p50/p95/max وعدد استعلامات كل سيناريو.
- أُنتجت مخرجات قابلة للمراجعة في `download/qa/qc-performance.json` و`download/qa/qc-performance.md`، وتضم `EXPLAIN QUERY PLAN` للثلاثة الأعلى p95 بدون وضع thresholds تنظيمية أو مصطنعة.
- لم أضف فهرسًا أو migration: التقرير كان الأعلى p95 بـ 4.639ms ويستخدم `idx_lab_tests_created_at`، وبحث المهام رغم `SCAN tasks` بقي p95=1.921ms على 10k مهمة؛ الدليل الحالي لا يبرر تغيير المخطط.

### الملفات المتأثرة
- `apps/qc-task-manager/scripts/run-performance.mjs`
- `apps/qc-task-manager/scripts/test-performance.mjs`
- `apps/qc-task-manager/{package.json,scripts/test-manifest.mjs}`
- `download/qa/{qc-performance.json,qc-performance.md}`

### التحقق
- `test-performance` ✅ — عقد CI: 11 سيناريو، مقاييس p50/p95/max، JSON/Markdown، وFK/integrity.
- `run-performance --profile=large --runs=9` ✅ — 10k مهمة / 5k اختبار / 60k عينة؛ `integrity_check=ok` و0 مخالفات FK.
- `test-migrations` ✅ و`test-embedded-migration-parity` ✅ — 38/38 migration متطابقة.
- `test-manifest-guard` ✅ — 60 suite canonical و28 E2E.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند QC benchmark محلي متكرر وآمن لنسخة SQLite واحدة، بمخرجات أدلة وخطط استعلام، بدون تحسين أو migration غير مبرر.

### ملاحظات / مشاكل مفتوحة
- لا توجد عتبات نجاح/فشل مفروضة؛ أي index لاحق يحتاج إعادة القياس وEXPLAIN evidence من نفس الأداة.
- ما صار commit أو push أو deploy.
## [2026-08-28] — QC-PILOT-UAT-019: تهيئة تطبيق QC لاختبار قبول الموظفين

### تم التنفيذ
- أضفت مكوّن مساعدة سياقية قابلًا لإعادة الاستخدام ومبنيًا على disclosure أصلي، بدون مكتبة tour أو JavaScript جديد.
- أضفت إرشادات قصيرة لأول تسجيل دخول وتغيير كلمة المرور، لوحة الدور، إنشاء اختبار المختبر، الفرق بين حفظ المسودة والإرسال للمراجعة، المراجعة/الاعتماد والتوقيع الإلكتروني، ودورة المستندات المضبوطة وطلبات التغيير.
- أنشأت Runbook تجريبيًا شاملًا للموظف والمشرف والمدير والأدمن، مع حقول جمع الأدلة الإلزامية لكل سيناريو.
- وثّقت تصنيف نتائج UAT إلى P0/P1/P2/P3 ومنعت الـRunbook صراحةً من تسجيل أي نتيجة قبل تنفيذ مشارك فعلي للسيناريو.
- وسّعت فحص UX presentation ليتحقق من ظهور المساعدات والـRunbook ومحتوى الأدوار والتصنيف.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/ContextualHelp.astro`
- `apps/qc-task-manager/src/pages/account/security.astro`
- `apps/qc-task-manager/src/pages/lab/{index,tests/new,tests/review,change-requests/new}.astro`
- `apps/qc-task-manager/src/components/lab/{LabTestForm.tsx,LabDocumentEditor.astro}`
- `apps/qc-task-manager/docs/PILOT-UAT.md`
- `apps/qc-task-manager/scripts/test-lab-ux-presentation.mjs`

### التحقق
- `node scripts/test-lab-ux-presentation.mjs` ✅ — 14/14 تحققًا، ومنها المساعدات والـRunbook.
- `node_modules/.bin/astro check` ✅ — 0 أخطاء و0 تحذيرات؛ 26 hint قديمة.
- `node_modules/.bin/astro build` ✅ — Complete؛ بقيت تحذيرات Vite المعروفة للاستيرادات الديناميكية.
- `git diff --check` ✅.
- `pnpm typecheck`/`pnpm build` لم يُشغّلا عبر pnpm: Corepack حاول الكتابة إلى cache خارج مساحة المشروع؛ استُخدمت أدوات Astro المحلية المكافئة بنجاح.

### النتيجة
- **الحالة:** نجح
- **مختصر:** التطبيق والـRunbook جاهزان لبدء UAT منظّم، لكن ما نُفّذ UAT بشري ولم تُسجّل أو تُستنتج أي نتائج قابلية استخدام.

### ملاحظات / مشاكل مفتوحة
- لا يوجد تنفيذ لمكتبة tour أو نظام feedback مستقل؛ جمع ملاحظات UAT يتم عبر حقول الـRunbook فقط.
- ما صار commit أو push أو deploy.
## [2026-08-28] — SKILLS-LOCK-REBUILD-027: إعادة بناء قفل المهارات وحراسة الانحراف

### تم التنفيذ
- أعدت توليد `skills-lock.json` بمسح مجلدات المهارات المباشرة واحتساب SHA-256 من محتوى `SKILL.md` الحالي، مع حذف الإدخالات الميتة وعدم اختراع مجلدات.
- رُفعت `90-day-seo-sprint` من التغليف المتداخل إلى `distribb-90-day-seo-sprint` كمهارة مباشرة مميزة، مع تحديث اسمها ورابطها من مهارة `distribb` بدون تغيير دلالي للمحتوى.
- استبدلت إحالات `stitch-design-taste` و`image-to-code` في `design-pipeline` بمهارات موجودة فعلًا: `design-md` و`frontend-design`.
- أضفت `scripts/qa/verify-skills-lock.mjs` بوضع تحقق افتراضي ووضع `--write` لإعادة التوليد؛ الحارس يتحقق من وجود `SKILL.md`، تطابق الاسم، المسار النسبي، وعدد الإدخالات والهاشات.
- حدّثت `AGENTS.md` و`CLAUDE.md` من الرقم القديم إلى العدد الفعلي بعد التسوية: 365 مهارة مباشرة.

### الملفات المتأثرة
- `skills-lock.json`
- `scripts/qa/verify-skills-lock.mjs`
- `.agents/skills/design-pipeline/SKILL.md`
- `.agents/skills/distribb/SKILL.md`
- `.agents/skills/distribb-90-day-seo-sprint/SKILL.md`
- `AGENTS.md`
- `CLAUDE.md`
- `package.json`

### الأرقام
- القفل: 175 مدخلًا قديمًا → **365 مدخلًا** مطابقًا لـ365 مجلد مهارة مباشر.
- التغليف: `distribb/90-day-seo-sprint` → `.agents/skills/distribb-90-day-seo-sprint`.

### التحقق
- `node scripts/qa/verify-skills-lock.mjs --write` ✅
- `node scripts/qa/verify-skills-lock.mjs` ✅ — 365 مجلدًا، 365 مدخلًا، الهاشات مطابقة.
- فحص عدد المجلدات مقابل الإدخالات ✅ — 365 = 365.
- فحص `stitch-design-taste|image-to-code` داخل `design-pipeline` ✅ — بلا نتائج.
- `git diff --check` ✅؛ تحذير `fsmonitor_ipc` بيئي فقط.
- لا build/tests مطلوبة — التغييرات محصورة في المهارات والتوثيق وحارس مستقل، بدون كود تطبيق.

### النتيجة
- **الحالة:** نجح
- **مختصر:** سجل المهارات صار كاملًا ومُعاد الإنتاج، والإحالات الميتة والتغليف الشاذ انحلت، مع حارس يمنع انحراف الهاش أو فقدان المجلدات مستقبلًا.

### ملاحظات / مشاكل مفتوحة
- لا يوجد ضمن نطاق المهمة. لم يحدث commit أو push.
## [2026-08-28] — QC-DASHBOARD-DATA-VIZ-001: تحويل Dashboard المدير إلى سطح قرارات

### تم التنفيذ
- رتبت صفحة `/dashboard` إلى أربع طبقات مرئية بالترتيب: `Action required` ثم `Today’s operations` ثم `Trends` ثم `Analysis / drilldowns`.
- أضفت أربع بطاقات إجراء للمتأخر، والمعلّق، والمهام بدون evidence، وurgent المفتوح؛ كل بطاقة تعرض العدد الحقيقي وتفتح drilldown مفلترًا أو register واضحًا.
- أبقيت كل مؤشرات KPI والرسوم والمختبر والـregisters الحالية، لكن صارت مؤشرات التشغيل تحت طبقة اليوم والتحليلات بعد طبقة الاتجاهات.
- نقلت ملخص AI إلى طبقة التحليل حتى ما ينافس العمل العاجل عند الدخول للصفحة.
- أضفت حراسة UI تمنع رجوع ترتيب الطبقات أو فقدان بطاقات الإجراء أو anchor navigation غير الصالح.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/dashboard.astro`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm run test:ui-consistency` ✅ — 188/188.
- `pnpm run test:dashboard-reports` ✅.
- `pnpm run test:responsive-e2e-contract` ✅.
- `pnpm run typecheck` ✅ — 0 errors، 0 warnings، 26 hints قديمة.
- `NODE_ENV=production pnpm run build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm test` ✅ — 64/64 canonical suites بدون فشل.
- `git diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار dashboard يقدّم العمل الذي يحتاج قرار قبل المؤشرات والتحليلات، مع بقاء البيانات والروابط والـdrilldowns الحالية بدون تغيير في منطق المجال.

### ملاحظات / مشاكل مفتوحة
- التحقق المتجاوب الآلي مرّ؛ فحص UAT اليدوي على أجهزة فعلية وVoiceOver ما زال مطلوبًا حسب السجلات السابقة.
- ما صار commit أو push أو deploy.
## [2026-08-28] — QC-UX-MEASUREMENT-001: إطلاق قياس UX تشغيلي يحافظ على الخصوصية

### تم التنفيذ
- أضفت وثائق تعريف المقاييس، تقرير الأثر، وخطة usability test؛ وثبّتُّ أن baseline يُجمع 14 يومًا قبل أي ادعاء بتحسن.
- أضفت migration `039_ux_events.sql` وجدول UX منفصلًا عن audit/observability، مع actor role وoutcome ومدة محدودة وmetadata allowlist فقط.
- أضفت endpoint محميًا بـ CSRF وRBAC، وbrowser collector للأحداث الآمنة عبر `page_view` وlab/dashboard/search/review، بدون payloads أو كلمات بحث أو أرقام سجلات حساسة.
- ربطت الأحداث بالـ dashboard وsearch وlab form وreview، وأضفت أحداث نجاح/فشل خادمية لا تغيّر قواعد العمل أو workflows أو RBAC.
- طبقت retention تلقائيًا لمدة 90 يومًا، وحدّثت schema/registry واختبارات migration الحالية من الإصدار 38 إلى 39.
- أضفت contract test يمنع الأحداث غير المسموحة والبيانات الحساسة، وربطته بالـ test manifest.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/UX-MEASUREMENT.md`
- `apps/qc-task-manager/docs/UX-USABILITY-TEST-PLAN.md`
- `apps/qc-task-manager/db/migrations/039_ux_events.sql`
- `apps/qc-task-manager/src/lib/uxTelemetry.ts`
- `apps/qc-task-manager/src/pages/api/ux/events.ts`
- `apps/qc-task-manager/public/scripts/ux-telemetry.js`
- `apps/qc-task-manager/src/layouts/BaseLayout.astro`
- `apps/qc-task-manager/src/pages/{dashboard,search}.astro`
- `apps/qc-task-manager/src/{lib/lab/tests.ts,pages/api/lab/tests/[id]/review.ts}`
- `apps/qc-task-manager/{db/schema.sql,src/lib/db.ts,src/lib/migrationRegistry.ts}`
- `apps/qc-task-manager/scripts/test-ux-telemetry.mjs`

### التحقق
- `pnpm test` ✅ — 65 canonical suites، 0 failures.
- `pnpm run test:ux-telemetry` ✅.
- `pnpm run test:embedded-migration-parity` ✅ — 39/39 byte-identical.
- `pnpm run test:schema-reference` ✅ — 165 objects.
- `pnpm run test:manifest` ✅ — 65 canonical suites و28 E2E.
- `pnpm run typecheck` ✅ — 0 errors؛ ظهرت 27 hints غير مانعة، بينها Astro hint معروف للسكريبت الخارجي.
- `NODE_ENV=production pnpm run build` ✅ — اكتمل؛ بقيت تحذيرات Vite الديناميكية المعروفة فقط.
- `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** صار عند QC Task Manager قياس UX تشغيلي قليل البيانات، منفصل عن audit، وجاهز لجمع baseline قبل تقييم أي تدخل تصميمي؛ schema ارتفع من 38 إلى 39 وجدول قاعدة البيانات من 51 إلى 52.

### ملاحظات / مشاكل مفتوحة
- baseline الفعلي ما انقاس بعد؛ لازم تشغيل القياس 14 يومًا قبل تقرير أثر تصميمي.
- UAT البشري على أجهزة فعلية وفحص VoiceOver ما زال مطلوبًا حسب السجلات السابقة.
- ما صار commit أو push؛ وتغييرات المستخدم السابقة في `01-mind-latest.md` و`test-ui-consistency.mjs` محفوظة.
## [2026-08-28] — QC-A11Y-ERGONOMICS-002: توحيد دلالات تنقل disclosure وإدارة تركيز حوارات الحذف

### تم التنفيذ
- حوّلت القائمتين المنسدلتين في `Navbar` من `role="menu"`/`menuitem` مع trapping ناقص إلى disclosure panels native بروابط HTML عادية ومسار Tab طبيعي.
- أبقيت Escape يغلق قائمة الجوال وMore والإشعارات ويرجع التركيز إلى زر الفتح عند الحاجة، وأزلت `aria-haspopup` غير المناسب لنمط disclosure.
- رفعت أهداف اللمس للأيقونات وروابط اللوحات والإجراءات المهمة إلى حد `min-h-11`/`min-w-11` (44px تقريبًا)، مع تسمية زر الجوال حسب الحالة: Open/Close navigation.
- أضفت إدارة تركيز لحوارات طلب/مراجعة الحذف: التركيز يدخل للحقل أو زر التأكيد، ويرجع لزر الفتح بعد الإغلاق، بدون تغيير endpoint أو workflow.
- ربطت عدادات الأحرف في حقول الأسباب بـ`aria-describedby` وبنص مفهوم لقارئ الشاشة.
- أضفت regression guards تمنع رجوع hybrid menu semantics وتثبت عقد hit-area والتسمية الحالية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/Navbar.tsx`
- `apps/qc-task-manager/src/components/DeleteRequestDialog.tsx`
- `apps/qc-task-manager/src/components/ReviewDeleteRequestDialog.tsx`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `pnpm --filter @brightai/qc-task-manager typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 27 hints قديمة.
- `pnpm --filter @brightai/qc-task-manager test:ui-consistency` ✅ — 192/192.
- `pnpm --filter @brightai/qc-task-manager test:interaction-feedback` ✅ — 25/25.
- `pnpm --filter @brightai/qc-task-manager test:responsive-e2e-contract` ✅.
- `pnpm --filter @brightai/qc-task-manager test:lab-ux-presentation` ✅ — 14/14.
- `NODE_ENV=production pnpm --filter @brightai/qc-task-manager build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط.
- `pnpm --filter @brightai/qc-task-manager test` ✅ — 65 canonical suites.
- `e2e:acceptance` وفحص يدوي 320px/200%/VoiceOver/UAT فعلي: لم تُشغّل هذه المهمة.
- `git diff --check` ✅؛ لا commit أو push.

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** تحسنت دلالات التنقل، hit areas، وإدارة التركيز في الحوارات بدون المساس بقواعد المجال أو RBAC أو CSRF. التحقق الآلي كامل، أما التحقق البشري وE2E الحي فباقيان مطلوبين.

### ملاحظات / مشاكل مفتوحة
- ما زالت بعض raw form controls في الصفحات تستخدم وصفات focus قديمة خارج نطاق هذه الدفعة؛ الترحيل يحتاج route-sized workstream لاحق.
- بقيت التغييرات غير المتعلقة الموجودة مسبقًا في الشجرة كما هي، ومنها `download/seo/` غير المتتبع.
## [2026-08-28] — QC-A11Y-ERGONOMICS-002: توحيد دلالات تنقل disclosure وإدارة تركيز حوارات الحذف

### تم التنفيذ
- حوّلت قوائم `Navbar` من `role="menu"`/`menuitem` مع trapping ناقص إلى disclosure panels native بروابط HTML عادية ومسار Tab طبيعي.
- أبقيت Escape وإدارة التركيز في قائمة الجوال وMore والإشعارات، وأزلت `aria-haspopup` غير المناسب لنمط disclosure.
- رفعت أهداف اللمس للأيقونات والإجراءات المهمة إلى 44px تقريبًا، وجعلت تسمية زر الجوال تعكس Open/Close navigation.
- أضفت إدارة تركيز لحوارات طلب/مراجعة الحذف، وربطت عدادات الأحرف بـ`aria-describedby`.
- أضفت regression guards تمنع رجوع hybrid menu semantics وتثبت عقد hit-area والتسمية.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/Navbar.tsx`
- `apps/qc-task-manager/src/components/DeleteRequestDialog.tsx`
- `apps/qc-task-manager/src/components/ReviewDeleteRequestDialog.tsx`
- `apps/qc-task-manager/scripts/test-ui-consistency.mjs`

### التحقق
- `typecheck` ✅ — 0 أخطاء، 0 تحذيرات، 27 hints قديمة.
- `test:ui-consistency` ✅ — 192/192؛ `test:interaction-feedback` ✅ — 25/25.
- `test:responsive-e2e-contract` ✅؛ `test:lab-ux-presentation` ✅ — 14/14.
- `NODE_ENV=production build` ✅؛ `pnpm test` ✅ — 65 canonical suites.
- `e2e:acceptance` وفحص 320px/200%/VoiceOver/UAT فعلي: لم تُشغّل.
- `git diff --check` ✅؛ لا commit أو push.

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** تحسنت دلالات التنقل، hit areas، وإدارة التركيز بدون المساس بقواعد المجال أو RBAC أو CSRF؛ التحقق البشري وE2E الحي باقيان.

### ملاحظات / مشاكل مفتوحة
- بعض raw form controls ما زالت تستخدم وصفات focus قديمة خارج نطاق هذه الدفعة.
## [2026-08-28] — QC-SERVICE-DESIGN-HANDOFF-001: توحيد سياق التسليم بين رحلات QC

### تم التنفيذ
- أنشأت `WorkflowContext.astro` كمكوّن SSR مشترك يعرض المرحلة الحالية، المالك، الدور المسؤول التالي، العائق، الإجراء التالي المصرّح به، والروابط ذات العلاقة.
- ربطت السياق بصفحات تفاصيل اختبار المختبر، المعدّة، المستند المضبوط، وFinding، باستخدام loaders والعلاقات الحالية فقط.
- أضفت روابط مباشرة آمنة للاختبار ← المعدّة/المنتج/Finding، المعدّة ← الاختبارات/المستندات/الصيانة، المستند ← المعدّات، وFinding ← المهمة/CAPA أو RCA.
- أضفت `SERVICE-BLUEPRINT.md` يوثق current → target لكل من test lifecycle وFinding → CAPA → Evidence وEquipment → Calibration → Maintenance وControlled Document lifecycle.
- حافظت على RBAC والـworkflow وقواعد التدقيق والإشعارات والمخطط؛ اللوحة لا تغيّر الحالة ولا تنشئ علاقة أو رابطًا لبيانات غير موجودة.

### الملفات المتأثرة
- `apps/qc-task-manager/src/components/ui/WorkflowContext.astro`
- `apps/qc-task-manager/src/pages/lab/tests/[id].astro`
- `apps/qc-task-manager/src/pages/lab/equipment/[id].astro`
- `apps/qc-task-manager/src/pages/lab/documents/[id].astro`
- `apps/qc-task-manager/src/pages/findings/[id].astro`
- `apps/qc-task-manager/docs/SERVICE-BLUEPRINT.md`

### التحقق
- `git -c core.fsmonitor=false diff --check` ✅
- `test:ui-consistency` ✅ — 192/192
- `test:status-semantics` ✅
- `astro check` ✅ — 0 errors / 0 warnings / 27 hints قائمة مسبقًا
- `NODE_ENV=production astro build` ✅ — Complete؛ تحذيرات Vite الديناميكية المعروفة فقط
- `test-lab-tests` ✅ — 258/0
- `test-lab-equipment` ✅
- `test-lab-documents` ✅ — 303/0
- `test-qc-operations` ✅
- `test-manifest` ✅ — 65 canonical suites و28 E2E

### النتيجة
- **الحالة:** نجح
- **مختصر:** صارت صفحات التفاصيل تعطي أقل سياق لازم لاستكمال العمل بأمان عبر المسارات، مع بقاء كل قرارات المجال والصلاحيات والتدقيق في طبقاتها الأصلية.

### ملاحظات / مشاكل مفتوحة
- يلزم UAT بشري وVoiceOver واختبار tree testing للتأكد من أن تسميات الأدوار والخطوات التالية مفهومة لفرق QC.
- ما صار commit أو push أو deploy.
## [2026-08-28] — إعادة بناء بحث الكلمات السعودية لـBRIGHTAI وتجهيز DataForSEO

### تم التنفيذ
- حللت الصفحات الأساسية محليًا: الرئيسية، `about`, `services`, `solutions`, صفحات الحلول، `trust`, `contact`, `blog`, `pricing`, وتقييم جاهزية حوكمة AI.
- ثبّتُّ محاور البحث حسب المحتوى الفعلي: حوكمة AI، AI Firewall، PDPL، NCA ECC، SDAIA، ISO 42001، التدقيق، الموافقة البشرية، الأدلة، والقطاعات السعودية.
- أزلت محتوى ملف الكلمات السابق وأعدت إنشاء CSV من الصفر بـ48 فرصة: 40 أولوية `1` و41 كلمة `long_tail`، مع ربط كل كلمة بصفحة هدف.
- أضفت أعمدة اللغة والموقع ومصدر القياس وحالة DataForSEO وملاحظات SERP وطريقة السيطرة، وفصلت التقدير الاستراتيجي عن القياسات الفعلية.
- لم أختلق `monthly_searches_sa` أو `competition` أو `cpc_sar`: بقيت `pending_credentials` لأن أداة DataForSEO غير قابلة للاستدعاء في الجلسة ولا توجد اعتمادات في البيئة.

### الملفات المتأثرة
- `audit/brightai-sa-keyword-research.csv`
- `.agents/mind/01-mind-latest.md`

### التحقق
- فحص CSV ✅ — 48 صف بيانات، 16 عمودًا، وصفر صفوف بعرض غير صحيح.
- حالات DataForSEO ✅ — كل الصفوف `pending_credentials` بدون أرقام مختلقة.
- فحص المسارات ✅ — كل `target_url` مبني على النطاق المعتمد `https://brightai.live`.
- `git diff --check` — لم يُشغّل بعد هذا السجل.
- DataForSEO API ⚠️ — لم يُنفّذ؛ خادم MCP موجود في `.codex/config.toml` لكن الموصل غير ظاهر في الجلسة والاعتمادات غير موجودة.

### النتيجة
- **الحالة:** جزئي
- **مختصر:** تحليل الصفحات وملف CSV الاستراتيجي جاهزان، أما ترتيب أعلى الكلمات بأرقام البحث السعودية الفعلية فينتظر إعادة تشغيل جلسة MCP مع اعتماد DataForSEO.

### ملاحظات / مشاكل مفتوحة
- لا يوجد رقم موثوق حاليًا لأعلى حجم بحث؛ الأولوية الحالية مبنية على ملاءمة الأعمال ووضوح النية وفجوة المحتوى، وليست بديلًا عن قياس DataForSEO.
- لم يحدث commit أو push أو deploy.
## [2026-08-28] — QC-FINAL-DESIGN-QA-GOVERNANCE-001: تدقيق التصميم النهائي وحوكمة منع الانحراف

### تم التنفيذ
- راجعت النظام كاملًا على محاور design system وUI/UX/IA والتفاعل والنسخ والنماذج والـ data visualisation والوصولية والإرجونومكس والحركة والأمان والاستجابة وسلامة نطاق QC.
- وثّقت النتيجة في `apps/qc-task-manager/docs/FINAL-DESIGN-QA-GOVERNANCE.md` كـ conditional pass هندسي، مع فصل واضح بين أدلة الاختبارات وبين UX البشري غير المنفذ.
- أصلحت assertion قديمًا في `e2e-task-shared.mjs` وassertions قديمة في `e2e-a11y.mjs` لتطابق سلوك native disclosure المقصود لقائمة الإشعارات.
- أصلحت selector قديمًا في `e2e-lab-tests.mjs` بعد ظهور رابط الـ finding مرتين بشكل صحيح في واجهة التفاصيل، وصار الاختبار يحدد الرابط exact.
- ثبّتُّ قواعد حوكمة مستقبلية تمنع raw status/button drift، وتلزم reduced-motion، وتحافظ على RBAC ومسارات QC اليدوية والمعلومات التشغيلية.

### الملفات المتأثرة
- `apps/qc-task-manager/docs/FINAL-DESIGN-QA-GOVERNANCE.md`
- `apps/qc-task-manager/scripts/e2e-task-shared.mjs`
- `apps/qc-task-manager/scripts/e2e-a11y.mjs`
- `apps/qc-task-manager/scripts/e2e-lab-tests.mjs`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test` ✅ — 65/65 canonical suites.
- `pnpm --dir apps/qc-task-manager run typecheck` ✅ — 0 errors و0 warnings.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` ✅ — تحذيرات Vite المعروفة فقط بخصوص dynamic imports.
- UI consistency ✅ — 192/192؛ manifest ✅ — 65 canonical و28 E2E؛ architecture ✅؛ badge contrast ✅؛ responsive contract ✅؛ lab presentation ✅ — 14/14؛ lab performance ✅ — 9/9.
- `pnpm --dir apps/qc-task-manager run e2e:acceptance` ✅ — 30/30 suites، 3,047+ assertions، responsive 648/0، وrestart persistence ناجح.
- security hygiene ✅ بعد تعطيل استعلام Git fsmonitor المعطوب محليًا؛ `git -c core.fsmonitor=false diff --check` ✅.

### النتيجة
- **الحالة:** جزئي / conditional pass
- **مختصر:** كل الـ engineering gates المتاحة وacceptance صارت خضراء، لكن ما زال اعتماد design system غير مكتمل في بعض detail/admin routes، وما فيه دليل UX بشري فعلي بعد.

### ملاحظات / مشاكل مفتوحة
- مطلوب UAT حسب الدور، VoiceOver، keyboard review بشري، اختبار 320px و200% zoom فعلي، وأجهزة حقيقية مع 4G قبل إعلان human UX sign-off.
- بقيت raw presentation styles/status maps في `findings/[id]` وبعض صفحات lab/admin كدين تصميمي P1.
- تحذيرات Vite الخاصة بـ `db.ts` و`validation.ts` مو فشل build لكنها تحتاج متابعة أداء مستقلة.
- ما صار commit أو push أو deploy.
## [2026-08-28] — محاولة ربط وتشغيل DataForSEO MCP بالاعتماد المرسل

### تم التنفيذ
- تحققت من إعداد `.codex/config.toml`: خادم `dataforseo-mcp-server@latest` مربوط أصلًا ويقرأ `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD` من البيئة فقط؛ ما خزّنت أي اعتماد في المشروع.
- حاولت تشغيل الحزمة الرسمية عبر `npx` في كاش مؤقت معزول، وتجاوزت تعارض كاش npm المحلي؛ الحزمة نزلت لكن جلسة stdio لم تُرجع MCP handshake.
- اختبرت endpoint الرسمي لـDataForSEO ببيانات API المرسلة كتحقق احتياطي، بدون طباعة أو حفظ بيانات الدخول.
- نتيجة الاعتماد الأول: HTTP `403`. نتيجة الاعتماد البديل: DataForSEO `40100` — الاعتماد غير مخول للوصول إلى API.
- أوقفت جلسة MCP التجريبية ونظفت الكاش المؤقت؛ لم أعدّل CSV أو أرقام الكلمات لأن القياس الفعلي غير متاح.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- إعداد MCP موجود وصيغته سليمة ✅.
- حزمة `dataforseo-mcp-server@latest` قابلة للتنزيل ✅.
- MCP stdio handshake ⚠️ — لم يُرجع استجابة.
- DataForSEO API ⚠️ — مرفوض: HTTP `403` و`40100`.
- لم تُخزّن الأسرار ولم يتغير ملف CSV ✅.

### النتيجة
- **الحالة:** جزئي / محجوب باعتماد DataForSEO
- **مختصر:** الموصل مربوط محليًا، لكن لا يمكن تشغيل بحث الكلمات حتى يُفعّل API access أو تُرسل بيانات API صحيحة من صفحة الوصول الرسمية.

### ملاحظات / مشاكل مفتوحة
- لا تعيد إرسال كلمات المرور هنا. فعّل أو أعد توليد API credentials من `app.dataforseo.com/api-access` ثم أعد تشغيل Codex بمتغيرات البيئة `DATAFORSEO_LOGIN` و`DATAFORSEO_PASSWORD`.
- بما أن بيانات الدخول ظهرت في المحادثة، يُنصح بتدويرها بعد التأكد من الحساب.
- لم يحدث commit أو push.
## [2026-08-28] — إعادة اختبار DataForSEO بصيغة Basic Base64

### تم التنفيذ
- أعدت اختبار DataForSEO باستخدام ترويسة `Authorization: Basic` بالقيمة التي زود بها المستخدم، بدون تخزين أو عرض بيانات الاعتماد.
- أرسلت طلبًا فعليًا إلى `google_ads/search_volume/live` لخمس كلمات أولية للسوق السعودي.
- تغيّرت نتيجة التحقق من رفض الاعتماد السابق إلى `40104`: الحساب يحتاج توثيقًا قبل استخدام API.
- لم أعبّئ أرقام CSV لأن API لم يرجع نتائج كلمات فعلية.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- تنسيق Base64/Basic ✅ — وصل الطلب إلى DataForSEO.
- DataForSEO API ⚠️ — `40104: Please verify your account before using the API`.
- لم تُخزّن الأسرار ولم يتغير CSV ✅.

### النتيجة
- **الحالة:** محجوب بتوثيق الحساب
- **مختصر:** بيانات API صارت تُقرأ بصيغة صحيحة، لكن DataForSEO يمنع البحث حتى يكتمل توثيق الحساب من لوحة المستخدم.

### ملاحظات / مشاكل مفتوحة
- أكمل التوثيق من `https://app.dataforseo.com/` ثم أعد تشغيل Codex؛ بعدها يمكن تشغيل MCP وملء أحجام البحث والمنافسة وCPC الفعلية.
- يُنصح بتدوير بيانات الاعتماد بعد ظهورها في المحادثة.
- لم يحدث commit أو push.
## [2026-08-28] — إعادة محاولة بحث DataForSEO بعد طلب المستخدم

### تم التنفيذ
- قرأت `01-mind-latest.md` كاملًا قبل المحاولة.
- أعدت إرسال طلب اختبار فعلي إلى `google_ads/search_volume/live` لخمس كلمات BRIGHTAI في السعودية باستخدام Basic Base64.
- لم أعدّل CSV ولم أستخدم أرقامًا تقديرية بدل بيانات DataForSEO.

### الملفات المتأثرة
- `.agents/mind/01-mind-latest.md`

### التحقق
- `git diff --check` ✅.
- DataForSEO API ⚠️ — ما زال يرجع `40104: Please verify your account before using the API`.
- لم تُخزّن الأسرار ولم يتغير CSV ✅.

### النتيجة
- **الحالة:** محجوب
- **مختصر:** الحساب لم يكتمل توثيقه بعد؛ لا يمكن تشغيل بحث الكلمات أو تعبئة المقاييس حتى يتم التوثيق من لوحة DataForSEO.

### ملاحظات / مشاكل مفتوحة
- يلزم إكمال التوثيق من `https://app.dataforseo.com/` ثم إعادة المحاولة.
- لم يحدث commit أو push.
## [2026-08-28] — SEO-PHASE-1-TRUTH-CLAIMS: توثيق حقيقة BRIGHT AI وحدود الادعاءات

### تم التنفيذ
- أنشأت brief للمرحلة الأولى يستند إلى مصادر المشروع المحلية وremote GitHub فقط، وثبّتُّ `brightai.live` كنطاق وBrightAI كعلامة ظاهرة، بدون ادعاء تحقق خارجي.
- صغت نموذج العمل كمنصة/خدمة B2B/B2G لحوكمة وأمان AI مع فصل صريح بين الجاهزية التشغيلية وبين الاستشارة القانونية أو الشهادة أو موافقة المنظّم أو ضمان النتيجة.
- أنشأت claims matrix يغطي الهوية، السوق، الخدمات، AI Firewall، الامتثال، العنوان، الأسعار، الشهادات، التقييمات، الشراكات، والتحويلات؛ كل ما لا يملك دليل مالك/خارجي بقي `pending` أو `prohibited`.
- سجّلت أن `N/A` للتحويل لا يثبت أن CTAs الحالية مسار leads حقيقي؛ يلزم تحديد الوجهة والمالك والخصوصية والاستجابة قبل أي ادعاء تشغيلي.
- لم أبحث كلمات أو SERP أو منافسين، ولم أكتب محتوى تسويقي أو ألمس كود الموقع أو schema القائم.

### الملفات المتأثرة
- `docs/00-project-brief.md`
- `docs/claims-matrix.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- قراءة محلية لـ`README.md` و`astro.config.mjs` و`public/llms.txt` و`public/schema-saudi-seo.json` و`src/pages/index.astro` ✅.
- تحقق remote GitHub: `https://github.com/YEEEAE/BRIGHTAI.git` ✅.
- لم يُشغّل build أو اختبارات: التغيير توثيقي ولا يلمس كود التنفيذ.

### النتيجة
- **الحالة:** نجح جزئيًا
- **مختصر:** حدود الادعاءات صارت موثقة وجاهزة لاعتماد المالك، لكن حقائق الكيان والعنوان والخدمات التجارية والتحويل ما زالت تحتاج أدلة وقرارات من المالك قبل الانتقال للبحث.

### ملاحظات / مشاكل مفتوحة
- توجد حقول `LocalBusiness` وسعر وعنوان وساعات ومؤسس في schema الحالي لا يمكن اعتبارها موثقة بهذه المرحلة؛ لم أعدّلها لأن النطاق توثيق فقط.
- تغييرات المستخدم الموجودة مسبقًا في ملف العقل و`audit/website-builder-SEO/Siteic.docx` بقيت كما هي.
- لم يحدث commit أو push أو deploy.
## [2026-08-28] — SEO-PHASE-1-LOCATION: نقل وثائق المرحلة إلى حزمة website-builder-SEO

### تم التنفيذ
- نقلت وثيقتي حقيقة النشاط ومصفوفة الادعاءات للمرحلة الأولى إلى مجلد الحزمة الذي حدده المستخدم.
- لم يتغير أي محتوى أو قرار أو كود؛ تغيّر المسار فقط.

### الملفات المتأثرة
- `audit/website-builder-SEO/00-project-brief.md`
- `audit/website-builder-SEO/claims-matrix.md`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `git -c core.fsmonitor=false diff --check` ✅.
- تأكدت أن الملفات لم تعد موجودة في `docs/` وأن النسخ موجودة داخل `audit/website-builder-SEO/` ✅.

### النتيجة
- **الحالة:** نجح
- **مختصر:** كل وثائق المرحلة الأولى صارت بجانب حزمة `website-builder-SEO` حسب الطلب.

### ملاحظات / مشاكل مفتوحة
- لا commit أو push أو deploy.
## [2026-08-28] — QC-RENDER-HEALTH-FIRST-DEPLOY-001: فك حلقة فشل health check الأولى

### تم التنفيذ
- شخّصت سجل Render: الخدمة فتحت المنفذ `10000` لكن `/api/health` أعاد `503` باستمرار، لذا كان فشل النشر من readiness التطبيق لا من port binding.
- حوّلت `/api/health` إلى liveness probe خفيف يرجع `200` بمجرد عمل Astro SSR، حتى لا يمنع Render أول طلب يهيّئ SQLite على القرص الدائم.
- أضفت `/api/readiness` كـ probe منفصل وصارم يتحقق من وجود SQLite، الهجرات، و`schema_migrations`؛ ويبقي `503` عند عدم جاهزية القاعدة بدون كشف أسرار أو مسارات.
- سمحت للمسارين العامّين في middleware وحراس الأمان، وحدّثت عقد النشر ووثائق التشغيل لفصل liveness عن database readiness.
- تحققت محليًا بقاعدة جديدة غير مهيأة: `/api/health` = `200` و`/api/readiness` = `503`، وهو السلوك المطلوب قبل أول login.

### الملفات المتأثرة
- `apps/qc-task-manager/src/pages/api/health.ts`
- `apps/qc-task-manager/src/pages/api/readiness.ts`
- `apps/qc-task-manager/src/middleware.ts`
- `apps/qc-task-manager/{docs/DEPLOYMENT.md,docs/DATABASE.md,scripts/verify-security-hygiene.mjs,scripts/test-request-security.mjs,scripts/test-deployment-contract.mjs}`
- `.agents/mind/01-mind-latest.md`

### التحقق
- `pnpm --dir apps/qc-task-manager run test:deployment-contract` ✅ — 22 checks.
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` ✅.
- `pnpm --dir apps/qc-task-manager run test:request-security` ✅ — 56/56.
- `pnpm --dir apps/qc-task-manager run typecheck` ✅ — 0 errors، 0 warnings، 27 hints قديمة.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` ✅ — تحذيرات Vite الديناميكية المعروفة فقط.
- فحص HTTP محلي بقاعدة SQLite جديدة ✅ — health `200`، readiness `503` قبل initialization.

### النتيجة
- **الحالة:** نجح محليًا.
- **مختصر:** إعادة النشر لن تتعطل بسبب غياب ملف SQLite في أول إقلاع؛ يلزم إبقاء القرص الدائم ومتغيرات مساراته مضبوطة، ثم التحقق من `/api/readiness` بعد أول login.

### ملاحظات / مشاكل مفتوحة
- لم يحدث commit أو push أو deploy.
- تغييرات المستخدم السابقة في ملف العقل وملفات `audit/website-builder-SEO/` بقيت كما هي.
