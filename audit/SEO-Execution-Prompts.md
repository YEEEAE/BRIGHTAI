BrightAI — SEO / AEO / GEO Execution Prompts

الهدف: تنفيذ كامل خارطة الطريق الناتجة من تدقيق BrightAI بتاريخ 2026-08-23 على المستودع YEEEAE/BRIGHTAI.

شغّل البرومبتات بالترتيب من #1 إلى #20. لا تتخطى أي برومبت إلا إذا أثبتت بالتقرير إن البند منفذ ومتحقق منه مسبقًا.

قواعد ثابتة لكل البرومبتات

ابدأ بقراءة ملفات التوجيه والعقل والسجل الموجودة بالمشروع مثل .agents/brain.md وworklog.md والتقارير ذات العلاقة قبل أي تعديل.

استخدم المهارات الموجودة داخل المشروع إذا كانت مناسبة للمهمة، خصوصًا مهارات SEO التقني، Local SEO، الأداء، التدقيق، والاختبارات.

افحص الواقع الحي https://brightai.site ولا تعتمد على ملفات المستودع فقط إذا كانت المهمة تخص SEO أو الفهرسة أو Cloudflare أو robots.

لا تسوي git commit ولا git push ولا deploy. نفّذ محليًا فقط، واعرض التغييرات والاختبارات.

لا تحذف صفحات أو أقسام أو تغيّر URLs بشكل عشوائي. أي redirect أو noindex أو canonical يحتاج سبب موثق.

لا تنشئ صفحات مدينة مكررة أو محتوى programmatic ضعيف.

محتوى BrightAI العربي يكون عامي سعودي احترافي وواضح، بدون تكلف وبدون حشو. أسماء الأنظمة والهيئات والمتطلبات الرسمية تبقى بصيغتها الصحيحة، وأي اقتباس رسمي لا تحوله لعامية.

لا تستخدم ادعاءات مثل: "متوافق بالكامل"، "مضمون"، "معتمد"، "الأفضل"، "رقم 1" إلا إذا فيه دليل رسمي قابل للتحقق.

استخدم بدلها عند الحاجة: "يدعم تطبيق"، "يساعد على المواءمة"، "مصمم لدعم الجاهزية"، "يساعد المؤسسة على".

لا تختلق عملاء، شهادات، شراكات، أرقام نتائج، مكاتب محلية، أو مواقع فعلية.

حافظ على هوية BrightAI الأساسية: Saudi AI Safety OS وربط التنظيم بالمخاطر والضوابط والتنفيذ والإثبات.

إذا احتجت تعديل title أو meta description أو canonical، افحص أولًا القواعد المحمية بالمشروع وأثبت أن التعديل مطلوب. إذا كان الملف محميًا أو القواعد تمنع التعديل، اكتفِ بتقرير تغيير مقترح.

بعد كل مهمة:

شغّل الاختبارات المناسبة.

شغّل build.

شغّل SEO validation الموجودة بالمشروع.

افحص broken links / redirects / sitemap إذا كانت المهمة تمسها.

أنشئ تقرير مختصر داخل _reports/ يوضح: المشكلة، الملفات المعدلة، قبل/بعد، الاختبارات، وأي مخاطر متبقية.

لا تعتبر المهمة منتهية لمجرد أن الكود يشتغل؛ لازم تحقق Acceptance Criteria الخاصة بكل برومبت.

#1 — Baseline جديد للفهرسة وقياس الحالة

المهمة:

سو baseline جديد كامل قبل أي توسع SEO. راجع ملفات GSC الموجودة بالمشروع، sitemap الحالي، robots الحالي، صفحات الموقع الحية، وأي بيانات Analytics متاحة محليًا. لا تفترض أن لقطة 2026-07-25 ما زالت تمثل الواقع.

نفّذ:

احصر كل URLs الموجودة في sitemap.

صنف الصفحات: commercial / pillar / docs / blog / answer / assessment / utility.

قارنها بآخر GSC snapshot متاح.

استخرج قائمة الصفحات الحرجة التي كانت:

indexed

crawled-not-indexed

excluded/noindex

unknown

أعط الأولوية لـ:

/solutions/ai-governance-platform/

/hub/ai-governance/

/assessment/ai-governance-readiness/

/solutions/ai-risk-classification/

/solutions/ai-firewall/

/solutions/ai-audit-trail/

/solutions/policy-to-control-mapping/

/blog/iso-42001-saudi-implementation-guide/

صفحات PDPL

/solutions/banking-ai-governance/riyadh/

