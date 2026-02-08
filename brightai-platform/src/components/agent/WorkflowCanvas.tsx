import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Connection,
  Controls,
  Edge,
  MiniMap,
  Node,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlowInstance,
} from "reactflow";
import { LayoutGrid, Redo2, Save, Undo2, Wand2 } from "lucide-react";
import NodePalette from "./NodePalette";
import NodeEditor from "./NodeEditor";
import { WorkflowNodeData, edgeTypes, nodeTypes } from "./CustomNodes";

type FlowSnapshot = {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge[];
};

const AUTO_SAVE_KEY = "brightai_workflow_autosave";
const SAVE_KEY = "brightai_workflow_saved";

const WorkflowCanvas = () => {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const historyRef = useRef<FlowSnapshot[]>([]);
  const futureRef = useRef<FlowSnapshot[]>([]);
  const restoringRef = useRef(false);
  const autosaveTimer = useRef<number | null>(null);

  const hydrateNodes = useCallback(
    (items: Node<WorkflowNodeData>[]) =>
      items.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onEdit: (id: string) => handleEditNode(id),
          onCopy: (id: string) => handleCopyNode(id),
          onDelete: (id: string) => handleDeleteNode(id),
        },
      })),
    []
  );

  const initialize = useCallback(() => {
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as FlowSnapshot;
      const hydrated = hydrateNodes(parsed.nodes || []);
      setNodes(hydrated);
      setEdges(parsed.edges || []);
      historyRef.current = [cloneSnapshot({ nodes: hydrated, edges: parsed.edges || [] })];
      return;
    }

    const initialNodes: Node<WorkflowNodeData>[] = hydrateNodes([
      {
        id: "input-1",
        type: "input",
        position: { x: 0, y: 120 },
        data: {
          label: "مدخل المستخدم",
          description: "جمع المدخلات الأساسية",
          status: "جاهز",
        },
      },
      {
        id: "prompt-1",
        type: "prompt",
        position: { x: -260, y: 120 },
        data: {
          label: "موجه تنفيذي",
          description: "تحويل المدخل إلى موجه واضح",
          status: "جاهز",
        },
      },
      {
        id: "output-1",
        type: "output",
        position: { x: -520, y: 120 },
        data: {
          label: "مخرجات",
          description: "إرجاع نتيجة التنفيذ",
          status: "جاهز",
        },
      },
    ]);

    const initialEdges: Edge[] = [
      {
        id: "edge-1",
        source: "input-1",
        target: "prompt-1",
        type: "gradient",
        animated: true,
        style: { strokeWidth: 2 },
      },
      {
        id: "edge-2",
        source: "prompt-1",
        target: "output-1",
        type: "gradient",
        animated: true,
        style: { strokeWidth: 2 },
      },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
    historyRef.current = [cloneSnapshot({ nodes: initialNodes, edges: initialEdges })];
  }, [hydrateNodes]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const pushHistory = useCallback(
    (snapshot: FlowSnapshot) => {
      if (restoringRef.current) {
        return;
      }
      historyRef.current.push(cloneSnapshot(snapshot));
      futureRef.current = [];
    },
    []
  );

  useEffect(() => {
    if (autosaveTimer.current) {
      window.clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = window.setTimeout(() => {
      const payload = serializeSnapshot({ nodes, edges });
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
      setLastSavedAt(new Date().toLocaleTimeString("ar-SA"));
      pushHistory({ nodes, edges });
    }, 600);
    return () => {
      if (autosaveTimer.current) {
        window.clearTimeout(autosaveTimer.current);
      }
    };
  }, [nodes, edges, pushHistory]);

  const handleNodesChange = useCallback(
    (changes) => {
      setNodes((prev) => hydrateNodes(applyNodeChanges(changes, prev)));
    },
    [hydrateNodes]
  );

  const handleEdgesChange = useCallback((changes) => {
    setEdges((prev) => applyEdgeChanges(changes, prev));
  }, []);

  const handleConnect = useCallback(
    (connection: Connection) => {
      setEdges((prev) =>
        addEdge(
          {
            ...connection,
            type: "gradient",
            animated: true,
            style: { strokeWidth: 2 },
          },
          prev
        )
      );
    },
    []
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const raw = event.dataTransfer.getData("application/brightai");
      if (!raw) {
        return;
      }
      const payload = JSON.parse(raw) as {
        type: string;
        label: string;
        defaults?: Record<string, unknown>;
      };
      if (!reactFlowInstance) {
        return;
      }
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node<WorkflowNodeData> = {
        id: `node_${Date.now()}`,
        type: payload.type,
        position,
        data: {
          label: payload.label,
          description: "تمت إضافتها من لوحة العقد",
          status: "جاهز",
          config: payload.defaults || {},
        },
      };
      setNodes((prev) => hydrateNodes([...prev, newNode]));
    },
    [reactFlowInstance, hydrateNodes]
  );

  const handlePaletteSelect = useCallback(
    (nodeTemplate: {
      type: string;
      label: string;
      defaults?: Record<string, unknown>;
    }) => {
      if (!reactFlowInstance) {
        return;
      }
      const center = reactFlowInstance.getViewport();
      const newNode: Node<WorkflowNodeData> = {
        id: `node_${Date.now()}`,
        type: nodeTemplate.type,
        position: {
          x: -center.x + 100,
          y: -center.y + 100,
        },
        data: {
          label: nodeTemplate.label,
          description: "تمت إضافتها بنقرة واحدة",
          status: "جاهز",
          config: nodeTemplate.defaults || {},
        },
      };
      setNodes((prev) => hydrateNodes([...prev, newNode]));
    },
    [reactFlowInstance, hydrateNodes]
  );

  const handleEditNode = useCallback(
    (id: string) => {
      const node = nodes.find((item) => item.id === id);
      if (node) {
        setSelectedNode(node);
        setEditorOpen(true);
      }
    },
    [nodes]
  );

  const handleCopyNode = useCallback(
    (id: string) => {
      const node = nodes.find((item) => item.id === id);
      if (!node) {
        return;
      }
      const copy: Node<WorkflowNodeData> = {
        ...node,
        id: `node_${Date.now()}`,
        position: { x: node.position.x - 40, y: node.position.y + 40 },
        data: {
          ...node.data,
          label: `${node.data.label} (نسخة)`,
        },
      };
      setNodes((prev) => hydrateNodes([...prev, copy]));
    },
    [nodes, hydrateNodes]
  );

  const handleDeleteNode = useCallback(
    (id: string) => {
      setNodes((prev) => prev.filter((node) => node.id !== id));
      setEdges((prev) => prev.filter((edge) => edge.source !== id && edge.target !== id));
    },
    []
  );

  const handleSaveNode = useCallback(
    (id: string, data: WorkflowNodeData) => {
      setNodes((prev) =>
        hydrateNodes(
          prev.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                  },
                }
              : node
          )
        )
      );
    },
    [hydrateNodes]
  );

  const handleAutoLayout = useCallback(() => {
    const arranged = autoLayout(nodes, edges);
    setNodes(hydrateNodes(arranged));
  }, [nodes, edges, hydrateNodes]);

  const handleSave = useCallback(() => {
    const payload = serializeSnapshot({ nodes, edges });
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    setLastSavedAt(new Date().toLocaleTimeString("ar-SA"));
  }, [nodes, edges]);

  const handleLoad = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) {
      return;
    }
    const parsed = JSON.parse(saved) as FlowSnapshot;
    const hydrated = hydrateNodes(parsed.nodes || []);
    setNodes(hydrated);
    setEdges(parsed.edges || []);
  }, [hydrateNodes]);

  const handleUndo = useCallback(() => {
    const history = historyRef.current;
    if (history.length < 2) {
      return;
    }
    const current = history.pop();
    if (current) {
      futureRef.current.push(cloneSnapshot(current));
    }
    const previous = history[history.length - 1];
    if (previous) {
      restoringRef.current = true;
      setNodes(hydrateNodes(cloneNodes(previous.nodes)));
      setEdges(cloneEdges(previous.edges));
      restoringRef.current = false;
    }
  }, [hydrateNodes]);

  const handleRedo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) {
      return;
    }
    const next = future.pop();
    if (next) {
      historyRef.current.push(cloneSnapshot(next));
      restoringRef.current = true;
      setNodes(hydrateNodes(cloneNodes(next.nodes)));
      setEdges(cloneEdges(next.edges));
      restoringRef.current = false;
    }
  }, [hydrateNodes]);

  const isValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return false;
      }
      if (connection.source === connection.target) {
        return false;
      }
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);
      if (!sourceNode || !targetNode) {
        return false;
      }
      if (sourceNode.type === "output") {
        return false;
      }
      if (targetNode.type === "input") {
        return false;
      }
      return true;
    },
    [nodes]
  );

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "z") {
        event.preventDefault();
        handleUndo();
      }
      if (event.ctrlKey && (event.key === "y" || event.key === "Z")) {
        event.preventDefault();
        handleRedo();
      }
      if (event.ctrlKey && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleUndo, handleRedo, handleSave]);

  const minimapStyle = useMemo(
    () => ({ backgroundColor: "#0b1020", maskColor: "rgba(15,23,42,0.7)" }),
    []
  );

  return (
    <div className="flex h-[85vh] flex-col gap-4 lg:flex-row-reverse">
      <aside className="h-full w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-emerald-300">
          <LayoutGrid className="h-4 w-4" />
          لوحة العقد
        </div>
        <NodePalette onSelect={handlePaletteSelect} />
      </aside>

      <section className="relative flex-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
        <div className="absolute right-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAutoLayout}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-emerald-400/60"
          >
            <Wand2 className="h-4 w-4 text-emerald-300" />
            تخطيط تلقائي
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-emerald-400/60"
          >
            <Save className="h-4 w-4 text-emerald-300" />
            حفظ
          </button>
          <button
            type="button"
            onClick={handleLoad}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 hover:border-emerald-400/60"
          >
            <Save className="h-4 w-4 text-slate-300" />
            تحميل
          </button>
          <button
            type="button"
            onClick={handleUndo}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-200 hover:border-emerald-400/60"
            aria-label="تراجع"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="rounded-xl border border-slate-700 bg-slate-950/70 p-2 text-slate-200 hover:border-emerald-400/60"
            aria-label="إعادة"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {lastSavedAt ? (
          <div className="absolute left-4 top-4 z-10 rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 text-xs text-slate-400">
            تم الحفظ تلقائياً في {lastSavedAt}
          </div>
        ) : null}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onInit={setReactFlowInstance}
          onNodeDoubleClick={(_, node) => {
            setSelectedNode(node);
            setEditorOpen(true);
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          fitView
          className="h-full w-full"
          connectionLineStyle={{ stroke: "#34d399", strokeWidth: 2 }}
          isValidConnection={isValidConnection}
          panOnScroll
          zoomOnScroll
          zoomOnPinch
          style={{ touchAction: "none" }}
        >
          <Background gap={20} size={1} color="#1e293b" />
          <MiniMap
            nodeStrokeColor="#34d399"
            nodeColor="#0f172a"
            nodeBorderRadius={12}
            style={minimapStyle}
            pannable
          />
          <Controls position="bottom-left" showInteractive={false} />
        </ReactFlow>
      </section>

      <NodeEditor
        open={editorOpen}
        node={selectedNode}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveNode}
      />
    </div>
  );
};

