// smart-ai-logic.js
// وحدة الذكاء الاصطناعي للأرشيف الطبي الذكي - BrightAI
// المكدس: Vanilla JS / Groq API (Direct Client Mode)
// ملاحظة: هذه الوحدة تستخدم الإعدادات المحفوظة من واجهة إعدادات الاتصال
// لبيئة الإنتاج: استخدم خادم Node.js Backend لحماية المفتاح

/**
 * جلب إعدادات Groq من الحالة المركزية أو localStorage
 */
function getGroqConfig() {
    const STORAGE_GROQ_API_KEY = "brightai.medicalArchive.groqApiKey";
    const STORAGE_GROQ_MODEL_KEY = "brightai.medicalArchive.groqModel";
    const DEFAULT_MODEL = "llama-3.1-8b-instant";

    let key = "";
    let model = DEFAULT_MODEL;

    // أولوية 1: من النافذة العامة (system-unified.js يضبطها)
    if (typeof window !== "undefined" && window._brightaiGroqConfig) {
        key = window._brightaiGroqConfig.key || "";
        model = window._brightaiGroqConfig.model || DEFAULT_MODEL;
    }

    // أولوية 2: من حقول الإدخال مباشرة
    if (!key) {
        const keyInput = document.getElementById("groqApiKeyInput");
        if (keyInput && keyInput.value.trim()) {
            key = keyInput.value.trim();
        }
    }
    if (!model || model === DEFAULT_MODEL) {
        const modelInput = document.getElementById("groqModelInput");
        if (modelInput && modelInput.value.trim()) {
            model = modelInput.value.trim();
        }
    }

    // أولوية 3: من localStorage
    if (!key) {
        try { key = localStorage.getItem(STORAGE_GROQ_API_KEY) || ""; } catch (e) { /* ignore */ }
    }
    if (!model || model === DEFAULT_MODEL) {
        try {
            const stored = localStorage.getItem(STORAGE_GROQ_MODEL_KEY);
            if (stored) model = stored;
        } catch (e) { /* ignore */ }
    }

    return {
        API_URL: "https://api.groq.com/openai/v1/chat/completions",
        API_KEY: key,
        MODEL: model,
        DEFAULT_HEADERS: {
            "Content-Type": "application/json"
        }
    };
}

/**
 * معالجة أخطاء Groq API بشكل ذكي ومفصّل
 */
function handleGroqError(response, errorBody) {
    const errMsg = (errorBody && errorBody.error && errorBody.error.message) || "";

    switch (response.status) {
        case 401:
            throw new Error("مفتاح Groq API غير صالح أو منتهي الصلاحية. تحقق من المفتاح في إعدادات الاتصال.");
        case 403:
            throw new Error("الوصول محظور. تأكد من صلاحيات المفتاح مع نموذج: " + getGroqConfig().MODEL);
        case 404:
            throw new Error("النموذج المطلوب غير موجود. تأكد من اسم النموذج: " + getGroqConfig().MODEL);
        case 413:
            throw new Error("حجم الطلب كبير جداً. قلّل حجم التقرير الطبي وحاول مجدداً.");
        case 429:
            throw new Error("تم تجاوز حد الطلبات المسموح. انتظر دقيقة ثم حاول مرة أخرى.");
        case 500:
        case 502:
        case 503:
            throw new Error("خلل مؤقت في خوادم Groq (" + response.status + "). حاول بعد قليل.");
        default:
            throw new Error(errMsg || "مشكلة في الاتصال بالخادم الذكي (الحالة: " + response.status + ")");
    }
}

/**
 * استدعاء Groq API مع معالجة الأخطاء والـ timeout
 */
