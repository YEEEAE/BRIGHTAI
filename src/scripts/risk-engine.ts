import { createWorkspaceAuth as createAuthClient, getWorkspaceSession, appFetch, setWorkspace } from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-risk-engine]')!;
const get=<T extends Element=HTMLElement>(selector:string)=>root.querySelector<T>(selector)!;
const status=get('[data-status]'),area=get('[data-private]'),workspace=get<HTMLSelectElement>('[data-workspace]');
const assetForm=get<HTMLFormElement>('[data-asset-form]'),assessmentForm=get<HTMLFormElement>('[data-assessment-form]'),filterForm=get<HTMLFormElement>('[data-filter-form]'),treatmentForm=get<HTMLFormElement>('[data-treatment-form]'),actionsFilter=get<HTMLFormElement>('[data-actions-filter]');
const auth=root.dataset.authUrl?createAuthClient(root.dataset.authUrl):null;
let treatmentPage=1,treatmentMore=false,actionsPage=1,actionsMore=false,treatmentData:any=null,committedMessage='';
const detailId=root.dataset.detailAsset||'';
let busy=false,page=1,hasMore=false,historyPage=1,historyMore=false,revisionsPage=1,revisionsMore=false,canWrite=false,selected:any=null,editing:any=null;
const labels:Record<string,string>={LOW:'منخفض',MEDIUM:'متوسط',HIGH:'مرتفع',PUBLIC:'عامة',INTERNAL:'داخلية',CONFIDENTIAL:'سرية',RESTRICTED:'مقيدة',NOT_ASSESSED:'لم يُقيّم',REASSESSMENT_REQUIRED:'يحتاج إعادة تقييم',ASSESSED:'مقيّم',OPEN:'مفتوحة',IN_PROGRESS:'قيد المعالجة',MITIGATED:'تمت المعالجة',ACCEPTED:'مقبولة إداريًا'};
const node=(tag:string,value:string)=>{const el=document.createElement(tag);el.textContent=value;return el;};
const time=(value:string)=>new Date(value).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh'});
function clear(){area.hidden=true;get('[data-assets]').replaceChildren();get('[data-history]').replaceChildren();get('[data-revisions]').replaceChildren();get('[data-summary]').replaceChildren();get('[data-actions]').replaceChildren();get('[data-treatments]').replaceChildren();treatmentForm.reset();treatmentForm.hidden=true;treatmentData=null;workspace.replaceChildren();get('[data-role]').textContent='';get('[data-selected-title]').textContent='';get('[data-selected-description]').textContent='';selected=null;editing=null;assetForm.reset();assessmentForm.reset();get('[data-editor]').hidden=true;get('[data-detail]').hidden=true;}
async function api(path='',body?:object,method=body?'POST':'GET',history=false,resource='assets'){
 if(!auth)throw new Error('يلزم إعداد الدخول عبر Neon Auth.');
 const session=await getWorkspaceSession(auth),token=session.data?.session?.token;
 if(session.error||!session.data?.user||!token)throw Object.assign(new Error('يلزم تسجيل الدخول عبر Kernel. تحقق من إعداد الأصل الموثوق.'),{unauthorized:true});
 const query=new URLSearchParams({page:String(resource==='actions'?actionsPage:history?historyPage:path.endsWith('/revisions/')?revisionsPage:path.endsWith('/treatments/')?treatmentPage:page)});if(workspace.value)query.set('workspace',workspace.value);
 if(!path&&resource==='assets'){for(const key of ['q','classification','risk_level','assessment_status']){const value=(filterForm.elements.namedItem(key) as HTMLInputElement).value;if(value)query.set(key,value);}}
 if(resource==='actions')for(const key of ['treatment_status','due']){const value=(actionsFilter.elements.namedItem(key) as HTMLSelectElement).value;if(value)query.set(key,value);}
 const response=await appFetch(auth!, `/app/api/risk-engine/${resource==='assets'?'assets/'+path:resource+'/'}?${query}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.message||'تعذر إكمال العملية؛ لم يُؤكد الحفظ.'),{status:response.status,code:data.code});return data;
}
function sync(){get<HTMLButtonElement>('[data-treatment-prev]').disabled=busy||treatmentPage===1;get<HTMLButtonElement>('[data-treatment-next]').disabled=busy||!treatmentMore;get<HTMLButtonElement>('[data-actions-prev]').disabled=busy||actionsPage===1;get<HTMLButtonElement>('[data-actions-next]').disabled=busy||!actionsMore;syncTreatment();root.querySelectorAll<HTMLElement>('[data-write]').forEach(el=>el.hidden=!canWrite);get<HTMLButtonElement>('[data-prev]').disabled=busy||page===1;get<HTMLButtonElement>('[data-next]').disabled=busy||!hasMore;get<HTMLButtonElement>('[data-history-prev]').disabled=busy||historyPage===1;get<HTMLButtonElement>('[data-history-next]').disabled=busy||!historyMore;get<HTMLButtonElement>('[data-revisions-prev]').disabled=busy||revisionsPage===1;get<HTMLButtonElement>('[data-revisions-next]').disabled=busy||!revisionsMore;}
async function run(task:()=>Promise<void>,success='تمت قراءة البيانات من الخادم.'){
 if(busy)return;committedMessage='';busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('button,input,select,textarea').forEach(el=>el.disabled=true);status.textContent='جارٍ التحقق من الخادم…';
 try{await task();status.textContent=success;}
 catch(error:any){if(committedMessage){clear();status.textContent=`${committedMessage} تعذر تحديث العرض؛ حدّث السجل قبل أي إرسال جديد.`;}else{if(error.status===401||error.status===403||error.unauthorized)clear();if(error.status===409){get('[data-detail]').hidden=true;get('[data-editor]').hidden=true;}status.textContent=`${error.message||'تعذر إكمال الطلب.'} عند انقطاع الاتصال بعد الإرسال، حدّث السجل قبل إعادة الإرسال.`;}}
 finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLInputElement|HTMLButtonElement|HTMLSelectElement>('button,input,select,textarea').forEach(el=>el.disabled=false);sync();}
}
function preview(){const likelihood=get<HTMLSelectElement>('#re-likelihood').value,impact=get<HTMLSelectElement>('#re-impact').value,cell=get<HTMLElement>(`[data-cell="${likelihood}-${impact}"]`);get('[data-preview]').textContent=`معاينة غير محفوظة: ${cell.dataset.result} الضابط الأولي: ${cell.dataset.control}`;}
async function showHistory(id:string,focus=false){
 const [data,revisions,treatments]=await Promise.all([api(`${id}/assessments/`,undefined,'GET',true),api(`${id}/revisions/`),api(`${id}/treatments/`)]);
 if(data.asset.version!==revisions.asset.version||data.asset.version!==treatments.asset.version||data.latestAssessment?.id!==treatments.latestAssessment?.id)throw new Error('تغير السجل أثناء القراءة؛ حدّث التفاصيل.');
 renderTreatments(treatments);get<HTMLAnchorElement>('[data-detail-link]').href=assetLink(id);selected=data.asset;canWrite=data.canWrite;historyMore=data.hasMore;revisionsMore=revisions.hasMore;
 get('[data-selected-title]').textContent=`${selected.name} · نسخة ${selected.version}`;get('[data-selected-description]').textContent=`المالك: ${selected.owner} · البيانات: ${labels[selected.data_classification]}\nالغرض: ${selected.purpose}`;
 const list=get('[data-history]');list.replaceChildren();get('[data-history-empty]').hidden=data.assessments.length>0;get('[data-history-page]').textContent=`صفحة التاريخ ${historyPage}`;
 for(const a of data.assessments){
  const card=document.createElement('article');card.append(node('h4',`${labels[a.risk_level]} · ${time(a.created_at)}${a.asset_version!==selected.version?' · تقييم لنسخة سابقة':''}`));
  const fields:Record<string,string>={'التفسير':a.explanation,'سبب الاحتمال':a.likelihood_reason,'سبب الأثر':a.impact_reason,'الضابط الأولي':a.suggested_control,'ضوابط الحالة ومبررها':a.controls_reason,'اسم المنهج':a.method_name,'نسخة المنهج':a.method_version,'مراجع نصية':a.evidence_references||'لم تُضف مراجع','التقييم السابق':a.previous_assessment_id||'أول تقييم','مرجع المقيّم':a.evaluator_id,'مرجع التقييم':a.id,'الحالة وقت التقييم':`${a.asset_snapshot.name} · ${a.asset_snapshot.owner} · ${labels[a.asset_snapshot.data_classification]} · نسخة ${a.asset_version}\n${a.asset_snapshot.purpose}`};
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
 for(const a of data.assets){const tr=document.createElement('tr');for(const value of [a.name,a.owner,a.purpose,labels[a.data_classification],`${labels[a.assessment_status]}${a.risk_level?' · '+(a.assessment_status==='ASSESSED'?'':'تاريخي: ')+labels[a.risk_level]:''}`])tr.append(node('td',value));const td=document.createElement('td'),button=node('button',`عرض ${a.name}`) as HTMLButtonElement;button.type='button';button.addEventListener('click',()=>void run(async()=>{historyPage=1;revisionsPage=1;treatmentPage=1;assessmentForm.reset();get('[data-editor]').hidden=true;await showHistory(a.id,true);preview();}));const link=node('a','صفحة التفاصيل') as HTMLAnchorElement;link.href=assetLink(a.id);td.append(button,link);tr.append(td);rows.append(tr);}
 await loadActions();area.hidden=false;sync();
}
function edit(asset:any=null){editing=asset;assetForm.reset();get('[data-editor-title]').textContent=asset?'تعديل الحالة — يستدعي إعادة تقييم عند التغيير':'إضافة حالة استخدام';if(asset)for(const k of ['name','owner','purpose','data_classification'])(assetForm.elements.namedItem(k) as HTMLInputElement).value=asset[k];get('[data-editor]').hidden=false;get<HTMLInputElement>('#re-name').focus();}
get('[data-add]').addEventListener('click',()=>edit());get('[data-edit]').addEventListener('click',()=>edit(selected));get('[data-cancel]').addEventListener('click',()=>{assetForm.reset();editing=null;get('[data-editor]').hidden=true;});
assetForm.addEventListener('submit',event=>{event.preventDefault();const fields=Object.fromEntries(new FormData(assetForm)),asset=editing;void run(async()=>{const result=await api(asset?`${asset.id}/`:'',{...fields,synthetic_data_confirmed:fields.synthetic_data_confirmed==='on',...(asset?{asset_version:asset.version}:{})},asset?'PATCH':'POST');committedMessage=asset?'تم حفظ تعديل الأصل.':'تم حفظ الأصل.';get('[data-editor]').hidden=true;assetForm.reset();editing=null;page=1;historyPage=1;revisionsPage=1;treatmentPage=1;await load();await showHistory(result.asset.id,true);preview();},asset?'تم تحديث الحالة المحفوظة.':'تم إنشاء الحالة وحفظها في الخادم.');});
assessmentForm.addEventListener('change',preview);
assessmentForm.addEventListener('submit',event=>{event.preventDefault();const fields=Object.fromEntries(new FormData(assessmentForm)),asset=selected;void run(async()=>{await api(`${asset.id}/assessments/`,{...fields,synthetic_data_confirmed:fields.synthetic_data_confirmed==='on',likelihood:Number(fields.likelihood),impact:Number(fields.impact),asset_version:asset.version});committedMessage='تم حفظ التقييم.';assessmentForm.reset();historyPage=1;await load();await showHistory(asset.id);preview();},'تم حفظ التقييم الجديد كسجل مستقل.');});
filterForm.addEventListener('submit',event=>{event.preventDefault();page=1;get('[data-detail]').hidden=true;void run(load);});
get('[data-filter-reset]').addEventListener('click',()=>{filterForm.reset();page=1;get('[data-detail]').hidden=true;void run(load);});
workspace.addEventListener('change',()=>{get('[data-assets]').replaceChildren();get('[data-history]').replaceChildren();get('[data-revisions]').replaceChildren();assetForm.reset();assessmentForm.reset();selected=null;editing=null;get('[data-detail]').hidden=true;get('[data-editor]').hidden=true;page=1;historyPage=1;revisionsPage=1;void run(load);});
get('[data-reload]').addEventListener('click',()=>void run(async()=>{const id=selected?.id||detailId;await load();if(id)await showHistory(id);}));
get('[data-prev]').addEventListener('click',()=>{page--;void run(load);});get('[data-next]').addEventListener('click',()=>{page++;void run(load);});
get('[data-history-prev]').addEventListener('click',()=>{historyPage--;void run(()=>showHistory(selected.id));});get('[data-history-next]').addEventListener('click',()=>{historyPage++;void run(()=>showHistory(selected.id));});
get('[data-revisions-prev]').addEventListener('click',()=>{revisionsPage--;void run(()=>showHistory(selected.id));});get('[data-revisions-next]').addEventListener('click',()=>{revisionsPage++;void run(()=>showHistory(selected.id));});
window.addEventListener('pagehide',clear);window.addEventListener('pageshow',event=>{if(event.persisted)void run(async()=>{await load();if(detailId)await showHistory(detailId);});});
if(auth)void run(async()=>{await load();if(detailId){await showHistory(detailId,true);preview();}});

document.addEventListener('workspace-session-ended', () => { clear(); status.textContent = 'انتهت الجلسة؛ سجّل الدخول مجددًا من Kernel.'; });

function assetLink(id:string){const q=new URLSearchParams();if(workspace.value)q.set('workspace',workspace.value);return `/app/risk-engine/${encodeURIComponent(id)}/?${q}`;}
function dateOnly(value:string|null){return value?String(value).slice(0,10):'غير محدد';}
function syncTreatment(){
 if(!treatmentData){treatmentForm.hidden=true;return;}
 const current=treatmentData.latestAssessment?.asset_version===selected?.version;
 treatmentForm.hidden=!canWrite||!current;
 const option=get<HTMLOptionElement>('#re-treatment-status option[value="ACCEPTED"]');
 option.disabled=treatmentData.latestAssessment?.risk_level==='HIGH'&&!treatmentData.canAcceptHigh;
 if(option.disabled&&get<HTMLSelectElement>('#re-treatment-status').value==='ACCEPTED')get<HTMLSelectElement>('#re-treatment-status').value='OPEN';
}
function renderTreatments(data:any){
 treatmentData=data;treatmentMore=data.hasMore;
 const latest=data.latestTreatment,current=data.latestAssessment?.asset_version===data.asset.version;
 get('[data-treatment-state]').textContent=!current?'احفظ تقييمًا للنسخة الحالية قبل إضافة أو تحديث المعالجة.':!latest?'لا توجد خطة معالجة؛ أضف أول إصدار.':data.reviewRequired?`خطة النسخة ${latest.version} تحتاج مراجعة بعد تغير الأصل أو التقييم. حالتها السابقة: ${labels[latest.status]}.`:`المعالجة المحفوظة: ${labels[latest.status]} · إصدار ${latest.version} · مراجعة ${dateOnly(latest.review_on)}.`;
 treatmentForm.reset();if(latest)for(const key of ['owner','status','control_description','review_on'])(treatmentForm.elements.namedItem(key) as HTMLInputElement).value=key==='review_on'?(latest[key]?String(latest[key]).slice(0,10):''):latest[key];
 // A new decision needs its own rationale, rather than silently copying the old justification.
 if(data.reviewRequired)get<HTMLSelectElement>('#re-treatment-status').value='OPEN';
 const list=get('[data-treatments]');list.replaceChildren();get('[data-treatment-empty]').hidden=data.treatments.length>0;get('[data-treatment-page]').textContent=`صفحة المعالجة ${treatmentPage}`;
 for(const t of data.treatments){const card=document.createElement('article');card.append(node('h4',`إصدار ${t.version} · ${labels[t.status]} · ${time(t.created_at)}`));const dl=document.createElement('dl');for(const [label,value]of Object.entries({'مالك المعالجة':t.owner,'الضابط':t.control_description,'المبرر':t.rationale,'المراجعة':dateOnly(t.review_on),'نسخة الأصل':String(t.asset_version),'مرجع التقييم':t.assessment_id,'مرجع صاحب القرار':t.changed_by,'دوره وقت الحفظ':t.actor_role}))dl.append(node('dt',label),node('dd',String(value)));card.append(dl);list.append(card);}
}
async function loadActions(){
 const data=await api('',undefined,'GET',false,'actions');actionsMore=data.hasMore;
 const list=get('[data-actions]');list.replaceChildren();get('[data-actions-empty]').hidden=data.actions.length>0;get('[data-actions-page]').textContent=`صفحة الإجراءات ${actionsPage}`;
 for(const action of data.actions){const t=action.treatment,card=document.createElement('article'),link=node('a',action.name) as HTMLAnchorElement;link.href=assetLink(action.asset_id);card.append(link,node('p',`${labels[t.status]} · مالك المعالجة: ${t.owner} · المراجعة: ${dateOnly(t.review_on)}${action.review_due?' · موعد المراجعة مستحق':''}${action.review_required?' · خطة قديمة تحتاج مراجعة':''}`),node('p',t.control_description));list.append(card);}
}
treatmentForm.addEventListener('submit',event=>{
 event.preventDefault();if(!selected||!treatmentData?.latestAssessment)return;
 const fields=Object.fromEntries(new FormData(treatmentForm)),asset=selected,data=treatmentData;
 void run(async()=>{await api(`${asset.id}/treatments/`,{...fields,synthetic_data_confirmed:fields.synthetic_data_confirmed==='on',asset_version:asset.version,assessment_id:data.latestAssessment.id,treatment_version:data.latestTreatment?.version||0},'PATCH');committedMessage='تم حفظ إصدار المعالجة.';treatmentPage=1;await load();await showHistory(asset.id);},'تم حفظ إصدار المعالجة في الخادم. القبول الإداري لا يصرح بالنشر.');
});
actionsFilter.addEventListener('submit',event=>{event.preventDefault();actionsPage=1;void run(loadActions);});
get('[data-actions-prev]').addEventListener('click',()=>{actionsPage--;void run(loadActions);});
get('[data-actions-next]').addEventListener('click',()=>{actionsPage++;void run(loadActions);});
get('[data-treatment-prev]').addEventListener('click',()=>{treatmentPage--;void run(()=>showHistory(selected.id));});
get('[data-treatment-next]').addEventListener('click',()=>{treatmentPage++;void run(()=>showHistory(selected.id));});
get('[data-export]').addEventListener('click',()=>void run(async()=>{
 const data=await api('',undefined,'GET',false,'export');
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='aigas-risk-register.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
},'تم تجهيز ملف ملخص المؤسسة من الخادم وبدء تنزيله.'));
preview();
