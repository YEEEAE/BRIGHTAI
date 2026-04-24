# أحداث GA4 الأساسية في Bright AI

هذا الملف يوثق الأحداث التي يجب تعليمها كـ Key Events داخل GA4 بعد النشر. الأحداث لا تولد زيارات وهمية ولا ترسل تحويلات مزيفة؛ هي تقيس أفعالاً حقيقية من الزوار على صفحات Bright AI.

## الأحداث التي يجب تعليمها كـ Key Events

| Event name | أين يعمل | أهم المعلمات المتوقعة |
|---|---|---|
| `generate_lead` | روابط التواصل العامة مثل `/contact/` وروابط طلب العرض | `page_path`, `page_title`, `cta_text`, `cta_location`, `service_name`, `language`, `country_target`, `link_url` |
| `request_demo` | أزرار الديمو والعرض التوضيحي خارج صفحات المناقصات | `page_path`, `cta_text`, `cta_location`, `service_name`, `language`, `country_target`, `link_url` |
| `consultation_request` | روابط `/consultation/` ونماذج الاستشارة عند الإرسال | `page_path`, `cta_text`, `cta_location`, `form_id`, `language`, `country_target` |
| `contact_form_submit` | إرسال النماذج التي تكمل submit فعلي أو يتم إطلاق نجاحها عبر `BrightAIAnalytics.trackFormSuccess()` | `page_path`, `form_id`, `cta_location`, `language`, `country_target` |
| `whatsapp_click` | روابط WhatsApp و`api.whatsapp.com` و`wa.me` | `page_path`, `cta_text`, `cta_location`, `link_url`, `language`, `country_target` |
| `phone_click` | روابط `tel:` | `page_path`, `cta_text`, `cta_location`, `link_url`, `language`, `country_target` |
| `tender_demo_start` | أزرار تجربة ContractAI أو التسجيل في صفحات `/tenders/` و`/tenders/landing/` | `page_path`, `cta_text`, `cta_location`, `tender_feature`, `language`, `country_target` |
| `pricing_click` | روابط وأزرار التسعير مثل `#pricing` | `page_path`, `cta_text`, `cta_location`, `link_url`, `language`, `country_target` |

## أحداث داعمة للتحليل

هذه الأحداث لا يلزم تعليمها كلها كـ Key Events، لكنها مهمة لفهم جودة الجلسات:

- `cta_click`
- `contact_form_start`
- `contact_form_error`
- `email_click`
- `tool_start`
- `tool_submit`
- `search_open`
- `site_search`
- `file_download`
- `outbound_click`
- `scroll_depth_50`
- `scroll_depth_90`
- `page_not_found`

## طريقة تعليم الأحداث كـ Key Events في GA4

1. افتح GA4 property الخاصة بـ Bright AI.
2. انتقل إلى `Admin`.
3. افتح `Data display` ثم `Events`.
4. انتظر ظهور الأحداث بعد اختبارها مرة واحدة على الموقع المنشور.
5. فعّل خيار `Mark as key event` للأحداث التالية:
   - `generate_lead`
   - `request_demo`
   - `consultation_request`
   - `contact_form_submit`
   - `whatsapp_click`
   - `phone_click`
   - `tender_demo_start`
   - `pricing_click`
6. لا تنشئ أحداثاً مزيفة فقط لغرض رفع الأرقام. اختبر كل حدث بفعل مستخدم حقيقي في المتصفح.

## QA باستخدام DevTools

1. افتح صفحة مهمة مثل `https://brightai.site/ai-agent/`.
2. افتح DevTools ثم Network.
3. صفِّ الطلبات بكلمة `collect`.
4. اضغط CTA مثل واتساب أو طلب الاستشارة.
5. تحقق أن طلب GA4 يحتوي على اسم الحدث في معلمات الطلب، مثل `en=whatsapp_click` أو `en=consultation_request`.
6. افتح Console ونفذ:

```js
window.BrightAIAnalytics.track("request_demo", {
  cta_text: "QA only",
  cta_location: "debug",
  service_name: "qa"
});
```

استخدم الأمر أعلاه في بيئة اختبار فقط للتأكد من اتصال القياس، ولا تستخدمه لتوليد أرقام إنتاجية.

## QA باستخدام DebugView

1. افتح GA4 ثم `Admin` ثم `DebugView`.
2. فعّل DebugView من إضافة Google Analytics Debugger أو من جلسة اختبار داخل Tag Assistant.
3. افتح الصفحات التالية:
   - `/`
   - `/services/`
   - `/ai-agent/`
   - `/smart-automation/`
   - `/data-analysis/`
   - `/tenders/`
   - `/tenders/landing/`
   - `/contact/`
4. نفذ الأفعال الحقيقية التالية:
   - الضغط على واتساب.
   - الضغط على طلب استشارة.
   - فتح التسعير في صفحة ContractAI.
   - بدء ديمو أو تجربة ContractAI.
   - إرسال نموذج اختبار فقط إذا كان يذهب إلى حالة نجاح فعلية.
5. تحقق من وصول المعلمات:
   - `page_path`
   - `page_title`
   - `cta_text`
   - `cta_location`
   - `service_name`
   - `language`
   - `country_target`
   - `form_id`
   - `tool_name`
   - `tender_feature`
   - `link_url`
