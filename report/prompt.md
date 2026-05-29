أنت Senior Technical SEO Engineer + Static HTML SEO Architect + B2B SaaS Content Strategist + AI Search / AEO / GEO Specialist.

المشروع: BrightAI / BRIGHTAI
الريبو: YEEEAE/BRIGHTAI
الموقع: https://brightai.site
نوع المشروع حسب التحليل:
Static HTML Marketing Site + Node.js API Backend داخل frontend/.
لا يوجد /backend فعلي فعّال حسب التحليل؛ لا تفترض وجود backend/.
لا تتعامل مع المشروع كـ Next.js أو React App.
تعامل معه كموقع Static HTML + Vanilla JS + Tailwind + Node.js server داخل frontend/.

السوق المستهدف:
السعودية والخليج.

اللغة:
عربي سعودي مهني واضح، مع استخدام المصطلحات الإنجليزية عند الحاجة.

────────────────────────────
0. قاعدة التنفيذ الأساسية
────────────────────────────

لا تنفذ على main مباشرة.

أنشئ branch جديد:

feature/ai-governance-safe-authority-phase1

نفّذ كل التعديلات على هذا الفرع فقط.
افتح Pull Request للمراجعة.
لا تدمج PR.

هذا PR يجب أن يكون محافظًا ومحدود النطاق.
لا تحاول إصلاح كل شيء في المشروع دفعة واحدة.

────────────────────────────
1. حدود النطاق الصارمة
────────────────────────────

المطلوب في هذا PR فقط:

1. إصلاحات SEO تقنية حرجة وآمنة:
   - sitemap / robots / kernel contradiction
   - hreflang review بدون replace أعمى
   - schema cleanup للصفحات التي سيتم تعديلها فقط
   - llms.txt update

2. إنشاء 5 صفحات Solutions أساسية فقط:
   - /solutions/ai-governance-platform/
   - /solutions/ai-firewall/
   - /solutions/ai-audit-trail/
   - /solutions/human-approval-layer/
   - /solutions/ai-evidence-file/

3. إنشاء 5 ملفات docx Markdown أساسية فقط:
   - docx/ai-governance-saudi-arabia.md
   - docx/ai-risk-management.md
   - docx/pdpl-ai-governance.md
   - docx/nca-ecc-ai-governance.md
   - docx/ai-audit-readiness.md

4. تحديث services/index.html كمدخل واضح للحلول الخمسة.
5. إضافة Block خفيف فقط في index.html يربط للحلول.
6. تحسين خفيف في contact/index.html إن كان آمنًا.
7. إنشاء تقارير تنفيذ مختصرة داخل reports/seo/.

ممنوع في هذا PR:
- لا تعيد تصميم الصفحة الرئيسية.
- لا تستبدل index.html بالكامل.
- لا تغيّر Hero الرئيسي.
- لا تنشئ Industries pages.
- لا تنشئ Assessment pages.
- لا تنشئ /assessment/ai-governance-readiness/.
- لا تضف نموذج تقييم جاهزية.
- لا تنشئ 20 ملف docx دفعة واحدة.
- لا تنشئ 9 صفحات Solutions دفعة واحدة.
- لا تحذف dependencies.
- لا توحد Tailwind configs.
- لا تعدل tsconfig أو ESLint بشكل كبير.
- لا تحذف manifest.json أو manifest.webmanifest.
- لا تعدّل Service Worker إلا إذا كان التعديل ضروري جدًا ومثبت.
- لا تحذف meta keywords جماعيًا من كل المشروع.
- لا تنفذ find/replace واسع على كل الملفات.
- لا تضف React أو Next.js أو framework جديد.
- لا تضف aggregateRating أو reviewCount.
- لا تستخدم ادعاءات قانونية قاطعة.

────────────────────────────
2. التموضع المطلوب لـ BrightAI
────────────────────────────

