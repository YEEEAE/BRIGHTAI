import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import MainLayout from "./components/layout/MainLayout";
import HomePage from "./pages/HomePage";
import WorkflowPage from "./pages/WorkflowPage";
import NotFoundPage from "./pages/NotFoundPage";
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
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
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
