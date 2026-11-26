const GA_SCRIPT = 'https://www.googletagmanager.com';
const GA_COLLECTION = [
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
];
const GA_INIT = "'sha256-rXFghexfQr0YH3VpkNUqc0owijMnd5VBvAIUyE0QhrE='";
const EDGE_GA_INIT = "'sha256-/ahxh2pzUcFi1E9lm6ltoUB1mNeCC4QSX0TWwNtcszc='";
const JS_CLASS = "'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw='";
const UNAVAILABLE_STYLE = "'sha256-BdNspLynP6vZMI4tacHjKIg8mS2Jnj3CAcxWk92zRKc='";
export const CSP_REPORT_PATH = '/api/security/csp-report/';

export function applySecurityPolicy(headers, portal, { confidential = false, secureTransport = false } = {}) {
  const script = confidential ? "'self'" : `'self' ${GA_SCRIPT} ${GA_INIT} ${EDGE_GA_INIT} ${JS_CLASS}`;
  const connect = confidential ? "'self'" : `'self' ${GA_COLLECTION.join(' ')}`;
  const images = confidential ? "'self'" : `'self' ${GA_SCRIPT} https://*.google-analytics.com`;
  headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    `script-src ${script}`,
    "script-src-attr 'none'",
    portal ? `style-src 'self' ${UNAVAILABLE_STYLE}` : "style-src 'self'",
    // CSS custom properties on existing components still use style attributes.
    confidential ? "style-src-attr 'none'" : "style-src-attr 'unsafe-inline'",
    `img-src ${images}`,
    "font-src 'self'",
    `connect-src ${connect}`,
    "frame-src 'none'",
    `frame-ancestors ${portal ? "'none'" : "'self'"}`,
    `report-uri ${CSP_REPORT_PATH}`,
  ].join('; '));
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', portal ? 'DENY' : 'SAMEORIGIN');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  headers.set('Referrer-Policy', portal ? 'no-referrer' : 'strict-origin-when-cross-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  if (secureTransport) headers.set('Strict-Transport-Security', 'max-age=15552000');
}
