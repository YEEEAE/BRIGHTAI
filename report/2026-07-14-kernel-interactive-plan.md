# خطة: تحويل Kernel من عرض تجريبي إلى صفحات قابلة للاستخدام

**التاريخ**: 2026-07-14
**الوكيل**: BrightAI Workspace Agent
**المهمة**: `/kernel/*` — تفعيل الدردشة الفعلية + أقسام "جرّب بالذكاء الاصطناعي" + نموذج lead capture
**الوضع**: في انتظار قرار المستخدم على 3 نقاط (انظر القسم 7)

---

## 1. الملخص التنفيذي

عندك 11 صفحة Kernel. حالياً:
- **`/kernel/chat/`**: تستدعي `/api/ai/chat` فعلياً (السطر 393) بس تفشل بصمت → ترجع demo. ❌ لا يوجد عرض أخطاء عربية، ❌ لا يوجد CTA لتحويل الزائر بعد 3 رسائل.
- **5 صفحات وظيفية** (`compliance`, `policies`, `evidence`, `audit`, `scenarios`): تعرض بيانات تجريبية فقط، ❌ ما فيها تفاعل مع AI.
- **6 صفحات أخرى** (`index`, `chat`, `approvals`, `connectors`, `reports`, `stats`): `index` يحتوي kernel shell، الباقي dashboards.
- **نموذج lead capture**: غير موجود. الـ `/contact/` يستخدم `formsubmit.co` (طرف ثالث).

**النتيجة بعد التنفيذ** (الهدف):
- ✅ Chat يعمل مع `/api/ai/chat` + عرض أخطاء 429/502/الشبكة بالعربي + CTA "تواصل معنا" بعد 3 رسائل
- ✅ قسم "جرّب بالذكاء الاصطناعي" في 5 صفحات وظيفية، كل قسم يستدعي API مع systemPrompt مخصص
- ✅ نموذج lead capture موحد (3 حقول: اسم، بريد/جوال، شركة) في أسفل كل صفحة Kernel
- ✅ `KernelDemoPill` ظاهر في كل صفحة kernel تعرض بيانات تجريبية
- ✅ حماية مفاتيح Groq/Gemini (موجودة، ما نغيرها)
- ✅ لا استدعاءات من المتصفح للنماذج مباشرة (موجودة، ما نغيرها)

---

## 2. ما هو موجود (نعيد استخدامه، لا نعيد بناءه)

| الموجود | المسار | ملاحظات |
|---|---|---|
| `chat.astro` يستدعي `/api/ai/chat` فعلياً | `src/pages/kernel/chat.astro:393-415` | موجود، يحتاج تحسين أخطاء + CTA |
| API route مع rate limit + 2 providers | `src/pages/api/ai/chat.ts` | **ممنوع تعديله** (يحمي المفاتيح) |
| `KernelDemoPill` | `src/components/kernel/KernelDemoPill.astro` | موجود، نضيفه للصفحات الناقصة |
| نظام `aria-pressed` للـ demo pill | `KernelDemoPill.astro:48-55` | يستمع لحدث `kernel:demo-toggle` |
| Tokens تصميم V3 | `src/styles/tokens.css` | نستخدمها مباشرة |
| نمط fetch مع fallback | `chat.astro:417-423` | `apiAvailability === false` → demo |
| 8 ملفات mock | `kernel/api/mock/*.json` | موجودة، ما نمسها (قاعدة 2.1 ممنوع حذف) |
| `kernel/api/mock/*.json` مستخدمة في `stats.astro` | `src/pages/kernel/stats.astro:14, 225` | سيمانتك موجودة |

---

## 3. ما نضيفه (ملفات جديدة)

### 3.1 مكوّنات مشتركة (5 مكونات جديدة)

```
src/components/kernel/
├── KernelAiAssistant.astro    (~200 سطر) — قسم "جرّب بالذكاء الاصطناعي" قابل لإعادة الاستخدام
├── KernelChatError.astro      (~30 سطر) — عرض أخطاء موحد (429/502/شبكة)
├── KernelLeadForm.astro       (~180 سطر) — نموذج lead capture (3 حقول + تحقق + fallback)
├── KernelContactCta.astro     (~50 سطر) — CTA "تواصل معنا" يظهر بعد 3 رسائل في chat
└── KernelDemoBanner.astro     (~40 سطر) — شريط علوي ثابت للصفحات التي تعرض بيانات تجريبية
```

