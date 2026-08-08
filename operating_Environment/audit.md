# تقرير تدقيق BrightAI — 2026-08-08

- **الموقع:** https://brightai.site
- **الفرع:** `brightai-audit`
- **البناء المفحوص:** `dist/client/` — 275 ملف HTML، 251 رابط في `sitemap.xml`
- **نوع التدقيق:** تدقيق شامل قائم على الأدلة (زحف حقيقي + سكربتات المشروع + بناء إنتاجي)
- **ملف البرومبتات المرافق:** `2026-08-08-brightai-audit-prompts-en.md`

> **ملاحظة على المنهجية:** كل رقم في هذا التقرير مأخوذ من تنفيذ فعلي — إما `curl` على الموقع الحقيقي، أو سكربت من `scripts/`، أو تحليل مباشر لملفات `dist/client/`. ما فيه ولا تقدير ولا تخمين. كل بند فيه سطر "الدليل" يقدر أي أحد يعيد تشغيله ويشوف نفس النتيجة.

---

## 0) الملخص التنفيذي

الخبر الزين: البنية التقنية للسيو عندنا **قوية جدًا** على مستوى الكود. hreflang صفر أخطاء على 259 مجموعة، canonical موجود في 275 صفحة، صفر روابط مكسورة في البناء، JSON-LD في 268 صفحة، وبوابة `seo-ci-check` تعدي نظيفة.

الخبر السيّئ — وهو اللي يلغي كل اللي فوق: **الموقع الحقيقي يرجّع 403 لكل بوتات محركات البحث ومحركات الذكاء الاصطناعي.** Googlebot، Bingbot، GPTBot، OAI-SearchBot، PerplexityBot، ClaudeBot — كلهم محجوبين على مستوى Cloudflare. يعني كل الشغل الهندسي الممتاز اللي داخل الكود ما يوصل لجوجل أصلًا.

ثاني أكبر مشكلة: **ميزانية JS متجاوزة 5.5 مرة** (330 ك.ب مضغوط مقابل حد 60 ك.ب)، وهذا انعكس مباشرة على Lighthouse — الصفحة الرئيسية عندها perf **29/100** مع LCP 4.1 ثانية و CLS 0.168.

### لوحة الحالة

| المحور | الحالة | الرقم |
|---|---|---|
| وصول البوتات للموقع الحقيقي | ❌ حرج | 403 لكل البوتات المفحوصة (7/7) |
| ميزانية الأداء | ❌ فشل | 329.99 ك.ب JS مقابل حد 60 ك.ب |
| Lighthouse — الرئيسية | ❌ فشل | perf 29 / LCP 4.1s / CLS 0.168 / TBT 740ms |
| صفحات يتيمة (BAI-IDX-04) | ❌ فشل | 22 صفحة غير قابلة للوصول من `/` |
| عمق النقرات | ✅ ناجح | أقصى عمق 3 (الحد 3) |
| hreflang ثنائي الاتجاه | ✅ ناجح | 259 مجموعة، 0 خطأ |
| بوابة `seo-ci-check` | ✅ ناجح | 0 أخطاء، 0 تحذيرات |
| روابط مكسورة في البناء | ✅ ناجح | 0 من 48,690 مرجع |
| canonical / title / desc / H1 | ✅ ناجح | 275 صفحة مكتملة |
| مقالات المدونة (1200 كلمة) | ✅ ناجح | كل مقالات `blog/` تعدّي الحد |
| ملفات `docs/` (1200 كلمة) | ❌ فشل | 24 ملف تحت الحد |
| Schema — HowTo / Dataset | ⚠️ ناقص | 0 و 0 |
| a11y (Lighthouse) | ✅ زين | 96–97 على كل الصفحات المقيسة |

**التقدير الإجمالي:** الكود 8.5/10. الإنتاج الفعلي 3/10 — بسبب حجب البوتات.

---

## 1) المشاكل الحرجة (P0) — توقف كل شي وسوّها الحين

### P0-01 — Cloudflare يحجب كل بوتات البحث والـ AI بـ 403

هذي أخطر مشكلة في الموقع كله، ولو ما تصلّحت فباقي التقرير ما له قيمة عملية.