const cloneNodes = (nodes: Node<WorkflowNodeData>[]) =>
  nodes.map((node) => ({
    ...node,
    data: { ...node.data },
    position: { ...node.position },
  }));

const cloneEdges = (edges: Edge[]) =>
  edges.map((edge) => ({
    ...edge,
  }));

const cloneSnapshot = (snapshot: FlowSnapshot): FlowSnapshot => ({
  nodes: cloneNodes(snapshot.nodes),
  edges: cloneEdges(snapshot.edges),
});

const serializeSnapshot = (snapshot: FlowSnapshot): FlowSnapshot => ({
  nodes: snapshot.nodes.map((node) => ({
    ...node,
    data: stripHandlers(node.data),
  })),
  edges: snapshot.edges,
});

const stripHandlers = (data: WorkflowNodeData): WorkflowNodeData => {
  const { onCopy, onDelete, onEdit, ...rest } = data;
  return rest;
};

const autoLayout = (nodes: Node<WorkflowNodeData>[], edges: Edge[]) => {
  const spacingX = 260;
  const spacingY = 160;
  const incoming = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach((node) => {
    incoming.set(node.id, 0);
    adjacency.set(node.id, []);
  });
  edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
  });

  const queue = nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  const layers: Node<WorkflowNodeData>[][] = [];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const layer = [...queue];
    layers.push(layer);
    queue.length = 0;
    for (const node of layer) {
      visited.add(node.id);
      for (const next of adjacency.get(node.id) || []) {
        incoming.set(next, (incoming.get(next) || 0) - 1);
        if ((incoming.get(next) || 0) === 0) {
          queue.push(nodes.find((item) => item.id === next) as Node<WorkflowNodeData>);
        }
      }
    }
  }

  const remaining = nodes.filter((node) => !visited.has(node.id));
  if (remaining.length > 0) {
    layers.push(remaining);
  }

  return nodes.map((node) => {
    const layerIndex = layers.findIndex((layer) =>
      layer.some((item) => item.id === node.id)
    );
    const indexInLayer = layers[layerIndex]?.findIndex((item) => item.id === node.id) || 0;
    return {
      ...node,
      position: {
        x: -layerIndex * spacingX,
        y: indexInLayer * spacingY,
      },
    };
  });
};

export default WorkflowCanvas;
