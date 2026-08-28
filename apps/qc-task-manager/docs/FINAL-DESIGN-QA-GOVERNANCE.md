# Final Design QA & Governance

> Audit date: 2026-08-28  
> Scope: `apps/qc-task-manager` — high-frequency operational screens, shared UI primitives, forms, data visualisation, accessibility, motion, security boundaries, and responsive contracts.

## Decision

**Conditional pass for local engineering readiness; not a human UX sign-off.**

The system passes the available deterministic gates and preserves the important domain boundaries. It is not accurate to claim zero design drift: a small set of legacy/raw presentation patterns remains on detail and administration surfaces, and human validation at 320px/200% zoom, VoiceOver, real devices, and 4G is still outstanding.

## Before / after evidence

The earlier product audit records self-assessed scores of **59 → 80 overall product UX**, with component scores such as UI consistency **45 → 88**, navigation **55 → 82**, and accessibility **68 → 84**. These are engineering assessments, not observed-user results, so no improvement percentage is claimed here. The current run confirms the implementation gates remain green after the disclosure-contract test correction.

## Audit matrix

| Area | Result | Evidence / remaining gap |
| --- | --- | --- |
| Design system / UI | Partial pass | Shared `PageHeader`, `AppButton`, `StatusPill`, `Banner`, `EmptyState`, pagination, and semantic tokens are enforced on selected high-frequency routes. Raw buttons and local tones remain on `findings/[id]`, some lab detail routes, and administration surfaces. |
| UX / IA | Pass with UAT gap | Role home action hierarchy, breadcrumbs, workflow context, and server-rendered recovery paths are present. Discoverability and terminology still need role-based UAT. |
| Interaction / copy | Pass | `test:interaction-feedback`, `test:ux-writing`, and the AI advisory boundary pass. |
| Forms | Pass | Save state, unsaved-change protection, validation summaries, review confirmation, and focus recovery are covered by form productivity tests. |
| Data visualisation | Pass | Dashboard action hierarchy and lab chart semantics pass; charts expose labels and native title fallbacks. |
| Accessibility | Partial pass | Automated accessibility contracts, contrast, focus, semantic disclosure, and 44px targets pass. VoiceOver, real assistive technology, and full keyboard review remain open. |
| Ergonomics / responsive | Partial pass | Responsive contract and acceptance viewport checks pass. A manual 320px and 200% zoom/reflow walk is not evidenced in this run. |
| Motion | Pass | No `transition: all`, explicit motion properties, global reduced-motion handling, no operational hover movement, and motion checks pass. |
| Security | Pass locally | CSP, CSRF, RBAC, IDOR, secret hygiene, audit integrity, and deployment contracts pass. Hygiene required disabling the broken local Git fsmonitor query for the check. |
| Domain integrity | Pass | Full canonical domain suite and acceptance scenarios preserve QC information, approvals, evidence, audit history, and server-side permissions. |

## Explicit verification checklist

| Requirement | Status | Basis |
| --- | --- | --- |
| No duplicate status system | Partial | Canonical semantic status layer passes, but compatibility adapters and raw detail-route presentation maps still coexist during migration. |
| No duplicate button language | Partial | UX writing contract passes; raw action implementations remain outside the fully adopted primitive set. |
| No arbitrary token without repeated need | Pass by policy | Shared token vocabulary and migration docs exist; remaining raw leaf styles are recorded as debt, not new tokens. |
| No `transition: all` | Pass | Source scan and motion gate pass. |
| Reduced motion respected | Pass | Global `prefers-reduced-motion` contract and motion gate pass. |
| No critical color-only state | Pass for audited canonical surfaces | Status text and semantic badge guards pass; remaining raw detail patterns need migration audit. |
| No inaccessible icon action | Pass for covered controls | Navbar and interaction gates pass; real screen-reader confirmation remains open. |
| 320px / 200% zoom path | Not verified | Existing contract covers responsive behavior, but this exact human/runtime path was not executed in the current run. |
| Primary workflow independent of AI | Pass | AI is advisory only; manual QC paths and decision ownership remain available. |
| Permissions not moved to presentation logic | Pass | Architecture, domain, security, and acceptance tests keep server-side authorization authoritative. |
| QC information preserved | Pass | Domain and acceptance suites preserve evidence, audit, workflow, approvals, traceability, and operational metrics. |

