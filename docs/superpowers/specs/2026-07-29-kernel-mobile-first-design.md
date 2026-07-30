---
file: kernel-mobile-first-design.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
date: 2026-07-29
author: BrightAI Workspace Agent
task: CHAMPION-01 — Kernel Mobile-First Hero + Universal Empty/Skeleton + Voice Input
agent_mode: Senior
status: design
---

# CHAMPION-01 — Kernel Mobile-First Design

> إعادة بناء تجربة صفحات Kernel (خصوصًا chat) لتكون first-class على mobile 360×640 مع empty/skeleton شامل، voice input بالـ Web Speech API (ar-SA)، و a11y/RTL مصقولة. التحسين يكون بصري + بنيوي بدون ما يلمس النصوص المنشورة أو الـ backend.

## 1. Context & Goals

- **المشكلة الحالية**:
  - `src/pages/kernel/chat.astro` (1720 سطر) — قلب المنتج — يستخدم 3-pane على desktop تنطوي تحت 1024px على drawers. الـ compose box مو sticky. أول زيارة تعرض seed data بدل empty state تشجيعية. لا voice input. لا skeleton loading.
  - 9 صفحات kernel (audit/approvals/evidence/policies/scenarios/stats/reports/compliance/connectors) تستخدم `setTimeout` dummy للـ demo state (لا empty state، لا skeleton حقيقي).
  - 4.4% من touch targets في mobile-menu__header تحت 44px. لا RTL audit per page.
- **الهدف**:
  - chat.astro mobile-first: 1-pane + sticky compose + 3 drawers (mutual exclusion).
  - Voice input عبر Web Speech API مع fallback inline hint لما الـ API غائب.
  - Empty + Skeleton في كل صفحات kernel الـ 10/11 (chat + 9 dashboard pages).
  - mobile-first CSS rethink لـ `kernel.css` (mobile-first + logical properties + tokens).
  - a11y polish: skip-link، focus-visible 2px، reduced-motion، `aria-label` على كل icon-only.
  - Lighthouse mobile ≥ 90، 0 touch targets < 44px على 11/11.

## 2. Out of Scope (Preserve)

- **النصوص العربية المنشورة** في chat.astro و 9 صفحات kernel — لا نبدّلها (Saudi dialect مقدّس).
- `src/data/kernel-system-prompts.ts` (نظام prompts الخادم).
- `src/pages/api/ai/chat.ts` (backend logic).
- `src/lib/quota.ts`, `src/lib/redis.ts` (security/cost layer).
- `src/components/kernel/KernelDemoPill.astro` (شفاف، عقده محفوظ).
- `trailingSlash: 'always'` و 16 sections في homepage.
- `astro.config.mjs` (ما نعدّل build config).
- الملفات المحمية في `agent.md` Section 2.1 (`public/_redirects`, `public/_headers`, `src/data/site.ts`, ...).

## 3. Architecture

### 3.1 chat.astro (Hero Rewrite)

**Layout structure** (mobile-first, default ≤767px):
```
<main class="kernel-chat" data-state="empty">
  <header class="kernel-chat__header" data-sticky="top">
    [title] [sessions-btn] [details-btn] [scenarios-btn]
  </header>
  <section class="kernel-chat__messages" id="kernel-chat-messages" role="log" aria-live="polite">
    <KernelEmptyState onboardingSteps={[...3 steps...]}>
      "هلا، وش تبي تسأل عن حوكمة الذكاء الاصطناعي اليوم؟"
    </KernelEmptyState>
    <KernelSkeleton variant="card" /> <!-- مخفي حتى data-state="loading" -->
  </section>
  <footer class="kernel-chat__compose" data-sticky="bottom">
    <KernelVoiceInput />
    <textarea /> [send-btn]
  </footer>

  <aside data-drawer="sessions" class="kernel-drawer" hidden>...</aside>
  <aside data-drawer="details" class="kernel-drawer" hidden>...</aside>
  <aside data-drawer="scenarios" class="kernel-drawer" hidden>...</aside>
</main>
```

