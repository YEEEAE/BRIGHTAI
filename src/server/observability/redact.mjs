// Explicit allowlists for everything that may leave the process for monitoring.
// The default is "drop", never "send what is left": an unknown code, route,
// property, or value is discarded instead of forwarded.
const ROUTES = [
  ['/app/api/kernel/health', 'app.api.kernel.health'],
  ['/app/api/kernel', 'app.api.kernel'],
  ['/app/api/firewall', 'app.api.firewall'],
  ['/app/api/human-gate', 'app.api.human-gate'],
  ['/app/api/ledger', 'app.api.ledger'],
  ['/app/api/risk-engine', 'app.api.risk-engine'],
  ['/app/api/secure-chat', 'app.api.secure-chat'],
  ['/auth/', 'auth.page'],
  ['/app/', 'app.page'],
];

const PRODUCT_SLUGS = new Set(['kernel', 'firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat']);
const SECTIONS = new Set(['public', 'portal', 'kernel', 'firewall', 'ledger', 'human-gate', 'risk-engine', 'secure-chat', 'auth']);
const ACTION_CATEGORIES = new Set(['policy_publish', 'policy_update', 'decision', 'delegation', 'execution', 'revoke']);

// Route labels never contain IDs, query strings, fragments, or user input.
export function safeRoute(pathname) {
  if (typeof pathname !== 'string') return 'unknown';
  for (const [prefix, label] of ROUTES) {
    if (pathname === prefix || pathname.startsWith(prefix)) {
      if (label === 'app.api.ledger' && pathname.endsWith('/verify')) return 'app.api.ledger.verify';
      return label;
    }
  }
  return 'other';
}

// Sentry tag values and stable product codes share one strict shape.
export function safeCode(value) {
  if (typeof value !== 'string') return null;
  if (['AUTH_UNAVAILABLE', 'AUTH_SETUP_REQUIRED', 'PROVIDER_TIMEOUT', 'LEDGER_VERIFICATION_MISMATCH', 'SCHEMA_MISSING', 'CLIENT_ERROR', 'CLIENT_REJECTION', 'CLIENT_AUTH_FAILURE'].includes(value)) return value;
  // Emit constant categories, never arbitrary uppercase strings supplied by an
  // exception/provider. Shape validation alone can still leak a secret.
  if (value.startsWith('INVITATION_')) return 'INVITATION_FAILURE';
  if (value.startsWith('TENANT_') || value.startsWith('RLS_') || value.endsWith('_DB_PRIVILEGE')) return 'RLS_DENIED';
  if (value.endsWith('_SCHEMA_MISSING')) return 'SCHEMA_MISSING';
  if (value.endsWith('_INTEGRITY_INVALID') || value.endsWith('_VERIFICATION_FAILED')) return 'LEDGER_VERIFICATION_MISMATCH';
  return null;
}

export function safeStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

export function safeBooleanTag(value) {
  return value === true || value === false ? String(value) : null;
}

// A slug is derived from the pathname or a fixed product identifier, never
// from a request body, header, or user field.
export function productSlug(pathname) {
  if (typeof pathname !== 'string') return null;
  const match = pathname.match(/^\/app\/(kernel|firewall|ledger|human-gate|risk-engine|secure-chat)(?:\/|$)/);
  return match && PRODUCT_SLUGS.has(match[1]) ? match[1] : null;
}

export function sectionFor(pathname) {
  if (typeof pathname !== 'string') return null;
  if (pathname.startsWith('/auth/')) return 'auth';
  if (pathname === '/app' || pathname === '/app/') return 'portal';
  const slug = productSlug(pathname);
  if (slug) return slug;
  if (pathname.startsWith('/app/')) return 'portal';
  if (pathname.startsWith('/')) return 'public';
  return null;
}

export function safeSection(value) {
  return SECTIONS.has(value) ? value : null;
}

export function safeProduct(value) {
  return PRODUCT_SLUGS.has(value) ? value : null;
}

export function safeActionCategory(value) {
  return ACTION_CATEGORIES.has(value) ? value : null;
}

// Strips everything after the first line so a stack trace cannot smuggle a
// request value, a SQL statement, or a provider response into an event.
export function sanitizeStack(stack) {
  if (typeof stack !== 'string' || !stack) return [];
  const frames = [];
  for (const line of stack.split('\n')) {
    if (frames.length >= 20) break;
    const match = line.match(/^\s*at\s+(?:(.+?)\s+\()?((?:file:\/\/)?[^()\s]+):(\d+):(\d+)\)?\s*$/);
    if (!match) continue;
    const [, rawFunction, rawFile, lineNumber, columnNumber] = match;
    const marker = rawFile.search(/\/(src|dist|scripts)\//);
    if (marker < 0) continue;
    const file = rawFile.slice(marker + 1).replace(/^.*?\/dist\//, 'dist/').replace(/^.*?\/src\//, 'src/').slice(0, 240);
    const fn = typeof rawFunction === 'string' && /^[A-Za-z0-9_$.:<>[\]-]{1,120}$/.test(rawFunction.trim())
      ? rawFunction.trim()
      : '<anonymous>';
    frames.push({
      filename: file,
      function: fn,
      lineno: Number(lineNumber),
      colno: Number(columnNumber),
      in_app: true,
    });
  }
  return frames.reverse();
}
