تمام، الصورة واضحة الآن. التحليل مهم قبل ما أعطيك البرومبتات.

## التحليل الصريح للوضع الحالي

**المشكلة الجوهرية:** كل الصفحات التسع تستخدم** ****قالب واحد متكرر حرفياً** (نفس العناوين، نفس النصوص، نفس الـ FAQ، نفس “قبل/بعد Bright AI”). هذا قاتل لأنه:

أولاً، ما فيه playground حقيقي تفاعلي — بس فورم بسيط يطلب وصف نصي ويرجّع “تقرير عام”. ما يستفيد أبداً من قدرات Gemini 2.5 Flash الفعلية (multimodal، function calling، structured output، streaming، long context 1M).

ثانياً، كل الديموهات مخرجاتها متطابقة (ملخص تنفيذي + مؤشر جاهزية + مخاطر + إجراءات) — يعني ما فيه تخصيص حقيقي لكل قطاع. عيادة طبية ما تحتاج “مؤشر جاهزية”، تحتاج استخراج ICD-10 ومراجعة تفاعلات أدوية مثلاً.

ثالثاً، اللغة بلهجة عامية محشورة في كل مكان (“هلا والله، نوّرت 👋”، “خلّنا نوريك”) — هذا ينفع للهيدر فقط، لكن في صفحة احترافية موجهة لمدير مستشفى أو CFO يضرّ المصداقية.

رابعاً، ما فيه أي عنصر بصري ديناميكي: لا charts، لا tables تفاعلية، لا drag-drop للملفات، لا real-time streaming للمخرجات، لا keyboard shortcuts، لا history للجلسات.

خامساً، ما فيه تمييز بين “Playground” و"Sandbox" — المفروض Playground للتجربة السريعة، Sandbox للمحاكاة الكاملة بمدخلات واقعية وبيئة شبه حقيقية.

---

## الـ Prompts الاحترافية للوكيل الذكي

سأعطيك** ****برومبت رئيسي (Master Prompt)** يحدد المعايير العامة، ثم** ****9 برومبتات مخصصة** لكل صفحة.

---

### 🎯 BROMPT 0 — الـ Master System Prompt (يُمرّر مع كل مهمة)

