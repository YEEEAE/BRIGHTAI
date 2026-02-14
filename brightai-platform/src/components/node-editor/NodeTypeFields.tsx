import type { FieldError, NodeDraft, VariableOption } from "../../types/node-editor.types";
import NodeActionFields from "./NodeActionFields";
import NodeConditionFields from "./NodeConditionFields";
import NodeGroqFields from "./NodeGroqFields";
import NodeInputFields from "./NodeInputFields";
import NodeInstructionFields from "./NodeInstructionFields";
import NodeLoopFields from "./NodeLoopFields";
import NodeOutputFields from "./NodeOutputFields";
import NodePromptFields from "./NodePromptFields";
import NodeVariableFields from "./NodeVariableFields";

type NodeTypeFieldsProps = {
  nodeType?: string;
  draft: NodeDraft;
  errors: FieldError[];
  activeVariables: VariableOption[];
  onUpdateField: (key: string, value: unknown) => void;
  onInsertVariable: (key: string, token: string) => void;
  onAddCondition: () => void;
  onUpdateCondition: (index: number, patch: Record<string, unknown>) => void;
  onRemoveCondition: (index: number) => void;
};

const NodeTypeFields = ({
  nodeType,
  draft,
  errors,
  activeVariables,
  onUpdateField,
  onInsertVariable,
  onAddCondition,
  onUpdateCondition,
  onRemoveCondition,
}: NodeTypeFieldsProps) => {
  return (
    <>
      {nodeType === "input" ? <NodeInputFields draft={draft} onUpdateField={onUpdateField} /> : null}

      {nodeType === "prompt" || nodeType === "groq" ? (
        <NodePromptFields
          draft={draft}
          errors={errors}
          activeVariables={activeVariables}
          onUpdateField={onUpdateField}
          onInsertVariable={onInsertVariable}
        />
      ) : null}

      {nodeType === "instruction" ? <NodeInstructionFields draft={draft} onUpdateField={onUpdateField} /> : null}

      {nodeType === "condition" ? (
        <NodeConditionFields
          draft={draft}
          errors={errors}
          activeVariables={activeVariables}
          onAddCondition={onAddCondition}
          onUpdateCondition={onUpdateCondition}
          onRemoveCondition={onRemoveCondition}
          onUpdateField={onUpdateField}
        />
      ) : null}

      {nodeType === "groq" ? <NodeGroqFields draft={draft} onUpdateField={onUpdateField} /> : null}

      {nodeType === "action" ? <NodeActionFields draft={draft} errors={errors} onUpdateField={onUpdateField} /> : null}

      {nodeType === "output" ? (
        <NodeOutputFields
          draft={draft}
          errors={errors}
          activeVariables={activeVariables}
          onUpdateField={onUpdateField}
          onInsertVariable={onInsertVariable}
        />
      ) : null}

      {nodeType === "loop" ? <NodeLoopFields draft={draft} onUpdateField={onUpdateField} /> : null}

      {nodeType === "variable" ? <NodeVariableFields draft={draft} onUpdateField={onUpdateField} /> : null}
    </>
  );
};

export default NodeTypeFields;
