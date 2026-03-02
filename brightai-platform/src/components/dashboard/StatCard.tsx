import { memo } from "react";
import { Link } from "react-router-dom";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { StatCardProps } from "../../types/dashboard.types";

const StatCard = ({ title, value, delta, subtitle, to, icon, extra }: StatCardProps) => {
  const positive = delta >= 0;

  return (
    <Link
      to={to}
      className="group rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:-translate-y-1 hover:border-emerald-400/40 hover:shadow-xl hover:shadow-emerald-900/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2 text-emerald-300 transition group-hover:scale-105">
          {icon}
        </div>
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            positive ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"
          }`}
        >
          {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {`${Math.abs(delta).toFixed(1)}%`}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{title}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-100">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      {extra ? <div className="mt-3">{extra}</div> : null}
    </Link>
  );
};

export default memo(StatCard);
