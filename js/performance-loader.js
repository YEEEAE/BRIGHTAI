/**
 * Performance Loader - BrightAI
 * Intelligent resource loading for optimal performance
 * @version 2.0
 */

(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        // Delay before loading non-critical resources (ms)
        idleDelay: 100,
        // Resources to load after user interaction
        interactionResources: [],
        // Debug mode
        debug: false
    };

    // Track loaded resources
    const loadedResources = new Set();

    /**
     * Log message if debug mode is enabled
     */
    function log(message, data = null) {
        if (CONFIG.debug) {
            console.log(`[PerfLoader] ${message}`, data || '');
        }
    }

    /**
     * Load CSS file dynamically
     */
    function loadCSS(href, options = {}) {
        if (loadedResources.has(href)) return Promise.resolve();
        loadedResources.add(href);

        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;

            if (options.media) link.media = options.media;
            if (options.crossorigin) link.crossOrigin = options.crossorigin;

            link.onload = () => {
                log(`CSS loaded: ${href}`);
                resolve();
            };
            link.onerror = () => {
                log(`CSS failed: ${href}`);
                reject(new Error(`Failed to load CSS: ${href}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Load JavaScript file dynamically
     */
    function loadScript(src, options = {}) {
        if (loadedResources.has(src)) return Promise.resolve();
        loadedResources.add(src);

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;

            if (options.async !== false) script.async = true;
            if (options.defer) script.defer = true;
            if (options.module) script.type = 'module';
            if (options.crossorigin) script.crossOrigin = options.crossorigin;

            script.onload = () => {
                log(`Script loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                log(`Script failed: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };

            document.body.appendChild(script);
        });
    }

    /**
     * Preload a resource for future use
     */
    function preloadResource(href, as, options = {}) {
        if (loadedResources.has(`preload:${href}`)) return;
        loadedResources.add(`preload:${href}`);

        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = as;

        if (options.crossorigin) link.crossOrigin = options.crossorigin;
        if (options.type) link.type = options.type;

        document.head.appendChild(link);
        log(`Preloaded: ${href}`);
    }

    /**
     * Load non-critical CSS files
     */
    function loadNonCriticalCSS() {
        const cssFiles = [
            'css/design-tokens.css',
            'css/typography.css',
            'css/glass-morphism.css',
            'css/main.min.css',
            'css/premium-effects.min.css'
        ];

        // Load external CSS
        const externalCSS = [
            { href: 'https://unpkg.com/aos@2.3.4/dist/aos.css', crossorigin: 'anonymous' },
            { href: 'https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css', crossorigin: 'anonymous' }
        ];

        // Load local CSS files
        cssFiles.forEach(href => {
            loadCSS(href).catch(() => { });
        });

        // Load external CSS files
        externalCSS.forEach(({ href, crossorigin }) => {
            loadCSS(href, { crossorigin }).catch(() => { });
        });
    }

    /**
     * Load animation libraries
     */
    function loadAnimationLibraries() {
        // GSAP
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', { crossorigin: 'anonymous' })
            .then(() => loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', { crossorigin: 'anonymous' }))
            .catch(() => { });

        // AOS
        loadScript('https://unpkg.com/aos@2.3.4/dist/aos.js', { crossorigin: 'anonymous' })
            .then(() => {
                if (typeof AOS !== 'undefined') {
                    AOS.init({
                        duration: 800,
                        once: true,
                        offset: 100
                    });
                }
            })
            .catch(() => { });

        // Typed.js
        loadScript('https://cdn.jsdelivr.net/npm/typed.js@2.0.16/dist/typed.umd.js', { crossorigin: 'anonymous' })
            .catch(() => { });

        // Swiper
        loadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', { crossorigin: 'anonymous' })
            .catch(() => { });
    }

    /**
     * Load application scripts
     */
    function loadAppScripts() {
        const scripts = [
            'js/main.min.js',
            'js/premium-animations.min.js',
            'js/neural-canvas.min.js',
            'js/scroll-animations.min.js',
            'js/chat-groq.min.js'
        ];

        scripts.forEach((src, index) => {
            setTimeout(() => {
                loadScript(src).catch(() => { });
            }, index * 50);
        });
    }

    /**
     * Load Tailwind CSS dynamically (non-blocking)
     */
    function loadTailwind() {
        // Only load if not using prebuilt CSS
        const script = document.createElement('script');
        script.src = 'https://cdn.tailwindcss.com';
        script.async = true;
        script.onload = () => {
            log('Tailwind loaded');
            // Apply Tailwind config
            loadScript('js/tailwind-config.min.js').catch(() => { });
        };
        document.head.appendChild(script);
    }

    /**
     * Load Google Fonts efficiently
     */
    function loadFonts() {
        // Font URLs
        const fontUrl = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Tajawal:wght@400;500;700;800&display=swap';

        loadCSS(fontUrl, { crossorigin: 'anonymous' }).catch(() => { });
    }

    /**
     * Initialize Iconify
     */
    function loadIconify() {
        loadScript('https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js', { crossorigin: 'anonymous' })
            .catch(() => { });
    }

    /**
     * Main initialization
     */
    function init() {
        log('Initializing performance loader');

        // Use requestIdleCallback for non-critical resources
        const loadNonCritical = () => {
            loadTailwind();
            loadNonCriticalCSS();
            loadFonts();
            loadIconify();

            // Load animation libraries after a small delay
            setTimeout(loadAnimationLibraries, 200);

            // Load app scripts after animations
            setTimeout(loadAppScripts, 400);
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(loadNonCritical, { timeout: 2000 });
        } else {
            setTimeout(loadNonCritical, CONFIG.idleDelay);
        }

        // Load on user interaction (for very heavy resources)
        const loadOnInteraction = () => {
            // Remove listeners after first interaction
            [ 'mousemove', 'scroll', 'keydown', 'touchstart' ].forEach(event => {
                document.removeEventListener(event, loadOnInteraction);
            });
        };

        [ 'mousemove', 'scroll', 'keydown', 'touchstart' ].forEach(event => {
            document.addEventListener(event, loadOnInteraction, { passive: true, once: true });
        });
    }

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose API for manual loading
    window.PerfLoader = {
        loadCSS,
        loadScript,
        preloadResource,
        loadedResources
    };

})();
