/**
 * BrightAI - Magnetic Cursor Effect
 * Version: 1.0.0
 * 
 * Implements a custom magnetic cursor effect for desktop devices only.
 * Requirements: 11.4, 14.4
 * 
 * Features:
 * - Custom cursor dot and outline that follow mouse movement
 * - Magnetic effect on interactive elements (buttons, links)
 * - Automatically disabled on mobile/touch devices
 * - Respects prefers-reduced-motion preference
 */

'use strict';

/**
 * MagneticCursor class handles the custom cursor effect
 * Only initializes on desktop devices with hover capability
 */
class MagneticCursor {
    constructor() {
        // Check if we should initialize (desktop only)
        this.isDesktop = this.checkIsDesktop();
        this.isReducedMotion = this.checkReducedMotion();
        
        if (!this.isDesktop || this.isReducedMotion) {
            console.log('[MagneticCursor] Disabled - mobile device or reduced motion preference detected');
            return;
        }
        
        this.cursorDot = null;
        this.cursorOutline = null;
        this.mouseX = 0;
        this.mouseY = 0;
        this.outlineX = 0;
        this.outlineY = 0;
        this.isHovering = false;
        this.animationFrameId = null;
        
        this.init();
    }
    
    /**
     * Check if the device is a desktop with hover capability
     * @returns {boolean} True if desktop device
     */
    checkIsDesktop() {
        // Check viewport width
        if (window.innerWidth <= 768) {
            return false;
        }
        
        // Check for touch capability
        const hasTouch = 'ontouchstart' in window || 
                         navigator.maxTouchPoints > 0 ||
                         navigator.msMaxTouchPoints > 0;
        
        // Check for hover capability using media query
        const hasHover = window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        
        // Desktop should have hover capability and fine pointer (mouse)
        return hasHover && hasFinePointer && !hasTouch;
    }
    
    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion is preferred
     */
    checkReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Initialize the cursor elements and event listeners
     */
    init() {
        this.createCursorElements();
        this.bindEvents();
        this.animate();
        
        // Add class to body to indicate custom cursor is active
        document.body.classList.add('custom-cursor-active');
        
        console.log('[MagneticCursor] Initialized successfully');
    }
    
    /**
     * Create the cursor DOM elements
     */
    createCursorElements() {
        // Create cursor dot
        this.cursorDot = document.createElement('div');
        this.cursorDot.className = 'cursor-dot';
        this.cursorDot.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.cursorDot);
        
