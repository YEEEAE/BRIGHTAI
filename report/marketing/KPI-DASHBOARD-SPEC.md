# BrightAI — KPI Dashboard Spec

**الإصدار**: 1.0
**الأدوات**: GA4 (موجود) + Microsoft Clarity + Mixpanel + Metabase/Looker (spec)

---

## 1) هندسة القياس (Measurement Architecture)

```
صفحة/حدث → GA4 (traffic + conversions) → BigQuery (export)
                                      ↘ Mixpanel (product events)
Clarity (heatmaps) ─┐
HubSpot (lead scoring) ─┴→ Metabase/Looker dashboard
```

كل leads تحمل UTM (عبر `LeadForm` + `attributionFields`).

---

## 2) أحداث GA4 المقترحة

| الحدث | متى يطلق | المعاملات |
|---|---|---|
| `page_view` | كل صفحة (تلقائي) | page_path, page_title |
| `lead_submitted` | إرسال أي نموذج | form_name, source, medium |
| `calculator_used` | حساب ROI | employees, sector, est_value |
| `webinar_registered` | تسجيل ويبنار | campaign |
| `case_study_viewed` | فتح case study | slug |
| `partner_requested` | طلب شراكة | partner_type |
| `referral_submitted` | إحالة | track |

---

## 3) مخطط لوحة Metabase/Looker

### لوحة Traffic
- Sessions / Users (خط زمني)
- المصادر (organic / social / email / paid)
- أهم الصفحات
- معدل التحويل إلى lead

### لوحة Leads
- MQL / SQL (عدد + معدل تحويل)
- المصدر الأعلى جودة
- توزيع القطاعات

### لوحة Pipeline
- عدد الصفقات في كل stage (5 stages)
- متوسط حجم الصفقة (ASU)
- معدل الإغلاق (win rate)

### لوحة Revenue
- MRR / ARR
- NRR (صافي معدل الاحتفاظ)
- Churn %
- LTV

### لوحة Product
- DAU / MAU
- اعتماد الميزات (Firewall/Audit/Approval)
- NPS

### لوحة Support
- عدد التذاكر
- CSAT
- متوسط وقت الحل

---

## 4) نموذج Attribution (Multi-Touch)

- **First-touch**: أي قناة جلبت الـ lead أول مرة.
- **Last-touch**: أي قناة قبل التحويل.
- **Linear**: توزيع بالتساوي على كل touch.
- الأولوية حالياً: Last-touch (أبسط) → الانتقال لـ Linear بعد 90 يوم بيانات.

---

## 5) جدول التحديث (cadence)

| التقرير | التردد | المسؤول |
|---|---|---|
| Traffic + Leads | أسبوعي | فريق تسويق |
| Pipeline + Revenue | أسبوعي | المبيعات |
| Product + Support | شهري | المنتج |
| مراجعة شاملة | شهري | يزيد + فريق |

---

## 6) ملاحظات تقنية

- GA4 موجود (`G-8LLESL207Q`).
- Clarity / Mixpanel: scaffold جاهز (يحتاج IDs + تحديث CSP).
- تصدير GA4 → BigQuery مجاني ضمن حدود الـ free tier.
- Metabase يُستضاف على خادم بسيط (Docker) أو Metabase Cloud.
