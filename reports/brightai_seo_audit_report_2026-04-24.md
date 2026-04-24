# تقرير SEO فعلي لمشروع Bright AI — brightai.site

**تاريخ الفحص:** 24 أبريل 2026  
**مصدر الفحص:** `BRIGHTAI-main 8.zip` + البرومبت المرفق  
**نوع الموقع:** SaaS / خدمات ذكاء اصطناعي للمؤسسات والقطاع الحكومي في السعودية  
**اللغة الأساسية:** `ar-SA`  
**اللغة الثانوية:** `en-SA`

---

## 1) الملخص التنفيذي

درجة صحة SEO الحالية: **75/100**

الموقع متقدم مقارنة بموقع HTML عادي: عندك `sitemap.xml`، `robots.txt`، `llms.txt`، canonical شبه شامل، titles/descriptions موجودة، محتوى كبير، وJSON-LD منتشر. لكن المشكلة الجوهرية ليست “نقص SEO عام”، المشكلة في **تعارض إشارات الفهرسة**.

### أهم 5 مشاكل حرجة

1. **صفحات `tenders/` موضوعة في `render.yaml` كـ `X-Robots-Tag: noindex`**
   - هذا أخطر شيء؛ لأن البرومبت يعتبر صفحات `tenders/` صفحات تسويقية قابلة للفهرسة.
   - المتأثر:  
     `tenders/compare`, `tenders/dashboard`, `tenders/reports`, `tenders/settings`, `tenders/templates`  
     وأيضاً نسخها الإنجليزية تحت `en/tenders/`.

2. **`sitemap.xml` يدرج صفحات `tenders/` لكن إعدادات النشر تمنع فهرستها**
   - هذا يعطي Google إشارة متناقضة: “افهرس الصفحة” من sitemap، و “لا تفهرسها” من الهيدر.

3. **صفحات فرعية من `tenders/` ناقصة `hreflang` داخل HTML**
   - ناقص في:  
     `tenders/compare.html`, `tenders/dashboard.html`, `tenders/reports.html`, `tenders/settings.html`, `tenders/templates.html`  
     ونفسها في `en/tenders/`.
   - الـ sitemap فيه hreflang لها، لكن HTML نفسه ناقص؛ الأفضل توحيد الاثنين.

4. **استخدام `FAQPage` schema في 48 صفحة تجارية**
   - FAQ rich results صارت محدودة جداً وليست مناسبة كاعتماد أساسي لموقع تجاري.
   - لا تحذف الأسئلة من الصفحة؛ احذف فقط `FAQPage` JSON-LD من الصفحات التجارية واستبدله بـ `WebPage`, `Service`, `SoftwareApplication`, `Article`.

5. **اعتماد كبير على redirects/rewrite لتنظيف URLs**
   - أغلب المقالات محفوظة كـ `.html` لكن canonical يشير إلى نسخة نظيفة `/`.
   - هذا مقبول إذا كان Render يطبق كل rewrites بدقة، لكنه حساس جداً لأي خطأ نشر.

### أهم 5 مكاسب سريعة

1. حذف `X-Robots-Tag: noindex` من كل صفحات `tenders/` العامة.
2. إضافة `hreflang` داخل HTML لصفحات `tenders` العربية والإنجليزية.
3. إضافة `Service` + `SoftwareApplication` schema لكل صفحات `tenders`، وليس الصفحة الرئيسية فقط.
4. إضافة `/tenders/landing/` و`/en/tenders/landing/` إلى sitemap إن كانت صفحات تسويقية مستقلة.
5. إصلاح اللغة في ملفات `docs/*-en.html` من `en-US` إلى `en-SA` إذا كان الاستهداف فعلاً السعودية.

---

## 2) جدول الدرجات

