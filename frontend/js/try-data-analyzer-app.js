class DataAnalyzerPage {
  constructor() {
    this.analyzer = new DataAnalyzer();
    this.currentAnalysis = null;
    this.dataset = null;
    this.localSummary = null;
    this.geminiReport = null;
    this.init();
  }

  init() {
    const fileInput = document.getElementById("file-input");
    const uploadArea = document.getElementById("upload-area");
    const exportJsonBtn = document.querySelector('[data-action="export-json"]');
    const exportPdfBtn = document.querySelector('[data-action="export-pdf"]');
    const copySummaryBtn = document.querySelector('[data-action="copy-summary"]');
    const askInput = document.getElementById("ask-input");
    const askBtn = document.getElementById("ask-btn");

    fileInput?.addEventListener("change", (event) => this.handleFile(event.target.files[0]));

    uploadArea?.addEventListener("dragover", (event) => {
      event.preventDefault();
      uploadArea.classList.add("highlight");
    });
    uploadArea?.addEventListener("dragleave", () => uploadArea.classList.remove("highlight"));
    uploadArea?.addEventListener("drop", (event) => {
      event.preventDefault();
      uploadArea.classList.remove("highlight");
      this.handleFile(event.dataTransfer.files[0]);
    });

    document.querySelectorAll(".sample-data-btn").forEach((button) => {
      button.addEventListener("click", () => this.loadSampleData(button.dataset.sample));
    });

    exportJsonBtn?.addEventListener("click", () => this.exportJsonReport());
    exportPdfBtn?.addEventListener("click", () => this.exportPdfReport());
    copySummaryBtn?.addEventListener("click", () => this.copySummary());
    askBtn?.addEventListener("click", () => this.askQuestion(askInput.value));
    askInput?.addEventListener("keypress", (event) => {
      if (event.key === "Enter") this.askQuestion(askInput.value);
    });
  }

  async loadSampleData(type) {
    const sample = this.getSampleDataset(type || "sales");
    this.showLoading("تحميل البيانات النموذجية...");
    await this.processDataset(sample.filename, sample.headers, sample.rows, sample.label);
  }

  getSampleDataset(type) {
    const samples = {
      sales: {
        label: "مبيعات",
        filename: "brightai-sales-sample.csv",
        headers: ["الشهر", "المنطقة", "القناة", "المنتج", "الإيراد", "الطلبات", "هامش_الربح", "المرتجعات"],
        rows: [
          ["يناير", "الرياض", "متجر", "اشتراك Pro", 184000, 420, 31, 12],
          ["يناير", "جدة", "أونلاين", "اشتراك Basic", 91000, 310, 22, 18],
          ["فبراير", "الرياض", "أونلاين", "اشتراك Pro", 201000, 455, 34, 9],
          ["فبراير", "الدمام", "شركاء", "خدمة تكامل", 132000, 88, 41, 3],
          ["مارس", "الرياض", "متجر", "اشتراك Enterprise", 288000, 130, 48, 2],
          ["مارس", "جدة", "أونلاين", "اشتراك Pro", 149000, 340, 29, 15],
          ["أبريل", "مكة", "شركاء", "خدمة تكامل", 96000, 72, 36, 4],
          ["أبريل", "الرياض", "أونلاين", "اشتراك Basic", 78000, 290, 19, 21],
          ["مايو", "المدينة", "متجر", "اشتراك Pro", 118000, 240, 27, 11],
          ["مايو", "جدة", "شركاء", "اشتراك Enterprise", 221000, 105, 44, 5],
          ["يونيو", "الدمام", "أونلاين", "اشتراك Basic", 65000, 260, 15, 28],
          ["يونيو", "الرياض", "شركاء", "خدمة تكامل", 305000, 118, 52, 1]
        ]
      },
      inventory: {
        label: "مخزون",
        filename: "brightai-inventory-sample.csv",
        headers: ["الصنف", "المستودع", "المورد", "الكمية", "نقطة_إعادة_الطلب", "أيام_التغطية", "تكلفة_الوحدة", "حالة_الصنف"],
        rows: [
          ["حساسات IoT", "الرياض", "مورد أ", 320, 180, 42, 86, "نشط"],
          ["بوابات شبكة", "جدة", "مورد ب", 48, 60, 12, 740, "منخفض"],
          ["كاميرات ذكية", "الدمام", "مورد أ", 95, 70, 25, 410, "نشط"],
          ["شرائح اتصال", "الرياض", "مورد ج", 1200, 500, 58, 18, "نشط"],
          ["خوادم صغيرة", "جدة", "مورد د", 9, 15, 8, 6800, "حرج"],
          ["بطاريات", "مكة", "مورد ب", 210, 200, 19, 95, "مراقبة"],
          ["أجهزة تتبع", "المدينة", "مورد أ", 140, 100, 33, 220, "نشط"],
          ["قارئات QR", "الرياض", "مورد هـ", 33, 45, 10, 310, "منخفض"],
          ["شاشات تحكم", "الدمام", "مورد د", 22, 25, 17, 960, "مراقبة"],
          ["كابلات صناعية", "جدة", "مورد ج", 640, 250, 61, 14, "نشط"],
          ["وحدات طاقة", "الرياض", "مورد ب", 55, 80, 13, 520, "منخفض"],
          ["حافظات أجهزة", "مكة", "مورد هـ", 410, 160, 49, 38, "نشط"]
        ]
      },
      hr: {
        label: "HR",
        filename: "brightai-hr-sample.csv",
        headers: ["القسم", "المدينة", "عدد_الموظفين", "معدل_الحضور", "ساعات_التدريب", "تقييم_الأداء", "معدل_الدوران", "رضا_الموظفين"],
        rows: [
          ["المبيعات", "الرياض", 44, 94, 18, 82, 11, 76],
          ["الدعم", "جدة", 31, 89, 12, 74, 18, 68],
          ["التقنية", "الرياض", 28, 97, 34, 91, 6, 84],
          ["العمليات", "الدمام", 36, 91, 20, 79, 13, 72],
          ["المالية", "الرياض", 16, 96, 11, 86, 5, 81],
          ["الموارد البشرية", "جدة", 12, 93, 28, 88, 7, 79],
          ["التسويق", "مكة", 19, 88, 16, 73, 21, 66],
          ["المبيعات", "المدينة", 22, 90, 14, 77, 17, 70],
          ["الدعم", "الرياض", 40, 87, 10, 71, 24, 62],
          ["التقنية", "جدة", 18, 95, 31, 89, 8, 83],
          ["العمليات", "الرياض", 52, 92, 17, 80, 10, 75],
          ["التسويق", "الدمام", 15, 86, 9, 69, 26, 59]
        ]
      },
      csat: {
        label: "رضا العملاء",
        filename: "brightai-csat-sample.csv",
        headers: ["القناة", "المدينة", "نوع_العميل", "درجة_الرضا", "NPS", "وقت_الاستجابة_دقيقة", "حالات_مغلقة", "سبب_التواصل"],
        rows: [
          ["واتساب", "الرياض", "Enterprise", 92, 64, 7, 38, "دعم فني"],
          ["الهاتف", "جدة", "SMB", 74, 22, 18, 29, "استفسار فاتورة"],
          ["البريد", "الدمام", "Enterprise", 81, 35, 42, 17, "طلب تكامل"],
          ["واتساب", "مكة", "SMB", 88, 51, 9, 33, "متابعة طلب"],
          ["الشات", "الرياض", "Startup", 69, 12, 13, 41, "مشكلة دخول"],
          ["الهاتف", "المدينة", "Enterprise", 77, 29, 25, 22, "تصعيد"],
          ["واتساب", "جدة", "SMB", 94, 71, 6, 46, "دعم فني"],
          ["الشات", "الدمام", "Startup", 63, -4, 31, 27, "تأخير خدمة"],
          ["البريد", "الرياض", "Enterprise", 85, 42, 55, 14, "طلب تقرير"],
          ["واتساب", "مكة", "SMB", 90, 58, 8, 39, "استفسار منتج"],
          ["الهاتف", "جدة", "Enterprise", 72, 18, 34, 19, "شكوى"],
          ["الشات", "الرياض", "SMB", 83, 39, 12, 44, "دعم فني"]
        ]
      }
    };

    return samples[type] || samples.sales;
  }

  async handleFile(file) {
    if (!file) return;
    this.showLoading("قراءة الملف...");

    try {
      const parsed = await this.parseFile(file);
      await this.processDataset(file.name, parsed.headers, parsed.rows, "ملف مرفوع");
    } catch (error) {
      console.error(error);
      alert("حدث خطأ في معالجة الملف. تأكد من أن الصف الأول يحتوي على أسماء الأعمدة.");
      this.hideLoading();
      document.getElementById("upload-section")?.classList.remove("hidden");
    }
  }

  async parseFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "csv") {
      return new Promise((resolve, reject) => {
        Papa.parse(file, {
          skipEmptyLines: true,
          complete: (result) => resolve(this.normalizeSheetRows(result.data)),
          error: reject
        });
      });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "binary" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        resolve(this.normalizeSheetRows(rows));
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  }

  normalizeSheetRows(rows) {
    const cleanRows = rows.filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? "").trim() !== ""));
    const headers = (cleanRows[0] || []).map((header, index) => String(header || `عمود ${index + 1}`).trim());
    const dataRows = cleanRows.slice(1).map((row) => headers.map((_, index) => row[index] ?? ""));

    if (!headers.length) {
      throw new Error("EMPTY_HEADERS");
    }

    return { headers, rows: dataRows };
  }

  async processDataset(filename, headers, rows, sourceLabel) {
    this.dataset = { filename, headers, rows, sourceLabel };
    this.currentAnalysis = this.analyzer.analyzeData(rows, headers);
    this.localSummary = this.buildLocalSummary(headers, rows, this.currentAnalysis);

    this.updateLoading("حساب الإحصاءات المحلية...", "55%");
    await wait(250);
    this.showDashboard(filename);
    this.hideLoading();
    await this.getAIInsights();
  }

  showLoading(status) {
    document.getElementById("upload-section")?.classList.add("hidden");
    document.getElementById("loading-overlay")?.classList.remove("hidden");
    this.updateLoading(status || "قراءة البيانات...", "20%");
  }

  hideLoading() {
    document.getElementById("loading-overlay")?.classList.add("hidden");
  }

  updateLoading(text, width) {
    const bar = document.getElementById("loading-bar");
    const status = document.getElementById("loading-status");
    if (bar) bar.style.width = width || "25%";
    if (status) status.textContent = text;
  }

  showDashboard(filename) {
    document.getElementById("dashboard-section")?.classList.remove("hidden");

    const analysis = this.currentAnalysis;
    document.getElementById("file-name-display").textContent = filename;
    document.getElementById("total-rows").textContent = analysis.totalRows.toLocaleString("ar-SA");
    document.getElementById("total-columns").textContent = analysis.totalColumns.toLocaleString("ar-SA");
    document.getElementById("ai-quality-score").textContent = `${analysis.qualityScore}%`;

    const sourceBadge = document.getElementById("dataset-source-badge");
    if (sourceBadge) sourceBadge.textContent = this.dataset.sourceLabel;

    this.renderPreviewTable();
    this.renderLocalStats();
    this.analyzer.renderCharts(analysis);
  }

  buildLocalSummary(headers, rows, analysis) {
    const previewRows = rows.slice(0, 20);
    const missingCells = rows.reduce((total, row) => {
      return total + headers.reduce((count, _, index) => count + (String(row[index] ?? "").trim() === "" ? 1 : 0), 0);
    }, 0);
    const totalCells = Math.max(rows.length * headers.length, 1);

    const columns = headers.map((name, index) => {
      const values = rows.map((row) => row[index]);
      const filledValues = values.filter((value) => String(value ?? "").trim() !== "");
      const numericValues = filledValues.map(toNumber).filter((value) => Number.isFinite(value));
      const isNumeric = filledValues.length > 0 && numericValues.length / filledValues.length >= 0.8;
      const uniqueValues = new Set(filledValues.map((value) => String(value).trim())).size;
      const missing = values.length - filledValues.length;

      if (!isNumeric) {
        return {
          name,
          type: "categorical",
          missing,
          unique: uniqueValues,
          topValues: frequency(values).slice(0, 5)
        };
      }

      const sorted = [...numericValues].sort((a, b) => a - b);
      const sum = numericValues.reduce((total, value) => total + value, 0);
      const mean = sum / numericValues.length;
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...numericValues);
      const max = Math.max(...numericValues);
      const stdDev = Math.sqrt(numericValues.reduce((total, value) => total + Math.pow(value - mean, 2), 0) / numericValues.length);
      const outliers = numericValues.filter((value) => Math.abs(value - mean) > stdDev * 2).length;

      return {
        name,
        type: "numeric",
        missing,
        unique: uniqueValues,
        sum,
        mean,
        median,
        min,
        max,
        stdDev,
        outliers
      };
    });

    return {
      filename: this.dataset.filename,
      sourceLabel: this.dataset.sourceLabel,
      totalRows: rows.length,
      totalColumns: headers.length,
      totalCells,
      missingCells,
      missingRate: Math.round((missingCells / totalCells) * 100),
      qualityScore: analysis.qualityScore,
      numericColumnCount: columns.filter((column) => column.type === "numeric").length,
      categoricalColumnCount: columns.filter((column) => column.type === "categorical").length,
      headers,
      previewRows,
      columns,
      localInsights: analysis.insights.map((item) => item.text)
    };
  }

  renderPreviewTable() {
    const table = document.getElementById("preview-table");
    if (!table || !this.dataset) return;

    const headers = this.dataset.headers;
    const rows = this.dataset.rows.slice(0, 20);

    table.innerHTML = `
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>
        `).join("")}
      </tbody>
    `;
  }

  renderLocalStats() {
    const container = document.getElementById("local-stats-grid");
    if (!container || !this.localSummary) return;

    document.getElementById("local-stats-status").textContent = `${this.localSummary.numericColumnCount} رقمية / ${this.localSummary.categoricalColumnCount} وصفية`;

    container.innerHTML = this.localSummary.columns.map((column) => {
      if (column.type === "numeric") {
        return `
          <article class="local-stat-card">
            <div class="flex items-center justify-between gap-3">
              <h4>${escapeHtml(column.name)}</h4>
              <span>رقمي</span>
            </div>
            <dl>
              <div><dt>المتوسط</dt><dd>${formatNumber(column.mean)}</dd></div>
              <div><dt>الأدنى</dt><dd>${formatNumber(column.min)}</dd></div>
              <div><dt>الأعلى</dt><dd>${formatNumber(column.max)}</dd></div>
              <div><dt>قيم شاذة محتملة</dt><dd>${formatNumber(column.outliers)}</dd></div>
              <div><dt>قيم مفقودة</dt><dd>${formatNumber(column.missing)}</dd></div>
            </dl>
          </article>
        `;
      }

      return `
        <article class="local-stat-card">
          <div class="flex items-center justify-between gap-3">
            <h4>${escapeHtml(column.name)}</h4>
            <span>وصفي</span>
          </div>
          <dl>
            <div><dt>قيم فريدة</dt><dd>${formatNumber(column.unique)}</dd></div>
            <div><dt>قيم مفقودة</dt><dd>${formatNumber(column.missing)}</dd></div>
            <div><dt>الأكثر تكراراً</dt><dd>${escapeHtml(column.topValues[0]?.[0] || "-")}</dd></div>
          </dl>
        </article>
      `;
    }).join("");
  }

  async getAIInsights() {
    const container = document.getElementById("ai-insights-list");
    const status = document.getElementById("gemini-json-status");
    if (container) container.innerHTML = '<li class="text-gray-500">جاري إرسال الملخص إلى Gemini...</li>';
    if (status) status.textContent = "جاري التحليل";

    const prompt = this.buildExecutivePrompt();

    try {
      const gemini = window.BrightAIGemini;
      if (!gemini) throw new Error("Gemini client is not loaded");

      const response = await gemini.generateText(prompt, {
        temperature: 0.35,
        maxOutputTokens: 1200,
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 1200,
          responseMimeType: "application/json"
        }
      });

      this.geminiReport = normalizeGeminiReport(parseGeminiJson(response.text));
      this.renderGeminiReport();
    } catch (error) {
      console.error(error);
      this.geminiReport = this.buildFallbackReport(error);
      this.renderGeminiReport(true);
    }
  }

  buildExecutivePrompt() {
    const summaryForModel = {
      dataset: {
        filename: this.localSummary.filename,
        source: this.localSummary.sourceLabel,
        rows: this.localSummary.totalRows,
        columns: this.localSummary.totalColumns,
        qualityScore: this.localSummary.qualityScore,
        missingRate: this.localSummary.missingRate
      },
      columns: this.localSummary.columns.map((column) => {
        if (column.type === "numeric") {
          return {
            name: column.name,
            type: column.type,
            missing: column.missing,
            min: round(column.min),
            max: round(column.max),
            mean: round(column.mean),
            outliers: column.outliers
          };
        }

        return {
          name: column.name,
          type: column.type,
          missing: column.missing,
          unique: column.unique,
          topValues: column.topValues
        };
      }),
      sampleRows: this.localSummary.previewRows.slice(0, 8)
    };

    return `أنت مستشار تحليل بيانات تنفيذي لشركة سعودية. حلل ملخص dataset التالي فقط دون اختلاق حقائق خارجية.