**الدليل — طلبات حقيقية على الإنتاج:**

```
curl -A "<UA>" -o /dev/null -w "%{http_code}" https://brightai.site/

curl-default      403   (5212 bytes)
Googlebot         403   (5382 bytes)
GPTBot            403   (5468 bytes)
OAI-SearchBot     403   (5489 bytes)
PerplexityBot     403   (5404 bytes)
ClaudeBot         403   (5361 bytes)
Bingbot           403   (5382 bytes)
Chrome-desktop    200   (189963 bytes)   ← المتصفح العادي بس
```

**وأخطر من كذا — `sitemap.xml` نفسه محجوب:**

```
https://brightai.site/            403
https://brightai.site/en/         403
https://brightai.site/pricing/    403
https://brightai.site/blog/       403
https://brightai.site/sitemap.xml 403   ← جوجل ما يقدر يقرأ الخريطة
https://brightai.site/robots.txt  200   ← يعدّي (ملف ثابت)
https://brightai.site/llms.txt    200   ← يعدّي (ملف ثابت)
```

**وش يعني هذا فعليًا:**

- جوجل يقرأ `robots.txt` (200) ويلقى فيه `Sitemap:` — يمشي للخريطة — يتلقّى 403. صفر اكتشاف.
- كل الـ 251 رابط في الخريطة غير قابلة للزحف من ناحية جوجل.
- الـ 268 صفحة اللي فيها JSON-LD — ولا واحدة منها تقدر تدخل فهرس جوجل من هذي المسارات.
- كل شغل GEO (llms.txt بـ 153 سطر، llms-full.txt بـ 372 سطر، ai.txt بـ 195 سطر، speakable على 262 صفحة) **ملغى تمامًا** لأن GPTBot و OAI-SearchBot و PerplexityBot و ClaudeBot كلهم 403.
- ملاحظة مهمة: `x-robots-tag: index, follow` موجود في الاستجابة الناجحة، يعني نية الفهرسة صحيحة — المشكلة مو في الكود، المشكلة في طبقة الحماية على الحافة.

**السبب المرجّح:** إعداد Bot Fight Mode أو WAF managed rule أو Security Level مرتفع في Cloudflare اللي قدّام خدمة Render. الملفات الثابتة (`robots.txt`, `llms.txt`) تعدّي لأنها تُخدم من كاش الحافة، بينما مسارات HTML تروح للأصل وتتعرض للقاعدة.

**التأثير:** فقدان كامل للحضور العضوي وحضور الذكاء الاصطناعي. هذي مو "تحسين سيو" — هذي عطل إنتاجي.

**الإصلاح:** BAI-P0-01 في ملف البرومبتات.

**التحقق بعد الإصلاح:**
```bash
for ua in "Googlebot/2.1" "GPTBot/1.1" "PerplexityBot/1.0" "ClaudeBot/1.0" "bingbot/2.0"; do
  curl -sS -o /dev/null -w "$ua %{http_code}\n" -A "Mozilla/5.0 (compatible; $ua)" https://brightai.site/
done
curl -sS -o /dev/null -w "sitemap %{http_code}\n" -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://brightai.site/sitemap.xml
```
لازم كلها 200.

---

### P0-02 — ميزانية JS متجاوزة 5.5×

**الدليل — `node scripts/check-performance-budget.js`:**

```
│ dist/client/index.html (gzipped)     │  36.74 ك.ب │  80.00 ك.ب │ ✅ OK
│ أكبر ملف CSS (KernelLayout)          │  19.88 ك.ب │  50.00 ك.ب │ ✅ OK
│ إجمالي JS في _astro (11 ملف)         │ 329.99 ك.ب │  60.00 ك.ب │ ❌ FAIL  (+269.99)
```

**تفصيل الملفات (مضغوط):**

| الملف | الحجم | التعليق |
|---|---:|---|
| `index.C28niuCj.js` | 175.83 ك.ب | المتهم الأول — حزمة واحدة ضخمة |
| `pdf.BRz36HYW.js` | 125.89 ك.ب | مكتبة PDF — تُحمّل ومعظم الزوار ما يحتاجونها |
| `driver.js` | 7.14 ك.ب | جولة المنتج |
| `ClientRouter` | 5.32 ك.ب | View Transitions |
| `LeadForm` | 4.77 ك.ب | — |
| الباقي (6 ملفات) | ~11 ك.ب | مقبول |

