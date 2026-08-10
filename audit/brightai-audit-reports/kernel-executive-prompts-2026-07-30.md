# BrightAI Kernel — برومبتات تنفيذية جاهزة (١٠ برومبتات)

**ملف واحد قابل للّصق مباشرة في جلسة Claude Code/Cursor جديدة.**
**الترتيب: من أعلى أثر لأقل — أول ٣ فقط كفيلين بأثر ملموس خلال أسبوع عمل.**

---

### ١. استبدال KernelSidebar المخفية بـ mobile drawer/overlay
**الأولوية:** حرجة
**الأثر المتوقع:** من "لا يمكن التنقل" إلى "الوصول لكل صفحة kernel في < ٢ tap على الهاتف"
**الجهد المقدّر:** متوسط (~٦-٨ ساعات)

أصلح التوصل في موبايل لـ kernel. القائمة الجانبية (KernelSidebar) مخفية كلياً على شاشة < ١٠٢٤px بدون بديل — `kernel.css:591` فيها `display: none !important`.

١. اقرأ `src/components/kernel/KernelSidebar.astro` كاملًا + `src/styles/kernel.css:551-592`
٢. أضف overlay/drawer يطلع عند `max-width: 1023px`:
   - hamburger button ثابت فوق الـ sidebar (ظهور بس على الموبايل، `@media (max-width: 1023px)`)
   - الـ drawer يفتح من inline-end مع `transform: translateX(100%) → translateX(0)`
   - backdrop `.kernel-sidebar__overlay` يغلق القائمة عند tap خارجها
   - aria-label و role="dialog" للـ drawer
٣. touch target للـ hamburger: `min-width: 44px; min-height: 44px`
٤. لا تستخدم `!important` — استخدم cascade طبيعي
٥. لا تكسر CSP الحالي (لا dependency جديدة)
٦. `prefers-reduced-motion: reduce` يطفّل animation

**القبول:**
- ✅ sidebar يظهر عند tap hamburger على viewport < ١٠٢٤px
- ✅ tap خارج الـ overlay يغلقه
- ✅ touch target hamburger ≥ ٤٤×٤٤px
- ✅ `prefers-reduced-motion` يعمل
- ✅ لا dependency جديدة
- ✅ `npm run build` → ١٢٥ page
- ✅ `npm run verify:all` → exit ٠

---

### ٢. إضافة KernelSkeleton + KernelEmptyState لكل صفحات kernel
**الأولوية:** حرجة
**الأثر المتوقع:** CLS ينخفض ٠.٠١-٠.۰۳ على كل صفحة تستدعي API — المستخدم ما يشوف white screen
**الجهد المقدّر:** متوسط (~٤-٦ ساعات — المكوّن موجود، لمّا نحتاج نضيفه لصفحات ما يستخدمه)

١٠ من ١١ صفحة kernel ما عندهاش loading state. المستخدم على موبايل يشوف white screen محتوى يطيّح. `KernelSkeleton` و `KernelEmptyState` موجودين وعملاني — فقط نحتاج نستخدمهم.

١. لكل صفحة من هذي: chat.astro, audit.astro, compliance.astro, policies.astro, reports.astro, evidence.astro, connectors.astro, approvals.astro, scenarios.astro, stats.astro
٢. اقرأ هيكل الـ props في `src/components/kernel/KernelSkeleton.astro` و `src/components/kernel/KernelEmptyState.astro`
٣. أضف local loading state + استبدل الـ static content بـ:
   - `KernelSkeleton` لما `loading === true`
   - `KernelEmptyState` لما البيانات فاضية (empty array)
   - المحتوى الفعلي لما `loading === false && data.length > 0`
٤. حطّ `loading={true}` في أول render حتى البيانات تجي — استخدم `useState` أو Astro islands
٥. لا تغيّر أي CSS token أو layout
٦. لا تكسر أي existing behavior

**القبول:**
- ✅ كل صفحة kernel تعرض KernelSkeleton في أول ١-٢ ثانية
- ✅ كل صفحة عندها KernelEmptyState لما البيانات فاضية
- ✅ لا CLS regression
- ✅ `npm run build` → ١٢٥ page، ٠ error
- ✅ `npm run verify:all` → exit ٠

