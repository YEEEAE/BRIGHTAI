/**
 * kernel-evidence-certs.ts — engine قسم الشهادات في /kernel/evidence/ (PROMPT-3).
 *
 * يعرض الشهادات الحقيقية من `evaluation_certificates` عبر /api/kernel/certificates
 *، مع زر Verify (server-side) وتنزيل PDF/JSON.
 *
 * القاعدة الحاكمة (EVAL-CERT-007): الحكم النهائي دائمًا server-side. الـ Web
 * Crypto المتصفحي فحص أولي فقط — الحكم المعروض للمستخدم = نتيجة الخادم.
 * الزائر بلا مفتاح إدارة يستلم 403 → banner مهذب + خيار إدخال المفتاح.
 *
 * Accessibility:
 *   - كل تحديث حالة عبر aria-live.
 *   - المودال يعيد التركيز للمصدر + يغلق بـ Esc.
 *   - الحالات لها نص وصفي لا لون فقط.
 *
 * RTL: العربية كل عناصر، logical properties في الـ CSS.
 */
import { fetchCertificates, verifyCertificate, downloadCertificatePdf, downloadCertificateJson, } from './certificate-verifier.js';
/* ── DOM helpers (نفس نمط بقية الـ engines) ───────────────────────── */
function el(q, root = document) {
    return root.querySelector(q);
}
function elAll(q, root = document) {
    return Array.prototype.slice.call(root.querySelectorAll(q));
}
let ctx = null;
/* ── توحيد الحالة ────────────────────────────────────────────────── */
function setStatus(msg) {
    if (ctx)
        ctx.status.textContent = msg;
}
function setBanner(msg, kind = '') {
    if (!ctx)
        return;
    ctx.banner.textContent = msg;
    ctx.banner.hidden = msg.length === 0;
    ctx.banner.className = 'kernel-evidence-certs__banner';
    if (kind)
        ctx.banner.classList.add(`kernel-evidence-certs__banner--${kind}`);
    ctx.banner.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}
