(function () {
  var state = {
    rejects: null,
    analysis: null,
    dataSource: 'loading',
    aiRunning: false,
    errors: [],
    analysisSource: null,
    authRequired: false,
    filters: {},
    liveStats: {
      file_exists: false,
      file_modified_at: null,
      hash: null,
      record_count: 0,
      sheet_count: 0,
      last_load: null,
      warnings: []
    }
  };

  var API_BASE = '/api';
  var socketConnected = false;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  function formatCurrency(val) {
    if (!val && val !== 0) return '\u2014';
    return 'SAR ' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function n(val) { return Number(val) || 0; }

  function formatDate(d) {
    if (!d) return '\u2014';
    try { return new Date(d).toLocaleDateString('en-GB'); }
    catch (e) { return d; }
  }

  function formatRelativeTime(value) {
    if (!value) return 'غير متاح';
    var diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 0) return 'الآن';
    var minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return minutes + ' دقائق';
    var hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + ' ساعات';
    return Math.floor(hours / 24) + ' أيام';
  }

  function ensureLiveStatusBar() {
    var el = $('#live-status-bar');
    if (el) return el;

    var main = $('#main-content') || $('.content-container') || document.body;
    el = document.createElement('div');
    el.id = 'live-status-bar';
    el.className = 'live-status-bar';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid rgba(42,157,143,.22);border-radius:8px;background:rgba(42,157,143,.08);color:var(--text-primary,#0f172a);font-weight:700;font-size:14px;';
    if (main.firstChild) main.insertBefore(el, main.firstChild);
    else main.appendChild(el);
    return el;
  }

  function renderLiveStatus(animate) {
    var bar = ensureLiveStatusBar();
    var count = Number(state.liveStats.record_count || 0);
    var countText = count.toLocaleString('en-US');
    var statusText = state.liveStats.file_exists ? '\uD83D\uDFE2 بيانات حية' : '\uD83D\uDFE1 بانتظار ملف Excel';
    var last = formatRelativeTime(state.liveStats.last_load || state.liveStats.file_modified_at);
    bar.textContent = statusText + ' | آخر تحديث: ' + last + ' | ' + countText + ' سجل';

    var recordCount = $('#live-record-count');
    if (recordCount) recordCount.textContent = countText;

    if (animate) {
      bar.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(42,157,143,0)' },
        { transform: 'scale(1.015)', boxShadow: '0 0 0 6px rgba(42,157,143,.14)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 rgba(42,157,143,0)' }
      ], { duration: 700, easing: 'ease-out' });
    }
  }

  async function refreshLiveStatus(animate) {
    try {
      var res = await apiFetch(API_BASE + '/data/live-status', { signal: AbortSignal.timeout(4000) });
      if (!res.ok) throw new Error('Live status endpoint failed');
      var json = await res.json();
      var payload = json.data || json;
      state.liveStats = {
        file_exists: payload.file_exists === true,
        file_modified_at: payload.file_modified_at || null,
        hash: payload.hash || null,
        record_count: Number(payload.record_count || 0),
        sheet_count: Number(payload.sheet_count || 0),
        last_load: payload.last_load || payload.last_successful_load_at || null,
        warnings: payload.warnings || []
      };
      renderLiveStatus(animate);
    } catch (e) {
      state.liveStats.warnings = ['Live status unavailable'];
      renderLiveStatus(false);
    }
  }

  function riskLevel(val) {
    if (val >= 85) return 'Critical';
    if (val >= 70) return 'High';
    if (val >= 40) return 'Medium';
    return 'Low';
  }

  function riskBadge(val) {
    if (typeof val === 'string') {
      val = { Critical: 90, High: 75, Medium: 50, Low: 20 }[val] || 0;
    }
    var level = riskLevel(val);
    return '<span class="risk-badge ' + level.toLowerCase() + '">' + level + '</span>';
  }

  function statusTag(s) {
    var cls = (s || '').toLowerCase().replace(/\s+/g, '-');
    return '<span class="status-tag ' + cls + '">' + (s || '\u2014') + '</span>';
  }

  function loadingHTML() {
    return '<div class="loading"><div class="spinner"></div><p class="mt-12">Loading data...</p></div>';
  }

  /* ===== AUTH ===== */
  function clearToken() {
    // AR: التوكن محفوظ في HttpOnly cookie، لذلك لا يوجد شيء نحذفه من JavaScript.
    // EN: Tokens live in HttpOnly cookies, so JavaScript has no token storage to clear.
  }

  function authHeaders() {
    return { 'Content-Type': 'application/json' };
  }

  async function apiFetch(url, options) {
    options = options || {};
    options.headers = Object.assign(authHeaders(), options.headers || {});
    options.credentials = 'include';
    var res = await fetch(url, options);
    if (res.status === 401 && url.indexOf('/refresh') === -1) {
      var refreshed = await fetch(API_BASE + '/refresh', { method: 'POST', credentials: 'include' });
      if (refreshed.ok) {
        res = await fetch(url, options);
      }
    }
    if (res.status === 401) {
      clearToken();
      var target = window.location.pathname;
      if (target.indexOf('login.html') === -1) {
        window.location.href = '/demo/frontend/pages/login/?redirect=' + encodeURIComponent(target);
      }
      throw new Error('Unauthorized — redirecting to login');
    }
    return res;
  }

  /* ===== DATA LOADING ===== */
  function loadData() {
    state.dataSource = 'loading';
    updateSourceBadge();
    refreshLiveStatus(false);
    checkBackend();
  }

  async function checkBackend() {
    try {
      var healthRes = await fetch(API_BASE + '/health', { credentials: 'include', signal: AbortSignal.timeout(2000) });
      if (!healthRes.ok) throw new Error('Health check failed');
      var health = await healthRes.json();
      var healthData = health.data || health;

      state.authRequired = healthData.auth_required === true;

      var sourceParam = healthData.excel_exists ? '' : '?source=demo';
      if (state.filters) {
        var filterParams = [];
        if (state.filters.department) filterParams.push('department=' + encodeURIComponent(state.filters.department));
        if (state.filters.risk_level) filterParams.push('risk_level=' + encodeURIComponent(state.filters.risk_level));
        if (state.filters.status) filterParams.push('status=' + encodeURIComponent(state.filters.status));
        if (state.filters.from_date) filterParams.push('from_date=' + encodeURIComponent(state.filters.from_date));
        if (state.filters.to_date) filterParams.push('to_date=' + encodeURIComponent(state.filters.to_date));
        if (state.filters.search) filterParams.push('search=' + encodeURIComponent(state.filters.search));
        if (filterParams.length) sourceParam = (sourceParam ? sourceParam + '&' : '?') + filterParams.join('&');
      }

      var rejectsRes = await apiFetch(API_BASE + '/rejects' + sourceParam, { signal: AbortSignal.timeout(5000) });
      if (!rejectsRes.ok) throw new Error('Rejects endpoint failed');
      var json = await rejectsRes.json();
      var payload = json.data || json;
      var rejects = payload.rejects || [];
      if (!rejects.length) throw new Error('No rejects data');

      state.rejects = rejects;
      state.dataSource = json.source === 'demo' ? 'static' : json.source === 'excel' ? 'excel' : 'simulated';
      state.analysisSource = 'backend';

      try {
        var summaryRes = await apiFetch(API_BASE + '/summary' + (sourceParam || ''), { signal: AbortSignal.timeout(3000) });
        if (summaryRes.ok) {
          var s = await summaryRes.json();
          var summaryPayload = s.data || s;
          state.analysis = summaryPayload.analysis || summaryPayload;
        } else {
          state.analysis = computeLocalAnalysis(rejects);
        }
      } catch (e) {
        state.analysis = computeLocalAnalysis(rejects);
      }

      renderAll();
    } catch (e) {
      if (e.message.indexOf('Unauthorized') !== -1) return;
      loadStaticData();
    }
  }

  function loadStaticData() {
    if (window.DEMO_DATA) {
      state.rejects = window.DEMO_DATA.rejects;
      state.analysis = window.DEMO_DATA.analysis;
      state.dataSource = 'static';
      state.analysisSource = 'demo';
      state.authRequired = false;
      renderAll();
    } else {
      showError('No data source available. Please ensure /demo/frontend/assets/js/data.js is loaded.');
    }
  }

  /* ===== LOCAL ANALYSIS ===== */
  function computeLocalAnalysis(rejects) {
    var total = rejects.length;
    var totalCost = 0;
    var highRisk = 0;
    var rcMap = {};
    var deptCost = {};
    var itemCostMap = {};
    var pendingApprovals = [];
    var pendingDestruction = [];

    rejects.forEach(function (r) {
      var cost = n(r.cost);
      totalCost += cost;
      if (n(r.risk_score) >= 70) highRisk++;
      var rc = r.root_cause || 'Unknown';
      rcMap[rc] = (rcMap[rc] || 0) + 1;
      var dept = r.department || 'Unknown';
      deptCost[dept] = (deptCost[dept] || 0) + cost;
      var itemName = r.item_name || 'Unknown';
      itemCostMap[itemName] = (itemCostMap[itemName] || 0) + cost;
      if (r.approval_status === 'Pending' && n(r.days_pending) > 0) pendingApprovals.push(r);
      if (r.destruction_status === 'Pending' && r.approval_status !== 'Approved') pendingDestruction.push(r);
    });

    var sortedRC = Object.keys(rcMap).sort(function (a, b) { return rcMap[b] - rcMap[a]; });
    var rootCauses = sortedRC.map(function (c) {
      return { cause: c, count: rcMap[c], percentage: Math.round((rcMap[c] / (total || 1)) * 1000) / 10 };
    });

    var deptCostArr = Object.keys(deptCost).map(function (d) {
      return { department: d, cost: deptCost[d], percentage: totalCost > 0 ? Math.round((deptCost[d] / totalCost) * 1000) / 10 : 0 };
    }).sort(function (a, b) { return b.cost - a.cost; });

    var avgItemCost = totalCost / Math.max(1, Object.keys(itemCostMap).length);
    var anomalies = Object.keys(itemCostMap).filter(function (item) {
      return itemCostMap[item] > avgItemCost * 3 && itemCostMap[item] >= 10000;
    }).map(function (item) {
      var items = rejects.filter(function (r) { return r.item_name === item; });
      var totalRejCost = items.reduce(function (s, r) { return s + n(r.cost); }, 0);
      var pctOfTotal = totalCost > 0 ? Math.round((totalRejCost / totalCost) * 100) : 0;
      return {
        item: item, total_cost: totalRejCost, case_count: items.length,
        percentage_of_total: pctOfTotal,
        alert: item + ' represents ' + pctOfTotal + '% of total reject cost (SAR ' + totalRejCost.toLocaleString() + '). Immediate investigation recommended.'
      };
    }).sort(function (a, b) { return b.total_cost - a.total_cost; });

    var dateRange = rejects.reduce(function (acc, r) {
      if (r.date) { if (!acc.min || r.date < acc.min) acc.min = r.date; if (!acc.max || r.date > acc.max) acc.max = r.date; }
      return acc;
    }, { min: null, max: null });
    var daysSpan = 30;
    if (dateRange.min && dateRange.max) { var d1 = new Date(dateRange.min); var d2 = new Date(dateRange.max); daysSpan = Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24))); }
    var dailyAvgCost = totalCost / daysSpan;
    var projectedNextMonth = Math.round(dailyAvgCost * 30);

    var financeAlerts = rejects.filter(function (r) {
      return r.finance_review_required && n(r.cost) >= 5000;
    }).map(function (r) {
      return { item: r.item_name, cost: n(r.cost), risk: r.risk_level || 'Medium', recommendation: n(r.cost) >= 20000 ? 'Requires Finance Director review before destruction' : 'Review financial impact before destruction approval' };
    }).sort(function (a, b) { return b.cost - a.cost; });

    var capaList = rejects.filter(function (r) { return r.capa_required; }).slice(0, 6).map(function (r) {
      return { title: (r.root_cause || 'Investigation required'), description: 'Root cause identified for ' + r.item_name + ' (Lot: ' + (r.lot_no || '\u2014') + ') requires corrective and preventive action. ' + r.reason, priority: r.risk_level || 'Medium', department: r.department || '\u2014' };
    });

    var destroyBacklog = pendingDestruction.map(function (r) {
      return { item: r.item_name, days_pending: n(r.days_pending), quantity: n(r.quantity), cost: n(r.cost) };
    }).sort(function (a, b) { return b.days_pending - a.days_pending; });

    var delayAlerts = rejects.filter(function (r) { return n(r.days_pending) >= 15; }).map(function (r) {
      return { item: r.item_name, days_pending: n(r.days_pending), department: r.department || '\u2014' };
    }).sort(function (a, b) { return b.days_pending - a.days_pending; });

    var topRC = rootCauses.length > 0 ? rootCauses[0].cause : 'None identified';
    var topDept = deptCostArr.length > 0 ? deptCostArr[0] : null;
    var avgDelay = pendingApprovals.length > 0 ? Math.round(pendingApprovals.reduce(function (s, r) { return s + n(r.days_pending); }, 0) / pendingApprovals.length) : 0;
    var totalDestCost = pendingDestruction.reduce(function (s, r) { return s + n(r.cost); }, 0);

    var execSummary = 'Local analysis of ' + total + ' reject cases shows a total estimated cost of SAR ' +
      totalCost.toLocaleString() + '. There are ' + highRisk + ' high or critical risk cases requiring attention. ' +
      'The most frequent root cause is "' + topRC + '". ' +
      (topDept ? 'The ' + topDept.department + ' department accounts for the highest cost at SAR ' + topDept.cost.toLocaleString() + '. ' : '') +
      'Average approval delay is ' + avgDelay + ' days. ' +
      (destroyBacklog.length > 0 ? destroyBacklog.length + ' cases are pending destruction. ' : '') +
      'Projected reject cost for next month: SAR ' + projectedNextMonth.toLocaleString() + '. ' +
      (anomalies.length > 0 ? anomalies.length + ' anomaly pattern(s) detected. ' : '') +
      'Focus ERP remains the source of truth. This analysis is advisory only and requires QCM/QAM review.';

    return {
      executive_summary: execSummary,
      overall_risk_level: highRisk >= 4 ? 'High' : (highRisk >= 2 ? 'Medium' : 'Low'),
      total_cases: total,
      total_estimated_cost: totalCost,
      high_risk_cases: highRisk,
      repeated_root_causes: rootCauses.slice(0, 5),
      cost_by_department: deptCostArr,
      finance_alerts: financeAlerts.slice(0, 7),
      capa_suggestions: capaList,
      destruction_backlog_alerts: destroyBacklog.slice(0, 5),
      approval_delay_alerts: delayAlerts.slice(0, 5),
      anomalies: anomalies,
      projected_next_month_cost: projectedNextMonth,
      predictive_confidence: daysSpan >= 20 ? 'Medium' : 'Low',
      management_actions: [
        { action: 'Review ' + highRisk + ' high/critical risk cases requiring immediate attention', priority: 'Critical' },
        { action: 'Process ' + pendingDestruction.length + ' pending destruction cases with total cost impact of SAR ' + pendingDestruction.reduce(function (s, r) { return s + n(r.cost); }, 0).toLocaleString(), priority: 'Critical' },
        { action: 'Address approval delays averaging ' + avgDelay + ' days \u2014 ' + pendingApprovals.length + ' cases pending', priority: 'High' },
        { action: 'Assign CAPA owner for top root cause: "' + topRC + '"', priority: 'High' },
        { action: 'Schedule management review of high-value financial impact cases exceeding SAR 20,000', priority: 'Medium' }
      ]
    };
  }

  /* ===== FILTERS ===== */
  function buildFilterUI() {
    var container = $('#filter-bar');
    if (!container || state.dataSource === 'static' || state.dataSource === 'loading') return;
    var depts = {};
    var levels = {};
    var statuses = {};
    (state.rejects || []).forEach(function (r) {
      if (r.department) depts[r.department] = true;
      if (r.risk_level) levels[r.risk_level] = true;
      if (r.approval_status) statuses[r.approval_status] = true;
    });
    var deptOpts = Object.keys(depts).sort();
    var levelOpts = ['Critical', 'High', 'Medium', 'Low'];
    var statusOpts = ['Pending', 'Approved', 'Review'];

    container.innerHTML =
      '<div class="filter-row">' +
      '<select id="filter-dept" class="filter-select"><option value="">All Departments</option>' +
      deptOpts.map(function (d) { return '<option value="' + d + '"' + (state.filters.department === d ? ' selected' : '') + '>' + d + '</option>'; }).join('') +
      '</select>' +
      '<select id="filter-risk" class="filter-select"><option value="">All Risk Levels</option>' +
      levelOpts.map(function (l) { return '<option value="' + l + '"' + (state.filters.risk_level === l ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
      '</select>' +
      '<select id="filter-status" class="filter-select"><option value="">All Statuses</option>' +
      statusOpts.map(function (s) { return '<option value="' + s + '"' + (state.filters.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
      '</select>' +
      '<input type="date" id="filter-from" class="filter-date" value="' + (state.filters.from_date || '') + '" title="From date">' +
      '<input type="date" id="filter-to" class="filter-date" value="' + (state.filters.to_date || '') + '" title="To date">' +
      '<input type="text" id="filter-search" class="filter-search" placeholder="Search item, doc, reason..." value="' + (state.filters.search || '') + '">' +
      '<button id="filter-apply" class="btn btn-primary btn-sm">Apply</button>' +
      '<button id="filter-reset" class="btn btn-outline btn-sm">Reset</button>' +
      '</div>';

    $('#filter-apply').onclick = function () {
      state.filters.department = $('#filter-dept').value;
      state.filters.risk_level = $('#filter-risk').value;
      state.filters.status = $('#filter-status').value;
      state.filters.from_date = $('#filter-from').value;
      state.filters.to_date = $('#filter-to').value;
      state.filters.search = $('#filter-search').value;
      loadData();
    };
    $('#filter-reset').onclick = function () {
      state.filters = {};
      loadData();
    };
  }

  /* ===== RENDER ===== */
  function renderAll() {
    showSourceInfo();
    renderCards();
    renderSummary();
    renderRootCauses();
    renderCostByDept();
    renderRejectTable();
    renderFinanceAlerts();
    renderCAPA();
    renderAlerts();
    renderAnomalies();
    renderPredictiveCost();
    renderActions();
    updateRecordCount();
    buildFilterUI();

    var btn = $('#run-analysis-btn');
    if (btn) { btn.onclick = onRunAnalysis; }

    if (typeof renderPageSpecific === 'function') {
      renderPageSpecific();
    }
  }

  function updateSourceBadge() {
    var el = $('#data-source-badge');
    if (!el) return;
    var labels = { static: 'Static Demo Data', excel: 'Excel + Local Backend', gemini: 'Gemini AI Analysis', simulated: 'Simulated AI Analysis', loading: 'Loading...' };
    el.textContent = labels[state.dataSource] || 'Unknown';
    var clsMap = { static: 'static', excel: 'excel', gemini: 'gemini', simulated: 'simulated', loading: 'loading' };
    el.className = 'data-source-badge ' + (clsMap[state.dataSource] || 'static');
  }

  function showSourceInfo() {
    updateSourceBadge();
    var el = $('#source-info');
    if (!el) return;
    var descriptions = {
      static: 'Displaying prepared demo data from /demo/frontend/assets/js/data.js. Configure the Excel file for live data.',
      excel: 'Reading data from Excel file via local backend server. AI analysis is advisory only.',
      gemini: 'Data processed through Gemini AI analysis. Focus ERP remains the source of truth.',
      simulated: 'Backend is running but Gemini API key is not configured. Using local simulated AI analysis.',
      loading: 'Connecting to data source...'
    };
    el.textContent = descriptions[state.dataSource] || '';
  }

  function renderCards() {
    var grid = $('#cards-grid');
    if (!grid) return;
    var a = state.analysis || {};
    var r = state.rejects || [];
    var pendingApprovals = r.filter(function (x) { return x.approval_status === 'Pending'; }).length;
    var pendingDestruction = r.filter(function (x) { return x.destruction_status === 'Pending' && x.approval_status !== 'Approved'; }).length;
    var highRiskCount = r.filter(function (x) { return n(x.risk_score) >= 70; }).length;
    var highestRiskItem = r.length > 0 ? r.reduce(function (a, b) { return n(a.risk_score) > n(b.risk_score) ? a : b; }) : null;
    var topRC = (a.repeated_root_causes && a.repeated_root_causes.length > 0) ? a.repeated_root_causes[0].cause : '\u2014';

    var cards = [];
    cards.push(renderCard('Total Reject Cases', r.length.toString(), '', 'good', 'KPI'));
    cards.push(renderCard('Total Reject Cost', formatCurrency(a.total_estimated_cost), 'Estimated total across all cases', 'red', 'SAR'));
    cards.push(renderCard('Pending Approvals', pendingApprovals.toString(), 'Awaiting QCM sign-off', 'amber', 'P'));
    cards.push(renderCard('Pending Destruction', pendingDestruction.toString(), 'Awaiting disposal decision', 'amber', 'D'));
    cards.push(renderCard('High Risk Cases', highRiskCount.toString(), 'Score 70+ (High/Critical)', 'red', '!'));
    cards.push(renderCard('Highest Risk Item', highestRiskItem ? highestRiskItem.item_name : '\u2014', 'Score: ' + (highestRiskItem ? highestRiskItem.risk_score : '\u2014'), 'red', 'H'));
    cards.push(renderCard('Projected Next Month', formatCurrency(a.projected_next_month_cost), 'Based on current trend, confidence: ' + (a.predictive_confidence || 'Low'), 'blue', 'P'));
    cards.push(renderCard('Top Root Cause', topRC, 'Most frequent cause', 'blue', 'R'));

    grid.innerHTML = cards.join('');
  }

  function renderCard(label, value, sub, color, icon) {
    var cls = color === 'red' ? 'critical' : color === 'amber' ? 'warning' : 'good';
    var valCls = (label === 'Highest Risk Item' || label === 'Top Root Cause' || label === 'Projected Next Month') ? 'card-value small' : 'card-value';
    return '<div class="card ' + cls + '">' +
      '<div class="card-icon ' + color + '">' + icon + '</div>' +
      '<div class="card-label">' + label + '</div>' +
      '<div class="' + valCls + '">' + value + '</div>' +
      (sub ? '<div class="card-sub">' + sub + '</div>' : '') +
      '</div>';
  }

  function renderSummary() {
    var el = $('#ai-summary');
    if (!el) return;
    var a = state.analysis || {};
    var text = a.executive_summary || 'No analysis available. Click "Refresh Analysis" to generate insights.';
    var srcLabel = state.dataSource === 'static' ? 'Static Demo Data' :
                   state.dataSource === 'gemini' ? 'Gemini AI Analysis' :
                   state.dataSource === 'simulated' ? 'Simulated AI Analysis' : 'Backend Data';
    el.innerHTML =
      '<div class="ai-summary">' +
      '<div class="summary-label">\u2699 AI Executive Summary</div>' +
      '<div class="summary-text">' + text + '</div>' +
      '<div class="summary-meta">' +
      'Overall Risk Level: ' + riskBadge(a.overall_risk_level || '') +
      ' <span style="color:var(--gray-500)">|</span> Last updated: ' + new Date().toLocaleDateString('en-GB') +
      ' <span style="color:var(--gray-500)">|</span> Source: ' + srcLabel +
      ' <span style="color:var(--gray-500)">|</span> Projected next month: ' + formatCurrency(a.projected_next_month_cost) +
      '</div></div>';
  }

  function renderRootCauses() {
    var el = $('#root-causes');
    if (!el) return;
    var a = state.analysis || {};
    var causes = a.repeated_root_causes || [];
    if (!causes.length) { el.innerHTML = '<p class="text-muted">No root cause data available.</p>'; return; }
    var maxCount = causes.reduce(function (m, c) { return Math.max(m, c.count); }, 1);
    el.innerHTML = '<div class="bar-chart">' +
      causes.map(function (c) {
        var pct = Math.round((c.count / maxCount) * 100);
        return '<div class="bar-row"><span class="bar-label">' + c.cause + '</span>' +
          '<div class="bar-track"><div class="bar-fill teal" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + c.count + '</span></div>';
      }).join('') +
      '</div>';
  }

  function renderCostByDept() {
    var el = $('#cost-by-dept');
    if (!el) return;
    var data = (state.analysis && state.analysis.cost_by_department) || [];
    if (!data.length && state.rejects) {
      var deptMap = {};
      state.rejects.forEach(function (x) { var d = x.department || 'Unknown'; deptMap[d] = (deptMap[d] || 0) + n(x.cost); });
      var depts = Object.keys(deptMap);
      var totalC = depts.reduce(function (s, d) { return s + deptMap[d]; }, 0);
      data = depts.map(function (d) { return { department: d, cost: deptMap[d], percentage: totalC > 0 ? Math.round((deptMap[d] / totalC) * 1000) / 10 : 0 }; }).sort(function (a, b) { return b.cost - a.cost; });
    }
    if (!data.length) { el.innerHTML = '<p class="text-muted">No cost data available.</p>'; return; }
    var maxCost = data.reduce(function (m, d) { return Math.max(m, d.cost); }, 1);
    el.innerHTML = '<div class="bar-chart">' +
      data.map(function (d) {
        var pct = Math.round((d.cost / maxCost) * 100);
        return '<div class="bar-row"><span class="bar-label">' + d.department + '</span>' +
          '<div class="bar-track"><div class="bar-fill red" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + formatCurrency(d.cost) + '</span></div>';
      }).join('') +
      '</div>';
  }

  function renderRejectTable() {
    var el = $('#reject-table');
    if (!el) return;
    var r = state.rejects || [];
    if (!r.length) { el.innerHTML = '<p class="text-muted">No reject records available.</p>'; return; }
    el.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Doc #</th><th>Date</th><th>Department</th><th>Item Name</th><th>Lot</th><th>Qty</th><th>Cost</th><th>Status</th><th>Days</th><th>Destruction</th><th>Risk</th></tr></thead><tbody>' +
      r.map(function (x) {
        return '<tr><td>' + (x.doc_no || '\u2014') + '</td><td>' + formatDate(x.date) + '</td><td>' + (x.department || '\u2014') + '</td>' +
          '<td>' + (x.item_name || '\u2014') + '</td><td>' + (x.lot_no || '\u2014') + '</td><td>' + (x.quantity || '\u2014') + '</td>' +
          '<td>' + formatCurrency(x.cost) + '</td><td>' + statusTag(x.approval_status) + '</td>' +
          '<td>' + (x.days_pending || 0) + '</td>' +
          '<td>' + statusTag(x.destruction_status) + '</td>' +
          '<td>' + riskBadge(x.risk_score) + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function renderFinanceAlerts() {
    var el = $('#finance-alerts');
    if (!el) return;
    var a = state.analysis || {};
    var alerts = a.finance_alerts || (window.DEMO_DATA ? window.DEMO_DATA.financeAlerts : []);
    if (!alerts || !alerts.length) { el.innerHTML = '<p class="text-muted">No finance alerts at this time.</p>'; return; }
    el.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Item</th><th>Cost</th><th>Risk</th><th>Recommendation</th></tr></thead><tbody>' +
      alerts.map(function (x) {
        return '<tr><td>' + (x.item || '\u2014') + '</td><td>' + formatCurrency(x.cost) + '</td>' +
          '<td>' + riskBadge(x.risk || 'Medium') + '</td><td>' + (x.recommendation || '\u2014') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function renderCAPA() {
    var el = $('#capa-suggestions');
    if (!el) return;
    var a = state.analysis || {};
    var suggestions = a.capa_suggestions || [];
    if (!suggestions || !suggestions.length) { el.innerHTML = '<p class="text-muted">No CAPA suggestions at this time.</p>'; return; }
    el.innerHTML = '<div class="suggestions-list">' +
      suggestions.map(function (s) {
        return '<div class="suggestion-item"><div class="suggestion-title">' +
          riskBadge(s.priority || 'Medium') + ' ' + (s.title || 'Suggestion') + '</div>' +
          '<div class="suggestion-desc">' + (s.description || '') + '</div>' +
          '<div class="suggestion-meta"><span class="text-muted">Department: ' + (s.department || '\u2014') + '</span></div></div>';
      }).join('') +
      '</div>';
  }

  function renderAlerts() {
    var el = $('#alerts');
    if (!el) return;
    var a = state.analysis || {};
    var backlogAlerts = a.destruction_backlog_alerts || [];
    var delayAlerts = a.approval_delay_alerts || [];
    var items = [];
    backlogAlerts.forEach(function (x) {
      items.push({ type: 'critical', text: 'Destruction backlog: ' + (x.item || '\u2014') + ' \u2014 ' + (x.days_pending || 0) + ' days pending, ' + formatCurrency(x.cost) + ' at risk' });
    });
    delayAlerts.forEach(function (x) {
      items.push({ type: 'warning', text: 'Delayed approval: ' + (x.item || '\u2014') + ' \u2014 ' + (x.days_pending || 0) + ' days in ' + (x.department || '\u2014') });
    });
    if (!items.length) { el.innerHTML = '<p class="text-muted">No active alerts.</p>'; return; }
    el.innerHTML = items.map(function (x) {
      return '<div class="alert-item ' + x.type + '"><span class="alert-icon">\u26A0</span><span>' + x.text + '</span></div>';
    }).join('');
  }

  function renderAnomalies() {
    var el = $('#anomalies');
    if (!el) return;
    var a = state.analysis || {};
    var items = a.anomalies || [];
    if (!items.length) { el.innerHTML = '<p class="text-muted">No anomaly patterns detected.</p>'; return; }
    el.innerHTML = '<div class="anomaly-list">' +
      items.map(function (x) {
        return '<div class="anomaly-item critical"><span class="alert-icon">\u26A0</span>' +
          '<div><strong>' + (x.item || '\u2014') + '</strong> \u2014 ' + (x.alert || '') +
          ' <span class="text-muted">(' + (x.case_count || 0) + ' case(s), ' + formatCurrency(x.total_cost) + ')</span></div></div>';
      }).join('') +
      '</div>';
  }

  function renderPredictiveCost() {
    var el = $('#predictive-cost');
    if (!el) return;
    var a = state.analysis || {};
    var projected = a.projected_next_month_cost;
    if (!projected) { el.innerHTML = '<p class="text-muted">Insufficient data for projection.</p>'; return; }
    var confidence = a.predictive_confidence || 'Low';
    var confClass = confidence.toLowerCase();
    el.innerHTML = '<div class="card" style="padding:20px;">' +
      '<div class="card-label">Projected Reject Cost \u2014 Next 30 Days</div>' +
      '<div class="card-value" style="font-size:1.4rem;color:var(--red-dark);">' + formatCurrency(projected) + '</div>' +
      '<div class="card-sub mt-8">Confidence: <span class="risk-badge ' + confClass + '">' + confidence + '</span></div>' +
      '<div class="mt-12 text-muted text-sm" style="line-height:1.6;">' +
      'Based on current daily average of ' + formatCurrency(Math.round(projected / 30)) + ' per day. ' +
      'Actual cost may vary significantly based on pending approvals, CAPA effectiveness, and production volume changes.' +
      '</div></div>';
  }

  function renderActions() {
    var el = $('#management-actions');
    if (!el) return;
    var a = state.analysis || {};
    var actions = a.management_actions || [];
    if (!actions.length) { el.innerHTML = '<p class="text-muted">No management actions identified.</p>'; return; }
    el.innerHTML = '<div class="action-list">' +
      actions.map(function (x) {
        var pri = (x.priority || 'medium').toLowerCase();
        return '<div class="action-item"><span class="priority-dot ' + pri + '"></span><span>' + (x.action || '') + '</span></div>';
      }).join('') +
      '</div>';
  }

  function updateRecordCount() {
    var el = $('#record-count');
    if (el && state.rejects) {
      el.textContent = state.rejects.length + ' records';
    }
  }

  function showError(msg) {
    state.errors.push(msg);
    console.error('Dashboard Error:', msg);
    var el = $('#alerts');
    if (el) {
      el.innerHTML = '<div class="alert-item critical"><span class="alert-icon">\u26A0</span><span>' + msg + '</span></div>';
    }
  }

  function showNotification(message, type) {
    var el = $('#live-notification');
    if (!el) {
      el = document.createElement('div');
      el.id = 'live-notification';
      el.className = 'live-notification';
      document.body.appendChild(el);
    }

    el.className = 'live-notification ' + (type || 'info') + ' show';
    el.textContent = message;
    window.clearTimeout(el._hideTimer);
    el._hideTimer = window.setTimeout(function () {
      el.classList.remove('show');
    }, 4500);
  }

  function setupRealtimeUpdates() {
    if (socketConnected) return;

    function connectSocket() {
      if (typeof window.io !== 'function') return;
      var socket = window.io({ withCredentials: true });
      socketConnected = true;

      socket.on('data:updated', function (payload) {
        var count = payload && payload.record_count ? payload.record_count : 'new';
        if (payload && payload.record_count !== undefined) {
          state.liveStats.record_count = Number(payload.record_count) || 0;
          state.liveStats.file_modified_at = payload.file_modified_at || state.liveStats.file_modified_at;
          state.liveStats.sheet_count = Number(payload.sheet_count || state.liveStats.sheet_count || 0);
          state.liveStats.hash = payload.new_hash || payload.hash || state.liveStats.hash;
          state.liveStats.last_load = payload.timestamp || new Date().toISOString();
          renderLiveStatus(true);
        }
        showNotification('Excel data updated. Reloading ' + count + ' records...', 'success');
        loadData();
      });

      socket.on('data:update_failed', function (payload) {
        showNotification((payload && payload.message) || 'Excel reload failed.', 'error');
      });
    }

    if (typeof window.io === 'function') {
      connectSocket();
      return;
    }

    var script = document.createElement('script');
    script.src = '/demo/node_modules/socket.io/client-dist/socket.io.js';
    script.async = true;
    script.onload = connectSocket;
    document.head.appendChild(script);
  }

  /* ===== RUN ANALYSIS ===== */
  async function onRunAnalysis() {
    if (state.aiRunning) return;
    state.aiRunning = true;
    var btn = $('#run-analysis-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '\u23F3 Running Analysis...'; }

    if (state.dataSource === 'static') {
      state.analysis = window.DEMO_DATA.analysis;
      renderAll();
      if (btn) { btn.disabled = false; btn.innerHTML = '\uD83D\uDD04 Refresh Analysis'; }
      state.aiRunning = false;
      return;
    }

    try {
      var res = await apiFetch(API_BASE + '/run-analysis', { method: 'POST', signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        var json = await res.json();
        state.analysis = json.analysis || json;
        if (json.gemini_used) { state.dataSource = 'gemini'; }
        else { state.dataSource = state.dataSource === 'excel' ? 'excel' : 'simulated'; }
        renderAll();
      } else {
        state.analysis = computeLocalAnalysis(state.rejects);
        renderAll();
      }
    } catch (e) {
      if (e.message.indexOf('Unauthorized') === -1) {
        state.analysis = computeLocalAnalysis(state.rejects);
        renderAll();
      }
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '\uD83D\uDD04 Refresh Analysis'; }
    state.aiRunning = false;
  }

  /* ===== INIT ===== */
  function init() {
    setupSidebar();
    setupRealtimeUpdates();
    refreshLiveStatus(false);
    window.setInterval(function () { refreshLiveStatus(false); }, 30000);
    loadData();

    var searchInput = $('#filter-search');
    if (searchInput) {
      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { var btn = $('#filter-apply'); if (btn) btn.click(); }
      });
    }
  }

  function setupSidebar() {
    var hamburger = $('.hamburger');
    var sidebar = $('.sidebar');
    if (hamburger && sidebar) {
      hamburger.addEventListener('click', function () { sidebar.classList.toggle('open'); });
      document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) { sidebar.classList.remove('open'); }
      });
    }
    $$('.sidebar-nav a').forEach(function (a) {
      if (a.href === window.location.href || a.href === window.location.pathname) { a.classList.add('active'); }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
