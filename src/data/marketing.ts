/**
 * marketing.ts — Centralized marketing/analytics configuration.
 *
 * Single source of truth for growth-stack tracking IDs that are NOT already
 * in src/data/site.ts (which is a protected file). IDs here are placeholders;
 * they can be overridden at build time via PUBLIC_* env vars (Render / Vite).
 *
 * All consumers must render tracking CONDITIONALLY: if the resolved value is
 * empty, nothing is emitted. This keeps the site clean until real IDs are
 * provided. HubSpot / Bing UET / Mixpanel scripts are scaffolded but inert
 * until the IDs are filled (and until public/_headers CSP is updated to
 * allow the external origins — a protected-file change requiring approval).
 */

export const MARKETING = {
  /** HubSpot portal ID (e.g. "12345678"). Empty = script not emitted. */
  hubspotPortalId: '',
  /** Bing UET tag ID (e.g. "1234567"). Empty = script not emitted. */
  bingUetId: '',
  /** Mixpanel project token. Empty = script not emitted. */
  mixpanelToken: '',
  /** Destination inbox for formsubmit.co lead captures. */
  leadInbox: 'info@brightai.site',
  /** Default thank-you / redirect target after a lead form submit. */
  leadThankYou: 'https://brightai.site/thank-you/',
} as const;

/**
 * Resolved tracking config. Prefers PUBLIC_* env overrides so the same build
 * can target staging vs production without code changes.
 */
export const TRACKING = {
  hubspot:
    (import.meta.env.PUBLIC_HUBSPOT_PORTAL as string | undefined) ??
    MARKETING.hubspotPortalId,
  bingUet:
    (import.meta.env.PUBLIC_BING_UET as string | undefined) ?? MARKETING.bingUetId,
  mixpanel:
    (import.meta.env.PUBLIC_MIXPANEL_TOKEN as string | undefined) ??
    MARKETING.mixpanelToken,
} as const;

/** True only when a real HubSpot portal ID is configured. */
export const hasHubSpot = TRACKING.hubspot.length > 0;
/** True only when a real Bing UET ID is configured. */
export const hasBingUet = TRACKING.bingUet.length > 0;
/** True only when a real Mixpanel token is configured. */
export const hasMixpanel = TRACKING.mixpanel.length > 0;

/**
 * UTM / source attribution helper — builds hidden form fields for lead forms
 * so every captured lead carries its acquisition source into the inbox/CRM.
 */
export interface AttributionSource {
  source?: string;
  medium?: string;
  campaign?: string;
}

export function attributionFields(src: AttributionSource = {}): {
  name: string;
  value: string;
}[] {
  const map: Record<string, string> = {};
  if (src.source) map['utm_source'] = src.source;
  if (src.medium) map['utm_medium'] = src.medium;
  if (src.campaign) map['utm_campaign'] = src.campaign;
  return Object.entries(map).map(([name, value]) => ({ name, value }));
}
