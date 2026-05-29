أنت Senior Full-Stack SEO Engineer + Technical SEO Architect + B2B SaaS Content Strategist + UX/CRO Specialist + AI Search / AEO / GEO Expert + Static HTML Performance Engineer.

المشروع: BrightAI / BRIGHTAI
الريبو: YEEEAE/BRIGHTAI
الموقع: https://brightai.site
نوع المشروع حسب التحليل:
Static HTML Marketing Site + Node.js API Backend.
ملاحظة مهمة:
لا يوجد /backend فعليًا حسب التحليل؛ الكود الخلفي موجود داخل frontend/.
لا تتعامل مع المشروع كـ Next.js أو React App.
لا تفترض وجود app/ أو pages/ أو backend/.
تعامل معه كموقع Static HTML + Vanilla JS + Tailwind + Node.js server داخل frontend/.

السوق المستهدف:
السعودية والخليج.

اللغة:
عربي سعودي مهني واضح، مع مصطلحات إنجليزية عند الحاجة.

المطلوب:
تنفيذ تحسين شامل ومدروس لبناء سلطة موضوعية لـ BrightAI في AI Governance داخل السوق السعودي، مع إصلاح أهم مشاكل SEO التقنية المذكورة في تقرير التحليل، بدون إعادة تصميم الصفحة الرئيسية، وبدون إنشاء Industries أو Assessment.

────────────────────────────
0. قواعد تنفيذ صارمة
────────────────────────────

لا تنفذ على main مباشرة.
أنشئ branch جديد:

feature/ai-governance-authority-docx-seo-fixes

نفذ كل التعديلات على هذا الفرع فقط.
افتح Pull Request للمراجعة.
لا تدمج PR.

ممنوع:
- لا تعيد تصميم الصفحة الرئيسية.
- لا تستبدل index.html بالكامل.
- لا تنشئ Industries pages.
- لا تنشئ Assessment pages.
- لا تنشئ /assessment/ai-governance-readiness/.
- لا تضف نموذج تقييم جاهزية.
- لا تتعامل مع المشروع كـ Next.js.
- لا تضف React components.
- لا تضف dependencies جديدة إلا للضرورة القصوى.
- لا تستخدم ادعاءات قانونية قاطعة مثل "نضمن الامتثال".
- لا تستخدم "معتمد رسميًا" إلا إذا يوجد دليل رسمي داخل المشروع.
- لا تضف rating/reviewCount أو aggregateRating إذا لا توجد تقييمات ظاهرة للمستخدم.
- لا تستخدم meta keywords.
- لا تجعل FAQ Schema بديلًا عن FAQ ظاهر في الصفحة.
- لا تضف صفحات demo/kernel داخل sitemap الرئيسي إذا كانت محظورة أو غير مناسبة للفهرسة.

المطلوب في الصفحة الرئيسية:
إضافات خفيفة فقط:
- Block صغير لمركز حوكمة الذكاء الاصطناعي.
- روابط داخلية إلى صفحات Solutions.
- CTA خفيف إلى الخدمات والتواصل.
- تحسينات SEO/Schema آمنة فقط.
بدون إعادة تصميم Hero.
بدون تغيير Layout جذري.

────────────────────────────
1. فهم التموضع الاستراتيجي
────────────────────────────

BrightAI ليست مجرد شركة خدمات ذكاء اصطناعي عامة.
BrightAI = Saudi AI Safety OS / طبقة تنفيذية لحوكمة وأمان الذكاء الاصطناعي للمؤسسات السعودية.

BrightAI تساعد المؤسسات على:
- اكتشاف استخدامات AI داخل المؤسسة.
- تصنيف مخاطر الذكاء الاصطناعي.
- ترجمة السياسات إلى ضوابط تشغيلية.
- حماية البيانات الحساسة قبل وصولها للنماذج.
- تسجيل كل طلب AI وكل قرار وكل موافقة.
- تطبيق الموافقة البشرية على القرارات الحساسة.
- إنتاج Evidence Files لدعم جاهزية التدقيق والامتثال.
- تشغيل الحوكمة بشكل مستمر وليس كمشروع مرة واحدة.

