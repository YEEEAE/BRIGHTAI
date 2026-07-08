

---

### 📌 البرومبت #2 — تدقيق SEO عميق واستخراج الفرص

```plaintext
أنت وكيل SEO تقني متخصص في السوق السعودي. اقرأ semrush/KEYWORD-REPORT.md و semrush/TOPICAL-AUTHORITY-PLAN.md قبل البدء. تكلم بالعامية السعودية.

المهمة: دقّق SEO الحالي واستخرج كل فرصة زيارة ضائعة.

المحور 1 — Indexing Audit:
1. افتح كل صفحة في sitemap.xml (152 URL) وتحقق:
   - Title (< 60 حرف عربي أو 55 English)
   - Meta description (< 155 حرف)
   - Canonical صحيح (self-canonical + trailing slash)
   - h1 واحد فقط
   - JSON-LD صحيح (استخدم Google Rich Results Test)
2. اكتشف الصفحات اليتيمة (لا روابط داخلية إليها) عبر:
   npm run internal-links:audit
3. تحقق من hreflang: كل صفحة عربية لها مقابل إنجليزي؟

المحور 2 — Keyword Opportunities:
من KEYWORD-REPORT، لدينا 5 كلمات أساس + 10 موسّعة.
لكل كلمة، تحقق:
- هل الصفحة المستهدفة موجودة فعلاً؟
- هل الكلمة في: title, h1, first paragraph, url slug, alt text, internal anchors?
- كم مقالاً داخلياً يشير إليها بنص ربط (anchor) مناسب؟

المحور 3 — Content Gaps (يجب إنشاؤها):
حسب TOPICAL-AUTHORITY-PLAN، هذي المقالات المطلوبة:
عنقود PDPL:
- عقوبات نظام حماية البيانات الشخصية
- اللائحة التنفيذية PDPL
- نقل البيانات خارج السعودية والذكاء الاصطناعي
- ChatGPT والبيانات الشخصية (يستفيد من 5,400 حجم شهري)
عنقود ECC:
- ضوابط الأمن السيبراني ECC: القائمة الكاملة
- خارطة ربط ECC بأنظمة AI
عنقود سدايا:
- دليل الجهات التنظيمية السعودية (سدايا، NCA، ساما، NDMO)
- مكتب إدارة البيانات الوطنية NDMO
- أخلاقيات AI: مبادئ سدايا السبعة
عنقود ISO:
- ISO 27001 vs ISO 42001 (يجسر من 1,300 حجم شهري)
- خطوات الحصول على ISO 42001 في السعودية

المخرجات:
1. جدول أولويات: [الصفحة/الكلمة] | [الفجوة] | [الأثر المقدّر] | [P0/P1/P2]
2. قائمة تنفيذية بـ 12 مقال جديد مطلوب مع outline لكل واحد
3. خطة Internal Linking: أي anchor من أي صفحة لأي صفحة
4. تقرير AEO (Answer Engine Optimization) — 20 سؤال يحتاج ظهور في Google SGE + Perplexity

استخدم Google Search Console + Ahrefs (لو متاح) للتحقق من CTR الحالي.
لا تقترح أي تكتيك spam.
```

---

## 🎨 المرحلة 2 — إعادة التصميم الفاخر (أسبوع)

### 📌 البرومبت #3 — إعادة تصميم فاخرة (Premium Re-skin)

```plaintext
أنت مصمم/مطوّر Astro خبير في التصميم العربي RTL الفاخر (Enterprise-grade).
اقرأ src/data/site.ts و src/layouts/BaseLayout.astro و src/styles/tokens.css قبل البدء.
تكلم بالعامية السعودية.

المهمة: أعد تصميم واجهة BrightAI بمستوى Stripe/Linear/Vercel السعودي، بدون تغيير أي محتوى أو ترتيب أقسام.

الفلسفة البصرية المستهدفة:
- Dark Enterprise Premium (مثل Vercel/Linear/Cursor)
- خلفية داكنة معمّقة #060914 مع gradient خفيف teal→cyan
- نص أساسي #e6edf7 (لبن مخفف، مو أبيض ثلجي)
- Accent واحد فقط: cyan #22d3ee للـ interactive
- 5 ألوان كحد أقصى، ممنوع البنفسجي إلا كما في المرجع
- خطوط: IBM Plex Sans Arabic للعربي، Inter للإنجليزي (خطين فقط)

نظام مكوّنات موحّد (unified components):
1. Glass Card: background: rgba(255,255,255,0.03) + backdrop-filter: blur(10px) + border: 1px solid rgba(255,255,255,0.08)
2. Button Primary: خلفية cyan + hover cyan-darker + focus ring
3. Button Ghost: transparent + border cyan
4. Section Header: كل قسم يبدأ بـ eyebrow (small caps) + h2 + description
5. Feature Card: icon 24px + h3 + description + optional link
6. Testimonial Card: quote + author + role + logo
7. Stat Card: number huge + label small + trend arrow

Micro-interactions (كلها CSS-only، ما يُسمح بـ JS animations):
- Hover: transform: translateY(-2px) + shadow زيادة
- Focus: outline: 2px solid cyan + offset 4px
- Transitions: 200ms ease لكل شي
- Respect prefers-reduced-motion: reduce

الشبكة (Grid System):
- Container max-width: 1280px (لا 1440، الشاشات السعودية أغلبها 14")
- Section padding: 96px vertical, 24px horizontal (mobile: 64px / 16px)
- Column gap: 24px (mobile: 16px)

نطاق العمل (كل الصفحات):
1. src/pages/index.astro (Home — أهم صفحة)
2. src/pages/solutions/index.astro + كل [sector]
3. src/pages/services/index.astro
4. src/pages/kernel/* (كل الـ 12 صفحة)
5. src/pages/pricing/index.astro
6. src/pages/about/index.astro
7. src/pages/contact/index.astro
8. src/pages/demo/index.astro
9. src/pages/trust/index.astro
10. src/pages/blog/[...slug].astro + src/pages/blog/index.astro
11. src/pages/docs/[...slug].astro + src/pages/docs/index.astro
12. src/layouts/* (كل الـ 6 layouts)
13. src/components/{Header, Footer, MobileNav, SplitHero, ...}

الميزة الفارقة (الـ Wow Factor):
- Homepage Hero: chip rotation animation (CSS) يعرض الأنظمة السعودية: PDPL, NCA ECC, SDAIA, SFDA, SAMA
- Interactive Compliance Radar: SVG animated يعرض تغطية الحزم (6 حزم)
- Kernel Dashboard mockup في Home: live streaming numbers (CSS counter animation)
- Trust Bar: شعارات مسطحة للأنظمة السعودية (grayscale + hover color)
- Sticky CTA on scroll: "اطلب ديمو" (mobile) + WhatsApp float

قيود مطلقة (Non-Negotiables):
❌ لا Tailwind (المشروع رفضها)
❌ لا framer-motion / gsap / anime.js / Three.js / Spline / Lottie
❌ لا iconify — استخدم <svg><use href="/icons.svg#mdi-*"/></svg>
❌ لا inline styles في .astro
❌ لا !important إلا في overrides نادرة
❌ لا transition: all — حدّد property
❌ لا تغيير أي نص، قسم، ترتيب، لينك
✅ Mobile-first، RTL 100%، Vanilla CSS + tokens

طريقة التنفيذ:
1. Sequential Thinking: رتّب المهام (Base tokens → Components → Pages → Kernel)
2. عدّل tokens.css أولاً (بذور التصميم)
3. عدّل BaseLayout ثم Header/Footer (يأثر على 100+ صفحة)
4. صفحة صفحة: قبل/بعد screenshot بـ Playwright
5. بعد كل صفحة: تحقق النصوص لم تتغيّر (diff)
6. npm run build + npm run performance:budget بعد كل marker
7. تقرير نهائي في report/2026-XX-XX-premium-redesign.md
```

