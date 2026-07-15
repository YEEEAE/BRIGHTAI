/**
 * src/lib/csrf.ts — CSRF-LEAD-001 (2026-07-15)
 *
 * HMAC-signed CSRF tokens (double-submit cookie pattern).
 *
 * لماذا double-submit:
 *   - Origin allowlist وحده غير كافي لأن الـ Origin header optional في
 *     بعض السيناريوهات (form submits من <form action>، بعض الـ privacy
 *     modes، أو legacy browsers).
 *   - double-submit يضمن إن الـ attacker (cross-origin) ما يقدر يقرأ
 *     الـ cookie (SameSite=Strict) → ما يقدر يـ replicate الـ token في
 *     الـ header.
 *
 * Token shape (URL-safe, no padding):
 *   "<base36-ts>.<32-hex-chars-nonce>.<64-hex-chars-hmac-sha256>"
 *
 *   مثال: "lg5t9x.q8r3v...64chars...abc123"
 *   - base36 timestamp (8 chars): TTL check سريع
 *   - nonce: 128 bits من randomness (crypto.randomBytes)
 *   - hmac: HMAC-SHA256(secret, `${ts}.${nonce}`) → يربط token بالـ server
 *
 * Storage:
 *   - Cookie: csrf=<token>; Path=/; SameSite=Strict; Secure; Max-Age=3600
 *   - Header: X-CSRF-Token: <token>
 *   - الـ server يقارن الـ cookie value مع الـ header value، ثم يـ verify
 *     الـ HMAC. لو الـ attacker يقدر يـ set cookie cross-origin (نادر)، يقدر
 *     يـ set الـ header نفسه — بس الـ HMAC يربط الـ token بـ CSRF_SECRET
 *     اللي ما يطلع برا الـ server.
 *
 * Configuration:
 *   - CSRF_SECRET (required): HMAC secret. يُولَّد مرة في الـ deploy ويُحفظ
 *     في Render env vars. لا تستخدم SESSION_SECRET — هذا متغير منفصل.
 *
 * Trade-offs:
 *   - User على privacy mode بلا cookies → 403 (accepted trade-off، الـ
 *     form يحتاج JS لتحديث الـ token).
 *   - Token TTL 1 ساعة: لو الـ user يـ sit على الـ form > 1h، يطلب token جديد.
 *
 * Testing:
 *   - scripts/test-csrf.mjs: node --test suite.
 */

import crypto from 'node:crypto';

export const CSRF_COOKIE_NAME = 'csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─────────────────────────────────────────────────────────────────────────
// Secret validation
// ─────────────────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.CSRF_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'CSRF_SECRET is not set or too short (< 32 chars). ' +
      'Generate with: openssl rand -hex 32',
    );
  }
  return secret;
}

// ─────────────────────────────────────────────────────────────────────────
// Token generation
// ─────────────────────────────────────────────────────────────────────────

/**
 * يولّد token جديد: `<ts>.<nonce>.<hmac>`.
 *
 * - ts: timestamp بالـ ms (base36 عشان نقصر الـ string).
 * - nonce: 128 bits من crypto.randomBytes (مستحيل يتكرر).
 * - hmac: HMAC-SHA256(secret, `${ts}.${nonce}`) — يربط الـ token بالـ server.
 *
 * الـ caller مسؤول يضبط الـ Set-Cookie بنفسه (نفس الـ token في الـ cookie
 * والـ body عشان double-submit pattern).
 */
export function generateCsrfToken(): string {
  const secret = getSecret();
  const ts = Date.now().toString(36);   // base36: أقصر من decimal
  const nonce = crypto.randomBytes(16).toString('hex'); // 32 chars
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(`${ts}.${nonce}`)
    .digest('hex');                      // 64 chars
  return `${ts}.${nonce}.${hmac}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Token verification (constant-time)
// ─────────────────────────────────────────────────────────────────────────

/**
 * يتحقق من صلاحية الـ token:
 *  1. shape: 3 parts مفصولين بـ `.`.
 *  2. TTL: ts + TTL_MS > Date.now() (أي الـ token مو منتهي).
 *  3. HMAC: timing-safe equal.
 *
 * @returns true لو الـ token صحيح، false لأي سبب من الأسباب (لا نـ throw
 *          عشان ما نسرب معلومات للـ attacker عن نوع الفشل).
 */
export function verifyCsrfToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const secret = process.env.CSRF_SECRET;
  if (!secret) return false; // بدون secret → ما نقدر نتحقق

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [tsStr, nonce, providedHmac] = parts;
  // نتحقق من الـ types: tsStr لازم base36 صالح، nonce لازم 32 hex chars،
  // hmac لازم 64 hex chars. لو طوله غلط → fail مبكراً (مو timing leak
  // لأن lengths عامة public info).
  if (!/^[0-9a-z]+$/.test(tsStr)) return false;
  if (!/^[0-9a-f]{32}$/.test(nonce)) return false;
  if (!/^[0-9a-f]{64}$/.test(providedHmac)) return false;

  // TTL check.
  const ts = parseInt(tsStr, 36);
  if (Number.isNaN(ts)) return false;
  if (Date.now() - ts > CSRF_TTL_MS) return false;

  // HMAC verify (constant-time).
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${tsStr}.${nonce}`)
    .digest('hex');

  // crypto.timingSafeEqual يتطلب نفس الطول — لازم نقارن الطول أولاً
  // (المتطابق دائماً 64 hex chars لكن defensive).
  const a = Buffer.from(providedHmac, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

// ─────────────────────────────────────────────────────────────────────────
// Double-submit middleware helper
// ─────────────────────────────────────────────────────────────────────────

/**
 * يستخرج token من الـ cookie (Set-Cookie header) مع case-insensitive matching.
 * @returns token string أو null لو مش موجود.
 */
export function extractCsrfFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const re = new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`);
  const match = re.exec(cookieHeader);
  return match ? match[1] : null;
}

/**
 * يطبّق double-submit validation كاملة:
 *  1. يقرأ token من الـ header (X-CSRF-Token).
 *  2. يقرأ token من الـ cookie.
 *  3. يتحقق إنهم متطابقين (defense: attacker cross-origin ما يقدر يـ read cookies).
 *  4. يتحقق من صلاحية الـ HMAC + TTL.
 *
 * @returns true لو الـ request شرعي، false لو attack أو expired.
 */
export function verifyCsrfRequest(request: Request): boolean {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = extractCsrfFromCookie(request.headers.get('cookie'));

  if (!headerToken || !cookieToken) return false;
  if (headerToken !== cookieToken) return false;

  return verifyCsrfToken(headerToken);
}