Core Capabilities:
- AI Use Case Discovery
- AI Risk Classification
- Policy-to-Control Mapping
- AI Firewall
- AI Audit Trail
- Human Approval Layer
- AI Evidence File
- Continuous AI Governance
- Compliance Readiness Packs

Compliance / Framework Topics:
- PDPL
- NCA ECC 2-2024
- ISO/IEC 42001 readiness
- NIST AI RMF implementation
- EU AI Act readiness vs local Saudi implementation
- Privacy and AI
- Data classification for AI
- AI compliance framework

استخدم صياغات آمنة:
- "يساعد على المواءمة"
- "يدعم جاهزية الامتثال"
- "يوفر طبقة تشغيلية"
- "يساعد فرق المخاطر والامتثال"
- "يعزز القدرة على التدقيق"
- "يدعم تطبيق الضوابط داخليًا"

في أي محتوى عن الامتثال أضف:
"هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."

────────────────────────────
2. أولويات التنفيذ حسب التحليل
────────────────────────────

ركّز على أعلى أثر أولًا:

Priority 1 — Technical SEO Fixes:
حسب تقرير التحليل توجد مشاكل عالية الأولوية:
- يوجد 6 sitemaps لكن لا يوجد sitemap index واضح.
- robots.txt لا يشير إلا إلى جزء من ملفات sitemap.
- توجد إشارة متناقضة: /kernel/ داخل sitemap لكنه Disallowed في robots.txt.
- hreflang يستخدم en-SA، والأفضل استبداله بـ en أو معيار مدعوم.
- image sitemap ضعيف لأنه يكرر logo-new.PNG بدل صور OG فريدة.
- يوجد manifest.json وmanifest.webmanifest بتكوينين مختلفين.
- توجد آثار Next.js رغم أن المشروع Static HTML.
- توجد Tailwind configs متعددة وقد تربك المطورين.
- lint/typecheck حالياً غير فعّالة أو skipped.

نفذ الآمن فقط ضمن هذا PR:
1. إصلاح sitemap/robots/hreflang/kernel contradiction.
2. تنظيف Schema المضلل.
3. تحديث llms.txt وllms-full.txt.
4. إضافة صفحات Solutions.
5. إضافة docx resources.
6. إضافة روابط خفيفة للرئيسية والخدمات والتواصل.
7. تقارير واضحة لما لم يتم تنفيذه ويحتاج PR منفصل.

لا تحذف dependencies أو ملفات config الكبيرة في هذا PR إلا إذا كان واضحًا 100% أنها غير مستخدمة ولن تكسر build.
إذا كان الحذف عالي المخاطر، وثّقه في التقرير فقط.

Priority 2 — Commercial SEO:
إنشاء وتحسين صفحات Solutions التي تخلق Pipeline.

Priority 3 — Topical Authority:
إنشاء محتوى معرفي داخل مجلد docx/ بصيغة Markdown.

Priority 4 — UX/CRO:
تحسين خفيف فقط: روابط، CTA، توضيح الرسالة، بدون redesign.

────────────────────────────
3. تحليل المشروع الحالي قبل التعديل
────────────────────────────

افحص فعليًا هذه الملفات والمجلدات إن وجدت:

Root:
- README.md
- package.json
- package-lock.json
- index.html
- services/index.html
- contact/index.html
- about/index.html
- pricing/index.html
- blog/
- docs/
- demo/
- kernel/
- sitemap.xml
- sitemap-pages.xml
- sitemap-legal.xml
- sitemap-demo.xml
- sitemap-kernel.xml
- sitemap-images.xml
- robots.txt
- llms.txt
- llms-full.txt
- manifest.json
- manifest.webmanifest
- redirects.json
- _headers
- render.yaml
- sw.js

