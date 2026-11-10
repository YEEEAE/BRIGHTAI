# مصفوفة المتطلبات والأدلة

عدد المتطلبات: 76. الأوزان: 5 أمان/سلامة/إطلاق، 3 وظيفة أو اعتماد، 2 تجربة/اكتشاف. NOT_VERIFIED يمنح صفر تشغيل، ولا يعني أن الوظيفة مستحيلة.

S: 1 تحقق المعيار المحدد حاليًا؛ 0.5 تنفيذ قُرئ ولم يثبت قبولُه؛ 0.25 ملفات/وثيقة دون مسار مكتمل؛ 0 غياب دليل. R: تشغيل فعلي للمعيار نفسه (1/0)، — غير منطبق. A: اعتماد مستقل مثبت (1/0)، — غير مطلوب لهذا المعيار. حالة BLOCKED تحتفظ بمستوى المصدر في achieved_level.

النقاط الكلية لكل صف = weight × (S + R المنطبق + A المنطبق). المقام = weight × عدد المراحل المنطبقة. الجاهزية Q = أصغر قيمة للمراحل المنطبقة؛ لا تعوّض نقاط المصدر فشل التشغيل/الموافقة. هذه مصفوفة تدقيق أولية وليست عقد متطلبات موقعًا ولا نسبة كل كود ممكن.

