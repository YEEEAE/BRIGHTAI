# تقرير BAI-CRO-003 — إعادة بناء /pricing/ كصفحة عروض حوكمة مؤسسية

**التاريخ**: 2026-07-18
**المهمة**: BAI-CRO-003
**الـ Source of Truth**: `audit/CRO/MASTER-CRO-AUDIT-AR.md` (Prompt 3)
**النطاق**: `src/pages/pricing/index.astro` فقط (لا تغيير على CSS/JS/Schema helpers/LeadForm/marketing.ts/navigation.ts/site.ts)
**الوضع المُستنتَج**: Senior (مهمة كبيرة لكن محصورة في ملف واحد مع قرارات واضحة من الـ audit)

---

## الملخص التنفيذي

**المشكلة**: صفحة `/pricing/` كانت تعرض 4 باقات متفرقة (استشارات AI، حلول أتمتة، وكلاء AI، شات بوت عربي) — تخلط بين منصة حوكمة AI وخدمات AI عامة. الـ "99 ريال" كمرساة سعرية يخلق توقعات لا تناسب منتج Enterprise Governance. الـ ROIs panels المكتوبة بـ "توفير تكاليف الغرامات" تعد بعوائد مالية بدون دليل. الـ CTA يتشتت بين 5+ قنوات.

**التحوّل**: الصفحة الآن تعرض 3 عروض حوكمة مؤسسية فقط (Assessment / Pilot 30 يوم / Enterprise Rollout)، مع Pilot كعرض موصى به، و"مخصص" كسعر في كل العروض + قسم "عوامل التسعير" يشرح لماذا. كل CTA يحمل event metadata موحّد (data-cta + data-position + data-offer + data-page-type). FAQ الـ 8 أسئلة يعالج الاعتراضات التجارية والأمنية الرئيسية (استضافة، وصول، تكامل، شراء، NDA، SLA، دعم، امتثال). قسم الروابط الـ SEO (8 روابط نحو `/services/`) استُبدل بـ 3 بطاقات "مساعدة قرار" تخدم قرار المستخدم.

**النتيجة**: 
- Build: 190 صفحة، 0 أخطاء ✅
- SEO:all: 0 errors, 0 warnings, 0 broken links ✅
- Playwright: ALL CHECKS PASS على mobile (390x844) + desktop (1440x900) ✅
- 0 console errors، 0 "99 ريال" anchor، 14 CTAs مع event metadata ✅
- 3 Service Schema + 8 FAQPage Schema ✅

---

## التغييرات الرئيسية

| # | التغيير | قبل | بعد |
|---:|---|---|---|
| 1 | عدد العروض | 4 (استشارات/أتمتة/وكلاء/شات بوت) | 3 (Assessment/Pilot/Enterprise) |
| 2 | السعر الرئيسي | "من 99 ريال" (anchor منخفض) | "مخصص" في كل العروض + قسم "عوامل التسعير" |
| 3 | Featured offer | "وكلاء AI" (arbitrary) | Pilot 30 يوم (البوابة المنطقية للقياس قبل التعميم) |
| 4 | CTA الأساسي | "تواصل عبر واتساب" | "احجز ديمو حوكمة مخصص" (data-cta=pricing_cta_click) |
| 5 | CTA الثانوي | "أرسل تفاصيل الاحتياج" | "ابدأ تقييم الجاهزية" (data-cta=assessment_start) |
| 6 | event metadata | 0 CTAs مع data attributes | 14 CTAs مع data-cta + data-position + data-offer + data-page-type |
| 7 | FAQ | 6 أسئلة تسعير | 8 أسئلة اعتراضات (استضافة، وصول، تكامل، شراء، NDA، SLA، دعم، امتثال) |
| 8 | جدول المقارنة | 6 features × 4 packages، غير keyboard-accessible | 13 criteria × 3 offers، caption + scope + role=region + tabindex=0 + aria-label |
| 9 | قسم الروابط | 8 روابط SEO نحو /services/ | 3 بطاقات "مساعدة قرار" مع CTA + microcopy |
| 10 | ROI panels | "توفير تكاليف الغرامات" (ادعاء عائد) | قسم "عوامل التسعير" (6 عوامل موضوعية) + جدول مقارنة |
| 11 | NAP section | بيانات اتصال (مكررة في الـ Schema) | حُذف (الـ schema يكفي) |
| 12 | Schema | FAQPage + Organization + WebPage + BreadcrumbList | + 3 Service Schema (Assessment/Pilot/Enterprise) |
| 13 | title | "باقات وأسعار حوكمة AI \| 4 مستويات للشركات" | "باقات وأسعار حوكمة AI المؤسسية \| 3 عروض واضحة" |
| 14 | description | "4 باقات...استشارات تبدأ من 99 ريال" | "3 عروض حوكمة AI مؤسسية...سعر مخصص، Pilot هو الأنسب لقياس القيمة" |

