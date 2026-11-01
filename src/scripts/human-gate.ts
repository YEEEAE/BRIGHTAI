import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-human-gate]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'),area=get('[data-private]'),workspace=get<HTMLSelectElement>('[data-workspace]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false,page=1,filter='PENDING',hasMore=false;
const labels:Record<string,string>={PENDING:'بانتظار المراجعة',APPROVED:'معتمد',REJECTED:'مرفوض'};
const time=(value:string)=>new Date(value).toLocaleString('ar-SA');
function node(tag:string,value:string){const el=document.createElement(tag);el.textContent=value;return el;}
function clear(){area.hidden=true;get('[data-requests]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';}
async function api(path='',body?:object){
 if(!auth)throw new Error('يلزم إعداد الدخول عبر Neon Auth.');
 const session=await getWorkspaceSession(auth),token=session.data?.session?.token;
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const query=new URLSearchParams({status:filter,page:String(page)});if(workspace.value)query.set('workspace',workspace.value);
 const response=await appFetch(auth!, `/app/api/human-gate/requests/${path}?${query}`,{method:body?'POST':'GET',cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw new Error(data.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ.');return data;
}
function sync(){root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;}
async function run(task:()=>Promise<void>){
 if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=true);status.textContent='جارٍ التحقق والحفظ من الخادم…';
 try{await task();status.textContent='تم تحديث البيانات من الخادم. الطلب المعلق لا يسمح بإكمال العملية.';}
 catch(error:any){clear();status.textContent=`${error.message||'تعذر إكمال الطلب.'} إذا انقطع الاتصال بعد الإرسال، حدّث الطلبات للتحقق من النتيجة قبل إعادة الإرسال.`;}
 finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(el=>el.disabled=false);sync();}
}
async function load(){
 const data=await api();hasMore=data.hasMore;
 setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const o=document.createElement('option');o.value=m.tenant_id;o.textContent=m.name;o.selected=m.tenant_id===data.tenant.tenant_id;return o;}));
 get('[data-role]').textContent=`الدور الحالي: ${data.tenant.role}`;get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=data.requests.length>0;
 const list=get('[data-requests]');list.replaceChildren();
 for(const request of data.requests){
  const card=document.createElement('article');card.className='hg-request';card.append(node('h3',request.title));const state=node('p',labels[request.status]);state.className='hg-state';card.append(state);
  const fields:Record<string,string>={'مرجع الطلب':request.id,'العملية':'نشر ملاحظة داخلية تجريبية','الوصف':request.description,'سبب الإحالة':request.reason,'مرجع مقدم الطلب':request.requester_id,'وقت الإنشاء':time(request.created_at),'نسخة سياسة المسار':request.policy_version,'حالة العملية':request.completed_at?`مكتملة داخل هذا المختبر فقط · ${time(request.completed_at)}`:request.status==='REJECTED'?'متوقفة بسبب الرفض':'لم تُنفذ بعد'};
  if(request.decision){fields['القرار']=request.decision==='APPROVE'?'موافقة':'رفض';fields['مرجع المراجع']=request.reviewer_id;fields['سبب القرار']=request.decision_reason;fields['وقت القرار']=time(request.decided_at);}
  const dl=document.createElement('dl');for(const [label,value]of Object.entries(fields)){const dd=node('dd',value);dl.append(node('dt',label),dd);}card.append(dl);
  if(request.canDecide){
   const form=document.createElement('form'),label=node('label','سبب القرار (إلزامي، دون بيانات حساسة)'),input=document.createElement('textarea');input.id=`reason-${request.id}`;label.setAttribute('for',input.id);input.required=true;input.minLength=2;input.maxLength=500;input.rows=2;const actions=document.createElement('div');actions.className='hg-actions';
   for(const [decision,title]of [['APPROVE','اعتماد الطلب'],['REJECT','رفض الطلب']]){const button=document.createElement('button');button.type='submit';button.value=decision;button.textContent=title;actions.append(button);}
   form.append(label,input,actions);form.addEventListener('submit',event=>{event.preventDefault();const decision=(event.submitter as HTMLButtonElement|null)?.value;if(!decision)return;const reason=input.value;void run(async()=>{await api(`${request.id}/decide/`,{decision,reason});filter=decision==='APPROVE'?'APPROVED':'REJECTED';page=1;await load();});});card.append(form);
  }else if(request.status==='PENDING')card.append(node('p','بانتظار مراجع مخول مستقل. لا يمكن لصاحب الطلب مراجعته.'));
  if(request.canExecute){const button=document.createElement('button');button.type='button';button.textContent='إكمال نشر الملاحظة التجريبية';button.addEventListener('click',()=>void run(async()=>{await api(`${request.id}/execute/`,{});await load();}));card.append(button);}
  list.append(card);
 }
 area.hidden=false;
}
get('[data-reload]').addEventListener('click',()=>void run(load));
workspace.addEventListener('change',()=>{page=1;get('[data-requests]').replaceChildren();void run(load);});
root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter!;page=1;void run(load);}));
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('form[data-create]').addEventListener('submit',event=>{event.preventDefault();const form=event.currentTarget as HTMLFormElement;const fields=new FormData(form);void run(async()=>{await api('',Object.fromEntries(fields.entries()));form.reset();filter='PENDING';page=1;await load();});});
window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
if(auth)void run(load);

document.addEventListener('workspace-session-ended', () => { clear(); status.textContent = 'انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.'; });