```
You are a senior full-stack AI product engineer rebuilding BrightAI's interactive demos at brightai.site/demo/*. Your mission: transform shallow marketing-style "demos" into world-class interactive AI Playgrounds & Sandboxes that rival OpenAI Playground, Anthropic Console, Hugging Face Spaces, and Vercel AI SDK demos — but tailored for the Middle Eastern enterprise market (Arabic-first, RTL-native, KSA compliance-aware).

## CORE TECHNICAL STACK (mandatory)
- AI Backend: Google Gemini API, model `gemini-2.5-flash` (use `gemini-2.5-flash-thinking` only for reasoning-heavy tasks like data analysis & medical extraction).
- Use Gemini features fully: streaming responses, structured output (responseSchema with JSON), function calling/tools, multimodal input (images, PDFs, audio), long context, system instructions per persona.
- Never expose API keys client-side. All calls go through a secure backend proxy (PHP/Node serverless route) with rate limiting (10 req/min/IP), input sanitization, and PII redaction layer.
- Frontend: vanilla HTML/CSS/JS (or React if existing) with RTL-first layout, Tailwind-style utility classes, no framework lock-in.

## DESIGN PRINCIPLES (non-negotiable)
1. **Two-pane layout** (desktop): Left = input/controls/scenarios. Right = live streaming output with tabs (Visual Report | Raw JSON | Audit Log | Share).
2. **Mobile-first stacked** with bottom sheet for output.
3. **Real-time streaming** with token-by-token typing animation (use Gemini streaming API).
4. **Skeleton loaders** + **progress steps** ("جارٍ القراءة → التحليل → التحقق → التوليد") not spinners.
5. **Dark/Light mode** with KSA-inspired palette (deep navy #0A1F44, gold accent #C9A961, neutral grays). NO purple/pink gradients.
6. **Typography**: Arabic = IBM Plex Sans Arabic or Tajawal 500/700. Latin = Inter. Tabular numbers for data.
7. **Micro-interactions**: hover states, focus rings, success/error toasts, copy-to-clipboard with confirmation, smooth scroll to result.
8. **Empty states** illustrated, not blank.
9. **Accessibility**: WCAG AA, keyboard navigation, ARIA labels in Arabic, skip-to-content link.

## PAGE ARCHITECTURE (apply to every demo)
Replace the current generic template with this structure:

[1] Hero (compact, 1 viewport max)
   - Title: specific to use case (NOT generic "تجربة BrightAI")
   - One-line value prop with measurable outcome ("استخرج 23 حقلاً من فاتورة في 4 ثوانٍ")
   - Two CTAs: "جرّب الآن" (scroll to playground) | "شاهد فيديو 60 ثانية"
   - Trust strip: "مدعوم بـ Gemini 2.5 | بياناتك لا تُحفظ | متوافق مع PDPL السعودي"

[2] The Playground (THE STAR — 70% of page real estate)
   - Scenario chips at top (3-5 pre-built realistic scenarios with one-click load)
   - Input area: rich (file upload + text + voice for relevant cases) with character counter, sample data button
   - Advanced settings collapsible: temperature, max tokens, model variant, output language, system persona
   - Run button with cost estimate ("~0.003$ لكل تشغيل")
   - Output panel: streaming, with sections rendered as proper UI components (charts, tables, cards) NOT plain text
   - Action bar on output: Copy | Download PDF | Share link | Re-run with tweaks | Send to email

[3] Sandbox Mode (advanced tab)
   - Multi-step workflow simulator (e.g., upload 5 invoices → batch process → reconcile → export)
   - Synthetic data generator button
   - API playground showing the actual cURL/JS code that would produce this output
   - Webhook/integration simulator

[4] Output Anatomy (educational, collapsed by default)
   - Visual diagram explaining each output field & confidence score

[5] Real metrics (not vague claims)
   - "متوسط زمن المعالجة: 3.4s | دقة الاستخراج: 94.2% | عدد التجارب اليوم: 1,247"

[6] Industry-specific use cases (3 cards with REAL different inputs/outputs per industry, not copy-paste)

[7] Integration & Architecture diagram (visual: Your System ↔ BrightAI API ↔ Gemini ↔ Your DB)

[8] Compliance & Security (PDPL, NCA ECC, data residency, audit trail) — collapsible

[9] FAQ (specific to the demo, not generic)

[10] Lead capture (only after engagement: smart trigger after first successful run)

## TONE & COPY RULES
- Hero & playground = professional Modern Standard Arabic with light Saudi flavor for warmth.
- NO "هلا والله نوّرت 👋" in body — keep emojis to zero except in onboarding tooltips.
- Numbers in Arabic-Indic OR Western consistently (pick one per page).
- Every claim backed by a number or removed.
- No "وضوح أسرع وتجربة قابلة للتخصيص" — replace with specific outcomes.

## DELIVERABLES per page
1. Full HTML/CSS/JS rewrite with comments.
2. Backend API route (Gemini proxy) with the exact system prompt for that demo.
3. Gemini `responseSchema` JSON for structured output.
4. 5 pre-built realistic scenarios with seed data.
5. Updated meta tags (title, description, OG, schema.org SoftwareApplication).
6. Performance budget: LCP < 2s, TTI < 3s, CLS < 0.1.

When you start a page, FIRST output a "Redesign Brief" (current issues → proposed changes → wireframe ASCII), THEN write the code.
```

---


---

### 👥 PROMPT 8 — HR Automation (`/hr-automation/`)