---

### ٣. رفع أهداف اللمس إلى ٤٤×٤٤px كحد أدنى
**الأولوية:** عالية
**الأثر المتوقع:** WCAG ٢.٥٥ Target Size pass — خطأ واحد في الـ audit يتحل
**الجهد المقدّر:** صغير (~٢-٣ ساعات — تغييرات CSS بس)

٤ عناصر تفاعلية في `kernel.css` أقل من ٤٤×٤٤px: `height:40px` (line 261), `height:24px` (line 330), `height:36px` (line 343), `height:24px` (line 451).

١. اقرأ `src/styles/kernel.css` الأسطر ٢٥٥-٢٦٥، ٣٢٥-٣٤٥، ٤٤٥-٤٥٥
٢. غيّر كل `height` < ٤٤px إلى `min-height: 44px` (بدون تغيير visual)
٣. للتوابل والأزرار الصغيرة: أضف `padding: var(--space-2) var(--space-4)` عشان توسّع الـ tap target دون ما يغيّر الشكل
٤. لا تستخدم `!important`
٥. لا تغيّر أي شيء غير الـ sizing rules

**القبول:**
- ✅ كل interactive element في `kernel.css` height/min-height ≥ ٤٤px (grep تأكيدي)
- ✅ الشكل البصري ما تغيّر (فرق pixel واحد غير مرئي)
- ✅ `npm run build` → ١٢٥ page
- ✅ `npm run performance:budget` → exit ٠

---

### ٤. chunk chart.umd.min.js — lazy load على stats page بس
**الأولوية:** عالية
**الأثر المتوقع:** stats page LCP ينخفض بمقدار ~٧٠ms+ على slow 4G — ٢٠٥KB raw → ٦٩.٥KB gz يُحمّل بس لما المستخدم يروح الصفحة
**الجهد المقدّر:** صغير (~١-٢ ساعة)

`chart.umd.min.js` (69.5KB gz) محمّل كأنه جزء أساسي لكن `stats.astro` هي الصفحة الوحيدة اللي يستخدمه. كل الصفحات التانية ما تحته.

١. اقرأ `src/pages/kernel/stats.astro` عشان تفهم وين يتحمّل الـ chart
٢. استبدل الـ static `<script type="module" src="/vendor/chart.umd.min.js">` بـ dynamic import داخل صفحة script
   - النمط المطلوب: `document.addEventListener('astro:page-load', async () => { const { Chart } = await import('/vendor/chart.umd.min.js'); /* init only if stats page */ })`
   - أو: أضف `client:visible` للـ chart island (لو عند Astro component)
٣. تأكد إنه ما يعمل على الصفحات التانية — grep `chart` من `dist/kernel/*/index.html` يتأكد chart script ما يوجد إلا في stats
٤. لا تغير أي behavior آخر

**القبول:**
- ✅ chart chunk يتحمّل بس لما الصفحة = stats
- ✅ لا chart chunk في non-stats kernel pages (grep تأكيدي)
- ✅ stats page يتعمل chart بشكل صحيح
- ✅ `npm run build` → ١٢٥ page

---

### ٥. إصلاح SSE error reporting — رسالة واضحة لما الـ AI معطّل
**الأولوية:** متوسطة — عالية (لـ monitoring والمستخدم)
**الأثر المتوقع:** المستخدم يشوف "الخدمة مؤقتاً غير متاحة" بدل loading forever — يمسك ثقته بالمنتج
**الجهد المقدّر:** متوسط (~٤-٦ ساعات — يتغير behavior في chat.ts + assistant)

العميل يشوف HTTP ٢٠٠ حتى لما كل الـ providers فشلوا. لا يوجد retry logic واضح. المستخدم يحاول يبدأ audit ويشوف loading forever.

١. اقرأ `src/pages/api/ai/chat.ts:663-674,963-984` (SSE response + error frames)
٢. غيّر SSE response: لما كل الـ providers فشلوا قبل أول token، أضف `X-Stream-Status: all_providers_failed` header أو بدّل status للتالي chunk
   - الأمان: لا تغيّر الـ response body shape (العميل يقرأ JSON) — أضف header فقط
   - لا تكسر أي client يتوقع ٢٠٠
