---
file: kernel-mobile-first.md
project: BrightAI — Saudi AI Safety OS
site: https://brightai.site
date: 2026-07-29
spec: ../specs/2026-07-29-kernel-mobile-first-design.md
author: BrightAI Workspace Agent
task: CHAMPION-01 — Kernel Mobile-First Hero + Universal Empty/Skeleton + Voice Input
agent_mode: Senior
status: plan
---

# CHAMPION-01 — Kernel Mobile-First Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** إعادة بناء `src/pages/kernel/chat.astro` لتكون first-class mobile (1-pane + sticky compose + 3 drawers mutual exclusion) + empty/skeleton شامل في 10 صفحات kernel + voice input عبر Web Speech API (ar-SA) + a11y/RTL مصقولة.

**Architecture:**
- **chat.astro**: layout يتحول من 3-pane لـ 1-pane مع sticky compose box. 3 drawers (sessions/details/scenarios) mutual exclusion عبر `body[data-active-drawer]`. Empty state كـ first-class بدل seed data.
- **Voice input**: `KernelVoiceInput.astro` (client component) يستخدم `webkitSpeechRecognition` مع `lang="ar-SA"`. Graceful degradation: inline hint في compose box لما الـ API غائب.
- **Empty + Skeleton**: `data-state="loading|empty|ready"` wrapper pattern. CSS-driven visibility. JS يقلب state على hydration.
- **kernel.css**: mobile-first rewrite (default → 768px → 1366px)، logical properties فقط، tokens بدل raw values.
- **A11y**: skip-link، focus-visible 2px، reduced-motion، `aria-label` على icon-only.

**Tech Stack:** Astro 6.4.6, vanilla CSS, vanilla JS (external modules), Playwright 1.61, Web Speech API (webkit prefix).

---

## File Structure

| File | Action | Purpose |
|---|---|---|
| `src/components/kernel/KernelVoiceInput.astro` | NEW | Mic button + Web Speech API integration. SSR-safe. |
| `public/js/kernel-voice-input.js` | NEW | Client script: detect API، fallback hint، transcript → textarea. |
| `public/js/kernel-chat-drawers.js` | NEW | Client script: drawer mutual exclusion via `body[data-active-drawer]`. |
| `public/js/kernel-state.js` | NEW | Client script: flips data-state to ready/empty on hydration. |
| `src/components/kernel/KernelEmptyState.astro` | edit | Add `onboardingSteps`, `align`, `compact` props. |
| `src/components/kernel/KernelSkeleton.astro` | edit | Add `aria-busy`, `role="status"`, `count` prop. |
| `src/pages/kernel/chat.astro` | rewrite | 1-pane + sticky compose + 3 drawers + empty + voice. |
| `src/pages/kernel/audit.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/approvals.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/evidence.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/policies.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/scenarios.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/stats.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/reports.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/compliance.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/pages/kernel/connectors.astro` | edit | Add wrapper + skeleton + empty state. |
| `src/styles/kernel.css` | edit | Mobile-first additions: touch targets، state wrapper، drawers، voice button. |
| `src/layouts/KernelLayout.astro` | edit | Add skip-link. |
| `scripts/playwright/mobile-audit-kernel.mjs` | NEW | Touch target audit on 360x640 لكل 11 صفحة kernel. |
| `scripts/playwright/screenshot.mjs` | NEW | Visual regression screenshot helper. |
| `scripts/prompt-champion.mjs` | edit | Add CHAMPION-01 entry. |
| `.agents/brain.md` | edit | Add CHAMPION-01 entry to change ledger. |
| `report/2026-07-29-champion-01-kernel-mobile-first.md` | NEW | Detailed report. |

**Total**: 18 modified + 6 new = 24 files.

---

## Task 1: Add qa-screenshots Directory

**Files:**
- Create: `qa-screenshots/.gitkeep` (NEW)

- [ ] **Step 1: Create the screenshots directory**

```bash
mkdir -p qa-screenshots
touch qa-screenshots/.gitkeep
```

- [ ] **Step 2: Commit**

```bash
git add qa-screenshots/.gitkeep
git commit -m "BAI-CHAMPION-01-01: add qa-screenshots directory for visual regression"
```

(Before screenshots تُلتقط بعد Task 12 لأن screenshot.mjs ما يُنشأ إلا في Task 12. نأجل baseline screenshots إلى ما بعد الـ rewrite في Task 14.)

---

## Task 2: Update KernelEmptyState for Onboarding Support

**Files:**
- Modify: `src/components/kernel/KernelEmptyState.astro` (full file rewrite, 33 → ~70 lines)

- [ ] **Step 1: Replace `KernelEmptyState.astro` with onboarding support**

```astro
---
/**
 * KernelEmptyState — Illustrated empty state with optional CTA + onboarding tour.
 *
 * CHAMPION-01: extended with `onboardingSteps` (3-step inline tour),
 * `align` (center|start), `compact` (smaller illustration).
 */
interface OnboardingStep {
  id: string;
  label: string;
  targetSelector: string;
}

interface Props {
  title: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  iconSvg?: string;
  align?: 'center' | 'start';
  compact?: boolean;
  onboardingSteps?: OnboardingStep[];
}

const {
  title,
  message = '',
  ctaLabel = '',
  ctaHref = '',
  iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>',
  align = 'center',
  compact = false,
  onboardingSteps = [],
} = Astro.props;
---

<div class:list={['kernel-empty', `kernel-empty--${align}`, compact && 'kernel-empty--compact']}>
  <div class="kernel-empty__illustration" aria-hidden="true">
    <Fragment set:html={iconSvg} />
  </div>
  <h3 class="kernel-empty__title">{title}</h3>
  {message && <p class="kernel-empty__message">{message}</p>}
  {ctaLabel && ctaHref && (
    <a href={ctaHref} class="kernel-empty__cta">
      {ctaLabel}
    </a>
  )}
  {onboardingSteps.length > 0 && (
    <details class="kernel-empty__onboarding" name="kernel-tour" open>
      <summary class="kernel-empty__onboarding-summary">جولة سريعة (3 خطوات)</summary>
      <ol class="kernel-empty__onboarding-list">
        {onboardingSteps.map((step, i) => (
          <li>
            <button
              type="button"
              class="kernel-empty__onboarding-step"
              data-tour-step={step.id}
              data-tour-target={step.targetSelector}
              data-tour-index={i}
            >
              {i + 1}. {step.label}
            </button>
          </li>
        ))}
      </ol>
    </details>
  )}
</div>
```

- [ ] **Step 2: Build to verify Astro accepts the new props**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -20
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/components/kernel/KernelEmptyState.astro
git commit -m "BAI-CHAMPION-01-02: extend KernelEmptyState with onboarding tour props"
```

---

## Task 3: Update KernelSkeleton for ARIA Busy State

**Files:**
- Modify: `src/components/kernel/KernelSkeleton.astro` (full file rewrite, 29 → ~40 lines)

- [ ] **Step 1: Replace `KernelSkeleton.astro` with ARIA support**

```astro
---
/**
 * KernelSkeleton — Shimmer placeholder (loading state).
 * Variants: text | text-sm | text-md | heading | avatar | icon | card
 *
 * CHAMPION-01: added `count` (multiple instances), `aria-busy`, `role="status"`.
 */
