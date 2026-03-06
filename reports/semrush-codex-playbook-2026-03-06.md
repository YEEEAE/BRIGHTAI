# Semrush + Codex Playbook
**Date:** 2026-03-06
**Project:** BrightAI

## Executive Summary
أفضل عائد من اشتراك Semrush عندنا ليس في استخراج keyword volume فقط، بل في تشغيله كطبقة قرار داخل Codex:
- اكتشاف keyword clusters للسوق السعودي
- تحليل intent قبل كتابة أي صفحة
- مقارنة BrightAI بالمنافسين المحليين
- تحديد الصفحات التي تستحق البناء أو الدمج أو الأرشفة
- تحويل نتائج Semrush إلى backlog محتوى وتنفيذ أسبوعي

## What Fits This Project Best
1. **Keyword Intelligence**
   - استخدام `Keyword Overview` و`Keyword Magic` و`Keyword Difficulty` لتجميع الكلمات حول الخدمات الأساسية:
   - `ai-agent`
   - `ai-bots`
   - `data-analysis`
   - `smart-automation`
   - `industry/sector pages`

2. **Competitor Intelligence**
   - استخدام `Domain Overview` و`Domain Organic Search Keywords` و`Competitors in Organic Search` لمقارنة:
   - `brightai.site`
   - المنافسين السعوديين المباشرين
   - المنصات الكبيرة التي تنافسنا على intent مثل `stc.com.sa` و`elm.sa`

3. **Content Gap Engine**
   - كل أسبوع Codex يسحب:
   - الكلمات الجديدة
   - الأسئلة الشائعة
   - الصفحات المنافسة الصاعدة
   - ثم يطابقها مع صفحاتنا الموجودة في `sitemap.xml`
   - الناتج: قائمة `create / refresh / merge / archive`

4. **SERP Intent Mapping**
   - ليس كل keyword تستحق landing page.
   - Semrush يجب أن يقرر معنا هل الطلب:
   - `informational`
   - `commercial`
   - `transactional`
   - `navigational`
   - وبعدها Codex يختار نوع الصفحة: blog أو docs أو service page أو case study.

5. **Authority and Backlinks**
   - إذا الخطة الحالية تدعم وحدات backlink، نستخدمها لرصد:
   - الصفحات القابلة لبناء authority
   - الروابط الجديدة للمنافسين
   - الفرص التحريرية لمحتوى قابل للاقتباس

## Highest-ROI Automations
### 1) Weekly Saudi Keyword Cluster Report
- **الهدف:** اكتشاف 20 إلى 50 keyword cluster حول خدماتنا.
- **المخرجات:** ملف Markdown مرتب حسب الخدمة والنية الشرائية والأولوية.
- **أفضل استخدام:** اختيار مواضيع المقالات والصفحات الجديدة.

### 2) Competitor Gap Report
- **الهدف:** سحب أهم الصفحات والكلمات التي يظهر عليها المنافسون ونحن لا.
- **المخرجات:** قائمة content gaps مع effort score.
- **أفضل استخدام:** ترتيب backlog الربع القادم.

### 3) Existing Page Refresh Report
- **الهدف:** مقارنة كل صفحة في `sitemap.xml` مع keyword target وSERP intent الحالي.
- **المخرجات:** `keep / refresh / expand / merge`.
- **أفضل استخدام:** رفع العائد من الصفحات الموجودة بدل تضخيم محتوى جديد فقط.

### 4) Internal Linking Suggestions
- **الهدف:** ربط cluster المقالات بصفحات الخدمات والقطاعات.
- **المخرجات:** روابط مقترحة مع anchor text عربي مناسب.
- **أفضل استخدام:** تقوية topical authority بسرعة وبدون زيادة bundle.

### 5) Executive SEO Board
- **الهدف:** لوحة أسبوعية لقياس:
   - keyword coverage
   - المحتوى الجديد
   - gaps
   - فرص authority
   - المخاطر
- **أفضل استخدام:** قرار إداري سريع بدون الغوص في تفاصيل Semrush كل مرة.

## Recommended Data Model
لكل keyword نحتفظ بالحقول التالية:
- `keyword`
- `database`
- `volume`
- `keyword_difficulty`
- `cpc`
- `competition`
- `intent`
- `serp_features`
- `target_url`
- `page_type`
- `cluster`
- `priority`
- `action`

## Recommended Project Workflow
1. Codex يسحب الكلمات من Semrush API.
2. Codex يطابق الكلمات مع صفحات `sitemap.xml`.
3. Codex يكشف gaps والمنافسين والintent.
4. Codex ينشئ تقرير تنفيذي داخل `reports/`.
5. بعدها فقط نقرر: `build page` أو `refresh page` أو `merge page`.

## Practical Priorities For BrightAI
1. `AI for Saudi business`
2. `AI agents`
3. `chatbots / conversational AI`
4. `data analysis / BI`
5. `smart automation`
6. `sector pages`: finance, healthcare, logistics, retail, HR
7. `governance/compliance`: PDPL, NCA, SDAIA

## Important Constraints
- المشروع جاهز SEO تقنياً بدرجة عالية، لذلك Semrush لازم يركز على growth intelligence لا على إصلاح metadata فقط.
- لا أوصي بإهدار units على keywords عامة جداً بلا intent شرائي.
- الأولوية للسوق السعودي `database=sa` ثم `ae` أو `us` فقط إذا عندنا توسع فعلي.
- إذا كانت بيئة Codex عندكم تدعم `MCP` فهذه طريقة أنظف للتعامل مع Semrush داخل أداة AI؛ هذا استنتاج مبني على توفر `Semrush MCP` الرسمي للمحررات ووكلاء الذكاء الاصطناعي في وثائق Semrush.

## Next Build Recommendation
- بناء سكربت جديد باسم `scripts/semrush-keyword-clusters.mjs`
- بناء سكربت جديد باسم `scripts/semrush-content-gap.mjs`
- إخراج النتائج إلى:
  - `reports/semrush-keyword-clusters-latest.md`
  - `reports/semrush-content-gap-latest.md`
  - `reports/semrush-executive-board-latest.md`
