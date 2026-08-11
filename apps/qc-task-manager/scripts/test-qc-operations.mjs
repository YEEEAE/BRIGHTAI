import assert from 'node:assert/strict';
import { canTransitionFinding, FINDING_STATUSES, RCA_METHODS, FISHBONE_CATEGORIES } from '../src/lib/findings/index.ts';
import { canTransitionCapa, canCloseCapa, CAPA_STATUSES } from '../src/lib/capa/index.ts';

assert.deepEqual(FINDING_STATUSES, ['OPEN','UNDER_REVIEW','ACTION_REQUIRED','VERIFICATION','CLOSED','REOPENED']);
assert.deepEqual(CAPA_STATUSES, ['DRAFT','OPEN','IMPLEMENTATION','VERIFICATION','EFFECTIVE','CLOSED','REOPENED']);
assert.deepEqual(RCA_METHODS, ['5_WHYS','FISHBONE','FREE_FORM']);
assert.equal(FISHBONE_CATEGORIES.length, 7);
assert.equal(canTransitionFinding('OPEN', 'UNDER_REVIEW'), true);
assert.equal(canTransitionFinding('OPEN', 'CLOSED'), false);
assert.equal(canTransitionFinding('CLOSED', 'REOPENED'), true);
assert.equal(canTransitionCapa('DRAFT', 'OPEN'), true);
assert.equal(canTransitionCapa('DRAFT', 'CLOSED'), false);
assert.equal(canCloseCapa({ corrective_action: 'done', evidence: 'attached', effectiveness_check: 'passed', approval: 'approved' }), true);
assert.equal(canCloseCapa({ corrective_action: 'done', evidence: 'attached', effectiveness_check: '', approval: 'approved' }), false);
console.log('QC Operations domain tests passed');
