# SESSION 1: DISCOVERY & INVENTORY

> Lead Principal Auditor — BrightAI | الجلسة 1 من 4 | وضع READ-ONLY
> تاريخ التنفيذ: 2026-06-10 | الفحص: مستودع محلي + فحص حي عبر المتصفح على https://brightai.site

---

## 1. Project Structure

| البند | القيمة |
|-------|--------|
| Branch | `brightai-middle-east` (base: `main`) |
| آخر Commit | `a4f6dd0` — feat: add SESSION 1 INVENTORY documentation |
| Node / npm | v24.14.1 / 11.11.0 |
| نوع المشروع | موقع **HTML ثابت** (Static Site) — ليس Next.js/React |
| Total files (html/js/json/md) | **607** |
| HTML pages | **129** |
| JS files | **170** |
| JSON files | **30** |
| اللغة الأساسية | عربي `lang="ar-SA" dir="rtl"` + إنجليزي `/en/` (قانوني فقط) |
| النشر | Cloudflare Pages / GitHub Pages (CNAME → brightai.site) + PWA |

### الأقسام الرئيسية
- `kernel/` — منصة حوكمة AI (محور التدقيق): 12 صفحة HTML + 19 JS + 8 mock JSON + 4 tests
- `blog/` (22 مقال), `docs/` (28), `solutions/` (14), `hub/` (5), `services/`, `pricing/`, `trust/`, `resources/`
- `en/` — نسخة إنجليزية (صفحات قانونية)
- `components/` — مكتبة مكوّنات HTML (15 ملف) **عليها noindex**
- ملفات SEO/AI: `llms.txt`, `ai.txt`, `robots.txt`, `sitemap.xml`, `_redirects`, `_headers`

---

## 2. Kernel Pages Status

> فحص حي عبر المتصفح: كل الصفحات HTTP 200، كلها `index, follow`، عناوين SEO عربية فريدة.
> تقييمات Speed/Design تقديرية بصرية أولية — التحليل العميق في SESSION 2.

| Page | Status | Speed (1-10) | Design (1-10) | Content Style | Mobile | noindex |
|------|--------|--------------|---------------|---------------|--------|---------|
| /kernel/ | 200 ✅ | 7 | 6 | عربي فصيح/تقني | ✅ | ❌ index, follow |
| /kernel/chat/ | 200 ✅ | 6 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/audit/ | 200 ✅ | 6 | 5 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/approvals/ | 200 ✅ | 7 | 6 | عربي فصيح | ✅ | ❌ index, follow |
| /kernel/stats/ | 200 ✅ | 7 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/connectors/ | 200 ✅ | 7 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/scenarios/ | 200 ✅ | 7 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/policies/ | 200 ✅ | 6 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/evidence/ | 200 ✅ | 7 | 6 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/compliance/ | 200 ✅ | 7 | 7 | عربي تقني | ✅ | ❌ index, follow |
| /kernel/reports | 200 ✅ | 7 | 6 | عربي تقني | ✅ | ❌ index, follow |

**ملاحظة جوهرية على الحالة الحية:** عند الزيارة الفعلية، عدة صفحات تعرض هياكل تحميل فارغة (skeletons) ونصوصًا مفقودة، مع شريط حالة دائم: **"Production API · Degraded"**, **"Fallback unavailable MODE"**, **"Unknown DB"**, وتوست **"offline"** ثابت يحجب جزءًا من الواجهة. صفحة `/compliance/` كانت الأوضح (KPIs ظاهرة: 2 / 20 / 5 / 93%). هذا يشير إلى أن طبقة البيانات الحية (`api/kernel`) غير متصلة في الإنتاج، وستُحلَّل بعمق في SESSION 2.

> ملاحظة عددية: عدد صفحات Kernel الفعلي 12 ملف HTML (مع `offline.html`)؛ الـ11 المطلوبة في الموجز كلها موجودة وتعمل.

---

## 3. noindex Files Found

إجمالي ملفات `noindex` الحقيقية = **16 ملف** (وسم `<meta name="robots" content="noindex, nofollow">`):

**`components/` (15 ملف):**
`badge.html`, `breadcrumb.html`, `button-ghost.html`, `button-primary.html`, `button-secondary.html`, `card-feature.html`, `card-glass.html`, `card-kpi.html`, `chat-widget.html`, `form-input.html`, `form-search.html`, `modal.html`, `nav-unified.html`, `table.html`, `toast.html`

**`frontend/` (1 ملف):**
`frontend/font-demo.html`

**استثناءات (ليست noindex فعلية):**
- `report/index.html` → الوسم الفعلي `index, follow`؛ كلمة "noindex" مجرد نص توصية داخل المحتوى.
- `scripts/.scripts-manifest.json` → ملف بيانات داخلي وليس صفحة ويب.

