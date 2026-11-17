# GA4 all-page measurement — 2026-11-17

Owner requested G-9LMB4PGTWJ on every HTML page. Previously BaseLayout queued config without loading the library; AppLayout and demos omitted it. Shared GoogleAnalytics now uses gtag/js with explicit config; CSP permits loader and collection on all HTML shells, including demo meta CSP. Existing URL/referrer sanitization retained; private paths and titles collapse to section roots; Google signals and ad personalization disabled. Privacy and demo documentation updated.

- PASS: unit22, production build, one loader in all64 non-redirect HTML artifacts, routes57/references3304/redirectChecks276/broken0, diff check.
- PASS browser: home, /demo/ledger/, /app/kernel/ each one loader/config; page_view collection request observed for target ID with CSP enforcement. This does not prove property ingestion.
- Windsor get_connectors returned Unknown tool; account reports NOT VERIFIED.
- First route run used portal-enabled configuration and hit the verifier's expected disabled-portal assertion; default configuration rerun PASS.
- No commit, push, deploy, or GA property setting changes.

## Follow-up — automatic measurement
Owner requested automatic tracking without activation restrictions. Removed tag-level overrides disabling Google signals/ad personalization; those now follow property settings. Public page titles use Google's default; private titles remain section labels. External referrer origins are now retained for attribution while paths, queries and fragments remain scrubbed. Tracking has no consent-button, feature-flag, or route gate in the site code.

- PASS: final unit22, build57, CSP hash test and diff check. Earlier browser results above predate this follow-up; no new browser run.
- Windsor connection now PASS: BRIGHT AI property 551941072. Report query last_7dT returned sessions21 on2026-11-11 and1 on2026-11-13; not evidence of local changes reaching production. No property settings changed.
- Deployment and final ingestion remain NOT VERIFIED.
