سأعيد صياغة البرومبتات #(1) و(2) و(3) كـ**برومبتات موجّهة لنموذج sul 5.6** بحيث يعمل كـ **محلل/باحث** للمشروع الفعلي ثم يُولّد **برومبتات تنفيذية مصغّرة لـ minimax code m3**، كل ذلك مع تركيز صريح على تصدر Google السعودية ومحركات الإجابة الذكية (AEO/ChatGPT/Gemini/Perplexity/Copilot). البرومبتات الثلاثة تحافظ على مواضيعها الأصلية دون دمج:

- **البرومبت 1** = لغة العميل وصياغة النصوص (VOC + Copy)
- **البرومبت 2** = تدقيق تحسين معدل التحويل (CRO)
- **البرومبت 3** = تحسين SEO + AEO السعودي

مرفق أدناه الملف الكامل (محدَّث) لقراءته بسهولة، وتليه نسخته inline في الرد.

---

## 📂 الملف (تحميل/قراءة)

سيُحفظ الملف في المسار الدائم:

`/mnt/user-data/outputs/brightai-prompts/MINIMAX-M3-REMEDIATION-PROMPTS-ar.md`

ملاحظة: الـ sandbox يعيش داخل `/home/user/…` وكثير من أوامر التحقق اللاحقة (مثل `pnpm build`، وتمرير الروابط الفعلية داخل البرومبتات) ستحتاج منك أن تشغّل sul 5.6 في جلسة عمل داخل `BRIGHTAI-main/` على جهازك أو Codespace — هذا هو السياق الذي صُمِّمت له البرومبتات.

---

# 📜 النسخة الكاملة Inline (حرفي)

