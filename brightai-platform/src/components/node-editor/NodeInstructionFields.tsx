import type { NodeDraft } from "../../types/node-editor.types";

type NodeInstructionFieldsProps = {
  draft: NodeDraft;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeInstructionFields = ({ draft, onUpdateField }: NodeInstructionFieldsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold">تعليمات النظام</label>
      <textarea
        className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
        value={String(draft.text || "")}
        onChange={(event) => onUpdateField("text", event.target.value)}
        placeholder="اكتب التعليمات التي توجه سلوك الوكيل"
      />
    </div>
  );
};

export default NodeInstructionFields;
