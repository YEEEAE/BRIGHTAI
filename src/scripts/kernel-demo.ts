import {startLab,completeLab,resetLab} from './measurement';
import { parseScenario, scenarioEvidence } from '../shared/kernel-demo.mjs';
const root = document.querySelector<HTMLElement>('[data-kernel-demo]')!;
const asset = root.querySelector<HTMLSelectElement>('[name=asset]')!;
const policy = root.querySelector<HTMLSelectElement>('[name=policy]')!;
let review = 'pending';
let applied = false;
function restore() {
  const params = new URLSearchParams(location.search);
  const scenario = parseScenario(params.get('scenario'));
  asset.value = scenario.asset; policy.value = scenario.policy;
  review = ['approved', 'rejected'].includes(params.get('review') ?? '') ? params.get('review')! : 'pending';
  applied = params.get('stage') === 'evidence';
  render(false);
}
function render(save = true) {
  const id = parseScenario(`demo-v1-${asset.value}-${policy.value}`).id;
  const result = scenarioEvidence(id, review);
  const url = new URL(location.href);
  url.search = new URLSearchParams({scenario:id, ...(applied ? {stage:'evidence'} : {}), ...(review !== 'pending' ? {review} : {})}).toString();
  if(save) history.pushState({}, '', url.pathname + url.search + url.hash);
  root.querySelector('[data-kernel-decision]')!.textContent = applied ? result.decision : 'بانتظار تطبيق السياسة';
  root.querySelector('[data-kernel-reason]')!.textContent = applied ? result.outcome : 'اختيار جديد؛ طبّق السياسة لإنشاء دليل المثال.';
  const flow = root.querySelector('[data-kernel-flow]')!;
  flow.replaceChildren();
  const steps = applied ? [result.policyName + ' · demo-v1', 'Firewall · ' + result.decision, result.outcome, 'Ledger · دليل اصطناعي؛ لا حفظ مؤسسي'] : ['السياسة ← الفحص ← المراجعة عند الحاجة ← الدليل'];
  steps.forEach(text => {const li = document.createElement('li');li.textContent=text;flow.append(li);});
  root.querySelector<HTMLElement>('[data-kernel-review]')!.hidden = !applied || policy.value !== 'review';
  const output=root.querySelector<HTMLElement>('[data-kernel-evidence]')!;
  output.hidden=!applied; output.textContent=JSON.stringify({...result, review:policy.value==='review'?review:'not-required'},null,2);
  document.querySelectorAll('[data-scenario-id]').forEach(el=>el.textContent=id);
  document.querySelectorAll('[data-scenario-summary]').forEach(el=>el.textContent=`${result.assetName} · ${result.policyName}`);
  try {sessionStorage.setItem('aigas:scenario:kernel', url.search);root.querySelector('[data-kernel-storage]')!.textContent='سياق عام محفوظ لهذه الجلسة؛ لا نصوص أو هوية.';} catch {root.querySelector('[data-kernel-storage]')!.textContent='التخزين غير متاح؛ سياق Kernel محفوظ في رابط المثال فقط.';}
  window.dispatchEvent(new Event('aigas:scenario-change'));
}
root.querySelector('form')!.addEventListener('submit',e=>{e.preventDefault();startLab(root,'kernel');applied=true;review='pending';render();if(policy.value!=='review')completeLab(root,'kernel');});
[asset,policy].forEach(el=>el.addEventListener('change',()=>{applied=false;review='pending';render();}));
root.querySelectorAll<HTMLButtonElement>('[data-review]').forEach(button=>button.addEventListener('click',()=>{review=button.dataset.review!;render();completeLab(root,'kernel');}));
root.querySelector('[data-kernel-reset]')!.addEventListener('click',()=>{resetLab(root);asset.value='summary';policy.value='redact';applied=false;review='pending';render();});
window.addEventListener('popstate',restore);
// Resume only the matching public fixture; never read workspace or identity state.
try {const saved=sessionStorage.getItem('aigas:scenario:kernel');if(saved){const prior=new URLSearchParams(saved);const current=new URLSearchParams(location.search);if(!current.has('stage')&&(!current.has('scenario')||current.get('scenario')===prior.get('scenario')))history.replaceState({},'',location.pathname+saved+location.hash);}} catch { /* URL still works. */ }
restore();
