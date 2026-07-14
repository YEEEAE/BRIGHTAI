Thought for 1sسأحلل المشروع بالكامل أولاً ثم أعطيك التقرير بالنسب المئوية والبرومبتز.

استكشفت بنية المشروعجردت ملفات المشروعThought for a momentExplore • 2 Filesجردت المجلداتجردت صفحات srcجردت صفحات الموقعقرأت API الشاتفحصت kernel والليّاوتThought for 1sفحصت SEO والفهرسةThought for 4s# تقرير تحليل مشروع BRIGHTAI الشامل

تم تحليل المشروع بالكامل: **Astro 6 (static output)** مع محول Vercel، ~137 صفحة مفهرسة في sitemap، ~57 صفحة `.astro`، ~40 مقال مدونة، 12 صفحة Kernel، نظام SEO متقدم (scripts للفحص، schema sync، IndexNow)، وAPI شات موجود فعلياً في `/api/ai/chat` (Groq + Gemini fallback مع rate limiting).

---

## أولاً: النسب المئوية للوضع الحالي

| المحور | النسبة الحالية | الملاحظات
|-----|-----|-----
| البنية التقنية (Astro/Vercel) | **85%** | تحويل HTML→Astro تم بشكل جيد، لكن توجد ملفات `.bak` وبقايا HTML قديمة (`index-2.html`) وملفات مكررة تلوّث المشروع
| SEO التقني (Sitemap/Robots/Schema) | **80%** | بنية ممتازة (sitemap ديناميكي، robots شامل لزواحف AI، schema sync) لكن تحتاج تحقق فعلي بعد التحويل
| فهرسة صفحات Kernel | **65%** | الصفحات موجودة لكن محتواها SEO ضعيف نسبياً (dashboard-first وليس content-first)
| تكامل Groq AI في Kernel | **55%** | API موجود ومؤمّن، لكن مربوط فقط بصفحة chat — باقي صفحات Kernel تعمل على mock data وليست "جاهزة للاستخدام الفعلي من العملاء"
| جاهزية Kernel كمنتج للعملاء | **50%** | لا يوجد lead capture حقيقي، لا حفظ جلسات، البيانات تجريبية
| تناسق التصميم بعد التحويل | **70%** | نظام tokens وdesign pages موجود، لكن تحويل HTML→Astro عادة يترك كسور بصرية بحاجة فحص صفحة-صفحة
| الأداء على الجوال (Core Web Vitals) | **65%** | يوجد lighthouserc وperformance budget، لكن CSS متعدد الملفات + خطوط + صور تحتاج تدقيق LCP/CLS فعلي
| تصدّر البحث بالسعودية (محتوى محلي) | **75%** | محتوى سعودي قوي (PDPL, SDAIA, NCA, رؤية 2030، solutions لكل مدينة) لكن ينقصه GEO/LLMO أعمق وترابط داخلي مُحكم
| النظافة العامة للمستودع | **60%** | ملفات bak، مجلد kernel قديم موازٍ لـ src، سكربتات qa متناثرة بالجذر
| **التقييم الإجمالي** | **≈ 67%** | 


---

## ثانياً: برومبتز التنفيذ عبر MiniMax M3

> **تعليمات الاستخدام:** نفّذ البرومبتز بالترتيب، برومبت واحد لكل جلسة، ولا تنتقل للتالي قبل نجاح `npm run build` وفحوصات `npm run seo:all`.



---

### البرومبت 1 — تنظيف المستودع بعد التحويل من HTML إلى Astro

