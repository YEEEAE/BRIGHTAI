import { once } from 'node:events';
import { createGroqGateway } from '../../src/server/ai/groq-gateway.mjs';

const [instant, mode] = process.argv.slice(2);
const model = {
  providerModel: 'synthetic-model',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  apiKeyEnv: 'GROQ_API_KEY',
  approval: { reference: 'test-only', noTraining: true, expiresAt: '2099-01-01' },
  inputOverheadTokens: 0,
  maxRequestTokens: 100,
  maxOutputTokens: 20,
  inputUsdPerMillion: 0.8,
  outputUsdPerMillion: 4,
};

let calls = 0;
const gateway = createGroqGateway({
  registry: [model],
  now: () => Date.parse(instant),
  fetchImpl: async () => {
    calls++;
    if (mode === 'hold') {
      const release = once(process, 'message');
      process.send({ stage: 'reserved' });
      await release;
    }
    return Response.json({ usage: { prompt_tokens: 80, completion_tokens: 20, total_tokens: 100 } });
  },
});

try {
  await gateway({ model, messages: [{ role: 'user', content: 'Synthetic fixture' }] });
  process.send({ code: 'OK', calls });
} catch (error) {
  process.send({ code: error.code ?? 'UNEXPECTED_ERROR', calls });
} finally {
  process.disconnect();
}
