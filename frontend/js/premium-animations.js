/* =====================================
   BRIGHT AI - PREMIUM ANIMATIONS JS
   World-Class Interactive Effects
   ===================================== */

(function () {
    'use strict';

    // =========================================
    // 1. CUSTOM CURSOR
    // =========================================
    class CustomCursor {
        constructor() {
            this.cursor = null;
            this.cursorDot = null;
            this.init();
        }

        init() {
            // Create cursor elements
            this.cursor = document.createElement('div');
            this.cursor.className = 'custom-cursor';

            this.cursorDot = document.createElement('div');
            this.cursorDot.className = 'custom-cursor-dot';

            document.body.appendChild(this.cursor);
            document.body.appendChild(this.cursorDot);

            // Track mouse movement
            document.addEventListener('mousemove', (e) => this.moveCursor(e));

            // Hover effects
            const interactiveElements = document.querySelectorAll('a, button, input, textarea, .clickable, .interactive');
            interactiveElements.forEach(el => {
                el.addEventListener('mouseenter', () => this.cursor.classList.add('hover'));
                el.addEventListener('mouseleave', () => this.cursor.classList.remove('hover'));
            });

            // Hide on mobile
            if (window.matchMedia('(max-width: 768px)').matches) {
                this.cursor.style.display = 'none';
                this.cursorDot.style.display = 'none';
            }
        }

        moveCursor(e) {
            requestAnimationFrame(() => {
                this.cursor.style.left = e.clientX + 'px';
                this.cursor.style.top = e.clientY + 'px';
                this.cursorDot.style.left = e.clientX + 'px';
                this.cursorDot.style.top = e.clientY + 'px';
            });
        }
    }

    // =========================================
    // 2. ANIMATED NUMBER COUNTERS
    // =========================================
    class AnimatedCounter {
        constructor(element, target, duration = 2000) {
            this.element = element;
            this.target = parseFloat(target);
            this.duration = duration;
            this.hasAnimated = false;
        }

        animate() {
            if (this.hasAnimated) return;
            this.hasAnimated = true;

            const startTime = performance.now();
            const startValue = 0;
            const isDecimal = this.target % 1 !== 0;
            const suffix = this.element.dataset.suffix || '';
            const prefix = this.element.dataset.prefix || '';

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / this.duration, 1);

                // Easing function (easeOutExpo)
                const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                const currentValue = startValue + (this.target - startValue) * easeProgress;

                if (isDecimal) {
                    this.element.textContent = prefix + currentValue.toFixed(1) + suffix;
                } else {
                    this.element.textContent = prefix + Math.floor(currentValue) + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    this.element.textContent = prefix + this.target + suffix;
                }
            };

            requestAnimationFrame(updateCounter);
        }
    }

    // =========================================
    // 3. SCROLL REVEAL ANIMATIONS
    // =========================================
    class ScrollReveal {
        constructor() {
            this.elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
            this.init();
        }

        init() {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('active');

                        // Trigger counter animation if present
                        const counter = entry.target.querySelector('[data-counter]');
                        if (counter && counter._counterInstance) {
                            counter._counterInstance.animate();
                        }
                    }
                });
            }, observerOptions);

            this.elements.forEach(el => observer.observe(el));
        }
    }

    // =========================================
    // 4. 3D TILT EFFECT
    // =========================================
    class TiltEffect {
        constructor(element, options = {}) {
            this.element = element;
            this.options = {
                max: options.max || 15,
                speed: options.speed || 400,
                glare: options.glare || true,
                ...options
            };
            this.init();
        }

        init() {
            this.element.style.transformStyle = 'preserve-3d';

            this.element.addEventListener('mousemove', (e) => this.onMouseMove(e));
            this.element.addEventListener('mouseleave', () => this.onMouseLeave());

            if (this.options.glare) {
                this.createGlare();
            }
        }

        onMouseMove(e) {
            const rect = this.element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / centerY * -this.options.max;
            const rotateY = (x - centerX) / centerX * this.options.max;

            this.element.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            if (this.glareElement) {
                const glareX = (x / rect.width) * 100;
                const glareY = (y / rect.height) * 100;
                this.glareElement.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2), transparent 60%)`;
            }

            // Update CSS custom properties for glow effect
            this.element.style.setProperty('--mouse-x', x + 'px');
            this.element.style.setProperty('--mouse-y', y + 'px');
        }

        onMouseLeave() {
            this.element.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            if (this.glareElement) {
                this.glareElement.style.background = 'transparent';
            }
        }

        createGlare() {
            this.glareElement = document.createElement('div');
            this.glareElement.style.cssText = `
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        transition: background 0.2s ease;
      `;
            this.element.style.position = 'relative';
            this.element.style.overflow = 'hidden';
            this.element.appendChild(this.glareElement);
        }
    }

    // =========================================
    // 5. TYPEWRITER EFFECT
    // =========================================
    class TypeWriter {
        constructor(element, texts, options = {}) {
            this.element = element;
            this.texts = texts;
            this.options = {
                typeSpeed: options.typeSpeed || 100,
                deleteSpeed: options.deleteSpeed || 50,
                pauseDelay: options.pauseDelay || 2000,
                loop: options.loop !== false,
                cursor: options.cursor !== false,
                ...options
            };
            this.textIndex = 0;
            this.charIndex = 0;
            this.isDeleting = false;

            if (this.options.cursor) {
                this.element.classList.add('typewriter');
            }

            this.type();
        }

        type() {
            const currentText = this.texts[ this.textIndex ];

            if (this.isDeleting) {
                this.element.textContent = currentText.substring(0, this.charIndex - 1);
                this.charIndex--;
            } else {
                this.element.textContent = currentText.substring(0, this.charIndex + 1);
                this.charIndex++;
            }

            let typingSpeed = this.isDeleting ? this.options.deleteSpeed : this.options.typeSpeed;

            if (!this.isDeleting && this.charIndex === currentText.length) {
                typingSpeed = this.options.pauseDelay;
                this.isDeleting = true;
            } else if (this.isDeleting && this.charIndex === 0) {
                this.isDeleting = false;
                this.textIndex = (this.textIndex + 1) % this.texts.length;
                typingSpeed = 500;
            }

            if (this.options.loop || this.textIndex < this.texts.length - 1 || !this.isDeleting || this.charIndex > 0) {
                setTimeout(() => this.type(), typingSpeed);
            }
        }
    }

    // =========================================
    // 6. PARALLAX SCROLLING
    // =========================================
    class ParallaxScroll {
        constructor() {
            this.elements = document.querySelectorAll('[data-parallax]');
            this.init();
        }

        init() {
            window.addEventListener('scroll', () => this.onScroll(), { passive: true });
            this.onScroll(); // Initial call
        }

        onScroll() {
            const scrollY = window.pageYOffset;

            this.elements.forEach(element => {
                const speed = parseFloat(element.dataset.parallax) || 0.5;
                const offset = scrollY * speed;
                element.style.transform = `translateY(${offset}px)`;
            });
        }
    }

    // =========================================
    // 7. SMOOTH SCROLL PROGRESS
    // =========================================
    class ScrollProgress {
        constructor() {
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'scroll-progress';
            this.progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
        z-index: 99999;
        transition: width 0.1s ease;
      `;
            document.body.appendChild(this.progressBar);

            window.addEventListener('scroll', () => this.updateProgress(), { passive: true });
        }

        updateProgress() {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (window.pageYOffset / scrollHeight) * 100;
            this.progressBar.style.width = progress + '%';
        }
    }

    // =========================================
    // 8. MAGNETIC BUTTONS
    // =========================================
    class MagneticButton {
        constructor(element) {
            this.element = element;
            this.boundingRect = null;
            this.init();
        }

        init() {
            this.element.addEventListener('mouseenter', () => {
                this.boundingRect = this.element.getBoundingClientRect();
            });

            this.element.addEventListener('mousemove', (e) => {
                if (!this.boundingRect) return;

                const x = e.clientX - this.boundingRect.left - this.boundingRect.width / 2;
                const y = e.clientY - this.boundingRect.top - this.boundingRect.height / 2;

                this.element.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            this.element.addEventListener('mouseleave', () => {
                this.element.style.transform = 'translate(0, 0)';
                this.boundingRect = null;
            });
        }
    }

    // =========================================
    // 9. LOADING SCREEN
    // =========================================
    class LoadingScreen {
        constructor() {
            this.loader = document.querySelector('.loader-container');
            if (!this.loader) {
                this.createLoader();
            }
            this.init();
        }

        createLoader() {
            this.loader = document.createElement('div');
            this.loader.className = 'loader-container';
            this.loader.innerHTML = `
        <div class="loader-content" style="text-align: center;">
          <div class="loader-spinner"></div>
          <p style="color: #94a3b8; margin-top: 20px; font-size: 14px;">جاري التحميل...</p>
        </div>
      `;
            document.body.appendChild(this.loader);
        }

        init() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.loader.classList.add('hidden');
                }, 500);
            });
        }
    }

    // =========================================
    // 10. FLOATING ELEMENTS ANIMATION
    // =========================================
    class FloatingElements {
        constructor(container, count = 10) {
            this.container = container;
            this.count = count;
            this.init();
        }

        init() {
            for (let i = 0; i < this.count; i++) {
                const element = document.createElement('div');
                element.className = 'floating-element';
                element.style.cssText = `
          position: absolute;
          width: ${Math.random() * 10 + 5}px;
          height: ${Math.random() * 10 + 5}px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.6), transparent);
          border-radius: 50%;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: floatingElement ${Math.random() * 10 + 10}s ease-in-out infinite;
          animation-delay: ${Math.random() * 5}s;
          pointer-events: none;
        `;
                this.container.appendChild(element);
            }

            // Add keyframes if not exists
            if (!document.querySelector('#floating-keyframes')) {
                const style = document.createElement('style');
                style.id = 'floating-keyframes';
                style.textContent = `
          @keyframes floatingElement {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.6; }
            25% { transform: translate(50px, -50px) rotate(90deg); opacity: 1; }
            50% { transform: translate(-30px, 30px) rotate(180deg); opacity: 0.8; }
            75% { transform: translate(30px, 50px) rotate(270deg); opacity: 0.9; }
          }
        `;
                document.head.appendChild(style);
            }
        }
    }

    // =========================================
    // 11. CARD HOVER GLOW TRACKER
    // =========================================
    class CardGlowTracker {
        constructor() {
            this.cards = document.querySelectorAll('.card-hover-glow, .glass-card, .service-card');
            this.init();
        }

        init() {
            this.cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    card.style.setProperty('--mouse-x', x + 'px');
                    card.style.setProperty('--mouse-y', y + 'px');
                });
            });
        }
    }

    // =========================================
    // 12. TIMELINE ANIMATION
    // =========================================
    class TimelineAnimation {
        constructor() {
            this.items = document.querySelectorAll('.timeline-item');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('active');
                        }, index * 200);
                    }
                });
            }, { threshold: 0.3 });

            this.items.forEach(item => observer.observe(item));
        }
    }

    // =========================================
    // 13. TESTIMONIAL STARS ANIMATION
    // =========================================
    class StarsAnimation {
        constructor() {
            this.containers = document.querySelectorAll('.testimonial-stars');
            this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.querySelectorAll('.star').forEach((star, i) => {
                            star.style.animationDelay = `${i * 0.1}s`;
                            star.style.animationPlayState = 'running';
                        });
                    }
                });
            }, { threshold: 0.5 });

            this.containers.forEach(container => observer.observe(container));
        }
    }

    // =========================================
    // INITIALIZATION
    // =========================================
    document.addEventListener('DOMContentLoaded', () => {

        // Initialize Testimonials Swiper
        const testimonialSwiper = new Swiper('.testimonials-slider', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                },
            }
        });
        // Initialize custom cursor (optional - may be too heavy)
        // new CustomCursor();

        // Initialize scroll reveal
        new ScrollReveal();

        // Initialize parallax
        new ParallaxScroll();

        // Initialize scroll progress
        new ScrollProgress();

        // Initialize card glow tracker
        new CardGlowTracker();

        // Initialize timeline animation
        new TimelineAnimation();

        // Initialize stars animation
        new StarsAnimation();

        // Initialize tilt effects on cards
        document.querySelectorAll('.tilt-card, [data-tilt]').forEach(el => {
            new TiltEffect(el);
        });

        // Initialize magnetic buttons
        document.querySelectorAll('.btn-magnetic, [data-magnetic]').forEach(el => {
            new MagneticButton(el);
        });

        // Initialize counters
        document.querySelectorAll('[data-counter]').forEach(el => {
            const target = el.dataset.counter;
            el._counterInstance = new AnimatedCounter(el, target);
        });

        // Initialize typewriter if element exists
        const typewriterElement = document.querySelector('[data-typewriter]');
        if (typewriterElement) {
            const texts = JSON.parse(typewriterElement.dataset.typewriter);
            new TypeWriter(typewriterElement, texts);
        }

        // Add floating elements to hero section
        const heroSection = document.querySelector('.hero-section, header');
        if (heroSection) {
            const floatingContainer = document.createElement('div');
            floatingContainer.style.cssText = 'position: absolute; inset: 0; overflow: hidden; pointer-events: none;';
            heroSection.style.position = 'relative';
            heroSection.appendChild(floatingContainer);
            new FloatingElements(floatingContainer, 15);
        }

        console.log('🚀 BrightAI Premium Animations Initialized');
    });

    // Expose classes globally if needed
    window.BrightAI = {
        TypeWriter,
        AnimatedCounter,
        TiltEffect,
        MagneticButton,
        FloatingElements,
        ScrollReveal,
        CustomCursor
    };

})();
