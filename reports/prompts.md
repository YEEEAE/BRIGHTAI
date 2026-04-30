
# MASTER PROMPT — BrightAI Demo Suite (World-Class Rebuild)

## 🎯 الهدف الاستراتيجي

أنت Senior Full-Stack AI Engineer + Product Designer مكلّف ببناء **أفضل مجموعة صفحات Demo تفاعلية بالشرق الأوسط** لشركة Bright AI (brightai.site). الهدف: تحويل الزائر من فضولي → مشترٍ خلال أقل من 90 ثانية، عبر تجربة AI حقيقية مدعومة بـ **Google Gemini API** بالكامل.

المرجع المعياري (Benchmark): مستوى ade.com, vercel.com/ai, anthropic.com/claude, openai.com/playground, runwayml.com.

---

## 🧱 المسارات المطلوب إعادة بنائها (8 ديموهات)

| # | المسار                                             | اسم النظام                          | المحرك (Gemini Use-case)                                                         |
| - | -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| 1 | `/demo/smart-hiring-system/` (interview/)              | نظام التوظيف الذكي           | CV Parsing + Job Matching + Interview Q-Generation (Gemini 2.5 Pro + Function Calling) |
| 2 | `/demo/smart-medical-archive/` (mart-medical-archive/) | الأرشيف الطبي الذكي         | OCR + Medical Entity Extraction + Semantic Search (Gemini Vision + Embeddings)         |
| 3 | `/demo/data-analyzer/` (try/data-analyzer/)            | منصة البيانات الموحدة     | CSV/Excel Analysis + Auto-Charts + Insights (Gemini + Code Execution)                  |
| 4 | `/demo/ai-scolecs/`                                    | المنصة التعليمية الذكية | Lesson Gen + Auto-Quiz + Performance Analysis (Gemini 2.5 + Structured Output)         |
| 5 | `/demo/smart-hospital-management/` (health/)           | إدارة المستشفيات الذكية | KPI Dashboard + Decision Support + Predictive Alerts (Gemini Reasoning)                |
| 6 | `/demo/ocr-demo/`                                      | أتمتة الوثائق (OCR)              | Document Classification + Field Extraction (Gemini Vision Multimodal)                  |
| 7 | `/demo/ai-bots/BrightSupport/`                         | بوت دعم العملاء                 | Multi-channel Chat + Sentiment + Auto-escalation (Gemini Live API)                     |
| 8 | `/demo/marketing-automation/`                          | أتمتة التسويق                    | Content Gen + Scheduler + Audience Targeting (Gemini + Imagen 3)                       |
| 9 | `/demo/supply-chain/`                                  | تحسين سلسلة التوريد         | Demand Forecasting + Auto-reorder + Optimization (Gemini + Time-series)                |

---

## 🏗️ الهيكل التقني الموحد (Tech Stack Standard)

### Frontend

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript strict
- **Styling**: TailwindCSS 4 + shadcn/ui + Framer Motion
- **RTL**: دعم كامل من البداية (`dir="rtl"`, خط IBM Plex Sans Arabic أو Tajawal)
- **State**: Zustand + TanStack Query
- **Charts**: Recharts + Tremor + ApexCharts (للوحات الطبية والمالية)
- **Animations**: Framer Motion + GSAP للانتقالات السينمائية
- **Streaming UI**: Vercel AI SDK (`useChat`, `useCompletion`, `streamText`)

### Backend (Edge-first)

- **Runtime**: Next.js Route Handlers على Vercel Edge / Cloudflare Workers
- **AI Provider**: `@google/generative-ai` + `@ai-sdk/google` (Gemini 2.5 Pro / Flash / Flash-Lite)
- **Models Routing**:
  - `gemini-2.5-pro` → التحليل العميق (طبي، توظيف، عقود)
  - `gemini-2.5-flash` → التفاعل السريع (شات، تلخيص)
  - `gemini-2.5-flash-lite` → الـ classification الفوري
  - `gemini-embedding-001` → البحث الدلالي
  - `imagen-4` → التسويق البصري (اختياري)

### Security & Governance (إلزامي)

- **API Keys**: في Server-side فقط، عبر `process.env.GEMINI_API_KEY`
- **Rate Limiting**: Upstash Redis (10 طلبات/دقيقة لكل IP)
- **Input Sanitization**: Zod schemas + DOMPurify
- **PII Guard**: regex middleware يمنع رفع أرقام هوية/بطاقات
- **Audit Log**: تسجيل كل طلب (بدون محتوى) لـ Vercel Analytics
- **Content Safety**: Gemini Safety Settings = BLOCK_MEDIUM_AND_ABOVE
- **No Storage**: لا حفظ مدخلات المستخدم في الديمو العام