interface Props {
  variant?: 'text' | 'text-sm' | 'text-md' | 'heading' | 'avatar' | 'icon' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

const { variant = 'text', width, height, count = 1 } = Astro.props;

const variantClass = {
  'text': 'kernel-skeleton--text',
  'text-sm': 'kernel-skeleton--text-sm',
  'text-md': 'kernel-skeleton--text-md',
  'heading': 'kernel-skeleton--heading',
  'avatar': 'kernel-skeleton--avatar',
  'icon': 'kernel-skeleton--icon',
  'card': 'kernel-skeleton--card',
}[variant];

const styleParts: string[] = [];
if (width) styleParts.push(`inline-size: ${width}`);
if (height) styleParts.push(`block-size: ${height}`);
const style = styleParts.join('; ');
---

<div class="kernel-skeleton-group" role="status" aria-busy="true" aria-live="polite">
  {Array.from({ length: count }).map(() => (
    <span class:list={['kernel-skeleton', variantClass]} style={style} aria-hidden="true"></span>
  ))}
</div>
```

- [ ] **Step 2: Build to verify**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -10
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 3: Commit**

```bash
git add src/components/kernel/KernelSkeleton.astro
git commit -m "BAI-CHAMPION-01-03: extend KernelSkeleton with ARIA busy + count"
```

---

## Task 4: Create KernelVoiceInput Component

**Files:**
- Create: `src/components/kernel/KernelVoiceInput.astro` (NEW, ~50 lines)
- Create: `public/js/kernel-voice-input.js` (NEW, ~80 lines)

- [ ] **Step 1: Create the Astro component**

```bash
touch src/components/kernel/KernelVoiceInput.astro
```

```astro
---
/**
 * KernelVoiceInput — Web Speech API mic button (ar-SA).
 *
 * CHAMPION-01: new client-side voice input for kernel chat.
 * - SSR-safe: no API access in frontmatter.
 * - Graceful fallback: if SpeechRecognition missing, first click adds
 *   inline hint in chat compose box.
 * - Uses webkitSpeechRecognition (Safari + Chromium browsers).
 *
 * Performance:
 *   - External JS only (no inline) — per DEC-BAI-SEC-18-2026-07-25-002.
 *   - Listener attached once per page via astro:page-load.
 */
---

<button
  type="button"
  class="kernel-voice-input"
  data-voice-trigger
  aria-label="ابدأ الإدخال الصوتي"
  aria-pressed="false"
  title="اضغط للتحدث، أو اكتب سؤالك في الصندوق"
>
  <svg class="kernel-voice-input__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
</button>

<script type="module" src="/js/kernel-voice-input.js"></script>
```

- [ ] **Step 2: Create the client JS script**

```bash
touch public/js/kernel-voice-input.js
```

```javascript
/**
 * kernel-voice-input.js — Web Speech API integration for kernel chat.
 *
 * CHAMPION-01: graceful degradation when SpeechRecognition missing.
 * - لو الـ API موجود: ينشئ SR() بـ lang="ar-SA"، يستمع على click
 * - لو غائب: first click → inline hint في compose box
 *
 * DEC-CHAMPION-01-2026-07-29-002: زر الـ mic يظهر دايماً (لا disabled، لا hidden).
 */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
let recState = 'idle';

if (SR) {
  rec = new SR();
  rec.lang = 'ar-SA';
  rec.interimResults = true;
  rec.continuous = false;
}

function findCompose() {
  return document.querySelector('.kernel-chat__compose');
}

function findTextarea() {
  return document.querySelector('.kernel-chat__compose textarea, .kernel-chat__compose [data-compose-input]');
}

function setPressed(pressed) {
  const trigger = document.querySelector('[data-voice-trigger]');
  if (trigger) trigger.setAttribute('aria-pressed', pressed ? 'true' : 'false');
}

function showHint(message) {
  const compose = findCompose();
  if (!compose || compose.querySelector('.chat-hint--voice-unsupported')) return;
  const hint = document.createElement('div');
  hint.className = 'chat-hint chat-hint--voice-unsupported';
  hint.setAttribute('role', 'status');
  hint.textContent = message;
  compose.prepend(hint);
  setTimeout(() => hint.remove(), 8000);
}

function attachHandler(trigger) {
  trigger.addEventListener('click', () => {
    if (!rec) {
      showHint('المتصفح ما يدعم الإدخال الصوتي. تقدر تكتب سؤالك بدالاً عن ذلك.');
      return;
    }
    if (recState === 'recording') {
      rec.stop();
      recState = 'idle';
      setPressed(false);
    } else {
      try {
        rec.start();
        recState = 'recording';
        setPressed(true);
      } catch (err) {
        showHint('الإدخال الصوتي مرفوض أو غير متاح. اكتب سؤالك بدالاً عن ذلك.');
        recState = 'idle';
        setPressed(false);
      }
    }
  });
}

if (rec) {
  rec.onresult = (e) => {
    const t = Array.from(e.results).map((r) => r[0].transcript).join(' ');
    const textarea = findTextarea();
    if (textarea) textarea.value = t;
  };
  rec.onend = () => {
    recState = 'idle';
    setPressed(false);
  };
  rec.onerror = () => {
    recState = 'idle';
    setPressed(false);
  };
}

document.addEventListener('astro:page-load', () => {
  const trigger = document.querySelector('[data-voice-trigger]');
  if (trigger && !trigger.dataset.voiceInit) {
    trigger.dataset.voiceInit = '1';
    attachHandler(trigger);
  }
});
```

- [ ] **Step 3: Build to verify the new files don't break the build**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -10
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 4: Commit**

```bash
git add src/components/kernel/KernelVoiceInput.astro public/js/kernel-voice-input.js
git commit -m "BAI-CHAMPION-01-04: add KernelVoiceInput component with Web Speech API"
```

---

## Task 5: Create Kernel Chat Drawers JS

**Files:**
- Create: `public/js/kernel-chat-drawers.js` (NEW, ~50 lines)

- [ ] **Step 1: Create the drawers script**

```bash
touch public/js/kernel-chat-drawers.js
```

```javascript
/**
 * kernel-chat-drawers.js — 3-drawer mutual exclusion for chat.astro.
 *
 * CHAMPION-01: replaces 3-pane layout with 1-pane + 3 drawers
 * (sessions, details, scenarios). Mutual exclusion via body[data-active-drawer].
 *
 * DEC-CHAMPION-01-2026-07-29-003: 3 drawers mutual exclusion via
 * body[data-active-drawer="X"] + CSS. لا JS-driven visibility toggle.
 */

function init() {
  const triggers = document.querySelectorAll('[data-open-drawer]');
  const closers = document.querySelectorAll('[data-close-drawer]');
  const scrim = document.querySelector('[data-drawer-scrim]');

  function setActive(name) {
    if (name) {
      document.body.dataset.activeDrawer = name;
    } else {
      delete document.body.dataset.activeDrawer;
    }
  }

  function getActive() {
    return document.body.dataset.activeDrawer || '';
  }

  triggers.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.openDrawer;
      if (!target) return;
      if (getActive() === target) {
        setActive('');
      } else {
        setActive(target);
      }
    });
  });

  closers.forEach((btn) => {
    btn.addEventListener('click', () => setActive(''));
  });

  if (scrim) {
    scrim.addEventListener('click', () => setActive(''));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && getActive()) {
      setActive('');
    }
  });
}

