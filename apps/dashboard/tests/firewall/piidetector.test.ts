/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Integration tests for the detector orchestrator. These exercise
 * the full pipeline: regex → dedupe → actions.
 *
 * NER is disabled in Phase 1a so these tests run quickly and
 * without the 250MB model download.
 */

import { describe, it, expect } from 'vitest';
import { detect, detectAndRedact, dedupeOverlap, hasHighRiskPII } from '../../lib/firewall/engine/piidetector';
import { DEFAULT_POLICY, type FirewallContext } from '../../lib/firewall/detectors/types';

const baseCtx: FirewallContext = {
  organizationId: 'org_test',
  userId: 'user_test',
  policy: { ...DEFAULT_POLICY, nerEnabled: false },
  requestId: 'req_test',
};

describe('detect — empty input', () => {
  it('returns empty array for empty text', async () => {
    const dets = await detect('', baseCtx);
    expect(dets).toEqual([]);
  });
});

describe('detect — single PII', () => {
  it('returns one detection for a single Saudi ID', async () => {
    const dets = await detect('العميل 1029482103', baseCtx);
    const ids = dets.filter((d) => d.type === 'SAUDI_ID');
    expect(ids).toHaveLength(1);
  });
});

describe('detect — multiple types', () => {
  it('finds SAUDI_ID, SAUDI_PHONE, SAUDI_IBAN, EMAIL in one prompt', async () => {
    const text = `
      هوية 1029482103
      جوال 0501234567
      حساب SA0380000000608010167519
      ايميل user@example.com
    `;
    const dets = await detect(text, baseCtx);
    const types = new Set(dets.map((d) => d.type));
    expect(types.has('SAUDI_ID')).toBe(true);
    expect(types.has('SAUDI_PHONE')).toBe(true);
    expect(types.has('SAUDI_IBAN')).toBe(true);
    expect(types.has('EMAIL')).toBe(true);
  });
});

describe('detect — sorted output', () => {
  it('returns detections sorted by start offset', async () => {
    const text = 'ibani SA0380000000608010167519 then id 1029482103';
    const dets = await detect(text, baseCtx);
    for (let i = 1; i < dets.length; i++) {
      expect(dets[i].start).toBeGreaterThanOrEqual(dets[i - 1].start);
    }
  });
});

describe('detectAndRedact', () => {
  it('returns full RedactionResult with redactedText and tokens', async () => {
    const text = 'config: db_password=hunter2';
    const result = await detectAndRedact(text, baseCtx);
    expect(result.redactedText).not.toContain('hunter2');
    expect(result.blocked).toBe(true); // CREDENTIAL has action=block
  });
});

describe('dedupeOverlap', () => {
  it('keeps the higher-confidence detection when two overlap', () => {
    const a: Detection = {
      type: 'SAUDI_ID',
      start: 0,
      end: 10,
      value: '1029482103',
      confidence: 0.9,
      detector: 'regex',
    };
    const b: Detection = {
      type: 'CARD_OR_ACCOUNT', // wider category
      start: 0,
      end: 10,
      value: '1029482103',
      confidence: 0.6,
      detector: 'regex',
    };
    const dedup = dedupeOverlap([a, b]);
    expect(dedup).toHaveLength(1);
    expect(dedup[0].confidence).toBe(0.9);
  });

  it('keeps non-overlapping detections intact', () => {
    const a: Detection = {
      type: 'SAUDI_ID',
      start: 0,
      end: 10,
      value: '1029482103',
      confidence: 0.9,
      detector: 'regex',
    };
    const b: Detection = {
      type: 'SAUDI_PHONE',
      start: 20,
      end: 30,
      value: '0501234567',
      confidence: 0.95,
      detector: 'regex',
    };
    const dedup = dedupeOverlap([a, b]);
    expect(dedup).toHaveLength(2);
  });
});

describe('hasHighRiskPII', () => {
  it('returns true for SAUDI_ID', () => {
    expect(
      hasHighRiskPII([
        { type: 'SAUDI_ID', start: 0, end: 10, value: '1029482103', confidence: 0.9, detector: 'regex' },
      ]),
    ).toBe(true);
  });

  it('returns false for email-only prompt', () => {
    expect(
      hasHighRiskPII([
        { type: 'EMAIL', start: 0, end: 15, value: 'a@b.co', confidence: 0.9, detector: 'regex' },
      ]),
    ).toBe(false);
  });
});
