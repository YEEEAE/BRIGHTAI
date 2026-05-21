تمام أ.يزيد، هذه مجموعة برومبتات جاهزة تنسخها في Codex **واحد واحد بالترتيب**. خلي Codex يشتغل على كل مهمة مستقلة، وبعد كل برومبت راجع الـ diff قبل الانتقال للي بعده.

---

## Prompt 0 — تهيئة المشروع وفهم البنية

```text
You are a senior SEO engineer and full-stack code auditor.

Analyze this repository before making changes. The project appears to mix a static HTML marketing site with a Next.js app. Your first task is to inspect the deployment structure and produce a concise implementation plan.

Focus on:
- render.yaml
- package.json scripts
- app/page.tsx
- index.html
- sitemap.xml and related sitemap files
- robots.txt
- _redirects
- _headers if present
- public/static output behavior
- folders that should never be deployed publicly: .next, app, backend, scripts, tests, reports, tmp, mais-OBM, node_modules

Do not modify files yet.

Output:
1. Current deployment model.
2. Files/folders being published.
3. SEO/security risks.
4. Exact files you recommend changing.
5. Commands to validate after changes.
```

---

## Prompt 1 — إصلاح خطر `app/page.tsx` وعدم تحويل الرئيسية إلى Demo

```text
Fix the Next.js root page risk.

Current issue:
app/page.tsx redirects "/" to "/demo/ocr-demo/". This is dangerous if the site is ever deployed as a Next.js app because the homepage would become a demo page instead of the marketing homepage.

Tasks:
1. Replace the redirect behavior in app/page.tsx with a proper marketing homepage.
2. Use Arabic RTL content targeting Saudi companies.
3. Keep the page lightweight and accessible.
4. Add correct Next.js metadata:
   - Arabic title
   - Arabic meta description
   - canonical https://brightai.site/
   - hreflang ar-SA, en-SA, x-default
   - Open Graph
   - Twitter card
   - robots index/follow
5. The H1 must target: "حلول الذكاء الاصطناعي للشركات في السعودية".
6. Primary CTA: "احجز جلسة تشخيص AI"
7. Secondary CTA: "استعرض الخدمات المؤسسية"
8. Link CTAs to:
   - /consultation/
   - /services/
9. Do not introduce new dependencies.
10. Ensure the file is complete and production-ready.

After changes:
- Show the full updated app/page.tsx.
- Run typecheck/build if available.
- Report any failing command clearly.
```

---

## Prompt 2 — تنظيف النشر في `render.yaml`

```text
Harden the static deployment configuration.

Current issue:
render.yaml appears to copy too much of the repository into .render-static. It may accidentally publish development/build/internal folders such as .next, app, backend, scripts, tests, reports, tmp, and mais-OBM.

Tasks:
1. Update render.yaml buildCommand so the static output excludes:
   - .git
   - node_modules
   - .render-static
   - .agents
   - .next
   - app
   - backend
   - scripts
   - tests
   - telegram-devto-bot
   - reports
   - tmp
   - mais-OBM
   - *.md
   - package-lock.json if not needed in static output
   - package.json if not needed in static output
   - tsconfig files
   - config/dev files
2. Keep only files needed for the static website:
   - HTML pages
   - assets
   - CSS
   - JS needed by pages
   - images
   - robots.txt
   - sitemap files
   - _redirects
   - _headers
   - manifest/service worker files if intentionally used
3. Do not break current static HTML deployment.
4. Add comments in render.yaml explaining why sensitive/dev folders are excluded.
5. Keep existing build scripts if they are required:
   - assets:minify
   - assets:replace-refs
   - production:fixes
   - sitemap:all
   - seo:gate
   - seo-hreflang-dirs.sh

After changes:
- Show the updated render.yaml.
- Explain exactly which folders are now excluded.
- Provide a command to inspect .render-static after build.
```

---

## Prompt 3 — إزالة أو حماية `/mais-OBM/` وملف Excel

```text
Remove sensitive/internal pages and data from public deployment.

Current issue:
The repository contains mais-OBM/index.html and mais-OBM/OBM-DATA .xlsx. This appears to be an internal operational dashboard/data file and must not be publicly deployed or indexed.

Tasks:
1. Remove mais-OBM from static deployment.
2. If the folder is needed for internal use, move it to a non-public location such as private/mais-OBM or internal/mais-OBM and ensure it is excluded from deployment.
3. Ensure sitemap files do not include /mais-OBM/.
4. Ensure internal links do not point to /mais-OBM/.
5. Add a security note file if helpful, e.g. docs/internal-data-policy.md, explaining that Excel/data files must not be committed to public static paths.
6. If deletion is risky, do not permanently delete data. Move it and update .gitignore or deployment exclusions.
7. Add .gitignore rules for:
   - mais-OBM/
   - *.xlsx in public/static paths
   - internal data dumps

After changes:
- Show all file moves/deletions.
- Show .gitignore changes.
- Confirm no sitemap or HTML page references /mais-OBM/.
- Provide grep commands used for validation.
```

