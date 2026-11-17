# GA4 attribution and URL privacy — 2026-11-17

Status: DONE for local policy/payload work. Deployment, real gtag transport, GA4 ingestion and account settings NOT VERIFIED; no external account write or deployment.

## Finding and decision

Before this patch, Google, Bing and editorial referrers all produced explicit `page_referrer: ''`. The before/after execution evidence is `payload-preview.json`. This removes a usable referral signal; it does not establish that it caused all (or any particular percentage) of the reported Direct 90%. No fresh historical report was queried here. Session source, first-user source and event attribution are different scopes. Existing campaigns, previous session attribution, redirects, missing browser referrers, filters and test traffic also matter. Empty referrer does not force every event/session into Direct, especially with valid UTM.

The existing P21 URL policy is an unapproved draft, with an exact internal host default. The owner explicitly approved **local** Google/Bing additions in this chat: `google.com`, `www.google.com`, `bing.com`, `www.bing.com`. Editorial remains denied pending a named domain decision. This is a narrow technical approval, not legal/P21 blanket approval or permission to publish.

Minimal treatment: parse an absolute HTTP(S) referrer, reject credentials, whitespace/backslashes, oversized input and non-default ports. Match exact approved hostname (no wildcard/suffix/subdomain matching); emit `origin/` only. External path/query/fragment never enter the command. All other external origins, malformed URLs and direct visits retain explicit empty referrer, preventing a raw-value fallback. Regional Google hosts and other search engines remain denied until explicitly approved. The hostname itself may contain sensitive data: arbitrary syntactically valid origins are therefore not accepted.

Internal referrers keep the existing path collapse. Page URL UTM allowlist and syntax limits are unchanged: syntax is not a guarantee of non-personal campaign values. Campaign naming must exclude names, emails, account IDs, tokens or other sensitive codes. Sentry/PostHog stay URL-free and unchanged.

## Expected commands

For `page_location=https://brightai.live/docs/` unless specified:

| Case | Previous `page_referrer` | Final `page_referrer` | Attribution implication, not a GA4 ingestion assertion |
|---|---|---|---|
| Google search URL including search query | `''` | `https://www.google.com/` | Search origin signal preserved, search terms removed |
| Bing search URL | `''` | `https://www.bing.com/` | Search origin signal preserved |
| Editorial `www.reuters.com` (synthetic example, not approved) | `''` | `''` | Remains unavailable by owner decision |
| UTM `?utm_source=google&utm_medium=cpc` and no referrer | `''` | `''` | UTM remains on sanitized page_location; do not classify as Direct from referrer alone |
| Direct, no UTM and no referrer | `''` | `''` | No newly invented source |
| Credentials, script URL, spoofed suffix/subdomain, private IP, non-default port | `''` | `''` | Rejected; no fallback to raw document.referrer |

Full synthetic command values: `current-payloads.json`; baseline comparison: `payload-preview.json`. Malicious fixtures include `google.com.evil.test`, sensitive Google subdomain, credentials, script, whitespace/backslash, oversized and relative URLs. Nothing is sent to Google in these tests.

## Page view ownership and verification

One automatic page view owner: `gtag('config', 'G-9LMB4PGTWJ', analyticsPage)`. No manual `gtag('event','page_view')` is added. An idempotent document guard prevents repeated init from configuring the same tag again. Public/App/demo templates each include one component; the server-rendered closed portal has an identical snippet. CSP hash updated and tested. The unused `GoogleAnalytics 2.astro` is not imported by the active templates and was left untouched.

- PASS: 45/45 offline Node tests, including 20 referrer fixtures, UTM limits, double-init, gate/template parity and CSP hash (`tests.tap`).
- PASS: 20/20 final snippets executed twice in Chrome V8 with synthetic window/document inputs; one config and zero manual page views per fixture (`browser-payloads.json`). This is a browser execution harness, not a real navigation/referrer or SDK-network test.
- PASS: Astro compiler transform of both changed `.astro` files using existing compiler in `/private/tmp/brightai-discovery-audit/repo/node_modules`; root `@astrojs/compiler` import unavailable. Full project build NOT RUN; no dependencies installed or changed.
- PASS: final diff whitespace check.

These prove the expected **gtag command payload and local absence of duplicate page-view producers**. They do not prove one received page_view in the real property: container/stream Enhanced Measurement and other installed tags must be checked independently. No GA4 account change was made.

Reproduce offline:

```sh
node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs tests/ga4-attribution.test.mjs
node --import ./tests/helpers/no-egress.mjs scripts/preview-ga4-attribution.mjs
```

## GA4 operator requirements — documentation only

1. Verify property and web stream ID `G-9LMB4PGTWJ` before inspection. For reporting use exact **page hostname** `brightai.live` and, only if it actually serves measured production pages, `www.brightai.live`. This is the visited site's hostname, not Google/Bing referrer hostname. Exclude localhost, loopback, preview/staging, Render service hosts and unknown hostnames. Never silently replace page_location with the production hostname on a test host.
2. Current source can load the production measurement ID on a preview host. Run local acceptance offline/intercepted as here; future SDK transport tests should use a separate test property or block `/g/collect` before any request is sent. For approved live diagnostics, verify developer traffic filtering with debug_mode and internal traffic definitions/traffic_type first. Developer mode alone does not exclude reports; hostname exclusion alone does not remove staff/tests on the real production host.
3. Inspect Admin → Data collection and modification → Data filters. The documented Web hostname traffic filter supports Include only/Exclude and exact hostname conditions. Start in Testing, inspect “Test data filter name”, then let the account owner approve activation. Internal/developer exclusion also requires appropriate definitions and validation. Active exclusions permanently discard future matching events; report-level filters offer analysis without deleting collected data. Do not list Google/Bing/editorial as unwanted referrals to hide the measurement issue.
4. Inspect installed tags/GTM and Enhanced Measurement page-view settings. Keep a single automatic page-view path; no parallel manual page_view/tag. History-change pageviews can be emitted by Enhanced Measurement independently of initial config. Review automatic form/outbound/search capture for additional URL leakage outside this snippet. On an authorized isolated SDK test, inspect sanitized `dl`/`dr`, count exactly one `en=page_view` per document navigation and inspect history behavior; verify no fallback raw URL/referrer. Then independently confirm reception in the selected test property's DebugView. None of those account/SDK checks is claimed complete here.
5. Read and record the property's actual IANA reporting timezone. Proposed business baseline is `Asia/Riyadh` (UTC+03:00); do not assume it is configured or change it here. Store test/deploy timestamps in UTC plus Riyadh time and actual GA property timezone. Compare equal completed date ranges/day boundaries in the same timezone; record timezone differences for any other source. Changing property timezone affects future data, not historical dates. No timezone setting was inspected or edited.
6. After an independently authorized deployment, record SHA and exact activation time. Compare future clean-host sessions using **session** source/medium/channel with the same filters/timezone. Retain the old interval as historical data collected under the previous policy. This patch cannot recreate stripped referrers, reassign historical sessions or promise a corrected historical Direct percentage.

## Primary references checked

- [GA page-view ownership and history behavior](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [GA config / page_referrer defaults](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Web hostname filters](https://support.google.com/analytics/answer/16608575?hl=en)
- [Data filters, developer/internal traffic and prospective effect](https://support.google.com/analytics/answer/13296761?hl=en)
- [Internal traffic definitions](https://support.google.com/analytics/answer/10104470?hl=en)
- [Property reporting timezone](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1alpha/properties)
