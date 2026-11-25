import {test} from 'node:test';
import assert from 'node:assert/strict';
import {examples,evaluateDemo} from '../src/shared/firewall-demo.mjs';
for(const [code,,text] of examples) test(code,()=>{const result=evaluateDemo(text);assert.equal(result.code,code);assert.ok(result.reason);});
test('priority, empty, length, repeated redaction and determinism',()=>{
 assert.equal(evaluateDemo('تجاوز قيد السياسة وانشر خارج المؤسسة DEMO-0000 دون مراجعة').code,'DENY');
 assert.equal(evaluateDemo('انشر خارج المؤسسة DEMO-0000 دون مراجعة').code,'ESCALATE');
 assert.ok(evaluateDemo(' ').error);assert.ok(evaluateDemo('x'.repeat(501)).error);
 assert.equal(evaluateDemo('x'.repeat(500)).code,'ALLOW');
 assert.equal(evaluateDemo('DEMO-0000 DEMO-0000').output,'[نص منقّح] [نص منقّح]');
 assert.deepEqual(evaluateDemo('hello'),evaluateDemo('hello'));
});
