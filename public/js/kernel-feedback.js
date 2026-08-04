/**
 * kernel-feedback.js — Kernel shared feedback layer: undo toast + confirm dialog.
 *
 * مكوّنات مشتركة لكل صفحات /kernel/* (الموافقات، السياسات، ...):
 *   - توست نجاح مع زر «تراجع» (نافذة 10 ثوانٍ افتراضية).
 *   - مودال تأكيد للإجراءات الخطرة (danger/warning/info).
 *
 * المعمارية: helper واحد محمّل من KernelLayout (CSP-safe ES module خارجي،
 * لا unsafe-inline). يربط DOM الـ markup الثابت من مكوّني
 * KernelUndoToast.astro + KernelConfirmDialog.astro عبر data-* attributes.
 *
 * الواجهة:
 *   window.KernelFeedback.toast.show({ message, duration?, onUndo? })
 *   window.KernelFeedback.toast.hide()
 *   window.KernelFeedback.confirm.open({ title, message, variant?, confirmLabel?, onConfirm })
 *   window.KernelFeedback.confirm.close()
 *
 * قواعد (مطابقة Prompts):
 *   - الـ undo متاح لـ 10 ثوانٍ فقط ثم يُهجر (لا ذاكرة persist — security).
 *   - الـ toast يخفي نفسه تلقائياً (role=status + aria-live=polite).
 *   - Enter = تأكيد، Escape = إلغاء، Tab بين الأزرار، focus ينتقل للزر المؤكد.
 *   - RTL-aware عبر المكوّنات. touch targets ≥44px في الأنماط.
 *
 * NOTE: زر «تراجع» يبقى focusable حتى نهاية النافذة ثم يُخفى.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var UNDO_DEFAULT_MS = 10000;
  var TOAST_PLAIN_MS = 3000;
  var CONFIRM_SELECTOR = '[data-kernel-confirm]';

  // ── toast ──────────────────────────────────────────────────────────────
  function getToast() {
    var el = document.getElementById('k-toast');
    if (!el) return null;
    return {
      el: el,
      msg: el.querySelector('[data-kernel-toast-msg]'),
      undo: el.querySelector('[data-kernel-toast-undo]'),
      close: el.querySelector('[data-kernel-toast-close]'),
    };
  }

  var toastTimer = null;
  var toastUndoHandler = null;

  function bindToast() {
    var t = getToast();
    if (!t || !t.el || t.el.dataset.fbBound === '1') return;
    t.el.dataset.fbBound = '1';

    if (t.undo) {
      t.undo.addEventListener('click', function () {
        var fn = toastUndoHandler;
        hideToast();
        if (typeof fn === 'function') {
          try { fn(); } catch (e) { /* noop */ }
        }
      });
    }
    if (t.close) t.close.addEventListener('click', hideToast);
  }

  function hideToast() {
    var t = getToast();
    if (!t || !t.el) return;
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    toastUndoHandler = null;
    if (t.undo) t.undo.hidden = true;
    t.el.hidden = true;
  }

  /**
   * يعرض توست. بدون onUndo → رسالة عادية 3 ثوانٍ.
   * مع onUndo → زر «تراجع» يظهر لمدة duration (افتراضية 10 ثوانٍ).
   * @param {{ message: string, duration?: number, onUndo?: function }} opts
   */
  function showToast(opts) {
    opts = opts || {};
    var t = getToast();
    if (!t || !t.el) return;
    var hasUndo = typeof opts.onUndo === 'function';
    var duration = hasUndo
      ? (typeof opts.duration === 'number' ? opts.duration : UNDO_DEFAULT_MS)
      : TOAST_PLAIN_MS;

    if (t.msg) t.msg.textContent = opts.message || 'تم.';
    toastUndoHandler = hasUndo ? opts.onUndo : null;
    if (t.undo) t.undo.hidden = !hasUndo;
    t.el.hidden = false;

    if (toastTimer) clearTimeout(toastTimer);
    if (!hasUndo) {
      toastTimer = setTimeout(hideToast, duration);
    } else {
      // نافذة الـ undo: بعد انتهائها يُخفى الزر ويُهجر الـ handler.
      toastTimer = setTimeout(function () {
        toastUndoHandler = null;
        var t2 = getToast();
        if (t2 && t2.undo) t2.undo.hidden = true;
        if (t2 && t2.el) t2.el.hidden = true;
      }, duration);
    }
  }

  // ── confirm dialog ─────────────────────────────────────────────────────
  function getConfirm() {
    var el = document.querySelector(CONFIRM_SELECTOR);
    if (!el) return null;
    return {
      el: el,
      title: el.querySelector('[data-kernel-confirm-title]'),
      message: el.querySelector('[data-kernel-confirm-message]'),
      ok: el.querySelector('[data-kernel-confirm-ok]'),
    };
  }

  var confirmHandler = null;

  function bindConfirm() {
    var c = getConfirm();
    if (!c || !c.el || c.el.dataset.fbBound === '1') return;
    c.el.dataset.fbBound = '1';

    // الإغلاق: الخلفية + أزرار close/cancel.
    c.el.addEventListener('click', function (e) {
      if (e.target.closest('[data-kernel-confirm-close]')) {
        e.preventDefault();
        closeConfirm();
      }
    });

    // التأكيد: الزر الرئيسي.
    if (c.ok) {
      c.ok.addEventListener('click', function () {
        var fn = confirmHandler;
        closeConfirm();
        if (typeof fn === 'function') {
          try { fn(); } catch (err) { /* noop */ }
        }
      });
    }

    // Enter = تأكيد، Escape = إلغاء.
    c.el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var active = document.activeElement;
        var isButton = active && active.closest && active.closest('button');
        if (!isButton && c.ok) { e.preventDefault(); c.ok.click(); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closeConfirm();
      }
    });
  }

  function openConfirm(opts) {
    opts = opts || {};
    var c = getConfirm();
    if (!c || !c.el) {
      // بدون مكوّن في الصفحة → ننفّذ مباشرة (fallback صامت).
      if (typeof opts.onConfirm === 'function') opts.onConfirm();
      return;
    }
    if (c.title) c.title.textContent = opts.title || 'تأكيد الإجراء';
    if (c.message) c.message.textContent = opts.message || '';
    if (c.ok) c.ok.textContent = opts.confirmLabel || 'تأكيد';
    if (c.ok) c.ok.className = 'kernel-modal__btn kernel-modal__btn--confirm kernel-modal__btn--' + (opts.variant || 'danger');
    c.el.setAttribute('data-variant', opts.variant || 'danger');
    c.el.setAttribute('data-open', 'true');
    c.el.setAttribute('aria-hidden', 'false');
    confirmHandler = typeof opts.onConfirm === 'function' ? opts.onConfirm : null;
    if (c.ok) c.ok.focus();
  }

  function closeConfirm() {
    var c = getConfirm();
    confirmHandler = null;
    if (!c || !c.el) return;
    c.el.setAttribute('data-open', 'false');
    c.el.setAttribute('aria-hidden', 'true');
  }

  // ── boot ───────────────────────────────────────────────────────────────
  function init() {
    bindToast();
    bindConfirm();
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

  window.KernelFeedback = {
    toast: { show: showToast, hide: hideToast },
    confirm: { open: openConfirm, close: closeConfirm },
  };
})();
