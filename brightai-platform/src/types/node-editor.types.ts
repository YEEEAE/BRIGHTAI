import type { Node } from "reactflow";
import type { WorkflowNodeData } from "../components/agent/CustomNodes";

export type NodeEditorProps = {
  open: boolean;
  node: Node<WorkflowNodeData> | null;
  onClose: () => void;
  onSave: (id: string, data: WorkflowNodeData) => void;
  variables?: string[];
};

export type FieldError = {
  field: string;
  message: string;
};

export type DraftCondition = {
  variable: string;
  operator: string;
  value: string;
};

export type VariableOption = {
  key: string;
  label: string;
  token: string;
};

export type NodeDraft = Record<string, unknown>;
