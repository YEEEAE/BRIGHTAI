const root = document.querySelector<HTMLElement>('[data-knowledge-reader]');
if (root) {
  const back = root.querySelector<HTMLAnchorElement>('[data-back-center]')!;
  const source = new URLSearchParams(location.search).get('from');
  let returnTo: URL | null = null;
  if (source) { try { const candidate = new URL(source, location.origin); if (candidate.origin === location.origin && candidate.pathname === '/docs/') { returnTo = candidate; back.href = candidate.pathname + candidate.search + candidate.hash; } } catch {} }
  const centerLinks = [...new Set([...document.querySelectorAll<HTMLAnchorElement>('main a[href="/docs/"]'), back])];
  if (returnTo) centerLinks.forEach(a => a.href = returnTo!.pathname + returnTo!.search + returnTo!.hash);
  centerLinks.forEach(link => link.addEventListener('click', e => {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    try { const referrer = new URL(document.referrer); if (history.length > 1 && returnTo && referrer.origin === location.origin && referrer.pathname === '/docs/' && referrer.search === returnTo.search) { e.preventDefault(); history.back(); } } catch {}
  }));
  if (returnTo) root.querySelectorAll<HTMLAnchorElement>('.kr-related a').forEach(link => {
    const url = new URL(link.href); url.searchParams.set('from', returnTo!.pathname + returnTo!.search + returnTo!.hash); link.href = url.href;
  });
  const content = root.querySelector<HTMLElement>('[data-knowledge-content]')!;
  const meter = root.querySelector<HTMLProgressElement>('progress')!;
  const links = [...root.querySelectorAll<HTMLAnchorElement>('.kr-sidebar nav a')];
  const headings = links.map(a => document.getElementById(decodeURIComponent(a.hash.slice(1))));
  const details = root.querySelector<HTMLDetailsElement>('.kr-sidebar details')!;
  const mobile = matchMedia('(max-width: 900px)');
  const adapt = () => details.open = !mobile.matches; adapt(); mobile.addEventListener('change', adapt);
  let queued = false;
  const update = () => {
    queued = false;
    const box = content.getBoundingClientRect();
    meter.value = Math.max(0, Math.min(100, -box.top / Math.max(1, box.height - innerHeight) * 100));
    let current = 0; headings.forEach((h,i) => { if (h && h.getBoundingClientRect().top <= 140) current = i; });
    links.forEach((a,i) => { if (i === current) a.setAttribute('aria-current','location'); else a.removeAttribute('aria-current'); });
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);update();
  links.forEach((a,i) => a.addEventListener('click', () => { const h = headings[i]; if(h) { h.tabIndex = -1; h.focus({preventScroll:true}); } }));
}
