# 🚀 5 برومبتز لتعزيز إنتاجيتك — مبنية على مقال ClaudeDevs "Getting Started with Loops"

> **المصدر:** [مقال ClaudeDevs عن Loops](https://x.com/ClaudeDevs/status/2074208949205881033)
> **مخصصة لـ:** سير عمل BrightAI الحالي (Astro + 38 skill + SEO + Design System)

---

## التحليل: أين أنت الآن وأين الفجوة؟

| الجانب | حالتك الحالية | ما يقوله المقال |
|---|---|---|
| **Skills** | 38 مهارة ممتازة في `.agents/skills/` | ✅ أنت متقدم — لكن المهارات تُستدعى يدوياً |
| **Verification** | `npm run build` + `verify:all` + `seo:gate` | ⚠️ التحقق يدوي — يمكن تحويله لـ self-verification loop |
| **Loop Type** | Turn-based فقط (برومبت → نتيجة → برومبت تالي) | 🔴 لا تستخدم `/goal` أو `/schedule` أو proactive loops |
| **Code Review** | عندك `requesting-code-review` skill لكن لا يُفعّل تلقائياً | ⚠️ المقال يقول: "reviewer with fresh context is less biased" |
| **Token Management** | برومبتات طويلة جداً (~640 سطر في prompts.md) | 🔴 المقال يقول: "use scripts for deterministic work" |

---

## البرومبت 1: 🔄 تحويل التحقق اليدوي إلى SKILL.md ذاتي التحقق

> **الفكرة من المقال:** "You can improve the verification step by encoding your manual steps as a SKILL.md so Claude can check more of its own work, end-to-end."
>
> **المشكلة عندك:** كل مرة تنتهي من مهمة، تشغّل 4-5 أوامر تحقق يدوياً (`build` + `verify:all` + `seo:gate` + `seo:all` + `performance:budget`). هذا يستهلك وقتك ويخاطر بنسيان خطوة.

```text
ROLE:
Workflow Automation Engineer for BrightAI.

OBJECTIVE:
أنشئ SKILL.md واحد اسمه "post-task-verification" في `.agents/skills/`
يُشغَّل تلقائياً بعد كل مهمة تطوير.

TASKS:
1) اقرأ worklog.md وحلّل الأوامر التي أشغّلها يدوياً بعد كل مهمة.
   استخرج القائمة الكاملة:
   - npm run build
   - npm run verify:all
   - npm run seo:gate
   - npm run seo:all
   - npm run performance:budget
   - grep للتأكد من عدم تغيير النصوص العربية
   - find dist للتأكد من عدم وجود ملفات مكررة

2) أنشئ SKILL.md يحتوي:
   - Frontmatter: name, description, trigger conditions
   - قسم "Verification Steps": كل أمر + معيار النجاح/الفشل
   - قسم "Quantitative Gates": 
     * Build: 0 errors
     * SEO Gate: 0 errors, 0 warnings
     * Performance Budget: HTML < 80KB, CSS < 50KB
     * Arabic Content: 0 deleted lines matching `[\u0600-\u06FF]`
   - قسم "On Failure": ماذا يفعل الوكيل (يصلح تلقائياً أم يبلغك)

3) أنشئ scripts/post-task-verify.sh يشغّل كل الأوامر ويُخرج
   تقرير PASS/FAIL بصيغة JSON.

ACCEPTANCE CRITERIA:
- الـ skill يُستدعى بعد أي مهمة dev بدون تدخل يدوي.
- النتيجة: تقرير واحد بدل 5 أوامر منفصلة.
- الوقت الموفّر: ~3-5 دقائق لكل مهمة.

DELIVERABLES:
- .agents/skills/post-task-verification/SKILL.md
- scripts/post-task-verify.sh
```

---

## البرومبت 2: 🎯 استخدام /goal للمهام المعقدة بدل Turn-based

> **الفكرة من المقال:** "When you define the success criteria, Claude doesn't have to make a determination on what is 'good enough' and end the loop early."
>
> **المشكلة عندك:** مهام مثل "Mobile LCP من 8 ثوان إلى 2.5 ثانية" أو "CSS من 170KB إلى 50KB" — هذه مهام تحتاج تكرار وتجربة، مش برومبت واحد.

```text
ROLE:
Performance Optimization Engineer.

CONTEXT:
BrightAI عنده مشكلتين حرجتين مقاسة:
1. Mobile LCP = 8.0-8.6 ثانية (المعيار: < 2.5s)
2. CSS BaseLayout = 170KB (المعيار: < 50KB)
3. HTML Homepage = 154KB (المعيار: < 80KB)

GOAL (استخدم /goal):
خفّض Mobile LCP إلى أقل من 2.5 ثانية مع الحفاظ على:
- SEO score ≥ 95
- A11y ≥ 94
- 0 Arabic content deleted
- Desktop perf ≥ 93

SUCCESS CRITERIA (للـ evaluator):
- Lighthouse Mobile Performance ≥ 85
- LCP ≤ 2500ms
- npm run build = 0 errors
- npm run seo:gate = 0 errors

STOP AFTER: 8 محاولات كحد أقصى.

APPROACH:
في كل محاولة:
1. قِس الحالة الحالية (lighthouse --preset=perf --form-factor=mobile)
2. حدّد أكبر bottleneck
3. عالجه بتغيير واحد فقط
4. قِس مرة ثانية
5. إذا تحسّن → التالي، إذا ساء → ارجع

لا تعالج أكثر من bottleneck واحد في كل محاولة.
```

---

## البرومبت 3: ⏰ أتمتة مراجعة SEO بـ /schedule

> **الفكرة من المقال:** "Some agentic work is recurring: the task stays the same and only the inputs change... you can trigger when Claude runs with /loop"
>
> **المشكلة عندك:** عندك 12 مهارة SEO (seo-page, seo-schema, seo-technical, seo-content...) لكنك تشغّلها يدوياً. الموقع يتغيّر باستمرار ولا أحد يراقب.

```text
ROLE:
SEO Monitoring Agent for BrightAI.

SCHEDULE (استخدم /schedule):
كل يوم أحد الساعة 8 صباحاً بتوقيت السعودية.

ROUTINE:
1) شغّل `npm run build` وتأكد من 0 errors.

2) شغّل فحص SEO مختصر على أهم 5 صفحات:
   - / (الرئيسية)
   - /solutions/ 
   - /kernel/
   - /about/
   - /blog/

3) لكل صفحة افحص:
   - Title tag (موجود + أقل من 60 حرف)
   - Meta description (موجودة + 120-160 حرف)
   - H1 واحد فقط
   - JSON-LD valid
   - hreflang صحيح (AR ↔ EN)
   - Canonical صحيح
   - الصور عندها alt text

4) قارن النتائج مع آخر فحص (إن وجد).

5) أنشئ تقرير أسبوعي مختصر:
   - ✅ عدد الصفحات السليمة
   - ⚠️ مشاكل جديدة ظهرت
   - 📈 مشاكل تم حلها من الأسبوع الماضي

OUTPUT:
- reports/seo-weekly/YYYY-MM-DD.md
- إذا كان هناك مشكلة حرجة (مثل canonical مكسور أو h1 مفقود)
  → أبلغ فوراً بدل الانتظار للأسبوع القادم.

STOP CONDITION:
لا تتوقف — استمر كل أسبوع حتى أوقفك يدوياً.
```

---

## البرومبت 4: 🧹 تحويل البرومبتات الطويلة إلى Scripts قابلة لإعادة الاستخدام

> **الفكرة من المقال:** "Running a script is cheaper than reasoning through the steps. A PDF skill can ship a form-filling script that Claude runs each time, instead of re-deriving the code."
>
> **المشكلة عندك:** `prompts.md` = 640 سطر. كل برومبت يحتوي ROLE + TASKS + FORBIDDEN + ACCEPTANCE CRITERIA + DELIVERABLES. الكثير من هذا متكرر ويمكن أتمتته.

```text
ROLE:
DevOps Engineer + Prompt Optimizer.

OBJECTIVE:
حوّل الأنماط المتكررة في prompts.md إلى scripts و skills
قابلة لإعادة الاستخدام بدلاً من إعادة كتابتها كل مرة.

TASKS:
1) اقرأ prompts.md (640 سطر) واستخرج الأنماط المتكررة:
   - "ULTRA-STRICT CONSTRAINTS" (10 قواعد) — متكررة في كل برومبت
   - "FORBIDDEN" blocks — نفسها تقريباً
   - "DELIVERABLES: REPORT-XX" — نمط واحد

2) أنشئ:
   a) .agents/skills/brightai-constraints/SKILL.md
      → يحتوي القيود الصارمة كـ skill يُستدعى تلقائياً
      → بدل نسخ 10 قواعد في كل برومبت

   b) scripts/generate-report.sh <REPORT_NUMBER> <TASK_NAME>
      → ينشئ هيكل التقرير تلقائياً بالتنسيق المعتمد
      → يملأ metadata (تاريخ، فرع، وكيل)

   c) scripts/create-task-branch.sh <phase> <task>
      → ينشئ فرع feat/<phase>/<task> تلقائياً
      → يحدّث worklog.md بسطر البداية

3) أعد كتابة prompts.md بحيث:
   - كل برومبت يصير 10-15 سطر بدل 30-40
   - يشير لـ skill القيود بدل تكرارها
   - يستدعي scripts بدل وصف الخطوات

ACCEPTANCE CRITERIA:
- prompts.md يصير < 200 سطر (من 640)
- 0 فقدان في المعلومات (كل شيء انتقل لـ skills أو scripts)
- كل script يعمل standalone بـ `bash scripts/xxx.sh`

DELIVERABLES:
- .agents/skills/brightai-constraints/SKILL.md
- scripts/generate-report.sh
- scripts/create-task-branch.sh
- prompts.md (المحدّث)
```

---

## البرومبت 5: 👥 Code Review تلقائي بوكيل ثانٍ (Second Agent Review)

> **الفكرة من المقال:** "A reviewer with fresh context is less biased and not influenced by the main agent's reasoning. Use the built-in /code-review skill."
>
> **المشكلة عندك:** عندك `requesting-code-review` و `receiving-code-review` كـ skills لكنها لا تُفعَّل تلقائياً. كل التعديلات تمر بدون مراجعة مستقلة.

```text
ROLE:
Quality Assurance Architect.

OBJECTIVE:
صمّم نظام مراجعة تلقائي يستخدم وكيل ثانٍ مستقل
لمراجعة كل تغيير قبل أن يصلك للموافقة.

TASKS:
1) أنشئ .agents/skills/auto-code-review/SKILL.md يحتوي:

   TRIGGER: يُستدعى تلقائياً عند أي من:
   - إنشاء PR
   - اكتمال مهمة (بعد post-task-verification)
   - قبل merge لأي فرع feat/*

   REVIEW CHECKLIST:
   a) Arabic Content Integrity:
      - هل تم حذف أي نص عربي؟ (diff grep [\u0600-\u06FF])
      - هل hreflang AR↔EN لا يزال صحيحاً؟
      
   b) Design System Compliance:
      - هل الـ CSS يستخدم توكنز tokens.css فقط؟
      - هل في inline styles جديدة؟
      - هل الـ components تتبع canonical patterns؟
      
   c) SEO Preservation:
      - هل canonical URLs لم تتغير؟
      - هل JSON-LD لا يزال valid؟
      - هل meta descriptions موجودة لكل صفحة جديدة؟
      
   d) Performance Budget:
      - هل حجم CSS الكلي لم يزد أكثر من 5%؟
      - هل حجم HTML لم يزد أكثر من 5%؟
      - هل في assets جديدة > 200KB؟

2) الوكيل المراجع يكتب تقرير مراجعة مختصر:
   - ✅ Approved / ⚠️ Approved with notes / ❌ Rejected
   - قائمة المشاكل المكتشفة مرتبة بالأولوية
   - اقتراحات تحسين (اختيارية)

3) التقرير يُحفظ في reports/code-review/YYYY-MM-DD-<branch>.md

ACCEPTANCE CRITERIA:
- لا يمرّ أي تغيير بدون مراجعة مستقلة.
- المراجع لا يرى reasoning الوكيل الأصلي (fresh context).
- وقت المراجعة < 2 دقيقة لكل PR.
- 0 false positives في أول 5 مراجعات.

DELIVERABLES:
- .agents/skills/auto-code-review/SKILL.md
- scripts/trigger-review.sh
```

---

## 📊 ملخص الأثر المتوقع

| البرومبت | الفجوة المعالجة | الوقت الموفّر | مصدر الفكرة من المقال |
|---|---|---|---|
| **1. Self-Verification** | 5 أوامر يدوية → skill واحد | ~15 دقيقة/يوم | "encode manual steps as SKILL.md" |
| **2. /goal للأداء** | محاولات عشوائية → حلقة مقاسة | ~2-4 ساعات للمهمة | "deterministic criteria are effective" |
| **3. /schedule للـ SEO** | فحص يدوي متقطع → مراقبة أسبوعية | ~30 دقيقة/أسبوع | "recurring work with /loop and /schedule" |
| **4. Scripts بدل Prompts** | 640 سطر → <200 سطر | ~5 دقائق/برومبت | "scripts cheaper than reasoning" |
| **5. Auto Code Review** | مراجعة معدومة → مراجعة تلقائية | يمنع bugs قبل وصولها | "second agent for code reviews" |

> [!TIP]
> **ابدأ بالبرومبت 1** (Self-Verification) لأنه الأسرع تطبيقاً والأكثر أثراً فورياً.
> ثم **البرومبت 4** (Scripts) لتخفيف حجم البرومبتات.
> ثم **البرومبت 2** (/goal) لحل مشكلة Mobile LCP الحرجة.
