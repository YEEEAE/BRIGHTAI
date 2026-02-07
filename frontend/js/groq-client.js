/**
 * Groq Integration - Enhanced Frontend Implementation
 * تكامل Groq مع تحليل البيانات الفعلي
 */

// Groq API Key - يجب نقله لـ backend proxy في الإنتاج
const GROQ_API_KEY = 'GROQ_KEY_REDACTED';

class GroqStreamManager {
    constructor(config = {}) {
        this.apiKey = config.apiKey || GROQ_API_KEY;
        this.sessionHistory = [];
    }

    async streamResponse(prompt, context, onChunk, onComplete) {
        // وضع العرض التوضيحي
        if (this.apiKey === "YOUR_SECURE_KEY_OR_PROXY" || !this.apiKey) {
            await this.mockAnalysis(context, onChunk, onComplete);
            return;
        }

        // الاتصال الحقيقي بـ Groq API
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: `أنت محلل بيانات ذكي سعودي. قدم رؤى احترافية ومختصرة بناءً على البيانات المقدمة.`
                        },
                        { role: "user", content: prompt }
                    ],
                    model: "llama3-70b-8192",
                    stream: true,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop();

                for (const line of lines) {
                    const message = line.replace(/^data: /, "").trim();
                    if (message === "[DONE]") {
                        if (onComplete) onComplete();
                        return;
                    }
                    if (message) {
                        try {
                            const parsed = JSON.parse(message);
                            const content = parsed.choices[0].delta.content;
                            if (content) onChunk(content);
                        } catch (e) { /* تجاهل */ }
                    }
                }
            }
        } catch (error) {
            console.error("Groq Stream Error:", error);
            await this.mockAnalysis(context, onChunk, onComplete);
        }
    }

    async mockAnalysis(context, onChunk, onComplete) {
        const { analysis } = context || {};
        let insights = [];

        if (analysis) {
            insights.push(`📊 **ملخص التحليل**\nتم تحليل ${analysis.totalRows?.toLocaleString('ar-SA') || 0} سجل عبر ${analysis.totalColumns || 0} عمود.`);

            if (analysis.qualityScore >= 85) {
                insights.push(`✅ **جودة البيانات ممتازة**\nنسبة الاكتمال ${analysis.qualityScore}%. بياناتك جاهزة للتحليل.`);
            } else {
                insights.push(`⚠️ **تنبيه الجودة**\nنسبة الاكتمال ${analysis.qualityScore}%. راجع القيم الفارغة.`);
            }

            if (analysis.numericColumns?.length > 0) {
                const col = analysis.numericColumns[0];
                if (col.stats) {
                    insights.push(`📈 **تحليل "${col.name}"**\nالمتوسط: ${col.stats.mean?.toFixed(2)} | الأقصى: ${col.stats.max?.toLocaleString('ar-SA')}`);
                }
            }

            if (analysis.categoricalColumns?.length > 0) {
                const col = analysis.categoricalColumns[0];
                if (col.frequency?.length > 0) {
                    const top = col.frequency[0];
                    insights.push(`🏷️ **"${col.name}"**\nالأكثر شيوعاً: "${top[0]}" (${top[1]} مرة)`);
                }
            }

            insights.push(`💡 **توصية**\nركز على الأعمدة ذات التباين العالي لاكتشاف الفرص.`);
        } else {
            insights = [
                "📊 **تحليل أولي**\nجاري معالجة البيانات...",
                "✅ **اكتمل التحليل**\nالبيانات جاهزة للعرض.",
                "💡 **نصيحة**\nاستخدم الرسوم البيانية لاستكشاف الأنماط."
            ];
        }

        const fullText = insights.join("\n\n");
        for (const char of fullText) {
            await new Promise(r => setTimeout(r, 12));
            onChunk(char);
        }
        if (onComplete) onComplete();
    }
}

// مدير صفحة التجربة المحسّن
class TryPageManager {
    constructor() {
        this.analyzer = null;
        this.currentAnalysis = null;
        this.groq = new GroqStreamManager();
        this.init();
    }