**Sticky compose box**:
```css
.kernel-chat__compose {
  position: sticky;
  bottom: 0;
  inset-block-end: 0;
  padding-block-end: max(var(--space-3), env(safe-area-inset-bottom));
  background: var(--bg-elevated);
  z-index: 100;
  box-shadow: var(--shadow-overlay);
}
```

**3 Drawers** (mutual exclusion):
- كل `<aside data-drawer="X" hidden>` يبدأ `hidden`.
- JS واحد (في `public/js/kernel-chat-drawers.js`) يستمع لأزرار `[data-open-drawer="X"]` ويضبط `document.body.dataset.activeDrawer = X | ''`.
- CSS: `body[data-active-drawer] .kernel-drawer { display: block; }` + `body[data-active-drawer="sessions"] [data-drawer="sessions"] { display: block; }` (mutual exclusion ضمني).
- الـ overlay (`<div class="kernel-drawer__scrim">`) يستمع لـ click → يمسح `data-active-drawer` ويغلق الكل.

**Empty state (first visit)**:
- `<KernelEmptyState title="هلا، وش تبي تسأل عن حوكمة الذكاء الاصطناعي اليوم؟" message="جرّب اسأل عن PDPL أو ECC، أو استخدم قالب جاهز." onboardingSteps={['highlight-compose', 'highlight-scenarios', 'highlight-sessions']} />`
- 3-step tour: لما `<details name="kernel-tour" open>` يكون مفتوح، CSS يطبق `outline: 2px solid var(--brand-400)` على الـ target.
- على click في الـ step، يفتح الـ drawer المناسب + يقفز للـ step التالي.

**Streaming SSE**:
- `fetch /api/ai/chat` (موجود) + `ReadableStream` reader.
- `visualViewport.addEventListener('resize', ...)` يعدّل `padding-bottom` للـ compose لما الـ keyboard مفتوح.
- `AbortController` على unmount.

### 3.2 KernelVoiceInput.astro (NEW Component)

```astro
---
/**
 * KernelVoiceInput — Web Speech API mic button (ar-SA).
 * SSR-safe: no API access in frontmatter.
 * Graceful fallback: if SpeechRecognition missing, first click shows
 * inline hint in chat compose ("المتصفح ما يدعم الإدخال الصوتي").
 */
---
<button
  type="button"
  class="kernel-voice-input"
  data-voice-trigger
  aria-label="ابدأ الإدخال الصوتي"
  aria-pressed="false"
>
  <svg aria-hidden="true">...mic icon...</svg>
</button>

<script type="module" src="/js/kernel-voice-input.js"></script>
```

**`public/js/kernel-voice-input.js`** (client):
```js
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
const trigger = document.querySelector('[data-voice-trigger]');
if (!SR) {
  // API غائب — نترك الزر visible، أول click يضيف hint في صندوق الشات
  trigger?.addEventListener('click', () => {
    const compose = document.querySelector('.kernel-chat__compose');
    if (!compose || compose.querySelector('.chat-hint--voice-unsupported')) return;
    const hint = document.createElement('div');
    hint.className = 'chat-hint chat-hint--voice-unsupported';
    hint.setAttribute('role', 'status');
    hint.textContent = 'المتصفح ما يدعم الإدخال الصوتي. تقدر تكتب سؤالك بدالاً عن ذلك.';
    compose.prepend(hint);
    setTimeout(() => hint.remove(), 8000);
  }, { once: false });
} else {
  const rec = new SR();
  rec.lang = 'ar-SA';
  rec.interimResults = true;
  rec.continuous = false;
  trigger?.addEventListener('click', () => {
    if (trigger.getAttribute('aria-pressed') === 'true') {
      rec.stop();
    } else {
      rec.start();
    }
  });
  rec.onresult = (e) => {
    const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
    const textarea = document.querySelector('.kernel-chat__compose textarea');
    if (textarea) textarea.value = t;
  };
  rec.onend = () => trigger.setAttribute('aria-pressed', 'false');
  rec.onerror = () => trigger.setAttribute('aria-pressed', 'false');
}
```

