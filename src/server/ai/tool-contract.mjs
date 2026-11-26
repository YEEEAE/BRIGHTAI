import { z } from 'zod';
import { KernelError } from '../kernel/core.mjs';
import { protectText } from '../secure-chat/policy.mjs';

const invalid = () => new KernelError(422, 'INVALID_TOOL_CONTRACT', 'تعذر قبول عقد الأدوات؛ لم تُنفذ أي أداة.');
const name = /^[a-zA-Z0-9_-]{1,64}$/;
const id = /^[a-zA-Z0-9_-]{1,128}$/;
const bounded = value => typeof value === 'string' && Buffer.byteLength(value) <= 16384;

// Tools and Zod schemas are server-owned; never construct them from request JSON.
// Only a strict, fully required JSON-schema subset is accepted for provider tools.
function strictSchema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return false;
  const allowed = new Set(['type', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'description', 'minLength', 'maxLength', 'minimum', 'maximum', 'minItems', 'maxItems', 'pattern', 'format']);
  if (Object.keys(schema).some(key => !allowed.has(key))) return false;
  if (schema.type === 'object') {
    const props = schema.properties;
    return props && typeof props === 'object' && !Array.isArray(props) && schema.additionalProperties === false &&
      Array.isArray(schema.required) && schema.required.length === Object.keys(props).length &&
      new Set(schema.required).size === schema.required.length && Object.keys(props).every(key => schema.required.includes(key) && strictSchema(props[key]));
  }
  if (schema.type === 'array') return strictSchema(schema.items);
  return ['string', 'number', 'integer', 'boolean', 'null'].includes(schema.type);
}

export function prepareTools(definitions) {
  if (!Array.isArray(definitions) || definitions.length < 1 || definitions.length > 16) throw invalid();
  const byName = new Map();
  const wire = definitions.map(def => {
    if (!def || !name.test(def.name ?? '') || byName.has(def.name) || !bounded(def.description) || !def.schema?.safeParse) throw invalid();
    let parameters;
    try { parameters = z.toJSONSchema(def.schema, { target: 'draft-7', unrepresentable: 'throw' }); } catch { throw invalid(); }
    delete parameters.$schema;
    if (parameters.type !== 'object' || !strictSchema(parameters)) throw invalid();
    byName.set(def.name, def.schema);
    return { type: 'function', function: { name: def.name, description: def.description, strict: true, parameters } };
  });
  return { wire, byName };
}

function checkedText(text) {
  if (!bounded(text) || protectText(text).text !== text) throw invalid();
  return text;
}

export function validateToolMessages(messages, byName) {
  if (!Array.isArray(messages) || !messages.length || messages.length > 100) throw invalid();
  const pending = new Set();
  const used = new Set();
  for (const message of messages) {
    if (!message || typeof message !== 'object') throw invalid();
    if (message.role === 'tool') {
      if (Object.keys(message).some(k => !['role','tool_call_id','content'].includes(k)) || !pending.delete(message.tool_call_id)) throw invalid();
      checkedText(message.content);
    } else if (['system','user','assistant'].includes(message.role)) {
      if (pending.size || Object.keys(message).some(k => !['role','content','tool_calls'].includes(k))) throw invalid();
      if (message.content !== null) checkedText(message.content);
      if (message.role !== 'assistant' && (typeof message.content !== 'string' || message.tool_calls !== undefined)) throw invalid();
      if (message.tool_calls !== undefined) {
        if (message.role !== 'assistant' || !Array.isArray(message.tool_calls) || !message.tool_calls.length || message.tool_calls.length > 16) throw invalid();
        for (const call of message.tool_calls) {
          parseCall(call, byName);
          if (used.has(call.id)) throw invalid();
          used.add(call.id); pending.add(call.id);
        }
      } else if (typeof message.content !== 'string') throw invalid();
    } else throw invalid();
  }
  if (pending.size) throw invalid();
  return messages;
}

export function parseCall(call, byName) {
  if (!call || Object.keys(call).some(k => !['id','type','function'].includes(k)) || !id.test(call.id ?? '') || call.type !== 'function' ||
      !call.function || Object.keys(call.function).some(k => !['name','arguments'].includes(k)) ||
      !byName.has(call.function.name) || !bounded(call.function.arguments)) throw invalid();
  checkedText(call.function.arguments);
  let args;
  try { args = JSON.parse(call.function.arguments); } catch { throw invalid(); }
  const parsed = byName.get(call.function.name).safeParse(args);
  if (!parsed.success) throw invalid();
  return Object.freeze({ id: call.id, name: call.function.name, arguments: parsed.data });
}

export function parseToolReply(body, byName) {
  const choice = body?.choices?.[0], message = choice?.message;
  if (body?.choices?.length !== 1 || message?.role !== 'assistant' || message.function_call ||
      choice.finish_reason !== 'tool_calls' || !Array.isArray(message.tool_calls) || !message.tool_calls.length || message.tool_calls.length > 16 ||
      (message.content !== null && message.content !== undefined && typeof message.content !== 'string')) throw invalid();
  if (message.content) checkedText(message.content);
  const calls = message.tool_calls.map(call => parseCall(call, byName));
  if (new Set(calls.map(call => call.id)).size !== calls.length) throw invalid();
  return calls;
}
