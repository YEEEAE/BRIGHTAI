# تقرير M23 + M24 — بناء /kernel/reports/ + /kernel/stats/ كامل

**التاريخ**: 2026-08-01
**الوكيل**: BrightAI Workspace Agent
**المهمة**: نفّذ M23 و M24 (Reports + Stats) حسب Prompt 23
**الوضع**: Senior

## الملخص التنفيذي

بنيت M23 (Reports) و M24 (Stats) كاملين بنفس نمط M14–M20 (مولّد حتمي + UMD mirror + محرك vanilla + CSS + verify gate). الصفحتين كانتا موجودتين قبل بس ناقصتين ميزات جوهرية من Prompt 23. الحين صارت كل ميزات M23 و M24 مغطّية:

**Reports (M23)**: 42 تقرير حتمي + 7 أنواع (governance/compliance/audit/risk/custom/pii/connectors) + 4 صيغ (PDF/JSON/CSV/XLSX) + 5 لغات (ar/en/fr/es/de) + report builder بصري (drag & drop widgets) + preview drawer بملخص تنفيذي + template versions بـ hash chain + Trace coverage + Certificate coverage + role recipients + scheduled reports.

**Stats (M24)**: 12,483 طلب + 6 KPIs clickable → audit + Chart.js (line + doughnut) + top users (10) + top departments (7) + top models by cost (5) + live event stream + pause + period comparison + alerts (4) + quotas (7) + cost + latency (P50/P95/P99).

## الملفات المتأثرة

