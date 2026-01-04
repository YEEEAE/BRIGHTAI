/**
 * BrightAI Main Application Class
 * Integrates all components in the correct order with proper dependency management
 * 
 * Version: 1.1.0
 * 
 * Components integrated:
 * - ThemeController (theme-controller.js)
 * - ParticleSystem (particle-system.js)
 * - ScrollAnimations (scroll-animations.js)
 * - BrightAIChatbot (chatbot.js)
 * - BrightAISmartSearch (smart-search.js)
 * - MicroInteractions (micro-interactions.js)
 * - MagneticCursor (magnetic-cursor.js)
 * - BrightAIAnalytics (analytics-tracker.js)
 * - Service Worker (PWA support)
 * - UrgencyBanner (urgency-elements.js) - Countdown, scarcity, notifications
 * - TestimonialsCarousel (script.js) - Client testimonials
 * - PricingSection - Pricing tier interactions
 * - WhatsAppButton - Floating contact button
 */

'use strict';

/**
 * Main BrightAI Application Class
 * Orchestrates initialization of all website components
 */
class BrightAIApp {
    constructor(options = {}) {
        // Configuration
        this.config = {
            debug: options.debug || false,
            enableParticles: options.enableParticles !== false,
            enableChatbot: options.enableChatbot !== false,
            enableSmartSearch: options.enableSmartSearch !== false,
            enableMicroInteractions: options.enableMicroInteractions !== false,
            enableMagneticCursor: options.enableMagneticCursor !== false,
            enableAnalytics: options.enableAnalytics !== false,
            enableServiceWorker: options.enableServiceWorker !== false,
            // CRO Components Configuration
            enableUrgencyElements: options.enableUrgencyElements !== false,
            enableTestimonials: options.enableTestimonials !== false,
            enablePricingInteractions: options.enablePricingInteractions !== false,
            enableWhatsAppButton: options.enableWhatsAppButton !== false,
            ...options
        };

        // Component references
        this.components = {
            themeController: null,
            particleSystem: null,
            scrollAnimations: null,
            chatbot: null,
            smartSearch: null,
            microInteractions: null,
            magneticCursor: null,
            analytics: null,
            // CRO Components
            urgencyBanner: null,
            testimonialsCarousel: null,
            pricingSection: null,
            whatsAppButton: null
        };

        // State
        this.isInitialized = false;
        this.initializationErrors = [];

        // Bind methods
        this.init = this.init.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    /**
     * Log messages if debug mode is enabled
     * @param {string} message - Message to log
     * @param {string} level - Log level (log, warn, error)
     */
    log(message, level = 'log') {
        if (this.config.debug || level === 'error') {
            console[level](`[BrightAI App] ${message}`);
        }
    }

    /**
     * Initialize all components in the correct order
     * @returns {Promise<void>}
     */
    async init() {
        if (this.isInitialized) {
            this.log('Already initialized', 'warn');
            return;
        }

        this.log('Starting initialization...');
        const startTime = performance.now();

        try {
            // Phase 1: Critical components (theme, analytics)
            await this.initCriticalComponents();

            // Phase 2: Visual components (particles, animations)
            await this.initVisualComponents();

            // Phase 3: Interactive components (chatbot, search)
            await this.initInteractiveComponents();

            // Phase 4: Enhancement components (micro-interactions, cursor)
            await this.initEnhancementComponents();

            // Phase 5: CRO components (urgency, testimonials, pricing, WhatsApp)
            await this.initCROComponents();

            // Phase 6: PWA and service worker
            await this.initPWA();

            // Wire up event listeners
            this.wireEventListeners();

            this.isInitialized = true;
            const duration = Math.round(performance.now() - startTime);
            this.log(`Initialization complete in ${duration}ms`);

            // Dispatch initialization complete event
            window.dispatchEvent(new CustomEvent('brightai:initialized', {
                detail: {
                    duration,
                    components: Object.keys(this.components).filter(k => this.components[k] !== null),
                    errors: this.initializationErrors
                }
            }));

        } catch (error) {
            this.log(`Initialization failed: ${error.message}`, 'error');
            this.initializationErrors.push(error);
            throw error;
        }
    }

    /**
     * Phase 1: Initialize critical components
     * These must load first as other components may depend on them
     */
    async initCriticalComponents() {
        this.log('Phase 1: Initializing critical components...');

        // 1.1 Theme Controller - Must be first for proper styling
        try {
            // ThemeController auto-initializes, just store reference
            if (window.themeController) {
                this.components.themeController = window.themeController;
                this.log('Theme controller reference stored');
            } else if (typeof ThemeController !== 'undefined') {
                this.components.themeController = new ThemeController();
                this.log('Theme controller initialized');
            }
        } catch (error) {
            this.log(`Theme controller failed: ${error.message}`, 'warn');
            this.initializationErrors.push({ component: 'themeController', error });
        }

        // 1.2 Analytics - Should start tracking early
        if (this.config.enableAnalytics) {
            try {
                // BrightAIAnalytics auto-initializes, just store reference
                if (typeof BrightAIAnalytics !== 'undefined') {
                    this.components.analytics = BrightAIAnalytics;
                    this.log('Analytics tracker reference stored');
                }
            } catch (error) {
                this.log(`Analytics failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'analytics', error });
            }
        }
    }

    /**
     * Phase 2: Initialize visual components
     * Background animations and scroll effects
     */
    async initVisualComponents() {
        this.log('Phase 2: Initializing visual components...');

        // 2.1 Particle System - Background animation
        if (this.config.enableParticles) {
            try {
                // Check if particle system is available and canvas exists
                const particleCanvas = document.getElementById('particle-canvas');
                if (particleCanvas && typeof ParticleSystem !== 'undefined') {
                    // Check if already initialized by particle-system.js auto-init
                    // The particle system auto-initializes, so we just store a reference
                    // if it was created, or create it if not
                    if (typeof initParticleSystemAfterPaint === 'function') {
                        // Lazy initialization is handled by particle-system.js
                        this.log('Particle system using lazy initialization');
                    }
                    this.log('Particle system available');
                }
            } catch (error) {
                this.log(`Particle system failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'particleSystem', error });
            }
        }

        // 2.2 Scroll Animations - Fade-in and counter animations
        try {
            // ScrollAnimations auto-initializes, just store reference
            if (window.scrollAnimations) {
                this.components.scrollAnimations = window.scrollAnimations;
                this.log('Scroll animations reference stored');
            } else if (typeof ScrollAnimations !== 'undefined') {
                this.components.scrollAnimations = new ScrollAnimations({
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px',
                    counterDuration: 2000
                });
                this.components.scrollAnimations.init();
                this.log('Scroll animations initialized');
            }
        } catch (error) {
            this.log(`Scroll animations failed: ${error.message}`, 'warn');
            this.initializationErrors.push({ component: 'scrollAnimations', error });
        }
    }