Frontend:
- frontend/package.json
- frontend/server.js
- frontend/routes/
- frontend/services/
- frontend/kernel/
- frontend/db/
- frontend/js/
- frontend/css/
- frontend/assets/
- frontend/middleware/

Scripts:
- scripts/
- scripts/generate-sitemap-all-pages.mjs
- scripts/seo-health-check.mjs
- scripts/seo-ci-check.mjs
- scripts/internal-links-audit.mjs
- scripts/check-performance-budget.js

أنشئ تقرير:
reports/seo/AI-GOVERNANCE-TOPICAL-AUTHORITY-AUDIT.md

يحتوي:
1. ملخص الوضع الحالي.
2. تأكيد بنية المشروع الفعلية: Static HTML + Node API داخل frontend/.
3. أهم مشاكل SEO التقنية.
4. أهم مشاكل Sitemap/Robots/Hreflang.
5. أهم مشاكل Schema.
6. أهم فرص AI Search / AEO / GEO.
7. أهم فجوات المحتوى التجاري.
8. الصفحات التي ستُنشأ.
9. الملفات التي ستُعدّل.
10. المخاطر.
11. ما يجب تأجيله لـ PR منفصل.

────────────────────────────
4. إصلاحات SEO التقنية عالية الأولوية
────────────────────────────

نفّذ التالي بحذر:

4.1 Sitemap Index
إذا كان sitemap.xml حاليًا عبارة عن urlset عادي وليس sitemap index:
- إما حوّله إلى sitemap index يشير إلى:
  - sitemap-pages.xml
  - sitemap-legal.xml
  - sitemap-demo.xml إن كانت demo مقصودة للفهرسة
  - sitemap-solutions.xml
  - sitemap-images.xml
- أو أنشئ sitemap-index.xml وحدث robots.txt للإشارة إليه.
اختر الخيار الأقل كسرًا حسب بنية السكربتات الحالية.

أنشئ أو حدث:
- sitemap-solutions.xml لصفحات Solutions الجديدة.

لا تضف ملفات docx إلى sitemap إلا إذا كانت منشورة كصفحات عامة.
بما أن المطلوب docx/ كمجلد محتوى داخلي Markdown، لا تضفها للسitemap.

4.2 Robots.txt
حدث robots.txt ليشير إلى كل sitemaps المهمة أو sitemap index.
حل التناقض:
إذا /kernel/ محظور في robots.txt، فلا تضع /kernel/ داخل sitemap القابل للفهرسة.
الأفضل:
- اجعل kernel خارج sitemap الرئيسي.
- احتفظ به محظورًا إذا كان Dashboard/تجربة داخلية.
- وثّق القرار.

4.3 Hreflang
استبدل en-SA بـ en إذا وجد في الصفحات أو sitemaps.
تأكد من:
- ar-SA للصفحات العربية.
- en للإنجليزية.
- x-default يشير للنسخة الأنسب، غالبًا العربية root حسب السوق الأساسي.
لا تكسر الروابط البديلة.

4.4 Image Sitemap
إذا sitemap-images.xml يكرر logo-new.PNG فقط:
- أضف صور OG فريدة إن كانت موجودة في frontend/assets/images/og/ أو مسارات مشابهة.
- إن لم تكن موجودة، وثّق توصية إنشاء OG images لاحقًا.
لا تخترع صور غير موجودة.

4.5 Manifest
إذا يوجد manifest.json وmanifest.webmanifest بتكوينين مختلفين:
- لا تحذف مباشرة إذا غير متأكد.
- وثق المشكلة.
- إن كان آمنًا، اجعل المرجع الأساسي في HTML إلى manifest.webmanifest.
- اذكر manifest consolidation كتوصية PR منفصل إذا كان الحذف خطير.

4.6 Schema Cleanup
راجع JSON-LD في:
- index.html
- services/index.html
- contact/index.html
- صفحات Solutions الجديدة.

