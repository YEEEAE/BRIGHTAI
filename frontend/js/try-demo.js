/**
 * Bright AI - Try Page Demo Logic
 * Handles file uploads (CSV/Excel), client-side parsing, and "AI" analysis simulation.
 */

document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const dashboard = document.getElementById('dashboard-section');
    const uploadSection = document.getElementById('upload-section');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // Elements to populate
    const fileNameDisplay = document.getElementById('file-name-display');
    const rowCountEl = document.getElementById('total-rows');
    const colCountEl = document.getElementById('total-columns');
    const aiScoreEl = document.getElementById('ai-quality-score');
    const insightsList = document.getElementById('ai-insights-list');
    
    // Drag and Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadArea.classList.add('highlight');
    }

    function unhighlight(e) {
        uploadArea.classList.remove('highlight');
    }

    uploadArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            processFile(file);
        }
    }

    async function processFile(file) {
        // Show loading state
        showLoading();

        // Simulate "AI Uploading" delay
        await new Promise(r => setTimeout(r, 1500));

        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();

        if (fileExt === 'csv') {
            Papa.parse(file, {
                complete: function(results) {
                    analyzeData(results.data, fileName);
                },
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });
        } else if (['xlsx', 'xls'].includes(fileExt)) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                analyzeData(json, fileName);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('Unsupported file format. Please upload CSV or Excel.');
            hideLoading();
        }
    }

    function showLoading() {
        loadingOverlay.classList.remove('hidden');
        uploadSection.classList.add('blur-sm');
    }

    function hideLoading() {
        loadingOverlay.classList.add('hidden');
        uploadSection.classList.remove('blur-sm');
        uploadSection.style.display = 'none';
        dashboard.classList.remove('hidden');
        dashboard.classList.add('fade-in');
    }

    function analyzeData(data, fileName) {
        // Basic stats
        const rowCount = data.length;
        const columns = rowCount > 0 ? Object.keys(data[0]) : [];
        const colCount = columns.length;

        // "AI" Logic: Analyze columns
        const columnAnalysis = {};
        columns.forEach(col => {
            const values = data.map(row => row[col]).filter(v => v !== null && v !== undefined && v !== '');
            const isNumeric = values.every(v => !isNaN(Number(v)));
            
            if (isNumeric && values.length > 0) {
                const numValues = values.map(v => Number(v));
                const sum = numValues.reduce((a, b) => a + b, 0);
                const avg = sum / numValues.length;
                const min = Math.min(...numValues);
                const max = Math.max(...numValues);
                columnAnalysis[col] = { type: 'numeric', avg, min, max, values: numValues };
            } else {
                // Categorical
                const counts = {};
                values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
                const simplifiedCounts = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
                columnAnalysis[col] = { type: 'categorical', counts: simplifiedCounts };
            }
        });

        // Generate Insights
        const insights = [];
        
        // 1. Data Quality Insight
        const emptyCells = data.length * columns.length - data.reduce((acc, row) => acc + Object.values(row).filter(v => v).length, 0);
        const qualityScore = Math.max(0, 100 - Math.floor((emptyCells / (data.length * columns.length)) * 100));
        
        if (qualityScore > 90) {
            insights.push(`✨ <strong>جودة بيانات ممتازة:</strong> البيانات مكتملة بنسبة ${qualityScore}%، مما يسهل عملية التحليل الدقيق.`);
        } else if (qualityScore > 70) {
            insights.push(`ℹ️ <strong>جودة بيانات جيدة:</strong> هناك بعض القيم المفقودة (${100 - qualityScore}%)، لكنها لا تؤثر بشكل كبير على النتائج العامة.`);
        } else {
            insights.push(`⚠️ <strong>تنبيه جودة:</strong> البيانات تحتوي على نسبة عالية من القيم المفقودة، نقترح تنظيف البيانات للحصول على نتائج أدق.`);
        }

        // 2. Trend/Extremes Insight (for first numeric column)
        const numericCols = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'numeric');
        if (numericCols.length > 0) {
            const mainCol = numericCols[0];
            const stats = columnAnalysis[mainCol];
            insights.push(`📊 <strong>تحليل ${mainCol}:</strong> المتوسط هو ${stats.avg.toFixed(2)}، مع تباين بين ${stats.min} و ${stats.max}.`);
            
            // Artificial "Trend" detection
            if (stats.values[stats.values.length-1] > stats.values[0]) {
                 insights.push(`📈 <strong>اتجاه إيجابي:</strong> لوحظ نمو عام في قيم ${mainCol} عبر السجلات.`);
            }
        }

        // 3. Category Insight
        const catCols = Object.keys(columnAnalysis).filter(k => columnAnalysis[k].type === 'categorical');
        if (catCols.length > 0) {
            const mainCat = catCols[0];
            const topVal = columnAnalysis[mainCat].counts[0];
            if (topVal) {
                insights.push(`🏆 <strong>النمط السائد:</strong> في عمود ${mainCat}، القيمة "${topVal[0]}" هي الأكثر تكراراً (${topVal[1]} مرة).`);
            }
        }

        // Render Dashboard
        renderDashboard({
            fileName,
            rowCount,
            colCount,
            qualityScore,
            insights,
            columnAnalysis
        });
    }

    function renderDashboard(metrics) {
        // Update Text
        document.getElementById('file-name-display').innerText = metrics.fileName;
        document.getElementById('total-rows').innerText = metrics.rowCount.toLocaleString();
        document.getElementById('total-columns').innerText = metrics.colCount;
        document.getElementById('ai-quality-score').innerText = metrics.qualityScore + '%';

        // Update Insights
        insightsList.innerHTML = '';
        metrics.insights.forEach((insight, index) => {
            setTimeout(() => {
                const li = document.createElement('li');
                li.className = 'insight-item p-4 mb-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-start gap-3 opacity-0 transform translate-y-2';
                li.innerHTML = insight;
                insightsList.appendChild(li);
                // Trigger animation
                requestAnimationFrame(() => {
                    li.classList.remove('opacity-0', 'translate-y-2');
                });
            }, index * 800); // Staggered reveal
        });

        hideLoading();
        
        // Render Charts
        renderCharts(metrics.columnAnalysis);
    }

    function renderCharts(analysis) {
        // Chart 1: Distribution of first categorical
        const catCols = Object.keys(analysis).filter(k => analysis[k].type === 'categorical');
        const chart1Ctx = document.getElementById('chart-1').getContext('2d');
        
        if (catCols.length > 0) {
            const colName = catCols[0];
            const data = analysis[colName].counts;
            
            new Chart(chart1Ctx, {
                type: 'doughnut',
                data: {
                    labels: data.map(d => d[0]),
                    datasets: [{
                        data: data.map(d => d[1]),
                        backgroundColor: [
                            '#64FFDA', '#0A192F', '#8B5CF6', '#EC4899', '#6366F1'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: { position: 'right', labels: { color: '#fff' } },
                        title: { display: true, text: `توزيع: ${colName}`, color: '#fff' }
                    }
                }
            });
        } else {
             // Fallback if no categorical
             document.getElementById('chart-1').parentElement.innerHTML = '<p class="text-center text-gray-400">لا توجد بيانات فئوية لعرضها</p>';
        }

        // Chart 2: First Numeric Column
        const numCols = Object.keys(analysis).filter(k => analysis[k].type === 'numeric');
        const chart2Ctx = document.getElementById('chart-2').getContext('2d');

        if (numCols.length > 0) {
            const colName = numCols[0];
            const vals = analysis[colName].values.slice(0, 50); // Limit to 50 for performance
            
            new Chart(chart2Ctx, {
                type: 'line',
                data: {
                    labels: vals.map((_, i) => i + 1),
                    datasets: [{
                        label: colName,
                        data: vals,
                        borderColor: '#64FFDA',
                        backgroundColor: 'rgba(100, 255, 218, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: {
                        legend: { labels: { color: '#fff' } },
                        title: { display: true, text: `تحليل رقمي: ${colName} (أول 50 سجل)`, color: '#fff' }
                    }
                }
            });
        }
    }
});
