import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import WorkflowPage from "./pages/WorkflowPage";
import NotFoundPage from "./pages/NotFoundPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AgentBuilder from "./pages/AgentBuilder";
import AgentDetails from "./pages/AgentDetails";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import { setDocumentDirection } from "./i18n";

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // ضبط اتجاه الصفحة حسب اللغة المختارة
    setDocumentDirection(i18n.language);
  }, [i18n.language]);

  return (
    <>
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
