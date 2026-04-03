    const EMBEDDED_DATA = [
      { date: "08/02/2026", code: "BU-444-1005", name: "2-WAY FOLEY CATHETER 100% PURE SILICONE SIZE CH10", produced: 843, rejected: 6, pct: 0.71 },
      { date: "09/02/2026", code: "BU-214-SLMS", name: "CONNECTOR SIMS 5-10MM", produced: 19500, rejected: 46, pct: 0.24 },
      { date: "09/02/2026", code: "BU-442-1815", name: "2-WAY FOLEY CATHETER LATEX SILICONE COATED SIZE-18", produced: 1000, rejected: 44, pct: 4.4 },
      { date: "09/02/2026", code: "BU-681-1435", name: "ENDOTRACHEAL TUBE NASAL PREFORMED CUFFED FR14 ID3.5MM", produced: 429, rejected: 2, pct: 0.47 },
      { date: "09/02/2026", code: "BU-056-12PD", name: "PENROSE DRAINAGE TUBE 1/2x12", produced: 12700, rejected: 188, pct: 1.48 },
      { date: "09/02/2026", code: "BU-681-2050", name: "ENDOTRACHEAL TUBE NASAL PREFORMED CUFFED FR20 ID5.0MM", produced: 300, rejected: 1, pct: 0.33 },
      { date: "10/02/2026", code: "BU-501-3485", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR34 ID8.5MM", produced: 100, rejected: 1, pct: 1.0 },
      { date: "10/02/2026", code: "BU-681-1435", name: "ENDOTRACHEAL TUBE NASAL PREFORMED CUFFED FR14 ID3.5MM", produced: 500, rejected: 2, pct: 0.4 },
      { date: "10/02/2026", code: "BU-506-2870T", name: "ENDOTRACHEAL TUBE PVC TAPERED CUFF SUBGLOTTIC SUCTION 7.0MM", produced: 800, rejected: 2, pct: 0.25 },
      { date: "10/02/2026", code: "BU-056-12PD", name: "PENROSE DRAINAGE TUBE 1/2x12", produced: 8000, rejected: 32, pct: 0.4 },
      { date: "10/02/2026", code: "BU-175-20ML", name: "ORAL MEDICATION SYRINGE 20ML AMBER", produced: 7000, rejected: 3, pct: 0.04 },
      { date: "11/02/2026", code: "BU-506-2870T", name: "ENDOTRACHEAL TUBE PVC TAPERED CUFF SUBGLOTTIC SUCTION 7.0MM", produced: 800, rejected: 1, pct: 0.13 },
      { date: "11/02/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 265, rejected: 4, pct: 1.51 },
      { date: "12/02/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 400, rejected: 25, pct: 6.25 },
      { date: "12/02/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 360, rejected: 9, pct: 2.5 },
      { date: "14/02/2026", code: "BU-183-0000", name: "SYRINGE LUER LOCK 60ML WITHOUT NEEDLE", produced: 18900, rejected: 21, pct: 0.11 },
      { date: "14/02/2026", code: "BU-183-0000", name: "SYRINGE LUER LOCK 60ML WITHOUT NEEDLE", produced: 18900, rejected: 19, pct: 0.1 },
      { date: "17/02/2026", code: "BU-501-2870", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR28 ID7.0MM", produced: 1600, rejected: 3, pct: 0.19 },
      { date: "17/02/2026", code: "BU-428-0100", name: "IV GIVING SET 100ML BURETTE 60 DROP", produced: 800, rejected: 1, pct: 0.13 },
      { date: "18/02/2026", code: "BU-506-2665T", name: "ENDOTRACHEAL TUBE PVC TAPERED CUFF SUBGLOTTIC SUCTION 6.5MM", produced: 120, rejected: 1, pct: 0.83 },
      { date: "18/02/2026", code: "BU-501-3075", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR30 ID7.5MM", produced: 200, rejected: 2, pct: 1.0 },
      { date: "19/02/2026", code: "BU-442-1215", name: "CATHETER FOLEY 2-WAY LATEX SIZE 12-15ML", produced: 281, rejected: 2, pct: 0.71 },
      { date: "21/02/2026", code: "BU-056-12PD", name: "PENROSE DRAINAGE TUBE 1/2x12", produced: 1000, rejected: 2, pct: 0.2 },
      { date: "21/02/2026", code: "BU-691-3280", name: "ENDOTRACHEAL TUBE ORAL PREFORMED CUFFED FR32 ID8.0MM", produced: 200, rejected: 1, pct: 0.5 },
      { date: "23/02/2026", code: "BU-PS-PS", name: "PACIFIER PREEMIE PREMATURE BABY SMALL", produced: 800, rejected: 13, pct: 1.63 },
      { date: "23/02/2026", code: "BU-PS-NBL", name: "PACIFIER SOOTHER NEWBORN LARGE", produced: 2370, rejected: 17, pct: 0.72 },
      { date: "23/02/2026", code: "SUC-CON-T-180", name: "SUCTION CONNECTING TUBE S/S 180CM", produced: 4205, rejected: 5, pct: 0.12 },
      { date: "23/02/2026", code: "SUC-CON-T-180", name: "SUCTION CONNECTING TUBE S/S 180CM", produced: 3904, rejected: 4, pct: 0.1 },
      { date: "23/02/2026", code: "SUC-CON-T-180", name: "SUCTION CONNECTING TUBE S/S 180CM", produced: 3908, rejected: 8, pct: 0.2 },
      { date: "25/02/2026", code: "BU-421-2138", name: "IV INFUSION SET 210CM WITH Y INJECTION SITE", produced: 2400, rejected: 4, pct: 0.17 },
      { date: "28/02/2026", code: "BU-PS-PS", name: "PACIFIER PREEMIE PREMATURE BABY SMALL", produced: 700, rejected: 5, pct: 0.71 },
      { date: "28/02/2026", code: "BU-PS-PMI", name: "PACIFIER INFANT ORAL REGULAR SIZE 2", produced: 1400, rejected: 8, pct: 0.57 },
      { date: "28/02/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 400, rejected: 5, pct: 1.25 },
      { date: "28/02/2026", code: "BU-112-0550", name: "FEEDING TUBE WITH X-RAY LINE SIZE CH05 50CM", produced: 400, rejected: 3, pct: 0.75 },
      { date: "01/03/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 280, rejected: 5, pct: 1.79 },
      { date: "01/03/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 150, rejected: 6, pct: 4.0 },
      { date: "01/03/2026", code: "BU-442-1615", name: "2-WAY FOLEY CATHETER LATEX SILICONE COATED SIZE-16", produced: 1300, rejected: 13, pct: 1.0 },
      { date: "01/03/2026", code: "BU-PS-PMI", name: "PACIFIER INFANT ORAL REGULAR SIZE 2", produced: 1300, rejected: 5, pct: 0.38 },
      { date: "02/03/2026", code: "BU-112-0550", name: "FEEDING TUBE WITH X-RAY LINE SIZE CH05 50CM", produced: 1500, rejected: 5, pct: 0.33 },
      { date: "02/03/2026", code: "BU-442-1415", name: "CATHETER FOLEY 2-WAY LATEX SIZE 14-15ML", produced: 1300, rejected: 67, pct: 5.15 },
      { date: "02/03/2026", code: "BU-442-1415", name: "CATHETER FOLEY 2-WAY LATEX SIZE 14-15ML", produced: 1000, rejected: 15, pct: 1.5 },
      { date: "04/03/2026", code: "BU-112-0550", name: "FEEDING TUBE WITH X-RAY LINE SIZE CH05 50CM", produced: 1000, rejected: 1, pct: 0.1 },
      { date: "04/03/2026", code: "BU-431-1510", name: "BLOOD TRANSFUSION SET WITH Y INJECTION SITE", produced: 13000, rejected: 15, pct: 0.12 },
      { date: "04/03/2026", code: "BU-112-0550", name: "FEEDING TUBE WITH X-RAY LINE SIZE CH05 50CM", produced: 1000, rejected: 1, pct: 0.1 },
      { date: "05/03/2026", code: "BU-093-1500C", name: "LARYNGEAL MASK AIRWAY HYPER CURVE SIZE 1.5", produced: 200, rejected: 1, pct: 0.5 },
      { date: "05/03/2026", code: "BU-681-18451", name: "ETT PVC SPECIALIST SOFT NASAL CUFF SIZE 4.5MM", produced: 1730, rejected: 1, pct: 0.06 },
      { date: "07/03/2026", code: "BU-093-4000", name: "LARYNGEAL AIRWAY MASK SIZE 4 PVC 50-70KG", produced: 816, rejected: 250, pct: 30.64 },
      { date: "08/03/2026", code: "BU-093-5000", name: "LARYNGEAL AIRWAY MASK SIZE 5 PVC 70-100KG", produced: 330, rejected: 82, pct: 24.85 },
      { date: "09/03/2026", code: "BU-501-3075", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR30 ID7.5MM", produced: 4190, rejected: 2, pct: 0.05 },
      { date: "11/03/2026", code: "BU-501-3075", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR30 ID7.5MM", produced: 820, rejected: 1, pct: 0.12 },
      { date: "11/03/2026", code: "BU-501-3075", name: "ENDOTRACHEAL TUBE ORAL/NASAL CUFFED FR30 ID7.5MM", produced: 2374, rejected: 1, pct: 0.04 },
      { date: "17/03/2026", code: "BU-506-3075T", name: "ENDOTRACHEAL TUBE TAPERED CUFF SUBGLOTTIC SUCTION 7.5MM", produced: 759, rejected: 4, pct: 0.53 },
      { date: "17/03/2026", code: "BU-501-2870C", name: "ENDOTRACHEAL TUBE ORAL/NASAL CONICAL CUFF 7.0MM", produced: 851, rejected: 2, pct: 0.24 },
      { date: "17/03/2026", code: "BU-501-2460C", name: "ENDOTRACHEAL TUBE ORAL/NASAL CONICAL CUFF 6.0MM", produced: 1450, rejected: 2, pct: 0.14 },
      { date: "17/03/2026", code: "BU-506-2870T", name: "ENDOTRACHEAL TUBE PVC TAPERED CUFF SUBGLOTTIC SUCTION 7.0MM", produced: 250, rejected: 1, pct: 0.4 },
      { date: "18/03/2026", code: "BU-501-2460C", name: "ENDOTRACHEAL TUBE ORAL/NASAL CONICAL CUFF 6.0MM", produced: 1703, rejected: 2, pct: 0.12 },
      { date: "18/03/2026", code: "BU-502-2870C", name: "ENDOTRACHEAL TUBE REINFORCED ORAL/NASAL CONICAL CUFF 7.0MM", produced: 1580, rejected: 1, pct: 0.06 },
      { date: "19/03/2026", code: "BU-502-2460C", name: "ENDOTRACHEAL TUBE REINFORCED ORAL/NASAL CONICAL CUFF 6.0MM", produced: 1280, rejected: 11, pct: 0.86 },
      { date: "19/03/2026", code: "BU-506-3075", name: "ENDOTRACHEAL TUBE SUBGLOTTIC SUCTION PORT CUFFED FR30", produced: 300, rejected: 1, pct: 0.33 },
      { date: "22/03/2026", code: "BU-506-2870T", name: "ENDOTRACHEAL TUBE PVC TAPERED CUFF SUBGLOTTIC SUCTION 7.0MM", produced: 200, rejected: 1, pct: 0.5 },
      { date: "22/03/2026", code: "BU-506-2255", name: "ETT SUBGLOTTIC SUCTION PORT SIZE 5.5", produced: 50, rejected: 1, pct: 2.0 },
      { date: "26/03/2026", code: "BU-372-40ML", name: "MUCUS EXTRACTOR SPECIMEN 40ML", produced: 1600, rejected: 4, pct: 0.25 },
      { date: "27/03/2026", code: "BU-372-40ML", name: "MUCUS EXTRACTOR SPECIMEN 40ML", produced: 600, rejected: 1, pct: 0.17 },
      { date: "27/03/2026", code: "BU-372-40ML", name: "MUCUS EXTRACTOR SPECIMEN 40ML", produced: 600, rejected: 1, pct: 0.17 },
      { date: "28/03/2026", code: "BU-372-40ML", name: "MUCUS EXTRACTOR SPECIMEN 40ML", produced: 1400, rejected: 22, pct: 1.57 },
      { date: "30/03/2026", code: "BU-093-1000", name: "LARYNGEAL AIRWAY MASK SIZE 1 PVC", produced: 1082, rejected: 235, pct: 21.72 },
      { date: "30/03/2026", code: "BU-093-1000", name: "LARYNGEAL AIRWAY MASK SIZE 1 PVC", produced: 1082, rejected: 58, pct: 5.36 },
      { date: "30/03/2026", code: "BU-093-1000", name: "LARYNGEAL AIRWAY MASK SIZE 1 PVC", produced: 1082, rejected: 603, pct: 55.73 },
      { date: "30/03/2026", code: "BU-093-1000", name: "LARYNGEAL AIRWAY MASK SIZE 1 PVC", produced: 600, rejected: 400, pct: 66.67 }
    ];

    let RAW_DATA = [];
    let DATA = [];
    let VIEW_DATA = [];
    let LAST_SUMMARY = null;
    let SELECTED_ROW_KEY = "";
    let TABLE_CURSOR_INDEX = 0;
    const PINNED_ITEMS = [];
    const EMBEDDED_CSV_PATH = "/Users/yzydalshmry/Desktop/BRIGHTAI/mais-OBM/Rejection_Slip_Report885853_Saudi_Mais_Co__For_Medical_Products.csv";
    const FILTER_STATE = {
      startDate: "",
      endDate: "",
      codes: [],
      focusDate: "",
      focusWeek: "",
      focusCategory: "",
      search: "",
      quickFilter: "all"
    };
    const TABLE_STATE = {
      sortKey: "rejected",
      sortDir: "desc"
    };
    const sortState = {
      col: null,
      asc: true
    };

    const filepathDisplay = document.getElementById("filepathDisplay");
    const datePeriodBadge = document.getElementById("datePeriodBadge");
    const csvFileInput = document.getElementById("csvFileInput");
    const browseButton = document.getElementById("browseButton");
    const embeddedButton = document.getElementById("embeddedButton");
    const loadingOverlay = document.getElementById("loadingOverlay");
    const startDateFilter = document.getElementById("startDateFilter");
    const endDateFilter = document.getElementById("endDateFilter");
    const codeFilter = document.getElementById("codeFilter");
    const searchFilter = document.getElementById("searchFilter");
    const quickFilterButtons = Array.from(document.querySelectorAll("[data-quick-filter]"));
    const filterPanelButtons = Array.from(document.querySelectorAll("[data-filter-panel]"));
    const filterPanels = Array.from(document.querySelectorAll("[data-filter-panel-id]"));
    const filterStatus = document.getElementById("filterStatus");
    const filterSummary = document.getElementById("filterSummary");
    const resetFiltersButton = document.getElementById("resetFiltersButton");
    const exportCsvButton = document.getElementById("exportCsvButton");
    const exportPdfButton = document.getElementById("exportPdfButton");
    const alertGrid = document.getElementById("alertGrid");
    const stickySummary = document.getElementById("stickySummary");
    const stickyViewLabel = document.getElementById("stickyViewLabel");
    const stickyProduced = document.getElementById("stickyProduced");
    const stickyRejected = document.getElementById("stickyRejected");
    const stickyRate = document.getElementById("stickyRate");
    const stickyRecords = document.getElementById("stickyRecords");
    const metricMeta = document.getElementById("metricMeta");
    const k1 = document.getElementById("k1");
    const k2 = document.getElementById("k2");
    const k3 = document.getElementById("k3");
    const k4 = document.getElementById("k4");
    const k5 = document.getElementById("k5");
    const kd1 = document.getElementById("kd1");
    const kd2 = document.getElementById("kd2");
    const kd3 = document.getElementById("kd3");
    const kd4 = document.getElementById("kd4");
    const kd5 = document.getElementById("kd5");
    const snapshotRange = document.getElementById("snapshotRange");
    const snapshotText = document.getElementById("snapshotText");
    const snapshotList = document.getElementById("snapshotList");
    const trendMeta = document.getElementById("trendMeta");
    const topMeta = document.getElementById("topMeta");
    const rateMeta = document.getElementById("rateMeta");
    const weekMeta = document.getElementById("weekMeta");
    const pieMeta = document.getElementById("pieMeta");
    const trendFocusChip = document.getElementById("trendFocusChip");
    const trendFocusText = document.getElementById("trendFocusText");
    const trendFocusClear = document.getElementById("trendFocusClear");
    const topFocusChip = document.getElementById("topFocusChip");
    const topFocusText = document.getElementById("topFocusText");
    const topFocusClear = document.getElementById("topFocusClear");
    const rateFocusChip = document.getElementById("rateFocusChip");
    const rateFocusText = document.getElementById("rateFocusText");
    const rateFocusClear = document.getElementById("rateFocusClear");
    const weekFocusChip = document.getElementById("weekFocusChip");
    const weekFocusText = document.getElementById("weekFocusText");
    const weekFocusClear = document.getElementById("weekFocusClear");
    const pieFocusChip = document.getElementById("pieFocusChip");
    const pieFocusText = document.getElementById("pieFocusText");
    const pieFocusClear = document.getElementById("pieFocusClear");
    const productBreakdownList = document.getElementById("productBreakdownList");
    const actionQueueList = document.getElementById("actionQueueList");
    const compareMeta = document.getElementById("compareMeta");
    const periodCompareList = document.getElementById("periodCompareList");
    const tableShell = document.getElementById("tableShell");
    const tableMeta = document.getElementById("tableMeta");
    const tblSearch = document.getElementById("tblSearch");
    const tblFilter = document.getElementById("tblFilter");
    const tblCnt = document.getElementById("tblCnt");
    const tblBody = document.getElementById("tblBody");
    const tblHeads = Array.from(document.querySelectorAll("#tableShell thead th[data-col]"));
    const markdownShell = document.getElementById("markdownShell");
    const markdownMeta = document.getElementById("markdownMeta");
    const pinMeta = document.getElementById("pinMeta");
    const pinGrid = document.getElementById("pinGrid");
    const pinSelectedButton = document.getElementById("pinSelectedButton");
    const pinFocusButton = document.getElementById("pinFocusButton");
    const clearPinsButton = document.getElementById("clearPinsButton");
    const recentRange = document.getElementById("recentRange");
    const recentAiStatus = document.getElementById("recentAiStatus");
    const recentNarrative = document.getElementById("recentNarrative");
    const recentCommentList = document.getElementById("recentCommentList");
    const recentTrendMeta = document.getElementById("recentTrendMeta");
    const recentTopMeta = document.getElementById("recentTopMeta");
    const recentBubbleMeta = document.getElementById("recentBubbleMeta");
    const recentPieMeta = document.getElementById("recentPieMeta");
    const recentHighlightMeta = document.getElementById("recentHighlightMeta");
    const recentHighlightList = document.getElementById("recentHighlightList");
    const recentDayRankMeta = document.getElementById("recentDayRankMeta");
    const recentDayRankList = document.getElementById("recentDayRankList");
    const recentCompareMeta = document.getElementById("recentCompareMeta");
    const recentCompareList = document.getElementById("recentCompareList");
    const recentTableMeta = document.getElementById("recentTableMeta");
    const recentTableShell = document.getElementById("recentTableShell");
    const weekN = document.getElementById("weekN");
    const weekTxt = document.getElementById("weekTxt");
    const weekGrid = document.getElementById("weekGrid");
    const probGrid = document.getElementById("probGrid");
    const aiKeyInput = document.getElementById("aiKey");
    const aiModelSelect = document.getElementById("aiModel");
    const aiPromptInput = document.getElementById("aiQ");
    const geminiPrefillButtons = Array.from(document.querySelectorAll("[data-gemini-prefill]"));
    const aiOutput = document.getElementById("aiOut");
    const aiGeminiMeta = document.getElementById("aiGeminiMeta");
    const rk1 = document.getElementById("rk1");
    const rk2 = document.getElementById("rk2");
    const rk3 = document.getElementById("rk3");
    const rk4 = document.getElementById("rk4");
    const rk5 = document.getElementById("rk5");
    const rk6 = document.getElementById("rk6");
    const chTrend = document.getElementById("chTrend");
    const chTop = document.getElementById("chTop");
    const chRate = document.getElementById("chRate");
    const chWeek = document.getElementById("chWeek");
    const chPie = document.getElementById("chPie");
    const chRecentTrend = document.getElementById("chRecentTrend");
    const chRecentTop = document.getElementById("chRecentTop");
    const chRecentBubble = document.getElementById("chRecentBubble");
    const chRecentPie = document.getElementById("chRecentPie");

    const chartInstances = {
      trend: null,
      top: null,
      rate: null,
      week: null,
      pie: null
    };

    const GEMINI_KEY_STORAGE = "gemini_key";
    const GEMINI_MODEL_STORAGE = "gemini_model";
    const recentChartInstances = {
      trend: null,
      top: null,
      bubble: null,
      pie: null
    };
    const CHART_CONTEXT = {
      dailySeries: [],
      topProducts: [],
      topRates: [],
      weeklySeries: [],
      categorySeries: []
    };
    const HOVER_STATE = {
      active: false,
      text: ""
    };
    const RECENT_AI_CACHE = new Map();
    const EXEC_AI_CACHE = new Map();
    let recentAiRequestId = 0;
    let executiveAiRequestId = 0;
    let fadeObserver = null;
    let resizeFrame = 0;
    const TARGET_RATE = 1;
    const WATCH_RATE = 2;
    const CATEGORY_PALETTE = ["#4f8ff7", "#a78bfa", "#22d3ee", "#34d399", "#f472b6", "#fbbf24", "#f87171", "#818cf8", "#fb923c", "#2dd4bf"];
    const REMOTE_AI_ENABLED = window.location.protocol.startsWith("http");
    const AI_RENDER_ENDPOINT = window.location.protocol.startsWith("http")
      ? `${window.location.origin}/api/ai/chat/completions`
      : "https://brightai.site/api/ai/chat/completions";
    const GEMINI_PROXY_ENDPOINT = window.location.protocol.startsWith("http")
      ? `${window.location.origin}/api/gemini`
      : "https://brightai.site/api/gemini";
    let LAST_EXECUTIVE_AI = null;

    Chart.register(ChartDataLabels);
    Chart.defaults.plugins.datalabels = {
      display: false
    };
    Chart.defaults.font.family = "Inter";

    function hideLoadingOverlay() {
      if (loadingOverlay) {
        loadingOverlay.classList.add("gone");
      }
    }

    function setFilepathDisplay(primaryText, secondaryText = EMBEDDED_CSV_PATH) {
      if (!filepathDisplay) {
        return;
      }

      filepathDisplay.innerHTML = `
        <strong>${escapeHtml(primaryText)}</strong>
        <span title="${escapeHtml(secondaryText)}">${escapeHtml(secondaryText)}</span>
      `;
    }

    function animateValue(element, target, options = {}) {
      if (!element) {
        return;
      }

      const {
        duration = 800,
        decimals = 0,
        suffix = "",
        format = "number"
      } = options;

      const startTime = performance.now();

      function frame(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;

        if (format === "percent") {
          element.textContent = `${value.toFixed(decimals)}${suffix}`;
        } else {
          const roundedValue = decimals > 0 ? Number(value.toFixed(decimals)) : Math.round(value);
          element.textContent = `${roundedValue.toLocaleString("en-US", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
          })}${suffix}`;
        }

        if (progress < 1) {
          requestAnimationFrame(frame);
          return;
        }

        if (format === "percent") {
          element.textContent = `${target.toFixed(decimals)}${suffix}`;
          return;
        }

        element.textContent = `${target.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        })}${suffix}`;
      }

      requestAnimationFrame(frame);
    }

    function parseDmy(dateString) {
      const [day, month, year] = String(dateString).split("/");
      return new Date(Number(year), Number(month) - 1, Number(day));
    }

    function toIsoDate(dateString) {
      const [day, month, year] = String(dateString).split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    function fromIsoDate(dateString) {
      const [year, month, day] = String(dateString).split("-");
      return `${day}/${month}/${year}`;
    }

    function formatShortDate(dateString) {
      return parseDmy(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short"
      });
    }

    function formatLongDate(dateString) {
      return parseDmy(dateString).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    }

    function formatNavbarDateRange(startDate, endDate) {
      if (!startDate || !endDate) {
        return "Waiting for data";
      }

      const start = parseDmy(startDate);
      const end = parseDmy(endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return "Waiting for data";
      }

      const sameYear = start.getFullYear() === end.getFullYear();
      const sameMonth = sameYear && start.getMonth() === end.getMonth();

      if (sameMonth) {
        return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.getDate()}, ${end.getFullYear()}`;
      }

      if (sameYear) {
        return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()} – ${end.toLocaleDateString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
      }

      return `${start.toLocaleDateString("en-US", { month: "short" })} ${start.getDate()}, ${start.getFullYear()} – ${end.toLocaleDateString("en-US", { month: "short" })} ${end.getDate()}, ${end.getFullYear()}`;
    }

    function updateDatePeriodBadge(startDate = "", endDate = "") {
      const label = datePeriodBadge?.querySelector("strong");
      if (!label) {
        return;
      }

      label.textContent = formatNavbarDateRange(startDate, endDate);
    }

    function formatNumber(value, decimals = 0) {
      return Number(value).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }

    function formatTag(type, text) {
      return `<span class="tag ${type}">${text}</span>`;
    }

    function shiftIsoDate(dateString, days) {
      const date = new Date(`${dateString}T00:00:00`);
      date.setDate(date.getDate() + days);
      return date.toISOString().slice(0, 10);
    }

    function getDateDiffInDays(start, end) {
      const startDate = new Date(`${start}T00:00:00`);
      const endDate = new Date(`${end}T00:00:00`);
      return Math.round((endDate - startDate) / 86400000);
    }

    function calculateMetrics(source) {
      const totalProduced = source.reduce((sum, item) => sum + item.produced, 0);
      const totalRejected = source.reduce((sum, item) => sum + item.rejected, 0);
      const avgRate = totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;
      const totalRecords = source.length;
      const criticalCount = source.filter((item) => item.pct > 5).length;

      return {
        totalProduced,
        totalRejected,
        avgRate,
        totalRecords,
        criticalCount
      };
    }

    function getActiveDateBounds(source) {
      if (!source.length) {
        return null;
      }

      const sortedDates = source
        .map((item) => toIsoDate(item.date))
        .sort((a, b) => a.localeCompare(b));

      return {
        start: sortedDates[0],
        end: sortedDates[sortedDates.length - 1]
      };
    }

    function buildViewDataForSource(source, summaryByCode = null) {
      let view = source.slice();

      if (FILTER_STATE.search) {
        const query = FILTER_STATE.search.trim().toLowerCase();
        view = view.filter((item) =>
          item.code.toLowerCase().includes(query) ||
          item.name.toLowerCase().includes(query)
        );
      }

      if (FILTER_STATE.quickFilter === "critical") {
        view = view.filter((item) => item.pct > 5);
      }

      if (FILTER_STATE.quickFilter === "outliers") {
        view = view.filter((item) => item.pct >= 2);
      }

      if (FILTER_STATE.quickFilter === "repeat" && summaryByCode) {
        const repeatedCodes = new Set(summaryByCode.filter((item) => item.records > 1).map((item) => item.code));
        view = view.filter((item) => repeatedCodes.has(item.code));
      }

      const factor = TABLE_STATE.sortDir === "asc" ? 1 : -1;
      view.sort((a, b) => {
        const av = a[TABLE_STATE.sortKey];
        const bv = b[TABLE_STATE.sortKey];

        if (typeof av === "number" && typeof bv === "number") {
          return (av - bv) * factor;
        }

        if (TABLE_STATE.sortKey === "date") {
          return (parseDmy(a.date) - parseDmy(b.date)) * factor;
        }

        return String(av).localeCompare(String(bv)) * factor;
      });

      return view;
    }

    function getComparisonView() {
      const activeBounds = getActiveDateBounds(DATA);

      if (!activeBounds) {
        return null;
      }

      const spanDays = getDateDiffInDays(activeBounds.start, activeBounds.end) + 1;
      const previousEnd = shiftIsoDate(activeBounds.start, -1);
      const previousStart = shiftIsoDate(activeBounds.start, -spanDays);

      const comparisonBase = RAW_DATA.filter((item) => {
        const itemIsoDate = toIsoDate(item.date);

        if (itemIsoDate < previousStart || itemIsoDate > previousEnd) {
          return false;
        }

        if (FILTER_STATE.codes.length && !FILTER_STATE.codes.includes(item.code)) {
          return false;
        }

        return true;
      });

      return {
        startDate: previousStart,
        endDate: previousEnd,
        view: buildViewDataForSource(comparisonBase, aggregateByCode(comparisonBase))
      };
    }

    function setDeltaState(element, tone, text) {
      if (!element) {
        return;
      }

      element.className = `metric-delta ${tone}`;
      element.textContent = text;
    }

    function renderDelta(element, current, previous, options = {}) {
      if (previous === null || previous === undefined) {
        setDeltaState(element, "na", "Awaiting comparison baseline");
        return;
      }

      const {
        mode = "relative",
        decimals = 0,
        inverseGood = false,
        unit = "",
        neutralText = "No change vs previous window"
      } = options;

      const delta = current - previous;

      if (Math.abs(delta) < 0.0001) {
        setDeltaState(element, "flat", neutralText);
        return;
      }

      if (mode === "points") {
        const tone = inverseGood ? (delta < 0 ? "up" : "down") : (delta > 0 ? "up" : "down");
        const direction = delta > 0 ? "▲" : "▼";
        setDeltaState(
          element,
          tone,
          `${direction} ${formatNumber(Math.abs(delta), decimals)} pts vs previous window`
        );
        return;
      }

      if (previous === 0) {
        setDeltaState(element, "info", `New activity vs previous window${unit ? ` · ${formatNumber(current, decimals)}${unit}` : ""}`);
        return;
      }

      const tone = inverseGood ? (delta < 0 ? "up" : "down") : (delta > 0 ? "up" : "down");
      const direction = delta > 0 ? "▲" : "▼";
      const relativeChange = Math.abs((delta / previous) * 100);

      setDeltaState(
        element,
        tone,
        `${direction} ${formatNumber(relativeChange, 1)}% vs previous window`
      );
    }

    function getDeltaDescriptor(current, previous, options = {}) {
      if (previous === null || previous === undefined) {
        return { tone: "na", text: "No prior window" };
      }

      const { mode = "relative", decimals = 1, inverseGood = false } = options;
      const delta = current - previous;

      if (Math.abs(delta) < 0.0001) {
        return { tone: "flat", text: "No change" };
      }

      if (mode === "points") {
        const tone = inverseGood ? (delta < 0 ? "up" : "down") : (delta > 0 ? "up" : "down");
        const direction = delta > 0 ? "▲" : "▼";
        return { tone, text: `${direction} ${formatNumber(Math.abs(delta), decimals)} pts` };
      }

      if (previous === 0) {
        return { tone: "up", text: "New activity" };
      }

      const tone = inverseGood ? (delta < 0 ? "up" : "down") : (delta > 0 ? "up" : "down");
      const direction = delta > 0 ? "▲" : "▼";
      return {
        tone,
        text: `${direction} ${formatNumber(Math.abs((delta / previous) * 100), 1)}%`
      };
    }

    function updateMetricMeta(currentSummary, comparisonSummary, comparisonWindow) {
      if (!metricMeta) {
        return;
      }

      if (!currentSummary) {
        metricMeta.textContent = "Metric cards prepared for dynamic values";
        return;
      }

      if (!comparisonSummary || !comparisonWindow || !comparisonSummary.totalRecords) {
        metricMeta.textContent = "No previous equivalent period available for comparison";
        return;
      }

      metricMeta.textContent = `Compared with ${fromIsoDate(comparisonWindow.startDate)} to ${fromIsoDate(comparisonWindow.endDate)}`;
    }

    function buildRowKey(item) {
      return `${item.date}__${item.code}__${item.produced}__${item.rejected}__${item.pct}`;
    }

    function getRowStatus(item) {
      if (item.pct > 5) {
        return { label: "Critical", className: "critical" };
      }

      if (item.pct >= 2) {
        return { label: "Watch", className: "watch" };
      }

      return { label: "Normal", className: "normal" };
    }

    function getTableSeverityClass(pct) {
      if (pct > 5) {
        return "crit";
      }

      if (pct > 2) {
        return "high";
      }

      if (pct > 1) {
        return "med";
      }

      return "low";
    }

    function matchesSeverityFilter(pct, severity) {
      if (!severity) {
        return true;
      }

      if (severity === "crit") {
        return pct > 5;
      }

      if (severity === "high") {
        return pct >= 2 && pct <= 5;
      }

      if (severity === "med") {
        return pct >= 1 && pct < 2;
      }

      if (severity === "low") {
        return pct < 1;
      }

      return true;
    }

    function truncateText(value, maxLength = 45) {
      const text = String(value || "");
      if (text.length <= maxLength) {
        return text;
      }

      return `${text.slice(0, maxLength - 1).trimEnd()}…`;
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");
    }

    function getIssueSeverity(pct) {
      if (pct > 10) {
        return { className: "crit", label: "CRITICAL", rank: 3 };
      }

      if (pct > 3) {
        return { className: "warn", label: "WARNING", rank: 2 };
      }

      return { className: "info", label: "MONITOR", rank: 1 };
    }

    function buildIssueCard({ className, badgeText, title, details, tags }) {
      return `
        <article class="issue-card ${className}">
          <div class="issue-card-head">
            <h3>${escapeHtml(title)}</h3>
            <span class="issue-badge ${className}">${escapeHtml(badgeText)}</span>
          </div>
          <p>${details}</p>
          <div class="issue-tags">
            ${tags.map((tag) => `<span class="issue-tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </article>
      `;
    }

    function renderIssueEmptyState(element, text) {
      if (!element) {
        return;
      }

      element.innerHTML = `<article class="issue-empty">${escapeHtml(text)}</article>`;
    }

    function getProductSeries(source = RAW_DATA) {
      const grouped = new Map();

      source.forEach((item) => {
        const key = item.code || item.name;

        if (!grouped.has(key)) {
          grouped.set(key, {
            code: item.code,
            name: item.name,
            rows: []
          });
        }

        grouped.get(key).rows.push(item);
      });

      grouped.forEach((entry) => {
        entry.rows.sort((a, b) => parseDmy(a.date) - parseDmy(b.date) || a.pct - b.pct);
      });

      return Array.from(grouped.values());
    }

    function buildWeeklyIssues() {
      if (!weekN || !weekTxt || !weekGrid) {
        return;
      }

      if (!DATA.length) {
        weekN.textContent = "0";
        weekTxt.textContent = "No weekly rejection events are available for the active view.";
        renderIssueEmptyState(weekGrid, "No weekly issues matched the active dataset.");
        return;
      }

      const maxDate = DATA.reduce((latest, item) => {
        const current = parseDmy(item.date);
        return current > latest ? current : latest;
      }, parseDmy(DATA[0].date));
      const startDate = new Date(maxDate);
      startDate.setDate(startDate.getDate() - 6);

      const weekRows = DATA
        .filter((item) => {
          const current = parseDmy(item.date);
          return current >= startDate && current <= maxDate;
        })
        .sort((a, b) => b.pct - a.pct || parseDmy(b.date) - parseDmy(a.date));

      const totalProduced = weekRows.reduce((sum, item) => sum + item.produced, 0);
      const totalRejected = weekRows.reduce((sum, item) => sum + item.rejected, 0);
      const weightedRate = totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0;

      weekN.textContent = formatNumber(weekRows.length);
      weekTxt.textContent = `${formatNumber(weekRows.length)} rejection events recorded this week. Total rejected: ${formatNumber(totalRejected)} units from ${formatNumber(totalProduced)} produced. Weighted reject rate: ${formatNumber(weightedRate, 2)}%.`;

      const issueRows = weekRows.filter((item) => item.pct > 0.5);

      if (!issueRows.length) {
        renderIssueEmptyState(weekGrid, "No rows exceeded the 0.5% weekly monitoring threshold in the most recent 7-day window.");
        return;
      }

      weekGrid.innerHTML = issueRows.map((item) => {
        const severity = getIssueSeverity(item.pct);
        const details = [
          `Date: ${escapeHtml(item.date)}`,
          `Item Code: ${escapeHtml(item.code)}`,
          `Produced Qty: ${formatNumber(item.produced)}`,
          `Rejected Qty: ${formatNumber(item.rejected)}`,
          `Reject Rate: ${formatNumber(item.pct, 2)}%`
        ].join("<br />");

        return buildIssueCard({
          className: severity.className,
          badgeText: severity.label,
          title: shortenLabel(item.name, 42),
          details,
          tags: [
            `Code ${item.code}`,
            `Rejected ${formatNumber(item.rejected)}`,
            `Produced ${formatNumber(item.produced)}`,
            `Rate ${formatNumber(item.pct, 2)}%`
          ]
        });
      }).join("");
    }

    function buildProblems() {
      if (!probGrid) {
        return;
      }

      if (!RAW_DATA.length) {
        renderIssueEmptyState(probGrid, "Pattern detection will appear once the full dataset is loaded.");
        return;
      }

      const productSeries = getProductSeries(RAW_DATA);
      const cards = [];

      const repeatOffenders = productSeries
        .filter((entry) => entry.rows.length >= 3)
        .map((entry) => {
          const produced = entry.rows.reduce((sum, row) => sum + row.produced, 0);
          const rejected = entry.rows.reduce((sum, row) => sum + row.rejected, 0);

          return {
            ...entry,
            occurrences: entry.rows.length,
            avgPct: produced > 0 ? (rejected / produced) * 100 : 0
          };
        })
        .sort((a, b) => b.occurrences - a.occurrences || b.avgPct - a.avgPct);

      if (repeatOffenders.length) {
        const topItems = repeatOffenders.slice(0, 4);
        const peakAvg = Math.max(...repeatOffenders.map((item) => item.avgPct));
        const hasWarning = topItems.some((item) => item.avgPct > 5);

        cards.push({
          severity: { className: hasWarning ? "warn" : "info", label: hasWarning ? "WARNING" : "MONITOR", rank: hasWarning ? 2 : 1 },
          title: "Repeat Offenders",
          details: topItems.map((item) => `${escapeHtml(truncateText(item.name, 38))} appeared ${formatNumber(item.occurrences)} times with an average reject rate of ${formatNumber(item.avgPct, 2)}%.`).join("<br />"),
          tags: [
            `${formatNumber(repeatOffenders.length)} products`,
            `Top repeat ${formatNumber(topItems[0].occurrences)}x`,
            `Peak avg ${formatNumber(peakAvg, 2)}%`
          ]
        });
      }

      const highVolumeRisk = productSeries
        .flatMap((entry) => entry.rows.map((row) => ({
          ...row,
          name: entry.name,
          wastedUnits: row.rejected
        })))
        .filter((row) => row.produced > 5000 && row.pct > 0.2)
        .sort((a, b) => b.wastedUnits - a.wastedUnits || b.pct - a.pct);

      if (highVolumeRisk.length) {
        const topItems = highVolumeRisk.slice(0, 4);
        const topRate = Math.max(...highVolumeRisk.map((item) => item.pct));
        const isCritical = topItems.some((item) => item.pct > 5);

        cards.push({
          severity: { className: isCritical ? "crit" : "warn", label: isCritical ? "CRITICAL" : "WARNING", rank: isCritical ? 3 : 2 },
          title: "High Volume Risk",
          details: topItems.map((item) => `${escapeHtml(truncateText(item.name, 38))} produced ${formatNumber(item.produced)} units on ${escapeHtml(item.date)} and lost ${formatNumber(item.rejected)} units at ${formatNumber(item.pct, 2)}%.`).join("<br />"),
          tags: [
            `${formatNumber(highVolumeRisk.length)} flagged rows`,
            `Max waste ${formatNumber(topItems[0].rejected)}`,
            `Top rate ${formatNumber(topRate, 2)}%`
          ]
        });
      }

      const escalatingTrends = productSeries
        .filter((entry) => entry.rows.length >= 2)
        .map((entry) => {
          const first = entry.rows[0];
          const last = entry.rows[entry.rows.length - 1];

          return {
            ...entry,
            first,
            last,
            increase: last.pct - first.pct
          };
        })
        .filter((entry) => entry.increase > 0)
        .sort((a, b) => b.increase - a.increase);

      if (escalatingTrends.length) {
        const topItems = escalatingTrends.slice(0, 4);
        const worstLatest = Math.max(...escalatingTrends.map((item) => item.last.pct));
        const isCritical = topItems.some((item) => item.last.pct > 5);

        cards.push({
          severity: { className: isCritical ? "crit" : "warn", label: isCritical ? "CRITICAL" : "WARNING", rank: isCritical ? 3 : 2 },
          title: "Escalating Trends",
          details: topItems.map((item) => `${escapeHtml(truncateText(item.name, 38))} moved from ${formatNumber(item.first.pct, 2)}% on ${escapeHtml(item.first.date)} to ${formatNumber(item.last.pct, 2)}% on ${escapeHtml(item.last.date)}.`).join("<br />"),
          tags: [
            `${formatNumber(escalatingTrends.length)} rising products`,
            `Largest climb ${formatNumber(topItems[0].increase, 2)} pts`,
            `Worst latest ${formatNumber(worstLatest, 2)}%`
          ]
        });
      }

      const batchConcerns = productSeries
        .filter((entry) => entry.rows.length >= 2)
        .map((entry) => {
          const rates = entry.rows.map((row) => row.pct).sort((a, b) => a - b);
          const min = rates[0];
          const max = rates[rates.length - 1];
          const ratio = min > 0 ? max / min : (max > 0 ? Infinity : 0);

          return {
            ...entry,
            min,
            max,
            ratio
          };
        })
        .filter((entry) => entry.ratio > 5)
        .sort((a, b) => b.ratio - a.ratio || b.max - a.max);

      if (batchConcerns.length) {
        const topItems = batchConcerns.slice(0, 4);
        const peakMax = Math.max(...batchConcerns.map((item) => item.max));
        const hasWarning = topItems.some((item) => item.max > 5);

        cards.push({
          severity: { className: hasWarning ? "warn" : "info", label: hasWarning ? "WARNING" : "MONITOR", rank: hasWarning ? 2 : 1 },
          title: "Batch Concerns",
          details: topItems.map((item) => `${escapeHtml(truncateText(item.name, 38))} swings between ${formatNumber(item.min, 2)}% and ${formatNumber(item.max, 2)}%, a ${Number.isFinite(item.ratio) ? `${formatNumber(item.ratio, 1)}x` : "sharp"} spread across batches.`).join("<br />"),
          tags: [
            `${formatNumber(batchConcerns.length)} inconsistent products`,
            `Top spread ${Number.isFinite(topItems[0].ratio) ? `${formatNumber(topItems[0].ratio, 1)}x` : "Infinity"}`,
            `Peak max ${formatNumber(peakMax, 2)}%`
          ]
        });
      }

      const criticalFailures = productSeries
        .map((entry) => ({
          ...entry,
          worstRate: Math.max(...entry.rows.map((row) => row.pct))
        }))
        .filter((entry) => entry.worstRate > 5)
        .sort((a, b) => b.worstRate - a.worstRate);

      if (criticalFailures.length) {
        const topItems = criticalFailures.slice(0, 5);

        cards.push({
          severity: { className: "crit", label: "CRITICAL", rank: 3 },
          title: "Critical Failures",
          details: topItems.map((item) => `${escapeHtml(truncateText(item.name, 38))} reached a worst observed rejection rate of ${formatNumber(item.worstRate, 2)}%.`).join("<br />"),
          tags: [
            `${formatNumber(criticalFailures.length)} critical products`,
            `Worst case ${formatNumber(topItems[0].worstRate, 2)}%`,
            `Threshold > 5%`
          ]
        });
      }

      const sortedCards = cards
        .sort((a, b) => b.severity.rank - a.severity.rank || a.title.localeCompare(b.title))
        .slice(0, 8);

      if (!sortedCards.length) {
        renderIssueEmptyState(probGrid, "No recurring risk patterns were detected across the loaded dataset.");
        return;
      }

      probGrid.innerHTML = sortedCards.map((card) => buildIssueCard({
        className: card.severity.className,
        badgeText: card.severity.label,
        title: card.title,
        details: card.details,
        tags: card.tags
      })).join("");
    }

    function compareTableRows(a, b) {
      if (!sortState.col) {
        return 0;
      }

      const factor = sortState.asc ? 1 : -1;

      if (sortState.col === "date") {
        return (parseDmy(a.date) - parseDmy(b.date)) * factor;
      }

      const av = a[sortState.col];
      const bv = b[sortState.col];

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * factor;
      }

      return String(av).localeCompare(String(bv), undefined, { sensitivity: "base" }) * factor;
    }

    function updateTableSortIndicators() {
      tblHeads.forEach((head) => {
        const isActive = head.dataset.col === sortState.col;
        head.classList.toggle("sorted-asc", isActive && sortState.asc);
        head.classList.toggle("sorted-desc", isActive && !sortState.asc);
      });
    }

    function bindTableControls() {
      if (tblSearch) {
        tblSearch.addEventListener("input", () => {
          renderTable(tblSearch.value, tblFilter?.value || "");
        });
      }

      if (tblFilter) {
        tblFilter.addEventListener("change", () => {
          renderTable(tblSearch?.value || "", tblFilter.value);
        });
      }

      tblHeads.forEach((head) => {
        head.addEventListener("click", () => {
          const nextCol = head.dataset.col;

          if (!nextCol) {
            return;
          }

          if (sortState.col === nextCol) {
            sortState.asc = !sortState.asc;
          } else {
            sortState.col = nextCol;
            sortState.asc = true;
          }

          renderTable(tblSearch?.value || "", tblFilter?.value || "");
        });
      });
    }

    function populateCodeFilter() {
      const codes = Array.from(new Set(RAW_DATA.map((item) => item.code))).sort((a, b) => a.localeCompare(b));
      const sortedDates = RAW_DATA
        .map((item) => toIsoDate(item.date))
        .sort((a, b) => a.localeCompare(b));

      codeFilter.innerHTML = `${codes.map((code) => `<option value="${code}">${code}</option>`).join("")}`;
      Array.from(codeFilter.options).forEach((option) => {
        option.selected = FILTER_STATE.codes.includes(option.value);
      });

      if (sortedDates.length) {
        startDateFilter.min = sortedDates[0];
        startDateFilter.max = sortedDates[sortedDates.length - 1];
        endDateFilter.min = sortedDates[0];
        endDateFilter.max = sortedDates[sortedDates.length - 1];
      }
    }

    function syncCodeFilterSelection() {
      Array.from(codeFilter.options).forEach((option) => {
        option.selected = FILTER_STATE.codes.includes(option.value);
      });
    }

    function updateFilterPanels() {
      const activeDrilldown = FILTER_STATE.focusDate
        ? `Date focus · ${FILTER_STATE.focusDate}`
        : FILTER_STATE.focusWeek
          ? `Week focus · ${FILTER_STATE.focusWeek}`
          : FILTER_STATE.focusCategory
            ? `Category focus · ${FILTER_STATE.focusCategory}`
            : FILTER_STATE.codes.length
              ? `Code focus · ${FILTER_STATE.codes.length} selected`
              : "No active drill-down";

      filterStatus.innerHTML = `
        <span>${activeDrilldown}</span>
        <strong>${FILTER_STATE.startDate || FILTER_STATE.endDate ? "Filtered range" : "All data"}</strong>
      `;

      filterSummary.innerHTML = `
        <span>Records in view</span>
        <strong>${formatNumber(VIEW_DATA.length)}</strong>
      `;
    }

    function setQuickFilterState(value) {
      FILTER_STATE.quickFilter = value;
      quickFilterButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.quickFilter === value);
      });
    }

    function setActiveFilterPanel(panelId = "") {
      const nextPanelId = panelId || "";

      filterPanelButtons.forEach((button) => {
        const isActive = button.dataset.filterPanel === nextPanelId;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-expanded", isActive ? "true" : "false");
      });

      filterPanels.forEach((panel) => {
        const isActive = panel.dataset.filterPanelId === nextPanelId;
        panel.classList.toggle("active", isActive);
        panel.hidden = !isActive;
      });
    }

    function applyFilters(options = {}) {
      const { preserveSelection = false } = options;
      const source = RAW_DATA.slice();

      DATA = source.filter((item) => {
        const itemIsoDate = toIsoDate(item.date);

        if (FILTER_STATE.startDate && itemIsoDate < FILTER_STATE.startDate) {
          return false;
        }

        if (FILTER_STATE.endDate && itemIsoDate > FILTER_STATE.endDate) {
          return false;
        }

        if (FILTER_STATE.codes.length && !FILTER_STATE.codes.includes(item.code)) {
          return false;
        }

        if (FILTER_STATE.focusDate && item.date !== FILTER_STATE.focusDate) {
          return false;
        }

        if (FILTER_STATE.focusWeek) {
          const weekInfo = getIsoWeekInfo(item.date);
          const weekKey = `${weekInfo.year}-W${String(weekInfo.week).padStart(2, "0")}`;
          if (weekKey !== FILTER_STATE.focusWeek) {
            return false;
          }
        }

        if (FILTER_STATE.focusCategory && getCategoryFromName(item.name) !== FILTER_STATE.focusCategory) {
          return false;
        }

        return true;
      });

      if (!preserveSelection) {
        SELECTED_ROW_KEY = DATA.length ? buildRowKey(DATA[0]) : "";
      }

      render();
    }

    function buildViewData(summaryByCode = null) {
      return buildViewDataForSource(DATA, summaryByCode);
    }

    function updateStickySummary(summary) {
      if (!summary) {
        stickyViewLabel.textContent = "No active data";
        stickyProduced.textContent = "0";
        stickyRejected.textContent = "0";
        stickyRate.textContent = "0.00%";
        stickyRecords.textContent = "0";
        return;
      }

      const codeLabel = FILTER_STATE.codes.length ? `${FILTER_STATE.codes.length} codes selected` : "All codes";
      const dateLabel = FILTER_STATE.focusDate
        ? `Focused on ${FILTER_STATE.focusDate}`
        : FILTER_STATE.focusWeek
          ? `Focused on ${FILTER_STATE.focusWeek}`
          : FILTER_STATE.focusCategory
            ? `Focused on ${FILTER_STATE.focusCategory}`
        : FILTER_STATE.startDate || FILTER_STATE.endDate
          ? `${FILTER_STATE.startDate || "start"} to ${FILTER_STATE.endDate || "end"}`
          : "Full date window";

      stickyViewLabel.textContent = `${codeLabel} · ${dateLabel}`;
      stickyProduced.textContent = formatNumber(summary.totalProduced);
      stickyRejected.textContent = formatNumber(summary.totalRejected);
      stickyRate.textContent = `${formatNumber(summary.avgRate, 2)}%`;
      stickyRecords.textContent = formatNumber(VIEW_DATA.length);
    }

    function updateStickyVisibility() {
      const shouldShow = window.scrollY > 260 && !!LAST_SUMMARY;
      stickySummary.classList.toggle("visible", shouldShow);
    }

    function scrollToFocusedRow() {
      if (!SELECTED_ROW_KEY) {
        return;
      }

      const row = tableShell.querySelector(`[data-row-key="${CSS.escape(SELECTED_ROW_KEY)}"]`);

      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    function aggregateByCode(source = DATA) {
      return Array.from(
        source.reduce((map, item) => {
          const current = map.get(item.code) || {
            code: item.code,
            name: item.name,
            produced: 0,
            rejected: 0,
            weightedPct: 0,
            records: 0
          };

          current.produced += item.produced;
          current.rejected += item.rejected;
          current.weightedPct = current.produced > 0 ? (current.rejected / current.produced) * 100 : 0;
          current.records += 1;
          map.set(item.code, current);
          return map;
        }, new Map()).values()
      );
    }

    function aggregateByDate(source = DATA) {
      return Array.from(
        source.reduce((map, item) => {
          const current = map.get(item.date) || {
            date: item.date,
            produced: 0,
            rejected: 0
          };

          current.produced += item.produced;
          current.rejected += item.rejected;
          map.set(item.date, current);
          return map;
        }, new Map()).values()
      )
        .sort((a, b) => parseDmy(a.date) - parseDmy(b.date))
        .map((item) => ({
          ...item,
          pct: item.produced > 0 ? (item.rejected / item.produced) * 100 : 0
        }));
    }

    function buildWindowSeries(startIso, endIso, source) {
      if (!startIso || !endIso) {
        return [];
      }

      const map = new Map(
        aggregateByDate(source).map((item) => [toIsoDate(item.date), item])
      );
      const days = getDateDiffInDays(startIso, endIso) + 1;

      return Array.from({ length: Math.max(days, 0) }, (_, index) => {
        const iso = shiftIsoDate(startIso, index);
        const current = map.get(iso);
        const date = current?.date || fromIsoDate(iso);
        const produced = current?.produced || 0;
        const rejected = current?.rejected || 0;

        return {
          iso,
          date,
          produced,
          rejected,
          pct: produced > 0 ? (rejected / produced) * 100 : 0
        };
      });
    }

    function setMiniListContent(element, rows) {
      element.innerHTML = rows.map((row) => `
        <li>
          <strong>${row.label}</strong>
          <span>${row.value}</span>
        </li>
      `).join("");
    }

    function destroyCharts() {
      Object.keys(chartInstances).forEach((key) => {
        if (chartInstances[key]) {
          chartInstances[key].destroy();
          chartInstances[key] = null;
        }
      });
    }

    function destroyRecentCharts() {
      Object.keys(recentChartInstances).forEach((key) => {
        if (recentChartInstances[key]) {
          recentChartInstances[key].destroy();
          recentChartInstances[key] = null;
        }
      });
    }

    function resizeAllCharts() {
      Object.values(chartInstances).forEach((chart) => chart?.resize());
      Object.values(recentChartInstances).forEach((chart) => chart?.resize());
    }

    function requestChartResize() {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = 0;
        resizeAllCharts();
      });
    }

    function initializeFadeSections() {
      const fadeNodes = Array.from(document.querySelectorAll(".fade"));

      if (!fadeNodes.length) {
        return;
      }

      if (!("IntersectionObserver" in window)) {
        fadeNodes.forEach((node) => node.classList.add("is-visible"));
        return;
      }

      fadeObserver?.disconnect();
      fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-visible");
          fadeObserver?.unobserve(entry.target);
        });
      }, {
        threshold: 0.14,
        rootMargin: "0px 0px -32px 0px"
      });

      fadeNodes.forEach((node) => {
        if (node.classList.contains("is-visible")) {
          return;
        }

        fadeObserver.observe(node);
      });
    }

    function getBaseTooltipOptions() {
      return {
        enabled: true,
        backgroundColor: "#1a2036",
        borderColor: "rgba(28, 36, 68, 0.95)",
        borderWidth: 1,
        titleColor: "#edf2f7",
        bodyColor: "#cbd5e1",
        cornerRadius: 14,
        padding: 12,
        displayColors: true
      };
    }

    function getBaseLegendOptions(position = "top") {
      return {
        position,
        labels: {
          color: "#edf2f7",
          usePointStyle: true,
          padding: 16
        }
      };
    }

    function getGridColor() {
      return "rgba(28,36,68,0.5)";
    }

    function createTrendBarGradient(context) {
      const chart = context.chart;
      const { chartArea, ctx } = chart;

      if (!chartArea) {
        return "rgba(79, 143, 247, 0.7)";
      }

      const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
      gradient.addColorStop(0, "rgba(79, 143, 247, 0.7)");
      gradient.addColorStop(1, "rgba(34, 211, 238, 0.7)");
      return gradient;
    }

    function shortenLabel(label, maxLength = 30) {
      return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
    }

    function getCategoryFromName(name) {
      const text = String(name).toUpperCase();

      if (text.includes("CATHETER") || text.includes("FOLEY")) return "Catheters";
      if (text.includes("ENDOTRACHEAL") || text.includes("ETT")) return "Endotracheal Tubes";
      if (text.includes("LARYN")) return "Laryngeal Masks";
      if (text.includes("BLOOD") || text.includes("TRANSFUSION")) return "Blood Transfusion Sets";
      if (text.includes("PACIFIER")) return "Pacifiers";
      if (text.includes("SYRINGE")) return "Syringes";
      if (text.includes("DRAINAGE") || text.includes("PENROSE")) return "Drainage Tubes";
      if (text.includes("SUCTION")) return "Suction Tubes";
      if (text.includes("INFUSION") || text.includes("I.V") || text.includes("IV")) return "IV Sets";
      if (text.includes("FEEDING")) return "Feeding Tubes";
      if (text.includes("EXTRACTOR") || text.includes("MUCUS")) return "Mucus Extractors";
      if (text.includes("CONNECTOR")) return "Connectors";
      return "Other";
    }

    function getIsoWeekInfo(dateString) {
      const date = parseDmy(dateString);
      const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const day = utcDate.getUTCDay() || 7;
      utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((utcDate - yearStart) / 86400000) + 1) / 7);

      return {
        year: utcDate.getUTCFullYear(),
        week
      };
    }

    function getLatestTenDayWindow(source = RAW_DATA) {
      if (!source.length) {
        return {
          dates: [],
          rows: []
        };
      }

      const uniqueDates = Array.from(new Set(source.map((item) => item.date)))
        .sort((a, b) => parseDmy(a) - parseDmy(b));
      const dates = uniqueDates.slice(-10);
      const dateSet = new Set(dates);
      const rows = source
        .filter((item) => dateSet.has(item.date))
        .sort((a, b) => parseDmy(b.date) - parseDmy(a.date) || b.rejected - a.rejected);

      return { dates, rows };
    }

    function getPriorTenDayWindow(source = RAW_DATA) {
      if (!source.length) {
        return {
          dates: [],
          rows: []
        };
      }

      const uniqueDates = Array.from(new Set(source.map((item) => item.date)))
        .sort((a, b) => parseDmy(a) - parseDmy(b));
      const priorDates = uniqueDates.slice(-20, -10);
      const dateSet = new Set(priorDates);
      const rows = source
        .filter((item) => dateSet.has(item.date))
        .sort((a, b) => parseDmy(b.date) - parseDmy(a.date) || b.rejected - a.rejected);

      return { dates: priorDates, rows };
    }

    function getRecentExecStatus(item) {
      if (item.pct >= 20) {
        return { label: "Critical", className: "critical", rowClass: "exec-critical" };
      }

      if (item.pct >= 10) {
        return { label: "Severe", className: "severe", rowClass: "exec-severe" };
      }

      if (item.pct >= 5) {
        return { label: "High", className: "high", rowClass: "exec-high" };
      }

      if (item.pct >= 2) {
        return { label: "Elevated", className: "elevated", rowClass: "" };
      }

      return { label: "Controlled", className: "controlled", rowClass: "" };
    }

    function setRecentAiStatus(mode, text) {
      if (!recentAiStatus) {
        return;
      }

      recentAiStatus.className = `recent-ai-status ${mode}`;
      recentAiStatus.textContent = text;
    }

    function renderRecentComments(items = []) {
      if (!recentCommentList) {
        return;
      }

      if (!items.length) {
        recentCommentList.innerHTML = `
          <li>
            <strong>Recent comments unavailable</strong>
            <span>No narrative comments are available yet for the latest 10-day window.</span>
          </li>
        `;
        return;
      }

      recentCommentList.innerHTML = items.map((item, index) => `
        <li>
          <strong>Comment ${index + 1}</strong>
          <span>${item}</span>
        </li>
      `).join("");
    }

    function buildRecentFallbackNarrative(payload) {
      return `Across the latest ${formatNumber(payload.days.length)} production days, the file contains ${formatNumber(payload.metrics.totalProduced)} produced units and ${formatNumber(payload.metrics.totalRejected)} rejected units, for a weighted reject rate of ${formatNumber(payload.metrics.avgRate, 2)}%. The highest recent rejection volume is ${payload.topProduct.code} with ${formatNumber(payload.topProduct.rejected)} rejected units, while the highest single-row reject rate in this window is ${payload.topRate.code} at ${formatNumber(payload.topRate.pct, 2)}% on ${payload.topRate.date}.`;
    }

    function buildRecentFallbackComments(payload) {
      return [
        `The worst recent day is ${payload.worstDay.date}, recording ${formatNumber(payload.worstDay.rejected)} rejected units at a weighted rate of ${formatNumber(payload.worstDay.pct, 2)}%.`,
        `${payload.topProduct.code} leads the recent window by rejected quantity with ${formatNumber(payload.topProduct.rejected)} units across ${formatNumber(payload.topProduct.records)} rows.`,
        `${payload.topCategory.category} is the largest recent category contributor with ${formatNumber(payload.topCategory.rejected)} rejected units in the latest 10-day layer.`
      ];
    }

    function buildRecentAiPayload(payload) {
      return {
        days: payload.days,
        metrics: {
          produced: Number(payload.metrics.totalProduced.toFixed(2)),
          rejected: Number(payload.metrics.totalRejected.toFixed(2)),
          rejectRate: Number(payload.metrics.avgRate.toFixed(2)),
          criticalRows: payload.metrics.criticalCount,
          uniqueCodes: payload.uniqueCodes
        },
        worstDay: {
          date: payload.worstDay.date,
          produced: Number(payload.worstDay.produced.toFixed(2)),
          rejected: Number(payload.worstDay.rejected.toFixed(2)),
          rejectRate: Number(payload.worstDay.pct.toFixed(2))
        },
        topProduct: {
          code: payload.topProduct.code,
          name: payload.topProduct.name,
          rejected: Number(payload.topProduct.rejected.toFixed(2)),
          produced: Number(payload.topProduct.produced.toFixed(2)),
          rejectRate: Number(payload.topProduct.weightedPct.toFixed(2)),
          records: payload.topProduct.records
        },
        topRateRow: {
          date: payload.topRate.date,
          code: payload.topRate.code,
          name: payload.topRate.name,
          produced: Number(payload.topRate.produced.toFixed(2)),
          rejected: Number(payload.topRate.rejected.toFixed(2)),
          rejectRate: Number(payload.topRate.pct.toFixed(2))
        },
        topCategory: {
          category: payload.topCategory.category,
          rejected: Number(payload.topCategory.rejected.toFixed(2))
        }
      };
    }

    function parseAiJson(text) {
      try {
        return JSON.parse(text);
      } catch (_error) {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) {
          return null;
        }

        try {
          return JSON.parse(match[0]);
        } catch (_secondError) {
          return null;
        }
      }
    }

    async function callRecentAiRender(payload) {
      if (!REMOTE_AI_ENABLED) {
        throw new Error("REMOTE_AI_DISABLED_FOR_FILE_PROTOCOL");
      }

      const messages = [
        {
          role: "system",
          content: "You are an operations intelligence writer for a medical products dashboard. Use only the provided numbers. Do not infer causes, suppliers, machines, operators, customers, or corrective actions unless they are explicitly in the data. Write in English. Return strict JSON with keys narrative and comments where comments is an array of exactly 3 short strings."
        },
        {
          role: "user",
          content: `Create concise executive commentary for the latest 10 production days using only this numeric payload:\n${JSON.stringify(payload)}`
        }
      ];

      const providers = [
        { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
        { provider: "deepseek", model: "deepseek-chat" }
      ];

      let lastError = null;

      for (const current of providers) {
        try {
          const response = await fetch(AI_RENDER_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: current.provider,
              model: current.model,
              messages,
              max_tokens: 700,
              temperature: 0.2
            })
          });

          if (!response.ok) {
            throw new Error(`AI API ${response.status}`);
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content || "";
          const parsed = parseAiJson(content);

          if (parsed?.narrative && Array.isArray(parsed.comments)) {
            return {
              narrative: parsed.narrative,
              comments: parsed.comments.slice(0, 3),
              provider: current.provider
            };
          }

          throw new Error("AI response JSON invalid");
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("AI commentary unavailable");
    }

    async function hydrateRecentAiComments(payload) {
      const cacheKey = JSON.stringify(buildRecentAiPayload(payload));

      if (RECENT_AI_CACHE.has(cacheKey)) {
        const cached = RECENT_AI_CACHE.get(cacheKey);
        recentNarrative.textContent = cached.narrative;
        renderRecentComments(cached.comments);
        setRecentAiStatus(cached.mode, cached.status);
        return;
      }

      const requestId = ++recentAiRequestId;
      setRecentAiStatus("loading", "Generating AI comments");

      try {
        const aiResult = await callRecentAiRender(buildRecentAiPayload(payload));

        if (requestId !== recentAiRequestId) {
          return;
        }

        const normalized = {
          narrative: aiResult.narrative,
          comments: aiResult.comments,
          mode: "success",
          status: `AI comments via ${aiResult.provider}`
        };

        RECENT_AI_CACHE.set(cacheKey, normalized);
        recentNarrative.textContent = normalized.narrative;
        renderRecentComments(normalized.comments);
        setRecentAiStatus(normalized.mode, normalized.status);
      } catch (_error) {
        if (requestId !== recentAiRequestId) {
          return;
        }

        const fallback = {
          narrative: buildRecentFallbackNarrative(payload),
          comments: buildRecentFallbackComments(payload),
          mode: "fallback",
          status: "Local numeric fallback"
        };

        RECENT_AI_CACHE.set(cacheKey, fallback);
        recentNarrative.textContent = fallback.narrative;
        renderRecentComments(fallback.comments);
        setRecentAiStatus(fallback.mode, fallback.status);
      }
    }

    function buildWeekKey(dateString) {
      const weekInfo = getIsoWeekInfo(dateString);
      return `${weekInfo.year}-W${String(weekInfo.week).padStart(2, "0")}`;
    }

    function renderRecentLayer() {
      const recentWindow = getLatestTenDayWindow(RAW_DATA);
      const priorWindow = getPriorTenDayWindow(RAW_DATA);
      const recentRows = recentWindow.rows;
      const priorRows = priorWindow.rows;

      if (!recentRows.length) {
        [rk1, rk2, rk4, rk5].forEach((element) => {
          if (element) {
            element.textContent = "0";
          }
        });

        if (rk3) {
          rk3.textContent = "0.00%";
        }

        if (rk6) {
          rk6.textContent = "-";
        }

        setRecentAiStatus("fallback", "AI comments unavailable");
        recentRange.textContent = "No recent production window";
        recentNarrative.textContent = "No valid rows are available yet for the latest 10-day executive layer.";
        renderRecentComments([]);
        recentTrendMeta.textContent = "No chart data";
        recentTopMeta.textContent = "No product concentration";
        recentBubbleMeta.textContent = "No risk matrix";
        recentPieMeta.textContent = "No category mix";
        recentHighlightMeta.textContent = "Waiting for recent production data";
        recentHighlightList.innerHTML = "";
        recentDayRankMeta.textContent = "No daily ranking";
        recentDayRankList.innerHTML = "";
        recentCompareMeta.textContent = "No previous comparison window";
        recentCompareList.innerHTML = "";
        recentTableMeta.textContent = "No recent detail rows";
        recentTableShell.innerHTML = "";
        destroyRecentCharts();
        return;
      }

      const recentMetrics = calculateMetrics(recentRows);
      const recentByDate = aggregateByDate(recentRows);
      const recentByCode = aggregateByCode(recentRows);
      const recentTopProducts = recentByCode
        .slice()
        .sort((a, b) => b.rejected - a.rejected)
        .slice(0, 8);
      const recentTopRates = recentRows
        .slice()
        .sort((a, b) => b.pct - a.pct || b.rejected - a.rejected)
        .slice(0, 5);
      const recentDailyRiskRanking = recentWindow.dates.map((date) => {
        const dayRows = recentRows.filter((item) => item.date === date);
        const dayTop = dayRows.slice().sort((a, b) => b.pct - a.pct || b.rejected - a.rejected)[0];
        const dayTotals = calculateMetrics(dayRows);
        return {
          date,
          top: dayTop,
          totalRejected: dayTotals.totalRejected,
          avgRate: dayTotals.avgRate
        };
      }).sort((a, b) => b.top.pct - a.top.pct || b.totalRejected - a.totalRejected);
      const recentWorstDay = recentByDate
        .slice()
        .sort((a, b) => b.pct - a.pct || b.rejected - a.rejected)[0];
      const recentCategories = Array.from(
        recentRows.reduce((map, item) => {
          const category = getCategoryFromName(item.name);
          map.set(category, (map.get(category) || 0) + item.rejected);
          return map;
        }, new Map()).entries()
      )
        .map(([category, rejected]) => ({ category, rejected }))
        .sort((a, b) => b.rejected - a.rejected);
      const bubbleSeries = recentByCode
        .slice()
        .sort((a, b) => b.rejected - a.rejected)
        .slice(0, 12)
        .map((item) => ({
          code: item.code,
          name: item.name,
          x: item.produced,
          y: Number(item.weightedPct.toFixed(2)),
          r: Math.max(7, Math.min(28, Math.sqrt(item.rejected) * 1.6)),
          rejected: item.rejected
        }));
      const priorMetrics = calculateMetrics(priorRows);
      const compareRows = [
        {
          label: "Produced quantity",
          current: recentMetrics.totalProduced,
          previous: priorMetrics.totalProduced,
          display: "number"
        },
        {
          label: "Rejected quantity",
          current: recentMetrics.totalRejected,
          previous: priorMetrics.totalRejected,
          display: "number"
        },
        {
          label: "Weighted reject rate",
          current: recentMetrics.avgRate,
          previous: priorMetrics.avgRate,
          display: "percent"
        },
        {
          label: "Critical rows",
          current: recentMetrics.criticalCount,
          previous: priorMetrics.criticalCount,
          display: "number"
        }
      ];

      recentRange.textContent = `${recentWindow.dates[0]} to ${recentWindow.dates[recentWindow.dates.length - 1]}`;
      recentNarrative.textContent = `Preparing AI commentary for the latest ${formatNumber(recentWindow.dates.length)} production days while the numeric layer renders below.`;
      renderRecentComments([
        "Numeric commentary is being generated from the latest 10-day production window.",
        "The final text will stay restricted to dates, codes, quantities, and percentages in the file.",
        "If the backend AI route is unavailable, the dashboard will fall back to local number-based comments."
      ]);

      animateValue(rk1, recentMetrics.totalProduced, { duration: 800 });
      animateValue(rk2, recentMetrics.totalRejected, { duration: 800 });
      animateValue(rk3, recentMetrics.avgRate, { duration: 800, decimals: 2, suffix: "%", format: "percent" });
      animateValue(rk4, recentByCode.length, { duration: 800 });
      animateValue(rk5, recentMetrics.criticalCount, { duration: 800 });
      rk6.textContent = recentWorstDay ? `${recentWorstDay.date} · ${formatNumber(recentWorstDay.pct, 2)}%` : "-";

      setMiniListContent(recentHighlightList, [
        {
          label: "Worst recent day",
          value: recentWorstDay ? `${recentWorstDay.date} · ${formatNumber(recentWorstDay.rejected)} rejects · ${formatNumber(recentWorstDay.pct, 2)}%` : "Not available"
        },
        {
          label: "Top recent product",
          value: recentTopProducts[0] ? `${recentTopProducts[0].code} · ${formatNumber(recentTopProducts[0].rejected)} rejects` : "Not available"
        },
        {
          label: "Highest recent row rate",
          value: recentTopRates[0] ? `${recentTopRates[0].code} · ${formatNumber(recentTopRates[0].pct, 2)}%` : "Not available"
        },
        {
          label: "Recent category leader",
          value: recentCategories[0] ? `${recentCategories[0].category} · ${formatNumber(recentCategories[0].rejected)} rejects` : "Not available"
        }
      ]);

      recentDayRankMeta.textContent = `${formatNumber(recentDailyRiskRanking.length)} production days ranked by worst single-row reject rate`;
      recentDayRankList.innerHTML = recentDailyRiskRanking.map((entry, index) => {
        const status = getRecentExecStatus(entry.top);
        return `
          <li>
            <span class="rank-pill">#${index + 1}</span>
            <div style="flex:1; min-width:0;">
              <strong>${entry.date} · ${entry.top.code}</strong>
              <span>${entry.top.name}</span>
            </div>
            <div style="display:grid; gap:8px; justify-items:end;">
              <span class="exec-badge ${status.className}">${status.label}</span>
              <span>${formatNumber(entry.top.pct, 2)}% · ${formatNumber(entry.top.rejected)} rejects</span>
            </div>
          </li>
        `;
      }).join("");

      if (priorWindow.dates.length && priorRows.length) {
        recentCompareMeta.textContent = `${priorWindow.dates[0]} to ${priorWindow.dates[priorWindow.dates.length - 1]}`;
        recentCompareList.innerHTML = compareRows.map((row) => {
          const delta = getDeltaDescriptor(
            row.current,
            row.previous,
            row.display === "percent" ? { mode: "points", decimals: 2, inverseGood: row.label.includes("rate") } : { inverseGood: row.label.includes("Rejected") || row.label.includes("Critical") }
          );
          const currentText = row.display === "percent" ? `${formatNumber(row.current, 2)}%` : formatNumber(row.current);
          const previousText = row.display === "percent" ? `${formatNumber(row.previous, 2)}%` : formatNumber(row.previous);
          return `
            <li>
              <strong>${row.label}</strong>
              <div class="compare-value-row">
                <span class="recent-compare-value">${currentText}</span>
                <span class="compare-previous">Prior 10 days: ${previousText}</span>
                <span class="compare-badge ${delta.tone}">${delta.text}</span>
              </div>
            </li>
          `;
        }).join("");
      } else {
        recentCompareMeta.textContent = "No previous 10-day block available";
        recentCompareList.innerHTML = `
          <li>
            <strong>Comparison unavailable</strong>
            <div class="compare-value-row">
              <span class="recent-compare-value">Latest 10-day window is available</span>
              <span class="compare-previous">No earlier 10-day production block exists in the loaded file.</span>
            </div>
          </li>
        `;
      }

      recentTableMeta.textContent = `${formatNumber(recentRows.length)} recent rows across ${formatNumber(recentWindow.dates.length)} latest production days`;
      recentTableShell.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Code</th>
              <th>Product</th>
              <th>Category</th>
              <th>Produced</th>
              <th>Rejected</th>
              <th>Reject %</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            ${recentRows.map((item) => {
              const status = getRecentExecStatus(item);
              return `
              <tr class="${status.rowClass}">
                <td>${item.date}</td>
                <td><span class="code-pill">${item.code}</span></td>
                <td><strong>${item.name}</strong></td>
                <td>${getCategoryFromName(item.name)}</td>
                <td>${formatNumber(item.produced)}</td>
                <td>${formatNumber(item.rejected)}</td>
                <td>${formatNumber(item.pct, 2)}%</td>
                <td><span class="exec-badge ${status.className}">${status.label}</span></td>
              </tr>
            `;
            }).join("")}
          </tbody>
        </table>
      `;

      destroyRecentCharts();

      recentChartInstances.trend = new Chart(chRecentTrend, {
        data: {
          labels: recentByDate.map((item) => formatShortDate(item.date)),
          datasets: [
            {
              type: "bar",
              label: "Produced Qty",
              data: recentByDate.map((item) => item.produced),
              backgroundColor: "rgba(79, 143, 247, 0.45)",
              borderColor: "#4f8ff7",
              borderWidth: 1.2,
              borderRadius: 8,
              yAxisID: "y"
            },
            {
              type: "bar",
              label: "Rejected Qty",
              data: recentByDate.map((item) => item.rejected),
              backgroundColor: "rgba(248, 113, 113, 0.78)",
              borderColor: "#f87171",
              borderWidth: 1.2,
              borderRadius: 8,
              yAxisID: "y1"
            },
            {
              type: "line",
              label: "Reject %",
              data: recentByDate.map((item) => Number(item.pct.toFixed(2))),
              borderColor: "#22d3ee",
              pointBackgroundColor: "#22d3ee",
              pointBorderColor: "#22d3ee",
              borderWidth: 2,
              tension: 0.35,
              yAxisID: "y2"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                label(context) {
                  const value = context.parsed.y;
                  return context.dataset.label === "Reject %"
                    ? ` ${context.dataset.label}: ${formatNumber(value, 2)}%`
                    : ` ${context.dataset.label}: ${formatNumber(value)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: "#5a6a85" },
              grid: { color: getGridColor() }
            },
            y: {
              beginAtZero: true,
              ticks: { color: "#5a6a85" },
              grid: { color: getGridColor() }
            },
            y1: {
              beginAtZero: true,
              position: "right",
              ticks: { color: "#5a6a85" },
              grid: { drawOnChartArea: false }
            },
            y2: {
              beginAtZero: true,
              position: "right",
              offset: true,
              ticks: {
                color: "#5a6a85",
                callback: (value) => `${value}%`
              },
              grid: { drawOnChartArea: false }
            }
          }
        }
      });

      recentChartInstances.top = new Chart(chRecentTop, {
        type: "bar",
        data: {
          labels: recentTopProducts.map((item) => shortenLabel(item.name, 34)),
          datasets: [
            {
              label: "Rejected Qty",
              data: recentTopProducts.map((item) => item.rejected),
              backgroundColor: recentTopProducts.map((_, index) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]),
              borderRadius: 10,
              datalabels: {
                display: true,
                color: "#ffffff",
                anchor: "end",
                align: "right",
                formatter(value) {
                  return formatNumber(value);
                }
              }
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                title(items) {
                  return recentTopProducts[items[0]?.dataIndex]?.name || "";
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { color: "#5a6a85" },
              grid: { color: getGridColor() }
            },
            y: {
              ticks: { color: "#5a6a85" },
              grid: { color: getGridColor() }
            }
          }
        }
      });

      recentChartInstances.bubble = new Chart(chRecentBubble, {
        type: "bubble",
        data: {
          datasets: [
            {
              label: "Recent item pressure",
              data: bubbleSeries,
              backgroundColor: bubbleSeries.map((item) =>
                item.y > 10 ? "rgba(248, 113, 113, 0.65)"
                  : item.y > 5 ? "rgba(251, 146, 60, 0.65)"
                  : item.y > 2 ? "rgba(251, 191, 36, 0.62)"
                  : "rgba(79, 143, 247, 0.62)"
              ),
              borderColor: bubbleSeries.map((item) =>
                item.y > 10 ? "#f87171"
                  : item.y > 5 ? "#fb923c"
                  : item.y > 2 ? "#fbbf24"
                  : "#4f8ff7"
              ),
              borderWidth: 1.5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                title(items) {
                  const item = bubbleSeries[items[0]?.dataIndex];
                  return item ? `${item.code} · ${item.name}` : "";
                },
                label(context) {
                  const raw = context.raw;
                  return [
                    ` Produced: ${formatNumber(raw.x)}`,
                    ` Reject %: ${formatNumber(raw.y, 2)}%`,
                    ` Rejected: ${formatNumber(raw.rejected)}`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Produced Qty",
                color: "#94a3b8"
              },
              ticks: { color: "#5a6a85" },
              grid: { color: getGridColor() }
            },
            y: {
              title: {
                display: true,
                text: "Reject %",
                color: "#94a3b8"
              },
              ticks: {
                color: "#5a6a85",
                callback: (value) => `${value}%`
              },
              grid: { color: getGridColor() }
            }
          }
        }
      });

      recentChartInstances.pie = new Chart(chRecentPie, {
        type: "doughnut",
        data: {
          labels: recentCategories.map((item) => item.category),
          datasets: [
            {
              data: recentCategories.map((item) => item.rejected),
              backgroundColor: recentCategories.map((_, index) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]),
              borderColor: "#0b1022",
              borderWidth: 2,
              datalabels: {
                display: true,
                color: "#ffffff",
                formatter(value, context) {
                  const total = context.dataset.data.reduce((sum, item) => sum + item, 0);
                  const pct = total > 0 ? (value / total) * 100 : 0;
                  return `${formatNumber(pct, 1)}%`;
                }
              }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "54%",
          plugins: {
            legend: getBaseLegendOptions("right"),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                label(context) {
                  const total = context.dataset.data.reduce((sum, item) => sum + item, 0);
                  const value = context.parsed;
                  const pct = total > 0 ? (value / total) * 100 : 0;
                  return ` ${context.label}: ${formatNumber(value)} rejected (${formatNumber(pct, 1)}%)`;
                }
              }
            }
          }
        }
      });

      recentTrendMeta.textContent = `${formatNumber(recentByDate.length)} latest production days with output, rejects, and rate`;
      recentTopMeta.textContent = `Top ${formatNumber(recentTopProducts.length)} recent products by rejected quantity`;
      recentBubbleMeta.textContent = `${formatNumber(bubbleSeries.length)} recent products positioned by produced quantity and reject rate`;
      recentPieMeta.textContent = `${formatNumber(recentCategories.length)} recent categories contributing to rejection volume`;
      recentHighlightMeta.textContent = `Latest window from ${recentWindow.dates[0]} to ${recentWindow.dates[recentWindow.dates.length - 1]}`;

      hydrateRecentAiComments({
        days: recentWindow.dates,
        metrics: recentMetrics,
        uniqueCodes: recentByCode.length,
        worstDay: recentWorstDay,
        topProduct: recentTopProducts[0],
        topRate: recentTopRates[0],
        topCategory: recentCategories[0]
      });
    }

    function applyChartFocus(nextState = {}, options = {}) {
      const { preserveSelection = false } = options;

      if (Object.prototype.hasOwnProperty.call(nextState, "focusDate")) {
        FILTER_STATE.focusDate = nextState.focusDate;
      }

      if (Object.prototype.hasOwnProperty.call(nextState, "focusWeek")) {
        FILTER_STATE.focusWeek = nextState.focusWeek;
      }

      if (Object.prototype.hasOwnProperty.call(nextState, "focusCategory")) {
        FILTER_STATE.focusCategory = nextState.focusCategory;
      }

      if (Object.prototype.hasOwnProperty.call(nextState, "codes")) {
        FILTER_STATE.codes = nextState.codes;
        syncCodeFilterSelection();
      }

      applyFilters({ preserveSelection });
    }

    function focusFromTableRow(item) {
      if (!item) {
        return;
      }

      SELECTED_ROW_KEY = buildRowKey(item);
      applyChartFocus({
        focusDate: item.date,
        focusWeek: buildWeekKey(item.date),
        focusCategory: getCategoryFromName(item.name),
        codes: [item.code]
      }, {
        preserveSelection: true
      });
    }

    function setChartChipState(chip, textElement, visible, text = "") {
      if (!chip || !textElement) {
        return;
      }

      chip.classList.toggle("visible", visible);
      if (visible) {
        textElement.textContent = text;
      }
    }

    function renderChartFocusChips() {
      setChartChipState(
        trendFocusChip,
        trendFocusText,
        Boolean(FILTER_STATE.focusDate),
        `Focused date: ${FILTER_STATE.focusDate}`
      );

      const codeFocusText = FILTER_STATE.codes.length === 1
        ? `Focused code: ${FILTER_STATE.codes[0]}`
        : FILTER_STATE.codes.length > 1
          ? `Focused codes: ${FILTER_STATE.codes.length}`
          : "";

      setChartChipState(
        topFocusChip,
        topFocusText,
        Boolean(FILTER_STATE.codes.length),
        codeFocusText
      );

      setChartChipState(
        rateFocusChip,
        rateFocusText,
        Boolean(FILTER_STATE.codes.length),
        codeFocusText
      );

      setChartChipState(
        weekFocusChip,
        weekFocusText,
        Boolean(FILTER_STATE.focusWeek),
        `Focused week: ${FILTER_STATE.focusWeek}`
      );

      setChartChipState(
        pieFocusChip,
        pieFocusText,
        Boolean(FILTER_STATE.focusCategory),
        `Focused category: ${FILTER_STATE.focusCategory}`
      );
    }

    function setChartHoverState(chart, activeElements = []) {
      if (!chart) {
        return;
      }

      chart.setActiveElements(activeElements);

      if (chart.tooltip) {
        chart.tooltip.setActiveElements(activeElements, { x: 0, y: 0 });
      }

      chart.update("none");
    }

    function clearChartHoverSync() {
      Object.values(chartInstances).forEach((chart) => {
        setChartHoverState(chart, []);
      });
    }

    function updateTableMeta() {
      const activeCount = tableShell.querySelectorAll("tbody tr[data-row-key]").length;
      const sortLabel = sortState.col ? `${sortState.col} (${sortState.asc ? "asc" : "desc"})` : "default order";
      const base = `${formatNumber(activeCount)} records · sorted by ${sortLabel} · click row to sync charts · arrows navigate · Enter selects · P pins`;
      tableMeta.textContent = HOVER_STATE.active ? `${base} · hover preview: ${HOVER_STATE.text}` : base;
    }

    function getCurrentFocusSummary() {
      const parts = [];

      if (FILTER_STATE.focusDate) parts.push(`Date ${FILTER_STATE.focusDate}`);
      if (FILTER_STATE.focusWeek) parts.push(`Week ${FILTER_STATE.focusWeek}`);
      if (FILTER_STATE.focusCategory) parts.push(`Category ${FILTER_STATE.focusCategory}`);
      if (FILTER_STATE.codes.length) parts.push(`Codes ${FILTER_STATE.codes.join(", ")}`);
      if (FILTER_STATE.startDate || FILTER_STATE.endDate) parts.push(`Range ${FILTER_STATE.startDate || "start"} to ${FILTER_STATE.endDate || "end"}`);
      if (FILTER_STATE.search.trim()) parts.push(`Search "${FILTER_STATE.search.trim()}"`);
      if (FILTER_STATE.quickFilter !== "all") parts.push(`Quick ${FILTER_STATE.quickFilter}`);

      return parts.length ? parts.join(" · ") : "All active data";
    }

    function buildSelectedRowPin() {
      if (!SELECTED_ROW_KEY) {
        return null;
      }

      const item = VIEW_DATA.find((entry) => buildRowKey(entry) === SELECTED_ROW_KEY);

      if (!item) {
        return null;
      }

      return {
        id: `row:${buildRowKey(item)}`,
        type: "row",
        title: `${item.code} · ${item.date}`,
        body: item.name,
        meta: `Produced ${formatNumber(item.produced)} · Rejected ${formatNumber(item.rejected)} · ${formatNumber(item.pct, 2)}%`
      };
    }

    function buildCurrentFocusPin() {
      return {
        id: `focus:${FILTER_STATE.focusDate}|${FILTER_STATE.focusWeek}|${FILTER_STATE.focusCategory}|${FILTER_STATE.codes.join(",")}|${FILTER_STATE.startDate}|${FILTER_STATE.endDate}|${FILTER_STATE.search}|${FILTER_STATE.quickFilter}`,
        type: "focus",
        title: "Current Focus Snapshot",
        body: getCurrentFocusSummary(),
        meta: `Records ${formatNumber(VIEW_DATA.length)} · Produced ${formatNumber(LAST_SUMMARY?.totalProduced || 0)} · Rejected ${formatNumber(LAST_SUMMARY?.totalRejected || 0)}`
      };
    }

    function addPinnedItem(item) {
      if (!item || PINNED_ITEMS.some((entry) => entry.id === item.id)) {
        renderPinnedTray();
        return;
      }

      PINNED_ITEMS.unshift(item);

      if (PINNED_ITEMS.length > 9) {
        PINNED_ITEMS.pop();
      }

      renderPinnedTray();
    }

    function removePinnedItem(id) {
      const index = PINNED_ITEMS.findIndex((item) => item.id === id);
      if (index >= 0) {
        PINNED_ITEMS.splice(index, 1);
      }
      renderPinnedTray();
    }

    function clearPinnedItems() {
      PINNED_ITEMS.length = 0;
      renderPinnedTray();
    }

    function renderPinnedTray() {
      if (!pinGrid || !pinMeta) {
        return;
      }

      pinMeta.textContent = PINNED_ITEMS.length
        ? `${formatNumber(PINNED_ITEMS.length)} pinned references ready for comparison and export`
        : "Capture rows and active chart focus for side-by-side review";

      if (!PINNED_ITEMS.length) {
        pinGrid.innerHTML = `
          <div class="pin-card">
            <strong>No pinned references</strong>
            <p>Pin a selected row or the current chart focus to keep it available while you continue filtering and sorting.</p>
            <div class="pin-card-meta">Supports up to 9 pinned items.</div>
          </div>
        `;
        return;
      }

      pinGrid.innerHTML = PINNED_ITEMS.map((item) => `
        <article class="pin-card">
          <div class="pin-card-head">
            <div>
              <strong>${item.title}</strong>
              <div class="pin-card-meta">${item.type === "row" ? "Pinned row" : "Pinned focus"}</div>
            </div>
            <button type="button" data-remove-pin="${item.id}" aria-label="Remove pinned item">×</button>
          </div>
          <p>${item.body}</p>
          <div class="pin-card-meta">${item.meta}</div>
        </article>
      `).join("");

      pinGrid.querySelectorAll("[data-remove-pin]").forEach((button) => {
        button.addEventListener("click", () => {
          removePinnedItem(button.dataset.removePin || "");
        });
      });
    }

    function highlightTableRowsFromChart(predicate, label = "") {
      HOVER_STATE.active = true;
      HOVER_STATE.text = label;

      tableShell.querySelectorAll("tbody tr").forEach((row) => {
        const matches = predicate(row);
        row.classList.toggle("hover-linked-row", matches);
      });

      updateTableMeta();
    }

    function clearTableHoverHighlight() {
      HOVER_STATE.active = false;
      HOVER_STATE.text = "";

      tableShell.querySelectorAll("tbody tr").forEach((row) => {
        row.classList.remove("hover-linked-row");
      });

      updateTableMeta();
    }

    function syncChartsFromHover(item) {
      if (!item) {
        clearChartHoverSync();
        return;
      }

      const hoveredDate = item.date;
      const hoveredCode = item.code;
      const hoveredWeek = buildWeekKey(item.date);
      const hoveredCategory = getCategoryFromName(item.name);

      const trendIndex = CHART_CONTEXT.dailySeries.findIndex((entry) => entry.date === hoveredDate);
      const trendActive = trendIndex >= 0 ? [{ datasetIndex: 0, index: trendIndex }, { datasetIndex: 1, index: trendIndex }] : [];
      setChartHoverState(chartInstances.trend, trendActive);

      const topIndex = CHART_CONTEXT.topProducts.findIndex((entry) => entry.code === hoveredCode);
      setChartHoverState(chartInstances.top, topIndex >= 0 ? [{ datasetIndex: 0, index: topIndex }] : []);

      const rateIndex = CHART_CONTEXT.topRates.findIndex((entry) => entry.code === hoveredCode);
      setChartHoverState(chartInstances.rate, rateIndex >= 0 ? [{ datasetIndex: 0, index: rateIndex }] : []);

      const weekIndex = CHART_CONTEXT.weeklySeries.findIndex((entry) => `${entry.year}-W${String(entry.week).padStart(2, "0")}` === hoveredWeek);
      const weekActive = weekIndex >= 0 ? [{ datasetIndex: 0, index: weekIndex }, { datasetIndex: 1, index: weekIndex }] : [];
      setChartHoverState(chartInstances.week, weekActive);

      const pieIndex = CHART_CONTEXT.categorySeries.findIndex((entry) => entry.category === hoveredCategory);
      setChartHoverState(chartInstances.pie, pieIndex >= 0 ? [{ datasetIndex: 0, index: pieIndex }] : []);
    }

    function renderCharts() {
      destroyCharts();

      const dailySeries = aggregateByDate(VIEW_DATA);
      const topProducts = Array.from(
        VIEW_DATA.reduce((map, item) => {
          const key = `${item.code}__${item.name}`;
          const current = map.get(key) || {
            code: item.code,
            name: item.name,
            rejected: 0
          };
          current.rejected += item.rejected;
          map.set(key, current);
          return map;
        }, new Map()).values()
      )
        .sort((a, b) => b.rejected - a.rejected)
        .slice(0, 10);

      const topRates = Array.from(
        VIEW_DATA.reduce((map, item) => {
          const current = map.get(item.code) || {
            code: item.code,
            name: item.name,
            pct: 0
          };
          current.pct = Math.max(current.pct, item.pct);
          map.set(item.code, current);
          return map;
        }, new Map()).values()
      )
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 10);

      const weeklySeries = Array.from(
        VIEW_DATA.reduce((map, item) => {
          const weekInfo = getIsoWeekInfo(item.date);
          const key = `${weekInfo.year}-${String(weekInfo.week).padStart(2, "0")}`;
          const current = map.get(key) || {
            week: weekInfo.week,
            year: weekInfo.year,
            produced: 0,
            rejected: 0
          };
          current.produced += item.produced;
          current.rejected += item.rejected;
          map.set(key, current);
          return map;
        }, new Map()).values()
      ).sort((a, b) => a.year - b.year || a.week - b.week);

      const categorySeries = Array.from(
        VIEW_DATA.reduce((map, item) => {
          const category = getCategoryFromName(item.name);
          map.set(category, (map.get(category) || 0) + item.rejected);
          return map;
        }, new Map()).entries()
      )
        .map(([category, rejected]) => ({ category, rejected }))
        .sort((a, b) => b.rejected - a.rejected);

      CHART_CONTEXT.dailySeries = dailySeries;
      CHART_CONTEXT.topProducts = topProducts;
      CHART_CONTEXT.topRates = topRates;
      CHART_CONTEXT.weeklySeries = weeklySeries;
      CHART_CONTEXT.categorySeries = categorySeries;

      chartInstances.trend = new Chart(chTrend, {
        data: {
          labels: dailySeries.map((item) => formatShortDate(item.date)),
          datasets: [
            {
              type: "bar",
              label: "Rejected Qty",
              data: dailySeries.map((item) => item.rejected),
              backgroundColor: createTrendBarGradient,
              borderRadius: 8,
              yAxisID: "y"
            },
            {
              type: "line",
              label: "Reject %",
              data: dailySeries.map((item) => Number(item.pct.toFixed(2))),
              borderColor: "#f87171",
              pointBackgroundColor: "#f87171",
              pointBorderColor: "#f87171",
              pointRadius: 3,
              pointHoverRadius: 5,
              tension: 0.4,
              fill: false,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false
          },
          onHover(_event, elements) {
            if (!elements.length) {
              clearTableHoverHighlight();
              return;
            }

            const index = elements[0].index;
            const hoveredDate = dailySeries[index]?.date;

            if (!hoveredDate) {
              clearTableHoverHighlight();
              return;
            }

            highlightTableRowsFromChart(
              (row) => row.dataset.date === hoveredDate,
              `date ${hoveredDate}`
            );
          },
          onClick(_event, elements) {
            if (!elements.length) {
              applyChartFocus({ focusDate: "", focusWeek: "", focusCategory: "" });
              return;
            }

            const index = elements[0].index;
            const clickedDate = dailySeries[index]?.date || "";
            applyChartFocus({
              focusDate: FILTER_STATE.focusDate === clickedDate ? "" : clickedDate,
              focusWeek: "",
              focusCategory: ""
            });
          },
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                label(context) {
                  const value = context.parsed.y;
                  return context.dataset.label === "Reject %"
                    ? ` ${context.dataset.label}: ${formatNumber(value, 2)}%`
                    : ` ${context.dataset.label}: ${formatNumber(value)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            },
            y1: {
              beginAtZero: true,
              position: "right",
              ticks: {
                color: "#5a6a85",
                callback: (value) => `${value}%`
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      });

      chartInstances.top = new Chart(chTop, {
        type: "bar",
        data: {
          labels: topProducts.map((item) => shortenLabel(item.name)),
          datasets: [
            {
              label: "Rejected Qty",
              data: topProducts.map((item) => item.rejected),
              backgroundColor: topProducts.map((_, index) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]),
              borderRadius: 10,
              datalabels: {
                display: true,
                color: "#ffffff",
                anchor: "end",
                align: "right",
                formatter(value) {
                  return formatNumber(value);
                }
              }
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          onHover(_event, elements) {
            if (!elements.length) {
              clearTableHoverHighlight();
              return;
            }

            const index = elements[0].index;
            const hoveredCode = topProducts[index]?.code;

            if (!hoveredCode) {
              clearTableHoverHighlight();
              return;
            }

            highlightTableRowsFromChart(
              (row) => row.dataset.code === hoveredCode,
              `code ${hoveredCode}`
            );
          },
          onClick(_event, elements) {
            if (!elements.length) {
              applyChartFocus({ codes: [], focusDate: "", focusWeek: "", focusCategory: "" });
              return;
            }

            const index = elements[0].index;
            const clickedCode = topProducts[index]?.code || "";
            const nextCodes = FILTER_STATE.codes.length === 1 && FILTER_STATE.codes[0] === clickedCode ? [] : [clickedCode];

            applyChartFocus({
              codes: nextCodes,
              focusDate: "",
              focusWeek: "",
              focusCategory: ""
            });
          },
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                title(items) {
                  return topProducts[items[0]?.dataIndex]?.name || "";
                },
                label(context) {
                  return ` Rejected Qty: ${formatNumber(context.parsed.x)}`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      });

      chartInstances.rate = new Chart(chRate, {
        type: "bar",
        data: {
          labels: topRates.map((item) => item.code),
          datasets: [
            {
              label: "Max Reject %",
              data: topRates.map((item) => Number(item.pct.toFixed(2))),
              backgroundColor: topRates.map((item) => {
                if (item.pct > 10) return "#f87171";
                if (item.pct > 5) return "#fb923c";
                if (item.pct > 2) return "#fbbf24";
                return "#4f8ff7";
              }),
              borderRadius: 10,
              datalabels: {
                display: true,
                color: "#ffffff",
                anchor: "end",
                align: "right",
                formatter(value) {
                  return `${formatNumber(value, 2)}%`;
                }
              }
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          onHover(_event, elements) {
            if (!elements.length) {
              clearTableHoverHighlight();
              return;
            }

            const index = elements[0].index;
            const hoveredCode = topRates[index]?.code;

            if (!hoveredCode) {
              clearTableHoverHighlight();
              return;
            }

            highlightTableRowsFromChart(
              (row) => row.dataset.code === hoveredCode,
              `max reject rate for ${hoveredCode}`
            );
          },
          onClick(_event, elements) {
            if (!elements.length) {
              applyChartFocus({ codes: [], focusDate: "", focusWeek: "", focusCategory: "" });
              return;
            }

            const index = elements[0].index;
            const clickedCode = topRates[index]?.code || "";
            const nextCodes = FILTER_STATE.codes.length === 1 && FILTER_STATE.codes[0] === clickedCode ? [] : [clickedCode];

            applyChartFocus({
              codes: nextCodes,
              focusDate: "",
              focusWeek: "",
              focusCategory: ""
            });
          },
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                title(items) {
                  const item = topRates[items[0]?.dataIndex];
                  return item ? `${item.code} · ${item.name}` : "";
                },
                label(context) {
                  return ` Max Reject %: ${formatNumber(context.parsed.x, 2)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                color: "#5a6a85",
                callback: (value) => `${value}%`
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      });

      chartInstances.week = new Chart(chWeek, {
        type: "bar",
        data: {
          labels: weeklySeries.map((item) => `Week ${item.week}`),
          datasets: [
            {
              label: "Produced",
              data: weeklySeries.map((item) => item.produced),
              backgroundColor: "rgba(79, 143, 247, 0.6)",
              borderColor: "#4f8ff7",
              borderWidth: 1.5,
              borderRadius: 8,
              yAxisID: "y"
            },
            {
              label: "Rejected",
              data: weeklySeries.map((item) => item.rejected),
              backgroundColor: "rgba(248, 113, 113, 0.8)",
              borderColor: "#f87171",
              borderWidth: 1.5,
              borderRadius: 8,
              yAxisID: "y1"
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onHover(_event, elements) {
            if (!elements.length) {
              clearTableHoverHighlight();
              return;
            }

            const index = elements[0].index;
            const hoveredWeek = weeklySeries[index] ? `${weeklySeries[index].year}-W${String(weeklySeries[index].week).padStart(2, "0")}` : "";

            if (!hoveredWeek) {
              clearTableHoverHighlight();
              return;
            }

            highlightTableRowsFromChart(
              (row) => row.dataset.week === hoveredWeek,
              `week ${hoveredWeek}`
            );
          },
          onClick(_event, elements) {
            if (!elements.length) {
              applyChartFocus({ focusWeek: "", focusDate: "", focusCategory: "" });
              return;
            }

            const index = elements[0].index;
            const clickedWeek = weeklySeries[index] ? `${weeklySeries[index].year}-W${String(weeklySeries[index].week).padStart(2, "0")}` : "";
            applyChartFocus({
              focusWeek: FILTER_STATE.focusWeek === clickedWeek ? "" : clickedWeek,
              focusDate: "",
              focusCategory: ""
            });
          },
          plugins: {
            legend: getBaseLegendOptions(),
            tooltip: getBaseTooltipOptions()
          },
          scales: {
            x: {
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            },
            y1: {
              beginAtZero: true,
              position: "right",
              ticks: {
                color: "#5a6a85"
              },
              grid: {
                color: getGridColor()
              }
            }
          }
        }
      });

      chartInstances.pie = new Chart(chPie, {
        type: "doughnut",
        data: {
          labels: categorySeries.map((item) => item.category),
          datasets: [
            {
              data: categorySeries.map((item) => item.rejected),
              backgroundColor: categorySeries.map((_, index) => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]),
              borderColor: "#0b1022",
              borderWidth: 2,
              datalabels: {
                display: true,
                color: "#ffffff",
                formatter(value, context) {
                  const total = context.dataset.data.reduce((sum, item) => sum + item, 0);
                  const pct = total > 0 ? (value / total) * 100 : 0;
                  return `${pct.toFixed(1)}%`;
                }
              }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "55%",
          onHover(_event, elements) {
            if (!elements.length) {
              clearTableHoverHighlight();
              return;
            }

            const index = elements[0].index;
            const hoveredCategory = categorySeries[index]?.category;

            if (!hoveredCategory) {
              clearTableHoverHighlight();
              return;
            }

            highlightTableRowsFromChart(
              (row) => row.dataset.category === hoveredCategory,
              `category ${hoveredCategory}`
            );
          },
          onClick(_event, elements) {
            if (!elements.length) {
              applyChartFocus({ focusCategory: "", focusDate: "", focusWeek: "" });
              return;
            }

            const index = elements[0].index;
            const clickedCategory = categorySeries[index]?.category || "";
            applyChartFocus({
              focusCategory: FILTER_STATE.focusCategory === clickedCategory ? "" : clickedCategory,
              focusDate: "",
              focusWeek: ""
            });
          },
          plugins: {
            legend: getBaseLegendOptions("right"),
            tooltip: {
              ...getBaseTooltipOptions(),
              callbacks: {
                label(context) {
                  const total = context.dataset.data.reduce((sum, item) => sum + item, 0);
                  const value = context.parsed;
                  const pct = total > 0 ? (value / total) * 100 : 0;
                  return ` ${context.label}: ${formatNumber(value)} rejected (${formatNumber(pct, 1)}%)`;
                }
              }
            }
          }
        }
      });

      trendMeta.textContent = `${formatNumber(dailySeries.length)} daily points in the active view`;
      topMeta.textContent = `Top ${formatNumber(topProducts.length)} aggregated products by rejected quantity`;
      rateMeta.textContent = `Top ${formatNumber(topRates.length)} product codes by maximum reject %`;
      weekMeta.textContent = `${formatNumber(weeklySeries.length)} ISO weeks in the active view`;
      pieMeta.textContent = `${formatNumber(categorySeries.length)} derived product categories`;
    }

    function renderPeriodComparison(summary, comparisonSummary, comparisonWindow) {
      if (!comparisonSummary || !comparisonWindow || !comparisonSummary.totalRecords) {
        compareMeta.textContent = "No prior equivalent period available";
        periodCompareList.innerHTML = `
          <li>
            <strong>Comparison baseline unavailable</strong>
            <span>The active filtered slice does not have an earlier matching window in the loaded source.</span>
          </li>
        `;
        return;
      }

      compareMeta.textContent = `${fromIsoDate(comparisonWindow.startDate)} to ${fromIsoDate(comparisonWindow.endDate)}`;
      const rows = [
        {
          label: "Produced output",
          current: `${formatNumber(summary.totalProduced)} units`,
          previous: `${formatNumber(comparisonSummary.totalProduced)} units`,
          delta: getDeltaDescriptor(summary.totalProduced, comparisonSummary.totalProduced)
        },
        {
          label: "Rejected quantity",
          current: `${formatNumber(summary.totalRejected)} rejects`,
          previous: `${formatNumber(comparisonSummary.totalRejected)} rejects`,
          delta: getDeltaDescriptor(summary.totalRejected, comparisonSummary.totalRejected, { inverseGood: true })
        },
        {
          label: "Portfolio rejection rate",
          current: `${formatNumber(summary.avgRate, 2)}%`,
          previous: `${formatNumber(comparisonSummary.avgRate, 2)}%`,
          delta: getDeltaDescriptor(summary.avgRate, comparisonSummary.avgRate, { mode: "points", decimals: 2, inverseGood: true })
        }
      ];

      periodCompareList.innerHTML = rows.map((row) => `
        <li>
          <strong>${row.label}</strong>
          <div class="compare-value-row">
            <span class="compare-current">${row.current}</span>
            <span class="compare-previous">Prev: ${row.previous}</span>
            <span class="compare-badge ${row.delta.tone}">${row.delta.text}</span>
          </div>
        </li>
      `).join("");
    }

    function renderSummaryPanel(summary) {
      snapshotRange.textContent = `${formatShortDate(summary.startDate)} to ${formatShortDate(summary.endDate)}`;
      snapshotText.textContent = `The current rejection window covers ${summary.totalRecords} production entries across ${summary.uniqueCodes} unique product codes. The highest rejection pressure is concentrated in ${summary.topRejected.code}, while the steepest rejection rate appears in ${summary.topRate.code}.`;

      setMiniListContent(snapshotList, [
        {
          label: "Primary pressure point",
          value: formatTag("red", `${summary.topRejected.code} · ${formatNumber(summary.topRejected.rejected)} rejects`)
        },
        {
          label: "Highest severity rate",
          value: formatTag("orange", `${summary.topRate.code} · ${formatNumber(summary.topRate.weightedPct, 2)}%`)
        },
        {
          label: "Operational priority",
          value: formatTag("green", `${summary.criticalCount} critical records`)
        }
      ]);
    }

    function buildExecutiveFallbackPackage(summary) {
      return {
        snapshotText: `The current rejection window covers ${formatNumber(summary.totalRecords)} production entries across ${formatNumber(summary.uniqueCodes)} unique product codes. The highest rejection pressure is concentrated in ${summary.topRejected.code}, while the steepest rejection rate appears in ${summary.topRate.code}.`,
        snapshotItems: [
          {
            label: "Primary pressure point",
            value: formatTag("red", `${summary.topRejected.code} · ${formatNumber(summary.topRejected.rejected)} rejects`)
          },
          {
            label: "Highest severity rate",
            value: formatTag("orange", `${summary.topRate.code} · ${formatNumber(summary.topRate.weightedPct, 2)}%`)
          },
          {
            label: "Operational priority",
            value: formatTag("green", `${summary.criticalCount} critical records`)
          }
        ],
        markdown: `
### Executive Takeaways

- The dataset contains **${formatNumber(summary.totalProduced)}** produced units and **${formatNumber(summary.totalRejected)}** rejected units.
- The portfolio-level rejection rate is **${formatNumber(summary.avgRate, 2)}%** across **${formatNumber(summary.totalRecords)}** records.
- There are **${formatNumber(summary.criticalCount)}** critical records above the 5% rejection threshold.

### Main Signals

- The highest rejection volume comes from **${summary.topRejected.name}** \`${summary.topRejected.code}\` with **${formatNumber(summary.topRejected.rejected)}** rejected units.
- The highest weighted rejection rate belongs to **${summary.topRate.name}** \`${summary.topRate.code}\` at **${formatNumber(summary.topRate.weightedPct, 2)}%**.
- The lowest weighted rejection rate in the active mix is **${summary.lowestRate.code}** at **${formatNumber(summary.lowestRate.weightedPct, 2)}%**.

### Recommended Focus

- Start root-cause review on **${summary.topRate.code}** because the rate severity is materially above the rest of the portfolio.
- Investigate repeat quality pressure on **${summary.repeatCode.code}**, which appears in **${summary.repeatCode.records}** separate entries.
- If customer-level analysis is needed, the source CSV should be extended with account or customer identifiers.
        `,
        reportNote: `${summary.topRejected.code} is the largest rejection-volume driver with ${formatNumber(summary.topRejected.rejected)} rejected units, while ${summary.topRate.code} holds the highest weighted rejection rate at ${formatNumber(summary.topRate.weightedPct, 2)}% in the active view.`,
        mode: "fallback",
        status: `Local numeric narrative • ${formatNumber(summary.totalRecords)} live records`
      };
    }

    function applyExecutiveNarrativePackage(summary, narrativePackage) {
      if (!summary || !narrativePackage) {
        return;
      }

      snapshotRange.textContent = `${formatShortDate(summary.startDate)} to ${formatShortDate(summary.endDate)}`;
      snapshotText.textContent = narrativePackage.snapshotText;
      setMiniListContent(snapshotList, narrativePackage.snapshotItems);
      markdownShell.innerHTML = marked.parse(narrativePackage.markdown);
      markdownMeta.textContent = narrativePackage.status;
      LAST_EXECUTIVE_AI = narrativePackage;
    }

    function buildExecutiveAiPayload(summary) {
      return {
        window: {
          startDate: summary.startDate,
          endDate: summary.endDate,
          focus: getCurrentFocusSummary()
        },
        metrics: {
          produced: Number(summary.totalProduced.toFixed(2)),
          rejected: Number(summary.totalRejected.toFixed(2)),
          rejectRate: Number(summary.avgRate.toFixed(2)),
          totalRecords: summary.totalRecords,
          criticalRows: summary.criticalCount,
          uniqueCodes: summary.uniqueCodes
        },
        topRejected: {
          code: summary.topRejected.code,
          name: summary.topRejected.name,
          produced: Number(summary.topRejected.produced.toFixed(2)),
          rejected: Number(summary.topRejected.rejected.toFixed(2)),
          rejectRate: Number(summary.topRejected.weightedPct.toFixed(2)),
          records: summary.topRejected.records
        },
        topRate: {
          code: summary.topRate.code,
          name: summary.topRate.name,
          produced: Number(summary.topRate.produced.toFixed(2)),
          rejected: Number(summary.topRate.rejected.toFixed(2)),
          rejectRate: Number(summary.topRate.weightedPct.toFixed(2)),
          records: summary.topRate.records
        },
        repeatCode: {
          code: summary.repeatCode.code,
          name: summary.repeatCode.name,
          records: summary.repeatCode.records,
          rejected: Number(summary.repeatCode.rejected.toFixed(2))
        }
      };
    }

    async function callExecutiveAiRender(payload) {
      if (!REMOTE_AI_ENABLED) {
        throw new Error("REMOTE_AI_DISABLED_FOR_FILE_PROTOCOL");
      }

      const messages = [
        {
          role: "system",
          content: "You are an operations intelligence writer for a medical products dashboard. Use only the provided numbers. Do not infer causes, suppliers, machines, operators, customers, or corrective actions unless they are explicitly in the data. Write in English. Return strict JSON with keys snapshotText, snapshotItems, markdown, and reportNote. snapshotItems must be an array of exactly 3 objects with keys label and value. markdown must be valid markdown."
        },
        {
          role: "user",
          content: `Create executive dashboard commentary for the current live view using only this numeric payload:\n${JSON.stringify(payload)}`
        }
      ];

      const providers = [
        { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
        { provider: "deepseek", model: "deepseek-chat" }
      ];

      let lastError = null;

      for (const current of providers) {
        try {
          const response = await fetch(AI_RENDER_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: current.provider,
              model: current.model,
              messages,
              max_tokens: 1100,
              temperature: 0.2
            })
          });

          if (!response.ok) {
            throw new Error(`AI API ${response.status}`);
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content || "";
          const parsed = parseAiJson(content);

          if (
            parsed?.snapshotText &&
            Array.isArray(parsed.snapshotItems) &&
            parsed?.markdown &&
            parsed?.reportNote
          ) {
            return {
              snapshotText: parsed.snapshotText,
              snapshotItems: parsed.snapshotItems.slice(0, 3).map((item, index) => ({
                label: item?.label || `Signal ${index + 1}`,
                value: item?.value || ""
              })),
              markdown: parsed.markdown,
              reportNote: parsed.reportNote,
              provider: current.provider
            };
          }

          throw new Error("Executive AI response JSON invalid");
        } catch (error) {
          lastError = error;
        }
      }

      throw lastError || new Error("Executive AI commentary unavailable");
    }

    async function hydrateExecutiveAi(summary) {
      const fallback = buildExecutiveFallbackPackage(summary);
      const cacheKey = JSON.stringify(buildExecutiveAiPayload(summary));

      if (EXEC_AI_CACHE.has(cacheKey)) {
        const cached = EXEC_AI_CACHE.get(cacheKey);
        applyExecutiveNarrativePackage(summary, cached);
        return;
      }

      applyExecutiveNarrativePackage(summary, {
        ...fallback,
        status: `Generating AI commentary • ${formatNumber(summary.totalRecords)} live records`
      });

      const requestId = ++executiveAiRequestId;

      try {
        const aiResult = await callExecutiveAiRender(buildExecutiveAiPayload(summary));

        if (requestId !== executiveAiRequestId) {
          return;
        }

        const normalized = {
          snapshotText: aiResult.snapshotText,
          snapshotItems: aiResult.snapshotItems,
          markdown: aiResult.markdown,
          reportNote: aiResult.reportNote,
          mode: "success",
          status: `AI executive narrative via ${aiResult.provider}`
        };

        EXEC_AI_CACHE.set(cacheKey, normalized);
        applyExecutiveNarrativePackage(summary, normalized);
      } catch (_error) {
        if (requestId !== executiveAiRequestId) {
          return;
        }

        EXEC_AI_CACHE.set(cacheKey, fallback);
        applyExecutiveNarrativePackage(summary, fallback);
      }
    }

    function renderBreakdownLists(summary) {
      setMiniListContent(productBreakdownList, [
        {
          label: "Top rejected product",
          value: `${summary.topRejected.code} · ${formatNumber(summary.topRejected.rejected)}`
        },
        {
          label: "Most stable product",
          value: `${summary.lowestRate.code} · ${formatNumber(summary.lowestRate.weightedPct, 2)}%`
        },
        {
          label: "Emerging outlier",
          value: `${summary.topRate.code} · ${formatNumber(summary.topRate.weightedPct, 2)}%`
        }
      ]);

      setMiniListContent(actionQueueList, [
        {
          label: "Escalate immediate review",
          value: `${summary.topRate.code} at ${formatNumber(summary.topRate.weightedPct, 2)}%`
        },
        {
          label: "Investigate volume loss",
          value: `${summary.topRejected.code} with ${formatNumber(summary.topRejected.rejected)} rejects`
        },
        {
          label: "Monitor repeat pressure",
          value: `${summary.repeatCode.code} appears in ${summary.repeatCode.records} records`
        }
      ]);
    }

    function renderAlerts(summary) {
      const alerts = [
        {
          className: "critical",
          title: "Highest Severity Alert",
          body: `${summary.topRate.code} is leading the filtered portfolio at ${formatNumber(summary.topRate.weightedPct, 2)}% weighted rejection rate and needs immediate review.`
        },
        {
          className: "warning",
          title: "Volume Loss Alert",
          body: `${summary.topRejected.code} is driving the largest rejection volume with ${formatNumber(summary.topRejected.rejected)} rejected units in the current view.`
        },
        {
          className: "info",
          title: "Coverage Alert",
          body: `${formatNumber(summary.uniqueCodes)} codes are active in this slice, with ${formatNumber(summary.criticalCount)} critical rows and ${formatNumber(summary.totalRecords)} total records.`
        }
      ];

      alertGrid.innerHTML = alerts.map((alert) => `
        <article class="alert-card ${alert.className}">
          <strong>${alert.title}</strong>
          <p>${alert.body}</p>
        </article>
      `).join("");
    }

    function renderTable(filterText = "", filterSeverity = "") {
      clearChartHoverSync();
      clearTableHoverHighlight();
      const normalizedFilter = String(filterText || "").trim().toLowerCase();
      const filteredRows = DATA
        .filter((item) => {
          if (!normalizedFilter) {
            return true;
          }

          return [item.date, item.code, item.name]
            .some((value) => String(value).toLowerCase().includes(normalizedFilter));
        })
        .filter((item) => matchesSeverityFilter(item.pct, filterSeverity))
        .sort(compareTableRows);

      const selectedIndex = SELECTED_ROW_KEY
        ? filteredRows.findIndex((item) => buildRowKey(item) === SELECTED_ROW_KEY)
        : -1;

      if (selectedIndex >= 0) {
        TABLE_CURSOR_INDEX = selectedIndex;
      }
      TABLE_CURSOR_INDEX = Math.min(TABLE_CURSOR_INDEX, Math.max(filteredRows.length - 1, 0));

      const rows = filteredRows.length
        ? filteredRows.map((item, index) => {
          const rowKey = buildRowKey(item);
          const severityClass = getTableSeverityClass(item.pct);
          const isFocused = SELECTED_ROW_KEY && SELECTED_ROW_KEY === rowKey;
          const rowClass = [
            item.pct > 5 ? "critical-row" : "",
            isFocused ? "focused-row" : ""
          ].filter(Boolean).join(" ");
          const shortName = truncateText(item.name, 45);

          return `
          <tr
            class="${rowClass}"
            data-row-key="${rowKey}"
            data-date="${item.date}"
            data-code="${item.code}"
            data-week="${buildWeekKey(item.date)}"
            data-category="${getCategoryFromName(item.name)}"
            data-row-index="${index}"
            tabindex="${index === TABLE_CURSOR_INDEX ? "0" : "-1"}"
          >
            <td>${formatLongDate(item.date)}</td>
            <td><span class="code-pill">${item.code}</span></td>
            <td><span class="product-name" title="${escapeHtml(item.name)}">${escapeHtml(shortName)}</span></td>
            <td>${formatNumber(item.produced)}</td>
            <td>${formatNumber(item.rejected)}</td>
            <td><span class="status-badge ${severityClass}">${formatNumber(item.pct, 2)}%</span></td>
          </tr>
        `;
        }).join("")
        : `<tr><td class="table-empty" colspan="6">No records match the current table filters.</td></tr>`;

      tblBody.innerHTML = rows;
      tblCnt.textContent = `${formatNumber(filteredRows.length)} records`;
      updateTableSortIndicators();
      updateTableMeta();

      tblBody.querySelectorAll("tr[data-row-key]").forEach((row) => {
        row.addEventListener("focus", () => {
          TABLE_CURSOR_INDEX = Number(row.dataset.rowIndex || 0);
          const rowKey = row.dataset.rowKey || "";
          const item = filteredRows.find((entry) => buildRowKey(entry) === rowKey);
          syncChartsFromHover(item || null);
        });

        row.addEventListener("blur", () => {
          clearChartHoverSync();
        });

        row.addEventListener("mouseenter", () => {
          const rowKey = row.dataset.rowKey || "";
          const item = filteredRows.find((entry) => buildRowKey(entry) === rowKey);
          syncChartsFromHover(item || null);
        });

        row.addEventListener("mouseleave", () => {
          clearChartHoverSync();
        });

        row.addEventListener("click", () => {
          const rowKey = row.dataset.rowKey || "";
          const item = filteredRows.find((entry) => buildRowKey(entry) === rowKey);

          if (!item) {
            return;
          }

          const sameSelection = SELECTED_ROW_KEY === rowKey &&
            FILTER_STATE.focusDate === item.date &&
            FILTER_STATE.focusWeek === buildWeekKey(item.date) &&
            FILTER_STATE.focusCategory === getCategoryFromName(item.name) &&
            FILTER_STATE.codes.length === 1 &&
            FILTER_STATE.codes[0] === item.code;

          if (sameSelection) {
            SELECTED_ROW_KEY = "";
            applyChartFocus({
              focusDate: "",
              focusWeek: "",
              focusCategory: "",
              codes: []
            });
            return;
          }

          focusFromTableRow(item);
        });

        row.addEventListener("keydown", (event) => {
          const rowIndex = Number(row.dataset.rowIndex || 0);

          if (event.key === "ArrowDown") {
            event.preventDefault();
            const nextRow = tblBody.querySelector(`tr[data-row-index="${Math.min(rowIndex + 1, filteredRows.length - 1)}"]`);
            nextRow?.focus();
            return;
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            const nextRow = tblBody.querySelector(`tr[data-row-index="${Math.max(rowIndex - 1, 0)}"]`);
            nextRow?.focus();
            return;
          }

          if (event.key === "Home") {
            event.preventDefault();
            tblBody.querySelector(`tr[data-row-index="0"]`)?.focus();
            return;
          }

          if (event.key === "End") {
            event.preventDefault();
            tblBody.querySelector(`tr[data-row-index="${Math.max(filteredRows.length - 1, 0)}"]`)?.focus();
            return;
          }

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            row.click();
            return;
          }

          if (event.key.toLowerCase() === "p") {
            event.preventDefault();
            const rowKey = row.dataset.rowKey || "";
            const item = filteredRows.find((entry) => buildRowKey(entry) === rowKey);
            if (item) {
              addPinnedItem({
                id: `row:${buildRowKey(item)}`,
                type: "row",
                title: `${item.code} · ${item.date}`,
                body: item.name,
                meta: `Produced ${formatNumber(item.produced)} · Rejected ${formatNumber(item.rejected)} · ${formatNumber(item.pct, 2)}%`
              });
            }
          }
        });
      });

      tblBody.addEventListener("mouseleave", () => {
        clearChartHoverSync();
        clearTableHoverHighlight();
      }, { once: true });

      scrollToFocusedRow();
    }

    function renderNarrative(summary) {
      const markdown = `
### Executive Takeaways

- The dataset contains **${formatNumber(summary.totalProduced)}** produced units and **${formatNumber(summary.totalRejected)}** rejected units.
- The portfolio-level rejection rate is **${formatNumber(summary.avgRate, 2)}%** across **${formatNumber(summary.totalRecords)}** records.
- There are **${formatNumber(summary.criticalCount)}** critical records above the 5% rejection threshold.

### Main Signals

- The highest rejection volume comes from **${summary.topRejected.name}** \`${summary.topRejected.code}\` with **${formatNumber(summary.topRejected.rejected)}** rejected units.
- The highest weighted rejection rate belongs to **${summary.topRate.name}** \`${summary.topRate.code}\` at **${formatNumber(summary.topRate.weightedPct, 2)}%**.
- The lowest weighted rejection rate in the active mix is **${summary.lowestRate.code}** at **${formatNumber(summary.lowestRate.weightedPct, 2)}%**.

### Recommended Focus

- Start root-cause review on **${summary.topRate.code}** because the rate severity is materially above the rest of the portfolio.
- Investigate repeat quality pressure on **${summary.repeatCode.code}**, which appears in **${summary.repeatCode.records}** separate entries.
- If customer-level analysis is needed, the source CSV should be extended with account or customer identifiers.
      `;

      markdownShell.innerHTML = marked.parse(markdown);
      markdownMeta.textContent = `Generated from ${formatNumber(summary.totalRecords)} live records`;
    }

    function buildExportMetaLines() {
      return [
        `Filters: ${getCurrentFocusSummary()}`,
        `Pinned items: ${PINNED_ITEMS.length ? PINNED_ITEMS.map((item) => item.title).join(" | ") : "None"}`
      ];
    }

    function stripHtmlTags(value) {
      return String(value || "").replace(/<[^>]+>/g, "");
    }

    function buildAiRows(source = []) {
      return source.map((item) => ({
        date: item.date,
        code: item.code,
        name: item.name,
        category: getCategoryFromName(item.name),
        produced: Number(item.produced.toFixed(2)),
        rejected: Number(item.rejected.toFixed(2)),
        rejectRate: Number(item.pct.toFixed(2))
      }));
    }

    function getAiContextSnapshot() {
      const recentWindow = getLatestTenDayWindow(RAW_DATA);
      const priorWindow = getPriorTenDayWindow(RAW_DATA);
      const recentSummary = recentWindow.rows.length ? calculateMetrics(recentWindow.rows) : null;
      const priorSummary = priorWindow.rows.length ? calculateMetrics(priorWindow.rows) : null;

      const byCode = VIEW_DATA.length ? aggregateByCode(VIEW_DATA) : [];
      const top5BySeverity = byCode
        .slice()
        .sort((a, b) => b.weightedPct - a.weightedPct)
        .slice(0, 5)
        .map((item) => ({
          code: item.code,
          name: item.name,
          rejectRate: Number(item.weightedPct.toFixed(2)),
          rejected: item.rejected,
          produced: item.produced,
          records: item.records
        }));

      const top5ByVolume = byCode
        .slice()
        .sort((a, b) => b.rejected - a.rejected)
        .slice(0, 5)
        .map((item) => ({
          code: item.code,
          name: item.name,
          rejected: item.rejected,
          rejectRate: Number(item.weightedPct.toFixed(2)),
          produced: item.produced
        }));

      const categoryBreakdown = Array.from(
        VIEW_DATA.reduce((map, item) => {
          const category = getCategoryFromName(item.name);
          const current = map.get(category) || { category, produced: 0, rejected: 0, count: 0 };
          current.produced += item.produced;
          current.rejected += item.rejected;
          current.count += 1;
          map.set(category, current);
          return map;
        }, new Map()).values()
      )
        .map((item) => ({ ...item, rejectRate: item.produced > 0 ? Number(((item.rejected / item.produced) * 100).toFixed(2)) : 0 }))
        .sort((a, b) => b.rejected - a.rejected)
        .slice(0, 8);

      const dailySeries = VIEW_DATA.length ? aggregateByDate(VIEW_DATA) : [];
      const trendDirection = dailySeries.length >= 3
        ? (() => {
          const last3 = dailySeries.slice(-3).map((d) => d.pct);
          const first3 = dailySeries.slice(0, 3).map((d) => d.pct);
          const lastAvg = last3.reduce((s, v) => s + v, 0) / last3.length;
          const firstAvg = first3.reduce((s, v) => s + v, 0) / first3.length;
          if (lastAvg > firstAvg * 1.15) return "worsening";
          if (lastAvg < firstAvg * 0.85) return "improving";
          return "stable";
        })()
        : "insufficient_data";

      return {
        hasData: RAW_DATA.length > 0,
        focusSummary: getCurrentFocusSummary(),
        rawCount: RAW_DATA.length,
        mappedCount: DATA.length,
        viewCount: VIEW_DATA.length,
        trendDirection,
        top5BySeverity,
        top5ByVolume,
        categoryBreakdown,
        summary: LAST_SUMMARY ? {
          totalProduced: Number(LAST_SUMMARY.totalProduced.toFixed(2)),
          totalRejected: Number(LAST_SUMMARY.totalRejected.toFixed(2)),
          avgRate: Number(LAST_SUMMARY.avgRate.toFixed(2)),
          totalRecords: LAST_SUMMARY.totalRecords,
          criticalCount: LAST_SUMMARY.criticalCount,
          uniqueCodes: LAST_SUMMARY.uniqueCodes,
          startDate: LAST_SUMMARY.startDate,
          endDate: LAST_SUMMARY.endDate,
          topRejected: LAST_SUMMARY.topRejected ? {
            code: LAST_SUMMARY.topRejected.code,
            name: LAST_SUMMARY.topRejected.name,
            rejected: Number(LAST_SUMMARY.topRejected.rejected.toFixed(2)),
            rejectRate: Number(LAST_SUMMARY.topRejected.weightedPct.toFixed(2))
          } : null,
          topRate: LAST_SUMMARY.topRate ? {
            code: LAST_SUMMARY.topRate.code,
            name: LAST_SUMMARY.topRate.name,
            rejected: Number(LAST_SUMMARY.topRate.rejected.toFixed(2)),
            rejectRate: Number(LAST_SUMMARY.topRate.weightedPct.toFixed(2))
          } : null
        } : null,
        recentWindow: {
          dates: recentWindow.dates.slice(),
          summary: recentSummary ? {
            totalProduced: Number(recentSummary.totalProduced.toFixed(2)),
            totalRejected: Number(recentSummary.totalRejected.toFixed(2)),
            avgRate: Number(recentSummary.avgRate.toFixed(2)),
            totalRecords: recentSummary.totalRecords,
            criticalCount: recentSummary.criticalCount
          } : null,
          rows: buildAiRows(recentWindow.rows)
        },
        priorWindow: {
          dates: priorWindow.dates.slice(),
          summary: priorSummary ? {
            totalProduced: Number(priorSummary.totalProduced.toFixed(2)),
            totalRejected: Number(priorSummary.totalRejected.toFixed(2)),
            avgRate: Number(priorSummary.avgRate.toFixed(2)),
            totalRecords: priorSummary.totalRecords,
            criticalCount: priorSummary.criticalCount
          } : null,
          rows: buildAiRows(priorWindow.rows)
        },
        viewRows: buildAiRows(VIEW_DATA),
        recentAiStatus: recentAiStatus?.textContent || "",
        executiveAiStatus: markdownMeta?.textContent || ""
      };
    }

    function syncStoredGeminiKey() {
      if (!aiKeyInput) {
        return;
      }

      const savedKey = window.localStorage.getItem(GEMINI_KEY_STORAGE);

      if (savedKey && !aiKeyInput.value.trim()) {
        aiKeyInput.value = savedKey;
      }
    }

    function syncStoredGeminiModel() {
      if (!aiModelSelect) {
        return;
      }

      const savedModel = window.localStorage.getItem(GEMINI_MODEL_STORAGE);

      if (savedModel) {
        const matchingOption = Array.from(aiModelSelect.options).find((opt) => opt.value === savedModel);
        if (matchingOption) {
          aiModelSelect.value = savedModel;
        }
      }

      aiModelSelect.addEventListener("change", () => {
        window.localStorage.setItem(GEMINI_MODEL_STORAGE, aiModelSelect.value);
      });
    }

    function getGeminiWeeklySummary(source = DATA) {
      if (!source.length) {
        return {
          lines: ["No rows are available in the current active dataset."],
          recentRate: 0,
          previousRate: 0
        };
      }

      const formatDateObject = (value) => fromIsoDate(value.toISOString().slice(0, 10));

      const maxDate = source.reduce((latest, item) => {
        const current = parseDmy(item.date);
        return current > latest ? current : latest;
      }, parseDmy(source[0].date));
      const recentStart = new Date(maxDate);
      recentStart.setDate(recentStart.getDate() - 6);
      const previousEnd = new Date(recentStart);
      previousEnd.setDate(previousEnd.getDate() - 1);
      const previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 6);

      const recentRows = source.filter((item) => {
        const current = parseDmy(item.date);
        return current >= recentStart && current <= maxDate;
      });
      const previousRows = source.filter((item) => {
        const current = parseDmy(item.date);
        return current >= previousStart && current <= previousEnd;
      });

      const recentMetrics = calculateMetrics(recentRows);
      const previousMetrics = calculateMetrics(previousRows);
      const keyIssues = recentRows
        .filter((item) => item.pct > 0.5)
        .sort((a, b) => b.pct - a.pct || b.rejected - a.rejected)
        .slice(0, 5);

      return {
        recentRate: recentMetrics.avgRate,
        previousRate: previousMetrics.avgRate,
        lines: [
          `Recent 7-day window: ${formatDateObject(recentStart)} to ${formatDateObject(maxDate)}.`,
          `Recent week totals: ${formatNumber(recentMetrics.totalRecords)} rows, produced ${formatNumber(recentMetrics.totalProduced)}, rejected ${formatNumber(recentMetrics.totalRejected)}, weighted reject rate ${formatNumber(recentMetrics.avgRate, 2)}%.`,
          previousRows.length
            ? `Previous 7-day window: ${formatDateObject(previousStart)} to ${formatDateObject(previousEnd)}, weighted reject rate ${formatNumber(previousMetrics.avgRate, 2)}%.`
            : "Previous 7-day comparison window is not available.",
          keyIssues.length
            ? `Highest weekly issues: ${keyIssues.map((item) => `${item.code} (${item.name}) on ${item.date}: ${formatNumber(item.rejected)} rejected / ${formatNumber(item.produced)} produced = ${formatNumber(item.pct, 2)}%`).join(" | ")}`
            : "No weekly rows exceeded the 0.5% monitoring threshold."
        ]
      };
    }

    function buildGeminiDataSummary(source = DATA) {
      if (!source.length) {
        return "No active OBM rejection rows are available in the current dataset.";
      }

      const summary = calculateMetrics(source);
      const bounds = getActiveDateBounds(source);
      const byProduct = aggregateByCode(source)
        .sort((a, b) => b.weightedPct - a.weightedPct || b.rejected - a.rejected);
      const worstByRate = byProduct.slice(0, 5);
      const worstByRejectedQty = byProduct
        .slice()
        .sort((a, b) => b.rejected - a.rejected || b.weightedPct - a.weightedPct)
        .slice(0, 5);
      const dailySeries = aggregateByDate(source);
      const weeklySummary = getGeminiWeeklySummary(source);

      /* Recurring issues: products appearing 3+ times */
      const productSeries = getProductSeries(source);
      const recurringProducts = productSeries
        .filter((entry) => entry.rows.length >= 3)
        .map((entry) => {
          const totalProduced = entry.rows.reduce((s, r) => s + r.produced, 0);
          const totalRejected = entry.rows.reduce((s, r) => s + r.rejected, 0);
          return {
            code: entry.code,
            name: entry.name,
            occurrences: entry.rows.length,
            totalRejected,
            avgPct: totalProduced > 0 ? (totalRejected / totalProduced) * 100 : 0
          };
        })
        .sort((a, b) => b.occurrences - a.occurrences || b.avgPct - a.avgPct)
        .slice(0, 8);

      /* Category breakdown */
      const categoryMap = new Map();
      source.forEach((item) => {
        const cat = getCategoryFromName(item.name);
        const cur = categoryMap.get(cat) || { category: cat, produced: 0, rejected: 0, count: 0 };
        cur.produced += item.produced;
        cur.rejected += item.rejected;
        cur.count += 1;
        categoryMap.set(cat, cur);
      });
      const categoryBreakdown = Array.from(categoryMap.values())
        .map((c) => ({ ...c, pct: c.produced > 0 ? (c.rejected / c.produced) * 100 : 0 }))
        .sort((a, b) => b.rejected - a.rejected);

      /* Escalating trends: products where latest rate > earliest rate */
      const escalating = productSeries
        .filter((entry) => entry.rows.length >= 2)
        .map((entry) => {
          const first = entry.rows[0];
          const last = entry.rows[entry.rows.length - 1];
          return { code: entry.code, name: entry.name, firstPct: first.pct, lastPct: last.pct, increase: last.pct - first.pct };
        })
        .filter((e) => e.increase > 0)
        .sort((a, b) => b.increase - a.increase)
        .slice(0, 5);

      const uniqueProductLines = byProduct.map((item) => (
        `- ${item.code} | ${item.name} | Produced ${formatNumber(item.produced)} | Rejected ${formatNumber(item.rejected)} | Reject % ${formatNumber(item.weightedPct, 2)} | Records ${formatNumber(item.records)}`
      ));
      const dailyTrendLines = dailySeries.map((item) => (
        `- ${item.date}: produced ${formatNumber(item.produced)}, rejected ${formatNumber(item.rejected)}, reject % ${formatNumber(item.pct, 2)}`
      ));

      const sections = [
        `=== OBM REJECTION DATA SUMMARY ==="`,
        `Date coverage: ${bounds ? `${fromIsoDate(bounds.start)} to ${fromIsoDate(bounds.end)}` : "N/A"}.`,
        `Total records: ${formatNumber(summary.totalRecords)}.`,
        `Total produced: ${formatNumber(summary.totalProduced)}.`,
        `Total rejected: ${formatNumber(summary.totalRejected)}.`,
        `Weighted average reject rate: ${formatNumber(summary.avgRate, 2)}%.`,
        `Critical records (>5%): ${formatNumber(summary.criticalCount)}.`,
        `Unique product codes: ${formatNumber(byProduct.length)}.`,
        "",
        "=== TOP 5 WORST PRODUCTS BY REJECT RATE ===",
        ...worstByRate.map((item, index) => `${index + 1}. ${item.code} | ${item.name} | Reject % ${formatNumber(item.weightedPct, 2)} | Rejected ${formatNumber(item.rejected)} | Produced ${formatNumber(item.produced)} | Records ${formatNumber(item.records)}`),
        "",
        "=== TOP 5 PRODUCTS BY ABSOLUTE REJECTED QUANTITY ===",
        ...worstByRejectedQty.map((item, index) => `${index + 1}. ${item.code} | ${item.name} | Rejected ${formatNumber(item.rejected)} | Reject % ${formatNumber(item.weightedPct, 2)} | Produced ${formatNumber(item.produced)}`),
        "",
        "=== PRODUCT CATEGORY BREAKDOWN ===",
        ...categoryBreakdown.map((c) => `- ${c.category}: ${formatNumber(c.rejected)} rejected of ${formatNumber(c.produced)} produced (${formatNumber(c.pct, 2)}%), ${formatNumber(c.count)} records`),
        "",
        "=== WEEKLY ISSUES ===",
        ...weeklySummary.lines
      ];

      if (recurringProducts.length) {
        sections.push("", "=== RECURRING ISSUES (3+ OCCURRENCES) ===");
        sections.push(...recurringProducts.map((r) =>
          `- ${r.code} | ${r.name} | ${formatNumber(r.occurrences)} occurrences | ${formatNumber(r.totalRejected)} total rejected | Avg rate ${formatNumber(r.avgPct, 2)}%`
        ));
      }

      if (escalating.length) {
        sections.push("", "=== ESCALATING TRENDS (WORSENING) ===");
        sections.push(...escalating.map((e) =>
          `- ${e.code} | ${e.name} | From ${formatNumber(e.firstPct, 2)}% to ${formatNumber(e.lastPct, 2)}% (+${formatNumber(e.increase, 2)} pts)`
        ));
      }

      sections.push(
        "",
        "=== DAILY AGGREGATED TIMELINE ===",
        ...dailyTrendLines,
        "",
        "=== ALL PRODUCTS — AGGREGATED STATISTICS ===",
        ...uniqueProductLines
      );

      return sections.join("\n");
    }

    function getGeminiPromptByMode(mode) {
      const promptMap = {
        summary: "Provide a comprehensive executive summary of this OBM rejection data for senior management. Include key findings, risk areas, and overall quality status.",
        problems: "Identify the top quality problems in this data. Rank them by severity. For each problem explain what's happening and why it matters.",
        recs: "Based on this rejection data, provide specific actionable recommendations to reduce rejection rates. Prioritize by impact.",
        trends: "Analyze the trends in this rejection data over time. Are things getting better or worse? Which products are trending in the wrong direction?",
        weekly: "Generate a professional weekly quality report based on the most recent week's data. Include highlights, concerns, and action items.",
        root: "Perform a root cause analysis on the highest rejection items. What patterns suggest about potential manufacturing issues?"
      };

      if (mode === "custom") {
        return String(aiPromptInput?.value || "").trim();
      }

      return promptMap[mode] || promptMap.summary;
    }

    function setGeminiOutputState(html, mode = "normal") {
      if (!aiOutput) {
        return;
      }

      aiOutput.classList.toggle("ai-error", mode === "error");
      aiOutput.innerHTML = html;
    }

    async function askAI(mode) {
      if (!aiOutput) {
        return;
      }

      syncStoredGeminiKey();

      const typedKey = String(aiKeyInput?.value || "").trim();
      const savedKey = String(window.localStorage.getItem(GEMINI_KEY_STORAGE) || "").trim();
      const localApiKey = typedKey || savedKey;
      const useLocalKey = !!localApiKey;
      const useRenderProxy = !useLocalKey && REMOTE_AI_ENABLED;

      if (!useLocalKey && !useRenderProxy) {
        setGeminiOutputState(
          '<strong>No AI Backend Available</strong>' +
          '<p style="margin-top:10px">To enable Gemini AI analysis, either:</p>' +
          '<ul style="margin:8px 0 0 18px;line-height:1.9">' +
          '<li>Enter a Gemini API key in the API Key field above (for local testing)</li>' +
          '<li>Deploy this dashboard on Render with <code>GEMINI_API_KEY</code> set in environment variables</li>' +
          '</ul>',
          "error"
        );
        if (aiGeminiMeta) {
          aiGeminiMeta.textContent = "No AI backend available — enter a key or deploy to Render";
        }
        return;
      }

      if (!DATA.length) {
        setGeminiOutputState("<strong>Error:</strong> No active OBM data is available. Load the embedded dataset or a CSV file first.", "error");
        if (aiGeminiMeta) {
          aiGeminiMeta.textContent = "No active dataset";
        }
        return;
      }

      const prompt = getGeminiPromptByMode(mode);

      if (!prompt) {
        setGeminiOutputState("<strong>Error:</strong> Enter a custom prompt before running custom Gemini analysis.", "error");
        if (aiGeminiMeta) {
          aiGeminiMeta.textContent = "Custom prompt is empty";
        }
        return;
      }

      if (localApiKey) {
        window.localStorage.setItem(GEMINI_KEY_STORAGE, localApiKey);
      }

      const model = String(aiModelSelect?.value || "gemini-2.0-flash").trim();
      window.localStorage.setItem(GEMINI_MODEL_STORAGE, model);
      const dataSummary = buildGeminiDataSummary(DATA);
      const routeLabel = useLocalKey ? "direct Gemini API" : "Render proxy";

      setGeminiOutputState(
        '<div class="ai-spin"><div class="spinner"></div>' +
        `Analyzing ${formatNumber(DATA.length)} rows via ${routeLabel}…</div>`
      );
      if (aiGeminiMeta) {
        aiGeminiMeta.textContent = `Running ${model} on ${formatNumber(DATA.length)} active rows via ${routeLabel}`;
      }

      try {
        let responseText = "";

        if (useLocalKey) {
          /* ── LOCAL MODE: Direct Gemini API call with user-provided key ── */
          const systemInstruction = [
            "You are a Quality Control AI analyst for Mais Co., a Saudi medical products manufacturer.",
            "You are analyzing OBM (Original Brand Manufacturing) sample rejection data.",
            "Respond in clear professional English with markdown formatting.",
            "Use headings, tables, and bullet points where helpful.",
            "Be specific with numbers and product names.",
            "Structure your response for executive-level readability.",
            "Focus on actionable insights.",
            "Do not invent data that is not present in the provided dataset."
          ].join(" ");

          const fullPrompt = `${systemInstruction}\n\nHere is the data:\n\n${dataSummary}\n\n${prompt}`;

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${localApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: fullPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 8192,
                  topP: 0.95,
                  topK: 40
                }
              })
            }
          );

          if (response.status === 401 || response.status === 403) {
            throw new Error("INVALID_API_KEY");
          }
          if (response.status === 429) {
            throw new Error("RATE_LIMIT");
          }
          if (!response.ok) {
            throw new Error(`API_${response.status}`);
          }

          const payload = await response.json();
          responseText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        } else {
          /* ── PRODUCTION MODE: Route through Render backend proxy ── */
          const response = await fetch(GEMINI_PROXY_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt,
              model,
              dataSummary
            })
          });

          if (response.status === 429) {
            const body = await response.json().catch(() => ({}));
            const retryAfter = body.retryAfter || 30;
            throw new Error(`RATE_LIMIT_PROXY_${retryAfter}`);
          }
          if (response.status === 503) {
            throw new Error("SERVER_NOT_CONFIGURED");
          }
          if (response.status === 502) {
            const body = await response.json().catch(() => ({}));
            if (body.error === "UPSTREAM_AUTH_FAILED") {
              throw new Error("SERVER_KEY_INVALID");
            }
            if (body.error === "EMPTY_RESPONSE") {
              throw new Error("EMPTY_RESPONSE");
            }
            throw new Error(`PROXY_${response.status}`);
          }
          if (!response.ok) {
            throw new Error(`PROXY_${response.status}`);
          }

          const payload = await response.json();
          responseText = payload?.text || "";
        }

        if (!responseText) {
          throw new Error("EMPTY_RESPONSE");
        }

        setGeminiOutputState(marked.parse(responseText));
        if (aiGeminiMeta) {
          aiGeminiMeta.textContent = `Gemini response ready via ${model} (${routeLabel})`;
        }

      } catch (error) {
        const errorCode = String(error?.message || "");
        let title = "AI Analysis Error";
        let message = "An unexpected error happened while contacting the AI backend.";
        let suggestion = "";

        if (errorCode === "INVALID_API_KEY") {
          title = "Invalid API Key";
          message = "The Gemini API key you entered is invalid or has expired.";
          suggestion = "Double-check your key in the Google AI Studio console and paste it again.";
        } else if (errorCode === "RATE_LIMIT") {
          title = "Rate Limit Reached";
          message = "Gemini API has temporarily throttled requests from this key.";
          suggestion = "Wait 30–60 seconds, then try again. Consider upgrading your API plan for higher limits.";
        } else if (errorCode.startsWith("RATE_LIMIT_PROXY_")) {
          const seconds = errorCode.replace("RATE_LIMIT_PROXY_", "");
          title = "Rate Limit Reached";
          message = "The Render proxy has rate-limited this request.";
          suggestion = `Please wait ${seconds} seconds before trying again.`;
        } else if (errorCode === "SERVER_NOT_CONFIGURED") {
          title = "Server Not Configured";
          message = "The Render server does not have a Gemini API key configured.";
          suggestion = "Enter a local API key above, or set GEMINI_API_KEY in your Render environment variables.";
        } else if (errorCode === "SERVER_KEY_INVALID") {
          title = "Server Key Invalid";
          message = "The Gemini API key configured on the Render server is invalid or expired.";
          suggestion = "Contact the administrator to update GEMINI_API_KEY in Render environment variables, or use a local key.";
        } else if (errorCode === "EMPTY_RESPONSE") {
          title = "Empty Response";
          message = "Gemini returned an empty response for this dataset and prompt.";
          suggestion = "Try a different analysis mode or rephrase your custom prompt.";
        } else if (error instanceof TypeError) {
          title = "Network Error";
          message = "Could not reach the AI backend. This is usually a connectivity issue.";
          suggestion = "Check your internet connection. If using file:// protocol, enter a Gemini API key above for local access.";
        } else if (errorCode.startsWith("API_")) {
          title = "API Error";
          message = `Gemini API request failed with HTTP status ${errorCode.replace("API_", "")}.`;
          suggestion = "This may be a temporary issue. Wait a moment and try again.";
        } else if (errorCode.startsWith("PROXY_")) {
          title = "Proxy Error";
          message = `The Render proxy returned status ${errorCode.replace("PROXY_", "")}.`;
          suggestion = "The server may be experiencing issues. Try again later or use a local API key.";
        }

        setGeminiOutputState(
          `<strong>${escapeHtml(title)}</strong>` +
          `<p style="margin:8px 0 0">${escapeHtml(message)}</p>` +
          (suggestion ? `<p style="margin:6px 0 0;color:var(--text-muted);font-size:0.92em">💡 ${escapeHtml(suggestion)}</p>` : ""),
          "error"
        );
        if (aiGeminiMeta) {
          aiGeminiMeta.textContent = `${title} — ${routeLabel}`;
        }
      }
    }

    function emitAiBridgeUpdate() {
      window.dispatchEvent(new CustomEvent("mais-obm:data-updated", {
        detail: getAiContextSnapshot()
      }));
    }

    function detectQuestionIntent(question) {
      const q = question.toLowerCase();
      if (/trend|direction|improv|wors|better|decline|over time|pattern/.test(q)) return "trend";
      if (/product|item|code|specific|which|name/.test(q)) return "product";
      if (/risk|critical|danger|alert|severe|urgent|worst/.test(q)) return "risk";
      if (/compar|versus|vs|previous|prior|before|after|change|delta/.test(q)) return "comparison";
      if (/categor|group|family|type|class/.test(q)) return "category";
      if (/recent|latest|last|10.?day|ten.?day/.test(q)) return "recent";
      if (/summary|overview|overall|general|total|portfolio/.test(q)) return "summary";
      return "general";
    }

    function buildAiChatFallback(question, context) {
      const summary = context.summary;
      const recentSummary = context.recentWindow?.summary;
      const topRejected = summary?.topRejected;
      const topRate = summary?.topRate;
      const intent = detectQuestionIntent(question);

      if (!summary) {
        return {
          answer: "No active rows are available yet. Load the local dataset first, then ask about the latest 10 days, current filtered view, or highest-risk products.",
          bullets: [
            "The dashboard does not currently have a valid active view.",
            "Load embedded data or a mapped CSV file to enable grounded AI answers.",
            "After loading, I can answer from the real production and rejection rows."
          ],
          mode: "fallback",
          provider: "local"
        };
      }

      const trendLabel = context.trendDirection === "worsening" ? "rejection rates are trending upward"
        : context.trendDirection === "improving" ? "rejection rates are trending downward"
        : "rejection rates are relatively stable";

      const top5Sev = context.top5BySeverity || [];
      const top5Vol = context.top5ByVolume || [];
      const cats = context.categoryBreakdown || [];

      let answer = "";
      let bullets = [];

      switch (intent) {
        case "trend":
          answer = `Based on the active data, ${trendLabel} across ${formatNumber(summary.totalRecords)} records. The weighted portfolio rejection rate is ${formatNumber(summary.avgRate, 2)}%.`;
          if (recentSummary) {
            answer += ` In the latest 10 production days, the rate is ${formatNumber(recentSummary.avgRate, 2)}%.`;
          }
          bullets = [
            `Overall trend direction: ${context.trendDirection || "stable"}.`,
            top5Sev[0] ? `Highest severity product: ${top5Sev[0].code} at ${formatNumber(top5Sev[0].rejectRate, 2)}%.` : "No severity data.",
            `${formatNumber(summary.criticalCount)} critical rows exceed 5% rejection threshold.`
          ];
          break;

        case "product":
          answer = `The portfolio contains ${formatNumber(summary.uniqueCodes)} unique product codes. `;
          if (top5Vol.length) {
            answer += `Top rejection-volume products: ${top5Vol.map((p) => `${p.code} (${formatNumber(p.rejected)} rejects)`).join(", ")}.`;
          }
          bullets = [
            top5Sev[0] ? `Highest rejection rate: ${top5Sev[0].code} (${top5Sev[0].name}) at ${formatNumber(top5Sev[0].rejectRate, 2)}% with ${formatNumber(top5Sev[0].rejected)} rejects.` : "No severity data.",
            top5Vol[0] ? `Highest rejection volume: ${top5Vol[0].code} (${top5Vol[0].name}) with ${formatNumber(top5Vol[0].rejected)} rejected out of ${formatNumber(top5Vol[0].produced)} produced.` : "No volume data.",
            top5Sev.length > 1 ? `Next in severity: ${top5Sev.slice(1, 3).map((p) => `${p.code} at ${formatNumber(p.rejectRate, 2)}%`).join(", ")}.` : "Limited product data available."
          ];
          break;

        case "risk":
          answer = `There are ${formatNumber(summary.criticalCount)} critical records above the 5% threshold. `;
          if (topRate) {
            answer += `The highest-risk product is ${topRate.code} (${topRate.name}) at ${formatNumber(topRate.rejectRate, 2)}% severity.`;
          }
          bullets = [
            topRate ? `Top severity: ${topRate.code} at ${formatNumber(topRate.rejectRate, 2)}%.` : "No severity data.",
            topRejected ? `Top volume loss: ${topRejected.code} with ${formatNumber(topRejected.rejected)} rejects.` : "No volume data.",
            `${formatNumber(summary.criticalCount)} rows are flagged for executive attention.`
          ];
          break;

        case "comparison":
          if (recentSummary && context.priorWindow?.summary) {
            const prior = context.priorWindow.summary;
            const delta = recentSummary.avgRate - prior.avgRate;
            answer = `Comparing the latest 10-day window to the prior: rejection rate moved ${delta >= 0 ? "up" : "down"} by ${formatNumber(Math.abs(delta), 2)} points. Recent: ${formatNumber(recentSummary.avgRate, 2)}% vs Prior: ${formatNumber(prior.avgRate, 2)}%.`;
            bullets = [
              `Recent produced: ${formatNumber(recentSummary.totalProduced)} vs Prior: ${formatNumber(prior.totalProduced)}.`,
              `Recent rejected: ${formatNumber(recentSummary.totalRejected)} vs Prior: ${formatNumber(prior.totalRejected)}.`,
              `Direction: rejection rate is ${delta >= 0 ? "increasing" : "decreasing"} period-over-period.`
            ];
          } else {
            answer = `The active view has ${formatNumber(summary.totalRecords)} records at ${formatNumber(summary.avgRate, 2)}% weighted rate. A prior comparison window is ${context.priorWindow?.summary ? "available" : "not available"}.`;
            bullets = [
              recentSummary ? `Latest 10-day rate: ${formatNumber(recentSummary.avgRate, 2)}%.` : "No recent window.",
              `Portfolio rate: ${formatNumber(summary.avgRate, 2)}%.`,
              "Load more data or adjust filters for deeper comparison."
            ];
          }
          break;

        case "category":
          if (cats.length) {
            answer = `The data breaks into ${cats.length} product categories. Leading category by rejection volume: ${cats[0].category} with ${formatNumber(cats[0].rejected)} rejects at ${formatNumber(cats[0].rejectRate, 2)}%.`;
            bullets = cats.slice(0, 3).map((c) => `${c.category}: ${formatNumber(c.rejected)} rejects, ${formatNumber(c.rejectRate, 2)}% rate, ${formatNumber(c.count)} records.`);
          } else {
            answer = "No category breakdown is available in the current view.";
            bullets = ["Load data to enable category analysis."];
          }
          break;

        case "recent":
          if (recentSummary) {
            answer = `The latest 10 production days (${context.recentWindow.dates[0]} to ${context.recentWindow.dates[context.recentWindow.dates.length - 1]}) show ${formatNumber(recentSummary.totalProduced)} produced, ${formatNumber(recentSummary.totalRejected)} rejected, at ${formatNumber(recentSummary.avgRate, 2)}% weighted rate.`;
            bullets = [
              `${formatNumber(recentSummary.totalRecords)} rows across the recent window.`,
              `${formatNumber(recentSummary.criticalCount)} critical rows in the latest period.`,
              context.priorWindow?.summary ? `Prior period rate was ${formatNumber(context.priorWindow.summary.avgRate, 2)}%.` : "No prior period available for comparison."
            ];
          } else {
            answer = "No recent 10-day production window is available in the current dataset.";
            bullets = ["Load more data to populate the recent window."];
          }
          break;

        default:
          answer = `The active OBM view contains ${formatNumber(summary.totalRecords)} rows, ${formatNumber(summary.totalProduced)} produced units, and ${formatNumber(summary.totalRejected)} rejected units at a weighted rate of ${formatNumber(summary.avgRate, 2)}%. ${topRejected?.code || "N/A"} leads rejection volume, while ${topRate?.code || "N/A"} leads severity. The overall trend is ${trendLabel}.`;
          bullets = [
            recentSummary
              ? `Latest 10 days: ${formatNumber(recentSummary.totalProduced)} produced, ${formatNumber(recentSummary.totalRejected)} rejected, ${formatNumber(recentSummary.avgRate, 2)}% rate.`
              : "Latest 10-day window is not available.",
            topRejected
              ? `${topRejected.code} leads rejection volume with ${formatNumber(topRejected.rejected)} rejected units.`
              : "No rejection-volume leader.",
            topRate
              ? `${topRate.code} leads severity at ${formatNumber(topRate.rejectRate, 2)}% weighted rate.`
              : "No severity leader."
          ];
      }

      return {
        answer,
        bullets,
        mode: "fallback",
        provider: `local:${intent}`
      };
    }

    async function askAiQuestion(question) {
      const context = getAiContextSnapshot();

      if (!context.hasData || !REMOTE_AI_ENABLED) {
        return buildAiChatFallback(question, context);
      }

      const messages = [
        {
          role: "system",
          content: "You are a live operations AI analyst for a medical products OBM dashboard. Before answering, analyze the numeric payload and row-level data supplied to you. Use only the supplied dataset. Do not invent causes, operators, machines, suppliers, customers, or corrective actions unless they explicitly exist in the payload. Write in English. Return strict JSON with keys answer and bullets where bullets is an array of 3 short grounded points."
        },
        {
          role: "user",
          content: `Question: ${question}\n\nLive dataset payload:\n${JSON.stringify(context)}`
        }
      ];

      const providers = [
        { provider: "nvidia", model: "nvidia/llama-3.1-nemotron-70b-instruct" },
        { provider: "deepseek", model: "deepseek-chat" }
      ];

      let lastError = null;

      for (const current of providers) {
        try {
          const response = await fetch(AI_RENDER_ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              provider: current.provider,
              model: current.model,
              messages,
              max_tokens: 1100,
              temperature: 0.2
            })
          });

          if (!response.ok) {
            throw new Error(`AI API ${response.status}`);
          }

          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content || "";
          const parsed = parseAiJson(content);

          if (parsed?.answer && Array.isArray(parsed.bullets)) {
            return {
              answer: parsed.answer,
              bullets: parsed.bullets.slice(0, 3),
              mode: "success",
              provider: current.provider
            };
          }

          throw new Error("AI chat response JSON invalid");
        } catch (error) {
          lastError = error;
        }
      }

      const fallback = buildAiChatFallback(question, context);
      fallback.error = String(lastError || "");
      return fallback;
    }

    function exportPdfReport() {
      if (!LAST_SUMMARY) {
        return;
      }

      const executivePackage = LAST_EXECUTIVE_AI || buildExecutiveFallbackPackage(LAST_SUMMARY);

      const criticalRows = VIEW_DATA
        .filter((item) => item.pct > 5)
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 10)
        .map((item) => `
          <tr>
            <td>${item.date}</td>
            <td>${item.code}</td>
            <td>${item.name}</td>
            <td>${formatNumber(item.rejected)}</td>
            <td>${formatNumber(item.pct, 2)}%</td>
          </tr>
        `)
        .join("");

      const popup = window.open("", "_blank", "width=1200,height=900");

      if (!popup) {
        return;
      }

      popup.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Mais Co. OBM Executive Report</title>
          <style>
            body { font-family: Inter, Arial, sans-serif; margin: 32px; color: #0f172a; }
            h1, h2, h3 { margin: 0 0 12px; }
            p { line-height: 1.7; color: #334155; }
            .hero { margin-bottom: 28px; }
            .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0 28px; }
            .card { border: 1px solid #cbd5e1; border-radius: 14px; padding: 16px; background: #f8fafc; }
            .card strong { display: block; font-size: 1.5rem; margin-top: 10px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; vertical-align: top; }
            th { background: #e2e8f0; }
            .section { margin-top: 28px; }
            .muted { color: #64748b; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="hero">
            <h1>Mais Co. OBM Executive Report</h1>
            <p class="muted">Generated from the local dashboard view. Reporting window: ${formatShortDate(LAST_SUMMARY.startDate)} to ${formatShortDate(LAST_SUMMARY.endDate)}.</p>
            <p>${snapshotText.textContent}</p>
            <p><strong>AI Executive Note:</strong> ${executivePackage.reportNote}</p>
          </div>

          <div class="grid">
            <div class="card">Total Produced<strong>${formatNumber(LAST_SUMMARY.totalProduced)}</strong></div>
            <div class="card">Total Rejected<strong>${formatNumber(LAST_SUMMARY.totalRejected)}</strong></div>
            <div class="card">Average Rate<strong>${formatNumber(LAST_SUMMARY.avgRate, 2)}%</strong></div>
            <div class="card">Critical Records<strong>${formatNumber(LAST_SUMMARY.criticalCount)}</strong></div>
          </div>

          <div class="section">
            <h2>Priority Focus</h2>
            <p>Highest rejection volume: <strong>${LAST_SUMMARY.topRejected.code}</strong> with ${formatNumber(LAST_SUMMARY.topRejected.rejected)} rejected units.</p>
            <p>Highest weighted rate: <strong>${LAST_SUMMARY.topRate.code}</strong> at ${formatNumber(LAST_SUMMARY.topRate.weightedPct, 2)}%.</p>
            <p>Most repeated code in the loaded view: <strong>${LAST_SUMMARY.repeatCode.code}</strong> across ${formatNumber(LAST_SUMMARY.repeatCode.records)} entries.</p>
          </div>

          <div class="section">
            <h2>AI Executive Commentary</h2>
            <p>${executivePackage.snapshotText}</p>
            <p><strong>Report note:</strong> ${executivePackage.reportNote}</p>
            <ul>
              ${executivePackage.snapshotItems.map((item) => `<li><strong>${stripHtmlTags(item.label)}:</strong> ${stripHtmlTags(item.value)}</li>`).join("")}
            </ul>
          </div>

          <div class="section">
            <h2>Active Filters and Focus</h2>
            <p>${getCurrentFocusSummary()}</p>
          </div>

          <div class="section">
            <h2>Pinned References</h2>
            <p>${PINNED_ITEMS.length ? PINNED_ITEMS.map((item) => `<strong>${item.title}</strong> — ${item.body}`).join("<br />") : "No pinned references were active at export time."}</p>
          </div>

          <div class="section">
            <h2>Critical Records</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Code</th>
                  <th>Product</th>
                  <th>Rejected</th>
                  <th>Reject %</th>
                </tr>
              </thead>
              <tbody>
                ${criticalRows || `<tr><td colspan="5">No critical rows in the current filtered view.</td></tr>`}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `);

      popup.document.close();
      popup.focus();
      popup.print();
    }

    function exportCsvReport() {
      const headers = ["Date", "Code", "Name", "Produced", "Rejected", "RejectPct"];
      const metaLines = buildExportMetaLines().map((line) => `# ${line}`);
      const rows = VIEW_DATA.map((item) => [
        item.date,
        item.code,
        `"${String(item.name).replaceAll("\"", "\"\"")}"`,
        item.produced,
        item.rejected,
        item.pct
      ].join(","));

      const csvContent = [...metaLines, "", headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `mais-obm-view-${stamp}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function render() {
      renderRecentLayer();

      if (!DATA.length) {
        [k1, k2, k4, k5].forEach((element) => {
          if (element) {
            element.textContent = "0";
          }
        });

        if (k3) {
          k3.textContent = "0.00%";
        }

        [kd1, kd2, kd3, kd4, kd5].forEach((element) => {
          setDeltaState(element, "na", "Awaiting comparison baseline");
        });

        snapshotRange.textContent = "No valid rows";
        snapshotText.textContent = "The loaded source did not produce any valid rejection records after mapping.";
        VIEW_DATA = [];
        updateFilterPanels();
        snapshotList.innerHTML = "";
        productBreakdownList.innerHTML = "";
        actionQueueList.innerHTML = "";
        periodCompareList.innerHTML = "";
        compareMeta.textContent = "Window-over-window movement";
        alertGrid.innerHTML = "";
        if (weekN) {
          weekN.textContent = "0";
        }
        if (weekTxt) {
          weekTxt.textContent = "No weekly rejection events are available yet.";
        }
        renderIssueEmptyState(weekGrid, "No weekly issues matched the active dataset.");
        renderIssueEmptyState(probGrid, "Pattern detection will appear once the full dataset is loaded.");
        tblBody.innerHTML = '<tr><td class="table-empty" colspan="6">No valid rows to display.</td></tr>';
        tblCnt.textContent = "0 records";
        tableMeta.textContent = "No valid rows to display";
        markdownShell.innerHTML = "<p>No markdown insights are available because the mapped dataset is empty.</p>";
        markdownMeta.textContent = "Waiting for valid records";
        LAST_SUMMARY = null;
        LAST_EXECUTIVE_AI = null;
        updateMetricMeta(null, null, null);
        updateDatePeriodBadge("", "");
        updateStickySummary(null);
        updateStickyVisibility();
        renderChartFocusChips();
        renderPinnedTray();
        clearChartHoverSync();
        destroyCharts();
        trendMeta.textContent = "No chart data";
        topMeta.textContent = "No top-product data";
        rateMeta.textContent = "No rate data";
        weekMeta.textContent = "No weekly data";
        pieMeta.textContent = "No category distribution";
        emitAiBridgeUpdate();
        requestAnimationFrame(() => {
          hideLoadingOverlay();
          initializeFadeSections();
        });
        return;
      }

      const baseByCode = aggregateByCode(DATA);
      VIEW_DATA = buildViewData(baseByCode);

      if (!VIEW_DATA.length) {
        [k1, k2, k4, k5].forEach((element) => {
          if (element) {
            element.textContent = "0";
          }
        });

        if (k3) {
          k3.textContent = "0.00%";
        }

        [kd1, kd2, kd3, kd4, kd5].forEach((element) => {
          setDeltaState(element, "na", "Awaiting comparison baseline");
        });

        updateFilterPanels();
        snapshotRange.textContent = "No matching rows";
        snapshotText.textContent = "The current search and quick-filter combination produced no visible rows.";
        snapshotList.innerHTML = "";
        productBreakdownList.innerHTML = "";
        actionQueueList.innerHTML = "";
        periodCompareList.innerHTML = "";
        compareMeta.textContent = "Window-over-window movement";
        alertGrid.innerHTML = "";
        if (weekN) {
          weekN.textContent = "0";
        }
        if (weekTxt) {
          weekTxt.textContent = "No weekly rejection events are available yet.";
        }
        renderIssueEmptyState(weekGrid, "No weekly issues matched the active dataset.");
        renderIssueEmptyState(probGrid, "Pattern detection will appear once the full dataset is loaded.");
        tblBody.innerHTML = '<tr><td class="table-empty" colspan="6">No matching rows in current view.</td></tr>';
        tblCnt.textContent = "0 records";
        tableMeta.textContent = "No matching rows in current view";
        markdownShell.innerHTML = "<p>No markdown insights are available for the current filtered view.</p>";
        markdownMeta.textContent = "Adjust search or filters";
        LAST_SUMMARY = null;
        LAST_EXECUTIVE_AI = null;
        updateMetricMeta(null, null, null);
        updateDatePeriodBadge("", "");
        updateStickySummary(null);
        updateStickyVisibility();
        renderChartFocusChips();
        renderPinnedTray();
        clearChartHoverSync();
        destroyCharts();
        trendMeta.textContent = "No chart data";
        topMeta.textContent = "No top-product data";
        rateMeta.textContent = "No rate data";
        weekMeta.textContent = "No weekly data";
        pieMeta.textContent = "No category distribution";
        emitAiBridgeUpdate();
        requestAnimationFrame(() => {
          hideLoadingOverlay();
          initializeFadeSections();
        });
        return;
      }

      const metrics = calculateMetrics(VIEW_DATA);
      const byCode = aggregateByCode(VIEW_DATA);
      const dailySeries = aggregateByDate(VIEW_DATA);
      const topRejected = byCode.slice().sort((a, b) => b.rejected - a.rejected)[0];
      const topRate = byCode.slice().sort((a, b) => b.weightedPct - a.weightedPct)[0];
      const lowestRate = byCode.slice().sort((a, b) => a.weightedPct - b.weightedPct)[0];
      const repeatCode = byCode.slice().sort((a, b) => b.records - a.records || b.rejected - a.rejected)[0];
      const comparisonWindow = getComparisonView();
      const comparisonView = comparisonWindow?.view || [];
      const comparisonMetrics = comparisonWindow && comparisonWindow.view.length
        ? calculateMetrics(comparisonView)
        : null;
      updateFilterPanels();
      const summary = {
        ...metrics,
        uniqueCodes: byCode.length,
        topRejected,
        topRate,
        lowestRate,
        repeatCode,
        startDate: dailySeries[0]?.date ?? "",
        endDate: dailySeries[dailySeries.length - 1]?.date ?? ""
      };
      LAST_SUMMARY = summary;
      updateMetricMeta(summary, comparisonMetrics, comparisonWindow);
      updateDatePeriodBadge(summary.startDate, summary.endDate);
      updateStickySummary(summary);
      updateStickyVisibility();
      renderChartFocusChips();
      renderPinnedTray();

      animateValue(k1, summary.totalProduced, { duration: 800 });
      animateValue(k2, summary.totalRejected, { duration: 800 });
      animateValue(k3, summary.avgRate, { duration: 800, decimals: 2, suffix: "%", format: "percent" });
      animateValue(k4, summary.totalRecords, { duration: 800 });
      animateValue(k5, summary.criticalCount, { duration: 800 });

      renderDelta(kd1, summary.totalProduced, comparisonMetrics?.totalProduced, { mode: "relative" });
      renderDelta(kd2, summary.totalRejected, comparisonMetrics?.totalRejected, { mode: "relative", inverseGood: true });
      renderDelta(kd3, summary.avgRate, comparisonMetrics?.avgRate, { mode: "points", decimals: 2, inverseGood: true });
      renderDelta(kd4, summary.totalRecords, comparisonMetrics?.totalRecords, { mode: "relative" });
      renderDelta(kd5, summary.criticalCount, comparisonMetrics?.criticalCount, { mode: "relative", inverseGood: true });

      hydrateExecutiveAi(summary);
      renderAlerts(summary);
      buildWeeklyIssues();
      buildProblems();
      renderCharts();
      renderBreakdownLists(summary);
      renderPeriodComparison(summary, comparisonMetrics, comparisonWindow);
      renderTable(tblSearch?.value || "", tblFilter?.value || "");
      emitAiBridgeUpdate();
      requestAnimationFrame(() => {
        hideLoadingOverlay();
        initializeFadeSections();
        requestChartResize();
      });
    }

    /* ──────────────────────────────────────────────────────────────
       DATA INGESTION LAYER
       Handles: embedded fallback, CSV upload, defensive parsing,
       positional fallback, toast notifications, post-ingest pipeline
       ────────────────────────────────────────────────────────────── */

    const INGESTION_STATE = {
      source: "none",
      fileName: "",
      totalCsvRows: 0,
      validRows: 0,
      skippedRows: 0,
      parseMethod: "none"
    };

    /* --- Toast Notification System --- */
    function showIngestionToast(message, type = "info", duration = 5000) {
      let container = document.getElementById("ingestionToastContainer");
      if (!container) {
        container = document.createElement("div");
        container.id = "ingestionToastContainer";
        container.setAttribute("aria-live", "polite");
        container.style.cssText = "position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;max-width:420px;";
        document.body.appendChild(container);
      }

      const toast = document.createElement("div");
      const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
      const bgColors = {
        success: "linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))",
        error: "linear-gradient(135deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))",
        warning: "linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))",
        info: "linear-gradient(135deg, rgba(59,130,246,0.95), rgba(37,99,235,0.95))"
      };

      toast.style.cssText = `
        pointer-events:auto;background:${bgColors[type] || bgColors.info};
        color:#fff;padding:14px 20px;border-radius:12px;font-size:14px;line-height:1.5;
        font-family:Inter,system-ui,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.3);
        backdrop-filter:blur(12px);transform:translateX(120%);transition:transform 0.4s cubic-bezier(0.22,1,0.36,1),opacity 0.3s;
        display:flex;align-items:flex-start;gap:10px;cursor:pointer;max-width:100%;
      `;
      toast.innerHTML = `<span style="font-size:18px;flex-shrink:0;margin-top:1px;">${icons[type] || icons.info}</span><span style="flex:1;">${escapeHtml(message)}</span>`;

      container.appendChild(toast);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          toast.style.transform = "translateX(0)";
        });
      });

      const dismiss = () => {
        toast.style.transform = "translateX(120%)";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 400);
      };

      toast.addEventListener("click", dismiss);
      if (duration > 0) {
        setTimeout(dismiss, duration);
      }
    }

    /* --- Numeric Parser --- */
    function parseNumericValue(value) {
      if (value === undefined || value === null) return NaN;
      const cleaned = String(value).replace(/[^\d.\-]/g, "").trim();
      if (cleaned === "" || cleaned === "." || cleaned === "-") return NaN;
      const num = parseFloat(cleaned);
      return Number.isFinite(num) ? num : NaN;
    }

    /* --- Fuzzy Column Lookup (improved) --- */
    function fuzzyColLookup(row, candidates) {
      // Phase 1: exact key match
      for (const candidate of candidates) {
        const val = row[candidate];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return String(val).trim();
        }
      }

      // Phase 2: case-insensitive normalized match
      const rowKeys = Object.keys(row);
      for (const candidate of candidates) {
        const normCandidate = candidate.toLowerCase().replace(/[^a-z0-9]/g, "");
        for (const key of rowKeys) {
          const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
          if (normKey === normCandidate || normKey.includes(normCandidate) || normCandidate.includes(normKey)) {
            const val = row[key];
            if (val !== undefined && val !== null && String(val).trim() !== "") {
              return String(val).trim();
            }
          }
        }
      }

      return "";
    }

    /* --- Known CSV Column Positions for Mais OBM Report ---
       Header: Date(0), DocNo(1), Rejection Type(2), Machine Name(3),
               Producted Item.Code(4), Producted Item.Name(5), Producted Qty(6),
               Lot No(7), Item.Code(8), Item.Name(9), Quantity(10),
               Reject %(11), RM TYPE(12), Batch(13)
    */
    const KNOWN_COL_POSITIONS = {
      date: 0,
      producedCode: 4,
      producedName: 5,
      producedQty: 6,
      itemCode: 8,
      itemName: 9,
      quantity: 10,
      rejectPct: 11
    };

    /* --- Map a CSV Row to Normalized Data Model --- */
    function mapCsvRow(row) {
      const dateStr = fuzzyColLookup(row, ["Date", "date", "DATE"]);
      const code = fuzzyColLookup(row, [
        "Item.Code", "Item Code", "ItemCode", "item.code",
        "ITEM.CODE", "Item_Code"
      ]);
      const name = fuzzyColLookup(row, [
        "Item.Name", "Item Name", "ItemName", "item.name",
        "ITEM.NAME", "Item_Name"
      ]);
      const producedRaw = fuzzyColLookup(row, [
        "Producted Qty", "Produced Qty", "ProducedQty",
        "producted qty", "PRODUCTED QTY", "Produced_Qty"
      ]);
      const rejectedRaw = fuzzyColLookup(row, [
        "Quantity", "Rejected Qty", "Qty", "quantity",
        "QUANTITY", "Reject Qty"
      ]);
      const pctRaw = fuzzyColLookup(row, [
        "Reject %", "Reject%", "RejectPct", "reject %",
        "REJECT %", "Reject_Pct"
      ]);

      if (!dateStr || !dateStr.includes("/")) return null;
      if (!code) return null;

      const produced = parseNumericValue(producedRaw);
      const rejected = parseNumericValue(rejectedRaw);

      if (Number.isNaN(produced) || produced <= 0) return null;
      if (Number.isNaN(rejected) || rejected < 0) return null;

      const pct = parseNumericValue(pctRaw);
      const calculatedPct = produced > 0 ? (rejected / produced) * 100 : 0;
      const finalPct = Number.isNaN(pct) ? calculatedPct : pct;

      // Validate pct sanity: if CSV says 0.71 but we calculate 0.71, good.
      // If CSV gives wildly wrong pct, recalculate
      const pctDrift = Math.abs(finalPct - calculatedPct);
      const usePct = (pctDrift > 5 && calculatedPct > 0) ? calculatedPct : finalPct;

      const cleanedName = String(name || code)
        .replace(/\s+/g, " ")
        .trim();

      return {
        date: dateStr,
        code,
        name: cleanedName,
        produced,
        rejected,
        pct: Math.round(usePct * 100) / 100
      };
    }

    /* --- Positional Fallback: parse a raw CSV line using known column positions ---
       This handles rows where commas inside text fields cause PapaParse to
       shift columns. We parse from the edges inward since date (col 0) and
       the rightmost numeric columns are most reliable.
    */
    function parseRowByPosition(rawLine) {
      if (!rawLine || typeof rawLine !== "string") return null;

      const cells = rawLine.split(",");
      if (cells.length < 12) return null;

      const dateStr = (cells[KNOWN_COL_POSITIONS.date] || "").trim();
      if (!dateStr || !dateStr.includes("/")) return null;

      // Skip Grand Total and metadata rows
      if (dateStr.toLowerCase().includes("grand") || dateStr.toLowerCase().includes("total")) return null;

      // Parse from the RIGHT edge: Batch(last), RM TYPE(last-1), Reject%(last-2), Quantity(last-3)
      const totalCells = cells.length;
      const batchIdx = totalCells - 1;
      const rmTypeIdx = totalCells - 2;
      const rejectPctIdx = totalCells - 3;
      const quantityIdx = totalCells - 4;

      // Two columns before Quantity: Item.Name then Item.Code
      // But Item.Name might itself contain commas -> use a different strategy
      // We know the header has 14 columns (index 0-13), so extra commas = totalCells - 14
      const extraCommas = totalCells - 14;
      const offset = Math.max(0, extraCommas);

      // Item.Code (col 8) and Item.Name (col 9, possibly spanning multiple cells)
      const itemCodeIdx = KNOWN_COL_POSITIONS.itemCode;
      const itemNameStart = KNOWN_COL_POSITIONS.itemName;
      const itemNameEnd = KNOWN_COL_POSITIONS.itemName + offset;

      const code = (cells[itemCodeIdx] || "").trim();
      if (!code) return null;

      const name = cells.slice(itemNameStart, itemNameEnd + 1).join(",").trim();

      // Producted Qty (col 6) - might be affected by commas in col 5 (Producted Item.Name)
      // We search backward from itemCode for a numeric value
      let producedRaw = "";
      // Col 6 in original = the produced qty, but if col 5 (produced item name) has commas, it shifts
      // Strategy: find produced qty as the last numeric-looking cell before Item.Code
      for (let i = itemCodeIdx - 1; i >= 4; i--) {
        const val = (cells[i] || "").trim();
        const num = parseNumericValue(val);
        if (!Number.isNaN(num) && num > 0) {
          producedRaw = val;
          break;
        }
      }

      // If we couldn't find produced qty before item code, try the original position
      if (!producedRaw) {
        producedRaw = (cells[KNOWN_COL_POSITIONS.producedQty] || "").trim();
      }

      const rejectedRaw = (cells[quantityIdx] || "").trim();
      const pctRaw = (cells[rejectPctIdx] || "").trim();

      const produced = parseNumericValue(producedRaw);
      const rejected = parseNumericValue(rejectedRaw);

      if (Number.isNaN(produced) || produced <= 0) return null;
      if (Number.isNaN(rejected) || rejected < 0) return null;

      const pct = parseNumericValue(pctRaw);
      const calculatedPct = produced > 0 ? (rejected / produced) * 100 : 0;
      const finalPct = Number.isNaN(pct) ? calculatedPct : pct;

      const cleanedName = String(name || code)
        .replace(/\s+/g, " ")
        .trim();

      return {
        date: dateStr,
        code,
        name: cleanedName,
        produced,
        rejected,
        pct: Math.round(finalPct * 100) / 100
      };
    }

    /* --- Strip CSV Metadata/Header Rows --- */
    function stripCsvMetadataRows(text) {
      const lines = text.split(/\r?\n/);
      let headerIndex = -1;
      for (let i = 0; i < Math.min(lines.length, 15); i++) {
        const line = lines[i].toLowerCase();
        if (line.includes("date") && (line.includes("item") || line.includes("qty") || line.includes("quantity") || line.includes("reject"))) {
          headerIndex = i;
          break;
        }
      }
      if (headerIndex > 0) {
        return { text: lines.slice(headerIndex).join("\n"), allLines: lines, headerIndex };
      }
      return { text, allLines: lines, headerIndex: 0 };
    }

    /* --- Post-Ingest Pipeline: sort, deduplicate stats, trigger render --- */
    function postIngest(source, label, fileName = "") {
      // Sort by date ascending
      RAW_DATA = source.slice().sort((a, b) => {
        const da = parseDmy(a.date);
        const db = parseDmy(b.date);
        return da - db;
      });

      INGESTION_STATE.source = label;
      INGESTION_STATE.fileName = fileName;
      INGESTION_STATE.validRows = RAW_DATA.length;

      populateCodeFilter();
      applyFilters();
    }

    /* --- Load Embedded Fallback Data --- */
    function loadEmbedded() {
      INGESTION_STATE.source = "embedded";
      INGESTION_STATE.totalCsvRows = EMBEDDED_DATA.length;
      INGESTION_STATE.validRows = EMBEDDED_DATA.length;
      INGESTION_STATE.skippedRows = 0;
      INGESTION_STATE.parseMethod = "embedded";

      setFilepathDisplay("Embedded local dataset loaded", EMBEDDED_CSV_PATH);
      showIngestionToast(
        `Embedded data loaded successfully — ${EMBEDDED_DATA.length} records ready for analysis.`,
        "success"
      );
      postIngest(EMBEDDED_DATA, "embedded", "embedded");
    }

    /* --- Main CSV Parser with Two-Phase Strategy --- */
    function parseCsvFile(file) {
      if (!file) {
        showIngestionToast("No file selected.", "warning");
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        showIngestionToast(
          `Invalid file type: "${file.name}". Please upload a .csv file.`,
          "error"
        );
        return;
      }

      if (file.size === 0) {
        showIngestionToast("The selected file is empty (0 bytes).", "error");
        return;
      }

      const reader = new FileReader();

      reader.onload = function (event) {
        let rawText = event.target.result;

        // Strip BOM
        rawText = rawText.replace(/^\uFEFF/, "");

        if (!rawText.trim()) {
          showIngestionToast("The file contains no readable content.", "error");
          loadEmbedded();
          return;
        }

        const { text: cleanedText, allLines, headerIndex } = stripCsvMetadataRows(rawText);
        const dataLines = allLines.slice(headerIndex + 1).filter((line) => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          if (trimmed.toLowerCase().startsWith("grand total")) return false;
          return true;
        });

        INGESTION_STATE.totalCsvRows = dataLines.length;
        INGESTION_STATE.skippedRows = 0;

        /* Phase 1: try PapaParse with header-based mapping */
        let phase1Results = [];
        let phase1Attempted = false;

        try {
          const parseResult = Papa.parse(cleanedText, {
            header: true,
            skipEmptyLines: "greedy",
            dynamicTyping: false,
            transformHeader: (header) => header.trim()
          });

          if (parseResult.errors.length) {
            console.warn("CSV parse warnings (Phase 1):", parseResult.errors.slice(0, 5));
          }

          phase1Attempted = true;
          phase1Results = parseResult.data
            .map(mapCsvRow)
            .filter(Boolean);
        } catch (err) {
          console.warn("Phase 1 (PapaParse header) failed:", err);
        }

        /* Phase 2: positional fallback for any rows PapaParse couldn't map */
        let phase2Results = [];
        const phase1Dates = new Set(
          phase1Results.map((r) => `${r.date}__${r.code}__${r.produced}__${r.rejected}`)
        );

        if (phase1Results.length < dataLines.length * 0.8) {
          // If Phase 1 got less than 80% of rows, try positional on ALL data lines
          for (const line of dataLines) {
            const row = parseRowByPosition(line);
            if (row) {
              const key = `${row.date}__${row.code}__${row.produced}__${row.rejected}`;
              if (!phase1Dates.has(key)) {
                phase2Results.push(row);
              }
            }
          }
        }

        // Merge results: Phase 1 + Phase 2 unique
        const merged = [...phase1Results, ...phase2Results];

        // Deduplicate by exact row signature
        const seen = new Set();
        const deduped = merged.filter((row) => {
          const sig = `${row.date}|${row.code}|${row.produced}|${row.rejected}|${row.pct}`;
          if (seen.has(sig)) return false;
          seen.add(sig);
          return true;
        });

        INGESTION_STATE.validRows = deduped.length;
        INGESTION_STATE.skippedRows = INGESTION_STATE.totalCsvRows - deduped.length;
        INGESTION_STATE.parseMethod = phase2Results.length > 0 ? "hybrid" : "header";

        /* Decide outcome and notify user */
        if (!deduped.length) {
          showIngestionToast(
            `CSV file "${file.name}" produced 0 valid rows after parsing. Loading embedded data as fallback.`,
            "error",
            7000
          );
          console.error("CSV parsing produced 0 valid rows. Falling back to embedded data.");
          loadEmbedded();
          return;
        }

        // Successful parse
        const p1Count = phase1Results.length;
        const p2Count = phase2Results.length;
        const skipped = INGESTION_STATE.skippedRows;

        if (skipped > 0 && skipped > deduped.length * 0.3) {
          // More than 30% skipped → partial parse warning
          showIngestionToast(
            `Partially parsed "${file.name}": ${deduped.length} valid rows loaded, ${skipped} rows skipped (malformed or incomplete).` +
            (p2Count > 0 ? ` Positional fallback recovered ${p2Count} additional rows.` : ""),
            "warning",
            7000
          );
        } else if (skipped > 0) {
          // Some rows skipped, but mostly successful
          showIngestionToast(
            `CSV loaded: "${file.name}" — ${deduped.length} rows mapped successfully. ${skipped} row(s) skipped.` +
            (p2Count > 0 ? ` (${p2Count} recovered via positional parsing)` : ""),
            "success",
            5000
          );
        } else {
          // Perfect parse
          showIngestionToast(
            `CSV loaded successfully: "${file.name}" — ${deduped.length} records ready for analysis.`,
            "success"
          );
        }

        setFilepathDisplay(
          `CSV loaded: ${file.name} (${deduped.length} rows)`,
          `Source: ${file.name} | Method: ${INGESTION_STATE.parseMethod} | Valid: ${deduped.length} | Skipped: ${skipped}`
        );

        postIngest(deduped, "csv", file.name);
      };

      reader.onerror = function () {
        console.error("FileReader error");
        showIngestionToast(
          "Failed to read the file. Please try again or use embedded data.",
          "error"
        );
        loadEmbedded();
      };

      reader.readAsText(file, "utf-8");
    }

    browseButton.addEventListener("click", () => {
      csvFileInput.click();
    });

    embeddedButton.addEventListener("click", () => {
      loadEmbedded();
    });

    csvFileInput.addEventListener("change", (event) => {
      const [file] = event.target.files || [];

      if (!file) {
        return;
      }

      setFilepathDisplay(`Selected file: ${file.name}`, EMBEDDED_CSV_PATH);
      parseCsvFile(file);
    });

    startDateFilter.addEventListener("change", () => {
      FILTER_STATE.startDate = startDateFilter.value;
      FILTER_STATE.focusWeek = "";
      FILTER_STATE.focusDate = "";

      if (FILTER_STATE.endDate && FILTER_STATE.startDate && FILTER_STATE.endDate < FILTER_STATE.startDate) {
        FILTER_STATE.endDate = FILTER_STATE.startDate;
        endDateFilter.value = FILTER_STATE.endDate;
      }

      applyFilters();
    });

    endDateFilter.addEventListener("change", () => {
      FILTER_STATE.endDate = endDateFilter.value;
      FILTER_STATE.focusWeek = "";
      FILTER_STATE.focusDate = "";

      if (FILTER_STATE.startDate && FILTER_STATE.endDate && FILTER_STATE.endDate < FILTER_STATE.startDate) {
        FILTER_STATE.startDate = FILTER_STATE.endDate;
        startDateFilter.value = FILTER_STATE.startDate;
      }

      applyFilters();
    });

    codeFilter.addEventListener("change", () => {
      FILTER_STATE.codes = Array.from(codeFilter.selectedOptions).map((option) => option.value);
      FILTER_STATE.focusDate = "";
      FILTER_STATE.focusWeek = "";
      FILTER_STATE.focusCategory = "";
      applyFilters();
    });

    searchFilter.addEventListener("input", () => {
      FILTER_STATE.search = searchFilter.value;
      applyFilters({ preserveSelection: false });
    });

    aiPromptInput?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      askAI("custom");
    });

    geminiPrefillButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.geminiPrefill || "";
        aiPromptInput.value = prompt;
        aiPromptInput.focus();
        aiPromptInput.setSelectionRange(prompt.length, prompt.length);
      });
    });

    quickFilterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        setQuickFilterState(button.dataset.quickFilter || "all");
        applyFilters({ preserveSelection: false });
      });
    });

    filterPanelButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const panelId = button.dataset.filterPanel || "";
        const isExpanded = button.getAttribute("aria-expanded") === "true";
        setActiveFilterPanel(isExpanded ? "" : panelId);
      });
    });

    resetFiltersButton.addEventListener("click", () => {
      FILTER_STATE.startDate = "";
      FILTER_STATE.endDate = "";
      FILTER_STATE.codes = [];
      FILTER_STATE.focusDate = "";
      FILTER_STATE.focusWeek = "";
      FILTER_STATE.focusCategory = "";
      FILTER_STATE.search = "";
      setQuickFilterState("all");
      SELECTED_ROW_KEY = "";
      startDateFilter.value = "";
      endDateFilter.value = "";
      syncCodeFilterSelection();
      searchFilter.value = "";
      applyFilters();
    });

    exportCsvButton.addEventListener("click", () => {
      exportCsvReport();
    });

    exportPdfButton.addEventListener("click", () => {
      exportPdfReport();
    });

    trendFocusClear.addEventListener("click", () => {
      applyChartFocus({ focusDate: "" });
    });

    topFocusClear.addEventListener("click", () => {
      applyChartFocus({ codes: [] });
    });

    rateFocusClear.addEventListener("click", () => {
      applyChartFocus({ codes: [] });
    });

    weekFocusClear.addEventListener("click", () => {
      applyChartFocus({ focusWeek: "" });
    });

    pieFocusClear.addEventListener("click", () => {
      applyChartFocus({ focusCategory: "" });
    });

    pinSelectedButton.addEventListener("click", () => {
      addPinnedItem(buildSelectedRowPin());
    });

    pinFocusButton.addEventListener("click", () => {
      addPinnedItem(buildCurrentFocusPin());
    });

    clearPinsButton.addEventListener("click", () => {
      clearPinnedItems();
    });

    bindTableControls();

    window.MaisOBMBridge = {
      getContextSnapshot: getAiContextSnapshot,
      askQuestion: askAiQuestion,
      askAI,
      refreshContext: () => {
        emitAiBridgeUpdate();
        return getAiContextSnapshot();
      }
    };

    window.askAI = askAI;

    window.addEventListener("scroll", () => {
      updateStickyVisibility();
    });

    window.addEventListener("resize", () => {
      requestChartResize();
    });

    window.addEventListener("load", () => {
      syncStoredGeminiKey();
      syncStoredGeminiModel();
      setActiveFilterPanel("dates");
      initializeFadeSections();
      setTimeout(() => {
        loadEmbedded();
      }, 500);
    });