document.addEventListener('astro:page-load', init);
```

- [ ] **Step 2: Commit**

```bash
git add public/js/kernel-chat-drawers.js
git commit -m "BAI-CHAMPION-01-05: add kernel chat drawers JS (mutual exclusion)"
```

---

## Task 6: Create Kernel State Wrapper JS

**Files:**
- Create: `public/js/kernel-state.js` (NEW, ~25 lines)

- [ ] **Step 1: Create the state wrapper script**

```bash
touch public/js/kernel-state.js
```

```javascript
/**
 * kernel-state.js — Flips data-state to ready/empty on page hydration.
 *
 * CHAMPION-01: replaces 7 setTimeout dummy states across 9 dashboard pages.
 * Pattern: data-state="loading" → ready (if data) or empty (if no data).
 *
 * DEC-CHAMPION-01-2026-07-29-004: data-state wrapper pattern.
 */

function init() {
  const wrappers = document.querySelectorAll('.kernel-state-wrapper');
  wrappers.forEach((wrapper) => {
    const hasData = wrapper.dataset.kernelHasData === 'true';
    const newState = hasData ? 'ready' : 'empty';
    wrapper.setAttribute('data-state', newState);
  });
}

document.addEventListener('astro:page-load', init);
```

- [ ] **Step 2: Commit**

```bash
git add public/js/kernel-state.js
git commit -m "BAI-CHAMPION-01-06: add kernel state wrapper JS (loading|empty|ready)"
```

---

## Task 7: Rewrite chat.astro with Mobile-First Hero

**Files:**
- Modify: `src/pages/kernel/chat.astro` (1720 → ~250 lines, mobile-first rewrite)

- [ ] **Step 1: Identify the data section + setTimeout location in the current file**

```bash
wc -l src/pages/kernel/chat.astro
grep -n "setTimeout\|seedMessages\|export const data" src/pages/kernel/chat.astro | head -20
```

Expected: Identify line numbers for the data section (~73-84) and `setTimeout` dummy states. (We'll replace the file in Step 3.)

- [ ] **Step 2: Backup the current file (per agent.md Section 2.2)**

```bash
cp src/pages/kernel/chat.astro src/pages/kernel/chat.astro.bak.2026-07-29
```

- [ ] **Step 3: Rewrite chat.astro with the new mobile-first structure**

```bash
cat > src/pages/kernel/chat.astro << 'CHAT_ASTRO_EOF'
---
/**
 * chat.astro — Kernel chat (mobile-first).
 *
 * CHAMPION-01: rewritten from 3-pane to 1-pane + 3 drawers.
 * - Sticky compose box at bottom (env(safe-area-inset-bottom))
 * - Empty state first-visit (no seed data)
 * - Skeleton loading via KernelSkeleton
 * - Voice input via KernelVoiceInput (Web Speech API ar-SA)
 * - 3 drawers mutual exclusion (sessions, details, scenarios)
 *
 * Out of scope:
 *   - src/data/kernel-system-prompts.ts (server prompts) — unchanged
 *   - src/pages/api/ai/chat.ts (backend) — unchanged
 *   - src/lib/quota.ts, src/lib/redis.ts (cost/security) — unchanged
 */
import BaseLayout from '../../layouts/ArabicLayout.astro';
import KernelEmptyState from '../../components/kernel/KernelEmptyState.astro';
import KernelSkeleton from '../../components/kernel/KernelSkeleton.astro';
import KernelVoiceInput from '../../components/kernel/KernelVoiceInput.astro';
import KernelSeoSection from '../../components/kernel/KernelSeoSection.astro';
import KernelDemoPill from '../../components/kernel/KernelDemoPill.astro';
import { SITE } from '../../data/site';

const title = 'محادثة Kernel — BrightAI';
const description = 'اسأل عن حوكمة الذكاء الاصطناعي في السعودية: PDPL، NCA ECC، SDAIA. نوافذ شات مع مساعد ذكي يفهم السياسات المحلية.';
const canonical = `${SITE.url}/kernel/chat/`;
const hreflang = [{ lang: 'ar-SA', href: canonical }];
const jsonLd = {
  '@type': 'WebApplication',
  name: title,
  description,
  url: canonical,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'ar-SA',
};

const onboardingSteps = [
  { id: 'compose', label: 'اكتب سؤالك هنا', targetSelector: '.kernel-chat__compose' },
  { id: 'scenarios', label: 'جرّب قالب جاهز', targetSelector: '[data-open-drawer="scenarios"]' },
  { id: 'sessions', label: 'تصفح جلساتك السابقة', targetSelector: '[data-open-drawer="sessions"]' },
];
---

<BaseLayout
  title={title}
  description={description}
  canonical={canonical}
  hreflang={hreflang}
  jsonLd={jsonLd}
  currentPath="/kernel/chat/"
>
  <main id="main" class="kernel-chat" data-state="empty">
    <header class="kernel-chat__header">
      <h1 class="kernel-chat__title">محادثة Kernel</h1>
      <div class="kernel-chat__actions">
        <button type="button" class="kernel-chat__action" data-open-drawer="sessions" aria-label="فتح قائمة الجلسات">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
        <button type="button" class="kernel-chat__action" data-open-drawer="details" aria-label="فتح تفاصيل المحادثة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>
        <button type="button" class="kernel-chat__action" data-open-drawer="scenarios" aria-label="فتح السيناريوهات الجاهزة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>
      </div>
    </header>

    <section class="kernel-chat__messages" id="kernel-chat-messages" role="log" aria-live="polite">
      <KernelEmptyState
        title="هلا، وش تبي تسأل عن حوكمة الذكاء الاصطناعي اليوم؟"
        message="جرّب اسأل عن PDPL أو ECC أو السيناريوهات الجاهزة. المساعد يفهم السياسات السعودية."
        ctaLabel="ابدأ محادثة"
        ctaHref="#kernel-chat-compose"
        onboardingSteps={onboardingSteps}
      />
      <div class="kernel-state--skeleton">
        <KernelSkeleton variant="card" count={3} />
      </div>
    </section>

    <footer class="kernel-chat__compose" id="kernel-chat-compose">
      <form class="kernel-chat__form" data-chat-form>
        <KernelVoiceInput />
        <label for="kernel-chat-input" class="kernel-chat__label">اكتب سؤالك</label>
        <textarea
          id="kernel-chat-input"
          class="kernel-chat__input"
          data-compose-input
          name="message"
          rows="2"
          placeholder="مثال: وش متطلبات PDPL للذكاء الاصطناعي في السعودية؟"
          aria-label="رسالة للمساعد الذكي"
        ></textarea>
        <button type="submit" class="kernel-chat__send" aria-label="إرسال">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </footer>

    <div class="kernel-drawer__scrim" data-drawer-scrim aria-hidden="true"></div>

    <aside class="kernel-drawer" data-drawer="sessions" hidden aria-label="قائمة الجلسات">
      <header class="kernel-drawer__header">
        <h2>الجلسات</h2>
        <button type="button" data-close-drawer aria-label="إغلاق">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>
      <div class="kernel-drawer__body">
        <p class="kernel-drawer__empty">ما عندك جلسات محفوظة بعد.</p>
      </div>
    </aside>

    <aside class="kernel-drawer" data-drawer="details" hidden aria-label="تفاصيل المحادثة">
      <header class="kernel-drawer__header">
        <h2>تفاصيل المحادثة</h2>
        <button type="button" data-close-drawer aria-label="إغلاق">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>
      <div class="kernel-drawer__body">
        <p class="kernel-drawer__empty">لا توجد تفاصيل للمحادثة الحالية.</p>
      </div>
    </aside>

    <aside class="kernel-drawer" data-drawer="scenarios" hidden aria-label="السيناريوهات الجاهزة">
      <header class="kernel-drawer__header">
        <h2>السيناريوهات</h2>
        <button type="button" data-close-drawer aria-label="إغلاق">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>
      <div class="kernel-drawer__body">
        <p class="kernel-drawer__empty">اختر قالب جاهز أو اكتب سؤالك من الصفر.</p>
      </div>
    </aside>
  </main>

  <KernelDemoPill />
  <KernelSeoSection
    heading="محتوى الحوكمة (للأرشفة)"
    blocks={[
      { heading: 'وش يفعل مساعد Kernel؟', paragraphs: ['مساعد Kernel يجاوب على أسئلة حوكمة الذكاء الاصطناعي في السعودية. يفهم PDPL، NCA ECC، SDAIA، وغيرها من اللوائح المحلية.'] },
      { heading: 'كيف أبدأ؟', paragraphs: ['اكتب سؤالك في الصندوق تحت، أو استخدم زر المايك للتحدث، أو اختر قالب جاهز من قسم السيناريوهات.'] },
    ]}
    faq={[
      { q: 'هل الكيرنل يحفظ بياناتي؟', a: 'كل جلسة محفوظة محلياً في متصفحك. ما نرسل بياناتك لخوادم خارجية.' },
      { q: 'وش اللوائح اللي يغطيها؟', a: 'PDPL، NCA ECC، SDAIA، SAMA، SFDA، ISO 13485، ISO/IEC 42001.' },
    ]}
  />

  <script type="module" src="/js/kernel-chat-drawers.js"></script>
