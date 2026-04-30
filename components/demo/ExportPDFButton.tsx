"use client";

import type { OcrResult } from "@/lib/demo/ocr";

export function ExportPDFButton({ result }: { result: OcrResult | null }) {
  function handleExport() {
    if (!result) return;
    const rows = result.extractedFields
      .map((field) => `<tr><td>${field.label}</td><td>${field.value}</td><td>${Math.round(field.confidence * 100)}%</td></tr>`)
      .join("");
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
    if (!printWindow) return;
    printWindow.document.write(`<!doctype html>
      <html lang="ar-SA" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <title>تقرير أتمتة الوثائق</title>
          <style>
            body{font-family:Arial,sans-serif;padding:32px;line-height:1.8;color:#0A2540}
            table{width:100%;border-collapse:collapse;margin-top:24px}
            th,td{border:1px solid #d7dee8;padding:10px;text-align:start}
            h1{margin:0 0 8px}
            .muted{color:#53657a}
          </style>
        </head>
        <body>
          <h1>تقرير أتمتة الوثائق من Bright AI</h1>
          <p class="muted">${result.summary}</p>
          <table>
            <thead><tr><th>الحقل</th><th>القيمة</th><th>الثقة</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <button className="demo-button demo-button--secondary focus-ring" type="button" onClick={handleExport} disabled={!result}>
      تحميل التقرير PDF
    </button>
  );
}
