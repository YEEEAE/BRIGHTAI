import { useTranslation } from "react-i18next";
import ReactFlow, { Background, Controls, MiniMap } from "reactflow";
import "reactflow/dist/style.css";
import Card from "../components/ui/Card";
import useWorkflowStore from "../store/workflowStore";

const WorkflowPage = () => {
  const { t } = useTranslation();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-xl font-bold text-slate-100">{t("workflow.title")}</h2>
        <p className="mt-3 text-sm text-slate-300">{t("workflow.subtitle")}</p>
      </Card>

      <Card className="h-[70vh] p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Background gap={16} size={1} color="#1e293b" />
          <MiniMap
            nodeColor={() => "#22c55e"}
            maskColor="rgba(15, 23, 42, 0.6)"
          />
          <Controls position="bottom-left" />
        </ReactFlow>
      </Card>
    </div>
  );
};

export default WorkflowPage;
