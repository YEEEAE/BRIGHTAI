// Carry only the knowledge-center return URL; never forward it to external links.
const source = new URLSearchParams(location.search).get('from');
if (source) {
  try {
    const candidate = new URL(source, location.origin);
    if (candidate.origin === location.origin && candidate.pathname === '/docs/') {
      const back = new URL('/docs/', location.origin);
      for (const key of ['q', 'topic', 'type', 'product', 'view', 'space']) {
        for (const value of candidate.searchParams.getAll(key)) back.searchParams.append(key, value);
      }
      back.hash = candidate.hash;
      const returnPath = back.pathname + back.search + back.hash;
      if (!document.querySelector('[data-knowledge-reader]')) {
        const main = document.querySelector('main');
        const link = document.createElement('a');
        link.href = returnPath;
        link.textContent = '← العودة إلى نتائج البحث في مركز المعرفة';
        link.className = 'ghost';
        link.dataset.knowledgeReturn = '';
        main?.prepend(link);
      }
      document.querySelectorAll<HTMLAnchorElement>('main a[href]').forEach(link => {
        const url = new URL(link.href, location.origin);
        if (url.origin !== location.origin || url.pathname === location.pathname) return;
        if (url.pathname === '/docs/') {
          link.href = returnPath;
        } else if (/^\/(knowledge|products|solutions|resources|contact|demo)\//.test(url.pathname)) {
          url.searchParams.set('from', returnPath);
          link.href = url.pathname + url.search + url.hash;
        }
      });
    }
  } catch { /* Invalid context leaves the ordinary static navigation available. */ }
}
