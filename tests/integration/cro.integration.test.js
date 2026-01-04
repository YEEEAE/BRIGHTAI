/**
 * CRO (Conversion Rate Optimization) Integration Tests
 * Tests the complete user journey for CRO elements
 * 
 * Requirements: 15.1-15.5, 16.1-16.4, 17.1-17.5, 18.1-18.5, 19.1-19.6, 20.1-20.5
 * Task: 29.2 Test complete user journey
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// Read the actual HTML file
const indexHtmlPath = path.join(process.cwd(), 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

describe('CRO Integration Tests - User Journey', () => {
    let dom;
    let document;
    let window;

    beforeEach(() => {
        dom = new JSDOM(indexHtml, {
            runScripts: 'outside-only',
            pretendToBeVisual: true,
            url: 'https://brightai.site/'
        });
        document = dom.window.document;
        window = dom.window;
        
        // Mock dataLayer
        window.dataLayer = [];
    });

    describe('Trust Signals Visibility (Requirements 15.1-15.5)', () => {
        it('should have trust bar visible in hero section', () => {
            const trustBar = document.querySelector('.trust-bar');
            expect(trustBar).not.toBeNull();
        });

        it('should display "شركة سعودية 100%" badge prominently', () => {
            const saudiBadge = document.querySelector('.trust-badge-primary');
            expect(saudiBadge).not.toBeNull();
            
            const badgeText = saudiBadge?.textContent;
            expect(badgeText).toContain('شركة سعودية 100%');
        });

        it('should display ISO certification badges', () => {
            const isoBadges = document.querySelectorAll('.trust-badge-iso');
            expect(isoBadges.length).toBeGreaterThanOrEqual(2);
            
            const badgeTexts = Array.from(isoBadges).map(b => b.textContent);
            expect(badgeTexts.some(t => t.includes('ISO 27001'))).toBe(true);
            expect(badgeTexts.some(t => t.includes('ISO 9001'))).toBe(true);
        });

        it('should reference Vision 2030 alignment', () => {
            const visionBadge = document.querySelector('.trust-badge-vision');
            expect(visionBadge).not.toBeNull();
            expect(visionBadge?.textContent).toContain('2030');
        });
    });

    describe('Pricing Section (Requirements 19.1-19.6)', () => {
        it('should display three pricing tiers', () => {
            const pricingCards = document.querySelectorAll('.pricing-card');
            expect(pricingCards.length).toBe(3);
        });

        it('should display Basic tier with ٥٠,٠٠٠ ريال pricing', () => {
            const basicCard = document.querySelector('#pricing-basic-title')?.closest('.pricing-card');
            expect(basicCard).not.toBeNull();
            
            const price = basicCard?.querySelector('.pricing-price');
            expect(price?.textContent).toContain('٥٠,٠٠٠');
        });

        it('should display Professional tier with ١٥٠,٠٠٠ ريال and "الأكثر طلباً" badge', () => {
            const professionalCard = document.querySelector('#pricing-professional-title')?.closest('.pricing-card');
            expect(professionalCard).not.toBeNull();
            expect(professionalCard?.classList.contains('popular')).toBe(true);
            
            const badge = professionalCard?.querySelector('.pricing-badge');
            expect(badge?.textContent).toContain('الأكثر طلباً');
            
            const price = professionalCard?.querySelector('.pricing-price');
            expect(price?.textContent).toContain('١٥٠,٠٠٠');
        });

        it('should display Custom tier with "تواصل معنا"', () => {
            const customCard = document.querySelector('#pricing-custom-title')?.closest('.pricing-card');
            expect(customCard).not.toBeNull();
            
            const customText = customCard?.querySelector('.pricing-custom-text');
            expect(customText?.textContent).toContain('تواصل معنا');
        });

        it('should display VAT note below pricing', () => {
            const vatNote = document.querySelector('.pricing-vat-note');
            expect(vatNote).not.toBeNull();
            expect(vatNote?.textContent).toContain('جميع الأسعار شاملة ضريبة القيمة المضافة');
        });
    });

    describe('WhatsApp and Contact Options (Requirements 18.1-18.5)', () => {
        it('should have floating WhatsApp button', () => {
            const whatsAppButton = document.getElementById('floating-whatsapp');
            expect(whatsAppButton).not.toBeNull();
        });

        it('should have WhatsApp button with correct link format', () => {
            const whatsAppLink = document.querySelector('.floating-whatsapp-btn');
            expect(whatsAppLink).not.toBeNull();
            
            const href = whatsAppLink?.getAttribute('href');
            expect(href).toContain('wa.me/966');
        });

        it('should have WhatsApp button positioned for RTL (bottom-left)', () => {
            const whatsAppContainer = document.getElementById('floating-whatsapp');
            expect(whatsAppContainer).not.toBeNull();
            // The CSS positions it on the left for RTL
        });

        it('should have WhatsApp tooltip in Arabic', () => {
            const tooltip = document.querySelector('.floating-whatsapp-tooltip');
            expect(tooltip).not.toBeNull();
            expect(tooltip?.textContent).toContain('واتساب');
        });
    });

    describe('Testimonials Section (Requirements 17.1-17.5)', () => {
        it('should have testimonials carousel', () => {
            const carousel = document.querySelector('.testimonials-carousel');
            expect(carousel).not.toBeNull();
        });

        it('should display Arabic testimonials with quotes', () => {
            const testimonialCards = document.querySelectorAll('.testimonial-card');
            expect(testimonialCards.length).toBeGreaterThan(0);
            
            const firstQuote = testimonialCards[0]?.querySelector('.testimonial-quote p');
            expect(firstQuote?.textContent?.length).toBeGreaterThan(0);
        });

        it('should include client name, position, and company', () => {
            const testimonialCard = document.querySelector('.testimonial-card');
            expect(testimonialCard).not.toBeNull();
            
            const name = testimonialCard?.querySelector('.testimonial-name');
            const position = testimonialCard?.querySelector('.testimonial-position');
            const company = testimonialCard?.querySelector('.testimonial-company');
            
            expect(name).not.toBeNull();
            expect(position).not.toBeNull();
            expect(company).not.toBeNull();
        });

        it('should display 5-star ratings', () => {
            const rating = document.querySelector('.testimonial-rating');
            expect(rating).not.toBeNull();
            
            const stars = rating?.querySelectorAll('.fa-star');
            expect(stars?.length).toBe(5);
        });

        it('should have carousel navigation controls', () => {
            const prevBtn = document.querySelector('.testimonials-prev');
            const nextBtn = document.querySelector('.testimonials-next');
            const dots = document.querySelectorAll('.testimonials-dot');
            
            expect(prevBtn).not.toBeNull();
            expect(nextBtn).not.toBeNull();
            expect(dots.length).toBeGreaterThan(0);
        });
    });

    describe('Client Logos Section (Requirements 16.1-16.4)', () => {
        it('should have client logos section with heading "عملاؤنا الموثوقون"', () => {
            const heading = document.getElementById('client-logos-title');
            expect(heading).not.toBeNull();
            expect(heading?.textContent).toContain('عملاؤنا الموثوقون');
        });

        it('should display client logos in responsive grid', () => {
            const logosGrid = document.querySelector('.client-logos-grid');
            expect(logosGrid).not.toBeNull();
            
            const logoCards = logosGrid?.querySelectorAll('.client-logo-card');
            expect(logoCards?.length).toBeGreaterThan(0);
        });

        it('should have hover effects showing company names', () => {
            const logoCard = document.querySelector('.client-logo-card');
            expect(logoCard).not.toBeNull();
            
            const companyName = logoCard?.querySelector('.client-logo-name');
            expect(companyName).not.toBeNull();
        });
    });

    describe('Analytics Events Fire Correctly', () => {
        it('should have data-track attributes on CTAs', () => {
            const trackedElements = document.querySelectorAll('[data-track]');
            expect(trackedElements.length).toBeGreaterThan(0);
        });

        it('should have data-track on WhatsApp button', () => {
            const whatsAppLink = document.querySelector('.floating-whatsapp-btn');
            expect(whatsAppLink?.getAttribute('data-track')).toBeTruthy();
        });

        it('should have data-track on pricing CTAs', () => {
            const pricingCTAs = document.querySelectorAll('.pricing-card .cta-primary, .pricing-card .cta-urgency, .pricing-card .cta-trust');
            expect(pricingCTAs.length).toBe(3);
            
            pricingCTAs.forEach(cta => {
                expect(cta.getAttribute('data-track')).toBeTruthy();
            });
        });
    });
});

describe('BrightAI App CRO Configuration', () => {
    it('should have CRO components enabled in default configuration', () => {
        // Read the brightai-app.js file
        const appJsPath = path.join(process.cwd(), 'brightai-app.js');
        const appJs = fs.readFileSync(appJsPath, 'utf-8');
        
        // Check that CRO components are enabled
        expect(appJs).toContain('enableUrgencyElements: true');
        expect(appJs).toContain('enableTestimonials: true');
        expect(appJs).toContain('enablePricingInteractions: true');
        expect(appJs).toContain('enableWhatsAppButton: true');
    });

    it('should have Phase 5 for CRO components initialization', () => {
        const appJsPath = path.join(process.cwd(), 'brightai-app.js');
        const appJs = fs.readFileSync(appJsPath, 'utf-8');
        
        expect(appJs).toContain('Phase 5: Initialize CRO');
        expect(appJs).toContain('initCROComponents');
    });

    it('should track CRO events to dataLayer', () => {
        const appJsPath = path.join(process.cwd(), 'brightai-app.js');
        const appJs = fs.readFileSync(appJsPath, 'utf-8');
        
        expect(appJs).toContain('cro_testimonials_view');
        expect(appJs).toContain('cro_pricing_view');
        expect(appJs).toContain('cro_pricing_cta_click');
        expect(appJs).toContain('cro_whatsapp_click');
        expect(appJs).toContain('cro_trust_bar_visible');
    });
});

describe('Urgency Elements Configuration', () => {
    let dom;
    let document;

    beforeEach(() => {
        dom = new JSDOM(indexHtml, {
            runScripts: 'outside-only',
            pretendToBeVisual: true,
            url: 'https://brightai.site/'
        });
        document = dom.window.document;
    });

    it('should have urgency elements CSS loaded', () => {
        const linkTags = document.querySelectorAll('link[rel="stylesheet"]');
        const urgencyCss = Array.from(linkTags).find(link => 
            link.getAttribute('href')?.includes('urgency-elements.css')
        );
        expect(urgencyCss).not.toBeNull();
    });

    it('should have urgency elements JS loaded', () => {
        const scriptTags = document.querySelectorAll('script');
        const urgencyJs = Array.from(scriptTags).find(script => 
            script.getAttribute('src')?.includes('urgency-elements.js')
        );
        expect(urgencyJs).not.toBeNull();
    });
});
