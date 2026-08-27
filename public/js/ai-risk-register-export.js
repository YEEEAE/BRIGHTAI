/**
 * public/js/ai-risk-register-export.js — client-side CSV/JSON export for the
 * AI risk register template (PHASE 2.5 linkable-asset upgrade, 2026-08-24).
 *
 * Progressive enhancement: the page renders and prints fully without JS.
 * This module only unhides the export bar and builds the files locally in the
 * browser (Blob + object URL + a[download]). No network calls, nothing leaves
 * the device, CSP-safe (external module, no inline handlers).
 */
(function () {
  'use strict';

  var dataEl = document.getElementById('risk-register-data');
  var exportBar = document.getElementById('risk-export');
  if (!dataEl || !exportBar) return;

  var data;
  try {
    data = JSON.parse(dataEl.textContent || '{}');
  } catch (err) {
    return;
  }
  if (!data || !Array.isArray(data.fields) || !Array.isArray(data.records)) return;

  function cell(value) {
    var s = value == null ? '' : String(value);
    return '"' + s.replace(/"/g, '""') + '"';
  }

  function buildCsv() {
    var lines = [];
    lines.push(
      data.fields
        .map(function (f) {
          return cell(f.label);
        })
        .join(',')
    );
    data.records.forEach(function (record) {
      lines.push(
        data.fields
          .map(function (f) {
            return cell(record[f.key]);
          })
          .join(',')
      );
    });
    // Five ready-to-fill empty rows so the file opens as a working register.
    for (var i = 0; i < 5; i += 1) {
      lines.push(
        data.fields
          .map(function () {
            return '""';
          })
          .join(',')
      );
    }
    // BOM keeps Arabic readable when Excel opens the UTF-8 file.
    return '\uFEFF' + lines.join('\r\n');
  }

  function buildJson() {
    return JSON.stringify(
      {
        template: 'BrightAI AI Risk Register',
        url: 'https://brightai.live/tools/ai-risk-register/',
        note: data.note || '',
        exportedAt: new Date().toISOString().slice(0, 10),
        fields: data.fields,
        records: data.records,
      },
      null,
      2
    );
  }

  function download(kind) {
    var isCsv = kind === 'csv';
    var blob = new Blob([isCsv ? buildCsv() : buildJson()], {
      type: isCsv ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
    });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'brightai-ai-risk-register.' + kind;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  var csvBtn = document.getElementById('risk-export-csv');
  var jsonBtn = document.getElementById('risk-export-json');
  if (csvBtn) {
    csvBtn.addEventListener('click', function () {
      download('csv');
    });
  }
  if (jsonBtn) {
    jsonBtn.addEventListener('click', function () {
      download('json');
    });
  }

  exportBar.hidden = false;
})();
