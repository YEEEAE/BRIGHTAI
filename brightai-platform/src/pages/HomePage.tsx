import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowUpLeft,
  Bot,
  Cpu,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Workflow,
  BrainCircuit,
} from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import useAppToast from "../hooks/useAppToast";

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showSuccess } = useAppToast();

  const handleStart = () => {
    showSuccess(t("home.toastStart"));
    navigate("/dashboard");
  };

  const quickLinks = [
    {
      to: "/dashboard",
      title: t("nav.dashboard"),
      body: t("home.quickDashboardDesc"),
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      to: "/agents/new",
      title: t("nav.builder"),
      body: t("home.quickBuilderDesc"),
      icon: <Bot className="h-5 w-5" />,
    },
    {
      to: "/templates",
      title: t("nav.templates"),
      body: t("home.quickTemplatesDesc"),
      icon: <Workflow className="h-5 w-5" />,
    },
    {
      to: "/marketplace",
      title: t("nav.marketplace"),
      body: t("home.quickMarketplaceDesc"),
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      to: "/analytics",
      title: t("nav.analytics"),
      body: t("home.quickAnalyticsDesc"),
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      to: "/ai-native-expansion",
      title: "الوكلاء الأصليون",
      body: "تشغيل فوري لاكتشاف الفرص والامتثال وقياس الأثر",
      icon: <BrainCircuit className="h-5 w-5" />,
    },
    {
      to: "/settings",
      title: t("nav.settings"),
      body: t("home.quickSettingsDesc"),
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/60 p-8 md:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-200">
              {t("home.heroBadge")}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-100 md:text-4xl">
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg text-slate-300">{t("home.heroSubtitle")}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Button onClick={handleStart} gradient>
                <ArrowUpLeft className="h-4 w-4" />
                {t("actions.start")}
              </Button>
              <Link to="/workflow" className="text-sm font-semibold text-emerald-200">
                <span className="inline-flex items-center gap-2">
                  {t("home.heroSecondary")}
                  <ArrowLeft className="h-4 w-4" />
                </span>
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                {t("home.heroStatOne")}
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                {t("home.heroStatTwo")}
              </div>
              <div className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
                {t("home.heroStatThree")}
              </div>
            </div>
          </div>

          <Card variant="glass" className="h-full">
            <h3 className="text-lg font-bold text-slate-100">{t("home.journeyTitle")}</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2">
                {t("home.journeyStepOne")}
              </li>
              <li className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2">
                {t("home.journeyStepTwo")}
              </li>
              <li className="rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-2">
                {t("home.journeyStepThree")}
              </li>
            </ul>
            <div className="mt-5">
              <Link
                to="/agents/new"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200"
              >
                <Sparkles className="h-4 w-4" />
                {t("home.journeyCta")}
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card hoverable variant="glass">
          <div className="flex items-center gap-3 text-emerald-300">
            <Cpu className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricOneTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricOneValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricOneNote")}</p>
        </Card>
        <Card hoverable variant="glass">
          <div className="flex items-center gap-3 text-emerald-300">
            <LineChart className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricTwoTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricTwoValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricTwoNote")}</p>
        </Card>
        <Card hoverable variant="glass">
          <div className="flex items-center gap-3 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricThreeTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricThreeValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricThreeNote")}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card tone="soft" hoverable>
          <h3 className="text-lg font-bold text-slate-100">{t("home.problemTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.problemBody")}</p>
        </Card>
        <Card tone="soft" hoverable>
          <h3 className="text-lg font-bold text-slate-100">{t("home.solutionTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.solutionBody")}</p>
        </Card>
        <Card tone="soft" hoverable>
          <h3 className="text-lg font-bold text-slate-100">{t("home.proofTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.proofBody")}</p>
        </Card>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100">{t("home.quickNavTitle")}</h3>
            <p className="mt-1 text-sm text-slate-400">{t("home.quickNavSubtitle")}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-2xl border border-slate-700/80 bg-slate-900/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/40"
            >
              <div className="inline-flex items-center gap-2 text-emerald-300">
                {item.icon}
                <span className="font-semibold">{item.title}</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{item.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card hoverable>
          <h3 className="text-lg font-bold text-slate-100">{t("home.useCasesTitle")}</h3>
          <ul className="mt-4 list-disc space-y-2 pr-4 text-sm text-slate-300">
            <li>{t("home.useCaseOne")}</li>
            <li>{t("home.useCaseTwo")}</li>
            <li>{t("home.useCaseThree")}</li>
          </ul>
        </Card>
        <Card hoverable>
          <h3 className="text-lg font-bold text-slate-100">{t("home.ctaTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.ctaBody")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button onClick={handleStart} gradient>
              <ArrowUpLeft className="h-4 w-4" />
              {t("actions.start")}
            </Button>
            <Link to="/settings">
              <Button variant="ghost">{t("actions.contact")}</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
