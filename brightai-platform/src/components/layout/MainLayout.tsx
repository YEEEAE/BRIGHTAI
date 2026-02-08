import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpLeft,
  BarChart3,
  Boxes,
  Home,
  LayoutDashboard,
  Menu,
  Settings,
  Wand2,
  X,
} from "lucide-react";
import Button from "../ui/Button";
import AgentStatus from "../agent/AgentStatus";
import { formatShortDate } from "../../lib/date";

const MainLayout = () => {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-semibold transition ${
      isActive ? "text-emerald-300" : "text-slate-200 hover:text-emerald-200"
    }`;

  const sideLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-emerald-400/20 text-emerald-200"
        : "text-slate-300 hover:bg-slate-900"
    }`;

  const sidebarItems = [
    { to: "/", label: t("nav.home"), icon: Home },
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/agents/new", label: t("nav.builder"), icon: Wand2 },
    { to: "/templates", label: t("nav.templates"), icon: Boxes },
    { to: "/analytics", label: t("nav.analytics"), icon: BarChart3 },
    { to: "/settings", label: t("nav.settings"), icon: Settings },
  ];

  const today = formatShortDate(new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4 lg:hidden">
            <div className="flex flex-col gap-2">
              <span className="text-lg font-extrabold text-emerald-300">
                {t("app.name")}
              </span>
              <span className="text-sm text-slate-400">{t("app.tagline")}</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 text-slate-200 lg:hidden"
              aria-label="فتح قائمة التنقل"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          <div className="hidden flex-col gap-2 lg:flex">
            <span className="text-lg font-extrabold text-emerald-300">
              {t("app.name")}
            </span>
            <span className="text-sm text-slate-400">{t("app.tagline")}</span>
          </div>
          <div className="hidden flex-wrap items-center gap-6 lg:flex">
            <nav className="flex items-center gap-5">
              <NavLink to="/" className={linkClassName}>
                <span className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  {t("nav.home")}
                </span>
              </NavLink>
              <NavLink to="/dashboard" className={linkClassName}>
                <span className="inline-flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t("nav.dashboard")}
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

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 lg:flex-row-reverse">
          <aside className="hidden w-full max-w-xs rounded-2xl border border-slate-800 bg-slate-950/60 p-4 lg:block">
            <div className="text-xs font-semibold text-slate-400">التنقل</div>
            <nav className="mt-4 grid gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={sideLinkClassName}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <NavLink to="/workflow" className={sideLinkClassName}>
                <Wand2 className="h-4 w-4" />
                {t("nav.workflow")}
              </NavLink>
            </nav>
          </aside>

          <section className="flex-1">
            <Outlet />
          </section>
        </div>
      </main>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 rounded-l-2xl border border-slate-800 bg-slate-950/95 p-4 shadow-2xl shadow-slate-950/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">التنقل</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 text-slate-200"
                aria-label="إغلاق القائمة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 grid gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={sideLinkClassName}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              })}
              <NavLink
                to="/workflow"
                className={sideLinkClassName}
                onClick={() => setMobileOpen(false)}
              >
                <Wand2 className="h-4 w-4" />
                {t("nav.workflow")}
              </NavLink>
            </nav>
            <div className="mt-6">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setMobileOpen(false)}
              >
                <ArrowUpLeft className="h-4 w-4" />
                {t("actions.contact")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-slate-900/80 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2">
            <span>{t("footer.rights")}</span>
            <span className="text-xs text-slate-500">
              {t("footer.lastUpdate", { date: today })}
            </span>
          </div>
          <AgentStatus label={t("footer.agentLabel")} statusText={t("footer.agentReady")} />
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
