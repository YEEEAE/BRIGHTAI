(() => {
  const h = function() {
    this.state = { currentStep: 1, totalSteps: 6, theme: "light", themeCycle: ["light", "dark", "high-contrast"], persona: "default", achievements: [], applicationData: { basicInfo: {}, cvFile: null, cvContent: "", analysisResults: {}, interactiveChallenge: { scenario: null, answer: "" }, interview: { questions: [], currentQuestion: 0, answers: [], timer: null, timeLeft: 300 }, finalReport: {} } }, this.config = { geminiModel: "gemini-2.5-flash", stateStorageKey: "brightaiInterviewState", legacyStateStorageKey: "appState", submittedStorageKey: "submittedApplications", steps: [{ id: 1, title: "البيانات", icon: "fa-user-plus" }, { id: 2, title: "السيرة الذاتية", icon: "fa-file-upload" }, { id: 3, title: "التحليل", icon: "fa-brain" }, { id: 4, title: "التحدي", icon: "fa-puzzle-piece" }, { id: 5, title: "المقابلة", icon: "fa-comments" }, { id: 6, title: "التقرير", icon: "fa-chart-line" }], marketInsights: { developer: "نصيحة من البيانات: 70% من المطورين الناجحين يذكرون Git و CI/CD في سيرهم الذاتية. تأكد من إبرازها.", designer: "نصيحة من البيانات: 90% من المصممين الذين تم توظيفهم يرفقون رابطًا لمعرض أعمالهم (Portfolio).", marketer: "نصيحة من البيانات: المسوقون الذين يذكرون نتائج رقمية (مثل زيادة المبيعات بنسبة X%) يحصلون على اهتمام أكبر." }, powerWords: ["قُدت", "طوّرت", "أدرت", "حققت", "أنجزت", "أسست", "زدت", "حسّنت", "خفضت", "ابتكرت", "led", "managed", "developed", "achieved", "increased", "decreased", "improved", "founded", "innovated"] }, this.dom = {}, this.init = () => {
      this.dom.progressBar = document.querySelector(".progress-bar"), this.dom.themeToggleBtn = document.getElementById("themeToggleBtn"), this.dom.basicInfoForm = document.getElementById("basicInfoForm"), this.dom.uploadArea = document.getElementById("uploadArea"), this.dom.cvFile = document.getElementById("cvFile"), this.dom.aiAssistant = document.getElementById("aiAssistant"), this.dom.aiAssistantMessage = document.getElementById("aiAssistantMessage"), this.dom.resumeModal = document.getElementById("resumeModal"), this.dom.resumeBtn = document.getElementById("resumeBtn"), this.dom.startNewBtn = document.getElementById("startNewBtn"), this.dom.fullNameInput = document.getElementById("fullName"), this.dom.specializationInput = document.getElementById("specialization"), this.dom.textAnswerTextarea = document.getElementById("textAnswer"), this.dom.interviewModal = document.getElementById("interviewModal"), this.dom.interviewModalContent = document.getElementById("interviewModalContent"), this.setupEventListeners(), this.renderProgressBar(), this.initTheme(), this.checkForSavedState();
    }, this.loadScriptOnce = (u) => (this._externalScriptPromises = this._externalScriptPromises || {}, u ? this._externalScriptPromises[u] ? this._externalScriptPromises[u] : document.querySelector(`script[src="${u}"]`) ? (this._externalScriptPromises[u] = Promise.resolve(), this._externalScriptPromises[u]) : (this._externalScriptPromises[u] = new Promise((t, e) => {
      const i = document.createElement("script");
      i.src = u, i.async = true, i.onload = t, i.onerror = e, document.head.appendChild(i);
    }), this._externalScriptPromises[u]) : Promise.resolve()), this.ensurePdfLib = async () => (window.pdfjsLib || (await this.loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"), window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"), window.pdfjsLib), this.ensureWordLib = async () => (window.mammoth || await this.loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"), window.mammoth), this.ensureChartLib = async () => (window.Chart || await this.loadScriptOnce("https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js"), window.Chart), this.ensurePdfExportLibs = async () => {
      const u = [];
      return window.html2canvas || u.push(this.loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")), window.jspdf || u.push(this.loadScriptOnce("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js")), await Promise.all(u), { html2canvas: window.html2canvas, jspdf: window.jspdf };
    }, this.setupEventListeners = () => {
      this.dom.themeToggleBtn.addEventListener("click", this.toggleTheme), this.dom.basicInfoForm.addEventListener("submit", this.handleBasicInfoSubmit), this.dom.fullNameInput.addEventListener("input", (u) => this.personalizeWelcome(u.target.value)), this.dom.specializationInput.addEventListener("input", (u) => this.adaptiveUI.updatePersona(u.target.value)), this.dom.textAnswerTextarea.addEventListener("input", this.interview.updateRealTimeCoaching), this.dom.uploadArea.addEventListener("click", () => this.dom.cvFile.click()), this.dom.cvFile.addEventListener("change", (u) => this.handleFileSelect(u.target.files[0])), ["dragover", "dragleave", "drop"].forEach((u) => {
        this.dom.uploadArea.addEventListener(u, this.handleDragDrop, false);
      }), this.dom.resumeBtn.addEventListener("click", this.resumeState), this.dom.startNewBtn.addEventListener("click", this.clearStateAndHideModal);
    }, this.handleDragDrop = (u) => {
      u.preventDefault(), u.stopPropagation(), this.dom.uploadArea.classList.remove("dragover"), u.type === "dragover" && this.dom.uploadArea.classList.add("dragover"), u.type === "drop" && this.handleFileSelect(u.dataTransfer.files[0]);
    }, this.handleFileSelect = async (u) => {
      if (u) {
        if (!["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/markdown"].includes(u.type)) {
          this.showNotification("نوع الملف غير مدعوم. يرجى رفع PDF, DOCX, DOC, TXT, أو MD.", "error");
          return;
        }
        if (u.size > 10485760) {
          this.showNotification("حجم الملف كبير جداً (الحد الأقصى 10MB)", "error");
          return;
        }
        this.state.applicationData.cvFile = u;
        try {
          this.showNotification("جاري معالجة الملف...", "success");
          let t = "";
          switch (u.type) {
            case "application/pdf":
              t = await this.extractTextFromPDF(u);
              break;
            case "application/msword":
            case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              t = await this.extractTextFromWord(u);
              break;
            case "text/plain":
            case "text/markdown":
              t = await this.extractTextFromPlain(u);
              break;
          }
          this.state.applicationData.cvContent = t, this.showFileInfo(u), document.getElementById("analyzeBtn").disabled = false, this.showNotification("تم رفع الملف بنجاح. جاهز للتحليل.", "success"), this.unlockAchievement("الوثيقة الأهم", "تم رفع سيرتك الذاتية بنجاح وجاهزة للتحليل!");
        } catch (t) {
          console.error("File Processing Error:", t), this.showNotification("حدث خطأ أثناء معالجة الملف. قد يكون الملف تالفاً.", "error"), this.removeFile();
        }
      }
    }, this.extractTextFromPDF = async (u) => {
      const t = await this.ensurePdfLib(), e = await u.arrayBuffer(), i = await t.getDocument(e).promise;
      let a = "";
      for (let n = 1; n <= i.numPages; n++) {
        const s = await (await i.getPage(n)).getTextContent();
        a += s.items.map((r) => r.str).join(" ");
      }
      return a;
    }, this.extractTextFromWord = async (u) => {
      const t = await this.ensureWordLib(), e = await u.arrayBuffer();
      return (await t.extractRawText({ arrayBuffer: e })).value;
    }, this.extractTextFromPlain = (u) => new Promise((t, e) => {
      const i = new FileReader();
      i.onload = (a) => t(a.target.result), i.onerror = (a) => e(a), i.readAsText(u);
    }), this.showFileInfo = (u) => {
      document.getElementById("fileName").textContent = u.name, document.getElementById("fileSize").textContent = `${(u.size / 1024 / 1024).toFixed(2)} MB`, document.getElementById("fileInfo").style.display = "flex", document.getElementById("uploadArea").style.display = "none";
    }, this.removeFile = () => {
      this.state.applicationData.cvFile = null, this.state.applicationData.cvContent = "", document.getElementById("fileInfo").style.display = "none", document.getElementById("uploadArea").style.display = "block", document.getElementById("analyzeBtn").disabled = true, this.dom.cvFile.value = "";
    }, this._extractJson = (u) => {
      const t = u.match(/```json\s*([\s\S]*?)\s*```/);
      if (t && t[1]) return t[1].trim();
      const e = u.indexOf("{"), i = u.lastIndexOf("}");
      return e >= 0 && i > e ? u.slice(e, i + 1).trim() : u.trim();
    }, this.callGeminiAPI = async (u, t = "structured-json") => {
      var e, i, a, n, s;
      const r = typeof window < "u" && window.BrightAIRuntimeConfig || null, l = typeof window < "u" && window.BrightAIGateway || null, g = r && typeof r.buildApiUrl == "function" ? r.buildApiUrl("/api/ai/openai-chat") : l && typeof l.buildUrl == "function" ? l.buildUrl("/api/ai/openai-chat") : (() => {
        throw new Error("تعذر تحديد عنوان BrightAI API. تأكد من تحميل runtime-config.js قبل interview-app.js.");
      })(), y = { messages: [{ role: "system", content: "Respond with one valid JSON object only. Do not include Markdown fences or commentary." }, { role: "user", content: u }], provider: "gemini", model: this.config.geminiModel, task: t, temperature: 0.25, max_tokens: 4096, top_p: 1, stream: false, response_format: { type: "json_object" } }, d = await fetch(g, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(y) });
      if (!d.ok) {
        const c = await d.json(), m = ((e = c?.error) == null ? void 0 : e.message) || `HTTP error! status: ${d.status}`;
        throw new Error(`Gemini API Error: ${m}`);
      }
      const A = await d.json();
      if (A.choices && (a = (i = A.choices[0]) == null ? void 0 : i.message) != null && a.content) {
        const c = A.choices[0].message.content, m = this._extractJson(c);
        try {
          return JSON.parse(m);
        } catch {
          throw console.error("Failed to parse JSON from Gemini response:", m), new Error("Gemini returned malformed JSON.");
        }
      } else {
        const c = ((s = (n = A.choices) == null ? void 0 : n[0]) == null ? void 0 : s.finish_reason) || "Unknown reason";
        throw new Error(`Gemini call finished unexpectedly. Reason: ${c}.`);
      }
    }, this.startAnalysis = async () => {
      document.getElementById("loadingState").style.display = "block", document.getElementById("analysisResults").style.display = "none";
      try {
        const u = `
            You are a professional Arabic-speaking career coach. Your task is to analyze the provided CV and respond ONLY with a valid JSON object.
            The entire JSON object, including all keys and values, must be in Arabic language and letters.

            CONTEXT:
            - Candidate's Specialization: ${this.state.applicationData.basicInfo.specialization}
            - Candidate's Years of Experience: ${this.state.applicationData.basicInfo.experience}
            - Target Job Description (if any): """${this.state.applicationData.basicInfo.jobDescription || "General analysis for their specialization"}"""
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
            `, t = await this.callGeminiAPI(u, "cv-analysis");
        this.state.applicationData.analysisResults = t, this.saveState(), await this.displayAnalysisResults(t), this.unlockAchievement("خبير تحليل السير", "تم تحليل سيرتك الذاتية بتقنيات الذكاء الاصطناعي!");
      } catch (u) {
        console.error("Gemini Analysis Error:", u), this.showNotification(`تعذر تحليل السيرة عبر Gemini: ${u.message}. سنعرض بيانات تجريبية مؤقتة ويمكنك المحاولة لاحقاً.`, "error"), await this.displayAnalysisResults({ matchScore: 78, skillsAnalysis: { "تحليل البيانات": 85, التواصل: 90, "إدارة المشاريع": 75, "حل المشكلات": 88, القيادة: 70 }, summary: "مرشح قوي يتمتع بخبرة جيدة ومهارات تواصل ممتازة. سيرتك الذاتية تظهر أساساً قوياً يمكن البناء عليه.", improvements: [{ original: "كنت مسؤولاً عن الفريق.", suggestion: "قمت بقيادة فريق من 5 أعضاء، مما أدى لزيادة الإنتاجية بنسبة 20%." }, { original: "نصيحة استراتيجية", suggestion: "فكر في إضافة قسم 'مشاريع رئيسية' لتسليط الضوء على أبرز إنجازاتك بشكل قصصي." }], professionalSummary: "أنا متخصص متمرس أتمتع بخبرة تزيد عن 5 سنوات في مجالي. معروف بقدرتي على قيادة الفرق وتحقيق نتائج ملموسة. أسعى للاستفادة من خبراتي في دور مليء بالتحديات يساهم في نمو المؤسسة.", suggestedJobs: ["مدير منتج", "محلل أعمال", "مستشار استراتيجي"] });
      } finally {
        document.getElementById("loadingState").style.display = "none", document.getElementById("analysisResults").style.display = "block", document.getElementById("challengeBtn").disabled = false;
      }
    }, this.generateChallenge = async () => {
      document.getElementById("challengeLoadingState").style.display = "block", document.getElementById("challengeContent").style.display = "none";
      try {
        const u = `
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
            `, t = await this.callGeminiAPI(u, "challenge");
        this.state.applicationData.interactiveChallenge.scenario = t, this.saveState(), this.displayChallenge(t);
      } catch (u) {
        console.error("Challenge Generation Error:", u), this.showNotification(`تعذر إنشاء التحدي عبر Gemini: ${u.message}. سنستخدم سيناريو عاماً مؤقتاً.`, "error");
        const t = { title: "سيناريو: إدارة أزمة غير متوقعة", scenario: "تخيل أنك تعمل على مشروع مهم مع موعد تسليم نهائي بعد يومين. فجأة، يخبرك عضو رئيسي في الفريق أنه سيضطر للتغيب لظرف طارئ. ما هي الخطوات الثلاث الأولى التي ستتخذها للتعامل مع هذا الموقف وضمان استمرارية العمل؟" };
        this.state.applicationData.interactiveChallenge.scenario = t, this.displayChallenge(t);
      } finally {
        document.getElementById("challengeLoadingState").style.display = "none", document.getElementById("challengeContent").style.display = "block";
      }
    }, this.interview = { mediaRecorder: null, audioChunks: [], isRecording: false, init: async function() {
      const u = o;
      await u.showInterviewModal("warmup") || u.assistantSpeak("لا بأس، لنبدأ المقابلة مباشرة. حظًا موفقًا!"), document.getElementById("interviewLoadingState").style.display = "block", document.getElementById("questionCard").style.display = "none", document.getElementById("realTimeCoaching").style.display = "flex";
      const t = u.state.applicationData.interview;
      try {
        const e = `
                You are an expert interviewer AI. Your task is to generate 5 insightful interview questions in Arabic.
                Your entire response MUST be a single, valid JSON object with a key "questions" containing an array of 5 strings, and all text content within the JSON must be in Arabic.

                CANDIDATE CONTEXT:
                - Specialization: "${u.state.applicationData.basicInfo.specialization}"
                - CV Analysis Summary: "${u.state.applicationData.analysisResults.summary}"
                - Candidate's challenge answer: """${u.state.applicationData.interactiveChallenge.answer}"""

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
                `, i = await u.callGeminiAPI(e, "interview-questions");
        t.questions = Array.isArray(i.questions) && i.questions.length ? i.questions.slice(0, 5) : [], u.saveState();
      } catch (e) {
        console.error("Interview questions generation failed:", e), u.showNotification(`تعذر إنشاء أسئلة مخصصة عبر Gemini: ${e.message}. سنستخدم أسئلة عامة مؤقتة.`, "error"), t.questions = ["ما هي أهم إنجازاتك المهنية التي تفتخر بها؟", "صف تحديًا صعبًا واجهته وكيف تغلبت عليه.", "أين ترى نفسك مهنياً بعد 5 سنوات من الآن؟", "كيف تواكب التطورات الجديدة في مجال عملك؟", "لماذا تعتقد أنك المرشح الأنسب لهذه الفرصة؟"];
      }
      t.answers = new Array(t.questions.length).fill(null).map(() => ({ text: "", audioUrl: null })), t.currentQuestion = 0, u.saveState(), document.getElementById("interviewLoadingState").style.display = "none", document.getElementById("questionCard").style.display = "block", this.displayCurrentQuestion();
    }, displayCurrentQuestion: function() {
      var u;
      const t = o.state.applicationData.interview, e = t.currentQuestion;
      document.getElementById("currentQuestion").textContent = e + 1, document.getElementById("totalQuestions").textContent = t.questions.length, document.getElementById("questionText").textContent = t.questions[e], document.getElementById("textAnswer").value = ((u = t.answers[e]) == null ? void 0 : u.text) || "", this.updateNavButtons(), this.resetAudio(), this.updateRealTimeCoaching();
    }, saveCurrentAnswer: function() {
      const u = o, t = u.state.applicationData.interview, e = t.currentQuestion;
      t.answers[e] || (t.answers[e] = { text: "", audioUrl: null }), t.answers[e].text = document.getElementById("textAnswer").value, u.saveState();
    }, nextQuestion: function() {
      const u = o.state.applicationData.interview;
      this.saveCurrentAnswer(), u.currentQuestion < u.questions.length - 1 && (u.currentQuestion++, this.displayCurrentQuestion());
    }, previousQuestion: function() {
      const u = o.state.applicationData.interview;
      this.saveCurrentAnswer(), u.currentQuestion > 0 && (u.currentQuestion--, this.displayCurrentQuestion());
    }, finishInterview: async function() {
      this.saveCurrentAnswer(), o.unlockAchievement("المحاور البارع", "أكملت المقابلة التفاعلية بنجاح!");
      const u = await o.showInterviewModal("debrief");
      o.nextStep();
    }, updateNavButtons: function() {
      const u = o.state.applicationData.interview, t = u.currentQuestion;
      document.getElementById("prevQuestionBtn").disabled = t === 0;
      const e = t === u.questions.length - 1;
      document.getElementById("nextQuestionBtn").style.display = e ? "none" : "inline-flex", document.getElementById("finishInterviewBtn").style.display = e ? "inline-flex" : "none";
    }, toggleRecording: async function() {
      this.isRecording ? this.stopRecording() : await this.startRecording();
    }, startRecording: async function() {
      try {
        const u = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(u), this.audioChunks = [], this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data), this.mediaRecorder.onstop = () => {
          const e = o.state.applicationData.interview, i = new Blob(this.audioChunks, { type: "audio/wav" }), a = URL.createObjectURL(i);
          e.answers[e.currentQuestion] || (e.answers[e.currentQuestion] = { text: "", audioUrl: null }), e.answers[e.currentQuestion].audioUrl = a, document.getElementById("audioPlayback").src = a, document.getElementById("audioPlayback").style.display = "block", document.getElementById("recordingStatus").textContent = "تم حفظ التسجيل.";
        }, this.mediaRecorder.start(), this.isRecording = true;
        const t = document.getElementById("recordBtn");
        t.classList.add("recording"), t.innerHTML = '<i class="fas fa-stop"></i> إيقاف التسجيل', document.getElementById("recordingStatus").textContent = "جاري التسجيل...";
      } catch {
        o.showNotification("لا يمكن الوصول إلى الميكروفون.", "error");
      }
    }, stopRecording: function() {
      if (this.mediaRecorder) {
        this.mediaRecorder.stop(), this.isRecording = false, this.mediaRecorder.stream && this.mediaRecorder.stream.getTracks().forEach((t) => t.stop());
        const u = document.getElementById("recordBtn");
        u.classList.remove("recording"), u.innerHTML = '<i class="fas fa-microphone"></i> ابدأ التسجيل';
      }
    }, resetAudio: function() {
      var u;
      this.stopRecording();
      const t = o.state.applicationData.interview, e = (u = t.answers[t.currentQuestion]) == null ? void 0 : u.audioUrl, i = document.getElementById("audioPlayback");
      e ? (i.src = e, i.style.display = "block", document.getElementById("recordingStatus").textContent = "يوجد تسجيل محفوظ.") : (i.style.display = "none", i.src = "", document.getElementById("recordingStatus").textContent = "");
    }, updateRealTimeCoaching: function() {
      const u = o.dom.textAnswerTextarea.value, t = u.split(/\s+/).filter(Boolean).length;
      let e = "ممتاز";
      t > 100 ? e = "طويل جدًا" : t > 60 && (e = "طويل"), document.getElementById("brevityMeter").textContent = e;
      const i = u.toLowerCase().split(/\s+/).filter((a) => o.config.powerWords.includes(a)).length;
      document.getElementById("powerWordsMeter").textContent = i;
    } }, this.initTheme = () => {
      const u = localStorage.getItem("theme") || "light";
      this.state.theme = u, document.documentElement.setAttribute("data-theme", u), this.updateThemeIcon();
    }, this.toggleTheme = () => {
      const u = (this.state.themeCycle.indexOf(this.state.theme) + 1) % this.state.themeCycle.length, t = this.state.themeCycle[u];
      this.state.theme = t, localStorage.setItem("theme", this.state.theme), this.initTheme();
    }, this.updateThemeIcon = () => {
      const u = this.dom.themeToggleBtn.querySelector("i"), t = { light: "fa-moon", dark: "fa-sun", "high-contrast": "fa-low-vision" };
      u.className = `fas ${t[this.state.theme]}`;
    }, this.personalizeWelcome = (u) => {
      const t = this.state.persona;
      let e = "أهلاً بك في بوابة التوظيف الذكية! أنا هنا لإرشادك في رحلتك.";
      u.trim() !== "" && (t === "developer" ? e = `أهلاً بك يا ${u}! استعد لكتابة الكود نحو وظيفتك القادمة.` : t === "designer" ? e = `يا ${u}، أهلاً بك! لنصمم معًا لوحة مشرقة لمستقبلك المهني.` : t === "marketer" ? e = `حملة توظيف ${u} انطلقت! أهلاً بك، لنحقق أفضل عائد على الاستثمار في مهاراتك.` : e = `أهلاً بك يا ${u}! يسعدني أن أكون مرشدك اليوم.`), this.assistantSpeak(e);
    }, this.adaptiveUI = { updatePersona: (u) => {
      let t = "default";
      const e = u.toLowerCase();
      e.includes("مطور") || e.includes("مبرمج") || e.includes("developer") || e.includes("engineer") ? t = "developer" : e.includes("مصمم") || e.includes("designer") || e.includes("creative") ? t = "designer" : (e.includes("مسوق") || e.includes("marketer") || e.includes("تسويق")) && (t = "marketer"), this.state.persona !== t && (this.state.persona = t, document.documentElement.setAttribute("data-persona", t), this.personalizeWelcome(this.dom.fullNameInput.value));
    } }, this.saveState = () => {
      try {
        const u = JSON.parse(JSON.stringify(this.state));
        u.applicationData.cvFile && (u.applicationData.cvFile = { name: this.state.applicationData.cvFile.name, size: this.state.applicationData.cvFile.size, type: this.state.applicationData.cvFile.type }), u.savedAt = (/* @__PURE__ */ new Date()).toISOString(), u.version = 2, localStorage.setItem(this.config.stateStorageKey, JSON.stringify(u)), localStorage.setItem(this.config.legacyStateStorageKey, JSON.stringify(u));
      } catch (u) {
        console.error("Failed to save state:", u);
      }
    }, this.checkForSavedState = () => {
      localStorage.getItem(this.config.stateStorageKey) || localStorage.getItem(this.config.legacyStateStorageKey) ? this.dom.resumeModal.classList.add("show") : this.showStep(1);
    }, this.resumeState = () => {
      const u = localStorage.getItem(this.config.stateStorageKey) || localStorage.getItem(this.config.legacyStateStorageKey);
      if (u) try {
        const t = JSON.parse(u);
        Object.assign(this.state, t), this.state.totalSteps = 6, this.state.applicationData = { basicInfo: {}, cvFile: null, cvContent: "", analysisResults: {}, interactiveChallenge: { scenario: null, answer: "" }, interview: { questions: [], currentQuestion: 0, answers: [], timer: null, timeLeft: 300 }, finalReport: {}, ...this.state.applicationData }, this.initTheme(), this.adaptiveUI.updatePersona(this.state.applicationData.basicInfo.specialization || "");
        const e = this.state.applicationData.basicInfo;
        for (const i in e) {
          const a = document.getElementById(i);
          a && (a.value = e[i]);
        }
        this.state.applicationData.cvFile && (this.showFileInfo(this.state.applicationData.cvFile), document.getElementById("analyzeBtn").disabled = false), this.showStep(Math.min(Math.max(Number(this.state.currentStep) || 1, 1), 6)), this.showNotification("تم استئناف طلبك بنجاح. أهلاً بعودتك!", "success");
      } catch (t) {
        console.error("Failed to resume interview state:", t), localStorage.removeItem(this.config.stateStorageKey), localStorage.removeItem(this.config.legacyStateStorageKey), this.showNotification("تعذر استئناف البيانات المحفوظة. سنبدأ رحلة جديدة.", "error"), this.showStep(1);
      }
      this.dom.resumeModal.classList.remove("show");
    }, this.clearStateAndHideModal = () => {
      localStorage.removeItem(this.config.stateStorageKey), localStorage.removeItem(this.config.legacyStateStorageKey), this.dom.resumeModal.classList.remove("show"), window.location.reload();
    }, this.startNew = () => {
      confirm("هل تريد حذف جميع بياناتك الحالية والبدء من جديد؟ لا يمكن التراجع عن هذا الإجراء.") && (localStorage.removeItem(this.config.stateStorageKey), localStorage.removeItem(this.config.legacyStateStorageKey), localStorage.removeItem(this.config.submittedStorageKey), window.location.reload());
    }, this.unlockAchievement = (u, t) => {
      if (this.state.achievements.includes(u)) return;
      this.state.achievements.push(u), this.saveState();
      const e = document.createElement("div");
      e.className = "notification achievement", e.innerHTML = `<i class="fas fa-trophy"></i> <div><span class="achievement-title">${u}</span>${t}</div>`, document.body.appendChild(e), setTimeout(() => e.classList.add("show"), 100), setTimeout(() => {
        e.classList.remove("show"), setTimeout(() => e.remove(), 500);
      }, 6e3);
    }, this.renderProgressBar = () => {
      this.dom.progressBar.innerHTML = this.config.steps.map((u) => `
            <div class="progress-step" data-step="${u.id}">
                <div class="step-circle"><i class="fas ${u.icon}"></i></div>
                <div class="step-title">${u.title}</div>
            </div>
        `).join("");
    }, this.updateProgressBar = () => {
      document.querySelectorAll(".progress-step").forEach((u) => {
        const t = parseInt(u.dataset.step, 10);
        u.classList.remove("active", "completed"), t < this.state.currentStep ? u.classList.add("completed") : t === this.state.currentStep && u.classList.add("active");
      });
    }, this.showStep = (u) => {
      this.state.currentStep = u, document.querySelectorAll(".step-content").forEach((e) => e.classList.remove("active"));
      const t = document.getElementById(`step${u}`);
      switch (t && t.classList.add("active"), this.updateProgressBar(), this.assistantSpeakForStep(u), this.saveState(), u) {
        case 3:
          this.startAnalysis();
          break;
        case 4:
          this.generateChallenge();
          break;
        case 5:
          this.interview.init();
          break;
        case 6:
          this.generateFinalReport();
          break;
      }
    }, this.nextStep = () => {
      this.state.currentStep < this.state.totalSteps && (this.state.currentStep === 1 && this.unlockAchievement("الانطلاقة الأولى", "أكملت بياناتك الأساسية بنجاح!"), this.state.currentStep === 4 && (this.state.applicationData.interactiveChallenge.answer = document.getElementById("challengeAnswer").value, this.unlockAchievement("المفكر الاستراتيجي", "أجبت على التحدي العملي ببراعة!")), this.showStep(this.state.currentStep + 1));
    }, this.previousStep = () => {
      this.state.currentStep > 1 && this.showStep(this.state.currentStep - 1);
    }, this.handleBasicInfoSubmit = (u) => {
      u.preventDefault();
      const t = new FormData(u.target);
      this.state.applicationData.basicInfo = Object.fromEntries(t.entries()), this.nextStep();
    }, this.displayAnalysisResults = async (u) => {
      document.getElementById("analysisSummary").innerHTML = `<p>${u.summary}</p>`, document.getElementById("cvImprovements").innerHTML = `<ul>${u.improvements.map((t) => `<li><strong>الأصل/النصيحة:</strong> ${t.original}<br><strong>الاقتراح:</strong> ${t.suggestion}</li>`).join("")}</ul>`, document.getElementById("professionalSummary").innerHTML = `<p>${u.professionalSummary}</p>`, document.getElementById("suggestedJobs").innerHTML = `<ul>${u.suggestedJobs.map((t) => `<li>${t}</li>`).join("")}</ul>`, await this.renderSkillsChart(u.skillsAnalysis, u.matchScore);
    }, this.renderSkillsChart = async (u, t) => {
      const e = await this.ensureChartLib(), i = document.getElementById("skillsChart");
      e.getChart(i) && e.getChart(i).destroy(), new e(i.getContext("2d"), { type: "radar", data: { labels: Object.keys(u), datasets: [{ label: "تقييم المهارات", data: Object.values(u), backgroundColor: "rgba(46, 139, 87, 0.2)", borderColor: "rgb(46, 139, 87)", pointBackgroundColor: "rgb(46, 139, 87)" }] }, options: { responsive: true, maintainAspectRatio: true, scales: { r: { angleLines: { color: "rgba(128, 128, 128, 0.2)" }, grid: { color: "rgba(128, 128, 128, 0.2)" }, pointLabels: { font: { size: 12, family: "Cairo" }, color: getComputedStyle(document.body).getPropertyValue("--text-secondary") }, ticks: { backdropColor: "transparent", stepSize: 20 }, suggestedMin: 0, suggestedMax: 100 } }, plugins: { legend: { labels: { font: { family: "Cairo" }, color: getComputedStyle(document.body).getPropertyValue("--text-primary") } }, title: { display: true, text: `التطابق مع الوظيفة: ${t}%`, font: { size: 16, family: "Cairo" }, color: getComputedStyle(document.body).getPropertyValue("--text-primary") } } } });
    }, this.displayChallenge = (u) => {
      document.getElementById("challengeTitle").textContent = u.title, document.getElementById("challengeScenario").textContent = u.scenario, document.getElementById("challengeAnswer").value = this.state.applicationData.interactiveChallenge.answer || "";
    }, this.showInterviewModal = (u) => new Promise((t) => {
      let e = "";
      const i = (a) => {
        this.dom.interviewModal.classList.remove("show"), t(a);
      };
      u === "warmup" ? (e = `
                <h2><i class="fas fa-mug-hot"></i> إحماء قبل المقابلة</h2>
                <p>أعلم أن المقابلات قد تكون مرهقة. قبل أن نبدأ، ما رأيك في إحماء سريع؟ أخبرني عن شيء ممتع تعلمته هذا الأسبوع خارج نطاق العمل.</p>
                <p class="disclaimer">هذا السؤال للمساعدة على الاسترخاء فقط ولن يتم تقييمه.</p>
                <div class="form-actions">
                    <button class="btn btn-secondary" id="skipWarmup">تخطِ الإحماء</button>
                    <button class="btn btn-primary" id="startWarmup">ابدأ الإحماء</button>
                </div>`, this.dom.interviewModalContent.innerHTML = e, document.getElementById("skipWarmup").onclick = () => i(false), document.getElementById("startWarmup").onclick = () => {
        this.assistantSpeak("عظيم! خذ وقتك. عندما تكون جاهزاً، يمكننا البدء بالأسئلة الرسمية."), this.dom.interviewModalContent.innerHTML = `
                    <h2><i class="fas fa-coffee"></i> سؤال الإحماء</h2>
                    <p>أخبرني عن شيء ممتع تعلمته هذا الأسبوع خارج نطاق العمل.</p>
                    <div class="form-group full-width" style="margin-top: 1rem; text-align: right;">
                        <textarea id="warmupAnswer" rows="4" placeholder="اكتب هنا..." class="form-group textarea"></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-primary" id="finishWarmup">أنا جاهز، لنبدأ المقابلة</button>
                    </div>
                    `, document.getElementById("finishWarmup").onclick = () => i(true);
      }) : u === "debrief" && (e = `
                <h2><i class="fas fa-award"></i> أداء رائع!</h2>
                <p>لقد أكملت المقابلة بنجاح. كيف تشعر حيال إجاباتك؟ خذ لحظة للتفكير.</p>
                <p class="disclaimer">تفكيرك في أدائك هو بحد ذاته مهارة مهمة.</p>
                <div class="form-actions">
                    <button class="btn btn-primary" id="viewReport">عرض تقريري النهائي</button>
                </div>`, this.dom.interviewModalContent.innerHTML = e, document.getElementById("viewReport").onclick = () => i(true)), this.dom.interviewModal.classList.add("show");
    }), this.generateFinalReport = async () => {
      document.getElementById("reportLoadingState").style.display = "block", document.getElementById("reportContainer").style.display = "none", document.getElementById("reportActions").style.display = "none";
      try {
        const u = this.state.applicationData.interview.answers.map((i, a) => `Q${a + 1}: ${this.state.applicationData.interview.questions[a]}
A: ${i.text || "(No text answer)"}`).join(`
---
`), t = `
            You are a professional Arabic-speaking career coach. Your task is to generate a final report and respond ONLY with a valid JSON object. The entire JSON object, including all keys and values, must be in Arabic.
            CANDIDATE'S FULL DATA:
            - Basic Info: ${JSON.stringify(this.state.applicationData.basicInfo)}
            - CV Analysis: ${JSON.stringify(this.state.applicationData.analysisResults)}
            - Challenge Answer: """${this.state.applicationData.interactiveChallenge.answer}"""
            - Interview Transcript: """${u}"""
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
                    { "roleTitle": "مسار مهني 1", "skills": "مهارات مقترحة للمسار 1" },
                    { "roleTitle": "مسار مهني 2", "skills": "مهارات مقترحة للمسار 2" }
                ],
                "finalVerdict": "<Final verdict>"
            }
            `, e = await this.callGeminiAPI(t, "final-report");
        this.state.applicationData.finalReport = e, this.saveState(), this.displayFinalReport(e);
      } catch (u) {
        console.error("Report Generation Error:", u), this.showNotification(`تعذر إنشاء التقرير عبر Gemini: ${u.message}. سنعرض تقريراً تجريبياً مؤقتاً ويمكنك المحاولة لاحقاً.`, "error"), this.state.applicationData.finalReport = { finalScore: 45, performanceCategory: "أداء ضعيف", strengths: ["إظهار الرغبة في التعلم", "إكمال جميع خطوات التقديم بنجاح"], improvements: ["الحاجة لمراجعة أساسيات التخصص بشكل أعمق", "التدرب على حل المشكلات بشكل منهجي", "تحسين مهارات التواصل الكتابي لتكون أكثر احترافية"], personalityAnalysis: { summary: "يظهر المرشح حماساً، لكن الإجابات تفتقر إلى العمق والخبرة العملية الكافية حالياً.", disclaimer: "هذا التحليل تجريبي ومبني على الأسلوب اللغوي فقط ولا يمثل تقييماً نفسياً قاطعاً." }, salaryAnalysis: "الراتب المتوقع أعلى من متوسط السوق للمهارات المعروضة حالياً. قد يكون من المفيد إعادة تقييمه بعد اكتساب المزيد من الخبرة.", marketBenchmark: "توجد فجوة واضحة في المهارات التقنية الأساسية مقارنة بمتطلبات السوق الحالية لهذا الدور.", careerRoadmap: [{ roleTitle: "فترة تدريبية تقنية", skills: "دورات أساسية في علوم الحاسب, بناء مشاريع شخصية بسيطة" }, { roleTitle: "دعم فني مبتدئ", skills: "شهادات مثل CompTIA A+, مهارات خدمة العملاء" }], finalVerdict: "في الوقت الحالي، هناك فجوات كبيرة بين مؤهلاتك ومتطلبات الدور. نوصي بالتركيز على مجالات التطوير المذكورة وبناء قاعدة معرفية صلبة قبل التقدم مرة أخرى لوظائف مماثلة." }, this.saveState(), this.displayFinalReport(this.state.applicationData.finalReport);
      } finally {
        document.getElementById("reportLoadingState").style.display = "none", document.getElementById("reportContainer").style.display = "block", document.getElementById("reportActions").style.display = "flex";
      }
    }, this.displayFinalReport = (u) => {
      const t = this.state.applicationData.basicInfo, e = this.state.applicationData.analysisResults;
      let i = "background-color: color-mix(in srgb, var(--primary) 10%, transparent); border-color: var(--primary);", a = "fa-gavel";
      if (u.performanceCategory === "يحتاج إلى تحسين") i = "background-color: color-mix(in srgb, var(--accent) 15%, transparent); border-color: var(--accent);", a = "fa-exclamation-triangle";
      else if (u.performanceCategory === "أداء ضعيف") {
        const s = "#ef4444";
        i = `background-color: color-mix(in srgb, ${s} 15%, transparent); border-color: ${s};`, a = "fa-times-circle";
      }
      const n = `
        <div id="pdf-report">
            <div class="bai-inline-0090">
                <h2 style="color: var(--primary); font-size: 1.2rem;">التقرير التقييمي الشامل</h2>
                <p>المرشح: ${t.fullName}</p>
            </div>
            <div class="report-grid">
                <div class="report-item"><h4><i class="fas fa-bullseye"></i> النتيجة النهائية</h4><p>${u.finalScore}%</p></div>
                <div class="report-item"><h4><i class="fas fa-signal"></i> مستوى الأداء</h4><p>${u.performanceCategory || "N/A"}</p></div>
                <div class="report-item"><h4><i class="fas fa-file-signature"></i> تطابق السيرة</h4><p>${e.matchScore || "N/A"}%</p></div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-money-bill-wave"></i> تحليل الراتب المتوقع</h3>
                <p>${u.salaryAnalysis}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-chart-simple"></i> موقعك في السوق</h3>
                <p>${u.marketBenchmark}</p>
            </div>
            <div class="report-grid" style="grid-template-columns: 1fr; margin-top: 1rem;">
                <div class="detail-card">
                    <h3><i class="fas fa-star"></i> نقاط القوة</h3>
                    <ul>${u.strengths.map((s) => `<li>${s}</li>`).join("")}</ul>
                </div>
                <div class="detail-card">
                    <h3><i class="fas fa-arrow-up"></i> مجالات التطوير</h3>
                    <ul>${u.improvements.map((s) => `<li>${s}</li>`).join("")}</ul>
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-user-secret"></i> تحليل الأسلوب والشخصية (تجريبي)</h3>
                <p>${u.personalityAnalysis.summary}</p>
                <p class="disclaimer">${u.personalityAnalysis.disclaimer}</p>
            </div>
            <div class="detail-card" style="margin-top: 1rem;">
                <h3><i class="fas fa-road"></i> مستكشف المسار الوظيفي</h3>
                <div class="career-path-explorer">
                    ${u.careerRoadmap.map((s) => `
                    <div class="career-path-node">
                        <h4>${s.roleTitle || s.path}</h4>
                        <p><strong>المهارات المطلوبة:</strong> ${s.skills}</p>
                    </div>`).join("")}
                </div>
            </div>
            <div class="detail-card" style="margin-top: 1rem; ${i}">
                <h3><i class="fas ${a}"></i> القرار النهائي</h3>
                <p>${u.finalVerdict}</p>
            </div>
        </div>
        `;
      document.getElementById("reportContainer").innerHTML = n, this.unlockAchievement("خارطة الطريق المهنية", "لقد حصلت على تقريرك الشامل وتوصياتك المستقبلية!");
    }, this.downloadReport = async () => {
      const { html2canvas: u, jspdf: t } = await this.ensurePdfExportLibs(), { jsPDF: e } = t, i = document.getElementById("pdf-report");
      if (!i) return this.showNotification("لا يوجد تقرير جاهز للتصدير بعد. انتظر اكتمال الخطوة النهائية ثم حاول مرة أخرى.", "error");
      this.showNotification("جاري إعداد التقرير للتحميل...", "success");
      const a = await u(i, { scale: 2, useCORS: true, backgroundColor: getComputedStyle(document.body).getPropertyValue("--bg-content") }), n = a.toDataURL("image/png"), s = new e({ orientation: "portrait", unit: "px", format: [a.width, a.height] });
      s.addImage(n, "PNG", 0, 0, a.width, a.height), s.save(`تقرير-${this.state.applicationData.basicInfo.fullName}.pdf`);
    }, this.submitApplication = () => {
      const u = JSON.parse(localStorage.getItem(this.config.submittedStorageKey)) || [], t = this.state.applicationData.basicInfo, e = { email: t.email, phone: t.phone }, i = this.state.applicationData.cvContent || this.state.applicationData.cvText || "", a = { isFavorite: false, isArchived: false, notes: "" };
      u.push({ id: Date.now(), submittedAt: (/* @__PURE__ */ new Date()).toISOString(), ...this.state.applicationData, contactInfo: e, cvText: i, adminState: a }), localStorage.setItem(this.config.submittedStorageKey, JSON.stringify(u)), localStorage.removeItem(this.config.stateStorageKey), localStorage.removeItem(this.config.legacyStateStorageKey), this.showNotification("تم إرسال طلبك بنجاح! نتمنى لك كل التوفيق.", "success"), setTimeout(() => window.location.reload(), 3e3);
    }, this.showNotification = (u, t = "success") => {
      const e = document.createElement("div");
      e.className = `notification ${t}`, e.innerHTML = `<i class="fas fa-${t === "success" ? "check-circle" : "times-circle"}"></i> ${u}`, document.body.appendChild(e), setTimeout(() => e.classList.add("show"), 100), setTimeout(() => {
        e.classList.remove("show"), setTimeout(() => e.remove(), 5e3);
      }, 5e3);
    }, this.assistantSpeakForStep = (u) => {
      const t = this.state.persona, e = { 1: "أهلاً بك! لنبدأ معًا هذه الرحلة. أولاً، بعض المعلومات الأساسية عنك.", 2: `ممتاز! الآن، الخطوة المحورية: سيرتك الذاتية. تذكر، هذه فرصتك لتلمع. ${this.config.marketInsights[t] || ""}`, 3: "رائع! لقد استلمت الملف. سأقوم الآن بتشغيل محركاتي التحليلية. قد يستغرق هذا بضع لحظات.", 4: "تحليل مثير للاهتمام! الآن لنر كيف تطبق مهاراتك على أرض الواقع. لقد أعددت لك تحدياً عملياً قصيراً.", 5: `إجابة مدروسة! الآن، بناءً على كل ما سبق، حان وقت المقابلة. تذكر، الهدف هو فهم طريقة تفكيرك. ${t === "developer" ? "فكر فيها كجلسة pair programming." : "فكر فيها كجلسة عصف ذهني."}`, 6: "لقد اكتمل التقييم! عمل رائع. أنا الآن أقوم بتجميع تقريرك الشامل وخارطة طريقك المهنية." };
      e[u] && this.assistantSpeak(e[u]);
    }, this.assistantSpeak = (u) => {
      this.dom.aiAssistantMessage.textContent = u, this.dom.aiAssistant.classList.add("show"), setTimeout(() => {
        this.dom.aiAssistant.classList.remove("show");
      }, 8e3);
    };
  };
  function p() {
    const u = document.getElementById("ctaButton"), t = document.getElementById("paperPlane");
    u && u.addEventListener("click", (n) => {
      const s = document.createElement("span");
      s.className = "ripple";
      const r = u.getBoundingClientRect(), l = Math.max(r.width, r.height);
      s.style.width = s.style.height = l + "px", s.style.left = n.clientX - r.left - l / 2 + "px", s.style.top = n.clientY - r.top - l / 2 + "px", u.appendChild(s), t && t.classList.add("fly"), setTimeout(() => {
        s.remove(), t && t.classList.remove("fly"), document.querySelector(".container").scrollIntoView({ behavior: "smooth" });
      }, 1e3);
    });
    const e = document.getElementById("vacancyChips"), i = ["مطور React", "مصمم UI/UX", "محلل بيانات", "مدير منتج", "مطور Node.js", "مصمم جرافيك", "مهندس ذكاء اصطناعي", "مدير مشروع"];
    function a() {
      e && e.querySelectorAll(".chip").forEach((n, s) => {
        setTimeout(() => {
          n.style.transform = "translateX(100px)", n.style.opacity = "0", setTimeout(() => {
            n.textContent = i[Math.floor(Math.random() * i.length)], n.style.transform = "translateX(0)", n.style.opacity = "1";
          }, 300);
        }, s * 100);
      });
    }
    setInterval(a, 5e3);
  }
  const o = new h();
  window.app = o, document.addEventListener("DOMContentLoaded", () => {
    o.init(), p();
  });
})();
