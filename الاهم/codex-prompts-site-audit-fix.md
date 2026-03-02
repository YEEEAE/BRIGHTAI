# Codex Prompts — Site Audit Fix Plan
**Generated:** 2026-03-03
**Project:** BrightAI

## مصدر التحليل
- الاهم/Site_Audit_report.pdf (Semrush Full Report، 2026-03-02)
- نتائج المشروع المحلية: `npm run seo:check`, `npm run seo:html:check`, `npm run performance:budget`
- ملف داعم للتفاصيل: الاهم/تقارير للمشروع/مكتشف اخطاء موقعي/issues_overview_report.csv

## التغطية
- عدد بنود PDF غير الصفرية المغطاة ببرومبتز: **20**
- بنود Crawl الإضافية في ملف Excel (تبويب Supplemental): **43**

## Prompts (PDF Non-Zero Issues)
### PDF-E01 — hreflang conflicts within page source code (190)
- **Category:** Error | **Priority:** P0
- **Scope:** frontend/pages/**/*.html + الصفحات الجذرية (about/, ai-agent/, consultation/, data-analysis/, machine-learning/, smart-automation/)
- **Verify:** `npm run seo:check && npm run seo:html:check`
```text
أنت تعمل داخل /Users/yzydalshmry/Desktop/BRIGHTAI. أصلح مشكلة hreflang conflicts (190 حالة) من تقرير Semrush بتاريخ 2026-03-02.
الخطوات المطلوبة:
1) افحص كل صفحات HTML وحدد الأنماط الخاطئة في hreflang (تعارض مع canonical، غياب self-reference، قيم x-default غير متسقة).
2) وحّد قواعد hreflang إلى نسختين أساسيتين: ar-SA وen-SA عند توفر النسخة الإنجليزية، مع x-default يشير للنسخة العربية الأساسية.
3) اربط كل hreflang فقط مع URL canonical النهائي 200 بدون redirect أو query tracking.
4) عدّل السكربتات المسؤولة عن التوليد التلقائي (خصوصاً scripts/html-seo-governor.mjs و scripts/seo-ci-check.mjs) لضمان عدم رجوع المشكلة.
5) سلّم تقرير قبل/بعد في reports/fix-hreflang-conflicts.md مع قائمة الملفات المعدلة.
معايير القبول: اختفاء أخطاء hreflang المرتبطة من seo checks وعدم كسر أي canonical حالي.
```

### PDF-E02 — incorrect pages found in sitemap.xml (137)
- **Category:** Error | **Priority:** P0
- **Scope:** sitemap.xml + scripts/generate-sitemap-all-pages.mjs + صفحات blog/docs
- **Verify:** `node scripts/generate-sitemap-all-pages.mjs && npm run seo:check`
```text
أصلح مشكلة incorrect pages in sitemap.xml (137 حالة).
المطلوب:
1) راجع sitemap.xml واحذف أي URL غير canonical أو يُعيد توجيه أو يعطي non-200.
2) حدّث منطق scripts/generate-sitemap-all-pages.mjs لاستبعاد الصفحات منخفضة الجودة والروابط ذات المسافات/underscores/redirect targets.
3) تأكد أن كل URL في السايت ماب يطابق canonical داخل الصفحة نفسها.
4) طبّق regenerate للسايت ماب وسلّم diff واضح.
5) أنشئ تقرير reports/fix-sitemap-incorrect-pages.md يوضح عدد الروابط قبل/بعد.
معيار القبول: لا يوجد URL غير صالح في sitemap.xml وكل العناصر قابلة للفهرسة.
```

### PDF-E03 — structured data items are invalid (50)
- **Category:** Error | **Priority:** P0
- **Scope:** index.html + frontend/pages/docs/*.html + frontend/pages/blogger/*.html + schema-saudi-seo.json
- **Verify:** `node scripts/add-article-schema.js`
```text
أصلح مشكلة structured data invalid (50 عنصر).
نفّذ التالي:
1) افحص JSON-LD في صفحات docs/blog/home وتحديد الحقول المفقودة/غير الصحيحة (خصوصاً availableLanguage, aggregateRating, review, address).
2) وحّد الأنواع حسب الصفحة (LocalBusiness/Service/SoftwareApplication/Article) وتأكد من صحة @context و @type و mainEntityOfPage.
3) أزل أي خصائص غير مدعومة أو بقيم فارغة.
4) حدّث/أنشئ سكربت تحقق تلقائي داخل scripts للتحقق من JSON-LD على كل HTML.
5) سلّم تقرير reports/fix-structured-data-invalid.md بقائمة الصفحات المصححة.
معيار القبول: جميع عناصر JSON-LD صالحة وقابلة للاختبار عبر Rich Results.
```

### PDF-E04 — internal links are broken (18)
- **Category:** Error | **Priority:** P0
- **Scope:** جميع HTML + scripts/internal-links-*.mjs + صفحات docs/*/contact غير الموجودة
- **Verify:** `node scripts/internal-links-audit.mjs && node scripts/fix-internal-links.mjs`
```text
أصلح مشكلة broken internal links (18 رابط).
المطلوب:
1) نفّذ تدقيق كامل للروابط الداخلية.
2) أصلح كل رابط داخلي 4xx/غير موجود باستبداله بمسار صحيح canonical أو إنشاء صفحة هدف إذا كانت مطلوبة تجارياً.
3) عالج الروابط الوهمية من نوع /contact تحت مسارات docs إذا غير موجودة فعلياً.
4) ثبّت قاعدة lint تمنع إدخال روابط داخلية مكسورة مستقبلاً.
5) سلّم تقارير before/after داخل مجلد تقارير للمشروع + reports/fix-broken-internal-links.md.
معيار القبول: صفر روابط داخلية مكسورة في التدقيق النهائي.
```

