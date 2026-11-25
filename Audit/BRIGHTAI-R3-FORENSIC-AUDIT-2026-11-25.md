# BRIGHT AI / AIGAS — تدقيق مستقل R3 من الصفر

**25 نوفمبر 2026 | قراءة فقط | GitHub HEAD `773fb6bc5e420ee70e811d5509aceefcaec32a8c`**

## 1. الحكم التنفيذي

**NO-GO للتشغيل المؤسسي والتجاري.** المختبر العام موجود ومتاح للزيارة، لكن ليس تجربة Groq حية ولا دليلًا على عزل مؤسسات أو موافقات تنفيذ فعلية. أقوى نتيجة جديدة: قيد Ledger في الإنتاج يقبل ALLOW/BLOCK/REDACT بينما Firewall والكود الحاليان يعتمدان ALLOW/WARN/REDACT/ESCALATE/DENY. Staging يطابق الخمسة. اختبرت قيد الكتالوج بالقراءة، لا الإدراج. كذلك `/request-access/` مفقود من النشر رغم وجوده في المصدر. لا تفتح بوابات الحماية قبل معالجة السبب.

جرد GitHub: 5,820 ملفًا، 56 ملف Astro في src/pages، 49 ملف TS/JS في src/pages (لا يعني بالضرورة 49 endpoint حية)، 45 ملف migration. الشجرة غير مقتطعة، لكن المحتوى المقروء انتقائي وموجه للفرضيات؛ لا ادعاء مراجعة كل سطر في 5,820 ملفًا. أحدث Commit 17:38:14 UTC؛ Render نشر نفس SHA عند 17:38:59 UTC. لا تنفيذ أو تغيير أو طلب Groq أو اختبار اختراق. هذا التقرير يفحص النص المرفق كفرضيات وليس كمصدر إثبات مستقل.

## 2. النسب الجديدة — تعريف المقام

**44.67%** مؤشر استيفاء العينة الموزونة الجديدة، و**73.17%** تغطية الأدلة الموزونة. عدد الشروط 78، منها 33 تحقق بالمصدر/التكوين (24 مصدر S، 9 قراءة/وصول C)، 24 مخالف F، و21 غير متحقق U. لا تعتبر نسبة الشروط الموزونة نسبة إنجاز SaaS بالكامل أو اعتماد تشغيل. ثُبتت المعايير والأوزان لهذا التقرير بعد جرد نطاق الادعاءات، لا لاختبار أعمى قبل اكتشاف النتائج. لا توجد نسبة بعد تطوير لأن هذه الجولة للقراءة فقط.

المحاور وأوزانها من الهيكل السابق مع **مقام جديد 78 شرطًا بدل 74**؛ التقرير R2 السابق 66.65% لا يقارن مباشرة بهذه النسبة، ولا يجوز وصف الفرق كتراجع في الكود. الأوزان متساوية داخل كل محور. S وجود خاصية محددة بالمصدر، C قراءة تكوين أو وصول، F دليل مخالف، U غير متحقق (لا دليل غياب). S وC=1، F وU=0. Coverage = (S+C+F)/N؛ الإجمالي = مجموع وزن المحور × نسبته / 100. لا N/A في العينة. النتائج المحلية المبلغة من الوكيل لا تمنح نقاط تشغيل مستقلة.

| المحور | الوزن | ناجح / مطلوب | النسبة | التغطية |
|---|---:|---:|---:|---:|
| سجل الأصول والوكلاء | 8% | 3/6 | 50.00% | 50.00% |
| حزم السياسات والتتبع التنظيمي | 8% | 3/6 | 50.00% | 66.67% |
| Firewall | 10% | 3/6 | 50.00% | 83.33% |
| Human Gate | 8% | 3/6 | 50.00% | 66.67% |
| Risk Engine وتقييم النماذج | 12% | 4/6 | 66.67% | 83.33% |
| Ledger وسلامة الأدلة | 10% | 2/6 | 33.33% | 83.33% |
| Groq | 8% | 2/6 | 33.33% | 83.33% |
| تكامل المنتجات الأربعة | 8% | 3/6 | 50.00% | 83.33% |
| التصميم وتجربة المستخدم وRTL | 10% | 2/6 | 33.33% | 50.00% |
| الإتاحة والتحويل التجاري | 5% | 3/6 | 50.00% | 100.00% |
| الأمان والخصوصية | 8% | 2/6 | 33.33% | 66.67% |
| المعمارية والاعتماديات والأداء | 3% | 1/6 | 16.67% | 50.00% |
| النشر وSEO والقياس والمراقبة | 2% | 2/6 | 33.33% | 83.33% |
| الإجمالي | 100% | 33/78* | **44.67%** | **73.17%** |

* الكسر الخام يختلف عن الإجمالي الموزون. لا ترفع الدرجة بسبب ملفات تقرير أو تكرار اختبارات. لا يوجد إصدار تجاري مقبول إذا بقي أي مانع P0 مهما بلغت النسبة.

### مؤشرات تشغيلية منفصلة (ليست جزءًا من النسبة المركبة)

| المؤشر | البسط/المقام | النسبة | ماذا يثبت |
|---|---:|---:|---|
| صفحات المنتجات الأربعة | 4/4 | 100% | HTTP200 فقط |
| المختبرات الأربعة + الموحد | 5/5 | 100% | وصول للعرض فقط |
| app / app/kernel / healthz / readyz / request-access | 0/5 | 0% | 404 لكل الخمسة |
| قرارات Firewall المقبولة في قيد Ledger الإنتاجي | 2/5 | 40% | قبول حرفي، لا إدراج |
| قرارات Firewall المقبولة في قيد Ledger Staging | 5/5 | 100% | قبول حرفي، لا إدراج |
| تغطية RLS policies في الإنتاج | 2/31 | 6.45% | وجود policy فقط |
| تغطية RLS policies في Staging | 43/43 | 100% | وجود policy فقط |
| ملفات migration المسجلة APPLIED في Staging | 32/45 | 71.11% | سجل لا يثبت غياب SQL الباقي |
| E2E حي مستقل للمنتجات الأربعة | 0/4 | 0% مثبت | لم ينفذ؛ ليس فشلًا مثبتًا للأربعة |
| مزود ونموذج معتمدان في القوائم المصدرية | 0/2 | 0% | قائمتان فارغتان |

