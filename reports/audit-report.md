# تقرير PR-1 Audit - BrightAI Static Website

تاريخ التدقيق: 2026-04-25

## نطاق التدقيق

- المصدر: `reports/keyword-mapping-2026.md`، قسم `جدول التوزيع`.
- عدد الكلمات في الخريطة: 50.
- عدد المسارات الفريدة المذكورة: 37.
- صفحات موجودة ومفحوصة فعلياً: 23.
- مسارات مقترحة غير موجودة: 14.
- لم يتم تعديل أي صفحة HTML أو CSS أو JS أو Schema أو محتوى فعلي.
- الملف الوحيد الذي تمت إضافته في PR-1 هو `audit-report.md`.

## قيود القياس

- Lighthouse لم يعمل داخل البيئة لأن حزمة `lighthouse` غير مثبتة محلياً، ولم يتم تنزيلها بسبب قيود الشبكة ونطاق PR-1.
- يوجد Chrome على المسار `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`، لذلك يمكن تشغيل Lighthouse محلياً عند توفر الحزمة.
- لم يتم اختراع أرقام `LCP` أو `INP` أو `CLS` أو `TTFB` أو `TBT`. الموجود أدناه هو static resource audit من ملفات المشروع.
- فحص `TL;DR` داخل أول `600px` تقريبي من ترتيب HTML، ولا يؤكد الظهور البصري بدون Rendering.

## ملخص عام

- `sitemap.xml`: موجود، 223 URL، الحجم 89.2KB.
- `robots.txt`: موجود، ولا توجد قواعد `Disallow` مانعة في الفحص النصي.
- كل الصفحات الموجودة ضمن خريطة الكلمات موجودة في `sitemap.xml` حسب الفحص النصي.
- كل الصفحات الموجودة لديها `canonical` و`H1` واحد.
- المشكلة المتكررة الأوضح: غياب ملخص AEO واضح في بداية معظم الصفحات وغياب `FAQPage` Schema عن معظم الصفحات.
- المسارات المقترحة غير الموجودة ليست أخطاء ملفات في PR-1، لكنها فجوات SEO/IA يجب جدولتها لاحقاً.

## Performance Static Audit

