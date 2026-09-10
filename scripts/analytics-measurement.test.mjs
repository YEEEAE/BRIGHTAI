import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const runtime = read('public/js/analytics.js');
const source = read('src/lib/analytics.ts');
const leadHandler = read('src/scripts/lead-form-handler.js');
const measurementPlan = read('audit/seo-recovery/13-ANALYTICS-MEASUREMENT-PLAN.md');

const canonicalEvents = [
  'demo_submit',
  'contact_submit',
  'lead_created',
  'pricing_cta_click',
  'whatsapp_click',
  'assessment_started',
  'assessment_completed',
  'newsletter_signup',
  'resource_download',
  'outbound_partner_click',
];

test('keeps the canonical event taxonomy in both analytics layers', () => {
  for (const event of canonicalEvents) {
    assert.match(source, new RegExp(`['"]${event}['"]`), `source missing ${event}`);
    assert.match(runtime, new RegExp(`['"]${event}['"]`), `runtime missing ${event}`);
    assert.match(measurementPlan, new RegExp(`\\\`${event}\\\``), `plan missing ${event}`);
  }
});

test('sanitizes before context enrichment and provider dispatch', () => {
  assert.match(runtime, /const enriched = buildContext\(sanitized\)/);
  assert.match(source, /const enriched = buildContext\(sanitized\)/);
  assert.match(runtime, /SAFE_EVENT_PROPS/);
  assert.match(source, /SAFE_EVENT_PROPS/);
  assert.match(runtime, /assertNoPii\(sanitized\)/);
  assert.match(source, /assertNoPii\(sanitized\)/);
});

test('does not count honeypots as conversions and uses canonical lead events', () => {
  assert.match(leadHandler, /Fake success for bots, but never count a conversion/);
  assert.doesNotMatch(leadHandler, /track\(['"](?:lead_started|lead_completed|generate_lead)['"]/);
  assert.match(leadHandler, /leadTracker\.generateLead\(/);
  assert.match(read('src/pages/api/lead.ts'), /name: 'lead_created'/);
});

test('keeps consent explicit and attribution session-scoped', () => {
  assert.match(runtime, /let consent = 'unknown'/);
  assert.match(runtime, /brightai:analytics:attribution/);
  assert.match(runtime, /if \(consent === 'denied'\)/);
  assert.match(read('src/components/CookieConsent.astro'), /setTrackingConsent\('denied'\)/);
});
