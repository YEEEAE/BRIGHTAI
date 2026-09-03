# SEO execution report — 2026-09-03

## Executive summary (numbers only)

- FACT: 313 / 500 pages crawled.
- FACT: 113 errors, 929 warnings, 403 notices.
- FACT: 0 broken pages, 10 blocked pages, 1 redirected page.
- FACT: 1 organic keyword, estimated organic traffic 0.
- FACT: 67 backlinks from 30 referring domains; Authority Score 2.

## Before / after

| Gate | Before | After |
|---|---:|---:|
| Semrush errors | 113 FACT | not available — no post-deploy recrawl |
| Semrush warnings | 929 FACT | not available — no post-deploy recrawl |
| Semrush notices | 403 FACT | not available — no post-deploy recrawl |
| Lighthouse mobile | not run FACT | not available |
| Lighthouse desktop | not run FACT | not available |

## Acceptance checklist

- [ ] Site Audit 0/0/0 — FAIL: remote snapshot remains 113/929/403.
- [ ] CWV green mobile/desktop — FAIL: no runnable Lighthouse CLI/data.
- [ ] Lighthouse 100 — FAIL: CLI absent; no invented score.
- [ ] Canonical/title/meta/H1/schema/lang/dir — PARTIAL: local contracts exist; full 262-page rendered validation not rerun here.
- [ ] 3 inbound links per indexable page — FAIL: Semrush reports 27 pages with one internal link (issue 213).
- [ ] Broken links/redirect chains — PARTIAL: snapshot says broken=0; redirect-chain detail requires fresh crawl.
- [ ] Sitemap/robots sync — PARTIAL: local robots fix exists; remote snapshot predates it.

## Fixed root causes in current working tree

- `robots.txt` unsupported `Content-Signal` removal.
- hreflang empty/duplicate guard.
- truthful `WebApplication` schema and removal of fabricated review data.
- non-HQ city pages no longer emit an addressless `LocalBusiness`.
- legacy FAQ microdata stripped from rendered articles.

No commits were created: repository policy requires the user to commit and publish.

## Semrush tool inventory

`audience_research`, `backlinks_research`, `competitors_research`, `domain_overview`, `execute_report`, `get_report_schema`, `keyword_research`, `organic_research`, `paid_search_research`, `position_tracking`, `projects`, `shopping_research`, `site_audit`, `traffic_overview`.

## Data limits

Semrush MCP did not expose API-unit balance, recrawl mutation, or affected-URL rows for the historical `issue_details` responses (totals were returned with empty data). These are recorded as `not available`, never zero.
