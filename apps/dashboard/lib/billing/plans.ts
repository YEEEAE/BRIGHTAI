/**
 * @brightai/dashboard — Billing plans (BAI-004 / 2026-07-15)
 *
 * Single source of truth for the 3 plans displayed in the billing UI.
 * Each plan maps to a Stripe Price ID configured via env vars
 * (STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO). ENTERPRISE is sales-led —
 * no self-serve price; clicking it routes the customer to /contact.
 *
 * Why hardcoded in TS (not in DB):
 *   - Plans change ~once a year. DB storage adds an admin UI we don't
 *     need yet.
 *   - Server-only — clients never read this file. The published plan
 *     names + prices can change at deploy time without a migration.
 *   - Stripe Price IDs are the canonical record. We mirror them here
 *     for display + checkout creation.
 *
 * Pricing is in SAR (Saudi Riyal). Stripe supports SAR directly — no
 * currency conversion needed. Display strings are bilingual (AR primary,
 * EN secondary) to match the rest of the dashboard.
 */

import type { BillingPlan } from '@brightai/db';
import { BillingPlan as BillingPlanEnum } from '@brightai/db';

export type PlanDefinition = {
  /** Plan key — must match the BillingPlan enum in schema.prisma. */
  key: BillingPlan;
  /** Stripe Price ID (read from env at boot). Null for ENTERPRISE. */
  stripePriceId: string | null;
  /** Display name (AR primary, EN secondary). */
  name: { ar: string; en: string };
  /** Short tagline. */
  tagline: { ar: string; en: string };
  /** Monthly price in SAR (smallest unit = halalas). Null for ENTERPRISE. */
  priceMonthlyHalala: number | null;
  /** Display price string (formatted). Null for ENTERPRISE. */
  priceDisplay: { ar: string; en: string };
  /** Bullet list of features (AR primary). */
  features: { ar: string[]; en: string[] };
  /** CTA label (AR primary). */
  cta: { ar: string; en: string };
  /** If true, clicking the plan routes to /contact instead of Stripe checkout. */
  salesLed: boolean;
  /** Plan tier for sorting (1=lowest). */
  tier: number;
};

/** Read Stripe Price ID from env. Returns null if unset. */
function priceId(envVar: string | undefined): string | null {
  if (!envVar) return null;
  if (!/^price_[A-Za-z0-9]+$/.test(envVar)) {
    // eslint-disable-next-line no-console
    console.warn(`[billing/plans] env ${envVar} does not look like a Stripe price id, ignoring`);
    return null;
  }
  return envVar;
}

/** Format a halala amount as SAR with thousands separator + 2 decimals. */
function formatSar(halala: number, lang: 'ar' | 'en'): string {
  const sar = (halala / 100).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return lang === 'ar' ? `${sar} ر.س` : `${sar} SAR`;
}

export const PLANS: PlanDefinition[] = [
  {
    key: 'STARTER',
    stripePriceId: priceId(process.env.STRIPE_PRICE_STARTER),
    name: { ar: 'Starter', en: 'Starter' },
    tagline: {
      ar: 'للشركات الصغيرة اللي تبي تبدأ حوكمة الـ AI اليوم.',
      en: 'For small teams starting their AI governance journey.',
    },
    priceMonthlyHalala: 49900, // 499 SAR
    priceDisplay: {
      ar: formatSar(49900, 'ar'),
      en: formatSar(49900, 'en'),
    },
    features: {
      ar: [
        'حتى 5 مستخدمين نشطين',
        'حتى 100 طلب AI شهريًا',
        'سياسة افتراضية واحدة + قالب جاهز',
        'تسجيل Audit Log لمدة 30 يوم',
        'دعم بريدي (24 ساعة استجابة)',
      ],
      en: [
        'Up to 5 active users',
        'Up to 100 AI requests / month',
        '1 default policy + ready template',
        'Audit log retention: 30 days',
        'Email support (24h response)',
      ],
    },
    cta: { ar: 'ابدأ مع Starter', en: 'Start with Starter' },
    salesLed: false,
    tier: 1,
  },
  {
    key: 'PRO',
    stripePriceId: priceId(process.env.STRIPE_PRICE_PRO),
    name: { ar: 'Pro', en: 'Pro' },
    tagline: {
      ar: 'للشركات المتوسطة اللي تحتاج حوكمة كاملة لـ AI + تكاملات.',
      en: 'For mid-market companies needing full AI governance + integrations.',
    },
    priceMonthlyHalala: 199900, // 1,999 SAR
    priceDisplay: {
      ar: formatSar(199900, 'ar'),
      en: formatSar(199900, 'en'),
    },
    features: {
      ar: [
        'مستخدمين غير محدود',
        'طلبات AI غير محدودة',
        'سياسات غير محدودة + ربطها بـ AI firewall',
        'تكاملات: SharePoint + Teams + Slack',
        'تسجيل Audit Log لمدة 365 يوم + hash chain',
        'دعم خلال ساعات العمل (4 ساعات استجابة)',
        'SSO مع Google Workspace + Microsoft 365',
      ],
      en: [
        'Unlimited users',
        'Unlimited AI requests',
        'Unlimited policies + AI firewall binding',
        'Integrations: SharePoint + Teams + Slack',
        'Audit log retention: 365 days + hash chain',
        'Business-hours support (4h response)',
        'SSO with Google Workspace + Microsoft 365',
      ],
    },
    cta: { ar: 'ابدأ مع Pro', en: 'Start with Pro' },
    salesLed: false,
    tier: 2,
  },
  {
    key: 'ENTERPRISE',
    stripePriceId: null, // Sales-led — no self-serve price.
    name: { ar: 'Enterprise', en: 'Enterprise' },
    tagline: {
      ar: 'للمؤسسات الكبيرة اللي تحتاج air-gapped + SLA + تخصيص.',
      en: 'For large orgs needing air-gapped + SLA + customization.',
    },
    priceMonthlyHalala: null, // Custom quote
    priceDisplay: {
      ar: 'تواصل معنا',
      en: 'Contact us',
    },
    features: {
      ar: [
        'كل مزايا Pro',
        'نشر Air-gapped داخل المملكة',
        'SLA مضمون 99.9% + عقد سنوي',
        'تكاملات مخصصة (API + SDK)',
        'تسجيل Audit Log غير محدود + ختم زمني',
        'فريق مخصص + مدير حساب',
        'تخصيص كامل لـ PDPL / NCA / SDAIA / SFDA',
      ],
      en: [
        'Everything in Pro',
        'Air-gapped deployment in KSA',
        '99.9% SLA + annual contract',
        'Custom integrations (API + SDK)',
        'Unlimited audit retention + timestamping',
        'Dedicated team + account manager',
        'Full customization for PDPL / NCA / SDAIA / SFDA',
      ],
    },
    cta: { ar: 'تواصل مع المبيعات', en: 'Contact sales' },
    salesLed: true,
    tier: 3,
  },
];

/** Look up a plan by its key. */
export function getPlan(plan: BillingPlan): PlanDefinition {
  const def = PLANS.find((p) => p.key === plan);
  if (!def) {
    throw new Error(`Unknown plan: ${plan}`);
  }
  return def;
}

/** Look up a plan by its Stripe Price ID. */
export function getPlanByPriceId(priceId: string | null | undefined): PlanDefinition | null {
  if (!priceId) return null;
  return PLANS.find((p) => p.stripePriceId === priceId) ?? null;
}

/** True if Stripe is configured for at least one self-serve plan. */
export function isBillingConfigured(): boolean {
  return PLANS.some((p) => p.stripePriceId !== null);
}
