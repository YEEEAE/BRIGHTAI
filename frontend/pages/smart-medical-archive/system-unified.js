(function () {
  "use strict";

  const API_PATH = "/api/groq/medical-archive";
  const API_OCR_TEXT_PATH = "/api/groq/extract-text";
  const API_TRANSCRIBE_PATH = "/api/groq/transcribe";
  const API_AGENT_PATH = "/api/groq/medical-agent";
  const WHATSAPP_NUMBER = "966538229013";
  const MAX_REPORT_CHARS = 12000;
  const API_TIMEOUT_MS = 30000;
  const STORAGE_API_BASE_KEY = "brightai.medicalArchive.apiBase";
  const STORAGE_GROQ_KEY = "brightai.medicalArchive.groqApiKey";
  const STORAGE_GROQ_MODEL_KEY = "brightai.medicalArchive.groqModel";
  const STORAGE_PROVIDER_KEY = "brightai.medicalArchive.storageProvider";
  const STORAGE_ENDPOINT_KEY = "brightai.medicalArchive.storageEndpoint";
  const STORAGE_TOKEN_KEY = "brightai.medicalArchive.storageToken";
  const STORAGE_SAVED_SEARCHES_KEY = "brightai.medicalArchive.savedSearches";
  const STORAGE_SEARCH_PROVIDER_KEY = "brightai.medicalArchive.searchProvider";
  const STORAGE_SEARCH_ENDPOINT_KEY = "brightai.medicalArchive.searchEndpoint";
  const STORAGE_SEARCH_INDEX_KEY = "brightai.medicalArchive.searchIndex";
  const STORAGE_SEARCH_API_KEY = "brightai.medicalArchive.searchApiKey";
  const STORAGE_SEARCH_APP_ID_KEY = "brightai.medicalArchive.searchAppId";
  const STORAGE_DASHBOARD_LAYOUT_KEY = "brightai.medicalArchive.dashboardLayout";
  const STORAGE_DASHBOARD_ROLE_KEY = "brightai.medicalArchive.dashboardRole";
  const STORAGE_DASHBOARD_HISTORY_KEY = "brightai.medicalArchive.dashboardHistory";
  const STORAGE_DASHBOARD_EVENTS_KEY = "brightai.medicalArchive.dashboardEvents";

  const MAX_SINGLE_FILE_BYTES = 25 * 1024 * 1024;
  const MAX_BATCH_FILES = 300;
  const BATCH_CONCURRENCY = 3;
  const BATCH_ANALYZE_CONCURRENCY = 2;
  const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
  const SEARCH_PAGE_SIZE = 8;
  const QUICK_SEARCH_DEBOUNCE_MS = 170;
  const DASHBOARD_DEFAULT_WIDGET_ORDER = [
    "timelineWidget",
    "demographicWidget",
    "diagnosisWidget",
    "medicationWidget",
    "activityWidget",
    "alertsWidget",
    "liveWidget",
  ];

  const SUPPORTED_EXTENSIONS = [
    "pdf",
    "docx",
    "doc",
    "dcm",
    "dicom",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "mp3",
    "wav",
    "m4a",
    "xls",
    "xlsx",
    "txt",
    "md",
    "json",
    "csv",
    "xml",
    "html",
    "htm",
  ];

  const TEXT_EXTENSIONS = ["txt", "md", "csv", "json", "xml", "html", "htm"];
  const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
  const AUDIO_EXTENSIONS = ["mp3", "wav", "m4a"];
  const EXCEL_EXTENSIONS = ["xls", "xlsx"];

  const SEMANTIC_SYNONYMS = {
    "السكري": ["مرض السكري", "سكر", "Diabetes", "DM", "Hyperglycemia"],
    "ارتفاع الضغط": ["ضغط", "ضغط الدم", "Hypertension", "HTN"],
    "أمراض القلب": ["قلب", "ذبحة", "فشل قلبي", "Cardiac", "Heart disease"],
    "سرطان الثدي": ["ورم الثدي", "Breast cancer", "oncology breast"],
    "قصور الكلى": ["فشل كلوي", "Kidney failure", "Renal"],
    "التهاب رئوي": ["ذات الرئة", "Pneumonia", "عدوى رئوية"],
  };

  const SAUDI_CITY_COORDINATES = {
    "الرياض": { lat: 24.7136, lng: 46.6753 },
    "جدة": { lat: 21.5433, lng: 39.1728 },
    "مكة": { lat: 21.3891, lng: 39.8579 },
    "المدينة": { lat: 24.5247, lng: 39.5692 },
    "الدمام": { lat: 26.4207, lng: 50.0888 },
    "الخبر": { lat: 26.2172, lng: 50.1971 },
    "الطائف": { lat: 21.4373, lng: 40.5127 },
    "أبها": { lat: 18.2465, lng: 42.5117 },
    "تبوك": { lat: 28.3838, lng: 36.5550 },
    "جازان": { lat: 16.8892, lng: 42.5511 },
    "حائل": { lat: 27.5114, lng: 41.7208 },
    "بريدة": { lat: 26.3592, lng: 43.9818 },
  };

  const DASHBOARD_ROLE_TEMPLATES = {
    doctor: ["timelineWidget", "diagnosisWidget", "medicationWidget", "alertsWidget", "liveWidget"],
    admin: ["timelineWidget", "demographicWidget", "activityWidget", "alertsWidget", "liveWidget"],
    director: ["timelineWidget", "demographicWidget", "diagnosisWidget", "activityWidget", "alertsWidget", "liveWidget"],
  };

  const SAMPLE_REPORTS = {
    diabetes:
      "تقرير عيادة السكري - مستشفى الملك فهد\nالمريض: أحمد محمد سالم\nالعمر: 58 سنة\nالمدينة: جدة\nرقم الملف: MRN-22918\nالتاريخ: 2026-02-11\nالتشخيص: داء سكري نوع ثاني غير منضبط مع اعتلال أعصاب طرفية مبكر.\nالعلامات الحيوية: ضغط 150/92، نبض 87، وزن 92 كجم.\nنتائج المختبر: HbA1c = 9.1% (مرتفع)، كرياتينين 1.1 mg/dL، كوليسترول LDL = 142 mg/dL.\nالأدوية الحالية: Metformin 1000mg مرتين يومياً، Insulin glargine 18 وحدة مساءً، Atorvastatin 20mg ليلاً.\nالخطة العلاجية: تعديل جرعة الإنسولين إلى 22 وحدة مساءً، تثقيف غذائي، متابعة العيون خلال شهر، إعادة HbA1c بعد 12 أسبوع.",
    oncology:
      "تقرير متابعة أورام - مركز الأورام\nالمريضة: فاطمة سعد القحطاني\nالعمر: 42 سنة\nالمدينة: الرياض\nالتاريخ: 2026-01-28\nالتشخيص: سرطان الثدي الأيسر مرحلة ثانية بعد الاستئصال الجزئي.\nالعلاج: 4 دورات علاج كيميائي مكتملة، حالياً علاج هرموني.\nالآثار الجانبية: إجهاد متوسط، خفقان متكرر بعد الجرعة الثالثة.\nنتيجة الإيكو القلبي: EF 53% مع توصية متابعة قلبية.\nالأدوية: Tamoxifen 20mg يومياً، Ondansetron عند الحاجة.\nالتوصيات: متابعة عيادة القلب خلال أسبوعين، استمرار العلاج الهرموني، إعادة تصوير بعد 3 أشهر.",
    emergency:
      "تقرير طوارئ - موسم العمرة\nالمريض: عبدالعزيز حسن علي\nالعمر: 67 سنة\nالمدينة: مكة\nالتاريخ: 2026-02-02\nالشكوى الرئيسية: ضيق نفس حاد وألم صدري ضاغط منذ ساعتين.\nالتاريخ المرضي: ارتفاع ضغط الدم، فشل قلبي مزمن، سكري نوع ثاني.\nالفحوصات: Troponin إيجابي، أشعة صدر أظهرت احتقان رئوي، تشبع الأكسجين 89%.\nالتدخل: إعطاء أوكسجين، Furosemide وريدي، بدء بروتوكول متلازمة الشريان التاجي الحادة.\nالنتيجة: تحويل للعناية المركزة القلبية مع تنبيه خطورة مرتفعة ومتابعة فورية لقسم القلب.",
  };

  const state = {
    records: [],
    lastExtract: null,
    lastFileMeta: null,
    apiBase: null,
    directGroqApiKey: "",
    directGroqModel: "llama-3.1-8b-instant",
    uploadQueue: [],
    queueProcessing: false,
    stopQueueRequested: false,
    storageProvider: "none",
    storageEndpoint: "",
    storageToken: "",
    searchCache: new Map(),
    searchLastKey: "",
    searchCurrentPage: 1,
    searchLastAllResults: [],
    searchLastPagedResults: [],
    searchSaved: [],
    searchProvider: "local",
    searchEndpoint: "",
    searchIndex: "",
    searchApiKey: "",
    searchAppId: "",
    searchTypingTimer: null,
    voiceRecognition: null,
    voiceRecognitionActive: false,
    dashboardCharts: {},
    dashboardWidgetOrder: DASHBOARD_DEFAULT_WIDGET_ORDER.slice(),
    dashboardHiddenWidgets: new Set(),
    dashboardRole: "director",
    dashboardHistory: [],
    dashboardEvents: [],
    dashboardNotifications: [],
    dashboardRefreshTimer: null,
    liveSocket: null,
    liveSocketRetryTimer: null,
    liveSocketConnected: false,
    widgetDragSourceId: "",
  };

  const refs = {
    hospitalName: document.getElementById("hospitalName"),
    hospitalCity: document.getElementById("hospitalCity"),
    hospitalDepartment: document.getElementById("hospitalDepartment"),
    reportInput: document.getElementById("reportInput"),
    reportFile: document.getElementById("reportFile"),
    reportFolder: document.getElementById("reportFolder"),
    dropZone: document.getElementById("dropZone"),
    pickFilesBtn: document.getElementById("pickFilesBtn"),
    pickFolderBtn: document.getElementById("pickFolderBtn"),
    extractFileBtn: document.getElementById("extractFileBtn"),
    processBatchBtn: document.getElementById("processBatchBtn"),
    cancelBatchBtn: document.getElementById("cancelBatchBtn"),
    resumeBatchBtn: document.getElementById("resumeBatchBtn"),
    analyzeBatchBtn: document.getElementById("analyzeBatchBtn"),
    fileStatus: document.getElementById("fileStatus"),
    batchStatus: document.getElementById("batchStatus"),
    batchSummary: document.getElementById("batchSummary"),
    fileQueue: document.getElementById("fileQueue"),
    batchReport: document.getElementById("batchReport"),
    storageProvider: document.getElementById("storageProvider"),
    storageEndpoint: document.getElementById("storageEndpoint"),
    storageToken: document.getElementById("storageToken"),
    saveStorageBtn: document.getElementById("saveStorageBtn"),
    uploadStorageBtn: document.getElementById("uploadStorageBtn"),
    storageStatus: document.getElementById("storageStatus"),
    analyzeBtn: document.getElementById("analyzeBtn"),
    saveRecordBtn: document.getElementById("saveRecordBtn"),
    extractStatus: document.getElementById("extractStatus"),
    extractResult: document.getElementById("extractResult"),
    recordsList: document.getElementById("recordsList"),
    recordsCount: document.getElementById("recordsCount"),
    extractedCount: document.getElementById("extractedCount"),
    riskCount: document.getElementById("riskCount"),
    searchQuery: document.getElementById("searchQuery"),
    searchBtn: document.getElementById("searchBtn"),
    searchStatus: document.getElementById("searchStatus"),
    searchResult: document.getElementById("searchResult"),
    searchSuggestions: document.getElementById("searchSuggestions"),
    searchQuickStatus: document.getElementById("searchQuickStatus"),
    searchStats: document.getElementById("searchStats"),
    searchClusters: document.getElementById("searchClusters"),
    voiceSearchBtn: document.getElementById("voiceSearchBtn"),
    voiceFileBtn: document.getElementById("voiceFileBtn"),
    voiceFileInput: document.getElementById("voiceFileInput"),
    imageSearchBtn: document.getElementById("imageSearchBtn"),
    imageSearchInput: document.getElementById("imageSearchInput"),
    filterAgeMin: document.getElementById("filterAgeMin"),
    filterAgeMax: document.getElementById("filterAgeMax"),
    filterGender: document.getElementById("filterGender"),
    filterDateFrom: document.getElementById("filterDateFrom"),
    filterDateTo: document.getElementById("filterDateTo"),
    filterDepartment: document.getElementById("filterDepartment"),
    filterExclude: document.getElementById("filterExclude"),
    filterNearCity: document.getElementById("filterNearCity"),
    filterRadiusKm: document.getElementById("filterRadiusKm"),
    semanticMode: document.getElementById("semanticMode"),
    searchEngineProvider: document.getElementById("searchEngineProvider"),
    searchEngineEndpoint: document.getElementById("searchEngineEndpoint"),
    searchEngineIndex: document.getElementById("searchEngineIndex"),
    searchEngineApiKey: document.getElementById("searchEngineApiKey"),
    searchEngineAppId: document.getElementById("searchEngineAppId"),
    applyFiltersBtn: document.getElementById("applyFiltersBtn"),
    saveSearchBtn: document.getElementById("saveSearchBtn"),
    savedSearchesSelect: document.getElementById("savedSearchesSelect"),
    loadSavedSearchBtn: document.getElementById("loadSavedSearchBtn"),
    searchPrevPageBtn: document.getElementById("searchPrevPageBtn"),
    searchNextPageBtn: document.getElementById("searchNextPageBtn"),
    exportSearchCsvBtn: document.getElementById("exportSearchCsvBtn"),
    exportSearchExcelBtn: document.getElementById("exportSearchExcelBtn"),
    exportSearchPdfBtn: document.getElementById("exportSearchPdfBtn"),
    timelineGranularitySelect: document.getElementById("timelineGranularitySelect"),
    dashboardRoleSelect: document.getElementById("dashboardRoleSelect"),
    applyRoleTemplateBtn: document.getElementById("applyRoleTemplateBtn"),
    saveDashboardLayoutBtn: document.getElementById("saveDashboardLayoutBtn"),
    resetDashboardLayoutBtn: document.getElementById("resetDashboardLayoutBtn"),
    refreshDashboardBtn: document.getElementById("refreshDashboardBtn"),
    dashboardStatus: document.getElementById("dashboardStatus"),
    dashboardWidgets: document.getElementById("dashboardWidgets"),
    widgetToggles: Array.from(document.querySelectorAll("[data-widget-toggle]")),
    overviewTotalRecords: document.getElementById("overviewTotalRecords"),
    overviewTotalGrowth: document.getElementById("overviewTotalGrowth"),
    overviewNewRecords: document.getElementById("overviewNewRecords"),
    overviewCriticalCases: document.getElementById("overviewCriticalCases"),
    overviewDailyUsage: document.getElementById("overviewDailyUsage"),
    overviewAvgProcessing: document.getElementById("overviewAvgProcessing"),
    kpiResponseTime: document.getElementById("kpiResponseTime"),
    kpiExtractionAccuracy: document.getElementById("kpiExtractionAccuracy"),
    kpiAnalysisSuccess: document.getElementById("kpiAnalysisSuccess"),
    kpiUserSatisfaction: document.getElementById("kpiUserSatisfaction"),
    timelineChart: document.getElementById("timelineChart"),
    ageDistributionChart: document.getElementById("ageDistributionChart"),
    genderDistributionChart: document.getElementById("genderDistributionChart"),
    geoHeatmapChart: document.getElementById("geoHeatmapChart"),
    topDiagnosesChart: document.getElementById("topDiagnosesChart"),
    topMedicationsChart: document.getElementById("topMedicationsChart"),
    userActivityChart: document.getElementById("userActivityChart"),
    peakHoursChart: document.getElementById("peakHoursChart"),
    productivityChart: document.getElementById("productivityChart"),
    medicationListInteractive: document.getElementById("medicationListInteractive"),
    drugInteractionList: document.getElementById("drugInteractionList"),
    urgentAlertsList: document.getElementById("urgentAlertsList"),
    medExpiryAlertsList: document.getElementById("medExpiryAlertsList"),
    followupAlertsList: document.getElementById("followupAlertsList"),
    anomalyAlertsList: document.getElementById("anomalyAlertsList"),
    liveSocketStatus: document.getElementById("liveSocketStatus"),
    liveReconnectBtn: document.getElementById("liveReconnectBtn"),
    liveNotificationsList: document.getElementById("liveNotificationsList"),
    insightsBtn: document.getElementById("insightsBtn"),
    insightsStatus: document.getElementById("insightsStatus"),
    insightsResult: document.getElementById("insightsResult"),
    exportFhirBtn: document.getElementById("exportFhirBtn"),
    exportCsvBtn: document.getElementById("exportCsvBtn"),
    exportHl7Btn: document.getElementById("exportHl7Btn"),
    exportArchiveFhirBtn: document.getElementById("exportArchiveFhirBtn"),
    exportStatus: document.getElementById("exportStatus"),
    apiBaseInput: document.getElementById("apiBaseInput"),
    groqApiKeyInput: document.getElementById("groqApiKeyInput"),
    groqModelInput: document.getElementById("groqModelInput"),
    saveConnectionBtn: document.getElementById("saveConnectionBtn"),
    testConnectionBtn: document.getElementById("testConnectionBtn"),
    connectionStatus: document.getElementById("connectionStatus"),
    leadHospital: document.getElementById("leadHospital"),
    leadName: document.getElementById("leadName"),
    leadPhone: document.getElementById("leadPhone"),
    leadBtn: document.getElementById("leadBtn"),
    leadStatus: document.getElementById("leadStatus"),
    agentQuestion: document.getElementById("agentQuestion"),
    agentBtn: document.getElementById("agentBtn"),
    agentStatus: document.getElementById("agentStatus"),
    agentResult: document.getElementById("agentResult"),
    sampleButtons: Array.from(document.querySelectorAll("[data-sample]")),
  };

  function normalizeBaseUrl(base) {
    return String(base || "").trim().replace(/\/+$/, "");
  }

  function buildApiBaseCandidates() {
    const candidates = [];

    if (state.apiBase) {
      candidates.push(normalizeBaseUrl(state.apiBase));
    }

    if (refs.apiBaseInput && refs.apiBaseInput.value) {
      candidates.push(normalizeBaseUrl(refs.apiBaseInput.value));
    }

    const storedApiBase = normalizeBaseUrl(safeStorageGet(STORAGE_API_BASE_KEY));
    if (storedApiBase) {
      candidates.push(storedApiBase);
    }

    if (window.BRIGHTAI_API_BASE && typeof window.BRIGHTAI_API_BASE === "string") {
      candidates.push(normalizeBaseUrl(window.BRIGHTAI_API_BASE));
    }

    if (window.location && window.location.origin && window.location.origin !== "null") {
      candidates.push(normalizeBaseUrl(window.location.origin));
    }

    candidates.push("http://127.0.0.1:3000");
    candidates.push("http://localhost:3000");
    candidates.push("https://api.brightai.sa");

    return candidates.filter(function (item, index, arr) {
      return item && arr.indexOf(item) === index;
    });
  }

  async function fetchWithTimeout(url, options, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(function () {
      controller.abort();
    }, timeoutMs || API_TIMEOUT_MS);

    const reqOptions = Object.assign({}, options || {}, { signal: controller.signal });

    try {
      return await fetch(url, reqOptions);
    } finally {
      clearTimeout(timer);
    }
  }

  function toFriendlyError(error, fallbackMessage) {
    const message = String((error && error.message) || "").trim();
    const networkLike =
      /load failed|failed to fetch|network|fetch|timeout|aborted|cors|connection|internet/i.test(message);

    if (networkLike) {
      return "تعذر الاتصال بالخادم. شغّل خادم BrightAI على المنفذ 3000 أو حدّث API Base من إعداد الاتصال، ويمكنك تفعيل المفتاح المباشر لـ Groq كحل احتياطي.";
    }

    return message || fallbackMessage || "حدث خطأ غير متوقع.";
  }

  function safeStorageGet(key) {
    try {
      return window.localStorage.getItem(key) || "";
    } catch (error) {
      return "";
    }
  }

  function safeStorageSet(key, value) {
    try {
      if (!value) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  }

  function applySavedConnectionConfig() {
    const savedApiBase = normalizeBaseUrl(safeStorageGet(STORAGE_API_BASE_KEY));
    const savedGroqKey = safeStorageGet(STORAGE_GROQ_KEY).trim();
    const savedGroqModel = safeStorageGet(STORAGE_GROQ_MODEL_KEY).trim();

    if (savedApiBase) {
      state.apiBase = savedApiBase;
      if (refs.apiBaseInput) refs.apiBaseInput.value = savedApiBase;
    }

    if (savedGroqKey) {
      state.directGroqApiKey = savedGroqKey;
      if (refs.groqApiKeyInput) refs.groqApiKeyInput.value = savedGroqKey;
    }

    if (savedGroqModel) {
      state.directGroqModel = savedGroqModel;
      if (refs.groqModelInput) refs.groqModelInput.value = savedGroqModel;
    }

    const savedStorageProvider = safeStorageGet(STORAGE_PROVIDER_KEY).trim();
    const savedStorageEndpoint = safeStorageGet(STORAGE_ENDPOINT_KEY).trim();
    const savedStorageToken = safeStorageGet(STORAGE_TOKEN_KEY).trim();

    if (savedStorageProvider) {
      state.storageProvider = savedStorageProvider;
      if (refs.storageProvider) refs.storageProvider.value = savedStorageProvider;
    }
    if (savedStorageEndpoint) {
      state.storageEndpoint = savedStorageEndpoint;
      if (refs.storageEndpoint) refs.storageEndpoint.value = savedStorageEndpoint;
    }
    if (savedStorageToken) {
      state.storageToken = savedStorageToken;
      if (refs.storageToken) refs.storageToken.value = savedStorageToken;
    }

    const savedSearchProvider = safeStorageGet(STORAGE_SEARCH_PROVIDER_KEY).trim();
    const savedSearchEndpoint = safeStorageGet(STORAGE_SEARCH_ENDPOINT_KEY).trim();
    const savedSearchIndex = safeStorageGet(STORAGE_SEARCH_INDEX_KEY).trim();
    const savedSearchApiKey = safeStorageGet(STORAGE_SEARCH_API_KEY).trim();
    const savedSearchAppId = safeStorageGet(STORAGE_SEARCH_APP_ID_KEY).trim();
    const savedSearchesRaw = safeStorageGet(STORAGE_SAVED_SEARCHES_KEY).trim();

    if (savedSearchProvider) {
      state.searchProvider = savedSearchProvider;
      if (refs.searchEngineProvider) refs.searchEngineProvider.value = savedSearchProvider;
    }
    if (savedSearchEndpoint) {
      state.searchEndpoint = savedSearchEndpoint;
      if (refs.searchEngineEndpoint) refs.searchEngineEndpoint.value = savedSearchEndpoint;
    }
    if (savedSearchIndex) {
      state.searchIndex = savedSearchIndex;
      if (refs.searchEngineIndex) refs.searchEngineIndex.value = savedSearchIndex;
    }
    if (savedSearchApiKey) {
      state.searchApiKey = savedSearchApiKey;
      if (refs.searchEngineApiKey) refs.searchEngineApiKey.value = savedSearchApiKey;
    }
    if (savedSearchAppId) {
      state.searchAppId = savedSearchAppId;
      if (refs.searchEngineAppId) refs.searchEngineAppId.value = savedSearchAppId;
    }
    if (savedSearchesRaw) {
      try {
        const parsed = JSON.parse(savedSearchesRaw);
        if (Array.isArray(parsed)) {
          state.searchSaved = parsed.filter(function (entry) {
            return entry && typeof entry === "object" && typeof entry.query === "string";
          }).slice(0, 50);
        }
      } catch (error) {
        state.searchSaved = [];
      }
    }

    const savedDashboardRole = safeStorageGet(STORAGE_DASHBOARD_ROLE_KEY).trim();
    const savedDashboardLayoutRaw = safeStorageGet(STORAGE_DASHBOARD_LAYOUT_KEY).trim();
    const savedDashboardHistoryRaw = safeStorageGet(STORAGE_DASHBOARD_HISTORY_KEY).trim();
    const savedDashboardEventsRaw = safeStorageGet(STORAGE_DASHBOARD_EVENTS_KEY).trim();

    if (savedDashboardRole && DASHBOARD_ROLE_TEMPLATES[savedDashboardRole]) {
      state.dashboardRole = savedDashboardRole;
      if (refs.dashboardRoleSelect) refs.dashboardRoleSelect.value = savedDashboardRole;
    }

    if (savedDashboardLayoutRaw) {
      try {
        const parsed = JSON.parse(savedDashboardLayoutRaw);
        if (parsed && Array.isArray(parsed.order) && Array.isArray(parsed.hidden)) {
          const safeOrder = parsed.order.filter(function (id) {
            return DASHBOARD_DEFAULT_WIDGET_ORDER.includes(id);
          });
          state.dashboardWidgetOrder = safeOrder.length ? safeOrder : DASHBOARD_DEFAULT_WIDGET_ORDER.slice();
          state.dashboardHiddenWidgets = new Set(
            parsed.hidden.filter(function (id) {
              return DASHBOARD_DEFAULT_WIDGET_ORDER.includes(id);
            })
          );
        }
      } catch (error) {
        state.dashboardWidgetOrder = DASHBOARD_DEFAULT_WIDGET_ORDER.slice();
      }
    }

    if (savedDashboardHistoryRaw) {
      try {
        const parsed = JSON.parse(savedDashboardHistoryRaw);
        if (Array.isArray(parsed)) {
          state.dashboardHistory = parsed.slice(-180);
        }
      } catch (error) {
        state.dashboardHistory = [];
      }
    }

    if (savedDashboardEventsRaw) {
      try {
        const parsed = JSON.parse(savedDashboardEventsRaw);
        if (Array.isArray(parsed)) {
          state.dashboardEvents = parsed.slice(-1000);
        }
      } catch (error) {
        state.dashboardEvents = [];
      }
    }
  }

  function saveConnectionConfig() {
    const apiBase = normalizeBaseUrl(refs.apiBaseInput ? refs.apiBaseInput.value : "");
    const groqKey = refs.groqApiKeyInput ? refs.groqApiKeyInput.value.trim() : "";
    const groqModel = refs.groqModelInput ? refs.groqModelInput.value.trim() : "";

    state.apiBase = apiBase || null;
    state.directGroqApiKey = groqKey || "";
    state.directGroqModel = groqModel || "llama-3.1-8b-instant";

    safeStorageSet(STORAGE_API_BASE_KEY, state.apiBase || "");
    safeStorageSet(STORAGE_GROQ_KEY, state.directGroqApiKey || "");
    safeStorageSet(STORAGE_GROQ_MODEL_KEY, state.directGroqModel || "");
  }

  function saveStorageConfig() {
    const provider = refs.storageProvider ? refs.storageProvider.value.trim() : "none";
    const endpoint = refs.storageEndpoint ? refs.storageEndpoint.value.trim() : "";
    const token = refs.storageToken ? refs.storageToken.value.trim() : "";

    state.storageProvider = provider || "none";
    state.storageEndpoint = endpoint;
    state.storageToken = token;

    safeStorageSet(STORAGE_PROVIDER_KEY, state.storageProvider);
    safeStorageSet(STORAGE_ENDPOINT_KEY, state.storageEndpoint);
    safeStorageSet(STORAGE_TOKEN_KEY, state.storageToken);
  }

  function saveSearchEngineConfig() {
    const provider = refs.searchEngineProvider ? refs.searchEngineProvider.value.trim() : "local";
    const endpoint = refs.searchEngineEndpoint ? refs.searchEngineEndpoint.value.trim() : "";
    const indexName = refs.searchEngineIndex ? refs.searchEngineIndex.value.trim() : "";
    const apiKey = refs.searchEngineApiKey ? refs.searchEngineApiKey.value.trim() : "";
    const appId = refs.searchEngineAppId ? refs.searchEngineAppId.value.trim() : "";

    state.searchProvider = provider || "local";
    state.searchEndpoint = endpoint;
    state.searchIndex = indexName;
    state.searchApiKey = apiKey;
    state.searchAppId = appId;

    safeStorageSet(STORAGE_SEARCH_PROVIDER_KEY, state.searchProvider);
    safeStorageSet(STORAGE_SEARCH_ENDPOINT_KEY, state.searchEndpoint);
    safeStorageSet(STORAGE_SEARCH_INDEX_KEY, state.searchIndex);
    safeStorageSet(STORAGE_SEARCH_API_KEY, state.searchApiKey);
    safeStorageSet(STORAGE_SEARCH_APP_ID_KEY, state.searchAppId);
  }

  function saveSavedSearches() {
    safeStorageSet(STORAGE_SAVED_SEARCHES_KEY, JSON.stringify(state.searchSaved || []));
  }

  function syncConnectionFromInputs() {
    const typedApiBase = normalizeBaseUrl(refs.apiBaseInput ? refs.apiBaseInput.value : "");
    const typedGroqKey = refs.groqApiKeyInput ? refs.groqApiKeyInput.value.trim() : "";
    const typedGroqModel = refs.groqModelInput ? refs.groqModelInput.value.trim() : "";

    if (typedApiBase) state.apiBase = typedApiBase;
    if (typedGroqKey) state.directGroqApiKey = typedGroqKey;
    if (typedGroqModel) state.directGroqModel = typedGroqModel;

    if (refs.storageProvider && refs.storageProvider.value) {
      state.storageProvider = refs.storageProvider.value.trim();
    }
    if (refs.storageEndpoint && refs.storageEndpoint.value) {
      state.storageEndpoint = refs.storageEndpoint.value.trim();
    }
    if (refs.storageToken && refs.storageToken.value) {
      state.storageToken = refs.storageToken.value.trim();
    }

    if (refs.searchEngineProvider && refs.searchEngineProvider.value) {
      state.searchProvider = refs.searchEngineProvider.value.trim();
    }
    if (refs.searchEngineEndpoint && refs.searchEngineEndpoint.value) {
      state.searchEndpoint = refs.searchEngineEndpoint.value.trim();
    }
    if (refs.searchEngineIndex && refs.searchEngineIndex.value) {
      state.searchIndex = refs.searchEngineIndex.value.trim();
    }
    if (refs.searchEngineApiKey && refs.searchEngineApiKey.value) {
      state.searchApiKey = refs.searchEngineApiKey.value.trim();
    }
    if (refs.searchEngineAppId && refs.searchEngineAppId.value) {
      state.searchAppId = refs.searchEngineAppId.value.trim();
    }
  }

  function hasDirectGroqConfig() {
    return !!(state.directGroqApiKey && state.directGroqApiKey.startsWith("gsk_"));
  }

  function parseJsonFromText(text) {
    if (!text || typeof text !== "string") return null;
    try {
      return JSON.parse(text);
    } catch (error) {
      const startObj = text.indexOf("{");
      const endObj = text.lastIndexOf("}");
      if (startObj !== -1 && endObj !== -1 && endObj > startObj) {
        try {
          return JSON.parse(text.slice(startObj, endObj + 1));
        } catch (innerError) {
          return null;
        }
      }

      const startArr = text.indexOf("[");
      const endArr = text.lastIndexOf("]");
      if (startArr !== -1 && endArr !== -1 && endArr > startArr) {
        try {
          return JSON.parse(text.slice(startArr, endArr + 1));
        } catch (innerError) {
          return null;
        }
      }
    }
    return null;
  }

  function buildDirectSystemPrompt() {
    return [
      "أنت محرك أرشيف طبي ذكي تجريبي للمستشفيات السعودية.",
      "أعد JSON فقط بدون أي شرح أو Markdown.",
      "عند نقص البيانات استخدم null أو مصفوفة فارغة.",
      "لا تكتب أي نص خارج JSON.",
    ].join("\n");
  }

  function buildDirectUserPrompt(payload) {
    const action = String(payload && payload.action ? payload.action : "extract").toLowerCase();
    if (action === "extract") {
      return [
        "المهمة: استخراج بيانات صحية منظمة من تقرير طبي.",
        `المنشأة: ${JSON.stringify(payload.hospitalProfile || {})}`,
        "أعد JSON بهذا الشكل:",
        "{\"recordId\":\"...\",\"patient\":{\"name\":null,\"age\":null,\"gender\":null,\"city\":null,\"hospital\":null,\"medicalRecordNumber\":null},\"encounter\":{\"date\":null,\"department\":null,\"physician\":null},\"diagnoses\":[{\"name\":\"...\",\"status\":\"active|history|suspected\",\"certainty\":\"confirmed|suspected|unknown\"}],\"medications\":[{\"name\":\"...\",\"dose\":null,\"frequency\":null,\"route\":null,\"duration\":null}],\"labs\":[{\"name\":\"...\",\"value\":null,\"unit\":null,\"status\":\"high|low|normal|unknown\"}],\"procedures\":[{\"name\":\"...\",\"date\":null}],\"alerts\":[{\"type\":\"risk|allergy|drug_interaction|followup\",\"message\":\"...\"}],\"summary\":{\"problem\":\"...\",\"plan\":\"...\",\"nextStep\":\"...\"},\"confidence\":0.0}",
        "النص الطبي:",
        String(payload.reportText || ""),
      ].join("\n");
    }

    if (action === "search") {
      return [
        "المهمة: تنفيذ بحث لغة طبيعية داخل السجلات الطبية.",
        `الاستعلام: ${String(payload.query || "")}`,
        `السجلات: ${JSON.stringify(payload.records || [])}`,
        "أعد JSON بهذا الشكل:",
        "{\"matchedRecordIds\":[],\"totalMatches\":0,\"whyMatched\":[{\"recordId\":\"...\",\"reasons\":[\"...\"]}],\"aggregates\":{\"topDiagnoses\":[{\"name\":\"...\",\"count\":0}],\"topMedications\":[{\"name\":\"...\",\"count\":0}]},\"answer\":\"...\"}",
      ].join("\n");
    }

    return [
      "المهمة: توليد تحليلات تشغيلية من السجلات الطبية.",
      `السجلات: ${JSON.stringify(payload.records || [])}`,
      `المنشأة: ${JSON.stringify(payload.hospitalProfile || {})}`,
      "أعد JSON بهذا الشكل:",
      "{\"kpis\":{\"recordsAnalyzed\":0,\"highRiskCases\":0,\"activeDiagnosisCount\":0},\"topDiagnoses\":[{\"name\":\"...\",\"count\":0}],\"topMedications\":[{\"name\":\"...\",\"count\":0}],\"alerts\":[{\"level\":\"critical|high|medium|low\",\"message\":\"...\"}],\"recommendations\":[{\"priority\":\"critical|high|medium|low\",\"action\":\"...\"}]}",
    ].join("\n");
  }

  async function callDirectGroqMedicalArchive(payload) {
    if (!hasDirectGroqConfig()) {
      throw new Error(
        "تعذر الوصول لخادم BrightAI ولا يوجد مفتاح Groq مباشر. أضف مفتاح Groq في إعداد الاتصال أو شغل الخادم المحلي."
      );
    }

    const response = await fetchWithTimeout(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.directGroqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: state.directGroqModel || "llama-3.1-8b-instant",
          temperature: 0.2,
          max_tokens: 1800,
          messages: [
            { role: "system", content: buildDirectSystemPrompt() },
            { role: "user", content: buildDirectUserPrompt(payload) },
          ],
        }),
      },
      API_TIMEOUT_MS
    );

    const data = await response.json().catch(function () {
      return {};
    });

    if (!response.ok) {
      const rawMessage = String(
        (data && data.error && data.error.message) || (data && data.error) || ""
      ).toLowerCase();

      if (rawMessage.includes("api key") || rawMessage.includes("authentication")) {
        throw new Error("مفتاح Groq غير صحيح أو منتهي. حدّث المفتاح من إعداد الاتصال.");
      }
      if (rawMessage.includes("rate") || rawMessage.includes("quota") || rawMessage.includes("limit")) {
        throw new Error("تم تجاوز حد الطلبات على Groq حالياً. انتظر قليلاً ثم أعد المحاولة.");
      }
      if (rawMessage.includes("model")) {
        throw new Error("اسم نموذج Groq غير صحيح. حدّث اسم النموذج من إعداد الاتصال.");
      }

      throw new Error("تعذر الاتصال المباشر مع Groq حالياً.");
    }

    const text = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    const parsed = parseJsonFromText(String(text || ""));
    if (!parsed || typeof parsed !== "object") {
      throw new Error("تعذر تفسير استجابة Groq المباشرة كـ JSON.");
    }

    return {
      mode: String(payload.action || "extract"),
      result: parsed,
      model: state.directGroqModel || "llama-3.1-8b-instant",
      generatedAt: new Date().toISOString(),
      source: "direct-groq",
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function asArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function setStatus(element, message, type) {
    if (!element) return;
    element.className = "status";
    if (type) {
      element.classList.add(type);
    }
    element.textContent = message;
  }

  function setButtonLoading(button, loading, textWhenLoading) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span>${escapeHtml(textWhenLoading)}</span>`;
      return;
    }
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }

  function cleanTextInput(value) {
    return String(value || "")
      .replace(/\u0000/g, "")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function limitReportText(text) {
    return cleanTextInput(text).slice(0, MAX_REPORT_CHARS);
  }

  function getHospitalProfile() {
    return {
      hospitalName: refs.hospitalName ? refs.hospitalName.value.trim() : "",
      city: refs.hospitalCity ? refs.hospitalCity.value.trim() : "",
      department: refs.hospitalDepartment ? refs.hospitalDepartment.value.trim() : "",
    };
  }

  function formatBytes(bytes) {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return "0 بايت";
    if (value < 1024) return `${value} بايت`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} كيلوبايت`;
    if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} ميجابايت`;
    return `${(value / (1024 * 1024 * 1024)).toFixed(1)} جيجابايت`;
  }

  function generateQueueId() {
    return `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  function inferFileKind(file) {
    const ext = getFileExtension(file && file.name);
    if (TEXT_EXTENSIONS.includes(ext)) return "text";
    if (IMAGE_EXTENSIONS.includes(ext)) return "image";
    if (AUDIO_EXTENSIONS.includes(ext)) return "audio";
    if (EXCEL_EXTENSIONS.includes(ext)) return "excel";
    if (ext === "pdf") return "pdf";
    if (ext === "docx" || ext === "doc") return "document";
    if (ext === "dcm" || ext === "dicom") return "dicom";
    return "unknown";
  }

  function createQueueItem(file) {
    return {
      id: generateQueueId(),
      file,
      compressedFile: null,
      name: file.name,
      size: file.size || 0,
      type: file.type || "",
      ext: getFileExtension(file.name),
      kind: inferFileKind(file),
      status: "queued",
      progress: 0,
      message: "بانتظار المعالجة",
      extractedText: "",
      ocrUsed: false,
      transcriptionUsed: false,
      validation: { ok: true, issues: [] },
      analyzed: false,
      savedRecordId: null,
      storageUrl: null,
      previewUrl: IMAGE_EXTENSIONS.includes(getFileExtension(file.name)) || inferFileKind(file) === "audio"
        ? URL.createObjectURL(file)
        : "",
      aborted: false,
      controller: null,
      workerLocked: false,
    };
  }

  function summarizeQueue() {
    const total = state.uploadQueue.length;
    const done = state.uploadQueue.filter(function (item) { return item.status === "done"; }).length;
    const errors = state.uploadQueue.filter(function (item) { return item.status === "error"; }).length;
    const processing = state.uploadQueue.filter(function (item) { return item.status === "processing"; }).length;
    const cancelled = state.uploadQueue.filter(function (item) { return item.status === "cancelled"; }).length;
    const analyzed = state.uploadQueue.filter(function (item) { return item.analyzed; }).length;
    const uploaded = state.uploadQueue.filter(function (item) { return !!item.storageUrl; }).length;

    return { total, done, errors, processing, cancelled, analyzed, uploaded };
  }

  function renderBatchSummary() {
    const summary = summarizeQueue();
    setStatus(
      refs.batchSummary,
      `إجمالي الملفات: ${summary.total} | مكتمل: ${summary.done} | قيد المعالجة: ${summary.processing} | أخطاء: ${summary.errors} | ملغى: ${summary.cancelled} | مُحلّل: ${summary.analyzed} | مرفوع للسحابة: ${summary.uploaded}`,
      summary.errors ? "error" : "success"
    );
  }

  function getQueueStatusBadgeClass(status) {
    if (status === "done") return "success";
    if (status === "error" || status === "cancelled") return "error";
    if (status === "processing") return "processing";
    return "";
  }

  function renderQueueReport() {
    if (!refs.batchReport) return;

    const summary = summarizeQueue();
    const doneWithText = state.uploadQueue.filter(function (item) { return item.extractedText; }).length;
    const ocrCount = state.uploadQueue.filter(function (item) { return item.ocrUsed; }).length;
    const sttCount = state.uploadQueue.filter(function (item) { return item.transcriptionUsed; }).length;

    refs.batchReport.innerHTML = `
      <div class="result-item">
        <strong>ملخص الدفعة</strong>
        <div>إجمالي الملفات: ${escapeHtml(String(summary.total))}</div>
        <div>تمت المعالجة: ${escapeHtml(String(summary.done))}</div>
        <div>فشل/أخطاء: ${escapeHtml(String(summary.errors))}</div>
        <div>نصوص مستخرجة: ${escapeHtml(String(doneWithText))}</div>
        <div>عمليات OCR: ${escapeHtml(String(ocrCount))}</div>
        <div>تحويل صوت إلى نص: ${escapeHtml(String(sttCount))}</div>
      </div>
    `;
  }

  function renderFileQueue() {
    if (!refs.fileQueue) return;
    if (!state.uploadQueue.length) {
      refs.fileQueue.innerHTML = "<p class=\"meta\">لم تتم إضافة ملفات بعد.</p>";
      renderBatchSummary();
      renderQueueReport();
      return;
    }

    refs.fileQueue.innerHTML = state.uploadQueue
      .map(function (item) {
        const badgeClass = getQueueStatusBadgeClass(item.status);
        const issueCount = asArray(item.validation && item.validation.issues).length;
        const statusLabel = item.status === "queued"
          ? "بانتظار"
          : item.status === "processing"
          ? "قيد المعالجة"
          : item.status === "done"
          ? "مكتمل"
          : item.status === "cancelled"
          ? "ملغي"
          : "خطأ";

        const preview = item.previewUrl
          ? item.kind === "audio"
            ? `<div class="queue-preview"><audio controls preload="none" src="${escapeHtml(item.previewUrl)}"></audio></div>`
            : `<div class="queue-preview"><img src="${escapeHtml(item.previewUrl)}" alt="معاينة ${escapeHtml(item.name)}" /></div>`
          : "";

        const actions = [
          item.status === "processing"
            ? `<button class="queue-action" data-action="cancel" data-id="${escapeHtml(item.id)}">إلغاء</button>`
            : "",
          item.status === "cancelled" || item.status === "error"
            ? `<button class="queue-action" data-action="resume" data-id="${escapeHtml(item.id)}">استئناف</button>`
            : "",
          item.extractedText
            ? `<button class="queue-action" data-action="use" data-id="${escapeHtml(item.id)}">استخدام النص</button>`
            : "",
          `<button class="queue-action" data-action="remove" data-id="${escapeHtml(item.id)}">إزالة</button>`,
        ].filter(Boolean).join("");

        return `
          <article class="queue-item">
            <div class="queue-head">
              <div class="queue-name">${escapeHtml(item.name)}</div>
              <div class="queue-badges">
                <span class="q-badge ${escapeHtml(badgeClass)}">${escapeHtml(statusLabel)}</span>
                <span class="q-badge">${escapeHtml(item.kind)}</span>
                <span class="q-badge">${escapeHtml(formatBytes(item.size))}</span>
                ${issueCount ? `<span class="q-badge error">ملاحظات: ${escapeHtml(String(issueCount))}</span>` : ""}
              </div>
            </div>
            <div class="queue-meta">${escapeHtml(item.type || item.ext || "غير معروف")}</div>
            <div class="progress-track"><div class="progress-bar" style="width:${escapeHtml(String(item.progress))}%"></div></div>
            <div class="queue-message">${escapeHtml(item.message || "")}</div>
            ${preview}
            <div class="queue-actions">${actions}</div>
          </article>
        `;
      })
      .join("");

    renderBatchSummary();
    renderQueueReport();
  }

  async function postMedicalArchive(payload) {
    syncConnectionFromInputs();

    const preferred = state.apiBase ? [state.apiBase] : [];
    const candidates = preferred.concat(
      buildApiBaseCandidates().filter(function (base) {
        return base !== state.apiBase;
      })
    );

    let lastError = null;

    for (const base of candidates) {
      try {
        const response = await fetchWithTimeout(
          `${base}${API_PATH}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
          API_TIMEOUT_MS
        );

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          const serverMessage = data && data.error ? data.error : "";
          if (response.status >= 500 || response.status === 503 || response.status === 429) {
            throw new Error(serverMessage || "الخدمة مشغولة أو غير متاحة حالياً.");
          }
          throw new Error(serverMessage || "تعذر تنفيذ الطلب حالياً.");
        }

        state.apiBase = base;
        return data;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    try {
      const directResult = await callDirectGroqMedicalArchive(payload);
      if (refs.connectionStatus) {
        setStatus(refs.connectionStatus, "تم التحويل إلى وضع Groq المباشر بنجاح (بدون خادم محلي).", "success");
      }
      return directResult;
    } catch (directError) {
      const combinedError = directError || lastError;
      throw new Error(toFriendlyError(combinedError, "تعذر الوصول إلى خدمة التحليل."));
    }
  }

  async function postBackendJson(path, payload, timeoutMs) {
    syncConnectionFromInputs();
    const preferred = state.apiBase ? [state.apiBase] : [];
    const candidates = preferred.concat(
      buildApiBaseCandidates().filter(function (base) {
        return base !== state.apiBase;
      })
    );

    let lastError = null;

    for (const base of candidates) {
      try {
        const response = await fetchWithTimeout(
          `${base}${path}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload || {}),
          },
          timeoutMs || API_TIMEOUT_MS
        );

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        const data = await response.json().catch(function () {
          return {};
        });

        if (!response.ok) {
          throw new Error((data && data.error) || "تعذر تنفيذ الطلب.");
        }

        state.apiBase = base;
        return data;
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(toFriendlyError(lastError, "تعذر الوصول إلى الخدمة المطلوبة."));
  }

  async function preflightApiConnection() {
    const candidates = buildApiBaseCandidates();

    for (const base of candidates) {
      try {
        const response = await fetchWithTimeout(`${base}/api/health`, { method: "GET" }, 6000);
        if (response.ok) {
          state.apiBase = base;
          return { mode: "backend", base };
        }
      } catch (error) {
        continue;
      }
    }

    if (hasDirectGroqConfig()) {
      return { mode: "direct", base: "https://api.groq.com" };
    }

    return { mode: "none", base: "" };
  }

  function createRecordId() {
    return `rec-${Date.now()}-${state.records.length + 1}`;
  }

  function countHighRisk(records) {
    let count = 0;
    records.forEach(function (record) {
      const alerts = asArray(record && record.alerts);
      const hasRisk = alerts.some(function (item) {
        if (!item || typeof item !== "object") return false;
        const type = (item.type || item.level || "").toString().toLowerCase();
        return type.includes("risk") || type.includes("critical") || type.includes("high");
      });
      if (hasRisk) count += 1;
    });
    return count;
  }

  function updateCounters() {
    if (refs.recordsCount) {
      refs.recordsCount.textContent = String(state.records.length);
    }
    if (refs.extractedCount) {
      refs.extractedCount.textContent = state.lastExtract ? "1" : "0";
    }
    if (refs.riskCount) {
      refs.riskCount.textContent = String(countHighRisk(state.records));
    }
  }

  function normalizeTextList(list) {
    return asArray(list)
      .map(function (item) {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        if (typeof item.name === "string" && item.name.trim()) return item.name;
        if (typeof item.message === "string" && item.message.trim()) return item.message;
        return "";
      })
      .filter(Boolean);
  }

  function normalizeMedicationList(list) {
    return asArray(list)
      .map(function (item) {
        if (typeof item === "string") {
          return { name: item, dose: null, frequency: null };
        }
        if (!item || typeof item !== "object") return null;
        const name = item.name || item.medication || item.drug;
        if (!name) return null;
        return {
          name,
          dose: item.dose || item.dosage || null,
          frequency: item.frequency || item.freq || null,
        };
      })
      .filter(Boolean);
  }

  function normalizeDiagnoses(list) {
    return asArray(list)
      .map(function (item) {
        if (typeof item === "string") {
          return { name: item, status: null, certainty: null };
        }
        if (!item || typeof item !== "object") return null;
        const name = item.name || item.diagnosis || item.value;
        if (!name) return null;
        return {
          name,
          status: item.status || null,
          certainty: item.certainty || null,
        };
      })
      .filter(Boolean);
  }

  function normalizeLabs(list) {
    return asArray(list)
      .map(function (item) {
        if (!item || typeof item !== "object") return null;
        const name = item.name || item.test || item.lab;
        if (!name) return null;
        return {
          name,
          value: item.value || null,
          unit: item.unit || null,
          status: item.status || null,
        };
      })
      .filter(Boolean);
  }

  function renderExtractResult(result) {
    if (!refs.extractResult) return;
    if (!result || typeof result !== "object") {
      refs.extractResult.innerHTML = "<p>لا توجد نتيجة حتى الآن.</p>";
      return;
    }

    const patient = result.patient && typeof result.patient === "object" ? result.patient : {};
    const summary = result.summary && typeof result.summary === "object" ? result.summary : {};
    const diagnoses = normalizeTextList(result.diagnoses);
    const alerts = normalizeTextList(result.alerts);
    const medications = normalizeMedicationList(result.medications);
    const labs = normalizeLabs(result.labs);

    const diagnosesHtml = diagnoses.length
      ? diagnoses.map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("")
      : "<li>لا يوجد تشخيص واضح في النص</li>";

    const alertsHtml = alerts.length
      ? alerts.map(function (item) { return `<li>${escapeHtml(item)}</li>`; }).join("")
      : "<li>لا توجد تنبيهات خطورة مباشرة</li>";

    const medsHtml = medications.length
      ? medications
          .map(function (med) {
            const dose = med.dose ? ` - الجرعة: ${escapeHtml(med.dose)}` : "";
            const freq = med.frequency ? ` - التكرار: ${escapeHtml(med.frequency)}` : "";
            return `<li>${escapeHtml(med.name)}${dose}${freq}</li>`;
          })
          .join("")
      : "<li>لا توجد أدوية مستخرجة</li>";

    const labsHtml = labs.length
      ? labs
          .map(function (lab) {
            const value = lab.value ? ` ${escapeHtml(String(lab.value))}` : "";
            const unit = lab.unit ? ` ${escapeHtml(String(lab.unit))}` : "";
            const status = lab.status ? ` (${escapeHtml(String(lab.status))})` : "";
            return `<li>${escapeHtml(lab.name)}:${value}${unit} ${status}</li>`;
          })
          .join("")
      : "<li>لا توجد نتائج مختبر مستخرجة</li>";

    refs.extractResult.innerHTML = `
      <div class="result-grid">
        <div class="result-item">
          <strong>بيانات المريض</strong>
          <div>${escapeHtml(patient.name || "غير محدد")}</div>
          <div>العمر: ${escapeHtml(patient.age != null ? String(patient.age) : "غير محدد")}</div>
          <div>الجنس: ${escapeHtml(patient.gender || "غير محدد")}</div>
          <div>المدينة: ${escapeHtml(patient.city || "غير محدد")}</div>
        </div>
        <div class="result-item">
          <strong>ملخص الحالة</strong>
          <div>${escapeHtml(summary.problem || "لا يوجد ملخص")}</div>
          <div>${escapeHtml(summary.plan || "")}</div>
          <div>${escapeHtml(summary.nextStep || "")}</div>
        </div>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>التشخيصات المستخرجة</strong>
        <ul class="mini-list">${diagnosesHtml}</ul>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>الأدوية المستخرجة</strong>
        <ul class="mini-list">${medsHtml}</ul>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>نتائج المختبر</strong>
        <ul class="mini-list">${labsHtml}</ul>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>تنبيهات سريرية</strong>
        <ul class="mini-list">${alertsHtml}</ul>
      </div>
    `;
  }

  function renderSavedRecords() {
    if (!refs.recordsList) return;
    if (!state.records.length) {
      refs.recordsList.innerHTML = "<p class=\"meta\">لم يتم حفظ أي سجل بعد.</p>";
      return;
    }

    const items = state.records
      .slice()
      .reverse()
      .slice(0, 8)
      .map(function (record) {
        const patient = record.patient && typeof record.patient === "object" ? record.patient : {};
        const diagnoses = normalizeTextList(record.diagnoses);
        const fileInfo = record.sourceFile ? ` - الملف: ${record.sourceFile}` : "";
        return `
          <div class="record-item">
            <div class="top">
              <span class="id">${escapeHtml(record.recordId || "rec")}</span>
              <span class="meta">${escapeHtml(record.savedAt || "")}</span>
            </div>
            <div class="meta">${escapeHtml(patient.name || "مريض غير معرف")} - ${escapeHtml(
          patient.age != null ? `${patient.age} سنة` : "العمر غير متوفر"
        )}</div>
            <div class="meta">${escapeHtml((diagnoses[0] || "بدون تشخيص واضح").toString())}</div>
            <div class="meta">${escapeHtml(fileInfo)}</div>
          </div>
        `;
      })
      .join("");

    refs.recordsList.innerHTML = items;
  }

  async function handleAnalyze() {
    const reportText = refs.reportInput ? limitReportText(refs.reportInput.value) : "";
    if (!reportText || reportText.length < 30) {
      setStatus(refs.extractStatus, "أدخل تقريراً طبياً كاملاً (30 حرفاً على الأقل).", "error");
      return;
    }

    setButtonLoading(refs.analyzeBtn, true, "جاري التحليل عبر Groq...");
    setStatus(refs.extractStatus, "جاري استخراج البيانات الصحية من التقرير...", "");

    try {
      const data = await postMedicalArchive({
        action: "extract",
        reportText,
        hospitalProfile: getHospitalProfile(),
      });

      if (!data || !data.result) {
        throw new Error("لم تصل نتيجة صالحة من الخدمة");
      }

      state.lastExtract = data.result;
      if (refs.saveRecordBtn) {
        refs.saveRecordBtn.disabled = false;
      }
      renderExtractResult(data.result);
      updateCounters();
      setStatus(
        refs.extractStatus,
        `تم التحليل بنجاح عبر نموذج ${data.model || "Groq"}. احفظ السجل لإتاحته في البحث والتحليلات.`,
        "success"
      );
    } catch (error) {
      setStatus(refs.extractStatus, toFriendlyError(error, "تعذر تحليل التقرير حالياً"), "error");
    } finally {
      setButtonLoading(refs.analyzeBtn, false);
    }
  }

  function handleSaveRecord() {
    if (!state.lastExtract) {
      setStatus(refs.extractStatus, "نفّذ التحليل أولاً قبل حفظ السجل.", "error");
      return;
    }

    saveRecordFromExtract(state.lastExtract, state.lastFileMeta ? state.lastFileMeta.name : null);
    state.lastExtract = null;
    if (refs.saveRecordBtn) {
      refs.saveRecordBtn.disabled = true;
    }

    setStatus(refs.extractStatus, "تم حفظ السجل داخل الأرشيف التجريبي ويمكن البحث فيه الآن.", "success");
  }

  function buildWhyMatched(result) {
    const why = asArray(result && result.whyMatched);
    if (!why.length) {
      return "<li>لا توجد أسباب مطابقة مفصلة من النموذج.</li>";
    }

    return why
      .map(function (row) {
        const reasons = asArray(row.reasons)
          .map(function (reason) {
            return `<span>${escapeHtml(reason)}</span>`;
          })
          .join("<br>");
        return `<li><strong>${escapeHtml(row.recordId || "سجل")}</strong><br>${reasons || "-"}</li>`;
      })
      .join("");
  }

  function buildTopList(rows) {
    const list = asArray(rows);
    if (!list.length) return "<li>لا توجد بيانات كافية</li>";
    return list
      .slice(0, 5)
      .map(function (item) {
        const name = item && typeof item === "object" ? item.name : item;
        const count = item && typeof item === "object" ? item.count : null;
        const suffix = count != null ? ` (${count})` : "";
        return `<li>${escapeHtml(String(name || "غير محدد"))}${escapeHtml(String(suffix))}</li>`;
      })
      .join("");
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/ى/g, "ي")
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function tokenizeSearchText(value) {
    return normalizeSearchText(value)
      .split(" ")
      .map(function (token) { return token.trim(); })
      .filter(function (token) { return token.length >= 2; });
  }

  function levenshteinDistance(a, b) {
    const s = String(a || "");
    const t = String(b || "");
    const rows = s.length + 1;
    const cols = t.length + 1;
    const table = Array.from({ length: rows }, function () {
      return new Array(cols).fill(0);
    });

    for (let i = 0; i < rows; i += 1) table[i][0] = i;
    for (let j = 0; j < cols; j += 1) table[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = s[i - 1] === t[j - 1] ? 0 : 1;
        table[i][j] = Math.min(
          table[i - 1][j] + 1,
          table[i][j - 1] + 1,
          table[i - 1][j - 1] + cost
        );
      }
    }
    return table[rows - 1][cols - 1];
  }

  function parseAge(value) {
    const age = Number(value);
    if (!Number.isFinite(age) || age < 0 || age > 130) return null;
    return age;
  }

  function parseTime(value) {
    if (!value) return null;
    const date = new Date(value);
    const ts = date.getTime();
    return Number.isFinite(ts) ? ts : null;
  }

  function parseFilters() {
    const ageMin = parseAge(refs.filterAgeMin ? refs.filterAgeMin.value : "");
    const ageMax = parseAge(refs.filterAgeMax ? refs.filterAgeMax.value : "");
    const gender = refs.filterGender ? refs.filterGender.value.trim() : "";
    const dateFrom = parseTime(refs.filterDateFrom ? refs.filterDateFrom.value : "");
    const dateTo = parseTime(refs.filterDateTo ? refs.filterDateTo.value : "");
    const department = refs.filterDepartment ? refs.filterDepartment.value.trim() : "";
    const excludeTerms = refs.filterExclude
      ? refs.filterExclude.value
          .split(/[،,]/)
          .map(function (token) { return normalizeSearchText(token); })
          .filter(Boolean)
      : [];
    const nearCity = refs.filterNearCity ? refs.filterNearCity.value.trim() : "";
    const radiusKm = Number(refs.filterRadiusKm ? refs.filterRadiusKm.value : 0) || 0;
    const semanticMode = refs.semanticMode ? refs.semanticMode.value : "on";
    return {
      ageMin,
      ageMax,
      gender,
      dateFrom,
      dateTo,
      department,
      excludeTerms,
      nearCity,
      radiusKm,
      semanticMode,
    };
  }

  function expandSemanticTerms(tokens) {
    const expanded = new Set(tokens);
    if (!tokens.length) return expanded;
    Object.keys(SEMANTIC_SYNONYMS).forEach(function (groupKey) {
      const group = [groupKey].concat(asArray(SEMANTIC_SYNONYMS[groupKey]));
      const normalizedGroup = group.map(normalizeSearchText);
      const matched = tokens.some(function (token) {
        return normalizedGroup.some(function (candidate) {
          return candidate.includes(token) || token.includes(candidate);
        });
      });
      if (matched) {
        normalizedGroup.forEach(function (term) {
          tokenizeSearchText(term).forEach(function (token) { expanded.add(token); });
        });
      }
    });
    return expanded;
  }

  function buildSearchVocabulary(records) {
    const bag = new Set();
    asArray(records).forEach(function (record) {
      tokenizeSearchText(extractRecordSearchText(record)).forEach(function (token) {
        bag.add(token);
      });
    });
    Object.keys(SEMANTIC_SYNONYMS).forEach(function (groupKey) {
      tokenizeSearchText(groupKey).forEach(function (token) { bag.add(token); });
      asArray(SEMANTIC_SYNONYMS[groupKey]).forEach(function (term) {
        tokenizeSearchText(term).forEach(function (token) { bag.add(token); });
      });
    });
    return Array.from(bag);
  }

  function correctQuerySpelling(query, records) {
    const tokens = tokenizeSearchText(query);
    if (!tokens.length) return { corrected: query, changed: false };
    const vocabulary = buildSearchVocabulary(records);
    const correctedTokens = tokens.map(function (token) {
      if (vocabulary.includes(token)) return token;
      let best = token;
      let bestDistance = 99;
      vocabulary.forEach(function (candidate) {
        if (Math.abs(candidate.length - token.length) > 2) return;
        const distance = levenshteinDistance(token, candidate);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = candidate;
        }
      });
      return bestDistance <= 2 ? best : token;
    });
    const corrected = correctedTokens.join(" ").trim();
    return { corrected, changed: normalizeSearchText(corrected) !== normalizeSearchText(query) };
  }

  function extractRecordSearchText(record) {
    const rec = record && typeof record === "object" ? record : {};
    const patient = rec.patient && typeof rec.patient === "object" ? rec.patient : {};
    const summary = rec.summary && typeof rec.summary === "object" ? rec.summary : {};
    const pieces = [
      rec.recordId || "",
      rec.sourceFile || "",
      rec.sourceHospital || "",
      patient.name || "",
      patient.gender || "",
      patient.city || "",
      patient.hospital || "",
      rec.encounter && rec.encounter.department ? rec.encounter.department : "",
      normalizeTextList(rec.diagnoses).join(" "),
      normalizeMedicationList(rec.medications).map(function (med) {
        return [med.name, med.dose, med.frequency].filter(Boolean).join(" ");
      }).join(" "),
      normalizeTextList(rec.alerts).join(" "),
      normalizeLabs(rec.labs).map(function (lab) {
        return [lab.name, lab.value, lab.unit, lab.status].filter(Boolean).join(" ");
      }).join(" "),
      summary.problem || "",
      summary.plan || "",
      summary.nextStep || "",
      rec.savedAt || "",
      rec.capturedAt || "",
    ];
    return pieces.join(" ").trim();
  }

  function haversineDistanceKm(lat1, lng1, lat2, lng2) {
    const toRad = function (deg) { return deg * (Math.PI / 180); };
    const earthKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthKm * c;
  }

  function getCityCoordinatesByName(cityName) {
    const norm = normalizeSearchText(cityName);
    if (!norm) return null;
    const aliases = {
      riyadh: "الرياض",
      jeddah: "جدة",
      mecca: "مكة",
      makkah: "مكة",
      madinah: "المدينة",
      medina: "المدينة",
      dammam: "الدمام",
      khobar: "الخبر",
      taif: "الطائف",
      abha: "أبها",
      tabuk: "تبوك",
      jazan: "جازان",
      hail: "حائل",
      buraydah: "بريدة",
      buraidah: "بريدة",
    };
    if (aliases[norm] && SAUDI_CITY_COORDINATES[aliases[norm]]) {
      return SAUDI_CITY_COORDINATES[aliases[norm]];
    }
    const foundKey = Object.keys(SAUDI_CITY_COORDINATES).find(function (key) {
      const keyNorm = normalizeSearchText(key);
      return keyNorm === norm || keyNorm.includes(norm) || norm.includes(keyNorm);
    });
    return foundKey ? SAUDI_CITY_COORDINATES[foundKey] : null;
  }

  function withinGeoRange(record, filters) {
    if (!filters.nearCity || !filters.radiusKm) return { ok: true, distanceKm: null };
    const target = getCityCoordinatesByName(filters.nearCity);
    if (!target) return { ok: true, distanceKm: null };
    const recCity = normalizeSearchText(
      (record && record.patient && record.patient.city) || record.sourceHospital || ""
    );
    let nearest = null;
    Object.keys(SAUDI_CITY_COORDINATES).forEach(function (cityName) {
      if (!recCity.includes(normalizeSearchText(cityName))) return;
      const point = SAUDI_CITY_COORDINATES[cityName];
      const distance = haversineDistanceKm(target.lat, target.lng, point.lat, point.lng);
      if (nearest == null || distance < nearest) {
        nearest = distance;
      }
    });
    if (nearest == null) return { ok: false, distanceKm: null };
    return { ok: nearest <= filters.radiusKm, distanceKm: nearest };
  }

  function buildSearchCacheKey(query, filters, page) {
    const snapshot = {
      query: normalizeSearchText(query),
      filters,
      page,
      recordsVersion: state.records.length ? state.records[state.records.length - 1].recordId : "0",
      provider: state.searchProvider || "local",
      endpoint: state.searchEndpoint || "",
      index: state.searchIndex || "",
    };
    return JSON.stringify(snapshot);
  }

  function getCachedSearch(key) {
    const cached = state.searchCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > SEARCH_CACHE_TTL_MS) {
      state.searchCache.delete(key);
      return null;
    }
    return cached.value;
  }

  function setCachedSearch(key, value) {
    state.searchCache.set(key, {
      timestamp: Date.now(),
      value,
    });
  }

  function getDepartmentFromRecord(record) {
    return String(
      (record && record.encounter && record.encounter.department) ||
      (record && record.sourceDepartment) ||
      ""
    ).trim();
  }

  function normalizeGenderInput(value) {
    const v = normalizeSearchText(value);
    if (!v) return "";
    if (v.includes("male") || v.includes("ذكر")) return "male";
    if (v.includes("female") || v.includes("انث") || v.includes("أنث")) return "female";
    return "unknown";
  }

  function evaluateRecordAgainstFilters(record, filters) {
    const patient = record && record.patient && typeof record.patient === "object" ? record.patient : {};
    const age = parseAge(patient.age);
    if (filters.ageMin != null && (age == null || age < filters.ageMin)) return false;
    if (filters.ageMax != null && (age == null || age > filters.ageMax)) return false;

    if (filters.gender) {
      const recordGender = normalizeGenderInput(patient.gender);
      if (recordGender !== normalizeGenderInput(filters.gender)) return false;
    }

    const candidateDate = parseTime(
      (record && record.encounter && record.encounter.date) ||
      record.capturedAt ||
      record.savedAt
    );
    if (filters.dateFrom != null && (candidateDate == null || candidateDate < filters.dateFrom)) return false;
    if (filters.dateTo != null && (candidateDate == null || candidateDate > filters.dateTo + 86400000)) return false;

    const dep = normalizeSearchText(getDepartmentFromRecord(record));
    if (filters.department) {
      const needed = normalizeSearchText(filters.department);
      if (!dep.includes(needed)) return false;
    }

    const fullText = normalizeSearchText(extractRecordSearchText(record));
    if (filters.excludeTerms.length) {
      const hasExcluded = filters.excludeTerms.some(function (term) {
        return term && fullText.includes(term);
      });
      if (hasExcluded) return false;
    }

    const geo = withinGeoRange(record, filters);
    if (!geo.ok) return false;

    return true;
  }

  function scoreRecordRelevance(record, query, tokens, expandedTokens, filters) {
    if (!evaluateRecordAgainstFilters(record, filters)) return null;

    const text = normalizeSearchText(extractRecordSearchText(record));
    const reasons = [];
    let score = 0;

    if (query && text.includes(normalizeSearchText(query))) {
      score += 35;
      reasons.push("تطابق نص الاستعلام بالكامل");
    }

    tokens.forEach(function (token) {
      if (text.includes(token)) {
        score += 14;
        reasons.push(`تطابق مباشر: ${token}`);
      }
    });

    expandedTokens.forEach(function (token) {
      if (!tokens.includes(token) && text.includes(token)) {
        score += 8;
        reasons.push(`تطابق دلالي: ${token}`);
      }
    });

    const diagnoses = normalizeTextList(record.diagnoses).join(" ");
    const meds = normalizeMedicationList(record.medications).map(function (m) { return m.name; }).join(" ");
    const diagNorm = normalizeSearchText(diagnoses);
    const medNorm = normalizeSearchText(meds);
    if (tokens.some(function (token) { return diagNorm.includes(token); })) {
      score += 12;
      reasons.push("تطابق داخل التشخيصات");
    }
    if (tokens.some(function (token) { return medNorm.includes(token); })) {
      score += 9;
      reasons.push("تطابق داخل الأدوية");
    }

    const riskCount = normalizeTextList(record.alerts).filter(function (alert) {
      const norm = normalizeSearchText(alert);
      return norm.includes("خطر") || norm.includes("critical") || norm.includes("high");
    }).length;
    if (riskCount) {
      score += Math.min(16, riskCount * 4);
    }

    if (!score) return null;

    return {
      record,
      score: Math.min(100, Math.round(score)),
      reasons: reasons.slice(0, 5),
    };
  }

  function detectClusterKey(resultRow) {
    const diagList = normalizeTextList(resultRow && resultRow.record ? resultRow.record.diagnoses : []);
    const first = diagList[0] || "حالات متنوعة";
    const normalizedFirst = normalizeSearchText(first);
    if (normalizedFirst.includes("سكري") || normalizedFirst.includes("diab")) return "مجموعة السكري";
    if (normalizedFirst.includes("قلب") || normalizedFirst.includes("card")) return "مجموعة القلب";
    if (normalizedFirst.includes("سرطان") || normalizedFirst.includes("oncology")) return "مجموعة الأورام";
    if (normalizedFirst.includes("ضغط")) return "مجموعة الضغط";
    return first;
  }

  function clusterSearchResults(rows) {
    const clusters = {};
    rows.forEach(function (row) {
      const key = detectClusterKey(row);
      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(row);
    });
    return Object.keys(clusters).map(function (key) {
      return {
        name: key,
        count: clusters[key].length,
        avgScore: Math.round(
          clusters[key].reduce(function (sum, row) { return sum + row.score; }, 0) / clusters[key].length
        ),
      };
    }).sort(function (a, b) { return b.count - a.count; });
  }

  function paginateRows(rows, page, pageSize) {
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), pages);
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return {
      page: safePage,
      pages,
      rows: rows.slice(start, end),
      total,
    };
  }

  function mapExternalHitToRecord(hit, rank) {
    const source = hit && typeof hit === "object" ? (hit._source || hit) : {};
    return {
      record: {
        recordId: source.recordId || source.id || source.objectID || `external-${Date.now()}-${rank}`,
        patient: source.patient || {
          name: source.patientName || source.name || null,
          age: source.age || null,
          gender: source.gender || null,
          city: source.city || null,
          hospital: source.hospital || null,
        },
        encounter: source.encounter || {
          date: source.date || null,
          department: source.department || null,
        },
        diagnoses: source.diagnoses || source.conditions || [],
        medications: source.medications || [],
        alerts: source.alerts || [],
        summary: source.summary || { problem: source.problem || "", plan: source.plan || "" },
        sourceHospital: source.hospital || source.hospitalName || null,
        savedAt: source.savedAt || source.updatedAt || null,
      },
      score: Math.min(100, Math.round(Number(hit._score || hit.relevanceScore || 50))),
      reasons: ["نتيجة مسترجعة من محرك البحث الخارجي"],
    };
  }

  async function searchWithElasticsearch(query, filters, page) {
    if (!state.searchEndpoint || !state.searchIndex) {
      throw new Error("إعداد Elasticsearch غير مكتمل.");
    }

    const base = String(state.searchEndpoint).replace(/\/+$/, "");
    const url = `${base}/${encodeURIComponent(state.searchIndex)}/_search`;
    const body = {
      from: (page - 1) * SEARCH_PAGE_SIZE,
      size: SEARCH_PAGE_SIZE * 3,
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query,
                fields: ["summary^3", "diagnoses^2", "patient.name^2", "medications.name", "alerts.message"],
              },
            },
          ],
        },
      },
    };
    const headers = { "Content-Type": "application/json" };
    if (state.searchApiKey) {
      headers.Authorization = state.searchApiKey.startsWith("ApiKey ")
        ? state.searchApiKey
        : `ApiKey ${state.searchApiKey}`;
    }

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }, API_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error("فشل استعلام Elasticsearch.");
    }
    const data = await response.json().catch(function () { return {}; });
    const hits = asArray(data && data.hits && data.hits.hits);
    const mapped = hits.map(function (hit, idx) { return mapExternalHitToRecord(hit, idx + 1); });
    return mapped.filter(function (row) {
      return evaluateRecordAgainstFilters(row.record, filters);
    });
  }

  async function searchWithAlgolia(query, filters, page) {
    if (!state.searchEndpoint || !state.searchIndex || !state.searchApiKey || !state.searchAppId) {
      throw new Error("إعداد Algolia غير مكتمل.");
    }

    const base = String(state.searchEndpoint).replace(/\/+$/, "");
    const url = `${base}/1/indexes/${encodeURIComponent(state.searchIndex)}/query`;
    const headers = {
      "Content-Type": "application/json",
      "X-Algolia-API-Key": state.searchApiKey,
      "X-Algolia-Application-Id": state.searchAppId,
    };
    const body = {
      query,
      hitsPerPage: SEARCH_PAGE_SIZE * 3,
      page: Math.max(0, page - 1),
      analytics: false,
      getRankingInfo: true,
    };

    const response = await fetchWithTimeout(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }, API_TIMEOUT_MS);
    if (!response.ok) {
      throw new Error("فشل استعلام Algolia.");
    }
    const data = await response.json().catch(function () { return {}; });
    const hits = asArray(data && data.hits);
    const mapped = hits.map(function (hit, idx) { return mapExternalHitToRecord(hit, idx + 1); });
    return mapped.filter(function (row) {
      return evaluateRecordAgainstFilters(row.record, filters);
    });
  }

  function buildTopAggregates(rows) {
    const diagnosisMap = {};
    const medicationMap = {};

    rows.forEach(function (row) {
      normalizeTextList(row.record && row.record.diagnoses).forEach(function (diag) {
        const key = String(diag || "").trim();
        if (!key) return;
        diagnosisMap[key] = (diagnosisMap[key] || 0) + 1;
      });

      normalizeMedicationList(row.record && row.record.medications).forEach(function (med) {
        const key = String(med && med.name ? med.name : "").trim();
        if (!key) return;
        medicationMap[key] = (medicationMap[key] || 0) + 1;
      });
    });

    const toTop = function (bag) {
      return Object.keys(bag)
        .map(function (name) { return { name, count: bag[name] }; })
        .sort(function (a, b) { return b.count - a.count; })
        .slice(0, 8);
    };

    return {
      topDiagnoses: toTop(diagnosisMap),
      topMedications: toTop(medicationMap),
    };
  }

  async function executeSearchEngine(query, options) {
    const filters = options.filters || parseFilters();
    const page = options.page || 1;

    const spelling = correctQuerySpelling(query, state.records);
    const effectiveQuery = spelling.corrected || query;
    const queryTokens = tokenizeSearchText(effectiveQuery);
    const expandedTokens = filters.semanticMode === "off"
      ? new Set(queryTokens)
      : expandSemanticTerms(queryTokens);

    const cacheKey = buildSearchCacheKey(effectiveQuery, filters, page);
    const cached = getCachedSearch(cacheKey);
    if (cached) {
      return Object.assign({}, cached, { fromCache: true });
    }

    const started = performance.now();
    let allRows = [];
    let provider = state.searchProvider || "local";

    try {
      if (provider === "elasticsearch") {
        allRows = await searchWithElasticsearch(effectiveQuery, filters, page);
      } else if (provider === "algolia") {
        allRows = await searchWithAlgolia(effectiveQuery, filters, page);
      } else {
        provider = "local";
      }
    } catch (error) {
      provider = "local";
      setStatus(refs.searchStatus, `فشل المحرك الخارجي، تم التحويل للمحرك المحلي. ${toFriendlyError(error)}`, "error");
    }

    if (provider === "local") {
      allRows = state.records
        .map(function (record) {
          return scoreRecordRelevance(
            record,
            effectiveQuery,
            queryTokens,
            Array.from(expandedTokens),
            filters
          );
        })
        .filter(Boolean)
        .sort(function (a, b) {
          if (b.score !== a.score) return b.score - a.score;
          const ta = parseTime((a.record && (a.record.savedAt || a.record.capturedAt)) || 0) || 0;
          const tb = parseTime((b.record && (b.record.savedAt || b.record.capturedAt)) || 0) || 0;
          return tb - ta;
        });
    }

    const clusters = clusterSearchResults(allRows);
    const paged = paginateRows(allRows, page, SEARCH_PAGE_SIZE);
    const aggregates = buildTopAggregates(allRows);
    const elapsedMs = Math.round(performance.now() - started);

    const result = {
      provider,
      elapsedMs,
      query: effectiveQuery,
      corrected: spelling.changed ? effectiveQuery : "",
      totalMatches: paged.total,
      page: paged.page,
      pages: paged.pages,
      allRows,
      rows: paged.rows,
      clusters,
      aggregates,
      fromCache: false,
    };

    setCachedSearch(cacheKey, result);
    return result;
  }

  function renderSearchSuggestions(suggestions) {
    if (!refs.searchSuggestions) return;
    if (!suggestions.length) {
      refs.searchSuggestions.classList.remove("active");
      refs.searchSuggestions.innerHTML = "";
      return;
    }

    refs.searchSuggestions.classList.add("active");
    refs.searchSuggestions.innerHTML = suggestions
      .map(function (item) {
        return `<button class="search-suggestion-item" type="button" data-suggest="${escapeHtml(item)}">${escapeHtml(item)}</button>`;
      })
      .join("");
  }

  function collectQuickSuggestions(query) {
    const normalized = normalizeSearchText(query);
    if (!normalized || normalized.length < 2) return [];

    const bag = new Set();
    state.searchSaved.forEach(function (entry) {
      if (entry && typeof entry.query === "string" && normalizeSearchText(entry.query).includes(normalized)) {
        bag.add(entry.query);
      }
    });
    state.records.forEach(function (record) {
      const patient = record && record.patient ? record.patient : {};
      const values = [
        patient.name || "",
        patient.city || "",
        getDepartmentFromRecord(record),
      ].concat(normalizeTextList(record.diagnoses)).concat(normalizeMedicationList(record.medications).map(function (m) { return m.name; }));
      values.forEach(function (value) {
        const raw = String(value || "").trim();
        if (!raw) return;
        if (normalizeSearchText(raw).includes(normalized)) {
          bag.add(raw);
        }
      });
    });
    return Array.from(bag).slice(0, 8);
  }

  function renderSearchStats(result) {
    if (!refs.searchStats) return;
    if (!result) {
      setStatus(refs.searchStats, "إحصائيات البحث ستظهر هنا.", "");
      return;
    }
    const avgScore = result.rows.length
      ? Math.round(result.rows.reduce(function (sum, row) { return sum + row.score; }, 0) / result.rows.length)
      : 0;
    const speedLabel = result.elapsedMs <= 100 ? "أقل من 100ms" : `${result.elapsedMs}ms`;
    setStatus(
      refs.searchStats,
      `النتائج: ${result.totalMatches} | الصفحة: ${result.page}/${result.pages} | متوسط الصلة: ${avgScore}% | المحرك: ${result.provider} | السرعة: ${speedLabel}${result.fromCache ? " | من الكاش" : ""}`,
      result.elapsedMs <= 100 ? "success" : ""
    );
  }

  function renderSearchClusters(clusters, aggregates) {
    if (!refs.searchClusters) return;
    const clusterRows = asArray(clusters);
    const clusterHtml = clusterRows.length
      ? clusterRows
          .map(function (cluster) {
            return `<li>${escapeHtml(cluster.name)} - ${escapeHtml(String(cluster.count))} حالة - متوسط صلة ${escapeHtml(String(cluster.avgScore))}%</li>`;
          })
          .join("")
      : "<li>لا توجد مجموعات حالياً.</li>";
    const topDiag = buildTopList(aggregates && aggregates.topDiagnoses);
    const topMed = buildTopList(aggregates && aggregates.topMedications);

    refs.searchClusters.innerHTML = `
      <div class="search-cluster-grid">
        <div class="result-item">
          <strong>تجميع النتائج</strong>
          <ul class="mini-list">${clusterHtml}</ul>
        </div>
        <div class="result-item">
          <strong>إحصائيات فورية</strong>
          <ul class="mini-list">${topDiag}</ul>
        </div>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>أكثر الأدوية في النتائج</strong>
        <ul class="mini-list">${topMed}</ul>
      </div>
    `;
  }

  function renderSearchResult(result) {
    if (!refs.searchResult) return;
    if (!result || !Array.isArray(result.rows)) {
      refs.searchResult.innerHTML = "<p>لا توجد نتيجة للبحث.</p>";
      renderSearchStats(null);
      renderSearchClusters([], {});
      return;
    }

    if (!result.rows.length) {
      refs.searchResult.innerHTML = "<p>لا توجد نتائج مطابقة للشروط الحالية.</p>";
      renderSearchStats(result);
      renderSearchClusters(result.clusters, result.aggregates);
      return;
    }

    const rowsHtml = result.rows.map(function (row) {
      const record = row.record || {};
      const patient = record.patient && typeof record.patient === "object" ? record.patient : {};
      const diagnosis = normalizeTextList(record.diagnoses)[0] || "بدون تشخيص واضح";
      const reasonsHtml = asArray(row.reasons).slice(0, 3).map(function (reason) {
        return `<li>${escapeHtml(String(reason))}</li>`;
      }).join("");
      return `
        <div class="result-item" style="margin-top:10px;">
          <strong>${escapeHtml(record.recordId || "سجل")} - درجة الصلة: ${escapeHtml(String(row.score))}%</strong>
          <div>${escapeHtml(patient.name || "مريض غير معروف")} | ${escapeHtml(String(patient.age || "العمر غير متوفر"))} | ${escapeHtml(patient.city || "بدون مدينة")}</div>
          <div>التشخيص: ${escapeHtml(diagnosis)}</div>
          <div>المستشفى: ${escapeHtml(record.sourceHospital || patient.hospital || "غير محدد")}</div>
          <ul class="mini-list" style="margin-top:6px;">${reasonsHtml || "<li>مطابقة دلالية</li>"}</ul>
        </div>
      `;
    }).join("");

    refs.searchResult.innerHTML = `
      <div class="result-item">
        <strong>ملخص البحث</strong>
        <div>إجمالي النتائج المطابقة: ${escapeHtml(String(result.totalMatches))}</div>
        <div>الصفحة الحالية: ${escapeHtml(String(result.page))} من ${escapeHtml(String(result.pages))}</div>
        ${result.corrected ? `<div>تصحيح إملائي مقترح: ${escapeHtml(result.corrected)}</div>` : ""}
      </div>
      ${rowsHtml}
    `;

    renderSearchStats(result);
    renderSearchClusters(result.clusters, result.aggregates);
  }

  async function executeAndRenderSearch(options) {
    const query = refs.searchQuery ? refs.searchQuery.value.trim() : "";
    if (!state.records.length) {
      setStatus(refs.searchStatus, "احفظ سجلاً واحداً على الأقل قبل البحث.", "error");
      return;
    }
    if (!query || query.length < 2) {
      setStatus(refs.searchStatus, "أدخل سؤال بحث واضح (حرفان على الأقل).", "error");
      return;
    }

    saveSearchEngineConfig();
    const page = options && options.page ? options.page : state.searchCurrentPage;
    setStatus(refs.searchStatus, "جاري تنفيذ البحث متعدد المستويات...", "");

    const result = await executeSearchEngine(query, {
      page,
      filters: parseFilters(),
    });

    state.searchCurrentPage = result.page;
    state.searchLastKey = buildSearchCacheKey(result.query, parseFilters(), result.page);
    state.searchLastAllResults = asArray(result.allRows);
    state.searchLastPagedResults = asArray(result.rows);
    renderSearchResult(result);
    setStatus(
      refs.searchStatus,
      `تم تنفيذ البحث بنجاح عبر محرك ${result.provider}.`,
      "success"
    );
  }

  async function handleSearch() {
    setButtonLoading(refs.searchBtn, true, "جاري البحث...");
    try {
      state.searchCurrentPage = 1;
      await executeAndRenderSearch({ page: 1 });
    } catch (error) {
      setStatus(refs.searchStatus, toFriendlyError(error, "تعذر تنفيذ البحث حالياً."), "error");
    } finally {
      setButtonLoading(refs.searchBtn, false);
    }
  }

  function handleQuickTypingSearch() {
    const query = refs.searchQuery ? refs.searchQuery.value.trim() : "";
    const suggestions = collectQuickSuggestions(query);
    renderSearchSuggestions(suggestions);

    if (!state.records.length) {
      setStatus(refs.searchQuickStatus, "احفظ سجلاً واحداً على الأقل لتفعيل البحث الفوري.", "");
      return;
    }

    if (!query || query.length < 2) {
      setStatus(refs.searchQuickStatus, "اكتب حرفين على الأقل لتفعيل البحث الفوري.", "");
      return;
    }

    if (state.searchTypingTimer) {
      clearTimeout(state.searchTypingTimer);
    }

    state.searchTypingTimer = setTimeout(function () {
      state.searchCurrentPage = 1;
      executeAndRenderSearch({ page: 1 }).then(function () {
        setStatus(refs.searchQuickStatus, "تم تحديث نتائج البحث الفوري أثناء الكتابة.", "success");
      }).catch(function (error) {
        setStatus(refs.searchQuickStatus, toFriendlyError(error, "تعذر تنفيذ البحث الفوري."), "error");
      });
    }, QUICK_SEARCH_DEBOUNCE_MS);
  }

  function handleSuggestionClick(event) {
    const target = event.target;
    if (!target || !target.getAttribute) return;
    const suggested = target.getAttribute("data-suggest");
    if (!suggested || !refs.searchQuery) return;
    refs.searchQuery.value = suggested;
    renderSearchSuggestions([]);
    handleSearch();
  }

  function renderSavedSearchOptions() {
    if (!refs.savedSearchesSelect) return;
    const options = state.searchSaved
      .slice()
      .reverse()
      .slice(0, 40)
      .map(function (entry, index) {
        const label = `${entry.query} - ${entry.label || "بحث محفوظ"} (${entry.savedAt || ""})`;
        return `<option value="${escapeHtml(String(index))}">${escapeHtml(label)}</option>`;
      })
      .join("");
    refs.savedSearchesSelect.innerHTML = `<option value="">استعلامات محفوظة</option>${options}`;
  }

  function handleSaveCurrentSearch() {
    const query = refs.searchQuery ? refs.searchQuery.value.trim() : "";
    if (!query) {
      setStatus(refs.searchStatus, "أدخل استعلاماً أولاً ثم احفظه.", "error");
      return;
    }

    const filters = parseFilters();
    const payload = {
      label: `استعلام ${state.searchSaved.length + 1}`,
      query,
      filters,
      provider: state.searchProvider,
      savedAt: new Date().toLocaleString("ar-SA"),
    };
    state.searchSaved.push(payload);
    if (state.searchSaved.length > 50) {
      state.searchSaved = state.searchSaved.slice(-50);
    }
    saveSavedSearches();
    renderSavedSearchOptions();
    setStatus(refs.searchStatus, "تم حفظ الاستعلام بنجاح.", "success");
  }

  function applyFilterValues(filters) {
    if (!filters || typeof filters !== "object") return;
    if (refs.filterAgeMin) refs.filterAgeMin.value = filters.ageMin != null ? String(filters.ageMin) : "";
    if (refs.filterAgeMax) refs.filterAgeMax.value = filters.ageMax != null ? String(filters.ageMax) : "";
    if (refs.filterGender) refs.filterGender.value = filters.gender || "";
    if (refs.filterDateFrom) refs.filterDateFrom.value = filters.dateFrom ? new Date(filters.dateFrom).toISOString().slice(0, 10) : "";
    if (refs.filterDateTo) refs.filterDateTo.value = filters.dateTo ? new Date(filters.dateTo).toISOString().slice(0, 10) : "";
    if (refs.filterDepartment) refs.filterDepartment.value = filters.department || "";
    if (refs.filterExclude) refs.filterExclude.value = asArray(filters.excludeTerms).join("، ");
    if (refs.filterNearCity) refs.filterNearCity.value = filters.nearCity || "";
    if (refs.filterRadiusKm) refs.filterRadiusKm.value = filters.radiusKm ? String(filters.radiusKm) : "";
    if (refs.semanticMode) refs.semanticMode.value = filters.semanticMode || "on";
  }

  function handleLoadSavedSearch() {
    const value = refs.savedSearchesSelect ? refs.savedSearchesSelect.value : "";
    if (value === "") {
      setStatus(refs.searchStatus, "اختر استعلاماً محفوظاً أولاً.", "error");
      return;
    }
    const reversed = state.searchSaved.slice().reverse().slice(0, 40);
    const selected = reversed[Number(value)];
    if (!selected) {
      setStatus(refs.searchStatus, "تعذر تحميل الاستعلام المحدد.", "error");
      return;
    }
    if (refs.searchQuery) refs.searchQuery.value = selected.query || "";
    applyFilterValues(selected.filters || {});
    if (refs.searchEngineProvider && selected.provider) {
      refs.searchEngineProvider.value = selected.provider;
    }
    state.searchCurrentPage = 1;
    handleSearch();
  }

  function handleSearchPrevPage() {
    if (state.searchCurrentPage <= 1) return;
    state.searchCurrentPage -= 1;
    executeAndRenderSearch({ page: state.searchCurrentPage }).catch(function (error) {
      setStatus(refs.searchStatus, toFriendlyError(error, "تعذر الانتقال للصفحة السابقة."), "error");
    });
  }

  function handleSearchNextPage() {
    state.searchCurrentPage += 1;
    executeAndRenderSearch({ page: state.searchCurrentPage }).catch(function (error) {
      state.searchCurrentPage = Math.max(1, state.searchCurrentPage - 1);
      setStatus(refs.searchStatus, toFriendlyError(error, "تعذر الانتقال للصفحة التالية."), "error");
    });
  }

  function handleApplyFilters() {
    state.searchCurrentPage = 1;
    executeAndRenderSearch({ page: 1 }).catch(function (error) {
      setStatus(refs.searchStatus, toFriendlyError(error, "تعذر تطبيق الفلاتر حالياً."), "error");
    });
  }

  function buildSearchCsv(rows) {
    const headers = ["record_id", "patient_name", "age", "gender", "city", "hospital", "diagnosis", "relevance_score"];
    const body = asArray(rows).map(function (row) {
      const record = row.record || {};
      const patient = record.patient || {};
      const diag = normalizeTextList(record.diagnoses)[0] || "";
      return [
        record.recordId || "",
        patient.name || "",
        patient.age != null ? String(patient.age) : "",
        patient.gender || "",
        patient.city || "",
        record.sourceHospital || patient.hospital || "",
        diag,
        row.score != null ? String(row.score) : "",
      ].map(csvEscape).join(",");
    });
    return `${headers.join(",")}\n${body.join("\n")}`;
  }

  function handleExportSearchCsv() {
    if (!state.searchLastAllResults.length) {
      setStatus(refs.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
      return;
    }
    const csv = buildSearchCsv(state.searchLastAllResults);
    downloadTextFile("medical-search-results.csv", "text/csv;charset=utf-8", csv);
    setStatus(refs.searchStatus, "تم تصدير نتائج البحث CSV.", "success");
  }

  function handleExportSearchExcel() {
    if (!state.searchLastAllResults.length) {
      setStatus(refs.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
      return;
    }
    if (!window.XLSX) {
      setStatus(refs.searchStatus, "مكتبة Excel غير جاهزة حالياً.", "error");
      return;
    }

    const rows = state.searchLastAllResults.map(function (row) {
      const record = row.record || {};
      const patient = record.patient || {};
      return {
        "معرف السجل": record.recordId || "",
        "اسم المريض": patient.name || "",
        "العمر": patient.age != null ? patient.age : "",
        "الجنس": patient.gender || "",
        "المدينة": patient.city || "",
        "المستشفى": record.sourceHospital || patient.hospital || "",
        "التشخيص": normalizeTextList(record.diagnoses)[0] || "",
        "درجة الصلة": row.score || 0,
      };
    });

    const sheet = window.XLSX.utils.json_to_sheet(rows);
    const book = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(book, sheet, "SearchResults");
    window.XLSX.writeFile(book, "medical-search-results.xlsx");
    setStatus(refs.searchStatus, "تم تصدير نتائج البحث Excel.", "success");
  }

  function handleExportSearchPdf() {
    if (!state.searchLastAllResults.length) {
      setStatus(refs.searchStatus, "لا توجد نتائج بحث لتصديرها.", "error");
      return;
    }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      setStatus(refs.searchStatus, "مكتبة PDF غير جاهزة حالياً.", "error");
      return;
    }

    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    let y = 40;
    doc.setFontSize(14);
    doc.text("نتائج البحث الطبي الذكي", 40, y);
    y += 24;
    doc.setFontSize(10);
    state.searchLastAllResults.forEach(function (row, index) {
      const record = row.record || {};
      const patient = record.patient || {};
      const line = `${index + 1}) ${record.recordId || ""} | ${patient.name || ""} | ${normalizeTextList(record.diagnoses)[0] || ""} | ${row.score || 0}%`;
      doc.text(line.slice(0, 110), 40, y);
      y += 16;
      if (y > 760) {
        doc.addPage();
        y = 40;
      }
    });
    doc.save("medical-search-results.pdf");
    setStatus(refs.searchStatus, "تم تصدير نتائج البحث PDF.", "success");
  }

  async function handleVoiceSearchDirect() {
    const RecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!RecognitionClass) {
      setStatus(refs.searchQuickStatus, "المتصفح لا يدعم الإدخال الصوتي المباشر. استخدم رفع ملف صوتي.", "error");
      return;
    }

    if (state.voiceRecognitionActive && state.voiceRecognition) {
      state.voiceRecognition.stop();
      return;
    }

    const recognition = new RecognitionClass();
    recognition.lang = "ar-SA";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    state.voiceRecognition = recognition;
    state.voiceRecognitionActive = true;
    setStatus(refs.searchQuickStatus, "الاستماع جارٍ... تحدث الآن.", "");

    recognition.onresult = function (event) {
      const transcript = event && event.results && event.results[0] && event.results[0][0]
        ? String(event.results[0][0].transcript || "").trim()
        : "";
      if (transcript && refs.searchQuery) {
        refs.searchQuery.value = transcript;
        setStatus(refs.searchQuickStatus, `تم تحويل الصوت إلى نص: ${transcript}`, "success");
        handleSearch();
      }
    };

    recognition.onerror = function () {
      state.voiceRecognitionActive = false;
      setStatus(refs.searchQuickStatus, "تعذر قراءة الصوت المباشر. استخدم رفع ملف صوتي.", "error");
    };

    recognition.onend = function () {
      state.voiceRecognitionActive = false;
      if (refs.voiceSearchBtn) {
        refs.voiceSearchBtn.textContent = "بحث صوتي مباشر";
      }
    };

    if (refs.voiceSearchBtn) {
      refs.voiceSearchBtn.textContent = "إيقاف البحث الصوتي";
    }
    recognition.start();
  }

  function triggerVoiceFilePicker() {
    if (refs.voiceFileInput) refs.voiceFileInput.click();
  }

  async function handleVoiceFileInputChange(event) {
    const file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    setStatus(refs.searchQuickStatus, "جاري تحويل الملف الصوتي إلى نص...", "");
    try {
      const base64 = await blobToBase64(file);
      const data = await postBackendJson(API_TRANSCRIBE_PATH, {
        fileBase64: base64,
        mimeType: file.type || "audio/wav",
        fileName: file.name,
      }, Math.max(API_TIMEOUT_MS, 90000));
      const transcript = String(data && data.text ? data.text : "").trim();
      if (!transcript) {
        throw new Error("النص الناتج من الصوت فارغ.");
      }
      if (refs.searchQuery) refs.searchQuery.value = transcript;
      setStatus(refs.searchQuickStatus, "تم تحويل الصوت إلى نص بنجاح وتشغيل البحث.", "success");
      await handleSearch();
    } catch (error) {
      setStatus(refs.searchQuickStatus, toFriendlyError(error, "تعذر تنفيذ البحث الصوتي."), "error");
    } finally {
      if (event && event.target) event.target.value = "";
    }
  }

  function triggerImageSearchPicker() {
    if (refs.imageSearchInput) refs.imageSearchInput.click();
  }

  async function handleImageSearchInputChange(event) {
    const file = event && event.target && event.target.files ? event.target.files[0] : null;
    if (!file) return;
    setStatus(refs.searchQuickStatus, "جاري تحليل الصورة للبحث عن حالات مشابهة...", "");
    try {
      const base64 = await blobToBase64(file);
      const data = await postBackendJson(API_OCR_TEXT_PATH, {
        fileBase64: base64,
        mimeType: file.type || "image/jpeg",
        fileName: file.name,
      }, Math.max(API_TIMEOUT_MS, 60000));
      const extracted = limitReportText(data && data.text ? data.text : "");
      if (!extracted || extracted.length < 8) {
        throw new Error("لم يتم استخراج نص كافٍ من الصورة.");
      }
      if (refs.searchQuery) refs.searchQuery.value = extracted.slice(0, 180);
      setStatus(refs.searchQuickStatus, "تم استخراج النص من الصورة وتشغيل البحث الدلالي.", "success");
      await handleSearch();
    } catch (error) {
      setStatus(refs.searchQuickStatus, toFriendlyError(error, "تعذر تنفيذ البحث بالصورة."), "error");
    } finally {
      if (event && event.target) event.target.value = "";
    }
  }

  function renderInsightsResult(result) {
    if (!refs.insightsResult) return;
    if (!result || typeof result !== "object") {
      refs.insightsResult.innerHTML = "<p>لا توجد تحليلات حالياً.</p>";
      return;
    }

    const kpis = result.kpis && typeof result.kpis === "object" ? result.kpis : {};
    const alerts = asArray(result.alerts);
    const recommendations = asArray(result.recommendations);

    const alertList = alerts.length
      ? alerts
          .slice(0, 6)
          .map(function (item) {
            const level = item && typeof item === "object" ? item.level : "";
            const message = item && typeof item === "object" ? item.message : item;
            return `<li><strong>${escapeHtml(level || "تنبيه")}</strong> - ${escapeHtml(String(message || ""))}</li>`;
          })
          .join("")
      : "<li>لا توجد تنبيهات تشغيلية حالياً.</li>";

    const recommendationList = recommendations.length
      ? recommendations
          .slice(0, 6)
          .map(function (item) {
            const priority = item && typeof item === "object" ? item.priority : "";
            const action = item && typeof item === "object" ? item.action : item;
            return `<li><strong>${escapeHtml(priority || "أولوية")}</strong> - ${escapeHtml(String(action || ""))}</li>`;
          })
          .join("")
      : "<li>لا توجد توصيات كافية حالياً.</li>";

    refs.insightsResult.innerHTML = `
      <div class="result-grid">
        <div class="result-item">
          <strong>عدد السجلات المحللة</strong>
          <div style="font-size:1.5rem;font-weight:700;">${escapeHtml(String(kpis.recordsAnalyzed || 0))}</div>
        </div>
        <div class="result-item">
          <strong>الحالات عالية الخطورة</strong>
          <div style="font-size:1.5rem;font-weight:700;">${escapeHtml(String(kpis.highRiskCases || 0))}</div>
        </div>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>التنبيهات التشغيلية</strong>
        <ul class="mini-list">${alertList}</ul>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>التوصيات التنفيذية</strong>
        <ul class="mini-list">${recommendationList}</ul>
      </div>
      <div class="result-grid" style="margin-top:10px;">
        <div class="result-item">
          <strong>أكثر التشخيصات</strong>
          <ul class="mini-list">${buildTopList(result.topDiagnoses)}</ul>
        </div>
        <div class="result-item">
          <strong>أكثر الأدوية</strong>
          <ul class="mini-list">${buildTopList(result.topMedications)}</ul>
        </div>
      </div>
    `;
  }

  async function handleInsights() {
    if (!state.records.length) {
      setStatus(refs.insightsStatus, "احفظ سجلات أولاً لتوليد التحليلات.", "error");
      return;
    }

    setButtonLoading(refs.insightsBtn, true, "جاري توليد التحليلات...");
    setStatus(refs.insightsStatus, "يجري تحليل الاتجاهات الطبية والتشغيلية...", "");

    try {
      const data = await postMedicalArchive({
        action: "insights",
        records: state.records,
        hospitalProfile: getHospitalProfile(),
      });

      renderInsightsResult(data.result || {});
      setStatus(refs.insightsStatus, "تم توليد التحليلات التشغيلية بنجاح.", "success");
    } catch (error) {
      setStatus(refs.insightsStatus, toFriendlyError(error, "تعذر توليد التحليلات حالياً."), "error");
    } finally {
      setButtonLoading(refs.insightsBtn, false);
    }
  }

  function getFileExtension(fileName) {
    const normalized = String(fileName || "").toLowerCase().trim();
    const idx = normalized.lastIndexOf(".");
    if (idx === -1) return "";
    return normalized.slice(idx + 1);
  }

  function configurePdfWorker() {
    if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    }
  }

  async function extractTextFromPdf(file) {
    if (!window.pdfjsLib) {
      throw new Error("مكتبة PDF غير جاهزة حالياً. أعد المحاولة بعد ثوانٍ.");
    }

    configurePdfWorker();
    const bytes = await file.arrayBuffer();
    const loadingTask = window.pdfjsLib.getDocument({ data: bytes });
    const pdf = await loadingTask.promise;

    const chunks = [];
    const pages = Math.min(pdf.numPages, 40);

    for (let pageNo = 1; pageNo <= pages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map(function (item) {
          return item && item.str ? item.str : "";
        })
        .join(" ");
      chunks.push(pageText);
    }

    return chunks.join("\n");
  }

  async function extractTextFromDocx(file) {
    if (!window.mammoth || typeof window.mammoth.extractRawText !== "function") {
      throw new Error("مكتبة DOCX غير جاهزة حالياً. أعد المحاولة بعد ثوانٍ.");
    }

    const bytes = await file.arrayBuffer();
    const result = await window.mammoth.extractRawText({ arrayBuffer: bytes });
    return result && typeof result.value === "string" ? result.value : "";
  }

  function isSupportedMedicalFile(file) {
    const ext = getFileExtension(file && file.name);
    return SUPPORTED_EXTENSIONS.includes(ext);
  }

  async function readPartialText(file, maxBytes) {
    const slice = file.slice(0, maxBytes || 65536);
    return String(await slice.text()).toLowerCase();
  }

  async function validateMedicalFile(file) {
    const issues = [];
    const ext = getFileExtension(file && file.name);
    const lowerName = String(file && file.name ? file.name : "").toLowerCase();

    if (!isSupportedMedicalFile(file)) {
      issues.push("الصيغة غير مدعومة لهذا النظام الطبي.");
    }

    if ((file && file.size) > MAX_SINGLE_FILE_BYTES) {
      issues.push(`حجم الملف يتجاوز ${formatBytes(MAX_SINGLE_FILE_BYTES)}.`);
    }

    if (/\.(pdf|docx|doc|dcm|dicom|jpg|jpeg|png|mp3|wav|xls|xlsx)\.(exe|bat|cmd|js|vbs|scr|sh)$/i.test(lowerName)) {
      issues.push("اسم ملف مشبوه (امتداد مزدوج غير آمن).");
    }

    if (TEXT_EXTENSIONS.includes(ext) || ext === "json" || ext === "xml" || ext === "html" || ext === "htm") {
      const sample = await readPartialText(file, 65536).catch(function () {
        return "";
      });
      const suspiciousPattern = /(powershell|cmd\.exe|<script|eval\(|document\.write|wget\s+http|curl\s+http|base64\s+-d)/i;
      if (suspiciousPattern.test(sample)) {
        issues.push("تم رصد نمط نصي مشبوه أثناء الفحص الأمني الأولي.");
      }
    }

    return {
      ok: issues.length === 0,
      issues,
    };
  }

  function updateQueueItem(item, patch) {
    if (!item || typeof item !== "object") return;
    Object.assign(item, patch || {});
    renderFileQueue();
  }

  function notifyQueueMessage(message, type) {
    setStatus(refs.batchStatus, message, type);
  }

  async function blobToBase64(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  function ensureNotAborted(item) {
    if (item && item.aborted) {
      const error = new Error("تم إلغاء معالجة الملف.");
      error.code = "ITEM_ABORTED";
      throw error;
    }
  }

  async function compressImageIfNeeded(file) {
    if (!file || !file.type || !file.type.startsWith("image/")) return file;
    if (file.size <= 4 * 1024 * 1024) return file;

    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise(function (resolve, reject) {
        const img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = imageUrl;
      });

      const maxEdge = 1800;
      const ratio = Math.min(1, maxEdge / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, width, height);
      const blob = await new Promise(function (resolve) {
        canvas.toBlob(resolve, "image/jpeg", 0.78);
      });
      if (!blob) return file;
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  async function extractTextFromExcel(file) {
    if (!window.XLSX) {
      throw new Error("مكتبة Excel غير جاهزة حالياً.");
    }
    const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
    const chunks = [];
    workbook.SheetNames.slice(0, 10).forEach(function (sheetName) {
      const sheet = workbook.Sheets[sheetName];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
      const text = rows
        .slice(0, 200)
        .map(function (row) { return asArray(row).join(" | "); })
        .join("\n");
      chunks.push(`ورقة: ${sheetName}\n${text}`);
    });
    return chunks.join("\n\n");
  }

  async function extractTextWithGemini(file, item) {
    ensureNotAborted(item);
    const workingFile = await compressImageIfNeeded(file);
    const base64 = await blobToBase64(workingFile);
    const payload = {
      fileBase64: base64,
      mimeType: workingFile.type || "application/octet-stream",
      fileName: file.name,
    };
    const response = await postBackendJson(API_OCR_TEXT_PATH, payload, Math.max(API_TIMEOUT_MS, 60000));
    const text = response && typeof response.text === "string" ? response.text : "";
    if (!text) throw new Error("تعذر استخراج نص واضح من الملف.");
    if (item) item.ocrUsed = true;
    return text;
  }

  async function transcribeAudioWithGroq(file, item) {
    ensureNotAborted(item);
    const base64 = await blobToBase64(file);
    const payload = {
      fileBase64: base64,
      mimeType: file.type || "audio/wav",
      fileName: file.name,
    };
    const response = await postBackendJson(API_TRANSCRIBE_PATH, payload, Math.max(API_TIMEOUT_MS, 90000));
    const text = response && typeof response.text === "string" ? response.text : "";
    if (!text) throw new Error("تعذر تحويل الصوت إلى نص.");
    if (item) item.transcriptionUsed = true;
    return text;
  }

  async function extractTextFromFile(file, item) {
    const ext = getFileExtension(file && file.name);

    if (TEXT_EXTENSIONS.includes(ext)) {
      return file.text();
    }

    if (ext === "pdf") {
      const parsed = await extractTextFromPdf(file).catch(function () {
        return "";
      });
      if (cleanTextInput(parsed).length >= 30) return parsed;
      return extractTextWithGemini(file, item);
    }

    if (ext === "docx") {
      const parsed = await extractTextFromDocx(file).catch(function () {
        return "";
      });
      if (cleanTextInput(parsed).length >= 20) return parsed;
      return extractTextWithGemini(file, item);
    }

    if (ext === "doc" || ext === "dcm" || ext === "dicom" || IMAGE_EXTENSIONS.includes(ext)) {
      return extractTextWithGemini(file, item);
    }

    if (EXCEL_EXTENSIONS.includes(ext)) {
      return extractTextFromExcel(file);
    }

    if (AUDIO_EXTENSIONS.includes(ext)) {
      return transcribeAudioWithGroq(file, item);
    }

    throw new Error("صيغة الملف غير مدعومة حالياً.");
  }

  function addFilesToQueue(filesLike) {
    const files = Array.from(filesLike || []);
    if (!files.length) {
      setStatus(refs.fileStatus, "لم يتم اختيار أي ملف.", "error");
      return;
    }

    if (files.length + state.uploadQueue.length > MAX_BATCH_FILES) {
      setStatus(refs.fileStatus, `الحد الأعلى في التجربة هو ${MAX_BATCH_FILES} ملفاً لكل دفعة.`, "error");
      return;
    }

    let accepted = 0;
    files.forEach(function (file) {
      if (!file || !file.name) return;
      const duplicate = state.uploadQueue.some(function (item) {
        return item.name === file.name && item.size === file.size;
      });
      if (duplicate) return;
      state.uploadQueue.push(createQueueItem(file));
      accepted += 1;
    });

    renderFileQueue();
    if (accepted) {
      setStatus(refs.fileStatus, `تمت إضافة ${accepted} ملف إلى طابور المعالجة.`, "success");
    } else {
      setStatus(refs.fileStatus, "كل الملفات المحددة موجودة مسبقاً في الطابور.", "error");
    }
  }

  function pickFiles() {
    if (refs.reportFile) refs.reportFile.click();
  }

  function pickFolder() {
    if (refs.reportFolder) refs.reportFolder.click();
  }

  function handleFilesSelected(event) {
    const files = event && event.target && event.target.files ? event.target.files : [];
    addFilesToQueue(files);
    if (event && event.target) {
      event.target.value = "";
    }
  }

  function setDropZoneState(active) {
    if (!refs.dropZone) return;
    if (active) {
      refs.dropZone.classList.add("dragover");
    } else {
      refs.dropZone.classList.remove("dragover");
    }
  }

  function extractQueueItemTextToEditor(item) {
    if (!item || !item.extractedText) return;
    if (refs.reportInput) {
      refs.reportInput.value = limitReportText(item.extractedText);
    }
    state.lastFileMeta = {
      name: item.name,
      type: item.type || item.ext,
      size: item.size,
    };
    setStatus(refs.fileStatus, `تم إدراج النص المستخرج من ملف: ${item.name}`, "success");
  }

  function queueStatusFromError(error) {
    if (!error) return "error";
    if (error.code === "ITEM_ABORTED" || String(error.message || "").includes("إلغاء")) {
      return "cancelled";
    }
    return "error";
  }

  async function processQueueItem(item) {
    updateQueueItem(item, {
      status: "processing",
      progress: 5,
      message: "بدء التحقق من الملف...",
      aborted: false,
    });

    try {
      const validation = await validateMedicalFile(item.file);
      item.validation = validation;
      if (!validation.ok) {
        throw new Error(validation.issues.join(" | "));
      }
      ensureNotAborted(item);

      updateQueueItem(item, { progress: 20, message: "استخراج النص من الملف..." });
      const text = await extractTextFromFile(item.file, item);
      ensureNotAborted(item);
      const normalized = limitReportText(text);

      if (!normalized || normalized.length < 20) {
        throw new Error("النص المستخرج غير كافٍ للتحليل الطبي.");
      }

      updateQueueItem(item, {
        status: "done",
        progress: 100,
        message: `اكتملت المعالجة. طول النص: ${normalized.length} حرف.`,
        extractedText: normalized,
      });
    } catch (error) {
      updateQueueItem(item, {
        status: queueStatusFromError(error),
        progress: item.aborted ? item.progress : Math.max(item.progress || 0, 20),
        message: toFriendlyError(error, "تعذر معالجة الملف."),
      });
    } finally {
      item.workerLocked = false;
    }
  }

  function getNextQueueItemForProcessing() {
    for (const item of state.uploadQueue) {
      if (item.workerLocked) continue;
      if (item.status === "queued") {
        item.workerLocked = true;
        return item;
      }
    }
    return null;
  }

  async function queueWorker() {
    while (!state.stopQueueRequested) {
      const item = getNextQueueItemForProcessing();
      if (!item) break;
      await processQueueItem(item);
    }
  }

  async function runBatchProcessing() {
    if (state.queueProcessing) {
      notifyQueueMessage("المعالجة الدُفعية قيد التشغيل بالفعل.", "error");
      return;
    }
    if (!state.uploadQueue.length) {
      notifyQueueMessage("أضف ملفات أولاً قبل تشغيل المعالجة الدُفعية.", "error");
      return;
    }

    const hasQueued = state.uploadQueue.some(function (item) { return item.status === "queued"; });
    if (!hasQueued) {
      notifyQueueMessage("لا توجد ملفات في حالة انتظار. استخدم الاستئناف للملفات المتوقفة.", "error");
      return;
    }

    state.stopQueueRequested = false;
    state.queueProcessing = true;
    notifyQueueMessage("بدأت المعالجة الدُفعية مع تشغيل متوازي للملفات.", "");

    try {
      const workers = [];
      for (let i = 0; i < BATCH_CONCURRENCY; i += 1) {
        workers.push(queueWorker());
      }
      await Promise.all(workers);
      notifyQueueMessage("انتهت المعالجة الدُفعية الحالية.", "success");
    } catch (error) {
      notifyQueueMessage(toFriendlyError(error, "حدث خلل أثناء معالجة الدفعة."), "error");
    } finally {
      state.queueProcessing = false;
      renderFileQueue();
    }
  }

  function handleCancelBatch() {
    state.stopQueueRequested = true;
    state.uploadQueue.forEach(function (item) {
      if (item.status === "processing") {
        item.aborted = true;
        item.status = "cancelled";
        item.message = "تم إلغاء المعالجة بواسطة المستخدم.";
      }
    });
    renderFileQueue();
    notifyQueueMessage("تم إرسال أمر إلغاء المعالجة الجارية.", "error");
  }

  function handleResumeBatch() {
    let count = 0;
    state.uploadQueue.forEach(function (item) {
      if (item.status === "cancelled" || item.status === "error") {
        item.status = "queued";
        item.progress = 0;
        item.message = "بانتظار الاستئناف";
        item.aborted = false;
        count += 1;
      }
    });
    renderFileQueue();
    notifyQueueMessage(
      count ? `تم تحويل ${count} ملف إلى وضع الانتظار للاستئناف.` : "لا توجد ملفات متوقفة لاستئنافها.",
      count ? "success" : "error"
    );
  }

  function saveRecordFromExtract(extractResult, sourceFileName) {
    const snapshot = JSON.parse(JSON.stringify(extractResult || {}));
    snapshot.recordId = snapshot.recordId || createRecordId();
    snapshot.savedAt = new Date().toLocaleString("ar-SA");
    snapshot.sourceHospital = getHospitalProfile().hospitalName || null;
    snapshot.sourceFile = sourceFileName || (state.lastFileMeta ? state.lastFileMeta.name : null);
    state.records.push(snapshot);
    renderSavedRecords();
    updateCounters();
    return snapshot.recordId;
  }

  async function analyzeReadyQueueItems() {
    const candidates = state.uploadQueue.filter(function (item) {
      return item.status === "done" && item.extractedText && !item.analyzed;
    });

    if (!candidates.length) {
      setStatus(refs.batchStatus, "لا توجد ملفات مكتملة وجاهزة للتحليل.", "error");
      return;
    }

    setButtonLoading(refs.analyzeBatchBtn, true, "جاري التحليل عبر Groq...");
    setStatus(refs.batchStatus, `تحليل ${candidates.length} ملف جاهز عبر Groq...`, "");

    let pointer = 0;
    let success = 0;
    let fail = 0;

    async function worker() {
      while (pointer < candidates.length) {
        const index = pointer;
        pointer += 1;
        const item = candidates[index];
        try {
          updateQueueItem(item, { message: "جاري التحليل الطبي عبر Groq...", progress: 70 });
          const data = await postMedicalArchive({
            action: "extract",
            reportText: item.extractedText,
            hospitalProfile: getHospitalProfile(),
          });
          if (!data || !data.result) {
            throw new Error("نتيجة التحليل غير صالحة.");
          }
          item.analyzed = true;
          item.savedRecordId = saveRecordFromExtract(data.result, item.name);
          updateQueueItem(item, { progress: 100, message: "اكتمل التحليل وتم حفظ السجل الطبي." });
          success += 1;
        } catch (error) {
          fail += 1;
          updateQueueItem(item, { status: "error", message: toFriendlyError(error, "فشل تحليل الملف.") });
        }
      }
    }

    try {
      const workers = [];
      for (let i = 0; i < BATCH_ANALYZE_CONCURRENCY; i += 1) {
        workers.push(worker());
      }
      await Promise.all(workers);
      setStatus(refs.batchStatus, `اكتمل تحليل الدفعة. نجاح: ${success} | فشل: ${fail}`, fail ? "error" : "success");
    } finally {
      setButtonLoading(refs.analyzeBatchBtn, false);
      renderFileQueue();
    }
  }

  function removeQueueItem(itemId) {
    const index = state.uploadQueue.findIndex(function (item) { return item.id === itemId; });
    if (index === -1) return;
    const item = state.uploadQueue[index];
    if (item.status === "processing") {
      setStatus(refs.batchStatus, "لا يمكن حذف ملف قيد المعالجة. ألغِ المعالجة أولاً.", "error");
      return;
    }
    if (item.previewUrl) {
      URL.revokeObjectURL(item.previewUrl);
    }
    state.uploadQueue.splice(index, 1);
    renderFileQueue();
  }

  function handleQueueActions(event) {
    const target = event.target;
    if (!target || !target.closest) return;
    const button = target.closest("[data-action]");
    if (!button) return;
    const action = button.getAttribute("data-action");
    const itemId = button.getAttribute("data-id");
    const item = state.uploadQueue.find(function (entry) { return entry.id === itemId; });
    if (!item) return;

    if (action === "cancel") {
      item.aborted = true;
      item.status = "cancelled";
      item.message = "تم إلغاء الملف.";
      renderFileQueue();
      return;
    }

    if (action === "resume") {
      item.aborted = false;
      item.status = "queued";
      item.progress = 0;
      item.message = "بانتظار المعالجة";
      renderFileQueue();
      return;
    }

    if (action === "use") {
      extractQueueItemTextToEditor(item);
      return;
    }

    if (action === "remove") {
      removeQueueItem(item.id);
    }
  }

  function getFirstReadyFileFromQueueOrInput() {
    const fromQueue = state.uploadQueue.find(function (item) {
      return item.extractedText && item.status === "done";
    });
    if (fromQueue) return fromQueue;

    const pendingQueueItem = state.uploadQueue.find(function (item) {
      return item.status === "queued" || item.status === "error" || item.status === "cancelled";
    });
    if (pendingQueueItem) {
      pendingQueueItem.status = "queued";
      pendingQueueItem.aborted = false;
      pendingQueueItem.progress = Math.min(5, Number(pendingQueueItem.progress || 0));
      pendingQueueItem.message = "بانتظار المعالجة";
      return pendingQueueItem;
    }

    const picked = refs.reportFile && refs.reportFile.files ? refs.reportFile.files[0] : null;
    if (!picked) return null;

    const item = createQueueItem(picked);
    state.uploadQueue.unshift(item);
    renderFileQueue();
    return item;
  }

  async function handleExtractFile() {
    const existingItem = getFirstReadyFileFromQueueOrInput();
    if (!existingItem) {
      setStatus(refs.fileStatus, "أضف ملفاً واحداً على الأقل ثم أعد المحاولة.", "error");
      return;
    }

    if (existingItem.extractedText && existingItem.status === "done") {
      extractQueueItemTextToEditor(existingItem);
      return;
    }

    setButtonLoading(refs.extractFileBtn, true, "جاري قراءة الملف...");
    setStatus(refs.fileStatus, `جاري استخراج النص من الملف: ${existingItem.name}`, "");
    try {
      await processQueueItem(existingItem);
      if (!existingItem.extractedText) {
        throw new Error(existingItem.message || "تعذر استخراج نص كافٍ من الملف.");
      }
      extractQueueItemTextToEditor(existingItem);
      setStatus(
        refs.fileStatus,
        `تم استخراج النص من الملف (${existingItem.name}) بنجاح. الطول المستخدم: ${existingItem.extractedText.length} حرف.`,
        "success"
      );
    } catch (error) {
      setStatus(refs.fileStatus, toFriendlyError(error, "تعذر استخراج النص من الملف حالياً."), "error");
    } finally {
      setButtonLoading(refs.extractFileBtn, false);
      renderFileQueue();
    }
  }

  function resolveStorageUploadUrl(fileName) {
    const provider = state.storageProvider || "none";
    const endpoint = String(state.storageEndpoint || "").trim();
    if (!endpoint || provider === "none") {
      throw new Error("إعدادات التخزين غير مكتملة. احفظ مزود التخزين والرابط أولاً.");
    }

    if (provider === "s3") {
      if (endpoint.includes("{filename}")) {
        return endpoint.replace("{filename}", encodeURIComponent(fileName));
      }
      if (/X-Amz-|Signature|Expires|AWSAccessKeyId/i.test(endpoint)) {
        return endpoint;
      }
      return endpoint.endsWith("/")
        ? `${endpoint}${encodeURIComponent(fileName)}`
        : `${endpoint}/${encodeURIComponent(fileName)}`;
    }

    if (provider === "firebase") {
      const separator = endpoint.includes("?") ? "&" : "?";
      const hasName = /(^|[?&])name=/.test(endpoint);
      const baseUrl = hasName ? endpoint : `${endpoint}${separator}name=${encodeURIComponent(fileName)}`;
      return /uploadType=/.test(baseUrl) ? baseUrl : `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}uploadType=media`;
    }

    throw new Error("مزود التخزين غير مدعوم.");
  }

  async function uploadItemToStorage(item) {
    if (!item || !item.file) throw new Error("الملف غير متاح للرفع.");
    const url = resolveStorageUploadUrl(item.file.name);
    const headers = {};
    if (item.file.type) headers["Content-Type"] = item.file.type;
    if (state.storageToken) headers.Authorization = `Bearer ${state.storageToken}`;

    const method = state.storageProvider === "s3" ? "PUT" : "POST";
    const response = await fetchWithTimeout(
      url,
      {
        method,
        headers,
        body: item.file,
      },
      Math.max(API_TIMEOUT_MS, 90000)
    );

    if (!response.ok) {
      const text = await response.text().catch(function () {
        return "";
      });
      throw new Error(text || "فشل رفع الملف إلى التخزين السحابي.");
    }

    return url;
  }

  function handleSaveStorage() {
    saveStorageConfig();
    if ((state.storageProvider || "none") === "none") {
      setStatus(refs.storageStatus, "تم حفظ الوضع بدون تخزين سحابي.", "success");
      return;
    }
    if (!state.storageEndpoint) {
      setStatus(refs.storageStatus, "أدخل رابط رفع صحيح ثم أعد الحفظ.", "error");
      return;
    }
    setStatus(
      refs.storageStatus,
      `تم حفظ إعداد التخزين (${state.storageProvider === "s3" ? "AWS S3" : "Firebase"}).`,
      "success"
    );
  }

  async function handleUploadStorage() {
    saveStorageConfig();

    if ((state.storageProvider || "none") === "none") {
      setStatus(refs.storageStatus, "اختر مزود تخزين أولاً.", "error");
      return;
    }

    const ready = state.uploadQueue.filter(function (item) {
      return item.status === "done" && item.file;
    });

    if (!ready.length) {
      setStatus(refs.storageStatus, "لا توجد ملفات مكتملة لرفعها.", "error");
      return;
    }

    setButtonLoading(refs.uploadStorageBtn, true, "جاري الرفع...");
    setStatus(refs.storageStatus, `بدء رفع ${ready.length} ملف إلى التخزين السحابي...`, "");

    let success = 0;
    let fail = 0;
    for (const item of ready) {
      try {
        const storageUrl = await uploadItemToStorage(item);
        item.storageUrl = storageUrl;
        success += 1;
        updateQueueItem(item, { message: "تم الرفع إلى التخزين السحابي بنجاح." });
      } catch (error) {
        fail += 1;
        updateQueueItem(item, { message: toFriendlyError(error, "فشل رفع الملف.") });
      }
    }

    setStatus(
      refs.storageStatus,
      `اكتمل الرفع. نجاح: ${success} | فشل: ${fail}`,
      fail ? "error" : "success"
    );
    setButtonLoading(refs.uploadStorageBtn, false);
    renderFileQueue();
  }

  function renderAgentResult(result) {
    if (!refs.agentResult) return;
    if (!result || typeof result !== "object") {
      refs.agentResult.innerHTML = "<p>لا توجد مخرجات من الوكيل حالياً.</p>";
      return;
    }

    const actions = asArray(result.actions || result.recommendations || []);
    const risks = asArray(result.risks || []);
    const kpis = asArray(result.kpis || []);

    refs.agentResult.innerHTML = `
      <div class="result-item">
        <strong>الملخص التنفيذي</strong>
        <div>${escapeHtml(String(result.summary || result.executiveSummary || "لا يوجد ملخص."))}</div>
      </div>
      <div class="result-item" style="margin-top:10px;">
        <strong>إجراءات موصى بها</strong>
        <ul class="mini-list">
          ${
            actions.length
              ? actions
                  .slice(0, 8)
                  .map(function (row) {
                    if (typeof row === "string") return `<li>${escapeHtml(row)}</li>`;
                    return `<li><strong>${escapeHtml(String(row.priority || "أولوية"))}</strong> - ${escapeHtml(String(row.action || row.text || ""))}</li>`;
                  })
                  .join("")
              : "<li>لا توجد إجراءات كافية حالياً.</li>"
          }
        </ul>
      </div>
      <div class="result-grid" style="margin-top:10px;">
        <div class="result-item">
          <strong>المخاطر</strong>
          <ul class="mini-list">
            ${
              risks.length
                ? risks
                    .slice(0, 6)
                    .map(function (risk) {
                      if (typeof risk === "string") return `<li>${escapeHtml(risk)}</li>`;
                      return `<li>${escapeHtml(String(risk.message || risk.text || ""))}</li>`;
                    })
                    .join("")
                : "<li>لا توجد مخاطر مذكورة.</li>"
            }
          </ul>
        </div>
        <div class="result-item">
          <strong>مؤشرات الأداء</strong>
          <ul class="mini-list">
            ${
              kpis.length
                ? kpis
                    .slice(0, 6)
                    .map(function (kpi) {
                      if (typeof kpi === "string") return `<li>${escapeHtml(kpi)}</li>`;
                      return `<li>${escapeHtml(String(kpi.name || "مؤشر"))}: ${escapeHtml(String(kpi.value || ""))}</li>`;
                    })
                    .join("")
                : "<li>لا توجد مؤشرات إضافية.</li>"
            }
          </ul>
        </div>
      </div>
    `;
  }

  async function handleMedicalAgent() {
    const question = refs.agentQuestion ? refs.agentQuestion.value.trim() : "";
    if (!question || question.length < 8) {
      setStatus(refs.agentStatus, "اكتب سؤالاً تنفيذياً واضحاً لا يقل عن 8 أحرف.", "error");
      return;
    }

    const batchSummary = summarizeQueue();
    if (!state.records.length && !batchSummary.done) {
      setStatus(refs.agentStatus, "شغّل التحليل أو معالجة الدفعة أولاً قبل تشغيل الوكيل.", "error");
      return;
    }

    setButtonLoading(refs.agentBtn, true, "جاري تشغيل الوكيل...");
    setStatus(refs.agentStatus, "يجري تحليل السؤال عبر Gemini Flash...", "");

    try {
      const data = await postBackendJson(API_AGENT_PATH, {
        question,
        records: state.records,
        hospitalProfile: getHospitalProfile(),
        batchReport: batchSummary,
      });
      renderAgentResult(data.result || {});
      setStatus(
        refs.agentStatus,
        `تم توليد توصيات الوكيل الذكي بنجاح عبر ${data.model || "Gemini Flash"}.`,
        "success"
      );
    } catch (error) {
      setStatus(refs.agentStatus, toFriendlyError(error, "تعذر تشغيل الوكيل الذكي حالياً."), "error");
    } finally {
      setButtonLoading(refs.agentBtn, false);
    }
  }

  function normalizeDate(dateLike) {
    const value = String(dateLike || "").trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function normalizeGenderValue(value) {
    const v = String(value || "").toLowerCase();
    if (v.includes("ذكر") || v === "male" || v.includes("man")) return "male";
    if (v.includes("أنث") || v === "female" || v.includes("woman")) return "female";
    return "unknown";
  }

  function makeSafeIdentifier(input, fallback) {
    const base = String(input || "").replace(/[^a-zA-Z0-9\-]/g, "").slice(0, 32);
    if (base) return base;
    return fallback;
  }

  function toIsoDateTimeCompact(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const h = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const s = String(date.getSeconds()).padStart(2, "0");
    return `${y}${m}${d}${h}${mm}${s}`;
  }

  function buildFhirBundle(record) {
    const rec = record && typeof record === "object" ? record : {};
    const patient = rec.patient && typeof rec.patient === "object" ? rec.patient : {};
    const encounter = rec.encounter && typeof rec.encounter === "object" ? rec.encounter : {};
    const summary = rec.summary && typeof rec.summary === "object" ? rec.summary : {};
    const diagnoses = normalizeDiagnoses(rec.diagnoses);
    const medications = normalizeMedicationList(rec.medications);
    const labs = normalizeLabs(rec.labs);

    const recordId = makeSafeIdentifier(rec.recordId || "", `rec${Date.now()}`);
    const patientId = makeSafeIdentifier(patient.medicalRecordNumber || patient.name || "", `pat-${recordId}`);
    const encounterId = `enc-${recordId}`;

    const resources = [];

    resources.push({
      resourceType: "Patient",
      id: patientId,
      active: true,
      name: [{ text: patient.name || "غير معروف" }],
      gender: normalizeGenderValue(patient.gender),
      birthDate: patient.age ? undefined : undefined,
      extension: [
        {
          url: "https://brightai.site/fhir/StructureDefinition/patient-age",
          valueInteger: Number(patient.age) || null,
        },
        {
          url: "https://brightai.site/fhir/StructureDefinition/patient-city",
          valueString: patient.city || null,
        },
      ],
    });

    resources.push({
      resourceType: "Encounter",
      id: encounterId,
      status: "finished",
      class: { system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "AMB" },
      subject: { reference: `Patient/${patientId}` },
      period: {
        start: `${normalizeDate(encounter.date || rec.capturedAt)}T00:00:00+03:00`,
      },
      serviceProvider: {
        display: patient.hospital || rec.sourceHospital || "مستشفى سعودي",
      },
    });

    diagnoses.forEach(function (diag, index) {
      resources.push({
        resourceType: "Condition",
        id: `cond-${recordId}-${index + 1}`,
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: diag.status === "history" ? "inactive" : "active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-ver-status",
              code: diag.certainty === "suspected" ? "provisional" : "confirmed",
            },
          ],
        },
        code: { text: diag.name },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
      });
    });

    medications.forEach(function (med, index) {
      resources.push({
        resourceType: "MedicationStatement",
        id: `med-${recordId}-${index + 1}`,
        status: "active",
        subject: { reference: `Patient/${patientId}` },
        medicationCodeableConcept: { text: med.name },
        dosage: [
          {
            text: [med.dose, med.frequency].filter(Boolean).join(" - ") || med.name,
          },
        ],
      });
    });

    labs.forEach(function (lab, index) {
      resources.push({
        resourceType: "Observation",
        id: `obs-${recordId}-${index + 1}`,
        status: "final",
        code: { text: lab.name },
        subject: { reference: `Patient/${patientId}` },
        encounter: { reference: `Encounter/${encounterId}` },
        valueString: [lab.value, lab.unit].filter(Boolean).join(" ") || "غير متوفر",
        interpretation: lab.status
          ? [
              {
                text: lab.status,
              },
            ]
          : undefined,
      });
    });

    resources.push({
      resourceType: "CarePlan",
      id: `care-${recordId}`,
      status: "active",
      intent: "plan",
      subject: { reference: `Patient/${patientId}` },
      description: summary.plan || summary.nextStep || rec.summary || "خطة متابعة سريرية",
    });

    return {
      resourceType: "Bundle",
      type: "collection",
      timestamp: new Date().toISOString(),
      identifier: {
        system: "https://brightai.site/medical-archive",
        value: recordId,
      },
      entry: resources.map(function (resource) {
        return {
          fullUrl: `urn:uuid:${resource.id}`,
          resource,
        };
      }),
    };
  }

  function csvEscape(value) {
    const text = String(value == null ? "" : value);
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  function buildCsv(records) {
    const headers = [
      "record_id",
      "patient_name",
      "patient_age",
      "patient_gender",
      "hospital",
      "city",
      "diagnoses",
      "medications",
      "alerts",
      "summary_problem",
      "summary_plan",
      "captured_at",
    ];

    const rows = records.map(function (record) {
      const patient = record.patient && typeof record.patient === "object" ? record.patient : {};
      const summary = record.summary && typeof record.summary === "object" ? record.summary : {};
      const diagnoses = normalizeTextList(record.diagnoses).join(" | ");
      const medications = normalizeMedicationList(record.medications)
        .map(function (m) {
          return [m.name, m.dose, m.frequency].filter(Boolean).join(" ");
        })
        .join(" | ");
      const alerts = normalizeTextList(record.alerts).join(" | ");

      return [
        record.recordId || "",
        patient.name || "",
        patient.age != null ? String(patient.age) : "",
        patient.gender || "",
        patient.hospital || record.sourceHospital || "",
        patient.city || "",
        diagnoses,
        medications,
        alerts,
        summary.problem || "",
        summary.plan || "",
        record.capturedAt || record.savedAt || "",
      ].map(csvEscape).join(",");
    });

    return `${headers.join(",")}\n${rows.join("\n")}`;
  }

  function buildHl7(record) {
    const rec = record && typeof record === "object" ? record : {};
    const patient = rec.patient && typeof rec.patient === "object" ? rec.patient : {};
    const summary = rec.summary && typeof rec.summary === "object" ? rec.summary : {};
    const diagnoses = normalizeTextList(rec.diagnoses);
    const medications = normalizeMedicationList(rec.medications);

    const now = new Date();
    const ts = toIsoDateTimeCompact(now);
    const patientName = (patient.name || "غير معروف").replace(/\s+/g, "^");
    const pid = `PID|1||${patient.medicalRecordNumber || rec.recordId || ""}||${patientName}||${normalizeDate(
      rec.capturedAt
    ).replace(/-/g, "")}|${normalizeGenderValue(patient.gender)}|||${patient.city || ""}`;

    const dg1Lines = diagnoses.length
      ? diagnoses.map(function (diag, i) {
          return `DG1|${i + 1}||${diag}||||A`;
        })
      : ["DG1|1||NO_DIAGNOSIS||||A"];

    const rxeLines = medications.length
      ? medications.map(function (med, i) {
          return `RXE|${i + 1}|${med.name}|${med.dose || ""}|${med.frequency || ""}`;
        })
      : ["RXE|1|NO_MEDICATION||"];

    const note = `NTE|1||${(summary.problem || "")} ${(summary.plan || "")}`.trim();

    const segments = [
      `MSH|^~\\&|BRIGHTAI|MEDARCHIVE|EHR|HOSPITAL|${ts}||ORU^R01|${rec.recordId || ts}|P|2.5`,
      pid,
      `PV1|1|O|${patient.hospital || rec.sourceHospital || ""}|${rec.encounter && rec.encounter.department ? rec.encounter.department : ""}`,
    ]
      .concat(dg1Lines)
      .concat(rxeLines)
      .concat([note]);

    return segments.join("\r\n");
  }

  function downloadTextFile(fileName, mimeType, content) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  function getRecordForExport() {
    if (state.lastExtract) {
      return state.lastExtract;
    }
    if (state.records.length) {
      return state.records[state.records.length - 1];
    }
    return null;
  }

  function handleExportFhir() {
    const record = getRecordForExport();
    if (!record) {
      setStatus(refs.exportStatus, "لا يوجد سجل للتصدير. حلل تقريراً أولاً.", "error");
      return;
    }

    const bundle = buildFhirBundle(record);
    const name = `medical-fhir-${record.recordId || Date.now()}.json`;
    downloadTextFile(name, "application/fhir+json;charset=utf-8", JSON.stringify(bundle, null, 2));
    setStatus(refs.exportStatus, "تم تصدير ملف FHIR JSON بنجاح.", "success");
  }

  function handleExportCsv() {
    const records = state.records.length ? state.records : state.lastExtract ? [state.lastExtract] : [];
    if (!records.length) {
      setStatus(refs.exportStatus, "لا توجد بيانات للتصدير. حلل تقريراً أولاً.", "error");
      return;
    }

    const csv = buildCsv(records);
    downloadTextFile("medical-archive-ehr.csv", "text/csv;charset=utf-8", csv);
    setStatus(refs.exportStatus, "تم تصدير CSV بنجاح.", "success");
  }

  function handleExportHl7() {
    const record = getRecordForExport();
    if (!record) {
      setStatus(refs.exportStatus, "لا يوجد سجل للتصدير. حلل تقريراً أولاً.", "error");
      return;
    }

    const hl7 = buildHl7(record);
    const name = `medical-hl7-${record.recordId || Date.now()}.hl7`;
    downloadTextFile(name, "text/plain;charset=utf-8", hl7);
    setStatus(refs.exportStatus, "تم تصدير HL7 بنجاح.", "success");
  }

  function handleExportArchiveNdjson() {
    if (!state.records.length) {
      setStatus(refs.exportStatus, "لا توجد سجلات محفوظة لتصديرها.", "error");
      return;
    }

    const lines = state.records.map(function (record) {
      return JSON.stringify(buildFhirBundle(record));
    });

    downloadTextFile("medical-archive-fhir.ndjson", "application/x-ndjson;charset=utf-8", lines.join("\n"));
    setStatus(refs.exportStatus, "تم تصدير جميع السجلات بصيغة NDJSON بنجاح.", "success");
  }

  function loadSample(sampleKey) {
    const sampleText = SAMPLE_REPORTS[sampleKey];
    if (!sampleText || !refs.reportInput) return;
    refs.reportInput.value = sampleText;
    setStatus(refs.extractStatus, "تم تحميل تقرير نموذجي. يمكنك التعديل ثم بدء التحليل.", "success");
  }

  function handleLead() {
    const hospital = refs.leadHospital ? refs.leadHospital.value.trim() : "";
    const name = refs.leadName ? refs.leadName.value.trim() : "";
    const phone = refs.leadPhone ? refs.leadPhone.value.trim() : "";

    if (!hospital || !name || !phone) {
      setStatus(refs.leadStatus, "أدخل اسم المستشفى واسم المسؤول ورقم التواصل.", "error");
      return;
    }

    const currentProfile = getHospitalProfile();
    const message = [
      "مرحباً فريق Bright AI",
      "أرغب بتفعيل تجربة نظام الأرشيف الطبي الذكي للمستشفى.",
      `اسم المستشفى: ${hospital}`,
      `اسم المسؤول: ${name}`,
      `رقم التواصل: ${phone}`,
      `المدينة: ${currentProfile.city || "غير محدد"}`,
      `القسم: ${currentProfile.department || "غير محدد"}`,
      `عدد السجلات المجربة حالياً: ${state.records.length}`,
    ].join("\n");

    const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(link, "_blank", "noopener,noreferrer");
    setStatus(refs.leadStatus, "تم فتح واتساب وإعداد رسالة طلب التجربة للمستشفى.", "success");
  }

  function updateConnectionSummary(message, type) {
    setStatus(refs.connectionStatus, message, type);
  }

  function handleSaveConnection() {
    saveConnectionConfig();
    if (!state.apiBase && !hasDirectGroqConfig()) {
      updateConnectionSummary(
        "لم يتم إدخال API Base أو مفتاح Groq. أدخل أحدهما على الأقل ثم اختبر الاتصال.",
        "error"
      );
      return;
    }

    if (hasDirectGroqConfig()) {
      updateConnectionSummary(
        "تم حفظ الإعدادات. مسار مباشر Groq مفعل كاحتياطي بالإضافة إلى API Base.",
        "success"
      );
      return;
    }

    updateConnectionSummary(
      "تم حفظ إعدادات API Base. إذا كان الخادم غير متاح يمكنك إضافة مفتاح Groq كمسار مباشر.",
      "success"
    );
  }

  async function handleTestConnection() {
    saveConnectionConfig();
    setButtonLoading(refs.testConnectionBtn, true, "جاري اختبار الاتصال...");
    updateConnectionSummary("يتم الآن اختبار الاتصال بالخادم أو Groq المباشر...", "");

    try {
      const status = await preflightApiConnection();

      if (status.mode === "backend") {
        updateConnectionSummary(`نجح الاتصال بخادم BrightAI على: ${status.base}`, "success");
      } else if (status.mode === "direct") {
        updateConnectionSummary("الخادم غير متاح، وتم تفعيل وضع Groq المباشر بنجاح.", "success");
      } else {
        updateConnectionSummary(
          "فشل اختبار الاتصال. أدخل API Base صحيح أو أضف مفتاح Groq مباشر.",
          "error"
        );
      }
    } catch (error) {
      updateConnectionSummary(toFriendlyError(error, "تعذر اختبار الاتصال حالياً."), "error");
    } finally {
      setButtonLoading(refs.testConnectionBtn, false);
    }
  }

  function bindEvents() {
    if (refs.analyzeBtn) {
      refs.analyzeBtn.addEventListener("click", handleAnalyze);
    }

    if (refs.saveRecordBtn) {
      refs.saveRecordBtn.addEventListener("click", handleSaveRecord);
    }

    if (refs.searchBtn) {
      refs.searchBtn.addEventListener("click", handleSearch);
    }

    if (refs.searchQuery) {
      refs.searchQuery.addEventListener("input", handleQuickTypingSearch);
      refs.searchQuery.addEventListener("focus", function () {
        const suggestions = collectQuickSuggestions(refs.searchQuery.value || "");
        renderSearchSuggestions(suggestions);
      });
      refs.searchQuery.addEventListener("blur", function () {
        setTimeout(function () { renderSearchSuggestions([]); }, 120);
      });
    }

    if (refs.searchSuggestions) {
      refs.searchSuggestions.addEventListener("click", handleSuggestionClick);
    }

    if (refs.voiceSearchBtn) {
      refs.voiceSearchBtn.addEventListener("click", handleVoiceSearchDirect);
    }

    if (refs.voiceFileBtn) {
      refs.voiceFileBtn.addEventListener("click", triggerVoiceFilePicker);
    }

    if (refs.voiceFileInput) {
      refs.voiceFileInput.addEventListener("change", handleVoiceFileInputChange);
    }

    if (refs.imageSearchBtn) {
      refs.imageSearchBtn.addEventListener("click", triggerImageSearchPicker);
    }

    if (refs.imageSearchInput) {
      refs.imageSearchInput.addEventListener("change", handleImageSearchInputChange);
    }

    if (refs.applyFiltersBtn) {
      refs.applyFiltersBtn.addEventListener("click", handleApplyFilters);
    }

    if (refs.saveSearchBtn) {
      refs.saveSearchBtn.addEventListener("click", handleSaveCurrentSearch);
    }

    if (refs.loadSavedSearchBtn) {
      refs.loadSavedSearchBtn.addEventListener("click", handleLoadSavedSearch);
    }

    if (refs.searchPrevPageBtn) {
      refs.searchPrevPageBtn.addEventListener("click", handleSearchPrevPage);
    }

    if (refs.searchNextPageBtn) {
      refs.searchNextPageBtn.addEventListener("click", handleSearchNextPage);
    }

    if (refs.exportSearchCsvBtn) {
      refs.exportSearchCsvBtn.addEventListener("click", handleExportSearchCsv);
    }

    if (refs.exportSearchExcelBtn) {
      refs.exportSearchExcelBtn.addEventListener("click", handleExportSearchExcel);
    }

    if (refs.exportSearchPdfBtn) {
      refs.exportSearchPdfBtn.addEventListener("click", handleExportSearchPdf);
    }

    [
      refs.searchEngineProvider,
      refs.searchEngineEndpoint,
      refs.searchEngineIndex,
      refs.searchEngineApiKey,
      refs.searchEngineAppId,
    ].forEach(function (input) {
      if (!input) return;
      input.addEventListener("change", saveSearchEngineConfig);
      input.addEventListener("blur", saveSearchEngineConfig);
    });

    if (refs.insightsBtn) {
      refs.insightsBtn.addEventListener("click", handleInsights);
    }

    if (refs.extractFileBtn) {
      refs.extractFileBtn.addEventListener("click", handleExtractFile);
    }

    if (refs.processBatchBtn) {
      refs.processBatchBtn.addEventListener("click", runBatchProcessing);
    }

    if (refs.cancelBatchBtn) {
      refs.cancelBatchBtn.addEventListener("click", handleCancelBatch);
    }

    if (refs.resumeBatchBtn) {
      refs.resumeBatchBtn.addEventListener("click", handleResumeBatch);
    }

    if (refs.analyzeBatchBtn) {
      refs.analyzeBatchBtn.addEventListener("click", analyzeReadyQueueItems);
    }

    if (refs.pickFilesBtn) {
      refs.pickFilesBtn.addEventListener("click", pickFiles);
    }

    if (refs.pickFolderBtn) {
      refs.pickFolderBtn.addEventListener("click", pickFolder);
    }

    if (refs.reportFile) {
      refs.reportFile.addEventListener("change", handleFilesSelected);
    }

    if (refs.reportFolder) {
      refs.reportFolder.addEventListener("change", handleFilesSelected);
    }

    if (refs.fileQueue) {
      refs.fileQueue.addEventListener("click", handleQueueActions);
    }

    if (refs.dropZone) {
      refs.dropZone.addEventListener("dragenter", function (event) {
        event.preventDefault();
        setDropZoneState(true);
      });
      refs.dropZone.addEventListener("dragover", function (event) {
        event.preventDefault();
        setDropZoneState(true);
      });
      refs.dropZone.addEventListener("dragleave", function () {
        setDropZoneState(false);
      });
      refs.dropZone.addEventListener("drop", function (event) {
        event.preventDefault();
        setDropZoneState(false);
        const files = event.dataTransfer ? event.dataTransfer.files : [];
        addFilesToQueue(files);
      });
      refs.dropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pickFiles();
        }
      });
    }

    if (refs.saveStorageBtn) {
      refs.saveStorageBtn.addEventListener("click", handleSaveStorage);
    }

    if (refs.uploadStorageBtn) {
      refs.uploadStorageBtn.addEventListener("click", handleUploadStorage);
    }

    if (refs.agentBtn) {
      refs.agentBtn.addEventListener("click", handleMedicalAgent);
    }

    if (refs.exportFhirBtn) {
      refs.exportFhirBtn.addEventListener("click", handleExportFhir);
    }

    if (refs.exportCsvBtn) {
      refs.exportCsvBtn.addEventListener("click", handleExportCsv);
    }

    if (refs.exportHl7Btn) {
      refs.exportHl7Btn.addEventListener("click", handleExportHl7);
    }

    if (refs.exportArchiveFhirBtn) {
      refs.exportArchiveFhirBtn.addEventListener("click", handleExportArchiveNdjson);
    }

    if (refs.saveConnectionBtn) {
      refs.saveConnectionBtn.addEventListener("click", handleSaveConnection);
    }

    if (refs.testConnectionBtn) {
      refs.testConnectionBtn.addEventListener("click", handleTestConnection);
    }

    if (refs.leadBtn) {
      refs.leadBtn.addEventListener("click", handleLead);
    }

    refs.sampleButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const sample = button.getAttribute("data-sample");
        loadSample(sample);
      });
    });
  }

  function init() {
    configurePdfWorker();
    applySavedConnectionConfig();
    bindEvents();
    renderExtractResult(null);
    renderSavedRecords();
    renderFileQueue();
    renderQueueReport();
    renderBatchSummary();
    renderSearchSuggestions([]);
    renderSearchStats(null);
    renderSearchClusters([], {});
    renderSavedSearchOptions();
    updateCounters();
    loadSample("diabetes");

    if (refs.storageProvider && state.storageProvider) {
      refs.storageProvider.value = state.storageProvider;
    }
    if (refs.storageEndpoint && state.storageEndpoint) {
      refs.storageEndpoint.value = state.storageEndpoint;
    }
    if (refs.storageToken && state.storageToken) {
      refs.storageToken.value = state.storageToken;
    }

    if ((state.storageProvider || "none") !== "none") {
      setStatus(refs.storageStatus, `إعداد التخزين المحفوظ: ${state.storageProvider}`, "success");
    }

    if (refs.searchEngineProvider && state.searchProvider) {
      refs.searchEngineProvider.value = state.searchProvider;
    }
    if (refs.searchEngineEndpoint && state.searchEndpoint) {
      refs.searchEngineEndpoint.value = state.searchEndpoint;
    }
    if (refs.searchEngineIndex && state.searchIndex) {
      refs.searchEngineIndex.value = state.searchIndex;
    }
    if (refs.searchEngineApiKey && state.searchApiKey) {
      refs.searchEngineApiKey.value = state.searchApiKey;
    }
    if (refs.searchEngineAppId && state.searchAppId) {
      refs.searchEngineAppId.value = state.searchAppId;
    }

    preflightApiConnection().then(function (status) {
      if (status.mode === "backend") {
        setStatus(refs.extractStatus, "الخدمة جاهزة. يمكنك تحليل التقرير عبر Groq الآن.", "success");
        updateConnectionSummary(`متصل بخادم BrightAI: ${status.base}`, "success");
        return;
      }

      if (status.mode === "direct") {
        setStatus(
          refs.extractStatus,
          "الخادم غير متاح، لكن وضع Groq المباشر مفعل ويمكنك التحليل الآن.",
          "success"
        );
        updateConnectionSummary("وضع Groq المباشر مفعل. سيتم التحليل بدون خادم محلي.", "success");
        return;
      }

      setStatus(
        refs.extractStatus,
        "تنبيه: لا يوجد اتصال بالخادم ولا إعداد مباشر لـ Groq. راجع قسم إعداد الاتصال أعلى الصفحة.",
        "error"
      );
      updateConnectionSummary(
        "لا يوجد اتصال صالح حالياً. أدخل API Base صحيح أو أضف مفتاح Groq ثم اضغط اختبار الاتصال.",
        "error"
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