---

## Prompt 4 — توليد Sitemap نظيف

```text
Rebuild all sitemap files correctly.

Current issue:
Sitemap files contain URLs that do not match final published pages, including /reports/keywords/docs/ and duplicate paths from files like "index 2.html".

Tasks:
1. Inspect sitemap.xml, sitemap-services.xml, sitemap-blog.xml, and any sitemap index files.
2. Remove:
   - /reports/
   - /reports/keywords/docs/
   - /mais-OBM/
   - /offline/
   - /404.html
   - /500.html
   - /error.html
   - any URL generated from "index 2.html"
   - demo settings/report/template subpages that should not be indexed
3. Include only canonical public pages intended to rank.
4. Prefer clean trailing-slash URLs, not .html URLs, if _redirects canonicalizes them.
5. Make sitemap URLs match canonical tags.
6. Ensure each URL is absolute and uses https://brightai.site.
7. Add lastmod only if reliable. If not reliable, omit it.
8. Update or create the sitemap generation script so future generation does not re-add bad URLs.
9. Add validation script or npm script:
   - checks sitemap URLs are not forbidden
   - checks no /reports/
   - checks no /mais-OBM/
   - checks no "index 2"
   - checks no .html canonical URLs if clean URLs are the canonical standard

After changes:
- Show updated sitemap files or generation script.
- Run validation.
- Print a summary: total URLs before/after and removed categories.
```

---

## Prompt 5 — تحديث `robots.txt` و`_headers`

```text
Improve robots.txt and HTTP indexing headers safely.

Important:
Do not rely on robots.txt to hide sensitive pages. Sensitive pages must be removed or protected first. robots.txt is only a crawl guidance file.

Tasks:
1. Update robots.txt to:
   - Allow public site crawling.
   - Disallow development/internal folders if accidentally present:
     /.next/
     /app/
     /backend/
     /scripts/
     /tests/
     /tmp/
     /reports/
   - Reference the correct sitemap files.
2. Create or update _headers to add X-Robots-Tag noindex for non-search pages:
   - /404.html
   - /500.html
   - /error.html
   - /offline/*
   - /demo/ai-tenders-analysis/settings/*
   - /demo/ai-tenders-analysis/reports/*
   - /demo/ai-tenders-analysis/templates/*
3. Do not noindex commercial pages, service pages, blog pages, location pages, or the homepage.
4. If the platform does not support _headers, create an equivalent headers configuration and document it.

After changes:
- Show robots.txt.
- Show _headers.
- Explain which paths are noindex and why.
- Provide curl commands to validate headers after deployment.
```

---

## Prompt 6 — توحيد بيانات التواصل NAP

```text
Unify Bright AI local business identity across the website.

Current issue:
The homepage and contact page show inconsistent contact identity:
- Homepage uses info@brightai.site and one Riyadh address.
- Contact page uses yazeed1job@gmail.com and a different Riyadh address.
This harms trust and Local SEO.

Tasks:
1. Choose the official NAP as:
   Name: Bright AI
   Phone: +966 53 822 9013
   Email: info@brightai.site
   Address: 6913 المبارك بن فضالة، حي الفيحاء، الرياض 14254، المملكة العربية السعودية
2. Replace inconsistent Gmail email on public pages with info@brightai.site.
3. Replace inconsistent address on contact page and schema with the official address above.
4. Update LocalBusiness and Organization JSON-LD sitewide.
5. Ensure same NAP appears in:
   - homepage footer
   - contact page
   - consultation page if present
   - location pages
   - schema JSON-LD
   - Open Graph if contact info appears there
6. Do not invent social links. If social links are not verified in the repository, omit sameAs or leave only verified links.
7. Add a shared data source if possible, e.g. data/business-profile.json or a JS module, to prevent future inconsistencies.

After changes:
- Show files changed.
- Show the shared NAP source if created.
- Run grep to verify yazeed1job@gmail.com no longer appears in public HTML.
- Run grep to verify all old address variants are removed.
```

---

## Prompt 7 — إصلاح صفحات الخطأ والصفحات غير المناسبة للفهرسة

```text
Fix indexability for error and utility pages.

Current issue:
404.html, 500.html, error.html, offline/index.html and some demo utility pages may be indexable and may have canonical/hreflang inconsistencies.

Tasks:
1. For 404.html, 500.html, error.html:
   - Add meta robots noindex,nofollow,noarchive,nosnippet.
   - Remove or neutralize canonical if misleading.
   - Ensure the page content is helpful to users.
   - Link back to homepage and contact page.
2. For offline/index.html:
   - Add noindex,nofollow,noarchive,nosnippet.
3. For demo settings/report/template pages:
   - Add noindex unless they are intentionally public landing pages.
4. Remove these pages from sitemap files.
5. Ensure no commercial page links unnecessarily to error pages.
6. If _headers is present, add X-Robots-Tag noindex as a stronger fallback.

After changes:
- Show changed files.
- Show final meta robots for each utility page.
- Confirm sitemap no longer includes them.
```

