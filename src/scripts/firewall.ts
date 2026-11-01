import { createAuthClient } from '@neon/neon-js/auth';
const root = document.querySelector<HTMLElement>('[data-firewall]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const privateArea = root.querySelector<HTMLElement>('[data-private]')!;
const workspace = root.querySelector<HTMLSelectElement>('[data-workspace]')!;
const filter = root.querySelector<HTMLSelectElement>('[data-filter]')!;
const text = root.querySelector<HTMLTextAreaElement>('textarea')!;
const result = root.querySelector<HTMLElement>('[data-result]')!;
const reasons: Record<string,string> = {NO_ACTIVE_POLICY:'لا توجد قاعدة مفعّلة.',INVALID_POLICY:'قاعدة غير صالحة؛ حجب آمن.',RULE_BLOCK:'طابق قاعدة الحجب.',RULE_REDACT:'نُقّح المعرّف الاصطناعي.',RULE_ALLOW:'طابق قاعدة السماح.',NO_MATCH_LAB_ONLY:'لم يطابق القواعد المحدودة؛ ليس إثبات سلامة المحتوى.'};
const auth = root.dataset.authUrl ? createAuthClient(root.dataset.authUrl) : null;
let busy = false;
function clearPrivate() { privateArea.hidden = true; text.value = ''; result.textContent = ''; root.querySelector('[data-rules]')!.replaceChildren(); root.querySelector('[data-decisions]')!.replaceChildren(); workspace.replaceChildren(); root.querySelector('[data-scope]')!.textContent=''; root.querySelectorAll('[data-count]').forEach(el=>el.textContent='—'); }
async function api(path: string, method = 'GET', body?: object) {
 if (!auth) throw new Error('يلزم إعداد الدخول.');
 const session = await auth.getSession();
 const token = session.data?.session?.token;
 if(session.error || !session.data?.user || !token) throw new Error('يلزم تسجيل الدخول عبر Kernel. تحقق أيضًا من إعداد الأصل الموثوق.');
 const params = new URLSearchParams(); if(workspace.value) params.set('workspace',workspace.value); if(filter.value && method==='GET') params.set('action',filter.value);
 const response = await fetch(`/app/api/firewall/${path}/?${params}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 const data = await response.json(); if(!response.ok) throw new Error(data.message || 'تعذر إكمال الطلب.'); return data;
}
function render(data: any) {
 workspace.replaceChildren(...data.memberships.map((m:any)=>{const o=document.createElement('option');o.value=m.tenant_id;o.textContent=m.name;o.selected=m.tenant_id===data.tenant.tenant_id;return o;}));
 root.querySelector('[data-scope]')!.textContent=`الدور: ${data.tenant.role} · مختبر قواعد فقط`;
 root.querySelectorAll<HTMLElement>('[data-count]').forEach(el=>{el.textContent=String(data.counts.find((c:any)=>c.action===el.dataset.count)?.count ?? 0);});
 const rules=root.querySelector('[data-rules]')!; rules.replaceChildren();
 if(!data.rules.length) rules.textContent='لا توجد قواعد بعد. يضيف المالك أو المسؤول القوالب المطلوبة؛ لا توجد بيانات إنتاج افتراضية.';
 for(const rule of data.rules) {
  const card=document.createElement('article');card.className='fw-rule';
  const h=document.createElement('h3');h.textContent=rule.name;
  const p=document.createElement('p');p.textContent=`${rule.action} · ${rule.enabled?'مفعّلة':'معطّلة'} · النسخة ${rule.version}`;
  const pattern=document.createElement('bdi');pattern.textContent=rule.pattern;
  card.append(h,p,pattern);
  if(data.canManage){const button=document.createElement('button');button.type='button';button.textContent=rule.enabled?'تعطيل القاعدة':'تفعيل القاعدة';button.addEventListener('click',()=>void run(async()=>{await api('rules','PATCH',{id:rule.id,enabled:!rule.enabled,version:rule.version});await load();}));card.append(button);}
  rules.append(card);
 }
 (root.querySelector('[data-create-rule]') as HTMLElement).hidden=!data.canManage;
 root.querySelector('[data-role]')!.textContent=data.canManage?'يمكنك إضافة القواعد وتفعيلها وتعطيلها.':'عرض وفحص فقط؛ تعديل القواعد للمالك والمسؤول.';
 const decisions=root.querySelector('[data-decisions]')!;decisions.replaceChildren();
 if(!data.decisions.length) decisions.textContent='لا توجد قرارات محفوظة ضمن هذه التصفية.';
 for(const d of data.decisions){const li=document.createElement('li');li.textContent=`${new Date(d.created_at).toLocaleString('ar-SA')} · ${d.action} · ${reasons[d.reason] ?? 'سبب غير معروف'} · ${d.rule_id ? `القاعدة ${d.rule_id} / النسخة ${d.rule_version}`:'دون قاعدة مطابقة'}`;decisions.append(li);}
 privateArea.hidden=false;
}
async function load(){render(await api('rules'));}
async function run(task:()=>Promise<void>){if(busy)return;busy=true;root.setAttribute('aria-busy','true');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(b=>b.disabled=true);status.textContent='جارٍ تنفيذ الطلب…';try{await task();status.textContent='تم تحميل بيانات المؤسسة والتحقق من الصلاحيات في الخادم.';}catch(e:any){clearPrivate();status.textContent=e.message||'تعذر الاتصال؛ لم يصدر سماح.';}finally{busy=false;root.removeAttribute('aria-busy');root.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select').forEach(b=>b.disabled=false);}}
root.querySelector('[data-reload]')!.addEventListener('click',()=>void run(load));
workspace.addEventListener('change',()=>{result.textContent='';text.value='';void run(load);});
filter.addEventListener('change',()=>void run(load));
root.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button=>button.addEventListener('click',()=>{text.value=button.dataset.example!;result.textContent='اضغط فحص من الخادم؛ النتيجة تعتمد على القواعد المفعّلة.';text.focus();}));
root.querySelector('form[data-create-rule]')!.addEventListener('submit',event=>{event.preventDefault();void run(async()=>{const template=(root.querySelector('[name=template]') as HTMLSelectElement).value;await api('rules','POST',{template});await load();});});
root.querySelector('form[data-evaluate]')!.addEventListener('submit',event=>{event.preventDefault();result.textContent='جارٍ الفحص من الخادم…';void run(async()=>{const d=await api('evaluate','POST',{text:text.value});result.textContent=`${d.action}\n${reasons[d.reason] ?? d.reason}\n${d.rule_id?`القاعدة: ${d.rule_id} · النسخة ${d.rule_version}`:'لا توجد قاعدة مطابقة'}\n${d.output ?? 'لم يُعرض النص المحجوب.'}\nحُفظ القرار دون متن النص.`;await load();});});
window.addEventListener('pagehide',clearPrivate);
window.addEventListener('pageshow',event=>{if(event.persisted)void run(load);});
if(auth)void run(load);