لا تعدّل أي صفحة في هذه المهمة؛ هذه baseline فقط.

أنشئ ملف بيانات machine-readable داخل _reports/seo-baseline-2026-08-23.json أو تاريخ التنفيذ الفعلي.

Acceptance Criteria:

عندنا قائمة URL كاملة.

كل URL له نوع + حالة + أولوية.

ما فيه خلط بين Search Volume وClicks.

أي بيانات غير متاحة مكتوبة N/A.

تقرير واضح يحدد P0/P1/P2.

#2 — حل تعارض Cloudflare / robots / AI crawler policy

المهمة:

حل التناقض بين public/robots.txt وpublic/llms.txt وpublic/llms-full.txt وpublic/ai.txt وبين النسخة الحية التي يضيف لها Cloudflare Managed robots/content signals.

السياسة المستهدفة:

Search / citation / user fetch: Allow.

Model training: Disallow by default.

لا تخلط بين Googlebot وGoogle-Extended.

لا تخلط بين Applebot وApplebot-Extended.

تحقق من وضع Claude/OAI/Perplexity الحالي من المصادر الرسمية قبل أي تغيير.

نفّذ:

افحص live /robots.txt.

وثق كل rule injected من Cloudflare.

راجع آخر Cloudflare docs الرسمية.

اجعل ملفات المشروع تعكس نفس السياسة المقصودة.

حدّث validation script بحيث يفشل إذا صار drift بين:

robots

ai.txt

llms.txt

llms-full.txt

schema companion files

لا تغيّر إعداد Cloudflare من المستودع إذا ما فيه API/credentials مصرح بها؛ بدل ذلك اكتب exact dashboard changes المطلوبة في التقرير.

تأكد أن Google/Bing indexing ما ينحجب.

Acceptance Criteria:

ما فيه تناقض policy داخل ملفات المشروع.

التقرير يوضح الفرق بين origin وlive.

البحث والفهرسة مسموحين.

training policy واضحة.

validation آلي يمنع regression.

#3 — إصلاح Mobile Core Web Vitals وLCP

المهمة:

خفض Mobile LCP من baseline ~5.8s إلى أقل من 2.5s قدر الإمكان بدون تخريب التصميم أو الـSEO.

نفّذ:

حدد LCP element الحقيقي على الصفحة الرئيسية وأهم صفحات الحلول.

افحص:

hero image/background

fonts

preload/preconnect

redirects

JS المبكر

unused JS

hydration

third-party scripts

animation libraries

استهدف إزالة/تأجيل الـJS غير المستخدم (~73KB baseline).

قلل redirect latency.

لا تستخدم lazy-loading على LCP image.

لا تضف مكتبات جديدة إلا إذا كانت أخف فعلًا.

اختبر Desktop وMobile.

Acceptance Criteria:

LCP mobile مستهدف <2.5s.

CLS يبقى <0.1.

TBT ما يتراجع.

ما فيه visual regression.

التقرير يعرض before/after لكل metric.

#4 — Canonical / noindex / sitemap / redirect ownership

المهمة:

راجع قواعد canonical وnoindex وsitemap وtrailing slash والredirects على مستوى الموقع بالكامل.

نفّذ:

افحص كل canonical مقابل URL الفعلي.

افحص trailingSlash behavior.

افحص الصفحات التي كانت excluded by noindex في snapshot.

لا ترفع noindex تلقائيًا عن صفحة ضعيفة؛ حدد أولًا هل تستحق الفهرسة.

أزل utility pages من sitemap إذا ما لها قيمة بحثية.

تأكد أن redirects بدون chains/cycles/self redirects.

صحح أدوات التدقيق إذا كانت تعطي false positives بسبب trailing slash.

Acceptance Criteria:

0 canonical mismatches حقيقية.

0 redirect chains/cycles.

sitemap يحتوي فقط URLs مقصودة للفهرسة.

كل noindex له سبب واضح.

تقارير الـaudit تفرق بين bug بالأداة ومشكلة SEO حقيقية.

#5 — تنظيف /answer/ ومنع Keyword Cannibalization

المهمة:

راجع كل صفحات /answer/ وحدد هل هي:

صفحة مستقلة تستحق index،

محتوى لازم يندمج مع pillar،

صفحة قصيرة لازم noindex،

صفحة لازم redirect إذا كانت نسخة مكررة فعلًا.

ركّز على:

ai-governance

ISO 42001

PDPL

NCA

AI Firewall

Audit Trail

قواعد:

Solution = نية شراء.

Hub = تعلم شامل.

