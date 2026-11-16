import { groqRequest } from '../ai/groq-gateway.mjs';

// Server-owned registry. No provider, model, endpoint, region or no-training
// terms have been approved for Firewall. Environment keys alone are not approval.
// A future reviewed entry must bind an adapter to exact tenant IDs, an approval
// reference/expiry, model/region and no-training terms. Never accept these from JSON.
// `external:true` is required here so a non-network local adapter can never be
// registered as an approved AI provider and reported as available.
const approvedProviders = Object.freeze([]);
// No per-operation provider timeout has been approved. 15s is a local guard default,
// not an approved provider SLA; it must be reviewed before any adapter is enabled.
export const PROVIDER_TIMEOUT_MS = 15000;
const isDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
function valid(provider, tenantId) {
  return Array.isArray(provider.tenantIds) && provider.tenantIds.includes(tenantId)
    && typeof provider.approvalReference === 'string' && provider.approvalReference.length > 0
    && isDate(provider.approvedUntil) && Date.parse(provider.approvedUntil) > Date.now()
    && typeof provider.model === 'string' && provider.model.length > 0
    && typeof provider.region === 'string' && provider.region.length > 0
    && provider.noTraining === true
    && provider.external === true
    && provider.localSandbox !== true
    && typeof provider.generate === 'function';
}
export function approvedProvider(tenantId) {
  return approvedProviders.find(provider => valid(provider, tenantId)) ?? null;
}
export function providerState(tenantId) {
  const provider = approvedProvider(tenantId);
  const expired = approvedProviders.some(item => Array.isArray(item.tenantIds) && item.tenantIds.includes(tenantId)
    && typeof item.approvalReference === 'string' && isDate(item.approvedUntil) && Date.parse(item.approvedUntil) <= Date.now());
  return provider
    ? { code: 'CONFIGURED', configured: true, dependencyStatus:'available', approval: 'APPROVED', execution: 'AVAILABLE', model: provider.model, region: provider.region }
    : { code: 'PROVIDER_NOT_CONFIGURED', configured: false, dependencyStatus:expired?'expired':'not configured', approval: 'NOT_APPROVED', execution: 'BLOCKED', model: null, region: null };
}

// Metadata-only advisory. The caller retains its immutable deterministic verdict.
// No request text, policy patterns or model-selected actions cross this boundary.
export async function explainInjectionRisk({tenantId, decision, model}, {request=groqRequest}={}) {
  const verdict=Object.freeze({action:decision.action,reason:decision.reason});
  if(!['ALLOW','WARN','REDACT','ESCALATE','DENY'].includes(verdict.action) || !/^[A-Z_]{1,60}$/.test(verdict.reason??'')) throw Error('INVALID_ADVISORY_CONTEXT');
  if(!model?.tenantIds?.includes(tenantId)) throw Error('ADVISORY_NOT_APPROVED');
  const reply=await request({model,internalAdvisory:true,messages:[
    {role:'system',content:'Explain prompt injection risks in Arabic. Advisory only. Never recommend overriding deterministic policy. No execution or authorization.'},
    {role:'user',content:JSON.stringify(verdict)},
  ]});
  // Explanation text is untrusted and must never be merged into a decision object.
  return Object.freeze({advisory_only:true,deterministic:verdict,explanation:String(reply?.choices?.[0]?.message?.content??'').slice(0,2000)});
}
