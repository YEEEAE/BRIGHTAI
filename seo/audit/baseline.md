# Semrush Site Audit baseline — 2026-09-03

> كل رقم هنا FACT من `seo/raw/`، وما لم يثبت من Semrush موسوم `not available`.

## الملخص

| الحقل | القيمة |
|---|---:|
| Domain | `brightai.live` |
| Project | `k` (`31075135`) |
| Snapshot | `6a98bf36b9c43339eff578c1` |
| Pages crawled | 313 / 500 |
| Errors | 113 |
| Warnings | 929 |
| Notices | 403 |
| Broken | 0 |

## التجميع حسب السبب الجذري

| Root cause | Semrush issue IDs | Occurrences |
|---|---|---:|
| Robots/crawl controls | 16, 4 | 11 |
| Hreflang generation/locale | 24, 204 | 40 |
| Structured-data contract | 45 | 77 |
| Page-weight/content markup | 112, 117, 222, 223 | 217 |
| Internal/external resource delivery | 12, 135 | 731 |
| Canonical/on-page title contract | 102, 105 | 38 |
| Internal linking semantics | 202, 213 | 329 |
| Transport/security | 205 | 2 |

## Issue descriptions and affected-page evidence

Semrush `meta_issues` descriptions and page-level responses are cached per issue in `seo/raw/issue-<id>-6a98bf36b9c43339eff578c1.json`. The connector returned totals for all 16 issue IDs but an empty `data` array for this historical snapshot, so exact affected URLs are `not available` from this endpoint (not guessed). The issue IDs are: 4 Blocked from crawling; 12 Broken external links; 16 Invalid robots.txt format; 24 Hreflang conflicts within page source; 45 Structured data markup errors; 102 Title too long; 105 Duplicate title/H1; 112 Low text-to-HTML ratio; 117 Low word count; 135 Unminified JS/CSS; 202 External nofollow; 204 Hreflang language mismatch; 205 No HSTS; 213 One internal link; 222 Low semantic HTML; 223 Content not optimized.

## القرار

The current code already contains local fixes for the three error roots recorded in the mind (robots, hreflang, structured data). A new remote audit cannot be claimed until the user publishes and Semrush crawls again; this MCP exposes read-only audit reports in this session.