BrightAI ليست شركة خدمات ذكاء اصطناعي عامة.
BrightAI = Saudi AI Safety OS / طبقة تنفيذية لحوكمة وأمان الذكاء الاصطناعي للمؤسسات السعودية.

BrightAI تساعد المؤسسات على:
- اكتشاف استخدامات AI داخل المؤسسة.
- تصنيف مخاطر الذكاء الاصطناعي.
- حماية البيانات الحساسة قبل وصولها للنماذج.
- تسجيل كل طلب AI وكل قرار وكل موافقة.
- تطبيق الموافقة البشرية على القرارات الحساسة.
- إنتاج Evidence Files لدعم جاهزية التدقيق والامتثال.
- تشغيل الحوكمة بشكل مستمر.

Core Capabilities:
- AI Governance Platform
- AI Firewall
- AI Audit Trail
- Human Approval Layer
- AI Evidence File
- AI Risk Management
- Compliance Readiness

Compliance Topics:
- PDPL
- NCA ECC 2-2024
- ISO/IEC 42001 readiness
- NIST AI RMF implementation
- Privacy and AI
- Data classification for AI

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
3. افهم المشروع قبل أي تعديل
────────────────────────────

افحص فعليًا هذه الملفات قبل التعديل:

Root:
- README.md
- package.json
- index.html
- services/index.html
- contact/index.html
- sitemap.xml
- sitemap-pages.xml
- sitemap-legal.xml
- sitemap-demo.xml
- sitemap-kernel.xml
- sitemap-images.xml
- robots.txt
- llms.txt
- llms-full.txt إن وجد
- manifest.json
- manifest.webmanifest
- redirects.json
- render.yaml

Frontend:
- frontend/package.json
- frontend/server.js
- frontend/kernel/
- frontend/routes/
- frontend/services/
- frontend/css/
- frontend/js/
- frontend/assets/

Scripts:
- scripts/generate-sitemap-all-pages.mjs
- scripts/seo-health-check.mjs
- scripts/seo-ci-check.mjs
- scripts/internal-links-audit.mjs
- scripts/check-performance-budget.js

أنشئ تقرير أولي:
reports/seo/AI-GOVERNANCE-PHASE1-AUDIT.md

يحتوي:
1. تأكيد بنية المشروع الفعلية.
2. ما سيتم تعديله في هذا PR.
3. ما لن يتم تعديله في هذا PR.
4. المخاطر المتوقعة.
5. الملفات المرشحة للتعديل.
6. ملاحظات من تقرير التحليل:
   - المشروع Static HTML + Node API داخل frontend/.
   - يوجد SEO قوي مسبقًا.
   - توجد مشكلة sitemap/robots/kernel.
   - توجد مشكلة sitemaps متعددة بدون index واضح أو robots لا يشير لها كلها.
   - توجد ملاحظة حول en-SA.
   - توجد ملاحظة حول image sitemap.
   - توجد آثار Next.js/React غير مستخدمة، لكنها مؤجلة وليست ضمن هذا PR.

────────────────────────────
4. إصلاح SEO التقني — بحذر
────────────────────────────

4.1 sitemap / robots

راجع الملفات:
- sitemap.xml
- sitemap-pages.xml
- sitemap-legal.xml
- sitemap-demo.xml
- sitemap-kernel.xml
- sitemap-images.xml
- robots.txt

المطلوب:
- لا تغيّر كل شيء بشكل واسع.
- أصلح التناقض الأهم:
  إذا /kernel/ محظور في robots.txt، لا تجعله ظاهرًا كسجل فهرسة في sitemap الرئيسي.
- إذا كان robots.txt لا يشير إلا لبعض sitemaps، حدّثه ليشير إلى sitemap index أو أهم sitemaps الفعلية.
- لا تضف docx إلى sitemap.
- لا تضف صفحات داخلية أو demo غير مناسبة للفهرسة.
- أضف صفحات Solutions الخمسة الجديدة إلى sitemap المناسب أو sitemap-solutions.xml.

