أكيد يا أ.يزيد — هذه برومبتز جاهزة مرتبة حسب المهمة:

1) برومبت التحقيق الكامل

Act as a Senior Production Debugging Engineer.
I have a static/Node.js project with production routing and deployment issues.
Analyze the entire codebase carefully and investigate it like a real production incident.
Your tasks:
1. Identify the root cause of deployment or runtime failures.
2. Inspect static routes, blog routes, sitemap, canonical URLs, redirects, and rewrites.
3. Detect unsafe filenames, especially:
   - Very long filenames
   - Arabic filenames
   - Encoded Unicode filenames like #U0627
   - Filenames with spaces or special characters
4. Explain exactly why the issue fails in production.
5. Identify edge cases that can break routing.
6. Suggest a clean, production-grade fix.
7. Return complete fixed code/files, not partial patches.
Output format:
- Code function
- What’s the problem
- Why it fails
- Border cases / edge cases
- Powerful solutions
- Files that need to change
- Final fixed code

⸻

2) برومبت إصلاح أسماء ملفات المدونة

Act as a Senior Debugging Engineer and SEO-aware Static Site Architect.
Fix all unsafe blog filenames in this project.
Requirements:
1. Find all blog files with:
   - Arabic filenames
   - Encoded names like #U0627
   - Very long filenames
   - Unsafe URL characters
2. Rename every blog file to a short, stable English slug.
3. Prefer this structure:
   /blog/example-slug/index.html
4. Keep Arabic titles inside the HTML content only.
5. Do not use Arabic titles as filenames.
6. Keep each slug under 80 characters.
7. Update all internal links pointing to the old filenames.
8. Update sitemap.xml.
9. Update canonical links.
10. Create redirects from old URLs to new URLs.
11. Ensure all new routes work with:
   - /blog/slug
   - /blog/slug/
   - /blog/slug.html
Return:
- Rename map: old path -> new path
- Updated folder structure
- Updated HTML files
- Updated sitemap
- Updated redirect/rewrite config
- Any code needed to support legacy URLs

⸻

3) برومبت إصلاح render.yaml

Act as a Render.com deployment and routing expert.
Review and fix my render.yaml file for a static website.
Goals:
1. Remove duplicate rewrites and redirects.
2. Prevent redirect loops.
3. Make blog routes work correctly.
4. Redirect .html URLs to clean URLs where appropriate.
5. Support legacy Arabic or encoded blog URLs by redirecting them to short English slugs.
6. Avoid relying on very long Arabic filenames.
7. Ensure 404 fallback works correctly.
8. Keep the configuration simple and maintainable.
Expected behavior:
- / should serve index.html
- /blog/slug should serve /blog/slug/index.html
- /blog/slug/ should serve /blog/slug/index.html
- /blog/slug.html should redirect to /blog/slug/
- Unknown pages should serve 404.html
- Legacy Arabic blog URLs should 301 redirect to their new English slugs
Return the complete corrected render.yaml file.

⸻

4) برومبت سكربت CI يمنع المشكلة مستقبلاً

Act as a Senior DevOps Engineer.
Create a Node.js CI validation script for this project.
The script must fail the build if:
1. Any filename basename is longer than 80 characters.
2. Any full relative path is longer than 180 characters.
3. Any file path contains encoded Unicode patterns like #U0627.
4. Any file path contains unsafe characters.
5. Any blog HTML file does not have a canonical URL.
6. Any canonical URL points to a missing local page.
7. sitemap.xml contains URLs that do not exist locally.
8. render.yaml contains duplicate redirects or rewrites.
9. render.yaml contains possible redirect loops.
10. Any internal HTML link points to a missing local page.
Requirements:
- Use Node.js.
- No external dependencies unless absolutely necessary.
- Print clear error messages.
- Exit with code 1 when validation fails.
- Exit with code 0 when all checks pass.
- Add the npm script in package.json.
Return:
- Complete scripts/validate-production.js file
- Updated package.json scripts section
- Explanation of how to run it

⸻

5) برومبت smoke test للإنتاج