**`KernelAiAssistant.astro`** (أهم مكوّن):
- Props: `systemPrompt: string`، `placeholder?: string`، `title?: string`
- يستدعي `/api/ai/chat` مع systemPrompt مخصص
- يعرض: حقل إدخال + زر إرسال + typing indicator + bubble AI
- يستخدم `KernelChatError` عند الفشل (429/502/شبكة) بالعربي
- يحتفظ بسياق المحادثة (client-side) في `sessionStorage` لتجنب الضياع عند refresh
- يحترم `prefers-reduced-motion`
- به fallback إلى "وضع تجريبي" مع إشعار واضح لو الـ API رجع 404

### 3.2 API route جديد

```
src/pages/api/lead.ts
```

- POST `{ name, contact, company }` (نفس نمط chat.ts)
- **بدون تخزين على السيرفر** (لا DB، لا SMTP — مشروعك static على Render)
- **ما يخدم فعلاً** في الإنتاج: يسجّل في console فقط + يرد `{ ok: true, mode: 'logged' }`
- Fallback في الـ client: لو `/api/lead` رجع 404 → يفتح `https://wa.me/966538229013?text=...` تلقائياً
- يحمي من spam: rate limit 5 طلبات/دقيقة/IP (نفس النمط)
- يحقق من الحقول بـ Zod (موجود في dependencies)
- **ممنوع تعديل `chat.ts`** — هذا route منفصل

### 3.3 SystemPrompts مخصصة (5 prompts)

ننشئ `src/data/kernel-system-prompts.ts`:
```typescript
export const KERNEL_SYSTEM_PROMPTS = {
  compliance: `أنت خبير حوكمة AI في السعودية... [تفاصيل]` ,
  policies: `أنت كاتب سياسات حوكمة AI...`,
  evidence: `أنت محقق أدلة رقمية في مؤسسة سعودية...`,
  audit: `أنت مدقق سجلات AI compliance...`,
  scenarios: `أنت مستشار تنفيذ حوكمة AI...`,
};
```

كل prompt يصرّح بـ:
1. الخبرة (PDPL/NCA ECC/SFDA/SAMA/ISO)
2. النبرة (فصحى رسمية بمصطلحات السوق السعودي)
3. القيد (لا استشارة قانونية، لا بدائل طبية، لا ضمانات مالية)
4. الإخراج (إجابة مختصرة + توصية + تحذير + CTA)

---

## 4. ما نعدّله (ملفات معدّلة)

| الملف | التعديل |
|---|---|
| `src/pages/kernel/chat.astro` | (1) استبدال demo fallback بصامت بـ Arabic error display عبر `KernelChatError` (2) إضافة عداد رسائل المستخدم + إظهار `KernelContactCta` بعد 3 رسائل (3) لا تغيير في fetch() أو API |
| `src/pages/kernel/compliance.astro` | (1) إضافة `<KernelAiAssistant systemPrompt={KERNEL_SYSTEM_PROMPTS.compliance} />` في الأسفل (2) إضافة `<KernelLeadForm />` (3) إضافة `<KernelDemoPill />` إن كان ناقصاً |
| `src/pages/kernel/policies.astro` | نفس النمط (systemPrompt = policies) |
| `src/pages/kernel/evidence.astro` | نفس النمط |
| `src/pages/kernel/audit.astro` | نفس النمط |
| `src/pages/kernel/scenarios.astro` | نفس النمط |
| `src/pages/kernel/approvals.astro` | فقط LeadForm + DemoPill (لا AI section — صفحة قرارات) |
| `src/pages/kernel/connectors.astro` | فقط LeadForm + DemoPill |
| `src/pages/kernel/reports.astro` | فقط LeadForm + DemoPill |
| `src/pages/kernel/stats.astro` | فقط LeadForm + DemoPill (عندها demo pill بالفعل) |
| `src/pages/kernel/index.astro` | فقط LeadForm |
| `src/pages/kernel/offline.astro` | **لا تعديل** (صفحة PWA offline) |

