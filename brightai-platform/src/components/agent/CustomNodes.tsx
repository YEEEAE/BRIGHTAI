import { memo } from "react";
import {
  BaseEdge,
  EdgeProps,
  Handle,
  NodeProps,
  Position,
  getBezierPath,
} from "reactflow";
import { Copy, Settings2, Trash2 } from "lucide-react";

type NodeStatus = "جاهز" | "قيد التنفيذ" | "خطأ" | "مكتمل";

export type WorkflowNodeData = {
  label: string;
  description?: string;
  status?: NodeStatus;
  summary?: string;
  config?: Record<string, unknown>;
  onEdit?: (id: string) => void;
  onCopy?: (id: string) => void;
  onDelete?: (id: string) => void;
};

type NodeShellProps = {
  id: string;
  data: WorkflowNodeData;
  accent: string;
  typeLabel: string;
  showTarget?: boolean;
  showSource?: boolean;
};

const statusClasses: Record<NodeStatus, string> = {
  جاهز: "bg-emerald-400",
  "قيد التنفيذ": "bg-amber-400",
  خطأ: "bg-red-400",
  مكتمل: "bg-sky-400",
};

const NodeShell = ({
  id,
  data,
  accent,
  typeLabel,
  showTarget = true,
  showSource = true,
}: NodeShellProps) => {
  const statusColor = data.status ? statusClasses[data.status] : "bg-slate-500";

  return (
    <div
      className="relative min-w-[220px] rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-100 shadow-glass-soft"
      onDoubleClick={() => data.onEdit?.(id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          data.onEdit?.(id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`تحرير ${data.label}`}
    >
      {showTarget ? (
        <Handle type="target" position={Position.Right} className="!bg-emerald-400" />
      ) : null}
      {showSource ? (
        <Handle type="source" position={Position.Left} className="!bg-emerald-400" />
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <div>
            <p className="text-xs text-slate-400">{typeLabel}</p>
            <p className="font-semibold" style={{ color: accent }}>
              {data.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={() => data.onEdit?.(id)}
            className="hover:text-emerald-300"
            aria-label="تعديل العقدة"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => data.onCopy?.(id)}
            className="hover:text-emerald-300"
            aria-label="نسخ العقدة"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => data.onDelete?.(id)}
            className="hover:text-red-300"
            aria-label="حذف العقدة"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {data.summary ? (
        <p className="mt-3 text-xs text-slate-300">{data.summary}</p>
      ) : data.description ? (
        <p className="mt-3 text-xs text-slate-400">{data.description}</p>
      ) : null}
    </div>
  );
};

const InputNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#34d399"
    typeLabel="مدخلات"
    showTarget={false}
  />
));

const InstructionNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#38bdf8"
    typeLabel="تعليمات"
  />
));

const PromptNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#a855f7"
    typeLabel="موجه"
  />
));

const ConditionNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#f59e0b"
    typeLabel="منطق شرطي"
  />
));

const GroqAiNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#22c55e"
    typeLabel="ذكاء غروك"
  />
));

const ActionNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#60a5fa"
    typeLabel="إجراء"
  />
));

const OutputNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#e2e8f0"
    typeLabel="مخرجات"
    showSource={false}
  />
));

const LoopNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#f97316"
    typeLabel="تكرار"
  />
));

const VariableNode = memo((props: NodeProps<WorkflowNodeData>) => (
  <NodeShell
    id={props.id}
    data={props.data}
    accent="#14b8a6"
    typeLabel="متغيرات"
  />
));

export const nodeTypes = {
  input: InputNode,
  instruction: InstructionNode,
  prompt: PromptNode,
  condition: ConditionNode,
  groq: GroqAiNode,
  action: ActionNode,
  output: OutputNode,
  loop: LoopNode,
  variable: VariableNode,
};

export const nodeTypeLabels = {
  input: "مدخلات",
  instruction: "تعليمات",
  prompt: "موجه",
  condition: "منطق شرطي",
  groq: "ذكاء غروك",
  action: "إجراء",
  output: "مخرجات",
  loop: "تكرار",
  variable: "متغيرات",
};

const GradientEdge = ({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  const gradientId = `edge-gradient-${id}`;

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <BaseEdge path={edgePath} style={{ stroke: `url(#${gradientId})`, strokeWidth: 2 }} />
    </>
  );
};

export const edgeTypes = {
  gradient: GradientEdge,
};
