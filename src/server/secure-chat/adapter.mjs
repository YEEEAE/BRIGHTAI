import { KernelError } from '../kernel/core.mjs';
import { groqRequest, requireGroqReadiness } from '../ai/groq-gateway.mjs';
import { modelApprovalState } from './models.mjs';

/**
 * @typedef {{role: 'user'|'assistant', content: string}} ChatMessage
 * @typedef {{ reply: string, usage: {inputTokens: number, outputTokens: number, totalTokens: number} }} Completion
 * @typedef {object} ProviderAdapter
 * @property {(model: object) => void} requireReady Local readiness check. Throws on failure. No network.
 * @property {(model: object, messages: readonly ChatMessage[], signal: AbortSignal) => Promise<Completion>} complete
 * Performs at most one non-streaming upstream submission. Returns untrusted text.
 * The caller owns tenant authorization, policy, redaction, cancellation and disclosure.
 */

/** @type {ProviderAdapter} */
const groqAdapter = Object.freeze({
  requireReady: requireGroqReadiness,
  async complete(model, messages, signal) {
    const body = await groqRequest({ model, messages, signal, retryRateLimit: false });
    const choice = body?.choices?.[0];
    if (body?.choices?.length !== 1 || choice?.finish_reason !== 'stop' || choice.message?.role !== 'assistant' ||
        choice.message.tool_calls || choice.message.function_call || typeof choice.message.content !== 'string' ||
        !choice.message.content.trim() || Array.from(choice.message.content).length > 16000) {
      throw new KernelError(502, 'INVALID_PROVIDER_REPLY', 'تعذر قبول صيغة رد النموذج.');
    }
    const usage = body.usage; // The gateway validates numbers and bounds before returning.
    return { reply: choice.message.content, usage: {
      inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens, totalTokens: usage.total_tokens,
    } };
  },
});
const adapters = new Map([['groq', groqAdapter]]);

export function providerConfiguration(model) {
  const state = modelApprovalState(model);
  const adapter = adapters.get(model?.provider);
  if (state !== 'APPROVED' || !adapter || model.providerModel !== process.env.GROQ_MODEL) {
    throw new KernelError(503, 'NO_APPROVED_MODEL', 'لا يوجد نموذج معتمد ومهيأ لهذا الطلب؛ لم يُرسل المحتوى.', state === 'EXPIRED' ? 'expired' : 'not configured');
  }
  adapter.requireReady(model);
  return adapter;
}

export function providerState(model) {
  try { providerConfiguration(model); return 'READY'; }
  catch (error) {
    if (error?.dependencyStatus === 'expired') return 'EXPIRED';
    if (error?.code === 'NO_APPROVED_MODEL') return 'NOT_APPROVED';
    if (['PROVIDER_NOT_CONFIGURED', 'GROQ_CONFIG_INVALID', 'BUDGET_STORE_UNAVAILABLE'].includes(error?.code)) return 'PROVIDER_NOT_CONFIGURED';
    return 'PROVIDER_UNAVAILABLE';
  }
}

export function providerReady(model) {
  return providerState(model) === 'READY';
}

export async function complete(model, messages, signal) {
  signal.throwIfAborted();
  return providerConfiguration(model).complete(model, messages, signal);
}