| الصفحة | HTML | CSS | JS | الصور | الخطوط | Requests متوقعة | ملاحظة |
|---|---:|---:|---:|---:|---:|---:|---|
| `/consultation/` | 59.7KB | 40.6KB | 111.4KB | 0 / 0.0KB | 0 / 0.0KB | 14 | ساكن |
| `/blog/vision-2030-ai-opportunities/` | 48.2KB | 40.0KB | 266.0KB | 0 / 0.0KB | 8 / 1189.3KB | 21 | JS مرتفع |
| `/about/` | 77.7KB | 39.1KB | 124.1KB | 0 / 0.0KB | 0 / 0.0KB | 15 | ساكن |
| `/machine-learning/` | 89.5KB | 58.5KB | 301.1KB | 0 / 0.0KB | 8 / 1189.3KB | 24 | JS مرتفع |
| `/sectors/ecommerce/` | 73.7KB | 101.2KB | 299.7KB | 0 / 0.0KB | 10 / 1576.6KB | 28 | JS مرتفع |
| `/en/consultation/` | 43.4KB | 31.8KB | 102.4KB | 0 / 0.0KB | 0 / 0.0KB | 12 | ساكن |
| `/services/` | 211.6KB | 81.8KB | 161.2KB | 0 / 0.0KB | 0 / 0.0KB | 7 | HTML كبير |
| `/data-analysis/` | 142.5KB | 59.9KB | 115.6KB | 6 / 51.7KB | 8 / 1189.3KB | 30 | HTML كبير |
| `/docs/solutions-bi/` | 78.4KB | 107.9KB | 236.3KB | 0 / 0.0KB | 10 / 1576.6KB | 27 | ساكن |
| `/tools/` | 82.1KB | 52.4KB | 300.4KB | 0 / 0.0KB | 8 / 1189.3KB | 28 | JS مرتفع |
| `/tenders/` | 131.4KB | 46.9KB | 62.2KB | 0 / 0.0KB | 0 / 0.0KB | 14 | HTML كبير |
| `/tenders/landing/` | 99.1KB | 32.6KB | 26.8KB | 0 / 0.0KB | 0 / 0.0KB | 7 | ساكن |
| `/smart-medical-archive/` | 102.4KB | 184.8KB | 433.1KB | 0 / 0.0KB | 10 / 1576.6KB | 46 | JS مرتفع، Requests كثيرة |
| `/sectors/healthcare/` | 75.4KB | 101.7KB | 298.7KB | 0 / 0.0KB | 10 / 1576.6KB | 27 | JS مرتفع |
| `/health/` | 75.0KB | 55.2KB | 369.3KB | 0 / 0.0KB | 0 / 0.0KB | 21 | JS مرتفع |
| `/smart-automation/` | 115.4KB | 40.3KB | 128.2KB | 0 / 0.0KB | 0 / 0.0KB | 14 | ساكن |
| `/sectors/logistics/` | 74.6KB | 101.7KB | 298.7KB | 0 / 0.0KB | 10 / 1576.6KB | 27 | JS مرتفع |
| `/docs/solutions-supply-chain/` | 76.4KB | 107.9KB | 236.4KB | 0 / 0.0KB | 10 / 1576.6KB | 27 | ساكن |
| `/ai-workflows/` | 102.9KB | 41.7KB | 299.4KB | 0 / 0.0KB | 0 / 0.0KB | 16 | JS مرتفع |
| `/blog/smart-inventory-management/` | 76.3KB | 50.1KB | 267.6KB | 1 / 4.3KB | 8 / 1189.3KB | 25 | JS مرتفع |
| `/interview/` | 67.8KB | 66.1KB | 143.5KB | 1 / 4.3KB | 0 / 0.0KB | 16 | ساكن |
| `/ai-bots/BrightRecruiter/` | 74.2KB | 39.2KB | 335.1KB | 0 / 0.0KB | 0 / 0.0KB | 19 | JS مرتفع |
| `/blog/nca-compliance/` | 86.4KB | 104.6KB | 296.1KB | 0 / 0.0KB | 10 / 1576.6KB | 26 | JS مرتفع |

## SEO / UX / AEO Page Audit

اختصار الأعمدة:

- `title/meta`: طول `title` وطول `meta description` بالأحرف.
- `sitemap/robots`: وجود الصفحة في `sitemap.xml` وسماح `robots.txt`.
- مخاطر UX هي مؤشرات ساكنة تحتاج فحصاً بصرياً، وليست حكماً نهائياً.

