/**
 * kernel-evidence-certs.ts — engine صفحة /kernel/evidence/ قسم الشهادات.
 *
 * PROMPT-3 (2026-08-04): يعرض الشهادات الحقيقية من `evaluation_certificates`
 * (عبر /api/kernel/certificates) مع تحقق crypto (زر Verify) وتنزيل PDF/JSON.
 *
 * القاعدة الحاكمة:
 *   - الحكم النهائي دائمًا server-side عبر `/api/kernel/certificates/verify?id=X`.
 *   - الزائر بلا مفتاح إدارة يستلم 403 → يعرض banner مهذب + خيار إدخال المفتاح
 *     (نفس نمط eval-api)، ويبقى دعم القسم التوضيحي أدناه.
 *   - البيانات المعروضة: certificateId، signedBy، signedAt، gate، environment،
 *     revocation status، verifyUrl.
 *
 * Accessibility:
 *   - كل تحديث حالة يُعلن عبر `aria-live="polite"`.
 *   - المودال يعيد التركيز للمصدر عند الإغلاق + يلتقط الفوكس.
 *   - الحالات (valid/revoked/tampered…) لها نص وصفي لا لون فقط.
 *
 * RTL: كل الدول/الرسائل عربية، لا يمين/يسار حرفي — logical properties في الـ CSS.
 */
