(function () {
      var authKey = "contractai-authenticated";
      var toastKey = "contractai-auth-toast";
      if (window.localStorage.getItem(authKey) !== "true") {
        window.location.replace("/tenders/landing/");
        return;
      }
      var storageKey = "contractai-theme";
      var logoutButton = document.querySelector(".logout-button");
      var root = document.documentElement;
      var body = document.body;
      var themeToggle = document.getElementById("themeToggle");
      var themeIcon = document.getElementById("themeIcon");
      var menuToggle = document.getElementById("menuToggle");
      var closeSidebar = document.getElementById("closeSidebar");
      var sidebar = document.getElementById("sidebar");
      var sidebarBackdrop = document.getElementById("sidebarBackdrop");
      var searchInput = document.getElementById("globalSearch");
      var counters = Array.prototype.slice.call(document.querySelectorAll(".counter"));
      var dropZone = document.getElementById("dropZone");
      var fileInput = document.getElementById("contractFile");
      var uploadEmpty = document.getElementById("uploadEmpty");
      var uploadPreview = document.getElementById("uploadPreview");
      var uploadTitle = document.getElementById("uploadTitle");
      var uploadError = document.getElementById("uploadError");
      var fileName = document.getElementById("fileName");
      var fileMeta = document.getElementById("fileMeta");
      var fileTypeIcon = document.getElementById("fileTypeIcon");
      var removeFile = document.getElementById("removeFile");
      var progressBar = document.getElementById("progressBar");
      var progressValue = document.getElementById("progressValue");
      var progressPercent = document.getElementById("progressPercent");
      var uploadSuccess = document.getElementById("uploadSuccess");
      var toastStack = document.getElementById("toastStack");
      var startAnalysis = document.getElementById("startAnalysis");
      var resultsDashboard = document.getElementById("results-dashboard");
      var riskGauge = document.getElementById("riskGauge");
      var gaugeScore = document.getElementById("gaugeScore");
      var gaugeStatus = document.getElementById("gaugeStatus");
      var tabButtons = Array.prototype.slice.call(document.querySelectorAll(".tab-button"));
      var tabPanels = Array.prototype.slice.call(document.querySelectorAll(".tab-panel"));
      var accordionItems = Array.prototype.slice.call(document.querySelectorAll(".accordion-item"));
      var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter-button"));
      var riskCards = Array.prototype.slice.call(document.querySelectorAll(".risk-card"));
      var copyButtons = Array.prototype.slice.call(document.querySelectorAll(".copy-button"));
      var calendarButtons = Array.prototype.slice.call(document.querySelectorAll(".calendar-button"));
      var exportAllDates = document.getElementById("exportAllDates");
      var uploadView = document.getElementById("uploadView");
      var contractsView = document.getElementById("contractsView");
      var uploadNavLink = document.getElementById("uploadNavLink");
      var contractsNavLink = document.getElementById("contractsNavLink");
      var exportButtons = Array.prototype.slice.call(document.querySelectorAll(".export-action"));
      var pdfModal = document.getElementById("pdfModal");
      var closePdfModal = document.getElementById("closePdfModal");
      var downloadPdfBtn = document.getElementById("downloadPdfBtn");
      var openEmailModalBtn = document.getElementById("openEmailModalBtn");
      var printPdfBtn = document.getElementById("printPdfBtn");
      var emailModal = document.getElementById("emailModal");
      var closeEmailModal = document.getElementById("closeEmailModal");
      var emailAddressInput = document.getElementById("emailAddressInput");
      var sendEmailBtn = document.getElementById("sendEmailBtn");
      var contractsSearch = document.getElementById("contractsSearch");
      var typeFilter = document.getElementById("typeFilter");
      var riskFilter = document.getElementById("riskFilter");
      var dateFilter = document.getElementById("dateFilter");
      var clearContractsFilters = document.getElementById("clearContractsFilters");
      var contractsTableBody = document.getElementById("contractsTableBody");
      var contractsPaginationInfo = document.getElementById("contractsPaginationInfo");
      var contractsPrev = document.getElementById("contractsPrev");
      var contractsNext = document.getElementById("contractsNext");
      var contractsHeaders = Array.prototype.slice.call(document.querySelectorAll(".contracts-table th[data-sort]"));
      var chatFab = document.getElementById("chatFab");
      var chatOverlay = document.getElementById("chatOverlay");
      var chatPanel = document.getElementById("chatPanel");
      var closeChat = document.getElementById("closeChat");
      var clearChat = document.getElementById("clearChat");
      var chatMessages = document.getElementById("chatMessages");
      var quickPrompts = document.getElementById("quickPrompts");
      var quickPromptButtons = Array.prototype.slice.call(document.querySelectorAll(".quick-prompt"));
      var typingIndicator = document.getElementById("typingIndicator");
      var chatInput = document.getElementById("chatInput");
      var sendChat = document.getElementById("sendChat");
      var chatCharCount = document.getElementById("chatCharCount");

      // ربط أزرار الأمثلة السريعة
      quickPromptButtons.forEach(function (btn) {
        btn.addEventListener("click", function () {
           // حذف الإيموجي من السؤال إن وجد ليكون أنظف للـ AI (اختياري، تركناه هنا لتجربة طبيعية أكثر)
           sendChatMessage(btn.textContent);
        });
      });
      var uploadTimer = null;
      var dragDepth = 0;
      var currentFile = null;
      var gaugeAnimated = false;
      var chatTouchStartX = 0;
      var activeView = "upload";
      var currentPage = 1;
      var pageSize = 7;
      var currentSortKey = "date";
      var currentSortDir = "desc";
      var extractedContractText = ""; // متغير جلوبال محلي لحفظ النص المستخرج
      var allowedExtensions = ["pdf", "docx", "doc", "txt", "png", "jpg", "jpeg"];
      var mimeMap = {
        "application/pdf": "pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
        "application/msword": "doc",
        "text/plain": "txt",
        "image/png": "png",
        "image/jpeg": "jpg"
      };
      var contractsData = [
        { name: "عقد توريد مواد بناء", type: "توريد", date: "2026-03-09", riskScore: 72, risk: "high", value: "2.45M", valueRaw: 2450000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "مناقصة صيانة مباني", type: "مناقصة", date: "2026-03-07", riskScore: 45, risk: "medium", value: "890K", valueRaw: 890000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد خدمات تقنية", type: "خدمات", date: "2026-03-03", riskScore: 23, risk: "low", value: "1.2M", valueRaw: 1200000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "اتفاقية إيجار مستودع", type: "إيجار", date: "2026-02-28", riskScore: 51, risk: "medium", value: "360K", valueRaw: 360000, status: "قيد التفاوض", statusClass: "status-negotiation" },
        { name: "عقد مقاولات طرق", type: "مقاولات", date: "2026-02-20", riskScore: 81, risk: "high", value: "5.7M", valueRaw: 5700000, status: "ملغي", statusClass: "status-cancelled" },
        { name: "مناقصة توريد أجهزة", type: "مناقصة", date: "2026-02-15", riskScore: 18, risk: "low", value: "430K", valueRaw: 430000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد تشغيل وصيانة", type: "صيانة", date: "2026-02-10", riskScore: 55, risk: "medium", value: "1.8M", valueRaw: 1800000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "عقد استشارات هندسية", type: "خدمات", date: "2026-01-29", riskScore: 34, risk: "low", value: "760K", valueRaw: 760000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد توريد خرسانة جاهزة", type: "توريد", date: "2026-01-17", riskScore: 67, risk: "high", value: "3.1M", valueRaw: 3100000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "مناقصة أمن وسلامة", type: "مناقصة", date: "2026-01-12", riskScore: 41, risk: "medium", value: "540K", valueRaw: 540000, status: "قيد التفاوض", statusClass: "status-negotiation" },
        { name: "عقد إيجار معدات", type: "إيجار", date: "2025-12-28", riskScore: 29, risk: "low", value: "280K", valueRaw: 280000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد تطوير منصة داخلية", type: "خدمات", date: "2025-12-11", riskScore: 58, risk: "medium", value: "1.95M", valueRaw: 1950000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "عقد توريد كيابل", type: "توريد", date: "2025-12-02", riskScore: 39, risk: "medium", value: "640K", valueRaw: 640000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "مناقصة تجهيز مكاتب", type: "مناقصة", date: "2025-11-24", riskScore: 62, risk: "high", value: "1.05M", valueRaw: 1050000, status: "قيد التفاوض", statusClass: "status-negotiation" },
        { name: "عقد خدمات لوجستية", type: "خدمات", date: "2025-11-18", riskScore: 33, risk: "medium", value: "910K", valueRaw: 910000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "اتفاقية إيجار آليات", type: "إيجار", date: "2025-11-10", riskScore: 26, risk: "low", value: "520K", valueRaw: 520000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد مقاولات بنية تحتية", type: "مقاولات", date: "2025-10-30", riskScore: 76, risk: "high", value: "7.2M", valueRaw: 7200000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "عقد تشغيل مراكز خدمة", type: "صيانة", date: "2025-10-18", riskScore: 49, risk: "medium", value: "2.1M", valueRaw: 2100000, status: "قيد التفاوض", statusClass: "status-negotiation" },
        { name: "مناقصة توريد أنظمة مراقبة", type: "مناقصة", date: "2025-10-07", riskScore: 28, risk: "low", value: "780K", valueRaw: 780000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "عقد خدمات أمنية", type: "خدمات", date: "2025-09-29", riskScore: 52, risk: "medium", value: "1.35M", valueRaw: 1350000, status: "قيد المراجعة", statusClass: "status-review" },
        { name: "عقد توريد أثاث", type: "توريد", date: "2025-09-17", riskScore: 21, risk: "low", value: "410K", valueRaw: 410000, status: "تم التوقيع", statusClass: "status-signed" },
        { name: "اتفاقية صيانة مصاعد", type: "صيانة", date: "2025-09-03", riskScore: 44, risk: "medium", value: "690K", valueRaw: 690000, status: "قيد التفاوض", statusClass: "status-negotiation" },
        { name: "عقد مقاولات تشطيب", type: "مقاولات", date: "2025-08-21", riskScore: 69, risk: "high", value: "3.6M", valueRaw: 3600000, status: "ملغي", statusClass: "status-cancelled" }
      ];

      function setTheme(theme) {
        root.setAttribute("data-theme", theme);
        var isLight = theme === "light";
        themeToggle.setAttribute("aria-pressed", String(isLight));
        themeToggle.setAttribute(
          "aria-label",
          isLight ? "تفعيل الوضع الليلي" : "تفعيل الوضع النهاري"
        );
        themeIcon.innerHTML = isLight
          ? '<path d="M20 12.5A8.5 8.5 0 1 1 11.5 4 6.5 6.5 0 0 0 20 12.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>'
          : '<path d="M12 3v2.25M12 18.75V21M5.64 5.64l1.59 1.59M16.77 16.77l1.59 1.59M3 12h2.25M18.75 12H21M5.64 18.36l1.59-1.59M16.77 7.23l1.59-1.59M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>';
        window.localStorage.setItem(storageKey, theme);
      }

      function getPreferredTheme() {
        var saved = window.localStorage.getItem(storageKey);
        if (saved === "light" || saved === "dark") {
          return saved;
        }
        return window.matchMedia("(prefers-color-scheme: light)").matches
          ? "light"
          : "dark";
      }

      function toggleSidebar(open) {
        var shouldOpen = typeof open === "boolean" ? open : !sidebar.classList.contains("is-open");
        sidebar.classList.toggle("is-open", shouldOpen);
        sidebarBackdrop.classList.toggle("is-visible", shouldOpen);
        sidebarBackdrop.hidden = !shouldOpen;
        body.classList.toggle("menu-open", shouldOpen);
        menuToggle.setAttribute("aria-expanded", String(shouldOpen));
        if (shouldOpen) {
          closeSidebar.focus();
        } else {
          menuToggle.focus();
        }
      }

      function formatCounterValue(value, suffix) {
        if (suffix.indexOf("%") !== -1 || value % 1 !== 0) {
          return value.toFixed(1) + suffix;
        }

        return Math.round(value) + suffix;
      }

      function animateCounter(counter) {
        if (counter.dataset.animated === "true") {
          return;
        }

        counter.dataset.animated = "true";
        var target = Number(counter.dataset.target || 0);
        var suffix = counter.dataset.suffix || "";
        var startTime = null;
        var duration = 1400;

        function step(timestamp) {
          if (!startTime) {
            startTime = timestamp;
          }

          var progress = Math.min((timestamp - startTime) / duration, 1);
          var current = target * progress;
          counter.textContent = formatCounterValue(current, suffix);

          if (progress < 1) {
            window.requestAnimationFrame(step);
          } else {
            counter.textContent = formatCounterValue(target, suffix);
          }
        }

        window.requestAnimationFrame(step);
      }

      function initCounters() {
        var observer = new window.IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.35 }
        );

        counters.forEach(function (counter) {
          observer.observe(counter);
        });
      }

      function showToast(message, type) {
        var tone = type || "info";
        var icons = {
          success: "✅",
          warning: "⚠️",
          error: "❌",
          info: "ℹ️"
        };
        var titles = {
          success: "نجاح",
          warning: "تنبيه",
          error: "خطأ",
          info: "معلومة"
        };
        var toast = document.createElement("div");
        toast.className = "toast glass " + tone;
        toast.innerHTML =
          '<span class="toast-icon">' + icons[tone] + "</span>" +
          '<div class="toast-body"><p class="toast-title">' + titles[tone] + '</p><p class="toast-text"></p></div>' +
          '<button class="toast-close" type="button" aria-label="إغلاق الإشعار">✕</button>';
        toast.querySelector(".toast-text").textContent = message;
        toast.querySelector(".toast-close").addEventListener("click", function () {
          toast.remove();
        });
        toastStack.appendChild(toast);
        window.setTimeout(function () {
          toast.remove();
        }, 4000);
      }

      function formatRiskTone(score) {
        if (score >= 61) {
          return { label: "🔴 " + score + " عالي", color: "linear-gradient(90deg,#fb7185,#ff4757)" };
        }
        if (score >= 31) {
          return { label: "🟡 " + score + " متوسط", color: "linear-gradient(90deg,#fbbf24,#f59e0b)" };
        }
        return { label: "🟢 " + score + " منخفض", color: "linear-gradient(90deg,#22c55e,#16a34a)" };
      }

      function getFilteredContracts() {
        var search = contractsSearch.value.trim().toLowerCase();
        var type = typeFilter.value;
        var risk = riskFilter.value;
        var range = dateFilter.value;
        var now = new Date("2026-03-09T12:00:00");

        return contractsData
          .filter(function (contract) {
            var matchesSearch = !search || contract.name.toLowerCase().indexOf(search) !== -1;
            var matchesType = type === "all" || contract.type === type;
            var matchesRisk = risk === "all" || contract.risk === risk;
            var matchesDate = true;
            if (range !== "all") {
              var diffDays = (now - new Date(contract.date + "T00:00:00")) / (1000 * 60 * 60 * 24);
              matchesDate = diffDays <= Number(range);
            }
            return matchesSearch && matchesType && matchesRisk && matchesDate;
          })
          .sort(function (a, b) {
            var aValue = a[currentSortKey];
            var bValue = b[currentSortKey];
            if (currentSortKey === "date") {
              aValue = new Date(a.date).getTime();
              bValue = new Date(b.date).getTime();
            }
            if (typeof aValue === "string") {
              return currentSortDir === "asc"
                ? aValue.localeCompare(bValue, "ar")
                : bValue.localeCompare(aValue, "ar");
            }
            return currentSortDir === "asc" ? aValue - bValue : bValue - aValue;
          });
      }

      function closeAllActionMenus() {
        Array.prototype.slice.call(document.querySelectorAll(".actions-menu")).forEach(function (menu) {
          menu.classList.remove("is-open");
        });
      }

      function renderContractsTable() {
        var filtered = getFilteredContracts();
        var totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentPage = Math.min(currentPage, totalPages);
        var start = (currentPage - 1) * pageSize;
        var pageItems = filtered.slice(start, start + pageSize);

        contractsTableBody.innerHTML = pageItems
          .map(function (contract, index) {
            var riskTone = formatRiskTone(contract.riskScore);
            return (
              '<tr class="contract-row" data-name="' + contract.name + '">' +
              "<td>" + contract.name + "</td>" +
              '<td class="table-type">' + contract.type + "</td>" +
              '<td class="table-type">' + new Date(contract.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }) + "</td>" +
              '<td><div class="risk-meter"><span class="risk-meter-label">' + riskTone.label + '</span><div class="risk-meter-bar"><div class="risk-meter-fill" style="width:' + contract.riskScore + '%;background:' + riskTone.color + ';"></div></div></div></td>' +
              '<td class="table-value">' + contract.value + "</td>" +
              '<td><span class="status-badge ' + contract.statusClass + '">' + contract.status + "</span></td>" +
              '<td><div class="row-actions"><button class="icon-button actions-toggle" type="button" data-actions="' + (start + index) + '">⋮</button>' +
              '<div class="actions-menu" id="actions-menu-' + (start + index) + '">' +
              '<button type="button" data-contract-action="view">عرض التقرير</button>' +
              '<button type="button" data-contract-action="pdf">تحميل PDF</button>' +
              '<button type="button" data-contract-action="reanalyze">إعادة التحليل</button>' +
              '<button type="button" data-contract-action="delete">حذف</button>' +
              "</div></div></td>" +
              "</tr>"
            );
          })
          .join("");

        contractsPaginationInfo.textContent =
          "عرض " +
          (filtered.length ? start + 1 : 0) +
          "-" +
          Math.min(start + pageSize, filtered.length) +
          " من " +
          filtered.length +
          " عقد";

        contractsPrev.disabled = currentPage === 1;
        contractsNext.disabled = currentPage === totalPages;

        Array.prototype.slice.call(document.querySelectorAll(".actions-toggle")).forEach(function (button) {
          button.addEventListener("click", function (event) {
            event.stopPropagation();
            var menu = document.getElementById("actions-menu-" + button.getAttribute("data-actions"));
            var shouldOpen = !menu.classList.contains("is-open");
            closeAllActionMenus();
            menu.classList.toggle("is-open", shouldOpen);
          });
        });

        Array.prototype.slice.call(document.querySelectorAll("[data-contract-action]")).forEach(function (button) {
          button.addEventListener("click", function (event) {
            event.stopPropagation();
            var action = button.getAttribute("data-contract-action");
            closeAllActionMenus();
            if (action === "view") {
              showResultsDashboard();
              switchView("upload");
              resultsDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
            } else if (action === "pdf") {
              openModal(pdfModal);
            } else if (action === "reanalyze") {
              switchView("upload");
              showToast("✅ تمت إعادة توجيهك لواجهة التحليل.", "success");
            } else if (action === "delete") {
              showToast("⚠️ تم حذف العقد من العرض الحالي.", "warning");
            }
          });
        });

        Array.prototype.slice.call(document.querySelectorAll(".contract-row")).forEach(function (row) {
          row.addEventListener("click", function (event) {
            if (event.target.closest(".row-actions")) {
              return;
            }
            showResultsDashboard();
            switchView("upload");
            resultsDashboard.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }

      function switchView(viewName) {
        activeView = viewName;
        uploadView.classList.toggle("is-active", viewName === "upload");
        contractsView.classList.toggle("is-active", viewName === "contracts");
        uploadNavLink.setAttribute("aria-current", viewName === "upload" ? "page" : "false");
        contractsNavLink.setAttribute("aria-current", viewName === "contracts" ? "page" : "false");
        uploadNavLink.classList.toggle("is-active", viewName === "upload");
        contractsNavLink.classList.toggle("is-active", viewName === "contracts");
        document.querySelector(".breadcrumb .current").textContent =
          viewName === "upload" ? "رفع عقد جديد" : "عقودي";
        closeAllActionMenus();
      }

      function openModal(modal) {
        modal.hidden = false;
        modal.classList.add("is-open");
        body.classList.add("menu-open");
      }

      function closeModal(modal) {
        modal.classList.remove("is-open");
        modal.hidden = true;
        body.classList.remove("menu-open");
      }

      function showInlineError(message) {
        uploadError.hidden = false;
        uploadError.textContent = message;
        dropZone.classList.add("is-invalid");
        showToast(message, "error");
        window.setTimeout(function () {
          uploadError.hidden = true;
          uploadError.textContent = "";
          dropZone.classList.remove("is-invalid");
        }, 2600);
      }

      function formatFileSize(size) {
        if (size < 1024 * 1024) {
          return (size / 1024).toFixed(1) + " KB";
        }

        return (size / (1024 * 1024)).toFixed(2) + " MB";
      }

      function detectFileKind(file) {
        var byMime = mimeMap[file.type];
        if (byMime) {
          return byMime;
        }

        var parts = file.name.split(".");
        return parts.length > 1 ? parts.pop().toLowerCase() : "";
      }

      function isFileValid(file) {
        var kind = detectFileKind(file);

        if (!allowedExtensions.includes(kind)) {
          showInlineError("نوع الملف غير مدعوم. استخدم PDF أو DOCX أو DOC أو TXT أو PNG أو JPG.");
          return false;
        }

        if (file.size > 50 * 1024 * 1024) {
          showInlineError("حجم الملف يتجاوز 50MB. اختر ملفاً أصغر ثم أعد المحاولة.");
          return false;
        }

        return true;
      }

      function getFileIconMarkup(kind) {
        var colorMap = {
          pdf: "#ff4757",
          docx: "#3b82f6",
          doc: "#3b82f6",
          txt: "#94a3b8",
          png: "#00e5b4",
          jpg: "#00e5b4",
          jpeg: "#00e5b4"
        };
        var tone = colorMap[kind] || "var(--accent)";

        return {
          tone: tone,
          markup:
            '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 4h7l4 4v12H7V4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M13 4v4h4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path><path d="M9 14.5h6M9 11.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path></svg>'
        };
      }

      function resetProgress() {
        if (uploadTimer) {
          window.clearInterval(uploadTimer);
        }
        progressBar.style.width = "0%";
        progressValue.textContent = "0%";
        progressPercent.textContent = "0%";
        progressPercent.style.left = "12px";
        uploadSuccess.hidden = true;
      }

      function simulateUpload() {
        resetProgress();
        var progress = 0;

        uploadTimer = window.setInterval(function () {
          progress += 4;
          if (progress > 100) {
            progress = 100;
          }

          progressBar.style.width = progress + "%";
          progressValue.textContent = progress + "%";
          progressPercent.textContent = progress + "%";
          progressPercent.style.left = "min(calc(" + progress + "% - 22px), calc(100% - 40px))";

          if (progress === 100) {
            window.clearInterval(uploadTimer);
            uploadSuccess.hidden = false;
          }
        }, 80);
      }

      function renderFilePreview(file) {
        currentFile = file;
        var kind = detectFileKind(file);
        var icon = getFileIconMarkup(kind);
        dropZone.classList.add("has-file");
        uploadEmpty.hidden = true;
        uploadPreview.hidden = false;
        uploadTitle.textContent = "أفلت الملف هنا!";
        fileName.textContent = file.name;
        fileMeta.textContent = formatFileSize(file.size) + " • " + kind.toUpperCase();
        fileTypeIcon.style.color = icon.tone;
        fileTypeIcon.innerHTML = icon.markup;
        simulateUpload();
      }

      function clearFile() {
        currentFile = null;
        fileInput.value = "";
        dropZone.classList.remove("has-file", "is-dragover", "is-invalid");
        uploadEmpty.hidden = false;
        uploadPreview.hidden = true;
        uploadTitle.textContent = "اسحب العقد أو المناقصة هنا";
        uploadError.hidden = true;
        uploadError.textContent = "";
        resetProgress();
      }

      function handleFile(file) {
        if (!file || !isFileValid(file)) {
          return;
        }

        renderFilePreview(file);

        // استخراج النص من الملف
        extractTextFromFile(file).then(function(text) {
          extractedContractText = text;
          console.log("تم استخراج النص بنجاح:", text.substring(0, 100) + "...");
          showToast("تم قراءة محتوى الملف بنجاح، يمكنك الآن بدء التحليل.", "success");
        }).catch(function(error) {
          console.error("خطأ في قراءة الملف:", error);
          showToast("حدث خطأ أثناء قراءة الملف، يرجى المحاولة بملف آخر.", "error");
        });
      }

      // دالة استخراج النص من الملفات (PDF أو TXT حالياً)
      async function extractTextFromFile(file) {
        return new Promise((resolve, reject) => {
          const kind = detectFileKind(file);

          if (kind === "txt") {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error("فشل قراءة الملف النصي"));
            reader.readAsText(file, "UTF-8");
          } else if (kind === "pdf") {
            const reader = new FileReader();
            reader.onload = async (e) => {
              try {
                const typedarray = new Uint8Array(e.target.result);
                const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
                let fullText = "";

                // تحديد الحد الأقصى للصفحات لتجنب تعليق المتصفح في الملفات الضخمة
                const numPages = Math.min(pdf.numPages, 50);

                for (let i = 1; i <= numPages; i++) {
                  const page = await pdf.getPage(i);
                  const textContent = await page.getTextContent();
                  const pageText = textContent.items.map(item => item.str).join(" ");
                  fullText += pageText + "\n\n";
                }
                resolve(fullText);
              } catch (err) {
                reject(err);
              }
            };
            reader.onerror = (e) => reject(new Error("فشل قراءة ملف الـ PDF"));
            reader.readAsArrayBuffer(file);
          } else {
            // كحل مبدئي لباقي الصيغ كصور أو مستندات الوورد
            resolve("عذراً، استخراج النصوص الحقيقي حالياً مدعوم فقط لملفات PDF و TXT. هذا النص هو نص احتياطي لغرض التجربة.");
          }
        });
      }

      function openPicker() {
        if (!dropZone.classList.contains("has-file")) {
          fileInput.click();
        }
      }

      function updateAccordionHeight(item) {
        var content = item.querySelector(".accordion-content");
        if (!content) {
          return;
        }

        if (item.classList.contains("is-open")) {
          content.style.maxHeight = content.scrollHeight + "px";
        } else {
          content.style.maxHeight = "0px";
        }
      }

      function initAccordions() {
        accordionItems.forEach(function (item) {
          var trigger = item.querySelector(".accordion-trigger");
          if (!trigger) {
            return;
          }

          updateAccordionHeight(item);

          trigger.addEventListener("click", function () {
            var isOpen = item.classList.toggle("is-open");
            trigger.setAttribute("aria-expanded", String(isOpen));
            updateAccordionHeight(item);
          });
        });
      }

      function activateTab(tabName) {
        tabButtons.forEach(function (button) {
          var isActive = button.dataset.tab === tabName;
          button.classList.toggle("is-active", isActive);
          button.setAttribute("aria-selected", String(isActive));
        });

        tabPanels.forEach(function (panel) {
          panel.classList.toggle("is-active", panel.id === "tab-" + tabName);
        });

        window.requestAnimationFrame(function () {
          accordionItems.forEach(updateAccordionHeight);
        });
      }

      function initTabs() {
        tabButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            activateTab(button.dataset.tab);
          });
        });
      }

      function filterRiskCards(filter) {
        riskCards.forEach(function (card) {
          var matches = filter === "all" || card.dataset.risk === filter;
          card.classList.toggle("is-hidden", !matches);
        });
        window.requestAnimationFrame(function () {
          accordionItems.forEach(updateAccordionHeight);
        });
      }

      function initFilters() {
        filterButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            filterButtons.forEach(function (item) {
              item.classList.remove("is-active");
            });
            button.classList.add("is-active");
            filterRiskCards(button.dataset.filter);
          });
        });
      }

      function fallbackCopy(text) {
        var temp = document.createElement("textarea");
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand("copy");
        temp.remove();
      }

      function initCopyButtons() {
        copyButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            var text = button.getAttribute("data-copy") || "";
            var copier = navigator.clipboard && navigator.clipboard.writeText
              ? navigator.clipboard.writeText(text)
              : Promise.resolve().then(function () {
                fallbackCopy(text);
              });

            copier.then(function () {
              button.classList.add("is-copied");
              window.setTimeout(function () {
                button.classList.remove("is-copied");
              }, 1500);
            });
          });
        });
      }

      function formatDateICS(rawDate) {
        return rawDate.replace(/-/g, "") + "T090000";
      }

      function downloadICS(title, date) {
        var ics = [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//ContractAI by BrightAI//AR",
          "BEGIN:VEVENT",
          "UID:" + Date.now() + "@brightai.site",
          "DTSTAMP:20260309T090000",
          "DTSTART:" + formatDateICS(date),
          "DTEND:" + formatDateICS(date),
          "SUMMARY:" + title,
          "DESCRIPTION:موعد مستخرج من تحليل العقد عبر ContractAI by BrightAI",
          "END:VEVENT",
          "END:VCALENDAR"
        ].join("\r\n");

        var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = title + ".ics";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      }

      function initCalendarExport() {
        calendarButtons.forEach(function (button) {
          button.addEventListener("click", function () {
            var card = button.closest(".timeline-card");
            downloadICS(card.dataset.icsTitle, card.dataset.icsDate);
            showToast("✅ تم تصدير التقرير بنجاح", "success");
          });
        });

        if (exportAllDates) {
          exportAllDates.addEventListener("click", function () {
            var events = calendarButtons.map(function (button) {
              var card = button.closest(".timeline-card");
              return {
                title: card.dataset.icsTitle,
                date: card.dataset.icsDate
              };
            });

            var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ContractAI by BrightAI//AR"];
            events.forEach(function (event, index) {
              ics.push("BEGIN:VEVENT");
              ics.push("UID:" + (Date.now() + index) + "@brightai.site");
              ics.push("DTSTAMP:20260309T090000");
              ics.push("DTSTART:" + formatDateICS(event.date));
              ics.push("DTEND:" + formatDateICS(event.date));
              ics.push("SUMMARY:" + event.title);
              ics.push("DESCRIPTION:موعد مستخرج من تحليل العقد عبر ContractAI by BrightAI");
              ics.push("END:VEVENT");
            });
            ics.push("END:VCALENDAR");
            var blob = new Blob([ics.join("\r\n")], {
              type: "text/calendar;charset=utf-8"
            });
            var url = URL.createObjectURL(blob);
            var link = document.createElement("a");
            link.href = url;
            link.download = "contractai-deadlines.ics";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showToast("✅ تم تصدير التقرير بنجاح", "success");
          });
        }
      }

      function getGaugeColor(score) {
        if (score <= 30) {
          return "#22c55e";
        }
        if (score <= 60) {
          return "#fbbf24";
        }
        if (score <= 85) {
          return "#fb923c";
        }
        return "#ff4757";
      }

      function getGaugeLabel(score) {
        if (score <= 30) {
          return "منخفضة";
        }
        if (score <= 60) {
          return "متوسطة";
        }
        if (score <= 85) {
          return "عالية";
        }
        return "حرجة";
      }

      function animateGauge(target) {
        if (gaugeAnimated) {
          return;
        }

        gaugeAnimated = true;
        var totalLength = riskGauge.getTotalLength();
        var startTime = null;
        var duration = 1600;

        function step(timestamp) {
          if (!startTime) {
            startTime = timestamp;
          }

          var progress = Math.min((timestamp - startTime) / duration, 1);
          var score = Math.round(target * progress);
          var filled = (totalLength * score) / 100;
          var color = getGaugeColor(score);
          riskGauge.style.strokeDasharray = filled + " " + totalLength;
          riskGauge.style.stroke = color;
          gaugeScore.textContent = String(score);
          gaugeStatus.textContent = getGaugeLabel(score);
          gaugeStatus.style.color = color;

          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        }

        riskGauge.style.strokeDasharray = "0 " + totalLength;
        window.requestAnimationFrame(step);
      }

      function showResultsDashboard() {
        resultsDashboard.style.display = "grid";
        resultsDashboard.classList.add("is-visible");
        // animateGauge(72); يتم الاستدعاء من updateDashboardWithAIResponse الآن
        window.requestAnimationFrame(function () {
          accordionItems.forEach(updateAccordionHeight);
        });
      }

      function updateDashboardWithAIResponse(data) {
        // تحديث العدادات الرئيسية
        if (data.contractValue) {
          const valueText = data.contractValue.toString();
          document.querySelector('.quick-metric .metric-value').textContent = valueText;
        }

        if (data.riskScore !== undefined) {
          document.getElementById('gaugeScore').textContent = data.riskScore;
          document.getElementById('gaugeScore').dataset.target = data.riskScore;
          animateGauge(data.riskScore);

          let tone = formatRiskTone(data.riskScore);
          document.getElementById('gaugeStatus').textContent = tone.label.replace(/^[🔴🟡🟢]\s\d+\s/, "");
        }

        // تحديث قسم البنود الخطرة (High Risk Clauses)
        if (data.highRiskClauses && data.highRiskClauses.length > 0) {
          const dangerTabLabel = document.querySelector('[data-tab="danger"]');
          if (dangerTabLabel) dangerTabLabel.textContent = `🔴 البنود الخطرة (${data.highRiskClauses.length})`;

          const riskCardsContainer = document.querySelector('.risk-cards');
          if (riskCardsContainer) {
            let cardsHTML = '';
            data.highRiskClauses.forEach((clause) => {
              cardsHTML += `
                <article class="risk-card" data-risk="high">
                  <div class="risk-header">
                    <div>
                      <h3 class="risk-heading">${escapeHTML(clause.clauseTitle)}</h3>
                    </div>
                    <span class="risk-badge high">خطورة عالية</span>
                  </div>
                  <div class="risk-section">
                    <p class="risk-section-label">سبب الخطورة والمشكلة</p>
                    <p>${escapeHTML(clause.description)}</p>
                  </div>
                </article>
              `;
            });
            riskCardsContainer.innerHTML = cardsHTML;
          }
        }

        // تحديث نقاط التفاوض بناءً على التوصيات
        if (data.recommendations && data.recommendations.length > 0) {
          const negotiationTabLabel = document.querySelector('[data-tab="negotiation"]');
          if (negotiationTabLabel) negotiationTabLabel.textContent = `💡 نقاط التفاوض (${data.recommendations.length})`;

          const negotiationGrid = document.querySelector('.negotiation-grid');
          if (negotiationGrid) {
            let negotiationHTML = '';
            data.recommendations.forEach((rec, idx) => {
              negotiationHTML += `
                <article class="negotiation-card">
                  <div class="negotiation-head">
                    <span class="negotiation-number">${idx + 1}</span>
                    <div>
                      <h3 class="negotiation-heading">${escapeHTML(rec)}</h3>
                    </div>
                  </div>
                  <div class="alt-box">تمت صياغة هذه النقطة بناءً على التحليل الذكي للعقد الخاص بك.</div>
                  <button class="icon-button copy-button" type="button" data-copy="${escapeHTML(rec)}" aria-label="نسخ التوصية">نسخ التوصية</button>
                </article>
              `;
            });
            negotiationGrid.innerHTML = negotiationHTML;
            // إعادة تفعيل أزرار النسخ الجديدة
            initCopyButtons();
          }
        }
      }

      function scrollChatToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      function setQuickPromptsVisible(visible) {
        quickPrompts.classList.toggle("is-hidden", !visible);
      }

      function autoResizeChatInput() {
        chatInput.style.height = "auto";
        chatInput.style.height = Math.min(chatInput.scrollHeight, 124) + "px";
      }

      function updateChatComposerState() {
        var length = chatInput.value.length;
        chatCharCount.textContent = length + " / 500";
        sendChat.classList.toggle("is-ready", length > 0);
        autoResizeChatInput();
      }

      function createChatMessage(role, content) {
        var article = document.createElement("article");
        article.className = "chat-message " + role;
        article.innerHTML =
          '<div class="chat-message-header">' +
          '<span class="chat-author">' +
          (role === "ai"
            ? '<span class="chat-author-icon">AI</span>ContractAI by BrightAI'
            : "أنت") +
          "</span>" +
          '<span class="chat-time">منذ لحظات</span>' +
          "</div>" +
          '<div class="chat-message-body"></div>';
        article.querySelector(".chat-message-body").innerHTML = formatChatContent(content);
        chatMessages.insertBefore(article, typingIndicator);
        scrollChatToBottom();
      }

      function escapeHTML(value) {
        return value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      function formatChatContent(content) {
        var escaped = escapeHTML(content).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return escaped
          .split(/\n\n+/)
          .map(function (block) {
            var trimmed = block.trim();
            if (!trimmed) {
              return "";
            }

            if (/^-\s/m.test(trimmed)) {
              return (
                "<ul>" +
                trimmed
                  .split("\n")
                  .map(function (line) {
                    return line.trim();
                  })
                  .filter(Boolean)
                  .map(function (line) {
                    return "<li>" + line.replace(/^-\s*/, "") + "</li>";
                  })
                  .join("") +
                "</ul>"
              );
            }

            return "<p>" + trimmed.replace(/\n/g, "<br>") + "</p>";
          })
          .join("");
      }

      function getAIResponse(question) {
        var q = question.toLowerCase();

        if (q.indexOf("خطر") !== -1 || q.indexOf("أخطر") !== -1) {
          return "🔴 أخطر بند في هذا العقد هو **البند 14.2 (الغرامات)**:\n\nتفرض غرامة 2% يومياً عن كل يوم تأخير، بينما المعدل في السوق السعودي هو 0.5-1%.\n\n**التأثير المالي:**\n- تأخير 5 أيام = 245,000 ريال\n- تأخير 10 أيام = 490,000 ريال (20% من العقد!)\n\n**توصيتي:** تفاوض لتخفيضها إلى 0.5% مع فترة سماح 15 يوم.\n\nهل تريد مساعدة في صياغة خطاب تفاوض؟";
        }

        if (q.indexOf("غرامة") !== -1 || q.indexOf("غرامات") !== -1) {
          return "⚠️ العقد يتضمن 3 أنواع من الغرامات:\n\n1. **غرامة التأخير:** 2% يومياً (البند 14.2) — مرتفعة جداً\n2. **غرامة الجودة:** 5% من قيمة الدفعة (البند 16.1) — ضمن المعدل\n3. **غرامة عدم الالتزام:** 10,000 ريال لكل مخالفة (البند 18.3) — مقبولة\n\n**إجمالي التعرض الأقصى:** 490,000 ريال (20% من قيمة العقد)\n**معدل السوق:** 5-10% كحد أقصى\n\nهل تريد تفصيل أكثر عن أي غرامة؟";
        }

        if (q.indexOf("إنهاء") !== -1 || q.indexOf("فسخ") !== -1) {
          return "📋 حقوقك عند الإنهاء المبكر حسب البند 22.1:\n\n**الوضع الحالي (غير عادل):**\n- يحق للطرف الأول الإنهاء بدون أسباب أو تعويض ❌\n- يجب عليك تسليم كل الأعمال المنجزة ❌\n- لا يوجد إشعار مسبق ❌\n\n**ما يجب أن يكون (المعيار السعودي):**\n- إشعار مسبق 60-90 يوم ✅\n- تعويض عن الأعمال المنجزة ✅\n- تعويض عن المواد المشتراة ✅\n- هامش ربح معقول (10-15%) ✅\n\nننصح بشدة بتعديل هذا البند قبل التوقيع.";
        }

        if (q.indexOf("لخص") !== -1 || q.indexOf("ملخص") !== -1) {
          return "✍️ ملخص العقد في 5 نقاط:\n\n1. **الأطراف:** شركة الإنشاءات المتحدة (عميل) ↔ مؤسسة التوريدات الحديثة (مورد)\n2. **القيمة والمدة:** 2,450,000 ريال لمدة 18 شهراً مع إمكانية التمديد\n3. **الالتزام الرئيسي:** توريد مواد بناء على 5 دفعات حسب جدول زمني محدد\n4. **أبرز المخاطر:** غرامات مرتفعة (2% يومياً) + إنهاء أحادي بدون تعويض\n5. **التوصية:** ⚠️ لا نوصي بالتوقيع قبل تعديل 4 بنود عالية الخطورة\n\nهل تريد تقرير تفصيلي أو خطاب تفاوض؟";
        }

        return "شكراً لسؤالك! بناءً على تحليلي للعقد:\n\nهذا العقد يحتاج إلى انتباه في عدة نقاط. أنصحك بمراجعة قسم «البنود الخطرة» في التقرير أعلاه.\n\nيمكنك سؤالي بشكل أكثر تحديداً عن:\n- بند معين (اذكر رقمه)\n- موضوع محدد (غرامات، إنهاء، ملكية فكرية...)\n- طلب صياغة (خطاب تفاوض، رد رسمي...)";
      }

      async function sendChatMessage(text) {
        var trimmed = text.trim();
        if (!trimmed) {
          return;
        }

        createChatMessage("user", trimmed);
        setQuickPromptsVisible(false);
        chatInput.value = "";
        updateChatComposerState();
        typingIndicator.classList.add("is-visible");
        scrollChatToBottom();

        try {
          const systemMsg = `أنت مساعد ذكي ومحامي سعودي متخصص في تحليل العقود. أجب على أسئلة المستخدم بوضوح واختصار، بناءً على النص المستخرج من العقد أدناه:

نص العقد المستخرج:
"""
\${extractedContractText ? extractedContractText.substring(0, 15000) : "لا يوجد عقد متاح حالياً. اطلب من المستخدم رفع عقد أولاً."}
"""`;

          const response = await ContractAIAPI.callAIWithFallback([
            { role: "system", content: systemMsg },
            { role: "user", content: trimmed }
          ]);

          typingIndicator.classList.remove("is-visible");
          createChatMessage("ai", response.result);

        } catch (error) {
          console.error("Chat Error:", error);
          typingIndicator.classList.remove("is-visible");
          createChatMessage("ai", "عذراً، لم أتمكن من معالجة سؤالك حالياً بسبب مشكلة في الاتصال. يرجى المحاولة لاحقاً.");
        }
      }

      function openChatPanel() {
        chatPanel.classList.add("is-open");
        chatPanel.setAttribute("aria-hidden", "false");
        chatOverlay.hidden = false;
        chatOverlay.classList.add("is-visible");
        body.classList.add("menu-open");
        window.setTimeout(function () {
          chatInput.focus();
        }, 80);
      }

      function closeChatPanel() {
        chatPanel.classList.remove("is-open");
        chatPanel.setAttribute("aria-hidden", "true");
        chatOverlay.classList.remove("is-visible");
        chatOverlay.hidden = true;
        body.classList.remove("menu-open");
        chatFab.focus();
      }

      function clearChatMessages() {
        Array.prototype.slice
          .call(chatMessages.querySelectorAll('.chat-message:not([data-chat-static="welcome"])'))
          .forEach(function (message) {
            message.remove();
          });
        typingIndicator.classList.remove("is-visible");
        setQuickPromptsVisible(true);
        scrollChatToBottom();
      }

      setTheme(getPreferredTheme());
      initCounters();
      initAccordions();
      initTabs();
      initFilters();
      initCopyButtons();
      initCalendarExport();
      activateTab("danger");
      renderContractsTable();
      updateChatComposerState();
      showToast("⚠️ لديك 3 عقود تقترب مواعيدها النهائية", "warning");

      if (logoutButton) {
        logoutButton.addEventListener("click", function () {
          window.localStorage.removeItem(authKey);
          window.localStorage.removeItem("contractai-user-name");
          window.localStorage.setItem(toastKey, "👋 تم تسجيل الخروج");
          window.location.href = "/tenders/landing/";
        });
      }

      themeToggle.addEventListener("click", function () {
        setTheme(root.getAttribute("data-theme") === "light" ? "dark" : "light");
      });

      menuToggle.addEventListener("click", function () {
        toggleSidebar(true);
      });

      uploadNavLink.addEventListener("click", function (event) {
        event.preventDefault();
        switchView("upload");
      });

      contractsNavLink.addEventListener("click", function (event) {
        event.preventDefault();
        switchView("contracts");
      });

      closeSidebar.addEventListener("click", function () {
        toggleSidebar(false);
      });

      sidebarBackdrop.addEventListener("click", function () {
        toggleSidebar(false);
      });

      window.addEventListener("resize", function () {
        if (window.innerWidth > 1023) {
          sidebar.classList.remove("is-open");
          sidebarBackdrop.classList.remove("is-visible");
          sidebarBackdrop.hidden = true;
          body.classList.remove("menu-open");
          menuToggle.setAttribute("aria-expanded", "false");
        }
      });

      window.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
          event.preventDefault();
          searchInput.focus();
        }

        if (event.key === "Escape" && sidebar.classList.contains("is-open")) {
          toggleSidebar(false);
        }

        if (event.key === "Escape" && chatPanel.classList.contains("is-open")) {
          closeChatPanel();
        }

        if (event.key === "Escape" && pdfModal.classList.contains("is-open")) {
          closeModal(pdfModal);
        }

        if (event.key === "Escape" && emailModal.classList.contains("is-open")) {
          closeModal(emailModal);
        }
      });

      document.addEventListener("click", function (event) {
        if (!event.target.closest(".row-actions")) {
          closeAllActionMenus();
        }
      });

      dropZone.addEventListener("click", openPicker);
      dropZone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openPicker();
        }
      });

      ["dragenter", "dragover", "dragleave", "drop"].forEach(function (eventName) {
        dropZone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
        });
      });

      dropZone.addEventListener("dragenter", function () {
        dragDepth += 1;
        dropZone.classList.add("is-dragover");
        uploadTitle.textContent = "أفلت الملف هنا!";
      });

      dropZone.addEventListener("dragover", function () {
        dropZone.classList.add("is-dragover");
        uploadTitle.textContent = "أفلت الملف هنا!";
      });

      dropZone.addEventListener("dragleave", function () {
        dragDepth -= 1;
        if (dragDepth <= 0) {
          dragDepth = 0;
          dropZone.classList.remove("is-dragover");
          if (!currentFile) {
            uploadTitle.textContent = "اسحب العقد أو المناقصة هنا";
          }
        }
      });

      dropZone.addEventListener("drop", function (event) {
        dragDepth = 0;
        dropZone.classList.remove("is-dragover");
        if (event.dataTransfer.files && event.dataTransfer.files[0]) {
          handleFile(event.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", function () {
        if (fileInput.files && fileInput.files[0]) {
          handleFile(fileInput.files[0]);
        }
      });

      removeFile.addEventListener("click", function () {
        clearFile();
      });

      startAnalysis.addEventListener("click", async function () {
        if (!currentFile) {
          showInlineError("اختر ملفاً صالحاً أولاً قبل بدء التحليل.");
          return;
        }

        if (progressValue.textContent !== "100%") {
          showToast("انتظر حتى يكتمل رفع الملف 100% قبل الانتقال للتحليل.", "info");
          return;
        }

        if (!extractedContractText) {
          showToast("عذراً، لم يتم استخراج أي نص من الملف حتى الآن، جاري المحاولة...", "warning");
          return;
        }

        // تغيير حالة الزر ليعكس حالة التحميل
        var originalText = startAnalysis.textContent;
        startAnalysis.textContent = "جارِ تحليل العقد بالذكاء الاصطناعي...";
        startAnalysis.disabled = true;

        try {
          const prompt = `أنت محامي بارع ومستشار عقود سعودي. قم بتحليل هذا العقد بعناية.
بناءً على النص التالي، قم بتوليد تقرير تحليل بصيغة JSON حصراً، يحتوي على الهيكل الدقيق التالي (يجب ألا تقوم بطباعة أي شيء سوى JSON صالح، لا تحيطه بعلامات \`\`\`json):

{
  "contractTitle": "اسم العقد المُستنتج",
  "contractValue": "قيمة العقد إذا وُجدت، أو 'غير محدد'",
  "riskScore": [رقم من 0 إلى 100 يعبر عن درجة خطورة العقد إجمالاً],
  "summary": "ملخص فقرة واحدة لأهم ما تضمنه العقد والمخاطر الرئيسية",
  "highRiskClauses": [
    { "clauseTitle": "عنوان البند", "description": "شرح مبسط للمشكلة في البند" },
    ...
  ],
  "recommendations": [
    "توصية 1",
    "توصية 2",
    ...
  ]
}

إليك نص العقد:
"""
\${extractedContractText.substring(0, 15000)}
"""`;

          const aiResponse = await ContractAIAPI.callAIWithFallback([
            { role: "system", content: "You are a specialized legal AI assistant. You must output valid JSON only, without markdown wrapping. Do not include formatting like ```json" },
            { role: "user", content: prompt }
          ], {
             temperature: 0.1, // لضمان ثبات هيكل JSON
             maxTokens: 2000
          });

          console.log("استجابة الـ AI الأصلية:", aiResponse.result);

          // تنظيف استجابة الـ AI من أي markdown tags إن وجدت
          let cleanJsonString = aiResponse.result.trim();
          if (cleanJsonString.startsWith("```json")) {
            cleanJsonString = cleanJsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleanJsonString.startsWith("```")) {
             cleanJsonString = cleanJsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          const parsedData = JSON.parse(cleanJsonString);

          showToast("تم إكمال التحليل ببياناتك الحقيقية!", "success");
          updateDashboardWithAIResponse(parsedData);

          // تحديث رسالة الترحيب في الشات لتشمل ملخص العقد
          const chatWelcome = document.getElementById('chatWelcomeMessage');
          if (chatWelcome && parsedData.summary) {
             chatWelcome.innerHTML = `مرحباً! 👋 لقد حللت العقد بالكامل وإليك ملخص سريع:<br><br><strong>${escapeHTML(parsedData.summary)}</strong><br><br>يمكنك سؤالي عن أي بند أو طلب تفصيل لأي نقطة.`;
          }

          showResultsDashboard();
          resultsDashboard.scrollIntoView({ behavior: "smooth", block: "start" });

        } catch (error) {
          console.error("فشل التحليل الذكي:", error);
          showToast("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي أو تحليل البيانات.", "error");
        } finally {
          startAnalysis.textContent = originalText;
          startAnalysis.disabled = false;
        }
      });

      window.ContractAIResults = {
        show: showResultsDashboard
      };

      exportButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          var action = button.getAttribute("data-export");
          if (action === "pdf-preview") {
            openModal(pdfModal);
          } else if (action === "docx" || action === "xlsx") {
            showToast("✅ تم تصدير التقرير بنجاح", "success");
          } else if (action === "copy-summary") {
            var summary = "عقد توريد مواد بناء بقيمة 2,450,000 ريال لمدة 18 شهراً، يتضمن 47 بنداً و4 بنود عالية الخطورة مع توفير متوقع 340,000 ريال.";
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(summary);
            } else {
              fallbackCopy(summary);
            }
            showToast("✅ تم نسخ النص للحافظة", "success");
          } else if (action === "share-link") {
            var link = "https://brightai.site/tenders/share/report-temp-72";
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(link);
            } else {
              fallbackCopy(link);
            }
            showToast("✅ تم إنشاء رابط المشاركة ونسخه", "success");
          } else if (action === "ics") {
            if (exportAllDates) {
              exportAllDates.click();
            }
          }
        });
      });

      [pdfModal, emailModal].forEach(function (modal) {
        modal.addEventListener("click", function (event) {
          if (event.target === modal) {
            closeModal(modal);
          }
        });
      });

      closePdfModal.addEventListener("click", function () {
        closeModal(pdfModal);
      });

      closeEmailModal.addEventListener("click", function () {
        closeModal(emailModal);
      });

      openEmailModalBtn.addEventListener("click", function () {
        openModal(emailModal);
      });

      downloadPdfBtn.addEventListener("click", function () {
        showToast("✅ تم بدء التحميل", "success");
      });

      printPdfBtn.addEventListener("click", function () {
        showToast("✅ تم فتح وضع الطباعة", "success");
      });

      sendEmailBtn.addEventListener("click", function () {
        if (!emailAddressInput.value.trim()) {
          showToast("❌ أدخل البريد الإلكتروني أولاً", "error");
          return;
        }
        showToast("✅ تم إرسال التقرير بنجاح", "success");
        closeModal(emailModal);
        emailAddressInput.value = "";
      });

      [contractsSearch, typeFilter, riskFilter, dateFilter].forEach(function (control) {
        control.addEventListener("input", function () {
          currentPage = 1;
          renderContractsTable();
        });
        control.addEventListener("change", function () {
          currentPage = 1;
          renderContractsTable();
        });
      });

      clearContractsFilters.addEventListener("click", function () {
        contractsSearch.value = "";
        typeFilter.value = "all";
        riskFilter.value = "all";
        dateFilter.value = "all";
        currentPage = 1;
        renderContractsTable();
      });

      contractsPrev.addEventListener("click", function () {
        if (currentPage > 1) {
          currentPage -= 1;
          renderContractsTable();
        }
      });

      contractsNext.addEventListener("click", function () {
        var totalPages = Math.max(1, Math.ceil(getFilteredContracts().length / pageSize));
        if (currentPage < totalPages) {
          currentPage += 1;
          renderContractsTable();
        }
      });

      contractsHeaders.forEach(function (header) {
        header.addEventListener("click", function () {
          var key = header.getAttribute("data-sort");
          if (currentSortKey === key) {
            currentSortDir = currentSortDir === "asc" ? "desc" : "asc";
          } else {
            currentSortKey = key;
            currentSortDir =
              key === "name" || key === "type" || key === "status" ? "asc" : "desc";
          }
          renderContractsTable();
        });
      });

      chatFab.addEventListener("click", openChatPanel);
      closeChat.addEventListener("click", closeChatPanel);
      chatOverlay.addEventListener("click", closeChatPanel);
      clearChat.addEventListener("click", clearChatMessages);

      quickPromptButtons.forEach(function (button) {
        button.addEventListener("click", function () {
          sendChatMessage(button.textContent.trim());
        });
      });

      chatInput.addEventListener("input", updateChatComposerState);
      chatInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          sendChatMessage(chatInput.value);
        }
      });

      sendChat.addEventListener("click", function () {
        sendChatMessage(chatInput.value);
      });

      chatPanel.addEventListener("touchstart", function (event) {
        chatTouchStartX = event.changedTouches[0].clientX;
      });

      chatPanel.addEventListener("touchend", function (event) {
        var delta = chatTouchStartX - event.changedTouches[0].clientX;
        if (delta > 70) {
          closeChatPanel();
        }
      });
    })();
