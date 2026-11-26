// Source-controlled entries require account-specific evidence approved by the owner.
// Empty by default: an environment variable or API key cannot enroll a model.
export const APPROVED_MODELS = Object.freeze([]);

export const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
const positivePrice = value => Number.isFinite(value) && value > 0;
const instant = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value) ? Date.parse(value) : NaN;

// Window is inclusive at the start and exclusive at the end. A zero-day
// retention entry needs both contract and operational evidence. No UI claim
// is derived from this registry.
export function modelApprovalState(model, now = Date.now()) {
  const approval = model?.approval;
  const starts = instant(approval?.startsAt);
  const expires = instant(approval?.expiresAt);
  if (Number.isFinite(expires) && expires <= now) return 'EXPIRED';
  const retention = model?.retention;
  if (!(starts <= now && now < expires) ||
      ![model.id, model.label, model.region, model.providerModel, model.priceReference,
        approval.reference, approval.regionReference, approval.noTrainingReference,
        retention?.contractReference].every(nonempty) ||
      approval.noTraining !== true ||
      !Number.isSafeInteger(retention?.maxContentDays) || retention.maxContentDays < 0 ||
      (retention.maxContentDays === 0 && !nonempty(retention.operationalReference)) ||
      !positivePrice(model.inputUsdPerMillion) || !positivePrice(model.outputUsdPerMillion) ||
      !positiveInteger(model.maxOutputTokens) || !positiveInteger(model.maxRequestTokens) ||
      model.maxRequestTokens <= model.maxOutputTokens ||
      !positiveInteger(model.maxInputBytes) ||
      !Number.isSafeInteger(model.inputOverheadTokens) || model.inputOverheadTokens < 0 ||
      model.inputOverheadTokens >= model.maxRequestTokens - model.maxOutputTokens ||
      !positiveInteger(model.timeoutMs) || model.timeoutMs < 1000 || model.timeoutMs > 120000 ||
      model.provider !== 'groq' || model.endpoint !== GROQ_CHAT_ENDPOINT ||
      model.apiKeyEnv !== 'GROQ_API_KEY' || model.protocol !== 'CHAT_COMPLETIONS_V1' ||
      !Array.isArray(model.tenantIds) || !model.tenantIds.length || !model.tenantIds.every(nonempty)) return 'NOT_APPROVED';
  return 'APPROVED';
}

export function tenantModels(tenantId, registry = APPROVED_MODELS) {
  if (!nonempty(tenantId)) return [];
  return registry.filter(model => Array.isArray(model?.tenantIds) && model.tenantIds.includes(tenantId));
}

export function listApprovedModels(tenantId, registry = APPROVED_MODELS, now = Date.now()) {
  return tenantModels(tenantId, registry).filter(model =>
    registry.filter(entry => entry?.id === model.id).length === 1 && modelApprovalState(model, now) === 'APPROVED');
}

export function findApprovedModel(modelId, tenantId) {
  return listApprovedModels(tenantId).find(model => model.id === modelId) ?? null;
}
