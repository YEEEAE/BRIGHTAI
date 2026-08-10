/**
 * kernel-evidence.js — Vanilla engine for /kernel/evidence/.
 *
 * Canonical-split (2026-08-09): extracted verbatim from the inline ~52KB script
 * that lived in evidence.astro, with two determinism fixes mandated by the
 * kernel canonical pattern:
 *   1. generateNew() — was Math.random/new Date; now drives a seeded mulberry32
 *      stream (EVIDENCE_SEED + counter) and formats Arabic-Indic-digit dates
 *      manually. Same page load → same generated card. No Math.random/Date.now.
 *   2. bindBatch() progress increment — was 5 + Math.floor(Math.random()*12);
 *      now uses the same seeded stream.
 *
 * All other functions (filters, preview, download, JSON verify, tamper demo,
 * dropzone, link-param highlighting) are preserved as-is — they were already
 * deterministic or are pure UI glue.
 *
 * Consumes KernelEvidenceData (UMD) loaded before this module. CSP-safe classic
 * script, no inline handlers, no external fetch.
 *
 * Contract verified by scripts/verify-evidence.mjs (hygiene group):
 *   no Math.random / Date.now / toLocaleString / fetch( in this file.
 */
(function () {
  'use strict';

  var DATA = (typeof window !== 'undefined' && window.KernelEvidenceData) ||
             (typeof self !== 'undefined' && self.KernelEvidenceData) ||
             (typeof globalThis !== 'undefined' && globalThis.KernelEvidenceData);
  if (!DATA) return;

  // Seeded RNG stream for the interactive generators (generateNew / batch).
  // The counter advances on each draw so successive generations produce
  // successive (but reproducible) values from the same seed.
  var genCounter = 0;
  function rand() {
    if (!rand._stream) rand._stream = DATA.mulberry32(DATA.EVIDENCE_SEED);
    return rand._stream();
  }

  // Arabic-Indic digit map — manual formatting (no toLocaleString) so the
  // generated cards match the published 12-item date style.
  var AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  function toArabicDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }
  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function formatArabicDate(epochMs) {
    var d = new Date(epochMs);
    var y = toArabicDigits(d.getUTCFullYear());
    var m = toArabicDigits(pad2(d.getUTCMonth() + 1));
    var day = toArabicDigits(pad2(d.getUTCDate()));
    return y + '/' + m + '/' + day;
  }
  function formatArabicTime(epochMs) {
    var d = new Date(epochMs);
    var h = toArabicDigits(pad2(d.getUTCHours()));
    var min = toArabicDigits(pad2(d.getUTCMinutes()));
    return formatArabicDate(epochMs) + ' ' + h + ':' + min;
  }

  function el(q, root) { return (root || document).querySelector(q); }
  function elAll(q, root) { return Array.prototype.slice.call((root || document).querySelectorAll(q)); }

  function downloadFile(name, mime, content) {
    var blob = (content instanceof Blob) ? content : new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  // ── Tampering demo — visually breaks the hash chain ──
  function bindTamper() {
    var btn = el('[data-kernel-evidence-tamper]');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var chain = el('[data-kernel-evidence-hashchain]');
      var result = el('[data-kernel-evidence-tamper-result]');
      if (!chain || !result) return;
      chain.hidden = false;
      chain.classList.add('kernel-evidence-hashchain--tampered');
      var boxes = elAll('.kernel-evidence-hashchain__box', chain);
      boxes[1].textContent = '0xb1d9…DEAD';
      boxes[1].classList.remove('kernel-evidence-hashchain__box--current');
      boxes[1].classList.add('kernel-evidence-hashchain__box--broken');
      result.textContent = '❌ تغيّر بايت واحد → السلسلة انكسرت ولم يعد التحقق ممكناً';
      result.className = 'kernel-evidence-tamper__result kernel-evidence-tamper__result--fail';
    });
  }

  // ── Third-party upload (dropzone) — demo verification UI ──
  function bindDropzone() {
    var dz = el('[data-kernel-evidence-dropzone]');
    if (!dz || dz.dataset.bound === '1') return;
    dz.dataset.bound = '1';

    function handle(file) {
      var isEVD = /EVD-|\.pdf$|\.json$/i.test(file.name);
      var result = document.createElement('p');
      result.className = 'kernel-evidence-dropzone__result ' + (isEVD ? 'ok' : 'fail');
      result.setAttribute('role', 'status');
      result.textContent = isEVD
        ? '✅ التوقيع الرقمي سليم — الملف موقّع ولم يُعبث به (محاكاة)'
        : '❌ التنسيق غير معروف — ارفع ملف EVD بصيغة PDF أو JSON';
      dz.querySelector('.kernel-evidence-dropzone__hint').replaceWith(result);
    }

    dz.addEventListener('click', function () {
      var input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.json,application/pdf,application/json';
      input.addEventListener('change', function () {
        if (input.files && input.files[0]) handle(input.files[0]);
      });
      input.click();
    });
    dz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dz.click(); }
    });
    ['dragenter', 'dragover'].forEach(function (name) {
      dz.addEventListener(name, function (e) { e.preventDefault(); dz.classList.add('kernel-evidence-dropzone--dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (name) {
      dz.addEventListener(name, function (e) { e.preventDefault(); dz.classList.remove('kernel-evidence-dropzone--dragover'); });
    });
    dz.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) handle(e.dataTransfer.files[0]);
    });
  }

  // ── JSON verification (signed hash) ──
  function openJson(btn) {
    var id = btn.getAttribute('data-kernel-evidence-json');
    var card = el('[data-kernel-evidence-item="' + id + '"]');
    if (!card) return;
    var hash = btn.getAttribute('data-hash') || '0xunknown';
    var title = btn.getAttribute('data-title') || id;
    var payload = {
      evidence_id: id,
      title: title,
      hash_sha256: hash,
      algorithm: 'SHA-256',
      signed: true,
      format: 'EVD v1.0',
      retention: (card.querySelector('.kernel-evidence-item__retention') || {}).textContent || '—',
    };
    downloadFile(id + '.evd.json', 'application/json;charset=utf-8', JSON.stringify(payload, null, 2));

    var existing = card.querySelector('.kernel-evidence-jsonverify-inline');
    if (existing) existing.remove();
    var box = document.createElement('div');
    box.className = 'kernel-evidence-jsonverify-inline';
    box.setAttribute('role', 'status');
    box.innerHTML = '<span class="kernel-evidence-jsonverify-inline__ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> الهاش مطابق — الملف غير مُعبث به (JSON)</span>';
    card.querySelector('.kernel-evidence-item__footer').appendChild(box);
    setTimeout(function () { box.remove(); }, 4000);
  }

  // ── In-modal quick verify ──
  function verifyInModal() {
    var btn = el('[data-kernel-preview-verify]');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', function () {
      var result = el('[data-kernel-preview-verify-result]');
      if (!result) return;
      result.textContent = '✅ الهاش SHA-256 مطابق لسلسلة الأدلة — التوقيع صحيح (محاكاة)';
      result.className = 'kernel-evidence-jsonverify__result ok';
    });
  }

  function openPreview(btn) {
    var modal = el('[data-kernel-evidence-preview-modal]');
    if (!modal) return;

    var rt = window.__BRIGHTAI_ANALYTICS__;
    if (rt && typeof rt.track === 'function') {
      rt.track(rt.events.EVIDENCE_VIEWED, {
        source: 'preview',
        evidence_id: btn.getAttribute('data-kernel-evidence-preview') || undefined,
        sector: btn.getAttribute('data-sector') || undefined,
        pack: btn.getAttribute('data-pack') || undefined,
      });
    }
    var data = {
      title:  btn.getAttribute('data-title'),
      trace:  btn.getAttribute('data-trace'),
      hash:   btn.getAttribute('data-hash'),
      query:  btn.getAttribute('data-query'),
      status: btn.getAttribute('data-status'),
      signed: btn.getAttribute('data-signed'),
      sector: btn.getAttribute('data-sector'),
      pack:   btn.getAttribute('data-pack'),
      size:   btn.getAttribute('data-size'),
      risk:   parseInt(btn.getAttribute('data-risk') || '0', 10),
      id:     btn.getAttribute('data-kernel-evidence-preview'),
      retention: btn.getAttribute('data-retention') || '—',
      cert:   btn.getAttribute('data-cert') || '—',
    };

    var setText = function (sel, val) { var n = el(sel); if (n) n.textContent = val || '—'; };
    setText('[data-kernel-preview-trace]', data.trace);
    setText('[data-kernel-preview-hash]', data.hash);
    setText('[data-kernel-preview-sector]', data.sector);
    setText('[data-kernel-preview-pack]', data.pack);
    setText('[data-kernel-preview-signed]', data.signed);
    setText('[data-kernel-preview-retention]', data.retention);
    setText('[data-kernel-preview-cert]', data.cert);

    var vRes = el('[data-kernel-preview-verify-result]');
    if (vRes) { vRes.textContent = ''; vRes.className = 'kernel-evidence-jsonverify__result'; }
    var vBox = el('[data-kernel-preview-jsonverify]');
    if (vBox) vBox.hidden = false;

    modal.setAttribute('data-open', 'true');
    modal.setAttribute('aria-hidden', 'false');
    modal.dataset.previewId = data.id || '';

    renderEvidencePreview(data);

    setTimeout(function () {
      var close = el('.kernel-modal__close');
      if (close) close.focus();
    }, 50);
  }

  function closePreview() {
    var modal = el('[data-kernel-evidence-preview-modal]');
    if (!modal) return;
    modal.setAttribute('data-open', 'false');
    modal.setAttribute('aria-hidden', 'true');
  }

  function downloadFor(id) {
    var card = el('[data-kernel-evidence-item="' + id + '"]');
    if (!card) return;
    var previewBtn = card.querySelector('[data-kernel-evidence-preview]');
    var data = {
      id: id,
      title: (card.querySelector('.kernel-evidence-item__sub') || {}).textContent || id,
      query: '—',
      trace: previewBtn ? (previewBtn.getAttribute('data-trace') || '—') : '—',
      hash: previewBtn ? (previewBtn.getAttribute('data-hash') || '—') : '—',
      risk: previewBtn ? parseInt(previewBtn.getAttribute('data-risk') || '0', 10) : 0,
      status: previewBtn ? (previewBtn.getAttribute('data-status') || '—') : '—',
      sector: previewBtn ? (previewBtn.getAttribute('data-sector') || '—') : '—',
      pack: previewBtn ? (previewBtn.getAttribute('data-pack') || '—') : '—',
      retention: previewBtn ? (previewBtn.getAttribute('data-retention') || '—') : '—',
      cert: previewBtn ? (previewBtn.getAttribute('data-cert') || '—') : '—',
      size: (card.querySelector('.kernel-evidence-item__meta dd:nth-of-type(4)') || {}).textContent || '—',
      signed: previewBtn ? (previewBtn.getAttribute('data-signed') || '—') : '—',
    };
    if (window.__kernelEvidencePdf) {
      var blob = window.__kernelEvidencePdf(data);
      downloadFile(id + '.pdf', 'application/pdf', blob);
    } else {
      downloadFile(id + '.pdf.txt', 'text/plain;charset=utf-8', 'BrightAI Kernel — Evidence File\n\nID: ' + id);
    }
  }

  function renderEvidencePreview(data) {
    var preview = el('[data-kernel-evidence-preview-panel]');
    var body = el('[data-kernel-evidence-preview-body]');
    if (!preview || !body) return;
    var sep = '======================================================';
    var lines = [
      { t: 'BrightAI Kernel — Evidence File' },
      { t: sep },
      { t: '' },
      { t: 'Evidence ID    : ' + (data.id || '—') },
      { t: 'Title          : ' + (data.title || '—') },
      { t: 'Query          : ' + (data.query || '—') },
      { t: 'Trace ID       : ' + (data.trace || '—') },
      { t: 'Hash (SHA-256) : ' + (data.hash || '—') },
      { t: 'Risk Score     : ' + (data.risk != null ? data.risk + ' / 100' : '—') },
      { t: 'Status         : ' + (data.status || '—') },
      { t: 'Sector         : ' + (data.sector || '—') },
      { t: 'Compliance Pack: ' + (data.pack || '—') },
      { t: 'Retention      : ' + (data.retention || '—') },
      { t: 'Certificate    : ' + (data.cert || '—') },
      { t: 'Size           : ' + (data.size || '—') },
      { t: 'Signed         : ' + (data.signed || '—') },
      { t: '' },
      { t: sep },
      { t: 'Demo file. In production this is generated server-side from' },
      { t: 'the Kernel API and signed cryptographically (Ed25519 / SHA-256).' },
      { t: '' },
      { t: 'Verification: /api/kernel/certificates/verify' },
    ];
    body.textContent = lines.map(function (l) { return l.t; }).join('\n');
    preview.hidden = false;
  }

  function applyFilters() {
    var sector = el('[data-kernel-evidence-filter="sector"]').value;
    var pack = el('[data-kernel-evidence-filter="pack"]').value;
    var tag = el('[data-kernel-evidence-filter="tag"]').value;

    var items = elAll('[data-kernel-evidence-item]');
    var shown = 0;
    var totalSize = 0;
    var packs = {};
    items.forEach(function (it) {
      var s = it.getAttribute('data-sector') || '';
      var p = it.getAttribute('data-pack') || '';
      var t = it.getAttribute('data-tags') || '';
      var visible =
        (sector === '' || s === sector) &&
        (pack === '' || p === pack) &&
        (tag === '' || t.split(',').indexOf(tag) !== -1);
      it.hidden = !visible;
      if (visible) {
        shown++;
        var sizeTxt = (it.querySelector('.kernel-evidence-item__meta dd:nth-of-type(5)') || {}).textContent || '';
        var kb = parseFloat((sizeTxt || '').replace(/[^\d.]/g, ''));
        if (!isNaN(kb)) totalSize += kb;
        packs[p] = true;
      }
    });

    var counter = el('[data-kernel-evidence-count]');
    if (counter) {
      counter.textContent =
        shown + ' من ' + items.length +
        ' · ' + (totalSize ? Math.round(totalSize) + 'KB' : '—') + ' إجمالي' +
        ' · ' + Object.keys(packs).length + ' حزم امتثال';
    }

    var emptyEl = el('[data-kernel-evidence-empty]');
    if (emptyEl) emptyEl.hidden = shown !== 0;
  }

  // ── Deterministic "generate new" (was Math.random/new Date) ──
  // Draws sector/pack/risk/hash/cert/size from the seeded mulberry32 stream
  // so every page load produces the same sequence of generated cards.
  var GEN_SECTORS = ['banking', 'government', 'healthcare', 'manufacturing', 'telecom'];
  var GEN_PACKS = ['pdpl', 'nca', 'sdaia', 'sfda', 'sama', 'iso42001', 'iso27001'];
  var GEN_RETENTION = {
    pdpl: '5 سنوات — PDPL م.21', nca: '5 سنوات — NCA ECC-2', sdaia: 'سنتان — SDAIA م.7',
    sfda: '7 سنوات — SFDA م.19', sama: '5 سنوات — SAMA CSF-2',
    iso42001: 'سنتان — ISO 42001 A.5.2', iso27001: 'سنتان — ISO 27001 A.5.1',
  };

  function generateNew() {
    var grid = el('[data-kernel-evidence-grid]');
    if (!grid) return;
    genCounter += 1;
    var id = 'EVD-2026-' + (10500 + Math.floor(rand() * 99));
    var trace = 'AI-2026-' + (10500 + Math.floor(rand() * 99));
    var ts = DATA.EVIDENCE_NOW - Math.floor(rand() * 86400000);
    var localTime = formatArabicTime(ts);
    var sector = GEN_SECTORS[Math.floor(rand() * GEN_SECTORS.length)];
    var pack = GEN_PACKS[Math.floor(rand() * GEN_PACKS.length)];
    var sectorLabel = DATA.SECTOR_LABEL[sector];
    var packLabel = DATA.PACK_LABEL[pack];
    var risk = Math.floor(rand() * 80) + 10;
    var status = risk > 85 ? 'blocked' : risk >= 60 ? 'pending_approval' : 'allowed';
    var hashHex = '';
    for (var i = 0; i < 32; i += 1) {
      hashHex += '0123456789abcdef'[Math.floor(rand() * 16)];
    }
    var hash = '0x' + hashHex;
    var retention = GEN_RETENTION[pack];
    var cert = 'CERT-2026-' + (820 + Math.floor(rand() * 40));
    var sizeKb = 32 + Math.floor(rand() * 90);

    var article = document.createElement('article');
    article.className = 'kernel-evidence-item';
    article.setAttribute('data-kernel-evidence-item', id);
    article.setAttribute('data-sector', sector);
    article.setAttribute('data-pack', pack);
    article.setAttribute('data-tags', 'audit');
    article.setAttribute('data-created-at', new Date(ts).toISOString());

    article.innerHTML =
      '<header class="kernel-evidence-item__head">' +
        '<span class="kernel-evidence-item__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>' +
        '</span>' +
        '<div class="kernel-evidence-item__title-block">' +
          '<h3 class="kernel-evidence-item__title">' + id + '.pdf</h3>' +
          '<p class="kernel-evidence-item__sub">دليل مولّد تلقائياً — ' + localTime + '</p>' +
        '</div>' +
      '</header>' +
      '<dl class="kernel-evidence-item__meta">' +
        '<dt>التاريخ</dt><dd>' + localTime + '</dd>' +
        '<dt>القطاع</dt><dd>' + sectorLabel + '</dd>' +
        '<dt>الحزمة</dt><dd>' + packLabel + '</dd>' +
        '<dt>الحجم</dt><dd>' + sizeKb + 'KB</dd>' +
        '<dt>الاحتفاظ</dt><dd class="kernel-evidence-item__retention">' + retention + '</dd>' +
        '<dt>Trace</dt><dd><a class="kernel-evidence-item__trace" href="/kernel/audit/?trace=' + trace + '">' + trace + '</a></dd>' +
        '<dt>الشهادة</dt><dd><a class="kernel-evidence-item__cert" href="#verify"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>' + cert + '</a></dd>' +
      '</dl>' +
      '<div class="kernel-evidence-item__tags"><span class="kernel-evidence-item__tag">audit</span></div>' +
      '<footer class="kernel-evidence-item__footer">' +
        '<span class="kernel-evidence-item__signature' + (status === 'pending_approval' ? ' kernel-evidence-item__signature--pending' : '') + '">' +
          '<span aria-hidden="true">' +
            (status === 'pending_approval'
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>') +
          '</span>' +
          '<span>' + (status === 'pending_approval' ? 'بانتظار التوقيع' : 'موقّع رقمياً') + '</span>' +
        '</span>' +
        '<div style="display:flex; gap:var(--space-1);">' +
          '<button type="button" class="kernel-evidence-item__btn" data-kernel-evidence-preview="' + id + '" data-title="دليل مولّد تلقائياً" data-trace="' + trace + '" data-hash="' + hash + '" data-query="استعلام آلي" data-status="' + status + '" data-signed="' + localTime + '" data-sector="' + sectorLabel + '" data-pack="' + packLabel + '" data-size="' + sizeKb + 'KB" data-risk="' + risk + '" data-retention="' + retention + '" data-cert="' + cert + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg><span>معاينة</span>' +
          '</button>' +
          '<button type="button" class="kernel-evidence-item__btn" data-kernel-evidence-download="' + id + '" aria-label="تنزيل ' + id + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>PDF</span>' +
          '</button>' +
          '<button type="button" class="kernel-evidence-item__btn" data-kernel-evidence-json="' + id + '" aria-label="JSON للتحقق ' + id + '" data-hash="' + hash + '" data-title="دليل مولّد تلقائياً">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg><span>JSON</span>' +
          '</button>' +
        '</div>' +
      '</footer>';

    grid.insertBefore(article, grid.firstChild);
    article.style.animation = 'kernelChatMsgIn 0.4s var(--ease-out) both';

    bindItemButtons(article);
    applyFilters();
  }

  // ── Batch generation modal + progress (deterministic increment) ──
  function bindBatch() {
    var openBtn = el('[data-kernel-evidence-batch]');
    var modal = el('[data-kernel-evidence-batch-modal]');
    if (!openBtn || !modal) return;

    function show(open) {
      modal.setAttribute('data-open', open ? 'true' : 'false');
      modal.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    if (openBtn.dataset.bound !== '1') {
      openBtn.dataset.bound = '1';
      openBtn.addEventListener('click', function () { show(true); });
    }
    elAll('[data-kernel-evidence-batch-close]', modal).forEach(function (n) {
      if (n.dataset.bound === '1') return;
      n.dataset.bound = '1';
      n.addEventListener('click', function () { show(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') show(false);
    });

    var start = el('[data-kernel-evidence-batch-start]');
    if (start && start.dataset.bound !== '1') {
      start.dataset.bound = '1';
      start.addEventListener('click', function () {
        var count = parseInt(el('[data-kernel-batch-count]').value || '100', 10);
        var progressWrap = el('[data-kernel-batch-progress]');
        var bar = el('[data-kernel-batch-bar]');
        var status = el('[data-kernel-batch-status]');
        if (!progressWrap || !bar || !status) return;
        progressWrap.hidden = false;
        var done = 0;
        status.textContent = '0 من ' + count + ' — جارٍ التوليد…';
        bar.style.inlineSize = '0%';
        var timer = setInterval(function () {
          // Deterministic-ish increment: 5 + floor(rand*12) drawn from the
          // seeded stream (was Math.random). Still bounded and reproducible.
          done += 5 + Math.floor(rand() * 12);
          if (done >= count) done = count;
          bar.style.inlineSize = Math.round((done / count) * 100) + '%';
          status.textContent = done + ' من ' + count + ' — ' + Math.round((done / count) * 100) + '%';
          if (done >= count) {
            clearInterval(timer);
            status.textContent = 'تم توليد ' + count + ' ملف دليل ✓';
            var sample = Math.min(3, count);
            for (var i = 0; i < sample; i++) generateNew();
            setTimeout(function () { show(false); }, 1800);
          }
        }, 120);
      });
    }
  }

  function bindItemButtons(scope) {
    var root = scope || document;
    elAll('[data-kernel-evidence-preview]', root).forEach(function (b) {
      if (b.dataset.bound === '1') return;
      b.dataset.bound = '1';
      b.addEventListener('click', function () { openPreview(b); });
    });
    elAll('[data-kernel-evidence-download]', root).forEach(function (b) {
      if (b.dataset.bound === '1') return;
      b.dataset.bound = '1';
      b.addEventListener('click', function () { downloadFor(b.getAttribute('data-kernel-evidence-download') || ''); });
    });
    elAll('[data-kernel-evidence-json]', root).forEach(function (b) {
      if (b.dataset.bound === '1') return;
      b.dataset.bound = '1';
      b.addEventListener('click', function () { openJson(b); });
    });
  }

  function bindModal() {
    var modal = el('[data-kernel-evidence-preview-modal]');
    if (!modal || modal.dataset.bound === '1') return;
    modal.dataset.bound = '1';
    elAll('[data-kernel-evidence-preview-modal-close]', modal).forEach(function (n) {
      n.addEventListener('click', closePreview);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.getAttribute('data-open') === 'true') closePreview();
    });
    var dl = el('[data-kernel-evidence-download-from-preview]');
    if (dl) dl.addEventListener('click', function () {
      var id = modal.dataset.previewId;
      if (id) downloadFor(id);
    });
    verifyInModal();
  }

  function bindFilters() {
    elAll('[data-kernel-evidence-filter]').forEach(function (sel) {
      if (sel.dataset.bound === '1') return;
      sel.dataset.bound = '1';
      sel.addEventListener('change', applyFilters);
    });

    var resetBtn = el('[data-kernel-evidence-empty-reset]');
    if (resetBtn && resetBtn.dataset.bound !== '1') {
      resetBtn.dataset.bound = '1';
      resetBtn.addEventListener('click', function () {
        elAll('[data-kernel-evidence-filter]').forEach(function (sel) { sel.value = ''; });
        applyFilters();
      });
    }
    applyFilters();
  }

  function bindGenerate() {
    var btn = el('[data-kernel-evidence-generate]');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', generateNew);
  }

  // M28 — approvals→evidence: reads ?trace= (+ ?evd= optional) from the URL
  // coming from the approvals decision ledger, then highlights the evidence
  // item matching that trace. Does not change any published text.
  function applyLinkParams() {
    var sp;
    try { sp = new URLSearchParams(window.location.search); } catch (e) { return; }
    var trace = sp.get('trace');
    if (!trace) return;
    var items = elAll('[data-kernel-evidence-item]');
    var target = null;
    for (var i = 0; i < items.length; i += 1) {
      if (items[i].getAttribute('data-trace') === trace) { target = items[i]; break; }
    }
    if (!target) {
      var grid = el('[data-kernel-evidence-grid]');
      if (grid) {
        var note = document.createElement('div');
        note.className = 'kernel-evidence-linknote';
        note.setAttribute('role', 'status');
        note.textContent = 'لا ملف دليل مطابق للـ trace ' + trace + ' — تولّد الملفات تجريبيًا في هذه الصفحة.';
        grid.insertBefore(note, grid.firstChild);
      }
      return;
    }
    elAll('[data-kernel-evidence-filter]').forEach(function (sel) { sel.value = ''; });
    items.forEach(function (it) { it.hidden = it !== target; });
    var counter = el('[data-kernel-evidence-count]');
    if (counter) counter.textContent = '1 من ' + items.length + ' — ملف مطابق للـ trace';
    var emptyEl = el('[data-kernel-evidence-empty]');
    if (emptyEl) emptyEl.hidden = false;
    target.scrollIntoView({ block: 'center' });
    target.classList.add('kernel-evidence-item--linktarget');
    setTimeout(function () {
      if (target) target.classList.remove('kernel-evidence-item--linktarget');
    }, 2200);
    var focusBtn = target.querySelector('[data-kernel-evidence-preview]');
    if (focusBtn) focusBtn.focus({ preventScroll: true });
  }

  function init() {
    bindFilters();
    bindItemButtons();
    bindModal();
    bindGenerate();
    bindBatch();
    bindTamper();
    bindDropzone();
    applyLinkParams();
  }

  document.addEventListener('astro:page-load', init);
  if (document.readyState !== 'loading') init();
})();
