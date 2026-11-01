# مراجعة الصفحات الجديدة والروابط النظيفة — 2026-10-30

الحالة التقنية المحلية: **DONE / PASS**. مراجعة اعتماد السياسات وقدرات المنصة: **NOT VERIFIED**. لم يحصل commit أو push أو نشر.

## النطاق والنتيجة

- فُحصت الملفات الجديدة وتعديلات Header/Footer والحلول الموجودة في working tree على أساس HEAD `6d8ebf5c094ce2c058d42b6fde5ec426c3bdab68`؛ الأدلة تخص الحالة المحلية المعدلة.
- البناء ينتج 24 صفحة عامة: 6 مسارات سابقة و18 مساراً جديداً؛ جميعها قابلة للوصول من الرئيسية، وتوجد في sitemap المولدة.
- لا يلزم تسجيل كل صفحة في Render: مصدرها `src/pages/`، مع `trailingSlash: always` في `astro.config.mjs`.
- أُضيفت 23 قاعدة `.html` إلى `redirects.json`، ويقرأها `src/middleware.ts` فعلياً على خادم Node مع حفظ query string. الروابط الواردة الجديدة aliases وليست دليلاً على وجود URLs تاريخية منشورة.
- يبقى `/index.html` و`/<page>/index.html` من ملفات البناء الساكنة؛ قواعد التحويل المضافة تخص `/<page>.html` فقط. canonical يشير للمسار النظيف.

## أهم الإصلاحات

- تحميل CSS المشترك عبر imports في BaseLayout بدلاً من روابط نسبية كانت ترجع 404؛ إصلاح احتواء grid الرئيسية دون قص المحتوى.
- ربط الأركان من الرئيسية وربط حجز العرض بصفحة التواصل، مع حفظ تنقل المستخدم الجديد.
- تحسين مساحات لمس روابط الفوتر والتنقل الداخلي، واحتواء الجداول والأكواد في الصفحات الجديدة.
- نموذج التواصل: تعطيل submit حتى تسجيل المعالج، fallback للبريد عند تعطيل JavaScript، ورسالة تؤكد أن فتح البريد ليس إرسالاً أو حجزاً.
- التوثيق والمنتجات والأركان والثقة والحلول: توضيح أن قدرات API/الحماية/الاحتفاظ هي تصور مستهدف غير مثبت التشغيل. لا يوجد `/api/ai/chat/` في المصدر الحالي.
- تصحيح زر تجربة الاشتراك إلى طلب تجربة عبر التواصل بدلاً من تحويله لمحاكاة Kernel. إزالة تعميم شهرين مجاناً غير المطابق حسابياً لكل الباقات.
- إزالة placeholders الظاهرة لهوية المنشأة من سياسة الخصوصية مع إحالة الاستفسار للقناة الحالية، وإضافة إفصاح عن Google Analytics الموجود فعلاً. لم تُختلق هوية منشأة أو إعدادات معالجة.
- استبدال رقم العقوبة القانونية غير المسند بصياغة تحتاج مراجعة النصوص الرسمية لكل حالة.
- إضافة Service للثماني خدمات وFAQPage للأسئلة الظاهرة في صفحة الأسعار، مع إبقاء breadcrumbs وGA4 والشعار المشترك.
- Render: `npm ci && npm run build` لأن lockfile الموجود هو package-lock.json؛ إزالة preDeploy لسكربت غير موجود، وتغيير healthCheckPath من API مفقود إلى `/` (فحص توفر الموقع فقط). احتُفظ بقيم البيئة وإعدادات headers الموجودة.

## المسارات النظيفة

| المسار | تحويل HTML |
| --- | --- |
| `/` | لا توجد قاعدة جديدة للجذر |
| `/about/` | `/about.html` → 301 |
| `/compliance/` | `/compliance.html` → 301 |
| `/contact/` | `/contact.html` → 301 |
| `/docs/` | `/docs.html` → 301 |
| `/kernel/` | `/kernel.html` → 301 |
| `/pillars/safety/` | `/pillars/safety.html` → 301 |
| `/pillars/transparency/` | `/pillars/transparency.html` → 301 |
| `/pillars/privacy/` | `/pillars/privacy.html` → 301 |
| `/pricing/` | `/pricing.html` → 301 |
| `/privacy/` | `/privacy.html` → 301 |
| `/products/firewall/` | `/products/firewall.html` → 301 |
| `/products/risk-engine/` | `/products/risk-engine.html` → 301 |
| `/products/human-gate/` | `/products/human-gate.html` → 301 |
| `/products/ledger/` | `/products/ledger.html` → 301 |
| `/products/secure-chat/` | `/products/secure-chat.html` → 301 |
| `/products/` | `/products.html` → 301 |
| `/services/` | `/services.html` → 301 |
| `/solutions/government/` | `/solutions/government.html` → 301 |
| `/solutions/finance/` | `/solutions/finance.html` → 301 |
| `/solutions/healthcare/` | `/solutions/healthcare.html` → 301 |
| `/solutions/enterprise/` | `/solutions/enterprise.html` → 301 |
| `/terms/` | `/terms.html` → 301 |
| `/trust/` | `/trust.html` → 301 |

## التحقق