Act as a Senior QA Automation Engineer.
Create a smoke test script for my deployed website.
The script should:
1. Test all important public routes.
2. Test homepage.
3. Test service pages.
4. Test blog pages.
5. Test sitemap URLs.
6. Detect 404 pages.
7. Detect redirect loops.
8. Detect broken canonical URLs.
9. Detect missing meta titles.
10. Detect missing meta descriptions.
11. Detect HTTP status codes that are not 200 or expected 301.
12. Print a clear report.
Requirements:
- Use Node.js.
- Accept BASE_URL from environment variable.
- Example:
  BASE_URL=https://brightai.site npm run smoke-test
- No heavy external libraries.
- Follow redirects but detect excessive redirects.
- Exit with code 1 if critical routes fail.
Return:
- Complete scripts/smoke-test.js
- Updated package.json scripts
- Example command

⸻

6) برومبت إصلاح SEO بعد تغيير الروابط

Act as a Technical SEO Engineer.
After renaming unsafe Arabic blog filenames to short English slugs, fix the SEO layer.
Tasks:
1. Update sitemap.xml with the new clean URLs.
2. Remove broken or outdated URLs from sitemap.xml.
3. Update canonical URLs in every HTML page.
4. Add 301 redirects from old Arabic or encoded URLs to new English slugs.
5. Ensure no canonical points to a redirected URL.
6. Ensure no sitemap URL points to a redirected URL.
7. Ensure all internal links use the final clean URLs.
8. Ensure each blog page has:
   - Unique title
   - Unique meta description
   - Correct canonical
   - Open Graph URL
   - Twitter card URL
9. Validate that all SEO URLs return 200.
Return:
- Updated sitemap.xml
- Redirect mapping
- Updated canonical examples
- Full changed files

⸻

7) برومبت تحويل كل المقالات إلى slug map

Act as a Senior Static Site Migration Engineer.
Build a complete blog migration map.
Input:
- Existing /blog folder
- Existing sitemap.xml
- Existing internal links
- Existing render.yaml redirects and rewrites
Tasks:
1. Detect every current blog URL.
2. Detect every current blog HTML file.
3. Create a clean English slug for each blog article.
4. Map old URL to new URL.
5. Map old file path to new file path.
6. Detect duplicates.
7. Detect missing files.
8. Detect URLs in sitemap with no matching file.
9. Detect files that are not listed in sitemap.
10. Generate redirect rules for all old URLs.
11. Generate the final blog folder structure.
Rules:
- Use lowercase English slugs.
- Use hyphens only.
- Max slug length: 80 characters.
- Avoid stop words where possible.
- Keep Arabic article title inside HTML.
- New preferred route format:
  /blog/slug/
Return:
- Table: old URL | old file | new slug | new URL | new file
- Redirect rules
- Updated sitemap entries
- Any warnings

⸻

8) برومبت إصلاح السيرفر Node.js

Act as a Senior Node.js Production Engineer.
Review and fix the static file serving logic.
Problems to prevent:
1. Path traversal attacks.
2. Broken routes caused by encoded URLs.
3. Arabic URL encoding issues.
4. Missing trailing slash handling.
5. .html and clean URL mismatch.
6. 404 fallback errors.
7. Incorrect content types.
8. Reading files outside the project root.
9. Crashes from malformed URLs.
Requirements:
- Create a safe route resolver.
- Normalize incoming URL paths.
- Decode URL safely.
- Block path traversal.
- Support:
  /
  /page
  /page/
  /page.html
  /blog/slug
  /blog/slug/
  /blog/slug.html
- Use index.html inside folders when available.
- Return 404.html for unknown pages.
- Return correct content-type headers.
- Do not expose stack traces to users.
Return:
- Complete route resolver function
- Complete static server example
- Explanation of edge cases handled

⸻

9) برومبت مختصر وقوي لإعطاءه لأي AI IDE

