/**
 * Accessibility Validation Tests for Buttons & Navigation
 * Feature: buttons-navigation-optimization
 * 
 * This test suite validates that all buttons and navigation elements
 * meet WCAG 2.1 AA accessibility standards.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Button Accessibility Validation - our-products.html', () => {
    let dom;
    let document;

    beforeAll(() => {
        const html = fs.readFileSync(
            path.resolve(__dirname, '../../our-products.html'),
            'utf-8'
        );
        dom = new JSDOM(html);
        document = dom.window.document;
    });

    describe('Navigation Buttons Semantic HTML', () => {
        it('should use <a> elements for navigation links', () => {
            const navLinks = document.querySelectorAll('nav a[href]');
            expect(navLinks.length).toBeGreaterThan(0);
            
            navLinks.forEach(link => {
                expect(link.tagName).toBe('A');
                expect(link.hasAttribute('href')).toBe(true);
            });
        });

        it('should not use <button> elements for page navigation', () => {
            const buttons = document.querySelectorAll('button');
            buttons.forEach(button => {
                const hasHref = button.hasAttribute('href');
                const hasDataHref = button.hasAttribute('data-href');
                const hasOnclickNavigation = button.hasAttribute('onclick') && 
                    button.getAttribute('onclick').includes('location');
                
                // Buttons should not navigate (except dropdown toggles)
                if (!button.classList.contains('dropdown-toggle') && 
                    !button.classList.contains('hamburger-btn')) {
                    expect(hasHref || hasDataHref || hasOnclickNavigation).toBe(false);
                }
            });
        });
    });

    describe('Action Buttons Semantic HTML', () => {
        it('should use <button> elements for actions', () => {
            const actionButtons = document.querySelectorAll('.buy-button, .details-button');
            expect(actionButtons.length).toBeGreaterThan(0);
            
            actionButtons.forEach(button => {
                expect(button.tagName).toBe('BUTTON');
            });
        });

        it('should have type="button" on action buttons', () => {
            const actionButtons = document.querySelectorAll('.buy-button, .details-button');
            
            actionButtons.forEach(button => {
                expect(button.getAttribute('type')).toBe('button');
            });
        });
    });

    describe('Accessible Button Text', () => {
        it('should have accessible names (text or aria-label)', () => {
            const allButtons = document.querySelectorAll('button');
            
            allButtons.forEach(button => {
                const hasText = button.textContent.trim().length > 0;
                const hasAriaLabel = button.hasAttribute('aria-label');
                const hasAriaLabelledBy = button.hasAttribute('aria-labelledby');
                
                expect(hasText || hasAriaLabel || hasAriaLabelledBy).toBe(true);
            });
        });

        it('should have aria-hidden="true" on icons inside buttons', () => {
            const iconsInButtons = document.querySelectorAll('button i, button svg');
            
            iconsInButtons.forEach(icon => {
                expect(icon.getAttribute('aria-hidden')).toBe('true');
            });
        });
    });

    describe('Modal Button ARIA Attributes', () => {
        it('should have aria-haspopup="dialog" on modal trigger buttons', () => {
            const modalButtons = document.querySelectorAll('.details-button[data-target]');
            
            modalButtons.forEach(button => {
                expect(button.getAttribute('aria-haspopup')).toBe('dialog');
            });
        });

        it('should have aria-expanded attribute on modal trigger buttons', () => {
            const modalButtons = document.querySelectorAll('.details-button[data-target]');
            
            modalButtons.forEach(button => {
                expect(button.hasAttribute('aria-expanded')).toBe(true);
            });
        });

        it('should have aria-controls attribute on modal trigger buttons', () => {
            const modalButtons = document.querySelectorAll('.details-button[data-target]');
            
            modalButtons.forEach(button => {
                expect(button.hasAttribute('aria-controls')).toBe(true);
                const controlsId = button.getAttribute('aria-controls');
                const targetModal = document.getElementById(controlsId);
                expect(targetModal).not.toBeNull();
            });
        });
    });

    describe('Keyboard Accessibility', () => {
        it('should not have tabindex="-1" on visible interactive buttons', () => {
            const visibleButtons = document.querySelectorAll('button:not([hidden]):not([style*="display: none"])');
            
            visibleButtons.forEach(button => {
                const tabindex = button.getAttribute('tabindex');
                if (tabindex !== null) {
                    expect(parseInt(tabindex)).not.toBe(-1);
                }
            });
        });
    });

    describe('No Duplicate Button IDs', () => {
        it('should have unique IDs for all buttons with id attribute', () => {
            const buttonsWithIds = document.querySelectorAll('button[id]');
            const ids = Array.from(buttonsWithIds).map(btn => btn.id);
            const uniqueIds = new Set(ids);
            
            expect(ids.length).toBe(uniqueIds.size);
        });
    });

    describe('SEO - No Generic Anchor Text', () => {
        it('should not use generic anchor text', () => {
            const genericPhrases = ['اضغط هنا', 'المزيد', 'هنا', 'click here', 'here', 'more'];
            const links = document.querySelectorAll('a');
            
            links.forEach(link => {
                const text = link.textContent.trim().toLowerCase();
                const isGeneric = genericPhrases.some(phrase => text === phrase);
                expect(isGeneric).toBe(false);
            });
        });
    });

    describe('WhatsApp Links Format', () => {
        it('should use correct WhatsApp link format', () => {
            const whatsappLinks = document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]');
            
            whatsappLinks.forEach(link => {
                const href = link.getAttribute('href');
                expect(href).toMatch(/^https:\/\/wa\.me\/\d+/);
            });
        });
    });
});