| ID | الوحدة والمعيار | W | S | R | A | المكتسب/الممكن | الحالة/المستوى |
|---|---|---:|---:|---:|---:|---:|---|
| AR01 | Architecture: بناء Astro standalone من المصدر الحالي | 3 | 1 | — | — | 3/3 | IMPLEMENTED / IMPLEMENTED |
| AR02 | Architecture: اختبارات العقود الحالية كلها ناجحة | 5 | 0.5 | — | — | 2.5/5 | SOURCE_PRESENT / SOURCE_PRESENT |
| AR03 | Architecture: تكامل المنتجات بقاعدة معزولة PostgreSQL 18 | 5 | 0.25 | 0 | — | 1.25/10 | BLOCKED / SOURCE_PRESENT |
| AR04 | Architecture: تقييم ثغرات الاعتماديات على lockfile الحالي | 3 | 0.25 | 0 | — | 0.75/6 | BLOCKED / SOURCE_PRESENT |
| OP01 | Operations: خدمة Node SSR فعلية ومسارات البوابة متاحة | 5 | 1 | 0 | 0 | 5/15 | BLOCKED / IMPLEMENTED |
| OP02 | Operations: تتبع service→deploy→SHA للنسخة المنشورة | 3 | 1 | 1 | — | 6/6 | RUNTIME_VERIFIED / RUNTIME_VERIFIED |
| OP03 | Operations: AIGAS_APP_ENABLED محدد ومثبت في التشغيل المستهدف | 5 | 1 | 0 | 0 | 5/15 | BLOCKED / IMPLEMENTED |
| OP04 | Operations: ترويسات حماية وكاش خاص من edge و Node | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| OP05 | Operations: مراقبة readiness و rollback إلى إصدار صالح | 3 | 0.25 | 0 | 0 | 0.75/9 | BLOCKED / SOURCE_PRESENT |
| DB01 | Database: Staging منفصل اصطناعي بحماية production | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| DB02 | Database: نسخ واستعادة مع RPO/RTO مقاسين | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| DB03 | Database: Migration ledger و parity موثقان للمصدر | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| DB04 | Database: Runtime role محدود NOBYPASSRLS دون ملكية | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| DB05 | Database: سياسات وعزل مؤسستين لكل CRUD | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| DB06 | Database: Data API/grants/functions أقل صلاحية | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| DB07 | Database: محتوى المحادثة للمشارك فقط بما فيه المدير | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| AU01 | Auth/Kernel: تسجيل/دخول/استعادة جلسة Neon Auth حقيقية | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| AU02 | Auth/Kernel: صلاحيات المؤسسة من هوية موثقة فقط | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| AU03 | Auth/Kernel: Bootstrap أول مؤسسة بمسار مشغل محدود | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| AU04 | Auth/Kernel: دعوة وربط وقبول وإلغاء بلا تصعيد | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| AU05 | Auth/Kernel: إدارة أعضاء وآخر مالك وإبطال الصلاحية | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| AU06 | Auth/Kernel: سياسة Enterprise→Department→Product→User | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| AU07 | Auth/Kernel: فصل entitlement عن أمان Kernel وعن الشراء | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| FW01 | Firewall: إنشاء/تعديل قواعد حقيقية محدودة ومؤرخة | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| FW02 | Firewall: قرارات ALLOW DENY REDACT WARN ESCALATE الفعلية | 5 | 1 | 0 | — | 5/10 | BLOCKED / IMPLEMENTED |
| FW03 | Firewall: قرار محفوظ وأثر مرتبط دون نص حساس | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| FW04 | Firewall: تصعيد ينشئ طلب Human Gate مربوطًا حقيقيًا | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| FW05 | Firewall: تنفيذ محلي صادق أو مزود خارجي معتمد | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| FW06 | Firewall: حصص وفشل آمن عند القاعدة/المزود غير المهيأ | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| LD01 | Ledger: إضافة حدث دائم ب tenant وتسلسل و idempotency | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| LD02 | Ledger: فحص hash وتسلسل وتمثيل حالات السلامة | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| LD03 | Ledger: سجل وتفاصيل وتسلسل زمني ضمن الصلاحيات | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| LD04 | Ledger: تصدير دليل وفحص مستقل offline | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| LD05 | Ledger: بيان حدود الإثبات والاحتفاظ دون ادعاء مطلق | 3 | 0.5 | 0 | 0 | 1.5/9 | BLOCKED / SOURCE_PRESENT |
| HG01 | Human Gate: طلب موافقة دائم وتعيين مراجع مخول | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| HG02 | Human Gate: فصل مهام وقرار قبول/رفض بسبب موثق | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| HG03 | Human Gate: تنفيذ أثر داخلي مصرح مرة واحدة داخل transaction | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| HG04 | Human Gate: إلغاء/تفويض/انتهاء ينعكس من الخادم | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| HG05 | Human Gate: أحداث تدقيق مرتبطة مع رفض التنفيذ غير المخول | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| RE01 | Risk Engine: أصل اصطناعي ب version وسجل مراجعات | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| RE02 | Risk Engine: احتمالية وأثر ومنهج مصرح بإصداره | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| RE03 | Risk Engine: إجراءات معالجة وخطر متبق محسوب | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| RE04 | Risk Engine: قبول خطر بصلاحية ومراجعة مستقلة عند اللزوم | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| RE05 | Risk Engine: تصدير سجل فعلي محدود بلا ادعاء امتثال | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| SC01 | Secure Chat: جلسة ومحادثة ورسائل عبر خادم حقيقي | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| SC02 | Secure Chat: مزود/نموذج معتمدان ورد AI فعلي | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| SC03 | Secure Chat: Kernel و Firewall قبل كل إرسال | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| SC04 | Secure Chat: حصص مستخدم ومؤسسة وتوكنات تحت التزامن | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| SC05 | Secure Chat: ملكية المحادثة وإلغاء وفشل وإخفاء سجلات | 5 | 0.5 | 0 | — | 2.5/10 | BLOCKED / SOURCE_PRESENT |
| TR01 | Trial: مسار صفحة المنتج→تجربة→دخول يحفظ المنتج | 3 | 0.25 | 0 | — | 0.75/6 | BLOCKED / SOURCE_PRESENT |
| TR02 | Trial: طلب وأهلية واعتماد وتفعيل مشغل محدد | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| TR03 | Trial: 48 ساعة من تفعيلالخادم وحصص وصلاحيات محددة | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| TR04 | Trial: تصدير وإغلاق وحذف اصطناعي قابل للتنفيذ | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| TR05 | Trial: لا بطاقة أو تحويل مدفوع أو تجديد تلقائي | 5 | 1 | — | — | 5/5 | IMPLEMENTED / IMPLEMENTED |
| TR06 | Trial: إثبات قيمة من عملياتحقيقية ثم طلباشتراك | 3 | 0.5 | 0 | 0 | 1.5/9 | BLOCKED / SOURCE_PRESENT |
| PR01 | Privacy/Provider: اعتماد provider/model/region/no-training/DPA | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| PR02 | Privacy/Provider: أسرار محلية غيرمتتبعة وصلاحية ملفمقيدة | 5 | 1 | — | — | 5/5 | IMPLEMENTED / IMPLEMENTED |
| PR03 | Privacy/Provider: سياسة خصوصية وكيان واحتفاظ واستجابةحوادث | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| PR04 | Privacy/Provider: منع تسرب query/referrer فيكل التحليلات | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| MO01 | Monitoring: Sentry مخصص ومعتمد مع release/environment | 3 | 0.5 | 0 | 0 | 1.5/9 | BLOCKED / SOURCE_PRESENT |
| MO02 | Monitoring: PostHog أحداث رحلة التجربة بقائمةسماح | 3 | 0.5 | 0 | 0 | 1.5/9 | BLOCKED / SOURCE_PRESENT |
| MO03 | Monitoring: أخطاء Auth/DB/AI/المنتجات الخمسة وتنبيه/oncall | 5 | 0.5 | 0 | 0 | 2.5/15 | BLOCKED / SOURCE_PRESENT |
| UI01 | UI/UX: الواجهةالعامة RTL بعناوين واضحة | 2 | 1 | 1 | — | 4/4 | RUNTIME_VERIFIED / RUNTIME_VERIFIED |
| UI02 | UI/UX: الجوال 360/390/768/1440 دونقصوتداخل | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| UI03 | UI/UX: لوحةمفاتيح وتركيز وتباين وقارئشاشة | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| UI04 | UI/UX: Loading/empty/error/success من API حقيقي | 3 | 0.5 | 0 | — | 1.5/6 | BLOCKED / SOURCE_PRESENT |
| UI05 | UI/UX: Motion مخفض وأداء مقاس دونمساس Constellation | 2 | 0.5 | 0 | — | 1.0/4 | BLOCKED / SOURCE_PRESENT |
| SE01 | SEO: 55 صفحة indexable200 و canonical متطابق | 3 | 1 | 1 | — | 6/6 | RUNTIME_VERIFIED / RUNTIME_VERIFIED |
| SE02 | SEO: Titles/description/H1/alt/JSON-LD syntactic | 2 | 1 | 1 | — | 4/4 | RUNTIME_VERIFIED / RUNTIME_VERIFIED |
| SE03 | SEO: robots و llms وخريطة وروابطداخليةصالحة | 2 | 1 | 1 | — | 4/4 | RUNTIME_VERIFIED / RUNTIME_VERIFIED |
| SE04 | SEO: تحويل HTML aliases علىالنسخةالحية | 3 | 1 | 0 | — | 3/6 | BLOCKED / IMPLEMENTED |
| SE05 | SEO: ظهورسعودي و SearchConsole/GBP/روابط موثقة | 3 | 0.25 | 0 | 0 | 0.75/9 | BLOCKED / SOURCE_PRESENT |
| SE06 | SEO: CWV ميداني/مختبري وصحة schema دلالية | 3 | 0.25 | 0 | — | 0.75/6 | BLOCKED / SOURCE_PRESENT |
| CO01 | Commercial: عرض وسعر وعقد ودعم/SLA معتمد | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| CO02 | Commercial: UAT مستقل لخمسةمنتجات وعزل/استعادة | 5 | 0.25 | 0 | 0 | 1.25/15 | BLOCKED / SOURCE_PRESENT |
| CO03 | Commercial: On-prem/Air-gapped بعقد وتشغيلمحلي مستقل | 3 | 0.25 | 0 | 0 | 0.75/9 | BLOCKED / SOURCE_PRESENT |

