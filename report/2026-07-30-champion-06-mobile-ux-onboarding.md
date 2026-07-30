# CHAMPION-06 — Mobile UX Polish (نطاق مُصحَّح) + Onboarding Tour

**Date**: 2026-07-30
**Agent**: BrightAI Workspace Agent
**Task**: CHAMPION-06 (Mobile-First UX Polish)
**Mode**: Mid → Senior (Discovery كشف فرضية stale فصار الرد تصحيح نطاق)
**verified_production**: no (kernel pages 404 على astro preview بسبب deny-list؛ التحقق الإنتاجي = curl بعد الديبوي)

## الملخص التنفيذي

نص CHAMPION-06 افترض إن `kernel.css` = 475 سطر وفيه 4.4% touch targets <44px وما فيه safe-area ولا bottom tab bar، وطلب mobile-first rewrite لـ 16h. **Discovery أثبت إن الفرضية stale** (نفس نمط CHAMPION-05 و CHAMPION-03):

- `kernel.css` فعليًا **5070 سطر** (مو 475).
- Touch targets ≥44px **منفّذة** (8 قواعد `min-block-size: 44px` + تعليقات `KRN-019 fix`).
- `safe-area-inset-bottom` **موجود** في `kernel.css` و`KernelLayout.astro`.
- Bottom tab bar **موجود كامل** (`.k-bottomnav` في `KernelLayout.astro:457`، tabs + `aria-current` + safe-area).
- Mobile-first **مطبَّق أصلاً** (أول `@media` هو `min-width:768px`).
- brain.md 1.7 يؤكد: **CHAMPION-02 رفع kernel mobile 26/100 → 100/100 محليًا**.

لذلك ما سوّينا rewrite كامل عشان ما نكسر كيرنل موبايل شغّال 100/100 (قاعدة 2.1 — لا تدمر كود يشتغل). سوينا **الناقص الفعلي فقط**:

1. **Tap-delay elimination** — `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` في `kernel.css` (كانت المادّة الوحيدة فعليًا الناقصة من متطلبات الأداء).
2. **Onboarding tour** — مكوّن جديد `KernelOnboarding.astro` (3 خطوات) + تكامل مع `chat.astro` بدون لمس SSE logic.

## الملفات المتأثرة

| File | Change | وصف |
|---|---|---|
| `src/styles/kernel.css` | Edited | KRN-020: touch-action: manipulation على shell + interactive primitives + tap-highlight شفاف. |
| `src/components/kernel/KernelOnboarding.astro` | Created | جولة 3 خطوات: spotlight + tooltip card + dots + skip/next/prev + localStorage + reduced-motion. |
| `src/pages/kernel/chat.astro` | Edited | import + mount `<KernelOnboarding />` خارج كتلة SSE. |

## ما لُمِس (محمي)

- النص العربي المنشور — ما غيّرنا ولا كلمة موجودة. النصوص الجديدة في `KernelOnboarding.astro` هي copy جديد (مسموح).
- v3 tokens — استخدمناها فقط، ما عدّلنا `tokens.css`.
- chat SSE logic (`<script is:inline>` أسطر 638–1550) — **ما لُمس**. المكوّن الجديد `<script>` عادي (module) منفصل تمامًا.
- `KernelLayout.astro` structure / bottom nav / safe-area — ما لُمست.

## تفاصيل التنفيذ

### 1. Tap-delay elimination (KRN-020)
أضفنا كتلة في رأس `kernel.css`: `touch-action: manipulation` على `.k-topnav`، `.k-bottomnav`، `.k-drawer`، `.kernel-chat-composer`، `.kernel-threads-list__item`، الأزرار، والروابط. و`-webkit-tap-highlight-color: transparent` على أحفادها. النطاق محصور بـ shell + interactive primitives عشان نحافظ على pinch-zoom على الـ body (a11y).

