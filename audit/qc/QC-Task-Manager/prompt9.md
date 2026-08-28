راجعت **فهارس المصادر كاملة**، وقرأت ملفات المهارات الأساسية المرتبطة مباشرة بالمحاور اللي طلبتها، وراجعت معها تقرير نظامك الحالي ووثائق الـQC. ما خلطت المصادر ببعض بشكل أعمى: `designer-skills` هو المرجع الأوسع للـUX/IA/Research/Design Systems، و`jakubkrehel/skills` ممتاز للتنفيذ الدقيق في accessibility/layout/colors/typography، و`emilkowalski/skills` هو المرجع الأقوى للـmotion البسيط، و`awesome-design-md` استخدمته كمكتبة مقارنة بصرية — خصوصًا أنظمة مثل Airtable وLinear — وليس كنظام ننسخه حرفيًا.

أما `Unsloth` فهو فعليًا منصة/أدوات لتشغيل وتدريب وربط نماذج AI وRAG والـagents، وليس مرجع Design/UI/UX؛ لذلك وزنه عندي **0% في القرارات البصرية**. ممكن يفيد مستقبلًا في طبقة AI المحلية أو الخصوصية، لكن إدخاله في تصميم QC Task Manager بيكون خلط مجالات.

## التقرير

# QC Task Manager — Design / UI / UX Transformation Report

## 1. الحكم العام

النظام الحالي أساسه قوي وما يحتاج إعادة تصميم من الصفر.

تقرير المشروع الحالي يعطي:

| المحور الحالي            | الدرجة |
| ------------------------ | -----: |
| Architecture             |    84% |
| UI Consistency           |    78% |
| UX Usability             |    76% |
| Design System Maturity   |    75% |
| Accessibility            |    82% |
| Responsive Design        |    86% |
| Frontend Maintainability |    72% |
| Frontend Performance     |    78% |

وهذا متوافق مع اللي ظهر من النظام: المشكلة الأساسية مو التقنية، وإنما **design drift + كثافة المعلومات + تعدد الأنماط + طول بعض رحلات العمل**. مثلًا الداشبورد الرئيسي طويل جدًا، ونموذج Lab Test طويل وكثيف، بينما عندك أساس Design System موجود لكنه غير مستخدم بشكل موحد.

### مؤشر النضج التصميمي الشامل

**الحالي التقديري: 72.8%**

**المستهدف بعد الخطة: 91.0%**

**التحسن المتوقع: +18.2 نقطة مئوية**

> النسب الإضافية أدناه هي Design Maturity Scores مبنية على source/runtime evidence الحالي، وليست نتائج UX Research بشرية فعلية. النسب تتحول إلى قياسات مؤكدة بعد جمع baseline حقيقي من المستخدمين.

---

# 2. نسب التطوير المقترحة

| المجال                                 | الحالي | المستهدف | التحسن |
| -------------------------------------- | -----: | -------: | -----: |
| Design System                          |    75% |      92% |    +17 |
| UI Design                              |    78% |      92% |    +14 |
| UX                                     |    76% |      91% |    +15 |
| Interaction Design                     |    74% |      90% |    +16 |
| Information Architecture & Permissions |    79% |      93% |    +14 |
| UX Writing / Microcopy                 |    68% |      91% |    +23 |
| UX Research                            |    45% |      82% |    +37 |
| Accessibility Design                   |    82% |      94% |    +12 |
| Accessibility & Ergonomics             |    70% |      92% |    +22 |
| Service Design                         |    67% |      88% |    +21 |
| Data-Driven Design                     |    72% |      90% |    +18 |
| Dashboard & Data Visualization         |    72% |      92% |    +20 |
| Privacy & Security UX                  |    83% |      94% |    +11 |
| Advanced Form Design                   |    68% |      92% |    +24 |
| Motion & Digital Art System            |    62% |      86% |    +24 |

أكبر فرصة عندك مو في تغيير الألوان أو إضافة مؤثرات؛ أكبر فرصتك في:

**Advanced Forms → UX Research → UX Writing → Ergonomics → Dashboard IA → Design System consolidation.**

---

# 3. توزيع نوع التغييرات

من كامل برنامج التطوير المقترح:

| نوع العمل                     | النسبة |
| ----------------------------- | -----: |
| تحسين الموجود                 |    43% |
| توحيد/استبدال الأنماط القديمة |    25% |
| إضافات UX جديدة               |    20% |
| إعادة هيكلة IA / workflows    |    12% |

يعني تقريبًا **68% من الشغل تطوير لما عندك أصلًا، وليس بناء واجهات جديدة**.

وهذا الصحيح للنظام؛ لأن عندك `AppButton`, `PageHeader`, `StatusPill`, `Banner`, `OperationalState` ومكونات UI فعلية، لكن استخدامها غير كامل وتوجد تطبيقات موازية قديمة.

---

# 4. Design Direction

الهوية الأنسب للنظام:

**Clinical Enterprise + Modern Operational UI**

مو:

* flashy SaaS
* glassmorphism
* neon
* animations كثيرة
* gradients ثقيلة
* cards بكل لون
* dashboard مليان زخرفة

نأخذ من Airtable:

* بساطة الـsurfaces
* وضوح hierarchy
* spacing منظم
* component roles واضحة

ونأخذ من Linear:

* تركيز عالي على المحتوى
* لون accent واحد مضبوط
* surfaces ذات hierarchy واضحة
* borders خفيفة
* density متحكم فيها

لكن **ما نقلد شكل أي واحد منهم**؛ نظام QC له احتياج مختلف.

مبدأ النظام:

> **Operational clarity before visual personality.**

---

# 5. Design System

## المطلوب

إنشاء طبقتين فقط:

### Foundation

* colors
* typography
* spacing
* radius
* elevation
* focus
* motion
* breakpoints
* z-index
* icon sizing

### Semantic Components

* Button
* IconButton
* StatusPill
* Banner
* OperationalState
* Field
* Select
* Textarea
* Checkbox
* Radio
* Date/Time input
* Card
* KPI Card
* Data Panel
* Table
* Pagination
* PageHeader
* Breadcrumbs
* Dialog
* Tooltip
* ContextualHelp

وكل domain-specific component يبنى فوقها.

الـDesign System Governance المناسب هنا **Hybrid**: primitives مركزية، بينما Lab/Tasks/Findings يقدرون يمتلكون patterns خاصة بهم بشرط استخدام نفس foundations. وهذا يتوافق مع منهجية governance في المصدر.

---

# 6. Color System

المشكلة الحالية الأكبر مو اختيار لون سيئ، وإنما **semantic drift**.

عندك أكثر من نظام يمثل:

* Pass
* Fail
* Pending
* Review
* Approved
* Rejected
* Overdue
* Warning
* Critical

وهذا مذكور كـP1 في تقريرك الحالي.

المطلوب:

### Neutral

background / surface / elevated / border / text

### Accent

لون تفاعلي واحد أساسي.

### Semantic

* success
* warning
* danger
* info
* neutral

ثم Domain Mapping:

`PASS → success`
`FAIL → danger`
`OVERDUE → danger`
`UNDER_REVIEW → warning/info حسب المعنى`
`DRAFT → neutral`

ممنوع استخدام لون لمجرد أنه “حلو”.

كل component يستخدم semantic token، مو قيمة لون مباشرة.

وهذا مطابق لمبدأ: **one color, one meaning**.

---

# 7. Typography

النظام يحتاج type scale محدود جدًا.

المقترح:

* Display/Page title
* Section title
* Card title
* Body
* UI body
* Label
* Caption
* Data/ID
* Numeric KPI

مع:

* `tabular-nums` للـKPI والقيم المتغيرة
* `overflow-wrap` للـLOT/IDs
* full-value access لأي truncated QC value
* headings hierarchy حقيقية
* inputs ≥16px على mobile لتجنب Safari auto zoom
* line-height أعلى للنصوص الطويلة

المبدأ: أقل عدد ممكن من الأحجام والأوزان.

---

# 8. Information Architecture

الـIA الحالي جيد تقنيًا لكنه يعكس أجزاء من بنية النظام أكثر مما يعكس رحلة موظف QC.

الهيكل الجديد ما يغير الـURLs بالضرورة.

المطلوب التفكير بالـtasks:

### Work

* My Work
* Tasks
* Reviews
* Notifications

### QC Operations

* Findings
* CAPA
* Evidence

### Laboratory

* Tests
* Products
* Equipment
* Calibration
* Maintenance
* Retests
* Documents

### Intelligence

* Dashboard
* Reports
* Search

### Administration

* Users
* Templates
* System Health
* Settings

Global navigation يجب يفرق عن:

* utility navigation
* local Lab navigation
* contextual record relationships

IA الصحيح لازم يحقق:

* Findability
* Discoverability
* Wayfinding
* Navigation scent

والمستخدم يعرف دائمًا:

1. وين أنا؟
2. وش الحالة؟
3. وش الخطوة الجاية؟
4. كيف أرجع؟
5. وش مرتبط بهذا السجل؟

---

# 9. Information Architecture & Permissions

هذي نقطة مهمة جدًا بنظامك.

RBAC الحالي server-side يعتبر من نقاط القوة، ولازم ما نكسره.

لكن Permissions UX يحتاج طبقة أوضح.

بدل:

`button disappears`

يكون القرار حسب السياق:

### Hide

إذا المستخدم ما له علاقة بالميزة أصلًا.

### Disable + explanation

إذا الميزة تخصه لكن شرط workflow غير مكتمل.

مثال:

`Approve test`
↓
Disabled:
`Complete the required review before approval.`

### Visible + denied state

إذا يحتاج يعرف أن record موجود لكن ليس مسموح له فتحه.

المهم:

**الواجهة توضح permission، لكن السيرفر يبقى المصدر الحقيقي للصلاحية.**

---

# 10. Interaction Design

التفاعل لازم يكون predictable.

كل action يحتاج حالات:

* idle
* hover
* focus-visible
* pressed
* loading
* success
* validation error
* server error
* permission blocked
* disabled

Primary action واحد واضح في كل operational context.

مثال Lab Test:

`Save Draft` = secondary

`Submit for Review` = primary

`Delete/Cancel` = danger/tertiary منفصل

ولا يصير عند المستخدم 3 أزرار كلها بنفس القوة البصرية.

---

# 11. Feedback & Error UX

النظام حاليًا عنده:

* Banner
* FlashNotice
* OperationalState
* EmptyState
* raw alerts

