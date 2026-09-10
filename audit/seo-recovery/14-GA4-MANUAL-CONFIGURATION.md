# GA4 Manual Configuration Runbook

**Status:** pending owner execution  
**Property:** BrightAI production GA4 property (use the existing measurement ID from the deployment configuration; do not paste secrets into this file).

## 1. Data streams and tagging

- [ ] Confirm one production Web data stream for the canonical BrightAI host.
- [ ] Confirm redirects converge on one canonical host and HTTPS URL.
- [ ] Confirm the existing GA4 measurement ID is identical in `BaseLayout`, `gtag-init.js`, and deployment configuration.
- [ ] Keep enhanced measurement limited to useful page views and outbound clicks; avoid duplicate auto-events for custom CTAs.
- [ ] If another domain owns the lead handoff, add it under **Configure > Data streams > More tagging settings > Configure your domains**.

## 2. Custom dimensions

Register only parameters that are used for reporting and are present in the allowlist:

| Dimension | Scope | Parameter |
|---|---|---|
| Content group | Event | `content_group` |
| Form type | Event | `form_type` |
| CTA location | Event | `cta_location` |
| Form ID | Event | `form_id` |
| Resource type | Event | `resource_type` |
| Outbound domain | Event | `outbound_domain` |

Do not register email, phone, name, company, free-text, or raw query-string values.

## 3. Key events

Mark these as key events after DebugView validation:

- `demo_submit`
- `contact_submit`
- `lead_created` (reconciliation/audit; do not sum it with the form-specific lead event)
- `newsletter_signup`
- `assessment_completed`

Keep CTA clicks and downloads as ordinary events unless the owner explicitly wants them as business conversions.

## 4. Consent Mode v2

- [ ] Verify default `analytics_storage=denied` before consent.
- [ ] Accept updates `analytics_storage` and `ad_storage` to `granted`.
- [ ] Decline keeps both denied and drops queued events.
- [ ] Keep `ad_user_data=denied` and `ad_personalization=denied` unless a separately approved ads use case exists.
- [ ] Test a fresh private window, accept, decline, and reload scenarios.

## 5. DebugView QA checklist

For each scenario, open GA4 DebugView and browser network logs:

1. Fresh visit with no UTM: verify `source=direct`, `medium=none`.
2. Visit with UTM: navigate to another page and verify attribution persists.
3. Accept consent: verify one page view and the intended CTA event.
4. Decline consent: verify no provider hit.
5. Submit contact/demo form: verify one form-specific event and one `lead_created` reconciliation event, with no PII.
6. Trigger honeypot: verify no conversion event.
7. Complete assessment and reload result: verify one `assessment_completed`.
8. Click WhatsApp, a resource, and a partner link: verify the correct event and safe target context.
9. Test HTTP→HTTPS and www/non-www redirects: verify the final page retains attribution.

## 6. Operational ownership

- GA4 admin changes: owner/admin only.
- Code taxonomy and allowlist: engineering.
- Monthly data-quality review: compare form submissions, server `lead_created`, and GA4 key events.
- Any new event or parameter needs a source change, this runbook update, and DebugView evidence.
