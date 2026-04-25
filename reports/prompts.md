
PR-4 — Technical SEO

أنت Technical SEO Engineer متخصص في المواقع ثنائية اللغة.
نفّذ PR-4 فقط.
النطاق: titles, meta descriptions, H1/H2 عند الحاجة، canonical, hreflang, schema, sitemap, robots.
التزم بخريطة الكلمات [9] وقواعد منع التعارض [11].
ممنوع إنشاء صفحات جديدة من [10] في هذا PR.
المهام:

1. لكل صفحة في خريطة [9]:
   - اضبط `<title>` بطول 50-60 حرف تقريباً.
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
   `<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/PATH/">`
   `<link rel="alternate" hreflang="en" href="https://brightai.site/en/PATH/">`
   `<link rel="alternate" hreflang="x-default" href="https://brightai.site/PATH/">`
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
     `<meta name="robots" content="noindex,follow">`
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

أكيد أ. يزيد. هذه** ****Prompts جاهزة** تنسخها داخل Cursor / Windsurf / Claude Code / Codex وتخليه ينفّذ كل شيء على مراحل بدون تغيير وظائف المشروع.

نفّذها** ** **بالترتيب** .

---

## Prompt 1 — افهم المشروع وارسم المعمارية

```text
Act as a senior software engineer who just joined this codebase.

Your first task is NOT to refactor yet.

Analyze the entire repository and produce a clear architecture understanding.

Focus on:
- Entry points
- Backend server flow
- Static frontend serving
- AI routes and provider flow
- RAG/search flow
- Caching flow
- Security middleware
- SEO/build tooling
- Deployment/runtime assumptions

Deliver:
1. Architectural Design Summary
2. Data Flow Summary
3. Backend route map
4. AI service flow map
5. Search/RAG flow map
6. Main risks before refactoring

Constraints:
- Do not change behavior.
- Do not delete files.
- Do not rename endpoints.
- Do not modify public URLs.
- Do not change jobs, scripts, or deployment behavior.
```

---

## Prompt 2 — نظّف** **`server.js` بدون تغيير السلوك

```text
Act as a senior Node.js backend engineer.

Refactor backend/server.js to reduce structural complexity while keeping behavior unchanged.

Current problem:
server.js mixes:
- static file serving
- request parsing
- CORS/security headers
- API routing
- redirects
- health endpoints
- docs endpoints
- websocket/bootstrap logic
- fallback behavior

Goal:
Extract clear modules while preserving every existing endpoint and behavior.

Create or improve modules such as:
- backend/lib/httpAdapter.js
- backend/lib/staticServer.js
- backend/lib/securityHeaders.js
- backend/lib/requestBody.js
- backend/routes/index.js
- backend/routes/health.js
- backend/routes/docs.js

Rules:
- Keep all current URLs working.
- Keep all current environment variables working.
- Keep CommonJS style if the repo uses CommonJS.
- Do not introduce Express unless the project already depends on it and migration is explicitly safe.
- Preserve static file behavior.
- Preserve redirects.
- Preserve WebSocket initialization.
- Preserve API response shape.
- Add small focused helpers instead of large abstractions.
- Keep backwards compatibility.

Validation:
- Run node --check on changed JS files.
- Run existing tests if available.
- Start the server locally if possible and verify health endpoint.
- List every endpoint you touched and confirm compatibility.

Deliver:
- Refactored code
- Short explanation of changed files
- Compatibility checklist
```

---

## Prompt 3 — أصلح RAG Search والفهرسة

```text
Act as a senior search/backend engineer.

Fix and improve the RAG/internal search service without changing the public search API response contract.

Problem:
The current RAG search indexes paths that do not match the real repository structure, so many real pages are missed.

Goal:
Improve backend/services/ragSearch.js so it indexes the real static site content reliably.

Requirements:
- Index root-level HTML pages.
- Index important site sections such as:
  - blog
  - industries
  - services
  - solutions
  - case-studies
  - resources
  - docs
  - any other existing static content folders
- Ignore:
  - node_modules
  - .git
  - dist/build artifacts when duplicated
  - binary files
  - images/fonts/videos
  - backup duplicate files
- Extract useful text from HTML:
  - title
  - meta description
  - headings
  - visible body text
- Remove scripts/styles/nav noise as much as safely possible.
- Normalize URLs:
  - index.html should map to /
  - folder/index.html should map to /folder/
  - remove duplicated slashes
- Keep existing API shape and route behavior.
- Keep graceful fallback if indexing fails.
- Add caching or lazy index build if appropriate.
- Avoid blocking every request with expensive filesystem scans.
- Add a safe rebuild strategy.

Validation:
- Add tests or a small verification script that confirms real pages are indexed.
- Verify searching for known page titles returns results.
- Run node --check.
- Do not change public endpoint names.

Deliver:
- Enhanced ragSearch implementation
- Any helper utilities needed
- Verification notes
```

