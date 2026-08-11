import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createGroqProvider } from '../src/lib/ai/groq.ts';
import { parseStructuredResponse, consumeAiRateLimit } from '../src/lib/ai/guardrails.ts';
import { runMigrations } from '../src/lib/migrations.ts';

let calls = 0;
const provider = createGroqProvider({
  apiKey: 'test-key',
  model: 'llama-3.3-70b-versatile',
  timeoutMs: 100,
  maxRetries: 1,
  fetchImpl: async () => {
    calls += 1;
    if (calls === 1) return new Response(JSON.stringify({ error: { message: 'busy' } }), { status: 429 });
    return new Response(JSON.stringify({ choices: [{ message: { content: '{"summary":"ok"}' } }] }), { status: 200 });
  },
});

const raw = await provider.complete({ system: 'system', user: 'user' });
assert.equal(raw, '{"summary":"ok"}');
assert.equal(calls, 2);
assert.deepEqual(parseStructuredResponse(raw, z.object({ summary: z.string().min(1) })), { summary: 'ok' });
assert.throws(() => parseStructuredResponse('{"summary":4}', z.object({ summary: z.string() })));
assert.equal(consumeAiRateLimit('u1', 'feature', { limit: 1, windowMs: 60_000 }), true);
assert.equal(consumeAiRateLimit('u1', 'feature', { limit: 1, windowMs: 60_000 }), false);

await assert.rejects(() => createGroqProvider({ apiKey: 'test-key', model: 'test', timeoutMs: 100, maxRetries: 0, fetchImpl: async () => new Response('{}', { status: 500 }) }).complete({ system: 's', user: 'u' }), /AI provider request failed/);
await assert.rejects(() => createGroqProvider({ apiKey: 'test-key', model: 'test', timeoutMs: 1_000, maxRetries: 0, fetchImpl: (_url, init) => new Promise((_, reject) => init.signal?.addEventListener('abort', () => { const error = new Error('aborted'); error.name = 'AbortError'; reject(error); })) }).complete({ system: 's', user: 'u' }), /AI provider request failed/);

const root = mkdtempSync(join(tmpdir(), 'brightai-ai-'));
const dbPath = join(root, 'ai.db');
const db = new Database(dbPath);
runMigrations(db, { migrationsDir: resolve(fileURLToPath(new URL('..', import.meta.url)), 'db/migrations'), backup: false });
db.prepare("INSERT INTO users (username, password_hash, full_name, role) VALUES ('ai-user', 'x', 'AI User', 'admin')").run();
db.close();
process.env.QC_DATABASE_PATH = dbPath;
const { runStructuredAi } = await import('../src/lib/ai/service.ts');
const result = await runStructuredAi({ userId: 1, feature: 'summary', systemPrompt: 'json', userPrompt: 'return summary', schema: z.object({ summary: z.string() }), provider });
assert.equal(result.data.summary, 'ok');
const auditDb = new Database(dbPath);
assert.equal(auditDb.prepare('SELECT success, feature, model, request_reference, response_reference, failure_reason FROM ai_audit_log').get().success, 1);
auditDb.close();
rmSync(root, { recursive: true, force: true });
console.log('AI foundation tests passed');
