(function () {
  var state = {
    rejects: null,
    analysis: null,
    dataSource: 'loading',
    aiRunning: false,
    errors: [],
    analysisSource: null
  };

  var API_BASE = 'http://localhost:3000/api';

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

  /* ===== DATA LOADING ===== */
  function loadData() {
    state.dataSource = 'loading';
    updateSourceBadge();
    checkBackend();
  }

  async function checkBackend() {
    try {
      var healthRes = await fetch(API_BASE + '/health', { signal: AbortSignal.timeout(2000) });
      if (!healthRes.ok) throw new Error('Health check failed');
      var health = await healthRes.json();

      var sourceParam = health.excel_exists ? '' : '?source=demo';
      var rejectsRes = await fetch(API_BASE + '/rejects' + sourceParam, { signal: AbortSignal.timeout(5000) });
      if (!rejectsRes.ok) throw new Error('Rejects endpoint failed');
      var json = await rejectsRes.json();
      var rejects = json.rejects || json.data || [];
      if (!rejects.length) throw new Error('No rejects data');

      state.rejects = rejects;
      state.dataSource = json.source === 'demo' ? 'static' : json.source === 'excel' ? 'excel' : 'simulated';
      state.analysisSource = 'backend';

      try {
        var summaryRes = await fetch(API_BASE + '/summary', { signal: AbortSignal.timeout(3000) });
        if (summaryRes.ok) {
          var s = await summaryRes.json();
          state.analysis = s.analysis || s;
        } else {
          state.analysis = computeLocalAnalysis(rejects);
        }
      } catch (e) {
        state.analysis = computeLocalAnalysis(rejects);
      }

      renderAll();
    } catch (e) {
      loadStaticData();
    }
  }

  function loadStaticData() {
    if (window.DEMO_DATA) {
      state.rejects = window.DEMO_DATA.rejects;
      state.analysis = window.DEMO_DATA.analysis;
      state.dataSource = 'static';
      state.analysisSource = 'demo';
      renderAll();
    } else {
      showError('No data source available. Please ensure assets/data.js is loaded.');
    }
  }

  /* ===== LOCAL ANALYSIS ===== */
  function computeLocalAnalysis(rejects) {
    var total = rejects.length;
    var totalCost = 0;
    var highRisk = 0;
    var rcMap = {};
    var deptCost = {};
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

    var financeAlerts = rejects.filter(function (r) {
      return r.finance_review_required && n(r.cost) >= 5000;
    }).map(function (r) {
      return {
        item: r.item_name,
        cost: n(r.cost),
        risk: r.risk_level || 'Medium',
        recommendation: n(r.cost) >= 20000 ? 'Requires Finance Director review before destruction' : 'Review financial impact before destruction approval'
      };
    }).sort(function (a, b) { return b.cost - a.cost; });

    var capaList = rejects.filter(function (r) { return r.capa_required; }).slice(0, 6).map(function (r) {
      return {
        title: (r.root_cause || 'Investigation required'),
        description: 'Root cause identified for ' + r.item_name + ' (Lot: ' + (r.lot_no || '\u2014') + ') requires corrective and preventive action. ' + r.reason,
        priority: r.risk_level || 'Medium',
        department: r.department || '\u2014'
      };
    });

    var destroyBacklog = pendingDestruction.map(function (r) {
      return { item: r.item_name, days_pending: n(r.days_pending), quantity: n(r.quantity), cost: n(r.cost) };
    }).sort(function (a, b) { return b.days_pending - a.days_pending; });

    var delayAlerts = rejects.filter(function (r) {
      return n(r.days_pending) >= 15;
    }).map(function (r) {
      return { item: r.item_name, days_pending: n(r.days_pending), department: r.department || '\u2014' };
    }).sort(function (a, b) { return b.days_pending - a.days_pending; });

    var topRC = rootCauses.length > 0 ? rootCauses[0].cause : 'None identified';
    var topDept = deptCostArr.length > 0 ? deptCostArr[0] : null;
    var avgDelay = pendingApprovals.length > 0
      ? Math.round(pendingApprovals.reduce(function (s, r) { return s + n(r.days_pending); }, 0) / pendingApprovals.length)
      : 0;

    var execSummary = 'Local analysis of ' + total + ' reject cases shows a total estimated cost of SAR ' +
      totalCost.toLocaleString() + '. There are ' + highRisk + ' high or critical risk cases requiring attention. ' +
      'The most frequent root cause is "' + topRC + '". ' +
      (topDept ? 'The ' + topDept.department + ' department accounts for the highest cost at SAR ' + topDept.cost.toLocaleString() + '. ' : '') +
      'Average approval delay is ' + avgDelay + ' days. ' +
      (destroyBacklog.length > 0 ? destroyBacklog.length + ' cases are pending destruction. ' : '') +
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
      management_actions: [
        { action: 'Review ' + highRisk + ' high/critical risk cases requiring immediate attention', priority: 'Critical' },
        { action: 'Process ' + pendingDestruction.length + ' pending destruction cases with total cost impact of SAR ' + pendingDestruction.reduce(function (s, r) { return s + n(r.cost); }, 0).toLocaleString(), priority: 'Critical' },
        { action: 'Address approval delays averaging ' + avgDelay + ' days \u2014 ' + pendingApprovals.length + ' cases pending', priority: 'High' },
        { action: 'Assign CAPA owner for top root cause: "' + topRC + '"', priority: 'High' },
        { action: 'Schedule management review of high-value financial impact cases exceeding SAR 20,000', priority: 'Medium' }
      ]
    };
  }

  /* ===== NEW: Anomaly Detection ===== */
  function renderAnomalyDetection() {
    var el = $('#anomaly-detection');
    if (!el) return;
    var alerts = (window.DEMO_DATA && window.DEMO_DATA.anomalyAlerts) || [];
    if (!alerts.length) { el.innerHTML = '<p class="text-muted">No anomaly alerts at this time.</p>'; return; }
    el.innerHTML = alerts.map(function (a) {
      var pri = (a.priority || 'medium').toLowerCase();
      return '<div class="alert-item ' + pri + '">' +
        '<span class="alert-icon">\u26A0</span>' +
        '<div style="flex:1"><strong>' + (a.title || '') + '</strong>' +
        '<div class="text-sm mt-4">' + (a.details || '') + '</div>' +
        '<div class="text-xs text-muted mt-4">Impact: ' + (a.impact || '') + '</div></div>' +
        '<span class="risk-badge ' + pri + '">' + (a.priority || '') + '</span></div>';
    }).join('');
  }

  /* ===== NEW: Monthly Cost Trend ===== */
  function renderMonthlyCost() {
    var el = $('#cost-by-month');
    if (!el) return;
    var months = (window.DEMO_DATA && window.DEMO_DATA.monthlyCostByMonth) || [];
    if (!months.length) { el.innerHTML = '<p class="text-muted">No monthly cost data available.</p>'; return; }
    var maxCost = months.reduce(function (m, x) { return Math.max(m, x.cost); }, 1);
    el.innerHTML = '<div class="bar-chart">' +
      months.map(function (m) {
        var pct = Math.round((m.cost / maxCost) * 100);
        return '<div class="bar-row"><span class="bar-label">' + m.month + '</span>' +
          '<div class="bar-track"><div class="bar-fill red" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + formatCurrency(m.cost) + '</span></div>';
      }).join('') +
      '</div>';
  }

  /* ===== NEW: Cost by Product ===== */
  function renderCostByProduct() {
    var el = $('#cost-by-product');
    if (!el) return;
    var products = (window.DEMO_DATA && window.DEMO_DATA.costByProduct) || [];
    if (!products.length) { el.innerHTML = '<p class="text-muted">No product cost data available.</p>'; return; }
    var maxCost = products.reduce(function (m, x) { return Math.max(m, x.cost); }, 1);
    el.innerHTML = '<div class="bar-chart">' +
      products.map(function (p) {
        var pct = Math.round((p.cost / maxCost) * 100);
        return '<div class="bar-row"><span class="bar-label">' + (p.product || '') + '</span>' +
          '<div class="bar-track"><div class="bar-fill teal" style="width:' + pct + '%"></div></div>' +
          '<span class="bar-value">' + formatCurrency(p.cost) + '</span></div>';
      }).join('') +
      '</div>';
  }

  /* ===== NEW: Top 5 Risks ===== */
  function renderTop5Risks() {
    var el = $('#top-risks');
    if (!el) return;
    var risks = (window.DEMO_DATA && window.DEMO_DATA.top5Risks) || [];
    if (!risks.length) { el.innerHTML = '<p class="text-muted">No top risks identified.</p>'; return; }
    el.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>#</th><th>Risk Description</th><th>Score</th><th>Department</th><th>Required Action</th></tr></thead><tbody>' +
      risks.map(function (x) {
        return '<tr><td>' + (x.rank || '') + '</td><td>' + (x.risk || '') + '</td>' +
          '<td>' + (x.score ? '<span class="risk-badge ' + riskLevel(x.score).toLowerCase() + '">' + x.score + '</span>' : '—') + '</td>' +
          '<td>' + (x.department || '—') + '</td>' +
          '<td>' + (x.action || '—') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  /* ===== RENDER ===== */
  function renderAll() {
    showSourceInfo();
    renderCards();
    renderSummary();
    renderAnomalyDetection();
    renderMonthlyCost();
    renderCostByProduct();
    renderTop5Risks();
    renderRootCauses();
    renderCostByDept();
    renderRejectTable();
    renderFinanceAlerts();
    renderCAPA();
    renderAlerts();
    renderActions();
    updateRecordCount();

    var btn = $('#run-analysis-btn');
    if (btn) {
      btn.onclick = onRunAnalysis;
    }

    if (typeof renderPageSpecific === 'function') {
      renderPageSpecific();
    }
  }

  function updateSourceBadge() {
    var el = $('#data-source-badge');
    if (!el) return;
    var labels = {
      static: 'Static Demo Data',
      excel: 'Excel + Local Backend',
      gemini: 'Gemini AI Analysis',
      simulated: 'Simulated AI Analysis',
      loading: 'Loading...'
    };
    el.textContent = labels[state.dataSource] || 'Unknown';
    var clsMap = { static: 'static', excel: 'excel', gemini: 'gemini', simulated: 'simulated', loading: 'loading' };
    el.className = 'data-source-badge ' + (clsMap[state.dataSource] || 'static');
  }

  function showSourceInfo() {
    updateSourceBadge();
    var el = $('#source-info');
    if (!el) return;
    var descriptions = {
      static: 'Displaying prepared demo data from assets/data.js. Start the backend server and configure the Excel file for live data.',
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
    cards.push(renderCard('Top Root Cause', topRC, 'Most frequent cause', 'blue', 'R'));

    grid.innerHTML = cards.join('');
  }

  function renderCard(label, value, sub, color, icon) {
    var cls = color === 'red' ? 'critical' : color === 'amber' ? 'warning' : 'good';
    var valCls = (label === 'Highest Risk Item' || label === 'Top Root Cause') ? 'card-value small' : 'card-value';
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
    var text = a.executive_summary || 'No analysis available. Click "Run AI Analysis" to generate insights.';
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
      state.rejects.forEach(function (x) {
        var d = x.department || 'Unknown';
        deptMap[d] = (deptMap[d] || 0) + n(x.cost);
      });
      var depts = Object.keys(deptMap);
      var totalC = depts.reduce(function (s, d) { return s + deptMap[d]; }, 0);
      data = depts.map(function (d) {
        return { department: d, cost: deptMap[d], percentage: totalC > 0 ? Math.round((deptMap[d] / totalC) * 1000) / 10 : 0 };
      }).sort(function (a, b) { return b.cost - a.cost; });
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

  /* ===== RUN ANALYSIS ===== */
  async function onRunAnalysis() {
    if (state.aiRunning) return;
    state.aiRunning = true;
    var btn = $('#run-analysis-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '\u23F3 Running Analysis...'; }

    if (state.dataSource === 'static') {
      state.analysis = window.DEMO_DATA.analysis;
      renderAll();
      if (btn) { btn.disabled = false; btn.innerHTML = '\uD83D\uDD04 Run AI Analysis'; }
      state.aiRunning = false;
      return;
    }

    try {
      var res = await fetch(API_BASE + '/run-analysis', { method: 'POST', signal: AbortSignal.timeout(30000) });
      if (res.ok) {
        var json = await res.json();
        state.analysis = json.analysis || json;
        if (json.gemini_used) {
          state.dataSource = 'gemini';
        } else {
          state.dataSource = state.dataSource === 'excel' ? 'excel' : 'simulated';
        }
        renderAll();
      } else {
        state.analysis = computeLocalAnalysis(state.rejects);
        renderAll();
      }
    } catch (e) {
      state.analysis = computeLocalAnalysis(state.rejects);
      renderAll();
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '\uD83D\uDD04 Run AI Analysis'; }
    state.aiRunning = false;
  }

  /* ===== INIT ===== */
  function init() {
    setupSidebar();
    loadData();
  }

  function setupSidebar() {
    var hamburger = $('.hamburger');
    var sidebar = $('.sidebar');
    if (hamburger && sidebar) {
      hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('open');
      });
      document.addEventListener('click', function (e) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      });
    }

    $$('.sidebar-nav a').forEach(function (a) {
      if (a.href === window.location.href || a.href === window.location.pathname) {
        a.classList.add('active');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
