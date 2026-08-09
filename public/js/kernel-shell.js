/**
 * kernel-shell.js — لوحة الأوامر ⌘K + مبدّل الدور.
 *
 * تحديث 2026-07-31 (رفع الشِل المشترك، مطابقة تصميم-صفحات-kernel §2.5/§2.6):
 *  - body.kernel-shell يُضاف في كل page-load (لتشغيل grid الشِل).
 *  - اختصارات قائمة: Cmd/Ctrl + C/A/S/T/R (تحتاج modifier، WCAG 2.1.4).
 *  - لوحة الأوامر ⌘K: فتح/إغلاق، تصفية، تنقّل بالأسهم، Enter تنفيذ.
 *    A11Y-DIALOG-001: اللوحة `<dialog>` أصلي تُفتح بـ showModal() — الحبس +
 *    Esc + عودة التركيز + تعطيل الصفحة من المتصفح (بدون focus-trap.js).
 *  - مبدّل الدور [data-kernel-role]: يحفظ في localStorage ويضع body[data-role].
 *  - (تمت الإزالة) مبدّل العرض التوضيحي — راجع BAI-P0-TRUTH-001 بالأسفل.
 *
 * CSP: ES module خارجي، لا unsafe-inline. بيانات تجريبية — لا تخزين.
 *
 * BAI-P0-TRUTH-001 (2026-08-09): the demo-mode toggle was removed. The
 * Kernel surfaces only deterministic/demo data — there is no live source
 * to switch to — so the previous [data-kernel-demo-toggle] control only
 * flipped body[data-demo] + a label with zero consumers, i.e. the
 * forbidden "control that changes label + CSS only". Disclosure is now
 * a fixed "Mode: Demo" chip in the topbar + a static KernelDemoPill.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var ROLE_KEY = 'brightai-kernel-role';

  /* ── الشِل + اختصارات قائمة ──────────────────────────────────────── */
  function initShell() {
    if (document.body && !document.body.classList.contains('kernel-shell')) {
      document.body.classList.add('kernel-shell');
    }
  }

  function handleShortcuts(e) {
    // A11Y-DIALOG-001: لا تنقّل خارج اللوحة الأوامر المفتوحة (modal).
    if (isPaletteOpen()) return;
    var target = e.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) return;
    if (target && target.isContentEditable) return;
    if (!e.ctrlKey && !e.metaKey) return;
    var key = (e.key || '').toLowerCase();
    if (key === 'c') window.location.href = '/kernel/chat/';
    else if (key === 'a') window.location.href = '/kernel/approvals/';
    else if (key === 's') window.location.href = '/kernel/stats/';
    else if (key === 't') window.location.href = '/kernel/audit/';
    else if (key === 'r') window.location.reload();
  }

  /* ── لوحة الأوامر ─────────────────────────────────────────────────── */
  // A11Y-DIALOG-001 (2026-08-09): لوحة الأوامر صارت `<dialog>` أصلي وتُفتح
  // عبر showModal(). الحبس (focus trap) + Esc + عودة التركيز للـ opener +
  // تعطيل باقي الصفحة (inert) كلها مضمونة من المتصفح — بدون الاعتماد على
  // focus-trap.js. الحالة تُقرأ من `dialog.open` (لا aria-hidden).
  function getPalette() { return document.getElementById('k-cmdk'); }

  function openPalette() {
    var p = getPalette();
    if (!p) return;
    if (!p.open) p.showModal(); // showModal يركّز أول focusable (الحقل) تلقائيًا
    var input = p.querySelector('[data-kernel-cmdk-input]');
    if (input) {
      // أعد تعيين القائمة وعلّم أول عنصر (بدون سرقة التركيز من الحقل —
      // المستخدم يكتب فورًا، والأسهم تنقل التركيز للقائمة).
      requestAnimationFrame(function () { filterPalette(''); });
    }
  }

  function closePalette() {
    var p = getPalette();
    if (!p) return;
    if (p.open) p.close(); // يعيد التركيز للـ opener تلقائيًا
  }

  function isPaletteOpen() {
    var p = getPalette();
    return !!p && p.open === true;
  }

  function visibleItems() {
    var p = getPalette();
    if (!p) return [];
    return Array.from(p.querySelectorAll('.k-cmdk__item')).filter(function (el) {
      return el.offsetParent !== null && !el.hidden;
    });
  }

  function markActive(item) {
    var p = getPalette();
    if (!p) return;
    p.querySelectorAll('.k-cmdk__item--active').forEach(function (el) {
      el.classList.remove('k-cmdk__item--active');
      el.removeAttribute('aria-selected');
    });
    if (item) {
      item.classList.add('k-cmdk__item--active');
      item.setAttribute('aria-selected', 'true');
    }
  }

  function setActiveItem(item) {
    markActive(item);
    if (item) item.focus({ preventScroll: false });
  }

  function filterPalette(query) {
    var p = getPalette();
    if (!p) return;
    var q = (query || '').trim().toLowerCase();
    var anyVisible = false;
    p.querySelectorAll('.k-cmdk__item').forEach(function (el) {
      var name = el.querySelector('.k-cmdk__item-name');
      var text = (name ? name.textContent : el.textContent).toLowerCase();
      var match = !q || text.indexOf(q) !== -1;
      el.hidden = !match;
      el.classList.remove('k-cmdk__item--active');
      el.removeAttribute('aria-selected');
      if (match) anyVisible = true;
    });
    // أخفِ المجموعات الفارغة.
    p.querySelectorAll('.k-cmdk__group').forEach(function (g) {
      var hasVisible = Array.from(g.querySelectorAll('.k-cmdk__item')).some(function (el) { return !el.hidden; });
      g.hidden = !hasVisible;
    });
    var empty = p.querySelector('[data-kernel-cmdk-empty]');
    if (empty) empty.hidden = anyVisible;
    // علّم أول عنصر مرئي (بدون نقل التركيز — الحقل يبقى مركز الكتابة).
    var items = visibleItems();
    if (items.length) markActive(items[0]); else markActive(null);
  }

  function handlePaletteKeys(e) {
    if (!isPaletteOpen()) return;
    var key = e.key;
    var items = visibleItems();
    if (!items.length) return;
    var currentIndex = items.indexOf(document.activeElement);
    if (key === 'ArrowDown') {
      e.preventDefault();
      var next = currentIndex < 0 ? items[0] : items[(currentIndex + 1) % items.length];
      setActiveItem(next);
    } else if (key === 'ArrowUp') {
      e.preventDefault();
      var prev = currentIndex <= 0 ? items[items.length - 1] : items[currentIndex - 1];
      setActiveItem(prev);
    } else if (key === 'Enter') {
      // لو التركيز على الحقل، نفّذ العنصر النشط.
      var active = document.activeElement;
      var target = (active && active.classList && active.classList.contains('k-cmdk__item'))
        ? active : items[0];
      if (target) {
        e.preventDefault();
        target.click();
      }
    }
  }

  function runCommand(cmd) {
    switch (cmd) {
      case 'run-scenario': window.location.href = '/kernel/scenarios/'; break;
      case 'open-trace': {
        closePalette();
        var drawer = document.getElementById('k-trace-drawer');
        if (drawer) drawer.setAttribute('aria-hidden', 'false');
        break;
      }
      case 'gen-report': window.location.href = '/kernel/reports/'; break;
    }
  }

  function initPalette() {
    var p = getPalette();
    if (!p) return;

    // A11Y-DIALOG-001: نقر خارج اللوحة (على خلفية ::backdrop) يغلق؛ Esc يعالجه
    // الـ dialog الأصلي (event cancel) وننظف تمييز العنصر فقط.
    if (p.dataset.boundNative !== '1') {
      p.dataset.boundNative = '1';
      p.addEventListener('click', function (e) {
        if (e.target === p) closePalette();
      });
      p.addEventListener('cancel', function () {
        markActive(null); // نسمح لـ dialog بالغلق، فقط نزيل التمييز.
      });
    }

    // فتح من زر الشريط.
    document.querySelectorAll('[data-kernel-cmdk-open]').forEach(function (btn) {
      if (btn.dataset.bound === '1') return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', openPalette);
    });
    // تصفية.
    var input = p.querySelector('[data-kernel-cmdk-input]');
    if (input && input.dataset.bound !== '1') {
      input.dataset.bound = '1';
      input.addEventListener('input', function () { filterPalette(input.value); });
    }
    // الأوامر السريعة.
    p.querySelectorAll('.k-cmdk__item[data-cmd]').forEach(function (el) {
      if (el.dataset.boundCmd === '1') return;
      el.dataset.boundCmd = '1';
      el.addEventListener('click', function () { runCommand(el.getAttribute('data-cmd')); });
    });
  }

  /* ── مبدّل الدور ──────────────────────────────────────────────────── */
  // KRN-IA-001 (2026-08-09): نطلق حدث `kernel:role-change` عند كل تغيير
  // (محفوظ أول مرة + تغيير يدوي) عشان يلتقطه kernel-sidebar.js ويعيد
  // ترتيب المجموعات + بناء الـ pinned strip. KernelRoleSelector في
  // الفهرس يطلق نفس الحدث — مصدر واحد للإشارة.
  function announceRole(role) {
    document.body.setAttribute('data-role', role);
    try {
      window.dispatchEvent(new CustomEvent('kernel:role-change', { detail: { role: role } }));
    } catch (e) { /* CustomEvent مدعومة في كل المتصفحات المدعومة */ }
  }

  function initRole() {
    var select = document.querySelector('[data-kernel-role]');
    if (!select) return;
    try {
      var saved = localStorage.getItem(ROLE_KEY);
      if (saved) {
        select.value = saved;
        announceRole(saved);
      } else {
        announceRole(select.value || 'dpo');
      }
    } catch (e) {
      announceRole('dpo');
    }
    if (select.dataset.bound === '1') return;
    select.dataset.bound = '1';
    select.addEventListener('change', function () {
      var v = select.value;
      try { localStorage.setItem(ROLE_KEY, v); } catch (e) {}
      announceRole(v);
    });
  }

  /* ── ⌘K عام + أسهم اللوحة + Esc احتياطي ─────────────────────────── */
  function handleGlobalKeys(e) {
    // ⌘K / Ctrl+K
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (isPaletteOpen()) closePalette(); else openPalette();
      return;
    }
    handlePaletteKeys(e);
  }

  /* ── init ─────────────────────────────────────────────────────────── */
  function init() {
    initShell();
    initPalette();
    initRole();
  }

  document.addEventListener('astro:page-load', function () {
    initShell();
    initPalette();
    initRole();
  });
  document.removeEventListener('keydown', handleShortcuts);
  document.addEventListener('keydown', handleShortcuts);
  document.removeEventListener('keydown', handleGlobalKeys);
  document.addEventListener('keydown', handleGlobalKeys);
  if (document.readyState !== 'loading') initShell();
})();
