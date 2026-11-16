import { readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync, fsyncSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { KernelError } from '../kernel/core.mjs';
import { resolveProviderSecret } from '../kernel/env.mjs';
import { APPROVED_MODELS } from '../secure-chat/models.mjs';

const failure = (code, status = 503) => new KernelError(status, code, 'تعذر الاتصال بالمزود؛ استخدم المسار الحتمي دون إرسال خارجي.');
const positive = (value, fallback) => {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n <= 0) throw failure('GROQ_CONFIG_INVALID');
  return n;
};

// One shared, persistent ledger per Groq account. Provision an existing file with
// {"days":{},"months":{},"active":0,"failures":0,"openUntil":0} on a durable
// shared filesystem. Never auto-create/reset: loss/corruption must close egress.
// Crashed requests retain reservations and slots until operator reconciliation.
function transact(path, update) {
  if (!path || !isAbsolute(path)) throw failure('BUDGET_STORE_UNAVAILABLE');
  let lock;
  try {
    lock = openSync(`${path}.lock`, 'wx', 0o600);
    const state = JSON.parse(readFileSync(path, 'utf8'));
    if (!state.days || !state.months || !['active','failures','openUntil'].every(k => Number.isSafeInteger(state[k]) && state[k] >= 0) ||
        !Object.values(state.days).concat(Object.values(state.months)).every(v => Number.isFinite(v) && v >= 0)) throw failure('BUDGET_STORE_UNAVAILABLE');
    const result = update(state);
    const fd = openSync(`${path}.next`, 'w', 0o600);
    try { writeFileSync(fd, JSON.stringify(state)); fsyncSync(fd); } finally { closeSync(fd); }
    renameSync(`${path}.next`, path);
    return result;
  } catch (error) {
    if (error instanceof KernelError) throw error;
    throw failure('BUDGET_STORE_UNAVAILABLE');
  } finally {
    if (lock !== undefined) { closeSync(lock); unlinkSync(`${path}.lock`); }
  }
}

