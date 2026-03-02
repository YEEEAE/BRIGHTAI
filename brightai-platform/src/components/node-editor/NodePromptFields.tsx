import { templateSuggestions } from "../../constants/node-editor.constants";
import type { FieldError, NodeDraft, VariableOption } from "../../types/node-editor.types";
import TemplateSuggestionChips from "./TemplateSuggestionChips";
import VariableChips from "./VariableChips";

type NodePromptFieldsProps = {
  draft: NodeDraft;
  errors: FieldError[];
  activeVariables: VariableOption[];
  onUpdateField: (key: string, value: unknown) => void;
  onInsertVariable: (key: string, token: string) => void;
};

const NodePromptFields = ({
  draft,
  errors,
  activeVariables,
  onUpdateField,
  onInsertVariable,
}: NodePromptFieldsProps) => {
  const textError = errors.find((error) => error.field === "text")?.message;

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold">
        النص الأساسي
        <span className="text-xs text-slate-400" title="يمكنك استخدام المتغيرات بين أقواس مزدوجة">
          {" "}(يدعم المتغيرات)
        </span>
      </label>
      <textarea
        className="auth-field min-h-[120px] rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm"
        value={String(draft.text || "")}
        onChange={(event) => onUpdateField("text", event.target.value)}
        placeholder="اكتب الموجه أو التعليمات هنا"
      />
      {textError ? <p className="text-xs text-red-300">{textError}</p> : null}
      <VariableChips variables={activeVariables} onInsert={(token) => onInsertVariable("text", token)} />
      <TemplateSuggestionChips suggestions={templateSuggestions} onPick={(value) => onUpdateField("text", value)} />
    </div>
  );
};

export default NodePromptFields;
