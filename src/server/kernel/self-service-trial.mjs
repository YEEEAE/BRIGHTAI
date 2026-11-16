import { transaction, setActorScope, setTenantScope, requireRlsPosture } from './db.mjs';
import { assertTenantMembership } from './access.mjs';
import { explorationGrants, EXPLORATION_CAPABILITIES } from './exploration.mjs';
import { productNavigation } from '../../shared/product-navigation.mjs';
import { KernelError } from './core.mjs';

export async function startTrial(identity) {
 return transaction(async db => {
  await requireRlsPosture(db);
  await setActorScope(db,identity.userId);
  try { return {tenantId:(await db.query('SELECT public.aigas_start_self_service_trial() AS id')).rows[0].id}; }
  catch(error) {
   if(error.code==='42501')throw new KernelError(403,'IDENTITY_NOT_VERIFIED','وثّق بريدك أولًا؛ الحساب الموقوف أو العضوية المسحوبة لا يتيحان التجربة.');
   throw error;
  }
 });
}
export async function trialHome(identity, tenantId) {
 return transaction(async db=>{
  await setActorScope(db,identity.userId);
  await assertTenantMembership(db,identity,tenantId);
  await setTenantScope(db,tenantId,identity.userId);
  await requireRlsPosture(db);
  const trial=(await db.query('SELECT dataset FROM public.aigas_self_service_trials WHERE tenant_id=$1 AND user_id=$2',[tenantId,identity.userId])).rows[0];
  if(!trial)throw new KernelError(403,'TRIAL_NOT_FOUND','لا توجد تجربة لهذا الحساب في هذه المؤسسة.');
  const grants=await explorationGrants(db,tenantId);
  const now=(await db.query('SELECT clock_timestamp() AS now')).rows[0].now;
  return {tenantId,serverTime:now,dataset:trial.dataset,kernel:'IDENTITY_TENANT_GRANTS',billing:'NO_CARD_NO_AUTO_CONVERSION',
   products:productNavigation.map(p=>{
    const g=grants.find(g=>g.product_slug===p.slug);
    const allowed=!!g?.active && g.used<g.limit_units;
    return {slug:p.slug,name:p.name,demo:p.publicPath+'#lab',demoStatus:'DEMO AVAILABLE',
     status:allowed?'TRIAL LIMITED':'DEMO AVAILABLE',providerStatus:'PROVIDER APPROVAL REQUIRED',
     operations:allowed?EXPLORATION_CAPABILITIES[p.slug]:[],remaining:g?Math.max(0,g.limit_units-g.used):0,
     startsAt:g?.starts_at??null,endsAt:g?.ends_at??null,remainingSeconds:g?Math.max(0,Math.floor((new Date(g.ends_at)-new Date(now))/1000)):0};
   })};
 });
}
export async function openTrialProduct(identity,tenantId,slug) {
 const p=productNavigation.find(p=>p.slug===slug);
 if(!p)throw new KernelError(400,'INVALID_PRODUCT','اختر منتجًا صالحًا.');
 // Check the trial before returning a route; the destination independently
 // checks and consumes its own operation. Route checks do not spend quota.
 const home=await trialHome(identity,tenantId);
 if(!home.products.find(p=>p.slug===slug)?.operations.length)throw new KernelError(403,'TRIAL_UNAVAILABLE','انتهت التجربة أو الحصة؛ المختبر العام متاح.');
 await transaction(async db=>{
  await setActorScope(db,identity.userId);
  await assertTenantMembership(db,identity,tenantId);
 });
 return {href:`${p.workspacePath}?workspace=${encodeURIComponent(tenantId)}`};
}
