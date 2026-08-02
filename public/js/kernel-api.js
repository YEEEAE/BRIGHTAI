/**
 * kernel-api.js — Vanilla JS engine for /kernel/api/ (M27).
 *
 * Reads window.KernelApiData (from kernel-api-data.js).
 * Renders: nav tree + endpoints + code panel (cURL/Python/TS) + run +
 * webhook inspector + error handbook + migration + status + changelog +
 * SDK docs + operator docs.
 *
 * CRITICAL SECURITY: Never expose full API key. "Reveal" shows only last 4 chars.
 * CSP-safe: type="module", no dynamic imports, no eval.
 * Deterministic: no Math.random, no Date.now, no toLocaleString.
 * Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var data = (typeof window !== 'undefined' && window.KernelApiData) || null;
  var apiData = null;
  var reducedMotion = false;

  function init() {
    if (!data) { console.error('KernelApiData not loaded'); return; }
    apiData = data.buildApiData();
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    renderEndpoints();
    renderWebhook();
    renderErrors();
    renderMigration();
    renderStatus();
    renderChangelog();
    renderSdkDocs();
    renderOperatorDocs();
    bindCodePanel();
    bindDemoKey();
    bindWebhook();
    bindNavScroll();
  }

  function renderEndpoints() {
    var container = document.getElementById('ka-endpoints');
    if (!container) return;
    var html = '';
    apiData.endpoints.forEach(function (ep) {
      html += '<article class="kernel-api__endpoint" id="ep-' + ep.id + '">';
      html += '<header class="kernel-api__endpoint-head">';
      html += '<span class="kernel-api__method kernel-api__method--' + ep.method.toLowerCase() + '">' + ep.method + '</span>';
      html += '<code class="kernel-api__path" dir="ltr">' + ep.path + '</code>';
      html += '</header>';
      html += '<h3 class="kernel-api__endpoint-desc" style="margin:0 0 var(--space-3);color:var(--text-primary);font-weight:var(--font-semibold);">' + ep.title + '</h3>';
      html += '<p class="kernel-api__endpoint-desc">' + ep.desc + '</p>';

      html += '<h4 class="kernel-api__subhead">المعاملات</h4>';
      html += '<table class="kernel-api__table"><thead><tr><th>المعامل</th><th>النوع</th><th>إلزامي</th><th>الوصف</th></tr></thead><tbody>';
      ep.params.forEach(function (p) { html += '<tr><td><code dir="ltr">' + p.name + '</code></td><td><code dir="ltr">' + p.type + '</code></td><td>' + (p.required ? 'نعم' : 'لا') + '</td><td>' + p.desc + '</td></tr>'; });
      html += '</tbody></table>';

      html += '<h4 class="kernel-api__subhead">الاستجابة</h4>';
      html += '<table class="kernel-api__table"><thead><tr><th>الحقل</th><th>النوع</th><th>الوصف</th></tr></thead><tbody>';
      ep.response.forEach(function (r) { html += '<tr><td><code dir="ltr">' + r.name + '</code></td><td><code dir="ltr">' + r.type + '</code></td><td>' + r.desc + '</td></tr>'; });
      html += '</tbody></table>';

      html += '<h4 class="kernel-api__subhead">الأخطاء</h4><p class="kernel-api__endpoint-desc" style="margin-block-end:0;">';
      ep.errors.forEach(function (c) { html += '<code dir="ltr" class="kernel-api__error-code" style="margin-inline-end:var(--space-2);">' + c + '</code> '; });
      html += '— التفاصيل في دفتر الأخطاء أدناه.</p></article>';
    });
    container.innerHTML = html;
  }

  function renderWebhook() {
    var container = document.getElementById('ka-webhook-list');
    if (!container) return;
    var html = '';
    apiData.webhookPayloads.forEach(function (p, i) {
      html += '<li class="kernel-api__payload' + (i === 0 ? ' is-new' : '') + '" data-payload>';
      html += '<div class="kernel-api__payload-head">';
      html += '<span class="kernel-api__payload-event" dir="ltr">' + p.event + '</span>';
      html += '<span class="kernel-api__payload-summary">' + p.summary + '</span>';
      html += '<span class="kernel-api__payload-time">' + p.time + '</span>';
      html += '</div>';
      html += '<pre class="kernel-api__payload-body" dir="ltr">' + escapeHtml(p.body) + '</pre></li>';
    });
    container.innerHTML = html;
  }

  function renderErrors() {
    var container = document.getElementById('ka-errors');
    if (!container) return;
    var html = '<table class="kernel-api__table"><thead><tr><th>الرمز</th><th>المعنى بالعربي</th><th>الحل</th><th>المثال</th></tr></thead><tbody>';
    apiData.errorBook.forEach(function (e) { html += '<tr><td><code dir="ltr">' + e.code + '</code></td><td>' + e.meaning + '</td><td>' + e.fix + '</td><td><code dir="ltr" class="kernel-api__error-example">' + escapeHtml(e.example) + '</code></td></tr>'; });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function renderMigration() {
    var container = document.getElementById('ka-migration');
    if (!container) return;
    var html = '';
    apiData.migrationSteps.forEach(function (m) {
      html += '<article class="kernel-api__endpoint">';
      html += '<h3 class="kernel-api__endpoint-desc" style="margin:0 0 var(--space-2);font-weight:var(--font-semibold);color:var(--text-primary);">' + m.title + '</h3>';
      html += '<p class="kernel-api__endpoint-desc">' + m.note + '</p>';
      html += '<pre class="kernel-api__codeblock" dir="ltr" style="background:var(--k-ink-950,#080d16);"><code>قبل:  ' + escapeHtml(m.before) + '\n\nبعد:  ' + escapeHtml(m.after) + '</code></pre>';
      html += '</article>';
    });
    container.innerHTML = html;
  }

  function renderStatus() {
    var container = document.getElementById('ka-status');
    if (!container) return;
    var html = '<div class="kernel-api__uptime-grid" role="img" aria-label="شبكة حالة الخدمة: 90 يوماً">';
    apiData.statusCells.forEach(function (c) {
      html += '<span class="kernel-api__uptime-cell';
      if (c === 'down') html += ' kernel-api__uptime-cell--down';
      else if (c === 'degraded') html += ' kernel-api__uptime-cell--degraded';
      html += '"></span>';
    });
    html += '</div>';
    html += '<p class="kernel-api__uptime-legend"><span class="ok">متاح</span><span class="degraded">تدهور</span><span class="down">انقطاع</span><span dir="ltr" style="font-variant-numeric:tabular-nums;">99.95%</span></p>';
    container.innerHTML = html;
  }

  function renderChangelog() {
    var container = document.getElementById('ka-releases');
    if (!container) return;
    var html = '<ol class="kernel-api__releases">';
    apiData.changelog.forEach(function (r) {
      html += '<li class="kernel-api__release">';
      html += '<span class="kernel-api__release-version" dir="ltr">' + r.version + '</span>';
      html += '<span class="kernel-api__release-date" dir="ltr"> · ' + r.date + '</span>';
      html += '<p class="kernel-api__release-note">' + r.note + '</p>';
      html += '</li>';
    });
    html += '</ol>';
    container.innerHTML = html;
  }

  function renderSdkDocs() {
    var container = document.getElementById('ka-sdk');
    if (!container) return;
    var html = '';
    apiData.sdkDocs.forEach(function (s) {
      html += '<article class="kernel-api__endpoint">';
      html += '<h3 class="kernel-api__endpoint-desc" style="margin:0 0 var(--space-3);color:var(--text-primary);font-weight:var(--font-semibold);">' + s.label + '</h3>';
      html += '<pre class="kernel-api__codeblock" dir="ltr" style="background:var(--k-ink-950,#080d16);"><code>' + escapeHtml(s.install) + '</code></pre>';
      html += '<pre class="kernel-api__codeblock" dir="ltr" style="background:var(--k-ink-950,#080d16);margin-block-start:var(--space-2);"><code>' + escapeHtml(s.example) + '</code></pre>';
      html += '</article>';
    });
    container.innerHTML = html;
  }

  function renderOperatorDocs() {
    var container = document.getElementById('ka-operator');
    if (!container) return;
    var html = '';
    apiData.operatorDocs.forEach(function (o) {
      html += '<article class="kernel-api__endpoint">';
      html += '<h3 class="kernel-api__endpoint-desc" style="margin:0 0 var(--space-2);color:var(--text-primary);font-weight:var(--font-semibold);">' + o.title + '</h3>';
      html += '<p class="kernel-api__endpoint-desc">' + o.description + '</p>';
      html += '<ol class="kernel-api__subhead" style="color:var(--text-secondary);font-size:var(--text-sm);">';
      o.steps.forEach(function (s) { html += '<li>' + s + '</li>'; });
      html += '</ol></article>';
    });
    container.innerHTML = html;
  }

  function bindCodePanel() {
    var codeOut = document.getElementById('ka-code-output');
    var codeResp = document.getElementById('ka-code-response');
    var copyBtn = document.querySelector('[data-copy-code]');
    var runBtn = document.querySelector('[data-run-code]');
    var langs = Array.prototype.slice.call(document.querySelectorAll('[data-lang]'));
    if (!codeOut) return;
    codeOut.textContent = apiData.codeSamples[0].code;
    function currentCode() {
      var active = document.querySelector('[data-lang].is-active');
      var lang = active ? active.getAttribute('data-lang') : 'curl';
      var sample = apiData.codeSamples.find(function (s) { return s.lang === lang; });
      return sample ? sample.code : '';
    }
    langs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        langs.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true');
        codeOut.textContent = currentCode();
      });
    });
    if (copyBtn) { copyBtn.addEventListener('click', function () { try { navigator.clipboard.writeText(codeOut.textContent || ''); copyBtn.textContent = 'نُسخ ✓'; setTimeout(function () { copyBtn.textContent = 'نسخ الكود'; }, 2000); } catch (e) {} }); }
    if (runBtn && codeResp) { runBtn.addEventListener('click', function () { runBtn.disabled = true; runBtn.textContent = 'جارٍ التنفيذ…'; setTimeout(function () { codeResp.textContent = apiData.sampleResponse; codeResp.hidden = false; runBtn.disabled = false; runBtn.textContent = 'شغّل ◀'; }, 700); }); }
  }

  function bindDemoKey() {
    var keyEl = document.getElementById('ka-demo-key');
    var revealBtn = document.querySelector('[data-reveal-key]');
    var copyKeyBtn = document.querySelector('[data-copy-key]');
    if (!keyEl) return;
    keyEl.textContent = apiData.demoKeyMasked;
    if (revealBtn) { revealBtn.addEventListener('click', function () { var partial = apiData.demoKey.slice(0, -4).replace(/./g, '\u2022') + apiData.demoKey.slice(-4); keyEl.textContent = partial; keyEl.classList.add('is-revealed'); revealBtn.disabled = true; revealBtn.textContent = 'مكشوف جزئياً'; }); }
    if (copyKeyBtn) { copyKeyBtn.addEventListener('click', function () { try { navigator.clipboard.writeText(apiData.demoKeyMasked); copyKeyBtn.textContent = 'نُسخ ✓'; setTimeout(function () { copyKeyBtn.textContent = 'نسخ'; }, 2000); } catch (e) {} }); }
  }

  function bindWebhook() {
    var payloads = Array.prototype.slice.call(document.querySelectorAll('[data-payload]'));
    payloads.forEach(function (li) { li.addEventListener('click', function () { li.classList.toggle('is-open'); }); });
  }

  function bindNavScroll() {
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-nav-link]'));
    if (!('IntersectionObserver' in window) || !links.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { var id = entry.target.getAttribute('id'); links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-nav-link') === id); }); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    links.forEach(function (l) { var sec = document.getElementById(l.getAttribute('data-nav-link') || ''); if (sec) observer.observe(sec); });
  }

  function escapeHtml(str) { return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
  document.addEventListener('astro:page-load', init);
})();
