(() => {
  const $ = s => document.querySelector(s);
  const all = s => [...document.querySelectorAll(s)];
  const normalize = s => s.toLowerCase().normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g,'ا');
  const reqs = all('[data-requirement]');
  const prompts = all('[data-prompt]');
  function filterRequirements() {
    const q = normalize($('#requirement-search').value.trim());
    const module = $('#module-filter').value;
    const state = $('#state-filter').value;
    let visible = 0;
    for (const row of reqs) {
      const match = normalize(row.dataset.search).includes(q) && (!module || row.dataset.module === module) && (!state || row.dataset.status === state);
      row.hidden = !match;
      if (match) visible++;
    }
    $('#requirement-count').textContent = `عرض ${visible} من ${reqs.length} متطلبًا`;
    $('#requirement-empty').hidden = visible !== 0;
  }
  ['requirement-search','module-filter','state-filter'].forEach(id => $('#'+id).addEventListener('input',filterRequirements));
  $('#prompt-search').addEventListener('input',() => {
    const q=normalize($('#prompt-search').value.trim()); let count=0;
    prompts.forEach(p=>{p.hidden=!normalize(p.dataset.search).includes(q);if(!p.hidden)count++;});
    $('#prompt-count').textContent=`عرض ${count} من ${prompts.length} برومبتًا`;
    $('#prompt-empty').hidden=count!==0;
  });
  const chapters=all('.report-chapter');
  $('#expand-report').addEventListener('click',e=>{
    const open=chapters.some(c=>!c.open);chapters.forEach(c=>c.open=open);
    e.currentTarget.textContent=open?'طي أقسام التقرير':'فتح جميع الأقسام';
    e.currentTarget.setAttribute('aria-expanded',String(open));
  });
  document.addEventListener('click',async e=>{
    const anchor=e.target.closest('a[href^="#"]');
    if(anchor){const target=document.getElementById(decodeURIComponent(anchor.getAttribute('href').slice(1)));if(target){if(target.tagName==='DETAILS')target.open=true;const parent=target.closest('details');if(parent)parent.open=true;$('#mobile-toc').open=false;}}
    const copy=e.target.closest('[data-copy]');
    if(!copy)return;
    const text=document.getElementById(copy.dataset.copy).textContent;
    try {
      if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(text);
      else {const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();const ok=document.execCommand('copy');area.remove();copy.focus();if(!ok)throw new Error('copy unavailable');}
      showToast('نُسخ البرومبت كاملًا');
    } catch {showToast('تعذر النسخ التلقائي؛ افتح الملف النصي للبرومبتات وانسخه يدويًا.');}
  });
  let toastTimer;
  function showToast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
  const beforePrintState=new Map();
  const beforePrintVisibility=new Map();
  function preparePrint(){all('details').forEach(d=>{beforePrintState.set(d,d.open);d.open=true;});[...reqs,...prompts].forEach(el=>{beforePrintVisibility.set(el,el.hidden);el.hidden=false;});}
  function restorePrint(){beforePrintState.forEach((open,d)=>d.open=open);beforePrintState.clear();beforePrintVisibility.forEach((hidden,el)=>el.hidden=hidden);beforePrintVisibility.clear();}
  window.addEventListener('beforeprint',preparePrint);
  window.addEventListener('afterprint',restorePrint);
  $('#print-report').addEventListener('click',()=>window.print());
  $('#export-requirements').addEventListener('click',()=>{
    const rows=JSON.parse($('#requirement-data').textContent);
    const fields=['id','module','requirement','weight','source','runtime','approval','status','evidence','gap','closure','dependency'];
    const cell=v=>`"${String(v??'').replaceAll('"','""')}"`;
    const csv='\ufeff'+[fields,...rows.map(r=>fields.map(f=>r[f]))].map(r=>r.map(cell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='BRIGHTAI-audit-requirements.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  const observer=new IntersectionObserver(entries=>{
    const first=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(first)all('.side-links a').forEach(a=>a.setAttribute('aria-current',String(a.getAttribute('href')==='#'+first.target.id)));
  },{rootMargin:'-85px 0px -60% 0px'});
  all('main>[id],.report-chapter').forEach(el=>observer.observe(el));
  function progress(){const max=document.documentElement.scrollHeight-innerHeight;$('#reading-progress').style.width=(max>0?100*scrollY/max:0)+'%';}
  window.addEventListener('scroll',progress,{passive:true});window.addEventListener('resize',progress);
  if(location.hash){const el=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(el?.tagName==='DETAILS')el.open=true;}
  filterRequirements();
})();