٣. في `src/components/kernel/KernelAiAssistant.astro`:
   - أصلح `showError(errorSlot, 'provider_failed')` عشان يعرض رسالة عربية واضحة: "الخدمة مؤقتاً غير متاحة. حاول مرة أخرى لاحقاً."
   - أضف زر retry (بدون dependency)
   - زر الـ retry يعيد `fetch('/api/ai/chat/')` بنفس الـ body
٤. لا تكسر CSP الحالي (`script-src 'unsafe-inline'` يسمح inline event handlers)
٥. لا تغيّر auth أو quota logic

**القبول:**
- ✅ المستخدم يشوف رسالة خطأ واضحة بدل loading forever لحالة provider failure
- ✅ زر retry يعمل (اختبار يدوي)
- ✅ لاكسر HTTP behavior لبقيّة الـ API routes
- ✅ `npm run build` → ١٢٥ page
- ✅ `npm run verify:all` → exit ٠

---

### ٦. حذف `[slug].astro` shadowed route
**الأولوية:** متوسطة
**الأثر المتوقع:** maintenance burden ينخفض — ٨ صفحات أقل يحتاج مراجعة
**الجهد المقدّر:** صغير (~١ ساعة + موافقة المستخدم)

`src/pages/kernel/[slug].astro` يولّد ١٠ routes تغطيها بالفعل ملفات ثابتة (chat.astro, audit.astro...). التكرار يسبب ارتباك لأي مطوّر جديد.

١. اقرأ `[slug].astro` كامل (٢٣٥ سطر) + `src/data/kernel.ts` (لـ `kernelNavItems`)
٢. قرر مع المستخدم: (أ) احذف `[slug].astro` كلياً، أو (ب) أبقيته كـ catch-all مُعلَّق
٣. لو (أ):
   - احذف الملف
   - فعّل `npm run build` — تأكد إن ١٢٥ page ما فيهم نقص
   - grep `href="/kernel/` من الصفحات التانية — تأكد إن كل الـ routes الثابتة عندها pages
   - لو في external link خارجي يخدم [slug] pattern: أضف 301 في `public/_redirects` (بموافقة المستخدم)
٤. لو (ب): أبقِه لكن حدّث التعليق الداخلي ليقول "shadowed by static pages — do not edit"
٥. بنّ و تحقق

**القبول:**
- ✅ لا broken links في `/kernel/` routes
- ✅ `npm run build` → ١٢٥ page
- ✅ لا 404 لأي route موجود سابقاً

---

### ٧. تنظيف التعليق القديم في KernelAiAssistant حول "no real streaming"
**الأولوية:** متوسطة (low blast radius, high hygiene)
**الأثر المتوقع:** المطوّر الجديد ما يتضَلّع من تعليق سنة ٢٠٢٥ ما صار صحيحاً
**الجهد المقدّر:** صغير (~١٥ دقيقة)

التعليق في `KernelAiAssistant.astro:576` يقول "بدون streaming فعلي" — غلط سنة ٢٠٢٥. `chat.ts` فيه SSE streaming حقيقي (CHAT-STREAM-2026-٠٧-١٥).

١. اقرأ `src/components/kernel/KernelAiAssistant.astro:575-577`
٢. غيّر التعليق ليصف الـ SSE streaming الفعلي
٣. نفس الشيء في `chat.ts` التعليق تأكّد إنه يصف SSE بشكل صحيح (مش "blocking only")
٤. ما تغيّر شي في runtime (comment only)

**القبول:**
- ✅ التعليق يوصف الـ behavior الفعلي (سطر grep تأكيدي)
- ✅ ما تغيّر شي في runtime ❌

---

### ٨. إضافة breakpoint ٣٢٠px لتوحيد grid على very small phones
**الأولوية:** منخفضة (nice-to-have)
**الأثر المتوقع:** UX أفضل على هواتف ٢٠٢٥ الصغيرة (iPhone SE, Samsung A10) — ٣٢٠-٣٦٠px width
**الجهد المقدّر:** صغير (~١-٢ ساعة)