### 3.3 Empty + Skeleton (10/11 Kernel Pages)

نضيف wrapper واحد `<div data-state="loading|empty|ready">` حول محتوى كل صفحة:
- `data-state="loading"` (الافتراضي قبل hydration) → `<KernelSkeleton variant="card" />` مرئي، `<KernelEmptyState>` و children مخفيين.
- `data-state="empty"` → `<KernelEmptyState>` مرئي، children مخفيين.
- `data-state="ready"` → children مرئيين، skeleton و empty state مخفيين.

**CSS (في kernel.css)**:
```css
.kernel-state-wrapper[data-state="loading"] .kernel-state--content { display: none; }
.kernel-state-wrapper[data-state="loading"] .kernel-state--empty { display: none; }
.kernel-state-wrapper[data-state="empty"] .kernel-state--content { display: none; }
.kernel-state-wrapper[data-state="empty"] .kernel-state--skeleton { display: none; }
.kernel-state-wrapper[data-state="ready"] .kernel-state--empty,
.kernel-state-wrapper[data-state="ready"] .kernel-state--skeleton { display: none; }

/* Transition */
.kernel-state-wrapper > * {
  transition: opacity var(--duration-base) var(--ease-out);
}
.kernel-state-wrapper[data-state="loading"] .kernel-state--content,
.kernel-state-wrapper[data-state="empty"] .kernel-state--content {
  opacity: 0;
}
```

**JS initialization** (صفحة بتحوي data + setTimeout dummy): في `astro:page-load`:
```js
if (window.__KERNEL_HAS_DATA__) {
  document.querySelector('.kernel-state-wrapper')?.setAttribute('data-state', 'ready');
} else {
  document.querySelector('.kernel-state-wrapper')?.setAttribute('data-state', 'empty');
}
```

**صفحات kernel المشمولة** (10):
1. `chat.astro` — empty + skeleton + voice (المنطق أعلاه).
2. `audit.astro`
3. `approvals.astro`
4. `evidence.astro`
5. `policies.astro`
6. `scenarios.astro`
7. `stats.astro`
8. `reports.astro`
9. `compliance.astro`
10. `connectors.astro`

كل صفحة تحصل على:
- `<KernelSkeleton variant="card" count={3} />` فوق الـ data area.
- `<KernelEmptyState title="ما في عناصر هنا بعد" message="ابدأ بإنشاء أول عنصر." ctaLabel="ابدأ" ctaHref="/contact/" />` كـ fallback.
- wrapper `<div class="kernel-state-wrapper" data-state="loading">` → JS يقلبه إلى `ready` أو `empty` بناءً على data.
- إزالة `setTimeout(...)` dummy (الـ 7 demo states).

### 3.4 Mobile-First CSS (kernel.css)

**قواعد التحويل**:
- نمط mobile-first: `default` (≤767px) → `@media (min-width: 768px)` (tablet) → `@media (min-width: 1366px)` (desktop).
- كل values الخام تستبدل بـ tokens (الـ tokens موجودة فعلاً في `src/styles/tokens.css`).
- logical properties فقط: `margin-inline-start`, `padding-block-end`, `inset-inline-end`. ممنوع `left`/`right`/`top`/`bottom` إلا للـ overlay المطلق.
- touch targets: كل button/link له `min-block-size: var(--touch-min)` (44px) و `min-inline-size: var(--touch-min)`.
- safe-area: `env(safe-area-inset-bottom)` و `env(safe-area-inset-top)` على sticky elements.
- reduced-motion: `@media (prefers-reduced-motion: reduce)` يلغي `transition` و `animation`.

