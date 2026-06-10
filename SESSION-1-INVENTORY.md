# 📦 SESSION 1 — DISCOVERY & INVENTORY

**المشروع:** `brightai.site` — Saudi AI Safety OS
**الفرع:** `brightai-middle-east` (مشتق من `main`)
**نوع المشروع:** موقع HTML ثابت (Static Site) — **ليس** Next.js/React
**تاريخ الجرد:** 2026-06-10
**الوضع:** READ-ONLY (لا تعديل على ملفات الإنتاج)

---

## 1. 🏗️ نظرة عامة على البنية (Architecture)

| البند | القيمة |
|-------|--------|
| **النوع** | موقع HTML ثابت يُخدَّم مباشرة (لا build للصفحات) |
| **Monorepo** | `npm workspaces` → workspace واحد: `frontend` |
| **Node** | `>=22 <23` |
| **النشر** | Render (`render.yaml`) + GitHub Pages (`CNAME`, `.nojekyll`) |
| **النطاق** | `brightai.site` |
| **اللغة الأساسية** | عربي `lang="ar-SA" dir="rtl"` |
| **اللغة الثانوية** | إنجليزي `/en/` (صفحات قانونية فقط) |
| **التحليلات** | Google Analytics `gtag.js` (G-8LLESL207Q) |
| **PWA** | نعم — `manifest.webmanifest` + `sw.js` (الموقع + Kernel منفصل) |

### أدوات البناء والصيانة (scripts/)
البناء لا يولّد الصفحات، بل يعالج الأصول وSEO:
- `build:assets` → tailwind purge + CSS bundle + minify + audit fixes + schema sync
- `seo:*` → فحص صحة SEO + تدقيق Schema + بوابة CI
- `sitemap:generate` → توليد خريطة الموقع لكل الصفحات
- `indexnow:*` → دفع التحديثات لمحركات البحث (IndexNow)
- `internal-links:*` → تدقيق وإصلاح الروابط الداخلية
- `test:kernel` → `vitest` لاختبارات Kernel

---

## 2. 🗺️ جرد الصفحات (Page Inventory)

**إجمالي ملفات HTML:** `129`

### أ) الصفحات الرئيسية (Top-Level)
| المسار | الوصف |
|--------|-------|
| `/` (index.html) | الصفحة الرئيسية — Saudi AI Safety OS |
| `/about/` | من نحن |
| `/services/` | الخدمات (صفحة واحدة مجمّعة) ⚠️ |
| `/pricing/` | الأسعار |
| `/contact/` | التواصل |
| `/demo/` | الديمو التجريبي |
| `/trust/` | مركز الثقة |
| `/report/` | تقرير التحليل |
| `/hub/` | المركز المعرفي (5 صفحات) |
| `/sitemap/` | خريطة الموقع (HTML) |
| `/assessment/` | تقييم الجاهزية |
| `/authors/` | المؤلفون |
| `/plugins/` | الإضافات |

### ب) الصفحات القانونية (Legal)
`/privacy-policy/`, `/privacy-cookies/`, `/cookie-policy/`, `/terms/`,
`/data-processing-agreement/`, `/pdpl-statement/`
+ نسخ إنجليزية تحت `/en/` (cookie-policy, data-processing-agreement, pdpl-statement, privacy-policy, terms)

### ج) أقسام المحتوى (Content Sections)
| القسم | عدد الصفحات | ملاحظات |
|-------|:----------:|---------|
| **Solutions** | 14 صفحة | حلول قطاعية + منتجات (banking, healthcare, government, manufacturing…) |
| **Blog** | 22 مقال + index + feed.xml | محتوى حوكمة/امتثال سعودي |
| **Docs** | 28 صفحة + index | توثيق منتج + أدلة تنظيمية (PDPL, NCA-ECC, SDAIA, ISO-42001) |
| **Hub** | 5 صفحات | مركز معرفي |

### د) صفحات النظام
`/404.html`, `/500.html`, `/error.html`, `/offline/`

---

## 3. 🎯 جرد KERNEL (قلب المنتج)

**الموقع:** `/kernel/` — تطبيق PWA مستقل (manifest + sw.js خاص)

### صفحات Kernel (12 صفحة HTML)
| # | الصفحة | الملف | robots |
|---|--------|-------|:------:|
| 1 | لوحة التحكم | `kernel/index.html` | ✅ index, follow |
| 2 | المحادثة | `kernel/chat.html` | ✅ index, follow |
| 3 | سجل التدقيق | `kernel/audit.html` | ✅ index, follow |
| 4 | الموافقات | `kernel/approvals.html` | ✅ index, follow |
| 5 | الإحصائيات | `kernel/stats.html` | ✅ index, follow |
| 6 | التكاملات | `kernel/connectors.html` | ✅ index, follow |
| 7 | السيناريوهات | `kernel/scenarios.html` | ✅ index, follow |
| 8 | السياسات | `kernel/policies.html` | ✅ index, follow |
| 9 | ملف الأدلة | `kernel/evidence.html` | ✅ index, follow |
| 10 | الامتثال | `kernel/compliance.html` | ✅ index, follow |
| 11 | التقارير | `kernel/reports.html` | ✅ index, follow |
| 12 | Offline | `kernel/offline.html` | ✅ index, follow |

> **ملاحظة على البريفنغ:** الموجز ذكر 11 صفحة. الواقع 12 صفحة HTML فعلية (مع `offline.html`). كل الـ11 المطلوبة موجودة. `/reports` موجودة كـ `reports.html` (مش بدون امتداد).

