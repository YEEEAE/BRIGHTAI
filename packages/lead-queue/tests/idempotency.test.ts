/**
 * idempotency.test.ts — Idempotency-Key helpers (unit, no DB).
 */

import { describe, it, expect } from 'vitest';
import {
  MAX_IDEMPOTENCY_KEY_LEN,
  normaliseClientKey,
  resolveIdempotencyKey,
  syntheticKey,
} from '../src/idempotency';
import { SYNTHETIC_KEY_WINDOW_SECONDS } from '../src/types';

describe('normaliseClientKey', () => {
  it('returns trimmed key on simple ASCII input', () => {
    expect(normaliseClientKey('  abc-123  ')).toBe('abc-123');
  });

  it('returns null on empty / whitespace-only input', () => {
    expect(normaliseClientKey('')).toBeNull();
    expect(normaliseClientKey('   ')).toBeNull();
    expect(normaliseClientKey(null)).toBeNull();
    expect(normaliseClientKey(undefined)).toBeNull();
  });

  it('returns null on inputs longer than MAX_IDEMPOTENCY_KEY_LEN', () => {
    const tooLong = 'x'.repeat(MAX_IDEMPOTENCY_KEY_LEN + 1);
    expect(normaliseClientKey(tooLong)).toBeNull();
  });

  it('rejects control characters but allows printable ASCII', () => {
    expect(normaliseClientKey('valid_key-123')).toBe('valid_key-123');
    expect(normaliseClientKey('with space ok')).toBe('with space ok');
    expect(normaliseClientKey('bad\x00null')).toBeNull();
    expect(normaliseClientKey('bad\x07ctrl')).toBeNull();
  });
});

describe('syntheticKey', () => {
  it('is a 64-char lowercase hex string', () => {
    const key = syntheticKey({
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
      nowMs: 1_700_000_000_000,
    });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic for the same input within the same bucket', () => {
    const base = {
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
    };
    // Both timestamps must live inside the same 30-second bucket so
    // the synthetic key matches.
    const a = syntheticKey({ ...base, nowMs: 1_699_999_990_000 });
    const b = syntheticKey({ ...base, nowMs: 1_700_000_005_000 });
    expect(a).toBe(b);
  });

  it('changes across buckets (different seconds)', () => {
    const base = {
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
    };
    // Two consecutive bucket boundaries — definitely different buckets.
    const a = syntheticKey({ ...base, nowMs: 1_699_999_980_000 });
    const bucketMs = SYNTHETIC_KEY_WINDOW_SECONDS * 1000;
    const b = syntheticKey({ ...base, nowMs: 1_699_999_980_000 + bucketMs + 1 });
    expect(a).not.toBe(b);
  });

  it('changes when any input changes', () => {
    const a = syntheticKey({
      ip: '10.0.0.42', userAgent: 'test', contact: '+966538229013', nowMs: 1_700_000_000_000,
    });
    const diffIp = syntheticKey({
      ip: '10.0.0.43', userAgent: 'test', contact: '+966538229013', nowMs: 1_700_000_000_000,
    });
    const diffUa = syntheticKey({
      ip: '10.0.0.42', userAgent: 'other', contact: '+966538229013', nowMs: 1_700_000_000_000,
    });
    const diffContact = syntheticKey({
      ip: '10.0.0.42', userAgent: 'test', contact: 'fatima@test.sa', nowMs: 1_700_000_000_000,
    });
    expect(diffIp).not.toBe(a);
    expect(diffUa).not.toBe(a);
    expect(diffContact).not.toBe(a);
  });
});

describe('resolveIdempotencyKey', () => {
  it('uses client-provided key when well-formed', () => {
    const r = resolveIdempotencyKey({
      headerValue: 'my-idempotency-key-001',
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
    });
    expect(r.source).toBe('client');
    expect(r.value).toBe('my-idempotency-key-001');
  });

  it('falls back to synthetic when header is missing', () => {
    const r = resolveIdempotencyKey({
      headerValue: undefined,
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
    });
    expect(r.source).toBe('synthetic');
    expect(r.value).toMatch(/^[0-9a-f]{64}$/);
  });

  it('falls back to synthetic when header is malformed', () => {
    const r = resolveIdempotencyKey({
      headerValue: '', // empty → falls through
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
    });
    expect(r.source).toBe('synthetic');
  });

  it('matches synthetic for the same input in the same bucket', () => {
    const r1 = resolveIdempotencyKey({
      headerValue: undefined,
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
      nowMs: 1_699_999_990_000,
    });
    const r2 = resolveIdempotencyKey({
      headerValue: undefined,
      ip: '10.0.0.42',
      userAgent: 'test',
      contact: '+966538229013',
      nowMs: 1_700_000_005_000, // same 30s window
    });
    expect(r1.value).toBe(r2.value);
  });
});
