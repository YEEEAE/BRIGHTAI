import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScenario, scenarioId, scenarioEvidence } from '../src/shared/kernel-demo.mjs';
test('only six public fixtures travel between labs; arbitrary identity inputs are ignored',()=>{
 for(const asset of ['summary','publication']) for(const policy of ['redact','review','deny']) assert.deepEqual(parseScenario(scenarioId(asset,policy)),{asset,policy,id:scenarioId(asset,policy)});
 for(const value of ['tenant-123','user@example.com','demo-v1-__proto__-deny','<script>',null]) assert.equal(parseScenario(value).id,scenarioId());
});
test('mandatory denial survives every simulated reviewer decision',()=>{
 for(const review of ['pending','approved','rejected']) {const e=scenarioEvidence(scenarioId('publication','deny'),review);assert.equal(e.decision,'BLOCK');assert.equal(e.execution,false);assert.match(e.outcome,/لا ترفع المنع/);}
});
test('review remains explicit and never grants execution',()=>{
 for(const review of ['pending','approved','rejected']) {const e=scenarioEvidence(scenarioId('publication','review'),review);assert.equal(e.decision,'REQUEST_APPROVAL');assert.equal(e.execution,false);assert.equal(e.synthetic,true);}
 assert.match(scenarioEvidence(scenarioId('summary','redact')).outcome,/محجوب/);
});