| الفئة | الوزن | الدرجة | الحالة |
|---|---:|---:|---|
| التقني | 22% | 72/100 | ⚠️ |
| المحتوى | 23% | 78/100 | ⚠️ |
| On-Page | 20% | 82/100 | ✅ |
| Schema | 10% | 68/100 | ⚠️ |
| الأداء / CWV | 10% | 66/100 | ⚠️ |
| البحث الذكي / GEO | 10% | 70/100 | ⚠️ |
| الصور | 5% | 92/100 | ✅ |
| **الإجمالي** | **100%** | **75/100** | ⚠️ |

---

## 3) نتائج الفحص الرقمي من ملفات المشروع

| المؤشر | النتيجة |
|---|---:|
| إجمالي الملفات المفحوصة بدون `.agents` | 467 |
| ملفات HTML | 226 |
| صفحات HTML بدون `noindex` داخل HTML | 217 |
| URLs داخل `sitemap.xml` | 196 |
| صفحات noindex داخل HTML | 9 |
| صفحات لها title | 226/226 |
| صفحات لها meta description | 226/226 |
| صفحات indexable بدون canonical | 0 |
| صفحات بدون H1 | 0 |
| صفحات فيها أكثر من H1 | 0 |
| صفحات indexable بدون schema | 1 |
| صفحات فيها `FAQPage` schema | 48 |
| الصور داخل HTML | 77 |
| صور ناقصة alt | 0 |
| صور ناقصة width/height | 0 |
| صفحات indexable أقل من 300 كلمة | 4 |
| صفحات يتيمة/غير واصلة من الرئيسية حسب الزحف الداخلي | 17 |
| صفحات أعمق من 3 نقرات | 4 |

---

## 4) التدقيق التقني

| الفئة | الحالة | الدرجة /100 |
|---|---|---:|
| robots.txt | موجود ويسمح لـ Google وAI crawlers الأساسية، لكن ناقص `CCBot` إن تبغى تحظره | 86 |
| XML Sitemap | موجود وفيه 196 URL، لكنه ناقص بعض الصفحات ويصطدم مع noindex headers | 74 |
| noindex | HTML جيد، لكن `render.yaml` يضع noindex على صفحات `tenders/` مهمة | 45 |
| Canonical | ممتاز عموماً، لكن يعتمد كثير على rewrites للـ clean URLs | 84 |
| hreflang | جيد في الصفحات الأساسية، ضعيف في صفحات `tenders` وبعض docs | 68 |
| Crawl Depth | أغلب الصفحات خلال 1-2 نقرة، لكن فيه 17 صفحة يتيمة و4 صفحات أعمق من 3 نقرات | 75 |
| Security Headers | موجودة، لكن CSP فيها `unsafe-inline` و`unsafe-eval` | 78 |
| Mobile | viewport موجود في كل HTML، لكن يلزم اختبار حقيقي على الجوال | 82 |
| JavaScript SEO | المحتوى الأساسي موجود غالباً في HTML، وهذا ممتاز | 86 |

### ملاحظة مهمة على `robots.txt`

إيجابي:
- `Sitemap: https://brightai.site/sitemap.xml` موجود.
- `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`, `PerplexityBot` مسموحين.
- `Google-Extended` محظور، وهذا اختياري ولا يمنع الظهور في بحث Google.
- `Bytespider` محظور.

تحسين مقترح:
```txt
User-agent: CCBot
Disallow: /
```

---

## 5) مشكلة `tenders/` بالتفصيل

البرومبت واضح أن `tenders/` ليست صفحات داخلية، بل صفحات Demo تسويقية لازم تفهرس. لكن في `render.yaml` موجود `X-Robots-Tag: noindex` على الصفحات التالية:

```txt
/tenders/dashboard
/tenders/reports
/tenders/settings
/tenders/compare
/tenders/templates

/en/tenders/dashboard
/en/tenders/reports
/en/tenders/settings
/en/tenders/compare
/en/tenders/templates
```

### الحل الفوري

احذف هذه البلوكات من `render.yaml`:

```yaml
- path: /tenders/dashboard
  name: X-Robots-Tag
  value: noindex, nofollow, noarchive
```

وينطبق نفس الشيء على كل صفحات `tenders/` العامة ونسخها الإنجليزية.