**هيكل kernel.css بعد التحويل**:
```css
/* === Default (mobile ≤767px) === */
.k-shell { padding-inline: var(--gutter-xs); }
.k-card { padding: var(--space-4); }
/* ... */

/* === Tablet (≥768px) === */
@media (min-width: 768px) {
  .k-shell { padding-inline: var(--gutter-md); }
  .k-card { padding: var(--space-6); }
}

/* === Desktop (≥1366px) === */
@media (min-width: 1366px) {
  .k-shell { padding-inline: var(--gutter-xl); max-inline-size: var(--container-wide); margin-inline: auto; }
}
```

### 3.5 A11y Polish

1. **Skip-link** في `src/layouts/KernelLayout.astro`:
   ```astro
   <a href="#main" class="skip-link">تخطي إلى المحتوى</a>
   ```
2. **`aria-label`** على كل icon-only buttons في `kernel.css` النطاق (mic, close, drawer triggers, send).
3. **`focus-visible`**: `outline: 2px solid var(--brand-400); outline-offset: 2px;` على كل interactive elements.
4. **prefers-reduced-motion**: يلغي كل `transition` و `animation`.
5. **RTL**: logical properties فقط، `dir="rtl"` موروث من ArabicLayout.

## 4. Data Flow

```
SSR (build time):
  chat.astro
    → reads src/data/kernel-system-prompts.ts (read-only import)
    → emits HTML with data-state="empty"
    → لا seed messages (تم حذفها)
    → <KernelEmptyState onboardingSteps={[...]} />
    → <KernelSkeleton variant="card" /> (CSS hides until data-state="loading")
    → <KernelVoiceInput /> (client island)

  9 dashboard pages
    → emits <KernelSkeleton> + <KernelEmptyState>
    → wrapper data-state="loading"
    → بدون setTimeout dummy (تم حذفها)

Client (browser):
  1. astro:page-load → KernelVoiceInput يتحقق من webkitSpeechRecognition
     - لو موجود: ينشئ SR() بـ lang="ar-SA"، يستمع على click
     - لو غائب: يضيف inline hint في compose box على first click
  2. user يفتح drawer → JS يحدد body[data-active-drawer]
     - CSS يبدّل visibility
     - scrim click → يمسح الـ attribute
  3. user يكتب سؤال → fetch /api/ai/chat (SSE)
     - streaming response في messages area
     - visualViewport.resize → padding-bottom للـ compose يتعدل
  4. page hydration → JS يقرأ data من window.__KERNEL_HAS_DATA__
     - true → data-state="ready"
     - false → data-state="empty"
```

## 5. Error Handling

| خطأ | السلوك |
|---|---|
| `webkitSpeechRecognition` غائب | inline hint في compose box على first click (لا exception، لا crash). |
| `webkitSpeechRecognition` يرفض permission | نفس الـ hint + "اضغط للكتابة بدل الصوت". |
| SSE network error | messages area يعرض "السيرفر ما رد. حاول مرة ثانية." + retry button. |
| `setTimeout dummy` فشل | wrapper يبقى `data-state="empty"` (graceful). |
| `data-state="loading"` لأطول من 5s | CSS timeout → fallback إلى `empty` (defensive). |

## 6. Testing

### 6.1 Verification Commands

```bash
# Build + gates
ASTRO_TELEMETRY_DISABLED=1 pnpm run build    # لازم 196 pages، 0 errors
pnpm run verify:all                            # exit 0
pnpm run seo:all                               # exit 0
pnpm run performance:budget                    # exit 0

# Curl checks (production)
curl -s https://brightai.site/kernel/chat/ | grep -c "ابدأ محادثة"            # ≥ 1
curl -s https://brightai.site/kernel/chat/ | grep -c "تصدير قائمة عملاء"      # 0
curl -s https://brightai.site/kernel/chat/ | grep -c "KernelSkeleton"          # ≥ 1
curl -s https://brightai.site/kernel/chat/ | grep -c "KernelVoiceInput"        # ≥ 1
```

### 6.2 Mobile Audit (NEW script: `scripts/playwright/mobile-audit-kernel.mjs`)

