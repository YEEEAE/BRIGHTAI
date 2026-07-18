# تقرير BrightAI الشامل لتحسين SEO / AEO / GEO — السعودية 2026

> **تاريخ التدقيق:** 18 يوليو 2026
>
> **النطاق:** مستودع `YEEEAE/BRIGHTAI` — الفرع `main`
>
> **السوق الأساسي:** `ar-SA` مع دعم `en-SA`
>
> **المخرج المقصود:** ملف واحد يجمع الأدلة، النتائج، النسب، مصفوفة الصفحات، الفجوات، وترتيب التنفيذ مع 7 برومبتات تنفيذية.
>
> **مهم:** هذه درجات readiness هندسية مبنية على المستودع وليست بيانات ترتيب فعلية من Google Search Console أو ضمانًا للظهور في AI Overviews.

---

## 1. الملخص التنفيذي

### 1.1 النتيجة الإجمالية

**SEO / AEO / GEO Readiness Score: 72%**

| المحور | الوزن | الدرجة | المساهمة الموزونة | الحكم |
|---|---:|---:|---:|---|
| Technical SEO | 22% | 74% | 16.3 | جيد مع تعارضات تحقق |
| Content & Intent | 23% | 78% | 17.9 | قوي عربيًا، يحتاج ضبط cannibalization |
| On-Page SEO | 20% | 82% | 16.4 | طبقة metadata مركزية جيدة |
| Structured Data | 10% | 73% | 7.3 | أساس قوي مع تكرار ومزاعم تحتاج إثباتًا |
| Performance / CWV readiness | 10% | 55% | 5.5 | لا توجد قياسات field مؤكدة في هذا التدقيق |
| AI Search / GEO | 10% | 76% | 7.6 | crawler + llms قويان، passage design غير مكتمل |
| Images | 5% | 76% | 3.8 | لا توجد صور بلا `alt` في مسح صفحات Astro المباشر |
| **الإجمالي** | **100%** |  | **74.8 خام / 72 محافظ** | **قابل للتحسين السريع** |

تم اعتماد **72%** بدل 75% كدرجة محافظة بسبب ثلاثة قيود تحقق: عدم وجود build قابل للفحص في `dist/`، فشل أدوات schema/speakable لأنها تعتمد على build، وعدم وجود بيانات CrUX/GSC داخل المستودع.

### 1.2 أرقام المستودع الفعلية

| المؤشر | النتيجة | الدليل/الأمر |
|---|---:|---|
| ملفات صفحات Astro الثابتة/الديناميكية | 67 | `find src/pages -name '*.astro' | wc -l` |
| URLs داخل `public/sitemap.xml` | 176 | `grep -c '<loc>' public/sitemap.xml` |
| مقالات Blog | 57 | `find src/content/blog -name '*.md' | wc -l` |
| ملفات Docs | 41 | `find src/content/docs -name '*.md' | wc -l` |
| hreflang entries في sitemap | 366 | مسح `ar-SA|en-SA|x-default` |
| مراجع داخلية فحصها script | 581 | `scripts/internal-links-audit.mjs` |
| مراجع داخلية مصنفة | 96 | نفس التدقيق |
| أعطال أبلغ عنها مدقق الروابط | 81 | تحتاج إعادة تحقق بعد build |
| noindex text hits | 15 | 4 استعمالات صفحة فعلية والبقية تعليقات/حماية |
| صور Astro بلا `alt` مباشر | 0 | regex scan على `src/pages/**/*.astro` |
| `robots.txt` | موجود | `public/robots.txt` |
| `llms.txt` | موجود | `public/llms.txt` |
| `llms-full.txt` | موجود | `public/llms-full.txt` |
| `ai.txt` | موجود | `public/ai.txt` |
| schema master | موجود | `schema-saudi-seo.json` |

### 1.3 أعلى 10 نتائج

1. **طبقة meta مركزية قوية:** `SEOHead.astro` يخرج title وdescription وcanonical وOG وTwitter وhreflang وJSON-LD.
2. **تعارض خطير في سياسة indexability:** صفحات تمرر `robots="noindex"` لكن `SEOHead` يحوّله قسرًا إلى index؛ النية والمخرج مختلفان.
3. **sitemap أكبر من ملفات الصفحات لأن routes الديناميكية تتولد من collections:** هذا طبيعي جزئيًا، لكن لا توجد مطابقة مؤكدة مع build في التدقيق الحالي.
4. **hreflang واسع في sitemap لكنه غير متكافئ في الصفحات:** معظم الصفحات العربية P0 لا تملك peer إنجليزي، فتستخدم `ar-SA + x-default` فقط.
5. **الصفحة الرئيسية هي الأقوى AEO:** answer-first، FAQ schema، تعريف قابل للاقتباس، وhreflang ثلاثي.
6. **P0 الأخرى غير متسقة في TL;DR:** لا تستخدم contract ثابتًا مثل `<aside data-snippet="tl-dr">`.
7. **الـ schema الأساسي غني:** Organization وWebSite وSearchAction وLocalBusiness وSpeakable foundation موجودة.
8. **مزاعم `aggregateRating` تحتاج مصدرًا موثقًا:** `4.8/47` تظهر في homepage/kernel دون دليل مراجعات ظاهر في الأدلة المقروءة.
9. **GEO التقني قوي:** أغلب crawlers مسموحة وملفات llms غنية، لكن Wikidata/Wikipedia غير مثبتين.
10. **أكبر فرصة نمو:** تقليل التشابه بين blog/docs/hubs، وبناء answer blocks ومؤلفين ومصادر رسمية على صفحات P0.