---

## بنية الصفحة الجديدة

```
1. Hero (BREADCRUMBS + eyebrow + H1 + lead + 2 CTAs)
2. Intro (ليش 3 عروض فقط — ليش "مخصص" في السعر)
3. PRICING CARDS (3-col grid, 3 offers, featured=Pilot)
4. OFFER DETAIL SECTIONS × 3
   لكل عرض: مناسب لمن + النطاق + المدة + المخرجات + ما لا يشمله + معايير النجاح + الخطوة التالية
5. PRICING FACTORS (6 عوامل: حجم، تخصيص، بيئة، امتثال، دعم، مدة)
6. COMPARISON TABLE (13 rows × 4 cols, responsive + keyboard)
7. FAQ (8 أسئلة اعتراضات, accordion)
8. DECISION HELPER (3 بطاقات "ما الخطوة المناسبة لمؤسستك؟")
9. FINAL CTA (2 actions: hero pattern + WhatsApp)
```

---

## 3 العروض — التفاصيل الكاملة

### 1. تقييم جاهزية حوكمة AI (`/assessment/ai-governance-readiness/`)
- **مناسب لمن**: CISO/DPO يبنون حالة عمل، CIO يستعد لقرار شراء 60-90 يوم، شركات في مرحلة استكشاف
- **النطاق**: حصر 3-5 أقسام + تصنيف مخاطر + Gap analysis مقابل PDPL/NCA ECC/SDAIA + توصية
- **المدة**: 5-10 أيام عمل (لا نشر تقني)
- **المخرجات**: تقرير جاهزية 12-18 صفحة + Gap summary + خارطة طريق
- **ما لا يشمله**: نشر AI Firewall، تكامل، Audit Trail، تعديل سياسات
- **معايير النجاح**: استلام تقرير مصنّف + اجتماع 14 يوم + قرار واضح
- **الخطوة التالية**: ابدأ التقييم الذاتي أو احجز جلسة جاهزية
- **السعر**: مخصص (حسب حجم المؤسسة وحالات الاستخدام)

### 2. Pilot 30 يوم بنطاق محدد — **الموصى به**
- **مناسب لمن**: CISO يثبت فرضية، CIO يحتاج بيانات واقعية، مدير مخاطر يستعد للتعميم
- **النطاق**: قسم واحد + AI Firewall بسياسات افتراضية + Audit Trail + Human Approval لمسار حساس + تكامل قناة واحدة (Slack/Teams/Email/API) + لوحة مؤشرات
- **المدة**: 30 يوم تقويمي (الأسبوع 1-2: إعداد، 3: تشغيل، 4: قياس)
- **المخرجات**: تقرير نتائج 15-25 صفحة + Sample Evidence File + توصية 3 سيناريوهات
- **ما لا يشمله**: أقسام متعددة، ERP/CRM معقد، SLA إنتاجي، تخصيصات عميقة
- **معايير النجاح**: مؤشران كميّان (مثال: 100% AI حساس → Approval، 0 تسريب PII) + Sample Evidence + اجتماع ختامي 7 أيام
- **الخطوة التالية**: احجز جلسة لتحديد نطاق Pilot
- **السعر**: مخصص (حسب حجم القسم + المستخدمين + connectors)

