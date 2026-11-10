"""Generate standalone, scoped execution prompts; no infrastructure actions."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parent
BASE='7b1f533f71c7b1f41884790366a4d5967c85a87b'
# title, role, scope, tools, analysis, steps, secrets, acceptance, dependencies, approval, rollback
items=[
('حسم عقود الاختبارات','Senior Node/Astro Engineer','AR02–AR04؛ tests/*، scripts/verify-routes.mjs، العقود المالكة في src/server/* وpackage-lock.json','Node، PostgreSQL18 محلية معزولة، GitHub قراءة',
'شخّص 9 FAIL و5 SKIP وassertion التحليلات في ملفات tests.tap وroutes.log؛ قارن BLOCK/DENY وUUID وchain-v2 وحقول Risk بالعقود الحالية.',
'صحح الخلل في المصدر أو fixture بحسب العقد المعتمد، دون تخفيف الحراس؛ أضف حالات انحدار ذات معنى، ثم شغّل الوحدة وتكامل DB والبناء وفحص advisories. لا ترقِّ اعتماديات عشوائيًا.',
'KERNEL_TEST_DATABASE_URL، FIREWALL_TEST_DATABASE_URL، HUMAN_GATE_TEST_DATABASE_URL، LEDGER_TEST_DATABASE_URL، RISK_ENGINE_TEST_DATABASE_URL لأهداف localhost منفصلة فقط',
'اختبارات العقود الحالية ناجحة، وتكامل DB18 فعلي لكل منتج، أو عائق موثق؛ لا skip مخفي ولا نجاح مزور.',
'لا شيء؛ يلزم توفير DB18 معزولة قبل إغلاق تكامل البيانات','لا كتابة خارجية أو رسوم؛ لا تعديل workflow دون إذن خاص','تراجع عن التعديلات المحددة فقط، دون reset أو stash'),
('Staging واستعادة وترحيلات','PostgreSQL/Neon Architect','DB01–DB03؛ migrations/*، docs/beta/STAGING-RESTORE-AND-MIGRATION-PLAN.md وrunbooks','Neon MCP SELECT، GitHub قراءة، DB18 معزولة',
'أعد جرد young-frog-60183055 وفرع br-young-bird-b43proeb؛ قارن objects والـgrants والـledger، ولا تطبق 0001–0027 آليًا.',
'جهز خطة لكل object مفقود وترتيب dependencies وحراس 0019/0025/0027 ومراجعة SECURITY DEFINER في0016؛ قدم هدف staging وتكلفته وخطة restore/rollback للمراجعة. بعد الإذن نفذ rehearsal وmigration ledger ثم تمرين استعادة منفصل وقس RPO/RTO.',
'DATABASE_URL_UNPOOLED لهدف معزول معتمد، ومفاتيح مستقلة دون بيانات عملاء',
'Parity وhashes وترتيب ترحيلات موثقة، وبيئة منفصلة وحماية production واستعادة مقاسة دون مساس بيانات العملاء.',
'P01 لدليل الاختبارات؛ تجهيز الخطة ممكن قبله','إنشاء/تعديل موارد Neon والحماية والترحيلات والاستعادة الخارجية BLOCKED حتى تفويض محدد','استعادة معتمدة أو forward repair؛ لا DROP عشوائي'),
('Runtime RLS وData API','Security/PostgreSQL Architect','DB04–DB07؛ kernel/db.mjs، migrations/0018* و0025* و0027*، وثائق عزل البيانات','Neon قراءة، DB18 معزولة، Node tests',
'افحص ملكية الجداول وBYPASSRLS وFORCE والسياسات ومساعدات SECURITY DEFINER وEXECUTE؛ عدم BYPASSRLS وحده لا يثبت خضوع table owner للحماية.',
'جهز مصفوفة صلاحيات دقيقة وخيارًا معتمدًا لـData API، ثم اختبر A/B ومستخدمًا بلا عضوية وauthenticated/anonymous ومالكًا غير مشارك؛ افحص CRUD والتصدير والدوال وتبديل GUC.',
'DATABASE_URL لدور runtime معتمد، AIGAS_REQUIRE_RLS',
'Runtime ليس owner أوBYPASSRLS، لا وصول عابر للمؤسسات، ومحتوى Secure Chat للمشارك فقط حتى أمام مدير غير مشارك.',
'P02؛ bootstrap يعالج في P05','كل إنشاء role/login أو GRANT/REVOKE أو تغيير Data API أو Secret Store خارجي يحتاج تفويضًا','إغلاق البوابة وegress؛ الرجوع إلى خطة منح معتمدة دون توسيع runtime'),
('تهيئة Node SSR وطبقة HTTP','Astro/Render SRE','OP01–OP05؛ astro.config.mjs، scripts/server.mjs، middleware.ts، render.yaml وrunbook','Render وGitHub قراءة، Browser، shell محلي',
'تحقق من workspace يختاره المستخدم؛ الخدمة المرجعية srv-d7m5bcjbc2fs73826v20 كانت static_site تنشر dist/client؛ blueprint ليست دليل إعداد حي.',
'جهز خدمة Node Staging وbuild/start قابلين للتكرار، ثم حماية HTTP للعام والخاص حتى prerendered، وreadiness للتبعيات. اختبر محليًا gate=false وencoded path؛ بعد الإذن اختبر staging وسجّل service/deploy/SHA/digest إن أمكن.',
'DATABASE_URL، NEON_AUTH_BASE_URL، NEON_AUTH_JWKS_URL، AIGAS_APP_ENABLED، AIGAS_REQUIRE_RLS، AIGAS_CSP_ENFORCE',
'API تعيد JSON وحالات 401/503 المناسبة، no-store/noindex للخاص، حماية GET/HEAD/errors، وتحويل aliases بلا loop. homepage200 وحدها لا تكفي.',
'P02/P03 للبيئة والبيانات؛ لا يعتمد تجهيز SSR على اكتمال اختبار Auth في P05','إنشاء Render أو تعديل env أو DNS أو دومين أو نشر BLOCKED حتى عرض الخطة والتكلفة وتفويضها','إغلاق Portal أو إصدار صالح سابق؛ لا نقل للدومين قبل قرار الإطلاق'),
('Auth وBootstrap ودعوات','Identity/Kernel Engineer','AU01–AU07؛ kernel/auth/service/administration/policies/access، src/pages/auth/* وAPI Kernel','Neon قراءة، Browser على المعزول، Node/DB tests',
'راجع JWT وعضويات Kernel وربط Auth؛ createWorkspace وقبول الدعوة تحت دور RLS يحتاجان قناة مشغل، لا self-grant من المتصفح.',
'نفذ قناة مشغل محدودة لأول مؤسسة وOWNER وحيد، ثم تسجيل ودخول واستعادة وانتهاء جلسة ودعوات وربط وقبول وإلغاء. اختبر EdDSA/issuer/expiry/UUID وتطابق الهوية وآخر مالك والتزامن وسحب الصلاحيات والسياسات العليا.',
'NEON_AUTH_BASE_URL، NEON_AUTH_JWKS_URL، DATABASE_URL للمعزول',
'مؤسستان وحساب طالب ومراجع وoutsider؛ لا تصعيد أو replay، والبوابة لا تفتح مؤسسة أخرى ولا تخلط الاستحقاق بالشراء.',
'P02/P03/P04؛ تجهيز محلي قبل ذلك ممكن','إنشاء هويات/دعوات أو إرسال بريد خارجي وتغيير صلاحيات يحتاج تفويضًا خاصًا؛ جهز القناة قبل طلبه','تعطيل قناة المشغل وإبطال جلسات الاختبار وفق إذن؛ لا حذف واسع'),
('دورة Trial وحصص وخروج','Enterprise SaaS/Privacy Engineer','TR01–TR06؛ kernel/trial/access، migrations/0023*، API/UI المشغل، REAL-TRIAL-SPEC.md','Neon قراءة، DB18 معزولة، Browser',
'افصل طلب الأهلية والموافقة والتفعيل؛ 172800 ثانية مدة هدف مصدرية من activated_at وليست موافقة تشغيل. الحصص والاحتفاظ غير معتمدين.',
'المرحلة A قبل المنتجات: نفذ schema ودورة الطلب والمراجعة وقناة المشغل واختبارات الرفض والحصص والانتهاء، مع بقاء التفعيل مغلقًا حتى readiness. جهز سياسة التصدير والاحتفاظ والحذف. المرحلة B بعد تحقق المنتج في P07–P11: فعّل نطاقه المصرح بنتيجة readiness لنفس البيئة والنسخة، ثم PoV فعلي وdry-run وحذف معتمد.',
'DATABASE_URL وAuth للمعزول فقط؛ لا مفاتيح دفع',
'قبول المرحلة A: دورة محفوظة واختبارات رفض وتزامن وانتهاء وحصص، دون تفعيل منتج غير متحقق. قبول المرحلة B مؤجل إلى ما بعد نجاح المنتج: تفعيل مصرح وPoV من DB وتصدير وحذف موثقان. لا بطاقة أو تحويل أو تجديد تلقائي.',
'المرحلة A تعتمد P02–P05؛ المرحلة B تعتمد نجاح المنتج المحدد منP07–P11 واعتماد الحصص والمدة والاحتفاظ','التفعيل الخارجي واعتماد السياسة وتنفيذ حذف بيانات عمليات مستقلة تحتاج إذنًا؛ لا تعامل العدد السابق كموافقة نافذة','إيقاف التفعيل وحفظ الأدلة؛ لا إعادة expired إلى ACTIVE دون طلب جديد'),
('Firewall وموصل تصعيد مربوط','AI Safety/Firewall Engineer','FW01–FW06؛ firewall/core/service/guard/binding/escalation/provider وroutes/UI','Node وDB معزولة وBrowser، Neon قراءة',
'راجع harness8/8 وحدوده؛ registry المراجعة والمزود فارغان. لا تعتبر sandbox إثبات AI أو ESCALATE عامل.',
'نفذ قواعد دائمة بversion وreadback، وخمس حالات HTTP بأسباب ونسخ ومراجع دليل. اربط ESCALATE بعقد عملية Human Gate معتمد وطلب PENDING داخل المعاملة. أبق DENY/WARN/ESCALATE دون تنفيذ تلقائي ومرر المنقح فقط عند REDACT.',
'DB/Auth للمعزول؛ مفتاح مزود فقط من P11 إذا اعتُمد',
'A/B وquota وفشل audit وbinding/replay سلبية، قرار محفوظ ومرجع مطابق، ورفض تمرير النص الأصلي أو موافقة قرار آخر.',
'P01–P05 وP06-A، P08 للدليل، P09 لطلب المراجعة؛ لا يعتمد P09 على P07','عقد المراجعة وتسجيل موصل وإرسال خارجي يحتاج كل منها موافقة مناسبة؛ لا تملأ registry نيابة عن المالك','تعطيل الموصل والكتابة عند الخلل؛ لا السماح التلقائي'),
('Ledger وتحقق مستقل','Evidence Integrity Engineer','LD01–LD05؛ ledger/core/writer/service، migrations0013/0024، routes، public/downloads/aigas-ledger-verifier.mjs','Node وDB18 معزولة وBrowser، Neon قراءة',
'راجع chain-v2 وInvalid chain في fixture وغياب trigger حيًا؛ لا تغير expected لإخفاء فشل سلامة.',
'أنشئ حدثًا اصطناعيًا دائمًا واقرأه ثم صدّر bundle مع prefix اللازم وشغّل الفاحص بعملية مستقلة. اختبر التزامن دون fork وreplay/conflict وتعديل كل حقل وحذف وترتيب ونقص bundle وعزل A/B وmandatory evidence failure.',
'DB/Auth للمعزول فقط',
'تحقق مستقل من bundle حقيقي؛ tamper يفشل وحالات السلامة صادقة؛ لا ادعاء WORM أو صحة مصدر/وقت أو حصانة من DB admin أو Legal Hold.',
'P01–P05 وP06-A؛ الاحتفاظ من P06','أي migration خارجي أو حذف أو anchor خارجي يحتاج إذنًا؛ لا AI مطلوب','وقف الكتابة وحفظ السلسلة القديمة؛ لا إعادة hash لتجميل الفشل'),
('Human Gate بأثر واحد','Authorization/Workflow Engineer','HG01–HG05؛ human-gate/core/service، migrations0014، API/UI والاختبارات','Node وDB18 معزولة وBrowser، Neon قراءة',
'راجع SoD ونسخة السياسة والهدف والمهلة وصلاحية المراجع؛ INTERNAL_DEMO_NOTE ليس تكامل عميل خارجيًا.',
'أنشئ طلبًا ومراجعًا مستقلاً وقرار قبول/رفض بسبب محفوظ؛ اختبر تفويضًا وإلغاء وانتهاء. نفذ KERNEL_WORKSPACE_RENAME كأثر محدود واستهلك permit داخل نفس معاملة الأثر والتدقيق. اختبر التكرار والتزامن وتغير الهدف أو السياسة أو المراجع وفشل audit.',
'DB/Auth للمعزول فقط',
'طلبان متزامنان للتنفيذ ينتجان أثرًا واحدًا، وسحب المراجع أو expiry يرفضان؛ readback يطابق request/decision/effect.',
'P01–P05 وP06-A وP08؛ يأتي موصل Firewall لاحقًا في P07 دون اعتماد دائري','لا migrations أو عمليات عميل خارجية أو توسيع صلاحيات دون تفويض','تعطيل نوع العملية وحفظ الحالات؛ لا UPDATE يدويًا لتوليد APPROVED'),
('Risk Engine وخطر متبق','Risk Product/Node Engineer','RE01–RE05؛ risk-engine/core/service، migrations0026، API assets/assessment/treatment/export وUI','Node وDB18 معزولة وBrowser، Neon قراءة',
'راجع METHOD ومنهج التجربة وacceptance authority مع مالك المخاطر؛ لا ادعاء اعتماد ISO أو جهة تنظيمية.',
'نفذ أصلًا اصطناعيًا بversion وتاريخ، وتقييم likelihood/impact محسوبًا خادميًا، ومعالجة وresidual numeric وقبول خطر حسب السياسة. اختبر خلايا المصفوفة والحدود وتعارض النسخ وتغير الأصل والمراجع غير المستقل وموعد المراجعة والتصدير من DB.',
'DB/Auth للمعزول فقط',
'سجل فعلي قابل للتصدير والقراءة اللاحقة، رفض A/B، residual مطابق، وقبول الخطر لا يفتح deployment أو يتجاوز Kernel.',
'P01–P05 وP06-A وP08؛ منهج التجربة وسياسة القبول معتمدان مستقلًا','اعتماد المنهج ليس قرارًا يصنعه الكود؛ migrations الخارجية تحتاج إذنًا','وقف تقييمات جديدة وحفظ revision history'),
('Secure Chat ومزود معتمد','AI Integration/Privacy Engineer','SC01–SC05/PR01/DB07؛ secure-chat/models/adapter/policy/requests/service، migrations0016/0027 وAPI/UI','Neon قراءة، Node/DB معزولة، Browser؛ provider فقط بعد إذن',
'جهز قرار provider/model/endpoint/region/DPA/no-training/retention/expiry/tenant scope والحدود والتكلفة. المفاتيح القديمة في.env ليست إذن اتصال.',
'قبل التسجيل أو الإرسال قدّم القرار للملاك. بعد الإذن أثبت ردًا وusage حقيقيين، Kernel/Firewall قبل egress، DENY بلا شبكة وREDACT منقحًا، quotas reserve/reconcile وtimeout/cancel وتزامن. لا redirects أو fallback غير معتمد.',
'AIGAS_SC_<PROVIDER>_API_KEY بعد تحديد مزود معتمد، وDB/Auth للمعزول',
'رد نموذج فعلي دون mock، محتوى للمشارك فقط بما فيه رفض owner غير مشارك، ولا محتوى في logs. عند غياب اعتماد أو مفتاح يبقى الإرسال BLOCKED برسالة خادمية واضحة.',
'P02–P05 وP06-A وP07/P08/P09، وتوقيع PR01؛ تحقق من إنجاز العمليات لا أرقام البرومبتات فقط','تفعيل مزود وتسجيل نموذج وإرسال اصطناعي خارجي يحتاج تفويضًا محددًا وحدود تكلفة','إيقاف الإرسال وقطع egress وحفظ الحصة والدليل دون محتوى'),
('رحلة تجربة RTL قبل الشراء','Product/UI Engineer','TR01/TR06/UI01–UI05؛ pages/products/[product].astro، appالخمس، AppLayout/Auth وREAL-TRIAL-SPEC.md','Browser، Made Good Designs مرجع اختياري، مهارات التصميم وأدوات Astro القائمة',
'راجع رحلة الصفحة إلى العملية ثم PoV وطلب اشتراك؛ لا تغيّر الهيدر أو الهيرو أوConstellation أو النصوص والأقسام القائمة.',
'أضف CTA وproduct selector من allowlist ثم الهوية والأهلية والمساحة. اعرض state/quotas/expiry والنتيجة والسياسة ومرجع الدليل من API. نفذ loading/empty/error/success وإعادة محاولة آمنة. تأكيد طلب الاشتراك فقط بعد استلام حقيقي؛ mailto ليس تأكيدًا.',
'لا أسرار في المتصفح؛ DB/Auth خادميان',
'عمليات المنتجات مرتبطة بمراجع DB، expiry/رفض واضحان، keyboard/reader/contrast ومقاسات360/390/768/1440 مثبتة فعلًا، وreduced motion؛ لا بيانات أو نجاح وهمي.',
'P04–P11؛ المنتج غير المتحقق يبقى مغلقًا ولو نجح غيره','لا نشر أو destination أو analytics خارجية دون إذن؛ لا تغيير التصميم المحمي','إزالة الإضافة وحدها دون استبدال الصفحة التسويقية'),
('مراقبة وخصوصية وتنبيهات','Observability/Privacy SRE','MO01–MO03/PR04؛ observability/*، MonitoringGate/relay، BaseLayout، MONITORING-AND-ANALYTICS-WIRING.md','Sentry/PostHog MCP قراءة، Browser على المعزول، Node',
'أعد جرد المشاريع؛ لا تختَر وجهة نيابة عن المالك. افصل GA4 العام عن بوابات PostHog وراجع URL/referrer بقائمة سماح لا query حر.',
'جهز payload منقحًا وقرار وجهة وتكلفة قبل التفعيل. بعد الإذن نفذ O1–O8: أخطاءAuth/DB/AI والمنتجات، أحداث الرحلة، release/environment، تنبيه وack من مسؤول فعلي، وkill switch لكل طبقة.',
'AIGAS_SENTRY_DSN/APPROVED_ORIGIN، AIGAS_POSTHOG_API_KEY/HOST، AIGAS_MONITORING_APPROVAL_REF/RELEASE/ENVIRONMENT ومراجع وأعلام الطبقات الموثقة كاملة في config.mjs',
'لا chat/body/token/SQL/docs أو tenant IDs خارج السياسة، ولا replay/autocapture؛ وصول أحداث مصرح بها وتنبيه ووقف إرسال مثبت، لا استنتاج صفر أحداث من flag.',
'P05–P12 وقرار خصوصية','إنشاء مشروع أو تغيير إعداد أو تفعيل أو إرسال حدث يحتاج إذنًا بعد مراجعة payload؛ لا ترقية مدفوعة تلقائيًا','kill switch مستقل دون إغلاق Portal'),
('SEO وظهور سعودي وأداء','Technical SEO/Frontend Auditor','SE01–SE06/UI02–UI05؛ redirects/server/SEO layout/sitemap والصفحات المتأثرة','Browser، GSC/GBP قراءة عند اعتماد الوصول؛ SEO متخصص فقط برصيد مصرح',
'أعد زحف الحالة الحالية؛ نجاح55 صفحة تاريخيًا لا يكفي. لا تنشئ مشكلة meta/H1 ثبت إغلاقها.',
'أصلح aliases404 وindex.html بلا301 على الخدمة الهدف، ثم قس CWV وافحص schema دلاليًا ومصادر/مؤلفي المحتوى والصور والروابط. احصل على baseline سعودي بمصدرquery/country/date صريح أو سجّل NOT_VERIFIED.',
'مفاتيح قراءة للأداة المختارة فقط؛ لا تكتبها في المصدر',
'canonical200 وخريطة تستبعدapp/auth، aliases301 بلاloop، نتائج Rich Results للأنواع المناسبة وحدودCrUX/lab واضحة؛ لا NAP أو شهادات أو ranking مختلق.',
'P04/P12؛ القياس لا يبرر تغيير الهيرو أوConstellation','لا رسوم أو حسابات أو DNS أو نشر أو analytics دون إذن مستقل','إرجاع تعديل SEO المحدود بعد مقارنة زحف نفس النسخة'),
('تدقيق مستقل وقرار Beta ثم تجاري','Independent Release Readiness Auditor','كل متطلبات Audit/final-360-2026-11-10/requirements.json، أدلة P01–P14 وخطة الإطلاق','GitHub/Render/Neon/Sentry/PostHog قراءة، Browser، بيانات اصطناعية مصرح بها',
'راجع HEAD وworking tree وdeploy وSHA وأوزان وبسوط ومقامات المصدر والتشغيل والموافقات؛ لا تعتمد النسب القديمة ولا دليل المنفذ بلا فحص مستقل.',
'تحقق من خمس عمليات كاملة ومؤسستين وسلب صلاحيات وانتهاء وحصص وتصدير وحذف واستعادة ومراقبة فشل، ورد AI حقيقي مع اعتماد. راجع الكيان والخصوصية والسعر والعقد والدعم وSLA؛ استبعد On-prem/Air-gapped من العرض إن لم يثبتا.',
'لا قيم أسرار في الحزمة؛ مراجع Secret Store فقط',
'توقيع المالك والأمن/الخصوصية وDB Operator والمراجع المستقل لنفس المرشح، ولا P0 مفتوح؛ قرار Beta محدود بالنطاق والمدة، ثم قرار تجاري مستقل.',
'P01–P14 وإغلاق كل بوابة مطلوبة','جهز artifact وخطة cutover/rollback للمراجعة قبل طلب موافقة نهائية؛ لا commit/push/merge/deploy/DNS/production migrations ضمن هذا البرومبت','إيقاف التجربة وegress وحفظ الأدلة واستعادة معتمدة دون إعادة صلاحيات واسعة'),
]

# Separate specialist execution from the original workstream prompts.
changes = {
 0:{0:'حسم عقود الاختبارات وتكامل البيانات',2:'AR02–AR03؛ tests/* وscripts/verify-routes.mjs والعقود المالكة في src/server/*',5:'صحح الخلل في المصدر أو fixture بحسب العقد المعتمد دون تخفيف الحراس؛ أضف حالات انحدار ذات معنى ثم شغّل الوحدة وتكامل DB18 والبناء. فحص الثغرات والتراخيص مسؤوليةP16.'},
 1:{0:'Staging وParity وسجل الترحيلات',5:'جهز خطة كائنات وترتيب ترحيلات وحراس0019/0025/0027 ومراجعة SECURITY DEFINER في0016. قدم الهدف والتكلفة وخطة الرجوع قبل الإذن، ثم نفذ rehearsal وmigration ledger على المعزول. تمرين الاستعادة وRPO/RTO مسؤوليةP17 ولا يشترط اكتماله لتحضير هذه الخطة.',7:'Parity وhashes وترتيب ترحيلات وبيئة معزولة موثقة دون مساس بيانات العملاء؛ استعادةP17 بوابة منفصلة قبل نقل الإنتاج.'},
 3:{0:'تهيئة Node SSR وتتبع الإصدار',5:'جهز Node Staging وbuild/start قابلين للتكرار وreadiness للتبعيات، واختبر gate=false والمسار المشفر وتتبع service/deploy/SHA/digest إن أمكن. حماية جميع استجاباتHTTP والكاش مسؤوليةP18؛ لا تعد اكتمالها شرطًا لتحضير خدمة Node.',7:'SSR وAPI JSON وحالات401/503 الملائمة وتتبع النسخة مثبتة؛ homepage200 لا تكفي. إغلاقOP04 يتحقق فيP18.'},
 4:{0:'Auth والعضويات والسياسات',5:'نفذ تسجيلًا ودخولًا واستعادة وانتهاء جلسة وعضويات وسياسات على بيئة معزولة. اختبر EdDSA/issuer/expiry/UUID وآخر مالك والتزامن وسحب الصلاحيات ومنع تخفيف السياسة العليا. استخدم قناة provisioning والدعوات المحدودة الناتجة منP19 بدل إعادة تنفيذها هنا.',8:'P02/P03/P04 وP19 للتحقق الكامل؛ تجهيز الاختبارات محليًا ممكن قبلها'},
 5:{0:'دورة Trial الخادمية وتفعيل المنتجات المتحققة',5:'P06-A: نفذ schema ودورة الطلب والمراجعة وقناة المشغل واختبارات الرفض والحصص والانتهاء مع إبقاء التفعيل مغلقًا حتى تحقق المنتج. P06-B: بعد نجاح المنتج المحدد منP07–P11 فعّل نطاقه المصرح بنتيجة readiness لنفس النسخة والبيئة ثم PoV من DB. التصدير والحذف والاحتفاظ التنفيذي مسؤوليةP20.',7:'P06-A دورة محفوظة واختبارات رفض وتزامن وانتهاء وحصص؛ P06-B تفعيل مصرح وPoV بعد تحقق المنتج فقط. لا بطاقة أو تحويل أو تجديد تلقائي؛ قبول الحذف منفصل فيP20.'},
 11:{5:'أضف CTA وproduct selector من allowlist ثم الهوية والأهلية والمساحة. اعرض state/quotas/expiry ونتيجة وسياسة ومرجع دليل منAPI، وحالات loading/empty/error/success وإعادة محاولة آمنة. لا تؤكد طلب اشتراك قبل استلام فعلي. المراجعة التفصيلية للإتاحة والجوال والحركة مسؤوليةP23.',7:'رحلة عربيةRTL وعمليات مرتبطة بمراجعDB وحالات انتهاء ورفض صادقة؛ لا بيانات أو نجاح وهمي. دليل الإتاحة والمقاسات الكامل يأتي منP23.'},
 12:{0:'تهيئة Sentry وPostHog وعقد الأحداث',5:'جهز وجهة وpayload منقحًا وقرار تكلفة قبل التفعيل. بعد الإذن أثبت ingestion لأخطاءAuth/DB/AI والمنتجات وأحداث الرحلة بrelease/environment وkill switches. استهلك عقد خصوصيةURL منP21؛ قواعد التنبيه وack وrunbook مسؤوليةP22.',7:'أحداث مسموحة واصلة وkill switches مثبتة، دون chat/body/token/SQL/docs أو replay/autocapture. لا تستنتج صفر أحداث منflag؛ إغلاق التنبيهات منفصل فيP22.',8:'P05–P12 وP21 لعقد الخصوصية وقرار وجهة معتمد؛ تجهيز العقد محليًا لا ينتظر تكامل الواجهة'},
 13:{0:'روابط SEO وCanonical وSchema',5:'أصلح aliases404 وindex.html بلا301 على الخدمة الهدف، وافحص canonical والخريطة وrobots وschema الدلالية ومصادر ومؤلفي المحتوى والصور والروابط في النطاق المتأثر. قياسCWV والظهور السعودي مسؤوليةP25؛ لا تعد ترتيب البحث شرطًا لإغلاق تحويل الروابط.',7:'Canonical200 وخريطة تستبعدapp/auth وaliases301 بلاloop وschema ملائمة للمحتوى، دون بيانات مختلقة؛ SE05/SE06 تغلقان فيP25.'},
 14:{5:'تحقق من أدلة كل عمل ومن خمس عمليات فعلية وعزل مؤسستين وسلب صلاحيات وانتهاء وحصص وتصدير وحذف واستعادة ومراقبة فشل وردAI معتمد. راجع توقيعات الخصوصية والتجارة منP24، ولا تصنعها نيابة عن أصحابها. أعد حساب النسب من الدليل النهائي.',8:'P01–P14 وP16–P25 وإغلاق بوابات النطاق المطلوب؛ P06-A وP06-B مرحلتان منفصلتان'}
}
for index,fields in changes.items():
    row=list(items[index])
    for field,value in fields.items(): row[field]=value
    items[index]=tuple(row)
items.extend(tuple(row) for row in json.loads((ROOT/'prompt-expansion.json').read_text()))

out=[f'# برومبتات الإغلاق — {len(items)} برومبتًا مستقلًا دون سقف ثابت','',
     'بتوجيه المستخدم في2026-11-10 أُلغي سقف15. العدد الحالي ناتج عن فصل مسؤوليات الإغلاق، ويمكن تغييره عند ظهور فجوات موثقة. ترقيم التنفيذ ليس ترتيبًا إلزاميًا؛ P04 لتجهيزNode ثمP19 لقناة المشغل ثمP05 للتحقق منAuth. P06-A تسبق المنتجات وP06-B تلي تحقق المنتج. P08/P09 يسبقان تصعيدFirewall فيP07. P15 مراجعة نهائية بعد جميع المتطلبات المنطبقة؛ الإحالات إلى مهام تفصيلية لا تعني تبعيات عكسية.','']
for n,item in enumerate(items,1):
    title,role,scope,tools,analysis,steps,secrets,acceptance,deps,approval,rollback=item
    out += [f'## P{n:02d} — {title}','',
        f'أنت {role} وتعمل داخل `/Users/yzydalshmry/Desktop/BRIGHTAI`. الهدف: إغلاق النطاق التالي بدليل فعلي، دون الادعاء بإطلاق المنتج.',
        f'- **الحالة المرجعية:** SHA `{BASE}` وتقرير `Audit/final-360-2026-11-10/FINAL-360-AUDIT.md` ومصفوفته. أعد فحص HEAD والانحراف؛ لا تعامل التقرير القديم كحقيقة حالية.',
        '- **قبل التنفيذ:** اقرأ `.agents/mind/01-mind-latest.md` كاملًا وAGENTS المنطبقة، واكتشف المهارات والأدوات المرتبطة. حافظ على تغييرات المستخدم. لا تستخدم شبكة أو أسرار إنتاج لاختبار محلي.',
        f'- **الملفات والمتطلبات:** {scope}.',f'- **الأدوات/MCP:** {tools}.',
        f'- **التحليل والنواقص:** {analysis}',f'- **خطوات التنفيذ:** {steps}',f'- **الاعتماديات:** {deps}.',
        f'- **الأسرار المطلوبة بأسمائها فقط:** {secrets}.',
        '- **حدود الأمان:** لا قيم مفاتيح أو tokens أو محتوى عميل في الكود أو التقارير أو أدوات غير معنية. لا commit/push/merge أو نشر أو رسوم أو تغيير موارد خارجية دون تفويض العملية نفسها. صلاحية الأداة ليست تفويضًا.',
        f'- **معيار القبول:** {acceptance}',
        '- **الدليل النهائي:** SHA وبيئة ووقت وأوامر ونتائج، readback وnegative cases حيث تنطبق، diff محدود، وحالة DONE/PARTIAL/BLOCKED. ميّز المحلي من runtime والاعتماد؛ حدّث العقل بإيجاز فقط إذا تغيرت حقيقة مفيدة.',
        f'- **حالة المنع/الموافقة:** {approval}.',f'- **خطة التراجع:** {rollback}.','']
(ROOT/'EXECUTION-PROMPTS.md').write_text('\n'.join(out))
assert len(items)==len({item[0] for item in items})
assert all(len(item)==11 for item in items)
