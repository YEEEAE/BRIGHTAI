import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../lib/supabase";
import { getLocalAdminUser } from "../../lib/local-admin";
import { getDraftKey, readWorkflowSummary, withTimeout } from "../../lib/agent-builder.utils";
import { WORKFLOW_STORAGE_KEY, WORKFLOW_UPDATED_EVENT } from "../../constants/agent-builder.constants";
import type {
  حالةالنموذج,
  حالةنظام,
  خطوة,
  ملخصسير,
  نسخةمسودة,
  وضعسير,
} from "../../types/agent-builder.types";

type Params = {
  id?: string;
  showError: (msg: string) => void;
  setLoadingPage: (next: boolean) => void;
  setLocalMode: (next: boolean) => void;
  setUserId: (next: string) => void;
  setWorkflowSummary: (next: ملخصسير | ((prev: ملخصسير) => ملخصسير)) => void;
  setWorkflowKey: (next: number | ((prev: number) => number)) => void;
  setSystemState: (next: حالةنظام | ((prev: حالةنظام) => حالةنظام)) => void;
  setLastSavedAt: (next: string) => void;
  setStep: (next: خطوة) => void;
  applyPartialForm: (partial: Partial<حالةالنموذج>) => void;
  initializedRef: { current: boolean };
  preloadWorkflow: () => void;
  step: خطوة;
  وضعالسير: وضعسير;
  loadTemplates: () => Promise<void>;
  hydrateFromDatabase: (uid: string) => Promise<void>;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

const useAgentBuilderLifecycle = ({
  id,
  showError,
  setLoadingPage,
  setLocalMode,
  setUserId,
  setWorkflowSummary,
  setWorkflowKey,
  setSystemState,
  setLastSavedAt,
  setStep,
  applyPartialForm,
  initializedRef,
  preloadWorkflow,
  step,
  وضعالسير,
  loadTemplates,
  hydrateFromDatabase,
}: Params) => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "مصمم الوكلاء المتقدم | منصة برايت";
  }, []);

  const restoreDraftInternal = useCallback(() => {
    const raw = localStorage.getItem(getDraftKey(id));
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as نسخةمسودة;
      if (parsed.form) {
        applyPartialForm(parsed.form);
      }
      setLastSavedAt(parsed.lastSavedAt || "");
      if (parsed.step && parsed.step >= 1 && parsed.step <= 5) {
        setStep(parsed.step);
      }
      if (parsed.workflow) {
        localStorage.setItem(WORKFLOW_STORAGE_KEY, JSON.stringify(parsed.workflow));
        setWorkflowKey((prev) => prev + 1);
        setWorkflowSummary(readWorkflowSummary());
      }
    } catch {
      showError("تعذر استعادة المسودة المحلية.");
    }
  }, [applyPartialForm, id, setLastSavedAt, setStep, setWorkflowKey, setWorkflowSummary, showError]);

  useEffect(() => {
    let active = true;

    const init = async () => {
      setLoadingPage(true);
      try {
        const sessionPayload = await withTimeout(
          supabase.auth.getSession().catch(() => ({ data: { session: null } })),
          3500,
          { data: { session: null } }
        );
        const { data } = sessionPayload as { data: { session: { user: { id: string } } | null } };
        if (!active) {
          return;
        }

        const sessionUser = data.session?.user || null;
        const localUser = getLocalAdminUser();
        const activeUserId = sessionUser?.id || localUser?.id || "";

        if (!activeUserId) {
          navigate("/login", { replace: true });
          return;
        }

        const isLocal = !sessionUser && Boolean(localUser);
        setLocalMode(isLocal);
        setUserId(activeUserId);

        restoreDraftInternal();
        setWorkflowSummary(readWorkflowSummary());
        initializedRef.current = true;
        setLoadingPage(false);

        void (async () => {
          const templatesPromise = withTimeout(loadTemplates().catch(() => undefined), 5000, undefined);
          const hydratePromise =
            id && !isLocal
              ? withTimeout(hydrateFromDatabase(activeUserId).catch(() => undefined), 5000, undefined)
              : Promise.resolve(undefined);
          const apiStatusPromise: Promise<number> = isLocal
            ? Promise.resolve(0)
            : withTimeout(
                supabaseClient
                  .from("api_keys")
                  .select("id", { count: "exact", head: true })
                  .eq("user_id", activeUserId)
                  .eq("provider", "groq")
                  .eq("is_active", true)
                  .then(({ count }: { count?: number | null }) => Number(count || 0))
                  .catch(() => 0),
                5000,
                0
              );

          const results = await Promise.allSettled([templatesPromise, hydratePromise, apiStatusPromise]);
          if (!active) {
            return;
          }

          const apiResult = results[2];
          const apiCount = apiResult && apiResult.status === "fulfilled" ? Number(apiResult.value || 0) : 0;
          const hasEnvGroqKey = Boolean(process.env.REACT_APP_GROQ_API_KEY);

          setSystemState((prev) => ({
            ...prev,
            apiConnected: hasEnvGroqKey || apiCount > 0,
          }));
        })();
      } catch {
        if (!active) {
          return;
        }

        const localUser = getLocalAdminUser();
        if (localUser) {
          setLocalMode(true);
          setUserId(localUser.id);
          restoreDraftInternal();
          setWorkflowSummary(readWorkflowSummary());
          initializedRef.current = true;
          setLoadingPage(false);
        } else {
          showError("تعذر تهيئة مصمم الوكلاء. حاول تحديث الصفحة.");
          navigate("/login", { replace: true });
        }
      } finally {
        if (active) {
          setLoadingPage(false);
        }
      }
    };

    void init();

    return () => {
      active = false;
    };
  }, [
    hydrateFromDatabase,
    id,
    initializedRef,
    loadTemplates,
    navigate,
    restoreDraftInternal,
    setLoadingPage,
    setLocalMode,
    setSystemState,
    setUserId,
    setWorkflowSummary,
    showError,
  ]);

  useEffect(() => {
    if (step >= 2 || وضعالسير === "متقدم") {
      preloadWorkflow();
    }
  }, [preloadWorkflow, step, وضعالسير]);

  useEffect(() => {
    const syncWorkflow = () => {
      const next = readWorkflowSummary();
      setWorkflowSummary((prev) => {
        if (prev.nodes === next.nodes && prev.edges === next.edges && prev.sizeKb === next.sizeKb) {
          return prev;
        }
        return next;
      });
    };

    syncWorkflow();
    const handleWorkflowUpdated = () => syncWorkflow();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === WORKFLOW_STORAGE_KEY) {
        syncWorkflow();
      }
    };
    window.addEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(WORKFLOW_UPDATED_EVENT, handleWorkflowUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [setWorkflowSummary]);
};

export default useAgentBuilderLifecycle;
