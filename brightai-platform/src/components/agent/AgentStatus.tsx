import { CheckCircle2, Sparkles } from "lucide-react";

type AgentStatusProps = {
  label: string;
  statusText: string;
};

const AgentStatus = ({ label, statusText }: AgentStatusProps) => {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs text-slate-200">
      <Sparkles className="h-4 w-4 text-emerald-400" />
      <span className="font-semibold">{label}</span>
      <span className="flex items-center gap-1 text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {statusText}
      </span>
    </div>
  );
};

export default AgentStatus;