async function json(response) {
  const reader = response.body?.getReader();
  if (!reader) throw failure('INVALID_PROVIDER_REPLY', 502);
  let bytes = 0, text = '';
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 131072) throw failure('INVALID_PROVIDER_REPLY', 502);
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function createGroqGateway({ registry = APPROVED_MODELS, fetchImpl = (...args) => fetch(...args), now = Date.now, wait = sleep } = {}) {
  return async function request({ model, messages, signal, models = false, internalAdvisory = false }) {
    // Object identity prevents an unreviewed clone from supplying prices/bounds.
    if (!registry.includes(model) || !model.approval?.reference || model.approval.noTraining !== true ||
        !Number.isFinite(Date.parse(model.approval.expiresAt)) || Date.parse(model.approval.expiresAt) <= now() || process.env.GROQ_MODEL !== model.providerModel ||
        model.apiKeyEnv !== 'AIGAS_SC_GROQ_API_KEY' || model.endpoint !== 'https://api.groq.com/openai/v1/chat/completions' ||
        !Number.isSafeInteger(model.maxRequestTokens) || !Number.isSafeInteger(model.maxOutputTokens) ||
        model.maxOutputTokens < 1 || model.maxRequestTokens <= model.maxOutputTokens ||
        !Number.isFinite(model.inputUsdPerMillion) || model.inputUsdPerMillion <= 0 ||
        !Number.isFinite(model.outputUsdPerMillion) || model.outputUsdPerMillion <= 0) throw failure('NO_APPROVED_MODEL');
    let key;
    try { key = resolveProviderSecret(model.apiKeyEnv); } catch { throw failure('PROVIDER_NOT_CONFIGURED'); }
    const path = process.env.AIGAS_GROQ_BUDGET_FILE;
    const daily = positive(process.env.AIGAS_GROQ_DAILY_BUDGET_USD);
    const monthly = positive(process.env.AIGAS_GROQ_MONTHLY_BUDGET_USD);
    const concurrency = positive(process.env.AIGAS_GROQ_MAX_CONCURRENCY, 5);
    if (!Number.isSafeInteger(concurrency)) throw failure('GROQ_CONFIG_INVALID');
    const timeout = positive(process.env.AIGAS_GROQ_TIMEOUT_MS, 15000);
    if (!Number.isSafeInteger(timeout) || timeout > 120000) throw failure('GROQ_CONFIG_INVALID');
    if (!models && (!Array.isArray(messages) || !Number.isSafeInteger(model.inputOverheadTokens) || model.inputOverheadTokens < 0 ||
        messages.some(m => !['system','user','assistant'].includes(m?.role) || typeof m.content !== 'string') ||
        messages.reduce((n, m) => n + Buffer.byteLength(m.content, 'utf8'), 0) + model.inputOverheadTokens > model.maxRequestTokens - model.maxOutputTokens)) throw failure('REQUEST_LIMIT_REACHED');
    const deadline = AbortSignal.timeout(timeout);
    const combined = signal ? AbortSignal.any([signal, deadline]) : deadline;
    const day = new Date(now()).toISOString().slice(0, 10), month = day.slice(0, 7);
    const cost = (input, output) => (input * model.inputUsdPerMillion + output * model.outputUsdPerMillion) / 1e6;
    const reserve = models ? 0 : cost(model.maxRequestTokens - model.maxOutputTokens, model.maxOutputTokens);
    transact(path, state => {
      if (state.openUntil > now()) throw failure('GROQ_CIRCUIT_OPEN');
      if (state.active >= concurrency) throw failure('GROQ_CONCURRENCY_LIMIT');
      if ((state.days[day] ?? 0) + reserve > daily || (state.months[month] ?? 0) + reserve > monthly) throw failure('BUDGET_CAP_REACHED');
      state.days[day] = (state.days[day] ?? 0) + reserve;
      state.months[month] = (state.months[month] ?? 0) + reserve;
      state.active++;
    });
    let actual = reserve, networkFailure = false, success = false;
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        combined.throwIfAborted();
        let response;
        try {
          response = await fetchImpl(`https://api.groq.com/openai/v1/${models ? 'models' : 'chat/completions'}`, {
            method: models ? 'GET' : 'POST', redirect: 'error', signal: combined,
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            ...(models ? {} : { body: JSON.stringify({ model: model.providerModel, messages, max_tokens: model.maxOutputTokens,
              reasoning_effort: 'none', temperature: 0.7, top_p: 0.80, stream: false, n: 1,
              ...(internalAdvisory ? { reasoning_format: 'hidden' } : {}) }) }),
          });
        } catch { networkFailure = !signal?.aborted; throw failure(deadline.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE', 504); }
        if (response.status === 429) {
          const retry = response.headers.get('retry-after');
          await response.body?.cancel();
          actual = 0;
          if (attempt === 1) throw failure('GROQ_RATE_LIMIT', 429);
          const seconds = retry === null ? 0 : Number(retry);
          const delay = Math.max(1000 * 2 ** attempt, Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retry) - now() || 0);
          await wait(delay, undefined, { signal: combined });
          actual = reserve;
          continue;
        }
        if (!response.ok) {
          networkFailure = response.status >= 500;
          await response.body?.cancel();
          throw failure('PROVIDER_REJECTED', 502);
        }
        const body = await json(response);
        if (!models) {
          const u = body.usage;
          if (!u || !['prompt_tokens','completion_tokens','total_tokens'].every(k => Number.isSafeInteger(u[k]) && u[k] >= 0) ||
              u.total_tokens !== u.prompt_tokens + u.completion_tokens || u.prompt_tokens > model.maxRequestTokens - model.maxOutputTokens ||
              u.completion_tokens > model.maxOutputTokens) throw failure('INVALID_PROVIDER_USAGE', 502);
          actual = cost(u.prompt_tokens, u.completion_tokens);
        }
        success = true;
        // Models probing exposes only reviewed identifiers, never raw upstream metadata.
        if (models) return { data: (Array.isArray(body.data) ? body.data : []).filter(item => item?.id === model.providerModel).map(item => ({ id: item.id, object: 'model' })) };
        return body;
      }
    } catch (error) {
      // Discard upstream messages, bodies, causes and headers entirely.
      if (error instanceof KernelError) throw error;
      throw failure(deadline.aborted ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE', 502);
    } finally {
      transact(path, state => {
        state.active--;
        state.days[day] = Math.max(0, state.days[day] - reserve + actual);
        state.months[month] = Math.max(0, state.months[month] - reserve + actual);
        if (networkFailure) {
          state.failures++;
          if (state.failures >= 5) state.openUntil = now() + 60000;
        } else if (success && state.openUntil <= now()) { state.failures = 0; state.openUntil = 0; }
      });
    }
  };
}
export const groqRequest = createGroqGateway();