```
TASK: Rebuild into end-to-end HR ops playground. Apply Master Prompt.

## Hero Concept
"دورة حياة الموظف كاملة في 9 محطات ذكية — من التوظيف إلى ما بعد الخدمة"

## Playground = Process Map
Visual horizontal flow with 9 stages, each clickable to a mini-demo:
1. الاستقطاب (links to Hiring System)
2. التعيين والإلحاق (Onboarding)
3. العقود والوثائق
4. الحضور والإجازات
5. الرواتب والمكافآت
6. تقييم الأداء
7. التدريب والتطوير
8. خدمة الموظف الذاتية
9. إنهاء الخدمة

## Active Stages to Build (the actual playgrounds within)

STAGE 4 — Leave Management AI
- Employee writes: "ودي إجازة الأسبوع الجاي 3 أيام"
- Gemini extracts: leave type, dates, considers leave balance, team coverage, blackout periods
- Auto-routes to manager with smart approval recommendation
- Function calls: check_balance, check_team_coverage, check_blackouts, draft_handover_plan
- Handles edge cases: emergency leave, maternity (90 days KSA), Hajj leave, sick leave with attachment

STAGE 5 — Payroll Co-Pilot
- Upload Excel of employee changes (raises, bonuses, deductions)
- Gemini validates against KSA labor law: minimum wage, overtime calculation, GOSI deductions, end-of-service calc
- Generates مسير الرواتب ready for مدد upload
- Anomaly detection: "موظف زادت ساعاته العادية 40% فجأة — نراجع؟"

STAGE 6 — Performance Review Generator
- Manager enters: 5 bullet points about employee
- Gemini drafts: balanced 360 review, SMART goals for next cycle, development plan
- Bias check: removes gendered language, ensures evidence-based statements
- Outputs in formal Arabic + English bilingual

STAGE 8 — Employee Self-Service Bot
- WhatsApp-style interface
- Employee asks: "وش رصيد إجازاتي؟" / "أبغى شهادة راتب" / "متى نزول الراتب؟"
- Gemini handles via function calling to mock HR systems

## Saudi-Specific Integrations Showcase
- مقيم (Muqeem) - residency
- مدد (Mudad) - WPS / payroll protection
- نطاقات (Nitaqat) - Saudization tracking
- التأمينات الاجتماعية (GOSI)
- قوى (Qiwa) - labor compliance
- أبشر أعمال
- HRSD (Ministry portal)

Show as architecture diagram with bidirectional API arrows.

## Compliance Smart Layer
Every action validated against:
- نظام العمل السعودي
- لائحة تنظيم العمل
- نظام حماية البيانات الشخصية PDPL
- أنظمة GOSI

## Sandbox: Year-End HR Simulation
Run a full fiscal year for a 50-employee company in 60 seconds. Generate full HR analytics report.

## Schemas (per stage)
Leave request:
{
  leave_type: enum[annual|sick|maternity|hajj|emergency|unpaid],
  start_date, end_date, working_days,
  balance_check: {available, requested, sufficient: bool},
  policy_compliance: [{rule, status}],
  team_coverage: {coverage_pct, conflicts: []},
  recommendation: approve|reject|request_modification,
  handover_plan_draft: string
}

## Removals
Generic boilerplate kills credibility for HR managers who deal with very specific compliance requirements. Replace with KSA-specific scenarios.

OUTPUT: Brief + code + Gemini system prompts (one per stage) + KSA labor law rules engine + 50 fake employees seed data + integration mock APIs.
```

---

### 📈 PROMPT 9 — Marketing Automation (`/marketing-automation/`)

