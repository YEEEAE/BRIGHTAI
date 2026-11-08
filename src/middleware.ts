import { defineMiddleware } from 'astro:middleware';
import { redirects } from '../redirects.json';
import { env, isPortalEnabled } from './server/kernel/env.mjs';
import { portalUnavailableJson, portalUnavailablePage } from './server/kernel/unavailable.mjs';

// Node web services do not consume redirects.json automatically.
const destinations = new Map(redirects.map(({ source, destination }) => [source, destination]));

function addVary(headers: Headers, value: string) {
  if (headers.get('Vary') === '*') return;
  const tokens = new Set((headers.get('Vary') ?? '').split(',').map(token => token.trim()).filter(Boolean));
  for (const token of value.split(',')) tokens.add(token.trim());
  headers.set('Vary', [...tokens].join(', '));
}

// Directives that cost nothing on the existing site: they do not touch scripts,
// styles, fonts or analytics, so current inline JSON-LD/GTag keep working.
// They stay enforced on every response; the full resource policy below is
// promoted separately after browser verification.
const CSP_BASELINE = ["base-uri 'self'", "form-action 'self'", "object-src 'none'"];

// Resource inventory for the least-privilege policy (2026-11-08):
// - Scripts: every app script is an Astro-bundled same-origin module. The only
//   third-party loader is the existing GA4 tag. Three static inline blocks exist
//   and are prerendered, so a nonce cannot cover them: the GA4 init block in
//   BaseLayout and one identical `js`-class block on two knowledge pages.
// - Connections: product fetches are same-origin under /app/api; GA4 collects to
//   Google Analytics hosts; the browser auth client calls NEON_AUTH_BASE_URL,
//   which is read from the server runtime and is not user input.
// - Images/fonts: same-origin only, plus data: fallbacks and the GA4 beacon.
// - Styles: Astro inlines small stylesheets and the auth UI relies on them, so
//   style-src keeps 'unsafe-inline'. It is a known, documented weakening.
const GA_SCRIPT_ORIGIN = 'https://www.googletagmanager.com';
const GA_COLLECT_ORIGINS = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://www.googletagmanager.com',
];
const INLINE_SCRIPT_HASHES = [
  // <script is:inline> GA4 init block, BaseLayout.astro
  'sha256-HJkD1lF4177kuaga0wHI556h4MfrYdnXNWbSalg2REQ=',
  // <script is:inline>document.documentElement.classList.add('js');</script>
  'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw=',
];

// The auth origin is runtime configuration, never a request value. A non-HTTPS
// or malformed value is dropped, which fails closed for that origin.
function authOrigin(): string | null {
  const raw = env('NEON_AUTH_BASE_URL') ?? env('NEON_AUTH_URL');
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' ? url.origin : null;
  } catch {
    return null;
  }
}

// Builds the full resource policy for one surface. It is only enforced when the
// operator sets AIGAS_CSP_ENFORCE=true after verifying the site and the sign-in
// flow in a browser; until then it ships as Content-Security-Policy-Report-Only
// so a missed source reports a violation instead of breaking analytics or auth.
function resourcePolicy(portal: boolean) {
  const script = ["'self'"];
  const connect = ["'self'"];
  const image = ["'self'", 'data:'];
  if (!portal) {
    script.push(GA_SCRIPT_ORIGIN, ...INLINE_SCRIPT_HASHES);
    connect.push(...GA_COLLECT_ORIGINS);
    image.push('https://*.google-analytics.com', 'https://www.googletagmanager.com');
  }
  const auth = authOrigin();
  // The portal and the auth pages call the Neon Auth service from the browser.
  if (auth) connect.push(auth);
  return [
    "default-src 'self'",
    `script-src ${script.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${image.join(' ')}`,
    "font-src 'self'",
    `connect-src ${connect.join(' ')}`,
    portal ? "frame-ancestors 'none'" : "frame-ancestors 'self'",
  ];
}

function serialize(directives: string[]) {
  return directives.map(directive => directive.trim()).filter(Boolean).join('; ');
}

function directiveNames(directives: string[]) {
  return new Set(directives.map(directive => directive.split(/\s+/)[0].toLowerCase()));
}

// Appends only directives the route did not already set, so a route-provided
// value (possibly stricter) is never silently replaced.
function mergeDirectives(directives: string[], additions: string[]) {
  const present = directiveNames(directives);
  for (const directive of additions) {
    const name = directive.split(/\s+/)[0].toLowerCase();
    if (!present.has(name)) { directives.push(directive); present.add(name); }
  }
  return directives;
}

