import Tooltip from "../../src/components/ui/Tooltip";

export default {
  title: "واجهة/تلميح",
  component: Tooltip,
};

export const افتراضي = () => (
  <Tooltip content="تلميح عربي واضح" position="top">
    <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">
      مرر المؤشر
    </button>
  </Tooltip>
);