---

## Prompt 8 — إصلاح اللغة المختلطة في صفحات `en/*`

```text
Fix mixed Arabic content in English pages.

Current issue:
Several English pages under /en/ contain Arabic text in metadata, body, schema, FAQ, or reviews. This weakens hreflang clarity and English targeting.

Tasks:
1. Scan all /en/ HTML files for Arabic Unicode characters.
2. Categorize findings:
   - acceptable brand names or Arabic examples
   - problematic Arabic metadata
   - problematic Arabic schema
   - problematic Arabic body content
   - problematic Arabic FAQ/reviews
3. Fix problematic English pages so they are fully English:
   - /en/contact/
   - /en/terms/
   - /en/privacy-cookies/
   - /en/ai-bots/*
   - any other affected /en/ pages
4. Ensure English metadata targets:
   - AI company in Saudi Arabia
   - AI automation Saudi Arabia
   - Artificial Intelligence Saudi Arabia
   - enterprise AI Saudi Arabia
5. Ensure hreflang points correctly between Arabic and English equivalents.
6. Do not remove Arabic pages. Only fix English pages.
7. Keep schema language consistent with page language.

After changes:
- Show list of files fixed.
- Show before/after examples.
- Run a script or grep command to report remaining Arabic characters in /en/.
- If some Arabic remains intentionally, list why.
```

---

## Prompt 9 — تقصير وتحسين Titles وDescriptions

```text
Optimize meta titles and descriptions.

Current issue:
Many pages have titles longer than 65 characters and descriptions longer than 170 characters. This can reduce SERP clarity and CTR.

Tasks:
1. Write a script to audit all HTML files:
   - title length
   - meta description length
   - canonical
   - H1
2. Export report to reports/seo-meta-audit.json but do not deploy reports publicly.
3. Fix priority pages first:
   - /
   - /services/
   - /contact/
   - /consultation/
   - /locations/riyadh/
   - /locations/jeddah/
   - /locations/dammam/
   - main service pages
   - top blog pages if obvious
4. Rules:
   - Arabic title target: 45–62 characters.
   - English title target: 45–60 characters.
   - Description target: 135–160 characters.
   - Include primary keyword naturally.
   - Include Saudi intent where relevant.
   - Avoid keyword stuffing.
5. Preserve existing canonical URLs unless they are wrong.
6. Ensure each page has a unique title and description.

Recommended Arabic examples:
Homepage title:
"حلول الذكاء الاصطناعي للشركات في السعودية | Bright AI"

Homepage description:
"وكلاء AI، أتمتة أعمال، وتحليل بيانات للشركات السعودية مع تنفيذ عملي قابل للقياس وحوكمة مناسبة للسوق المحلي."

Services title:
"خدمات الذكاء الاصطناعي للشركات | Bright AI"

Services description:
"استكشف حلول AI للأتمتة، الوكلاء الذكيين، الشات بوت، وتحليل البيانات للشركات في السعودية."

After changes:
- Show changed titles/descriptions.
- Run the audit script again.
- Print remaining titles >65 and descriptions >170.
```

---

## Prompt 10 — إصلاح الروابط الداخلية `.html` إلى روابط Canonical

```text
Clean internal links to avoid unnecessary 301 redirects.

Current issue:
Some internal links point to .html URLs that redirect to clean trailing-slash canonical URLs.

Tasks:
1. Scan all HTML files for internal links ending in .html.
2. Convert internal links to clean canonical paths:
   - /services.html -> /services/
   - /contact.html -> /contact/
   - /consultation.html -> /consultation/
   - /blog/example/index.html -> /blog/example/
   - apply similar patterns safely
3. Do not modify external links.
4. Do not modify asset links such as .css, .js, .png, .svg, .webp.
5. Do not modify file downloads unless they are public intentional downloads.
6. Ensure _redirects can remain as backward compatibility but internal links should not rely on redirects.
7. Re-run link scan after changes.

After changes:
- Report number of links changed.
- Show sample before/after.
- Confirm no internal navigation links still point to .html except valid static assets/downloads.
```

---

## Prompt 11 — تحسين الصفحة الرئيسية UX/SEO

