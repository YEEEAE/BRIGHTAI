import { KernelError } from '../kernel/core.mjs';
import { env } from '../kernel/env.mjs';

const unavailable = () => new KernelError(503, 'PROVIDER_NOT_CONFIGURED', 'موصل النموذج غير مهيأ أو انتهى اعتماده؛ لم يُرسل المحتوى.');

export function providerConfiguration(model) {
  // An entry is reviewed in source, including the exact destination, protocol,
  // region, terms, no-training evidence and tenant scope. No client URLs.
  try {
    const approval = model.approval;
    if (!approval?.reference || approval.noTraining !== true || !approval.retentionReference || !approval.regionReference ||
        !Number.isFinite(Date.parse(approval.expiresAt)) || Date.parse(approval.expiresAt) <= Date.now() ||
        model.protocol !== 'CHAT_COMPLETIONS_V1' || !model.region || !model.providerModel ||
        !Number.isSafeInteger(model.maxOutputTokens) || model.maxOutputTokens < 1 ||
        !Number.isSafeInteger(model.maxRequestTokens) || model.maxRequestTokens <= model.maxOutputTokens ||
        !Number.isSafeInteger(model.timeoutMs) || model.timeoutMs < 1000 || model.timeoutMs > 120000 ||
        !/^AIGAS_SC_[A-Z0-9_]+_API_KEY$/.test(model.apiKeyEnv)) throw unavailable();
    const destination = new URL(model.endpoint);
    if (destination.protocol !== 'https:' || destination.username || destination.password || destination.hash || destination.search) throw unavailable();
    const key = env(model.apiKeyEnv);
    if (!key || /[\r\n]/.test(key)) throw unavailable();
    return { endpoint: destination.href, key };
  } catch { throw unavailable(); }
}

export function providerReady(model) {
  try { providerConfiguration(model); return true; } catch { return false; }
}

async function boundedJson(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('EMPTY_RESPONSE');
  const decoder = new TextDecoder();
  let text = '', size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 131072) throw new Error('RESPONSE_LIMIT');
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export async function complete(model, messages, signal) {
  const { endpoint, key } = providerConfiguration(model);
  // Single non-streamed request. No redirects, retries, tools or fallback.
  // maxRequestTokens is an approved upper bound on the entire billed request.
  const response = await fetch(endpoint, {
    method: 'POST', redirect: 'error', signal,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: model.providerModel, messages, stream: false, n: 1, max_tokens: model.maxOutputTokens }),
  });
  if (!response.ok) { await response.body?.cancel(); throw new Error('PROVIDER_REJECTED'); }
  const body = await boundedJson(response);
  const choice = body.choices?.[0];
  if (choice?.finish_reason !== 'stop' || choice.message?.role !== 'assistant' ||
      choice.message?.tool_calls || typeof choice.message?.content !== 'string' ||
      !choice.message.content.trim() || Array.from(choice.message.content).length > 16000) throw new Error('INVALID_PROVIDER_REPLY');
  const usage = body.usage;
  const valid = usage && ['prompt_tokens', 'completion_tokens', 'total_tokens'].every(k => Number.isSafeInteger(usage[k]) && usage[k] >= 0) &&
    usage.total_tokens === usage.prompt_tokens + usage.completion_tokens && usage.total_tokens <= model.maxRequestTokens;
  return { reply: choice.message.content, usage: valid ? { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens } : null };
}
