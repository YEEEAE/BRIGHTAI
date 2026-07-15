/**
 * scripts/test-csrf.mjs — CSRF-LEAD-001 (2026-07-15)
 *
 * Test suite لـ src/lib/csrf.ts.
 *
 * Usage:
 *   node --import ./scripts/test-ts-loader.mjs --experimental-strip-types \
 *        --test scripts/test-csrf.mjs
 *
 * Acceptance criteria (من CSRF-LEAD-001):
 *   1. POST بدون CSRF → 403 (via verifyCsrfRequest مع empty header)
 *   2. POST مع CSRF header + cookie صحيحين → 200 (via verifyCsrfRequest true)
 *   3. POST مع CSRF header يخالف الـ cookie → 403 (via verifyCsrfRequest false)
 *   4. Token expired > 1h → 403 (via verifyCsrfToken false)
 *   5. Timing-safe comparison (طول مختلف = false مباشرة)
 *
 * Coverage:
 *   - generateCsrfToken: shape + uniqueness + secret validation
 *   - verifyCsrfToken: valid, expired, tampered, malformed, missing secret
 *   - extractCsrfFromCookie: present, missing, multiple cookies
 *   - verifyCsrfRequest: full double-submit flow
 */

import assert from "node:assert/strict";
import test, { before, after } from "node:test";

// ─────────────────────────────────────────────────────────────────────────
// Setup: set CSRF_SECRET قبل أي import
// ─────────────────────────────────────────────────────────────────────────
const TEST_SECRET = "test-csrf-secret-do-not-use-in-production-32chars-min";
process.env.CSRF_SECRET = TEST_SECRET;

let generateCsrfToken;
let verifyCsrfToken;
let extractCsrfFromCookie;
let verifyCsrfRequest;
let CSRF_COOKIE_NAME;
let CSRF_HEADER_NAME;

before(async () => {
  const mod = await import("../src/lib/csrf.ts");
  generateCsrfToken = mod.generateCsrfToken;
  verifyCsrfToken = mod.verifyCsrfToken;
  extractCsrfFromCookie = mod.extractCsrfFromCookie;
  verifyCsrfRequest = mod.verifyCsrfRequest;
  CSRF_COOKIE_NAME = mod.CSRF_COOKIE_NAME;
  CSRF_HEADER_NAME = mod.CSRF_HEADER_NAME;
});

// ─────────────────────────────────────────────────────────────────────────
// generateCsrfToken
// ─────────────────────────────────────────────────────────────────────────

test("generateCsrfToken: shape is `<base36-ts>.<32-hex>.<64-hex>`", () => {
  const token = generateCsrfToken();
  assert.match(token, /^[0-9a-z]+\.[0-9a-f]{32}\.[0-9a-f]{64}$/);
});

test("generateCsrfToken: produces unique tokens", () => {
  const tokens = new Set();
  for (let i = 0; i < 100; i++) {
    tokens.add(generateCsrfToken());
  }
  // 100 tokens → 100 unique (probability of collision ≈ 0 with 128-bit nonce)
  assert.equal(tokens.size, 100);
});

test("generateCsrfToken: throws when CSRF_SECRET missing", () => {
  const original = process.env.CSRF_SECRET;
  delete process.env.CSRF_SECRET;
  assert.throws(() => generateCsrfToken(), /CSRF_SECRET/);
  process.env.CSRF_SECRET = original;
});

test("generateCsrfToken: throws when CSRF_SECRET too short (< 32)", () => {
  const original = process.env.CSRF_SECRET;
  process.env.CSRF_SECRET = "short";
  assert.throws(() => generateCsrfToken(), /CSRF_SECRET/);
  process.env.CSRF_SECRET = original;
});

// ─────────────────────────────────────────────────────────────────────────
// verifyCsrfToken
// ─────────────────────────────────────────────────────────────────────────

test("verifyCsrfToken: accepts freshly generated token", () => {
  const token = generateCsrfToken();
  assert.equal(verifyCsrfToken(token), true);
});

test("verifyCsrfToken: rejects null/undefined/empty", () => {
  assert.equal(verifyCsrfToken(null), false);
  assert.equal(verifyCsrfToken(undefined), false);
  assert.equal(verifyCsrfToken(""), false);
});

test("verifyCsrfToken: rejects non-string", () => {
  assert.equal(verifyCsrfToken(123), false);
  assert.equal(verifyCsrfToken({}), false);
  assert.equal(verifyCsrfToken([]), false);
});