Docs = تطبيق تقني.

Blog = موضوع فرعي/تحليل.

Answer = جواب قصير فقط إذا له قيمة مستقلة فعلًا.

Acceptance Criteria:

لكل query مالك واحد واضح.

ما فيه صفحتين تستهدفان نفس النية الأساسية.

كل merge/redirect/noindex موثق.

internal links تشير للمالك الصحيح.

#6 — إصلاح ورفع جودة أهم 10 صفحات موجودة

المهمة:

حسن أول 10 صفحات استراتيجية بالموقع بدون حشو:

/solutions/ai-governance-platform/

/hub/ai-governance/

/assessment/ai-governance-readiness/

/solutions/ai-risk-classification/

/solutions/ai-firewall/

/solutions/ai-audit-trail/

/solutions/policy-to-control-mapping/

/blog/iso-42001-saudi-implementation-guide/

صفحة PDPL الأساسية المالكة للنية

/solutions/banking-ai-governance/riyadh/

لكل صفحة:

حدد primary query + secondary queries.

Answer-first intro.

buyer problem.

proof/explanation.

regulatory context.

product fit.

internal links.

CTA مطابق للنية.

FAQ فقط إذا يضيف قيمة.

محتوى عربي عامي سعودي احترافي.

Acceptance Criteria:

كل صفحة لها intent واحد واضح.

لا توجد claims غير مثبتة.

CTA يطابق نية الزائر.

structured data صحيح ومطابق للمحتوى الظاهر.

#7 — بناء ركيزة SDAIA National AI Risk Management Framework

المهمة:

أنشئ أقوى دليل سعودي عملي عن SDAIA National Artificial Intelligence Risk Management Framework، مرتبط مباشرة بقدرات BrightAI بدون ادعاء أن BrightAI جهة تنظيمية أو اعتماد.

المحتوى:

ما هو الإطار.

لمن ينطبق.

دورة إدارة المخاطر.

inventory.

owner.

risk register.

classification.

treatment.

monitoring.

human oversight.

audit evidence.

mapping إلى حلول BrightAI.

المصادر الرسمية.

تاريخ آخر تحديث.

checklist عملية.

اللغة:
عامية سعودية احترافية في الشرح، مع إبقاء أسماء الضوابط الرسمية بصيغتها الأصلية.

Acceptance Criteria:

مصادر أولية/رسمية لكل claim تنظيمي.

ما فيه نسخ طويل من المصادر.

Answer-first واضح.

Schema مناسب.

روابط إلى Risk Classification + Human Approval + Evidence + Assessment.

#8 — بناء ركيزة NCA AI Cybersecurity Guidelines

المهمة:

أنشئ صفحة/دليل مخصص لإرشادات الأمن السيبراني للذكاء الاصطناعي من NCA، بعد التحقق من أحدث النسخ الرسمية وحالتها التنظيمية.

غطي:

scope.

AI security risks.

data leakage.

model access.

identity/permissions.

logging.

human approval.

third-party AI.

agentic AI.

mapping تقريبي لقدرات BrightAI مع disclaimer واضح.

Acceptance Criteria:

ما توصف guideline بأنها إلزام قانوني إذا المصدر ما يقول كذا.

المصادر الرسمية واضحة.

روابط إلى AI Firewall/Audit Trail/Policy Mapping.

لا يوجد keyword stuffing.

#9 — تقوية صفحة AI Firewall للنية التجارية

المهمة:

حوّل صفحة AI Firewall إلى أقوى صفحة شراء/حل للمؤسسات السعودية.

استهدف:

AI Firewall

LLM firewall

AI data firewall

enterprise AI firewall

AI firewall for compliance

غطي:

المشكلة قبل المنتج.

كيف يمنع/يخفي البيانات الحساسة.

prompt/output inspection.

policy enforcement.

auditability.

الفرق بين network firewall وAI/LLM firewall.

استخدامات سعودية واقعية بدون اختلاق عملاء.

PDPL/NCA context.

Demo CTA.

Acceptance Criteria:

ما يصير confusion مع WAF/network firewall.

الصفحة تجارية وليست مقال تعريف فقط.

no unsupported security claims.

CTA واضح.

#10 — تحديث ISO/IEC 42001 Cluster

المهمة:

راجع كل محتوى ISO 42001 بالموقع وخل صفحة واحدة هي المالك الأساسي.

استهدف:

ISO 42001

what is ISO 42001

ISO 42001 checklist

ISO 42001 requirements

ISO 42001 audit

ISO 42001 AI governance