---

## 🔥 المرحلة 3 — بناء SaaS Backend حقيقي (6 أسابيع)

### 📌 البرومبت #4 — تصميم Architecture الـ Backend

```plaintext
أنت Software Architect خبير في بناء SaaS متعدد المستأجرين (multi-tenant) للسوق السعودي.
تكلم بالعامية السعودية.

المهمة: صمّم architecture كامل لتحويل BrightAI من Marketing Site إلى SaaS منتج.

المتطلبات الأساسية:
1. Multi-tenant (كل شركة عميلة معزولة تماماً)
2. مستضاف داخل السعودية (STC Cloud / Salam Cloud / AWS Bahrain) — لا يخرج data خارج المملكة
3. متوافق مع PDPL + NCA ECC 2-2024
4. يدعم 3 أوضاع نشر: Cloud، Hybrid، Air-Gapped
5. جاهز للتوسّع لـ 10,000 مستخدم/شركة
6. RTL + عربي كامل + إشعارات واتساب + SMS محلي

Stack المقترح (اقترح أنت البدائل بمقارنة صريحة):
- Frontend: Next.js 15 (App Router) للـ Dashboard المنفصل، مع الحفاظ على Astro للـ Marketing
  البديل: SvelteKit؟ Solid؟ قارن.
- Backend API: Node.js 22 + Fastify + tRPC/GraphQL
  البديل: Elixir/Phoenix؟ Go/Fiber؟ قارن.
- Database: PostgreSQL 16 + Row-Level Security للـ multi-tenant
- ORM: Prisma أو Drizzle
- Cache: Redis 7 (rate limiting + session + queue)
- Queue: BullMQ للـ background jobs (audit trail processing, PDF generation)
- Storage: S3-compatible داخل السعودية (Salam Object Storage)
- Search: Meilisearch (خفيف وعربي جيد) — للـ Audit Trail search
- Auth: Clerk (سريع) أو Supabase Auth (مفتوح) أو WorkOS (Enterprise SSO)
- Payments: Tap Payments (السعودية) + Stripe (International)
- Email: Resend + SendGrid backup
- WhatsApp Business API: Meta Cloud API مباشر أو Twilio
- Observability: Sentry + Grafana + Loki
- CI/CD: GitHub Actions + Vercel (Marketing) + Railway/Fly.io (Backend)

النموذج البياني الأساسي (Data Model):
Organizations → Users → Roles (RBAC) → Policies → Requests (AI Prompts) →
  → Guardrails Results → Approvals → Audit Events → Evidence Files

الميزات الحرجة:
1. AI Firewall Engine (النواة الفعلية):
   - PII Redaction (regex + NER عربي)
   - Prompt Injection Detection
   - PDPL/NCA Compliance Rules Engine
   - Multi-model routing (OpenAI, Anthropic, Google, ALLaM)
   - Response Filtering + Logging

2. Audit Trail Immutable:
   - Every AI request logged with hash chain (Blockchain-like)
   - Retention 7 years (متطلب SAMA)
   - Full-text search بالعربي
   - Export to PDF signed

3. Human Approval Workflow:
   - Escalation matrix per risk level
   - WhatsApp/Email notification
   - SLA tracking
   - Delegation support

4. Compliance Reports:
   - PDPL Report (auto-generated monthly)
   - NCA ECC Compliance Dashboard
   - Custom regulator exports

5. Multi-tenancy:
   - Subdomain per tenant (acme.brightai.site)
   - Custom branding (white-label option)
   - Data isolation via RLS
   - Regional deployment (Cloud/On-Prem)

المخرجات المطلوبة:
1. Architecture Diagram (Mermaid diagram في Markdown)
2. مقارنة Stack options مع pros/cons لكل خيار
3. Database Schema كامل (Prisma schema أو SQL)
4. API Endpoints Inventory (REST + WebSocket)
5. Security Threat Model (OWASP Top 10 + PDPL specific)
6. Deployment Diagram لـ 3 modes (Cloud/Hybrid/Air-gapped)
7. Cost Estimation (شهري بـ SAR — 100/500/1000 مستخدم)
8. خطة تنفيذ 6 أسابيع (Sprint by Sprint)
9. Migration Plan من الحالي (mock) إلى الحقيقي بدون كسر SEO

قيود:
- لازم كل شيء يقدر يشتغل offline في وضع Air-Gapped
- لا تعتمد على أي خدمة SaaS خارج السعودية إلا لو ضروري
- شفافية كاملة عن التكلفة والتعقيد
- لو مافيه حل واضح، قدّم 3 خيارات مع توصيتك ولا تخترع
```

---

### 📌 البرومبت #5 — تنفيذ Auth + Multi-tenancy

```plaintext
أنت مطوّر Backend خبير. مشروع BrightAI SaaS.

المهمة: نفّذ نظام مصادقة كامل + Multi-tenancy لـ BrightAI.

Stack المعتمد:
- Next.js 15 (App Router) — dashboard app منفصل في /apps/dashboard/
- Clerk Auth (مع دعم OAuth: Google, Microsoft, GitHub + Passkeys)
- PostgreSQL 16 + Prisma
- Row-Level Security (RLS) للـ tenant isolation
- Redis للـ sessions
- @tanstack/react-query للـ data fetching

المطلوب تنفيذه:

1. Auth Flow كامل:
   - Sign Up (Company + Owner user في نفس الخطوة)
   - Sign In (email + password + OAuth + Passkey)
   - Password Reset
   - Email Verification (SendGrid + custom Arabic templates)
   - 2FA (Authenticator app + SMS via Unifonic السعودية)
   - Session Management (device list + revoke)
   - Impersonation للـ support (audit-logged)

2. Multi-tenant Model:
   - كل Organization = tenant
   - subdomain routing: acme.brightai.site
   - Custom domain support (client.com → CNAME)
   - Tenant switcher (لو المستخدم في عدة organizations)

3. RBAC (5 roles):
   - Owner (كل الصلاحيات + billing)
   - Admin (كل شي عدا billing)
   - Compliance Officer (audit + reports + approvals)
   - Reviewer (approvals فقط)
   - Member (استخدام AI فقط)

4. Team Management UI:
   - Invite by email (24h expiry)
   - Bulk invite (CSV)
   - Role management
   - Deactivate/Reactivate
   - Audit log لكل تغيير صلاحية

5. Onboarding Flow (5 خطوات):
   - Step 1: Organization info (name, size, industry, CR number)
   - Step 2: Compliance profile (PDPL/NCA/SFDA/SAMA — اختيار متعدد)
   - Step 3: Team invites
   - Step 4: Choose deployment mode (Cloud/Hybrid/Air-Gapped)
   - Step 5: Connect first integration (SharePoint/Slack/Teams/Custom)
   - Progress saved، يقدر يكمل لاحق

Prisma Schema (المطلوب):

model Organization {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  nameAr       String
  crNumber     String?  @unique
  industry     Industry
  size         Size
  deployment   Deployment @default(CLOUD)
  compliance   Compliance[]
  users        Membership[]
  policies     Policy[]
  requests     Request[]
  createdAt    DateTime @default(now())
  // ... complete this
}

model Membership {
  id             String @id @default(cuid())
  organizationId String
  userId         String
  role           Role
  // ... complete this
}
// أكمل الباقي حسب المتطلبات

Files structure:
apps/
├── marketing/         (الحالي Astro — يبقى كما هو)
├── dashboard/         (Next.js 15 جديد)
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (onboarding)/
│   │   ├── (app)/
│   │   ├── (settings)/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   └── prisma/
packages/
├── db/                (Prisma shared)
├── ui/                (design system مشترك)
└── config/            (env, constants)

الاختبارات المطلوبة:
- Vitest للـ unit tests
- Playwright للـ e2e (سيناريو كامل: signup → invite → policy → request → approval)
- ≥80% coverage للـ auth code

الأمان:
- Rate limiting (Redis + upstash-ratelimit): 5 login attempts/15min
- CSRF protection على كل mutation
- Password: bcrypt + min 12 chars
- Session cookies: httpOnly + Secure + SameSite=Lax
- Audit log لكل login/logout/permission-change
- PDPL: data export + deletion endpoints جاهزة

المخرجات:
1. الكود كامل بـ TypeScript strict
2. README.md بالسعودي يشرح كل شيء
3. Docker Compose للـ local dev
4. Migration scripts + seed data
5. Postman collection للـ endpoints
6. تقرير security review

ابدأ بـ Sequential Thinking للـ dependencies قبل الكود.
```

