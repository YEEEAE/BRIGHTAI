import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase from "../lib/supabase";
import agentExecutor from "../services/agent.executor";
import { useAuth } from "./useAuth";

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
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

export const useExecutions = () => {
  const { currentUser } = useAuth();
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const fetchHistory = useCallback(
    async (agentId?: string) => {
      if (!currentUser) {
        setExecutions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      let query = supabaseClient
        .from("executions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("started_at", { ascending: false });
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
      const result = await agentExecutor.execute({
        agentId,
        userMessage: input.message,
        context: {
          userId: currentUser.id,
          variables: input.context,
        },
      });
      await fetchHistory(agentId);
      return result;
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
    if (!currentUser) {
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
  }, [currentUser, fetchHistory]);

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