test("verifyCsrfToken: rejects malformed shape (missing parts)", () => {
  assert.equal(verifyCsrfToken("only.two"), false);
  assert.equal(verifyCsrfToken("a.b.c.d"), false);
  assert.equal(verifyCsrfToken("no-dots-at-all"), false);
});

test("verifyCsrfToken: rejects invalid base36 timestamp", () => {
  const token = generateCsrfToken();
  const [ts, nonce, hmac] = token.split(".");
  // Inject uppercase letter (invalid base36)
  const tampered = `Z${ts.slice(1)}.${nonce}.${hmac}`;
  assert.equal(verifyCsrfToken(tampered), false);
});

test("verifyCsrfToken: rejects invalid nonce (wrong length)", () => {
  const token = generateCsrfToken();
  const [ts, , hmac] = token.split(".");
  // Short nonce (16 hex instead of 32)
  const tampered = `${ts}.aaaa.${hmac}`;
  assert.equal(verifyCsrfToken(tampered), false);
});

test("verifyCsrfToken: rejects invalid hmac (wrong length)", () => {
  const token = generateCsrfToken();
  const [ts, nonce] = token.split(".");
  // Short hmac (32 hex instead of 64)
  const tampered = `${ts}.${nonce}.aaaa`;
  assert.equal(verifyCsrfToken(tampered), false);
});

test("verifyCsrfToken: rejects tampered hmac (correct length, wrong value)", () => {
  const token = generateCsrfToken();
  const [ts, nonce, hmac] = token.split(".");
  // Flip last char of hmac
  const lastChar = hmac.slice(-1);
  const flipped = lastChar === "0" ? "1" : "0";
  const tampered = `${ts}.${nonce}.${hmac.slice(0, -1)}${flipped}`;
  assert.equal(verifyCsrfToken(tampered), false);
});

test("verifyCsrfToken: rejects tampered nonce", () => {
  const token = generateCsrfToken();
  const [ts, nonce, hmac] = token.split(".");
  // Flip last char of nonce
  const lastChar = nonce.slice(-1);
  const flipped = lastChar === "0" ? "1" : "0";
  const tampered = `${ts}.${nonce.slice(0, -1)}${flipped}.${hmac}`;
  assert.equal(verifyCsrfToken(tampered), false);
});

test("verifyCsrfToken: rejects expired token (>1h old)", () => {
  // Generate a token, ثم نتحايل على الـ Date.now() عشان نحاكي expiration.
  const token = generateCsrfToken();
  const [tsStr, nonce, hmac] = token.split(".");
  const originalTs = parseInt(tsStr, 36);

  // Mock Date.now لتعيد وقت +1 ساعة + 1ms
  const realDateNow = Date.now;
  const futureMs = originalTs + 60 * 60 * 1000 + 1;
  Date.now = () => futureMs;

  try {
    assert.equal(verifyCsrfToken(token), false);
  } finally {
    Date.now = realDateNow;
  }
});

test("verifyCsrfToken: accepts token at exactly TTL boundary", () => {
  const token = generateCsrfToken();
  const [tsStr, nonce, hmac] = token.split(".");
  const originalTs = parseInt(tsStr, 36);

  // Mock Date.now لتعيد وقت = TTL exactly (مو منتهي)
  const realDateNow = Date.now;
  const boundaryMs = originalTs + 60 * 60 * 1000; // exactly TTL
  Date.now = () => boundaryMs;

  try {
    // عند الحد، Date.now() - ts = TTL_MS، والـ check `> TTL_MS` يفشل (يساوي).
    // يعني token لسا صالح عند الحد بالضبط.
    assert.equal(verifyCsrfToken(token), true);
  } finally {
    Date.now = realDateNow;
  }
});

test("verifyCsrfToken: rejects when CSRF_SECRET missing", () => {
  const token = generateCsrfToken();
  const original = process.env.CSRF_SECRET;
  delete process.env.CSRF_SECRET;
  assert.equal(verifyCsrfToken(token), false);
  process.env.CSRF_SECRET = original;
});

test("verifyCsrfToken: rejects token signed with different secret", () => {
  // ولّد token مع secret 1، ثم غيّر secret، وحاول verify
  const token = generateCsrfToken();
  const original = process.env.CSRF_SECRET;
  process.env.CSRF_SECRET = "different-secret-also-32-chars-long-aaa";
  assert.equal(verifyCsrfToken(token), false);
  process.env.CSRF_SECRET = original;
});

