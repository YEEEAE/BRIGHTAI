/**
 * BrightAI Analytics Tracker
 * Comprehensive analytics tracking for scroll depth, time on page, and CTA clicks
 * Version: 1.0.0
 * Requirements: 12.1, 12.2, 12.3
 */
'use strict';

/**
 * Analytics Tracker Module
 * Pushes events to dataLayer for GTM integration
 */
const BrightAIAnalytics = (function() {
    // Configuration
    const config = {
        scrollDepthThresholds: [25, 50, 75, 100],
        ctaSelector: '[data-track]',
        debugMode: false
    };

    // State tracking
    const state = {
        scrollDepthReached: new Set(),
        pageLoadTime: Date.now(),
        isInitialized: false
    };

    /**
     * Initialize dataLayer if not already present
     */
    function initDataLayer() {
        window.dataLayer = window.dataLayer || [];
    }

    /**
     * Push event to dataLayer
     * @param {Object} eventData - Event data to push
     */
    function pushEvent(eventData) {
        initDataLayer();
        window.dataLayer.push(eventData);
        if (config.debugMode) {
            console.log('[BrightAI Analytics] Event pushed:', eventData);
        }
    }

    /**
     * =================================================================================
     * SCROLL DEPTH TRACKING (Requirements 12.1)
     * Tracks scroll depth at 25%, 50%, 75%, 100% intervals
     * =================================================================================
     */
    function initScrollDepthTracking() {
        // Calculate scroll percentage
        function getScrollPercentage() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            
            if (scrollHeight <= 0) return 100; // Page fits in viewport
            
            return Math.round((scrollTop / scrollHeight) * 100);
        }

        // Check and fire scroll depth events
        function checkScrollDepth() {
            const currentPercentage = getScrollPercentage();
            
            config.scrollDepthThresholds.forEach(threshold => {
                if (currentPercentage >= threshold && !state.scrollDepthReached.has(threshold)) {
                    state.scrollDepthReached.add(threshold);
                    
                    pushEvent({
                        event: 'scroll_depth',
                        scroll_depth_threshold: threshold,
                        scroll_depth_percentage: threshold + '%',
                        page_path: window.location.pathname,
                        page_title: document.title
                    });
                }
            });
        }

        // Throttled scroll handler
        let scrollTimeout;
        function handleScroll() {
            if (scrollTimeout) return;
            
            scrollTimeout = setTimeout(() => {
                checkScrollDepth();
                scrollTimeout = null;
            }, 100);
        }

        // Add scroll listener
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        // Check initial scroll position (in case page loads scrolled)
        checkScrollDepth();
    }

    /**
     * =================================================================================
     * TIME ON PAGE TRACKING (Requirements 12.2)
     * Calculates and sends time spent on page before unload
     * =================================================================================
     */
    function initTimeOnPageTracking() {
        // Calculate time spent on page
        function getTimeOnPage() {
            return Math.round((Date.now() - state.pageLoadTime) / 1000); // in seconds
        }

        // Send time on page event
        function sendTimeOnPage() {
            const timeSpent = getTimeOnPage();
            
            pushEvent({
                event: 'time_on_page',
                time_on_page_seconds: timeSpent,
                time_on_page_formatted: formatTime(timeSpent),
                page_path: window.location.pathname,
                page_title: document.title
            });
        }

        // Format time for readability
        function formatTime(seconds) {
            if (seconds < 60) {
                return seconds + ' ثانية';
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                return minutes + ' دقيقة ' + remainingSeconds + ' ثانية';
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                return hours + ' ساعة ' + minutes + ' دقيقة';
            }
        }

        // Use visibilitychange for more reliable tracking
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                sendTimeOnPage();
            }
        });

        // Fallback: beforeunload for browsers that don't support visibilitychange well
        window.addEventListener('beforeunload', function() {
            sendTimeOnPage();
        });

        // Also track when page becomes visible again (for session tracking)
        let hiddenTime = null;
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                hiddenTime = Date.now();
            } else if (document.visibilityState === 'visible' && hiddenTime) {
                // Adjust page load time to exclude hidden time
                const hiddenDuration = Date.now() - hiddenTime;
                state.pageLoadTime += hiddenDuration;
                hiddenTime = null;
            }
        });
    }

    /**
     * =================================================================================
     * CTA CLICK TRACKING (Requirements 12.3)
     * Tracks clicks on elements with data-track attribute
     * =================================================================================
     */
    function initCTAClickTracking() {
        // Handle CTA click
        function handleCTAClick(event) {
            const element = event.target.closest(config.ctaSelector);
            if (!element) return;

            // Get tracking data from data attributes
            const trackData = {
                event: 'cta_click',
                cta_name: element.dataset.track || element.textContent.trim(),
                cta_category: element.dataset.trackCategory || 'CTA',
                cta_label: element.dataset.trackLabel || element.getAttribute('aria-label') || element.textContent.trim(),
                cta_location: element.dataset.trackLocation || getElementLocation(element),
                cta_url: element.href || null,
                page_path: window.location.pathname,
                page_title: document.title
            };

            pushEvent(trackData);
        }

        // Determine element location on page
        function getElementLocation(element) {
            // Check if element is in specific sections
            const section = element.closest('section, header, footer, nav, aside');
            if (section) {
                if (section.id) return section.id;
                if (section.className) {
                    const classes = section.className.split(' ').filter(c => c);
                    if (classes.length > 0) return classes[0];
                }
                return section.tagName.toLowerCase();
            }
            return 'page';
        }

        // Add click listener using event delegation
        document.addEventListener('click', handleCTAClick);
    }

    /**
     * Initialize all analytics tracking
     */
    function init() {
        if (state.isInitialized) {
            console.warn('[BrightAI Analytics] Already initialized');
            return;
        }

        initDataLayer();
        initScrollDepthTracking();
        initTimeOnPageTracking();
        initCTAClickTracking();

        state.isInitialized = true;
        
        if (config.debugMode) {
            console.log('[BrightAI Analytics] Initialized successfully');
        }
    }

    /**
     * Enable debug mode
     */
    function enableDebug() {
        config.debugMode = true;
        console.log('[BrightAI Analytics] Debug mode enabled');
    }

    /**
     * Get current scroll depth reached
     */
    function getScrollDepthReached() {
        return Array.from(state.scrollDepthReached).sort((a, b) => a - b);
    }

    /**
     * Get time on page in seconds
     */
    function getTimeOnPage() {
        return Math.round((Date.now() - state.pageLoadTime) / 1000);
    }

    // Public API
    return {
        init: init,
        enableDebug: enableDebug,
        getScrollDepthReached: getScrollDepthReached,
        getTimeOnPage: getTimeOnPage,
        pushEvent: pushEvent
    };
})();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', BrightAIAnalytics.init);
} else {
    BrightAIAnalytics.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BrightAIAnalytics;
}