```text
Improve the homepage UX and conversion structure without changing the visual identity drastically.

Current issue:
The homepage has a decent Arabic SEO hero, but the page has too many navigation paths and the trust/conversion journey is not focused enough.

Tasks:
1. Keep Arabic RTL.
2. Keep primary keyword:
   "شركة ذكاء اصطناعي في السعودية"
   and support:
   "حلول الذكاء الاصطناعي للشركات"
   "أتمتة الأعمال"
   "وكلاء الذكاء الاصطناعي"
3. Restructure homepage sections in this order:
   - Hero with one clear promise
   - 3 core benefits
   - Trust strip: Saudi focus, Arabic-first, measurable pilots
   - Services overview: AI agents, automation, chatbot, data analytics
   - Use cases by sector: government, healthcare, retail, logistics, real estate
   - How we work: diagnose, pilot, integrate, measure
   - Case study placeholders if real case studies are not available
   - FAQ
   - Final CTA
4. Primary CTA:
   "احجز جلسة تشخيص AI"
5. Secondary CTA:
   "استعرض حلول الشركات"
6. Add stronger copy for the hero:
   H1:
   "شركة ذكاء اصطناعي في السعودية لتنفيذ حلول AI قابلة للقياس"
   Subtext:
   "نساعد الشركات السعودية على بناء وكلاء ذكاء اصطناعي، أتمتة أعمال، شات بوت عربي، وتحليلات بيانات ترتبط بأنظمتها الحالية وتخدم أهداف التشغيل والنمو."
7. Improve accessibility:
   - one H1 only
   - logical H2/H3
   - descriptive alt attributes
   - buttons/links have accessible names
8. Do not break current CSS/JS.
9. Keep page static-friendly.

After changes:
- Show changed homepage sections.
- Confirm H1 count.
- Confirm CTA links.
- Run build or HTML validation if available.
```

---

## Prompt 12 — تحويل صفحة الخدمات من “كتالوج” إلى صفحة قرار B2B

```text
Improve /services/ from a catalog/cart-style page into a B2B decision page.

Current issue:
The services page currently feels like a product catalog with prices, cart, WhatsApp order, and bank transfer. This may hurt enterprise trust for high-value AI services.

Tasks:
1. Keep service cards if useful, but reduce the e-commerce feel on the main /services/ page.
2. Move direct pricing/cart emphasis lower or to separate offer/demo pages if possible.
3. New structure:
   - Hero: "خدمات الذكاء الاصطناعي للشركات في السعودية"
   - Problem selector: "أريد تقليل العمل اليدوي / تحسين خدمة العملاء / تحليل البيانات / بناء وكيل AI"
   - Core services:
     a. وكلاء الذكاء الاصطناعي
     b. أتمتة الأعمال
     c. شات بوت عربي ذكي
     d. تحليل البيانات ولوحات القياس
     e. تكامل الأنظمة
   - Industries served
   - Implementation methodology
   - FAQ
   - CTA to consultation
4. Primary CTA:
   "اطلب توصية بالخدمة المناسبة"
5. Secondary CTA:
   "احجز جلسة تشخيص AI"
6. Keep SEO metadata optimized.
7. Add Service schema for the main service categories.
8. Do not remove WhatsApp contact entirely; keep it as a secondary fast-contact option.
9. Preserve any existing links that are important for navigation.

After changes:
- Show updated /services/ content structure.
- Confirm metadata.
- Confirm schema.
- Confirm CTAs.
```

---

## Prompt 13 — تحسين صفحة التواصل

```text
Improve /contact/ for trust, Local SEO, and conversion.

Current issue:
The contact page has inconsistent email/address and needs clearer B2B conversion messaging.

Tasks:
1. Use official NAP:
   - Bright AI
   - +966 53 822 9013
   - info@brightai.site
   - 6913 المبارك بن فضالة، حي الفيحاء، الرياض 14254، السعودية
2. Remove yazeed1job@gmail.com from public contact page.
3. Add a short trust intro:
   "تواصل معنا لمناقشة مشروع ذكاء اصطناعي، أتمتة أعمال، أو وكيل AI مناسب لشركتك في السعودية."
4. Add contact options:
   - WhatsApp
   - Phone
   - Email
   - Consultation booking
5. Add expected response note:
   "نراجع الطلبات خلال يوم عمل."
6. Improve form labels and accessibility:
   - name
   - company
   - email
   - phone
   - service interest
   - message
7. Add LocalBusiness schema with unified NAP.
8. Ensure CTA is clear:
   "أرسل طلبك"
   "احجز جلسة تشخيص AI"
9. Keep page lightweight.

After changes:
- Show updated contact page.
- Confirm no Gmail remains.
- Confirm schema uses official NAP.
```

---

## Prompt 14 — تحسين صفحة الاستشارة

