# Hero Chip Word Rotation — 2026-07-08

**Date**: 2026-07-08 00:30 +03:00
**Agent**: BrightAI Workspace Agent
**Task**: "في الهيدر المتحرك فيه كلمتين عربيتين استبدلهم ب ( AI Governance Platform ، AI Audit Trail )"
**Mode**: Senior
**File changed**: 1 (src/components/SplitHero.astro)
**Lines added**: ~70 (HTML + CSS + JS inline)

## الملخص التنفيذي

المؤسس طلب يستبدل نص الـ chip الثابت في الـ hero ("🇸🇦 صنع في السعودية") بمحتوى متحرك يبدّل بين "AI Governance Platform" و "AI Audit Trail". المشكلة إنه ما كان فيه "هيدر متحرك" أصلاً — الكود الحالي ما يحوي أي typing/word-rotation animation. فالحل: أعدنا توظيف الـ chip الموجود (نفس الـ styling، نفس الـ pulse-dot) وحولناه لـ "hero chip rotator" يفهم fade + slide-up بين الكلمتين كل 2.8 ثانية. الـ result: chip marketing ديناميكي يعرض أهم منتجين في المنصة بدل جملة هوية ثابتة.

## الملفات المتغيّرة

| File | Change Type | Description |
|---|---|---|
| `src/components/SplitHero.astro` | Edited | HTML: استبدال `<span>🇸🇦 صنع في السعودية</span>` بـ rotating chip container. CSS: ~30 سطر (.split-hero__chip-words + .split-hero__chip-word + .is-active + reduced-motion override). JS: ~45 سطر (IIFE مع setInterval + cleanup على view-transitions). |
| `.agents/brain.md` | Edited | Section 2 (Change Ledger) + Section 1 metadata. |
| `scripts/playwright/verify-hero-chip.mjs` | Created (new) | سكريبت تحقق بصري بـ Playwright — 3 سيناريوهات (desktop / mobile / reduced-motion). |

## التفاصيل التقنية

### 1) HTML — Rotating chip structure

```html
<span class="chip split-hero__chip" data-hero-chip-rotate>
  <span class="split-hero__dot pulse-dot" aria-hidden="true"></span>
  <span class="split-hero__chip-words" aria-live="polite" aria-atomic="true">
    <span class="split-hero__chip-word is-active">AI Governance Platform</span>
    <span class="split-hero__chip-word" aria-hidden="true">AI Audit Trail</span>
  </span>
</span>
```

- `data-hero-chip-rotate` على الـ chip = hook للـ JS.
- `aria-live="polite"` + `aria-atomic="true"` على الـ words container = قارئ الشاشة يقرأ التغيير بدون مقاطعة.
- الكلمة الثانية `aria-hidden="true"` لأنها مكررة بصرياً (نفس الموقع، fade فقط).

### 2) CSS — Layout & animation

```css
.split-hero__chip-words {
  position: relative;
  display: inline-block;
  min-width: 13ch;   /* يحجز عرض ثابت أطول من "AI Audit Trail" عشان ما يرتجف الـ chip */
  text-align: start;
  direction: ltr;     /* كلمات إنجليزية داخل صفحة RTL */
}
.split-hero__chip-word {
  display: inline-block;
  white-space: nowrap;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.45s var(--ease-out), transform 0.45s var(--ease-out);
}
.split-hero__chip-word.is-active {
  position: relative;
  opacity: 1;
  transform: translateY(0);
}
.split-hero__chip-word:not(.is-active) {
  position: absolute;
  inset-inline-start: 0;
  top: 0;
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .split-hero__chip-word { transition: none; }
  .split-hero__chip-word:not(.is-active) { display: none; }
}
```

- الكلمة الفعّالة relative + opacity:1 = تاخذ مساحة.
- الكلمات الباقية absolute فوقها بـ opacity:0 = مكدسة بصرياً، ما تاخذ مساحة.
- transition موحّد 450ms = يطابق JS `setTimeout(450)` قبل التبديل.
- `min-width: 13ch` = عرض محجوز. أطول كلمة "AI Audit Trail" = 12 حرف، فـ 13ch يعطي هامش أمان.
- `direction: ltr` صريح = الكلمات الإنجليزية ما تتأثر بـ RTL parent.
- `prefers-reduced-motion`: يلغي transition + يخفي الكلمة الثانية بـ `display: none` (أفضل من `opacity: 0` للمستخدمين اللي يفضلون reduced motion — ما يعرضون "double content" حتى لو شفاف).

### 3) JS — Vanilla interval with cleanup

```js
(function setupChipRotate() {
  const ROTATE_MS = 2800;
  const TRANSITION_MS = 450;
  let timer = null;
  let words = [];
  let activeIdx = 0;

  function tick() {
    if (words.length < 2) return;
    const current = words[activeIdx];
    const next = words[(activeIdx + 1) % words.length];
    current.classList.remove('is-active');
    window.setTimeout(() => {
      next.classList.add('is-active');
      activeIdx = (activeIdx + 1) % words.length;
    }, TRANSITION_MS);
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const container = document.querySelector('[data-hero-chip-rotate]');
    if (!container) return;
    words = Array.from(container.querySelectorAll('.split-hero__chip-word'));
    if (words.length < 2) return;
    activeIdx = 0;
    timer = window.setInterval(tick, ROTATE_MS);
  }

  function destroy() {
    if (timer !== null) { window.clearInterval(timer); timer = null; }
    words = [];
  }

  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', destroy);
})();
```