التنفيذ المفضل:
- إن كان المشروع يستخدم sitemap.xml كقائمة URLs، لا تحوله جذريًا إن كان السكربت يعتمد عليه.
- إن كان آمنًا، أنشئ sitemap-solutions.xml وأضفه للrobots.txt.
- وثّق أي قرار في التقرير النهائي.

4.2 hreflang

راجع استخدام:
- en-SA
- en
- ar-SA
- x-default

لا تستبدل en-SA جماعيًا.
افعل الآتي:
- افحص هل توجد صفحات إنجليزية فعلية مقابلة.
- إذا en-SA موجود في الصفحات التي تعدلها فقط، وظهر أنه غير مناسب، استبدله بـ en.
- لا تنفذ replace شامل في كل المشروع.
- وثّق أي مشكلة أوسع كتوصية PR لاحق.

4.3 Schema

نظّف Schema فقط في:
- index.html إذا أضفت له Block.
- services/index.html إذا عدلته.
- contact/index.html إذا عدلته.
- صفحات Solutions الجديدة.

ممنوع:
- aggregateRating بدون تقييمات ظاهرة.
- reviewCount غير مثبت.
- FAQPage بدون FAQ ظاهر.
- claims غير ظاهرة للمستخدم.

استخدم:
- WebPage للـ Solutions.
- BreadcrumbList للـ Solutions.
- Organization/WebSite في الرئيسية فقط إذا كان موجودًا وصحيحًا.
- FAQPage فقط إذا توجد FAQ ظاهرة في نفس الصفحة.

لا تنظف كل Schema في المشروع دفعة واحدة.

أنشئ تقرير:
reports/seo/AI-GOVERNANCE-PHASE1-SEO-FIXES.md

يتضمن:
- ما تم إصلاحه.
- ما تم تأجيله.
- السبب.

────────────────────────────
5. إنشاء صفحات Solutions الخمسة فقط
────────────────────────────

أنشئ أو حسّن فقط:

1. /solutions/ai-governance-platform/
H1:
منصة حوكمة الذكاء الاصطناعي للمؤسسات السعودية

2. /solutions/ai-firewall/
H1:
AI Firewall لحماية البيانات الحساسة قبل وصولها للنماذج

3. /solutions/ai-audit-trail/
H1:
AI Audit Trail لتوثيق كل طلب وقرار وموافقة

4. /solutions/human-approval-layer/
H1:
طبقة الموافقة البشرية للقرارات الحساسة في أنظمة AI

5. /solutions/ai-evidence-file/
H1:
AI Evidence File لإثبات الجاهزية أمام التدقيق والمراجعة

كل صفحة تكون Static HTML وتلتزم بالتصميم الحالي قدر الإمكان.
استخدم CSS الموجود ولا تضف CSS ضخم.

لكل صفحة:
- H1 واحد.
- title فريد.
- meta description فريدة.
- canonical صحيح.
- breadcrumb ظاهر.
- BreadcrumbList JSON-LD.
- WebPage JSON-LD.
- FAQ ظاهر.
- CTA فوق الصفحة ووسطها وآخرها.
- روابط داخلية إلى:
  - /
  - /services/
  - /contact/
  - صفحات Solutions ذات علاقة.
- لا تستخدم meta keywords.
- لا تضف aggregateRating.
- لا تضف reviewCount.
- لا تستخدم claims قانونية قطعية.

هيكل كل صفحة:
1. Hero مختصر.
2. الإجابة المختصرة:
   فقرتان إلى 4 جمل مناسبة لمحركات الإجابة.
3. المشكلة التجارية.
4. متى تحتاج المؤسسة هذا الحل؟
5. كيف يعمل BrightAI؟
6. ماذا يكتشف BrightAI؟
7. ماذا يتحكم به BrightAI؟
8. ماذا يسجل BrightAI؟
9. ما الدليل الذي ينتجه BrightAI؟
10. مخرجات تجارية واضحة.
11. FAQ.
12. CTA نهائي.