**عدد الملفات المتأثرة**: 1 route جديد + 5 مكونات جديدة + 1 ملف prompts + 11 صفحة معدّلة (3-5 تعديلات في كل صفحة) = **~17 ملف**.

---

## 5. خطة التنفيذ (4 مراحل، تنفذ متسلسلة)

### المرحلة 1: البنية المشتركة (يوم 1)

**الهدف**: بناء المكونات والـ API route بدون لمس الصفحات.

| # | الإجراء | الملف | التحقق |
|---|---|---|---|
| 1.1 | أنشئ `src/data/kernel-system-prompts.ts` | جديد | grep: 5 prompts exported |
| 1.2 | أنشئ `src/components/kernel/KernelChatError.astro` | جديد | يستورد، يعرض 3 أنواع أخطاء |
| 1.3 | أنشئ `src/components/kernel/KernelAiAssistant.astro` | جديد | يستدعي /api/ai/chat، fallback demo، يحفظ في sessionStorage |
| 1.4 | أنشئ `src/components/kernel/KernelContactCta.astro` | جديد | يعرض WhatsApp + mailto |
| 1.5 | أنشئ `src/components/kernel/KernelLeadForm.astro` | جديد | POST /api/lead، fallback wa.me |
| 1.6 | أنشئ `src/components/kernel/KernelDemoBanner.astro` | جديد | شريط ثابت أعلى الصفحة (اختياري) |
| 1.7 | أنشئ `src/pages/api/lead.ts` | جديد | rate limit 5/دقيقة، Zod validation |

**التحقق الإجمالي**:
```bash
npm run build          # 190 → 191+ (بسبب /api/lead) صفحة، 0 أخطاء
npm run verify:all     # exit 0
```

**المخاطر**:
- مكوّن `KernelAiAssistant` يجب ألا يحمّل JS على الصفحات التي لا تستخدمه (lazy init عبر `is:inline` script عند `astro:page-load`).
- `sessionStorage` ليس متاحاً في كل البيئات (private mode) — fallback إلى in-memory Map.

---

### المرحلة 2: chat.astro تحسين (يوم 1-2)

**الهدف**: بدل fallback صامت، عرض أخطاء عربية + CTA بعد 3 رسائل.

| # | الإجراء | التفاصيل |
|---|---|---|
| 2.1 | استبدل `runDemoReply()` fallback في `chat.astro` | يستدعي `KernelChatError` بالأسباب (429/502/شبكة) |
| 2.2 | أضف عداد رسائل المستخدم (`userMsgCount`) | يحفظ في module-level variable |
| 2.3 | أضف `KernelContactCta` | يظهر بعد 3 رسائل (slide-in من الأسفل) |
| 2.4 | أضف console.log تجريبي | يطبع lead trigger event (dev only) |

**التحقق**:
- `npm run build` → 191+ صفحة، 0 أخطاء
- `npm run preview` → افتح `/kernel/chat/` → أرسل 4 رسائل → يجب أن يظهر CTA بعد الرسالة 3
- عطل API (أو حط `apiAvailability = false` يدوياً) → يجب أن تظهر رسالة خطأ عربية، مو demo صامت

**المخاطر**:
- الـ fallback الحالي يستخدم `apiAvailability = false` بعد أول 404. هذا السلوك نحافظ عليه.

---

### المرحلة 3: 5 صفحات AI section + lead form (يوم 2-3)

**الهدف**: في كل صفحة من الـ 5، أضف قسمين في الأسفل:
- `<KernelAiAssistant systemPrompt={KERNEL_SYSTEM_PROMPTS.X} />`
- `<KernelLeadForm />`

| # | الصفحة | systemPrompt | يضاف LeadForm؟ | يضاف DemoPill؟ |
|---|---|---|---|---|
| 3.1 | compliance.astro | KERNEL_SYSTEM_PROMPTS.compliance | ✅ | ✅ (موجود) |
| 3.2 | policies.astro | KERNEL_SYSTEM_PROMPTS.policies | ✅ | ✅ (موجود) |
| 3.3 | evidence.astro | KERNEL_SYSTEM_PROMPTS.evidence | ✅ | ✅ (موجود) |
| 3.4 | audit.astro | KERNEL_SYSTEM_PROMPTS.audit | ✅ | ✅ (موجود) |
| 3.5 | scenarios.astro | KERNEL_SYSTEM_PROMPTS.scenarios | ✅ | ✅ (موجود) |