// Astro matches routes on a decoded pathname, while middleware receives the path as
// the adapter saw it. Without normalising here, an encoded alias such as `/%61pp/…`
// would reach an /app route while skipping the portal gate and the private no-store
// headers. Normalisation only adds matching; it never widens what the gate allows.
function normalizePath(pathname: string) {
  let decoded = pathname;
  try { decoded = decodeURI(pathname); } catch { /* Keep the raw value for malformed escapes. */ }
  const segments: string[] = [];
  for (const segment of decoded.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') { segments.pop(); continue; }
    segments.push(segment);
  }
  const trailing = decoded.length > 1 && decoded.endsWith('/') && segments.length > 0;
  return `/${segments.join('/')}${trailing ? '/' : ''}`;
}

// `/app` and everything below it is the private workspace surface.
const isPortalPath = (pathname: string) => pathname === '/app' || pathname.startsWith('/app/');
const isApiPath = (pathname: string) => pathname === '/app/api' || pathname.startsWith('/app/api/');

// Directives a route already set are kept; this middleware only fills the gaps.
// The baseline is enforced. The resource policy is reported until explicitly
// promoted, because enforcing an unverified script-src would silently disable
// GA4 or the sign-in client.
function applySecurityPolicy(headers: Headers, portal: boolean) {
  const directives = (headers.get('Content-Security-Policy') ?? '')
    .split(';').map(directive => directive.trim()).filter(Boolean);
  const present = directiveNames(directives);
  if (!present.has('frame-ancestors')) directives.push(`frame-ancestors ${portal ? "'none'" : "'self'"}`);
  mergeDirectives(directives, CSP_BASELINE);
  headers.set('Content-Security-Policy', serialize(directives));

  const enforce = env('AIGAS_CSP_ENFORCE') === 'true';
  const policy = resourcePolicy(portal);
  if (enforce) {
    mergeDirectives(directives, policy);
    headers.set('Content-Security-Policy', serialize(directives));
    return;
  }
  const reportOnly = (headers.get('Content-Security-Policy-Report-Only') ?? '')
    .split(';').map(directive => directive.trim()).filter(Boolean);
  headers.set('Content-Security-Policy-Report-Only', serialize(mergeDirectives(reportOnly, policy)));
}

// Baseline response hardening. The framing/navigation baseline and the private
// cache/indexing headers are enforced; the full script/connect policy is defined
// here and promoted from report-only only after an authorized browser check.
function harden(response: Response, options: { portal: boolean; secureTransport: boolean }) {
  const headers = response.headers;
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', options.portal ? 'DENY' : 'SAMEORIGIN');
  applySecurityPolicy(headers, options.portal);
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  headers.set('Referrer-Policy', options.portal ? 'no-referrer' : 'strict-origin-when-cross-origin');
  // Private and public responses alike must not be read as a cross-origin document.
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  // TLS terminates in front of the Node service; send HSTS only for confirmed HTTPS.
  if (options.secureTransport) headers.set('Strict-Transport-Security', 'max-age=15552000');

  if (options.portal) {
    // Private workspace responses must not be stored by a browser, proxy or CDN.
    headers.set('Cache-Control', 'private, no-store, max-age=0');
    headers.set('CDN-Cache-Control', 'no-store');
    headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow');
    addVary(headers, 'Authorization, Cookie');
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;
  const normalizedPath = normalizePath(path);
  const forwardedProto = context.request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const secureTransport = forwardedProto === 'https' || context.url.protocol === 'https:';

  if (isPortalPath(path) || isPortalPath(normalizedPath)) {
    // The gate runs before any route, redirect or static asset resolution:
    // a disabled portal answers 503 here and never renders app pages or APIs.
    const isApi = isApiPath(isPortalPath(normalizedPath) ? normalizedPath : path);
    const response = isPortalEnabled()
      ? await next()
      : isApi
        ? portalUnavailableJson()
        : portalUnavailablePage(context.request);
    return harden(response, { portal: true, secureTransport });
  }

  // Page aliases and the conventional /sitemap.xml entry share redirects.json.
  let decodedPath = path;
  try { decodedPath = decodeURIComponent(path); } catch { /* Keep malformed paths unmatched. */ }
  const destination = destinations.get(path)
    ?? destinations.get(decodedPath)
    ?? destinations.get(decodedPath.replace(/\/$/, ''))
    ?? destinations.get(normalizedPath)
    ?? destinations.get(normalizedPath.replace(/\/$/, ''));
  const response = destination && ['GET', 'HEAD'].includes(context.request.method)
    ? context.redirect(`${destination}${context.url.search}`, 301)
    : await next();
  return harden(response, { portal: false, secureTransport });
});
