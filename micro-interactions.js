/**
 * BrightAI - Micro-Interactions Module
 * Implements button ripple effects, pulse glow animations, and parallax scrolling
 * 
 * Features:
 * - Ripple effect on primary button hover/click
 * - Pulse glow animations on interactive elements
 * - Parallax scrolling for hero section
 * 
 * Requirements: 13.3, 14.1, 14.2
 */
'use strict';

/**
 * MicroInteractions class handles all micro-interaction effects
 */
class MicroInteractions {
    constructor(options = {}) {
        // Ripple effect options
        this.rippleClass = options.rippleClass || 'ripple-effect';
        this.rippleDuration = options.rippleDuration || 600;
        
        // Pulse glow options
        this.pulseClass = options.pulseClass || 'pulse-glow';
        
        // Parallax options
        this.parallaxSpeed = options.parallaxSpeed || 0.5;
        this.parallaxAttribute = options.parallaxAttribute || 'data-parallax';
        
        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Store bound handlers for cleanup
        this._boundScrollHandler = null;
        this._boundResizeHandler = null;
        
        // Track initialized state
        this._initialized = false;
    }

    /**
     * Initialize all micro-interactions
     */
    init() {
        if (this._initialized) {
            console.warn('[MicroInteractions] Already initialized');
            return;
        }

        // Skip animations if user prefers reduced motion
        if (this.prefersReducedMotion) {
            console.log('[MicroInteractions] Reduced motion preferred, skipping animations');
            return;
        }

        this.initRippleEffects();
        this.initPulseGlow();
        this.initParallax();
        
        this._initialized = true;
        console.log('[MicroInteractions] Initialized successfully');
    }

    /**
     * Initialize ripple effects on primary buttons
     * Requirements: 14.1
     */
    initRippleEffects() {
        // Select all primary buttons and CTA buttons
        const buttons = document.querySelectorAll('.cta-button, .cta-button-accent, .glass-button, button.primary, [data-ripple]');
        
        buttons.forEach(button => {
            // Add ripple container class
            button.classList.add('ripple-container');
            
            // Add click event for ripple effect
            button.addEventListener('click', (e) => this.createRipple(e, button));
            
            // Add hover event for subtle ripple on hover
            button.addEventListener('mouseenter', (e) => this.createHoverRipple(e, button));
        });
    }

