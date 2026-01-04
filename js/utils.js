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
    return function(...args) {
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
    return function(...args) {
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
    
    if (debug) {
        console.log('[BrightAI Utils] DataLayer event pushed:', event);
    }
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
 * SECTION 6: VALIDATION HELPERS
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
        isValidSaudiPhone,
        isValidEmail
    };
}

console.log('[BrightAI Utils] Utilities module loaded');
