import {createWorkspaceAuth,appFetch} from './workspace-context';
const root=document.querySelector<HTMLElement>('[data-trial-home]')!;
const status=root.querySelector<HTMLElement>('[data-trial-status]')!;
const grid=root.querySelector<HTMLElement>('[data-trial-products]')!;
const start=root.querySelector<HTMLButtonElement>('[data-trial-start]')!;
const refresh=root.querySelector<HTMLButtonElement>('[data-trial-refresh]')!;
const auth=root.dataset.authUrl?createWorkspaceAuth(root.dataset.authUrl):null;
let tenant=new URL(location.href).searchParams.get('workspace')||'';
let timer:ReturnType<typeof setTimeout>;
let clock:ReturnType<typeof setInterval>;
let busy=false;
async function api(method='GET',body?:object){
 if(!auth)throw new Error('خدمة الدخول غير مهيأة لهذا التشغيل.');
 const response=await appFetch(auth,`/app/api/trial/${tenant?`?workspace=${encodeURIComponent(tenant)}`:''}`,{method,...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await response.json();
 if(!response.ok)throw new Error(data.message||'تعذر التحقق من التجربة.');
 return data;
}
function clear(){clearTimeout(timer);clearInterval(clock);grid.replaceChildren();root.querySelector<HTMLElement>('[data-trial-summary]')!.hidden=true;root.querySelector<HTMLElement>('[data-trial-signin]')!.hidden=false;start.hidden=false;}
async function run(work:()=>Promise<void>){
 if(busy)return;busy=true;start.disabled=refresh.disabled=true;
 try{await work();}catch(e){clear();status.textContent=e instanceof Error?e.message:'تعذر التحقق؛ أعد المحاولة.';}
 finally{busy=false;start.disabled=refresh.disabled=false;}
}
function element(tag:string,text:string){const e=document.createElement(tag);e.textContent=text;return e;}
async function load(){
 clear();if(!tenant){status.textContent='وثّق بريدك، ثم اضغط بدء التجربة لإنشاء مساحة معزولة. لا تبدأ المدة من التسجيل.';return;}
 const data=await api();
 root.querySelector<HTMLElement>('[data-trial-signin]')!.hidden=true;start.hidden=true;
 root.querySelector<HTMLElement>('[data-trial-summary]')!.hidden=false;
 const remaining=Math.min(...data.products.map(p=>p.remainingSeconds));
 const received=performance.now();
 const ends=data.products[0]?.endsAt?new Date(data.products[0].endsAt).toLocaleString('ar-SA',{timeZone:'Asia/Riyadh',calendar:'gregory',dateStyle:'medium',timeStyle:'short'}):'—';
 const renderClock=()=>{const seconds=Math.max(0,remaining-Math.floor((performance.now()-received)/1000));root.querySelector('[data-trial-clock]')!.textContent=`المتبقي: ${Math.floor(seconds/3600)} ساعة و${Math.floor(seconds%3600/60)} دقيقة و${seconds%60} ثانية · تنتهي ${ends} (الرياض)`;};
 renderClock();if(remaining>0)clock=setInterval(renderClock,1000);
 root.querySelector('[data-trial-dataset]')!.textContent=`بيانات Synthetic: ${data.dataset.organization} · ${data.dataset.asset} — لا بيانات عملاء.`;
 root.querySelector<HTMLAnchorElement>('[data-trial-kernel]')!.href=`/app/kernel/?workspace=${encodeURIComponent(data.tenantId)}`;
 status.textContent=remaining>0?'5/5 منتجات ظاهرة؛ الإذن والحصة يتحقق منهما الخادم لكل عملية.':'انتهت التجربة. العمليات محجوبة؛ المختبرات العامة والتواصل الاختياري متاحان.';
 for(const p of data.products){
  const operations:Record<string,string>={dashboard:'عرض لوحة الحماية',list:'قراءة السجل',actions:'عرض المتابعات',history:'قراءة التقييمات',revisions:'قراءة النسخ',treatments:'قراءة المعالجات',browse:'عرض النماذج وحالة الربط'};
  const card=element('article','');card.append(element('h2',p.name),element('p',`${p.demoStatus} · ${p.status}`),element('p',`مزود AI: ${p.providerStatus}`),element('p',`الحصة المتبقية: ${p.remaining} عملية قراءة · المسموح: ${p.operations.map(o=>operations[o]||'قراءة محدودة').join('، ')||'لا عمليات'}`));
  const demo=element('a','جرّب المختبر الآن بلا حساب') as HTMLAnchorElement;demo.href=p.demo;card.append(demo);
  const open=element('button','فتح المنتج بإذن الخادم') as HTMLButtonElement;open.type='button';open.disabled=!p.operations.length;
  open.addEventListener('click',()=>void run(async()=>{const result=await api('POST',{operation:'open',product:p.slug});location.assign(result.href);}));card.append(open);grid.append(card);
 }
 // Countdown is display only; clear stale actions at the boundary. API guards
 // use database time even if this timer is delayed or the client clock changes.
 if(remaining>0)timer=setTimeout(()=>{clear();status.textContent='تجدد حالة الوقت والحصص من الخادم…';void run(load);},remaining*1000+1000);
}
start.addEventListener('click',()=>void run(async()=>{const data=await api('POST',{operation:'start'});tenant=data.tenantId;history.replaceState(null,'',`?workspace=${encodeURIComponent(tenant)}`);await load();}));
refresh.addEventListener('click',()=>void run(load));
document.addEventListener('workspace-session-ended',()=>{clear();status.textContent='انتهت الجلسة؛ سجّل الدخول مجددًا.';});
window.addEventListener('pagehide',clear);
window.addEventListener('pageshow',e=>{if(e.persisted)void run(load);});
void run(load);
