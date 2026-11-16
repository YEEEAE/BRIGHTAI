# Experience Hub — 2026-11-16

Status: DONE locally. Not deployed. PASS ≠ RELEASED.

## Delivered

- `/products/`: five task-oriented product cards and a Kernel entry; each card includes purpose, an example, expected outcome, direct public lab entry, and a separate 48-hour operational experience link to Auth with canonical product `returnTo`.
- `/products/{slug}/#lab`: the lab precedes long product copy; common RTL shell, persistent desktop sidebar, product/context header, large workbench, reason/evidence inspector and return paths.
- Distinct workbenches: Firewall request processing, Risk Engine likelihood/impact matrix, Human Gate review dossier and decisions, Ledger event timeline and changed-record comparison, Secure Chat prepared conversational examples.
- Public examples are explicitly educational and local. No external AI requests, real security scans, cryptographic verification, approvals or operational writes are represented as occurring.
- `sessionStorage` saves only allowlisted product and example indices. The hub can resume the last lab; reset restores the initial example. Storage denial does not block interaction.
- `WorkspaceNavigation` is shared with authenticated `AppLayout`. Mobile uses a single in-flow disclosure; Escape closes it and returns focus. Sidebar remains sticky on desktop.
- Removed redundant section-compass and supplemental motion-study insertion from products. Other page families retain their existing behavior.

## Verification

Final build: PASS, 57 public routes covered by the existing SEO build integration. Existing build warnings about request headers on prerendered pages remain; no build failure.

Existing `node --test tests/product-navigation.test.mjs`: 3 PASS. Canonical return-path authorization remains unchanged. `git diff --check`: PASS.

Chrome DevTools MCP provided visual inspection and independent route/interaction checks. A local Playwright browser check produced `browser-verification.json` and screenshots:

- 36 viewport/route combinations: 360, 390, 1440px × hub, five public product labs, Kernel and five authenticated product routes. All returned 200, no horizontal overflow. Authenticated routes were inspected without a real session; this proves shell and rejection/setup rendering, not authorized product operations.
- First useful hub CTA is within the initial mobile viewport, approximately 476px from page top in the checked layout. Each public lab is directly addressable with `#lab`.
- Five product state changes survived reload and restored the corresponding inspector explanation; reset passed for each. Independent DevTools checks also exercised this.
- 21 CTA destination checks: all HTTP 200 locally, including all five Auth `returnTo` paths. Auth configuration may render an explicit unavailable/setup state; authentication and 48-hour activation were not performed.
- 64 visible small-text hover controls checked: minimum computed contrast 5.80:1, all ≥4.5:1. This covers the new hub/lab controls, not a site-wide accessibility certification.
- Keyboard: Enter opens mobile navigation, Tab enters its links, Escape closes it and returns focus; Enter activates the redaction choice; visible 3px saffron focus ring verified.
- Actual `prefers-reduced-motion: reduce` emulation: zero running animations, lab choice transitions 0s.
- JavaScript disabled at 360px: initial explanation and fallback visible, no overflow, native navigation available.
- Session storage access forced to throw: public lab interaction still passes.
- Small final ProductJourney copy/padding cleanup followed by build/navigation checks and DevTools remeasurement of hub CTAs and return paths at 360/390/1440. No behavioral or contrast token changes.

Screenshots: `hub-360.png`, `hub-390.png`, `hub-1440.png`, `lab-firewall-390.png`, `lab-{slug}-1440.png`.

## Protected scope

Source checksums remained identical before/after:

- `src/styles/variables.css`: `275083abeb2c50c3338c44fea109997ecf1e5d83`
- `src/components/Constellation.astro`: `07645e773187685790ea04c08d97caaf44f0212c`
- `src/components/BrandLogo.astro`: `c360667d1b9c40a3694e3213ed19575e3aa7df62`
- `src/pages/index.astro` (contains Hero): `8b66101938bb9650b48c36f2758ae7ef8b7e7a6b`

No edits to the homepage, global brand tokens, logo/component links or copy, env files, workflows, database, remote Git or deployment. No new dependencies installed.

Reference consulted: [UI by Made Good Designs](https://madegooddesigns.com/inspiration/ui/ai-workspace-web-minimal-2660226124ab), for workspace/inspector information architecture only; BRIGHTAI palette and Arabic typography remain authoritative.

## Limits

Live Auth, tenant membership, grants, operational 48-hour activation, backend integrations and publication remain outside this local UI verification. The existing operational blockers remain in Project Mind. No screen-reader session or broad WCAG compliance claim.
