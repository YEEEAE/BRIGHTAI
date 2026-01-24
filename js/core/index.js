/**
 * BrightAI Core Modules Index
 * ========================================
 * Central export point for all core utilities
 * 
 * @version 1.0.0
 * 
 * Usage:
 * Include this file AFTER including the individual modules,
 * or use ES6 imports in a module environment.
 */

'use strict';

/**
 * Lazy load core modules on demand
 */
const BrightCore = (() => {
    const modules = {
        api: null,
        dom: null,
        format: null
    };

    /**
     * Get or load API Client
     * @returns {Object} BrightAPIClient
     */
    const getAPI = () => {
        if (!modules.api && typeof BrightAPIClient !== 'undefined') {
            modules.api = BrightAPIClient;
        }
        return modules.api;
    };

    /**
     * Get or load DOM Utils
     * @returns {Object} DOMUtils
     */
    const getDOM = () => {
        if (!modules.dom && typeof DOMUtils !== 'undefined') {
            modules.dom = DOMUtils;
        }
        return modules.dom;
    };

    /**
     * Get or load Format Utils
     * @returns {Object} FormatUtils
     */
    const getFormat = () => {
        if (!modules.format && typeof FormatUtils !== 'undefined') {
            modules.format = FormatUtils;
        }
        return modules.format;
    };

    /**
     * Initialize all modules
     */
    const init = () => {
        getAPI();
        getDOM();
        getFormat();
    };

    return {
        get api() { return getAPI(); },
        get dom() { return getDOM(); },
        get format() { return getFormat(); },
        init
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrightCore };
}

// Global export
window.BrightCore = BrightCore;

/**
 * Auto-initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => BrightCore.init());
} else {
    BrightCore.init();
}
