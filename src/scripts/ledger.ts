import { createAuthClient } from '@neon/neon-js/auth';
const root=document.querySelector<HTMLElement>('[data-ledger]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'), area=get('[data-private]');
const workspace=get<HTMLSelectElement>('[data-workspace]'), type=get<HTMLSelectElement>('[data-type]'), period=get<HTMLSelectElement>('[data-period]');
const search=get<HTMLInputElement>('[data-search-input]');
const dialog=get<HTMLDialogElement>('[data-detail]'), integrity=get('[data-integrity]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false, page=1, selected:any=null, hasMore=false;
function clearDetail(){selected=null;get('[data-fields]').replaceChildren();integrity.textContent='لم يُفحص بعد.';if(dialog.open)dialog.close();}
function clearPrivate(){area.hidden=true;clearDetail();get('[data-events]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';}
async function api(path='',method='GET',body?:object){
 if(!auth)throw new Error('يلزم إعداد الدخول.');
 const session=await auth.getSession();const token=session.data?.session?.token;
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const params=new URLSearchParams({type:type.value,period:period.value,page:String(page),q:search.value});if(workspace.value)params.set('workspace',workspace.value);
 const response=await fetch(`/app/api/ledger/events/${path}?${params}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw new Error(data.message||'تعذر إكمال الطلب.');return data;
}
const time=(value:string)=>new Date(value).toLocaleString('ar-SA');
const labels:Record<string,string>={'synthetic.test.created':'اختبار اصطناعي','synthetic.review.recorded':'مراجعة اصطناعية'};
function syncButtons(){get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;}
async function run(task:()=>Promise<void>){
 if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=true);status.textContent='جارٍ تنفيذ الطلب…';
 try{await task();status.textContent='تم تحميل البيانات والتحقق من الصلاحيات في الخادم.';}
 catch(error:any){clearPrivate();status.textContent=error.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ أو التحقق.';}
 finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=false);syncButtons();}
}
async function detail(id:string){
 const data=await api(`${id}/`);selected=data.event;const dl=get('[data-fields]');dl.replaceChildren();
 const names:Record<string,string>={event_id:'معرّف الحدث',source:'المصدر',event_type:'النوع',policy_version:'نسخة سياسة الاختبار',metadata_json:'Metadata',created_at:'وقت الخادم',created_by:'مرجع الفاعل',integrity_hash:'بصمة SHA-256'};
 for(const [key,label] of Object.entries(names)){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=key==='metadata_json'?JSON.stringify(selected[key],null,2):key==='created_at'?time(selected[key]):String(selected[key]);dl.append(dt,dd);}
 get('[data-export]').hidden=!data.permissions.export;integrity.textContent='لم يُفحص بعد.';dialog.showModal();get<HTMLButtonElement>('[data-close]').focus();
}
async function load(){
 const data=await api();hasMore=data.hasMore;page=data.page;
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const option=document.createElement('option');option.value=m.tenant_id;option.textContent=m.name;option.selected=m.tenant_id===data.tenant.tenant_id;return option;}));
 get('[data-role]').textContent=`الدور: ${data.tenant.role} · ${data.permissions.create?'إضافة وتصدير متاحان':'عرض وفحص فقط؛ الإضافة والتصدير للمالك والمسؤول'}`;
 get('[data-create-panel]').hidden=!data.permissions.create;get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=data.events.length!==0;
 const tbody=get('[data-events]');tbody.replaceChildren();
 for(const event of data.events){const tr=document.createElement('tr');for(const value of [time(event.created_at),labels[event.event_type]||event.event_type,event.metadata_json.decision_ref,event.created_by]){const td=document.createElement('td'),bdi=document.createElement('bdi');bdi.textContent=value;td.append(bdi);if(tr.children.length===1){const small=document.createElement('small');small.textContent=event.source;td.append(small);}tr.append(td);}const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent='عرض الحدث';button.addEventListener('click',()=>void run(()=>detail(event.event_id)));td.append(button);tr.append(td);tbody.append(tr);}
 area.hidden=false;
}
get('[data-reload]').addEventListener('click',()=>void run(async()=>{clearDetail();await load();}));
for(const select of [workspace,type,period])select.addEventListener('change',()=>{page=1;clearDetail();void run(load);});
get('[data-search]').addEventListener('click',()=>{page=1;clearDetail();void run(load);});
search.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();page=1;clearDetail();void run(load);}});
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('form[data-create]').addEventListener('submit',event=>{event.preventDefault();void run(async()=>{const form=new FormData(event.currentTarget as HTMLFormElement);const data=await api('','POST',{event_type:form.get('event_type'),scenario:form.get('scenario')});page=1;type.value='';period.value='all';await load();await detail(data.event.event_id);});});
get('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{selected=null;get('[data-fields]').replaceChildren();});
async function verify(tamper=false){if(!selected)return;const id=selected.event_id;let body:object={};if(tamper){const {tenant_id,integrity_hash,...candidate}=selected;body={candidate:{...candidate,metadata_json:{...candidate.metadata_json,outcome:candidate.metadata_json.outcome==='RECORDED'?'REVIEWED':'RECORDED'}}};}try{const data=await api(`${id}/verify/`,'POST',body);integrity.textContent=`${tamper?'نسخة اختبار معدلة؛ الأصل لم يتغير: ':''}${({MATCH:'مطابق',MISMATCH:'غير مطابق',INDETERMINATE:'تعذر التحقق'} as Record<string,string>)[data.result]}. فحص أولي، وليس توقيعًا مستقلًا.`;}catch(error:any){integrity.textContent=`تعذر التحقق: ${error.message}`;}}
get('[data-verify]').addEventListener('click',()=>void run(()=>verify()));get('[data-tamper]').addEventListener('click',()=>void run(()=>verify(true)));
get('[data-export]').addEventListener('click',()=>void run(async()=>{if(!selected)return;const data=await api(`${selected.event_id}/export/`);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`ledger-${selected.event_id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}));
window.addEventListener('pagehide',clearPrivate);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
if(auth)void run(load);
