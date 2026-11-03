# SOURCE-TO-CLAIM MAP — صفحات المنتجات وTrust/Compliance

> **تاريخ الفحص:** 2026-11-03 · **النسخة المحلية:** `ede38c28` · **الغرض:** ربط كل رابط ظاهر بنوع الادعاء ومصدره، دون تحويل متطلب إلى خدمة منشورة.
> **الأنواع:** `APPROVED_REQUIREMENT` (مطلب معتمد) · `LOCAL_IMPLEMENTATION` (كود/واجهة محلية غير متحققة) · `PUBLISHED_REFERENCE` (مصدر خارجي رسمي) · `NO_SERVICE_CLAIM` (تنقل/استفسار فقط).

## 1. صفحات المنتجات

| الرابط | موضعه | الادعاء | النوع | الحالة المسموحة في الواجهة |
|---|---|---|---|---|
| `/products/` | `[product].astro`، `products/index.astro` | «منتج مستقل ضمن المنظومة» | `APPROVED_REQUIREMENT` | تصور · غير متحقق تشغيليًا |
| `/products/firewall/` … `/products/secure-chat/` | `products/index.astro` | خمسة منتجات مستقلة، Kernel غير مفوتر | `APPROVED_REQUIREMENT` | مخطط · غير متحقق |
| `/contact/` | جميع صفحات المنتجات | «اطلب معلومات أو عرض سعر» | `NO_SERVICE_CLAIM` | يفتح بريدًا فقط؛ لا إرسال مؤكد |
| `/pricing/` | `products/index.astro` | فروق التجربة/العقد، لا أسعار | `LOCAL_IMPLEMENTATION` | لا سعر معتمد؛ التجربة غير مفعّلة |
| `/docs/` | `products/index.astro` | مركز معرفة منشور | `LOCAL_IMPLEMENTATION` | محتوى توعوي، ليس دليل تشغيل |
| `/trust/` | `ProductContentExtension.astro` (Ledger) | حدود الأدلة المعلنة | `LOCAL_IMPLEMENTATION` | لا شهادات أو أدلة تشغيل |
| `/pillars/transparency/` | `ProductContentExtension.astro` (Ledger) | إطار شفافية/مساءلة | `APPROVED_REQUIREMENT` | إطار مبدئي |
| `/products/risk-engine/` | `ProductContentExtension.astro` (Firewall) | تكامل اختياري غير إلزامي | `APPROVED_REQUIREMENT` | اختياري، غير متحقق |
| `/products/ledger/` | `ProductContentExtension.astro` (Human Gate) | أدلة متقدمة اختيارية | `APPROVED_REQUIREMENT` | اختياري، غير متحقق |
| `/knowledge/*` (روابط داخلية) | امتدادات المنتجات | محتوى تعليمي | `LOCAL_IMPLEMENTATION` | تعليمي فقط |
| `/privacy/` | `ProductContentExtension.astro` (Secure Chat) | حدود معلومات الخصوصية | `LOCAL_IMPLEMENTATION` | تمهيدي، يحتاج مراجعة قانونية |

**قيود ثابتة:** لا شارة `AVAILABLE` أو `BETA`، ولا «يعمل الآن»، ولا سعر أو موعد أو اعتماد. صفحات المنتجات الحالية تعلن «مخطط · غير متحقق تشغيلياً».

## 2. Trust

| الرابط | الادعاء | النوع | ملاحظة |
|---|---|---|---|
| `/compliance/` | ربط المتطلب بالضابط والدليل | `APPROVED_REQUIREMENT` | طريقة تنظيم، ليست حكمًا قانونيًا |
| `/contact/` | استفسار عام | `NO_SERVICE_CLAIM` | بريد فقط |
| `/privacy/` (عبر الفوتر) | سياسة خصوصية تمهيدية | `LOCAL_IMPLEMENTATION` | تحتاج اعتمادًا قانونيًا |

## 3. Compliance

| الرابط | الادعاء | النوع | ملاحظة |
|---|---|---|---|
| `https://www.spa.gov.sa/en/N2633781` | خبر الإطار الوطني لمخاطر AI | `PUBLISHED_REFERENCE` | مصدر خارجي، لا يثبت اعتماد BRIGHTAI |
| `https://sdaia.gov.sa/` | موقع سدايا الرسمي | `PUBLISHED_REFERENCE` | مرجع فقط |
| `https://dgp.sdaia.gov.sa/` | بوابة حوكمة البيانات الوطنية | `PUBLISHED_REFERENCE` | مرجع فقط |
| `/docs/` | أدلة المعرفة | `LOCAL_IMPLEMENTATION` | تعليمي |
| `/knowledge/protect-company-data-chatgpt/` | قائمة قرار حماية بيانات | `LOCAL_IMPLEMENTATION` | تعليمي |
| `/knowledge/ai-governance-saudi/` | دورة الحوكمة | `LOCAL_IMPLEMENTATION` | تعليمي |
| `/contact/` (عبر الفوتر) | استفسار | `NO_SERVICE_CLAIM` | بريد فقط |

## 4. قواعد المراجعة

1. أي رابط خارجي جديد يحتاج تحققًا من المصدر الرسمي وتاريخ النشر، ويبقى `PUBLISHED_REFERENCE` لا دليلًا على اعتماد.
2. أي رابط داخلي جديد يجب أن يشير إلى صفحة موجودة فعليًا في `src/pages/`.
3. لا يُحوَّل `LOCAL_IMPLEMENTATION` إلى `PUBLISHED_SERVICE` إلا بدليل نشر وتشغيل مستقل.
4. تُراجع هذه الخريطة مع تغيير الروابط أو نصوص الإتاحة في صفحات المنتجات/Trust/Compliance.
