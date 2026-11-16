// A model may be added here only after its provider, region, and no-training
// terms have been approved. Environment variables alone never approve a model.
export const APPROVED_MODELS = Object.freeze([]);

// Reviewed entry contract (never populate from a browser or a free-form env):
// id, label, tenantIds[], region, protocol='CHAT_COMPLETIONS_V1', endpoint,
// providerModel, apiKeyEnv='AIGAS_SC_<PROVIDER>_API_KEY', maxOutputTokens,
// maxRequestTokens, maxInputBytes, inputOverheadTokens (reviewed conservative
// input/framing bounds for this exact model/protocol), timeoutMs,
// approval: { reference, expiresAt, noTraining:true, retentionReference,
// regionReference }. Adding an entry requires actual approvals, not this comment.

// Pure gate also allows isolated fixtures without modifying the live registry.
export function listApprovedModels(tenantId, registry = APPROVED_MODELS, now = Date.now()) {
  if (typeof tenantId !== 'string' || !tenantId.trim()) return [];
  return registry.filter(model => {
    const approval = model.approval;
    return Array.isArray(model.tenantIds) && model.tenantIds.length > 0 &&
      model.tenantIds.every(id => typeof id === 'string' && id.trim()) &&
      model.tenantIds.includes(tenantId) &&
      typeof approval?.reference === 'string' && !!approval.reference.trim() &&
      approval.noTraining === true && !!approval.retentionReference?.trim() &&
      !!approval.regionReference?.trim() &&
      Number.isFinite(Date.parse(approval.expiresAt)) && Date.parse(approval.expiresAt) > now;
  });
}

export function findApprovedModel(modelId, tenantId) {
  return listApprovedModels(tenantId).find(model => model.id === modelId) ?? null;
}
