// Browser-only simulation. No identity, credentials, network, or persistent storage.
export const lifecycle = {PENDING:['APPROVED','REJECTED','EXPIRED','CANCELLED'],APPROVED:['EXECUTED','EXPIRED','CANCELLED'],REJECTED:[],EXPIRED:[],CANCELLED:[],EXECUTED:[]};
export function createQueue(){return [
 {id:'HG-DEMO-01',title:'مراجعة ملاحظة داخلية اصطناعية',status:'PENDING',reason:'ESCALATE: المثال يحتاج مراجعة مستقلة قبل الاستكمال.',decision:null,permit:null},
 {id:'HG-DEMO-02',title:'ملاحظة خارج النطاق',status:'REJECTED',reason:'رفض المراجع: النطاق غير مبرر.',decision:'REJECT',permit:null},
 {id:'HG-DEMO-03',title:'طلب سحبه مقدمه',status:'CANCELLED',reason:'CANCELLED_BY_REQUESTER: لم تعد الملاحظة مطلوبة.',decision:null,permit:null},
 {id:'HG-DEMO-04',title:'موافقة انتهى تفويض مراجعها',status:'EXPIRED',reason:'AUTHORITY_CHANGED: انتهى التفويض؛ يلزم طلب جديد.',decision:'APPROVE',permit:'REVOKED'}
].map(r=>({...r,authority:true,history:[r.reason]}));}
export function act(request,persona,action,reason){
 const r=structuredClone(request);
 const active=['PENDING','APPROVED'].includes(r.status);
 if(!active) throw Error('الطلب مغلق؛ أنشئ طلبًا جديدًا.');
 if(!['requester','reviewer'].includes(persona)) throw Error('شخصية المثال غير صالحة.');
 if(['APPROVE','REJECT','CLARIFY'].includes(action)){
  if(persona==='requester') throw Error('SELF_REVIEW_DENIED: فصل المهام يمنع مقدم الطلب من مراجعة طلبه، حتى لو امتلك دورًا إداريًا.');
  if(r.status!=='PENDING'||!r.authority) throw Error('المراجعة تتطلب طلبًا معلقًا ومراجعًا مخولًا.');
 }
 if(action!=='EXECUTE' && (typeof reason!=='string'||reason.trim().length<2||reason.trim().length>500)) throw Error('اكتب سببًا من حرفين إلى 500 حرف، باستخدام بيانات خيالية فقط.');
 if(action==='CLARIFY'){
  r.history.push('ملاحظة توضيح محلية فقط: '+reason.trim()); return r;
 }
 const target={APPROVE:'APPROVED',REJECT:'REJECTED',CANCEL:'CANCELLED',EXPIRE:'EXPIRED',AUTHORITY_LOST:'EXPIRED',EXECUTE:'EXECUTED'}[action];
 if(!lifecycle[r.status].includes(target)) throw Error('انتقال غير مسموح في دورة الطلب.');
 if(action==='EXECUTE'&&(persona!=='requester'||r.permit!=='ACTIVE'||!r.authority)) throw Error('التنفيذ لمقدم الطلب فقط مع إذن ACTIVE وصلاحية مراجع سارية وربط مطابق.');
 if(action==='AUTHORITY_LOST') r.authority=false;
 if(action==='APPROVE'||action==='REJECT') r.decision=action;
 r.status=target;
 r.permit=action==='APPROVE'?'ACTIVE':action==='EXECUTE'?'CONSUMED':r.permit==='ACTIVE'?(action==='EXPIRE'?'EXPIRED':'REVOKED'):r.permit;
 r.reason=action==='EXECUTE'?'استهلك مقدم الطلب الإذن مرة واحدة؛ اكتملت الملاحظة الاصطناعية فقط.':action==='AUTHORITY_LOST'?'AUTHORITY_CHANGED: انتهى تفويض المراجع؛ القرار البشري باقٍ، والتنفيذ ممنوع.':action==='EXPIRE'?'TIMEOUT: انتهت مهلة الطلب أو الموافقة؛ يلزم طلب جديد.':reason.trim();
 r.history.push(r.status+' · '+r.reason); return r;
}
export function ledgerEvent(r){return {synthetic:true,event:r.status==='EXECUTED'?'human_gate.demo_note.completed':'human_gate.decision.recorded',request_ref:r.id,operation_scope:'INTERNAL_DEMO_NOTE',decision:r.decision,status:r.status};}
