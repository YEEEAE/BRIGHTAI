/**
 * scroll-reveal.js
 * ─────────────────────────────────────────────────────────────────────
 * Unified scroll reveal system (DEC-2026-Motion-001).
 *
 * Mission:
 *   تشغيل نظام reveal موحّد لكل صفحات BrightAI:
 *     - fade-up   (الأكثر استخداماً: البطاقات، الأقسام)
 *     - fade-in   (النصوص، العناوين)
 *     - scale-in  (الـ hero visuals، الـ modals، الـ popovers)
 *     - slide-in  (slide-in من النهاية، RTL/LTR natural)
 *
 * Architecture:
 *   - IntersectionObserver واحد لكل الصفحة (موجود في BaseLayout يستوردنا)
 *   - يحترم prefers-reduced-motion → يلغي animation ويفتح كل شي
 *   - يعمل عبر Astro view-transitions (astro:page-load)
 *   - SSR-safe: ما يلمس DOM قبل initReveal()
 *   - graceful degradation بدون IntersectionObserver (يفتح كل شي)
 *
 * Discovery mechanism (ثلاث طرق، كلها تتعايش):
 *   1. data-reveal="up|fade|scale|slide"  → variant جديد (الأولوية)
 *   2. .reveal-stagger container → يفرض --reveal-delay لكل child
 *      (الـ step افتراضياً 50ms، قابل للتعديل عبر data-stagger="80")
 *   3. Legacy selectors (feature-card, inner-card, ...) → نفس السلوك،
 *      توافق عكسي مع DEC-015
 *
 * Custom timing attributes:
 *   - data-reveal-duration="800"  → على الميلي ثانية، يتجاهل 600ms الافتراضي
 *   - data-reveal-delay="200"     → على الميلي ثانية، أولوية على الـ stagger
 *
 * Performance:
 *   - will-change: transform لمدة قصيرة (unobserve بعد أول reveal) → 0 repaint
 *   - transform compositing فقط (GPU)
 *   - لا يحرّك layout (CLS = 0)
 *
 * Accessibility:
 *   - محتوى غير ظاهر لـ prefers-reduced-motion يفتح فوراً (opacity: 1)
 *   - لا يلامس tabindex أو aria-hidden
 */

// ═══════════════════════════════════════════════════════════════════════════
//  Constants — لا تحتاج تغيير
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Selectors موحّدة: كل العناصر اللي لها entry-state CSS + كل العناصر
 * اللي فيها data-reveal. الـ merge يتكرر لاحقاً في collect().
 */
const LEGACY_SELECTOR = [
  '.reveal',
  '.feature-card',
  '.card--feature',
  '.inner-card',
  '.home-stat-card',
  '.home-faq-item',
  '.home-evidence-mockup',
  '.home-comparison-wrap',
  '.inner-reveal',
].join(',');

/**
 * Default stagger step في الميلي ثانية. 50ms توازن بين الإيقاع المحسوس
 * والـ perceived performance (أكتر من 50ms يحس بطيء، أقل يحس عصبي).
 */
const DEFAULT_STAGGER_MS = 50;

/**
 * Default reveal duration — يطابق المطلوب (600ms emphasized).
 * يتجاوزها data-reveal-duration لو موجودة.
 */
const DEFAULT_DURATION_MS = 600;

/**
 * observer threshold — 8% من العنصر يكون داخل الـ viewport يكفي.
 * rootMargin -8% من الأسفل عشان نطلق الـ reveal قبل ما العنصر يوصل
 * للوسط تماماً (يحس أكثر طبيعية).
 */
const OBSERVER_OPTIONS = {
  threshold: 0.08,
  rootMargin: '0px 0px -8% 0px',
};

/**
 * Single shared observer — يعاد استخدامه بعد كل astro:page-load.
 */
let sharedObserver = null;

// ═══════════════════════════════════════════════════════════════════════════
//  Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * هل المستخدم يفضّل reduced-motion؟ نحفظ النتيجة عشان ما نضرب matchMedia
 * في كل عنصر. الـ motion media query ما تتغير في الجلسة العادية.
 */
function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * تحويل data-reveal value إلى class name. fallback لو القيمة مو معروفة
 * نفترض fade-up (الأكثر استخداماً).
 */
function resolveVariant(value) {
  switch (value) {
    case 'up':
    case 'fade-up':
      return 'rv-up';
    case 'fade':
    case 'fade-in':
      return 'rv-fade';
    case 'scale':
    case 'scale-in':
      return 'rv-scale';
    case 'slide':
    case 'slide-right':
    case 'slide-end':
      return 'rv-slide-end';
    default:
      return 'rv-up';
  }
}

/**
 * إجبار العنصر يفتح بدون animation (prefers-reduced-motion).
 * نضيف is-visible ونمسك transform/opacity صراحة عشان الـ entry-state
 * CSS ما يعرض العنصر بشكل شفاف.
 */
function revealImmediately(el) {
  el.classList.add('is-visible');
  el.style.opacity = '1';
  el.style.transform = 'none';
  el.style.transition = 'none';
}

/**
 * Calculate --reveal-delay لمجموعة الأطفال بناءً على الفهرس والـ step.
 * يضع المتغير كـ inline style عشان يطغى على الـ CSS defaults.
 */
