/**
 * BrightAI Shared Utilities Module
 * Centralized utility functions used across the application
 * 
 * Version: 1.0.0
 * 
 * This module provides:
 * - DOM helpers (debounce, throttle, escapeHtml)
 * - DataLayer helpers (pushEvent)
 * - Common patterns used across multiple JS files
 */

'use strict';

/**
 * =================================================================================
 * SECTION 1: PERFORMANCE HELPERS
 * =================================================================================
 */

/**
 * Debounce function - delays execution until after wait period of inactivity
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
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
 * Throttle function - limits execution to once per time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
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
 * =================================================================================
 * SECTION 2: DOM HELPERS
 * =================================================================================
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHtml = (text) => {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Check if element is in viewport
 * @param {HTMLElement} element - Element to check
 * @param {number} threshold - Visibility threshold (0-1)
 * @returns {boolean} True if element is visible
 */
const isInViewport = (element, threshold = 0) => {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;

    const vertInView = (rect.top <= windowHeight * (1 - threshold)) && ((rect.top + rect.height) >= windowHeight * threshold);
    const horInView = (rect.left <= windowWidth * (1 - threshold)) && ((rect.left + rect.width) >= windowWidth * threshold);

    return vertInView && horInView;
};

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * =================================================================================
 * SECTION 3: ANALYTICS HELPERS
 * =================================================================================
 */

/**
 * Initialize dataLayer if not present
 */
const initDataLayer = () => {
    window.dataLayer = window.dataLayer || [];
};

/**
 * Push event to dataLayer for GTM
 * @param {string} eventName - Event name
 * @param {Object} eventData - Additional event data
 * @param {boolean} debug - Enable debug logging
 */
const pushDataLayerEvent = (eventName, eventData = {}, debug = false) => {
    initDataLayer();

    const event = {
        event: eventName,
        ...eventData
    };

    window.dataLayer.push(event);

    // Debug logging disabled in production
    // Enable via: pushDataLayerEvent(eventName, eventData, true)
    void debug;
};

/**
 * =================================================================================
 * SECTION 4: STORAGE HELPERS
 * =================================================================================
 */

/**
 * Safe localStorage get with fallback
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Stored value or default
 */
const getFromStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('[BrightAI Utils] localStorage read error:', error);
        return defaultValue;
    }
};

/**
 * Safe localStorage set
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
const setToStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn('[BrightAI Utils] localStorage write error:', error);
        return false;
    }
};

/**
 * =================================================================================
 * SECTION 5: FORMAT HELPERS
 * =================================================================================
 */

/**
 * Format time in Arabic
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string in Arabic
 */
const formatTimeArabic = (seconds) => {
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
};

/**
 * Format date for Arabic locale
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDateArabic = (date) => {
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Format time for Arabic locale
 * @param {Date} date - Date to format
 * @returns {string} Formatted time string
 */
const formatTimeLocale = (date) => {
    return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * =================================================================================
 * SECTION 6: IMAGE HELPERS
 * =================================================================================
 */

/**
 * Default fallback image path (local Gemini logo)
 */
const DEFAULT_FALLBACK_IMAGE = 'Gemini.png';

/**
 * Handle image loading error by replacing with fallback
 * @param {HTMLImageElement} img - Image element that failed to load
 * @param {string} fallbackSrc - Fallback image source (defaults to Gemini.png)
 */
const handleImageError = (img, fallbackSrc = DEFAULT_FALLBACK_IMAGE) => {
    if (!img || img.dataset.fallbackApplied) return;

    // Mark as fallback applied to prevent infinite loops
    img.dataset.fallbackApplied = 'true';

    // Try to determine the correct path based on current page location
    const currentPath = window.location.pathname;
    let adjustedFallback = fallbackSrc;

    // If we're in a subdirectory, adjust the path
    if (currentPath.includes('/blogger/') ||
        currentPath.includes('/Customer/') ||
        currentPath.includes('/Docfile/') ||
        currentPath.includes('/botAI/')) {
        adjustedFallback = '../' + fallbackSrc;
    }

    img.src = adjustedFallback;
    img.alt = img.alt || 'صورة بديلة';

    // Add a subtle visual indicator that this is a fallback
    img.style.opacity = '0.9';
};

/**
 * Initialize image error handlers for all external images on the page
 * @param {string} selector - CSS selector for images to handle (default: all img tags)
 * @param {string} fallbackSrc - Fallback image source
 */
const initImageErrorHandlers = (selector = 'img', fallbackSrc = DEFAULT_FALLBACK_IMAGE) => {
    const images = document.querySelectorAll(selector);

    images.forEach(img => {
        // Skip if already has onerror or is a local image
        if (img.onerror || img.dataset.errorHandled) return;

        // Check if it's an external image
        const src = img.src || img.getAttribute('src') || '';
        const isExternal = src.startsWith('http://') || src.startsWith('https://');

        if (isExternal) {
            img.dataset.errorHandled = 'true';
            img.onerror = function () {
                handleImageError(this, fallbackSrc);
            };

            // If image already failed (complete but naturalWidth is 0)
            if (img.complete && img.naturalWidth === 0) {
                handleImageError(img, fallbackSrc);
            }
        }
    });
};

/**
 * Create an image element with built-in error handling
 * @param {string} src - Image source URL
 * @param {string} alt - Alt text
 * @param {Object} options - Additional options (fallbackSrc, className, width, height)
 * @returns {HTMLImageElement} Image element with error handling
 */
const createImageWithFallback = (src, alt, options = {}) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = alt;

    if (options.className) img.className = options.className;
    if (options.width) img.width = options.width;
    if (options.height) img.height = options.height;
    if (options.loading) img.loading = options.loading;

    const fallbackSrc = options.fallbackSrc || DEFAULT_FALLBACK_IMAGE;
    img.onerror = function () {
        handleImageError(this, fallbackSrc);
    };

    return img;
};

/**
 * =================================================================================
 * SECTION 7: VALIDATION HELPERS
 * =================================================================================
 */

/**
 * Validate Saudi phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid Saudi phone number
 */
const isValidSaudiPhone = (phone) => {
    return /^(05\d{8}|5\d{8}|\+9665\d{8}|009665\d{8})$/.test(phone);
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * =================================================================================
 * EXPORTS
 * =================================================================================
 */

// Create global BrightAIUtils namespace
window.BrightAIUtils = {
    // Performance
    debounce,
    throttle,

    // DOM
    escapeHtml,
    isInViewport,
    generateId,

    // Analytics
    initDataLayer,
    pushDataLayerEvent,

    // Storage
    getFromStorage,
    setToStorage,

    // Format
    formatTimeArabic,
    formatDateArabic,
    formatTimeLocale,

    // Image Helpers
    handleImageError,
    initImageErrorHandlers,
    createImageWithFallback,
    DEFAULT_FALLBACK_IMAGE,

    // Validation
    isValidSaudiPhone,
    isValidEmail
};

// Also export individual functions for direct import
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debounce,
        throttle,
        escapeHtml,
        isInViewport,
        generateId,
        initDataLayer,
        pushDataLayerEvent,
        getFromStorage,
        setToStorage,
        formatTimeArabic,
        formatDateArabic,
        formatTimeLocale,
        handleImageError,
        initImageErrorHandlers,
        createImageWithFallback,
        DEFAULT_FALLBACK_IMAGE,
        isValidSaudiPhone,
        isValidEmail
    };
}

// BrightAI Utils module loaded - see js/core/ for modular utilities
