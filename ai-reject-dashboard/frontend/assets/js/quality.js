function renderPageSpecific() {
  var r = window.DEMO_DATA && window.DEMO_DATA.qualityRiskCases;
  var el1 = document.getElementById('quality-risk-cases');
  if (el1 && r && r.length) {
    el1.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>Item</th><th>Risk</th><th>Issue</th><th>GMP Impact</th><th>Docs Complete</th></tr></thead><tbody>' +
      r.map(function (x) {
        return '<tr><td>' + (x.item || '\u2014') + '</td><td>' +
          (x.risk ? '<span class="risk-badge ' + x.risk.toLowerCase() + '">' + x.risk + '</span>' : '\u2014') + '</td>' +
          '<td>' + (x.issue || '\u2014') + '</td>' +
          '<td>' + (x.gmp_impact || '\u2014') + '</td>' +
          '<td>' + (x.docs_complete ? '<span class="check">\u2713</span>' : '<span class="cross">\u2717</span>') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  } else if (el1) {
    el1.innerHTML = '<p class="text-muted">No quality risk cases identified.</p>';
  }

  var capa = window.DEMO_DATA && window.DEMO_DATA.capaStatus;
  var el2 = document.getElementById('capa-status-table');
  if (el2 && capa && capa.length) {
    el2.innerHTML = '<div class="table-wrap"><table><thead><tr>' +
      '<th>CAPA ID</th><th>Title</th><th>Status</th><th>Owner</th><th>Target Date</th><th>Priority</th></tr></thead><tbody>' +
      capa.map(function (x) {
        var st = (x.status || '').toLowerCase().replace(/\s+/g, '-');
        return '<tr><td>' + (x.capa_id || '\u2014') + '</td><td>' + (x.title || '\u2014') + '</td>' +
          '<td><span class="status-tag ' + st + '">' + (x.status || '\u2014') + '</span></td>' +
          '<td>' + (x.owner || '\u2014') + '</td>' +
          '<td>' + (x.target_date || '\u2014') + '</td>' +
          '<td>' + (x.priority ? '<span class="risk-badge ' + x.priority.toLowerCase() + '">' + x.priority + '</span>' : '\u2014') + '</td></tr>';
      }).join('') +
      '</tbody></table></div>';
  } else if (el2) {
    el2.innerHTML = '<p class="text-muted">No CAPA records available.</p>';
  }
}
