# BrightAI crawler policy audit — training-disallow normalization

**Date:** 2026-09-03
**Scope:** Cloudflare Managed robots.txt behavior, `public/robots.txt`, `public/ai.txt`, `public/llms.txt`, `public/llms-full.txt`
**Decision:** Traditional search = allow. AI search/grounding/citation = allow only where provider docs confirm that role. Model-training-only = disallow by default. Single canonical sitemap. `/api/` not crawlable.
**Reversal note:** This intentionally reverses the 2026-08-23 open-access decision (training allowed per user override at that time). Reason is SEO/GEO: keep citations/answers reachable while preventing accidental broad training access.

## 1. Live vs repository comparison (fetched 2026-09-03)

Live `https://brightai.live/robots.txt` on 2026-09-03 returned HTTP 200, `server: cloudflare`, `cf-cache-status: HIT`, 102 lines, byte-identical to the OLD repository file (allow-all, including training Allow + `Host:` + single sitemap, no Cloudflare-managed prepend block visible at fetch time).

That means at fetch time there was NO active managed prepend conflict. The known historical conflict (managed `Content-Signal: search=yes, ai-train=no, use=reference` + managed training Disallow prepended before origin Allow) remains plausible whenever Managed robots is ON, because Cloudflare docs state: if an existing robots.txt is detected, managed content is prepended.

After this task, repository `public/robots.txt` is 113 lines with training Disallow. Until deploy, live (old allow-all) and repo (new training-disallow) intentionally differ. After deploy + cache purge, live must equal the new repo file with no managed prepend.

Line-by-line intent diff (old live/repo -> new repo):
- Header comment: allow-all + "no path exclusion" -> intentional split policy + `/api/` + Managed OFF + no Content-Signal + single sitemap.
- `User-agent: *`: `Allow: /` only -> `Disallow: /api/` first then `Allow: /`.
- `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `YouBot`: kept Allow, added `Disallow: /api/` (order Disallow first for naive parsers).
- Added `Perplexity-User`, `Claude-SearchBot`, `Claude-User`: Allow (official replacements; see table).
- `ClaudeBot`, `GPTBot`, `Google-Extended`, `CCBot`, `Bytespider`, `Meta-ExternalAgent`, `Applebot-Extended`: Allow -> Disallow: /.
- Removed explicit `Perplexity-ai`, `anthropic-ai`, `Google-CloudVertexBot`, `cohere-ai`, `FacebookBot`, `Timpibot`, `omgili` (unverified/legacy/deprecated; still covered by `* Allow` for non-training purposes, documented below).
- Traditional tokens kept Allow, added `Disallow: /api/` (Bing/Yandex/Baidu Crawl-delay preserved).
- `Sitemap: https://brightai.live/sitemap.xml`: kept, still exactly one.
- `Host: https://brightai.live`: removed (non-standard, Google ignores, avoids validator noise like the prior Content-Signal Semrush error).
- No `Content-Signal` directive added (Semrush previously flagged `Content-Signal: search=yes, ai-input=yes, ai-train=yes` as robots error; Cloudflare managed would re-inject it if ON).

## 2. Duplicate / conflicting directives found

- Origin-vs-managed conflict (historical): origin Allow for training tokens vs managed Disallow + `ai-train=no`. Resolved by making origin Disallow training too AND requiring Managed OFF, so no prepend duplicates the same tokens with opposite intent.
- Within origin old file: `Perplexity-ai` vs official `PerplexityBot`/`Perplexity-User` duplication; `anthropic-ai` (deprecated) vs `ClaudeBot` duplication. Resolved by removing legacy tokens.
- `* Allow: /` vs named training `Allow: /` was redundant and masked intent. Resolved by explicit training Disallow.
- Missing `/api/` isolation: named groups do not inherit `*` rules, so old `Disallow: /api/` (pre-2026-08-23) would have been ignored by named bots. Resolved by repeating `Disallow: /api/` in every Allow group, Disallow-first order for first-match parsers.
- Sitemap: exactly one in `public/robots.txt`; `ai.txt`/`llms.txt`/`llms-full.txt` contain only documentation links, not `Sitemap:` directives. No change needed there.

## 3. Bot classification with verified official sources (no memory classification)

