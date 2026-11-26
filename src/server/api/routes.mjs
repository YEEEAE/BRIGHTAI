import { z } from 'zod';
import { firewallQuery, humanGateQuery, ledgerQuery, riskQuery, routeIdSchema, workspaceQuery } from './schemas.mjs';

const endpoints = {
  '/api/enterprise-inquiry': 'GET POST',
  '/api/trial-availability': 'GET',
  '/api/measurement-status': 'GET',
  '/api/observability': 'POST',
  '/api/public-demo/groq-sandbox': 'POST',
  '/api/security/csp-report': 'POST',
  '/app/api/firewall/evaluate': 'POST',
  '/app/api/firewall/guarded-executions': 'POST',
  '/app/api/firewall/rules': 'GET POST PATCH DELETE',
  '/app/api/human-gate/delegations': 'GET POST',
  '/app/api/human-gate/delegations/[delegationId]/revoke': 'POST',
  '/app/api/human-gate/policy': 'POST',
  '/app/api/human-gate/requests': 'GET POST',
  '/app/api/human-gate/requests/[requestId]/cancel': 'POST',
  '/app/api/human-gate/requests/[requestId]/decide': 'POST',
  '/app/api/human-gate/requests/[requestId]/execute': 'POST',
  '/app/api/agents/orchestrations': 'POST',
  '/app/api/agents/runs': 'POST',
  '/app/api/agents/runs/[runId]': 'GET',
  '/app/api/agents/runs/[runId]/cancel': 'POST',
  '/app/api/agents/runs/[runId]/resume': 'POST',
  '/app/api/agents/runs/[runId]/retry': 'POST',
  '/app/api/agents/runs/[runId]/step': 'POST',
  '/app/api/kernel': 'GET POST',
  '/app/api/kernel/health': 'GET',
  '/app/api/kernel/invitations': 'GET',
  '/app/api/kernel/pilot-report': 'POST',
  '/app/api/kernel/members': 'GET POST',
  '/app/api/kernel/policies': 'GET POST',
  '/app/api/kernel/products': 'PATCH',
  '/app/api/kernel/trials': 'GET POST',
  '/app/api/kernel/trials/[trialId]/cancel': 'POST',
  '/app/api/kernel/trials/[trialId]/submit': 'POST',
  '/app/api/ledger/events': 'GET POST',
  '/app/api/ledger/events/[eventId]': 'GET',
  '/app/api/ledger/events/[eventId]/export': 'GET',
  '/app/api/ledger/events/[eventId]/verify': 'POST',
  '/app/api/operator/trials': 'GET',
  '/app/api/operator/trials/[trialId]/activate': 'POST',
  '/app/api/operator/trials/[trialId]/close': 'POST',
  '/app/api/operator/trials/[trialId]/decide': 'POST',
  '/app/api/operator/trials/[trialId]/expire': 'POST',
  '/app/api/risk-engine/actions': 'GET',
  '/app/api/risk-engine/assets': 'GET POST',
  '/app/api/risk-engine/assets/[assetId]': 'PATCH DELETE',
  '/app/api/risk-engine/assets/[assetId]/assessments': 'GET POST',
  '/app/api/risk-engine/assets/[assetId]/revisions': 'GET',
  '/app/api/risk-engine/assets/[assetId]/treatments': 'GET POST PATCH',
  '/app/api/risk-engine/assist': 'POST',
  '/app/api/risk-engine/export': 'GET',
  '/app/api/secure-chat/messages': 'POST DELETE',
  '/app/api/secure-chat/models': 'GET',
  '/app/api/trial': 'GET POST',
  '/healthz': 'GET HEAD',
  '/readyz': 'GET HEAD',
};

export const authOperations = {
  'get-session': 'GET', token: 'GET', 'organization/list': 'GET', 'organization/list-invitations': 'GET',
  'sign-up/email': 'POST', 'sign-in/email': 'POST', 'sign-in/email-otp': 'POST', 'sign-out': 'POST',
  'email-otp/send-verification-otp': 'POST', 'email-otp/verify-email': 'POST',
  'organization/accept-invitation': 'POST', 'organization/cancel-invitation': 'POST',
  'organization/invite-member': 'POST', 'organization/create': 'POST',
};