## Findings requiring follow-up

| Priority | Finding | Location | Action |
| --- | --- | --- | --- |
| P1 | Full design-system adoption is incomplete on detail/admin routes; raw action styles can diverge from the canonical button contract. | `src/pages/findings/[id].astro`, `src/pages/lab/tests/[id].astro`, related admin pages | Migrate route-sized surfaces to `AppButton`/`StatusPill`; keep exceptions documented and guarded. |
| P1 | Human evidence is missing for actual usability and assistive technology. | `docs/UX-RESEARCH-PROGRAM.md`, `docs/PILOT-UAT.md` | Run role-separated UAT, VoiceOver, keyboard, 320px, 200% zoom, real-device, and 4G sessions; report observed success/time/errors, not inferred scores. |
| P2 | Build emits known Vite dynamic-import warnings. | `src/lib/db.ts`, `src/lib/validation.ts` import graph | Profile before changing; do not treat warnings as a failed build, but track bundle/performance impact. |
| P2 | Local Git fsmonitor IPC is unhealthy and can obscure Git-based gates. | `.git/fsmonitor--daemon.ipc` | Repair or disable fsmonitor in the local environment before future audits; the application security gate itself passes when Git is queried reliably. |

## Governance rules going forward

1. New or edited high-frequency actions use `AppButton`, with a documented exception for dense table actions or print-only UI.
2. New statuses use the semantic adapter layer; no page-local color map is accepted without a documented domain exception.
3. New motion must name its purpose, stay within the documented operational budget, use explicit properties, and include reduced-motion behavior.
4. Every new route or changed high-frequency screen runs UI consistency, manifest, architecture, contrast, responsive, motion, typecheck, domain tests, and production build before review.
5. Human UX scores stay labelled as pending until baseline telemetry and role-separated UAT exist; automated green tests are not user evidence.
6. QC information, auditability, RBAC, and manual fallback paths are non-negotiable acceptance criteria and cannot be removed for visual simplification.

## Gate record

- `pnpm --dir apps/qc-task-manager run test` — PASS, 65/65 canonical suites.
- `pnpm --dir apps/qc-task-manager run typecheck` — PASS, 0 errors and 0 warnings; existing hints remain.
- `NODE_ENV=production pnpm --dir apps/qc-task-manager run build` — PASS; known Vite dynamic-import warnings only.
- `pnpm --dir apps/qc-task-manager run test:ui-consistency` — PASS, 192/192.
- `pnpm --dir apps/qc-task-manager run test:manifest` — PASS, 65 canonical and 28 E2E suites.
- `pnpm --dir apps/qc-task-manager run test:architecture` — PASS.
- `pnpm --dir apps/qc-task-manager run test:badge-contrast` — PASS, all audited pairs meet WCAG 2.2 AA.
- `pnpm --dir apps/qc-task-manager run test:responsive-e2e-contract` — PASS.
- `pnpm --dir apps/qc-task-manager run test:lab-ux-presentation` — PASS, 14/14.
- `pnpm --dir apps/qc-task-manager run test:lab-ux-performance` — PASS, 9/9.
- `node apps/qc-task-manager/scripts/verify-security-hygiene.mjs` — PASS after disabling the broken Git fsmonitor query for the subprocess.
- Acceptance E2E — PASS outside sandbox, 30/30 suites; 3,047+ parsed assertions passed, including 648 responsive checks and restart persistence. Two stale selectors/contracts were corrected before the passing run.

## Known limitations

This document is an engineering governance record, not a claim of production deployment readiness, live Core Web Vitals, real-user usability, VoiceOver compatibility, or 200% zoom conformance. Those require the human and live-environment evidence listed above.