## AR01 — بناء Astro standalone من المصدر الحالي
- الدليل: `package.json; astro.config.mjs; build.log`.
- سبب النقاط/النقص: تحذيرات قراءة request.headers أثناء prerender..
- الاعتماديات: —.
- معيار الإغلاق: بناء قابل للتكرار بنفس lockfile مع توثيق التحذيرات..

## AR02 — اختبارات العقود الحالية كلها ناجحة
- الدليل: `tests.tap:18 PASS/9 FAIL/5 SKIP`.
- سبب النقاط/النقص: تسع حالات فاشلة؛ لا test script في manifest..
- الاعتماديات: —.
- معيار الإغلاق: حسم العقود ثم نجاح الاختبارات دون تخفيف الضوابط..

## AR03 — تكامل المنتجات بقاعدة معزولة PostgreSQL 18
- الدليل: `tests/*-db.test.mjs; tests.tap`.
- سبب النقاط/النقص: خمسة اختبارات DB متجاوزة؛ لا اتصال اختبار معزول..
- الاعتماديات: DB01.
- معيار الإغلاق: تشغيل الخمسة على PostgreSQL18 معزولة قابلة للإتلاف..

## AR04 — تقييم ثغرات الاعتماديات على lockfile الحالي
- الدليل: `package-lock.json; dependencies.txt`.
- سبب النقاط/النقص: لا تقييم ثغرات أو تراخيص اعتماديات في الجولة..
- الاعتماديات: —.
- معيار الإغلاق: تقرير advisories وتقييم قابلية الاستغلال وإغلاق المخاطر العالية..

## OP01 — خدمة Node SSR فعلية ومسارات البوابة متاحة
- الدليل: `scripts/server.mjs; render.yaml; live-evidence.json; local-http.json`.
- سبب النقاط/النقص: خدمة Render ثابتة؛ app تعيد404..
- الاعتماديات: AR01 DB01.
- معيار الإغلاق: خدمة Node Staging مصرح بها تعيد API JSON قبل cutover مستقل..

## OP02 — تتبع service→deploy→SHA للنسخة المنشورة
- الدليل: `live-evidence.json:dep-dbpg8kgae00c73easjr0`.
- سبب النقاط/النقص: SHA مثبت؛ digest لم يتوفر..
- الاعتماديات: —.
- معيار الإغلاق: حفظ deploy وSHA وdigest إن أمكن، مع اختبار أصل Node منفصل..

## OP03 — AIGAS_APP_ENABLED محدد ومثبت في التشغيل المستهدف
- الدليل: `kernel/env.mjs; render.yaml; local-http.json`.
- سبب النقاط/النقص: العلم false مثبت محليًا فقط؛ القيمة الحية غير معروفة..
- الاعتماديات: OP01.
- معيار الإغلاق: توثيق إعداد runtime ومراجعة الوصول قبل فتح البوابة..

## OP04 — ترويسات حماية وكاش خاص من edge و Node
- الدليل: `src/middleware.ts; local-http.json; live-evidence.json`.
- سبب النقاط/النقص: CSP/HSTS غائبتان في العينة؛ static يتجاوز middleware..
- الاعتماديات: OP01.
- معيار الإغلاق: حماية GET/HEAD والأخطاء وإثبات no-store/noindex للخاص..

## OP05 — مراقبة readiness و rollback إلى إصدار صالح
- الدليل: `render.yaml; docs/APP-PORTAL-RUNTIME-HANDOFF.md`.
- سبب النقاط/النقص: فحص Render هو الصفحة الرئيسية فقط؛ لا تمرين رجوع..
- الاعتماديات: OP01 DB02.
- معيار الإغلاق: تعطل DB/Auth يغلق readiness، مع رجوع لإصدار صالح موثق..

## DB01 — Staging منفصل اصطناعي بحماية production
- الدليل: `live-evidence.json:فرعproduction الوحيد protected=false`.
- سبب النقاط/النقص: فرع production وحيد وغير محمي؛ لا Staging معتمد..
- الاعتماديات: —.
- معيار الإغلاق: بيئة معزولة ومفاتيح مستقلة وحماية دون مساس بالإنتاج..

## DB02 — نسخ واستعادة مع RPO/RTO مقاسين
- الدليل: `additional-evidence.json:snapshots=[];schedule=[];retention21600`.
- سبب النقاط/النقص: نافذة6 ساعات لا تثبت الاستعادة؛ لا تمرين..
- الاعتماديات: DB01.
- معيار الإغلاق: استعادة لهدف منفصل ومقارنة السلامة وقياس الوقت واعتماد المالك..

## DB03 — Migration ledger و parity موثقان للمصدر
- الدليل: `migrations/0001–0027; migration-catalog.json`.
- سبب النقاط/النقص: لا migration ledger، وكائنات مطلوبة مفقودة..
- الاعتماديات: DB01 DB02.
- معيار الإغلاق: Baseline كتالوج وhash لكل migration وتمرين قبل الإنتاج..

