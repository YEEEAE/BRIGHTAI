## الحكم التنفيذي

الحالة الحقيقية للمشروع: **33%**. المشكلة مو “SEO ضعيف”؛ عندكم نشر يفتح نسخ مكررة من الموقع وكود backend علنًا، وhreflang فعليًا مكسور، وإعدادات security المكتوبة ما تنعكس في الرد الحي. هذا كافي يفسّر ضعف الفهرسة والثقة حتى قبل ما نناقش المحتوى.

| المحور | الحالي | السقف بعد الإصلاح | الثقة |
|---|---:|---:|---:|
| Indexation | 18% | 78% | 60% |
| Saudi visibility | 24% | 70% | 45% |
| Code & security | 42% | 82% | 60% |
| Design / UX | 58% | 78% | 55% |
| Performance | 48% | 80% | 45% |
| **Overall** | **33%** | **76%** | **≤60%** |

الحساب: `18×0.30 + 24×0.25 + 42×0.18 + 58×0.15 + 48×0.12 = 33.4%`.

## Top 10 قاتل

| P | المشكلة | الدليل | الأثر |
|---|---|---|---|
| P0 | نسخة مكررة حرفيًا من كل الموقع تحت `/client/` | SHA-256 للـ HTML متطابق: `/` = `/client/index.html`، و`/about/` = `/client/about/index.html`; كلا المسارين `200` | Duplicate-content وcrawl waste |
| P0 | كود backend مكشوف علنًا | `https://brightai.site/frontend/server.js` يرجع `200`, `Content-Type: application/javascript` | كشف منطق الخادم ومساحة هجوم أكبر |
| P0 | hreflang للإنجليزي مكسور | الحي `/en/` يطبع `hreflang="ar-SA"` و`x-default` لنفس `/en/`؛ الفحص المحلي: 21 خطأ | Google يتجاهل عنقود اللغات |
| P0 | فحص hreflang نفسه يفشل | `node scripts/hreflang-bidirectional-audit.mjs` → 14 missing-return + 7 canonical mismatch | بوابة الجودة غير خضراء |
| P0 | ترويسات الأمان المكتوبة ليست حية | 20 صفحة حية: لا `Content-Security-Policy` ولا `Strict-Transport-Security` ولا `X-Robots-Tag`؛ رغم وجودها في `render.yaml` | فرق deploy/config غير مقبول |
| P1 | sitemapين معلنين لنفس السطح | `public/robots.txt:132-134` يعلن `sitemap.xml` و`sitemap-index.xml`، والـ index يشير إلى sitemap نفسه | إشارة زائدة ومضللة |
| P1 | 11 URL بلا inbound links | 5 category pages + 6 `/solutions/cities/*` ما لها روابط داخلية في `dist/client` | صفحات يتيمة |
| P1 | محتوى ضعيف أو غير قابل للفهرسة | 36 صفحة تحت 600 كلمة؛ 13 noindex، منها design/offline/thank-you وredirect stubs | جودة وفهرسة غير متسقة |
| P1 | روابط كيان ميتة في schema | X وYouTube يعطون `404`; Crunchbase `403` وغير قابل للتأكيد | يضرب Entity trust |
| P1 | Clarity وBing verification غير مفعلة | `src/data/site.ts:31-37` كلها فارغة | قياس ونمو Bing ناقصان |

## أصل مشكلة الفهرسة

| السبب | الاحتمالية | الدليل |
|---|---:|---|
| نشر `dist/` كاملًا بدل سطح static المقصود | 90% | `/client/*` و`/frontend/server.js` حية؛ `scripts/sync-dist-flat.mjs:19-24` ينسخ `dist/client` داخل `dist` بدون تنظيف |
| hreflang غير صالح | 85% | 21 خطأ محلي + head حي لـ`/en/` |
| تضارب/ضعف إشارات sitemap | 65% | `robots.txt` يعلن sitemap وindex معًا؛ 180 URL في sitemap مقابل 194 صفحة HTML |
| ضعف الربط الداخلي للصفحات الطرفية | 60% | 11 orphan و19 غير قابلة للوصول من الرئيسية في الرسم المحلي |
| جودة/ثقة كيان ضعيفة | 55% | sameAs ميت، author pages وظيفية، بيانات GSC/backlinks غير متاحة |

