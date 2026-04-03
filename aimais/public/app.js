const state = {
  config: {},
  analytics: null,
  itemsByPct: [],
  importHistory: [],
  targets: {},
  tasks: [],
  plans: [],
  reports: [],
  handovers: [],
  human: null,
  session: { role: "viewer", actor: "Guest", permissions: [] },
  adminSessions: [],
  auditTrail: [],
  generatedSessionToken: null
};

const numberFormatter = new Intl.NumberFormat("en-US");
const VALID_ROLES = ["admin", "manager", "viewer"];
const ROLE_COPILOT_TYPES = {
  admin: null,
  manager: null,
  viewer: null
};
const analyticsUi = {
  trendView: "monthly",
  reportDraft: null,
  scorecardEmailOpen: false,
  recentWindowFilter: "all",
  charts: {
    topProducts: null,
    pareto: null
  },
  paretoRows: null,
  importHistoryOpen: false,
  clearAllArmed: false
};
const SESSION_KEY = "aimais_session_token";
const ACTOR_KEY = "aimais_actor_name";
const SCORECARD_RECIPIENTS_STORAGE_KEY = "aimais_last_scorecard_recipients";
const SCORECARD_TARGETS_STORAGE_KEY = "aimais_scorecard_targets";
const REPORT_RECIPIENTS_STORAGE_KEY = "aimais_last_recipients";
const REPORT_TEMPLATES = [
  {
    id: "weekly-flash",
    icon: "📋",
    label: "Weekly Flash",
    description: "Fast weekly summary for operations leadership.",
    title: "Weekly QC Flash Report",
    type: "weekly"
  },
  {
    id: "monthly-exec",
    icon: "📊",
    label: "Monthly Executive",
    description: "Full monthly brief for executive distribution.",
    title: "Monthly Executive QC Brief",
    type: "monthly"
  },
  {
    id: "escalation",
    icon: "🚨",
    label: "Escalation Alert",
    description: "Urgent escalation with containment and owner.",
    title: "Quality Escalation — Urgent",
    type: "weekly"
  }
];
const thresholdLinePlugin = {
  id: "thresholdLine",
  afterDatasetsDraw(chart, _args, options) {
    const scaleId = options?.scaleId || "y";
    const scale = chart.scales[scaleId];
    if (!scale) {
      return;
    }

    const axis = options?.axis || "y";
    const value = Number(options?.value ?? 5);
    const pixel = scale.getPixelForValue(value);
    const { ctx, chartArea } = chart;
    if (!chartArea) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = options?.color || "#ff7d73";
    ctx.setLineDash(options?.dash || [8, 6]);
    ctx.lineWidth = options?.width || 1.5;
    ctx.beginPath();
    if (axis === "x") {
      ctx.moveTo(pixel, chartArea.top);
      ctx.lineTo(pixel, chartArea.bottom);
    } else {
      ctx.moveTo(chartArea.left, pixel);
      ctx.lineTo(chartArea.right, pixel);
    }
    ctx.stroke();
    ctx.restore();
  }
};
const doughnutCenterTextPlugin = {
  id: "doughnutCenterText",
  afterDraw(chart, _args, options) {
    if (chart.config.type !== "doughnut") {
      return;
    }

    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) {
      return;
    }

    const { ctx } = chart;
    const { x, y } = meta.data[0];
    const lines = options?.lines || [];
    const gap = options?.lineGap || 24;

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((line, index) => {
      ctx.font = line.font || "600 13px Geist, Inter, Segoe UI, sans-serif";
      ctx.fillStyle = line.color || "#edf4fb";
      const offset = (index - (lines.length - 1) / 2) * gap;
      ctx.fillText(line.text, x, y + offset);
    });
    ctx.restore();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initMobileNav();
  bindForms();
  renderCommonLoading();
  renderPage({ isLoading: true });
  loadApp();
});

function getSessionToken() {
  return localStorage.getItem(SESSION_KEY) || "";
}

function setSessionToken(token) {
  localStorage.setItem(SESSION_KEY, token);
}

function clearSessionToken() {
  localStorage.removeItem(SESSION_KEY);
}

function getActor() {
  return localStorage.getItem(ACTOR_KEY) || state.session?.actor || "Guest";
}

function setActor(actor) {
  if (!actor) {
    localStorage.removeItem(ACTOR_KEY);
    return;
  }
  localStorage.setItem(ACTOR_KEY, actor);
}

function buildApiHeaders(headers = {}) {
  const merged = new Headers(headers);
  const token = getSessionToken();
  const actor = getActor();
  if (token && !merged.has("x-session-token")) {
    merged.set("x-session-token", token);
  }
  if (actor && !merged.has("x-actor")) {
    merged.set("x-actor", actor);
  }
  return merged;
}

function apiFetch(resource, options = {}) {
  return fetch(resource, {
    ...options,
    headers: buildApiHeaders(options.headers)
  });
}

function initMobileNav() {
  const hamburger = document.getElementById("hamburger-btn");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("drawer-overlay");
  const pageTitleEl = document.getElementById("mobile-page-title");

  if (!hamburger || !sidebar || !overlay) return;

  const page = document.body.dataset.page || "";
  const pageTitles = {
    dashboard: "Dashboard",
    analytics: "Analytics",
    operations: "Operations",
    plans: "Plans",
    copilot: "AI Copilot",
    reports: "Reports",
    scorecard: "Scorecard",
    executive: "Executive View",
    settings: "Settings"
  };

  if (pageTitleEl) {
    pageTitleEl.textContent = pageTitles[page] || "AIMAIS";
  }

  function openDrawer() {
    sidebar.classList.add("drawer-open");
    overlay.classList.add("visible");
    hamburger.classList.add("open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    sidebar.classList.remove("drawer-open");
    overlay.classList.remove("visible");
    hamburger.classList.remove("open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", () => {
    const isOpen = sidebar.classList.contains("drawer-open");
    if (isOpen) {
      closeDrawer();
      return;
    }
    openDrawer();
  });

  overlay.addEventListener("click", closeDrawer);

  sidebar.querySelectorAll(".nav a").forEach((link) => {
    link.addEventListener("click", closeDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDrawer();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeDrawer();
    }
  });
}

async function loadApp() {
  try {
    analyticsUi.paretoRows = null;
    analyticsUi.clearAllArmed = false;
    await ensureSessionToken();
    await loadSession();
    renderCommonLoading();
    renderPage({ isLoading: true });
    renderSkeletons();
    const [dashboardResponse, itemsByPctResponse, importHistoryResponse] = await Promise.all([
      apiFetch("/api/dashboard"),
      apiFetch("/api/reject/items-by-pct"),
      apiFetch("/api/import/history")
    ]);
    const [payload, itemsByPctPayload, importHistoryPayload] = await Promise.all([
      dashboardResponse.json(),
      itemsByPctResponse.json(),
      importHistoryResponse.json()
    ]);
    Object.assign(state, payload, {
      itemsByPct: Array.isArray(itemsByPctPayload) ? itemsByPctPayload : [],
      importHistory: Array.isArray(importHistoryPayload) ? importHistoryPayload : []
    });
    try {
      const targetsResponse = await apiFetch("/api/targets");
      const targetsPayload = await targetsResponse.json();
      state.targets = normalizeTargetsPayload(targetsPayload);
      persistScorecardTargets(state.targets);
    } catch {
      state.targets = loadStoredScorecardTargets();
    }
    if (document.body.dataset.page === "settings") {
      await loadSettingsData();
    }
    renderCommon();
    renderPage();
    checkFileStatus();
  } catch {
    const fallback = document.querySelector(".lead");
    if (fallback) {
      fallback.textContent = "Unable to load the workspace right now. Start the server and make sure data has been imported.";
    }
  }
}

async function ensureSessionToken() {
  const token = getSessionToken();
  if (token) return;

  const inputToken = window.prompt(
    "Enter your access token to continue.\n\n"
    + "Contact your administrator if you don't have one.\n\n"
    + "Default tokens (change these!):\n"
    + "  Admin:   aimais-admin-default-token-change-me\n"
    + "  Manager: aimais-manager-default-token\n"
    + "  Viewer:  aimais-viewer-default-token"
  );

  if (inputToken?.trim()) {
    setSessionToken(inputToken.trim());
  }
}

async function loadSession() {
  const token = getSessionToken();
  if (!token) {
    state.session = { role: "viewer", actor: "Guest", permissions: [] };
    setActor("Guest");
    return;
  }

  try {
    const res = await fetch("/api/session", {
      headers: { "x-session-token": token }
    });
    if (res.ok) {
      state.session = await res.json();
      setActor(state.session.actor);
    } else {
      state.session = { role: "viewer", actor: "Guest", permissions: [] };
      setActor("Guest");
    }
  } catch {
    state.session = { role: "viewer", actor: "Guest", permissions: [] };
    setActor("Guest");
  }
}

async function loadSettingsData() {
  state.adminSessions = [];
  state.auditTrail = [];

  const requests = [];
  if (hasPermission("roles:assign")) {
    requests.push(
      apiFetch("/api/sessions")
        .then((response) => response.ok ? response.json() : [])
        .then((rows) => {
          state.adminSessions = Array.isArray(rows) ? rows : [];
        })
        .catch(() => {
          state.adminSessions = [];
        })
    );
  }

  if (hasPermission("audit:view")) {
    requests.push(
      apiFetch("/api/audit")
        .then((response) => response.ok ? response.json() : [])
        .then((rows) => {
          state.auditTrail = Array.isArray(rows) ? rows : [];
        })
        .catch(() => {
          state.auditTrail = [];
        })
    );
  }

  await Promise.all(requests);
}

function normalizeTargetsPayload(rows) {
  if (!Array.isArray(rows)) {
    return loadStoredScorecardTargets();
  }

  return rows.reduce((acc, row) => {
    const metric = String(row.metric || "").trim();
    const targetPct = Number(row.target_pct);
    if (metric && Number.isFinite(targetPct)) {
      acc[metric] = targetPct;
    }
    return acc;
  }, {});
}

function loadStoredScorecardTargets() {
  try {
    const raw = localStorage.getItem(SCORECARD_TARGETS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function persistScorecardTargets(targets) {
  try {
    localStorage.setItem(SCORECARD_TARGETS_STORAGE_KEY, JSON.stringify(targets || {}));
  } catch {
    // Ignore storage failures and keep targets in memory.
  }
}

function getOverallTargetPct() {
  const value = Number(state.targets?.overall);
  return Number.isFinite(value) ? value : 2;
}

async function refreshTasksOnly() {
  const response = await apiFetch("/api/tasks");
  const tasks = await response.json();
  state.tasks = Array.isArray(tasks) ? tasks : [];
  renderTaskBoard();
  renderSidebarTasks();
  updateTaskSummary();
}

function updateTaskSummary() {
  renderTaskPreview(
    document.getElementById("tasks-preview"),
    state.tasks.filter((task) => task.status !== "done").slice(0, 3)
  );
}

function getCurrentRole() {
  return state.session?.role || "viewer";
}

function hasPermission(permission) {
  return state.session?.permissions?.includes(permission) ?? false;
}

function getAllowedCopilotTypes(role = getCurrentRole()) {
  return ROLE_COPILOT_TYPES[role] || null;
}

function canManageImports(role = getCurrentRole()) {
  return hasPermission("import:excel");
}

function canEditTasks(role = getCurrentRole()) {
  return hasPermission("tasks:write");
}

async function checkFileStatus() {
  if (document.body.dataset.page !== "dashboard") return;

  const pill = document.getElementById("file-status-pill");
  if (!pill) return;

  try {
    const response = await fetch("/api/file-status");
    const data = await response.json();
    pill.style.opacity = "1";

    if (data.isImporting) {
      pill.innerHTML = `
        <span class="file-status-spinner"></span>
        Syncing new data...
      `;
      pill.className = "file-status-pill importing";
      pill.style.display = "flex";
      pill.style.cursor = "";
      pill.onclick = null;

      setTimeout(checkFileStatus, 3000);
    } else if (data.hasNewData) {
      pill.innerHTML = "↻ New data available - click to refresh";
      pill.className = "file-status-pill has-new";
      pill.style.display = "flex";
      pill.style.cursor = "pointer";
      pill.onclick = () => window.location.reload();
    } else if (data.status === "up_to_date") {
      if (data.lastImportAt) {
        const syncedTime = new Date(data.lastImportAt)
          .toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        const rows = (data.rowCount || 0).toLocaleString("en-US");
        pill.innerHTML = `✓ Data current · ${rows} rows · synced ${syncedTime}`;
        pill.className = "file-status-pill up-to-date";
        pill.style.display = "flex";
        pill.style.cursor = "";
        pill.onclick = null;

        setTimeout(() => {
          pill.style.opacity = "0";
          setTimeout(() => {
            pill.style.display = "none";
          }, 400);
        }, 5000);
      }
    } else {
      pill.style.display = "none";
      pill.style.cursor = "";
      pill.onclick = null;
    }
  } catch {
    const pillNode = document.getElementById("file-status-pill");
    if (pillNode) {
      pillNode.style.display = "none";
    }
  }
}

function canManageReports(role = getCurrentRole()) {
  return hasPermission("reports:generate");
}

function canManagePlans(role = getCurrentRole()) {
  return hasPermission("plans:write");
}

function isSupervisorRole(role = getCurrentRole()) {
  return false;
}

function withRoleParam(href) {
  return href;
}

function syncRoleAwareLinks() {
  return;
}

function renderRoleSwitcher() {
  const box = document.getElementById("role-switcher");
  if (!box) return;
  const actor = state.session?.actor || "Guest";
  const role = getCurrentRole();
  box.innerHTML = `
    <span class="role-pill active">${escapeHtml(actor)}</span>
    <span class="role-badge ${role}">${role}</span>
    <button type="button" class="role-pill" data-session-reset="true">Change Token</button>
  `;
}

function applyRoleFilter(role) {
  document.querySelectorAll("[data-hidden='true']").forEach((element) => {
    delete element.dataset.hidden;
  });
}

function bindForms() {
  const role = getCurrentRole();
  const taskForm = document.getElementById("task-form");
  if (taskForm && canEditTasks(role)) {
    taskForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(taskForm);
      await apiFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      taskForm.reset();
      await refreshTasksOnly();
    });
  }

  const taskAiSuggestButton = document.getElementById("task-ai-suggest-btn");
  if (taskAiSuggestButton && canEditTasks(role)) {
    taskAiSuggestButton.addEventListener("click", async () => {
      const taskNote = document.querySelector('#task-form textarea[name="progressNote"]');
      taskAiSuggestButton.disabled = true;
      taskAiSuggestButton.textContent = "Thinking...";
      try {
        const dashboardResponse = await apiFetch("/api/dashboard");
        const dashboard = await dashboardResponse.json();
        const topAlerts = (dashboard.analytics?.productAlerts || [])
          .slice(0, 3)
          .map((item) => `${item.productName || item.code} at ${item.latestRate}% (+${item.delta}% vs baseline)`)
          .join("; ");
        const aiResponse = await apiFetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "daily-tasks",
            prompt: `Create practical daily tasks from these top alerts: ${topAlerts || "No major alert rows available right now."}`
          })
        });
        const aiPayload = await aiResponse.json();
        const firstTask = extractFirstSuggestedTask(aiPayload.content || "");
        if (taskNote) {
          taskNote.value = firstTask;
        }
      } catch {
        if (taskNote) {
          taskNote.value = "Review the highest current reject signal, assign one owner, and confirm the first containment check for this shift.";
        }
      } finally {
        taskAiSuggestButton.disabled = false;
        taskAiSuggestButton.textContent = "AI Suggest Tasks";
      }
    });
  }

  const handoverForm = document.getElementById("handover-form");
  if (handoverForm) {
    handoverForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(handoverForm);
      await apiFetch("/api/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      handoverForm.reset();
      loadApp();
    });
  }

  const importForm = document.getElementById("import-form");
  if (importForm && canManageImports(role)) {
    importForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const fileInput = importForm.querySelector('input[name="excelFile"]');
      const statusBox = document.getElementById("import-status");
      const submitButton = importForm.querySelector('[data-import-action="upload"]');
      const file = fileInput?.files?.[0];
      if (!file) {
        if (statusBox) {
          statusBox.textContent = "Select an .xlsx file.";
        }
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Uploading...";
      if (statusBox) {
        statusBox.textContent = "Importing workbook...";
      }

      try {
        const contentBase64 = await readFileAsBase64(file);
        const response = await apiFetch("/api/import/excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentBase64
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || payload.error || "Import failed");
        }
        if (statusBox) {
          statusBox.textContent = `Imported ${numberFormatter.format(payload.rowCount || 0)} rows — latest period: ${payload.latestMonthLabel}`;
        }
        importForm.reset();
        await loadApp();
        setTimeout(checkFileStatus, 2000);
      } catch (error) {
        if (statusBox) {
          statusBox.textContent = error.message || "Import failed.";
        }
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Upload and refresh analytics";
      }
    });
  }

  const bundledImportButton = document.getElementById("bundled-import-button");
  if (bundledImportButton && canManageImports(role)) {
    bundledImportButton.addEventListener("click", async () => {
      const statusBox = document.getElementById("import-status");
      bundledImportButton.disabled = true;
      bundledImportButton.textContent = "Importing...";
      if (statusBox) {
        statusBox.textContent = "Importing workbook...";
      }

      try {
        const response = await apiFetch("/api/import/bundled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || payload.error || "Bundled import failed");
        }
        if (statusBox) {
          statusBox.textContent = `Imported ${numberFormatter.format(payload.rowCount || 0)} rows — latest period: ${payload.latestMonthLabel}`;
        }
        await loadApp();
        setTimeout(checkFileStatus, 2000);
      } catch (error) {
        if (statusBox) {
          statusBox.textContent = error.message || "Bundled import failed.";
        }
      } finally {
        bundledImportButton.disabled = false;
        bundledImportButton.textContent = "Use project workbook";
      }
    });
  }

  const reportForm = document.getElementById("report-form");
  if (reportForm && canManageReports(role)) {
    const reportTitleInput = reportForm.querySelector('input[name="title"]');
    const reportRecipientsInput = reportForm.querySelector('input[name="recipients"]');
    if (reportRecipientsInput) {
      const applySmartTitle = () => {
        if (!reportTitleInput || reportTitleInput.value.trim()) {
          return;
        }
        reportTitleInput.value = buildSmartReportTitle();
      };
      reportRecipientsInput.addEventListener("focus", applySmartTitle);
      reportRecipientsInput.addEventListener("input", applySmartTitle);
      reportRecipientsInput.addEventListener("change", applySmartTitle);
    }

    reportForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      await generateReportDraftFromForm({ sourceButton: reportForm.querySelector('button[type="submit"]') });
    });
  }

  const reportConfirmSaveButton = document.getElementById("report-confirm-save-btn");
  if (reportConfirmSaveButton && canManageReports(role)) {
    reportConfirmSaveButton.addEventListener("click", async () => {
      const previewText = document.getElementById("report-preview-text");
      const emailToggle = document.getElementById("report-email-toggle");
      const saveStatus = document.getElementById("report-save-status");
      if (!analyticsUi.reportDraft || !previewText) {
        return;
      }
      if (saveStatus) {
        saveStatus.classList.add("hidden");
        saveStatus.textContent = "";
      }
      reportConfirmSaveButton.disabled = true;
      reportConfirmSaveButton.textContent = "Saving...";
      const savedDraft = {
        ...analyticsUi.reportDraft,
        summary: previewText.value
      };
      const response = await apiFetch("/api/reports/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...savedDraft,
          emailToRecipients: Boolean(emailToggle?.checked)
        })
      });
      const payload = await response.json();
      if (response.ok) {
        if (savedDraft.recipients?.trim()) {
          saveReportRecipients(savedDraft.recipients.trim());
        }
        state.reports = [
          {
            id: payload.id,
            title: savedDraft.title,
            period_label: savedDraft.periodLabel,
            summary: savedDraft.summary,
            recipients: savedDraft.recipients,
            generated_by: payload.provider || savedDraft.generatedBy || "manual-review"
          },
          ...state.reports
        ].slice(0, 12);
        renderReportsPreview(document.getElementById("reports-list"), state.reports);
        analyticsUi.reportDraft = null;
        renderReportDraftPreview();
      }
      if (saveStatus) {
        saveStatus.classList.remove("hidden");
        saveStatus.textContent = response.ok
          ? buildReportSaveStatusMessage(payload)
          : payload.error || "Unable to save the report.";
      }
      reportConfirmSaveButton.disabled = false;
      reportConfirmSaveButton.textContent = "Confirm and Save";
    });
  }

  const pdfButton = document.getElementById("reports-download-pdf");
  if (pdfButton && canManageReports(role)) {
    pdfButton.addEventListener("click", async () => {
      pdfButton.disabled = true;
      pdfButton.textContent = "Generating PDF...";
      try {
        await ensureJsPdfLoaded();
        const previewText = document.getElementById("report-preview-text");
        await generatePdfReport({
          title: analyticsUi.reportDraft?.title || "Quality Control Report",
          recipients: analyticsUi.reportDraft?.recipients || "",
          summary: previewText?.value || analyticsUi.reportDraft?.summary || "",
          period: state.analytics?.latestMonthLabel || ""
        });
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        pdfButton.disabled = false;
        pdfButton.textContent = "Download PDF";
      }
    });
  }

  const planForm = document.getElementById("plan-form");
  if (planForm && canManagePlans(role)) {
    planForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(planForm);
      const button = planForm.querySelector("button[type='submit']");
      const planId = Number(planForm.dataset.editPlanId || 0);
      const isEditing = Boolean(planId);
      button.disabled = true;
      button.textContent = "Saving...";
      await apiFetch(isEditing ? `/api/plans/${planId}` : "/api/plans", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEditing
            ? {
                title: formData.get("title"),
                objective: formData.get("objective"),
                ownerName: formData.get("ownerName"),
                horizonLabel: formData.get("horizonLabel"),
                status: formData.get("status"),
                impactScore: formData.get("impactScore")
              }
            : Object.fromEntries(formData.entries())
        )
      });
      planForm.reset();
      delete planForm.dataset.editPlanId;
      const impactInput = document.getElementById("plan-impact-input");
      const impactValue = document.getElementById("plan-impact-value");
      if (impactInput) {
        impactInput.value = "80";
      }
      if (impactValue) {
        impactValue.textContent = "80";
      }
      button.disabled = false;
      button.textContent = "Add Plan";
      if (document.body.dataset.page === "plans") {
        await refreshPlansState();
      } else {
        loadApp();
      }
    });
  }

  const planAiSuggestBtn = document.getElementById("plan-ai-suggest-btn");
  if (planAiSuggestBtn) {
    planAiSuggestBtn.addEventListener("click", async () => {
      const statusBox = document.getElementById("plan-ai-status");
      const titleInput = document.querySelector('#plan-form input[name="title"]');
      const objectiveInput = document.querySelector('#plan-form textarea[name="objective"]');
      const ownerInput = document.querySelector('#plan-form input[name="ownerName"]');
      const horizonInput = document.querySelector('#plan-form input[name="horizonLabel"]');

      planAiSuggestBtn.disabled = true;
      planAiSuggestBtn.textContent = "Thinking...";
      if (statusBox) {
        statusBox.style.display = "block";
        statusBox.textContent = "Asking AI for a corrective action plan...";
      }

      try {
        const topAlert = state.analytics?.productAlerts?.[0] || null;

        const prompt = [
          `Generate a corrective action plan for`,
          topAlert
            ? `${topAlert.productName || topAlert.code} which has a ${topAlert.latestRate}% reject rate`
            : `the highest-risk item`,
          topAlert
            ? `. The baseline comparison is ${topAlert.baselineRate}% with a delta of ${topAlert.delta}%.`
            : ".",
          `Return a JSON object only with no markdown fences.`,
          `Schema: { "title": string, "description": string,`,
          `"owner_suggestion": string, "duration_weeks": number,`,
          `"recommended_actions": [string, string, string] }`
        ].join(" ");

        const aiResponse = await apiFetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "capa-draft", prompt })
        });

        const aiPayload = await aiResponse.json();
        const raw = (aiPayload.content || "").trim();

        let parsed = null;
        try {
          const clean = raw
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
          parsed = JSON.parse(clean);
        } catch {
          parsed = null;
        }

        if (parsed) {
          if (titleInput && parsed.title) {
            titleInput.value = parsed.title;
          }
          if (objectiveInput) {
            const actions = Array.isArray(parsed.recommended_actions)
              ? parsed.recommended_actions.join(". ")
              : "";
            objectiveInput.value = [
              parsed.description || "",
              actions ? `Actions: ${actions}` : ""
            ]
              .filter(Boolean)
              .join(" ");
          }
          if (ownerInput && parsed.owner_suggestion) {
            ownerInput.value = parsed.owner_suggestion;
          }
          if (horizonInput && parsed.duration_weeks) {
            horizonInput.value = `${parsed.duration_weeks} weeks`;
          }
          if (statusBox) {
            statusBox.textContent = "Fields filled from AI suggestion. Review and adjust before saving.";
          }
        } else {
          if (statusBox) {
            statusBox.textContent = "AI responded but the format could not be parsed. Try again or fill manually.";
          }
        }
      } catch (err) {
        if (statusBox) {
          statusBox.textContent = "AI suggestion failed. Check server connection and try again.";
        }
        console.error("Plan AI suggest failed:", err);
      } finally {
        planAiSuggestBtn.disabled = false;
        planAiSuggestBtn.textContent = "AI Suggest Plan";
      }
    });
  }

  const planImpactInput = document.getElementById("plan-impact-input");
  const planImpactValue = document.getElementById("plan-impact-value");
  if (planImpactInput && planImpactValue) {
    planImpactInput.addEventListener("input", () => {
      planImpactValue.textContent = planImpactInput.value;
    });
  }

  const aiForm = document.getElementById("ai-form");
  if (aiForm) {
    aiForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(aiForm);
      const payload = Object.fromEntries(formData.entries());
      const allowedTypes = getAllowedCopilotTypes(role);
      if (allowedTypes && !allowedTypes.includes(payload.type)) {
        const fallbackType = allowedTypes[0];
        payload.type = fallbackType;
      }
      await runAi(payload);
    });
  }

  const scorecardDownloadButton = document.getElementById("scorecard-download-pdf");
  if (scorecardDownloadButton) {
    scorecardDownloadButton.addEventListener("click", async () => {
      scorecardDownloadButton.disabled = true;
      scorecardDownloadButton.textContent = "Generating PDF...";
      try {
        await ensureJsPdfLoaded();
        await generatePdfReport({
          title: "Monthly Quality Scorecard",
          recipients: "",
          summary: state.analytics?.narrative || "",
          period: state.analytics?.latestMonthLabel || ""
        });
      } catch (err) {
        console.error("Scorecard PDF failed:", err);
      } finally {
        scorecardDownloadButton.disabled = false;
        scorecardDownloadButton.textContent = "Download PDF";
      }
    });
  }

  const executiveDownloadButton = document.getElementById("exec-download-pdf");
  if (executiveDownloadButton) {
    executiveDownloadButton.addEventListener("click", async () => {
      executiveDownloadButton.disabled = true;
      executiveDownloadButton.textContent = "Generating PDF...";
      try {
        await ensureJsPdfLoaded();
        await generatePdfReport({
          title: "Executive Quality Brief",
          recipients: "",
          summary: state.analytics?.narrative || "Executive summary unavailable.",
          period: state.analytics?.latestMonthLabel || ""
        });
      } catch (err) {
        console.error("Executive PDF failed:", err);
      } finally {
        executiveDownloadButton.disabled = false;
        executiveDownloadButton.textContent = "Download PDF";
      }
    });
  }

  const scorecardEmailTrigger = document.getElementById("scorecard-email-trigger");
  if (scorecardEmailTrigger) {
    scorecardEmailTrigger.addEventListener("click", () => {
      analyticsUi.scorecardEmailOpen = !analyticsUi.scorecardEmailOpen;
      renderScorecardEmailModal();
    });
  }

  document.addEventListener("click", async (event) => {
    const resetSessionButton = event.target.closest("[data-session-reset]");
    if (resetSessionButton) {
      event.preventDefault();
      clearSessionToken();
      await ensureSessionToken();
      window.location.reload();
      return;
    }

    const periodToggle = event.target.closest("[data-period-view]");
    if (periodToggle) {
      event.preventDefault();
      setAnalyticsTrendView(periodToggle.dataset.periodView);
      return;
    }

    const exportButton = event.target.closest("[data-export-alerts-csv]");
    if (exportButton) {
      event.preventDefault();
      exportAlertRowsCsv();
      return;
    }

    const importHistoryToggle = event.target.closest("#import-history-toggle");
    if (importHistoryToggle) {
      event.preventDefault();
      analyticsUi.importHistoryOpen = !analyticsUi.importHistoryOpen;
      renderImportHistory();
      return;
    }

    const clearAllButton = event.target.closest("[data-clear-reject-data]");
    if (clearAllButton) {
      event.preventDefault();
      if (!hasPermission("reject:delete-all")) {
        return;
      }
      if (!analyticsUi.clearAllArmed) {
        analyticsUi.clearAllArmed = true;
        renderImportHistory();
        return;
      }

      clearAllButton.disabled = true;
      clearAllButton.textContent = "Clearing...";
      const response = await apiFetch("/api/reject/all", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmToken: "DELETE_ALL_REJECTION_DATA" })
      });
      const payload = await response.json();
      const statusBox = document.getElementById("import-status");
      analyticsUi.clearAllArmed = false;
      if (statusBox) {
        statusBox.textContent = response.ok
          ? "All rejection data cleared."
          : payload.error || "Unable to clear rejection records.";
      }
      await loadApp();
      return;
    }

    const dismissAlertBannerButton = event.target.closest("[data-dismiss-alert-banner]");
    if (dismissAlertBannerButton) {
      event.preventDefault();
      dismissAlertBanner();
      return;
    }

    const deletePlanButton = event.target.closest("[data-delete-plan-id]");
    if (deletePlanButton) {
      event.preventDefault();
      if (!canManagePlans()) {
        return;
      }
      const planId = deletePlanButton.dataset.deletePlanId;
      if (!planId) {
        return;
      }
      deletePlanButton.disabled = true;
      deletePlanButton.textContent = "Deleting...";
      await apiFetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (document.body.dataset.page === "plans") {
        await refreshPlansState();
        showInlineMessage("plans-grid", "Plan removed");
      } else {
        await loadApp();
        showInlineMessage("plans-grid", "Plan removed");
      }
      return;
    }

    const deleteHandoverButton = event.target.closest("[data-handover-id]");
    if (deleteHandoverButton) {
      event.preventDefault();
      if (!hasPermission("handover:delete")) {
        return;
      }
      const noteId = deleteHandoverButton.dataset.handoverId;
      if (!noteId) {
        return;
      }
      deleteHandoverButton.disabled = true;
      deleteHandoverButton.textContent = "...";
      try {
        const response = await apiFetch(`/api/handover/${noteId}`, { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Unable to delete handover note.");
        }
        const card = deleteHandoverButton.closest(".handover-card");
        state.handovers = state.handovers.filter((item) => String(item.id) !== String(noteId));
        if (card) {
          card.style.opacity = "0";
          card.style.transition = "opacity 0.2s";
          window.setTimeout(() => {
            card.remove();
            if (!state.handovers.length) {
              renderHandoverList(document.getElementById("handover-list"));
            }
          }, 200);
        } else if (!state.handovers.length) {
          renderHandoverList(document.getElementById("handover-list"));
        }
      } catch {
        deleteHandoverButton.disabled = false;
        deleteHandoverButton.textContent = "✕";
      }
      return;
    }

    const copyAiButton = event.target.closest("[data-copy-ai-response]");
    if (copyAiButton) {
      event.preventDefault();
      const responseText = copyAiButton.dataset.copyContent || "";
      try {
        await navigator.clipboard.writeText(responseText);
        copyAiButton.textContent = "Copied!";
        window.setTimeout(() => {
          copyAiButton.textContent = "Copy";
        }, 2000);
      } catch {
        copyAiButton.textContent = "Failed";
        window.setTimeout(() => {
          copyAiButton.textContent = "Copy";
        }, 2000);
      }
      return;
    }

    const downloadPdfButton = event.target.closest("[data-download-report-id]");
    if (downloadPdfButton) {
      event.preventDefault();
      const reportId = Number(downloadPdfButton.dataset.downloadReportId);
      const report = state.reports.find((item) => Number(item.id) === reportId);
      if (!report) {
        return;
      }

      downloadPdfButton.disabled = true;
      downloadPdfButton.textContent = "Generating PDF...";
      try {
        await generatePdfReport({
          title: report.title || "Quality Control Report",
          recipients: report.recipients || "",
          summary: report.summary || "",
          period: report.period_label || state.analytics?.latestMonthLabel || ""
        });
      } catch (err) {
        console.error("Report PDF failed:", err);
      } finally {
        downloadPdfButton.disabled = false;
        downloadPdfButton.textContent = "Download PDF";
      }
      return;
    }

    const reportTemplateCard = event.target.closest("[data-report-template-id]");
    if (reportTemplateCard) {
      event.preventDefault();
      await runReportTemplate(reportTemplateCard.dataset.reportTemplateId, reportTemplateCard);
      return;
    }

    const resendReportButton = event.target.closest("[data-report-resend-id]");
    if (resendReportButton) {
      event.preventDefault();
      toggleReportResendPanel(Number(resendReportButton.dataset.reportResendId));
      return;
    }

    const useAsTemplateButton = event.target.closest("[data-report-use-template-id]");
    if (useAsTemplateButton) {
      event.preventDefault();
      await useHistoryReportAsTemplate(Number(useAsTemplateButton.dataset.reportUseTemplateId));
      return;
    }

    const resendConfirmButton = event.target.closest("[data-report-resend-confirm-id]");
    if (resendConfirmButton) {
      event.preventDefault();
      await resendExistingReport(Number(resendConfirmButton.dataset.reportResendConfirmId), resendConfirmButton);
      return;
    }

    const productAiButton = event.target.closest("[data-product-ai-name]");
    if (productAiButton) {
      event.preventDefault();
      const name = productAiButton.dataset.productAiName || "";
      window.location.href = withRoleParam(
        `/copilot?type=anomaly-summary&prompt=${encodeURIComponent(`Focus specifically on ${name}`)}`,
        role
      );
      return;
    }

    const productTaskButton = event.target.closest("[data-product-task-name]");
    if (productTaskButton) {
      event.preventDefault();
      const name = productTaskButton.dataset.productTaskName || "";
      window.location.href = withRoleParam(`/operations?prefill=${encodeURIComponent(name)}`, role);
      return;
    }

    const alertProductRow = event.target.closest("tr[data-item-code]");
    if (alertProductRow) {
      event.preventDefault();
      await toggleProductDetailPanel(
        alertProductRow,
        alertProductRow.dataset.itemCode || ""
      );
      return;
    }

    const sendReportAction = event.target.closest('[data-action="send-report"]');
    const sendReportTextButton = event.target.closest("button, a");
    if (
      sendReportAction ||
      (sendReportTextButton && /^(📤\s*)?send report$/i.test((sendReportTextButton.textContent || "").trim()))
    ) {
      event.preventDefault();
      window.location.href = withRoleParam("/reports?template=weekly-flash");
      return;
    }

    const recipeButton = event.target.closest("[data-ai-type]");
    if (!recipeButton) {
      return;
    }

    event.preventDefault();
    const type = recipeButton.dataset.aiType;
    const allowedTypes = getAllowedCopilotTypes(role);
    if (allowedTypes && !allowedTypes.includes(type)) {
      return;
    }
    const prompt = recipeButton.dataset.aiPrompt || "";
    const aiResponseBox = document.getElementById("ai-response");
    if (!aiResponseBox) {
      window.location.href = withRoleParam(
        `/copilot?type=${encodeURIComponent(type)}&prompt=${encodeURIComponent(prompt)}`,
        role
      );
      return;
    }

    const typeSelect = document.querySelector('#ai-form select[name="type"]');
    const promptBox = document.querySelector('#ai-form textarea[name="prompt"]');
    if (typeSelect) {
      typeSelect.value = type;
    }
    if (promptBox) {
      promptBox.value = prompt;
    }
    await runAi({ type, prompt });
  });
}

