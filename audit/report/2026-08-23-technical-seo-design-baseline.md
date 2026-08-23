# BrightAI — Technical SEO & Design Baseline

**تاريخ التدقيق:** 2026-08-23 (Asia/Riyadh)  
**النطاق:** قراءة وتحليل فقط للكود، build output، أدوات التدقيق المحلية، وعينة من الموقع الحي.  
**التعديلات:** لا تعديل على صفحات الموقع أو مكونات SEO أو إعدادات Cloudflare. أُنشئ هذا التقرير فقط.  
**حالة الإنتاج:** غير مثبتة بالكامل؛ أدوات `curl` المحلية فشلت بسبب DNS داخل البيئة، وعينة web crawl المتاحة قديمة نسبيًا.

## الخلاصة التنفيذية

التقييم المؤقت: **62/100 — baseline محلي قابل للعمل، وليس Go/No-Go للإنتاج**.

نقاط القوة المثبتة محليًا:

- `sitemap.xml` يحتوي 258 URL، وكل الروابط تنتهي بـ `/`.
- 275 ملف HTML في `dist/client`، مع canonical وtitle وdescription وH1 في الصفحات التي فُحصت.
- `seo-ci-check` و`seo:check` و`seo:schema` و`seo:hreflang` و`internal-links:audit` و`redirects:check` مرّت بنتائج صفر أعطال في قواعدها الحالية.
- لا orphan pages، ولا broken links، وأقصى عمق روابط 3 نقرات حسب تقرير graph المحلي.
- `BaseLayout` و`SEOHead` يملكان نقطة مركزية لـ canonical/robots/OG/hreflang/schema، مع تصميم static-HTML-first للصفحات التسويقية.

المشاكل التي تمنع اعتبار baseline نظيف:

1. `pnpm exec astro check` فشل بـ **127 errors / 0 warnings / 85 hints** على 264 ملفًا.
2. Astro سجّل **26 route collisions** بين legacy/static routes بصيغة trailing-slash وغير trailing-slash، منها `/blog/astr.doc` و`/blog/atou.doc` و`/blog/cloude-opus-4.6` ومسارات قديمة تحت `/services/`.
3. صفحات `/answer/` عددها 17، ومحتواها المرندر محليًا بين **122 و151 كلمة**؛ هذا تحت عقد الصفحة المعلن 150–300 كلمة، ويزيد خطر thin/near-duplicate content.
4. يوجد تكرار H1 بين `/answer/ai-banking/` و`/lp/banking/`، وبين `/answer/ai-healthcare/` و`/lp/healthcare/`. هذا ليس duplicate URL بحد ذاته، لكنه يحتاج قرار intent واضح لمنع cannibalization.
5. live homepage التي ظهرت في web crawl تعرض claims رقمية وتنظيمية قوية مثل `+15 عميل` و`99.7%` و`ISO 27001` وعبارات `متوافق`؛ لم أجد في هذا التدقيق دليلًا مستقلًا يثبتها، لذلك تُسجل كـ **Trust/Compliance review risk** وليس كحقيقة.
6. النسخة الإنجليزية الحية الظاهرة في crawl تستخدم taxonomy قديمة مختلفة بوضوح عن Arabic/current local architecture؛ علاقة hreflang محليًا سليمة، لكن التكافؤ الحي بين الصفحات **N/A**.
7. قياسات CrUX/Lighthouse/LCP/INP/CLS الحية: **N/A**. لا توجد في هذه الجولة عينة field data أو browser performance run مكتملة.

## 1. خريطة الروابط الاستراتيجية ومصدر كل URL

الجرد أدناه مبني على build output الحالي و`sitemap.xml` المحلي. كل الصفحات في هذه الأقسام static routes ناتجة من source واحد ديناميكي، لذلك لا يوجد ملف Astro مستقل لكل slug.