## DB04 — Runtime role محدود NOBYPASSRLS دون ملكية
- الدليل: `kernel/db.mjs; migrations/0025*; live-evidence.json`.
- سبب النقاط/النقص: runtime role غائب؛ فحص posture لا يتحقق من ملكية الجداول..
- الاعتماديات: DB03.
- معيار الإغلاق: دور معتمد دون ملكية أو BYPASSRLS وفحص جميع مسارات scope..

## DB05 — سياسات وعزل مؤسستين لكل CRUD
- الدليل: `migrations/0025*; docs/TENANT-ISOLATION-VERIFICATION.md`.
- سبب النقاط/النقص: RLS مفعلة لكن السياسات اثنتان؛ لا تجربة A/B..
- الاعتماديات: DB04 AU02.
- معيار الإغلاق: اختبارات CRUD لمؤسستين وهوية بلا عضوية وتبديل selector/GUC..

## DB06 — Data API/grants/functions أقل صلاحية
- الدليل: `migrations/0018*,0025*,0027*; live-evidence.json`.
- سبب النقاط/النقص: Data API نشطة ومنح authenticated واسعة؛ ليس إثبات تسريب..
- الاعتماديات: DB03.
- معيار الإغلاق: تقييد معتمد ورفض فعلي لأدوار authenticated/anonymous والدوال..

## DB07 — محتوى المحادثة للمشارك فقط بما فيه المدير
- الدليل: `migrations/0027*; secure-chat/service.mjs`.
- سبب النقاط/النقص: سياسة participant-only غير مثبتة حيًا..
- الاعتماديات: DB04 SC01.
- معيار الإغلاق: مستخدم آخر ومالك غير مشارك لا يقرآن محتوى المحادثة..

## AU01 — تسجيل/دخول/استعادة جلسة Neon Auth حقيقية
- الدليل: `kernel/auth.mjs; src/pages/auth/sign-up.astro; local-http.json`.
- سبب النقاط/النقص: sign-up حي404؛ أعداد مستخدمي وجلسات Auth صفر..
- الاعتماديات: OP01 DB01.
- معيار الإغلاق: حسابان اصطناعيان وجلسات وانتهاء وإبطال دون إضعاف JWT..

## AU02 — صلاحيات المؤسسة من هوية موثقة فقط
- الدليل: `kernel/auth.mjs:verifyIdentity; kernel/service.mjs:tenantGuard; tests.tap`.
- سبب النقاط/النقص: اختبار الهوية يستخدم sub غير UUID؛ لا إثبات runtime..
- الاعتماديات: AU01 DB04.
- معيار الإغلاق: اختبار التوقيع وissuer وexpiry وUUID وغياب العضوية وtenant مزور..

## AU03 — Bootstrap أول مؤسسة بمسار مشغل محدود
- الدليل: `kernel/service.mjs:createWorkspace`.
- سبب النقاط/النقص: لا قناة مشغل مكتملة لأول مؤسسة تحت RLS..
- الاعتماديات: DB04 AU01.
- معيار الإغلاق: مشغل محدود ينشئ مؤسسة ومالكًا واحدًا دون self-grant..

## AU04 — دعوة وربط وقبول وإلغاء بلا تصعيد
- الدليل: `kernel/administration.mjs:invitationState/manageInvitation`.
- سبب النقاط/النقص: قبول الدعوة تحت RLS يحتاج bootstrap؛ لا تشغيل..
- الاعتماديات: AU03 DB04.
- معيار الإغلاق: دعوة مطابقة للهوية مع إلغاء وreplay ورفض مؤسسة أخرى..

## AU05 — إدارة أعضاء وآخر مالك وإبطال الصلاحية
- الدليل: `kernel/administration.mjs:manageMember`.
- سبب النقاط/النقص: منطق إدارة الأعضاء موجود دون اختبار سباقات..
- الاعتماديات: AU02.
- معيار الإغلاق: التزامن يحفظ آخر مالك وسحب العضوية يمنع الوصول فورًا..

## AU06 — سياسة Enterprise→Department→Product→User
- الدليل: `kernel/policies.mjs; migrations/0010*,0020*`.
- سبب النقاط/النقص: نشر السياسات واعتمادها في البيئة لم يثبتا..
- الاعتماديات: AU02 DB03.
- معيار الإغلاق: سياسة عليا لا يمكن تخفيفها ونسخ وتواريخ وموافقات منفصلة..

## AU07 — فصل entitlement عن أمان Kernel وعن الشراء
- الدليل: `kernel/access.mjs; kernel/trial.mjs`.
- سبب النقاط/النقص: لا مؤسسة أو استحقاق مفعل مثبت..
- الاعتماديات: AU06 TR02.
- معيار الإغلاق: اختبار الإداري والتجربة والانتهاء والسحب دون تعطيل أمان Kernel الأساسي..

## FW01 — إنشاء/تعديل قواعد حقيقية محدودة ومؤرخة
- الدليل: `firewall/service.mjs; pages/app/api/firewall/rules.ts`.
- سبب النقاط/النقص: لا عملية API وحفظ وقراءة لاحقة مثبتة..
- الاعتماديات: DB03 AU07.
- معيار الإغلاق: إنشاء وتعديل وreadback لنسخ القواعد، ورفض MEMBER وتعارض النسخ..

## FW02 — قرارات ALLOW DENY REDACT WARN ESCALATE الفعلية
- الدليل: `firewall/core.mjs; firewall-harness.log:8/8`.
- سبب النقاط/النقص: المحرك مثبت محليًا فقط؛ لا API/DB حية..
- الاعتماديات: FW01.
- معيار الإغلاق: HTTP لكل حالة بسبب وقاعدة ونسخة؛ الحجب لا يصل إلى provider..