---

## 2. المنهجية وحدود الثقة

### 2.1 ما تم فحصه فعليًا

- بنية `src/pages`, `src/content/blog`, `src/content/docs`.
- `SEOHead.astro`, layouts، schema foundation، وschema helpers.
- `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `ai.txt`.
- صفحات P0: `/`, `/services/`, `/assessment/ai-governance-readiness/`, `/pricing/`, `/kernel/`، وثلاث customer pages، sector templates، blog/docs templates.
- تشغيل الأدوات الموجودة:
  - `scripts/seo-health-check.mjs`
  - `scripts/seo-schema-audit.mjs`
  - `scripts/check-speakable-schema.mjs`
  - `scripts/internal-links-audit.mjs`
  - `scripts/internal-linking-architecture.mjs`

### 2.2 القيود

- `seo-health-check` لم يعمل لأن `dist/client/` أو build HTML غير موجود.
- `seo-schema-audit` أعاد `0 page(s)` للسبب نفسه؛ نجاح exit code لا يعني تغطية فعلية.
- `check-speakable-schema` وجد 0 صفحات مبنية وفشل شرط ≥30؛ هذه **مشكلة بيئة تحقق** وليست إثباتًا أن المصدر خالٍ من Speakable.
- internal-link scripts تعمل على inventory مختلف وبلغت 17 صفحة فقط في أحد المسارات؛ لذلك أرقام orphan/canonical الناتجة لا تُعمم على 176 URL.
- لا توجد بيانات GSC أو Bing Webmaster أو CrUX، لذلك لا تُذكر rankings أو impressions أو field CWV كحقائق.
- لا يوجد تصفح SERP مباشر ضمن هذا التقرير؛ تقييم المنافسين استراتيجي وليس benchmark رقميًا.

**درجة الثقة:** 88% للبنية المصدرية، 61% للمخرجات النهائية قبل build، 35% للأداء والترتيب الخارجي.

---

## 3. نتائج Technical SEO

### 3.1 Crawlability — 90%

**نقاط القوة**

- `public/robots.txt:8-10` يسمح بالوصول العام ويمنع `/api/` فقط.
- `public/robots.txt:15-67` يسمح صراحةً بـ `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `Google-Extended`, `ClaudeBot`, `PerplexityBot`, `Applebot` وغيرها.
- `public/robots.txt:99-102` يحتوي روابط HTTPS كاملة لأربعة مصادر discovery.
- المحتوى Astro يظهر في HTML ولا يعتمد على CSR للمحتوى الأساسي.

**المخاطر**

- السماح لكل crawlers التدريبية، ومنها `CCBot` و`Bytespider`، قرار ترخيص وليس SEO فقط؛ يجب توثيق policy في `ai.txt`.
- وجود `Host:` ليس directive قياسيًا لـ Google، لكنه غير ضار غالبًا.
- أربعة sitemaps/feed في robots تزيد احتمالية drift إذا لم تكن جميعها متاحة في الإنتاج.

### 3.2 Indexability — 63%

**التعارض الأهم:**

- `src/pages/thank-you/index.astro:17` يمرر `robots="noindex"`.
- `src/pages/customers/bank/index.astro:30`, `hospital:30`, `pharma:30` تمرر `noindex`.
- `src/components/SEOHead.astro:48-49` يحوّل أي `noindex` إلى `index, follow`.
- النتيجة: صفحات الشكر وصفحات العملاء تُفهرس رغم نية caller؛ لا يمكن الاعتماد على prop الحالي.

**الحكم:** P0. يجب اتخاذ قرار صريح: إما السماح الحقيقي بـ noindex للصفحات غير المرغوبة، أو حذف prop وتوثيق أن كل الصفحات indexable. الوضع الحالي يخلق false confidence.

### 3.3 Canonical وmetadata — 88%

- `SEOHead.astro:72-74` يخرج title/description/robots/canonical دائمًا.
- `SEOHead.astro:77-97` يغطي OG/Twitter كاملًا مع image alt.
- الصفحات P0 تمرر canonical مطلقًا.
- الخطر هو تكرار schema/metadata بين layout والصفحة وليس غياب meta.

### 3.4 Hreflang — 58%

| الفحص | النتيجة |
|---|---|
| الأكواد | صحيحة: `ar-SA`, `en-SA`, `x-default` |
| self-reference | موجود في الصفحات التي تمرر hreflang |
| `x-default` | يضاف آليًا عند وجود hreflang |
| reciprocity | مؤكدة فقط لبعض legal pairs والصفحة الرئيسية |
| parity | ضعيفة؛ غالبية الصفحات العربية بلا `/en/` peer حقيقي |
| sitemap alternates | 366 entry، لكن يلزم فحص full mesh بعد build |

