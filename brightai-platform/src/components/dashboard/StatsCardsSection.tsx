import { memo } from "react";
import type { StatCardItem } from "../../types/dashboard.types";
import StatCard from "./StatCard";

type StatsCardsSectionProps = {
  loading: boolean;
  statsCards: StatCardItem[];
};

const StatsCardsSection = ({ loading, statsCards }: StatsCardsSectionProps) => {
  return (
    <section className="overflow-x-auto pb-1">
      {loading ? (
        <div className="grid min-w-[1150px] grid-flow-col auto-cols-[220px] gap-3 md:min-w-0 md:grid-flow-row md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`stats-skeleton-${index}`} className="h-44 animate-pulse rounded-2xl bg-slate-800/60" />
          ))}
        </div>
      ) : (
        <div className="grid min-w-[1150px] grid-flow-col auto-cols-[220px] gap-3 md:min-w-0 md:grid-flow-row md:grid-cols-3 xl:grid-cols-6">
          {statsCards.map((item) => (
            <StatCard
              key={item.key}
              title={item.title}
              value={item.value}
              delta={item.delta}
              subtitle={item.subtitle}
              to={item.to}
              icon={item.icon}
              extra={item.extra}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default memo(StatsCardsSection);