You are a Senior Production Debugging Engineer.
Fix this project’s production deployment and routing issues.
Main suspected issue:
Unsafe blog filenames are too long and include Arabic or encoded Unicode names, causing filesystem extraction/deployment failures and broken routes.
Do the following:
1. Scan the project.
2. Confirm the root cause.
3. Rename unsafe blog files to short English slugs.
4. Update all references, links, sitemap, canonical URLs, and Open Graph URLs.
5. Simplify render.yaml.
6. Add 301 redirects from old URLs to new clean URLs.
7. Add a Node.js CI validation script to prevent long/unsafe filenames.
8. Add smoke tests for production routes.
9. Return complete updated files.
Do not return vague advice.
Do not return only diffs.
Return complete working files.

⸻

10) برومبت نهائي شامل

Act as a Principal Production Debugging Engineer, DevOps Engineer, and Technical SEO Engineer.
Investigate and fix my static/Node.js website project.
Context:
The project has deployment/routing issues in production. A likely root cause is unsafe blog filenames: long Arabic or encoded Unicode filenames such as #U0627#U0644..., which may exceed Linux filesystem filename limits and break deployment extraction or route resolution.
Your mission:
Perform a full production-grade repair.
Tasks:
1. Analyze the full project structure.
2. Identify all unsafe file paths.
3. Identify all broken static routes.
4. Identify all broken sitemap URLs.
5. Identify all broken canonical URLs.
6. Identify all broken internal links.
7. Identify render.yaml rewrite/redirect conflicts.
8. Rename unsafe blog files to short English SEO slugs.
9. Move blog pages to /blog/slug/index.html when appropriate.
10. Keep Arabic article titles inside HTML, not in filenames.
11. Update all internal links.
12. Update sitemap.xml.
13. Update canonical, Open Graph, and Twitter card URLs.
14. Create 301 redirects from old Arabic/encoded URLs to new slugs.
15. Simplify render.yaml.
16. Add a CI validation script to prevent this class of bug.
17. Add a production smoke test script.
18. Verify all important routes.
Rules:
- Slugs must be lowercase English.
- Slugs must use hyphens only.
- Slugs must be under 80 characters.
- No file basename should exceed 80 characters.
- No relative path should exceed 180 characters.
- No filenames should contain #U encoded Unicode.
- No sitemap URL should redirect or 404.
- No canonical URL should redirect or 404.
- No internal link should point to a missing page.
- Avoid redirect loops.
- Return complete changed files, not patches.
Output format:
1. Root cause summary
2. Files inspected
3. Unsafe files found
4. Migration map
5. New folder structure
6. Updated render.yaml
7. Updated sitemap.xml
8. Updated HTML canonical/link examples
9. CI validation script
10. Smoke test script
11. package.json script updates
12. Edge cases handled
13. Final verification checklist

أفضل برومبت تبدأ فيه هو رقم 10، وإذا الـ AI IDE بدأ يخبص أو يطول، استخدم رقم 9 لأنه مباشر جدًا.











2

أكيد يا أ.يزيد. هذه برومبتات تنفيذية جاهزة لكل PR، تقدر تعطيها لـ Codex / Cursor / Claude Code / أي Agent برمجي. رتبتها بحيث كل PR يشتغل مستقل، وما يتعدى نطاقه. مبنية على طلبك الأصلي إن العمل يكون: تشخيص → تعديل → قياس، وأن PR-1 خلص ويوقف التنفيذ بعد كل PR لين تجي موافقة صريحة.  ￼

⸻

PR-1 — Audit فقط

أنت مهندس Front-End أول + خبير SEO/AEO تقني + UI/UX Auditor.
المشروع: BrightAI static website.
المطلوب: تنفيذ PR-1 فقط: Audit.
ممنوع تعديل أي صفحة أو CSS أو JS أو Schema أو محتوى فعلي.
المهام:
1. افحص كل الصفحات المذكورة في خريطة الكلمات [9].
2. أنشئ ملف audit-report.md في جذر المشروع.
3. لكل صفحة، افحص:
   - Performance static audit:
     HTML size, CSS size, JS size, image assets, fonts, number of requests المتوقع.
     LCP/INP/CLS/TTFB/TBT إن أمكن عبر Lighthouse.
     إذا تعذر Lighthouse، اذكر السبب ولا تخترع أرقام.
   - SEO:
     title, meta description, canonical, hreflang ar-SA/en/x-default,
     Open Graph, Twitter Cards, JSON-LD, sitemap.xml, robots.txt.
   - UX/UI:
     contrast risks, CTA above the fold, focus states, tap targets,
     RTL issues, visual hierarchy, spacing consistency.
   - AEO/GEO:
     TL;DR داخل أول 600px,
     FAQ section,
     FAQPage Schema,
     هل الفقرة الأولى تجيب على نية الكلمة في ≤60 كلمة.
