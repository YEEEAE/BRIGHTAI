import { Suspense, lazy, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layout/MainLayout";
import { setDocumentDirection } from "./i18n";

const HomePage = lazy(() => import("./pages/HomePage"));
const WorkflowPage = lazy(() => import("./pages/WorkflowPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AgentBuilder = lazy(() => import("./pages/AgentBuilder"));
const AgentDetails = lazy(() => import("./pages/AgentDetails"));
const Templates = lazy(() => import("./pages/Templates"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // ضبط اتجاه الصفحة حسب اللغة المختارة
    setDocumentDirection(i18n.language);
  }, [i18n.language]);

  return (
    <>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-sm text-slate-300">
            جارٍ تحميل الصفحة...
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
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
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