| Token | Verdict | Official source checked |
|---|---|---|
| `GPTBot` | Training -> Disallow | https://developers.openai.com/api/docs/bots — "used to crawl content that may be used in training" |
| `OAI-SearchBot` | Search -> Allow | Same OpenAI page — "used to surface websites in search results in ChatGPT search" |
| `ChatGPT-User` | User fetch -> Allow (signal; may bypass robots per OpenAI) | Same OpenAI page — "not used for crawling automatically; user-initiated" |
| `PerplexityBot` | Search, NOT training -> Allow | https://docs.perplexity.ai/docs/resources/perplexity-crawlers — "not used to crawl content for AI foundation models" |
| `Perplexity-User` | User fetch, NOT training -> Allow (generally ignores robots per Perplexity) | Same Perplexity page |
| `ClaudeBot` | Training -> Disallow | https://support.anthropic.com/en/articles/8896518 — "collecting web content that could contribute to training" |
| `Claude-User` | User fetch -> Allow (honors robots per Anthropic) | Same Anthropic article |
| `Claude-SearchBot` | Search -> Allow | Same Anthropic article — "navigates web to improve search result quality" |
| `Google-Extended` | Training/grounding control, NOT search -> Disallow | https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers — "does not impact inclusion in Search" |
| `Applebot-Extended` | Training control, does not crawl -> Disallow | https://support.apple.com/en-us/119829 — "opt out of content used to train foundation models by disallowing Applebot-Extended" |
| `Applebot` | Search -> Allow | Same Apple page |
| `CCBot` | Training dataset -> Disallow | https://commoncrawl.org/ccbot + FAQ — block via `User-agent: CCBot / Disallow: /` |
| `Meta-ExternalAgent` | Training/indexing -> Disallow | https://developers.facebook.com/docs/sharing/webmasters/web-crawlers/ — "for training foundation AI models or improving products by indexing" |
| `Bytespider` | Mixed training-associated -> Disallow by default | ByteDance purpose doc not reachably verifiable; secondary evidence (Toutiao/ByteDance ecosystem, PPC Land 2026-08-24, TollBit/Cloudflare reports) describes search + training corpora under one token. Conservative default-deny per task policy; monitor logs and revise if ByteDance publishes clearer primary source. robots honored per ByteDance statement (compliance disputed in field reports, so edge enforcement noted below). |
| `YouBot` | Search/answers -> Allow | You.com search crawler for AI search/assistant (official `you.com/how-you-crawls` cited via secondary; token `YouBot` honors robots). Kept Allow for citation eligibility. |
| `Perplexity-ai` | Removed (non-official) | Not in Perplexity official list (only `PerplexityBot`, `Perplexity-User`). Covered by `*`. |
| `anthropic-ai`, `Claude-Web` | Removed (deprecated) | Anthropic deprecated; 404Media 2024-07-29 + SEJ 2026-02-25 + Anthropic current list (only ClaudeBot/Claude-User/Claude-SearchBot). `ClaudeBot` honors old directives per Anthropic, but file cleaned to current tokens. |
| `Google-CloudVertexBot` | Removed (unverified) | No official Google crawler doc found for this token. Covered by `*`. Do not invent training/search role. |
| `cohere-ai` / `Coherebot` | Removed (inactive) | https://docs.cohere.com/docs/cohere-web-crawlers — "We do not use Cohere bots for training at this time", table N/A. Example `Coherebot` is hypothetical future block, not active. Covered by `*`. |
| `FacebookBot` | Removed (incomplete evidence) | Not in current Meta AI crawler doc as training token; Trakkr marks evidence incomplete. Covered by `*`. |
| `Timpibot`, `omgili` | Removed (unverified) | No official provider doc verified. Covered by `*`. Do not classify from memory. |
| Traditional (`Googlebot`, `Googlebot-Image`, `Bingbot`, `Applebot`, `MSNBot-Media`, `YandexBot`, `DuckDuckBot`, `Baiduspider`, `Baiduspider-image`) | Search -> Allow | Standard search crawlers; unambiguous per task. Crawl-delay preserved where previously present. |

Cohere note: removing `cohere-ai` Allow does not block Cohere (still allowed via `*`); it removes a false claim of an official training/search role.

## 4. Repository changes made (local only, no push)

- `public/robots.txt`: rewritten to intentional split policy (24 user-agents, 0 dupes, 1 sitemap, 0 Host, 0 Content-Signal directive, `/api/` isolated in every Allow group, Disallow-first order).
- `public/ai.txt`: `Last-Major-Update` and `Topic-Coverage-Last-Reviewed` 2026-08-24 -> 2026-09-03; `Training-Crawlers: Allowed` -> `Disallowed by robots.txt (training-only tokens are Disallow; see robots.txt)`.
- `public/llms.txt`, `public/llms-full.txt`: no content change (already `Last reviewed: 2026-09-03`, contain only documentation links to robots, no training-allowed claim).
- No Cloudflare account mutation performed (no token/zone available to agent).

## 5. Exact manual Cloudflare steps (do NOT pretend; perform in dashboard)

