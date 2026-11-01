// Server-owned registry. No provider, model, endpoint, region or no-training
// terms have been approved for Firewall. Environment keys alone are not approval.
// A future reviewed entry must bind an adapter to exact tenant IDs, an approval
// reference/expiry, model/region and no-training terms. Never accept these from JSON.
const approvedProviders = Object.freeze([]);

export function approvedProvider(tenantId) {
  return approvedProviders.find(provider => provider.tenantIds.includes(tenantId)
    && provider.approvalReference && Date.parse(provider.approvedUntil) > Date.now()
    && provider.model && provider.region && provider.noTraining === true
    && typeof provider.generate === 'function') ?? null;
}
export function providerState(tenantId) {
  const provider = approvedProvider(tenantId);
  return provider
    ? { code: 'CONFIGURED', configured: true, model: provider.model, region: provider.region }
    : { code: 'PROVIDER_NOT_CONFIGURED', configured: false, model: null, region: null };
}