async function callGroqAPI(messages, options = {}) {
    const config = getGroqConfig();

    if (!config.API_KEY) {
        throw new Error("مفتاح Groq API غير متوفر. أدخل المفتاح في قسم 'إعداد الاتصال' أعلى الصفحة.");
    }

    const requestBody = {
        model: options.model || config.MODEL,
        messages: messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.1,
        max_tokens: options.max_tokens || 4096
    };

    if (options.json_mode) {
        requestBody.response_format = { type: "json_object" };
    }

    const controller = new AbortController();
    const timeoutMs = options.timeout || 60000;
    const timer = setTimeout(function () { controller.abort(); }, timeoutMs);

    let response;
    try {
        response = await fetch(config.API_URL, {
            method: "POST",
            headers: {
                ...config.DEFAULT_HEADERS,
                "Authorization": `Bearer ${config.API_KEY}`
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });
    } catch (fetchError) {
        clearTimeout(timer);
        if (fetchError.name === "AbortError") {
            throw new Error("انتهت مهلة الاتصال (" + Math.round(timeoutMs / 1000) + " ثانية). تحقق من الإنترنت وحاول مجدداً.");
        }
        throw new Error("تعذر الاتصال بـ Groq API. تحقق من اتصال الإنترنت وإعدادات الشبكة.");
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        let errorBody = {};
        try { errorBody = await response.json(); } catch (e) { /* ignore */ }
        handleGroqError(response, errorBody);
    }

    let data;
    try {
        data = await response.json();
    } catch (jsonError) {
        throw new Error("تعذر تحليل استجابة Groq. قد تكون الاستجابة تالفة. حاول مرة أخرى.");
    }

    if (!data || !data.choices || !data.choices.length || !data.choices[0].message) {
        throw new Error("استجابة فارغة أو غير مكتملة من Groq. حاول مرة أخرى.");
    }

    return {
        content: data.choices[0].message.content || "",
        model: data.model || config.MODEL,
        usage: data.usage || null,
        finish_reason: data.choices[0].finish_reason || "stop"
    };
}

/**
 * المهمة الأولى: دالة الاستخراج الذكي الشامل (Smart Extraction Engine)
 * تقوم بأخذ نص التقرير وإرجاع كائن JSON منظم متوافق مع معايير السجلات الطبية.
 * @param {string} reportText - نص التقرير الطبي المرفوع.
 * @param {object} promptConfig - خيارات وتوجيهات إضافية.
 * @returns {Promise<object>} الكيانات المستخرجة بصيغة JSON.
 */
async function extractMedicalRecord(reportText, promptConfig = {}) {
    const systemPrompt = `أنت طبيب استشاري سعودي وخبير في تحليل البيانات الطبية (Clinical Data Extractor).
مهمتك: قراءة التقرير الطبي المرفق واستخراج البيانات منه بدقة مطلقة لدمجها في نظام (EHR) وتصديرها بصيغة (FHIR / HL7).
يجب أن يكون المخرج حصراً بصيغة JSON (Structured Data)، دون أي مقدمات أو نصوص إضافية.
الهيكل المطلوب للـ JSON:
{
  "patient": {
    "name": "اسم المريض (إن وُجد، أو null)",
    "age": "العمر بالأرقام (أو null)",
    "gender": "ذكر/أنثى/غير محدد",
    "city": "المدينة إن ذُكرت"
  },
  "diagnoses": ["التشخيص الرئيسي", "تشخيصات ثانوية"],
  "symptoms": ["عرض 1", "عرض 2"],
  "medications": [
    { "name": "اسم الدواء", "dose": "الجرعة", "frequency": "التكرار" }
  ],
  "labs": [
    { "test": "الفحص", "result": "النتيجة", "unit": "الوحدة", "status": "طبيعي/مرتفع/منخفض" }
  ],
  "recommendations": "التوصيات الطبية والمتابعة",
  "severity": "منخفض/متوسط/مرتفع/حرج",
  "alerts": [
    { "type": "risk/interaction/critical", "message": "رسالة التنبيه" }
  ],
  "hospital_department": "القسم الأنسب"
}`;

    try {
        const result = await callGroqAPI(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: `التقرير الطبي المطلوب تحليله:\n\n${reportText}` }
            ],
            { temperature: 0.1, json_mode: true, timeout: 60000 }
        );

        // تحليل النص المرجع وتحويله إلى كائن جافاسكريبت
        let parsed;
        try {
            parsed = JSON.parse(result.content);
        } catch (parseError) {
            // محاولة استخراج JSON من النص إذا كان ملفوفاً بنص إضافي
            const startIdx = result.content.indexOf("{");
            const endIdx = result.content.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                parsed = JSON.parse(result.content.slice(startIdx, endIdx + 1));
            } else {
                throw new Error("فشل في تحليل استجابة JSON. حاول مع تقرير أوضح.");
            }
        }

        // تطبيع الحقول للتوافق مع بنية النظام
        if (parsed.clinical && !parsed.diagnoses) {
            parsed.diagnoses = parsed.clinical.diagnosis
                ? [parsed.clinical.diagnosis]
                : [];
            parsed.symptoms = parsed.clinical.symptoms || [];
            parsed.medications = parsed.clinical.medications || [];
            parsed.recommendations = parsed.clinical.recommendations || "";
            parsed.severity = parsed.clinical.severity || "متوسط";
        }

        return parsed;

    } catch (error) {
        console.error("خطأ في محرك الاستخراج الذكي:", error);
        throw error;
    }
}