```markdown
# BRIGHTAI • MINIMAX-M3 REMEDIATION PROMPTS (ar) — v2

> النطاق: مشروع `BRIGHTAI-main/` (Astro 6.4.6، Node SSR على Render)
> الجمهور: شركات ومؤسسات سعودية خاصّة/حكومية تستخدم الذكاء الاصطناعي
> الاستهداف المزدوج: Google Saudi (.sa) **+** محركات الإجابة الذكية
> (ChatGPT, Gemini, Perplexity, Copilot, Google AI Overviews)
> اللغة الأساسية: العربية الفصحى بـ locale `ar-SA`، ثانوي: `en-SA`
>
> **بنية كل برومبت أدناه ثنائية الطور:**
> - **الطور A (Research/Analysis)** — لنموذج sul 5.6 (محلل/باحث)
>   يفحص المشروع الفعلي بمساراته وأدواته الحقيقية قبل أي توليد.
> - **الطور B (Mini Execution Prompts)** — يخرج sul 5.6 عددًا من
>   **برومبتات تنفيذية مصغّرة** جاهزة للصق المباشر في minimax code m3
>   فيُنفّذها فعليًا على الكود.
>
> في كل طور: مسارات حقيقية من المشروع + أوامر تحقق حقيقية
> + قيود محتوى لا تُكسر.

---

## 🌐 Preamble مشترك (يُلصق قبل أي من البرومبتات الثلاثة أدناه)

```text
سياق التنفيذ:
- الريبو: BRIGHTAI-main/ (74 ملف صفحة تحت src/pages/**)
  ≈ 176 URL نهائي في sitemap.xml.
- 108 سكربت جاهز في scripts/ (تحقق/تدقيق/أتمتة SEO/A11y/Perf).
- ملف render.yaml (~974 سطر) يحتوي redirects + headers + CSP.
- ملف redirects.json (~831 سطر) للـ tooling.
- robots.txt مُعدّ للسماح بـ GPTBot/ClaudeBot/PerplexityBot/Google-Extended.
- المسار /frontend/* محجوب عمدًا (noindex -> 404) ولا يجوز كشفه.
- الصفحات prerendered ملايين، فقط api/* و ratelimited routes تبقى SSR.
- الهوية: Saudi AI Safety OS — حوكمة + تشغيل + اعتماد AI للسوق السعودي.

MCP servers المُفعّلة داخل المشروع:
- Playwright (فحص كمتصفح حقيقي)
- Context7 (توثيق Astro/React/Vite/Vercel/Node)
- Sequential Thinking (تخطيط قبل أي تعديل بنيوي)
استخدم الـ MCP Servers الثلاثة بالاسم صراحة عند الحاجة.

القيد الأعلى (لا يُكسر):
1) لا حذف صفحة ولا قسم في أي صفحة تحت src/pages/**.
2) لا حذف/إعادة تسمية مكوّن في src/components/**.
3) النصوص المرئية (h1/h2/p/li/CTA text داخل <body>) لا تُعدَّل
   إلا إذا المهمة صراحة تطلب «إعادة صياغة تراثية محدودة» ومع diff.
4) كل تعديل في render.yaml/redirects.json/CSP/security headers
   يجب أن يمرّ عبر scripts/check-redirect-destinations.mjs
   + scripts/check-render-route-hygiene.mjs + scripts/seo-health-check.mjs.
5) كل ملف معدَّل يعلق بسطر أعلى الـ frontmatter:
       <!-- BAI-XXX-YYY (YYYY-MM-DD): ملخص -->

التوثيق:
- كل مهمة تُسجَّل في worklog.md بنفس نمط:
    Task ID: BAI-XXX-YYY
    Agent: <sul 5.6 أو minimax code m3>
    Mode: Senior
    Started: <ISO +03:00>
```

---

# 🔍 البرومبت 1 — لغة العميل ورسائل التسويق (VOC + Copy الاستراتيجية)
> (نفس موضوع برومبت BAI-VOC-001 السابق، مُعاد صياغته كـ meta-prompt لسul 5.6)

```text
[الـ Preamble أعلاه — ألصقه قبل هذا البرومبت]

أنت sul 5.6 (محلل وباحث أول).
LIVE_CONTEXT = {
  project: "BRIGHTAI-main/",
  url_live: "https://brightai.site",
  repo: "YEEEAE/BRIGHTAI",
  locale_primary: "ar-SA",
  locale_secondary: "en-SA",
  domain_authority_kpis_target: {
    "google_sa": true,
    "aeo_signals": ["speaksable", "faqpage", "howto", "organization_ksa",
                    "llms_txt", "ai_txt"],
    "primary_aeo_surfaces": ["ChatGPT browse",
                             "Bing Copilot",
                             "Perplexity",
                             "Google AI Overviews (MUM/Gemini)",
                             "Gemini API retrieval"]
  },
  sectors_in_scope: ["banks", "hospitals", "pharma",
                     "government_entities", "insurance"],
  regulators_in_scope: ["SDAIA", "NCA", "SAMA", "SFDA", "CITC",
                        "PDPL", "MoH", "MoF"],
  competitor_signals_to_track: [
    "Saudi AI governance platforms (Tasheel, MOJ, etc.)",
    "International vendors localized to KSA (IBM watsonx, Microsoft
     Azure AI Content Safety, Databricks AI Gateway, OneTrust, Collibra)"
  ],
  target_personas: [
    "مدير حوكمة/التزام في بنك سعودي",
    "CISO في جهة حكومية",
    "مدير بيانات/CDO في مجموعة مستشفيات خاصة",
    "مدير ابتكار/أبحاث في شركة أدوية",
    "مدير مخاطر/تدقيق في شركة تأمين"
  ],
  page_inventory_path: "src/pages/**",
  sitemap_path: "sitemap.xml",
  keyword_seed_path: "keyword.txt",
  schema_master_path: "schema-saudi-seo.json"
}

# ── الطور A — البحث والتحليل على المشروع الفعلي (يؤدّيه sul 5.6) ──
نفّذ هذه الدراسات قبل أي توليد، واستخدم الأرقام والمسارات الحقيقية
دون اختلاق:

A1) استخرج inventoried words واقعية:
   - اقرأ keyword.txt بالكامل، ثم:
     cat keyword.txt | wc -l
     grep -c "<loc>" sitemap.xml
   - شغّل (فيذيًا أو محاكاة أوامر):
       node scripts/extract-solutions-content.mjs
       node scripts/extract-blog-articles.mjs
   - صنّف الكلمات: regulatory، technical، risk، financial، healthcare،
     procurement (مخصص للشراء الحكومي السعودي).

A2) اجمع VOC من المصادر العامة المفتوحة:
   - هدفك ≥30 عبارة حقيقية (عربي سعودي + إنجليزي أعمال) مرجعها:
     • SDAIA / NCA / SAMA / SFDA / CITC / PDPL نصوص رسمية.
     • تويت LinkedIn سعوديين في أدوار CISO/CRO/CDO (لا تنسخ
       نصوصًا محميّة— استخلص الأنماط فقط).
     • نقاشات Reddit r/AI_Agents, r/LLMDevs, r/sysadmin
       (لغة الفرق التقنية حول مخاطر AI).
     • Hacker News threads عن AI governance (لغة الشركات الناشئة).
     • Google "People Also Ask" لمفاتيح:
       "SDAIA AI compliance", "AI risk register KSA",
       "نظام حوكمة الذكاء الاصطناعي السعودية",
       "تقييم جاهزية الذكاء الاصطناعي",
       "ISO 42001 gap analysis Saudi",
       "AI model audit Saudi Arabia",
       "PDPL AI personal data",
       "NCA ECC AI controls".
   - لكل عبارة وثّق: URL + نوع الدلالة (regulatory|technical|
     business|risk) + الكثافة التقديرية.

A3) قس أداء الصفحات الفعلي مقابل لغة VOC:
   - افتح src/pages/** وتحدّى:
     • / , /about/ , /services/ , /pricing/ , /customers/{bank,
       hospital,pharma}/ , /solutions/[sector] , /solutions/[sector]/
       [city] , /kernel/ , /kernel/{chat,approvals,audit,
       evidence,compliance,connectors} , /assessment/ai-governance-readiness/
       , /calculator/roi/ , /demo/ , /contact/ , /blog/[...slug].
   - اسحب نص الـ H1 + الفقرة الأولى + الـ CTA button من كل صفحة.
   - قارن مع VOC: عدد عبارات شائعة في VOC **غائبة** في نص الصفحة.

A4) حدد فرص النصر في AEO:
   - لكل صفحة، احسب: هل يمكن لاقتباس ≤60 كلمة منها (TL;DR)
     أن يُستخدم كإجابة لـ ChatGPT/Gemini/Perplexity
     لنية (regulatory compliance AI Saudi)، أو (ISO 42001 KSA)؟
   - هل الصفحة تحوي FAQ schema؟ (إن لا، هذا gap).
   - هل الصفحة تحوي SpeakableSpecification؟ (شغّل
     node scripts/check-speakable-schema.mjs).

A5) تقرير VOC الفرق السعودي:
أنتج ملف واحد جديد:
     strategy/voc/voc-report-2026.md
يتضمن:
   1. جدول العبارات (Term | AR | EN | Locale | Source-URL |
      Page-set-that-cites-it | AEO-surface-fit).
   2. Pain Patterns (≥10) بصياغة: (لـ Persona X) يشعر بـ Y
      لأنه Z. اكتب نسخة عربية فصحى + إنجليزية أعمال.
   3. Goal Patterns (≥10) مثال: "اجتياز تدقيق NCA ECC بنقرة واحدة" /
      "إثبات PDPL compliance خلال 24 ساعة".
   4. Objection Patterns (≥10) — السعر، طول التنفيذ، خوف من الـ vendor
      lock-in، مخاوف تسريب بيانات تدريب، مخاطر قانونية.
   5. Buying Triggers (≥10) — تشريعات جديدة، تكليف جهة، حادثة AI
      سيئة السمعة، طلب جهات تدقيق مستقلة.
   6. 30 سؤال "People Also Ask" سعودي/إنجليزي مع مستوى النية
      (TOFU/MOFU/BOFU) والصفحة الأنسب لإجابته.
   7. **18 رسالة تسويقية** مُرتّبة حسب العمود الناقص:
       5 Headlines لـ / , 5 لـ /services/ , 4 لـ /solutions/[sector] ,
       4 لـ /customers/{sector}/ أو /pricing/ .
       لكل رسالة: ركيز VOC + Persona + وعد قابل للقياس + دليل
       (مصدر تنظيمي، معيار، حالة).
   8. **12 CTA** (زر رئيسي + زر ثانوي) بالعربية السعودية +
       الإنجليزية، بصيغة action-oriented وعدّ مفعّل:
       "احجز تقييم جاهزية AI — 20 دقيقة / مجاني / تقرير PDF".
   9. **قائمة فجوات GeneralizedOut vs LocalizedOut**:
       للمفاتيح الخمس الأعلى قيمة، أين يتفوق BrightAI على
       المنافسين في SERP KSA، وأين يتأخر.

مهم جدًا: لا تنسخ نصوصًا محمية بحقوق النشر، استخدم
الأنماط اللغوية فقط وأعد صياغتها بالكامل.

# ── الطور B — Mini Execution Prompts لـ minimax code m3 ──
بعد إنهاء الطور A أعلاه، قسّم النتيجة إلى **5 برومبتات تنفيذية
مصغّرة** كل واحد منها كاملًا وجاهزًا للصق في minimax code m3.
كل برومبت مصغّر يجب:
   - يبدأ بالـ Preamble.
   - يحوي IDs: BAI-VOC-001-A, ...E (5 مهمات صغيرة).
   - يحوي خطوات قليلة (3–6 خطوات) فقط.
   - يحوي معيار قبول قابل للقياس.
   - يحوي حدود لا تكسر:
        "لا تحذف صفحة أو قسمًا. لا تعدّل CSP. سجّل في worklog.md."

البرومبتات المصغّرة الخمسة:
   B1.Embed-VOC-In-Headlines:
       تحديث hero copy لـ /, /services/, /solutions/[sector],
       /customers/{bank,hospital,pharma} ليعكس عبارات VOC الرئيسية،
       مع الحفاظ على أقسام الصفحة.
   B2.Add-FAQ-Blocks:
       لكل صفحة ناقصة FAQ: حقن 5 أسئلة/أجوبة عربية سعودية
       + SpeakableSpecification schema على نفس الصفحة.
   B3.Localize-CTAs:
       توحيد صياغة الـ CTA عبر الصفحات بصيغة VOC (عربي/إنجليزي)
       مع إضافة microcopy قصير يلامس Pain Pattern واحد.
   B4.Solution-Page-City-Cluster:
       تعزيز /solutions/[sector]/[city] بمحتوى محلّي (الرياض، جدة،
       الدمام، نيوم، KAUST zone) — نص فقط، لا تنشئ صفحات.
   B5.AEO-Snippet-Pack:
       توليد ≤60 كلمة TL;DR لكل من 12 صفحة P0 (بنوك، مستشفيات،
       أدوية، جهات) وتضمينها في صدر <body> ضمن سكشن موجود أصلًا.

صيغة الإخراج من sul 5.6 إلى المستخدم:
   - تقرير الطور A أولاً بمحتوى كامل (ليس ملخّصًا).
   - ثم كود مسوّى لكل برومبت مصغّر في بلوك ```text ... ```.
   - ثم ملاحظة ختامية:
       "هذه البرومبتات المصغّرة جاهزة للصق المباشر في minimax code m3.
        ترتيب التنفيذ الموصى: BAI-VOC-001-A → -B → -C → -D → -E."
```

---

# 🧪 البرومبت 2 — تدقيق تحسين معدل التحويل (CRO Checklist)
> (نفس موضوع برومبت BAI-CRO-002 السابق، مُعاد صياغته لسul 5.6)

```text
[الـ Preamble أعلاه — ألصقه قبل هذا البرومبت]

أنت sul 5.6 (محلل UX/CRO أول).
LIVE_CONTEXT = {
  project_pages_root: "src/pages/**",
  page_count_real: 74,                      # ملفات .astro فعلية دون /design/*
  pages_indexable: 76,                      # + ديناميك routes
  live_routes_real: 176,                    # <loc> في sitemap.xml
  locale: "ar-SA (RTL افتراضي)",
  mobile_priority: [360, 375, 414],
  desktop_priority: [1366, 1920],
  target_personas: [
    "مدير امتثال بنك",
    "CISO جهة حكومية",
    "CDO مجموعة مستشفيات",
    "مدير مخاطر",
    "مدير مشتريات"
  ],
  primary_goal_conversion:
    "حجز /demo/ أو إكمال /assessment/ai-governance-readiness/"
}

# ── الطور A — البحث والتحليل (sul 5.6) ──
A1) عَدّ كل الصفحات المفهرسة واقعيًا:
    find src/pages -type f -name "*.astro" \
       ! -path "*/design/*" ! -name "404.astro" \
       ! -path "*/offline/*" ! -path "*/kernel/offline*" \
       | wc -l
    # استخدم النتيجة كـ N الذهبي — لا تستخدم رقمًا آخر.

A2) لكل صفحة مفهرسة، اسحب العناصر التالية من الكود فعليًا:
    - H1 وعدد الكلمات فيه (≤7 كلمات).
    - الفقرة الأولى (≤40 كلمة) — اختبار "5 ثوانٍ".
    - Primary CTA: نص الزر + href + position في الصفحة
        (احسب سطر الـ HTML index ضمن <body>).
    - عدد الحقول في نموذج الصفحة (إن وُجد).
    - عدد شعارات Social Proof (في محدد class="logo-cloud",
       class="partners", أو <img alt=...logo> في السطور الأولى).
    - وجود Risk Reversal (ISO, SDAIA, NCA, PDPL
       في أول 60% من الصفحة).
    - وجود Objection Block (محدد class="faq" أو
       id="faq" أو Objection section).
    - وجود Microcopy Near CTA.
    - الـ section anchors (#services, #pricing, #contact…) — سجّلها
      للحفاظ عليها عند التوصية.

A3) افحص RTL والجوال:
    - سجّل كل أيقونة سهم → هل تنعكس بـ CSS transform: scaleX(-1)
      أو استخدام logical inset؟ (تفتيش في
      src/styles/ و src/components/).
    - ابحث عن fixed 100vh (مشكلة iOS Safari) في
      src/styles/ و src/components/.
    - ابحث عن <img> بلا width/height (خطر CLS):
        grep -rn "<img" src/pages src/components \
          | grep -v "width=" | grep -v "height="