CTAs المسموحة:
- اطلب ديمو تنفيذي.
- تحدث مع فريق BrightAI.
- استكشف حلول الحوكمة.
- تواصل معنا.

CTAs الممنوعة:
- احجز تقييم جاهزية.
- ابدأ Assessment.
- ابدأ تقييم المخاطر.

────────────────────────────
6. ملفات docx الخمسة فقط
────────────────────────────

أنشئ مجلد:
docx/

ثم أنشئ فقط:

1. docx/ai-governance-saudi-arabia.md
العنوان:
حوكمة الذكاء الاصطناعي في السعودية: دليل تنفيذي للمؤسسات

2. docx/ai-risk-management.md
العنوان:
إدارة مخاطر الذكاء الاصطناعي للمؤسسات السعودية

3. docx/pdpl-ai-governance.md
العنوان:
PDPL والذكاء الاصطناعي: إدارة الخصوصية والمخاطر داخل المؤسسة

4. docx/nca-ecc-ai-governance.md
العنوان:
NCA ECC وحوكمة الذكاء الاصطناعي: ضوابط تشغيلية للجهات المنظمة

5. docx/ai-audit-readiness.md
العنوان:
جاهزية تدقيق الذكاء الاصطناعي: كيف تثبت السيطرة والامتثال؟

لكل ملف Markdown:
- Frontmatter:
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
- Disclaimer عند الامتثال:
  "هذا المحتوى لأغراض معرفية وتشغيلية ولا يعد استشارة قانونية."

لا تحول هذه الملفات إلى صفحات HTML.
لا تضفها إلى sitemap.
لا تنشئ 20 ملفًا الآن.

────────────────────────────
7. الصفحة الرئيسية — إضافة خفيفة فقط
────────────────────────────

في index.html:
لا تعيد كتابة الصفحة.
لا تغير Hero.
لا تغير Layout جذري.

أضف Block صغير بعنوان:
"مركز حوكمة الذكاء الاصطناعي"

النص:
"تعرّف كيف تساعد BrightAI المؤسسات السعودية على تحويل سياسات الذكاء الاصطناعي إلى ضوابط تشغيلية قابلة للتدقيق، مع AI Firewall وسجل تدقيق وموافقات بشرية وملفات أدلة."

روابط:
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

لا تحذف أقسام.
لا تحذف سكربتات.
لا تغيّر التصميم إلا بقدر لازم لإضافة هذا البلوك.

────────────────────────────
8. صفحة الخدمات — بوابة Solutions
────────────────────────────

في services/index.html:
لا تعيد تصميم الصفحة بالكامل.
أضف أو حسّن قسم واضح للحلول الخمسة:

- AI Governance Platform
- AI Firewall
- AI Audit Trail
- Human Approval Layer
- AI Evidence File

لكل حل:
- عنوان.
- وصف من جملة أو جملتين.
- رابط صفحة Solution.
- CTA صغير.

الهدف:
تتحول services إلى مدخل تجاري للحلول بدون تغيير جذري.

────────────────────────────
9. صفحة التواصل — تحسين خفيف فقط
────────────────────────────

في contact/index.html:
إن كان آمنًا:
- أضف CTA واضح:
  "اطلب ديمو تنفيذي"
- أضف Microcopy:
  "نستخدم بيانات التواصل للرد على طلبك فقط وفق سياسة الخصوصية وبيان PDPL."
- أضف روابط إلى أهم صفحات Solutions.
- لا تضف Assessment.
- لا تضف نموذج جديد كبير.
- لا تعيد تصميم الصفحة.

────────────────────────────
10. تحديث llms.txt
────────────────────────────

حدّث llms.txt ليشمل:
- تعريف مختصر لـ BrightAI.
- تعريف BrightAI Kernel.
- روابط صفحات Solutions الخمسة.
- قائمة ملفات docx الخمسة كموارد داخلية/مرجعية.
- الوصف الثابت:

