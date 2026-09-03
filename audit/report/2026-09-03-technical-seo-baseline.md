# BRIGHTAI Technical SEO Baseline

**تاريخ الفحص:** 2026-09-03 (Asia/Riyadh)  
**النطاق الكنسي من المصدر:** `https://brightai.live`  
**نوع المخرج:** baseline موثّق قبل أي optimization  
**نطاق الفحص:** repository + generated HTML + local SEO gates + attempted live verification

## الحكم التنفيذي

الوضع المحلي الحالي قابل للبناء والفحص: `pnpm build` نجح، و`seo:hreflang` و`seo:schema` و`seo:gate` وredirect checks كلها نجحت. المصدر يملك طبقة SEO مركزية واضحة عبر `BaseLayout.astro` و`SEOHead.astro` و`Schema.astro`، مع sitemap واحد مولّد من سكربت مخصص.

لكن baseline ليس “جاهز إنتاجيًا بلا تحفظ”: البناء يطبع route collisions legacy كثيرة، وفحص الروابط المصدرية وجد عطلين داخل demos لمهارة تحت `.agents/skills/`، ونسخة build الناتجة تحتوي صفحات redirect/utility غير مفهرسة خارج sitemap. فحص live وCore Web Vitals لم يثبتا لأن DNS غير متاح من بيئة التنفيذ؛ الحالة هنا `N/A` وليست PASS.

## مصادر الحقيقة التي تم فحصها

### طبقة SEO والـlayouts

- `src/layouts/BaseLayout.astro` — shell الأساسي، canonical fallback، robots allowlist، `SEOHead`، `FoundationSchema`، breadcrumbs، preload للخطوط، `ClientRouter`.
- `src/layouts/ArabicLayout.astro` — wrapper RTL العربي.
- `src/layouts/EnglishLayout.astro` — wrapper LTR الإنجليزي.
- `src/layouts/BlogLayout.astro` — shell المقالات، `BlogPosting`، breadcrumbs وrelated links.
- `src/layouts/DocsLayout.astro` — shell الوثائق، `TechArticle`/HowTo حسب الصفحة، TOC وprev/next.
- `src/components/SEOHead.astro` — title/description/robots/canonical/OG/Twitter/hreflang.
- `src/components/seo/Schema.astro` — `Organization` و`WebSite` و`WebPage` و`LocalBusiness`/extras/speakable.
- `src/data/site.ts` و`src/data/solutions.ts` — هوية النطاق، metadata، الحلول والقطاعات.
- `src/data/hreflang-pairs.ts` — خريطة alternates الصريحة.

### السياسات والمخرجات

- `src/styles/base.css` و`src/styles/components.css` و`src/styles/pages.css` و`src/styles/tokens.css` و`src/styles/critical.css`.
- `public/robots.txt`، `public/llms.txt`، `public/llms-full.txt`، `public/ai.txt`.
- `public/sitemap.xml` و`sitemap.xml` ومولد `scripts/generate-sitemap-all-pages.mjs`.
- `redirects.json`، `astro.config.mjs`، `render.yaml`، `public/_headers`، `public/_redirects`، `scripts/security-headers.mjs`، `scripts/headers-config.mjs`، `docs/cloudflare-deployment-headers.md`.
- البوابات: `scripts/seo-health-check.mjs`، `scripts/seo-schema-audit.mjs`، `scripts/seo-ci-check.mjs`، `scripts/hreflang-bidirectional-audit.mjs`، `scripts/check-redirect-destinations.mjs`، `scripts/internal-links-audit.mjs`، `scripts/internal-linking-architecture.mjs`، `scripts/check-word-count.mjs`.

## جرد الـindexable routes

### المصدر العددي

`public/sitemap.xml` الحالي يحتوي **263 URL فريدًا**، كلها على `brightai.live`، بدون duplicate `loc`. كل URL يحمل `x-default`؛ إجمالي alternate links هو **540**. ملف `sitemap.xml` الجذري مطابق له في baseline قبل أثر build.

