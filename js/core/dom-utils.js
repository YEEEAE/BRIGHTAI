/**
 * BrightAI DOM Utilities Module
 * ========================================
 * Centralized DOM manipulation and helper functions
 * 
 * @version 1.0.0
 * @description Unified utilities for DOM operations
 */

'use strict';

/**
 * DOM Helper Functions
 * Provides common DOM operations used across the application
 */
const DOMUtils = (() => {
    /**
     * Select single element
     * @param {string} selector - CSS selector
     * @param {Element} context - Parent context
     * @returns {Element|null}
     */
    const $ = (selector, context = document) => context.querySelector(selector);

    /**
     * Select multiple elements
     * @param {string} selector - CSS selector
     * @param {Element} context - Parent context
     * @returns {NodeList}
     */
    const $$ = (selector, context = document) => context.querySelectorAll(selector);

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    const escapeHtml = (text) => {
        if (typeof text !== 'string') return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    /**
     * Scroll element to bottom
     * @param {Element} element - Element to scroll
     * @param {boolean} smooth - Use smooth scrolling
     */
    const scrollToBottom = (element, smooth = true) => {
        if (!element) return;

        if (smooth) {
            requestAnimationFrame(() => {
                element.scrollTo({
                    top: element.scrollHeight,
                    behavior: 'smooth'
                });
            });
        } else {
            element.scrollTop = element.scrollHeight;
        }
    };

    /**
     * Check if element is in viewport
     * @param {Element} element - Element to check
     * @param {number} threshold - Visibility threshold (0-1)
     * @returns {boolean}
     */
    const isInViewport = (element, threshold = 0) => {
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;

        const vertInView = (rect.top <= windowHeight * (1 - threshold)) &&
            ((rect.top + rect.height) >= windowHeight * threshold);
        const horInView = (rect.left <= windowWidth * (1 - threshold)) &&
            ((rect.left + rect.width) >= windowWidth * threshold);

        return vertInView && horInView;
    };

    /**
     * Generate unique ID
     * @param {string} prefix - Optional prefix
     * @returns {string}
     */
    const generateId = (prefix = 'id') => {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    };

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    const debounce = (func, wait) => {
        let timeoutId;
        return function (...args) {
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), wait);
        };
    };

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in ms
     * @returns {Function}
     */
    const throttle = (func, limit) => {
        let inThrottle = false;
        return function (...args) {
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    /**
     * Add event listener with auto-cleanup option
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} - Cleanup function
     */
    const on = (element, event, handler, options = {}) => {
        if (!element) return () => { };
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    };

    /**
     * Wait for DOM ready
     * @param {Function} callback - Callback function
     */
    const ready = (callback) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    };

    /**
     * Create element with attributes
     * @param {string} tag - Tag name
     * @param {Object} attrs - Attributes
     * @param {string|Element} content - Inner content
     * @returns {Element}
     */
    const createElement = (tag, attrs = {}, content = '') => {
        const el = document.createElement(tag);

        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                el.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    el.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                el.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                el.setAttribute(key, value);
            }
        });

        if (typeof content === 'string') {
            el.innerHTML = content;
        } else if (content instanceof Element) {
            el.appendChild(content);
        }

        return el;
    };

    /**
     * Add/remove class with animation support
     * @param {Element} element - Target element
     * @param {string} className - Class name
     * @param {boolean} add - Add or remove
     * @returns {Promise<void>}
     */
    const toggleClassAnimated = (element, className, add) => {
        return new Promise((resolve) => {
            if (!element) {
                resolve();
                return;
            }

            const handleTransitionEnd = (e) => {
                if (e.target === element) {
                    element.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            };

            element.addEventListener('transitionend', handleTransitionEnd);
            element.classList.toggle(className, add);

            // Fallback timeout
            setTimeout(() => {
                element.removeEventListener('transitionend', handleTransitionEnd);
                resolve();
            }, 500);
        });
    };

    /**
     * Setup glass card mouse effect
     * @param {string} selector - Card selector
     */
    const initGlassCardEffect = (selector = '.glass-card, .service-card, .feature-card, .stat-card, .card') => {
        const cards = document.querySelectorAll(selector);

        cards.forEach(card => {
            // Skip if already initialized
            if (card.dataset.glassInitialized) return;
            card.dataset.glassInitialized = 'true';

            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    };

    // Public API
    return {
        $,
        $$,
        escapeHtml,
        scrollToBottom,
        isInViewport,
        generateId,
        debounce,
        throttle,
        on,
        ready,
        createElement,
        toggleClassAnimated,
        initGlassCardEffect
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DOMUtils };
}

// Global export
window.DOMUtils = DOMUtils;

// Also add to BrightAIUtils for backward compatibility
if (typeof window.BrightAIUtils === 'undefined') {
    window.BrightAIUtils = {};
}

Object.assign(window.BrightAIUtils, DOMUtils);