وهذا يسبب overlap.

التوحيد:

### Field error

ملاصق للحقل.

### Form summary

فوق النموذج + links للأخطاء.

### Inline Banner

مشكلة أو warning تخص section.

### OperationalState

مشكلة/empty/error تخص الصفحة.

### Toast

عملية قصيرة ناجحة، وليست معلومة critical.

كل رسالة خطأ:

**What happened → Why if useful → What to do next**

---

# 12. Advanced Form Design

هذا أعلى محور يستاهل شغل.

`LabTestForm` الحالي أكثر من 1,200 سطر، ويعرض 8 sections، والرحلة على 390px تتجاوز تقريبًا 6,000px.

لا نحذف معلومات QC.

بدل كذا:

### Section Navigator

* Product
* Batch
* Sampling
* Reference
* Measurements
* Results
* Review
* Authorization

لكل section:

* Not started
* In progress
* Complete
* Error

### Sticky Progress

يبين:
`5 / 8 sections complete`

### Save state

واضح:
`Saved 10:42 AM`

### Progressive disclosure

Reference information يظهر في الوقت اللي يحتاجه المستخدم.

### Error navigation

`3 fields need attention`
مع link لكل حقل.

### Review step

قبل final submit، خصوصًا لأنها بيانات QC عالية الحساسية.

المصدر يوصي أصلًا بـreview step في النماذج عالية المخاطر، وحفظ التقدم، وعدم فقدان البيانات، وربط الأخطاء بالحقل.

---

# 13. Dashboard Design

الداشبورد الحالي قوي بالمعلومات لكن ضعيف بالأولوية.

المشكلة مو “عدد الـcharts”.

المشكلة:

**وش أول شيء المفروض المدير يشوفه؟**

الترتيب المقترح:

### Layer 1 — Action Required

* overdue
* failed tests
* pending approvals
* calibration due
* blocked tasks
* critical findings

### Layer 2 — Today's Operations

* inspections/tests today
* workload
* pending reviews
* active batches

### Layer 3 — Trends

* pass/fail rate
* turnaround time
* repeated failure
* workload trend

### Layer 4 — Analysis

drilldowns / detailed analytics / exports.

بدل dashboard بطول ~6,752px في viewport الكبير.

---

# 14. Data Visualization

قاعدة أساسية:

**Chart فقط إذا chart أفضل من رقم أو جدول.**

المقترح:

* KPI → number
* categorical comparison → bar
* trend → line
* Pass/Fail composition → stacked bar أو donut إذا categories قليلة
* distributions → histogram
* correlation → scatter
* matrix → heatmap

مع:

* target/benchmark
* previous period comparison
* direct labels
* accessible text alternative
* table fallback
* نفس اللون لنفس المعنى بين كل الرسومات

وعلى mobile:
إذا الرسم فقد المعنى → يتحول لـsummary + table.

---

# 15. Data-Driven Design

أي تغيير كبير نربطه بقياس.

المقاييس المقترحة:

### Lab form

* completion rate
* median completion time
* validation errors per test
* section abandonment
* draft recovery rate

### Dashboard

* time-to-first-action
* drilldown usage
* urgent item discovery rate

### Search

* successful search rate
* zero-result rate
* reformulation rate

### Review

* time to decision
* rejection/rework rate

المبدأ:

baseline أولًا → تغيير → مقارنة.

HEART/Task Success مناسبة كأساس.

---

# 16. UX Writing / Microcopy

لازم نسوي Terminology Dictionary.

مثال canonical vocabulary:

* Save Draft
* Submit for Review
* Approve
* Reject
* Reopen
* Close
* Request Deletion
* Pass
* Fail
* Retest Required
* Calibration Due

ونمنع تنويعات مثل:

`Save`
`Save Changes`
`Save & Continue`
`Update`
إذا كلها تعني نفس العملية.

Buttons تكون outcome-oriented.

بدل:
`Submit`

يصير:
`Submit for Review`

بدل:
`Error`

يصير:
`Test could not be submitted. Complete the three required fields below.`

---

# 17. UX Research

هذا أضعف محور حاليًا من ناحية الأدلة البشرية.

الـautomated/runtime QA قوي، لكنه مو بديل عن موظف QC يستخدم النظام فعلًا.

خطة البحث:

### Segment 1

QC Employee

### Segment 2

Supervisor

### Segment 3

Manager

### Segment 4

Lab operator / reviewer

5–8 مشاركين لكل segment إذا أمكن.

اختبر:

* Create test
* Save draft
* Resume
* Submit
* Review
* Reject/rework
* Find batch
* Find overdue item
* Calibration workflow
* Generate report

نقيس:

* task success
* time
* errors
* assistance required
* SEQ
* SUS

---

# 18. Service Design

QC Task Manager مو مجرد صفحات.

هو خدمة تربط:

User action
↓
UI
↓
Validation
↓
Permission
↓
Database
↓
Audit
↓
Notifications
↓
Reviewer
↓
Final record

نسوي Service Blueprint لأهم 4 flows:

1. Inspection/Test lifecycle
2. Finding → CAPA → Evidence
3. Equipment → Calibration → Maintenance
4. Controlled Document lifecycle

ونرسم:

* User
* Frontstage
* Backstage
* System
* Audit
* Notifications
* Failure points

