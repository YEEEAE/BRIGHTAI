# BRIGHTAI — تدقيق SEO تقني واستراتيجي للسوق السعودي

**Snapshot:** 2026-09-08  
**Repository:** `YEEEAE/BRIGHTAI`  
**Branch:** `main`  
**Commit:** `e5964dac2800ea4b7b1ea4694217ecf206bf3861`  
**Production origin:** `https://brightai.live`

## الخلاصة
أقوى تموضع مثبت من المصدر هو **منصة/طبقة تشغيل لحوكمة وأمان الذكاء الاصطناعي داخل المؤسسات السعودية**، وليس "شركة AI عامة". المنتج المحوري: منصة الحوكمة، ثم AI Firewall، المخاطر/Shadow AI، الموافقات البشرية، سجل التدقيق، ملفات الأدلة وربط السياسات بالضوابط.

أصحاب القرار: CISO، CIO/CTO، DPO/CDO، Compliance، Risk، Audit. القطاعات الأساسية: بنوك، حكومة، صحة، تصنيع. رحلة الشراء: **Assessment → Pilot → Enterprise Rollout**.

## نطاق الفحص
- route tree في `src/pages/**`.
- Astro config والنطاق.
- robots.
- بيانات الحلول والقطاعات والمدن.
- عينات عميقة: Home، Services، Pricing، Solution template، Kernel، Sitemap، Bank case.
- مجموعة Blog/Docs references.

آخر Commit المقروء يسجل Build ناجحًا لـ **276 HTML pages** و`seo:gate` ناجحًا لـ **49,589 link references** وفحوص Schema/Hreflang. هذه نتائج **مبلّغ عنها داخل المستودع** وليست إعادة تشغيل مستقلة.

### القيد
لم يتم live crawl كامل، لذلك HTTP/canonical final/orphan status غير مثبت. القوالب الديناميكية مكتشفة لكن أعضاء Blog/Docs/Hub لم تُوسع بالكامل. راجع `page-inventory.csv`.

## الخدمات الفعلية
1. AI Governance Platform
2. AI/LLM Firewall
3. AI Risk Classification
4. AI Use Case / Shadow AI Discovery
5. Human Approval Layer
6. AI Audit Trail
7. AI Evidence File
8. Policy-to-Control Mapping
9. Continuous AI Governance
10. BrightAI Kernel

## أهم العوائق
### P0 — Case studies غير مثبتة
`/customers/bank/` تعرض 12 فرعًا، 94%، 100%، أسبوعين واقتباسًا وظيفيًا بدون disclaimer افتراضي ظاهر في العينة. إثبات أو تحويل واضح إلى سيناريو افتراضي وإزالة الأرقام/الاقتباس غير المثبت.

### P0 — NCA ECC
بعض المحتوى يذكر 114 ضابطًا. ECC-2:2024 الرسمي يذكر **108 ضوابط رئيسية + 92 ضابطًا فرعيًا** ضمن 4 مجالات و28 مجالًا فرعيًا.

### P1 — Services positioning
`/services/` أوسع من المنتج الأساسي وقد ينافس صفحة المنصة ويبدد الصلة.

### P1 — HTML sitemap / IA
توجد تسميات قديمة لبوتات/منتجات/قطاعات تتجه لصفحات عامة. لا تنشئ صفحات لها لمجرد سد الخريطة؛ نظف IA بعد تأكيد العروض الحقيقية.

### P1 — City pages
لا تضف مدنًا تلقائيًا. الصفحات الست الحالية تحتاج طلب بحث + خدمة فعلية + قيمة محلية فريدة.

### P2 — Claims evidence
استضافة سعودية، Made in Saudi، مدد التنفيذ، 24h، SLA، Air-gapped/On-Prem، التوقيع الرقمي/immutability وحزم الامتثال تحتاج سجل إثبات وحدود دقيقة.

## نقاط قوة
- `brightai.live` موحد في Astro.
- trailing slash موحد.
- `/api/` و`/go/` مستبعدان.
- Sitemap canonical واحد.
- جهود لمنع Duplicate Schema IDs.
- AI Firewall يحتوي لغة حدود جيدة.
- إزالة rating مختلق من Schema بدل نشر review بلا مصدر.

## ترتيب التنفيذ
1. الثقة والدقة.
2. تموضع المنتج والـ IA.
3. صفحات الإيراد.
4. التنظيم السعودي بمصادر رسمية.
5. Assessment/Pricing/Contact.
6. القطاعات.
7. محتوى دعم بعد بيانات Semrush/GSC.
8. المدن بعد إثبات الطلب.

## ما لم يتم
لا تعديل إنتاج، لا Commit/Push/PR، ولا Semrush `execute_report` مدفوع.