---

## Prompt 4 — وحّد مسارات الذكاء الاصطناعي

```text
Act as a senior AI platform engineer.

Refactor AI route handling to reduce duplication while preserving all existing endpoints and response formats.

Current problem:
The codebase has overlapping AI logic across files such as:
- aiGateway.js
- chat.js
- gemini.js
- groq.js
- provider-specific route files

Goal:
Create one clear AI gateway/service layer that handles shared logic, while preserving public routes.

Requirements:
- Preserve all existing endpoints.
- Preserve response formats.
- Preserve streaming behavior.
- Preserve provider fallback behavior.
- Preserve env var names.
- Preserve model selection behavior unless clearly broken.
- Do not remove legacy routes; make them delegate to the shared gateway.
- Extract duplicated logic for:
  - request validation
  - prompt/message normalization
  - provider selection
  - streaming response setup
  - error formatting
  - timeout handling
  - usage metadata
- Keep provider-specific code isolated.
- Keep medical/OCR/transcription behavior unchanged if present.
- Do not mix unrelated responsibilities in one file.

Suggested structure:
- backend/services/aiGateway.js
- backend/services/ai/providers/groqProvider.js
- backend/services/ai/providers/geminiProvider.js
- backend/services/ai/requestNormalizer.js
- backend/services/ai/streaming.js
- backend/routes/ai.js

Validation:
- Run node --check on all changed files.
- Test existing chat endpoint.
- Test gemini endpoint.
- Test groq endpoint.
- Test streaming endpoint if available.
- Confirm old routes still work.

Deliver:
- Refactored AI service structure
- Compatibility checklist
- Removed duplication summary
```

---

## Prompt 5 — قسّم** **`groq.js` الضخم

```text
Act as a senior backend maintainer.

Refactor the large Groq route/module into smaller focused modules without changing behavior.

Problem:
groq.js is too large and mixes many responsibilities:
- chat completion
- streaming
- OCR
- transcription
- archive logic
- FAQ logic
- medical assistant logic
- provider compatibility
- error handling

Goal:
Split the file into maintainable modules.

Rules:
- Do not change endpoint names.
- Do not change request/response shapes.
- Do not change model behavior.
- Do not change streaming behavior.
- Do not remove any feature.
- Preserve existing logs unless noisy or unsafe.
- Preserve error semantics.

Suggested split:
- backend/routes/groq.js as thin router only
- backend/services/groq/chat.js
- backend/services/groq/stream.js
- backend/services/groq/ocr.js
- backend/services/groq/transcription.js
- backend/services/groq/medicalArchive.js
- backend/services/groq/faq.js
- backend/services/groq/errors.js
- backend/services/groq/client.js

Validation:
- Run node --check.
- Compare old route map with new route map.
- Manually test each route category.
- Confirm no endpoint disappeared.

Deliver:
- Split modules
- Thin route file
- Route compatibility checklist
```

---

## Prompt 6 — عالج التكرار والملفات المنسوخة

```text
Act as a senior codebase cleanup engineer.

Find and safely remove or neutralize duplicate code and backup files.

Known suspicious duplicates include patterns like:
- "search 2.js"
- "search 3.js"
- "cache 2.js"
- copied route files
- duplicate frontend bundles
- duplicate CSS/JS files
- backup files with spaces or numeric suffixes

Goal:
Reduce duplicate code maintenance risk.

Rules:
- Do not delete anything blindly.
- First compare duplicate files.
- If a duplicate is not referenced anywhere, move it to an archive folder or remove it only if safe.
- If duplicate code is referenced, consolidate shared logic into one module.
- Preserve imports and runtime behavior.
- Do not break deployment.
- Do not change public URLs.
- Do not remove static assets that are linked from HTML.

Steps:
1. Find duplicate-looking files.
2. Check whether each file is imported, linked, or referenced.
3. Compare content.
4. Consolidate logic where safe.
5. Leave clear notes for anything unsafe to remove.

Validation:
- Run grep/reference checks.
- Run node --check.
- Verify static pages still load linked assets.
- Produce a deletion/consolidation report.

Deliver:
- Cleanup commits/changes
- Duplicate file report
- Risk notes
```

