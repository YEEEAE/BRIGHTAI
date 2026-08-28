import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parseUxEvent, UX_EVENT_NAMES } from '../src/lib/uxTelemetry.ts';

const valid = parseUxEvent({
  event_name: 'search_zero_results', route: '/search', outcome: 'neutral',
  duration_ms: 120, flow_id: 'abc12345', metadata: { surface: 'search', result_count: 0 },
});
assert.equal(valid.success, true, 'allowlisted event parses');
assert.equal(parseUxEvent({ event_name: 'password_captured', route: '/login', outcome: 'neutral' }).success, false, 'unknown event rejected');
assert.equal(parseUxEvent({ event_name: 'page_view', route: '/search?q=secret', outcome: 'neutral' }).success, false, 'query string rejected');
assert.equal(parseUxEvent({ event_name: 'page_view', route: '/search', outcome: 'neutral', metadata: { q: 'secret' } }).success, false, 'unallowlisted metadata rejected');
assert.equal(parseUxEvent({ event_name: 'page_view', route: '/search', outcome: 'neutral', duration_ms: -1 }).success, false, 'invalid duration rejected');

const source = await readFile(resolve('src/lib/uxTelemetry.ts'), 'utf8');
const migration = await readFile(resolve('db/migrations/039_ux_events.sql'), 'utf8');
assert.match(source, /90 \* 24 \* 60 \* 60 \* 1000/);
assert.match(migration, /CREATE TABLE ux_events/);
assert.doesNotMatch(source, /task_id|test_id|search_text|password|session_token/);
assert.equal(UX_EVENT_NAMES.includes('review_decision_attempt'), true);
console.log('UX telemetry contract passed: allowlist, validation, minimization, and retention wiring.');