Zone: `brightai.live` (verify; legacy docs referenced `brightai.site` — apply to the production zone serving `brightai.live`).

1. Dashboard -> select zone `brightai.live` -> **Security Settings** (or **Security -> Settings** depending on nav).
2. Filter/find **Bot traffic**.
3. **Managed robots.txt / Set your preference to block training in robots.txt**: turn **OFF**. Reason: origin now expresses training Disallow itself; Managed ON would prepend a second training block + `Content-Signal: search=yes, ai-train=no, use=reference` before origin, recreating duplicate/conflicting directives and Semrush-style validator noise.
4. **AI Crawl Control -> Directives**: confirm **Managed robots.txt status = Off**; confirm file availability for hostname `brightai.live/robots.txt`.
5. **AI Crawl Control -> Manage AI crawlers**: set **Allow** for search/citation crawlers (`OAI-SearchBot`, `PerplexityBot`, `Perplexity-User`, `Claude-SearchBot`, `Claude-User`, `ChatGPT-User`, `YouBot`, plus traditional search). Set **Block** only for training crawlers that violate robots (`GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Meta-ExternalAgent`) ONLY if edge enforcement is desired; otherwise leave Allow and rely on robots advisory. Do NOT blanket-block Search/Agent if GEO citations are wanted.
6. **Security Settings -> Configure AI bot policies** (new preset UI): **Search = Allow (do not block)**, **Agent = Allow** (user-fetch citation path), **Training = Block** (matches robots training Disallow, including mixed-purpose per Sept 15 2026 defaults). Legacy **Block AI bots** (deprecating 2026-09-15): leave OFF unless you explicitly want legacy training-only block without mixed-purpose; prefer the new three-preset control.
7. If zone previously had `ai_bots_protection: "block"` (2026-08-08 incident), do NOT re-enable blanket block — it locked out all AI answer engines including search. Training-only enforcement is via step 6, not blanket block. `Bot Fight Mode` may stay ON for non-AI abuse.
8. Save, then **Caching -> Purge Cache** for `https://brightai.live/robots.txt` (or purge everything for the hostname) to clear `cf-cache-status: HIT` stale allow-all.
9. Wait propagation (OpenAI/Perplexity/Anthropic note up to ~24h for robots changes; Cloudflare edge is faster but crawlers cache).
10. Verify externally (not workspace DNS): `curl -s https://brightai.live/robots.txt` must equal repo `public/robots.txt`, contain `Disallow: /` for the 7 training tokens, contain no `Content-Signal` directive line and no managed prepend block, and contain exactly one `Sitemap: https://brightai.live/sitemap.xml`. Also `curl -sI` should show `server: cloudflare` without managed marker.
11. If Managed must stay ON for compliance reasons, then this task's origin-allow-search + origin-disallow-training still aligns (both disallow training), but you MUST accept duplicated training blocks + injected Content Signals and re-validate Semrush/validators; do not claim single-source policy in that case.

References:
- https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- https://developers.cloudflare.com/ai-crawl-control/
- https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/ (Sept 15 2026 Training/Agent/Search presets)

## 6. Validation performed

- Python `urllib.robotparser` (first-match parser, stricter than Google longest-match): 19/19 expectations PASS — search/citation + traditional fetch `/` and blocked from `/api/`; training tokens blocked from `/`.
- Counts: 24 user-agents, 0 duplicate tokens, 1 `Sitemap:`, 0 `Host:`, 0 `Content-Signal` directive lines (word appears only in comments), every Allow group contains `Disallow: /api/` Disallow-first.
- `public/ai.txt` now agrees with robots (search allowed, training disallowed); `llms.txt`/`llms-full.txt` link to robots without contradicting it.
- Live fetch at task start: 102-line allow-all, no managed block visible. Post-deploy live must be re-fetched to confirm 113-line training-disallow with no managed prepend.
- No `.env`, workflow, commit, push, or Cloudflare mutation performed.

## 7. SEO/GEO impact

- Citations preserved: `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`/`Perplexity-User`, `Claude-SearchBot`/`Claude-User`, `YouBot`, plus Google/Bing/Apple traditional, remain Allow. These are the bots that drive ChatGPT search citations, Perplexity answers, Claude search, You.com answers, and Google AI Overviews grounding (which uses `Googlebot`, NOT `Google-Extended`).
- Training prevented by default: `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Meta-ExternalAgent` are Disallow. Note robots is advisory; non-compliant crawlers (notably Bytespider per field reports) need edge enforcement (step 5-6) if strict.
- No broad accidental block: unverified/legacy tokens were removed rather than Disallowed, so they fall through to `* Allow` instead of being over-blocked.