```js
// يفحص كل buttons/links على 360x640 لكل 11 صفحة kernel
// يجمع boundingBox.height/width
// يفرض ≥ 44px على كل منها
// Exit 1 لو في violations
```

### 6.3 Visual Regression (NEW scripts: `scripts/playwright/screenshot.mjs`)

```bash
# قبل
node scripts/playwright/screenshot.mjs \
  --url=https://brightai.site/kernel/chat/ \
  --viewport=360x640 \
  --output=qa-screenshots/kernel-chat-before.png

# بعد
node scripts/playwright/screenshot.mjs \
  --url=https://brightai.site/kernel/chat/ \
  --viewport=360x640 \
  --output=qa-screenshots/kernel-chat-after.png

# Diff
diff qa-screenshots/kernel-chat-before.png qa-screenshots/kernel-chat-after.png
```

### 6.4 Lighthouse Mobile

```bash
pnpm run lhci:collect --url=https://brightai.site/kernel/chat/
# mobile Score ≥ 90
```

### 6.5 axe-core

```bash
pnpm run a11y:scan
# 0 critical، 0 serious على 11/11 kernel pages
```

## 7. Acceptance Criteria

| # | Criterion | Command |
|---|---|---|
| 1 | `ابدأ محادثة` يظهر في chat HTML | `curl -s .../kernel/chat/ \| grep -c "ابدأ محادثة"` ≥ 1 |
| 2 | لا seed messages | `curl -s .../kernel/chat/ \| grep -c "تصدير قائمة عملاء"` = 0 |
| 3 | Skeleton موجود في chat.astro | `grep -c "KernelSkeleton"` ≥ 1 في chat HTML |
| 3b | VoiceInput موجود في chat.astro فقط | `grep -c "KernelVoiceInput"` ≥ 1 في chat HTML (الـ 9 dashboard pages تاخذ skeleton + empty بدون voice) |
| 4 | 0 touch targets < 44px | `node scripts/playwright/mobile-audit-kernel.mjs` exit 0 |
| 5 | Lighthouse mobile Performance ≥ 90 | `pnpm run lhci:collect` Performance category ≥ 90 (Access/SEO/Best Practices tracked separately) |
| 6 | axe 0 critical | `pnpm run a11y:scan` exit 0 |
| 7 | 196 pages build | `pnpm run build` exit 0 |
| 8 | verify:all pass | `pnpm run verify:all` exit 0 |
| 9 | brain.md updated | git diff --stat .agents/brain.md |

## 8. Risks

- **R1 (chat.astro regression)**: 1720 سطر، حذف seed messages + إعادة layout = high blast radius. **Mitigation**: incremental commits (1: layout shell، 2: voice component، 3: empty state، 4: skeleton+state wrapper). كل commit له `pnpm run build` + `verify:all`.
- **R2 (CSP regression)**: Web Speech API + JS drawers = new inline scripts. **Mitigation**: external scripts only (`<script type="module" src="/js/...">`)، لا `<script is:inline>`. لو في حاجة inline، تحسب SHA-256 hash وتضاف لـ `style-src-elem` per DEC-BAI-SEC-18-2026-07-25-001.
- **R3 (RTL regression)**: mobile-first + new components = logical properties required. **Mitigation**: agent rule — ممنوع `left`/`right` في CSS الجديد، كل جديد يستخدم `margin-inline-start`/`end`/`padding-block-start`/`end`.
- **R4 (voice API misuse)**: webkitSpeechRecognition يدعم Safari فقط. **Mitigation**: hint inline + graceful degradation (text input يشتغل دايماً).
- **R5 (chat SSE regression)**: نلمس client-side fetch فقط. **Mitigation**: ما نعدّل `/api/ai/chat.ts`، نختبر بعد كل commit.
- **R6 (kernel.css regression)**: 5070 سطر، mobile-first rewrite = high blast radius. **Mitigation**: file-by-file conversion (default first، ثم tablet، ثم desktop). ما نمسّ القيم الحالية، نضيف `min-width` queries حولها.