- `npm run build`: **PASS**. `pnpm build`: **BLOCKED** بكاش Corepack خارج sandbox؛ استُخدم سكربت Astro نفسه عبر npm بدون تثبيت تبعيات.
- `node scripts/verify-routes.mjs http://127.0.0.1:4387`: **PASS**؛ 24 صفحة و823 مرجعاً و31 مسار مرجع مميز و3 أصول خطوط عبر CSS؛ صفر مراجع مكسورة وصفر صفحات معزولة.
- 69 فحص تحويل: GET/HEAD للـ23 alias، وتحويل بدون slash للـ23 مسار؛ 301 مع حفظ query عربية ومتعددة المعاملات.
- title فريد وH1 واحد وcanonical وindex/follow وGA4 config واحد وJSON-LD صالح وbreadcrumbs لكل صفحة داخلية: **PASS**.
- sitemap-index وsitemap-0 وrobots والأصول المحلية: **PASS** ضمن فحص المراجع؛ README مستبعد من sitemap.
- Playwright: 48 عرضاً للـ24 صفحة على 360 و1440px، بعد تحميل الخطوط؛ بدون overflow، والخلفية سوداء، وmain موجود.
- Tab/Enter لرابط التخطي وfocus ظاهر، required inputs، topic=Business، رسالة فتح البريد، fallback عند تعطيل JS، reduced-motion: **PASS**؛ لم تُرسل رسالة فعلية ولم يُثبت وصول بريد أو حجز.
- لا pageerror في الجولات المنفذة. حُجبت Google Tag Manager أثناء الفحص البصري لتجنب إرسال زيارات اختبار؛ لا ادعاء بوصول GA4 للإنتاج.
- JSON/YAML parse، مطابقة dependencies بين manifest وpackage-lock، `git diff --check`: **PASS**.
- اختبار أوامر lint/typecheck/unit: **NOT RUN**؛ لا سكربتات لها في manifest. لا قياس CWV أو اختبار قارئ شاشة أو مراجعة امتثال شاملة.

## حدود ومراجعات مفتوحة

1. السياسات القانونية والتجارية وهوية المتحكم النظامية ومدد الاحتفاظ وSLA والتوفر الفعلي تحتاج اعتماد المالك وأدلة تشغيل/عقود؛ التنبيهات المضافة لا تثبتها. النصوص الأصلية حُفظت قدر الإمكان.
2. `headers` في render.yaml موروثة لإعداد static ولا تثبت تطبيق headers على Node. لم تتغير السياسة ولم تُفحص الاستجابة الإنتاجية أو إعدادات Cloudflare.
3. ملف README الفارغ في src/pages باقٍ كما هو، ومساره قد يُرجع 200 فارغاً، لكنه ليس صفحة جديدة معتمدة ولا يظهر في sitemap أو التنقل.
4. لم تُجرَ عملية npm ci نظيفة أو build على Render؛ فحص محلي بالاعتمادات الموجودة ومطابقة lockfile فقط.
5. النشر والفهرسة الفعلية وUAT وتشغيل محرك المنتج غير متحقق منها.

## مرجع طريقة التوجيه

- [Astro routing](https://docs.astro.build/en/guides/routing/)
- [Astro trailingSlash](https://docs.astro.build/en/reference/configuration-reference/#trailingslash)
- [Render Astro web service](https://render.com/docs/deploy-astro#web-service)

```text
=== INTERNAL LINKS SCAN REPORT ===
Trigger: New Astro pages and clean URL review
Files Scanned: 24 generated HTML pages plus referenced CSS
References Checked: 823 HTML references + 3 CSS asset references
Issues Found: 48
Issues Fixed: 48
Issues Requiring Manual Review: 0

--- FIXED ---
[src/layouts/BaseLayout.astro:2] → WRONG_PATH: 2 relative stylesheet links → bundled CSS imports
[redirects.json:1] → MISSING_FILE: 23 .html aliases returning 404 → explicit 301 redirects
[astro.config.mjs:7] → WRONG_PATH: 23 slashless page variants → canonical trailing-slash redirects

--- NEEDS MANUAL REVIEW ---
None

--- WARNINGS ---
Counts cover broken stylesheet references and URL normalization; not security/content approval.
No existing internal-links:audit script or scripts were present; used scripts/verify-routes.mjs instead.
README route excluded from page inventory; direct index.html aliases are not canonicalized by this middleware.
=== END REPORT ===
```

```text
=== CONTENT INTEGRITY REPORT ===
Trigger: Review of new pages against current implementation
Content Reviewed: New pages, shared shell, navigation and modified sector pages
Review Depth: document

--- CRITICAL ISSUES (must fix) ---
[src/pages/docs.astro:API] Missing implemented endpoint → Fix applied: explicit unavailable/proposed API notice.
[src/pages/products/:capabilities] Unverified operational capabilities → Fix applied: scope notice in product/pillar/solution/trust templates.
[src/pages/privacy.astro:identity] Visible placeholders and missing analytics disclosure → Fix applied: no fabricated registration/address; contact channel and GA disclosure.

--- HIGH ISSUES (should fix) ---
[src/pages/pricing.astro:trial] Trial CTA led to UI simulation → Fix applied: request trial via contact; simulation limitation disclosed.
[src/pages/pricing.astro:annual] Universal two-free-month claim inconsistent with Enterprise price → Fix applied: neutral plan description.
[src/pages/compliance.astro:penalty] Unsourced legal penalty generalization → Fix applied: case-specific legal review wording.
[src/pages/terms.astro:scope] Trial and liability terms not backed by active platform → Fix applied: contractual review notice.

--- MEDIUM ISSUES (quality improvement) ---
None

--- LOW ISSUES (polish) ---
None

--- INTEGRATION SUMMARY ---
New content fits: yes, as website/product proposal with disclosed operational limits
Flow preserved: yes, minimal changes to original copy
Consistency maintained: partial, commercial/legal/operational assertions still require owner approval
Cross-references valid: yes, local route audit passed

--- STATISTICS ---
Issues Found: 3 critical groups, 4 high groups
Issues Auto-Fixed: 7 groups addressed; operational claims scoped, not independently proven
Issues Needing Manual Review: 2 groups (legal/commercial approval; operational evidence)
Content Quality Score: 7/10; links and website integration verified, operational/legal statements not approved
=== END REPORT ===
```
