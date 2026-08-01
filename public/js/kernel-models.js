/**
 * kernel-models.js — Vanilla JS engine for /kernel/models/ (M25).
 *
 * Reads window.KernelModelsData (from kernel-models-data.js).
 * Renders: registry table (sortable) + arena A/B + routing flow chart +
 * manual overrides + degradation alerts + security leaderboard + export.
 *
 * CSP-safe: type="module", no dynamic imports, no eval.
 * Deterministic: no Math.random, no Date.now, no toLocaleString.
 * Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var data = (typeof window !== 'undefined' && window.KernelModelsData) || null;
  var modelsData = null;
  var reducedMotion = false;
  var arenaInterval = null;
  var liveInterval = null;

  function init() {
    if (!data) {
      console.error('KernelModelsData not loaded');
      return;
    }
    modelsData = data.buildModelsData();
    reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    initRegistry();
    initArena();
    initRouting();
    initSecurityLeaderboard();
    bindExport();
  }

  // ── Registry: sortable table ───────────────────────────────────────────────

  function initRegistry() {
    var tbody = document.getElementById('km-tbody');
    if (!tbody) return;

    var models = modelsData.registry;
    var best = {
      latency: Infinity,
      cost: Infinity,
      success: 0,
      hallucination: Infinity,
      safety: 0,
    };

    models.forEach(function (m) {
      if (m.medianLatency < best.latency) best.latency = m.medianLatency;
      if (m.costPer1k < best.cost) best.cost = m.costPer1k;
      if (m.successRate > best.success) best.success = m.successRate;
      if (m.hallucinationRate < best.hallucination) best.hallucination = m.hallucinationRate;
      if (m.safetyScore > best.safety) best.safety = m.safetyScore;
    });

    renderRegistryRows(tbody, models, best);

    var table = document.getElementById('km-table');
    if (!table) return;

    var headers = table.querySelectorAll('th[data-col]');
    var sortDir = {};

    headers.forEach(function (th) {
      sortDir[th.dataset.col] = 'none';
      th.addEventListener('click', function () {
        var col = th.dataset.col;
        if (sortDir[col] === 'none') sortDir[col] = 'asc';
        else if (sortDir[col] === 'asc') sortDir[col] = 'desc';
        else sortDir[col] = 'none';

        headers.forEach(function (h) { h.dataset.sortDir = 'none'; });
        th.dataset.sortDir = sortDir[col];

        if (sortDir[col] === 'none') {
          renderRegistryRows(tbody, models, best);
          return;
        }

        var sorted = models.slice().sort(function (a, b) {
          var va, vb;
          switch (col) {
            case 'latency': va = a.medianLatency; vb = b.medianLatency; break;
            case 'cost': va = a.costPer1k; vb = b.costPer1k; break;
            case 'success': va = a.successRate; vb = b.successRate; break;
            case 'hallucination': va = a.hallucinationRate; vb = b.hallucinationRate; break;
            case 'safety': va = a.safetyScore; vb = b.safetyScore; break;
            default: return 0;
          }
          return sortDir[col] === 'asc' ? va - vb : vb - va;
        });

        renderRegistryRows(tbody, sorted, best);
      });
    });
  }

  function renderRegistryRows(tbody, models, best) {
    var html = '';
    models.forEach(function (m) {
      var isBest =
        m.medianLatency === best.latency ||
        m.costPer1k === best.cost ||
        m.successRate === best.success ||
        m.hallucinationRate === best.hallucination ||
        m.safetyScore === best.safety;

      var barLevel = m.successRate >= 90 ? 'low' : m.successRate >= 75 ? 'mid' : 'high';
      var hallucLevel = m.hallucinationRate <= 10 ? 'low' : m.hallucinationRate <= 20 ? 'mid' : 'high';

      html += '<tr data-best="' + isBest + '">';
      html += '<td>' + m.logo + '</td>';
      html += '<td><strong>' + m.name + '</strong><br><span class="km-version">' + m.version + '</span><br><span class="km-provider">' + m.provider + '</span></td>';
      html += '<td><span class="km-badge km-badge--' + m.dataLocation + '">' + m.locationLabel + '</span></td>';
      html += '<td dir="ltr" class="km-mono">' + m.medianLatency + 'ms ' + (m.medianLatency === best.latency ? '⭐' : '') + '</td>';
      html += '<td dir="ltr" class="km-mono">$' + m.costPer1k + '</td>';
      html += '<td><div class="km-bar"><div class="km-bar__track"><div class="km-bar__fill" style="width:' + m.successRate + '%" data-level="' + barLevel + '"></div></div><span class="km-bar__value">' + m.successRate + '%</span></div></td>';
      html += '<td><span class="km-hallucination" data-level="' + hallucLevel + '">' + m.hallucinationRate + '%</span></td>';
      html += '<td><span class="km-safety">' + m.safetyScore + '/100</span></td>';
      html += '<td><span class="km-status km-status--' + m.status + '">' + m.statusLabel + '</span></td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
  }

  // ── Arena: live parallel simulation ────────────────────────────────────────

  function initArena() {
    var runBtn = document.getElementById('km-arena-run');
    if (!runBtn) return;

    var countdownEl = document.getElementById('km-arena-countdown');
    var columns = document.querySelectorAll('.km-arena__column');
    var leaderboardRows = document.getElementById('km-arena-leaderboard-rows');
    var voteBtn = document.querySelector('[data-km-arena-vote]');

    var leaderboard = {};
    modelsData.arenaModels.forEach(function (m) { leaderboard[m.name] = 0; });

    function renderLeaderboard() {
      if (!leaderboardRows) return;
      var sorted = Object.entries(leaderboard).sort(function (a, b) { return b[1] - a[1]; });
      leaderboardRows.innerHTML = sorted.map(function (entry, i) {
        return '<div class="km-arena__leaderboard-row">' +
          '<span class="km-arena__leaderboard-rank">' + (i + 1) + '</span>' +
          '<span class="km-arena__leaderboard-name">' + entry[0] + '</span>' +
          '<span class="km-arena__leaderboard-votes">' + entry[1] + '</span>' +
          '</div>';
      }).join('');
    }

    runBtn.addEventListener('click', function () {
      if (arenaInterval) return;

      var input = document.getElementById('km-arena-input');
      var prompt = input && input.value.trim() ? input.value.trim() : 'مثال: حلل وثيقة العقد التالية';

      runBtn.disabled = true;
      var elapsed = 0;
      var maxDuration = reducedMotion ? 0 : 3000;
      var step = 100;

      if (countdownEl) {
        countdownEl.textContent = '⏳ جارية...';
        countdownEl.dataset.active = 'true';
      }

      columns.forEach(function (col) {
        var stream = col.querySelector('[data-stream]');
        var result = col.querySelector('[data-result]');
        if (stream) { stream.textContent = ''; stream.dataset.live = 'true'; }
        if (result) result.hidden = true;
      });

      // Deterministic results from the data generator
      var results = data.buildArenaRun(prompt);

      function finishArena() {
        columns.forEach(function (col) {
          var modelName = col.dataset.model;
          var stream = col.querySelector('[data-stream]');
          var result = col.querySelector('[data-result]');
          if (!stream || !result) return;

          var res = results.find(function (r) { return r.modelName === modelName; });
          if (!res) return;

          stream.dataset.live = 'false';
          stream.textContent = res.response;
          result.hidden = false;

          result.querySelector('[data-field="time"]').textContent = res.time + 'ms';
          result.querySelector('[data-field="cost"]').textContent = '$' + res.cost + '/1K';
          result.querySelector('[data-field="governance"]').textContent = res.governance + '/100';

          var winnerEl = result.querySelector('[data-winner]');
          if (winnerEl) {
            winnerEl.hidden = !res.isWinner;
            if (res.isWinner) winnerEl.textContent = '🏆 الأسرع';
          }
        });

        if (countdownEl) {
          countdownEl.textContent = 'اكتب طلب جديد وشغّل من جديد';
          countdownEl.dataset.active = 'false';
        }
        runBtn.disabled = false;
        arenaInterval = null;
      }

      if (reducedMotion || maxDuration === 0) {
        finishArena();
        return;
      }

      arenaInterval = setInterval(function () {
        elapsed += step;
        var remaining = Math.max(0, Math.ceil((maxDuration - elapsed) / 1000));
        if (countdownEl) {
          countdownEl.textContent = remaining > 0 ? remaining + 's' : '✅ انتهى';
          countdownEl.dataset.active = remaining > 0 ? 'true' : 'false';
        }

        columns.forEach(function (col) {
          var stream = col.querySelector('[data-stream]');
          if (stream && elapsed < maxDuration) {
            stream.textContent = stream.textContent + '.';
          }
        });

        if (elapsed >= maxDuration) {
          clearInterval(arenaInterval);
          finishArena();
        }
      }, step);
    });

    if (voteBtn) {
      voteBtn.addEventListener('click', function () {
        // Deterministic round-robin (no Math.random)
        var keys = Object.keys(leaderboard);
        var totalVotes = Object.values(leaderboard).reduce(function (a, b) { return a + b; }, 0);
        var idx = totalVotes % keys.length;
        leaderboard[keys[idx]]++;
        renderLeaderboard();
      });
    }

    renderLeaderboard();
  }

  // ── Routing: SVG flow chart ────────────────────────────────────────────────

  function initRouting() {
    var chart = document.getElementById('km-routing-chart');
    if (!chart) return;

    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 460');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    var nodes = modelsData.routingNodes;
    var links = modelsData.routingLinks;

    // Draw links
    links.forEach(function (link) {
      var fromNode = nodes.find(function (n) { return n.id === link.from; });
      var toNode = nodes.find(function (n) { return n.id === link.to; });
      if (!fromNode || !toNode) return;

      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', fromNode.x);
      line.setAttribute('y1', fromNode.y);
      line.setAttribute('x2', toNode.x);
      line.setAttribute('y2', toNode.y);
      line.setAttribute('stroke', 'rgba(255,255,255,.12)');
      line.setAttribute('stroke-width', '2');
      line.classList.add('km-routing__link', 'km-link');
      line.dataset.from = link.from;
      line.dataset.to = link.to;
      svg.appendChild(line);
    });

    // Draw nodes
    nodes.forEach(function (node) {
      var g = document.createElementNS(svgNS, 'g');
      g.classList.add('km-routing__node', 'km-node');
      g.setAttribute('data-node-id', node.id);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', node.label);

      var bgColor, borderColor, textColor;
      switch (node.type) {
        case 'start':
          bgColor = 'rgba(45,212,167,.15)';
          borderColor = 'rgba(45,212,167,.5)';
          textColor = '#2DD4A7';
          break;
        case 'decision':
          bgColor = 'rgba(245,158,11,.15)';
          borderColor = 'rgba(245,158,11,.5)';
          textColor = '#F59E0B';
          break;
        case 'model':
          bgColor = 'rgba(34,211,238,.15)';
          borderColor = 'rgba(34,211,238,.5)';
          textColor = '#22D3EE';
          break;
        case 'end':
          bgColor = 'rgba(45,212,167,.2)';
          borderColor = 'rgba(45,212,167,.6)';
          textColor = '#2DD4A7';
          break;
        default:
          bgColor = 'rgba(255,255,255,.05)';
          borderColor = 'rgba(255,255,255,.1)';
          textColor = '#A7B4CC';
      }

      var rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', node.x - 60);
      rect.setAttribute('y', node.y - 18);
      rect.setAttribute('width', '120');
      rect.setAttribute('height', '36');
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      rect.setAttribute('fill', bgColor);
      rect.setAttribute('stroke', borderColor);
      rect.setAttribute('stroke-width', '1');
      g.appendChild(rect);

      var text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + 1);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('fill', textColor);
      text.setAttribute('font-size', '11');
      text.setAttribute('font-family', 'inherit');
      text.setAttribute('dir', 'rtl');
      text.textContent = node.label;
      g.appendChild(text);

      g.addEventListener('click', function () { highlightPath(node.id); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          highlightPath(node.id);
        }
      });

      svg.appendChild(g);
    });

    chart.appendChild(svg);

    function highlightPath(nodeId) {
      var connectedLinks = links.filter(function (l) {
        return l.from === nodeId || l.to === nodeId;
      });

      svg.querySelectorAll('.km-link').forEach(function (l) {
        l.classList.remove('km-link--active');
        l.setAttribute('stroke', 'rgba(255,255,255,.12)');
        l.setAttribute('stroke-width', '2');
      });
      svg.querySelectorAll('.km-node').forEach(function (n) {
        n.classList.remove('km-node--active');
      });

      connectedLinks.forEach(function (link) {
        var line = svg.querySelector('.km-link[data-from="' + link.from + '"][data-to="' + link.to + '"]');
        if (line) {
          line.classList.add('km-link--active');
          line.setAttribute('stroke', '#2DD4A7');
          line.setAttribute('stroke-width', '3');
        }
      });

      var nodeEl = svg.querySelector('.km-node[data-node-id="' + nodeId + '"]');
      if (nodeEl) nodeEl.classList.add('km-node--active');
    }

    // Live request simulation (deterministic cycling)
    if (!reducedMotion) {
      var startNode = nodes.find(function (n) { return n.id === 'start'; });
      if (startNode) {
        setTimeout(function () { highlightPath(startNode.id); }, 1000);
        liveInterval = setInterval(function () {
          highlightPath(startNode.id);
        }, 8000);
      }
    }
  }

  // ── Security leaderboard ───────────────────────────────────────────────────

  function initSecurityLeaderboard() {
    var grid = document.getElementById('km-security-lb-grid');
    if (!grid) return;

    var sorted = modelsData.securityLeaderboard.slice().sort(function (a, b) { return b.score - a.score; });
    grid.innerHTML = sorted.map(function (entry) {
      return '<div class="km-routing__lb-card">' +
        '<div class="km-routing__lb-card-name">' + entry.name + '</div>' +
        '<div class="km-routing__lb-card-score">' + entry.score + '</div>' +
        '<div class="km-routing__lb-card-label">' + entry.label + '</div>' +
        '<div class="km-routing__lb-card-bar"><div class="km-routing__lb-card-bar-fill" style="width:' + entry.score + '%"></div></div>' +
        '</div>';
    }).join('');
  }

  // ── Export (model comparison) ──────────────────────────────────────────────

  function bindExport() {
    var exportBtn = document.getElementById('km-export-csv');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', function () {
      var models = modelsData.registry;
      var headers = ['Name', 'Version', 'Provider', 'DataLocation', 'Latency', 'CostPer1k', 'SuccessRate', 'HallucinationRate', 'SafetyScore', 'Status'];
      var rows = [headers.join(',')];
      models.forEach(function (m) {
        rows.push([m.name, m.version, m.provider, m.dataLocation, m.medianLatency, m.costPer1k, m.successRate, m.hallucinationRate, m.safetyScore, m.status].join(','));
      });
      var csv = rows.join('\n');
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'kernel-models-comparison.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  document.addEventListener('astro:page-load', init);
})();