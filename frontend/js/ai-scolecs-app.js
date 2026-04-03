/**
         * Bright Edu - Single Page Application Core
         * Uses Vanilla JS with a Class-based architecture
         */

        // --- Configuration ---
        const CONFIG = {
            GROQ_API_KEY: '', // As provided
            MODEL: 'llama-3.3-70b-versatile', // Best for Arabic generation
            API_URL: '/api/ai/openai-chat'
        };

        // --- API Service ---
        class GroqService {
            static async call(messages, temperature = 0.7, jsonMode = false) {
                try {
                    const headers = {
                        'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    };

                    const body = {
                        model: CONFIG.MODEL,
                        messages: messages,
                        temperature: temperature,
                        max_tokens: 4096,
                        top_p: 1,
                        stream: false
                    };

                    if (jsonMode) {
                        body.response_format = { type: "json_object" };
                    }

                    const response = await fetch(CONFIG.API_URL, {
                        method: 'POST',
                        headers: headers,
                        body: JSON.stringify(body)
                    });

                    if (!response.ok) {
                        const err = await response.json();
                        throw new Error(err.error?.message || 'API request failed');
                    }

                    const data = await response.json();
                    return data.choices[0].message.content;

                } catch (error) {
                    console.error('Groq API Error:', error);
                    // Fallback for demo if API fails (Optional, but good for UX)
                    throw error;
                }
            }
        }

        // --- Utils ---
        const Utils = {
            showToast: (message, type = 'info') => {
                const container = document.getElementById('toast-container');
                const toast = document.createElement('div');
                toast.className = `p-4 rounded-xl text-white shadow-lg flex items-center gap-3 transform transition-all duration-300 translate-y-[-20px] opacity-0 ${type === 'error' ? 'bg-red-600' :
                    type === 'success' ? 'bg-green-600' : 'bg-brand-600'
                    }`;
                toast.innerHTML = `
                    <span class="iconify text-xl" data-icon="${type === 'error' ? 'carbon:warning-filled' : 'carbon:checkmark-filled'}"></span>
                    <span class="font-medium text-sm text-right">${message}</span>
                `;
                container.appendChild(toast);

                requestAnimationFrame(() => {
                    toast.classList.remove('translate-y-[-20px]', 'opacity-0');
                });

                setTimeout(() => {
                    toast.classList.add('opacity-0', 'translate-x-[100%]');
                    setTimeout(() => toast.remove(), 300);
                }, 4000);
            },

            formatMarkdown: (text) => {
                if (typeof marked !== 'undefined') {
                    marked.setOptions({
                        highlight: function (code, lang) {
                            if (typeof highlight !== 'undefined' && highlight.getLanguage(lang)) {
                                return highlight.highlight(code, { language: lang }).value;
                            }
                            return code;
                        },
                        gfm: true,
                        breaks: true
                    });
                    return marked.parse(text);
                }
                return text;
            }
        };

        // --- Main App ---
        class App {
            constructor() {
                this.currentScreen = 'home';
                this.chatHistory = [];
                this.currentExam = null;
                // Wait for DOM
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => this.init());
                } else {
                    this.init();
                }
            }

            init() {
                this.setupNavigation();
                this.setupMobileMenu();
                this.loadState();

                // Show Home by default
                this.navigate('home');

                // Animate entrance stats
                setTimeout(() => {
                    document.querySelectorAll('.counter').forEach(el => this.animateCounter(el));
                }, 800);
            }

            setupNavigation() {
                // Attach global exposed methods for HTML onClick
                window.app = this;
            }

            // Navigation Logic
            navigate(screenId) {
                document.querySelectorAll('.screen-section').forEach(el => {
                    el.classList.add('hidden');
                    el.classList.remove('screen-transition');
                });

                const target = document.getElementById(`screen-${screenId}`);
                if (target) {
                    target.classList.remove('hidden');
                    target.classList.add('screen-transition');
                }

                document.querySelectorAll('aside button').forEach(btn => {
                    btn.classList.remove('active-nav-item');
                    const icon = btn.querySelector('.iconify');
                    if (icon) icon.classList.remove('text-brand-400', 'text-white');
                });

                const navBtn = document.getElementById(`nav-${screenId}`);
                if (navBtn) {
                    navBtn.classList.add('active-nav-item');
                    const icon = navBtn.querySelector('.iconify');
                    if (icon) icon.classList.add('text-brand-400');
                }

                this.currentScreen = screenId;

                // Init charts if stats screen
                if (screenId === 'stats') {
                    this.initCharts();
                }
            }

            setupMobileMenu() {
                const btn = document.getElementById('mobile-menu-btn');
                const sidebar = document.querySelector('aside');
                if (btn && sidebar) {
                    btn.addEventListener('click', () => {
                        sidebar.classList.toggle('hidden');
                        sidebar.classList.toggle('fixed');
                        sidebar.classList.toggle('inset-0');
                        sidebar.classList.toggle('z-50');
                        sidebar.classList.toggle('w-64');
                        // Add overlay behavior?
                    });
                }
            }

            // --- Feature: AI Tutor ---
            quickSearch(query) {
                if (!query) return;
                this.navigate('tutor');
                const input = document.getElementById('chat-input');
                setTimeout(() => {
                    input.value = query;
                    this.sendMessage();
                }, 300); // Wait for transition
            }

            setPrompt(text) {
                const input = document.getElementById('chat-input');
                input.value = text;
                input.focus();
            }

            async sendMessage() {
                const input = document.getElementById('chat-input');
                const message = input.value.trim();
                const grade = document.getElementById('tutor-grade').value || 'general';
                const subject = document.getElementById('tutor-subject').value || 'general';

                if (!message) return;

                this.appendMessage('user', message);
                input.value = '';

                const typing = document.getElementById('typing-indicator');
                typing.classList.remove('hidden');

                // Scroll to bottom
                const container = document.getElementById('chat-messages');
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

                try {
                    const systemPrompt = `أنت "Bright Tutor"، مساعد تعليمي سعودي ذكي ومتخصص.
                    - المرحلة: ${grade}
                    - المادة: ${subject}
                    - أسلوبك: مشجع، ودود، وتستخدم أمثلة من الواقع السعودي.
                    - التنسيق: استخدم Markdown.
                    - المهمة: أجب عن سؤال الطالب بدقة، ولو كان سؤالاً رياضياً اشرح الخطوات.`;

                    const apiMessages = [
                        { role: 'system', content: systemPrompt },
                        ...this.chatHistory.slice(-6), // Context window
                        { role: 'user', content: message }
                    ];

                    const response = await GroqService.call(apiMessages, 0.5);

                    typing.classList.add('hidden');
                    this.appendMessage('assistant', response);
                    this.updateStat('questions');

                } catch (error) {
                    typing.classList.add('hidden');
                    Utils.showToast('عذراً، حدث خطأ في الاتصال. حاول مرة أخرى.', 'error');
                }
            }

            appendMessage(role, text) {
                const container = document.getElementById('chat-messages');
                const msgDiv = document.createElement('div');
                msgDiv.className = `flex items-start gap-4 ${role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in-up mb-4`;

                const avatar = role === 'user'
                    ? `<div class="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center shrink-0 border border-white/20 shadow-lg"><span class="iconify text-white" data-icon="carbon:user"></span></div>`
                    : `<div class="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0 border border-brand-500/30 shadow-lg"><span class="iconify text-brand-400 text-xl" data-icon="carbon:bot"></span></div>`;

                const contentClass = role === 'user'
                    ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-2xl rounded-tr-none shadow-lg border border-white/10'
                    : 'bg-dark-surface border border-brand-500/10 rounded-2xl rounded-tr-none shadow-lg';

                const formattedContent = role === 'assistant' ? Utils.formatMarkdown(text) : text.replace(/\n/g, '<br>');

                msgDiv.innerHTML = `
                    ${avatar}
                    <div class="${contentClass} p-4 max-w-[85%]">
                        <div class="prose prose-invert prose-sm max-w-none text-right" dir="rtl">
                            ${formattedContent}
                        </div>
                    </div>
                `;

                container.appendChild(msgDiv);

                this.chatHistory.push({ role, content: text });
                container.scrollTop = container.scrollHeight;
            }

            // --- Feature: Exam Generator ---
            async generateExam() {
                const btn = document.getElementById('btn-generate-exam');
                const subject = document.getElementById('exam-subject').value;
                const topic = document.getElementById('exam-topic').value;
                const count = document.getElementById('exam-count')?.value || 5;
                const difficulty = document.getElementById('exam-difficulty')?.value || 'medium';
                const type = document.getElementById('exam-type')?.value || 'mcq';

                if (!topic) {
                    Utils.showToast('الرجاء كتابة موضوع الاختبار', 'error');
                    return;
                }

                btn.innerHTML = `<span class="loader border-white/30 border-t-white inline-block mr-2"></span> جاري التوليد...`;
                btn.disabled = true;

                try {
                    const prompt = `
                        قم بإنشاء اختبار في مادة ${subject} عن "${topic}".
                        - الصعوبة: ${difficulty}
                        - عدد الأسئلة: ${count}
                        - النوع: ${type}

                        صيغة الإجابة المطلوبة (JSON ONLY):
                        {
                            "title": "عنوان الاختبار",
                            "questions": [
                                {
                                    "id": 1,
                                    "question": "نص السؤال",
                                    "options": ["أ", "ب", "ج", "د"],
                                    "correct_index": 0, // 0-based index
                                    "explanation": "شرح"
                                }
                            ]
                        }
                        تأكد أن النص JSON صالح تماماً. لا تضف أي نص خارج JSON.
                    `;

                    // Using JSON mode logic manually if needed, or instructing model
                    const jsonStr = await GroqService.call([{ role: 'user', content: prompt }], 0.4, true);

                    // Cleanup response if it has wrapping markdown
                    const cleanJson = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
                    const examData = JSON.parse(cleanJson);

                    this.renderExam(examData);
                    this.updateStat('exams');
                    Utils.showToast('تم توليد الاختبار بنجاح', 'success');

                } catch (e) {
                    console.error(e);
                    Utils.showToast('حدث خطأ أثناء توليد الاختبار. حاول مرة أخرى.', 'error');
                } finally {
                    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span class="iconify" data-icon="carbon:magic-wand-filled"></span> توليد الاختبار</span>`;
                    btn.disabled = false;
                }
            }

            renderExam(exam) {
                this.currentExam = exam;
                const container = document.getElementById('exam-container');

                let html = `
                    <div class="w-full h-full flex flex-col relative">
                        <div class="flex justify-between items-center mb-6 bg-dark-card/80 p-4 rounded-xl border border-brand-500/20 backdrop-blur sticky top-0 z-10">
                            <div>
                                <h2 class="text-xl font-bold text-white">${exam.title}</h2>
                                <p class="text-xs text-gray-400">عدد الأسئلة: ${exam.questions.length}</p>
                            </div>
                            <button onclick="window.print()" class="text-xs bg-brand-900 px-3 py-2 rounded hover:bg-brand-800 transition flex items-center gap-1">
                                <span class="iconify" data-icon="carbon:printer"></span> طباعة
                            </button>
                        </div>
                        <div class="space-y-6 overflow-y-auto p-2 pb-20 custom-scroll flex-1">
                `;

                exam.questions.forEach((q, idx) => {
                    html += `
                        <div class="bg-brand-900/10 p-5 rounded-xl border border-brand-500/10 question-card transition-all" data-id="${idx}">
                            <p class="font-bold text-lg mb-4 text-white flex gap-2">
                                <span class="text-brand-400 bg-brand-900/50 w-8 h-8 rounded-lg flex items-center justify-center text-sm">${q.id}</span>
                                ${q.question}
                            </p>
                            <div class="space-y-2 pr-2">
                    `;

                    q.options.forEach((opt, optIdx) => {
                        html += `
                            <label class="flex items-center p-3 rounded-lg hover:bg-brand-500/10 cursor-pointer border border-transparent transition-all group">
                                <div class="relative flex items-center justify-center w-5 h-5 mr-3 ml-3">
                                    <input type="radio" name="q_${idx}" value="${optIdx}" class="peer appearance-none w-5 h-5 border-2 border-gray-500 rounded-full checked:border-brand-500 checked:bg-brand-500 transition-colors">
                                    <span class="absolute w-2 h-2 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                                </div>
                                <span class="text-gray-300 group-hover:text-white transition-colors">${opt}</span>
                            </label>
                        `;
                    });

                    html += `</div></div>`;
                });

                html += `
                        </div>
                        <div class="pt-4 border-t border-brand-500/10 mt-auto bg-dark-card z-20">
                            <button onclick="app.submitExam()" class="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95 text-lg">
                                تسليم الإجابات
                            </button>
                        </div>
                    </div>
                `;

                container.innerHTML = html;
                container.classList.remove('items-center', 'justify-center'); // Remove centering of empty state
            }

            submitExam() {
                if (!this.currentExam) return;

                let score = 0;
                let total = this.currentExam.questions.length;

                this.currentExam.questions.forEach((q, idx) => {
                    const selected = document.querySelector(`input[name="q_${idx}"]:checked`);
                    const card = document.querySelector(`.question-card[data-id="${idx}"]`);

                    if (card) {
                        // Reset
                        card.classList.remove('border-green-500/50', 'border-red-500/50', 'bg-brand-900/10');

                        if (selected) {
                            const val = parseInt(selected.value);
                            if (val === q.correct_index) {
                                score++;
                                card.classList.add('border-green-500/50', 'bg-green-900/10');
                                selected.closest('label').classList.add('bg-green-500/20');
                            } else {
                                card.classList.add('border-red-500/50', 'bg-red-900/10');
                                selected.closest('label').classList.add('bg-red-500/20');
                            }
                        } else {
                            card.classList.add('border-red-500/50');
                        }

                        // Show correct answer and explanation
                        const existingExp = card.querySelector('.explanation-box');
                        if (existingExp) existingExp.remove();

                        const expDiv = document.createElement('div');
                        expDiv.className = 'explanation-box mt-4 p-4 bg-dark-bg/50 rounded-lg text-sm text-gray-300 border-r-4 border-brand-500/50 animate-fade-in-up';
                        expDiv.innerHTML = `
                            <p class="font-bold text-white mb-1">الإجابة الصحيحة: <span class="text-green-400">${q.options[q.correct_index]}</span></p>
                            <p class="">${q.explanation}</p>
                        `;
                        card.appendChild(expDiv);
                    }
                });

                const percentage = Math.round((score / total) * 100);

                // Show Result Modal or Overlay
                Utils.showToast(`النتيجة: ${score} من ${total} (${percentage}%)`, percentage >= 50 ? 'success' : 'error');

                // Scroll to top to see feedback
                const list = document.querySelector('#exam-container .overflow-y-auto');
                if (list) list.scrollTo({ top: 0, behavior: 'smooth' });
            }

            // --- Feature: Lesson Planner ---
            async generatePlan() {
                const btn = document.getElementById('btn-generate-plan');
                const inputs = {
                    subject: document.getElementById('plan-subject').value,
                    grade: document.getElementById('plan-grade').value,
                    title: document.getElementById('plan-title').value,
                    goals: document.getElementById('plan-goals').value,
                    duration: document.getElementById('plan-duration').value
                };

                if (!inputs.subject) {
                    Utils.showToast('أدخل اسم المادة على الأقل', 'error');
                    return;
                }

                btn.innerHTML = `<span class="loader border-white/30 border-t-white inline-block ml-2"></span> جاري التحضير...`;
                btn.disabled = true;

                try {
                    const prompt = `
                        قم بإعداد خطة درس نموذجية للمعلم السعودي.
                        المادة: ${inputs.subject} - الصف: ${inputs.grade}
                        العنوان: ${inputs.title}

                        المخرجات المطلوبة (Markdown):
                        جدول التخطيط، الأهداف، الوسائل، التمهيد، إجراءات التدريس، التقويم.
                    `;

                    const response = await GroqService.call([{ role: 'user', content: prompt }], 0.6);

                    document.getElementById('plan-placeholder').classList.add('hidden');
                    const contentEl = document.getElementById('plan-content');
                    contentEl.classList.remove('hidden');
                    contentEl.innerHTML = Utils.formatMarkdown(response);

                    Utils.showToast('تم إنشاء الخطة', 'success');

                } catch (e) {
                    Utils.showToast('تعذر إنشاء الخطة', 'error');
                } finally {
                    btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span class="iconify" data-icon="carbon:document-add"></span> توليد الخطة الدراسية</span>`;
                    btn.disabled = false;
                }
            }

            // --- Feature: Homework Corrector ---
            async correctHomework() {
                const btn = document.getElementById('btn-correct');
                const text = document.getElementById('homework-text').value;

                if (text.length < 5) {
                    Utils.showToast('الرجاء إدخال نص الواجب', 'error');
                    return;
                }

                btn.textContent = '...';
                btn.disabled = true;

                try {
                    const prompt = `
                        صحح هذا النص وعلق عليه كمعلم:
                        "${text}"

                        أعطني: الدرجة من 10، الأخطاء، ونموذج إجابة أفضل.
                    `;
                    const response = await GroqService.call([{ role: 'user', content: prompt }], 0.3);

                    const resContainer = document.getElementById('correction-result');
                    resContainer.classList.remove('hidden');
                    resContainer.classList.add('flex'); // Ensure flex is applied if needed or block
                    document.getElementById('correction-content').innerHTML = Utils.formatMarkdown(response);

                    Utils.showToast('تم التصحيح', 'success');
                } catch (e) {
                    Utils.showToast('خطأ في التصحيح', 'error');
                } finally {
                    btn.textContent = 'تصحيح الآن';
                    btn.disabled = false;
                }
            }

            // --- Stats & Charts ---
            initCharts() {
                // Skills Radar
                const ctxSkills = document.getElementById('chart-skills');
                if (ctxSkills && !this.chartSkills) {
                    this.chartSkills = new Chart(ctxSkills, {
                        type: 'radar',
                        data: {
                            labels: ['الفهم القرائي', 'حل المسائل', 'التفكير النقدي', 'الحفظ', 'المفاهيم العلمية', 'الإبداع'],
                            datasets: [{
                                label: 'مستواك الحالي',
                                data: [85, 75, 60, 90, 70, 80],
                                fill: true,
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                borderColor: '#8b5cf6',
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#fff'
                            }]
                        },
                        options: {
                            scales: {
                                r: {
                                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                    pointLabels: { color: '#ccc', font: { family: 'IBM Plex Sans Arabic' } },
                                    ticks: { display: false, backdropColor: 'transparent' }
                                }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }

                // Progress Line
                const ctxProgress = document.getElementById('chart-progress');
                if (ctxProgress && !this.chartProgress) {
                    this.chartProgress = new Chart(ctxProgress, {
                        type: 'line',
                        data: {
                            labels: ['أسبوع 1', 'أسبوع 2', 'أسبوع 3', 'أسبوع 4'],
                            datasets: [{
                                label: 'التقدم',
                                data: [65, 70, 78, 85],
                                borderColor: '#3b82f6',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                                x: { grid: { display: false }, ticks: { color: '#aaa' } }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }

            animateCounter(el) {
                const target = parseInt(el.getAttribute('data-target'));
                if (isNaN(target)) return;

                let count = 0;
                const duration = 2000;
                const increment = Math.ceil(target / (duration / 16));

                const timer = setInterval(() => {
                    count += increment;
                    if (count >= target) {
                        el.textContent = target.toLocaleString();
                        clearInterval(timer);
                    } else {
                        el.textContent = count.toLocaleString();
                    }
                }, 16);
            }

            loadState() {
                // Simulate loading user data
                // In real app: localStorage.getItem('brightEduUser');
            }

            updateStat(type) {
                // Update local stats logic
            }

            toggleAssistant() {
                this.navigate('tutor');
                Utils.showToast('مرحباً! كيف يمكنني مساعدتك؟');
            }
        }

        // Initialize
        const app = new App();