### 2. KernelOnboarding — تكييف الـ IA
البرومبت طلب Step 2 = «scenarios في sidebar». **ما فيه scenarios sidebar في `chat.astro`** (السيناريوهات تُختار عبر `?scenario=` URL، K1 journey). فكّيفنا الخطوات لعناصر حقيقية موجودة:

| الخطوة | الهدف | Selector (مع fallback للجوال) |
|---|---|---|
| 1 | مربع الكتابة | `#kernel-chat-input` / `.kernel-chat-composer` |
| 2 | المحادثات (sessions) | `[data-kernel-threads]` → fallback `[data-kernel-chat-threads-toggle]` |
| 3 | لوحة السياق | `.kernel-chat-context-card` → `[data-kernel-chat-context-toggle]` → `#ctx-session-title` |

المنطق يختار أول عنصر **مرئي** من قائمة المرشحين، فالجولة تشتغل على الديسك (الأجزاء ظاهرة) والجوال (الأجزاء في drawers → fallback لأزرار التولبار).

### آلية الـ spotlight
عنصر `position: fixed` يتغيّر حجمه/موضعه مع `getBoundingClientRect` للهدف، مع `box-shadow: 0 0 0 100vmax rgba(5,8,15,0.72)` = ثقب شفاف فوق الهدف وبقية الشاشة معتمة. إعادة التموضع على scroll/resize (capture). Escape = تخطّي، الأسهم = تنقّل (RTL مُعكوس).

### الاستمرارية
`localStorage['kernel-onboarding-v1'] = 'done'` بعد الإنهاء/التخطّي. الجولة ما تتكرر أبدًا. رفع `version` prop يعيد تشغيلها.

## التحقق

| Check | النتيجة |
|---|---|
| `npm run build` | ✅ EXIT 0 (257 HTML) |
| chat page مبني | ✅ `dist/client/kernel/chat/index.html` |
| touch-action في bundle | ✅ `KernelLayout.x52ys2kY.css` (touch-action:manipulation + tap-highlight-color:transparent) |
| onboarding script (CSP-safe) | ✅ صدر كـ module منفصل `KernelOnboarding...astro_type_script...js` (مو inline) |
| onboarding marker في chat HTML | ✅ `data-kernel-onboarding` + `k-onb__title` |
| `verify:all` | ⚠️ EXIT 1 — **pre-existing** (KI-CHAMPION03-SPEAKABLE على `/answer/*`)؛ لا فشل يخص ملفاتي. `verify-all.mjs` + `headers:check` + `test:chat-session` + `lint:tokens` + `sitemap:generate` كلها ✅ |
| Playwright mobile 360×640 على 11 صفحة | ⏳ **ما يقدر محليًا** — `/kernel/*` كله 404 على astro preview (deny-list). التحقق = curl الإنتاج بعد الديبوي. |

## المخاطر المتبقية

- **قياس الإنتاج**: ما نقدر نتحقق من الجولة بصريًا إلا بعد الديبوي على `brightai.site` (deny-list يمنع preview محلي لكل `/kernel/*`).
- **الخطوة 2/3 على الجوال**: لو drawer الـ threads/context ما انفتح، الجولة تبرز زر التولبار (fallback) بدل القائمة نفسها — هذا مقصود عشان نتجنب اقتران بـ JS الـ drawer.
- **التحذيرات blog route collisions** وقت البناء — pre-existing، ما تخص التغيير.

## Follow-up (مقترح)

- **Voice input (CHAMPION-01 extension)**: `chat.astro` ما فيه `SpeechRecognition` أصلاً. هذا feature منفصل (~2-3h) — ما دخلناه ضمن mobile UX polish.
- إصلاح **KI-CHAMPION03-SPEAKABLE** (speakable على `/answer/*`) عشان `verify:all` يرجع EXIT 0.
- بعد الديبوي: `curl -I https://brightai.site/kernel/chat/` + screenshot موبايل 360×640 للتحقق البصري للجولة.

## Rollback

```
git revert <commit>
```
التغيير CSS + مكوّن جديد + سطرَي import/mount. تأثير محدود، لا migration.
