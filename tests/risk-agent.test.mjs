import test from 'node:test';
import assert from 'node:assert/strict';
import { readRiskSnapshot, runRiskTools } from '../src/server/risk-engine/risk-agent.mjs';
import { treatmentInput, riyadhToday } from '../src/server/risk-engine/core.mjs';

const asset={id:'00000000-0000-4000-8000-000000000001',version:2,lifecycle_status:'ACTIVE'};
const assessment={id:'00000000-0000-4000-8000-000000000002',asset_version:2,likelihood:3,impact:2,risk_level:'HIGH',method_version:'draft-likelihood-impact-v1',evidence_references:'private evidence'};
const treatment={id:'00000000-0000-4000-8000-000000000003',version:1,asset_version:2,assessment_id:assessment.id,status:'OPEN',owner:'private owner',residual_level:'LOW',review_on:'2099-01-01'};

test('bounded tools produce sourced draft-only results and never expose evidence text',()=>{
 const result=runRiskTools({asset,assessment,treatment});
 assert.deepEqual(result.steps.map(s=>s.tool),['read_asset','read_policy','read_evidence','assess','propose_treatment']);
 assert.equal(result.steps[3].result.draft_score,6);
 assert.equal(result.steps[3].result.approved_score,null);
 assert.equal(result.steps[4].result.residual_level,'LOW');
 assert.equal(result.acceptance_authority,false);
 assert.doesNotMatch(JSON.stringify(result),/private evidence|private owner/);
 const stale=runRiskTools({asset:{...asset,version:3},assessment,treatment});
 assert.equal(stale.steps[3].result.draft_score,null);
 assert.equal(stale.steps[4].result.residual_level,null);
 assert.equal(stale.steps[4].result.review_required,true);
 assert.throws(()=>runRiskTools({asset,assessment:{...assessment,risk_level:'LOW'},treatment}),{code:'ASSESSMENT_INCONSISTENT'});
});
test('snapshot is tenant scoped, locked and rejects missing or stale assets',async()=>{
 const calls=[];const db={query:async(sql,args)=>{calls.push({sql,args});return {rows:sql.includes('aigas_re_assets')?[asset]:sql.includes('aigas_re_assessments')?[assessment]:[treatment]};}};
 assert.deepEqual(await readRiskSnapshot(db,'tenant-a',asset.id,2),{asset,assessment,treatment});
 assert.ok(calls[0].sql.includes('FOR SHARE'));
 assert.ok(calls.every(c=>c.args[0]==='tenant-a'&&c.args[1]===asset.id));
 await assert.rejects(readRiskSnapshot(db,'tenant-a',asset.id,1),{code:'STALE_ASSET'});
 await assert.rejects(readRiskSnapshot({query:async()=>({rows:[]})},'tenant-b',asset.id,2),{code:'NOT_FOUND'});
});
test('a new acceptance cannot already be due',()=>{
 const body={asset_version:2,assessment_id:assessment.id,treatment_version:0,owner:'Synthetic owner',status:'ACCEPTED',control_description:'Synthetic control',residual_risk_description:'Synthetic residual',rationale:'A sufficiently detailed synthetic rationale',residual_likelihood:1,residual_impact:1};
 for(const review_on of ['2000-01-01',riyadhToday()])assert.throws(()=>treatmentInput({...body,review_on}),{code:'ACCEPTANCE_REVIEW_EXPIRED'});
 assert.equal(treatmentInput({...body,review_on:'9999-12-31'}).status,'ACCEPTED');
});
