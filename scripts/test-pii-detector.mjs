/**
 * scripts/test-pii-detector.mjs — K3-DRY (2026-08-04)
 *
 * Test suite لـ src/client/pii-detector.ts (shared client-side PII library).
 *
 * Usage:
 *   node --import ./scripts/test-ts-loader.mjs --experimental-strip-types \
 *        --test scripts/test-pii-detector.mjs
 *
 * Acceptance criteria (من K3-DRY task):
 *   1. detectPII يكتشف كل الـ 5 أنواع (SAUDI_ID, SAUDI_PHONE, SAUDI_IBAN, EMAIL, CREDIT_CARD)
 *   2. redactPII يعوّض كل finding بـ [TYPE] placeholder
 *   3. Deterministic: نفس الـ input → نفس الـ output دائمًا
 *   4. Dedup: overlapping findings → highest confidence wins
 *   5. False-positive guards: أرقام قصيرة ما تطلع SAUDI_ID
 *   6. Luhn filter: credit card numbers تفشل الـ Luhn check ما تطلع
 *   7. Empty input → empty output
 *   8. Arabic + English mix مدعوم
 */

import assert from "node:assert/strict";
import test, { before } from "node:test";

let detectPII;
let redactPII;
let dedupeFindings;
let hasPII;
let countByType;
let PII_DETECTOR_VERSION;

before(async () => {
  const mod = await import("../src/client/pii-detector.ts");
  detectPII = mod.detectPII;
  redactPII = mod.redactPII;
  dedupeFindings = mod.dedupeFindings;
  hasPII = mod.hasPII;
  countByType = mod.countByType;
  PII_DETECTOR_VERSION = mod.PII_DETECTOR_VERSION;
});

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function typesOf(findings) {
  return findings.map((f) => f.type).sort();
}

// ─────────────────────────────────────────────────────────────────────────
// 1. detectPII — Saudi National ID
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects SAUDI_ID (10 digits, leading 1)", () => {
  const text = "My ID is 1234567890";
  const f = detectPII(text);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_ID");
  assert.equal(f[0].value, "1234567890");
  assert.equal(f[0].start, text.indexOf("1234567890"));
  assert.equal(f[0].end, f[0].start + 10);
  assert.ok(f[0].confidence >= 0.9, "confidence should be >= 0.9");
});

test("detectPII: detects SAUDI_ID (10 digits, leading 2)", () => {
  const f = detectPII("ID: 2123456789");
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_ID");
  assert.equal(f[0].value, "2123456789");
});

test("detectPII: does NOT match 9-digit numbers as SAUDI_ID", () => {
  const f = detectPII("Short: 123456789");
  assert.equal(f.length, 0, "9-digit number should not match SAUDI_ID");
});

test("detectPII: does NOT match SAUDI_ID inside a longer number", () => {
  const f = detectPII("Card: 1234567890123");
  const saudiIds = f.filter((x) => x.type === "SAUDI_ID");
  assert.equal(saudiIds.length, 0, "should not extract SAUDI_ID from 13-digit number");
});

// ─────────────────────────────────────────────────────────────────────────
// 2. detectPII — Saudi Phone
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects SAUDI_PHONE (local format 05XXXXXXXX)", () => {
  const text = "Call 0501234567";
  const f = detectPII(text);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_PHONE");
  assert.equal(f[0].value, "0501234567");
});

test("detectPII: detects SAUDI_PHONE (international +966)", () => {
  const text = "Call +966501234567";
  const f = detectPII(text);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_PHONE");
  assert.ok(f[0].value.includes("966"), "should include country code");
});

test("detectPII: detects SAUDI_PHONE (international with dashes)", () => {
  const f = detectPII("Call +966-50-123-4567");
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_PHONE");
});

// ─────────────────────────────────────────────────────────────────────────
// 3. detectPII — Saudi IBAN
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects SAUDI_IBAN", () => {
  const text = "IBAN: SA0380000000608010167519";
  const f = detectPII(text);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "SAUDI_IBAN");
  assert.equal(f[0].value, "SA0380000000608010167519");
  assert.ok(f[0].confidence >= 0.99, "IBAN confidence should be 0.99");
});

test("detectPII: does NOT match non-SA IBAN", () => {
  const f = detectPII("IBAN: GB29NWBK60161331926819");
  const ibans = f.filter((x) => x.type === "SAUDI_IBAN");
  assert.equal(ibans.length, 0, "non-SA IBAN should not match SAUDI_IBAN");
});

// ─────────────────────────────────────────────────────────────────────────
// 4. detectPII — Email
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects EMAIL", () => {
  const text = "Contact: user@example.com";
  const f = detectPII(text);
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "EMAIL");
  assert.equal(f[0].value, "user@example.com");
});