```plaintext
أنت تعمل على مشروع BrightAI (Astro 6, static output, adapter Vercel, الموقع https://brightai.site).
المشروع تم تحويله مؤخراً من HTML ثابت إلى Astro. مهمتك تنظيف بقايا التحويل بدون كسر أي صفحة:

1. احذف الملفات الاحتياطية والقديمة فقط بعد التأكد أنها غير مستوردة في أي مكان:
   - src/content.config.ts.bak-* و src/data/blog.ts.bak-* و src/styles/tokens.css.bak.*
   - astro.config.mjs.bak.20260706
   - index-2.html في الجذر (تأكد أولاً أنه غير مرجعي في redirects.json أو render.yaml)
2. راجع مجلد /kernel في الجذر (assets/css, assets/js, api/mock): حدد ما يُستخدم فعلياً من صفحات src/pages/kernel/*.astro عبر البحث عن المسارات، وانقل المستخدم إلى public/ أو src/ حسب طبيعته، ووثّق غير المستخدم في تقرير بدل حذفه.
3. لا تحذف أي شيء من: src/pages, src/content, src/data, src/components, public/robots.txt, public/sitemap*.xml, redirects.json.
4. بعد كل خطوة شغّل: npm run build ثم npm run seo:all وتأكد من نجاحهما.
5. أخرج تقريراً بكل ملف حذفته أو نقلته والسبب.
القاعدة الذهبية: أي شك = لا تحذف. الحفاظ على 137 رابط sitemap كما هي بدون نقصان.
```

---

### البرومبت 2 — تدقيق التصميم صفحة-صفحة (بدون حذف أي قسم)

```plaintext
مشروع BrightAI (Astro 6، عربي RTL، dir="rtl" lang="ar-SA"، نظام tokens في src/styles/tokens.css).
مهمتك: تدقيق بصري كامل لكل الصفحات غير-Kernel وضمان أفضل شكل وتناسق، مع قاعدة صارمة: ممنوع حذف أو اختصار أي قسم أو نص أو مكوّن نهائياً — الإصلاح فقط.

الصفحات: / , /about/ , /services/ , /solutions/ وكل [sector] و[sector]/[city] , /blog/ وكل المقالات , /docs/ , /hub/ , /pricing/ , /contact/ , /demo/ , /trust/ , /assessment/ai-governance-readiness/ , صفحات القانونية (privacy, terms, pdpl, cookies, dpa) بالعربي والإنجليزي , /sitemap/ , /404.

لكل صفحة افحص وأصلح:
1. RTL: استخدم الخصائص المنطقية (margin-inline-start, padding-inline-end, text-align: start) بدل left/right، وتأكد من العناصر المختلطة عربي/إنجليزي (أرقام، أسماء تقنية) بـ dir="ltr" أو unicode-bidi حيث يلزم.
2. التجاوب: اختبر عند 360px و768px و1024px و1440px — لا overflow أفقي، لا نصوص مقصوصة، لا أزرار متلاصقة (مساحة لمس ≥44px).
3. التناسق: وحّد المسافات على مقياس ثابت، وحّد ظل/حدود/أنصاف أقطار البطاقات عبر tokens الموجودة، لا تدخل ألواناً جديدة خارج tokens.css.
4. الهيدر والفوتر وMobileNav: تأكد من عملها بكل المقاسات ومن أن القوائم المنسدلة لا تُقص.
5. الصور: كل صورة لها width/height صريحة وloading="lazy" (عدا صور فوق الطية) لمنع CLS.
6. الخطوط: تأكد من font-display: swap وعدم وجود FOIT.
بعد كل مجموعة صفحات: npm run build والتقط لقطات مقارنة. أخرج تقريراً: الصفحة → المشاكل المكتشفة → الإصلاح المطبق.
```

---

### البرومبت 3 — الأداء وCore Web Vitals للجوال والكمبيوتر

