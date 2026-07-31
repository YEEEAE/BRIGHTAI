/**
 * kernel-datasets.js — M7: Dataset Manager engine (2026-07-31).
 *
 * محرك صفحة /kernel/datasets/ — vanilla JS، يعمل محلياً في المتصفح، CSP-safe
 * (ES module خارجي + بيانات من JSON blob #ds-config — لا unsafe-inline).
 *
 * القواعد (Evaluation-environment.md §المرحلة 1 + Prompt 08/M7):
 *   - لا تعدّل Dataset منشوراً إطلاقاً — أي تعديل ينشئ version جديداً.
 *   - لا تحذف Dataset مستخدَماً في Run (usedInRuns > 0).
 *   - كل version له hash حتمي (FNV-1a) يعاد حسابه عند أي تغيير.
 *   - فصل Demo / Test / Live صارم — كل Dataset يحمل environment صريح.
 *   - استيراد CSV / JSON / JSONL / لصق جدول + إضافة حالة يدوية.
 *   - كشف تكرار (تطبيع المدخل) + كشف نقص السلوك المتوقع.
 *   - تقسيم train/validation/test + مجموعات فرعية بفلاتر وبذرة.
 *
 * ملاحظة النموذج: الحالات المنشورة immutable؛ النسخ المسودة (draft) قابلة
 * للتعديل وتُحفظ في state._drafts على شكل [version] → { cases, note }.
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  var root = document.querySelector('[data-ds-root]');
  if (!root) return;

  /* ── الإعدادات من JSON blob ─────────────────────────────────────── */
  var config = {};
  var cfgEl = document.getElementById('ds-config');
  if (cfgEl) {
    try { config = JSON.parse(cfgEl.textContent || '{}'); } catch (e) { config = {}; }
  }
  var labels = config.labels || {};
  var L = {
    verdicts: labels.verdicts || {},
    verdictColors: labels.verdictColors || {},
    risks: labels.risks || {},
    statuses: labels.statuses || {},
    langs: labels.langs || {},
    envs: labels.envs || {},
    sectors: labels.sectors || {},
  };

  /* ── الحالة ──────────────────────────────────────────────────────── */
  var state = {
    datasets: [],
    selectedId: null,
    search: '',
    statusFilter: 'all',
    importTab: 'csv',
    // per-dataset case filters: datasetId → { q, sector, verdict, risk, lang }
    caseFilters: {},
    // draft case-sets: datasetId → { cases, note }
    drafts: {},
    // split modal temp subset filters
    subsetSector: '',
    subsetVerdict: '',
    subsetSeed: '',
    compare: { datasetId: null, a: null, b: null },
    editingCaseId: null,
  };

  /* ── أدوات مساعدة ────────────────────────────────────────────────── */
  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function nowIso() { return new Date().toISOString(); }

  function pad(n, len) { return String(n).padStart(len, '0'); }

  function nextSeq(key) {
    var n = Number(localStorage.getItem('brightai-ds-seq-' + key) || '0') + 1;
    try { localStorage.setItem('brightai-ds-seq-' + key, String(n)); } catch (e) {}
    return n;
  }

  /** FNV-1a 32-bit — مطابق لدالة TS في src/data/kernel-datasets.ts. */
  function fnv1a(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return '0x' + (h >>> 0).toString(16).padStart(8, '0');
  }

  function versionHash(cases, note) {
    var canonical = cases.map(function (c) {
      return c.id + '|' + c.verdict + '|' + c.risk + '|' + c.input;
    }).join('\n');
    return fnv1a(canonical + '\nnote:' + note);
  }

  function normalizeInput(input) {
    return String(input || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[،؛:؟.!«»"'`,;:?.'()\-–—]/g, '')
      .trim();
  }

  function findDataset(id) {
    return state.datasets.find(function (d) { return d.id === id; }) || null;
  }

  function getVersion(d, v) {
    return (d.versions || []).find(function (x) { return x.version === v; }) || null;
  }

  /** مجموعة الحالات العاملة: مسودة إن وُجدت، وإلا المنشورة. */
  function getWorking(d) {
    var draft = state.drafts[d.id];
    if (draft) return draft.cases;
    if (d.status === 'draft') return d.cases;
    return d.cases; // published/archived — للقراءة فقط
  }

  function maxVersion(d) {
    return (d.versions || []).reduce(function (m, v) { return Math.max(m, v.version); }, 0);
  }

  /** ينشئ version جديد من مجموعة عمل — أي تعديل = version جديد (M7). */
  function pushVersion(d, cases, note) {
    var v = maxVersion(d) + 1;
    var parent = maxVersion(d) || 1;
    var prev = state.drafts[d.id] ? state.drafts[d.id].cases : d.cases;
    var diff = diffCases(prev, cases);
    var ver = {
      version: v,
      status: 'draft',
      hash: versionHash(cases, note),
      createdAt: nowIso(),
      createdBy: 'جلسة محلية (Demo)',
      note: note,
      caseCount: cases.length,
      parentVersion: parent,
      diff: { added: diff.added, removed: diff.removed, modified: diff.modified },
    };
    d.versions.push(ver);
    state.drafts[d.id] = { cases: clone(cases), note: note };
    return ver;
  }

  /** فرق مجموعتي حالات بمعرّفها وتغيّر الحكم/الخطورة. */
  function diffCases(a, b) {
    var added = [], removed = [], modified = [];
    var am = {}, bm = {};
    a.forEach(function (c) { am[c.id] = c; });
    b.forEach(function (c) { bm[c.id] = c; });
    b.forEach(function (c) {
      if (!am[c.id]) added.push(c.id);
      else if (am[c.id].verdict !== c.verdict || am[c.id].risk !== c.risk || am[c.id].input !== c.input) modified.push(c.id);
    });
    a.forEach(function (c) { if (!bm[c.id]) removed.push(c.id); });
    return { added: added, removed: removed, modified: modified };
  }

  /** حساب إحصاءات حالة (للجدول + التحذيرات). */
  function computeStats(cases) {
    var verdicts = { allowed: 0, redacted: 0, blocked: 0, approval_required: 0 };
    var risks = { low: 0, medium: 0, high: 0, critical: 0 };
    var missing = [];
    var dups = [];
    var seen = {};
    cases.forEach(function (c) {
      if (verdicts[c.verdict] != null) verdicts[c.verdict] += 1;
      if (risks[c.risk] != null) risks[c.risk] += 1;
      if (!c.expected || !c.expected.trim()) missing.push(c.id);
      var key = normalizeInput(c.input);
      if (key) {
        if (seen[key]) dups.push({ a: seen[key], b: c.id });
        else seen[key] = c.id;
      }
    });
    return { total: cases.length, verdicts: verdicts, risks: risks, missing: missing, dups: dups };
  }

  /* ── التوست ──────────────────────────────────────────────────────── */
  var toastEl = document.getElementById('ds-toast');
  var toastMsg = document.getElementById('ds-toast-msg');
  var toastTimer = null;
  function showToast(msg, ms) {
    if (!toastEl || !toastMsg) return;
    toastMsg.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, ms || 3200);
  }

  /* ── العرض: السجل ────────────────────────────────────────────────── */
  function matchRow(d) {
    if (state.statusFilter !== 'all' && d.status !== state.statusFilter) return false;
    var q = state.search.trim().toLowerCase();
    if (!q) return true;
    return (d.name + ' ' + (d.owner || '') + ' ' + d.id + ' ' + (d.description || '')).toLowerCase().indexOf(q) !== -1;
  }

  function currentVersionOf(d) {
    var cur = getVersion(d, d.currentVersion) || d.versions[d.versions.length - 1] || { version: 1 };
    return cur;
  }

  function registryRow(d) {
    var cur = currentVersionOf(d);
    var hash = (cur.hash || '').slice(0, 10);
    var actions =
      '<button class="ds-icon-btn" type="button" data-ds-action="open" data-ds-id="' + esc(d.id) + '" aria-label="فتح" title="فتح">👁</button>' +
      '<button class="ds-icon-btn" type="button" data-ds-action="new-version" data-ds-id="' + esc(d.id) + '" aria-label="نسخة جديدة" title="نسخة جديدة">⧉</button>' +
      '<button class="ds-icon-btn" type="button" data-ds-action="publish" data-ds-id="' + esc(d.id) + '" aria-label="نشر الإصدار" title="نشر الإصدار">⬆</button>' +
      '<button class="ds-icon-btn" type="button" data-ds-action="split" data-ds-id="' + esc(d.id) + '" aria-label="تقسيم" title="تقسيم">◫</button>' +
      '<button class="ds-icon-btn" type="button" data-ds-action="compare" data-ds-id="' + esc(d.id) + '" aria-label="مقارنة الإصدارات" title="مقارنة">⇄</button>' +
      (d.status !== 'published'
        ? '<button class="ds-icon-btn" type="button" data-ds-action="archive" data-ds-id="' + esc(d.id) + '" aria-label="أرشفة" title="أرشفة">🗄</button>'
        : '') +
      '<button class="ds-icon-btn ds-icon-btn--danger" type="button" data-ds-action="delete" data-ds-id="' + esc(d.id) + '" aria-label="حذف" title="حذف">✕</button>';
    return (
      '<tr data-ds-row="' + esc(d.id) + '" data-ds-status="' + esc(d.status) + '" data-ds-env="' + esc(d.environment) + '">' +
      '<td><button class="ds-row-name" type="button" data-ds-action="open" data-ds-id="' + esc(d.id) + '">' + esc(d.name) + '</button></td>' +
      '<td><span class="ds-env-chip ds-env-chip--' + esc(d.environment) + '">' + esc((L.envs[d.environment] || d.environment)) + '</span></td>' +
      '<td><span class="ds-status ds-status--' + esc(d.status) + '">' + esc((L.statuses[d.status] || d.status)) + '</span></td>' +
      '<td><span class="ds-version" dir="ltr">v' + esc(cur.version) + '</span><code class="ds-hash" dir="ltr" title="hash v' + esc(cur.version) + ': ' + esc(cur.hash) + '">' + esc(hash) + '…</code></td>' +
      '<td dir="ltr">' + (d.cases ? d.cases.length : 0) + '</td>' +
      '<td dir="ltr">' + esc(d.source) + '</td>' +
      '<td><span class="ds-runs' + (d.usedInRuns > 0 ? ' ds-runs--used' : '') + '" dir="ltr">' + d.usedInRuns + '</span></td>' +
      '<td dir="ltr">' + esc(String(d.updatedAt || '').slice(0, 10)) + '</td>' +
      '<td><div class="ds-row-actions">' + actions + '</div></td>' +
      '</tr>'
    );
  }

  function renderRegistry() {
    var tbody = document.getElementById('ds-registry-body');
    if (!tbody) return;
    var rows = state.datasets.filter(matchRow).map(registryRow);
    tbody.innerHTML = rows.length
      ? rows.join('')
      : '<tr class="ds-empty-row"><td colspan="9">لا توجد نتائج مطابقة.</td></tr>';
  }

  /* ── العرض: التفاصيل ─────────────────────────────────────────────── */
  function verdictChip(v) {
    return '<span class="ds-verdict ds-verdict--' + (L.verdictColors[v] || 'warn') + '">' + esc((L.verdicts[v] || v)) + '</span>';
  }

  function riskChip(r) {
    return '<span class="ds-risk ds-risk--' + esc(r) + '">' + esc((L.risks[r] || r)) + '</span>';
  }

  function sectorChip(s) {
    var sec = L.sectors[s];
    return '<span class="ds-sec-chip" data-sector="' + esc(s) + '">' + esc((sec && sec.short) || s) + '</span>';
  }

  function piiTags(pii) {
    if (!pii || !pii.length) return '<span class="ds-muted">—</span>';
    return pii.map(function (p) {
      return '<code class="ds-pii" dir="ltr">' + esc(p) + '</code>';
    }).join(' ');
  }

  function caseRow(c, d, working) {
    var dup = working.filter(function (x) { return x.id !== c.id && normalizeInput(x.input) === normalizeInput(c.input); });
    var missing = !c.expected || !c.expected.trim();
    var badges = '';
    if (dup.length) {
      badges += '<span class="ds-case-badge ds-case-badge--dup" title="تكرار محتمل مع ' + dup.map(function (x) { return x.id; }).join('، ') + '">⧉ تكرار</span>';
    }
    if (missing) badges += '<span class="ds-case-badge ds-case-badge--miss" title="السلوك المتوقع ناقص">△ ناقص</span>';
    var edit = d.status === 'published' && !state.drafts[d.id]
      ? '<button class="ds-icon-btn" type="button" data-ds-action="edit-case" data-ds-id="' + esc(d.id) + '" data-case-id="' + esc(c.id) + '" aria-label="تعديل" title="تعديل (يتطلب نسخة مسودة)">✎</button>'
      : '<button class="ds-icon-btn" type="button" data-ds-action="edit-case" data-ds-id="' + esc(d.id) + '" data-case-id="' + esc(c.id) + '" aria-label="تعديل" title="تعديل">✎</button>';
    return (
      '<tr data-case="' + esc(c.id) + '" data-case-verdict="' + esc(c.verdict) + '" data-case-risk="' + esc(c.risk) + '" data-case-sector="' + esc(c.sector) + '" data-case-lang="' + esc(c.lang) + '" data-case-search="' + esc((c.title + ' ' + c.input + ' ' + c.expected).toLowerCase()) + '">' +
      '<td><code class="ds-case-id" dir="ltr">' + esc(c.id) + '</code>' + badges + '</td>' +
      '<td class="ds-cell-title">' + esc(c.title) + '</td>' +
      '<td class="ds-cell-input" dir="auto">' + esc(c.input.length > 72 ? c.input.slice(0, 72) + '…' : c.input) + '</td>' +
      '<td class="ds-cell-expected" dir="auto">' + (missing ? '<span class="ds-muted">— ناقص</span>' : esc(c.expected.length > 56 ? c.expected.slice(0, 56) + '…' : c.expected)) + '</td>' +
      '<td>' + verdictChip(c.verdict) + '</td>' +
      '<td>' + riskChip(c.risk) + '</td>' +
      '<td>' + sectorChip(c.sector) + '</td>' +
      '<td dir="ltr">' + esc((L.langs[c.lang] || c.lang)) + '</td>' +
      '<td>' + piiTags(c.pii) + '</td>' +
      '<td>' + edit + '</td>' +
      '</tr>'
    );
  }

  function versionBlock(d) {
    var blocks = (d.versions || []).slice().sort(function (a, b) { return b.version - a.version; }).map(function (v) {
      var diff = v.diff || { added: [], removed: [], modified: [] };
      var chips = '';
      if (diff.added.length) chips += '<span class="ds-diffchip ds-diffchip--add">+' + diff.added.length + ' إضافة</span>';
      if (diff.removed.length) chips += '<span class="ds-diffchip ds-diffchip--del">−' + diff.removed.length + ' حذف</span>';
      if (diff.modified.length) chips += '<span class="ds-diffchip ds-diffchip--mod">~' + diff.modified.length + ' تعديل</span>';
      var actions = '';
      if (v.status === 'draft') {
        actions +=
          '<button class="ds-btn ds-btn--small ds-btn--primary" type="button" data-ds-action="publish" data-ds-id="' + esc(d.id) + '" data-version="' + v.version + '">نشر الإصدار</button>';
      }
      return (
        '<div class="ds-version-block" data-version="' + v.version + '" data-vstatus="' + v.status + '">' +
        '<div class="ds-version-block__rail" aria-hidden="true"><span class="ds-version-block__dot"></span></div>' +
        '<div class="ds-version-block__body">' +
        '<div class="ds-version-block__head">' +
        '<span class="ds-version-block__name" dir="ltr">v' + v.version + '</span>' +
        '<span class="ds-status ds-status--' + v.status + '">' + esc((L.statuses[v.status] || v.status)) + '</span>' +
        '<code class="ds-hash ds-hash--full" dir="ltr" title="هاش v' + v.version + '">' + esc(v.hash) + '</code>' +
        '</div>' +
        '<p class="ds-version-block__note">' + esc(v.note) + '</p>' +
        '<div class="ds-version-block__meta">' +
        '<span dir="ltr">' + esc(String(v.createdAt || '').replace('T', ' ').slice(0, 16)) + '</span>' +
        '<span>بواسطة ' + esc(v.createdBy) + '</span>' +
        '<span dir="ltr">' + v.caseCount + ' حالة</span>' +
        (chips ? '<span class="ds-diffchips">' + chips + '</span>' : '') +
        '</div>' +
        (actions ? '<div class="ds-version-block__actions">' + actions + '</div>' : '') +
        '</div>' +
        '</div>'
      );
    });
    return blocks.join('');
  }

  function renderDetail() {
    var box = document.getElementById('ds-detail-body');
    var wrap = document.getElementById('ds-detail');
    var d = findDataset(state.selectedId);
    if (!d) { wrap.hidden = true; return; }
    wrap.hidden = false;

    var working = getWorking(d);
    var stats = computeStats(working);
    var draftNote = state.drafts[d.id]
      ? '<p class="ds-note ds-note--draft">هناك نسخة مسودة قيد التعديل (v' + maxVersion(d) + ') — المنشور لم يُمس.</p>'
      : '';

    var meta = (d.metadata || []).map(function (m) {
      return '<div class="ds-meta__cell"><span class="ds-meta__label">' + esc(m.label) + '</span><strong>' + esc(m.value) + '</strong></div>';
    }).join('');

    box.innerHTML =
      '<div class="ds-detail__head">' +
      '<div>' +
      '<h2 class="ds-section-title">' + esc(d.name) + '</h2>' +
      '<p class="ds-detail__desc">' + esc(d.description) + '</p>' +
      draftNote +
      '</div>' +
      '<div class="ds-detail__badges">' +
      '<span class="ds-env-chip ds-env-chip--' + esc(d.environment) + '">' + esc((L.envs[d.environment] || d.environment)) + '</span>' +
      '<span class="ds-status ds-status--' + esc(d.status) + '">' + esc((L.statuses[d.status] || d.status)) + '</span>' +
      '<button class="ds-btn ds-btn--small ds-btn--ghost" type="button" data-ds-action="export" data-ds-id="' + esc(d.id) + '">تصدير JSON</button>' +
      '</div>' +
      '</div>' +

      '<div class="ds-detail__grid">' +
      '<div class="ds-detail__col">' +
      '<h3 class="ds-dist__title">البيانات الوصفية</h3>' +
      '<div class="ds-meta">' + meta + '</div>' +
      '<div class="ds-kpi ds-kpi--inline"><span class="ds-kpi__label">الحالات</span><strong class="ds-kpi__value" dir="ltr">' + stats.total + '</strong>' +
      '<span class="ds-kpi__foot">' + Object.keys(L.verdicts).map(function (v) { return (L.verdicts[v]) + ' ' + stats.verdicts[v] + ''; }).join(' · ') + '</span></div>' +
      '</div>' +
      '<div class="ds-detail__col">' +
      '<h3 class="ds-dist__title">الإصدارات (' + d.versions.length + ')</h3>' +
      '<div class="ds-versions">' + versionBlock(d) + '</div>' +
      '<div class="ds-detail__version-actions">' +
      '<button class="ds-btn ds-btn--small ds-btn--ghost" type="button" data-ds-action="new-version" data-ds-id="' + esc(d.id) + '">⧉ نسخة جديدة</button>' +
      '<button class="ds-btn ds-btn--small ds-btn--ghost" type="button" data-ds-action="compare" data-ds-id="' + esc(d.id) + '">⇄ مقارنة إصدارين</button>' +
      '<button class="ds-btn ds-btn--small ds-btn--ghost" type="button" data-ds-action="split" data-ds-id="' + esc(d.id) + '">◫ تقسيم / مجموعة فرعية</button>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="ds-cases-head">' +
      '<h3 class="ds-dist__title">الحالات <span dir="ltr">(' + stats.total + ')</span></h3>' +
      '<div class="ds-cases-head__tools">' +
      '<span class="ds-cases-head__warn">' + (stats.dups.length ? '<span class="ds-case-badge ds-case-badge--dup">⧉ ' + stats.dups.length + ' تكرار</span>' : '') + (stats.missing.length ? '<span class="ds-case-badge ds-case-badge--miss">△ ' + stats.missing.length + ' ناقص</span>' : '') + '</span>' +
      '<button class="ds-btn ds-btn--small ds-btn--primary" type="button" data-ds-action="add-case" data-ds-id="' + esc(d.id) + '">+ حالة يدوية</button>' +
      '</div>' +
      '</div>' +
      '<div class="ds-filters">' +
      '<label class="ds-search ds-search--small"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="search" data-case-filter="q" placeholder="ابحث في الحالات…" aria-label="بحث في الحالات" /></label>' +
      '<select data-case-filter="sector" aria-label="فلترة بالقطاع"><option value="">كل القطاعات</option>' + Object.keys(L.sectors).map(function (s) { return '<option value="' + esc(s) + '">' + esc(L.sectors[s].label) + '</option>'; }).join('') + '</select>' +
      '<select data-case-filter="verdict" aria-label="فلترة بالحكم"><option value="">كل الأحكام</option>' + Object.keys(L.verdicts).map(function (v) { return '<option value="' + esc(v) + '">' + esc(L.verdicts[v]) + '</option>'; }).join('') + '</select>' +
      '<select data-case-filter="risk" aria-label="فلترة بالخطورة"><option value="">كل الخطورة</option>' + Object.keys(L.risks).map(function (r) { return '<option value="' + esc(r) + '">' + esc(L.risks[r]) + '</option>'; }).join('') + '</select>' +
      '<select data-case-filter="lang" aria-label="فلترة باللغة"><option value="">كل اللغات</option>' + Object.keys(L.langs).map(function (l) { return '<option value="' + esc(l) + '">' + esc(L.langs[l]) + '</option>'; }).join('') + '</select>' +
      '<button class="ds-btn ds-btn--small ds-btn--ghost" type="button" data-case-filter-clear>مسح الفلاتر</button>' +
      '</div>' +

      '<div class="ds-table-wrap" role="region" aria-label="جدول حالات ' + esc(d.name) + '" tabindex="0">' +
      '<table class="ds-table ds-table--cases">' +
      '<thead><tr>' +
      '<th scope="col">المعرّف</th><th scope="col">العنوان</th><th scope="col">المدخل</th><th scope="col">السلوك المتوقع</th>' +
      '<th scope="col">الحكم</th><th scope="col">الخطورة</th><th scope="col">القطاع</th><th scope="col">اللغة</th><th scope="col">PII</th><th scope="col">تعديل</th>' +
      '</tr></thead>' +
      '<tbody data-case-list></tbody>' +
      '</table>' +
      '</div>' +
      '<div class="ds-note ds-note--info">عدد الحالات المعروضة: <strong data-case-count>0</strong> — التعديل على حالة ينشئ نسخة مسودة جديدة ولا يعدّل المنشور.</div>' +
      '<div class="ds-case-editor" id="ds-case-editor" hidden>' +
      '<h4 class="ds-case-editor__title" data-case-editor-title>إضافة حالة يدوية</h4>' +
      '<form class="ds-form ds-case-editor__form" id="ds-case-form">' +
      '<div class="ds-form__row"><label class="ds-field"><span>العنوان</span><input id="ds-case-title" type="text" required maxlength="80" /></label>' +
      '<label class="ds-field"><span>القطاع</span><select id="ds-case-sector">' + Object.keys(L.sectors).map(function (s) { return '<option value="' + esc(s) + '">' + esc(L.sectors[s].label) + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="ds-field"><span>المدخل (Prompt)</span><textarea id="ds-case-input" rows="3" required dir="auto" maxlength="400"></textarea></label>' +
      '<label class="ds-field"><span>السلوك المتوقع</span><textarea id="ds-case-expected" rows="2" dir="auto" maxlength="300"></textarea></label>' +
      '<div class="ds-form__row">' +
      '<label class="ds-field"><span>الحكم</span><select id="ds-case-verdict">' + Object.keys(L.verdicts).map(function (v) { return '<option value="' + esc(v) + '">' + esc(L.verdicts[v]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-field"><span>الخطورة</span><select id="ds-case-risk">' + Object.keys(L.risks).map(function (r) { return '<option value="' + esc(r) + '">' + esc(L.risks[r]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-field"><span>اللغة</span><select id="ds-case-lang">' + Object.keys(L.langs).map(function (l) { return '<option value="' + esc(l) + '">' + esc(L.langs[l]) + '</option>'; }).join('') + '</select></label>' +
      '<label class="ds-field"><span>PII (مفصولة بفاصلة)</span><input id="ds-case-pii" type="text" dir="ltr" placeholder="saudi_id, phone" /></label>' +
      '</div>' +
      '<p class="ds-form__note" id="ds-case-note"></p>' +
      '<div class="ds-case-editor__actions">' +
      '<button class="ds-btn ds-btn--ghost" type="button" data-case-editor-cancel>إلغاء</button>' +
      '<button class="ds-btn ds-btn--primary" type="submit" data-case-editor-save>حفظ (ينشئ إصداراً جديداً)</button>' +
      '</div>' +
      '</form>' +
      '</div>';

    renderCases();
    // الفلاتر تُبنى ديناميكياً داخل renderDetail — نربطها بعد البناء.
    bindCaseFilters();
  }

  function renderCases() {
    var d = findDataset(state.selectedId);
    var list = document.querySelector('[data-case-list]');
    var countEl = document.querySelector('[data-case-count]');
    if (!d || !list) return;
    var working = getWorking(d);
    var f = (state.caseFilters[d.id] = state.caseFilters[d.id] || { q: '', sector: '', verdict: '', risk: '', lang: '' });

    var rows = working.filter(function (c) {
      if (f.sector && c.sector !== f.sector) return false;
      if (f.verdict && c.verdict !== f.verdict) return false;
      if (f.risk && c.risk !== f.risk) return false;
      if (f.lang && c.lang !== f.lang) return false;
      if (f.q && (c.title + ' ' + c.input + ' ' + (c.expected || '')).toLowerCase().indexOf(f.q) === -1) return false;
      return true;
    });

    list.innerHTML = rows.length
      ? rows.map(function (c) { return caseRow(c, d, working); }).join('')
      : '<tr><td colspan="10" class="ds-muted">لا توجد حالات مطابقة.</td></tr>';
    if (countEl) countEl.textContent = rows.length;
  }

  /* ── العرض: المقارنة ─────────────────────────────────────────────── */
  function renderCompare() {
    var d = findDataset(state.compare.datasetId);
    var box = document.getElementById('ds-compare-controls');
    var sum = document.getElementById('ds-compare-summary');
    var list = document.getElementById('ds-compare-list');
    if (!d || !box) return;
    var versions = (d.versions || []).slice().sort(function (a, b) { return a.version - b.version; });
    var aSel = state.compare.a || (versions.length > 1 ? versions[versions.length - 2].version : versions[0].version);
    var bSel = state.compare.b || versions[versions.length - 1].version;
    state.compare.a = aSel; state.compare.b = bSel;

    box.innerHTML =
      '<label class="ds-field ds-field--inline"><span>الإصدار A (الأقدم)</span><select data-compare-a>' +
      versions.map(function (v) { return '<option value="' + v.version + '"' + (v.version === aSel ? ' selected' : '') + '>v' + v.version + ' — ' + esc(L.statuses[v.status] || v.status) + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="ds-field ds-field--inline"><span>الإصدار B (الأحدث)</span><select data-compare-b>' +
      versions.map(function (v) { return '<option value="' + v.version + '"' + (v.version === bSel ? ' selected' : '') + '>v' + v.version + ' — ' + esc(L.statuses[v.status] || v.status) + '</option>'; }).join('') +
      '</select></label>';

    var va = getVersion(d, aSel);
    var vb = getVersion(d, bSel);
    var diff = vb && vb.diff ? vb.diff : diffCases(d.cases, getWorking(d));
    var added = (diff && diff.added) || [];
    var removed = (diff && diff.removed) || [];
    var modified = (diff && diff.modified) || [];

    sum.innerHTML =
      '<div class="ds-compare-kpi"><span>الإصدار A</span><strong dir="ltr">v' + aSel + '</strong><code class="ds-hash" dir="ltr">' + esc((va && va.hash) || '') + '</code></div>' +
      '<div class="ds-compare-kpi"><span>الإصدار B</span><strong dir="ltr">v' + bSel + '</strong><code class="ds-hash" dir="ltr">' + esc((vb && vb.hash) || '') + '</code></div>' +
      '<div class="ds-compare-kpi"><span>الفرق</span><strong dir="ltr">' + (added.length + removed.length + modified.length) + '</strong><span class="ds-diffchips"><span class="ds-diffchip ds-diffchip--add">+' + added.length + '</span><span class="ds-diffchip ds-diffchip--del">−' + removed.length + '</span><span class="ds-diffchip ds-diffchip--mod">~' + modified.length + '</span></span></div>';

    if (!added.length && !removed.length && !modified.length) {
      list.innerHTML = '<p class="ds-compare-empty">لا يوجد فرق محسوب بين النسختين (نفس الحالات).</p>';
      return;
    }

    var rows = [];
    function lookup(id) {
      var c = d.cases.find(function (x) { return x.id === id; });
      if (c) return c;
      var w = getWorking(d);
      return w.find(function (x) { return x.id === id; }) || null;
    }
    added.forEach(function (id) {
      var c = lookup(id);
      rows.push('<div class="ds-diff-row ds-diff-row--add"><span class="ds-diff-row__tag">+</span><code class="ds-case-id" dir="ltr">' + esc(id) + '</code><span class="ds-diff-row__txt">' + esc(c ? c.title : 'حالة مضافة') + '</span></div>');
    });
    removed.forEach(function (id) {
      var c = lookup(id);
      rows.push('<div class="ds-diff-row ds-diff-row--del"><span class="ds-diff-row__tag">−</span><code class="ds-case-id" dir="ltr">' + esc(id) + '</code><span class="ds-diff-row__txt">' + esc(c ? c.title : 'حالة محذوفة') + '</span></div>');
    });
    modified.forEach(function (id) {
      var c = lookup(id);
      rows.push('<div class="ds-diff-row ds-diff-row--mod"><span class="ds-diff-row__tag">~</span><code class="ds-case-id" dir="ltr">' + esc(id) + '</code><span class="ds-diff-row__txt">' + esc(c ? c.title : 'حالة معدلة') + '</span><span class="ds-diff-row__hint">الحكم/المدخل تغيّر</span></div>');
    });
    list.innerHTML = rows.join('');
  }

  /* ── الاستيراد ───────────────────────────────────────────────────── */
  function parseDelimited(text, delim) {
    var lines = String(text || '').split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (lines.length < 2) return { rows: [], errors: ['المحتوى فارغ أو سطر واحد فقط.'] };
    var header = splitLine(lines[0], delim).map(function (h) { return h.trim().toLowerCase(); });
    var idx = {
      title: header.indexOf('title'), input: header.indexOf('input'),
      expected: header.indexOf('expected'), verdict: header.indexOf('verdict'),
      risk: header.indexOf('risk'), sector: header.indexOf('sector'),
      lang: header.indexOf('lang'), pii: header.indexOf('pii'),
    };
    if (idx.input === -1 || idx.verdict === -1) {
      return { rows: [], errors: ['يجب أن يحتوي الرأس على: title, input, expected, verdict, risk, sector (lang, pii اختيارية).'] };
    }
    var rows = [], errors = [];
    lines.slice(1).forEach(function (line, i) {
      var cells = splitLine(line, delim);
      var o = {
        title: cells[idx.title] != null ? cells[idx.title].trim() : '',
        input: cells[idx.input] != null ? cells[idx.input].trim() : '',
        expected: idx.expected >= 0 && cells[idx.expected] != null ? cells[idx.expected].trim() : '',
        verdict: cells[idx.verdict] != null ? cells[idx.verdict].trim() : '',
        risk: idx.risk >= 0 && cells[idx.risk] != null ? cells[idx.risk].trim() : '',
        sector: idx.sector >= 0 && cells[idx.sector] != null ? cells[idx.sector].trim() : '',
        lang: idx.lang >= 0 && cells[idx.lang] != null ? cells[idx.lang].trim() : 'ar',
        pii: idx.pii >= 0 && cells[idx.pii] != null ? cells[idx.pii].trim() : '',
      };
      var res = validateRow(o, i + 2);
      if (res.ok) rows.push(res.case);
      else errors.push('سطر ' + (i + 2) + ': ' + res.err);
    });
    return { rows: rows, errors: errors };
  }

  function splitLine(line, delim) {
    var out = [], cur = '', inQ = false;
    for (var i = 0; i < line.length; i += 1) {
      var ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === delim && !inQ) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  function validateRow(o, lineNo) {
    var v = (o.verdict || '').trim();
    var r = (o.risk || '').trim();
    var s = (o.sector || '').trim();
    var l = (o.lang || 'ar').trim();
    if (!L.verdicts[v]) return { ok: false, err: 'حكم غير معروف "' + v + '"' };
    if (!L.risks[r]) return { ok: false, err: 'خطورة غير معروفة "' + r + '"' };
    if (!L.sectors[s]) return { ok: false, err: 'قطاع غير معروف "' + s + '"' };
    if (!L.langs[l]) l = 'ar';
    var c = {
      id: 'IMP-' + pad(nextSeq('imp'), 4),
      title: o.title || 'حالة مستوردة',
      input: o.input,
      expected: o.expected || '',
      verdict: v, risk: r, sector: s, lang: l,
      compliance: [L.sectors[s].pack || s],
      pii: (o.pii || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean),
      version: 1,
    };
    if (!c.input) return { ok: false, err: 'مدخل فارغ' };
    return { ok: true, case: c };
  }

  function parseImport(text, tab) {
    try {
      if (tab === 'json') {
        var data = JSON.parse(text);
        var arr = Array.isArray(data) ? data : (data.cases || []);
        return arr.reduce(function (acc, o, i) {
          var res = validateRow(o, i + 1);
          if (res.ok) acc.rows.push(res.case); else acc.errors.push('عنصر ' + (i + 1) + ': ' + res.err);
          return acc;
        }, { rows: [], errors: [] });
      }
      if (tab === 'jsonl') {
        var lines = String(text).split(/\r?\n/).map(function (l) { return l.trim(); }).filter(Boolean);
        var acc = { rows: [], errors: [] };
        lines.forEach(function (line, i) {
          try {
            var res = validateRow(JSON.parse(line), i + 1);
            if (res.ok) acc.rows.push(res.case); else acc.errors.push('سطر ' + (i + 1) + ': ' + res.err);
          } catch (e) {
            acc.errors.push('سطر ' + (i + 1) + ': JSON غير صالح');
          }
        });
        return acc;
      }
      // csv (فاصلة) / paste (جدول تبويب)
      return parseDelimited(text, tab === 'csv' ? ',' : '\t');
    } catch (e) {
      return { rows: [], errors: ['تعذر قراءة المحتوى: ' + String(e && e.message ? e.message : e)] };
    }
  }

  function renderImportPreview() {
    var textEl = document.getElementById('ds-import-text');
    var box = document.getElementById('ds-import-preview');
    var body = document.getElementById('ds-import-preview-body');
    if (!textEl || !box || !body) return;
    var res = parseImport(textEl.value, state.importTab);
    if (!res.rows.length && !res.errors.length) { box.hidden = true; return; }
    box.hidden = false;
    var head = '<div class="ds-import-preview__head"><strong dir="ltr">' + res.rows.length + '</strong> حالة صالحة';
    if (res.errors.length) head += ' · <span class="ds-import-preview__err">' + res.errors.length + ' مشكلة</span>';
    head += '</div><ul class="ds-import-preview__errs">' + res.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>';
    body.innerHTML = head + '<div class="ds-table-wrap"><table class="ds-table ds-table--mini"><thead><tr><th>المعرّف</th><th>العنوان</th><th>الحكم</th><th>الخطورة</th><th>القطاع</th></tr></thead><tbody>' +
      res.rows.slice(0, 12).map(function (c) {
        return '<tr><td><code class="ds-case-id" dir="ltr">' + esc(c.id) + '</code></td><td>' + esc(c.title) + '</td><td>' + verdictChip(c.verdict) + '</td><td>' + riskChip(c.risk) + '</td><td>' + sectorChip(c.sector) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function applyImport() {
    var textEl = document.getElementById('ds-import-text');
    var nameEl = document.getElementById('ds-import-name');
    var res = parseImport(textEl.value, state.importTab);
    if (!res.rows.length) {
      showToast('⚠ لا توجد حالات صالحة للاستيراد — راجع المعاينة.');
      return;
    }
    var name = (nameEl.value || '').trim() || ('Dataset مستورد — ' + nowIso().slice(0, 10));
    var d = {
      id: 'ds-' + Date.now().toString(36),
      slug: name.replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-').toLowerCase().slice(0, 40) || 'imported',
      name: name,
      description: 'Dataset مستورد عبر ' + state.importTab.toUpperCase() + ' (' + res.rows.length + ' حالة) — بيانات توضيحية.',
      environment: 'demo',
      status: 'draft',
      source: state.importTab,
      owner: 'جلسة محلية (Demo)',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      usedInRuns: 0,
      metadata: [
        { label: 'الإصدار الحالي', value: 'v1' },
        { label: 'مستوى الجاهزية', value: 'مسودة' },
        { label: 'آخر تحديث', value: nowIso().slice(0, 10) },
        { label: 'الجهة المالكة', value: 'جلسة محلية' },
      ],
      versions: [{
        version: 1, status: 'draft',
        hash: versionHash(res.rows, 'استيراد ' + state.importTab),
        createdAt: nowIso(), createdBy: 'جلسة محلية (Demo)',
        note: 'استيراد ' + state.importTab.toUpperCase(),
        caseCount: res.rows.length,
      }],
      currentVersion: 1,
      cases: res.rows,
      split: { train: 70, validation: 15, test: 15 },
    };
    // كشف تكرار داخل المستورَد
    var dups = computeStats(res.rows).dups;
    state.datasets.unshift(d);
    state.selectedId = d.id;
    state.search = '';
    state.statusFilter = 'all';
    document.getElementById('ds-search').value = '';
    document.getElementById('ds-status-filter').value = 'all';
    hideModal('ds-import-modal');
    renderRegistry();
    renderDetail();
    showToast('✅ استُورد ' + res.rows.length + ' حالة' + (dups.length ? ' — ⚠ ' + dups.length + ' تكرار محتمل داخل الملف' : '') + ' (مسودة v1).');
    document.getElementById('ds-import-text').value = '';
    document.getElementById('ds-import-name').value = '';
  }

  /* ── إضافة/تعديل حالة ────────────────────────────────────────────── */
  function openCaseEditor(mode, caseId) {
    var d = findDataset(state.selectedId);
    if (!d) return;
    var editor = document.getElementById('ds-case-editor');
    if (!editor) return;
    state.editingCaseId = mode === 'edit' ? caseId : null;
    var titleEl = document.querySelector('[data-case-editor-title]');
    titleEl.textContent = mode === 'edit' ? 'تعديل حالة ' + caseId : 'إضافة حالة يدوية';
    var c = mode === 'edit' ? getWorking(d).find(function (x) { return x.id === caseId; }) : null;
    document.getElementById('ds-case-title').value = c ? c.title : '';
    document.getElementById('ds-case-input').value = c ? c.input : '';
    document.getElementById('ds-case-expected').value = c ? c.expected : '';
    document.getElementById('ds-case-verdict').value = c ? c.verdict : 'blocked';
    document.getElementById('ds-case-risk').value = c ? c.risk : 'medium';
    document.getElementById('ds-case-sector').value = c ? c.sector : 'pdpl';
    document.getElementById('ds-case-lang').value = c ? c.lang : 'ar';
    document.getElementById('ds-case-pii').value = c ? (c.pii || []).join(', ') : '';
    document.getElementById('ds-case-note').textContent = '';
    editor.hidden = false;
    editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('ds-case-title').focus();
  }

  function saveCase(e) {
    e.preventDefault();
    var d = findDataset(state.selectedId);
    if (!d) return;
    if (d.status === 'published' && !state.drafts[d.id]) {
      showToast('⛔ لا يمكن تعديل Dataset منشور — أنشئ نسخة جديدة (⧉) أولاً.');
      return;
    }
    var title = document.getElementById('ds-case-title').value.trim();
    var input = document.getElementById('ds-case-input').value.trim();
    var expected = document.getElementById('ds-case-expected').value.trim();
    var verdict = document.getElementById('ds-case-verdict').value;
    var risk = document.getElementById('ds-case-risk').value;
    var sector = document.getElementById('ds-case-sector').value;
    var lang = document.getElementById('ds-case-lang').value;
    var pii = document.getElementById('ds-case-pii').value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    if (!title || !input) { document.getElementById('ds-case-note').textContent = 'العنوان والمدخل مطلوبان.'; return; }

    var working = getWorking(d);
    var note;
    if (state.editingCaseId) {
      working = working.map(function (c) {
        if (c.id !== state.editingCaseId) return c;
        return { id: c.id, title: title, input: input, expected: expected, verdict: verdict, risk: risk, sector: sector, lang: lang, compliance: c.compliance, pii: pii, version: c.version + 1 };
      });
      note = 'تعديل حالة ' + state.editingCaseId;
    } else {
      working = working.concat([{
        id: 'CASE-' + pad(nextSeq('case'), 4),
        title: title, input: input, expected: expected, verdict: verdict, risk: risk,
        sector: sector, lang: lang, compliance: [L.sectors[sector].pack || sector], pii: pii, version: 1,
      }]);
      note = 'إضافة حالة يدوية';
    }

    var prev = d.cases;
    if (d.status === 'draft') {
      // مسودة مباشرة — نحدّث الحالات ونسخة جديدة
      pushVersion(d, working, note);
      d.cases = clone(working);
      d.updatedAt = nowIso();
    } else {
      // منشور مع نسخة مسودة قائمة — نعدّل النسخة المسودة فقط
      pushVersion(d, working, note);
      d.updatedAt = nowIso();
      prev = state.drafts[d.id] ? state.drafts[d.id].cases : prev;
    }

    // كشف التكرار والنقص بعد الحفظ
    var st = computeStats(working);
    var dupMsg = st.dups.length ? ' · ⚠ تكرار محتمل (' + st.dups.length + ')' : '';
    var missMsg = st.missing.length ? ' · △ نقص سلوك متوقع (' + st.missing.length + ')' : '';
    document.getElementById('ds-case-editor').hidden = true;
    state.editingCaseId = null;
    renderDetail();
    showToast('✅ حُفظ — نشأ إصدار v' + maxVersion(d) + ' جديد' + dupMsg + missMsg + '.');
  }

  /* ── التقسيم والمجموعات الفرعية ──────────────────────────────────── */
  function openSplitModal() {
    var d = findDataset(state.selectedId);
    if (!d) return;
    var box = document.getElementById('ds-split-current');
    box.innerHTML =
      '<span>التقسيم الحالي: <strong dir="ltr">Train ' + d.split.train + '% · Validation ' + d.split.validation + '% · Test ' + d.split.test + '%</strong></span>' +
      '<span dir="ltr">' + d.cases.length + ' حالة</span>';
    document.getElementById('ds-split-train').value = d.split.train;
    document.getElementById('ds-split-val').value = d.split.validation;
    document.getElementById('ds-split-test').value = d.split.test;
    document.getElementById('ds-subset-sector').value = '';
    document.getElementById('ds-subset-verdict').value = '';
    document.getElementById('ds-subset-seed').value = '';
    updateSplitSum();
    showModal('ds-split-modal');
  }

  function updateSplitSum() {
    var t = parseInt(document.getElementById('ds-split-train').value, 10) || 0;
    var v = parseInt(document.getElementById('ds-split-val').value, 10) || 0;
    var x = parseInt(document.getElementById('ds-split-test').value, 10) || 0;
    var sum = t + v + x;
    var el = document.getElementById('ds-split-sum');
    el.textContent = sum === 100 ? '✓ المجموع 100%' : 'المجموع ' + sum + '% — يجب أن يكون 100%.';
    el.classList.toggle('ds-form__note--err', sum !== 100);
  }

  function updateSubsetSum() {
    var d = findDataset(state.selectedId);
    var el = document.getElementById('ds-subset-sum');
    if (!d) { el.textContent = ''; return; }
    var working = getWorking(d);
    var s = document.getElementById('ds-subset-sector').value;
    var v = document.getElementById('ds-subset-verdict').value;
    var seed = document.getElementById('ds-subset-seed').value.trim();
    var picked = working.filter(function (c) {
      if (s && c.sector !== s) return false;
      if (v && c.verdict !== v) return false;
      return true;
    });
    if (seed) {
      var hash = fnv1a(seed);
      picked = picked.filter(function (_, i) { return (hash ^ i) % 3 === 0; });
    }
    el.textContent = seed
      ? '✓ مجموعة فرعية (ببذرة ' + seed + '): ' + picked.length + ' حالة من ' + working.length
      : '✓ مجموعة فرعية حسب الفلاتر: ' + picked.length + ' حالة من ' + working.length;
  }

  function saveSplit() {
    var d = findDataset(state.selectedId);
    if (!d) return;
    var t = parseInt(document.getElementById('ds-split-train').value, 10) || 0;
    var v = parseInt(document.getElementById('ds-split-val').value, 10) || 0;
    var x = parseInt(document.getElementById('ds-split-test').value, 10) || 0;
    if (t + v + x !== 100) { showToast('⚠ المجموع يجب أن يساوي 100%.'); return; }
    d.split = { train: t, validation: v, test: x };
    hideModal('ds-split-modal');
    renderDetail();
    showToast('✅ حُفظ التقسيم: Train ' + t + '% · Validation ' + v + '% · Test ' + x + '%.');
  }

  function createSubset() {
    var d = findDataset(state.selectedId);
    if (!d) return;
    var working = getWorking(d);
    var s = document.getElementById('ds-subset-sector').value;
    var v = document.getElementById('ds-subset-verdict').value;
    var seed = document.getElementById('ds-subset-seed').value.trim();
    var picked = working.filter(function (c) {
      if (s && c.sector !== s) return false;
      if (v && c.verdict !== v) return false;
      return true;
    });
    if (seed) {
      var hash = fnv1a(seed);
      picked = picked.filter(function (_, i) { return (hash ^ i) % 3 === 0; });
    }
    if (!picked.length) { showToast('⚠ لا توجد حالات مطابقة للفلاتر.'); return; }
    var name = d.name + ' — مجموعة فرعية';
    var sub = {
      id: 'ds-' + Date.now().toString(36),
      slug: 'subset-' + d.slug,
      name: name,
      description: 'مجموعة فرعية من ' + d.name + ' (' + picked.length + ' حالة)' + (seed ? ' ببذرة ' + seed : '') + '.',
      environment: d.environment,
      status: 'draft',
      source: 'subset',
      owner: 'جلسة محلية (Demo)',
      createdAt: nowIso(), updatedAt: nowIso(),
      usedInRuns: 0,
      metadata: [
        { label: 'الإصدار الحالي', value: 'v1' },
        { label: 'مستوى الجاهزية', value: 'مسودة' },
        { label: 'أصل', value: d.name },
        { label: 'الجهة المالكة', value: 'جلسة محلية' },
      ],
      versions: [{
        version: 1, status: 'draft', hash: versionHash(picked, 'مجموعة فرعية'),
        createdAt: nowIso(), createdBy: 'جلسة محلية (Demo)', note: 'مجموعة فرعية', caseCount: picked.length,
      }],
      currentVersion: 1,
      cases: picked,
      split: { train: 70, validation: 15, test: 15 },
    };
    state.datasets.unshift(sub);
    state.selectedId = sub.id;
    hideModal('ds-split-modal');
    renderRegistry();
    renderDetail();
    showToast('✅ أُنشئت مجموعة فرعية بموجب الفلاتر (' + picked.length + ' حالة).');
  }

  /* ── الإجراءات ───────────────────────────────────────────────────── */
  function publishVersion(d, versionNum) {
    var ver = getVersion(d, versionNum || maxVersion(d));
    if (!ver || ver.status !== 'draft') {
      showToast('⚠ لا توجد نسخة مسودة قابلة للنشر.');
      return;
    }
    // ننقل الحالات العاملة إلى المنشور
    var working = state.drafts[d.id] ? state.drafts[d.id].cases : d.cases;
    d.cases = clone(working);
    delete state.drafts[d.id];
    ver.status = 'published';
    ver.hash = versionHash(d.cases, ver.note);
    ver.caseCount = d.cases.length;
    d.status = 'published';
    d.currentVersion = ver.version;
    d.updatedAt = nowIso();
    renderRegistry();
    renderDetail();
    showToast('✅ نُشر الإصدار v' + ver.version + ' — أصبح المرجع الجديد.');
  }

  function archiveDataset(d) {
    if (d.status === 'published') { showToast('⛔ لا يمكن أرشفة Dataset منشور — نسخة جديدة أو حذف فقط.'); return; }
    d.status = 'archived';
    var ver = getVersion(d, maxVersion(d));
    if (ver && ver.status === 'draft') ver.status = 'archived';
    d.updatedAt = nowIso();
    renderRegistry();
    renderDetail();
    showToast('🗄 أُرشف الـ Dataset — لا يزال محفوظاً.');
  }

  function deleteDataset(d) {
    if (d.usedInRuns > 0) {
      showToast('⛔ لا يمكن حذف Dataset مستخدَم في ' + d.usedInRuns + ' Run — احذف الـ Runs أولاً (أو أرشفه).');
      return;
    }
    var ok = window.confirm('حذف «' + d.name + '» نهائياً؟ هذا لا يمكن التراجع عنه.');
    if (!ok) return;
    state.datasets = state.datasets.filter(function (x) { return x.id !== d.id; });
    if (state.selectedId === d.id) state.selectedId = null;
    renderRegistry();
    renderDetail();
    showToast('🗑 حُذف الـ Dataset.');
  }

  function newVersion(d) {
    var note = 'نسخة جديدة من v' + maxVersion(d);
    pushVersion(d, clone(getWorking(d)), note);
    d.updatedAt = nowIso();
    renderRegistry();
    renderDetail();
    showToast('⧉ أُنشئ إصدار v' + maxVersion(d) + ' كمسودة — المنشور لم يُمس.');
  }

  function exportDataset(d) {
    var payload = {
      name: d.name, description: d.description, environment: d.environment,
      status: d.status, source: d.source, owner: d.owner, createdAt: d.createdAt, updatedAt: d.updatedAt,
      usedInRuns: d.usedInRuns, currentVersion: d.currentVersion, split: d.split,
      versions: d.versions, cases: d.cases,
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = (d.slug || 'dataset') + '-v' + d.currentVersion + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    showToast('⬇ صُدِّر الـ Dataset بصيغة JSON.');
  }

  /* ── الفلاتر (الربط) ─────────────────────────────────────────────── */
  function bindCaseFilters() {
    var d = findDataset(state.selectedId);
    if (!d) return;
    var f = (state.caseFilters[d.id] = state.caseFilters[d.id] || { q: '', sector: '', verdict: '', risk: '', lang: '' });
    var list = document.querySelectorAll('[data-case-filter]');
    list.forEach(function (el) {
      var key = el.getAttribute('data-case-filter');
      if (key === 'q') {
        el.value = f.q;
        el.oninput = function () { f.q = el.value.trim().toLowerCase(); renderCases(); };
      } else {
        el.value = f[key];
        el.onchange = function () { f[key] = el.value; renderCases(); };
      }
    });
    var clear = document.querySelector('[data-case-filter-clear]');
    if (clear) {
      clear.onclick = function () {
        state.caseFilters[d.id] = { q: '', sector: '', verdict: '', risk: '', lang: '' };
        renderDetail();
      };
    }
  }

  /* ── المودالات ───────────────────────────────────────────────────── */
  function showModal(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = false;
  }
  function hideModal(id) {
    var el = document.getElementById(id);
    if (el) el.hidden = true;
  }

  function closeCompare() {
    var el = document.getElementById('ds-compare');
    if (el) el.setAttribute('aria-hidden', 'true');
  }
  function openCompareModal(d) {
    state.compare = { datasetId: d.id, a: null, b: null };
    var el = document.getElementById('ds-compare');
    el.setAttribute('aria-hidden', 'false');
    renderCompare();
  }

  /* ── الإجراءات عبر التفويض ───────────────────────────────────────── */
  function handleAction(action, btn) {
    var id = btn.getAttribute('data-ds-id');
    var d = id ? findDataset(id) : null;
    switch (action) {
      case 'open':
        if (d) { state.selectedId = d.id; renderDetail(); document.getElementById('ds-detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
        break;
      case 'new-version':
        if (d) newVersion(d);
        break;
      case 'publish':
        if (d) publishVersion(d, parseInt(btn.getAttribute('data-version'), 10) || null);
        break;
      case 'archive':
        if (d) archiveDataset(d);
        break;
      case 'delete':
        if (d) deleteDataset(d);
        break;
      case 'export':
        if (d) exportDataset(d);
        break;
      case 'import':
        showModal('ds-import-modal');
        break;
      case 'create':
        showModal('ds-create-modal');
        break;
      case 'split':
        if (d) { state.selectedId = d.id; openSplitModal(); }
        break;
      case 'compare':
        if (d) { state.selectedId = d.id; renderDetail(); openCompareModal(d); }
        break;
      case 'add-case':
        if (d) { state.selectedId = d.id; renderDetail(); openCaseEditor('add', null); }
        break;
      case 'edit-case':
        if (d) { state.selectedId = d.id; renderDetail(); openCaseEditor('edit', btn.getAttribute('data-case-id')); }
        break;
      default:
        break;
    }
  }

  /* ── الربط العام ─────────────────────────────────────────────────── */
  function bind() {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ds-action]');
      if (btn) { e.preventDefault(); handleAction(btn.getAttribute('data-ds-action'), btn); return; }

      // محرر الحالة داخل data-ds-root (مُنشأ ديناميكياً)
      if (e.target.closest('[data-case-editor-cancel]')) {
        var editorEl = document.getElementById('ds-case-editor');
        if (editorEl) editorEl.hidden = true;
        state.editingCaseId = null;
        return;
      }
    });

    // المودالات خارج data-ds-root — إغلاقها عبر تفويض على مستوى المستند
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-ds-modal-close]')) {
        var modal = e.target.closest('.ds-modal');
        if (modal) modal.hidden = true;
        return;
      }
      if (e.target.closest('[data-ds-compare-close]')) { closeCompare(); return; }
      if (e.target.closest('[data-ds-toast-close]')) {
        if (toastEl) toastEl.hidden = true;
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.ds-modal').forEach(function (m) { m.hidden = true; });
        closeCompare();
        var editor = document.getElementById('ds-case-editor');
        if (editor && !editor.hidden) { editor.hidden = true; state.editingCaseId = null; }
      }
    });

    // بحث وفلاتر السجل
    var searchEl = document.getElementById('ds-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        state.search = searchEl.value;
        renderRegistry();
      });
    }
    var statusEl = document.getElementById('ds-status-filter');
    if (statusEl) {
      statusEl.addEventListener('change', function () {
        state.statusFilter = statusEl.value;
        renderRegistry();
      });
    }

    // إنشاء Dataset
    var createForm = document.getElementById('ds-create-form');
    if (createForm) {
      createForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('ds-create-name').value.trim();
        if (!name) return;
        var d = {
          id: 'ds-' + Date.now().toString(36),
          slug: name.replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-').toLowerCase().slice(0, 40) || 'dataset',
          name: name,
          description: document.getElementById('ds-create-desc').value.trim() || 'Dataset جديد.',
          environment: 'demo',
          status: 'draft',
          source: document.getElementById('ds-create-source').value,
          owner: document.getElementById('ds-create-owner').value.trim() || 'فريق الحوكمة',
          createdAt: nowIso(), updatedAt: nowIso(), usedInRuns: 0,
          metadata: [
            { label: 'الإصدار الحالي', value: 'v1' },
            { label: 'مستوى الجاهزية', value: 'مسودة' },
            { label: 'آخر تحديث', value: nowIso().slice(0, 10) },
            { label: 'الجهة المالكة', value: 'فريق الحوكمة' },
          ],
          versions: [{
            version: 1, status: 'draft', hash: versionHash([], 'مسودة جديدة'),
            createdAt: nowIso(), createdBy: 'جلسة محلية (Demo)', note: 'مسودة جديدة', caseCount: 0,
          }],
          currentVersion: 1,
          cases: [],
          split: { train: 70, validation: 15, test: 15 },
        };
        state.datasets.unshift(d);
        state.selectedId = d.id;
        hideModal('ds-create-modal');
        createForm.reset();
        renderRegistry();
        renderDetail();
        showToast('✅ أُنشئ الـ Dataset كمسودة (v1) — أضف حالات يدوياً أو استورد.');
        setTimeout(function () {
          var editor = document.getElementById('ds-case-editor');
          if (editor) { openCaseEditor('add', null); }
        }, 100);
      });
    }

    // الاستيراد — المودالات خارج data-ds-root، فالربط عبر document
    var tabBtns = document.querySelectorAll('[data-import-tab]');
    tabBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        state.importTab = b.getAttribute('data-import-tab');
        tabBtns.forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); x.classList.toggle('ds-tab--active', x === b); });
        var preview = document.getElementById('ds-import-preview');
        if (preview) preview.hidden = true;
      });
    });
    var fixtureBtn = document.querySelector('[data-import-fixture]');
    if (fixtureBtn) {
      fixtureBtn.addEventListener('click', function () {
        var fixtures = config.fixtures || {};
        var text = fixtures[state.importTab];
        if (!text) { showToast('⚠ لا يوجد مثال جاهز لهذه الصيغة.'); return; }
        document.getElementById('ds-import-text').value = text;
        renderImportPreview();
      });
    }
    var previewBtn = document.querySelector('[data-import-preview]');
    if (previewBtn) {
      previewBtn.addEventListener('click', renderImportPreview);
    }
    var applyBtn = document.querySelector('[data-import-apply]');
    if (applyBtn) {
      applyBtn.addEventListener('click', applyImport);
    }

    // التقسيم
    ['ds-split-train', 'ds-split-val', 'ds-split-test'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateSplitSum);
    });
    ['ds-subset-sector', 'ds-subset-verdict', 'ds-subset-seed'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', updateSubsetSum);
    });
    var splitApply = document.querySelector('[data-split-apply]');
    if (splitApply) splitApply.addEventListener('click', saveSplit);
    var subsetApply = document.querySelector('[data-subset-apply]');
    if (subsetApply) subsetApply.addEventListener('click', createSubset);

    // المقارنة
    var cmp = document.getElementById('ds-compare');
    if (cmp) {
      cmp.addEventListener('change', function (e) {
        if (e.target.hasAttribute('data-compare-a')) state.compare.a = parseInt(e.target.value, 10);
        if (e.target.hasAttribute('data-compare-b')) state.compare.b = parseInt(e.target.value, 10);
        renderCompare();
      });
    }

    // محرر الحالة — delegation (العناصر تُبنى ديناميكياً داخل renderDetail)
    root.addEventListener('submit', function (e) {
      if (e.target && e.target.id === 'ds-case-form') saveCase(e);
    });
  }

  /* ── الإقلاع ─────────────────────────────────────────────────────── */
  function init() {
    (config.datasets || []).forEach(function (d) { state.datasets.push(clone(d)); });
    (config.testDatasets || []).forEach(function (d) { state.datasets.push(clone(d)); });

    var sbg = findDataset('ds-sbg-v1');
    if (sbg) {
      var cur = currentVersionOf(sbg);
      var hashEl = document.querySelector('[data-ds-current-hash]');
      if (hashEl && cur) hashEl.textContent = cur.hash;
    }

    bind();
    renderRegistry();
    // نفتح المعيار السعودي افتراضياً
    var first = findDataset('ds-sbg-v1');
    if (first) { state.selectedId = first.id; renderDetail(); }
    else if (state.datasets.length) { state.selectedId = state.datasets[0].id; renderDetail(); }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