import { fetchCertificates, verifyCertificate, downloadCertificatePdf, downloadCertificateJson, } from './certificate-verifier';
/* ── DOM helpers (نفس نمط بقية الـ engines) ───────────────────────── */
function el(q, root = document) {
    return root.querySelector(q);
}
function elAll(q, root = document) {
    return Array.prototype.slice.call(root.querySelectorAll(q));
}
let ctx = null;
/* ── إعادة ضبط الحالة قبل كل fetch ────────────────────────────────── */
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
    // announce للمـ screen readers
    ctx.banner.setAttribute('role', kind === 'error' ? 'alert' : 'status');
}
/* ── أَيقونات SVG (مطابقة لـ evidence.astro) ──────────────────────── */
const ICONS = {
    cert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>',
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
/* ── بناء بطاقة شهادة (HTML آمن من حقول الخادم — no innerHTML من بيانات
 *    غير موثوقة إلا بعد تعقيم؛ الحقول كلها metadata sanitized من الخادم) ── */
function cardMarkup(c) {
    const revoked = !!c.revokedAt;
    const certId = String(c.certificateId || '—').replace(/["'<>&]/g, '');
    const signedBy = String(c.signedBy || '—').replace(/["'<>&]/g, '');
    const signedAt = formatDateTime(c.issuedAt);
    const gate = gateLabel(c.gate).replace(/["'<>&]/g, '');
    const env = envLabel(c.environment).replace(/["'<>&]/g, '');
    const revReason = (c.revocationReason ?? c.revokeReason ?? '')
        .replace(/["'<>&]/g, '');
    const verifyUrl = String(c.verifyUrl || '').replace(/["'<>&]/g, '');
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
        <a class="kernel-evidence-certs__verifyurl" href="${verifyUrl || '#'}" ${verifyUrl ? 'target="_blank" rel="noopener noreferrer"' : 'aria-disabled="true"'} data-kernel-touch>
          ${ICONS.linkSafe()}
          <span>رابط التحقق</span>
        </a>
        <button type="button" class="kernel-evidence-certs__btn keyword-evidence-certs__btn--verify" data-kernel-certs-verify="${certId}" data-kernel-touch>
          ${ICONS.shield}<span>تحقق</span>
        </button>
      </footer>
    </article>
  `;
}
/* أيقونة الرابط — إضافة بالطريقة الصحيحة (لا دالة داخل const object) */
var ICONS_LINK;
(function (ICONS_LINK) {
    ICONS_LINK.link = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>';
})(ICONS_LINK || (ICONS_LINK = {}));
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
    bindVerifyUrlLinks();
}
/* ── تكوين admin key (نفس نمط eval-api) ───────────────────────────── */
function promptAdminKey() {
    const stored = (() => {
        try {
            return localStorage.getItem('brightai-admin-key') || '';
        }
        catch {
            return '';
        }
    })();
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
    loadCerts();
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
    if (!res.ok) {
        loadingInFlight = false;
        ctx.skeleton.hidden = true;
        if (res.error === 'unauthorized') {
            setBanner(res.arabicMessage, 'warn');
            // زر إدخال المفتاح
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
            // أبقي الـ grid فارغًا — يقع المستخدم على القسم التوضيحي.
        }
        else {
            setBanner(res.arabicMessage, 'error');
        }
        return;
    }
    loadingInFlight = false;
    ctx.skeleton.hidden = true;
    renderCards(res.data);
}
/* ── المودال: التحقق ──────────────────────────────────────────────── */
let activeModal = null;
let lastVerifyTrigger = null;
let currentVerifyResult = null;
function openModal() {
    if (!ctx)
        return;
    const modal = el('[data-kernel-certs-modal]');
    if (!modal)
        return;
    activeModal = modal;
    // إظهار حالة التحميل، إخفاء النتيجة السابقة
    el('[data-kernel-certs-modal-loading]').hidden = false;
    el('[data-kernel-certs-modal-result]').hidden = true;
    modal.setAttribute('data-open', 'true');
    modal.setAttribute('aria-hidden', 'false');
    // focus أول عنصر (close)
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
    activeModal = null;
    // إعادة التركيز للمصدر
    lastVerifyTrigger?.focus?.();
    lastVerifyTrigger = null;
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
    // تعبئة الحقول
    const setText = (sel, val) => {
        const n = el(sel);
        if (n)
            n.textContent = val;
    };
    setText('[data-kernel-certs-modal-certid]', res.certificateId || certId);
    setText('[data-kernel-certs-modal-signedby]', res.signedBy ?? '—');
    setText('[data-kernel-certs-modal-signedat]', formatDateTime(res.signedAt));
    setText('[data-kernel-certs-modal-env]', envLabel(res.environment));
    setText('[data-kernel-certs-modal-gate]', gateLabel(res.gate));
    // صحة سلسلة الهاش
    const hashEl = el('[data-kernel-certs-modal-hashchain]');
    if (hashEl) {
        if (res.hashChainValid === null) {
            hashEl.textContent = '— (متاحة في الـ payload الكامل)';
        }
        else {
            hashEl.textContent = res.hashChainValid ? '✅ سليمة' : '❌ مكسورة';
        }
    }
    // حالة السحب
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
    // الشارة (status badge)
    const badge = el('[data-kernel-certs-modal-status-badge]');
    if (badge) {
        badge.textContent = res.arabicMessage;
        badge.className = 'kernel-certs-modal__badge';
        badge.classList.add(`kernel-certs-modal__badge--${res.status}`);
    }
    // ملاحظة الـ client-side
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
    // رسالة النتيجة
    const msg = el('[data-kernel-certs-modal-message]');
    if (msg)
        msg.textContent = res.arabicMessage;
    // رابط التحقق العام
    const vUrl = res.certificateId ? `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(res.certificateId)}` : '';
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
    // إظهار النتيجة
    if (loadingEl)
        loadingEl.hidden = true;
    if (resultEl)
        resultEl.hidden = false;
}
/* ── ربط أزرار التحقق (في القسم الديناميكي) ───────────────────────── */
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
                runVerify(id, btn);
        });
    });
}
/* ── تنزيل JSON / PDF من المودال ──────────────────────────────────── */
function downloadCurrentJson() {
    const id = currentVerifyResult?.certificateId;
    if (!id)
        return;
    // نبني من الحقول المتاحة (النسخة العامة)
    downloadCertificateJson({
        certificateId: id,
        gate: currentVerifyResult.gate ?? 'passed',
        environment: currentVerifyResult.environment ?? 'demo',
        signedBy: currentVerifyResult.signedBy ?? '',
        issuedAt: currentVerifyResult.signedAt ?? new Date().toISOString(),
        verifyUrl: currentVerifyResult.status === 'revoked'
            ? ''
            : `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(id)}`,
        revokedAt: currentVerifyResult.revoked ? new Date().toISOString() : null,
        revocationReason: currentVerifyResult.revokedReason ?? null,
    });
}
function downloadCurrentPdf() {
    const id = currentVerifyResult?.certificateId;
    if (!id)
        return;
    downloadCertificatePdf({
        certificateId: id,
        gate: currentVerifyResult.gate ?? 'passed',
        environment: currentVerifyResult.environment ?? 'demo',
        signedBy: currentVerifyResult.signedBy ?? '',
        issuedAt: currentVerifyResult.signedAt ?? new Date().toISOString(),
        verifyUrl: currentVerifyResult.status === 'revoked'
            ? ''
            : `${location.origin}/api/kernel/certificates/verify?id=${encodeURIComponent(id)}`,
        revokedAt: currentVerifyResult.revoked ? new Date().toISOString() : null,
        revocationReason: currentVerifyResult.revokedReason ?? null,
    });
}
/* ── ربط روابط التحقق العام في البطاقات ──────────────────────────── */
function bindVerifyUrlLinks() {
    if (!ctx)
        return;
    elAll('a[data-kernel-certs-verifyurl]', ctx.grid).forEach((a) => {
        if (a.dataset.bound === '1')
            return;
        a.dataset.bound = '1';
        if (a.getAttribute('href') === '#' || a.getAttribute('href') === '') {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                const certId = a.closest('[data-cert-id]')?.getAttribute('data-cert-id') || '';
                if (certId)
                    runVerify(certId, a);
            });
            a.setAttribute('aria-label', 'تحقق من الشهادة عبر المودال');
        }
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
    // refresh button
    ctx.refreshBtn.addEventListener('click', loadCerts);
    // modal buttons
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
    // keyboard: Esc يغلق المودال
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeModal && activeModal.getAttribute('data-open') === 'true') {
            closeModal();
        }
    });
    // تحميل أولي
    void loadCerts();
}
/* ── ربط بحدث astro:page-load (متوافق مع view transitions) ───────── */
document.addEventListener('astro:page-load', init);
if (document.readyState !== 'loading')
    init();
/｜｜DSML｜｜>;