## 3. التحقيق في الادعاءات البرمجية — ماذا ثبت وما يحتاج تصحيحًا

### P0-01 — انحراف النشر

Render service `srv-d7m5bcjbc2fs73826v20` من نوع static_site ويخدم dist/client. نشر `dep-dc3hq2m8bjmc73bvuan0` بحالة live ومطابق HEAD، وليس خادم Node. `render.yaml:6–16` يحدد web/node، npm ci، npm start، `/readyz/`. السطر 25 وما بعده يحدد AIGAS_APP_ENABLED=false افتراضيًا؛ هذا إقفال مقصود حتى تفويض المالك، وليس خطأ يُلغى عشوائيًا. خدمة Render الفعلية تبني بـpnpm install خلاف الـBlueprint الذي يذكر package-lock.json. لا نثبت DNS/Cloudflare أو الأسرار الفعلية بقراءة هذه الخدمة فقط.

**الإغلاق:** خدمة staging SSR مستقلة، مدير حزم مطابق للـlockfile، فحص readyz/auth/RLS/health، origin صحيح وعدم cache للمسارات الخاصة، rollback، ثم موافقة نشر مستقلة. لا تُفتح البوابة قبل العزل.

### P0-02 — اختلاف قرارات Firewall وLedger وقاعدة البيانات

في `src/server/firewall/core.mjs:10–13` و`src/server/ledger/core.mjs:40` قرارات ALLOW/WARN/REDACT/ESCALATE/DENY. واجهة العرض قد تسمي DENY بـBLOCK. قيد Firewall DB في البيئتين يقبل الخمسة. قيد `aigas_ld_events_check` في Production يقبل ALLOW/BLOCK/REDACT فقط لحدث firewall.decision.recorded، ويفتقد request_fingerprint ضمن المفاتيح المسموح بها؛ Staging يقبل الخمسة وrequest_fingerprint الاختياري. النتيجة احتمال رفض إدراج WARN/ESCALATE/DENY أو metadata المرتبطة ببصمة الطلب. لا تُعالج بتحويل كل DENY إلى BLOCK داخل التخزين أو تعطيل القيد. أصلح delta المخطط، واعتمد mapping للعرض وحده، وافحص الإدراج والـrollback ومرجع الأحداث على Staging فقط. يوجد قيد guard binding في Production بحالة NOT VALID؛ يلزم إثبات فحص البيانات القديمة قبل اعتماد اكتمال الترحيل. قيد synthetic reference في Staging أيضًا NOT VALID؛ لا تفترض أنه تحقق لكل الصفوف القديمة.

| المكون | Production | Staging |
|---|---:|---:|
| جداول AIGAS | 31 | 43 |
| RLS flags | 31 | 43 |
| جداول لها سياسات | 2 | 43 |
| السياسات | 2 | 93 |
| aigas_runtime | غائب | موجود |
| aigas_hg_delegations | غائب | موجود |
| aigas_hg_grants | غائب | موجود |
| aigas_trial_requests | غائب | موجود |
| aigas_self_service_trials | غائب | موجود |
| aigas_exploration_grants | غائب | موجود |
| aigas_ld_events_chain_guard function | غائب | موجود |

نفذنا COUNT(*) لكل جدول AIGAS في public بالإنتاج: **31/31 جداول صفر صفوف** وقت القراءة. لا يشمل هذا جداول غير AIGAS أو مخازن خارجية، ولا يثبت عدم وجود مستخدمين في Neon Auth. سجل Staging 32 APPLIED وآخر اسم 0036؛ المصدر 45 migration. لا تُعد تشغيل 45 ملفًا بلا مصالحة checksums وكتالوج وأدوار وtriggers؛ حتى migration غير المسجلة قد يكون أثرها موجودًا عبر إصلاح لاحق. نقص سياسات RLS ليس إثبات تسريب. الحماية لا تُختزل في عدد policies.

### P0-03 — Groq: سلسلة اعتماد لا مجرد API key

| الموضع | الحقيقة | المعالجة الصحيحة |
|---|---|---|
| public-sandbox-limiter.mjs:3–4 | 503 DISABLED دائمًا؛ مسار POST موجود في المصدر لكنه non-prerender | إبقاء الإقفال حتى اعتماد public egress، ثم مسار مصرح بضوابط موحدة |
| kernel/env.mjs:16–22 | صيغة AIGAS_SC_*_API_KEY فقط، وPUBLIC_GROQ مرفوض | مواءمة env/Blueprint/runbook مع المفتاح الخادمي، دون إظهار القيمة |
| secure-chat/models.mjs:3 وfirewall/provider.mjs:9 | القائمتان فارغتان | اعتماد نموذج ومزود ونطاق ومدة وبيانات وتسعير، لا hardcode تجاوز |
| groq-gateway.mjs:49–75,99–145 | ملف موجود مسبقًا بمسار مطلق، قفل ذري، يوم/شهر، concurrency، timeout | provisioning ومصالحة معتمدة؛ مخزن مشترك متين عبر النسخ أو بديل ذري مركزي |
| render.yaml:39–42 | يسجل GROQ_API_KEY وGROQ_MODEL لا أسماء المفتاح والميزانية المطلوبة | تصحيح مواصفات النشر محليًا، لا ادعاء أن الإعداد المستهدف يحتويها |
| demo/governance.astro:22 | CSP connect-src none وform-action none | حماية مقصودة للمختبر المنعزل؛ لا إزالة عامة للسماح لـGroq |

متغيرات يلزم فحص أسمائها فقط: AIGAS_SC_GROQ_API_KEY، GROQ_MODEL، AIGAS_GROQ_BUDGET_FILE، AIGAS_GROQ_DAILY_BUDGET_USD، AIGAS_GROQ_MONTHLY_BUDGET_USD، AIGAS_GROQ_MAX_CONCURRENCY، AIGAS_GROQ_TIMEOUT_MS، AIGAS_GROQ_DISABLED. تأكد من نموذج حساب المالك ومعالجة البيانات والاحتفاظ والمنطقة قبل أي طلب. لا مفتاح من محادثة قديمة. لا .env محلي متاح؛ لا طلب حي.