```plaintext
مشروع BrightAI Astro 6 static على Vercel. الهدف: Lighthouse Performance ≥95 جوال وكمبيوتر، LCP <2.5s، CLS <0.1، INP <200ms.
يوجد بالفعل .lighthouserc.json و scripts/check-performance-budget.js — استخدمهما كبوابة قبول.

نفّذ:
1. CSS: المشروع يحمّل ملفات متعددة (base, components, pages, utilities, animations, kernel). أدمج الحرج منها inline في <head> عبر Astro، وأجّل غير الحرج. احذف CSS غير المستخدم بأداة تحليل فعلية وليس تخميناً.
2. JavaScript: افحص كل <script> في الصفحات واللياوتات — أجّل كل ما لا يلزم للعرض الأول (defer/module)، وأزل أي مكتبة غير مستخدمة. سكربتات kernel-*.js يجب ألا تُحمّل خارج صفحات /kernel/.
3. الصور: حوّل كل الصور في public/images إلى WebP/AVIF بأحجام responsive (srcset)، صورة LCP لكل صفحة تأخذ fetchpriority="high" وloading="eager".
4. الخطوط: subset للخط العربي، preload للوزن الأساسي فقط، font-display: swap.
5. التحليلات (GA4 + Clarity): حمّلها بعد التفاعل أو بـ requestIdleCallback حتى لا تحجب main thread.
6. Service Worker (public/sw.js): تأكد أنه لا يكسّر التحديثات وأن استراتيجية الكاش stale-while-revalidate للأصول وnetwork-first للـ HTML.
7. أضف preconnect لأي origin خارجي مستخدم فعلياً فقط.
ممنوع: حذف أي محتوى مرئي، تغيير أي نص، كسر أي رابط. بعد كل تغيير: npm run build && npm run performance:budget. أخرج جدولاً قبل/بعد لكل صفحة رئيسية.
```

---

### البرومبت 4 — إكمال صفحات Kernel كمنتج حقيقي مربوط بـ Groq API

```plaintext
مشروع BrightAI. صفحات Kernel في src/pages/kernel/ (index, chat, compliance, policies, evidence, audit, approvals, connectors, scenarios, reports, stats, offline). يوجد API جاهز ومؤمّن في src/pages/api/ai/chat.ts (POST { message, systemPrompt?, provider? } → { reply, provider }) يقرأ GROQ_API_KEY من بيئة الخادم مع rate limit 10 طلبات/دقيقة، وprerender=false عليه فقط.

الهدف: تحويل Kernel من عرض تجريبي إلى صفحات متكاملة قابلة للاستخدام الفعلي من العملاء المحتملين:

1. صفحة /kernel/chat/: تأكد أن الواجهة تستدعي /api/ai/chat فعلياً وتعرض الرد، مع: حالات تحميل واضحة، معالجة أخطاء بالعربي (429 rate limit، 502 فشل المزود، انقطاع الشبكة)، الحفاظ على سياق المحادثة داخل الجلسة (client-side فقط)، وزر "تواصل معنا" يظهر بعد 3 رسائل لتحويل الزائر إلى lead.
2. لكل صفحة Kernel وظيفية (compliance, policies, evidence, audit, scenarios): أضف قسم "جرّب بالذكاء الاصطناعي" يستخدم نفس /api/ai/chat مع systemPrompt مخصص لمجال الصفحة (مثلاً: صفحة compliance ترسل systemPrompt عن PDPL/SDAIA/NCA بالسعودية). المستخدم يدخل سؤاله ويحصل على إجابة متخصصة.
3. البيانات التجريبية (kernel/api/mock/*.json): اجعلها تُعرض بوضوح كـ "بيانات توضيحية" مع KernelDemoPill الموجود، ولا تحذفها.
4. أضف نموذج lead capture (اسم، بريد/جوال، شركة) في نهاية كل صفحة Kernel يرسل إلى /api/ (route جديد بنفس نمط أمان chat.ts أو mailto/WhatsApp CTA الموجود) — بدون أي مكتبات خارجية.
5. ممنوع تعديل chat.ts بطريقة تكشف المفاتيح، وممنوع أي استدعاء Groq من المتصفح مباشرة.
6. كل النصوص عربية فصحى بمصطلحات سوق السعودية.
اختبر يدوياً كل صفحة بعد التعديل. أخرج تقريراً بكل صفحة والوظائف المضافة.
```

---

### البرومبت 5 — فهرسة صفحات Kernel بالكامل (SEO للمنتج)