| عائلة URL | العدد في sitemap | النية الغالبة | المالك الفعلي في المصدر |
|---|---:|---|---|
| `/` | 1 | conversion / entity | `src/pages/index.astro` |
| `/solutions/` | 20 | commercial + sector solution | `src/pages/solutions/index.astro`, `[slug].astro`, `[sector].astro`, `[sector]/[city].astro` |
| `/docs/` | 49 | technical docs / regulatory reference | `src/pages/docs/index.astro`, `src/pages/docs/[...slug].astro`, `src/content/docs/*.md` |
| `/blog/` | 103 | supporting article + category | `src/pages/blog/index.astro`, `category/[category].astro`, `[...slug].astro`, `src/content/blog/*.md` |
| `/answer/` | 17 | quick answer / informational capture | `src/pages/answer/[slug].astro`, `src/data/answers.ts` |
| `/hub/` | 9 | informational pillar / content hub | `src/pages/hub/index.astro`, `src/pages/hub/[slug].astro` |
| `/kernel/` | 19 | technical product/docs | `src/pages/kernel/*.astro`, `src/data/kernel-*` |
| `/en/` | 7 | English legal/product/entity | `src/pages/en/**` |
| `/authors/` | 5 | author/entity support | `src/pages/authors/**` |
| `/customers/` | 4 | proof/supporting commercial | `src/pages/customers/**` |
| `/events/` | 4 | event/conversion support | `src/pages/events/**` |
| `/lp/` | 5 | conversion landing pages | `src/pages/lp/[slug].astro` |
| other public routes | 20 | contact, pricing, trust, legal, tools, calculator, newsletter, sitemap, services, partners, sales deck, referral, etc. | corresponding `src/pages/**` |

**قائمة URL الكاملة:** الـ263 رابطًا نفسها محفوظة في `public/sitemap.xml`، وكل رابط من عائلات `/answer/` و`/hub/` و`/solutions/` و`/docs/` و`/blog/` و`/assessment/` مملوك للقوالب المحددة أعلاه. هذا هو inventory الكنسي القابل لإعادة التشغيل؛ لا يوجد مصدر ثانٍ مستقل يجب أن يُعامل كـsitemap.

### تصنيف strategic routes المطلوبة

| المجموعة | التصنيف | الحالة الحالية |
|---|---|---|
| `/solutions/` و`/solutions/[slug]/` | commercial | صفحات حلول فعلية مع `Service`/FAQ extras حسب الحل؛ لا توجد نسخة إنجليزية موازية لمعظمها. |
| `/solutions/[sector]/` | commercial + sector intent | قوالب قطاعات؛ يلزم مراقبة التشابه بين القطاع والمدينة وعدم توسيعها آليًا بلا قيمة فريدة. |
| `/solutions/[sector]/[city]/` | local commercial supporting | 6 صفحات قطاع+مدينة مفهرسة؛ نص `localContext` موجود، لكن يلزم إثبات القيمة المحلية وعدم تحولها إلى doorway pages. |
| `/solutions/cities/[city]/` | redirect/utility | 6 URLs موجودة في build فقط، `noindex` وبدون H1، وتوجّه للصفحة القطاعية؛ ليست في sitemap. |
| `/hub/` | informational pillar | 9 hubs؛ يربط مجموعات المقالات والحلول. |
| `/docs/` | technical/regulatory reference | 49 URL؛ المصدر في content collections والـDocsLayout. |
| `/blog/` | supporting article | 97 Markdown articles + index/category surfaces؛ word-count gate أثبت 97/97 فوق 1200 كلمة في المصدر. |
| `/answer/` | quick answer | 17 صفحة static من `src/data/answers.ts`؛ 6 منها بين 252–299 كلمة في HTML الناتج، لذلك تحتاج مراجعة “هل هي answer كافية؟” لا حكم thin آلي فقط. |
| `/assessment/` | conversion tool | صفحة تقييم جاهزية واحدة؛ النتائج وصفية محليًا، وليست شهادة أو وعد امتثال. |

## نتائج canonical / robots / hreflang / headings

### HTML الناتج بعد build

- HTML files: **280**.
- title missing: **0**.
- duplicate titles: **0**.
- canonical missing: **0**.
- duplicate canonical: **6**، وكلها ناتجة عن صفحات `/solutions/cities/*` redirect التي تحمل canonical للوجهة النهائية؛ ليست duplicate indexable content لأن الصفحات نفسها `noindex` وخارج sitemap.
- pages with noindex: **16**؛ تشمل `500`, `/thank-you/`, `/offline/`, `/kernel/offline/`, `/kernel/admin/quota/`, `/design/*`، و6 redirect city aliases. لا يظهر noindex في URL sitemap بحسب فحص sitemap/HTML.
- H1 ليس واحدًا: **6**؛ كلها redirect city aliases التي لا تنتج HTML محتوى فعليًا. صفحات المحتوى المفحوصة لها H1 واحد.
- HTML pages with no hreflang: **16**، وهي utility/redirect pages أو ملفات HTML خارج cluster. صفحات sitemap تحمل `x-default` في فحص XML.
- sitemap XML: valid، **263 loc**، zero duplicate loc، zero missing `x-default`، وكل alternate target موجود في sitemap/local inventory.