---

### 📌 البرومبت #6 — بناء AI Firewall Engine الفعلي

```plaintext
أنت ML/Security Engineer خبير في بناء AI Guardrails. مشروع BrightAI.

المهمة: ابنِ AI Firewall Engine حقيقي (ليس mock) يفحص كل طلب AI ويطبّق حماية PDPL/NCA.

الهدف: كل prompt يمر بـ 5 طبقات فحص قبل ما يوصل للـ LLM:
Prompt → Layer 1 (PII Detect) → Layer 2 (Injection Detect) → Layer 3 (Policy Check) →
       → Layer 4 (Risk Scoring) → Layer 5 (Compliance Rules) → LLM → Response Filter → User

Stack:
- Fastify (Node.js 22) — API gateway
- Redis Streams — request queue
- BullMQ — async processing
- @xenova/transformers — عربي NER محلي (لا نرسل بيانات خارج)
- Presidio (Microsoft) — PII detection (fork عربي مخصص)
- Regex library — SA IDs, IBAN, phone numbers, plate numbers
- ClickHouse — audit log storage (super fast for analytics)

Layer 1 — PII Detection & Redaction:
اكتشف واحذف/استبدل تلقائياً:
- الهوية الوطنية السعودية (10 أرقام تبدأ بـ 1 أو 2)
- الإقامة (10 أرقام تبدأ بـ 3 أو 4 حتى 8)
- IBAN السعودي (SA + 22 chars)
- رقم جوال (+966 5X XXX XXXX أو 05XXXXXXXX)
- بريد إلكتروني (regex قياسي)
- لوحة سيارة سعودية
- عنوان وطني (كود من 8 أرقام)
- رقم سجل تجاري
- تواريخ ميلاد (بأشكال متعددة)
- أسماء عربية (NER model محلي)

خيارات الاستبدال:
- Redact: استبدال كامل بـ [REDACTED]
- Mask: عرض جزئي (السعودية: 1********0)
- Tokenize: استبدال بـ token يقدر يُفكّ في مكان آمن
- Block: رفض الطلب بالكامل

Layer 2 — Prompt Injection Detection:
- كشف أنماط الـ jailbreak (DAN, "ignore previous instructions", إلخ)
- كشف محاولات استخراج system prompt
- كشف encoding attacks (base64, hex, unicode tricks)
- كشف role-play attacks
- Model-based classifier محلي (small BERT عربي)

Layer 3 — Policy Enforcement:
كل شركة تعرّف policies خاصة بها:
- Allowed models (GPT-4, Claude, Gemini, ALLaM)
- Max tokens per request/day/month per user
- Blocked topics (finance advice, legal advice, medical diagnosis)
- Allowed data classes (Public, Internal, Confidential, Restricted)
- Working hours restrictions
- Geographic restrictions (IP-based)

Layer 4 — Risk Scoring:
حساب risk score من 0-100 لكل طلب:
- Data sensitivity: 40%
- User role: 20%
- Model choice: 15%
- Topic risk: 15%
- Historical behavior: 10%
حسب الـ score:
- 0-30: Auto-approve
- 31-70: Log + Continue
- 71-90: Require human approval
- 91-100: Block

Layer 5 — Compliance Rules Engine:
Rules engine قابل للتوسّع (JSON DSL):
{
  "id": "pdpl-personal-data",
  "when": {"contains_pii": true, "destination": "external_llm"},
  "then": {"action": "block", "reason": "PDPL violation"}
}
حزم rules جاهزة: PDPL Pack, NCA ECC Pack, SFDA Pack, SAMA Pack, ISO 42001 Pack.

Response Filter:
- إخفاء أي PII سرّبه الـ LLM في الرد
- كشف Hallucinations في الأرقام السعودية (تواريخ، أنظمة)
- ترجمة تلقائية للردود لو المستخدم عربي والـ LLM ردّ إنجليزي

Audit Logging (كل شي مسجّل):
- Request ID + Timestamp + User + Org
- Prompt الأصلي (encrypted at rest)
- Prompt بعد Redaction
- Risk score + Layer results
- LLM used + Tokens + Cost
- Response الأصلي + Response بعد Filter
- Human approval status (لو انطبق)
- Hash of previous event (blockchain-style chain)

Performance Targets:
- Latency: < 100ms overhead (99th percentile)
- Throughput: 1,000 req/sec per instance
- Availability: 99.9%

API Endpoints:
POST /v1/chat/completions (متوافق مع OpenAI API — drop-in replacement)
POST /v1/embeddings
POST /v1/redact (فقط redaction بدون LLM)
POST /v1/classify (risk scoring بدون LLM)
GET  /v1/policies
POST /v1/policies
GET  /v1/audit
GET  /v1/audit/export?format=pdf&signed=true

SDK:
- @brightai/sdk (Node.js + Python + Java + .NET)
- OpenAI SDK compatible (change base_url only)

المطلوب:
1. الكود كامل مع اختبارات (Vitest + integration tests)
2. Load testing report (k6 scripts)
3. Security audit report (تحليل ثغرات محتملة)
4. Deployment guides لـ 3 modes
5. توثيق SDK بالعربي والإنجليزي
6. Demo videos لكل layer

قيود:
- لا يخرج أي بيانات خارج السعودية إلا لو Cloud mode وطلب المستخدم
- كل الـ models تشتغل offline في Air-Gapped mode (ONNX runtime)
- Open-source الطبقات 1+2 (community edition) — الباقي enterprise
```

---

## 💰 المرحلة 4 — التحويل والإيرادات (أسبوع)

### 📌 البرومبت #7 — Billing + Subscription System

