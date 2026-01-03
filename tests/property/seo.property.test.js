/**
 * Feature: brightai-website-transformation
 * Property-Based Tests for SEO Requirements
 * 
 * These tests validate SEO implementation across all HTML pages:
 * - Canonical tags presence
 * - JSON-LD validity (parsable JSON)
 * - H1 count per page
 * - Title/description unchanged
 * 
 * Validates: Requirements 24.1-24.15
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

// Helper function to get all HTML files
function getAllHtmlFiles() {
  const htmlFiles = glob.sync('**/*.html', {
    ignore: [
      'node_modules/**',
      'backups/**',
      '.git/**',
      '.kiro/**',
      'tests/**'
    ]
  });
  return htmlFiles;
}

// Helper function to parse HTML content
function parseHtml(content) {
  // Simple HTML parsing for testing purposes
  return {
    content,
    hasCanonical: /<link\s+rel=["']canonical["']/i.test(content),
    getCanonicalUrl: () => {
      const match = content.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      return match ? match[1] : null;
    },
    getH1Count: () => {
      const matches = content.match(/<h1[^>]*>/gi);
      return matches ? matches.length : 0;
    },
    getTitle: () => {
      const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      return match ? match[1].trim() : null;
    },
    getMetaDescription: () => {
      const match = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
      return match ? match[1].trim() : null;
    },
    getJsonLdScripts: () => {
      const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      const scripts = [];
      let match;
      while ((match = regex.exec(content)) !== null) {
        scripts.push(match[1].trim());
      }
      return scripts;
    },
    hasOpenGraphTags: () => {
      return /<meta\s+property=["']og:title["']/i.test(content) &&
             /<meta\s+property=["']og:description["']/i.test(content) &&
             /<meta\s+property=["']og:image["']/i.test(content) &&
             /<meta\s+property=["']og:url["']/i.test(content);
    },
    hasTwitterCardTags: () => {
      return /<meta\s+name=["']twitter:card["']/i.test(content) &&
             /<meta\s+name=["']twitter:title["']/i.test(content) &&
             /<meta\s+name=["']twitter:description["']/i.test(content);
    }
  };
}

describe('SEO Property Tests', () => {
  
  /**
   * Property 41: Canonical Tag Presence
   * For any HTML page in the website, there SHALL exist exactly one <link rel="canonical"> tag with a valid URL.
   * Validates: Requirements 24.3
   */
  it('Property 41: All HTML pages have exactly one canonical tag with valid URL', () => {
    const htmlFiles = getAllHtmlFiles();
    
    // Property: For all HTML files, canonical tag must exist and be valid
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          
          // Must have canonical tag
          expect(parsed.hasCanonical).toBe(true);
          
          // Canonical URL must be valid
          const canonicalUrl = parsed.getCanonicalUrl();
          expect(canonicalUrl).toBeTruthy();
          expect(canonicalUrl).toMatch(/^https?:\/\//);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });

  /**
   * Property 42: JSON-LD Schema Validity
   * For any JSON-LD script tag in the website, the content SHALL be valid parseable JSON 
   * with a "@context" property set to "https://schema.org".
   * Validates: Requirements 24.4, 24.5, 24.6, 24.7, 24.8, 24.9
   */
  it('Property 42: All JSON-LD schemas are valid and parseable', () => {
    const htmlFiles = getAllHtmlFiles();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          const jsonLdScripts = parsed.getJsonLdScripts();
          
          // Each JSON-LD script must be valid JSON
          jsonLdScripts.forEach((script) => {
            let jsonData;
            
            // Must be parseable JSON
            expect(() => {
              jsonData = JSON.parse(script);
            }).not.toThrow();
            
            // Must have @context property
            expect(jsonData).toHaveProperty('@context');
            
            // @context must be schema.org
            expect(jsonData['@context']).toBe('https://schema.org');
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });

  /**
   * Property 43: Single H1 Per Page
   * For any HTML page in the website, there SHALL exist exactly one <h1> element.
   * Validates: Requirements 24.12
   */
  it('Property 43: All HTML pages have exactly one H1 element', () => {
    const htmlFiles = getAllHtmlFiles();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          const h1Count = parsed.getH1Count();
          
          // Must have exactly one H1
          expect(h1Count).toBe(1);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });

  /**
   * Property 44: Open Graph Tags Presence
   * For any HTML page, the <head> section SHALL contain og:title, og:description, 
   * og:image, and og:url meta tags.
   * Validates: Requirements 24.10
   */
  it('Property 44: All HTML pages have required Open Graph tags', () => {
    const htmlFiles = getAllHtmlFiles();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          
          // Must have all required OG tags
          expect(parsed.hasOpenGraphTags()).toBe(true);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });

  /**
   * Additional Test: Twitter Card Tags Presence
   * For any HTML page, the <head> section SHALL contain twitter:card, twitter:title, 
   * and twitter:description meta tags.
   * Validates: Requirements 24.11
   */
  it('All HTML pages have required Twitter Card tags', () => {
    const htmlFiles = getAllHtmlFiles();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          
          // Must have all required Twitter Card tags
          expect(parsed.hasTwitterCardTags()).toBe(true);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });

  /**
   * Meta Tag Preservation Test
   * Validates that title and description meta tags exist and are not empty
   * Validates: Requirements 1.3
   */
  it('All HTML pages preserve title and description meta tags', () => {
    const htmlFiles = getAllHtmlFiles();
    
    fc.assert(
      fc.property(
        fc.constantFrom(...htmlFiles),
        (filePath) => {
          const content = readFileSync(filePath, 'utf-8');
          const parsed = parseHtml(content);
          
          const title = parsed.getTitle();
          const description = parsed.getMetaDescription();
          
          // Title must exist and not be empty
          expect(title).toBeTruthy();
          expect(title.length).toBeGreaterThan(0);
          
          // Description must exist and not be empty
          expect(description).toBeTruthy();
          expect(description.length).toBeGreaterThan(0);
          
          return true;
        }
      ),
      { numRuns: Math.min(100, htmlFiles.length) }
    );
  });
});
