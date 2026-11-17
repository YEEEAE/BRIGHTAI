# GA4 site-wide repair — 2026-11-17

Local implementation: shared GoogleAnalytics component in BaseLayout, AppLayout and the standalone demo template; fixed server-generated closed-portal HTML also includes the same bootstrap. One async gtag/js loader and one config per document. CSP permits the loader and collection on public and private surfaces; demo connect policy permits only Google collection. No form/demo contents are attached. Private paths and titles collapse; unknown query keys and fragments are removed.

Windsor read: connected BRIGHT AI property 551941072; last_7dT returned 2026-11-11 sessions21/users17 and 2026-11-13 sessions1/users0. This is historical reporting, not proof of new collection or mapping to the supplied measurement ID.

Verification: observability unit22 PASS; closed-portal runtime HTML loader/hash PASS. Full build BLOCKED: default Node22.22.2 unsupported; retry using installed Node24.21.0 reaches unrelated knowledge/pdpl-and-ai.astro:448 article closing-tag compiler error. Browser verification BLOCKED: Playwright and Chrome MCP profile locks; no sessions stopped. Local HTTP probe blocked by sandbox EPERM. No deployment, push or property setting changes.

Follow-up: publish only with separate authorization, verify live page_view/session_start in GA4/Tag Assistant, review property Enhanced Measurement settings so automatic form/history events do not collect private data. Browser blockers mean actual outbound collection is NOT VERIFIED.
