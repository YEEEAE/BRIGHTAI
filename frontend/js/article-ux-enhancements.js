(function () {
  if (window.BrightUXEnhancer) return;

  let normalizePathname = function fallbackNormalize(pathname) {
    if (!pathname || pathname === "/") return "/";
    return pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  };

  function ensureUxEnhancementStyles() {
    if (document.getElementById("bright-ux-enhancement-style")) return;
    const style = document.createElement("style");
    style.id = "bright-ux-enhancement-style";
    style.textContent = `
      html { font-size: calc(16px * var(--bright-font-scale, 1)); }
      .bright-access-controls { position: fixed; left: 1rem; bottom: 4.3rem; z-index: 62; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem; border-radius: 0.85rem; border: 1px solid rgba(255,255,255,.16); background: rgba(2,6,23,.9); backdrop-filter: blur(6px); }
      .bright-access-btn { border: 1px solid rgba(255,255,255,.18); border-radius: 0.55rem; background: rgba(255,255,255,.08); color: #e2e8f0; font-size: .74rem; line-height: 1; min-width: 34px; height: 32px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
      .bright-access-btn:hover { background: rgba(99,102,241,.25); border-color: rgba(99,102,241,.55); color: #fff; }
      html.bright-light-mode body { background: #f8fafc !important; color: #0f172a !important; }
      html.bright-light-mode .unified-nav { background: rgba(255,255,255,.9) !important; border-bottom-color: rgba(15,23,42,.15) !important; }
      html.bright-light-mode .unified-nav .nav-link, html.bright-light-mode .unified-nav .mobile-search-btn, html.bright-light-mode .unified-nav .search-trigger { color: #0f172a !important; }
      html.bright-light-mode .glass-card, html.bright-light-mode .doc-content section, html.bright-light-mode article { background: rgba(255,255,255,.9) !important; color: #0f172a !important; border-color: rgba(15,23,42,.15) !important; }
      html.bright-light-mode .bright-article-toc, html.bright-light-mode .bright-article-sidebar, html.bright-light-mode .bright-related { background: rgba(255,255,255,.95) !important; border-color: rgba(15,23,42,.2) !important; }
      html.bright-light-mode .bright-share-btn, html.bright-light-mode .bright-back-top, html.bright-light-mode .bright-access-controls { background: rgba(255,255,255,.95) !important; color: #0f172a !important; border-color: rgba(15,23,42,.2) !important; }
      html.bright-light-mode .bright-chat-panel { background: #f8fafc !important; border-color: rgba(15,23,42,.18) !important; }
      html.bright-light-mode .bright-chat-msg.user { background: #cbd5e1 !important; color: #0f172a !important; }
      html.bright-light-mode .bright-chat-msg.bot { background: #e2e8f0 !important; color: #0f172a !important; border-color: rgba(15,23,42,.18) !important; }
      html.bright-light-mode .bright-chat-input { background: #fff !important; border-top-color: rgba(15,23,42,.15) !important; }
      html.bright-light-mode .bright-chat-input input { background: #fff !important; color: #0f172a !important; border-color: rgba(15,23,42,.2) !important; }
      .bright-skip-link { position: fixed; top: -120px; right: 1rem; z-index: 1200; background: #0f172a; color: #fff; border: 1px solid rgba(255,255,255,.25); border-radius: .75rem; padding: .6rem .9rem; font-weight: 700; text-decoration: none; transition: top .2s ease; }
      .bright-skip-link:focus, .bright-skip-link:focus-visible { top: .75rem; outline: 2px solid #38bdf8; outline-offset: 2px; }
      *:focus-visible { outline: 2px solid rgba(56,189,248,.95); outline-offset: 2px; border-radius: .35rem; }
      .bright-reading-progress { position: fixed; top: 0; left: 0; width: 0%; height: 3px; z-index: 1100; background: linear-gradient(90deg,#22d3ee,#6366f1,#8b5cf6); transition: width 120ms linear; }
      .bright-share-controls { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .9rem; }
      .bright-share-btn { display: inline-flex; align-items: center; gap: .35rem; padding: .45rem .75rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.2); background: rgba(15,23,42,.7); color: #cbd5e1; text-decoration: none; font-size: .82rem; cursor: pointer; transition: .2s ease; }
      .bright-share-btn:hover { color: #fff; border-color: rgba(99,102,241,.7); background: rgba(99,102,241,.12); }
      .bright-article-toc { margin: 1rem 0 1.5rem; padding: 1rem; border-radius: .9rem; border: 1px solid rgba(255,255,255,.12); background: rgba(15,23,42,.55); }
      .bright-article-toc h2 { margin: 0 0 .8rem; font-size: 1rem; color: #fff; }
      .bright-article-toc ul { margin: 0; padding-inline-start: 1rem; list-style: none; display: grid; gap: .45rem; }
      .bright-article-toc a { color: #cbd5e1; text-decoration: none; font-size: .9rem; }
      .bright-article-toc a:hover { color: #22d3ee; }
      .bright-article-sidebar { position: fixed; top: 108px; left: 1.2rem; width: 260px; max-height: calc(100vh - 140px); overflow: auto; padding: .95rem; border-radius: .9rem; border: 1px solid rgba(255,255,255,.14); background: rgba(2,6,23,.9); backdrop-filter: blur(8px); z-index: 45; }
      .bright-article-sidebar .bright-article-toc { margin: 0; padding: 0; border: 0; background: transparent; }
      .bright-article-sidebar .bright-article-toc h2 { font-size: .95rem; margin-bottom: .7rem; }
      .bright-related { margin-top: 2rem; padding: 1.2rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,.12); background: rgba(15,23,42,.5); }
      .bright-related h2 { margin: 0 0 .9rem; color: #fff; font-size: 1.12rem; }
      .bright-related-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: .7rem; }
      .bright-related-card { display: block; padding: .75rem; border-radius: .75rem; border: 1px solid rgba(255,255,255,.1); text-decoration: none; color: #cbd5e1; background: rgba(255,255,255,.03); transition: .2s ease; }
      .bright-related-card:hover { color: #fff; border-color: rgba(34,211,238,.55); transform: translateY(-1px); }
      .bright-related-card span { display: block; margin-top: .35rem; color: #94a3b8; font-size: .8rem; }
      .bright-back-top { position: fixed; left: 1rem; bottom: 1rem; width: 42px; height: 42px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; background: rgba(15,23,42,.9); color: #fff; display: inline-flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: .2s ease; z-index: 50; }
      .bright-back-top.show { opacity: 1; pointer-events: auto; }
      .bright-chat-fab { position: fixed; right: 1rem; bottom: 1rem; width: 56px; height: 56px; border: 0; border-radius: 1rem; color: #fff; background: linear-gradient(135deg,#0ea5e9,#6366f1); box-shadow: 0 10px 28px rgba(99,102,241,.35); cursor: pointer; z-index: 60; display: inline-flex; align-items: center; justify-content: center; }
      .bright-chat-panel { position: fixed; right: 1rem; bottom: 4.9rem; width: min(92vw,360px); height: 470px; border-radius: 1rem; border: 1px solid rgba(255,255,255,.12); background: #0b1120; overflow: hidden; z-index: 61; display: none; flex-direction: column; box-shadow: 0 20px 40px rgba(0,0,0,.45); }
      .bright-chat-panel.open { display: flex; }
      .bright-chat-head { padding: .8rem; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; justify-content: space-between; align-items: center; color: #e2e8f0; background: linear-gradient(90deg,rgba(14,165,233,.24),rgba(99,102,241,.2)); }
      .bright-chat-messages { flex: 1; overflow: auto; padding: .8rem; display: grid; gap: .55rem; }
      .bright-chat-msg { max-width: 88%; padding: .5rem .65rem; border-radius: .65rem; font-size: .85rem; line-height: 1.5; color: #e2e8f0; }
      .bright-chat-msg.user { justify-self: end; background: #334155; }
      .bright-chat-msg.bot { justify-self: start; background: #1e293b; border: 1px solid rgba(255,255,255,.1); }
      .bright-chat-input { display: flex; gap: .5rem; padding: .65rem; border-top: 1px solid rgba(255,255,255,.08); background: rgba(15,23,42,.95); }
      .bright-chat-input input { flex: 1; border: 1px solid rgba(255,255,255,.14); border-radius: .65rem; background: rgba(255,255,255,.03); color: #fff; padding: .5rem .65rem; }
      .bright-chat-input button { border: 0; border-radius: .65rem; background: #0ea5e9; color: #fff; padding: .5rem .8rem; cursor: pointer; font-weight: 600; }
      @media (max-width: 1200px) { .bright-article-sidebar { display: none; } }
      @media (max-width: 768px) { .bright-access-controls { bottom: 4.9rem; } }
    `;
    document.head.appendChild(style);
  }

  function isArticleLikePage() {
    const path = normalizePathname(window.location.pathname);
    const isRootBlogArticle = path.startsWith("/blog/") && path !== "/blog/index" && path !== "/blog/index.html";
    const isFrontendBloggerArticle = path.startsWith("/frontend/pages/blogger/");
    const isFrontendBlogArticle =
      path.startsWith("/frontend/pages/blog/") &&
      path !== "/frontend/pages/blog/index" &&
      path !== "/frontend/pages/blog/index.html";
    const isDocsArticlePath =
      path.startsWith("/frontend/pages/docs/") &&
      !path.endsWith("/docs.html") &&
      !path.endsWith("/contact.html") &&
      !path.endsWith("/contact-en.html");

    return isRootBlogArticle || isFrontendBloggerArticle || isFrontendBlogArticle || isDocsArticlePath;
  }

  function getPrimaryArticleContainer() {
    const article = document.querySelector("article");
    if (article) return article;
    const docContent = document.querySelector("main .doc-content");
    if (docContent) return docContent;
    return null;
  }

  function getArticleHeadings(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll("h2, h3")).filter((heading) => {
      const text = (heading.textContent || "").trim();
      return text.length >= 3;
    });
  }

  function slugHeading(text, fallback) {
    const raw = String(text || "").trim().toLowerCase();
    const normalized = raw
      .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    return normalized || `section-${fallback}`;
  }

  function ensureSkipToMain() {
    if (document.getElementById("bright-skip-main")) return;
    const main = document.querySelector("main") || document.querySelector('[role="main"]');
    if (!main) return;
    if (!main.id) main.id = "main-content";

    const skip = document.createElement("a");
    skip.id = "bright-skip-main";
    skip.className = "bright-skip-link";
    skip.href = `#${main.id}`;
    skip.textContent = "تجاوز إلى المحتوى الرئيسي";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function injectReadingProgressBar() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-reading-progress")) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;

    const bar = document.createElement("div");
    bar.id = "bright-reading-progress";
    bar.className = "bright-reading-progress";
    document.body.appendChild(bar);

    const update = function () {
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const articleHeight = Math.max(article.scrollHeight, article.offsetHeight);
      const maxScrollable = Math.max(1, articleHeight - window.innerHeight * 0.7);
      const progress = ((window.scrollY - articleTop) / maxScrollable) * 100;
      const width = Math.max(0, Math.min(100, progress));
      bar.style.width = `${width}%`;
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function injectShareControls() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-share-controls")) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;
    const title = article.querySelector("h1") || document.querySelector("main h1");
    if (!title) return;

    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent((title.textContent || "").trim());

    const row = document.createElement("div");
    row.id = "bright-share-controls";
    row.className = "bright-share-controls";
    row.innerHTML = `
      <button type="button" class="bright-share-btn" data-share-action="copy">
        <iconify-icon icon="lucide:link-2" width="14"></iconify-icon>
        نسخ الرابط
      </button>
      <a class="bright-share-btn" href="https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
        <iconify-icon icon="lucide:twitter" width="14"></iconify-icon>
        مشاركة X
      </a>
      <a class="bright-share-btn" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">
        <iconify-icon icon="logos:whatsapp-icon" width="14"></iconify-icon>
        واتساب
      </a>
      <button type="button" class="bright-share-btn" data-share-action="print">
        <iconify-icon icon="lucide:printer" width="14"></iconify-icon>
        طباعة / PDF
      </button>
    `;
    title.insertAdjacentElement("afterend", row);

    row.querySelector('[data-share-action="copy"]')?.addEventListener("click", async function () {
      const button = row.querySelector('[data-share-action="copy"]');
      if (!button) return;
      try {
        await navigator.clipboard.writeText(url);
        button.textContent = "تم النسخ";
      } catch (_) {
        const fallbackInput = document.createElement("input");
        fallbackInput.value = url;
        document.body.appendChild(fallbackInput);
        fallbackInput.select();
        document.execCommand("copy");
        fallbackInput.remove();
        button.textContent = "تم النسخ";
      }
      window.setTimeout(function () {
        button.innerHTML = '<iconify-icon icon="lucide:link-2" width="14"></iconify-icon>نسخ الرابط';
      }, 1400);
    });

    row.querySelector('[data-share-action="print"]')?.addEventListener("click", function () {
      window.print();
    });
  }

  function injectAccessibilityControls() {
    if (document.getElementById("bright-access-controls")) return;

    const storageKeyTheme = "bright_theme_pref";
    const storageKeyScale = "bright_font_scale";
    const root = document.documentElement;
    const defaultScale = 1;

    const applyTheme = function (mode) {
      root.classList.toggle("bright-light-mode", mode === "light");
    };
    const applyScale = function (scale) {
      const safeScale = Math.max(0.9, Math.min(1.2, Number(scale) || defaultScale));
      root.style.setProperty("--bright-font-scale", String(safeScale));
      return safeScale;
    };

    const savedTheme = localStorage.getItem(storageKeyTheme) || "dark";
    const savedScale = applyScale(localStorage.getItem(storageKeyScale) || defaultScale);
    applyTheme(savedTheme);

    const controls = document.createElement("div");
    controls.id = "bright-access-controls";
    controls.className = "bright-access-controls";
    controls.innerHTML = `
      <button type="button" class="bright-access-btn" data-a11y-theme title="تبديل المظهر">🌓</button>
      <button type="button" class="bright-access-btn" data-a11y-dec title="تصغير الخط">A-</button>
      <button type="button" class="bright-access-btn" data-a11y-reset title="إعادة الخط">A</button>
      <button type="button" class="bright-access-btn" data-a11y-inc title="تكبير الخط">A+</button>
    `;
    document.body.appendChild(controls);

    controls.querySelector("[data-a11y-theme]")?.addEventListener("click", function () {
      const mode = root.classList.contains("bright-light-mode") ? "dark" : "light";
      applyTheme(mode);
      localStorage.setItem(storageKeyTheme, mode);
    });

    controls.querySelector("[data-a11y-dec]")?.addEventListener("click", function () {
      const updated = applyScale((Number(root.style.getPropertyValue("--bright-font-scale")) || savedScale) - 0.04);
      localStorage.setItem(storageKeyScale, String(updated));
    });

    controls.querySelector("[data-a11y-inc]")?.addEventListener("click", function () {
      const updated = applyScale((Number(root.style.getPropertyValue("--bright-font-scale")) || savedScale) + 0.04);
      localStorage.setItem(storageKeyScale, String(updated));
    });

    controls.querySelector("[data-a11y-reset]")?.addEventListener("click", function () {
      const updated = applyScale(defaultScale);
      localStorage.setItem(storageKeyScale, String(updated));
    });
  }

  function buildTocMarkup(headings) {
    const toc = document.createElement("nav");
    toc.className = "bright-article-toc";
    toc.setAttribute("aria-label", "فهرس المقال");
    const listHtml = headings
      .map(function (heading, index) {
        if (!heading.id) heading.id = slugHeading(heading.textContent || "", index + 1);
        return `<li><a href="#${heading.id}">${heading.textContent || ""}</a></li>`;
      })
      .join("");
    toc.innerHTML = `<h2>الفهرس</h2><ul>${listHtml}</ul>`;
    return toc;
  }

  function injectAutoTableOfContents() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-inline-toc")) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;
    const headings = getArticleHeadings(article);
    if (headings.length < 4) return;

    const toc = buildTocMarkup(headings);
    toc.id = "bright-inline-toc";

    const insertionAnchor = article.querySelector("h2, h3, p");
    if (insertionAnchor) {
      insertionAnchor.insertAdjacentElement("beforebegin", toc);
    } else {
      article.prepend(toc);
    }

    if (!document.getElementById("bright-article-sidebar") && headings.length >= 6) {
      const sidebar = document.createElement("aside");
      sidebar.id = "bright-article-sidebar";
      sidebar.className = "bright-article-sidebar";
      sidebar.appendChild(buildTocMarkup(headings));
      document.body.appendChild(sidebar);
    }
  }

  function injectRelatedArticles() {
    if (document.getElementById("bright-related-articles")) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;

    const path = normalizePathname(window.location.pathname);
    const isBlogPath = path.startsWith("/frontend/pages/blogger/") || path.startsWith("/frontend/pages/blog/");
    const isDocsPath = path.startsWith("/frontend/pages/docs/");
    if (!isBlogPath && !isDocsPath) return;

    const hasRelatedHeader = Array.from(article.querySelectorAll("h2, h3")).some(function (heading) {
      return /مقالات ذات صلة|Related/i.test(heading.textContent || "");
    });
    if (hasRelatedHeader) return;

    const relatedSet = isBlogPath
      ? [
          { href: "/frontend/pages/blogger/nca-compliance.html", title: "حوكمة NCA للشركات السعودية", hint: "امتثال وتشغيل" },
          { href: "/frontend/pages/blogger/vision-2030-ai-opportunities.html", title: "فرص الذكاء الاصطناعي ضمن رؤية 2030", hint: "اتجاهات السوق" },
          { href: "/frontend/pages/blogger/ai-implementation-cost-guide.html", title: "دليل تكلفة تطبيق الذكاء الاصطناعي", hint: "قرار الاستثمار" }
        ]
      : [
          { href: "/frontend/pages/docs/solutions-hr.html", title: "حلول الموارد البشرية الذكية", hint: "حالة استخدام عملية" },
          { href: "/frontend/pages/docs/solutions-crm.html", title: "حلول CRM والواتساب", hint: "رفع التحويلات" },
          { href: "/frontend/pages/docs/consultation.html", title: "استشارة تنفيذ مخصصة", hint: "جلسة تشخيص" }
        ];

    const section = document.createElement("section");
    section.id = "bright-related-articles";
    section.className = "bright-related";
    section.innerHTML = `<h2>مقالات ذات صلة</h2><div class="bright-related-list">${relatedSet
      .map(function (item) {
        return `<a class="bright-related-card" href="${item.href}">${item.title}<span>${item.hint}</span></a>`;
      })
      .join("")}</div>`;
    article.appendChild(section);
  }

  function injectBackToTopButton() {
    const path = normalizePathname(window.location.pathname);
    const isRootPath = path === "/" || path === "/index" || path === "/index.html";
    if (isRootPath) return;
    if (document.getElementById("bright-back-top")) return;
    if (document.querySelector("[data-back-to-top], #backToTop")) return;

    const button = document.createElement("button");
    button.id = "bright-back-top";
    button.className = "bright-back-top";
    button.type = "button";
    button.setAttribute("aria-label", "العودة لأعلى الصفحة");
    button.innerHTML = '<iconify-icon icon="lucide:arrow-up" width="18"></iconify-icon>';
    document.body.appendChild(button);

    const onScroll = function () {
      button.classList.toggle("show", window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function injectFloatingChatbot() {
    const path = normalizePathname(window.location.pathname);
    const isRootPath = path === "/" || path === "/index" || path === "/index.html";
    if (isRootPath) return;
    if (document.getElementById("chatFab") || document.getElementById("chatToggle")) return;
    if (document.getElementById("bright-chat-fab")) return;

    const fab = document.createElement("button");
    fab.id = "bright-chat-fab";
    fab.className = "bright-chat-fab";
    fab.type = "button";
    fab.setAttribute("aria-controls", "bright-chat-panel");
    fab.setAttribute("aria-expanded", "false");
    fab.setAttribute("aria-label", "فتح المساعد الذكي");
    fab.innerHTML = '<iconify-icon icon="lucide:message-square" width="24"></iconify-icon>';

    const panel = document.createElement("section");
    panel.id = "bright-chat-panel";
    panel.className = "bright-chat-panel";
    panel.innerHTML = `
      <div class="bright-chat-head">
        <strong>Bright AI Assistant</strong>
        <button type="button" data-chat-close aria-label="إغلاق" style="border:0;background:transparent;color:#cbd5e1;cursor:pointer;">
          <iconify-icon icon="lucide:x" width="18"></iconify-icon>
        </button>
      </div>
      <div class="bright-chat-messages" id="bright-chat-messages">
        <div class="bright-chat-msg bot">أهلاً، اكتب سؤالك التقني أو التجاري وبنرد عليك فوراً.</div>
      </div>
      <form class="bright-chat-input" id="bright-chat-form">
        <input id="bright-chat-input" type="text" placeholder="اكتب سؤالك..." autocomplete="off" />
        <button type="submit">إرسال</button>
      </form>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messageContainer = panel.querySelector("#bright-chat-messages");
    const form = panel.querySelector("#bright-chat-form");
    const input = panel.querySelector("#bright-chat-input");
    const closeButton = panel.querySelector("[data-chat-close]");
    let sending = false;

    const addMessage = function (text, role) {
      if (!messageContainer) return;
      const node = document.createElement("div");
      node.className = `bright-chat-msg ${role}`;
      node.textContent = text;
      messageContainer.appendChild(node);
      messageContainer.scrollTop = messageContainer.scrollHeight;
    };

    fab.addEventListener("click", function () {
      const open = panel.classList.toggle("open");
      fab.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) input?.focus();
    });

    closeButton?.addEventListener("click", function () {
      panel.classList.remove("open");
      fab.setAttribute("aria-expanded", "false");
    });

    form?.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!input || sending) return;
      const question = input.value.trim();
      if (!question) return;

      addMessage(question, "user");
      input.value = "";
      sending = true;

      try {
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question })
        });
        const payload = await response.json().catch(function () {
          return {};
        });
        if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);

        const answer = String(payload?.reply || "").trim() || "تم استلام سؤالك، فريقنا بيرد عليك خلال لحظات.";
        addMessage(answer, "bot");
      } catch (_) {
        addMessage("حالياً الخدمة مزدحمة. تواصل معنا مباشرة عبر واتساب: +966538229013", "bot");
      } finally {
        sending = false;
        input.focus();
      }
    });
  }

  function apply(options) {
    normalizePathname = typeof options?.normalizePathname === "function" ? options.normalizePathname : normalizePathname;
    ensureUxEnhancementStyles();
    ensureSkipToMain();
    injectAccessibilityControls();
    injectReadingProgressBar();
    injectShareControls();
    injectAutoTableOfContents();
    injectRelatedArticles();
    injectBackToTopButton();
    injectFloatingChatbot();
  }

  window.BrightUXEnhancer = { apply };
})();
