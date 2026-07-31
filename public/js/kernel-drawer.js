/**
 * kernel-drawer.js — درج الرحلة (Trace Drawer).
 *
 * تحديث 2026-07-31: أُعيد كتابته من «درج تنقّل الموبايل القديم» إلى
 * درج الرحلة المشترك (مطابقة تصميم-صفحات-kernel §2.4).
 *
 * السلوك:
 *  - يفتح بأي عنصر [data-trace-id] (نقرة)، أو بتقديم بحث Trace ID في الشريط العلوي.
 *  - الظهور يُدار عبر aria-hidden على #k-trace-drawer؛ focus-trap.js (عام)
 *    يربط تلقائيًا role=dialog+aria-modal ويتكفّل بـ Tab/Escape وإرجاع التركيز
 *    لمصدر الفتح. هنا نكتفي بتبديل aria-hidden + قفل تمرير body.
 *  - نسخ Trace ID + تحديث رقمه/شارة الحكم من مصدر الفتح (عند توفر البيانات).
 *  - متوافق مع astro:page-load (view transitions) — إعادة ربط في كل تنقّل.
 *
 * CSP: ES module خارجي (مستورد بـ side-effect من KernelLayout)، لا unsafe-inline.
 * بيانات تجريبية — لا تخزين.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var SCROLL_LOCK_COUNT = 0;

  function lockScroll() {
    SCROLL_LOCK_COUNT += 1;
    if (SCROLL_LOCK_COUNT === 1) document.body.style.overflow = 'hidden';
  }
  function unlockScroll() {
    SCROLL_LOCK_COUNT = Math.max(0, SCROLL_LOCK_COUNT - 1);
    if (SCROLL_LOCK_COUNT === 0) document.body.style.overflow = '';
  }

  function getDrawer() {
    return document.getElementById('k-trace-drawer');
  }

  function openDrawer(traceId) {
    var drawer = getDrawer();
    if (!drawer) return;
    if (traceId) {
      var idEl = drawer.querySelector('[data-kernel-trace-id]');
      if (idEl) idEl.textContent = traceId;
    }
    // focus-trap.js يراقب aria-hidden ويفتح الفخ + ينقل التركيز.
    drawer.setAttribute('aria-hidden', 'false');
  }

  function closeDrawer() {
    var drawer = getDrawer();
    if (!drawer) return;
    // focus-trap.js سيتكفّل بإرجاع التركيز لمصدر الفتح وإغلاق الفخ.
    drawer.setAttribute('aria-hidden', 'true');
  }

  function isOpen() {
    var drawer = getDrawer();
    return !!drawer && drawer.getAttribute('aria-hidden') === 'false';
  }

  function init() {
    var drawer = getDrawer();
    if (!drawer) return;

    // قفل/تحرير scroll متزامن مع دورة حياة focus-trap.
    drawer.addEventListener('a11y:modal-opened', lockScroll);
    drawer.addEventListener('a11y:modal-closed', unlockScroll);

    // أزرار/خلفية الإغلاق.
    drawer.querySelectorAll('[data-kernel-trace-close]').forEach(function (el) {
      if (el.dataset.bound === '1') return;
      el.dataset.bound = '1';
      el.addEventListener('click', closeDrawer);
    });

    // نسخ Trace ID.
    var copyBtn = drawer.querySelector('[data-kernel-trace-copy]');
    if (copyBtn && copyBtn.dataset.bound !== '1') {
      copyBtn.dataset.bound = '1';
      copyBtn.addEventListener('click', function () {
        var idEl = drawer.querySelector('[data-kernel-trace-id]');
        var val = idEl ? idEl.textContent.trim() : '';
        if (!val) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(val).catch(function () {});
        }
        // توست نجاح خفيف.
        var toast = document.getElementById('k-toast');
        if (toast) {
          var msg = toast.querySelector('[data-kernel-toast-msg]');
          if (msg) msg.textContent = 'نسخت Trace ID';
          toast.hidden = false;
          window.setTimeout(function () { toast.hidden = true; }, 3000);
        }
      });
    }

    // عناصر [data-trace-id] في أي صفحة — تفتح الدرج.
    document.querySelectorAll('[data-trace-id]').forEach(function (el) {
      if (el.dataset.boundTrace === '1') return;
      el.dataset.boundTrace = '1';
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openDrawer(el.getAttribute('data-trace-id') || undefined);
      });
    });

    // بحث Trace ID في الشريط العلوي.
    var form = document.querySelector('[data-kernel-trace-search]');
    if (form && form.dataset.bound !== '1') {
      form.dataset.bound = '1';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('[data-kernel-trace-input]');
        var val = input ? input.value.trim() : '';
        openDrawer(val || 'AI-2026-10493');
      });
    }
  }

  // Esc إضافي احتياطي (focus-trap يعالجها بالأساس داخل الفخ).
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) closeDrawer();
  });

  document.addEventListener('astro:page-load', init);
})();
