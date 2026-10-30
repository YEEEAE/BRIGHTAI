# BrightAI Analytics Measurement Plan

**Status:** implementation baseline — 2026-09-10  
**Scope:** GA4 event taxonomy, attribution, consent, conversion quality, and privacy-safe parameters.

## 1. Measurement goals

1. Measure qualified commercial intent without collecting PII in analytics.
2. Attribute sessions and conversions to the first known UTM/referrer context.
3. Keep client and server lead events on the same canonical names.
4. Prevent duplicate conversion counts from refreshes, retries, bot traps, or client/server overlap.
5. Make assessment, resource, WhatsApp, partner, and newsletter journeys queryable in GA4.

## 2. Canonical event taxonomy

| Event | When it fires | Required context | GA4 key event? |
|---|---|---|---|
| `demo_submit` | Browser: the lead API returns an accepted response for a valid demo/kernel lead | `form_id`, `form_type`, `page_path`, safe attribution | Yes |
| `contact_submit` | Browser: the configured contact form provider confirms successful acceptance | `form_id`, `form_type`, `page_path`, safe attribution | Yes |
| `lead_created` | Server: a new durable lead row was created; emitted only with explicit analytics consent | `form_id`, `form_type`, safe source, mode | Reconciliation only; never add to form-specific key events |
| `pricing_cta_click` | Pricing CTA click | `cta_location`, `cta_target`, `page_path` | No |
| `whatsapp_click` | WhatsApp CTA click | `cta_location`, `cta_target`, `page_path` | No |
| `assessment_started` | First answer interaction | `step`, `page_path`, `content_group` | No |
| `assessment_completed` | Assessment result is rendered | `step`, `page_path`, `content_group` | Yes |
| `newsletter_signup` | Valid newsletter form accepted | `form_id`, `form_type`, `page_path` | Yes |
| `resource_download` | A tracked resource download starts | `resource_type`, `page_path` | No |
| `outbound_partner_click` | A marked partner link is clicked | `outbound_domain`, `cta_location`, `page_path` | No |

Legacy source names (`generate_lead`, `lead_submitted`, `lead_started`, `lead_completed`, `assessment_start`, `assessment_complete`) must not be sent to GA4. Internal aliases resolve to the canonical names where old templates still provide a CTA value.

## 3. Shared parameters

Allowed parameters are intentionally small: `page_path`, `page_type`, `content_group`, `form_id`, `form_type`, `cta_location`, `cta_label`, `cta_target`, `source`, `medium`, `campaign`, `content`, `term`, `referrer`, `language`, `step`, `duration_ms`, `mode`, `resource_type`, and `outbound_domain`.

Never send names, email addresses, phone numbers, free-text form answers, company names, raw URLs containing query values, or unapproved payload keys. The client allowlists and sanitizes event properties before provider dispatch. Browser CTA clicks and form attempts are behavior, not accepted leads. WhatsApp click/fallback is a handoff only.

## 4. Attribution rules

- Read `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `utm_term` from the landing URL.
- Persist the first known attribution in `sessionStorage` as `brightai:analytics:attribution`.
- Later pages reuse the stored values; a new non-empty UTM value may update the current session attribution.
- If no UTM exists, use `source=direct`, `medium=none`; a non-empty referrer uses `source=referral`, `medium=referral`.
- Do not persist raw query strings or PII.
- Use `page_path` rather than full URLs for page reporting.

## 5. Consent and deduplication

- Default state is `unknown`; no analytics provider receives events until `granted`.
- `denied` clears queued events and remains denied for the session/storage value.
- Server-side `lead_created` is best-effort, requires `X-Analytics-Consent: granted`, and is emitted only when the queue inserts a new idempotency key. It must not block lead creation.
- Browser owns `demo_submit`/`contact_submit`; server owns `lead_created`. They are separate funnel stages, not duplicate conversions. The Kernel API idempotency key persists across retry/refresh.
- A successful form conversion is emitted once per accepted submission; honeypot submissions never emit a conversion.
- GA4 key-event reporting should use the specific form event for funnel reporting and `lead_created` for server/client reconciliation, not add both to a revenue total.

## 6. GA4 reports and explorations

Create these saved views after manual setup:

1. **Commercial funnel:** `pricing_cta_click` → `contact_submit`/`demo_submit`; use `lead_created` only as a separate server reconciliation stage.
2. **Assessment funnel:** `assessment_started` → `assessment_step_progress` → `assessment_completed`.
3. **Acquisition:** sessions and key events by `source / medium / campaign` and landing `page_path`.
4. **Content assist:** `resource_download`, `outbound_partner_click`, and newsletter signups by `content_group`.
5. **Data quality:** event count by `event_name`, missing `page_path`, and client/server lead reconciliation.

## 7. Acceptance criteria

- [ ] All ten canonical events are present in source and runtime taxonomy.
- [ ] No legacy event is dispatched to a provider.
- [ ] No analytics payload contains PII or unapproved keys.
- [ ] Consent denial produces zero provider hits after denial.
- [ ] Refreshing a result page does not create a second conversion.
- [ ] Bot/honeypot submissions do not create a conversion.
- [ ] UTM values survive navigation within one session.
- [ ] GA4 DebugView shows the event name and expected parameters.
- [ ] Cross-domain and redirect tests are completed before relying on source/medium reports.