test("verifyCsrfToken: timing-safe — length mismatch returns false immediately", () => {
  // هذي حالة degenerate — لو أحدنا قطع token بطريقة قطعت الـ hmac
  const partial = "abc.def";
  // لازم يرجع false بدون crash
  assert.equal(verifyCsrfToken(partial), false);
});

// ─────────────────────────────────────────────────────────────────────────
// extractCsrfFromCookie
// ─────────────────────────────────────────────────────────────────────────

test("extractCsrfFromCookie: returns token when present", () => {
  const cookie = `${CSRF_COOKIE_NAME}=abc123; Path=/; Max-Age=3600`;
  assert.equal(extractCsrfFromCookie(cookie), "abc123");
});

test("extractCsrfFromCookie: returns null when missing", () => {
  assert.equal(extractCsrfFromCookie(null), null);
  assert.equal(extractCsrfFromCookie(""), null);
  assert.equal(extractCsrfFromCookie("session=xyz; theme=dark"), null);
});

test("extractCsrfFromCookie: finds csrf among multiple cookies", () => {
  const cookie = `session=abc; ${CSRF_COOKIE_NAME}=token-value; theme=dark`;
  assert.equal(extractCsrfFromCookie(cookie), "token-value");
});

test("extractCsrfFromCookie: handles cookies without leading space", () => {
  // "csrf=value; other=x" → match expected
  const cookie = `${CSRF_COOKIE_NAME}=value; other=x`;
  assert.equal(extractCsrfFromCookie(cookie), "value");
});

// ─────────────────────────────────────────────────────────────────────────
// verifyCsrfRequest (full double-submit)
// ─────────────────────────────────────────────────────────────────────────

test("verifyCsrfRequest: accepts request with matching header + cookie", async () => {
  const token = generateCsrfToken();
  const request = new Request("http://localhost/api/lead/", {
    method: "POST",
    headers: {
      [CSRF_HEADER_NAME]: token,
      cookie: `${CSRF_COOKIE_NAME}=${token}`,
    },
  });
  assert.equal(verifyCsrfRequest(request), true);
});

test("verifyCsrfRequest: rejects request without CSRF header", () => {
  const token = generateCsrfToken();
  const request = new Request("http://localhost/api/lead/", {
    method: "POST",
    headers: { cookie: `${CSRF_COOKIE_NAME}=${token}` },
  });
  assert.equal(verifyCsrfRequest(request), false);
});

test("verifyCsrfRequest: rejects request without cookie", () => {
  const token = generateCsrfToken();
  const request = new Request("http://localhost/api/lead/", {
    method: "POST",
    headers: { [CSRF_HEADER_NAME]: token },
  });
  assert.equal(verifyCsrfRequest(request), false);
});

test("verifyCsrfRequest: rejects when header and cookie mismatch (CSRF attack)", () => {
  // السيناريو: attacker من origin آخر يحاول يستخدم token من victim.
  // الـ attacker يعرف الـ token (من network log مثلاً) بس ما يقدر يضبط cookie.
  // الـ victim cookie = "victim-token"، الـ attacker يـ set header = "stolen-token".
  // → mismatch → reject.
  const stolenToken = generateCsrfToken();
  const victimCookie = generateCsrfToken(); // different token
  const request = new Request("http://localhost/api/lead/", {
    method: "POST",
    headers: {
      [CSRF_HEADER_NAME]: stolenToken,
      cookie: `${CSRF_COOKIE_NAME}=${victimCookie}`,
    },
  });
  assert.equal(verifyCsrfRequest(request), false);
});

test("verifyCsrfRequest: rejects request with tampered token", () => {
  const token = generateCsrfToken();
  const tampered = token.slice(0, -1) + (token.slice(-1) === "0" ? "1" : "0");
  const request = new Request("http://localhost/api/lead/", {
    method: "POST",
    headers: {
      [CSRF_HEADER_NAME]: tampered,
      cookie: `${CSRF_COOKIE_NAME}=${tampered}`,
    },
  });
  assert.equal(verifyCsrfRequest(request), false);
});

// ─────────────────────────────────────────────────────────────────────────
// Export constants
// ─────────────────────────────────────────────────────────────────────────

test("CSRF_COOKIE_NAME === 'csrf'", () => {
  assert.equal(CSRF_COOKIE_NAME, "csrf");
});

test("CSRF_HEADER_NAME === 'x-csrf-token'", () => {
  assert.equal(CSRF_HEADER_NAME, "x-csrf-token");
});

after(() => {
  // Clean up
  delete process.env.CSRF_SECRET;
});