import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import supabase from "../lib/supabase";

const AUTO_SAVE_KEY = "brightai_workflow_autosave";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

type WorkflowValidation = {
  valid: boolean;
  errors: string[];
};

type UseWorkflowOptions = {
  agentId?: string;
};

export const useWorkflow = (options?: UseWorkflowOptions) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((prev) => addEdge({ ...connection, animated: true }, prev));
  }, []);

  const addNode = useCallback((type: string, position: { x: number; y: number }) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: { label: "عقدة جديدة" },
    };
    setNodes((prev) => [...prev, newNode]);
    return newNode;
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((node) => node.id !== id));
    setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
  }, []);

  const updateNode = useCallback((id: string, data: Record<string, unknown>) => {
    setNodes((prev) =>
      prev.map((node) =>
        node.id === id
          ? {
              ...node,
              data: { ...node.data, ...data },
            }
          : node
      )
    );
  }, []);

  const saveWorkflow = useCallback(async () => {
    setError(null);
    const payload = { nodes, edges };
    localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
    if (options?.agentId) {
      await supabaseClient
        .from("agents")
        .update({ workflow: payload })
        .eq("id", options.agentId);
    }
  }, [edges, nodes, options?.agentId]);

  const loadWorkflow = useCallback(async (agentId?: string) => {
    setError(null);
    if (agentId) {
      const { data } = await supabaseClient
        .from("agents")
        .select("workflow")
        .eq("id", agentId)
        .maybeSingle();
      if (data?.workflow) {
        setNodes(data.workflow.nodes || []);
        setEdges(data.workflow.edges || []);
        return;
      }
    }
    const stored = localStorage.getItem(AUTO_SAVE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { nodes: Node[]; edges: Edge[] };
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    } catch {
      setError("تعذر تحميل سير العمل.");
    }
  }, []);

  const validateWorkflow = useCallback((): WorkflowValidation => {
    const errors: string[] = [];
    if (nodes.length === 0) {
      errors.push("لا توجد عقد في سير العمل.");
    }
    const hasInput = nodes.some((node) => node.type === "input");
    const hasOutput = nodes.some((node) => node.type === "output");
    if (!hasInput) {
      errors.push("يجب إضافة عقدة إدخال واحدة على الأقل.");
    }
    if (!hasOutput) {
      errors.push("يجب إضافة عقدة إخراج واحدة على الأقل.");
    }
    return { valid: errors.length === 0, errors };
  }, [nodes]);

  useEffect(() => {
    const stored = localStorage.getItem(AUTO_SAVE_KEY);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { nodes: Node[]; edges: Edge[] };
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    } catch {
      setError("تعذر تحميل سير العمل.");
    }
  }, []);

  return useMemo(
    () => ({
      nodes,
      edges,
      error,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      deleteNode,
      updateNode,
      saveWorkflow,
      loadWorkflow,
      validateWorkflow,
    }),
    [
      nodes,
      edges,
      error,
      onNodesChange,
      onEdgesChange,
      onConnect,
      addNode,
      deleteNode,
      updateNode,
      saveWorkflow,
      loadWorkflow,
      validateWorkflow,
    ]
  );
};