**النمط (يضاف قبل `</KernelLayout>`)**:
```astro
<section class="kernel-ai-assistant-section inner-section" aria-labelledby="ai-assistant-h2">
  <div class="max-w-4xl mx-auto px-5">
    <h2 id="ai-assistant-h2" class="inner-section__title">جرّب بالذكاء الاصطناعي</h2>
    <p class="inner-section__lead">اسأل سؤالاً متخصصاً عن {domain} في سياق السوق السعودي.</p>
    <KernelAiAssistant
      systemPrompt={KERNEL_SYSTEM_PROMPTS.compliance}
      placeholder="مثال: وش أحتاج أعمل عشان ألتزم PDPL في تسريب بيانات المرضى؟"
      title="مساعد الحوكمة"
    />
  </div>
</section>

<section class="kernel-lead-section inner-section inner-section--alt" aria-labelledby="lead-form-h2">
  <div class="max-w-3xl mx-auto px-5">
    <h2 id="lead-form-h2" class="inner-section__title">تبي تطبّق هالشي في منشأتك؟</h2>
    <p class="inner-section__lead">عبّي بياناتك وفريق الحوكمة يتواصل معك خلال 24 ساعة.</p>
    <KernelLeadForm />
  </div>
</section>
```

**التحقق لكل صفحة**:
- `npm run build` → 0 أخطاء
- `npm run preview` → افتح الصفحة → ابحث عن "جرّب بالذكاء الاصطناعي" → جرب سؤال من domain الصفحة
- تحقق أن form lead يعمل (POST /api/lead أو يفتح wa.me)

---

### المرحلة 4: باقي صفحات Kernel (Lead only) (يوم 3)

| # | الصفحة | يضاف LeadForm؟ | يضاف DemoPill؟ |
|---|---|---|---|
| 4.1 | index.astro | ✅ | ✅ (موجود) |
| 4.2 | approvals.astro | ✅ | ✅ (موجود) |
| 4.3 | connectors.astro | ✅ | ✅ (موجود) |
| 4.4 | reports.astro | ✅ | ✅ (موجود) |
| 4.5 | stats.astro | ✅ | ✅ (موجود) |
| 4.6 | offline.astro | ❌ (صفحة PWA offline) | ❌ |

**التحقق**:
- `npm run build` → 191+ صفحة، 0 أخطاء
- `npm run verify:all` → exit 0
- `npm run seo:all` → exit 0 (تأكد ما في canonical/schema مكسور)
- `npm run performance:budget` → exit 0 (تأكد ما في JS جديد ضخم)

**التحقق النهائي الشامل**:
- افتح كل صفحة من الـ 11 في المتصفح يدوياً
- أرسل 3 رسائل في `/kernel/chat/` → CTA يظهر
- اسأل سؤال في كل قسم AI section → رد يتدفق
- عبّي lead form → يظهر success message أو يفتح wa.me

---

## 6. القرارات التقنية

### 6.1 أمان API (ممنوع تغييره)

- ✅ `chat.ts` **ما نلمسه** — يحمي مفاتيح Groq/Gemini
- ✅ **لا استدعاءات من المتصفح** لـ Groq أو Gemini مباشرة
- ✅ كل استدعاء AI يمر عبر `/api/ai/chat` (server-side proxy)
- ✅ rate limit 10/دقيقة (موجود) — لا تغيير
- ✅ `prerender = false` على chat.ts (موجود) — لا تغيير

### 6.2 النصوص (القاعدة الذهبية: فصحى رسمية)

- ❌ ممنوع تعديل النصوص المنشورة (قاعدة 2.1 من agent.md)
- ✅ النصوص الجديدة (AI section, lead form) **فصحى رسمية** بمصطلحات السوق السعودي
- ❌ ما نستخدم Saudi dialect (وش/تبغى/تقدر) في أي نص منشور — القاعدة 2.1 من brain.md
- ✅ النصوص الداخلية في `systemPrompt` API: فصحى + مصطلحات

### 6.3 الأداء