ما أقدر أثبت أن “الرئيسية وحدها مفهرسة” بدون GSC. هذا `[DATA GAP]`، مو حقيقة مؤكدة.

## أدلة كود أساسية

- `astro.config.mjs:39-78` يحوّل CSS بعد البناء عبر regex ويحقن `/js/css-defer.js`.
- `astro.config.mjs:164-168` يضع `lastmod: new Date()` في sitemap integration.
- `scripts/sync-dist-flat.mjs:19-24,76-78` ينسخ assets وHTML من `dist/client` فوق `dist`.
- `src/layouts/BaseLayout.astro:111-117` يسمح `noindex` فقط لمسارات محددة.
- `src/layouts/BaseLayout.astro:173-184` يعتمد Google Fonts خارجيًا.
- `src/data/site.ts:31-37` يثبت غياب Clarity وBing/GSC verification.
- `scripts/axe-scan.mjs:28-42` يفحص 13 صفحة فقط، مو كامل الـ194.
- `scripts/axe-scan.mjs:111-119` يفشل على `critical` فقط؛ `serious` مجرد تحذير.

## التصميم والأداء والأمان

- نظام التوكنز موجود، لكن فيه ألوان خام مكررة كثيرة: `#22d3ee` 30 مرة، `#94a3b8` 14 مرة، وغيرها. التوحيد تقديريًا 62%.
- RTL جيد نسبيًا: 7 مخالفات physical properties فقط، لكن `MobileNav.astro` و`LeadForm.astro` فيها `left/right` صريحة، و`kernel/evidence.astro` يحتوي CSS داخل `srcdoc` مع `margin-left`.
- نتيجة axe الموجودة قديمة من 2026-07-19 و13 صفحة فقط؛ كانت صفر violations، لكنها ليست إثباتًا حاليًا أو شاملًا.
- TTFB للصفحة الرئيسية من 8 قياسات حية: `303–783ms`، متوسط تقريبي `452ms`. ما عندنا CrUX، فلا يوجد حكم ميداني على CWV.
- `perfCssDefer` حل هش: يعيد كتابة HTML بعد البناء ويزيد اعتماد الصفحة على JavaScript لتطبيق CSS. البديل الصحيح: Critical CSS محدود + CSS عادي من Astro، بدون mutation regex بعد build.
- API design عنده دفاعات جيدة مبدئيًا: Zod، CSRF، rate limiting، IP handling في `api/lead.ts:67-225`. لكن تسريب `frontend/server.js` يلغي أي ادعاء بأن سطح النشر مضبوط.

**أقسى حقيقة:** الموقع يبيع AI safety بينما deployment الحالي ينشر كود backend ونسخ HTML مكررة للعامة.

## P0 خلال 48 ساعة

1. منع نشر `/frontend/**` و`/client/**` على origin وCloudflare، ثم تحقق أن الثلاثة ترجع `404`: `/frontend/server.js`, `/client/index.html`, `/client/about/index.html`.
2. إلغاء `sync-dist-flat.mjs` من artifact المنشور أو اجعله CI-only خارج deploy artifact.
3. إصلاح `/en/` وكل counterparts من خريطة `hreflang-pairs.ts` ثم اجعل `hreflang-bidirectional-audit.mjs` أخضر.
4. اجعل headers الفعلية مطابقة لـ`render.yaml`: CSP، HSTS، `nosniff`, frame policy.
5. اجعل `robots.txt` يعلن sitemap canonical واحد فقط.

## P1 خلال أسبوعين

