import Button from "../ui/Button";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import RatingStars from "./RatingStars";
import type { MarketplaceAgent } from "../../types/marketplace.types";

type FeaturedAgentsSectionProps = {
  agents: MarketplaceAgent[];
  highlight: string;
  onOpenPreview: (agent: MarketplaceAgent) => void;
  onOpenDetail: (agent: MarketplaceAgent) => void;
};

const FeaturedAgentsSection = ({ agents, highlight, onOpenPreview, onOpenDetail }: FeaturedAgentsSectionProps) => {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">الوكلاء المميزون</h2>
        <span className="text-xs text-emerald-200">{highlight}</span>
      </div>
      {agents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">لا توجد وكلاء مميزة حالياً.</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              variant="gradient"
              hoverable
              header={
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">{agent.name}</h3>
                    <p className="text-xs text-slate-400">بواسطة {agent.author}</p>
                  </div>
                  <Badge variant="info" size="sm">
                    {agent.category}
                  </Badge>
                </div>
              }
              body={<p className="text-sm text-slate-300">{agent.description}</p>}
              footer={
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <RatingStars value={agent.rating} />
                    <p className="mt-1 text-xs text-slate-500">استخدامات: {agent.downloads}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onOpenPreview(agent)}>
                      معاينة
                    </Button>
                    <Button size="sm" onClick={() => onOpenDetail(agent)}>
                      التفاصيل
                    </Button>
                  </div>
                </div>
              }
            >
              <div className="mt-4 flex flex-wrap gap-2">
                {agent.tags.map((tag) => (
                  <Badge key={`${agent.id}-${tag}`} variant="default" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedAgentsSection;