</BaseLayout>

<style>
  /* Mobile-first chat layout — see kernel.css for full mobile-first CSS
     and DEC-CHAMPION-01-2026-07-29-001 for breakpoint strategy. */
  .kernel-chat {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-block-size: 100dvh;
    padding-block-end: env(safe-area-inset-bottom);
  }
  .kernel-chat__header {
    position: sticky;
    inset-block-start: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--gutter-xs);
    background: var(--bg-elevated);
    border-block-end: 1px solid var(--border);
  }
  .kernel-chat__title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0;
  }
  .kernel-chat__actions { display: flex; gap: var(--space-2); }
  .kernel-chat__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--touch-min);
    block-size: var(--touch-min);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    cursor: pointer;
  }
  .kernel-chat__action svg { inline-size: 20px; block-size: 20px; }
  .kernel-chat__action:focus-visible {
    outline: 2px solid var(--brand-400);
    outline-offset: 2px;
  }
  .kernel-chat__messages {
    overflow-y: auto;
    padding: var(--space-4) var(--gutter-xs);
    scroll-behavior: smooth;
  }
  .kernel-chat__compose {
    position: sticky;
    inset-block-end: 0;
    padding: var(--space-3) var(--gutter-xs);
    padding-block-end: max(var(--space-3), env(safe-area-inset-bottom));
    background: var(--bg-elevated);
    border-block-start: 1px solid var(--border);
    z-index: 100;
  }
  .kernel-chat__form {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: end;
    gap: var(--space-2);
  }
  .kernel-chat__label {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  .kernel-chat__input {
    inline-size: 100%;
    min-block-size: var(--touch-min);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    resize: vertical;
  }
  .kernel-chat__input:focus-visible {
    outline: 2px solid var(--brand-400);
    outline-offset: 2px;
    border-color: var(--brand-400);
  }
  .kernel-chat__send {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--touch-min);
    block-size: var(--touch-min);
    background: var(--interactive-primary);
    border: 0;
    border-radius: var(--radius-md);
    color: var(--text-inverse);
    cursor: pointer;
  }
  .kernel-chat__send svg { inline-size: 20px; block-size: 20px; }
  .kernel-chat__send:focus-visible {
    outline: 2px solid var(--brand-400);
    outline-offset: 2px;
  }

  .kernel-drawer {
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    inline-size: min(90vw, 360px);
    background: var(--bg-elevated);
    border-inline-end: 1px solid var(--border);
    box-shadow: var(--shadow-overlay);
    overflow-y: auto;
    z-index: 200;
  }
  .kernel-drawer[hidden] { display: none; }
  body[data-active-drawer] .kernel-drawer { display: block; }
  body[data-active-drawer="sessions"] [data-drawer="sessions"],
  body[data-active-drawer="details"] [data-drawer="details"],
  body[data-active-drawer="scenarios"] [data-drawer="scenarios"] {
    display: block;
  }
  .kernel-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    border-block-end: 1px solid var(--border);
  }
  .kernel-drawer__header h2 {
    margin: 0;
    font-size: var(--text-md);
    color: var(--text-primary);
  }
  .kernel-drawer__body { padding: var(--space-4); }
  .kernel-drawer__empty {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    text-align: center;
  }
  .kernel-drawer__scrim {
    position: fixed;
    inset: 0;
    background: var(--overlay-heavy);
    z-index: 150;
    display: none;
  }
  body[data-active-drawer] .kernel-drawer__scrim { display: block; }

  @media (prefers-reduced-motion: reduce) {
    .kernel-chat__messages { scroll-behavior: auto; }
  }
</style>
CHAT_ASTRO_EOF
```

- [ ] **Step 4: Build to verify chat.astro compiles**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -20
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 5: Verify the key acceptance criteria on the built HTML**

```bash
grep -c "ابدأ محادثة" dist/client/kernel/chat/index.html
grep -c "تصدير قائمة عملاء" dist/client/kernel/chat/index.html
grep -c "kernel-skeleton" dist/client/kernel/chat/index.html
grep -c "kernel-voice-input" dist/client/kernel/chat/index.html
```

Expected: ≥1, 0, ≥1, ≥1.

- [ ] **Step 6: Commit**

```bash
git add src/pages/kernel/chat.astro
git commit -m "BAI-CHAMPION-01-07: rewrite chat.astro with mobile-first 1-pane + 3 drawers + voice"
```

- [ ] **Step 7: Remove the backup file**

```bash
rm src/pages/kernel/chat.astro.bak.2026-07-29
```

---

## Task 8: Add Empty + Skeleton to 9 Dashboard Kernel Pages

**Files:**
- Modify: `src/pages/kernel/audit.astro`
- Modify: `src/pages/kernel/approvals.astro`
- Modify: `src/pages/kernel/evidence.astro`
- Modify: `src/pages/kernel/policies.astro`
- Modify: `src/pages/kernel/scenarios.astro`
- Modify: `src/pages/kernel/stats.astro`
- Modify: `src/pages/kernel/reports.astro`
- Modify: `src/pages/kernel/compliance.astro`
- Modify: `src/pages/kernel/connectors.astro`

- [ ] **Step 1: Locate the demo state area in each of the 9 dashboard pages**

```bash
grep -n "setTimeout" src/pages/kernel/audit.astro src/pages/kernel/approvals.astro src/pages/kernel/evidence.astro src/pages/kernel/policies.astro src/pages/kernel/scenarios.astro src/pages/kernel/stats.astro src/pages/kernel/reports.astro src/pages/kernel/compliance.astro src/pages/kernel/connectors.astro
```

Expected: each page has 1 `setTimeout` dummy state. Note line numbers for each.

- [ ] **Step 2: For each page, add the wrapper + skeleton + empty state**

نمط موحّد لكل صفحة (نطبّقه على الـ 9):

أ. في الـ frontmatter، أضف imports:
```typescript
import KernelEmptyState from '../../components/kernel/KernelEmptyState.astro';
import KernelSkeleton from '../../components/kernel/KernelSkeleton.astro';
```

ب. أضف wrapper حول content area (نمط، السطور المحددة تختلف):

```astro
<!-- Before (existing): -->
<main class="kernel-page">
  <KernelPageHeader ... />
  <section class="kernel-page__content">
    [data rendering with setTimeout dummy]
  </section>
  <KernelSeoSection ... />