4. افحص وجود المسارات المكررة مثل:
   /tenders/ و /tenders/landing/
   وتأكد أن كل صفحة لا تستهدف كلمة صفحة أخرى.
5. لا تصلح المشاكل الآن. فقط وثّقها.
6. أضف في نهاية التقرير:
   - Prioritized issues: Critical / High / Medium / Low
   - Suggested PR mapping:
     أي مشكلة تروح PR-2 أو PR-3 أو PR-4 أو PR-5 أو PR-6 أو PR-7.
   - قائمة الملفات التي تم فحصها.
   - طريقة تشغيل Lighthouse محلياً إن لم يعمل داخل البيئة.
قيود صارمة:
- لا تعدّل HTML/CSS/JS.
- لا تضف ملفات إلا audit-report.md ولقطات/مخرجات Audit إن وجدت.
- لا تنتقل إلى PR-2.

⸻

PR-2 — Design Tokens + UI/a11y

أنت مهندس Front-End أول + UI/UX Designer + Accessibility Specialist.
نفّذ PR-2 فقط بناءً على نتائج audit-report.md.
النطاق: Design tokens + CSS variables + إصلاح التباين والوصولية العامة.
ممنوع تنفيذ تحسينات Performance الكبيرة أو SEO أو AEO إلا لو كانت مرتبطة مباشرة بالـ a11y.
المهام:
1. أنشئ أو وحّد ملف:
   assets/css/design-tokens.css
   أو المسار الأنسب حسب بنية المشروع.
2. عرّف CSS variables التالية:
   - Brand colors
   - Neutral colors
   - Semantic colors
   - Typography scale
   - 4pt spacing scale
   - Radius
   - Shadows
   - Motion tokens
   - Dark mode عبر prefers-color-scheme
   - reduced motion عبر prefers-reduced-motion
3. اربط design-tokens.css بكل الصفحات المطلوبة دون كسر التصميم الحالي.
4. وحّد الأزرار:
   .btn-primary
   .btn-secondary
   .btn-ghost
   مع:
   - تباين ≥ 4.5:1
   - focus-visible واضح ≥ 3px
   - tap target لا يقل عن 44x44px
   - CTA أساسي واحد فقط داخل كل section قدر الإمكان.
5. أضف skip-to-content link في الصفحات التي لا تحتوي عليه.
6. تأكد من وجود landmarks:
   header, nav, main, footer
   وأصلح الصفحات التي تفتقدها.
7. حسّن حالات focus لكل:
   links, buttons, form inputs, nav items.
8. أصلح مشاكل RTL باستخدام logical properties:
   margin-inline-start/end
   padding-inline-start/end
   text-align:start
   بدل left/right حيث يلزم.
9. لا تغيّر الرسائل التسويقية أو الكلمات المفتاحية.
10. لا تنشئ صفحات جديدة.
المخرجات:
- ملفات CSS المعدلة أو الجديدة.
- HTML changes الضرورية للـ skip link / landmarks / aria-labels فقط.
- تحديث audit-report.md أو إنشاء pr-2-summary.md يحتوي:
  - الملفات المعدلة ولماذا.
  - مشاكل a11y التي تم إصلاحها.
  - أي مشاكل متبقية مؤجلة لـ PR آخر.
  - لقطات قبل/بعد إن أمكن.
قيود صارمة:
- لا تعدّل title/meta/schema.
- لا تضف TL;DR أو FAQ.
- لا تعمل image conversion أو critical CSS هنا.
- لا تنتقل إلى PR-3.

