import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import supabase, { Agent } from "../lib/supabase";
import { useAuth } from "./useAuth";

type AgentInput = Omit<Partial<Agent>, "id" | "created_at" | "updated_at" | "execution_count" | "success_rate" | "avg_response_time">;

type UseAgentsResult = {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: (force?: boolean) => Promise<void>;
  createAgent: (data: AgentInput) => Promise<Agent | null>;
  updateAgent: (id: string, data: AgentInput) => Promise<boolean>;
  deleteAgent: (id: string) => Promise<boolean>;
  getAgent: (id: string) => Promise<Agent | null>;
};

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
  channel: (name: string) => any;
  removeChannel: (channel: unknown) => void;
};

const CACHE_TTL_MS = 30000;
let agentsCache: { userId: string; data: Agent[]; timestamp: number } | null = null;

export const useAgents = (options?: { realtime?: boolean }): UseAgentsResult => {
  const { currentUser } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const isCacheValid = (userId: string) => {
    if (!agentsCache) {
      return false;
    }
    return agentsCache.userId === userId && Date.now() - agentsCache.timestamp < CACHE_TTL_MS;
  };

  const fetchAgents = useCallback(
    async (force = false) => {
      if (!currentUser) {
        setAgents([]);
        setLoading(false);
        return;
      }
      if (!force && isCacheValid(currentUser.id)) {
        setAgents(agentsCache?.data || []);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabaseClient
        .from("agents")
        .select(
          "id, user_id, name, description, category, workflow, settings, status, is_public, execution_count, success_rate, avg_response_time, tags, version, created_at, updated_at"
        )
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false });
      if (fetchError) {
        setError("تعذر تحميل الوكلاء.");
        setLoading(false);
        return;
      }
      const list = (data || []) as Agent[];
      setAgents(list);
      agentsCache = { userId: currentUser.id, data: list, timestamp: Date.now() };
      setLoading(false);
    },
    [currentUser]
  );

  const invalidateCache = () => {
    agentsCache = null;
  };

  const createAgent = useCallback(
    async (data: AgentInput) => {
      if (!currentUser) {
        setError("الرجاء تسجيل الدخول أولاً.");
        return null;
      }
      setError(null);
      const optimistic: Agent = {
        id: `temp-${Date.now()}`,
        user_id: currentUser.id,
        name: data.name || "وكيل جديد",
        description: data.description || null,
        category: data.category || null,
        workflow: (data.workflow as any) || null,
        settings: (data.settings as any) || null,
        status: (data.status as any) || "نشط",
        is_public: Boolean(data.is_public),
        execution_count: 0,
        success_rate: null,
        avg_response_time: null,
        tags: data.tags || null,
        version: data.version || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const previous = agents;
      setAgents((prev) => [optimistic, ...prev]);

      const { data: created, error: insertError } = await supabaseClient
        .from("agents")
        .insert({ ...data, user_id: currentUser.id })
        .select("*")
        .single();

      if (insertError) {
        setAgents(previous);
        setError("تعذر إنشاء الوكيل.");
        return null;
      }
      invalidateCache();
      await fetchAgents(true);
      return created as Agent;
    },
    [agents, currentUser, fetchAgents]
  );

  const updateAgent = useCallback(
    async (id: string, data: AgentInput) => {
      if (!currentUser) {
        setError("الرجاء تسجيل الدخول أولاً.");
        return false;
      }
      setError(null);
      const previous = agents;
      setAgents((prev) =>
        prev.map((agent) => (agent.id === id ? { ...agent, ...data } : agent))
      );
      const { error: updateError } = await supabaseClient
        .from("agents")
        .update({ ...data })
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (updateError) {
        setAgents(previous);
        setError("تعذر تحديث الوكيل.");
        return false;
      }
      invalidateCache();
      return true;
    },
    [agents, currentUser]
  );

  const deleteAgent = useCallback(
    async (id: string) => {
      if (!currentUser) {
        setError("الرجاء تسجيل الدخول أولاً.");
        return false;
      }
      setError(null);
      const previous = agents;
      setAgents((prev) => prev.filter((agent) => agent.id !== id));
      const { error: deleteError } = await supabaseClient
        .from("agents")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (deleteError) {
        setAgents(previous);
        setError("تعذر حذف الوكيل.");
        return false;
      }
      invalidateCache();
      return true;
    },
    [agents, currentUser]
  );

  const getAgent = useCallback(
    async (id: string) => {
      const local = agents.find((agent) => agent.id === id);
      if (local) {
        return local;
      }
      if (!currentUser) {
        return null;
      }
      const { data } = await supabaseClient
        .from("agents")
        .select("*")
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      return (data as Agent) || null;
    },
    [agents, currentUser]
  );

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (!currentUser || options?.realtime === false) {
      return;
    }
    if (channelRef.current) {
      supabaseClient.removeChannel(channelRef.current);
    }
    channelRef.current = supabaseClient
      .channel(`agents-${currentUser.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "agents", filter: `user_id=eq.${currentUser.id}` },
        () => {
          fetchAgents(true);
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabaseClient.removeChannel(channelRef.current);
      }
    };
  }, [currentUser, fetchAgents, options?.realtime]);

  const value = useMemo(
    () => ({
      agents,
      loading,
      error,
      fetchAgents,
      createAgent,
      updateAgent,
      deleteAgent,
      getAgent,
    }),
    [agents, loading, error, fetchAgents, createAgent, updateAgent, deleteAgent, getAgent]
  );

  return value;
};
