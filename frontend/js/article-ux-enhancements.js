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
      .bright-share-btn.is-active { background: rgba(34,197,94,.2); border-color: rgba(34,197,94,.55); color: #dcfce7; }
      .bright-author-card { margin-top: 1rem; padding: .85rem 1rem; border-radius: .85rem; border: 1px solid rgba(255,255,255,.14); background: rgba(15,23,42,.58); display: flex; align-items: center; gap: .65rem; color: #cbd5e1; }
      .bright-author-card strong { color: #fff; font-size: .92rem; }
      .bright-author-meta { color: #94a3b8; font-size: .83rem; margin-top: .12rem; }
      .bright-article-feedback { margin-top: 1rem; padding: .95rem 1rem; border-radius: .9rem; border: 1px solid rgba(255,255,255,.14); background: rgba(15,23,42,.45); }
      .bright-article-feedback h3 { margin: 0 0 .6rem; color: #fff; font-size: .95rem; }
      .bright-feedback-actions { display: flex; gap: .55rem; flex-wrap: wrap; }
      .bright-feedback-btn { border: 1px solid rgba(255,255,255,.2); border-radius: .7rem; background: rgba(255,255,255,.03); color: #cbd5e1; font-size: .86rem; padding: .45rem .75rem; cursor: pointer; }
      .bright-feedback-btn.active { background: rgba(99,102,241,.22); border-color: rgba(129,140,248,.7); color: #fff; }
      .bright-feedback-note { color: #94a3b8; font-size: .79rem; margin-top: .55rem; min-height: 1rem; }
      .bright-article-page article p, .bright-article-page article li, .bright-article-page .doc-content p, .bright-article-page .doc-content li, .bright-article-page .prose p, .bright-article-page .prose li { font-size: 1.125rem !important; line-height: 1.9 !important; }
      .bright-article-toc { margin: 1rem 0 1.5rem; padding: 1rem; border-radius: .9rem; border: 1px solid rgba(255,255,255,.12); background: rgba(15,23,42,.55); }
      .bright-article-toc h2 { margin: 0 0 .8rem; font-size: 1rem; color: #fff; }
      .bright-article-toc ul { margin: 0; padding-inline-start: 1rem; list-style: none; display: grid; gap: .45rem; }
      .bright-article-toc a { color: #cbd5e1; text-decoration: none; font-size: .9rem; }
      .bright-article-toc a:hover { color: #22d3ee; }
      .bright-article-toc a.active { color: #22d3ee; font-weight: 700; }
      .bright-article-sidebar { position: fixed; top: 108px; left: 1.2rem; width: 260px; max-height: calc(100vh - 140px); overflow: auto; padding: .95rem; border-radius: .9rem; border: 1px solid rgba(255,255,255,.14); background: rgba(2,6,23,.9); backdrop-filter: blur(8px); z-index: 45; }
      .bright-article-sidebar .bright-article-toc { margin: 0; padding: 0; border: 0; background: transparent; }
      .bright-article-sidebar .bright-article-toc h2 { font-size: .95rem; margin-bottom: .7rem; }
      .bright-article-newsletter { margin-top: 1.2rem; padding: 1rem; border-radius: .9rem; border: 1px solid rgba(34,211,238,.35); background: rgba(6,182,212,.08); }
      .bright-article-newsletter h3 { margin: 0 0 .35rem; color: #fff; font-size: 1rem; }
      .bright-article-newsletter p { margin: 0 0 .6rem; color: #cbd5e1; font-size: .9rem !important; line-height: 1.7 !important; }
      .bright-newsletter-form { display: flex; gap: .5rem; flex-wrap: wrap; }
      .bright-newsletter-form input { flex: 1; min-width: 220px; border: 1px solid rgba(255,255,255,.2); border-radius: .65rem; background: rgba(15,23,42,.45); color: #fff; padding: .5rem .65rem; }
      .bright-newsletter-form button { border: 0; border-radius: .65rem; background: #06b6d4; color: #082f49; font-weight: 700; padding: .5rem .85rem; cursor: pointer; }
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
      @media (max-width: 768px) {
        .bright-access-controls { bottom: 4.9rem; }
        .bright-article-page article p, .bright-article-page article li, .bright-article-page .doc-content p, .bright-article-page .doc-content li, .bright-article-page .prose p, .bright-article-page .prose li { font-size: 1.02rem !important; }
      }
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
    if (document.getElementById("readingProgress") || document.querySelector(".reading-progress-bar")) return;
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

  function buildShareControlsMarkup(encodedTitle, encodedUrl) {
    return `
      <button type="button" class="bright-share-btn" data-share-action="bookmark">
        <iconify-icon icon="lucide:bookmark-plus" width="14"></iconify-icon>
        حفظ المقال
      </button>
      <button type="button" class="bright-share-btn" data-share-action="copy">
        <iconify-icon icon="lucide:link-2" width="14"></iconify-icon>
        نسخ الرابط
      </button>
      <a class="bright-share-btn" data-share-action="x" href="https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}" target="_blank" rel="noopener noreferrer">
        <iconify-icon icon="lucide:twitter" width="14"></iconify-icon>
        مشاركة X
      </a>
      <a class="bright-share-btn" data-share-action="wa" href="https://wa.me/?text=${encodedTitle}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">
        <iconify-icon icon="logos:whatsapp-icon" width="14"></iconify-icon>
        واتساب
      </a>
      <button type="button" class="bright-share-btn" data-share-action="native">
        <iconify-icon icon="lucide:share-2" width="14"></iconify-icon>
        مشاركة سريعة
      </button>
      <button type="button" class="bright-share-btn" data-share-action="print">
        <iconify-icon icon="lucide:printer" width="14"></iconify-icon>
        طباعة / PDF
      </button>
    `;
  }

  function getSavedArticles() {
    try {
      const raw = localStorage.getItem("bright_saved_articles");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveSavedArticles(items) {
    try {
      localStorage.setItem("bright_saved_articles", JSON.stringify(items));
    } catch (_) {
      // Ignore storage write errors.
    }
  }

  function isArticleSaved(pathname) {
    return getSavedArticles().some((item) => item && item.pathname === pathname);
  }

  function toggleSavedArticle(payload) {
    const current = getSavedArticles();
    const exists = current.some((item) => item && item.pathname === payload.pathname);
    if (exists) {
      const filtered = current.filter((item) => item && item.pathname !== payload.pathname);
      saveSavedArticles(filtered);
      return false;
    }

    const next = [payload, ...current.filter((item) => item && item.pathname !== payload.pathname)].slice(0, 50);
    saveSavedArticles(next);
    return true;
  }

  function updateBookmarkButton(button, saved) {
    if (!button) return;
    button.classList.toggle("is-active", saved);
    button.innerHTML = saved
      ? '<iconify-icon icon="lucide:bookmark-check" width="14"></iconify-icon>محفوظ'
      : '<iconify-icon icon="lucide:bookmark-plus" width="14"></iconify-icon>حفظ المقال';
  }

  function syncAllBookmarkButtons(saved) {
    document.querySelectorAll('[data-share-action="bookmark"]').forEach((button) => {
      updateBookmarkButton(button, saved);
    });
  }

  function bindShareControlsEvents(row, url, titleText) {
    if (!row) return;
    const pathname = normalizePathname(window.location.pathname);
    const shareNativeButton = row.querySelector('[data-share-action="native"]');
    const shareXButton = row.querySelector('[data-share-action="x"]');
    const shareWaButton = row.querySelector('[data-share-action="wa"]');
    const bookmarkButton = row.querySelector('[data-share-action="bookmark"]');

    const canUseNativeShare =
      typeof navigator.share === "function" &&
      window.matchMedia &&
      window.matchMedia("(max-width: 768px)").matches;
    if (shareNativeButton) {
      shareNativeButton.style.display = canUseNativeShare ? "inline-flex" : "none";
    }
    if (canUseNativeShare) {
      if (shareXButton) shareXButton.style.display = "none";
      if (shareWaButton) shareWaButton.style.display = "none";
    }

    if (bookmarkButton) {
      updateBookmarkButton(bookmarkButton, isArticleSaved(pathname));
      bookmarkButton.addEventListener("click", () => {
        const saved = toggleSavedArticle({
          pathname,
          title: titleText,
          url,
          savedAt: new Date().toISOString()
        });
        syncAllBookmarkButtons(saved);
      });
    }

    shareNativeButton?.addEventListener("click", async () => {
      try {
        await navigator.share({ title: titleText, text: titleText, url });
      } catch (_) {
        // Ignore canceled native share.
      }
    });

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

  function injectShareControls() {
    if (!isArticleLikePage()) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;
    const title = article.querySelector("h1") || document.querySelector("main h1");
    if (!title) return;

    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    const titleText = (title.textContent || "").trim();
    const encodedTitle = encodeURIComponent(titleText);

    if (!document.getElementById("bright-share-controls")) {
      const row = document.createElement("div");
      row.id = "bright-share-controls";
      row.className = "bright-share-controls";
      row.innerHTML = buildShareControlsMarkup(encodedTitle, encodedUrl);
      title.insertAdjacentElement("afterend", row);
      bindShareControlsEvents(row, url, titleText);
    }

    if (!document.getElementById("bright-share-controls-bottom")) {
      const bottomRow = document.createElement("div");
      bottomRow.id = "bright-share-controls-bottom";
      bottomRow.className = "bright-share-controls";
      bottomRow.innerHTML = buildShareControlsMarkup(encodedTitle, encodedUrl);
      const related = article.querySelector("#bright-related-articles, .related-articles");
      if (related) {
        related.insertAdjacentElement("beforebegin", bottomRow);
      } else {
        article.appendChild(bottomRow);
      }
      bindShareControlsEvents(bottomRow, url, titleText);
    }
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

  function setActiveTocLink(activeId) {
    const links = document.querySelectorAll('.bright-article-toc a[href^="#"]');
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      const targetId = href.slice(1);
      link.classList.toggle("active", Boolean(activeId) && targetId === activeId);
    });
  }

  function setupTocActiveState(headings) {
    if (!headings || !headings.length || !("IntersectionObserver" in window)) return;
    let activeId = headings[0].id || "";
    const visibleHeadings = new Set();
    setActiveTocLink(activeId);

    const updateActiveFromVisible = () => {
      if (visibleHeadings.size > 0) {
        const sorted = Array.from(visibleHeadings).sort((a, b) => {
          return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
        });
        activeId = sorted[0]?.id || activeId;
      } else {
        const closest = headings
          .filter((heading) => heading.getBoundingClientRect().top <= window.innerHeight * 0.35)
          .pop();
        if (closest?.id) activeId = closest.id;
      }
      setActiveTocLink(activeId);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          visibleHeadings.add(target);
        } else {
          visibleHeadings.delete(target);
        }
      });
      updateActiveFromVisible();
    }, { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] });

    headings.forEach((heading) => io.observe(heading));

    document.querySelectorAll('.bright-article-toc a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const targetId = (link.getAttribute("href") || "").slice(1);
        if (targetId) setActiveTocLink(targetId);
      });
    });
  }

  function injectAutoTableOfContents() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-inline-toc")) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;
    const headings = getArticleHeadings(article);
    if (headings.length < 2) return;

    const toc = buildTocMarkup(headings);
    toc.id = "bright-inline-toc";

    const insertionAnchor = article.querySelector("h2, h3, p");
    if (insertionAnchor) {
      insertionAnchor.insertAdjacentElement("beforebegin", toc);
    } else {
      article.prepend(toc);
    }

    if (!document.getElementById("bright-article-sidebar") && headings.length >= 5) {
      const sidebar = document.createElement("aside");
      sidebar.id = "bright-article-sidebar";
      sidebar.className = "bright-article-sidebar";
      sidebar.appendChild(buildTocMarkup(headings));
      document.body.appendChild(sidebar);
    }

    setupTocActiveState(headings);
  }

  function extractArticleKeywords(article) {
    const h1 = (article.querySelector("h1")?.textContent || "").toLowerCase();
    const body = (article.innerText || "").toLowerCase().slice(0, 2800);
    const merged = `${h1} ${body}`.replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ");
    const words = merged
      .split(/\s+/)
      .filter((word) => word.length >= 3)
      .filter((word) => !/^(this|that|with|from|على|الى|من|في|عن|الى|هذا|هذه|شركة|فريق|bright)$/i.test(word));

    const unique = [];
    for (const word of words) {
      if (unique.includes(word)) continue;
      unique.push(word);
      if (unique.length >= 14) break;
    }
    return unique;
  }

  function deriveRelatedArticlesFromSearchIndex(article, path, isDocsPath) {
    const searchIndex = Array.isArray(window.brightSearch?.searchData) ? window.brightSearch.searchData : [];
    if (!searchIndex.length) return [];

    const currentPath = normalizePathname(path);
    const keywords = extractArticleKeywords(article);
    const preferredType = isDocsPath ? "docs" : "blog";

    const isCandidate = (url) => {
      const normalized = normalizePathname(url);
      if (normalized === currentPath) return false;
      if (preferredType === "docs") {
        return normalized.startsWith("/frontend/pages/docs/");
      }
      return normalized.startsWith("/frontend/pages/blogger/") || normalized.startsWith("/frontend/pages/blog/");
    };

    const scored = searchIndex
      .filter((entry) => entry && typeof entry.url === "string" && isCandidate(entry.url))
      .map((entry) => {
        const haystack = `${entry.title || ""} ${entry.description || ""} ${(entry.keywords || []).join(" ")}`.toLowerCase();
        let score = 0;
        keywords.forEach((word) => {
          if (haystack.includes(word)) score += 3;
        });
        if ((entry.category || "").includes("الخدمات")) score += 1;
        return {
          href: entry.url,
          title: entry.title || "محتوى ذو صلة",
          hint: entry.description || "اقرأ المزيد",
          score
        };
      })
      .sort((a, b) => b.score - a.score)
      .filter((entry) => entry.score > 0)
      .slice(0, 3);

    return scored;
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

    let relatedSet = deriveRelatedArticlesFromSearchIndex(article, path, isDocsPath);
    if (!relatedSet.length) {
      relatedSet = isDocsPath
        ? [
            { href: "/frontend/pages/docs/solutions-hr.html", title: "حلول الموارد البشرية الذكية", hint: "حالة استخدام عملية" },
            { href: "/frontend/pages/docs/solutions-crm.html", title: "حلول CRM والواتساب", hint: "رفع التحويلات" },
            { href: "/frontend/pages/docs/consultation.html", title: "استشارة تنفيذ مخصصة", hint: "جلسة تشخيص" }
          ]
        : [
            { href: "/frontend/pages/blogger/nca-compliance.html", title: "حوكمة NCA للشركات السعودية", hint: "امتثال وتشغيل" },
            { href: "/frontend/pages/blogger/vision-2030-ai-opportunities.html", title: "فرص الذكاء الاصطناعي ضمن رؤية 2030", hint: "اتجاهات السوق" },
            { href: "/frontend/pages/blogger/ai-implementation-cost-guide.html", title: "دليل تكلفة تطبيق الذكاء الاصطناعي", hint: "قرار الاستثمار" }
          ];
    }

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

  function readMetaContent(selector) {
    return document.querySelector(selector)?.getAttribute("content")?.trim() || "";
  }

  function extractAuthorName() {
    const explicit = readMetaContent('meta[name="author"]');
    if (explicit) return explicit;

    const scriptTags = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const tag of scriptTags) {
      try {
        const payload = JSON.parse(tag.textContent || "{}");
        const author = payload?.author;
        if (typeof author === "string" && author.trim()) return author.trim();
        if (author && typeof author === "object" && typeof author.name === "string" && author.name.trim()) {
          return author.name.trim();
        }
      } catch (_) {
        // Ignore malformed JSON-LD blocks.
      }
    }

    return "فريق Bright AI";
  }

  function extractPublishedDate() {
    const directDate =
      readMetaContent('meta[property="article:published_time"]') ||
      readMetaContent('meta[name="publish_date"]') ||
      readMetaContent('meta[name="date"]') ||
      readMetaContent('meta[itemprop="datePublished"]');

    if (directDate) {
      return directDate.split("T")[0];
    }

    const dateNode = document.querySelector(".date, time, .post-date, .blog-meta-item span");
    const dateText = (dateNode?.textContent || "").trim();
    const match =
      dateText.match(/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/) ||
      dateText.match(/\d{4}[/-]\d{1,2}[/-]\d{1,2}/);
    return match ? match[0] : "";
  }

  function extractReadingTimeLabel(article) {
    const badge = document.querySelector("[data-reading-time-slot]");
    const badgeText = (badge?.textContent || "").trim();
    if (badgeText) return badgeText;

    if (!article) return "وقت القراءة: -- دقائق";
    const plainText = (article.innerText || "").replace(/\s+/g, " ").trim();
    if (!plainText) return "وقت القراءة: -- دقائق";
    const words = plainText.split(" ").length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return `وقت القراءة: ${minutes} دقائق`;
  }

  function injectAuthorCardFallback() {
    if (!isArticleLikePage()) return;
    const article = getPrimaryArticleContainer();
    if (!article) return;
    if (document.getElementById("bright-author-card")) return;

    const authorName = extractAuthorName() || "فريق Bright AI";
    const publishedDate = extractPublishedDate() || "تاريخ النشر غير متوفر";
    const readingTime = extractReadingTimeLabel(article);

    const card = document.createElement("section");
    card.id = "bright-author-card";
    card.className = "bright-author-card";
    card.innerHTML = `
      <iconify-icon icon="lucide:user-square-2" width="20"></iconify-icon>
      <div>
        <strong>كتبه ${authorName} | ${publishedDate} | ${readingTime}</strong>
        <div class="bright-author-meta">المحتوى من فريق Bright AI — نسخة محدثة.</div>
      </div>
    `;

    const shareTop = document.getElementById("bright-share-controls");
    const title = article.querySelector("h1") || document.querySelector("main h1");
    if (shareTop) {
      shareTop.insertAdjacentElement("afterend", card);
      return;
    }
    if (title) {
      title.insertAdjacentElement("afterend", card);
      return;
    }

    article.prepend(card);
  }

  function injectHelpfulnessFeedback() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-article-feedback")) return;

    const article = getPrimaryArticleContainer();
    if (!article) return;

    const feedbackKey = `bright_article_feedback_${normalizePathname(window.location.pathname)}`;
    const section = document.createElement("section");
    section.id = "bright-article-feedback";
    section.className = "bright-article-feedback";
    section.innerHTML = `
      <h3>هل كان هذا المقال مفيداً؟</h3>
      <div class="bright-feedback-actions">
        <button type="button" class="bright-feedback-btn" data-feedback-value="up">👍 نعم</button>
        <button type="button" class="bright-feedback-btn" data-feedback-value="down">👎 يحتاج تحسين</button>
      </div>
      <p class="bright-feedback-note" data-feedback-note></p>
    `;

    const note = section.querySelector("[data-feedback-note]");
    const buttons = section.querySelectorAll("[data-feedback-value]");

    const setState = function (value) {
      buttons.forEach((button) => {
        button.classList.toggle("active", button.getAttribute("data-feedback-value") === value);
      });
      if (note) {
        note.textContent = value ? "شكراً، تم تسجيل ملاحظتك." : "";
      }
    };

    const current = localStorage.getItem(feedbackKey) || "";
    setState(current);

    buttons.forEach((button) => {
      button.addEventListener("click", function () {
        const value = button.getAttribute("data-feedback-value") || "";
        localStorage.setItem(feedbackKey, value);
        setState(value);
      });
    });

    const related = article.querySelector("#bright-related-articles, .related-articles");
    if (related) {
      related.insertAdjacentElement("beforebegin", section);
    } else {
      article.appendChild(section);
    }
  }

  function injectArticleNewsletter() {
    if (!isArticleLikePage()) return;
    if (document.getElementById("bright-article-newsletter")) return;

    const article = getPrimaryArticleContainer();
    if (!article) return;

    const section = document.createElement("section");
    section.id = "bright-article-newsletter";
    section.className = "bright-article-newsletter";
    section.innerHTML = `
      <h3>اشترك في نشرة Bright AI</h3>
      <p>ملخصات تطبيقية أسبوعية عن الأتمتة والذكاء الاصطناعي في السوق السعودي.</p>
      <form class="bright-newsletter-form" id="bright-article-newsletter-form">
        <input type="email" required placeholder="البريد الإلكتروني" />
        <button type="submit">اشترك</button>
      </form>
    `;

    const paragraphs = Array.from(article.querySelectorAll("p"));
    const middleParagraph = paragraphs[Math.floor(paragraphs.length / 2)];
    if (middleParagraph) {
      middleParagraph.insertAdjacentElement("afterend", section);
    } else {
      article.appendChild(section);
    }

    section.querySelector("#bright-article-newsletter-form")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = section.querySelector("input[type='email']")?.value?.trim() || "";
      if (!email) return;
      window.location.href = `mailto:yazeed1job@gmail.com?subject=${encodeURIComponent("Article Newsletter Subscription")}&body=${encodeURIComponent(email)}`;
    });
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
    if (isArticleLikePage()) {
      document.body.classList.add("bright-article-page");
    }
    ensureSkipToMain();
    injectAccessibilityControls();
    injectReadingProgressBar();
    injectShareControls();
    injectAuthorCardFallback();
    injectAutoTableOfContents();
    injectArticleNewsletter();
    injectRelatedArticles();
    injectHelpfulnessFeedback();
    injectBackToTopButton();
    injectFloatingChatbot();
  }

  window.BrightUXEnhancer = { apply };
})();