test("detectPII: detects EMAIL with +alias", () => {
  const f = detectPII("Email: test+alias@gmail.com");
  assert.equal(f.length, 1);
  assert.equal(f[0].type, "EMAIL");
  assert.equal(f[0].value, "test+alias@gmail.com");
});

// ─────────────────────────────────────────────────────────────────────────
// 5. detectPII — Credit Card (with Luhn check)
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects valid CREDIT_CARD (passes Luhn)", () => {
  // 4242 4242 4242 4242 — Stripe test card, passes Luhn
  const text = "Card: 4242424242424242";
  const f = detectPII(text);
  const cards = f.filter((x) => x.type === "CREDIT_CARD");
  assert.ok(cards.length >= 1, "should detect valid credit card");
  assert.equal(cards[0].value.replace(/[\s-]/g, ""), "4242424242424242");
});

test("detectPII: does NOT detect invalid CREDIT_CARD (fails Luhn)", () => {
  // 13 digits but fails Luhn check
  const text = "Card: 1234567890123";
  const f = detectPII(text);
  const cards = f.filter((x) => x.type === "CREDIT_CARD");
  assert.equal(cards.length, 0, "invalid Luhn should not match CREDIT_CARD");
});

// ─────────────────────────────────────────────────────────────────────────
// 6. detectPII — Multiple findings + sorting
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: detects multiple PII types in one text", () => {
  const text = "ID 1234567890, email test@example.com, phone 0501234567";
  const f = detectPII(text);
  assert.ok(f.length >= 3, "should detect at least 3 PII entities");
  const types = typesOf(f);
  assert.ok(types.includes("SAUDI_ID"));
  assert.ok(types.includes("EMAIL"));
  assert.ok(types.includes("SAUDI_PHONE"));
});

test("detectPII: findings are sorted by start offset", () => {
  const text = "ID 1234567890 and email test@example.com and IBAN SA0380000000608010167519";
  const f = detectPII(text);
  for (let i = 1; i < f.length; i++) {
    assert.ok(f[i].start >= f[i - 1].start, "findings should be sorted by start");
  }
});

// ─────────────────────────────────────────────────────────────────────────
// 7. detectPII — Edge cases
// ─────────────────────────────────────────────────────────────────────────

test("detectPII: empty string returns empty array", () => {
  assert.deepEqual(detectPII(""), []);
});

test("detectPII: null/undefined returns empty array", () => {
  assert.deepEqual(detectPII(null), []);
  assert.deepEqual(detectPII(undefined), []);
});

test("detectPII: no PII in plain text", () => {
  const f = detectPII("This is a normal message with no sensitive data.");
  assert.equal(f.length, 0);
});

test("detectPII: Arabic text with no PII", () => {
  const f = detectPII("هذا نص عادي بدون أي بيانات حساسة.");
  assert.equal(f.length, 0);
});

test("detectPII: Arabic + English mix with PII", () => {
  const text = "رقمي 1234567890 and email me@test.com";
  const f = detectPII(text);
  assert.ok(f.length >= 2, "should detect PII in mixed Arabic/English text");
});

// ─────────────────────────────────────────────────────────────────────────
// 8. redactPII
// ─────────────────────────────────────────────────────────────────────────

test("redactPII: replaces SAUDI_ID with [SAUDI_ID]", () => {
  const text = "My ID is 1234567890";
  const findings = detectPII(text);
  const redacted = redactPII(text, findings);
  assert.equal(redacted, "My ID is [SAUDI_ID]");
});

test("redactPII: replaces multiple PII types", () => {
  const text = "ID 1234567890 email test@example.com";
  const findings = detectPII(text);
  const redacted = redactPII(text, findings);
  assert.ok(redacted.includes("[SAUDI_ID]"));
  assert.ok(redacted.includes("[EMAIL]"));
  assert.ok(!redacted.includes("1234567890"));
  assert.ok(!redacted.includes("test@example.com"));
});

test("redactPII: no findings returns original text", () => {
  const text = "No PII here";
  const findings = detectPII(text);
  const redacted = redactPII(text, findings);
  assert.equal(redacted, text);
});

test("redactPII: empty findings array returns original text", () => {
  const text = "Some text";
  assert.equal(redactPII(text, []), text);
});

test("redactPII: handles non-overlapping findings correctly (no offset drift)", () => {
  // redactPII is designed for non-overlapping findings (detectPII already
  // dedupes overlaps). This test verifies the sort-DESC splice logic works
  // correctly when multiple findings are present.
  const text = "ID:1234567890 EMAIL:test@example.com";
  const findings = [
    { type: "EMAIL", start: 20, end: 36, value: "test@example.com", confidence: 0.98 },
    { type: "SAUDI_ID", start: 3, end: 13, value: "1234567890", confidence: 0.92 },
  ];
  const redacted = redactPII(text, findings);
  assert.equal(redacted, "ID:[SAUDI_ID] EMAIL:[EMAIL]");
});