- ربط كل category/city page بمسار hub-and-spoke أو حذفها من sitemap إذا كانت redirect/noindex.
- اجعل axe يفشل عند `serious` أيضًا، ووسّع العينة إلى كل templates/routes.
- احذف/صحح `sameAs` الميتة، ولا تنشر customer case studies كأنها عملاء موثقون إذا كانت anonymized.
- استبدل Google Fonts باستضافة محلية، وأزل `perfCssDefer`.
- افصل `src/pages/api/ai/chat.ts` (52KB) إلى auth/rate-limit/provider/stream modules.

## P2 خلال 90 يوم

- صفحات مؤلفين بأشخاص حقيقيين وسير وروابط مهنية قابلة للتحقق.
- GBP فعلي وNAP متسق، لا geo meta عديم الأثر.
- clusters سعودية حول PDPL/NCA ECC/SDAIA/SAMA حسب نية البحث.
- LinkedIn كقناة demand-gen رئيسية، مع قياس leads لا مجرد pageviews.

## برومبتات MiniMax الذرّية

### PROMPT [ID: BAI-IDX-01] — منع أسطح النشر المكررة

**Priority:** P0 | **Est. effort:** 4h | **Expected impact:** +20% على Indexation  
**Depends on:** none | **Blocks:** BAI-IDX-02 | **Risk:** High

**CONTEXT**

Astro 6 hybrid app on Render. Production currently serves identical HTML under `/` and `/client/index.html`, plus backend source at `/frontend/server.js`. This is a deployment artifact exposure, not an SEO-only issue.

**FILES IN SCOPE**

- `scripts/sync-dist-flat.mjs`
- `render.yaml`
- deployment packaging configuration discovered during implementation

**MUST NOT TOUCH / PRESERVE**

- Keep `node ./dist/server/entry.mjs`.
- Preserve public canonical URLs with trailing slashes.
- Do not modify published Arabic content.

**TASK**

1. Make deploy artifact expose only intended static/public routes and SSR API routes.
2. Remove public reachability of `/client/**` and `/frontend/**`.
3. Add a deployment verification script.

**ACCEPTANCE CRITERIA**

- [ ] `curl -I https://brightai.site/client/index.html` returns `404`.
- [ ] `curl -I https://brightai.site/frontend/server.js` returns `404`.
- [ ] `curl -I https://brightai.site/` returns `200`.
- [ ] `pnpm run build` succeeds.

**ROLLBACK**

Revert the single PR commit and redeploy the previous artifact.

---

### PROMPT [ID: BAI-IDX-02] — إصلاح hreflang الثنائي

**Priority:** P0 | **Est. effort:** 5h | **Expected impact:** +16% على Indexation  
**Depends on:** BAI-IDX-01 | **Blocks:** BAI-IDX-03 | **Risk:** Medium

**FILES IN SCOPE**

- `src/data/hreflang-pairs.ts`
- `src/components/SEOHead.astro`
- `src/pages/en/index.astro`
- `scripts/hreflang-bidirectional-audit.mjs`

**TASK**

1. Make `/` and `/en/` reciprocal: AR page emits self `ar-SA`, counterpart `en-SA`, and one `x-default`.
2. Apply the same contract to every genuine AR/EN pair.
3. Extend the audit with a regression fixture for the exact broken `/en/` pattern.

**ACCEPTANCE CRITERIA**

- [ ] `node scripts/hreflang-bidirectional-audit.mjs` exits `0`.
- [ ] `/en/` contains self `en-SA` and an `ar-SA` alternate pointing to `/`.
- [ ] No AR-only page gets an invented English counterpart.

---

### PROMPT [ID: BAI-IDX-03] — توحيد sitemap وrobots

**Priority:** P0 | **Est. effort:** 3h | **Expected impact:** +8% على Indexation  
**Depends on:** BAI-IDX-02 | **Risk:** Medium

**FILES IN SCOPE**

- `public/robots.txt`
- `scripts/generate-sitemap-all-pages.mjs`
- `astro.config.mjs`

**TASK**

1. Define exactly one public sitemap contract.
2. Keep noindex/redirect/system routes out of sitemap.
3. Derive `lastmod` from content/git dates only; do not emit build date as page freshness.

**ACCEPTANCE CRITERIA**