## 9. Rollback

```bash
git revert <CHAMPION-01-commit-sha>
pnpm run build
# Render auto-deploy يعيد البناء السابق
```

**ملاحظة**: لا rollback لـ backend (`chat.ts` unchanged). الـ frontend revert يحذف كل الـ kernel mobile-first changes.

## 10. Files Changed (Estimated)

| File | Action | Lines |
|---|---|---|
| `src/pages/kernel/chat.astro` | rewrite | 1720 → ~1100 |
| `src/pages/kernel/audit.astro` | edit | +20 |
| `src/pages/kernel/approvals.astro` | edit | +20 |
| `src/pages/kernel/evidence.astro` | edit | +20 |
| `src/pages/kernel/policies.astro` | edit | +20 |
| `src/pages/kernel/scenarios.astro` | edit | +20 |
| `src/pages/kernel/stats.astro` | edit | +20 |
| `src/pages/kernel/reports.astro` | edit | +20 |
| `src/pages/kernel/compliance.astro` | edit | +20 |
| `src/pages/kernel/connectors.astro` | edit | +20 |
| `src/components/kernel/KernelVoiceInput.astro` | NEW | ~60 |
| `src/components/kernel/KernelEmptyState.astro` | edit | +30 |
| `src/components/kernel/KernelSkeleton.astro` | edit | +10 |
| `public/js/kernel-voice-input.js` | NEW | ~60 |
| `public/js/kernel-chat-drawers.js` | NEW | ~40 |
| `public/js/kernel-state.js` | NEW | ~25 |
| `src/styles/kernel.css` | rewrite (mobile-first) | 5070 → ~5200 |
| `src/layouts/KernelLayout.astro` | edit (skip-link) | +5 |
| `scripts/playwright/mobile-audit-kernel.mjs` | NEW | ~80 |
| `scripts/playwright/screenshot.mjs` | NEW | ~50 |
| `scripts/prompt-champion.mjs` | edit (CHAMPION-01 entry) | +30 |
| `.agents/brain.md` | edit (CHAMPION-01 entry) | +60 |
| `report/2026-07-29-champion-01-kernel-mobile-first.md` | NEW | ~150 |

**Total**: 18 modified + 6 new = 24 files. 196 pages build unchanged.

## 11. Out-of-Scope (Follow-ups)

- **CHAMPION-02**: Bilingual (AR/EN) empty states + voice input (depends on this).
- **CHAMPION-03**: Kernel analytics + usage telemetry (depends on this).
- **BAI-SEC-19**: 7 kernel inline scripts migration (depends on Phase 2 architecture).
- **CHAMPION-04**: Real-time SSE optimization (depends on this + chat backend).

## 12. Decision Log

- **DEC-CHAMPION-01-2026-07-29-001**: mobile-first CSS via `default → @media (min-width: 768px) → @media (min-width: 1366px)`. لا Tailwind breakpoints. tokens.css has the breakpoint vars (`--bp-sm/md/lg/xl/2xl`) but we hardcode the values in media queries for clarity.
- **DEC-CHAMPION-01-2026-07-29-002**: Web Speech API graceful degradation via inline hint on first click (لا disabled، لا hidden). زر الـ mic يظهر دايماً.
- **DEC-CHAMPION-01-2026-07-29-003**: 3 drawers mutual exclusion via `body[data-active-drawer="X"]` + CSS. لا JS-driven visibility toggle.
- **DEC-CHAMPION-01-2026-07-29-004**: data-state wrapper pattern: `data-state="loading|empty|ready"` على parent. CSS handles visibility. JS flips state on hydration. Single source of truth per page.
- **DEC-CHAMPION-01-2026-07-29-005**: لا seed messages في chat.astro. أول زيارة = empty state تشجيعية. الـ "ابدأ محادثة" copy هو الـ empty state title (`kernel-empty__title` element، مو CTA button — الـ CTA الفعلي هو "جرّب اسأل عن PDPL/ECC" في الـ message).