| URL family | العدد المرندر | التصنيف | مصدر التصيير | مصدر البيانات |
|---|---:|---|---|---|
| `/answer/*` | 17 | Quick answer / AEO | `src/pages/answer/[slug].astro` | `src/data/answers.ts` |
| `/hub/` و`/hub/*` | 6 | Informational pillar | `src/pages/hub/index.astro`, `src/pages/hub/[slug].astro` | `src/data/hub-content-inline.ts` وبيانات hub الحالية |
| `/solutions/` و`/solutions/*` | 26 | Commercial | `src/pages/solutions/index.astro`, `[slug].astro`, `[sector].astro`, `[sector]/[city].astro`, `cities/[city].astro` | `src/data/solutions.ts`, `src/data/migratedSolutionPages.ts` |
| `/docs/` و`/docs/*` | 49 | Technical docs | `src/pages/docs/index.astro`, `src/pages/docs/[...slug].astro` | `src/content/docs/*.md` |
| `/blog/` و`/blog/*` | 102 | Supporting article / category | `src/pages/blog/index.astro`, `[...slug].astro`, `category/[category].astro` | `src/content/blog/*.md` + `src/data/blog.ts` |
| `/assessment/ai-governance-readiness/` | 1 | Conversion | `src/pages/assessment/ai-governance-readiness/index.astro` | page-local content/data |

**الإجمالي للأقسام المطلوبة:** 201 URL مرندر.  
**إجمالي sitemap المحلي:** 258 URL. الباقي صفحات عامة خارج الأقسام المطلوبة مثل الصفحة الرئيسية، legal, trust, pricing, kernel, authors, customers, calculator, events, وRSS/feed surfaces.

### تصنيف كامل حسب intent

- **Quick answer:** كل URLs تحت `/answer/` وعددها 17. الـ source الواحد يقرأ `answers.ts` ويصدر `FAQPage` و`WebPage` و`SpeakableSpecification` لكل slug. لا يوجد client hydration.
- **Informational pillar:** `/hub/`, `/hub/ai-governance/`, `/hub/compliance/`, `/hub/security/`, `/hub/solutions/`, `/hub/use-cases/` — عددها 6.
- **Commercial:** `/solutions/`، 9 product solution pages، 5 sector pages، 6 city/sector pages، و6 city redirect surfaces في source؛ الـ city redirects ليست indexable content. العدد المرندر تحت `/solutions/` هو 26، والـ sitemap يستبعد redirect-only surfaces.
- **Technical docs:** كل 49 URL تحت `/docs/`، بما فيها docs العامة، PDPL/NCA/SDAIA، وKernel technical docs. المصدر canonical هو Markdown collection، والصفحة dynamic renderer واحدة.
- **Supporting article:** `/blog/` index، 5 category pages، و96 article outputs تقريبًا من `src/content/blog/*.md`؛ العدد المرندر 102. كل المقالات تمر عبر `BlogLayout` وتصدر `BlogPosting`.
- **Conversion:** assessment page واحدة؛ محتوى طويل، نموذج متعدد الخطوات، وHowTo/FAQ schema.

### ملفات source التي تحكم الـ strategic URLs

| الملف | دوره الفعلي |
|---|---|
| `src/layouts/BaseLayout.astro` | HTML shell، robots، canonical fallback، hreflang forwarding، foundation schema، preload، header/footer/scripts |
| `src/layouts/ArabicLayout.astro` | wrapper RTL يمرر props إلى BaseLayout |
| `src/layouts/EnglishLayout.astro` | wrapper LTR يمرر props إلى BaseLayout |
| `src/layouts/BlogLayout.astro` | BlogPosting، article shell، breadcrumbs، related links، author metadata |
| `src/components/SEOHead.astro` | title/description/robots/canonical/OG/Twitter/hreflang/JSON-LD output |
| `src/data/site.ts` | site URL، locale، brand، social، default language، tracking IDs |
| `src/data/solutions.ts` | product/sector/city taxonomy وcanonical metadata |
| `src/content/blog/*.md` | body وfrontmatter للمقالات |
| `src/content/docs/*.md` | body وfrontmatter للوثائق |
| `public/robots.txt`, `public/llms*.txt`, `public/ai.txt` | crawler/AI discovery policy والروابط المرجعية |
| `public/sitemap.xml` + `scripts/generate-sitemap-all-pages.mjs` | sitemap source/output؛ build ينشئ أيضًا `dist/client/sitemap.xml` و`sitemap-index.xml` |
| `redirects.json`, `astro.config.mjs`, `public/_redirects` | legacy redirects وtrailing-slash/deployment routing |
| `public/_headers`, `render.yaml`, `scripts/security-headers.mjs` | security/robots/cache header contracts؛ Render block موثق بأنه لا يطبق runtime headers على Node service |

## 2. Canonical, hreflang, indexability, duplicates

### النتائج المارة محليًا

