const App = function () {
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
                    { id: 1, title: 'The Basics', icon: 'fa-user-plus' },
                    { id: 2, title: 'Resume', icon: 'fa-file-upload' },
                    { id: 3, title: 'Analysis', icon: 'fa-brain' },
                    { id: 4, title: 'Challenge', icon: 'fa-puzzle-piece' },
                    { id: 5, title: 'Interview', icon: 'fa-comments' },
                    { id: 6, title: 'Report', icon: 'fa-chart-line' },
                ],
                marketInsights: {
                    developer: "Data tip: 70% of successful devs mention Git and CI/CD on their resumes. Make sure you highlight them!",
                    designer: "Data tip: 90% of hired designers link their portfolio. Don't forget yours!",
                    marketer: "Data tip: Marketers who drop real numbers (like 'boosted sales by X%') grab way more attention."
                },
                powerWords: ['قُدت', 'طوّرت', 'أدرت', 'حققت', 'أنجزت', 'أسست', 'زدت', 'حسّنت', 'خفضت', 'ابتكرت', 'led', 'managed', 'developed', 'achieved', 'increased', 'decreased', 'improved', 'founded', 'innovated', 'built', 'created', 'driven', 'launched']
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
                    this.showNotification('Heads up: Groq API key is invalid. AI features won\'t work.', 'error');
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
                const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
                if (!allowedMimeTypes.includes(file.type)) { this.showNotification('Unsupported file type. Please upload a PDF, DOCX, DOC, TXT, or MD.', 'error'); return; }
                if (file.size > 10 * 1024 * 1024) { this.showNotification('File is way too big (Max 10MB).', 'error'); return; }
                this.state.applicationData.cvFile = file;
                try {
                    this.showNotification('Processing your file...', 'success');
                    let extractedText = '';
                    switch (file.type) {
                        case 'application/pdf': extractedText = await this.extractTextFromPDF(file); break;
                        case 'application/msword': case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': extractedText = await this.extractTextFromWord(file); break;
                        case 'text/plain': case 'text/markdown': extractedText = await this.extractTextFromPlain(file); break;
                    }
                    this.state.applicationData.cvContent = extractedText;
                    this.showFileInfo(file);
                    document.getElementById('analyzeBtn').disabled = false;
                    this.showNotification('File uploaded successfully. Ready to analyze.', 'success');
                    this.unlockAchievement('The Golden Ticket', 'Resume uploaded and ready for analysis!');
                } catch (error) { console.error('File Processing Error:', error); this.showNotification('Oops, something went wrong processing the file. It might be corrupted.', 'error'); this.removeFile(); }
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
                const runtimeConfig = (typeof window !== 'undefined' && window.BrightAIRuntimeConfig) || null;
                const gateway = (typeof window !== 'undefined' && window.BrightAIGateway) || null;
                const url = runtimeConfig && typeof runtimeConfig.buildApiUrl === 'function'
                    ? runtimeConfig.buildApiUrl('/api/ai/openai-chat')
                    : gateway && typeof gateway.buildUrl === 'function'
                        ? gateway.buildUrl('/api/ai/openai-chat')
                        : (() => { throw new Error('Unable to resolve the BrightAI API base. Load runtime-config.js before en-interview-app.js.'); })();
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
            You are a professional American career coach. Your task is to analyze the provided CV and respond ONLY with a valid JSON object.
            The entire JSON object values must be in conversational American English. Keep keys exact.

            CONTEXT:
            - Candidate's Specialization: ${this.state.applicationData.basicInfo.specialization}
            - Candidate's Years of Experience: ${this.state.applicationData.basicInfo.experience}
            - Target Job Description (if any): """${this.state.applicationData.basicInfo.jobDescription || 'General analysis for their specialization'}"""
            - CV_TEXT: """${this.state.applicationData.cvContent}"""

            Your response MUST be a single JSON object with the following structure. Do not add any text before or after the JSON object.
            {
              "matchScore": <number from 0-100>,
              "skillsAnalysis": { "Skill 1": <score>, "Skill 2": <score> },
              "summary": "<A 2-3 sentence summary in conversational American English>",
              "improvements":[
                  { "original": "<A weak area from the CV>", "suggestion": "<An improvement suggestion>" },
                  { "original": "Strategic Tip", "suggestion": "<A strategic tip in conversational American English>" }
              ],
              "professionalSummary": "<A compelling 3-4 line professional summary in first person, in conversational American English>",
              "suggestedJobs": ["<job_title_1>", "<job_title_2>"]
            }
            `;
                    const analysisData = await this.callGroqAPI(prompt);
                    this.state.applicationData.analysisResults = analysisData;
                    await this.displayAnalysisResults(analysisData);
                    this.unlockAchievement('Resume Hacker', 'Your resume just got analyzed by our awesome ai tools!');

                } catch (error) {
                    console.error("AI Analysis Error:", error);
                    this.showNotification(`AI Analysis failed: ${error.message}. Using demo data instead.`, 'error');
                    await this.displayAnalysisResults({
                        matchScore: 78,
                        skillsAnalysis: { "Data Analysis": 85, "Communication": 90, "Project Management": 75, "Problem Solving": 88, "Leadership": 70 },
                        summary: "Strong candidate with solid experience and killer communication skills. Your resume shows a great foundation we can totally build on.",
                        improvements: [{ original: "I was responsible for the team.", suggestion: "Led a 5-person team, bumping up productivity by 20%." }, { original: "Strategic Tip", suggestion: "Think about adding a 'Major Projects' section to show off your biggest wins." }],
                        professionalSummary: "I'm a seasoned pro with over 5 years in the game. Known for leading teams and crushing goals. Looking to bring my skills to a challenging role that helps the company grow.",
                        suggestedJobs: ["Product Manager", "Business Analyst", "Strategy Consultant"]
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
            Your entire response MUST be a single, valid JSON object, and all text content within the JSON must be in conversational American English.

            CANDIDATE PROFILE:
            - Specialization: ${this.state.applicationData.basicInfo.specialization}
            - CV Summary: ${this.state.applicationData.analysisResults.summary}

            Based on the profile, create a realistic, single-paragraph scenario.
            The JSON object must have this exact structure:
            {
              "title": "<A short, engaging title for the challenge>",
              "scenario": "<The detailed scenario text>"
            }
            Do not add any text before or after the JSON.
            `;
                    const challengeData = await this.callGroqAPI(prompt);
                    this.state.applicationData.interactiveChallenge.scenario = challengeData;
                    this.displayChallenge(challengeData);
                } catch (error) {
                    console.error("Challenge Generation Error:", error);
                    this.showNotification(`Challenge generation failed: ${error.message}. Using a generic scenario instead.`, 'error');
                    const fallbackChallenge = { title: "Scenario: Managing an Unexpected Crisis", scenario: "Imagine you're grinding on a major project with a hard deadline in two days. Suddenly, a key team member tells you they have a family emergency and have to dip. What are the first three steps you take to handle this and keep things on track?" };
                    this.state.applicationData.interactiveChallenge.scenario = fallbackChallenge;
                    this.displayChallenge(fallbackChallenge);
                } finally {
                    document.getElementById('challengeLoadingState').style.display = 'none';
                    document.getElementById('challengeContent').style.display = 'block';
                }
            };

            this.interview = {
                mediaRecorder: null, audioChunks: [], isRecording: false,
                init: async function () {
                    const parent = app;
                    const warmupAccepted = await parent.showInterviewModal('warmup');
                    if (!warmupAccepted) { parent.assistantSpeak("No worries, let's dive straight into the interview. Good luck!"); }
                    document.getElementById('interviewLoadingState').style.display = 'block';
                    document.getElementById('questionCard').style.display = 'none';
                    document.getElementById('realTimeCoaching').style.display = 'flex';
                    const interviewState = parent.state.applicationData.interview;
                    try {
                        const prompt = `
                You are an expert interviewer AI. Your task is to generate 5 insightful interview questions in conversational American English.
                Your entire response MUST be a single, valid JSON object with a key "questions" containing an array of 5 strings.

                CANDIDATE CONTEXT:
                - Specialization: "${parent.state.applicationData.basicInfo.specialization}"
                - CV Analysis Summary: "${parent.state.applicationData.analysisResults.summary}"
                - Candidate's challenge answer: """${parent.state.applicationData.interactiveChallenge.answer}"""

                Generate 5 diverse questions (behavioral, technical, situational) based on all the context.
                One question should be a direct follow-up to their challenge answer.

                Example of required output:
                {
                  "questions":[
                    "Question 1",
                    "Question 2",
                    "Question 3",
                    "Question 4",
                    "Question 5"
                  ]
                }
                Do not add any text before or after the JSON object.
                `;
                        const questionsObj = await parent.callGroqAPI(prompt);
                        interviewState.questions = questionsObj.questions;
                    } catch (error) {
                        console.error("Interview questions generation failed:", error);
                        parent.showNotification(`Custom question generation failed: ${error.message}. Using generic questions.`, 'error');
                        interviewState.questions = ["What are your biggest career wins that you're super proud of?", "Tell us about a tough challenge you faced and how you handled it.", "Where do you see yourself in 5 years?", "How do you stay on top of new trends in your field?", "Why do you think you're the best fit for this gig?"];
                    }
                    interviewState.answers = new Array(interviewState.questions.length).fill(null).map(() => ({ text: '', audioUrl: null }));
                    interviewState.currentQuestion = 0;
                    document.getElementById('interviewLoadingState').style.display = 'none';
                    document.getElementById('questionCard').style.display = 'block';
                    this.displayCurrentQuestion();
                },
                displayCurrentQuestion: function () {
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
                saveCurrentAnswer: function () {
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    const qIndex = interviewState.currentQuestion;
                    if (!interviewState.answers[qIndex]) {
                        interviewState.answers[qIndex] = { text: '', audioUrl: null };
                    }
                    interviewState.answers[qIndex].text = document.getElementById('textAnswer').value;
                    parent.saveState();
                },
                nextQuestion: function () {
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    this.saveCurrentAnswer();
                    if (interviewState.currentQuestion < interviewState.questions.length - 1) {
                        interviewState.currentQuestion++;
                        this.displayCurrentQuestion();
                    }
                },
                previousQuestion: function () {
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    this.saveCurrentAnswer();
                    if (interviewState.currentQuestion > 0) {
                        interviewState.currentQuestion--;
                        this.displayCurrentQuestion();
                    }
                },
                finishInterview: async function () {
                    this.saveCurrentAnswer();
                    app.unlockAchievement('Smooth Talker', 'You absolutely nailed the interactive interview!');
                    const debriefDone = await app.showInterviewModal('debrief');
                    app.nextStep();
                },
                updateNavButtons: function () {
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    const qIndex = interviewState.currentQuestion;
                    document.getElementById('prevQuestionBtn').disabled = qIndex === 0;
                    const isLast = qIndex === interviewState.questions.length - 1;
                    document.getElementById('nextQuestionBtn').style.display = isLast ? 'none' : 'inline-flex';
                    document.getElementById('finishInterviewBtn').style.display = isLast ? 'inline-flex' : 'none';
                },
                toggleRecording: async function () {
                    if (this.isRecording) {
                        this.stopRecording();
                    } else {
                        await this.startRecording();
                    }
                },
                startRecording: async function () {
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
                            document.getElementById('recordingStatus').textContent = 'Recording saved.';
                        };
                        this.mediaRecorder.start();
                        this.isRecording = true;
                        const recordBtn = document.getElementById('recordBtn');
                        recordBtn.classList.add('recording');
                        recordBtn.innerHTML = '<i class="fas fa-stop"></i> Stop Recording';
                        document.getElementById('recordingStatus').textContent = 'Recording...';
                    } catch (err) {
                        app.showNotification('Cannot access the microphone.', 'error');
                    }
                },
                stopRecording: function () {
                    if (this.mediaRecorder) {
                        this.mediaRecorder.stop();
                        this.isRecording = false;
                        if (this.mediaRecorder.stream) {
                            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                        }
                        const recordBtn = document.getElementById('recordBtn');
                        recordBtn.classList.remove('recording');
                        recordBtn.innerHTML = '<i class="fas fa-microphone"></i> Start Recording';
                    }
                },
                resetAudio: function () {
                    this.stopRecording();
                    const parent = app;
                    const interviewState = parent.state.applicationData.interview;
                    const audioUrl = interviewState.answers[interviewState.currentQuestion]?.audioUrl;
                    const audioPlayback = document.getElementById('audioPlayback');
                    if (audioUrl) {
                        audioPlayback.src = audioUrl;
                        audioPlayback.style.display = 'block';
                        document.getElementById('recordingStatus').textContent = 'Saved recording available.';
                    } else {
                        audioPlayback.style.display = 'none';
                        audioPlayback.src = '';
                        document.getElementById('recordingStatus').textContent = '';
                    }
                },
                updateRealTimeCoaching: function () {
                    const text = app.dom.textAnswerTextarea.value;
                    const wordCount = text.split(/\s+/).filter(Boolean).length;
                    let brevityStatus = 'Awesome';
                    if (wordCount > 100) brevityStatus = 'Way too long';
                    else if (wordCount > 60) brevityStatus = 'A bit long';
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
                let message = "Welcome to the smart hiring portal! I'm here to guide you on your journey.";
                if (name.trim() !== '') {
                    if (persona === 'developer') {
                        message = `Hey ${name}! Get ready to code your way into your next gig.`;
                    } else if (persona === 'designer') {
                        message = `Welcome, ${name}! Let's design a bright future for your career together.`;
                    } else if (persona === 'marketer') {
                        message = `${name} recruitment campaign has launched! Welcome, let's get the best ROI on your skills.`;
                    } else {
                        message = `Hey ${name}! Stoked to be your guide today.`;
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
                    this.showNotification('Successfully resumed your app. Welcome back!', 'success');
                }
                this.dom.resumeModal.classList.remove('show');
            };
            this.clearStateAndHideModal = () => {
                localStorage.removeItem('appState');
                this.dom.resumeModal.classList.remove('show');
                window.location.reload();
            };
            this.startNew = () => {
                if (confirm('Wanna wipe all your current data and start fresh? No going back once you do.')) {
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
                if (currentStepElement) currentStepElement.classList.add('active');
                this.updateProgressBar();
                this.assistantSpeakForStep(step);
                this.saveState();
                switch (step) {
                    case 3: this.startAnalysis(); break;
                    case 4: this.generateChallenge(); break;
                    case 5: this.interview.init(); break;
                    case 6: this.generateFinalReport(); break;
                }
            };
            this.nextStep = () => {
                if (this.state.currentStep < this.state.totalSteps) {
                    if (this.state.currentStep === 1) {
                        this.unlockAchievement('First Steps', 'You successfully filled out your basic info!');
                    }
                    if (this.state.currentStep === 4) {
                        this.state.applicationData.interactiveChallenge.answer = document.getElementById('challengeAnswer').value;
                        this.unlockAchievement('Strategic Thinker', 'You crushed the practical challenge!');
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
                document.getElementById('cvImprovements').innerHTML = `<ul>${data.improvements.map(i => `<li><strong>Original/Tip:</strong> ${i.original}<br><strong>Suggestion:</strong> ${i.suggestion}</li>`).join('')}</ul>`;
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
                            label: 'Skill Evaluation',
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
                                text: `Job Match: ${matchScore}%`,
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
                <h2><i class="fas fa-mug-hot"></i> Pre-Interview Warmup</h2>
                <p>I know interviews can be stressful. Before we start, how about a quick warmup? Tell me about something fun you learned this week outside of work.</p>
                <p class="disclaimer">This question is just to help you chill out and won't be graded.</p>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="skipWarmup">Skip Warmup</button>
                    <button class="btn btn-primary" id="startWarmup">Start Warmup</button>
                </div>`;
                        this.dom.interviewModalContent.innerHTML = content;
                        document.getElementById('skipWarmup').onclick = () => closeModal(false);
                        document.getElementById('startWarmup').onclick = () => {
                            this.assistantSpeak('Awesome! Take your time. When you\'re ready, we can kick off the official questions.');
                            this.dom.interviewModalContent.innerHTML = `
                    <h2><i class="fas fa-coffee"></i> Warmup Question</h2>
                    <p>Tell me about something fun you learned this week outside of work.</p>
                    <div class="form-group full-width" style="margin-top: 1rem; text-align: left;">
                        <textarea id="warmupAnswer" rows="4" placeholder="Type here..." class="form-group textarea"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" id="finishWarmup">I'm ready, let's start the interview</button>
                    </div>
                    `;
                            document.getElementById('finishWarmup').onclick = () => closeModal(true);
                        };
                    } else if (type === 'debrief') {
                        content = `
                <h2><i class="fas fa-award"></i> Stellar Performance!</h2>
                <p>You crushed the interview. How do you feel about your answers? Take a sec to think it over.</p>
                <p class="disclaimer">Reflecting on your performance is a killer skill on its own.</p>
                <div class="form-actions">
                    <button class="btn btn-primary" id="viewReport">View My Final Report</button>
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
                    const interviewSummary = this.state.applicationData.interview.answers.map((ans, i) => `Q${i + 1}: ${this.state.applicationData.interview.questions[i]}\nA: ${ans.text || '(No text answer)'}`).join('\n---\n');
                    const prompt = `
            You are a professional American career coach. Your task is to generate a final report and respond ONLY with a valid JSON object. The entire JSON object, including all values, must be in conversational American English. Keep keys exact.
            CANDIDATE'S FULL DATA:
            - Basic Info: ${JSON.stringify(this.state.applicationData.basicInfo)}
            - CV Analysis: ${JSON.stringify(this.state.applicationData.analysisResults)}
            - Challenge Answer: """${this.state.applicationData.interactiveChallenge.answer}"""
            - Interview Transcript: """${interviewSummary}"""
            Your response MUST be a single JSON object with the following structure. Do not add any text before or after the JSON.
            {
                "finalScore": <overall numeric score 0-100>,
                "performanceCategory": "<One of: 'Outstanding', 'Good Job', 'Needs Improvement', 'Poor Performance'>",
                "strengths": ["<Strength 1>", "<Strength 2>"],
                "improvements":["<Improvement 1>", "<Improvement 2>"],
                "personalityAnalysis": {
                    "summary": "<Personality analysis summary>",
                    "disclaimer": "This is just a test analysis based on language style, not a legit psychological eval."
                },
                "salaryAnalysis": "<Salary analysis>",
                "marketBenchmark": "<Market benchmark statement>",
                "careerRoadmap":[
                    { "roleTitle": "Career track 1", "skills": "Suggested skills for track 1" },
                    { "roleTitle": "Career track 2", "skills": "Suggested skills for track 2" }
                ],
                "finalVerdict": "<Final verdict>"
            }
            `;
                    const reportData = await this.callGroqAPI(prompt);
                    this.state.applicationData.finalReport = reportData;
                    this.displayFinalReport(reportData);
                } catch (error) {
                    console.error("Report Generation Error:", error);
                    this.showNotification(`Report generation failed: ${error.message}. Using demo data.`, 'error');
                    this.state.applicationData.finalReport = {
                        finalScore: 45,
                        performanceCategory: 'Poor Performance',
                        strengths: ["Shown a willingness to learn", "Successfully finished all application steps"],
                        improvements: ["Need to dive deeper into the core basics of your major", "Practice solving problems more systematically", "Brush up on your written communication to sound more pro"],
                        personalityAnalysis: {
                            summary: "The candidate is super hyped, but the answers lack a bit of depth and real-world experience right now.",
                            disclaimer: "This is just a test analysis based on language style, not a legit psychological eval."
                        },
                        salaryAnalysis: "Your expected salary is a bit higher than the market average for your current skills. Might want to reassess after gaining more experience.",
                        marketBenchmark: "There's a noticeable gap in core tech skills compared to what the market is looking for right now.",
                        careerRoadmap: [
                            { roleTitle: "Technical internship", skills: "Basic CS courses, building some personal projects" },
                            { roleTitle: "Junior technical support", skills: "Certs like CompTIA A+, customer service skills" }
                        ],
                        finalVerdict: "Right now, there's a pretty big gap between your skills and the role's requirements. We totally recommend focusing on those areas for improvement and building a solid foundation before applying for similar gigs."
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
                if (data.performanceCategory === 'Needs Improvement') {
                    verdictCardStyle = "background-color: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent);";
                    finalVerdictIcon = "fa-exclamation-triangle";
                } else if (data.performanceCategory === 'Poor Performance') {
                    const errorColor = '#ef4444';
                    verdictCardStyle = `background-color: color-mix(in srgb, ${errorColor} 15%, transparent); border-color: ${errorColor};`;
                    finalVerdictIcon = "fa-times-circle";
                }
                const reportHTML = `
        <div id="pdf-report">
            <div class="bai-inline-0090">
                <h2 style="color: var(--primary); font-size: 1.2rem;">Comprehensive Eval Report</h2>
                <p>Candidate: ${basicInfo.fullName}</p>
            </div>
            <div class="report-grid">
                <div class="report-item"><h4><i class="fas fa-bullseye"></i> Final Score</h4><p>${data.finalScore}%</p></div>
                <div class="report-item"><h4><i class="fas fa-signal"></i> Performance Level</h4><p>${data.performanceCategory || 'N/A'}</p></div>
                <div class="report-item"><h4><i class="fas fa-file-signature"></i> Resume Match</h4><p>${analysis.matchScore || 'N/A'}%</p></div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-money-bill-wave"></i> Expected Salary Analysis</h3>
                <p>${data.salaryAnalysis}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-chart-simple"></i> Where You Stand in the Market</h3>
                <p>${data.marketBenchmark}</p>
            </div>
            <div class="report-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
                <div class="detail-card">
                    <h3><i class="fas fa-star"></i> Strengths</h3>
                    <ul>${data.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                </div>
                <div class="detail-card">
                    <h3><i class="fas fa-arrow-up"></i> Areas for Growth</h3>
                    <ul>${data.improvements.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-user-secret"></i> Style & Personality Analysis (Beta)</h3>
                <p>${data.personalityAnalysis.summary}</p>
                <p class="disclaimer">${data.personalityAnalysis.disclaimer}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-road"></i> Career Path Explorer</h3>
                <div class="career-path-explorer">
                    ${data.careerRoadmap.map(r => `
                    <div class="career-path-node">
                        <h4>${r.roleTitle || r.path}</h4>
                        <p><strong>Required Skills:</strong> ${r.skills}</p>
                    </div>`).join('')}
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem; ${verdictCardStyle}">
                <h3><i class="fas ${finalVerdictIcon}"></i> Final Verdict</h3>
                <p>${data.finalVerdict}</p>
            </div>
        </div>
        `;
                document.getElementById('reportContainer').innerHTML = reportHTML;
                this.unlockAchievement('Career Roadmap', 'You got your comprehensive report and future recs!');
            };
            this.downloadReport = async () => {
                const { html2canvas: html2canvasLib, jspdf } = await this.ensurePdfExportLibs();
                const { jsPDF } = jspdf;
                const reportElement = document.getElementById('pdf-report');
                this.showNotification('Prepping your report for download...', 'success');
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
                pdf.save(`Report-${this.state.applicationData.basicInfo.fullName}.pdf`);
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
                this.showNotification('Your app has been successfully submitted! Best of luck.', 'success');
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
                    1: "Hey! Let's get this journey started. First off, just some basic info about you.",
                    2: `Awesome! Now for the big step: your resume. Remember, this is your time to shine. ${insight}`,
                    3: "Sweet! Got the file. I'm firing up my analysis engines now. Might take a sec.",
                    4: "Super interesting analysis! Now let's see how you apply those skills in the real world. I've whipped up a quick practical challenge for you.",
                    5: `Thoughtful answer! Based on everything so far, it's interview time. Remember, the goal is to see how you think. ${persona === 'developer' ? 'Think of it as a pair programming session.' : 'Think of it as a brainstorming session.'}`,
                    6: "Evaluation complete! Great job. I'm putting together your full report and career roadmap right now."
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
            // Stardust Particles
            function createStardust() {
                const container = document.getElementById('stardustContainer');
                if (!container) return;

                const particleCount = 50;

                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'stardust';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 15 + 's';
                    particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
                    container.appendChild(particle);
                }
            }

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
                'React Dev', 'UI/UX Designer', 'Data Analyst', 'Product Manager',
                'Node.js Dev', 'Graphic Designer', 'AI Engineer', 'Project Manager'
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

            // Scroll Indicator
            const scrollIndicator = document.getElementById('scrollIndicator');
            if (scrollIndicator) {
                scrollIndicator.addEventListener('click', () => {
                    document.querySelector('.container').scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            }

            // Initialize
            createStardust();

            // Responsive adjustments
            function handleResize() {
                if (window.innerWidth <= 768) {
                    document.querySelectorAll('.orb').forEach(orb => {
                        orb.style.animationDuration = '6s';
                    });
                }
            }

            window.addEventListener('resize', handleResize);
            handleResize();
        }

        const app = new App();
        document.addEventListener('DOMContentLoaded', () => {
            app.init();
            initHeroSection();
        });
