/**
 * BrightAI Enterprise - Scroll Animations Module
 * Implements scroll-triggered animations using IntersectionObserver
 * 
 * Features:
 * - Fade-in animations for sections with .animate-on-scroll class
 * - Animated counters for statistics with data-count attribute
 * - Staggered reveal for cards with .stagger-item class
 * - Full support for prefers-reduced-motion preference
 * 
 * Requirements: REQ-4 (Motion Design)
 * - 4.1 Storytelling عند التمرير
 * - 4.2 أنيميشن ناعمة
 * - 4.3 Micro-interactions
 * - 4.4 الأداء وإمكانية الوصول
 */
'use strict';

/**
 * EnterpriseScrollAnimations - Main animation controller class
 */
class EnterpriseScrollAnimations {
    constructor(options = {}) {
        // Configuration with defaults
        this.config = {
            // Intersection Observer settings
            threshold: options.threshold || 0.15,
            rootMargin: options.rootMargin || '0px 0px -50px 0px',
            
            // Animation classes
            fadeInClass: options.fadeInClass || 'animate-on-scroll',
            visibleClass: options.visibleClass || 'is-visible',
            staggerClass: options.staggerClass || 'stagger-item',
            staggerContainerClass: options.staggerContainerClass || 'stagger-container',
            
            // Animation timing
            counterDuration: options.counterDuration || 2000,
            staggerDelay: options.staggerDelay || 100,
            animationDuration: options.animationDuration || 600,
            
            // Easing
            easing: options.easing || 'cubic-bezier(0.4, 0, 0.2, 1)'
        };
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Listen for changes in reduced motion preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.prefersReducedMotion = e.matches;
            if (this.prefersReducedMotion) {
                this.applyReducedMotionFallback();
            }
        });
        
        // Store observers for cleanup
        this.observers = {
            fadeIn: null,
            counter: null,
            stagger: null
        };
        
        // Track animated elements to prevent re-animation
        this.animatedElements = new WeakSet();
        this.animatedCounters = new WeakSet();
    }

    /**
     * Initialize all scroll animations
     */
    init() {
        // Check for IntersectionObserver support
        if (!('IntersectionObserver' in window)) {
            console.warn('[EnterpriseScrollAnimations] IntersectionObserver not supported, applying fallback');
            this.applyFallback();
            return;
        }

        // Inject required CSS styles
        this.injectStyles();
        
        // Initialize different animation types
        this.initFadeInAnimations();
        this.initCounterAnimations();
        this.initStaggerAnimations();
        
        console.log('[EnterpriseScrollAnimations] Initialized successfully', {
            reducedMotion: this.prefersReducedMotion
        });
    }

    /**
     * Inject CSS styles for animations
     */
    injectStyles() {
        // Check if styles already exist
        if (document.getElementById('enterprise-scroll-animations-styles')) {
            return;
        }

        const styles = document.createElement('style');
        styles.id = 'enterprise-scroll-animations-styles';
        styles.textContent = `
            /* ========== Fade-in Animation Styles ========== */
            .animate-on-scroll {
                opacity: 0;
                transform: translateY(30px);
                transition: opacity ${this.config.animationDuration}ms ${this.config.easing},
                            transform ${this.config.animationDuration}ms ${this.config.easing};
            }
            
            .animate-on-scroll.is-visible {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Fade-in from left (for RTL support) */
            .animate-on-scroll.from-left {
                transform: translateX(30px);
            }
            
            .animate-on-scroll.from-left.is-visible {
                transform: translateX(0);
            }
            
            /* Fade-in from right */
            .animate-on-scroll.from-right {
                transform: translateX(-30px);
            }
            
            .animate-on-scroll.from-right.is-visible {
                transform: translateX(0);
            }
            
            /* Scale-in animation */
            .animate-on-scroll.scale-in {
                transform: scale(0.95);
            }
            
            .animate-on-scroll.scale-in.is-visible {
                transform: scale(1);
            }
            
            /* ========== Stagger Animation Styles ========== */
            .stagger-container .stagger-item {
                opacity: 0;
                transform: translateY(20px);
                transition: opacity ${this.config.animationDuration}ms ${this.config.easing},
                            transform ${this.config.animationDuration}ms ${this.config.easing};
            }
            
            .stagger-container.is-visible .stagger-item {
                opacity: 1;
                transform: translateY(0);
            }
            
            /* Stagger delays - generated dynamically */
            ${this.generateStaggerDelays(12)}
            
            /* ========== Counter Animation Styles ========== */
            [data-count] {
                transition: color 0.3s ease;
            }
            
            [data-count].counting {
                color: var(--color-gold-500, #D4AF37);
            }
            
            /* ========== Reduced Motion Support ========== */
            @media (prefers-reduced-motion: reduce) {
                .animate-on-scroll,
                .stagger-container .stagger-item {
                    opacity: 1 !important;
                    transform: none !important;
                    transition: none !important;
                }
                
                .stagger-container.is-visible .stagger-item {
                    transition-delay: 0ms !important;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    /**
     * Generate CSS for stagger delays
     * @param {number} count - Number of items to generate delays for
     * @returns {string} CSS rules for stagger delays
     */
    generateStaggerDelays(count) {
        let css = '';
        for (let i = 1; i <= count; i++) {
            css += `.stagger-container.is-visible .stagger-item:nth-child(${i}) {
                transition-delay: ${(i - 1) * this.config.staggerDelay}ms;
            }\n`;
        }
        return css;
    }

    /**
     * Initialize fade-in animations for elements with .animate-on-scroll class
     */
    initFadeInAnimations() {
        const elements = document.querySelectorAll(`.${this.config.fadeInClass}`);
        
        if (!elements.length) {
            return;
        }

        // If reduced motion is preferred, show all elements immediately
        if (this.prefersReducedMotion) {
            elements.forEach(el => {
                el.classList.add(this.config.visibleClass);
            });
            return;
        }

        // Create IntersectionObserver
        this.observers.fadeIn = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animatedElements.add(entry.target);
                    
                    // Add visible class to trigger animation
                    entry.target.classList.add(this.config.visibleClass);
                    
                    // Unobserve after animation
                    observer.unobserve(entry.target);
                    
                    // Push analytics event
                    this.pushAnalyticsEvent('scroll_animation', {
                        element_id: entry.target.id || 'unnamed',
                        element_class: entry.target.className
                    });
                }
            });
        }, {
            threshold: this.config.threshold,
            rootMargin: this.config.rootMargin
        });

        // Observe all elements
        elements.forEach(element => {
            this.observers.fadeIn.observe(element);
        });
    }

    /**
     * Initialize stagger animations for card grids
     */
    initStaggerAnimations() {
        const containers = document.querySelectorAll(`.${this.config.staggerContainerClass}`);
        
        if (!containers.length) {
            return;
        }

        // If reduced motion is preferred, show all immediately
        if (this.prefersReducedMotion) {
            containers.forEach(container => {
                container.classList.add(this.config.visibleClass);
            });
            return;
        }

        // Create IntersectionObserver for stagger containers
        this.observers.stagger = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animatedElements.add(entry.target);
                    
                    // Add visible class to container (triggers staggered children)
                    entry.target.classList.add(this.config.visibleClass);
                    
                    // Unobserve after animation
                    observer.unobserve(entry.target);
                    
                    // Push analytics event
                    this.pushAnalyticsEvent('stagger_animation', {
                        container_id: entry.target.id || 'unnamed',
                        item_count: entry.target.querySelectorAll(`.${this.config.staggerClass}`).length
                    });
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -30px 0px'
        });

        // Observe all containers
        containers.forEach(container => {
            this.observers.stagger.observe(container);
        });
    }

    /**
     * Initialize animated counters for statistics
     */
    initCounterAnimations() {
        const counters = document.querySelectorAll('[data-count]');
        
        if (!counters.length) {
            return;
        }

        // If reduced motion is preferred, set final values immediately
        if (this.prefersReducedMotion) {
            counters.forEach(counter => {
                const target = this.parseCounterValue(counter.getAttribute('data-count'));
                counter.textContent = this.formatNumber(target, counter);
            });
            return;
        }

        // Create IntersectionObserver for counters
        this.observers.counter = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedCounters.has(entry.target)) {
                    this.animatedCounters.add(entry.target);
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px'
        });

        // Observe all counters
        counters.forEach(counter => {
            this.observers.counter.observe(counter);
        });
    }

    /**
     * Parse counter value (supports numbers with suffixes like K, M, %)
     * @param {string} value - The value string to parse
     * @returns {object} Parsed value with number and suffix
     */
    parseCounterValue(value) {
        const match = value.match(/^([\d.]+)(.*)$/);
        if (match) {
            return {
                number: parseFloat(match[1]),
                suffix: match[2] || '',
                hasDecimal: match[1].includes('.')
            };
        }
        return { number: parseFloat(value) || 0, suffix: '', hasDecimal: false };
    }

    /**
     * Animate a counter from 0 to target value
     * @param {HTMLElement} element - The counter element
     */
    animateCounter(element) {
        const targetData = this.parseCounterValue(element.getAttribute('data-count'));
        const target = targetData.number;
        const suffix = targetData.suffix;
        const hasDecimal = targetData.hasDecimal;
        
        if (isNaN(target)) {
            console.warn('[EnterpriseScrollAnimations] Invalid data-count value:', element.getAttribute('data-count'));
            return;
        }

        // Add counting class for visual feedback
        element.classList.add('counting');

        const duration = this.config.counterDuration;
        const startTime = performance.now();
        const startValue = 0;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use easeOutQuart for smooth deceleration
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (target - startValue) * easeProgress;
            
            // Format based on whether original had decimal
            if (hasDecimal) {
                element.textContent = currentValue.toFixed(1) + suffix;
            } else {
                element.textContent = this.formatNumber(Math.floor(currentValue), element) + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                // Ensure final value is exact
                if (hasDecimal) {
                    element.textContent = target.toFixed(1) + suffix;
                } else {
                    element.textContent = this.formatNumber(target, element) + suffix;
                }
                
                // Remove counting class
                element.classList.remove('counting');
                
                // Push analytics event
                this.pushAnalyticsEvent('counter_complete', {
                    element_id: element.id || 'unnamed',
                    final_value: target + suffix
                });
            }
        };

        requestAnimationFrame(updateCounter);
    }

    /**
     * Format number with locale-appropriate separators
     * @param {number} num - The number to format
     * @param {HTMLElement} element - The element (for context)
     * @returns {string} Formatted number string
     */
    formatNumber(num, element) {
        // Check if element has data-no-format attribute
        if (element && element.hasAttribute('data-no-format')) {
            return num.toString();
        }
        
        // Use Arabic locale for RTL pages
        const isRTL = document.documentElement.dir === 'rtl';
        const locale = isRTL ? 'ar-SA' : 'en-US';
        
        try {
            return Math.floor(num).toLocaleString(locale);
        } catch (e) {
            return Math.floor(num).toString();
        }
    }

    /**
     * Push analytics event to dataLayer
     * @param {string} eventName - Name of the event
     * @param {object} data - Event data
     */
    pushAnalyticsEvent(eventName, data) {
        if (typeof window.dataLayer !== 'undefined') {
            window.dataLayer.push({
                event: eventName,
                ...data
            });
        }
    }

    /**
     * Apply fallback for browsers without IntersectionObserver
     */
    applyFallback() {
        // Make all animated elements visible
        document.querySelectorAll(`.${this.config.fadeInClass}`).forEach(el => {
            el.classList.add(this.config.visibleClass);
            el.style.opacity = '1';
            el.style.transform = 'none';
        });

        // Make all stagger containers visible
        document.querySelectorAll(`.${this.config.staggerContainerClass}`).forEach(container => {
            container.classList.add(this.config.visibleClass);
        });

        // Set counter values directly
        document.querySelectorAll('[data-count]').forEach(counter => {
            const targetData = this.parseCounterValue(counter.getAttribute('data-count'));
            if (targetData.hasDecimal) {
                counter.textContent = targetData.number.toFixed(1) + targetData.suffix;
            } else {
                counter.textContent = this.formatNumber(targetData.number, counter) + targetData.suffix;
            }
        });
    }

    /**
     * Apply reduced motion fallback (when preference changes)
     */
    applyReducedMotionFallback() {
        // Immediately show all elements that haven't been animated yet
        document.querySelectorAll(`.${this.config.fadeInClass}:not(.${this.config.visibleClass})`).forEach(el => {
            el.classList.add(this.config.visibleClass);
        });

        document.querySelectorAll(`.${this.config.staggerContainerClass}:not(.${this.config.visibleClass})`).forEach(container => {
            container.classList.add(this.config.visibleClass);
        });
    }

    /**
     * Manually trigger animation for an element
     * @param {HTMLElement} element - Element to animate
     */
    triggerAnimation(element) {
        if (element.classList.contains(this.config.fadeInClass)) {
            element.classList.add(this.config.visibleClass);
        }
        if (element.classList.contains(this.config.staggerContainerClass)) {
            element.classList.add(this.config.visibleClass);
        }
        if (element.hasAttribute('data-count') && !this.animatedCounters.has(element)) {
            this.animatedCounters.add(element);
            this.animateCounter(element);
        }
    }

    /**
     * Refresh observers (useful after dynamic content is added)
     */
    refresh() {
        // Disconnect existing observers
        this.destroy();
        
        // Re-initialize
        this.initFadeInAnimations();
        this.initCounterAnimations();
        this.initStaggerAnimations();
    }

    /**
     * Cleanup observers
     */
    destroy() {
        Object.values(this.observers).forEach(observer => {
            if (observer) {
                observer.disconnect();
            }
        });
        this.observers = {
            fadeIn: null,
            counter: null,
            stagger: null
        };
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnterpriseScrollAnimations };
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.enterpriseScrollAnimations = new EnterpriseScrollAnimations({
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
        counterDuration: 2000,
        staggerDelay: 100,
        animationDuration: 600
    });
    
    window.enterpriseScrollAnimations.init();
});