### بنية Kernel التقنية
```
kernel/
├── *.html                    (12 صفحة)
├── assets/
│   ├── css/kernel.css        (CSS أساسي)
│   ├── css/pages/*.css       (11 ملف CSS لكل صفحة)
│   └── js/kernel-*.js        (19 ملف JS: api, chat, compliance,
│                              command-palette, nav, notifications,
│                              onboarding, pwa, reports, stats, utils…)
├── api/mock/*.json           (8 ملفات بيانات وهمية:
│                              approvals, audit, compliance, connectors,
│                              evidence, policies, scenarios, stats)
├── tests/*.test.js           (4 اختبارات vitest + setup)
├── manifest.json             (PWA)
├── sw.js                     (Service Worker)
├── kernel-perf.js
└── kernel-web-vitals.js
```

### ملاحظات Kernel
- ✅ **فهرسة سليمة:** كل الصفحات `index, follow` — مطابقة للقاعدة #1.
- 🟡 **بيانات وهمية:** يعمل على `api/mock/*.json` (demo mode) — لا backend حقيقي مربوط في الواجهة الثابتة.
- 🟡 **ثقل CSS:** ملف CSS منفصل لكل صفحة (احتمال render-blocking).

---

## 4. 🚨 مخالفات القاعدة #1 (INDEX EVERYTHING)

تم العثور على **16 صفحة** تحمل `noindex` — تخالف القاعدة الصارمة:

| المجموعة | العدد | المسار | الحالة الحالية |
|----------|:-----:|--------|----------------|
| **مكتبة المكوّنات** | 15 | `/components/*.html` | `noindex, nofollow` + `Disallow` في robots.txt |
| **عرض الخطوط** | 1 | `/frontend/font-demo.html` | `noindex` + `Disallow` في robots.txt |

> صفحات `/components/` هي عروض مكوّنات UI داخلية (badge, button, card, modal, table, toast…).
> **قرار مطلوب في SESSION 2/4:** هل تُفهرس فعلاً (التزاماً بالقاعدة #1) أم تُعتبر استثناء تقني؟ حالياً محظورة في `robots.txt` أيضاً.
>
> ✅ **توضيح مهم:** `/report/index.html` **سليمة** (`index, follow`) — كلمة "noindex" ظهرت داخل نص JSON تحليلي وليست وسم meta.

---

## 5. 🌐 حالة SEO والـ i18n

| البند | الحالة |
|-------|--------|
| `robots.txt` | ✅ موجود — Allow الكل عدا `/components/` و `font-demo` |
| `sitemap.xml` | ✅ موجود (36KB، يُولَّد آلياً) |
| `llms.txt` / `llms-full.txt` | ✅ موجود — تعريف للـ AI crawlers |
| `ai.txt` | ✅ موجود |
| `humans.txt` | ✅ موجود |
| `manifest.webmanifest` | ✅ موجود |
| `_headers` / `_redirects` | ✅ موجود (Netlify-style) |
| `redirects.json` | ✅ موجود (25KB) |
| `schema-saudi-seo.json` | ✅ Schema منظم للسوق السعودي |
| **hreflang** | 🟡 `ar-SA` + `x-default` فقط — الإنجليزي (`/en/`) غير مربوط بـ hreflang في كل الصفحات |
| **اللهجة السعودية** | 🟡 يحتاج تدقيق محتوى (SESSION 3) |

---

## 6. ⚠️ ملاحظات ومخاطر أولية (للجلسات القادمة)

| # | الملاحظة | الخطورة | الجلسة |
|---|----------|:-------:|:------:|
| 1 | صفحة `/services/` واحدة مجمّعة بلا صفحات فرعية | 🔴 حرجة | S3 |
| 2 | `/components/*` + `font-demo` تحمل `noindex` (مخالفة القاعدة #1) | 🟠 عالية | S2/S4 |
| 3 | hreflang لا يربط النسخة الإنجليزية بشكل كامل | 🟡 متوسطة | S4 |
| 4 | Kernel يعمل ببيانات mock فقط (لا backend مربوط بالواجهة) | 🟡 متوسطة | S2 |
| 5 | ثقل CSS (ملف لكل صفحة Kernel) — احتمال render-blocking | 🟡 متوسطة | S2 |
| 6 | لا صفحات استهداف مدن (جدة، الدمام، الخبر) | 🟡 متوسطة | S3 |
| 7 | محتوى المدونة جيد (22 مقال) لكن يحتاج تدقيق لهجة | 🟢 منخفضة | S3 |

---

## 7. 📊 ملخص رقمي

```
إجمالي صفحات HTML:        129
├── Kernel:               12  (كلها مفهرسة ✅)
├── Solutions:            14
├── Blog:                 22 مقال (+ index + feed)
├── Docs:                 28 (+ index)
├── Hub:                   5
├── صفحات رئيسية:         ~13
├── صفحات قانونية:        ~11 (عربي + en)
├── مكوّنات (noindex):    15  ⚠️
└── نظام/أخرى:            ~9

مخالفات القاعدة #1:       16 صفحة (components + font-demo)
لغات:                     عربي (أساسي) + إنجليزي (قانوني فقط)
نوع التقنية:              HTML ثابت + Vanilla JS + Tailwind (purged)
```

---

## ✅ جاهز للانتقال إلى SESSION 2 — Kernel Deep Analysis

**المدخلات الجاهزة لـ S2:**
- خريطة Kernel كاملة (12 صفحة + 19 JS + 8 mock + 4 tests)
- نقاط فحص: حالة الفهرسة (✅)، البيانات الوهمية، ثقل CSS
- المخرَج المتوقع: `SESSION-2-KERNEL-AUDIT.md`
