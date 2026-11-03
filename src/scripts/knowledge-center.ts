import { topics, products } from '../data/knowledge';
import { matches } from './knowledge-search.mjs';
const root = document.querySelector<HTMLElement>('[data-knowledge-center]');
if (root) {
  const entries = JSON.parse(root.querySelector('#kc-data')!.textContent!);
  const query = root.querySelector<HTMLInputElement>('#kc-query')!;
  const type = root.querySelector<HTMLSelectElement>('#kc-type')!;
  const topicSelect = root.querySelector<HTMLSelectElement>('#kc-topic')!;
  const rows = [...root.querySelectorAll<HTMLElement>('[data-entry]')];
  const preview = root.querySelector<HTMLElement>('#kc-preview')!;
  const previewContent = root.querySelector<HTMLElement>('[data-preview-content]')!;
  const close = root.querySelector<HTMLButtonElement>('[data-close-preview]')!;
  const sidebar = root.querySelector<HTMLDetailsElement>('.kc-sidebar')!;
  let state = { q: '', topic: '', type: '', products: [] as string[], view: 'compact', space: 'guides' };
  let selected: number | null = null;
  let trigger: HTMLButtonElement | null = null;
  const mobile = matchMedia('(max-width: 760px)');
  const setSidebar = () => { sidebar.open = !mobile.matches; };
  setSidebar(); mobile.addEventListener('change', setSidebar);
  root.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('[disabled]').forEach(el => el.disabled = false);
  function closePreview(focus = false) {
    selected = null; preview.classList.remove('is-open'); close.hidden = true;
    rows.forEach(row => { row.classList.remove('is-selected'); row.querySelector('[data-preview]')?.setAttribute('aria-expanded', 'false'); });
    previewContent.replaceChildren();
    const p = document.createElement('p'); p.textContent = 'اختر معاينة سريعة من النتائج لقراءة وصف الدليل وأقسامه.'; previewContent.append(p);
    if (focus) trigger?.focus();
  }
  function urlForState() {
    const url = new URL(location.href);
    ['q','topic','type','product','view','space'].forEach(key => url.searchParams.delete(key));
    for (const key of ['q','topic','type'] as const) if (state[key]) url.searchParams.set(key, state[key]);
    state.products.forEach(id => url.searchParams.append('product', id));
    if (state.view === 'expanded') url.searchParams.set('view', 'expanded');
    if (state.space === 'products') url.searchParams.set('space', 'products');
    return url;
  }
  function update(write = true) {
    query.value = state.q; type.value = state.type; topicSelect.value = state.topic;
    let count = 0;
    rows.forEach((row, i) => { row.hidden = !matches(entries[i], state, topics); if (!row.hidden) count++; });
    if (selected !== null && rows[selected].hidden) closePreview();
    root!.dataset.view = state.view;
    root!.querySelector('[data-result-count]')!.textContent = `${count} نتائج من ${entries.length} أدلة`;
    (root!.querySelector('[data-empty]') as HTMLElement).hidden = count !== 0;
    (root!.querySelector('[data-product-space]') as HTMLElement).hidden = state.space !== 'products';
    root!.querySelectorAll<HTMLButtonElement>('[data-topic]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.topic === state.topic)));
    root!.querySelectorAll<HTMLButtonElement>('[data-product]').forEach(b => b.setAttribute('aria-pressed', String(state.products.includes(b.dataset.product!))));
    root!.querySelectorAll<HTMLButtonElement>('[data-space]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.space === state.space)));
    const view = root!.querySelector('#kc-view')!; view.textContent = state.view === 'expanded' ? 'عرض مضغوط' : 'عرض موسع'; view.setAttribute('aria-pressed', String(state.view === 'expanded'));
    const active = root!.querySelector('[data-active]')!; active.replaceChildren();
    const chips: [string, () => void][] = [];
    if (state.q) chips.push([`البحث: ${state.q}`, () => state.q = '']);
    if (state.topic) chips.push([topics.find(t => t[0] === state.topic)?.[1] ?? state.topic, () => state.topic = '']);
    if (state.type) chips.push([state.type, () => state.type = '']);
    state.products.forEach(id => chips.push([products.find(p => p[0] === id)?.[1] ?? id, () => state.products = state.products.filter(p => p !== id)]));
    chips.forEach(([label, remove]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${label} ×`; b.setAttribute('aria-label', `إزالة فلتر ${label}`); b.onclick = () => { remove(); update(); }; active.append(b); });
    if (write) { const url = urlForState(); if (url.href !== location.href) history.pushState(null, '', url); }
    root!.querySelectorAll<HTMLAnchorElement>('[data-article-link]').forEach(a => { const url = new URL(a.getAttribute('href')!, location.origin); url.searchParams.set('from', location.pathname + location.search); a.href = url.pathname + url.search; });
  }
  function readUrl() {
    const params = new URLSearchParams(location.search);
    state = { q: params.get('q') ?? '', topic: topics.some(t => t[0] === params.get('topic')) ? params.get('topic')! : '', type: entries.some((e: any) => e.tag === params.get('type')) ? params.get('type')! : '', products: params.getAll('product').filter(id => products.some(p => p[0] === id)), view: params.get('view') === 'expanded' ? 'expanded' : 'compact', space: params.get('space') === 'products' ? 'products' : 'guides' };
    update(false);
  }
  query.addEventListener('input', () => { state.q = query.value; update(); });
  type.addEventListener('change', () => { state.type = type.value; update(); });
  topicSelect.addEventListener('change', () => { state.topic = topicSelect.value; update(); });
  root.addEventListener('click', event => {
    const b = (event.target as Element).closest<HTMLButtonElement>('button'); if (!b) return;
    if (b.hasAttribute('data-topic')) { state.topic = b.dataset.topic!; if (mobile.matches) sidebar.open = false; }
    else if (b.dataset.product) { const id = b.dataset.product; state.products = state.products.includes(id) ? state.products.filter(p => p !== id) : [...state.products, id]; }
    else if (b.dataset.productOnly) { state.products = [b.dataset.productOnly]; }
    else if (b.dataset.query) state.q = b.dataset.query;
    else if (b.dataset.space) { state.space = b.dataset.space; state.topic = ''; }
    else if (b.hasAttribute('data-reset')) { state = { q: '', topic: '', type: '', products: [], view: state.view, space: 'guides' }; query.focus(); }
    else if (b.id === 'kc-view') state.view = state.view === 'compact' ? 'expanded' : 'compact';
    else if (b.hasAttribute('data-preview')) {
      const i = Number(b.dataset.preview); const entry = entries[i]; trigger = b; selected = i;
      rows.forEach((row, index) => { row.classList.toggle('is-selected', i === index); row.querySelector('[data-preview]')?.setAttribute('aria-expanded', String(i === index)); });
      previewContent.replaceChildren();
      const meta = document.createElement('p'); meta.className = 'kc-kicker'; meta.textContent = `${entry.tag} · ${entry.minutes} دقائق`;
      const h = document.createElement('h2'); h.textContent = entry.title;
      const p = document.createElement('p'); p.textContent = entry.text;
      const title = document.createElement('h3'); title.textContent = 'داخل الدليل';
      const list = document.createElement('ol'); entry.headings.forEach((heading: {title:string}) => { const li = document.createElement('li'); li.textContent = heading.title; list.append(li); });
      const link = document.createElement('a'); link.className = 'kc-read'; link.textContent = 'اقرأ الدليل كاملًا ←'; link.href = entry.href; link.setAttribute('data-article-link','');
      previewContent.append(meta,h,p,title,list,link); close.hidden = false; preview.classList.add('is-open');
      if (mobile.matches) { preview.scrollIntoView({ block: 'start', behavior: 'instant' }); preview.focus({ preventScroll: true }); }
    } else if (b.hasAttribute('data-close-preview')) { closePreview(true); return; } else return;
    update();
  });
  root.addEventListener('keydown', e => { if (e.key === 'Escape' && selected !== null) closePreview(true); });
  document.addEventListener('keydown', e => { if (e.key === '/' && !e.ctrlKey && !e.metaKey && !(e.target as Element).closest('input,textarea,select,[contenteditable]')) { e.preventDefault(); query.focus(); } });
  // UI-only history state. No query or article content is persisted in storage.
  root.addEventListener('click', e => {
    const link = (e.target as Element).closest<HTMLAnchorElement>('[data-article-link]');
    if (!link) return;
    history.replaceState({ ...history.state, knowledgeScroll: scrollY }, '');
    const url = new URL(link.href);
    url.searchParams.set('from', `${location.pathname}${location.search}#kc-scroll=${Math.round(scrollY)}`);
    link.href = url.href;
  });
  function restore() {
    readUrl();
    const fragment = /^#kc-scroll=(\d{1,7})$/.exec(location.hash);
    const top = history.state?.knowledgeScroll ?? (fragment ? Number(fragment[1]) : null);
    if (top !== null) requestAnimationFrame(() => scrollTo({ top, behavior: 'instant' }));
  }
  addEventListener('popstate', restore); addEventListener('pageshow', restore); restore();
}
