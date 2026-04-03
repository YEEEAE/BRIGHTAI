(function () {
            var authKey = "contractai-authenticated";
            var toastKey = "contractai-auth-toast";
            if (window.localStorage.getItem(authKey) !== "true") {
                window.location.replace("/en/tenders/landing/");
                return;
            }
            var root = document.documentElement;
            var body = document.body;
            var storageKey = "contractai-theme";
            var logoutButton = document.querySelector(".logout-button");
            var menuToggle = document.getElementById("menuToggle");
            var closeSidebar = document.getElementById("closeSidebar");
            var sidebar = document.getElementById("sidebar");
            var sidebarBackdrop = document.getElementById("sidebarBackdrop");
            var themeToggle = document.getElementById("themeToggle");
            var themeIcon = document.getElementById("themeIcon");
            var searchInput = document.getElementById("templateSearch");
            var sortSelect = document.getElementById("sortSelect");
            var categoryTabs = Array.prototype.slice.call(document.querySelectorAll(".filter-tab"));
            var templatesGrid = document.getElementById("templatesGrid");
            var modal = document.getElementById("previewModal");
            var modalOverlay = document.getElementById("modalOverlay");
            var closePreviewModal = document.getElementById("closePreviewModal");
            var previewUseButton = document.getElementById("previewUseButton");
            var previewDownloadButton = document.getElementById("previewDownloadButton");
            var previewName = document.getElementById("previewName");
            var previewCategory = document.getElementById("previewCategory");
            var previewDescription = document.getElementById("previewDescription");
            var previewClauses = document.getElementById("previewClauses");
            var previewNotes = document.getElementById("previewNotes");
            var previewPage = document.getElementById("previewDocumentPage");
            var previewModalTitle = document.getElementById("previewModalTitle");
            var previewModalSubtitle = document.getElementById("previewModalSubtitle");
            var editorShell = document.getElementById("editorShell");
            var editorTitle = document.getElementById("editorTitle");
            var editorSubtitle = document.getElementById("editorSubtitle");
            var editorSurface = document.getElementById("editorSurface");
            var saveDraftButton = document.getElementById("saveDraftButton");
            var downloadTemplateButton = document.getElementById("downloadTemplateButton");
            var toastStack = document.getElementById("toastStack");
            var toolbarButtons = Array.prototype.slice.call(document.querySelectorAll(".toolbar button"));

            var currentCategory = "all";
            var activeTemplate = null;

            var categoryColors = {
                "Gov": "#22c55e",
                "Commercial": "#00e5b4",
                "Real Estate": "#f59e0b",
                "Tech": "#3b82f6",
                "Services": "#a78bfa"
            };

            var templates = [
                {
                    id: 1,
                    title: "Material Supply Contract",
                    category: "Gov",
                    description: "Supply contract template fully compliant with Saudi Gov Tenders. Built by our ai software, it covers delivery, warranties, and fines.",
                    pages: 12,
                    usage: 1247,
                    rating: 4.8,
                    badge: "Most Popular",
                    latestOrder: 2,
                    clauses: ["Party Details", "Supply Scope & Specs", "Delivery Schedule", "Bank Guarantee & Fines"],
                    notes: "Perfect for gov and semi-gov supply deals. Just plug in your project specs, quantities, and cash details.",
                    preview: "<h4>Material Supply Contract</h4><p>With God's help, this agreement was made on <strong>March 9, 2026</strong> between <span class='token-chip'>[Enter Entity Name]</span> as the First Party, and <span class='token-chip'>[Enter Supplier Name]</span> as the Second Party, to supply building materials matching the specs approved in the tender docs.</p><p><strong>Clause One:</strong> The supplier commits to delivering the goods within the timelines in the BOQ, keeping everything up to spec and legally compliant.</p><p><strong>Clause Two:</strong> If there's a delay, fines hit according to the legal cap, with a grace period given before penalties trigger.</p><p><strong>Clause Three:</strong> The supplier hands over initial and final bank guarantees as per the rules, making them a core part of their obligations.</p>"
                },
                {
                    id: 2,
                    title: "Gov Tender (Etimad)",
                    category: "Gov",
                    description: "Tender template totally locked in with the Etimad platform. Includes RFP specs and technical/financial offer forms.",
                    pages: 18,
                    usage: 892,
                    rating: 4.7,
                    badge: "",
                    latestOrder: 1,
                    clauses: ["RFP Document", "Technical Requirements", "Evaluation Criteria", "Financial Offer Form"],
                    notes: "Useful for legal and procurement teams preparing official bids and Etimad-aligned submissions.",
                    preview: "<h4>Gov Tender via Etimad</h4><p>This tender is issued to secure <span class='token-chip'>[Enter Project Description]</span> for <span class='token-chip'>[Enter Gov Entity Name]</span> under the applicable government procurement rules.</p><p><strong>Chapter One:</strong> Includes the scope of work, specifications, and technical standards every bidder must follow.</p><p><strong>Chapter Two:</strong> Bidders submit their financial offer within the stated deadline together with a valid initial guarantee letter.</p><p><strong>Chapter Three:</strong> Offers are reviewed technically first and then financially, based on the evaluation weights in the tender documents.</p>"
                },
                {
                    id: 3,
                    title: "Consulting Services Contract",
                    category: "Commercial",
                    description: "Consulting agreement covering the scope of work, KPIs, payment terms, and confidentiality obligations.",
                    pages: 8,
                    usage: 634,
                    rating: 4.6,
                    badge: "",
                    latestOrder: 5,
                    clauses: ["Scope of Work", "KPIs", "Confidentiality & NDA", "Payment Mechanics"],
                    notes: "Suitable for short to mid-term consulting engagements and easy to extend with detailed deliverables.",
                    preview: "<h4>Consulting Services Contract</h4><p>Both parties agree to provide specialized consulting in <span class='token-chip'>[Enter Field/Domain]</span> for a duration of <span class='token-chip'>[Enter Duration]</span>.</p><p><strong>Clause One:</strong> The scope of work includes reports, workshops, regular check-ins, and execution tracking against the approved plan.</p><p><strong>Clause Two:</strong> Performance is measured through clear KPIs such as deliverable quality, turnaround time, and stakeholder satisfaction.</p><p><strong>Clause Three:</strong> Both parties must keep all confidential information protected and may not disclose it without written consent.</p>"
                },
                {
                    id: 4,
                    title: "Commercial Lease Agreement",
                    category: "Real Estate",
                    description: "Lease contract perfectly synced with the Ejar platform. Covers rent, renewals, evictions, and maintenance.",
                    pages: 6,
                    usage: 1105,
                    rating: 4.9,
                    badge: "Top Rated",
                    latestOrder: 4,
                    clauses: ["Leased Unit", "Duration & Value", "Renewal & Eviction", "Maintenance & Insurance"],
                    notes: "Built specifically for standard practices in the Saudi commercial real estate scene.",
                    preview: "<h4>Commercial Lease Agreement</h4><p>The Second Party leased the property located at <span class='token-chip'>[Enter Location]</span> for <span class='token-chip'>[Enter Duration]</span> at a rent value of <span class='token-chip'>[Enter Amount]</span>.</p><p><strong>Clause One:</strong> The tenant must only use the unit for the agreed activity, sticking to all municipal rules.</p><p><strong>Clause Two:</strong> Renewals need a written thumbs-up from both sides at least 60 days before the contract dies.</p><p><strong>Clause Three:</strong> The landlord handles core maintenance, while the tenant deals with day-to-day operational fixes.</p>"
                },
                {
                    id: 5,
                    title: "Software Development Contract",
                    category: "Tech",
                    description: "Software development agreement covering project phases, deliverables, IP rights, and SLA commitments.",
                    pages: 10,
                    usage: 421,
                    rating: 4.5,
                    badge: "",
                    latestOrder: 3,
                    clauses: ["Phases & Deliverables", "SLA", "Intellectual Property", "Maintenance & Support"],
                    notes: "Useful for technology teams and organizations building digital products or internal platforms.",
                    preview: "<h4>Software Development Contract</h4><p>The Second Party will provide development services for <span class='token-chip'>[Enter System Name]</span> based on the approved technical specifications and project timeline.</p><p><strong>Clause One:</strong> The project is split into clear phases: analysis, design, development, testing, and final launch.</p><p><strong>Clause Two:</strong> Intellectual property for the final output transfers to the First Party after full payment, while the provider retains ownership of its generic tools and methods.</p><p><strong>Clause Three:</strong> The provider commits to an SLA that defines response times, fixes, and post-launch support.</p>"
                },
                {
                    id: 6,
                    title: "Construction Contract",
                    category: "Gov",
                    description: "Heavy-duty construction contract covering BOQs, blueprints, timelines, handover conditions, and warranties.",
                    pages: 22,
                    usage: 756,
                    rating: 4.7,
                    badge: "",
                    latestOrder: 6,
                    clauses: ["BOQs", "Project Timeline", "Initial & Final Handover", "Warranties & Maintenance"],
                    notes: "Designed for high-stakes construction gigs. Just attach your tables and blueprints.",
                    preview: "<h4>Construction Contract</h4><p>Agreed to execute the <span class='token-chip'>[Enter Project Type]</span> works according to the approved blueprints and BOQs attached to this contract.</p><p><strong>Clause One:</strong> The contractor commits to getting the job done within the contract period and dropping a detailed execution plan.</p><p><strong>Clause Two:</strong> Payments are tied to approved invoices and actual completion percentages after quality checks.</p><p><strong>Clause Three:</strong> The contractor must guarantee the works for the specified maintenance period and fix defects within the agreed response times.</p>"
                },
                {
                    id: 7,
                    title: "Non-Disclosure Agreement (NDA)",
                    category: "Commercial",
                    description: "Mutual NDA to lock down confidential intel and IP.",
                    pages: 4,
                    usage: 2341,
                    rating: 4.8,
                    badge: "",
                    latestOrder: 7,
                    clauses: ["Confidential Info Definition", "Usage Limits", "Commitment Duration", "Legal Exceptions"],
                    notes: "Fast and perfect for initial negotiation phases or sharing sensitive data.",
                    preview: "<h4>Non-Disclosure Agreement</h4><p>Both parties acknowledge they might see confidential info regarding projects, data, or operational plans, and commit not to leak or use it outside this deal.</p><p><strong>Clause One:</strong> Confidential info includes all written, oral, or digital data flagged by either party as secret.</p><p><strong>Clause Two:</strong> The receiving party won't copy or share the info with any third party without prior written consent.</p><p><strong>Clause Three:</strong> Confidentiality lasts for <span class='token-chip'>[Enter Number of Years]</span> from the date the relationship ends.</p>"
                },
                {
                    id: 8,
                    title: "O&M Contract",
                    category: "Services",
                    description: "Operations and maintenance contract covering SOW, preventive maintenance schedules, spare parts, and SLA.",
                    pages: 14,
                    usage: 503,
                    rating: 4.6,
                    badge: "",
                    latestOrder: 8,
                    clauses: ["O&M Scope", "Preventive Maintenance", "Spare Parts", "SLA & Reporting"],
                    notes: "Perfect for long-term O&M deals with strict KPIs and response matrices.",
                    preview: "<h4>O&M Contract</h4><p>The provider commits to operating and maintaining <span class='token-chip'>[Enter Location]</span> based on the attached preventive and corrective schedules.</p><p><strong>Clause One:</strong> SOW includes routine visits, emergency interventions, fault management, and dropping monthly reports.</p><p><strong>Clause Two:</strong> The supplier provides core spare parts based on approved lists, and replacements need standard approvals.</p><p><strong>Clause Three:</strong> Service is monitored via KPIs covering uptime, response speed, and fix quality.</p>"
                },
                {
                    id: 9,
                    title: "Framework Agreement",
                    category: "Gov",
                    description: "Framework agreement for multiple supply drops. Covers min/max limits and PO mechanics.",
                    pages: 10,
                    usage: 289,
                    rating: 4.4,
                    badge: "",
                    latestOrder: 9,
                    clauses: ["Agreement Period", "Purchase Orders", "Min & Max Limits", "Pricing Mechanics"],
                    notes: "Dope for recurring multi-batch contracts or on-demand purchase orders.",
                    preview: "<h4>Supply Framework Agreement</h4><p>This framework agreement sets the general terms for issuing multiple POs between <span class='token-chip'>[Enter Entity Name]</span> and <span class='token-chip'>[Enter Supplier Name]</span>.</p><p><strong>Clause One:</strong> The agreement doesn't force a purchase unless separate POs are issued while it's active.</p><p><strong>Clause Two:</strong> Min and max limits for quantities and values are set based on operational needs and available budgets.</p><p><strong>Clause Three:</strong> Prices and adjustment mechanics are governed by the rules in the approved financial annex.</p>"
                }
            ];

            function setTheme(theme) {
                root.setAttribute("data-theme", theme);
                themeIcon.innerHTML =
                    theme === "light"
                        ? '<path d="M20 12.5A8.5 8.5 0 1 1 11.5 4 6.5 6.5 0 0 0 20 12.5Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path>'
                        : '<path d="M12 3v2.25M12 18.75V21M5.64 5.64l1.59 1.59M16.77 16.77l1.59 1.59M3 12h2.25M18.75 12H21M5.64 18.36l1.59-1.59M16.77 7.23l1.59-1.59M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>';
                window.localStorage.setItem(storageKey, theme);
            }

            function getPreferredTheme() {
                var saved = window.localStorage.getItem(storageKey);
                if (saved === "light" || saved === "dark") return saved;
                return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
            }

            function toggleSidebar(open) {
                sidebar.classList.toggle("is-open", open);
                sidebarBackdrop.classList.toggle("is-visible", open);
                sidebarBackdrop.hidden = !open;
                body.classList.toggle("menu-open", open);
            }

            function showToast(message, type) {
                var toast = document.createElement("div");
                toast.className = "toast glass toast-" + (type || "info");
                toast.innerHTML =
                    '<span>' +
                    message +
                    '</span><button class="toast-close" type="button" aria-label="Close notification">✕</button>';

                toast.querySelector(".toast-close").addEventListener("click", function () {
                    toast.remove();
                });

                toastStack.appendChild(toast);
                window.setTimeout(function () {
                    toast.remove();
                }, 4000);
            }

            function categoryBadge(category) {
                var color = categoryColors[category] || "#00e5b4";
                return '<span class="category-badge" style="color:' + color + "; background:" + color + '18; border:1px solid ' + color + '38;">' + category + "</span>";
            }

            function createDocIcon(color) {
                return '<span class="template-icon" style="color:' + color + ';"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3.5h6l4 4V20a1 1 0 0 1-1 1H8a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M14 3.5V8h4M9 11.5h6M9 15h6M9 18.5h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></span>';
            }

            function getFilteredTemplates() {
                var query = (searchInput.value || "").trim().toLowerCase();
                var filtered = templates.filter(function (item) {
                    var matchCategory = currentCategory === "all" || item.category === currentCategory;
                    var matchQuery =
                        !query ||
                        item.title.toLowerCase().indexOf(query) !== -1 ||
                        item.description.toLowerCase().indexOf(query) !== -1;
                    return matchCategory && matchQuery;
                });

                if (sortSelect.value === "alpha") {
                    filtered.sort(function (a, b) {
                        return a.title.localeCompare(b.title, "en");
                    });
                } else if (sortSelect.value === "latest") {
                    filtered.sort(function (a, b) {
                        return a.latestOrder - b.latestOrder;
                    });
                } else {
                    filtered.sort(function (a, b) {
                        return b.usage - a.usage;
                    });
                }

                return filtered;
            }

            function renderTemplates() {
                var items = getFilteredTemplates();

                if (!items.length) {
                    templatesGrid.innerHTML = '<div class="empty-state glass">Couldn\'t find any templates matching your search or filters.</div>';
                    return;
                }

                templatesGrid.innerHTML = items
                    .map(function (item) {
                        var color = categoryColors[item.category] || "#00e5b4";
                        return (
                            '<article class="template-card glass" style="border-color:' +
                            color +
                            '22;">' +
                            '<div class="template-top"><div>' +
                            createDocIcon(color) +
                            '</div>' +
                            (item.badge ? '<span class="card-highlight">' + item.badge + "</span>" : "") +
                            "</div>" +
                            '<div style="display:grid; gap:10px;">' +
                            categoryBadge(item.category) +
                            '<h3 class="template-title">' +
                            item.title +
                            "</h3>" +
                            '<p class="template-description">' +
                            item.description +
                            "</p>" +
                            "</div>" +
                            '<div class="template-meta"><span>' +
                            item.pages +
                            ' pages</span><span>' +
                            item.usage.toLocaleString("en-US") +
                            ' uses</span><span class="rating-badge">⭐ ' +
                            item.rating +
                            "</span></div>" +
                            '<div class="template-actions"><button class="template-button" type="button" data-action="preview" data-id="' +
                            item.id +
                            '">Preview</button><button class="template-button is-primary" type="button" data-action="use" data-id="' +
                            item.id +
                            '">Use Template</button></div>' +
                            "</article>"
                        );
                    })
                    .join("");
            }

            function openModal(template) {
                activeTemplate = template;
                previewModalTitle.textContent = "Template Preview";
                previewModalSubtitle.textContent = template.title;
                previewName.textContent = template.title;
                previewCategory.textContent = template.category;
                previewCategory.style.color = categoryColors[template.category] || "#00e5b4";
                previewDescription.textContent = template.description;
                previewNotes.textContent = template.notes;
                previewClauses.innerHTML = template.clauses.map(function (clause) { return "<li>" + clause + "</li>"; }).join("");
                previewPage.innerHTML = template.preview;
                modal.classList.add("is-visible");
                modalOverlay.classList.add("is-visible");
                body.classList.add("modal-open");
            }

            function closeModal() {
                modal.classList.remove("is-visible");
                modalOverlay.classList.remove("is-visible");
                body.classList.remove("modal-open");
            }

            function placeholderMarkup(text) {
                return '<button class="token-chip" type="button" contenteditable="false">' + text + "</button>";
            }

            function buildEditorContent(template) {
                var content = template.preview
                    .replace(/\[Enter Entity Name\]/g, placeholderMarkup("[Enter Entity Name]"))
                    .replace(/\[Enter Supplier Name\]/g, placeholderMarkup("[Enter Supplier Name]"))
                    .replace(/\[Enter Project Description\]/g, placeholderMarkup("[Enter Project Description]"))
                    .replace(/\[Enter Gov Entity Name\]/g, placeholderMarkup("[Enter Gov Entity Name]"))
                    .replace(/\[Enter Field\/Domain\]/g, placeholderMarkup("[Enter Field/Domain]"))
                    .replace(/\[Enter Duration\]/g, placeholderMarkup("[Enter Duration]"))
                    .replace(/\[Enter Location\]/g, placeholderMarkup("[Enter Location]"))
                    .replace(/\[Enter Amount\]/g, placeholderMarkup("[Enter Amount]"))
                    .replace(/\[Enter System Name\]/g, placeholderMarkup("[Enter System Name]"))
                    .replace(/\[Enter Project Type\]/g, placeholderMarkup("[Enter Project Type]"))
                    .replace(/\[Enter Number of Years\]/g, placeholderMarkup("[Enter Number of Years]"))
                    .replace(/class='token-chip'/g, 'class="token-chip"');

                return content;
            }

            function openEditor(template) {
                activeTemplate = template;
                editorTitle.textContent = "Tweak Template: " + template.title;
                editorSubtitle.textContent = template.description;
                editorSurface.innerHTML = buildEditorContent(template);
                editorShell.classList.add("is-visible");
                closeModal();
                editorShell.scrollIntoView({ behavior: "smooth", block: "start" });
            }

            function replaceTokenWithInput(token) {
                var input = document.createElement("input");
                input.type = "text";
                input.className = "inline-token-input";
                input.value = token.textContent.replace(/[\[\]]/g, "");
                token.replaceWith(input);
                input.focus();
                input.select();

                function finalize() {
                    var span = document.createElement("span");
                    span.className = "token-chip";
                    span.textContent = input.value.trim() || "Value required";
                    span.setAttribute("role", "button");
                    span.setAttribute("tabindex", "0");
                    input.replaceWith(span);
                }

                input.addEventListener("blur", finalize, { once: true });
                input.addEventListener("keydown", function (event) {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        input.blur();
                    }
                });
            }

            if (logoutButton) {
                logoutButton.addEventListener("click", function () {
                    window.localStorage.removeItem(authKey);
                    window.localStorage.removeItem("contractai-user-name");
                    window.localStorage.setItem(toastKey, "👋 Catch you later! Logged out.");
                    window.location.href = "/en/tenders/landing/";
                });
            }

            themeToggle.addEventListener("click", function () {
                setTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
            });

            menuToggle.addEventListener("click", function () {
                toggleSidebar(true);
            });

            closeSidebar.addEventListener("click", function () {
                toggleSidebar(false);
            });

            sidebarBackdrop.addEventListener("click", function () {
                toggleSidebar(false);
            });

            categoryTabs.forEach(function (tab) {
                tab.addEventListener("click", function () {
                    categoryTabs.forEach(function (item) {
                        item.classList.remove("is-active");
                    });
                    tab.classList.add("is-active");
                    currentCategory = tab.getAttribute("data-category");
                    renderTemplates();
                });
            });

            searchInput.addEventListener("input", renderTemplates);
            sortSelect.addEventListener("change", renderTemplates);

            templatesGrid.addEventListener("click", function (event) {
                var button = event.target.closest("[data-action]");
                if (!button) return;
                var id = Number(button.getAttribute("data-id"));
                var template = templates.find(function (item) {
                    return item.id === id;
                });
                if (!template) return;
                if (button.getAttribute("data-action") === "preview") {
                    openModal(template);
                } else {
                    openEditor(template);
                }
            });

            closePreviewModal.addEventListener("click", closeModal);
            modalOverlay.addEventListener("click", closeModal);

            previewUseButton.addEventListener("click", function () {
                if (activeTemplate) openEditor(activeTemplate);
            });

            previewDownloadButton.addEventListener("click", function () {
                showToast("✅ PDF version of the template is ready", "success");
            });

            saveDraftButton.addEventListener("click", function () {
                showToast("✅ Draft saved", "success");
            });

            downloadTemplateButton.addEventListener("click", function () {
                showToast("✅ Download file is good to go", "info");
            });

            toolbarButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    var command = button.getAttribute("data-command");
                    var value = button.getAttribute("data-value") || null;
                    editorSurface.focus();
                    document.execCommand(command, false, value);
                });
            });

            editorSurface.addEventListener("click", function (event) {
                var token = event.target.closest(".token-chip");
                if (token) replaceTokenWithInput(token);
            });

            document.addEventListener("keydown", function (event) {
                if (event.key === "Escape") {
                    closeModal();
                    toggleSidebar(false);
                }

                if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
                    event.preventDefault();
                    searchInput.focus();
                }
            });

            setTheme(getPreferredTheme());
            renderTemplates();
        })();