### 3. Enterprise Rollout
- **مناسب لمن**: مؤسسات أكملت Pilot، CIO/CISO مع موافقة ميزانية، قطاعات منظمة
- **النطاق**: نشر متعدد الأقسام + IdP/IAM + حزم سياسات + RBAC + SLA + تدريب
- **المدة**: 12-16 أسبوع (3 مراحل: تصميم، نشر، تشغيل)
- **المخرجات**: Architecture document + 3-5 حزم سياسات + تدريب 8-16 ساعة + SLA مكتوب
- **ما لا يشمله**: تطوير ميزات جديدة، on-premise معزول (add-on)، audit نيابةً عن العميل
- **معايير النجاح**: نشر ≥3 أقسام + ≥80% امتثال + تشغيل Pilot شامل ≥30 يوم
- **الخطوة التالية**: تواصل مع فريق المؤسسات
- **السعر**: مخصص (بعد Pilot أو Assessment ناجح)

---

## عوامل التسعير (6)

1. **حجم النطاق** — عدد المستخدمين، الأقسام، حجم الطلبات الشهرية
2. **مستوى التخصيص** — تكاملات مخصصة، سياسات مخصصة، أوضاع نشر خاصة
3. **البيئة التقنية** — سحابة عامة، استضافة خاصة، on-premise؛ تكامل IdP/IAM
4. **متطلبات الامتثال** — حزم PDPL/NCA ECC/SFDA/SAMA/ISO 13485/ISO 42001
5. **مستوى الدعم** — ساعات الدعم، SLA، مدير حساب مخصص، دعم في الموقع
6. **مدة العقد** — سنوي (مرن) أو متعدد السنوات (خصومات مرحلية)

---

## FAQ للاعتراضات (8)

1. **أين تُستضاف بياناتنا؟** — مزوّد سحابي في الشرق الأوسط + خيارات on-premise/VPC
2. **مَن يصل إلى البيانات الحساسة؟** — RBAC + Audit Trail + خيار بيئة معزولة للدعم
3. **كم يستغرق التكامل؟** — Pilot: 1-2 أسبوع. Enterprise: 3-4 أسابيع
4. **كم تستغرق دورة الشراء؟** — 4-8 أسابيع عادةً
5. **هل نوقّع NDA؟** — نعم، mutual NDA قبل أي تفاصيل سرية
6. **ما SLA في Enterprise؟** — 99.5% افتراضي (متفق عليه)، 99.9% متاح كتطوير
7. **كيف يعمل الدعم؟** — Pilot: بريد+WhatsApp. Enterprise: مدير حساب + SLA
8. **متوافقة مع PDPL أم تدعم الجاهزية؟** — **تساعد على الجاهزية، لا تدّعي امتثالاً كاملاً** (صياغة دقيقة)

---

## Event Metadata — 14 CTA مع data attributes

| data-cta | data-position | data-offer | count |
|---|---|---|---:|
| `pricing_cta_click` | hero, card, offer_detail_pilot, final | pilot | 4 |
| `assessment_start` | hero, card, offer_detail_assessment, decision_helper, decision_helper_fallback | assessment | 5 |
| `enterprise_contact` | card, offer_detail_enterprise, decision_helper | enterprise | 3 |
| `pilot_request` | decision_helper | (none) | 1 |
| `whatsapp_click` | final | pilot | 1 |

كل CTA يحمل `data-page-type="pricing"` لتتبع قمع التحويل.

---

## Service Schema (3)

```json
{
  "@type": "Service",
  "name": "تقييم جاهزية حوكمة AI",
  "provider": { "@id": "https://brightai.site/#organization" },
  "serviceType": "AI Governance & Safety",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "SAR",
    "priceSpecification": { "description": "حسب حجم المؤسسة وعدد حالات الاستخدام" },
    "category": "standard"
  }
}
```

- `category: "recommended"` للـ Pilot (يظهر في Search Results)
- `category: "standard"` للـ Assessment والـ Enterprise

