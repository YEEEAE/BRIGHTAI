"use strict";

const isMobile = window.matchMedia("(max-width: 768px)").matches;
const isLowPower = Boolean(navigator.connection && navigator.connection.saveData);

function yieldToMain() {
    if ("scheduler" in window && "yield" in scheduler) {
        return scheduler.yield();
    }

    return new Promise((resolve) => setTimeout(resolve, 0));
}

function appendScript(src) {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
}

function loadAnalytics() {
    if (window._gaLoaded) {
        return;
    }

    window._gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    window.gtag("config", "G-8LLESL207Q", {
        send_page_view: true,
        transport_type: "beacon"
    });

    appendScript("https://www.googletagmanager.com/gtag/js?id=G-8LLESL207Q");
}

function loadClarity() {
    if (window._clarityLoaded) {
        return;
    }

    window._clarityLoaded = true;
    window.clarity = window.clarity || function clarity() {
        (window.clarity.q = window.clarity.q || []).push(arguments);
    };

    appendScript("https://www.clarity.ms/tag/voq2kb6voe");
}

function extendCloudflareCache() {
    if ("requestIdleCallback" in window) {
        requestIdleCallback(() => { }, { timeout: 5000 });
    }
}

function mobileOptimize() {
    if (!isMobile && !isLowPower) {
        return;
    }

    [
        "#neural-canvas",
        ".floating-orbs",
        "#stars",
        "#particles",
        ".code-wall",
        ".matrix",
        "#matrixBackground",
        ".gradient-bg",
        ".glow-effect",
        ".glow-effect-2",
        ".hero-visual"
    ].forEach((selector) => {
        document.querySelectorAll(selector).forEach((node) => node.remove());
    });

    document.querySelectorAll(".bento").forEach((card) => card.classList.add("show"));

    const hero = document.getElementById("top");
    if (hero) {
        hero.style.minHeight = "70vh";
        hero.style.minHeight = "70dvh";
    }
}

async function initOptimization() {
    const events = ["scroll", "click", "touchstart", "keydown", "mousemove", "pointerdown"];
    let started = false;

    const bootDeferredAssets = async () => {
        if (started) {
            return;
        }

        started = true;
        events.forEach((eventName) => window.removeEventListener(eventName, bootDeferredAssets));

        await yieldToMain();
        loadAnalytics();
        await yieldToMain();
        loadClarity();
        await yieldToMain();
        extendCloudflareCache();
    };

    events.forEach((eventName) => {
        window.addEventListener(eventName, bootDeferredAssets, { once: true, passive: true });
    });

    mobileOptimize();
    setTimeout(bootDeferredAssets, isMobile ? 3500 : 4500);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initOptimization, { once: true });
} else {
    initOptimization();
}
