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

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

if (process.env.NODE_ENV === "production") {
  // تعطيل السجلات غير الضرورية في الإنتاج
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
}

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

// تفعيل Service Worker لتحسين الأداء والعمل دون اتصال
serviceWorkerRegistration.register();
