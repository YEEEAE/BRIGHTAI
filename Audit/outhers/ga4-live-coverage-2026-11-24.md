# GA4 Live Coverage Check — 2026-11-24

## Scope and method
Read-only live checks after activation on 2026-11-24 around 22:25–22:26 AST. Firecrawl fetched raw HTML and inspected the rendered DOM for the apex and `www` homepages. No links were clicked, and no forms were submitted. The check counted the GA4 config bootstrap and `gtag.js` loader in the returned HTML/DOM; it did not inspect events in the GA4 property.

## Production activation
- Cloudflare Worker `brightai-ga4-edge` is deployed; `workers.dev` and preview URLs are disabled.
- The `brightai.live` and `www.brightai.live` CNAME records are proxied and retain the Render origin target `brightai-4x39.onrender.com`.
- Worker routes `brightai.live/*` and `www.brightai.live/*` are active (route IDs `8efd46bd4d9f4d8da6cdd4ba9c109317` and `2bfd9fdd6ca148b2937315ec6ac3a039`).

## Live sample
| URL | HTTP | GA4 config in HTML/DOM | GA4 loader in HTML/DOM | Observation |
|---|---:|---:|---:|---|
| https://brightai.live/ | 200 | 1 | 1 | DOM inspection: one inline config and one matching `gtag.js` script. |
| https://www.brightai.live/ | 200 | 1 | 1 | Resolves to the apex URL; same one config and one loader observed in DOM. |
| https://brightai.live/about/ | 200 | 1 | 1 | Raw HTML contains the approved inline bootstrap and matching loader. |
| https://brightai.live/blog/ai-governance/ | 200 | 1 | 1 | Legacy HTML contains the approved inline bootstrap and matching loader after activation. |

The sample confirms the tag is present in these returned HTML documents, with no duplicate config/loader observed in the inspected material. The apex and `www` homepages resolve to the same canonical URL, so those are hostname checks rather than independent content routes.

## Coverage and limits
The Worker route applies to requests for both configured hostnames and injects the approved bootstrap into successful `text/html` GET responses that lack the config or loader; existing complete installations are left unchanged. It skips `HEAD`, `Range`, non-HTML responses, and non-200 responses. This makes the edge path available to legacy HTML hosted under these names, but the site's legacy inventory is inconsistent across records (251 user-reported, 254 in an older inventory, 264 in the current Project Mind). This four-URL sample is **not** a crawl or verification of every legacy URL, so full 251-page coverage remains **NOT VERIFIED**.

Presence of the tags in HTML does not establish that browsers successfully load Google's script, that network requests are sent, or that events arrive in property `G-9LMB4PGTWJ`. The Google Analytics connector could not connect during this task; property ingestion and reporting remain **NOT VERIFIED**. The worker injects without a consent gate, as requested; this report makes no legal-compliance claim.

## Prior baseline
Before activation, the 2026-11-24 22:03 AST two-page Firecrawl check found no GA4 markers on `/en/` and `/blog/ai-governance/`. The later live HTML sample above verifies the post-activation state for the listed URLs only.

## Edge feasibility references
Cloudflare's official route documentation states that a Worker route requires an active zone, a Worker, and proxied DNS; `fetch(request)` sends the subrequest to the origin configured in zone DNS. [1]

Cloudflare's official `HTMLRewriter` documentation supports parsing and transforming HTML responses as a stream. [2]

## References
[1]: https://developers.cloudflare.com/workers/configuration/routing/routes/ "Workers routes"
[2]: https://developers.cloudflare.com/workers/runtime-apis/html-rewriter/ "HTMLRewriter API"