### لا تحذف noindex من الصفحات الداخلية الحقيقية

خل noindex على:
```txt
/interview/pages/admin
/interview/pages/dashboard
/interview/pages/appointment
/interview/pages/Visitor-registration
/mais-OBM
/404.html
/500.html
/error.html
```

---

## 6) Hreflang

### الموجود الجيد

الصفحات الرئيسية مثل:
```txt
/
 /en/
 /about/
 /en/about/
 /ai-agent/
 /en/ai-agent/
```
فيها تبادل جيد بين `ar-SA`, `en-SA`, و`x-default`.

### المشاكل

1. صفحات `tenders/compare`, `dashboard`, `reports`, `settings`, `templates` ناقصة `hreflang` داخل HTML.
2. ملفات `docs/*-en.html` تستخدم `lang="en-US"` بينما استراتيجية الموقع تقول `en-SA`.
3. 108 صفحات فيها `ar-SA` و`x-default` فقط بدون نسخة إنجليزية؛ هذا مقبول إذا ما لها ترجمة، لكنه يقلل التكافؤ بين اللغتين.

### كود يضاف لكل صفحة `tenders`

مثال لـ `tenders/compare.html`:

```html
<link rel="alternate" hreflang="ar-SA" href="https://brightai.site/tenders/compare/">
<link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/tenders/compare/">
<link rel="alternate" hreflang="x-default" href="https://brightai.site/tenders/compare/">
```

وفي الصفحة الإنجليزية `en/tenders/compare.html` نفس الروابط.

---

## 7) Sitemap

### الوضع الحالي

- `sitemap.xml` يحتوي 196 URL.
- لا يوجد `.html` داخل sitemap.
- لا يوجد noindex meta داخل sitemap حسب فحص HTML.
- يحتوي 11 URL من `tenders/`.

### المشكلة

- لا يحتوي `/tenders/landing/` ولا `/en/tenders/landing/` رغم أنها صفحات تسويقية مستقلة ومليانة محتوى.
- يحتوي صفحات `tenders/` التي يمنعها `render.yaml` بالـ `X-Robots-Tag`.
- فيه 6 URLs طويلة جداً في المدونة، خصوصاً slugs عربية مطولة ومشفرة `%D8...`.

### الإجراء

أضف:

```xml
<url>
  <loc>https://brightai.site/tenders/landing/</loc>
  <xhtml:link rel="alternate" hreflang="ar-SA" href="https://brightai.site/tenders/landing/" />
  <xhtml:link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/tenders/landing/" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://brightai.site/tenders/landing/" />
  <lastmod>2026-04-24</lastmod>
  <priority>0.9</priority>
</url>
```

ونفس الشيء للإنجليزي.

---

## 8) Schema

### الجيد

موجود:
- `Organization`
- `LocalBusiness`
- `WebSite`
- `WebPage`
- `Service`
- `BreadcrumbList`
- `Article`
- `BlogPosting`
- `SoftwareApplication`
- `ContactPage`

### المشاكل

| المشكلة | التأثير | الحل |
|---|---|---|
| `FAQPage` موجود في 48 صفحة | غير مناسب كاعتماد تجاري وقد لا يعطي rich results | احذف JSON-LD فقط |
| `Person` غير موجود | ضعف E-E-A-T للفريق والخبراء | أضف أعضاء الفريق أو المؤسس/الخبراء |
| صفحات `tenders` الفرعية فيها فقط `WebPage + BreadcrumbList` | ناقص فهم المنتج والخدمة | أضف `Service` + `SoftwareApplication` |
| `docs/solutions-bi-en.html` فيه placeholder-like value | يضعف الثقة في JSON-LD | نظف القيم الوهمية |