```plaintext
أنت مطوّر SaaS خبير في billing. مشروع BrightAI.

المهمة: نفّذ نظام billing كامل لـ SaaS متعدد المستأجرين.

Stack:
- Tap Payments (السعودية + مدى + KNET + STC Pay + Apple Pay)
- Stripe (International + USD/EUR)
- Prisma models للـ subscriptions + invoices
- Webhooks handlers robust
- Zoho Books / QuickBooks integration للـ ZATCA e-invoicing (متطلب سعودي)

الباقات (Pricing Tiers):

Tier 1 — Starter (2,500 SAR/شهر):
- حتى 10 مستخدمين
- 50,000 AI requests/شهر
- PDPL Pack فقط
- Cloud deployment
- Community support
- Audit retention: 90 يوم

Tier 2 — Business (7,500 SAR/شهر):
- حتى 50 مستخدم
- 250,000 AI requests/شهر
- PDPL + NCA ECC Packs
- Cloud + Hybrid
- Priority support (24 ساعة SLA)
- Audit retention: 1 سنة
- Custom branding

Tier 3 — Enterprise (Custom — يبدأ من 25,000 SAR/شهر):
- Unlimited users
- Unlimited requests (fair use)
- كل الـ compliance packs
- Cloud + Hybrid + Air-Gapped
- Dedicated support (4 ساعات SLA)
- Audit retention: 7 سنوات
- White-label + custom domain
- SSO (SAML, OIDC)
- Custom SLA
- Dedicated CSM

Tier 4 — Government (Custom):
- Air-Gapped فقط
- على premises في مقر الجهة
- تدريب + certification
- On-site engineer
- Tender-friendly pricing

المطلوب تنفيذه:

1. Pricing Page (in Astro marketing site):
   - Interactive pricing table
   - Sliders لـ users + requests
   - Compliance packs selector
   - Automatic quote calculator
   - "احصل على عرض سعر" CTA (يفتح wizard)
   - ROI Calculator: كم توفر عند تطبيق BrightAI

2. Checkout Flow (في dashboard):
   - Company info (with CR number verification via Wathq API)
   - Billing address (VAT ID لو موجود)
   - Payment method (Mada, Visa, MC, STC Pay, Apple Pay, Bank Transfer)
   - Terms acceptance (DPA + PDPL consent)
   - Immediate access بعد الدفع

3. Subscription Management:
   - Upgrade/Downgrade (proration محسوبة)
   - Pause subscription (حتى 90 يوم)
   - Cancel (immediate أو end of period)
   - Reactivate (بدون فقد للـ data)

4. Invoicing (ZATCA compliant):
   - E-invoice XML + PDF بشعار الشركة
   - QR code للتحقق (ZATCA phase 2)
   - Auto-submit لـ ZATCA (Fatoora integration)
   - Send to customer email + WhatsApp
   - Payment reminders (7d, 3d, 1d قبل الاستحقاق)

5. Usage Metering:
   - Real-time counter للـ requests + tokens + storage
   - Alerts عند 80% + 100% من الـ limit
   - Overage handling (auto-upgrade أو throttle)
   - Monthly usage report (PDF)

6. Trial + Freemium:
   - 14-day free trial (لا credit card)
   - Freemium tier: 1 user + 1,000 requests/شهر + PDPL Pack
   - Trial conversion emails (day 1, 7, 12, 14)

7. Enterprise Sales Flow:
   - "Contact Sales" button
   - Salesforce/HubSpot integration
   - Auto-scheduling عبر Cal.com بالسعودي
   - Custom quote generator
   - Contract e-sign (DocuSign)

8. Referral Program:
   - كل عميل يحصل على رابط referral
   - 20% commission لأول 3 شهور
   - Dashboard للـ tracking

9. Reseller Portal:
   - شركاء تقنيين + integrators (مثل بيان، تكامل)
   - 30% margin
   - White-label kit

10. Analytics Dashboard (للـ BrightAI team):
    - MRR, ARR, Churn, LTV, CAC
    - Cohort analysis
    - Segment by industry, size, region
    - Revenue per feature usage

Webhooks Required:
- payment.succeeded
- payment.failed
- subscription.created
- subscription.updated
- subscription.canceled
- invoice.paid
- invoice.overdue

قيود:
- كل الأسعار بالريال SAR (USD ثانوي)
- VAT 15% مضاف تلقائياً للسعوديين
- كل الفواتير بالعربي (English كخيار)
- Payment failed → 3 retries على مدى 7 أيام قبل التعليق
- No dark patterns في Cancel flow (زر واضح، لا خطوات مضللة)
- PDPL: بيانات الدفع لا تُخزّن (Tap tokenization)

المخرجات:
1. Code كامل + tests
2. Sequence diagrams للـ payment flows
3. Documentation بالعربي + English
4. Test cards + sandbox setup
5. ZATCA compliance checklist
```

---

## 🌍 المرحلة 5 — التصدر السعودي والخليجي (شهر)

### 📌 البرومبت #8 — إنتاج محتوى مكثّف لتصدر Google السعودي

```plaintext
أنت كاتب محتوى تقني عربي محترف متخصص في AI Governance + Saudi Regulations.
اقرأ semrush/KEYWORD-REPORT.md و semrush/TOPICAL-AUTHORITY-PLAN.md قبل البدء.
تكلم بالعامية السعودية في تواصلي، لكن اكتب المحتوى بالفصحى الاحترافية.

المهمة: أنتج 25 مقال جديد لملء الفجوات في العناقيد السبعة (Topic Clusters) وتصدر Google السعودي.

مواصفات كل مقال:
- 2,000-3,500 كلمة (Long-form authoritative)
- H1 واحد يحتوي الكلمة المفتاحية
- 6-10 H2/H3 مع بنية هرمية سليمة
- Introduction (200 كلمة) + Body + Conclusion + FAQ (6 أسئلة)
- Featured Snippet block في أول قسم (jump-to-answer format)
- Table of Contents مولّد آلياً
- 3-5 صور/رسوم بيانية (ai-generated أو stock مرخّص)
- 5-8 روابط داخلية (internal links) للـ pillar pages
- 2-4 روابط خارجية موثوقة (sdaia.gov.sa, nca.gov.sa, sama.gov.sa, sfda.gov.sa, laws.boe.gov.sa)
- JSON-LD: Article + FAQPage + BreadcrumbList
- Speakable schema markup
- Reading time محسوب
- Author bio (Yazeed أو موظف Compliance)
- Published date + Last modified
- Related posts (3-4)
- CTA in-content (2 مرات: منتصف + نهاية)

قائمة الـ 25 مقال المطلوبة (حسب الأولوية):

عنقود PDPL (P0 — 4 مقالات):
1. عقوبات نظام حماية البيانات الشخصية 2026: الغرامات الكاملة (target: 1,900/mo)
2. اللائحة التنفيذية لنظام حماية البيانات الشخصية: شرح المادة بالمادة
3. نقل البيانات الشخصية خارج السعودية: الشروط والضوابط
4. تعيين مسؤول حماية البيانات (DPO) في المنشآت السعودية

عنقود NCA (P0 — 3 مقالات):
5. ضوابط الأمن السيبراني ECC القائمة الكاملة بالعربي (target: 260/mo direct)
6. Data Cybersecurity Controls DCC: الفرق عن ECC
7. Cloud Cybersecurity Controls CCC: متى تنطبق على منشأتك

عنقود SDAIA (P0 — 4 مقالات):
8. دليل الجهات التنظيمية للذكاء الاصطناعي في السعودية (شامل)
9. مكتب إدارة البيانات الوطنية NDMO: الأدوار والمتطلبات (target: 1,900/mo)
10. أخلاقيات AI في السعودية: مبادئ سدايا السبعة بالتطبيق
11. HUMAIN وALLAM: مستقبل الذكاء الاصطناعي السعودي (target: 4,300/mo cluster)

عنقود القطاعات (P1 — 6 مقالات):
12. متطلبات ساما للذكاء الاصطناعي في البنوك 2026
13. AI في المصانع الطبية: دليل SFDA + ISO 13485
14. AI في المستشفيات السعودية: CBAHI + PDPL Health
15. AI في المشتريات الحكومية: منصة اعتماد + السياسة الوطنية
16. AI في التجزئة السعودية: البيانات وحماية العملاء
17. AI في التأمين السعودي: BCI + متطلبات ساما

عنقود ISO (P1 — 3 مقالات):
18. ISO 27001 vs ISO 42001: أيهما تحتاج منشأتك؟ (target: 1,300/mo bridge)
19. خطوات الحصول على شهادة ISO 42001 في السعودية
20. ISO 42001 و PDPL و NCA: خارطة التوافق الشاملة

عنقود التطبيق العملي (P2 — 5 مقالات):
21. سياسة استخدام AI: قالب جاهز للمنشآت السعودية (Linkable Asset)
22. AI Impact Assessment: نموذج تطبيقي للجهات الحكومية
23. تدريب الموظفين على AI الآمن: منهج 3 أيام
24. كيف تختبر AI Firewall: 10 سيناريوهات هجوم
25. RFP للـ AI Governance Platform: قالب جاهز للمشتريات

قيود جودة (Non-negotiable):
- كل مقال لازم يحتوي رقم إحصائي حديث (2025-2026) مع مصدر
- كل ادعاء تنظيمي = رابط للنص الأصلي في laws.boe.gov.sa أو sdaia.gov.sa
- 0% AI-generated smell — يمر بـ Originality.ai و Copyleaks
- Grammar Arabic 100% + مصطلحات موحّدة (استخدم قاموس المصطلحات من brain.md)
- E-E-A-T: كل مقال له author schema + expertise indicators
- Not thin content — كل قسم H2 يحوي 200+ كلمة قيمة

Internal Linking Strategy لكل مقال:
- 3 روابط لصفحات pillar (blog + docs)
- 1 رابط لصفحة solution ذات صلة
- 1 رابط لصفحة سعر أو demo
- 2-3 روابط لمقالات blog أخرى في نفس العنقود

Publishing Schedule:
- المقالات P0 (7 مقالات): خلال أسبوعين
- المقالات P1 (9 مقالات): خلال 3 أسابيع
- المقالات P2 (9 مقالات): خلال شهر

بعد كل مقال:
- npm run build
- npm run seo:all
- npm run indexnow:trigger (إعلام Bing فوري)
- Submit URL في Google Search Console
- Share على LinkedIn + Twitter بحساب BrightAI الرسمي

المخرجات لكل مقال:
1. الملف: src/content/blog/[slug].md
2. Featured image في public/blog/[slug].webp
3. Update sitemap
4. Cross-link report

استخدم Sequential Thinking لترتيب المقالات حسب dependencies (بعضها يحتاج آخر منشور أولاً).
```

