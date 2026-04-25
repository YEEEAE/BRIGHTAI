const GEMINI_MODEL = "gemini-2.5-flash";

        class DataAnalyzerPage {
            constructor() {
                this.analyzer = new DataAnalyzer();
                this.currentAnalysis = null;
                this.init();
            }

            init() {
                const fileInput = document.getElementById('file-input');
                const uploadArea = document.getElementById('upload-area');
                const sampleBtn = document.getElementById('sample-data-btn');
                const exportBtn = document.querySelector('[data-action="export"]');
                const askInput = document.getElementById('ask-input');
                const askBtn = document.getElementById('ask-btn');

                fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));

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

                sampleBtn?.addEventListener('click', () => this.loadSampleData());
                exportBtn?.addEventListener('click', () => this.exportReport());

                askBtn?.addEventListener('click', () => this.askQuestion(askInput.value));
                askInput?.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.askQuestion(askInput.value);
                });
            }

            loadSampleData() {
                const headers = ['المنتج', 'الفئة', 'المبيعات', 'الكمية', 'المنطقة'];
                const data = [
                    ['لابتوب برو', 'إلكترونيات', '15000', '25', 'الرياض'],
                    ['هاتف ذكي', 'إلكترونيات', '8500', '45', 'جدة'],
                    ['سماعات', 'إكسسوارات', '1200', '120', 'الدمام'],
                    ['شاشة 4K', 'إلكترونيات', '4500', '18', 'الرياض'],
                    ['كيبورد', 'إكسسوارات', '800', '65', 'جدة'],
                    ['ماوس', 'إكسسوارات', '350', '90', 'الرياض'],
                    ['تابلت', 'إلكترونيات', '6200', '30', 'مكة'],
                    ['ساعة ذكية', 'إلكترونيات', '2800', '55', 'الرياض'],
                    ['شاحن', 'إكسسوارات', '150', '200', 'جدة'],
                    ['كاميرا', 'إلكترونيات', '950', '40', 'الدمام'],
                ];

                this.showLoading();
                setTimeout(() => {
                    this.currentAnalysis = this.analyzer.analyzeData(data, headers);
                    this.showDashboard('sample-data.csv');
                }, 2000);
            }

            async handleFile(file) {
                if (!file) return;
                this.showLoading();

                try {
                    const ext = file.name.split('.').pop().toLowerCase();
                    let result;

                    if (ext === 'csv') {
                        result = await new Promise((resolve, reject) => {
                            Papa.parse(file, {
                                complete: (r) => resolve({ headers: r.data[0], data: r.data.slice(1).filter(row => row.some(c => c)) }),
                                error: reject
                            });
                        });
                    } else {
                        result = await new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const wb = XLSX.read(e.target.result, { type: 'binary' });
                                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                                resolve({ headers: json[0], data: json.slice(1).filter(row => row.some(c => c)) });
                            };
                            reader.onerror = reject;
                            reader.readAsBinaryString(file);
                        });
                    }

                    this.currentAnalysis = this.analyzer.analyzeData(result.data, result.headers);
                    setTimeout(() => this.showDashboard(file.name), 1500);

                } catch (error) {
                    console.error(error);
                    alert('حدث خطأ في معالجة الملف');
                    location.reload();
                }
            }

            showLoading() {
                document.getElementById('upload-section').classList.add('hidden');
                document.getElementById('loading-overlay').classList.remove('hidden');
                this.animateLoading();
            }

            animateLoading() {
                const bar = document.getElementById('loading-bar');
                const status = document.getElementById('loading-status');
                const stages = [
                    { w: '25%', t: 'قراءة البيانات...' },
                    { w: '50%', t: 'تحليل الأعمدة...' },
                    { w: '75%', t: 'رسم المخططات...' },
                    { w: '100%', t: 'توليد الرؤى...' }
                ];
                stages.forEach((s, i) => {
                    setTimeout(() => {
                        bar.style.width = s.w;
                        status.textContent = s.t;
                    }, i * 400);
                });
            }

            showDashboard(filename) {
                document.getElementById('loading-overlay').classList.add('hidden');
                document.getElementById('dashboard-section').classList.remove('hidden');

                const a = this.currentAnalysis;
                document.getElementById('file-name-display').textContent = filename;
                document.getElementById('total-rows').textContent = a.totalRows.toLocaleString('ar-SA');
                document.getElementById('total-columns').textContent = a.totalColumns;
                document.getElementById('ai-quality-score').textContent = a.qualityScore + '%';

                this.analyzer.renderCharts(a);
                this.getAIInsights();
            }

            async getAIInsights() {
                const container = document.getElementById('ai-insights-list');
                container.innerHTML = '<li class="text-gray-500">جاري توليد الرؤى...</li>';

                const a = this.currentAnalysis;
                const prompt = `كمحلل بيانات، قدم 4 رؤى مختصرة لهذه البيانات:
                - سجلات: ${a.totalRows}, أعمدة: ${a.totalColumns}, جودة: ${a.qualityScore}%
                - أعمدة رقمية: ${a.numericColumns.map(c => c.name).join(', ')}
                - أعمدة نصية: ${a.categoricalColumns.map(c => c.name).join(', ')}
                اكتب بالعربية مع إيموجي.`;

                try {
                    const response = await fetch('/api/ai/openai-chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: prompt }],
                            model: GEMINI_MODEL,
                            temperature: 0.7,
                            max_tokens: 400
                        })
                    });

                    const data = await response.json();
                    const text = data.choices?.[0]?.message?.content || '';
                    const insights = text.split('\n').filter(l => l.trim());

                    container.innerHTML = insights.map(i => `
                        <li class="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <i class="fa-solid fa-lightbulb text-yellow-400 mt-1"></i>
                            <span>${i}</span>
                        </li>
                    `).join('');

                } catch (e) {
                    container.innerHTML = `
                        <li class="flex gap-3 bg-white/5 p-4 rounded-xl">
                            <i class="fa-solid fa-chart-pie text-purple-400"></i>
                            <span>تم تحليل ${a.totalRows} سجل بنسبة جودة ${a.qualityScore}%</span>
                        </li>
                    `;
                }
            }

            async askQuestion(question) {
                if (!question?.trim()) return;

                const container = document.getElementById('ai-insights-list');
                const input = document.getElementById('ask-input');

                container.innerHTML += `
                    <li class="flex gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        <i class="fa-solid fa-user text-blue-400"></i>
                        <span>${question}</span>
                    </li>
                `;
                input.value = '';

                const a = this.currentAnalysis;
                const prompt = `السؤال: ${question}
                سياق البيانات: ${a.totalRows} سجل, ${a.totalColumns} عمود, جودة ${a.qualityScore}%
                أجب بإختصار بالعربية.`;

                try {
                    const response = await fetch('/api/ai/openai-chat', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: prompt }],
                            model: GEMINI_MODEL,
                            temperature: 0.7,
                            max_tokens: 300
                        })
                    });

                    const data = await response.json();
                    const answer = data.choices?.[0]?.message?.content || 'تعذر الإجابة';

                    container.innerHTML += `
                        <li class="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <i class="fa-solid fa-robot text-purple-400"></i>
                            <span>${answer}</span>
                        </li>
                    `;
                    container.parentElement.scrollTop = container.parentElement.scrollHeight;

                } catch (e) {
                    container.innerHTML += `
                        <li class="flex gap-3 bg-red-500/10 p-4 rounded-xl">
                            <i class="fa-solid fa-exclamation-circle text-red-400"></i>
                            <span>حدث خطأ في الإجابة</span>
                        </li>
                    `;
                }
            }

            exportReport() {
                if (this.currentAnalysis) {
                    this.analyzer.exportReport(this.currentAnalysis, document.getElementById('file-name-display').textContent);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => new DataAnalyzerPage());