### ملاحظات اتساق مهمة

1. `SEOHead.astro` يرسل `og:locale` بصيغة `ar_SA` أو `en_SA` حسب `lang`. قواعد المشروع الحالية تطلب للإنجليزية `en_US` في Open Graph؛ هذا اختلاف policy يحتاج قرارًا/توحيدًا لاحقًا، ولم أعدله في baseline.
2. كثير من الصفحات العربية تمرر `hreflang` يدويًا بـ`ar-SA` و`x-default`، بينما `SEOHead` يملك أيضًا `getHreflangLinks()`. الاختبارات الحالية خضراء، لكن وجود مصدرين للنية يزيد خطر drift مستقبلًا.
3. `BlogLayout.astro` و`DocsLayout.astro` يرسلان alternates يدوية عربية فقط، بينما `BaseLayout` يملك خريطة صريحة. هذا صحيح للصفحات AR-only الحالية بحسب audit، لكنه يحتاج حارس ownership واحد إذا أضيفت نسخ EN.
4. يوجد content copy داخل `src/pages/hub/[slug].astro` يذكر “حقّق الامتثال الكامل”، بينما قواعد الثقة الحالية تمنع الادعاءات المطلقة. هذه ملاحظة تحريرية تستحق مراجعة مستقلة؛ لم أغير النص في مهمة baseline.

## rendering وsource ownership

- الموقع الرئيسي Astro `output: 'static'` مع `trailingSlash: 'always'` وNode adapter للـruntime/SSR endpoints.
- العناصر الحرجة (`title`, `description`, `robots`, `canonical`, structured data، H1 والمحتوى الأساسي) تُخرج من HTML الأولي؛ لا تعتمد الصفحات الاستراتيجية على client-only rendering لعرض النص الأساسي.
- `ClientRouter` وscroll-reveal وMarketingScripts موجودة في shell؛ يجب إبقاء reveal fail-open لأن أي إخفاء قبل JavaScript يضر indexing وLCP.
- `src/pages/answer/[slug].astro` و`src/pages/lp/[slug].astro` لهما HTML head مستقل بدل BaseLayout، ولذلك يلزم استمرار فحص robots/canonical/hreflang الخاص بهما.
- route ownership الفعلي للقوالب الاستراتيجية موثق في جدول inventory أعلاه؛ البيانات الديناميكية الأساسية تأتي من `src/content/**` أو `src/data/{answers,blog,solutions,hreflang-pairs}.ts`.

## redirects / headers / Cloudflare architecture

- `redirects.json` يحوي **209** redirect source entries في check الحالي؛ فحص الوجهات: self redirects 0، missing destinations 0، duplicate sources 0، chains 0، cycles 0.
- `astro.config.mjs` يولد/يحتوي **200** redirects runtime بعد استبعاد 9 حالات لها static page أو wildcard.
- `render.yaml` و`public/_headers` موثق أنهما legacy/documentation layers في stack الحالي؛ المصدر الفعلي للقيم هو `scripts/security-headers.mjs`، مع middleware للـSSR و`injectSecurityMeta()` للـHTML static، وCloudflare Transform Rule مطلوب لـHSTS static.
- لا يوجد `wrangler.toml` في الجذر. لا يوجد دليل من repository على تعديل Cloudflare production ضمن هذه المهمة.
- live header verification: **N/A / blocked by environment DNS** — `curl` وNode fetch أعادا `Could not resolve host` / `fetch failed` لكل 20 route. لا يمكن من هذا التشغيل إثبات HTTP status أو HSTS أو CSP على production.

## robots / AI visibility files

- `public/robots.txt` موجود ويشير إلى sitemap الكنسي، ويسمح بزواحف البحث وAI حسب السياسة المحلية.
- `public/llms.txt` و`public/llms-full.txt` و`public/ai.txt` موجودة محليًا.
- لم أتحقق من النسخ المنشورة live بسبب DNS؛ حالة live availability لهذه الملفات: **N/A**.
- لا يوجد قياس citation، Search Console، Bing Webmaster، أو AI referral traffic في هذه المهمة: **N/A**.

## thin content وduplicate intent

### مثبت آليًا