`SEOHead.astro:57-67` يضيف `en-SA` فقط إذا كان المسار ضمن `LEGAL_I18N_PAIRS`. هذا أفضل من اختراع ترجمة، لكنه يعني أن target set الكامل غير متحقق على معظم URLs. لا يجب إضافة `/en/...` وهمية.

### 3.5 Sitemaps — 70%

- `public/sitemap.xml` يحتوي 176 `<loc>`.
- العدد 176 لا يساوي 67 ملف Astro لأن dynamic routes والـ collections تولد صفحات متعددة؛ الفرق ليس خطأ بذاته.
- لا يمكن تأكيد شرط “عدد URLs = HTML الحقيقي دون redirects” بلا `pnpm build`.
- يجب مقارنة sitemap مع `dist/client/**/*.html` ومع redirect sources في `render.yaml` داخل CI.

### 3.6 Security / Mobile / CWV

| المحور | الدرجة | الملاحظة |
|---|---:|---|
| HTTPS URLs | 100% | canonical/sitemap تستخدم HTTPS |
| SSR/static HTML | 95% | Astro يخرج HTML قابلًا للزحف |
| Mobile readiness | 80% | responsive layouts موجودة؛ لم ينفذ browser audit |
| LCP readiness | 55% | لا field data ولا Lighthouse حديث في التقرير |
| INP readiness | 60% | صفحات تسويقية غالبًا خفيفة، لكن forms/scripts تحتاج قياسًا |
| CLS readiness | 75% | الصور المقروءة تستخدم width/height؛ يلزم build/browser verification |

---

## 4. Structured Data Audit — 73%

### 4.1 ما هو موجود

- `Schema.astro:93-180`: `Organization` غني بـ address, contactPoint, areaServed, sameAs, knowsAbout, knowsLanguage.
- `Schema.astro:182-200`: `WebSite + SearchAction` موجود بالفعل.
- `Schema.astro:203-247`: `LocalBusiness/ProfessionalService` للرياض.
- Foundation `WebPage` يدعم Speakable عبر selectors.
- homepage: `SoftwareApplication`, FAQPage، DefinedTermSet.
- services: `Service + FAQPage + BreadcrumbList`.
- assessment: `WebPage + FAQPage + BreadcrumbList`؛ التعليق يقول HowTo لكن graph المقروء لا يتضمن HowTo.
- pricing: `WebPage + FAQPage + BreadcrumbList`.
- kernel: `SoftwareApplication + WebPage + FAQ + LocalBusiness`.
- solutions dynamic data تحتوي FAQPage.
- blog/docs layouts تحتوي author/article/how-to patterns بدرجات مختلفة.

### 4.2 الفجوات والمخاطر

1. **Duplicate entities:** kernel يكرر Organization/WebSite/LocalBusiness بدل الاعتماد على foundation، ما يزيد احتمال اختلاف قيم sameAs/description.
2. **AggregateRating:** القيم `4.8` و`47` في `index.astro:70-76` و`kernel/index.astro:71-77` يجب إثباتها بمراجعات مرئية ومصدر واضح أو حذفها.
3. **FAQ eligibility:** FAQPage مفيد للفهم الدلالي، لكن rich results التجارية ليست مضمونة؛ لا تبنِ KPI على ظهور FAQ snippets.
4. **Speakable verification:** source foundation موجود، لكن build audit لم يعمل.
5. **Event schema:** صفحات الأحداث موجودة، لكن يجب تأكيد `Event` fields كاملة: startDate, location/VirtualLocation, organizer, offers/status.
6. **Author entity:** يوجد `/authors/[slug]` ومؤلف واحد موثق في المصدر؛ 57 مقالًا تحتاج parity كاملة مع Person URLs.
7. **SearchAction:** موجود، لكن يجب التأكد أن `/search?q=` يعمل فعليًا؛ schema لا يكفي وحده.
8. **Wikidata:** لا يوجد `sameAs` واضح إلى Wikidata في Organization foundation.

---

## 5. AEO / GEO Audit

### 5.1 GEO Readiness — 76%

| السطح | الدرجة | السبب |
|---|---:|---|
| Google AI Overviews | 75% | SEO تقني جيد ومحتوى عربي غني، لكن answer blocks غير متسقة |
| ChatGPT browse/search | 82% | `OAI-SearchBot` و`ChatGPT-User` مسموحان وllms غني |
| Microsoft/Bing Copilot | 78% | Bingbot مسموح وIndexNow script موجود |
| Perplexity | 81% | crawler مسموح وllms ممتاز |
| Gemini grounding | 76% | Googlebot/Google-Extended مسموحان؛ authority الخارجية غير مثبتة |
| Apple Intelligence grounding | 71% | Applebot مسموح؛ لا قياس citations فعلي |

### 5.2 Crawler access

**مسموح بوضوح:** `GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `Google-Extended`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Applebot`, `Bingbot`, `Googlebot`.

**ملاحظة policy:** يجب فصل bots الخاصة بالبحث/grounding عن bots التدريبية في `ai.txt` بدل عبارة سماح عامة فقط.

### 5.3 llms.txt

**الدرجة: 92%**