الملفين الأولين لحالهم **301.72 ك.ب** — يعني 91% من المشكلة في ملفين بس.

**التأثير:** TBT 740ms على الرئيسية، ويرفع INP على الموبايل. ملف PDF بـ 126 ك.ب يُحمّل لمستخدم جاء يقرأ مقال — هذا هدر صريح.

**الإصلاح:** BAI-P0-02 (تقسيم الحزم + تحميل PDF عند الطلب فقط).

---

### P0-03 — Lighthouse: الصفحة الرئيسية 29/100

**الدليل — تقارير Lighthouse الموجودة في المستودع:**

| الصفحة | Perf | a11y | SEO | BP | LCP | CLS | TBT |
|---|---:|---:|---:|---:|---:|---:|---:|
| `lh-home-desktop` | **29** | 97 | 100 | 73 | **4.1s** | **0.168** | **740ms** |
| `lh-kernel` | 72 | 97 | 92 | 73 | 1.4s | 0 | 410ms |
| `lh-kernel-chat` | **37** | 96 | 92 | 73 | **4.4s** | 0.012 | 620ms |
| `lh-kernel-reports` | **37** | 96 | 92 | 73 | **4.1s** | 0.008 | 710ms |

**القراءة:**

- **CLS 0.168 على الرئيسية** — أسوأ من حد جوجل (0.1) بـ 68%. لكن لاحظ: صفر صور بدون `width`/`height` (فحصنا 795 صورة، `imgNoDim=0`)، فالمشكلة **مو** في الصور. المتهم المرجّح: تحميل الخطوط (5 خطوط preload منها `TheYearofTheCamel` و `IBMPlexSansArabic`) يسبب FOUT/reflow، أو محتوى يُدرج بـ JS بعد الرسم الأول.
- **LCP 4.1s على الديسكتوب** مع 3 ملفات CSS حاجبة للرسم و 21.8 ك.ب سكربتات مضمّنة (18 بلوك) داخل `index.html`.
- `lh-kernel` بـ 72 و LCP 1.4s و CLS 0 يثبت إن **المشكلة مو معمارية** — الرئيسية والصفحات الثقيلة تحتاج شغل مخصص، القاعدة سليمة.
- Best Practices **73 ثابت على كل الصفحات** — يعني مشكلة عامة في القاعدة (محتمل console errors أو مصادر third-party).

**الإصلاح:** BAI-P0-03.

---

## 2) المشاكل العالية (P1)

### P1-01 — 22 صفحة يتيمة، بوابة BAI-IDX-04 فاشلة

**الدليل — `node scripts/internal-linking-architecture.mjs --source dist/client`:**

```
❌ BAI-IDX-04 acceptance check FAILED:
   - orphan_pages=22 (expected 0)
   - unreachable_indexable=22 (expected 0)
```

**من `reports/internal-links/full-inventory.md`:**
```
- Pages discovered: 274
- Indexable pages: 257
- Internal links discovered: 16,834
- Orphan pages: 22
- Indexable pages unreachable from /: 22
- Max click depth from /: 3 (limit 3)  ← ✅
```

**القائمة الكاملة — 17 صفحة `/answer/` + 5 صفحات `/lp/`:**