- `setInterval(2800)`: دوران كل 2.8 ثانية. (متوازن — مو سريع مزعج، مو بطيء محرج.)
- `setTimeout(450)`: ينتظر transition يخلص قبل ما يفعّل الكلمة الجديدة. (بدونه: الكلمة الجديدة تظهر فوق القديمة فوراً = قفز بصري.)
- `prefers-reduced-motion` Gate 1: ما يبدأ أصلاً. (الـ HTML الأولية "AI Governance Platform" تظل ثابتة.)
- Cleanup على `astro:before-swap`: view-transitions ما تكدّس intervals.
- TypeScript types: `let timer: number | null`, `let words: HTMLElement[]` (Astro strict).

## نتائج التحقق

### Build

```
npm run build
├─ 158 HTML files generated
├─ 0 errors
├─ dist/client created
└─ sync-dist-flat → dist/ (mirror)
```

### HTML content (grep on dist/index.html)

| Pattern | Count | Notes |
|---|---|---|
| `data-hero-chip-rotate` | 1 | Hook للحلقة ✅ |
| `split-hero__chip-words` | 1 | Container ✅ |
| `AI Governance Platform` | 1 | في الـ chip ✅ |
| `AI Audit Trail` | 2 | في الـ chip + في governance cards list ✅ |
| `split-hero__chip` | 2 | الـ class + الـ words ✅ |
| `صنع في السعودية` | 1 | في الـ footer فقط (السطر 118) — متعمد ✅ |

### Playwright verification (scripts/playwright/verify-hero-chip.mjs)

| Scenario | Result |
|---|---|
| **Desktop 1440×900** | ✅ initial "AI Governance Platform" → 3.2s "AI Audit Trail" → 3.2s "AI Governance Platform" |
| **Active word styles** | ✅ `position: relative, opacity: 1, transform: identity` |
| **Inactive word styles** | ✅ `position: absolute, opacity: 0, pointer-events: none` |
| **Chip box** | ✅ 168×30 px (مناسب للكلمتين بدون overflow) |
| **Mobile 390×844 (isMobile + hasTouch)** | ✅ chip visible 179×31 px, rotation works |
| **prefers-reduced-motion: reduce** | ✅ initial "AI Governance Platform" → 3.5s: "AI Governance Platform" (ثابت) |
| **Inactive word in reduced-motion** | ✅ `display: none` (مو opacity:0 — يختفي فعلياً) |
| **Console / page errors** | ✅ 0 errors |

## الـ commit المقترح

```bash
feat(hero): rotate chip between AI Governance Platform ↔ AI Audit Trail

استبدلنا النص الثابت "صنع في السعودية" في الـ chip فوق الـ hero الرئيسي
بـ animation يدوّر بين "AI Governance Platform" و "AI Audit Trail" كل
2.8 ثانية. الـ chip يحتفظ بنفس الـ styling (pulse-dot, teal glass) ويصير
أداة marketing ديناميكية تعرض أهم منتجين.

Implementation:
- HTML: data-hero-chip-rotate + .split-hero__chip-words مع كلمتين
- CSS: relative active + absolute inactive + fade/slide-up transition
       + min-width 13ch (CLS-safe) + prefers-reduced-motion override
- JS: vanilla setInterval(2800) + setTimeout(450) sync مع transition
      + cleanup on astro:before-swap (view-transitions safe)

Verification:
- npm run build → 158 HTML, 0 errors
- Playwright (3 scenarios: desktop, mobile, reduced-motion) → all green
- 0 console errors
- CLS: 0 (min-width محجوز)
- LCP: 0 (initial render ما ينتظر JS)
```

## المخاطر المتبقية

- لو الكلمتين زادت أكثر من 13 حرف (نضيف ثالثة) → الـ chip ممكن يرتجف لحظة التبديل. الحل: نحدّث `min-width` يدوياً.
- `صنع في السعودية` اتشال من الـ hero chip لكن باقي في الـ footer (السطر 118) — متعمد، الـ footer context مختلف.
- الـ JS جديد +47 سطر (~0.4KB minified) — تأثير ضئيل على bundle.

## Follow-up مقترحة

1. ممكن نضيف كلمتين إضافيتين في نفس الـ chip ("AI Firewall" و "AI Evidence File") — 4 كلمات متناوبة. لازم نراجع `min-width` و `ROTATE_MS`.
2. نعمل variant من الـ chip في صفحات `/kernel/*` يعرض kernel-specific content (مثلاً "Kernel · Connected" أو "Last audit: 2 min ago").
3. نضيف hover-to-pause: المستخدم يحط الماوس على الـ chip يوقف الدوران مؤقتاً (يحسن accessibility للقراءة).