هذا يكشف مشاكل handoff اللي ما تبين في شاشة واحدة.

---

# 19. Accessibility Design — A11y

المستهدف:

**WCAG 2.2 AA + operational ergonomics**

أبرز التعديلات:

* 44×44 touch targets للعمليات الأساسية
* `focus-visible`
* keyboard complete workflows
* native semantic controls
* accessible names
* correct dialog focus
* error announcements
* live regions
* no color-only status
* 200% zoom
* reflow عند 320px
* reduced motion
* screen-reader review

التقرير الحالي أصلًا كشف icon controls بالNavbar أصغر من target المقترح.

والـaccessibility skill يوصي بـ44px touch عندما تسمح الكثافة، مع minimum AA baseline أقل من ذلك.

---

# 20. Ergonomics

لأن النظام يستخدم بشكل متكرر، لازم نحسب **عدد الحركات الذهنية والبدنية**.

نقلل:

* pointer travel
* repetitive scrolling
* repeated typing
* changing context
* jumping بين أعلى وأسفل الصفحة
* unnecessary dialogs
* tiny controls

ونزيد:

* sticky action area
* defaults
* remembered filters
* keyboard support
* section navigation
* direct record relationships
* large enough targets

---

# 21. Motion System

الـMotion عندك لازم يكون **شبه غير محسوس**.

ليس animation showcase.

## QC Motion Tokens

### Instant

`0–50ms`

للstate changes اللي ما تحتاج حركة.

### Fast

`100ms`

hover / pressed / checkbox / subtle color feedback.

### Normal

`160ms`

tooltip / small disclosure / menu.

### Panel

`220ms`

dialog / drawer / expandable section.

### Maximum operational motion

`240ms`

أي شيء فوقها يحتاج سبب قوي جدًا.

المصادر نفسها تؤكد إن motion عالي التكرار يكون شبه معدوم، وأن العمليات المستخدمة مئات المرات يوميًا ما تحتاج animation أصلًا.

## Animate فقط

* opacity
* transform صغير جدًا
* color
* border
* shadow

## ممنوع

* page entrance animations
* floating cards
* parallax
* bouncing
* scale-heavy animations
* animated KPIs
* chart intro fireworks
* gradient movement
* decorative looping
* `transition: all`
* animations على keyboard actions

`prefers-reduced-motion` mandatory.

---

# 22. Digital Art

الـDigital Art يكون محدود.

أفضل استخدام:

* Empty states
* AI advisory
* onboarding/help
* system health
* no-results

ويكون:

* static أو شبه static
* monochrome/duotone
* line-based
* geometric
* مرتبط بالسياق

لا نضيف illustrations داخل:

* Lab Test data entry
* approvals
* Pass/Fail decisions
* calibration records
* audit timeline

لأنها تزيد noise بدون قيمة تشغيلية.

---

# 23. Privacy & Security UX

الجانب التقني عندك قوي أصلًا.

الـAI advisory غير مخول بتغيير workflow، ومفاتيح الـprovider ما تنعرض، والعمليات يتم تدقيقها.

المطلوب UX فوق هذا الأساس:

### Permission explanation

وضح ليه action غير متاح.

### AI Transparency

كل AI output يحمل:

`AI advisory — verify before use`

ولا يبدو كقرار QC رسمي.

### Sensitive action

قبل destructive operation:

* what will happen
* affected record
* whether reversible
* audit consequence

### Authentication

security warnings تكون actionable.

### Session state

لو الجلسة انتهت أثناء form طويل:
لا نخسر مدخلات المستخدم بدون تفسير.

---

# 24. أهم الأشياء اللي ما أنصح نغيرها

لا تغير:

* Astro SSR
* SQLite لمجرد الحداثة
* server-side RBAC
* audit model
* PrintLayout
* current security boundary
* domain validation
* AI advisory-only principle
* existing responsive architecture الناجح
* كامل design stack إلى UI framework جديد

النظام يحتاج **consolidation** أكثر من rewrite.

---

# 25. الأولويات

## P1

1. Semantic status system
2. Advanced Lab Form
3. Action/Button hierarchy
4. Dashboard priority architecture
5. Navbar accessibility/interaction
6. Error/feedback system
7. IA + permissions UX

## P2

8. PageHeader adoption
9. Tables/mobile data
10. Typography/token cleanup
11. UX Writing dictionary
12. Motion tokens
13. Dashboard chart rules
14. Service blueprints

## P3

15. Digital art
16. aesthetic refinement
17. minor micro-interactions

---

# 26. النتيجة النهائية

النظام ما يحتاج يكون “أكثر حيوية”.

يحتاج يكون:

**أوضح + أسرع + أقل أخطاء + أكثر اتساقًا + أسهل في المسح البصري + أسهل في الإدخال + أوضح بالصلاحيات والحالات.**

إذا تنفذت الخطة بالشكل الصحيح، المستهدف الواقعي:

**Design/UX maturity ≈ 90–92%**

بدون تغيير هوية النظام التقنية وبدون تحويله لمشروع استعراضي.

النقطة الأهم بالـmotion: تعليمات Emil واضحة جدًا بأن السؤال الأول هو **هل العنصر يحتاج يتحرك أصلًا؟**، والعمليات عالية التكرار الأفضل تكون بدون animation. هذا مناسب جدًا لنظام QC.  كذلك motion audit نفسه يوصي أولًا بجرد كل `transition`, `animation`, `keyframes` ثم توحيد الموجود بدل إنشاء نظام موازي.