⸻

PR-3 — Performance

أنت مهندس Front-End Performance Specialist.
نفّذ PR-3 فقط.
النطاق: تحسين الأداء حسب نتائج PR-1 وبدون تغيير الرسائل التسويقية أو SEO.
لا تغيّر title/meta/H1/schema/internal links إلا إذا كان التغيير تقني بحت ولا يؤثر على الاستهداف.
المهام:
1. CSS:
   - استخرج critical CSS للصفحات الرئيسية إن أمكن.
   - اجعل CSS غير الحرج deferred باستخدام media="print" onload أو preload strategy.
   - أزل CSS غير المستخدم بحذر بدون كسر التصميم.
   - امنع @import داخل CSS واستبدله بربط مباشر أو bundling.
2. JS:
   - أضف defer لكل السكربتات غير الحرجة.
   - أخّر analytics/third-party scripts إلى load أو user interaction.
   - أزل jQuery من الصفحات التي لا تحتاجه إن وجد.
   - راجع layout thrashing في JS وأصلحه عند وجوده.
3. الصور:
   - أضف width و height لكل img.
   - أضف loading="lazy" و decoding="async" للصور تحت الطية.
   - أضف fetchpriority="high" لصورة Hero واحدة فقط في الصفحة.
   - استخدم picture/srcset إن كانت الأصول موجودة.
   - لا تحذف صوراً مستخدمة.
4. الخطوط:
   - فعّل font-display: swap.
   - preload للخط الرئيسي woff2 فقط.
   - قلل أوزان الخطوط المستخدمة إلى 400/600/700 قدر الإمكان.
   - لا ترفق أو تشارك ملفات الخطوط خارج المشروع.
5. الشبكة والكاش:
   - إن وُجد config مناسب، أضف Cache-Control للأصول static مع hash strategy.
   - أضف preconnect للمصادر الخارجية الأساسية فقط.
   - أزل redirect chains داخل الروابط الداخلية إن وجدت.
6. قِس قبل/بعد:
   - Lighthouse mobile + desktop إن أمكن.
   - إن تعذر Lighthouse، اذكر السبب بوضوح واستخدم قياسات حجم الملفات والطلبات.
الأهداف:
- LCP ≤ 2.0s على 4G
- INP ≤ 200ms
- CLS ≤ 0.05
- TTFB ≤ 500ms
- Lighthouse mobile ≥ 90
المخرجات:
- pr-3-performance-summary.md يحتوي:
  - الملفات المعدلة ولماذا.
  - before/after بالأرقام المتاحة.
  - قائمة الأصول المضغوطة أو المؤجلة.
  - أي مخاطر regression.
- لا تنشئ صفحات جديدة.
قيود صارمة:
- لا تعدّل SEO copy.
- لا تضف FAQ/TL;DR.
- لا تعدّل Schema إلا لو كان مرتبطاً بإزالة خطأ تقني واضح.
- لا تنتقل إلى PR-4.

⸻

PR-4 — Technical SEO

أنت Technical SEO Engineer متخصص في المواقع ثنائية اللغة.
نفّذ PR-4 فقط.
النطاق: titles, meta descriptions, H1/H2 عند الحاجة، canonical, hreflang, schema, sitemap, robots.
التزم بخريطة الكلمات [9] وقواعد منع التعارض [11].
ممنوع إنشاء صفحات جديدة من [10] في هذا PR.
المهام:
1. لكل صفحة في خريطة [9]:
   - اضبط <title> بطول 50-60 حرف تقريباً.
   - يبدأ بالكلمة الرئيسية المخصصة.
   - ينتهي بـ | BrightAI أو | BrightAI السعودية.
   - لا تستخدم كلمة صفحة أخرى بشكل يسبب cannibalization.
2. اضبط meta description:
   - 140-160 حرف تقريباً.
   - تتضمن النية + قيمة واضحة + CTA ضمني.
   - بدون حشو كلمات.
