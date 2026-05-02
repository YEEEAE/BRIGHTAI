
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

### 🤖 PROMPT 1 — Smart Hiring System (`/smart-hiring-system/`)

```
TASK: Rebuild the Smart Hiring playground from scratch. Apply the Master System Prompt.

DEMO-SPECIFIC SPEC:

## Real Playground Functionality
Build a 3-step interactive flow powered by Gemini 2.5 Flash with structured output:

STEP 1 — Job Definition
- Rich form: Job title (autocomplete from common KSA roles), department, seniority slider, must-have skills (tag input), nice-to-have skills, language requirements, Saudization preference toggle.
- "تحميل وصف وظيفي جاهز" button loads 6 realistic Saudi job samples (مدير مشروع، محاسب أول، ممرضة، مهندس DevOps، أخصائي تسويق، مشرف إنتاج).

STEP 2 — Candidate Input (multimodal)
- Tabs: Paste CV text | Upload PDF/DOCX | LinkedIn URL paste | Bulk upload (drag 10 CVs).
- File parsing handled via Gemini multimodal (send PDF directly to gemini-2.5-flash).
- Show preview with extracted name/email/phone REDACTED for privacy, with toggle to unredact.

STEP 3 — AI Evaluation (the magic)
Stream output with these sections rendering as proper UI:
- **Match Score** (0-100) as animated radial gauge with breakdown: Skills 40% | Experience 30% | Education 15% | Cultural Fit 15%
- **Skill Matrix Heatmap** (table: required skills × candidate evidence with green/yellow/red)
- **Experience Timeline** (visual horizontal timeline parsed from CV)
- **Red Flags** (gaps, job hopping, inconsistencies) with severity badges
- **Tailored Interview Questions** (8 questions: 3 technical, 3 behavioral, 2 situational) — each with "why this question" tooltip and expected good-answer hints
- **Bias Audit** (transparent section showing AI's reasoning + what factors were intentionally ignored: gender, age, nationality)
- **Comparative Ranking** when multiple CVs uploaded — sortable table with shortlist toggle

## Gemini Configuration
Use responseSchema:
{
  match_score: integer,
  score_breakdown: { skills, experience, education, culture },
  skill_matrix: [{skill, required, evidence, level}],
  experience_summary: [{company, role, years, relevance}],
  red_flags: [{type, severity, description}],
  interview_questions: [{question, category, rationale, good_answer_signals}],
  bias_audit: { factors_ignored, reasoning_transparency }
}

System instruction in Arabic emphasizing: KSA labor law awareness, Saudization (نطاقات), no discrimination, evidence-based scoring only.

## Sandbox Tab
"محاكاة دفعة كاملة": pre-load 12 fake CVs for one job, run all in parallel (Promise.all with rate limiting), show ranked leaderboard, allow drag-to-shortlist, export to PDF report ready for hiring committee.

## Integrations Showcase
Visual cards (non-functional in demo, marked "في النسخة المؤسسية"): Mqeem, Muqeem, Bayan HR, Workday, SAP SuccessFactors, ATS REST hooks.

## Metrics to Display Live
- زمن التقييم: live counter
- عدد المرشحين المُقيَّمين اليوم على المنصة
- متوسط دقة المطابقة (مقارنة بقرار HR البشري في اختبار داخلي): 89%

## Remove from current page
- Generic "ملخص تنفيذي / مؤشر جاهزية" boilerplate
- "هلا والله نوّرت 👋"
- Identical use-case cards with copy-paste outputs

OUTPUT: Brief + full code + Gemini system prompt in Arabic + 6 seed job samples + 12 seed CVs.
```

---

### 🏥 PROMPT 2 — Smart Medical Archive (`/smart-medical-archive/`)

