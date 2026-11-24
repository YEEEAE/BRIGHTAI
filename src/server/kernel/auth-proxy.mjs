import { authConfig } from './auth.mjs';
import { isPortalEnabled } from './env.mjs';

const reads = new Set(['get-session', 'token', 'organization/list', 'organization/list-invitations']);
const writes = new Set([
  'sign-up/email', 'sign-in/email', 'sign-in/email-otp', 'sign-out',
  'email-otp/send-verification-otp', 'email-otp/verify-email',
  'organization/accept-invitation', 'organization/cancel-invitation',
  'organization/invite-member', 'organization/create',
]);
const upstreamPrefix = '__Secure-neon-auth.';
const browserPrefix = '__Host-brightai-auth.';
const allowedCookie = /^(?:session_token(?:\.\d+)?|session_data(?:\.\d+)?|dont_remember)$/;
const setupErrors = new Set(['INVALID_ORIGIN', 'INVALID_DOMAIN', 'EMAIL_PASSWORD_DISABLED', 'EMAIL_PASSWORD_SIGN_UP_DISABLED']);
const privateHeaders = { 'Cache-Control': 'private, no-store, max-age=0' };
const json = (body, status = 200) => Response.json(body, { status, headers: privateHeaders });
const errors = {
  AUTH_SETUP_REQUIRED: 'خدمة الحسابات غير مهيأة في هذا التشغيل.',
  AUTH_PORTAL_CLOSED: 'بوابة مساحة العمل مغلقة حاليًا.',
  AUTH_UNAVAILABLE: 'خدمة الحسابات غير متاحة مؤقتًا. حاول مرة ثانية.',
  SIGN_IN_REJECTED: 'تعذر تسجيل الدخول. راجع البيانات أو اطلب رمزًا جديدًا.',
  VERIFICATION_REJECTED: 'تعذر التحقق من الرمز. راجع الرمز أو اطلب رمزًا جديدًا.',
};
const failure = (code, status) => json({ code, message: errors[code] ?? 'تعذر إكمال طلب المصادقة.' }, status);

function browserCookie(raw) {
  const [pair, ...attributes] = raw.split(';');
  if (!pair.startsWith(upstreamPrefix) || !allowedCookie.test(pair.split('=')[0].slice(upstreamPrefix.length))) return null;
  const lifetime = attributes.map(value => value.trim()).filter(value => /^(?:max-age|expires)=/i.test(value));
  return [browserPrefix + pair.slice(upstreamPrefix.length), ...lifetime, 'Path=/', 'Secure', 'HttpOnly', 'SameSite=Lax'].join('; ');
}

export async function proxyAuth(request, path, fetchUpstream = fetch) {
  const url = new URL(request.url);
  const method = request.method;
  if (!((method === 'GET' && reads.has(path)) || (method === 'POST' && writes.has(path)))) return failure('AUTH_ROUTE_UNAVAILABLE', 404);
  const config = authConfig();
  if (!config) return failure('AUTH_SETUP_REQUIRED', 503);
  if (!isPortalEnabled()) return failure('AUTH_PORTAL_CLOSED', 503);

  const origin = request.headers.get('origin');
  if ((origin && origin !== url.origin) || ['cross-site', 'same-site'].includes(request.headers.get('sec-fetch-site'))) {
    return failure('ORIGIN_REJECTED', 403);
  }
  const headers = new Headers({ Origin: url.origin, 'X-Neon-Auth-Middleware': 'true', Accept: 'application/json' });
  const cookies = (request.headers.get('cookie') ?? '').split(';').map(cookie => cookie.trim())
    .filter(cookie => cookie.startsWith(browserPrefix) && allowedCookie.test(cookie.split('=')[0].slice(browserPrefix.length)))
    .map(cookie => upstreamPrefix + cookie.slice(browserPrefix.length));
  if (cookies.length) headers.set('Cookie', cookies.join('; '));
  const clientInfo = request.headers.get('x-neon-client-info');
  if (clientInfo) headers.set('X-Neon-Client-Info', clientInfo);

  let body;
  if (method === 'POST') {
    if (origin !== url.origin) return failure('ORIGIN_REJECTED', 403);
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
      return failure('INVALID_BODY', 415);
    }
    const reader = request.body?.getReader();
    if (!reader) return failure('INVALID_BODY', 400);
    let size = 0;
    const chunks = [];
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 8192) {
          await reader.cancel();
          return failure('INVALID_BODY', 413);
        }
        chunks.push(value);
      }
      const payload = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return failure('INVALID_BODY', 400);
      // Keep provider redirects out of the public API. The UI verifies by email OTP.
      delete payload.callbackURL;
      body = JSON.stringify(payload);
    } catch {
      return failure('INVALID_BODY', 400);
    }
    headers.set('Content-Type', 'application/json');
  }

  const upstreamUrl = new URL(`${config.base.replace(/\/+$/, '')}/${path}`);
  if (path === 'get-session') upstreamUrl.searchParams.set('disableCookieCache', 'true');
  if (path === 'organization/list-invitations' && url.searchParams.has('organizationId')) {
    upstreamUrl.searchParams.set('organizationId', url.searchParams.get('organizationId'));
  }

  try {
    const upstream = await fetchUpstream(upstreamUrl, {
      method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(10000),
    });
    if (upstream.status >= 500 || (upstream.status >= 300 && upstream.status < 400)) return failure('AUTH_UNAVAILABLE', 503);
    if (path === 'get-session' && upstream.status === 401) return json(null);
    if (path === 'sign-out' && (upstream.ok || [401, 404].includes(upstream.status))) {
      const response = json({ success: true });
      for (const name of new Set(['__Secure-neon-auth.session_token', ...cookies.map(cookie => cookie.split('=')[0])])) {
        response.headers.append('Set-Cookie', browserCookie(`${name}=; Max-Age=0`));
      }
      return response;
    }
    const data = await upstream.json();
    if (setupErrors.has(data?.code)) return failure('AUTH_SETUP_REQUIRED', 503);
    if (path === 'email-otp/send-verification-otp' || path === 'sign-up/email') {
      // The public response never confirms account creation or whether a code was sent.
      return json({ success: true });
    }
    if (!upstream.ok) {
      if (path === 'sign-in/email' || path === 'sign-in/email-otp') return failure('SIGN_IN_REJECTED', 401);
      if (path === 'email-otp/verify-email') return failure('VERIFICATION_REJECTED', 400);
      return failure(upstream.status === 401 ? 'UNAUTHORIZED' : 'AUTH_REQUEST_REJECTED', upstream.status);
    }
    if ((data === null && path !== 'get-session') ||
        (path === 'get-session' && data !== null && (typeof data !== 'object' || !('session' in data) || !('user' in data)))) {
      return failure('AUTH_UNAVAILABLE', 503);
    }
    if (data?.twoFactorRedirect) return json({ twoFactorRedirect: true });
    if (data && !Array.isArray(data) && path !== 'token') {
      delete data.token;
      if (data.session) delete data.session.token;
    }
    const response = json(data);
    for (const raw of upstream.headers.getSetCookie()) {
      const cookie = browserCookie(raw);
      if (cookie) response.headers.append('Set-Cookie', cookie);
    }
    return response;
  } catch {
    return failure('AUTH_UNAVAILABLE', 503);
  }
}