أعد JSON صالحاً فقط بلا Markdown وبالمفاتيح الإنجليزية التالية:
executive_summary: string عربي موجز،
anomalies: array of strings،
opportunities: array of strings،
recommended_charts: array of strings،
follow_up_questions: array of strings،
cta_message: string عربي يدعو للخطوة التالية مع Bright AI.

ملخص البيانات:
${JSON.stringify(summaryForModel, null, 2)}`;
  }

  renderGeminiReport(hasError = false) {
    const container = document.getElementById("ai-insights-list");
    const jsonView = document.getElementById("gemini-json-view");
    const status = document.getElementById("gemini-json-status");
    const report = this.geminiReport;

    if (status) status.textContent = hasError ? "تعذر الاتصال" : "جاهز";

    if (container) {
      container.innerHTML = `
        <li class="ai-report-item">
          <strong>الملخص التنفيذي</strong>
          <span>${escapeHtml(report.executive_summary)}</span>
        </li>
        ${report.anomalies.map((item) => this.renderInsightItem("fa-triangle-exclamation", "شذوذ", item)).join("")}
        ${report.opportunities.map((item) => this.renderInsightItem("fa-arrow-trend-up", "فرصة", item)).join("")}
        <li class="ai-report-item cta">
          <strong>الخطوة التالية</strong>
          <span>${escapeHtml(report.cta_message)}</span>
        </li>
      `;
    }

    if (jsonView) {
      jsonView.innerHTML = `<pre>${escapeHtml(JSON.stringify(report, null, 2))}</pre>`;
    }
  }

  renderInsightItem(icon, label, text) {
    return `
      <li class="ai-report-item">
        <i class="fa-solid ${icon}"></i>
        <strong>${label}</strong>
        <span>${escapeHtml(text)}</span>
      </li>
    `;
  }

  buildFallbackReport(error) {
    const message = window.BrightAIGemini?.getErrorMessage?.(error) || "تعذر توليد تحليل Gemini حالياً.";
    return {
      executive_summary: `${message} تم عرض الإحصاءات المحلية كبديل مؤقت.`,
      anomalies: this.localSummary.columns
        .filter((column) => column.type === "numeric" && column.outliers > 0)
        .slice(0, 3)
        .map((column) => `العمود ${column.name} يحتوي على ${column.outliers} قيمة شاذة محتملة.`),
      opportunities: this.localSummary.localInsights.slice(0, 3),
      recommended_charts: ["مخطط أعمدة للأعمدة الرقمية", "مخطط دائري لأكثر الفئات تكراراً"],
      follow_up_questions: ["ما المؤشر التجاري الأهم الذي تريد تحسينه؟", "هل تريد ربط هذه البيانات بلوحة مؤشرات دورية؟"],
      cta_message: "يمكن لفريق Bright AI تحويل هذا التحليل الأولي إلى لوحة مؤشرات مؤسسية وربط مباشر مع أنظمة العمل."
    };
  }

  async askQuestion(question) {
    if (!question?.trim() || !this.dataset) return;

    const container = document.getElementById("ai-insights-list");
    const input = document.getElementById("ask-input");
    const askBtn = document.getElementById("ask-btn");
    const cleanQuestion = question.trim();

    container.innerHTML += `
      <li class="flex gap-3 bg-blue-500/10 p-4 rounded-xl border border-blue-500/20">
        <i class="fa-solid fa-user text-blue-400"></i>
        <span>${escapeHtml(cleanQuestion)}</span>
      </li>
    `;
    input.value = "";

    try {
      if (askBtn) {
        askBtn.disabled = true;
        askBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      }

      const gemini = window.BrightAIGemini;
      if (!gemini) throw new Error("Gemini client is not loaded");

      const prompt = `أجب بالعربية بناءً على dataset الحالي فقط.
