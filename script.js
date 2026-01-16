// BrightAI - Enhanced JavaScript for Performance, Analytics & User Experience
// Version: 3.2.0 - Unified Design System Edition
// Last updated: January 2026
'use strict';

// Import utilities from centralized module (loaded via js/utils.js)
// Utilities available via window.BrightAIUtils after utils.js loads

/**
 * =================================================================================
 * SECTION 1: GTM / ANALYTICS HELPER FUNCTIONS
 * =================================================================================
 */

/**
 * Returns a cleaned page path, removing irrelevant query parameters to avoid
 * polluting Google Analytics reports.
 * @returns {string} The cleaned page path.
 */
function getCleanPagePath() {
    const path = window.location.pathname;
    const search = window.location.search;
    if (!search) {
        return path;
    }
    const params = new URLSearchParams(search);
    params.delete('gtm_debug');
    params.delete('fbclid'); // Example of another parameter to remove
    const cleanedSearch = params.toString();
    return cleanedSearch ? `${path}?${cleanedSearch}` : path;
}


// إضافة إلى script.js - تحسين Core Web Vitals
const optimizeLCP = () => {
    // Preload LCP image
    const lcpImage = document.querySelector('.hero-image');
    if (lcpImage) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = lcpImage.src;
        document.head.appendChild(link);
    }
};

const optimizeCLS = () => {
    // Reserve space for dynamic content
    const reserveSpace = (selector, ratio = 56.25) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            const width = el.offsetWidth;
            el.style.height = `${width * (ratio / 100)}px`;
        });
    };
    reserveSpace('.service-card-image');
};
/**
 * Updates GTM consent state. This function should be triggered by a Consent
 * Management Platform (CMP) once the user provides their consent choices.
 */
function initializeAnalyticsOnConsent() {
    console.log('[Analytics] User consent granted. Initializing analytics tags.');
    if (typeof gtag !== 'function') {
        console.error('[Analytics] gtag function not found. GTM script might be blocked.');
        return;
    }
    gtag('consent', 'update', {
        'ad_storage': 'granted',
        'analytics_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
    });
    window.dataLayer.push({ event: 'consent_update_granted' });
    initializeGtm();
}

/**
 * Configures the main Google Analytics 4 tag with corrected and enhanced settings.
 * This should only be called AFTER consent has been granted.
 */
function initializeGtm() {
    if (typeof gtag !== 'function') return;
    const config = {
        'page_path': getCleanPagePath(),
        'transport_type': 'beacon',
        // Custom dimensions must be created in the GA4 Admin UI first.
        'custom_map': {
            'dimension1': 'saudi_user_city',
            'dimension2': 'saudi_service_interest'
        }
    };
    gtag('config', 'G-SZKTP4496K', config);
    console.log('[Analytics] GA4 Configured with:', config);
}


/**
 * =================================================================================
 * SECTION 2: UTILITY FUNCTIONS (Using centralized utils when available)
 * =================================================================================
 */

// Use centralized utilities with fallback
const debounce = (window.BrightAIUtils && window.BrightAIUtils.debounce) || function(func, wait) {
    let timeoutId;
    return function(...args) {
        const context = this;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(context, args), wait);
    };
};

const throttle = (window.BrightAIUtils && window.BrightAIUtils.throttle) || function(func, limit) {
    let inThrottle = false;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};


/**
 * =================================================================================
 * SECTION 3: CORE UI & FEATURE INITIALIZATION
 * =================================================================================
 */

/**
 * Shows a notification to the user if a new service worker is installed.
 */
function showUpdateNotification() {
    if (document.querySelector('.update-notification')) return;

    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.innerHTML = `
        <div class="update-content">
            <span>تحديث جديد متاح للموقع! نوصي بالتحديث للاستمتاع بأحدث الميزات والتحسينات.</span>
            <button id="update-now-btn" class="update-btn">تحديث الآن</button>
            <button id="dismiss-update-btn" class="dismiss-btn" aria-label="إغلاق إشعار التحديث">×</button>
        </div>
    `;
    document.body.appendChild(notification);

    document.getElementById('update-now-btn')?.addEventListener('click', () => {
        notification.remove();
        window.location.reload();
    });
    document.getElementById('dismiss-update-btn')?.addEventListener('click', () => notification.remove());

    setTimeout(() => notification.remove(), 15000);
}

/**
 * Initializes the Service Worker for PWA capabilities and offline functionality.
 */
function initServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('[SW] Service Worker registered successfully:', registration.scope);
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker?.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => console.error('[SW] Service Worker registration failed:', error));
        });
    } else {
        console.log('[SW] Service Workers not supported by this browser.');
    }
}

/**
 * Manages the main navigation bar, hamburger menu, and scroll behavior.
 */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.querySelector('.overlay');

    if (!navbar || !hamburger || !navLinks || !overlay) {
        console.warn('[Navbar] One or more essential navbar elements are missing.');
        return;
    }

    const toggleMenu = (open) => {
        const shouldOpen = typeof open === 'boolean' ? open : !navLinks.classList.contains('active');
        navLinks.classList.toggle('active', shouldOpen);
        hamburger.classList.toggle('active', shouldOpen);
        overlay.classList.toggle('active', shouldOpen);
        document.body.style.overflow = shouldOpen ? 'hidden' : '';
        hamburger.setAttribute('aria-expanded', String(shouldOpen));

        if (shouldOpen) {
            navLinks.querySelector('a[role="menuitem"]')?.focus();
        } else {
            hamburger.focus();
        }
    };

    hamburger.addEventListener('click', () => toggleMenu());
    overlay.addEventListener('click', () => toggleMenu(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    navLinks.querySelectorAll('a[role="menuitem"]').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleMenu(false);
            }
        });
    });

    let lastScrollTop = 0;
    const scrollThreshold = 50;
    const navbarHeight = navbar.offsetHeight;

    const handleScroll = () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        navbar.classList.toggle('scrolled', scrollTop > scrollThreshold);

        if (Math.abs(scrollTop - lastScrollTop) <= scrollThreshold && scrollTop > navbarHeight) return;

        if (scrollTop > lastScrollTop && scrollTop > navbarHeight && !navLinks.classList.contains('active')) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    };
    window.addEventListener('scroll', throttle(handleScroll, 100), { passive: true });
    handleScroll();
}

/**
 * Renders a particle animation on the hero canvas.
 */