### Schema مقترح لصفحة `tenders/compare`

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": "https://brightai.site/tenders/compare/#software",
  "name": "ContractAI Contract Comparison",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "url": "https://brightai.site/tenders/compare/",
  "description": "أداة من Bright AI لمقارنة العقود والمناقصات واستخراج الفروقات والمخاطر ونقاط التفاوض للفرق القانونية والمشتريات في السعودية.",
  "inLanguage": "ar-SA",
  "provider": {
    "@type": "Organization",
    "@id": "https://brightai.site/#organization"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Saudi Arabia"
  }
}
</script>
```

---

## 9) المحتوى و E-E-A-T

| العامل | الدرجة /25 | الإشارات الرئيسية |
|---|---:|---|
| Experience | 14/25 | فيه دراسات حالة/أمثلة، لكنها تحتاج أدلة ونتائج موثقة |
| Expertise | 16/25 | محتوى تقني واسع، لكن لا يوجد خبراء/مؤلفون واضحون |
| Authoritativeness | 12/25 | لا تظهر إشارات خارجية قوية مثل تغطيات إعلامية أو Wikidata |
| Trustworthiness | 18/25 | عنوان وبيانات تواصل وHTTPS وNAP موجودة، لكن تحتاج إثباتات امتثال |

### ملاحظات مهمة

- الصفحة الرئيسية قوية جداً من ناحية كثافة المحتوى.
- بعض النص الإنجليزي غير مناسب لـ B2B/B2G مثل: `kickass`, `dope`, `crush`.
- الأفضل تحويل الإنجليزية لأسلوب Enterprise واضح:
  - Professional
  - Government-ready
  - Compliance-first
  - Saudi enterprise focused

مثال تحسين:
```txt
Before:
Your Go-To Artificial Intelligence Company in Saudi Arabia — Kickass Automation & Data Analysis for Businesses

