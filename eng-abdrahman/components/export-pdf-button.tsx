"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export function ExportPDFButton({ targetId = "dashboard-main" }: { targetId?: string }) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        const target = document.getElementById(targetId);
        if (!target) {
            alert("عذراً، لم يتم العثور على محتوى التقرير.");
            return;
        }

        setIsExporting(true);
        try {
            // Create an overlay to show exporting state
            const canvas = await html2canvas(target, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
                windowWidth: target.scrollWidth,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // BrightAI Header Style
            pdf.setFillColor(6, 78, 59); // emerald-900 (BrightAI brand)
            pdf.rect(0, 0, pdfWidth, 25, "F");

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(16);
            pdf.text("BrightAI - Executive Quality Report", 15, 16);

            pdf.setFontSize(10);
            const dateStr = new Date().toLocaleDateString("ar-SA");
            pdf.text(dateStr, pdfWidth - 30, 16);

            // Fit to 1 page if height is large, or slice it. Simple fit:
            const contentHeight = Math.min(pdfHeight, pdf.internal.pageSize.getHeight() - 35);

            pdf.addImage(imgData, "PNG", 0, 30, pdfWidth, contentHeight);

            pdf.save(`BrightAI_Quality_Report_${new Date().getTime()}.pdf`);

        } catch (error) {
            console.error("PDF Export failed:", error);
            alert("حدث خطأ أثناء تصدير التقرير بصيغة PDF.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-sm ${isExporting
                    ? "bg-slate-200 text-slate-500 cursor-wait"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md"
                }`}
        >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
            {isExporting ? "جاري تجهيز الملف..." : "تصدير التقرير (PDF)"}
        </button>
    );
}