- 13 HTML outputs تحت 300 كلمة، لكن 6 منها redirect aliases و1 منها `/kernel/admin/quota/` utility؛ الباقي quick answers قصيرة نسبيًا.
- كل مقالات المصدر الـ97 اجتازت حد `check-word-count.mjs`: **97/97**، والحد المحلي 1200 كلمة.
- لا duplicate titles في HTML الناتج.
- لا orphan pages أو broken links في internal-linking architecture: **0 / 0**، max click depth **3**.

### يحتاج حكم تحريري

- تشابه `/answer/*` مع `/hub/*` و`/blog/*` حول PDPL/SAMA/NCA/AI governance قد يسبب cannibalization حتى مع titles مختلفة؛ لا يمكن حسمه من duplicate-title check وحده.
- صفحات القطاع+المدينة يجب أن تُقيّم على unique local proof/context، لا على وجود اسم المدينة فقط.
- `/lp/*` صفحات conversion لها overlap موضوعي مع `/solutions/*`؛ يلزم ownership map قبل أي صفحة جديدة.

## design baseline

### الاتساق

- توجد عائلات CSS مشتركة كبيرة: `base.css` و`components.css` و`pages.css` و`tokens.css`، مع aliases legacy مثل `inner-section`/`inner-card` بجانب `section--padded` و`card--feature`.
- البطاقات والأزرار ليست primitive واحدة بالكامل: توجد classes مشتركة، لكن أيضًا raw Tailwind/inline styles في صفحات الحلول والمقالات (`transition-all` و`style=`)، ما يخلق drift في spacing/hover/focus.
- توجد `<style>` blocks page-scoped في answer/hub/assessment/blog/category/docs/solutions، إضافة إلى CSS العام؛ هذا مناسب أحيانًا لعزل الصفحة لكنه يرفع خطر duplication.
- header/footer مركزيان عبر `Header.astro` و`MobileNav.astro` و`Footer.astro`، بينما Kernel له `KernelLayout` وسياق بصري مختلف؛ هذا مقصود لكنه يحتاج ownership واضح عند SEO/CWV comparisons.

### RTL / typography / accessibility risks

- Arabic default هو `lang="ar" dir="rtl"`، والـEnglish shell `ltr`.
- يوجد استخدام منطقي جيد في بعض الطبقات، لكن وجود raw `px-*`, `ml-*`, `mr-*`, وinline positioning في صفحات استراتيجية يستحق scan RTL مستقل.
- الخط العربي يُحمّل عبر preload من `BaseLayout` و`critical.css`/`tokens.css`؛ يجب قياس أثر تعدد الخطوط الفعلية لا الاكتفاء بوجود preload.
- أدوات الفحص الآلي للـSEO لا تثبت contrast/keyboard/VoiceOver؛ هذه الأرقام: **N/A في baseline هذا**.

### high-cost assets / hydration

- `9.mp4` موجود في repository وحجمه المسجل في mind هو نحو **7.96MB**؛ هذا أعلى بكثير من ميزانية الصفحة، وقد يؤثر على bandwidth/LCP حتى لو كان background. لا توجد قياس LCP سببي من هذه المهمة: **N/A**.
- build output المحلي: `dist/client` نحو **40MB** شامل الأصول؛ هذا ليس page transfer size، ولا يُستخدم كبديل للـnetwork waterfall.
- CSS بعد purge في build: baseline output سجل تقريبًا **772.9KB raw** عبر chunks بعد خفض من 888.4KB؛ هذا aggregate لا يمثل CSS critical لكل route.
- `SplitHero` يذكر `client:visible`، والـshell يستخدم `ClientRouter` وMarketingScripts؛ hydration impact الفعلي على LCP/INP: **N/A** لعدم وجود Lighthouse/trace.
- لا يوجد `<video>` في HTML strategic parser لأن background implementation لا يظهر كعنصر video في هذه الصفحات؛ هذا لا يثبت أن asset غير محمّل عبر CSS/JS.

## validation ledger

