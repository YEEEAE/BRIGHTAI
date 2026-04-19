# تقرير تحليل SEO تقني شامل — موقع Bright AI

> **تاريخ التقرير:** أبريل 2026  
> **النطاق:** brightai.site  
> **نوع الموقع:** Static HTML (SSG) — ثنائي اللغة (عربي/إنجليزي)  
> **الاستضافة:** Render + Netlify CDN  
> **المحقق:** وكيل SEO التقني — BrightAI

---

## النتيجة التقنية الإجمالية: 62⁄100

| الفئة | الحالة | النتيجة |
|:------|:-------|:--------|
| الزحف (Crawlability) | ⚠️ warn | 70⁄100 |
| الفهرسة (Indexability) | ❌ fail | 45⁄100 |
| الأمان (Security) | ✅ pass | 90⁄100 |
| بنية الروابط (URL Structure) | ⚠️ warn | 65⁄100 |
| الجوال (Mobile) | ✅ pass | 85⁄100 |
| Core Web Vitals | ⚠️ warn | 60⁄100 |
| البيانات المنظمة (Structured Data) | ⚠️ warn | 55⁄100 |
| JS Rendering | ✅ pass | 80⁄100 |
| IndexNow | ❌ fail | 0⁄100 |

---

## جدول المحتويات

