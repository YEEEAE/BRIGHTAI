# قائمة تحقق إصلاح انخفاض إحصاءات Bright AI

## 1. أحداث GA4 المطلوب اختبارها في DebugView

- `generate_lead`
- `request_demo`
- `consultation_request`
- `contact_form_start`
- `contact_form_submit`
- `contact_form_error`
- `whatsapp_click`
- `email_click`
- `phone_click`
- `pricing_click`
- `tender_demo_start`
- `tender_compare_open`
- `tool_start`
- `tool_submit`
- `search_open`
- `site_search`
- `file_download`
- `outbound_click`
- `scroll_depth_50`
- `scroll_depth_90`
- `page_not_found`

## 2. Key Events التي يجب تعليمها يدوياً في GA4

- `generate_lead`
- `request_demo`
- `consultation_request`
- `contact_form_submit`
- `whatsapp_click`
- `phone_click`
- `tender_demo_start`
- `pricing_click`

## 3. روابط للفحص في Google Search Console

- `https://brightai.site/`
- `https://brightai.site/services/`
- `https://brightai.site/ai-agent/`
- `https://brightai.site/smart-automation/`
- `https://brightai.site/data-analysis/`
- `https://brightai.site/ai-bots/`
- `https://brightai.site/ai-workflows/`
- `https://brightai.site/smart-medical-archive/`
- `https://brightai.site/tools/`
- `https://brightai.site/tenders/`
- `https://brightai.site/tenders/landing/`
- `https://brightai.site/tenders/compare/`
- `https://brightai.site/consultation/`
- `https://brightai.site/contact/`

## 4. روابط لطلب الفهرسة

ابدأ بصفحات المال التي تخدم نية شراء سعودية:

- `https://brightai.site/services/`
- `https://brightai.site/ai-agent/`
- `https://brightai.site/smart-automation/`
- `https://brightai.site/data-analysis/`
- `https://brightai.site/tenders/`
- `https://brightai.site/tenders/landing/`
- `https://brightai.site/tenders/compare/`
- `https://brightai.site/consultation/`
- `https://brightai.site/contact/`

## 5. روابط متوقعة أن تتحول 301

- `http://brightai.site/*` إلى `https://brightai.site/*`
- `https://www.brightai.site/*` إلى `https://brightai.site/*`
- `/index.html` إلى `/`
- `/:slug/index.html` إلى `/:slug/`
- `/ai-agent.html` إلى `/ai-agent/`
- `/smart-automation.html` إلى `/smart-automation/`
- `/data-analysis.html` إلى `/data-analysis/`
- `/tools.html` إلى `/tools/`
- `/consultation.html` إلى `/consultation/`
- `/frontend/pages/*` إلى المسارات العامة أو `/`

## 6. الصفحات المتوقع أن تولد Leads

- `/`
- `/services/`
- `/ai-agent/`
- `/smart-automation/`
- `/data-analysis/`
- `/ai-bots/`
- `/ai-workflows/`
- `/smart-medical-archive/`
- `/tools/`
- `/tenders/`
- `/tenders/landing/`
- `/tenders/compare/`
- `/consultation/`
- `/contact/`

## 7. تحقق عدم وجود noindex عبر curl

```bash
curl -I https://brightai.site/tenders/
curl -I https://brightai.site/ai-agent/
curl -I https://brightai.site/smart-automation/
curl -I https://brightai.site/data-analysis/
```

تأكد أن الاستجابة لا تحتوي:

```text
X-Robots-Tag: noindex
```

## 8. تحقق canonical من مصدر الصفحة

افتح View Source أو استخدم:

```bash
curl -s https://brightai.site/tenders/ | grep -i canonical
curl -s https://brightai.site/ai-agent/ | grep -i canonical
curl -s https://brightai.site/smart-automation/ | grep -i canonical
curl -s https://brightai.site/data-analysis/ | grep -i canonical
```

المتوقع أن تكون الروابط absolute، على `https://brightai.site`، بدون `.html`، وبـ trailing slash.

## 9. تحقق form_submit و request_demo

1. افتح DevTools ثم Network.
2. صفِّ بـ `collect`.
3. اضغط CTA ديمو أو عرض توضيحي.
4. تحقق من `en=request_demo` أو `en=tender_demo_start`.
5. ابدأ تعبئة نموذج تواصل، وتأكد من `contact_form_start` مرة واحدة فقط.
6. أرسل النموذج فقط إذا كان الإرسال يصل إلى حالة نجاح فعلية، ثم تحقق من `contact_form_submit` أو `consultation_request`.

## 10. KPIs لمدة 30 يوم

- Organic Search sessions
- Saudi users
- `request_demo` events
- `contact_form_submit` events
- `whatsapp_click` events
- Pages indexed
- 404 views
- `scroll_depth_90`
- Average engagement time