```
TASK: Rebuild Medical Archive playground. Apply Master Prompt + medical-grade caution.

## Critical Disclaimers (must appear before playground)
"هذه التجربة تستخرج وتنظم البيانات السريرية لأغراض الأرشفة فقط. لا تقدم تشخيصاً ولا توصية علاجية. النسخة المؤسسية متوافقة مع اشتراطات سهل وحماية البيانات الصحية في وزارة الصحة."

## Playground Core
Multimodal input — this is critical:
- Upload tabs: Image of handwritten doctor note | Scanned PDF lab report | Typed clinical text | DICOM metadata text
- Use Gemini 2.5 Flash multimodal vision for image OCR of handwritten Arabic + English mixed.

## Structured Extraction (responseSchema)
{
  document_type: enum[clinical_note, lab_report, prescription, discharge_summary, radiology_report, referral],
  patient_demographics: {age_band, gender, mrn_redacted}, // never show real MRN
  visit_info: {date, department, attending_physician_role},
  chief_complaint: string,
  vital_signs: {bp, hr, temp, spo2, rr, weight},
  diagnoses: [{text_ar, text_en, icd10_code, icd10_confidence, type: primary|secondary}],
  medications: [{name, generic, dose, route, frequency, duration, sfda_registered: bool}],
  allergies: [],
  lab_results: [{test, value, unit, reference_range, flag: H|L|N|critical}],
  procedures: [{cpt_code, description}],
  follow_up: {required, timeframe, department},
  data_quality: {completeness_pct, missing_fields[], illegible_sections[]},
  privacy_risks: [{field, risk_level, recommendation}],
  routing_suggestion: {target_department, urgency: routine|urgent|stat}
}

## Output UI Components
- **Document Viewer** on left (the uploaded image/PDF) with bounding-box highlights showing where each field was extracted from (click field → highlights source)
- **Structured Card** on right with all extracted fields, each editable inline (human-in-the-loop)
- **ICD-10 Coder** with confidence badges, alternative codes suggested
- **Drug Interaction Checker** (uses Gemini function calling to a mock SFDA API) — flags interactions
- **Data Quality Score** circular indicator
- **Privacy Heatmap** showing PII/PHI density and where to redact

## Sandbox: Cross-Record Linking
Pre-load 5 fake patient records, demo how the system links visits, identifies the same patient across departments using fuzzy matching, builds a longitudinal timeline.

## Compliance Section (prominent)
- وزارة الصحة - مركز التميز للأمن السيبراني
- متوافق مع نظام حماية البيانات الشخصية PDPL
- معايير HL7 FHIR R4 للتبادل
- تشفير AES-256 at rest, TLS 1.3 in transit
- سجل تدقيق كامل لكل وصول

## Seed Data (use realistic but FAKE)
6 sample documents: Arabic handwritten GP note, English radiology report, mixed-language discharge summary, lab CBC report image, prescription image, ER visit summary.

## Specific Removals
Remove generic "مؤشر جاهزية" — meaningless here. Replace with "Data Quality Score" + "Privacy Risk Score" + "Coding Completeness".

OUTPUT: Brief + code + Gemini system prompt with strong "no diagnosis" guardrails + 6 seed documents + ICD-10 mini-database for client-side validation.
```

---

### 📊 PROMPT 3 — Data Analyzer Platform (`/data-analyzer/`)

```
TASK: Rebuild into a true data analytics playground. Apply Master Prompt + use gemini-2.5-flash with code execution tool.

## Core Innovation
This MUST feel like a mini Tableau + ChatGPT Code Interpreter. Not just text output — REAL CHARTS rendered from data.

## Input Methods
- Upload CSV/XLSX (parse client-side with SheetJS, send first 1000 rows to Gemini)
- Paste table (auto-detect delimiter)
- Connect sample datasets (5 realistic KSA business datasets pre-loaded: e-commerce sales 2024, restaurant chain ops, clinic appointments, factory production, marketing campaigns)
- Natural language data generation: "ولّد بيانات مبيعات 6 أشهر لشركة B2B"

## The Conversation Layer (NEW)
After upload, user TALKS to data in Arabic:
- "وش أعلى 5 منتجات مبيعاً؟"
- "ليش انخفضت المبيعات في رمضان؟"
- "ارسم لي trend الإيرادات وقارنه بالسنة الماضية"
- "اكتشف أي شذوذ في البيانات"

Gemini uses function calling with these tools:
- `run_sql(query)` — DuckDB-WASM in browser
- `create_chart(type, x, y, group_by)` — Chart.js/Recharts render
- `detect_anomalies(column, method)` — statistical outliers
- `forecast(column, periods)` — simple time-series projection
- `correlate(col_a, col_b)` — Pearson with significance

## Output UI
- Multi-panel dashboard auto-generated:
  - KPI cards (auto-detected: revenue, growth %, anomaly count)
  - Time series chart with annotations
  - Top-N bar chart
  - Heatmap if 2D categorical detected
  - Anomaly highlights table
- Each chart has: download PNG, embed code, "explain this chart" button (calls Gemini for narrative)
- "Insights Feed" — Gemini proactively surfaces 5 insights without being asked

## Sandbox: Executive Dashboard Builder
Drag-drop canvas where user composes a dashboard from generated charts, sets refresh schedule, defines alerts ("نبهني لو انخفضت المبيعات 10%"), exports as live URL.

## Output Schema
{
  dataset_profile: {rows, cols, types, missing_pct, date_range},
  kpis: [{name, value, change_pct, sparkline_data}],
  insights: [{text, severity, supporting_chart_id, confidence}],
  anomalies: [{row, column, value, z_score, explanation}],
  suggested_questions: string[], // for follow-up
  recommended_dashboards: [{title, charts[]}]
}

## Trust Layer
- Show the SQL query Gemini generated for each answer (transparency)
- "Why this answer?" expandable showing Gemini's reasoning chain
- Confidence score on every insight

## Removals
Kill the "ملخص تنفيذي / مؤشر جاهزية / إجراءات موصى بها" generic blocks. Replace with: live dashboard + chat panel + insights feed.

OUTPUT: Brief + code + Gemini system prompt + function definitions + 5 seed CSVs + DuckDB-WASM integration code.
```

