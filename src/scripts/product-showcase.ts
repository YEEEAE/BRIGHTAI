// Progressive enhancement: text and navigation are visible without JavaScript.
const showcase = document.querySelector<HTMLElement>('[data-product-showcase]');
if (showcase) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const running = new Set<Animation>();
  const reveal = (node: HTMLElement, index = 0) => {
    if (reduced.matches || !node.animate) return;
    const animation = node.animate([
      { opacity: .25, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 480, delay: Math.min(index, 2) * 45, easing: getComputedStyle(node).getPropertyValue('--ease-out').trim() || 'ease-out' });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  };
  const cards = [...showcase.querySelectorAll<HTMLElement>('[data-product-card]')];
  if ('IntersectionObserver' in window) {
    const entrances = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const node = entry.target as HTMLElement;
        reveal(node, cards.indexOf(node) % 2);
        entrances.unobserve(node);
      });
    }, { threshold: .12 });
    showcase.querySelectorAll<HTMLElement>('[data-text-reveal], [data-product-card]').forEach(node => entrances.observe(node));
    const links = [...showcase.querySelectorAll<HTMLAnchorElement>('.product-index a')];
    const visible = new Map<string, number>();
    const locationObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0));
      const active = [...visible].sort((a,b) => b[1]-a[1])[0];
      links.forEach(link => {
        if (active?.[1] && link.hash === `#${active[0]}`) link.setAttribute('aria-current','location');
        else link.removeAttribute('aria-current');
      });
    }, { threshold:[0,.25,.5,.75] });
    cards.forEach(card => locationObserver.observe(card));
  }
  cards.forEach(card => {
    const light = card.querySelector<HTMLElement>('.card-spotlight');
    let frame = 0;
    card.addEventListener('pointermove', event => {
      if (!pointer.matches || reduced.matches || !light) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        // Move only the decorative layer; text stays still and all links stay reachable.
        light.style.transform = `translate(${(event.clientX - rect.left - rect.width/2)*.08}px, ${(event.clientY - rect.top - rect.height/2)*.08}px)`;
      });
    });
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      if (light) light.style.transform = '';
    });
  });
  const finishMotion = () => { if (reduced.matches) running.forEach(animation => animation.cancel()); };
  reduced.addEventListener('change', finishMotion);
  addEventListener('pagehide', () => running.forEach(animation => animation.cancel()));
}