> ⚠️ خرق محتمل للقاعدة #1 (INDEX EVERYTHING): 16 ملف. هذه مكوّنات/عروض UI داخلية محظورة أيضًا في robots.txt — القرار التفصيلي يُؤجَّل للجلسات اللاحقة.

---

## 4. Anthropic Console Comparison

### What makes it world-class
- **Control plane لا مجرد بوابة:** بيئة موحّدة لإدارة المفاتيح والفوترة وتحليلات الاستخدام اللحظية تحوّل تطوير AI لعملية مؤسسية قابلة للقياس والتأمين.
- **النماذج الأولية التفاعلية (Workbench):** تجربة البرومبت وضبط المعاملات لحظيًا ثم تصدير كود جاهز للإنتاج — حلقة تغذية راجعة قصيرة.
- **الحوكمة التعاونية:** مكتبات برومبت مشتركة، مساحات عمل، وصلاحيات دقيقة.
- **التقييم التجريبي (Evals):** توليد حالات اختبار آلي ومقارنة المخرجات جنبًا إلى جنب.
- **جماليات مقصودة:** مساحات بيضاء سخية وطباعة مقروءة تعزّز الإحساس بالموثوقية البحثية.

### BrightAI vs Anthropic
- **تشابه الطموح:** Kernel يستهدف نفس فئة "control plane" للحوكمة (audit/approvals/policies/compliance/evidence) — توجّه صحيح ومتقدم.
- **فجوة الموثوقية:** Anthropic يعرض بيانات حية مستقرة؛ Kernel حاليًا "Degraded / offline / Unknown DB" مع skeletons فارغة — يضعف الانطباع world-class.
- **فجوة الصقل البصري:** تصميم Kernel وظيفي (داكن/نيون) لكنه يفتقر لاتساق التباعد والطباعة والامتلاء.
- **ميزة BrightAI:** التموضع حول الامتثال السعودي (PDPL / NCA ECC / SFDA) — ميزة سياقية لا يقدّمها Anthropic.

### 3 lessons learned
1. **الموثوقية أولاً:** الحالة الحية يجب أن تعرض بيانات فعلية لا skeletons دائمة — "Degraded/offline" يقتل الثقة فورًا.
2. **الصقل التحريري:** مساحات بيضاء وتباعد متّسق وطباعة مقروءة ترفع الإحساس بالجودة قبل أي ميزة.
3. **حلقة قيمة واضحة:** كل صفحة لازم توصل قيمة فورية مرئية (KPI/إجراء)، مثل Workbench/Evals لدى Anthropic.

---

## 5. Initial Observations

**ملاحظات عامة:**
- مشروع ناضج ومنظّم: 129 صفحة HTML، بنية أقسام واضحة، وملفات SEO/AI متقدمة.
- Kernel هو القلب: 12 صفحة + 19 JS + 8 mock JSON + 4 tests — معمارية طموحة لمنصة حوكمة.

**نقاط القوة المبدئية:**
- كل صفحات Kernel الـ11 تعمل (HTTP 200) وكلها `index, follow` مع عناوين SEO عربية فريدة ووصفية.
- تموضع تنافسي ذكي حول الامتثال السعودي (PDPL / NCA ECC / SFDA).
- استجابة جيدة على الجوال (الصفحة الرئيسية لـ Kernel تتكيّف نظيفًا).

**نقاط الضعف المبدئية:**
- طبقة البيانات الحية معطّلة: "Degraded" + "Fallback unavailable" + "Unknown DB" + توست "offline" دائم، ومحتوى كثير يظهر كـ skeletons فارغة.
- 16 ملف عليها noindex (15 مكوّن + font-demo) — خرق محتمل للقاعدة #1.
- الصقل البصري دون مستوى "أفضل منصة في الشرق الأوسط": تباعد/طباعة غير متّسقة، نصوص مفقودة.
- توست "offline" يحجب جزءًا من الواجهة في كل صفحة تقريبًا.

---

## 6. Plan for SESSION 2 — Kernel Deep Analysis

- تشريح كل صفحة من الـ11 بعمق: بنية HTML، JS، وكيفية تحميل البيانات (mock vs api/kernel).
- تشخيص جذر مشكلة "Degraded / offline / Unknown DB" ولماذا تظهر skeletons فارغة في الإنتاج.
- تدقيق مكتبة `components/` الـ15 وقرار التعامل مع noindex (القاعدة #1).
- تقييم تفصيلي للهوية البصرية مقابل المعيار العالمي (تباعد، طباعة، تباين، حالات فارغة).
- مراجعة محتوى Kernel بمعيار اللهجة السعودية البيضاء (القاعدة #2) صفحة بصفحة.
- فحص أداء أعمق (Web Vitals) واتساق الجوال عبر كل الصفحات الـ11.