A4) احسب درجة "Prompt Acceptance" لكل صفحة:
    score_page_for_persona(persona, page_data):
      VaP_5sec    0..25   # وعد رئيسي upfront
      CTA_above_fold_mobile_360  0..20
      Field_count ≤3 for lead forms   0..10
      Social_proof_visible          0..15
      Regulatory_signals (SDAIA/NCA/SAMA/SFDA/PDPL)  0..15
      Objection_handling             0..15
      النتيجة 0–100

    احسب المتوسطات لكل sector و الـ Top-15 مشاكل عالميًا.

A5) PRODUCT artifacts المطلوبة من الطور A (sul 5.6 يولّدها):
    - audit/cro-2026/CHECKLIST-ar.csv بالأعمدة:
        Route, Viewport(360|1366), Persona, Score, Severity,
        Issue_AR, Why_it_matters_AR, Suggested_fix_AR,
        Section_anchor_id_to_keep,
        Est_impact_pct(>=0), Effort_hours(>=0),
        Source_line (e.g. src/pages/services/index.astro:42)
    - audit/cro-2026/PERSONA-FIT-MATRIX.csv بالأبعاد:
        personas (rows) × sectors/products (cols) = score 0–100.
    - audit/cro-2026/ULL-PRIORITY-BACKLOG.md:
        أعلى 15 مشكلة مرتّبة (impact / effort).
    - **ممنوع تمامًا** حذف section أو مكوّن أو توليد رقم بدون
      اقتباس خط كود.