async function runAi(payload) {
  const box = document.getElementById("ai-response");
  if (!box) {
    return;
  }

  renderAiLoading(box);
  try {
    const response = await apiFetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    renderAiResponse(box, data.content || "");
  } catch {
    renderAiPlainText(
      box,
      "Unable to reach the AI service right now. Check the server configuration or Gemini credentials."
    );
  }
}

function renderCommon() {
  renderNav();
  if (document.body.dataset.page === "executive") {
    hideAlertBanner();
  } else {
    renderAlertBanner();
  }
  renderStatus();
  renderHeadline();
  renderTopbarPeriod();
  renderMorningBriefSidebar();
  applyRoleFilter(getCurrentRole());
  renderSidebarTasks();
  if (document.body.dataset.page !== "executive") {
    renderAlertBanner();
  }
  renderRoleSwitcher();
  initGlobalSearch();
}

function renderCommonLoading() {
  renderNav();
  applyRoleFilter(getCurrentRole());
  hideAlertBanner();
  const status = document.getElementById("ai-status");
  if (status) {
    status.textContent = "Loading AI...";
  }
  const headline = document.getElementById("human-headline");
  if (headline) {
    headline.textContent = "Pulling the latest quality signals, ownership context, and handover story.";
  }
  const chip = document.getElementById("topbar-period");
  if (chip) {
    chip.textContent = "Loading period...";
  }

  const morningBrief = document.getElementById("morning-brief-sidebar");
  if (morningBrief) {
    morningBrief.innerHTML = buildSkeletonStack(2);
  }
}

function getAlertBannerDismissKey() {
  const monthLabel = state.analytics?.latestMonthLabel || "unknown-period";
  return `aimais_alert_dismissed_${monthLabel}`;
}

function getAlertBannerElement() {
  let banner = document.getElementById("alert-banner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "alert-banner";
    document.body.prepend(banner);
  }
  return banner;
}

function hideAlertBanner() {
  const banner = document.getElementById("alert-banner");
  if (banner) {
    banner.remove();
  }
}

function dismissAlertBanner() {
  try {
    sessionStorage.setItem(getAlertBannerDismissKey(), "1");
  } catch {
    // Ignore session storage failures and still hide the banner.
  }
  hideAlertBanner();
}

function renderAlertBanner() {
  const existing = document.getElementById("alert-banner");
  if (existing) existing.remove();

  const alerts = state.analytics.productAlerts.filter((alert) => alert.latestRate >= 5);
  if (!alerts.length) return;

  const monthKey = state.analytics.latestMonthLabel || "current";
  const storageKey = `aimais_alert_dismissed_${monthKey}`;
  if (sessionStorage.getItem(storageKey)) return;

  const top = alerts[0];
  const banner = document.createElement("div");
  banner.id = "alert-banner";
  banner.innerHTML = `
    <span>⚠</span>
    <span class="alert-msg">
      <span class="alert-high">${alerts.length} item${alerts.length > 1 ? "s" : ""}
      above threshold</span> —
      Highest: <strong>${top.productName}</strong>
      at <span class="alert-high mono">${top.latestRate}%</span>
    </span>
    <a class="alert-link" href="/analytics">View Alerts →</a>
    <button class="alert-close" title="Dismiss">✕</button>
  `;

  banner.querySelector(".alert-close").addEventListener("click", () => {
    sessionStorage.setItem(storageKey, "1");
    banner.remove();
  });

  document.body.prepend(banner);
}

function renderNav() {
  const page = document.body.dataset.page;
  const nav = document.querySelector(".nav");
  const settingsLink = nav?.querySelector('[data-nav="settings"]');
  if (hasPermission("roles:assign")) {
    if (!settingsLink && nav) {
      const link = document.createElement("a");
      link.href = "/settings";
      link.dataset.nav = "settings";
      link.className = "role-management-link";
      link.textContent = "Settings";
      nav.append(link);
    }
  } else {
    settingsLink?.remove();
  }
  renderRoleSwitcher();
  syncRoleAwareLinks();
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.classList.toggle("active", link.dataset.nav === page);
  });
}

function renderStatus() {
  const status = document.getElementById("ai-status");
  if (!status) {
    return;
  }
  status.textContent = state.config.aiEnabled
    ? `AI — ${state.config.aiModel}`
    : "Fallback mode — add GEMINI_API_KEY on Render";
}

function renderHeadline() {
  const headline = document.getElementById("human-headline");
  if (headline) {
    headline.textContent = state.human.humanHeadline;
  }
}

function renderTopbarPeriod() {
  const chip = document.getElementById("topbar-period");
  if (chip) {
    chip.textContent = state.analytics.latestMonthLabel;
  }
}

function renderMorningBriefSidebar() {
  const box = document.getElementById("morning-brief-sidebar");
  if (!box) {
    return;
  }

  if (!state.analytics?.lastUpdated || !state.human?.morningBrief) {
    box.innerHTML = `<div class="empty-state">Import data to activate situation briefs.</div>`;
    return;
  }

  box.innerHTML = `
    <article class="mini-card accent">
      <strong>${state.human.morningBrief.title}</strong>
      <p>${state.human.morningBrief.summary}</p>
      <span>${state.human.morningBrief.owner} • ${state.human.morningBrief.due}</span>
    </article>
  `;
}

function initGlobalSearch() {
  const input = document.getElementById("global-search");
  const dropdown = document.getElementById("search-results");
  if (!input || !dropdown || input.dataset.bound === "true") return;

  input.dataset.bound = "true";
  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 2) {
        dropdown.classList.add("hidden");
        dropdown.innerHTML = "";
        return;
      }
      renderSearchResults(dropdown, runLocalSearch(q));
    }, 200);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      dropdown.classList.add("hidden");
      input.blur();
    }
  });

  document.addEventListener("click", (event) => {
    if (!input.contains(event.target) && !dropdown.contains(event.target)) {
      dropdown.classList.add("hidden");
    }
  });
}

