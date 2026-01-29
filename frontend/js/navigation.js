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

  // 3. Dropdown Interactions - تحسين التحكم بالقوائم المنسدلة
  dropdownToggles.forEach(toggle => {
    const navItem = toggle.closest('.nav-item');
    const dropdown = toggle.nextElementSibling;
    let closeTimer = null;

    // إلغاء إغلاق القائمة عند التحويم على العنصر الرئيسي أو القائمة
    const cancelClose = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    // جدولة إغلاق القائمة مع تأخير
    const scheduleClose = () => {
      closeTimer = setTimeout(() => {
        if (toggle.getAttribute('aria-expanded') === 'true') {
          toggle.setAttribute('aria-expanded', 'false');
        }
      }, 500); // نصف ثانية تأخير
    };

    // Desktop: تحسين التفاعل مع الماوس
    if (navItem && dropdown) {
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

      dropdown.addEventListener('mouseenter', () => {
        if (window.innerWidth >= 1024) {
          cancelClose();
        }
      });

      dropdown.addEventListener('mouseleave', () => {
        if (window.innerWidth >= 1024) {
          scheduleClose();
        }
      });
    }

    // Desktop: Hover is handled by CSS mostly, but we add keyboard support
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle.setAttribute('aria-expanded', toggle.getAttribute('aria-expanded') === 'true' ? 'false' : 'true');
      }
    });

  });


  // --- MOBILE DROPDOWN HANDLING ---
  const mobileDropdownToggles = document.querySelectorAll('.mobile-nav-link[aria-haspopup="true"]');

  mobileDropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const submenu = toggle.nextElementSibling; // Expected to be .mobile-dropdown
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Close other mobile dropdowns (Classic Accordion)
      // Optional: Remove if you want to allow multiple open
      if (!isExpanded) {
        mobileDropdownToggles.forEach(other => {
          if (other !== toggle) {
            other.setAttribute('aria-expanded', 'false');
            const otherSub = other.nextElementSibling;
            if (otherSub && otherSub.classList.contains('mobile-dropdown')) {
              otherSub.classList.remove('open');
            }
          }
        });
      }

      // Toggle current
      toggle.setAttribute('aria-expanded', !isExpanded);
      if (submenu) {
        submenu.classList.toggle('open');
      }
    });
  });


  // 4. التأكد من أن الروابط داخل القوائم المنسدلة قابلة للنقر
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      // السماح بالنقر الطبيعي على الروابط
      // لا نستخدم preventDefault هنا لأننا نريد أن يعمل الرابط بشكل طبيعي
      console.log('تم النقر على:', item.textContent.trim());
    });
  });

  // 4. Focus Management
  // Add focus-visible styling or handle specific keyboard traps if necessary
}
