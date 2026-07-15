/**
 * BrightAI AI Firewall — BAI-003 integration tests.
 *
 * Full-surface tests for the firewall engine: detectAndRedact,
 * per-type policies, high-risk short-circuit, idempotency, and the
 * NER-injection path (without loading the real model).
 *
 * These exercise the dashboard barrel so they cover both the
 * @brightai/firewall-detectors engine and the dashboard wiring
 * (setNerDetector). NER is mocked to avoid the 278 MB model
 * download in CI.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';

// Set NER enabled so detect() would call the NER detector — we mock
// the detector below to a lightweight stub (no model download).
process.env.FIREWALL_NER_ENABLED = 'true';

// Mock the dashboard NER detector module so detect() can merge NER
// hits without downloading the ONNX model.
vi.mock('../../lib/firewall/detectors/ner', () => {
  const fakeNer = {
    nerDetect: async (text: string) => {
      // Stub: detect the literal word "محمد" as a PERSON_NAME hit.
      const idx = text.indexOf('محمد');
      if (idx === -1) return [];
      return [
        {
          type: 'PERSON_NAME',
          start: idx,
          end: idx + 4,
          value: 'محمد',
          confidence: 0.85,
          detector: 'ner',
        },
      ];
    },
    isNerReady: () => true,
    NER_MODEL_ID: 'stub-model',
  };
  return fakeNer;
});

let detectAndRedact: typeof import('@brightai/firewall-detectors').detectAndRedact;
let detect: typeof import('@brightai/firewall-detectors').detect;
let hasHighRiskPII: typeof import('@brightai/firewall-detectors').hasHighRiskPII;
let applyActions: typeof import('@brightai/firewall-detectors').applyActions;
let isIdempotent: typeof import('@brightai/firewall-detectors').isIdempotent;
let DEFAULT_POLICY: typeof import('@brightai/firewall-detectors').DEFAULT_POLICY;
let setNerDetector: typeof import('@brightai/firewall-detectors').setNerDetector;

beforeAll(async () => {
  // Import the dashboard barrel so setNerDetector is called with the
  // (mocked) nerDetect at module load.
  const barrel = await import('../../lib/firewall');
  const pkg = await import('@brightai/firewall-detectors');
  detectAndRedact = pkg.detectAndRedact;
  detect = pkg.detect;
  hasHighRiskPII = pkg.hasHighRiskPII;
  applyActions = pkg.applyActions;
  isIdempotent = pkg.isIdempotent;
  DEFAULT_POLICY = pkg.DEFAULT_POLICY;
  setNerDetector = pkg.setNerDetector;
  // Ensure the mocked NER is wired (the barrel already did this at
  // load, but we re-assert so the test is deterministic).
  setNerDetector(
    (await import('../../lib/firewall/detectors/ner')).nerDetect,
  );
});

function ctx(policy = DEFAULT_POLICY, orgId = 'org_it', requestId = 'req_it_1') {
  return { organizationId: orgId, userId: 'user_it', policy, requestId };
}

describe('detectAndRedact — Saudi PII', () => {
  it('masks a Saudi national ID (starts with 1/2, 10 digits)', async () => {
    const res = await detectAndRedact('رقم هويتي 1023456789 مهم', ctx());
    expect(res.detections.some((d) => d.type === 'SAUDI_ID')).toBe(true);
    expect(res.redactedText).toContain('1********9');
    expect(res.redactedText).not.toContain('1023456789');
  });

  it('masks a Saudi IBAN', async () => {
    const iban = 'SA0380000000608010167519';
    const res = await detectAndRedact(`حوّل المبلغ لـ ${iban}`, ctx());
    expect(res.detections.some((d) => d.type === 'SAUDI_IBAN')).toBe(true);
    expect(res.redactedText).not.toContain(iban);
  });

  it('masks a Saudi phone number', async () => {
    const res = await detectAndRedact('اتصل على 0512345678', ctx());
    expect(res.detections.some((d) => d.type === 'SAUDI_PHONE')).toBe(true);
    expect(res.redactedText).not.toContain('0512345678');
  });

  it('masks an email address', async () => {
    const res = await detectAndRedact('راسلني على ahmed@example.com', ctx());
    expect(res.detections.some((d) => d.type === 'EMAIL')).toBe(true);
    expect(res.redactedText).not.toContain('ahmed@example.com');
  });

  it('returns empty detections for clean text', async () => {
    const res = await detectAndRedact('كيف أحدّث سياسة الحوكمة في المؤسسة؟', ctx());
    expect(res.detections).toHaveLength(0);
    expect(res.redactedText).toBe('كيف أحدّث سياسة الحوكمة في المؤسسة؟');
  });
});

describe('detectAndRedact — credential blocking', () => {
  it('blocks on CREDENTIAL leak (policy action=block)', async () => {
    const res = await detectAndRedact('password=SuperSecret123', ctx());
    expect(res.detections.some((d) => d.type === 'CREDENTIAL')).toBe(true);
    expect(res.blocked).toBe(true);
    expect(res.redactedText).toContain('[BLOCKED:CREDENTIAL]');
  });

  it('does NOT block when blockOnCritical is false', async () => {
    const policy = { ...DEFAULT_POLICY, blockOnCritical: false };
    const res = await detectAndRedact('api_key=sk_live_abc123', ctx(policy));
    expect(res.blocked).toBe(false);
  });

  it('hasHighRiskPII true for CREDENTIAL / SAUDI_ID', async () => {
    const res = await detectAndRedact('password=hunter2', ctx());
    expect(hasHighRiskPII(res.detections)).toBe(true);
  });

  it('hasHighRiskPII false for benign text', async () => {
    const res = await detectAndRedact('السلام عليكم ورحمة الله', ctx());
    expect(hasHighRiskPII(res.detections)).toBe(false);
  });
});

describe('detect — NER injection', () => {
  it('merges regex + NER detections when nerEnabled', async () => {
    const policy = { ...DEFAULT_POLICY, nerEnabled: true };
    const res = await detect('مرحبا أنا محمد ولدي بطاقة 1023456789', ctx(policy));
    const types = res.map((d) => d.type);
    expect(types).toContain('PERSON_NAME');
    expect(types).toContain('SAUDI_ID');
  });

  it('does NOT call NER when nerEnabled is false', async () => {
    const policy = { ...DEFAULT_POLICY, nerEnabled: false };
    const res = await detect('أنا محمد', ctx(policy));
    expect(res.some((d) => d.type === 'PERSON_NAME')).toBe(false);
  });
});

describe('redaction idempotency', () => {
  it('applyActions is idempotent (re-running on output is a no-op)', async () => {
    const dets = await detect('هويتي 1023456789', ctx());
    expect(isIdempotent('هويتي 1023456789', dets, DEFAULT_POLICY)).toBe(true);
  });

  it('applyActions keeps masked text stable across runs', async () => {
    const dets = await detect('هويتي 1023456789', ctx());
    const first = applyActions('هويتي 1023456789', dets, DEFAULT_POLICY);
    const second = applyActions(first.redactedText, [], DEFAULT_POLICY);
    expect(first.redactedText).toBe(second.redactedText);
  });
});