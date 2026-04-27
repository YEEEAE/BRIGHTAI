أكيد أ.يزيد. انسخ كل برومبت لحاله لـ Codex، والأفضل تشغلهم بالترتيب. Codex يقدر يقرأ ويعدل ويشغل أوامر داخل الريبو، فخلّه يشتغل task-by-task بدل برومبت واحد ضخم يخبص عليك التغييرات. ([developers.openai.com](https://developers.openai.com/codex/cli?utm_source=chatgpt.com "Codex CLI"))
وبرضه الأفضل يكون عندك** **`AGENTS.md` فيه أوامر البناء والاختبار وقواعد المشروع، لأن OpenAI تنصح بهذا كجزء من تجهيز الريبو لـ Codex. ([developers.openai.com](https://developers.openai.com/codex/learn/best-practices?utm_source=chatgpt.com "Best practices – Codex"))

## البرومبت 1 — إصلاحات P0/P1: الأمان، Runtime، Render، API

```text
أنت Senior Full-Stack Engineer + Render Deployment Auditor + Security Auditor.

اشتغل على مشروع BRIGHTAI بالكامل داخل الريبو الحالي. لا تشرح كثير، نفّذ التعديلات فعليًا. لا تسألني إلا إذا وصلت لشيء مستحيل بدون معلومة خارجية. افحص الملفات قبل التعديل، ثم عدّل، ثم شغّل أوامر التحقق المتاحة.

المطلوب تنفيذ كل إصلاحات P0/P1 التالية من تقرير التدقيق:

1) إزالة مفتاح Gemini المكشوف من الواجهة:
- افحص frontend/js/gemini-direct-client.js وكل ملفات JS/HTML بحثًا عن أي API key أو hardcoded secret.
- ممنوع وجود أي مفتاح Gemini أو Google AI أو secret داخل frontend أو HTML أو public assets.
- استبدل frontend/js/gemini-direct-client.js بالكامل بحيث يستدعي backend فقط عبر BrightAIGateway.apiFetch أو fetch آمن إلى:
  /api/ai/chat/completions
- إذا endpoint غير موجود في backend، أنشئه.
- اجعل backend يقرأ GEMINI_API_KEY من env فقط.
- أضف handling للأخطاء والtimeout والرد الموحد:
  { choices: [{ message: { content } }] }
  أو { answer }
- لا تكسر الواجهات التي تعتمد على GeminiDirectClient.generateContent.

2) إصلاح API base/runtime config:
- افحص frontend/js/runtime-config.min.js وأي source مرتبط به.
- لا تجعل production يعتمد على "/" إذا API موجود كخدمة Render منفصلة إلا إذا يوجد proxy واضح.
- أضف طريقة واضحة وآمنة:
  window.BRIGHTAI_API_BASE
  مع fallback منطقي.
- تأكد أن كل fetch/API calls تستخدم gateway موحد.
- افحص hardcoded URLs وbase paths.

3) إصلاح backend/server.js:
- استبدل CORS "*" في production بـ allowlist:
  https://brightai.site
  https://www.brightai.site
  وأي localhost للتطوير فقط.
- أضف trust proxy المناسب خلف Render/Cloudflare.
- تأكد من /api/health.
- تأكد أن API يرجع JSON errors واضحة.
- لا تكسر routes الموجودة.

4) إصلاح render.yaml:
- افحص buildCommand/staticPublishPath/services.
- استبعد من النشر:
  .git
  node_modules
  .render-static
  .agents
  plugins
  reports
  tmp
  *.md غير الضرورية إن كانت تُنشر كملفات عامة
- لا تستبعد ملفات SEO المهمة مثل robots.txt وsitemap.xml وllms.txt.
- أضف/ثبّت Node engine إن كان مناسبًا في package.json:
  Node 22 LTS أو النسخة المستخدمة فعليًا.
- تأكد أن SPA/static refresh routes لا تكسر صفحات HTML.
- تأكد من headers للـ assets وHTML بدون كاش عدواني.

5) إصلاح duplicate route:
- افحص interview/pages/supportAI و interview/pages/support-ai.
- خلي canonical واحد فقط.
- اجعل supportAI redirect 301 إلى support-ai أو احذف نسخة النشر المكررة بطريقة آمنة.
- لا تترك صفحتين indexable لنفس المحتوى بحروف مختلفة.

6) تنظيف duplicated backend files:
- افحص:
  backend/routes/search 2.js
  backend/routes/search 3.js
  backend/utils/cache 2.js
- إذا هي نسخ مكررة وغير مستخدمة، انقلها لأرشيف غير منشور أو احذفها.
- تأكد imports لا تعتمد عليها.
- أضف فحص يمنع filenames فيها spaces داخل backend runtime.

7) إصلاح manifest.json:
- اجعل id/start_url إلى "/".
- أصلح shortcuts لتستخدم trailing slash حيث يلزم.
- تأكد أن manifest لا يشير إلى /index.html كـ canonical start.

8) تحقق بعد التعديل:
شغّل المتاح من الأوامر التالية، ولا تفشل بصمت:
npm ci --include=dev --no-audit --no-fund
npm run build
npm run test
npm run verify:all
npm run validate:production
npm run seo:qa
npm run seo:gate
npm run smoke-test
npm run smoke-test:api

إذا أمر غير موجود، اذكره في التقرير النهائي فقط ولا تعتبره فشل.
إذا فشل بسبب dependency ناقص، أصلح package.json/package-lock إن كان السبب واضح.
إذا فشل بسبب مشكلة حقيقية في الكود، أصلحها.

المخرجات المطلوبة:
- عدّل الملفات فعليًا.
- أعطني ملخص تغييرات مختصر.
- أعطني قائمة الملفات المعدلة.
- أعطني أوامر التحقق ونتائجها.
- أعطني أي أمور Owner Decision Needed فقط إذا بقي شيء حساس مثل admin/API/demo pages.
```

## البرومبت 2 — إصلاح SEO، Indexability، AEO، AI Search، Google السعودية

```text
أنت Technical SEO Auditor + Google Indexing Specialist + AEO/HEO/AI Search Optimization Specialist.

اشتغل على مشروع BRIGHTAI كاملًا. المطلوب تنفيذ إصلاحات SEO/indexability/AEO/AI Search المذكورة في تقرير التدقيق، وليس كتابة تقرير فقط. عدّل الملفات والسكربتات والصفحات فعليًا.

قواعد حاسمة:
- لا تضف noindex لأي صفحة عامة أو داخلية.
- لا تمنع أي صفحة عامة من robots.txt.
- الاستثناء فقط صفحات admin أو API أو صفحات حساسة، وهذه ضعها في Owner Decision Needed ولا تمنعها من نفسك إلا إذا كانت API endpoints وليست HTML page.
- كل صفحة HTML عامة أو داخلية لازم تكون:
  indexable
  لها canonical صحيح
  موجودة في sitemap إذا تقرر أنها قابلة للفهرسة
  مربوطة داخليًا قدر الإمكان
- لا تعتمد على عينة. افحص كل صفحات HTML.

المهام:

1) sitemap شامل:
- افحص كل صفحات HTML في المشروع بعد استبعاد build/dist الناتج إن لم يكن مصدر النشر.
- حدّث scripts/generate-sitemap-all-pages.mjs أو أنشئ source of truth واضح.
- أضف كل canonical URLs الناقصة التي كشفها التقرير، خصوصًا docs/legal/interview/privacy/terms/sitemap/bot/demo pages إذا كانت عامة.
- لا تترك canonical URL خارج sitemap إلا إذا في Owner Decision Needed.
- شغّل توليد sitemap النهائي.
- تأكد أن sitemap.xml لا يحتوي duplicates أو URLs بحروف مختلفة لنفس الصفحة.
- تأكد من lastmod إن كان السكربت يدعمه.

2) robots.txt:
- اجعله مفتوحًا للصفحات العامة:
  User-agent: *
  Allow: /
  Sitemap: https://brightai.site/sitemap.xml
- اسمح بملفات CSS/JS/assets.
- أضف allow لمحركات AI المفيدة إذا موجود llms.txt:
  GPTBot
  OAI-SearchBot
  ChatGPT-User
  ClaudeBot
  PerplexityBot
- لا تضف Disallow للصفحات العامة.

3) canonical strategy:
- كل صفحة HTML لها canonical self-reference صحيح.
- أصلح canonical الصفحات المكررة مثل supportAI/support-ai.
- عالج trailing slash consistency.
- عالج www/non-www consistency لصالح:
  https://brightai.site
- لا تجعل صفحة داخلية canonical إلى home إلا إذا هي duplicate حقيقي.
- افحص slug casing.

4) docs titles/meta:
- أصلح مشكلة تكرار:
  "توثيق توثيق توثيق..."
  و
  "Documentation for Bright AI..."
- اجعل title فريد لكل docs page.
- اجعل meta description فريدة ومختصرة.
- تأكد H1 واحد وواضح.

5) internal linking:
- عالج صفحات orphan التي ظهرت في التقرير، خصوصًا docs/legal/privacy/terms/demos/interview/bot pages.
- أضف footer links أو docs hub أو sitemap HTML page حسب الأنسب.
- لا تكدّس روابط عشوائية؛ اجعل الربط منطقي.
- أضف breadcrumbs للصفحات المناسبة إن أمكن.

6) schema / JSON-LD:
أضف أو أصلح:
- Organization schema.
- LocalBusiness schema للسعودية.
- Service schema لصفحات الخدمات.
- FAQPage schema لصفحات services/sectors المهمة.
- BreadcrumbList schema للصفحات الداخلية.
- WebSite schema مع SearchAction إذا مناسب.
- اجعل اسم الشركة ثابتًا: BrightAI أو Bright AI حسب الاستخدام الحالي، ثم وحّد الاستخدام.
- أضف serviceArea للسعودية ومدن: Riyadh, Jeddah, Dammam, Khobar إذا مناسبة.
- لا تضف معلومات وهمية مثل عنوان شارع أو رقم جوال غير موجود في المشروع.

7) AEO/AI Search:
- أضف direct answer blocks/TL;DR في صفحات الخدمات الأساسية.
- أضف FAQ عربي/إنجليزي حيث يوجد صفحات إنجليزية.
- اجعل المحتوى قابل للاقتباس لمحركات الإجابات.
- أضف/حدّث llms.txt كامل:
  - تعريف الشركة
  - أهم الخدمات
  - أهم الصفحات
  - السوق المستهدف: Saudi Arabia
  - روابط sitemap والصفحات الرئيسية
- لا تمنع AI crawlers المفيدة في robots.

8) Google السعودية:
أنشئ أو حسّن mapping للكلمات التالية داخل الصفحات المناسبة بدون حشو:
- حلول الذكاء الاصطناعي في السعودية
- شركة ذكاء اصطناعي السعودية
- شركة ذكاء اصطناعي في الرياض
- أتمتة الأعمال بالذكاء الاصطناعي
- وكلاء الذكاء الاصطناعي للشركات
- شات بوت عربي للشركات
- شات بوت ذكاء اصطناعي السعودية
- أتمتة خدمة العملاء بالذكاء الاصطناعي
- حلول AI للشركات السعودية
- AI automation Saudi Arabia
- AI agents Saudi Arabia
- Arabic AI chatbot
- AI chatbot Saudi Arabia
- AI solutions Saudi Arabia

9) اختبارات:
شغّل أو أصلح السكربتات:
npm run sitemap:all
npm run seo:check
npm run seo:qa
npm run seo:gate
npm run seo:html:check
npm run internal-links:audit
npm run validate:production

إذا cheerio أو dependency ناقص، أصلح dependency في package.json/package-lock.

المخرجات المطلوبة:
- عدّل الملفات فعليًا.
- أعطني جدول مختصر:
  File / Change / Reason
- أعطني قائمة صفحات بقيت Owner Decision Needed.
- أعطني نتائج أوامر SEO.
- لا تعطيني توصيات عامة فقط؛ لازم يكون فيه تغييرات فعلية.
```

## البرومبت 3 — إصلاح UI/UX، CSS، Responsive، RTL، Performance، Broken UI

```text
أنت Senior Frontend Engineer + UI/UX Designer + Performance/Core Web Vitals Specialist.

اشتغل على مشروع BRIGHTAI بالكامل، خصوصًا frontend/css وfrontend/js وصفحات HTML والcomponents/assets. المطلوب تنفيذ إصلاحات UI/UX وCSS وJS runtime من تقرير التدقيق.

لا تحلل عينة. افحص كل صفحات HTML المهمة، وكل ملفات CSS/JS المرتبطة بها. نفّذ إصلاحات فعلية، ثم شغّل build/validation.

الأهداف:
- منع اختفاء الأقسام.
- منع كسر layout.
- إصلاح responsive للجوال والتابلت.
- تحسين RTL/Arabic UX.
- تخفيف !important والـ CSS emergency overrides.
- منع JS runtime errors.
- تحسين تحميل الخطوط والصور والأصول.
- رفع جاهزية Core Web Vitals بدون كسر التصميم.

المهام:

1) CSS audit وتنفيذ الإصلاح:
افحص كل ملفات:
frontend/css/**/*.css
وأي CSS في public/static أو HTML inline.

ركّز على:
- frontend/css/index-critical-overrides.css
- frontend/css/index-theme.css
- frontend/css/main.bundle.css
- أي ملفات minified/unminified مرتبطة بالصفحات.

نفّذ:
- قلّل استخدام !important قدر الإمكان، خصوصًا الملف الذي يحتوي overrides كثيرة.
- لا تحذف override إلا بعد معرفة سبب وجوده.
- استبدل fixed heights بـ min-height / auto / clamp حيث يلزم.
- عالج hardcoded widths التي تسبب horizontal scroll.
- عالج overflow:hidden الذي قد يخفي المحتوى.
- عالج z-index/absolute/fixed التي تخفي buttons أو sections.
- أضف logical CSS properties لدعم RTL:
  margin-inline
  padding-inline
  inset-inline
  text-align:start/end
- أصلح mobile breakpoints الناقصة.
- حسّن spacing والline-height وtypography للغة العربية.
- لا تغيّر الهوية البصرية جذريًا.

2) Responsive/RTL:
- افحص الصفحات الرئيسية والخدمات والديمو/docs/legal/contact/about.
- تأكد من:
  header/nav
  hero
  CTA buttons
  cards
  forms
  pricing إن وجد
  footer
- عالج:
  text overflow
  clipped content
  buttons خارج الشاشة
  cards مكسورة
  grid/flex overflow
  sticky/fixed header يغطي المحتوى
  RTL/LTR mixed text
- أضف CSS عام آمن:
  img, video { max-width: 100%; height: auto; }
  containers لا تتجاوز العرض.
- استخدم prefers-reduced-motion لتخفيف الأنيميشن.

3) JS/TS runtime:
افحص كل:
frontend/js/**/*.js
backend/**/*.js
scripts/**/*.mjs
وأي TS/TSX/JSX إن وجد.

ابحث وأصلح:
- wrong imports/paths.
- case-sensitive imports التي تفشل على Linux/Render.
- document/window بدون guard إذا الملف ممكن يشتغل SSR/build.
- map over undefined.
- null access.
- event handlers للأزرار والفورمز.
- failed API calls بدون loading/error states.
- broken navigation.
- duplicate scripts.
- صفحات تعتمد على index-theme.js بينما render يحذف unminified file.
- تأكد أن HTML references تستخدم minified أو موجود فعليًا بعد build.
- لا تترك console errors واضحة.

4) Assets:
- افحص كل img/script/link href/src في HTML.
- تأكد كل asset موجود.
- أصلح paths الخاطئة.
- أضف alt للصور المهمة.
- أضف width/height أو CSS aspect-ratio للصور الأساسية لتقليل CLS.
- حسّن font loading:
  preload للخطوط المهمة فقط.
  font-display: swap.
  fallback fonts عربية مناسبة.
- لا تنقل assets بطريقة تكسر relative paths.

5) Cloudflare/Render UI safety:
- تأكد أن أسماء ملفات CSS/JS لا تتأثر بـ Cloudflare cache القديم.
- إن كان المشروع لا يستخدم hashing، أضف query version أو build version strategy إن كان بسيط وآمن.
- لا تجعل HTML cached aggressively.
- assets الثابتة ممكن immutable إذا لها hash/version.
- أضف headers مناسبة في _headers أو render.yaml حسب الموجود.

6) Forms/CTA:
- تأكد أن كل CTA إما:
  رابط صحيح
  أو handler صحيح
  أو aria-disabled واضح إذا غير متاح
- لا تترك buttons بلا action في صفحات conversion.
- أضف focus states واضحة.
- لا تزل outline بدون بديل.
- حسّن accessibility labels للروابط والأزرار الغامضة.

7) Performance:
- لا تضف مكتبات كبيرة.
- قلّل CSS المتكرر.
- لا تكرر تحميل نفس script/css.
- عالج lazy loading إذا يخفي محتوى مهم فوق fold.
- hero image لا تكون lazy إذا هي LCP.
- أضف loading="lazy" للصور الثانوية فقط.
- لا تعتمد على Lighthouse فقط، لكن شغّل performance budget إن موجود.

8) اختبارات:
شغّل:
npm ci --include=dev --no-audit --no-fund
npm run build
npm run lint
npm run typecheck
npm run verify:all
npm run performance:budget
npm run resource:audit:before
npm run smoke-test

إذا الأوامر غير موجودة، لا تخترعها، فقط اذكر أنها غير موجودة.
إذا فشلت بسبب مشكلة واضحة، أصلحها.

المخرجات المطلوبة:
- عدّل الملفات فعليًا.
- أعطني:
  1. Summary مختصر.
  2. Files changed.
  3. أهم UI/CSS/JS bugs التي أصلحتها.
  4. أوامر التحقق ونتائجها.
  5. أي مخاطر متبقية.
- لا تعطيني تقرير طويل فقط. المطلوب patches حقيقية.
```

نصيحتي العملية: شغّل** ****البرومبت 1 أولًا** لأنه يمنع أخطر مشاكل الإنتاج، بعدها** ****البرومبت 2** للفهرسة والتصدر، ثم** ****البرومبت 3** للتصميم والواجهة. Codex prompting guide نفسه يركّز على الاستقلالية، استكشاف الكود، استخدام الأدوات، وجودة الواجهة في مهام الكود الكبيرة. ([developers.openai.com](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide?utm_source=chatgpt.com "Codex Prompting Guide"))





أكيد أ. يزيد — الأفضل لـ Codex إنك تعطيه** ****برومبتات صغيرة متسلسلة** بدل برومبت واحد ضخم. خله يشتغل مرحلة مرحلة عشان يعطيك diffs نظيفة وما يخرب المشروع. OpenAI نفسها تنصح إن التعليمات تكون واضحة ومحددة وفي البداية، وهذا بالضبط اللي سويته هنا. ([OpenAI Help Center](https://help.openai.com/en/articles/6654000-best-practices-for-prompt-engineering-with-the-openai-api?utm_source=chatgpt.com "Best practices for prompt engineering with the OpenAI API"))

## 1) برومبت فحص المشروع فقط

```text
أنت Senior Full-Stack Auditor.

افحص هذا المشروع بدون تعديل أي ملف.

المطلوب:
1. حلل بنية المشروع.
2. افحص هذه المسارات:
   - interview/
   - smart-medical-archive/
   - try/data-analyzer/
   - ai-scolecs/
   - health/
   - demo/ocr-demo/
   - ai-bots/BrightSupport/
   - services/marketing-automation.html
   - services/supply-chain-optimization.html

ملاحظة:
المستخدم كتب mart-medical-archive لكن المسار الصحيح في المشروع هو smart-medical-archive.

ركّز على:
- ملفات HTML/JS/CSS المرتبطة بكل تجربة.
- هل التجربة تفاعلية فعلاً أو صفحة تسويقية فقط؟
- هل فيه اتصال مباشر بـ Gemini من المتصفح؟
- هل فيه API keys مكشوفة؟
- هل فيه mock/fallback/localStorage/random logic بدل AI حقيقي؟
- هل فيه أخطاء UX أو تحويل بيعي؟
- هل المسارات مربوطة صح؟

أنشئ ملف:
reports/demo-ai-upgrade-audit.md

لا تعدّل أي كود الآن.
فقط اكتب تقرير واضح فيه:
- المشاكل الأمنية.
- مشاكل تجربة المستخدم.
- مشاكل الربط مع Gemini.
- الملفات الحرجة.
- خطة تنفيذ مختصرة مرتبة حسب الأولوية.
```

---

## 2) برومبت إصلاح أمان Gemini والمفاتيح

```text
أنت Senior Security Engineer.

نفّذ إصلاح أمني فقط بدون تحسينات UX الآن.

المطلوب:
1. ابحث في المشروع كله عن أي Gemini API keys أو مفاتيح تبدأ بـ AIzaSy.
2. أزل أي hardcoded API keys من frontend وHTML وJS.
3. لا تضع أي مفتاح بديل.
4. اجعل كل مفاتيح Gemini تقرأ فقط من environment variables في backend.
5. حدّث .env.example بالقيم التالية:
   GEMINI_API_KEY=
   GEMINI_MODEL=gemini-2.5-flash
   AI_GATEWAY_TIMEOUT_MS=30000

6. امنع أي direct browser call إلى:
   generativelanguage.googleapis.com

7. لو وجدت ملفات مثل:
   - frontend/js/gemini-direct-client.js
   - frontend/js/ocr-demo.js
   - frontend/js/ocr-demo.min.js
   - assets/js/gemini-demo-engine.js
   - frontend/js/pricing-recommender.min.js
   - bot/index.html
   - mais-OBM/index.html
   - services/index.html

   افحصها ونظّفها من المفاتيح والاستدعاءات المباشرة.

8. أضف اختبار أمني يمنع وجود:
   - AIzaSy
   - x-goog-api-key داخل frontend
   - generativelanguage.googleapis.com داخل frontend

9. لا تكسر الواجهات. إذا كان فيه كود يحتاج AI، خله يستدعي backend placeholder endpoint بدل Gemini مباشرة.

بعد التنفيذ:
- اكتب ملخص في reports/security-ai-cleanup-summary.md
- اذكر الملفات المعدلة.
- اذكر أي مفاتيح يجب تدويرها في Google AI Studio بدون كتابة المفتاح نفسه.
```

---

## 3) برومبت بناء AI Gateway موحد

```text
أنت Principal Backend Engineer.

ابنِ AI Gateway موحد في backend لاستخدام Gemini API بشكل آمن لكل الديموهات.

قبل التعديل:
- افحص backend/server.js
- افحص backend/config/index.js
- افحص backend/routes/*
- افحص backend/services/*

المطلوب:
1. لا تستخدم Gemini من frontend نهائياً.
2. استخدم GEMINI_API_KEY من process.env فقط.
3. أنشئ أو حسّن routes التالية:

POST /api/ai/demo/recruitment
POST /api/ai/demo/medical-archive
POST /api/ai/demo/data-analyzer
POST /api/ai/demo/education
POST /api/ai/demo/hospital
POST /api/ai/demo/ocr
POST /api/ai/demo/support
POST /api/ai/demo/marketing
POST /api/ai/demo/supply-chain

4. كل endpoint يرجع JSON موحد:
{
  "ok": true,
  "domain": "",
  "summary_ar": "",
  "confidence": 0.0,
  "recommendations": [],
  "kpis": {},
  "risks": [],
  "next_best_actions": [],
  "sales_cta": {
    "title": "",
    "message": "",
    "url": "/consultation/"
  },
  "demo_disclaimer": ""
}

5. في الخطأ يرجع:
{
  "ok": false,
  "errorCode": "",
  "message_ar": "",
  "retryable": true
}

6. أضف timeout.
7. أضف retry محدود.
8. أضف rate limiting بسيط إن كان موجود نمط له بالمشروع.
9. أضف validation للمدخلات.
10. أضف sanitization للمخرجات قدر الإمكان.
11. اجعل prompts الخاصة بكل تجربة في ملف منفصل:
backend/services/demoPrompts.js

12. استخدم Gemini Structured JSON output قدر الإمكان.
13. لا تكشف stack traces في production responses.
14. لا تطبع API keys أو secrets في logs.

بعد التنفيذ:
- أضف tests للـ endpoints.
- حدّث reports/ai-gateway-summary.md
- اكتب طريقة التشغيل محلياً.
```

---

## 4) برومبت توحيد Frontend API Client

```text
أنت Senior Frontend Engineer.

المطلوب الآن فقط:
توحيد طريقة اتصال الواجهات مع backend AI Gateway.

لا تحسّن التصميم الآن.
لا تغيّر تجربة المستخدم بشكل كبير.
فقط أصلح الربط.

المطلوب:
1. أنشئ أو حسّن client موحد:
frontend/js/ai-demo-client.js

2. هذا client يحتوي:
- postDemo(domain, payload, options)
- timeout عبر AbortController
- handling واضح للأخطاء
- loading callbacks إن احتاج
- no API keys
- no direct Gemini calls
- no localStorage secrets

3. اربط الديموهات التالية بالـ client:
- interview/
- smart-medical-archive/
- try/data-analyzer/
- ai-scolecs/
- health/
- demo/ocr-demo/
- ai-bots/BrightSupport/

4. اربط كل تجربة بالendpoint المناسب:
interview -> /api/ai/demo/recruitment
smart-medical-archive -> /api/ai/demo/medical-archive
try/data-analyzer -> /api/ai/demo/data-analyzer
ai-scolecs -> /api/ai/demo/education
health -> /api/ai/demo/hospital
demo/ocr-demo -> /api/ai/demo/ocr
ai-bots/BrightSupport -> /api/ai/demo/support

5. أزل أي اعتماد على:
- GeminiDirectClient
- window.GeminiDirectClient
- إدخال API key من المستخدم
- generativelanguage.googleapis.com من frontend

6. حافظ على fallback demo data فقط إذا backend غير متاح، لكن اكتب بوضوح في UI:
"بيانات تجريبية مؤقتة"

7. أضف escapeHTML أو sanitizer عند عرض مخرجات AI.

بعد التنفيذ:
- حدّث reports/frontend-ai-client-summary.md
- اذكر الملفات المعدلة.
- اذكر أي تجربة لم تستطع ربطها ولماذا.
```

---

## 5) برومبت تحسين interview/

```text
أنت Senior Product Engineer + UX Designer متخصص في HR SaaS.

حسّن تجربة:
interview/

الهدف:
تحويلها إلى تجربة ATS ذكية عالمية تقنع العميل بشراء نظام توظيف ذكي.

المطلوب:
1. افحص ملفات interview/ المرتبطة.
2. حافظ على RTL والعربية.
3. اربط الذكاء الاصطناعي عبر:
POST /api/ai/demo/recruitment

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- إدخال وصف الوظيفة.
- رفع أو لصق CV.
- زر "استخدم بيانات تجريبية".
- تحليل AI للمرشح.
- Match Score.
- مقارنة متطلبات الوظيفة مع مهارات المرشح.
- استخراج:
  candidate_profile
  skills
  experience_years
  education
  missing_requirements
  red_flags
  match_score
  recommended_stage
  interview_questions
  suggested_email

واجهة النتائج:
- بطاقة ملخص تنفيذي.
- score واضح.
- أسباب الترشيح.
- نواقص المرشح.
- أسئلة مقابلة مخصصة.
- قرار مقترح:
  "ينتقل للمقابلة"
  "يحتاج مراجعة"
  "غير مناسب حالياً"
- CTA قوي:
  "فعّل نظام الفرز الذكي لشركتك"

قيود مهمة:
- لا تستخدم العمر، الجنس، الجنسية، الحالة الاجتماعية كمعايير تقييم.
- أضف تنبيه أن النتيجة دعم قرار وليست قرار توظيف نهائي.
- أضف loading/error states.
- أضف export JSON أو PDF إن كان سهل.
- أضف analytics events إن كان عند المشروع نظام analytics.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/interview-demo-upgrade.md
```

---

## 6) برومبت تحسين smart-medical-archive/

```text
أنت Senior Healthcare SaaS Engineer + UX Designer.

حسّن تجربة:
smart-medical-archive/

الهدف:
تحويلها إلى نظام أرشفة سجلات طبية ذكي بمستوى Enterprise.

المطلوب:
1. افحص ملفات smart-medical-archive/.
2. اربط AI عبر:
POST /api/ai/demo/medical-archive

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- رفع ملف PDF/Image أو لصق نص سجل طبي.
- زر "استخدم سجل طبي تجريبي".
- استخراج بيانات منظمة:
  patient
  mrn
  encounter_date
  department
  diagnoses
  medications
  labs
  procedures
  risk_flags
  follow_up_actions
  missing_fields
  confidence
- إنشاء patient timeline.
- تصنيف تلقائي للسجل.
- بحث دلالي تجريبي داخل السجلات.
- human review queue.
- masking للهوية الحساسة.
- audit trail UI.

واجهة النتائج:
- ملخص السجل.
- الحقول المستخرجة.
- مؤشرات تحتاج مراجعة.
- جودة الاستخراج.
- Timeline.
- CTA:
  "ابنِ أرشيف طبي ذكي لمنشأتك"

قيود طبية:
- لا تقدم تشخيص نهائي.
- استخدم عبارات مثل:
  "مؤشر يحتاج مراجعة بشرية"
  "دعم قرار"
  "ليس بديلاً عن الطبيب"
- لا تعرض بيانات مرضى حقيقية.
- أضف demo disclaimer.

أصلح أي endpoint قديم مثل:
/api/ai/gemini-chat
واستبدله بالمسار الموحد.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/medical-archive-demo-upgrade.md
```

---

## 7) برومبت تحسين try/data-analyzer/

```text
أنت Senior Data Platform Engineer + BI UX Designer.

حسّن تجربة:
try/data-analyzer/

الهدف:
تحويلها إلى منصة بيانات موحدة تقنع العميل أن BrightAI يقدر يجمع بياناته ويطلع منها قرارات.

المطلوب:
1. افحص ملفات try/data-analyzer/.
2. اربط AI عبر:
POST /api/ai/demo/data-analyzer

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- رفع CSV/XLSX إن كان مدعوم.
- لصق جدول أو بيانات.
- زر "استخدم بيانات تجريبية".
- Data profiling:
  rows
  columns
  missing values
  duplicates
  outliers
  data_quality_score
- Gemini يعطي:
  executive_summary
  business_insights
  recommended_charts
  anomalies
  forecast_opportunities
  next_questions
  recommendations

واجهة النتائج:
- Executive summary.
- Data quality score.
- Insights cards.
- Recommended charts.
- Anomaly alerts.
- Q&A على الداتاست.
- Export report.
- CTA:
  "اربط مصادر بيانات شركتك في منصة واحدة"

مهم:
- لا تعتمد على GeminiDirectClient.
- لا ترسل ملفات ضخمة مباشرة بدون validation.
- أضف max file size.
- أضف loading/error states.
- أضف sanitizer للمخرجات.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/data-analyzer-demo-upgrade.md
```

---

## 8) برومبت تحسين ai-scolecs/

```text
أنت Senior EdTech Product Engineer + UX Designer.

حسّن تجربة:
ai-scolecs/

الهدف:
تحويلها إلى منصة تعليمية ذكية متكاملة بالذكاء الاصطناعي.

المطلوب:
1. افحص ملفات ai-scolecs/.
2. اربط AI عبر:
POST /api/ai/demo/education

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- اختيار دور المستخدم:
  مدير مدرسة
  معلم
  طالب
  ولي أمر
- زر "استخدم سيناريو تجريبي".
- أدوات AI:
  1. توليد خطة درس.
  2. توليد اختبار.
  3. تصحيح واجب نصي.
  4. تحليل أداء طالب.
  5. توصية مسار تعلم.

مخرجات AI:
- lesson_plan
- quiz
- rubric_feedback
- student_level
- weak_skills
- suggested_intervention
- learning_path
- teacher_actions
- parent_summary

واجهة النتائج:
- Dashboard أداء.
- نقاط ضعف.
- تدخلات مقترحة.
- مهام المعلم القادمة.
- تقرير مختصر لولي الأمر.
- CTA:
  "فعّل منصة تعليمية ذكية لمدرستك أو معهدك"

قيود:
- لا تعرض نتائج الطالب كحكم نهائي.
- اجعلها توصيات تعليمية قابلة للمراجعة.
- حافظ على اللغة العربية وRTL.
- أضف loading/error states.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/education-demo-upgrade.md
```

---

## 9) برومبت تحسين health/

```text
أنت Senior Healthcare Operations Product Engineer.

حسّن تجربة:
health/

الهدف:
تحويلها إلى نظام إدارة مستشفيات ذكية بالذكاء الاصطناعي يركز على التشغيل والجودة والتقارير.

المطلوب:
1. افحص ملفات health/.
2. اربط AI عبر:
POST /api/ai/demo/hospital

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- لوحة تشغيل مستشفى.
- إدخال أو تحميل بيانات تشغيلية تجريبية.
- زر "استخدم بيانات مستشفى تجريبية".
- مؤشرات:
  bed_occupancy
  er_waiting_time
  staffing_pressure
  patient_flow
  quality_incidents
  readmission_indicator
  supply_pressure

Gemini يحلل:
- operational_summary
- bottlenecks
- risk_level
- quality_notes
- recommended_actions
- executive_brief
- next_best_actions

واجهة النتائج:
- Tabs:
  الطوارئ
  التنويم
  الجودة
  الموارد
  التقارير
- Executive dashboard.
- Risk alerts.
- توصيات تشغيلية.
- تقرير مدير تنفيذي.
- CTA:
  "ابنِ لوحة تشغيل ذكية لمنشأتك الصحية"

قيود:
- لا تجعلها تشخيص طبي.
- لا تقدم نصائح علاجية.
- استخدم صياغة "دعم قرارات تشغيلية وجودة".
- أضف disclaimer واضح.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/hospital-demo-upgrade.md
```

---

## 10) برومبت تحسين demo/ocr-demo/

```text
أنت Senior Document Automation Engineer + UX Designer.

حسّن تجربة:
demo/ocr-demo/

الهدف:
تحويلها إلى Document Automation Hub احترافي.

المطلوب:
1. افحص ملفات demo/ocr-demo/.
2. افحص frontend/js/ocr-demo.js إن كان مستخدم.
3. اربط AI عبر:
POST /api/ai/demo/ocr

لا تستخدم Gemini مباشرة من المتصفح.
لا تستخدم API key في frontend.

التجربة المطلوبة:
- رفع PDF/Image.
- لصق نص وثيقة.
- زر "استخدم فاتورة/عقد تجريبي".
- تصنيف نوع الوثيقة:
  invoice
  contract
  ID
  medical_report
  receipt
  purchase_order
  other
- استخراج:
  fields
  confidence_per_field
  missing_fields
  validation_errors
  document_type
  suggested_workflow
  needs_review

واجهة النتائج:
- Preview للوثيقة إن أمكن.
- جدول الحقول المستخرجة.
- confidence badges.
- validation warnings.
- human review queue.
- copy JSON.
- export CSV/JSON.
- CTA:
  "اربط أتمتة الوثائق مع ERP/CRM/SharePoint"

مهم:
- max file size validation.
- loading progress.
- error states.
- sanitizer.
- لا تخزن ملفات المستخدم في localStorage.
- fallback data مسموح فقط مع توضيح أنه demo.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/ocr-demo-upgrade.md
```

---

## 11) برومبت تحسين ai-bots/BrightSupport/

```text
أنت Senior Conversational AI Product Engineer + CX UX Designer.

حسّن تجربة:
ai-bots/BrightSupport/

الهدف:
تحويلها إلى تجربة مركز دعم عملاء ذكي تبيع نفسها.

المطلوب:
1. افحص ملفات ai-bots/BrightSupport/.
2. اربط AI عبر:
POST /api/ai/demo/support

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- واجهة Chat جميلة.
- زر "استخدم محادثة عميل تجريبية".
- إدخال رسالة عميل.
- Gemini يرجع:
  intent
  sentiment
  urgency
  sla_priority
  suggested_reply
  escalation_required
  escalation_reason
  customer_satisfaction_prediction
  knowledge_base_answer
  recommended_actions

واجهة النتائج:
- محادثة مباشرة.
- بطاقة تحليل نية العميل.
- sentiment score.
- SLA priority.
- هل يتم التصعيد أو لا.
- رد مقترح للموظف.
- Dashboard مصغر:
  tickets_resolved
  avg_response_time
  escalation_rate
  csat_prediction
- Multi-channel badges:
  WhatsApp
  Website
  Email
- CTA:
  "فعّل بوت دعم ذكي خلال أيام"

مهم:
- لا تجعل البوت يخترع سياسات شركة حقيقية.
- أضف مصادر معرفة تجريبية داخلية.
- أضف fallback واضح.
- أضف loading/error states.
- sanitize AI outputs.

بعد التنفيذ:
- اختبر الصفحة.
- أصلح console errors.
- اكتب تقرير:
reports/brightsupport-demo-upgrade.md
```

---

## 12) برومبت إنشاء ديمو التسويق الذكي

```text
أنت Senior Marketing Automation SaaS Engineer + Growth UX Designer.

أنشئ أو حسّن Demo تفاعلي لخدمة:
أتمتة التسويق بالذكاء الاصطناعي.

المسارات:
- services/marketing-automation.html موجود كصفحة خدمة.
- أنشئ ديمو تفاعلي جديد إن لم يوجد:
  demo/marketing-automation/index.html
  demo/marketing-automation/app.js
  demo/marketing-automation/styles.css
أو اتبع نمط المشروع الحالي إن كان مختلف.

اربط صفحة الخدمة بالديمو الجديد عبر CTA واضح.

اربط AI عبر:
POST /api/ai/demo/marketing

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- يدخل المستخدم:
  business_type
  campaign_goal
  audience
  budget
  channels
  offer
  campaign_duration
- زر "استخدم حملة تجريبية".
- Gemini يرجع:
  campaign_strategy
  audience_segments
  content_calendar
  ad_copy_variants
  email_sequence
  retargeting_rules
  expected_kpis
  risks
  next_best_actions

واجهة النتائج:
- Campaign strategy summary.
- Audience segments.
- Content calendar.
- Ad copy variants.
- Email sequence.
- Retargeting flow.
- ROI scenario.
- Funnel visualization إن أمكن.
- CTA:
  "ابنِ نظام تسويق ذكي لشركتك"

مهم:
- لا تعد بأرباح مؤكدة.
- اجعل KPIs تقديرية.
- أضف disclaimer.
- حافظ على RTL والعربية.
- أضف loading/error states.
- أضف export campaign plan.

بعد التنفيذ:
- اربط services/marketing-automation.html بالديمو.
- اختبر المسار.
- اكتب تقرير:
reports/marketing-demo-upgrade.md
```

---

## 13) برومبت إنشاء ديمو سلسلة التوريد

```text
أنت Senior Supply Chain SaaS Engineer + Operations UX Designer.

أنشئ أو حسّن Demo تفاعلي لخدمة:
أتمتة تحسين سلسلة التوريد.

المسارات:
- services/supply-chain-optimization.html موجود كصفحة خدمة.
- أنشئ ديمو تفاعلي جديد إن لم يوجد:
  demo/supply-chain-optimization/index.html
  demo/supply-chain-optimization/app.js
  demo/supply-chain-optimization/styles.css
أو اتبع نمط المشروع الحالي إن كان مختلف.

اربط صفحة الخدمة بالديمو الجديد عبر CTA واضح.

اربط AI عبر:
POST /api/ai/demo/supply-chain

لا تستخدم Gemini مباشرة من المتصفح.

التجربة المطلوبة:
- يدخل المستخدم:
  sku
  current_stock
  average_daily_demand
  lead_time_days
  supplier_reliability
  seasonality
  storage_cost
  target_service_level
- زر "استخدم بيانات SKU تجريبية".
- Gemini يرجع:
  demand_forecast_summary
  reorder_recommendation
  reorder_point
  stockout_risk
  overstock_risk
  supplier_risk
  distribution_notes
  cost_saving_opportunities
  next_best_actions

واجهة النتائج:
- Inventory risk card.
- Reorder recommendation.
- Forecast summary.
- Supplier alerts.
- Cost saving opportunities.
- Next best actions.
- CTA:
  "قلل نفاد المخزون وارفع كفاءة التوزيع"

مهم:
- لا تعد بتخفيضات تكلفة مؤكدة.
- اجعل النتائج تقديرية.
- أضف disclaimer.
- حافظ على RTL والعربية.
- أضف loading/error states.
- أضف export report.

بعد التنفيذ:
- اربط services/supply-chain-optimization.html بالديمو.
- اختبر المسار.
- اكتب تقرير:
reports/supply-chain-demo-upgrade.md
```

---

## 14) برومبت توحيد التصميم والـ CTA بعد كل الديموهات

```text
أنت Senior UX/UI Designer + Conversion Rate Optimization Expert.

بعد أن أصبحت كل الديموهات مربوطة بالـ AI Gateway، وحّد تجربة المستخدم والهوية البصرية.

المسارات:
- interview/
- smart-medical-archive/
- try/data-analyzer/
- ai-scolecs/
- health/
- demo/ocr-demo/
- ai-bots/BrightSupport/
- demo/marketing-automation/
- demo/supply-chain-optimization/

المطلوب:
1. لا تغيّر منطق AI الأساسي.
2. حسّن الواجهة فقط.
3. اجعل كل ديمو يحتوي:
   - Hero واضح.
   - مشكلة العميل.
   - Demo console فوق الصفحة.
   - زر "استخدم بيانات تجريبية".
   - نتيجة AI ملموسة.
   - Dashboard أو Report.
   - مقارنة قبل/بعد BrightAI.
   - Trust badges:
     آمن
     قابل للربط
     مناسب للسوق السعودي
     مدعوم عبر API
     تقارير قابلة للتصدير
   - CTA نهائي:
     "اطلب تطبيق هذا النظام لجهتك"

4. حسّن:
   - loading states
   - empty states
   - error states
   - mobile responsiveness
   - RTL spacing
   - typography
   - cards
   - buttons
   - result summaries

5. أضف microcopy قوي:
   - "شاهد القرار قبل وبعد الذكاء الاصطناعي"
   - "جرّب ببيانات نموذجية"
   - "صدّر تقرير جاهز للإدارة"
   - "اطلب ربطه بأنظمتك"

6. لا تستخدم وعود مبالغ فيها.
7. لا تذكر أرقام ROI مؤكدة.
8. لا تكسر SEO أو canonical links.

بعد التنفيذ:
- اختبر الصفحات على desktop/mobile.
- أصلح console errors.
- اكتب تقرير:
reports/demo-ux-conversion-upgrade.md
```

---

## 15) برومبت الاختبارات والتنظيف النهائي

```text
أنت Senior QA Automation Engineer.

نفّذ فحص نهائي للمشروع بعد كل التعديلات.

المطلوب:
1. شغّل:
   npm ci
   npm run test:backend
   npm run test:frontend
   npm run smoke-test
   npm run smoke-test:api
   npm run validate:production

2. إذا فشل أي أمر:
   - اقرأ الخطأ.
   - أصلح السبب.
   - لا تتجاهله.
   - لا تحذف الاختبارات للهروب من المشكلة.

3. افحص أمنياً:
   - لا يوجد AIzaSy في frontend.
   - لا يوجد hardcoded API keys.
   - لا يوجد direct Gemini browser call.
   - لا توجد secrets في logs.
   - لا توجد مخرجات AI raw داخل innerHTML بدون sanitize.

4. افحص UX:
   - كل ديمو فيه زر بيانات تجريبية.
   - كل ديمو فيه loading state.
   - كل ديمو فيه error state.
   - كل ديمو فيه نتيجة واضحة.
   - كل ديمو فيه CTA شراء/استشارة.
   - كل ديمو responsive.

5. أنشئ تقرير نهائي:
reports/final-demo-ai-upgrade-report.md

التقرير يحتوي:
- ما تم إنجازه.
- الملفات المعدلة.
- endpoints الجديدة.
- طريقة تشغيل المشروع.
- متغيرات البيئة المطلوبة.
- الاختبارات التي نجحت.
- الاختبارات التي فشلت إن وجدت وسببها.
- الأعمال المؤجلة.
```

---

## الترتيب اللي أنصحك تمشي عليه

ابدأ بهذا الترتيب بالضبط:

1. فحص المشروع
2. تنظيف مفاتيح Gemini
3. بناء AI Gateway
4. توحيد Frontend API Client
5. تحسين كل ديمو واحد واحد
6. إنشاء ديمو التسويق
7. إنشاء ديمو سلسلة التوريد
8. توحيد التصميم والتحويل
9. اختبارات نهائية

لا تعطي Codex كل البرومبتات مرة وحدة. عطه واحد، خله يخلص، راجع الـ diff، بعدها اللي بعده.

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
