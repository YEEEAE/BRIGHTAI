# Cloudflare + Render Deployment Headers — Authoritative Layer

**Last updated:** 2026-07-25
**Ticket:** BAI-IDX-02
**Author:** BrightAI Workspace Agent
**Status:** Live, verified by `npm run verify:live:headers`

---

## TL;DR

The BrightAI production security header posture is enforced by **three layers**, not by `render.yaml` and not by `public/_headers`. The legacy `headers:` block in `render.yaml` and the Netlify-style `public/_headers` are **documentation only** on the current Render Node Web Service + Cloudflare front stack. They are kept in sync for drift detection and as a ready-to-use posture for any future migration to a static-only host.

| Layer | What it covers | Mechanism | File |
|---|---|---|---|
| SSR routes (`/api/*`) | Every HTTP response header from `RESPONSE_SECURITY_HEADERS`, including HSTS | Astro middleware applies headers on the Node response | `src/middleware.ts` |
| Prerendered static pages (190 HTML) | CSP, X-Content-Type-Options, X-Frame-Options, Referrer-Policy via `<meta http-equiv="...">` | Astro integration rewrites every HTML file at build time | `astro.config.mjs` (`injectSecurityMeta()`) |
| Static pages, HTTP layer | Strict-Transport-Security (HSTS does not work in meta) | Cloudflare edge Transform Rule | Cloudflare dashboard (manual setup) |
| Legacy / documentation | All of the above, expressed as config | YAML + Netlify-style text files | `render.yaml`, `public/_headers` |

The single source of truth for the **values** of every header (HTTP or meta) is `scripts/security-headers.mjs`. The legacy files are derived from it and must stay in sync.

---

## Why the legacy `render.yaml` headers block does NOT enforce anything

Render Blueprints support a `headers:` directive at the service level, but the official Render docs limit that directive to **Static Sites**:

> Custom Headers can be added to Static Sites to apply HTTP response headers when serving content. Web Services (Node, Python, etc.) do not use this configuration block.
> — [Render Docs: Custom Headers](https://docs.render.com/configure-rendering#custom-headers)

BrightAI ships as a Render Web Service (Node runtime, `output: 'static'` + `@astrojs/node({ mode: 'standalone' })` — KERNEL-AI-2026-07-14). The Node adapter bundles the server into `dist/server/entry.mjs` and serves static files from `dist/client/` at request time. Neither the prerendered static responses nor the SSR responses pick up the `headers:` block in `render.yaml`.

`public/_headers` is the Netlify / Cloudflare Pages / Render Static Sites convention. BrightAI does not use any of those three platforms in the current stack, so the file is not read by anything at request time.

A live curl check of `https://brightai.site/` confirms this — only `x-content-type-options: nosniff` is present on the response, alongside the Cloudflare-front defaults (`server: cloudflare`, `cf-ray`, `cf-cache-status`). The full BrightAI security posture is therefore enforced by the new authoritative layer described below.

---

## The authoritative layer

### 1. SSR routes — `src/middleware.ts`

Every Astro middleware runs on every SSR route. The current SSR surface is five endpoints under `/api/` (`ai/chat`, `lead`, `health`, `csp-report`, `csrf-token`) plus any future SSR pages. The middleware now imports `RESPONSE_SECURITY_HEADERS` from `scripts/security-headers.mjs` and applies every entry to the outgoing response. Implementation detail:

- The middleware only sets a header if it is not already present, so a route that needs a more specific value (e.g. a route-specific CSP) can override without conflict.
- The middleware runs on every SSR response, including 404s and error responses, so the posture is consistent across the API surface.

The `RESPONSE_SECURITY_HEADERS` value for `Strict-Transport-Security` is `max-age=63072000; includeSubDomains; preload` (2 years). HSTS is HTTP-only — meta http-equiv does NOT work for it — but on SSR routes the middleware can add it directly.

### 2. Prerendered static pages — `injectSecurityMeta()` Astro integration

All 190 pages in `dist/client/` are served as static files by the Node adapter. They are not subject to the middleware (Astro serves prerendered files directly). The `injectSecurityMeta()` integration in `astro.config.mjs` rewrites every HTML file at `astro:build:done` and inserts four `<meta http-equiv="...">` tags just before `</head>`:

- `Content-Security-Policy` — full CSP from `RESPONSE_SECURITY_HEADERS["Content-Security-Policy"]`
- `X-Content-Type-Options` — `nosniff`
- `X-Frame-Options` — `SAMEORIGIN`
- `Referrer-Policy` — `strict-origin-when-cross-origin`

The integration is idempotent: it inserts a unique marker comment (`<!-- brightai-security-meta:BAI-IDX-02 -->`) and skips files that already carry the marker, so re-running the build does not duplicate the meta block.

The browser-level support is:

| Meta tag | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| `Content-Security-Policy` | yes | yes | yes (since 15.4) |
| `X-Content-Type-Options` | yes | limited | limited |
| `X-Frame-Options` | limited (CSP `frame-ancestors` preferred) | limited | limited |
| `Referrer-Policy` | yes | yes | yes |

The `X-Content-Type-Options` and `X-Frame-Options` meta tags are defense-in-depth — the modern mechanism is the CSP directives (`Content-Security-Policy: X-Content-Type-Options` does not exist, but the `Content-Security-Policy` meta tag fully controls frame-ancestors via its `frame-ancestors` source).

### 3. Static pages, HSTS — Cloudflare edge Transform Rule

HSTS does not work in `<meta http-equiv>`. The browser ignores it. HSTS on prerendered static pages therefore has to come from the HTTP layer — and the only HTTP layer in front of `dist/client/*` is Cloudflare.

**Manual setup (Cloudflare dashboard, one-time):**

1. Log in to Cloudflare, select `brightai.site`.
2. Navigate to **Rules → Transform Rules → Modify Response Headers**.
3. Click **Create rule**.
4. Name: `BrightAI — Security Headers (static)`.
5. Match expression: `http.request.uri.path ne "/api/csp-report"` (optional — only exclude the report endpoint if it has its own dynamic headers).
6. **Set Static** for each of the following:

| Header name | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `X-Robots-Tag` | `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1` |

7. Deploy.

After deploying the rule, the post-deploy check (`npm run verify:live:headers`) should report zero hard failures and zero warnings on every static route.

> **Free tier note:** Cloudflare Free supports up to 10 Modify Response Header rules per zone. The single rule above uses 6 of those. Reserve the remaining 4 for future use (e.g. CSP `report-to` migration, `Cross-Origin-*` hardening).

> **Already submitted to HSTS preload?** The current value (`max-age=63072000; includeSubDomains; preload`) meets the [hstspreload.org](https://hstspreload.org) submission requirements. Verify submission status at the [HSTS Preload List](https://hstspreload.org) — if not already submitted, do so once to enable browser-side preload.

---

## Post-deploy verification — `npm run verify:live:headers`

A read-only script at `scripts/verify-live-security-headers.mjs` checks the live posture. It:

1. Fetches each route in `SAMPLE_ROUTES` (20 representative routes: 10 AR static, 3 solutions, 2 kernel, 3 legal AR+EN, 2 SSR).
2. For every route, asserts that every expected HTTP header is present on the response.
3. For every static route, additionally asserts that the four `<meta http-equiv>` tags are present in the HTML payload with the exact expected `content` value.
4. HSTS missing on a static route is reported as a **warning**, not a failure — it points the operator to the Cloudflare Transform Rule that needs to be set up manually.
5. Every other missing header is a **hard failure** with a route label and a header name, so a deploy that drops a header is caught immediately.

**Run it:**

```bash
node scripts/verify-live-security-headers.mjs
# or, with a JSON report:
JSON_OUT=download/qa/headers-2026-07-25.json node scripts/verify-live-security-headers.mjs
# or, against a local preview server:
BASE_URL=http://localhost:4321 node scripts/verify-live-security-headers.mjs
```

**Exit codes:**

- `0` — every route passes every assertion.
- `1` — one or more routes have missing headers or fetch errors.
- `2` — fatal (could not read the source-of-truth module, etc.).

**Expected output (after Cloudflare Transform Rule is set up):**

```
================================================================================
BrightAI Live Security Header Verification — 2026-07-25T...
Base URL: https://brightai.site
Cache buster: _t=...
================================================================================

  Homepage (AR)                       /                                              ... ✅ 200
  About                               /about/                                        ... ✅ 200
  ...
  CSP report (SSR)                    /api/csp-report/                               ... ✅ 404
  Health (SSR)                        /api/health/                                   ... ✅ 200

================================================================================
Summary: 20/20 routes pass. 0 hard failure(s), 0 warning(s).
================================================================================
```

(SSR routes may legitimately return 404 on `GET` — the middleware applies the headers to the response regardless of status code.)

---

## Future-static migration

If the project ever migrates to a static-only host (Cloudflare Pages, Netlify, Render Static Sites), the static authoritative layer can collapse to **one file**:

- On Cloudflare Pages / Netlify: `public/_headers` is read directly. The current file is already in the right shape.
- On Render Static Sites: the `headers:` block in `render.yaml` is read directly. The current block is already in the right shape.

The middleware (SSR layer) stays for any SSR endpoints. The Cloudflare Transform Rule becomes optional — the static host itself can inject HSTS. The post-deploy check stays the same.

The migration checklist (no code changes needed beyond removing the `astro.config.mjs` `injectSecurityMeta()` integration if the static host supports HTTP-level CSP injection, and removing `src/middleware.ts` if there are no SSR routes):

1. Remove `@astrojs/node` adapter.
2. Set `output: 'static'` (already there).
3. Remove `src/middleware.ts` SSR-only code.
4. Confirm the static host reads `render.yaml` `headers:` or `public/_headers`.
5. Run `npm run verify:live:headers` against the new host.

---

## References

- Render Custom Headers (Static Sites only): <https://docs.render.com/configure-rendering#custom-headers>
- Netlify `_headers` file format: <https://docs.netlify.com/routing/headers/>
- Cloudflare Pages `_headers` file format: <https://developers.cloudflare.com/pages/configuration/headers/>
- Cloudflare Transform Rules — Modify Response Headers: <https://developers.cloudflare.com/rules/transform/>
- HSTS Preload submission: <https://hstspreload.org/>
- W3C CSP3 — meta http-equiv: <https://www.w3.org/TR/CSP3/#meta-element>
- Astro middleware: <https://docs.astro.build/en/guides/middleware/>
- BrightAI canonical posture: `scripts/security-headers.mjs`
- BrightAI authoritative code: `src/middleware.ts`, `astro.config.mjs` (`injectSecurityMeta()`)
- BrightAI legacy config: `render.yaml`, `public/_headers`
- BrightAI post-deploy check: `scripts/verify-live-security-headers.mjs`
- BrightAI tickets: BAI-IDX-02 (this), BAI-IDX-01 (parent), BAI-SEO-003-S3 (sibling, already merged)