/**
 * المهمة الثانية: محرك البحث باللغة الطبيعية (Natural Language Search)
 * يترجم سؤال المستخدم إلى كائن فلاتر، ثم يقوم بفلترة السجلات المخزنة محلياً.
 * @param {string} userQuery - بحث الطبيب (مثال: "مرضى القلب فوق 60").
 * @param {Array} storedRecords - مصفوفة السجلات الطبية الحالية للنظام.
 * @returns {Promise<Array>} قائمة السجلات المطابقة لشرط البحث.
 */
async function processNaturalLanguageQuery(userQuery, storedRecords) {
    const systemPrompt = `أنت مساعد قواعد بيانات طبي ذكي.
مهمتك تحويل سؤال الطبيب (باللغة العربية) إلى كائن JSON يحتوي على شروط البحث.
المخرج يجب أن يكون JSON فقط بالهيكل التالي:
{
  "conditions": ["مرض أو حالة 1", "حالة 2"],
  "age_range": {"min": 0, "max": 120},
  "medications": ["اسم الدواء"],
  "gender": "",
  "department": "",
  "severity": ""
}
ملاحظات:
- إذا لم يذكر المستخدم أمراضاً، اترك conditions فارغة
- إذا ذكر "فوق 60" يعني min:60, max:120
- إذا ذكر "بين 20 و40" يعني min:20, max:40
- إذا لم يحدد عمراً اترك age_range كما هو (0-120)`;

    try {
        const result = await callGroqAPI(
            [
                { role: "system", content: systemPrompt },
                { role: "user", content: `سؤال الطبيب: ${userQuery}` }
            ],
            { temperature: 0.0, json_mode: true, timeout: 30000 }
        );

        let filters;
        try {
            filters = JSON.parse(result.content);
        } catch (parseError) {
            const startIdx = result.content.indexOf("{");
            const endIdx = result.content.lastIndexOf("}");
            if (startIdx !== -1 && endIdx !== -1) {
                filters = JSON.parse(result.content.slice(startIdx, endIdx + 1));
            } else {
                throw new Error("تعذر تحليل فلاتر البحث الذكية.");
            }
        }

        console.log("الفلاتر المستخرجة:", filters);

        // تطبيق الفلاتر على السجلات الطبية (Client-Side Filtering)
        const matchedRecords = storedRecords.filter(record => {
            let isMatch = true;

            // 1. فحص العمر
            if (record.patient && record.patient.age) {
                const ageNum = parseInt(record.patient.age, 10);
                if (!isNaN(ageNum) && filters.age_range) {
                    if (ageNum < (filters.age_range.min || 0) || ageNum > (filters.age_range.max || 120)) {
                        isMatch = false;
                    }
                }
            }

            // 2. فحص الجنس
            if (filters.gender && record.patient && record.patient.gender) {
                const genderMap = {
                    "male": "ذكر", "female": "أنثى",
                    "ذكر": "ذكر", "أنثى": "أنثى"
                };
                const normalizedFilter = genderMap[filters.gender] || filters.gender;
                if (record.patient.gender !== normalizedFilter) {
                    isMatch = false;
                }
            }

            // 3. فحص الحالات والأمراض (التشخيص أو الأعراض)
            if (filters.conditions && filters.conditions.length > 0) {
                const diagnoses = Array.isArray(record.diagnoses) ? record.diagnoses.join(" ") : "";
                const symptoms = Array.isArray(record.symptoms) ? record.symptoms.join(" ") : "";
                const clinical = record.clinical || {};
                const diagnosisText = clinical.diagnosis || "";
                const symptomsText = Array.isArray(clinical.symptoms) ? clinical.symptoms.join(" ") : "";
                const fullClinicalText = (diagnoses + " " + symptoms + " " + diagnosisText + " " + symptomsText).toLowerCase();

                const hasCondition = filters.conditions.some(cond =>
                    fullClinicalText.includes(cond.toLowerCase())
                );
                if (!hasCondition) isMatch = false;
            }

            // 4. فحص الأدوية
            if (filters.medications && filters.medications.length > 0) {
                const meds = Array.isArray(record.medications)
                    ? record.medications.map(m => (m && m.name) || "").join(" ")
                    : "";
                const clinicalMeds = record.clinical && Array.isArray(record.clinical.medications)
                    ? record.clinical.medications.map(m => (m && m.name) || "").join(" ")
                    : "";
                const allMedsText = (meds + " " + clinicalMeds).toLowerCase();

                const hasMed = filters.medications.some(med =>
                    allMedsText.includes(med.toLowerCase())
                );
                if (!hasMed) isMatch = false;
            }

            // 5. فحص الشدة
            if (filters.severity && record.severity) {
                if (!record.severity.includes(filters.severity)) {
                    isMatch = false;
                }
            }

            return isMatch;
        });

        return matchedRecords;

    } catch (error) {
        console.error("خطأ أثناء ترجمة لغة الاستعلام:", error);
        throw error;
    }
}