- [ ] `robots.txt` has one canonical sitemap declaration.
- [ ] sitemap has zero `noindex` URLs.
- [ ] sitemap validation script exits `0`.

---

### PROMPT [ID: BAI-SEC-01] — إثبات headers الحية

**Priority:** P0 | **Est. effort:** 3h | **Expected impact:** +12% على Code & Security  
**Depends on:** BAI-IDX-01 | **Risk:** Medium

**FILES IN SCOPE**

- `render.yaml`
- `public/_headers`
- Cloudflare deployment configuration documentation
- new `scripts/verify-live-security-headers.mjs`

**TASK**

1. Identify the authoritative header layer.
2. Ensure CSP, HSTS, `X-Content-Type-Options`, frame policy, and referrer policy are emitted on production responses.
3. Add a read-only post-deploy check for representative routes.

**ACCEPTANCE CRITERIA**

- [ ] Production homepage returns CSP and HSTS.
- [ ] 20-route header sample passes.
- [ ] No reliance on comments/config that production ignores.

---

### PROMPT [ID: BAI-LINK-01] — معالجة orphan pages

**Priority:** P1 | **Est. effort:** 6h | **Expected impact:** +8% على Indexation  
**Depends on:** BAI-IDX-03 | **Risk:** Low

**FILES IN SCOPE**

- blog category route/template
- solution city route/template
- hub and navigation components
- internal-link audit script

**TASK**

Give every indexable URL at least one contextual inbound link from an indexable page. Keep redirect stubs out of the graph and sitemap.

**ACCEPTANCE CRITERIA**

- [ ] Zero indexable orphan pages.
- [ ] No indexable route has click depth over 3.
- [ ] `pnpm run internal-links:audit` reports no broken production links.

---

### PROMPT [ID: BAI-PERF-01] — إزالة CSS defer الهش

**Priority:** P1 | **Est. effort:** 8h | **Expected impact:** +12% على Performance  
**Depends on:** BAI-SEC-01 | **Risk:** High

**FILES IN SCOPE**

- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`
- critical CSS assets
- `public/js/css-defer.js`

**TASK**

Replace post-build HTML regex mutation with Astro-native critical CSS and normal stylesheet delivery. Preserve RTL and LCP styling.

**ACCEPTANCE CRITERIA**

- [ ] No post-build HTML regex rewrites stylesheet tags.
- [ ] No FOUC in desktop/mobile screenshot checks.
- [ ] CSP can remove script/style `unsafe-inline` where no longer needed.
- [ ] `pnpm run build` and performance checks pass.

---

### PROMPT [ID: BAI-MEAS-01] — قياس حقيقي لا وهمي

**Priority:** P1 | **Est. effort:** 5h | **Expected impact:** +10% على Saudi Visibility  
**Depends on:** BAI-SEC-01 | **Risk:** Low

**FILES IN SCOPE**

- `src/data/site.ts`
- analytics initialization
- GA4/GSC/Bing documentation
- dashboard/reporting configuration

**TASK**

Configure verified Clarity, GSC, and Bing Webmaster identifiers from owner-provided values. Track `lead_submit`, WhatsApp click, demo request, assessment completion, and source/country.

**ACCEPTANCE CRITERIA**

- [ ] No placeholder ID is treated as active.
- [ ] Events visible in GA4 DebugView.
- [ ] GSC and GA4 linkage documented and verified by owner.

## البيانات المطلوبة

- GSC: Pages coverage + Performance by query/page/country لآخر 3 أشهر.
- GA4: traffic by country/source, conversion events, landing pages.
- Cloudflare: Bot Fight Mode, WAF, cache rules, origin logs.
- Render: region, plan, cold-start/5xx logs.
- Bing Webmaster وbacklink export.
- إثبات GBP وNAP.
- CrUX/PageSpeed field data.

بدونها، أي claim عن ترتيب Google أو زيارات السعودية أو “Crawled, currently not indexed” يبقى تخمين.

ما تعدّل أي ملف في هالجولة. التغيير الموجود أصلًا في `b/prompt.md` بقي كما هو.