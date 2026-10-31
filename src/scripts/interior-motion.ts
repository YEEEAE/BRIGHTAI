// Native, interior-only progressive enhancement. Essential HTML is never armed/hidden.
export function initializeMotion() {
  const root = document.querySelector<HTMLElement>('.interior-page');
  if (!root) return () => {};
  const lifetime = new AbortController();
  const { signal } = lifetime;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const animations = new Set<Animation>();
  const observers: IntersectionObserver[] = [];
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const finishers = new Set<() => void>();
  const frames = new Set<number>();
  const play = (element: Element, frames: Keyframe[], duration = 480, delay = 0) => {
    if (reduced.matches || !element.animate) return;
    const animation = element.animate(frames, { duration, delay, easing: 'cubic-bezier(.2,.7,.2,1)' });
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation;
  };
  const later = (fn: () => void, delay: number) => {
    const timer = setTimeout(() => { timers.delete(timer); if (!signal.aborted) fn(); }, delay);
    timers.add(timer); return timer;
  };
  const draw = (element: Element) => {
    const shapes = element.matches('path,line,circle,rect,polyline,ellipse') ? [element] : [...element.querySelectorAll('path,line,circle,rect,polyline,ellipse')];
    shapes.forEach((shape, i) => {
      if (!(shape instanceof SVGGeometryElement)) return;
      const length = shape.hasAttribute('pathLength') ? Number(shape.getAttribute('pathLength')) : shape.getTotalLength();
      if (!length) return;
      // WAAPI restores the authored dash pattern when drawing completes.
      play(shape, [{ strokeDasharray: `${length}`, strokeDashoffset: `${length}` }, { strokeDasharray: `${length}`, strokeDashoffset: '0' }], 800, Math.min(i * 45, 270));
    });
  };

  // Explicit primitives and existing page patterns use the same motion vocabulary.
  const legal = root.matches('.interior-privacy-index,.interior-terms-index');
  if (!legal) {
    root.querySelectorAll('h1,.review-questions ol,.approval-flow,.evidence-timeline,.extension-path,.scope-products,.extension-columns').forEach(element => {
      if (!element.hasAttribute('data-motion')) element.setAttribute('data-motion', element.tagName === 'H1' ? 'mask' : 'stagger');
    });
    root.querySelectorAll('.map-wires,.sector-diagram svg,.decision-circuit svg').forEach(element => element.setAttribute('data-motion', 'draw'));
    root.querySelectorAll('.content-extension>section,.catalog-row,.review-questions,.sector-visual').forEach(element => element.setAttribute('data-motion', 'rise'));
    root.querySelectorAll('.pillar-number').forEach(element => element.setAttribute('data-motion', 'scrub'));
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const element = entry.target as HTMLElement;
      const mode = element.dataset.motion;
      if (mode === 'draw') draw(element);
      else if (mode === 'stagger') [...element.children].forEach((child, i) => play(child, [{ opacity: .65, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], 480, Math.min(i * 60, 360)));
      else if (mode === 'mask') play(element, [{ opacity: .7, clipPath: 'inset(0 0 20% 0)', transform: 'translateY(6px)' }, { opacity: 1, clipPath: 'inset(0)', transform: 'none' }]);
      else if (mode !== 'scrub') play(element, [{ opacity: .7, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }]);
      if (element.matches('.system-map')) play(element.querySelector('.map-core')!, [{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: 'translate(-50%,-50%) scale(1.025)' }, { transform: 'translate(-50%,-50%) scale(1)' }], 900);
      observer.unobserve(element);
    }), { threshold: .12 });
    root.querySelectorAll('[data-motion],.system-map').forEach(element => observer.observe(element));
    observers.push(observer);
  }

  // Measured packet movement avoids offset-path compatibility assumptions.
  root.querySelectorAll<HTMLElement>('.experience-firewall').forEach(panel => {
    const packet = panel.querySelector<SVGCircleElement>('[data-decision-packet]');
    let active: Animation | undefined;
    panel.querySelectorAll<HTMLButtonElement>('[data-example]').forEach((button, index) => button.addEventListener('click', () => {
      active?.cancel();
      const path = panel.querySelector<SVGPathElement>(`.branch-${index} path`);
      if (!path || !packet) return;
      const length = path.getTotalLength(); const end = path.getPointAtLength(length);
      packet.setAttribute('cx', String(end.x)); packet.setAttribute('cy', String(end.y));
      packet.style.color = ['#15846e','#ffb829','#8052ff','#4c9aff','#e5484d'][index];
      draw(path);
      active = play(packet, Array.from({ length: 33 }, (_, step) => {
        const point = path.getPointAtLength(length * step / 32);
        return { transform: `translate(${point.x - end.x}px,${point.y - end.y}px)`, opacity: 1 };
      }), 800);
    }, { signal }));
  });

  root.querySelectorAll<HTMLElement>('[data-redaction]').forEach(panel => {
    const value = panel.querySelector<HTMLElement>('[data-redaction-value]')!;
    const button = panel.querySelector<HTMLButtonElement>('[data-redaction-run]')!;
    const status = panel.querySelector('[data-redaction-status]')!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (timer) { clearTimeout(timer); timers.delete(timer); timer = undefined; }
      value.textContent = panel.dataset.placeholder ?? '[بيانات منقحة]';
      panel.removeAttribute('data-scanning'); button.disabled = false;
      button.textContent = 'أعد مثال التنقيح'; status.textContent = 'اكتمل المثال الخيالي: استُبدلت القيمة بعبارة بيانات منقحة. لم تُرسل بيانات.';
    };
    finishers.add(finish);
    button.disabled = false;
    button.addEventListener('click', () => {
      value.textContent = value.dataset.original ?? ''; status.textContent = '';
      button.disabled = true; panel.setAttribute('data-scanning', '');
      if (reduced.matches) finish(); else timer = later(finish, 650);
    }, { signal });
  });

  root.querySelectorAll<HTMLElement>('[data-kernel-sequence]').forEach(panel => {
    const request = panel.querySelector('[data-kernel-request]')!;
    const output = panel.querySelector('[data-kernel-output]')!;
    const stages = [...panel.querySelectorAll<HTMLElement>('[data-kernel-stage]')];
    const button = panel.querySelector<HTMLButtonElement>('[data-kernel-play]')!;
    const skip = panel.querySelector<HTMLButtonElement>('[data-kernel-skip]')!;
    let run = 0;
    const text = request.textContent ?? '';
    const finish = () => {
      run++; request.textContent = text;
      stages.forEach((stage, i) => { stage.dataset.complete = 'true'; stage.removeAttribute('aria-current'); stage.dataset.active = String(i === 3); });
      output.textContent = 'النتيجة التعليمية: لخّص طلباً خيالياً بمعرّف [بيانات منقحة].';
      button.textContent = 'أعد التسلسل'; button.disabled = false; skip.disabled = false;
      panel.dataset.running = 'false';
    };
    finishers.add(finish); button.disabled = false; skip.disabled = false;
    button.addEventListener('click', () => {
      if (reduced.matches) { finish(); return; }
      const token = ++run; panel.dataset.running = 'true'; output.textContent = '';
      button.disabled = true; stages.forEach(stage => { delete stage.dataset.complete; delete stage.dataset.active; });
      let index = 0;
      const type = () => { if (run !== token) return; request.textContent = text.slice(0, index++); if (index <= text.length) later(type, 18); };
      type();
      stages.forEach((stage, i) => later(() => {
        if (run !== token) return;
        stages.forEach(item => { item.dataset.active = String(item === stage); item.removeAttribute('aria-current'); });
        stage.dataset.complete = 'true'; stage.setAttribute('aria-current', 'step');
        if (i === 2) request.textContent = 'لخّص طلباً خيالياً بمعرّف [بيانات منقحة].';
      }, 900 + i * 500));
      later(() => { if (run === token) finish(); }, 2800);
    }, { signal });
    skip.addEventListener('click', finish, { signal });
    if (reduced.matches) finish();
  });

  root.querySelectorAll<HTMLElement>('[data-approval-demo]').forEach(panel => {
    const output = panel.querySelector('[data-approval-output]')!;
    const messages: Record<string, string> = {
      pending: 'انتظار مراجعة مستقلة في المثال. غياب الرد لا يعني موافقة.',
      allow: 'موافقة توضيحية محددة النطاق بعد مراجعة مستقلة. لا تتجاوز الحظر الإلزامي، ولا تنفذ إجراءً فعلياً.',
      block: 'رفض توضيحي: يتوقف المسار مع سبب موثق. لا يُرسل قرار إلى نظام فعلي.',
    };
    panel.querySelectorAll<HTMLButtonElement>('[data-approval]').forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => {
        panel.dataset.approvalState = button.dataset.approval;
        panel.querySelectorAll('[data-approval]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        output.textContent = messages[button.dataset.approval ?? 'pending'];
        play(output, [{ opacity: .5 }, { opacity: 1 }], 220);
      }, { signal });
    });
  });
  root.querySelectorAll<HTMLElement>('[data-checklist]').forEach(panel => panel.addEventListener('change', () => {
    const total = panel.querySelectorAll('input').length;
    const count = panel.querySelectorAll('input:checked').length;
    panel.querySelector('[data-checklist-output]')!.textContent = `راجعت ${count} من ${total} عناصر تعليمية. هذه الاختيارات لا تثبت اعتماداً أو امتثالاً.`;
  }, { signal }));
  if (!legal) root.addEventListener('toggle', event => {
    const details = event.target;
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    const paragraph = details.querySelector('p');
    if (paragraph) play(paragraph, [{ opacity: .6, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 220);
    const symbol = details.closest('.motion-study')?.querySelector('svg');
    if (symbol) draw(symbol);
  }, { capture: true, signal });
  root.querySelectorAll<HTMLElement>('.experience-secure-chat').forEach(panel => {
    const bubble = panel.querySelector<HTMLElement>('.chat-bubble.assistant')!;
    const finish = () => bubble.classList.remove('motion-typing');
    finishers.add(finish);
    panel.querySelectorAll('[data-chat-example]').forEach(button => button.addEventListener('click', () => {
      finish();
      if (!reduced.matches) { bubble.classList.add('motion-typing'); later(finish, 650); }
      play(bubble, [{ opacity: .65, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], 300);
    }, { signal }));
  });
  // Only explain invalid mailto fields. No submission, tracking, or storage is added.
  const form = root.querySelector<HTMLFormElement>('#contact');
  form?.addEventListener('invalid', event => {
    const field = event.target as HTMLInputElement;
    field.setAttribute('aria-invalid', 'true');
    field.setCustomValidity('أكمل هذا الحقل لفتح رسالة البريد. لم يُرسل طلب.');
  }, { capture: true, signal });
  form?.addEventListener('input', event => {
    const field = event.target as HTMLInputElement;
    if ('setCustomValidity' in field) { field.setCustomValidity(''); field.removeAttribute('aria-invalid'); }
  }, { signal });

  // Product-specific focus relationships and native cross-document shared elements.
  const map = root.querySelector<HTMLElement>('.system-map');
  const focusMap = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>('a[href^="/products/"]');
    const slug = link?.getAttribute('href')?.split('/')[2];
    if (map) { if (slug) map.dataset.highlight = slug; else delete map.dataset.highlight; }
  };
  root.addEventListener('pointerover', event => focusMap(event.target), { signal });
  root.addEventListener('focusin', event => focusMap(event.target), { signal });
  root.addEventListener('pointerleave', () => { if (map) delete map.dataset.highlight; }, { signal });
  root.addEventListener('focusout', event => focusMap(event.relatedTarget), { signal });
  root.querySelectorAll('[data-scope-composer]').forEach(panel => panel.addEventListener('change', () => {
    const output = panel.querySelector('[data-scope-output]');
    if (output) play(output, [{ opacity: .65, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], 220);
  }, { signal }));

  // One frame per scroll; no permanent animation loop or scroll hijacking.
  const longForm = root.matches('.interior-privacy-index,.interior-terms-index,.interior-docs-index');
  let progress: HTMLProgressElement | undefined;
  let meter: HTMLDivElement | undefined;
  if (longForm) {
    progress = document.createElement('progress'); progress.max = 100; progress.value = 0;
    progress.className = 'motion-reading-progress'; progress.setAttribute('aria-label', 'تقدّم قراءة الصفحة');
    meter = document.createElement('div'); meter.className = 'motion-reading-meter';
    const track = document.createElement('span'); track.className = 'native-reading-track'; track.setAttribute('aria-hidden', 'true');
    meter.append(progress, track); root.prepend(meter);
  }
  const scrub = [...root.querySelectorAll<HTMLElement>('[data-motion="scrub"]')];
  const readingLinks = [...root.querySelectorAll<HTMLAnchorElement>('.document-toc a[href^="#"],.reading-nav a[href^="#"]')];
  const sections = readingLinks.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))) .filter((section): section is HTMLElement => !!section);
  let pending = false;
  const update = () => {
    pending = false;
    if (progress) { const rect = root.getBoundingClientRect(); progress.value = Math.max(0, Math.min(100, -rect.top / Math.max(1, rect.height - innerHeight) * 100)); }
    scrub.forEach(element => {
      const top = element.getBoundingClientRect().top;
      element.style.opacity = reduced.matches ? '1' : String(.5 + .5 * Math.max(0, Math.min(1, 1 - top / innerHeight)));
    });
    const positions = sections.map(section => ({ section, top: section.getBoundingClientRect().top }));
    const current = positions.filter(item => item.top <= innerHeight * .3).sort((a, b) => b.top - a.top)[0]?.section ?? sections[0];
    readingLinks.forEach(link => {
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (target === current || (current && target?.contains(current))) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = () => { if (pending) return; pending = true; const id = requestAnimationFrame(() => { frames.delete(id); update(); }); frames.add(id); };
  if (progress || scrub.length || readingLinks.length) { addEventListener('scroll', schedule, { passive: true, signal }); addEventListener('resize', schedule, { signal }); update(); }
  const preference = () => { if (reduced.matches) { animations.forEach(animation => animation.cancel()); finishers.forEach(finish => finish()); } update(); };
  reduced.addEventListener('change', preference, { signal });
  root.dataset.motionReady = 'true';
  return () => {
    lifetime.abort(); timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame);
    observers.forEach(observer => observer.disconnect()); animations.forEach(animation => animation.cancel());
    finishers.forEach(finish => finish()); meter?.remove();
    scrub.forEach(element => element.style.removeProperty('opacity')); delete root.dataset.motionReady;
  };
}