| الفحص | النتيجة |
|---|---|
| canonical existence/format | PASS — أداة `seo-health-check` فحصت 269 صفحة كاملة |
| title/description/H1 presence | PASS في الفحص المحلي |
| canonical conflicts | 0 في `seo-ci-check` وinternal-link graph |
| hreflang bidirectional | 259 sets، 0 missing return tags، 0 canonical mismatch، 0 missing x-default |
| noindex + hreflang conflict | 0 |
| broken internal links | 0؛ 48,190 references في `seo-ci-check`، و0 في link graph |
| orphan pages | 0 |
| max click depth | 3، بدون violations |
| duplicate titles | 0 في فحص HTML المحلي الحالي |
| duplicate H1 values | موجود cross-intent في `/answer/*` و`/lp/*`، وتكرار author H1 عبر author profiles |

### noindex الحالي

عدد صفحات `dist/client` التي تحتوي `noindex`: **16**. وهي:

- `/thank-you/`
- `/offline/` و`/kernel/offline/`
- `/design/buttons/`, `/design/cards/`, `/design/colors/`, `/design/forms/`, `/design/typography/`
- `/kernel/admin/quota/`
- `/500/`
- ستة legacy redirect-only تحت `/solutions/cities/`

هذا متوافق مع allowlist الظاهر في `BaseLayout` من حيث utility/admin/confirmation/redirect surfaces، لكن `/500/` وredirect outputs يجب التحقق منهما live عبر status code و`X-Robots-Tag`؛ ذلك **N/A** حاليًا.

### thin/near-duplicate risks

- كل `/answer/*` الـ17 بين 122–151 كلمة في build parser، مع source comment يقول 150–300 كلمة. تحتاج الصفحات قرارًا واضحًا: إما quick answers قصيرة مقصودة مع canonical/intent مضبوط، أو توسيعها إلى إجابات ذات قيمة مستقلة.
- أزواج محتملة للتعارض: `/answer/ai-banking/` مقابل `/lp/banking/`، و`/answer/ai-healthcare/` مقابل `/lp/healthcare/`.
- `/solutions/cities/*` يظهر كـ redirect body فارغ في build output (`file not created, response body was empty`) وهذا جيد من ناحية عدم فهرسة thin redirect، لكن إثبات 301/redirect chain حي **N/A**.
- توجد legacy route candidates كثيرة خارج sitemap: build يمر على files قديمة ويصدر body فارغًا أو يحذر من collision. لا تُحذف قبل mapping إلى redirect/source owner.

## 3. Robots, sitemap, AI surfaces, structured data

- `public/robots.txt` يسمح بالزحف العام ويمنع `/api/`، ويحتوي Sitemap reference. فيه سياسات صريحة لـ OAI/ChatGPT/Perplexity/Claude/Google/Apple crawler classes.
- `public/llms.txt`, `public/llms-full.txt`, و`public/ai.txt` موجودة محليًا، وتربط إلى sitemap/schema/robots. freshness labels داخل `ai.txt` مؤرخة 2026-07-18 وتحتاج ownership/freshness review قبل اعتبارها current.
- `public/schema-saudi-seo.json` موجود، و`seo:schema` مرّر: **62 page schema audits** و**262 speakable pages**.
- `BaseLayout` يدمج foundation graph، و`BlogLayout` يضيف `BlogPosting`، وحلول/docs تضيف Service/FAQ/HowTo حسب page data.
- `answer/[slug].astro` standalone ولا يستخدم `BaseLayout` أو `SEOHead`; يملك meta/schema/hreflang خاصًا به. هذا مصدر تكرار معماري محتمل يجب مراقبته عند أي تحسين.
- `public/sitemap.xml` المحلي ثابت بحجم 1,550 سطرًا و258 URL. Build الحالي أنشأ أيضًا `dist/client/sitemap.xml` (87,296 bytes)، `sitemap-0.xml`، `sitemap-index.xml`، و`sitemap-images.xml`. مقارنة public-vs-build content التفصيلية: **N/A** لأن generator يعمل ضمن build pipeline ولم أقم بتغيير أو commit مخرجاته.

## 4. Redirects, headers, Cloudflare/Render boundary