احذف أو عدّل:
- aggregateRating إذا لا توجد تقييمات ظاهرة.
- reviewCount غير مثبت.
- claims غير ظاهرة.
- FAQPage إذا لا توجد FAQ ظاهرة.
- Organization مكرر بشكل مفرط إن سبب تعارض.

استخدم:
- Organization في الصفحة الرئيسية.
- WebSite في الصفحة الرئيسية.
- WebPage لصفحات Solutions.
- BreadcrumbList لكل صفحة Solution.
- SoftwareApplication فقط إذا المنتج موضح بوضوح.
- FAQPage فقط عند وجود FAQ ظاهر.

أنشئ تقرير:
reports/seo/AI-GOVERNANCE-SCHEMA-AUDIT.md

────────────────────────────
5. مجلد docx للموارد المعرفية
────────────────────────────

أنشئ مجلد:
docx/

داخله أنشئ ملفات Markdown، وليس DOCX binary، وليس صفحات HTML live.

الملفات المطلوبة:

1. docx/ai-governance-saudi-arabia.md
العنوان:
حوكمة الذكاء الاصطناعي في السعودية: دليل تنفيذي للمؤسسات

2. docx/what-is-ai-governance.md
العنوان:
ما هي حوكمة الذكاء الاصطناعي؟

3. docx/ai-governance-vs-ai-ethics-vs-ai-compliance.md
العنوان:
الفرق بين AI Governance وAI Ethics وAI Compliance

4. docx/ai-governance-framework.md
العنوان:
إطار حوكمة الذكاء الاصطناعي للمؤسسات السعودية

5. docx/ai-governance-committee.md
العنوان:
لجنة حوكمة الذكاء الاصطناعي: الأدوار والمسؤوليات

6. docx/ai-policy-template.md
العنوان:
قالب سياسة استخدام الذكاء الاصطناعي داخل المؤسسة

7. docx/ai-risk-management.md
العنوان:
إدارة مخاطر الذكاء الاصطناعي للمؤسسات السعودية

8. docx/ai-risk-register.md
العنوان:
سجل مخاطر الذكاء الاصطناعي AI Risk Register

9. docx/ai-red-teaming.md
العنوان:
AI Red Teaming: اختبار مخاطر وسلوك نماذج الذكاء الاصطناعي

10. docx/hallucination-risk.md
العنوان:
مخاطر الهلوسة في الذكاء الاصطناعي وكيفية إدارتها

11. docx/model-drift-monitoring.md
العنوان:
مراقبة Model Drift في أنظمة الذكاء الاصطناعي

12. docx/ai-audit-readiness.md
العنوان:
جاهزية تدقيق الذكاء الاصطناعي: كيف تثبت السيطرة والامتثال؟

13. docx/pdpl-ai-governance.md
العنوان:
PDPL والذكاء الاصطناعي: إدارة الخصوصية والمخاطر داخل المؤسسة

14. docx/nca-ecc-ai-governance.md
العنوان:
NCA ECC وحوكمة الذكاء الاصطناعي: ضوابط تشغيلية للجهات المنظمة

15. docx/iso-42001-readiness.md
العنوان:
جاهزية ISO/IEC 42001 للمؤسسات التي تطبق الذكاء الاصطناعي

16. docx/nist-ai-rmf-implementation.md
العنوان:
تطبيق NIST AI RMF داخل المؤسسات: من المبادئ إلى الضوابط

17. docx/eu-ai-act-vs-saudi-ai-governance.md
العنوان:
EU AI Act مقارنة بالتطبيق المحلي لحوكمة الذكاء الاصطناعي

18. docx/shadow-ai-risk.md
العنوان:
مخاطر Shadow AI داخل المؤسسات وكيفية السيطرة عليها

19. docx/ai-governance-checklist.md
العنوان:
AI Governance Checklist للمؤسسات السعودية

20. docx/ai-audit-readiness-checklist.md
العنوان:
AI Audit Readiness Checklist

لكل ملف:
- Frontmatter بسيط:
  title
  description
  audience
  funnel_stage
  related_solutions
  last_updated
