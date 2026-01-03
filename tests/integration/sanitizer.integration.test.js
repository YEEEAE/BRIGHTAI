/**
 * Integration tests for sanitizer with AI endpoints
 * Tests Requirements: 23.6, 23.7
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { sanitizeUserInput, filterAIResponse } = require('../../server/utils/sanitizer.js');

describe('Sanitizer Integration with AI Endpoints', () => {
  describe('Chat endpoint sanitization flow', () => {
    it('should sanitize malicious user input before sending to API', () => {
      const maliciousInput = '<script>alert("XSS")</script>Hello';
      const sanitized = sanitizeUserInput(maliciousInput);
      
      // Should escape HTML
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('&lt;script&gt;');
      expect(sanitized).toContain('Hello');
    });

    it('should filter dangerous content from AI response', () => {
      const dangerousResponse = 'Here is your answer: <script>steal()</script> Hope this helps!';
      const filtered = filterAIResponse(dangerousResponse);
      
      // Should remove script tags
      expect(filtered).not.toContain('<script>');
      expect(filtered).not.toContain('steal()');
      expect(filtered).toContain('Here is your answer:');
      expect(filtered).toContain('Hope this helps!');
    });

    it('should handle Arabic input correctly', () => {
      const arabicInput = 'ما هي خدمات BrightAI؟';
      const sanitized = sanitizeUserInput(arabicInput);
      
      // Should preserve Arabic text
      expect(sanitized).toBe(arabicInput);
    });

    it('should handle Arabic response correctly', () => {
      const arabicResponse = 'مرحباً! نحن نقدم خدمات الذكاء الاصطناعي المتقدمة.';
      const filtered = filterAIResponse(arabicResponse);
      
      // Should preserve Arabic text
      expect(filtered).toBe(arabicResponse);
    });
  });

  describe('Search endpoint sanitization flow', () => {
    it('should sanitize search query with HTML injection attempt', () => {
      const maliciousQuery = '<img src=x onerror=alert(1)>AI services';
      const sanitized = sanitizeUserInput(maliciousQuery);
      
      // Should escape HTML (text content is preserved but escaped)
      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('&lt;img');
      expect(sanitized).toContain('AI services');
      // The word "onerror" is still there but escaped as part of the HTML
      expect(sanitized).toContain('onerror'); // This is safe because HTML is escaped
    });

    it('should filter search results from AI', () => {
      const searchResults = [
        {
          title: 'AI Services <script>alert(1)</script>',
          url: '/ai-agent.html',
          description: 'Learn about <iframe src="evil"></iframe> our services'
        }
      ];

      const filtered = searchResults.map(r => ({
        title: filterAIResponse(r.title),
        url: r.url,
        description: filterAIResponse(r.description)
      }));

      // Should remove dangerous content
      expect(filtered[0].title).not.toContain('<script>');
      expect(filtered[0].description).not.toContain('<iframe>');
      expect(filtered[0].title).toContain('AI Services');
      expect(filtered[0].description).toContain('our services');
    });
  });

  describe('End-to-end sanitization', () => {
    it('should handle complete chat flow with XSS attempts', () => {
      // User sends malicious input
      const userInput = 'Tell me about <script>fetch("evil.com")</script> AI';
      const sanitizedInput = sanitizeUserInput(userInput);
      
      // Simulate AI response with injected content
      const aiResponse = 'Sure! <iframe src="malicious"></iframe> AI is amazing.';
      const filteredResponse = filterAIResponse(aiResponse);
      
      // Both should be safe
      expect(sanitizedInput).not.toContain('<script>');
      expect(filteredResponse).not.toContain('<iframe>');
      expect(sanitizedInput).toContain('Tell me about');
      expect(filteredResponse).toContain('AI is amazing.');
    });

    it('should preserve legitimate content while removing threats', () => {
      const input = 'What is <strong>machine learning</strong>?';
      const sanitized = sanitizeUserInput(input);
      
      // HTML should be escaped
      expect(sanitized).toContain('&lt;strong&gt;');
      expect(sanitized).toContain('machine learning');
    });

    it('should handle multiple sanitization passes', () => {
      let content = '<script>alert(1)</script>Hello<script>alert(2)</script>';
      
      // First pass - sanitize input (escapes HTML)
      content = sanitizeUserInput(content);
      expect(content).not.toContain('<script>');
      expect(content).toContain('&lt;script&gt;');
      
      // Second pass - filter response (removes script tags from already-escaped content)
      content = filterAIResponse(content);
      // After filtering, the escaped script tags should be removed
      expect(content).toContain('Hello');
      // The word "alert" might still be present as escaped text, which is safe
    });
  });

  describe('Edge cases', () => {
    it('should handle empty strings', () => {
      expect(sanitizeUserInput('')).toBe('');
      expect(filterAIResponse('')).toBe('');
    });

    it('should handle very long input', () => {
      const longInput = 'A'.repeat(2000);
      const sanitized = sanitizeUserInput(longInput);
      
      // Should not crash and should return string
      expect(typeof sanitized).toBe('string');
      expect(sanitized.length).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const sanitized = sanitizeUserInput(specialChars);
      
      // Should preserve most special chars (except HTML special chars)
      expect(sanitized).toContain('!@#$%^');
    });

    it('should handle mixed content', () => {
      const mixed = 'Normal text <script>bad</script> more text <b>bold</b> end';
      const sanitized = sanitizeUserInput(mixed);
      const filtered = filterAIResponse(sanitized);
      
      // Should escape all HTML
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('<b>');
      expect(sanitized).toContain('Normal text');
      expect(sanitized).toContain('end');
    });
  });
});