---

### 📌 البرومبت #9 — التوسّع الخليجي (UAE, Qatar, Bahrain, Kuwait, Oman)

```plaintext
أنت خبير SEO دولي + محتوى عربي متخصص في أنظمة الخليج.
تكلم بالسعودي مع الفريق، والمحتوى بالفصحى الاحترافية.

المهمة: وسّع BrightAI من السعودية فقط إلى تغطية 6 دول خليجية + مصر.

الأنظمة التنظيمية لكل دولة:

🇦🇪 الإمارات:
- UAE Data Protection Law (Federal Decree No. 45 of 2021)
- TDRA (Telecommunications and Digital Government Regulatory Authority)
- UAE AI Charter
- Dubai AI Strategy 2031
- ADGM Data Protection Regulations (Abu Dhabi Global Market)
- DIFC Data Protection Law (Dubai International Financial Centre)
- NCEMA cybersecurity requirements
- Central Bank of UAE guidance on AI

🇶🇦 قطر:
- Qatar Personal Data Privacy Protection Law (Law No. 13 of 2016)
- Qatar National Cyber Security Strategy
- Qatar Financial Centre AI Guidelines
- Communications Regulatory Authority (CRA)

🇧🇭 البحرين:
- Bahrain PDPL (Law No. 30 of 2018)
- Bahrain Central Bank Cyber Security Framework
- iGA (Information & eGovernment Authority)

🇰🇼 الكويت:
- Kuwait Data Privacy Protection Regulation
- CITRA (Communication and Information Technology Regulatory Authority)
- Central Bank of Kuwait Cyber Security Framework

🇴🇲 عُمان:
- Oman Personal Data Protection Law (Royal Decree 6/2022)
- OCERT (Oman National CERT)
- Central Bank of Oman guidance

🇪🇬 مصر:
- Egyptian Personal Data Protection Law (Law No. 151 of 2020)
- Financial Regulatory Authority (FRA)
- NTRA (National Telecom Regulatory Authority)

المطلوب تنفيذه:

1. Info Architecture:
   الحل: subfolder per region مع hreflang صحيح

   /solutions/uae/ai-governance-platform/
   /solutions/qa/ai-governance-platform/
   /solutions/bh/ai-governance-platform/
   /solutions/kw/ai-governance-platform/
   /solutions/om/ai-governance-platform/
   /solutions/eg/ai-governance-platform/

   hreflang:
   ar-SA (default), ar-AE, ar-QA, ar-BH, ar-KW, ar-OM, ar-EG
   en-SA, en-AE, en-QA, en-BH, en-KW, en-OM, en-EG
   x-default (English international)

2. صفحات جديدة لكل دولة (10 صفحات × 6 دول = 60 صفحة):
   /solutions/{country}/ (Country hub)
   /solutions/{country}/ai-governance-platform/
   /solutions/{country}/ai-firewall/
   /solutions/{country}/pdpl-compliance/ (اسم النظام المحلي)
   /solutions/{country}/banking-ai-governance/
   /solutions/{country}/healthcare-ai-governance/
   /solutions/{country}/government-ai-governance/
   /solutions/{country}/manufacturing-ai-governance/
   /solutions/{country}/{capital-city}/ (مثال: dubai, doha)
   /solutions/{country}/regulations-guide/

3. Docs جديدة (6 وثائق × 6 دول = 36 وثيقة):
   /docs/{country}/data-protection-law/
   /docs/{country}/ai-governance-requirements/
   /docs/{country}/cybersecurity-framework/
   /docs/{country}/banking-ai-rules/
   /docs/{country}/healthcare-ai-rules/
   /docs/{country}/compliance-mapping/ (خارطة ربط للحلول)

4. Blog cluster لكل دولة (5 مقالات × 6 دول = 30 مقال):
   - "دليل قانون حماية البيانات في {الدولة} 2026"
   - "متطلبات AI Governance في {الدولة}: دليل تنفيذي"
   - "أفضل شركات AI في {الدولة}"
   - "الفرق بين قانون البيانات في السعودية و{الدولة}"
   - "خارطة الجهات التنظيمية للـ AI في {الدولة}"

5. Compliance Packs جديدة (6 حزم):
   - UAE DPL + TDRA Pack
   - Qatar DPL Pack
   - Bahrain PDPL Pack
   - Kuwait DPP Pack
   - Oman PDPL Pack
   - Egypt PDPL Pack

6. Local Business Schema لكل دولة:
   - عنوان مكتب تمثيلي (حتى لو virtual office)
   - رقم هاتف محلي (اشترك في Numbers via Twilio)
   - hours + language + areaServed
   - LocalBusiness + Organization@id لكل واحد

7. Regional Landing Pages:
   /middle-east/ (English hub for Gulf + Egypt)
   /gcc/ (Gulf-only English)
   /الخليج/ (Arabic hub)

8. Currency Support:
   - Pricing displays: SAR, AED, QAR, BHD, KWD, OMR, EGP, USD
   - Auto-detect via IP + user preference
   - VAT/GST calculation per country

9. Compliance Comparison Tools:
   Interactive comparison matrix:
   - PDPL SA vs UAE vs Qatar vs Bahrain (row = regulation, columns = countries)
   - AI Governance requirements comparison
   - Deep-linkable, shareable
   - JSON-LD Table markup

10. Sales Localization:
    - WhatsApp number per country (or centralized SA hub)
    - Local case studies (لو موجودة)
    - Local testimonials
    - Regional pricing (adjust for market maturity)

Meta Titles Localized (Arabic examples):
- "منصة حوكمة الذكاء الاصطناعي | حلول UAE DPL - BrightAI"
- "الامتثال لقانون حماية البيانات القطري | AI Governance - BrightAI"

الأولوية:
- UAE أولاً (السوق الأكبر بعد السعودية)
- Qatar ثانياً (استثمارات AI ضخمة FIFA + Vision 2030)
- Kuwait + Bahrain + Oman بالتوازي
- Egypt أخيراً (سوق ضخم لكن تسعير مختلف)

قيود:
- كل ادعاء قانوني = رابط للمصدر الأصلي
- استخدم النص الرسمي للقانون (لا تُعيد صياغة قانونية)
- ترجمة معتمدة للمصطلحات القانونية
- Legal review من محامي مرخّص في كل دولة قبل النشر (اذكر هذا كـ requirement)

المخرجات:
1. 60 صفحة solution + 36 وثيقة + 30 مقال = 126 صفحة جديدة
2. 6 compliance packs جديدة
3. Interactive comparison tool
4. Updated sitemap (سيصبح ~280 URL)
5. Updated hreflang matrix
6. Regional analytics dashboard
7. Localized WhatsApp templates

Timeline: شهر كامل مع فريق من 3 كتّاب + 1 developer.
```