السؤال: ${cleanQuestion}
ملخص الإحصاءات:
${JSON.stringify(this.localSummary, null, 2)}
آخر تقرير Gemini:
${JSON.stringify(this.geminiReport, null, 2)}
اكتب إجابة تنفيذية مختصرة، واذكر إن كانت البيانات الحالية لا تكفي للإجابة.`;

      const response = await gemini.generateText(prompt, {
        temperature: 0.45,
        maxOutputTokens: 500
      });

      container.innerHTML += `
        <li class="flex gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
          <i class="fa-solid fa-robot text-purple-400"></i>
          <span>${escapeHtml(response.text)}</span>
        </li>
      `;
      container.parentElement.scrollTop = container.parentElement.scrollHeight;
    } catch (error) {
      container.innerHTML += `
        <li class="flex gap-3 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
          <i class="fa-solid fa-exclamation-circle text-red-400"></i>
          <span>${escapeHtml(window.BrightAIGemini?.getErrorMessage(error) || "حدث خطأ في الإجابة.")}</span>
        </li>
      `;
    } finally {
      if (askBtn) {
        askBtn.disabled = false;
        askBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
      }
    }
  }

  exportJsonReport() {
    if (!this.currentAnalysis) return;

    const report = this.buildExportPayload();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `brightai-data-analysis-${Date.now()}.json`);
  }

  exportPdfReport() {
    if (!this.currentAnalysis) return;

    const report = this.buildExportPayload();
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("تعذر فتح نافذة التصدير. اسمح بالنوافذ المنبثقة ثم أعد المحاولة.");
      return;
    }

    printWindow.document.write(buildPrintableReport(report));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 350);
  }

  async copySummary() {
    if (!this.geminiReport) return;

    const text = [
      "الملخص التنفيذي:",
      this.geminiReport.executive_summary,
      "",
      "الشذوذ:",
      ...this.geminiReport.anomalies.map((item) => `- ${item}`),
      "",
      "الفرص:",
      ...this.geminiReport.opportunities.map((item) => `- ${item}`),
      "",
      "الخطوة التالية:",
      this.geminiReport.cta_message
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      alert("تم نسخ الملخص.");
    } catch {
      alert("تعذر النسخ تلقائياً من المتصفح.");
    }
  }

  buildExportPayload() {
    return {
      generatedAt: new Date().toISOString(),
      dataset: {
        filename: this.dataset.filename,
        source: this.dataset.sourceLabel,
        rows: this.localSummary.totalRows,
        columns: this.localSummary.totalColumns,
        qualityScore: this.localSummary.qualityScore
      },
      local_summary: this.localSummary,
      gemini_json: this.geminiReport,
      preview_rows: this.localSummary.previewRows
    };
  }
}

document.addEventListener("DOMContentLoaded", () => new DataAnalyzerPage());

function parseGeminiJson(text) {
  const raw = String(text || "").trim();
  const withoutFence = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const jsonText = start >= 0 && end >= start ? withoutFence.slice(start, end + 1) : withoutFence;
  return JSON.parse(jsonText);
}

function normalizeGeminiReport(report) {
  return {
    executive_summary: String(report.executive_summary || "لم يرجع Gemini ملخصاً تنفيذياً واضحاً."),
    anomalies: normalizeStringArray(report.anomalies),
    opportunities: normalizeStringArray(report.opportunities),
    recommended_charts: normalizeStringArray(report.recommended_charts),
    follow_up_questions: normalizeStringArray(report.follow_up_questions),
    cta_message: String(report.cta_message || "احجز جلسة مع Bright AI لتحويل العينة إلى تحليل مؤسسي قابل للتنفيذ.")
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function frequency(values) {
  const counts = new Map();
  values.forEach((value) => {
    const key = String(value ?? "").trim() || "(فارغ)";
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function toNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").replace(/,/g, "").trim();
  return Number.parseFloat(normalized);
}

function formatNumber(value) {
  if (!Number.isFinite(Number(value))) return "-";
  return Number(value).toLocaleString("ar-SA", { maximumFractionDigits: 2 });
}

function round(value) {
  return Number.isFinite(Number(value)) ? Number(Number(value).toFixed(2)) : null;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildPrintableReport(report) {
  const gemini = report.gemini_json || {};
  return `<!DOCTYPE html>
