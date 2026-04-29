(function () {
  "use strict";

  function text(value) {
    return window.BrightAIDemoApiClient?.sanitizeForDisplay(value) || String(value || "");
  }

  function createElement(tagName, options) {
    const node = document.createElement(tagName);
    const config = options || {};
    if (config.className) node.className = config.className;
    if (config.text !== undefined) node.textContent = text(config.text);
    if (config.attrs) {
      Object.keys(config.attrs).forEach(key => {
        const value = config.attrs[key];
        if (value !== false && value !== null && value !== undefined) node.setAttribute(key, String(value));
      });
    }
    (config.children || []).forEach(child => {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function clearNode(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
  }

  function renderList(items, className) {
    const list = createElement("ul", { className: className || "bai-demo-list" });
    (Array.isArray(items) ? items : []).filter(Boolean).forEach(item => {
      list.appendChild(createElement("li", { text: item }));
    });
    if (!list.children.length) {
      list.appendChild(createElement("li", { text: "لا توجد عناصر كافية بعد." }));
    }
    return list;
  }

  function renderKeyValue(label, value) {
    return createElement("div", {
      className: "bai-demo-kv",
      children: [
        createElement("span", { text: label }),
        createElement("strong", { text: value })
      ]
    });
  }

  function renderResult(panel, result) {
    clearNode(panel);
    const data = result || {};
    const body = data.result || data.report || data;
    const article = createElement("article", {
      className: "bai-demo-report",
      attrs: { tabindex: "-1", role: "region", "aria-label": "نتيجة الديمو" }
    });
    article.appendChild(createElement("header", {
      className: "bai-demo-report__header",
      children: [
        createElement("p", { className: "bai-demo-eyebrow", text: data.mode === "mock" ? "وضع توضيحي" : "تحليل مباشر" }),
        createElement("h2", { text: body.title || data.title || "نتيجة التحليل" })
      ]
    }));
    article.appendChild(createElement("p", {
      className: "bai-demo-summary",
      text: body.summary || body.executiveSummary || "تم توليد النتيجة بنجاح."
    }));
    if (data.confidence !== undefined) {
      article.appendChild(renderKeyValue("مستوى الثقة", window.BrightAIDemoApiClient?.bucketConfidence(data.confidence) || "medium"));
    }
    article.appendChild(renderList(body.recommendations || body.recommendedActions || body.keyInsights, "bai-demo-list"));
    panel.appendChild(article);
    article.focus({ preventScroll: true });
  }

  function renderError(panel, error) {
    clearNode(panel);
    panel.appendChild(createElement("div", {
      className: "bai-demo-alert",
      attrs: { role: "alert" },
      children: [
        createElement("strong", { text: "تعذر تشغيل التجربة" }),
        createElement("p", { text: error?.message || "حدث خطأ غير متوقع." })
      ]
    }));
  }

  function setLoading(root, isLoading) {
    const loading = root.querySelector("[data-demo-loading]");
    const submit = root.querySelector("[data-demo-submit]");
    if (loading) loading.hidden = !isLoading;
    if (submit) {
      submit.disabled = Boolean(isLoading);
      submit.setAttribute("aria-busy", isLoading ? "true" : "false");
    }
  }

  function bindForm(root, handler) {
    const form = root.querySelector("[data-demo-form]");
    if (!form || typeof handler !== "function") return null;
    form.addEventListener("submit", event => {
      event.preventDefault();
      handler(new FormData(form), form);
    });
    return form;
  }

  window.BrightAIDemoUIKit = Object.freeze({
    createElement,
    clearNode,
    renderList,
    renderKeyValue,
    renderResult,
    renderError,
    setLoading,
    bindForm
  });
})();
