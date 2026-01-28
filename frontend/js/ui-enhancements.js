
/**
 * Bright AI - UI Enhancements & Interactions
 * Handles Navigation, Mobile Menu, and Animations
 */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initDropdowns();
    initSmoothScroll();
});

/**
 * Mobile Menu Toggle Logic
 */
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links-list');
    const overlay = document.getElementById('nav-overlay');
    const body = document.body;

    if (!menuBtn || !navLinks) return;

    function toggleMenu() {
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';

        // Toggle ARIA state
        menuBtn.setAttribute('aria-expanded', !isExpanded);

        // Toggle active classes
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');

        if (overlay) {
            overlay.classList.toggle('active');
        }

        // Prevent background scrolling
        if (!isExpanded) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }
    }

    // Event Listeners
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    if (overlay) {
        overlay.addEventListener('click', toggleMenu);
    }

    // Close menu when clicking escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            toggleMenu();
        }
    });

    // Close menu when resizing to desktop
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && navLinks.classList.contains('active')) {
            toggleMenu();
        }
    });
}

/**
 * Mobile/Touch Dropdown Handling
 * Ensures dropdowns work on touch devices by handling clicks
 */
function initDropdowns() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');

    dropdowns.forEach(dropdown => {
        const toggleBtn = dropdown.querySelector('.dropdown-toggle');

        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', (e) => {
            // Only for mobile/tablet screens or touch interactions
            if (window.innerWidth <= 1024) {
                e.preventDefault();
                e.stopPropagation();

                // Close other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                        const btn = other.querySelector('.dropdown-toggle');
                        if (btn) btn.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle current
                dropdown.classList.toggle('active');
                const isExpanded = dropdown.classList.contains('active');
                toggleBtn.setAttribute('aria-expanded', isExpanded);
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            dropdowns.forEach(d => {
                d.classList.remove('active');
                const btn = d.querySelector('.dropdown-toggle');
                if (btn) btn.setAttribute('aria-expanded', 'false');
            });
        }
    });
}

/**
 * Smooth Scroll for Ancchor Links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Close mobile menu if open
                const navLinks = document.getElementById('nav-links-list');
                if (navLinks && navLinks.classList.contains('active')) {
                    const menuBtn = document.getElementById('mobile-menu-btn');
                    if (menuBtn) menuBtn.click(); // Trigger close
                }

                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
