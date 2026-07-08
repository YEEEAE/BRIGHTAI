/**
 * BrightAI AI Firewall — Layer 1 (PII Detection & Redaction)
 *
 * Unit tests for the redaction engine (4 actions).
 */

import { describe, it, expect } from 'vitest';
import { applyActions, isIdempotent } from '../../lib/firewall/engine/redaction';
import { regexDetect } from '../../lib/firewall/detectors/regex';
import { DEFAULT_POLICY, type PolicyConfig, type Detection } from '../../lib/firewall/detectors/types';

const text = 'اسمي محمد ورقمي 1029482103 وحسابي SA0380000000608010167519';

describe('applyActions — redact', () => {
  it('replaces detections with [REDACTED:TYPE]', () => {
    const dets = regexDetect(text);
    // Override the policy so SAUDI_ID and SAUDI_IBAN use redact.
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: {
        ...DEFAULT_POLICY.actions,
        SAUDI_ID: 'redact',
        SAUDI_IBAN: 'redact',
      },
    };
    const result = applyActions(text, dets, policy);
    expect(result.redactedText).toContain('[REDACTED:SAUDI_ID]');
    expect(result.redactedText).toContain('[REDACTED:SAUDI_IBAN]');
    expect(result.redactedText).not.toContain('1029482103');
    expect(result.redactedText).not.toContain('SA0380000000608010167519');
  });
});

describe('applyActions — mask', () => {
  it('replaces ID with 1********3 pattern (preserves head + tail)', () => {
    const dets = regexDetect('1029482103');
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: { ...DEFAULT_POLICY.actions, SAUDI_ID: 'mask' },
    };
    const result = applyActions('1029482103', dets, policy);
    expect(result.redactedText).toBe('1********3');
  });

  it('masks IBAN but keeps first and last char', () => {
    const dets = regexDetect('SA0380000000608010167519');
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: { ...DEFAULT_POLICY.actions, SAUDI_IBAN: 'mask' },
    };
    const result = applyActions('SA0380000000608010167519', dets, policy);
    // First char (S) + 22 stars + last char (9). Note: SA is reduced
    // to S under the current 1-char-preserve policy.
    expect(result.redactedText.startsWith('S')).toBe(true);
    expect(result.redactedText.endsWith('9')).toBe(true);
    expect(result.redactedText).toContain('*');
    expect(result.redactedText.length).toBe(24); // same length as input
  });
});

describe('applyActions — tokenize', () => {
  it('replaces with TKN_ token and stores mapping', () => {
    const dets = regexDetect('1029482103');
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: { ...DEFAULT_POLICY.actions, SAUDI_ID: 'tokenize' },
    };
    const result = applyActions('1029482103', dets, policy);
    expect(result.redactedText).toMatch(/^TKN_[A-Za-z0-9_-]{16}$/);
    const token = Object.keys(result.tokens)[0];
    expect(result.tokens[token]).toBe('1029482103');
  });
});

describe('applyActions — block', () => {
  it('returns blocked=true when CREDENTIAL detected', () => {
    const text = 'config: db_password=hunter2';
    const dets = regexDetect(text);
    const result = applyActions(text, dets, DEFAULT_POLICY);
    expect(result.blocked).toBe(true);
  });

  it('returns blocked=true when SAUDI_ID has block action', () => {
    const dets = regexDetect('1029482103');
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: { ...DEFAULT_POLICY.actions, SAUDI_ID: 'block' },
    };
    const result = applyActions('1029482103', dets, policy);
    expect(result.blocked).toBe(true);
  });

  it('does NOT mark blocked if blockOnCritical is false', () => {
    const dets = regexDetect('1029482103');
    const policy: PolicyConfig = {
      ...DEFAULT_POLICY,
      actions: { ...DEFAULT_POLICY.actions, SAUDI_ID: 'block' },
      blockOnCritical: false,
    };
    const result = applyActions('1029482103', dets, policy);
    expect(result.blocked).toBe(false);
  });
});

describe('applyActions — empty input', () => {
  it('handles empty text', () => {
    const result = applyActions('', [], DEFAULT_POLICY);
    expect(result.redactedText).toBe('');
    expect(result.detections).toHaveLength(0);
    expect(result.tokens).toEqual({});
    expect(result.blocked).toBe(false);
  });

  it('handles text with no detections', () => {
    const result = applyActions('plain text', [], DEFAULT_POLICY);
    expect(result.redactedText).toBe('plain text');
  });
});

describe('isIdempotent', () => {
  it('redacted output is stable when re-processed', () => {
    const dets = regexDetect('1029482103');
    const result = applyActions('1029482103', dets, DEFAULT_POLICY);
    expect(isIdempotent(result.redactedText, [], DEFAULT_POLICY)).toBe(true);
  });
});