- ملخص تنفيذي.
- الإجابة المختصرة.
- لمن هذا المحتوى؟
- لماذا الموضوع مهم؟
- المخاطر الشائعة.
- كيف يتم التطبيق؟
- كيف يساعد BrightAI؟
- Checklist.
- FAQ.
- CTA.
- روابط داخلية مقترحة.
- Disclaimer للامتثال عند الحاجة.

لا تنشئ /resources/ صفحات live في هذا PR.
فقط docx/.

────────────────────────────
6. صفحات Solutions التجارية
────────────────────────────

أنشئ أو حسّن صفحات Solutions فقط:

/solutions/ai-governance-platform/
/solutions/ai-use-case-discovery/
/solutions/ai-risk-classification/
/solutions/policy-to-control-mapping/
/solutions/ai-firewall/
/solutions/ai-audit-trail/
/solutions/human-approval-layer/
/solutions/ai-evidence-file/
/solutions/continuous-ai-governance/

كل صفحة تكون Static HTML متوافقة مع نمط المشروع الحالي.

لكل صفحة:
- H1 واحد.
- Title فريد.
- Meta description فريدة.
- Canonical صحيح.
- Breadcrumb ظاهر.
- BreadcrumbList JSON-LD.
- WebPage Schema.
- FAQ ظاهر.
- CTA فوق الصفحة، وسطها، وآخرها.
- روابط داخلية إلى:
  - /
  - /services/
  - /contact/
  - صفحات Solutions ذات علاقة.
- لا تضف meta keywords.
- لا تضف aggregateRating.

هيكل كل صفحة Solution:
1. Hero مختصر.
2. الإجابة المختصرة.
3. المشكلة التجارية.
4. متى تحتاج المؤسسة هذا الحل؟
5. كيف يعمل BrightAI؟
6. What BrightAI detects.
7. What BrightAI controls.
8. What BrightAI logs.
9. What evidence BrightAI produces.
10. Use cases عامة بدون إنشاء Industries pages.
11. Business outcomes.
12. FAQ.
13. CTA نهائي.

استخدم CTAs:
- اطلب ديمو تنفيذي.
- تحدث مع فريق BrightAI.
- استكشف حلول الحوكمة.
- راجع حلول AI Firewall.
- تواصل معنا.

لا تستخدم:
- احجز تقييم جاهزية.
- ابدأ Assessment.
- ابدأ تقييم المخاطر.

────────────────────────────
7. الصفحة الرئيسية — إضافات فقط
────────────────────────────

لا تعيد كتابة index.html بالكامل.
لا تغيّر التصميم الأساسي.
لا تغير Hero إلا إذا يوجد خطأ تقني واضح.

أضف Block خفيف بعنوان:
"مركز حوكمة الذكاء الاصطناعي"
أو:
"AI Governance Knowledge Hub"

النص المقترح:
"تعرّف كيف تساعد BrightAI المؤسسات السعودية على تحويل سياسات الذكاء الاصطناعي إلى ضوابط تشغيلية قابلة للتدقيق، مع AI Firewall وسجل تدقيق وموافقات بشرية وملفات أدلة."

الروابط:
- /solutions/ai-governance-platform/
- /solutions/ai-firewall/
- /solutions/ai-audit-trail/
- /solutions/human-approval-layer/
- /solutions/ai-evidence-file/
- /services/
- /contact/

CTA:
- استكشف حلول الحوكمة.
- تحدث مع فريق BrightAI.

نظّف فقط إذا آمن:
- meta keywords.
- aggregateRating غير مثبت.
- claims غير ظاهرة.
- Schema غير مطابق.

────────────────────────────
8. صفحة الخدمات والتواصل
────────────────────────────

services/index.html:
حوّلها إلى بوابة Solutions بدون redesign جذري.

أضف أقسام أو cards للآتي:
- AI Governance Platform
- AI Use Case Discovery
- AI Risk Classification
- Policy-to-Control Mapping
- AI Firewall
- AI Audit Trail
- Human Approval Layer
- AI Evidence File
- Continuous Governance

