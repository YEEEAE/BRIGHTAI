(function () {
    "use strict";

    var root = document.documentElement;
    var nav = document.querySelector(".unified-nav");
    var revealTargets = [
        "#top .hero-content",
        "#top .hero-visual .glass-card",
        "#services .grid > *",
        "#try-tools .grid > *",
        "#aiaas .price",
        "#saudi-use-cases .bento",
        "#blog .post",
        "#proof .proof-card",
        "#proof article",
        "#faq details",
        "#final-cta .container"
    ];

    root.classList.add("bai-home-js");

    function updateNavState() {
        if (!nav) {
            return;
        }

        nav.classList.toggle("is-scrolled", window.scrollY > 12);
    }

    function collectRevealElements() {
        return revealTargets.reduce(function (items, selector) {
            return items.concat(Array.prototype.slice.call(document.querySelectorAll(selector)));
        }, []);
    }

    function setupReveal() {
        var elements = collectRevealElements();

        elements.forEach(function (element, index) {
            element.classList.add("bai-reveal");
            element.style.setProperty("--reveal-delay", String(index % 6));
        });

        if (!("IntersectionObserver" in window)) {
            elements.forEach(function (element) {
                element.classList.add("is-visible");
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        }, {
            rootMargin: "0px 0px -8% 0px",
            threshold: 0.12
        });

        elements.forEach(function (element) {
            observer.observe(element);
        });
    }

    function normalizeFloatingControls() {
        var backToTop = document.querySelector("#backToTop, .back-to-top, [data-back-to-top]");

        if (backToTop) {
            backToTop.setAttribute("aria-label", backToTop.getAttribute("aria-label") || "العودة إلى الأعلى");
        }
    }

    function boot() {
        updateNavState();
        setupReveal();
        normalizeFloatingControls();
        window.addEventListener("scroll", updateNavState, { passive: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
}());