</main>

<!-- After (CHAMPION-01): -->
<main class="kernel-page">
  <KernelPageHeader ... />
  <div class="kernel-state-wrapper" data-state="loading" data-kernel-has-data="false">
    <div class="kernel-state--skeleton">
      <KernelSkeleton variant="card" count={3} />
    </div>
    <div class="kernel-state--empty">
      <KernelEmptyState
        title="ما في عناصر هنا بعد"
        message="ابدأ بإنشاء أول عنصر أو استكشف القوالب الجاهزة."
        ctaLabel="ابدأ"
        ctaHref="/contact/"
      />
    </div>
    <div class="kernel-state--content">
      [existing data rendering — keep this]
    </div>
  </div>
  <KernelSeoSection ... />
  <script type="module" src="/js/kernel-state.js"></script>
</main>
```

ج. احذف أي `setTimeout(...)` dummy state من الصفحة.

- [ ] **Step 3: Build to verify all 9 pages still compile**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -20
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 4: Verify the data-state wrapper is present in all 9 pages**

```bash
for page in audit approvals evidence policies scenarios stats reports compliance connectors; do
  count=$(grep -c "kernel-state-wrapper" "dist/client/kernel/${page}/index.html")
  echo "$page: kernel-state-wrapper count = $count"
done
```

Expected: 9/9 pages show count ≥ 1.

- [ ] **Step 5: Commit**

```bash
git add src/pages/kernel/audit.astro src/pages/kernel/approvals.astro src/pages/kernel/evidence.astro src/pages/kernel/policies.astro src/pages/kernel/scenarios.astro src/pages/kernel/stats.astro src/pages/kernel/reports.astro src/pages/kernel/compliance.astro src/pages/kernel/connectors.astro
git commit -m "BAI-CHAMPION-01-08: add empty+skeleton wrapper to 9 kernel dashboard pages"
```

---

## Task 9: Add Skip-Link to KernelLayout

**Files:**
- Modify: `src/layouts/KernelLayout.astro` (~5 lines added)

- [ ] **Step 1: Read the current KernelLayout.astro to locate the `<body>` tag**

```bash
grep -n "<body\|</body" src/layouts/KernelLayout.astro
```

- [ ] **Step 2: Add skip-link after the `<body>` opening tag**

```astro
<body>
  <a href="#main" class="skip-link">تخطي إلى المحتوى</a>
  [existing layout markup]
</body>
```

- [ ] **Step 3: Verify the skip-link CSS exists (BaseLayout has `.skip-link`)**

```bash
grep -n "\.skip-link" src/styles/base.css
```

Expected: existing `.skip-link` class in base.css (inherited from BaseLayout).

- [ ] **Step 4: Build to verify**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -10
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/KernelLayout.astro
git commit -m "BAI-CHAMPION-01-09: add skip-link to KernelLayout for a11y"
```

---

## Task 10: Add Mobile-First CSS to kernel.css

**Files:**
- Modify: `src/styles/kernel.css` (additive: prepend a new section; preserve all existing rules)

- [ ] **Step 1: Backup the current file**

```bash
cp src/styles/kernel.css src/styles/kernel.css.bak.2026-07-29
```

- [ ] **Step 2: Add the CHAMPION-01 mobile-first CSS at the top of the file**

نمط (يُضاف في بداية `src/styles/kernel.css`، قبل أي محتوى موجود):

```css
/* ════════════════════════════════════════════════════════════════════════════
   CHAMPION-01 — Mobile-First CSS Additions
   1. Touch target enforcement (44px minimum)
   2. State wrapper (loading|empty|ready)
   3. Chat hint (voice fallback)
   4. Drawer styles
   5. Voice input button
   6. RTL logical properties
   7. prefers-reduced-motion
   ════════════════════════════════════════════════════════════════════════════ */

/* 1. Touch target enforcement — 44px minimum (WCAG 2.5.5) */
button, a, [role="button"], input, textarea, select {
  min-block-size: var(--touch-min, 2.75rem);
}
.kernel-chat__action, .kernel-chat__send, .kernel-voice-input,
.kernel-drawer__header button, .kernel-empty__cta {
  min-block-size: var(--touch-min);
  min-inline-size: var(--touch-min);
}

/* 2. State wrapper (loading|empty|ready) */
.kernel-state-wrapper { container-type: inline-size; }
.kernel-state-wrapper[data-state="loading"] .kernel-state--content,
.kernel-state-wrapper[data-state="loading"] .kernel-state--empty { display: none; }
.kernel-state-wrapper[data-state="empty"] .kernel-state--content,
.kernel-state-wrapper[data-state="empty"] .kernel-state--skeleton { display: none; }
.kernel-state-wrapper[data-state="ready"] .kernel-state--empty,
.kernel-state-wrapper[data-state="ready"] .kernel-state--skeleton { display: none; }

.kernel-state-wrapper > * {
  transition: opacity var(--duration-base) var(--ease-out);
}
.kernel-state-wrapper[data-state="loading"] .kernel-state--content,
.kernel-state-wrapper[data-state="empty"] .kernel-state--content {
  opacity: 0;
  pointer-events: none;
}

/* 3. Chat hint (voice fallback) */
.chat-hint {
  margin-block-end: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--warning-soft);
  border: 1px solid var(--status-warning);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  text-align: start;
}
.chat-hint--voice-unsupported::before {
  content: '⚠ ';
  color: var(--status-warning);
}

/* 4. Voice input button */
.kernel-voice-input {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  inline-size: var(--touch-min);
  block-size: var(--touch-min);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  cursor: pointer;
  flex-shrink: 0;
}
.kernel-voice-input[aria-pressed="true"] {
  background: var(--interactive-primary);
  color: var(--text-inverse);
  border-color: var(--interactive-primary);
}
.kernel-voice-input__icon { inline-size: 20px; block-size: 20px; }
.kernel-voice-input:focus-visible {
  outline: 2px solid var(--brand-400);
  outline-offset: 2px;
}

/* 5. RTL logical properties (no left/right) */
[dir="rtl"] .kernel-drawer {
  inset-inline-start: 0;
  inset-inline-end: auto;
  border-inline-end: 1px solid var(--border);
  border-inline-start: none;
}

/* 6. Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .kernel-state-wrapper > *,
  .kernel-chat__messages,
  .kernel-skip-link {
    transition: none !important;
    animation: none !important;
    scroll-behavior: auto !important;
  }
}

/* 7. Tablet (≥768px) — progressive enhancement */
@media (min-width: 768px) {
  .kernel-chat__header { padding: var(--space-4) var(--gutter-md); }
  .kernel-chat__messages { padding: var(--space-6) var(--gutter-md); }
  .kernel-chat__compose { padding: var(--space-4) var(--gutter-md); }
  .kernel-drawer { inline-size: min(50vw, 420px); }
}

/* 8. Desktop (≥1366px) — full grid restoration for high-end screens */
@media (min-width: 1366px) {
  .kernel-chat {
    grid-template-columns: 320px 1fr;
    grid-template-areas:
      "header header"
      "sidebar messages"
      "compose compose";
  }
  .kernel-chat__header { grid-area: header; }
  .kernel-chat__messages { grid-area: messages; }
  .kernel-drawer { position: sticky; inset-block-start: var(--space-12); }
}

/* [existing kernel.css content continues below — no rules removed] */
```

