import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-2xl font-bold text-slate-100">{t("errors.notFoundTitle")}</h2>
      <p className="text-sm text-slate-400">{t("errors.notFoundBody")}</p>
      <Link
        to="/"
        className="mt-2 text-sm font-semibold text-emerald-300 hover:text-emerald-200"
      >
        {t("errors.notFoundAction")}
      </Link>
    </div>
  );
};

export default NotFoundPage;