```text
Improve /consultation/ as the primary conversion page.

Current issue:
The page is good but needs clearer deliverables and stronger B2B trust.

Tasks:
1. Keep Arabic RTL.
2. Hero H1:
   "احجز جلسة تشخيص AI لشركتك"
3. Subtext:
   "خلال 30 دقيقة نحدد فرص الأتمتة والذكاء الاصطناعي الأعلى أثرًا، ونقترح مسار Pilot قابل للقياس."
4. Add section: "ماذا تحصل بعد الجلسة؟"
   Include:
   - قائمة أولويات لحالات الاستخدام
   - تقييم جاهزية البيانات والأنظمة
   - توصية بأول Pilot
   - تقدير أولي للجهد والمخاطر
5. Add section: "لمن تناسب الجلسة؟"
   - الإدارات التنفيذية
   - العمليات
   - خدمة العملاء
   - المبيعات
   - التحول الرقمي
6. Add FAQ:
   - هل الجلسة مجانية؟
   - هل نحتاج بيانات قبل الاجتماع؟
   - هل تناسب الشركات الصغيرة؟
   - هل تقدمون حلولًا داخل السعودية؟
7. Improve form accessibility.
8. Primary CTA:
   "احجز الجلسة الآن"
9. Add Consultation/Service schema if appropriate.
10. Ensure metadata is optimized.

After changes:
- Show updated page sections.
- Confirm CTA and form fields.
- Confirm metadata and schema.
```

---

## Prompt 15 — بناء صفحات المدن الجديدة وتحسين الحالية

```text
Improve Local SEO location pages and create missing Saudi city pages.

Current issue:
Existing city pages for Riyadh, Jeddah, and Dammam are too template-like and similar. Missing local pages include Khobar, Makkah, Madinah, NEOM, and Eastern Province.

Tasks:
1. Improve existing:
   - /locations/riyadh/
   - /locations/jeddah/
   - /locations/dammam/
2. Create new:
   - /locations/khobar/
   - /locations/makkah/
   - /locations/madinah/
   - /locations/neom/
   - /locations/eastern-province/
3. Each page must have unique localized copy, not duplicated boilerplate.
4. Each city page structure:
   - H1 with city keyword
   - Local business/service intro
   - Relevant industries in that city
   - AI use cases specific to city/region
   - Services offered
   - FAQ unique to the city
   - CTA
5. Example titles:
   Riyadh:
   "شركة ذكاء اصطناعي في الرياض | Bright AI"
   Jeddah:
   "حلول الذكاء الاصطناعي للشركات في جدة | Bright AI"
   Dammam:
   "أتمتة وذكاء اصطناعي للشركات في الدمام | Bright AI"
   Khobar:
   "حلول الذكاء الاصطناعي في الخبر | Bright AI"
6. Add LocalBusiness/Service schema with areaServed.
7. Add all new pages to sitemap.
8. Add internal links from:
   - homepage
   - footer
   - services page
   - locations hub if present
9. Avoid fake claims. If no office exists in each city, phrase as "نخدم الشركات في..." not "مكتبنا في...".

After changes:
- Show new files created.
- Show sitemap updates.
- Show internal links added.
- Run duplicate similarity check if a script exists or create a simple one.
```

---

## Prompt 16 — إنشاء صفحات خدمات ناقصة للسوق السعودي

```text
Create or improve Saudi-focused service landing pages.

Target pages:
1. /services/ai-solutions-saudi/
2. /services/business-automation-saudi/
3. /services/ai-agents-saudi/
4. /services/ai-chatbot-arabic/
5. /services/data-analytics-ai-saudi/
6. /services/enterprise-ai-consulting-saudi/

Tasks:
1. If a page already exists, improve it instead of duplicating.
2. Each page must have:
   - unique title
   - meta description
   - canonical
   - hreflang if English equivalent exists
   - one H1
   - clear CTA
   - Service schema
   - FAQ schema
3. Use Saudi B2B search intent.
4. Avoid generic repeated copy.
5. Structure each page:
   - Hero
   - Who this is for
   - Business problems solved
   - What we implement
   - Integration/governance notes
   - Deliverables
   - Timeline/Pilot approach
   - FAQ
   - CTA
6. Add internal links between services.
7. Add these pages to sitemap if indexable.

Primary CTA:
"احجز جلسة تشخيص AI"

Secondary CTA:
"تواصل عبر واتساب"

After changes:
- List pages created/updated.
- Show metadata for each.
- Show sitemap additions.
```

---

## Prompt 17 — إنشاء صفحات قطاعات Sector Pages

```text
Create sector-focused AI landing pages for Saudi Arabia.

New pages:
1. /sectors/government-ai-saudi/
2. /sectors/healthcare-ai-saudi/
3. /sectors/retail-ai-saudi/
4. /sectors/logistics-ai-saudi/
5. /sectors/real-estate-ai-saudi/

Tasks:
1. Create unique Arabic content for each sector.
2. Do not make legal/compliance claims unless already supported by the site.
3. Include:
   - H1
   - sector-specific pain points
   - AI use cases
   - implementation approach
   - risks/governance section
   - FAQ
   - CTA
4. Add metadata and schema.
5. Add links from homepage, services page, and relevant blog articles.
6. Add to sitemap.
7. Keep copy practical and Saudi-market focused.

Example H1s:
- "حلول الذكاء الاصطناعي للقطاع الحكومي في السعودية"
- "حلول AI للقطاع الصحي في السعودية"
- "أتمتة وذكاء اصطناعي لقطاع التجزئة في السعودية"

After changes:
- Show files created.
- Show internal links added.
- Show sitemap update.
```