`kernel.css` عنده `@media (max-width: 480px)` بس ما فيه تغييرات جوهرية. هواتف ٣٢٠px width أوسع من ٤٨٠px — أوضح من breakpoint الموجود.

١. اقرأ `kernel.css:1261-1290` عشان تشوف ليه موجود
٢. أضف `@media (max-width: 360px)` مع:
   - تقليل padding cards من `var(--space-6)` إلى `var(--space-4)`
   - stacking cards من ٢ column لـ ١ column
   - تقليل font-size للمحتوى الثانوي
٣. نفس الشيء في KernelSidebar drawer: تأكد إنه full-width على ٣٦٠px
٤. لا horizontal scroll على ٣٦٠px viewport

**القبول:**
- ✅ لا horizontal scroll على ٣٦٠px viewport
- ✅ كل touch target ≥ ٤٤px حتى على ٣٢٠px
- ✅ `npm run build` → ١٢٥ page

---

### ٩. إضافة ٣٢٠px breakpoint — نفس الفكرة (duplicate — لو اتنفّذت ٨ تم تخطّيها)
> **ملاحظة:** هذا البرومبت تكرار البرومبت ٨ — نفس الفجوة نفس الحل. يُلغى إن البرومبت ٨ تُنفّذ. موجود هنا كـ فقرة احتياطية لو الأولوية تغيّرت أثناء التنفيذ.

---

### ١٠. توحيد الـ breakpoints لـ ٣ متناسقة بدل ٤ فوضوية
**الأولوية:** منخفضة (cleanup)
**الأثر المتوقع:** تعقيد المطوّر ينخفض — ٣ breakpoints واضحة بدل ٤ متداخلة
**الجهد المقدّر:** صغير (~١-٢ ساعة)

`kernel.css` يستخدم ٤ breakpoints (767px, 768px, 1023px, 1024px). الفجوة 767/768 = وحدة بايت = accident على الأرجح.

١. اقرأ كل `@media` rule في `kernel.css` ووثّق الـ pairs:
   - `max-width: 767px` + `min-width: 768px` → ادمجهم لـ breakpoint واحد عند 768px
   - `max-width: 1023px` + `min-width: 1024px` → ادمجهم عند 1024px
٢. الـ breakpoints الموحّدة:
   - Mobile: < 768px
   - Tablet: 768px – 1023px
   - Desktop: ≥ 1024px
٣. ادمج أي قاعدة مكررة (مثلاً `max-width: 1023px` في ٨ أماكن مختلفة)
٤. بنّ و افحص ٣ viewport sizes: ٣٧٥px, ٧٦٨px, ١٤٤٠px

**القبول:**
- ✅ ٣ breakpoints بس: mobile (< 768), tablet (768-1023), desktop (≥ 1024)
- ✅ visual regression = ٠ (مقارنة screenshots قبل وبعد)
- ✅ `npm run build` → ١٢٥ page

---

## ملاحظات لأي برومبت فيهم

- **لا يكسر CSP**: كل البرومبتات تتجنب إضافة خارج dependency. CSP الحالي (`script-src 'self' 'unsafe-inline'`) لا يسمح بأي library جديد بدون موافقة صريحة
- **GEMINI_API_KEY**: موجود في Render → Environment Variable. يُقرأ عبر `process.env.GEMINI_API_KEY` في زمن التشغيل فقط (`chat.ts:373,377,576`). `prerender = false` يضمن إنه ما يُضمّن في البناء. ما يطلبه البرومبت من المستخدم شيء إضافي
- **RTL**: كل البرومبتات تراعي `dir="rtl"` وتستخدم logical properties (`margin-inline-start`, `text-align: start`)
- **العربية**: الردود في رسائل الخطأ تكون عربية الفصحى المهنية (مطابقة لأسلوب `kernel-system-prompts.ts`)

---

*ترتيب التنفيذ المقترح: ١ → ٢ → ٣ (أول ٣ = أثر ملموس في أسبوع عمل). بعدها ٤ → ٥. الباقي nice-to-have.*
