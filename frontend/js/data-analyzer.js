/**
 * Bright AI - Data Analyzer Module
 * تحليل ذكي للبيانات مع Chart.js
 */

class DataAnalyzer {
    constructor() {
        this.rawData = [];
        this.headers = [];
        this.charts = [];
        this.insights = [];
    }

    /**
     * تحليل البيانات المُحملة
     */
    analyzeData(data, headers) {
        this.rawData = data;
        this.headers = headers;

        const analysis = {
            totalRows: data.length,
            totalColumns: headers.length,
            qualityScore: this.calculateQuality(data),
            numericColumns: [],
            categoricalColumns: [],
            insights: []
        };

        // تصنيف الأعمدة
        headers.forEach((header, idx) => {
            const columnData = data.map(row => row[idx]);
            const isNumeric = this.isNumericColumn(columnData);

            if (isNumeric) {
                const stats = this.calculateStats(columnData);
                analysis.numericColumns.push({ name: header, index: idx, stats });
            } else {
                const freq = this.calculateFrequency(columnData);
                analysis.categoricalColumns.push({ name: header, index: idx, frequency: freq });
            }
        });

        // توليد الرؤى
        analysis.insights = this.generateInsights(analysis);
        this.insights = analysis.insights;

        return analysis;
    }

    /**
     * حساب جودة البيانات
     */
    calculateQuality(data) {
        if (!data.length) return 0;
        let totalCells = 0;
        let filledCells = 0;

        data.forEach(row => {
            row.forEach(cell => {
                totalCells++;
                if (cell !== null && cell !== undefined && cell !== '') {
                    filledCells++;
                }
            });
        });

        return Math.round((filledCells / totalCells) * 100);
    }

    /**
     * التحقق من كون العمود رقمي
     */
    isNumericColumn(columnData) {
        const validValues = columnData.filter(v => v !== null && v !== '');
        if (validValues.length === 0) return false;

        const numericCount = validValues.filter(v => !isNaN(parseFloat(v))).length;
        return (numericCount / validValues.length) > 0.8;
    }

    /**
     * حساب الإحصائيات للأعمدة الرقمية
     */
    calculateStats(columnData) {
        const numbers = columnData
            .map(v => parseFloat(v))
            .filter(v => !isNaN(v));

        if (!numbers.length) return null;

        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        const sorted = [...numbers].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
        const stdDev = Math.sqrt(variance);

        return { sum, mean, median, min, max, stdDev, count: numbers.length };
    }

    /**
     * حساب التكرارات للأعمدة النصية
     */
    calculateFrequency(columnData) {
        const freq = {};
        columnData.forEach(value => {
            const key = String(value).trim() || '(فارغ)';
            freq[key] = (freq[key] || 0) + 1;
        });

        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    /**
     * توليد رؤى ذكية
     */
    generateInsights(analysis) {
        const insights = [];

        // رؤية عن حجم البيانات
        insights.push({
            type: 'info',
            icon: 'fa-database',
            text: `تم تحليل ${analysis.totalRows.toLocaleString('ar-SA')} سجل مع ${analysis.totalColumns} عمود بنجاح.`
        });

        // رؤية عن الجودة
        if (analysis.qualityScore >= 90) {
            insights.push({
                type: 'success',
                icon: 'fa-check-circle',
                text: `جودة البيانات ممتازة (${analysis.qualityScore}%)! البيانات جاهزة للتحليل المتقدم.`
            });
        } else if (analysis.qualityScore >= 70) {
            insights.push({
                type: 'warning',
                icon: 'fa-exclamation-triangle',
                text: `جودة البيانات متوسطة (${analysis.qualityScore}%). يُنصح بمراجعة القيم الفارغة.`
            });
        } else {
            insights.push({
                type: 'error',
                icon: 'fa-times-circle',
                text: `جودة البيانات منخفضة (${analysis.qualityScore}%). يوجد الكثير من القيم المفقودة.`
            });
        }

        // رؤى للأعمدة الرقمية
        analysis.numericColumns.forEach(col => {
            if (col.stats) {
                const { mean, max, min, stdDev } = col.stats;
                const cv = (stdDev / mean) * 100;

                if (cv > 50) {
                    insights.push({
                        type: 'warning',
                        icon: 'fa-chart-line',
                        text: `العمود "${col.name}" يحتوي على تباين عالٍ (${cv.toFixed(1)}%)، مما يشير لوجود قيم متطرفة.`
                    });
                }

                insights.push({
                    type: 'stats',
                    icon: 'fa-calculator',
                    text: `"${col.name}": المتوسط ${mean.toFixed(2)}، الحد الأقصى ${max.toLocaleString('ar-SA')}، الحد الأدنى ${min.toLocaleString('ar-SA')}`
                });
            }
        });

        // رؤى للأعمدة النصية
        analysis.categoricalColumns.slice(0, 3).forEach(col => {
            if (col.frequency.length > 0) {
                const topValue = col.frequency[0];
                const percentage = ((topValue[1] / analysis.totalRows) * 100).toFixed(1);
                insights.push({
                    type: 'info',
                    icon: 'fa-tags',
                    text: `"${col.name}": القيمة الأكثر تكراراً هي "${topValue[0]}" بنسبة ${percentage}%`
                });
            }
        });

        return insights;
    }

    /**
     * رسم المخططات البيانية
     */
    renderCharts(analysis) {
        this.destroyCharts();

        // Chart 1: توزيع القيم لأول عمود رقمي
        if (analysis.numericColumns.length > 0) {
            this.renderBarChart('chart-1', analysis.numericColumns[0], analysis);
        }

        // Chart 2: مخطط دائري لأول عمود نصي
        if (analysis.categoricalColumns.length > 0) {
            this.renderPieChart('chart-2', analysis.categoricalColumns[0]);
        }
    }

    renderBarChart(canvasId, column, analysis) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const data = this.rawData.map(row => parseFloat(row[column.index])).filter(v => !isNaN(v));
        const labels = data.slice(0, 20).map((_, i) => `#${i + 1}`);
        const values = data.slice(0, 20);

        const chart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: column.name,
                    data: values,
                    backgroundColor: 'rgba(139, 92, 246, 0.6)',
                    borderColor: 'rgba(139, 92, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: '#fff', font: { family: 'Cairo' } } },
                    title: { display: true, text: `توزيع ${column.name}`, color: '#fff', font: { size: 16, family: 'Cairo' } }
                },
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
        this.charts.push(chart);
    }

    renderPieChart(canvasId, column) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const labels = column.frequency.slice(0, 6).map(f => f[0]);
        const values = column.frequency.slice(0, 6).map(f => f[1]);
        const colors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

        const chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors,
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#fff', font: { family: 'Cairo' }, padding: 15 } },
                    title: { display: true, text: `توزيع ${column.name}`, color: '#fff', font: { size: 16, family: 'Cairo' } }
                }
            }
        });
        this.charts.push(chart);
    }

    destroyCharts() {
        this.charts.forEach(chart => chart.destroy());
        this.charts = [];
    }

    /**
     * تصدير التقرير كـ JSON
     */
    exportReport(analysis, filename) {
        const report = {
            generatedAt: new Date().toISOString(),
            filename,
            summary: {
                totalRows: analysis.totalRows,
                totalColumns: analysis.totalColumns,
                qualityScore: analysis.qualityScore
            },
            columns: {
                numeric: analysis.numericColumns,
                categorical: analysis.categoricalColumns
            },
            insights: analysis.insights
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `brightai-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// تصدير للاستخدام العام
window.DataAnalyzer = DataAnalyzer;
