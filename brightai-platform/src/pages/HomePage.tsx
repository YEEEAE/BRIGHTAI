import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowUpLeft, Cpu, LineChart, ShieldCheck } from "lucide-react";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-10">
      <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-emerald-950/60 p-8 md:p-12">
        <div className="flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold text-emerald-200">
            {t("home.heroBadge")}
          </div>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-100 md:text-4xl">
            {t("home.heroTitle")}
          </h1>
          <p className="text-lg text-slate-300">{t("home.heroSubtitle")}</p>
          <div className="flex flex-wrap items-center gap-4">
            <Button>
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
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <div className="flex items-center gap-3 text-emerald-300">
            <Cpu className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricOneTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricOneValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricOneNote")}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 text-emerald-300">
            <LineChart className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricTwoTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricTwoValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricTwoNote")}</p>
        </Card>
        <Card>
          <div className="flex items-center gap-3 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-semibold">{t("home.metricThreeTitle")}</span>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-100">{t("home.metricThreeValue")}</p>
          <p className="mt-2 text-sm text-slate-400">{t("home.metricThreeNote")}</p>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card tone="soft">
          <h3 className="text-lg font-bold text-slate-100">{t("home.problemTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.problemBody")}</p>
        </Card>
        <Card tone="soft">
          <h3 className="text-lg font-bold text-slate-100">{t("home.solutionTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.solutionBody")}</p>
        </Card>
        <Card tone="soft">
          <h3 className="text-lg font-bold text-slate-100">{t("home.proofTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.proofBody")}</p>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold text-slate-100">{t("home.useCasesTitle")}</h3>
          <ul className="mt-4 list-disc space-y-2 pr-4 text-sm text-slate-300">
            <li>{t("home.useCaseOne")}</li>
            <li>{t("home.useCaseTwo")}</li>
            <li>{t("home.useCaseThree")}</li>
          </ul>
        </Card>
        <Card>
          <h3 className="text-lg font-bold text-slate-100">{t("home.ctaTitle")}</h3>
          <p className="mt-3 text-sm text-slate-300">{t("home.ctaBody")}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button>
              <ArrowUpLeft className="h-4 w-4" />
              {t("actions.start")}
            </Button>
            <Button variant="ghost">{t("actions.contact")}</Button>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
