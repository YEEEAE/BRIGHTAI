import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "reactflow/dist/style.css";
import "./i18n";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AuthProvider } from "./hooks/useAuth";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import { logSecurityEvent } from "./lib/security";
import * as Sentry from "@sentry/react";
import { initAnalytics, trackPageLoad } from "./lib/analytics";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (process.env.NODE_ENV === "production") {
  // تعطيل السجلات غير الضرورية في الإنتاج
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};

  if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
    logSecurityEvent({
      type: "https-redirect",
      message: "تم فرض التحويل إلى HTTPS.",
    });
    window.location.replace(
      `https://${window.location.host}${window.location.pathname}${window.location.search}${window.location.hash}`
    );
  }
}

const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({ dsn: sentryDsn });
}

initAnalytics();

window.addEventListener("load", () => {
  trackPageLoad();
});

root.render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
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
