import type { NodeDraft } from "../../types/node-editor.types";

type NodeVariableFieldsProps = {
  draft: NodeDraft;
  onUpdateField: (key: string, value: unknown) => void;
};

const NodeVariableFields = ({ draft, onUpdateField }: NodeVariableFieldsProps) => {
  const operation = String(draft.operation || "set");

  return (
    <>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">عملية المتغير</label>
        <select
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={operation}
          onChange={(event) => onUpdateField("operation", event.target.value)}
        >
          <option value="set">تخزين قيمة</option>
          <option value="get">قراءة قيمة</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold">اسم المتغير</label>
        <input
          className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
          value={String(draft.key || "")}
          onChange={(event) => onUpdateField("key", event.target.value)}
          placeholder="اسم المتغير"
        />
      </div>

      {operation === "set" ? (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold">قيمة المتغير</label>
          <input
            className="auth-field rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
            value={String(draft.value || "")}
            onChange={(event) => onUpdateField("value", event.target.value)}
            placeholder="أدخل قيمة المتغير"
          />
        </div>
      ) : null}
    </>
  );
};

export default NodeVariableFields;