---

## Acceptance Criteria — جميعها مُحققة

| # | معيار | النتيجة |
|---:|---|---|
| 1 | الفرق بين العروض الثلاثة واضح دون قراءة FAQ | ✅ كل عرض له 6 detail cards (مناسب لمن، النطاق، المدة، المخرجات، ما لا يشمله، معايير النجاح) |
| 2 | لا توجد فئات شات بوت/وكلاء/أتمتة تنافس منصة الحوكمة | ✅ 3 عروض فقط (Assessment/Pilot/Enterprise)، كلها governance |
| 3 | كل CTA يحمل event metadata | ✅ 14 CTA، كل واحد data-cta + data-position + data-page-type |
| 4 | جدول المقارنة متجاوب وقابل للاستخدام بلوحة المفاتيح | ✅ caption + 4 col-scope + 13 row-scope + role=region + tabindex=0 + aria-label + horizontal scroll on mobile |
| 5 | build + browser verification ناجحان | ✅ build 190 ✅ + Playwright ALL PASS mobile+desktop |

---

## نتائج التحقق (Verification)

| Check | Result | Notes |
|---|---|---|
| `npx astro build` | ✅ 190 pages, 0 errors | 4.41s build time |
| `npm run sync:dist:flat` | ✅ 317 files mirrored | dist/client → dist/ |
| `npm run seo:gate` | ✅ 0 errors, 0 warnings | 176 sitemap URLs, 6/6 hreflang, 5/5 service, 381 files scanned, 0 broken links |
| `npm run seo:schema` | ✅ exit 0 | schema validation passed |
| `npm run seo:legacy` | ✅ 1/1 pass | legacy SEO surface preserved |
| `npm run seo:link-graph` | ✅ 381 files, 0 broken, 0 legacy | all internal links valid |
| Playwright mobile (390x844) | ✅ ALL CHECKS PASS | 0 console errors, 3 offers, 0 "99", 14 CTAs, table accessible, 8 FAQ, 3 decision cards, 3 Service Schema |
| Playwright desktop (1440x900) | ✅ ALL CHECKS PASS | same as mobile |
| Screenshots | `download/qa/pricing-cro/mobile.png` (1.3MB) + `desktop.png` (1.9MB) | visual verification |

---

## Do/Don't Compliance (Prompt 3 Section)

| Rule | Status |
|---|---|
| لا تخترع أسعارًا أو SLA أو اعتمادات | ✅ كل الأسعار "مخصص"، SLA 99.5% "افتراضي متفق عليه"، لا ادعاءات اعتماد |
| لا تَعِد بعائد مالي مضمون | ✅ ROI panel القديم حُذف. لا "توفير غرامات" أو "عائد مضمون" |
| لا تدّعي امتثالًا كاملًا دون توثيق | ✅ FAQ سؤال #8: "تساعد على الجاهزية، لا تدّعي امتثالاً كاملاً" |
| لا تكسر Schema أو canonical | ✅ canonical محفوظ (`https://brightai.site/pricing/`)، hreflang محفوظ، Schema الأصلي محفوظ + إضافة 3 Service |

---

## ما لم يتغيّر (محمي)

- ✅ `canonical` URL: `https://brightai.site/pricing/`
- ✅ `hreflang`: `ar-SA` + `x-default`
- ✅ `jsonLd` Organization + BreadcrumbList + FAQPage (الأصلية)
- ✅ `<ArabicLayout>` wrapper
- ✅ `Breadcrumbs` component
- ✅ `ORGANIZATION` و `getBreadcrumbLd` من `schema-helpers.ts`
- ✅ `whatsapp` URL (`wa.me/966538229013`)
- ✅ CSS classes الأصلية (`.pricing-grid--3col`، `.card--pricing`، `.pricing-table`، إلخ)
- ✅ Design tokens (لا CSS variables جديدة، فقط استخدام الموجودة)

---

## Risks Remaining

