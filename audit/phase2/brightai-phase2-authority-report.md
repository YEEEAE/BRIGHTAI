# BRIGHTAI — PHASE 2: تقرير السلطة البحثية السعودية ومحرك الاستشهاد الذكي

> **التاريخ:** 2026-08-24 · **النطاق:** بحث كامل + تنفيذ أعلى الأصول + Gate 0 إنتاجي
> **الحدود الصادقة:** GSC غير متصل · Ubersuggest = RATE LIMITED · ChatGPT/Perplexity/Gemini مباشرون = غير متاحين (استُخدم وكيل بحث ويب) · وكيل Digital PR توقف بحد أسبوعي (يعود 2026-08-27) — كل ذلك موثق بدون أي تلفيق
> **ممنوع منعًا باتًا:** commit/push/PR/تغيير إنتاجي — المستخدم ينفذ وينشر

---

## 0) Gate 0 — حقيقة الإنتاج أولًا

**نتيجة الفحص الحي المباشر:** الموقع الحي يقدّم المحتوى الثابت محدّثًا (آخر صفحة agentic منشورة، sitemap حي = 261 URL مطابق، كل الصفحات الاستراتيجية الست + الجديدة 200)، لكن **طبقة سيرفر النود ميتة بالكامل**:

| الدليل | محليًا (dist مبني من HEAD) | حيًا |
|---|---|---|
| `/api/health/` | **200 JSON** | **404** |
| هيدر `x-brightai-build` | موجود | **غير موجود نهائيًا** |
| `/services/finance.html` → | **301** | **404** |
| robots.txt | 103 سطر صفر Disallow | **164 سطر بكتلة Cloudflare تمنع 9 زواحف AI** |

**ROOT CAUSE مثبت:** الكود سليم 100% — الإنتاج يعمل static-only رغم أن render.yaml يعرّف خدمة Node (`node ./dist/server/entry.mjs`). التغيير حدث بمستوى لوحة Render. والـ robots الحي يُحقن من Cloudflare AI Crawl Control.

**الإصلاح:** خطوات دقيقة جاهزة في `audit/phase2/gate0-production-truth-and-remediation.md` — P0-A (Cloudflare: تعطيل Managed robots + Purge) ثم P0-B (Render: Web Service Node). **لا توسّع كيان قبل إغلاقهما** — خاصة أن P0-A وحده يفسّر غيابنا عن grounding في ChatGPT/Claude/Gemini.

---

## 1) خريطة الطلب السعودي (PHASE 2.1–2.2)

رصد فعلي لـ **44 استعلامًا**: 20 عربي + 14 إنجليزي + 7 AI-proxy + استعلام النطاق. النتيجة القاسية الموثقة: **brightai.site غائب عن كلها** — والظهور الوحيد بالكامل هو #1 على «BrightAI Saudi» و«BrightAI AI Governance» عبر `/en/`.

**أقوى 5 فرص (SERP عربي شبه فارغ):**
1. **سجل مخاطر الذكاء الاصطناعي** — مقالات مترجمة آليًا + PDF نِست فقط (34/35)
2. **سدايا إطار إدارة مخاطر AI** — أخبار فقط منذ إطلاقه (أغسطس 2026، ورشة 45 جهة) — نافذة سبق مفتوحة (31/35)
3. **جدار حماية الذكاء الاصطناعي** — تطبيق أندرويد استهلاكي يخطف الاستعلام! (31/35)
4. **تصنيف مخاطر AI** — ليستليات عامة بلا نموذج هرمي عربي (30/35)
5. **سجل تدقيق الذكاء الاصطناعي** — مقال أجنبي واحد فقط (30/35)

**حقيقة تنظيمية قابلة للاقتباس:** سدايا أول جهة عالميًا بشهادة ISO/IEC 42001 (واس N2137042) + الإطار الوطني لإدارة مخاطر AI أطلق ورشته مع 45 جهة (الجزيرة 2026-08-04) + PDPL نافذ منذ 14 سبتمبر 2024 بنطاق خارج الإقليم. المصادر داخل خريطة الطلب CSV.

