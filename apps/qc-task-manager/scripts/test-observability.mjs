import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const observability = await import('../src/lib/observability.ts');

const { ERROR_CODES, createRequestId, getSafeErrorCode, safeErrorMessage, createRequestLog, logRequest } = observability;

assert.match(createRequestId(), /^[0-9a-f-]{36}$/i, 'request IDs are UUID-shaped');
assert.equal(createRequestId('incoming-id'), 'incoming-id', 'valid incoming IDs are preserved');
assert.notEqual(createRequestId('not safe'), 'not safe', 'invalid incoming IDs are replaced');

assert.deepEqual(Object.keys(ERROR_CODES).sort(), ['AI', 'AUTH', 'CONFLICT', 'DB', 'FORBIDDEN', 'NOT_FOUND', 'REPORT', 'STALE_CHANGE', 'UPLOAD', 'VALIDATION']);
assert.equal(getSafeErrorCode(new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: users.username')), 'CONFLICT');
assert.equal(getSafeErrorCode(new Error('SQLITE_BUSY: database is locked')), 'DB');
assert.equal(safeErrorMessage(new Error('SQLITE_ERROR: password_hash=secret')), 'Something went wrong. Please try again.');
assert.equal(safeErrorMessage({ message: 'API key sk-live-secret password=foo' }), 'Something went wrong. Please try again.');

const entry = createRequestLog({ requestId: 'req-123', method: 'POST', route: '/api/tasks/1/update', actorId: 7, role: 'manager', status: 409, durationMs: 12.7, errorCode: 'CONFLICT', timestamp: '2026-08-28T10:00:00.000Z' });
assert.deepEqual(entry, { timestamp: '2026-08-28T10:00:00.000Z', request_id: 'req-123', method: 'POST', route: '/api/tasks/1/update', actor_id: 7, role: 'manager', status: 409, duration_ms: 13, error_code: 'CONFLICT' });
assert.equal(Object.values(entry).some((value) => String(value).includes('secret')), false);

const emitted = [];
logRequest(entry, (line) => emitted.push(line));
assert.deepEqual(JSON.parse(emitted[0]), entry, 'request log is structured JSON');

const uiState = await readFile(join(here, '../src/components/OperationalState.astro'), 'utf8');
for (const state of ['no-records', 'no-results', 'forbidden', 'system-error', 'conflict', 'stale-record', 'success', 'warning']) {
  assert.match(uiState, new RegExp(`['"]${state}['"]`), `UI state exists: ${state}`);
}
assert.match(uiState, /available next action/i, 'every state contract documents a next action');
const reviewApi = await readFile(join(here, "../src/pages/api/lab/change-requests/[id]/review.ts"), 'utf8');
const withdrawApi = await readFile(join(here, "../src/pages/api/lab/change-requests/[id]/withdraw.ts"), 'utf8');
assert.match(`${reviewApi}\n${withdrawApi}`, /getSafeErrorCode/);
assert.match(`${reviewApi}\n${withdrawApi}`, /current state|no longer pending/);
assert.doesNotMatch(`${reviewApi}\n${withdrawApi}`, /JSON\.stringify\(\{ ok: false, error: message \}\)/);

console.log('Observability tests passed: request IDs, sanitization, safe codes/messages, structured logs, and UI states.');