## البرومبتات التنفيذية

هذي مصممة تتنفذ **بالترتيب**؛ كل برومبت له scope واضح، وما فيه واحد يفترض إعادة بناء المشروع.

# QC TASK MANAGER — DESIGN/UX IMPLEMENTATION PROGRAM

## GLOBAL RULES FOR EVERY PROMPT

Repository:
`YEEEAE/BRIGHTAI`

Application:
`apps/qc-task-manager/`

Before implementation:

1. Read `AGENTS.md`.
2. Read `.agents/mind/01-mind-latest.md` completely.
3. Read the relevant current documents under:
   `apps/qc-task-manager/docs/`
4. Read the relevant skills from `.agents/skills/` completely before changing code.
5. Inspect the CURRENT source and working tree. Never trust an old report without verifying the current implementation.
6. Follow the existing Astro SSR + React + TypeScript + Tailwind architecture.
7. Do NOT migrate to Next.js or another frontend framework.
8. Preserve server-side RBAC, audit integrity, workflows, database integrity, CSRF protections and existing QC rules.
9. Do not modify a business rule merely to make the UI easier.
10. Do not install another UI or motion framework unless the existing stack cannot implement a required behavior.
11. Reuse existing components/tokens before adding new ones.
12. Do not create duplicate abstractions.
13. All visual decisions must improve operational clarity.
14. Keep animation extremely subtle.
15. Do NOT commit or push.
16. Update project mind according to repository instructions after the implementation.
17. Respond to the user in Saudi Arabic.

Run the relevant existing tests after every workstream and never claim PASS from stale results.

---

# PROMPT 01 — DESIGN SYSTEM FOUNDATION

## Role

Act as a senior enterprise design-system architect and frontend engineer.

## Goal

Turn the current partial QC Task Manager design system into one coherent operational design language without changing the product's underlying architecture.

## Skills

Read and apply all relevant local skills corresponding to:

* design-token
* design-token-audit
* component-spec
* design-system-governance
* design-system-adoption
* color-system
* spacing-system
* typography-scale
* better-colors
* better-layout
* better-typography
* better-interface
* accessibility-audit

## Inspect

At minimum:

* `src/components/ui/`
* `src/styles/global.css`
* `tailwind.config.mjs`
* `src/layouts/BaseLayout.astro`
* task components
* lab components
* dashboard
* search
* reports
* admin
* manager
* supervisor
* employee screens

## Implement

Create or consolidate canonical semantic design tokens for:

* background
* surface
* elevated surface
* border
* strong border
* text-primary
* text-secondary
* text-muted
* accent
* focus
* success
* warning
* danger
* info

Define a constrained spacing vocabulary.

Define typography roles rather than arbitrary font sizes.

Define canonical radius roles.

Define focus tokens.

Define motion tokens but do not yet add animations.

Components must consume semantic roles rather than raw appearance values whenever practical.

Do not bulk-rewrite stable screens blindly.

Prioritize high-frequency shared primitives first.

## Component contract

Establish the canonical role of:

* AppButton
* StatusPill
* Banner
* OperationalState
* PageHeader
* Pagination
* ContextualHelp

Determine which older equivalents can be adapted/deprecated.

Document explicit migration strategy rather than deleting compatibility immediately.

## Preserve

* Current brand identity
* Existing Tailwind stack
* WCAG contrast
* existing print appearance unless necessary
* business/domain semantics

## Verification

Run:

* typecheck
* UI consistency tests
* badge contrast
* architecture guard
* responsive checks
* build

Perform source scans for arbitrary duplicated token values after migration.

## Definition of done

The application has one documented foundational token vocabulary, canonical primitive ownership is clear, and no new parallel design system has been created.

---

# PROMPT 02 — STATUS SEMANTICS + OPERATIONAL COLOR

## Goal

Create one product-wide semantic status system.

## Skills

Use:

* color-system
* better-colors
* accessibility-audit
* better-accessibility
* component-spec
* design-token
* visual-hierarchy

## Audit all statuses

Include:

* Tasks
* Findings
* CAPA
* Evidence
* Lab Tests
* Documents
* Products
* Equipment
* Calibration
* Maintenance
* Retests
* Notifications
* User/account states
* AI states

Inventory:

`domain value → current label → current color → current component → desired semantic meaning`

## Canonical semantic layer

Do not force every domain to share the same raw enum.

Instead define presentation semantics:

* neutral
* info
* pending
* warning
* success
* danger
* blocked

Domain adapters translate domain values into these semantic presentation roles.

Status always communicates through:

* text
* color
* and where necessary icon/state cue

Never color alone.

## Replace

Incrementally consolidate:

* StatusPill
* StatusBadge
* QcStatusBadge
* Lab-specific badge mappings
* page-local status maps

Do not break backwards compatibility without a deliberate migration.

## Verification

Test every meaningful state, contrast pair, dark/light surface in use, print where applicable, and mobile rendering.

Add/update UI consistency guards so future duplicate semantic status systems are detected.

---

# PROMPT 03 — INFORMATION ARCHITECTURE + PERMISSIONS

