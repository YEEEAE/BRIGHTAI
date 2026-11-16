import { kernelHandler, exact } from '../../../server/kernel/http.mjs';
import { startTrial, trialHome, openTrialProduct } from '../../../server/kernel/self-service-trial.mjs';
export const prerender=false;
export const GET=kernelHandler(trialHome);
export const POST=kernelHandler(async(identity,workspace,body)=>{
 exact(body,['operation','product']);
 if(body.operation==='start' && body.product===undefined)return startTrial(identity);
 if(body.operation==='open')return openTrialProduct(identity,workspace,body.product);
 const {KernelError}=await import('../../../server/kernel/core.mjs');
 throw new KernelError(400,'INVALID_OPERATION','العملية غير صالحة.');
},true);