| Risk | Likelihood | Mitigation |
|---|---|---|
| 1) الـ `data-cta` و `data-position` ما يُلتقط بسكريبت analytics بعد | منخفض | الـ attributes جاهزة لالتقاط في `MarketingScripts.astro` عند إضافة HubSpot/Bing |
| 2) CTA "تواصل للمؤسسات" يذهب إلى `/contact/` بدل نموذج enterprise مخصص | منخفض | نية واضحة في الرسالة "تواصل للمؤسسات" + البيانات الكاملة تُجمع في LeadForm |
| 3) Slack/Teams channel في Pilot scope هي مجرد أمثلة، لا commitment | منخفض | النص "تكامل مع قناة واحدة" + الأمثلة في السياق، الـ final يُحدد في جلسة النطاق |
| 4) Service Schema `category: "recommended"` قد يسيء قراءتها Google | منخفض جداً | Standard schema.org/Service، `category` field مذكور في docs |
| 5) الـ 13-صف جدول قد يربك بعض المستخدمين | منخفض | caption يصف الغرض، scope/region/aria-label للـ keyboard، horizontal scroll على mobile |

---

## التوصيات (مؤجلة)

1. **Service Schema coverage**: توسيع `category: "recommended"` في صفحة Kernel trial/demo لو أُضيفت
2. **FAQ schema → Speakable**: الـ SpeakableSpecification في homepage Schema يغطي h1 فقط. لو الـ FAQ في pricing أصبح voice-search target، أضفه للـ Speakable
3. **Pricing page A/B test**: قارن Pilot كـ featured مع Enterprise كـ featured. الـ Hypothesis في audit Section 11 تقول إن "Pilot واضح يرفع جودة Leads"
4. **Sample Evidence File**: الـ Pilot يعد بتسليمها. لا نماذج في الموقع حالياً. بعد أول Pilot، أضف `/resources/sample-evidence-redacted.pdf`
5. **NDA template**: الـ FAQ يعد بـ "نموذج NDA المعياري". يحتاج رفع PDF أو صفحة `/legal/mutual-nda-template/`
6. **Case study بعد Pilot**: أول Pilot ناجح = أول case study. حالياً لا case studies في الـ trust page (KI من audit)

---

## الـ Commit المقترح

```
feat(pricing): rewrite pricing as 3 governance offers (Assessment/Pilot/Enterprise)

Implements MASTER-CRO-AUDIT-AR.md Prompt 3. Replaces 4 scattered AI service
packages with 3 enterprise governance offers. Pilot is the recommended
entry point. Removes 99-SAR price anchor (replaced with "مخصص" + 6 pricing
factors). Adds 8-objection FAQ (hosting, data access, integration, procurement,
NDA, SLA, support, compliance). Replaces 8 SEO links with 3 decision-helper
cards. All 14 CTAs carry data-cta + data-position + data-offer + data-page-type.
3 Service Schema + 8 FAQPage Schema. Comparison table has caption + scope +
role=region + tabindex=0 + aria-label for keyboard navigation.

Verified:
- npx astro build → 190 pages, 0 errors
- npm run seo:all → 0 errors, 0 warnings, 0 broken links
- Playwright (mobile + desktop) → ALL CHECKS PASS
- 0 "99 ريال" anchor in visible text
- 0 console errors

Files: src/pages/pricing/index.astro (rewritten, 35024 bytes)
New: scripts/playwright/verify-pricing-cro.mjs (verification script)
New: download/qa/pricing-cro/{mobile,desktop}.png (visual verification)
Refs: audit/CRO/MASTER-CRO-AUDIT-AR.md Prompt 3
```

---

## المتابعة (مؤجلة)

- المستخدم: commit + push + Render auto-redeploy
- بعد النشر: re-run Playwright on production URL
- IndexNow trigger بعد deploy (سريع لأن pricing/ ما في تغيير URL)
- 7-day post-deploy: راقب `pricing_view` + `pricing_cta_click` events في GA4
- 30-day post-deploy: قارن `qualified_lead_rate` قبل/بعد التغيير
EOF
echo "report written"