## Goal

Reorganize how users understand and traverse the QC product without blindly changing URLs.

## Skills

Use:

* information-architecture
* navigation-patterns
* card-sort-analysis
* jobs-to-be-done
* service-blueprint
* better-layout
* better-interface
* accessibility-audit
* state-machine

## Build current IA inventory

Map:

* routes
* global navigation
* role navigation
* utility navigation
* Lab navigation
* breadcrumbs
* contextual links

Then map user tasks rather than folders.

## Proposed conceptual model

Evaluate:

Work
QC Operations
Laboratory
Intelligence
Administration

Do not implement labels just because they appear in this prompt. Verify them against actual domain vocabulary and current workflows first.

## Permissions UX

For every major action classify:

* unavailable and irrelevant → hide
* relevant but workflow-blocked → visible disabled state with reason
* permission denied but context should remain visible → explicit restricted state
* authorized → available

Never use client visibility as authorization.

Server permissions remain authoritative.

## Record relationships

Improve contextual traversal:

Task → Finding → CAPA → Evidence

Product → Test → Review → Retest → Report

Equipment → Calibration → Maintenance

Document → Version → Acknowledgement → Change Request

Users should not need to return to the root navigation for naturally connected records.

## Verify

Test navigation for Employee, Supervisor, Manager, Admin and Lab-relevant roles.

Verify breadcrumbs, active states, focus, mobile menu, back-navigation and direct URLs.

---

# PROMPT 04 — CORE UI CONSOLIDATION

## Goal

Remove visible UI drift across high-frequency QC screens.

## Skills

Use:

* better-interface
* better-layout
* better-colors
* better-typography
* visual-hierarchy
* gestalt-proximity
* spacing-system
* responsive-design
* component-spec

## Standardize

Across high-frequency screens:

* page headers
* action rows
* card/panel anatomy
* labels
* field spacing
* borders
* status positions
* section headers
* alerts
* empty states
* tables
* pagination

Adopt existing primitives where they already solve the need.

Do not create a generic component if two screens merely happen to look similar.

## Visual hierarchy

Each screen must clearly expose:

1. Where am I?
2. What record/state am I looking at?
3. What needs my attention?
4. What is the primary next action?
5. What secondary information is available?

## Density

This is a professional QC tool.

Do not over-space everything.

Create deliberate density tiers:

* comfortable default
* dense data/table
* print

Do not create a user-facing density setting unless evidence shows it is needed.

---

# PROMPT 05 — ADVANCED QC FORM SYSTEM

## Goal

Make laboratory and operational forms significantly faster, clearer and safer without removing required QC information.

## Skills

Use:

* form-design
* error-handling-ux
* better-accessibility
* better-layout
* better-writing
* fitts-law
* hicks-law
* millers-law
* zeigarnik-effect
* state-machine
* responsive-design

## Highest-priority surface

Start with:

`src/components/lab/LabTestForm.tsx`

Do not simply cosmetically restyle it.

## Architecture

Separate stable responsibilities such as:

* draft/session lifecycle
* section completion
* field groups
* reference information
* measurements/results
* review/authorization
* validation/error navigation
* submission state

Do not move server/domain rules into React.

## UX

Implement a section-oriented form journey.

Each section may expose:

* not started
* in progress
* complete
* error

Add reliable section navigation for long forms.

Keep all required data available.

Use progressive disclosure only for secondary/reference information.

Do not hide critical requirements.

## Save behavior

Clearly communicate:

* unsaved
* saving
* saved
* save failed

Prevent accidental loss.

Preserve values after validation errors.

## Validation

Field error:
adjacent to field.

Form summary:
focusable and links to invalid fields.

Focus first relevant failure after submit.

Do not validate every keystroke unless there is a genuine safety reason.

## Final submission

For high-impact QC submission, provide an explicit review/confirmation step when the operation cannot be casually reversed.

## Mobile

Verify at:

320
375
390
430
768
1024+

No horizontal overflow.

No unreachable sticky actions.

No input below the practical mobile typography floor.

---

# PROMPT 06 — INTERACTION DESIGN + FEEDBACK

## Goal

Create one predictable interaction language across the product.

## Skills

Use:

* feedback-patterns
* error-handling-ux
* loading-states
* micro-interaction-spec
* state-machine
* doherty-threshold
* fitts-law
* better-accessibility

## Define states

For actionable components:

* default
* hover
* focus-visible
* pressed
* loading
* success
* warning
* error
* disabled
* permission-blocked

## Loading

Never leave the user guessing whether an action was received.

Keep button label context where possible.

Avoid global spinners for local actions.

Use skeletons only where they reduce layout uncertainty.

## Destructive actions

Clearly distinguish:

* delete request
* reject
* cancel
* revoke
* irreversible administrative actions

Confirm based on consequence, not just because an action is red.

Avoid unnecessary confirmation for easily reversible actions.

## Recovery

Every error must tell the user what action is available next.

Preserve context and entered data.

---

# PROMPT 07 — MOTION & DIGITAL ART

## Goal

Create a restrained enterprise QC motion language.

The purpose is feedback and state comprehension — NOT visual entertainment.

## Skills

Read completely:

* motion-system
* animation-principles
* animate
* improve-animations
* review-animations
* find-animation-opportunities
* motion-and-zoom
* better-accessibility