        // Create cursor outline
        this.cursorOutline = document.createElement('div');
        this.cursorOutline.className = 'cursor-outline';
        this.cursorOutline.setAttribute('aria-hidden', 'true');
        document.body.appendChild(this.cursorOutline);
    }
    
    /**
     * Bind mouse and resize event listeners
     */
    bindEvents() {
        // Mouse move handler
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        }, { passive: true });
        
        // Hover state handlers for interactive elements
        const interactiveElements = document.querySelectorAll(
            'a, button, [role="button"], input, select, textarea, ' +
            '.cta-button, .glass-button, .glass-card, .service-card, ' +
            '.nav-links a, .magnetic-target'
        );
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => this.handleHoverStart(el));
            el.addEventListener('mouseleave', () => this.handleHoverEnd(el));
        });
        
        // Handle dynamic elements with event delegation
        document.body.addEventListener('mouseenter', (e) => {
            const target = e.target.closest(
                'a, button, [role="button"], .cta-button, .glass-button, .magnetic-target'
            );
            if (target) {
                this.handleHoverStart(target);
            }
        }, true);
        
        document.body.addEventListener('mouseleave', (e) => {
            const target = e.target.closest(
                'a, button, [role="button"], .cta-button, .glass-button, .magnetic-target'
            );
            if (target) {
                this.handleHoverEnd(target);
            }
        }, true);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (!this.checkIsDesktop()) {
                this.destroy();
            }
        });
        
        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.hideCursor();
            } else {
                this.showCursor();
            }
        });
        
        // Hide cursor when mouse leaves window
        document.addEventListener('mouseleave', () => this.hideCursor());
        document.addEventListener('mouseenter', () => this.showCursor());
    }
    
    /**
     * Handle hover start on interactive elements
     * @param {HTMLElement} element - The hovered element
     */
    handleHoverStart(element) {
        this.isHovering = true;
        document.body.classList.add('cursor-hover');
        
        // Apply magnetic effect if element has magnetic-target class
        if (element.classList.contains('magnetic-target')) {
            this.applyMagneticEffect(element);
        }
    }
    
    /**
     * Handle hover end on interactive elements
     * @param {HTMLElement} element - The element being left
     */
    handleHoverEnd(element) {
        this.isHovering = false;
        document.body.classList.remove('cursor-hover');
        
        // Remove magnetic effect
        if (element.classList.contains('magnetic-target')) {
            this.removeMagneticEffect(element);
        }
    }
    
    /**
     * Apply magnetic pull effect to element
     * @param {HTMLElement} element - The element to apply effect to
     */
    applyMagneticEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const moveHandler = (e) => {
            const deltaX = (e.clientX - centerX) * 0.3;
            const deltaY = (e.clientY - centerY) * 0.3;
            
            element.style.setProperty('--magnetic-x', `${deltaX}px`);
            element.style.setProperty('--magnetic-y', `${deltaY}px`);
        };
        
        element._magneticHandler = moveHandler;
        document.addEventListener('mousemove', moveHandler, { passive: true });
    }
    
    /**
     * Remove magnetic effect from element
     * @param {HTMLElement} element - The element to remove effect from
     */
    removeMagneticEffect(element) {
        if (element._magneticHandler) {
            document.removeEventListener('mousemove', element._magneticHandler);
            delete element._magneticHandler;
        }
        
        element.style.setProperty('--magnetic-x', '0');
        element.style.setProperty('--magnetic-y', '0');
    }
    
    /**
     * Animation loop for smooth cursor movement
     */
    animate() {
        // Smooth follow for outline (lerp)
        const ease = 0.15;
        this.outlineX += (this.mouseX - this.outlineX) * ease;
        this.outlineY += (this.mouseY - this.outlineY) * ease;
        
        // Update cursor positions
        if (this.cursorDot) {
            this.cursorDot.style.left = `${this.mouseX}px`;
            this.cursorDot.style.top = `${this.mouseY}px`;
        }
        
        if (this.cursorOutline) {
            this.cursorOutline.style.left = `${this.outlineX}px`;
            this.cursorOutline.style.top = `${this.outlineY}px`;
        }
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    /**
     * Hide the cursor elements
     */
    hideCursor() {
        if (this.cursorDot) this.cursorDot.style.opacity = '0';
        if (this.cursorOutline) this.cursorOutline.style.opacity = '0';
    }
    
    /**
     * Show the cursor elements
     */
    showCursor() {
        if (this.cursorDot) this.cursorDot.style.opacity = '1';
        if (this.cursorOutline) this.cursorOutline.style.opacity = '0.5';
    }
    
    /**
     * Destroy the cursor and clean up
     */
    destroy() {
        // Cancel animation
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // Remove elements
        if (this.cursorDot) {
            this.cursorDot.remove();
            this.cursorDot = null;
        }
        
        if (this.cursorOutline) {
            this.cursorOutline.remove();
            this.cursorOutline = null;
        }
        
        // Remove body class
        document.body.classList.remove('custom-cursor-active', 'cursor-hover');
        
        console.log('[MagneticCursor] Destroyed');
    }
}

/**
 * Initialize magnetic cursor when DOM is ready
 * Only on desktop devices (> 768px viewport)
 */
function initMagneticCursor() {
    // Double-check viewport width before initializing
    if (window.innerWidth > 768) {
        window.magneticCursor = new MagneticCursor();
    }
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMagneticCursor);
} else {
    initMagneticCursor();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MagneticCursor, initMagneticCursor };
}