<html lang="ar-SA" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير تحليل البيانات | Bright AI</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; line-height: 1.8; }
    h1, h2 { color: #312e81; }
    section { margin-block: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: start; }
    th { background: #eef2ff; }
    .meta { color: #475569; }
  </style>
</head>
<body>
  <h1>تقرير تحليل البيانات من Bright AI</h1>
  <p class="meta">الملف: ${escapeHtml(report.dataset.filename)} | السجلات: ${formatNumber(report.dataset.rows)} | الأعمدة: ${formatNumber(report.dataset.columns)} | جودة البيانات: ${formatNumber(report.dataset.qualityScore)}%</p>
  <section>
    <h2>الملخص التنفيذي</h2>
    <p>${escapeHtml(gemini.executive_summary || "")}</p>
  </section>
  <section>
    <h2>الشذوذ المحتمل</h2>
    <ul>${(gemini.anomalies || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
  <section>
    <h2>الفرص</h2>
    <ul>${(gemini.opportunities || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
  <section>
    <h2>الرسوم المقترحة</h2>
    <ul>${(gemini.recommended_charts || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
  <section>
    <h2>أسئلة متابعة</h2>
    <ul>${(gemini.follow_up_questions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
  </section>
  <section>
    <h2>معاينة البيانات</h2>
    <table>
      <thead><tr>${report.local_summary.headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>
      <tbody>${report.preview_rows.map((row) => `<tr>${report.local_summary.headers.map((_, index) => `<td>${escapeHtml(row[index] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </section>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