## First audit

Search the entire application for:

* transition
* transition-all
* animation
* keyframes
* transform
* opacity
* hover transforms
* easing
* durations
* client-side animation code
* prefers-reduced-motion

Inventory current motion before changing it.

## Motion policy

High-frequency interaction:
instant or ~100ms.

Normal subtle feedback:
100–160ms.

Menu/disclosure:
~160ms.

Dialog/panel:
up to ~220ms.

Operational default maximum:
~240ms.

Anything slower requires explicit justification.

## Properties

Prefer:

* opacity
* transform
* color
* border color
* shadow

Do not animate layout dimensions unless unavoidable.

## Do NOT add

* page entrance motion
* parallax
* floating elements
* animated gradients
* bouncing
* decorative loops
* animated KPI counters
* chart spectacle
* large scale transforms
* unnecessary stagger
* motion on keyboard-heavy repeated workflows

No `transition: all`.

## Reduced motion

Implement one global coherent strategy.

Movement-based transitions reduce to immediate state change or subtle opacity.

Essential state remains understandable without motion.

## Digital art

Restrict artwork to:

* empty state
* onboarding/help
* AI advisory
* no results
* system health

Use a consistent geometric/line illustration vocabulary.

Do not place decorative artwork inside critical data-entry or decision screens.

---

# PROMPT 08 — UX WRITING / MICROCOPY

## Goal

Create a consistent QC product language.

## Skills

Use:

* ux-writing
* content-strategy
* localization-design
* error-handling-ux
* accessibility-audit

## Inventory

Extract user-visible:

* buttons
* field labels
* helper text
* status labels
* errors
* confirmations
* empty states
* tooltips
* permission messages
* AI messages
* notifications

## Create terminology dictionary

For every important operation define:

Preferred term
Meaning
Do not use variants
Where used

Examples to validate:

* Save Draft
* Submit for Review
* Approve
* Reject
* Reopen
* Close
* Pass
* Fail
* Retest Required

## Rules

Clear over clever.

Outcome-specific button labels.

No internal developer terminology.

Errors:

what happened
why when useful
what to do next

Permission copy explains the requirement without leaking security-sensitive implementation details.

AI copy must never imply that AI made an authoritative QC decision.

Keep wording suitable for future localization.

---

# PROMPT 09 — DASHBOARD + DATA VISUALIZATION

## Goal

Turn dashboard screens from information collections into decision-support surfaces.

## Skills

Use:

* data-visualization
* visual-hierarchy
* critique-information-density
* metrics-definition
* better-interface
* responsive-design
* accessibility-audit

## Manager dashboard

Re-prioritize without deleting useful data.

Tier 1:
Action Required.

Tier 2:
Today's Operations.

Tier 3:
Trends.

Tier 4:
Analysis / drilldowns.

Urgent operational work must not live beneath multiple analytics sections.

## Every visualization must answer a question

Before retaining any chart state:

1. What user question does it answer?
2. Why is a chart better than a number/table?
3. What action can follow?
4. Is the encoding consistent elsewhere?

Remove chart decoration that communicates nothing.

## Standards

* bars for comparison
* lines for time trends
* distribution charts when distribution matters
* direct labels where possible
* benchmarks/targets
* comparable periods
* accessible alternative
* consistent status encoding

## Mobile

Prefer useful simplified representation over shrinking a desktop chart.

Provide table/summary alternative where necessary.

---

# PROMPT 10 — DATA-DRIVEN DESIGN INSTRUMENTATION

## Goal

Give the product measurable UX outcomes without introducing invasive analytics.

## Skills

Use:

* metrics-definition
* design-impact-reporting
* usability-test-plan
* opportunity-framework
* privacy-related existing project documentation

## Define UX metrics

At minimum investigate:

Lab:

* completion rate
* completion duration
* error rate
* save/recovery
* sections causing errors

Dashboard:

* first meaningful action
* urgent-item discovery
* drilldown usage

Search:

* zero results
* reformulation
* successful result interaction

Review:

* time to decision
* rework rate

## Privacy

Do not record sensitive test values, passwords, secrets or unnecessary user content merely for UX analytics.

Prefer event metadata over payload content.

Document:

event
reason
data fields
retention
access
expected design question

## Measurement

Capture baseline before judging the new UI.

Do not report a design improvement from anecdote alone when telemetry can answer it.

---

# PROMPT 11 — ACCESSIBILITY + ERGONOMICS

## Goal

Bring all primary QC workflows to a consistently strong WCAG 2.2 AA and ergonomic standard.

## Skills

Use:

* accessibility-audit
* better-accessibility
* focus-and-keyboard
* hit-areas
* forms accessibility
* screen-readers
* semantics-and-aria
* motion-and-zoom
* better-layout
* better-typography
* responsive-design
* fitts-law

## Audit

Keyboard-only complete workflows.

Screen-reader accessible names/states.

Focus visibility.

Focus order.

Dialogs.

Menus.

Forms.

Live regions.

Status.

Tables.

Charts.

Mobile targets.

200% zoom.

320px reflow.

Reduced motion.

## Hit targets

Target 44×44 for important touch controls where density permits.

Do not enlarge the visible icon unnecessarily; enlarge the interaction area.

## Navigation semantics

Resolve the current custom menu semantics deliberately.

