import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-human-gate]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'),area=get('[data-private]'),workspace=get<HTMLSelectElement>('[data-workspace]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false,page=1,view='mine',filter='',hasMore=false,canManage=false,canReview=false,canDelegate=false,policy:any=null,reviewers:any[]=[],delegations:any[]=[],epoch=0,active:AbortController|null=null;
const labels:Record<string,string>={PENDING:'بانتظار المراجعة',APPROVED:'معتمد — لم يُنفذ',REJECTED:'مرفوض',EXPIRED:'منتهي الصلاحية',CANCELLED:'ملغى',EXECUTED:'نُفّذ'};
const eventLabels:Record<string,string>={CREATED:'أُنشئ الطلب',APPROVED:'اعتُمد الطلب',REJECTED:'رُفض الطلب',EXPIRED:'أُوقفت صلاحية الطلب',CANCELLED:'أُلغي الطلب',EXECUTED:'نُفّذت العملية'};
const reasons:Record<string,string>={TIMEOUT:'انتهت المهلة',POLICY_CHANGED:'تغيرت السياسة أو أُوقفت',TARGET_CHANGED:'تغير الهدف أو نسخته',AUTHORITY_CHANGED:'تغير النطاق أو الصلاحية أو التفويض',LEGACY_UNBOUND:'طلب قديم غير مربوط ببصمة؛ يلزم طلب جديد',BINDING_UPGRADED:'طلب سابق لبصمة المورد v3؛ يلزم طلب جديد',CANCELLED_BY_REQUESTER:'ألغاه مقدم الطلب',CANCELLED_BY_REVIEWER:'ألغاه مراجع مخول'};
const levelLabels:Record<string,string>={ADMIN:'مدير',OWNER:'مالك'};
const operationLabels:Record<string,string>={KERNEL_WORKSPACE_RENAME:'تغيير اسم مساحة العمل',INTERNAL_DEMO_NOTE:'ملاحظة داخلية تجريبية'};
const time=(value:string)=>new Date(value).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh',dateStyle:'medium',timeStyle:'medium'});
function node(tag:string,value:string){const el=document.createElement(tag);el.textContent=value;return el;}
function clear(){area.hidden=true;get('[data-requests]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';get('[data-refreshed]').textContent='';policy=null;canManage=false;canReview=false;canDelegate=false;reviewers=[];delegations=[];get('[data-delegation-panel]').hidden=true;get('[data-delegate-user]').replaceChildren();get('[data-delegations]').replaceChildren();}
function scopeFields(){
 const rename=get<HTMLSelectElement>('[name=operation_type]').value==='KERNEL_WORKSPACE_RENAME';
 get('[data-rename]').hidden=!rename;get<HTMLInputElement>('[name=new_name]').required=rename;
}
async function api(path='',body?:object,area:'requests'|'policy'|'delegations'='requests'){
 if(!auth)throw new Error('يلزم إعداد الدخول عبر Neon Auth.');
 const generation=epoch,session=await getWorkspaceSession(auth),token=await auth.getJWTToken();
 if(generation!==epoch)throw new Error('تغيرت الجلسة؛ حدّث البيانات.');
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const query=new URLSearchParams({view,status:filter,page:String(page)});if(workspace.value)query.set('workspace',workspace.value);
 const route=area==='policy'?'policy/':area==='delegations'?`delegations/${path}`:`requests/${path}`;
 const response=await appFetch(auth,`/app/api/human-gate/${route}?${query}`,{method:body?'POST':'GET',cache:'no-store',signal:active?.signal,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(generation!==epoch)throw new Error('تغيرت الجلسة؛ حدّث البيانات.');
 if(!response.ok)throw new Error(data.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ.');
 return data;
}
function sync(){
 get('[data-delegation-panel]').hidden=!canManage;get('form[data-delegate]').hidden=!canDelegate;
 root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;
 get<HTMLButtonElement>('[data-create-submit]').disabled=busy||!policy?.enabled;
 const renameOption=get<HTMLOptionElement>('[name=operation_type] option[value=KERNEL_WORKSPACE_RENAME]');renameOption.disabled=!canManage;
}
async function run(task:()=>Promise<void>,success='تم تحديث البيانات من الخادم.'){
 if(busy)return;
 busy=true;active=new AbortController();const generation=epoch;
 root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=true);status.textContent='جارٍ التحقق والحفظ من الخادم…';
 try{await task();if(generation===epoch)status.textContent=success;}
 catch(error:any){
  if(generation===epoch){clear();status.textContent=`${error.message||'تعذر إكمال الطلب.'} حدّث البيانات لاستعادة الحالة من الخادم. إذا انقطع الاتصال بعد الإرسال، لا تعِد الإرسال قبل مراجعة نتيجة الطلب.`;}
 }
 finally{busy=false;active=null;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=false);sync();}
}
function renderDelegations(){
 const list=get('[data-delegations]');list.replaceChildren();
 const select=get<HTMLSelectElement>('[data-delegate-user]');
 select.replaceChildren(...reviewers.map((reviewer:any)=>{const option=document.createElement('option');option.value=reviewer.user_id;option.textContent=`${reviewer.name||'عضو'} · ${levelLabels[reviewer.role]||reviewer.role}`;return option;}));
 get('[data-delegation-empty]').hidden=delegations.length>0;
 for(const delegation of delegations){
  const item=document.createElement('li');item.className='hg-delegation';
  const title=node('strong',`${delegation.delegatee_name||'عضو'} · ${operationLabels[delegation.operation_type]||delegation.operation_type}`);
  const meta=node('span',`${levelLabels[delegation.level]||delegation.level} · ${delegation.revoked_at?'ملغى':'نشط'} · ينتهي ${time(delegation.expires_at)}${delegation.revoked_at?` · ${reasons[delegation.revoke_reason]||delegation.revoke_reason||''}`:''}`);
  item.append(title,meta);
  if(!delegation.revoked_at&&canManage){
   const form=document.createElement('form');form.className='hg-revoke';
   const input=document.createElement('input');input.type='text';input.required=true;input.minLength=2;input.maxLength=500;input.placeholder='سبب الإلغاء';input.setAttribute('aria-label','سبب إلغاء التفويض');
   const button=document.createElement('button');button.type='submit';button.textContent='إلغاء التفويض';
   form.append(input,button);
   form.addEventListener('submit',event=>{event.preventDefault();void run(async()=>{await api(`${delegation.id}/revoke/`,{reason:input.value},'delegations');await load();},'أُلغي التفويض من الخادم؛ لا يسري على قرارات جديدة.');});
   item.append(form);
  }
  list.append(item);
 }
}
async function load(){
 const data=await api();hasMore=data.hasMore;canManage=data.canManage;canDelegate=!!data.canDelegate;policy=data.policy;reviewers=data.reviewers||[];delegations=data.delegations||[];
 setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const o=document.createElement('option');o.value=m.tenant_id;o.textContent=m.name;o.selected=m.tenant_id===data.tenant.tenant_id;return o;}));
 get('[data-role]').textContent=`الدور الحالي: ${data.tenant.role} · اسم المساحة: ${data.tenant.name}`;
 get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=data.requests.length>0;
 get('[data-review-notice]').hidden=view!=='review'||canReview;
 get('[data-refreshed]').textContent=`آخر حالة محفوظة من الخادم: ${time(data.serverTime)} بتوقيت الرياض. تُحدّث صلاحية الأزرار تلقائيًا عند أقرب مهلة؛ الخادم يعيد التحقق عند كل إجراء.`;
 get('[data-policy-summary]').textContent=policy?`${policy.enabled?'مفعّلة':'متوقفة'} · مهلة الطلب ${policy.pending_minutes} دقيقة · صلاحية الموافقة ${policy.approval_minutes} دقيقة دون تمديد مهلة الطلب · مستوى المراجعة ${levelLabels[policy.review_level]||policy.review_level||'مدير'} · ${policy.separation_of_duties===false?'فصل المهام غير مفعّل (يظل إلزاميًا لتغيير الاسم)':'فصل المهام مفعّل'} · التفويض ${policy.delegation_enabled?'مفعّل':'غير مفعّل'} · النسخة ${policy.version}`:'لا سياسة محفوظة؛ يلزم أن يحدد المالك أو المسؤول المهل ويفعّلها أولًا.';
 const policyForm=get<HTMLFormElement>('[data-policy]');policyForm.hidden=!canManage;
 (policyForm.elements.namedItem('pending_minutes') as HTMLInputElement).value=policy?String(policy.pending_minutes):'';
 (policyForm.elements.namedItem('approval_minutes') as HTMLInputElement).value=policy?String(policy.approval_minutes):'';
 (policyForm.elements.namedItem('enabled') as HTMLInputElement).checked=!!policy?.enabled;
 (policyForm.elements.namedItem('review_level') as HTMLSelectElement).value=policy?.review_level??'ADMIN';
 (policyForm.elements.namedItem('separation_of_duties') as HTMLInputElement).checked=policy?.separation_of_duties!==false;
 (policyForm.elements.namedItem('delegation_enabled') as HTMLInputElement).checked=!!policy?.delegation_enabled;
 renderDelegations();
 if(!canManage)get<HTMLSelectElement>('[name=operation_type]').value='INTERNAL_DEMO_NOTE';scopeFields();
 const list=get('[data-requests]');list.replaceChildren();
 for(const request of data.requests){
  const card=document.createElement('article');card.className='hg-request';card.append(node('h3',request.title));const state=node('p',labels[request.status]||request.status);state.className='hg-state';card.append(state);
  const rename=request.operation_type==='KERNEL_WORKSPACE_RENAME';
  const fields:Record<string,string>={'مرجع الطلب':request.id,'العملية':rename?'تغيير اسم مساحة العمل في Kernel':'ملاحظة داخلية تجريبية','المورد':request.provider_ref||'غير محدد','مرجع الهدف':request.subject_ref,'الوصف':request.description,'سبب الإحالة':request.reason,'مرجع مقدم الطلب':request.requester_id,'وقت الإنشاء':time(request.created_at),'موعد انتهاء الصلاحية':time(request.expires_at),'نسخة السياسة':request.policy_version,'إصدار الربط':request.binding_version||'غير محدد','بصمة العملية':request.payload_digest||'طلب قديم دون بصمة'};
  if(request.status==='APPROVED'&&request.approval_expires_at)fields['صلاحية الموافقة حتى']=time(request.approval_expires_at);
  if(rename){fields['الاسم عند إنشاء الطلب']=request.payload.expected_name;fields['نسخة المساحة المطلوبة']=request.payload.expected_version;fields['الاسم المطلوب تنفيذه']=request.payload.new_name;}
  if(request.terminal_reason)fields['سبب الإيقاف']=reasons[request.terminal_reason]||request.terminal_reason;
  if(request.decision){fields['القرار']=request.decision==='APPROVE'?'موافقة':'رفض';fields['مستوى سلطة القرار']=request.decision_level?levelLabels[request.decision_level]||request.decision_level:'غير محدد';fields['مرجع القرار']=request.decision_id;fields['مرجع المراجع']=request.reviewer_id;fields['سبب القرار']=request.decision_reason;fields['وقت القرار']=time(request.decided_at);}
  if(request.status==='CANCELLED'){fields['سبب الإلغاء']=request.cancel_reason;fields['ملغى بواسطة']=request.cancelled_by;fields['وقت الإلغاء']=time(request.cancelled_at);}
  if(request.grant){fields['إذن التنفيذ']=`${request.grant.status==='ACTIVE'?'نشط':request.grant.status==='CONSUMED'?'مستهلك':request.grant.status} · ينتهي ${time(request.grant.expires_at)}`;if(request.grant.consumed_at)fields['وقت استهلاك الإذن']=time(request.grant.consumed_at);}else if(request.status==='PENDING'){fields['إذن التنفيذ']='لم يصدر بعد؛ يلزم قرار موافقة.';}
  if(request.status==='EXECUTED'){fields['الأثر الفعلي']=rename?`تغيّر اسم المساحة من «${request.payload.expected_name}» إلى «${request.payload.new_name}» داخل Kernel.`:'اكتمل تسجيل الملاحظة التجريبية فقط؛ لا أثر على أنظمة خارجية.';fields['وقت التنفيذ']=time(request.completed_at);fields['المنفذ']=request.executed_by;fields['نتيجة الخادم']=JSON.stringify(request.execution_result);}
  const dl=document.createElement('dl');for(const [label,value]of Object.entries(fields)){const dd=node('dd',value);if(['مرجع الطلب','مرجع الهدف','مرجع مقدم الطلب','نسخة السياسة','إصدار الربط','بصمة العملية','مرجع القرار','مرجع المراجع','المنفذ'].includes(label))dd.dir='ltr';dl.append(node('dt',label),dd);}card.append(dl);
  if(['PENDING','APPROVED'].includes(request.status)&&!request.bindingValid)card.append(node('p','تغيرت صلاحية العملية أو الهدف أو السياسة. الإجراء غير متاح؛ أنشئ طلبًا جديدًا.'));
  if(request.status==='APPROVED'&&request.isRequester&&request.bindingValid&&!request.canExecute)card.append(node('p','إذن التنفيذ غير نشط أو تغيّرت صلاحية المراجع أو التفويض. لا يمكن التنفيذ؛ أنشئ طلبًا جديدًا أو أعد الاعتماد ضمن سياسة سارية.'));
  if(request.canDecide){
   const form=document.createElement('form'),label=node('label','سبب القرار (إلزامي، دون بيانات حساسة)'),input=document.createElement('textarea');input.id=`reason-${request.id}`;label.setAttribute('for',input.id);input.required=true;input.minLength=2;input.maxLength=500;input.rows=2;const actions=document.createElement('div');actions.className='hg-actions';
   for(const [decision,title]of [['APPROVE','اعتماد الطلب المحدد'],['REJECT','رفض الطلب']]){const button=document.createElement('button');button.type='submit';button.value=decision;button.textContent=title;actions.append(button);}
   form.append(label,input,actions);form.addEventListener('submit',event=>{event.preventDefault();const decision=(event.submitter as HTMLButtonElement|null)?.value;if(!decision)return;const reason=input.value;void run(async()=>{await api(`${request.id}/decide/`,{decision,reason});view=decision==='REJECT'?'completed':'mine';filter='';page=1;get<HTMLSelectElement>('[data-filter]').value='';await load();},'حُفظ القرار من الخادم. الموافقة لا تعني أن العملية نُفّذت.');});card.append(form);
  }else if(request.status==='PENDING')card.append(node('p','بانتظار مراجع مخول مستقل. مقدم الطلب لا يراجع طلبه.'));
  if(request.canCancel){const form=document.createElement('form'),label=node('label','سبب الإلغاء (إلزامي، دون بيانات حساسة)'),input=document.createElement('textarea');input.id=`cancel-${request.id}`;label.setAttribute('for',input.id);input.required=true;input.minLength=2;input.maxLength=500;input.rows=2;const button=document.createElement('button');button.type='submit';button.textContent=request.status==='APPROVED'?'إلغاء الطلب وإبطال إذن التنفيذ':'إلغاء الطلب';form.append(label,input,button);form.addEventListener('submit',event=>{event.preventDefault();void run(async()=>{await api(`${request.id}/cancel/`,{reason:input.value});view='completed';filter='';page=1;get<HTMLSelectElement>('[data-filter]').value='';await load();},'حُفظ إلغاء الطلب من الخادم وأُبطل أي إذن تنفيذ نشط.');});card.append(form);}
  if(request.canExecute){const button=document.createElement('button');button.type='button';button.textContent=rename?'تنفيذ تغيير اسم المساحة الموافق عليه':'إكمال الملاحظة التجريبية';button.addEventListener('click',()=>void run(async()=>{await api(`${request.id}/execute/`,{});view='completed';filter='';page=1;get<HTMLSelectElement>('[data-filter]').value='';await load();},'حفظ الخادم نتيجة التنفيذ وسجل العملية.'));card.append(button);}
  const details=document.createElement('details');details.append(node('summary','سجل الطلب والقرار والتنفيذ'));const history=document.createElement('ol');
  for(const item of request.history){history.append(node('li',`${eventLabels[item.event_type]||item.event_type} · ${time(item.created_at)} · الفاعل ${item.actor_user_id}${item.reason_code?` · ${reasons[item.reason_code]||item.reason_code}`:''} · مرجع التدقيق ${item.audit_id}`));}
  details.append(history.childElementCount?history:node('p','هذا طلب تاريخي سابق لسجل الدورة الجديد؛ تفاصيله المحفوظة معروضة أعلاه.'));card.append(details);list.append(card);
 }
 area.hidden=false;
 scheduleRefresh(data.requests,data.serverTime);
}
let refreshTimer:ReturnType<typeof setTimeout>|null=null;
function scheduleRefresh(requests:any[],serverTime:string){
 if(refreshTimer)clearTimeout(refreshTimer);refreshTimer=null;
 const waits=requests.filter(r=>['PENDING','APPROVED'].includes(r.status)).map(r=>new Date(r.expires_at).getTime()-new Date(serverTime).getTime());
 if(waits.length)refreshTimer=setTimeout(()=>{
  // Hide stale actions while obtaining DB state; no local status rewrite.
  if(busy){refreshTimer=setTimeout(()=>void run(load),1000);return;}
  get('[data-requests]').replaceChildren();void run(load);
 },Math.max(1000,Math.min(...waits)+250));
}
get('[data-reload]').addEventListener('click',()=>void run(load));
workspace.addEventListener('change',()=>{page=1;get('[data-requests]').replaceChildren();void run(load);});
root.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.view!;filter='';get<HTMLSelectElement>('[data-filter]').value='';page=1;void run(load);}));
get<HTMLSelectElement>('[data-filter]').addEventListener('change',event=>{filter=(event.target as HTMLSelectElement).value;page=1;void run(load);});
get<HTMLSelectElement>('[name=operation_type]').addEventListener('change',scopeFields);
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('form[data-create]').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,fields=new FormData(form);const body={...Object.fromEntries(fields.entries()),synthetic_confirmed:fields.has('synthetic_confirmed')};if(fields.get('operation_type')==='INTERNAL_DEMO_NOTE')delete (body as any).new_name;void run(async()=>{await api('',body);form.reset();view='mine';filter='';page=1;get<HTMLSelectElement>('[data-filter]').value='';await load();},'حُفظ الطلب للمراجعة. لم تُنفذ العملية.');});
get('form[data-policy]').addEventListener('submit',event=>{event.preventDefault();const fields=new FormData(event.currentTarget as HTMLFormElement),body={version:policy?.version??null,pending_minutes:Number(fields.get('pending_minutes')),approval_minutes:Number(fields.get('approval_minutes')),enabled:fields.has('enabled'),review_level:fields.get('review_level'),separation_of_duties:fields.has('separation_of_duties'),delegation_enabled:fields.has('delegation_enabled')};void run(async()=>{await api('',body,'policy');await load();},'حُفظت السياسة وأُبطلت الطلبات والموافقات وأذونات التنفيذ السابقة من الخادم.');});
get('form[data-delegate]').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement,fields=new FormData(form),body={delegatee_id:String(fields.get('delegatee_id')||''),operation_type:String(fields.get('operation_type')||''),level:String(fields.get('level')||''),minutes:Number(fields.get('minutes')),reason:String(fields.get('reason')||'')};void run(async()=>{await api('',body,'delegations');form.reset();await load();},'حُفظ التفويض المؤقت من الخادم ضمن العملية والمستوى والمدة المحددة.');});
function end(){epoch++;active?.abort();if(refreshTimer)clearTimeout(refreshTimer);refreshTimer=null;clear();}
window.addEventListener('pagehide',end);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&auth&&!area.hidden)void run(load);});
document.addEventListener('workspace-session-ended',()=>{end();status.textContent='انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.';});
if(auth)void run(load);