---

## Prompt 18 — تنظيف تكرار محتوى المدونة Boilerplate

```text
Reduce duplicate boilerplate content across blog pages.

Current issue:
Many Arabic and English blog pages contain repeated generic paragraphs. This weakens topical uniqueness.

Tasks:
1. Scan blog pages for repeated paragraphs.
2. Identify repeated blocks occurring in more than 5 pages.
3. For repeated blocks:
   - Remove if low value.
   - Replace with article-specific paragraphs.
   - Keep only a short reusable CTA if needed.
4. Prioritize Arabic AI/Saudi articles and English AI/Saudi articles.
5. For each updated article:
   - Keep unique intro
   - Add specific examples
   - Add internal links to related service pages
   - Add FAQ if relevant
6. Do not mass-generate thin content.
7. Produce a report:
   - repeated block
   - count
   - pages affected
   - action taken

After changes:
- Show report.
- Show sample before/after.
- Confirm no repeated paragraph appears in more than 5 pages unless intentionally part of footer/navigation.
```

---

## Prompt 19 — إضافة FAQ عملي للصفحات التجارية

```text
Add conversion-focused FAQ sections to key commercial pages.

Target pages:
- /
- /services/
- /services/ai-solutions-saudi/
- /services/business-automation-saudi/
- /services/ai-agents-saudi/
- /services/ai-chatbot-arabic/
- /consultation/
- /locations/riyadh/
- /locations/jeddah/
- /locations/dammam/

FAQ themes:
1. مدة تنفيذ أول Pilot.
2. هل الحل يناسب الأنظمة الحالية؟
3. هل الحل يدعم العربية؟
4. هل يمكن ربطه مع CRM/ERP/WhatsApp؟
5. كيف يتم قياس العائد؟
6. كيف تتعاملون مع خصوصية البيانات؟
7. هل تخدمون الشركات خارج الرياض؟
8. متى أختار وكيل AI ومتى أختار أتمتة workflow؟

Tasks:
1. Add human-readable FAQ HTML.
2. Add matching FAQPage JSON-LD.
3. Ensure each page has unique questions where possible.
4. Avoid exaggerated claims.
5. Keep answers concise and practical.
6. Add CTA after FAQ.

After changes:
- Show pages updated.
- Validate JSON-LD syntax.
- Confirm FAQ content appears visibly on page, not schema-only.
```

---

## Prompt 20 — تحسين الصور والـ Alt والتحميل الكسول

```text
Audit and improve images for SEO, accessibility, and performance.

Tasks:
1. Scan all HTML files for img tags.
2. Identify:
   - missing alt
   - empty alt where image is not decorative
   - large images
   - missing width/height
   - missing loading="lazy" for below-the-fold images
   - hero images that should not be lazy-loaded
3. Fix:
   - Add descriptive Arabic/English alt based on page language.
   - Add width/height where known.
   - Add loading="lazy" to below-the-fold images.
   - Keep hero/LCP image eager or high priority where applicable.
4. Do not add keyword-stuffed alt text.
5. If images are very large, convert or recommend WebP/AVIF if tooling exists.

After changes:
- Show image audit summary.
- Report number of missing alt fixed.
- Report images still needing manual review.
```

---

## Prompt 21 — تحسين Accessibility للأزرار والنماذج

```text
Fix accessibility issues in buttons, icon buttons, forms, and navigation.

Tasks:
1. Scan HTML and React/TSX files for:
   - buttons without accessible names
   - icon-only buttons without aria-label
   - inputs without labels
   - selects without labels
   - textareas without labels
   - duplicate IDs
   - invalid heading hierarchy
2. Focus especially on:
   - demo pages
   - contact page
   - consultation page
   - services page
   - navigation/menu
3. Add:
   - aria-label where needed
   - visible labels for forms
   - aria-expanded for menus if interactive
   - descriptive link text
4. Do not hide labels unless visually necessary.
5. Keep design unchanged unless accessibility requires small markup changes.

After changes:
- Show files changed.
- Show issues fixed by category.
- Run accessibility lint if available.
```

---

## Prompt 22 — تحسين Performance وتقليل CSS/JS غير الضروري

```text
Improve front-end performance safely.

Known issue:
Some key pages load heavy CSS/JS and large icon libraries. Contact and services appear heavier than necessary.

Tasks:
1. Audit assets loaded by:
   - /
   - /services/
   - /contact/
   - /consultation/
   - /locations/riyadh/
2. Identify:
   - unused CSS
   - large JS bundles
   - large icon libraries such as Iconify if loaded globally
   - render-blocking CSS/JS
   - fonts loading inefficiently
3. Make safe improvements:
   - Defer non-critical JS.
   - Load icon libraries only where needed.
   - Inline or preload critical CSS only if already supported.
   - Use font-display: swap.
   - Remove unused CSS only if safe.
4. Do not break layout.
5. Add npm script if helpful:
   "perf:audit": runs Lighthouse or asset-size checks if available.

After changes:
- Show asset size before/after if measurable.
- Show pages tested.
- Report remaining performance risks.
```

