(function () {
  const bridge = () => window.MaisOBMBridge;
  const thread = document.getElementById("aiChatThread");
  const form = document.getElementById("aiChatForm");
  const input = document.getElementById("aiChatInput");
  const sendButton = document.getElementById("aiSendButton");
  const refreshButton = document.getElementById("aiRefreshContextButton");
  const livePill = document.getElementById("aiStudioLivePill");
  const contextMeta = document.getElementById("aiContextMeta");
  const briefMetrics = document.getElementById("aiBriefMetrics");
  const focusList = document.getElementById("aiFocusList");
  const statusTone = document.getElementById("aiStudioStatusTone");
  const statusLine = document.getElementById("aiStudioStatusLine");
  const thinkingSteps = Array.from(document.querySelectorAll("#aiThinkingStack .ai-thinking-step"));
  const chatMeta = document.getElementById("aiChatMeta");
  const quickButtons = Array.from(document.querySelectorAll("[data-ai-prompt]"));
  const geminiButtons = Array.from(document.querySelectorAll("[data-gemini-mode]"));
  const geminiMeta = document.getElementById("aiGeminiMeta");
  const geminiKeyInput = document.getElementById("aiKey");

  let currentContext = null;
  let pendingTimer = null;

  function formatNumber(value, decimals = 0) {
    return Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function scrollThreadToEnd() {
    if (thread) {
      thread.scrollTop = thread.scrollHeight;
    }
  }

  function setPillState(mode, text) {
    if (!livePill) {
      return;
    }

    livePill.className = `ai-live-pill ${mode}`;
    livePill.textContent = text;
  }

  function setStudioStatus(tone, line) {
    if (statusTone) {
      statusTone.textContent = tone;
    }

    if (statusLine) {
      statusLine.textContent = line;
    }
  }

  function resetThinkingSteps() {
    thinkingSteps.forEach((step) => {
      step.dataset.state = "idle";
    });
  }

  function setThinkingProgress(activeIndex) {
    thinkingSteps.forEach((step, index) => {
      if (index < activeIndex) {
        step.dataset.state = "done";
        return;
      }

      if (index === activeIndex) {
        step.dataset.state = "active";
        return;
      }

      step.dataset.state = "idle";
    });
  }

  function renderBriefMetrics(context) {
    if (!briefMetrics) {
      return;
    }

    const latest = context?.recentWindow?.summary;
    const current = context?.summary;
    const previous = context?.priorWindow?.summary;
    const trend = context?.trendDirection;
    const topCat = context?.categoryBreakdown?.[0];

    const trendLabel = trend === "worsening" ? "↑ Worsening"
      : trend === "improving" ? "↓ Improving"
      : trend === "stable" ? "→ Stable"
      : "—";

    const cards = [
      {
        label: "Active View Rate",
        value: current ? `${formatNumber(current.avgRate, 2)}%` : "0.00%"
      },
      {
        label: "Trend Direction",
        value: trendLabel
      },
      {
        label: "Latest 10 Days Rate",
        value: latest ? `${formatNumber(latest.avgRate, 2)}%` : "—"
      },
      {
        label: "Critical Rows",
        value: current ? formatNumber(current.criticalCount) : "0"
      },
      {
        label: "Top Category",
        value: topCat ? `${topCat.category}` : "—"
      },
      {
        label: "Prior Period Rate",
        value: previous ? `${formatNumber(previous.avgRate, 2)}%` : "—"
      }
    ];

    briefMetrics.innerHTML = cards.map((card) => `
      <article class="ai-brief-metric">
        <span class="ai-brief-metric-label">${card.label}</span>
        <div class="ai-brief-metric-value">${card.value}</div>
      </article>
    `).join("");
  }

  function renderFocusList(context) {
    if (!focusList) {
      return;
    }

    if (!context?.hasData || !context?.summary) {
      focusList.innerHTML = `
        <li>
          <strong>Dataset status</strong>
          <span>No active mapped data is available yet.</span>
        </li>
      `;
      return;
    }

    const latest = context.recentWindow?.summary;
    const previous = context.priorWindow?.summary;
    const current = context.summary;
    const delta = latest && previous
      ? latest.avgRate - previous.avgRate
      : null;
    const top5Sev = context.top5BySeverity || [];
    const cats = context.categoryBreakdown || [];
    const trend = context.trendDirection;

    const trendText = trend === "worsening" ? "trending upward — needs attention"
      : trend === "improving" ? "trending downward — positive movement"
      : trend === "stable" ? "holding steady — no major shifts"
      : "insufficient data points for trend detection";

    const sevListText = top5Sev.length
      ? top5Sev.slice(0, 3).map((p) => `${p.code} (${formatNumber(p.rejectRate, 2)}%)`).join(", ")
      : "No severity data";

    const catText = cats.length
      ? `${cats[0].category} leads with ${formatNumber(cats[0].rejected)} rejects (${formatNumber(cats[0].rejectRate, 2)}%).`
      : "No category breakdown available.";

    focusList.innerHTML = `
      <li>
        <strong>Active focus</strong>
        <span>${context.focusSummary}</span>
      </li>
      <li>
        <strong>Rejection trend</strong>
        <span>Rates are ${trendText}.</span>
      </li>
      <li>
        <strong>Top severity products</strong>
        <span>${sevListText}</span>
      </li>
      <li>
        <strong>Leading category</strong>
        <span>${catText}</span>
      </li>
      <li>
        <strong>Latest vs prior 10 days</strong>
        <span>${delta === null ? "Previous 10-day block is not available yet." : `Reject rate moved by ${formatNumber(Math.abs(delta), 2)} points ${delta >= 0 ? "higher" : "lower"} in the latest window.`}</span>
      </li>
    `;
  }

  function renderContext(context) {
    currentContext = context;

    if (geminiMeta) {
      geminiMeta.textContent = context?.hasData
        ? `Ready on ${formatNumber(context.viewCount)} visible rows from the current active dataset`
        : "Ready when a valid local dataset is loaded";
    }

    if (!context?.hasData) {
      setPillState("error", "Waiting for data");
      if (contextMeta) {
        contextMeta.textContent = "Load embedded data or a mapped CSV file to activate AI tools";
      }
      if (chatMeta) {
        chatMeta.textContent = "AI chat is waiting for the local dataset";
      }
      renderBriefMetrics(context);
      renderFocusList(context);
      setStudioStatus("Idle", "The assistant is waiting for the local dataset to be loaded.");
      resetThinkingSteps();
      return;
    }

    const current = context.summary;
    const dateRange = current
      ? `${current.startDate} to ${current.endDate}`
      : "Live data active";

    setPillState("ready", "AI ready on live data");
    if (contextMeta) {
      contextMeta.textContent = `${dateRange} • ${formatNumber(context.viewCount)} visible rows • ${formatNumber(context.rawCount)} loaded rows`;
    }
    if (chatMeta) {
      chatMeta.textContent = `Grounded on live rows, recent 10-day window, and current filtered view`;
    }

    renderBriefMetrics(context);
    renderFocusList(context);
    setStudioStatus("Ready", "The assistant is connected to the live rejection dataset and can answer grounded questions now.");
    resetThinkingSteps();
  }

  function addMessage(role, html, metaText = "") {
    if (!thread) {
      return null;
    }

    const node = document.createElement("article");
    node.className = `ai-message ai-message-${role}`;
    node.innerHTML = `
      <div class="ai-message-role">${role === "user" ? "You" : "AI Analyst"}</div>
      <div class="ai-message-body">${html}</div>
      ${metaText ? `<div class="ai-message-meta">${metaText}</div>` : ""}
    `;
    thread.appendChild(node);
    scrollThreadToEnd();
    return node;
  }

  function addPendingAssistant() {
    const node = addMessage(
      "assistant",
      "<p>Analyzing live data now...</p><p>Thinking through rejection signals...</p><p>Preparing grounded answer...</p>",
      "Working on the current dataset"
    );
    node?.classList.add("ai-message-pending");
    return node;
  }

  function runThinkingSequence(node) {
    const lines = [
      "Analyzing live data now...",
      "Thinking through rejection signals...",
      "Preparing grounded answer..."
    ];
    let stepIndex = 0;

    resetThinkingSteps();
    setThinkingProgress(0);
    setPillState("busy", "AI analyzing now");
    setStudioStatus("Analyzing", "The assistant is reading the live rows, latest 10 days, and active filtered view.");

    const tick = () => {
      const body = node?.querySelector(".ai-message-body");
      if (body) {
        body.innerHTML = lines.map((line, index) => `<p>${index <= stepIndex ? line : ""}</p>`).join("");
      }

      setThinkingProgress(Math.min(stepIndex, thinkingSteps.length - 1));
      stepIndex += 1;

      if (stepIndex < lines.length) {
        pendingTimer = window.setTimeout(tick, 850);
      }
    };

    tick();
  }

  function stopThinkingSequence() {
    if (pendingTimer) {
      window.clearTimeout(pendingTimer);
      pendingTimer = null;
    }
  }

  function renderAnswer(result) {
    const bullets = Array.isArray(result?.bullets) ? result.bullets : [];
    const bulletHtml = bullets.length
      ? `<ul>${bullets.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : "";
    const modeText = result?.mode === "success"
      ? `AI response via ${result.provider}`
      : "Local numeric fallback";

    return {
      html: `<p>${result?.answer || "No grounded answer was returned."}</p>${bulletHtml}`,
      meta: modeText
    };
  }

  async function submitQuestion(question) {
    const trimmed = String(question || "").trim();

    if (!trimmed || !bridge() || sendButton.disabled) {
      return;
    }

    addMessage("user", `<p>${trimmed}</p>`);

    const pendingNode = addPendingAssistant();
    runThinkingSequence(pendingNode);
    sendButton.disabled = true;
    input.disabled = true;

    try {
      const result = await bridge().askQuestion(trimmed);
      stopThinkingSequence();
      setThinkingProgress(thinkingSteps.length);

      if (pendingNode) {
        const rendered = renderAnswer(result);
        pendingNode.classList.remove("ai-message-pending");
        pendingNode.querySelector(".ai-message-body").innerHTML = rendered.html;
        const metaNode = pendingNode.querySelector(".ai-message-meta");
        if (metaNode) {
          metaNode.textContent = rendered.meta;
        }
      }

      setPillState(result?.mode === "success" ? "ready" : "error", result?.mode === "success" ? "AI answer ready" : "Fallback answer ready");
      setStudioStatus(result?.mode === "success" ? "Ready" : "Fallback", result?.mode === "success"
        ? "The assistant completed a grounded answer from the live dataset."
        : "The AI route was unavailable, so a local number-based answer was returned.");
    } catch (_error) {
      stopThinkingSequence();
      if (pendingNode) {
        pendingNode.querySelector(".ai-message-body").innerHTML = `
          <p>I could not complete the AI request.</p>
          <p>Try again after the live dataset is fully loaded.</p>
        `;
        const metaNode = pendingNode.querySelector(".ai-message-meta");
        if (metaNode) {
          metaNode.textContent = "AI request failed";
        }
      }
      setPillState("error", "AI request failed");
      setStudioStatus("Error", "The AI route failed for this request. Try again or refresh the live context.");
      resetThinkingSteps();
    } finally {
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
      scrollThreadToEnd();
    }
  }

  function boot() {
    if (!form || !input || !thread) {
      return;
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const question = input.value;
      input.value = "";
      submitQuestion(question);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) {
        return;
      }

      event.preventDefault();
      form.requestSubmit();
    });

    quickButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const prompt = button.dataset.aiPrompt || "";
        input.value = prompt;
        submitQuestion(prompt);
      });
    });

    geminiButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const mode = button.dataset.geminiMode || "summary";
        const originalLabel = button.textContent;
        button.disabled = true;
        button.textContent = "Running...";

        try {
          await bridge()?.askAI?.(mode);
        } finally {
          button.disabled = false;
          button.textContent = originalLabel;
        }
      });
    });

    if (geminiKeyInput && !geminiKeyInput.value) {
      geminiKeyInput.value = window.localStorage.getItem("gemini_key") || "";
    }

    refreshButton?.addEventListener("click", () => {
      const snapshot = bridge()?.refreshContext?.();
      renderContext(snapshot);
      addMessage("assistant", "<p>The live AI context has been refreshed from the current dashboard state.</p>", "Context updated");
    });

    window.addEventListener("mais-obm:data-updated", (event) => {
      renderContext(event.detail);
    });

    const initial = bridge()?.refreshContext?.();
    renderContext(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
