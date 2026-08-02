/**
 * kernel-api.js — Vanilla JS engine for /kernel/api/ (M27).
 * CRITICAL SECURITY: Never expose full API key. "Reveal" shows only last 4 chars.
 * CSP-safe, deterministic, prefers-reduced-motion.
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
      html += '<article class="ka-endpoint" id="ep-' + ep.id + '">';
      html += '<header class="ka-endpoint__head"><span class="ka-method ka-method--' + ep.method.toLowerCase() + '">' + ep.method + '</span><code class="ka-path" dir="ltr">' + ep.path + '</code></header>';
      html += '<h3 class="ka-endpoint__title">' + ep.title + '</h3>';
      html += '<p class="ka-endpoint__desc">' + ep.desc + '</p>';
      html += '<h4 class="ka-subhead">المعاملات</h4>';
      html += '<table class="ka-table"><thead><tr><th>المعامل</th><th>النوع</th><th>إلزامي</th><th>الوصف</th></tr></thead><tbody>';
      ep.params.forEach(function (p) { html += '<tr><td><code dir="ltr">' + p.name + '</code></td><td><code dir="ltr">' + p.type + '</code></td><td>' + (p.required ? 'نعم' : 'لا') + '</td><td>' + p.desc + '</td></tr>'; });
      html += '</tbody></table>';
      html += '<h4 class="ka-subhead">الاستجابة</h4>';
      html += '<table class="ka-table"><thead><tr><th>الحقل</th><th>النوع</th><th>الوصف</th></tr></thead><tbody>';
      ep.response.forEach(function (r) { html += '<tr><td><code dir="ltr">' + r.name + '</code></td><td><code dir="ltr">' + r.type + '</code></td><td>' + r.desc + '</td></tr>'; });
      html += '</tbody></table>';
      html += '<h4 class="ka-subhead">الأخطاء</h4><p class="ka-endpoint__errors">';
      ep.errors.forEach(function (c) { html += '<code dir="ltr" class="ka-error-code">' + c + '</code> '; });
      html += '— التفاصيل في دفتر الأخطاء.</p></article>';
    });
    container.innerHTML = html;
  }

  function renderWebhook() {
    var container = document.getElementById('ka-webhook-list');
    if (!container) return;
    var html = '';
    apiData.webhookPayloads.forEach(function (p, i) {
      html += '<li class="ka-payload' + (i === 0 ? ' is-new' : '') + '" data-payload>';
      html += '<div class="ka-payload__head"><span class="ka-payload__event" dir="ltr">' + p.event + '</span><span class="ka-payload__summary">' + p.summary + '</span><span class="ka-payload__time">' + p.time + '</span></div>';
      html += '<pre class="ka-payload__body" dir="ltr">' + escapeHtml(p.body) + '</pre></li>';
    });
    container.innerHTML = html;
  }

  function renderErrors() {
    var container = document.getElementById('ka-errors');
    if (!container) return;
    var html = '<table class="ka-table"><thead><tr><th>الرمز</th><th>المعنى</th><th>الحل</th><th>مثال</th></tr></thead><tbody>';
    apiData.errorBook.forEach(function (e) { html += '<tr><td><code dir="ltr">' + e.code + '</code></td><td>' + e.meaning + '</td><td>' + e.fix + '</td><td><code dir="ltr" class="ka-error-example">' + escapeHtml(e.example) + '</code></td></tr>'; });
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  function renderMigration() {
    var container = document.getElementById('ka-migration');
    if (!container) return;
    var html = '';
    apiData.migrationSteps.forEach(function (m) {
      html += '<article class="ka-migration__step"><h3 class="ka-migration__title">' + m.title + '</h3><p class="ka-migration__note">' + m.note + '</p>';
      html += '<pre class="ka-codeblock" dir="ltr"><code>قبل:  ' + escapeHtml(m.before) + '\n\nبعد:  ' + escapeHtml(m.after) + '</code></pre></article>';
    });
    container.innerHTML = html;
  }

  function renderStatus() {
    var container = document.getElementById('ka-status');
    if (!container) return;
    var html = '<div class="ka-uptime-grid" role="img" aria-label="شبكة حالة الخدمة: 90 يوماً">';
    apiData.statusCells.forEach(function (c) { html += '<span class="ka-uptime-cell ka-uptime-cell--' + c + '"></span>'; });
    html += '</div><p class="ka-uptime-legend"><span class="ok">متاح</span><span class="degraded">تدهور</span><span class="down">انقطاع</span><span dir="ltr">99.95%</span></p>';
    container.innerHTML = html;
  }

  function renderChangelog() {
    var container = document.getElementById('ka-releases');
    if (!container) return;
    var html = '<ol class="ka-releases">';
    apiData.changelog.forEach(function (r) {
      html += '<li class="ka-release"><span class="ka-release__version" dir="ltr">' + r.version + '</span><span class="ka-release__date" dir="ltr"> · ' + r.date + '</span><p class="ka-release__note">' + r.note + '</p></li>';
    });
    html += '</ol>';
    container.innerHTML = html;
  }

  function renderSdkDocs() {
    var container = document.getElementById('ka-sdk');
    if (!container) return;
    var html = '';
    apiData.sdkDocs.forEach(function (s) {
      html += '<article class="ka-sdk"><h3 class="ka-sdk__label">' + s.label + '</h3><pre class="ka-sdk__install" dir="ltr"><code>' + escapeHtml(s.install) + '</code></pre><pre class="ka-sdk__example" dir="ltr"><code>' + escapeHtml(s.example) + '</code></pre></article>';
    });
    container.innerHTML = html;
  }

  function renderOperatorDocs() {
    var container = document.getElementById('ka-operator');
    if (!container) return;
    var html = '';
    apiData.operatorDocs.forEach(function (o) {
      html += '<article class="ka-operator"><h3 class="ka-operator__title">' + o.title + '</h3><p class="ka-operator__desc">' + o.description + '</p><ol class="ka-operator__steps">';
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