3. تأكد أن كل صفحة تحتوي H1 واحد فقط.
   - H1 يطابق نية الكلمة المستهدفة.
   - لا تكرر H1 صفحة Money في مقالة داعمة.
4. أصلح canonical:
   - مطلق absolute URL.
   - يشير للمسار النهائي الصحيح.
5. أصلح hreflang:
   لكل صفحة عربية:
   <link rel="alternate" hreflang="ar-SA" href="https://brightai.site/PATH/">
   <link rel="alternate" hreflang="en" href="https://brightai.site/en/PATH/">
   <link rel="alternate" hreflang="x-default" href="https://brightai.site/PATH/">
   ولكل صفحة إنجليزية استخدم الروابط المتبادلة الصحيحة.
6. أضف أو أصلح Open Graph و Twitter Cards:
   - og:title
   - og:description
   - og:url
   - og:type
   - og:image إن كان موجوداً
   - twitter:card
7. JSON-LD:
   أضف الأنواع المناسبة حسب الصفحة:
   - Organization عام
   - WebSite عام
   - BreadcrumbList لكل صفحة
   - Service لصفحات Money
   - Article للمدونة
   - FAQPage فقط إذا كان FAQ موجوداً فعلياً في HTML
   - HowTo فقط للصفحات التي فيها خطوات واضحة
   - لا تضف Product إلا إذا الصفحة تبيع منتجاً واضحاً.
8. sitemap.xml:
   - حدّث كل المسارات النهائية.
   - أضف العربية والإنجليزية حيث موجودة.
   - لا تضف صفحات noindex.
9. robots.txt:
   - اسمح بالأرشفة العامة.
   - امنع /docs/openapi/ والمسارات التقنية غير المفيدة.
   - لا تمنع صفحات Money أو Blog.
10. راجع المسارات المكررة:
   - /tenders/ يستهدف نظام تحليل المناقصات.
   - /tenders/landing/ يستهدف تحليل العقود الذكية السعودية.
   - لا تكرر نفس title/H1/description بينهم.
المخرجات:
- pr-4-seo-summary.md يحتوي:
  - جدول لكل صفحة: keyword, title, meta, canonical, hreflang status, schema types.
  - الملفات المعدلة ولماذا.
  - مشاكل مؤجلة.
- لا تضف TL;DR أو FAQ content إلا لو موجود أصلاً وتحتاج Schema مطابق فقط.
قيود صارمة:
- لا تعدّل CSS/Performance إلا لو خطأ بسيط يمنع indexing.
- لا تنشئ صفحات [10].
- لا تنتقل إلى PR-5.

⸻

PR-5 — AEO / GEO / AI Search

أنت AEO/GEO Specialist متخصص في تحسين الظهور داخل ChatGPT, Gemini, Perplexity ومحركات البحث الذكية.
نفّذ PR-5 فقط.
النطاق: TL;DR, FAQ, FAQPage Schema, llms.txt, robots AI bots.
لا تغيّر title/meta/canonical/hreflang إلا إذا وجدت تعارضاً خطيراً، وفي هذه الحالة وثقه فقط ولا تعدله إلا للضرورة.
المهام:
1. لكل صفحة Money ومقالة في خريطة [9]:
   أضف بلوك TL;DR داخل أول 600px من المحتوى:
   الصيغة:
   "خلاصة: <جملتان قصيرتان تجيبان على نية الكلمة المفتاحية>."
   الشروط:
   - ≤ 60 كلمة.
   - جمل قصيرة ≤ 22 كلمة.
   - لا حشو كلمات.
   - لا وعود غير موثقة.
2. أضف قسم FAQ لكل صفحة Money ومقالة:
   - 5 إلى 8 أسئلة.
   - الأسئلة تجيب على نية الصفحة.
   - استخدم أسئلة عامة مناسبة مثل:
     ما هو الذكاء الاصطناعي؟
     كم تكلفة تطبيق الذكاء الاصطناعي في السعودية؟
     ما هي ضوابط NCA؟
     ما الفرق بين PDPL و GDPR؟
   - لا تضع أسئلة غير مرتبطة بالصفحة.