function runLocalSearch(q) {
  const results = [];

  (state.analytics?.productAlerts || []).forEach((item) => {
    if (item.productName.toLowerCase().includes(q) || String(item.code || "").toLowerCase().includes(q)) {
      results.push({
        type: "Product Alert",
        label: item.productName,
        meta: `${item.latestRate}% reject rate`,
        href: "/analytics"
      });
    }
  });

  (state.analytics?.topProductsByLoss || []).forEach((item) => {
    if (
      (item.productName || "").toLowerCase().includes(q) &&
      !results.find((result) => result.label === item.productName)
    ) {
      results.push({
        type: "Top Loss Product",
        label: item.productName,
        meta: `${numberFormatter.format(item.rejectQty)} rejected — ${item.totalRate}%`,
        href: "/analytics"
      });
    }
  });

  (state.itemsByPct || []).forEach((item) => {
    if (String(item.code || "").toLowerCase().includes(q)) {
      results.push({
        type: "High Reject Item",
        label: item.code,
        meta: `avg ${item.avg_pct}% — ${numberFormatter.format(item.total_rejected)} rejected`,
        href: "/analytics"
      });
    }
  });

  (state.tasks || []).forEach((task) => {
    if (task.title.toLowerCase().includes(q)) {
      results.push({
        type: "Task",
        label: task.title,
        meta: `${task.owner_name} — ${mapStatus(task.status)}`,
        href: "/operations"
      });
    }
  });

  (state.plans || []).forEach((plan) => {
    if (plan.title.toLowerCase().includes(q) || (plan.objective || "").toLowerCase().includes(q)) {
      results.push({
        type: "Plan",
        label: plan.title,
        meta: `${plan.owner_name} — ${plan.status}`,
        href: "/plans"
      });
    }
  });

  return results.slice(0, 8);
}

function renderSearchResults(dropdown, results) {
  if (!results.length) {
    dropdown.innerHTML = `
      <div class="search-result-item">
        <div class="search-result-type">No match</div>
        <strong>No match — try an item code, period, or task name.</strong>
      </div>
    `;
    dropdown.classList.remove("hidden");
    return;
  }

  dropdown.innerHTML = results.map((result, index) => `
    <div class="search-result-item" data-search-index="${index}">
      <div class="search-result-type">${result.type}</div>
      <strong>${result.label}</strong>
      ${result.meta
        ? `<div style="font-size:0.76rem;color:var(--muted)">${result.meta}</div>`
        : ""}
    </div>
  `).join("");

  dropdown.querySelectorAll(".search-result-item").forEach((element, index) => {
    element.addEventListener("click", () => {
      window.location.href = withRoleParam(results[index].href);
      dropdown.classList.add("hidden");
    });
  });

  dropdown.classList.remove("hidden");
}

function staggerAnimate(selector) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.remove("animate-in");
    void el.offsetWidth;
    el.style.animationDelay = `${i * 0.055}s`;
    el.classList.add("animate-in");
  });
}

function renderPage(options = {}) {
  const { isLoading = false } = options;
  const page = document.body.dataset.page;
  if (isLoading) {
    renderLoadingState(page);
    return;
  }
  applyRoleFilter(getCurrentRole());
  clearLoadingDecorators();
  if (page === "dashboard") {
    renderDashboardPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "analytics") {
    renderAnalyticsPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "operations") {
    renderOperationsPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "plans") {
    renderPlansPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "copilot") {
    renderCopilotPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "reports") {
    renderReportsPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "scorecard") {
    renderScorecardPage();
    staggerAnimate(".panel");
    staggerAnimate(".metric-card");
    staggerAnimate(".item-card");
    applyRoleUi();
    return;
  }
  if (page === "settings") {
    renderSettingsPage();
    staggerAnimate(".panel");
    applyRoleUi();
    return;
  }
  if (page === "executive") {
    renderExecutivePage();
    applyRoleUi();
    return;
  }
}

function applyRoleUi() {
  const role = getCurrentRole();
  document.body.dataset.role = role;
  document.querySelectorAll(".permission-denied").forEach((el) => {
    el.classList.remove("permission-denied");
    el.disabled = false;
    el.title = "";
  });
}

function formatDateTimeLabel(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function renderSettingsPage() {
  const sessionBox = document.getElementById("settings-session");
  const managementBox = document.getElementById("settings-user-management");
  const auditBox = document.getElementById("settings-audit");
  if (!sessionBox || !managementBox || !auditBox) {
    return;
  }

  const token = getSessionToken();
  sessionBox.innerHTML = `
    <div class="session-info-card">
      <div>
        <p class="eyebrow">CURRENT SESSION</p>
        <h2>${escapeHtml(state.session.actor || "Guest")}</h2>
        <p class="section-subtitle">Role: <span class="role-badge ${getCurrentRole()}">${getCurrentRole()}</span></p>
        <p class="section-subtitle">Last seen: ${escapeHtml(formatDateTimeLabel(state.session.lastSeen))}</p>
      </div>
    </div>
    <div class="stack-list">
      <button type="button" class="ghost-btn" id="settings-change-name">Change my name</button>
      <div class="token-display" id="settings-current-token" title="Click to copy token">${escapeHtml(token || "No token stored")}</div>
      <p class="section-subtitle">Share tokens securely with your team. This device currently uses the token above.</p>
    </div>
  `;

  document.getElementById("settings-change-name")?.addEventListener("click", async () => {
    const nextActor = window.prompt("Enter the display name for this token.", state.session.actor || "");
    if (!nextActor?.trim()) {
      return;
    }

    const response = await apiFetch("/api/session", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actor: nextActor.trim() })
    });
    if (response.ok) {
      await loadSession();
      renderCommon();
      renderSettingsPage();
    }
  });

  document.getElementById("settings-current-token")?.addEventListener("click", async () => {
    const currentToken = getSessionToken();
    if (!currentToken) {
      return;
    }
    await navigator.clipboard.writeText(currentToken);
  });

  if (!hasPermission("roles:assign")) {
    managementBox.innerHTML = `
      <div class="empty-state">Settings access is restricted to administrators.</div>
    `;
  } else {
    managementBox.innerHTML = `
      <div class="table-wrap">
        <table class="scorecard-kpi-table">
          <thead>
            <tr>
              <th>Actor</th>
              <th>Role</th>
              <th>Last Seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.adminSessions.map((row) => `
              <tr>
                <td>${escapeHtml(row.actor)}</td>
                <td>
                  <select data-session-role-id="${row.id}">
                    ${VALID_ROLES.map((role) => `
                      <option value="${role}" ${row.role === role ? "selected" : ""}>${role}</option>
                    `).join("")}
                  </select>
                </td>
                <td>${escapeHtml(formatDateTimeLabel(row.last_seen))}</td>
                <td>
                  <button type="button" class="ghost-btn" data-session-save-id="${row.id}">Save</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <div class="panel" style="margin-top:16px;padding:20px;">
        <div class="section-heading compact">
          <div>
            <p class="eyebrow">ADD USER</p>
            <h2>Generate a new token</h2>
          </div>
        </div>
        <form id="settings-add-user-form" class="stack-form">
          <div class="inline-grid">
            <input type="text" name="actor" placeholder="Name" required />
            <select name="role">
              ${VALID_ROLES.map((role) => `<option value="${role}">${role}</option>`).join("")}
            </select>
          </div>
          <button type="submit">Generate token</button>
        </form>
        <div id="settings-generated-token">
          ${state.generatedSessionToken
            ? `
              <p class="section-subtitle">Share this token with ${escapeHtml(state.generatedSessionToken.actor)}:</p>
              <div class="token-display" id="settings-new-token">${escapeHtml(state.generatedSessionToken.token)}</div>
              <p class="section-subtitle">This token will not be shown again.</p>
            `
            : ""}
        </div>
      </div>
    `;

    document.querySelectorAll("[data-session-save-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const sessionId = button.dataset.sessionSaveId;
        const select = document.querySelector(`[data-session-role-id="${sessionId}"]`);
        if (!sessionId || !select) {
          return;
        }
        button.disabled = true;
        button.textContent = "Saving...";
        const response = await apiFetch(`/api/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: select.value })
        });
        if (response.ok) {
          await loadSettingsData();
          renderSettingsPage();
          return;
        }
        button.disabled = false;
        button.textContent = "Save";
      });
    });

    document.getElementById("settings-add-user-form")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const actor = String(formData.get("actor") || "").trim();
      const role = String(formData.get("role") || "viewer");
      if (!actor) {
        return;
      }

      const response = await apiFetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor, role })
      });
      const payload = await response.json();
      if (!response.ok) {
        return;
      }

      state.generatedSessionToken = { actor, token: payload.token };
      await loadSettingsData();
      renderSettingsPage();
    });

    document.getElementById("settings-new-token")?.addEventListener("click", async () => {
      if (state.generatedSessionToken?.token) {
        await navigator.clipboard.writeText(state.generatedSessionToken.token);
      }
    });
  }

  if (!hasPermission("audit:view")) {
    auditBox.innerHTML = `<div class="empty-state">Your role cannot view the audit trail.</div>`;
    return;
  }

  auditBox.innerHTML = state.auditTrail.length
    ? `
      <div class="table-wrap">
        <table class="scorecard-kpi-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            ${state.auditTrail.map((row) => `
              <tr>
                <td>${escapeHtml(formatDateTimeLabel(row.created_at))}</td>
                <td>${escapeHtml(row.actor || "Unknown")}</td>
                <td>${escapeHtml(row.action || "UNKNOWN")}</td>
                <td>${escapeHtml(row.entity || "unknown")}</td>
                <td>${escapeHtml(row.field ? `${row.field}: ${row.new_value || "updated"}` : row.new_value || row.entity_id || "updated")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `
    : `<div class="empty-state">No audit events recorded yet.</div>`;
}

function renderExecutivePage() {
  renderExecutiveHeader();
  renderExecutiveHero();
  renderExecutiveStatusStrip();
  renderExecutiveTrend();
  renderExecutiveAlerts();
  renderExecutiveTable();
  renderExecutiveFooter();
  staggerAnimate(".exec-section");
}

function renderExecutiveHeader() {
  const header = document.getElementById("exec-header");
  if (!header) return;
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
  const dateEl = header.querySelector(".exec-date");
  if (dateEl) {
    dateEl.textContent = now;
  }
}

function renderExecutiveHero() {
  const section = document.getElementById("exec-hero");
  if (!section) return;

  const narrative = state.analytics?.narrative
    || "Import rejection data to generate the plant summary.";
  const rate = Number(state.analytics?.overview?.latestRejectRate ?? 0);
  const period = state.analytics?.latestMonthLabel || "—";

  const rateColor = rate > 5
    ? "var(--danger)"
    : rate > 2
      ? "var(--warning)"
      : "var(--accent)";

  section.innerHTML = `
    <p class="exec-narrative">${escapeHtml(narrative)}</p>
    <div class="exec-rate-display">
      <span class="exec-big-rate mono"
            style="color:${rateColor}">${formatPctValue(rate)}%</span>
      <span class="exec-rate-label">
        Overall Reject Rate — ${escapeHtml(period)}
      </span>
    </div>
  `;

  const rateEl = section.querySelector(".exec-big-rate");
  if (rateEl) {
    animateNumber(rateEl, 0, rate, 1000);
  }
}

function renderExecutiveStatusStrip() {
  const strip = document.getElementById("exec-status-strip");
  if (!strip) return;
  const ov = state.analytics?.overview || {};

  const cards = [
    {
      value: numberFormatter.format(Math.round(Number(ov.totalProducedQty || 0))),
      label: "Units Produced",
      color: "var(--text)"
    },
    {
      value: numberFormatter.format(Math.round(Number(ov.totalRejectQty || 0))),
      label: "Units Rejected",
      color: "var(--danger)"
    },
    {
      value: String(ov.productsAboveThreshold || 0),
      label: "Items Above Threshold",
      color: ov.productsAboveThreshold > 0 ? "var(--danger)" : "var(--accent)"
    },
    {
      value: state.analytics?.latestMonthLabel || "—",
      label: "Reporting Period",
      color: "var(--text)"
    }
  ];

  strip.innerHTML = cards.map((card) => `
    <div class="exec-stat-card">
      <span class="exec-stat-value mono"
            style="color:${card.color}">
        ${escapeHtml(card.value)}
      </span>
      <span class="exec-stat-label">${escapeHtml(card.label)}</span>
    </div>
  `).join("");
}

function renderExecutiveTrend() {
  const container = document.getElementById("exec-trend-chart");
  if (!container) return;
  container.innerHTML = buildLineChart(state.analytics?.monthlyTrend || []);
}

function renderExecutiveAlerts() {
  const section = document.getElementById("exec-alerts");
  if (!section) return;

  const alerts = (state.analytics?.productAlerts || [])
    .filter((item) => Number(item.latestRate || 0) >= 5)
    .slice(0, 5);
  const heading = section.querySelector("h2");
  const list = section.querySelector(".exec-alerts-list");
  if (!list) return;

  if (!alerts.length) {
    if (heading) {
      heading.textContent = "No items above threshold";
    }
    list.innerHTML = `
      <div class="exec-clear-card">
        <span style="color:var(--accent);font-size:1.2rem">✓</span>
        <div>
          <strong>No items above 5% this period.</strong>
          <p>Current rate: ${formatPctValue(state.analytics?.overview?.latestRejectRate ?? 0)}%</p>
        </div>
      </div>
    `;
    return;
  }

  if (heading) {
    heading.textContent = `${alerts.length} item${alerts.length > 1 ? "s" : ""} above 5% reject rate`;
  }

  const borderColor = (item) => (
    item.latestRate >= 15 ? "var(--danger)"
      : item.latestRate >= 10 ? "var(--warning)"
        : "var(--sky)"
  );
  const statusText = (item) => (
    item.latestRate >= 15 ? "CRITICAL"
      : item.latestRate >= 10 ? "HIGH"
        : "ELEVATED"
  );
  const statusClass = (item) => (
    item.latestRate >= 15 ? "badge badge-critical"
      : item.latestRate >= 10 ? "badge badge-high"
        : "badge badge-elevated"
  );

  list.innerHTML = alerts.map((item) => `
    <div class="exec-alert-card"
         style="border-left-color:${borderColor(item)}">
      <div class="exec-alert-top">
        <span class="exec-alert-code mono">${escapeHtml(item.code || item.productName || "Unknown")}</span>
        <span class="${statusClass(item)}">${statusText(item)}</span>
      </div>
      <div class="exec-alert-rate">
        <span class="mono exec-alert-rate-value"
              style="color:${borderColor(item)}">
          ${formatPctValue(item.latestRate)}%
        </span>
        <span class="exec-alert-delta">
          ${Number(item.delta || 0) >= 0 ? "+" : ""}${formatPctValue(item.delta || 0)}% vs baseline
        </span>
      </div>
      <div class="pct-bar" style="margin-top:8px">
        <div class="pct-fill" style="width:${Math.min(Number(item.latestRate || 0), 100)}%;background:${borderColor(item)}"></div>
      </div>
    </div>
  `).join("");
}

function renderExecutiveTable() {
  const tbody = document.getElementById("exec-trend-tbody");
  if (!tbody) return;

  const months = state.analytics?.monthlyTrend || [];
  tbody.innerHTML = months.map((month, index) => {
    const previous = months[index - 1];
    const rejectRate = Number(month.rejectRate || 0);
    const delta = previous ? rejectRate - Number(previous.rejectRate || 0) : null;
    const deltaStr = delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`;
    const deltaColor = delta === null ? "var(--muted)" : delta > 0 ? "var(--danger)" : "var(--accent)";
    const statusClass = rejectRate < 2
      ? "badge badge-normal"
      : rejectRate < 5
        ? "badge badge-high"
        : "badge badge-critical";
    const statusText = rejectRate < 2
      ? "ON TARGET"
      : rejectRate < 5
        ? "WATCH"
        : "ABOVE LIMIT";

    return `
      <tr>
        <td style="font-weight:500">${escapeHtml(month.label || "—")}</td>
        <td class="mono" style="font-weight:600">${formatPctValue(rejectRate)}%</td>
        <td class="mono" style="color:${deltaColor}">${deltaStr}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
      </tr>
    `;
  }).join("");
}

function renderExecutiveFooter() {
  const footer = document.getElementById("exec-footer-time");
  if (!footer) return;
  footer.textContent = new Date().toLocaleString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderSidebarTasks() {
  const box = document.getElementById("sidebar-tasks-preview");
  if (!box) return;
  const active = state.tasks.filter((task) => task.status !== "done").slice(0, 3);
  if (!active.length) {
    box.innerHTML = `<div class="empty-state">No active tasks.</div>`;
    return;
  }
  box.innerHTML = active.map((task) => `
    <article class="mini-card">
      <div class="card-topline">
        <strong>${task.title}</strong>
        <span class="mono">${task.progress_percent || 0}%</span>
      </div>
      <p>${task.owner_name || "Unassigned"} • ${mapStatus(task.status)}</p>
      <div class="progress-track compact">
        <span class="progress-fill"
          style="width:${task.progress_percent || 0}%"></span>
      </div>
    </article>
  `).join("");
}

function renderSkeletons() {
  const targets = [
    "hero-summary", "overview-cards", "team-pulse", "next-moves",
    "tasks-preview", "handover-preview", "reports-preview",
    "monthly-chart", "period-insights",
    "tasks-list", "handover-list", "reports-list",
    "ai-recipes", "loss-list", "alerts-table", "sidebar-tasks-preview"
  ];
  targets.forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.innerHTML = `
      <div class="skeleton card" style="margin-bottom:8px;"></div>
      <div class="skeleton" style="margin-bottom:6px;"></div>
      <div class="skeleton short"></div>
    `;
  });
}

function renderLoadingState(page) {
  if (page === "dashboard") {
    setLoadingMarkup("hero-summary", buildSkeletonHero());
    setLoadingMarkup("overview-cards", buildMetricSkeleton(4));
    setLoadingMarkup("team-pulse", buildSkeletonStack(3));
    setLoadingMarkup("next-moves", buildSkeletonStack(3));
    setLoadingMarkup("tasks-preview", buildSkeletonStack(3));
    setLoadingMarkup("handover-preview", buildSkeletonStack(3));
    setLoadingMarkup("monthly-chart", buildSkeletonChartSurface());
    setLoadingMarkup("reports-preview", buildSkeletonStack(3));
    return;
  }

  if (page === "analytics") {
    setLoadingMarkup("bundled-source", buildSkeletonCard());
    setLoadingMarkup("analytics-ai-tools", buildSkeletonButtonGrid(6));
    setLoadingMarkup("recent-window-summary", buildMetricSkeleton(4));
    setLoadingMarkup("recent-window-table", buildSkeletonTable());
    setLoadingMarkup("month-strip", buildSkeletonChips(6));
    setLoadingMarkup("period-insights", buildMetricSkeleton(4));
    setLoadingMarkup("monthly-chart", buildSkeletonChartSurface());
    setLoadingMarkup("weekly-chart", buildSkeletonChartSurface());
    setChartLoading("top-products-chart");
    setChartLoading("pareto-chart");
    setLoadingMarkup("week-strip", buildSkeletonStack(4));
    setLoadingMarkup("items-by-pct-table", buildSkeletonTable());
    setLoadingMarkup("alerts-table", buildSkeletonTable());
    setLoadingMarkup("loss-list", buildSkeletonStack(4));
    setLoadingMarkup("pareto-callout", `<span class="muted">Loading Pareto cutoff...</span>`);
    return;
  }

  if (page === "operations") {
    setLoadingMarkup("next-moves", buildSkeletonStack(3));
    setLoadingMarkup("tasks-list", buildSkeletonTaskCards(3));
    setLoadingMarkup("handover-list", buildSkeletonStack(3));
    return;
  }

  if (page === "plans") {
    setLoadingMarkup("plans-sidebar", buildSkeletonStack(3));
    setLoadingMarkup("plans-grid", buildSkeletonPlanCards(3));
    return;
  }

  if (page === "copilot") {
    setLoadingMarkup("copilot-guidance", buildSkeletonStack(4));
    setLoadingMarkup("ai-recipes", buildSkeletonStack(4));
    setLoadingMarkup("ai-response", buildSkeletonCard("skeleton-card skeleton-card-tall"));
    return;
  }

  if (page === "reports") {
    setLoadingMarkup("report-guidance", buildSkeletonStack(3));
    setLoadingMarkup("report-callouts", buildSkeletonStack(2));
    setLoadingMarkup("reports-list", buildSkeletonStack(3));
    return;
  }

  if (page === "scorecard") {
    setLoadingMarkup("scorecard-guidance", buildSkeletonStack(3));
    setLoadingMarkup("scorecard-health-panel", buildSkeletonCard("skeleton-card hero-skeleton"));
    setLoadingMarkup("scorecard-top-items", buildSkeletonSummaryGrid(4));
    setLoadingMarkup("scorecard-kpi-table", buildSkeletonTable());
    setLoadingMarkup("scorecard-critical-products", buildSkeletonStack(2));
    setLoadingMarkup("scorecard-active-plans", buildSkeletonStack(3));
    return;
  }

  if (page === "executive") {
    setLoadingMarkup("exec-hero", buildSkeletonCard("skeleton-card skeleton-card-tall"));
    setLoadingMarkup("exec-status-strip", buildMetricSkeleton(4));
    setLoadingMarkup("exec-trend-chart", buildSkeletonChartSurface());
    setLoadingMarkup("exec-trend-tbody", `
      <tr><td colspan="4">${buildSkeletonStack(3)}</td></tr>
    `);
    const alertsList = document.querySelector("#exec-alerts .exec-alerts-list");
    if (alertsList) {
      alertsList.innerHTML = buildSkeletonStack(2);
    }
  }
}

function setLoadingMarkup(id, markup) {
  const container = document.getElementById(id);
  if (container) {
    container.innerHTML = markup;
  }
}

function setChartLoading(canvasId) {
  const canvas = document.getElementById(canvasId);
  const wrap = canvas?.closest(".chart-canvas-wrap");
  if (wrap) {
    wrap.classList.add("is-loading");
  }
}

