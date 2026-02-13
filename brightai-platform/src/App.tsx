import { Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layout/MainLayout";
import AsyncErrorBoundary from "./components/layout/AsyncErrorBoundary";
import { setDocumentDirection } from "./i18n";
import { trackPageView } from "./lib/analytics";
import { lazyWithRetry, preloadOnIdle } from "./lib/lazy";

const HomePage = lazyWithRetry(() => import("./pages/HomePage"));
const WorkflowPage = lazyWithRetry(() => import("./pages/WorkflowPage"));
const NotFoundPage = lazyWithRetry(() => import("./pages/NotFoundPage"));
const Login = lazyWithRetry(() => import("./pages/Login"));
const Signup = lazyWithRetry(() => import("./pages/Signup"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const AgentBuilder = lazyWithRetry(() => import("./pages/AgentBuilder"));
const AgentDetails = lazyWithRetry(() => import("./pages/AgentDetails"));
const Templates = lazyWithRetry(() => import("./pages/Templates"));
const Marketplace = lazyWithRetry(() => import("./pages/Marketplace"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));

const App = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // ضبط اتجاه الصفحة حسب اللغة المختارة
    setDocumentDirection(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    return preloadOnIdle([
      () => Dashboard.preload(),
      () => AgentBuilder.preload(),
      () => AgentDetails.preload(),
      () => Templates.preload(),
      () => Analytics.preload(),
      () => Marketplace.preload(),
    ]);
  }, []);

  return (
    <>
      <AsyncErrorBoundary
        title="تعذر تحميل الشاشة"
        message="واجهنا مشكلة أثناء تحميل الصفحة المطلوبة. جرّب إعادة التحميل أو العودة للرئيسية."
        onRetry={() => window.location.reload()}
      >
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center px-4">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-sm text-slate-200">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-transparent" />
                جارٍ تحميل الصفحة...
              </div>
            </div>
          }
        >
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/agents/new" element={<AgentBuilder />} />
              <Route path="/agents/:id/builder" element={<AgentBuilder />} />
              <Route path="/agents/:id" element={<AgentDetails />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/workflow" element={<WorkflowPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AsyncErrorBoundary>
      <Toaster
        position="top-left"
        toastOptions={{
          className:
            "rounded-xl bg-slate-900 text-slate-100 border border-slate-800 font-sans",
          duration: 3500,
        }}
      />
    </>
  );
};

export default App;