**خطر تشغيلي إضافي من المصدر:** التعليقات في gateway تؤكد احتفاظ الطلب المتعطل بالحجز والـactive حتى مصالحة المشغل؛ lock file المتروك أو مخزن غير مشترك قد يغلق الخدمة، وهو سلوك fail-closed لا حجة لإزالة الميزانية. خطط لرصد ومصالحة القفل والحجوزات وعدم تجاوز السقف عبر عدة مضيفين. اقتراح الملف المرفق الاكتفاء بـIP limiter في الذاكرة غير كافٍ لمنع تجاوز الميزانية المجمعة. استخدم بيانات اصطناعية محددة وقابلة للتحقق؛ لا ترسل نصوصًا حساسة إلى Groq بغرض اكتشافها قبل التنقيح. افصل حدود التفويض عن رأي النموذج.

### P0-04 — الاعتماديات وسلسلة التوريد

package-lock.json يثبت astro 6.4.8 و@astrojs/node 10.1.4 و433 مدخل packages. [GHSA-qh8j-hqjv-7m4x](https://github.com/advisories/GHSA-qh8j-hqjv-7m4x) يذكر الإصلاح في 11.1.3. `scripts/server.mjs:20–46` يتضمن حواجز Host ومسار غير آمن كتعويض، و`docs/DEPENDENCY-SECURITY-2026-11-10.md` يذكر نتائج تاريخية لأمن الحزم. هذه ليست نتيجة npm audit جديدة ولا إثبات استغلال على الموقع الثابت. أصلح النسخة مع توافق Astro والـadapter، اختبر origin مباشرة في بيئة مصرح بها، حافظ على compensating controls حتى تحقق البديل، افحص advisories لكل lockfile بعد الترقية. لا تسمح بتغيير جماعي غير مدروس في الإصدارات.

### P0-05 — عائق المبيعات

`src/pages/request-access.astro` يحدد prerender=false، ويعرض خيارات demo/trial/beta/production ويعتمد isPortalEnabled وAuth. المختبر الموحد في `src/pages/demo/governance.astro:139` يحيل إليه. حيًا `/request-access/` 404، وصفحة التواصل تعيد الإحالة إليه. هذا مسار مبيعات موجود في المصدر لكنه معطل بالنشر. لا تقل إن الموقع لا يحتوي CTA أصلًا. صفحة `/contact/` 200؛ تولد مسودة محلية وقنوات تواصل، لا إرسال تلقائي. اعتمد مسارًا عامًا يعمل دون بوابة خاصة: طلب عرض نطاق واضح، ملخص اصطناعي اختياري يختار العميل مشاركته، إثبات وصول الطلب عبر قناة مصرح بها، عدم ادعاء نجاح إرسال غير منفذ، وإتاحة مسار 48h منفصل عند جاهزيته.

## 4. تدقيق كل منتج — وظائف حقيقية وحدود التجربة

### Firewall

المصدر العام `src/shared/firewall-demo.mjs:1–19` يطابق أربع عبارات حرفية، حد 500 حرف، وتنقيح DEMO-0000 فقط؛ ALLOW افتراضي تعليمي. محرك الخادم يملك خمسة قرارات وأولوية حتمية لكنه يعتمد CONTAINS في قيد DB الحالي. لا تثبت هذه البنية كاشفًا شاملًا للهوية السعودية أو IBAN أو البريد أو injection. أضف محرك typed matchers بإصدار وقواعد اختبار، قبل أي مزود. دعم locale والتحقق من صيغة IBAN/checksum والضوابط، واختبارات false positive/negative، لا ادعاء منع كل تسريب. بعد الموافقة على AI يمكن أن يشرح النتائج أو يقيم سياقًا منقحًا ولا يملك قلب حظر حتمي. اعرض Policy Library، Asset scope، decision table، input/output controls، Finding، Evidence ID.

### Human Gate

في المصدر مسار synthetic-agent يكوّن pending review مرتبطًا بالبصمة والإصدار والمراجع ويستعمل local provider فقط. مختبر الحوكمة يربط مراجعة محلية بنتيجة REVIEW_REQUIRED أو HIGH من نفس نسخة الأصل، ويرفض إعادة حسم المصدر. لا يثبت هذا التفويض المؤسسي أو الاستئناف الفعلي لـGroq. الجداول اللازمة في Production غائبة. أضف Review Inbox ومراحل Legal/Security/Business حسب مستوى الخطر، لا self-approval، expiry، single-use، revalidation، منع تغير الطلب بعد المراجعة. حافظ على فرق persona اصطناعي عن هوية مخولة.

### Risk Engine

يوجد replay حسابي للمصنفات (precision/recall/FPR/FNR/accuracy ومقاييس مجموعات، حد 20 ومقام صفري)، ونتائج مؤرخة مع Findings. هذا يصحح الادعاء بأن كل تقييم عدالة غائب، لكنه لا يثبت تشغيل نموذج حقيقي أو drift؛ العينات ثابتة. أضف تقييمًا مستقلًا على dataset مصرح به، فصل metrics عن الاستنتاجات القانونية، sample size، نطاق/عدم يقين، تاريخ ونسخة dataset/model، إعادة تقييم ذات بيانات جديدة. أضف catalog من مخاطر وضوابط مرتبطة بمصادر وإجراءات تصحيحية، لا نسبة انخفاض عشوائية بمجرد تشغيل ضابط. تقييم LLM hallucination يعتمد ground truth/مهام محددة، LLM judge مساعد لا حكم نهائي. Shadow AI assessment استبيان وجرد يدوي موسوم، لا ادعاء اكتشاف شبكي.

### Ledger

core فيه SHA-256 وcanonical metadata وverify، ويوجد digest لحزمة assessment في registry؛ ولكن المختبر الموحد `governance-demo.ts:171–177` يصدّر حالة الجلسة JSON مباشرة وحدث ledger.sample مجرد RECORDED في `governance.mjs:104–108`. **هذه فجوة في الربط بين الميزة التشفيرية وتجربة الحوكمة، لا غياب Ledger كله.** استخدم سلسلة حقيقية موحدة لكل حدث، sequence/correlation/asset version، تصدير Hash Manifest وCLI verifier، Tamper Test على نسخة، لا تغيير سجل الأصل. بصمة سلسلة لا تساوي توقيعًا أو إثبات عدم إعادة كتابة السلسلة بالكامل. إذا أضفت توقيعًا، يلزم مفتاح وإدارة ثقة ومرساة تحقق مستقلة؛ وإلا وصف Hash-Verified بدقة.

### Kernel وSecure Chat

الـHero الحي يذكر خمسة منتجات مستقلة + Kernel، والنطاق المطلوب أربعة؛ لا تغير Hero أو تحذف Secure Chat تلقائيًا. أوصي بإبقائه وحدة مستقلة خارج نطاق تجربة الحوكمة، ويمكن إدخال واجهة محادثة اختيارية إذا اقتضت رحلة المنتج، دون تحويل المنصة إلى chat. سجّل قرار نطاق مستقلًا لكل صفحة وsitemap والاختبارات. Kernel طبقة مشتركة للهوية والسجل والسياسات والتفويض، لا منتج إضافي مفوتر. README يحتوي وصف Gemini/Redis و/api/ai/chat التاريخي مع تنبيه واضح بتاريخ 8 نوفمبر؛ يحتاج Current architecture في الأعلى وربط الأرشيف، لا حذف الأدلة التاريخية.

## 5. تجربة المستخدم والنشر العام

Firecrawl maxAge=0 أثبت في هذه الجولة:

| المسار | HTTP | المعنى |
|---|---:|---|
| / و/products/ | 200 | الموقع والكتالوج |
| /products/firewall/ وhuman-gate وrisk-engine وledger | 200 لكل الأربعة | صفحات تسويق/مختبر |
| /demo/firewall/ وhuman-gate وrisk-engine وledger | 200 لكل الأربعة | أمثلة مستقلة |
| /demo/governance/ | 200 | جرد، حزم، أربعة أقسام |
| /contact/ | 200 | مسودة وقنوات تواصل |
| /app/ و/app/kernel/ | 404 | التطبيق محمي غير منشور |
| /healthz/ و/readyz/ | 404 | لا إثبات runtime |
| /request-access/ | 404 | خلل رحلة التحويل |
| /robots.txt و/sitemap.xml | 200 | وصول ملفات SEO، لا اعتماد الفهرسة |

19 مسارًا إجمالًا (14 HTTP200، 5 HTTP404) ضمن هذه العينة، وليس الموقع كله. لا إرسال POST أو تشغيل مسارات التجربة من هذه القراءة. المختبر الموحد static/prerender مع CSP يقفل الاتصال: 30 دقيقة و10 أصول و100 حدث بالذاكرة. توجد حزم عرض privacy/supervision مختلفة عن server governance registry/internal-pack؛ لا تدّع أن واجهة العرض تستدعي مكتبة الخادم أو تحفظ أدلة مؤسسية. افصل Public Governance Workspace الاصطناعي، Trial 48h المخول، Commercial Production. اجعل لكل منتج شاشة عمل متخصصة مع جدول حالات، inspector، نتائج واضحة، export، links من الأصل إلى الضابط والدليل. لا تضف زخارف أو نصوص مبالغة؛ حافظ على عبارات الحقيقة لكن استخدم وسمًا مختصرًا «بيانات افتراضية — مساحة معزولة» واذكر بدقة العمليات التي تعمل. لا تحذف الإفصاح ولا تصف replay بأنه Live AI. Hero محمي بلا تغييرات من طرفنا؛ التصميم المرئي الكامل وWCAG وقياسات الأداء لا تزال غير متحققة.

**نتيجة Browser Use المستقلة:** فحص [مختبر الحوكمة](https://brightai.live/demo/governance/) و[طلب الوصول](https://brightai.live/request-access/) عند 1440×900 و390×844؛ المختبر داكن وRTL، تنقل جانبي على الديسكتوب يتحول إلى قائمة على الجوال، لا تجاوز أفقي في العرض المفحوص، وأدوات الموافقة والتصدير أسفل الشاشة الأولى. الصفحة تصرح بالبيانات الاصطناعية والجلسة المؤقتة. رابط [تجربة 48 ساعة](https://brightai.live/request-access/?track=trial) يعيد 404 كذلك. الفحص بصري وقراءة DOM فقط؛ لا تفاعل وظيفي أو اختبار وصول شامل. لا تدخل نتيجة URL ذي query في مقام 19 مسارًا الأساسي. 

## 6. المقارنة التنافسية — تسع منصات

استندت إلى صفحات المنتج/التوثيق العامة، لا حسابات داخلية أو اختبارات منافسين. هذه ادعاءات معلنة من الموردين، لا شهادات تشغيل مستقلة. لا أوافق على عبارة أن 70% من المنافسين لا يملكون runtime enforcement، أو أن العربية ملعب حصري، أو أن أي عميل سيشتري في 3 دقائق. المنافسون المذكورون يعلن بعضهم runtime enforcement وحوكمة أفعال ووكلاء فعلية، ولذلك لا يوجد أساس لترتيب AIGAS فوقهم اليوم.

| المنصة والمصدر | ما تعلنه | فجوة AIGAS المثبتة / اتجاه التطوير |
|---|---|---|
| [Credo AI](https://www.credo.ai/product) | سجل الأصول والوكلاء وحزم تنظيمية وأدلة | حزمة داخلية فقط؛ تحويل متطلبات رسمية لفحوص قابلة للتتبع واعتماد إصدار |
| [Holistic AI](https://go.holisticai.com/) | اختبار الأداء والعدالة ومراقبة الانحراف وضوابط runtime | replay ثابت؛ تقييم datasets/LLM/monitoring مستقل |
| [Trustible](https://trustible.ai/platform-overview/) | Intake وinventory ومخاطر وموردون ومراجعات ودورة حياة | سجل ذاكرة وعقد داخلي؛ مسار لجان وتفويض دائم |
| [Enzai](https://www.enz.ai/) | اكتشاف Shadow AI وحوكمة الأفعال والإنفاذ | synthetic-agent موجود؛ لا اكتشاف مؤسسي أو tool gateway متصل |
| [Saidot](https://www.saidot.ai/product) | graph يربط أصولًا ومخاطر وضوابط وأدلة | catalog risk/control قابل لإعادة الاستخدام، لا أعداد مخترعة |
| [Lumenova AI](https://www.lumenova.ai/solutions/ai-security-teams/) | self-hosted gateway وضوابط ومعالجة داخل نطاق العميل | إثبات Node أولًا ثم حزمة تثبيت وrestore وegress موثقة |
| [Monitaur](https://www.monitaur.ai/ai-governance) | حوكمة نماذج للقطاعات المنظمة ومنها التأمين والمالي | قوالب قطاعية وتقييمات وأدلة بمراجع معتمدة |
| [Asenion](https://asenion.ai/controlgen) | policy-to-code وحزم قابلة لإعادة الاستخدام والتحقق | محول وثيقة إلى مسودة ضابط typed، مراجعة بشرية واختبار قبل التفعيل |
| [VerifyWise](https://verifywise.ai/faq) | source-available وself-hosted؛ الترخيص التجاري له شروط | توثيق verifier وSDK وبيئة تقييم؛ لا ادعاء أنه مجاني بلا قيود أو open source مطلقًا |

**الأولوية التنافسية:** 1) إتاحة فعلية آمنة، 2) حزم سعودية مرجعية PDPL/SDAIA وسياقات SAMA/الصحة وفق انطباقها، 3) حوكمة أفعال الوكلاء، 4) Risk & Control Catalog، 5) Developer Integration مع snippets فعلية مرتبطة بعقد API مثبت، 6) تقييم Shadow AI اليدوي ثم تكاملات اكتشاف مخولة، 7) حزمة مشتريات وتثبيت مستقلة قابلة للتكرار. ISO 42001 معيار لا قانون عام، ولا تترجم وثائق محمية حرفيًا. لا تُفعّل سياسة مولدة من Groq مباشرة. لا تكتب أمثلة SDK لعناوين API غير عاملة على النطاق الحي باعتبارها جاهزة؛ وسم Local/Planned عند الحاجة.

## 7. SEO / Analytics / Conversion

Search Console `sc-domain:brightai.live`، web، final من 26 أكتوبر إلى 22 نوفمبر: 783 impressions، 12 clicks، CTR 1.53%، متوسط الموضع 15.69. 10 صفوف صفحات أولى مسترجعة؛ ليست جرد فهرسة. من النتائج: مقال PDPL employee data rights له نقرتان من 3 مرات ظهور، صفحة ai-risk-classification نقرتان من 6؛ عينات صغيرة جدًا لا تتنبأ بالتحويل. robots.txt متاح ويشير إلى sitemap-index.xml؛ sitemap.xml 200. لا نسبة فهرسة من site: search، يلزم GSC index coverage/URL inspection وجرد canonical/redirects. لا ضمان ترتيب.

Windsor GA4 Property 551941072، الفترة نفسها:

| Hostname | Sessions | Views | Events |
|---|---:|---:|---:|
| brightai.live | 152 | 992 | 1,899 |
| 127.0.0.1 | 45 | 428 | 791 |
| localhost | 3 | 232 | 376 |
| brightai-4x39.onrender.com | 1 | 1 | 3 |

المجموع الحسابي للصفوف 201 جلسة؛ 48/201=23.88% من الصفوف المجمعة تخص localhost/127.0.0.1. التقسيم حسب hostname قد يحسب جلسة متعددة النطاقات أكثر من مرة؛ لا نسمي الإجمالي عدد زوار فريدين. 152 ليست عملاء محتملين ولا تدل على مبيعات. المصدر `GoogleAnalytics.astro:63–66` يهيئ Measurement ID G-9LMB4PGTWJ ويحمّل gtag.js الصحيح؛ لا نضيف سكربتًا ثانيًا. افصل production hostname عن dev عبر إعداد بيئة/stream أو تقرير مفلتر، ثم تحقق من الاستقبال والخصوصية. OpenSEO يرجع مشروع Default بلا domain؛ لا تثبت خاصية GA4 المطابقة بهذه القراءة. Similarweb رفض endpoint بـ401، فلا تخترع traffic خارجيًا. قياس المنتج المطلوب (metadata فقط) demo_started، asset_created، policy_applied، assessment_completed، evidence_exported، access_requested، qualified_lead؛ لا تسرب المحتوى أو IDs خاصة. مختبر الحوكمة CSP يمنع الشبكة، فلا تغيّرها لأجل analytics فقط؛ استخدم مسارًا معتمدًا للقياس خارج مساحة الاختبار أو اقبل عدم جمع الحدث.

## 8. اختبارات وCI وملفات مكررة

GitHub Actions على HEAD الحالي: Accessibility and performance smoke — failure ([run](https://github.com/YEEEAE/BRIGHTAI/actions/runs/45666864721)). سبب الخطوة غير مثبت في هذه الجولة. تقرير الوكيل `Audit/groq-release-2026-11-25/REPORT.md` على مرشح a1a2a3e… + patch: 87/91 → 91/91 مركزة، ثم 92/92 بعد إضافة اختبار؛ PostgreSQL 12/13، فشل firewall-review-binding عند السطر 204 حيث لم يحمل رد 403 الحقل policy.obligations، وAuth browser فشل عند 410 بغياب data-access-status، و4/4 وظائف محلية اصطناعية. لا إعادة تشغيل مستقلة. التحقق المحلي لا يساوي نجاح HEAD الحي. لا حذف أو تخفيف assertions. راجع 7 ملفات source ذات لاحقة 2: GoogleAnalytics 2.astro، RiskDemo 2.astro، BaseLayout 2.astro، workshop-preview/[view] 2.astro، kernel 2.css، secure-chat 2.css، site 2.css؛ مجرد أسماء لا تثبت كودًا ميتًا. احم migrations وملفات الأمن والأدلة. لا حذف من هذا التدقيق.

## 9. سجل الأدوات وحدود التحقق

| الأداة | نتيجة الجولة |
|---|---|
| GitHub | HEAD، tree، ملفات محورية، CI؛ read-only |
| Neon | SELECT كتالوج، قيود، جداول، COUNT(*)، migration ledger؛ لا كتابة |
| Render | نوع الخدمة وdeploy؛ لا تغييرات |
| Firecrawl | 19 مسارًا live، لا عمليات |
| Browser Use | COMPLETED: فحص بصري عند 1440×900 و390×844؛ مختبر الحوكمة ظاهر، وطلب الوصول 404 في المقاسين؛ لا عمليات |
| Figma | whoami عاد؛ لم نفتح تصميمًا داخليًا أو نعدله |
| MagicPath | قائمة مشاريع knowledge/navigation؛ لا prototype جديد |
| Lazyweb | بحث flow أعاد صفر نتائج مطابقة؛ لا دليل UX إضافي |
| Better Design | قواعد مراجعة كاملة للمشروع؛ ليست نتيجة قياس مرئي |
| Windsor GA4 | بيانات hostname حقيقية للفترة |
| HYPD Search Console | خاصية وبيانات أداء بحث فعلية |
| OpenSEO | Default بلا domain؛ لا إسناد لخاصية صحيحة |
| Similarweb | 401؛ لا بيانات |
| Linear | قراءة قائمة teams أعادت نتيجة؛ لم تُنشأ أو تُعدل قضايا |
| PostHog | واجهة متاحة لكن مشروع BrightAI غير مؤكد هنا؛ لم تُقرأ بيانات مشروع غير مثبت |
| Auditin72، Modern Web Guidance، Sentry، Open Design، Animation Maker | لم تظهر إجراءات مباشرة قابلة للاستدعاء؛ بحث الإضافات لم يظهر تطابقًا مباشرًا؛ لا ادعاء استخدامها |

محدودية: لا نسخة مشروع محلية أو .env، لا تشغيل اختبارات أو مزود أو تعديل، لا فحص كل 5,820 ملفًا، ولا مقارنة صور قبل/بعد. نص الملصق مصدر نطاق الفرضيات لا مصدر إثبات. لا تُستخدم أدوات تصميم أو SEO لإثبات أمان DB.

## 10. بوابات القرار والمسار الحرج

| الأولوية | المانع | معيار إغلاق موثق |
|---|---|---|
| P0 | SSR وapp/readyz/request-access | خدمة Node آمنة وجميع المسارات المقصودة تعمل؛ مسار تواصل عام مستقل |
| P0 | Firewall/Ledger schema parity + RLS + role | قيد 5/5 وحارس ودور؛ مصالحة migration؛ عزل وrollback على staging مخول |
| P0 | Groq اعتماد/ميزانية/سر/خروج | سجل approved، ميزانية ذرية، طلب اصطناعي مصرح؛ DENY لا يرسل |
| P0 | سلسلة التوريد وفشل CI/Auth/Review binding | ترقية متوافقة ونتائج CI وE2E على SHA، لا ادعاء نجاح اختبارات غير منفذة |
| P1 | Registry/pack/evidence split | تجربة واحدة تربط الإصدار والفحص والمراجعة والحزمة؛ بدون بيانات إنتاج |
| P1 | تقييم النماذج والمراقبة | dataset/model version، metrics قابلة للتحقق، قياسات جديدة لا replay فقط |
| P1 | التحويل وقياس GA4 | CTA لا 404، فصل dev، وصول طلب فعلي مصرح، عدم تسرب |
| P1 | المنافسة المحلية | حزم مرجعية، agent-tool boundaries، risk catalog، integration docs، حزمة استضافة |

قرارات مستقلة: Public synthetic **متاح للزيارة**؛ قبول وظيفي حي **NOT_VERIFIED**؛ Enterprise 48h وCommercial **NO-GO**. 80% لكل محور شرط غير محقق، ولا يعوض P0. أوصي بترتيب 1) مصالحة المصدر والمخطط والتبعيات والنشر الآمن، 2) إتاحة CTA عام حقيقي، 3) توحيد رحلة الحوكمة وLedger، 4) اعتماد Groq، 5) حزم السياسات والتقييمات وAgent، 6) جاهزية تجارية وتحقق نهائي. لا حاجة لهدم المنتجات الحالية. 

