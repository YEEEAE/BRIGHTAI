/**
 * kernel-sidebar.js — BAI-SEC-18 (2026-07-25) + mobile drawer (2026-07-30)
 *
 * Extracted from src/components/kernel/KernelSidebar.astro inline
 * <script is:inline> block to enable strict-CSP. The script is
 * loaded as a static ES module via
 * <script type="module" src="/js/kernel-sidebar.js">.
 *
 * Desktop behavior (≥1024px):
 *   - Toggle collapse/expand state via body[data-sidebar] attribute
 *   - Persist state in localStorage (key: 'brightai-kernel-sidebar')
 *   - Update aria-label + title + button text to match state
 *
 * Mobile behavior (<1024px) — added 2026-07-30:
 *   - Hamburger button (data-kernel-sidebar-toggle) opens the drawer
 *   - body[data-sidebar-open="true"] drives the CSS transform
 *   - Overlay tap (data-kernel-sidebar-overlay) closes the drawer
 *   - Close button (data-kernel-sidebar-close) closes the drawer
 *   - Escape key closes the drawer
 *   - Focus moves to the sidebar when opened, returns to hamburger when closed
 *   - Open state is NOT persisted (reverts to closed on every page load)
 *
 * KRN-IA-001 (2026-08-09) — Role-aware task groups:
 *   - reorderGroups(role): يعيد ترتيب .kernel-sidebar__group داخل الـ nav
 *     حسب ROLE_CONFIG[role].order. الـ SSR يرسم ترتيب dpo افتراضيًا، وهنا
 *     نعدّله لو الدور المحفوظ مختلف. RTL-safe (DOM order native).
 *   - renderPinned(role): يبني الـ "مهامك السريعة" strip (max 3) من
 *     ROLE_CONFIG[role].pinned — يعيد استخدام بيانات العناصر من DOM
 *     الموجود في المجموعات (لا تكرار لبيانات الوحدات).
 *   - يتكامل مع kernel:role-change event اللي يطلقه kernel-shell.js +
 *     KernelRoleSelector (نفس localStorage key `brightai-kernel-role`).
 *
 * Both:
 *   - Survives Astro view transitions (data-bound flag on buttons)
 *   - Ensures body has 'kernel-shell' class (defensive)
 *   - Initialises on astro:page-load + on first DOMContentLoaded /
 *     immediate if document already ready
 */