# ── الطور B — Mini Execution Prompts لـ minimax code m3 ──
قسّم النتيجة في 6 برومبتات تنفيذية مصغّرة كل واحد:

   C1.Mobile-CTA-Standout:
       رفع وضوح Primary CTA فوق الطيَّة على mobile 360 — تعديل CSS
       فقط على الأزرار الموجودة، لا نقل للأزرار، لا حذف قسم.
   C2.Risk-Reversal-Top-Fold:
       إضافة رصيد regulatory signals (SDAIA/NCA/SAMA/SFDA/PDPL/ISO
       42001/NIST RMF) في سكشن أعلى الصفحة الحالي (hero مشتق
       social-proof) — نص فقط، لا create سكشن جديد.
   C3.Form-Field-Reduction:
       اختزال حقول /demo/ و /assessment/ إلى 3 حقول كحد أقصى مع
       إبقاء جميع الحقول الاختيارية في خطوة لاحقة موجودة أصلًا.
   C4.Objection-Block-Placement:
       إدخال بلوك اعتراضات ضمن السكشن/FAQ القائم دون إنشاء سكشن
       جديد — حدّد السكشن anchor الموجود للاحتفاظ به.
   C5.Social-Proof-Refresh:
       تحديث شعارات العملاء وأرقام الإنجازات في مكوّن
       PartnersGrid القائم — جمع النص القديم والجديد جنبًا لجنب.
   C6.Mobile-Icon-RTL-Fix:
       تدقيق أيقونات السهام/الاتجاه في src/components/ وضبطها
       لـ logical properties — لا تعديل على بنية الصفحة.