- `llms.txt` منظم ويحتوي core pages, solutions, sectors, compliance, docs, blog pillars, key facts, query bank.
- `llms-full.txt` أعمق ويعرض entity/audience/cluster map.
- توجد نقطة عدم اتساق في LinkedIn: foundation يستخدم `linkedin.com/company/brightai-site` بينما `llms-full.txt:17` يذكر `linkedin.com/company/brightai`. يجب توحيد URL الموثق.
- البريد المنشور Gmail يقلل إشارة enterprise trust مقارنة ببريد domain.

### 5.4 Citability

| الإشارة | الوضع |
|---|---|
| Answer in first 40–60 words | موجود بوضوح في homepage، غير ثابت في بقية P0 |
| Question headings | جيد في FAQ/blog/docs |
| Self-contained 134–167-word passages | غير منهجي |
| Pull quotes | موجودة في customer stories، لكنها مجهولة المصدر بالاسم |
| Sources to regulators | موجودة موضوعيًا؛ يلزم تدقيق الروابط والاقتباسات لكل claim |
| Author credentials | author route موجود، التغطية غير مؤكدة لكل المقالات |
| Comparison tables | موجودة في بعض المقالات؛ غير ثابتة في P0 |
| External entity signals | LinkedIn/X/YouTube/GitHub؛ Wikipedia/Wikidata غير مثبتين |

---

## 6. مصفوفة نية الصفحات وSERP KSA

> `KSA fit` تقدير 0–1 لملاءمة intent للسوق السعودي بناءً على العنوان والمحتوى والكيانات التنظيمية.

| Route/Template | Intent | SERP target | KSA fit | الحكم | السبب |
|---|---|---|---:|---|---|
| `/` | Commercial investigation | AI Overview + PAA | 1.00 | Winner Defensible | تعريف واضح + FAQ + entity schema |
| `/services/` | Transactional | PAA + organic | 0.95 | Quick Win | intent قوي؛ يحتاج TL;DR ثابت |
| `/assessment/ai-governance-readiness/` | Transactional | Featured snippet + PAA | 0.98 | Quick Win | lead magnet واضح؛ FAQ 3 فقط |
| `/pricing/` | Commercial | PAA + snippets | 0.90 | Quick Win | تسعير صريح، يحتاج comparison answer block |
| `/kernel/` | Commercial investigation | AI Overview + image/video | 0.92 | Winner Defensible | product entity غني؛ schema مكرر |
| `/solutions/[slug]/` | Commercial | PAA | 0.92 | Winner Defensible | FAQ وintent solution واضح |
| `/solutions/[sector]/` | Commercial | Local/industry SERP | 0.98 | Winner Defensible | sector + regulator fit |
| `/solutions/[sector]/[city]/` | Transactional local | Local organic | 1.00 | Quick Win | city intent مباشر؛ خطر doorway duplication |
| `/customers/bank/` | Commercial proof | Organic | 0.88 | Quick Win | quote/use case؛ noindex contract متعارض |
| `/customers/hospital/` | Commercial proof | Organic | 0.88 | Quick Win | social proof؛ quote غير مسمى |
| `/customers/pharma/` | Commercial proof | Organic | 0.88 | Quick Win | SFDA fit؛ noindex contract متعارض |
| `/hub/[slug]/` | Informational hub | AI Overview + PAA | 0.95 | Cannibalization Risk | يتقاطع مع blog/docs |
| `/blog/[...slug]/` | Informational | Featured snippet + AIO | 0.95 | Cannibalization Risk | 57 مقالًا حول clusters متقاربة |
| `/docs/[...slug]/` | Informational/how-to | HowTo + PAA | 0.95 | Cannibalization Risk | يتقاطع مع blog pillar pages |
| `/authors/[slug]/` | Navigational/entity | Knowledge/entity | 0.70 | Quick Win | يبني E-E-A-T؛ مؤلف واحد فقط |
| `/events/*` | Transactional/event | Event SERP | 0.90 | Quick Win | يحتاج Event completeness |
| `/en/` | Navigational/commercial | English KSA organic | 0.75 | Orphan/Parity Risk | التغطية الإنجليزية محدودة جدًا |
| `/thank-you/` | Navigational utility | لا يستهدف SERP | 0.10 | Indexation Risk | يجب أن يكون noindex فعليًا |

---

## 7. Cannibalization Map

| Cluster | الصفحات المتنافسة المحتملة | المخاطرة | التوجيه |
|---|---|---:|---|
| حوكمة AI السعودية | `/`, `/hub/ai-governance/`, `/blog/ai-governance-saudi-arabia/`, `/docs/ai-governance-saudi-arabia/`, `/blog/what-is-ai-governance-saudi-companies/` | عالية | الصفحة الرئيسية commercial، hub للتنقل، blog pillar للتفسير، docs للتطبيق؛ anchors/canonicals تعكس ذلك |
| PDPL + AI | عدة blog posts + `/docs/pdpl-ai-complete-guide/` + `/pdpl-statement/` | عالية | فصل legal statement عن guide وعن use-case articles |
| NCA ECC + AI | blog guide + docs guide + controls + mapping | عالية | صفحة controls مرجع، mapping أداة، blog شرح تنفيذي |
| AI Audit Trail | solution + docs + blog articles + kernel | متوسطة | solution للبيع، docs للتنفيذ، kernel للواجهة، blog للتوعية |
| AI Firewall | solution + docs + blog + kernel chat | متوسطة | تثبيت primary keyword مختلف لكل route |
| أفضل منصات/شركات AI | مقالتا best-* | متوسطة | فصل vendor category عن governance platforms |
| Sector + City | sector page + city child pages | عالية | city pages يجب أن تضيف أدلة محلية لا تبديل اسم المدينة فقط |
| Pricing/Cost | `/pricing/` + `ai-implementation-cost-saudi` | متوسطة | pricing brand intent، المقال market education |