| المسار | الوارد | الصادر |
|---|---:|---:|
| `/answer/ai-banking/` | 0 | 1 |
| `/answer/ai-firewall-saudi/` | 0 | 1 |
| `/answer/ai-firewall-saudi-ar/` | 0 | 1 |
| `/answer/ai-governance-framework/` | 0 | 1 |
| `/answer/ai-governance-saudi-arabia/` | 0 | 1 |
| `/answer/ai-governance-saudi-arabia-ar/` | 0 | 1 |
| `/answer/ai-healthcare/` | 0 | 1 |
| `/answer/ai-safety-platform-enterprise/` | 0 | 1 |
| `/answer/audit-trail-saudi-ar/` | 0 | 1 |
| `/answer/iso-42001/` | 0 | 1 |
| `/answer/nca-compliance/` | 0 | 1 |
| `/answer/nca-ecc-controls/` | 0 | 1 |
| `/answer/pdpl-ai-compliance/` | 0 | 1 |
| `/answer/pdpl-ai-compliance-ar/` | 0 | 1 |
| `/answer/sama-ai/` | 0 | 1 |
| `/answer/saudi-ai-safety-os/` | 0 | 1 |
| `/answer/sdaia-generative-ai/` | 0 | 1 |
| `/lp/banking/` | 0 | 1 |
| `/lp/ecc/` | 0 | 1 |
| `/lp/government/` | 0 | 1 |
| `/lp/healthcare/` | 0 | 1 |
| `/lp/pdpl/` | 0 | 1 |

**المفارقة الموجعة:** صفحات `/answer/` هذي **هي بالضبط** الصفحات المصممة للاقتباس في AI Overviews و Perplexity — أسماؤها تجيب على أسئلة مباشرة (`nca-ecc-controls`, `iso-42001`, `pdpl-ai-compliance`). وكلها معمارية GEO ممتازة، لكن **صفر روابط داخلية داخلة عليها**. جوجل يوزّع PageRank عبر الروابط الداخلية؛ صفحة بصفر وارد = صفحة بصفر سلطة.

للمقارنة، الصفحات المرتبطة صح: `/assessment/ai-governance-readiness/` عندها **243** رابط وارد، و `/authors/brightai-team/` عندها **243**.

**ملاحظة مهمة:** الـ 17 صفحة `/answer/` موجودة في `sitemap.xml` (يعني معلنة لجوجل)، أما الـ 5 صفحات `/lp/` **مو موجودة في الخريطة ولا فيها روابط** — يعني غير مكتشفة أبدًا.

**الإصلاح:** BAI-P1-01.

---

### P1-02 — 29 صفحة HTML خارج `sitemap.xml`

**الدليل — مقارنة `dist/client/**/*.html` مع `<loc>` في الخريطة:**

**مقصودة وصحيحة (لا تُضاف):**
`404.html`, `500.html`, `offline/`, `kernel/offline/`, `kernel/api/`, `kernel/admin/quota/`, `thank-you/`, و 5 صفحات `design/*` (نظام التصميم الداخلي).

**تحتاج قرار — وهذي المشكلة:**

| المسار | الحالة | الملاحظة |
|---|---|---|
| `lp/banking/` `lp/ecc/` `lp/government/` `lp/healthcare/` `lp/pdpl/` | خارج الخريطة **و** يتيمة | إما تُربط وتُضاف، أو `noindex` صريح |
| `solutions/cities/riyadh/` `jeddah/` `dammam/` `khobar/` `mecca/` `madinah/` | خارج الخريطة | و `seo-health-check` عدّها "جزئية أو غير مكتملة" وتجاوز فحصها التفصيلي — علامة على إنها partials مو صفحات |
| `blog/category/ذكاء-اصطناعي/` وأخواتها (5) | خارج الخريطة | تصنيفات عربية بأحرف غير ASCII — القرار: تُفهرس أو `noindex`؟ |
| `events/` | خارج الخريطة | صفحة عامة — يبدو نسيان |

**التناقض الخطير:** صفحة تكون **قابلة للفهرسة** (بدون `noindex`) و **خارج الخريطة** و **يتيمة** في نفس الوقت = صفحة معلّقة في الفراغ. جوجل ممكن يلقاها من مصدر خارجي ويفهرسها بصفر سلطة داخلية، وهذا يضعف الموقع كله.

**الإصلاح:** BAI-P1-02.

---

### P1-03 — 24 ملف في `docs/` تحت حد 1200 كلمة

**الدليل — `node scripts/check-word-count.mjs`:**

مقالات `blog/` كلها ✅ (أضعف واحد 1543 كلمة، وأقواهم `ai-audit-trail-saudi.md` بـ 4074). لكن `docs/`:

| الملف | الكلمات | الناقص |
|---|---:|---:|
| `pdpl-audit.md` | 383 | 817 |
| `pdpl-rights.md` | 435 | 765 |
| `pdpl-breach.md` | 443 | 757 |
| `ecc-audit.md` | 444 | 756 |
| `pdpl-thirdparty.md` | 446 | 754 |
| `pdpl-impact.md` | 447 | 753 |
| `pdpl-consent.md` | 450 | 750 |
| `ecc-supply-chain.md` | 465 | 735 |
| `pdpl-ai.md` | 483 | 717 |
| `ecc-mobile.md` | 484 | 716 |
| `pdpl-data.md` | 487 | 713 |
| `ecc-2-2024.md` | 679 | 521 |
| `ecc-ai-mapping.md` | 523 | 677 |
| `ecc-assess.md` | 538 | 662 |
| `ecc-incident.md` | 522 | 678 |
| `ecc-vs-iso27001.md` | 426 | 774 |
| `sama-*.md` (8 ملفات) | 814–947 | 253–386 |

**النمط واضح:** ملفات `pdpl-*` و `ecc-*` هي الأضعف (383–679)، وملفات `sama-*` قريبة من الحد (814–947). ودعم هذا التحليل: **33 صفحة HTML تحت 400 كلمة** في البناء، بمتوسط عام 1454 كلمة للموقع.

**التأثير:** موضوعات PDPL و NCA ECC هي **جوهر عرض القيمة** لـ BrightAI. أضعف صفحاتنا هي أهم كلماتنا المفتاحية — هذا يخلي منافس بمقال 2000 كلمة عن PDPL يتفوق علينا بسهولة، ويقلل احتمال الاقتباس في AI Overviews (المحركات تفضّل المقاطع المكتملة).

**الإصلاح:** BAI-P1-03.

---

### P1-04 — 69 عطل روابط في المصادر (مو في البناء)

**الدليل — `node scripts/internal-links-audit.mjs`:**
```
الملفات المفحوصة: 158
إجمالي المراجع: 226
المراجع الداخلية: 92
الأعطال المكتشفة: 69
الأعطال القابلة للإصلاح التلقائي: 0
فرص توحيد النمط: 1
```

**نقطة مهمة جدًا للفهم الصحيح:** هذا **ما يتعارض** مع نتيجة `seo-ci-check` (0 روابط مكسورة من 48,690 مرجع). الفرق في نطاق الفحص:
- `seo-ci-check` يفحص **`dist/client/`** — HTML المبني. نظيف 100%. ✅
- `internal-links-audit` يفحص **ملفات المصدر** (md/mdx/astro). فيها 69 عطل.

يعني: الزائر والبوت ما يشوفون أي رابط مكسور. لكن ملفات المصدر فيها مراجع ميتة (مسارات نسبية في markdown، روابط بين مستندات، مراجع أصول). هذي **دَين تقني** لا مشكلة زوار — تنفجر أول ما تنقل ملف أو تعيد هيكلة مجلد.

من نموذج `link-graph-validator`: مراجع مثل `/terms/`, `/pdpl-statement/`, `/data-processing-agreement/`, `/privacy-cookies/` من `about/index.html` — لاحظ `/privacy-cookies/` مقابل الموجود `en/cookie-policy/` و `en/privacy-policy/`، يعني احتمال تسمية غير موحدة.

**الإصلاح:** BAI-P1-04.

---

## 3) المشاكل المتوسطة (P2)

### P2-01 — أطوال title و description خارج النطاق

**الدليل — تحليل 275 ملف HTML:**

```
متوسط طول title:        50 حرف   ← ممتاز
titles < 30 حرف:        13 صفحة  ← قصيرة زيادة
titles > 65 حرف:        11 صفحة  ← تُقطع في نتائج البحث
متوسط طول description: 136 حرف   ← ممتاز
descriptions < 80:       6 صفحة
descriptions > 170:     13 صفحة  ← تُقطع
```

المتوسطات ممتازة، فالمشكلة في **43 صفحة شاذة** بس (15.6%). مو نظامية — إصلاح موضعي.

### P2-02 — 10 صفحات بدون أي `<h2>`

متوسط عدد H2 في الموقع **9.9 لكل صفحة** (2728 إجمالًا على 275 صفحة) — وهذا رقم قوي جدًا يخدم الاقتباس في AI. لكن 10 صفحات فيها **صفر** H2، يعني كتلة نص بدون هيكل. محركات الذكاء الاصطناعي تقتبس على مستوى المقطع؛ بدون H2 ما فيه مقاطع تُقتبس.

