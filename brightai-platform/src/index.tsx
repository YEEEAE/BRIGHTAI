import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router } from "react-router-dom";
import "./index.css";
import "./i18n";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./hooks/useAuth";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { logSecurityEvent } from "./lib/security";
import { initAnalytics, initSentry, setupGlobalMonitoring, trackPageLoad } from "./lib/analytics";

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
  void initSentry();
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