function clearLoadingDecorators() {
  document.querySelectorAll(".chart-canvas-wrap.is-loading").forEach((wrap) => {
    wrap.classList.remove("is-loading");
  });
}

function initChartDefaults() {
  if (!window.Chart) return;
  window.Chart.defaults.font.family = "'Geist', sans-serif";
  window.Chart.defaults.font.size = 11;
  window.Chart.defaults.color = "rgba(110,128,152,0.9)";
  window.Chart.defaults.plugins.tooltip.cornerRadius = 8;
  window.Chart.defaults.plugins.tooltip.padding = 10;
  window.Chart.defaults.plugins.tooltip.displayColors = false;
  window.Chart.defaults.plugins.tooltip.backgroundColor = "rgba(5,11,17,0.94)";
  window.Chart.defaults.plugins.tooltip.borderColor = "rgba(255,255,255,0.09)";
  window.Chart.defaults.plugins.tooltip.borderWidth = 1;
  window.Chart.defaults.plugins.tooltip.titleFont = {
    family: "'Geist', sans-serif",
    size: 12,
    weight: "600"
  };
  window.Chart.defaults.plugins.tooltip.bodyFont = {
    family: "'Geist Mono', monospace",
    size: 11
  };
}

function buildSkeletonHero() {
  return `
    <article class="skeleton-card hero-skeleton">
      <span class="skeleton-line w-18"></span>
      <span class="skeleton-line w-72 lg"></span>
      <span class="skeleton-line w-64"></span>
      <div class="skeleton-action-row">
        <span class="skeleton-chip"></span>
        <span class="skeleton-chip"></span>
        <span class="skeleton-chip"></span>
      </div>
    </article>
  `;
}

function buildMetricSkeleton(count) {
  return Array.from({ length: count }, () => `
    <article class="metric-card skeleton-card">
      <span class="skeleton-line w-30"></span>
      <span class="skeleton-line w-44 xl"></span>
      <span class="skeleton-line w-56"></span>
    </article>
  `).join("");
}

function buildSkeletonStack(count) {
  return Array.from({ length: count }, () => buildSkeletonCard()).join("");
}

function buildSkeletonCard(cardClass = "skeleton-card") {
  return `
    <article class="${cardClass}">
      <span class="skeleton-line w-36"></span>
      <span class="skeleton-line w-88"></span>
      <span class="skeleton-line w-62"></span>
    </article>
  `;
}

function buildSkeletonButtonGrid(count) {
  return Array.from({ length: count }, () => `
    <article class="tool-card skeleton-card">
      <span class="skeleton-line w-42"></span>
      <span class="skeleton-line w-90"></span>
      <span class="skeleton-line w-72"></span>
    </article>
  `).join("");
}

function buildSkeletonChips(count) {
  return Array.from({ length: count }, () => `
    <article class="month-chip skeleton-card chip-skeleton">
      <span class="skeleton-line w-30"></span>
      <span class="skeleton-line w-22"></span>
      <span class="skeleton-line w-40"></span>
    </article>
  `).join("");
}

function buildSkeletonSummaryGrid(count) {
  return Array.from({ length: count }, () => `
    <article class="item-card skeleton-card">
      <span class="skeleton-line w-18"></span>
      <span class="skeleton-line w-48"></span>
      <span class="skeleton-line w-24 xl"></span>
      <span class="skeleton-line w-40"></span>
    </article>
  `).join("");
}

function buildSkeletonChartSurface() {
  return `
    <div class="chart-shell skeleton-card chart-skeleton">
      <span class="skeleton-line w-18"></span>
      <div class="skeleton-chart-bars">
        <span class="skeleton-bar h-48"></span>
        <span class="skeleton-bar h-72"></span>
        <span class="skeleton-bar h-56"></span>
        <span class="skeleton-bar h-88"></span>
        <span class="skeleton-bar h-62"></span>
        <span class="skeleton-bar h-76"></span>
      </div>
    </div>
  `;
}

function buildSkeletonTable() {
  return `
    <div class="skeleton-card">
      <span class="skeleton-line w-28"></span>
      <div class="skeleton-table">
        ${Array.from({ length: 6 }, () => `
          <div class="skeleton-table-row">
            <span class="skeleton-line w-24"></span>
            <span class="skeleton-line w-18"></span>
            <span class="skeleton-line w-20"></span>
            <span class="skeleton-line w-14"></span>
            <span class="skeleton-line w-34"></span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function buildSkeletonTaskCards(count) {
  return Array.from({ length: count }, () => `
    <article class="task-card skeleton-card">
      <span class="skeleton-line w-52"></span>
      <span class="skeleton-line w-34"></span>
      <span class="skeleton-line w-100"></span>
      <span class="skeleton-line w-88"></span>
      <span class="skeleton-line w-62"></span>
    </article>
  `).join("");
}

function buildSkeletonPlanCards(count) {
  return Array.from({ length: count }, () => `
    <article class="plan-card skeleton-card">
      <span class="skeleton-line w-24"></span>
      <span class="skeleton-line w-60"></span>
      <span class="skeleton-line w-92"></span>
      <span class="skeleton-line w-76"></span>
      <span class="skeleton-line w-44"></span>
      <span class="skeleton-line w-100"></span>
    </article>
  `).join("");
}

async function refreshPlansState() {
  const response = await apiFetch("/api/plans");
  const plans = await response.json();
  state.plans = Array.isArray(plans) ? plans : [];
  renderPlansPage();
}

function renderDashboardPage() {
  renderHeroSummary();
  renderOverviewCards();
  renderTeamPulse(document.getElementById("team-pulse"), state.human.teamPulse);
  renderNextMoves(document.getElementById("next-moves"), state.human.nextThreeMoves);
  renderTaskPreview(document.getElementById("tasks-preview"), state.tasks.slice(0, 3));
  renderHandoverPreview(document.getElementById("handover-preview"), state.handovers.slice(0, 3));
  renderMonthlyChart(document.getElementById("monthly-chart"));
  renderReportsPreview(document.getElementById("reports-preview"), state.reports.slice(0, 3));

  const briefingKey = `aimais_daily_brief_${new Date().toISOString().slice(0, 10)}`;
  if (!sessionStorage.getItem(briefingKey) && state.config.aiEnabled) {
    sessionStorage.setItem(briefingKey, "shown");
    renderMorningBriefPrompt();
  }
}

function renderAnalyticsPage() {
  renderImportPanelMeta();
  renderImportHistory();
  renderAnalyticsTools();
  renderRecent15DayWindow();
  renderMonthStrip();
  renderPeriodInsights();
  renderMonthlyChart(document.getElementById("monthly-chart"));
  renderWeeklyChart(document.getElementById("weekly-chart"));
  renderTopProductsChart();
  renderParetoChart(document.getElementById("pareto-chart")).catch((err) => {
    const callout = document.getElementById("pareto-callout");
    if (callout) {
      callout.textContent = "Pareto chart could not load. Check the server connection and try refreshing.";
    }
    console.error("Pareto chart failed:", err);
  });
  renderItemsByPct(document.getElementById("items-by-pct-table"));
  setAnalyticsTrendView(analyticsUi.trendView);
  renderWeekStrip();
  renderAlerts(document.getElementById("alerts-table"));
  renderLossList(document.getElementById("loss-list"));
}

function formatSignedDelta(value) {
  const numeric = Number(value || 0);
  const sign = numeric > 0 ? "+" : numeric < 0 ? "−" : "";
  return `${sign}${Math.abs(numeric).toFixed(2)}%`;
}

function getDeltaTone(value) {
  const numeric = Number(value || 0);
  if (numeric > 0) {
    return "is-danger";
  }
  if (numeric < 0) {
    return "is-accent";
  }
  return "is-muted";
}

function renderRecent15DayWindow() {
  const meta = document.getElementById("recent-window-meta");
  const summary = document.getElementById("recent-window-summary");
  const table = document.getElementById("recent-window-table");
  const windowData = state.analytics?.recent15DayWindow || null;

  if (!meta || !summary || !table) {
    return;
  }

  if (!windowData?.rows?.length) {
    meta.textContent = "No 15-day window available";
    summary.innerHTML = `<div class="empty-state">Import a workbook with dated rejection rows to unlock this section.</div>`;
    table.innerHTML = "";
    return;
  }

  const highRejectRows = windowData.rows.filter((row) => Number(row.rejectPct || 0) >= 5);
  const isHighRejectOnly = analyticsUi.recentWindowFilter === "high-reject";
  const visibleRows = isHighRejectOnly ? highRejectRows : windowData.rows;
  meta.textContent = `${windowData.windowStartLabel} → ${windowData.latestDateLabel}${isHighRejectOnly ? " • High Reject only" : ""}`;

  const spotlight = windowData.largestDeviation;
  const summaryCards = [
    {
      label: "Window reject rate",
      value: `${formatPctValue(windowData.overallRejectRate)}%`,
      caption: `${numberFormatter.format(Math.round(windowData.totalRejectedQty || 0))} rejected from ${numberFormatter.format(Math.round(windowData.totalProducedQty || 0))} produced.`
    },
    {
      label: "High Reject",
      value: numberFormatter.format(highRejectRows.length),
      caption: isHighRejectOnly
        ? "Showing only rows with Reject % at 5% or higher."
        : "Click the count to isolate rows with Reject % at 5% or higher.",
      tone: highRejectRows.length ? "is-danger" : "is-muted",
      isAction: true,
      active: isHighRejectOnly,
    },
    {
      label: "Variance vs baseline",
      value: formatSignedDelta(windowData.deltaRejectRate),
      tone: getDeltaTone(windowData.deltaRejectRate),
      caption: windowData.deltaRejectRate >= 0
        ? "Higher than the trailing baseline."
        : "Lower than the trailing baseline."
    },
    {
      label: "Rows and machines",
      value: `${numberFormatter.format(windowData.rowCount)} / ${numberFormatter.format(windowData.machineCount)}`,
      caption: spotlight
        ? `${spotlight.itemCode} on ${spotlight.machineName} moved ${formatSignedDelta(spotlight.deltaRejectPct)} vs 3M.`
        : "No standout movement yet."
    }
  ];

  summary.innerHTML = summaryCards.map((card) => {
    if (card.isAction) {
      return `
        <button
          type="button"
          class="recent-stat-card recent-stat-button ${card.tone || ""} ${card.active ? "is-active" : ""}"
          data-recent-filter-trigger="high-reject"
          aria-pressed="${card.active ? "true" : "false"}"
        >
          <span>${card.label}</span>
          <strong class="mono">${card.value}</strong>
          <p>${card.caption}</p>
        </button>
      `;
    }

    return `
      <article class="recent-stat-card ${card.tone || ""}">
        <span>${card.label}</span>
        <strong class="mono">${card.value}</strong>
        <p>${card.caption}</p>
      </article>
    `;
  }).join("");

  table.innerHTML = `
    <div class="recent-window-toolbar">
      <strong>${numberFormatter.format(visibleRows.length)} rows shown</strong>
      ${isHighRejectOnly ? `
        <button type="button" class="ghost-btn recent-reset-btn" data-recent-filter-reset="true">
          Show all
        </button>
      ` : `
        <span class="recent-toolbar-hint">Tap High Reject to filter only rows at 5% and above.</span>
      `}
    </div>
    <table class="recent-window-grid">
      <thead>
        <tr>
          <th>Date</th>
          <th>Item.Code</th>
          <th>Machine Name</th>
          <th>Producted Qty</th>
          <th>Quantity</th>
          <th>Reject %</th>
        </tr>
      </thead>
      <tbody>
        ${visibleRows.map((row) => `
          <tr>
            <td>
              <div class="recent-cell-stack">
                <strong>${escapeHtml(row.dateLabel)}</strong>
                <span class="mono">${escapeHtml(row.date)}</span>
              </div>
            </td>
            <td>
              <span class="mono recent-item-code">${escapeHtml(row.itemCode)}</span>
            </td>
            <td>
              <span class="recent-machine-badge">${escapeHtml(row.machineName)}</span>
            </td>
            <td class="mono">${numberFormatter.format(Math.round(row.producedQty || 0))}</td>
            <td class="mono">${numberFormatter.format(Math.round(row.rejectedQty || 0))}</td>
            <td>
              <div class="recent-cell-stack">
                <strong class="mono recent-primary-rate">${formatPctValue(row.rejectPct)}%</strong>
                <span class="recent-delta ${getDeltaTone(row.deltaRejectPct)}">
                  ${formatSignedDelta(row.deltaRejectPct)} vs 3M
                </span>
                <span class="recent-baseline-note">Baseline ${formatPctValue(row.baselineRejectPct)}%</span>
              </div>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  summary.querySelector('[data-recent-filter-trigger="high-reject"]')?.addEventListener("click", () => {
    analyticsUi.recentWindowFilter = analyticsUi.recentWindowFilter === "high-reject" ? "all" : "high-reject";
    renderRecent15DayWindow();
  });

  table.querySelector('[data-recent-filter-reset="true"]')?.addEventListener("click", () => {
    analyticsUi.recentWindowFilter = "all";
    renderRecent15DayWindow();
  });
}

function renderOperationsPage() {
  renderNextMoves(document.getElementById("next-moves"), state.human.nextThreeMoves);
  renderTaskBoard();
  renderHandoverList(document.getElementById("handover-list"));
  hydrateOperationsPrefill();
}

function renderPlansPage() {
  renderPlansSidebar();
  renderPlansGrid();
}

function renderCopilotPage() {
  renderCopilotGuidance();
  renderAiRecipes();
  hydrateCopilotFromQuery();
}

function renderReportsPage() {
  hydrateReportFormDefaults();
  const periodInput = document.querySelector('#report-form input[name="periodLabel"]');
  if (periodInput && !periodInput.value) {
    periodInput.value = state.analytics.latestMonthLabel;
  }
  renderReportTemplates();
  renderReportGuidance();
  renderReportCallouts();
  renderReportDraftPreview();
  renderReportsPreview(document.getElementById("reports-list"), state.reports);
  triggerReportTemplateFromQuery();
}

function renderReportTemplates() {
  const container = document.getElementById("report-templates");
  if (!container) {
    return;
  }

  container.innerHTML = REPORT_TEMPLATES.map((template) => `
    <button
      type="button"
      class="template-card"
      data-report-template-id="${template.id}"
    >
      <span class="template-icon">${template.icon}</span>
      <span class="template-label">${template.label}</span>
      <span class="template-desc">${template.description}</span>
    </button>
  `).join("");
}

function hydrateReportFormDefaults() {
  const reportForm = document.getElementById("report-form");
  if (!reportForm) {
    return;
  }

  const recipientsInput = reportForm.querySelector('input[name="recipients"]');
  const savedRecipients = loadReportRecipients();
  if (recipientsInput && savedRecipients && !recipientsInput.value.trim()) {
    recipientsInput.value = savedRecipients;
  }
}

function renderScorecardPage() {
  renderTeamPulse(document.getElementById("scorecard-guidance"), state.human.teamPulse);
  renderScorecardHealthPanel();
  renderScorecardItemGrid();
  renderScorecardKpiTable();
  renderScorecardCriticalProducts();
  renderScorecardActivePlans();
  renderScorecardEmailModal();
}

function renderPlansSidebar() {
  const container = document.getElementById("plans-sidebar");
  if (!container) {
    return;
  }

  container.innerHTML = state.plans.length
    ? state.plans
        .slice(0, 3)
        .map(
          (plan) => `
            <article class="mini-card ${mapPlanTone(plan.status)}">
              <strong>${plan.title}</strong>
              <p>${truncateText(plan.objective || "No objective captured.", 120)}</p>
              <span>${plan.horizon_label || "30 days"} • ${plan.owner_name || "Operations Team"}</span>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No plans yet. Every spike needs one named action.</div>`;
}

function renderAiLoading(container) {
  container.innerHTML = `
    <div class="ai-loading">
      <span>Processing request</span>
      <span class="typing-dots" aria-hidden="true">
        <span></span><span></span><span></span>
      </span>
    </div>
  `;
}

function renderAiResponse(container, content) {
  const sections = parseAiSections(content);
  if (!sections) {
    renderAiPlainText(container, content);
    return;
  }

  container.innerHTML = `
    <div class="ai-response-head">
      <button
        type="button"
        class="ghost-btn ai-copy-btn"
        data-copy-ai-response="true"
        data-copy-content="${escapeAttribute(content)}"
      >
        Copy
      </button>
    </div>
    <div class="ai-section-grid">
      ${sections
        .map(
          (section) => `
            <article class="ai-section-card">
              <p class="eyebrow">${section.title}</p>
              <div class="ai-section-body">${formatAiSectionBody(section.body)}</div>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderAiPlainText(container, content) {
  container.innerHTML = `
    <div class="ai-response-head">
      <button
        type="button"
        class="ghost-btn ai-copy-btn"
        data-copy-ai-response="true"
        data-copy-content="${escapeAttribute(content)}"
      >
        Copy
      </button>
    </div>
    <div class="ai-plain-text">${escapeHtml(content)}</div>
  `;
}

function renderMorningBriefPrompt() {
  const existing = document.getElementById("morning-brief-float");
  if (existing) existing.remove();

  const card = document.createElement("div");
  card.id = "morning-brief-float";
  card.className = "morning-brief-float";
  card.innerHTML = `
    <span class="morning-brief-icon">☀</span>
    <div class="morning-brief-copy">
      <strong>Your morning brief is ready</strong>
      <span>See the plant status in 30 seconds</span>
    </div>
    <button class="morning-brief-read" id="morning-brief-read-btn">
      Read it
    </button>
    <button class="morning-brief-dismiss" id="morning-brief-dismiss-btn">✕</button>
  `;
  document.body.appendChild(card);

  const readBtn = document.getElementById("morning-brief-read-btn");
  const dismissBtn = document.getElementById("morning-brief-dismiss-btn");
  const briefingKey = `aimais_daily_brief_${new Date().toISOString().slice(0, 10)}`;

  readBtn.addEventListener("click", async () => {
    readBtn.disabled = true;
    readBtn.textContent = "Loading...";
    try {
      const response = await apiFetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily-briefing",
          prompt: "Give me a morning briefing."
        })
      });
      const data = await response.json();
      showMorningBriefModal(data.content || "");
      card.remove();
    } catch {
      readBtn.textContent = "Try again";
      readBtn.disabled = false;
    }
  });

  dismissBtn.addEventListener("click", () => {
    sessionStorage.setItem(briefingKey, "dismissed");
    card.classList.add("morning-brief-hiding");
    window.setTimeout(() => card.remove(), 400);
  });

  window.setTimeout(() => {
    if (document.getElementById("morning-brief-float")) {
      card.classList.add("morning-brief-hiding");
      window.setTimeout(() => card.remove(), 400);
    }
  }, 8000);
}