(function () {
  'use strict';
  var KEY = 'brightai-kernel-sidebar';
  var ROLE_KEY = 'brightai-kernel-role';

  /* ── KRN-IA-001: Role config mirror ────────────────────────────────
     Mirror لـ roleConfig في src/data/kernel.ts. أي تغيير هناك لازم
     ينعكس هنا (الـ TS هو source of truth للـ SSR). ما نستورد من src/
     لأن public/js/ يُحمَّل static. نمط مطابق لـ KernelRecommendedJourney
     اللي يكرر JOURNEYS inline. */
  var ROLE_CONFIG = {
    dpo: {
      order: ['monitor', 'investigate', 'govern', 'evaluate', 'integrate', 'admin'],
      pinned: ['chat', 'playground', 'stats'],
    },
    ciso: {
      order: ['investigate', 'govern', 'monitor', 'evaluate', 'integrate', 'admin'],
      pinned: ['compliance', 'audit', 'evidence'],
    },
    compliance: {
      order: ['govern', 'investigate', 'evaluate', 'monitor', 'integrate', 'admin'],
      pinned: ['compliance', 'evidence', 'reports'],
    },
    developer: {
      order: ['integrate', 'monitor', 'evaluate', 'govern', 'investigate', 'admin'],
      pinned: ['api', 'playground', 'connectors'],
    },
    employee: {
      order: ['monitor', 'investigate', 'govern', 'evaluate', 'integrate', 'admin'],
      pinned: ['chat', 'playground', 'stats'],
    },
  };

  // مجموعات gated بـ role — الـ SSR يخفيها، والـ JS يضيفها لو الدور مسموح.
  var GROUP_ROLES = {
    admin: ['operator', 'admin'],
  };

  var ADMIN_ITEM = {
    // quota ليس في kernelUnits (صفحة noindex منفصلة) — metadata يدوية.
    slug: 'quota',
    path: '/kernel/admin/quota/',
    label: 'حصة الـ Kernel',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>',
  };

  function getRoleConfig(role) {
    return (role && ROLE_CONFIG[role]) ? ROLE_CONFIG[role] : ROLE_CONFIG.dpo;
  }

  function getSavedRole() {
    try { return localStorage.getItem(ROLE_KEY); } catch (e) { return null; }
  }

  function getCurrentRole() {
    var explicit = document.body.getAttribute('data-role');
    if (explicit) return explicit;
    return getSavedRole() || 'dpo';
  }

  /* ── KRN-IA-001: Reorder + Admin gating ──────────────────────────── */
  function reorderGroups(role) {
    var nav = document.querySelector('.kernel-sidebar__nav');
    if (!nav) return;
    var cfg = getRoleConfig(role);
    var groupEls = {};
    Array.from(nav.querySelectorAll('.kernel-sidebar__group')).forEach(function (g) {
      var id = g.getAttribute('data-kernel-group');
      if (id) groupEls[id] = g;
    });

    // أعد الترتيب حسب cfg.order. appendChild ينقل العنصر (مو استنساخ).
    cfg.order.forEach(function (gid) {
      var roles = GROUP_ROLES[gid];
      var allowed = !roles || (roles.indexOf(role) !== -1);
      var el = groupEls[gid];

      if (gid === 'admin') {
        // مجموعة Admin: أضِفها لو الدور مسموح وما هي موجودة؛ أخفِها لو لأ.
        ensureAdminGroup(nav, allowed ? role : null);
        return;
      }
      if (el && allowed) nav.appendChild(el);
    });
  }

  // Admin group تُبنى/تُخفى ديناميكيًا — الـ SSR ما يرسمها أصلًا.
  function ensureAdminGroup(nav, role) {
    var existing = nav.querySelector('.kernel-sidebar__group[data-kernel-group="admin"]');
    if (!role) {
      if (existing) existing.remove();
      return;
    }
    if (existing) { nav.appendChild(existing); return; }
    var sec = document.createElement('section');
    sec.className = 'kernel-sidebar__group';
    sec.setAttribute('data-kernel-group', 'admin');
    var label = document.createElement('span');
    label.className = 'kernel-sidebar__section-label';
    label.textContent = 'الإدارة';
    var a = document.createElement('a');
    a.className = 'kernel-sidebar__item';
    a.setAttribute('data-kernel-nav-id', ADMIN_ITEM.slug);
    a.setAttribute('data-health', 'ok');
    a.href = ADMIN_ITEM.path;
    var icon = document.createElement('span');
    icon.className = 'kernel-sidebar__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = ADMIN_ITEM.icon;
    var lab = document.createElement('span');
    lab.className = 'kernel-sidebar__label';
    lab.textContent = ADMIN_ITEM.label;
    a.appendChild(icon);
    a.appendChild(lab);
    sec.appendChild(label);
    sec.appendChild(a);
    nav.appendChild(sec);
  }

  /* ── KRN-IA-001: Pinned "top tasks" strip ────────────────────────── */
  // يبني الـ pinned من بيانات العناصر الموجودة في المجموعات (إعادة استخدام)
  // لتجنب تكرار metadata الوحدات في JS. لو الـ slug مو موجود في DOM (نادر)،
  // يتجاوزه بأمان.
  function renderPinned(role) {
    var pinnedSec = document.querySelector('[data-kernel-pinned]');
    if (!pinnedSec) return;
    var list = pinnedSec.querySelector('[data-kernel-pinned-list]');
    if (!list) return;
    var cfg = getRoleConfig(role);

    list.innerHTML = '';
    var currentPath = (window.location.pathname || '').replace(/\/$/, '');

    var added = 0;
    cfg.pinned.forEach(function (slug) {
      if (added >= 3) return; // hard cap
      var source = findItemBySlug(slug);
      if (!source) return;

      var a = document.createElement('a');
      a.className = 'kernel-sidebar__pinned-item';
      a.href = source.path;
      a.setAttribute('data-kernel-nav-id', slug);
      var isCurrent = currentPath === source.path.replace(/\/$/, '');
      if (isCurrent) a.setAttribute('aria-current', 'page');

      var icon = document.createElement('span');
      icon.className = 'kernel-sidebar__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = source.iconSvg;

      var label = document.createElement('span');
      label.className = 'kernel-sidebar__label';
      label.textContent = source.label;

      var mark = document.createElement('span');
      mark.className = 'kernel-sidebar__pinned-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76V6a2 2 0 012-2h2a2 2 0 012 2v4.76l2 4.24H7l2-4.24z"/></svg>';

      a.appendChild(icon);
      a.appendChild(label);
      a.appendChild(mark);
      list.appendChild(a);
      added++;
    });

    // أظهر القسم بس لو فيه عنصر واحد على الأقل.
    pinnedSec.hidden = added === 0;
  }

  // يقرأ بيانات عنصر موجود من DOM (المجموعات المرسومة SSR).
  function findItemBySlug(slug) {
    var el = document.querySelector('.kernel-sidebar__item[data-kernel-nav-id="' + slug + '"]');
    if (!el) return null;
    var icon = el.querySelector('.kernel-sidebar__icon');
    var label = el.querySelector('.kernel-sidebar__label');
    return {
      path: el.getAttribute('href'),
      iconSvg: icon ? icon.innerHTML : '',
      label: label ? label.textContent : '',
    };
  }

  /* ── KRN-IA-001: apply role → reorder + pinned ───────────────────── */
  function applyRole(role) {
    reorderGroups(role);
    renderPinned(role);
  }

  function syncLabel(state, btn) {
    var label = state === 'collapsed' ? 'فتح القائمة' : 'طي القائمة';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    var text = btn.querySelector('.kernel-sidebar__collapse-label');
    if (text) text.textContent = label;
  }

  /* ── Mobile drawer helpers ────────────────────────────────────────── */

  function openDrawer(body, hamburger, sidebar) {
    body.setAttribute('data-sidebar-open', 'true');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'true');
    if (sidebar) {
      sidebar.setAttribute('aria-hidden', 'false');
      // Move focus into the drawer so keyboard users can navigate it.
      // Use rAF so the transform has started before focus moves.
      requestAnimationFrame(function () {
        var firstItem = sidebar.querySelector('a, button');
        if (firstItem) firstItem.focus();
      });
    }
  }

  function closeDrawer(body, hamburger, sidebar) {
    body.setAttribute('data-sidebar-open', 'false');
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', 'false');
      // Return focus to the hamburger so the user doesn't lose their place.
      hamburger.focus();
    }
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');
  }

  function isDrawerOpen(body) {
    return body.getAttribute('data-sidebar-open') === 'true';
  }

  /* ── Init ─────────────────────────────────────────────────────────── */

  function init() {
    var body = document.body;
    // Ensure body has kernel-shell class (KernelLayout script may run after)
    if (!body.classList.contains('kernel-shell')) {
      body.classList.add('kernel-shell');
    }

    // KRN-IA-001: طبّق ترتيب الدور + الـ pinned عند كل تحميل صفحة.
    // kernel-shell.js يقرأ الدور المحفوظ ويضع body[data-role] على
    // astro:page-load — نعتمد عليه هنا. لو الدور المحفوظ ≠ dpo (الافتراضي
    // SSR)، الـ reorder يصحح الترتيب فورًا.
    applyRole(getCurrentRole());

    // Desktop collapse button
    var collapseBtn = document.querySelector('[data-kernel-sidebar-collapse]');
    // Mobile hamburger + overlay + close
    var hamburger = document.querySelector('[data-kernel-sidebar-toggle]');
    var overlay = document.querySelector('[data-kernel-sidebar-overlay]');
    var closeBtn = document.querySelector('[data-kernel-sidebar-close]');
    var sidebar = document.getElementById('kernel-sidebar');

    // Restore desktop collapse state from localStorage
    if (collapseBtn) {
      try {
        var saved = localStorage.getItem(KEY);
        body.setAttribute('data-sidebar', saved === 'collapsed' ? 'collapsed' : 'expanded');
      } catch (e) {
        body.setAttribute('data-sidebar', 'expanded');
      }
      syncLabel(body.getAttribute('data-sidebar'), collapseBtn);

      // Avoid duplicate listeners across page transitions
      if (collapseBtn.dataset.bound !== '1') {
        collapseBtn.dataset.bound = '1';
        collapseBtn.addEventListener('click', function () {
          var next = body.getAttribute('data-sidebar') === 'collapsed' ? 'expanded' : 'collapsed';
          body.setAttribute('data-sidebar', next);
          try { localStorage.setItem(KEY, next); } catch (e) {}
          syncLabel(next, collapseBtn);
        });
      }
    }

    // Mobile drawer: ensure closed on every page load (not persisted)
    body.setAttribute('data-sidebar-open', 'false');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    if (sidebar) sidebar.setAttribute('aria-hidden', 'true');

    // Bind hamburger toggle (avoid duplicates across view transitions)
    if (hamburger && hamburger.dataset.bound !== '1') {
      hamburger.dataset.bound = '1';
      hamburger.addEventListener('click', function () {
        if (isDrawerOpen(body)) {
          closeDrawer(body, hamburger, sidebar);
        } else {
          openDrawer(body, hamburger, sidebar);
        }
      });
    }

    // Bind overlay tap (closes drawer)
    if (overlay && overlay.dataset.bound !== '1') {
      overlay.dataset.bound = '1';
      overlay.addEventListener('click', function () {
        if (isDrawerOpen(body)) closeDrawer(body, hamburger, sidebar);
      });
    }

    // Bind close button (inside drawer footer)
    if (closeBtn && closeBtn.dataset.bound !== '1') {
      closeBtn.dataset.bound = '1';
      closeBtn.addEventListener('click', function () {
        if (isDrawerOpen(body)) closeDrawer(body, hamburger, sidebar);
      });
    }

    // Escape key closes drawer (bound once on document)
    if (!document.__kernelSidebarEscapeBound) {
      document.__kernelSidebarEscapeBound = true;
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && isDrawerOpen(body)) {
          closeDrawer(body, hamburger, sidebar);
        }
      });
    }

    // KRN-IA-001: استمع لتغيير الدور (bound once on window).
    // kernel-shell.js + KernelRoleSelector يطلقان الحدث؛ نعيد تطبيق الترتيب
    // + بناء الـ pinned بدون reload.
    if (!window.__kernelRoleChangeBound) {
      window.__kernelRoleChangeBound = true;
      window.addEventListener('kernel:role-change', function (e) {
        var role = (e && e.detail && e.detail.role) || getCurrentRole();
        applyRole(role);
      });
    }
  }

  // Astro view transition hooks + initial load
  document.addEventListener('astro:page-load', init);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