```plaintext
مشروع BrightAI. صفحات /kernel/* حالياً dashboards تفاعلية بمحتوى نصي قليل — يجب جعلها قابلة للفهرسة الكاملة والتصدر في بحث السعودية.

لكل صفحة من الـ 12 صفحة في src/pages/kernel/:
1. تأكد من عدم وجود noindex (افحص SEOHead.astro وKernelLayout.astro وBaseLayout.astro) وأن canonical صحيح بصيغة https://brightai.site/kernel/<page>/ مع trailing slash.
2. أضف/حسّن قسم KernelSeoSection الموجود بحيث تحتوي كل صفحة على 400+ كلمة محتوى نصي ثابت (server-rendered وليس JS) يشرح: ما الوحدة، مشكلتها للشركات السعودية، علاقتها بـ PDPL/SDAIA/NCA/ISO 42001، وأسئلة شائعة (3-5 أسئلة).
3. Schema JSON-LD لكل صفحة: SoftwareApplication + BreadcrumbList + FAQPage (للأسئلة الشائعة) — استخدم src/components/seo/Schema.astro وsrc/data/schema-helpers.ts الموجودين.
4. عناوين فريدة: <title> بصيغة "الوحدة | BrightAI Kernel — حوكمة الذكاء الاصطناعي بالسعودية" وmeta description 150-160 حرفاً بكلمات مفتاحية سعودية (حوكمة الذكاء الاصطناعي، الامتثال، PDPL، سدايا).
5. ترابط داخلي: كل صفحة kernel تربط لصفحتي kernel أخريين + صفحة solution ذات صلة + مقال مدونة ذي صلة (استخدم getCrossLinks في src/data/kernel.ts).
6. تأكد أن كل صفحات kernel داخل sitemap.xml بعد البناء وأن المحتوى يظهر في HTML المبني (افحص dist/kernel/*/index.html بـ grep للنصوص).
7. شغّل npm run seo:all && npm run sitemap:generate وأصلح أي فشل.
ممنوع حذف أي وظيفة تفاعلية موجودة. أخرج جدولاً: الصفحة → عدد الكلمات → أنواع Schema → الروابط الداخلية.
```

---

### البرومبت 6 — تصدّر محركات البحث في السعودية (سيو شامل لكل الصفحات)

```plaintext
مشروع BrightAI Astro، الموقع https://brightai.site، السوق المستهدف: السعودية (الرياض، جدة، الدمام). يوجد نظام SEO قوي: scripts/seo-*.mjs، KEYWORDS-MAP.csv، PILLAR-MAP.md، CLUSTER-LINKING-PLAN.csv — اقرأها أولاً والتزم بها.

نفّذ على كل الصفحات (~137 صفحة):
1. تدقيق meta: لكل صفحة title فريد ≤60 حرفاً وdescription فريد 150-160 حرفاً، بالكلمة المفتاحية الأساسية من KEYWORDS-MAP.csv في بدايتهما. أصلح أي تكرار.
2. هيكل العناوين: h1 واحد فقط لكل صفحة يطابق نية البحث، تسلسل h2/h3 منطقي بدون قفزات.
3. الترابط الداخلي: طبّق CLUSTER-LINKING-PLAN.csv — كل مقال مدونة يربط لصفحة pillar ذات صلة ولـ 2-3 مقالات شقيقة بنصوص ربط (anchor) وصفية عربية غنية وليست "اضغط هنا". كل صفحة solution لكل مدينة تربط للمدينة الأخرى ولصفحة القطاع الأم.
4. Schema: تحقق أن كل نوع صفحة له schema صحيح — Organization + LocalBusiness (بالمدن من LOCAL_BUSINESS_BY_CITY) للصفحات الرئيسية، Article + Person (author) للمدونة، Service للحلول، FAQPage حيث توجد أسئلة، BreadcrumbList للجميع. تحقق بـ npm run seo:schema.
5. hreflang: الصفحات الإنجليزية في /en/ يجب أن تشير لنظيرتها العربية والعكس (استخدم src/data/i18n-pairs.ts)، مع x-default.
6. المحتوى المحلي: تأكد أن الصفحات الأساسية تذكر صراحة: السعودية، رؤية 2030، سدايا SDAIA، نظام حماية البيانات الشخصية PDPL، الهيئة الوطنية للأمن السيبراني NCA — حيث يكون ذلك طبيعياً وليس حشواً.
7. صور: alt عربي وصفي لكل صورة، وحدّث sitemap-images عبر npm run image-sitemap.
8. GEO/LLMO: حدّث public/llms.txt وllms-full.txt ليعكسا صفحات kernel والحلول الحالية، وتأكد أن ai.txt وrobots.txt يسمحان لزواحف AI.
بوابة القبول: npm run seo:all && npm run seo:link-graph && npm run seo:word-count تمر جميعها. أخرج تقرير تغييرات مفصلاً بصيغة CSV مطابقة لـ META-CHANGES.csv.
```