- `redirects:check`: 209 redirect entries، 0 self redirects، 0 missing destinations، 0 chains، 0 cycles.
- `headers:check`: PASS، ولا drift بين `scripts/security-headers.mjs` و`public/_headers`/`render.yaml` حسب checker.
- المصدر المحلي يثبت وجود `X-Robots-Tag: index, follow...` وHSTS وCSP وPermissions-Policy في header contracts.
- `render.yaml` يوضح أن `headers:` لا تطبق على Render Node Web Service runtime؛ runtime headers تمر عبر middleware، وHSTS للصفحات static يحتاج Cloudflare edge rule. لم يتم لمس Cloudflare، وإثبات القاعدة على production **N/A**.
- `verify:deployment-surface` لم يثبت runtime: **standalone server لم يصبح ready خلال 10 ثوانٍ؛ 0 passed / 0 failed من 57**. هذا ليس دليلًا على أن 57 checks صحيحة أو خاطئة؛ هو blocker تشغيل محلي.

## 5. Design baseline

### نقاط القوة

- يوجد token layer واضح في `src/styles/tokens.css`: IBM Plex Sans Arabic، spacing scale، typography scale، radii، shadows، containers، وfocus/touch contracts.
- `base.css` يضع `font-size: 16px`، focus-visible، logical properties، skip-link، وtouch baseline.
- `BaseLayout` يستخدم RTL Arabic كافتراضي، و`EnglishLayout` يستخدم LTR.
- `answer/[slug].astro` static/no hydration ويمتلك mobile-first scoped CSS و`prefers-reduced-motion`.
- `BlogLayout` و`DocsLayout` يعيدان استخدام shell وTOC/related/breadcrumb patterns بدل صفحات منفصلة بالكامل.

### عدم الاتساق/الدين

- حجم CSS الحالي: `base.css` 670 سطرًا، `components.css` 3,437، `pages.css` 6,587، `tokens.css` 646، `critical.css` 75 — إجمالي 11,415 سطرًا قبل compiled CSS. هذا يدل على design system موجود لكنه متضخم، مع احتمال كبير لتداخل page-specific selectors.
- تم رصد 111 inline `style="..."` attribute داخل `src/pages`, `src/components`, و`src/layouts`؛ هذا مخالف لنية design-token/CSP contract ويصعّب توحيد spacing/colors.
- توجد scripts داخلية كثيرة: 125 script tags في source scan، مقابل Astro client directives عددها 2 فقط. هذا يعني أن الخطر الأكبر ليس island hydration marketing بل inline/page scripts وglobal scripts في BaseLayout/Kernel surfaces.
- `BaseLayout` يحمّل global scripts مثل `sw-register`, `gtag-init`, analytics, scroll-reveal, focus-trap، بالإضافة إلى marketing integrations حسب الحالة. تأثيرها على LCP/INP الحقيقي **N/A** بدون browser trace.
- `src/layouts/BaseLayout.astro.noapp` نسخة layout موازية خارج المسار الفعلي؛ ليست مشكلة SEO بحد ذاتها، لكنها تزيد source ambiguity أثناء audits.
- `components.css` و`pages.css` يحتويان عائلات متعددة للبطاقات والأزرار والنماذج؛ لا يوجد في هذه الجولة matrix آلي يثبت أن كل variant يستخدم نفس token contract. يلزم UI inventory قبل refactor.

### الصور والأصول عالية الكلفة المحتملة

- أكبر ملفات public المرئية في الفحص: `public/logo.webp` 148K، `public/assets/images/logo.webp` 136K، `public/assets/images/og/og-solutions.webp` 60K، `public/assets/images/og/og-home.png` 52K.
- `BaseLayout` يحمّل AVIF/WebP logo preloads وIBM Plex Arabic preloads. الـ optimized preloads صغيرة نسبيًا، لكن وجود نسخ logo legacy الكبيرة يستحق asset usage map قبل حذف أو تغيير أي ملف.
- `src/pages/index.astro` 88K و`src/components/SplitHero.astro` 52K؛ الصفحة الرئيسية تجمع hero، عدة sections، forms، analytics، وscripts. هذا يجعلها أعلى مرشح لقياس LCP/CLS أولًا.
- CLS موثق في comments داخل `tokens.css` كـ historical homepage value `0.168` قبل إصلاح font swap؛ لا يُعامل كقياس حالي. **Current LCP/CLS/INP: N/A**.

## 6. Validation ledger

