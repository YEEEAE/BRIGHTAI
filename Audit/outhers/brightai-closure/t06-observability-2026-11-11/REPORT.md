# T06 — observability/privacy — PARTIAL

- Time: 2026-11-11T12:36:56.055318+00:00; branch main; final base SHA `effe61431b491a19773d6192cd1ec982202aded6` + local changes; starting tree clean. Baseline `6a3d53f41b5bd1af59eb320245745498765bd320` drift verified before editing.
- Environment: macOS/local Node v22.22.2, Astro dev on 127.0.0.1:4426; synthetic data only. No build/deploy/account writes/alerts/canary.
- Source change: removed unconditional external GA4 script loader from BaseLayout. Local dataLayer/sanitizer remains inert. No consent UI invented. Consent approval is separate from error tracking; all external GA4 transport stays off until approved consent/payload implementation. Header/Hero/logo/Constellation/CSS untouched.
- Existing private-path/referrer fix was present; preserved without repeating it. UTM and public paths remain free values in the local-only preview: not approved for external transmission. Do not restore the loader alone.

## Evidence

| Check | Time UTC | Result |
|---|---|---|
| `node --import ./tests/helpers/no-egress.mjs --test tests/observability.test.mjs` | 2026-11-11T12:33Z | PASS 19/19, including opt-out gates, independent kill switches, collector 500/throw, rejection and payload redaction |
| `node scripts/preview-observability-payload.mjs --out Audit/t06-observability-2026-11-11/payload-preview.json` | 2026-11-11T12:33Z | PASS generated 6 Sentry + 6 PostHog contracts, no transport; UUIDs are synthetic, NOT ingestion IDs |
| Browser network on `/docs/?token=SYNTHETIC&utm_source=SYNTHETIC#SYNTHETIC` | 2026-11-11T12:35:37.937Z | PASS zero Google/PostHog/Sentry requests; local config below |
| Sentry fresh project readback organization659ec3bf0cec/us | 2026-11-11T12:36Z | PASS metadata read; projects=[]/hasMore=false |
| PostHog project720936 readback | 2026-11-11T12:35Z | PASS metadata read; settings below; no customer event query |
| Canary/eventID / alert / live deployment / real journey | — | NOT RUN; no approved destination, consent, retention, channel or send authorization |

Browser local config (NOT transmitted):
```json
{"page_location":"http://127.0.0.1:4426/docs/?utm_source=SYNTHETIC","page_referrer":""}
```
The token and fragment are absent. UTM marker remains locally; this is why transport is disabled rather than privacy certified. Initial dev start failed sandbox EPERM, browser connection refused; authorized local dev retry succeeded. This is not an application test failure.

PostHog metadata: ingested_event=false; anonymize_ips=false; console=true; performance=true; replay=false; autocapture_opt_out=null; **session recording** retention=30d. This is NOT analytics event retention. Earlier 12-month event-retention evidence is HISTORICAL; current event retention NOT VERIFIED. ingested_event=false is not a historical event census. No project token saved.

## Decisions and blockers

- Internal: NOT READY for observability acceptance; local adapter/privacy containment only.
- Public: NO-GO for monitoring closure; published artifact unchanged and unverified here.
- Commercial: NO-GO; no operational acceptance.
- Privacy/owner: approve exact destination and payload, GA4 consent, event retention. Existing no-cost proposal: reuse PostHog720936; approve IP anonymization and disabling console/perf/replay/autocapture account settings; no paid upgrade.
- Observability/SRE: owner authorization to create Sentry project, one canary with readback, then an independently authorized single alert; on-call/incident commander/rollback owner and channel remain UNASSIGNED. `#ops-alerts` is a proposal, not a working channel.
- T01/T03 owners: real deployed authenticated journey remains prerequisite for product event acceptance.
- Rollback/containment: keep GA4 loader absent; disable only affected Sentry/PostHog kill switch per runbook. Local health/log paths unchanged. Never delete remote events to roll back.