```
TASK: Rebuild into marketing command center playground. Apply Master Prompt.

## Hero Concept
"حملة تسويقية كاملة من الفكرة إلى التنفيذ في 4 دقائق — مدعومة بـ Gemini 2.5"

## The Playground = Campaign Builder
Step-by-step wizard, but each step is AI-powered and visually rich.

STEP 1 — Strategy
Inputs: Product/service description, target audience, goal (awareness/leads/sales), budget, timeline.
Gemini outputs: 
- Audience personas (3 detailed with demographics, psychographics, KSA-specific)
- Competitive landscape (named real competitors in KSA market)
- Recommended channel mix with budget allocation %
- Funnel architecture diagram

STEP 2 — Creative Production
Multi-channel content generated in parallel:
- 5 Instagram captions + visual brief (Gemini describes the image, future: integrate Imagen 3 for generation)
- 3 Twitter/X threads
- 2 LinkedIn articles (long-form)
- 1 TikTok script with hook + scenes
- WhatsApp broadcast template
- SMS variants (160 char) — A/B/C
- Google Ads headlines (15) + descriptions (4)
- Email sequence (5 emails: welcome → value → social proof → urgency → close)
- Landing page copy (full structure)

ALL in MSA Arabic with Saudi market relevance, plus English variants.

STEP 3 — Visual Content Plan (calendar)
- 30-day content calendar auto-generated, considers KSA dates: National Day, Founding Day, Ramadan, Eid, Hajj, school terms
- Best posting times per platform per audience
- Content pillars distribution

STEP 4 — Performance Predictor
- Gemini estimates: reach, CTR, conversion, CAC, ROAS based on inputs
- Confidence intervals
- Sensitivity analysis: "if budget increases 50%, expected ROAS = ..."

STEP 5 — Live Optimization Loop (simulated)
- Show 7-day campaign running with synthetic data
- AI recommendations updating: "أوقف إعلان رقم 3، CTR منخفض. ضاعف ميزانية إعلان 7"
- Auto-rebalancing of spend
- Audience refinement suggestions based on lookalikes

## Sandbox: Multi-Channel Campaign Simulator
Pre-built scenarios:
- "إطلاق منتج SaaS جديد بميزانية 50K ريال"
- "حملة موسم العودة للمدارس لتطبيق توصيل"
- "حملة رمضانية لعلامة أزياء محتشمة"
- "حملة تسويق عقاري لمشروع في الرياض"

Each plays out as a 90-second simulation showing all stages.

## Cultural & Religious Sensitivity (system prompt)
- No imagery of inappropriate content
- Respect for Islamic values in messaging
- Awareness of conservative vs progressive segment in KSA
- Halal-compatible product positioning
- Sensitivity to regional differences (Riyadh vs Jeddah vs Eastern Province)

## Schemas
Campaign brief:
{
  audience_personas: [{name, age, income_band, location, pain_points, channels, hooks}],
  channel_mix: [{channel, budget_pct, expected_kpi}],
  content_pieces: [{type, channel, copy, visual_brief, cta, hashtags, posting_time}],
  calendar: [{date, hijri_date, occasion, content_id}],
  forecasts: {reach, impressions, clicks, conversions, ctr, cvr, cac, roas},
  optimization_loop: [{day, action, reason, expected_impact}]
}

## Tools (Function Calling)
- `competitor_scan(brand)` — mock SEMrush
- `keyword_research(seed)` — mock Ahrefs
- `audience_size(filters)` — mock Meta
- `predict_performance(creative, audience, budget)` — internal model
- `schedule_post(content, channel, time)` — mock Buffer

## Integrations Showcase
Meta Ads, Google Ads, TikTok Ads, Snapchat, X, LinkedIn, Mailchimp, Salla, Zid, WhatsApp Business, Unifonic SMS.

## Removals
The current page is just text — for a marketing demo, this is ironic. Visual richness here is non-negotiable.

OUTPUT: Brief + code + Gemini system prompt + KSA marketing context doc + 4 full campaign scenarios + content calendar template + performance prediction model (heuristics doc).
```

---

## ملاحظات تنفيذية مهمة

**ترتيب التطوير المقترح:** ابدأ بـ** ****OCR** و**Data Analyzer** أولاً — هذولا اللي يبهرون بصرياً ويعطون “wow factor” يساعد بقية الصفحات. بعدها** ****Customer Service** و **Hiring** . أما** ****Hospital** و**HR** فأكثرها تعقيداً، خلّها أخيراً.

**تكلفة Gemini:** بحساب تقريبي 1000 تشغيل/شهر/ديمو × 9 ديموهات ≈ 50-100$ شهرياً مع 2.5 Flash، معقول جداً. حط cap على البك إند: 10 طلبات/IP/دقيقة، 100/IP/يوم.

**تحذير:** الـ 9 prompts اللي فوق طويلة عمداً لأن الوكيل يحتاج سياق كامل. لو تستخدم Claude Code أو Cursor، مرر** ****Master Prompt**كـ system، ثم كل** ****Page Prompt** كمهمة منفصلة.

تبيني أكتب لك أيضاً الـ** ****Master Prompt للباك إند** (PHP/Node proxy لـ Gemini) أو** ****wireframe ASCII** لإحدى الصفحات كنموذج توضيحي قبل ما تبدأ التنفيذ؟