## FW03 — قرار محفوظ وأثر مرتبط دون نص حساس
- الدليل: `firewall/binding.mjs; firewall/service.mjs; ledger/writer.mjs`.
- سبب النقاط/النقص: ترابط البيانات والتراجع لم يثبتا على DB..
- الاعتماديات: FW01 LD01.
- معيار الإغلاق: قراءة لاحقة وربط fingerprint/tenant/policy وفشل audit موثق..

## FW04 — تصعيد ينشئ طلب Human Gate مربوطًا حقيقيًا
- الدليل: `firewall/escalation.mjs:approvedReviewIntegrations=[]`.
- سبب النقاط/النقص: Registry المراجعة فارغة؛ التصعيد يتوقف بأمان..
- الاعتماديات: HG01 AU06.
- معيار الإغلاق: عقد عملية وربط معتمد ثم طلب PENDING ورفض replay..

## FW05 — تنفيذ محلي صادق أو مزود خارجي معتمد
- الدليل: `firewall/provider.mjs:approvedProviders=[]; local-adapter.mjs`.
- سبب النقاط/النقص: لا مزود خارجي معتمد؛ sandbox ليس AI خارجيًا..
- الاعتماديات: FW02 PR01.
- معيار الإغلاق: اعتماد المقصد والمنطقة والعقد ثم طلب ورد فعليان، أو تسمية التنفيذ محليًا..

## FW06 — حصص وفشل آمن عند القاعدة/المزود غير المهيأ
- الدليل: `firewall/core.mjs; guard.mjs; tests.tap`.
- سبب النقاط/النقص: Guard محلي ناجح؛ حصص DB غير مثبتة..
- الاعتماديات: FW01.
- معيار الإغلاق: اختبار حد60/60 ثانية وحد25 قاعدة وtimeouts ومنع التجاوز..

## LD01 — إضافة حدث دائم ب tenant وتسلسل و idempotency
- الدليل: `ledger/writer.mjs:pg_advisory_xact_lock`.
- سبب النقاط/النقص: اختبار canonical يفشل؛ chain trigger مفقود حيًا..
- الاعتماديات: DB03 AU07.
- معيار الإغلاق: إنشاء وقراءة وتكرار وتعارض وتزامن دون fork..

## LD02 — فحص hash وتسلسل وتمثيل حالات السلامة
- الدليل: `ledger/core.mjs; ledger/service.mjs; tests.tap`.
- سبب النقاط/النقص: Fixture يعطي Invalid chain؛ لا تحقق DB..
- الاعتماديات: LD01.
- معيار الإغلاق: تغيير كل حقل وحذف وترتيب يعطي حالة صادقة لا VERIFIED كاذبة..

## LD03 — سجل وتفاصيل وتسلسل زمني ضمن الصلاحيات
- الدليل: `pages/app/ledger/index.astro; ledger/service.mjs`.
- سبب النقاط/النقص: الصفحة الحية404؛ لا جلسة..
- الاعتماديات: LD01.
- معيار الإغلاق: قائمة وتفاصيل مع pagination ورفض مؤسسة أخرى..

## LD04 — تصدير دليل وفحص مستقل offline
- الدليل: `public/downloads/aigas-ledger-verifier.mjs; ledger/service.mjs`.
- سبب النقاط/النقص: لا bundle حقيقي جديد تحقق بعملية مستقلة..
- الاعتماديات: LD02.
- معيار الإغلاق: تصدير من DB وتشغيل verifier منفصل ثم إثبات فشل tamper..

## LD05 — بيان حدود الإثبات والاحتفاظ دون ادعاء مطلق
- الدليل: `ledger/service.mjs:limitations; core.mjs`.
- سبب النقاط/النقص: لا توقيع خارجي أو anchor أو سياسة احتفاظ معتمدة..
- الاعتماديات: LD04 TR04.
- معيار الإغلاق: عرض حدود prefix بصدق واعتماد الاحتفاظ دون ادعاء Legal Hold..

## HG01 — طلب موافقة دائم وتعيين مراجع مخول
- الدليل: `human-gate/service.mjs; migrations/0014*`.
- سبب النقاط/النقص: جداول التفويض والتصاريح غائبة حيًا..
- الاعتماديات: DB03 AU07.
- معيار الإغلاق: طلب محفوظ PENDING بمراجع صحيح وسياق ونسخة ومهلة..

## HG02 — فصل مهام وقرار قبول/رفض بسبب موثق
- الدليل: `human-gate/core.mjs; service.mjs; tests.tap`.
- سبب النقاط/النقص: اختبار SoD يفشل؛ لا قبول فعلي مثبت..
- الاعتماديات: HG01.
- معيار الإغلاق: طالب ومراجع منفصلان ورفض self-review وسحب المراجع أثناء الطلب..

## HG03 — تنفيذ أثر داخلي مصرح مرة واحدة داخل transaction
- الدليل: `human-gate/service.mjs:KERNEL_WORKSPACE_RENAME/CONSUMED`.
- سبب النقاط/النقص: منطق الأثر الداخلي موجود دون اختبار DB أو تزامن..
- الاعتماديات: HG02.
- معيار الإغلاق: Rename فعلي وpermit واحد؛ التكرار والانتهاء والفشل لا يتركون أثرًا..

