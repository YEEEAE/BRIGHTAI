// Suggestion combobox for the /lab/search unified search input.
//
// Loaded as an external same-origin module (CSP: script-src 'self' — no
// inline script, no hash churn). Progressive enhancement only: without this
// file (or with JS disabled) the page remains a plain server-rendered GET
// search form with unchanged behavior.
//
// Also importable in Node (document guarded) so the unit suite tests the
// exact shipped debounce implementation.

/** Debounce window (ms) for the suggestion fetch. */
export const LAB_SUGGEST_DEBOUNCE_MS = 250;

/** Minimum trimmed characters before a suggestion fetch fires. */
export const LAB_SUGGEST_MIN_INPUT = 2;

export function createDebouncer(fn, waitMs) {
  let timer = null;
  let lastArgs = null;
  return {
    call(...args) {
      lastArgs = args;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        const pending = lastArgs;
        lastArgs = null;
        if (pending !== null) fn(...pending);
      }, waitMs);
    },
    cancel() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastArgs = null;
    },
    flush() {
      if (timer === null) return;
      clearTimeout(timer);
      timer = null;
      const pending = lastArgs;
      lastArgs = null;
      if (pending !== null) fn(...pending);
    },
  };
}

function initLabSearchSuggest() {
  // These three elements are rendered statically by the page markup.
  const input = document.querySelector('#lab-search-input');
  const list = document.querySelector('#lab-search-suggest');
  const status = document.querySelector('#lab-search-suggest-status');
  if (!(input instanceof HTMLInputElement) || !(list instanceof HTMLUListElement) || !(status instanceof HTMLElement)) {
    return;
  }

  let activeIndex = -1;
  let options = [];
  let controller = null;

  const isOpen = () => !list.hidden;

  function setActive(index) {
    activeIndex = index;
    options.forEach((li, i) => {
      li.classList.toggle('bg-brand-50', i === activeIndex);
      if (i === activeIndex) li.setAttribute('aria-selected', 'true');
      else li.removeAttribute('aria-selected');
    });
    if (activeIndex >= 0 && options[activeIndex]) {
      input.setAttribute('aria-activedescendant', options[activeIndex].id);
      options[activeIndex].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
    options = [];
  }

  function navigate(href) {
    close();
    debouncer.cancel();
    window.location.assign(href);
  }

  function render(groups) {
    list.replaceChildren();
    options = [];
    if (!Array.isArray(groups) || groups.length === 0) {
      close();
      status.textContent = 'No suggestions.';
      return;
    }
    let n = 0;
    for (const group of groups) {
      const header = document.createElement('li');
      header.setAttribute('role', 'presentation');
      header.className = 'px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500';
      header.textContent = group.label;
      list.append(header);
      for (const item of group.items) {
        const li = document.createElement('li');
        li.id = `lab-suggest-opt-${n++}`;
        li.setAttribute('role', 'option');
        li.className = 'mx-1 rounded-md';
        const a = document.createElement('a');
        a.href = item.href;
        a.className =
          'flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
        const idSpan = document.createElement('span');
        idSpan.className = 'font-mono text-xs font-semibold text-brand-700';
        idSpan.textContent = item.identifier;
        const titleSpan = document.createElement('span');
        titleSpan.className = 'truncate text-sm text-slate-700';
        titleSpan.textContent = item.title;
        a.append(idSpan, titleSpan);
        if (item.subtitle) a.title = item.subtitle;
        li.append(a);
        li.addEventListener('click', () => navigate(item.href));
        list.append(li);
        options.push(li);
      }
    }
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(-1);
    const total = groups.reduce((sum, g) => sum + g.items.length, 0);
    status.textContent = `${total} suggestion${total === 1 ? '' : 's'} available.`;
  }

  async function fetchSuggestions(q) {
    if (controller !== null) controller.abort();
    controller = new AbortController();
    try {
      const res = await fetch(`/api/lab/search-suggest?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
        signal: controller.signal,
      });
      if (!res.ok) {
        close();
        return;
      }
      const data = await res.json();
      // A newer keystroke may have arrived while awaiting.
      if (input.value.trim() !== q) return;
      render(data.groups ?? []);
    } catch {
      // Aborted or network-failed fetch: keep the form usable, show nothing.
      if (input.value.trim() !== q) return;
      close();
    }
  }

  const debouncer = createDebouncer((q) => {
    void fetchSuggestions(q);
  }, LAB_SUGGEST_DEBOUNCE_MS);

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (q.length < LAB_SUGGEST_MIN_INPUT) {
      debouncer.cancel();
      close();
      return;
    }
    debouncer.call(q);
  });

  input.addEventListener('keydown', (event) => {
    if (!isOpen() && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActive(Math.min(activeIndex + 1, options.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActive(Math.max(activeIndex - 1, 0));
        break;
      case 'Home':
        if (isOpen()) {
          event.preventDefault();
          setActive(0);
        }
        break;
      case 'End':
        if (isOpen()) {
          event.preventDefault();
          setActive(options.length - 1);
        }
        break;
      case 'Enter':
        if (isOpen() && activeIndex >= 0 && options[activeIndex]) {
          event.preventDefault();
          const anchor = options[activeIndex].querySelector('a');
          if (anchor instanceof HTMLAnchorElement) navigate(anchor.href);
        }
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      case 'Tab':
        close();
        break;
    }
  });

  document.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Node && !list.contains(event.target) && event.target !== input) {
      close();
    }
  });
}

if (typeof document !== 'undefined') {
  initLabSearchSuggest();
}
