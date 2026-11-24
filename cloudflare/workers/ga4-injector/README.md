# BRIGHTAI GA4 edge injector

This Worker forwards requests to the existing origin and adds the approved GA4 bootstrap only to successful `text/html` GET responses that do not already have both the GA4 config and loader. Assets, other methods, non-HTML responses, and non-2xx responses are passed through. HTML is not copied into this repository. Existing query/referrer minimization is kept in parity with `src/components/GoogleAnalytics.astro` and covered by tests.

## Production activation state

As of 2026-11-24, Worker `brightai-ga4-edge` is deployed, `workers.dev` and Preview URLs are disabled, both `brightai.live` and `www.brightai.live` CNAME records are proxied while retaining the Render origin target, and both routes in `wrangler.toml` are active. These production changes were explicitly authorized. The four-URL live sample is documented in `Audit/ga4-live-coverage-2026-11-24.md`; it is not a complete crawl of the legacy inventory and does not prove GA4 property ingestion.

For a future zone/origin change, verify the CNAME targets and proxy status before attaching these routes. Do not change production DNS or routing without authorization.

## Local checks

Run `node --test tests/ga4-edge-worker.test.mjs tests/ga4-attribution.test.mjs`. Tag presence on representative live URLs does not establish full inventory coverage or GA4 property ingestion; report those separately unless verified.
