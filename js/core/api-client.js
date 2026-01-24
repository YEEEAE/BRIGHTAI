/**
 * BrightAI API Client Module
 * ========================================
 * Centralized API communication layer
 * 
 * @version 1.0.0
 * @description Unified fetch wrapper for all backend communication
 * 
 * Features:
 * - Centralized error handling
 * - Request/Response interceptors
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - Session management support
 */

'use strict';

/**
 * API Client Configuration
 * @type {Object}
 */
const API_CONFIG = Object.freeze({
    BASE_URL: '/api',
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * Custom API Error class
 */
class APIError extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {Object} data - Response data
     */
    constructor(message, status = 0, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
        this.isNetworkError = status === 0;
        this.isClientError = status >= 400 && status < 500;
        this.isServerError = status >= 500;
    }
}

/**
 * BrightAI API Client
 * Singleton instance for all API communications
 */
const BrightAPIClient = (() => {
    let sessionId = null;

    /**
     * Sleep utility for retry delays
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    /**
     * Create AbortController with timeout
     * @param {number} timeoutMs - Timeout in milliseconds
     * @returns {{controller: AbortController, timeoutId: number}}
     */
    const createTimeoutController = (timeoutMs = API_CONFIG.TIMEOUT_MS) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        return { controller, timeoutId };
    };

    /**
     * Parse API response
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>}
     */
    const parseResponse = async (response) => {
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            return response.json();
        }

        return { text: await response.text() };
    };

    /**
     * Handle API errors uniformly
     * @param {Response} response - Fetch response
     * @returns {Promise<never>}
     */
    const handleErrorResponse = async (response) => {
        let errorData = null;

        try {
            errorData = await parseResponse(response);
        } catch {
            // Ignore parse errors
        }

        const errorMessage = errorData?.error ||
            errorData?.message ||
            `حدث خطأ: ${response.status}`;

        throw new APIError(errorMessage, response.status, errorData);
    };

    /**
     * Execute fetch with retry logic
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>}
     */
    const fetchWithRetry = async (url, options, retryCount = 0) => {
        const { controller, timeoutId } = createTimeoutController(options.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                await handleErrorResponse(response);
            }

            return parseResponse(response);

        } catch (error) {
            clearTimeout(timeoutId);

            // Handle abort/timeout
            if (error.name === 'AbortError') {
                throw new APIError('انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.', 0);
            }

            // Handle network errors with retry
            if (error instanceof TypeError && retryCount < API_CONFIG.MAX_RETRIES) {
                const delayMs = API_CONFIG.RETRY_DELAY_MS * Math.pow(2, retryCount);
                await sleep(delayMs);
                return fetchWithRetry(url, options, retryCount + 1);
            }

            // Re-throw API errors
            if (error instanceof APIError) {
                throw error;
            }

            // Wrap other errors
            throw new APIError(
                error.message || 'حدث خطأ غير متوقع في الاتصال',
                0
            );
        }
    };

    /**
     * Build full URL from endpoint
     * @param {string} endpoint - API endpoint
     * @returns {string}
     */
    const buildUrl = (endpoint) => {
        const base = API_CONFIG.BASE_URL.endsWith('/')
            ? API_CONFIG.BASE_URL.slice(0, -1)
            : API_CONFIG.BASE_URL;
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `${base}${path}`;
    };

    /**
     * Make API request
     * @param {string} method - HTTP method
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} customHeaders - Additional headers
     * @returns {Promise<Object>}
     */
    const request = async (method, endpoint, data = null, customHeaders = {}) => {
        const url = buildUrl(endpoint);

        const options = {
            method: method.toUpperCase(),
            headers: {
                ...API_CONFIG.HEADERS,
                ...customHeaders
            },
            timeout: API_CONFIG.TIMEOUT_MS
        };

        // Add session ID if available
        if (sessionId) {
            options.headers['X-Session-ID'] = sessionId;
        }

        // Add body for non-GET requests
        if (data && method.toUpperCase() !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetchWithRetry(url, options);

        // Capture session ID from response
        if (response.sessionId) {
            sessionId = response.sessionId;
        }

        return response;
    };

    // Public API
    return {
        /**
         * GET request
         * @param {string} endpoint - API endpoint
         * @param {Object} headers - Custom headers
         * @returns {Promise<Object>}
         */
        get: (endpoint, headers = {}) => request('GET', endpoint, null, headers),

        /**
         * POST request
         * @param {string} endpoint - API endpoint
         * @param {Object} data - Request body
         * @param {Object} headers - Custom headers
         * @returns {Promise<Object>}
         */
        post: (endpoint, data, headers = {}) => request('POST', endpoint, data, headers),

        /**
         * PUT request
         * @param {string} endpoint - API endpoint
         * @param {Object} data - Request body
         * @param {Object} headers - Custom headers
         * @returns {Promise<Object>}
         */
        put: (endpoint, data, headers = {}) => request('PUT', endpoint, data, headers),

        /**
         * DELETE request
         * @param {string} endpoint - API endpoint
         * @param {Object} headers - Custom headers
         * @returns {Promise<Object>}
         */
        delete: (endpoint, headers = {}) => request('DELETE', endpoint, null, headers),

        /**
         * Chat API - Send message to AI
         * @param {string} message - User message
         * @param {Array} history - Conversation history
         * @returns {Promise<Object>}
         */
        async chat(message, history = []) {
            return this.post('/ai/chat', {
                message,
                history,
                sessionId
            });
        },

        /**
         * Search API
         * @param {string} query - Search query
         * @param {Object} options - Search options
         * @returns {Promise<Object>}
         */
        async search(query, options = {}) {
            return this.post('/search', {
                query,
                ...options
            });
        },

        /**
         * Summary API - Generate text summary
         * @param {string} text - Text to summarize
         * @param {Object} options - Summary options
         * @returns {Promise<Object>}
         */
        async summarize(text, options = {}) {
            return this.post('/summary', {
                text,
                ...options
            });
        },

        /**
         * Medical API - Medical data analysis
         * @param {Object} data - Medical data
         * @returns {Promise<Object>}
         */
        async analyzeMedical(data) {
            return this.post('/medical', data);
        },

        /**
         * Get current session ID
         * @returns {string|null}
         */
        getSessionId: () => sessionId,

        /**
         * Set session ID manually
         * @param {string} id - Session ID
         */
        setSessionId: (id) => { sessionId = id; },

        /**
         * Clear session
         */
        clearSession: () => { sessionId = null; },

        /**
         * API Error class for external use
         */
        APIError
    };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrightAPIClient, APIError };
}

// Global export
window.BrightAPIClient = BrightAPIClient;