/* ── أيقونات SVG (مطابقة لـ evidence.astro) ──────────────────────── */
const ICONS = {
    cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
};
/* ── تنسيق التاريخ ────────────────────────────────────────────────── */
function formatDateTime(iso) {
    if (!iso)
        return '—';
    try {
        const d = new Date(iso);
        if (Number.isNaN(d.getTime()))
            return iso;
        return d.toLocaleString('ar-SA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }
    catch {
        return iso;
    }
}
/* ── تسميات الحالة / البيئة / البوابة (عربية) ─────────────────────── */
const GATE_LABEL = {
    passed: 'مسموح (Passed)',
    blocked: 'محظور (Blocked)',
    incomplete: 'غير مكتمل (Incomplete)',
};
const ENV_LABEL = {
    demo: 'تجريبي (Demo)',
    live: 'إنتاج (Live)',
};
function gateLabel(g) {
    const key = String(g || '');
    return GATE_LABEL[key] || g || '—';
}
function envLabel(e) {
    const key = String(e || '');
    return ENV_LABEL[key] || e || '—';
}
/* ── تعقيم بسيط للـ HTML (metadata من الخادم، لكن للحماية الإضافية) ── */
function esc(s) {
    return String(s ?? '—').replace(/["'<>&]/g, '');
}
/* ── بناء بطاقة شهادة ──────────────────────────────────────────────── */
function cardMarkup(c) {
    const revoked = !!c.revokedAt;
    const certId = esc(c.certificateId);
    const signedBy = esc(c.signedBy);
    const signedAt = formatDateTime(c.issuedAt);
    const gate = esc(gateLabel(c.gate));
    const env = esc(envLabel(c.environment));
    const revReason = esc(c.revocationReason ?? c.revokeReason ?? '');
    const verifyUrl = esc(c.verifyUrl);
    const envBadge = c.environment === 'demo'
        ? '<span class="kernel-evidence-certs__badge kernel-evidence-certs__badge--demo">Demo</span>'
        : '<span class="kernel-evidence-certs__badge kernel-evidence-certs__badge--live">إنتاج</span>';
    const revBadge = revoked
        ? '<span class="kernel-evidence-certs__badge kernel-evidence-certs__badge--revoked">مسحوبة</span>'
        : '';
    return `
    <article class="kernel-evidence-certs__card${revoked ? ' kernel-evidence-certs__card--revoked' : ''}" data-cert-id="${certId}">
      <header class="kernel-evidence-certs__card-head">
        <span class="kernel-evidence-certs__card-icon" aria-hidden="true">${ICONS.cert}</span>
        <div class="kernel-evidence-certs__card-title-block">
          <h3 class="kernel-evidence-certs__card-title">${certId}</h3>
          <p class="kernel-evidence-certs__card-sub">وقّعت بواسطة: ${signedBy}</p>
        </div>
        <span class="kernel-evidence-certs__card-badges">
          ${envBadge}${revBadge}
        </span>
      </header>

      <dl class="kernel-evidence-certs__card-meta">
        <div><dt>تاريخ التوقيع</dt><dd>${signedAt}</dd></div>
        <div><dt>قرار البوابة</dt><dd>${gate}</dd></div>
        <div><dt>البيئة</dt><dd>${env}</dd></div>
        <div><dt>حالة السحب</dt><dd>${revoked ? `مسحوبة — ${revReason || 'بدون سبب'}` : 'غير مسحوبة'}</dd></div>
      </dl>

      <footer class="kernel-evidence-certs__card-actions">
        <a class="kernel-evidence-certs__verifyurl" data-kernel-certs-verifyurl="${certId}" href="${verifyUrl || '#'}" ${verifyUrl ? 'target="_blank" rel="noopener noreferrer"' : 'aria-disabled="true"'} data-kernel-touch>
          ${ICONS.link}
          <span>رابط التحقق</span>
        </a>
        <button type="button" class="kernel-evidence-certs__btn kernel-evidence-certs__btn--verify" data-kernel-certs-verify="${certId}" data-kernel-touch>
          ${ICONS.shield}<span>تحقق</span>
        </button>
      </footer>
    </article>
  `;
}
/* ── Render القائمة ───────────────────────────────────────────────── */
function renderCards(certs) {
    if (!ctx)
        return;
    ctx.cachedCerts = certs;
    if (!certs || certs.length === 0) {
        ctx.grid.hidden = true;
        ctx.empty.hidden = false;
        setStatus('لا توجد شهادات صادرة');
        return;
    }
    ctx.empty.hidden = true;
    ctx.grid.hidden = false;
    ctx.grid.innerHTML = certs.map(cardMarkup).join('');
    setStatus(`${certs.length} شهادة ${certs.length === 1 ? 'موقّعة' : 'موقّعة رقمياً'}`);
    bindVerifyButtons();
    bindVerifyLinks();
}
/* ── تكوين admin key (نفس نمط eval-api) ───────────────────────────── */
function promptAdminKey() {
    let stored = '';
    try {
        stored = localStorage.getItem('brightai-admin-key') || '';
    }
    catch {
        /* storage disabled */
    }
    const key = window.prompt('أدخل مفتاح الإدارة لعرض الشهادات الحية:', stored || '');
    if (key === null) {
        setBanner('لم تُحمَّل الشهادات الحية. استخدم قسم العرض التوضيحي أدناه.', 'warn');
        return;
    }
    try {
        localStorage.setItem('brightai-admin-key', key.trim());
    }
    catch {
        /* ignore */
    }
    void loadCerts();
}
/* ── Fetch الشهادات ───────────────────────────────────────────────── */
let loadingInFlight = false;
async function loadCerts() {
    if (!ctx || loadingInFlight)
        return;
    loadingInFlight = true;
    ctx.skeleton.hidden = false;
    ctx.empty.hidden = true;
    ctx.grid.hidden = true;
    setBanner('', '');
    setStatus('جارٍ تحميل الشهادات…');
    const res = await fetchCertificates(50);
    loadingInFlight = false;
    ctx.skeleton.hidden = true;
    if (!res.ok) {
        if (res.error === 'unauthorized') {
            setBanner(res.arabicMessage, 'warn');
            // زر إدخال المفتاح (مرة واحدة)
            const banner = ctx.banner;
            const existingBtn = banner.querySelector('[data-kernel-certs-enter-key]');
            if (!existingBtn) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'kernel-evidence-certs__keybtn';
                btn.dataset.kernelCertsEnterKey = '1';
                btn.textContent = 'إدخال مفتاح الإدارة';
                btn.addEventListener('click', promptAdminKey);
                banner.appendChild(btn);
            }
            // أبقِ الـ grid فارغًا — يسقط المستخدم على القسم التوضيحي.
        }
        else {
            setBanner(res.arabicMessage, 'error');
        }
        return;
    }
    renderCards(res.data);
}
/* ── المودال: التحقق ──────────────────────────────────────────────── */
let activeModal = null;
let lastVerifyTrigger = null;
let currentVerifyResult = null;
function openModal() {
    const modal = el('[data-kernel-certs-modal]');
    if (!modal)
        return;
    activeModal = modal;
    el('[data-kernel-certs-modal-loading]').hidden = false;
    el('[data-kernel-certs-modal-result]').hidden = true;
    modal.setAttribute('data-open', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.hidden = false;
    setTimeout(() => {
        const close = el('.kernel-modal__close', modal);
        close?.focus();
    }, 50);
}
function closeModal() {
    if (!activeModal)
        return;
    activeModal.setAttribute('data-open', 'false');
    activeModal.setAttribute('aria-hidden', 'true');
    activeModal.hidden = true;
    activeModal = null;
    lastVerifyTrigger?.focus?.();
    lastVerifyTrigger = null;
}
function setText(sel, val) {
    const n = el(sel);
    if (n)
        n.textContent = val;
}
async function runVerify(certId, trigger) {
    lastVerifyTrigger = trigger;
    openModal();
    const loadingEl = el('[data-kernel-certs-modal-loading]');
    const resultEl = el('[data-kernel-certs-modal-result]');
    if (loadingEl)
        loadingEl.hidden = false;
    if (resultEl)
        resultEl.hidden = true;
    const res = await verifyCertificate(certId);
    currentVerifyResult = res;
    setText('[data-kernel-certs-modal-certid]', res.certificateId || certId);
    setText('[data-kernel-certs-modal-signedby]', res.signedBy ?? '—');
    setText('[data-kernel-certs-modal-signedat]', formatDateTime(res.signedAt));
    setText('[data-kernel-certs-modal-env]', envLabel(res.environment));
    setText('[data-kernel-certs-modal-gate]', gateLabel(res.gate));
    const hashEl = el('[data-kernel-certs-modal-hashchain]');
    if (hashEl) {
        if (res.hashChainValid === null) {
            hashEl.textContent = '— (متاحة في الـ payload الكامل)';
        }
        else {
            hashEl.textContent = res.hashChainValid ? '✅ سليمة' : '❌ مكسورة';
        }
    }
    const revEl = el('[data-kernel-certs-modal-revoke-reason]');
    if (revEl) {
        if (res.revoked && res.revokedReason) {
            revEl.hidden = false;
            revEl.textContent = res.revokedReason;
        }
        else {
            revEl.hidden = true;
        }
    }
    const badge = el('[data-kernel-certs-modal-status-badge]');
    if (badge) {
        badge.textContent = res.arabicMessage;
        badge.className = 'kernel-certs-modal__badge';
        badge.classList.add(`kernel-certs-modal__badge--${res.status}`);
    }
    const note = el('[data-kernel-certs-modal-clientnote]');
    if (note) {
        if (res.clientSide === 'unavailable') {
            note.textContent = '';
        }
        else {
            note.textContent =
                res.clientSide === 'valid'
                    ? '(تحقق Web Crypto محلي ناجح)'
                    : res.clientSide === 'failed'
                        ? '(الفحص المحلي فشل — الخادم هو المرجع النهائي)'
                        : '';
        }
    }
    const msg = el('[data-kernel-certs-modal-message]');
    if (msg)
        msg.textContent = res.arabicMessage;
    const vUrl = res.certificateId
        ? `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(res.certificateId)}`
        : '';
    const vWrap = el('[data-kernel-certs-modal-verifyurl-wrap]');
    const vLink = el('[data-kernel-certs-modal-verifyurl]');
    if (vWrap && vLink) {
        if (vUrl) {
            vLink.href = vUrl;
            vWrap.hidden = false;
        }
        else {
            vWrap.hidden = true;
        }
    }
    if (loadingEl)
        loadingEl.hidden = true;
    if (resultEl)
        resultEl.hidden = false;
}
/* ── ربط أزرار Verify في الـ grid الديناميكي ───────────────────────── */
function bindVerifyButtons() {
    if (!ctx)
        return;
    elAll('[data-kernel-certs-verify]', ctx.grid).forEach((btn) => {
        if (btn.dataset.bound === '1')
            return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-kernel-certs-verify') || '';
            if (id)
                void runVerify(id, btn);
        });
    });
}
/* ── ربط روابط "رابط التحقق" (Public verifyUrl → فتح المودال) ──────── */
function bindVerifyLinks() {
    if (!ctx)
        return;
    elAll('[data-kernel-certs-verifyurl]', ctx.grid).forEach((a) => {
        if (a.dataset.bound === '1')
            return;
        a.dataset.bound = '1';
        // نفس المودال — حتى لو كان هناك verifyUrl، نحترم التحميل الحالي.
        a.addEventListener('click', (e) => {
            const certId = a.getAttribute('data-kernel-certs-verifyurl') || '';
            if (!certId)
                return;
            e.preventDefault();
            void runVerify(certId, a);
        });
        a.setAttribute('aria-label', 'تحقق من صلاحية هذه الشهادة');
    });
}
/* ── تنزيل JSON / PDF من المودال ──────────────────────────────────── */
function downloadCurrentJson() {
    if (!currentVerifyResult)
        return;
    downloadCertificateJson({
        certificateId: currentVerifyResult.certificateId,
        gate: currentVerifyResult.gate ?? 'incomplete',
        environment: currentVerifyResult.environment ?? 'demo',
        signedBy: currentVerifyResult.signedBy ?? '',
        issuedAt: currentVerifyResult.signedAt ?? '',
        verifyUrl: currentVerifyResult.status === 'revoked'
            ? ''
            : `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(currentVerifyResult.certificateId)}`,
        revokedAt: currentVerifyResult.revoked ? new Date().toISOString() : null,
        revocationReason: currentVerifyResult.revokedReason,
    });
}
function downloadCurrentPdf() {
    if (!currentVerifyResult)
        return;
    downloadCertificatePdf({
        certificateId: currentVerifyResult.certificateId,
        gate: currentVerifyResult.gate ?? 'incomplete',
        environment: currentVerifyResult.environment ?? 'demo',
        signedBy: currentVerifyResult.signedBy ?? '',
        issuedAt: currentVerifyResult.signedAt ?? '',
        verifyUrl: currentVerifyResult.status === 'revoked'
            ? ''
            : `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(currentVerifyResult.certificateId)}`,
        revokedAt: currentVerifyResult.revoked ? new Date().toISOString() : null,
        revocationReason: currentVerifyResult.revokedReason,
    });
}
/* ── تهيئة القسم ──────────────────────────────────────────────────── */
function init() {
    const root = el('[data-kernel-certs-root]');
    if (!root)
        return;
    if (root.dataset.initialized === '1')
        return;
    root.dataset.initialized = '1';
    ctx = {
        root,
        status: el('[data-kernel-certs-status]', root),
        banner: el('[data-kernel-certs-banner]', root),
        skeleton: el('[data-kernel-certs-skeleton]', root),
        empty: el('[data-kernel-certs-empty]', root),
        grid: el('[data-kernel-certs-grid]', root),
        refreshBtn: el('[data-kernel-certs-refresh]', root),
        cachedCerts: [],
    };
    ctx.refreshBtn.addEventListener('click', () => void loadCerts());
    elAll('[data-kernel-certs-close]', document).forEach((b) => {
        if (b.dataset.bound === '1')
            return;
        b.dataset.bound = '1';
        b.addEventListener('click', closeModal);
    });
    const dlJson = el('[data-kernel-certs-modal-download-json]');
    if (dlJson && dlJson.dataset.bound !== '1') {
        dlJson.dataset.bound = '1';
        dlJson.addEventListener('click', downloadCurrentJson);
    }
    const dlPdf = el('[data-kernel-certs-modal-download-pdf]');
    if (dlPdf && dlPdf.dataset.bound !== '1') {
        dlPdf.dataset.bound = '1';
        dlPdf.addEventListener('click', downloadCurrentPdf);
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal && activeModal.getAttribute('data-open') === 'true') {
            closeModal();
        }
    });
    void loadCerts();
}
/* ── ربط بحدث astro:page-load (متوافق مع view transitions) ───────── */
document.addEventListener('astro:page-load', init);
if (document.readyState !== 'loading')
    init();