## HG04 — إلغاء/تفويض/انتهاء ينعكس من الخادم
- الدليل: `human-gate/service.mjs; migrations/0014*`.
- سبب النقاط/النقص: Schema غير مطابق والتشغيل404..
- الاعتماديات: HG01.
- معيار الإغلاق: حالات إلغاء وانتهاء وتغير السياسة أو الهدف تظهر من الخادم..

## HG05 — أحداث تدقيق مرتبطة مع رفض التنفيذ غير المخول
- الدليل: `human-gate/service.mjs:record; ledger/writer.mjs`.
- سبب النقاط/النقص: أعمدة audit وجداول grants المطلوبة غائبة..
- الاعتماديات: HG03 LD01.
- معيار الإغلاق: رفض MEMBER وoutsider وتراجع الأثر عند فشل الدليل الإلزامي..

## RE01 — أصل اصطناعي ب version وسجل مراجعات
- الدليل: `risk-engine/service.mjs; pages/app/api/risk-engine/assets/`.
- سبب النقاط/النقص: Fixture متعارض؛ لا عملية دائمة مثبتة..
- الاعتماديات: DB03 AU07.
- معيار الإغلاق: إنشاء وتعديل وتاريخ ورفض تعديل revision قديمة..

## RE02 — احتمالية وأثر ومنهج مصرح بإصداره
- الدليل: `risk-engine/core.mjs:METHOD; service.mjs`.
- سبب النقاط/النقص: اعتماد منهج البيئة غير مثبت؛ ليس اعتماد ISO..
- الاعتماديات: RE01.
- معيار الإغلاق: اعتماد مسودة التجربة واختبار جميع خلايا المصفوفة والحدود..

## RE03 — إجراءات معالجة وخطر متبق محسوب
- الدليل: `migrations/0026*; risk-engine/service.mjs`.
- سبب النقاط/النقص: حقول residual الرقمية غير موجودة حيًا..
- الاعتماديات: RE02 DB03.
- معيار الإغلاق: حفظ likelihood/impact/score وreadback وإعادة التقييم عند اللزوم..

## RE04 — قبول خطر بصلاحية ومراجعة مستقلة عند اللزوم
- الدليل: `risk-engine/core.mjs:acceptanceDecision; service.mjs`.
- سبب النقاط/النقص: تطبيق0026 واعتماد سياسة القبول غير مثبتين..
- الاعتماديات: RE03 AU06.
- معيار الإغلاق: رفض المقيّم عند اشتراط مالك مستقل وقبول مؤرخ خاضع للمراجعة..

## RE05 — تصدير سجل فعلي محدود بلا ادعاء امتثال
- الدليل: `risk-engine/service.mjs:export; pages/app/api/risk-engine/export.ts`.
- سبب النقاط/النقص: لا سجل حي صدر فعليًا في الجولة..
- الاعتماديات: RE03.
- معيار الإغلاق: ملف من DB يطابق أحدث النسخ والعدد ويرفض مؤسسة أخرى..

## SC01 — جلسة ومحادثة ورسائل عبر خادم حقيقي
- الدليل: `secure-chat/service.mjs; pages/app/api/secure-chat/messages.ts`.
- سبب النقاط/النقص: app كلها404؛ لا حسابات حية..
- الاعتماديات: DB03 AU07.
- معيار الإغلاق: جلسة وإرسال وقراءة حقيقية دون mock في دليل runtime..

## SC02 — مزود/نموذج معتمدان ورد AI فعلي
- الدليل: `secure-chat/models.mjs:APPROVED_MODELS=[]; adapter.mjs`.
- سبب النقاط/النقص: لا نموذج معتمد؛ المفاتيح القديمة لا تعتمد مزودًا..
- الاعتماديات: PR01 SC01.
- معيار الإغلاق: قرار نموذج ومنطقة وصلاحية ثم رد وusage حقيقيان بعد الإذن..

## SC03 — Kernel و Firewall قبل كل إرسال
- الدليل: `secure-chat/policy.mjs; service.mjs`.
- سبب النقاط/النقص: مسار السياسات قبل egress لم يثبت مع مزود..
- الاعتماديات: SC02 AU06.
- معيار الإغلاق: منع أو تنقيح اصطناعي قبل الشبكة مع دليل الطلب الواصل المصرح..

## SC04 — حصص مستخدم ومؤسسة وتوكنات تحت التزامن
- الدليل: `migrations/0016*; secure-chat/requests.mjs`.
- سبب النقاط/النقص: دالة usage_window_v2 لم تظهر في كتالوج الدوال..
- الاعتماديات: DB03 SC02.
- معيار الإغلاق: حجز وتسوية وtimeout وتزامن دون double charge أو bypass..

## SC05 — ملكية المحادثة وإلغاء وفشل وإخفاء سجلات
- الدليل: `secure-chat/service.mjs; requests.mjs; models.mjs`.
- سبب النقاط/النقص: اختبارات محدودة تمر؛ العزل الحي غير مثبت..
- الاعتماديات: DB07 SC02.
- معيار الإغلاق: A/B ومالك غير مشارك وإلغاء وحصة وفشل مزود دون content logs..

## TR01 — مسار صفحة المنتج→تجربة→دخول يحفظ المنتج
- الدليل: `pages/products/[product].astro; livebrowser CTA=[]`.
- سبب النقاط/النقص: عينة Firewall لا تعرض زر تجربة؛ app404..
- الاعتماديات: OP01 AU01.
- معيار الإغلاق: CTA إضافي دون تغيير الهيرو، وreturnTo من قائمة سماح للمنتج..

