/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Streaming redaction boundary tests.
 *
 * Acceptance criteria (HIGH-02):
 *   - PII split across 2-5 chunks → reconstructed stream matches the
 *     expected redacted output for the whole text.
 *   - Arabic names split mid-word are redacted.
 *   - Credit card numbers split mid-digit are redacted.
 *   - Saudi / Iqama IDs split are redacted.
 *   - UTF-8 boundaries (surrogate pairs, e.g. emoji) are not split.
 *
 * Strategy: feed the streaming-redaction engine an Array<string> of
 * simulated LLM chunks and assert the reconstructed output equals the
 * result of running detect+apply on the full text directly.
 */

import { describe, it, expect } from 'vitest';
import { redactStream, redactStreamGenerator } from '../../lib/firewall/engine/streaming-redaction';
import { regexDetect } from '../../lib/firewall/detectors/regex';
import { applyActions } from '../../lib/firewall/engine/redaction';
import { DEFAULT_POLICY, type FirewallContext, type Detection, type PolicyConfig } from '../../lib/firewall/detectors/types';

const ctx: FirewallContext = {
  organizationId: 'org-test',
  userId: 'user-test',
  policy: DEFAULT_POLICY,
  requestId: 'req-test',
};

// Use the real regexDetect so the streaming engine gets the same
// detections the non-streaming path uses. This guarantees the cross-chunk
// case produces the same redacted output as the single-shot case.
const detectFn = async (text: string): Promise<Detection[]> => regexDetect(text);

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Compute the redacted output for a single (non-streamed) input. */
function redactOnce(text: string, policy: PolicyConfig = DEFAULT_POLICY) {
  const dets = regexDetect(text);
  return applyActions(text, dets, policy).redactedText;
}

/** Split a string into N roughly-equal chunks. */
function splitChunks(text: string, n: number): string[] {
  if (n <= 1) return [text];
  const out: string[] = [];
  const len = text.length;
  const base = Math.floor(len / n);
  let i = 0;
  for (let k = 0; k < n - 1; k++) {
    const size = base;
    out.push(text.slice(i, i + size));
    i += size;
  }
  out.push(text.slice(i));
  return out;
}

// ─────────────────────────────────────────────────────────────────
// Streaming redaction: PII split across chunks
// ─────────────────────────────────────────────────────────────────

describe('redactStream — Saudi ID split across chunks', () => {
  it('redacts a 10-digit ID split across 2 chunks', async () => {
    const text = 'My national ID is 1029482103 and my name is Sara.';
    const chunks = splitChunks(text, 2);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.failed).toBe(false);
    expect(result.redacted).toBe(redactOnce(text));
    // The reconstructed output must NOT contain the raw ID.
    expect(result.redacted).not.toContain('1029482103');
    // It must contain the masked form.
    expect(result.redacted).toContain('1********3');
  });

  it('redacts a 10-digit ID split across 3 chunks', async () => {
    const text = 'ID 1029482103 confirmed.';
    const chunks = splitChunks(text, 3);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('1029482103');
  });

  it('redacts a 10-digit ID split across 5 chunks', async () => {
    const text = 'اسمي سارة ورقمي الوطني 1029482103 ونهاية السطر.';
    const chunks = splitChunks(text, 5);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('1029482103');
  });

  it('redacts an IQAMA number split across 4 chunks', async () => {
    const text = 'Iqama: 2345678901 expires soon.';
    const chunks = splitChunks(text, 4);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('2345678901');
  });
});

describe('redactStream — Saudi phone split across chunks', () => {
  it('redacts a phone number split across 2 chunks', async () => {
    const text = 'اتصل على +966501234567 للإجابة على السؤال.';
    const chunks = splitChunks(text, 2);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('+966501234567');
    expect(result.redacted).not.toContain('501234567');
  });

  it('redacts a phone number split across 3 chunks', async () => {
    const text = 'Call 0501234567 for support.';
    const chunks = splitChunks(text, 3);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('0501234567');
  });
});

describe('redactStream — IBAN + Card split across chunks', () => {
  it('redacts an IBAN split across 3 chunks', async () => {
    const text = 'حوّل المبلغ إلى SA0380000000608010167519 قبل نهاية الأسبوع.';
    const chunks = splitChunks(text, 3);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('SA0380000000608010167519');
  });

  it('redacts a credit card split mid-digit across 3 chunks', async () => {
    const text = 'Card: 4111 1111 1111 1111 confirmed.';
    const chunks = splitChunks(text, 3);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('4111 1111 1111 1111');
    expect(result.redacted).not.toContain('4111111111111111');
  });

  it('redacts a credit card split mid-digit across 4 chunks', async () => {
    const text = 'Use card 5500 0000 0000 0004 for payment.';
    const chunks = splitChunks(text, 4);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('5500 0000 0000 0004');
  });
});

describe('redactStream — multiple PII in same stream', () => {
  it('redacts 2 IDs + 1 phone across 4 chunks', async () => {
    const text = 'Sara ID 1029482103 and Khalid ID 2345678901 called +966501234567 today.';
    const chunks = splitChunks(text, 4);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).not.toContain('1029482103');
    expect(result.redacted).not.toContain('2345678901');
    expect(result.redacted).not.toContain('501234567');
  });

  it('redacts PII + preserves plain text around it', async () => {
    const text = 'before 1029482103 middle +966501234567 after';
    const chunks = splitChunks(text, 5);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    // Plain text passes through.
    expect(result.redacted).toContain('before');
    expect(result.redacted).toContain('middle');
    expect(result.redacted).toContain('after');
  });
});