function initHeroCanvas() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particlesArray;
    let animationFrameId;

    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
    };

    class Particle {
        constructor(x, y, directionX, directionY, size, color) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
            this.color = color;
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = 'rgba(100, 255, 218, 0.5)';
            ctx.fill();
        }
        update() {
            if (this.x > canvas.clientWidth || this.x < 0) this.directionX = -this.directionX;
            if (this.y > canvas.clientHeight || this.y < 0) this.directionY = -this.directionY;
            this.x += this.directionX;
            this.y += this.directionY;
            this.draw();
        }
    }

    function initParticles() {
        particlesArray = [];
        const numberOfParticles = (canvas.height * canvas.width) / 18000;
        for (let i = 0; i < numberOfParticles; i++) {
            const size = (Math.random() * 1.5) + 0.5;
            const x = (Math.random() * (canvas.clientWidth - size * 2));
            const y = (Math.random() * (canvas.clientHeight - size * 2));
            const directionX = (Math.random() * .4) - .2;
            const directionY = (Math.random() * .4) - .2;
            particlesArray.push(new Particle(x, y, directionX, directionY, size));
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
        particlesArray.forEach(p => p.update());
        connect();
        animationFrameId = requestAnimationFrame(animate);
    }

    function connect() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                const distance = ((particlesArray[a].x - particlesArray[b].x) ** 2) + ((particlesArray[a].y - particlesArray[b].y) ** 2);
                if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                    const opacity = 1 - (distance / 20000);
                    ctx.strokeStyle = `rgba(136, 146, 176, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    const setup = () => {
        cancelAnimationFrame(animationFrameId);
        setCanvasSize();
        initParticles();
        animate();
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setup();
        } else {
            cancelAnimationFrame(animationFrameId);
        }
    }, { threshold: 0.01 });

    observer.observe(canvas);
    window.addEventListener('resize', debounce(setup, 200));
}

/**
 * Initializes the FAQ accordion functionality with ARIA attributes.
 */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!question || !answer) return;

        question.addEventListener('click', () => {
            const isExpanded = question.getAttribute('aria-expanded') === 'true';

            // Close all other items for a cleaner accordion experience
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle the clicked item
            item.classList.toggle('active', !isExpanded);
            question.setAttribute('aria-expanded', !isExpanded);

            // GTM event for analytics
            if (!isExpanded) {
                window.dataLayer.push({
                    event: 'faq_interaction',
                    faq_question: question.textContent?.trim() || 'FAQ Question Opened'
                });
            }
        });
    });
}

/**
 * Handles validation and submission for all forms on the page.
 */
function initForms() {
    // Consultation Form
    const consultationForm = document.getElementById('consultationForm');
    if (consultationForm) {
        initConsultationForm(consultationForm);
    }

    // Newsletter Forms
    document.querySelectorAll('.newsletter-form, .newsletter-form-large').forEach(form => {
        initNewsletterForm(form);
    });
}

/**
 * Specific logic for the consultation form.
 * @param {HTMLFormElement} form
 */
function initConsultationForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    const statusEl = document.getElementById('form-status');

    const validateField = (field) => {
        let isValid = true;
        const errorEl = document.getElementById(`${field.id}-error`);
        field.classList.remove('error');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.style.display = 'none';
        }

        if (field.value.trim() === '') {
            isValid = false;
            if (errorEl) errorEl.textContent = 'هذا الحقل مطلوب.';
        } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
            isValid = false;
            if (errorEl) errorEl.textContent = 'الرجاء إدخال بريد إلكتروني صحيح.';
        } else if (field.type === 'tel' && !/^(05\d{8}|5\d{8}|\+9665\d{8}|009665\d{8})$/.test(field.value)) {
            isValid = false;
            if (errorEl) errorEl.textContent = 'الرجاء إدخال رقم هاتف سعودي صحيح.';
        } else if (field.hasAttribute('minlength') && field.value.length < parseInt(field.getAttribute('minlength'))) {
            isValid = false;
            if (errorEl) errorEl.textContent = `يجب أن لا تقل الرسالة عن ${field.getAttribute('minlength')} حروف.`;
        }

        if (!isValid) {
            field.classList.add('error');
            if (errorEl) errorEl.style.display = 'block';
        }
        return isValid;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        let isFormValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });

        if (isFormValid) {
            const submitButton = form.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الإرسال...';
            statusEl.textContent = '';
            statusEl.className = 'form-status-message';

            try {
                // Simulate API call. Replace with fetch() to your endpoint.
                await new Promise(resolve => setTimeout(resolve, 1500));

                // GTM event for conversion tracking
                window.dataLayer.push({
                    event: 'generate_lead',
                    form_name: 'Consultation Form',
                    form_location: 'Contact Section',
                    lead_type: 'Free AI Consultation'
                });

                statusEl.textContent = 'شكراً لك! تم إرسال طلب الاستشارة بنجاح.';
                statusEl.classList.add('active', 'success');
                form.reset();

            } catch (error) {
                console.error('Form submission error:', error);
                statusEl.textContent = 'عذراً، حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.';
                statusEl.classList.add('active', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                setTimeout(() => statusEl.classList.remove('active'), 5000);
            }
        }
    });
}

/**
 * Specific logic for newsletter forms.
 * @param {HTMLFormElement} form
 */
function initNewsletterForm(form) {
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        if (emailInput && emailInput.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value)) {

            // GTM event for analytics
            window.dataLayer.push({
                event: 'newsletter_signup',
                form_location: form.classList.contains('newsletter-form-large') ? 'Main Newsletter Section' : 'Footer'
            });

            // Replace alert with a less intrusive notification if desired
            alert('شكراً لاشتراكك في النشرة البريدية!');
            form.reset();
        } else {
            alert('الرجاء إدخال بريد إلكتروني صحيح.');
            emailInput?.focus();
        }
    });
}

/**
 * Initializes scroll-triggered animations and analytics events for key sections.
 */
function initScrollAndAnalytics() {
    const animatedElements = document.querySelectorAll('.service-card, .tourism-feature-card, .case-card, .feature-item, .tech-card, .tech-detail-card, .case-study-card');
    const servicesSection = document.getElementById('services');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');

                    if (entry.target.id === 'services' && !entry.target.dataset.analyticsFired) {
                        entry.target.dataset.analyticsFired = 'true'; // Fire only once
                        const items = Array.from(entry.target.querySelectorAll('.service-card h3')).map((h3, index) => ({
                            item_id: h3.closest('.service-card').querySelector('a.service-link')?.dataset.gtmItemId || `service_${index + 1}`,
                            item_name: h3.textContent.trim(),
                            item_category: 'AI Services',
                            item_list_name: 'Main Services Section',
                            index: index + 1
                        }));

                        window.dataLayer.push({
                            event: 'view_item_list',
                            ecommerce: {
                                item_list_id: 'main_services',
                                item_list_name: 'Main Services Section',
                                items: items
                            }
                        });
                        console.log('[Analytics] Pushed "view_item_list" for Services Section.');
                    }

                    obs.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -50px 0px', threshold: 0.1 });

        animatedElements.forEach(el => {
            el.classList.add('fade-in');
            observer.observe(el);
        });
        if (servicesSection) observer.observe(servicesSection);

    } else {
        // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('visible'));
    }
}

/**
 * Initializes the "Back to Top" button functionality.
 */
function initBackToTop() {
    const backToTopButton = document.querySelector('.back-to-top');
    if (!backToTopButton) return;

    const toggleVisibility = () => {
        const isVisible = window.pageYOffset > 300;
        backToTopButton.classList.toggle('visible', isVisible);
        backToTopButton.setAttribute('aria-hidden', String(!isVisible));
    };

    window.addEventListener('scroll', throttle(toggleVisibility, 150), { passive: true });
    toggleVisibility(); // Initial check

    backToTopButton.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
// قسم استشارات الذكاء الاصطناعي - أنيميشن الظهور
document.addEventListener("DOMContentLoaded", () => {
    const aiCards = document.querySelectorAll(".ai-card");

    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("show");
                }
            });
        },
        { threshold: 0.2 }
    );

    aiCards.forEach(card => {
        observer.observe(card);
    });
});
/**
 * Initializes smooth scrolling for all on-page anchor links.
 * Fixed: Only handles internal anchor links, not external page links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            const href = this.getAttribute('href');
            // Only handle internal anchor links (e.g., #section-id)
            // Skip if href is just "#" or empty
            if (href && href.length > 1 && href.startsWith('#')) {
                try {
                    const targetElement = document.querySelector(href);
                    if (targetElement) {
                        event.preventDefault();
                        const navbarHeight = document.querySelector('.navbar, .unified-nav')?.offsetHeight || 70;
                        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                        const offsetPosition = elementPosition - navbarHeight - 20;

                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                    // If targetElement not found, let the browser handle it normally
                } catch (e) {
                    // Invalid selector, let browser handle normally
                    console.warn('[SmoothScroll] Invalid selector:', href);
                }
            }
            // For href="#" or invalid selectors, don't prevent default - let browser handle
        });
    });
}

/**
 * Initializes a generic click listener for analytics using data attributes.
 */
function initGenericClickTracker() {
    document.body.addEventListener('click', (event) => {
        const trackableElement = event.target.closest('[data-gtm-event]');
        if (trackableElement) {
            const { gtmEvent, gtmContentType, gtmContentName, gtmItemId } = trackableElement.dataset;
            if (gtmEvent) {
                const eventData = {
                    event: gtmEvent,
                    content_type: gtmContentType,
                    content_name: gtmContentName,
                    item_id: gtmItemId,
                    // Placeholder for dynamic Saudi-specific data if available
                    saudi_user_city: 'Riyadh',
                    saudi_service_interest: gtmContentName || 'Not Specified'
                };
                window.dataLayer.push(eventData);
                console.log('[Analytics] Pushed generic click event:', eventData);
            }
        }
    });
}


/**
 * =================================================================================
 * SECTION 3.5: TESTIMONIALS CAROUSEL (Requirements 17.1, 17.2, 17.3, 17.4, 17.5)
 * =================================================================================
 */

/**
 * Initializes the testimonials carousel with navigation and auto-play functionality.
 * Features:
 * - Glassmorphism card styling
 * - Arabic quotes with client info
 * - 5-star ratings
 * - Carousel/slider functionality with navigation buttons and dots
 * - Auto-play with pause on hover
 * - Keyboard navigation support
 * - Touch/swipe support for mobile
 */
function initTestimonialsCarousel() {
    const carousel = document.querySelector('.testimonials-carousel');
    const track = document.getElementById('testimonials-track');
    const cards = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.querySelector('.testimonials-prev');
    const nextBtn = document.querySelector('.testimonials-next');
    const dots = document.querySelectorAll('.testimonials-dot');

    if (!carousel || !track || cards.length === 0) {
        console.log('[Testimonials] Carousel elements not found, skipping initialization.');
        return;
    }

    let currentIndex = 0;
    let autoPlayInterval = null;
    const autoPlayDelay = 5000; // 5 seconds
    let isAutoPlaying = true;
    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Gets the number of visible cards based on viewport width
     * @returns {number} Number of visible cards
     */
    function getVisibleCards() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth >= 1200) return 3;
        if (viewportWidth >= 768) return 2;
        return 1;
    }

    /**
     * Gets the maximum index based on visible cards
     * @returns {number} Maximum index
     */
    function getMaxIndex() {
        const visibleCards = getVisibleCards();
        return Math.max(0, cards.length - visibleCards);
    }

    /**
     * Updates the carousel position
     * @param {boolean} animate - Whether to animate the transition
     */
    function updateCarousel(animate = true) {
        const cardWidth = cards[0].offsetWidth;
        const gap = 32; // 2rem gap
        const offset = currentIndex * (cardWidth + gap);

        track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
        track.style.transform = `translateX(${offset}px)`; // RTL: positive offset moves right

        // Update dots
        dots.forEach((dot, index) => {
            const isActive = index === currentIndex;
            dot.classList.toggle('active', isActive);
            dot.setAttribute('aria-selected', String(isActive));
        });

        // Update navigation buttons state
        const maxIndex = getMaxIndex();
        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex >= maxIndex;
        }

        // Update ARIA labels for cards
        cards.forEach((card, index) => {
            const isVisible = index >= currentIndex && index < currentIndex + getVisibleCards();
            card.setAttribute('aria-hidden', String(!isVisible));
        });
    }

    /**
     * Navigates to a specific slide
     * @param {number} index - Target slide index
     */
    function goToSlide(index) {
        const maxIndex = getMaxIndex();
        currentIndex = Math.max(0, Math.min(index, maxIndex));
        updateCarousel();
    }

    /**
     * Navigates to the next slide
     */
    function nextSlide() {
        const maxIndex = getMaxIndex();
        if (currentIndex < maxIndex) {
            currentIndex++;
        } else {
            currentIndex = 0; // Loop back to start
        }
        updateCarousel();
    }

    /**
     * Navigates to the previous slide
     */
    function prevSlide() {
        if (currentIndex > 0) {
            currentIndex--;
        } else {
            currentIndex = getMaxIndex(); // Loop to end
        }
        updateCarousel();
    }

    /**
     * Starts auto-play
     */
    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        if (isAutoPlaying) {
            autoPlayInterval = setInterval(nextSlide, autoPlayDelay);
        }
    }

    /**
     * Stops auto-play
     */
    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
    }

    /**
     * Handles touch start event
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoPlay();
    }

    /**
     * Handles touch end event
     * @param {TouchEvent} e - Touch event
     */
    function handleTouchEnd(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoPlay();
    }

    /**
     * Handles swipe gesture
     */
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        // RTL: swipe left (negative diff) goes to previous, swipe right (positive diff) goes to next
        if (Math.abs(diff) > swipeThreshold) {
            if (diff < 0) {
                prevSlide();
            } else {
                nextSlide();
            }
        }
    }

    // Event Listeners

    // Navigation buttons
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }

    // Dots navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            stopAutoPlay();
            startAutoPlay();
        });
    });

    // Keyboard navigation
    carousel.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowLeft':
                // RTL: ArrowLeft goes to next
                nextSlide();
                stopAutoPlay();
                startAutoPlay();
                e.preventDefault();
                break;
            case 'ArrowRight':
                // RTL: ArrowRight goes to previous
                prevSlide();
                stopAutoPlay();
                startAutoPlay();
                e.preventDefault();
                break;
        }
    });

    // Touch events for mobile swipe
    track.addEventListener('touchstart', handleTouchStart, { passive: true });
    track.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Pause auto-play on hover
    carousel.addEventListener('mouseenter', stopAutoPlay);
    carousel.addEventListener('mouseleave', startAutoPlay);

    // Pause auto-play on focus within
    carousel.addEventListener('focusin', stopAutoPlay);
    carousel.addEventListener('focusout', startAutoPlay);

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        // Ensure current index is valid after resize
        const maxIndex = getMaxIndex();
        if (currentIndex > maxIndex) {
            currentIndex = maxIndex;
        }
        updateCarousel(false);
    }, 200));

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        isAutoPlaying = false;
    }

    prefersReducedMotion.addEventListener('change', (e) => {
        isAutoPlaying = !e.matches;
        if (isAutoPlaying) {
            startAutoPlay();
        } else {
            stopAutoPlay();
        }
    });

    // Initialize
    updateCarousel(false);
    startAutoPlay();

    // GTM event for testimonials view
    const testimonialsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.analyticsFired) {
                entry.target.dataset.analyticsFired = 'true';
                window.dataLayer.push({
                    event: 'testimonials_view',
                    testimonials_count: cards.length
                });
                console.log('[Analytics] Pushed "testimonials_view" event.');
            }
        });
    }, { threshold: 0.3 });

    testimonialsObserver.observe(carousel);

    console.log('[Testimonials] Carousel initialized with', cards.length, 'testimonials.');
}

/**
 * =================================================================================
 * SECTION 4: MAIN EXECUTION BLOCK (DOM Ready)
 * =================================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        initServiceWorker();
        initNavbar();
        initHeroCanvas();
        initFAQ();
        initForms();
        initScrollAndAnalytics();
        initBackToTop();
        initSmoothScroll();
        initGenericClickTracker();
        initTestimonialsCarousel();

        // IMPORTANT: This is a simulation for demonstration.
        // In a real-world scenario, this should be triggered by your
        // Consent Management Platform (CMP) after the user makes a choice.
        setTimeout(initializeAnalyticsOnConsent, 1500);

        console.log('[BrightAI] All components initialized successfully.');
    } catch (error) {
        console.error("Error during main script initialization:", error);
    }
});

/**
 * =================================================================================
 * SECTION 5: GLOBAL LISTENERS (Window Load)
 * =================================================================================
 */
window.addEventListener('load', () => {
    // Send performance timing data to analytics after everything has loaded.
    setTimeout(() => {
        if (performance && typeof performance.getEntriesByType === 'function') {
            const navTiming = performance.getEntriesByType('navigation')[0];
            if (navTiming) {
                const fullPageLoadTime = Math.round(navTiming.loadEventEnd);
                if (fullPageLoadTime > 0) {
                    window.dataLayer.push({
                        event: 'performance_timing',
                        metric_name: 'full_page_load_time',
                        metric_value: fullPageLoadTime
                    });
                }
            }
        }
    }, 0);
});


/**
 * =================================================================================
 * SECTION 6: SUPPORT POPUP (GLOBAL FUNCTIONS for onclick)
 * =================================================================================
 */
// UX Enhancement: Store the element that triggered the popup to return focus later.
let triggerElement = null;

function openSupportPopup() {
    const overlay = document.getElementById('supportPopupOverlay');
    if (overlay) {
        triggerElement = document.activeElement; // Store the currently focused element
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        // UX Enhancement: Move focus to the close button for accessibility.
        overlay.querySelector('.support-popup-close')?.focus();
    }
}

function closeSupportPopup() {
    const overlay = document.getElementById('supportPopupOverlay');
    if (overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        // UX Enhancement: Return focus to the element that opened the popup.
        triggerElement?.focus();
    }
}

// Additional event listeners for better UX for the support popup
document.addEventListener('DOMContentLoaded', () => {
    const supportPopupOverlay = document.getElementById('supportPopupOverlay');
    const supportPopupModal = document.querySelector('.support-popup-modal');

    if (supportPopupOverlay && supportPopupModal) {
        // Close on clicking the overlay itself
        supportPopupOverlay.addEventListener('click', function (e) {
            if (e.target === this) closeSupportPopup();
        });

        // UX/Accessibility Enhancement: Trap focus within the modal.
        const focusableElementsString = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        let focusableElements;
        let firstFocusableElement;
        let lastFocusableElement;

        // Keydown event listener for Escape key and focus trapping
        document.addEventListener('keydown', function (e) {
            if (supportPopupOverlay.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeSupportPopup();
                }

                if (e.key === 'Tab') {
                    // Update focusable elements each time, in case content changes
                    focusableElements = [...supportPopupModal.querySelectorAll(focusableElementsString)];
                    firstFocusableElement = focusableElements[0];
                    lastFocusableElement = focusableElements[focusableElements.length - 1];

                    if (e.shiftKey) { // if shift + tab
                        if (document.activeElement === firstFocusableElement) {
                            lastFocusableElement.focus();
                            e.preventDefault();
                        }
                    } else { // if tab
                        if (document.activeElement === lastFocusableElement) {
                            firstFocusableElement.focus();
                            e.preventDefault();
                        }
                    }
                }
            }
        });
    }
});
