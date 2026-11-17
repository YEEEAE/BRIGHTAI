# G-12 — CSP and observability — 2026-11-17

Status: PARTIAL LOCAL. Base HEAD: `962b5cddec605c25e4fa3d32c3f2cc0c23abda91` + working tree. No deploy, remote configuration, ingestion or legal approval.

## Changes
- Shared runtime CSP policy applied by middleware AND Node listener: prerendered public HTML otherwise bypasses middleware. Extra scope `scripts/server.mjs` and `security-policy.mjs` is required for actual public response coverage.
- CSP hashes now quoted and available to auth pages using BaseLayout. Bundled modules externalized through Vite assetsInlineLimit=0; no unsafe-inline scripts or unsafe-eval permission added.
- Global `AIGAS_MONITORING_KILL_SWITCH=true` stops both transports; separate switches preserved. Defaults remain disabled.
- Privacy draft corrects external GA loader claim, separates synthetic labs from authenticated portal, excludes sensitive monitoring payloads and makes retention/deletion approval outstanding. Existing no-training policy remains an organizational requirement needing provider contracts/configuration evidence, not a zero-retention claim. Draft awaits owner/legal review.

## Evidence
- `node --test tests/observability.test.mjs`: 22 PASS, 0 FAIL. Covers approval gates, no transport when disabled, global/layer kill switches, allowlists, forbidden free-form fields, private URL collapse, CSP mode parity and inline hash.
- `node scripts/preview-observability-payload.mjs --out audit/csp-observability-2026-11-17/payload-preview.json`: PASS; 6 Sentry + 6 PostHog synthetic events, no network. Payload fields exclude email/tenant/chat/prompt. Preview contains negative test inputs and historical inventory, neither is an outgoing payload or current vendor verification.
- `npm run build`: PASS, 57 public pages. `git diff --check`: PASS.
- Actual Chrome via DevTools, local Node artifact. Report-only: `/`, `/privacy/` clear after fixes; `/auth/sign-up/`, `/app/kernel/`, `/app/secure-chat/` retain one Zod eval feature-probe CSP issue. `/app/` redirected to kernel. Public `/demo/secure-chat/` had a resource 404, no CSP issue; unrelated resource not diagnosed.
- Enforced on separate LOCAL port only: `/`, `/privacy/` zero console errors/issues; auth and two private pages still report Zod eval issue, kernel additionally reports missing autocomplete. Plex loaded. No authenticated session, provider request, signup submission or authenticated product action tested.
- Browser fetch `/api/observability/` POST malformed body: 204, empty body when disabled.
- Browser fetch auth response: enforced CSP present, report-only absent. Simulated TLS proxy header `x-forwarded-proto:https` produces HSTS `max-age=15552000`. This is a local header test, not proof of deployed TLS/HSTS.

## Open gates
- Exit criterion zero CSP violations NOT met: bundled dependency Zod probes `new Function` (caught internally), reports CSP eval violation. Do not enable unsafe-eval to suppress the finding; review a supported jitless configuration/dependency solution before approval.
- NEON_AUTH_BASE_URL origin inclusion unit-tested synthetically; actual configured origin/network/auth flow NOT VERIFIED (local runtime deliberately did not read .env).
- Service identity/deployment from prerequisite 04, real authenticated `/app/*` journey, all public pages, TLS edge and live headers need acceptance on the approved target.
- No approved owner/privacy reference or retention/deletion decision supplied. No Sentry/PostHog settings changed, no canary sent. Approval variable presence cannot prove review or deletion enforcement.
- REQ-05/REQ-44 mapping remains unverified.

## Operator gate and rollback
After zero-violation browser acceptance and owner/privacy approval for the exact service/release, set `AIGAS_CSP_ENFORCE=true` on that service. Roll back with `AIGAS_CSP_ENFORCE=false`; baseline framing/navigation protections remain. Monitoring emergency stop: `AIGAS_MONITORING_KILL_SWITCH=true`. Do not activate vendor transport until approved destination, payload, retention/deletion policy and `AIGAS_MONITORING_APPROVAL_REF` plus existing layer gates are documented. No live activation performed here.