1. [تحليل HTML لكل صفحة](#1-تحليل-html-لكل-صفحة)
2. [تحليل CSS](#2-تحليل-css)
3. [تحليل JavaScript](#3-تحليل-javascript)
4. [تحليل robots.txt و sitemap.xml](#4-تحليل-robotstxt-و-sitemapxml)
5. [تحليل سرعة الموقع](#5-تحليل-سرعة-الموقع)
6. [تحليل المحتوى والكلمات المفتاحية](#6-تحليل-المحتوى-والكلمات-المفتاحية)
7. [تحليل E-E-A-T](#7-تحليل-e-e-a-t)
8. [ملخص المشاكل المرصودة](#8-ملخص-المشاكل-المرصودة)
9. [ملخص تنفيذي — أهم 10 مشاكل](#9-ملخص-تنفيذي--أهم-10-مشاكل)
10. [خطة العمل الزمنية](#10-خطة-العمل-الزمنية)
11. [قائمة Schema Markup المطلوب إضافتها](#11-قائمة-schema-markup-المطلوب-إضافتها)

---

## 1. تحليل HTML لكل صفحة

### ✅ نقاط القوة المكتشفة

- معظم الصفحات تحتوي `dir="rtl" lang="ar-SA"` بشكل صحيح
- معظم الصفحات فيها `<meta name="robots">` مع `index, follow`
- معظم الصفحات فيها `canonical` و `hreflang` و Open Graph و Twitter Cards
- Google Analytics ID `G-8LLESL207Q` موجود في كل الصفحات
- معظم الصفحات فيها `<meta name="description">` فريد
- كل صفحة فيها `<h1>` واحد فقط
- التسلسل الهرمي للعناوين صحيح (H1 > H2 > H3) في أغلب الصفحات
- يوجد `<link rel="sitemap">` في كل صفحة

### جدول فحص العناصر حسب الصفحة

| العنصر | index | about | services | contact | consultation | ai-agent | ai-workflows | data-analysis | smart-automation | en/index |
|:-------|:------|:------|:---------|:--------|:-------------|:---------|:-------------|:-------------|:----------------|:---------|
| `<title>` فريد | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<meta description>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<meta keywords>` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `<link canonical>` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `hreflang` كامل | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `<h1>` واحد | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `lang="ar-SA"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (en-US) |
| `dir="rtl"` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ (ltr) |
| Schema JSON-LD | ✅ 5 | ✅ 1 | ✅ 1 | ✅ 1 | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| OG Tags | ✅ | ✅ | ✅ | ✅ | ⚠️ جزئي | ✅ | ✅ | ✅ | ✅ | ✅ |
| Twitter Cards | ✅ | ✅ | ✅ | ✅ | ⚠️ جزئي | ✅ | ✅ | ✅ | ✅ | ✅ |
| `og:image:width/height` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `og:locale:alternate` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 2. تحليل CSS

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| Responsive Design | ✅ | `viewport` meta موجود، Tailwind responsive |
| Unused CSS | ⚠️ | `tailwind.local.min.css` = **183KB** (كثير غير مستخدم) |
| الخطوط محلية | ⚠️ | Scheherazade محلي ✅ لكن IBM Plex و Tajawal من CDN |
| `font-display: swap` | ✅ | موجود في `fonts.css` و `bundle-critical.css` |
| Critical CSS مفصول | ✅ | `bundle-critical.css` (18KB) مفصول عن `main.bundle.css` |
| Minification | ✅ | يوجد نسخ `.min.css` لمعظم الملفات |
| Cache headers | ✅ | `_headers` فيه cache 30 يوم للـ CSS |
| `@font-face` محلي | ✅ | ScheherazadeNew-Regular مُعرّف بـ `font-display: swap` |

### ملفات CSS وحجومها

| الملف | الحجم | ملاحظة |
|:------|:------|:-------|
| `tailwind.local.min.css` | 183 KB | ⚠️ ضخم — يحتاج PurgeCSS |
| `main.bundle.css` | 183 KB | ⚠️ نسخة غير مضغوطة من min |
| `main.bundle.min.css` | 45 KB | ✅ |
| `bundle-pages.css` | 49 KB | صفحات فرعية |
| `bundle-critical.css` | 18 KB | ✅ Critical CSS |
| `index-theme.min.css` | 39 KB | ✅ |
| `tenders-index-inline.min.css` | 38 KB | صفحة tenders |

---

## 3. تحليل JavaScript

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| Render-blocking JS | ⚠️ | بعض الخطوط من CDN تحظر render |
| `defer` / `async` | ✅ | أغلب السكربتات تستخدم `defer` أو `async` |
| المحتوى يعتمد على JS | ✅ | المحتوى الأساسي في HTML ثابت (SSG) — Googlebot يقرأه |
| Lazy Loading للصور | ✅ | 67 صورة تستخدم `loading="lazy"` |
| Service Worker / PWA | ✅ | `sw.js` موجود مع caching متقدم (3 مستويات) |
| Minification | ✅ | يوجد نسخ `.min.js` لمعظم الملفات |

### ملفات JS وحجومها

| الملف | الحجم | ملاحظة |
|:------|:------|:-------|
| `iconify-preload.js` | **178 KB** | ⚠️ ضخم جداً — يحتاج تقليم |
| `navigation.js` | 23 KB | ✅ |
| `page-enhancements.js` | 28 KB | ✅ |
| `article-ux-enhancements.js` | 31 KB | ✅ |
| `search.js` | 26 KB | ✅ |
| `main.bundle.js` | 25 KB | ✅ |
| `index-theme.min.js` | 36 KB | ✅ |
| `interview-app.min.js` | 44 KB | ✅ |

### السكربتات الخارجية لكل صفحة

| السكربت | النوع | تأثير على الأداء |
|:--------|:------|:-----------------|
| Google Tag Manager | `async` | منخفض |
| Sentry | `defer` | منخفض |
| Microsoft Clarity | ⚠️ بدون defer في بعض الصفحات | متوسط |
| Google AdSense | `defer` | متوسط |

---

## 4. تحليل robots.txt و sitemap.xml

### robots.txt

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| الملف موجود | ✅ | شامل ومنظم مع تعليقات عربية |
| Sitemap referenced | ✅ | `Sitemap: https://brightai.site/sitemap.xml` |
| حجب صفحات مهمة بالغلط | ✅ | لا يوجد حجب خاطئ |
| حجب مجلدات داخلية | ✅ | `/scripts/`, `/tmp/`, `/.git/`, `/tests/` — صحيح |
| السماح بموارد العرض | ✅ | `/frontend/js/`, `/assets/css/` إلخ — صحيح |
| AI Crawlers | ⚠️ | يسمح الكل لكن **لا يحجب** `Google-Extended` و `Bytespider` |
| `llms.txt` مُشار إليه | ✅ | `Allow: /llms.txt` |

### sitemap.xml

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| الملف موجود وصالح | ✅ | xmlns و xmlns:xhtml صحيحان |
| hreflang في Sitemap | ⚠️ | فقط `ar-SA` + `x-default` — **بدون `en-SA`** |
| صفحات `/en/` مفقودة | ❌ | **لا يوجد أي مدخل لصفحات إنجليزية** |
| صفحات خدمية مفقودة | ❌ | انظر القائمة أدناه |
| `lastmod` محدث | ✅ | 2026-04-13 للصفحات الرئيسية |
| `priority` منطقي | ✅ | 1.0 للرئيسية، 0.9 للخدمات، 0.7 للمدونة |

#### صفحات مفقودة من Sitemap

- `/contact/`
- `/services/`
- `/smart-automation/`
- `/health/`
- `/machine-learning/`
- `/what-is-ai/`
- `/case-studies/`
- `/partners/`
- `/privacy-cookies/`
- `/terms/`
- `/bot/`
- `/docs.html` (مركز المستندات)
- أغلب صفحات `/docs/` (حوالي 30 صفحة)
- **كل صفحات `/en/`** (حوالي 15 صفحة)

### _headers (Security & Cache)

| العنصر | الحالة |
|:-------|:-------|
| HSTS مع preload | ✅ |
| X-Frame-Options: SAMEORIGIN | ✅ |
| X-Content-Type-Options: nosniff | ✅ |
| Referrer-Policy | ✅ |
| CSP | ✅ شامل |
| Cache-Control للـ CSS/JS/Fonts | ✅ 30 يوم |
| X-Robots-Tag: noindex للصفحات الداخلية | ✅ |

### _redirects

| العنصر | الحالة |
|:-------|:-------|
| HTTP → HTTPS | ✅ |
| www → non-www | ✅ |
| index.html → clean URL | ✅ |
| .html → clean URL | ✅ |
| مدونات محذوفة → مدونة رئيسية | ✅ |

---

## 5. تحليل سرعة الموقع

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| صور WebP/AVIF | ✅ | `assets/3d-icons/` فيها avif + webp |
| تأخير سكربتات طرف ثالث | ⚠️ | Sentry + Clarity + GTM + AdSense = **4 سكربتات خارجية** |
| Minification CSS/JS | ✅ | متوفر |
| CDN | ✅ | Netlify/Render يوفر CDN |
| Font preload | ✅ | ScheherazadeNew مُحمّل مسبقاً مع `fetchpriority="high"` |
| CLS prevention | ✅ | CSS مخصص لمنع CLS من الخطوط والأيقونات |
| Critical CSS inline | ✅ | `bundle-critical.css` + `critical-css` block |
| Service Worker caching | ✅ | 3 مستويات (static, runtime, recent-articles) |
| `dns-prefetch` و `preconnect` | ✅ | لـ GTM, Sentry, Google Fonts |

---

## 6. تحليل المحتوى والكلمات المفتاحية

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| كلمة مفتاحية لكل صفحة | ✅ | معظم الصفحات تستهدف كلمة واضحة |
| Keyword Cannibalization | ⚠️ | `/ai-agent/` و `/docs/ai-agent.html` يستهدفان نفس الكلمة |
| محتوى كافي (>800 كلمة) | ✅ | الصفحات الرئيسية غنية |
| Internal Linking | ✅ | يوجد أسلوب ربط داخلي مع تظليل خاص |
| `<h1>` واحد لكل صفحة | ✅ | كل صفحة فيها h1 واحد |
| `<meta name="keywords">` | ⚠️ | فقط 25 صفحة من أصل ~213 لديها keywords |

### Keyword Cannibalization المحتملة

| الكلمة المفتاحية | الصفحات المتنافسة |
|:----------------|:-----------------|
| AI Agent | `/ai-agent/` و `/docs/ai-agent.html` |
| استشارات AI | `/consultation/` و `/docs/consultation.html` |
| تحليل البيانات | `/data-analysis/` و `/docs/data-analysis.html` |
| الأتمتة الذكية | `/smart-automation/` و `/docs/smart-automation.html` |

**الحل:** اجعل صفحات `/docs/` توثيقية (canonical لصفحة الخدمة الرئيسية) وصفحات الخدمة هي الصفحات التسويقية المستقلة.

---

## 7. تحليل E-E-A-T

| العنصر | الحالة | ملاحظات |
|:-------|:-------|:--------|
| عنوان فعلي | ✅ | "طريق الملك فهد، العليا" في Schema |
| سجل تجاري | ❌ | **غير مذكور** في أي صفحة |
| فريق العمل | ⚠️ | صفحة "من نحن" موجودة لكن تحتاج تفصيل أكثر |
| شهادات عملاء | ⚠️ | دراسات حالة في `llms.txt` لكن **بدون صفحة مخصصة** |
| سياسة الخصوصية | ✅ | `/privacy-cookies/` و `/docs/privacy-policy/` |
| شروط الاستخدام | ✅ | `/terms/` و `/docs/terms-and-conditions/` |
| بريد مؤسسي | ❌ | `yazeed1job@gmail.com` — **يضر الثقة المهنية** |
| امتثال NCA/NDMO | ✅ | مذكور في llms.txt و Schema |
| حسابات اجتماعية | ✅ | LinkedIn, X, YouTube, WhatsApp |

---

## 8. ملخص المشاكل المرصودة

### 🔴 P0 — مشاكل حرجة (إصلاح فوري)

---

#### المشكلة P0-1: Sitemap لا يشمل صفحات ⁠`/en/` الإنجليزية

- **الملف:** `sitemap.xml`
- **التأثير:** عالي
- **الوصف:** كل مدخلات Sitemap تحتوي فقط `ar-SA` و `x-default`، ولا يوجد أي مدخل لصفحات `/en/`. هذا يخالف شرط Return Tags في hreflang — إذا الصفحة العربية تشير لإنجليزية عبر hreflang في HTML، لكن الإنجليزية غير موجودة في Sitemap، فالإشارة أحادية الاتجاه.
- **الحل:** إضافة كل صفحات `/en/` للـ Sitemap مع hreflang كامل ثنائي الاتجاه

---

#### المشكلة P0-2: صفحات مهمة مفقودة من Sitemap

- **الملف:** `sitemap.xml`
- **التأثير:** عالي
- **الصفحات المفقودة:**
  - `/contact/`
  - `/services/`
  - `/smart-automation/`
  - `/health/`
  - `/machine-learning/`
  - `/what-is-ai/`
  - `/case-studies/`
  - `/partners/`
  - `/privacy-cookies/`
  - `/terms/`
  - `/bot/`
  - `/docs.html`
  - أغلب صفحات `/docs/`
- **الحل:** إضافة كل الصفحات القابلة للفهرسة للـ Sitemap

---

#### المشكلة P0-3: `contact/index.html` مفقود `hreflang="en-SA"`

- **الملف:** `contact/index.html:14`
- **التأثير:** عالي — يكسر شرط Return Tags
- **الكود الحالي:**
  ```html
  <link rel="alternate" hreflang="ar-SA" href="https://brightai.site/contact/" />
  <link rel="alternate" hreflang="x-default" href="https://brightai.site/contact/" />
  ```
- **الحل:** إضافة:
  ```html
  <link rel="alternate" hreflang="en-SA" href="https://brightai.site/en/contact/" />
  ```

---

#### المشكلة P0-4: `sectors/*-en.html` canonical يستخدم امتداد `.html`

- **الملفات:**
  - `sectors/ecommerce-en.html:11`
  - `sectors/energy-en.html`
  - `sectors/finance-en.html`
  - `sectors/healthcare-en.html`
  - `sectors/logistics-en.html`
  - `sectors/manufacturing-en.html`
- **التأثير:** عالي — يتعارض مع قواعد `_redirects` ويسبب محتوى مكرر
- **الكود الحالي:**
  ```html
  <link rel="canonical" href="https://brightai.site/sectors/ecommerce-en.html" />
  ```
- **الحل:**
  ```html
  <link rel="canonical" href="https://brightai.site/sectors/ecommerce-en/" />
  ```

---

#### المشكلة P0-5: `error.html` فيه `canonical` مع `noindex`

- **الملف:** `error.html:16-17`
- **التأثير:** عالي — تعارض بين canonical و noindex يربك Googlebot
- **الكود الحالي:**
  ```html
  <meta name="robots" content="noindex, nofollow, noarchive">
  <link rel="canonical" href="https://brightai.site/error">
  ```
- **الحل:** حذف سطر `canonical` من الصفحة (صفحات noindex لا تحتاج canonical)

---

### 🟠 P1 — مشاكل عالية الأولوية (إصلاح خلال أسبوع)

---

#### المشكلة P1-1: مفقود LocalBusiness Schema

- **الملف:** `index.html:72-118`
- **التأثير:** عالي — LocalBusiness ضروري للظهور في نتائج محلية سعودية
- **الوصف:** يوجد Organization schema لكن لا يوجد LocalBusiness الذي يفعّل Google Business Profile وخرائط Google
- **الحل:** إضافة LocalBusiness schema (انظر قسم Schema أدناه)

---

#### المشكلة P1-2: مفقود BreadcrumbList Schema في أغلب الصفحات

- **الملف:** فقط `index.html` فيه BreadcrumbList
- **التأثير:** عالي — بدون breadcrumb schema تضيع Rich Results في نتائج البحث
- **الصفحات المتأثرة:** about, services, contact, consultation, ai-agent, ai-workflows, data-analysis, smart-automation, health, sectors/*, blog/*
- **الحل:** إضافة BreadcrumbList لكل صفحة (انظر قسم Schema أدناه)

---

#### المشكلة P1-3: مفقود Article/BlogPosting Schema في صفحات المدونة

- **الملف:** صفحات `blog/*.html`
- **التأثير:** عالي — بدون Article schema لا تظهر Rich Results للمقالات
- **الحل:** إضافة BlogPosting schema لكل مقال (انظر قسم Schema أدناه)

---

#### المشكلة P1-4: خطوط Google Fonts تحظر Render في بعض الصفحات

- **الملفات المتأثرة:**
  - `ai-workflows/index.html:56-59` — IBM Plex Sans Arabic
  - `error.html:20` — Tajawal
  - `500.html:38` — Tajawal
- **التأثير:** عالي — يزيد LCP ويبطئ التحميل
- **الحل:** تحميل الخطوط محلياً أو استخدام `rel="preload"` مع `font-display: swap`

---

#### المشكلة P1-5: البريد الإلكتروني في Organization Schema بريد شخصي

- **الملف:** `index.html:91`
- **التأثير:** عالي — يضر E-E-A-T والثقة المهنية
- **الكود الحالي:**
  ```json
  "email": "yazeed1job@gmail.com"
  ```
- **الحل:**
  ```json
  "email": "info@brightai.site"
  ```

---

#### المشكلة P1-6: `manifest.json` فيه تناقضات

- **الملف:** `manifest.json`
- **التأثير:** متوسط-عالي
- **المشاكل:**
  1. اسم الشركة "مُشرقة AI" بدل "Bright AI" — تناقض مع العلامة التجارية
  2. `theme_color: "#64FFDA"` بينما HTML يستخدم `#0b1020` أو `#020617`
  3. `start_url: "/index.html?utm_source=pwa"` يخلق URL مكرر بدل `/`
- **الحل:**
  ```json
  "short_name": "Bright AI",
  "name": "Bright AI | حلول الذكاء الاصطناعي السعودية",
  "theme_color": "#0b1020",
  "start_url": "/?utm_source=pwa"
  ```

---

#### المشكلة P1-7: `robots.txt` لا يحجب Google-Extended و Bytespider

- **الملف:** `robots.txt:77-91`
- **التأثير:** متوسط-عالي — بياناتك تُستخدم لتدريب نماذج AI بدون فائدة لك
- **الحل:** إضافة:
  ```
  User-agent: Google-Extended
  Disallow: /

  User-agent: Bytespider
  Disallow: /
  ```

---

### 🟡 P2 — مشاكل متوسطة الأولوية (إصلاح خلال شهر)

---

#### المشكلة P2-1: حجم CSS كبير (`tailwind.local.min.css` = 183KB)

- **الملف:** `frontend/css/tailwind.local.min.css`
- **التأثير:** متوسط — يبطئ التحميل ويزيد LCP
- **الحل:** تقسيم Tailwind لكل صفحة أو استخدام PurgeCSS لإزالة الأنماط غير المستخدمة

---

#### المشكلة P2-2: `iconify-preload.js` حجمه 178KB

- **الملف:** `frontend/js/iconify-preload.js`
- **التأثير:** متوسط — ملف JS ضخم يزيد وقت التحميل
- **الحل:** تقليل الأيقونات المحملة مسبقاً أو استخدام subset أصغر

---

#### المشكلة P2-3: مفقود `og:image:width` و `og:image:height` في أغلب الصفحات

- **الملف:** معظم الصفحات ما عدا `index.html` و `contact/index.html`
- **التأثير:** متوسط — بدون الأبعاد يحدث CLS عند تحميل OG image في المنشورات
- **الحل:** إضافة لكل صفحة:
  ```html
  <meta content="1200" property="og:image:width" />
  <meta content="630" property="og:image:height" />
  ```

---

#### المشكلة P2-4: مفقود `og:locale:alternate` في أغلب الصفحات

- **الملف:** فقط `index.html` و `en/index.html` فيهما
- **التأثير:** متوسط — يساعد Facebook بتحديد النسخ البديلة
- **الحل:** إضافة `<meta content="en_US" property="og:locale:alternate" />` للصفحات العربية والعكس

---

#### المشكلة P2-5: مدونات مكررة (html + مجلد بنفس الاسم)

- **الملفات:** مثل `blog/ai-agent.html` و `blog/ai-agent/`
- **التأثير:** متوسط — محتوى مكرر قد يربك محركات البحث
- **الحل:** التأكد من وجود canonical واحد و redirect 301 من النسخة القديمة

---

#### المشكلة P2-6: Clarity script بدون `defer` في بعض الصفحات

- **الملفات:** `about/index.html:31-36`, `consultation/index.html:30-35`, `ai-agent/index.html:29-34`
- **التأثير:** متوسط — يمنع render ويزيد INP
- **الحل:** نقل Clarity لتحميل lazy عبر `performance-loader`

---

#### المشكلة P2-7: No IndexNow protocol support

- **الملف:** غير موجود
- **التأثير:** متوسط — فهرسة أبطأ على Bing وYandex
- **الحل:** إضافة دعم IndexNow (مفتاح موجود: `brightai-indexnow-key.txt`)

---

### 🟢 P3 — مشاكل منخفضة الأولوية (التراكمي)

---

#### المشكلة P3-1: `<meta name="language">` و `http-equiv="content-language"` زائدان

- **التأثير:** منخفض — `<html lang="ar-SA">` يكفي
- **الحل:** يمكن إزالتها لتقليل حجم الصفحة

---

#### المشكلة P3-2: ICBM و geo.position meta tags قديمة

- **التأثير:** منخفض — محركات البحث الحديثة لا تستخدمها
- **الحل:** يمكن إبقاؤها لكن لا فائدة SEO حقيقية

---

#### المشكلة P3-3: `<meta name="keywords">` مفقود في 188+ صفحة

- **التأثير:** منخفض — Google يتجاهله لكن Bing لا
- **الحل:** إضافة keywords لكل صفحة (25 صفحة فقط لديها حالياً)

---

#### المشكلة P3-4: `og:type` مفقود في بعض الصفحات

- **الملف:** `about/index.html`, `consultation/index.html`, وغيرها
- **التأثير:** منخفض
- **الحل:** إضافة `<meta content="website" property="og:type" />`

---

#### المشكلة P3-5: robots.txt يحجب مجلدات غير موجودة

- **الملف:** `robots.txt:61-74`
- **التأثير:** منخفض — `/src/`, `/dist/`, `/build/`, `/_next/`, `/.nuxt/` غير موجودة (موقع ثابت)
- **الحل:** يمكن تبسيط robots.txt بإزالة القواعد غير المطبقة

---

## 9. ملخص تنفيذي — أهم 10 مشاكل

| # | المشكلة | الأولوية | التأثير |
|:--|:--------|:---------|:--------|
| 1 | Sitemap لا يشمل صفحات `/en/` | P0 | عالي |
| 2 | صفحات مهمة مفقودة من Sitemap | P0 | عالي |
| 3 | `contact/` مفقود `hreflang="en-SA"` | P0 | عالي |
| 4 | `sectors/*-en.html` canonical بامتداد `.html` | P0 | عالي |
| 5 | `error.html` فيه canonical مع noindex | P0 | عالي |
| 6 | مفقود LocalBusiness Schema | P1 | عالي |
| 7 | مفقود BreadcrumbList Schema في أغلب الصفحات | P1 | عالي |
| 8 | مفقود Article Schema في المدونة | P1 | عالي |
| 9 | بريد شخصي في Organization Schema | P1 | عالي |
| 10 | خطوط Google Fonts تحظر Render | P1 | عالي |

---

## 10. خطة العمل الزمنية

### الأسبوع 1: إصلاحات P0 حرجة

| اليوم | المهمة | الملفات |
|:------|:-------|:--------|
| يوم 1 | إصلاح Sitemap: إضافة كل صفحات `/en/` مع hreflang ثنائي الاتجاه | `sitemap.xml` |
| يوم 1 | إضافة الصفحات المفقودة للـ Sitemap | `sitemap.xml` |
| يوم 2 | إصلاح hreflang في `contact/index.html` | `contact/index.html` |
| يوم 2 | فحص كل الصفحات والتأكد من اكتمال hreflang | جميع HTML |
| يوم 3 | إصلاح canonical في `sectors/*-en.html` | 6 ملفات sectors |
| يوم 3 | حذف canonical من `error.html` | `error.html` |
| يوم 4 | إصلاح `manifest.json` | `manifest.json` |
| يوم 5 | إضافة Google-Extended و Bytespider لـ robots.txt | `robots.txt` |

### الأسبوع 2: إصلاحات P1

| اليوم | المهمة | الملفات |
|:------|:-------|:--------|
| يوم 1-2 | إضافة LocalBusiness Schema للرئيسية | `index.html` |
| يوم 2-3 | إضافة BreadcrumbList Schema لكل صفحة | جميع HTML |
| يوم 3-4 | إضافة BlogPosting Schema لكل مقال مدونة | `blog/*.html` |
| يوم 4 | استبدال البريد الشخصي ببريد مؤسسي في Schema | `index.html`, `about/index.html` |
| يوم 5 | تحويل خطوط Google Fonts لتحميل محلي | `ai-workflows/`, `error.html`, `500.html` |

### الأسبوع 3: إصلاحات P2

| اليوم | المهمة | الملفات |
|:------|:-------|:--------|
| يوم 1-2 | تقليم Tailwind CSS (PurgeCSS) لتقليل الحجم من 183KB | `frontend/css/` |
| يوم 2-3 | تقليل `iconify-preload.js` | `frontend/js/iconify-preload.js` |
| يوم 3 | إضافة `og:image:width/height` و `og:locale:alternate` لكل صفحة | جميع HTML |
| يوم 4 | إصلاح مدونات مكررة (redirect + canonical) | `blog/*.html` |
| يوم 5 | نقل Clarity script لتحميل lazy | `about/`, `consultation/`, `ai-agent/` |

### الأسبوع 4: تحسينات P3 + IndexNow

| اليوم | المهمة | الملفات |
|:------|:-------|:--------|
| يوم 1 | إضافة دعم IndexNow | سكربت جديد |
| يوم 2 | إضافة `<meta name="keywords">` للصفحات الناقصة | 188+ صفحة |
| يوم 3 | إضافة `og:type` للصفحات الناقصة | ~20 صفحة |
| يوم 4 | إضافة صفحة شهادات عملاء (E-E-A-T) | صفحة جديدة |
| يوم 5 | إضافة رقم السجل التجاري في about و Schema | `about/index.html` |

---

## 11. قائمة Schema Markup المطلوب إضافتها

### 11.1 LocalBusiness (للرئيسية — إضافة بجانب Organization الموجود)

```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://brightai.site/#localbusiness",
  "name": "Bright AI",
  "alternateName": "مُشرقة للذكاء الاصطناعي",
  "url": "https://brightai.site/",
  "logo": {
    "@type": "ImageObject",
    "url": "https://brightai.site/assets/images/Gemini.png",
    "width": 512,
    "height": 512
  },
  "image": "https://brightai.site/assets/images/Gemini.png",
  "description": "شركة ذكاء اصطناعي في السعودية تقدم حلول AI للشركات والمؤسسات تشمل AI Agent، أتمتة العمليات، وتحليل البيانات ضمن حوكمة مؤسسية تدعم رؤية 2030.",
  "telephone": "+966538229013",
  "email": "info@brightai.site",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "طريق الملك فهد، العليا",
    "addressLocality": "الرياض",
    "addressRegion": "منطقة الرياض",
    "postalCode": "12211",
    "addressCountry": "SA"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 24.7136,
    "longitude": 46.6753
  },
  "openingHours": "Su-Th 09:00-18:00",
  "priceRange": "$$",
  "currenciesAccepted": "SAR",
  "paymentAccepted": "Cash, Credit Card, Bank Transfer",
  "areaServed": {
    "@type": "Country",
    "name": "Saudi Arabia"
  },
  "sameAs": [
    "https://api.whatsapp.com/send?phone=966538229013",
    "https://www.linkedin.com/company/brightai-saudi",
    "https://x.com/brightai_sa",
    "https://www.youtube.com/@BrightAiSaudi"
  ],
  "parentOrganization": {
    "@id": "https://brightai.site/#organization"
  }
}
```

### 11.2 BreadcrumbList (قالب لكل صفحة)

**لصفحة about:**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://brightai.site/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "من نحن",
      "item": "https://brightai.site/about/"
    }
  ]
}
```

**لصفحة services:**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://brightai.site/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "الخدمات",
      "item": "https://brightai.site/services/"
    }
  ]
}
```

**لصفحات sectors (مثال ecommerce):**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://brightai.site/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "القطاعات",
      "item": "https://brightai.site/sectors/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "التجارة الإلكترونية",
      "item": "https://brightai.site/sectors/ecommerce/"
    }
  ]
}
```

**لصفحات blog (مثال):**

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "الرئيسية",
      "item": "https://brightai.site/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "المكتبة الذكية",
      "item": "https://brightai.site/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "عنوان المقال",
      "item": "https://brightai.site/blog/SLUG/"
    }
  ]
}
```

### 11.3 BlogPosting (قالب لكل مقال مدونة)

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://brightai.site/blog/SLUG/#article",
  "headline": "عنوان المقال (أقل من 110 حرف)",
  "description": "وصف المقال (150-160 حرف)",
  "image": {
    "@type": "ImageObject",
    "url": "https://brightai.site/assets/images/IMAGE.webp",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Organization",
    "name": "Bright AI",
    "url": "https://brightai.site/"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Bright AI",
    "logo": {
      "@type": "ImageObject",
      "url": "https://brightai.site/assets/images/Gemini.png"
    }
  },
  "datePublished": "2026-04-07",
  "dateModified": "2026-04-13",
  "inLanguage": "ar-SA",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://brightai.site/blog/SLUG/"
  }
}
```

### 11.4 Service (قالب لصفحات الخدمات الفرعية)

```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": "https://brightai.site/smart-automation/#service",
  "name": "الأتمتة الذكية للشركات السعودية",
  "serviceType": "Smart Automation & RPA",
  "url": "https://brightai.site/smart-automation/",
  "description": "خدمات الأتمتة الذكية من Bright AI للشركات السعودية، تشمل RPA وربط الأنظمة وتنسيق سير العمل.",
  "provider": {
    "@id": "https://brightai.site/#organization"
  },
  "areaServed": {
    "@type": "Country",
    "name": "Saudi Arabia"
  }
}
```

### 11.5 IndexNow — إشعار فوري

```bash
# إرسال إشعار IndexNow (مثال بـ curl)
curl "https://api.indexnow.org/indexnow?key=brightai-indexnow-key&url=https://brightai.site/about/"

# إرسال عدة URLs دفعة واحدة
curl -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "brightai.site",
    "key": "brightai-indexnow-key",
    "urlList": [
      "https://brightai.site/",
      "https://brightai.site/about/",
      "https://brightai.site/services/"
    ]
  }'
```

---

## ملحق: خريطة hreflang المطلوبة

### الصفحات العربية التي تحتاج إصلاح hreflang

| الصفحة | ar-SA | en-SA | x-default | الحالة |
|:-------|:------|:------|:----------|:-------|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/about/` | ✅ | ✅ | ✅ | ✅ |
| `/ai-agent/` | ✅ | ✅ | ✅ | ✅ |
| `/ai-workflows/` | ✅ | ✅ | ✅ | ✅ |
| `/consultation/` | ✅ | ✅ | ✅ | ✅ |
| `/data-analysis/` | ✅ | ✅ | ✅ | ✅ |
| `/smart-automation/` | ✅ | ✅ | ✅ | ✅ |
| `/contact/` | ✅ | ❌ | ✅ | ⚠️ مفقود en-SA |
| `/services/` | ✅ | ❌ | ✅ | ⚠️ مفقود en-SA |
| `/health/` | ✅ | ❌ | ✅ | ⚠️ مفقود en-SA |
| `/privacy-cookies/` | ✅ | ❌ | ✅ | ⚠️ مفقود en-SA |
| `/terms/` | ✅ | ❌ | ✅ | ⚠️ مفقود en-SA |
| `/sectors/ecommerce/` | ✅ | ✅ | ✅ | ✅ (لكن canonical خاطئ في en) |

---

> **ملاحظة ختامية:** الموقع بُني بشكل جيد من ناحية البنية التقنية الأساسية (HTML ثابت، RTL صحيح، Service Worker، Critical CSS، defer/async). لكن يوجد **5 مشاكل P0 حرجة** تتعلق بـ Sitemap وhreflang وcanonical تمنع Google من فهرسة النسخ الإنجليزية واكتشاف صفحات مهمة، و**7 مشاكل P1** تتعلق بـ Schema الناقص والثقة المهنية. إصلاح الأسبوع الأول وحده سيرفع النتيجة التقنية من **62 إلى ~78**.

---

*تم إنشاء هذا التقرير بواسطة وكيل SEO التقني — BrightAI*  
*© 2026 Bright AI — مُشرقة للذكاء الاصطناعي*
