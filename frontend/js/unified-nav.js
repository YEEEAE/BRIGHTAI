/**
 * BrightAI Unified Navigation System
 * Professional Navigation with Hamburger Menu & Dropdowns
 * Version: 2.0.0
 */

(function() {
    'use strict';

    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', initNavigation);

    function initNavigation() {
        const nav = document.querySelector('.unified-nav');
        const hamburgerBtn = document.querySelector('.hamburger-btn');
        const navLinks = document.querySelector('.nav-links');
        const navOverlay = document.querySelector('.nav-overlay');
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

        if (!nav) return;

        // Create overlay if it doesn't exist
        let overlay = navOverlay;
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nav-overlay';
            document.body.appendChild(overlay);
        }

        // Hamburger Menu Toggle
        if (hamburgerBtn && navLinks) {
            hamburgerBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleMenu();
            });
        }

        // Overlay click to close
        overlay.addEventListener('click', closeMenu);

        // Dropdown Toggle for Mobile
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const parent = this.closest('.nav-dropdown');
                const isActive = parent.classList.contains('active');
                
                // On mobile, close other dropdowns
                if (window.innerWidth <= 1024) {
                    document.querySelectorAll('.nav-dropdown.active').forEach(dropdown => {
                        if (dropdown !== parent) {
                            dropdown.classList.remove('active');
                            dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
                        }
                    });
                }
                
                // Toggle current dropdown
                parent.classList.toggle('active');
                this.setAttribute('aria-expanded', !isActive ? 'true' : 'false');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.unified-nav')) {
                closeMenu();
                closeAllDropdowns();
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMenu();
                closeAllDropdowns();
            }
        });

        // Handle scroll for nav background
        let lastScroll = 0;
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }, { passive: true });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', function() {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(function() {
                if (window.innerWidth > 1024) {
                    closeMenu();
                }
            }, 250);
        });

        // Helper Functions
        function toggleMenu() {
            const isActive = navLinks.classList.contains('active');
            
            if (isActive) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        function openMenu() {
            navLinks.classList.add('active');
            hamburgerBtn.classList.add('active');
            overlay.classList.add('active');
            hamburgerBtn.setAttribute('aria-expanded', 'true');
            hamburgerBtn.setAttribute('aria-label', 'إغلاق القائمة');
            document.body.style.overflow = 'hidden';
        }

        function closeMenu() {
            if (navLinks) navLinks.classList.remove('active');
            if (hamburgerBtn) {
                hamburgerBtn.classList.remove('active');
                hamburgerBtn.setAttribute('aria-expanded', 'false');
                hamburgerBtn.setAttribute('aria-label', 'فتح القائمة');
            }
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        function closeAllDropdowns() {
            document.querySelectorAll('.nav-dropdown.active').forEach(dropdown => {
                dropdown.classList.remove('active');
                dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
            });
        }

        // Mark current page in navigation
        markCurrentPage();
    }

    function markCurrentPage() {
        const currentPath = window.location.pathname;
        const currentPage = currentPath.split('/').pop() || 'index.html';
        
        document.querySelectorAll('.nav-links a').forEach(link => {
            const href = link.getAttribute('href');
            if (href) {
                const linkPage = href.split('/').pop();
                if (linkPage === currentPage || 
                    (currentPage === '' && linkPage === 'index.html') ||
                    (currentPage === 'index.html' && href === '#home')) {
                    link.classList.add('active');
                }
            }
        });
    }
})();
