import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-human-gate]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'),area=get('[data-private]'),workspace=get<HTMLSelectElement>('[data-workspace]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false,page=1,view='mine',filter='',hasMore=false,canManage=false,policy:any=null,epoch=0,active:AbortController|null=null;
const labels:Record<string,string>={PENDING:'بانتظار المراجعة',APPROVED:'معتمد — لم يُنفذ',REJECTED:'مرفوض',EXPIRED:'منتهي الصلاحية',EXECUTED:'نُفّذ'};
const eventLabels:Record<string,string>={CREATED:'أُنشئ الطلب',APPROVED:'اعتُمد الطلب',REJECTED:'رُفض الطلب',EXPIRED:'أُوقفت صلاحية الطلب',EXECUTED:'نُفّذت العملية'};
const reasons:Record<string,string>={TIMEOUT:'انتهت المهلة',POLICY_CHANGED:'تغيرت السياسة أو أُوقفت',TARGET_CHANGED:'تغير الهدف أو نسخته',AUTHORITY_CHANGED:'تغير النطاق أو الصلاحية',LEGACY_UNBOUND:'طلب قديم غير مربوط ببصمة؛ يلزم طلب جديد'};
const time=(value:string)=>new Date(value).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh',dateStyle:'medium',timeStyle:'medium'});
function node(tag:string,value:string){const el=document.createElement(tag);el.textContent=value;return el;}
function clear(){area.hidden=true;get('[data-requests]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';get('[data-refreshed]').textContent='';policy=null;canManage=false;}
function scopeFields(){
 const rename=get<HTMLSelectElement>('[name=operation_type]').value==='KERNEL_WORKSPACE_RENAME';
 get('[data-rename]').hidden=!rename;get<HTMLInputElement>('[name=new_name]').required=rename;
}
async function api(path='',body?:object,policyRoute=false){
 if(!auth)throw new Error('يلزم إعداد الدخول عبر Neon Auth.');
 const generation=epoch,session=await getWorkspaceSession(auth),token=session.data?.session?.token;
 if(generation!==epoch)throw new Error('تغيرت الجلسة؛ حدّث البيانات.');
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const query=new URLSearchParams({view,status:filter,page:String(page)});if(workspace.value)query.set('workspace',workspace.value);
 const route=policyRoute?'policy/':`requests/${path}`;
 const response=await appFetch(auth,`/app/api/human-gate/${route}?${query}`,{method:body?'POST':'GET',cache:'no-store',signal:active?.signal,headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(generation!==epoch)throw new Error('تغيرت الجلسة؛ حدّث البيانات.');
 if(!response.ok)throw new Error(data.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ.');
 return data;
}
function sync(){
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
async function load(){
 const data=await api();hasMore=data.hasMore;canManage=data.canManage;policy=data.policy;
 setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const o=document.createElement('option');o.value=m.tenant_id;o.textContent=m.name;o.selected=m.tenant_id===data.tenant.tenant_id;return o;}));
 get('[data-role]').textContent=`الدور الحالي: ${data.tenant.role} · اسم المساحة: ${data.tenant.name}`;
 get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=data.requests.length>0;
 get('[data-review-notice]').hidden=view!=='review'||canManage;
 get('[data-refreshed]').textContent=`آخر حالة محفوظة من الخادم: ${time(data.serverTime)} بتوقيت الرياض. تُحدّث صلاحية الأزرار تلقائيًا عند أقرب مهلة؛ الخادم يعيد التحقق عند كل إجراء.`;
 get('[data-policy-summary]').textContent=policy?`${policy.enabled?'مفعّلة':'متوقفة'} · مهلة الطلب ${policy.pending_minutes} دقيقة · صلاحية الموافقة ${policy.approval_minutes} دقيقة دون تمديد مهلة الطلب · النسخة ${policy.version}`:'لا سياسة محفوظة؛ يلزم أن يحدد المالك أو المسؤول المهل ويفعّلها أولًا.';
 const policyForm=get<HTMLFormElement>('[data-policy]');policyForm.hidden=!canManage;
 (policyForm.elements.namedItem('pending_minutes') as HTMLInputElement).value=policy?String(policy.pending_minutes):'';
 (policyForm.elements.namedItem('approval_minutes') as HTMLInputElement).value=policy?String(policy.approval_minutes):'';
 (policyForm.elements.namedItem('enabled') as HTMLInputElement).checked=!!policy?.enabled;
 if(!canManage)get<HTMLSelectElement>('[name=operation_type]').value='INTERNAL_DEMO_NOTE';scopeFields();
 const list=get('[data-requests]');list.replaceChildren();
 for(const request of data.requests){
  const card=document.createElement('article');card.className='hg-request';card.append(node('h3',request.title));const state=node('p',labels[request.status]||request.status);state.className='hg-state';card.append(state);
  const rename=request.operation_type==='KERNEL_WORKSPACE_RENAME';
  const fields:Record<string,string>={'مرجع الطلب':request.id,'العملية':rename?'تغيير اسم مساحة العمل في Kernel':'ملاحظة داخلية تجريبية','مرجع الهدف':request.subject_ref,'الوصف':request.description,'سبب الإحالة':request.reason,'مرجع مقدم الطلب':request.requester_id,'وقت الإنشاء':time(request.created_at),'موعد انتهاء الصلاحية':time(request.expires_at),'نسخة السياسة':request.policy_version,'بصمة العملية':request.payload_digest||'طلب قديم دون بصمة'};
  if(rename){fields['الاسم عند إنشاء الطلب']=request.payload.expected_name;fields['نسخة المساحة المطلوبة']=request.payload.expected_version;fields['الاسم المطلوب تنفيذه']=request.payload.new_name;}
  if(request.terminal_reason)fields['سبب الإيقاف']=reasons[request.terminal_reason]||request.terminal_reason;
  if(request.decision){fields['القرار']=request.decision==='APPROVE'?'موافقة':'رفض';fields['مرجع القرار']=request.decision_id;fields['مرجع المراجع']=request.reviewer_id;fields['سبب القرار']=request.decision_reason;fields['وقت القرار']=time(request.decided_at);}
  if(request.status==='EXECUTED'){fields['نتيجة التنفيذ']=rename?'تغير اسم المساحة داخل Kernel':'اكتمل تسجيل الملاحظة التجريبية فقط';fields['وقت التنفيذ']=time(request.completed_at);fields['المنفذ']=request.executed_by;fields['نتيجة الخادم']=JSON.stringify(request.execution_result);}
  const dl=document.createElement('dl');for(const [label,value]of Object.entries(fields)){const dd=node('dd',value);if(['مرجع الطلب','مرجع الهدف','مرجع مقدم الطلب','نسخة السياسة','بصمة العملية','مرجع القرار','مرجع المراجع','المنفذ'].includes(label))dd.dir='ltr';dl.append(node('dt',label),dd);}card.append(dl);
  if(['PENDING','APPROVED'].includes(request.status)&&!request.bindingValid)card.append(node('p','تغيرت صلاحية العملية أو الهدف أو السياسة. الإجراء غير متاح؛ أنشئ طلبًا جديدًا.'));
  if(request.canDecide){
   const form=document.createElement('form'),label=node('label','سبب القرار (إلزامي، دون بيانات حساسة)'),input=document.createElement('textarea');input.id=`reason-${request.id}`;label.setAttribute('for',input.id);input.required=true;input.minLength=2;input.maxLength=500;input.rows=2;const actions=document.createElement('div');actions.className='hg-actions';
   for(const [decision,title]of [['APPROVE','اعتماد الطلب المحدد'],['REJECT','رفض الطلب']]){const button=document.createElement('button');button.type='submit';button.value=decision;button.textContent=title;actions.append(button);}
   form.append(label,input,actions);form.addEventListener('submit',event=>{event.preventDefault();const decision=(event.submitter as HTMLButtonElement|null)?.value;if(!decision)return;const reason=input.value;void run(async()=>{await api(`${request.id}/decide/`,{decision,reason});view=decision==='REJECT'?'completed':'mine';filter='';page=1;get<HTMLSelectElement>('[data-filter]').value='';await load();},'حُفظ القرار من الخادم. الموافقة لا تعني أن العملية نُفّذت.');});card.append(form);
  }else if(request.status==='PENDING')card.append(node('p','بانتظار مراجع مخول مستقل. مقدم الطلب لا يراجع طلبه.'));
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
get('form[data-policy]').addEventListener('submit',event=>{event.preventDefault();const fields=new FormData(event.currentTarget as HTMLFormElement),body={version:policy?.version??null,pending_minutes:Number(fields.get('pending_minutes')),approval_minutes:Number(fields.get('approval_minutes')),enabled:fields.has('enabled')};void run(async()=>{await api('',body,true);await load();},'حُفظت السياسة وأُبطلت الطلبات السابقة من الخادم.');});
function end(){epoch++;active?.abort();if(refreshTimer)clearTimeout(refreshTimer);refreshTimer=null;clear();}
window.addEventListener('pagehide',end);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&auth&&!area.hidden)void run(load);});
document.addEventListener('workspace-session-ended',()=>{end();status.textContent='انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.';});
if(auth)void run(load);