## 11. سجل الشروط الذرية (78)

| ID | الشرط | الحالة | الدليل |
|---|---|---:|---|
| REG-01 | عقد يميز النظام والنموذج والوكيل والمورد وحالة الاستخدام | S | src/server/governance/contract.mjs:6–26 |
| REG-02 | إصدارات ومراجع مستقلة وحدود أدوات للأصل الاصطناعي | S | src/server/governance/registry.mjs؛ contract.mjs:15–26 |
| REG-03 | جرد وتغيير الأصل في جلسة الحوكمة المشتركة | S | src/demo/governance.mjs:21–55 |
| REG-04 | سجل مؤسسي دائم ومشترك بين جلسات المستخدم | U | المختبر في ذاكرة المستند؛ لا إثبات تشغيل سجل دائم |
| REG-05 | دورة حياة Intake واعتماد وإعادة مراجعة مكتملة في البيئة المستهدفة | U | لا E2E مخول |
| REG-06 | اكتشاف Shadow AI من مصادر مؤسسية موصولة | U | لا تكامل اكتشاف متحقق |
| POL-01 | حزمة داخلية محددة الإصدار والانطباق | S | src/server/governance/internal-pack.mjs:10–41 |
| POL-02 | متطلبات وفحوص ودليل متوقع ومالك | S | src/server/governance/contract.mjs:28–48 |
| POL-03 | تتبع وتصدير بصمة assessment للحزمة الداخلية | S | src/server/governance/registry.mjs:63–113 |
| POL-04 | حزم خارجية قابلة للتطبيق من PDPL/SDAIA وغيرها | F | packSchema.source.type = INTERNAL فقط |
| POL-05 | مرجع تنظيمي خارجي موثق مرتبط بفحص وFinding | U | لم يثبت عقد خارجي أو خريطة قانونية |
| POL-06 | اعتماد تغيير السياسة وتطبيقه حيًا عبر المؤسسات | U | لا تشغيل مؤسسي |
| FW-01 | القرارات الخمسة الحتمية في المحرك | S | src/server/firewall/core.mjs:10–13 |
| FW-02 | تقديم DENY والإقفال عند سياسة غير صالحة | S | src/server/firewall/core.mjs:63–75 |
| FW-03 | الفحص العام يتجاوز أربع مطابقات حرفية إلى كاشف بيانات حساس متحقق | F | src/shared/firewall-demo.mjs:1–19 |
| FW-04 | محاكاة فعل وكيل بقيود ثابتة وربط طلب مراجعة | S | src/server/governance/synthetic-agent.mjs:16–90 |
| FW-05 | مزود Firewall معتمد | F | src/server/firewall/provider.mjs:9؛ approvedProviders=[] |
| FW-06 | فحص المدخل والمخرج مع مزود فعلي ومعالجة القرارات الخمسة | U | لم يرسل طلب Groq ولم ينفذ E2E |
| HG-01 | ربط تصعيد اصطناعي ببصمة طلب وسياسة | S | src/server/governance/synthetic-agent.mjs:30–71 |
| HG-02 | عقد مراجع مستقل داخل سجل الحوكمة | S | src/server/governance/contract.mjs:22–26 |
| HG-03 | واجهة مراجعة وقبول ورفض للجلسة | S | src/demo/governance.mjs:89–99 |
| HG-04 | جدولا delegations وgrants موجودان في الإنتاج | F | Neon SELECT to_regclass: كلاهما NULL |
| HG-05 | استئناف موثق بعد الموافقة مع منع إعادة الاستخدام في الهدف | U | تقرير الوكيل: فشل firewall-review-binding؛ لم يعد الاختبار |
| HG-06 | موافقات متعددة أدوار بمسار قانوني وأمني وتجاري حي | U | لا اختبار مخول |
| RE-01 | حساب خطر من الاحتمال والأثر داخل المختبر | S | src/demo/governance.mjs:71–75 |
| RE-02 | مقاييس تصنيف مفصلة: precision/recall/FPR/FNR/accuracy | S | src/server/risk-engine/evaluation.mjs:25–35 |
| RE-03 | معالجة المقام الصفري والعينة الصغيرة | S | src/server/risk-engine/evaluation.mjs:17–35 |
| RE-04 | Finding مؤرخ وإعادة عرض تقييم سابق | S | src/demo/governance.mjs:77–87 |
| RE-05 | تقييم نموذج موصول على بيانات مستقلة مصرح بها ومراقبة drift | F | evaluation.mjs:1,55–60 synthetic replay ثابت، لا اتصال في المختبر |
| RE-06 | منهج الخطر المتبقي مع قبول مخول ومكتبة قطاعية كاملة في الهدف | U | لا تشغيل مؤسسي أو اعتماد منهج في هذه الجولة |
| LD-01 | SHA-256 وملف تعريف سلسلة في الكود | S | src/server/ledger/core.mjs:4–17,46–60 |
| LD-02 | عقد تصدير assessment ببصمة داخل سجل الحوكمة | S | src/server/governance/registry.mjs:113 |
| LD-03 | قيد إنتاج Ledger يطابق القرارات الخمسة | F | Neon aigas_ld_events_check يقبل ALLOW/BLOCK/REDACT فقط |
| LD-04 | حارس سلسلة قاعدة البيانات موجود في الإنتاج | F | Neon pg_proc: chain_guard=0 |
| LD-05 | تصدير مختبر الحوكمة نفسه يتضمن سلسلة hash قابلة لإعادة التحقق | F | src/scripts/governance-demo.ts:171–177 يصدر JSON.stringify(state)؛ events لا تحمل hash chain |
| LD-06 | تحقق مستقل من حزمة الإصدار النهائي في البيئة المستهدفة | U | تقرير محلي على مرشح سابق؛ لا إعادة اختبار |
| AI-01 | Gateway بخادم وميزانية وحدود ومهلة | S | src/server/ai/groq-gateway.mjs:49–75,99–145 |
| AI-02 | حماية اسم المفتاح ومنع PUBLIC_GROQ | S | src/server/kernel/env.mjs:16–22 |
| AI-03 | قائمتا اعتماد نموذج ومزود غير فارغتين وصالحتين | F | secure-chat/models.mjs:3؛ firewall/provider.mjs:9 |
| AI-04 | المسار العام متاح لإرسال اصطناعي معتمد | F | public-sandbox-limiter.mjs:3–4؛ 503 DISABLED |
| AI-05 | Blueprint يصرح بأسماء اعتماد المفتاح المخصص والميزانية المطلوبة | F | render.yaml:39–42: GROQ_API_KEY وGROQ_MODEL فقط؛ env.mjs:17؛ gateway.mjs:102–104 |
| AI-06 | إثبات مفتاح ونموذج وميزانية صالحة واستدعاء حي مصرح | U | لا .env متاح ولا اختبار خارجي |
| INT-01 | سياق أحداث مشترك حسب الأصل والإصدار في المختبر | S | src/demo/governance.mjs:21–110 |
| INT-02 | محاكاة agent تستدعي core وguard وHuman Gate binding | S | src/server/governance/synthetic-agent.mjs:1–90 |
| INT-03 | المراجعة في المختبر ترتبط بفحص أو خطر من النسخة الحالية | S | src/demo/governance.mjs:89–99 |
| INT-04 | مسار عام حي يوقف Groq ثم يستأنفه بإذن صالح | F | demo prerender وCSP connect-src none؛ publicSandbox disabled |
| INT-05 | تسجيل كل حدث عام في سلسلة Ledger قابلة للتحقق | F | governance.mjs:104–108 + governance-demo.ts:174 |
| INT-06 | رحلة أصل→حزمة تنظيمية→فحص→معالجة→قرار→دليل في الهدف | U | لا E2E للبيئة المستهدفة |
| UX-01 | صفحة Overview وجرد وحزم وأربعة أقسام متاحة | C | Firecrawl /demo/governance/ 200 |
| UX-02 | صفحات المنتجات الأربعة تعرض تجارب متخصصة وروابط | C | Firecrawl 4/4 HTTP200 |
| UX-03 | تفاعل كامل مستقل لجميع الشاشات والأحجام | U | Browser Use تحقق بصريًا من صفحتين على 1440 و390؛ لا اختبار كل الشاشات أو المهام |
| UX-04 | إمكانية الوصول والأداء عبر CI ناجح على HEAD | F | GitHub Actions 45666864721: failure |
| UX-05 | مطابقة بصرية وسلوكية للـHero قبل وبعد | U | لا مرجع لقطات Hero متطابقة |
| UX-06 | جودة RTL وkeyboard وWCAG 2.2 AA مثبتة لكامل النطاق | U | لا قياس شامل |
| PUB-01 | 4/4 صفحات المنتجات العامة تفتح | C | Firecrawl HTTP200 |
| PUB-02 | 4/4 مختبرات مستقلة تفتح دون حساب | C | Firecrawl HTTP200 |
| PUB-03 | المختبر الموحد يفتح دون حساب | C | Firecrawl /demo/governance/ 200 |
| PUB-04 | بوابة التطبيق وKernel تفتحان | F | /app/ و/app/kernel/ 404 |
| PUB-05 | طلب الوصول يعمل من CTA العام | F | /request-access/ 404؛ governance.astro:139 |
| PUB-06 | تجربة 48 ساعة وعملية التسجيل مثبتتان في الهدف | F | جدولا trial وexploration غائبان؛ بوابة 404 |
| SEC-01 | RLS enabled على جداول الإنتاج | C | Neon 31/31 flags |
| SEC-02 | جميع جداول Staging لها سياسات RLS | C | Neon 43/43؛ 93 سياسة |
| SEC-03 | جميع جداول الإنتاج لها سياسات RLS مناسبة | F | Neon 2/31 فقط؛ لا ادعاء تسريب |
| SEC-04 | دور تشغيل aigas_runtime موجود في الإنتاج | F | Neon pg_roles: 0 |
| SEC-05 | اختبار عزل مؤسسات وجلسات في الهدف | U | لم ينفذ اختبار مصرح |
| SEC-06 | اعتماد معالجة البيانات وإقامتها وسياسة الحذف والمزود | U | لا دليل اعتماد الهدف |
| ARC-01 | Blueprint يحدد Node SSR وreadiness | S | render.yaml:6–16 |
| ARC-02 | محول Astro في إصدار يعالج GHSA-qh8j-hqjv-7m4x | F | package-lock.json @astrojs/node 10.1.4؛ fixed 11.1.3 |
| ARC-03 | مدير حزم البناء المنشور يطابق lockfile المقصود | F | Render pnpm install؛ render.yaml npm ci؛ package-lock موجود |
| ARC-04 | npm build والتحقق الأمني المستقل على HEAD | U | لا checkout أو تشغيل مستقل |
| ARC-05 | نظافة الملفات مثبتة بعد تحليل الاعتماديات | U | 7 ملفات بلواحق 2؛ ليست دليل حذف |
| ARC-06 | LCP/INP/CLS مقاسة على كل رحلة | U | لا قياس ميداني أو مختبري شامل |
| DEP-01 | Deploy مطابق SHA الحالي | C | Render dep-dc3hq2m8bjmc73bvuan0 live |
| DEP-02 | خدمة النشر الفعلية Node وتعرض readiness | F | Render static_site dist/client؛ /readyz/ 404 |
| DEP-03 | مصالحة سجل ترحيلات Staging مع 45 ملفًا | F | 32 APPLIED؛ 13 بلا سجل APPLIED، ليس إثبات عدم تطبيقها |
| DEP-04 | robots.txt وsitemap.xml متاحان | C | Firecrawl كلاهما 200؛ robots يشير sitemap-index.xml |
| DEP-05 | قياس GA4 للحركة الحية دون اختلاط تطوير | F | Windsor: 48 جلسة localhost/127.0.0.1 ضمن الخاصية |
| DEP-06 | مراقبة أخطاء وتنبيهات وفهرسة شاملة مثبتة | U | GSC يقيس البحث فقط؛ Sentry/PostHog لم تثبت وجهتهما |