// ─────────────────────────────────────────────────────────────────────────
// 9. dedupeFindings
// ─────────────────────────────────────────────────────────────────────────

test("dedupeFindings: empty array returns empty", () => {
  assert.deepEqual(dedupeFindings([]), []);
});

test("dedupeFindings: single finding returns as-is", () => {
  const f = [{ type: "EMAIL", start: 0, end: 5, value: "test@", confidence: 0.9 }];
  assert.deepEqual(dedupeFindings(f), f);
});

test("dedupeFindings: overlapping → highest confidence wins", () => {
  const findings = [
    { type: "SAUDI_ID", start: 0, end: 10, value: "1234567890", confidence: 0.92 },
    { type: "CREDIT_CARD", start: 0, end: 10, value: "1234567890", confidence: 0.78 },
  ];
  const deduped = dedupeFindings(findings);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].type, "SAUDI_ID", "higher confidence should win");
});

test("dedupeFindings: non-overlapping → both kept", () => {
  const findings = [
    { type: "SAUDI_ID", start: 0, end: 10, value: "1234567890", confidence: 0.92 },
    { type: "EMAIL", start: 20, end: 30, value: "test@", confidence: 0.98 },
  ];
  const deduped = dedupeFindings(findings);
  assert.equal(deduped.length, 2);
});

test("dedupeFindings: result is sorted by start", () => {
  const findings = [
    { type: "EMAIL", start: 20, end: 30, value: "test@", confidence: 0.98 },
    { type: "SAUDI_ID", start: 0, end: 10, value: "1234567890", confidence: 0.92 },
  ];
  const deduped = dedupeFindings(findings);
  assert.equal(deduped[0].start, 0);
  assert.equal(deduped[1].start, 20);
});

// ─────────────────────────────────────────────────────────────────────────
// 10. hasPII
// ─────────────────────────────────────────────────────────────────────────

test("hasPII: returns true for text with PII", () => {
  assert.equal(hasPII("ID 1234567890"), true);
});

test("hasPII: returns false for plain text", () => {
  assert.equal(hasPII("No sensitive data here"), false);
});

test("hasPII: returns false for empty string", () => {
  assert.equal(hasPII(""), false);
});

// ─────────────────────────────────────────────────────────────────────────
// 11. countByType
// ─────────────────────────────────────────────────────────────────────────

test("countByType: counts each type correctly", () => {
  const text = "ID 1234567890 and 2123456789, email test@example.com, phone 0501234567";
  const f = detectPII(text);
  const counts = countByType(f);
  assert.ok(counts.SAUDI_ID >= 2, "should count 2+ SAUDI_IDs");
  assert.ok(counts.EMAIL >= 1, "should count 1+ EMAIL");
  assert.ok(counts.SAUDI_PHONE >= 1, "should count 1+ SAUDI_PHONE");
  assert.equal(counts.SAUDI_IBAN, 0);
  assert.equal(counts.CREDIT_CARD, 0);
});

test("countByType: empty findings → all zeros", () => {
  const counts = countByType([]);
  assert.equal(counts.SAUDI_ID, 0);
  assert.equal(counts.SAUDI_PHONE, 0);
  assert.equal(counts.SAUDI_IBAN, 0);
  assert.equal(counts.EMAIL, 0);
  assert.equal(counts.CREDIT_CARD, 0);
});

// ─────────────────────────────────────────────────────────────────────────
// 12. Determinism — same input always produces same output
// ─────────────────────────────────────────────────────────────────────────

test("determinism: same input produces same output (100 runs)", () => {
  const text = "ID 1234567890, email test@example.com, phone 0501234567, IBAN SA0380000000608010167519";
  const first = detectPII(text);
  for (let i = 0; i < 100; i++) {
    const run = detectPII(text);
    assert.deepEqual(run, first, `run ${i} should match first run`);
  }
});

test("determinism: redactPII is stable", () => {
  const text = "ID 1234567890 and email test@example.com";
  const f = detectPII(text);
  const r1 = redactPII(text, f);
  const r2 = redactPII(text, f);
  assert.equal(r1, r2);
});

// ─────────────────────────────────────────────────────────────────────────
// 13. Version export
// ─────────────────────────────────────────────────────────────────────────

test("PII_DETECTOR_VERSION is a non-empty string", () => {
  assert.ok(typeof PII_DETECTOR_VERSION === "string");
  assert.ok(PII_DETECTOR_VERSION.length > 0);
});