---

### البرومبت 7 — إمكانية الوصول (A11y) وتجربة الجوال المتقدمة

```plaintext
مشروع BrightAI عربي RTL. الهدف: Lighthouse Accessibility ≥95 لكل الصفحات وتجربة جوال ممتازة.
1. تباين الألوان: افحص كل تركيبات النص/الخلفية في tokens.css ضد WCAG AA (4.5:1 للنص العادي) وأصلح داخل tokens فقط.
2. التنقل بلوحة المفاتيح: focus-visible واضح لكل عنصر تفاعلي، skip-link لأول المحتوى، ترتيب tab منطقي في MobileNav والقوائم.
3. ARIA: القوائم المنسدلة aria-expanded، المودالات role="dialog" مع حبس التركيز، شات Kernel له aria-live="polite" للردود.
4. الجوال: مناطق لمس ≥44px، لا hover-only interactions (كل hover له بديل لمسي)، viewport meta صحيح بدون user-scalable=no.
5. النماذج (contact, assessment, lead capture): كل input له label مرئي، رسائل خطأ بالعربي مربوطة بـ aria-describedby.
6. اختبر صفحات: الرئيسية، solutions، blog article، kernel/chat، contact، assessment على 360px.
ممنوع تغيير التصميم البصري جوهرياً — تحسينات فقط. أخرج تقرير قبل/بعد لكل فحص.
```

---

### البرومبت 8 — البنية التحتية للنشر والأمان (أمور لم تُذكر لكنها مهمة)

```plaintext
مشروع BrightAI على Vercel (adapter @astrojs/vercel، output static + API route واحد serverless).
1. تعارض النشر: يوجد render.yaml و.htaccess وpublic/_headers وpublic/_redirects وredirects.json معاً — حدد أن Vercel هو المنصة الفعلية، وادمج قواعد التحويلات في vercel.json أو astro.config redirects بدون فقدان أي redirect موجود (301 القديمة حرجة للسيو). وثّق ما أبقيته لماذا.
2. Security headers: تأكد من تطبيق CSP وX-Content-Type-Options وReferrer-Policy وPermissions-Policy وHSTS فعلياً على Vercel (وليس فقط في ملفات Render). CSP يجب أن يسمح بـ GA4 وClarity وconnect-src للـ /api/ai/chat فقط.
3. API hardening: راجع src/pages/api/ai/chat.ts — أضف فحص Origin/Referer يقبل brightai.site فقط، وتأكد أن رسائل الخطأ لا تسرّب تفاصيل داخلية.
4. تأكد أن GROQ_API_KEY وGEMINI_API_KEY غير موجودين بأي ملف ملتزم في git (افحص التاريخ بـ git log -p على .env* إن وجد) وأن .gitignore يغطيها.
5. Monitoring: تأكد أن Google Analytics (G-8LLESL207Q إن كان معرف المشروع) موجود بكل الصفحات في <head> عبر اللياوت وليس منسوخاً يدوياً.
6. 404/500: تأكد أن 404.astro تعرض روابط للأقسام الرئيسية وأن public/500.html متناسقة معها.
بوابة القبول: npm run build && npm run redirects:check && npm run seo:gate. أخرج تقريراً بالقرارات المعمارية.
```

---

### البرومبت 9 — سلامة الروابط الداخلية والموارد بعد كل التعديلات

