document.addEventListener('DOMContentLoaded', () => {
    // Set RTL direction (already set on HTML tag, this is redundant but harmless)
    // document.body.style.direction = 'rtl'; 

    // Font Awesome is linked in HTML, Tajawal font is linked in HTML

    // Lazy loading images
    const lazyImages = document.querySelectorAll('img[data-src]');
    if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src'); // Remove data-src after loading
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '0px 0px 50px 0px', // Load images a bit before they enter viewport
            threshold: 0.01
        });

        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        lazyImages.forEach(img => {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.remove('lazy');
        });
    }


    // Scroll animations for sections
    const sections = document.querySelectorAll('section');
    if ("IntersectionObserver" in window) {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: unobserve after first animation
                    // sectionObserver.unobserve(entry.target); 
                }
            });
        }, {
            threshold: 0.1, // Triggers when 10% of the element is visible
            rootMargin: '0px 0px -50px 0px' // Start animation a bit later
        });

        sections.forEach(section => {
            sectionObserver.observe(section);
        });
    } else {
        // Fallback: make all sections visible if IntersectionObserver is not supported
        sections.forEach(section => {
            section.classList.add('visible');
        });
    }


    // Agent cards icon assignment (ensure icons are consistent if not explicitly set)
    // This part might be redundant if all icons are manually set in HTML, but kept for robustness.
    const agentCards = document.querySelectorAll('.agent-card');
    const defaultIconClasses = [ // More diverse icons
        'fa-cogs', 'fa-chart-line', 'fa-bullhorn', 'fa-search', 
        'fa-file-alt', 'fa-users', 'fa-project-diagram', 'fa-tasks',
        'fa-brain', 'fa-robot', 'fa-drafting-compass', 'fa-comments' 
    ];
    
    agentCards.forEach((card, index) => {
        const iconElement = card.querySelector('.agent-icon');
        // If an icon element exists but has no specific FontAwesome class (fas, fab, etc.)
        if (iconElement && !Array.from(iconElement.classList).some(cls => cls.startsWith('fa-'))) {
            const iconClass = defaultIconClasses[index % defaultIconClasses.length];
            iconElement.classList.add('fas', iconClass); // Assuming 'fas' for solid icons
        }
    });

    // Enhanced hover effects for cards (CSS handles this primarily, JS can add classes if needed)
    // The CSS :hover pseudo-class is generally preferred for this.
    // If more complex animations are needed on hover, JS can toggle classes.

    // Hero section parallax effect (Subtle for performance)
    const heroSection = document.getElementById('hero');
    const heroContent = document.querySelector('#hero .hero-content');

    if (heroSection && heroContent && window.matchMedia("(min-width: 769px)").matches) { // Only on larger screens
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Reduced intensity for subtlety
            const offsetX = (x - centerX) / 100; 
            const offsetY = (y - centerY) / 100;

            // Request animation frame for smoother animations
            window.requestAnimationFrame(() => {
                 heroContent.style.transform = `translateZ(50px) rotateX(${-offsetY * 0.2}deg) rotateY(${offsetX * 0.2}deg)`;
            });
        });

        heroSection.addEventListener('mouseleave', () => {
             window.requestAnimationFrame(() => {
                heroContent.style.transform = 'translateZ(50px) rotateX(0deg) rotateY(0deg)';
            });
        });
    }

    // Modal functionality
    const modalTriggers = document.querySelectorAll('.more-details');
    const closeButtons = document.querySelectorAll('.close-modal');
    const modals = document.querySelectorAll('.modal');
    let previouslyFocusedElement = null;

    function openModal(modal) {
        if (modal) {
            previouslyFocusedElement = document.activeElement;
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
            modal.setAttribute('aria-hidden', 'false');
            // Focus on the modal itself or the first focusable element
            const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            } else {
                modal.focus(); // Fallback
            }
        }
    }

    function closeModal(modal) {
         if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
            modal.setAttribute('aria-hidden', 'true');
            if (previouslyFocusedElement) {
                previouslyFocusedElement.focus();
            }
        }
    }

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            openModal(modal);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) { // Clicked on modal backdrop
                closeModal(modal);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modals.forEach(modal => {
                if (modal.classList.contains('show')) {
                    closeModal(modal);
                }
            });
        }
    });

    // CTA buttons WhatsApp link
    // Make this more specific if different CTAs have different targets
    const allCtaButtons = document.querySelectorAll('.cta-button, .final-cta-button, .modal-body a.cta-button');
    allCtaButtons.forEach(button => {
        // Check if it's not a "more-details" button (which opens a modal)
        // And check if it's not an internal page link (e.g. in navbar)
        if (!button.classList.contains('more-details') && !button.getAttribute('href')?.startsWith('#') && !button.closest('.navbar')) {
            button.addEventListener('click', (e) => {
                // Only prevent default if it's a '#' link or needs custom handling
                if (button.getAttribute('href') === '#' || !button.getAttribute('href')) {
                     e.preventDefault();
                }
                // Check if the button is for "احصل على عرض سعر" or similar text
                const buttonText = button.textContent || button.innerText;
                let whatsappMessage = "مرحبًا، أرغب في الاستفسار عن تصميم وكيل ذكاء اصطناعي مخصص.";
                if (buttonText.includes("عرض سعر") || buttonText.includes("صمم وكيلك")) {
                    whatsappMessage = "مرحبًا، أود الحصول على عرض سعر لتصميم وكيل ذكاء اصطناعي.";
                } else if (buttonText.includes("استشارة")) {
                     whatsappMessage = "مرحبًا، أرغب في الحصول على استشارة بخصوص خدمات الذكاء الاصطناعي.";
                }
                // Customize message based on button's context if needed further
                
                window.open(`https://wa.me/966501120781?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
            });
        }
    });


    // Add smooth scrolling for anchor links within the page
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href !== '#' && href !== '#!') { // Ensure it's a valid internal anchor
                const targetId = href.substring(1); // Remove #
                const targetElement = document.getElementById(targetId);
                
                if (targetElement) {
                    e.preventDefault();
                    const navbarHeight = document.querySelector('nav')?.offsetHeight || 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 10; // Extra 10px offset

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add animation to technology icons on hover (CSS handles this, JS can add if more complex)
    // Example: techIcons.forEach(icon => { icon.style.animation = 'float 6s ease-in-out infinite'; });
    // This is better done in CSS for performance unless dynamic properties are needed.

    // Add pulse animation to CTA buttons (CSS handles this with 'pulse' animation)

    // Add active class to current page in navbar
    const currentPageUrl = window.location.href.split('/').pop().split('?')[0].split('#')[0]; // More robust current page detection
    const navLinks = document.querySelectorAll('.navbar a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href').split('/').pop();
        if (linkHref === currentPageUrl || (currentPageUrl === '' && linkHref === 'index.html')) { // Handle root path for index.html
            link.classList.add('active'); // Use class for styling, CSS already has .active selector
            link.setAttribute('aria-current', 'page'); // For accessibility
        }
    });

    // Agent features list - Enhanced for SEO and clarity
    const agentFeaturesList = {
        'custom-agent': [
            'تصميم وكيل ذكاء اصطناعي مخصص بالكامل لأهداف شركتك في السعودية.',
            'تكامل سلس وفعال مع أنظمتك وبرامجك التشغيلية الحالية.',
            'دعم فني متخصص ومتوفر على مدار الساعة لضمان استمرارية العمل.'
        ],
        'data-analyst-agent': [
            'تحليل بيانات دقيق وعميق لاستخلاص رؤى استراتيجية قيمة لعملك.',
            'اكتشاف الأنماط والاتجاهات الخفية في بيانات أعمالك السعودية.',
            'تقارير تحليلية شاملة ومخصصة تدعم اتخاذ قرارات مستنيرة وفعالة.'
        ],
        'marketing-agent': [
            'تطوير وتنفيذ استراتيجيات تسويق رقمي مبتكرة باستخدام الذكاء الاصطناعي.',
            'تحليل دقيق لسلوك المستخدم وتفضيلاته لزيادة فعالية الحملات في السعودية.',
            'تحسين معدلات التحويل وزيادة العائد على الاستثمار التسويقي (ROI) بشكل ملحوظ.'
        ],
        'seo-agent': [
            'تحسين ترتيب موقعك بشكل استراتيجي في نتائج محركات البحث مثل جوجل.',
            'تحليل معمق للكلمات المفتاحية المستهدفة للسوق السعودي والمنافسين.',
            'تقارير أداء شهرية مفصلة لتتبع التقدم والنتائج في استراتيجيات SEO.'
        ],
        'content-agent': [
            'إنشاء محتوى عربي جذاب وعالي الجودة محسن لمحركات البحث (SEO).',
            'تطوير مقالات متوافقة مع معايير SEO لزيادة الظهور العضوي في السعودية.',
            'زيادة تفاعل الجمهور المستهدف مع المحتوى القيم والمفيد الذي نقدمه.'
        ],
        'customer-discovery-agent': [
            'اكتشاف شرائح عملاء جدد ومحتملين لمنتجاتك وخدماتك في السوق السعودي.',
            'تحليل دقيق لاحتياجات السوق السعودي وتوجهات المستهلكين المتغيرة.',
            'تطوير استراتيجيات تواصل فعالة لبناء علاقات قوية ومستدامة مع العملاء.'
        ],
        'competitor-analysis-agent': [
            'تحليل شامل ومفصل للمنافسين الرئيسيين في السوق السعودي عبر مختلف القنوات.',
            'تحديد دقيق لنقاط القوة والضعف لدى المنافسين وفرص التميز لشركتك.',
            'بناء استراتيجيات تنافسية ذكية ومبنية على بيانات دقيقة لتحقيق التفوق.'
        ],
        'project-analysis-agent': [
            'تحليل شامل لمشاريعك الحالية لتحديد معوقات الأداء ومجالات التحسين.',
            'تقديم توصيات عملية ومبتكرة لتحسين كفاءة تنفيذ المشاريع وتقليل المخاطر.',
            'وضع خطط تنفيذية واضحة وقابلة للقياس لتحقيق أهداف المشروع بكفاءة وفعالية.'
        ]
    };


    // Add features to agent cards dynamically
    document.querySelectorAll('.agent-card').forEach(card => {
        const detailsLink = card.querySelector('.more-details');
        if (detailsLink) {
            const modalId = detailsLink.getAttribute('data-modal');
            const featuresUl = card.querySelector('.agent-features');
            
            if (featuresUl && agentFeaturesList[modalId]) {
                featuresUl.innerHTML = ''; // Clear existing features if any
                agentFeaturesList[modalId].forEach(featureText => {
                    const li = document.createElement('li');
                    li.textContent = featureText;
                    featuresUl.appendChild(li);
                });
            }
        }
    });
});