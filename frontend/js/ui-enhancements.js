/**
 * Bright AI - UI Enhancements
 * Adds Scroll Progress, Back-to-Top, and Micro-interactions.
 */

(function () {
    'use strict';

    // 1. INJECT HTML ELEMENTS
    function injectElements() {
        // Scroll Progress Bar
        if (!document.querySelector('.scroll-progress-container')) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'scroll-progress-container';
            progressContainer.innerHTML = '<div class="scroll-progress-bar" id="scrollProgressBar"></div>';
            document.body.prepend(progressContainer);
        }

        // Back to Top Button
        if (!document.querySelector('.back-to-top-btn')) {
            const backBtn = document.createElement('button');
            backBtn.className = 'back-to-top-btn';
            backBtn.id = 'backToTop';
            backBtn.setAttribute('aria-label', 'العودة للأعلى');
            backBtn.innerHTML = '<iconify-icon icon="lucide:arrow-up" width="24"></iconify-icon>';
            document.body.appendChild(backBtn);

            backBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // 2. SCROLL LOGIC
    function handleScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        // Update Progress Bar
        const pBar = document.getElementById('scrollProgressBar');
        if (pBar) {
            pBar.style.width = scrollPercent + '%';
        }

        // Update Back to Top Visibility
        const backBtn = document.getElementById('backToTop');
        if (backBtn) {
            if (scrollTop > 500) {
                backBtn.classList.add('visible');
            } else {
                backBtn.classList.remove('visible');
            }
        }
    }

    // 3. FORM REAL-TIME VALIDATION
    function setupFormValidation() {
        const inputs = document.querySelectorAll('input[type="email"]');

        inputs.forEach(input => {
            // Ensure input has a relative parent or wrapper for positioning
            if (input.parentElement) {
                input.parentElement.classList.add('input-group');

                // Add Checkmark Icon if not exists
                if (!input.parentElement.querySelector('.validation-icon')) {
                    const icon = document.createElement('iconify-icon');
                    icon.setAttribute('icon', 'lucide:check-circle');
                    icon.setAttribute('width', '20');
                    icon.className = 'validation-icon';
                    input.parentElement.appendChild(icon);
                }
            }

            input.addEventListener('input', function () {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(this.value)) {
                    this.classList.add('input-valid');
                    this.style.borderColor = '#10b981'; // Green
                } else {
                    this.classList.remove('input-valid');
                    this.style.borderColor = ''; // Reset
                }
            });
        });
    }

    // 4. MICRO-INTERACTIONS & INIT
    function init() {
        injectElements();
        setupFormValidation();

        // Throttle Scroll Event
        let ticking = false;
        window.addEventListener('scroll', function () {
            if (!ticking) {
                window.requestAnimationFrame(function () {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Add Pulse to Primary Buttons (Hero CTA)
        const primaryBtns = document.querySelectorAll('.btn-primary');
        primaryBtns.forEach(btn => btn.classList.add('btn-pulse'));

        // Mouse Tracking for Glass Cards (Premium Effect) - Desktop Only
        if (window.matchMedia('(pointer: fine)').matches) {
            document.addEventListener('mousemove', e => {
                const cards = document.querySelectorAll('.glass-card');
                cards.forEach(card => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty('--mouse-x', `${x}px`);
                    card.style.setProperty('--mouse-y', `${y}px`);
                });
            });
        }
    }

    // Run on Load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