    /**
     * Create ripple effect on click
     * @param {MouseEvent} event - The click event
     * @param {HTMLElement} button - The button element
     */
    createRipple(event, button) {
        // Remove any existing ripples
        const existingRipples = button.querySelectorAll('.ripple');
        existingRipples.forEach(ripple => ripple.remove());

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        // Calculate ripple size (should cover the entire button)
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        
        // Calculate ripple position relative to click
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        // Apply styles
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        // Add ripple to button
        button.appendChild(ripple);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            ripple.remove();
        }, this.rippleDuration);
    }

    /**
     * Create subtle ripple effect on hover
     * @param {MouseEvent} event - The mouseenter event
     * @param {HTMLElement} button - The button element
     */
    createHoverRipple(event, button) {
        // Only create hover ripple if no click ripple is active
        if (button.querySelector('.ripple')) return;
        
        const ripple = document.createElement('span');
        ripple.classList.add('ripple', 'ripple-hover');
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.5;
        
        // Center the hover ripple
        const x = (rect.width - size) / 2;
        const y = (rect.height - size) / 2;
        
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        // Remove on mouse leave
        const removeRipple = () => {
            ripple.classList.add('ripple-fade');
            setTimeout(() => ripple.remove(), 300);
            button.removeEventListener('mouseleave', removeRipple);
        };
        
        button.addEventListener('mouseleave', removeRipple);
    }

    /**
     * Initialize pulse glow animations on interactive elements
     * Requirements: 14.2
     */
    initPulseGlow() {
        // Select interactive elements that should have pulse glow
        const interactiveElements = document.querySelectorAll(
            '.cta-button-accent, ' +
            '.glass-card, ' +
            '.service-icon, ' +
            '.feature-icon, ' +
            '[data-pulse-glow], ' +
            '.stat-counter'
        );
        
        interactiveElements.forEach(element => {
            element.classList.add(this.pulseClass);
        });
        
        // Add pulse animation to floating action buttons
        const floatingButtons = document.querySelectorAll('.floating-whatsapp, .back-to-top');
        floatingButtons.forEach(button => {
            button.classList.add('pulse-glow-strong');
        });
    }

    /**
     * Initialize parallax scrolling for hero section
     * Requirements: 13.3
     */
    initParallax() {
        const heroSection = document.querySelector('.hero');
        const heroContent = document.querySelector('.hero-content');
        const heroCanvas = document.querySelector('.hero-canvas, #particle-canvas');
        
        if (!heroSection) {
            console.warn('[MicroInteractions] Hero section not found for parallax');
            return;
        }

        // Add parallax attribute to hero elements
        if (heroContent) {
            heroContent.setAttribute(this.parallaxAttribute, 'content');
        }
        if (heroCanvas) {
            heroCanvas.setAttribute(this.parallaxAttribute, 'background');
        }

        // Create scroll handler with throttling
        let ticking = false;
        
        this._boundScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateParallax(heroSection, heroContent, heroCanvas);
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Add scroll listener
        window.addEventListener('scroll', this._boundScrollHandler, { passive: true });
        
        // Initial update
        this.updateParallax(heroSection, heroContent, heroCanvas);
    }

    /**
     * Update parallax positions based on scroll
     * @param {HTMLElement} heroSection - The hero section element
     * @param {HTMLElement} heroContent - The hero content element
     * @param {HTMLElement} heroCanvas - The hero canvas/background element
     */
    updateParallax(heroSection, heroContent, heroCanvas) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const heroRect = heroSection.getBoundingClientRect();
        
        // Only apply parallax when hero is visible
        if (heroRect.bottom < 0 || heroRect.top > window.innerHeight) {
            return;
        }

        // Calculate parallax offset
        const parallaxOffset = scrollTop * this.parallaxSpeed;
        
        // Apply parallax to content (moves slower than scroll)
        if (heroContent) {
            const contentOffset = parallaxOffset * 0.3;
            heroContent.style.transform = `translateY(${contentOffset}px)`;
            
            // Add subtle opacity fade as user scrolls
            const opacity = Math.max(0, 1 - (scrollTop / (heroRect.height * 0.8)));
            heroContent.style.opacity = opacity;
        }
        
        // Apply parallax to background (moves even slower)
        if (heroCanvas) {
            const bgOffset = parallaxOffset * 0.1;
            heroCanvas.style.transform = `translateY(${bgOffset}px)`;
        }
    }

    /**
     * Cleanup and destroy all micro-interactions
     */
    destroy() {
        // Remove scroll listener
        if (this._boundScrollHandler) {
            window.removeEventListener('scroll', this._boundScrollHandler);
            this._boundScrollHandler = null;
        }

        // Remove ripple containers
        document.querySelectorAll('.ripple-container').forEach(el => {
            el.classList.remove('ripple-container');
            el.querySelectorAll('.ripple').forEach(ripple => ripple.remove());
        });

        // Remove pulse glow classes
        document.querySelectorAll(`.${this.pulseClass}, .pulse-glow-strong`).forEach(el => {
            el.classList.remove(this.pulseClass, 'pulse-glow-strong');
        });

        // Reset parallax transforms
        const heroContent = document.querySelector('.hero-content');
        const heroCanvas = document.querySelector('.hero-canvas, #particle-canvas');
        
        if (heroContent) {
            heroContent.style.transform = '';
            heroContent.style.opacity = '';
        }
        if (heroCanvas) {
            heroCanvas.style.transform = '';
        }

        this._initialized = false;
        console.log('[MicroInteractions] Destroyed successfully');
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MicroInteractions };
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.microInteractions = new MicroInteractions({
        rippleDuration: 600,
        parallaxSpeed: 0.5
    });
    
    window.microInteractions.init();
});