قيود لكل برومبت:
   - معيار قبول واحد قابل للقياس
     (مثال: "Lighthouse mobile LCP p75 ≤ 2.5s").
   - "ابدأ بـ Sequential Thinking في minimax code m3 عند مواجهة
      تغيير يمس >3 ملفات."
   - "وثّق في worklog.md بـ BAI-CRO-002-X."

صيغة التسليم:
   بلوك واحد لكل برومبت مصغّر بصيغة ```text ... ``` جاهز للصق.
```

---

# 🔬 البرومبت 3 — تحسين SEO السعودي + AEO (Generative Engine Optimization)
> (نفس موضوع برومبت BAI-SEO-003 السابق، مُعاد صياغته لسul 5.6 مع تركيز AEO)

```text
[الـ Preamble أعلاه — ألصقه قبل هذا البرومبت]

أنت sul 5.6 (Senior SEO/AEO engineer).
LIVE_CONTEXT = {
  primary_locale: "ar-SA",
  secondary_locale: "en-SA",
  hreflang_target_set: ["ar-SA", "en-SA", "x-default"],
  google_target: "google.com.sa / .com (KSA bias)",
  aeo_surfaces_in_scope: [
    "ChatGPT browse/plugin + custom GPT",
    "Microsoft 365 Copilot / Bing Copilot",
    "Perplexity.ai Pro",
    "Google AI Overviews (MUM/Gemini)",
    "Gemini API retrieval ground in SGE",
    "Apple Intelligence web grounding"
  ],
  saudi_ai_search_engines_to_pursue: [
    "Google Saudi (.sa)",
    "Bing (Copilot يستهلك)",
    "DuckDuckGo instant answers",
    "Ecosia",
    "Yandex (للسعودية ثانويًا)"
  ],
  competitor_targets_to_research: [
    "Tasheel AI/MOJ-published AI compliance pages",
    "SDAIA published pages",
    "NCA published guidelines",
    "تقييم ذاتي لمواقع ibm.com/watsonx/ar",
    "azure.microsoft.com/ar-sa/ai-services",
    "Databricks AI Gateway landing localized",
    "OneTrust KSA localized"
  ],
  page_count_real: 74,
  sitemap_urls_real: 176,
  schema_master_path: "schema-saudi-seo.json",
  robots_path: "public/robots.txt"
}

