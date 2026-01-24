/**
 * BrightAI - Scroll Animations Module
 * Implements scroll-triggered animations using IntersectionObserver
 * 
 * Features:
 * - fadeInUp animation for elements with .animate-trigger class
 * - Animated counters for statistics with data-count attribute
 * - Respects prefers-reduced-motion preference
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 13.1, 13.2
 */
'use strict';

/**
 * ScrollAnimations class handles all scroll-triggered animations
 */
class ScrollAnimations {
    constructor(options = {}) {
        this.threshold = options.threshold || 0.1;
        this.rootMargin = options.rootMargin || '0px';
        this.animationClass = options.animationClass || 'animate-visible';
        this.triggerClass = options.triggerClass || 'animate-trigger';
        this.counterDuration = options.counterDuration || 2000;
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Store observers for cleanup
        this.animationObserver = null;
        this.counterObserver = null;
        
        // Track animated counters to prevent re-animation
        this.animatedCounters = new WeakSet();
    }

    /**
     * Initialize all scroll animations
     */
    init() {
        if (!('IntersectionObserver' in window)) {
            console.warn('[ScrollAnimations] IntersectionObserver not supported, applying fallback');
            this.applyFallback();
            return;
        }

        this.initFadeInAnimations();
        this.initCounterAnimations();
        
        console.log('[ScrollAnimations] Initialized successfully');
    }

    /**
     * Initialize fadeInUp animations for elements with .animate-trigger class
     * Requirements: 6.1, 6.2, 6.3, 6.4
     */
    initFadeInAnimations() {
        const animatedElements = document.querySelectorAll(`.${this.triggerClass}`);
        
        if (!animatedElements.length) {
            return;
        }

        // Create IntersectionObserver with 0.1 threshold (Requirement 6.4)
        this.animationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Apply fadeInUp animation (Requirement 6.2)
                    this.applyFadeInAnimation(entry.target);
                    
                    // Unobserve element after animation triggers (Requirement 6.3)
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.threshold, // 0.1 threshold (Requirement 6.4)
            rootMargin: this.rootMargin
        });

        // Observe all elements with .animate-trigger class (Requirement 6.1)
        animatedElements.forEach(element => {
            // Set initial state for animation
            if (!this.prefersReducedMotion) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
            }
            this.animationObserver.observe(element);
        });
    }

    /**
     * Apply fadeInUp animation to an element
     * @param {HTMLElement} element - The element to animate
     */
    applyFadeInAnimation(element) {
        if (this.prefersReducedMotion) {
            // Skip animation for users who prefer reduced motion
            element.classList.add(this.animationClass);
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            return;
        }

        // Add animation class
        element.classList.add(this.animationClass);
        
        // Apply fadeInUp animation styles
        element.style.transition = 'opacity 0.6s cubic-bezier(0.645, 0.045, 0.355, 1), transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1)';
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        // Push analytics event
        this.pushAnimationEvent(element);
    }

    /**
     * Initialize animated counters for statistics
     * Requirements: 13.1, 13.2
     */
    initCounterAnimations() {
        const counterElements = document.querySelectorAll('[data-count]');
        
        if (!counterElements.length) {
            return;
        }

        // Create separate observer for counters
        this.counterObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: this.threshold,
            rootMargin: this.rootMargin
        });

        counterElements.forEach(element => {
            this.counterObserver.observe(element);
        });
    }

    /**
     * Animate a counter from 0 to target value
     * @param {HTMLElement} element - The counter element with data-count attribute
     * Requirements: 13.1, 13.2
     */
    animateCounter(element) {
        // Prevent re-animation
        if (this.animatedCounters.has(element)) {
            return;
        }
        this.animatedCounters.add(element);

        const target = parseInt(element.getAttribute('data-count'), 10);
        
        if (isNaN(target)) {
            console.warn('[ScrollAnimations] Invalid data-count value:', element.getAttribute('data-count'));
            return;
        }

        // For reduced motion, just set the final value
        if (this.prefersReducedMotion) {
            element.textContent = this.formatNumber(target);
            return;
        }

        const duration = this.counterDuration;
        const startTime = performance.now();
        const startValue = 0;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuart for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(startValue + (target - startValue) * easeProgress);
            
            element.textContent = this.formatNumber(currentValue);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Ensure final value is exact
                element.textContent = this.formatNumber(target);
                
                // Push analytics event
                this.pushCounterEvent(element, target);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    /**
     * Format number with locale-appropriate separators
     * @param {number} num - The number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        // Use Arabic locale for RTL pages
        const isRTL = document.documentElement.dir === 'rtl';
        const locale = isRTL ? 'ar-SA' : 'en-US';
        
        try {
            return num.toLocaleString(locale);
        } catch (e) {
            return num.toString();
        }
    }

    /**
     * Push animation event to dataLayer for analytics
     * @param {HTMLElement} element - The animated element
     */
    pushAnimationEvent(element) {
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                event: 'scroll_animation',
                element_class: element.className,
                element_id: element.id || 'unnamed'
            });
        }
    }

    /**
     * Push counter animation event to dataLayer
     * @param {HTMLElement} element - The counter element
     * @param {number} value - The final counter value
     */
    pushCounterEvent(element, value) {
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                event: 'counter_animation_complete',
                counter_value: value,
                element_id: element.id || 'unnamed'
            });
        }
    }

    /**
     * Fallback for browsers without IntersectionObserver support
     */
    applyFallback() {
        // Make all animated elements visible
        document.querySelectorAll(`.${this.triggerClass}`).forEach(element => {
            element.classList.add(this.animationClass);
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });

        // Set counter values directly
        document.querySelectorAll('[data-count]').forEach(element => {
            const target = parseInt(element.getAttribute('data-count'), 10);
            if (!isNaN(target)) {
                element.textContent = this.formatNumber(target);
            }
        });
    }

    /**
     * Cleanup observers
     */
    destroy() {
        if (this.animationObserver) {
            this.animationObserver.disconnect();
            this.animationObserver = null;
        }
        if (this.counterObserver) {
            this.counterObserver.disconnect();
            this.counterObserver = null;
        }
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScrollAnimations };
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.scrollAnimations = new ScrollAnimations({
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        counterDuration: 2000
    });
    
    window.scrollAnimations.init();
});
