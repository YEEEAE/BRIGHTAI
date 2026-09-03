/**
 * public/js/ai-governance-controls.js — client-side filtering + CSV export for
 * the Saudi AI Governance Control Matrix (/tools/ai-governance-controls/).
 *
 * Progressive enhancement: the matrix renders and prints fully without JS.
 * This module only wires the filter chips and builds the CSV locally in the
 * browser (Blob + object URL + a[download]). No network calls, nothing leaves
 * the device, CSP-safe (external module, no inline handlers).
 */
(function () {
  'use strict';

  var TOTAL = 13;

  // ---- Filtering (lightweight chips) ----
  var filters = document.getElementById('govmx-filters');
  var count = document.getElementById('govmx-count');
  var table = document.getElementById('govmx-table');

  function visibleCount() {
    if (!table) return TOTAL;
    var rows = table.querySelectorAll('tbody tr');
    var n = 0;
    for (var i = 0; i < rows.length; i += 1) {
      if (!rows[i].hidden) n += 1;
    }
    return n;
  }

  function updateCount() {
    if (!count) return;
    var n = visibleCount();
    count.textContent =
      n === TOTAL
        ? 'تُعرض الآن 13 من 13 مجالًا.'
        : 'تُعرض الآن ' + n + ' من 13 مجالًا.';
  }

  if (filters && table) {
    var chips = filters.querySelectorAll('[data-filter]');
    for (var i = 0; i < chips.length; i += 1) {
      chips[i].addEventListener('click', function () {
        var key = this.getAttribute('data-filter');
        for (var j = 0; j < chips.length; j += 1) {
          chips[j].setAttribute(
            'aria-pressed',
            chips[j] === this ? 'true' : 'false'
          );
        }
        var rows = table.querySelectorAll('tbody tr');
        for (var k = 0; k < rows.length; k += 1) {
          rows[k].hidden =
            key !== 'all' && rows[k].getAttribute('data-group') !== key;
        }
        updateCount();
      });
    }
  }

  // ---- CSV export (safe local download) ----
  var dataEl = document.getElementById('govmx-data');
  var columnsEl = document.getElementById('govmx-columns');
  var exportBar = document.getElementById('govmx-export');
  if (!dataEl || !exportBar) return;

  var data;
  try {
    data = JSON.parse(dataEl.textContent || '{}');
  } catch (err) {
    return;
  }
  if (!data || !Array.isArray(data.records) || !data.records.length) return;

  var columns = [];
  try {
    columns = JSON.parse(columnsEl ? columnsEl.textContent || '[]' : '[]');
  } catch (err) {
    columns = [];
  }

  var KEYS = [
    'group',
    'area',
    'objective',
    'risk',
    'control',
    'owner',
    'evidence',
    'capability',
    'reference',
  ];

  function cell(value) {
    var s = value == null ? '' : String(value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function buildCsv() {
    var lines = [];
    if (columns.length) {
      lines.push(
        columns
          .map(function (c) {
            return cell(c);
          })
          .join(',')
      );
    }
    data.records.forEach(function (record) {
      lines.push(
        KEYS.map(function (k) {
          return cell(record[k]);
        }).join(',')
      );
    });
    // Note row keeps the implementation-matrix boundary inside the file.
    if (data.note) lines.push(cell(data.note));
    // BOM keeps Arabic readable when Excel opens the UTF-8 file.
    return '\uFEFF' + lines.join('\r\n');
  }

  var csvBtn = document.getElementById('govmx-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', function () {
      var blob = new Blob([buildCsv()], {
        type: 'text/csv;charset=utf-8',
      });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = url;
      link.download = 'brightai-ai-governance-controls.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    });
  }

  exportBar.hidden = false;
})();