---

## 🎨 معايير التصميم العالمي (Design DNA)

### نظام بصري موحد

- **Palette**:
  - Primary: `#0A2540` (Bright Navy)
  - Accent: `#00D4AA` (Saudi Teal) + `#FFB800` (Vision Gold)
  - Neutrals: Zinc scale من shadcn
- **Dark Mode**: افتراضي + Toggle سلس
- **Typography**:
  - عناوين: Tajawal Bold (عربي) / Inter (إنجليزي)
  - متن: IBM Plex Sans Arabic
  - أرقام: tabular-nums + JetBrains Mono للكود
- **Glassmorphism + Neon Grid backgrounds** للأقسام الـ "AI Live"
- **Micro-interactions**: hover, focus rings, skeleton loaders, optimistic UI
- **Sound Design** (اختياري): نغمة خفيفة عند انتهاء التحليل

### Layout قياسي لكل ديمو (Hero → Try → Convert)

```
┌─────────────────────────────────────────┐
│ [Sticky Nav] BrightAI · Demos · WhatsApp│
├─────────────────────────────────────────┤
│ HERO (above fold)                       │
│  • H1 + sub + لايف ميتركس عدّاد         │
│  • زر "جرّب الآن" + فيديو 8 ثواني loop  │
├─────────────────────────────────────────┤
│ ⚡ THE PLAYGROUND (القلب — 70% الأهمية) │
│  • Tabs: سيناريوهات جاهزة + رفع ملفك    │
│  • Input panel (يسار) ← Output (يمين)   │
│  • Streaming response + animated charts │
│  • زر "تحميل التقرير PDF"               │
├─────────────────────────────────────────┤
│ 📊 BEFORE/AFTER + ROI CALCULATOR        │
│  • سلايدر: عدد الموظفين/الملفات/العملاء │
│  • نتيجة فورية: التوفير بالريال + الوقت │
├─────────────────────────────────────────┤
│ 🏆 SOCIAL PROOF (شعارات + أرقام)        │
├─────────────────────────────────────────┤
│ 🔌 INTEGRATIONS (HRMS/SAP/Oracle/...)   │
├─────────────────────────────────────────┤
│ ❓ FAQ (Schema.org markup)              │
├─────────────────────────────────────────┤
│ 🎯 STICKY CTA: واتساب + احجز عرض        │
└─────────────────────────────────────────┘
```

---

## 🤖 مواصفات كل ديمو بالتفصيل

### 1️⃣ نظام التوظيف الذكي (`/demo/smart-hiring-system/`)

**التفاعل الحقيقي:**

- نموذج input: لصق وصف وظيفة + لصق/رفع PDF سيرة ذاتية
- زر "جرّب بسيناريو جاهز" (3 سيناريوهات: مطور، مدير عمليات، محاسب)
- **Gemini Call**: `gemini-2.5-pro` مع Function Calling + Structured Output (Zod schema)
- **Output الحي (Streaming)**:
  - مؤشر مطابقة دائري (0-100%) متحرك
  - 5 مهارات مطابقة + 3 فجوات
  - 7 أسئلة مقابلة مولّدة بناءً على الفجوات
  - تقرير مخاطر (Bias check + سنوات خبرة + مصداقية)
  - زر تصدير PDF عربي RTL (react-pdf + arabic font)
- **Wow factor**: مقارنة جنباً إلى جنب لـ 3 مرشحين دفعة واحدة

### 2️⃣ الأرشيف الطبي الذكي (`/demo/smart-medical-archive/`)

**التفاعل:**

- رفع صورة وصفة طبية / تقرير أشعة (يوجد عينات جاهزة)
- **Gemini Vision Multimodal**: استخراج التشخيص + الأدوية + الجرعات
- **Semantic Search Bar**: "ابحث عن مرضى السكري بضغط مرتفع آخر 30 يوم"
- **Output**:
  - بطاقة مريض مولّدة + Timeline سريري
  - تنبيهات تفاعل دوائي (Drug-drug interaction)
  - HL7/FHIR JSON preview قابل للنسخ
- **Compliance Badge**: PDPL + HIPAA-ready (واضح جداً)

### 3️⃣ منصة تحليل البيانات (`/demo/data-analyzer/`)

**التفاعل:**