function showMorningBriefModal(content) {
  const overlay = document.createElement("div");
  overlay.className = "brief-modal-overlay";
  overlay.innerHTML = `
    <div class="brief-modal">
      <div class="brief-modal-header">
        <span>☀ Morning Brief</span>
        <button class="brief-modal-close" id="brief-modal-close">✕</button>
      </div>
      <div class="brief-modal-body" id="brief-modal-body"></div>
      <div class="brief-modal-footer">
        <button class="ghost-btn" id="brief-to-copilot">
          Open in AI Copilot
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const bodyEl = document.getElementById("brief-modal-body");
  renderAiResponse(bodyEl, content);
  document.getElementById("brief-modal-close").addEventListener("click", () => overlay.remove());
  document.getElementById("brief-to-copilot").addEventListener("click", () => {
    overlay.remove();
    window.location.href =
      `/copilot?type=daily-briefing&prompt=${encodeURIComponent("Give me a morning briefing.")}`;
  });
}

function parseAiSections(content) {
  const text = String(content || "").trim();
  const pattern = /Diagnosis:\s*([\s\S]*?)\n\s*Actions:\s*([\s\S]*?)\n\s*Executive Alert:\s*([\s\S]*)/i;
  const match = text.match(pattern);
  if (!match) {
    return null;
  }

  return [
    { title: "Diagnosis", body: match[1].trim() },
    { title: "Actions", body: match[2].trim() },
    { title: "Executive Alert", body: match[3].trim() }
  ];
}

function formatAiSectionBody(content) {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return "<p>No details returned.</p>";
  }

  const bulletLines = lines.filter((line) => /^[-*•]/.test(line));
  if (bulletLines.length === lines.length) {
    return `<ul>${bulletLines.map((line) => `<li>${escapeHtml(line.replace(/^[-*•]\s*/, ""))}</li>`).join("")}</ul>`;
  }

  return lines.map((line) => `<p>${escapeHtml(line.replace(/^[-*•]\s*/, ""))}</p>`).join("");
}

function renderHeroSummary() {
  const hero = document.getElementById("hero-summary");
  if (!hero) {
    return;
  }

  hero.innerHTML = `
    <div class="hero-panel-copy">
      <p class="eyebrow">Executive Story</p>
      <h2>${state.analytics.narrative}</h2>
      <p class="hero-copy">${state.human.morningBrief.summary}</p>
    </div>
    <div class="hero-actions" data-hidden="${isSupervisorRole() ? "true" : "false"}">
      ${state.human.aiRecipes
        .slice(0, 3)
        .map(
          (recipe) => `
            <button class="ghost-btn" data-ai-type="${recipe.type}" data-ai-prompt="${escapeAttribute(recipe.prompt)}">
              ${recipe.title}
            </button>
          `
        )
        .join("")}
    </div>
  `;
}

function renderOverviewCards() {
  const container = document.getElementById("overview-cards");
  if (!container) return;
  const ov = state.analytics?.overview || {};
  const daily = state.analytics?.dailySnapshot || null;

  const monthlyCards = [
    metricCard(
      "Total Produced",
      numberFormatter.format(Math.round(ov.totalProducedQty || 0)),
      "All time — all items",
      "accent"
    ),
    metricCard(
      "Total Rejected",
      numberFormatter.format(Math.round(ov.totalRejectQty || 0)),
      "All time — all items",
      "danger"
    ),
    metricCard(
      "Overall Reject Rate",
      `${ov.latestRejectRate || 0}%`,
      "All-time — all records",
      "warning"
    ),
    metricCard(
      "Items Above 5%",
      String(ov.productsAboveThreshold || 0),
      "All-time — cumulative item rate",
      ov.productsAboveThreshold > 0 ? "danger" : "accent"
    ),
  ].join("");

  let dailyCards = "";
  if (daily) {
    const dailyRate = daily.overallRate || 0;
    dailyCards = `
      <div class="daily-cards-label">
        <span class="eyebrow">LAST RECORDED DAY</span>
        <span class="period-chip" style="font-size:var(--text-xs)">
          ${daily.dateLabel || daily.date || "—"}
        </span>
      </div>
      ${[
        metricCard(
          "Produced — Today",
          numberFormatter.format(Math.round(daily.totalProduced || 0)),
          `${daily.dateLabel || daily.date}`,
          "accent",
          true
        ),
        metricCard(
          "Rejected — Today",
          numberFormatter.format(Math.round(daily.totalRejected || 0)),
          `${daily.dateLabel || daily.date}`,
          "danger",
          true
        ),
        metricCard(
          "Reject Rate — Today",
          `${dailyRate}%`,
          `${daily.itemCount || 0} items recorded`,
          dailyRate >= 5 ? "danger" : dailyRate >= 2 ? "warning" : "accent",
          true
        ),
        metricCard(
          "Above 5% — Today",
          String(daily.itemsAbove5 || 0),
          "Items above threshold today",
          daily.itemsAbove5 > 0 ? "danger" : "accent",
          true
        ),
      ].join("")}
    `;
  } else {
    dailyCards = `
      <div class="daily-cards-label">
        <span class="eyebrow">LAST RECORDED DAY</span>
      </div>
      <div class="empty-state" style="grid-column:1/-1">
        No daily data available yet.
      </div>
    `;
  }

  container.innerHTML = monthlyCards + dailyCards;

  container.querySelectorAll(".metric-value").forEach((el) => {
    const raw = el.textContent.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    if (!Number.isNaN(num) && num > 0) animateNumber(el, 0, num, 800);
  });
}

function metricCard(title, value, caption, tone, isDaily = false) {
  return `
    <article class="metric-card${isDaily ? " metric-card--daily" : ""} ${tone}">
      <span class="metric-title">${title}</span>
      <strong class="metric-value mono">${value}</strong>
      <span class="metric-caption">${caption}</span>
    </article>
  `;
}

function animateNumber(element, from, to, duration = 900) {
  if (!element) return;
  const original = element.textContent || "";
  const prefix = original.match(/^[^0-9.-]+/)?.[0] || "";
  const suffix = original.match(/[^0-9.]+$/)?.[0] || "";
  const isFloat = !Number.isInteger(to) || String(to).includes(".");
  const fmt = (value) => isFloat
    ? Number(value.toFixed(2)).toLocaleString("en-US")
    : Math.round(value).toLocaleString("en-US");
  const start = performance.now();
  function step(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${prefix}${fmt(from + (to - from) * eased)}${suffix}`;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderTeamPulse(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="mini-card ${item.tone}">
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderNextMoves(container, items) {
  if (!container) {
    return;
  }

  container.innerHTML = items
    .map(
      (item) => `
        <article class="mini-card">
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderTaskPreview(container, tasks) {
  if (!container) {
    return;
  }

  container.innerHTML = tasks.length
    ? tasks
        .map(
          (task) => `
            <article class="mini-card">
              <strong>${task.title}</strong>
              <p>${task.progress_note || "No update yet."}</p>
              <span class="mono">${task.owner_name || "Unassigned"} • ${mapStatus(task.status)} • ${task.progress_percent || 0}%</span>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No active tasks yet.</div>`;
}

function renderHandoverPreview(container, notes) {
  if (!container) {
    return;
  }

  container.innerHTML = notes.length
    ? notes
        .map(
          (note) => `
            <article class="mini-card mood-${note.mood}">
              <strong>${note.shift_label}</strong>
              <p>${note.summary}</p>
              <span>${note.speaker_name}</span>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No shift context logged.</div>`;
}

function renderReportsPreview(container, reports) {
  if (!container) {
    return;
  }

  const isReportsPageList = container.id === "reports-list" && document.body.dataset.page === "reports";

  container.innerHTML = reports.length
    ? reports
        .map(
          (report) => `
            <article class="mini-card">
              <div class="card-topline">
                <strong>${report.title}</strong>
                <div class="report-card-actions">
                  <button
                    type="button"
                    class="ghost-btn report-copy-btn"
                    data-copy-ai-response="true"
                    data-copy-content="${escapeAttribute(report.summary || "")}"
                  >
                    Copy
                  </button>
                  ${
                    isReportsPageList
                      ? `
                        <button
                          type="button"
                          class="ghost-btn report-copy-btn"
                          data-report-resend-id="${report.id}"
                        >
                          Re-send
                        </button>
                        <button
                          type="button"
                          class="ghost-btn report-copy-btn"
                          data-report-use-template-id="${report.id}"
                        >
                          Use as Template
                        </button>
                        <button
                          type="button"
                          class="ghost-btn report-copy-btn"
                          data-download-report-id="${report.id}"
                        >
                          Download PDF
                        </button>
                      `
                      : ""
                  }
                </div>
              </div>
              <p>${report.summary}</p>
              <span>${report.period_label} • ${report.generated_by}</span>
              ${
                isReportsPageList
                  ? `
                    <div class="report-resend-panel hidden" id="report-resend-panel-${report.id}">
                      <div class="inline-grid">
                        <input
                          type="text"
                          id="report-resend-input-${report.id}"
                          value="${escapeAttribute(report.recipients || loadReportRecipients())}"
                          placeholder="Recipients"
                        />
                        <button type="button" data-report-resend-confirm-id="${report.id}">Send Again</button>
                      </div>
                      <div class="inline-status hidden" id="report-resend-status-${report.id}"></div>
                    </div>
                  `
                  : ""
              }
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">No reports sent yet.</div>`;
}

function renderImportPanelMeta() {
  const sourceBox = document.getElementById("bundled-source");
  const statusBox = document.getElementById("import-status");
  if (!sourceBox) {
    return;
  }

  const bundled = state.config.bundledWorkbook || {};
  const latestImport = state.config.latestImport;
  if (statusBox && !latestImport) {
    statusBox.textContent = "No data imported yet.";
  }
  sourceBox.innerHTML = bundled.available
    ? `
        <span class="source-pill ready">Bundled workbook ready</span>
        <strong>${bundled.fileName}</strong>
        <p>Use the project file directly when you want the dashboard to rebuild from the approved source inside AIMAIS.</p>
        ${
          latestImport
            ? `<p>Last import: ${latestImport.sourceFile} • ${latestImport.sheetName} • ${numberFormatter.format(latestImport.rowCount)} rows • ${latestImport.importedAt}</p>`
            : ""
        }
      `
    : `
        <span class="source-pill muted">No bundled workbook</span>
        <strong>Upload a workbook manually</strong>
        <p>No default project workbook is available yet, so import from your device.</p>
      `;
}

function renderImportHistory() {
  const toggle = document.getElementById("import-history-toggle");
  const count = document.getElementById("import-history-count");
  const content = document.getElementById("import-history-content");
  if (!toggle || !count || !content) {
    return;
  }

  count.textContent = String(state.importHistory.length || 0);
  toggle.setAttribute("aria-expanded", analyticsUi.importHistoryOpen ? "true" : "false");
  content.classList.toggle("hidden", !analyticsUi.importHistoryOpen);

  if (!analyticsUi.importHistoryOpen) {
    return;
  }

  if (!state.importHistory.length) {
    content.innerHTML = `
      <div class="empty-state">No imports yet.</div>
      ${buildClearAllSection()}
    `;
    return;
  }

  content.innerHTML = `
    <div class="import-history-list">
      ${state.importHistory
        .map(
          (item) => `
            <article class="import-history-item">
              <strong>${item.source_file}</strong>
              <span class="mono">${item.sheet_name || "Unknown sheet"} | ${numberFormatter.format(item.row_count || 0)} rows | ${item.latest_month || "No data"} | ${item.imported_at}</span>
            </article>
          `
        )
        .join("")}
    </div>
    ${buildClearAllSection()}
  `;
}

function buildClearAllSection() {
  if (!canManageImports()) {
    return "";
  }

  return `
    <div class="clear-all-box">
      ${
        analyticsUi.clearAllArmed
          ? `<p class="clear-all-warning">This deletes all 8,024 rejection records. Cannot be undone.</p>`
          : ""
      }
      <button type="button" class="ghost-btn clear-all-btn" data-clear-reject-data="true">
        ${analyticsUi.clearAllArmed ? "Confirm delete" : "Clear all data"}
      </button>
    </div>
  `;
}

function renderAnalyticsTools() {
  const container = document.getElementById("analytics-ai-tools");
  if (!container) {
    return;
  }

  container.innerHTML = state.human.aiRecipes
    .filter((recipe) =>
      [
        "monthly-compare",
        "weekly-forecast",
        "quality-brief",
        "capa-draft",
        "root-cause-coach",
        "executive-brief",
        "item-drilldown",
        "anomaly-summary"
      ].includes(recipe.type)
    )
    .map(
      (recipe) => `
        <button class="tool-card" data-ai-type="${recipe.type}" data-ai-prompt="${escapeAttribute(recipe.prompt)}">
          <strong>${recipe.title}</strong>
          <span>${recipe.description}</span>
        </button>
      `
    )
    .join("");
}

function renderPeriodInsights() {
  const container = document.getElementById("period-insights");
  if (!container) {
    return;
  }

  const insights = state.analytics.periodInsights || {};
  const monthlyTrend = state.analytics.monthlyTrend || [];
  const weeklyTrend = state.analytics.weeklyTrend || [];
  const peakMonth = monthlyTrend.length
    ? monthlyTrend.reduce((best, item) => (!best || item.rejectRate > best.rejectRate ? item : best), null)
    : null;
  const peakWeek = weeklyTrend.length
    ? weeklyTrend.reduce((best, item) => (!best || item.rejectRate > best.rejectRate ? item : best), null)
    : null;
  const cards = [
    {
      title: "Months covered",
      value: insights.monthCount || 0,
      caption: `Timeline ends at ${state.analytics.latestMonthLabel}.`
    },
    {
      title: "Weeks covered",
      value: insights.weekCount || 0,
      caption: `Latest weekly cut is ${insights.latestWeekLabel || "No data"}.`
    },
    {
      title: "Peak month",
      value: peakMonth ? `${peakMonth.rejectRate}%` : "0%",
      caption: peakMonth ? peakMonth.label : "No month peak yet."
    },
    {
      title: "Peak week",
      value: peakWeek ? `${peakWeek.rejectRate}%` : "0%",
      caption: peakWeek ? peakWeek.label : "No week peak yet."
    }
  ];

  container.innerHTML = cards
    .map(
      (card) => `
        <article class="period-card">
          <span>${card.title}</span>
          <strong class="mono">${card.value}</strong>
          <p>${card.caption}</p>
        </article>
      `
    )
    .join("");
}

function renderMonthStrip() {
  const container = document.getElementById("month-strip");
  if (!container) {
    return;
  }

  const latestMonthKey = state.analytics.monthlyTrend.at(-1)?.monthKey;
  container.innerHTML = state.analytics.monthlyTrend
    .map((month) => {
      return `
        <article class="month-chip ${month.monthKey === latestMonthKey ? "active" : ""}">
          <span>${month.label}</span>
          <strong class="mono">${Number(month.rejectRate || 0).toFixed(2)}%</strong>
          <small>overall reject rate</small>
        </article>
      `;
    })
    .join("");
}

function formatWeekLabel(value) {
  const match = String(value || "").match(/W(\d{2})$/);
  return match ? `W${match[1]}` : String(value || "No data");
}

function computeLinearTrend(values) {
  const series = Array.isArray(values)
    ? values.map((value) => Number(value)).filter((value) => Number.isFinite(value))
    : [];

  if (!series.length) {
    return {
      slope: 0,
      nextPredicted: 0,
      direction: "stable"
    };
  }

  if (series.length === 1) {
    return {
      slope: 0,
      nextPredicted: Number(series[0].toFixed(2)),
      direction: "stable"
    };
  }

  const n = series.length;
  const sumX = ((n - 1) * n) / 2;
  const sumY = series.reduce((sum, value) => sum + value, 0);
  const sumXY = series.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = series.reduce((sum, _value, index) => sum + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;
  const nextPredicted = Number(Math.max(0, intercept + slope * n).toFixed(2));
  const direction = Math.abs(slope) < 0.05 ? "stable" : slope > 0 ? "rising" : "falling";

  return {
    slope: Number(slope.toFixed(4)),
    nextPredicted,
    direction
  };
}

function renderMonthlyChart(container) {
  if (!container) {
    return;
  }
  initChartDefaults();
  container.innerHTML = buildLineChart(state.analytics.monthlyTrend);
}

function renderWeeklyChart(container) {
  if (!container) {
    return;
  }
  initChartDefaults();
  container.innerHTML = buildWeeklyBars(state.analytics.weeklyTrend);
}

function renderTopProductsChart() {
  const canvas = document.getElementById("top-products-chart");
  if (!canvas || !window.Chart) {
    return;
  }

  initChartDefaults();
  destroyAnalyticsChart("topProducts");
  const rankedProducts = buildTopProductChartRows();
  const axisColor = withAlpha(getCssVar("--muted"), 0.72);
  const gridColor = withAlpha(getCssVar("--line-strong"), 0.46);
  const productMax = Math.max(6, ...rankedProducts.map((item) => Number(item.rejectRate || 0) * 1.12));

  analyticsUi.charts.topProducts = new window.Chart(canvas, {
    type: "bar",
    plugins: [thresholdLinePlugin],
    data: {
      labels: rankedProducts.map((item) => truncateLabel(item.productName, 30)),
      datasets: [
        {
          data: rankedProducts.map((item) => item.rejectRate),
          backgroundColor: rankedProducts.map((item) => getProductBarColor(item.rejectRate)),
          borderRadius: 12,
          borderSkipped: false,
          barThickness: 16
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(7, 16, 25, 0.94)",
          borderColor: withAlpha(getCssVar("--line-strong"), 0.7),
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            title(items) {
              return items[0] ? rankedProducts[items[0].dataIndex]?.productName || "" : "";
            },
            label(context) {
              const item = rankedProducts[context.dataIndex];
              if (!item) {
                return "";
              }
              return [
                `Reject %: ${item.rejectRate}%`,
                `Rejected qty: ${numberFormatter.format(item.rejectQty)}`,
                `Inspected qty: ${formatInspectedQty(item.producedQty)}`,
                `Code: ${item.code || "No item code"}`
              ];
            }
          }
        },
        thresholdLine: {
          axis: "x",
          scaleId: "x",
          value: 5,
          color: getCssVar("--danger")
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          suggestedMax: productMax,
          position: "top",
          ticks: {
            color: axisColor,
            callback(value) {
              return `${value}%`;
            }
          },
          grid: {
            color: gridColor,
            drawBorder: false
          },
          border: { display: false }
        },
        y: {
          ticks: {
            color: axisColor
          },
          grid: { display: false },
          border: { display: false }
        }
      }
    }
  });
}

async function renderParetoChart(container) {
  const callout = document.getElementById("pareto-callout");
  if (!container || !window.Chart) {
    return;
  }

  initChartDefaults();
  const wrap = container.closest(".chart-canvas-wrap");
  if (wrap) {
    wrap.classList.add("is-loading");
  }
  if (callout) {
    callout.textContent = "Loading Pareto cutoff...";
  }

  try {
    if (!Array.isArray(analyticsUi.paretoRows)) {
      const response = await apiFetch("/api/reject/pareto");
      const rows = await response.json();
      analyticsUi.paretoRows = Array.isArray(rows) ? rows : [];
    }

    const paretoRows = analyticsUi.paretoRows || [];
    destroyAnalyticsChart("pareto");

    if (!paretoRows.length) {
      if (callout) {
        callout.textContent = "No rejection records are available yet for Pareto analysis.";
      }
      return;
    }

    const axisColor = withAlpha(getCssVar("--muted"), 0.72);
    const gridColor = withAlpha(getCssVar("--line-strong"), 0.46);
    const danger = getCssVar("--danger");
    const muted = getCssVar("--muted");
    const cutoffIndex = paretoRows.findIndex((item) => Number(item.runningPct || 0) >= 80);
    const paretoCutoffCount = cutoffIndex === -1 ? paretoRows.length : cutoffIndex + 1;

    analyticsUi.charts.pareto = new window.Chart(container, {
      type: "bar",
      plugins: [thresholdLinePlugin],
      data: {
        labels: paretoRows.map((item) => truncateLabel(item.productName, 20)),
        datasets: [
          {
            type: "bar",
            label: "Rejected quantity",
            yAxisID: "y",
            data: paretoRows.map((item) => Number(item.totalRejected || 0)),
            backgroundColor: paretoRows.map((_item, index) =>
              index < paretoCutoffCount ? danger : withAlpha(muted, 0.55)
            ),
            borderRadius: 10,
            borderSkipped: false,
            maxBarThickness: 26
          },
          {
            type: "line",
            label: "Cumulative %",
            yAxisID: "y1",
            data: paretoRows.map((item) => Number(item.runningPct || 0)),
            borderColor: getCssVar("--sky"),
            backgroundColor: getCssVar("--sky"),
            tension: 0.24,
            pointRadius: 3,
            pointHoverRadius: 4,
            pointBorderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: axisColor
            }
          },
          tooltip: {
            backgroundColor: "rgba(7, 16, 25, 0.94)",
            borderColor: withAlpha(getCssVar("--line-strong"), 0.7),
            borderWidth: 1,
            callbacks: {
              title(items) {
                return items[0] ? paretoRows[items[0].dataIndex]?.productName || "" : "";
              },
              label(context) {
                const item = paretoRows[context.dataIndex];
                if (!item) {
                  return "";
                }
                if (context.dataset.type === "line") {
                  return `Cumulative: ${Number(item.runningPct || 0).toFixed(2)}%`;
                }
                return [
                  `Rejected qty: ${numberFormatter.format(item.totalRejected)}`,
                  `Product share: ${Number(item.cumulativePct || 0).toFixed(2)}%`,
                  `Running total: ${Number(item.runningPct || 0).toFixed(2)}%`
                ];
              }
            }
          },
          thresholdLine: {
            axis: "y",
            scaleId: "y1",
            value: 80,
            color: danger,
            dash: [10, 6]
          }
        },
        scales: {
          x: {
            ticks: {
              color: axisColor,
              maxRotation: 0,
              minRotation: 0
            },
            grid: { display: false },
            border: { color: gridColor }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: axisColor,
              callback(value) {
                return numberFormatter.format(value);
              }
            },
            grid: {
              color: gridColor,
              drawBorder: false
            },
            border: { display: false }
          },
          y1: {
            position: "right",
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              color: axisColor,
              callback(value) {
                return `${value}%`;
              }
            },
            grid: {
              drawOnChartArea: false
            },
            border: { color: gridColor }
          }
        }
      }
    });

    if (callout) {
      callout.textContent = `${paretoCutoffCount} items account for 80% of all rejection — focus here first.`;
    }
  } catch {
    destroyAnalyticsChart("pareto");
    if (callout) {
      callout.textContent = "Pareto analysis is unavailable right now. Try refreshing after the data import completes.";
    }
  } finally {
    if (wrap) {
      wrap.classList.remove("is-loading");
    }
  }
}

function renderWeekStrip() {
  const container = document.getElementById("week-strip");
  if (!container) {
    return;
  }

  if (!state.analytics.weeklyTrend.length) {
    container.innerHTML = `<div class="empty-state">No rejection data yet. Import your Excel workbook from Analytics to unlock the weekly cut.</div>`;
    return;
  }

  container.innerHTML = state.analytics.weeklyTrend
    .map((week) => `
      <article class="week-strip-card">
        <div class="card-topline">
          <strong>${week.label}</strong>
          <span>${Number(week.rejectRate || 0).toFixed(2)}%</span>
        </div>
        <p>Overall weekly reject rate across all item codes.</p>
      </article>
    `)
    .join("");
}