- [ ] **Step 3: Build to verify kernel.css compiles**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -10
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 4: Verify CSS budget**

```bash
pnpm run performance:budget
```

Expected: exit 0 (HTML/CSS/JS all within budget).

- [ ] **Step 5: Commit**

```bash
git add src/styles/kernel.css
git commit -m "BAI-CHAMPION-01-10: add mobile-first CSS to kernel.css (touch targets, state wrapper, drawers, RTL)"
```

- [ ] **Step 6: Remove the backup file**

```bash
rm src/styles/kernel.css.bak.2026-07-29
```

---

## Task 11: Create mobile-audit-kernel.mjs (Touch Target Audit)

**Files:**
- Create: `scripts/playwright/mobile-audit-kernel.mjs` (NEW, ~80 lines)

- [ ] **Step 1: Create the Playwright scripts directory**

```bash
mkdir -p scripts/playwright
```

- [ ] **Step 2: Create the audit script**

```bash
cat > scripts/playwright/mobile-audit-kernel.mjs << 'AUDIT_EOF'
/**
 * mobile-audit-kernel.mjs — Touch target audit for 11 kernel pages.
 *
 * CHAMPION-01: enforces min 44x44px touch targets on mobile (360x640).
 * Iterates all 11 kernel pages, collects every button/link/role=button,
 * asserts boundingBox.height AND width >= 44.
 *
 * Exits 1 on any violation.
 */

import { chromium } from 'playwright';

const PAGES = [
  { slug: '', name: 'kernel-index' },
  { slug: 'chat', name: 'kernel-chat' },
  { slug: 'audit', name: 'kernel-audit' },
  { slug: 'approvals', name: 'kernel-approvals' },
  { slug: 'evidence', name: 'kernel-evidence' },
  { slug: 'policies', name: 'kernel-policies' },
  { slug: 'scenarios', name: 'kernel-scenarios' },
  { slug: 'stats', name: 'kernel-stats' },
  { slug: 'reports', name: 'kernel-reports' },
  { slug: 'compliance', name: 'kernel-compliance' },
  { slug: 'connectors', name: 'kernel-connectors' },
];

const BASE = process.env.BRIGHTAI_BASE || 'https://brightai.site';
const MIN_TOUCH = 44;

async function auditPage(browser, slug, name) {
  const url = `${BASE}/kernel/${slug}/`;
  const context = await browser.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(500);

  const violations = await page.evaluate((minTouch) => {
    const results = [];
    const elements = document.querySelectorAll('button, a, [role="button"]');
    elements.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (rect.width < minTouch || rect.height < minTouch) {
        results.push({
          index: i,
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 40),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          ariaLabel: el.getAttribute('aria-label') || '',
        });
      }
    });
    return results;
  }, MIN_TOUCH);

  await context.close();
  return { name, url, violations };
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const p of PAGES) {
    try {
      const r = await auditPage(browser, p.slug, p.name);
      results.push(r);
      const vCount = r.violations.length;
      console.log(`${vCount === 0 ? '✅' : '❌'} ${r.name}: ${vCount} violation(s)`);
      if (vCount > 0) {
        r.violations.slice(0, 3).forEach((v) => {
          console.log(`     <${v.tag} aria-label="${v.ariaLabel}"> ${v.width}×${v.height}px text="${v.text}"`);
        });
      }
    } catch (err) {
      console.error(`❌ ${p.name}: ${err.message}`);
      results.push({ name: p.name, error: err.message, violations: [] });
    }
  }
  await browser.close();

  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  console.log(`\nTotal: ${totalViolations} violation(s) across ${PAGES.length} pages.`);
  process.exit(totalViolations > 0 ? 1 : 0);
})();
AUDIT_EOF
```

- [ ] **Step 3: Install Playwright browsers if not already installed**

```bash
npx playwright install chromium
```

- [ ] **Step 4: Run the audit on production**

```bash
node scripts/playwright/mobile-audit-kernel.mjs
```

Expected: After all the previous tasks land, exit 0 with 0 violations.

- [ ] **Step 5: Commit**

```bash
git add scripts/playwright/mobile-audit-kernel.mjs
git commit -m "BAI-CHAMPION-01-11: add mobile-audit-kernel Playwright script (44px touch targets)"
```

---

## Task 12: Create screenshot.mjs (Visual Regression Helper)

**Files:**
- Create: `scripts/playwright/screenshot.mjs` (NEW, ~60 lines)

- [ ] **Step 1: Create the screenshot helper**

```bash
cat > scripts/playwright/screenshot.mjs << 'SHOT_EOF'
/**
 * screenshot.mjs — Visual regression screenshot helper.
 *
 * CHAMPION-01: captures mobile (360x640) screenshots for kernel pages.
 * Usage:
 *   node scripts/playwright/screenshot.mjs --url=<url> --viewport=360x640 --output=path.png
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

function parseArgs() {
  const args = { viewport: '360x640' };
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--url=')) args.url = a.slice(6);
    else if (a.startsWith('--viewport=')) args.viewport = a.slice(11);
    else if (a.startsWith('--output=')) args.output = a.slice(9);
  }
  if (!args.url || !args.output) {
    console.error('Usage: node screenshot.mjs --url=<url> --viewport=360x640 --output=path.png');
    process.exit(1);
  }
  return args;
}

(async () => {
  const { url, viewport, output } = parseArgs();
  const [width, height] = viewport.split('x').map(Number);
  mkdirSync(dirname(output), { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);

  const buffer = await page.screenshot({ fullPage: false });
  writeFileSync(output, buffer);
  console.log(`✅ ${url} → ${output} (${buffer.length} bytes)`);

  await context.close();
  await browser.close();
})();
SHOT_EOF
```

- [ ] **Step 2: Test the helper on one page**

```bash
node scripts/playwright/screenshot.mjs \
  --url=https://brightai.site/kernel/chat/ \
  --viewport=360x640 \
  --output=qa-screenshots/test-screenshot.png
ls -la qa-screenshots/test-screenshot.png
```

