# BrightAI crawler policy audit and normalization

**Date:** 2026-08-23
**Scope:** `public/robots.txt`, `public/ai.txt`, `public/llms.txt`, `public/llms-full.txt`, and Cloudflare Managed robots behavior.
**Decision:** Open crawler access. No crawler or path exclusion is expressed in repository policy.

## Result

The four public policy files now describe one intentional policy:

- traditional search crawlers: allowed;
- AI search, grounding, and citation crawlers: allowed;
- model-training crawlers: allowed, per the user's explicit override;
- `/api/`: not separately restricted in crawler policy;
- `Content-Signal`: `search=yes, ai-input=yes, ai-train=yes`;
- exactly one canonical `Sitemap:` declaration in `public/robots.txt`.

The repository does **not** change Cloudflare configuration. Cloudflare Managed robots.txt must be disabled for this policy. Cloudflare's managed feature prepends its own content and, by default, publishes `ai-train=no` plus crawler-specific restrictions, which would conflict with this open policy.

## Local comparison

| Source | Before | After | Status |
|---|---|---|---|
| `public/robots.txt` | `User-agent: * Allow: / Disallow: /api/`; explicit AI training `Allow` rules; 1 sitemap | Open default, explicit open AI/search rules, no exclusion directives, 1 sitemap | normalized |
| `public/ai.txt` | Search/training split; training allowed; one sitemap metadata entry | Explicit open-access policy; Google-Extended wording updated | normalized |
| `public/llms.txt` | Search/training split with training allowed | Explicit open-access policy | normalized |
| `public/llms-full.txt` | Search/training split with training allowed | Explicit open-access policy | normalized |

The old `robots.txt` had one `Sitemap:` declaration. The two companion-file URLs remain documentation links; they are not additional robots sitemap declarations. The `Sitemap:` metadata line was removed from `ai.txt`, leaving `public/robots.txt` as the only canonical declaration.

## Live inspection boundary

On 2026-08-23, a direct fetch of `https://brightai.site/robots.txt` from this workspace failed before HTTP with DNS resolution error (`curl: (6) Could not resolve host: brightai.site`). Therefore this run cannot truthfully claim a current live line-by-line comparison or a current Cloudflare response body. The live state is **unverified**, not fixed by repository edits.

The known historical conflict remains plausible and must be checked after the Cloudflare change: Cloudflare Managed content can appear before the origin file, so an origin `Allow` does not cancel a managed crawler-specific restriction.

## Cloudflare manual steps

1. Sign in to Cloudflare and select the `brightai.site` zone.
2. Open **Security Settings** and find **Bot traffic / Set your preference to block training in robots.txt**.
3. Turn off **Managed robots.txt / Set your preference to block training in robots.txt**. This is required because the managed variant is not compatible with the user's open-access policy.
4. Open **AI Crawl Control** and review **Directives** and crawler actions. Set every AI crawler action to **Allow**; remove any zone rule that blocks Search, Agent, Training, or mixed-purpose AI crawlers.
5. In **Security Settings → Configure AI bot policies**, set Search, Agent, and Training to **Allow (do not block)**. Do not enable the legacy **Block AI bots** setting.
6. Save, wait for propagation, then fetch `https://brightai.site/robots.txt` from an external network.
7. Confirm the response contains the repository's `Content-Signal` and `Allow` policy, contains no Cloudflare-managed conflicting block section, and contains exactly one `Sitemap: https://brightai.site/sitemap.xml`.

If Cloudflare must remain managed, the policy cannot be the user's requested open policy without a Cloudflare product/account option that explicitly allows training crawlers. Do not claim completion until the external response confirms the result.

## Validation performed

- All four files exist and are UTF-8 text.
- Across the four policy files, `public/robots.txt` has the only `Sitemap:` declaration.
- `public/robots.txt` contains `User-agent: *`, `Allow: /`, and the requested content signals.
- No `Disallow:` directive remains in `public/robots.txt`.
- The four files agree that crawler access is open.
- No `.env`, workflow, commit, push, or Cloudflare account mutation was performed.

## Official references used for semantics

- Cloudflare Managed robots.txt: https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/
- Cloudflare AI Crawl Control: https://developers.cloudflare.com/ai-crawl-control/
- OpenAI publisher crawler guidance: https://help.openai.com/en/articles/12627856-publishers-and-developers-faq
- Perplexity crawler documentation: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Google crawler controls: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