### قواعد منع cannibalization

1. Keyword أساسي واحد لكل URL.
2. عدم استخدام canonical لإخفاء intent conflict؛ أصلح intent والمحتوى والروابط.
3. hub يربط للـ pillar ولا يعيد نصه.
4. docs تستخدم HowTo/implementation vocabulary؛ blog يستخدم explanatory/current analysis.
5. solution تستخدم buyer/problem/outcome vocabulary.
6. city page لا تُنشر إذا لم تملك عنصرًا محليًا فريدًا ومثبتًا.

---

## 8. AEO Gap Matrix للصفحات P0

**تعريف flags:** G1 لا TL;DR ≤60 كلمة، G2 لا FAQ ≥5، G3 Speakable غير مؤكد، G4 لا مقارنة، G5 لا pull quote قابل للاقتباس، G6 لا author bio linked.

| الصفحة | G1 | G2 | G3 | G4 | G5 | G6 | Completion |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 0 | 0 | 1 | 1 | 1 | 1 | 50% |
| `/services/` | 1 | 0 | 1 | 1 | 1 | 1 | 17% |
| `/assessment/.../` | 1 | 1 | 1 | 1 | 1 | 1 | 0% |
| `/pricing/` | 1 | 0 | 1 | 1 | 1 | 1 | 17% |
| `/kernel/` | 1 | 0 | 1 | 1 | 1 | 1 | 17% |
| `/customers/bank/` | 1 | 1 | 1 | 1 | 0 | 1 | 17% |
| `/customers/hospital/` | 1 | 1 | 1 | 1 | 0 | 1 | 17% |
| `/customers/pharma/` | 1 | 1 | 1 | 1 | 0 | 1 | 17% |
| Sector template | 1 | 0 | 1 | 1 | 1 | 1 | 17% |
| City template | 1 | متغير | 1 | 1 | 1 | 1 | ≤17% |
| Blog template | متغير | متغير | 1 | متغير | متغير | 0 | ~45% |
| Docs template | متغير | متغير | 1 | متغير | 1 | متغير | ~35% |

**ملاحظة:** G3 يعني عدم نجاح التحقق المبني، لا غياب source support. لا ينبغي إضافة Speakable عشوائيًا؛ selector يجب أن يشير إلى نص مرئي فعلي.

---

## 9. أعلى 15 مشكلة مرتبة

| # | المشكلة | الأولوية | الأثر | السهولة | الدليل |
|---:|---|---|---:|---:|---|
| 1 | noindex prop يُلغى قسرًا | P0 | 10 | 8 | `SEOHead.astro:48-49` + customer/thank-you callers |
| 2 | لا يوجد build artifact للتحقق SEO | P0 | 9 | 8 | scripts تفشل/تفحص 0 صفحات |
| 3 | 81 broken-reference findings أولية | P0 | 9 | 5 | internal-links audit؛ يحتاج build validation |
| 4 | hreflang parity محدودة | P0 | 8 | 5 | P0 العربية غالبًا `ar-SA+x-default` فقط |
| 5 | aggregateRating غير مثبت | P0 | 8 | 8 | homepage/kernel schema |
| 6 | AEO TL;DR contract غير مطبق على P0 | P1 | 8 | 7 | لا `data-snippet="tl-dr"` |
| 7 | cannibalization في governance/PDPL/NCA | P1 | 9 | 4 | blog/docs/hub routes متعددة |
| 8 | Speakable CI غير قابل للعمل دون build | P1 | 7 | 7 | found 0 مقابل threshold 30 |
| 9 | Organization/schema duplication | P1 | 7 | 6 | kernel graph مقابل foundation |
| 10 | customer stories مجهولة المصدر | P1 | 7 | 4 | quotes بأدوار عامة فقط |
| 11 | author/entity coverage غير كاملة | P1 | 7 | 5 | route لمؤلف واحد مقابل 57 مقالًا |
| 12 | city pages معرضة لتشابه doorway | P1 | 8 | 4 | dynamic sector/city template |
| 13 | LinkedIn entity URL غير متسق | P1 | 6 | 9 | schema مقابل llms-full |
| 14 | SearchAction يحتاج endpoint فعلي | P2 | 5 | 7 | urlTemplate `/search?q=` |
| 15 | غياب field CWV evidence | P2 | 6 | 5 | لا CrUX/GSC في المستودع |

---

## 10. Quick Wins خلال أول دورة

