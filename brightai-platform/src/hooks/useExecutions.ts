import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../lib/supabase";
import aiOrchestrator from "../services/ai-core/orchestrator";
import { useAuth } from "./useAuth";
import { trackAgentExecuted, trackExecutionDuration, trackErrorEvent } from "../lib/analytics";

type ExecutionRow = {
  id: string;
  agent_id: string;
  user_id: string;
  status: "ناجح" | "فشل" | "قيد التنفيذ";
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  model_used?: string | null;
  execution_context?: Record<string, unknown> | null;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

export const useExecutions = (options?: { realtime?: boolean }) => {
  const { currentUser } = useAuth();
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const fetchHistory = useCallback(
    async (agentId?: string, page = 0, pageSize = 50) => {
      if (!currentUser) {
        setExecutions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      let query = supabaseClient
        .from("executions")
        .select(
          "id, agent_id, user_id, status, input, output, error_message, started_at, completed_at, duration_ms, tokens_used, cost_usd, model_used, execution_context"
        )
        .eq("user_id", currentUser.id)
        .order("started_at", { ascending: false })
        .range(page * pageSize, page * pageSize + pageSize - 1);
      if (agentId) {
        query = query.eq("agent_id", agentId);
      }
      const { data, error: fetchError } = await query;
      if (fetchError) {
        setError("تعذر تحميل سجل التنفيذات.");
        setLoading(false);
        return;
      }
      setExecutions((data || []) as ExecutionRow[]);
      setLoading(false);
    },
    [currentUser]
  );

  const executeAgent = useCallback(
    async (agentId: string, input: { message: string; context?: Record<string, unknown> }) => {
      if (!currentUser) {
        setError("الرجاء تسجيل الدخول أولاً.");
        return null;
      }
      setError(null);
      const startedAt = performance.now();
      try {
        const result = await aiOrchestrator.execute({
          agentId,
          userMessage: input.message,
          context: {
            userId: currentUser.id,
            variables: input.context,
          },
          orchestration: {
            enabled: true,
            maxRetries: 1,
            minimumScore: 0.72,
          },
        });
        if (result.executionId) {
          await supabaseClient
            .from("executions")
            .update({
              execution_context: {
                orchestration: {
                  traceId: result.traceId,
                  attempts: result.attempts,
                  quality: result.quality,
                },
              },
            })
            .eq("id", result.executionId)
            .eq("user_id", currentUser.id);
        }
        const duration = performance.now() - startedAt;
        trackAgentExecuted(agentId, "ناجح", duration);
        trackExecutionDuration(agentId, duration, "ناجح");
        await fetchHistory(agentId);
        return result;
      } catch (error) {
        const duration = performance.now() - startedAt;
        trackAgentExecuted(agentId, "فشل", duration);
        trackExecutionDuration(agentId, duration, "فشل");
        trackErrorEvent(error, "execution");
        await fetchHistory(agentId);
        throw error;
      }
    },
    [currentUser, fetchHistory]
  );

  const cancelExecution = useCallback(
    async (id: string) => {
      if (!currentUser) {
        setError("الرجاء تسجيل الدخول أولاً.");
        return false;
      }
      const { error: cancelError } = await supabaseClient
        .from("executions")
        .update({
          status: "فشل",
          error_message: "تم إلغاء التنفيذ.",
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (cancelError) {
        setError("تعذر إلغاء التنفيذ.");
        return false;
      }
      await fetchHistory();
      return true;
    },
    [currentUser, fetchHistory]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (!currentUser || options?.realtime === false) {
      return;
    }
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
    }
    channelRef.current = supabaseClient
      .channel(`executions-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "executions", filter: `user_id=eq.${currentUser.id}` },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
      }
    };
  }, [currentUser, fetchHistory, options?.realtime]);

  return useMemo(
    () => ({
      executions,
      loading,
      error,
      executeAgent,
      getExecutionHistory: fetchHistory,
      cancelExecution,
    }),
    [executions, loading, error, executeAgent, fetchHistory, cancelExecution]
  );
};