---

## Prompt 23 — إنشاء SEO Gate يمنع رجوع الأخطاء

```text
Create an automated SEO gate to prevent regressions.

Tasks:
Create or update a Node.js script, for example scripts/seo-gate.js, that validates public HTML and sitemap files.

Checks:
1. No sitemap URL contains:
   - /reports/
   - /mais-OBM/
   - /offline/
   - /404.html
   - /500.html
   - /error.html
   - "index 2"
2. Every indexable HTML page has:
   - title
   - meta description
   - canonical
   - exactly one H1
3. No public HTML page references yazeed1job@gmail.com.
4. No public HTML page references /mais-OBM/.
5. No internal navigation link uses .html when clean URL exists.
6. No /en/ page contains Arabic text in title, description, schema, or main body unless explicitly whitelisted.
7. Error pages must include noindex.
8. Title length warning >65.
9. Description length warning >170.
10. Fail build for critical issues, warn for length issues.

Add npm script:
"seo:gate": "node scripts/seo-gate.js"

After changes:
- Show the complete script.
- Run npm run seo:gate.
- Fix critical failures if they appear.
```

---

## Prompt 24 — تحديث JSON-LD موحد لكل الموقع

```text
Normalize schema markup across the website.

Tasks:
1. Audit all JSON-LD blocks.
2. Fix:
   - inconsistent Organization data
   - inconsistent LocalBusiness NAP
   - Arabic schema inside English pages
   - invalid JSON-LD
   - duplicate conflicting schema on same page
3. Create reusable schema data source if possible:
   - organization
   - local business
   - service
   - breadcrumb
   - FAQ
4. Use official NAP:
   Bright AI
   +966538229013
   info@brightai.site
   6913 المبارك بن فضالة، حي الفيحاء، الرياض 14254، السعودية
5. Do not include unverified social profiles.
6. Each commercial page should have relevant schema:
   - Organization
   - LocalBusiness where relevant
   - Service
   - BreadcrumbList
   - FAQPage if visible FAQ exists
7. English pages must have English schema content.

After changes:
- Validate JSON syntax.
- Show pages updated.
- Show one Arabic example and one English example.
```

---

## Prompt 25 — ضبط `hreflang` وCanonical

```text
Audit and fix canonical and hreflang implementation.

Tasks:
1. Scan all HTML files for canonical and hreflang.
2. Ensure canonical points to the final clean URL.
3. Ensure Arabic pages link to English equivalents where available.
4. Ensure English pages link back to Arabic equivalents.
5. Add x-default where appropriate.
6. Avoid hreflang pointing to non-existing pages.
7. Remove hreflang from noindex utility/error pages if not useful.
8. Ensure canonical and sitemap URL match.
9. Generate a report:
   - missing hreflang pairs
   - broken hreflang targets
   - canonical mismatch
   - pages with self-canonical OK

After changes:
- Show fixed examples.
- Show final report.
```

---

## Prompt 26 — إضافة صفحة Locations Hub

```text
Create a Saudi locations hub page.

New page:
/locations/

Purpose:
A hub page linking to Saudi city/location pages for Local SEO.

Tasks:
1. Create /locations/index.html or equivalent based on project structure.
2. Arabic RTL page.
3. H1:
   "حلول الذكاء الاصطناعي للشركات في مدن السعودية"
4. Include intro:
   Bright AI serves companies across Riyadh, Jeddah, Dammam, Khobar, Makkah, Madinah, NEOM, and Eastern Province.
5. Add cards linking to:
   - /locations/riyadh/
   - /locations/jeddah/
   - /locations/dammam/
   - /locations/khobar/
   - /locations/makkah/
   - /locations/madinah/
   - /locations/neom/
   - /locations/eastern-province/
6. Add LocalBusiness/Organization schema and BreadcrumbList.
7. Add metadata.
8. Add link to this hub from header/footer if appropriate.
9. Add to sitemap.

After changes:
- Show page created.
- Show sitemap addition.
- Confirm links work.
```

---

## Prompt 27 — ربط المقالات بالخدمات والصفحات المحلية

```text
Improve internal linking from blog content to commercial pages.

Tasks:
1. Identify blog pages about:
   - AI in Saudi Arabia
   - business automation
   - AI agents
   - chatbots
   - digital transformation
   - data analytics
2. Add contextual internal links to:
   - /services/ai-solutions-saudi/
   - /services/business-automation-saudi/
   - /services/ai-agents-saudi/
   - /services/ai-chatbot-arabic/
   - /consultation/
   - /locations/riyadh/
   - /locations/jeddah/
   - /locations/dammam/
3. Use natural Arabic anchor text, not repeated exact-match spam.
4. Limit to 3–6 useful links per article.
5. Add "next step" CTA at the end of high-intent articles:
   "إذا كنت تخطط لتطبيق AI داخل شركتك، احجز جلسة تشخيص AI."
6. Do not add links to noindex/demo/settings pages.

After changes:
- Report pages updated.
- Report internal links added.
- Show sample anchors.
```

