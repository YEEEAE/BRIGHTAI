"use strict";
const e = "/api/ai/extract-text", t = "/api/ai/transcribe", n = 3e4, r = "brightai.medicalArchive.apiBase", a = "brightai.medicalArchive.storageProvider", o = "brightai.medicalArchive.storageEndpoint", i = "brightai.medicalArchive.storageToken", s = "brightai.medicalArchive.savedSearches", c = "brightai.medicalArchive.searchProvider", u = "brightai.medicalArchive.searchEndpoint", l = "brightai.medicalArchive.searchIndex", d = "brightai.medicalArchive.searchApiKey", g = "brightai.medicalArchive.searchAppId", m = "brightai.medicalArchive.dashboardLayout", p = "brightai.medicalArchive.dashboardRole", h = "brightai.medicalArchive.dashboardHistory", f = "brightai.medicalArchive.dashboardEvents", v = "brightai.medicalArchive.geminiApiKey", y = "brightai.medicalArchive.geminiModel", S = "/api/ai/gemini-chat", E = "gemini-2.5-flash", w = 6e4, b = 26214400, B = ["timelineWidget", "demographicWidget", "diagnosisWidget", "medicationWidget", "activityWidget", "alertsWidget", "liveWidget"], I = ["pdf", "docx", "doc", "dcm", "dicom", "jpg", "jpeg", "png", "webp", "mp3", "wav", "m4a", "xls", "xlsx", "txt", "md", "json", "csv", "xml", "html", "htm"], x = ["txt", "md", "csv", "json", "xml", "html", "htm"], $ = ["jpg", "jpeg", "png", "webp"], A = ["mp3", "wav", "m4a"], k = ["xls", "xlsx"], C = { "السكري": ["مرض السكري", "سكر", "Diabetes", "DM", "Hyperglycemia"], "ارتفاع الضغط": ["ضغط", "ضغط الدم", "Hypertension", "HTN"], "أمراض القلب": ["قلب", "ذبحة", "فشل قلبي", "Cardiac", "Heart disease"], "سرطان الثدي": ["ورم الثدي", "Breast cancer", "oncology breast"], "قصور الكلى": ["فشل كلوي", "Kidney failure", "Renal"], "التهاب رئوي": ["ذات الرئة", "Pneumonia", "عدوى رئوية"] }, M = { "الرياض": { lat: 24.7136, lng: 46.6753 }, "جدة": { lat: 21.5433, lng: 39.1728 }, "مكة": { lat: 21.3891, lng: 39.8579 }, "المدينة": { lat: 24.5247, lng: 39.5692 }, "الدمام": { lat: 26.4207, lng: 50.0888 }, "الخبر": { lat: 26.2172, lng: 50.1971 }, "الطائف": { lat: 21.4373, lng: 40.5127 }, "أبها": { lat: 18.2465, lng: 42.5117 }, "تبوك": { lat: 28.3838, lng: 36.555 }, "جازان": { lat: 16.8892, lng: 42.5511 }, "حائل": { lat: 27.5114, lng: 41.7208 }, "بريدة": { lat: 26.3592, lng: 43.9818 } }, L = { doctor: ["timelineWidget", "diagnosisWidget", "medicationWidget", "alertsWidget", "liveWidget"], admin: ["timelineWidget", "demographicWidget", "activityWidget", "alertsWidget", "liveWidget"], director: ["timelineWidget", "demographicWidget", "diagnosisWidget", "activityWidget", "alertsWidget", "liveWidget"] }, T = { diabetes: "تقرير عيادة السكري - مستشفى الملك فهد\nالمريض: أحمد محمد سالم\nالعمر: 58 سنة\nالمدينة: جدة\nرقم الملف: MRN-22918\nالتاريخ: 2026-02-11\nالتشخيص: داء سكري نوع ثاني غير منضبط مع اعتلال أعصاب طرفية مبكر.\nالعلامات الحيوية: ضغط 150/92، نبض 87، وزن 92 كجم.\nنتائج المختبر: HbA1c = 9.1% (مرتفع)، كرياتينين 1.1 mg/dL، كوليسترول LDL = 142 mg/dL.\nالأدوية الحالية: Metformin 1000mg مرتين يومياً، Insulin glargine 18 وحدة مساءً، Atorvastatin 20mg ليلاً.\nالخطة العلاجية: تعديل جرعة الإنسولين إلى 22 وحدة مساءً، تثقيف غذائي، متابعة العيون خلال شهر، إعادة HbA1c بعد 12 أسبوع.", oncology: "تقرير متابعة أورام - مركز الأورام\nالمريضة: فاطمة سعد القحطاني\nالعمر: 42 سنة\nالمدينة: الرياض\nالتاريخ: 2026-01-28\nالتشخيص: سرطان الثدي الأيسر مرحلة ثانية بعد الاستئصال الجزئي.\nالعلاج: 4 دورات علاج كيميائي مكتملة، حالياً علاج هرموني.\nالآثار الجانبية: إجهاد متوسط، خفقان متكرر بعد الجرعة الثالثة.\nنتيجة الإيكو القلبي: EF 53% مع توصية متابعة قلبية.\nالأدوية: Tamoxifen 20mg يومياً، Ondansetron عند الحاجة.\nالتوصيات: متابعة عيادة القلب خلال أسبوعين، استمرار العلاج الهرموني، إعادة تصوير بعد 3 أشهر.", emergency: "تقرير طوارئ - موسم العمرة\nالمريض: عبدالعزيز حسن علي\nالعمر: 67 سنة\nالمدينة: مكة\nالتاريخ: 2026-02-02\nالشكوى الرئيسية: ضيق نفس حاد وألم صدري ضاغط منذ ساعتين.\nالتاريخ المرضي: ارتفاع ضغط الدم، فشل قلبي مزمن، سكري نوع ثاني.\nالفحوصات: Troponin إيجابي، أشعة صدر أظهرت احتقان رئوي، تشبع الأكسجين 89%.\nالتدخل: إعطاء أوكسجين، Furosemide وريدي، بدء بروتوكول متلازمة الشريان التاجي الحادة.\nالنتيجة: تحويل للعناية المركزة القلبية مع تنبيه خطورة مرتفعة ومتابعة فورية لقسم القلب." }, j = { records: [], lastExtract: null, lastFileMeta: null, apiBase: null, geminiApiKey: "", geminiModel: E, uploadQueue: [], queueProcessing: false, stopQueueRequested: false, storageProvider: "none", storageEndpoint: "", storageToken: "", searchCache: /* @__PURE__ */ new Map(), searchLastKey: "", searchCurrentPage: 1, searchLastAllResults: [], searchLastPagedResults: [], searchSaved: [], searchProvider: "local", searchEndpoint: "", searchIndex: "", searchApiKey: "", searchAppId: "", searchTypingTimer: null, voiceRecognition: null, voiceRecognitionActive: false, dashboardCharts: {}, dashboardWidgetOrder: B.slice(), dashboardHiddenWidgets: /* @__PURE__ */ new Set(), dashboardRole: "director", dashboardHistory: [], dashboardEvents: [], dashboardNotifications: [], dashboardRefreshTimer: null, liveSocket: null, liveSocketRetryTimer: null, liveSocketConnected: false, widgetDragSourceId: "" }, R = { hospitalName: document.getElementById("hospitalName"), hospitalCity: document.getElementById("hospitalCity"), hospitalDepartment: document.getElementById("hospitalDepartment"), reportInput: document.getElementById("reportInput"), reportFile: document.getElementById("reportFile"), reportFolder: document.getElementById("reportFolder"), dropZone: document.getElementById("dropZone"), pickFilesBtn: document.getElementById("pickFilesBtn"), pickFolderBtn: document.getElementById("pickFolderBtn"), extractFileBtn: document.getElementById("extractFileBtn"), processBatchBtn: document.getElementById("processBatchBtn"), cancelBatchBtn: document.getElementById("cancelBatchBtn"), resumeBatchBtn: document.getElementById("resumeBatchBtn"), analyzeBatchBtn: document.getElementById("analyzeBatchBtn"), fileStatus: document.getElementById("fileStatus"), batchStatus: document.getElementById("batchStatus"), batchSummary: document.getElementById("batchSummary"), fileQueue: document.getElementById("fileQueue"), batchReport: document.getElementById("batchReport"), storageProvider: document.getElementById("storageProvider"), storageEndpoint: document.getElementById("storageEndpoint"), storageToken: document.getElementById("storageToken"), saveStorageBtn: document.getElementById("saveStorageBtn"), uploadStorageBtn: document.getElementById("uploadStorageBtn"), storageStatus: document.getElementById("storageStatus"), analyzeBtn: document.getElementById("analyzeBtn"), saveRecordBtn: document.getElementById("saveRecordBtn"), extractStatus: document.getElementById("extractStatus"), extractResult: document.getElementById("extractResult"), recordsList: document.getElementById("recordsList"), recordsCount: document.getElementById("recordsCount"), extractedCount: document.getElementById("extractedCount"), riskCount: document.getElementById("riskCount"), searchQuery: document.getElementById("searchQuery"), searchBtn: document.getElementById("searchBtn"), searchStatus: document.getElementById("searchStatus"), searchResult: document.getElementById("searchResult"), searchSuggestions: document.getElementById("searchSuggestions"), searchQuickStatus: document.getElementById("searchQuickStatus"), searchStats: document.getElementById("searchStats"), searchClusters: document.getElementById("searchClusters"), voiceSearchBtn: document.getElementById("voiceSearchBtn"), voiceFileBtn: document.getElementById("voiceFileBtn"), voiceFileInput: document.getElementById("voiceFileInput"), imageSearchBtn: document.getElementById("imageSearchBtn"), imageSearchInput: document.getElementById("imageSearchInput"), filterAgeMin: document.getElementById("filterAgeMin"), filterAgeMax: document.getElementById("filterAgeMax"), filterGender: document.getElementById("filterGender"), filterDateFrom: document.getElementById("filterDateFrom"), filterDateTo: document.getElementById("filterDateTo"), filterDepartment: document.getElementById("filterDepartment"), filterExclude: document.getElementById("filterExclude"), filterNearCity: document.getElementById("filterNearCity"), filterRadiusKm: document.getElementById("filterRadiusKm"), semanticMode: document.getElementById("semanticMode"), searchEngineProvider: document.getElementById("searchEngineProvider"), searchEngineEndpoint: document.getElementById("searchEngineEndpoint"), searchEngineIndex: document.getElementById("searchEngineIndex"), searchEngineApiKey: document.getElementById("searchEngineApiKey"), searchEngineAppId: document.getElementById("searchEngineAppId"), applyFiltersBtn: document.getElementById("applyFiltersBtn"), saveSearchBtn: document.getElementById("saveSearchBtn"), savedSearchesSelect: document.getElementById("savedSearchesSelect"), loadSavedSearchBtn: document.getElementById("loadSavedSearchBtn"), searchPrevPageBtn: document.getElementById("searchPrevPageBtn"), searchNextPageBtn: document.getElementById("searchNextPageBtn"), exportSearchCsvBtn: document.getElementById("exportSearchCsvBtn"), exportSearchExcelBtn: document.getElementById("exportSearchExcelBtn"), exportSearchPdfBtn: document.getElementById("exportSearchPdfBtn"), timelineGranularitySelect: document.getElementById("timelineGranularitySelect"), dashboardRoleSelect: document.getElementById("dashboardRoleSelect"), applyRoleTemplateBtn: document.getElementById("applyRoleTemplateBtn"), saveDashboardLayoutBtn: document.getElementById("saveDashboardLayoutBtn"), resetDashboardLayoutBtn: document.getElementById("resetDashboardLayoutBtn"), refreshDashboardBtn: document.getElementById("refreshDashboardBtn"), dashboardStatus: document.getElementById("dashboardStatus"), dashboardWidgets: document.getElementById("dashboardWidgets"), widgetToggles: Array.from(document.querySelectorAll("[data-widget-toggle]")), overviewTotalRecords: document.getElementById("overviewTotalRecords"), overviewTotalGrowth: document.getElementById("overviewTotalGrowth"), overviewNewRecords: document.getElementById("overviewNewRecords"), overviewCriticalCases: document.getElementById("overviewCriticalCases"), overviewDailyUsage: document.getElementById("overviewDailyUsage"), overviewAvgProcessing: document.getElementById("overviewAvgProcessing"), kpiResponseTime: document.getElementById("kpiResponseTime"), kpiExtractionAccuracy: document.getElementById("kpiExtractionAccuracy"), kpiAnalysisSuccess: document.getElementById("kpiAnalysisSuccess"), kpiUserSatisfaction: document.getElementById("kpiUserSatisfaction"), timelineChart: document.getElementById("timelineChart"), ageDistributionChart: document.getElementById("ageDistributionChart"), genderDistributionChart: document.getElementById("genderDistributionChart"), geoHeatmapChart: document.getElementById("geoHeatmapChart"), topDiagnosesChart: document.getElementById("topDiagnosesChart"), topMedicationsChart: document.getElementById("topMedicationsChart"), userActivityChart: document.getElementById("userActivityChart"), peakHoursChart: document.getElementById("peakHoursChart"), productivityChart: document.getElementById("productivityChart"), medicationListInteractive: document.getElementById("medicationListInteractive"), drugInteractionList: document.getElementById("drugInteractionList"), urgentAlertsList: document.getElementById("urgentAlertsList"), medExpiryAlertsList: document.getElementById("medExpiryAlertsList"), followupAlertsList: document.getElementById("followupAlertsList"), anomalyAlertsList: document.getElementById("anomalyAlertsList"), liveSocketStatus: document.getElementById("liveSocketStatus"), liveReconnectBtn: document.getElementById("liveReconnectBtn"), liveNotificationsList: document.getElementById("liveNotificationsList"), insightsBtn: document.getElementById("insightsBtn"), insightsStatus: document.getElementById("insightsStatus"), insightsResult: document.getElementById("insightsResult"), exportFhirBtn: document.getElementById("exportFhirBtn"), exportCsvBtn: document.getElementById("exportCsvBtn"), exportHl7Btn: document.getElementById("exportHl7Btn"), exportArchiveFhirBtn: document.getElementById("exportArchiveFhirBtn"), exportStatus: document.getElementById("exportStatus"), apiBaseInput: document.getElementById("apiBaseInput"), geminiApiKeyInput: document.getElementById("geminiApiKeyInput"), geminiModelInput: document.getElementById("geminiModelInput"), saveConnectionBtn: document.getElementById("saveConnectionBtn"), testConnectionBtn: document.getElementById("testConnectionBtn"), connectionStatus: document.getElementById("connectionStatus"), leadHospital: document.getElementById("leadHospital"), leadName: document.getElementById("leadName"), leadPhone: document.getElementById("leadPhone"), leadBtn: document.getElementById("leadBtn"), leadStatus: document.getElementById("leadStatus"), agentQuestion: document.getElementById("agentQuestion"), agentBtn: document.getElementById("agentBtn"), agentStatus: document.getElementById("agentStatus"), agentResult: document.getElementById("agentResult"), sampleButtons: Array.from(document.querySelectorAll("[data-sample]")) };
function P(e2) {
  return String(e2 || "").trim().replace(/\/+$/, "");
}
function q() {
  const e2 = [];
  j.apiBase && e2.push(P(j.apiBase)), R.apiBaseInput && R.apiBaseInput.value && e2.push(P(R.apiBaseInput.value));
  const t2 = P(O(r));
  return t2 && e2.push(t2), window.BRIGHTAI_API_BASE && "string" == typeof window.BRIGHTAI_API_BASE && e2.push(P(window.BRIGHTAI_API_BASE)), window.location && window.location.origin && "null" !== window.location.origin && e2.push(P(window.location.origin)), e2.push("http://127.0.0.1:3000"), e2.push("http://localhost:3000"), e2.push("https://api.brightai.sa"), e2.filter(function(e3, t3, n2) {
    return e3 && n2.indexOf(e3) === t3;
  });
}
async function D(e2, t2, r2) {
  const a2 = new AbortController(), o2 = setTimeout(function() {
    a2.abort();
  }, r2 || n), i2 = Object.assign({}, t2 || {}, { signal: a2.signal });
  try {
    return await fetch(e2, i2);
  } finally {
    clearTimeout(o2);
  }
}
function N(e2, t2) {
  const n2 = String(e2 && e2.message || "").trim();
  return /load failed|failed to fetch|network|fetch|timeout|aborted|cors|connection|internet/i.test(n2) ? "تعذر الاتصال بخادم BrightAI. شغّل الخادم على المنفذ 3000 أو حدّث API Base من إعداد الاتصال." : n2 || t2 || "حدث خطأ غير متوقع.";
}
function O(e2) {
  try {
    return window.localStorage.getItem(e2) || "";
  } catch (e3) {
    return "";
  }
}
function F(e2, t2) {
  try {
    if (!t2) return void window.localStorage.removeItem(e2);
    window.localStorage.setItem(e2, t2);
  } catch (e3) {
    return;
  }
}
function H() {
  const e2 = P(R.apiBaseInput ? R.apiBaseInput.value : ""), t2 = R.geminiApiKeyInput ? R.geminiApiKeyInput.value.trim() : "", n2 = R.geminiModelInput ? R.geminiModelInput.value.trim() : "";
  j.apiBase = e2 || null, j.geminiApiKey = t2, j.geminiModel = n2 || E, F(r, j.apiBase || ""), F(v, j.geminiApiKey), F(y, j.geminiModel);
}
function Q() {
  return !!j.geminiApiKey || (!(!R.geminiApiKeyInput || !R.geminiApiKeyInput.value.trim()) || !!O(v));
}
function K() {
  return { key: j.geminiApiKey || (R.geminiApiKeyInput ? R.geminiApiKeyInput.value.trim() : "") || O(v) || "", model: j.geminiModel || (R.geminiModelInput ? R.geminiModelInput.value.trim() : "") || O(y) || E };
}
function W() {
  const e2 = R.storageProvider ? R.storageProvider.value.trim() : "none", t2 = R.storageEndpoint ? R.storageEndpoint.value.trim() : "", n2 = R.storageToken ? R.storageToken.value.trim() : "";
  j.storageProvider = e2 || "none", j.storageEndpoint = t2, j.storageToken = n2, F(a, j.storageProvider), F(o, j.storageEndpoint), F(i, j.storageToken);
}
function G() {
  const e2 = R.searchEngineProvider ? R.searchEngineProvider.value.trim() : "local", t2 = R.searchEngineEndpoint ? R.searchEngineEndpoint.value.trim() : "", n2 = R.searchEngineIndex ? R.searchEngineIndex.value.trim() : "", r2 = R.searchEngineApiKey ? R.searchEngineApiKey.value.trim() : "", a2 = R.searchEngineAppId ? R.searchEngineAppId.value.trim() : "";
  j.searchProvider = e2 || "local", j.searchEndpoint = t2, j.searchIndex = n2, j.searchApiKey = r2, j.searchAppId = a2, F(c, j.searchProvider), F(u, j.searchEndpoint), F(l, j.searchIndex), F(d, j.searchApiKey), F(g, j.searchAppId);
}
function U() {
  const e2 = P(R.apiBaseInput ? R.apiBaseInput.value : "");
  e2 && (j.apiBase = e2), R.geminiApiKeyInput && R.geminiApiKeyInput.value.trim() && (j.geminiApiKey = R.geminiApiKeyInput.value.trim()), R.geminiModelInput && R.geminiModelInput.value.trim() && (j.geminiModel = R.geminiModelInput.value.trim()), R.storageProvider && R.storageProvider.value && (j.storageProvider = R.storageProvider.value.trim()), R.storageEndpoint && R.storageEndpoint.value && (j.storageEndpoint = R.storageEndpoint.value.trim()), R.storageToken && R.storageToken.value && (j.storageToken = R.storageToken.value.trim()), R.searchEngineProvider && R.searchEngineProvider.value && (j.searchProvider = R.searchEngineProvider.value.trim()), R.searchEngineEndpoint && R.searchEngineEndpoint.value && (j.searchEndpoint = R.searchEngineEndpoint.value.trim()), R.searchEngineIndex && R.searchEngineIndex.value && (j.searchIndex = R.searchEngineIndex.value.trim()), R.searchEngineApiKey && R.searchEngineApiKey.value && (j.searchApiKey = R.searchEngineApiKey.value.trim()), R.searchEngineAppId && R.searchEngineAppId.value && (j.searchAppId = R.searchEngineAppId.value.trim());
}
function z(e2) {
  if (!e2 || "string" != typeof e2) return null;
  try {
    return JSON.parse(e2);
  } catch (t2) {
    const n2 = e2.indexOf("{"), r2 = e2.lastIndexOf("}");
    if (-1 !== n2 && -1 !== r2 && r2 > n2) try {
      return JSON.parse(e2.slice(n2, r2 + 1));
    } catch (e3) {
      return null;
    }
    const a2 = e2.indexOf("["), o2 = e2.lastIndexOf("]");
    if (-1 !== a2 && -1 !== o2 && o2 > a2) try {
      return JSON.parse(e2.slice(a2, o2 + 1));
    } catch (e3) {
      return null;
    }
  }
  return null;
}
function _(e2) {
  return String(e2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}
function J(e2) {
  return Array.isArray(e2) ? e2 : [];
}
function Z(e2, t2, n2) {
  e2 && (e2.className = "status", n2 && e2.classList.add(n2), e2.textContent = t2);
}
function X(e2, t2, n2) {
  if (e2) {
    if (t2) return e2.dataset.originalText = e2.innerHTML, e2.disabled = true, void (e2.innerHTML = `<span>${_(n2)}</span>`);
    e2.disabled = false, e2.dataset.originalText && (e2.innerHTML = e2.dataset.originalText);
  }
}
function Y(e2) {
  return String(e2 || "").replace(/\u0000/g, "").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function V(e2) {
  return Y(e2).slice(0, 12e3);
}
function ee() {
  return { hospitalName: R.hospitalName ? R.hospitalName.value.trim() : "", city: R.hospitalCity ? R.hospitalCity.value.trim() : "", department: R.hospitalDepartment ? R.hospitalDepartment.value.trim() : "" };
}
function te(e2) {
  const t2 = Number(e2 || 0);
  return !Number.isFinite(t2) || t2 <= 0 ? "0 بايت" : t2 < 1024 ? `${t2} بايت` : t2 < 1048576 ? `${(t2 / 1024).toFixed(1)} كيلوبايت` : t2 < 1073741824 ? `${(t2 / 1048576).toFixed(1)} ميجابايت` : `${(t2 / 1073741824).toFixed(1)} جيجابايت`;
}
function ne(e2) {
  const t2 = It(e2 && e2.name);
  return x.includes(t2) ? "text" : $.includes(t2) ? "image" : A.includes(t2) ? "audio" : k.includes(t2) ? "excel" : "pdf" === t2 ? "pdf" : "docx" === t2 || "doc" === t2 ? "document" : "dcm" === t2 || "dicom" === t2 ? "dicom" : "unknown";
}
function re(e2) {
  return { id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, file: e2, compressedFile: null, name: e2.name, size: e2.size || 0, type: e2.type || "", ext: It(e2.name), kind: ne(e2), status: "queued", progress: 0, message: "بانتظار المعالجة", extractedText: "", ocrUsed: false, transcriptionUsed: false, validation: { ok: true, issues: [] }, analyzed: false, savedRecordId: null, storageUrl: null, previewUrl: $.includes(It(e2.name)) || "audio" === ne(e2) ? URL.createObjectURL(e2) : "", aborted: false, controller: null, workerLocked: false };
}
function ae() {
  return { total: j.uploadQueue.length, done: j.uploadQueue.filter(function(e2) {
    return "done" === e2.status;
  }).length, errors: j.uploadQueue.filter(function(e2) {
    return "error" === e2.status;
  }).length, processing: j.uploadQueue.filter(function(e2) {
    return "processing" === e2.status;
  }).length, cancelled: j.uploadQueue.filter(function(e2) {
    return "cancelled" === e2.status;
  }).length, analyzed: j.uploadQueue.filter(function(e2) {
    return e2.analyzed;
  }).length, uploaded: j.uploadQueue.filter(function(e2) {
    return !!e2.storageUrl;
  }).length };
}
function oe() {
  const e2 = ae();
  Z(R.batchSummary, `إجمالي الملفات: ${e2.total} | مكتمل: ${e2.done} | قيد المعالجة: ${e2.processing} | أخطاء: ${e2.errors} | ملغى: ${e2.cancelled} | مُحلّل: ${e2.analyzed} | مرفوع للسحابة: ${e2.uploaded}`, e2.errors ? "error" : "success");
}
function ie() {
  if (!R.batchReport) return;
  const e2 = ae(), t2 = j.uploadQueue.filter(function(e3) {
    return e3.extractedText;
  }).length, n2 = j.uploadQueue.filter(function(e3) {
    return e3.ocrUsed;
  }).length, r2 = j.uploadQueue.filter(function(e3) {
    return e3.transcriptionUsed;
  }).length;
  R.batchReport.innerHTML = `
  <div class="result-item">
    <strong>ملخص الدفعة</strong>
    <div>إجمالي الملفات: ${_(String(e2.total))}</div>
    <div>تمت المعالجة: ${_(String(e2.done))}</div>
    <div>فشل/أخطاء: ${_(String(e2.errors))}</div>
    <div>نصوص مستخرجة: ${_(String(t2))}</div>
    <div>عمليات OCR: ${_(String(n2))}</div>
    <div>تحويل صوت إلى نص: ${_(String(r2))}</div>
  </div>
`;
}
function se() {
  if (R.fileQueue) {
    if (!j.uploadQueue.length) return R.fileQueue.innerHTML = '<p class="meta">لم تتم إضافة ملفات بعد.</p>', oe(), void ie();
    R.fileQueue.innerHTML = j.uploadQueue.map(function(e2) {
      const t2 = "done" === (n2 = e2.status) ? "success" : "error" === n2 || "cancelled" === n2 ? "error" : "processing" === n2 ? "processing" : "";
      var n2;
      const r2 = J(e2.validation && e2.validation.issues).length, a2 = "queued" === e2.status ? "بانتظار" : "processing" === e2.status ? "قيد المعالجة" : "done" === e2.status ? "مكتمل" : "cancelled" === e2.status ? "ملغي" : "خطأ", o2 = e2.previewUrl ? "audio" === e2.kind ? `<div class="queue-preview"><audio controls preload="none" src="${_(e2.previewUrl)}"></audio></div>` : `<div class="queue-preview"><img src="${_(e2.previewUrl)}" alt="معاينة ${_(e2.name)}" width="80" height="80" loading="lazy" decoding="async" /></div>` : "", i2 = ["processing" === e2.status ? `<button class="queue-action" data-action="cancel" data-id="${_(e2.id)}">إلغاء</button>` : "", "cancelled" === e2.status || "error" === e2.status ? `<button class="queue-action" data-action="resume" data-id="${_(e2.id)}">استئناف</button>` : "", e2.extractedText ? `<button class="queue-action" data-action="use" data-id="${_(e2.id)}">استخدام النص</button>` : "", `<button class="queue-action" data-action="remove" data-id="${_(e2.id)}">إزالة</button>`].filter(Boolean).join("");
      return `
      <article class="queue-item">
        <div class="queue-head">
          <div class="queue-name">${_(e2.name)}</div>
          <div class="queue-badges">
            <span class="q-badge ${_(t2)}">${_(a2)}</span>
            <span class="q-badge">${_(e2.kind)}</span>
            <span class="q-badge">${_(te(e2.size))}</span>
            ${r2 ? `<span class="q-badge error">ملاحظات: ${_(String(r2))}</span>` : ""}
          </div>
        </div>
        <div class="queue-meta">${_(e2.type || e2.ext || "غير معروف")}</div>
        <div class="progress-track"><div class="progress-bar" style="width:${_(String(e2.progress))}%"></div></div>
        <div class="queue-message">${_(e2.message || "")}</div>
        ${o2}
        <div class="queue-actions">${i2}</div>
      </article>
    `;
    }).join(""), oe(), ie();
  }
}

function buildGeminiDemoResponse(payload, cause) {
  const action = payload && payload.action ? payload.action : "extract";
  if (action === "search") {
    return { result: { matchedRecordIds: [], whyMatched: [], topDiagnoses: [], topMedications: [] }, model: E + " demo", demo: true, error: cause && cause.message ? cause.message : "demo fallback" };
  }
  if (action === "insights") {
    const records = J(payload && payload.records);
    return { result: buildGeminiDemoInsights(records), model: E + " demo", demo: true, error: cause && cause.message ? cause.message : "demo fallback" };
  }
  return { result: buildGeminiDemoExtract(payload && payload.reportText), model: E + " demo", demo: true, error: cause && cause.message ? cause.message : "demo fallback" };
}
function buildGeminiDemoExtract(reportText) {
  const text = String(reportText || "");
  const pick = (pattern, fallback) => {
    const match = text.match(pattern);
    return match && match[1] ? match[1].trim() : fallback;
  };
  const diagnoses = [];
  if (/سكري|Diabetes/i.test(text)) diagnoses.push("داء سكري نوع ثاني");
  if (/ضغط|Hypertension/i.test(text)) diagnoses.push("ارتفاع ضغط الدم");
  if (/قلب|صدري|Troponin|Cardiac/i.test(text)) diagnoses.push("اشتباه حالة قلبية تحتاج متابعة");
  if (/سرطان|ورم|oncology|breast/i.test(text)) diagnoses.push("متابعة أورام");
  const meds = ["Metformin", "Insulin", "Atorvastatin", "Tamoxifen", "Ondansetron", "Furosemide"].filter((name) => text.toLowerCase().includes(name.toLowerCase())).map((name) => ({ name, dose: null, frequency: null }));
  return {
    patient: {
      name: pick(/(?:المريض|المريضة)[:：]\s*([^\n]+)/, "مريض تجريبي"),
      age: pick(/العمر[:：]\s*([^\n]+)/, "غير محدد"),
      gender: /المريضة/.test(text) ? "أنثى" : /المريض/.test(text) ? "ذكر" : "غير محدد",
      city: pick(/المدينة[:：]\s*([^\n]+)/, "الرياض")
    },
    diagnoses: diagnoses.length ? diagnoses : ["حالة مستخرجة تجريبياً من التقرير"],
    symptoms: /ضيق نفس|ألم|خفقان|إجهاد/.test(text) ? ["أعراض مذكورة في التقرير تحتاج مراجعة سريرية"] : [],
    medications: meds.length ? meds : [{ name: "لا توجد أدوية واضحة", dose: null, frequency: null }],
    labs: /HbA1c|Troponin|LDL|كرياتينين/.test(text) ? [{ test: "مؤشرات مختبرية مذكورة", result: "مستخرجة من النص", unit: null, status: "تحتاج مراجعة" }] : [],
    recommendations: "هذه نتيجة demo fallback بعد فشل API. راجع البيانات سريرياً قبل أي استخدام تشغيلي.",
    severity: /حرج|Troponin|89%|عناية مركزة|حاد/.test(text) ? "مرتفع" : "متوسط",
    alerts: [{ type: "demo", message: "تم استخدام fallback demo لأن Gemini API أو الخادم الموحد لم يستجب." }],
    hospital_department: pick(/قسم[:：]\s*([^\n]+)/, "غير محدد")
  };
}
function buildGeminiDemoInsights(records) {
  const highRiskCases = records.filter((record) => ge(record.alerts).some((alert) => /خطر|critical|high/i.test(alert))).length;
  const diagnosisCounts = {};
  const medicationCounts = {};
  records.forEach((record) => {
    ge(record.diagnoses).forEach((item) => { diagnosisCounts[item] = (diagnosisCounts[item] || 0) + 1; });
    me(record.medications).forEach((item) => { medicationCounts[item.name] = (medicationCounts[item.name] || 0) + 1; });
  });
  const top = (map) => Object.keys(map).map((name) => ({ name, count: map[name] })).sort((a, b) => b.count - a.count).slice(0, 5);
  return {
    kpis: { recordsAnalyzed: records.length, highRiskCases },
    alerts: highRiskCases ? [{ level: "مرتفع", message: "توجد سجلات تحمل تنبيهات خطورة وتحتاج فرزاً أسرع." }] : [],
    recommendations: [{ priority: "قريبة", action: "فعّل مراجعة عينة البيانات واضبط تكامل Gemini قبل التشغيل الإنتاجي." }],
    topDiagnoses: top(diagnosisCounts),
    topMedications: top(medicationCounts)
  };
}
function buildGeminiDemoAgentResponse(payload, cause) {
  const records = J(payload && payload.records);
  return {
    result: {
      summary: "تم تشغيل وضع demo fallback لأن خدمة Gemini أو الخادم الموحد لم يستجب.",
      actions: ["راجع السجلات عالية الخطورة أولاً", "ثبّت مفتاح Gemini أو endpoint موحد قبل العرض الإنتاجي", "اختبر مسار رفع تقرير ثم استخراج ثم حفظ ثم بحث"],
      risks: records.length ? ["النتائج التجريبية لا تغني عن مراجعة سريرية"] : ["لا توجد سجلات كافية لبناء توصيات دقيقة"],
      kpis: [{ name: "السجلات المتاحة", value: records.length }]
    },
    model: E + " demo",
    demo: true,
    error: cause && cause.message ? cause.message : "demo fallback"
  };
}
async function ce(e2) {
  U();
  const t2 = (j.apiBase ? [j.apiBase] : []).concat(q().filter(function(e3) {
    return e3 !== j.apiBase;
  }));
  let r2 = null;
  for (const a2 of t2) try {
    const t3 = await D(`${a2}/api/ai/medical-archive`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e2) }, n);
    if (404 === t3.status || 405 === t3.status) continue;
    const r3 = await t3.json().catch(function() {
      return {};
    });
    if (!t3.ok) {
      const e3 = r3 && r3.error ? r3.error : "";
      if (t3.status >= 500 || 503 === t3.status || 429 === t3.status) throw new Error(e3 || "الخدمة مشغولة أو غير متاحة حالياً.");
      throw new Error(e3 || "تعذر تنفيذ الطلب حالياً.");
    }
    return j.apiBase = a2, r3;
  } catch (e3) {
    r2 = e3;
    continue;
  }
  try {
    const t3 = await async function(e3) {
      var t4 = K();
      if (!t4.key) throw new Error("مفتاح Gemini API غير متوفر. أدخل المفتاح في إعدادات الاتصال.");
      var n2 = e3 && e3.action ? e3.action : "extract", r3 = e3 && e3.reportText ? e3.reportText : "", a2 = e3 && e3.hospitalProfile ? e3.hospitalProfile : {}, o2 = "", i2 = "";
      if ("extract" === n2) o2 = 'أنت طبيب استشاري سعودي وخبير في تحليل البيانات الطبية (Clinical Data Extractor).\nمهمتك: قراءة التقرير الطبي المرفق واستخراج البيانات منه بدقة مطلقة لدمجها في نظام EHR.\nيجب أن يكون المخرج حصراً بصيغة JSON (Structured Data)، دون أي مقدمات أو نصوص إضافية.\nالهيكل المطلوب:\n{"patient":{"name":"...","age":"...","gender":"ذكر/أنثى/غير محدد","city":"..."},"diagnoses":["تشخيص 1","تشخيص 2"],"symptoms":["عرض 1","عرض 2"],"medications":[{"name":"الدواء","dose":"الجرعة","frequency":"التكرار"}],"labs":[{"test":"الفحص","result":"النتيجة","unit":"الوحدة","status":"طبيعي/مرتفع/منخفض"}],"recommendations":"التوصيات الطبية","severity":"منخفض/متوسط/مرتفع/حرج","alerts":[{"type":"risk/interaction/critical","message":"الرسالة"}],"hospital_department":"القسم الطبي المناسب"}', i2 = "التقرير الطبي المطلوب تحليله:\n\n" + r3, a2.hospitalName && (i2 += "\n\nالمنشأة: " + a2.hospitalName + " - " + (a2.city || "") + " - قسم: " + (a2.department || ""));
      else if ("search" === n2) {
        var s2 = e3 && e3.query ? e3.query : "", c2 = e3 && e3.records ? e3.records : [];
        o2 = 'أنت مساعد بحث طبي ذكي. حلل سؤال الطبيب وأرجع نتائج البحث على شكل JSON.\nالمخرج JSON فقط بالهيكل:\n{"matchedRecordIds":["id1","id2"],"whyMatched":[{"recordId":"id1","reasons":["السبب"]}],"topDiagnoses":[{"name":"تشخيص","count":1}],"topMedications":[{"name":"دواء","count":1}]}', i2 = "السجلات المتاحة:\n" + JSON.stringify(c2.map(function(e4) {
          return { recordId: e4.recordId, patient: e4.patient, diagnoses: e4.diagnoses, medications: e4.medications, severity: e4.severity };
        })) + "\n\nسؤال البحث: " + s2;
      } else o2 = "أنت مستشار طبي ذكي. أجب بالعربية بناءً على البيانات المقدمة فقط.", i2 = r3 || JSON.stringify(e3);
      var u2, l2, d2 = { model: t4.model, messages: [{ role: "system", content: o2 }, { role: "user", content: i2 }], temperature: "extract" === n2 ? 0.1 : 0.3, max_tokens: 4096 };
      "extract" !== n2 && "search" !== n2 || (d2.response_format = { type: "json_object" });
      try {
        u2 = await D(S, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + t4.key }, body: JSON.stringify(d2) }, w);
      } catch (e4) {
        if (e4 && "AbortError" === e4.name) throw new Error("انتهت مهلة الاتصال بـ Gemini. تحقق من اتصال الإنترنت وحاول مرة أخرى.");
        throw new Error("تعذر الاتصال بـ Gemini API: " + (e4.message || "خطأ شبكة"));
      }
      if (!u2.ok) {
        var g2 = {};
        try {
          g2 = await u2.json();
        } catch (e4) {
        }
        var m2 = g2 && g2.error && g2.error.message || "";
        if (401 === u2.status) throw new Error("مفتاح Gemini API غير صالح. تحقق من المفتاح في إعدادات الاتصال.");
        if (429 === u2.status) throw new Error("تم تجاوز حد الطلبات المسموح من Gemini. انتظر قليلاً ثم حاول مرة أخرى.");
        if (413 === u2.status) throw new Error("النص طويل جداً لمعالجة Gemini. قلّل حجم التقرير وحاول مجدداً.");
        if (u2.status >= 500) throw new Error("خلل مؤقت في خوادم Gemini (" + u2.status + "). حاول بعد قليل.");
        throw new Error(m2 || "خطأ من Gemini API (حالة: " + u2.status + ")");
      }
      try {
        l2 = await u2.json();
      } catch (e4) {
        throw new Error("تعذر قراءة استجابة Gemini. حاول مرة أخرى.");
      }
      if (!(l2 && l2.choices && l2.choices.length && l2.choices[0].message)) throw new Error("استجابة Gemini فارغة أو غير صالحة.");
      var p2 = l2.choices[0].message.content || "", h2 = l2.model || t4.model;
      if ("extract" === n2) {
        var f2 = z(p2);
        if (!f2) throw new Error("فشل في تحليل JSON المُرجع من Gemini. حاول بنص أوضح.");
        return { result: f2, model: h2, usage: l2.usage || null };
      }
      return "search" === n2 ? { result: z(p2) || { matchedRecordIds: [], whyMatched: [], topDiagnoses: [], topMedications: [] }, model: h2, usage: l2.usage || null } : { result: p2, model: h2, usage: l2.usage || null };
    }(e2);
    return R.connectionStatus && Z(R.connectionStatus, "تم التحويل إلى وضع Gemini المباشر بنجاح (بدون خادم محلي).", "success"), t3;
  } catch (e3) {
    return buildGeminiDemoResponse(e2, e3 || r2);
  }
}
async function ue(e2, t2, r2) {
  U();
  const a2 = (j.apiBase ? [j.apiBase] : []).concat(q().filter(function(e3) {
    return e3 !== j.apiBase;
  }));
  let o2 = null;
  for (const i2 of a2) try {
    const a3 = await D(`${i2}${e2}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t2 || {}) }, r2 || n);
    if (404 === a3.status || 405 === a3.status) continue;
    const o3 = await a3.json().catch(function() {
      return {};
    });
    if (!a3.ok) throw new Error(o3 && o3.error || "تعذر تنفيذ الطلب.");
    return j.apiBase = i2, o3;
  } catch (e3) {
    o2 = e3;
  }
  if (e2 === "/api/ai/medical-agent") return buildGeminiDemoAgentResponse(t2, o2);
  throw new Error(N(o2, "تعذر الوصول إلى الخدمة المطلوبة."));
}
async function le() {
  const e2 = q();
  for (const t2 of e2) try {
    if ((await D(`${t2}/api/health`, { method: "GET" }, 6e3)).ok) return j.apiBase = t2, { mode: "backend", base: t2 };
  } catch (e3) {
    continue;
  }
  return Q() ? { mode: "direct", base: "/api/ai" } : { mode: "none", base: "" };
}
