const App = function() {
    // --- STATE ---
    this.state = {
        currentStep: 1,
        totalSteps: 6,
        theme: 'light',
        themeCycle: ['light', 'dark', 'high-contrast'],
        persona: 'default',
        achievements: [],
        applicationData: {
            basicInfo: {},
            cvFile: null,
            cvContent: '',
            analysisResults: {},
            interactiveChallenge: {
                scenario: null,
                answer: ''
            },
            interview: {
                questions: [],
                currentQuestion: 0,
                answers: [],
                timer: null,
                timeLeft: 300,
            },
            finalReport: {}
        }
    };

    // --- CONFIG ---
    this.config = {
        groqApiKey: '',

                useProxyApi: true,
steps: [
            { id: 1, title: 'البيانات', icon: 'fa-user-plus' },
            { id: 2, title: 'السيرة الذاتية', icon: 'fa-file-upload' },
            { id: 3, title: 'التحليل', icon: 'fa-brain' },
            { id: 4, title: 'التحدي', icon: 'fa-puzzle-piece' },
            { id: 5, title: 'المقابلة', icon: 'fa-comments' },
            { id: 6, title: 'التقرير', icon: 'fa-chart-line' },
        ],
        marketInsights: {
            developer: "نصيحة من البيانات: 70% من المطورين الناجحين يذكرون Git و CI/CD في سيرهم الذاتية. تأكد من إبرازها.",
            designer: "نصيحة من البيانات: 90% من المصممين الذين تم توظيفهم يرفقون رابطًا لمعرض أعمالهم (Portfolio).",
            marketer: "نصيحة من البيانات: المسوقون الذين يذكرون نتائج رقمية (مثل زيادة المبيعات بنسبة X%) يحصلون على اهتمام أكبر."
        },
        powerWords: ['قُدت', 'طوّرت', 'أدرت', 'حققت', 'أنجزت', 'أسست', 'زدت', 'حسّنت', 'خفضت', 'ابتكرت', 'led', 'managed', 'developed', 'achieved', 'increased', 'decreased', 'improved', 'founded', 'innovated']
    };

    this.dom = {};

    this.init = () => {
        this.dom.progressBar = document.querySelector('.progress-bar');
        this.dom.themeToggleBtn = document.getElementById('themeToggleBtn');
        this.dom.basicInfoForm = document.getElementById('basicInfoForm');
        this.dom.uploadArea = document.getElementById('uploadArea');
        this.dom.cvFile = document.getElementById('cvFile');
        this.dom.aiAssistant = document.getElementById('aiAssistant');
        this.dom.aiAssistantMessage = document.getElementById('aiAssistantMessage');
        this.dom.resumeModal = document.getElementById('resumeModal');
        this.dom.resumeBtn = document.getElementById('resumeBtn');
        this.dom.startNewBtn = document.getElementById('startNewBtn');
        this.dom.fullNameInput = document.getElementById('fullName');
        this.dom.specializationInput = document.getElementById('specialization');
        this.dom.textAnswerTextarea = document.getElementById('textAnswer');
        this.dom.interviewModal = document.getElementById('interviewModal');
        this.dom.interviewModalContent = document.getElementById('interviewModalContent');

        if (!this.config.useProxyApi && (!this.config.groqApiKey || !this.config.groqApiKey.startsWith('gsk_'))) {
             this.showNotification('تنبيه: مفتاح Groq API غير صحيح. لن تعمل ميزات الذكاء الاصطناعي.', 'error');
        }

        this.setupEventListeners();
        this.renderProgressBar();
        this.initTheme();
        this.checkForSavedState();
    };

    this.loadScriptOnce = (src) => {
        this._externalScriptPromises = this._externalScriptPromises || {};
        if (!src) {
            return Promise.resolve();
        }
        if (this._externalScriptPromises[src]) {
            return this._externalScriptPromises[src];
        }
        if (document.querySelector(`script[src="${src}"]`)) {
            this._externalScriptPromises[src] = Promise.resolve();
            return this._externalScriptPromises[src];
        }
        this._externalScriptPromises[src] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return this._externalScriptPromises[src];
    };
    this.ensurePdfLib = async () => {
        if (window.pdfjsLib) {
            return window.pdfjsLib;
        }
        await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        return window.pdfjsLib;
    };
    this.ensureWordLib = async () => {
        if (window.mammoth) {
            return window.mammoth;
        }
        await this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
        return window.mammoth;
    };
    this.ensureChartLib = async () => {
        if (window.Chart) {
            return window.Chart;
        }
        await this.loadScriptOnce('https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js');
        return window.Chart;
    };
    this.ensurePdfExportLibs = async () => {
        const tasks = [];
        if (!window.html2canvas) {
            tasks.push(this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'));
        }
        if (!window.jspdf) {
            tasks.push(this.loadScriptOnce('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'));
        }
        await Promise.all(tasks);
        return {
            html2canvas: window.html2canvas,
            jspdf: window.jspdf
        };
    };

    this.setupEventListeners = () => {
        this.dom.themeToggleBtn.addEventListener('click', this.toggleTheme);
        this.dom.basicInfoForm.addEventListener('submit', this.handleBasicInfoSubmit);
        this.dom.fullNameInput.addEventListener('input', (e) => this.personalizeWelcome(e.target.value));
        this.dom.specializationInput.addEventListener('input', (e) => this.adaptiveUI.updatePersona(e.target.value));
        this.dom.textAnswerTextarea.addEventListener('input', this.interview.updateRealTimeCoaching);

        this.dom.uploadArea.addEventListener('click', () => this.dom.cvFile.click());
        this.dom.cvFile.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        ['dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dom.uploadArea.addEventListener(eventName, this.handleDragDrop, false);
        });

        this.dom.resumeBtn.addEventListener('click', this.resumeState);
        this.dom.startNewBtn.addEventListener('click', this.clearStateAndHideModal);
    };

    // --- STEP 2: CV UPLOAD ---
    this.handleDragDrop = (e) => { e.preventDefault(); e.stopPropagation(); this.dom.uploadArea.classList.remove('dragover'); if (e.type === 'dragover') { this.dom.uploadArea.classList.add('dragover'); } if (e.type === 'drop') { this.handleFileSelect(e.dataTransfer.files[0]); } };
    this.handleFileSelect = async (file) => {
        if (!file) return;
        const allowedMimeTypes = [ 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown' ];
        if (!allowedMimeTypes.includes(file.type)) { this.showNotification('نوع الملف غير مدعوم. يرجى رفع PDF, DOCX, DOC, TXT, أو MD.', 'error'); return; }
        if (file.size > 10 * 1024 * 1024) { this.showNotification('حجم الملف كبير جداً (الحد الأقصى 10MB)', 'error'); return; }
        this.state.applicationData.cvFile = file;
        try {
            this.showNotification('جاري معالجة الملف...', 'success');
            let extractedText = '';
            switch (file.type) {
                case 'application/pdf': extractedText = await this.extractTextFromPDF(file); break;
                case 'application/msword': case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractedText = await this.extractTextFromWord(file); break;
                case 'text/plain': case 'text/markdown': extractedText = await this.extractTextFromPlain(file); break;
            }
            this.state.applicationData.cvContent = extractedText;
            this.showFileInfo(file);
            document.getElementById('analyzeBtn').disabled = false;
            this.showNotification('تم رفع الملف بنجاح. جاهز للتحليل.', 'success');
            this.unlockAchievement('الوثيقة الأهم', 'تم رفع سيرتك الذاتية بنجاح وجاهزة للتحليل!');
        } catch (error) { console.error('File Processing Error:', error); this.showNotification('حدث خطأ أثناء معالجة الملف. قد يكون الملف تالفاً.', 'error'); this.removeFile(); }
    };
    this.extractTextFromPDF = async (file) => { const pdfjs = await this.ensurePdfLib(); const arrayBuffer = await file.arrayBuffer(); const pdf = await pdfjs.getDocument(arrayBuffer).promise; let text = ''; for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); const textContent = await page.getTextContent(); text += textContent.items.map(item => item.str).join(' '); } return text; };
    this.extractTextFromWord = async (file) => { const mammothLib = await this.ensureWordLib(); const arrayBuffer = await file.arrayBuffer(); const result = await mammothLib.extractRawText({ arrayBuffer }); return result.value; };
    this.extractTextFromPlain = (file) => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = (e) => resolve(e.target.result); reader.onerror = (e) => reject(e); reader.readAsText(file); }); };
    this.showFileInfo = (file) => { document.getElementById('fileName').textContent = file.name; document.getElementById('fileSize').textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`; document.getElementById('fileInfo').style.display = 'flex'; document.getElementById('uploadArea').style.display = 'none'; };
    this.removeFile = () => { this.state.applicationData.cvFile = null; this.state.applicationData.cvContent = ''; document.getElementById('fileInfo').style.display = 'none'; document.getElementById('uploadArea').style.display = 'block'; document.getElementById('analyzeBtn').disabled = true; this.dom.cvFile.value = ''; };

    // --- API & UTILITIES ---
    this._extractJson = (text) => {
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            return match[1].trim();
        }
        return text.trim();
    };

    this.callGroqAPI = async (prompt) => {
        if (!this.config.useProxyApi && (!this.config.groqApiKey || !this.config.groqApiKey.startsWith('gsk_'))) {
            throw new Error("Groq API key is not configured correctly.");
        }
        const url = '/api/ai/openai-chat';
        const body = {
            messages: [{ role: "user", content: prompt }],
            model: this.config.groqModel,
            temperature: 0.3,
            max_tokens: 4096,
            top_p: 1,
            stream: false,
            response_format: { type: "json_object" },
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${this.config.groqApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData?.error?.message || `HTTP error! status: ${response.status}`;
            throw new Error(`Groq API Error: ${errorMessage}`);
        }
        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            const rawContent = data.choices[0].message.content;
            const cleanJsonString = this._extractJson(rawContent);
            try {
                return JSON.parse(cleanJsonString);
            } catch (e) {
                console.error("Failed to parse JSON from Groq response:", cleanJsonString);
                throw new Error("Groq API returned malformed JSON.");
            }
        } else {
            const finishReason = data.choices?.[0]?.finish_reason || 'Unknown reason';
            throw new Error(`Groq API call finished unexpectedly. Reason: ${finishReason}.`);
        }
    };

    this.startAnalysis = async () => {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('analysisResults').style.display = 'none';
        try {
            const prompt = `
            You are a professional Arabic-speaking career coach. Your task is to analyze the provided CV and respond ONLY with a valid JSON object.
            The entire JSON object, including all keys and values, must be in Arabic language and letters.

            CONTEXT:
            - Candidate's Specialization: ${this.state.applicationData.basicInfo.specialization}
            - Candidate's Years of Experience: ${this.state.applicationData.basicInfo.experience}
            - Target Job Description (if any): """${this.state.applicationData.basicInfo.jobDescription || 'General analysis for their specialization'}"""
            - CV_TEXT: """${this.state.applicationData.cvContent}"""

            Your response MUST be a single JSON object with the following structure. Do not add any text before or after the JSON object.
            {
              "matchScore": <number from 0-100>,
              "skillsAnalysis": { "المهارة الأولى": <score>, "المهارة الثانية": <score> },
              "summary": "<A 2-3 sentence summary in Arabic>",
              "improvements": [
                  { "original": "<A weak area from the CV in Arabic>", "suggestion": "<An improvement suggestion in Arabic>" },
                  { "original": "نصيحة استراتيجية", "suggestion": "<A strategic tip in Arabic>" }
              ],
              "professionalSummary": "<A compelling 3-4 line professional summary in first person, in Arabic>",
              "suggestedJobs": ["<job_title_1 in Arabic>", "<job_title_2 in Arabic>"]
            }
            `;
            const analysisData = await this.callGroqAPI(prompt);
            this.state.applicationData.analysisResults = analysisData;
            await this.displayAnalysisResults(analysisData);
            this.unlockAchievement('خبير تحليل السير', 'تم تحليل سيرتك الذاتية بتقنيات الذكاء الاصطناعي!');

        } catch (error) {
            console.error("AI Analysis Error:", error);
            this.showNotification(`فشل تحليل AI: ${error.message}. سيتم استخدام بيانات تجريبية.`, 'error');
            await this.displayAnalysisResults({
                matchScore: 78,
                skillsAnalysis: { "تحليل البيانات": 85, "التواصل": 90, "إدارة المشاريع": 75, "حل المشكلات": 88, "القيادة": 70 },
                summary: "مرشح قوي يتمتع بخبرة جيدة ومهارات تواصل ممتازة. سيرتك الذاتية تظهر أساساً قوياً يمكن البناء عليه.",
                improvements: [{original: "كنت مسؤولاً عن الفريق.", suggestion: "قمت بقيادة فريق من 5 أعضاء، مما أدى لزيادة الإنتاجية بنسبة 20%."}, {original: "نصيحة استراتيجية", suggestion:"فكر في إضافة قسم 'مشاريع رئيسية' لتسليط الضوء على أبرز إنجازاتك بشكل قصصي."}],
                professionalSummary: "أنا متخصص متمرس أتمتع بخبرة تزيد عن 5 سنوات في مجالي. معروف بقدرتي على قيادة الفرق وتحقيق نتائج ملموسة. أسعى للاستفادة من خبراتي في دور مليء بالتحديات يساهم في نمو المؤسسة.",
                suggestedJobs: ["مدير منتج", "محلل أعمال", "مستشار استراتيجي"]
            });
        } finally {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('analysisResults').style.display = 'block';
            document.getElementById('challengeBtn').disabled = false;
        }
    };

    this.generateChallenge = async () => {
        document.getElementById('challengeLoadingState').style.display = 'block';
        document.getElementById('challengeContent').style.display = 'none';
        try {
            const prompt = `
            You are an AI assistant that creates job-related challenges.
            Your entire response MUST be a single, valid JSON object, and all text content within the JSON must be in Arabic.

            CANDIDATE PROFILE:
            - Specialization: ${this.state.applicationData.basicInfo.specialization}
            - CV Summary: ${this.state.applicationData.analysisResults.summary}

            Based on the profile, create a realistic, single-paragraph scenario.
            The JSON object must have this exact structure:
            {
              "title": "<A short, engaging title for the challenge in Arabic>",
              "scenario": "<The detailed scenario text in Arabic>"
            }
            Do not add any text before or after the JSON.
            `;
            const challengeData = await this.callGroqAPI(prompt);
            this.state.applicationData.interactiveChallenge.scenario = challengeData;
            this.displayChallenge(challengeData);
        } catch (error) {
            console.error("Challenge Generation Error:", error);
            this.showNotification(`فشل إنشاء التحدي: ${error.message}. سيتم استخدام سيناريو عام.`, 'error');
            const fallbackChallenge = { title: "سيناريو: إدارة أزمة غير متوقعة", scenario: "تخيل أنك تعمل على مشروع مهم مع موعد تسليم نهائي بعد يومين. فجأة، يخبرك عضو رئيسي في الفريق أنه سيضطر للتغيب لظرف طارئ. ما هي الخطوات الثلاث الأولى التي ستتخذها للتعامل مع هذا الموقف وضمان استمرارية العمل؟" };
            this.state.applicationData.interactiveChallenge.scenario = fallbackChallenge;
            this.displayChallenge(fallbackChallenge);
        } finally {
            document.getElementById('challengeLoadingState').style.display = 'none';
            document.getElementById('challengeContent').style.display = 'block';
        }
    };

    this.interview = {
        mediaRecorder: null, audioChunks: [], isRecording: false,
        init: async function() {
            const parent = app;
            const warmupAccepted = await parent.showInterviewModal('warmup');
            if (!warmupAccepted) { parent.assistantSpeak("لا بأس، لنبدأ المقابلة مباشرة. حظًا موفقًا!"); }
            document.getElementById('interviewLoadingState').style.display = 'block';
            document.getElementById('questionCard').style.display = 'none';
            document.getElementById('realTimeCoaching').style.display = 'flex';
            const interviewState = parent.state.applicationData.interview;
            try {
                const prompt = `
                You are an expert interviewer AI. Your task is to generate 5 insightful interview questions in Arabic.
                Your entire response MUST be a single, valid JSON object with a key "questions" containing an array of 5 strings, and all text content within the JSON must be in Arabic.

                CANDIDATE CONTEXT:
                - Specialization: "${parent.state.applicationData.basicInfo.specialization}"
                - CV Analysis Summary: "${parent.state.applicationData.analysisResults.summary}"
                - Candidate's challenge answer: """${parent.state.applicationData.interactiveChallenge.answer}"""

                Generate 5 diverse questions (behavioral, technical, situational) in Arabic, based on all the context.
                One question should be a direct follow-up to their challenge answer.

                Example of required output:
                {
                  "questions": [
                    "السؤال الأول",
                    "السؤال الثاني",
                    "السؤال الثالث",
                    "السؤال الرابع",
                    "السؤال الخامس"
                  ]
                }
                Do not add any text before or after the JSON object.
                `;
                const questionsObj = await parent.callGroqAPI(prompt);
                interviewState.questions = questionsObj.questions;
            } catch (error) {
                console.error("Interview questions generation failed:", error);
                parent.showNotification(`فشل إنشاء أسئلة مخصصة: ${error.message}. سيتم استخدام أسئلة عامة.`, 'error');
                interviewState.questions = [ "ما هي أهم إنجازاتك المهنية التي تفتخر بها؟", "صف تحديًا صعبًا واجهته وكيف تغلبت عليه.", "أين ترى نفسك مهنياً بعد 5 سنوات من الآن؟", "كيف تواكب التطورات الجديدة في مجال عملك؟", "لماذا تعتقد أنك المرشح الأنسب لهذه الفرصة؟" ];
            }
            interviewState.answers = new Array(interviewState.questions.length).fill(null).map(() => ({ text: '', audioUrl: null }));
            interviewState.currentQuestion = 0;
            document.getElementById('interviewLoadingState').style.display = 'none';
            document.getElementById('questionCard').style.display = 'block';
            this.displayCurrentQuestion();
        },
        displayCurrentQuestion: function() {
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            const qIndex = interviewState.currentQuestion;
            document.getElementById('currentQuestion').textContent = qIndex + 1;
            document.getElementById('totalQuestions').textContent = interviewState.questions.length;
            document.getElementById('questionText').textContent = interviewState.questions[qIndex];
            document.getElementById('textAnswer').value = interviewState.answers[qIndex]?.text || '';
            this.updateNavButtons();
            this.resetAudio();
            this.updateRealTimeCoaching();
        },
        saveCurrentAnswer: function() {
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            const qIndex = interviewState.currentQuestion;
            if (!interviewState.answers[qIndex]) {
                interviewState.answers[qIndex] = { text: '', audioUrl: null };
            }
            interviewState.answers[qIndex].text = document.getElementById('textAnswer').value;
            parent.saveState();
        },
        nextQuestion: function() {
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            this.saveCurrentAnswer();
            if (interviewState.currentQuestion < interviewState.questions.length - 1) {
                interviewState.currentQuestion++;
                this.displayCurrentQuestion();
            }
        },
        previousQuestion: function() {
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            this.saveCurrentAnswer();
            if (interviewState.currentQuestion > 0) {
                interviewState.currentQuestion--;
                this.displayCurrentQuestion();
            }
        },
        finishInterview: async function() {
            this.saveCurrentAnswer();
            app.unlockAchievement('المحاور البارع', 'أكملت المقابلة التفاعلية بنجاح!');
            const debriefDone = await app.showInterviewModal('debrief');
            app.nextStep();
        },
        updateNavButtons: function() {
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            const qIndex = interviewState.currentQuestion;
            document.getElementById('prevQuestionBtn').disabled = qIndex === 0;
            const isLast = qIndex === interviewState.questions.length - 1;
            document.getElementById('nextQuestionBtn').style.display = isLast ? 'none' : 'inline-flex';
            document.getElementById('finishInterviewBtn').style.display = isLast ? 'inline-flex' : 'none';
        },
        toggleRecording: async function() {
            if (this.isRecording) {
                this.stopRecording();
            } else {
                await this.startRecording();
            }
        },
        startRecording: async function() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.mediaRecorder = new MediaRecorder(stream);
                this.audioChunks = [];
                this.mediaRecorder.ondataavailable = e => this.audioChunks.push(e.data);
                this.mediaRecorder.onstop = () => {
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    if (!interviewState.answers[interviewState.currentQuestion]) {
                        interviewState.answers[interviewState.currentQuestion] = { text: '', audioUrl: null };
                    }
                    interviewState.answers[interviewState.currentQuestion].audioUrl = audioUrl;
                    document.getElementById('audioPlayback').src = audioUrl;
                    document.getElementById('audioPlayback').style.display = 'block';
                    document.getElementById('recordingStatus').textContent = 'تم حفظ التسجيل.';
                };
                this.mediaRecorder.start();
                this.isRecording = true;
                const recordBtn = document.getElementById('recordBtn');
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<i class="fas fa-stop"></i> إيقاف التسجيل';
                document.getElementById('recordingStatus').textContent = 'جاري التسجيل...';
            } catch (err) {
                app.showNotification('لا يمكن الوصول إلى الميكروفون.', 'error');
            }
        },
        stopRecording: function() {
            if (this.mediaRecorder) {
                this.mediaRecorder.stop();
                this.isRecording = false;
                if (this.mediaRecorder.stream) {
                    this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                }
                const recordBtn = document.getElementById('recordBtn');
                recordBtn.classList.remove('recording');
                recordBtn.innerHTML = '<i class="fas fa-microphone"></i> ابدأ التسجيل';
            }
        },
        resetAudio: function() {
            this.stopRecording();
            const parent = app;
            const interviewState = parent.state.applicationData.interview;
            const audioUrl = interviewState.answers[interviewState.currentQuestion]?.audioUrl;
            const audioPlayback = document.getElementById('audioPlayback');
            if (audioUrl) {
                audioPlayback.src = audioUrl;
                audioPlayback.style.display = 'block';
                document.getElementById('recordingStatus').textContent = 'يوجد تسجيل محفوظ.';
            } else {
                audioPlayback.style.display = 'none';
                audioPlayback.src = '';
                document.getElementById('recordingStatus').textContent = '';
            }
        },
        updateRealTimeCoaching: function() {
            const text = app.dom.textAnswerTextarea.value;
            const wordCount = text.split(/\s+/).filter(Boolean).length;
            let brevityStatus = 'ممتاز';
            if (wordCount > 100) brevityStatus = 'طويل جدًا';
            else if (wordCount > 60) brevityStatus = 'طويل';
            document.getElementById('brevityMeter').textContent = brevityStatus;
            const powerWordsFound = text.toLowerCase().split(/\s+/).filter(word => app.config.powerWords.includes(word)).length;
            document.getElementById('powerWordsMeter').textContent = powerWordsFound;
        }
    };

    this.initTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon();
    };
    this.toggleTheme = () => {
        const currentThemeIndex = this.state.themeCycle.indexOf(this.state.theme);
        const nextThemeIndex = (currentThemeIndex + 1) % this.state.themeCycle.length;
        const nextTheme = this.state.themeCycle[nextThemeIndex];
        this.state.theme = nextTheme;
        localStorage.setItem('theme', this.state.theme);
        this.initTheme();
    };
    this.updateThemeIcon = () => {
        const icon = this.dom.themeToggleBtn.querySelector('i');
        const themeIcons = { light: 'fa-moon', dark: 'fa-sun', 'high-contrast': 'fa-low-vision' };
        icon.className = `fas ${themeIcons[this.state.theme]}`;
    };
    this.personalizeWelcome = (name) => {
        const persona = this.state.persona;
        let message = "أهلاً بك في بوابة التوظيف الذكية! أنا هنا لإرشادك في رحلتك.";
        if(name.trim() !== '') {
            if(persona === 'developer') {
                message = `أهلاً بك يا ${name}! استعد لكتابة الكود نحو وظيفتك القادمة.`;
            } else if (persona === 'designer') {
                message = `يا ${name}، أهلاً بك! لنصمم معًا لوحة مشرقة لمستقبلك المهني.`;
            } else if (persona === 'marketer') {
                message = `حملة توظيف ${name} انطلقت! أهلاً بك، لنحقق أفضل عائد على الاستثمار في مهاراتك.`;
            } else {
                message = `أهلاً بك يا ${name}! يسعدني أن أكون مرشدك اليوم.`;
            }
        }
        this.assistantSpeak(message);
    };
    this.adaptiveUI = {
        updatePersona: (specialization) => {
            let persona = 'default';
            const spec = specialization.toLowerCase();
            if (spec.includes('مطور') || spec.includes('مبرمج') || spec.includes('developer') || spec.includes('engineer')) {
                persona = 'developer';
            } else if (spec.includes('مصمم') || spec.includes('designer') || spec.includes('creative')) {
                persona = 'designer';
            } else if (spec.includes('مسوق') || spec.includes('marketer') || spec.includes('تسويق')) {
                persona = 'marketer';
            }
            if (this.state.persona !== persona) {
                this.state.persona = persona;
                document.documentElement.setAttribute('data-persona', persona);
                this.personalizeWelcome(this.dom.fullNameInput.value);
            }
        }
    };
    this.saveState = () => {
        try {
            const stateToSave = JSON.parse(JSON.stringify(this.state));
            if (stateToSave.applicationData.cvFile) {
                stateToSave.applicationData.cvFile = {
                    name: this.state.applicationData.cvFile.name,
                    size: this.state.applicationData.cvFile.size,
                    type: this.state.applicationData.cvFile.type,
                };
            }
            localStorage.setItem('appState', JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state:", error);
        }
    };
    this.checkForSavedState = () => {
        const savedStateJSON = localStorage.getItem('appState');
        if (savedStateJSON) {
            this.dom.resumeModal.classList.add('show');
        } else {
            this.showStep(1);
        }
    };
    this.resumeState = () => {
        const savedStateJSON = localStorage.getItem('appState');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            Object.assign(this.state, savedState);
            this.state.totalSteps = 6;
            this.initTheme();
            this.adaptiveUI.updatePersona(this.state.applicationData.basicInfo.specialization || '');
            const basicInfo = this.state.applicationData.basicInfo;
            for (const key in basicInfo) {
                const element = document.getElementById(key);
                if (element) element.value = basicInfo[key];
            }
            if (this.state.applicationData.cvFile) {
                this.showFileInfo(this.state.applicationData.cvFile);
                document.getElementById('analyzeBtn').disabled = false;
            }
            this.showStep(this.state.currentStep);
            this.showNotification('تم استئناف طلبك بنجاح. أهلاً بعودتك!', 'success');
        }
        this.dom.resumeModal.classList.remove('show');
    };
    this.clearStateAndHideModal = () => {
        localStorage.removeItem('appState');
        this.dom.resumeModal.classList.remove('show');
        window.location.reload();
    };
    this.startNew = () => {
        if (confirm('هل تريد حذف جميع بياناتك الحالية والبدء من جديد؟ لا يمكن التراجع عن هذا الإجراء.')) {
            localStorage.removeItem('appState');
            localStorage.removeItem('submittedApplications');
            window.location.reload();
        }
    };
    this.unlockAchievement = (title, message) => {
        if (this.state.achievements.includes(title)) return;
        this.state.achievements.push(title);
        this.saveState();
        const achievement = document.createElement('div');
        achievement.className = 'notification achievement';
        achievement.innerHTML = `<i class="fas fa-trophy"></i> <div><span class="achievement-title">${title}</span>${message}</div>`;
        document.body.appendChild(achievement);
        setTimeout(() => achievement.classList.add('show'), 100);
        setTimeout(() => {
            achievement.classList.remove('show');
            setTimeout(() => achievement.remove(), 500);
        }, 6000);
    };
    this.renderProgressBar = () => {
        this.dom.progressBar.innerHTML = this.config.steps.map(step => `
            <div class="progress-step" data-step="${step.id}">
                <div class="step-circle"><i class="fas ${step.icon}"></i></div>
                <div class="step-title">${step.title}</div>
            </div>
        `).join('');
    };
    this.updateProgressBar = () => {
        document.querySelectorAll('.progress-step').forEach((stepEl) => {
            const stepNumber = parseInt(stepEl.dataset.step, 10);
            stepEl.classList.remove('active', 'completed');
            if (stepNumber < this.state.currentStep) {
                stepEl.classList.add('completed');
            } else if (stepNumber === this.state.currentStep) {
                stepEl.classList.add('active');
            }
        });
    };
    this.showStep = (step) => {
        this.state.currentStep = step;
        document.querySelectorAll('.step-content').forEach(content => content.classList.remove('active'));
        const currentStepElement = document.getElementById(`step${step}`);
        if(currentStepElement) currentStepElement.classList.add('active');
        this.updateProgressBar();
        this.assistantSpeakForStep(step);
        this.saveState();
        switch(step) {
            case 3: this.startAnalysis(); break;
            case 4: this.generateChallenge(); break;
            case 5: this.interview.init(); break;
            case 6: this.generateFinalReport(); break;
        }
    };
    this.nextStep = () => {
        if (this.state.currentStep < this.state.totalSteps) {
            if(this.state.currentStep === 1) {
                this.unlockAchievement('الانطلاقة الأولى', 'أكملت بياناتك الأساسية بنجاح!');
            }
            if(this.state.currentStep === 4) {
                this.state.applicationData.interactiveChallenge.answer = document.getElementById('challengeAnswer').value;
                this.unlockAchievement('المفكر الاستراتيجي', 'أجبت على التحدي العملي ببراعة!');
            }
            this.showStep(this.state.currentStep + 1);
        }
    };
    this.previousStep = () => {
        if (this.state.currentStep > 1) {
            this.showStep(this.state.currentStep - 1);
        }
    };
    this.handleBasicInfoSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        this.state.applicationData.basicInfo = Object.fromEntries(formData.entries());
        this.nextStep();
    };
    this.displayAnalysisResults = async (data) => {
        document.getElementById('analysisSummary').innerHTML = `<p>${data.summary}</p>`;
        document.getElementById('cvImprovements').innerHTML = `<ul>${data.improvements.map(i => `<li><strong>الأصل/النصيحة:</strong> ${i.original}<br><strong>الاقتراح:</strong> ${i.suggestion}</li>`).join('')}</ul>`;
        document.getElementById('professionalSummary').innerHTML = `<p>${data.professionalSummary}</p>`;
        document.getElementById('suggestedJobs').innerHTML = `<ul>${data.suggestedJobs.map(j => `<li>${j}</li>`).join('')}</ul>`;
        await this.renderSkillsChart(data.skillsAnalysis, data.matchScore);
    };
    this.renderSkillsChart = async (skillsData, matchScore) => {
        const ChartLib = await this.ensureChartLib();
        const chartElement = document.getElementById('skillsChart');
        if (ChartLib.getChart(chartElement)) {
            ChartLib.getChart(chartElement).destroy();
        }
        new ChartLib(chartElement.getContext('2d'), {
            type: 'radar',
            data: {
                labels: Object.keys(skillsData),
                datasets: [{
                    label: 'تقييم المهارات',
                    data: Object.values(skillsData),
                    backgroundColor: 'rgba(46, 139, 87, 0.2)',
                    borderColor: 'rgb(46, 139, 87)',
                    pointBackgroundColor: 'rgb(46, 139, 87)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(128, 128, 128, 0.2)' },
                        grid: { color: 'rgba(128, 128, 128, 0.2)' },
                        pointLabels: {
                            font: { size: 12, family: 'Cairo' },
                            color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                        },
                        ticks: {
                            backdropColor: 'transparent',
                            stepSize: 20
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: { family: 'Cairo' },
                            color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                        }
                    },
                    title: {
                        display: true,
                        text: `التطابق مع الوظيفة: ${matchScore}%`,
                        font: { size: 16, family: 'Cairo' },
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                }
            }
        });
    };
    this.displayChallenge = (data) => {
        document.getElementById('challengeTitle').textContent = data.title;
        document.getElementById('challengeScenario').textContent = data.scenario;
        document.getElementById('challengeAnswer').value = this.state.applicationData.interactiveChallenge.answer || '';
    };
    this.showInterviewModal = (type) => {
        return new Promise(resolve => {
            let content = '';
            const closeModal = (resolution) => {
                this.dom.interviewModal.classList.remove('show');
                resolve(resolution);
            };
            if (type === 'warmup') {
                content = `
                <h2><i class="fas fa-mug-hot"></i> إحماء قبل المقابلة</h2>
                <p>أعلم أن المقابلات قد تكون مرهقة. قبل أن نبدأ، ما رأيك في إحماء سريع؟ أخبرني عن شيء ممتع تعلمته هذا الأسبوع خارج نطاق العمل.</p>
                <p class="disclaimer">هذا السؤال للمساعدة على الاسترخاء فقط ولن يتم تقييمه.</p>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="skipWarmup">تخطِ الإحماء</button>
                    <button class="btn btn-primary" id="startWarmup">ابدأ الإحماء</button>
                </div>`;
                this.dom.interviewModalContent.innerHTML = content;
                document.getElementById('skipWarmup').onclick = () => closeModal(false);
                document.getElementById('startWarmup').onclick = () => {
                    this.assistantSpeak('عظيم! خذ وقتك. عندما تكون جاهزاً، يمكننا البدء بالأسئلة الرسمية.');
                    this.dom.interviewModalContent.innerHTML = `
                    <h2><i class="fas fa-coffee"></i> سؤال الإحماء</h2>
                    <p>أخبرني عن شيء ممتع تعلمته هذا الأسبوع خارج نطاق العمل.</p>
                    <div class="form-group full-width" style="margin-top: 1rem; text-align: right;">
                        <textarea id="warmupAnswer" rows="4" placeholder="اكتب هنا..." class="form-group textarea"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" id="finishWarmup">أنا جاهز، لنبدأ المقابلة</button>
                    </div>
                    `;
                    document.getElementById('finishWarmup').onclick = () => closeModal(true);
                };
            } else if (type === 'debrief') {
                content = `
                <h2><i class="fas fa-award"></i> أداء رائع!</h2>
                <p>لقد أكملت المقابلة بنجاح. كيف تشعر حيال إجاباتك؟ خذ لحظة للتفكير.</p>
                <p class="disclaimer">تفكيرك في أدائك هو بحد ذاته مهارة مهمة.</p>
                <div class="form-actions">
                    <button class="btn btn-primary" id="viewReport">عرض تقريري النهائي</button>
                </div>`;
                this.dom.interviewModalContent.innerHTML = content;
                document.getElementById('viewReport').onclick = () => closeModal(true);
            }
            this.dom.interviewModal.classList.add('show');
        });
    };
    this.generateFinalReport = async () => {
        document.getElementById('reportLoadingState').style.display = 'block';
        document.getElementById('reportContainer').style.display = 'none';
        document.getElementById('reportActions').style.display = 'none';
        try {
            const interviewSummary = this.state.applicationData.interview.answers.map((ans, i) => `Q${i+1}: ${this.state.applicationData.interview.questions[i]}\nA: ${ans.text || '(No text answer)'}`).join('\n---\n');
            const prompt = `
            You are a professional Arabic-speaking career coach. Your task is to generate a final report and respond ONLY with a valid JSON object. The entire JSON object, including all keys and values, must be in Arabic.
            CANDIDATE'S FULL DATA:
            - Basic Info: ${JSON.stringify(this.state.applicationData.basicInfo)}
            - CV Analysis: ${JSON.stringify(this.state.applicationData.analysisResults)}
            - Challenge Answer: """${this.state.applicationData.interactiveChallenge.answer}"""
            - Interview Transcript: """${interviewSummary}"""
            Your response MUST be a single JSON object with the following structure. Do not add any text before or after the JSON.
            {
                "finalScore": <overall numeric score 0-100>,
                "performanceCategory": "<One of: 'أداء متميز', 'أداء جيد', 'يحتاج إلى تحسين', 'أداء ضعيف'>",
                "strengths": ["<Strength 1>", "<Strength 2>"],
                "improvements": ["<Improvement 1>", "<Improvement 2>"],
                "personalityAnalysis": {
                    "summary": "<Personality analysis summary>",
                    "disclaimer": "هذا التحليل تجريبي ومبني على الأسلوب اللغوي فقط ولا يمثل تقييماً نفسياً قاطعاً."
                },
                "salaryAnalysis": "<Salary analysis>",
                "marketBenchmark": "<Market benchmark statement>",
                "careerRoadmap": [
                    { "path": "<Career path 1>", "skills": "<Skills for path 1>" },
                    { "path": "<Career path 2>", "skills": "<Skills for path 2>" }
                ],
                "finalVerdict": "<Final verdict>"
            }
            `;
            const reportData = await this.callGroqAPI(prompt);
            this.state.applicationData.finalReport = reportData;
            this.displayFinalReport(reportData);
        } catch (error) {
            console.error("Report Generation Error:", error);
            this.showNotification(`فشل إنشاء التقرير: ${error.message}. سيتم استخدام بيانات تجريبية.`, 'error');
            this.state.applicationData.finalReport = {
                finalScore: 45,
                performanceCategory: 'أداء ضعيف',
                strengths: ["إظهار الرغبة في التعلم", "إكمال جميع خطوات التقديم بنجاح"],
                improvements: ["الحاجة لمراجعة أساسيات التخصص بشكل أعمق", "التدرب على حل المشكلات بشكل منهجي", "تحسين مهارات التواصل الكتابي لتكون أكثر احترافية"],
                personalityAnalysis: {
                    summary: "يظهر المرشح حماساً، لكن الإجابات تفتقر إلى العمق والخبرة العملية الكافية حالياً.",
                    disclaimer: "هذا التحليل تجريبي ومبني على الأسلوب اللغوي فقط ولا يمثل تقييماً نفسياً قاطعاً."
                },
                salaryAnalysis: "الراتب المتوقع أعلى من متوسط السوق للمهارات المعروضة حالياً. قد يكون من المفيد إعادة تقييمه بعد اكتساب المزيد من الخبرة.",
                marketBenchmark: "توجد فجوة واضحة في المهارات التقنية الأساسية مقارنة بمتطلبات السوق الحالية لهذا الدور.",
                careerRoadmap: [
                    { path: "فترة تدريبية (Internship)", skills: "دورات أساسية في علوم الحاسب, بناء مشاريع شخصية بسيطة" },
                    { path: "دعم فني مبتدئ", skills: "شهادات مثل CompTIA A+, مهارات خدمة العملاء" }
                ],
                finalVerdict: "في الوقت الحالي، هناك فجوات كبيرة بين مؤهلاتك ومتطلبات الدور. نوصي بالتركيز على مجالات التطوير المذكورة وبناء قاعدة معرفية صلبة قبل التقدم مرة أخرى لوظائف مماثلة."
            };
            this.displayFinalReport(this.state.applicationData.finalReport);
        } finally {
            document.getElementById('reportLoadingState').style.display = 'none';
            document.getElementById('reportContainer').style.display = 'block';
            document.getElementById('reportActions').style.display = 'flex';
        }
    };
    this.displayFinalReport = (data) => {
        const basicInfo = this.state.applicationData.basicInfo;
        const analysis = this.state.applicationData.analysisResults;
        let verdictCardStyle = "background-color: color-mix(in srgb, var(--primary) 10%, transparent); border-color: var(--primary);";
        let finalVerdictIcon = "fa-gavel";
        if (data.performanceCategory === 'يحتاج إلى تحسين') {
            verdictCardStyle = "background-color: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent);";
            finalVerdictIcon = "fa-exclamation-triangle";
        } else if (data.performanceCategory === 'أداء ضعيف') {
            const errorColor = '#ef4444';
            verdictCardStyle = `background-color: color-mix(in srgb, ${errorColor} 15%, transparent); border-color: ${errorColor};`;
            finalVerdictIcon = "fa-times-circle";
        }
        const reportHTML = `
        <div id="pdf-report">
            <div class="bai-inline-0090">
                <h2 style="color: var(--primary); font-size: 1.2rem;">التقرير التقييمي الشامل</h2>
                <p>المرشح: ${basicInfo.fullName}</p>
            </div>
            <div class="report-grid">
                <div class="report-item"><h4><i class="fas fa-bullseye"></i> النتيجة النهائية</h4><p>${data.finalScore}%</p></div>
                <div class="report-item"><h4><i class="fas fa-signal"></i> مستوى الأداء</h4><p>${data.performanceCategory || 'N/A'}</p></div>
                <div class="report-item"><h4><i class="fas fa-file-signature"></i> تطابق السيرة</h4><p>${analysis.matchScore || 'N/A'}%</p></div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-money-bill-wave"></i> تحليل الراتب المتوقع</h3>
                <p>${data.salaryAnalysis}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-chart-simple"></i> موقعك في السوق</h3>
                <p>${data.marketBenchmark}</p>
            </div>
            <div class="report-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
                <div class="detail-card">
                    <h3><i class="fas fa-star"></i> نقاط القوة</h3>
                    <ul>${data.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div class="detail-card">
                    <h3><i class="fas fa-arrow-up"></i> مجالات التطوير</h3>
                    <ul>${data.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-user-secret"></i> تحليل الأسلوب والشخصية (تجريبي)</h3>
                <p>${data.personalityAnalysis.summary}</p>
                <p class="disclaimer">${data.personalityAnalysis.disclaimer}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-road"></i> مستكشف المسار الوظيفي</h3>
                <div class="career-path-explorer">
                    ${data.careerRoadmap.map(r => `
                    <div class="career-path-node">
                        <h4>${r.path}</h4>
                        <p><strong>المهارات المطلوبة:</strong> ${r.skills}</p>
                    </div>`).join('')}
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem; ${verdictCardStyle}">
                <h3><i class="fas ${finalVerdictIcon}"></i> القرار النهائي</h3>
                <p>${data.finalVerdict}</p>
            </div>
        </div>
        `;
        document.getElementById('reportContainer').innerHTML = reportHTML;
        this.unlockAchievement('خارطة الطريق المهنية', 'لقد حصلت على تقريرك الشامل وتوصياتك المستقبلية!');
    };
    this.downloadReport = async () => {
        const { html2canvas: html2canvasLib, jspdf } = await this.ensurePdfExportLibs();
        const { jsPDF } = jspdf;
        const reportElement = document.getElementById('pdf-report');
        this.showNotification('جاري إعداد التقرير للتحميل...', 'success');
        const canvas = await html2canvasLib(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-content'),
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`تقرير-${this.state.applicationData.basicInfo.fullName}.pdf`);
    };
    this.submitApplication = () => {
        const allApplications = JSON.parse(localStorage.getItem('submittedApplications')) || [];
        const basicInfo = this.state.applicationData.basicInfo;
        const contactInfo = { email: basicInfo.email, phone: basicInfo.phone };
        const cvText = this.state.applicationData.cvContent || this.state.applicationData.cvText || '';
        const adminState = { isFavorite: false, isArchived: false, notes: '' };
        allApplications.push({
            id: Date.now(),
            submittedAt: new Date().toISOString(),
            ...this.state.applicationData,
            contactInfo,
            cvText,
            adminState
        });
        localStorage.setItem('submittedApplications', JSON.stringify(allApplications));
        localStorage.removeItem('appState');
        this.showNotification('تم إرسال طلبك بنجاح! نتمنى لك كل التوفيق.', 'success');
        setTimeout(() => window.location.reload(), 3000);
    };
    this.showNotification = (message, type = 'success') => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'times-circle'}"></i> ${message}`;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 5000);
        }, 5000);
    };
    this.assistantSpeakForStep = (step) => {
        const persona = this.state.persona;
        const insight = this.config.marketInsights[persona] || '';
        const messages = {
            1: "أهلاً بك! لنبدأ معًا هذه الرحلة. أولاً، بعض المعلومات الأساسية عنك.",
            2: `ممتاز! الآن، الخطوة المحورية: سيرتك الذاتية. تذكر، هذه فرصتك لتلمع. ${insight}`,
            3: "رائع! لقد استلمت الملف. سأقوم الآن بتشغيل محركاتي التحليلية. قد يستغرق هذا بضع لحظات.",
            4: "تحليل مثير للاهتمام! الآن لنر كيف تطبق مهاراتك على أرض الواقع. لقد أعددت لك تحدياً عملياً قصيراً.",
            5: `إجابة مدروسة! الآن، بناءً على كل ما سبق، حان وقت المقابلة. تذكر، الهدف هو فهم طريقة تفكيرك. ${persona === 'developer' ? 'فكر فيها كجلسة pair programming.' : 'فكر فيها كجلسة عصف ذهني.'}`,
            6: "لقد اكتمل التقييم! عمل رائع. أنا الآن أقوم بتجميع تقريرك الشامل وخارطة طريقك المهنية."
        };
        if (messages[step]) {
            this.assistantSpeak(messages[step]);
        }
    };
    this.assistantSpeak = (message) => {
        this.dom.aiAssistantMessage.textContent = message;
        this.dom.aiAssistant.classList.add('show');
        setTimeout(() => {
            this.dom.aiAssistant.classList.remove('show');
        }, 8000);
    };

};

