// ملف المنطق التشغيلي للوحة تحليلات المرفوضات بالذكاء الاصطناعي
// مصنع ميس للمنتجات الطبية - لوحة التحكم التفاعلية الشاملة
// يدعم وضعي التشغيل: العرض الثابت (Offline) والتحليل الديناميكي المتصل بالخادم (Node.js/Gemini)

const BACKEND_URL = "http://localhost:3000";
let isBackendActive = false;
let activeRecords = [];

document.addEventListener("DOMContentLoaded", async () => {
    // ١. التحقق من حالة الاتصال بالخادم الخلفي (النشط لقراءة الإكسل وجريان الذكاء الاصطناعي)
    await checkBackendConnection();
    
    // ٢. تحميل البيانات وتهيئة مكونات الصفحة النشطة
    await loadDashboardData();
    
    // ٣. تهيئة البحث والفلترة الفورية
    initSearchFilter();
    
    // ٤. تفعيل محادثات المساعد الذكي
    initChatAssistant();
    
    // ٥. تفعيل زر تشغيل التحليل بالذكاء الاصطناعي
    initAIAnalysisTrigger();
});

// ١. التحقق من الخادم الخلفي لتحديد وضع العمل (نظام محاكي أم متصل بالإكسل)
async function checkBackendConnection() {
    const sourceTextEl = document.getElementById("data-source-text");
    const sourcePulseEl = document.getElementById("data-source-pulse");
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
            isBackendActive = true;
            console.log("[STATUS] Connected successfully to local Node.js Express backend.");
            
            if (sourceTextEl) {
                sourceTextEl.textContent = "مصدر البيانات: إكسل + خادم محلي";
                sourceTextEl.parentElement.style.background = "rgba(46, 204, 113, 0.15)";
                sourceTextEl.parentElement.style.borderColor = "rgba(46, 204, 113, 0.3)";
                sourceTextEl.parentElement.style.color = "#2ecc71";
            }
            if (sourcePulseEl) sourcePulseEl.style.background = "#2ecc71";
        }
    } catch (err) {
        console.log("[STATUS] Backend server is not running. Operating in Mode 1 (Offline Static Presentation Mode).");
        isBackendActive = false;
        if (sourceTextEl) {
            sourceTextEl.textContent = "مصدر البيانات: Static Demo Data";
        }
    }
}

// ٢. شحن البيانات ديناميكياً بناءً على وضع التشغيل النشط
async function loadDashboardData() {
    if (isBackendActive) {
        try {
            // جلب البيانات من الخادم الخلفي (المتصل بملف الإكسل الفعلي)
            const resRejects = await fetch(`${BACKEND_URL}/api/rejects`);
            const rejectData = await resRejects.json();
            activeRecords = rejectData.records;
            
            const resSummary = await fetch(`${BACKEND_URL}/api/summary`);
            const summaryData = await resSummary.json();
            
            // تحديث بطاقات الإحصائيات الرئيسية بالبيانات الحية
            updateStatsDOM(summaryData.totalCases, summaryData.totalCost, summaryData.pendingApprovals, summaryData.pendingDestruction, summaryData.highRiskCases);
            
            // تعبئة جداول البيانات
            renderRejectTable(activeRecords);
            
            // تحديث التقرير التحليلي على الصفحة الرئيسية
            const aiTextEl = document.querySelector(".ai-summary-text");
            if (aiTextEl && summaryData.warning) {
                // إظهار تنبيه إذا كانت البيانات مستخلصة أو محاكاة من الإكسل
                const warningDiv = document.createElement("div");
                warningDiv.style.background = "rgba(241, 196, 15, 0.15)";
                warningDiv.style.borderRight = "4px solid #f1c40f";
                warningDiv.style.padding = "10px";
                warningDiv.style.marginBottom = "15px";
                warningDiv.style.fontSize = "12px";
                warningDiv.style.color = "#f1c40f";
                warningDiv.textContent = summaryData.warning;
                aiTextEl.parentElement.insertBefore(warningDiv, aiTextEl);
            }
            
            // تحديث التوزيع التكلفي للأقسام في صفحات الإدارة والمالية
            renderDepartmentCostSummary(activeRecords);
            
        } catch (err) {
            console.error("Error fetching live data, falling back to static:", err);
            useStaticFallback();
        }
    } else {
        useStaticFallback();
    }
}

