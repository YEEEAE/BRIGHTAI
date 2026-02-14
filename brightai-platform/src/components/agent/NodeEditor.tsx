import { X } from "lucide-react";
import {
  NodeEditorCommonFields,
  NodeEditorPreviewPanel,
  NodeTypeFields,
} from "../node-editor";
import useNodeEditor from "../../hooks/useNodeEditor";
import type { NodeEditorProps } from "../../types/node-editor.types";

export type { NodeEditorProps, FieldError } from "../../types/node-editor.types";

const NodeEditor = (props: NodeEditorProps) => {
  const { open, node, onClose } = props;

  const {
    draft,
    errors,
    previewText,
    activeVariables,
    updateField,
    addCondition,
    updateCondition,
    removeCondition,
    insertVariable,
    handleSave,
  } = useNodeEditor(props);

  if (!open || !node) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="تحرير العقدة"
    >
      <div className="auth-card w-full max-w-4xl rounded-3xl p-6 text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-300">تحرير العقدة</p>
            <h2 className="text-xl font-bold">{node.data.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100"
            aria-label="إغلاق التحرير"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <NodeEditorCommonFields draft={draft} errors={errors} onUpdateField={updateField} />

            <NodeTypeFields
              nodeType={node.type}
              draft={draft}
              errors={errors}
              activeVariables={activeVariables}
              onUpdateField={updateField}
              onInsertVariable={insertVariable}
              onAddCondition={addCondition}
              onUpdateCondition={updateCondition}
              onRemoveCondition={removeCondition}
            />
          </div>

          <NodeEditorPreviewPanel previewText={previewText} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
          >
            حفظ التعديلات
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeEditor;
