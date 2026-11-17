# Arabic practical resources — 2026-11-17

Status: DONE locally; deployment NOT RUN.

## Existing material and distinction
Reviewed knowledge catalog, employee-use policy, risk-assessment guide, RACI guide entry and sector routes. Existing material explains the topics; new /resources/ is a complementary document library, not replacement guides. Reuses PageShell and site identity. MGD screen discovery returned an unrelated music screen; no reference code or assets were copied.

## Delivery
- Stable canonical pages: /resources/ai-use-policy/, /resources/ai-risk-register/, /resources/responsibility-evidence-matrix/; library /resources/.
- HTML tables rendered server-side; directly downloadable Markdown policy and UTF-8 BOM CSV register/matrix. Three template files, three separate synthetic examples, three README/license/instruction sidecars.
- Versioned files: public/resources/v1.0-2026-11-17/. Version 1.0, original Arabic educational content, CC BY 4.0; branding and linked third-party material excluded.
- Shared synthetic POL-SYN-01 / UC-SYN-01 / R-SYN-01 / E-SYN-01 identifiers connect the examples. No authentic approval or actual evidence is implied.
- Each resource links its detailed guide, privacy and evidence guidance, four sector pages and complementary resources. Library linked from docs; policy/risk guides link back.
- No email or account gate, no editor submission endpoint. Editing takes place in user's local editor. No automatic score or compliance determination.

## Verification on final source
- Isolated existing lockfile dependencies (Astro 6.4.8), npm run build PASS: 64 indexable pages, sitemap/metadata/HTML aliases and llms coverage PASS. Root node_modules differs from lockfile; no dependencies changed.
- CSV parsed successfully, uniform columns and values match HTML source data; six editable downloads and three instruction files nonempty.
- 37 unique internal link targets exist in build.
- Headless Chrome via Playwright: 4 pages × 390/1440 widths = 8 PASS; actual widths checked, RTL, no document overflow, JavaScript disabled, no email input, downloads HTTP 200 with nonempty bodies, table-region keyboard focus PASS. browser.json records values.
- Visual mobile inspection caught compressed table columns despite no document overflow. Fixed explicit table width/layout and column minimum; final browser checks assert cell width >=170px (see browser.json), screenshot regenerated.
- git diff --check PASS.

## Limits
No publish, commit or remote write. Public production URLs are not activated by local implementation. Actual Excel/LibreOffice GUI import and screen-reader use NOT RUN; CSV parsing and UTF-8 BOM verified. Sector adaptations and real internal approvals remain the user's responsibility. No SDAIA endorsement, legal advice, certification or comprehensive accessibility claim.