3. أضف FAQPage JSON-LD مطابق تماماً للأسئلة والأجوبة الظاهرة في HTML.
   - ممنوع إضافة FAQ في Schema غير موجود في الصفحة.
4. أضف أو حسّن Organization JSON-LD:
   - name
   - url
   - logo
   - sameAs إن وجدت روابط رسمية
   - areaServed: SA
   - knowsLanguage: ar, en
5. أنشئ /llms.txt في جذر الموقع.
   يجب أن يحتوي:
   - وصف مختصر لـ BrightAI
   - الصفحات المسموح اقتباسها: Money + Blog
   - الصفحات المستبعدة: /docs/openapi/ و /try/ و /demo/ والمسارات الداخلية
   - تعليمات واضحة للنماذج باقتباس الصفحات الرسمية.
6. حدّث robots.txt للسماح للبوتات التالية بالمحتوى العام:
   - GPTBot
   - Google-Extended
   - PerplexityBot
   - ClaudeBot
   وامنعها من:
   - /try/
   - /demo/
   - /docs/openapi/
7. أضف مراجع محلية موثوقة عند وجود ادعاء يحتاج توثيق:
   - Vision 2030
   - SDAIA
   - NCA
   - NDMO
   - PDPL
   - GASTAT
   لا تضف أرقاماً أو حقائق بدون مصدر.
المخرجات:
- pr-5-aeo-summary.md يحتوي:
  - الصفحات التي أضيف لها TL;DR.
  - الصفحات التي أضيف لها FAQ.
  - أنواع Schema المضافة.
  - محتوى llms.txt.
  - تحديثات robots.txt.
  - أي ادعاءات تم حذفها أو تخفيفها لأنها غير موثقة.
قيود صارمة:
- لا تغيّر بنية التصميم إلا بالحد الأدنى.
- لا تضف صفحات جديدة.
- لا تستخدم أسئلة FAQ مكررة حرفياً في كل الصفحات.
- لا تنتقل إلى PR-6.

⸻

PR-6 — Internal Linking

أنت SEO Information Architecture Specialist.
نفّذ PR-6 فقط.
النطاق: تحديث الروابط الداخلية وفق خريطة [9] وقواعد منع التعارض [11].
لا تغيّر title/meta/schema/CSS إلا لو الرابط يتطلب تعديل HTML بسيط.
المهام:
1. راجع كل صفحات Money في [9].
2. لكل صفحة Money، أضف 3-5 روابط داخلية داعمة.
   الروابط يجب أن تكون:
   - طبيعية داخل النص أو أقسام ذات صلة.
   - anchor text وصفي.
   - غير محشو بالكلمة المفتاحية.
3. كل مقالة داعمة يجب أن تربط إلى صفحة Money واحدة على الأقل:
   أمثلة:
   - /blog/big-data-analysis/ → /data-analysis/
   - /blog/nca-compliance/ → /cybersecurity-consulting-saudi/ فقط إذا الصفحة موجودة ومفهرسة، وإلا اربط إلى صفحة خدمات مناسبة حالية.
   - /blog/smart-inventory-management/ → /sectors/ecommerce/ أو /docs/solutions-supply-chain/
   - /docs/solutions-bi/ → /data-analysis/
   - /docs/solutions-supply-chain/ → /sectors/logistics/
   - /ai-workflows/ → /smart-automation/
4. طبّق قواعد عدم التعارض:
   - /consultation/ Money و /docs/consultation/ داعمة فقط.
   - /services/ بوابة عامة.
   - /smart-automation/ و /data-analysis/ و /ai-workflows/ لا تستهدف نفس الكلمة.
   - /tenders/ لا ينافس /tenders/landing/.
   - /interview/ لا ينافس /ai-bots/BrightRecruiter/.
   - /health/ لا ينافس /sectors/healthcare/.
5. لا تربط إلى صفحات noindex إلا إذا كان الرابط مطلوباً للمستخدم وليس SEO.
6. تأكد أن الروابط:
   - لا تكسر RTL.
   - لها focus state من PR-2.
   - لا تؤدي إلى 404.
   - تستخدم المسار النهائي مع slash موحد.