---

## 🎬 المرحلة 6 — التسويق والنمو (مستمر)

### 📌 البرومبت #10 — Marketing Automation + Growth Engine

```plaintext
أنت Growth Marketing Engineer خبير في B2B SaaS السعودي.
تكلم بالعامية السعودية.

المهمة: صمّم ونفّذ محرك نمو كامل لـ BrightAI.

القنوات المستهدفة:

1. Organic Search (Google + Bing):
   - Content sprint حسب البرومبت #8
   - IndexNow automation
   - Rich snippets optimization
   - AI Overviews optimization (llms.txt already exists)

2. AEO (Answer Engine Optimization):
   - ChatGPT: brightai citations (llms.txt عندنا جاهز)
   - Perplexity: source verification
   - Google SGE: FAQPage + Speakable
   - Claude: technical accuracy

3. LinkedIn (الأهم للـ B2B السعودي):
   - Company page optimization
   - Daily posts (Yazeed personal + BrightAI page)
   - Employee advocacy program
   - LinkedIn Ads (target: Compliance Officers, CISOs, CIOs in SA)
   - LinkedIn Newsletter بالعربي

4. X/Twitter:
   - Threads تعليمية بالسعودي عن AI Governance
   - Live tweets من مؤتمرات (LEAP, GITEX)
   - Engagement مع sdaia, ncakingdom, sama_gov

5. WhatsApp Business:
   - Broadcast list للـ prospects
   - Auto-replies للأسئلة الشائعة (بالعربي)
   - Rich cards للمنتجات
   - Click-to-WhatsApp Ads

6. Email:
   - Newsletter أسبوعي (اشتراك من blog)
   - Drip campaigns (post-signup)
   - Nurture sequences per persona
   - Re-engagement للـ churned users

7. Events:
   - LEAP Riyadh (booth + speaking)
   - GITEX Dubai
   - Money 20/20 Riyadh
   - Cybersecurity Week Saudi
   - Own event: "AI Governance Day Riyadh"
   - Webinars شهرية بالعربي

8. Partnerships:
   - System Integrators (بيان، تكامل، ELM)
   - Cloud providers (STC Cloud, Salam Cloud)
   - Consulting firms (Big 4 + local)
   - Law firms (Al-Sabti, Al-Ghazzawi للمحاماة)

المطلوب تنفيذه (Marketing Stack):

1. CRM: HubSpot أو Salesforce
   - Lead scoring model
   - Automation workflows
   - Deal pipeline (5 stages)
   - Integration مع BrightAI dashboard

2. Marketing Automation Platform:
   - Customer.io أو Braze
   - 12 pre-built workflows:
     - Welcome series (5 emails)
     - Trial ending soon (3 emails)
     - Feature adoption nudges
     - Upsell campaigns
     - Win-back campaigns
     - Post-cancel exit survey
     - Product update announcements
     - Compliance news alerts
     - Case study drops
     - Webinar invitations
     - Feedback requests
     - Referral prompts

3. Analytics:
   - GA4 (موجود G-8LLESL207Q)
   - Microsoft Clarity (heatmaps)
   - Mixpanel (product analytics)
   - Attribution model (multi-touch)
   - Dashboard في Metabase أو Looker

4. Content Distribution:
   - Buffer/Hootsuite للـ scheduling
   - Notion/Airtable للـ content calendar
   - Grammarly Business (English)
   - Loom للـ product videos

5. Community:
   - Discord/Slack community "BrightAI Compliance Circle"
   - Monthly AMA
   - User-generated content contests
   - Certification program: "BrightAI Certified Compliance Officer"

6. Case Studies (Priority 1):
   - 3 case studies في أول شهرين
     - بنك سعودي (anonymize)
     - مستشفى كبير
     - مصنع أدوية
   - Video + PDF + Web page لكل واحد
   - PR release مع كل واحد

7. Thought Leadership:
   - Yazeed كـ face of BrightAI
   - 1 مقال في Harvard Business Review Arabia شهرياً
   - 1 مقالة في Argaam / Al Eqtisadiah شهرياً
   - Podcast تعليمي "حوكمة AI بالسعودي" — أسبوعي

8. Referral Program:
   - Employee referrals (2,500 SAR per hire)
   - Customer referrals (20% commission 3 months)
   - Partner referrals (30%)

9. Sales Enablement:
   - Battle cards vs competitors (IBM Watson, Palo Alto Prisma)
   - ROI calculator
   - Compliance readiness assessment (lead magnet)
   - Discovery call template
   - Demo script بالعربي
   - Objection handling playbook

10. Analytics KPIs Dashboard:
    - Traffic: sessions, users, sources, top pages
    - Leads: MQL, SQL, conversion rates
    - Pipeline: deals in each stage, average deal size
    - Revenue: MRR, ARR, NRR, churn, LTV
    - Product: DAU/MAU, feature adoption, NPS
    - Support: tickets, CSAT, resolution time

خطة 90 يوم:

الشهر 1 (Foundation):
- HubSpot setup + integration
- Email automation (5 workflows)
- LinkedIn presence (daily posts)
- 3 case studies
- First webinar

الشهر 2 (Amplification):
- Content sprint (10 مقالات)
- Paid ads (LinkedIn + Google)
- Podcast launch
- Partnership announcements
- LEAP prep

الشهر 3 (Scale):
- Community launch
- Referral program public
- 2nd webinar
- Case study #4-5
- Growth review + iterate

الميزانية المقترحة (شهرياً):
- Paid ads: 25,000 SAR (LinkedIn + Google + Meta)
- Content production: 15,000 SAR
- Tools (HubSpot, etc.): 8,000 SAR
- Events + sponsorships: 20,000 SAR
- PR + agencies: 12,000 SAR
- Total: ~80,000 SAR/شهر (adjust حسب funding)

المخرجات:
1. Marketing Playbook كامل (30+ صفحة)
2. Content calendar لـ 90 يوم
3. Email templates جاهزة (12 workflow)
4. Landing pages للـ campaigns (5-10)
5. Sales deck (Arabic + English)
6. ROI calculator (interactive)
7. Analytics dashboards
```

---

### 📌 البرومبت #11 — Customer Success + Retention Engine