| الفحص | النتيجة | التفاصيل |
|---|---|---|
| `pnpm build` | PASS | complete؛ 274 HTML static meta injections؛ تحذيرات route collisions legacy وVite ظهرت أثناء البناء. |
| `pnpm typecheck` | PASS with hints | 0 errors، 0 warnings، 2 hints داخل QC (`taskSearch.ts` unused `n`، `lab/search.ts` unused `positiveInt`). |
| `pnpm test` | PASS | root suites: chat session 16، CSRF 16، PII 38؛ الإجمالي 70 tests، 0 failed. ظهرت no-op usage tracking بسبب غياب `DATABASE_URL` و`GA4_API_SECRET` ولم تمنع الاختبار. |
| `pnpm lint` | FAIL | `apps/dashboard/lib/observability/logger.ts:81` فيه خطآن `no-explicit-any`؛ ظهرت warnings إضافية. |
| `pnpm seo:hreflang` | PASS | 264 sets، 0 missing returns، 0 canonical mismatch، 0 missing x-default، 0 non-200 hreflang. |
| `pnpm seo:schema` | PASS | schema 62 pages، speakable 267 pages، solution/docs sync clean. |
| `pnpm seo:gate` | PASS | 263 sitemap URLs، 378 files، 47,862 references، 0 broken links، 0 canonical/noindex+hrelang policy errors. |
| `pnpm redirects:check` | PASS | 209 scanned، 0 chains/cycles/missing/duplicates. |
| `pnpm internal-links:audit` | PARTIAL | architecture gate PASS: 279 discovered/262 indexable، 0 orphans، 0 broken، max depth 3؛ source audit report وجد عطلين CSS URL في `.agents/skills/scroll-world-storytelling/demo/**`. |
| `pnpm seo:word-count` | PASS | 97/97 articles فوق 1200 كلمة. |
| `pnpm verify:live:headers` | N/A | DNS unavailable؛ 20/20 fetches failed بيئيًا، لا حكم live. |
| Lighthouse / PSI / CrUX | N/A | CLI/API/field data غير متاحة في هذه المهمة؛ لا LCP/INP/CLS أو score مدّعى. |
| browser manual 360/1440 | N/A | لم تُنفذ جلسة browser visual لهذه baseline. |

## الأولويات قبل optimization

1. **P0 — تثبيت route generation:** افصل/احذف أو اعزل legacy slug sources التي تولد collisions مع `/blog/*` و`/docs/*`؛ لا يكفي أن build ينجح مع warning لأن Astro يذكر أنه قد يصير hard error لاحقًا.
2. **P1 — توحيد Open Graph locale:** قرر هل English pages تستخدم `en_SA` أو policy المطلوبة `en_US`، ثم وحّدها في مصدر واحد مع regression test.
3. **P1 — تثبيت intent ownership:** راجع overlap بين answer/hub/blog/lp/solutions والقطاع+المدينة قبل إنتاج صفحات جديدة.
4. **P1 — قياس حقيقي:** شغّل Lighthouse mobile/desktop وPSI/CrUX من بيئة DNS قادرة، وسجّل page transfer وLCP/INP/CLS لكل route representative؛ لا تستخدم حجم `dist/client` كبديل.
5. **P1 — فحص live:** أعد `verify:live:headers` وHTTP status/canonical/robots/sitemap بعد توفر DNS، مع تسجيل build identity.
6. **P2 — توحيد design primitives:** قلل page-specific `style=` وraw Tailwind في الأسطح الاستراتيجية، مع الحفاظ على RTL وCTA/link contracts.
7. **P2 — مراجعة copy/trust:** راجع العبارات المطلقة مثل “حقّق الامتثال الكامل” قبل أي توسعة محتوى أو schema.
8. **P2 — تنظيف source audit noise:** أصلح أو استبعد بوضوح CSS `url(%23n)` داخل demos تحت `.agents/skills/` من source-link audit حتى لا تختلط بمؤشرات الموقع.

## حدود baseline

- لم تُعدّل ملفات الموقع أو layouts أو data أو CSS أو Cloudflare settings.
- تشغيل build غيّر artifacts مولّدة محليًا (`sitemap` وبعض media copies)؛ هذه آثار تحقق وليست تغييرات تصميمية مقصودة، ويجب تنظيفها قبل commit.
- لا توجد بيانات Search Console، Bing، CrUX، PSI، Lighthouse، server logs، أو analytics في هذا baseline: **N/A**.
- لا يوجد حكم production indexing أو HTTP 200 أو redirect behavior live بسبب DNS: **N/A**.
- لا توجد ادعاءات certification/regulator approval/customer proof في هذا التقرير.

## التوصية التالية

ابدأ بمهمة مستقلة لإصلاح route collisions وتوحيد locale/ownership contracts، ثم شغّل baseline live + Lighthouse من runner قادر على DNS، وبعدها فقط ابدأ تحسين الصفحات ذات الأولوية بناءً على intent واحد لكل URL.
