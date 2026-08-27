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
 *
 * CRO audit (2026-07-18, Prompt 4): adds LEAD_FORM_ENDPOINTS, FORM_TAXONOMY,
 * DEFAULT_CONTACT_FIELDS, and SESSION_KEYS so every lead form across the
 * site shares the same field set, endpoint, thank-you URL, and analytics
 * identifiers. PII stays in form data; analytics only ever see form_id.
 */

export const MARKETING = {
  /** HubSpot portal ID (e.g. "12345678"). Empty = script not emitted. */
  hubspotPortalId: '',
  /** Bing UET tag ID (e.g. "1234567"). Empty = script not emitted. */
  bingUetId: '',
  /** Mixpanel project token. Empty = script not emitted. */
  mixpanelToken: '',
  /** Destination inbox for formsubmit.co lead captures. */
  leadInbox: 'info@brightai.live',
  /** Default thank-you / redirect target after a lead form submit. */
  leadThankYou: 'https://brightai.live/thank-you/',
} as const;

/**
 * Lead-form endpoints. Two formsubmit.co URLs — `native` is the regular
 * POST endpoint (used as a no-JS fallback + as the `action=` of the
 * rendered <form>); `ajax` returns JSON and is what the client uses when
 * JS is enabled. Keeping the two URLs side-by-side here means a future
 * migration to HubSpot / Marketo / our own /api/lead/ only changes this
 * one object — every form picks up the new sink automatically.
 */
export const LEAD_FORM_ENDPOINTS = {
  native: `https://formsubmit.co/${MARKETING.leadInbox}`,
  ajax: `https://formsubmit.co/ajax/${MARKETING.leadInbox}`,
} as const;

/**
 * Stable form_id taxonomy. Every form across the site must use one of
 * these so the analytics dashboards have a consistent filter. To add a
 * new form, add its id here — never invent a new one at the call site.
 */
export const FORM_TAXONOMY = {
  /** /contact/ — main conversion form. Full qualification fields. */
  CONTACT_MAIN: 'contact_main',
  /** / (homepage) CTA — compact version of contact form. */
  HOME_CTA: 'home_cta',
  /** /newsletter/ — weekly briefing signup. */
  NEWSLETTER: 'newsletter',
  /** /partners/ — partner program signup. */
  PARTNERS: 'partners',
  /** /referral/ — referral submission. */
  REFERRAL: 'referral',
  /** /calculator/roi/ — ROI calculator contact capture. */
  ROI_CALCULATOR: 'roi_calculator',
  /** /events/webinar/ — webinar registration. */
  EVENT_WEBINAR: 'event_webinar',
  /** /events/leap-2026/ — LEAP 2026 registration. */
  EVENT_LEAP: 'event_leap',
  /** /events/ai-governance-day/ — AI Governance Day registration. */
  EVENT_GOV_DAY: 'event_gov_day',
  /** /kernel/* pages — KernelLeadForm (3 fields + WhatsApp fallback). */
  KERNEL_LEAD: 'kernel_lead',
} as const;

export type FormId = (typeof FORM_TAXONOMY)[keyof typeof FORM_TAXONOMY];

/**
 * sessionStorage keys — single source of truth so we don't typo across
 * forms. All names are namespaced under `brightai:lead:` to avoid
 * collisions with other scripts.
 */
export const SESSION_KEYS = {
  /** Per-form field values (Back/Retry preservation, no PII leak). */
  formValues: (formId: string) => `brightai:lead:${formId}:values`,
  /** The first page the visitor landed on (for attribution). */
  landingPage: 'brightai:lead:landing_page',
  /** Locked once the user submits a form — survives until cleared. */
  submitted: (formId: string) => `brightai:lead:${formId}:submitted`,
} as const;

/**
 * Default contact-form field set (CRO audit Prompt 4 §4). The minimum
 * fields for B2B qualification:
 *   required: work_email, full_name, company, role, primary_need
 *   optional: phone, message
 *   required consent: pdpl_consent
 *
 * Each page can override fields entirely (e.g. the webinar form needs
 * a different role set) but the contact form should use this exact set
 * so the inbox + CRM downstream see consistent keys.
 */
export interface LeadFieldDef {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
  autocomplete?: string;
  full?: boolean;
  hint?: string;
}

export const DEFAULT_CONTACT_FIELDS: LeadFieldDef[] = [
  {
    name: 'full_name',
    label: 'الاسم الكامل',
    required: true,
    autocomplete: 'name',
    placeholder: 'مثال: محمد أحمد القحطاني',
  },
  {
    name: 'work_email',
    label: 'البريد الإلكتروني للعمل',
    type: 'email',
    required: true,
    autocomplete: 'email',
    placeholder: 'name@company.sa',
    hint: 'نتحقق من بريد العمل فقط. لا نمنع النطاقات العامة بلطف.',
  },
  {
    name: 'company',
    label: 'اسم الشركة / الجهة',
    required: true,
    autocomplete: 'organization',
    placeholder: 'مثال: مجموعة stc، مستشفى الملك فيصل التخصصي',
  },
  {
    name: 'role',
    label: 'دورك في الشركة',
    type: 'select',
    required: true,
    options: [
      'CISO / مدير الأمن السيبراني',
      'مسؤول الامتثال / DPO',
      'CIO / مدير التقنية',
      'مدير المخاطر / التدقيق الداخلي',
      'مدير التحول الرقمي',
      'المشتريات',
      'إدارة / CEO',
      'غيره',
    ],
  },
  {
    name: 'primary_need',
    label: 'الاحتياج الأساسي',
    type: 'select',
    required: true,
    options: [
      'حوكمة AI ومنصة تشغيلية',
      'AI Firewall وحماية بيانات',
      'سجل تدقيق وأدلة امتثال',
      'طبقة موافقة بشرية للقرارات الحساسة',
      'تقييم جاهزية الحوكمة',
      'Pilot لمدة 30 يوم',
      'Enterprise rollout',
      'استفسار عام',
    ],
    full: true,
  },
  {
    name: 'phone',
    label: 'رقم الجوال (اختياري)',
    type: 'tel',
    required: false,
    autocomplete: 'tel',
    placeholder: '05X-XXX-XXXX',
    hint: 'نستخدمه فقط للتواصل على طلبك. مو للتسويق.',
  },
  {
    name: 'message',
    label: 'رسالة إضافية (اختياري)',
    type: 'textarea',
    required: false,
    full: true,
    placeholder: 'أي سياق يساعد فريقنا يجهز الاجتماع بشكل أدق…',
  },
] as const;

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
