/**
 * Bright AI - Advanced Navigation System
 * Handles interactions for the enterprise-grade navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
});

function initNavigation() {
  const nav = document.querySelector('.unified-nav');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mobileDrawer = document.querySelector('.mobile-menu-drawer');
  const backdrop = document.querySelector('.backdrop-overlay');
  const dropdownToggles = document.querySelectorAll('.nav-link[aria-haspopup="true"]');
  
  // 1. Scroll Effect (Glassmorphism intensity)
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.style.background = 'rgba(2, 6, 23, 0.95)';
      nav.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
    } else {
      nav.style.background = 'rgba(2, 6, 23, 0.85)';
      nav.style.boxShadow = 'none';
    }
  });

  // 2. Mobile Menu Toggle
  function toggleMobileMenu() {
    const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
    mobileToggle.setAttribute('aria-expanded', !isExpanded);
    
    if (!isExpanded) {
      mobileDrawer.classList.add('active');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scroll
    } else {
      mobileDrawer.classList.remove('active');
      backdrop.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleMobileMenu);
  }

  if (backdrop) {
    backdrop.addEventListener('click', toggleMobileMenu);
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
      toggleMobileMenu();
    }
  });

  // 3. Dropdown Interactions
  dropdownToggles.forEach(toggle => {
    // Desktop: Hover is handled by CSS mostly, but we add keyboard support
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        // For keyboard users, we might need a way to keep it open or toggle
        // Simplest is to let focus-within handle it in CSS or toggle a class
        toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      }
    });

    // Mobile: Accordion Expand
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth < 1024) {
        e.preventDefault();
        const submenu = toggle.nextElementSibling; // The .dropdown-menu or similar
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        
        // Close other mobile dropdowns (Optional: Accordion behavior)
        if (!isExpanded) {
           dropdownToggles.forEach(other => {
             if (other !== toggle) {
               other.setAttribute('aria-expanded', 'false');
               // Logic to hide other submenus if handled via JS classes
               if (other.nextElementSibling) {
                 other.nextElementSibling.style.display = 'none'; 
               }
             }
           });
        }

        toggle.setAttribute('aria-expanded', !isExpanded);
        
        // Toggle submenu visibility for mobile
        if (submenu) {
          if (!isExpanded) {
            submenu.style.display = 'block';
            submenu.style.position = 'static';
            submenu.style.width = '100%';
            submenu.style.opacity = '1';
            submenu.style.visibility = 'visible';
            submenu.style.transform = 'translateY(0)';
            submenu.style.background = 'transparent';
            submenu.style.border = 'none';
            submenu.style.paddingLeft = '0'; // align right in RTL? check CSS
            submenu.style.boxShadow = 'none';
          } else {
            submenu.style.display = 'none';
          }
        }
      }
    });
  });

  // 4. Focus Management
  // Add focus-visible styling or handle specific keyboard traps if necessary
}