---

## Prompt 28 — تحسين صفحة English AI Landing

```text
Create or improve English commercial landing pages for Saudi AI searches.

Target:
- /en/enterprise-ai-saudi/
- /en/services/ai-automation-saudi/
- /en/services/enterprise-ai-saudi/

Tasks:
1. If these pages do not exist, create them.
2. Target keywords:
   - AI company in Saudi Arabia
   - AI automation Saudi Arabia
   - Artificial Intelligence Saudi Arabia
   - enterprise AI Saudi Arabia
3. Content must be fully English.
4. Structure:
   - Hero
   - Problems solved
   - Solutions
   - Saudi market fit
   - Implementation process
   - FAQ
   - CTA
5. CTA:
   "Book an AI diagnosis session"
6. Add metadata, canonical, hreflang, Open Graph, Twitter.
7. Add Organization, Service, FAQ, Breadcrumb schema.
8. Link from /en/ homepage and relevant English pages.
9. Add to sitemap.

After changes:
- Show pages created/updated.
- Confirm no Arabic text remains except brand/context if intentional.
- Show metadata.
```

---

## Prompt 29 — فحص نهائي شامل قبل الإطلاق

```text
Run a final pre-deployment SEO and quality audit.

Tasks:
1. Run build.
2. Run seo gate.
3. Run sitemap validation.
4. Run link scan.
5. Run grep checks:
   - no /mais-OBM/ in public output
   - no OBM-DATA .xlsx in public output
   - no yazeed1job@gmail.com in public output
   - no /reports/ in sitemap
   - no "index 2" in sitemap
6. Validate:
   - homepage is not redirecting to demo
   - robots.txt exists
   - sitemap.xml exists
   - _headers exists if supported
   - error pages have noindex
   - commercial pages are indexable
7. Produce final report:
   - changed files
   - issues fixed
   - remaining warnings
   - commands run
   - next manual checks after deployment

Do not make new feature changes in this prompt unless needed to fix a failing critical check.
```

---

## Prompt 30 — برومبت إصلاح شامل لو تبي Codex ينفذ كل شيء دفعة واحدة

استخدمه فقط لو تبي Codex يمسك المشروع كـ “Epic” كامل:

```text
You are a senior technical SEO engineer, full-stack developer, and UX conversion specialist.

Implement the Bright AI SEO remediation plan based on these priorities:

Critical:
1. Remove or protect /mais-OBM/ and OBM-DATA .xlsx from public deployment.
2. Fix deployment exclusions in render.yaml so dev/internal folders are never published.
3. Remove app/page.tsx redirect to /demo/ocr-demo/ and replace with a proper marketing homepage.
4. Clean sitemap files to include only canonical indexable public pages.
5. Add robots.txt and _headers protections correctly.
6. Unify NAP across homepage, contact page, schema, and footer:
   Bright AI
   +966 53 822 9013
   info@brightai.site
   6913 المبارك بن فضالة، حي الفيحاء، الرياض 14254، السعودية
7. Remove public Gmail references.
8. Add noindex to error, offline, and utility/demo settings/report pages.
9. Fix mixed Arabic content in /en/ pages.
10. Add an automated SEO gate script.

High priority:
11. Optimize titles/descriptions for core pages.
12. Convert .html internal links to clean canonical URLs.
13. Improve homepage UX and CTA flow.
14. Improve services page from catalog/cart style to B2B decision page.
15. Improve contact and consultation pages.
16. Improve/create Saudi location pages.
17. Improve/create Saudi service pages.
18. Normalize schema JSON-LD.
19. Fix hreflang/canonical consistency.
20. Improve accessibility for forms/buttons/images.

Constraints:
- Do not invent fake clients, fake case studies, or fake social links.
- Do not remove useful public pages without replacing or redirecting them.
- Keep the site static-friendly.
- Preserve Arabic RTL quality.
- Use English only for /en/ pages.
- Keep commercial pages indexable.
- Keep internal/demo/utility pages noindex or excluded.
- Show all changed files.
- Run available tests/build scripts.
- If a command fails, explain why and fix if possible.

Final output:
1. Summary of changes.
2. Files changed.
3. Commands run.
4. Remaining warnings.
5. Manual deployment verification checklist.
```

---

أنصحك تبدأ بهذا الترتيب بالضبط:
**Prompt 0 → 2 → 3 → 4 → 5 → 6 → 1 → 23 → 29**
بعدها ادخل تحسينات المحتوى والصفحات: **11 إلى 19**.
