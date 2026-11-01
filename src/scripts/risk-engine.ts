import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-risk-engine]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'),area=get('[data-private]'),workspace=get<HTMLSelectElement>('[data-workspace]');
const assetForm=get<HTMLFormElement>('[data-asset-form]'),assessmentForm=get<HTMLFormElement>('[data-assessment-form]'),filterForm=get<HTMLFormElement>('[data-filter-form]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let busy=false,page=1,hasMore=false,historyPage=1,historyMore=false,revisionsPage=1,revisionsMore=false,canWrite=false,selected:any=null,editing:any=null;
const labels:Record<string,string>={LOW:'منخفض',MEDIUM:'متوسط',HIGH:'مرتفع',PUBLIC:'عامة',INTERNAL:'داخلية',CONFIDENTIAL:'سرية',RESTRICTED:'مقيدة',NOT_ASSESSED:'لم يُقيّم',REASSESSMENT_REQUIRED:'يحتاج إعادة تقييم',ASSESSED:'مقيّم'};
const node=(tag:string,value:string)=>{const el=document.createElement(tag);el.textContent=value;return el;};
const time=(value:string)=>new Date(value).toLocaleString('ar-SA');
function clear(){area.hidden=true;get('[data-assets]').replaceChildren();get('[data-history]').replaceChildren();get('[data-revisions]').replaceChildren();get('[data-summary]').replaceChildren();workspace.replaceChildren();get('[data-role]').textContent='';get('[data-selected-title]').textContent='';get('[data-selected-description]').textContent='';selected=null;editing=null;assetForm.reset();assessmentForm.reset();get('[data-editor]').hidden=true;get('[data-detail]').hidden=true;}
async function api(path='',body?:object,method=body?'POST':'GET',history=false){
 if(!auth)throw new Error('يلزم إعداد الدخول عبر Neon Auth.');
 const session=await getWorkspaceSession(auth),token=session.data?.session?.token;
 if(session.error||!session.data?.user||!token)throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.');
 const query=new URLSearchParams({page:String(history?historyPage:path.endsWith('/revisions/')?revisionsPage:page)});if(workspace.value)query.set('workspace',workspace.value);
 if(!path){for(const key of ['q','classification','risk_level']){const value=String(new FormData(filterForm).get(key)||'');if(value)query.set(key,value);}}
 const response=await appFetch(auth!, `/app/api/risk-engine/assets/${path}?${query}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw new Error(data.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ.');return data;
}
function sync(){root.querySelectorAll<HTMLElement>('[data-write]').forEach(el=>el.hidden=!canWrite);get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;get<HTMLButtonElement>('[data-history-prev]').disabled=busy||historyPage===1;get<HTMLButtonElement>('[data-history-next]').disabled=busy||!historyMore;get<HTMLButtonElement>('[data-revisions-prev]').disabled=busy||revisionsPage===1;get<HTMLButtonElement>('[data-revisions-next]').disabled=busy||!revisionsMore;}
async function run(task:()=>Promise<void>,success='تمت قراءة البيانات من الخادم.'){
 if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('button,input,select,textarea').forEach(el=>el.disabled=true);status.textContent='جارٍ التحقق من الخادم…';
 try{await task();status.textContent=success;}
 catch(error:any){clear();status.textContent=`${error.message||'تعذر إكمال الطلب.'} عند انقطاع الاتصال بعد الإرسال، حدّث الحالات وافحص التاريخ قبل إعادة الإرسال.`;}
 finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('button,input,select,textarea').forEach(el=>el.disabled=false);sync();}
}
function preview(){const likelihood=get<HTMLSelectElement>('#re-likelihood').value,impact=get<HTMLSelectElement>('#re-impact').value,cell=get<HTMLElement>(`[data-cell="${likelihood}-${impact}"]`);get('[data-preview]').textContent=`معاينة غير محفوظة: ${cell.dataset.result} الضابط الأولي: ${cell.dataset.control}`;}
async function showHistory(id:string,focus=false){
 const [data,revisions]=await Promise.all([api(`${id}/assessments/`,undefined,'GET',true),api(`${id}/revisions/`)]);selected=data.asset;canWrite=data.canWrite;historyMore=data.hasMore;revisionsMore=revisions.hasMore;
 get('[data-selected-title]').textContent=`${selected.name} · نسخة ${selected.version}`;get('[data-selected-description]').textContent=`المالك: ${selected.owner} · البيانات: ${labels[selected.data_classification]}\nالغرض: ${selected.purpose}`;
 const list=get('[data-history]');list.replaceChildren();get('[data-history-empty]').hidden=data.assessments.length>0;get('[data-history-page]').textContent=`صفحة التاريخ ${historyPage}`;
 for(const a of data.assessments){
  const card=document.createElement('article');card.append(node('h4',`${labels[a.risk_level]} · ${time(a.created_at)}${a.asset_version!==selected.version?' · تقييم لنسخة سابقة':''}`));
  const fields:Record<string,string>={'التفسير':a.explanation,'سبب الاحتمال':a.likelihood_reason,'سبب الأثر':a.impact_reason,'الضابط الأولي':a.suggested_control,'ضوابط الحالة ومبررها':a.controls_reason,'نسخة المنهج':a.method_version,'مرجع المقيّم':a.evaluator_id,'مرجع التقييم':a.id,'الحالة وقت التقييم':`${a.asset_snapshot.name} · ${a.asset_snapshot.owner} · ${labels[a.asset_snapshot.data_classification]} · نسخة ${a.asset_version}\n${a.asset_snapshot.purpose}`};
  const dl=document.createElement('dl');for(const [label,value]of Object.entries(fields))dl.append(node('dt',label),node('dd',value));card.append(dl);list.append(card);
 }
 const latest=data.latestAssessment,comparison=get('[data-comparison]');
 if(!latest){comparison.textContent='لا يوجد تقييم محفوظ للمقارنة.';}
 else {
  const fields:Record<string,string>={name:'الاسم',owner:'المالك',purpose:'الغرض',data_classification:'تصنيف البيانات'};
  const changed=Object.entries(fields).filter(([key])=>latest.asset_snapshot[key]!==selected[key]).map(([key,label])=>`${label}: وقت التقييم «${labels[latest.asset_snapshot[key]]||latest.asset_snapshot[key]}»، الآن «${labels[selected[key]]||selected[key]}»`);
  comparison.textContent=latest.asset_version===selected.version?`أحدث تقييم وبيانات الحالة على النسخة ${selected.version} متطابقان.`:`الحالة الآن نسخة ${selected.version}، وأحدث تقييم مبني على النسخة ${latest.asset_version}. ${changed.length?`التغييرات: ${changed.join('؛ ')}`:'تغيرت النسخة منذ التقييم.'} يلزم تقييم جديد.`;
 }
 const revisionsList=get('[data-revisions]');revisionsList.replaceChildren();get('[data-revisions-empty]').hidden=revisions.revisions.length>0;get('[data-revisions-page]').textContent=`صفحة النسخ ${revisionsPage}`;
 for(const revision of revisions.revisions){const card=document.createElement('article');card.append(node('h4',`نسخة ${revision.asset_version} · ${time(revision.changed_at)}`));const dl=document.createElement('dl');for(const [key,label]of Object.entries({name:'الاسم',owner:'المالك',purpose:'الغرض',data_classification:'تصنيف البيانات'}))dl.append(node('dt',label),node('dd',labels[revision.asset_snapshot[key]]||revision.asset_snapshot[key]));dl.append(node('dt','مرجع المحرر'),node('dd',revision.changed_by));card.append(dl);revisionsList.append(card);}
 get('[data-detail]').hidden=false;sync();if(focus)get<HTMLElement>('[data-selected-title]').focus();
}
async function load(){
 const data=await api();hasMore=data.hasMore;canWrite=data.canWrite;
 setWorkspace(data.tenant.tenant_id);
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const o=document.createElement('option');o.value=m.tenant_id;o.textContent=m.name;o.selected=m.tenant_id===data.tenant.tenant_id;return o;}));
 get('[data-role]').textContent=`الدور الحالي: ${data.tenant.role}`;get('[data-page]').textContent=`الصفحة ${page}`;get('[data-empty]').hidden=Number(data.summary.total)>0;get('[data-no-results]').hidden=data.assets.length>0||Number(data.summary.total)===0;get('[data-result-count]').textContent=`نتائج هذا العرض: ${data.filteredTotal} · صفحة ${page}`;
 const summary=get('[data-summary]');summary.replaceChildren();for(const [label,value]of Object.entries({'إجمالي الحالات':data.summary.total,'منخفض حاليًا':data.summary.low,'متوسط حاليًا':data.summary.medium,'مرتفع حاليًا':data.summary.high,'لم تُقيّم أو تحتاج إعادة تقييم':data.summary.needs_reassessment})){const item=document.createElement('div');item.append(node('span',label),node('strong',String(value)));summary.append(item);}
 const rows=get('[data-assets]');rows.replaceChildren();
 for(const a of data.assets){const tr=document.createElement('tr');for(const value of [a.name,a.owner,a.purpose,labels[a.data_classification],`${labels[a.assessment_status]}${a.risk_level?' · '+labels[a.risk_level]:''}`])tr.append(node('td',value));const td=document.createElement('td'),button=node('button',`عرض ${a.name}`) as HTMLButtonElement;button.type='button';button.addEventListener('click',()=>void run(async()=>{historyPage=1;revisionsPage=1;assessmentForm.reset();get('[data-editor]').hidden=true;await showHistory(a.id,true);preview();}));td.append(button);tr.append(td);rows.append(tr);}
 area.hidden=false;sync();
}
function edit(asset:any=null){editing=asset;assetForm.reset();get('[data-editor-title]').textContent=asset?'تعديل الحالة — يستدعي إعادة تقييم عند التغيير':'إضافة حالة استخدام';if(asset)for(const k of ['name','owner','purpose','data_classification'])(assetForm.elements.namedItem(k) as HTMLInputElement).value=asset[k];get('[data-editor]').hidden=false;get<HTMLInputElement>('#re-name').focus();}
get('[data-add]').addEventListener('click',()=>edit());get('[data-edit]').addEventListener('click',()=>edit(selected));get('[data-cancel]').addEventListener('click',()=>{assetForm.reset();editing=null;get('[data-editor]').hidden=true;});
assetForm.addEventListener('submit',event=>{event.preventDefault();const fields=Object.fromEntries(new FormData(assetForm)),asset=editing;void run(async()=>{const result=await api(asset?`${asset.id}/`:'',{...fields,...(asset?{asset_version:asset.version}:{})},asset?'PATCH':'POST');get('[data-editor]').hidden=true;assetForm.reset();editing=null;page=1;historyPage=1;revisionsPage=1;await load();await showHistory(result.asset.id,true);preview();},asset?'تم تحديث الحالة المحفوظة.':'تم إنشاء الحالة وحفظها في الخادم.');});
assessmentForm.addEventListener('change',preview);
assessmentForm.addEventListener('submit',event=>{event.preventDefault();const fields=Object.fromEntries(new FormData(assessmentForm)),asset=selected;void run(async()=>{await api(`${asset.id}/assessments/`,{...fields,likelihood:Number(fields.likelihood),impact:Number(fields.impact),asset_version:asset.version});assessmentForm.reset();historyPage=1;await load();await showHistory(asset.id);preview();},'تم حفظ التقييم الجديد كسجل مستقل.');});
filterForm.addEventListener('submit',event=>{event.preventDefault();page=1;get('[data-detail]').hidden=true;void run(load);});
get('[data-filter-reset]').addEventListener('click',()=>{filterForm.reset();page=1;get('[data-detail]').hidden=true;void run(load);});
workspace.addEventListener('change',()=>{get('[data-assets]').replaceChildren();get('[data-history]').replaceChildren();get('[data-revisions]').replaceChildren();assetForm.reset();assessmentForm.reset();selected=null;editing=null;get('[data-detail]').hidden=true;get('[data-editor]').hidden=true;page=1;historyPage=1;revisionsPage=1;void run(load);});
get('[data-reload]').addEventListener('click',()=>void run(async()=>{const id=selected?.id;await load();if(id)await showHistory(id);}));
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('[data-history-prev]').addEventListener('click',()=>{historyPage--;void run(()=>showHistory(selected.id));});get('[data-history-next]').addEventListener('click',()=>{historyPage++;void run(()=>showHistory(selected.id));});
get('[data-revisions-prev]').addEventListener('click',()=>{revisionsPage--;void run(()=>showHistory(selected.id));});get('[data-revisions-next]').addEventListener('click',()=>{revisionsPage++;void run(()=>showHistory(selected.id));});
window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
if(auth)void run(load);

document.addEventListener('workspace-session-ended', () => { clear(); status.textContent = 'انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.'; });