// --- Instantiate and run the app ---
// Hero Section JavaScript
function initHeroSection() {
    // CTA Button Functionality
    const ctaButton = document.getElementById('ctaButton');
    const paperPlane = document.getElementById('paperPlane');

    if (ctaButton) {
        ctaButton.addEventListener('click', (e) => {
            // Create ripple effect
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            const rect = ctaButton.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
            ctaButton.appendChild(ripple);

            // Paper plane animation
            if (paperPlane) {
                paperPlane.classList.add('fly');
            }

            // Scroll to main content
            setTimeout(() => {
                ripple.remove();
                if (paperPlane) paperPlane.classList.remove('fly');
                document.querySelector('.container').scrollIntoView({
                    behavior: 'smooth'
                });
            }, 1000);
        });
    }

    // Vacancy Chips Animation
    const vacancyChips = document.getElementById('vacancyChips');
    const mockJobs = [
        'مطور React', 'مصمم UI/UX', 'محلل بيانات', 'مدير منتج',
        'مطور Node.js', 'مصمم جرافيك', 'مهندس ذكاء اصطناعي', 'مدير مشروع'
    ];

    function updateChips() {
        if (!vacancyChips) return;
        const chips = vacancyChips.querySelectorAll('.chip');
        chips.forEach((chip, index) => {
            setTimeout(() => {
                chip.style.transform = 'translateX(100px)';
                chip.style.opacity = '0';

                setTimeout(() => {
                    chip.textContent = mockJobs[Math.floor(Math.random() * mockJobs.length)];
                    chip.style.transform = 'translateX(0)';
                    chip.style.opacity = '1';
                }, 300);
            }, index * 100);
        });
    }

    // Update chips every 5 seconds
    setInterval(updateChips, 5000);

}

const app = new App();
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    initHeroSection();
});