```plaintext
أنت Customer Success Manager خبير في B2B SaaS. مشروع BrightAI.
تكلم بالعامية السعودية.

المهمة: صمّم Customer Success program كامل لضمان retention 95%+ ونمو NRR 130%+.

الفلسفة:
"العميل ما يشتري منتج، يشتري نتيجة. مهمتنا نضمن يوصل للنتيجة."

النتائج المستهدفة للعميل:
1. تقليل مخاطر PDPL/NCA بنسبة 80%+ خلال 90 يوم
2. اعتماد Evidence Files من المدققين من أول مرة
3. توفير 40+ ساعة/شهر على تقارير الامتثال
4. Zero data breach incidents

المطلوب تنفيذه:

1. Onboarding Excellence (أول 30 يوم):
   Day 0 — Kick-off:
   - Welcome call مع CSM (30 دقيقة)
   - Success plan تكتب بمشاركة العميل
   - Slack/Teams channel مشترك

   Day 1-7 — Setup:
   - Technical implementation
   - Team invites + training
   - First policy configured
   - First test transaction

   Day 8-14 — First Value:
   - First PDPL/NCA compliance check
   - First Evidence File generated
   - Dashboard tour
   - Report scheduled

   Day 15-30 — Habit Formation:
   - Daily usage measured
   - Feature adoption check-ins
   - First formal review meeting
   - Success plan updated

2. Health Scoring (0-100):
   - Login frequency (20%)
   - Feature adoption breadth (25%)
   - Volume of AI requests (15%)
   - Team seat activation (15%)
   - Support ticket sentiment (10%)
   - Business review attendance (10%)
   - Payment history (5%)

   Alerts:
   - < 40: Red (immediate intervention)
   - 40-60: Yellow (proactive outreach)
   - 60-80: Green (monitor)
   - 80+: Champion (upsell opportunity)

3. Quarterly Business Reviews (QBR):
   Format: 90-minute strategic session
   Attendees: CSM + Sponsor + Compliance Officer
   Agenda:
   - Success metrics review
   - Feature adoption analysis
   - Compliance posture update
   - Roadmap alignment
   - Expansion opportunities
   - Renewal planning

4. Support Tiers:
   Starter Tier:
   - Email support
   - Response: 24h
   - Community access
   - Self-service KB

   Business Tier:
   - Email + WhatsApp
   - Response: 8h
   - Monthly office hours
   - Priority queue

   Enterprise Tier:
   - Dedicated CSM
   - WhatsApp direct + call
   - Response: 2h (critical), 4h (high)
   - Weekly check-ins first 90 days
   - Executive sponsor

5. Knowledge Base (Arabic + English):
   - 100+ articles
   - Video walkthroughs
   - Compliance templates
   - Best practices per industry
   - Interactive tutorials
   - Search بالعربي (algolia + semantic)

6. In-App Guidance:
   - Product tour للـ new users
   - Contextual help (Intercom-style)
   - Feature announcements
   - Empty states with education

7. Customer Advisory Board:
   - 12 top customers
   - Quarterly meetings
   - Roadmap input
   - Early access to features
   - Advisor stock/discount

8. Expansion Playbooks:
   Product expansion signals:
   - >80% request volume → upsell tier
   - Multiple departments → add-on packs
   - International offices → multi-region
   - New compliance requirement → compliance pack

   Playbook per signal:
   - Trigger detection
   - CSM outreach template
   - Value proposition
   - Pricing conversation
   - Contract expansion

9. Churn Prevention:
   Early Warning Signals:
   - Login drop 50%+ vs baseline
   - Support tickets increase (negative)
   - Missed QBR
   - Key champion leaves company
   - Payment delays

   Save Playbooks:
   - Executive escalation
   - Discount authorization
   - Feature waitlist priority
   - Free consultation
   - Contract restructure

10. Voice of Customer:
    - NPS quarterly survey
    - CSAT after every ticket
    - PES (Product Engagement Score)
    - User interviews (5/month)
    - Feature request board (public)
    - Feedback loop back to product

11. Certification Program:
    "BrightAI Certified Compliance Officer"
    - 3-day intensive course
    - Online + in-person options
    - Certificate + LinkedIn badge
    - Priority job placement
    - Alumni network
    - 5,000 SAR/participant

12. Community:
    - Slack workspace "BrightAI Compliance Circle"
    - Channels per industry
    - Monthly AMA with Yazeed
    - Weekly compliance news digest
    - Peer-to-peer help
    - User-generated best practices

Renewal Playbook:
- 90 days before: renewal forecast + risks
- 60 days: renewal proposal + expansion plan
- 30 days: contract negotiation
- 14 days: executive alignment call
- 0 days: signed, celebrate

Metrics to Track:
- NPS (target: 50+)
- CSAT (target: 95%+)
- Time to First Value (target: <7 days)
- Feature Adoption (target: 60% of features used)
- Support Ticket Volume (target: <5/customer/month)
- Renewal Rate (target: 95%+)
- Expansion Rate (target: 130% NRR)
- Advocacy Rate (target: 30% of customers refer)

Team Structure (as we scale):
Phase 1 (0-20 customers): 1 CSM (Yazeed)
Phase 2 (20-50): 2 CSMs + 1 Support
Phase 3 (50-100): 3 CSMs + 2 Support + 1 CS Ops
Phase 4 (100+): CSM per 25 accounts + Regional leads

المخرجات:
1. Onboarding checklist template
2. QBR template
3. Health score dashboard
4. Save playbook library (10 scenarios)
5. Renewal proposal template
6. Certification curriculum
7. Community launch plan
```

---

## 🏆 المرحلة 7 — الميزة التنافسية الاستراتيجية

### 📌 البرومبت #12 — الحصن الاستراتيجي (Strategic Moat)