export const routes = Object.entries({
  ...endpoints,
  ...Object.fromEntries(Object.entries(authOperations).map(([path, method]) => ['/auth/api/' + path, method])),
}).map(([path, methods]) => ({
  path,
  methods: methods === 'GET HEAD' || path.startsWith('/auth/api/')
    ? methods.split(' ')
    : methods.split(' ').flatMap(method => method === 'GET' ? ['GET', 'HEAD'] : [method]),
  pattern: new RegExp('^' + path.replace(/\[[^\]]+\]/g, '([^/]+)') + '$'),
}));

export function isApiSurface(path) {
  return /^\/(?:app\/api|auth\/api|api)(?:\/|$)/.test(path) || /^\/(?:healthz|readyz)\/?$/.test(path);
}

export function queryShape(path, method, params) {
  if (method === 'HEAD') method = 'GET';
  if (path === '/auth/api/organization/list-invitations') return { organizationId: z.string().min(1).max(128) };
  if (path === '/auth/api/get-session') return { disableCookieCache: z.enum(['true', 'false']), disableRefresh: z.enum(['true', 'false']) };
  if (path === '/app/api/kernel/policies' && method === 'GET') {
    const page = z.string().regex(/^[1-9]\d{0,2}$/);
    return params?.has('policy_id') ? { ...workspaceQuery, policy_id: routeIdSchema, versions_page: page, approvals_page: page } : workspaceQuery;
  }
  if (method === 'GET' && ['/app/api/operator/trials', '/app/api/kernel/members'].includes(path)) {
    const page = z.string().regex(/^[1-9]\d{0,2}$/);
    return path.endsWith('/members') ? { ...workspaceQuery, page } : { page };
  }
  if (!path.startsWith('/app/api/')) return {};
  if (method === 'GET' && path === '/app/api/risk-engine/assets') {
    const { page, q, classification, risk_level, assessment_status } = riskQuery;
    return { ...workspaceQuery, page, q, classification, risk_level, assessment_status };
  }
  if (method === 'GET' && path === '/app/api/risk-engine/actions') {
    const { page, treatment_status, due } = riskQuery;
    return { ...workspaceQuery, page, treatment_status, due };
  }
  if (method === 'GET' && /^\/app\/api\/risk-engine\/assets\/\[assetId\]\/(?:assessments|revisions|treatments)$/.test(path)) {
    return { ...workspaceQuery, page: riskQuery.page };
  }
  if (method === 'GET' && path === '/app/api/human-gate/requests') return { ...workspaceQuery, ...humanGateQuery };
  if (method === 'GET' && path === '/app/api/ledger/events') return { ...workspaceQuery, ...ledgerQuery };
  if (method === 'GET' && path === '/app/api/firewall/rules') return { ...workspaceQuery, ...firewallQuery };
  return workspaceQuery;
}

export function resolveRoute(path) {
  path = path.replace(/\/$/, '');
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (match) return { route, validParams: match.slice(1).every(value => routeIdSchema.safeParse(value).success) };
  }
  return null;
}

// Astro matches routes on a decoded pathname, while middleware receives the path as
// the adapter saw it. Without normalising here, an encoded alias such as `/%61pp/…`
// would reach an /app route while skipping the portal gate and the private no-store
// headers. Normalisation only adds matching; it never widens what the gate allows.
export function normalizePath(pathname) {
  let decoded = pathname;
  try { decoded = decodeURI(pathname); } catch { /* Keep the raw value for malformed escapes. */ }
  const segments = [];
  for (const segment of decoded.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') { segments.pop(); continue; }
    segments.push(segment);
  }
  const trailing = decoded.length > 1 && decoded.endsWith('/') && segments.length > 0;
  return `/${segments.join('/')}${trailing ? '/' : ''}`;
}