    init() {
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        const exportBtn = document.querySelector('[data-action="export"]');
        const askInput = document.getElementById('ask-input');
        const askBtn = document.getElementById('ask-btn');
        const sampleBtn = document.getElementById('sample-data-btn');

        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));

        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('highlight');
            });
            uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('highlight'));
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('highlight');
                this.handleFile(e.dataTransfer.files[0]);
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportReport());
        }

        if (askInput && askBtn) {
            askBtn.addEventListener('click', () => this.askQuestion(askInput.value));
            askInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.askQuestion(askInput.value);
            });
        }

        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => this.loadSampleData());
        }

        if (window.DataAnalyzer) {
            this.analyzer = new DataAnalyzer();
        }
    }

    loadSampleData() {
        const sampleHeaders = ['المنتج', 'الفئة', 'المبيعات', 'الكمية', 'المنطقة', 'الشهر'];
        const sampleData = [
            ['لابتوب برو', 'إلكترونيات', '15000', '25', 'الرياض', 'يناير'],
            ['هاتف ذكي X', 'إلكترونيات', '8500', '45', 'جدة', 'يناير'],
            ['سماعات لاسلكية', 'إكسسوارات', '1200', '120', 'الدمام', 'يناير'],
            ['شاشة 4K', 'إلكترونيات', '4500', '18', 'الرياض', 'فبراير'],
            ['كيبورد ميكانيكي', 'إكسسوارات', '800', '65', 'جدة', 'فبراير'],
            ['ماوس احترافي', 'إكسسوارات', '350', '90', 'الرياض', 'فبراير'],
            ['تابلت برو', 'إلكترونيات', '6200', '30', 'مكة', 'مارس'],
            ['ساعة ذكية', 'إلكترونيات', '2800', '55', 'الرياض', 'مارس'],
            ['شاحن سريع', 'إكسسوارات', '150', '200', 'جدة', 'مارس'],
            ['كاميرا ويب HD', 'إلكترونيات', '950', '40', 'الدمام', 'أبريل'],
            ['حقيبة لابتوب', 'إكسسوارات', '280', '85', 'الرياض', 'أبريل'],
            ['هارد خارجي 2TB', 'تخزين', '550', '70', 'جدة', 'أبريل'],
            ['فلاشة 128GB', 'تخزين', '120', '150', 'مكة', 'مايو'],
            ['راوتر واي فاي 6', 'شبكات', '680', '35', 'الرياض', 'مايو'],
            ['كيبل HDMI', 'إكسسوارات', '45', '300', 'جدة', 'مايو'],
        ];

        document.getElementById('upload-section')?.classList.add('hidden');
        document.getElementById('loading-overlay')?.classList.remove('hidden');
        this.animateLoadingBar();

        setTimeout(() => {
            if (this.analyzer) {
                this.currentAnalysis = this.analyzer.analyzeData(sampleData, sampleHeaders);
                this.updateDashboard('sample-sales-data.csv', this.currentAnalysis);
                this.analyzer.renderCharts(this.currentAnalysis);
            }
            document.getElementById('loading-overlay')?.classList.add('hidden');
            document.getElementById('dashboard-section')?.classList.remove('hidden');
            this.streamInsights();
        }, 2500);
    }

    animateLoadingBar() {
        const bar = document.getElementById('loading-bar');
        const status = document.getElementById('loading-status');
        if (!bar) return;

        const stages = [
            { width: '20%', text: 'قراءة البيانات...' },
            { width: '45%', text: 'تحليل الأعمدة...' },
            { width: '70%', text: 'حساب الإحصائيات...' },
            { width: '90%', text: 'توليد الرؤى...' },
            { width: '100%', text: 'اكتمل التحليل!' }
        ];

        stages.forEach((stage, i) => {
            setTimeout(() => {
                bar.style.width = stage.width;
                if (status) status.textContent = stage.text;
            }, i * 500);
        });
    }

    async handleFile(file) {
        if (!file) return;

        const validTypes = ['.csv', '.xlsx', '.xls'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(ext)) {
            alert('يرجى رفع ملف CSV أو Excel فقط');
            return;
        }

        document.getElementById('upload-section')?.classList.add('hidden');
        document.getElementById('loading-overlay')?.classList.remove('hidden');
        this.animateLoadingBar();

        try {
            let data, headers;

            if (ext === '.csv') {
                const result = await this.parseCSV(file);
                headers = result.headers;
                data = result.data;
            } else {
                const result = await this.parseExcel(file);
                headers = result.headers;
                data = result.data;
            }

            if (this.analyzer) {
                this.currentAnalysis = this.analyzer.analyzeData(data, headers);
                this.updateDashboard(file.name, this.currentAnalysis);
                this.analyzer.renderCharts(this.currentAnalysis);
            }

            setTimeout(() => {
                document.getElementById('loading-overlay')?.classList.add('hidden');
                document.getElementById('dashboard-section')?.classList.remove('hidden');
                this.streamInsights();
            }, 1500);

        } catch (error) {
            console.error('Error processing file:', error);
            alert('حدث خطأ في معالجة الملف');
            document.getElementById('loading-overlay')?.classList.add('hidden');
            document.getElementById('upload-section')?.classList.remove('hidden');
        }
    }

    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                complete: (results) => {
                    const headers = results.data[0] || [];
                    const data = results.data.slice(1).filter(row => row.some(cell => cell));
                    resolve({ headers, data });
                },
                error: reject
            });
        });
    }

    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const workbook = XLSX.read(e.target.result, { type: 'binary' });
                    const sheet = workbook.Sheets[workbook.SheetNames[0]];
                    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    const headers = json[0] || [];
                    const data = json.slice(1).filter(row => row.some(cell => cell));
                    resolve({ headers, data });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsBinaryString(file);
        });
    }

    updateDashboard(filename, analysis) {
        document.getElementById('file-name-display').textContent = filename;
        document.getElementById('total-rows').textContent = analysis.totalRows.toLocaleString('ar-SA');
        document.getElementById('total-columns').textContent = analysis.totalColumns;
        document.getElementById('ai-quality-score').textContent = analysis.qualityScore + '%';
    }

    streamInsights() {
        const container = document.getElementById('ai-insights-list');
        if (!container) return;

        container.innerHTML = '';

        const li = document.createElement('li');
        li.className = "flex gap-3 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5";
        li.innerHTML = `
            <div class="flex-shrink-0 mt-1"><i class="fa-solid fa-wand-magic-sparkles text-purple-400"></i></div>
            <div class="content leading-relaxed text-base" style="direction: rtl;"></div>
        `;
        container.appendChild(li);

        const contentDiv = li.querySelector('.content');

        this.groq.streamResponse(
            'تحليل البيانات',
            { analysis: this.currentAnalysis },
            (token) => {
                const formatted = token === "\n" ? "<br/>" : token;
                contentDiv.innerHTML += formatted;
                container.parentElement.scrollTop = container.parentElement.scrollHeight;
            }
        );
    }

    askQuestion(question) {
        if (!question?.trim()) return;

        const container = document.getElementById('ai-insights-list');
        const input = document.getElementById('ask-input');

        const questionLi = document.createElement('li');
        questionLi.className = "flex gap-3 text-blue-300 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20";
        questionLi.innerHTML = `
            <div class="flex-shrink-0 mt-1"><i class="fa-solid fa-user text-blue-400"></i></div>
            <div class="leading-relaxed">${question}</div>
        `;
        container.appendChild(questionLi);

        const answerLi = document.createElement('li');
        answerLi.className = "flex gap-3 text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5";
        answerLi.innerHTML = `
            <div class="flex-shrink-0 mt-1"><i class="fa-solid fa-robot text-purple-400"></i></div>
            <div class="content leading-relaxed"></div>
        `;
        container.appendChild(answerLi);

        const contentDiv = answerLi.querySelector('.content');
        if (input) input.value = '';

        this.groq.streamResponse(
            `السؤال: ${question}`,
            { analysis: this.currentAnalysis, question },
            (token) => {
                contentDiv.innerHTML += token === "\n" ? "<br/>" : token;
                container.parentElement.scrollTop = container.parentElement.scrollHeight;
            }
        );
    }

    exportReport() {
        if (this.analyzer && this.currentAnalysis) {
            const filename = document.getElementById('file-name-display')?.textContent || 'data';
            this.analyzer.exportReport(this.currentAnalysis, filename);
        } else {
            alert('لا توجد بيانات للتصدير');
        }
    }
}

// التهيئة عند التحميل
document.addEventListener('DOMContentLoaded', () => {
    window.tryPageManager = new TryPageManager();
});