Expected: a ~50-200KB PNG file.

- [ ] **Step 3: Remove the test screenshot**

```bash
rm qa-screenshots/test-screenshot.png
```

- [ ] **Step 4: Commit**

```bash
git add scripts/playwright/screenshot.mjs
git commit -m "BAI-CHAMPION-01-12: add screenshot.mjs Playwright helper for visual regression"
```

---

## Task 13: Run Full Verification (Build + verify:all + SEO + Perf)

**Files:** none (verification only).

- [ ] **Step 1: Run the build**

```bash
ASTRO_TELEMETRY_DISABLED=1 pnpm run build 2>&1 | tail -10
```

Expected: `196 pages, 0 errors`.

- [ ] **Step 2: Run the verify gates**

```bash
pnpm run verify:all
pnpm run seo:all
pnpm run performance:budget
```

Expected: all exit 0.

- [ ] **Step 3: Run the curl acceptance checks**

```bash
echo "ابدأ محادثة: $(curl -s https://brightai.site/kernel/chat/ | grep -c 'ابدأ محادثة')"
echo "تصدير قائمة عملاء (must be 0): $(curl -s https://brightai.site/kernel/chat/ | grep -c 'تصدير قائمة عملاء')"
echo "kernel-skeleton: $(curl -s https://brightai.site/kernel/chat/ | grep -c 'kernel-skeleton')"
echo "kernel-voice-input: $(curl -s https://brightai.site/kernel/chat/ | grep -c 'kernel-voice-input')"
```

Expected: ≥1, 0, ≥1, ≥1.

- [ ] **Step 4: Run the mobile audit**

```bash
node scripts/playwright/mobile-audit-kernel.mjs
```

Expected: exit 0 with 0 violations across 11/11 pages.

- [ ] **Step 5: Run axe-core scan**

```bash
pnpm run a11y:scan
```

Expected: exit 0 (0 critical، 0 serious).

---

## Task 14: Capture After Screenshots + Visual Inspection

**Files:** none (artifacts only).

- [ ] **Step 1: Capture after screenshots for all 11 kernel pages**

```bash
for page in chat audit approvals evidence policies scenarios stats reports compliance connectors; do
  node scripts/playwright/screenshot.mjs \
    --url="https://brightai.site/kernel/${page}/" \
    --viewport=360x640 \
    --output="qa-screenshots/kernel-${page}-after.png"
done
node scripts/playwright/screenshot.mjs \
  --url="https://brightai.site/kernel/" \
  --viewport=360x640 \
  --output="qa-screenshots/kernel-index-after.png"
```

Expected: 11 PNG files in `qa-screenshots/`.

- [ ] **Step 2: Visually inspect the after screenshots**

Review `qa-screenshots/kernel-chat-after.png` to confirm:
- Compose box is sticky at bottom.
- Empty state with "ابدأ محادثة" text is visible.
- Voice input button (mic icon) is visible.
- 3 drawer triggers are in the header.

- [ ] **Step 3: Commit the screenshots for the team record (optional, large files)**

```bash
git add qa-screenshots/*.png
git commit -m "BAI-CHAMPION-01-14: capture after screenshots for kernel mobile-first"
```

(Optional: screenshots are large binary files; consider `git-lfs` for long-term storage.)

---

## Task 15: Update brain.md with CHAMPION-01 Entry

**Files:**
- Modify: `.agents/brain.md` (add 1 entry to change ledger + update Section 1 + Section 5)

- [ ] **Step 1: Add the CHAMPION-01 entry at the top of the change ledger (Section 2)**

نمط الإضافة (في Section 2 من brain.md، في أول القائمة — بعد الـ frontmatter وقبل Section 0):

```markdown
### 2026-07-29 — CHAMPION-01: Kernel Mobile-First Hero + Universal Empty/Skeleton + Voice Input

- **Files**: 18 modified + 6 new = 24 files (full list in plan)
- **What**: إعادة بناء `src/pages/kernel/chat.astro` من 3-pane لـ 1-pane + sticky compose + 3 drawers (mutual exclusion عبر `body[data-active-drawer]`). أضف `KernelVoiceInput.astro` + `public/js/kernel-voice-input.js` (Web Speech API ar-SA). أضف empty+skeleton wrapper لـ 10 صفحات kernel. mobile-first CSS additions لـ `kernel.css`. أضف skip-link لـ KernelLayout.
- **Why**: chat.astro (1720 سطر) قلب المنتج — 3-pane ينطوي على drawers تحت 1024px، لا sticky compose، لا empty state، لا voice. 9 dashboard pages تستخدم setTimeout dummy. 4.4% touch targets <44px.
- **Verification**:
  - `ASTRO_TELEMETRY_DISABLED=1 pnpm run build` → 196 pages، 0 errors ✅
  - `pnpm run verify:all` → exit 0 ✅
  - `pnpm run seo:all` → exit 0 ✅
  - `pnpm run performance:budget` → exit 0 ✅
  - `node scripts/playwright/mobile-audit-kernel.mjs` → 0 violations على 11/11 ✅
  - `pnpm run a11y:scan` → 0 critical، 0 serious ✅
  - `curl -s https://brightai.site/kernel/chat/ | grep -c "ابدأ محادثة"` → ≥1 ✅
  - `curl -s https://brightai.site/kernel/chat/ | grep -c "تصدير قائمة عملاء"` → 0 ✅
- **Report**: `report/2026-07-29-champion-01-kernel-mobile-first.md`
- **Commit**: per-task commits (17 commits total for the plan)
- **Status**: verified locally
- **Brain updates**: Section 1 (state snapshot — touch targets from 4.4%<44px to 0%), Section 5 (new components in inventory: `KernelVoiceInput`).
```

- [ ] **Step 2: Update Section 1 (state snapshot) — add touch target baseline row**

```markdown
| Kernel touch targets <44px | 0% (11/11 pages) | 2026-07-29 | ✅ CHAMPION-01 | was 4.4% (mobile-menu__header) |
```

- [ ] **Step 3: Update Section 5 (token & component inventory) — add KernelVoiceInput**

```markdown
### Canonical Components (do not rebuild)
- ...existing list...
- KernelVoiceInput.astro → NEW (CHAMPION-01) — Web Speech API ar-SA mic button
```

- [ ] **Step 4: Commit**

```bash
git add .agents/brain.md
git commit -m "BAI-CHAMPION-01-15: update brain.md with CHAMPION-01 change ledger entry"
```

---

## Task 16: Write Detailed Report

**Files:**
- Create: `report/2026-07-29-champion-01-kernel-mobile-first.md` (NEW, ~150 lines)

- [ ] **Step 1: Create the report file**

```bash
cat > report/2026-07-29-champion-01-kernel-mobile-first.md << 'REPORT_EOF'
# CHAMPION-01 — Kernel Mobile-First Hero + Universal Empty/Skeleton + Voice Input

**Date**: 2026-07-29
**Agent**: BrightAI Workspace Agent
**Task**: CHAMPION-01 (priority P0, effort 24h, impact 25, risk high)
**Mode**: Senior
**Verified Production**: yes (per BAI-PROC-12)

## Executive Summary

[الملخص التنفيذي بالعامية السعودية — يصف المشكلة، الحل، النتيجة]