- AI section يستخدم `<script is:inline>` مع lazy init عبر `astro:page-load` (نفس نمط `chat.astro` الحالي)
- Lead form POST async (لا reload page)
- sessionStorage للـ chat history (5KB max)
- لا نضيف React (ممنوع، قاعدة 2.1)

### 6.4 Stack الاختيارات

- **Zod** (موجود في deps) للتحقق من الحقول في `/api/lead`
- **sessionStorage** لحفظ المحادثة (client-side)
- **fetch() native** للـ POST
- لا نضيف أي dependency جديد

---

## 7. ⚠️ المخاطر + الأسئلة اللي تحتاج جوابك

### 🚨 المخاطرة الكبيرة #1: hosting inconsistency

**الواقع**:
- `astro.config.mjs` يستخدم `@astrojs/vercel` adapter (يحتاج Vercel لتشغيل API)
- `render.yaml` يقول المشروع على **Render static** (ما يشغّل serverless functions)
- الكود في `chat.ts` يفترض Vercel deploy
- **النتيجة المتوقعة في الإنتاج**: `/api/ai/chat` يرجع **404** → chat يفتراضي demo mode بصمت

**لاحظت إن chat.astro الحالي عنده fallback ذكي لـ 404**، فالـ chat يشتغل بصرياً حتى لو الـ API مو متاح. بس **ميزة "الدردشة الحقيقية مع AI"** ما تشتغل في الإنتاج إلا إذا:
- (A) ننقل الاستضافة من Render إلى Vercel
- (B) نبدّل adapter إلى `@astrojs/node` ونخلي Render يدير Node service (مو static)
- (C) نقبل إن API = dev only، والـ chat يعرض demo في prod مع شريط "وضع تجريبي" واضح

**سؤالي**:
- وش تختار؟ (A) Vercel migration / (B) Node adapter on Render / (C) demo-only in prod

**تأثير القرار**:
- (A) أو (B): كل شي يشتغل في prod كما هو متوقع. تنفيذ فوري بدون قيود.
- (C): لازم نضيف UI صريح "وضع تجريبي" في كل قسم AI عشان ما يخدع الزائر. الشغل يزيد لكن ممكن.

---

### ❓ القرار #2: Lead capture — API route ولا WhatsApp/email فقط؟

**3 خيارات**:

| الخيار | المميزات | العيوب |
|---|---|---|
| (X) `/api/lead` route + WhatsApp fallback | "احترافي" — backend شغل، يخزن الـ lead (لكن ما يخزن في مشروعك — نطبع في console) | نفس مشكلة hosting (السؤال #1) |
| (Y) WhatsApp/email فقط (`wa.me/966538229013?text=...`) | يشتغل 100% في prod بدون backend، أبسط، ما يحتاج serverless | ما يقدر يتابع lead من dashboard (يحتاج webhook لاحق) |
| (Z) `/api/lead` مع تخزين في KV/Redis (لاحقاً) | roadmap صح | يحتاج بنية تحتية، مش في scope هذا |

**توصيتي**: (X) — نفس النمط الموجود في chat.ts. لو المشروع انتقل لـ Vercel/Node، الـ route يشتغل. لو Render static، الـ form يفعّل `wa.me` تلقائياً (نفس نمط `apiAvailability` في chat). **يعطي أفضل تجربة في كل البيئات**.

**سؤالي**: (X) / (Y) / (Z)؟

---

### ❓ القرار #3: SystemPrompts — أكتبها أنا ولا تعطيني محتوى دقيق؟

**الوضع الحالي**: عندي معرفة عامة بـ PDPL/NCA ECC/SFDA/SAMA من محتوى الموقع. أقدر أكتب prompts معقولة تخلي الـ AI يجاوب كخبير حوكمة.

**3 خيارات**:

| الخيار | ما يسوّيه الوكيل | ما تحتاج تسويه أنت |
|---|---|---|
| (α) يكتب الوكيل prompts كاملة من معرفته | 5 prompts فصحى + تحذيرات + CTA | مراجعة وتعديل (10 دقائق) |
| (β) تعطيني الوثائق الرسمية/المصادر | يستخرج منها | تجهيز 5 ملفات MD أو روابط |
| (γ) تكتب أنت الـ prompts | فقط يدمجها | كتابتها بنفسك |

**توصيتي**: (α) — أنا أكتب prompts قوية من واقع الموقع، تعدّلها أنت في 5-10 دقائق لو احتجت.

**سؤالي**: (α) / (β) / (γ)؟

---

## 8. معايير القبول (Definition of Done)

### وظيفي
- [ ] `/kernel/chat/` يستدعي `/api/ai/chat` مع fallback إلى demo لو 404
- [ ] `/kernel/chat/` يعرض أخطاء 429/502/الشبكة بالعربي عند الفشل
- [ ] `/kernel/chat/` يعرض CTA "تواصل معنا" بعد 3 رسائل
- [ ] كل صفحة من الـ 5 (`compliance`, `policies`, `evidence`, `audit`, `scenarios`) فيها قسم "جرّب بالذكاء الاصطناعي"
- [ ] كل قسم AI يجاوب في مجال الصفحة (PDPL للـ compliance، إلخ)
- [ ] كل صفحة من الـ 11 kernel (ما عدا offline) فيها نموذج lead capture
- [ ] `KernelDemoPill` ظاهر في كل صفحة kernel فيها بيانات تجريبية
- [ ] lead form يعمل: POST /api/lead ينجح أو يفتح wa.me fallback

### تقني
- [ ] `chat.ts` **ما تعدّل** (ممنوع، يحمي المفاتيح)
- [ ] **لا استدعاءات من المتصفح** لـ Groq/Gemini مباشرة
- [ ] `npm run build` → 191+ صفحة، 0 أخطاء
- [ ] `npm run verify:all` → exit 0
- [ ] `npm run seo:all` → exit 0
- [ ] `npm run performance:budget` → exit 0
- [ ] لا توجد نصوص سعودية dialect جديدة (فصحى فقط)
- [ ] لا توجد نصوص منشورة معدّلة (قاعدة 2.1)

### بصري
- [ ] كل صفحة تتأكد بصرياً في `npm run preview` (بناءً على checklist القسم 5)

### توثيقي
- [ ] تقرير `report/2026-07-14-kernel-interactive-execution.md` بعد التنفيذ
- [ ] تحديث `brain.md` Section 2 (change ledger)
- [ ] تحديث `brain.md` Section 3 (resolved KIs)

---

## 9. خارج النطاق (Explicitly NOT doing)

- ❌ حذف أو نقل `kernel/api/mock/*.json` (قاعدة 2.1)
- ❌ تعديل `src/pages/api/ai/chat.ts` (يحمي المفاتيح)
- ❌ تعديل نصوص kernel المنشورة (قاعدة 2.1)
- ❌ إضافة React/Three.js/GSAP (ممنوع، قاعدة 2.1)
- ❌ إعادة كتابة layout kernel (موجود وشغال)
- ❌ توسيع `/kernel/*` لصفحات جديدة (مو المطلوب)
- ❌ إعداد pipeline النشر على Vercel/Node adapter (هذا قرار #1)

---

## 10. الجدول الزمني المقترح

| المرحلة | المدة | ملاحظات |
|---|---|---|
| المرحلة 1: المكونات + API route | 1 يوم | لا صفحات تتأثر |
| المرحلة 2: chat.astro | 0.5 يوم | 1 ملف |
| المرحلة 3: 5 صفحات AI | 1.5 يوم | 5 ملفات |
| المرحلة 4: 6 صفحات Lead only | 0.5 يوم | 6 ملفات |
| التحقق النهائي | 0.5 يوم | 11 صفحة + 1 API |
| **المجموع** | **4 أيام** | |

---

## 11. الخطوة التالية

**أحتاج جوابك على 3 أسئلة (القسم 7)** قبل ما أبدأ:

1. **Hosting**: (A) Vercel / (B) Node adapter on Render / (C) demo-only in prod
2. **Lead capture**: (X) /api/lead + WhatsApp fallback / (Y) WhatsApp only / (Z) KV/Redis
3. **SystemPrompts**: (α) أنا أكتبها / (β) تعطيني وثائق / (γ) تكتبها أنت

بعد جوابك، أبدأ المرحلة 1 فوراً (لها صفر اعتماد على هذه القرارات — بس تجهيز البنية التحتية).

إذا تبي أناقش قرار معين قبل ما أبدأ، قل لي.
