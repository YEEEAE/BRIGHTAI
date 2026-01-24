/**
 * BrightAI Format Utilities Module
 * ========================================
 * Centralized formatting and validation functions
 * 
 * @version 1.0.0
 * @description Unified utilities for data formatting and validation
 */

'use strict';

/**
 * Format Utilities
 * Provides common formatting operations
 */
const FormatUtils = (() => {
    /**
     * Format time for Arabic locale
     * @param {Date} date - Date object
     * @returns {string} - Formatted time string
     */
    const formatTime = (date) => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return date.toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Format date for Arabic locale
     * @param {Date} date - Date object
     * @returns {string} - Formatted date string
     */
    const formatDate = (date) => {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        return date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    /**
     * Format duration in Arabic
     * @param {number} seconds - Duration in seconds
     * @returns {string} - Formatted duration string
     */
    const formatDuration = (seconds) => {
        if (typeof seconds !== 'number' || seconds < 0) return '';

        if (seconds < 60) {
            return `${seconds} ثانية`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes} دقيقة ${remainingSeconds} ثانية`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours} ساعة ${minutes} دقيقة`;
        }
    };

    /**
     * Format number with locale separators
     * @param {number} num - Number to format
     * @param {string} locale - Locale (default: auto-detect)
     * @returns {string} - Formatted number
     */
    const formatNumber = (num, locale = null) => {
        if (typeof num !== 'number') {
            num = parseFloat(num);
        }

        if (isNaN(num)) return '0';

        const detectedLocale = locale ||
            (document.documentElement.dir === 'rtl' ? 'ar-SA' : 'en-US');

        try {
            return Math.floor(num).toLocaleString(detectedLocale);
        } catch {
            return Math.floor(num).toString();
        }
    };

    /**
     * Format currency
     * @param {number} amount - Amount
     * @param {string} currency - Currency code (default: SAR)
     * @returns {string} - Formatted currency
     */
    const formatCurrency = (amount, currency = 'SAR') => {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount);
        }

        if (isNaN(amount)) return '0 ر.س';

        const currencyNames = {
            SAR: 'ر.س',
            USD: '$',
            EUR: '€'
        };

        const symbol = currencyNames[currency] || currency;
        return `${formatNumber(amount)} ${symbol}`;
    };

    /**
     * Validate Saudi phone number
     * @param {string} phone - Phone number
     * @returns {boolean}
     */
    const isValidSaudiPhone = (phone) => {
        if (typeof phone !== 'string') return false;
        return /^(05\d{8}|5\d{8}|\+9665\d{8}|009665\d{8})$/.test(phone.trim());
    };

    /**
     * Validate email address
     * @param {string} email - Email address
     * @returns {boolean}
     */
    const isValidEmail = (email) => {
        if (typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    /**
     * Validate Saudi national ID
     * @param {string} id - National ID
     * @returns {boolean}
     */
    const isValidSaudiNationalId = (id) => {
        if (typeof id !== 'string') return false;
        return /^[12]\d{9}$/.test(id.trim());
    };

    /**
     * Truncate text with ellipsis
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string}
     */
    const truncate = (text, maxLength = 100) => {
        if (typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength - 3)}...`;
    };

    /**
     * Sanitize HTML input (basic)
     * @param {string} html - HTML string
     * @returns {string} - Sanitized string
     */
    const sanitizeInput = (html) => {
        if (typeof html !== 'string') return '';
        return html
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };

    /**
     * Parse counter value (supports K, M, % suffixes)
     * @param {string} value - Value string
     * @returns {{number: number, suffix: string, hasDecimal: boolean}}
     */
    const parseCounterValue = (value) => {
        if (typeof value !== 'string') {
            return { number: parseFloat(value) || 0, suffix: '', hasDecimal: false };
        }

        const match = value.match(/^([\d.]+)(.*)$/);
        if (match) {
            return {
                number: parseFloat(match[1]),
                suffix: match[2] || '',
                hasDecimal: match[1].includes('.')
            };
        }

        return { number: parseFloat(value) || 0, suffix: '', hasDecimal: false };
    };

    // Public API
    return {
        formatTime,
        formatDate,
        formatDuration,
        formatNumber,
        formatCurrency,
        isValidSaudiPhone,
        isValidEmail,
        isValidSaudiNationalId,
        truncate,
        sanitizeInput,
        parseCounterValue
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormatUtils };
}

// Global export
window.FormatUtils = FormatUtils;

// Add to BrightAIUtils for backward compatibility
if (typeof window.BrightAIUtils === 'undefined') {
    window.BrightAIUtils = {};
}

Object.assign(window.BrightAIUtils, {
    formatTimeArabic: FormatUtils.formatDuration,
    formatDateArabic: FormatUtils.formatDate,
    formatTimeLocale: FormatUtils.formatTime,
    isValidSaudiPhone: FormatUtils.isValidSaudiPhone,
    isValidEmail: FormatUtils.isValidEmail
});