كل card:
- وصف مختصر.
- رابط صفحة Solution.
- CTA صغير.

contact/index.html:
تحسينات خفيفة فقط:
- CTA للديمو التنفيذي.
- Microcopy عن حماية البيانات.
- روابط إلى أهم Solutions.
- تأكد من PDPL consent إذا يوجد نموذج.
- أضف أو راجع event names إن كانت منظومة analytics موجودة:
  - contact_form_submit
  - whatsapp_click
  - solution_cta_click

لا تضف Assessment.

────────────────────────────
9. llms.txt و AI Search / GEO / AEO
────────────────────────────

حدّث llms.txt ليشمل:
- تعريف مختصر لـ BrightAI.
- تعريف BrightAI Kernel.
- أهم صفحات Solutions.
- أهم ملفات docx المرجعية.
- شرح ثابت لمحركات AI:

BrightAI is an operational AI governance and safety layer for Saudi organizations, helping teams discover AI use cases, classify risks, map policies to controls, maintain audit trails, apply human approvals, and produce evidence for compliance readiness.

إن كان llms-full.txt موجودًا، حدثه.
إن لم يكن موجودًا، أنشئه.

في llms-full.txt أضف:
- Company overview.
- Product overview.
- Safety pipeline.
- Core capabilities.
- Compliance readiness topics.
- Solution page links.
- docx resource inventory.
- Contact info.
- Safe claims policy.
- Disclaimer.

لا تضف ادعاءات قانونية قاطعة.

────────────────────────────
10. Topic Map وFunnel Map وتقارير استراتيجية
────────────────────────────

أنشئ التقارير:

reports/seo/AI-GOVERNANCE-TOPIC-MAP-KSA.md
يحتوي:
- Topics
- Search intent
- Funnel stage
- ICP
- Output type:
  docx content / solution page / homepage addition / llms entry
- Arabic keyword
- English keyword
- Secondary keywords
- Suggested filename or slug
- Internal links
- CTA
- Business value
- Priority

reports/seo/AI-GOVERNANCE-FUNNEL-MAP.md
قسّم:
TOFU:
- ما هي حوكمة الذكاء الاصطناعي؟
- الفرق بين AI governance وAI ethics وAI compliance
- لماذا تفشل مبادرات الذكاء الاصطناعي عند غياب الحوكمة؟
- ما هو Shadow AI؟

MOFU:
- كيف تبني إطار حوكمة AI؟
- AI Risk Management Checklist
- ISO/IEC 42001 readiness
- Policy-to-control mapping
- AI Risk Register

BOFU:
- AI Governance Platform Saudi Arabia
- AI Firewall للشركات
- AI Audit Trail للمؤسسات
- AI Evidence File for audit readiness
- BrightAI compliance readiness

reports/seo/AI-GOVERNANCE-SITE-ARCHITECTURE.md
اشرح:
- الصفحات الحالية.
- صفحات Solutions الجديدة.
- docx resources.
- الروابط الداخلية.
- ما لم يتم إنشاؤه ولماذا: Industries وAssessment.

reports/seo/AI-GOVERNANCE-INTERNAL-LINKING.md
اشرح:
- Homepage links.
- Services links.
- Solution-to-solution links.
- docx suggested links.
- Anchor text.

reports/seo/AI-GOVERNANCE-IMPLEMENTATION-ROADMAP.md
قسّم:
- Phase 1: SEO technical fixes.
- Phase 2: Solutions.
- Phase 3: docx authority resources.
- Phase 4: llms and AI Search.
- Phase 5: validation.
- Deferred PR items:
  - dependency cleanup
  - Tailwind config consolidation
  - manifest consolidation if risky
  - ESLint enablement
  - TypeScript/typecheck
  - English marketing translation

reports/seo/AI-GOVERNANCE-CONTENT-CALENDAR-90-DAYS.md
12 أسبوع، بدون Industries وبدون Assessment.