---

### 🎓 PROMPT 4 — AI Education Platform (`/ai-scolecs/`)

```
TASK: Rebuild into multi-role education playground. Apply Master Prompt.

## Three-Persona Toggle (top of playground)
🎓 طالب | 👨‍🏫 معلم | 🏫 إدارة مدرسة
Each persona = completely different UI and Gemini system instructions.

## STUDENT Mode
- Subject picker (Math, Arabic, Science, English) × Grade (1-12 KSA curriculum)
- Topic input + difficulty slider
- Features powered by Gemini:
  - **Tutor Chat** — Socratic method (Gemini system prompt: "Never give the answer directly. Ask leading questions. Adapt to student's level from their replies.")
  - **Practice Generator** — produces 10 questions matching difficulty, with auto-grading + step-by-step explanations
  - **Concept Visualizer** — generates SVG diagrams or asks Gemini to write a mermaid.js diagram for the concept
  - **Voice Q&A** — student asks by voice (Web Speech API → Gemini → response)
  - **Weakness Detector** — after 5 questions, identifies misconceptions and prescribes targeted exercises

## TEACHER Mode
- Lesson Plan Generator (curriculum-aligned to منهاج وزارة التعليم)
- Quiz Builder with Bloom's taxonomy distribution slider
- **Assignment Grader** (multimodal): teacher uploads photo of student handwritten work → Gemini grades + gives detailed feedback in red-pen style
- Student progress predictor based on past scores
- Plagiarism check (compare 2 essays for similarity)
- Parent communication draft generator

## ADMIN Mode
- Cohort analytics dashboard (which classes/subjects underperforming)
- At-risk student early warning system
- Curriculum coverage heatmap
- Teacher performance insights (anonymous, aggregate)

## Sandbox: Full Class Simulation
Pre-load a fake class of 25 students with semester data. Run "what if" scenarios: "what if we change exam format from MCQ to written?" — Gemini predicts impact distribution.

## Schema Examples
Student tutor response:
{
  pedagogical_strategy: string,
  guiding_question: string,
  hint_level: 1-5,
  scaffolding_visual: mermaid_code,
  next_difficulty_recommendation: easier|same|harder
}

## Curriculum Compliance
Map every output to KSA Ministry of Education learning outcomes (use code like SCI-G7-LO-3.2). Show this code on every generated content piece.

## Cultural & Religious Sensitivity (system prompt rule)
- All examples align with Saudi cultural values
- Islamic context for relevant subjects (e.g., Fiqh problems for math word problems)
- No imagery of inappropriate content
- Hijri/Gregorian dual calendar in examples

## Remove
Generic "حالات استخدام: عيادة / مصنع / متجر" — irrelevant for education. Replace with: مدرسة حكومية ابتدائية | معهد تدريب مهني | مدرسة دولية | جامعة.

OUTPUT: Brief + code + 3 separate Gemini system prompts (one per persona) + 25 seed student profiles + sample curriculum mapping.
```

---

### 🏨 PROMPT 5 — Smart Hospital Management (`/smart-hospital-management/`)

