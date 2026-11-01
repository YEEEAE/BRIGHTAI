import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-ledger]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'), area=get('[data-private]');
const workspace=get<HTMLSelectElement>('[data-workspace]'), type=get<HTMLSelectElement>('[data-type]'), period=get<HTMLSelectElement>('[data-period]');
const source=get<HTMLSelectElement>('[data-source]'), classification=get<HTMLSelectElement>('[data-classification]');
const search=get<HTMLInputElement>('[data-search-input]');
const dialog=get<HTMLDialogElement>('[data-detail]'), integrity=get('[data-integrity]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false,page=1,selected:any=null,hasMore=false,epoch=0;
let pendingSynthetic:{key:string;event_type:string;scenario:string;workspace:string}|null=null;
const resultLabels:Record<string,string>={MATCH:'مطابق ضمن النطاق',MISMATCH:'غير مطابق — راجع الدليل',INDETERMINATE:'تعذر حسم السلامة',EMPTY:'السجل فارغ'};
const resultLabel=(value:string)=>resultLabels[value]||'لم يُفحص';
function clearDetail(){selected=null;get('[data-fields]').replaceChildren();integrity.textContent='لم يُفحص بعد.';if(dialog.open)dialog.close();}
function clearPrivate(){epoch++;area.hidden=true;clearDetail();get('[data-events]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';get('[data-chain]').textContent='';pendingSynthetic=null;}
async function api(path='',method='GET',body?:object){
 if(!auth)throw new Error('يلزم إعداد الدخول.');
 const generation=epoch;
 const session=await getWorkspaceSession(auth);const token=session.data?.session?.token;
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const params=new URLSearchParams({type:type.value,source:source.value,classification:classification.value,period:period.value,page:String(page),q:search.value});if(workspace.value)params.set('workspace',workspace.value);
 const response=await appFetch(auth,`/app/api/ledger/events/${path}?${params}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(generation!==epoch)throw new Error('تغيرت الجلسة؛ حدّث السجل.');
 if(!response.ok)throw new Error(data.message||'تعذر إكمال الطلب.');return data;
}
const time=(value:string)=>new Date(value).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'});
const labels:Record<string,string>={'synthetic.test.created':'اختبار اصطناعي','synthetic.review.recorded':'مراجعة اصطناعية','firewall.decision.recorded':'قرار Firewall','human_gate.request.created':'طلب Human Gate','human_gate.decision.recorded':'قرار Human Gate','human_gate.demo_note.completed':'تنفيذ ملاحظة تجريبية','risk_engine.asset.created':'إنشاء أصل','risk_engine.asset.updated':'تحديث أصل','risk_engine.assessment.created':'تقييم مخاطر','kernel.audit.recorded':'إجراء Kernel'};
function syncButtons(){get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;}
async function run(task:()=>Promise<void>){
 if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=true);status.textContent='جارٍ تنفيذ الطلب…';
 try{await task();status.textContent='اكتمل طلب الخادم؛ راجع حالة السلامة المعروضة وحدودها.';}
 catch(error:any){clearDetail();area.hidden=true;get('[data-events]').replaceChildren();status.textContent=error.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ أو التحقق.';}
 finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=false);syncButtons();}
}
async function detail(id:string){
 const data=await api(`${id}/`);selected=data.event;const dl=get('[data-fields]');dl.replaceChildren();
 get('[data-event-classification]').textContent=selected.metadata_json.synthetic?'حدث اصطناعي أو عملية تجريبية، وليس إثبات تنفيذ خارجي.':'حدث من مسار التطبيق الخادمي؛ لا يثبت صحة القرار أو اعتماد امتثال.';
 const names:Record<string,string>={event_id:'معرّف الحدث',source:'المصدر',event_type:'النوع',policy_version:'نسخة السياسة / طريقة المصدر',metadata_json:'البيانات الوصفية المسموحة',created_at:'وقت الخادم — الرياض',created_by:'مرجع الفاعل',hash_profile:'إصدار طريقة البصمة',sequence_no:'التسلسل داخل المؤسسة',previous_hash:'بصمة الحدث السابق',idempotency_key:'مرجع منع التكرار',integrity_hash:'بصمة SHA-256'};
 for(const [key,label] of Object.entries(names)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=key==='metadata_json'?JSON.stringify(selected[key],null,2):key==='created_at'?time(selected[key]):String(selected[key]??'بداية السلسلة');dl.append(dt,dd);}
 get('[data-export]').hidden=!data.permissions.export;
 integrity.textContent=`الحدث: ${resultLabel(data.integrity)}. السلسلة حتى هذا الحدث: ${resultLabel(data.chain.result)}. ليس توقيعًا مستقلًا.`;
 if(!dialog.open)dialog.showModal();get<HTMLButtonElement>('[data-close]').focus();
}
async function load(){
 const data=await api();hasMore=data.hasMore;page=data.page;
 setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const option=document.createElement('option');option.value=m.tenant_id;option.textContent=m.name;option.selected=m.tenant_id===data.tenant.tenant_id;return option;}));
 get('[data-role]').textContent=`الدور: ${data.tenant.role} · ${data.permissions.create?'الإضافة الاصطناعية والتصدير متاحان':'عرض وفحص فقط؛ الإضافة والتصدير للمالك والمسؤول'}`;
 get('[data-create-panel]').hidden=!data.permissions.create;get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=data.events.length!==0;
 get('[data-chain]').textContent=`سلامة السلسلة حتى أحدث حدث في الصفحة: ${resultLabel(data.chain.result)}${data.chain.reason==='PREFIX_LIMIT'?' — تجاوز حد الفحص الأساسي (10000 حدث).':''}`;
 const tbody=get('[data-events]');tbody.replaceChildren();
 for(const event of data.events){
  const tr=document.createElement('tr');
  const ref=event.metadata_json.decision_ref||event.metadata_json.request_ref||event.metadata_json.assessment_ref||event.metadata_json.asset_ref||event.metadata_json.audit_ref;
  for(const value of [time(event.created_at),labels[event.event_type]||event.event_type,ref,event.created_by,`${resultLabel(event.integrity)} / ${resultLabel(event.chain_integrity)}`]){
   const td=document.createElement('td'),bdi=document.createElement('bdi');bdi.textContent=value;td.append(bdi);
   if(tr.children.length===1){const small=document.createElement('small');small.textContent=`${event.source} · ${event.metadata_json.synthetic?'اصطناعي / تجريبي':'تشغيلي داخل التطبيق'}`;td.append(small);const profile=document.createElement('small');profile.textContent=event.hash_profile;td.append(profile);}
   tr.append(td);
  }
  const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='عرض الحدث';button.addEventListener('click',()=>void run(()=>detail(event.event_id)));td.append(button);tr.append(td);tbody.append(tr);
 }
 area.hidden=false;
}
get('[data-reload]').addEventListener('click',()=>void run(async()=>{clearDetail();await load();}));
for(const select of [workspace,type,source,classification,period])select.addEventListener('change',()=>{page=1;clearDetail();if(select===workspace)pendingSynthetic=null;void run(load);});
get('[data-search]').addEventListener('click',()=>{page=1;clearDetail();void run(load);});
search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();page=1;clearDetail();void run(load);}});
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('form[data-create]').addEventListener('submit',event=>{
 event.preventDefault();
 // Capture values before run() disables selects; disabled fields are omitted by FormData.
 const form=new FormData(event.currentTarget as HTMLFormElement),event_type=String(form.get('event_type')),scenario=String(form.get('scenario'));
 void run(async()=>{
 if(!pendingSynthetic||pendingSynthetic.event_type!==event_type||pendingSynthetic.scenario!==scenario||pendingSynthetic.workspace!==workspace.value)pendingSynthetic={key:crypto.randomUUID(),event_type,scenario,workspace:workspace.value};
 const data=await api('','POST',{event_type,scenario,idempotency_key:pendingSynthetic.key});pendingSynthetic=null;
 page=1;type.value='';source.value='';classification.value='';period.value='all';search.value='';await load();await detail(data.event.event_id);
});});
get('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{selected=null;get('[data-fields]').replaceChildren();});
get('[data-verify]').addEventListener('click',()=>void run(async()=>{if(!selected)return;const data=await api(`${selected.event_id}/verify/`,'POST',{});integrity.textContent=`الحدث: ${resultLabel(data.result)}. السلسلة: ${resultLabel(data.chain.result)}. ليس توقيعًا مستقلًا.`;}));
get('[data-export]').addEventListener('click',()=>void run(async()=>{if(!selected)return;const id=selected.event_id;const data=await api(`${id}/export/`);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`ledger-${id}.json`;a.click();integrity.textContent=`اكتمل تصدير ${data.manifest.event_count} حدثًا بعد صلاحية وتدقيق الخادم. سلامة الحزمة: ${resultLabel(data.verification.result)}.`;setTimeout(()=>URL.revokeObjectURL(url),1000);}));
window.addEventListener('pagehide',clearPrivate);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
if(auth)void run(load);
document.addEventListener('workspace-session-ended',()=>{clearPrivate();status.textContent='انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.';});
