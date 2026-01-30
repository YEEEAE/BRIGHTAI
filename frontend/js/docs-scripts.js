/**
 * Bright AI Documentation Pages Script
 * Handles interactions specific to documentation, FAQ, and legal pages.
 */

document.addEventListener('DOMContentLoaded', () => {

    // FAQ Accordion Functionality
    const faqItems = document.querySelectorAll('.faq-item');

    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');

            question.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');

                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('open');
                    }
                });

                // Toggle current item
                item.classList.toggle('open');
            });
        });
    }

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.glass-card').forEach(card => {
        observer.observe(card);
    });

    // Mobile Menu Toggle (Ensuring it works with unified nav)
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu-drawer');
    const backdrop = document.querySelector('.backdrop-overlay');

    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
            backdrop.classList.toggle('active');
            document.body.classList.toggle('overflow-hidden');

            const icon = mobileToggle.querySelector('iconify-icon');
            if (icon) {
                const iconName = mobileMenu.classList.contains('active') ? 'lucide:x' : 'lucide:menu';
                icon.setAttribute('icon', iconName);
            }
        });

        if (backdrop) {
            backdrop.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
                backdrop.classList.remove('active');
                document.body.classList.remove('overflow-hidden');
            });
        }
    }
});