# ── الطور A — البحث والتحليل (sul 5.6) ──
A1) Map الصفحات ↔ الكلمة المفتاحية أولاً:
    - اسحبها فعليًا:
        node -e "console.log(require('fs').readFileSync('keyword.txt',
        'utf8'))" | head -200
        grep -E "^<loc>" sitemap.xml | wc -l
        find src/pages -name "*.astro" | wc -l
    - ناتج: مصفوفة (Page | Intent: navigational|informational|
      transactional|commercial-investigation | SERP-format-target:
      featured-snippet|PAA|AI-overview|video|local-pack|image |
      KSAspecific-query-fit=0..1).

A2) افحص بنية الصفحة الواحدة (real evidence):
    لكل (Route):
      - <title> من frontmatter أو layout:
          grep -nE "^title:" src/pages/R/index.astro
      - <meta name="description">:
          grep -nE "^description:" src/pages/R/index.astro
      - canonical: ابحث في الـ layout + page-level override.
      - hreflang: تحقق ثنائي الاتجاه مع نظير /en/.
      - noindex متبقي بالخطأ:
          grep -rnE "noindex" src/pages src/layouts src/components \
            | grep -v "/frontend/" | grep -v "tel:noindex"
      - schema: عدد الـ JSON-LD blocks وأنواعها
          node scripts/seo-schema-audit.mjs
      - Speakable:
          node scripts/check-speakable-schema.mjs
      - Open Graph / Twitter Card:
          grep -n "og:\|twitter:" src/layouts/*.astro
      - Image alt:
          awk '/<img/ && !/alt=/' src/pages/R/index.astro
      - Internal links inbound:
          node scripts/internal-links-audit.mjs
          node scripts/internal-linking-architecture.mjs
      - Redirect target (ان وجد في render.yaml):
          grep -E "source:.*<R>" render.yaml

A3) مُولِّد SERP KSA verdict:
    لكل Page في الطور A1، أعطِ حكمًا واحدًا من:
      - "Winner Defensible" (تستحق الدفاع، كأنها تتصدّر AI Overview)
      - "Quick Win" (تستطيع احتلال المرتبة 1–3 بتحرير ≤ 30 دقيقة)
      - "Cannibalization Risk" (صفحتان تستهدفان نفس النية)
      - "Orphan Candidate" (بدون inbound links)
      - "Thin Penalty Risk" (عدد كلمات < 1200 للنيّات المعلوماتية)

A4)AEO/Generative Engine Optimization:
    لـ 12 page مختارة (P0: /, /services/, /assessment/, /pricing/,
    /customers/{×3}/, /solutions/[3 sectors], /kernel/, /blog/[أول],
    /docs/[أول]):
      - صفحة لا تحوي ≤60-كلمة TL;DR answer-first؟ = G1.
      - لا تحوي FAQPage schema بـ ≥5 Q/A؟ = G2.
      - لا تحوي SpeakableSpecification؟ = G3.
      - لا تحوي جدول مقارنة (vs alternatives)؟ = G4.
      - لا تحوي Pull-quote (>180 char يُنسخ كاقتباس)؟ = G5.
      - لا يحوي author bio linked to /authors/[slug]؟ = G6.
    تحقق فعليًا ولا تفترض.

A5) ملفات deliverables من الطور A:
    - audit/seo-2026/PAGE-AUDIT.csv بالأعمدة:
        Route, Title_len, Title_AR, Title_EN, Desc_len,
        Canonical, Hreflang_self, Hreflang_peer,
        Indexable, JSON-LD_types, Speakable,
        Wikidata_presence, Inbound_internal_links_count,
        SERP-format-target-fit, AEO-G1..G6 flags,
        KSA-Entity-fit (yes/no), Regulator-mentioned (CSL),
        Source-file:line
    - audit/seo-2026/CANNIBALIZATION-MAP.md
    - audit/seo-2026/AEO-GAPS.md مرتّب حسب (impact×ease^-1).
    - audit/seo-2026/CONFIG-FIX-CONFIRMATION.md:
        تأكد أن:
        • robots.txt يحتوي Sitemap: بصيغة HTTPS كاملة.
        • sitemap.xml عدد URLs = عدد الصفحات الحقيقية في dist/client
          (بعد pnpm build) دون redirects.
        • llms.txt و llms-full.txt موجودان/مُولّدان.
        • ai.txt (إن وجد) سياسة AI-bot واضحة.
        • كل ContentCollection يحوي schema (Zod).

# ── الطور B — Mini Execution Prompts لـ minimax code m3 ──
ولّد 7 برومبتات تنفيذية مصغّرة:

   S1.Meta-Layer-Only-Sweep:
       ضمان وجود title + description + canonical + hreflang + OG
       في كل صفحة مفهرسة — frontmatter only، ممنوع لمس <body>.
   S2.Hreflang-Bidirectional-Audit:
       التحقق أن كل زوج ar ↔ en يصرّح بـ hreflang صحيح في الاتجاهين
       في sitemap.xml وفي <link> داخل <head>.
   S3.Schema-KSA-Enrichment:
       تحديث schema-saudi-seo.json + توليد JSON-LD:
         • Organization: addressCountry=SA, sameAs, areaServed,
           knowsLanguage=["ar","en"].
         • WebSite + SearchAction (سيرش بوكس مفقود = ضائع).
         • SpeakableSpecification على /, /services/, /assessment/,
           /pricing/, /kernel/.
         • FAQPage ≥5 Q/A سعودية فصيحة × 8 صفحات P0.
         • HowTo/TechArticle على /docs/[...slug].
         • Article/BlogPosting مع author.mainEntity linking
           to /authors/[slug].
         • Event لـ /events/{leap-2026,ai-governance-day,webinar}/.
       (التنفيذ عبر حقن schema في layouts + الـ collection files).
   S4.LLMs.txt-and-AI-Txt:
       تأكد من وجود /public/llms.txt و /public/llms-full.txt مع
       سياسة واضحة لـ GPTBot/Claude/Perplexity/Google-Extended/Copilot،
       كذلك /public/ai.txt إن اعتُمد في المشروع.
   S5.Internal-Linking-Cluster-Builder:
       بناء 5 hub-spoke clusters لـ:
         (حوكمة AI · تقييم جاهزية · PDPL · NCA ECC · ROI AI)
       بإضافة cross-links إلى صفحات موجودة فقط (لا تكتب سكاشن
       جديدة)، مع احترام الـ anchors الحالية.
   S6.City-Solution-Page-AEO:
       تحسين /solutions/[sector]/[city] بصياغة answer-first
       لقصد "حوكمة AI في {city} KSA" — نص فقط، لا تكرار صفحة.
   S7.AI-Overview-Snippet-Pack:
       لكل من 12 page P0: تضمين جملة TL;DR ≤60 كلمة داخل <body>
       سكشن hero موجود، مع علامة <aside data-snippet="tl-dr">
       ثابتها (يوثّق للكشّافات).

قيود لكل برومبت مصغّر:
   - لا حذف، لا تكرار صفحة، لا انتقال redirect.
   - اختبار قبول واحد قابل للقياس (مثل:
        "0 خطأ في scripts/seo-health-check.mjs").
   - توثيق في worklog.md بـ BAI-SEO-003-X.
   - يبدأ بـ "الرجاء استخدام Sequential Thinking أولًا" في
     أي تعديل يشمل >3 ملفات.

صيغة الإخراج:
   - تقرير الطور A كاملًا (وليس ملخصًا).
   - ثم كل برومبت مصغّر في بلوك ```text ... ```.
   - ثم توصية ترتيب تنفيذ.
```

---

## 📋 ترتيب التنفيذ الموصى به داخل minimax code m3

1. **BAI-VOC-001-A → -E** (تأسيس لغة الرسالة قبل أي تعديل).
2. **BAI-SEO-003-S1 … S7** (تأمين طبقة الميتا والـ Schema قبل أي تعديل copy).
3. **BAI-CRO-002-C1 … C6** (تحسين معدلات التحويل بعد رسوخ الرسالة).
4. **BAI-IDX-006** (تنفيذ الفهرسة الفعلي — برومبت منفصل لاحقًا).
5. **BAI-DES-004** (تحسينات تصميم P0 فقط).

## ✅ معايير قبول مشتركة لكل مهمة تنفيذية

| المعيار | القياس الأدنى |
|---|---|
| فحوصات SEO | `node scripts/seo-health-check.mjs` → 0 خطأ |
| Schema | `node scripts/seo-schema-audit.mjs` + `…check-speakable-schema.mjs` → clean |
| الروابط الداخلية | `node scripts/internal-links-audit.mjs` → 0 broken |
| الأداء | Lighthouse mobile p75 LCP ≤ 2.5s و CLS ≤ 0.1 |
| الأمان/الفهرسة | `node scripts/check-redirect-destinations.mjs` + `…check-render-route-hygiene.mjs` |
| حقوق المحتوى | 0 صفحة/سكشن محذوف، 0 مكوّن محذوف، 0 redirect متكسر |
| التوثيق | `worklog.md` مُحدَّث بنمط `BAI-XXX-YYY` |

## 🔗 المصادر (لمرجع sul 5.6 عند البحث)

- [BrightAI — الموقع المباشر](https://brightai.site)
- [BrightAI على GitHub](https://github.com/YEEEAE/BRIGHTAI)
- [SDAIA — مبادئ أخلاقيات الذكاء الاصطناعي (السعودية)](https://sdaia.gov.sa/en/SDAIA/about/Pages/AboutAIEthics.aspx)
- [NCA — الضوابط الأساسية للأمن السيبراني (ECC)](https://nca.gov.sa/en/regulatory-documents/controls-list/)
- [SAMA — Frameworks للأمن السيبراني للقطاع المالي](https://www.sama.gov.sa/en-US/RulesRegulations/Pages/Regulations.aspx)
- [SFDA — اللوائح الصحية](https://www.sfda.gov.sa/en)
- [هيئة البيانات والذكاء الاصطناعي — نظام PDPL](https://sdaia.gov.sa/en/MediaCenter/LegalDocuments/Pages/PersonalDataProtectionLaw.aspx)
- [وزارة الاتصالات وتقنية المعلومات (CITC/MCIT)](https://www.mcit.gov.sa/en/)
- [Google Search Central — Indexing best practices](https://developers.google.com/search/docs/crawling-indexing)
- [Astro Docs — Sitemap Integration](https://docs.astro.build/en/guides/integrations-guide/sitemap/)
- [Schema.org — Organization, SpeakableSpecification, FAQPage](https://schema.org/)
- [llms.txt spec (Answer.AI)](https://llmstxt.org/)
- [GitHub llms.txt للـ Astro](https://github.com/AnswerDotAI/llms-txt-html-to-md)

```

---

## 🛡️ ضمانات قالت إنها مذكورة صريحة في كل برومبت مولَّد

- جميع البرومبتات الثلاثة محفوظة كبنية **مستقلة** (لا تندمج البرومبت 1 مع غيره):
  - **البرومبت 1** = VOC + نسخ تسويقية (لا CRO ولا Schema/AEO تقني).
  - **البرومبت 2** = تدقيق CRO + تجربة مستخدم (لا VOC كمصدر أولي، ولا SEO Schema).
  - **البرومبت 3** = SEO + AEO (لا ينشئ نماذج ولا يغيّر UI).
- لا يسأل أي برومبت عن "حذف صفحة/قسم" أو "تغيير نص داخلي عشوائيًا".
- كل توصية تنفيذية في **الطور B** إلزامي أن يبدأ بـ "ابدأ بـ Sequential Thinking" في أي تعديل >3 ملفات، ويلتزم بمسارات الأدوات الحقيقية 108 script داخل المشروع.

## 📌 ما يحتاجه sul 5.6 كي ينجح

- الوصول إلى الـ repo الكامل `BRIGHTAI-main/` مع `pnpm install` مسبق.
- اتصال إنترنت لتنفيذ `node scripts/seo-health-check.mjs` و `node scripts/seo-schema-audit.mjs` و `node scripts/internal-links-audit.mjs`، وللبحث الحي عن المنافسين في SERP KSA و People Also Ask.
- صلاحية القراءة على `render.yaml` و `redirects.json` و `public/robots.txt` و `sitemap.xml` و `schema-saudi-seo.json`.

عند تشغيل sul 5.6، ضع البرومبت الكامل (Preamble + البرومبت المختار) في وسم ```text كي لا يفسّر النموذج الـ backticks ككود قابل للتنفيذ، ثم اسمح له بتحليل الريبو كاملًا قبل أي توليد.