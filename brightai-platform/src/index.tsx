import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/browser";
import { HashRouter as Router } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./hooks/useAuth";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { logSecurityEvent } from "./lib/security";
import { initAnalytics, setupGlobalMonitoring, trackPageLoad } from "./lib/analytics";

Sentry.init({
  dsn: "https://6fb19ef8d5c41c0fa0adb86852054394@o4510966719840256.ingest.us.sentry.io/4510966859366400",
  sendDefaultPii: true,
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (process.env.NODE_ENV === "production") {
  // تعطيل السجلات غير الضرورية في الإنتاج
  console.log = () => { };
  console.debug = () => { };
  console.info = () => { };

  if (
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.protocol !== "file:"
  ) {
    logSecurityEvent({
      type: "https-redirect",
      message: "تم فرض التحويل إلى HTTPS.",
    });
    window.location.replace(
      `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }
}

const initTracking = () => {
  initAnalytics();
  setupGlobalMonitoring();
};

if (typeof window !== "undefined" && "requestIdleCallback" in window) {
  const win = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  };
  if (typeof win.requestIdleCallback === "function") {
    win.requestIdleCallback(initTracking, { timeout: 1500 });
  } else {
    setTimeout(initTracking, 250);
  }
} else if (typeof window !== "undefined") {
  setTimeout(initTracking, 250);
}

window.addEventListener("load", () => {
  trackPageLoad();
});

root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <App />
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

// قياس مؤشرات الأداء الأساسية عند الحاجة
reportWebVitals();

// تفعيل Service Worker في الإنتاج فقط لتجنب التخزين المؤقت أثناء التطوير
if (process.env.NODE_ENV === "production") {
  serviceWorkerRegistration.register();
} else {
  serviceWorkerRegistration.unregister();
}