function buildLineChart(data) {
  if (!data.length) {
    return `<div class="empty-state">
      No data. Import a workbook from Analytics.
    </div>`;
  }

  const width = 1200;
  const height = 280;
  const padL = 48;
  const padR = 24;
  const padT = 20;
  const padB = 40;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const rates = data.map((d) => Number(d.rejectRate || 0));
  const maxRate = Math.max(...rates, 5) * 1.15;
  const step = data.length > 1
    ? chartW / (data.length - 1) : chartW;

  const toX = (i) => padL + i * step;
  const toY = (v) => padT + chartH - (v / maxRate) * chartH;

  const gridCount = 4;
  const grids = Array.from({ length: gridCount + 1 }, (_item, i) => {
    const v = (maxRate / gridCount) * i;
    const y = toY(v);
    return `
      <line x1="${padL}" x2="${width - padR}"
            y1="${y}" y2="${y}"
            stroke="rgba(255,255,255,0.05)"
            stroke-dasharray="4 6" />
      <text x="${padL - 6}" y="${y + 4}"
            text-anchor="end"
            class="chart-axis">${v.toFixed(1)}%</text>
    `;
  }).join("");

  const threshY = toY(5);
  const threshold = `
    <line x1="${padL}" x2="${width - padR}"
          y1="${threshY}" y2="${threshY}"
          stroke="rgba(240,96,96,0.5)"
          stroke-dasharray="6 4"
          stroke-width="1.5" />
    <text x="${width - padR + 4}" y="${threshY + 4}"
          class="chart-axis" fill="rgba(240,96,96,0.8)">5%</text>
  `;

  const fillPoints = [
    `${toX(0)},${padT + chartH}`,
    ...data.map((d, i) =>
      `${toX(i)},${toY(Number(d.rejectRate || 0))}`
    ),
    `${toX(data.length - 1)},${padT + chartH}`,
  ].join(" ");

  const linePoints = data.map((d, i) =>
    `${toX(i)},${toY(Number(d.rejectRate || 0))}`
  ).join(" ");

  const dots = data.map((d, i) => {
    const x = toX(i);
    const y = toY(Number(d.rejectRate || 0));
    return `
      <circle cx="${x}" cy="${y}" r="4"
              fill="var(--bg-raised)"
              stroke="var(--accent)"
              stroke-width="2">
        <title>${d.label}: ${d.rejectRate}%</title>
      </circle>
    `;
  }).join("");

  const labels = data.map((d, i) => `
    <text x="${toX(i)}" y="${height - 8}"
          text-anchor="middle"
          class="chart-axis">${d.label}</text>
  `).join("");

  return `
    <div class="chart-shell">
      <svg class="svg-chart"
           viewBox="0 0 ${width} ${height}"
           role="img"
           aria-label="Monthly reject rate trend">
        <defs>
          <linearGradient id="line-fill"
                          x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"
                  stop-color="var(--accent)"
                  stop-opacity="0.12"/>
            <stop offset="100%"
                  stop-color="var(--accent)"
                  stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${grids}
        ${threshold}
        <polygon points="${fillPoints}"
                 fill="url(#line-fill)" />
        <polyline points="${linePoints}"
                  fill="none"
                  stroke="var(--accent)"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
        ${dots}
        ${labels}
      </svg>
    </div>
  `;
}