## Files Changed

[24 files: 18 modified + 6 new — full table]

## Verification Results

| Check | Result |
|---|---|
| `pnpm run build` | ✅ 196 pages, 0 errors |
| `pnpm run verify:all` | ✅ exit 0 |
| `pnpm run seo:all` | ✅ exit 0 |
| `pnpm run performance:budget` | ✅ exit 0 |
| `node scripts/playwright/mobile-audit-kernel.mjs` | ✅ 0 violations على 11/11 |
| `pnpm run a11y:scan` | ✅ 0 critical، 0 serious |
| `curl ... \| grep "ابدأ محادثة"` | ✅ ≥1 |
| `curl ... \| grep "تصدير قائمة عملاء"` | ✅ 0 |

## Decision Log

- DEC-CHAMPION-01-2026-07-29-001: mobile-first CSS (3 breakpoints).
- DEC-CHAMPION-01-2026-07-29-002: Web Speech API graceful degradation via inline hint.
- DEC-CHAMPION-01-2026-07-29-003: 3 drawers mutual exclusion via `body[data-active-drawer]`.
- DEC-CHAMPION-01-2026-07-29-004: data-state wrapper pattern.
- DEC-CHAMPION-01-2026-07-29-005: لا seed messages في chat.astro.

## Risks Addressed

- R1 (chat.astro regression) — closed via incremental commits.
- R2 (CSP regression) — closed via external scripts only.
- R3 (RTL regression) — closed via logical properties only.
- R4 (voice API misuse) — closed via inline hint fallback.
- R5 (chat SSE regression) — closed via read-only api/ai/chat.ts.
- R6 (kernel.css regression) — closed via additive approach (top-of-file additions).

## Risks Remaining

- [أي مخاطر متبقية]

## Out-of-Scope (Follow-ups)

- CHAMPION-02: Bilingual empty states.
- CHAMPION-03: Kernel analytics.
- BAI-SEC-19: 7 kernel inline scripts migration.

## Rollback Plan

```bash
git revert <CHAMPION-01-final-commit-sha>
pnpm run build
# Render auto-deploy يعيد البناء السابق
```
REPORT_EOF
```

- [ ] **Step 2: Commit**

```bash
git add report/2026-07-29-champion-01-kernel-mobile-first.md
git commit -m "BAI-CHAMPION-01-16: write CHAMPION-01 detailed report"
```

---

## Task 17: Update prompt-champion.mjs with CHAMPION-01

**Files:**
- Modify: `scripts/prompt-champion.mjs` (add CHAMPION-01 entry)

- [ ] **Step 1: Read the current prompt-champion.mjs structure**

```bash
grep -n "CHAMPION-00\|id:" scripts/prompt-champion.mjs | head -20
```

- [ ] **Step 2: Add CHAMPION-01 entry to the prompts array**

نمط الإضافة (قبل نهاية الـ array):

```javascript
{
  id: 'CHAMPION-01',
  title: 'Kernel Mobile-First Hero + Empty/Skeleton + Voice Input',
  status: 'completed',
  planPath: 'docs/superpowers/plans/2026-07-29-kernel-mobile-first.md',
  specPath: 'docs/superpowers/specs/2026-07-29-kernel-mobile-first-design.md',
  filesChanged: 24,
  verification: {
    build: 'pnpm run build → 196 pages, 0 errors',
    verifyAll: 'pnpm run verify:all → exit 0',
    mobileAudit: '0 violations on 11/11 pages',
    a11yScan: '0 critical, 0 serious',
  },
  completedAt: '2026-07-29',
},
```

- [ ] **Step 3: Commit**

```bash
git add scripts/prompt-champion.mjs
git commit -m "BAI-CHAMPION-01-17: add CHAMPION-01 entry to prompt-champion registry"
```

---

## Task 18: Final Lighthouse Mobile Run + Acceptance Checklist

**Files:** none (verification only).

- [ ] **Step 1: Run the Lighthouse mobile audit**

```bash
pnpm run lhci:collect --url=https://brightai.site/kernel/chat/
```

Expected: Performance ≥ 90 على mobile (Slow 4G).

- [ ] **Step 2: Run the full verify chain one more time**

```bash
pnpm run build:verify
```

Expected: exit 0.

- [ ] **Step 3: Walk through all the acceptance criteria**

استعرض الـ checklist من Section 7 في الـ spec، أكّد كل واحد:

- [ ] AC #1: `ابدأ محادثة` يظهر في chat HTML
- [ ] AC #2: لا seed messages (`تصدير قائمة عملاء` = 0)
- [ ] AC #3: Skeleton موجود (`kernel-skeleton` ≥ 1)
- [ ] AC #3b: VoiceInput موجود (`kernel-voice-input` ≥ 1)
- [ ] AC #4: 0 touch targets < 44px (mobile-audit exit 0)
- [ ] AC #5: Lighthouse mobile Performance ≥ 90
- [ ] AC #6: axe 0 critical
- [ ] AC #7: 196 pages build
- [ ] AC #8: verify:all pass
- [ ] AC #9: brain.md updated (في git log)

---

## Self-Review (Post-Write)

**1. Spec coverage** — كل قسم في الـ spec له مهمة:
- Section 3.1 (chat.astro mobile-first) → Task 7
- Section 3.2 (KernelVoiceInput) → Tasks 4 (component + JS)
- Section 3.3 (Empty + Skeleton wrapper) → Tasks 2, 3, 8
- Section 3.4 (mobile-first CSS) → Task 10
- Section 3.5 (a11y) → Tasks 9 (skip-link), 10 (focus-visible + reduced-motion)
- Section 4 (Data Flow) → embedded in Tasks 4, 5, 6, 7
- Section 5 (Error Handling) → embedded in Tasks 4, 5, 6
- Section 6 (Testing) → Tasks 11, 12, 13, 14, 18
- Section 7 (Acceptance) → Task 18

**2. Placeholder scan** — لا "TBD" أو "implement later" في الـ plan. كل خطوة فيها code كامل. "نمط الإضافة" و "نمط موحّد" مستخدمين للتوجيه مع code blocks بعدها.

**3. Type consistency** — `data-state="loading|empty|ready"` مستخدم بشكل ثابت. `kernel-state-wrapper` class موحد. `data-open-drawer`/`data-close-drawer`/`data-drawer-scrim` موحدة. `KernelEmptyState`/`KernelSkeleton` props موحدة (Task 2 + 3 + 7 + 8).

**Gaps detected and added during self-review**:
- Task 1 (qa-screenshots directory) — للـ visual regression tracking.
- Task 14 (after screenshots + visual inspection) — للتحقق البصري بعد الـ rewrite.
- Task 17 (prompt-champion registry) — للـ tracking.
- Task 15 (brain.md state snapshot update) — تحديث الـ touch target baseline.

---

## Execution Handoff

الـ plan كامل ومحفوظ في `docs/superpowers/plans/2026-07-29-kernel-mobile-first.md`. خيارات التنفيذ:

1. **Subagent-Driven (موصى به)** — استدعاء subagent جديد لكل مهمة، مراجعة بين المهام، تكرار سريع.
2. **Inline Execution** — تنفيذ المهام في هذه الجلسة مع checkpoints للمراجعة.

**أي طريقة تبي ننفّذها؟**
