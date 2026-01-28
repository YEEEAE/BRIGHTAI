// Inline minimal loader for fastest execution
(function () {
    'use strict';

    // Load CSS file dynamically
    function loadCSS(href) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }

    // Load Script file dynamically  
    function loadScript(src, callback) {
        var script = document.createElement('script');
        script.src = src;
        script.async = true;
        if (callback) script.onload = callback;
        document.body.appendChild(script);
    }

    // Load non-critical resources after initial paint
    function loadDeferredResources() {
        // Tailwind CSS (non-blocking)
        loadScript('https://cdn.tailwindcss.com', function () {
            loadScript('frontend/js/tailwind-config.min.js');
        });

        // Fonts
        loadCSS('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap');
        loadCSS('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap');
        loadCSS('https://fonts.googleapis.com/css?family=Amiri&subset=arabic,latin');

        // Centralized Design System
        loadCSS('frontend/css/brightai-core.css');

        // External CSS
        loadCSS('https://unpkg.com/aos@2.3.4/dist/aos.css');
        loadCSS('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css');

        // Iconify
        loadScript('https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js');

        // Bright AI UI Enhancements (UX/Visuals)
        loadScript('frontend/js/ui-enhancements.js');
    }

    // Load animation libraries after interaction or timeout
    function loadAnimations() {
        // GSAP
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', function () {
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js');
        });

        // AOS
        loadScript('https://unpkg.com/aos@2.3.4/dist/aos.js', function () {
            if (typeof AOS !== 'undefined') {
                AOS.init({ duration: 800, once: true, offset: 100 });
            }
        });

        // Typed.js
        loadScript('https://cdn.jsdelivr.net/npm/typed.js@2.0.16/dist/typed.umd.js');

        // Swiper
        loadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js');
    }

    // Execute after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            // Load deferred resources immediately
            if ('requestIdleCallback' in window) {
                requestIdleCallback(loadDeferredResources, { timeout: 1500 });
            } else {
                setTimeout(loadDeferredResources, 50);
            }

            // Load animations after a small delay
            setTimeout(loadAnimations, 300);
        });
    } else {
        // DOM already loaded
        loadDeferredResources();
        setTimeout(loadAnimations, 300);
    }
})();
