/**
 * kernel-evidence-certs.js — PROMPT-3 engine for the signed-certificates
 * section + verification modal on /kernel/evidence/.
 *
 * CSP-safe module. Loaded via <script type="module" src="/js/...">.
 * Imports the compiled client module /js/certificate-verifier.js via ESM
 * (guaranteed load order — no race on window global).
 *
 * Behavior:
 *   1. On page load → fetchCertificates(limit=50) with admin-key pattern.
 *      - 200 → render real cryptographically-signed certificates.
 *      - 401/403 → info banner ("أدخل مفتاح الإدارة"), hide grid+empty.
 *      - network/server error → error banner, keep grid empty.
 *   2. Each certificate card → "تحقق" button opens the modal and calls
 *      verifyCertificate(id). Result is server-authoritative.
 *   3. Modal exposes Download PDF + Download JSON (client-generated,
 *      minimal PDF — no external lib).
 *
 * No Math.random, no Date.now in rendering (deterministic display).
 */

import {
  fetchCertificates,
  verifyCertificate,
  downloadCertificatePdf,
  downloadCertificateJson,
} from '/js/certificate-verifier.js';

const CV = {
  fetchCertificates,
  verifyCertificate,
  downloadCertificatePdf,
  downloadCertificateJson,
};

(function () {
  'use strict';
  if (!CV) return;

  /** @returns {HTMLElement|null} */
  const $ = (q, root = document) => root.querySelector(q);
  /** @returns {HTMLElement[]} */
  const $$ = (q, root = document) =>
    Array.prototype.slice.call(root.querySelectorAll(q));

  const root = $('[data-kernel-certs-root]');
  if (!root) return;

  const els = {
    status: $('[data-kernel-certs-status]', root),
    banner: $('[data-kernel-certs-banner]', root),
    skeleton: $('[data-kernel-certs-skeleton]', root),
    empty: $('[data-kernel-certs-empty]', root),
    grid: $('[data-kernel-certs-grid]', root),
    refresh: $('[data-kernel-certs-refresh]', root),
    // modal
    modal: $('[data-kernel-certs-modal]'),
    modalLoading: $('[data-kernel-certs-modal-loading]'),
    modalResult: $('[data-kernel-certs-modal-result]'),
    modalStatusBadge: $('[data-kernel-certs-modal-status-badge]'),
    modalClientNote: $('[data-kernel-certs-modal-clientnote]'),
    modalCertId: $('[data-kernel-certs-modal-certid]'),
    modalSignedBy: $('[data-kernel-certs-modal-signedby]'),
    modalSignedAt: $('[data-kernel-certs-modal-signedat]'),
    modalEnv: $('[data-kernel-certs-modal-env]'),
    modalGate: $('[data-kernel-certs-modal-gate]'),
    modalHashChain: $('[data-kernel-certs-modal-hashchain]'),
    modalRevokeRow: $('[data-kernel-certs-modal-revoke-reason]'),
    modalMessage: $('[data-kernel-certs-modal-message]'),
    modalVerifyUrlWrap: $('[data-kernel-certs-modal-verifyurl-wrap]'),
    modalVerifyUrl: $('[data-kernel-certs-modal-verifyurl]'),
    modalDlJson: $('[data-kernel-certs-modal-download-json]'),
    modalDlPdf: $('[data-kernel-certs-modal-download-pdf]'),
  };

  let currentCert = null; // PublicCertificate | null (for downloads)

  /* ── Helpers ─────────────────────────────────────────────────────── */

  function showBanner(kind, html) {
    if (!els.banner) return;
    els.banner.hidden = false;
    els.banner.className = 'kernel-evidence-certs__banner kernel-evidence-certs__banner--' + kind;
    els.banner.innerHTML = html;
  }
  function hideBanner() {
    if (els.banner) els.banner.hidden = true;
  }

  function setStatus(text) {
    if (els.status) els.status.textContent = text;
  }

  function hideAll() {
    if (els.skeleton) els.skeleton.hidden = true;
    if (els.empty) els.empty.hidden = true;
    if (els.grid) els.grid.innerHTML = '';
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return escapeHtml(String(iso));
      return d.toLocaleString('ar-SA-u-nu-latn', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
      });
    } catch (e) {
      return escapeHtml(String(iso));
    }
  }

  const GATE_LABEL_AR = {
    passed: 'مقبول',
    blocked: 'محظور',
    incomplete: 'غير مكتمل',
  };

  /* ── Render ──────────────────────────────────────────────────────── */

  function renderCerts(certs) {
    hideAll();
    if (!certs || certs.length === 0) {
      if (els.empty) els.empty.hidden = false;
      setStatus('لا توجد شهادات.');
      return;
    }
    setStatus(`${certs.length} شهادة موقّعة رقمياً.`);
    if (!els.grid) return;

    const frag = document.createDocumentFragment();
    certs.forEach((cert) => {
      const card = document.createElement('article');
      card.className =
        'kernel-evidence-certs__card' +
        (cert.revokedAt ? ' kernel-evidence-certs__card--revoked' : '');
      card.setAttribute('data-cert-card', cert.certificateId);

      const envBadge = cert.environment === 'live'
        ? '<span class="kernel-certs-badge kernel-certs-badge--live">إنتاج</span>'
        : '<span class="kernel-certs-badge kernel-certs-badge--demo">عرض تجريبي</span>';
      const revokeBadge = cert.revokedAt
        ? '<span class="kernel-certs-badge kernel-certs-badge--revoked">مسحوبة</span>'
        : '';
      const gateClass =
        'kernel-certs-badge--gate-' + (GATE_LABEL_AR[cert.gate] ? cert.gate : 'incomplete');
      const gateLabel = GATE_LABEL_AR[cert.gate] || escapeHtml(cert.gate);

      card.innerHTML =
        '<div class="kernel-evidence-certs__card-head">' +
          '<span class="kernel-evidence-certs__certid">' + escapeHtml(cert.certificateId) + '</span>' +
          '<span class="kernel-evidence-certs__badges">' + envBadge + revokeBadge +
            '<span class="kernel-certs-badge ' + gateClass + '">البوابة: ' + gateLabel + '</span>' +
          '</span>' +
        '</div>' +
        '<dl class="kernel-evidence-certs__meta">' +
          '<dt>وقّعت بواسطة</dt><dd>' + escapeHtml(cert.signedBy || '—') + '</dd>' +
          '<dt>تاريخ التوقيع</dt><dd>' + formatDate(cert.issuedAt) + '</dd>' +
          (cert.revokedAt
            ? '<dt>تاريخ السحب</dt><dd>' + formatDate(cert.revokedAt) + '</dd>' +
              '<dt>سبب السحب</dt><dd>' + escapeHtml(cert.revocationReason || cert.revokeReason || '—') + '</dd>'
            : '') +
          '<dt>رابط التحقق</dt><dd>' +
            '<a href="' + escapeHtml(cert.verifyUrl || '#') + '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml((cert.verifyUrl || '—').replace(/^https?:\/\//, '')) +
            '</a>' +
          '</dd>' +
        '</dl>' +
        '<div class="kernel-evidence-certs__actions">' +
          '<button type="button" class="kernel-evidence-certs__btn kernel-evidence-certs__btn--verify" ' +
            'data-cert-verify="' + escapeHtml(cert.certificateId) + '" data-kernel-touch>' +
            '<span aria-hidden="true">🛡</span><span>تحقق من التوقيع</span>' +
          '</button>' +
          '<button type="button" class="kernel-evidence-certs__btn" ' +
            'data-cert-json="' + escapeHtml(cert.certificateId) + '" data-kernel-touch>' +
            '<span aria-hidden="true">#</span><span>JSON</span>' +
          '</button>' +
          '<button type="button" class="kernel-evidence-certs__btn" ' +
            'data-cert-pdf="' + escapeHtml(cert.certificateId) + '" data-kernel-touch>' +
            '<span aria-hidden="true">⬇</span><span>PDF</span>' +
          '</button>' +
        '</div>';

      frag.appendChild(card);
    });
    els.grid.appendChild(frag);
  }

  /* ── Fetch ───────────────────────────────────────────────────────── */

  async function loadCerts() {
    if (els.refresh) els.refresh.disabled = true;
    if (els.skeleton) els.skeleton.hidden = false;
    if (els.grid) els.grid.innerHTML = '';
    if (els.empty) els.empty.hidden = true;
    hideBanner();
    setStatus('جارٍ التحميل…');

    const res = await CV.fetchCertificates(50);

    if (els.skeleton) els.skeleton.hidden = true;
    if (els.refresh) els.refresh.disabled = false;

    if (!res.ok) {
      if (res.error === 'unauthorized') {
        showBanner(
          'info',
          'قائمة الشهادات محمية. <a href="#" data-cert-admin-hint>أدخل مفتاح الإدارة</a> لعرض الشهادات الحية، أو تصفّح ملفات الأدلة التجريبية بالأسفل.'
        );
        const hint = $('[data-cert-admin-hint]', els.banner);
        if (hint) {
          hint.addEventListener('click', (e) => {
            e.preventDefault();
            const key = window.prompt('أدخل مفتاح الإدارة (x-brightai-admin-key):');
            if (key) {
              try { localStorage.setItem('brightai-admin-key', key); } catch (err) { /* ignore */ }
              loadCerts();
            }
          });
        }
      } else {
        showBanner('error', escapeHtml(res.arabicMessage || 'تعذّر تحميل الشهادات.'));
      }
      setStatus('—');
      if (els.empty) els.empty.hidden = true;
      return;
    }

    renderCerts(res.data);
  }

  /* ── Verify modal ────────────────────────────────────────────────── */

  function openModal() {
    if (!els.modal) return;
    els.modal.setAttribute('data-open', 'true');
    els.modal.setAttribute('aria-hidden', 'false');
    const close = $('.kernel-modal__close', els.modal);
    if (close) setTimeout(() => close.focus(), 50);
  }

  function closeModal() {
    if (!els.modal) return;
    els.modal.setAttribute('data-open', 'false');
    els.modal.setAttribute('aria-hidden', 'true');
  }

  function statusBadgeHtml(status) {
    const map = {
      valid: ['kernel-certs-modal__badge--valid', '✓ الشهادة صالحة'],
      revoked: ['kernel-certs-modal__badge--revoked', '✕ الشهادة مسحوبة'],
      tampered: ['kernel-certs-modal__badge--invalid', '✕ توقيع غير صالح'],
      'digest-mismatch': ['kernel-certs-modal__badge--invalid', '✕ المحتوى مُعدّل'],
      'not-found': ['kernel-certs-modal__badge--invalid', '✕ غير موجودة'],
      'key-missing': ['kernel-certs-modal__badge--invalid', '✕ مفتاح مفقود'],
      incomplete: ['kernel-certs-modal__badge--pending', '! حمولة ناقصة'],
      'network-error': ['kernel-certs-modal__badge--pending', '! خطأ شبكة'],
    };
    const [cls, label] = map[status] || map['network-error'];
    return '<span class="kernel-certs-modal__badge ' + cls + '">' + label + '</span>';
  }

  function clientNoteHtml(clientSide) {
    if (clientSide === 'valid') return '(تحقق محلي سريع: ✓)';
    if (clientSide === 'failed') return '(تحقق محلي سريع: تنبيه — راجع نتيجة الخادم)';
    return '(التحقق من الخادم)';
  }

  function renderVerification(result) {
    currentCert = result; // keep id + fields for downloads

    if (els.modalLoading) els.modalLoading.hidden = true;
    if (els.modalResult) els.modalResult.hidden = false;
    if (els.modalStatusBadge) els.modalStatusBadge.innerHTML = statusBadgeHtml(result.status);
    if (els.modalClientNote) els.modalClientNote.textContent = clientNoteHtml(result.clientSide);
    if (els.modalCertId) els.modalCertId.textContent = result.certificateId || '—';
    if (els.modalSignedBy) els.modalSignedBy.textContent = result.signedBy || '—';
    if (els.modalSignedAt) els.modalSignedAt.textContent = formatDate(result.signedAt);
    if (els.modalEnv) els.modalEnv.textContent = result.environment || '—';
    if (els.modalGate) {
      const g = result.gate;
      els.modalGate.textContent = GATE_LABEL_AR[g] || g || '—';
    }
    if (els.modalHashChain) {
      if (result.hashChainValid === true) els.modalHashChain.textContent = '✓ سليمة';
      else if (result.hashChainValid === false) els.modalHashChain.textContent = '✕ مكسورة';
      else els.modalHashChain.textContent = '— (لا تُفحص من المتصفح)';
    }
    if (els.modalRevokeRow) {
      if (result.revoked && result.revokedReason) {
        els.modalRevokeRow.hidden = false;
        els.modalRevokeRow.textContent = result.revokedReason;
      } else {
        els.modalRevokeRow.hidden = true;
      }
    }
    if (els.modalMessage) els.modalMessage.textContent = result.arabicMessage || '';
  }

  async function verifyAndOpen(certId) {
    if (!certId) return;
    // reset
    currentCert = null;
    if (els.modalResult) els.modalResult.hidden = true;
    if (els.modalLoading) els.modalLoading.hidden = false;
    if (els.modalStatusBadge) els.modalStatusBadge.innerHTML = '';
    if (els.modalMessage) els.modalMessage.textContent = '';
    if (els.modalVerifyUrlWrap) els.modalVerifyUrlWrap.hidden = true;
    openModal();

    const result = await CV.verifyCertificate(certId);

    // Show verify URL if we got one from a cert object (server-side may
    // include it in the metadata; otherwise we construct a public one).
    if (els.modalVerifyUrl && els.modalVerifyUrlWrap) {
      const url = result.status !== 'not-found'
        ? (window.location.origin + '/api/kernel/certificates/verify?id=' + encodeURIComponent(certId))
        : null;
      if (url) {
        els.modalVerifyUrl.href = url;
        els.modalVerifyUrlWrap.hidden = false;
      }
    }

    renderVerification(result);
  }

  /* ── Downloads ───────────────────────────────────────────────────── */

  function downloadForCurrentCert(kind) {
    if (!currentCert) return;
    // Build a PublicCertificate-shaped object from the verification result.
    const cert = {
      certificateId: currentCert.certificateId,
      signedBy: currentCert.signedBy || '—',
      issuedAt: currentCert.signedAt || new Date().toISOString(),
      environment: currentCert.environment || 'demo',
      gate: currentCert.gate || 'incomplete',
      verifyUrl:
        window.location.origin +
        '/api/kernel/certificates/verify?id=' +
        encodeURIComponent(currentCert.certificateId),
      revokedAt: currentCert.revoked ? new Date().toISOString() : null,
    };
    if (kind === 'pdf') CV.downloadCertificatePdf(cert);
    else CV.downloadCertificateJson(cert);
  }

  /* ── Event bindings ──────────────────────────────────────────────── */

  function bindEvents() {
    // refresh
    if (els.refresh && !els.refresh.dataset.bound) {
      els.refresh.dataset.bound = '1';
      els.refresh.addEventListener('click', loadCerts);
    }
    // delegated: verify / json / pdf buttons on cards
    document.addEventListener('click', (e) => {
      const verifyBtn = e.target.closest('[data-cert-verify]');
      if (verifyBtn) {
        e.preventDefault();
        verifyAndOpen(verifyBtn.getAttribute('data-cert-verify'));
        return;
      }
      const jsonBtn = e.target.closest('[data-cert-json]');
      if (jsonBtn) {
        e.preventDefault();
        const id = jsonBtn.getAttribute('data-cert-json');
        // need the cert object → re-fetch the single verify, then download
        CV.verifyCertificate(id).then((r) => {
          currentCert = r;
          downloadForCurrentCert('json');
        });
        return;
      }
      const pdfBtn = e.target.closest('[data-cert-pdf]');
      if (pdfBtn) {
        e.preventDefault();
        const id = pdfBtn.getAttribute('data-cert-pdf');
        CV.verifyCertificate(id).then((r) => {
          currentCert = r;
          downloadForCurrentCert('pdf');
        });
        return;
      }
      // evidence-item verify buttons (PROMPT-3 wired in the static cards)
      const evVerifyBtn = e.target.closest('[data-kernel-certs-verify]');
      if (evVerifyBtn) {
        e.preventDefault();
        verifyAndOpen(evVerifyBtn.getAttribute('data-kernel-certs-verify'));
        return;
      }
      // modal close (backdrop / close buttons)
      const closeTarget = e.target.closest('[data-kernel-certs-close]');
      if (closeTarget) {
        closeModal();
        return;
      }
    });

    // modal downloads
    if (els.modalDlJson && !els.modalDlJson.dataset.bound) {
      els.modalDlJson.dataset.bound = '1';
      els.modalDlJson.addEventListener('click', () => downloadForCurrentCert('json'));
    }
    if (els.modalDlPdf && !els.modalDlPdf.dataset.bound) {
      els.modalDlPdf.dataset.bound = '1';
      els.modalDlPdf.addEventListener('click', () => downloadForCurrentCert('pdf'));
    }

    // Escape closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && els.modal && els.modal.getAttribute('data-open') === 'true') {
        closeModal();
      }
    });
  }

  /* ── Init ────────────────────────────────────────────────────────── */

  function init() {
    bindEvents();
    loadCerts();
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();
