        const setActive = (id, active) => {
            const element = document.getElementById(id);
            if (element) element.classList.toggle('active', active);
        };
        const setText = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        // Tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                setActive('panel-' + tab.dataset.tab, true);
            });
        });

        // Upload
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');

        uploadArea?.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('highlight'); });
        uploadArea?.addEventListener('dragleave', () => uploadArea.classList.remove('highlight'));
        uploadArea?.addEventListener('drop', e => { e.preventDefault(); uploadArea.classList.remove('highlight'); handleFile(e.dataTransfer?.files?.[0]); });
        fileInput?.addEventListener('change', e => handleFile(e.target.files?.[0]));

        async function handleFile(file) {
            if (!file) return;

            setActive('loading', true);

            try {
                const ext = file.name.split('.').pop().toLowerCase();
                let data, headers;

                if (ext === 'csv') {
                    const result = await new Promise((res, rej) => Papa.parse(file, { complete: r => res(r), error: rej }));
                    headers = result.data[0];
                    data = result.data.slice(1).filter(r => r.some(c => c));
                } else {
                    const buffer = await file.arrayBuffer();
                    const wb = XLSX.read(buffer, { type: 'array' });
                    const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                    headers = json[0];
                    data = json.slice(1).filter(r => r.some(c => c));
                }

                setTimeout(() => {
                    analyzeData(headers, data);
                    setActive('loading', false);
                }, 1500);

            } catch (e) {
                console.error(e);
                alert('خطأ في قراءة الملف');
                setActive('loading', false);
            }
        }

        function analyzeData(headers, data) {
            const totalCells = data.length * headers.length;
            let missing = 0, colStats = [];

            headers.forEach((h, i) => {
                const vals = data.map(r => r[i]);
                const miss = vals.filter(v => v === null || v === undefined || v === '').length;
                const filled = vals.filter(v => v !== null && v !== undefined && v !== '');
                const unique = new Set(filled.map(String)).size;
                missing += miss;

                colStats.push({ name: h, total: vals.length, missing: miss, filled: filled.length, unique, completeness: ((filled.length / vals.length) * 100).toFixed(1) });
            });

            const rows = data.map(r => JSON.stringify(r));
            const dups = rows.length - new Set(rows).size;
            const score = Math.round(((totalCells - missing) / totalCells) * 100);

            // Update UI
            setText('r-rows', data.length.toLocaleString('ar-SA'));
            setText('r-cols', headers.length);
            setText('r-missing', missing.toLocaleString('ar-SA'));
            setText('r-dups', dups);
            setText('r-score', score + '%');

            const meter = document.getElementById('r-meter');
            if (meter) {
                meter.style.width = score + '%';
                meter.className = 'meter-fill ' + (score >= 90 ? 'meter-excellent' : score >= 70 ? 'meter-good' : 'meter-poor');
            }

            const msg = score >= 90 ? '✅ جودة ممتازة! البيانات جاهزة للتحليل المتقدم.' : score >= 70 ? '⚠️ جودة متوسطة. يُنصح بمراجعة القيم المفقودة.' : '❌ جودة منخفضة. يوجد الكثير من البيانات المفقودة.';
            setText('r-msg', msg);

            // Alerts
            const alertsDiv = document.getElementById('alerts-container');
            if (alertsDiv) {
                alertsDiv.innerHTML = '';
                if (missing > 0) alertsDiv.innerHTML += `<div class="alert alert-warning"><i class="fa-solid fa-triangle-exclamation"></i><div><strong style="color: var(--amber);">قيم مفقودة</strong><br><span style="color: #9ca3af;">يوجد ${missing} قيمة مفقودة تحتاج مراجعة.</span></div></div>`;
                if (dups > 0) alertsDiv.innerHTML += `<div class="alert alert-danger"><i class="fa-solid fa-clone"></i><div><strong style="color: var(--red);">سجلات مكررة</strong><br><span style="color: #9ca3af;">تم اكتشاف ${dups} سجل مكرر.</span></div></div>`;
                if (score >= 90) alertsDiv.innerHTML += `<div class="alert alert-success"><i class="fa-solid fa-circle-check"></i><div><strong style="color: var(--emerald);">جودة عالية</strong><br><span style="color: #9ca3af;">البيانات تتوافق مع معايير الجودة.</span></div></div>`;
            }

            // Table
            const tbody = document.getElementById('cols-table');
            if (tbody) tbody.innerHTML = colStats.map(c => {
                const scoreClass = c.completeness >= 90 ? 'dq-score-high' : c.completeness >= 70 ? 'dq-score-medium' : 'dq-score-low';
                const icon = c.completeness >= 90 ? '✅' : c.completeness >= 70 ? '⚠️' : '❌';
                return `<tr><td>${c.name}</td><td><span class="${scoreClass}">${c.completeness}%</span></td><td>${c.unique}</td><td>${c.missing}</td><td>${icon}</td></tr>`;
            }).join('');

            // Show results
            setActive('results', true);

            // AI Insights
            getAIInsights({ score, missing, dups, rows: data.length, cols: headers.length, colStats });

            // Export
            const exportBtn = document.getElementById('export-btn');
            if (exportBtn) exportBtn.onclick = () => {
                const report = { generated: new Date().toISOString(), score, missing, dups, rows: data.length, cols: headers.length, columns: colStats };
                const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `quality-report-${Date.now()}.json`;
                a.click();
            };
        }

        async function getAIInsights(analysis) {
            const container = document.getElementById('ai-insights');
            if (!container) return;
            container.innerHTML = 'جاري توليد توصيات الذكاء الاصطناعي...';
            const prompt = `كمحلل جودة للشركات، قدم 4 رؤى مختصرة لتقرير الجودة هذا:
- السجلات: ${analysis.rows}، الأعمدة: ${analysis.cols}
- نسبة الجودة: ${analysis.score}%
- القيم المفقودة: ${analysis.missing}
- السجلات المكررة: ${analysis.dups}
قدم توصيات عملية لتحسين جودة البيانات. اكتب بالعربية مع إيموجي.`;

            try {
                const gemini = window.BrightAIGemini;
                if (!gemini) throw new Error('Gemini client is not loaded');

                const response = await gemini.generateText(prompt, {
                    temperature: 0.7,
                    maxOutputTokens: 500
                });

                container.innerHTML = escapeHtml(response.text).replace(/\n/g, '<br>');
            } catch (e) {
                const message = window.BrightAIGemini?.getErrorMessage(e) || 'تعذر توليد توصيات الذكاء الاصطناعي.';
                container.innerHTML = `
                    <div style="color: var(--red); margin-bottom: 12px;">${escapeHtml(message)}</div>
                    <button type="button" id="retry-quality-insights" class="btn-secondary">
                        <i class="fa-solid fa-rotate-right"></i> إعادة المحاولة
                    </button>
                `;
                document.getElementById('retry-quality-insights')?.addEventListener('click', () => getAIInsights(analysis), { once: true });
            }
        }

        function escapeHtml(value) {
            return String(value).replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[char]));
        }