## 12. المراجع والأدلة

- [GitHub HEAD](https://github.com/YEEEAE/BRIGHTAI/commit/773fb6bc5e420ee70e811d5509aceefcaec32a8c) · [شجرة المستودع](https://github.com/YEEEAE/BRIGHTAI/tree/773fb6bc5e420ee70e811d5509aceefcaec32a8c) · [Render](https://dashboard.render.com/static/srv-d7m5bcjbc2fs73826v20)
- [Gateway](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/ai/groq-gateway.mjs) · [Env](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/kernel/env.mjs) · [Model registry](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/secure-chat/models.mjs) · [Firewall provider](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/firewall/provider.mjs) · [Public sandbox](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/ai/public-sandbox-limiter.mjs)
- [Firewall demo](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/shared/firewall-demo.mjs) · [Governance demo](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/demo/governance.mjs) · [Export script](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/scripts/governance-demo.ts) · [Governance registry](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/governance/registry.mjs) · [Internal pack](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/governance/internal-pack.mjs) · [Evaluation](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/risk-engine/evaluation.mjs)
- [Ledger core](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/src/server/ledger/core.mjs) · [Migration 0013](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/migrations/0013_aigas_ledger_five_state_and_chain_guard.sql) · [Render Blueprint](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/render.yaml) · [Groq release report](https://github.com/YEEEAE/BRIGHTAI/blob/773fb6bc5e420ee70e811d5509aceefcaec32a8c/Audit/groq-release-2026-11-25/REPORT.md) · [Advisory](https://github.com/advisories/GHSA-qh8j-hqjv-7m4x)
- Neon: SELECT على public/pg_catalog وops.aigas_migration_ledger، النتائج الكلية موثقة في التقرير؛ لا سجلات حساسة. Search Console وWindsor: نافذة 2026-10-26 إلى 2026-11-22. روابط المنافسين في القسم 6.