function buildWeeklyBars(data) {
  if (!data.length) {
    return `<div class="empty-state">
      No weekly data yet.
    </div>`;
  }

  const maxRate = Math.max(...data.map((d) => d.rejectRate), 1);

  return `
    <div class="weekly-bars">
      ${data.map((week) => {
        const h = Math.round((week.rejectRate / maxRate) * 100);
        const color = week.rejectRate >= 5
          ? "var(--danger)"
          : week.rejectRate >= 2
            ? "var(--warning)"
            : "var(--accent)";
        return `
          <div class="weekly-bar-col">
            <span class="weekly-bar-pct">${week.rejectRate}%</span>
            <div class="weekly-bar-track">
              <div class="weekly-bar-fill"
                   style="height:${h}%;background:${color}">
              </div>
            </div>
            <span class="weekly-bar-label">${week.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function buildTopProductChartRows() {
  const rows = new Map();
  const alerts = state.analytics.productAlerts || [];
  const topLoss = state.analytics.topProductsByLoss || [];

  alerts.forEach((item) => {
    const key = buildProductKey(item.productName, item.code);
    rows.set(key, {
      productName: item.productName,
      code: item.code || "",
      rejectRate: Number(item.latestRate || 0),
      rejectQty: Number(item.rejectQty || 0),
      producedQty: getSafeProducedQty(item.producedQty)
    });
  });

  topLoss.forEach((item) => {
    const key = buildProductKey(item.productName, item.code);
    const existing = rows.get(key);
    const itemProducedQty = getSafeProducedQty(item.producedQty);
    rows.set(key, {
      productName: item.productName,
      code: item.code || existing?.code || "",
      rejectRate: Number(existing?.rejectRate ?? item.totalRate ?? item.avgRejectPct ?? 0),
      rejectQty: Math.max(Number(existing?.rejectQty || 0), Number(item.rejectQty || 0)),
      producedQty: existing?.producedQty ?? itemProducedQty ?? null
    });
  });

  return [...rows.values()]
    .sort((a, b) => (b.rejectRate - a.rejectRate) || (b.rejectQty - a.rejectQty))
    .slice(0, 15);
}

function buildProductKey(productName, code) {
  return `${productName || "unknown"}::${code || ""}`;
}

function getProductBarColor(rejectRate) {
  if (rejectRate > 5) {
    return getCssVar("--danger");
  }
  if (rejectRate >= 3) {
    return getCssVar("--warning");
  }
  return getCssVar("--accent");
}

function setAnalyticsTrendView(view) {
  const nextView = view === "weekly" ? "weekly" : "monthly";
  analyticsUi.trendView = nextView;

  const trendContainer = document.getElementById("analytics-trend-view");
  if (trendContainer) {
    trendContainer.classList.toggle("is-monthly", nextView === "monthly");
    trendContainer.classList.toggle("is-weekly", nextView === "weekly");
  }

  document.querySelectorAll("[data-period-view]").forEach((button) => {
    const isActive = button.dataset.periodView === nextView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function destroyAnalyticsChart(chartKey) {
  const chart = analyticsUi.charts[chartKey];
  if (chart) {
    chart.destroy();
    analyticsUi.charts[chartKey] = null;
  }
}

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hexColor, alpha) {
  const normalized = hexColor.replace("#", "");
  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function truncateLabel(value, maxLength) {
  if (String(value).length <= maxLength) {
    return value;
  }
  return `${String(value).slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

function truncateText(value, maxLength) {
  if (String(value).length <= maxLength) {
    return value;
  }
  return `${String(value).slice(0, Math.max(maxLength - 1, 1)).trimEnd()}…`;
}

function renderAlerts(container) {
  if (!container) {
    return;
  }

  const alerts = state.analytics?.productAlerts || [];
  if (!alerts.length) {
    container.innerHTML = `<div class="empty-state">No items above 5%. Keep it there.</div>`;
    return;
  }

  const maxRate = Math.max(...alerts.map((item) => Number(item.latestRate || 0)), 1);

  container.innerHTML = `
    <div class="alert-toolbar">
      <div></div>
      <button type="button" class="ghost-btn alert-export-btn" data-export-alerts-csv="true">Export CSV</button>
    </div>
    <table class="alerts-table">
      <thead>
        <tr>
          <th>Item Code</th>
          <th>Reject %</th>
          <th>vs Baseline</th>
          <th>Rejected Qty</th>
          <th>Produced Qty</th>
          <th>Visual</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${alerts.map((item) => {
          const status = getAlertStatus(item);
          const barW = Math.round((item.latestRate / maxRate) * 100);
          const deltaSign = item.delta >= 0 ? "+" : "";
          const fillColor = item.latestRate >= 15
            ? "var(--danger)"
            : item.latestRate >= 5
              ? "var(--warning)"
              : "var(--accent)";
          return `
            <tr data-item-code="${escapeAttribute(item.code)}">
              <td>
                <span class="mono" style="font-weight:600">
                  ${item.code}
                </span>
              </td>
              <td>
                <span class="mono" style="color:var(--danger);font-weight:700">
                  ${item.latestRate}%
                </span>
              </td>
              <td>
                <span class="mono" style="color:${item.delta > 0 ? "var(--danger)" : "var(--accent)"}">
                  ${deltaSign}${item.delta}%
                </span>
              </td>
              <td class="mono">
                ${numberFormatter.format(item.rejectQty)}
              </td>
              <td class="mono">
                ${item.producedQty > 0
                  ? numberFormatter.format(item.producedQty)
                  : "—"}
              </td>
              <td>
                <div class="pct-bar">
                  <div class="pct-fill" style="width:${barW}%;background:${fillColor}">
                  </div>
                </div>
              </td>
              <td><span class="badge ${status.badgeClass}">${status.label}</span></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

async function renderItemsByPct(container) {
  if (!container) {
    return;
  }

  try {
    const res = await apiFetch("/api/reject/items-by-pct");
    const data = await res.json();
    state.itemsByPct = Array.isArray(data) ? data : [];
    if (!state.itemsByPct.length) {
      container.innerHTML = `<div class="empty-state">
        No items above 3% reject rate.
      </div>`;
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Avg Reject %</th>
            <th>Max Reject %</th>
            <th>Total Rejected</th>
            <th>Total Produced</th>
            <th>Occurrences</th>
          </tr>
        </thead>
        <tbody>
          ${state.itemsByPct.map((item) => `
            <tr>
              <td>
                <span class="mono" style="font-weight:600">
                  ${item.code}
                </span>
              </td>
              <td>
                <span class="mono" style="color:${
                  item.avg_pct >= 5
                    ? "var(--danger)"
                    : item.avg_pct >= 3
                      ? "var(--warning)"
                      : "var(--text)"
                };font-weight:600">
                  ${item.avg_pct}%
                </span>
              </td>
              <td class="mono">${item.max_pct}%</td>
              <td class="mono">
                ${numberFormatter.format(item.total_rejected)}
              </td>
              <td class="mono">
                ${numberFormatter.format(item.total_produced)}
              </td>
              <td class="mono">${item.occurrences}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  } catch {
    container.innerHTML = `<div class="empty-state">
      Unable to load item data.
    </div>`;
  }
}

async function toggleProductDetailPanel(row, code = "") {
  if (!row || !code) {
    return;
  }

  const existingNext = row.nextElementSibling;
  if (existingNext?.classList.contains("product-detail-row")) {
    existingNext.remove();
    return;
  }

  document.querySelectorAll(".product-detail-row").forEach((detailRow) => detailRow.remove());

  const response = await apiFetch(`/api/reject/product?code=${encodeURIComponent(code)}`);
  const product = await response.json();
  const relatedAlert = (state.analytics.productAlerts || []).find((item) => item.code === code) || null;
  const relatedLoss = (state.analytics.topProductsByLoss || []).find((item) => item.code === code) || null;
  const detailRow = document.createElement("tr");
  detailRow.className = "product-detail-row";
  detailRow.innerHTML = `
    <td colspan="7">
      <div class="product-detail-panel">
        <div class="section-heading compact">
          <div>
            <h3>${code}</h3>
            <p class="section-subtitle">Monthly breakdown for the selected item code.</p>
          </div>
          <div class="stack-list">
            <strong class="mono-value">${formatPctValue(relatedAlert?.latestRate ?? product.avgRejectPct)}%</strong>
          </div>
        </div>
        <div class="inline-grid">
          <div class="mini-card">
            <strong>Average reject %</strong>
            <p class="${(relatedAlert?.delta || 0) > 0 ? "tone-danger" : "tone-accent"}">${formatPctValue(product.avgRejectPct || 0)}%</p>
          </div>
          <div class="mini-card">
            <strong>Item totals</strong>
            <p>${numberFormatter.format(Math.round(product.totalRejected || 0))} rejected from ${numberFormatter.format(Math.round(product.totalProduced || 0))} produced.</p>
          </div>
        </div>
        <div class="stack-list">
          <div class="card-topline">
            <strong>Monthly trend</strong>
            <span class="muted">${product.byMonth?.length || 0} months tracked</span>
          </div>
          ${product.byMonth?.length
            ? `
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Produced</th>
                    <th>Rejected</th>
                    <th>Avg Reject %</th>
                  </tr>
                </thead>
                <tbody>
                  ${product.byMonth.map((month) => `
                    <tr>
                      <td>${month.label}</td>
                      <td class="mono">${numberFormatter.format(month.produced)}</td>
                      <td class="mono">${numberFormatter.format(month.rejected)}</td>
                      <td class="mono">${month.avgPct}%</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `
            : `<span class="muted">No monthly breakdown found for this item.</span>`}
        </div>
        ${relatedLoss ? `
          <div class="mini-card">
            <strong>Total rejected volume</strong>
            <p>${numberFormatter.format(relatedLoss.rejectQty)} units rejected at an average rate of ${relatedLoss.totalRate}%.</p>
          </div>
        ` : ""}
        <div class="report-card-actions">
          <button
            type="button"
            class="ghost-btn"
            data-product-ai-name="${escapeAttribute(code)}"
          >
            Analyze with AI
          </button>
          <button
            type="button"
            class="ghost-btn"
            data-product-task-name="${escapeAttribute(code)}"
          >
            Add corrective task
          </button>
        </div>
      </div>
    </td>
  `;
  row.insertAdjacentElement("afterend", detailRow);
}

function hydrateOperationsPrefill() {
  const value = new URLSearchParams(window.location.search).get("prefill");
  const form = document.getElementById("task-form");
  const titleInput = form?.querySelector('input[name="title"]');
  if (!value || !form || !titleInput) {
    return;
  }
  titleInput.value = value;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => titleInput.focus(), 150);
}

function exportAlertRowsCsv() {
  const alerts = state.analytics?.productAlerts || [];
  if (!alerts.length) {
    return;
  }

  const rows = [
    ["Item Code", "Status", "Reject %", "Baseline %", "Delta %", "Rejected Qty", "Produced Qty"]
  ];

  alerts.forEach((item) => {
    const status = getAlertStatus(item).label;
    rows.push([
      item.code || "",
      status,
      formatPctValue(item.latestRate),
      formatPctValue(item.baselineRate),
      formatPctValue(item.delta),
      String(item.rejectQty ?? ""),
      String(getSafeProducedQty(item.producedQty) ?? "")
    ]);
  });

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `alert-thresholds-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function getAlertStatus(item) {
  const rate = Number(item.latestRate || 0);
  const delta = Number(item.delta || 0);
  if (rate > 15) {
    return { label: "CRITICAL", badgeClass: "badge-critical" };
  }
  if (rate >= 10) {
    return { label: "HIGH", badgeClass: "badge-high" };
  }
  if (rate >= 5) {
    return { label: "ELEVATED", badgeClass: "badge-elevated" };
  }
  if (delta > 1) {
    return { label: "WATCH", badgeClass: "badge-muted" };
  }
  return { label: "WATCH", badgeClass: "badge-muted" };
}

function formatPctValue(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "0.0";
}

function getSafeProducedQty(value) {
  const producedQty = Number(value);
  return Number.isFinite(producedQty) && producedQty > 0 ? producedQty : null;
}

function formatInspectedQty(value) {
  const producedQty = getSafeProducedQty(value);
  return producedQty !== null ? numberFormatter.format(Math.round(producedQty)) : "—";
}

function escapeCsvCell(value) {
  const raw = String(value ?? "");
  if (/[",\n]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderLossList(container) {
  if (!container) {
    return;
  }

  const items = state.analytics?.topProductsByLoss || [];
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">Import a workbook to see volume loss by item.</div>`;
    return;
  }

  const max = Math.max(...items.map((item) => item.rejectQty), 1);

  container.innerHTML = items.map((item) => `
    <article class="mini-card">
      <div class="card-topline">
        <span class="mono" style="font-weight:600">
          ${item.code}
        </span>
        <span class="mono">
          ${numberFormatter.format(item.rejectQty)} rejected
        </span>
      </div>
      <p style="color:var(--muted);font-size:var(--text-xs)">
        Avg reject rate: ${item.totalRate}%
      </p>
      <div class="progress-track compact">
        <span class="progress-fill" style="width:${(item.rejectQty / max) * 100}%"></span>
      </div>
    </article>
  `).join("");
}

function renderTaskBoard() {
  const list = document.getElementById("tasks-list");
  const template = document.getElementById("task-template");
  if (!list || !template) {
    return;
  }

  const readonly = !canEditTasks();
  const activeTasks = state.tasks.filter((task) => task.status !== "done");

  list.innerHTML = "";
  if (!activeTasks.length) {
    list.innerHTML = `<div class="empty-state">No active tasks yet.</div>`;
    return;
  }

  if (readonly) {
    list.innerHTML = `<div class="inline-status">Tasks are read-only for the current role.</div>`;
  }

  activeTasks.forEach((task) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const title = fragment.querySelector(".task-title");
    const meta = fragment.querySelector(".task-meta");
    const priority = fragment.querySelector(".task-priority");
    const fill = fragment.querySelector(".progress-fill");
    const status = fragment.querySelector(".task-status");
    const range = fragment.querySelector(".task-progress");
    const note = fragment.querySelector(".task-note");
    const saveBtn = fragment.querySelector(".save-task-btn");
    const deleteBtn = fragment.querySelector(".task-delete-btn");
    const saveState = fragment.querySelector(".task-save-state");
    let autosaveTimer = null;

    title.textContent = task.title;
    meta.textContent = `${task.owner_name || "Unassigned"} • ${task.due_date || "No due date"}`;
    priority.textContent = mapPriority(task.priority);
    priority.className = `task-priority badge ${mapPriorityBadgeClass(task.priority)}`;
    fill.style.width = `${task.progress_percent || 0}%`;
    status.value = task.status || "new";
    range.value = task.progress_percent || 0;
    note.value = task.progress_note || "";
    status.disabled = readonly;
    range.disabled = readonly;
    note.disabled = readonly;
    saveBtn.disabled = readonly;
    deleteBtn.disabled = readonly;
    saveBtn.dataset.hidden = readonly ? "true" : "false";
    deleteBtn.dataset.hidden = readonly ? "true" : "false";
    if (readonly && saveState) {
      saveState.textContent = "Read-only";
    }

    if (!readonly) {
      range.addEventListener("input", () => {
        fill.style.width = `${range.value}%`;
      });
    }

    const saveTaskUpdate = async (mode = "manual") => {
      if (saveState) {
        saveState.textContent = mode === "autosave" ? "Saving..." : "";
      }
      await apiFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: status.value,
          progressPercent: Number(range.value),
          progressNote: note.value
        })
      });
      await refreshTasksOnly();
      if (saveState) {
        saveState.textContent = "Saved";
        window.setTimeout(() => {
          if (saveState.textContent === "Saved") {
            saveState.textContent = "";
          }
        }, 1200);
      }
    };

    if (!readonly) {
      note.addEventListener("input", () => {
        if (saveState) {
          saveState.textContent = "Typing...";
        }
        window.clearTimeout(autosaveTimer);
        autosaveTimer = window.setTimeout(() => {
          saveTaskUpdate("autosave");
        }, 1500);
      });

      saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = "Saving...";
        window.clearTimeout(autosaveTimer);
        await saveTaskUpdate("manual");
        saveBtn.disabled = false;
        saveBtn.textContent = "Save Update";
      });

      deleteBtn?.addEventListener("click", async () => {
        deleteBtn.disabled = true;
        deleteBtn.textContent = "...";
        const response = await apiFetch(`/api/tasks/${task.id}`, { method: "DELETE" });
        if (response.ok) {
          await refreshTasksOnly();
          showInlineMessage("tasks-list", "Task deleted");
          return;
        }
        deleteBtn.disabled = false;
        deleteBtn.textContent = "✕";
      });
    }

    list.appendChild(card);
  });
}

function renderPlansGrid() {
  const container = document.getElementById("plans-grid");
  if (!container) {
    return;
  }

  if (!state.plans.length) {
    container.innerHTML = `<div class="empty-state">No plans yet. Every spike needs one named action.</div>`;
    return;
  }

  container.innerHTML = state.plans
    .map((plan) => {
      const impactScore = Math.max(0, Math.min(100, Number(plan.impact_score || 0)));
      return `
        <article class="plan-card">
          <div class="card-topline">
            <span class="pill">${plan.horizon_label || "30 days"}</span>
            <button
              class="ghost-btn plan-delete-btn"
              type="button"
              data-delete-plan-id="${plan.id}"
              data-hidden="${canManagePlans() ? "false" : "true"}"
            >
              Delete
            </button>
          </div>
          <h3 class="plan-title">${plan.title}</h3>
          <p class="plan-objective">${truncateText(plan.objective || "No objective captured.", 180)}</p>
          <div class="plan-meta">
            <span>${plan.owner_name || "Operations Team"}</span>
            <span class="badge ${mapPlanBadgeClass(plan.status)}">${mapPlanStatus(plan.status)}</span>
          </div>
          <div class="plan-impact-block">
            <div class="card-topline">
              <strong>Impact score</strong>
              <span class="impact-score mono">${impactScore}</span>
            </div>
            <div class="impact-track" aria-hidden="true">
              <span class="impact-fill" style="width:${impactScore}%;"></span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderHandoverList(container) {
  if (!container) {
    return;
  }

  container.innerHTML = state.handovers.length
    ? state.handovers
        .map(
          (note) => `
            <article class="handover-card mood-${note.mood}">
              <div class="card-topline">
                <strong>${note.shift_label}</strong>
                <div class="handover-card-actions">
                  <span>${note.speaker_name}</span>
                  <button class="handover-delete-btn"
                          data-handover-id="${note.id}"
                          aria-label="Delete handover note">
                    ✕
                  </button>
                </div>
              </div>
              <p>${note.summary}</p>
              <div class="meta-pair">
                <span>Blockers: ${note.blockers || "None stated"}</span>
                <span>Next: ${note.next_step || "No next step captured"}</span>
              </div>
            </article>
          `
        )
        .join("")
    : `<div class="empty-state">Nothing logged this shift.</div>`;
}

function renderCopilotGuidance() {
  const container = document.getElementById("copilot-guidance");
  if (!container) {
    return;
  }

  const topAlert = state.analytics?.productAlerts?.[0] || null;
  const topLoss = state.analytics?.topProductsByLoss?.[0] || null;
  const insights = state.analytics.periodInsights || {};
  container.innerHTML = `
    <article class="mini-card accent">
      <strong>Human first</strong>
      <p>Ask the copilot for words people can act on, not just words that sound intelligent.</p>
    </article>
    <article class="mini-card">
      <strong>Use real ownership</strong>
      <p>Every output should mention who owns the next move and when the next update is due.</p>
    </article>
    <article class="mini-card warning">
      <strong>Use time context</strong>
      <p>The current view covers ${insights.monthCount || 0} months and ${insights.weekCount || 0} weeks, so ask the copilot to compare or forecast with that exact window.</p>
    </article>
    <article class="mini-card">
      <strong>Stay item-specific</strong>
      <p>${topAlert ? `${topAlert.productName} is the highest-risk item right now.` : topLoss ? `${topLoss.code} is carrying the highest rejected volume.` : "Anchor the prompt on one item code or one week."}</p>
    </article>
  `;
}

function renderAiRecipes() {
  const container = document.getElementById("ai-recipes");
  if (!container) {
    return;
  }

  const allowedTypes = getAllowedCopilotTypes();
  const filteredRecipes = allowedTypes
    ? state.human.aiRecipes.filter((recipe) => allowedTypes.includes(recipe.type))
    : state.human.aiRecipes;
  if (!filteredRecipes.length) {
    container.innerHTML = `<div class="empty-state">AI playbooks are read-only for your role.</div>`;
    return;
  }
  container.innerHTML = filteredRecipes
    .map(
      (recipe) => `
        <article class="recipe-card">
          <div class="card-topline">
            <strong>${recipe.title}</strong>
            <span>${recipe.type}</span>
          </div>
          <p>${recipe.description}</p>
          <button class="ghost-btn full" data-ai-type="${recipe.type}" data-ai-prompt="${escapeAttribute(recipe.prompt)}">
            Run ${recipe.title}
          </button>
        </article>
      `
    )
    .join("");

  const typeSelect = document.querySelector('#ai-form select[name="type"]');
  if (typeSelect) {
    const options = [...typeSelect.options];
    options.forEach((option) => {
      option.hidden = Boolean(allowedTypes && !allowedTypes.includes(option.value));
    });

    const visibleOption = options.find((option) => !option.hidden);
    if (visibleOption && (typeSelect.selectedOptions[0]?.hidden || !typeSelect.value)) {
      typeSelect.value = visibleOption.value;
    }
  }
}

function renderReportGuidance() {
  const container = document.getElementById("report-guidance");
  if (!container) {
    return;
  }

  container.innerHTML = state.human.teamPulse
    .map(
      (item) => `
        <article class="mini-card ${item.tone}">
          <strong>${item.title}</strong>
          <p>${item.detail}</p>
        </article>
      `
    )
    .join("");
}

function renderReportCallouts() {
  const container = document.getElementById("report-callouts");
  if (!container) {
    return;
  }

  const topAlert = state.analytics.productAlerts[0];
  const topLoss = state.analytics.topProductsByLoss[0];
  container.innerHTML = `
    <article class="mini-card warning">
      <strong>Keep this angle</strong>
      <p>Explain why ${topAlert ? topAlert.code : topLoss?.code || "the leading item"} matters now and how the team is containing the situation.</p>
    </article>
    <article class="mini-card">
      <strong>Do not bury the lead</strong>
      <p>${topAlert ? `${topAlert.productName} is still the best anomaly to reference in the executive draft.` : topLoss ? `${topLoss.code} is the clearest volume-loss item to reference.` : "No product crossed the hard threshold, so frame the report around movement and control."}</p>
    </article>
  `;
}

async function generateReportDraftFromForm({ sourceButton = null, scrollToPreview = false } = {}) {
  const reportForm = document.getElementById("report-form");
  if (!reportForm) {
    return;
  }

  const formData = new FormData(reportForm);
  const payload = Object.fromEntries(formData.entries());
  const button = sourceButton || reportForm.querySelector('button[type="submit"]');
  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }

  try {
    const response = await apiFetch("/api/reports/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const draft = await response.json();
    analyticsUi.reportDraft = {
      title: draft.title || payload.title || "AI-generated executive report",
      periodLabel: draft.periodLabel || payload.periodLabel || "",
      recipients: draft.recipients || payload.recipients || "",
      summary: draft.summary || "",
      generatedBy: draft.provider || "manual-review"
    };
    if (payload.recipients?.trim()) {
      saveReportRecipients(payload.recipients.trim());
    }
    renderReportDraftPreview();
    const saveStatus = document.getElementById("report-save-status");
    if (saveStatus) {
      saveStatus.classList.remove("hidden");
      saveStatus.textContent = "Draft ready — review before sending";
    }
    if (scrollToPreview) {
      document.getElementById("report-preview-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = button.dataset.originalLabel || "Generate executive draft";
    }
  }
}

function buildSmartReportTitle() {
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(now);
  return `QC Report — ${state.analytics.latestMonthLabel} — ${dateLabel}`;
}

function loadReportRecipients() {
  try {
    return localStorage.getItem(REPORT_RECIPIENTS_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveReportRecipients(recipients) {
  localStorage.setItem(REPORT_RECIPIENTS_STORAGE_KEY, recipients);
}

function fillReportForm(values = {}) {
  const reportForm = document.getElementById("report-form");
  if (!reportForm) {
    return;
  }

  const titleInput = reportForm.querySelector('input[name="title"]');
  const typeInput = reportForm.querySelector('[name="type"]');
  const periodInput = reportForm.querySelector('input[name="periodLabel"]');
  const recipientsInput = reportForm.querySelector('input[name="recipients"]');
  if (titleInput && values.title !== undefined) {
    titleInput.value = values.title;
  }
  if (typeInput && values.type !== undefined) {
    typeInput.value = values.type;
  }
  if (periodInput && values.periodLabel !== undefined) {
    periodInput.value = values.periodLabel;
  }
  if (recipientsInput && values.recipients !== undefined) {
    recipientsInput.value = values.recipients;
  }
}

async function runReportTemplate(templateId, triggerElement = null) {
  const template = REPORT_TEMPLATES.find((item) => item.id === templateId);
  const reportForm = document.getElementById("report-form");
  if (!template || !reportForm) {
    return;
  }

  if (triggerElement) {
    triggerElement.classList.add("generating");
    const desc = triggerElement.querySelector(".template-desc");
    if (desc) {
      desc.dataset.originalText = desc.textContent;
      desc.textContent = "Generating...";
    }
  }
  fillReportForm({
    title: template.title,
    type: template.type,
    periodLabel: template.type === "monthly" ? state.analytics.latestMonthLabel : state.analytics.periodInsights?.latestWeekLabel || state.analytics.latestMonthLabel,
    recipients: loadReportRecipients() || reportForm.querySelector('input[name="recipients"]')?.value || ""
  });
  await generateReportDraftFromForm({ scrollToPreview: true });
  if (triggerElement) {
    triggerElement.classList.remove("generating");
    const desc = triggerElement.querySelector(".template-desc");
    if (desc?.dataset.originalText) {
      desc.textContent = desc.dataset.originalText;
      delete desc.dataset.originalText;
    }
  }
}

function triggerReportTemplateFromQuery() {
  const reportForm = document.getElementById("report-form");
  if (!reportForm || reportForm.dataset.templateApplied === "true") {
    return;
  }

  const templateId = new URLSearchParams(window.location.search).get("template");
  if (!templateId) {
    return;
  }
  reportForm.dataset.templateApplied = "true";
  const card = document.querySelector(`[data-report-template-id="${templateId}"]`);
  runReportTemplate(templateId, card);
}

function toggleReportResendPanel(reportId) {
  document.querySelectorAll(".report-resend-panel").forEach((panel) => {
    if (panel.id === `report-resend-panel-${reportId}`) {
      panel.classList.toggle("hidden");
    } else {
      panel.classList.add("hidden");
    }
  });
}

async function resendExistingReport(reportId, button) {
  const report = state.reports.find((item) => Number(item.id) === Number(reportId));
  const input = document.getElementById(`report-resend-input-${reportId}`);
  const statusBox = document.getElementById(`report-resend-status-${reportId}`);
  if (!report || !input || !button) {
    return;
  }

  const recipients = input.value.trim();
  if (statusBox) {
    statusBox.classList.remove("hidden");
    statusBox.textContent = "Sending...";
  }
  button.disabled = true;
  button.textContent = "Sending...";
  try {
    saveReportRecipients(recipients);
    const response = await apiFetch("/api/reports/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: report.title,
        periodLabel: report.period_label || state.analytics.latestMonthLabel,
        recipients,
        summary: report.summary,
        generatedBy: report.generated_by || "manual-review",
        emailToRecipients: Boolean(recipients)
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to re-send report.");
    }
    state.reports = [
      {
        id: payload.id,
        title: report.title,
        period_label: report.period_label,
        summary: report.summary,
        recipients,
        generated_by: report.generated_by || "manual-review"
      },
      ...state.reports
    ].slice(0, 12);
    renderReportsPreview(document.getElementById("reports-list"), state.reports);
    if (statusBox) {
      statusBox.textContent = buildReportSaveStatusMessage(payload);
    }
  } catch (error) {
    if (statusBox) {
      statusBox.textContent = error.message || "Unable to re-send report.";
    }
  } finally {
    button.disabled = false;
    button.textContent = "Send Again";
  }
}

async function useHistoryReportAsTemplate(reportId) {
  const report = state.reports.find((item) => Number(item.id) === Number(reportId));
  if (!report) {
    return;
  }

  fillReportForm({
    title: report.title || buildSmartReportTitle(),
    type: /month/i.test(report.period_label || "") ? "monthly" : "weekly",
    periodLabel: report.period_label || state.analytics.latestMonthLabel,
    recipients: report.recipients || loadReportRecipients()
  });
  await generateReportDraftFromForm({ scrollToPreview: true });
}

function computePlantHealthScore(analytics) {
  let score = 100;
  const overallRate = Number(analytics?.overview?.latestRejectRate || 0);
  const criticalCount = (analytics?.productAlerts || []).filter((item) => Number(item.latestRate || 0) >= 15).length;
  const highCount = (analytics?.productAlerts || []).filter((item) => {
    const rate = Number(item.latestRate || 0);
    return rate >= 10 && rate < 15;
  }).length;
  const aboveThreshold = Number(analytics?.overview?.productsAboveThreshold || 0);

  score -= Math.min(overallRate * 6, 42);
  score -= criticalCount * 12;
  score -= highCount * 6;
  score -= Math.min(aboveThreshold * 2, 10);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getPlantHealthTone(score) {
  if (score >= 75) {
    return "--accent";
  }
  if (score >= 50) {
    return "--warning";
  }
  return "--danger";
}

function getScorecardProductStatus(rate) {
  const value = Number(rate || 0);
  if (value > 15) {
    return { label: "CRITICAL", tone: "critical" };
  }
  if (value >= 10) {
    return { label: "HIGH", tone: "high" };
  }
  return { label: "ELEVATED", tone: "elevated" };
}

function loadScorecardRecipients() {
  try {
    return localStorage.getItem(SCORECARD_RECIPIENTS_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function saveScorecardRecipients(recipients) {
  localStorage.setItem(SCORECARD_RECIPIENTS_STORAGE_KEY, recipients);
}

function buildScorecardExecutiveFallbackParagraph() {
  const topAlert = state.analytics?.productAlerts?.[0] || null;
  const topLoss = state.analytics?.topProductsByLoss?.[0] || null;
  const peakMonth = (state.analytics?.monthlyTrend || []).reduce(
    (best, item) => (!best || item.rejectRate > best.rejectRate ? item : best),
    null
  );
  if (!topAlert && !topLoss) {
    return "The current scorecard does not have enough data to frame an executive attention paragraph yet.";
  }

  return `The rejection trend requires a fast operational response before it turns into sustained loss. ${
    peakMonth ? `${peakMonth.label} remains the peak month at ${peakMonth.rejectRate}% overall reject rate. ` : ""
  }Keep daily eyes on anomalies and threshold breaches, and make the owner visible in every update for ${
    topAlert ? `${topAlert.productName}` : topLoss?.code || "the highest-risk item"
  }. This month's priority is to stabilize the baseline and reduce loss around the leading item codes.`;
}

function buildScorecardSummary(includeAiNarrative = true) {
  const score = computePlantHealthScore(state.analytics);
  const overview = state.analytics?.overview || {};
  const criticalProducts = (state.analytics.productAlerts || []).slice(0, 5);
  const topLossItems = (state.analytics.topProductsByLoss || []).slice(0, 5);
  const activePlans = (state.plans || []).filter((plan) => ["in_progress", "planned"].includes(plan.status));
  const criticalLine = criticalProducts.length
    ? criticalProducts
        .map(
          (item) =>
            `${item.code}: ${formatPctValue(item.latestRate)}% (${item.delta > 0 ? "+" : ""}${formatPctValue(item.delta)}% vs baseline)`
        )
        .join("; ")
    : "No products currently require executive attention.";
  const lossLine = topLossItems.length
    ? topLossItems
        .map((item) => `${item.code}: ${numberFormatter.format(Math.round(item.rejectQty || 0))} rejected at ${formatPctValue(item.totalRate || 0)}%`)
        .join("; ")
    : "No rejected-volume ranking available yet.";
  const plansLine = activePlans.length
    ? activePlans.map((plan) => `${plan.title} — ${plan.owner_name || "Operations Team"} — ${plan.horizon_label || "30 days"}`).join("; ")
    : "No plans yet. Every spike needs one named action.";

  return [
    `Monthly QC Scorecard — ${state.analytics.latestMonthLabel}`,
    `Plant Health Score: ${score}/100.`,
    includeAiNarrative ? `Narrative: ${state.analytics.narrative}` : "",
    `Overall Summary:\nReject rate ${formatPctValue(overview.latestRejectRate)}% across ${numberFormatter.format(Math.round(overview.totalProducedQty || 0))} produced units and ${numberFormatter.format(Math.round(overview.totalRejectQty || 0))} rejected units.`,
    `Critical Products: ${criticalLine}`,
    `Top Loss Items: ${lossLine}`,
    `Active Plans: ${plansLine}`,
    `Executive Attention: ${buildScorecardExecutiveFallbackParagraph()}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function handleScorecardEmailConfirm() {
  const recipientsInput = document.getElementById("scorecard-email-recipients");
  const includeAiCheckbox = document.getElementById("scorecard-email-include-ai");
  const subjectInput = document.getElementById("scorecard-email-subject");
  const statusBox = document.getElementById("scorecard-email-status");
  const confirmButton = document.getElementById("scorecard-email-confirm");
  if (!recipientsInput || !subjectInput || !confirmButton) {
    return;
  }

  const recipients = recipientsInput.value.trim();
  const includeAiNarrative = Boolean(includeAiCheckbox?.checked);
  const summary = buildScorecardSummary(includeAiNarrative);
  if (statusBox) {
    statusBox.classList.remove("hidden");
    statusBox.textContent = "Saving scorecard...";
  }

  confirmButton.disabled = true;
  confirmButton.textContent = "Saving...";
  try {
    saveScorecardRecipients(recipients);
    const response = await apiFetch("/api/reports/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: subjectInput.value.trim() || "Monthly QC Scorecard",
        periodLabel: state.analytics.latestMonthLabel,
        recipients,
        summary,
        generatedBy: "scorecard",
        emailToRecipients: Boolean(recipients)
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to save scorecard.");
    }

    state.reports = [
      {
        id: payload.id,
        title: subjectInput.value.trim() || "Monthly QC Scorecard",
        period_label: state.analytics.latestMonthLabel,
        summary,
        recipients,
        generated_by: "scorecard"
      },
      ...state.reports
    ].slice(0, 12);
    renderReportsPreview(document.getElementById("reports-list"), state.reports);
    if (statusBox) {
      statusBox.textContent = buildReportSaveStatusMessage(payload);
    }
    window.setTimeout(() => {
      analyticsUi.scorecardEmailOpen = false;
      renderScorecardEmailModal();
    }, 1200);
  } catch (error) {
    if (statusBox) {
      statusBox.textContent = error.message || "Unable to save scorecard.";
    }
  } finally {
    confirmButton.disabled = false;
    confirmButton.textContent = "Confirm";
  }
}

function renderScorecardHealthPanel() {
  const container = document.getElementById("scorecard-health-panel");
  if (!container) {
    return;
  }

  const score = computePlantHealthScore(state.analytics);
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (score / 100) * circumference;

  container.innerHTML = `
    <div class="scorecard-health-layout">
      <div class="scorecard-ring-wrap">
        <svg class="scorecard-ring" viewBox="0 0 140 140" role="img" aria-label="Overall quality score">
          <circle class="scorecard-ring-track" cx="70" cy="70" r="52"></circle>
          <circle
            id="scorecard-ring-progress"
            class="scorecard-ring-progress"
            cx="70"
            cy="70"
            r="52"
            data-score="${score}"
            data-circumference="${circumference}"
            data-offset="${offset}"
          ></circle>
        </svg>
        <div class="scorecard-ring-center">
          <strong>${score}</strong>
          <span>Score</span>
        </div>
      </div>
      <div class="scorecard-health-copy">
        <p class="eyebrow">HEALTH SCORE</p>
        <h2>Overall item-based performance this month</h2>
        <strong class="metric-value mono">${score}</strong>
        <p class="scorecard-narrative">${state.analytics.narrative}</p>
        <ul class="scorecard-move-list">
          ${state.human.nextThreeMoves
            .map((item) => `<li>${item.detail}</li>`)
            .join("")}
        </ul>
      </div>
    </div>
  `;

  const ring = document.getElementById("scorecard-ring-progress");
  if (ring) {
    const tone = getPlantHealthTone(score);
    ring.style.stroke = getCssVar(tone);
    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference}`;
    window.requestAnimationFrame(() => {
      ring.style.strokeDashoffset = `${offset}`;
    });
  }
}

function renderScorecardItemGrid() {
  const container = document.getElementById("scorecard-top-items");
  if (!container) {
    return;
  }

  const items = (state.analytics.productAlerts || []).slice(0, 4);
  if (!items.length) {
    container.innerHTML = `<div class="empty-state">No items are above the monthly threshold right now.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="scorecard-top-items-grid">
      ${items
        .map((item) => {
      const status = getScorecardProductStatus(item.latestRate);
      return `
        <article class="item-card scorecard-item-card">
          <div class="card-topline">
            <h2>${item.code}</h2>
            <span class="scorecard-status-badge ${status.tone}">${status.label}</span>
          </div>
          <div class="scorecard-metric-columns">
            <div>
              <span class="scorecard-metric-label">Avg Reject %</span>
              <strong class="scorecard-metric-value mono-value">${formatPctValue(item.latestRate)}%</strong>
            </div>
            <div>
              <span class="scorecard-metric-label">Rejected Qty</span>
              <strong class="scorecard-metric-value mono-value">${numberFormatter.format(Math.round(item.rejectQty || 0))}</strong>
            </div>
          </div>
          <div class="scorecard-volume-bar">
            Produced: ${numberFormatter.format(Math.round(item.producedQty || 0))} | Delta vs baseline: ${item.delta > 0 ? "+" : ""}${formatPctValue(item.delta || 0)}%
          </div>
          <p class="scorecard-insight">${item.productName || item.code} is one of the highest-risk items this month based on reject rate.</p>
        </article>
      `;
    })
    .join("")}
    </div>
  `;
}

function renderScorecardKpiTable() {
  const container = document.getElementById("scorecard-kpi-table");
  if (!container) {
    return;
  }

  const monthlyTrend = state.analytics?.monthlyTrend || [];
  if (!monthlyTrend.length) {
    container.innerHTML = `<div class="empty-state">Import rejection history to compare monthly performance.</div>`;
    return;
  }

  const recentMonths = monthlyTrend.slice(-4).reverse();
  const overallTarget = getOverallTargetPct();
  const rows = recentMonths.map((row, index) => {
    const previous = recentMonths[index + 1] || null;
    const currentRate = Number(row.rejectRate || 0);
    const previousRate = previous ? Number(previous.rejectRate || 0) : 0;
    const delta = previous ? currentRate - previousRate : null;
    const targetGap = currentRate - overallTarget;
    const status = targetGap <= 0
      ? { label: "SAFE", tone: "met" }
      : targetGap <= 1
        ? { label: "WATCH", tone: "near" }
        : { label: "ABOVE", tone: "missed" };

    return {
      month: row.label,
      rejectRate: `${formatPctValue(currentRate)}%`,
      vsLastMonth: previous
        ? `${delta > 0 ? "+" : ""}${formatPctValue(delta)}%`
        : "—",
      vsTarget: `${targetGap > 0 ? "+" : ""}${formatPctValue(targetGap)}%`,
      status
    };
  });

  container.innerHTML = `
    <div class="alert-toolbar">
      <div class="inline-grid" style="grid-template-columns:minmax(0,160px) auto;align-items:end;">
        <label>
          <span class="eyebrow">TARGET</span>
          <input
            id="scorecard-target-input"
            type="number"
            min="0"
            step="0.1"
            value="${overallTarget.toFixed(1)}"
          />
        </label>
        <button type="button" class="ghost-btn" id="scorecard-target-save">Save target</button>
      </div>
    </div>
    <table class="scorecard-kpi-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Reject Rate</th>
          <th>vs Last Month</th>
          <th>vs Target</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((row) => `
          <tr class="scorecard-target-row ${row.status.tone}">
            <td><strong>${row.month}</strong></td>
            <td class="mono">${row.rejectRate}</td>
            <td class="mono">${row.vsLastMonth}</td>
            <td class="mono ${row.vsTarget.startsWith("+") ? "tone-danger" : "tone-accent"}">${row.vsTarget}</td>
            <td><span class="scorecard-target-badge ${row.status.tone}">${row.status.label}</span></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    <p class="section-subtitle">Latest months compared against the previous month and the saved overall target.</p>
  `;

  const targetInput = document.getElementById("scorecard-target-input");
  const saveButton = document.getElementById("scorecard-target-save");
  if (targetInput && saveButton) {
    saveButton.onclick = async () => {
      const nextValue = Number(targetInput.value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      saveButton.disabled = true;
      saveButton.textContent = "Saving...";
      state.targets = {
        ...state.targets,
        overall: nextValue
      };
      persistScorecardTargets(state.targets);

      try {
        await apiFetch("/api/targets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metric: "overall",
            target_pct: nextValue
          })
        });
      } finally {
        renderScorecardKpiTable();
      }
    };
  }
}

function renderScorecardCriticalProducts() {
  const container = document.getElementById("scorecard-critical-products");
  if (!container) {
    return;
  }

  const products = (state.analytics.productAlerts || []).slice(0, 5);
  if (!products.length) {
    container.classList.add("hidden");
    container.innerHTML = "";
    return;
  }

  container.classList.remove("hidden");
  container.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">NEEDS ACTION</p>
        <h2>Items requiring a named owner</h2>
      </div>
    </div>
    <div class="scorecard-critical-grid">
      ${products
        .map((item) => {
          const status = getScorecardProductStatus(item.latestRate);
          return `
            <article class="scorecard-critical-card">
              <strong>${item.code}</strong>
              <span>${item.productName || item.code}</span>
              <span class="mono-value">${formatPctValue(item.latestRate)}%</span>
              <span class="mono ${item.delta > 0 ? "tone-danger" : "tone-accent"}">${item.delta > 0 ? "+" : ""}${formatPctValue(item.delta)}%</span>
              <span class="badge ${mapProductStatusBadgeClass(status.tone)}">${status.label}</span>
            </article>
          `;
        })
        .join("")}
    </div>
    <p class="scorecard-critical-summary">${buildScorecardExecutiveFallbackParagraph()}</p>
  `;
}

function renderScorecardActivePlans() {
  const container = document.getElementById("scorecard-active-plans");
  if (!container) {
    return;
  }

  const plans = (state.plans || []).filter((plan) => ["in_progress", "planned"].includes(plan.status));
  if (!plans.length) {
    container.innerHTML = `<div class="empty-state">No plans yet. Every spike needs one named action.</div>`;
    return;
  }

  container.innerHTML = plans
    .map(
      (plan) => `
        <article class="scorecard-plan-item">
          <span class="scorecard-plan-check">☐</span>
          <span>${plan.title} — ${plan.owner_name || "Operations Team"} — ${plan.horizon_label || "30 days"}</span>
        </article>
      `
    )
    .join("");
}

function renderScorecardEmailModal() {
  const modal = document.getElementById("scorecard-email-modal");
  if (!modal) {
    return;
  }

  const subject = `Monthly QC Scorecard — ${state.analytics.latestMonthLabel}`;
  const recipients = loadScorecardRecipients();
  modal.classList.toggle("hidden", !analyticsUi.scorecardEmailOpen);
  modal.innerHTML = `
    <div class="scorecard-email-panel">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">Email Scorecard</p>
          <h2>Save and send the monthly summary</h2>
        </div>
      </div>
      <div class="stack-form">
        <input id="scorecard-email-recipients" type="text" value="${escapeAttribute(recipients)}" placeholder="Recipients" />
        <input id="scorecard-email-subject" type="text" value="${escapeAttribute(subject)}" readonly />
        <label class="report-email-toggle">
          <input id="scorecard-email-include-ai" type="checkbox" checked />
          <span>Include AI narrative</span>
        </label>
        <div class="scorecard-email-actions">
          <button type="button" class="ghost-btn" id="scorecard-email-cancel">Cancel</button>
          <button type="button" id="scorecard-email-confirm">Confirm</button>
        </div>
        <div id="scorecard-email-status" class="inline-status hidden"></div>
      </div>
    </div>
  `;

  const cancelButton = document.getElementById("scorecard-email-cancel");
  const confirmButton = document.getElementById("scorecard-email-confirm");
  if (cancelButton) {
    cancelButton.onclick = () => {
      analyticsUi.scorecardEmailOpen = false;
      renderScorecardEmailModal();
    };
  }
  if (confirmButton) {
    confirmButton.onclick = handleScorecardEmailConfirm;
  }
}

async function ensureJsPdfLoaded() {
  if (window.jspdf?.jsPDF) {
    return;
  }

  const existing = document.querySelector('script[data-jspdf-loader="true"]');
  if (existing) {
    await new Promise((resolve, reject) => {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
    });
    return;
  }

  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    script.async = true;
    script.dataset.jspdfLoader = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load jsPDF"));
    document.head.appendChild(script);
  });
}

async function generatePdfReport(reportData) {
  const { jsPDF } = window.jspdf || {};
  if (!jsPDF) {
    console.error("jsPDF not loaded");
    return;
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let cursorY = 0;

  const C_BLACK = [15, 20, 28];
  const C_DARK = [40, 50, 65];
  const C_MUTED = [110, 125, 145];
  const C_ACCENT = [62, 207, 142];
  const C_DANGER = [240, 96, 96];
  const C_WARNING = [245, 166, 35];
  const C_LINE = [225, 230, 238];
  const C_BG_LIGHT = [248, 250, 252];

  async function loadLogoBase64() {
    try {
      const response = await fetch("/new.png");
      if (!response.ok) {
        return null;
      }
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  function drawPageHeader(logoBase64) {
    const headerH = 18;

    doc.setFillColor(...C_BG_LIGHT);
    doc.rect(0, 0, pageW, headerH, "F");

    doc.setDrawColor(...C_LINE);
    doc.setLineWidth(0.3);
    doc.line(0, headerH, pageW, headerH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C_DARK);
    doc.text("AIMAIS", margin, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C_MUTED);
    doc.text("Quality Intelligence", margin, 15.5);

    const logoW = 14;
    const logoH = 10;
    const logoX = pageW - margin - logoW - 36;
    const logoY = 3.5;

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", logoX, logoY, logoW, logoH);
      } catch {
        // Skip logo rendering when the image cannot be drawn.
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...C_DARK);
    doc.text("Production Department", pageW - margin, 9, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C_MUTED);
    doc.text(
      new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
      pageW - margin,
      14,
      { align: "right" }
    );

    cursorY = headerH + 10;
  }

  function drawPageFooter(pageNum, totalPages) {
    const footerY = pageH - 10;
    doc.setDrawColor(...C_LINE);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageW - margin, footerY - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C_MUTED);
    doc.text("Confidential — Internal use only", margin, footerY + 2);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageW - margin, footerY + 2, { align: "right" });
  }

  function addPage(logoBase64) {
    doc.addPage();
    drawPageHeader(logoBase64);
  }

  function checkPageBreak(neededH, logoBase64) {
    if (cursorY + neededH > pageH - 18) {
      addPage(logoBase64);
    }
  }

  function sectionHeading(text, logoBase64) {
    checkPageBreak(14, logoBase64);
    doc.setFillColor(...C_ACCENT);
    doc.rect(margin, cursorY, 3, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...C_BLACK);
    doc.text(text, margin + 6, cursorY + 5.5);
    cursorY += 12;
  }

  function divider() {
    doc.setDrawColor(...C_LINE);
    doc.setLineWidth(0.25);
    doc.line(margin, cursorY, pageW - margin, cursorY);
    cursorY += 5;
  }

  function kpiRow(cards, logoBase64) {
    checkPageBreak(24, logoBase64);
    const cardW = contentW / cards.length;

    cards.forEach((card, index) => {
      const x = margin + index * cardW;

      doc.setFillColor(...C_BG_LIGHT);
      doc.roundedRect(x + 1, cursorY, cardW - 2, 20, 2, 2, "F");
      doc.setDrawColor(...C_LINE);
      doc.setLineWidth(0.2);
      doc.roundedRect(x + 1, cursorY, cardW - 2, 20, 2, 2, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C_MUTED);
      doc.text(card.label, x + cardW / 2, cursorY + 6, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...(card.color || C_BLACK));
      doc.text(String(card.value), x + cardW / 2, cursorY + 14, { align: "center" });
    });

    cursorY += 26;
  }

  function drawTable(headers, rows, colWidths, logoBase64) {
    const rowH = 8;
    const headerH = 9;

    doc.setFillColor(...C_DARK);
    doc.rect(margin, cursorY, contentW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    let x = margin;
    headers.forEach((header, index) => {
      doc.text(header, x + 3, cursorY + 6);
      x += colWidths[index];
    });
    cursorY += headerH;

    rows.forEach((row, rowIdx) => {
      checkPageBreak(rowH + 2, logoBase64);

      if (rowIdx % 2 === 0) {
        doc.setFillColor(...C_BG_LIGHT);
        doc.rect(margin, cursorY, contentW, rowH, "F");
      }

      doc.setDrawColor(...C_LINE);
      doc.setLineWidth(0.15);
      doc.line(margin, cursorY + rowH, pageW - margin, cursorY + rowH);

      x = margin;
      row.forEach((cell, colIdx) => {
        const cellStr = String(cell?.value ?? cell ?? "");
        const color = cell?.color || C_DARK;
        const isBold = cell?.bold || false;

        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...color);

        const maxChars = Math.floor(colWidths[colIdx] / 1.8);
        const display = cellStr.length > maxChars
          ? `${cellStr.slice(0, maxChars - 1)}…`
          : cellStr;

        doc.text(display, x + 3, cursorY + 5.5);
        x += colWidths[colIdx];
      });

      cursorY += rowH;
    });

    cursorY += 6;
  }

  function narrativeBlock(text, logoBase64) {
    if (!text) {
      return;
    }

    checkPageBreak(20, logoBase64);
    doc.setFillColor(240, 255, 248);
    doc.setDrawColor(...C_ACCENT);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cursorY, contentW, 14, 2, 2, "FD");

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...C_DARK);

    const lines = doc.splitTextToSize(text, contentW - 8);
    lines.slice(0, 3).forEach((line, index) => {
      doc.text(line, margin + 4, cursorY + 5 + index * 4);
    });

    cursorY += 18;
  }

  const logoBase64 = await loadLogoBase64();
  const analytics = state.analytics || {};
  const overview = analytics.overview || {};
  const alerts = analytics.productAlerts || [];
  const topLoss = analytics.topProductsByLoss || [];
  const monthly = analytics.monthlyTrend || [];
  const report = reportData || {};
  const alertRowsForPdf = alerts.slice(0, 8);
  const topLossRowsForPdf = topLoss.slice(0, 6);

  drawPageHeader(logoBase64);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C_BLACK);
  doc.text(report.title || "Quality Control Report", margin, cursorY);
  cursorY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C_MUTED);
  doc.text(
    `Period: ${report.period || analytics.latestMonthLabel || "—"}   |   Generated: ${new Date().toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })}   |   Recipients: ${report.recipients || "—"}`,
    margin,
    cursorY
  );
  cursorY += 4;

  doc.setFillColor(...C_ACCENT);
  doc.rect(margin, cursorY, contentW, 1, "F");
  cursorY += 8;

  kpiRow([
    {
      label: "TOTAL PRODUCED",
      value: Number(overview.totalProducedQty || 0).toLocaleString("en-US"),
      color: C_DARK
    },
    {
      label: "TOTAL REJECTED",
      value: Number(overview.totalRejectQty || 0).toLocaleString("en-US"),
      color: C_DANGER
    },
    {
      label: "OVERALL REJECT RATE",
      value: `${overview.latestRejectRate || 0}%`,
      color: C_WARNING
    },
    {
      label: "ITEMS ABOVE 5%",
      value: String(overview.productsAboveThreshold || 0),
      color: overview.productsAboveThreshold > 0 ? C_DANGER : C_ACCENT
    }
  ], logoBase64);

  narrativeBlock(report.summary || analytics.narrative || "", logoBase64);

  if (monthly.length) {
    sectionHeading("Monthly Reject Rate Trend", logoBase64);
    drawTable(
      ["Month", "Reject Rate", "vs Threshold (5%)"],
      monthly.map((month) => [
        { value: month.label, bold: true },
        {
          value: `${month.rejectRate}%`,
          color: month.rejectRate >= 5 ? C_DANGER : month.rejectRate >= 2 ? C_WARNING : C_ACCENT,
          bold: true
        },
        {
          value: month.rejectRate >= 5
            ? `+${(month.rejectRate - 5).toFixed(2)}% above`
            : `${(5 - month.rejectRate).toFixed(2)}% below`,
          color: month.rejectRate >= 5 ? C_DANGER : C_ACCENT
        }
      ]),
      [80, 50, 48],
      logoBase64
    );
  }

  addPage(logoBase64);

  if (alerts.length) {
    sectionHeading(`Items Above 5% Threshold (${alerts.length} items)`, logoBase64);
    drawTable(
      ["Item Code", "Reject %", "vs Baseline", "Rejected Qty", "Produced Qty", "Status"],
      alertRowsForPdf.map((alert) => [
        { value: alert.code || alert.productName, bold: true },
        {
          value: `${alert.latestRate}%`,
          color: alert.latestRate >= 15 ? C_DANGER : alert.latestRate >= 10 ? C_WARNING : [91, 156, 246],
          bold: true
        },
        {
          value: `${alert.delta >= 0 ? "+" : ""}${alert.delta}%`,
          color: alert.delta > 0 ? C_DANGER : C_ACCENT
        },
        { value: Number(alert.rejectQty || 0).toLocaleString("en-US") },
        {
          value: alert.producedQty > 0
            ? Number(alert.producedQty).toLocaleString("en-US")
            : "—"
        },
        {
          value: alert.latestRate >= 15 ? "CRITICAL" : alert.latestRate >= 10 ? "HIGH" : "ELEVATED",
          color: alert.latestRate >= 15 ? C_DANGER : alert.latestRate >= 10 ? C_WARNING : [91, 156, 246],
          bold: true
        }
      ]),
      [38, 24, 26, 30, 30, 30],
      logoBase64
    );
  }

  divider();

  if (topLoss.length) {
    sectionHeading("Top Items by Rejected Quantity", logoBase64);
    drawTable(
      ["Item Code", "Avg Reject %", "Total Rejected", "Total Produced"],
      topLossRowsForPdf.map((item, index) => [
        { value: `${index + 1}. ${item.code || item.productName}`, bold: true },
        {
          value: `${item.totalRate}%`,
          color: item.totalRate >= 5 ? C_DANGER : item.totalRate >= 2 ? C_WARNING : C_DARK
        },
        { value: Number(item.rejectQty || 0).toLocaleString("en-US") },
        {
          value: item.producedQty > 0
            ? Number(item.producedQty).toLocaleString("en-US")
            : "—"
        }
      ]),
      [55, 35, 40, 48],
      logoBase64
    );
  }

  checkPageBreak(30, logoBase64);
  divider();
  sectionHeading("Recommendations", logoBase64);

  const recommendations = [
    alerts.length > 0
      ? `Review ${alerts[0].code} immediately — reject rate at ${alerts[0].latestRate}%, ${alerts[0].delta >= 0 ? "+" : ""}${alerts[0].delta}% vs baseline.`
      : "No items above threshold — maintain current controls.",
    topLoss.length > 0
      ? `Address ${topLoss[0].code} for volume impact — ${Number(topLoss[0].rejectQty).toLocaleString("en-US")} units rejected in total.`
      : null,
    "Ensure daily monitoring of items trending above 3%.",
    "Document corrective actions with named owners and dates."
  ].filter(Boolean);

  recommendations.forEach((recommendation, index) => {
    checkPageBreak(10, logoBase64);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...C_ACCENT);
    doc.text(`${index + 1}.`, margin, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C_DARK);
    const lines = doc.splitTextToSize(recommendation, contentW - 8);
    lines.forEach((line, lineIndex) => {
      doc.text(line, margin + 6, cursorY + lineIndex * 4.5);
    });
    cursorY += lines.length * 4.5 + 4;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawPageFooter(page, totalPages);
  }

  const period = String(report.period || analytics.latestMonthLabel || "report").replace(/\s+/g, "-");
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`AIMAIS-Report-${period}-${dateStr}.pdf`);
}

