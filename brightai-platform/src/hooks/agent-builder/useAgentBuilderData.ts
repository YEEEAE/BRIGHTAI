import useAgentBuilderHydration from "./useAgentBuilderHydration";
import useAgentBuilderLifecycle from "./useAgentBuilderLifecycle";
import type {
  حالةالنموذج,
  حالةنظام,
  خطوة,
  ملخصسير,
  وضعسير,
} from "../../types/agent-builder.types";

type Params = {
  id?: string;
  showError: (msg: string) => void;
  setTemplates: (next: any[]) => void;
  setLoadingPage: (next: boolean) => void;
  setLocalMode: (next: boolean) => void;
  setUserId: (next: string) => void;
  setWorkflowSummary: (next: ملخصسير | ((prev: ملخصسير) => ملخصسير)) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
  setSystemState: (next: حالةنظام | ((prev: حالةنظام) => حالةنظام)) => void;
  setLastSavedAt: (next: string) => void;
  setStep: (next: خطوة) => void;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  hydrateFromDraft: () => void;
  initializedRef: { current: boolean };
  preloadWorkflow: () => void;
  step: خطوة;
  وضعالسير: وضعسير;
};

const useAgentBuilderData = (params: Params) => {
  const { loadTemplates, hydrateFromDatabase } = useAgentBuilderHydration({
    id: params.id,
    showError: params.showError,
    setTemplates: params.setTemplates,
    applyPartialForm: params.applyPartialForm,
    setWorkflowKey: params.setWorkflowKey,
  });

  useAgentBuilderLifecycle({
    id: params.id,
    showError: params.showError,
    setLoadingPage: params.setLoadingPage,
    setLocalMode: params.setLocalMode,
    setUserId: params.setUserId,
    setWorkflowSummary: params.setWorkflowSummary,
    setWorkflowKey: params.setWorkflowKey,
    setSystemState: params.setSystemState,
    setLastSavedAt: params.setLastSavedAt,
    setStep: params.setStep,
    applyPartialForm: params.applyPartialForm,
    initializedRef: params.initializedRef,
    preloadWorkflow: params.preloadWorkflow,
    step: params.step,
    وضعالسير: params.وضعالسير,
    loadTemplates,
    hydrateFromDatabase,
  });

  return {
    loadTemplates,
    hydrateFromDatabase,
  };
};

export default useAgentBuilderData;