المخرجات:
- pr-6-internal-links-summary.md يحتوي:
  - جدول: From page / To page / Anchor text / سبب الرابط.
  - روابط تم حذفها أو تعديلها.
  - أي صفحات لم نجد لها داعماً مناسباً.
- لا تنشئ صفحات جديدة.
- لا تنتقل إلى PR-7.

⸻

PR-7 — New Page Stubs فقط

أنت Front-End Engineer + SEO Governance Specialist.
نفّذ PR-7 فقط.
النطاق: إنشاء stubs للصفحات الجديدة المذكورة في [10] مع noindex مبدئياً.
لا تجعل أي صفحة جديدة indexable.
لا تكتب محتوى نهائي طويل.
لا تستهدف كلمات Money الموجودة في [9].
الصفحات المطلوب إنشاء stubs لها:
- /data-ai-strategy/
- /data-governance-ndmo/
- /pdpl-ai-data-compliance/
- /procurement-automation/
- /supplier-risk-ai/
- /genomic-data-ai/
- /patient-appointment-automation/
- /ai-interview-assessment/
- /cybersecurity-consulting-saudi/
- /en/data-sovereignty-cloud-ksa/
- /en/etimad-tender-translation-ai/
- /en/saudization-compliance-ai-tools/
- /blog/etimad-tenders-ai-guide/
- /blog/technical-financial-proposals-ai/
المهام:
1. أنشئ صفحة stub لكل مسار أعلاه بنفس نظام القوالب المستخدم في المشروع.
2. كل صفحة يجب أن تحتوي:
   - title مؤقت واضح.
   - meta robots:
     <meta name="robots" content="noindex,follow">
   - canonical لذاتها.
   - H1 مؤقت.
   - فقرة قصيرة تقول إن الصفحة قيد الإعداد.
   - CTA خفيف إلى /consultation/ أو /services/ حسب السياق.
3. لا تضف هذه الصفحات إلى sitemap.xml الآن لأنها noindex.
4. لا تضف روابط داخلية قوية إليها من صفحات Money إلا عند الحاجة لتجربة المستخدم.
5. أضف قائمة بالصفحات إلى ملف tracking مثل:
   new-page-stubs.md
   يحتوي:
   - URL
   - intended keyword
   - status: noindex stub
   - required content before index
6. تأكد أن الصفحات لا ترجع 404.
7. تأكد أنها لا تنافس صفحات [9].
المخرجات:
- ملفات stubs الجديدة.
- new-page-stubs.md.
- pr-7-stubs-summary.md يحتوي:
  - كل صفحة أنشئت.
  - لماذا هي noindex.
  - ماذا يلزم قبل تحويلها إلى index.
  - تأكيد أنها غير مضافة إلى sitemap.
قيود صارمة:
- لا تجعل أي صفحة index.
- لا تضف FAQ/Schema نهائي.
- لا تعدل صفحات Money إلا إن كان ضرورياً جداً.

⸻

برومبت حوكمة قبل أي PR

استخدم هذا قبل كل PR عشان تمنع الـ Agent يخرب النطاق:

قبل التنفيذ:
1. اقرأ audit-report.md.
2. اقرأ نطاق PR الحالي فقط.
3. لا تنفذ أي مهمة من PR آخر.
4. إذا وجدت مشكلة خارج نطاق PR الحالي، وثقها في summary فقط ولا تصلحها.
5. لا تخترع أرقام Lighthouse أو Core Web Vitals.
6. لا تضف كلمات مفتاحية بحشو.
7. لا تغيّر صفحة بدون سبب تقني أو تحريري واضح.
8. بعد الانتهاء، اكتب summary واضح:
   - الملفات المعدلة.
   - سبب كل تعديل.
   - طريقة الاختبار.
   - المشاكل المؤجلة.
9. توقف بعد هذا PR وانتظر موافقة صريحة.

أفضل طريقة تمشي فيها: شغّل كل برومبت لوحده، وبعد كل PR راجع الـ diff قبل ما تدخل اللي بعده.




3


