import { create } from "zustand";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from "reactflow";

const initialNodes: Node[] = [
  {
    id: "input",
    position: { x: 0, y: 80 },
    data: { label: "مصدر البيانات" },
    type: "input",
  },
  {
    id: "ai",
    position: { x: 240, y: 80 },
    data: { label: "تحليل ذكاء اصطناعي" },
  },
  {
    id: "output",
    position: { x: 520, y: 80 },
    data: { label: "مخرجات تنفيذية" },
    type: "output",
  },
];

const initialEdges: Edge[] = [
  {
    id: "input-ai",
    source: "input",
    target: "ai",
    animated: true,
    style: { stroke: "#34d399" },
  },
  {
    id: "ai-output",
    source: "ai",
    target: "output",
    animated: true,
    style: { stroke: "#34d399" },
  },
];

type WorkflowState = {
  nodes: Node[];
  edges: Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
};

const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({
      edges: addEdge(
        { ...connection, animated: true, style: { stroke: "#34d399" } },
        get().edges
      ),
    }),
}));

export default useWorkflowStore;