```
TASK: Rebuild into hospital ops command center playground. Apply Master Prompt.

## Hero Concept
"غرفة عمليات افتراضية لمستشفى 200 سرير — جرّب اتخاذ قرارات تشغيلية مدعومة بالذكاء الاصطناعي"

## Live Dashboard (the playground IS the dashboard)
Pre-loaded with simulated real-time data that updates every 5 seconds (synthetic stream):
- **Bed Occupancy Heatmap** — floors × wards, with predicted occupancy in 6h via Gemini forecast
- **ER Wait Times** — current + predicted surge windows
- **OR Schedule Optimizer** — drag operations to reschedule, Gemini recalculates conflicts and staff utilization
- **Staff Roster Heatmap** — shift coverage gaps highlighted
- **Supply Chain Alerts** — meds approaching expiry or stock-out
- **KPI Strip** — ALOS, readmission rate, mortality index, patient satisfaction (pulled from synthetic feed)

## AI Co-Pilot Sidebar (Gemini-powered)
Always-on chat where hospital director can ask:
- "ليش زاد متوسط مدة الإقامة في القسم الباطني هذا الأسبوع؟"
- "اقترح إعادة توزيع الكوادر للوردية المسائية"
- "ولّد تقرير جودة شهري لمجلس الأمناء"

Function calls available to Gemini:
- `query_kpi(metric, time_range, filter)`
- `simulate_scenario(change, horizon)` — what-if
- `generate_report(template, period)` — produces formatted PDF
- `check_compliance(standard: CBAHI|JCI|MOH)` — gap analysis

## Sandbox Scenarios (pre-built)
1. "موسم حج: ضاعف الإسعاف وادرس التأثير"
2. "أوبئة موسمية: ارتفاع 40% في حالات الإنفلونزا"
3. "نقص كادر تمريض: غياب 15% — كيف نوزع؟"
4. "مراجعة سباهي قادمة خلال 30 يوم — ما الفجوات؟"

Each scenario plays out over a 30-second simulated timeline with Gemini narrating decisions and trade-offs.

## Output Schema for AI recommendations
{
  decision_summary: string,
  recommended_actions: [{action, impact_estimate, effort, risk, owner_role, deadline}],
  trade_offs: [{benefit, cost}],
  affected_kpis: [{kpi, current, projected, delta}],
  compliance_notes: [{standard, clause, status}],
  human_approval_required: bool
}

## Compliance Layer (prominently shown)
- متوافق مع معايير سباهي CBAHI
- معايير JCI International
- اشتراطات مركز التميز للأمن السيبراني الصحي
- تكامل مع نفيس / وصفتي / صحتي / أنا
- HL7 FHIR + DICOM standards

## Critical Disclaimers
"التوصيات قرارات داعمة فقط — كل قرار سريري أو إداري يبقى مسؤولية الكوادر المؤهلة. المنظومة لا تستبدل الحكم البشري."

## Remove
All generic boilerplate. Replace use-case cards with: مستشفى تخصصي | مستوصف | مجمع طبي | مستشفى جامعي.

OUTPUT: Brief + code + Gemini system prompt + synthetic real-time data generator (JS) + 4 detailed scenarios + KPI definitions doc.
```

---

### 📄 PROMPT 6 — Document Automation / OCR (`/ocr-demo/`)

```
TASK: Rebuild into best-in-class document intelligence playground. Apply Master Prompt + heavy multimodal Gemini usage.

## Core UX
Drag-drop ANY document (image, PDF, scanned, photo from phone) → instant intelligence. This is THE most visual demo — make it shine.

## Document Types Supported (with specific extractors)
- فاتورة ضريبية سعودية (ZATCA-compliant: VAT number, QR code, IRN)
- عقد توريد / خدمات
- إيصال POS
- أمر شراء / Purchase Order
- بوليصة شحن
- شهادة بلدية / تراخيص
- مستندات بنكية (كشف حساب، خطاب ضمان)
- هوية وطنية / إقامة (with auto-redaction by default)
- شهادات تعليمية

## Gemini 2.5 Flash Multimodal Pipeline
1. User uploads → client compresses if >4MB → sends image directly to Gemini.
2. Gemini system prompt: "You are a document understanding engine. Detect document type first, then apply the appropriate extraction schema. Return strict JSON. Flag any field with confidence < 0.7."
3. Use responseSchema dynamic per detected type.

## Output UI (the showpiece)
- Split view: Original document on left with **bounding-box overlay** showing each extracted field highlighted on click
- Right: Structured form with extracted values, each editable, confidence badge, source coordinates
- Bottom strip: validation rules engine (e.g., "VAT = Subtotal × 15% ✓ matches" or "✗ mismatch by 3 SAR")
- Top toolbar: rotate, enhance contrast, re-OCR with different mode (handwriting / printed / mixed)

## ZATCA Compliance Validator (specific to KSA invoices)
For Saudi tax invoices, automatically check:
- Seller VAT number format (15 digits, starts with 3, ends with 3)
- QR code presence and decode it (Phase 2 e-invoicing)
- IRN (Invoice Reference Number)
- Required fields per نظام الفاتورة الإلكترونية
- Show red/green shield icon

## Sandbox: Batch Processing Studio
- Drop 50 mixed documents at once
- Real-time progress per document
- Auto-classification into folders
- Reconciliation: match invoices to POs to receipts (3-way match)
- Export to ERP-ready CSV / JSON / XML
- Webhook simulator: "imagine these were posted to your system" — show payload

## Schema
{
  document_type: detected_type,
  confidence: 0-1,
  language_detected: ar|en|mixed,
  extracted_fields: { /* dynamic per type */ },
  bounding_boxes: [{field, x, y, w, h, page}],
  validation_results: [{rule, status, message}],
  zatca_compliance: { /* if invoice */ valid: bool, issues: [] },
  pii_detected: [{type, location, redacted_value}],
  export_formats_ready: [json, xml, csv, edi]
}

## Integration Showcase
SAP S/4HANA, Oracle Fusion, Microsoft Dynamics, Odoo, Zoho, Onyx Pro, MEZAN, ERPNext — show pre-built connectors with logos.

## Removals
The current page has zero visual feedback — it's catastrophically weak. Rebuild from scratch with the bounding-box visual as centerpiece.

OUTPUT: Brief + code + Gemini system prompt + per-doctype schemas + ZATCA validator JS + 12 sample documents (varied: clean, blurry, handwritten, mixed-language).
```