| الصفحة | title/meta | hreflang | JSON-LD | sitemap/robots | UX/UI | AEO/GEO |
|---|---:|---|---|---|---|---|
| `/consultation/` | 46 / 141 | ar-SA, en-SA, x-default | Service, LocalBusiness, BreadcrumbList | نعم / نعم | contrast، RTL left/right | لا TL;DR، لا FAQPage |
| `/blog/vision-2030-ai-opportunities/` | 52 / 172 | ar-SA, x-default | Article, BreadcrumbList | نعم / نعم | contrast، focus | لا FAQPage |
| `/about/` | 45 / 138 | ar-SA, en-SA, x-default | Organization, LocalBusiness, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/machine-learning/` | 43 / 129 | ar-SA, x-default | Service, LocalBusiness, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 22، RTL left/right | لا TL;DR، لا FAQPage |
| `/sectors/ecommerce/` | 55 / 147 | ar-SA, en-SA, x-default | Industry, Service, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |
| `/en/consultation/` | 41 / 175 | ar-SA, en-SA, x-default | LocalBusiness, BreadcrumbList, Service | نعم / نعم | contrast، RTL left/right | لا TL;DR، لا FAQ section، لا FAQPage |
| `/services/` | 75 / 156 | ar-SA, en-SA, x-default | Organization, WebSite, WebPage, BreadcrumbList, ItemList, FAQPage | نعم / نعم | RTL left/right | لا TL;DR |
| `/data-analysis/` | 43 / 167 | ar-SA, en-SA, x-default | Organization, LocalBusiness, WebPage, Service, BreadcrumbList | نعم / نعم | contrast، tap targets: 7، RTL left/right | لا TL;DR، لا FAQPage |
| `/docs/solutions-bi/` | 116 / 198 | ar-SA, en-SA, x-default | Service, BreadcrumbList, WebPage | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/tools/` | 50 / 174 | ar-SA, en-SA, x-default | CollectionPage, ItemList, BreadcrumbList, SoftwareApplication | نعم / نعم | contrast، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/tenders/` | 50 / 177 | ar-SA, en-SA, x-default | Organization, WebPage, BreadcrumbList, Service, SoftwareApplication | نعم / نعم | focus | لا TL;DR، لا FAQPage |
| `/tenders/landing/` | 53 / 119 | ar-SA, en-SA, x-default | WebPage, BreadcrumbList, Service, SoftwareApplication | نعم / نعم | RTL left/right | لا TL;DR، لا FAQPage |
| `/smart-medical-archive/` | 61 / 138 | ar-SA, en-SA, x-default | LocalBusiness, Service, BreadcrumbList, SoftwareApplication | نعم / نعم | contrast، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/sectors/healthcare/` | 58 / 150 | ar-SA, en-SA, x-default | Industry, Service, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |
| `/health/` | 55 / 147 | ar-SA, en-SA, x-default | MedicalOrganization, LocalBusiness, WebPage, Service, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/smart-automation/` | 56 / 134 | ar-SA, en-SA, x-default | Service, LocalBusiness, WebPage, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/sectors/logistics/` | 61 / 153 | ar-SA, en-SA, x-default | Industry, Service, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |
| `/docs/solutions-supply-chain/` | 122 / 204 | ar-SA, en-SA, x-default | Service, BreadcrumbList, WebPage | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/ai-workflows/` | 39 / 151 | ar-SA, en-SA, x-default | Service, LocalBusiness, BreadcrumbList | نعم / نعم | contrast، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage، الفقرة الأولى غير مقروءة ساكناً |
| `/blog/smart-inventory-management/` | 60 / 170 | ar-SA, x-default | Article, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |
| `/interview/` | 40 / 164 | ar-SA, en-SA, x-default | LocalBusiness, WebPage, Service, BreadcrumbList, SoftwareApplication | نعم / نعم | contrast، focus، tap targets: 14، RTL left/right | لا TL;DR، لا FAQPage |
| `/ai-bots/BrightRecruiter/` | 61 / 185 | ar-SA, en-SA, x-default | SoftwareApplication, BreadcrumbList, Service | نعم / نعم | contrast، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |
| `/blog/nca-compliance/` | 81 / 191 | ar-SA, x-default | Article, BreadcrumbList | نعم / نعم | contrast، focus، tap targets: 13، RTL left/right | لا TL;DR، لا FAQPage |

## المسارات المقترحة غير الموجودة

هذه المسارات مذكورة في خريطة الكلمات لكنها غير موجودة حالياً، لذلك لم يمكن فحص Performance أو SEO أو UX أو AEO لها:

| المسار | الملف المتوقع | الكلمات |
|---|---|---|
| `/data-ai-strategy/` | `data-ai-strategy/index.html` | `استراتيجية البيانات والذكاء الاصطناعي` |
| `/data-governance-ndmo/` | `data-governance-ndmo/index.html` | `حوكمة البيانات NDMO`، `تأسيس مكتب إدارة البيانات` |
| `/pdpl-ai-data-compliance/` | `pdpl-ai-data-compliance/index.html` | `الامتثال لنظام حماية البيانات PDPL` |
| `/en/data-sovereignty-cloud-ksa/` | `en/data-sovereignty-cloud-ksa/index.html` | `Data Sovereignty Cloud Solutions KSA` |
| `/blog/etimad-tenders-ai-guide/` | `blog/etimad-tenders-ai-guide/index.html` | `منصة اعتماد للمنافسات الحكومية` |
| `/procurement-automation/` | `procurement-automation/index.html` | `أتمتة المشتريات للشركات` |
| `/en/etimad-tender-translation-ai/` | `en/etimad-tender-translation-ai/index.html` | `Etimad Tender Translation AI` |
| `/blog/technical-financial-proposals-ai/` | `blog/technical-financial-proposals-ai/index.html` | `إعداد العروض الفنية والمالية` |
| `/supplier-risk-ai/` | `supplier-risk-ai/index.html` | `إدارة مخاطر الموردين AI` |
| `/genomic-data-ai/` | `genomic-data-ai/index.html` | `تحليل البيانات الجينية AI` |
| `/patient-appointment-automation/` | `patient-appointment-automation/index.html` | `أتمتة مواعيد المرضى` |
| `/ai-interview-assessment/` | `ai-interview-assessment/index.html` | `تقييم المقابلات بالذكاء الاصطناعي` |
| `/en/saudization-compliance-ai-tools/` | `en/saudization-compliance-ai-tools/index.html` | `AI Saudization Compliance Tools` |
| `/cybersecurity-consulting-saudi/` | `cybersecurity-consulting-saudi/index.html` | `استشارات الأمن السيبراني السعودية`، `حماية البنية التحتية الحساسة`، `أمن الحوسبة السحابية CCC`، `إدارة المخاطر السيبرانية بالذكاء الاصطناعي` |

## Duplicate Routes / Cannibalization

- ازدواجية ملفات مباشرة من نوع `/route.html` مع `/route/index.html`: لم تظهر ضمن المسارات المفحوصة.
- `/tenders/` و`/tenders/landing/` موجودتان كصفحتين منفصلتين. الخريطة تنص أن `/tenders/` يجب أن تبقى صفحة المنتج الأساسية، وأن `/tenders/landing/` صفحة عرض/تفصيل لا تستهدف نفس الكلمة الرئيسية.
- صفحات تستهدف أكثر من كلمة في الخريطة وتحتاج ضبط Intent لاحقاً:
  - `/data-analysis/`: `تحليل البيانات الضخمة السعودية`، `لوحات معلومات تفاعلية للشركات`.
  - `/data-governance-ndmo/`: `حوكمة البيانات NDMO`، `تأسيس مكتب إدارة البيانات`.
  - `/tenders/landing/`: `تحليل العقود الذكية السعودية`، `استكشاف مناقصات اعتماد بالذكاء الاصطناعي`.
  - `/smart-medical-archive/`: `الأرشيف الطبي الذكي بالذكاء الاصطناعي`، `السجلات الصحية الإلكترونية السعودية EHR`، `نظام معلومات المستشفيات HIS`.
  - `/smart-automation/`: `أتمتة العمليات الروبوتية RPA`، `الأتمتة الذكية للعمليات`، `أتمتة الفواتير والمشتريات`.
  - `/interview/`: `منصة توظيف بالذكاء الاصطناعي`، `التوظيف الذكي السعودية`.
  - `/ai-bots/BrightRecruiter/`: `نظام تتبع المتقدمين ATS السعودية`، `فرز السير الذاتية بالذكاء الاصطناعي`.
  - `/blog/nca-compliance/`: `الامتثال لمعايير NCA`، `ضوابط الأمن السيبراني الأساسية ECC`.
  - `/cybersecurity-consulting-saudi/`: أربع كلمات أمن سيبراني مذكورة لمسار واحد مقترح.

## Prioritized Issues

### Critical

- لا توجد مشكلة فهرسة حرجة ظاهرة ضمن الصفحات الموجودة: الصفحات المفحوصة لديها `canonical`، موجودة في `sitemap.xml`، و`robots.txt` لا يمنعها.

### High

- 14 مساراً في خريطة الكلمات غير موجودة فعلياً، ما يترك كلمات استراتيجية بلا صفحة قابلة للفهرسة أو التحويل.
- غياب `FAQPage` Schema عن معظم الصفحات ذات نية AEO/GEO، مع ظهور واضح له فقط في `/services/` ضمن الفحص الساكن.
- غياب `TL;DR` أو ملخص إجابي واضح في بداية معظم الصفحات، وهذا يضعف قابلية الاقتباس في AI Overviews ومحركات الإجابة.
- استخدام صفحات وثائقية أو مقالات كصفحات مال مؤقتة مثل `/docs/solutions-bi/`, `/docs/solutions-supply-chain/`, `/blog/nca-compliance/` يرفع خطر عدم تطابق نية البحث التجارية.

### Medium

- أحجام HTML مرتفعة في `/services/`, `/data-analysis/`, `/tenders/` وتحتاج قياس Lighthouse قبل أي تحسين.
- JS مرتفع في صفحات عديدة، خصوصاً `/smart-medical-archive/`, `/health/`, `/ai-bots/BrightRecruiter/`, `/tools/`, `/machine-learning/`.
- أوصاف meta طويلة في عدد من الصفحات، خصوصاً صفحات docs وبعض المقالات.
- مخاطر contrast وfocus وtap targets وRTL physical properties تحتاج فحصاً بصرياً على desktop/mobile قبل الإصلاح.
- صفحات المقالات العربية مثل `/blog/vision-2030-ai-opportunities/`, `/blog/smart-inventory-management/`, `/blog/nca-compliance/` لا تعلن `en-SA` في hreflang؛ قد يكون ذلك صحيحاً إن لم توجد نسخة إنجليزية، لكنه يحتاج قرار i18n واضح.

### Low

- الطلب ذكر `hreflang ar-SA/en/x-default` بينما التنفيذ الحالي يستخدم غالباً `en-SA`. يلزم اعتماد معيار واحد في PR لاحق.
- توثيق حدود `/tenders/landing/` داخل استراتيجية المحتوى لتجنب استهداف كلمة `/tenders/` نفسها.
- تحسين صياغة الفقرة الأولى في الصفحات المهمة لتجيب على نية الكلمة خلال 40-60 كلمة.

## Suggested PR Mapping

- PR-2: معالجة أساسيات SEO/AEO السهلة: `TL;DR`, FAQ sections حيث توجد أسئلة فعلية، وضبط meta الطويلة دون اختلاق محتوى.
- PR-3: هيكلة Cannibalization والصفحات المتداخلة: `/tenders/` مقابل `/tenders/landing/`, `/data-analysis/` مقابل `/docs/solutions-bi/`, `/smart-automation/` مقابل `/ai-workflows/`.
- PR-4: إنشاء أو جدولة الصفحات غير الموجودة في الخريطة بعد تأكيد وجود خدمة أو خبرة فعلية لكل كلمة، خاصة NDMO وPDPL وprocurement وcybersecurity.
- PR-5: Performance pass بعد Lighthouse: تقليل HTML الكبير، مراجعة JS/CSS، تحسين الصور والخطوط، وتثبيت CWV بأرقام فعلية.
- PR-6: UX/UI pass: contrast، focus-visible، tap targets، spacing، وRTL physical properties بعد فحص بصري على desktop/mobile.
- PR-7: International SEO pass: توحيد `hreflang` بين `en` و`en-SA`، إضافة علاقات ثنائية للصفحات الإنجليزية الموجودة، ومراجعة `x-default`.

## الملفات التي تم فحصها

- `consultation/index.html`
- `blog/vision-2030-ai-opportunities/index.html`
- `about/index.html`
- `machine-learning/index.html`
- `sectors/ecommerce.html`
- `en/consultation/index.html`
- `services/index.html`
- `data-analysis/index.html`
- `docs/solutions-bi.html`
- `tools/index.html`
- `tenders/index.html`
- `tenders/landing.html`
- `smart-medical-archive/index.html`
- `sectors/healthcare.html`
- `health/index.html`
- `smart-automation/index.html`
- `sectors/logistics.html`
- `docs/solutions-supply-chain.html`
- `ai-workflows/index.html`
- `blog/smart-inventory-management/index.html`
- `interview/index.html`
- `ai-bots/BrightRecruiter/index.html`
- `blog/nca-compliance/index.html`
- `reports/keyword-mapping-2026.md`
- `sitemap.xml`
- `robots.txt`

## طريقة تشغيل Lighthouse محلياً

```bash
cd /Users/yzydalshmry/Desktop/BRIGHTAI
npx http-server . -p 4173
npx lighthouse http://127.0.0.1:4173/tenders/ --preset=desktop --output=html --output-path=./reports/lighthouse-tenders.html --chrome-flags="--headless"
```

كرر الأمر مع كل مسار من الصفحات الموجودة في خريطة الكلمات. لا تستخدم أرقام Lighthouse في PR-1 إلا من تقارير مولّدة فعلياً.