## TR02 — طلب وأهلية واعتماد وتفعيل مشغل محدد
- الدليل: `kernel/trial.mjs; migrations/0023*; kernel/index.astro`.
- سبب النقاط/النقص: قراءة الحالة موجودة؛ لا مسار طلب وتفعيل مشغل مثبت..
- الاعتماديات: AU03 DB03.
- معيار الإغلاق: API طلب وقناة مشغل مستقلة وتفعيل بعد readiness دون self-grant..

## TR03 — 48 ساعة من تفعيلالخادم وحصص وصلاحيات محددة
- الدليل: `kernel/trial.mjs:172800; trialProductAccess`.
- سبب النقاط/النقص: المدة عقد هدف؛ الحصص الشاملة غير معتمدة..
- الاعتماديات: TR02.
- معيار الإغلاق: اعتماد النطاق وانتهاء خادمي يمنع الكتابة والإرسال بعد المهلة..

## TR04 — تصدير وإغلاق وحذف اصطناعي قابل للتنفيذ
- الدليل: `kernel/trial.mjs:exit.deletionPolicy=PENDING_APPROVAL`.
- سبب النقاط/النقص: لا purge معتمد ومنفذ؛ retentionPeriod غير محدد..
- الاعتماديات: TR03 DB02.
- معيار الإغلاق: سياسة حفظ وdry-run وحذف محدود بتفويض ودليل دون كسر Ledger..

## TR05 — لا بطاقة أو تحويل مدفوع أو تجديد تلقائي
- الدليل: `kernel/trial.mjs:commercialDefaults; kernel/index.astro`.
- سبب النقاط/النقص: العقد يغلق billing؛ لا دورة شراء مكتملة..
- الاعتماديات: —.
- معيار الإغلاق: الإبقاء على منع التحويل والخصم والتجديد التلقائي..

## TR06 — إثبات قيمة من عملياتحقيقية ثم طلباشتراك
- الدليل: `kernel/trial.mjs:buildPovReport; src/pages/contact.astro`.
- سبب النقاط/النقص: PoV مسودة والتواصل mailto لا يؤكد الاستلام..
- الاعتماديات: TR02 FW01 LD01 HG01 RE01 SC01.
- معيار الإغلاق: ملخص نجاح من DB دون محتوى واعتماد بشري ثم طلب مستلم فعليًا..

## PR01 — اعتماد provider/model/region/no-training/DPA
- الدليل: `docs/beta/G6-PROVIDER-TRIAL-APPROVAL-REGISTER-2026-11-09.md; registries`.
- سبب النقاط/النقص: سجل الاعتمادات غير موقع وregistries فارغة..
- الاعتماديات: —.
- معيار الإغلاق: توقيع الملاك بنطاق وصلاحية وSecret Store قبل أي تفعيل..

## PR02 — أسرار محلية غيرمتتبعة وصلاحية ملفمقيدة
- الدليل: `credentials.json; .gitignore`.
- سبب النقاط/النقص: صلاحية644 عولجت إلى600؛ صلاحية المفاتيح غير مختبرة..
- الاعتماديات: —.
- معيار الإغلاق: الحفاظ على ignored و600 وعدم الطباعة؛ مراجعة مزود بعد إذن..

## PR03 — سياسة خصوصية وكيان واحتفاظ واستجابةحوادث
- الدليل: `src/pages/privacy.astro; src/pages/terms.astro; docs/DATA-PRIVACY-AND-SECURITY.md`.
- سبب النقاط/النقص: النصوص تحتاج اعتمادًا قانونيًا وسياسة احتفاظ..
- الاعتماديات: DB02 TR04 PR01.
- معيار الإغلاق: توقيع المالك والقانون وتوثيق الحوادث والاحتفاظ والمعالجة..

## PR04 — منع تسرب query/referrer فيكل التحليلات
- الدليل: `BaseLayout.astro:analyticsLocation; observability/redact.mjs`.
- سبب النقاط/النقص: GA4 مستقل ويحذف query محدودة فقط..
- الاعتماديات: MO02.
- معيار الإغلاق: قائمة URL آمنة وفحص شبكة اصطناعي مصرح دون بيانات حساسة..

## MO01 — Sentry مخصص ومعتمد مع release/environment
- الدليل: `observability/config.mjs; sentry.mjs; live-evidence.json:Sentryprojects=[]`.
- سبب النقاط/النقص: لا مشروع Sentry أو DSN أو اعتماد مثبت..
- الاعتماديات: OP01 PR03.
- معيار الإغلاق: مشروع معتمد وSecret Store ثم حدث منقح واصل..

## MO02 — PostHog أحداث رحلة التجربة بقائمةسماح
- الدليل: `observability/posthog.mjs; config.mjs; additional-evidence.json`.
- سبب النقاط/النقص: ingested_event=false وإعدادات المشروع تحتاج مراجعة..
- الاعتماديات: PR03 TR01.
- معيار الإغلاق: وجهة معتمدة وخصائص صريحة دون replay أو auto capture..

## MO03 — أخطاء Auth/DB/AI/المنتجات الخمسة وتنبيه/oncall
- الدليل: `observability/index.mjs; docs/beta/MONITORING-OPERATIONS-PLAN.yaml`.
- سبب النقاط/النقص: Wiring مصدر فقط؛ لا alert أو ack من مسؤول..
- الاعتماديات: MO01 MO02.
- معيار الإغلاق: أخطاء اصطناعية مصرح بها وتنقيح وتنبيه واستجابة وkill switch..

## UI01 — الواجهةالعامة RTL بعناوين واضحة
- الدليل: `seo-crawl.json:55/55 lang/dir/H1; browserFirewall`.
- سبب النقاط/النقص: RTL وH1 ثبتا؛ المعنى البصري راجعته عينة فقط..
- الاعتماديات: —.
- معيار الإغلاق: الحفاظ على التناسق ومراجعة بقية الصفحات بشريًا..

