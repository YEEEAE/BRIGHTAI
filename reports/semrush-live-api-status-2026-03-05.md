# SEMrush Live API Status — BrightAI
**Date:** 2026-03-05
**Target:** brightai.site
**Database:** sa

## API Connectivity
- ✅ `phrase_this` يعمل ويُرجع بيانات حقيقية.
- ✅ `phrase_related` يعمل.
- ✅ `domain_ranks` يعمل.
- ⚠️ `domain_organic` على `brightai.site` يرجع `ERROR 50 :: NOTHING FOUND` (ظهور عضوي محدود أو غير متاح في القاعدة).
- ❌ `backlinks*` يرجع `query type not found`.
- ❌ `reports/v1/projects/*` يرجع `query type not found` عند استخدام نفس المفتاح بصيغة Bearer.

## Live Keyword Snapshot (SA)
تم استخراج النتائج في:
- `reports/semrush-live-keywords-sa-2026-03-05.md`
- `reports/semrush-live-keywords-sa-2026-03-05.csv`

ملخص سريع:
- Total queried: 28
- Found in SA DB: 8
- Not Found: 20

Top found keywords:
- `ChatGPT بالعربي` — Volume 5400
- `الذكاء الاصطناعي في التعليم` — Volume 880
- `محلل بيانات` — Volume 720
- `شات بوت` — Volume 590
- `علوم البيانات` — Volume 590
- `التحول الرقمي في السعودية` — Volume 320

## Competitor Domain Rank Snapshot (SA)
| Domain | Rank | Organic Keywords | Organic Traffic | Organic Cost |
|---|---:|---:|---:|---:|
| brightai.site | N/A | N/A | N/A | N/A |
| elm.sa | 1497 | 2058 | 92729 | 55922 |
| thiqah.sa | 16221 | 31 | 3943 | 1733 |
| stc.com.sa | 90 | 103887 | 2293055 | 940563 |

## Interpretation
- المفتاح الحالي مناسب لـ legacy analytics endpoints (الكلمات وبعض الدومين ميتريكس).
- أجزاء Site Audit/Backlinks/Projects تحتاج نوع وصول مختلف (غالباً OAuth app token + project scope) أو خطة/صلاحية API مختلفة.

## Required To Unlock Full Plan
1. توفير credentials الخاصة بـ SEMrush API v3/Management (OAuth Bearer صالح لـ Projects).
2. أو مشاركة `project_id` جاهز وصلاحية `reports/v1/projects/*`.
3. تأكيد أن الاشتراك مفعل له Backlink API units.
