const ExcelJS = require('exceljs');
new ExcelJS.Workbook().xlsx.readFile('/Users/yzydalshmry/Desktop/BRIGHTAI/reports/internal-links/ALL_ITEMS_MAIS_with_life_years.xlsx').then(function(w) {
  w.eachSheet(function(s) {
    console.log('SHEET:', s.name, 'rows:', s.rowCount, 'cols:', s.columnCount);
    var r = s.getRow(1);
    var hdrs = [];
    for (var i = 1; i <= Math.min(s.columnCount, 20); i++) {
      hdrs.push(r.getCell(i).text || '');
    }
    console.log('HEADERS:', hdrs.join(' | '));
    if (s.rowCount >= 2) {
      var r2 = s.getRow(2);
      var vals = [];
      for (var i = 1; i <= Math.min(s.columnCount, 20); i++) {
        var v = r2.getCell(i).value;
        vals.push(String(v == null ? '' : typeof v === 'object' ? (v.text || v.result || JSON.stringify(v)) : v).substring(0, 30));
      }
      console.log('ROW2:', vals.join(' | '));
    }
    if (s.rowCount > 2) {
      var lr = s.getRow(s.rowCount);
      var lv = [];
      for (var i = 1; i <= Math.min(s.columnCount, 8); i++) {
        var v = lr.getCell(i).value;
        lv.push(String(v == null ? '' : typeof v === 'object' ? (v.text || v.result || JSON.stringify(v)) : v).substring(0, 30));
      }
      console.log('LAST:', lv.join(' | '));
    }
    console.log('---');
  });
  process.exit(0);
}).catch(function(e) { console.error(e.message); process.exit(1); });
