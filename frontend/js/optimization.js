/**
 * optimization.js
 * Handles deferred loading of non-critical resources to improve TBT and FCP.
 * Strategies:
 * 1. Load GTM/Analytics only after user interaction.
 * 2. Load AOS (Animate On Scroll) lazily.
 * 3. Load Iconify lazily.
 */

// Helper: Scheduler yield for long tasks
function yieldToMain() {
    return new Promise(resolve => {
        if ('scheduler' in window && 'yield' in scheduler) {
            scheduler.yield().then(resolve);
        } else {
            setTimeout(resolve, 0);
        }
    });
}

// 1. Deferred GTM
function loadAnalytics() {
    if (window._gaLoaded) return;
    window._gaLoaded = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q';
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', 'G-8LLESL207Q');
}

// 2. Deferred AOS
function loadAOS() {
    if (window._aosLoaded) return;
    window._aosLoaded = true;

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css';
    document.head.appendChild(link);

    // Load JS
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js';
    s.onload = () => {
        requestAnimationFrame(() => {
            AOS.init({
                duration: 600,
                once: true,
                offset: 50,
                disable: 'mobile' // Optional performance boost
            });
        });
    };
    document.body.appendChild(s);
}

// 3. Deferred Iconify
function loadIconify() {
    if (window._iconifyLoaded) return;
    window._iconifyLoaded = true;
    const s = document.createElement('script');
    s.src = 'https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js';
    document.body.appendChild(s);
}

// Main Initialization
function initOptimization() {
    const events = ['scroll', 'click', 'touchstart', 'keydown', 'mousemove'];

    const loadAll = () => {
        // Remove listeners
        events.forEach(e => window.removeEventListener(e, loadAll));

        // Execute deferred loads
        loadAnalytics();
        loadAOS();
        loadIconify();

        // Optional: Trigger any other interaction-dependent logic
        document.body.classList.add('interaction-active');
    };

    // Add listeners for one-time execution
    events.forEach(e => window.addEventListener(e, loadAll, { once: true, passive: true }));

    // Fallback: load after 4 seconds if no interaction
    setTimeout(loadAll, 4000);
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOptimization);
} else {
    initOptimization();
}