---

## Prompt 7 — حسّن الأداء بدون تغيير الوظائف

```text
Act as a senior performance engineer.

Improve backend and static serving performance without changing product behavior.

Focus areas:
- Static asset cache headers
- Compression if already supported or safe to add
- Avoid synchronous heavy work on request path
- RAG index build performance
- Request body parsing safety
- Rate limiter memory behavior
- Cache manager safety
- Avoid unnecessary repeated filesystem reads
- Avoid large blocking operations during normal API requests

Requirements:
- Public behavior must remain unchanged.
- Do not change URLs.
- Do not change response schemas.
- Do not add risky dependencies unless necessary.
- Prefer small local improvements.
- Add proper cache headers:
  - immutable long cache for hashed/static assets
  - shorter/no-cache for HTML
- Make body parsing stop reading when size limit is exceeded.
- Ensure timers in in-memory rate limiter do not keep process alive unnecessarily.
- Avoid Redis flushdb-style broad deletes; use namespaced deletion.

Validation:
- Run node --check.
- Test static HTML response headers.
- Test JS/CSS/image response headers.
- Test oversized request body.
- Test rate limiter behavior.
- Test cache clear behavior.

Deliver:
- Performance changes
- Before/after explanation
- Compatibility checklist
```

---

## Prompt 8 — حسّن الأمان والاستقرار

```text
Act as a senior application security engineer.

Review and improve security/stability basics without changing app behavior.

Focus on:
- Request body limits
- CORS handling
- Security headers
- Error response safety
- Logging sensitive values
- File path traversal prevention in static serving
- Upload/file handling if present
- API timeout handling
- Provider API key leakage prevention
- Rate limiting correctness

Rules:
- Do not expose stack traces in production.
- Do not log API keys, tokens, raw authorization headers, or full provider secrets.
- Preserve development debugging where safe.
- Preserve existing frontend behavior.
- Preserve endpoint response contracts.
- Avoid breaking legitimate clients.

Implement:
- Safer error formatting helper.
- Safer static path resolution.
- Safer body parser.
- Consistent security headers.
- Centralized timeout handling for outbound AI calls.
- Sanitized logging.

Validation:
- Run node --check.
- Test invalid JSON.
- Test oversized body.
- Test path traversal attempts.
- Test missing API key behavior.
- Test provider failure behavior.

Deliver:
- Security improvements
- Risk notes
- Compatibility checklist
```

---

## Prompt 9 — أضف اختبارات Smoke Tests

```text
Act as a senior QA automation engineer.

Add lightweight smoke tests for this repository.

Goal:
Verify that refactoring did not change behavior.

Test areas:
- Server starts successfully
- Health endpoint returns success
- Static homepage loads
- Important static pages load
- Search/RAG endpoint returns expected response shape
- AI endpoints return expected error shape when provider key is missing
- Invalid JSON returns safe error
- Oversized body is rejected
- Static path traversal is blocked
- Cache manager operations do not crash
- Rate limiter limits repeated requests

Rules:
- Keep tests lightweight.
- Avoid requiring real external AI provider keys.
- Mock provider calls when needed.
- Do not make tests flaky.
- Do not depend on network.
- Use the existing test framework if one exists.
- If no test framework exists, add a minimal Node-based smoke test script.

Add scripts if appropriate:
- npm run test
- npm run test:smoke
- npm run lint or npm run check if available

Validation:
- Run tests locally.
- Document any tests that require env vars.

Deliver:
- Test files
- npm scripts if needed
- Test result summary
```

---

## Prompt 10 — طبق الكود المحسّن الموجود في ملف المراجعة

```text
Act as a senior engineer applying an existing engineering audit.

There is an audit package containing enhanced-code examples.

Use the enhanced code as guidance, not as blind copy-paste.

Relevant enhanced modules may include:
- backend/lib/httpAdapter.js
- backend/middleware/rateLimiter.enhanced.js
- backend/utils/cache.enhanced.js
- backend/services/ragSearch.enhanced.js
- server.integration.diff

Task:
Integrate the improved ideas into the real repository safely.

Rules:
- Preserve all current behavior.
- Preserve all current endpoints.
- Preserve public URLs.
- Preserve environment variables.
- Preserve deployment scripts and jobs.
- Do not break existing imports.
- Adapt filenames to the actual repo style.
- If an enhanced file conflicts with current implementation, merge carefully.
- Do not remove features.

Validation:
- Run node --check on changed JS files.
- Run existing tests.
- Run smoke tests.
- Start server and verify main routes.
- Confirm search endpoint indexes real pages.

Deliver:
- Integrated code
- Files changed summary
- Behavior compatibility checklist
```

