// A model may be added here only after its provider, region, and no-training
// terms have been approved. Environment variables alone never approve a model.
export const APPROVED_MODELS = Object.freeze([]);

export function listApprovedModels() {
  return APPROVED_MODELS.map(({ id, label, region }) => ({ id, label, region }));
}

export function findApprovedModel(modelId) {
  return APPROVED_MODELS.find(model => model.id === modelId) ?? null;
}
