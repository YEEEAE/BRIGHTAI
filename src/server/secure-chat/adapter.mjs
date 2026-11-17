import { KernelError } from '../kernel/core.mjs';
import { resolveProviderSecret } from '../kernel/env.mjs';
import { groqRequest } from '../ai/groq-gateway.mjs';

// Two distinct fail-closed outcomes. Neither one ever names a destination,
// key, provider or region in the response.
const approvedModelUnavailable = (status = 'not configured') => new KernelError(503, 'NO_APPROVED_MODEL', 'لا يوجد نموذج معتمد ومهيأ لهذا الطلب؛ لم يُرسل المحتوى.', status);
const providerUnavailable = (status = 'not configured') => new KernelError(503, 'PROVIDER_NOT_CONFIGURED', 'الموصل إلى المزود المعتمد غير مهيأ على الخادم؛ لم يُرسل المحتوى.', status);

export function providerConfiguration(model) {
  // An entry is reviewed in source, including the exact destination, protocol,
  // region, terms, no-training evidence and tenant scope. No client URLs.
  // Environment variables can withhold a key but can never approve a model.
  try {
    const approval = model.approval;
    const expiresAt = Date.parse(approval?.expiresAt);
    if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) throw approvedModelUnavailable('expired');
    if (!approval?.reference || approval.noTraining !== true || !approval.retentionReference || !approval.regionReference ||
        !Number.isFinite(expiresAt) || model.protocol !== 'CHAT_COMPLETIONS_V1' || !model.region || !model.providerModel ||
        model.providerModel !== process.env.GROQ_MODEL ||
        !Number.isSafeInteger(model.maxOutputTokens) || model.maxOutputTokens < 1 ||
        !Number.isSafeInteger(model.maxRequestTokens) || model.maxRequestTokens <= model.maxOutputTokens ||
        !Number.isSafeInteger(model.maxInputBytes) || model.maxInputBytes < 1 ||
        !Number.isSafeInteger(model.inputOverheadTokens) || model.inputOverheadTokens < 0 ||
        !Number.isSafeInteger(model.timeoutMs) || model.timeoutMs < 1000 || model.timeoutMs > 120000 ||
        !/^AIGAS_SC_[A-Z0-9_]+_API_KEY$/.test(model.apiKeyEnv)) throw approvedModelUnavailable();
    const destination = new URL(model.endpoint);
    if (destination.protocol !== 'https:' || destination.username || destination.password || destination.hash || destination.search) throw approvedModelUnavailable();
    let key;
    try { key = resolveProviderSecret(model.apiKeyEnv); } catch { throw providerUnavailable(); }
    if (!key || /[\r\n]/.test(key)) throw providerUnavailable();
    return { endpoint: destination.href, key };
  } catch (error) {
    if (error instanceof KernelError && error.dependencyStatus === 'expired') throw error;
    if (error instanceof KernelError && error.code === 'PROVIDER_NOT_CONFIGURED') throw error;
    throw approvedModelUnavailable();
  }
}

export function providerState(model) {
  // Non-sensitive readiness label for the model list; no key or endpoint is returned.
  try { providerConfiguration(model); return 'READY'; }
  catch (error) {
    if (error?.code === 'PROVIDER_NOT_CONFIGURED') return 'PROVIDER_NOT_CONFIGURED';
    if (error?.dependencyStatus === 'expired') return 'EXPIRED';
    return 'NOT_APPROVED';
  }
}

export function providerReady(model) {
  return providerState(model) === 'READY';
}

export async function complete(model, messages, signal) {
  providerConfiguration(model);
  const body = await groqRequest({ model, messages, signal });
  const choice = body.choices?.[0];
  if (choice?.finish_reason !== 'stop' || choice.message?.role !== 'assistant' ||
      choice.message?.tool_calls || typeof choice.message?.content !== 'string' ||
      !choice.message.content.trim() || Array.from(choice.message.content).length > 16000) throw new Error('INVALID_PROVIDER_REPLY');
  const usage = body.usage;
  const valid = usage && ['prompt_tokens', 'completion_tokens', 'total_tokens'].every(k => Number.isSafeInteger(usage[k]) && usage[k] >= 0) &&
    usage.total_tokens === usage.prompt_tokens + usage.completion_tokens &&
    usage.prompt_tokens <= model.maxRequestTokens - model.maxOutputTokens &&
    usage.completion_tokens <= model.maxOutputTokens && usage.total_tokens <= model.maxRequestTokens;
  if (!valid) throw new Error('INVALID_PROVIDER_USAGE');
  return { reply: choice.message.content, usage: { inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens } };
}