| الأمر | النتيجة الحالية | الملاحظة |
|---|---|---|
| `pnpm seo:check` | PASS | 258 sitemap URLs، 275 HTML، canonical/title/description/H1 checks، content acceptance 4/4 |
| `pnpm seo:schema` | PASS | schema 62 pages، speakable 262 pages |
| `pnpm seo:gate` | PASS | 48,190 references، 0 broken، 0 canonical/noindex-hreflang issues |
| `pnpm seo:hreflang` | PASS | 259 sets، 0 errors |
| `pnpm internal-links:audit` | PASS | 0 broken/orphans، max depth 3؛ كتب reports تحت `reports/` أثناء التشغيل |
| `pnpm redirects:check` | PASS | 209 redirects، no chains/cycles |
| `pnpm headers:check` | PASS | no local header drift |
| `pnpm verify:deployment-surface` | BLOCKED | server not ready in 10s؛ 0/57 executed |
| `pnpm exec astro build` | PASS with warnings | Complete؛ لكن 26 route collision warnings وlegacy empty outputs ظهرت |
| `pnpm exec astro check` | FAIL | 127 errors / 0 warnings / 85 hints؛ أبرزها `src/middleware.ts`, `src/data/answers.ts`, `src/pages/api/lead.ts`, ومكونات Kernel |
| `pnpm test` | PASS | root tests completed؛ warnings runtime/GA4 no-op ظهرت، و`prisma generate` شغّل ضمن pretest |
| CrUX/PageSpeed/Lighthouse field | N/A | لم تُشغّل عينة live قابلة للإثبات في هذه الجولة |
| production HTTP status/headers | N/A | DNS blocked للـ curl؛ web crawl sample لا يكفي لإثبات الحالة الحالية |

## 7. الأولويات قبل أي optimization

### P0 — source/build integrity

1. حصر الـ 26 route collisions وربط كل legacy surface بمالك source واحد أو redirect واضح؛ لا تحذف أي route قبل تقرير mapping.
2. إصلاح/عزل أسباب `astro check` الـ127، ثم إعادة تشغيل SEO gates بعد clean check.
3. تشغيل production verification من بيئة فيها DNS وHTTP access: status codes، headers، robots، sitemap، canonical، وsample pages من كل strategic family.

### P1 — search architecture

4. قرار intent رسمي لـ17 answer pages: quick-answer cluster قصير أم صفحات توسّع؛ ثم حل overlap مع `/lp/*` بدون إنشاء doorway pages.
5. مراجعة live Arabic/English parity: current local `/en/` مقابل live `/en/`، وتثبيت hreflang على content-equivalent pairs فقط.
6. مراجعة claims التنظيمية والأرقام والشهادات الظاهرة في homepage/solution content؛ استبدال المطلق منها بصياغة evidence-backed إذا ما فيه مصدر repository قابل للتحقق.

### P2 — design/performance

7. بناء component inventory للـ cards/buttons/forms/header/footer على 360px و1440px، ثم تقليل page-specific CSS بدون تغيير المحتوى.
8. قياس homepage وواحد من كل strategic family بـ Lighthouse/trace: LCP، CLS، INP، JS bytes، render-blocking، image priority.
9. استخراج asset usage map للـ logo/OG variants وتوحيد preload/LCP image بدون حذف ملفات legacy قبل إثبات عدم استخدامها.

## 8. المخاطر المتبقية

- نتائج local gates قد تكون صحيحة مقابل `dist` الحالي لكنها لا تثبت ما يراه Google أو المستخدم على الإنتاج.
- live crawl الذي أمكن فتحه عبر web tool مذكور على أنه crawled last month، لذلك أي claim عن current live content/headers يبقى غير مؤكد.
- build مرّ رغم route collisions؛ هذا لا يعني أن collisions آمنة مستقبلًا، خصوصًا أن Astro نفسه يحذر من hard error في إصدارات قادمة.
- `pnpm test` root ليس full monorepo acceptance ولا browser E2E للصفحات التسويقية.
- لم يتم تقييم contrast/keyboard/mobile visual يدويًا في هذه الجولة؛ الأرقام الموجودة في source comments ليست بديلًا عن current browser measurements.

## Recommended next prompt

```text
Using audit/report/2026-08-23-technical-seo-design-baseline.md as the source of scope, perform a read-only source mapping of the 26 Astro route collisions and the 127 astro-check errors. Do not delete or edit routes. Produce a collision matrix with source file, generated URL, intended status, sitemap presence, redirect owner, and safest remediation. Re-run only the affected local checks and report exact before/after evidence.
```

