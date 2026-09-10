/**
 * lead-tracker.ts — Lead capture event taxonomy (CRO Audit Prompt 4 + 5).
 *
 * This module is now a THIN WRAPPER over the unified analytics layer
 * (src/lib/analytics.ts). It exists for two reasons:
 *
 *   1. BACK-COMPAT — LeadForm.astro and the original Prompt 4 deliverables
 *      imported `leadTracker` and `ERROR_CODES` from here. Keeping the
 *      same surface means no breaking changes to call-sites that haven't
 *      been migrated to the new API yet.
 *
 *   2. FORM-SPECIFIC HELPERS — `leadTracker.formView`, `.formStart`, etc.
 *      are typed as `(formId, pagePath, ...)` so a typo in `form_id` is
 *      impossible. New code should use the unified `track()` directly,
 *      but the helpers stay here because they enforce a contract.
 *
 * PII rule (unchanged): the underlying `track()` enforces the allowlist
 * via `assertNoPii()`. Adding a sensitive key to any helper payload
 * throws in dev mode (window.__BRIGHTAI_DEBUG_TRACKING__ === true).
 *
 * @deprecated prefer the unified `track()` from `./analytics` for new code.
 */

import {
  track,
  ERROR_CODES,
  assertNoPii,
  ANALYTICS_EVENTS,
  type AnalyticsPayload,
} from './analytics';

// Re-export the back-compat names that other modules import.
export { ERROR_CODES, assertNoPii, ANALYTICS_EVENTS };
export type { ErrorCode } from './analytics';

export type LeadEventName =
  | 'form_view'
  | 'form_start'
  | 'form_field_error'
  | 'form_submit_attempt'
  | 'form_submit_success'
  | 'form_submit_failure'
  | 'lead_created';

export interface LeadEventPayload {
  form_id: string;
  page_path: string;
  source?: string;
  medium?: string;
  campaign?: string;
  field_name?: string;
  error_code?: string;
  duration_ms?: number;
  lead_id?: string;
  mode?: 'shipped' | 'queued' | 'native';
}

export const leadTracker = {
  formView: (formId: string, pagePath: string) =>
    track('form_view', { form_id: formId, form_type: formTypeFor(formId), page_path: pagePath }),

  formStart: (formId: string, pagePath: string) =>
    track('form_start', { form_id: formId, form_type: formTypeFor(formId), page_path: pagePath }),

  formFieldError: (
    formId: string,
    pagePath: string,
    fieldName: string,
    errorCode: string,
  ) =>
    track('form_field_error', {
      form_id: formId,
      form_type: formTypeFor(formId),
      page_path: pagePath,
      field_name: fieldName,
      error_code: errorCode,
    }),

  formSubmitAttempt: (
    formId: string,
    pagePath: string,
    source?: string,
    medium?: string,
    campaign?: string,
  ) =>
    track('form_submit_attempt', {
      form_id: formId,
      form_type: formTypeFor(formId),
      page_path: pagePath,
      source,
      medium,
      campaign,
    }),

  formSubmitSuccess: (
    formId: string,
    pagePath: string,
    opts: { durationMs: number; leadId?: string; mode?: 'shipped' | 'queued' | 'native' } = {
      durationMs: 0,
    },
  ) =>
    track('form_submit_success', {
      form_id: formId,
      form_type: formTypeFor(formId),
      page_path: pagePath,
      duration_ms: Math.round(opts.durationMs),
      lead_id: opts.leadId,
      mode: opts.mode,
    }),

  formSubmitFailure: (
    formId: string,
    pagePath: string,
    errorCode: string,
    durationMs: number,
  ) =>
    track('form_submit_failure', {
      form_id: formId,
      form_type: formTypeFor(formId),
      page_path: pagePath,
      error_code: errorCode,
      duration_ms: Math.round(durationMs),
    }),

  /** Canonical conversion events. Each successful form is counted once by
    *  its form-specific event plus one lead_created event. */
  generateLead: (
    formId: string,
    pagePath: string,
    opts: {
      source?: string;
      medium?: string;
      campaign?: string;
    } = {},
  ) => {
    const common = {
      form_id: formId,
      form_type: formTypeFor(formId),
      page_path: pagePath,
      source: opts.source ?? undefined,
      medium: opts.medium ?? undefined,
      campaign: opts.campaign ?? undefined,
    };
    const specific = formId === 'newsletter'
      ? 'newsletter_signup'
      : formId === 'kernel_lead'
        ? 'demo_submit'
        : formId === 'contact_main' || formId === 'home_cta'
          ? 'contact_submit'
          : undefined;
    if (specific) track(specific, common);
    track('lead_created', common);
  },
};

function formTypeFor(formId: string): string {
  if (formId === 'newsletter') return 'newsletter';
  if (formId === 'kernel_lead') return 'demo';
  if (formId === 'contact_main' || formId === 'home_cta') return 'contact';
  if (formId === 'partners') return 'partner';
  if (formId === 'referral') return 'referral';
  if (formId.startsWith('event_')) return 'event';
  return 'other';
}

/** Re-export the unified track so other modules can `import { track } from
 *  './lead-tracker'` without caring that the real implementation lives in
 *  './analytics'. */
export { track };

/** Legacy direct emit (used by lead-form-handler.js when it needs the
 *  lowest-level hook). */
export function trackLeadEvent(
  event: LeadEventName,
  payload: LeadEventPayload,
): void {
  // P0-3 cleanup (2026-07-19): pre-existing type cast was rejected by
  // strict tsc (the two types don't overlap enough). Two-step through
  // `unknown` is the documented escape hatch for intentional unsafe casts.
  track(event, payload as unknown as AnalyticsPayload);
}
