/**
 * BRIGHT AI - MAIN BUNDLE JS
 * High-Performance, Mobile-Optimized JavaScript Bundle
 * Lighthouse 100/100 Target | IntersectionObserver Based
 */

(function () {
    'use strict';

    // ============================================
    // PERFORMANCE DETECTION
    // ============================================
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isLowPower = navigator.connection && (
        navigator.connection.saveData ||
        navigator.connection.effectiveType === '2g' ||
        navigator.connection.effectiveType === 'slow-2g'
    );
    const skipHeavyAnimations = isMobile || isLowPower || prefersReducedMotion;

    // ============================================
    // NEURAL CANVAS - Lightweight Particle Network
    // ============================================
    class NeuralCanvas {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas || skipHeavyAnimations) return;

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.isRunning = false;
            this.rafId = null;
            this.mouseX = 0;
            this.mouseY = 0;

            this.init();
        }

        init() {
            this.resize();
            this.createParticles();
            this.setupObserver();
            this.setupMouseTracking();

            window.addEventListener('resize', () => {
                this.resize();
                this.createParticles();
            }, { passive: true });
        }

        resize() {
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
        }

        createParticles() {
            this.particles = [];
            const count = Math.min(50, Math.floor((this.canvas.width * this.canvas.height) / 20000));

            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: Math.random() * 2 + 1,
                    color: this.getRandomColor()
                });
            }
        }

        getRandomColor() {
            const colors = [
                'rgba(99, 102, 241, 0.6)',  // Indigo
                'rgba(139, 92, 246, 0.6)',  // Purple
                'rgba(0, 212, 255, 0.6)',   // Cyan
                'rgba(0, 255, 136, 0.4)'    // Green
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        setupObserver() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.start();
                    } else {
                        this.stop();
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(this.canvas);
        }

        setupMouseTracking() {
            if (isMobile) return;

            document.addEventListener('mousemove', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                this.mouseX = e.clientX - rect.left;
                this.mouseY = e.clientY - rect.top;
            }, { passive: true });
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
            }
        }

        animate() {
            if (!this.isRunning) return;

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Update and draw particles
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Bounce off edges
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                // Draw particle
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
            });

            // Draw connections
            this.drawConnections();

            this.rafId = requestAnimationFrame(() => this.animate());
        }

        drawConnections() {
            const maxDistance = 150;

            for (let i = 0; i < this.particles.length; i++) {
                for (let j = i + 1; j < this.particles.length; j++) {
                    const dx = this.particles[i].x - this.particles[j].x;
                    const dy = this.particles[i].y - this.particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < maxDistance) {
                        const opacity = (1 - distance / maxDistance) * 0.3;
                        this.ctx.beginPath();
                        this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                        this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                        this.ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
                        this.ctx.lineWidth = 0.5;
                        this.ctx.stroke();
                    }
                }
            }
        }
    }

    // ============================================
    // 3D TILT EFFECT
    // ============================================
    class TiltEffect {
        constructor() {
            if (isMobile || prefersReducedMotion) return;
            this.init();
        }

        init() {
            const cards = document.querySelectorAll('.tilt-card, .glass-card');

            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => this.handleMove(e, card));
                card.addEventListener('mouseleave', (e) => this.handleLeave(e, card));
            });
        }

        handleMove(e, card) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        }

        handleLeave(e, card) {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        }
    }

    // ============================================
    // NAVIGATION
    // ============================================
    class Navigation {
        constructor() {
            this.nav = document.querySelector('.unified-nav');
            this.mobileToggle = document.querySelector('.mobile-toggle');
            this.mobileDrawer = document.querySelector('.mobile-menu-drawer');
            this.backdrop = document.querySelector('.backdrop-overlay');
            this.lastScrollY = 0;
            this.ticking = false;

            if (this.nav) this.init();
        }

        init() {
            this.setupStickyNav();
            this.setupMobileMenu();
            this.setupDropdowns();
            this.setupMobileDropdowns();
        }

        setupStickyNav() {
            window.addEventListener('scroll', () => {
                if (!this.ticking) {
                    requestAnimationFrame(() => {
                        const scrollY = window.scrollY;

                        // Background opacity
                        if (scrollY > 20) {
                            this.nav.style.background = 'rgba(2, 6, 23, 0.95)';
                            this.nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
                        } else {
                            this.nav.style.background = 'rgba(2, 6, 23, 0.85)';
                            this.nav.style.boxShadow = 'none';
                        }

                        // Hide on scroll down (optional)
                        // if (scrollY > this.lastScrollY && scrollY > 100) {
                        //     this.nav.classList.add('nav-hidden');
                        // } else {
                        //     this.nav.classList.remove('nav-hidden');
                        // }

                        this.lastScrollY = scrollY;
                        this.ticking = false;
                    });
                    this.ticking = true;
                }
            }, { passive: true });
        }

        setupMobileMenu() {
            if (!this.mobileToggle) return;

            this.mobileToggle.addEventListener('click', () => this.toggleMobileMenu());

            if (this.backdrop) {
                this.backdrop.addEventListener('click', () => this.toggleMobileMenu());
            }

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.mobileDrawer?.classList.contains('active')) {
                    this.toggleMobileMenu();
                }
            });
        }

        toggleMobileMenu() {
            const isExpanded = this.mobileToggle.getAttribute('aria-expanded') === 'true';

            this.mobileToggle.setAttribute('aria-expanded', !isExpanded);

            if (isExpanded) {
                this.mobileDrawer?.classList.remove('active');
                this.backdrop?.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                this.mobileDrawer?.classList.add('active');
                this.backdrop?.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        setupDropdowns() {
            const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"]');

            dropdownToggles.forEach(toggle => {
                const navItem = toggle.closest('.nav-item');
                const dropdown = toggle.nextElementSibling;

                if (!navItem || !dropdown) return;

                let closeTimer = null;

                const cancelClose = () => {
                    if (closeTimer) {
                        clearTimeout(closeTimer);
                        closeTimer = null;
                    }
                };

                const scheduleClose = () => {
                    closeTimer = setTimeout(() => {
                        if (toggle.getAttribute('aria-expanded') === 'true') {
                            toggle.setAttribute('aria-expanded', 'false');
                        }
                    }, 300);
                };

                navItem.addEventListener('mouseenter', () => {
                    if (window.innerWidth >= 1024) {
                        cancelClose();
                        toggle.setAttribute('aria-expanded', 'true');
                    }
                });

                navItem.addEventListener('mouseleave', () => {
                    if (window.innerWidth >= 1024) {
                        scheduleClose();
                    }
                });

                dropdown.addEventListener('mouseenter', cancelClose);
                dropdown.addEventListener('mouseleave', scheduleClose);

                toggle.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                        toggle.setAttribute('aria-expanded', !isExpanded);
                    }
                });
            });
        }

        setupMobileDropdowns() {
            const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');

            mobileDropdownToggles.forEach(toggle => {
                toggle.addEventListener('click', (e) => {
                    e.preventDefault();

                    const submenu = toggle.nextElementSibling;
                    const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

                    // Close other dropdowns
                    if (!isExpanded) {
                        mobileDropdownToggles.forEach(other => {
                            if (other !== toggle) {
                                other.setAttribute('aria-expanded', 'false');
                                const otherSub = other.nextElementSibling;
                                if (otherSub?.classList.contains('mobile-dropdown')) {
                                    otherSub.classList.remove('open');
                                }
                            }
                        });
                    }

                    toggle.setAttribute('aria-expanded', !isExpanded);
                    submenu?.classList.toggle('open');
                });
            });
        }
    }

    // ============================================
    // SEARCH MODAL
    // ============================================
    class SearchModal {
        constructor() {
            this.modal = document.querySelector('.search-modal');
            this.triggers = document.querySelectorAll('.search-trigger, .mobile-search-btn');
            this.input = this.modal?.querySelector('input');

            if (this.modal) this.init();
        }

        init() {
            this.triggers.forEach(trigger => {
                trigger.addEventListener('click', () => this.open());
            });

            // Keyboard shortcut (Cmd+K / Ctrl+K)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggle();
                }

                if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
                    this.close();
                }
            });

            // Close on backdrop click
            this.modal?.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }

        open() {
            this.modal?.classList.add('active');
            this.input?.focus();
            document.body.style.overflow = 'hidden';
        }

        close() {
            this.modal?.classList.remove('active');
            document.body.style.overflow = '';
        }

        toggle() {
            if (this.modal?.classList.contains('active')) {
                this.close();
            } else {
                this.open();
            }
        }
    }

    // ============================================
    // COUNTERS
    // ============================================
    class CounterAnimation {
        constructor() {
            this.counters = document.querySelectorAll('.counter, [data-target]');
            if (this.counters.length) this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateCounter(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            this.counters.forEach(counter => observer.observe(counter));
        }

        animateCounter(element) {
            const target = parseFloat(element.getAttribute('data-target') || element.textContent);
            const duration = 2000;
            const startTime = performance.now();
            const start = 0;

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out
                const easeOut = 1 - Math.pow(1 - progress, 4);
                const current = start + (target - start) * easeOut;

                if (target % 1 === 0) {
                    element.textContent = Math.floor(current).toLocaleString('ar-SA');
                } else {
                    element.textContent = current.toFixed(1);
                }

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            };

            requestAnimationFrame(update);
        }
    }

    // ============================================
    // CHAT WIDGET
    // ============================================
    class ChatWidget {
        constructor() {
            this.toggle = document.querySelector('.chat-widget-toggle');
            this.window = document.querySelector('.chat-window');
            this.closeBtn = document.querySelector('.chat-close');
            this.input = document.querySelector('.chat-input');
            this.sendBtn = document.querySelector('.chat-send');
            this.messagesContainer = document.querySelector('.chat-messages');

            if (this.toggle && this.window) this.init();
        }

        init() {
            this.toggle.addEventListener('click', () => this.toggleChat());
            this.closeBtn?.addEventListener('click', () => this.closeChat());
            this.sendBtn?.addEventListener('click', () => this.sendMessage());
            this.input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }

        toggleChat() {
            this.window.classList.toggle('active');
            if (this.window.classList.contains('active')) {
                this.input?.focus();
            }
        }

        closeChat() {
            this.window.classList.remove('active');
        }

        sendMessage() {
            const message = this.input?.value.trim();
            if (!message) return;

            // Add user message
            this.addMessage(message, 'user');
            this.input.value = '';

            // Auto reply (demo)
            setTimeout(() => {
                const replies = [
                    'شكراً لتواصلك! سيقوم فريقنا بالرد قريباً.',
                    'مرحباً! كيف يمكننا مساعدتك اليوم؟',
                    'نحن هنا لمساعدتك. يمكنك أيضاً التواصل معنا عبر واتساب.',
                    'ممتاز! سنتواصل معك في أقرب وقت.'
                ];
                const reply = replies[Math.floor(Math.random() * replies.length)];
                this.addMessage(reply, 'bot');
            }, 1000);
        }

        addMessage(text, type) {
            const msg = document.createElement('div');
            msg.className = `chat-message ${type}`;
            msg.textContent = text;
            this.messagesContainer?.appendChild(msg);
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }
    }

    // ============================================
    // TERMINAL TYPEWRITER
    // ============================================
    class TerminalTypewriter {
        constructor() {
            this.terminals = document.querySelectorAll('.terminal-code');
            if (this.terminals.length && !skipHeavyAnimations) this.init();
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.startTyping(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            this.terminals.forEach(terminal => observer.observe(terminal));
        }

        startTyping(terminal) {
            const lines = terminal.querySelectorAll('.terminal-line');
            lines.forEach((line, index) => {
                line.style.animationDelay = `${index * 0.3}s`;
            });
        }
    }

    // ============================================
    // TABS
    // ============================================
    class TabsController {
        constructor() {
            this.init();
        }

        init() {
            // Feature tabs for Interactive 3D section
            window.updateFeature = (featureKey, btn) => {
                const features = {
                    vision: { icon: 'lucide:scan-face', color: 'indigo', title: 'دقة التشخيص', value: '98.5%' },
                    predict: { icon: 'lucide:bar-chart-3', color: 'purple', title: 'دقة التنبؤ', value: '94.2%' },
                    hospital: { icon: 'lucide:activity-square', color: 'green', title: 'كفاءة العمليات', value: '87.8%' },
                    gemini: { icon: 'lucide:bot', color: 'gold', title: 'رضا المستخدم', value: '96.1%' }
                };

                const feature = features[featureKey];
                const container = document.getElementById('feature-content');

                if (!container || !feature) return;

                container.innerHTML = `
                    <iconify-icon icon="${feature.icon}" width="64" class="text-${feature.color}-400"></iconify-icon>
                    <div class="w-3/4 space-y-3">
                        <div class="h-2 bg-${feature.color}-500/20 rounded-full w-full overflow-hidden">
                            <div class="h-full bg-${feature.color}-500" style="width: ${feature.value}"></div>
                        </div>
                        <div class="flex justify-between text-xs text-${feature.color}-300">
                            <span>${feature.title}</span><span>${feature.value}</span>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-4 w-full mt-4">
                        <div class="h-24 bg-white/5 rounded-lg border border-white/5 animate-pulse"></div>
                        <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
                        <div class="h-24 bg-white/5 rounded-lg border border-white/5"></div>
                    </div>
                `;

                // Update active state
                document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
                btn?.classList.add('active');
            };
        }
    }

    // ============================================
    // FAQ ACCORDION
    // ============================================
    class FaqAccordion {
        constructor() {
            this.init();
        }

        init() {
            window.toggleFaq = (btn) => {
                if (!btn) return;

                const item = btn.closest('.faq-item');
                if (!item) return;

                const content = item.querySelector('.faq-content');
                const icon = item.querySelector('.faq-icon');
                const isOpen = content && !content.classList.contains('hidden');

                // Close all
                document.querySelectorAll('.faq-content').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('.faq-icon').forEach(el => el.style.transform = '');
                document.querySelectorAll('.faq-toggle').forEach(el => el.setAttribute('aria-expanded', 'false'));

                // Open clicked if was closed
                if (content && !isOpen) {
                    content.classList.remove('hidden');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                    btn.setAttribute('aria-expanded', 'true');
                }
            };

            window.switchFaqTab = (category, btn) => {
                document.querySelectorAll('.faq-category').forEach(el => {
                    el.classList.add('hidden');
                    el.classList.remove('block');
                });

                const selected = document.getElementById(`faq-${category}`);
                if (selected) {
                    selected.classList.remove('hidden');
                    selected.classList.add('block');
                }

                document.querySelectorAll('.faq-tab').forEach(el => {
                    el.classList.remove('active', 'border-gold-500/20', 'bg-gold-500/10', 'text-gold-400');
                    el.classList.add('border-white/5', 'bg-white/5', 'text-slate-400');
                });

                btn.classList.remove('border-white/5', 'bg-white/5', 'text-slate-400');
                btn.classList.add('active', 'border-gold-500/20', 'bg-gold-500/10', 'text-gold-400');
            };
        }
    }

    // ============================================
    // SCROLL ANIMATIONS
    // ============================================
    class ScrollAnimations {
        constructor() {
            if (skipHeavyAnimations) {
                this.disableAnimations();
            } else {
                this.init();
            }
        }

        init() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible', 'aos-animate');
                    }
                });
            }, { threshold: 0.1, rootMargin: '50px' });

            const elements = document.querySelectorAll(
                '.animate-on-scroll, [data-aos], .reveal, .reveal-left, .reveal-right, .reveal-scale'
            );

            elements.forEach(el => observer.observe(el));

            // Stagger containers
            const staggerContainers = document.querySelectorAll('.stagger-container');
            const staggerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate');
                        staggerObserver.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });

            staggerContainers.forEach(container => staggerObserver.observe(container));
        }

        disableAnimations() {
            document.querySelectorAll('.animate-on-scroll, [data-aos], .reveal').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
                el.style.transition = 'none';
            });
        }
    }

    // ============================================
    // MEDICAL ARCHIVE CANVAS
    // ============================================
    class MedicalArchiveCanvas {
        constructor() {
            this.canvas = document.getElementById('medical-archive-canvas');
            if (!this.canvas || skipHeavyAnimations) return;

            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.isRunning = false;

            this.init();
        }

        init() {
            this.resize();
            this.createParticles();

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.start();
                    } else {
                        this.stop();
                    }
                });
            }, { rootMargin: '100px', threshold: 0.01 });

            observer.observe(this.canvas);

            window.addEventListener('resize', () => {
                this.resize();
                this.createParticles();
            }, { passive: true });
        }

        resize() {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }

        createParticles() {
            this.particles = [];
            const count = Math.min(24, Math.floor((this.canvas.width * this.canvas.height) / 60000));

            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    z: Math.random() * 1000,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    vz: (Math.random() - 0.5) * 2,
                    radius: Math.random() * 2 + 1,
                    color: Math.random() > 0.5 ? '#06b6d4' : '#10b981'
                });
            }
        }

        start() {
            if (this.isRunning) return;
            this.isRunning = true;
            this.animate();
        }

        stop() {
            this.isRunning = false;
        }

        animate() {
            if (!this.isRunning) return;
            if (this.canvas.width === 0 || this.canvas.height === 0) {
                requestAnimationFrame(() => this.animate());
                return;
            }

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;

                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
                if (p.z < 0) { p.z = 0; p.vz *= -1; }
                if (p.z > 1000) { p.z = 1000; p.vz *= -1; }

                const scale = Math.max(0, (1000 - p.z) / 1000);
                const size = p.radius * scale;

                if (!Number.isFinite(size) || size <= 0) return;

                this.ctx.globalAlpha = Math.min(0.6, scale * 0.5);
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = p.color;
                this.ctx.fill();
                this.ctx.globalAlpha = 1;
            });

            requestAnimationFrame(() => this.animate());
        }
    }

    // ============================================
    // LAZY SECTIONS LOADER
    // ============================================
    class LazySections {
        constructor() {
            this.init();
        }

        init() {
            const placeholders = document.querySelectorAll('[data-lazy-section]');
            if (!placeholders.length) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadSection(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '200px', threshold: 0.01 });

            placeholders.forEach(el => observer.observe(el));
        }

        async loadSection(placeholder) {
            const url = placeholder.dataset.lazySection;
            if (!url) return;

            placeholder.classList.add('lazy-section-loading');

            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const html = await response.text();
                placeholder.innerHTML = html;
                placeholder.classList.remove('lazy-section-loading');
                placeholder.classList.add('lazy-section-loaded');

                // Re-init scripts in loaded content
                placeholder.querySelectorAll('script').forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr =>
                        newScript.setAttribute(attr.name, attr.value)
                    );
                    newScript.textContent = oldScript.textContent;
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });

                // Refresh AOS if available
                if (typeof AOS !== 'undefined') AOS.refresh();

            } catch (error) {
                console.error('[Lazy] Error loading section:', error);
                placeholder.innerHTML = '<div class="text-red-500 p-4 text-center">Error loading section</div>';
            }
        }
    }

    // ============================================
    // SMOOTH SCROLL
    // ============================================
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;

                    const target = document.querySelector(targetId);
                    if (!target) return;

                    // Close mobile menu if open
                    const mobileDrawer = document.querySelector('.mobile-menu-drawer');
                    const mobileToggle = document.querySelector('.mobile-toggle');
                    const backdrop = document.querySelector('.backdrop-overlay');

                    if (mobileDrawer?.classList.contains('active')) {
                        mobileDrawer.classList.remove('active');
                        backdrop?.classList.remove('active');
                        mobileToggle?.setAttribute('aria-expanded', 'false');
                        document.body.style.overflow = '';
                    }

                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                });
            });
        }
    }

    // ============================================
    // DYNAMIC YEAR
    // ============================================
    class DynamicYear {
        constructor() {
            const yearElements = document.querySelectorAll('.copyright-year');
            const year = new Date().getFullYear().toString();
            yearElements.forEach(el => el.textContent = year);
        }
    }

    // ============================================
    // RESOURCE LOADER
    // ============================================
    class ResourceLoader {
        constructor() {
            this.init();
        }

        init() {
            const loadDeferred = () => {
                const hasAos = document.querySelector('[data-aos]') !== null;
                const hasSwiper = document.querySelector('.swiper, .testimonials-slider') !== null;

                // Load AOS if needed
                if (hasAos && !skipHeavyAnimations) {
                    this.loadCSS('https://unpkg.com/aos@2.3.4/dist/aos.css');
                    this.loadScript('https://unpkg.com/aos@2.3.4/dist/aos.js', () => {
                        if (typeof AOS !== 'undefined') {
                            AOS.init({ duration: 800, once: true, offset: 100 });
                        }
                    });
                }

                // Load Swiper if needed
                if (hasSwiper) {
                    this.loadCSS('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.css');
                    this.loadScript('https://cdn.jsdelivr.net/npm/swiper@11/swiper-bundle.min.js', () => {
                        this.initSwipers();
                    });
                }

                // Load Iconify
                this.loadScript('https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js');
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    if ('requestIdleCallback' in window) {
                        requestIdleCallback(loadDeferred, { timeout: 1500 });
                    } else {
                        setTimeout(loadDeferred, 50);
                    }
                });
            } else {
                loadDeferred();
            }
        }

        loadCSS(href) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }

        loadScript(src, callback) {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            if (callback) script.onload = callback;
            document.body.appendChild(script);
        }

        initSwipers() {
            if (typeof Swiper === 'undefined') return;

            document.querySelectorAll('.testimonials-slider').forEach(el => {
                if (el.swiper) return;

                new Swiper(el, {
                    loop: true,
                    slidesPerView: 1,
                    spaceBetween: 24,
                    autoplay: { delay: 5000, disableOnInteraction: false },
                    pagination: {
                        el: el.querySelector('.swiper-pagination'),
                        clickable: true
                    },
                    breakpoints: {
                        768: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 }
                    }
                });
            });
        }
    }

    // ============================================
    // FULL CHAT WIDGET (HTML Version)
    // ============================================
    class FullChatWidget {
        constructor() {
            this.toggle = document.getElementById('chatToggle');
            this.widget = document.getElementById('chatWidget');
            this.overlay = document.getElementById('chatOverlay');
            this.minimizeBtn = document.getElementById('minimizeChat');
            this.input = document.getElementById('userInput');
            this.sendBtn = document.getElementById('sendButton');
            this.messages = document.getElementById('chatMessages');
            this.quickActions = document.querySelectorAll('.quick-action-btn');

            if (this.toggle && this.widget) this.init();
        }

        init() {
            // Toggle chat
            this.toggle.addEventListener('click', () => this.toggleChat());

            // Close on overlay click
            this.overlay?.addEventListener('click', () => this.closeChat());

            // Minimize button
            this.minimizeBtn?.addEventListener('click', () => this.closeChat());

            // Send button
            this.sendBtn?.addEventListener('click', () => this.sendMessage());

            // Enter key
            this.input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });

            // Enable/disable send button
            this.input?.addEventListener('input', () => {
                if (this.sendBtn) {
                    this.sendBtn.disabled = !this.input.value.trim();
                }
            });

            // Quick actions
            this.quickActions.forEach(btn => {
                btn.addEventListener('click', () => {
                    const message = btn.dataset.message;
                    if (message && this.input) {
                        this.input.value = message;
                        this.sendMessage();
                    }
                });
            });
        }

        toggleChat() {
            const isOpen = this.widget.classList.contains('active');

            if (isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        }

        openChat() {
            this.widget.classList.add('active');
            this.toggle.classList.add('active');
            this.overlay?.classList.add('active');
            this.input?.focus();

            // Hide badge
            const badge = this.toggle.querySelector('.badge');
            if (badge) badge.style.display = 'none';
        }

        closeChat() {
            this.widget.classList.remove('active');
            this.toggle.classList.remove('active');
            this.overlay?.classList.remove('active');
        }

        sendMessage() {
            const text = this.input?.value.trim();
            if (!text) return;

            // Add user message
            this.addMessage(text, 'user');
            this.input.value = '';
            if (this.sendBtn) this.sendBtn.disabled = true;

            // Add typing indicator
            this.showTyping();

            // Simulate AI response
            setTimeout(() => {
                this.hideTyping();
                const responses = [
                    'شكراً لتواصلك! مساعدك الذكي Yazeed AI جاهز لمساعدتك.',
                    'سأقوم بتحليل طلبك والرد عليك. كيف يمكنني مساعدتك أكثر؟',
                    'ممتاز! يمكنني مساعدتك في خدمات الذكاء الاصطناعي وتحليل البيانات.',
                    'لمزيد من المعلومات، يمكنك التواصل معنا عبر واتساب على الرقم: +966538229013'
                ];
                const response = responses[Math.floor(Math.random() * responses.length)];
                this.addMessage(response, 'bot');
            }, 1500);
        }

        addMessage(text, type) {
            const msgDiv = document.createElement('div');
            msgDiv.className = `message ${type}-message`;
            msgDiv.innerHTML = `
                <div class="message-content">
                    <p>${text}</p>
                    <span class="message-time">${new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            `;
            this.messages?.appendChild(msgDiv);
            this.messages.scrollTop = this.messages.scrollHeight;
        }

        showTyping() {
            const typing = document.createElement('div');
            typing.className = 'typing-indicator';
            typing.id = 'typingIndicator';
            typing.innerHTML = '<span></span><span></span><span></span>';
            this.messages?.appendChild(typing);
            this.messages.scrollTop = this.messages.scrollHeight;
        }

        hideTyping() {
            document.getElementById('typingIndicator')?.remove();
        }
    }

    // ============================================
    // FULL SEARCH MODAL
    // ============================================
    class FullSearchModal {
        constructor() {
            this.modal = document.getElementById('searchModal');
            this.input = document.getElementById('searchInput');
            this.closeBtn = document.querySelector('.search-close-btn');
            this.backdrop = document.querySelector('.search-modal-backdrop');

            if (this.modal) this.init();
        }

        init() {
            // Close button
            this.closeBtn?.addEventListener('click', () => this.close());

            // Backdrop click
            this.backdrop?.addEventListener('click', () => this.close());

            // Keyboard shortcut (Cmd+K / Ctrl+K)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    this.toggle();
                }

                if (e.key === 'Escape' && this.modal?.getAttribute('aria-hidden') === 'false') {
                    this.close();
                }
            });

            // Search triggers
            document.querySelectorAll('.search-trigger, .mobile-search-btn').forEach(trigger => {
                trigger.addEventListener('click', () => this.open());
            });
        }

        open() {
            this.modal.setAttribute('aria-hidden', 'false');
            this.modal.classList.add('active');
            this.input?.focus();
            document.body.style.overflow = 'hidden';
        }

        close() {
            this.modal.setAttribute('aria-hidden', 'true');
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        toggle() {
            const isHidden = this.modal?.getAttribute('aria-hidden') === 'true';
            if (isHidden) {
                this.open();
            } else {
                this.close();
            }
        }
    }

    // ============================================
    // PORTFOLIO FILTER
    // ============================================
    class PortfolioFilter {
        constructor() {
            this.buttons = document.querySelectorAll('#portfolio-section button');
            this.projects = document.querySelectorAll('#portfolio-section .group');

            if (this.buttons.length) this.init();
        }

        init() {
            this.buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    this.buttons.forEach(b => b.classList.remove('active'));
                    // Add active to clicked
                    btn.classList.add('active');

                    // Filter logic would go here
                    // For now, just visual state change
                });
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Core functionality
        new Navigation();
        new SearchModal();
        new SmoothScroll();
        new DynamicYear();
        new ResourceLoader();

        // Animations (with performance checks)
        new NeuralCanvas('neural-canvas');
        new TiltEffect();
        new ScrollAnimations();
        new CounterAnimation();

        // UI Components
        new ChatWidget();
        new FullChatWidget();
        new FullSearchModal();
        new TabsController();
        new FaqAccordion();
        new TerminalTypewriter();
        new LazySections();
        new PortfolioFilter();

        // Canvas for specific sections
        // new MedicalArchiveCanvas(); // Class not defined, skipping to prevent crash

        // Additional Initializations
        initStatsCounter();
        initFaqFunctions();
        initFilterButtons();

        console.log('[Bright AI] Initialized successfully');
    }

    // ============================================
    // STATS COUNTER - Enhanced
    // ============================================
    function initStatsCounter() {
        const counters = document.querySelectorAll('[data-counter]');
        if (!counters.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseFloat(el.dataset.counter);
                    const prefix = el.dataset.prefix || '';
                    const suffix = el.dataset.suffix || '';
                    const duration = 2000;
                    const isDecimal = target % 1 !== 0;

                    let startTime = null;

                    function animate(currentTime) {
                        if (!startTime) startTime = currentTime;
                        const progress = Math.min((currentTime - startTime) / duration, 1);
                        const easeOut = 1 - Math.pow(1 - progress, 3);
                        const current = target * easeOut;

                        el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current)) + suffix;

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    }

                    requestAnimationFrame(animate);
                    observer.unobserve(el);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => observer.observe(counter));
    }

    // ============================================
    // FAQ FUNCTIONS - Global
    // ============================================
    function initFaqFunctions() {
        // Make functions global for onclick handlers
        window.toggleFaq = function (button) {
            const item = button.closest('.faq-item');
            const content = item.querySelector('.faq-content');
            const icon = button.querySelector('.faq-icon');

            // Toggle content
            content.classList.toggle('hidden');

            // Rotate icon
            if (icon) {
                icon.classList.toggle('rotated');
            }

            // Animate height
            if (!content.classList.contains('hidden')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }
        };

        window.switchFaqTab = function (category, button) {
            // Hide all categories
            document.querySelectorAll('.faq-category').forEach(cat => {
                cat.classList.add('hidden');
                cat.classList.remove('block');
            });

            // Show selected category
            const targetCategory = document.getElementById('faq-' + category);
            if (targetCategory) {
                targetCategory.classList.remove('hidden');
                targetCategory.classList.add('block');
            }

            // Update button states
            document.querySelectorAll('.faq-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.classList.remove('bg-gold-500/10');
                tab.classList.remove('border-gold-500/20');
                tab.classList.remove('text-gold-400');
                tab.classList.add('bg-white/5');
                tab.classList.add('border-white/5');
                tab.classList.add('text-slate-400');
            });

            // Activate clicked button
            button.classList.add('active');
            button.classList.remove('bg-white/5');
            button.classList.remove('border-white/5');
            button.classList.remove('text-slate-400');
            button.classList.add('bg-gold-500/10');
            button.classList.add('border-gold-500/20');
            button.classList.add('text-gold-400');
        };
    }

    // ============================================
    // FILTER BUTTONS
    // ============================================
    function initFilterButtons() {
        const filterContainers = document.querySelectorAll('#portfolio-section, .filter-container');

        filterContainers.forEach(container => {
            const buttons = container.querySelectorAll('button');

            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active from all
                    buttons.forEach(b => b.classList.remove('active'));
                    // Add active to clicked
                    btn.classList.add('active');
                });
            });
        });
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();


