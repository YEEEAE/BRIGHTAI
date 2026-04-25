(function () {
  "use strict";

  const TAB_IDS = ["image-ai", "remote", "hms", "med-gemini"];
  const MAX_INLINE_FILE_SIZE = 10 * 1024 * 1024;
  const DISCLAIMER = "تنبيه طبي مهم: النتائج توضيحية ومساندة للفهم فقط، ولا تغني عن تقييم الطبيب أو الطوارئ أو البروتوكولات الطبية المعتمدة.";

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);

  const els = {
    tabs: Array.from(document.querySelectorAll(".tabs button")),
    sections: Object.fromEntries(TAB_IDS.map((id) => [id, byId(id)])),
    image: {
      type: byId("imgType"),
      drop: byId("imgDrop"),
      file: byId("imgFile"),
      notes: byId("imgNotes"),
      status: byId("imgStatus"),
      output: byId("imgOutput"),
      analyze: byId("analyzeImageBtn"),
      clear: byId("clearImageBtn")
    },
    vitals: {
      hr: byId("hr"),
      bp: byId("bp"),
      spo2: byId("spo2"),
      glucose: byId("glucose"),
      symptoms: byId("symptoms"),
      status: byId("vitalsStatus"),
      output: byId("vitalsOutput"),
      analyze: byId("analyzeVitalsBtn"),
      clear: byId("clearVitalsBtn")
    },
    hms: {
      dept: byId("dept"),
      age: byId("age"),
      gender: byId("gender"),
      desc: byId("caseDesc"),
      status: byId("hmsStatus"),
      output: byId("hmsOutput"),
      analyze: byId("hmsAnalyzeBtn"),
      clear: byId("hmsClearBtn")
    },
    med: {
      type: byId("mgType"),
      query: byId("mgQuery"),
      drop: byId("mgDrop"),
      file: byId("mgFile"),
      status: byId("mgStatus"),
      output: byId("mgOutput"),
      analyze: byId("mgAnalyzeBtn"),
      clear: byId("mgClearBtn")
    }
  };

  let selectedImageFile = null;
  let selectedMedFile = null;

  function setStatus(el, message, type = "") {
    if (!el) return;
    el.textContent = message;
    el.classList.remove("ok", "warn", "err");
    if (type) el.classList.add(type);
  }

  function setBusy(button, busy, busyLabel, idleLabel) {
    if (!button) return;
    button.disabled = busy;
    button.innerHTML = busy
      ? `${busyLabel} <span class="spinner" aria-hidden="true"></span>`
      : idleLabel;
  }

  function getGemini() {
    const gemini = window.BrightAIGemini;
    if (!gemini || typeof gemini.generateContent !== "function") {
      throw new Error("Gemini client is not loaded");
    }
    return gemini;
  }

  async function toInlineData(file) {
    if (!file) throw new Error("لم يتم اختيار ملف.");
    if (file.size > MAX_INLINE_FILE_SIZE) {
      throw new Error("حجم الملف أكبر من 10MB. اختر ملفاً أصغر للتجربة.");
    }

    const inline = await getGemini().fileToInlineData(file);
    if (!inline.mime_type || inline.mime_type === "application/octet-stream") {
      inline.mime_type = inferMimeType(file);
    }
    return inline;
  }

  function inferMimeType(file) {
    const name = String(file?.name || "").toLowerCase();
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".txt")) return "text/plain";
    if (name.endsWith(".dcm") || name.endsWith(".dicom")) return "application/dicom";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return file?.type || "application/octet-stream";
  }

  async function geminiPrompt(prompt, options = {}) {
    const response = await getGemini().generateContent({
      prompt,
      files: options.files || [],
      temperature: options.temperature ?? 0.25,
      maxOutputTokens: options.maxOutputTokens || 1400,
      generationConfig: options.generationConfig
    });
    return response.text.trim();
  }

  function errorMessage(error) {
    return window.BrightAIGemini?.getErrorMessage?.(error) || error?.message || "تعذر الاتصال بـ Gemini حالياً.";
  }

  function withDisclaimer(text) {
    return `${text.trim()}\n\n${DISCLAIMER}`;
  }

  function parseJsonResponse(text) {
    const clean = String(text || "")
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    return JSON.parse(clean);
  }

  function renderJson(data) {
    return JSON.stringify(data, null, 2);
  }

  function wireDropZone(zone, input, onFile) {
    if (!zone || !input) return;

    zone.addEventListener("click", () => input.click());
    zone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        input.click();
      }
    });
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("drag");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("drag");
      const file = event.dataTransfer?.files?.[0];
      if (file) onFile(file);
    });
    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (file) onFile(file);
    });
  }

  function initTabs() {
    els.tabs.forEach((button) => {
      const tab = button.dataset.tab;
      button.setAttribute("aria-controls", tab);
      button.setAttribute("aria-selected", button.classList.contains("active") ? "true" : "false");
      button.addEventListener("click", () => activateTab(tab, true));
    });

    TAB_IDS.forEach((id) => {
      const section = els.sections[id];
      if (section) {
        section.setAttribute("role", "tabpanel");
        section.setAttribute("tabindex", "-1");
      }
    });

    const hash = window.location.hash.replace("#", "");
    if (TAB_IDS.includes(hash)) {
      activateTab(hash, false);
    }
  }

  function activateTab(tab, updateHash) {
    if (!TAB_IDS.includes(tab)) return;

    els.tabs.forEach((button) => {
      const isActive = button.dataset.tab === tab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    Object.entries(els.sections).forEach(([id, section]) => {
      if (section) section.hidden = id !== tab;
    });

    if (updateHash) {
      history.replaceState(null, "", `#${tab}`);
      els.sections[tab]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function initAnchorTabs() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        const targetId = anchor.getAttribute("href").slice(1);
        if (!targetId) return;

        const target = byId(targetId);
        if (!target) return;

        event.preventDefault();
        if (TAB_IDS.includes(targetId)) activateTab(targetId, false);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.replaceState(null, "", `#${targetId}`);
      });
    });
  }

  function initImageTab() {
    const ui = els.image;

    wireDropZone(ui.drop, ui.file, (file) => {
      const supported = /\.(jpe?g|png|dcm|dicom)$/i.test(file.name);
      if (!supported) {
        setStatus(ui.status, "صيغة غير مدعومة. استخدم JPG أو PNG أو DICOM.", "err");
        return;
      }
      selectedImageFile = file;
      setStatus(ui.status, `تم اختيار الملف: ${file.name} (${Math.round(file.size / 1024)} كيلوبايت)`, "ok");
    });

    ui.analyze?.addEventListener("click", async () => {
      if (!selectedImageFile) {
        setStatus(ui.status, "ارفع صورة طبية أولاً.", "warn");
        return;
      }

      setBusy(ui.analyze, true, "جاري إرسال الصورة إلى Gemini...", "تحليل الصورة الطبية بالذكاء الاصطناعي");
      setStatus(ui.status, "جاري تحليل الصورة عبر Gemini inline_data...", "");
      ui.output.textContent = "جاري المعالجة...";

      try {
        const inlineData = await toInlineData(selectedImageFile);
        const prompt = `أنت مساعد توضيحي لتحليل صور طبية داخل عرض Bright AI. حلل الصورة المرفقة من نوع ${ui.type.value}.

الملاحظات السريرية:
${ui.notes.value.trim() || "لا توجد ملاحظات إضافية."}

أجب بالعربية وبصيغة منظمة تتضمن:
1. وصفاً لما يظهر في الصورة وحدود الثقة.
2. الملاحظات المحتملة دون جزم تشخيصي.
3. إشارات تستدعي مراجعة الطبيب أو الطوارئ.
4. فحوصات أو معلومات إضافية قد تساعد الطبيب.
5. ملاحظة جودة الصورة إن أمكن.

لا تقدم تشخيصاً نهائياً ولا خطة علاجية ملزمة.`;

        const text = await geminiPrompt(prompt, {
          files: [{ inline_data: inlineData }],
          temperature: 0.2,
          maxOutputTokens: 1600
        });
        setStatus(ui.status, "تم التحليل عبر Gemini.", "ok");
        ui.output.textContent = withDisclaimer(text);
      } catch (error) {
        console.error(error);
        setStatus(ui.status, "فشل الاتصال بـ Gemini. تم عرض fallback توضيحي.", "err");
        ui.output.textContent = imageFallback(error, selectedImageFile, ui.type.value);
      } finally {
        setBusy(ui.analyze, false, "", "تحليل الصورة الطبية بالذكاء الاصطناعي");
      }
    });

    ui.clear?.addEventListener("click", () => {
      selectedImageFile = null;
      ui.file.value = "";
      ui.notes.value = "";
      ui.output.textContent = "سيتم عرض التحليل الشامل هنا بعد رفع الصورة...";
      setStatus(ui.status, "تمت إعادة الضبط. ارفع صورة جديدة.", "");
    });
  }

  function initVitalsTab() {
    const ui = els.vitals;

    ui.analyze?.addEventListener("click", async () => {
      const payload = {
        heart_rate_bpm: ui.hr.value.trim(),
        blood_pressure: ui.bp.value.trim(),
        spo2_percent: ui.spo2.value.trim(),
        glucose_mg_dl: ui.glucose.value.trim(),
        symptoms: ui.symptoms.value.trim()
      };

      if (!Object.values(payload).some(Boolean)) {
        setStatus(ui.status, "أدخل قراءة واحدة على الأقل أو صف الأعراض.", "warn");
        return;
      }

      setBusy(ui.analyze, true, "جاري تحليل المؤشرات عبر Gemini...", "تحليل البيانات الحيوية");
      setStatus(ui.status, "جاري إرسال القراءات والأعراض إلى Gemini...", "");
      ui.output.textContent = "جاري المعالجة...";

      try {
        const prompt = `أنت نظام triage توضيحي للمؤشرات الحيوية. أعد JSON صالحاً فقط بلا Markdown وبالمفاتيح الإنجليزية التالية:
triage_level: one of ["routine","monitor","urgent","emergency"],
risk_summary_ar: string,
red_flags_ar: array of strings,
recommended_actions_ar: array of strings,
questions_for_clinician_ar: array of strings,
monitoring_plan_ar: array of strings,
disclaimer_ar: string.

اعتمد فقط على القراءات والأعراض التالية، ولا تقدم تشخيصاً نهائياً:
${JSON.stringify(payload, null, 2)}`;

        const text = await geminiPrompt(prompt, {
          temperature: 0.15,
          maxOutputTokens: 1100,
          generationConfig: {
            temperature: 0.15,
            maxOutputTokens: 1100,
            responseMimeType: "application/json"
          }
        });
        const json = normalizeTriage(parseJsonResponse(text));
        setStatus(ui.status, "تم إنشاء triage JSON عبر Gemini.", "ok");
        ui.output.textContent = `${renderJson(json)}\n\n${DISCLAIMER}`;
      } catch (error) {
        console.error(error);
        setStatus(ui.status, "فشل الاتصال بـ Gemini. تم عرض fallback محلي.", "err");
        ui.output.textContent = `${renderJson(vitalsFallback(error, payload))}\n\n${DISCLAIMER}`;
      } finally {
        setBusy(ui.analyze, false, "", "تحليل البيانات الحيوية");
      }
    });

    ui.clear?.addEventListener("click", () => {
      ui.hr.value = "";
      ui.bp.value = "";
      ui.spo2.value = "";
      ui.glucose.value = "";
      ui.symptoms.value = "";
      ui.output.textContent = "سيتم عرض التقييم الصحي الشامل هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initHospitalTab() {
    const ui = els.hms;

    ui.analyze?.addEventListener("click", async () => {
      const payload = {
        department: ui.dept.value,
        age: ui.age.value.trim(),
        gender: ui.gender.value,
        case_description: ui.desc.value.trim()
      };

      if (!payload.case_description) {
        setStatus(ui.status, "أدخل وصف الحالة قبل طلب التوصيات.", "warn");
        return;
      }

      setBusy(ui.analyze, true, "جاري توليد التوصيات عبر Gemini...", "معالجة البيانات وتقديم التوصيات");
      setStatus(ui.status, "جاري إرسال وصف الحالة إلى Gemini...", "");
      ui.output.textContent = "جاري المعالجة...";

      try {
        const prompt = `أنت مستشار تشغيل مستشفيات في السعودية. حلل الحالة التالية وقدّم توصيات تشغيلية لا تشخيصية.

بيانات الحالة:
${JSON.stringify(payload, null, 2)}

أجب بالعربية في أقسام واضحة:
- أولوية تشغيلية مبدئية.
- مسار استقبال أو فرز مقترح.
- الموارد المطلوبة: سرير، تمريض، طبيب، أجهزة، مختبر أو أشعة.
- مخاطر تشغيلية يجب مراقبتها.
- أسئلة ناقصة يجب جمعها قبل القرار.
- حدود النتيجة وأنها لا تستبدل الطبيب أو بروتوكول المنشأة.`;

        const text = await geminiPrompt(prompt, { temperature: 0.25, maxOutputTokens: 1400 });
        setStatus(ui.status, "تم توليد التوصيات عبر Gemini.", "ok");
        ui.output.textContent = withDisclaimer(text);
      } catch (error) {
        console.error(error);
        setStatus(ui.status, "فشل الاتصال بـ Gemini. تم عرض fallback تشغيلي.", "err");
        ui.output.textContent = hospitalFallback(error, payload);
      } finally {
        setBusy(ui.analyze, false, "", "معالجة البيانات وتقديم التوصيات");
      }
    });

    ui.clear?.addEventListener("click", () => {
      ui.age.value = "";
      ui.gender.value = "";
      ui.desc.value = "";
      ui.output.textContent = "سيتم عرض التوصيات الشاملة هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function initMedGeminiTab() {
    const ui = els.med;

    wireDropZone(ui.drop, ui.file, (file) => {
      selectedMedFile = file;
      setStatus(ui.status, `تم رفع الملف: ${file.name} (${Math.round(file.size / 1024)} كيلوبايت)`, "ok");
    });

    ui.analyze?.addEventListener("click", async () => {
      const query = ui.query.value.trim();
      if (!query && !selectedMedFile) {
        setStatus(ui.status, "اكتب سؤالاً أو ارفع ملفاً طبياً.", "warn");
        return;
      }

      setBusy(ui.analyze, true, "جاري تحليل الطلب عبر Gemini...", "الحصول على تحليل Med-Gemini");
      setStatus(ui.status, "جاري إرسال السؤال أو الملف إلى Gemini...", "");
      ui.output.textContent = "جاري المعالجة...";

      try {
        const files = selectedMedFile ? [{ inline_data: await toInlineData(selectedMedFile) }] : [];
        const prompt = `أنت Med-Gemini توضيحي داخل عرض Bright AI. نوع الطلب: ${ui.type.value}.

سؤال المستخدم أو نص التقرير:
${query || "لا يوجد نص مكتوب. اعتمد على الملف المرفق فقط."}

إن وجد ملف مرفق فحلله على قدر ما تسمح به صيغة الملف. أجب بالعربية في ملخص واضح يتضمن:
1. ملخصاً توضيحياً للحالة أو السؤال.
2. النقاط المهمة التي يجب أن يراجعها الطبيب.
3. الأسئلة الناقصة أو المعلومات غير المتوفرة.
4. خطوات متابعة آمنة وغير علاجية.
5. تحذير واضح بأن الإجابة لا تغني عن الطبيب.`;

        const text = await geminiPrompt(prompt, { files, temperature: 0.25, maxOutputTokens: 1500 });
        setStatus(ui.status, "تم تحليل الطلب عبر Gemini.", "ok");
        ui.output.textContent = withDisclaimer(text);
      } catch (error) {
        console.error(error);
        setStatus(ui.status, "فشل الاتصال بـ Gemini. تم عرض fallback توضيحي.", "err");
        ui.output.textContent = medFallback(error, query, selectedMedFile, ui.type.value);
      } finally {
        setBusy(ui.analyze, false, "", "الحصول على تحليل Med-Gemini");
      }
    });

    ui.clear?.addEventListener("click", () => {
      ui.query.value = "";
      ui.file.value = "";
      selectedMedFile = null;
      ui.output.textContent = "سيتم عرض التحليل الطبي الشامل هنا...";
      setStatus(ui.status, "تمت إعادة الضبط.", "");
    });
  }

  function normalizeTriage(value) {
    return {
      triage_level: value.triage_level || "monitor",
      risk_summary_ar: value.risk_summary_ar || "تقييم توضيحي يحتاج مراجعة مختص.",
      red_flags_ar: Array.isArray(value.red_flags_ar) ? value.red_flags_ar : [],
      recommended_actions_ar: Array.isArray(value.recommended_actions_ar) ? value.recommended_actions_ar : [],
      questions_for_clinician_ar: Array.isArray(value.questions_for_clinician_ar) ? value.questions_for_clinician_ar : [],
      monitoring_plan_ar: Array.isArray(value.monitoring_plan_ar) ? value.monitoring_plan_ar : [],
      disclaimer_ar: value.disclaimer_ar || DISCLAIMER
    };
  }

  function vitalsFallback(error, payload) {
    const redFlags = [];
    const actions = ["إعادة قياس القراءات والتأكد من الجهاز وطريقة القياس.", "مشاركة القراءات مع طبيب أو ممرض مختص."];
    const hr = Number(payload.heart_rate_bpm);
    const spo2 = Number(payload.spo2_percent);
    const glucose = Number(payload.glucose_mg_dl);
    const bpMatch = String(payload.blood_pressure || "").match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
    const systolic = bpMatch ? Number(bpMatch[1]) : null;
    const symptoms = String(payload.symptoms || "");

    if (spo2 && spo2 < 92) redFlags.push("تشبع الأكسجين منخفض وقد يستدعي تواصلاً عاجلاً مع الرعاية الصحية.");
    if (hr && (hr > 120 || hr < 45)) redFlags.push("معدل القلب خارج النطاق المعتاد ويحتاج تقييم مختص.");
    if (systolic && systolic >= 180) redFlags.push("ضغط انقباضي مرتفع جداً ويحتاج مراجعة عاجلة.");
    if (glucose && (glucose > 300 || glucose < 60)) redFlags.push("قراءة السكر خارج النطاق الآمن غالباً وتحتاج إرشاداً طبياً.");
    if (/ألم|صدر|تنفس|إغماء|دوخة شديدة/.test(symptoms)) redFlags.push("الأعراض المذكورة قد تكون مهمة سريرياً وتحتاج فرزاً طبياً.");

    return {
      triage_level: redFlags.length >= 2 ? "urgent" : redFlags.length ? "monitor" : "routine",
      risk_summary_ar: `تعذر الوصول إلى Gemini: ${errorMessage(error)} تم توليد تقييم fallback مبسط من القراءات المدخلة.`,
      red_flags_ar: redFlags,
      recommended_actions_ar: redFlags.length ? actions.concat("عند وجود ألم صدر أو ضيق تنفس أو تدهور سريع، تواصل مع الطوارئ فوراً.") : actions,
      questions_for_clinician_ar: ["ما عمر المريض؟", "هل لديه أمراض مزمنة أو أدوية حالية؟", "متى بدأت الأعراض؟"],
      monitoring_plan_ar: ["تسجيل القراءات مع الوقت.", "إعادة القياس بعد راحة قصيرة إذا لم توجد أعراض خطرة.", "تصعيد الحالة عند تدهور الأعراض."],
      disclaimer_ar: DISCLAIMER
    };
  }

  function imageFallback(error, file, imageType) {
    return withDisclaimer(`تعذر تحليل الصورة عبر Gemini: ${errorMessage(error)}

Fallback توضيحي:
- تم اختيار ملف: ${file?.name || "غير محدد"}.
- نوع الصورة المختار: ${imageType}.
- لا يمكن تقديم قراءة صورية فعلية بدون استجابة Gemini.
- راجع جودة الصورة، وحجم الملف، واتصال الشبكة، ثم أعد المحاولة.
- لأي اشتباه سريري أو أعراض حادة، يجب الرجوع للطبيب أو قسم الطوارئ.`);
  }

  function hospitalFallback(error, payload) {
    return withDisclaimer(`تعذر توليد توصيات Gemini: ${errorMessage(error)}

Fallback تشغيلي مبسط:
- القسم: ${payload.department}
- العمر: ${payload.age || "غير محدد"}
- الجنس: ${payload.gender || "غير محدد"}
- الوصف: ${payload.case_description}

توصيات تشغيلية عامة:
1. تطبيق بروتوكول الفرز المعتمد داخل المنشأة.
2. جمع العلامات الحيوية والحساسية والأدوية الحالية قبل القرار.
3. توفير تقييم تمريضي أولي ثم تصعيد للطبيب المناوب حسب شدة الأعراض.
4. تجهيز موارد المختبر أو الأشعة فقط عند طلبها من الفريق السريري.
5. توثيق وقت الوصول، وقت الفرز، وسبب التصعيد إن وجد.`);
  }

  function medFallback(error, query, file, type) {
    return withDisclaimer(`تعذر تحليل الطلب عبر Gemini: ${errorMessage(error)}

Fallback توضيحي:
- نوع الطلب: ${type}
- السؤال: ${query || "لم يتم إدخال سؤال نصي."}
- الملف: ${file?.name || "لا يوجد ملف."}

لا يمكن إنشاء ملخص طبي فعلي بدون استجابة Gemini. أعد المحاولة بعد التأكد من الاتصال وصيغة الملف. إذا كان الطلب متعلقاً بأعراض حادة أو قرار علاجي، تواصل مع طبيب مختص.`);
  }

  function initContactForm() {
    byId("contactBtn")?.addEventListener("click", async () => {
      const name = byId("contactName")?.value.trim();
      const phone = byId("contactPhone")?.value.trim();
      const email = byId("contactEmail")?.value.trim();
      const service = byId("contactService")?.value;
      const msg = byId("contactMsg")?.value.trim();
      const status = byId("contactStatus");

      if (!name || !phone) {
        setStatus(status, "الرجاء إدخال الاسم ورقم الجوال.", "warn");
        return;
      }

      if (!/^05\d{8}$/.test(phone.replace(/\s/g, ""))) {
        setStatus(status, "رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.", "warn");
        return;
      }

      console.info("Contact Form Submission:", { name, phone, email, service, msg });
      setStatus(status, "تم استلام طلبك بنجاح. سنتواصل معك خلال 24 ساعة.", "ok");
      ["contactName", "contactPhone", "contactEmail", "contactService", "contactMsg"].forEach((id) => {
        const input = byId(id);
        if (input) input.value = "";
      });
    });
  }

  function initOutputFocus() {
    [els.image.output, els.vitals.output, els.hms.output, els.med.output].forEach((output) => {
      if (!output) return;
      const observer = new MutationObserver(() => {
        output.setAttribute("tabindex", "-1");
        output.focus({ preventScroll: true });
        window.setTimeout(() => output.removeAttribute("tabindex"), 200);
      });
      observer.observe(output, { childList: true, characterData: true, subtree: true });
    });
  }

  function boot() {
    if (!$(".tabs")) return;
    initTabs();
    initAnchorTabs();
    initImageTab();
    initVitalsTab();
    initHospitalTab();
    initMedGeminiTab();
    initContactForm();
    initOutputFocus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