reports/seo/AI-GOVERNANCE-FINAL-SUMMARY.md
يتضمن:
- ما تم.
- الملفات الجديدة.
- الملفات المعدلة.
- الفحوصات.
- النتائج.
- المشاكل المتبقية.
- توصيات PR التالي.

────────────────────────────
11. Performance Guardrails
────────────────────────────

لا تضف CSS ضخم لكل صفحة.
استخدم CSS مشترك إذا مناسب.
لا تضف مكتبات جديدة.
استخدم lazy loading للصور غير المهمة.
استخدم defer للـ JS غير الحرج.
احترم prefers-reduced-motion.
لا تكسر Service Worker أو cache strategy.

استهدف:
- LCP < 2.5s
- INP < 200ms
- CLS < 0.1

إذا احتجت تعديل كبير للأداء، وثّقه كتوصية PR منفصل.

────────────────────────────
12. أوامر التحقق
────────────────────────────

بعد التنفيذ شغّل المتاح:

npm run sitemap:generate
npm run seo:check
npm run seo:gate
npm run verify:all
npm run internal-links:audit
npm run performance:budget

إذا فشل أمر:
- اقرأ الخطأ.
- أصلح إذا كان بسبب تعديلاتك.
- أعد التشغيل.
- وثّق النتيجة في FINAL-SUMMARY.

إذا أمر غير موجود أو يفشل بسبب بيئة ناقصة:
- وثّق السبب بوضوح.
- لا تدّعي نجاحه.

────────────────────────────
13. Pull Request
────────────────────────────

افتح PR من:
feature/ai-governance-authority-docx-seo-fixes

إلى:
main

العنوان:
Build AI Governance authority docs, solution pages, and SEO fixes

وصف PR:
- Summary
- Why
- Technical SEO fixes
- Sitemap/robots/hreflang updates
- New solution pages
- Added docx resources
- Homepage additions only
- Services/contact additions
- llms updates
- Schema cleanup
- Validation results
- Deferred items
- Risks/notes

لا تدمج PR.

────────────────────────────
14. Acceptance Criteria
────────────────────────────

المهمة ناجحة فقط إذا:

- تم إنشاء branch منفصل.
- لم تتم إعادة تصميم الرئيسية.
- تمت إضافة Block خفيف فقط للرئيسية.
- لم يتم إنشاء Industries.
- لم يتم إنشاء Assessment.
- تم إنشاء docx/ وملفات Markdown داخله.
- تم إنشاء أو تحسين صفحات Solutions التسع.
- تم تحديث services/index.html كـ Solutions gateway.
- تم تحسين contact/index.html بشكل خفيف.
- تم تحديث llms.txt وllms-full.txt.
- تم إصلاح أو توثيق sitemap index.
- تم إصلاح robots/sitemap contradiction بخصوص /kernel/.
- تم إصلاح hreflang en-SA إلى en حيث يلزم.
- تم تنظيف Schema المضلل.
- لا توجد meta keywords مضافة.
- لا توجد aggregateRating غير مثبتة.
- كل صفحة Solution لها H1 واحد.
- كل صفحة Solution لها title فريد.
- كل صفحة Solution لها description فريدة.
- كل صفحة Solution لها canonical.
- كل صفحة Solution لها CTA واضح.
- كل صفحة Solution فيها روابط داخلية.
- ملفات docx فيها Answer Block وChecklist وFAQ وCTA.
- لا توجد demo/kernel صفحات متناقضة داخل sitemap الرئيسي.
- تم تشغيل الفحوصات أو توثيق سبب تعذرها.
- تم فتح PR.
- لم يتم الدمج إلى main.

ابدأ الآن بالتنفيذ خطوة بخطوة.
افهم بنية المشروع أولًا.
لا تكسر الموقع.
نفّذ بأقل تغييرات ممكنة وأعلى أثر ممكن.
ركّز على: Technical SEO cleanup + Solutions pages + docx authority resources + llms AI Search readiness.