1. إصلاح contract الخاص بـ noindex مع اختبار HTML فعلي.
2. تشغيل build قبل جميع SEO audit scripts وإفشال CI عند 0 صفحات.
3. إزالة/إثبات AggregateRating.
4. توحيد LinkedIn URL عبر schema وllms.
5. إضافة `<aside data-snippet="tl-dr">` فقط إلى صفحات P0 ذات النص الموجود، دون اختراع claims.
6. رفع FAQ assessment من 3 إلى 5 أسئلة فعلية، أو عدم ادعاء شرط ≥5.
7. إخراج قائمة broken links مع source/target ثم إصلاح المؤكد فقط.
8. إنشاء matrix ثابتة للـ ar/en peers وعدم توليد hreflang لصفحة غير موجودة.
9. تثبيت primary intent لـ governance/PDPL/NCA clusters.
10. ربط كل BlogPosting بـ `/authors/[slug]/` فعلي ومؤلف موثق.

---

# 11. البرومبتات التنفيذية المصغرة

## S1 — Meta Layer Only Sweep

```text
الرجاء استخدام Sequential Thinking أولًا.

أنت minimax code m3 داخل مستودع BrightAI Astro. نفّذ BAI-SEO-003-S1: تدقيق وإصلاح طبقة metadata فقط لكل صفحة قابلة للفهرسة.

الهدف:
ضمان title وdescription وcanonical وrobots وOG/Twitter وhreflang الصحيح في HTML النهائي، دون لمس محتوى <body>.

ابدأ بـ:
1) pnpm build
2) افحص dist/client/**/*.html وليس source فقط.
3) أنشئ inventory داخليًا يربط HTML النهائي بملف المصدر.

قواعد التنفيذ:
- عدّل فقط frontmatter/layout/SEOHead أو data metadata اللازمة.
- ممنوع تعديل أي نص داخل <body>.
- لا تضف hreflang لصفحة peer غير موجودة فعليًا.
- أصلح تعارض noindex: يجب أن تبقى /thank-you/ غير قابلة للفهرسة، واتخذ قرارًا موثقًا لصفحات customers بدل إسقاط prop بصمت.
- canonical مطلق HTTPS ومتسق trailing slash.
- title فريد؛ description فريد وغير فارغ.
- لا حذف صفحة، لا redirect، لا duplicate route.
- لا تغيّر schema خارج ما يلزم لمنع تضارب metadata.

اختبار القبول:
بعد pnpm build، يجب أن ينجح script يفحص كل HTML مفهرس ويحقق 0 missing title/description/canonical و0 canonical duplicates غير مقصودة و0 noindex-contract mismatch.

شغّل:
pnpm build
node scripts/seo-health-check.mjs
pnpm seo:gate

وثّق الملفات والنتائج والأعداد في worklog.md تحت BAI-SEO-003-S1.
```

## S2 — Hreflang Bidirectional Audit

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S2: بناء تدقيق hreflang ثنائي الاتجاه لـ ar-SA وen-SA وx-default في BrightAI.

المطلوب:
- استخرج routes من HTML المبني وpublic/sitemap.xml.
- كوّن explicit pair map بدل اشتقاق /en/ تلقائيًا.
- لكل pair حقيقي: self-reference + return tag + x-default في <head> وفي sitemap.
- canonical يجب أن يطابق self hreflang حرفيًا.
- لا تضف en-SA لأي صفحة إنجليزية غير موجودة.
- legal pairs الحالية تبقى صحيحة.
- إذا كانت الصفحة عربية فقط، استخدم ar-SA وx-default ولا تخترع peer.
- لا حذف، لا redirect، لا duplicate route.

اختبار القبول:
0 missing return tags و0 hreflang URLs تعيد non-200 و0 canonical/hreflang mismatch بعد pnpm build.

أضف/حدّث اختبارًا آليًا يقرأ dist/client وsitemap ويخرج عدد sets والأخطاء. شغّل الاختبار وpnpm seo:gate.

وثّق التنفيذ في worklog.md تحت BAI-SEO-003-S2.
```

## S3 — Schema KSA Enrichment and De-duplication

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S3: إثراء وتوحيد JSON-LD السعودي دون تكرار entities أو اختراع claims.

مصادر الحقيقة:
- src/components/seo/Schema.astro
- src/data/schema-helpers.ts
- schema-saudi-seo.json
- layouts والـ collection schemas

المطلوب:
1) Organization: addressCountry=SA، areaServed، knowsLanguage=["ar-SA","en-SA"]، sameAs موحد وموثق.
2) WebSite + SearchAction: أبقه فقط إذا كان /search?q= يعمل فعليًا؛ وإلا أصلح endpoint أو أزل SearchAction.
3) SpeakableSpecification: على / و/services/ و/assessment/ و/pricing/ و/kernel/ باستخدام selectors تطابق نصًا مرئيًا فعليًا.
4) FAQPage: لا تضف FAQ مخفية. استخدم ≥5 فقط حين توجد 5 Q/A مرئية ومفيدة.
5) Docs: HowTo أو TechArticle وفق طبيعة الصفحة، لا النوعين بلا مبرر.
6) Blog: Article/BlogPosting مع author @id يربط إلى /authors/[slug]/ الموثق.
7) Events: Event كامل للصفحات الثلاث مع startDate/location/eventStatus/organizer/offers عند توفر بيانات مؤكدة.
8) أزل entity duplication في kernel والحالات الأخرى واعتمد @id موحدًا.
9) AggregateRating 4.8/47: أثبته بمراجعات مرئية ومصدر، وإلا احذفه.
10) لا تغيّر النص المرئي إلا إذا كان schema يتطلب parity معه.

قيود:
- لا fabricated ratings، أسماء عملاء، شهادات، تواريخ، مواقع أو اعتمادات.
- لا حذف صفحات، لا redirects، لا duplicate JSON-LD nodes بنفس @id.

اختبار القبول:
بعد pnpm build: seo-schema-audit يفحص >0 صفحة ويمر بلا errors، وcheck-speakable-schema يمر، و0 duplicate @id داخل الصفحة.

شغّل:
pnpm build
pnpm seo:schema
pnpm seo:gate

وثّق في worklog.md تحت BAI-SEO-003-S3.
```