## UI02 — الجوال 360/390/768/1440 دونقصوتداخل
- الدليل: `PageShell.astro; browser viewport actual500/1200`.
- سبب النقاط/النقص: طلب390 أعاد500؛ لا دليل جوال390 حقيقي..
- الاعتماديات: OP01.
- معيار الإغلاق: محاكاة بمقاسات فعلية محددة ولقطات وإجراءات مستخدم..

## UI03 — لوحةمفاتيح وتركيز وتباين وقارئشاشة
- الدليل: `browser accessibility snapshot; src/components`.
- سبب النقاط/النقص: Snapshot ليست WCAG؛ لا دورة keyboard أو قياس contrast..
- الاعتماديات: OP01 TR01.
- معيار الإغلاق: رحلة بلوحة المفاتيح وتسميات وتركيز ورسائل خطأ وقارئ شاشة..

## UI04 — Loading/empty/error/success من API حقيقي
- الدليل: `pages/app/*; AppLayout.astro`.
- سبب النقاط/النقص: واجهات مصدر موجودة دون جلسة وDB للحالات الأربع..
- الاعتماديات: OP01 AU01.
- معيار الإغلاق: لكل منتج تحميل وفراغ وخطأ ونجاح من API حقيقي وإعادة محاولة صادقة..

## UI05 — Motion مخفض وأداء مقاس دونمساس Constellation
- الدليل: `interior-motion CSS; browser reduced-motion rules`.
- سبب النقاط/النقص: قواعد CSS موجودة؛ لا اختبار تفضيل أو profiling..
- الاعتماديات: UI02.
- معيار الإغلاق: اختبار reduced motion وtrace قبل أي ادعاء تحسين..

## SE01 — 55 صفحة indexable200 و canonical متطابق
- الدليل: `seo-crawl.json; build.log:coverage55`.
- سبب النقاط/النقص: نجاح الصفحات لا يضمن فهرسة Google..
- الاعتماديات: —.
- معيار الإغلاق: الحفاظ على استبعاد app/auth من الخريطة وإعادة الزحف بعد النشر..

## SE02 — Titles/description/H1/alt/JSON-LD syntactic
- الدليل: `seo-crawl.json:لاmissing/invalid`.
- سبب النقاط/النقص: الصحة النحوية مثبتة، لا دلالة rich results..
- الاعتماديات: —.
- معيار الإغلاق: فحص الأنواع المناسبة دون أسعار أو اعتمادات مختلقة..

## SE03 — robots و llms وخريطة وروابطداخليةصالحة
- الدليل: `live-evidence.json; additional-evidence.json:56links`.
- سبب النقاط/النقص: llms.txt لا يضمن citations..
- الاعتماديات: —.
- معيار الإغلاق: إعادة زحف وروابط وcanonical وrobots متوافقة دون broken paths..

## SE04 — تحويل HTML aliases علىالنسخةالحية
- الدليل: `redirects.json; scripts/server.mjs; local-http.json; additional-evidence.json`.
- سبب النقاط/النقص: Alias حي404 وindex.html200 دون تحويل..
- الاعتماديات: OP01.
- معيار الإغلاق: 301 إلى المسار النظيف وحفظ query بلا loop على الخدمة الهدف..

## SE05 — ظهورسعودي و SearchConsole/GBP/روابط موثقة
- الدليل: `محتوىsaudi فيseo-crawl.json؛ لاGSC/GBPread`.
- سبب النقاط/النقص: المحتوى السعودي لا يثبت ranking أو كيانًا محليًا..
- الاعتماديات: —.
- معيار الإغلاق: GSC/GBP قراءة معتمدة وbaseline query/country/date دون اختلاق NAP..

## SE06 — CWV ميداني/مختبري وصحة schema دلالية
- الدليل: `BaseLayout.astro; لاCrUX/Lighthouse/RichResultsreport`.
- سبب النقاط/النقص: لا CWV مقاس أو تحقق rich results دلالي..
- الاعتماديات: UI02 OP01.
- معيار الإغلاق: تقرير قياس بسياق وحدود عينة واضحة وتحقق schema..

## CO01 — عرض وسعر وعقد ودعم/SLA معتمد
- الدليل: `src/pages/pricing.astro; terms.astro; kernel/index.astro`.
- سبب النقاط/النقص: لا سعر أو SLA أو شروط نهائية معتمدة..
- الاعتماديات: PR03 TR06.
- معيار الإغلاق: اعتماد عرض وترخيص ودعم وعقد دون دفع تلقائي للتجربة..

## CO02 — UAT مستقل لخمسةمنتجات وعزل/استعادة
- الدليل: `docs/beta/RC-*/VERIFICATION-PLAN.md؛ tests.tap`.
- سبب النقاط/النقص: لا توقيع UAT للمرشح الحالي؛ المصدر ليس قبولًا..
- الاعتماديات: AR02 AR03 DB05 DB02 FW01 LD01 HG01 RE01 SC01.
- معيار الإغلاق: مشغل ومدقق مستقل يوقعان حزمة دليل لنفس SHA..

## CO03 — On-prem/Air-gapped بعقد وتشغيلمحلي مستقل
- الدليل: `pages/app/kernel/index.astro يعلنغيرمتحقق`.
- سبب النقاط/النقص: Neon Auth والخدمات الخارجية لا تثبت Air-gapped..
- الاعتماديات: CO01 PR01.
- معيار الإغلاق: إن بقي ضمن العرض: هوية ونموذج ورخصة وتحديث واختبارات بلا إنترنت..