    /**
     * Phase 3: Initialize interactive components
     * AI chatbot and smart search
     */
    async initInteractiveComponents() {
        this.log('Phase 3: Initializing interactive components...');

        // 3.1 AI Chatbot - Lazy loaded for performance
        if (this.config.enableChatbot) {
            try {
                // Chatbot auto-initializes via initChatbotLazy
                // Just check if it's available
                if (typeof BrightAIChatbot !== 'undefined') {
                    this.log('Chatbot module available (lazy loading)');
                }
            } catch (error) {
                this.log(`Chatbot failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'chatbot', error });
            }
        }

        // 3.2 Smart Search - Initialize if container exists
        if (this.config.enableSmartSearch) {
            try {
                const searchContainer = document.getElementById('smart-search-container');
                if (searchContainer && typeof BrightAISmartSearch !== 'undefined') {
                    this.components.smartSearch = new BrightAISmartSearch();
                    this.components.smartSearch.init('#smart-search-container');
                    this.log('Smart search initialized');
                } else if (!searchContainer) {
                    this.log('Smart search container not found, skipping');
                }
            } catch (error) {
                this.log(`Smart search failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'smartSearch', error });
            }
        }
    }

    /**
     * Phase 4: Initialize enhancement components
     * Micro-interactions and custom cursor
     */
    async initEnhancementComponents() {
        this.log('Phase 4: Initializing enhancement components...');

        // 4.1 Micro-interactions - Ripple effects, pulse glow, parallax
        if (this.config.enableMicroInteractions) {
            try {
                // MicroInteractions auto-initializes, just store reference
                if (window.microInteractions) {
                    this.components.microInteractions = window.microInteractions;
                    this.log('Micro-interactions reference stored');
                } else if (typeof MicroInteractions !== 'undefined') {
                    this.components.microInteractions = new MicroInteractions({
                        rippleDuration: 600,
                        parallaxSpeed: 0.5
                    });
                    this.components.microInteractions.init();
                    this.log('Micro-interactions initialized');
                }
            } catch (error) {
                this.log(`Micro-interactions failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'microInteractions', error });
            }
        }

        // 4.2 Magnetic Cursor - Desktop only
        if (this.config.enableMagneticCursor) {
            try {
                // MagneticCursor auto-initializes on desktop, just store reference
                if (window.magneticCursor) {
                    this.components.magneticCursor = window.magneticCursor;
                    this.log('Magnetic cursor reference stored');
                } else if (window.innerWidth > 768 && typeof MagneticCursor !== 'undefined') {
                    this.components.magneticCursor = new MagneticCursor();
                    this.log('Magnetic cursor initialized');
                }
            } catch (error) {
                this.log(`Magnetic cursor failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'magneticCursor', error });
            }
        }
    }

    /**
     * Phase 5: Initialize CRO (Conversion Rate Optimization) components
     * Trust bar, testimonials, pricing, urgency elements, WhatsApp button
     * Requirements: 15.1-15.5, 16.1-16.4, 17.1-17.5, 18.1-18.5, 19.1-19.6, 20.1-20.5
     */
    async initCROComponents() {
        this.log('Phase 5: Initializing CRO components...');

        // 5.1 Urgency Banner - Countdown timer, scarcity indicator, live notifications
        if (this.config.enableUrgencyElements) {
            try {
                // UrgencyBanner auto-initializes, store reference
                if (window.urgencyBanner) {
                    this.components.urgencyBanner = window.urgencyBanner;
                    this.log('Urgency banner reference stored');
                } else if (typeof UrgencyBanner !== 'undefined') {
                    this.components.urgencyBanner = new UrgencyBanner({
                        countdown: {
                            enabled: true,
                            showInHero: true
                        },
                        scarcity: {
                            enabled: true,
                            remainingSpots: 7
                        },
                        notifications: {
                            enabled: true,
                            interval: 8000
                        }
                    });
                    this.components.urgencyBanner.init();
                    this.log('Urgency banner initialized');
                }
                
                // Start countdown timer and live notifications
                if (this.components.urgencyBanner) {
                    const countdown = this.components.urgencyBanner.getCountdown();
                    const notifications = this.components.urgencyBanner.getNotifications();
                    
                    if (countdown) {
                        this.log('Countdown timer started');
                    }
                    if (notifications) {
                        this.log('Live notifications started');
                    }
                }
            } catch (error) {
                this.log(`Urgency banner failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'urgencyBanner', error });
            }
        }

        // 5.2 Testimonials Carousel - Already initialized by script.js
        if (this.config.enableTestimonials) {
            try {
                const testimonialsCarousel = document.querySelector('.testimonials-carousel');
                if (testimonialsCarousel) {
                    this.components.testimonialsCarousel = testimonialsCarousel;
                    this.log('Testimonials carousel reference stored');
                    
                    // Track testimonials view for analytics
                    this.trackTestimonialsView(testimonialsCarousel);
                }
            } catch (error) {
                this.log(`Testimonials carousel failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'testimonialsCarousel', error });
            }
        }

        // 5.3 Pricing Section - Add hover effects and interaction tracking
        if (this.config.enablePricingInteractions) {
            try {
                const pricingSection = document.querySelector('.pricing-section');
                if (pricingSection) {
                    this.components.pricingSection = pricingSection;
                    this.initPricingInteractions(pricingSection);
                    this.log('Pricing section interactions initialized');
                }
            } catch (error) {
                this.log(`Pricing section failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'pricingSection', error });
            }
        }

        // 5.4 WhatsApp Floating Button - Ensure visibility and add tracking
        if (this.config.enableWhatsAppButton) {
            try {
                const whatsAppButton = document.getElementById('floating-whatsapp');
                if (whatsAppButton) {
                    this.components.whatsAppButton = whatsAppButton;
                    this.ensureWhatsAppVisibility(whatsAppButton);
                    this.initWhatsAppTracking(whatsAppButton);
                    this.log('WhatsApp button initialized');
                }
            } catch (error) {
                this.log(`WhatsApp button failed: ${error.message}`, 'warn');
                this.initializationErrors.push({ component: 'whatsAppButton', error });
            }
        }

        // 5.5 Trust Bar - Verify visibility above the fold
        try {
            const trustBar = document.querySelector('.trust-bar');
            if (trustBar) {
                this.verifyTrustBarVisibility(trustBar);
                this.log('Trust bar visibility verified');
            }
        } catch (error) {
            this.log(`Trust bar verification failed: ${error.message}`, 'warn');
        }

        // Dispatch CRO initialization complete event
        window.dispatchEvent(new CustomEvent('brightai:cro-initialized', {
            detail: {
                urgencyBanner: this.components.urgencyBanner !== null,
                testimonialsCarousel: this.components.testimonialsCarousel !== null,
                pricingSection: this.components.pricingSection !== null,
                whatsAppButton: this.components.whatsAppButton !== null
            }
        }));
    }

    /**
     * Track testimonials view for analytics
     * @param {HTMLElement} carousel - Testimonials carousel element
     */
    trackTestimonialsView(carousel) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.croTracked) {
                    entry.target.dataset.croTracked = 'true';
                    
                    // Push to dataLayer for GTM
                    if (window.dataLayer) {
                        window.dataLayer.push({
                            event: 'cro_testimonials_view',
                            component: 'testimonials_carousel',
                            location: 'homepage'
                        });
                    }
                    
                    this.log('Testimonials view tracked');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(carousel);
    }

    /**
     * Initialize pricing section interactions
     * @param {HTMLElement} pricingSection - Pricing section element
     */
    initPricingInteractions(pricingSection) {
        const pricingCards = pricingSection.querySelectorAll('.pricing-card');
        
        pricingCards.forEach((card, index) => {
            // Track card hover
            card.addEventListener('mouseenter', () => {
                if (window.dataLayer) {
                    const tierName = card.querySelector('.pricing-tier-name')?.textContent || `Tier ${index + 1}`;
                    window.dataLayer.push({
                        event: 'cro_pricing_hover',
                        pricing_tier: tierName,
                        tier_index: index
                    });
                }
            });
            
            // Track CTA clicks
            const ctaButton = card.querySelector('.cta-primary, .cta-urgency, .cta-trust');
            if (ctaButton) {
                ctaButton.addEventListener('click', () => {
                    if (window.dataLayer) {
                        const tierName = card.querySelector('.pricing-tier-name')?.textContent || `Tier ${index + 1}`;
                        const price = card.querySelector('.pricing-price')?.textContent || 'custom';
                        window.dataLayer.push({
                            event: 'cro_pricing_cta_click',
                            pricing_tier: tierName,
                            pricing_amount: price,
                            tier_index: index
                        });
                    }
                });
            }
        });
        
        // Track pricing section view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.croTracked) {
                    entry.target.dataset.croTracked = 'true';
                    
                    if (window.dataLayer) {
                        window.dataLayer.push({
                            event: 'cro_pricing_view',
                            component: 'pricing_section',
                            tiers_count: pricingCards.length
                        });
                    }
                    
                    this.log('Pricing section view tracked');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(pricingSection);
    }

    /**
     * Ensure WhatsApp button is always visible
     * @param {HTMLElement} whatsAppButton - WhatsApp button element
     */
    ensureWhatsAppVisibility(whatsAppButton) {
        // Ensure button is visible
        whatsAppButton.style.display = '';
        whatsAppButton.style.visibility = 'visible';
        whatsAppButton.style.opacity = '1';
        
        // Add mutation observer to prevent hiding
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const style = whatsAppButton.style;
                    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                        // Only restore if not hidden by chatbot
                        if (!document.body.classList.contains('chatbot-open')) {
                            style.display = '';
                            style.visibility = 'visible';
                            style.opacity = '1';
                        }
                    }
                }
            });
        });
        
        observer.observe(whatsAppButton, { attributes: true, attributeFilter: ['style'] });
    }

    /**
     * Initialize WhatsApp button tracking
     * @param {HTMLElement} whatsAppButton - WhatsApp button element
     */
    initWhatsAppTracking(whatsAppButton) {
        const link = whatsAppButton.querySelector('a');
        if (link) {
            link.addEventListener('click', () => {
                if (window.dataLayer) {
                    window.dataLayer.push({
                        event: 'cro_whatsapp_click',
                        component: 'floating_whatsapp',
                        location: 'floating_button'
                    });
                }
                this.log('WhatsApp click tracked');
            });
        }
    }

    /**
     * Verify trust bar is visible above the fold
     * @param {HTMLElement} trustBar - Trust bar element
     */
    verifyTrustBarVisibility(trustBar) {
        // Check if trust bar is in viewport on page load
        const rect = trustBar.getBoundingClientRect();
        const isAboveFold = rect.top < window.innerHeight && rect.bottom > 0;
        
        if (isAboveFold) {
            // Track trust bar visibility
            if (window.dataLayer) {
                window.dataLayer.push({
                    event: 'cro_trust_bar_visible',
                    component: 'trust_bar',
                    above_fold: true
                });
            }
        } else {
            this.log('Trust bar not visible above fold', 'warn');
        }
    }

    /**
     * Phase 6: Initialize PWA and service worker
     */
    async initPWA() {
        if (!this.config.enableServiceWorker) return;

        this.log('Phase 6: Initializing PWA...');

        try {
            if ('serviceWorker' in navigator) {
                // Check if service worker is already registered (by script.js)
                const existingRegistration = await navigator.serviceWorker.getRegistration('/');
                
                if (existingRegistration) {
                    this.log('Service worker already registered, attaching update listener');
                    
                    // Listen for updates on existing registration
                    existingRegistration.addEventListener('updatefound', () => {
                        const newWorker = existingRegistration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateNotification();
                                }
                            });
                        }
                    });
                } else {
                    // Register new service worker
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    this.log(`Service worker registered: ${registration.scope}`);

                    // Listen for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    this.showUpdateNotification();
                                }
                            });
                        }
                    });
                }
            }
        } catch (error) {
            this.log(`Service worker registration failed: ${error.message}`, 'warn');
            this.initializationErrors.push({ component: 'serviceWorker', error });
        }
    }

    /**
     * Wire up global event listeners
     */
    wireEventListeners() {
        this.log('Wiring event listeners...');

        // Handle theme changes
        window.addEventListener('themechange', (e) => {
            this.log(`Theme changed to: ${e.detail.theme}`);
            // Notify components that might need to update
            if (this.components.particleSystem) {
                // Particle colors could be updated based on theme
            }
        });

        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });

        // Handle resize for responsive components
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.log('Connection restored');
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.log('Connection lost');
            this.handleOffline();
        });
    }

    /**
     * Pause animations when page is hidden
     */
    pauseAnimations() {
        if (this.components.particleSystem?.getParticleSystem) {
            const ps = this.components.particleSystem.getParticleSystem();
            if (ps) ps.stop();
        }
    }

    /**
     * Resume animations when page is visible
     */
    resumeAnimations() {
        if (this.components.particleSystem?.getParticleSystem) {
            const ps = this.components.particleSystem.getParticleSystem();
            if (ps) ps.start();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Update magnetic cursor based on viewport
        if (window.innerWidth <= 768 && this.components.magneticCursor) {
            this.components.magneticCursor.destroy();
            this.components.magneticCursor = null;
        } else if (window.innerWidth > 768 && !this.components.magneticCursor && this.config.enableMagneticCursor) {
            if (window.MagneticCursor) {
                this.components.magneticCursor = new window.MagneticCursor();
            }
        }
    }

    /**
     * Handle coming back online
     */
    handleOnline() {
        // Could re-enable features that require network
    }

    /**
     * Handle going offline
     */
    handleOffline() {
        // Could show offline indicator or disable network-dependent features
    }

    /**
     * Show update notification for new service worker
     */
    showUpdateNotification() {
        // Check if notification already exists
        if (document.querySelector('.update-notification')) return;

        const notification = document.createElement('div');
        notification.className = 'update-notification glass';
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.innerHTML = `
            <div class="update-content">
                <span>تحديث جديد متاح للموقع!</span>
                <button id="update-now-btn" class="update-btn cta-button" type="button">تحديث الآن</button>
                <button id="dismiss-update-btn" class="dismiss-btn" aria-label="إغلاق" type="button">×</button>
            </div>
        `;
        document.body.appendChild(notification);

        document.getElementById('update-now-btn')?.addEventListener('click', () => {
            notification.remove();
            window.location.reload();
        });

        document.getElementById('dismiss-update-btn')?.addEventListener('click', () => {
            notification.remove();
        });

        // Auto-dismiss after 15 seconds
        setTimeout(() => notification.remove(), 15000);
    }

    /**
     * Get component by name
     * @param {string} name - Component name
     * @returns {Object|null} Component instance or null
     */
    getComponent(name) {
        return this.components[name] || null;
    }

    /**
     * Check if a component is initialized
     * @param {string} name - Component name
     * @returns {boolean}
     */
    hasComponent(name) {
        return this.components[name] !== null;
    }

    /**
     * Get initialization status
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            components: Object.keys(this.components).reduce((acc, key) => {
                acc[key] = this.components[key] !== null;
                return acc;
            }, {}),
            errors: this.initializationErrors
        };
    }

    /**
     * Destroy all components and clean up
     */
    destroy() {
        this.log('Destroying application...');

        // Destroy CRO components first
        if (this.components.urgencyBanner?.destroy) {
            this.components.urgencyBanner.destroy();
        }

        // Destroy components in reverse order
        if (this.components.magneticCursor?.destroy) {
            this.components.magneticCursor.destroy();
        }

        if (this.components.microInteractions?.destroy) {
            this.components.microInteractions.destroy();
        }

        if (this.components.smartSearch?.destroy) {
            this.components.smartSearch.destroy();
        }

        if (this.components.scrollAnimations?.destroy) {
            this.components.scrollAnimations.destroy();
        }

        if (this.components.particleSystem?.destroy) {
            this.components.particleSystem.destroy();
        }

        // Reset state
        this.components = {
            themeController: null,
            particleSystem: null,
            scrollAnimations: null,
            chatbot: null,
            smartSearch: null,
            microInteractions: null,
            magneticCursor: null,
            analytics: null,
            // CRO Components
            urgencyBanner: null,
            testimonialsCarousel: null,
            pricingSection: null,
            whatsAppButton: null
        };

        this.isInitialized = false;
        this.initializationErrors = [];

        this.log('Application destroyed');
    }
}

// Create global instance
window.BrightAIApp = BrightAIApp;

// Auto-initialize when DOM is ready
let brightAIApp = null;

function initBrightAIApp() {
    if (brightAIApp) return brightAIApp;

    brightAIApp = new BrightAIApp({
        debug: false,
        enableParticles: true,
        enableChatbot: true,
        enableSmartSearch: true,
        enableMicroInteractions: true,
        enableMagneticCursor: true,
        enableAnalytics: true,
        enableServiceWorker: true,
        // CRO Components - All enabled by default
        enableUrgencyElements: true,
        enableTestimonials: true,
        enablePricingInteractions: true,
        enableWhatsAppButton: true
    });

    // Initialize after a short delay to ensure all scripts are loaded
    requestAnimationFrame(() => {
        brightAIApp.init().catch(error => {
            console.error('[BrightAI App] Failed to initialize:', error);
        });
    });

    return brightAIApp;
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBrightAIApp);
} else {
    initBrightAIApp();
}

// Make available globally
window.brightAIApp = brightAIApp;

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BrightAIApp, initBrightAIApp };
}