الملف: `saudi-search-demand-map.csv` (24 استعلامًا بتقييم /35 — 19 فرصة ≥25).

## 2) فصل الكيان (PHASE 2.3)

**تصادم حقيقي موثق:** BrightAI الأمريكية (bright.ai — Physical AI، 51M$ جولة يوليو 2025، TechCrunch/SiliconAngle) تملك SERP الاسم المجرد بالكامل. حتى بحث «brightai.site» يصحح تلقائيًا لمنظومتها. حساباتنا الرسمية (X/LinkedIn) صفر ظهور بحثي.

**الاستراتيجية المعتمدة:** نبني على المُقيّدات المملوكة (#1 «BrightAI Saudi» و«BrightAI AI Governance») ولا نقاتل الاسم المجرد. التوصيات التنفيذية بالتقرير: `alternateName: "BrightAI Saudi"` بالـ Organization schema، تعريف «Saudi AI Safety OS» نصيًا داخل الصفحات الموجودة (العبرة اليوم يتيمة — محرك البحث يقول "ما فيه منتج بهذا الاسم")، وتفعيل الحسابات الاجتماعية بمحتوى حقيقي. الملف: `entity-disambiguation-report.md`.

## 3) مصفوفة ظهور AI Search (PHASE 2.21–2.22)

**0/7 prompts** عبر وكيل البحث. من يُقتبس بدلًا عنّا: sdaia.gov.sa/my.gov.sa (رسمي)، مكاتب محاماة (cms.law/twobirds/gowlingwlg)، وبائعون أجانب بنوا **صفحات هبوط سعودية بالإنجليزي** (modulos.ai، securiti.ai/saudi-arabia-generative-ai-guide، cyberarrow.io، complyan.com)، ومنافسون محليون (evc.sa، crux.sa، alplatform.ai).

**التشخيص الجذري الثلاثي:** (1) زواحف AI ممنوعون حيًا (P0-A) (2) صفر backlinks ودومين جديد (3) غياب صفحات إنجليزية مخصصة للنيّات. **مش مشكلة صياغة فقرات** — أي ادعاء بأن إعادة كتابة ستكسب اقتباسًا كاذب. الملف: `ai-search-visibility-matrix.csv`.

## 4) الأصول القابلة للربط — المنفذ والمخطط (PHASE 2.4–2.6)

| # | الأصل | الحالة |
|---|---|---|
| 1 | **سجل مخاطر AI + تصدير CSV/JSON** | ✅ **منفذ هذه الجلسة** — تصدير client-side محلي (Blob، صفر شبكة، متوافق CSP، progressive enhancement، الطباعة سليمة، BOM للعربية في Excel) + اختبار عقد 2/2 |
| 2 | محور سدايا للمخاطر (P145 v1.0) | موجود ومنشور — يحتاج جسور روابط (§6) ونشرًا خارجيًا |
| 3 | مصفوفة ضوابط الحوكمة (13 عائلة) | موجودة داخل /hub/ai-governance/ (جلسة سابقة) |
| 4 | تقييم الجاهزية (8 محاور) | موجود — توصية: بعد استقرار الجلسة الموازية تضاف محورا vendor-AI وagent-governance (9→10 محاور) |
| 5 | Policy→Control Mapper | `/solutions/policy-to-control-mapping/` يخدم النية — لا URL جديد (قاعدة عدم التكرار) |
| 6 | Shadow AI Checklist | مؤجل — siyadhai سبقنا بمقال؛ القرار: قسم تعريفي داخل `/solutions/ai-use-case-discovery/` بدل URL جديد |

**محرك البحث الأصلي (2.6) — مقترح منهجية فقط بدون بيانات:** «تقرير جاهزية الحوكمة السعودي» من تجميع مجهول لنتائج التقييم (opt-in صريح) + منهجية منشورة + إصدار وتاريخ + تمييز PRIMARY/SECONDARY/BrightAI-analysis. يبدأ جمع البيانات بعد deploy الأصل رقم 1.

## 5) العناقيد (PHASE 2.7–2.8, 2.9, 2.15)

**رحلة المخاطر المكتملة:** وش هو؟ → `/docs/ai-risk-management/` · كيف أديره؟ → `/hub/sdaia-ai-risk-management/` · كيف أصنفه؟ → `/solutions/ai-risk-classification/` · أعطني قالبًا → `/tools/ai-risk-register/` ✅ **الأداة الآن بتصدير جاهز**.

**Agentic (2.9): قرار مالك واحد** — `/hub/agentic-ai-governance/` (منشور أمس) يكفي. لا صفحات agentic جديدة إلا بعد دليل GSC على نية مستقلة. الجلسة الموازية تبني حاليًا `/hub/agentic-ai-security/` — تنسيق لا ازدواج (موثق بالمصفوفة).

**Firewall vs AI Gateway (2.15):** المقارنة موجودة vs تقليدي وvs DLP فقط. توصية موثقة: قسم عربي ثالث «AI Firewall vs بوابة AI» بنفس الصفحة التجارية (الفرق: الGateway يراقب ويوجه، الـ Firewall يفحص ويطبق سياسة وينتج دليلًا) — **بدون URL جديد**.

## 6) هندسة الروابط الداخلية (PHASE 2.16)

خريطة TIER كاملة في `internal-authority-flow.csv`. **تحقق grep فعلي كشف 4 جسور مفقودة**:
1. ~~firewall→pdpl-chatgpt-doc~~ → ✅ **منفذ هذه الجلسة** (`src/data/solutions.ts`)
2. sdaia-hub→risk-register-tool — ملف الجلسة الموازية `SdaiaAiRiskManagementGuide.astro`
3. risk-classification→sdaia-hub — ملفات solutions content
4. platform→risk-register-tool — نفسها

(2–4 موثقة بتأنكورات وسياقات جاهزة لأن ملفاتها تُعدَّل الآن بالجلسة الموازية — التعديل المتزامن عليها كان سيصطدم.)

**ملاحظة معمارية مرصودة:** `/hub/security/` موجود بالـ sitemap لكنه غايب عن بطاقات فهرس hub — الجلسة الموازية تعدل index.astro الآن؛ القرار الموثق: بطاقة أو دمج، وليس ترك مسار يتيم.

## 7) صفحات المال — توصيات من بحث SERP التجاري (PHASE 2.14)

المنافسون العالميون يجيبون أسئلة المشتري التي صفحاتنا لا تجيبها بعد (بدون تحويلها لمقالات):

| الصفحة | الأسئلة الغائبة (من SERP الفعلي) |
|---|---|
| ai-governance-platform | أي أطر مدعومة جاهزًا؟ كم يستغرق الجاهزية للتدقيق؟ (المنافسون: 30–90 يوم) ما التكاملات؟ (Credo: 300+) ليش منصة مو Excel؟ (Fronterio تملك صفحة المقارنة) |
| ai-firewall | وش الهجمات المحدودة بالضبط؟ الزمن الكمي/معدل الإنذارات الكاذبة؟ (Lakera: <50ms/0.01%) كيف النشر وكم وقت الإنتاج؟ (Akamai: "hours") |
| ai-risk-classification | مستويات سدايا الأربعة (مسودة السياسة 2026) × EU-style tiering — لا أحد يربطهم عربيًا |
| human-approval-layer | الربط التنظيمي: الإشراف البشري ركن بسدايا — لا أحد يستغل هذا الاتصال (فرصة فريسة) |
| iso-42001 (blog) | أسئلة اختيار الأداة/RFP بالسياق السعودي (Vanta تملكها إنجليزيًا بلا سعودية) |

**فجوة تنافسية شاملة:** صفر منافس (من 12+) يقدم عربيًا كاملًا أو SDAIA-native controls — Securiti الوحيدة بتبديل عربي بلا محتوى سعودي. **والجميع يخفي الأسعار** — الشفافية السعرية بالسوق السعودي سلاح تموضع.

## 8) Digital PR (PHASE 2.19–2.20)

`saudi-digital-pr-targets.csv` — 22 هدفًا: 10 بأدلة OBSERVED من أبحاث هذه الجلسة (الجزيرة/المدينة/عاجل غطّوا إطار سدايا = الزاوية الإعلامية ساخنة الآن، الشرق الأوسط، الجزيرة تك، AIGA_KSA جمعية الحوكمة...) و12 KNOWN-TARGET موسومة «تحقق يدوي» (الاقتصادية، أرقام، Arab News، TahawulTech، LEAP، Black Hat MEA، ثمانية...). **بدون outreach آلي ولا شراء روابط.** الأصل المرشح للـ pitch الأول: قالب سجل المخاطر المجاني بعد deploy التصدير.

## 9) لوحة المؤشرات وخطة 90 يوم (PHASE 2.23–2.24, 2.30)

- **GSC محجوب حتى الربط** — عملية CTR/GSC جاهزة حرفيًا بالتقرير (تصدير 90 يوم → STRIKING DISTANCE 4–15 → تجارب عنوان واحدة لكل صفحة).
- **قبل GSC:** إغلاق P0-A/P0-B → deploy → ربط GSC → 30 يوم baseline.
- **KPI الأول القابل للقياس الآن:** ظهور robots نظيف (زحف AI)، ثم impressions سعودية بعد 30 يوم من deploy، ثم Top-10 queries، ثم referring domains (هدف واقعي: أول 5 خلال 90 يوم من PR).

## 10) التغطية الموضوعية (PHASE 2.26–2.27)

21 موضوعًا في `topic-coverage-matrix.csv`: OWNED×13 · قرارات DO NOT CREATE ×4 (رأس «حوكمة AI» ضد IBM، Vision 2030، city-pages برمجية، تكرار agentic) · DUPLICATE RISK قطاعي بانتظار GSC (قرارات GA-SEO-AUDIT-002 باقية سارية).

---

## المخرجات الثمانية + الإضافي

1. `brightai-phase2-authority-report.md` ← هذا الملف
2. `saudi-search-demand-map.csv` · 3. `topic-coverage-matrix.csv` · 4. `internal-authority-flow.csv` · 5. `ai-search-visibility-matrix.csv` · 6. `saudi-digital-pr-targets.csv` · 7. `entity-disambiguation-report.md` · 8. `phase2-execution-ledger.csv`
+ `gate0-production-truth-and-remediation.md` (خطوات P0 الدقيقة)

## التغييرات المنفذة على الكود (محلية — الـ commit عليك)

1. `/tools/ai-risk-register/` + `public/js/ai-risk-register-export.js` — تصدير CSV/JSON محلي كامل
2. `scripts/ai-risk-register.test.mjs` — العقد وسّع (2 اختبار)
3. `src/data/solutions.ts` — جسر firewall→pdpl-chatgpt-doc
4. `audit/phase2/*` — 9 ملفات

**ما لم يُعدَّل عمدًا:** ملفات الجلسة الموازية النشطة (hub pillars/index/[slug]/assessment/sdaia-guide) — توصياتها موثقة جاهزة أعلاه.

## التحقق

اختبار العقد: `ai-risk-register.test.mjs` **2/2** · `ai-firewall-commercial-page.test.mjs` **2/2** (بعد جسر الروابط) — التفاصيل الكاملة بقسم Validation بالرد النهائي وبسجل التنفيذ.

> **حدود هذه النسخة:** كل أرقام الفرص تقديرات نوعية من تركيبة SERP (لا أحجام بحث ملفقة) · نتائج AI Search = وكيل بحث لا مزودون مباشرون · Digital PR جزئي (وكيل البحث وقف بحد أسبوعي — يكمل بعد 2026-08-27).
