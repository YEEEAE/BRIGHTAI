/**
 * roi-calculator.js — BrightAI ROI calculator logic (vanilla JS).
 *
 * Estimates annual value of AI-governance automation vs manual compliance:
 *   - Labor savings: automating manual audit/tracking hours.
 *   - Risk-reduction value: fewer Shadow-AI incidents × sector risk weight.
 * Results are illustrative estimates, clearly labelled as such in the UI.
 * Respects prefers-reduced-motion (no animation needed) and degrades gracefully.
 */
(function () {
  'use strict';

  var form = document.getElementById('roi-form');
  if (!form) return;

  var sectorRisk = {
    bank: 1.0,
    hospital: 0.9,
    government: 0.85,
    industry: 0.7,
    tech: 0.6,
    other: 0.5,
  };

  var els = {
    employees: document.getElementById('roi-employees'),
    hours: document.getElementById('roi-hours'),
    hourly: document.getElementById('roi-hourly'),
    incidents: document.getElementById('roi-incidents'),
    investment: document.getElementById('roi-investment'),
    sector: document.getElementById('roi-sector'),
  };

  var out = {
    labor: document.getElementById('roi-out-labor'),
    risk: document.getElementById('roi-out-risk'),
    total: document.getElementById('roi-out-total'),
    roi: document.getElementById('roi-out-roi'),
    payback: document.getElementById('roi-out-payback'),
  };

  function num(el, d) {
    var v = parseFloat((el && el.value) || '');
    return isNaN(v) ? d : v;
  }

  function fmt(n) {
    return Math.round(n).toLocaleString('ar-SA');
  }

  function calc() {
    var employees = num(els.employees, 0);
    var hours = num(els.hours, 0);
    var hourly = num(els.hourly, 0);
    var incidents = num(els.incidents, 0);
    var investment = num(els.investment, 0);
    var risk = sectorRisk[els.sector && els.sector.value] || 0.5;

    // Labor: automating manual audit/tracking (12 months).
    var labor = hours * 12 * hourly;

    // Risk: incidents avoided × sector-weighted average incident cost.
    // Baseline average incident cost (SAR) is a planning assumption.
    var avgIncidentCost = 75000;
    var avoidedIncidents = incidents * 0.7; // assume 70% reduction via governance
    var riskValue = avoidedIncidents * avgIncidentCost * risk;

    var total = labor + riskValue;
    var roi = investment > 0 ? ((total - investment) / investment) * 100 : 0;
    var paybackMonths = investment > 0 && total > 0
      ? Math.max(1, Math.round((investment / (total / 12)) * 10) / 10)
      : 0;

    if (out.labor) out.labor.textContent = fmt(labor) + ' SAR';
    if (out.risk) out.risk.textContent = fmt(riskValue) + ' SAR';
    if (out.total) out.total.textContent = fmt(total) + ' SAR';
    if (out.roi) out.roi.textContent = fmt(roi) + '٪';
    if (out.payback) out.payback.textContent = fmt(paybackMonths) + ' شهر';
  }

  if (form) {
    form.addEventListener('input', calc);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      calc();
    });
    calc();
  }
})();