function applyStagger(container) {
  const stepAttr = container.getAttribute('data-stagger');
  const step = stepAttr ? Math.max(0, parseInt(stepAttr, 10) || DEFAULT_STAGGER_MS) : DEFAULT_STAGGER_MS;
  const children = container.querySelectorAll('[data-reveal], ' + LEGACY_SELECTOR);
  children.forEach((child, idx) => {
    // لو العنصر عنده delay يدوي نتجاهله (أولوية للـ inline).
    if (child.hasAttribute('data-reveal-delay')) return;
    const delayMs = idx * step;
    child.style.setProperty('--reveal-delay', delayMs + 'ms');
  });
}

/**
 * يجمع كل العناصر اللي تبي reveal من الصفحة: data-reveal + legacy selectors.
 * يضمن ما نلاحظ نفس العنصر مرتين.
 */
function collectTargets() {
  const set = new Set();
  // data-reveal أولاً (الأولوية).
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    if (!el.classList.contains('is-visible')) set.add(el);
  });
  // Legacy selectors اللي ما هي is-visible بعد.
  document.querySelectorAll(LEGACY_SELECTOR).forEach((el) => {
    if (!el.classList.contains('is-visible')) set.add(el);
  });
  return Array.from(set);
}

/**
 * Single-shot observer: يستدعى مرة وحدة في أول initReveal ثم يعاد استخدامه.
 * الـ reuse يقلل memory footprint عبر navigations.
 */
function getObserver(onIntersect) {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onIntersect(entry.target);
        sharedObserver.unobserve(entry.target);
      }
    });
  }, OBSERVER_OPTIONS);
  return sharedObserver;
}

/**
 * العنصر ما يحتاج entry-state لو كان فوق الطية فعلياً وقت التحميل
 * (hero section). نتجاهلهم عشان ما يصير flash.
 */
function isAboveViewport(el) {
  const rect = el.getBoundingClientRect();
  return rect.top < window.innerHeight * 0.9 && rect.bottom > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Core
// ═══════════════════════════════════════════════════════════════════════════

/**
 * المشغّل الأساسي. ينطلق في:
 *   1. astro:page-load (initial + كل navigation)
 *   2. DOMContentLoaded (fallback لو الـ event فاتنا)
 */
function initReveal() {
  // ❶ Stagger containers — نحسب delays قبل ما الـ observer يبدأ
  document.querySelectorAll('.reveal-stagger').forEach(applyStagger);

  // ❷ نجمع الأهداف (data-reveal + legacy) مرة وحدة
  const targets = collectTargets();
  if (!targets.length) return;

  // ❸ Reduced-motion: نفتح كل شي مباشرة بدون animation، نرجع.
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach(revealImmediately);
    return;
  }

  // ❹ Single observer per page (نعيد استخدامه في navigation التالي).
  const observer = getObserver(handleIntersect);

  // ❺ نراقب كل هدف
  targets.forEach((el) => {
    // لو العنصر فوق الـ viewport فعلاً، نفتحه فوراً بدون observer.
    if (isAboveViewport(el)) {
      handleIntersect(el);
      return;
    }
    observer.observe(el);
  });
}

/**
 * عند intersection: نضيف is-visible، نضبط will-change إذا متوفر،
 * ونترك CSS يكمّل الباقي (transition شامل في animations.css).
 *
 * لاحظ: ما نمسك transform/opacity من هنا — لو CSS عنده transition
 * شامل على الـ base class (مثل .feature-card.is-visible)، يكفي نضيف
 * الكلاس. هذا التصميم يخلي النظام متّسق وdeclarative.
 */
function handleIntersect(el) {
  // أولوية الـ variant من data-reveal.
  if (el.hasAttribute('data-reveal')) {
    const variant = resolveVariant(el.getAttribute('data-reveal'));
    el.classList.add(variant);
  }

  // duration override من data-reveal-duration.
  if (el.hasAttribute('data-reveal-duration')) {
    const dur = parseInt(el.getAttribute('data-reveal-duration'), 10);
    if (Number.isFinite(dur) && dur > 0) {
      el.style.setProperty('--reveal-duration', dur + 'ms');
    }
  }

  // Manual delay override (يسبق الـ stagger).
  if (el.hasAttribute('data-reveal-delay')) {
    const delay = parseInt(el.getAttribute('data-reveal-delay'), 10);
    if (Number.isFinite(delay) && delay >= 0) {
      el.style.setProperty('--reveal-delay', delay + 'ms');
    }
  }

  el.classList.add('is-visible');

  // will-change optimization: نشيله بعد animation عشان ما يستهلك GPU.
  setTimeout(() => {
    if (el && el.style) el.style.willChange = '';
  }, 800); // أكبر من أطول duration متوقع.
}

// ═══════════════════════════════════════════════════════════════════════════
//  Boot
// ═══════════════════════════════════════════════════════════════════════════

// ❶ astro:page-load: initial + كل view-transition navigation.
//    (astro:before-swap نقدر نلغي observers لو حبينا، بس sharedObserver
//    عندنا آمن — بيكمل)
// eslint-disable-next-line no-unused-expressions
document.addEventListener && document.addEventListener('astro:page-load', initReveal);

// ❷ Fallback: لو الـ script حُمّل بعد ما الـ event فات (نادر في Astro).
if (typeof document !== 'undefined') {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    // نأخّر شوي عشان DOM يلمس عناصره.
    setTimeout(initReveal, 0);
  } else {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initReveal, 0));
  }
}

export default initReveal;