// تحميل البيانات الساكنة كخيار احتياطي للـ Offline
function useStaticFallback() {
    activeRecords = MOCK_REJECT_RECORDS;
    updateStatsDOM(
        AI_ANALYTICS_STATS.totalCases,
        AI_ANALYTICS_STATS.totalCost,
        AI_ANALYTICS_STATS.pendingApprovals,
        AI_ANALYTICS_STATS.pendingDestruction,
        AI_ANALYTICS_STATS.highRiskCases
    );
    renderRejectTable(activeRecords);
    renderDepartmentCostSummary(activeRecords);
}

// تحديث قيم عناصر بطاقات الإحصائيات في شاشات العرض
function updateStatsDOM(cases, cost, approvals, destruction, highRisk) {
    const totalCasesEl = document.getElementById("stat-total-cases");
    const totalCostEl = document.getElementById("stat-total-cost");
    const pendingApprovalsEl = document.getElementById("stat-pending-approvals");
    const pendingDestructionEl = document.getElementById("stat-pending-destruction");
    const highRiskCasesEl = document.getElementById("stat-high-risk");
    
    if (totalCasesEl) totalCasesEl.textContent = cases;
    if (totalCostEl) totalCostEl.textContent = formatCurrency(cost);
    if (pendingApprovalsEl) pendingApprovalsEl.textContent = approvals;
    if (pendingDestructionEl) pendingDestructionEl.textContent = destruction;
    if (highRiskCasesEl) highRiskCasesEl.textContent = highRisk;
    
    // تحديث قيم شاشات المالية والإدارة إن وجدت
    const execCostEl = document.getElementById("exec-total-cost");
    if (execCostEl) execCostEl.textContent = formatCurrency(cost);
}

