import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowUpLeft, BarChart3, LayoutGrid } from "lucide-react";
import Button from "../ui/Button";
import AgentStatus from "../agent/AgentStatus";

const MainLayout = () => {
  const { t } = useTranslation();

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition ${
      isActive ? "text-emerald-300" : "text-slate-200 hover:text-emerald-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <span className="text-lg font-extrabold text-emerald-300">
              {t("app.name")}
            </span>
            <span className="text-sm text-slate-400">{t("app.tagline")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <nav className="flex items-center gap-5">
              <NavLink to="/" className={linkClassName}>
                <span className="inline-flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  {t("nav.home")}
                </span>
              </NavLink>
              <NavLink to="/workflow" className={linkClassName}>
                <span className="inline-flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("nav.workflow")}
                </span>
              </NavLink>
            </nav>
            <Button variant="secondary">
              <ArrowUpLeft className="h-4 w-4" />
              {t("actions.contact")}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
          <span>{t("footer.rights")}</span>
          <AgentStatus label={t("footer.agentLabel")} statusText={t("footer.agentReady")} />
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