### P2-03 — صفر schema من نوع `HowTo` و `Dataset`

**توزيع أنواع Schema الفعلي (274 بلوك JSON-LD على 268 صفحة):**

| النوع | العدد | | النوع | العدد |
|---|---:|---|---|---:|
| `City` | **2835** | | `BreadcrumbList` | 241 |
| `ListItem` | 772 | | `OpeningHoursSpecification` | 234 |
| `PostalAddress` | 724 | | `DefinedTerm` | 105 |
| `ImageObject` | 533 | | `Article` | 100 |
| `ContactPoint` | 490 | | `BlogPosting` | 96 |
| `Country` | 487 | | `FAQPage` | 88 |
| `WebPage` | 485 | | `TechArticle` | 48 |
| `Organization` | 449 | | `Offer` | 25 |
| `Person` | 441 | | `Service` | 17 |
| `Question` / `Answer` | 361 / 361 | | `LegalDocument` | 11 |
| `SpeakableSpecification` | 262 | | **`HowTo`** | **0** |
| `GeoCoordinates` | 247 | | **`Dataset`** | **0** |

**ثلاث ملاحظات:**

1. **`HowTo` = 0** — ومحتوانا مليان محتوى إجرائي بطبيعته ("كيف تمتثل لـ PDPL"، "خطوات تطبيق ECC"). هذي فرصة rich result وفرصة اقتباس AI متروكة بالكامل.
2. **`Dataset` = 0** — عندنا 153 جدول HTML في الموقع. الجداول الرقمية (ضوابط، مقارنات امتثال) لو غُلّفت بـ `Dataset` تصير مصدر بيانات مُقتبس في AI Overviews.
3. **`City` = 2835 — تحذير مضاد.** هذا رقم كبير جدًا مقابل 26 صفحة `solutions/` فقط. معناه أن مصفوفة مدن ضخمة تُحقن في كل صفحة تقريبًا. هذا مو تحسين — هذا نفخ للـ payload وقد يُقرأ كإشارة سبام محلي. يحتاج تقليص لعدد المدن ذات الصلة فعليًا بكل صفحة.

### P2-04 — 736 من 795 صورة بـ `alt=""`

```
إجمالي الصور:              795
بدون سمة alt نهائيًا:        0    ← ✅ ممتاز
alt="" (فارغ = تزييني):    736   ← 92.6% — يحتاج مراجعة
بدون width/height:          0    ← ✅ ممتاز (فما CLS من الصور)
loading="lazy":            297
<picture> tags:            490
مصادر AVIF:                245   ← ✅ التنسيقات الحديثة مفعّلة
```

`alt=""` **صحيح تقنيًا** للصور التزيينية، وقارئ الشاشة يتجاوزها — وهذا يفسّر a11y 96–97. بس 92.6% نسبة عالية بشكل غير معقول: مستبعد إن 736 صورة كلها تزيينية. الصور التوضيحية (لقطات المنتج، مخططات، شعارات العملاء) لازم يكون لها alt وصفي — وهذا يفتح لنا Google Images ويرفع فهم المحتوى.

### P2-05 — `public/_headers` ملف ميت

الملف نفسه يوثّق المشكلة:
```
# ─── BAI-IDX-02 WARNING (2026-07-25) — DOCUMENTATION ONLY. ───
# This file is ... NOT read by the current Render Node Web Service
# (Astro 6.4.6 + @astrojs/node), nor by Cloudflare in front of it.
```

الهيدرز الفعلية تُفرض من 3 أماكن: `src/middleware.ts` (104 سطر، على `/api/*` فقط)، `injectSecurityMeta()` في `astro.config.mjs`، و Transform Rule في Cloudflare.

