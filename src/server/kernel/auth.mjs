import { env } from './env.mjs';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { KernelError } from './core.mjs';
let keys;
export function authConfig() {
  const base = env('NEON_AUTH_BASE_URL') || env('NEON_AUTH_URL');
  const jwks = env('NEON_AUTH_JWKS_URL') || env('NEON_JWKS_URL');
  if (!base || !jwks) return null;
  try {
    const url = new URL(base); const keyUrl = new URL(jwks);
    if (url.protocol !== 'https:' || keyUrl.protocol !== 'https:' || url.origin !== keyUrl.origin) return null;
    return { base, jwks, issuer: url.origin };
  } catch { return null; }
}
export async function authenticate(request) {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || header.length > 16384) throw new KernelError(401, 'UNAUTHORIZED', 'سجّل الدخول لعرض بيانات مؤسستك.');
  const config = authConfig();
  if (!config) throw new KernelError(503, 'AUTH_SETUP_REQUIRED', 'يلزم إعداد الدخول عبر Neon Auth.');
  keys ??= createRemoteJWKSet(new URL(config.jwks), { timeoutDuration: 5000 });
  try {
    return await verifyIdentity(header.slice(7), keys, config.issuer);
  } catch (error) {
    if (error.code === 'ERR_JWKS_TIMEOUT' || error instanceof TypeError) throw new KernelError(503, 'AUTH_UNAVAILABLE', 'تعذر التحقق من الدخول. حاول لاحقًا.');
    throw new KernelError(401, 'UNAUTHORIZED', 'انتهت جلسة الدخول أو تعذر التحقق منها.');
  }
}

export async function verifyIdentity(token, keySet, issuer) {
  const { payload } = await jwtVerify(token, keySet, { issuer, algorithms: ['EdDSA'], requiredClaims: ['sub', 'exp', 'iat'], maxTokenAge: '15m' });
  if (typeof payload.sub !== 'string' || !payload.sub || payload.role === 'anonymous' || payload.is_anonymous === true) throw new Error('invalid identity');
  return { userId: payload.sub };
}