Either:

use disclosure navigation semantics

OR

implement a complete menu keyboard model.

Do not keep an incomplete hybrid.

## Ergonomics

Measure repeated physical cost:

scrolling
pointer travel
focus travel
re-entry
repetitive typing

Reduce friction for high-frequency users before adding visual polish.

---

# PROMPT 12 — PRIVACY, SECURITY & AI UX

## Goal

Expose the system's strong security model in a clear user experience without weakening it.

## Sources

Read:

* current auth/permission implementation
* middleware
* AI safe-launch documentation
* relevant security docs
* AI components
* audit behavior

## Security UX

For permission failures:

explain required access or workflow state where safe.

Do not expose internal authorization implementation.

For destructive operations:

show target
consequence
reversibility
audit implication where relevant.

## AI UX

AI remains advisory only.

Every AI-assisted output must clearly distinguish:

* system data
* AI suggestion
* user decision

Provide a consistent AI advisory indicator.

Never visually style an AI result as an approved QC decision.

AI unavailable state must not block normal QC workflow.

Do not display provider secrets.

Avoid exposing raw prompts/responses unnecessarily.

## Session/form safety

Review long-form behavior when:

* session expires
* network fails
* CSRF/session state changes
* user has unsaved work

Make recovery explicit and preserve safe recoverable work wherever the existing security model permits.

---

# PROMPT 13 — SERVICE DESIGN & CROSS-WORKFLOW UX

## Goal

Make end-to-end QC journeys feel like one product rather than independent screens.

## Skills

Use:

* service-blueprint
* experience-map
* journey-map
* jobs-to-be-done
* state-machine
* information-architecture
* feedback-patterns

## Blueprint

Map current and target state for:

1. Test lifecycle
2. Finding → CAPA → Evidence
3. Equipment → Calibration → Maintenance
4. Controlled Document lifecycle

For every step record:

User action
Visible UI response
Server/domain behavior
Database/audit effect
Notification
Next responsible role
Failure/recovery path

## Implement high-value handoff improvements

Examples only after evidence:

* direct related-record links
* clearer ownership
* pending-with role labels
* current workflow stage
* next action
* blockers
* history

Do not duplicate the full audit trail everywhere.

Expose the minimum context required to continue work safely.

---

# PROMPT 14 — UX RESEARCH PROGRAM

## Goal

Validate the redesigned system with real QC workflows instead of relying exclusively on developer or automated QA.

## Skills

Use:

* usability-test-plan
* interview-script
* survey-design
* jobs-to-be-done
* journey-map
* affinity-diagram
* metrics-definition
* design-impact-reporting

## Research segments

Employee
Supervisor
Manager
Lab operator/reviewer
Admin only where administrative UX is being tested

## Tasks

Cover realistic scenarios:

* create
* save
* resume
* submit
* review
* reject/rework
* approve
* search
* investigate a failure
* calibration due
* generate/export report

## Metrics

Task success
Time on task
Error rate
Assistance
SEQ
SUS

Use 5–8 users per meaningful segment where practical.

Do not mix findings from radically different roles without identifying the segment.

## Output

Produce:

research questions
participant criteria
test script
tasks
metrics
observation template
findings severity
recommendations
baseline/comparison

No implementation should be declared UX-successful solely because the automated tests passed.

---

# PROMPT 15 — FINAL DESIGN QA & GOVERNANCE

## Goal

Verify the entire program as one coherent system and stop future design drift.

## Skills

Use:

* better-interface
* design-qa-checklist
* design-debt-audit
* accessibility-audit
* design-system-governance
* design-system-adoption
* review-animations
* responsive-design

## Audit

Review every changed high-frequency screen against:

Design System
UI
UX
IA
Interaction
Copy
Forms
Data visualization
A11y
Ergonomics
Motion
Security UX
Responsive behavior

## Verify specifically

No duplicate status system.

No duplicate button language.

No arbitrary new token without justified repeated need.

No `transition: all`.

No motion ignoring reduced-motion.

No critical color-only state.

No inaccessible icon action.

No broken 320px/200% zoom path.

No primary workflow depending on AI.

No permissions moved into presentation-only logic.

No QC information removed for aesthetic simplification.

## Automated gates

Run all relevant:

typecheck
UI consistency
architecture
badge contrast
lab UX presentation
lab UX performance
responsive E2E
domain tests
full test chain
production build

Run acceptance tests if their current prerequisites are healthy.

Never hide a failing gate.

## Final report

Return:

Before score
After score
Remaining gaps
Verified tests
Human UX evidence
Known limitations

Only claim an improvement percentage when there is actual before/after evidence.

---

# RECOMMENDED EXECUTION ORDER

01 Design System Foundation

→ 02 Status Semantics

→ 03 IA & Permissions

→ 04 Core UI

→ 05 Advanced Forms

→ 06 Interaction & Feedback

→ 07 Motion & Digital Art

→ 08 UX Writing

→ 09 Dashboard & Data Visualization

→ 10 Data-Driven Instrumentation

→ 11 Accessibility & Ergonomics

→ 12 Privacy/Security/AI UX

→ 13 Service Design

→ 14 UX Research

→ 15 Final Design QA & Governance

Do not run all prompts simultaneously.

Each prompt must finish verification before the dependent prompt begins.

