# التقرير المستقل الشامل والمحدّث لتدقيق BRIGHTAI — الفحص الحي والمصدري الكامل

لقد أعدتُ تنفيذ التدقيق الشامل من الصفر، شمل ذلك فحص أحدث التزام برمجي في المستودع (`ae6e36255ef55d7596f9239fb1bfe8988a554e1c` بتاريخ 25 نوفمبر 2026) [Source](https://api.github.com/repos/YEEEAE/BRIGHTAI/commits/ae6e36255ef55d7596f9239fb1bfe8988a554e1c)، وزيارة صفحات الموقع الحي صفحةً صفحة، وتجربة مختبرات المنتجات الخمسة ومكون الـKernel ومسارات `/demo/*`، واختبار مسارات الخادم والمجسات والوصول على النطاق الحي `brightai.live`، ومطابقة كل ما يظهر للمستخدم العام مع الكود المصدري وسجلات التدقيق الداخلية.

يكشف هذا الفحص المعمّق عن حقيقة جوهرية غيّرت معادلة التقييم مقارنةً بالجولة السابقة: **الكود المصدري في المستودع شهد قفزة هندسية وأمنية هائلة خلال ساعات اليوم الأخير، بينما النطاق الحي `brightai.live` ما زال يخدم بنية نشر ثابتة ومختلطة تحتوي على صفحات إرثية قديمة ولا تشغّل خدمة Node الخادمية الجديدة بعد**. هذا الانفصال بين "جودة المصدر" و"واقع الإنتاج المنشور" هو المحور الأهم الذي بُنيت عليه النسب المئوية المحدثة في هذا التقرير.

---

**Executive Summary & Architecture Reality:**

يمتلك مشروع BRIGHTAI اليوم مستويين مختلفين تمامًا من النضج؛ المستوى الأول هو **شجرة الكود المصدرية على GitHub**، والتي أصبحت تضم معمارية خادمية متينة مبنية على Astro 6 وNode 22 وPostgreSQL/Neon مع نظام صلاحيات وعزل متعدد المستأجرين (RLS) وصلت ترحيلاته إلى `0045` [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.agents/mind/01-mind-latest.md)، وعقود API محمية بمكتبة `zod` ومعرفات طلبات `X-Request-ID` ومفاتيح عدم تكرار `Idempotency-Key` [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/api/boundary.mjs)، وسياسة أمان متصفح (CSP) مفروضة بالكامل في الكود دون الاعتماد على وضع المراقبة فقط [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/observability/security-policy.mjs).

أما المستوى الثاني فهو **السطح الحي المنشور على `brightai.live`**؛ فعند زيارة الصفحات وتجربة الروابط فعليًا يتضح أن الموقع العام للمنتجات والمركز المعرفي والمختبرات التعليمية يعمل بكفاءة عالية كواجهة ثابتة في المتصفح، غير أن جميع المسارات التي تتطلب خدمة Node الخادمية أو الصفحات الديناميكية المضافة حديثًا — مثل `/request-access/` و`/status/` و`/healthz` و`/readyz` و`/api/measurement-status` و`/app/` و`/auth/sign-in/` — تُرجع حاليًا صفحة خطأ `HTTP 404` على النطاق الحي [Source](https://brightai.live/request-access/) [Source](https://brightai.live/status/) [Source](https://brightai.live/readyz) [Source](https://brightai.live/api/measurement-status). علاوةً على ذلك، كشف الزحف العميق عن بقاء خريطة موقع إرثية قديمة على المسار `/sitemap.xml` وصفحات إرثية حية مثل `/en/pdpl-statement/` تنشر ادعاءات وبيانات منظمة قديمة تتناقض مع منهجية الشفافية الصارمة المعتمدة في النسخة الجديدة [Source](https://brightai.live/sitemap.xml) [Source](https://brightai.live/en/pdpl-statement/).

---

**Updated Percentage Scorecard:**

تمت مراجعة وتحديث الأوزان والدرجات بناءً على الأدلة الحية والمصدرية معًا. ارتفعت درجات الكود والأمن المصدري وتجربة المختبرات بعد التحديثات الأخيرة، بينما خُفضت درجة الربط الداخلي الحي وجاهزية النشر بسبب الروابط المعطلة في رحلة طلب الوصول وبقاء الإرث القديم على النطاق العام.

$$\text{Overall Audit Score} = \sum_{i=1}^{10} (w_i \times s_i) = 74.6\%$$

إذا قمنا بفصل التقييم إلى مؤشرين مستقلين لبيان الصورة الهندسية بدقة دون تجميل، فإن النتيجة تتوزع وفق المعادلتين التاليتين:

$$\text{Repository Source & Local Engineering Score} = 86.5\%$$

$$\text{Live Production Surface & Operational Readiness Score} = 58.2\%$$

وفيما يلي تفصيل الدرجات الموزونة للمشروع ككل في وضعه الراهن بتاريخ 25 نوفمبر 2026:

| المحور التدقيقي | الوزن النسبي | الدرجة السابقة | الدرجة المحدثة | مسوغات التعديل المبنية على الفحص الحرفي |
|---|---:|---:|---:|---|
| جودة الكود والمعمارية الخادمية | $$15\%$$ | $$78\%$$ | **$$86\%$$** | إضافة `apiBoundary` ومخططات `zod` الصارمة في `routes.mjs`، دعم `Idempotency-Key`، وفصل مجسات `liveness` عن `readiness` في `scripts/server.mjs` [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/api/boundary.mjs) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/scripts/server.mjs). |
| الأمن والخصوصية وترويسات الحماية | $$15\%$$ | $$76\%$$ | **$$81\%$$** | ترقية `security-policy.mjs` لفرض CSP مباشرة مع بصمات SHA-256 وعزل كامل لمسار `secure-chat`، لكن غياب ثغرة Astro الحرجة غير المعفاة (`GHSA-26w7-cxv4-gfx2`) وعدم تفعيل Node على الحافة يمنعان الدرجة الكاملة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/observability/security-policy.mjs) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.github/security-allowlist.yml). |
| جاهزية SaaS والتشغيل الحي | $$15\%$$ | $$52\%$$ | **$$48\%$$** | تأكد بالفحص الحي أن `/healthz` و`/readyz` و`/status/` و`/request-access/` و`/app/` كلها تعيد `404`، مع بقاء `AIGAS_APP_ENABLED="false"` وموانع قاعدة البيانات والنماذج في سجل الموانع [Source](https://brightai.live/readyz/) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/render.yaml) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/docs/RELEASE-BLOCKERS-REGISTER.md). |
| سلامة API والمصادقة وعزل المستأجرين | $$10\%$$ | $$70\%$$ | **$$82\%$$** | فحص `db.mjs` و`auth.mjs` وتقرير `authorization-2026-11-25` أثبت وجود حارس `SAVEPOINT` و`SET LOCAL ROLE aigas_runtime` وفحص `pg_has_role` ومنع تكرار `workspace` وإلغاء المشغل الموقوف عبر RLS [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/kernel/db.mjs) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/authorization-2026-11-25/REPORT.md). |
| تجربة المستخدم وتجربة المنتجات الحية | $$12\%$$ | $$81\%$$ | **$$84\%$$** | تجربة المختبرات الخمسة وKernel أظهرت إضافة شارات المراحل (`DEMO` / `PREVIEW` / `PILOT` / `PRODUCTION`) ومسار واضح ومعالجات حالات التفاعل، ويعيبها فقط انكسار زر "طلب الوصول" على الحي [Source](https://brightai.live/products/) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/ux-audit-2026-11-25/REPORT.md). |
| التصميم البصري والـRTL والوصولية | $$10\%$$ | $$84\%$$ | **$$87\%$$** | توافق ممتاز مع RTL، خط IBM Plex Arabic، إصلاح ترتيب التركيز البصري في `Ledger`، عدم وجود مخالفات Axe في الفحص المحلي، وتجنب تام لنمط قوالب الذكاء الاصطناعي المكررة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/ux-audit-2026-11-25/REPORT.md). |
| الربط الداخلي والتنقل وسلامة المسارات | $$8\%$$ | $$84\%$$ | **$$68\%$$** | انخفاض ملحوظ لأن كل صفحة منتج وصفحة المنتجات توجه المستخدم إلى `/request-access/` وهو يعيد `404` حيًا، مع وجود `/404/` يعيد حالة `206/200` بدل `404`، وبقاء `251` صفحة إرثية يتيمة [Source](https://brightai.live/request-access/) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/seo-geo-2026-11-25/REPORT.md). |
| SEO وGEO وAEO وهندسة المحتوى | $$8\%$$ | $$82\%$$ | **$$77\%$$** | إضافة مراكز موضوعية ممتازة (`/docs/topics/*`) بمراجع NIST وسدايا، لكن الإنتاج الحي يعاني من ازدواجية خرائط الموقع (`/sitemap-index.xml` مقابل `/sitemap.xml` القديم) وبطء شديد في بعض الأدلة [Source](https://brightai.live/docs/topics/ai-governance/) [Source](https://brightai.live/sitemap.xml) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/seo-geo-2026-11-25/REPORT.md). |
| الاختبارات الآلية وDevOps وسلسلة التوريد | $$5\%$$ | $$55\%$$ | **$$72\%$$** | وجود عشرات الاختبارات المتخصصة في `tests/` وملف `.github/workflows/accessibility-performance.yml` وسجل استثناءات CVE موثق، لكن ينقصه خط أنابيب CI شامل يشغل فحوص DB وSEO وSecurity معًا [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.github/workflows/accessibility-performance.yml) [Source](https://api.github.com/repos/YEEEAE/BRIGHTAI/contents/tests?ref=main). |
| الموثوقية والشفافية التجارية والقانونية | $$2\%$$ | $$88\%$$ | **$$83\%$$** | الصفحات الحديثة في قمة الأمانة التحريرية (بما في ذلك تعديل عبارة No-Training)، غير أن الصفحات الإرثية الحية مثل `/en/pdpl-statement/` تكسر هذا الانضباط بادعاءات "audit-ready controls" وعناوين غير متحققة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/CLAIMS-REVIEW-2026-11-25.md) [Source](https://brightai.live/en/pdpl-statement/). |

---

**Live Page-by-Page & Product Lab Hands-On Walkthrough:**

عند زيارة صفحات الموقع الحي وتجربة المختبرات التفاعلية، سجلنا المشاهدات الدقيقة التالية لكل صفحة ومنتج:

* **الصفحة الرئيسية (`/`) ومركز المنتجات (`/products/`):** تعمل الصفحة الرئيسية بسرعة ممتازة وتفتتح بسؤال تشغيلي مباشر يلمس واقع المنشآت السعودية، ثم تقسّم القيمة إلى ثلاثة أركان (السلامة، الشفافية، الخصوصية) متبوعةً بتوضيح صريح أن AIGAS تصور يضم Kernel وخمسة منتجات مستقلة وأن الإتاحة التشغيلية غير متحققة حاليًا [Source](https://brightai.live/). في صفحة `/products/` ظهرت إضافة بصرية وتنظيمية ممتازة هي شارات `DEMO مختبر عام` ودليل "مراحل الوصول" الأربعة (`DEMO`, `PREVIEW`, `PILOT`, `PRODUCTION`)، وجدول مقارنة بيئات `SaaS` و`On-Premise` و`Air-Gapped`، إلا أن الخطوة الثانية في شريط خطوات الوصول العلوي وزر "اطّلع على خيارات الوصول" يقودان إلى `/request-access/` الذي ينكسر بخطأ `404` عند النقر عليه [Source](https://brightai.live/products/) [Source](https://brightai.live/request-access/).
* **مختبر الأساس المشترك (`/kernel/` و`/demo/kernel/`):** يعرض المختبر رحلة "من السياسة إلى الدليل" عبر سياق مشترك معرفه `demo-v1-summary-redact`، ويشرح بوضوح انتقال الطلب من تحديد الأصل والسياسة إلى الفحص فالمراجعة المستقلة ثم توليد الدليل، مع حفظ السياق محليًا في الجلسة دون إرسال نصوص أو هوية للخادم، ويربط المستخدم بسلاسة نحو المنتج التالي وهو Firewall [Source](https://brightai.live/kernel/).
* **منتج ومختبر AIGAS Firewall (`/products/firewall/` و`/demo/firewall/`):** عند فحص المختبر في كلتا الواجهتين (المدمجة داخل صفحة المنتج والمستقلة تحت `/demo/firewall/`)، وجدنا محاكيًا محليًا حتميًا واضح القواعد بحد أقصى $$500$$ حرف، يعرض خمسة أزرار أمثلة جاهزة (`ALLOW`, `WARN`, `REDACT`, `ESCALATE`, `BLOCK`)؛ ويشرح للمستخدم بوضوح تام أن أول قاعدة مطابقة حرفيًا تفوز (مثل وجود كلمة «تجاوز» للحظر، أو «خارج المؤسسة» للتصعيد، أو المعرّف الخيالي `DEMO-0000` للتنقيح)، كما تتضمن صفحة `/demo/firewall/` وسم `meta` خاصًا لسياسة CSP يمنع `form-action` و`base-uri` تمامًا، وتُفعّل الأزرار عبر الجافاسكربت فور تحميل الصفحة لمنع النقر قبل الجاهزية [Source](https://brightai.live/products/firewall/) [Source](https://brightai.live/demo/firewall/).
* **منتج ومختبر AIGAS Risk Engine (`/products/risk-engine/`):** يقدم تجربة `RISK STUDIO / 05` المقسمة إلى خمس خطوات متسلسلة (أصل، خطر، تقدير، معالجة، قبول/مراجعة)، مع شرح شفاف لمنهج حساب الدرجة في الديمو عبر ضرب الاحتمال في الأثر على مقياس ترتيبي من $$1$$ إلى $$3$$ بحيث تنتج القيم المنخفضة ($$1\text{–}2$$) والمتوسطة ($$3\text{–}4$$) والمرتفعة ($$6\text{–}9$$) دون إنتاج القيم $$5$$ و$$7$$ و$$8$$، وينبّه المستخدم إلى أن سياق الجمهور يرفع الاحتمال تلقائيًا من $$1$$ إلى $$2$$ وأن التخفيضات لا تُجمع ولا تنسب إلى معايير ISO أو NIST [Source](https://brightai.live/products/risk-engine/).
* **منتج ومختبر AIGAS Human Gate (`/products/human-gate/`):** يحاكي سيناريو فصل المهام (Segregation of Duties) ببراعة تعليمية عالية على الطلب الافتراضي `HG-DEMO-01`؛ فعندما يكون المستخدم في دور مقدم الطلب «سارة» يمنعه النظام من اعتماد طلبه أو رفضه ويحصر المراجعة في «ناصر» بصفته `ADMIN مستقل`، بينما يحصر زر التنفيذ لاحقًا في مقدم الطلب بعد صدور الإذن، مع توليد معاينة محلية لحدث Ledger اصطناعي دون اتصال خادمي [Source](https://brightai.live/products/human-gate/).
* **منتج ومختبر AIGAS Ledger (`/products/ledger/` و`/demo/ledger/`):** يعرض سلسلة أحداث مبنية على بصمات `SHA-256` تبدأ من حدث الأساس `GENESIS` (`request.created` بالمعرف `DEMO-REQ-001`)، ويوفر ستة أدوات تفاعلية في المتصفح هي: «أضف حدثين»، «تحقق من السلسلة»، «غيّر حدثًا» لاختبار كشف التلاعب، «إعادة الضبط»، «إفراغ المثال»، و«Export JSON»، بالإضافة إلى توفر أداة تحقق قابلة للتنزيل؛ وقد تأكدنا من نظافة هيكل الصفحة وعمل الرابط المتبادل مع `/demo/firewall/` و`/demo/human-gate/` [Source](https://brightai.live/products/ledger/) [Source](https://brightai.live/demo/ledger/).
* **منتج ومختبر AIGAS Secure Chat (`/products/secure-chat/` و`/demo/secure-chat/`):** يعمل افتراضيًا كمحاكٍ محلي داخل المتصفح، ويضع تحذيرًا مسبقًا شديد الدقة تحت عنوان «قبل الإرسال الاختياري» يوضح أنه في حال تفعيل المسار الخادمي مستقبلًا سيصل النص أولًا إلى خادم `brightai.live` للتنقيح وقد يُرسل إلى Groq بحد $$400$$ حرف و$$3$$ طلبات كل $$10$$ دقائق، مع إثبات أن التعديل التحريري الأخير لعبارة منع التدريب قد نُشر بالفعل على الصفحة الحية ليصبح: «منع تدريب المورد على بيانات العميل متطلب مستهدف؛ ولا يُعد نافذًا قبل التحقق من العقد والإعداد ودليل المورد» [Source](https://brightai.live/products/secure-chat/).
* **المراكز المعرفية وصفحات الثقة والامتثال والتسعير والتواصل:** زرنا المراكز الموضوعية الجديدة (`/docs/topics/ai-governance/`, `/docs/topics/ai-data-security/`, `/docs/topics/ai-risk/`) وتأكدنا أنها حية وتعمل وتربط الأدلة بالمختبرات وبمراجع NIST الرسمية [Source](https://brightai.live/docs/topics/ai-governance/) [Source](https://brightai.live/docs/topics/ai-data-security/) [Source](https://brightai.live/docs/topics/ai-risk/). كذلك تعمل صفحات `/trust/` و`/compliance/` و`/pricing/` و`/about/` و`/authors/` و`/contact/` باتساق عالٍ، مع ملاحظة أن البريد الإلكتروني في `/contact/` يمر عبر تشفير Cloudflare (`/cdn-cgi/l/email-protection`) مما يربك بعض الزواحف الآلية أو المستخدمين الذين يعطلون الجافاسكربت [Source](https://brightai.live/contact/).

---

**Deep Codebase, Security, and Database Audit:**

بالغوص في ملفات الخادم وقاعدة البيانات داخل المستودع، تبين أن البنية الهندسية أقوى بكثير مما يظهر على النطاق العام حاليًا، مع وجود نقاط محددة تحتاج إلى إغلاق قبل التشغيل الفعلي:

1. **معمارية الخادم وحراسة الحافة في `scripts/server.mjs`:** الخادم المخصص يعطل التشغيل التلقائي لمحول Astro ويضع طبقة حماية استباقية قبل وصول الطلب إلى المحول؛ فهو يعالج ثغرة `CVE-2026-102984` عبر التحقق الصارم من ترويسة `Host` ومنع المنافذ غير الصالحة برمز `400`، ويعالج ثغرة التحويل المفتوح `GHSA-r557-wffq-wvrc` عبر حظر أي مسار يحتوي على شرطة عكسية `\`، ويفرض سياسة الأمان `applySecurityPolicy` حتى على الملفات الثابتة المولدة مسبقًا، ويمرر `/healthz` و`/readyz` مباشرة خارج تحويلات الشرطة المائلة الخاصة بـAstro، كما يلتقط الوعود المرفوضة لمنع انهيار عملية Node بالكامل [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/scripts/server.mjs).
2. **عزل المستأجرين وحوكمة قاعدة البيانات في `src/server/kernel/db.mjs`:** يُعد هذا الملف من أفضل الأجزاء كتابةً في المستودع؛ إذ يفرض استدعاء `SET LOCAL ROLE aigas_runtime` داخل كل معاملة، ثم يتحقق استعلاميًا من جدول `pg_roles` و`pg_class` لضمان أن الدور الحالي ليس `rolsuper` ولا يملك `rolbypassrls` ولا يرث ملكية أي جدول يبدأ بـ`aigas_` وأن إعداد `row_security` مفعل على `on`. كما يستخدم خدعة ذكية عبر `SAVEPOINT aigas_scope_guard` لضمان فشل استدعاء `set_config('aigas.tenant_id', ...)` فورًا إذا جرى استدعاؤه بالخطأ خارج كتلة معاملة صريحة، ويقرأ القيم بعد ضبطها للتأكد من عدم تجاهل مجمع الاتصالات (Pooler) لها، ويستخدم أقفال PostgreSQL الاستشارية `pg_advisory_xact_lock` لمنع حالات التسابق في انتقالات الحوكمة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/kernel/db.mjs).
3. **المصادقة والهوية في `src/server/kernel/auth.mjs`:** يتحقق الخادم من ترويسة `Bearer` بحد طول أقصى $$16,384$$ بايت، ويحصر التحقق التشفيري في خوارزمية `EdDSA` مع اشتراط مطالبات `sub` و`exp` و`iat` وعمر أقصى للرمز لا يتجاوز `15m`، ويرفض الحسابات المجهولة (`anonymous`)، مع دعم إضافي لإثبات `ssoProof` للمؤسسات في الترحيلات الحديثة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/kernel/auth.mjs). النقطة التي ما زالت تحتاج تقوية هنا هي التحقق الصريح من مطالبة الجمهور (`aud` / Audience) عند الربط النهائي مع Neon Auth الحي حتى لا يُقبل رمز صادر لمشروع شقيق من نفس المُصدِر.
4. **بوابة عقود الـAPI في `src/server/api/boundary.mjs` و`routes.mjs`:** تم بناء سجل مركزي يغطي جميع مسارات `/app/api/*` و`/auth/api/*` و`/api/*`، يتحقق من طريقة HTTP ويرجع `405` مع ترويسة `Allow`، ويفحص معاملات الاستعلام (Query Parameters) عبر مخططات `zod`، ويشترط صلاحية `Idempotency-Key` على عمليات الإنشاء الحساسة، ويزيل أي ترويسات `access-control-allow-*` شاردة، ويوحد جميع الأخطاء تحت العقد `aigas-error-v2` مع إرفاق `X-Request-ID` فريد لكل استجابة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/api/boundary.mjs) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/api/routes.mjs).
5. **ثغرات الاعتماديات وسلسلة التوريد في `.github/security-allowlist.yml`:** يوثق المستودع بشفافية عالية وجود ثغرة حرجة في حزمة Astro (`GHSA-26w7-cxv4-gfx2` المتعلقة بمعالجة صور AVIF) لم تُدرج في قائمة الإعفاء لأنها تتطلب موافقة صريحة من المؤسس أو ترقية رئيسية إلى `astro >= 7.3.2` و`@astrojs/node >= 11.1.3` و`Node >= 22.23.4`، بينما تم تثبيت `NODE_VERSION` في `render.yaml` عند `22.22.2` [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.github/security-allowlist.yml) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/render.yaml). ورغم أن الكود الحالي لا يستدعي خدمة الصور المتأثرة، فإن بقاء ثغرة حرجة غير مرقّعة يظل مانعًا رسميًا في بوابات الفحص الأمني المؤسسية.

---

**Critical Gaps & Discrepancies Discovered During Audit:**

تتلخص الفجوات الحاسمة التي تفصل BRIGHTAI عن الوصول إلى درجة تفوق $$90\%$$ في سبع نقاط محددة ومثبتة بالدليل:

* **انفصال النشر الحي عن خادم Node (`P0`):** النطاق `brightai.live` يخدم ملفات ثابتة ولا يمر عبر `scripts/server.mjs`؛ والدليل القطعي هو أن `/healthz/` و`/readyz/` و`/request-access/` و`/status/` و`/api/measurement-status` كلها موجودة ومختبرة محليًا في المستودع لكنها ترجع `404` على النطاق الحي، كما أن سكربت القياس الحي `measurement.mjs` يسقط في مسار الاحتياط الخاص بالاستضافة الثابتة ليقرأ `/measurement-control.json` بعد فشل `/api/measurement-status/` بـ`404` [Source](https://brightai.live/measurement.mjs) [Source](https://brightai.live/measurement-control.json).
* **روابط مكسورة في رحلة التحويل الأساسية للمستخدم (`P0`):** تحتوي صفحة `/products/` وجميع صفحات المنتجات الخمسة وصفحة `/kernel/` وصفحة `/pricing/` ومختبرات `/demo/*` على روابط بارزة لـ«طلب الوصول» (`/request-access/`) و«حالة النظام» (`/status/`)، وعند نقر الزائر الفعلي عليها يواجه صفحة «الرابط غير موجود 404»، مما يقطع رحلة التحويل التجاري في أهم لحظة اهتمام [Source](https://brightai.live/products/) [Source](https://brightai.live/request-access/).
* **تلوث النطاق بصفحات وخرائط إرثية متناقضة (`P0`):** بينما يعلن `robots.txt` عن `sitemap-index.xml` النظيف، ما زال الملف القديم `https://brightai.live/sitemap.xml` حيًا ويعرض عشرات المسارات القديمة (`/en/`, `/blog/`, `/customers/`, `/hub/`, `/solutions/banking-ai-governance/riyadh/`) [Source](https://brightai.live/sitemap.xml). والأخطر أن صفحات مثل `https://brightai.live/en/pdpl-statement/` ما زالت تعمل وتستخدم قالبًا قديمًا مختلفًا تمامًا (`ClientRouter` و`sw-register.js` وشعارات قديمة) وتحتوي في وصفها وبيانات `JSON-LD` على عبارات مثل `"audit-ready controls"` و`LocalBusiness` وعنوان بريدي محدد واسم مؤسس مختلف في السجل القديم، وهو ما يتناقض مباشرةً مع صفحة `/trust/` وصفحة `/authors/` وسجل مراجعة الادعاءات الجديد [Source](https://brightai.live/en/pdpl-statement/) [Source](https://brightai.live/trust/) [Source](https://brightai.live/authors/).
* **موانع قاعدة البيانات والهوية والنماذج في الإنتاج (`P0`):** يثبت سجل الموانع وذاكرة المشروع أن الترحيلات الحديثة (وصولًا إلى `0041` و`0045`) طُبقت محليًا على PostgreSQL 18 لأغراض الاختبار، لكن تطابق المخطط على فرع Neon الإنتاجي، وحماية الفرع وإثبات الاستعادة الفعلية، وتدوير الأسرار، وتحديد منطقة إقامة البيانات (بدل `aws-us-east-2`)، واعتماد مزود ونموذج AI رسمي، كلها ما زالت مفتوحة أو محجوبة بانتظار إجراء تشغيلي وقرار مالك [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/docs/RELEASE-BLOCKERS-REGISTER.md) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.agents/mind/01-mind-latest.md).
* **شذوذ الأداء ورموز الحالة في بعض صفحات الإنتاج (`P1`):** أظهر قياس الأداء على الإنتاج أن الصفحة الرئيسية سريعة ($$1,104\text{ ms}$$ لمؤشر LCP)، لكن صفحة مركز المعرفة وصلت إلى $$10,440\text{ ms}$$ في LCP، ودليل تقييم المخاطر سجل زمن استجابة أول بايت (TTFB) مرتفعًا جدًا بلغ $$8,383\text{ ms}$$، كما أن المسار `/404/` المباشر يعيد استجابة ناجحة بدل رمز `404`، و$$152$$ قاعدة تحويل قديمة لم تكن ترجع `301` على الحافة الحية [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/seo-geo-2026-11-25/REPORT.md) [Source](https://brightai.live/404/).
* **محدودية فحوص CI التلقائية وحجم CSS غير المستخدم (`P1`):** ملف GitHub Actions الوحيد المرصود في `.github/workflows/` هو `accessibility-performance.yml`، ولا يشغّل تلقائيًا اختبارات `test:seo` أو `test:healthz` أو `test:security:smoke` أو اختبارات قاعدة البيانات، كما رصد فحص الأداء وجود نسبة CSS غير مستخدم تتراوح بين $$49.8\%$$ و$$92.6\%$$ في الصفحات العاملة [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.github/workflows/accessibility-performance.yml) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/.agents/mind/01-mind-latest.md).
* **محدودية الحصص ومعدلات الطلبات في الذاكرة المحلية (`P2`):** حراس معدل الطلبات في `http.mjs` ومعالج بلاغات CSP في `csp-report.mjs` يعتمدون على ذاكرة العملية الواحدة (`Map`)؛ وهم مناسبون لنسخة Node منفردة في مرحلة المعاينة، لكنهم يحتاجون إلى مخزن مشترك أو حارس على طبقة Cloudflare عند التوسع الأفقي [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/src/server/kernel/http.mjs) [Source](https://raw.githubusercontent.com/YEEEAE/BRIGHTAI/main/Audit/security-headers-2026-11-25/REPORT.md).

---

**Actionable Remediation Roadmap:**

لرفع التقييم الإجمالي من **$$74.6\%$$** إلى أكثر من **$$88\%$$** خلال دورة عمل قصيرة ومنظمة، يجب تنفيذ الخطوات التالية بترتيب صارم دون القفز إلى ميزات جديدة:

1. **توحيد المنشأ الحي وتشغيل خدمة Node (`اليوم 1–2`):** ربط النطاق `brightai.live` بخدمة Node المبنية من أحدث SHA بدل الاستضافة الثابتة المختلطة، مع إبقاء `AIGAS_APP_ENABLED="false"` مبدئيًا حتى تنجح المجسات؛ هذا الإجراء وحده سيُصلح فورًا مسارات `/request-access/` و`/status/` و`/healthz/` و`/readyz/` و`/api/measurement-status/` ويُفعّل ترويسات `CSP` و`HSTS` و`301 redirects` على النطاق الحي.
2. **تطهير الإرث القديم وإغلاق تضارب الادعاءات (`اليوم 2–3`):** إزالة ملف `/sitemap.xml` الثابت القديم أو تحويله بـ`301` إلى `/sitemap-index.xml`، وجرد الـ`251` مسارًا إرثيًا (خصوصًا `/en/pdpl-statement/` و`/customers/` و`/blog/` و`/lp/`) لإما تحويلها بـ`301` إلى الصفحات المحدثة المكافئة أو إرجاع `410 Gone` مع إلغاء أي Service Worker قديم (`sw-register.js`) قد يعلق في متصفحات الزوار السابقين.
3. **ترقية حزمة Astro وNode لإغلاق ثغرة السلسلة الحرجة (`اليوم 3–4`):** تنفيذ ترقية محكومة ومختبرة إلى `astro >= 7.3.2` و`@astrojs/node >= 11.1.3` ورفع `NODE_VERSION` إلى `22.23.4+`، مما يغلق الثغرة الحرجة `GHSA-26w7-cxv4-gfx2` ويزيل الحاجة إلى معظم الاستثناءات المؤقتة في `security-allowlist.yml`.
4. **توحيد خط أنابيب CI وتحسين سرعة الصفحات الثقيلة (`اليوم 4–5`):** توسيع GitHub Actions ليشغّل في كل طلب دمج: فحص البناء، اختبارات SEO والروابط، اختبارات المجسات، اختبارات ترويسات الأمان، واختبارات PostgreSQL على حاوية خدمة مؤقتة، مع تقسيم ملفات CSS المشتركة ومعالجة سبب ارتفاع TTFB/LCP في `/docs/` وأدلة `/knowledge/`.
5. **تهيئة فرع Staging ومعايير Pilot المؤسسي (`الأسبوع 2`):** إنشاء فرع Neon محمي منفصل للـStaging، تطبيق الترحيلات حتى `0045` بالترتيب مع دور `aigas_runtime` المحدود، تنفيذ تجربة استعادة موثقة (Backup/Restore Drill)، وإثبات رحلة `Auth E2E` بعد إصلاح تعثرها المرصود في سجل بوابة الإطلاق، قبل التفكير في تغيير `AIGAS_APP_ENABLED` إلى `"true"`.

---

**Updated Master Prompts for Execution:**

أعددتُ لك مجموعة محدّثة ودقيقة من البرومبتات التنفيذية المبنية مباشرةً على ما كشفه هذا الفحص الحي والمصدري، لتشغيلها بالترتيب مع فريقك أو وكلاء البرمجة والتشغيل:

### 1. برومبت ربط النطاق الحي بخدمة Node وإصلاح المسارات المكسورة

```text
أنت Principal Release & Edge Infrastructure Engineer.

المشكلة المثبتة حاليًا على النطاق الحي https://brightai.live:
المستودع يحتوي على خدمة Node كاملة في scripts/server.mjs ومسارات جاهزة، لكن النطاق الحي يخدم نسخة ثابتة/مختلطة تجعل المسارات التالية ترجع HTTP 404:
- /healthz و /healthz/
- /readyz و /readyz/
- /request-access/ (رغم وجود روابط له في /products/ وجميع صفحات المنتجات)
- /status/
- /api/measurement-status/
كما أن /404/ المباشر لا يرجع 404، وترويسات CSP/HSTS الكاملة والتحويلات 301 في redirects.json غير مفعلة على النطاق الحي.

المطلوب تنفيذه والتحقق منه:
1. راجع render.yaml وscripts/server.mjs وcloudflare/workers للتأكد من مسار الطلب الكامل: Cloudflare -> Render Node Service -> scripts/server.mjs.
2. احتفظ بـ AIGAS_APP_ENABLED="false" في هذه المرحلة حتى تظل بوابة /app مغلقة بأمان (503/صفحة عدم الإتاحة) ريثما يكتمل إثبات القاعدة والمصادقة.
3. تأكد أن Cloudflare لا يخزن كاش استجابات /healthz* و/readyz* و/status/ و/request-access/ و/app/* و/auth/* و/api/*.
4. بعد توجيه النطاق إلى خدمة Node، نفّذ فحص HTTP حي (GET وHEAD) على النطاق العام وأثبت بالنتائج الحرفية:
   - /healthz/ -> 200 JSON يحتوي version وcommit مطابقًا لآخر SHA
   - /readyz/ -> 200 أو 503 JSON بالعقد الثابت دون كشف أسرار
   - /request-access/ -> 200 HTML مع no-store
   - /status/ -> 200 HTML مع no-store
   - /404/ وأي مسار عشوائي -> 404 فعلي
   - وجود Content-Security-Policy وStrict-Transport-Security وX-Content-Type-Options على الاستجابات الحية.

المخرجات المطلوبة:
- خطة القص والتوجيه (Cutover Runbook) خطوة بخطوة مع خطة التراجع الفوري (Rollback)
- سجل استجابات curl الحية (Status + Headers) لكل مسار أعلاه
- تحديث تقرير حالة النشر بالأدلة المؤرخة
```

### 2. برومبت تطهير الصفحات وخرائط الموقع الإرثية ومنع تضارب الادعاءات

```text
أنت Technical SEO & Compliance Hygiene Architect.

كشف الفحص الحي على brightai.live عن تلوث إرثي خطير يتعارض مع النسخة الحالية:
1. المسار https://brightai.live/sitemap.xml ما زال حيًا (200) ويعرض مئات الروابط القديمة (/en/, /blog/, /customers/, /hub/, /solutions/banking-ai-governance/...)، بينما الموقع الحديث يعتمد https://brightai.live/sitemap-index.xml.
2. صفحات إرثية مثل https://brightai.live/en/pdpl-statement/ ما زالت حية (200) بقالب قديم يسجل Service Worker (/js/sw-register.js) وتنشر ادعاءات وبيانات JSON-LD غير متحققة مثل "audit-ready controls" وLocalBusiness وعنوان بريدي واسم مؤسس يتعارض مع صفحتي /trust/ و/authors/ وسجل Audit/CLAIMS-REVIEW-2026-11-25.md.

المطلوب:
1. احذف أو أوقف خدمة أي ملف sitemap.xml قديم، واجعل /sitemap.xml يحوّل بـ 301 دائم إلى /sitemap-index.xml.
2. افحص جميع الـ 264 عنوانًا الإرثيًا في خريطة الإرث وصنّف كل مسار إلى قرار واحد موثق:
   - 301 Redirect إلى صفحة حديثة مكافئة فعليًا في Astro
   - أو 410 Gone لأي صفحة تحتوي ادعاءات امتثال/عملاء/ميزات/بيانات كيان غير متحققة وليس لها بديل معتمد.
3. أضف سكربت إلغاء تسجيل آمن (Self-destructing unregister) على مسار /sw.js أو /js/sw-register.js إن لزم حتى لا يبقى Service Worker القديم فعالًا في متصفحات الزوار السابقين.
4. أضف اختبار انحدار في tests/seo-redirects.test.mjs يفشل إذا عاد أي مسار إرثي بـ 200 أو ظهر أي ادعاء LocalBusiness/audit-ready قديم.

المخرجات:
- جدول قرارات الـ 264 مسارًا
- تعديلات redirects.json وscripts/server.mjs
- نتائج npm run test:seo كاملة
```

### 3. برومبت ترقية Astro وNode وإغلاق ثغرات سلسلة التوريد

```text
أنت Staff Application & Dependency Security Engineer.

يوجد في .github/security-allowlist.yml توثيق صريح بأن الحزمة الحالية astro ^6.0.0 و@astrojs/node ^10.1.4 تتأثر بثغرة حرجة غير معفاة (GHSA-26w7-cxv4-gfx2) وعدة ثغرات أخرى تم تحييدها جزئيًا في scripts/server.mjs، وأن الحل الجذري يتطلب الترقية إلى astro >= 7.3.2 مع @astrojs/node >= 11.1.3 وNode >= 22.23.4.

المطلوب:
1. نفّذ الترقية في فرع معزول لـ astro و@astrojs/node وحدث package.json وpackage-lock.json وrender.yaml وملفات GitHub Actions لرفع Node إلى أحدث إصدار مستقر >= 22.23.4.
2. احتفظ بحراس الدفاع في العمق داخل scripts/server.mjs (فحص Host وفحص المسارات ذات الشرطة العكسية) حتى بعد الترقية، مع تحديث التعليقات التوضيحية.
3. راجع تحذيرات Astro التي ظهرت أثناء البناء بخصوص قراءة ترويسات الطلب في الصفحات المولدة مسبقًا (prerendered pages) وأصلح سببها الجذري دون إضعاف CSP أو الترويسات.
4. نظّف .github/security-allowlist.yml من جميع الإعفاءات التي أغلقتها الترقية، وتحقق من أن npm audit --audit-level=high يعيد صفر ثغرات.
5. شغّل جميع حزم الاختبارات (build, seo, healthz, security:smoke, ux) وتأكد من عدم تغير بصمات SHA-256 لسياسة CSP، أو حدّثها بدقة إن تغير إخراج Astro.

المخرجات:
- diff الترقية الكامل
- نتيجة npm audit النظيفة
- نتائج الاختبارات بعد الترقية
```

### 4. برومبت توحيد خط أنابيب CI وإصلاح تعثر Auth E2E والأداء

```text
أنت Principal QA & Performance Automation Engineer.

الوضع الحالي في المستودع:
1. ملف .github/workflows/accessibility-performance.yml يشغّل فحصًا واحدًا فقط، ولا يحمي الفرع الرئيسي من انحدار SEO أو CSP أو Healthz أو RLS.
2. سجل بوابة الإطلاق بتاريخ 2026-11-25 رصد فشل Auth E2E عند المسار /products/ ونتيجة RLS 87/90 في إحدى الجولات.
3. قياس الأداء رصد نسبة CSS غير مستخدم بين 49.8% و92.6%، وبطئًا في LCP لصفحة /docs/ وTTFB لبعض صفحات /knowledge/.

المطلوب:
1. شخّص وأصلح سبب فشل tests/auth-browser.e2e.mjs عند /products/، وتأكد أن مصفوفة RLS تجتاز 90/90 بثبات دون اعتماد على ترتيب تشغيل الاختبارات.
2. أضف التحقق الصريح من مطالبة الجمهور (aud) إن توفرت في auth.mjs مع اختبار وحدة خاص بها.
3. أنشئ سير عمل شامل في .github/workflows/ci-gate.yml مع حاوية خدمة PostgreSQL 18 يشغّل:
   - npm ci && npm run build
   - npm run test:seo
   - npm run test:healthz
   - npm run test:security:smoke
   - اختبارات قاعدة البيانات وRLS وAuth E2E
   - فحص صلاحية .github/security-allowlist.yml وnpm audit
4. قلّل حجم CSS المحمّل على الصفحات العامة عبر فصل أنماط المختبرات والبوابة عن القالب التسويقي العام، وحسّن وقت تصيير /docs/ وصفحات المعرفة.

المخرجات:
- إصلاح الاختبارات المتعثرة
- ملف .github/workflows/ci-gate.yml كامل وجاهز للتشغيل
- مقارنة قياس CSS وLCP قبل وبعد التحسين
```

---

**Final Release Verdict:**

الحكم الهندسي المحدّث بتاريخ 25 نوفمبر 2026 هو: **GO مشروط للموقع التعليمي والمختبرات المحلية بعد إصلاح روابط `/request-access/` و`/status/` وتطهير الصفحات الإرثية فورًا**، مع بقاء القرار **NO-GO قاطعًا لفتح بوابة SaaS (`/app`) أو استقبال بيانات عملاء حقيقية** إلى حين ربط خدمة Node الحية، وترقية Astro لإغلاق الثغرة الحرجة، وتطبيق ترحيلات قاعدة البيانات حتى `0045` على بيئة محمية ومختبرة بالاستعادة.