import { GROQ_CHAT_ENDPOINT } from '../../src/server/secure-chat/models.mjs';

export function syntheticChatModel(tenantId = 'tenant-a') {
  return {
    id: 'synthetic-chat', label: 'Synthetic fixture', tenantIds: [tenantId], provider: 'groq',
    region: 'SYNTHETIC-REGION', protocol: 'CHAT_COMPLETIONS_V1', endpoint: GROQ_CHAT_ENDPOINT,
    providerModel: 'synthetic-model', apiKeyEnv: 'AIGAS_SC_GROQ_API_KEY',
    maxOutputTokens: 1024, maxRequestTokens: 4096, maxInputBytes: 8000, inputOverheadTokens: 512,
    timeoutMs: 1000, inputUsdPerMillion: 0.5, outputUsdPerMillion: 1, priceReference: 'SYNTHETIC-PRICE',
    retention: { maxContentDays: 30, contractReference: 'SYNTHETIC-RETENTION' },
    approval: { reference: 'SYNTHETIC-OWNER', startsAt: '2026-01-01T00:00:00Z',
      expiresAt: '2099-01-01T00:00:00Z', noTraining: true, noTrainingReference: 'SYNTHETIC-TRAINING',
      regionReference: 'SYNTHETIC-REGION-APPROVAL' },
  };
}