// عرض حركات وجداول المرفوضات
function renderRejectTable(records) {
    const tbody = document.getElementById("reject-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (records.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 20px;">لا توجد قيود مطابقة لعملية البحث الحالية.</td></tr>`;
        return;
    }
    
    records.forEach(item => {
        const tr = document.createElement("tr");
        
        let riskClass = "low";
        let riskLabel = "منخفضة";
        if (item.riskScore >= 85) {
            riskClass = "critical";
            riskLabel = "حرجة جداً";
        } else if (item.riskScore >= 70) {
            riskClass = "critical"; // Red badge
            riskLabel = "حرجة";
        } else if (item.riskScore >= 40) {
            riskClass = "high"; // Amber badge
            riskLabel = "متوسطة";
        }
        
        let approvalBadgeClass = "warning";
        if (item.approvalStatus === "تمت الموافقة النهائية" || item.approvalStatus === "تم الفحص الفني والقبول") {
            approvalBadgeClass = "success";
        }
        
        let destructionBadgeClass = "warning";
        if (item.destructionStatus === "تم الإتلاف بنجاح" || item.destructionStatus === "تم الإرجاع للمورد بنجاح") {
            destructionBadgeClass = "success";
        } else if (item.destructionStatus === "لا يتطلب إتلاف مخزني") {
            destructionBadgeClass = "info";
        }
        
        tr.innerHTML = `
            <td><strong>${item.docNo}</strong></td>
            <td>${item.date}</td>
            <td>${item.department}</td>
            <td>${item.itemName}</td>
            <td>${item.quantity.toLocaleString("ar-SA")}</td>
            <td><strong>${formatCurrency(item.cost)}</strong></td>
            <td><span class="badge ${approvalBadgeClass}">${item.approvalStatus}</span></td>
            <td><span class="badge ${destructionBadgeClass}">${item.destructionStatus}</span></td>
            <td>
                <div class="risk-indicator ${riskClass}">
                    <span class="dot"></span>
                    <span>${item.riskScore} (${riskLabel})</span>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// عرض وتوزيع خسائر المرفوضات حسب الأقسام في شاشة المالية والإدارة
function renderDepartmentCostSummary(records) {
    const deptBody = document.getElementById("dept-cost-body");
    if (!deptBody) return;
    
    const deptCosts = {};
    const deptCounts = {};
    const deptQty = {};
    let totalCost = 0;
    
    records.forEach(r => {
        deptCosts[r.department] = (deptCosts[r.department] || 0) + r.cost;
        deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
        deptQty[r.department] = (deptQty[r.department] || 0) + r.quantity;
        totalCost += r.cost;
    });
    
    deptBody.innerHTML = "";
    
    const sortedDepts = Object.keys(deptCosts).sort((a, b) => deptCosts[b] - deptCosts[a]);
    
    sortedDepts.forEach((dept, index) => {
        const cost = deptCosts[dept];
        const count = deptCounts[dept];
        const qty = deptQty[dept];
        const percent = totalCost > 0 ? ((cost / totalCost) * 100).toFixed(1) : 0;
        
        let badgeClass = "success";
        if (percent > 40) badgeClass = "danger";
        else if (percent > 20) badgeClass = "warning";
        else if (percent > 10) badgeClass = "info";
        
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${dept}</strong></td>
            <td>${count} حركات</td>
            <td>${qty.toLocaleString("ar-SA")} قطعة</td>
            <td><strong>${formatCurrency(cost)}</strong></td>
            <td><span class="badge ${badgeClass}">${percent}%</span></td>
        `;
        deptBody.appendChild(tr);
    });
}

// ٣. إعداد البحث والفلترة الفورية
function initSearchFilter() {
    const searchInput = document.getElementById("reject-search");
    if (!searchInput) return;
    
    searchInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        
        const filtered = activeRecords.filter(item => {
            return (
                item.docNo.toLowerCase().includes(query) ||
                item.itemName.toLowerCase().includes(query) ||
                item.department.toLowerCase().includes(query) ||
                item.itemCode.toLowerCase().includes(query) ||
                (item.lotNo && item.lotNo.toLowerCase().includes(query)) ||
                (item.reason && item.reason.toLowerCase().includes(query))
            );
        });
        
        renderRejectTable(filtered);
    });
}

// ٤. تفعيل محادثات المساعد الذكي
function initChatAssistant() {
    const chatInput = document.getElementById("chat-input-field");
    const chatSubmit = document.getElementById("chat-send-btn");
    const chatContainer = document.getElementById("chat-messages-container");
    
    if (!chatInput || !chatSubmit || !chatContainer) return;
    
    const responses = {
        "تحليل": "بناءً على قراءة سجلات نظام فوكس، يتركز الهدر المالي بصورة أساسية في قسم حقن البلاستيك بنسبة 55%، ويرجع السبب الرئيسي لوجود شوائب سوداء ناتجة عن تذبذب سخانات القوالب رقم 3 و5. يوصى بجدولة الصيانة الوقائية الفورية لهذه الماكينات.",
        "خسائر": "إجمالي الخسائر التراكمية الفعالة المسجلة حالياً تبلغ 1,051,400 ريال سعودي. يتوقع النظام الذكي وصول الخسائر السنوية لـ 2,160,000 ريال سعودي ما لم يتم تفعيل بوابات الرقابة المالية السابقة للإتلاف وتخفيض تكرار المشاكل الجذرية بنسبة 25%.",
        "كابا": "لتجنب تكرار رفض شحنات حبيبات البلاستيك الطبي، نقترح الإجراء الوقائي التالي: 1. معايرة وفحص سخانات قوالب الحقن بصورة أسبوعية. 2. تفعيل آلية فحص العينات كل ساعتين لعزل الدفعات المعيبة مبكراً. 3. تحديث دليل إجراءات فحص الخامات الواردة بالمستودع.",
        "مالية": "تنبيه مالي عاجل: توجد حركتان معلقتان بمستويات الفئة الثالثة (تتجاوز 50,000 ريال سعودي) بقيمة إجمالية 530,000 ريال سعودي (الطلب MS-26-08122 والطلب MS-26-08085). يتطلب هذا تدخلاً سريعاً للمدير المالي لبحث فرص استرداد التكاليف من الموردين قبل تفويض التدمير المادي."
    };
    
    function handleSendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        appendMessage(text, "user");
        chatInput.value = "";
        
        setTimeout(() => {
            let botText = "عذراً، أنا مساعد استشاري ذكي مخصص لتحليل بيانات المرفوضات لمصنع ميس. يمكنك كتابة استفسار يحتوي على كلمات مثل (تحليل، خسائر، كابا، مالية) للحصول على قراءة إحصائية فورية للبيانات المتاحة.";
            
            const lowerText = text.toLowerCase();
            for (let key in responses) {
                if (lowerText.includes(key)) {
                    botText = responses[key];
                    break;
                }
            }
            appendMessage(botText, "bot");
        }, 800);
    }
    
    chatSubmit.addEventListener("click", handleSendMessage);
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSendMessage();
        }
    });
    
    function appendMessage(text, sender) {
        const msgDiv = document.createElement("div");
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatContainer.appendChild(msgDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// ٥. تفعيل زر تشغيل التحليل بالذكاء الاصطناعي مع جمناي
function initAIAnalysisTrigger() {
    const runBtn = document.getElementById("run-ai-btn");
    const aiTextEl = document.querySelector(".ai-summary-text");
    
    if (!runBtn) return;
    
    runBtn.addEventListener("click", async () => {
        // ١. وضع واجهة المستخدم في حالة التحميل النشط
        runBtn.disabled = true;
        runBtn.innerHTML = `<span class="icon" style="display: inline-block; animation: spin 1s linear infinite;">🔄</span><span>جاري تشغيل تحليل جمناي...</span>`;
        
        if (aiTextEl) {
            aiTextEl.style.opacity = "0.5";
            aiTextEl.textContent = "جاري الاتصال بقاعدة البيانات وفلترة وتجهيل البيانات الحساسة وإرسال التقرير التشغيلي الآمن لواجهة جمناي للاستبصار... يرجى الانتظار.";
        }
        
        try {
            // ٢. إرسال طلب المعالجة والتحليل للخادم الخلفي
            const res = await fetch(`${BACKEND_URL}/api/run-analysis`, {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            
            // ٣. تحديث النص بالاستبصار الراجع
            if (aiTextEl) {
                aiTextEl.style.opacity = "1";
                aiTextEl.textContent = data.overview;
                
                // تحديث بطاقة التنبيهات الذكية الإضافية
                const tipsContainer = document.querySelector(".ai-summary-tips");
                if (tipsContainer) {
                    tipsContainer.innerHTML = `
                        <div class="ai-tip-item"><strong>توصية امتثال الجودة:</strong> ${data.quality}</div>
                        <div class="ai-tip-item"><strong>تنبيه الرقابة المالية:</strong> ${data.finance}</div>
                        <div class="ai-tip-item" style="background: rgba(26, 188, 156, 0.08); border-right: 4px solid #1abc9c; color: #1abc9c;"><strong>مصدر التحليل الحلي:</strong> ${data.source || 'Gemini Pro API'}</div>
                    `;
                }
            }
            
            // تحديث بطاقات الشاشات الأخرى بشكل فوري
            const execSummaryEl = document.getElementById("exec-ai-summary");
            if (execSummaryEl) execSummaryEl.textContent = data.overview;
            
            const finAlertEl = document.getElementById("fin-ai-alert");
            if (finAlertEl) finAlertEl.textContent = data.finance;
            
            const qualAlertEl = document.getElementById("qual-ai-alert");
            if (qualAlertEl) qualAlertEl.textContent = data.quality;
            
        } catch (err) {
            console.error("Failed to run AI analysis:", err);
            if (aiTextEl) {
                aiTextEl.style.opacity = "1";
                aiTextEl.textContent = "عذراً، فشل الاتصال بالخادم الخلفي لتشغيل تحليل الذكاء الاصطناعي الفعلي. تأكد من تشغيل خادم server.js محلياً وتوفر مفتاح الربط الآمن.";
            }
        } finally {
            // ٤. إعادة زر التنشيط لوضعه الطبيعي
            runBtn.disabled = false;
            runBtn.innerHTML = `<span class="icon">✦</span><span>تشغيل تحليل الذكاء الاصطناعي</span>`;
        }
    });
}

// مساعد تنسيق العملة المحلية
function formatCurrency(value) {
    return value.toLocaleString("ar-SA") + " ريال سعودي";
}
