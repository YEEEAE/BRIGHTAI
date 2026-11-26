// Local, read-only Firewall tools. Kernel checks every invocation before and
// after the handler; neither input nor redacted output is returned or persisted.
import { evaluate, inputText } from '../firewall/core.mjs';
import { evaluatorReference } from '../firewall/binding.mjs';
import { z } from 'zod';
import { groqRequest } from '../ai/groq-gateway.mjs';
import { prepareTools, parseToolReply } from '../ai/tool-contract.mjs';
import { approvedProvider } from '../firewall/provider.mjs';
import { findApprovedModel } from '../secure-chat/models.mjs';
import { scanTyped } from '../../shared/firewall-policy.mjs';

const names = ['inspect_input', 'read_policy', 'classify', 'recommend_redaction', 'explain_decision'];

export const firewallTools = Object.freeze(Object.fromEntries(names.map(name => [
  name,
  async ({ tx, tenantId, message, signal }) => {
    signal?.throwIfAborted();
    const args = message.arguments ?? {};
    const keys = Object.keys(args);
    if (name === 'read_policy' ? keys.length !== 0 : keys.length !== 1 || keys[0] !== 'text') throw Error('INVALID_FIREWALL_TOOL_ARGUMENTS');
    if (!tx?.db || typeof tx.db.query !== 'function') throw Error('FIREWALL_POLICY_UNAVAILABLE');
    const rules = (await tx.db.query(
      'SELECT id,name,template,match_type,pattern,action,priority,enabled,version,created_at FROM public.aigas_fw_rules WHERE tenant_id=$1 ORDER BY priority,created_at,id',
      [tenantId],
    )).rows;
    signal?.throwIfAborted();
    if (name === 'read_policy') {
      if (!rules.some(rule => rule.enabled)) return { outcome: 'DENY', summary: 'لا توجد سياسة Firewall مفعّلة.' };
      return { outcome: 'ALLOW', summary: 'قُرئت بيانات سياسة Firewall دون أنماط أو محتوى.', data: { policy: evaluatorReference(rules) } };
    }
    const result = evaluate(inputText(args.text), rules, { enforce: true });
    // A finding is not authority to execute: this tool reports metadata only.
    // DENY remains a tool denial and does not trigger a provider or other tool.
    return { outcome: result.action === 'DENY' ? 'DENY' : 'ALLOW',
      summary: `Firewall: ${result.action} · ${result.reason} · ${evaluatorReference(rules)}${result.warning_held === true ? ' · HELD' : ''}`,
      data: { action: result.action, reason: result.reason, matcher_id: result.matcher_id ?? null,
        matcher_version: result.matcher_version ?? null, rule_id: result.rule_id, rule_version: result.rule_version,
        policy: evaluatorReference(rules), warning_held: result.warning_held === true } };
  },
])));

// The model can only select a name. Arguments, policy, tenant and text come
// from the authenticated server context, never from the model response.
const definitions = Object.freeze(names.map(name => Object.freeze({ name,
  description: 'Inspect the current Firewall decision metadata.', schema: z.strictObject({ scope:z.enum(['metadata']) }) })));
const toolSchemas = prepareTools(definitions).byName;
const clean = value => typeof value === 'string' && value.length <= 2000 && scanTyped(value).length === 0;

export function createFirewallAgent({ runtime, request = groqRequest, providerFor = approvedProvider, modelFor = findApprovedModel } = {}) {
  if (!runtime || typeof runtime.start !== 'function' || typeof runtime.step !== 'function') throw Error('RUNTIME_REQUIRED');
  return Object.freeze({ async run(identity, tenantId, { text, correlationId, idempotencyKey }) {
    inputText(text);
    const run = await runtime.start(identity, tenantId, { agentKey:'firewall-agent', objective:'Firewall metadata review',
      synthetic:true, correlationId, idempotencyKey });
    if (run.replayed || run.status !== 'RUNNING') throw Error('AGENT_REPLAY_BLOCKED');
    let step = 0;
    const invoke = async name => {
      const result = await runtime.step(identity, tenantId, run.run_id, { kind:'TOOL', correlationId,
        idempotencyKey: idempotencyKey + ':fw:' + step++, message:{ tool:name, action:'evaluate', resource:'firewall:agent',
          capability:'firewall.agent.' + name.replaceAll('_','-'), version:1, arguments:name === 'read_policy' ? {} : { text } } });
      if (result.status !== 'RUNNING' || result.tool?.status !== 'EXECUTED') throw Error('FIREWALL_TOOL_BLOCKED');
      return result.tool.summary;
    };
    // A denied decision never reaches provider lookup. WARN/ESCALATE also stop.
    const summary = await invoke('inspect_input');
    const match = /^Firewall: (ALLOW|WARN|REDACT|ESCALATE|DENY) · ([A-Z_]+) · firewall-v3:[0-9a-f]{64}$/.exec(summary);
    if (!match || !['ALLOW','REDACT'].includes(match[1])) throw Error('FIREWALL_INPUT_BLOCKED');
    const provider = providerFor(tenantId);
    const model = provider && modelFor(provider.model, tenantId);
    if (!provider || !model || model.region !== provider.region) throw Error('PROVIDER_NOT_CONFIGURED');
    const messages = [{ role:'system', content:'Select only read-only tools. Decisions are deterministic. Never request content or execution.' },
      { role:'user', content:JSON.stringify({ action:match[1], reason:match[2] }) }];
    for (let round = 0; round < 2; round++) {
      // Gateway applies its own approval, budget, schema, input and output gates.
      const reply = await request({ model, messages, tools:definitions, retryRateLimit:false,
        toolPolicy:{ pre:async () => true, post:async value => typeof value === 'string' ? clean(value) : Array.isArray(value) && value.length <= 2 } });
      if (await invoke('classify') !== summary) throw Error('FIREWALL_DECISION_CHANGED');
      const choice = reply?.choices?.[0];
      if (choice?.finish_reason === 'stop') {
        if (!clean(choice.message?.content)) throw Error('FIREWALL_OUTPUT_BLOCKED');
        const final = await runtime.step(identity, tenantId, run.run_id, { kind:'RESULT', note:'Firewall advisory complete', correlationId,
          idempotencyKey:idempotencyKey + ':fw:result' });
        if (final.status !== 'COMPLETED') throw Error('FIREWALL_FINAL_POLICY_BLOCKED');
        return Object.freeze({ action:match[1], reason:match[2], advisory:'METADATA_REVIEWED', run_id:run.run_id });
      }
      const calls = parseToolReply(reply, toolSchemas);
      if (!calls.length || calls.length > 2) throw Error('FIREWALL_TOOL_LIMIT');
      messages.push({ role:'assistant', content:null, tool_calls:choice.message.tool_calls });
      for (const call of calls) {
        const result = await invoke(call.name);
        if (call.name !== 'read_policy' && result !== summary) throw Error('FIREWALL_DECISION_CHANGED');
        if (!clean(result)) throw Error('FIREWALL_TOOL_OUTPUT_BLOCKED');
        messages.push({ role:'tool', tool_call_id:call.id, content:result });
      }
    }
    throw Error('FIREWALL_TOOL_LIMIT');
  } });
}