```plaintext
مشروع BrightAI. بعد التعديلات السابقة، نفّذ فحصاً شاملاً لسلامة الروابط:
1. شغّل: npm run internal-links:audit && npm run resource:audit:after && npm run seo:link-graph — أصلح كل كسر.
2. افحص dist/ بعد البناء: لا رابط داخلي يعطي 404، كل الروابط الداخلية بصيغة trailing slash (/page/ وليس /page)، لا روابط لـ .html قديمة.
3. كل الأصول (css/js/images/fonts) المشار إليها موجودة فعلياً في dist.
4. الروابط في المحتوى (src/content/blog/*.md, docs/*.md) تشير لمسارات Astro الحالية وليس مسارات HTML القديمة.
5. redirects القديمة من عصر HTML (redirects.json) تغطي كل مسار قديم كان مفهرساً — قارن مع CONTENT-AUDIT.csv.
أخرج تقريراً نهائياً: عدد الروابط المفحوصة، المكسورة المصلحة، redirects المضافة.
```

---

## ثالثاً: البرومبت الختامي — التحليل الشامل بعد التنفيذ

### البرومبت 10 — تقرير التقييم النهائي بالنسب المئوية

```plaintext
أنت مدقق جودة مستقل لمشروع BrightAI (Astro 6، https://brightai.site). نُفذت 9 مراحل تحسين. مهمتك: تحليل كامل ومحايد وإصدار تقرير نهائي بالنسب المئوية. لا تصلح شيئاً — قيّم فقط.

نفّذ الفحوصات التالية واستخرج نتائج فعلية (وليس تقديرات):
1. npm run build — ينجح بدون أخطاء أو تحذيرات؟
2. npm run seo:all && npm run seo:gate && npm run seo:link-graph && npm run seo:word-count — كم فحصاً نجح من الإجمالي؟
3. npm run performance:budget + Lighthouse (جوال وكمبيوتر) على: / و/kernel/ و/kernel/chat/ وصفحة solution وصفحة مقال — سجّل Performance/SEO/A11y/Best Practices لكل واحدة.
4. افحص dist/: عدد الصفحات المبنية، عدد روابط sitemap، عدم وجود noindex بغير قصد، وجود schema JSON-LD صالح بكل صفحة (تحقق عينة 15 صفحة).
5. اختبر /api/ai/chat يدوياً: رد ناجح، rate limit يعمل (429 بعد 10 طلبات)، خطأ نظيف عند مفتاح مفقود.
6. افحص RTL والتجاوب بلقطات على 360px و1440px لعشر صفحات متنوعة.

ثم أخرج التقرير النهائي بهذا الشكل بالضبط:
| المحور | النسبة قبل | النسبة بعد | الدليل |
مع المحاور: البنية التقنية، SEO التقني، فهرسة Kernel، تكامل Groq، جاهزية Kernel للعملاء، تناسق التصميم، أداء الجوال، تصدر البحث بالسعودية، إمكانية الوصول، الأمان والنشر، النظافة العامة — ونسبة إجمالية نهائية.
اختم بقائمة "أعلى 5 أولويات متبقية" إن وجدت، مرتبة بالأثر.
```

---

## ملاحظات مهمة قبل البدء

1. **الترتيب مقصود**: التنظيف (1) قبل التصميم (2) قبل الأداء (3)، ثم Kernel (4-5) لأن فهرستها تعتمد على اكتمالها، ثم السيو الشامل (6) والروابط (9) في النهاية لأنها تتأثر بكل ما قبلها.
2. **مفتاح Groq**: تأكد أن `GROQ_API_KEY` مضاف في متغيرات بيئة Vercel للإنتاج — الكود جاهز لكنه لن يعمل بدونه.
3. **قاعدة الأمان لكل البرومبتز**: المشروع يملك بوابات قبول جاهزة (`seo:all`, `performance:budget`, `internal-links:audit`) — كل برومبت يُلزم MiniMax بتشغيلها، فلا تقبل أي مخرجات بدون نجاحها.
4. نقطة الضعف الأكبر حالياً هي **الفجوة بين Kernel كعرض تجريبي وبين كونه منتجاً يستخدمه عميل محتمل** (55-65%) — البرومبتان 4 و5 هما الأعلى أثراً تجارياً.