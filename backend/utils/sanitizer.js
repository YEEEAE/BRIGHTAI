/**
 * Input Sanitization Utilities
 * Provides functions to sanitize user input and filter AI responses
 * Requirements: 23.6, 23.7
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHTML(text) {
  if (typeof text !== 'string') {
    return '';
  }
  
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Sanitize user input to prevent injection attacks
 * - Escapes HTML special characters
 * - Removes null bytes
 * - Trims whitespace
 * - Removes control characters except newlines and tabs
 * 
 * @param {string} input - User input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') {
    return '';
  }
  
  let sanitized = input;
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newline (\n), carriage return (\r), and tab (\t)
  // Control characters are in range \x00-\x1F and \x7F
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Escape HTML special characters
  sanitized = escapeHTML(sanitized);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Filter AI response to prevent executable code in DOM
 * - Removes script tags and their content
 * - Removes event handler attributes (onclick, onerror, etc.)
 * - Removes javascript: protocol URLs
 * - Removes data: protocol URLs (can contain base64 encoded scripts)
 * - Removes iframe tags
 * - Removes object and embed tags
 * 
 * @param {string} response - AI response to filter
 * @returns {string} - Filtered response
 */
function filterAIResponse(response) {
  if (typeof response !== 'string') {
    return '';
  }
  
  let filtered = response;
  
  // Remove script tags and their content (case-insensitive)
  filtered = filtered.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove iframe tags
  filtered = filtered.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object tags
  filtered = filtered.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  
  // Remove embed tags
  filtered = filtered.replace(/<embed\b[^>]*>/gi, '');
  
  // Remove event handler attributes (onclick, onerror, onload, etc.)
  filtered = filtered.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  filtered = filtered.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: protocol
  filtered = filtered.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can contain base64 encoded scripts)
  filtered = filtered.replace(/data:text\/html[^"'\s]*/gi, '');
  filtered = filtered.replace(/data:application\/[^"'\s]*/gi, '');
  
  // Remove vbscript: protocol
  filtered = filtered.replace(/vbscript:/gi, '');
  
  return filtered;
}

/**
 * Validate that input doesn't contain dangerous patterns
 * Returns true if input is safe, false if dangerous patterns detected
 * 
 * @param {string} input - Input to validate
 * @returns {boolean} - True if safe, false if dangerous
 */
function validateInputSafety(input) {
  if (typeof input !== 'string') {
    return false;
  }
  
  // Patterns that indicate potential attacks
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,  // Event handlers
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\s*\(/i,
    /expression\s*\(/i,  // CSS expression
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(input));
}

module.exports = {
  escapeHTML,
  sanitizeUserInput,
  filterAIResponse,
  validateInputSafety
};