ISO 42001 implementation guide

مهم جدًا:
BrightAI لا تدعي أنها جهة certification أو أنها "ISO certified" إلا بدليل رسمي.

ابنِ:

implementation path.

readiness checklist.

mapping إلى governance/risk/evidence.

CTA إلى readiness assessment.

Acceptance Criteria:

مالك واحد للنية.

answer pages ما تنافس pillar.

لا يوجد certification claim غير مثبت.

internal linking مكتمل.

#11 — تحديث PDPL + AI Cluster

المهمة:

رتب كل محتوى PDPL وعلاقته بالذكاء الاصطناعي.

غطي:

ChatGPT/LLMs والبيانات الشخصية.

employee use.

customer data.

minimization.

cross-border considerations إذا كانت المصادر الرسمية تدعمها.

logging/evidence.

AI Firewall.

approval/process.

DPO/compliance owner.

CTA:
تقييم مخاطر البيانات أو AI readiness، مو CTA عام.

Acceptance Criteria:

كل claim قانوني بمصدر مناسب.

لا تقدم استشارة قانونية.

لا تقول "متوافق بالكامل".

صفحة PDPL المالكة واضحة.

#12 — بناء Saudi AI Governance Control Matrix

المهمة:

أنشئ أصل أصلي قابل للاستشهاد والتحميل: Saudi AI Governance Control Matrix.

المصفوفة تربط — بدون ادعاء معادلة قانونية كاملة — بين:

SDAIA AI Risk Management

AI Ethics

PDPL

NCA ECC / AI Cybersecurity Guidance

ISO/IEC 42001

قدرات BrightAI

المخرجات:

صفحة HTML قابلة للفهرسة.

جدول واضح.

نسخة downloadable مناسبة إذا البنية الحالية تدعمها.

methodology + version + last updated.

disclaimer.

Acceptance Criteria:

ما فيه mappings مخترعة.

كل mapping له rationale.

قابل للاستشهاد.

structured data مناسب.

روابط قوية للمنتجات.

#13 — بناء Saudi AI Risk Register Template

المهمة:

أنشئ Risk Register عملي للمؤسسات السعودية كأصل Lead Magnet.

الحقول المقترحة:

use case

owner

business process

AI/model/provider

data classification

affected individuals

likelihood

impact

risk score

risk category

treatment

human oversight

control owner

evidence

status

review date

المحتوى:
اشرح طريقة الاستخدام بلهجة سعودية واضحة، بدون تحويله لاستشارة قانونية.

Acceptance Criteria:

قابل للاستخدام فعليًا.

مرتبط بـ Risk Classification وAssessment.

لا يحتوي بيانات وهمية على أنها عملاء حقيقيين.

CTA مناسب.

#14 — توحيد Entity / Organization / Schema

المهمة:

خل Organization وWebSite وبيانات BrightAI لها single source of truth.

راجع:

src/data/site.ts

schema helpers

footer

llms files

ai.txt

public schema files

social links

founder

phone

address

headquarters claims

sameAs

مهم:
إذا البيانات محمية أو تحتاج موافقة، لا تغيرها بصمت. وثق الفرق والملف المطلوب.

Acceptance Criteria:

0 mismatches بين المصادر التي يسمح تعديلها.

JSON-LD valid.

no duplicate Organization IDs.

no fake LocalBusiness/location claims.

#15 — بناء Agentic AI Security Cluster

المهمة:

ابنِ صفحة pillar عن Agentic AI Security للمؤسسات، مع ربطها بـBrightAI.

غطي:

permissions.

tool access.

identity.

data leakage.

prompt/tool injection.

autonomous actions.

approval gates.

audit logs.

kill/stop controls من منظور حوكمة، بدون ادعاء قدرات غير موجودة.

evidence.

agent risk assessment.

الكلمات الداعمة:

Agentic AI security

Agentic AI workflows

Agentic AI systems

Agentic AI use cases

Acceptance Criteria:

يفرق بين AI agents وAgentic AI.

لا يدعي قدرات المنتج غير الموجودة.

يربط بالـFirewall/Audit/Human Approval.

CTA = Agent Risk Assessment أو Assessment مناسب.

#16 — بناء Agentic AI Governance Framework

المهمة:

أنشئ إطار عملي لحوكمة AI agents داخل المؤسسة.

المراحل:

discover.

inventory.

assign owner.

classify.

permissions.

policy.

human approval.

logging.

evidence.

monitoring.

retirement.

أضف:

RACI.

decision tree.

high-risk examples.

الفرق بين GenAI governance وAgentic governance.

