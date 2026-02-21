/**
 * Bright AI — Premium Navigation Controller
 * Handles: scroll effects, mobile drawer, dropdowns
 */
document.addEventListener("DOMContentLoaded", () => { initNavigation(); });

function initNavigation() {
    const nav = document.querySelector(".unified-nav");
    const mobileToggles = document.querySelectorAll(".mobile-toggle");
    const mobileDrawer = document.querySelector(".mobile-menu-drawer");
    const backdrop = document.querySelector(".backdrop-overlay");
    const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"]');

    // === SCROLL: Scrolled state + Hide/Show nav ===
    let lastScrollY = 0;
    let ticking = false;
    const SCROLL_THRESHOLD = 10;
    const HIDE_THRESHOLD = 400;

    function onScroll() {
        const currentY = window.scrollY;

        // Scrolled class (solidify background)
        if (currentY > SCROLL_THRESHOLD) {
            nav.classList.add("nav-scrolled");
        } else {
            nav.classList.remove("nav-scrolled");
        }

        // Hide on scroll down, show on scroll up
        if (currentY > HIDE_THRESHOLD && currentY > lastScrollY + 5) {
            nav.classList.add("nav-hidden");
        } else if (currentY < lastScrollY - 5 || currentY <= SCROLL_THRESHOLD) {
            nav.classList.remove("nav-hidden");
        }

        lastScrollY = currentY;
        ticking = false;
    }

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    }, { passive: true });

    // Initial check
    onScroll();

    // === MOBILE MENU ===
    function openMobileMenu() {
        mobileToggles.forEach(t => t.setAttribute("aria-expanded", "true"));
        if (mobileDrawer) mobileDrawer.classList.add("active");
        if (backdrop) backdrop.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        mobileToggles.forEach(t => t.setAttribute("aria-expanded", "false"));
        if (mobileDrawer) mobileDrawer.classList.remove("active");
        if (backdrop) backdrop.classList.remove("active");
        document.body.style.overflow = "";
    }

    function toggleMobileMenu() {
        const isOpen = mobileDrawer && mobileDrawer.classList.contains("active");
        isOpen ? closeMobileMenu() : openMobileMenu();
    }

    mobileToggles.forEach(toggle => {
        toggle.addEventListener("click", toggleMobileMenu);
    });

    if (backdrop) backdrop.addEventListener("click", closeMobileMenu);

    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && mobileDrawer && mobileDrawer.classList.contains("active")) {
            closeMobileMenu();
        }
    });

    // === DESKTOP DROPDOWNS (hover with delay) ===
    dropdownToggles.forEach(toggle => {
        const navItem = toggle.closest(".nav-item");
        const dropdown = toggle.nextElementSibling;
        let closeTimer = null;

        const cancelClose = () => {
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        };
        const scheduleClose = () => {
            closeTimer = setTimeout(() => {
                if (toggle.getAttribute("aria-expanded") === "true") {
                    toggle.setAttribute("aria-expanded", "false");
                }
            }, 400);
        };

        if (navItem && dropdown) {
            navItem.addEventListener("mouseenter", () => {
                if (window.innerWidth >= 1024) {
                    cancelClose();
                    toggle.setAttribute("aria-expanded", "true");
                }
            });
            navItem.addEventListener("mouseleave", () => {
                if (window.innerWidth >= 1024) scheduleClose();
            });
            dropdown.addEventListener("mouseenter", () => {
                if (window.innerWidth >= 1024) cancelClose();
            });
            dropdown.addEventListener("mouseleave", () => {
                if (window.innerWidth >= 1024) scheduleClose();
            });
        }

        toggle.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle.setAttribute("aria-expanded",
                    toggle.getAttribute("aria-expanded") === "true" ? "false" : "true"
                );
            }
        });
    });

    // === MOBILE DROPDOWN TOGGLES ===
    const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');
    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener("click", e => {
            e.preventDefault();
            const submenu = toggle.nextElementSibling;
            const isExpanded = toggle.getAttribute("aria-expanded") === "true";

            // Close others
            if (!isExpanded) {
                mobileDropdownToggles.forEach(other => {
                    if (other !== toggle) {
                        other.setAttribute("aria-expanded", "false");
                        const otherSub = other.nextElementSibling;
                        if (otherSub && otherSub.classList.contains("mobile-dropdown")) {
                            otherSub.classList.remove("open");
                        }
                    }
                });
            }

            toggle.setAttribute("aria-expanded", !isExpanded);
            if (submenu) submenu.classList.toggle("open");
        });
    });

    // Close mobile menu on link click (for anchor links)
    if (mobileDrawer) {
        mobileDrawer.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener("click", () => {
                setTimeout(closeMobileMenu, 200);
            });
        });
    }
}