- رفع CSV/Excel (حتى 5MB) + Drag-drop + sample datasets (مبيعات، HR، شكاوى)
- **Gemini + Code Execution Tool**: يولّد كود Python يحلل البيانات فعلياً
- **Output Streaming**:
  - 3-5 رسوم بيانية تفاعلية (Recharts) تظهر تباعاً
  - Insights bullets بالعربي (5 رؤى رئيسية)
  - Anomalies detection
  - زر "اسأل بياناتك" → Chat-with-your-data
- **Wow factor**: تحليل sentiment للنصوص العربية في عمود تعليقات

### 4️⃣ المنصة التعليمية الذكية (`/demo/ai-scolecs/`)

**التفاعل:**

- 3 أوضاع: مدرس / طالب / مدير
- **مدرس**: أدخل موضوع → يولّد خطة درس + presentation outline + 10 أسئلة (MCQ + open)
- **طالب**: سؤال → شرح متدرج + أمثلة + اختبار قصير
- **مدير**: لوحة أداء طلاب وهمية مع تنبؤ بالطلاب المعرضين للتعثر
- **Gemini 2.5 Pro** مع structured output JSON Schema للأسئلة
- متوافق مع المنهج السعودي (mention vision 2030)

### 5️⃣ إدارة المستشفيات (`/demo/smart-hospital-management/`)

**التفاعل:**

- Live Dashboard فيه: إشغال أسرّة، طوابير الطوارئ، KPIs مالية
- زر "اسأل المساعد التنفيذي" → Gemini يحلل اللوحة ويعطي توصيات
- **Predictive widgets**: التنبؤ بالإشغال خلال 7 أيام
- **Decision Support**: سيناريو "نقص أطباء قسم الطوارئ يوم الجمعة" → Gemini يقترح 3 حلول

### 6️⃣ OCR & Document Automation (`/demo/ocr-demo/`)

**التفاعل:**

- Drag-drop فاتورة/عقد/هوية وطنية (عينات جاهزة + رفع المستخدم)
- **Gemini Vision** يستخرج: رقم، تاريخ، مبلغ، أطراف، بنود
- **Animated extraction**: bounding boxes تظهر على الصورة + الحقول تتعبأ animatedly
- **Output**: JSON منظم + CSV download + ERP-ready format
- **Multi-doc batch**: ارفع 5 وثائق وشاهد المعالجة المتوازية

### 7️⃣ BrightSupport Bot (`/demo/ai-bots/BrightSupport/`)

**التفاعل:**

- Chat widget عربي يحاكي WhatsApp UI
- **Gemini Live API / Streaming chat** بشخصية "نواف" خادم العملاء
- 3 سيناريوهات جاهزة: استفسار منتج، شكوى، طلب استرجاع
- **Sentiment meter** real-time (سعيد/محايد/غاضب)
- **Auto-escalation demo**: لما sentiment يصير سلبي → "تم تحويلك لموظف بشري"
- لوحة Admin مصغّرة تظهر بالـ split-view: تحليلات، CSAT score

### 8️⃣ أتمتة التسويق (`/demo/marketing-automation/`)

**التفاعل:**

- أدخل: اسم منتج + جمهور مستهدف + قناة (X/IG/LinkedIn/TikTok)
- **Gemini يولّد**: 5 منشورات بنبرة سعودية + hashtags + أوقات نشر مقترحة
- **Imagen 4** يولّد صورة مرفقة (اختياري)
- **Calendar view**: جدولة خلال 7 أيام + heatmap لأفضل أوقات
- **A/B variant generator** + توقع CTR

### 9️⃣ سلسلة التوريد (`/demo/supply-chain/`)

**التفاعل:**

- بيانات وهمية لـ 50 SKU + مخزون حالي + مبيعات 90 يوم
- **Gemini Reasoning**: تحليل الطلب + توقع نفاد + اقتراحات إعادة طلب
- Map view (مدن السعودية) للتوزيع الأمثل
- **Optimizer**: قبل/بعد بنسبة توفير محسوبة
- زر "محاكاة شهر رمضان" → يعدّل التوقعات تلقائياً

---

## 🧩 مكونات مشتركة (Shared Components Library)

أنشئ `/components/demo/` يحتوي:

- `<DemoHero />` — موحد لكل صفحة (props: title, kpis[], video)
- `<PlaygroundShell />` — Split layout input/output مع streaming
- `<GeminiStreamRenderer />` — يعرض tokens متدفقة بـ animation
- `<ROICalculator />` — قابل للتخصيص بالمتغيرات
- `<BeforeAfterSlider />` — مقارنة بصرية
- `<ScenarioPicker />` — اختيار سيناريو جاهز
- `<ExportPDFButton />` — تصدير عربي RTL
- `<TrustBar />` — NCA/SDAIA/NDMO/PDPL badges
- `<StickyMobileCTA />` — زر واتساب ثابت أسفل الجوال
- `<RateLimitGuard />` — يعرض رسالة لطيفة عند تجاوز الحد

---

## 📡 معيار استدعاء Gemini API (Template موحد)

```typescript
// /app/api/demo/[slug]/route.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ratelimit } from "@/lib/ratelimit";
import { z } from "zod";

const InputSchema = z.object({ /* per-demo schema */ });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  const { success } = await ratelimit.limit(ip);
  if (!success) return new Response("Rate limit", { status: 429 });

  const body = InputSchema.parse(await req.json());
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: `أنت محلل خبير لـ Bright AI. أجب بالعربية الفصحى المهنية. 
                       المخرج JSON فقط حسب الـ schema المرفق. 
                       لا تعطي قرارات نهائية، فقط توصيات قابلة للمراجعة البشرية.`,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: outputSchema, // per-demo
      temperature: 0.4,
    },
    safetySettings: [/* BLOCK_MEDIUM_AND_ABOVE all categories */],
  });

  const stream = await model.generateContentStream(body.prompt);
  return new Response(stream.toReadableStream());
}
```

---

## ✅ Acceptance Criteria (لكل ديمو)

- [ ] Time-to-first-token < 1.2 ثانية
- [ ] Lighthouse Performance ≥ 92, A11y = 100, SEO = 100
- [ ] Core Web Vitals كلها خضراء (LCP < 2s, INP < 200ms, CLS < 0.05)
- [ ] يعمل بلا JS للمحتوى الأساسي (SSR + Progressive Enhancement)
- [ ] RTL مثالي + اختبار على Safari iOS
- [ ] Schema.org markup: `SoftwareApplication` + `FAQPage` + `BreadcrumbList`
- [ ] Open Graph + Twitter Cards مع صورة مولّدة لكل ديمو
- [ ] يدعم Dark/Light + يحفظ تفضيل المستخدم
- [ ] لا errors في Console، لا warnings في React strict mode
- [ ] E2E test (Playwright) يغطي السيناريو الذهبي لكل ديمو
- [ ] Loading skeleton لكل قسم async
- [ ] Error boundary مع رسالة عربية ودودة + زر إعادة محاولة
- [ ] Fallback ذكي إذا Gemini API فشل (cached sample response)
- [ ] WhatsApp deep link مع رسالة prefilled مخصصة لكل ديمو
- [ ] تتبع تحليلي: Vercel Analytics + PostHog events (demo_started, demo_completed, cta_clicked)

---

## 🚀 ترتيب التنفيذ المقترح (Sprints)

**Sprint 1 (أسبوع):** البنية التحتية المشتركة + Design System + ديمو OCR (الأسهل، الأكثر بصرية).

**Sprint 2 (أسبوع):** ديمو التوظيف + ديمو تحليل البيانات.

**Sprint 3 (أسبوع):** ديمو الطبي + ديمو المستشفى.

**Sprint 4 (أسبوع):** ديمو التعليم + ديمو الدعم (BrightSupport).

**Sprint 5 (أسبوع):** ديمو التسويق + ديمو سلسلة التوريد + QA شامل + Launch.

---

## 🎬 طلبي النهائي

ابدأ الآن بـ:

1. توليد بنية المجلدات الكاملة (tree).
2. إنشاء `package.json` + `tsconfig.json` + `tailwind.config.ts` + `next.config.mjs`.
3. تطبيق Design System (`globals.css` + `theme.ts` + ألوان + خطوط عربية).
4. بناء `<PlaygroundShell />` و `<GeminiStreamRenderer />` كـ proof-of-concept.
5. تنفيذ **ديمو OCR كاملاً** (drag-drop → Gemini Vision → animated extraction → PDF export) كنموذج مرجعي للبقية.

اكتب الكود **production-ready**, مع تعليقات عربية شارحة عند المنطق المعقد، والتزم بـ ESLint strict + Prettier. لا تختصر، لا placeholders، لا "TODO". الكود اللي تكتبه هو اللي بيشتغل في الإنتاج.

**الجودة المستهدفة: لو قارنّاها بـ vercel.com/ai أو anthropic.com/claude، يجب أن تتفوق عليها في تجربة المستخدم العربي.**
