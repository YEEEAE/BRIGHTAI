import Button from "../ui/Button";
import Modal from "../ui/Modal";
import type { MarketplaceAgent } from "../../types/marketplace.types";

type MarketplacePreviewModalProps = {
  open: boolean;
  agent: MarketplaceAgent | null;
  onClose: () => void;
  onUseTemplate: (agent: MarketplaceAgent) => void;
  onTryDemo: (agent: MarketplaceAgent) => void;
};

const MarketplacePreviewModal = ({
  open,
  agent,
  onClose,
  onUseTemplate,
  onTryDemo,
}: MarketplacePreviewModalProps) => {
  return (
    <Modal open={open} onClose={onClose} title={agent ? `معاينة ${agent.name}` : "معاينة"} size="lg">
      {agent ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-300">{agent.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {agent.previewImages.length > 0 ? (
              agent.previewImages.map((image, index) => (
                <div key={`${agent.id}-preview-${index}`} className="overflow-hidden rounded-xl border border-slate-800">
                  <img src={image} alt="معاينة" className="h-40 w-full object-cover" />
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
                لا توجد صور معاينة.
              </div>
            )}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold text-slate-200">مخطط سير العمل</h3>
            <ul className="mt-2 grid gap-2 text-sm text-slate-300">
              {agent.workflowPreview.map((step, index) => (
                <li key={`${agent.id}-step-${index}`}>
                  {index + 1}. {step}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onUseTemplate(agent)}>استخدم الوكيل</Button>
            <Button variant="secondary" onClick={() => onTryDemo(agent)}>
              تجربة سريعة
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default MarketplacePreviewModal;
