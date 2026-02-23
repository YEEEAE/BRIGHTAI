# تنفيذ GA4 + Looker Studio لتعقب التحويلات
**Date:** 2026-02-23
**Project:** BrightAI

## الهدف
تفعيل تتبّع أهداف التحويل الأساسية (`إرسال نموذج تواصل` و`بدء الشات`) وربطها بلوحة تشغيلية في Looker Studio لعرض:
- الجلسات وسلوك المستخدم
- التحويلات ومعدلاتها
- الأداء التقني للصفحات

## ما تم تطبيقه في الكود
- تم تفعيل أحداث GA4 الموحدة داخل `/Users/yzydalshmry/Desktop/BrightAI/frontend/js/index-theme.js`.
- تم تفعيل نفس المنطق للصفحة الرئيسية داخل `/Users/yzydalshmry/Desktop/BrightAI/frontend/js/index-theme.min.js`.
- تم تعريف نموذج الاستشارة لتمييز التحويل بوضوح داخل `/Users/yzydalshmry/Desktop/BrightAI/frontend/pages/consultation/index.html`.

## هيكل الأحداث (Event Taxonomy)
| Event Name | النوع | متى يُرسل | أهم الـ Parameters |
|---|---|---|---|
| `lead_form_submit` | Custom | عند Submit لأي نموذج Lead | `form_type`, `form_id`, `form_action`, `input_count`, `page_path` |
| `chat_start` | Custom | عند أول رسالة من المستخدم في الشات أو Quick Action | `trigger_source`, `chat_profile`, `page_path` |
| `chat_widget_open` | Custom | أول فتح لودجت الشات في الصفحة | `chat_profile`, `page_path` |
| `whatsapp_click` | Custom | عند الضغط على رابط WhatsApp | `destination_host`, `page_path` |
| `contact_email_click` | Custom | عند الضغط على `mailto:` | `lead_channel`, `page_path` |
| `contact_phone_click` | Custom | عند الضغط على `tel:` | `lead_channel`, `page_path` |
| `technical_performance` | Custom | عند إغلاق الصفحة/اختفاء التبويب/بعد التحميل | `page_load_ms`, `dom_content_loaded_ms`, `ttfb_ms`, `fcp_ms`, `lcp_ms`, `cls_milli` |
| `generate_lead` | Recommended | مع تحويلات form/chat/whatsapp | `lead_channel`, `interaction_type`, `form_type`, `chat_profile` |

## KPIs المستهدفة
| KPI | التعريف | مصدر القياس |
|---|---|---|
| Lead Conversion Rate | `generate_lead / sessions` | GA4 + Looker Studio |
| Form Lead Rate | `lead_form_submit / sessions` | GA4 |
| Chat Start Rate | `chat_start / sessions` | GA4 |
| WhatsApp Intent Rate | `whatsapp_click / sessions` | GA4 |
| Technical Quality Index | اتجاهات `LCP/CLS/FCP/TTFB` من الحدث التقني | GA4 + Looker Studio |

## إعداد GA4 (خطوات الإدارة)
1. افتح Admin في GA4 ثم Property الخاصة بالموقع.
2. تأكد من Web Stream لنفس Measurement ID المستخدم بالموقع (`G-8LLESL207Q`).
3. انتظر وصول الأحداث (Realtime + DebugView) ثم انتقل إلى `Admin > Events`.
4. فعّل `Mark as key event` على:
- `generate_lead`
- `lead_form_submit`
- `chat_start`
- `whatsapp_click`
5. من `Admin > Custom definitions` أضف Event-scoped dimensions:
- `form_type`
- `form_id`
- `lead_channel`
- `interaction_type`
- `chat_profile`
- `trigger_source`
- `navigation_type`
6. من `Admin > Custom definitions` أضف Custom metrics (Event parameter):
- `input_count`
- `page_load_ms`
- `dom_content_loaded_ms`
- `ttfb_ms`
- `fcp_ms`
- `lcp_ms`
- `cls_milli`

## ربط Google Ads
1. `GA4 Admin > Product links > Google Ads Links`.
2. اختر حساب Google Ads الصحيح ثم فعّل Personalized Ads.
3. فعّل Import لحدث `generate_lead` كتحويل داخل Google Ads.
4. أنشئ Conversion Action منفصل للأحداث التالية عند الحاجة للحملات:
- `chat_start`
- `lead_form_submit`
- `whatsapp_click`

## تصميم لوحة Looker Studio
## صفحة 1: Executive KPI
- Scorecard: `Sessions`
- Scorecard: `Users`
- Scorecard: `Conversions`
- Scorecard: `Conversion rate`
- Time Series: `Sessions vs Conversions` حسب اليوم
- Pie/Bar: `Leads by channel` (باستخدام `lead_channel`)

## صفحة 2: سلوك المستخدم
- Table: `Landing page + Sessions + Engaged sessions + Avg engagement time + Bounce rate`
- Funnel chart: `page_view -> chat_widget_open -> chat_start -> generate_lead`
- Table: `Page path + lead_form_submit + chat_start`

## صفحة 3: الأداء التقني
- Time Series: `Avg lcp_ms` يوميًا
- Time Series: `Avg cls_milli` يوميًا
- Time Series: `Avg fcp_ms` و `Avg ttfb_ms`
- Table: `page_path + avg(page_load_ms) + avg(dom_content_loaded_ms)`

## الحقول المحسوبة في Looker Studio
- `Lead Conversion Rate`:
```text
CASE WHEN Sessions = 0 THEN 0 ELSE Conversions / Sessions END
```
- `Form Lead Rate`:
```text
CASE WHEN Sessions = 0 THEN 0 ELSE SUM(lead_form_submit) / Sessions END
```
- `Chat Start Rate`:
```text
CASE WHEN Sessions = 0 THEN 0 ELSE SUM(chat_start) / Sessions END
```

## ضوابط الحوكمة والامتثال
- لا يتم إرسال أي PII داخل Events (لا اسم، لا إيميل، لا هاتف).
- التتبع يلتزم بمبدأ الحد الأدنى للبيانات بما يتوافق مع متطلبات PDPL.
- أي ربط CRM لاحق يجب أن يعتمد ID مجهول أو Hash غير عكسي.

## التحقق بعد الإطلاق
1. افتح GA4 DebugView ونفّذ سيناريوهات:
- إرسال نموذج الاستشارة
- فتح الشات ثم إرسال أول رسالة
- الضغط على WhatsApp
2. تأكد من ظهور الأحداث والـ Parameters كاملة.
3. راجع Looker Studio بعد 24 ساعة للتحقق من امتلاء البيانات.
4. فعّل تنبيه في GA4 عند هبوط Conversion Rate أكثر من 20% لأكثر من 48 ساعة.
