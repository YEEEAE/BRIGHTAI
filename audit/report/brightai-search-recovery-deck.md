# BrightAI Search Recovery — Executive Deck (Markdown)

**2026-08-24 · Audit + fixes delivered locally · no commit / no push / no production change**

---

## Slide 1 — Executive Summary
الموقع تقنيًا سليم من الداخل (260 URL قابلة للفهرسة، صفر روابط مكسورة، schema صادقة). المشكلة الحقيقية برّيع: سياسة زواحف معكوسة على الحافة (Cloudflare)، وتحويلات قديمة ميتة في الإنتاج، وصفر سلطة خارجية. أصلحنا اليوم كل القابل للإصلاح من الريبو؛ الباقي 3 أفعال خارجية بيدك.

## Slide 2 — Why Google Traffic Is Low (GA: 156 users/28d, organic=1)
1. الظهور مو الفهرسة: صفحاتنا indexable لكن ما نظهر (robots الحافة + سلطة صفر).
2. كل الروابط الخارجية القديمة (باك لينكس وإشارات سابقة) ترجع 404 → خسارة equity.
3. GSC غير موصول → ما فيه أرضية قياس للترتيب.

## Slide 3 — Indexing Root Causes (P0)
- **robots.txt الحي** فيه كتلة Cloudflare Managed تمنع GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider… وتعلن ai-train=no — عكس قرارك المعلن بفتح الزحف بالكامل.
- **كل التحويلات القديمة 404 حيًا** (أمثلة مثبتة: /about.html، /services/finance.html، /blog/cloude-opus-4.6*) رغم عملها محليًا.

## Slide 4 — Astro Technical Findings
- قنبلة بناء كانت مزرولة: 5 صفحات حقيقية (/blog/، /docs/، /en/، /assessment/، دليل NCA ECC) تنطبع كصفحات تحويل ذاتي 291 بايت في البناء المحلي — انعكلت بفلترة متصادمة في مولّد التحويلات (توقيت الكشف منع وصولها للإنتاج).
- تحذيرات التصادم الـ26 التاريخية: صفر الحين.

## Slide 5 — Cloudflare Findings
- AI Crawl Control فعّال ويحقن robots رغم إعداد CNAME (موثق أنه يعطّل ميزات أخرى).
- robots.txt يتخزن 4 ساعات على الحافة — بعد التعديل لازم purge.
- الباقي سليم: HTTPS/HSTS/CSP/توحيد النطاقات كلها صحيحة.

## Slide 6 — Saudi SERP Findings
- «حوكمة الذكاء الاصطناعي» معلوماتي: حكومي + مواقع محلية (سيادة AI، IsoHere).
- «منصة حوكمة الذكاء الاصطناعي» تجاري: منافس مباشر واحد تقريبًا (KriftAI).
- الإنجليزي التجاري: شركات GRC (Complyan/CyberArrow/Modulos) + منصة سعودية ناشئة (امتثال).
- **«جدار حماية الذكاء الاصطناعي» بالعربي: السوق فاضي** — صفحتنا جاهزة تملكه.

## Slide 7 — Owner URL Architecture (intact)
/ = العلامة والفئة · /solutions/ai-governance-platform/ = التجاري · /hub/ai-governance/ = المعرفي · /assessment/ = التحويل · /tools/ai-risk-register/ = الأداة المجانية (رُبطت اليوم).

## Slide 8 — Cannibalization
Banking (12 صفحة) وHealthcare (8) مؤرشفة بقرارات مشروطة بـ GSC — ما لمسنا شيئًا بدون بيانات.

## Slide 9 — Saudi Content Language
اللغة سعودي عامي سليمة عبر الموقع؛ حالة رسمية واحدة صلحت اليوم (دليل NCA ECC).

## Slide 10 — AI Search / AEO / GEO / LLMO
المحتوى قابل للاقتباس (إجابات مباشرة + جداول + مصادر رسمية). الحاجز الأول والأخير: robots الحافة.

## Slide 11 — Fixes Implemented (today)
| المشكلة | الإصلاح | التحقق |
|---|---|---|
| 5 صفحات تُطبع كـ stubs | فلترة تصادمية في مولّد التحويلات | dist سليم + 0 تحذيرات |
| خريطة التحويلات ميتة | طبقة runtime بالـ listener + شحن redirects.json | 301 محليًا لكل الفئات + اختبار 5/5 |
| صفحة الأداة يتيمة | 3 روابط سياقية | 0 يتامى |
| الأداة خارج sitemap | فرع tools/ بالمولّد | sitemap 260 |
| صياغة رسمية واحدة | إعادة صياغة عامية | مسح 0 |

## Slide 12 — Before vs After (local)
sitemap 259→260 مستقر · 0 يتامى (كان 1) · 0 صفحات مكسورة (كانت 5 تحت الخطر) · التحويلات القديمة 0%→100% محليًا · بوابات SEO كلها PASS.

## Slide 13 — Remaining External Gaps
1. Cloudflare: إيقاف managed robots (P0).
2. Commit + deploy (كل إصلاحات اليوم + جلسة entity).
3. GSC: توصيل + تصدير 90 يوم.
4. باك لينكس/PR أخلاقي.

## Slide 14–16 — 30/60/90
- **30 يوم:** إصلاح Cloudflare → نشر → GSC → فحص عينات التحويل حيًا → طلب فهرسة للـ8 صفحات المالكة.
- **60 يوم:** قرارات الكانيباليزيشن بالـGSC → محتوى سلطة عربي (تسجيل سدايا للشركات + مركز AI Firewall العربي) → بداية PR.
- **90 يوم:** قياس impressions/CTR → دمج/تقليم → توسع إنجليزي بعد نتائج العربي.

## Slide 17 — KPIs
فهرسة: صفحات Indexed بالـGSC · ظهور AI: ذكر BrightAI في ChatGPT/Perplexity لاستعلامات الحوكمة · ترتيب: top-20 للكلمات المالكة · CTR: >2% للتجارية · تحويلات: جلسات assessment.
