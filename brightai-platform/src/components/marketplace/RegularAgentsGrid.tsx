import Button from "../ui/Button";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import RatingStars from "./RatingStars";
import type { MarketplaceAgent } from "../../types/marketplace.types";

type RegularAgentsGridProps = {
  agents: MarketplaceAgent[];
  onOpenDetail: (agent: MarketplaceAgent) => void;
};

const RegularAgentsGrid = ({ agents, onOpenDetail }: RegularAgentsGridProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          hoverable
          header={
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">{agent.name}</h3>
                <p className="text-xs text-slate-500">بواسطة {agent.author}</p>
              </div>
              <Badge variant="default" size="sm">
                {agent.category}
              </Badge>
            </div>
          }
          body={<p className="text-sm text-slate-300">{agent.description}</p>}
          footer={
            <div className="flex items-center justify-between">
              <div>
                <RatingStars value={agent.rating} />
                <p className="text-xs text-slate-500">{agent.downloads} استخدام</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => onOpenDetail(agent)}>
                عرض
              </Button>
            </div>
          }
        >
          <div className="mt-4 flex flex-wrap gap-2">
            {agent.tags.map((tag) => (
              <Badge key={`${agent.id}-${tag}`} variant="info" size="sm">
                {tag}
              </Badge>
            ))}
          </div>
        </Card>
      ))}
    </section>
  );
};

export default RegularAgentsGrid;
