/**
 * @brightai/dashboard — billing library unit tests (BAI-004 / 2026-07-15)
 *
 * Pure-TS tests for the plan catalog. No DB, no Stripe API. Fast.
 *
 * Run with: `pnpm --filter @brightai/dashboard test tests/billing/plans.test.ts`
 */

import { describe, it, expect } from 'vitest';
import { BillingPlan } from '@brightai/db';
import { PLANS, getPlan } from '../../lib/billing/plans';

describe('billing/plans', () => {
  describe('PLANS catalog', () => {
    it('exports exactly 3 plans', () => {
      expect(PLANS).toHaveLength(3);
    });

    it('STARTER is tier 1 with SAR pricing', () => {
      const starter = PLANS.find((p) => p.key === BillingPlan.STARTER);
      expect(starter).toBeDefined();
      expect(starter!.tier).toBe(1);
      expect(starter!.priceMonthlyHalala).toBe(49900);
      expect(starter!.priceDisplay.ar).toContain('ر.س');
      expect(starter!.priceDisplay.en).toContain('SAR');
      expect(starter!.salesLed).toBe(false);
    });

    it('PRO is tier 2 with SAR pricing', () => {
      const pro = PLANS.find((p) => p.key === BillingPlan.PRO);
      expect(pro).toBeDefined();
      expect(pro!.tier).toBe(2);
      expect(pro!.priceMonthlyHalala).toBe(199900);
      expect(pro!.salesLed).toBe(false);
    });

    it('ENTERPRISE is sales-led with no price', () => {
      const ent = PLANS.find((p) => p.key === BillingPlan.ENTERPRISE);
      expect(ent).toBeDefined();
      expect(ent!.tier).toBe(3);
      expect(ent!.priceMonthlyHalala).toBeNull();
      expect(ent!.priceDisplay.ar).toBe('تواصل معنا');
      expect(ent!.priceDisplay.en).toBe('Contact us');
      expect(ent!.salesLed).toBe(true);
      expect(ent!.stripePriceId).toBeNull();
    });

    it('every plan has bilingual (AR + EN) name, tagline, features, and CTA', () => {
      for (const plan of PLANS) {
        expect(plan.name.ar).toBeTruthy();
        expect(plan.name.en).toBeTruthy();
        expect(plan.tagline.ar).toBeTruthy();
        expect(plan.tagline.en).toBeTruthy();
        expect(plan.features.ar.length).toBeGreaterThan(0);
        expect(plan.features.en.length).toBeGreaterThan(0);
        expect(plan.features.ar.length).toBe(plan.features.en.length);
        expect(plan.cta.ar).toBeTruthy();
        expect(plan.cta.en).toBeTruthy();
      }
    });

    it('plans are sorted by tier (ascending)', () => {
      const tiers = PLANS.map((p) => p.tier);
      const sorted = [...tiers].sort((a, b) => a - b);
      expect(tiers).toEqual(sorted);
    });
  });

  describe('getPlan', () => {
    it('returns the plan for a valid key', () => {
      expect(getPlan(BillingPlan.STARTER).key).toBe(BillingPlan.STARTER);
      expect(getPlan(BillingPlan.PRO).key).toBe(BillingPlan.PRO);
      expect(getPlan(BillingPlan.ENTERPRISE).key).toBe(BillingPlan.ENTERPRISE);
    });
  });
});