---

### 💬 PROMPT 7 — Customer Service Automation (`/customer-service-automation/`)

```
TASK: Rebuild into multi-channel customer service playground. Apply Master Prompt.

## Hero Demo Format
Live multi-channel inbox simulator: WhatsApp + Web Chat + Email + Instagram DM all flowing into unified Gemini-powered agent.

## The Playground
Three panels:

PANEL 1 — Channel Simulator (left)
- User picks persona: عميل غاضب | عميل مستفسر | عميل VIP | عميل جديد
- Picks channel + writes message OR loads pre-built scenario
- Voice input simulating WhatsApp voice note (transcribed via Gemini multimodal)

PANEL 2 — Agent Brain (center, the showpiece)
Visualize Gemini's reasoning in real-time:
- 📥 Intent Classification (with confidence)
- 🎭 Sentiment + Emotion (angry/frustrated/happy/confused)
- 🌐 Language Detection (formal Arabic / Saudi dialect / English / mixed)
- 📚 Knowledge Base Retrieval (RAG simulation — show which docs were retrieved)
- 🛠 Tool Selection (which functions Gemini decided to call)
- ✍️ Response Drafting (streaming)
- 🚦 Escalation Decision (auto-resolve / human review / urgent)

PANEL 3 — Customer-Facing Reply (right)
- Rendered as actual WhatsApp/chat bubble UI for realism
- Shows typing indicator, then response
- Suggested quick replies for the customer
- Multi-turn: continue conversation

## Function Calling Tools (Gemini)
- `check_order_status(order_id)` — mock CRM
- `process_refund(order_id, reason)` — needs human approval flag
- `book_appointment(service, date)`
- `escalate_to_human(reason, priority)`
- `update_customer_record(field, value)`
- `search_kb(query)` — returns top-3 KB articles

## Sandbox: Multi-Day Conversation Replay
Load a fake customer who messaged 8 times over 2 weeks. AI summarizes the journey, identifies friction points, recommends process improvements.

## Manager Analytics Tab
- CSAT prediction per conversation
- Avg handle time saved
- First-contact resolution rate
- Sentiment trend over time
- Topic clusters (what are people complaining about most)
- Auto-generated weekly exec summary

## Schema for Each Reply
{
  intent: classified_intent,
  intent_confidence: 0-1,
  sentiment: {polarity: -1 to 1, emotion: enum},
  language: detected,
  dialect: msa|saudi|gulf|egyptian|levantine,
  retrieved_kb_articles: [],
  tools_called: [],
  response_text: string,
  suggested_quick_replies: string[],
  escalation: {required: bool, reason, priority, suggested_team},
  csat_prediction: 1-5,
  handling_time_estimate_seconds: number
}

## Critical Feature: Saudi Dialect Mastery
System prompt explicitly trains Gemini to:
- Understand "ودي / أبغى / يمديك / ما عاد / محد رد علي" naturally
- Reply in MATCHING register (formal if customer formal, friendly Saudi if customer casual)
- Use appropriate honorifics (أستاذ / أبو فلان / أخوي)
- Handle code-switching (Arabic-English mid-sentence)

## Channels Showcase
WhatsApp Business API, Unifonic, Salla, Zid, Bayan, integrations with Zendesk/Freshdesk/HubSpot.

## Removals
Generic page = totally useless for showing real value. Rebuild with the inbox simulator as core.

OUTPUT: Brief + code + Gemini system prompt + KB sample (20 articles) + 8 customer conversation scenarios + dialect training examples.
```

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
