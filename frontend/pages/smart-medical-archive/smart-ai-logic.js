// smart-ai-logic.js
// وحدة الذكاء الاصطناعي للأرشيف الطبي الذكي - BrightAI
// المكدس: Vanilla JS / Groq Flash API (Llama 3 70B)

/**
 * إعدادات الاتصال بنموذج الذكاء الاصطناعي
 * ملاحظة أمنية: وضع المفتاح هنا لأغراض العرض (Client-side PoC). 
 * لبيئة الإنتاج (Production)، يجب استدعاء API عبر Node.js Backend 
 * (مثل Express.js) لحماية GROQ_API_KEY.
 */
const AI_CONFIG = {
    API_URL: "https://api.groq.com/openai/v1/chat/completions",
    API_KEY: "GROQ_KEY_REDACTED", // جلب من .env في بيئة الـ Node
    MODEL: "llama3-70b-8192",
    DEFAULT_HEADERS: {
        "Content-Type": "application/json"
    }
};

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
    "gender": "ذكر/أنثى/غير محدد"
  },
  "clinical": {
    "diagnosis": "التشخيص الرئيسي",
    "symptoms": ["عرض 1", "عرض 2"],
    "medications": [
      { "name": "اسم الدواء", "dose": "الجرعة", "frequency": "التكرار" }
    ],
    "recommendations": "التوصيات الطبية والمتابعة",
    "severity": "منخفض" | "متوسط" | "حرج"
  },
  "hospital_department": "القسم الأنسب (مثل: قسم القلب، الباطنة)"
}`;

    try {
        const response = await fetch(AI_CONFIG.API_URL, {
            method: "POST",
            headers: {
                ...AI_CONFIG.DEFAULT_HEADERS,
                "Authorization": `Bearer ${AI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `التقرير الطبي المطلوب تحليله:\n\n${reportText}` }
                ],
                temperature: 0.1, // تقليل الإبداع لزيادة دقة الاستخراج
                response_format: { type: "json_object" } // إجبار النموذج على إرجاع JSON
            })
        });

        if (!response.ok) {
            throw new Error(`مشكلة في الاتصال بالخادم الذكي (Status: ${response.status})`);
        }

        const data = await response.json();
        // تحليل النص المرجع وتحويله إلى كائن جافاسكريبت
        return JSON.parse(data.choices[0].message.content);

    } catch (error) {
        console.error("خطأ حرج في محرك الاستخراج الذكي:", error);
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
  "conditions": ["مرض أو حالة 1", "حالة 2"], // اتركها فارغة إذا لم يذكر أمراض
  "age_range": {"min": 0, "max": 120}, // استنتج القيم من السؤال (مثلاً: فوق 60 يعني min:60)
  "medications": ["اسم الدواء"] // اتركها فارغة إذا لم يذكر أدوية
}`;

    try {
        const response = await fetch(AI_CONFIG.API_URL, {
            method: "POST",
            headers: {
                ...AI_CONFIG.DEFAULT_HEADERS,
                "Authorization": `Bearer ${AI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `سؤال الطبيب: ${userQuery}` }
                ],
                temperature: 0.0,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error("تعذر استخراج الفلاتر الذكية.");

        const aiResponse = await response.json();
        const filters = JSON.parse(aiResponse.choices[0].message.content);

        console.log("الفلاتر المستخرجة:", filters);

        // تطبيق الفلاتر على السجلات الطبية (Client-Side Filtering)
        const matchedRecords = storedRecords.filter(record => {
            let isMatch = true;

            // 1. فحص العمر
            if (record.patient?.age) {
                const ageNum = parseInt(record.patient.age, 10);
                if (filters.age_range && (ageNum < filters.age_range.min || ageNum > filters.age_range.max)) {
                    isMatch = false;
                }
            }

            // 2. فحص الحالات والأمراض (التشخيص أو الأعراض)
            if (filters.conditions && filters.conditions.length > 0) {
                const diagnosisWords = record.clinical?.diagnosis || "";
                const symptomsText = (record.clinical?.symptoms || []).join(" ");
                const fullClinicalText = diagnosisWords + " " + symptomsText;

                // البحث التقريبي (يُفضل استخدام خوارزمية بحث متطورة في الإنتاج الفعلي)
                const hasCondition = filters.conditions.some(cond => fullClinicalText.includes(cond));
                if (!hasCondition) isMatch = false;
            }

            // 3. فحص الأدوية
            if (filters.medications && filters.medications.length > 0) {
                const medsList = (record.clinical?.medications || []).map(m => m.name).join(" ");
                const hasMed = filters.medications.some(med => medsList.includes(med));
                if (!hasMed) isMatch = false;
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
- قُم باستخدام مصطلحات طبية مهنية عربية دقيقة.`;

    try {
        const response = await fetch(AI_CONFIG.API_URL, {
            method: "POST",
            headers: {
                ...AI_CONFIG.DEFAULT_HEADERS,
                "Authorization": `Bearer ${AI_CONFIG.API_KEY}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.MODEL,
                messages: [
                    { role: "system", content: systemPrompt },
                    {
                        role: "user",
                        content: `السجل الطبي للمريض:\n${JSON.stringify(patientContext, null, 2)}\n\n--- \nسؤال الطبيب:\n${question}`
                    }
                ],
                temperature: 0.3 // السماح ببعض التسلسل المنطقي المرن للشرح السريري
            })
        });

        if (!response.ok) throw new Error("تعذر الوصول لمستشار القرارات السريرية.");

        const completeData = await response.json();
        return completeData.choices[0].message.content;

    } catch (error) {
        console.error("فشل في استدعاء الوكيل السريري:", error);
        throw error;
    }
}

// التصدير للاستخدام في الوحدات الأخرى أو ربطها بالنافذة العامة (Window) للاستدعاء من الواجهة
export { extractMedicalRecord, processNaturalLanguageQuery, askClinicalAgent };

if (typeof window !== "undefined") {
    window.SmartClinicalAI = {
        extractMedicalRecord,
        processNaturalLanguageQuery,
        askClinicalAgent
    };
}