## S4 — llms.txt and AI Policy Alignment

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S4: مزامنة public/llms.txt وpublic/llms-full.txt وpublic/ai.txt وpublic/robots.txt مع استراتيجية AI search الخاصة بـ BrightAI.

المطلوب:
- تحقق أن كل URL منشور في llms files موجود ويعيد 200 وغير redirect.
- وحّد entity facts: LinkedIn/X/YouTube/GitHub، العنوان، الهاتف، الاسم القانوني، سنة التأسيس.
- افصل في ai.txt بين search/grounding crawlers وtraining crawlers.
- حافظ على السماح لـ OAI-SearchBot وChatGPT-User وPerplexityBot وClaudeBot وGooglebot وBingbot وApplebot إذا كان الهدف الظهور في answer engines.
- Google-Extended policy يجب أن توضح أنه متعلق باستخدام Gemini training وليس Google Search indexing.
- لا تكتب ادعاءات ترتيب أو اعتماد أو عملاء غير موثقين.
- اختصر llms.txt ليكون index عالي الإشارة، واترك التفاصيل في llms-full.txt.
- لا حذف صفحات، لا redirects.

اختبار القبول:
0 broken URLs في llms.txt وllms-full.txt، و0 اختلافات entity facts بين schema foundation وملفات llms/ai.

أضف validation script مناسب وشغله بعد pnpm build. وثّق في worklog.md تحت BAI-SEO-003-S4.
```

## S5 — Internal Linking Cluster Builder

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S5: بناء وتحسين 5 topical clusters باستخدام صفحات موجودة فقط:
1) حوكمة AI
2) تقييم الجاهزية
3) PDPL
4) NCA ECC
5) ROI AI

قبل التعديل:
- شغّل pnpm build.
- شغّل scripts/internal-links-audit.mjs وscripts/internal-linking-architecture.mjs.
- لا تعتبر output صحيحًا إذا فحص 0 indexable pages؛ أصلح مدخل script أولًا.

قواعد الربط:
- حدّد pillar واحدًا لكل cluster.
- كل spoke يربط للـ pillar، والـ pillar يربط لأهم spokes.
- استخدم anchors وصفية موجودة أو تعديلًا طفيفًا غير مزعج؛ لا keyword stuffing.
- فرّق intent بين blog/docs/hub/solution.
- لا تضف sections جديدة؛ أضف الروابط داخل sections موجودة فقط.
- لا تربط إلى redirect أو route غير موجود.
- لا حذف، لا duplicate page، لا redirect.

اختبار القبول:
0 broken internal links المؤكدة بعد build، و0 orphan P0 pages، وكل cluster له pillar مع ≥3 spokes وروابط عودة.

وثّق before/after counts في worklog.md تحت BAI-SEO-003-S5.
```

## S6 — City Solution Page AEO

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S6 على template /solutions/[sector]/[city] فقط لتحسين نية "حوكمة AI في {city} السعودية" دون إنشاء صفحات جديدة أو doorway pages.

المطلوب:
- افحص كل city route المبني وقارن النصوص لاكتشاف التشابه.
- أضف answer-first ≤60 كلمة داخل hero/intro الموجود، وليس section جديدة.
- يجب أن يشرح النص القطاع + المدينة + المشكلة التنظيمية/التشغيلية دون حشو.
- احتفظ فقط بالحقائق المحلية القابلة للإثبات؛ لا تدّع وجود مكتب أو عميل أو شراكة في مدينة دون دليل.
- اجعل كل صفحة مميزة فعليًا في intent والأمثلة والجهات التنظيمية ذات الصلة.
- حافظ على LocalBusiness فقط عندما تمثل موقعًا تجاريًا حقيقيًا؛ service area ليست فرعًا.
- لا duplicate content، لا حذف، لا redirect، لا صفحات جديدة.

اختبار القبول:
كل city page تحتوي answer block ≤60 كلمة، canonical صحيح، LocalBusiness غير مضلل، وتشابه body النصي بين city pages أقل من threshold يحدده الاختبار مع تقرير واضح.

شغّل pnpm build وpnpm seo:gate، ووثّق في worklog.md تحت BAI-SEO-003-S6.
```

## S7 — AI Overview Snippet Pack

```text
الرجاء استخدام Sequential Thinking أولًا.

