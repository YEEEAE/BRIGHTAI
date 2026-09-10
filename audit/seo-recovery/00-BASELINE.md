# SEO Recovery — Baseline (evidence-based control plane)
Date (UTC): 2026-09-10
Site: https://brightai.live
Scope: repository + astro.config.mjs + src/pages/** + src/layouts/** + src/components/** + public/robots.txt + sitemap + redirects + structured-data + analytics + SEO scripts + audit/keyword/BRIGHTAI-KEYWORDS-MERGED-2026-09-08.csv

## مصادر الحقيقة المستخدمة (فقط ما رجّع بيانات فعلًا)
- public/sitemap.xml: 264 URLs (loc count) — مصدر الجرد الأساسي للروابط القابلة للفهرسة.
- src/pages/**/*.astro: 83 ملفًا (منها قوالب ديناميكية answer/solutions/blog/docs/hub/category/authors).
- src/content/blog: 97 مقالًا / src/content/docs: 50 دليلًا.
- src/data/answers.ts: 15 slug entries (تشمل تعريف النوع) / src/data/solutions.ts: 19 slug matches.
- redirects.json: 228 redirect entries (from->to).
- public/robots.txt: 119 سطرًا — سياسة مقصودة (search allow + AI-search allow + training disallow + Disallow /api/ + Sitemap واحد).
- public/llms.txt + llms-full.txt: موجودان (200 متوقع حيًا حسب تدقيق 2026-09-02).
- layouts: BaseLayout (index,follow افتراضي + allowlist noindex: /thank-you/ /offline/ /kernel/offline/ /design/) + SEOHead (canonical self + encodeURI + hreflang pairs + ar-SA/x-default).
- structured-data: src/data/schema-helpers.ts (Organization + Service + Article + FAQPage + BreadcrumbList + WebPage + Event + HowTo + LocalBusiness/Service للرياض فقط).
- analytics: GA4 G-9LMB4PGTWJ في BaseLayout (async + preconnect) + public/js/{analytics,gtag-init,clarity-init,bing-uet,mixpanel-init}.noncritical.
- CSV الكلمات: 80 كلمة (P0=10 / P1=16 / P2=14 / P3=28 / blank=12 | informational=56 / commercial=19 / navigational=5).
- historical Semrush snapshot داخل CSV (phrase_these/fullsearch على sa بتاريخ 2026-09-08) — 68 measured سابقًا في النسخة 312، وهذه النسخة 80 صفًا بسعة measured محدودة؛ يُستخدم كإشارة تاريخية فقط وليس ترتيبًا حيًا.

## أدوات لم تُرجع بيانات حية (مُعلنة بوضوح — لا تخمين)
- Google Search Console: لا Export متاح (clicks/impressions/position = N/A في كل الجرد).
- Ubersuggest / SE Ranking / Semrush live / Ahrefs live: لا credentials ولا network calls في هذه المهمة؛ لم تُنفّذ استعلامات حية. أي أرقام Semrush المذكورة هي من snapshot الخام المحفوظ في audit/keyword/raw/ بتاريخ 2026-09-08.
- Lighthouse/PSI/CrUX: N/A في هذه الموجة (audit artifacts فقط + فحص ثابت للمصدر).

## المنهجية (بدون page-per-keyword)
- target_url في CSV لم يُؤخذ كمسلّمة؛ روجع كل صف ضد: عرض BrightAI الفعلي (حوكمة AI + firewall + PDPL + NCA + SDAIA + ISO + assessment + أدوات) + نية البحث + غرض الصفحة الحالية + الملاءمة التجارية + حالة sitemap المحلي. لا دليل GSC حي.
- الكلمات ذات النية المكافئة جُمعت عبر تطبيع (normalizeKw: توحيد الهمزات/التاء/الألف المقصورة + lowercase + إزالة ترقيم) — لكل intent مميز مالك PRIMARY واحد فقط.
- لم تُنشأ صفحات هبوط جديدة في هذه الموجة (control plane فقط).
- word count للـ md من body الفعلي؛ للـ astro من النص المجرّد (تقريبي للفرز وليس بديلًا عن قياس HTML المبني). عناوين title/H1 مستخرجة من المصدر (prop/frontmatter/أول h1).

## الأرقام المجمعة (بوابة الإكمال — بعد consolidation 2026-09-10)

> هذه الأرقام تعكس `04-INDEXATION-PLAN.csv` النهائي (264 sitemap + 10 utility مُدارة = 274 صفًا). التفاصيل في `06-CONSOLIDATION-CHANGELOG.md`.

- total URLs analyzed: 274 (264 في sitemap + 10 utility خارجها)
- KEEP: 229 / IMPROVE: 35 / MERGE: 0 / NOINDEX: 0 / REDIRECT: 0 / REVIEW: 0 / REMOVE_FROM_SITEMAP: 10
- keyword owners assigned: PRIMARY_OWNER=27 / SECONDARY_SUPPORT=4 / REFERENCE_ONLY=17 / EXCLUDED=11 / VALIDATE_BEFORE_TARGETING=21 (validation queue resolved 2026-09-10, see 07)
- cannibalization groups found: 13 (كلها KEEP مُوثّق — صفر دمج)
- keywords rejected (poor business fit): 8
- remaining ambiguous (VALIDATE_BEFORE_TARGETING): 24

## قرارات معمارية مثبتة (من المصدر)
1. canonical واحد self-referencing + trailing slash + encodeURI للعربي (SEOHead + sitemap) — يمنع 35 تعارض hreflang سابق.
2. hreflang من خريطة صريحة ثنائية الاتجاه (hreflang-pairs) — ar-SA + x-default للعربي فقط، + en-SA للثنائي الحقيقي فقط (7 أزواج).
3. noindex محصور بالـ allowlist (thank-you/offline/kernel/offline/design) — أي noindex آخر يُطبيع إلى index,follow.
4. Service بدل WebApplication/SoftwareApplication (بدون تقييمات مفبركة) + ProfessionalService للرياض فقط.
5. /go/ مسموح حاليًا (قرار SEMRUSH-UNBLOCK 2026-09-08) مع hub بدون wa.me مباشر في HTML (client-side redirect) — يمنع 429 الوهمي.
6. query-param pages في kernel تُعاد كتابتها server-side إلى self-referencing canonical/hreflang (patch-server-entry) — 34 صفحة kernel قابلة للفهرسة.
7. تدريب AI ممنوع افتراضيًا (GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider) مع بقاء بحث/استشهاد AI مسموحًا (OAI-SearchBot/ChatGPT-User/Perplexity/Claude-Search/User/YouBot).

## المخاطر المفتوحة
- لا GSC حي → قرارات MERGE/REDIRECT النهائية مشروطة ببيانات 28 يومًا بعد النشر.
- word counts تقريبية من المصدر (تحتاج تأكيد HTML مبني عبر check-word-count قبل أي ادعاء Semrush).
- route collisions وVite القديمة (تحذيرات build معروفة) خارج نطاق هذه الموجة.
- og:locale للإنجليزية en_US مقابل en_SA (P1 موثق) لم يُمس هنا.

## الاتساق الداخلي
- 01 rows (264) == sitemap loc (264) ✅
- 02 rows (80) == CSV rows ✅, ownership مجموع = 80 ✅
- 03 groups (13) مشتقة من CSV target/alternative + topic clusters ✅
- 04 rows (264) == 01 rows ✅, dispositions متطابقة ✅
- 05 actions مبنية على 01+02+03+04 فقط (لا مصادر خارجية) ✅
