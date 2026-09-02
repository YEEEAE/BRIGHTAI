# QC-100-INTERACTION-MOTION-009 — Interaction & Motion Evidence

**Scope:** `apps/qc-task-manager` · **Date:** 2026-09-02

## Decision

The QC interface uses motion as operational feedback: it confirms causality,
shows hierarchy, communicates completion, and makes state changes perceivable.
It does not use page parallax, hover lifts, scale-on-hover, animated KPI values,
or motion behind dense data. Routine motion is capped at 240ms.

## Motion token contract

| Token | Value | Use |
|---|---:|---|
| `duration-instant` | `0ms` | Immediate state changes and toggles |
| `duration-fast` | `120ms` | Button feedback, hover/focus color, chart point emphasis |
| `duration-standard` | `180ms` | Routine transitions and filter feedback |
| `duration-moderate` | `240ms` | Toast/dialog/panel entry where motion clarifies hierarchy |
| `ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | State changes |
| `ease-decelerate` | `cubic-bezier(0, 0, 0.2, 1)` | Entry/reveal |
| `ease-accelerate` | `cubic-bezier(0.3, 0, 1, 0.3)` | Exit/removal |
| `ease-linear` | `linear` | Indeterminate loading only |

Tokens are defined in `src/styles/global.css` and exported to Tailwind as
`duration-qc-*` / `ease-qc-*`. Existing `--motion-*` names remain compatibility
aliases so migrations do not create a second vocabulary.

## Interaction-state coverage

Every high-impact interactive surface has an explicit perceivable result. The
visual signal is paired with text and/or an assistive-technology announcement;
color is never the only signal.

| Surface | default / hover / focus / active | selected / loading / success | error / disabled / destructive / pending |
|---|---|---|---|
| Buttons and links | shared `AppButton` contract, native focus, pressed feedback | loading label swap and `aria-busy` where async | native `disabled`, disabled styling, destructive variant |
| Forms and task updates | field focus and inline validation | saving/submitted status is announced | persistent error + recovery action; pending submit is locked |
| Comments and attachments | control feedback and focus | success message, upload progress/result | error message, retry path, busy state |
| AI review | run action feedback | analyzing → result/advisory state | session/permission/provider errors remain actionable |
| Notifications | read/unread and action feedback | mark-read success | failed action is announced and retryable |
| Delete/review flows | trigger focus and modal focus return | pending request state | destructive confirmation, rejection reason, submit loading |
| Dialogs | native dialog semantics and focus entry | confirm action result | Escape/cancel recovery; destructive action is explicit |
| Charts and progress | focusable/clickable point emphasis | selected point and live summary | no motion-only interpretation; progress has text/value |
| Skeleton/loading | `aria-busy` and accessible label | replaced by content | failures use persistent operational state |

Evidence owners: `ActionFeedback.tsx`, `AppButton.astro`, `Skeleton.astro`,
`CommentBox.tsx`, `AttachmentUploader.tsx`, `AiReviewPanel.tsx`,
`MarkReadButton.tsx`, `MarkAllReadButton.tsx`, `DeleteRequestDialog.tsx`,
`ReviewDeleteRequestDialog.tsx`, `TaskUpdatePanel.tsx`, `LabTestForm.tsx`,
`TaskLifecycle.tsx`, `EsignDialog.astro`, and `OperationalState.astro`.

## Motion application map

- Navigation and filter controls use short color/border feedback; no layout
  shift is introduced.
- Toast entry uses `qc-motion-enter` (240ms decelerated entry); its message is
  also rendered in the shared status/alert contract.
- Expand/collapse and dialogs retain native disclosure/dialog behavior and
  focus management; motion is supplementary, never required to reveal content.
- Loading uses determinate progress where a value exists and a labeled
  indeterminate skeleton/spinner otherwise.
- Chart interaction uses opacity emphasis with the shared 120ms token; it does
  not animate geometry or large areas of the screen.
- No transition uses `transition-all`, un-tokenized `duration-150`, hover
  translate, or hover scale in application source.

## Reduced motion and motion safety

`src/styles/global.css` owns the system-level policy:

- `prefers-reduced-motion: reduce` collapses fast, standard, and moderate
  durations to `1ms`, disables smooth scrolling, and limits animation to one
  iteration.
- Essential content is server-rendered or available in the static DOM; no
  workflow result depends on animation completing.
- Decorative/large-area motion is excluded from this operational UI. Loading
  retains a single perceivable state change rather than an endless decorative
  loop.
- No flashing/strobing, parallax, scroll-jacking, or full-viewport zoom was
  found in the application source contract.

## Automated evidence

`scripts/test-interaction-motion-100.mjs` checks the eight motion tokens,
reduced-motion overrides, forbidden motion patterns, shared feedback/loading
primitives, async-state markers across high-impact components, and dialog
semantics. Run it with:

```bash
pnpm test:interaction-motion-100
```

## Verification boundary

This is source and contract evidence, not a replacement for human testing.
Final acceptance still needs browser checks at 360px and 1440px, keyboard
traversal, VoiceOver/NVDA, reduced-motion emulation, and low-powered-device
feel/performance checks. No production deployment, commit, or push was done.

## Result

**Local implementation status:** ready for automated verification.

**Target coverage:** 100% of inventoried high-impact interactive surfaces have
an explicit feedback owner and reduced-motion policy.

**Remaining external evidence:** human assistive-technology and device testing.
