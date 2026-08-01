/**
 * kernel-reports.js — Vanilla JS engine for /kernel/reports/ (M23).
 *
 * CSP-safe: no dynamic imports, no eval, no Function constructor.
 * Deterministic: no Math.random, no Date.now, no toLocaleString.
 *
 * Features:
 *   - Filters (type + status + language)
 *   - Report library with download buttons
 *   - Generate wizard (4 steps: type → period → format → recipients)
 *   - Report builder (drag & drop widgets onto A4 canvas)
 *   - Report preview (drawer with executive summary)
 *   - 5 languages switcher
 *   - Template versions tab (hash-chained)
 *   - Trace coverage + Certificate coverage display
 *   - Scheduled reports section
 *   - Role recipients (not emails)
 */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────────────────

  var data = (typeof window !== 'undefined' && window.KernelReportsData) || null;
  var rows = [];
  var scheduled = [];
  var templateVersions = [];
  var stats = {};
  var activeFilters = { type: 'all', status: 'all', language: 'all' };
  var wizardStep = 1;
  var builderWidgets = [];

  // ── Init ───────────────────────────────────────────────────────────────────

  function init() {
    if (!data) {
      console.error('KernelReportsData not loaded');
      return;
    }
    rows = data.buildReportRows();
    scheduled = data.buildScheduledReports();
    templateVersions = data.buildTemplateVersions();
    stats = data.buildReportStats();

    renderKpis();
    renderReportList();
    renderScheduledList();
    renderTemplateVersions();
    renderBuilderPalette();
    renderLanguageSwitcher();
    bindFilters();
    bindWizard();
    bindBuilder();
    bindPreview();
    bindDownloadButtons();
    bindScheduledToggle();
  }

  // ── KPIs ───────────────────────────────────────────────────────────────────

  function renderKpis() {
    var els = document.querySelectorAll('[data-kr-kpi]');
    for (var i = 0; i < els.length; i += 1) {
      var key = els[i].getAttribute('data-kr-kpi');
      if (key === 'total') els[i].textContent = String(stats.total);
      else if (key === 'ready') els[i].textContent = String(stats.ready);
      else if (key === 'generating') els[i].textContent = String(stats.generating);
      else if (key === 'scheduled') els[i].textContent = String(stats.scheduled);
      else if (key === 'recipients') els[i].textContent = String(stats.recipients);
    }
  }

  // ── Report list ────────────────────────────────────────────────────────────

  function renderReportList() {
    var container = document.getElementById('kr-reports-list');
    if (!container) return;

    var filtered = rows.filter(function (r) {
      var matchType = activeFilters.type === 'all' || r.type === activeFilters.type;
      var matchStatus = activeFilters.status === 'all' || r.status === activeFilters.status;
      var matchLang = activeFilters.language === 'all' || r.language === activeFilters.language;
      return matchType && matchStatus && matchLang;
    });

    var html = '';
    for (var i = 0; i < filtered.length; i += 1) {
      var r = filtered[i];
      var typeIcon = getTypeIcon(r.type);
      var statusPill = r.status === 'ready'
        ? '<span class="kr-status-pill kr-status-pill--ready">جاهز</span>'
        : r.status === 'generating'
        ? '<div class="kr-generating"><div class="kr-progress"><span style="inline-size:' + r.progress + '%"></span></div><span>' + r.progress + '%</span></div>'
        : '<span class="kr-status-pill kr-status-pill--failed">فشل</span>';

      html += '<article class="kr-report-row kr-report-row--' + r.status + '" data-type="' + r.type + '" data-status="' + r.status + '" data-language="' + r.language + '">'
        + '<div class="kr-report-row__icon" aria-hidden="true">' + typeIcon + '</div>'
        + '<div class="kr-report-row__info">'
        + '<h3 class="kr-report-row__title">' + escapeHtml(r.title) + '</h3>'
        + '<div class="kr-report-row__meta">'
        + '<span class="kr-badge kr-badge--neutral" lang="en">' + r.format + '</span>'
        + '<span>' + escapeHtml(r.period) + '</span>'
        + '<span>·</span>'
        + '<span>' + r.sizeMb + ' MB</span>'
        + '<span>·</span>'
        + '<span class="kr-lang-badge">' + getLanguageLabel(r.language) + '</span>'
        + '</div>'
        + '<div class="kr-report-row__coverage">'
        + '<span class="kr-coverage-badge" title="Trace coverage">🔗 ' + r.traceCoverageCount + ' Trace</span>'
        + (r.certificateCoverageCount > 0 ? '<span class="kr-coverage-badge" title="Certificate coverage">📜 ' + r.certificateCoverageCount + ' شهادة</span>' : '')
        + '</div>'
        + '</div>'
        + '<div class="kr-report-row__status">'
        + statusPill
        + '<span class="kr-report-row__date">' + r.createdAtLabel + '</span>'
        + '</div>'
        + '<div class="kr-report-row__actions">'
        + '<button type="button" class="kr-report-row__preview" data-kr-preview="' + r.id + '" aria-label="معاينة ' + escapeHtml(r.title) + '">معاينة</button>'
        + '<button type="button" class="kr-report-row__download" data-kr-download="' + r.id + '" ' + (r.status !== 'ready' ? 'disabled' : '') + ' aria-label="تحميل ' + escapeHtml(r.title) + '">تحميل</button>'
        + '</div>'
        + '</article>';
    }

    if (filtered.length === 0) {
      html = '<div class="kr-empty-state"><p>لا توجد تقارير مطابقة للفلاتر</p><button type="button" class="kr-empty-reset" data-kr-reset>إعادة ضبط الفلاتر</button></div>';
    }

    container.innerHTML = html;
  }

  // ── Scheduled list ─────────────────────────────────────────────────────────

  function renderScheduledList() {
    var container = document.getElementById('kr-scheduled-list');
    if (!container) return;

    var html = '';
    for (var i = 0; i < scheduled.length; i += 1) {
      var s = scheduled[i];
      var statusClass = s.status === 'active' ? 'kr-scheduled-row__status--active' : 'kr-scheduled-row__status--paused';
      var statusText = s.status === 'active' ? 'نشط' : 'موقوف';
      html += '<article class="kr-scheduled-row" data-scheduled-id="' + s.id + '">'
        + '<div class="kr-scheduled-row__info">'
        + '<h3 class="kr-scheduled-row__title">' + escapeHtml(s.title) + '</h3>'
        + '<div class="kr-scheduled-row__meta">'
        + '<span>' + escapeHtml(s.frequency) + '</span>'
        + '<span>·</span>'
        + '<span>المستقبل التالي: ' + escapeHtml(s.nextRun) + '</span>'
        + '<span>·</span>'
        + '<span>' + s.recipientsCount + ' مستلم</span>'
        + '<span>·</span>'
        + '<span class="kr-lang-badge">' + getLanguageLabel(s.language) + '</span>'
        + '</div>'
        + '</div>'
        + '<span class="kr-scheduled-row__status ' + statusClass + '">' + statusText + '</span>'
        + '<button type="button" class="kr-scheduled-row__toggle" data-kr-toggle-scheduled="' + s.id + '" aria-label="تبديل جدول ' + escapeHtml(s.title) + '">'
        + (s.status === 'active' ? 'إيقاف' : 'تفعيل')
        + '</button>'
        + '</article>';
    }
    container.innerHTML = html;
  }

  // ── Template versions ──────────────────────────────────────────────────────

  function renderTemplateVersions() {
    var container = document.getElementById('kr-template-versions');
    if (!container) return;

    var html = '';
    for (var i = 0; i < templateVersions.length; i += 1) {
      var v = templateVersions[i];
      var certBadge = v.certifiedBy
        ? '<span class="kr-cert-badge" title="مثبّت بشهادة">🔒 ' + v.certifiedBy + '</span>'
        : '<span class="kr-cert-badge kr-cert-badge--none">غير مثبّت</span>';
      html += '<article class="kr-version-row">'
        + '<div class="kr-version-row__info">'
        + '<h3 class="kr-version-row__title">الإصدار ' + v.version + '</h3>'
        + '<p class="kr-version-row__note">' + escapeHtml(v.note) + '</p>'
        + '<div class="kr-version-row__meta">'
        + '<span>' + v.createdAtLabel + '</span>'
        + '<span>·</span>'
        + '<span class="kr-hash" dir="ltr">' + v.hash + '</span>'
        + '</div>'
        + '</div>'
        + '<div class="kr-version-row__cert">' + certBadge + '</div>'
        + '</article>';
    }
    container.innerHTML = html;
  }

  // ── Builder palette ────────────────────────────────────────────────────────

  function renderBuilderPalette() {
    var container = document.getElementById('kr-builder-palette');
    if (!container) return;

    var widgets = data.REPORT_WIDGETS;
    var html = '';
    for (var i = 0; i < widgets.length; i += 1) {
      var w = widgets[i];
      html += '<button type="button" class="kr-widget-palette-item" draggable="true" data-kr-widget-type="' + w.type + '" data-kr-widget-label="' + escapeHtml(w.label) + '">'
        + '<span aria-hidden="true">' + w.icon + '</span>'
        + '<span>' + escapeHtml(w.label) + '</span>'
        + '</button>';
    }
    container.innerHTML = html;
  }

  // ── Language switcher ──────────────────────────────────────────────────────

  function renderLanguageSwitcher() {
    var container = document.getElementById('kr-language-switcher');
    if (!container) return;

    var langs = data.REPORT_LANGUAGES;
    var html = '';
    for (var i = 0; i < langs.length; i += 1) {
      var l = langs[i];
      var active = l.id === 'ar' ? ' active' : '';
      html += '<button type="button" class="kr-lang-btn' + active + '" data-kr-lang="' + l.id + '" aria-pressed="' + (l.id === 'ar' ? 'true' : 'false') + '">'
        + '<span>' + escapeHtml(l.native) + '</span>'
        + '</button>';
    }
    container.innerHTML = html;
  }

  // ── Filters ────────────────────────────────────────────────────────────────

  function bindFilters() {
    var typeBtns = document.querySelectorAll('[data-kr-filter-type]');
    var statusBtns = document.querySelectorAll('[data-kr-filter-status]');
    var langBtns = document.querySelectorAll('[data-kr-filter-language]');

    typeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        typeBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilters.type = btn.getAttribute('data-kr-filter-type');
        renderReportList();
      });
    });

    statusBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        statusBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilters.status = btn.getAttribute('data-kr-filter-status');
        renderReportList();
      });
    });

    langBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        langBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        activeFilters.language = btn.getAttribute('data-kr-filter-language');
        renderReportList();
      });
    });

    // Reset button (delegated).
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('[data-kr-reset]')) {
        activeFilters = { type: 'all', status: 'all', language: 'all' };
        typeBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-kr-filter-type') === 'all'); });
        statusBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-kr-filter-status') === 'all'); });
        langBtns.forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-kr-filter-language') === 'all'); });
        renderReportList();
      }
    });
  }

  // ── Wizard ─────────────────────────────────────────────────────────────────

  function bindWizard() {
    var modal = document.getElementById('kr-wizard-modal');
    if (!modal) return;

    var openBtn = document.getElementById('kr-open-wizard');
    var closeEls = modal.querySelectorAll('[data-kr-close-wizard]');
    var prevBtn = modal.querySelector('#kr-wizard-prev');
    var nextBtn = modal.querySelector('#kr-wizard-next');
    var genBtn = modal.querySelector('#kr-wizard-generate');
    var steps = modal.querySelectorAll('.kr-wizard__step');
    var panels = modal.querySelectorAll('[data-kr-wizard-panel]');

    function openWizard() {
      wizardStep = 1;
      updateWizardUI();
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeWizard() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    function updateWizardUI() {
      steps.forEach(function (s) {
        var stepNum = parseInt(s.getAttribute('data-step'), 10);
        s.classList.toggle('active', stepNum <= wizardStep);
      });
      panels.forEach(function (p) {
        var panelNum = parseInt(p.getAttribute('data-kr-wizard-panel'), 10);
        p.hidden = panelNum !== wizardStep;
      });
      if (prevBtn) prevBtn.hidden = wizardStep === 1;
      if (nextBtn) nextBtn.hidden = wizardStep === 4;
      if (genBtn) genBtn.hidden = wizardStep !== 4;
    }

    if (openBtn) openBtn.addEventListener('click', openWizard);
    closeEls.forEach(function (el) { el.addEventListener('click', closeWizard); });

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (wizardStep < 4) {
          wizardStep += 1;
          updateWizardUI();
        }
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        if (wizardStep > 1) {
          wizardStep -= 1;
          updateWizardUI();
        }
      });
    }

    if (genBtn) {
      genBtn.addEventListener('click', function () {
        genBtn.disabled = true;
        genBtn.innerHTML = '<span>جاري التوليد…</span>';
        setTimeout(function () {
          genBtn.innerHTML = '<span>تم إنشاء التقرير</span>';
          setTimeout(closeWizard, 1200);
        }, 1500);
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeWizard();
    });
  }

  // ── Builder (drag & drop) ──────────────────────────────────────────────────

  function bindBuilder() {
    var canvas = document.getElementById('kr-builder-canvas');
    var paletteItems = document.querySelectorAll('[data-kr-widget-type]');
    if (!canvas) return;

    // Palette items: drag start.
    paletteItems.forEach(function (item) {
      item.addEventListener('dragstart', function (e) {
        if (e.dataTransfer) {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            type: item.getAttribute('data-kr-widget-type'),
            label: item.getAttribute('data-kr-widget-label')
          }));
        }
      });
    });

    // Canvas: drop.
    canvas.addEventListener('dragover', function (e) {
      e.preventDefault();
      canvas.classList.add('kr-builder-canvas--drag-over');
    });

    canvas.addEventListener('dragleave', function () {
      canvas.classList.remove('kr-builder-canvas--drag-over');
    });

    canvas.addEventListener('drop', function (e) {
      e.preventDefault();
      canvas.classList.remove('kr-builder-canvas--drag-over');
      if (!e.dataTransfer) return;
      var raw = e.dataTransfer.getData('text/plain');
      try {
        var widget = JSON.parse(raw);
        addWidgetToCanvas(widget);
      } catch (err) {
        // Ignore malformed.
      }
    });

    // Save template button.
    var saveBtn = document.getElementById('kr-builder-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        if (builderWidgets.length === 0) {
          showToast('أضف widgets أولًا');
          return;
        }
        showToast('تم حفظ القالب');
      });
    }

    // Clear button.
    var clearBtn = document.getElementById('kr-builder-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        builderWidgets = [];
        renderCanvasWidgets();
      });
    }
  }

  function addWidgetToCanvas(widget) {
    var id = 'bw-' + (builderWidgets.length + 1);
    builderWidgets.push({
      id: id,
      type: widget.type,
      label: widget.label
    });
    renderCanvasWidgets();
  }

  function renderCanvasWidgets() {
    var canvas = document.getElementById('kr-builder-canvas');
    if (!canvas) return;

    var widgetsContainer = canvas.querySelector('.kr-builder-widgets');
    if (!widgetsContainer) {
      widgetsContainer = document.createElement('div');
      widgetsContainer.className = 'kr-builder-widgets';
      canvas.appendChild(widgetsContainer);
    }

    if (builderWidgets.length === 0) {
      widgetsContainer.innerHTML = '<div class="kr-builder-empty">اسحب widgets هنا لبناء التقرير</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < builderWidgets.length; i += 1) {
      var w = builderWidgets[i];
      var icon = getWidgetIcon(w.type);
      html += '<div class="kr-builder-widget kr-builder-widget--' + w.type + '" data-widget-id="' + w.id + '">'
        + '<div class="kr-builder-widget__header">'
        + '<span class="kr-builder-widget__icon">' + icon + '</span>'
        + '<span class="kr-builder-widget__label">' + escapeHtml(w.label) + '</span>'
        + '<button type="button" class="kr-builder-widget__remove" data-kr-remove-widget="' + w.id + '" aria-label="حذف">×</button>'
        + '</div>'
        + '<div class="kr-builder-widget__body">' + getWidgetPreview(w.type) + '</div>'
        + '</div>';
    }
    widgetsContainer.innerHTML = html;

    // Bind remove buttons.
    var removeBtns = widgetsContainer.querySelectorAll('[data-kr-remove-widget]');
    removeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wid = btn.getAttribute('data-kr-remove-widget');
        builderWidgets = builderWidgets.filter(function (w) { return w.id !== wid; });
        renderCanvasWidgets();
      });
    });
  }

  function getWidgetPreview(type) {
    if (type === 'kpi') return '<div class="kr-widget-preview kr-widget-preview--kpi"><span class="kr-widget-preview__value">12,483</span><span class="kr-widget-preview__label">إجمالي الطلبات</span></div>';
    if (type === 'chart') return '<div class="kr-widget-preview kr-widget-preview--chart"><div class="kr-widget-preview__chart"></div></div>';
    if (type === 'table') return '<div class="kr-widget-preview kr-widget-preview--table"><div class="kr-widget-preview__row"></div><div class="kr-widget-preview__row"></div><div class="kr-widget-preview__row"></div></div>';
    if (type === 'text') return '<div class="kr-widget-preview kr-widget-preview--text"><div class="kr-widget-preview__line"></div><div class="kr-widget-preview__line"></div></div>';
    if (type === 'page-break') return '<div class="kr-widget-preview kr-widget-preview--page-break"><span>— فاصل صفحة —</span></div>';
    return '';
  }

  function getWidgetIcon(type) {
    var widgets = data.REPORT_WIDGETS;
    for (var i = 0; i < widgets.length; i += 1) {
      if (widgets[i].type === type) return widgets[i].icon;
    }
    return '📄';
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  function bindPreview() {
    var drawer = document.getElementById('kr-preview-drawer');
    if (!drawer) return;

    var closeEls = drawer.querySelectorAll('[data-kr-close-preview]');
    closeEls.forEach(function (el) {
      el.addEventListener('click', function () {
        drawer.setAttribute('aria-hidden', 'true');
        drawer.hidden = true;
      });
    });

    // Delegated: preview buttons.
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('[data-kr-preview]')) {
        var btn = target.closest('[data-kr-preview]');
        var id = btn.getAttribute('data-kr-preview');
        openPreview(id);
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) {
        drawer.setAttribute('aria-hidden', 'true');
        drawer.hidden = true;
      }
    });
  }

  function openPreview(id) {
    var drawer = document.getElementById('kr-preview-drawer');
    if (!drawer) return;

    var row = rows.find(function (r) { return r.id === id; });
    if (!row) return;

    var titleEl = drawer.querySelector('[data-kr-preview-title]');
    var summaryEl = drawer.querySelector('[data-kr-preview-summary]');
    var metaEl = drawer.querySelector('[data-kr-preview-meta]');
    var traceEl = drawer.querySelector('[data-kr-preview-traces]');
    var certEl = drawer.querySelector('[data-kr-preview-certs]');

    if (titleEl) titleEl.textContent = row.title;
    if (summaryEl) summaryEl.textContent = row.executiveSummary;
    if (metaEl) {
      metaEl.innerHTML = '<span class="kr-badge kr-badge--neutral" lang="en">' + row.format + '</span>'
        + '<span>' + escapeHtml(row.period) + '</span>'
        + '<span>·</span>'
        + '<span>' + row.sizeMb + ' MB</span>'
        + '<span>·</span>'
        + '<span class="kr-lang-badge">' + getLanguageLabel(row.language) + '</span>';
    }
    if (traceEl) {
      var traceHtml = '<div class="kr-trace-coverage"><span class="kr-trace-coverage__count">' + row.traceCoverageCount + ' Trace ID</span><div class="kr-trace-coverage__list">';
      var maxShow = Math.min(row.traceCoverage.length, 10);
      for (var i = 0; i < maxShow; i += 1) {
        traceHtml += '<span class="kr-trace-id" dir="ltr">' + row.traceCoverage[i] + '</span>';
      }
      if (row.traceCoverage.length > 10) {
        traceHtml += '<span class="kr-trace-more">+' + (row.traceCoverage.length - 10) + '</span>';
      }
      traceHtml += '</div></div>';
      traceEl.innerHTML = traceHtml;
    }
    if (certEl) {
      if (row.certificateCoverage.length === 0) {
        certEl.innerHTML = '<p class="kr-no-certs">لا توجد شهادات مرتبطة</p>';
      } else {
        var certHtml = '<div class="kr-cert-coverage">';
        for (var c = 0; c < row.certificateCoverage.length; c += 1) {
          certHtml += '<span class="kr-cert-id" dir="ltr">' + row.certificateCoverage[c] + '</span>';
        }
        certHtml += '</div>';
        certEl.innerHTML = certHtml;
      }
    }

    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
  }

  // ── Download buttons ───────────────────────────────────────────────────────

  function bindDownloadButtons() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('[data-kr-download]')) {
        var btn = target.closest('[data-kr-download]');
        if (btn.disabled) return;
        var original = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span>جاري التحميل…</span>';
        setTimeout(function () {
          btn.disabled = false;
          btn.innerHTML = original;
        }, 1200);
      }
    });
  }

  // ── Scheduled toggle ───────────────────────────────────────────────────────

  function bindScheduledToggle() {
    document.addEventListener('click', function (e) {
      var target = e.target;
      if (target && target.closest && target.closest('[data-kr-toggle-scheduled]')) {
        var btn = target.closest('[data-kr-toggle-scheduled]');
        var id = btn.getAttribute('data-kr-toggle-scheduled');
        var item = scheduled.find(function (s) { return s.id === id; });
        if (item) {
          item.status = item.status === 'active' ? 'paused' : 'active';
          renderScheduledList();
        }
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getTypeIcon(type) {
    for (var i = 0; i < data.REPORT_TYPES.length; i += 1) {
      if (data.REPORT_TYPES[i].id === type) return data.REPORT_TYPES[i].icon;
    }
    return '📄';
  }

  function getLanguageLabel(langId) {
    for (var i = 0; i < data.REPORT_LANGUAGES.length; i += 1) {
      if (data.REPORT_LANGUAGES[i].id === langId) return data.REPORT_LANGUAGES[i].native;
    }
    return langId;
  }

  function escapeHtml(str) {
    var s = String(str == null ? '' : str);
    return s
      .replace(/&/g, '\x26amp;')
      .replace(/</g, '\x26lt;')
      .replace(/>/g, '\x26gt;')
      .replace(/"/g, '\x26quot;')
      .replace(/'/g, '\x26#39;');
  }

  function showToast(msg) {
    var toast = document.getElementById('k-toast');
    if (!toast) return;
    var msgEl = toast.querySelector('[data-kernel-toast-msg]');
    if (msgEl) msgEl.textContent = msg;
    toast.hidden = false;
    setTimeout(function () { toast.hidden = true; }, 3000);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load', init);
})();