Acceptance Criteria:

الصفحة ما تنافس Agentic Security على نفس النية.

governance = إطار إدارة.

security = مخاطر وضوابط أمنية.

روابط متبادلة ذكية.

#17 — تحسين Banking AI Governance Riyadh بدون Local Spam

المهمة:

قو صفحة:
/solutions/banking-ai-governance/riyadh/

بحيث تكون أفضل صفحة محلية تجارية فعلية، بدون اختلاق مكتب أو عملاء في الرياض.

غطي:

banking/financial AI use cases.

SAMA context من مصادر رسمية.

NCA.

PDPL.

credit/fraud/customer service AI.

ownership.

risk register.

human oversight.

audit evidence.

قواعد:

لا تنشئ Riyadh pages إضافية في هذه المهمة.

لا تستخدم "near me".

لا تدعي موقع فعلي إذا ما هو مثبت.

Acceptance Criteria:

unique local context.

schema صادق.

CTA تنفيذي.

ما فيه duplicated city copy.

#18 — إعادة بناء Internal Linking + Topical Authority

المهمة:

ابنِ شبكة روابط داخلية على خمس ركائز:

AI Governance Saudi Arabia

AI Risk Management & SDAIA

AI Security & AI Firewall

Saudi AI Compliance — PDPL/NCA/ISO 42001

Agentic AI Governance & Security

قواعد الربط:

Solution = commercial owner.

Pillar = informational owner.

Docs = technical depth.

Blog = supporting topic.

Answer = short answer → pillar.

استخدم anchors طبيعية ومتنوعة.

نفّذ:

اكتشف orphan pages.

قلل click depth.

اربط كل supporting page بمالكها.

اربط المنتجات من المحتوى التنظيمي فقط لما يكون منطقي.

Acceptance Criteria:

0 orphan strategic pages.

لا يوجد link stuffing.

كل pillar لها inbound links قوية.

تقرير graph قبل/بعد.

#19 — AEO / GEO / AI Search + Conversion Optimization

المهمة:

حسن الصفحات الاستراتيجية للظهور في Google AI results ومحركات الإجابة، وفي نفس الوقت ارفع conversion.

لكل صفحة استراتيجية:

answer-first خلال أول 150–250 كلمة.

تعريف مباشر.

سياق سعودي.

مصادر رسمية.

last updated.

جداول أصلية.

خطوات/checklists.

entity clarity.

author/reviewer إذا موجودين فعليًا.

FAQ فقط عند الحاجة.

CTA حسب النية.

CTA Mapping:

What is AI governance → Readiness Assessment.

SDAIA Risk Framework → Risk Checklist/Assessment.

AI Firewall → Demo.

PDPL + ChatGPT → Data Risk Assessment.

ISO 42001 → Readiness Assessment.

Audit Trail → Evidence Demo.

Banking Riyadh → Executive Session.

Agentic Security → Agent Risk Assessment.

Acceptance Criteria:

لا يوجد generic "Contact us" كـCTA وحيد بكل الصفحات.

schema يطابق المحتوى.

ما فيه FAQ spam.

المحتوى العربي عامي سعودي احترافي.

#20 — Final QA + Measurement + 90-Day Operating System

المهمة:

سو تدقيق نهائي كامل بعد تنفيذ #1–#19، وابنِ نظام قياس مستمر لأول 90 يوم.

اختبر:

build.

SEO gate.

internal links.

redirects.

sitemap.

robots.

llms/ai surface.

schema.

mobile performance.

accessibility الأساسي.

broken links.

canonical/noindex.

key page rendering.

أنشئ Dashboard/Report يحتوي:

Saudi organic impressions.

Saudi organic clicks.

non-brand queries.

top 3 / top 10 commercial queries.

strategic indexed pages.

crawled-not-indexed.

Google organic users.

Bing organic users.

Riyadh organic users.

AI referrals.

qualified leads.

organic conversion rate.

Mobile LCP.

CLS.

INP.

keyword-to-page map.

content launched.

backlinks/citations للأصول الأصلية.

قواعد القياس:

لا تخترع أرقام.

أي metric غير متاح = N/A.

Search Volume ≠ Clicks.

لا تعتبر الزيارات هدف النجاح الوحيد؛ أعط وزن أعلى للـqualified leads والصفحات التجارية.

Acceptance Criteria:

تقرير نهائي واحد يوضح ما تم فعليًا.

قائمة remaining risks.

قائمة next 30/60/90 days.

مقارنة baseline vs final.

لا commit/push/deploy.