// A model may be added here only after its provider, region, and no-training
// terms have been approved. Environment variables alone never approve a model.
export const APPROVED_MODELS = Object.freeze([]);

// Reviewed entry contract (never populate from a browser or a free-form env):
// id, label, tenantIds[], region, protocol='CHAT_COMPLETIONS_V1', endpoint,
// providerModel, apiKeyEnv='AIGAS_SC_<PROVIDER>_API_KEY', maxOutputTokens,
// maxRequestTokens (provider-enforced upper bound for input + output), timeoutMs,
// approval: { reference, expiresAt, noTraining:true, retentionReference,
// regionReference }. Adding an entry requires actual approvals, not this comment.

export function listApprovedModels(tenantId) {
  return APPROVED_MODELS.filter(model => model.tenantIds?.includes(tenantId));
}

export function findApprovedModel(modelId, tenantId) {
  return listApprovedModels(tenantId).find(model => model.id === modelId) ?? null;
}
