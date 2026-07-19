/**
 * @brightai/dashboard — PII scrubber tests (P0-3, 2026-07-19).
 *
 * Verifies the scrubber removes known PII patterns before any value
 * reaches Sentry or the structured logger. PDPL compliance: no raw
 * PII must leak to the observability pipeline.
 */

import { describe, expect, it } from 'vitest';
import { scrubValue, scrubError } from '@/lib/observability/pii-scrubber';

describe('scrubValue — string patterns', () => {
  it('redacts SA national IDs (10 digits starting with 1 or 2)', () => {
    expect(scrubValue('ID: 1234567890')).toBe('ID: [REDACTED]');
    expect(scrubValue('id=2345678901 done')).toBe('id=[REDACTED] done');
  });

  it('redacts SA IBANs (SA + 22 digits)', () => {
    expect(scrubValue('IBAN SA0380000000608010167519')).toBe('IBAN [REDACTED]');
  });

  it('redacts email addresses', () => {
    expect(scrubValue('contact me at user@example.com today')).toBe(
      'contact me at [REDACTED] today',
    );
  });

  it('redacts Saudi phone numbers (05x, +966, 00966)', () => {
    expect(scrubValue('call 0533333333 now')).toBe('call [REDACTED] now');
    expect(scrubValue('call +966533333333 now')).toBe('call [REDACTED] now');
    expect(scrubValue('call 009665333333333 now')).toBe('call [REDACTED] now');
  });

  it('redacts international phone numbers', () => {
    expect(scrubValue('whatsapp +14155551234')).toBe('whatsapp [REDACTED]');
  });

  it('redacts card-like numbers (13-19 digits)', () => {
    expect(scrubValue('card 4532 0151 1283 0366 exp 12/27')).toBe(
      'card [REDACTED] exp 12/27',
    );
  });

  it('redacts Bearer tokens', () => {
    expect(scrubValue('Authorization: Bearer abc123def456ghi789jkl012mno')).toBe(
      'Authorization: [REDACTED]',
    );
  });

  it('redacts known API key prefixes', () => {
    expect(scrubValue('sk_live_abc123def456ghi789')).toBe('[REDACTED]');
    expect(scrubValue('whsec_xyz789ghi456def123abc')).toBe('[REDACTED]');
  });

  it('redacts JWTs', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature123abc';
    expect(scrubValue(`token=${jwt}`)).toBe('token=[REDACTED]');
  });
});

describe('scrubValue — objects', () => {
  it('redacts known PII keys regardless of value', () => {
    expect(
      scrubValue({
        email: 'user@example.com',
        phone: '+966533333333',
        name: 'Ahmed',
        password: 'super-secret-123',
        api_key: 'sk_live_xyz',
        authorization: 'Bearer abc123def456ghi789jkl012mno',
        note: 'safe text',
      }),
    ).toEqual({
      email: '[REDACTED]',
      phone: '[REDACTED]',
      name: 'Ahmed', // 'name' is NOT in the PII_KEYS list (we don't want to over-redact)
      password: '[REDACTED]',
      api_key: '[REDACTED]',
      authorization: '[REDACTED]',
      note: 'safe text',
    });
  });

  it('recursively scrubs nested objects', () => {
    const input = {
      user: { id: 'u_1', email: 'a@b.com' },
      audit: { ip: '1.2.3.4', requestId: 'r_1' }, // requestId is safe
    };
    const out = scrubValue(input) as any;
    expect(out.user.id).toBe('u_1');
    expect(out.user.email).toBe('[REDACTED]');
    expect(out.audit.requestId).toBe('r_1');
  });

  it('recursively scrubs arrays', () => {
    const input = {
      items: [
        { email: 'a@b.com' },
        { email: 'c@d.com' },
      ],
    };
    const out = scrubValue(input) as any;
    expect(out.items[0].email).toBe('[REDACTED]');
    expect(out.items[1].email).toBe('[REDACTED]');
  });

  it('handles null and undefined', () => {
    expect(scrubValue(null)).toBe(null);
    expect(scrubValue(undefined)).toBe(undefined);
  });

  it('handles primitives', () => {
    expect(scrubValue(42)).toBe(42);
    expect(scrubValue(true)).toBe(true);
    expect(scrubValue('plain text')).toBe('plain text');
  });
});

describe('scrubError', () => {
  it('preserves type, message, and stack but scrubs content', () => {
    const err = new Error('User email: ahmed@example.com failed');
    const scrubbed = scrubError(err) as any;
    expect(scrubbed.name).toBe('Error');
    expect(scrubbed.message).toBe('User email: [REDACTED] failed');
    expect(scrubbed.stack).toBeDefined();
    expect(scrubbed.stack).toContain('[REDACTED]');
  });

  it('handles errors with cause chains', () => {
    const inner = new Error('inner: ahmed@example.com');
    const outer = new Error('outer') as Error & { cause: unknown };
    outer.cause = inner;
    const scrubbed = scrubError(outer) as any;
    expect(scrubbed.message).toBe('outer');
    expect(scrubbed.cause.message).toBe('inner: [REDACTED]');
  });
});