**الوضع الأمني الفعلي على الإنتاج — ممتاز فعلًا:**
```
strict-transport-security: max-age=63072000; includeSubDomains; preload  ✅
content-security-policy: default-src 'self'; ... (allowlist مفصّلة)      ✅
x-content-type-options: nosniff                                          ✅
x-frame-options: SAMEORIGIN                                              ✅
referrer-policy: strict-origin-when-cross-origin                         ✅
permissions-policy: camera=(), microphone=(), geolocation=()             ✅
x-robots-tag: index, follow, max-image-preview:large                     ✅
```

فالخطر مو أمني — الخطر **انحراف إعدادات (config drift)**: 4 مصادر حقيقة، واحد منها ميت. أي مهندس جديد بيعدّل `_headers` ويظن إنه غيّر شي.

### P2-06 — 16 صفحة `noindex` — تحتاج تأكيد مقصودية

16 صفحة فيها `noindex`، و `seo-health-check` أكّد إنها **ما فيها hreflang** (وهذا صحيح تمامًا — `noindex` + `hreflang` تناقض). بس تحتاج مراجعة يدوية للقائمة والتأكد إن ولا واحدة منها صفحة تجارية بالغلط.

---

## 4) اللي ماشي زين — لا تلمسه

هذي مكاسب هندسية حقيقية موثّقة بالأدلة. أي إصلاح جاي **ما يجوز** يكسر واحد منها:

| البند | الدليل |
|---|---|
| hreflang ثنائي الاتجاه | 259 مجموعة — 0 return tags ناقصة، 0 canonical mismatch، 0 x-default ناقص، 0 EN-contract violations، 0 hreflang غير 200 |
| بوابة SEO CI | `seo-ci-check` → 0 أخطاء 0 تحذيرات؛ 48,690 مرجع مفحوص، 0 مكسور |
| اكتمال الميتا | 275 صفحة: canonical ✅ + title ✅ + description ✅ + H1 واحد ✅ |
| Speakable | 262 صفحة بـ `SpeakableSpecification` صحيح |
| أبعاد الصور | 795 صورة، **0** بدون `width`/`height` — سبب رئيسي لتفادي CLS |
| سمات alt | **0** صورة بدون سمة `alt` نهائيًا |
| الصور الحديثة | 490 `<picture>` + 245 مصدر AVIF + 297 `loading="lazy"` |
| عمق النقرات | أقصى عمق **3** من `/` (الحد 3) — 0 صفحة تتجاوز |
| هيكل المحتوى | 9.9 H2 لكل صفحة، 3251 قائمة، 153 جدول، متوسط 1454 كلمة |
| كثافة FAQ | 88 `FAQPage` بـ 361 زوج Question/Answer |
| البريدكرمب | 240 من 275 صفحة |
| a11y | Lighthouse 96–97 على 4 صفحات مقيسة |
| SEO score | 100 على الرئيسية، 92 على صفحات kernel |
| طول المدونة | كل مقالات `blog/` فوق 1200 كلمة (أضعفهم 1543) |
| الهيدرز الأمنية | HSTS preload + CSP allowlist + كل الهيدرز الستة |
| ملفات GEO | `llms.txt` 153 سطر، `llms-full.txt` 372، `ai.txt` 195 |
| التحويلات | 218 سطر في `_redirects` مولّدة تلقائيًا من `redirects.json` |
| إعداد Astro | `trailingSlash: 'always'` + `compressHTML: true` + `site` مضبوط |

---

## 5) خطة التنفيذ بالترتيب

**الترتيب مقصود:** كل مرحلة تعتمد على اللي قبلها. لا تقفز.

### المرحلة 0 — فتح الحجب (قبل أي شي ثاني)
| المعرّف | العمل | لِمن |
|---|---|---|
| **BAI-P0-01** | إلغاء حجب Cloudflare لكل بوتات البحث والـ AI | DevOps / Cloudflare |

بدون هذا، كل إصلاح جاي شغل نظري. **هذي أول ساعة عمل.**

### المرحلة 1 — الأداء (تُنفّذ بالتوازي مع المرحلة 0)
| المعرّف | العمل |
|---|---|
| **BAI-P0-02** | تقسيم `index.js` (176 ك.ب) + تحميل `pdf.js` (126 ك.ب) عند الطلب فقط |
| **BAI-P0-03** | إصلاح CLS 0.168 (تحقيق الخطوط) + LCP 4.1s + BP 73 |