نفّذ BAI-SEO-003-S7: إضافة snippet pack للصفحات P0 التالية دون تغيير التصميم أو إنشاء sections جديدة:
/, /services/, /assessment/ai-governance-readiness/, /pricing/, /kernel/,
/customers/bank/, /customers/hospital/, /customers/pharma/,
وثلاث صفحات sector رئيسية، وأول blog pillar، وأول docs pillar المعتمدين في sitemap.

التنفيذ:
- داخل hero أو intro موجود، أضف/حوّل فقرة إلى:
  <aside data-snippet="tl-dr" aria-label="الخلاصة">...</aside>
- النص ≤60 كلمة عربية فصيحة واضحة، answer-first، self-contained.
- لا claims جديدة، لا إحصاءات بلا مصدر، لا وعود امتثال قانوني.
- اربط Speakable cssSelector بهذا العنصر عبر contract مركزي.
- لا تكرر H1 أو FAQ أو فقرة موجودة.
- لا تغيّر CTA أو layout أو CSS إلا الحد الأدنى اللازم للمحافظة على المظهر.
- لا حذف، لا redirect، لا duplicate route.

اختبار القبول:
12/12 صفحة P0 تحتوي عنصر data-snippet="tl-dr" واحدًا فقط، كل نص ≤60 كلمة، وكل Speakable selector يطابق عنصرًا مرئيًا في HTML المبني.

شغّل:
pnpm build
node scripts/check-speakable-schema.mjs
pnpm seo:gate

وثّق page-by-page word counts في worklog.md تحت BAI-SEO-003-S7.
```

---

## 12. ترتيب التنفيذ الموصى به

| الترتيب | البرومبت | السبب | الاعتماد |
|---:|---|---|---|
| 1 | S1 Meta Layer | يصلح indexability ويثبت metadata contract | لا شيء |
| 2 | S2 Hreflang | يحتاج canonicals مستقرة من S1 | S1 |
| 3 | S3 Schema | يزيل claims/duplicates قبل AEO markup | S1 |
| 4 | S4 AI Policy | يوحد entity facts بعد schema | S3 |
| 5 | S5 Internal Links | يبني graph على routes وcanonicals مستقرة | S1,S2 |
| 6 | S6 City AEO | يعالج local duplication بعد cluster rules | S5 |
| 7 | S7 Snippet Pack | آخر طبقة محتوى بعد schema وSpeakable | S3,S5,S6 |

### بوابات القبول النهائية

- `pnpm build` ينجح.
- `seo-health-check` يفحص >0 صفحة؛ 0 pages = فشل وليس نجاحًا.
- `seo-schema-audit` يفحص >0 صفحة.
- `check-speakable-schema` يمر.
- 0 canonical/hreflang reciprocity errors.
- 0 broken links مؤكدة في HTML المبني.
- 0 accidental indexation لصفحات utility.
- 0 fabricated claims أو ratings أو customer identities.
- لا route جديد ولا redirect ولا حذف إلا بموافقة مستقلة.

---

## 13. KPI Dashboard بعد التنفيذ

| KPI | Baseline الحالي | الهدف بعد S1–S7 |
|---|---:|---:|
| SEO readiness | 72% | ≥90% |
| Metadata coverage في HTML المبني | غير متحقق | 100% |
| Hreflang valid sets | غير مؤكد | 100% من pairs الحقيقية |
| Schema audit pages | 0 بسبب غياب build | >0 وكل الصفحات المستهدفة |
| Speakable verified pages | 0 بسبب غياب build | ≥30 أو threshold موثق صحيح |
| P0 TL;DR coverage | 1/12 تقريبًا | 12/12 |
| P0 FAQ ≥5 | غير مكتمل | فقط الصفحات المناسبة، دون hidden FAQ |
| Broken internal links | 81 findings أولية | 0 confirmed broken links |
| Orphan P0 pages | غير موثوق | 0 |
| Entity fact conflicts | ≥1 LinkedIn conflict | 0 |
| Unsupported rating claims | 2 surfaces | 0 |
| Author-linked BlogPosting | غير مؤكد | 100% من المقالات المنشورة |

---

## الخلاصة

BrightAI يملك أساسًا متقدمًا مقارنة بموقع تسويقي عادي: Astro static HTML، metadata مركزية، schema سعودي غني، sitemap كبيرة، ملفات llms قوية، وسماح واضح لمحركات البحث التقليدية ومحركات الإجابة. العائق ليس غياب SEO، بل **عدم اتساق طبقات التحقق**: noindex لا يعمل كما يوحي caller، scripts تعتمد على build غير موجود، hreflang محدود بالترجمات الحقيقية، وAEO غير موحد خارج الصفحة الرئيسية.

الترتيب الصحيح هو تثبيت صحة الفهرسة والـ build أولًا، ثم hreflang وschema والكيان، ثم الروابط الداخلية والصفحات المحلية، وأخيرًا answer snippets. تنفيذ S1–S7 بهذا الترتيب يحول المشروع من readiness جيدة إلى منظومة SEO/AEO قابلة للقياس دون إنشاء صفحات وهمية أو ادعاءات غير موثقة.