function renderReportDraftPreview() {
  const panel = document.getElementById("report-preview-panel");
  const textarea = document.getElementById("report-preview-text");
  const emailToggle = document.getElementById("report-email-toggle");
  const saveStatus = document.getElementById("report-save-status");
  if (!panel || !textarea) {
    return;
  }

  if (!canManageReports()) {
    panel.classList.add("hidden");
    if (saveStatus) {
      saveStatus.classList.add("hidden");
      saveStatus.textContent = "";
    }
    return;
  }

  const hasDraft = Boolean(analyticsUi.reportDraft?.summary);
  panel.classList.toggle("hidden", !hasDraft);
  if (!hasDraft) {
    textarea.value = "";
    return;
  }

  textarea.value = analyticsUi.reportDraft.summary;
  if (emailToggle) {
    emailToggle.checked = Boolean(analyticsUi.reportDraft?.recipients);
    emailToggle.disabled = !analyticsUi.reportDraft?.recipients;
  }
  if (saveStatus) {
    saveStatus.classList.add("hidden");
    saveStatus.textContent = "";
  }
}

function buildReportSaveStatusMessage(payload) {
  const recipients = payload?.recipients || "";
  const emailRequested = Boolean(payload?.emailRequested);
  const emailResult = payload?.emailResult;

  if (emailRequested && emailResult?.ok) {
    return `Saved and sent to ${recipients}`;
  }

  if (emailRequested && emailResult?.error === "RESEND_API_KEY not configured") {
    return "Saved — add RESEND_API_KEY to enable email";
  }

  if (emailRequested) {
    return `Saved — email not sent: ${emailResult?.error || "Unknown email error"}`;
  }

  return "Saved";
}

function showInlineMessage(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  const existing = container.querySelector("[data-inline-flash]");
  if (existing) {
    existing.remove();
  }

  const flash = document.createElement("div");
  flash.className = "inline-status";
  flash.dataset.inlineFlash = "true";
  flash.textContent = message;
  container.prepend(flash);

  window.setTimeout(() => {
    flash.remove();
  }, 1800);
}

function mapPriority(priority) {
  if (priority === "high") return "HIGH";
  if (priority === "low") return "LOW";
  return "MEDIUM";
}

function mapPriorityBadgeClass(priority) {
  if (priority === "high") return "badge-critical";
  if (priority === "low") return "badge-muted";
  return "badge-high";
}

function mapStatus(status) {
  if (status === "in_progress") return "In Progress";
  if (status === "blocked") return "Blocked";
  if (status === "done") return "Done";
  return "New";
}

function extractFirstSuggestedTask(content) {
  const lines = String(content)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(diagnosis|actions|executive alert)\s*:?\s*$/i.test(line))
    .map((line) => line.replace(/^[-*•]\s*/, ""))
    .filter((line) => line.length > 12);

  return lines[0] || "Review the highest current reject signal, assign one owner, and confirm the first containment check for this shift.";
}

function mapPlanStatus(status) {
  if (status === "in_progress") return "IN PROGRESS";
  if (status === "completed") return "COMPLETED";
  if (status === "on_hold") return "ON HOLD";
  if (status === "cancelled") return "CANCELLED";
  return "PLANNED";
}

function mapPlanBadgeClass(status) {
  if (status === "in_progress") return "badge-normal";
  if (status === "completed") return "badge-muted";
  if (status === "on_hold") return "badge-high";
  if (status === "cancelled") return "badge-critical";
  return "badge-elevated";
}

function mapProductStatusBadgeClass(tone) {
  if (tone === "critical") return "badge-critical";
  if (tone === "high") return "badge-high";
  if (tone === "elevated") return "badge-elevated";
  return "badge-muted";
}

function mapPlanTone(status) {
  if (status === "in_progress") return "accent";
  if (status === "on_hold") return "warning";
  if (status === "cancelled") return "danger";
  return "";
}

function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const encoded = result.includes(",") ? result.split(",").pop() : result;
      resolve(encoded);
    };
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function hydrateCopilotFromQuery() {
  const aiForm = document.getElementById("ai-form");
  if (!aiForm) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const type = params.get("type");
  const prompt = params.get("prompt");
  if (!type && !prompt) {
    return;
  }

  const typeSelect = aiForm.querySelector('select[name="type"]');
  const promptBox = aiForm.querySelector('textarea[name="prompt"]');
  const allowedTypes = getAllowedCopilotTypes();
  const safeType = allowedTypes && type && !allowedTypes.includes(type) ? allowedTypes[0] : type;
  if (safeType && typeSelect) {
    typeSelect.value = safeType;
  }
  if (prompt && promptBox) {
    promptBox.value = prompt;
  }
  runAi({ type: safeType || "analysis", prompt: prompt || "" });
}