describe('redactStream — UTF-16 / surrogate-pair boundaries', () => {
  it('does not split emoji (surrogate pair) at the boundary', async () => {
    // Buffer will land mid-emoji at safeRawEnd if we're not careful.
    const emoji = '🔑'; // U+1F511 = surrogate pair (D83D DD11)
    const text = `${emoji} 1029482103 ${emoji}`;
    const chunks = splitChunks(text, 2);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    // No U+FFFD replacement chars (means we never split a surrogate pair).
    expect(result.redacted).not.toContain('�');
    expect(result.redacted).not.toContain('1029482103');
  });

  it('does not split emoji in 5-chunk split', async () => {
    const text = '🔑🔒 My key 1029482103 here 🔓🔑 end';
    const chunks = splitChunks(text, 5);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).not.toContain('�');
    expect(result.redacted).not.toContain('1029482103');
  });
});

describe('redactStream — no PII, no regression', () => {
  it('passes plain Arabic text through unchanged', async () => {
    const text = 'السلام عليكم ورحمة الله وبركاته، اليوم يوم جميل.';
    const chunks = splitChunks(text, 3);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
    expect(result.redacted).toBe(text);
  });

  it('passes plain English text through unchanged', async () => {
    const text = 'The quick brown fox jumps over the lazy dog. Repeat: lazy dog.';
    const chunks = splitChunks(text, 4);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(text);
  });

  it('handles a single-chunk stream', async () => {
    const text = 'ID is 1029482103.';
    const result = await redactStream([text], { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.redacted).toBe(redactOnce(text));
  });
});

describe('redactStream — closed failure on detection errors', () => {
  it('returns failed=true when detect throws', async () => {
    const failingDetect = async (): Promise<Detection[]> => {
      throw new Error('ner_unreachable');
    };
    const chunks = ['hello 1029482103', ' world'];
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: failingDetect });
    expect(result.failed).toBe(true);
    expect(result.error).toBe('ner_unreachable');
  });

  it('returns failed=true on first chunk error (before any commit)', async () => {
    let calls = 0;
    const detect = async (): Promise<Detection[]> => {
      calls++;
      throw new Error('boom');
    };
    const chunks = ['abc 102', '948', '2103'];
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect });
    expect(result.failed).toBe(true);
    expect(calls).toBeGreaterThanOrEqual(1);
  });
});

describe('redactStream — type tracking', () => {
  it('tracks unique PII types across chunks', async () => {
    const text = 'ID 1029482103 phone +966501234567 IBAN SA0380000000608010167519.';
    const chunks = splitChunks(text, 4);
    const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
    expect(result.types).toContain('SAUDI_ID');
    expect(result.types).toContain('SAUDI_PHONE');
    expect(result.types).toContain('SAUDI_IBAN');
    // Should be sorted.
    const sorted = [...result.types].sort();
    expect(result.types).toEqual(sorted);
  });
});

describe('redactStreamGenerator — yields deltas incrementally', () => {
  it('yields one delta per flush plus a final delta', async () => {
    const text = ('a'.repeat(300)) + ' 1029482103 ' + ('b'.repeat(300));
    async function* chunks() {
      // Simulate chunked LLM output: small pieces.
      for (let i = 0; i < text.length; i += 30) {
        yield text.slice(i, i + 30);
      }
    }
    const deltas: string[] = [];
    let lastSeen = false;
    for await (const ev of redactStreamGenerator(chunks(), { policy: DEFAULT_POLICY, ctx, detect: detectFn })) {
      if (ev.delta) deltas.push(ev.delta);
      if (ev.isLast) lastSeen = true;
    }
    expect(lastSeen).toBe(true);
    expect(deltas.join('')).toBe(redactOnce(text));
    expect(deltas.join('')).not.toContain('1029482103');
  });

  it('signals failed=true on detection error', async () => {
    const failingDetect = async (): Promise<Detection[]> => {
      throw new Error('detect_failed');
    };
    async function* chunks() {
      yield 'hello';
    }
    let sawFailed = false;
    for await (const ev of redactStreamGenerator(chunks(), { policy: DEFAULT_POLICY, ctx, detect: failingDetect })) {
      if (ev.failed) sawFailed = true;
    }
    expect(sawFailed).toBe(true);
  });
});

describe('redactStream — reconstructed output equals single-shot output', () => {
  // Acceptance criterion from brief: "response reconstructed يطابق
  // redacted expected output". This is the strongest property test.
  const SAMPLES: Array<{ name: string; text: string }> = [
    { name: 'simple ID', text: 'My ID is 1029482103.' },
    { name: 'ID + Arabic name', text: 'اسمي سارة ورقمي 1029482103' },
    { name: 'phone only', text: 'اتصل على +966501234567' },
    { name: 'IBAN only', text: 'SA0380000000608010167519' },
    { name: 'multi PII', text: 'ID 1029482103 phone +966501234567 IBAN SA0380000000608010167519' },
    { name: 'card', text: 'Card 4111 1111 1111 1111 here' },
    { name: 'plain text', text: 'The quick brown fox jumps over the lazy dog.' },
    { name: 'Arabic plain', text: 'السلام عليكم ورحمة الله وبركاته' },
  ];
  for (const sample of SAMPLES) {
    for (const n of [2, 3, 4, 5]) {
      it(`matches single-shot for: ${sample.name} split into ${n} chunks`, async () => {
        const chunks = splitChunks(sample.text, n);
        const result = await redactStream(chunks, { policy: DEFAULT_POLICY, ctx, detect: detectFn });
        expect(result.failed).toBe(false);
        expect(result.redacted).toBe(redactOnce(sample.text));
      });
    }
  }
});