### PDF-E05 — pages returned 4XX status code (16)
- **Category:** Error | **Priority:** P0
- **Scope:** روابط blog/docs المتكسرة + netlify.toml/redirect rules
- **Verify:** `npm run seo:check`
```text
عالج صفحات 4XX (16 حالة) بدون كسر البنية الحالية.
المهام:
1) استخرج كل مسارات 4xx وأسبابها (صفحة محذوفة/خطأ تهجئة/مسار قديم).
2) طبّق one-hop 301 redirects للمسارات القديمة إلى أفضل بديل سياقي.
3) حدّث جميع الروابط الداخلية التي تشير للمسارات القديمة إلى الوجهة النهائية مباشرة.
4) تحقق من عدم وجود redirect chains.
5) أنشئ تقرير reports/fix-4xx-pages.md يربط كل مسار قديم بمساره الجديد.
معيار القبول: اختفاء أخطاء 4xx من الزحف الداخلي.
```

### PDF-E06 — issues with broken internal JavaScript and CSS files (3)
- **Category:** Error | **Priority:** P1
- **Scope:** frontend/js/* + frontend/css/* + المراجع داخل HTML
- **Verify:** `npm run performance:budget`
```text
أصلح broken internal JS/CSS (3 حالات).
نفّذ:
1) حدد الموارد التي ترجع 4xx من داخل الصفحات.
2) صحح المسارات أو أنشئ fallback محلي للملفات الناقصة.
3) امنع تكرار المشكلة بإضافة فحص integrity لمسارات JS/CSS في CI.
4) تأكد أن كل صفحة تستخدم ملفات موجودة فعلاً داخل frontend/js أو frontend/css.
5) سلّم تقرير reports/fix-broken-internal-assets.md.
معيار القبول: عدم وجود أي internal asset broken في الفحص.
```

### PDF-E07 — issue with incorrect hreflang links (1)
- **Category:** Error | **Priority:** P0
- **Scope:** frontend/pages/docs/docs.html + جميع hreflang المطلقة
- **Verify:** `npm run seo:check`
```text
أصلح الخطأ المتبقي في incorrect hreflang links (حالة واحدة).
المطلوب:
1) حدد الصفحة التي تحتوي hreflang redirect/relative URL.
2) استبدلها بروابط absolute 200 canonical فقط.
3) أضف test يمنع أي hreflang href نسبي أو redirect مستقبلًا.
4) وثق التعديل في reports/fix-incorrect-hreflang-link.md.
معيار القبول: صفر incorrect hreflang links.
```

### PDF-W01 — issues with unminified JavaScript and CSS files (357)
- **Category:** Warning | **Priority:** P1
- **Scope:** frontend/css/*.css + frontend/js/*.js + index.html وباقي الصفحات
- **Verify:** `npm run performance:budget`
```text
أصلح unminified JS/CSS (357 حالة) بمنهجية تدريجية.
1) احصر الملفات غير المصغرة المرتبطة بالإنتاج.
2) فعّل نسخة minified لكل مورد إنتاجي وتأكد أن HTML يربط النسخ المصغرة.
3) لا تكسر sourcemaps أو بيئة التطوير.
4) أضف فحص CI يمنع ربط ملفات غير مصغرة في صفحات الإنتاج.
5) سلّم تقرير reports/fix-unminified-assets.md مع حجم before/after.
معيار القبول: انخفاض واضح في إجمالي وزن JS/CSS دون تجاوز ميزانية الأداء.
```

### PDF-W02 — pages have low text-HTML ratio (232)
- **Category:** Warning | **Priority:** P1
- **Scope:** frontend/pages/blogger/*.html + docs/blog pages ذات inline code مرتفع
- **Verify:** `npm run seo:html:check`
```text
عالج low text-HTML ratio (232 صفحة) بدون حشو غير مفيد.
المهام:
1) فصل CSS/JS inline إلى ملفات خارجية قدر الإمكان.
2) إزالة أكواد/تعليقات زائدة من HTML.
3) تعزيز النص الأساسي لكل صفحة بمحتوى فعلي مرتبط بنية البحث.
4) ركّز على الصفحات التجارية وصفحات blog الأعلى أولوية.
5) سلّم تقرير reports/fix-low-text-html-ratio.md مع أفضل 50 صفحة تحسنت.
معيار القبول: انخفاض عدد الصفحات منخفضة النسبة بشكل كبير بعد إعادة الزحف.
```

### PDF-W03 — pages have a low word count (36)
- **Category:** Warning | **Priority:** P1
- **Scope:** صفحات blog/docs منخفضة المحتوى
- **Verify:** `npm run seo:html:check`
```text
أصلح low word count (36 صفحة < 200 كلمة).
1) حدّد الصفحات المستهدفة حسب أولوية تجارية (خدمات/حلول/قطاعات).
2) أضف محتوى أصلي عربي واضح (FAQ مختصر + حالات استخدام + CTA).
3) لا تضيف نصوص مكررة بين الصفحات.
4) حدّث meta description/title بما يعكس المحتوى الجديد.
5) وثّق قبل/بعد في reports/fix-low-word-count.md.
معيار القبول: كل الصفحات المستهدفة تتجاوز 200 كلمة مفيدة.
```

### PDF-W04 — external links are broken (8)
- **Category:** Warning | **Priority:** P2
- **Scope:** روابط خارجية داخل blog/docs
- **Verify:** `node scripts/internal-links-audit.mjs`
```text
أصلح broken external links (8 روابط).
1) افحص كل رابط خارجي مكسور وحدد بديل موثوق.
2) استبدل الروابط الميتة أو احذفها إذا بلا بديل.
3) أضف rel المناسب (noopener/noreferrer) للروابط الخارجية التي تفتح تبويب جديد.
4) أنشئ ملف تتبع reports/fix-broken-external-links.md.
معيار القبول: صفر روابط خارجية مكسورة في التدقيق التالي.
```

### PDF-W05 — pages have underscores in the URL (7)
- **Category:** Warning | **Priority:** P2
- **Scope:** frontend/pages/blogger/*.html + sitemap/redirects
- **Verify:** `node scripts/generate-sitemap-all-pages.mjs`
```text
عالج URLs التي تحتوي underscores (7 صفحات) بحذر.
1) جهّز slug جديد باستخدام hyphens فقط.
2) أضف 301 redirect من القديم للجديد (one-hop).
3) حدّث canonical/hreflang/internal links/sitemap للروابط الجديدة.
4) تأكد أن أي backlink داخلي يشير للمسار الجديد مباشرة.
5) سلّم mapping واضح في reports/fix-underscored-urls.md.
معيار القبول: اختفاء كل underscores URLs من التقرير.
```

### PDF-N01 — pages have only one incoming internal link (117)
- **Category:** Notice | **Priority:** P1
- **Scope:** blog/docs/sector pages + الربط من الصفحة الرئيسية
- **Verify:** `node scripts/generate-related-articles.mjs`
```text
عالج pages with one incoming internal link (117 صفحة).
1) أنشئ خطة internal linking حسب topic clusters.
2) أضف 2-4 روابط داخلية سياقية لكل صفحة مهمة من صفحات ذات سلطة أعلى.
3) حسّن anchor text ليكون وصفي وغير عام.
4) استخدم script/generator عند الإمكان لتفادي العمل اليدوي المتكرر.
5) سلّم تقرير reports/fix-low-internal-inlinks.md.
معيار القبول: انخفاض واضح في الصفحات ذات incoming link الواحد.
```

### PDF-N02 — URLs with a permanent redirect (59)
- **Category:** Notice | **Priority:** P1
- **Scope:** جميع الروابط الداخلية + canonical + sitemap
- **Verify:** `npm run seo:check`
```text
عالج URLs with permanent redirect (59).
1) استخرج كل الروابط الداخلية التي تمر عبر 301/308.
2) استبدلها بالرابط النهائي المباشر في HTML وJSON-LD وsitemap.
3) امنع redirect chains نهائياً.
4) حافظ على redirects الخارجية الضرورية فقط.
5) وثّق النتائج في reports/fix-permanent-redirect-urls.md.
معيار القبول: تقليص روابط التحويل الداخلية إلى الحد الأدنى.
```

### PDF-N03 — pages are blocked from crawling (42)
- **Category:** Notice | **Priority:** P1
- **Scope:** robots.txt + meta robots + headers
- **Verify:** `cat robots.txt && npm run seo:check`
```text
راجع pages blocked from crawling (42 صفحة).
1) صنف الصفحات المحجوبة إلى: مقصود حجبها / يجب فتحها.
2) افتح الصفحات ذات القيمة التجارية للفهرسة.
3) أبقِ صفحات low-value/duplicate/noise محجوبة بشكل متعمد مع توثيق السبب.
4) حدث robots.txt والسياسات المرتبطة بدون تعارض.
5) سلّم تقرير decision log في reports/fix-blocked-crawl-pages.md.
معيار القبول: لا توجد صفحة مهمة محجوبة عن الزحف.
```

### PDF-N04 — pages have hreflang language mismatch issues (19)
- **Category:** Notice | **Priority:** P1
- **Scope:** وسوم lang + hreflang في الصفحات الثنائية اللغة
- **Verify:** `npm run seo:check`
```text
أصلح hreflang language mismatch (19 حالة).
1) تأكد أن لغة المحتوى الفعلية تطابق lang وhreflang.
2) الصفحات العربية: lang=ar-SA + dir=rtl، والإنجليزية: lang=en-SA + dir=ltr.
3) راجع الصفحات المختلطة المحتوى وأعد ضبط التوسيم.
4) أضف فحص آلي لاكتشاف mismatch مستقبلًا.
5) وثّق قبل/بعد في reports/fix-hreflang-language-mismatch.md.
معيار القبول: اختفاء mismatch من التقرير القادم.
```

### PDF-N05 — pages need more than 3 clicks to be reached (15)
- **Category:** Notice | **Priority:** P2
- **Scope:** بنية التنقل الرئيسية + hub pages + breadcrumbs
- **Verify:** `node scripts/generate-related-articles.mjs`
```text
عالج crawl depth > 3 clicks (15 صفحة).
1) أنشئ روابط اختصار من صفحات hub ذات سلطة إلى الصفحات العميقة.
2) أضف breadcrumbs وروابط سياقية من مقالات مرتبطة.
3) تأكد أن كل صفحة مهمة لا تبعد أكثر من 3 نقرات من الصفحة الرئيسية.
4) لا تكسر UX أو الترتيب الحالي للقوائم.
5) سلّم تقرير depth map جديد في reports/fix-crawl-depth.md.
معيار القبول: هبوط عدد الصفحات العميقة بشكل واضح.
```

### PDF-N06 — orphaned pages in sitemaps (10)
- **Category:** Notice | **Priority:** P1
- **Scope:** sitemap.xml + internal links + صفحات orphan
- **Verify:** `node scripts/generate-sitemap-all-pages.mjs`
```text
أصلح orphaned pages in sitemap (10 صفحات).
1) حدّد الصفحات اليتيمة: إمّا تربط داخلياً أو تزال من sitemap.
2) الصفحات ذات قيمة: أضف لها روابط داخلية سياقية.
3) الصفحات غير المهمة: أخرجها من sitemap مع تبرير.
4) أعد توليد sitemap وحدث أي خرائط مرتبطة.
5) سلّم تقرير reports/fix-orphaned-sitemap-pages.md.
معيار القبول: لا صفحات يتيمة مهمة داخل sitemap.
```

### PDF-N07 — issues with broken external JavaScript and CSS files (2)
- **Category:** Notice | **Priority:** P2
- **Scope:** موارد CDN الخارجية في HTML
- **Verify:** `npm run performance:budget`
```text
أصلح broken external JS/CSS (2 حالات).
1) حدّد كل مورد خارجي broken.
2) استبدله بمصدر موثوق أو نسخة محلية fallback.
3) أضف strategy واضحة للـfallback عند فشل المورد الخارجي.
4) راجع تأثير التغيير على الأداء.
5) وثّق في reports/fix-broken-external-assets.md.
معيار القبول: لا موارد خارجية broken في الزحف.
```

### PDF-N08 — links on this page have no anchor text (2)
- **Category:** Notice | **Priority:** P2
- **Scope:** روابط داخلية/خارجية ذات anchor فارغ
- **Verify:** `node scripts/internal-links-audit.mjs`
```text
أصلح الروابط بدون anchor text (2 روابط).
1) استخرج الروابط ذات anchor الفارغ أو النص غير الوصفي.
2) أضف anchor نصي واضح يشرح وجهة الرابط.
3) للصور المرتبطة: تأكد من alt text وصفي.
4) أضف فحص static يمنع anchor فارغ مستقبلًا.
5) سلّم تقرير reports/fix-empty-anchor-links.md.
معيار القبول: عدم وجود روابط بلا anchor وصفي.
```