After:
Enterprise AI Solutions in Saudi Arabia — Automation, Data Analysis, and AI Agents for Regulated Organizations
```

---

## 10) الصور والأداء

### الصور

ممتاز:
- 77 صورة.
- 0 صور ناقصة alt.
- 0 صور ناقصة width/height.
- WebP/AVIF موجودة.

### الأداء

مخاطر:
- الصفحة الرئيسية `index.html` حجمها تقريباً 276KB.
- `en/index.html` تقريباً 243KB.
- الصفحة الرئيسية تحمل حوالي 634KB أصول محلية من CSS/JS/images.
- `tailwind.local.min.css` حجمه حوالي 180KB.
- فيه خطوط TTF ثقيلة مع WOFF2.

### توصيات

1. استخدم WOFF2 فقط في الإنتاج قدر الإمكان.
2. قص Tailwind CSS بالـ purge/content config.
3. أزل JS غير المستخدم من الصفحة الرئيسية.
4. فعّل long cache للأصول مع hash filenames.
5. اجمع قياس حقيقي من CrUX/PageSpeed على p75:
   - LCP < 2.5s
   - INP < 200ms
   - CLS < 0.1

---

## 11) السيو المحلي السعودي

### الموجود

- الرياض مذكورة.
- الهاتف موجود.
- LocalBusiness موجود.
- NCA/SDAIA/NDMO مذكورة كإشارات ثقة.

### النواقص

1. إثبات Google Business Profile غير واضح داخل الملفات.
2. لا توجد خريطة أو reviews واضحة مرتبطة بـ GBP.
3. NAP غير موحد بالكامل:
   - الصفحة الرئيسية postalCode: `12211`
   - صفحة contact postalCode: `11564`
4. لا توجد روابط إثبات للشهادات/الامتثال.
5. `sameAs` يحتاج روابط حقيقية وفعالة لكل منصة.

### الإجراء

- وحّد NAP في HTML وSchema وGBP.
- أضف قسم "الامتثال والثقة" مع روابط أو مستندات قابلة للتحقق.
- أضف صفحة محلية: `/riyadh-ai-company/` إن كان عندك مقر وخدمة محلية فعلية بالرياض.

---

## 12) البحث الذكي / GEO

### الموجود

- `llms.txt` موجود في الجذر.
- يسمح بالزحف لـ GPTBot وChatGPT-User وClaudeBot وPerplexityBot.
- المحتوى الأساسي موجود في HTML الأولي، وهذا ممتاز لزواحف AI.

### النواقص

- لا يوجد دليل واضح على Wikidata/Wikipedia.
- لا يوجد حضور Reddit/YouTube قوي داخل الملفات.
- لا توجد صفحات تعريفية قصيرة بصيغة إجابات قابلة للاقتباس لكل خدمة.
- لا يوجد author/person schema.

### تحسينات GEO

1. أضف أعلى كل صفحة خدمة فقرة تعريفية 40-60 كلمة:
   - "تحليل المناقصات بالذكاء الاصطناعي هو..."
2. أضف كتل إجابة مستقلة 134-167 كلمة لكل سؤال تجاري.
3. أضف صفحة `/about/leadership/` أو قسم فريق مع `Person schema`.
4. أنشئ مقالات قيادة فكرية بصيغة:
   - "ما هو تحليل المناقصات بالذكاء الاصطناعي؟"
   - "كيف تختار منصة تحليل عقود في السعودية؟"
   - "دليل أتمتة المشتريات الحكومية بالذكاء الاصطناعي"

---

## 13) الكلمات المفتاحية السعودية المقترحة

| الكلمة | الصفحة المستهدفة | القصد | الأولوية |
|---|---|---|---|
| شركة ذكاء اصطناعي في السعودية | `/` | تجاري | عالية |
| شركة ذكاء اصطناعي في الرياض | `/about/` أو صفحة Riyadh | تجاري/محلي | عالية |
| حلول ذكاء اصطناعي للشركات | `/services/` | تجاري | عالية |
| ذكاء اصطناعي للمؤسسات | `/ai-agent/` | تجاري | عالية |
| أتمتة العمليات بالذكاء الاصطناعي | `/smart-automation/` | تجاري | عالية |
| RPA السعودية | `/smart-automation/` | تجاري | متوسطة |
| تحليل البيانات بالذكاء الاصطناعي | `/data-analysis/` | تجاري | عالية |
| ذكاء الأعمال في السعودية | `/data-analysis/` | تجاري | عالية |
| تحليل مناقصات بالذكاء الاصطناعي | `/tenders/` | تجاري | عالية جداً |
| نظام مناقصات ذكي | `/tenders/landing/` | تجاري | عالية جداً |
| مقارنة عروض المناقصات | `/tenders/compare/` | معاملاتي | عالية |
| أتمتة المناقصات الحكومية | `/tenders/` | تجاري | عالية جداً |
| تحليل العقود بالذكاء الاصطناعي | `/tenders/landing/` | تجاري | عالية جداً |
| شات بوت ذكي للشركات | `/ai-bots/` | تجاري | عالية |
| بوت خدمة عملاء بالذكاء الاصطناعي | `/ai-bots/BrightSupport/` | تجاري | عالية |
| منصة توظيف بالذكاء الاصطناعي | `/ai-bots/BrightRecruiter/` | تجاري | متوسطة |
| حوكمة البيانات السعودية | `/blog/` + صفحة خدمة | معلوماتي/تجاري | متوسطة |
| الذكاء الاصطناعي في القطاع الحكومي | `/blog/government-ai-solutions/` | معلوماتي | عالية |
| رؤية 2030 والذكاء الاصطناعي | `/blog/vision-2030-ai-opportunities/` | معلوماتي | عالية |

---

## 14) خطة التنفيذ

### المرحلة 1 — التأسيس: الأسابيع 1-4

- حذف noindex من صفحات `tenders/` العامة في `render.yaml`.
- إضافة hreflang داخل HTML لصفحات `tenders`.
- إضافة `/tenders/landing/` و`/en/tenders/landing/` إلى sitemap.
- إزالة `FAQPage` schema من الصفحات التجارية.
- إصلاح `docs/*-en.html` إلى `lang="en-SA"`.
- فحص live headers بعد النشر:
  ```bash
  curl -I https://brightai.site/tenders/compare/
  ```

### المرحلة 2 — التوسع: الأسابيع 5-12

- بناء صفحات هبوط لكل خدمة:
  - `/tenders/`
  - `/smart-automation/`
  - `/data-analysis/`
  - `/ai-agent/`
  - `/ai-bots/`
- تحسين الربط الداخلي من homepage إلى كل صفحات المال.
- إعادة كتابة الإنجليزية بأسلوب Enterprise.
- تحسين NAP وGoogle Business Profile.

### المرحلة 3 — التوسيع: الأسابيع 13-24

- إطلاق محتوى Pillar/Cluster:
  - AI for Saudi Enterprises
  - Tender Automation in Saudi Arabia
  - AI Data Analytics for Regulated Sectors
- دراسات حالة سعودية حقيقية أو شبه مجهولة مع KPIs.
- بناء روابط خارجية من أدلة تقنية سعودية وخليجية.
- إضافة `Person schema` وAuthor boxes.

### المرحلة 4 — السلطة: الأشهر 7-12

- قيادة فكرية وتقارير PDF قابلة للتحميل.
- ظهور إعلامي/بودكاست/LinkedIn articles.
- Wikidata/Crunchbase أو بدائل موثوقة للكيان إن توفرت شروطها.
- تحسين مستمر حسب GSC Queries وPages.

---

## 15) أهداف KPI

> هذه أهداف تشغيلية تقديرية وليست ضمانات؛ تحتاج بيانات GSC وGA4 لتحديد baseline الحقيقي.

| المقياس | الحالي | 3 أشهر | 6 أشهر | 12 شهر |
|---|---:|---:|---:|---:|
| الزيارات العضوية | يحتاج GSC | 300-800 شهرياً | 1,500-3,000 شهرياً | 8,000-15,000 شهرياً |
| كلمات Top 10 | يحتاج GSC | 10-20 | 40-70 | 120+ |
| الصفحات المفهرسة | sitemap: 196 URL | 80-120 | 150-190 | 220+ مع محتوى جديد |
| CWV | غير مثبت بدون RUM | LCP/CLS جيد | INP مستقر | اجتياز كامل p75 |
| AI Search Visibility | ضعيف/غير موثق | تعريفات قابلة للاقتباس | ظهور في Perplexity/ChatGPT لبعض الاستعلامات | حضور كياني أقوى |

---

## 16) الأولويات النهائية

### 🔴 حرج — إصلاح فوري

1. حذف `X-Robots-Tag: noindex` من `tenders/` العامة.
2. توحيد sitemap مع noindex headers.
3. إضافة hreflang داخل HTML لصفحات `tenders`.

### 🟠 عالي — خلال أسبوع

1. إضافة `Service + SoftwareApplication` schema لصفحات `tenders`.
2. إزالة `FAQPage` schema من الصفحات التجارية.
3. إصلاح tone النسخة الإنجليزية.
4. إصلاح `localhost:3000` في `docs/openapi.html`.

### 🟡 متوسط — خلال شهر

1. تقصير slugs العربية الطويلة جداً وتحويلها 301.
2. تقوية author/person schema.
3. تحسين internal links للصفحات اليتيمة.
4. إنشاء صفحات تعريفية قصيرة قابلة للاقتباس للـ GEO.

### 🟢 منخفض — قائمة انتظار

1. تحسين أسماء بعض الملفات.
2. توحيد postalCode في كل schema.
3. تقليل CSS/JS الزائد.
4. تحسين llms.txt بإضافة أهم صفحات `tenders`.

---

## 17) الخلاصة

الموقع مو بعيد عن الفهرسة؛ بالعكس فيه شغل SEO كثير. المشكلة الأساسية أن بعض أهم صفحاتك، خصوصاً `tenders/`، ترسل إشارات متناقضة:  
**sitemap يقول افهرس، وRender headers تقول لا تفهرس.**

إذا صلحت noindex headers وhreflang وSchema لصفحات `tenders/`، غالباً بتشوف تحسن واضح في قابلية الفهرسة خلال دورة زحف قادمة، بشرط إرسال sitemap وIndexNow ومراقبة Google Search Console.