---

## Prompt 11 — نهائي: راجع كل شيء كـ PR Review

```text
Act as a strict senior staff engineer doing final PR review.

Review all changes made in this refactor.

Check:
- Did any endpoint change?
- Did any response shape change?
- Did any public URL change?
- Did any environment variable change?
- Did any job/script/deployment command change?
- Did static serving still work?
- Did search/RAG improve coverage?
- Did AI routes preserve compatibility?
- Did duplicate code reduce?
- Did server.js become simpler?
- Did groq.js become maintainable?
- Did performance improve safely?
- Did security improve safely?
- Are tests meaningful?

Produce:
1. Final architecture summary
2. Data flow after refactor
3. Changed files list
4. Compatibility checklist
5. Risk checklist
6. Manual test checklist
7. Remaining technical debt
8. Recommendation: merge / do not merge

Rules:
- Be honest.
- Flag anything risky.
- Do not claim tests passed unless they actually ran.
```

---

## Prompt واحد شامل لو تبي تنفذه دفعة وحدة

```text
Act as a senior staff engineer joining a large unfamiliar codebase.

Your mission:
Improve architecture, maintainability, performance, and safety without changing jobs, public behavior, endpoints, URLs, response contracts, deployment scripts, or environment variable names.

Work in phases:

Phase 1 — Understand:
- Map architecture
- Map data flow
- Map backend routes
- Map AI provider flow
- Map search/RAG flow
- Identify structural problems, duplicate code, performance bottlenecks, and maintenance risks

Phase 2 — Refactor safely:
- Split oversized server responsibilities
- Keep server.js as a thin bootstrap/router coordinator
- Extract request body parsing, static serving, headers, route registration, and health/docs routes
- Preserve all existing routes

Phase 3 — Fix search/RAG:
- Index the real static site folders and root HTML files
- Normalize URLs
- Extract clean text from HTML
- Avoid expensive repeated indexing
- Preserve search API shape

Phase 4 — Unify AI routing:
- Reduce duplication across chat/gemini/groq/aiGateway routes
- Create shared request normalization, provider selection, streaming, timeout, and error helpers
- Keep legacy routes as delegators
- Preserve all response formats and streaming behavior

Phase 5 — Split oversized provider modules:
- Break large Groq/provider files into focused service modules
- Keep route files thin
- Preserve all features

Phase 6 — Remove duplication:
- Find duplicate-looking files
- Check references before deleting
- Consolidate duplicated logic
- Do not remove linked static assets

Phase 7 — Improve performance:
- Add safe static cache headers
- Avoid sync heavy work on hot request paths
- Improve rate limiter memory behavior
- Improve body parser limit handling
- Use namespaced cache clearing instead of broad Redis flushes

Phase 8 — Improve security:
- Prevent path traversal
- Sanitize logs
- Avoid leaking secrets
- Use safe production error formatting
- Keep request limits strict
- Preserve CORS behavior unless unsafe

Phase 9 — Test:
- Add lightweight smoke tests
- Test server startup, health, static pages, search shape, AI error shape, invalid JSON, oversized body, path traversal, cache manager, and rate limiter
- Do not require real external AI keys

Phase 10 — Final review:
- Produce a PR-style summary
- Confirm compatibility
- List risks and remaining debt

Hard constraints:
- Do not change jobs.
- Do not change deployment scripts.
- Do not change public URLs.
- Do not change API endpoint names.
- Do not change API response contracts.
- Do not remove features.
- Do not introduce large new frameworks unless already present.
- Keep CommonJS if the project uses CommonJS.
- Run node --check on every changed JS file.
- Run tests if available.
- Be explicit about anything not verified.

Deliver:
- Refactored code
- Tests
- Architecture summary
- Problem areas fixed
- Restructuring strategies applied
- Enhanced code summary
- Compatibility checklist
```

أفضل تنفيذ عملي: استخدم** ** **Prompt 1 إلى 11 بالترتيب** .
الـ prompt الشامل مفيد، لكن في كودبيس كبير ممكن يخلي الأداة تغيّر أشياء كثيرة مرة وحدة.