### M23 — Reports

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/data/kernel-reports.ts` | NEW | مولّد حتمي: 42 تقرير + 4 scheduled + 5 template versions |
| `public/js/kernel-reports-data.js` | NEW | UMD mirror بايت-بايت |
| `public/js/kernel-reports.js` | NEW | محرك vanilla JS: filters + wizard + builder + preview + versions |
| `src/pages/kernel/reports.astro` | REBUILT | 3 تبويبات: Library \| Builder \| Versions |
| `kernel/assets/css/pages/reports.css` | REBUILT | tabs + filters + list + builder + preview + versions |
| `scripts/verify-reports.mjs` | NEW | 25 فحص تحقق |
| `package.json` | EDITED | `verify:reports` script |

### M24 — Stats

| الملف | نوع التغيير | الوصف |
|---|---|---|
| `src/data/kernel-stats.ts` | NEW | مولّد حتمي: 12,483 طلب + time series + top users/departments/models + live events + alerts + quotas + cost + latency |
| `public/js/kernel-stats-data.js` | NEW | UMD mirror بايت-بايت |
| `public/js/kernel-stats.js` | NEW | محرك vanilla JS: KPIs + charts + tables + live stream + panels |
| `src/pages/kernel/stats.astro` | REBUILT | range tabs + KPIs + charts + top row + stream row + panels row |
| `kernel/assets/css/pages/stats.css` | NEW | KPIs + charts + tables + stream + panels |
| `scripts/verify-stats.mjs` | NEW | 22 فحص تحقق |
| `package.json` | EDITED | `verify:stats` script |

## تغطية ميزات Prompt 23

### Reports

| الميزة المطلوبة | الحالة | كيف |
|---|---|---|
| governance report | ✅ | نوع `governance` في REPORT_TYPES |
| compliance report | ✅ | نوع `compliance` |
| audit report | ✅ | نوع `audit` |
| risk report | ✅ | نوع `risk` |
| custom report | ✅ | نوع `custom` |
| PDF | ✅ | صيغة `PDF` في REPORT_FORMATS |
| JSON | ✅ | صيغة `JSON` |
| CSV | ✅ | صيغة `CSV` |
| report preview | ✅ | درج معاينة بعارض داخلي |
| report builder | ✅ | drag & drop widgets على قماش A4 |
| widgets: KPI | ✅ | نوع `kpi` في REPORT_WIDGETS |
| widgets: chart | ✅ | نوع `chart` |
| widgets: table | ✅ | نوع `table` |
| widgets: text | ✅ | نوع `text` |
| widgets: page break | ✅ | نوع `page-break` |
| executive summary | ✅ | مولّد آليًا بـ 3 جمل في preview |
| five languages | ✅ | ar/en/fr/es/de + مبدّل |
| scheduled reports | ✅ | 4 جداول (3 نشطة + 1 موقوفة) |
| role recipients | ✅ | CISO/DPO/Governance/CTO/Compliance/Audit |
| Trace coverage | ✅ | كل تقرير يعرض Trace IDs اللي يغطيها |
| Certificate coverage | ✅ | كل تقرير يعرض الشهادات المرتبطة |
| report template versions | ✅ | 5 إصدارات بـ hash chain |

### Stats

| الميزة المطلوبة | الحالة | كيف |
|---|---|---|
| requests | ✅ | KPI `total` = 12,483 |
| allowed | ✅ | KPI `allowed` = 11,210 |
| blocked | ✅ | KPI `blocked` = 382 |
| pending | ✅ | KPI `pending` = 841 |
| risks | ✅ | KPI `risk` + risk distribution doughnut |
| PII | ✅ | KPI `pii` = 1,554 |
| time series | ✅ | line chart (Chart.js) |
| risk distribution | ✅ | doughnut chart |
| top users | ✅ | جدول 10 مستخدمين |
| top departments | ✅ | جدول 7 أقسام |
| top models by cost | ✅ | جدول 5 نماذج + التكلفة بالريال + شريط الحصة |
| live event stream | ✅ | عمود جانبي يتحدث كل 3 ثوانٍ |
| pause stream | ✅ | زر إيقاف مؤقت |
| clickable KPI filters Audit | ✅ | نقر KPI → `/kernel/audit/?status=blocked` |
| period comparison | ✅ | جدول مقارنة مايو vs أبريل |
| custom widgets | ✅ | builder في reports + panels قابلة للترتيب |
| alerts | ✅ | 4 قواعد تنبيه |
| quotas | ✅ | 7 حصص أقسام |
| cost | ✅ | إجمالي + حسب النموذج |
| latency | ✅ | P50/P95/P99 + حسب النموذج |

## التحقق

| الفحص | النتيجة |
|---|---|
| `npm run verify:reports` | ✅ 25/25 |
| `npm run verify:stats` | ✅ 22/22 |
| `npm run build` | ✅ 0 أخطاء |
| `npm run verify:all` | ✅ exit 0 (0 errors، hreflang 259/0) |

## المخاطر المتبقية

- **Playwright smoke tests**: ما كتبتها لهذي الميزة (مثل ما سوّيت لـ M19). لو تبيها، أقدر أضيفها.
- **Report Builder**: drag & drop يستخدم HTML5 Drag API — ما يشتغل على touch devices (mobile). لو تبي touch support، نقدر نضيف touch events.
- **Live Event Stream**: محاكاة بـ `setInterval` — في الإنتاج الفعلي يحتاج WebSocket أو SSE.
- **5 Languages**: مبدّل اللغة يبدّل UI فقط — المحتوى (التقارير) يبقى عربي. لو تبي ترجمة المحتوى، يحتاج backend.

## رسالة الـ commit المقترحة

```
feat(kernel): build /kernel/reports/ + /kernel/stats/ (M23 + M24)

Reports: 42 deterministic reports + 7 types + 4 formats + 5 languages
+ report builder (drag & drop widgets) + preview drawer + template
versions (hash-chained) + Trace/Certificate coverage + role recipients.

Stats: 12,483 requests + 6 clickable KPIs (→ audit) + Chart.js
(line + doughnut) + top users/departments/models by cost + live event
stream + pause + period comparison + alerts + quotas + cost + latency
(P50/P95/P99).

Both follow M14–M20 pattern: deterministic generator (mulberry32 +
FNV-1a) + UMD mirror + vanilla JS engine + CSS + verify gate.

Verification:
- npm run verify:reports → 25/25 ✅
- npm run verify:stats → 22/22 ✅
- npm run build → 0 errors ✅
- npm run verify:all → exit 0 ✅
```

## الخطوة التالية المقترحة

- كتابة Playwright smoke tests لـ reports و stats
- إضافة touch events لـ report builder (mobile support)
- ربط live event stream بـ WebSocket في الإنتاج