```plaintext
أنت Chief Strategy Officer. مشروع BrightAI الهدف تصدّر الشرق الأوسط.
تكلم بالعامية السعودية.

المهمة: صمّم استراتيجية "حصن" (Moat) تجعل BrightAI صعب المنافسة لسنوات.

الأصول الاستراتيجية المطلوب بناؤها:

1. البيانات والذكاء (Data Moat):
   - أكبر dataset عربي لـ AI Governance events (من كل العملاء anonymized)
   - Trained models على السلوك السعودي/الخليجي
   - Compliance benchmarks per industry
   - Threat intelligence feed خاص بالمنطقة
   - Regulatory update feed real-time

2. الشبكة والعلاقات (Network Moat):
   - علاقات رسمية مع sdaia, nca, sama, sfda (توقيع MoUs)
   - Board seat في هيئات صناعة السعودية
   - Advisory role في اللجان التنظيمية
   - شراكات حصرية مع Big 4 + Legal firms
   - Certification body للـ AI Governance في السعودية

3. البراند والمرجعية (Brand Moat):
   - "BrightAI is the Saudi standard for AI safety" — messaging مركّز
   - Yazeed كـ thought leader (كتاب، بودكاست، مؤتمرات)
   - "AI Governance Day" — أكبر مؤتمر سنوي (نحن ننظم)
   - Annual "Saudi AI Trust Report" — reference لكل الصناعة
   - Media presence في CNBC Arabia, Al Arabiya, Asharq

4. التكنولوجيا (Technology Moat):
   - Patents في PII redaction عربي
   - Patents في Arabic prompt injection detection
   - Open-source community للـ core (community edition)
   - SDK support لكل major language
   - Air-Gapped deployment expertise فريدة

5. المنتج (Product Moat):
   - Time-to-value < 24 ساعة (أسرع منافس)
   - أعمق integration مع أنظمة سعودية (نافذ، أبشر, يقين, واثق)
   - أعمق integration مع أنظمة خليجية
   - Compliance packs unmatched
   - Custom regulatory bots (يجاوب أسئلة PDPL/NCA بدقة)

6. اللغة والثقافة (Cultural Moat):
   - أفضل NER عربي (سعودي + خليجي + مصري)
   - أدق فهم للأسماء العربية
   - أدق كشف للـ PII السعودي
   - Support بالعامية (نحن الوحيدون)
   - UX مصمم للمستخدم السعودي أصلاً

7. القانوني والامتثال (Legal/Compliance Moat):
   - Local hosting معتمد من STC/Salam
   - SOC 2 Type II + ISO 27001 + ISO 42001 (نحن أول من يحصل عليها في المنطقة)
   - PDPL certified
   - Saudi CR + Legal entity
   - Ready for government tenders (تصنيف مقاولين + منافسات)

8. المواهب (Talent Moat):
   - أفضل فريق AI Governance في السعودية
   - Ex-SDAIA, NCA, SAMA employees في الفريق
   - Certified Compliance Officers program (بنبني الجيل القادم)
   - Employer of choice في المجال

9. الاقتصاديات (Economic Moat):
   - Multi-year contracts (3-5 سنوات)
   - Deep integrations = high switching cost
   - Compliance packs = ongoing value
   - Certified users = personal investment
   - Data lock-in (7 سنوات retention)

10. الجغرافيا (Geographic Moat):
    - Data residency 100% في السعودية/الخليج
    - Native language + culture
    - Local support (24/7 بالعربي)
    - Regional presence: Riyadh HQ + offices in Jeddah, Dubai, Doha
    - "For the region, by the region"

استراتيجية 3 سنوات:

السنة 1 (2026): السعودية أولاً
- Target: 50 عميل مؤسسي، 15M SAR ARR
- Focus: منتج ناضج + case studies + brand
- Investment: 5M SAR
- Team: 20 موظف

السنة 2 (2027): التوسّع الخليجي
- Target: 200 عميل، 60M SAR ARR
- Expansion: UAE + Qatar + Bahrain + Kuwait + Oman
- Product: Enterprise features + integrations
- Team: 50 موظف

السنة 3 (2028): القيادة الإقليمية
- Target: 500 عميل، 200M SAR ARR
- Expansion: Egypt + Jordan + North Africa
- Product: AI-native features + custom models
- Team: 120 موظف
- IPO ready or acquisition target

المخاطر الاستراتيجية والتخفيف:

1. Big Tech يدخل السوق (IBM Watson, Palo Alto):
   Mitigation: عمق محلي + سرعة + سعر + دعم عربي

2. تغيير الأنظمة السعودية:
   Mitigation: علاقات مباشرة + response time سريع + rules engine مرن

3. Open source alternatives:
   Mitigation: enterprise features + support + compliance certifications

4. Economic downturn:
   Mitigation: ROI واضح + compliance mandatory + cost savings story

5. Data breach عندنا:
   Mitigation: SOC 2 + insurance + incident response plan + transparent communication

Positioning Statement:
"BrightAI is the Saudi AI Safety OS — the operational trust layer that Middle Eastern enterprises use to govern AI. Where global platforms treat compliance as a feature, we treat sovereignty, culture, and regional regulations as our foundation."

Elevator Pitch (30 ثانية):
"إحنا نظام تشغيل الأمان للذكاء الاصطناعي في المنشآت السعودية والخليجية. عكس المنصات الأجنبية اللي تشرح لك PDPL و NCA، إحنا مبنيين لهم من الجذور. تحكم كامل بالبيانات، امتثال جاهز، ودعم بالعربي 24/7. مو منصة، نظام تشغيل."

المخرجات:
1. Strategic Moat Document (30 صفحة)
2. 3-year roadmap
3. Positioning + messaging framework
4. Board presentation deck
5. Investor pitch deck (لو fundraising)
6. Competitive intelligence report
7. Risk register + mitigation plans
```

---

## ✅ Checklist نهائي — قبل الإطلاق الرسمي

### التقنية (Technical Readiness)
- [ ] كل الديون التقنية نُظّفت (البرومبت #1)
- [ ] SEO audit passed (البرومبت #2)
- [ ] Premium redesign done (البرومبت #3)
- [ ] SaaS backend architecture reviewed (البرومبت #4)
- [ ] Auth + Multi-tenancy tested (البرومبت #5)
- [ ] AI Firewall engine load-tested (البرومبت #6)
- [ ] Billing + ZATCA integration verified (البرومبت #7)
- [ ] Load testing: 1000 concurrent users
- [ ] Security audit: OWASP + PDPL
- [ ] Disaster recovery: tested restore
- [ ] Monitoring + alerting: 100% coverage

### المحتوى (Content Readiness)
- [ ] 25 مقال جديد نُشرت (البرومبت #8)
- [ ] 6 حزم امتثال خليجية جاهزة (البرومبت #9)
- [ ] Case studies: 3+ منشورة
- [ ] Video demos: 5+ لكل feature
- [ ] Knowledge Base: 100+ مقال
- [ ] Sales deck: AR + EN
- [ ] Legal pages: reviewed by SA lawyer

### التسويق (Marketing Readiness)
- [ ] HubSpot + workflows جاهزين (البرومبت #10)
- [ ] LinkedIn strategy live
- [ ] First webinar delivered
- [ ] PR strategy launched
- [ ] LEAP Riyadh booked
- [ ] 3 partnerships signed

### العملاء (Customer Readiness)
- [ ] Onboarding automated (البرومبت #11)
- [ ] Support tiers defined
- [ ] Knowledge base populated
- [ ] Community launched
- [ ] Certification program ready

### الاستراتيجية (Strategic Readiness)
- [ ] Moat plan approved (البرومبت #12)
- [ ] Board alignment
- [ ] 3-year roadmap communicated
- [ ] Funding secured (لو محتاج)
- [ ] Talent plan executed

---

## 🎯 الهدف النهائي (12 شهر)

```
📈 KPIs مستهدفة بعد 12 شهر من تنفيذ كل البرومبتات:

🏆 SEO:
   - المرتبة #1 في Google السعودية على "حوكمة الذكاء الاصطناعي"
   - Top 3 على "PDPL" + "sdaia" + "nca ecc"
   - 50,000+ organic sessions/شهر
   - Featured Snippets: 20+
   - AI Overviews citations: يومية

💰 الإيرادات:
   - 50+ عميل مؤسسي
   - 15M+ SAR ARR
   - 130%+ NRR
   - < 5% Churn

🌍 التوسّع:
   - حضور في 6 دول
   - 3 مكاتب (الرياض، دبي، الدوحة)
   - 20+ موظف

🎖️ الاعتراف:
   - Best AI Governance Platform in the Middle East
   - Featured in Forbes ME, Argaam, Al Arabiya
   - Speaker slots في LEAP + GITEX + Money 20/20
```

---

**الملاحظة الأخيرة:**
كل برومبت مصمم عشان يشتغل مستقل مع أي AI Agent (Claude Code, Cursor, Cline, Codex). انسخه كامل، الصقه، وخل الوكيل يشتغل. راقب المخرجات، صحّح، وكمل.

**الترتيب المُوصى به للتنفيذ:**
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

**بالتوفيق يا بطل. الهدف واضح: الأفضل في الشرق الأوسط. مو أقل. 🚀**

---

جاهزة كلها في المحادثة يا بطل. تقدر تنسخ أي جزء مباشرة. لو تبي أي برومبت أعمّقه أكثر أو أضيف برومبت جديد، قل لي بس. 💪