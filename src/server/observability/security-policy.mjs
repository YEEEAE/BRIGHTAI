import { env } from '../kernel/env.mjs';

// Directives that cost nothing on the existing site: they do not touch scripts,
// styles, fonts or analytics, so current inline JSON-LD/GTag keep working.
// They stay enforced on every response; the full resource policy below is
// promoted separately after browser verification.
const CSP_BASELINE = ["base-uri 'self'", "form-action 'self'", "object-src 'none'"];

// Bundled scripts remain external (vite.build.assetsInlineLimit=0). The public
// and auth layouts also contain these fixed inline blocks. Hash sources MUST
// be quoted in CSP; the same layout can appear on a private surface.
// Styles remain inline-compatible; font files and modules are same-origin.
const GA_COLLECT_ORIGINS = [
  'https://www.google-analytics.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://www.googletagmanager.com',
];
const INLINE_SCRIPT_HASHES = [
  // <script is:inline> GA4 init block, GoogleAnalytics.astro
  'sha256-kbWqACrSLys44xLn8eH8N6slPUGW61wmDsUE4JbnwE0=',
  // <script is:inline>document.documentElement.classList.add('js');</script>
  'sha256-/x7W7R75k8Roq0WaVRQX9blP4OufE5xbAdzklGxsgpw=',
];

// The auth origin is runtime configuration, never a request value. A non-HTTPS
// or malformed value is dropped, which fails closed for that origin.
function authOrigin() {
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
function resourcePolicy(portal) {
  const script = ["'self'", 'https://www.googletagmanager.com', ...INLINE_SCRIPT_HASHES.map(hash => `'${hash}'`)];
  const connect = ["'self'"];
  const image = ["'self'", 'data:'];
  connect.push(...GA_COLLECT_ORIGINS);
  image.push('https://*.google-analytics.com', 'https://www.googletagmanager.com');
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

function serialize(directives) {
  return directives.map(directive => directive.trim()).filter(Boolean).join('; ');
}

function directiveNames(directives) {
  return new Set(directives.map(directive => directive.split(/\s+/)[0].toLowerCase()));
}

// Appends only directives the route did not already set, so a route-provided
// value (possibly stricter) is never silently replaced.
function mergeDirectives(directives, additions) {
  const present = directiveNames(directives);
  for (const directive of additions) {
    const name = directive.split(/\s+/)[0].toLowerCase();
    if (!present.has(name)) { directives.push(directive); present.add(name); }
  }
  return directives;
}

// Directives a route already set are kept; this middleware only fills the gaps.
// The baseline is enforced. The resource policy is reported until explicitly
// promoted, because enforcing an unverified script-src would silently disable
// GA4 or the sign-in client.
export function applySecurityPolicy(headers, portal) {
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