BrightAI is an operational AI governance and safety layer for Saudi organizations, helping teams classify AI risks, protect sensitive data, maintain audit trails, apply human approvals, and produce evidence for compliance readiness.

إذا llms-full.txt موجود، حدثه بإضافة نفس البنية.
إذا غير موجود، لا تنشئه في هذا PR إلا إذا كان ذلك بسيطًا وآمنًا.
الأولوية لـ llms.txt فقط.

────────────────────────────
11. تقارير مطلوبة
────────────────────────────

أنشئ فقط هذه التقارير:

1. reports/seo/AI-GOVERNANCE-PHASE1-AUDIT.md
2. reports/seo/AI-GOVERNANCE-PHASE1-SEO-FIXES.md
3. reports/seo/AI-GOVERNANCE-PHASE1-INTERNAL-LINKING.md
4. reports/seo/AI-GOVERNANCE-PHASE1-FINAL-SUMMARY.md

لا تنشئ تقارير كثيرة في هذا PR.

FINAL-SUMMARY يجب أن يحتوي:
- ما تم.
- الصفحات الجديدة.
- ملفات docx الجديدة.
- الملفات المعدلة.
- أوامر الفحص التي شُغّلت.
- النتائج.
- ما تم تأجيله ولماذا.
- توصيات PR التالي.

PR التالي المقترح:
- Phase 2: بقية صفحات Solutions.
- Phase 3: بقية ملفات docx.
- Phase 4: image sitemap + OG images.
- Phase 5: cleanup dependencies/configs.
- Phase 6: English marketing pages.

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
- أصلح إذا كان متعلقًا بتعديلاتك.
- أعد التشغيل.
- وثّق النتيجة.

إذا أمر غير موجود أو يفشل بسبب البيئة:
- وثّق السبب.
- لا تدّعي نجاحه.

────────────────────────────
13. Pull Request
────────────────────────────

افتح PR من:
feature/ai-governance-safe-authority-phase1

إلى:
main

عنوان PR:
Phase 1: Add AI Governance solution pages and safe SEO fixes

وصف PR:
- Summary
- Why
- Scope
- New solution pages
- New docx resources
- Homepage addition only
- Services/contact additions
- SEO fixes
- llms.txt update
- Validation results
- Deferred items
- Risks

لا تدمج PR.

────────────────────────────
14. Acceptance Criteria
────────────────────────────

المهمة ناجحة فقط إذا:

- تم إنشاء branch منفصل.
- لم تتم إعادة تصميم الصفحة الرئيسية.
- تمت إضافة Block خفيف فقط للرئيسية.
- لم يتم إنشاء Industries.
- لم يتم إنشاء Assessment.
- تم إنشاء 5 صفحات Solutions فقط.
- تم إنشاء 5 ملفات docx فقط.
- تم تحديث services/index.html بروابط الحلول.
- تم تحسين contact/index.html بشكل خفيف إن كان آمنًا.
- تم تحديث llms.txt.
- تم إصلاح أو توثيق مشكلة sitemap/robots/kernel.
- لم يتم تنفيذ replace شامل لـ hreflang.
- تم توثيق hreflang issues إن وجدت.
- لم يتم حذف dependencies.
- لم يتم تعديل Tailwind configs.
- لم يتم حذف manifest files.
- لم تتم إضافة meta keywords.
- لم تتم إضافة aggregateRating.
- كل صفحة Solution لها H1 واحد.
- كل صفحة Solution لها title وdescription وcanonical.
- كل صفحة Solution لها CTA وروابط داخلية.
- كل ملف docx يحتوي Answer Block وChecklist وFAQ وCTA.
- تم تشغيل الفحوصات أو توثيق سبب تعذرها.
- تم فتح PR.
- لم يتم الدمج إلى main.

ابدأ الآن خطوة بخطوة.
أقل تغييرات ممكنة، أعلى أثر ممكن.
ركّز على: SEO technical safety + 5 core solution pages + 5 authority docs + llms.txt.