/**
 * المهمة الثالثة: الوكيل الذكي للقرارات السريرية (Clinical Decision Agent)
 * يقدم استشارات وتنبيهات طبية مبنية حصرياً على البيانات المستخرجة للمريض.
 * @param {string} question - سؤال الطبيب (مثال: "هل يوجد تعارض إذا صرفت بنادول؟").
 * @param {object} patientContext - السجل الطبي الخاص بالمريض (نتائج دوال الاستخراج).
 * @returns {Promise<string>} نص استشارة الوكيل الطبي.
 */
async function askClinicalAgent(question, patientContext) {
    const systemPrompt = `أنت "مستشار طبي سريري سعودي ذكي" مدمج في نظام الأرشيف الطبي (CBAHI Compliant).
المطلوب منك الإجابة على استفسارات الطبيب المعالج بناءً **حصرياً** على "سياق المريض" المرفق بالأسفل.
- قُم بتسليط الضوء على المخاطر، موانع الاستعمال، والتفاعلات الدوائية (Drug-Drug Interactions) إن وُجدت.
- لا تخترع أية أمراض أو بيانات روتينية غير موجودة في السياق.
- إذا كانت المعلومات غير كافية في السجل، اذكر بوضوح: "المعلومات المتوفرة في السجل الحالي لا تكفي للجزم...".
- قُم باستخدام مصطلحات طبية مهنية عربية دقيقة.
- نسّق الإجابة بنقاط مرقمة واضحة.`;

    try {
        const result = await callGroqAPI(
            [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `السجل الطبي للمريض:\n${JSON.stringify(patientContext, null, 2)}\n\n--- \nسؤال الطبيب:\n${question}`
                }
            ],
            { temperature: 0.3, timeout: 45000 }
        );

        return result.content;

    } catch (error) {
        console.error("فشل في استدعاء الوكيل السريري:", error);
        throw error;
    }
}

// التصدير للاستخدام في الوحدات الأخرى أو ربطها بالنافذة العامة (Window) للاستدعاء من الواجهة
export { extractMedicalRecord, processNaturalLanguageQuery, askClinicalAgent, callGroqAPI, getGroqConfig };

if (typeof window !== "undefined") {
    window.SmartClinicalAI = {
        extractMedicalRecord,
        processNaturalLanguageQuery,
        askClinicalAgent,
        callGroqAPI,
        getGroqConfig
    };
}