### المرحلة 2 — الاكتشاف والفهرسة
| المعرّف | العمل |
|---|---|
| **BAI-P1-01** | ربط 22 صفحة يتيمة (17 `/answer/` + 5 `/lp/`) بروابط سياقية حقيقية |
| **BAI-P1-02** | حسم قرار 29 صفحة خارج الخريطة (أضِف / `noindex` / حوّلها partial) |

### المرحلة 3 — المحتوى و GEO
| المعرّف | العمل |
|---|---|
| **BAI-P1-03** | توسيع 24 ملف `docs/` لـ 1200+ كلمة (البداية بـ `pdpl-*` و `ecc-*`) |
| **BAI-P2-03** | إضافة `HowTo` للمحتوى الإجرائي + `Dataset` للجداول + تقليص `City` من 2835 |
| **BAI-P2-02** | إضافة `<h2>` للـ 10 صفحات المسطّحة |

### المرحلة 4 — تشذيب
| المعرّف | العمل |
|---|---|
| **BAI-P1-04** | إصلاح 69 عطل مراجع في المصدر |
| **BAI-P2-01** | إصلاح 43 title/description شاذ |
| **BAI-P2-04** | مراجعة 736 `alt=""` وكتابة alt وصفي للصور التوضيحية |
| **BAI-P2-05** | حسم `_headers` (حذف أو توثيق كمرجع هجرة) |
| **BAI-P2-06** | تأكيد قائمة الـ 16 صفحة `noindex` |

---

## 6) بوابات القبول

أي PR يقفل بند من فوق لازم يعدّي هذي كلها:

```bash
pnpm build                                      # لازم ينجح
node scripts/seo-health-check.mjs               # 0 مشاكل
node scripts/seo-ci-check.mjs                   # 0 أخطاء 0 تحذيرات
node scripts/hreflang-bidirectional-audit.mjs   # 0 أخطاء (خط أساس: 259 مجموعة)
node scripts/check-speakable-schema.mjs         # ≥ 262 صفحة
node scripts/check-word-count.mjs               # لا تراجع
node scripts/check-performance-budget.js        # JS ≤ 60 ك.ب gz (خط أساس: 330)
node scripts/internal-linking-architecture.mjs --source dist/client   # orphans = 0
```

**قاعدة عدم التراجع — الأرقام اللي ما يجوز تسوء:**

| المقياس | خط الأساس | القاعدة |
|---|---:|---|
| مجموعات hreflang بدون خطأ | 259 | ≥ 259 |
| صفحات canonical/title/desc/H1 | 275 | = 275 |
| روابط مكسورة في البناء | 0 | = 0 |
| صفحات Speakable | 262 | ≥ 262 |
| صور بدون `width`/`height` | 0 | = 0 |
| صور بدون سمة `alt` | 0 | = 0 |
| أقصى عمق نقرات | 3 | ≤ 3 |
| a11y Lighthouse | 96 | ≥ 96 |
| SEO Lighthouse (الرئيسية) | 100 | = 100 |

---

## 7) الخلاصة

الفريق بنى بنية سيو تقنية أقوى من 95% من مواقع SaaS اللي أشوفها: hreflang صفر أخطاء على 259 مجموعة مو شي عادي، وصفر صورة بدون أبعاد على 795 صورة يعني في انتباه هندسي حقيقي، و 262 صفحة Speakable تعني إن فيه أحد فاهم GEO صح.

وكل هذا معطّل حاليًا لأن Cloudflare يرجّع 403 لـ Googlebot.

هذا الدرس الأهم في التقرير: **قوة الكود ما تعني ظهور في البحث.** الفحوص المحلية كلها خضراء بينما الإنتاج مغلق. لازم نضيف مراقبة مستمرة تفحص الموقع الحقيقي بـ User-Agent بوتات — مو بس نفحص `dist/`.

الترتيب: افتح الحجب (ساعة عمل) → صلّح الأداء (330 ك.ب → 60) → اربط الـ 22 صفحة اليتيمة → وسّع الـ 24 ملف docs. بهذا الترتيب.

---

*انتهى التقرير — 2026-08-08 — كل رقم فيه قابل لإعادة التحقق بأمر واحد.*
