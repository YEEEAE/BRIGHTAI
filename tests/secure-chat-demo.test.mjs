import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chatScenarios,simulateChat} from '../src/shared/secure-chat-demo.mjs';
test('three scenarios produce distinct deterministic decisions and replies',()=>{
 const results=chatScenarios.map(s=>simulateChat(s.text));
 assert.deepEqual(results.map(r=>r.decision),['ALLOW','REDACT','BLOCK']);
 assert.equal(new Set(results.map(r=>r.reply)).size,3);
 assert.deepEqual(results,chatScenarios.map(s=>simulateChat(s.text)));
 assert.doesNotMatch(results[1].after,/demo@example|0500000000/);
 assert.equal(results[2].kernel,'DENY');
 assert.doesNotMatch(results[2].after,/المرور/);
});
test('empty and oversized input rejected; untrusted HTML remains plain text',()=>{
 for(const value of ['', ' ', null,'x'.repeat(2001)])assert.throws(()=>simulateChat(value));
 assert.equal(simulateChat('<img onerror=alert(1)>').before,'<img onerror=alert(1)>');
});
test('public conversation has no network, content analytics or persistence APIs',()=>{
 const code=readFileSync(new URL('../src/components/SecureChatDemo.astro',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|captureProductEvent|innerHTML)\b/);
 assert.match(code,/رد محاكاة/);assert.match(code,/data-ph-no-capture/);
});
