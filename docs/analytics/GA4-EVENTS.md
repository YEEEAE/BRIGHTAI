# GA4 Event Taxonomy

## Key Events (Mark in GA4 Admin)

Mark these as **Key Events** in GA4 Admin > Events > Key Events:

| Event | Category | Triggers | Mark as Key Event? |
|---|---|---|---|
| `consultation_request` | Lead Gen | CTA click to /consultation/ OR form submission on consultation forms | **Yes** |
| `request_demo` | Lead Gen | CTA click to /demo/ or demo-related text | **Yes** |
| `whatsapp_click` | Contact | Click on WhatsApp link (wa.me, api.whatsapp.com) | **Yes** |
| `phone_click` | Contact | Click on tel: link | Yes |
| `email_click` | Contact | Click on mailto: link | Yes |
| `contact_form_submit` | Lead Gen | Any contact form submission | **Yes** |
| `lead_magnet_submit` | Lead Gen | Download of guide/ebook/report PDF OR form submission on lead magnet forms | **Yes** |
| `pricing_view` | Engagement | Page view of /pricing/ or /demo/pricing/ | **Yes** |
| `pricing_click` | Engagement | Click on pricing-related CTA | Yes |
| `generate_lead` | Lead Gen | Generic lead generation CTA | Yes |
| `tool_start` | Engagement | Tool/demo start button | Yes |

## Data Attribute Usage

Add these HTML attributes to elements you want tracked:

```html
<a href="/consultation/" data-analytics-event="consultation_request" data-cta-location="homepage">...</a>
```

### Required Attributes

| Attribute | Purpose | Example |
|---|---|---|
| `data-analytics-event` | Event name (snake_case) | `consultation_request` |
| `data-cta-location` | Where the CTA appears on the page | `homepage`, `footer`, `pricing-hero`, `demo-hero` |

### Optional Attributes

| Attribute | Purpose | Example |
|---|---|---|
| `data-service-name` | Identifies the service context | `ai_agent`, `smart_automation`, `data_analysis` |
| `data-tool-name` | Tool/demo identifier | `pricing_estimator` |
| `data-tender-feature` | Tender-specific feature | `bid_analysis` |

## Automatic Detection

If no `data-analytics-event` is set, the system auto-infers from:

| Pattern | Event |
|---|---|
| tel: links | `phone_click` |
| mailto: links | `email_click` |
| whatsapp/wa.me links | `whatsapp_click` |
| /pricing/ in href or Arabic text | `pricing_click` |
| /demo/ in href or demo text | `request_demo` |
| /consultation/ or استشارة | `consultation_request` |
| /contact/ or تواصل/اتصل | `generate_lead` |
| PDF/DOCX downloads (guide/دليل/ebook) | `lead_magnet_submit` |
| Other PDF/DOCX downloads | `file_download` |
| External URLs | `outbound_click` |

## Form Tracking

Forms auto-fire on submit. Override the event with:

```html
<form data-analytics-submit-event="lead_magnet_submit">
```

The system also fires `contact_form_submit` alongside the custom event (unless the custom event is `lead_magnet_submit`).

## UTM Guidance for LinkedIn / X Campaigns

### LinkedIn Campaign Structure

```
https://brightai.site/consultation/
  ?utm_source=linkedin
  &utm_medium=paid_social
  &utm_campaign={campaign_name}
  &utm_content={ad_creative_id}
  &utm_term={targeting_segment}
```

### X (Twitter) Campaign Structure

```
https://brightai.site/demo/pricing/
  ?utm_source=x
  &utm_medium=paid_social
  &utm_campaign={campaign_name}
  &utm_content={tweet_id}
  &utm_term={audience}
```

### Recommended UTM Parameters

| Parameter | Description | Example Values |
|---|---|---|
| `utm_source` | Platform | `linkedin`, `x`, `google` |
| `utm_medium` | Channel type | `paid_social`, `organic_social`, `cpc`, `email` |
| `utm_campaign` | Campaign name | `ai_consulting_q2`, `pricing_awareness` |
| `utm_content` | Specific ad/tweet | `hero_cta_v1`, `carousel_ad_2` |
| `utm_term` | Targeting keyword | `saudi_enterprise`, `c_level` |

### Landing Page → Event Mapping

| Campaign Goal | Destination Page | Target Event |
|---|---|---|
| Consultation | `/consultation/` | `consultation_request` |
| Demo | `/demo/` or `/demo/pricing/` | `request_demo`, `pricing_view` |
| Pricing | `/demo/pricing/` | `pricing_view` |
| Contact | `/contact/` | `contact_form_submit` |

### Google Ads Auto-Tagging

If using Google Ads, keep **auto-tagging** enabled (`gclid`). The GA4 gtag automatically reads `gclid` and merges Google Ads click data into GA4.

## Testing

All events dispatch a `CustomEvent` with prefix `brightai:` on the `window` object. Listen for them in the console:

```js
window.addEventListener("brightai:consultation_request", (e) => console.log(e.detail));
```

To verify gtag is actually firing, use the GA4 DebugView or the [GA4 Tag Assistant](https://tagassistant.google.com/).

## `window.BrightAIAnalytics` Public API

```js
// Track any event
window.BrightAIAnalytics.track("event_name", { optional: "params" });

// Track form success (fires contact_form_submit by default)
window.BrightAIAnalytics.trackFormSuccess("form_id", "optional_event_name");

// Track form error (fires contact_form_error)
window.BrightAIAnalytics.trackFormError("form_id");
```
