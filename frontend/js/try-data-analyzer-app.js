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
                    const gemini = window.BrightAIGemini;
                    if (!gemini) throw new Error('Gemini client is not loaded');

                    const response = await gemini.generateText(prompt, {
                        temperature: 0.7,
                        maxOutputTokens: 400
                    });

                    const text = response.text;
                    const insights = text.split('\n').filter(l => l.trim());

                    container.innerHTML = insights.map(i => `
                        <li class="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <i class="fa-solid fa-lightbulb text-yellow-400 mt-1"></i>
                            <span>${escapeHtml(i)}</span>
                        </li>
                    `).join('');

                } catch (e) {
                    container.innerHTML = `
                        <li class="flex gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            <i class="fa-solid fa-exclamation-circle text-red-400 mt-1"></i>
                            <span>${escapeHtml(window.BrightAIGemini?.getErrorMessage(e) || 'تعذر توليد الرؤى.')}</span>
                        </li>
                        <li>
                            <button type="button" id="retry-insights-btn" class="px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15">
                                <i class="fa-solid fa-rotate-right ml-2"></i> إعادة المحاولة
                            </button>
                        </li>
                    `;
                    document.getElementById('retry-insights-btn')?.addEventListener('click', () => this.getAIInsights(), { once: true });
                }
            }

            async askQuestion(question) {
                if (!question?.trim()) return;

                const container = document.getElementById('ai-insights-list');
                const input = document.getElementById('ask-input');
                const askBtn = document.getElementById('ask-btn');

                container.innerHTML += `
                    <li class="flex gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
                        <i class="fa-solid fa-user text-blue-400"></i>
                        <span>${escapeHtml(question)}</span>
                    </li>
                `;
                input.value = '';

                const a = this.currentAnalysis;
                const prompt = `السؤال: ${question}
                سياق البيانات: ${a.totalRows} سجل, ${a.totalColumns} عمود, جودة ${a.qualityScore}%
                أجب بإختصار بالعربية.`;

                try {
                    if (askBtn) {
                        askBtn.disabled = true;
                        askBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
                    }

                    const gemini = window.BrightAIGemini;
                    if (!gemini) throw new Error('Gemini client is not loaded');

                    const response = await gemini.generateText(prompt, {
                        temperature: 0.7,
                        maxOutputTokens: 300
                    });

                    const answer = response.text;

                    container.innerHTML += `
                        <li class="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                            <i class="fa-solid fa-robot text-purple-400"></i>
                            <span>${escapeHtml(answer)}</span>
                        </li>
                    `;
                    container.parentElement.scrollTop = container.parentElement.scrollHeight;

                } catch (e) {
                    const retryQuestion = escapeAttribute(question);
                    container.innerHTML += `
                        <li class="flex gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                            <i class="fa-solid fa-exclamation-circle text-red-400"></i>
                            <span>${escapeHtml(window.BrightAIGemini?.getErrorMessage(e) || 'حدث خطأ في الإجابة')}</span>
                        </li>
                        <li>
                            <button type="button" class="retry-question-btn px-4 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15" data-question="${retryQuestion}">
                                <i class="fa-solid fa-rotate-right ml-2"></i> إعادة المحاولة
                            </button>
                        </li>
                    `;
                    container.querySelector('.retry-question-btn:last-of-type')?.addEventListener('click', (event) => {
                        this.askQuestion(event.currentTarget.dataset.question);
                    }, { once: true });
                } finally {
                    if (askBtn) {
                        askBtn.disabled = false;
                        askBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
                    }
                }
            }

            exportReport() {
                if (this.currentAnalysis) {
                    this.analyzer.exportReport(this.currentAnalysis, document.getElementById('file-name-display').textContent);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', () => new DataAnalyzerPage());

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char]));
        }

        function escapeAttribute(value) {
            return escapeHtml(value).replace(/`/g, '&#096;');
        }
