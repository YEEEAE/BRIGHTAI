import supabase from "../../lib/supabase";
import type { AgentExecutionInput, AgentExecutionSummary, AgentRow, ApiKeyRow, Workflow } from "./types";
import { AgentExecutorError } from "./types";

export class AgentExecutorRepository {
  async loadAgent(agentId: string): Promise<{ agent: AgentRow; workflow: Workflow }> {
    const { data, error } = await supabase.from("agents").select("*").eq("id", agentId).single<AgentRow>();

    if (error || !data) {
      throw new AgentExecutorError("الوكيل غير موجود.", "AGENT_NOT_FOUND");
    }

    const workflow = (data.workflow || { nodes: [], edges: [] }) as Workflow;
    return { agent: data, workflow };
  }

  async resolveApiKey(input: AgentExecutionInput, agent: { user_id: string; settings?: Record<string, unknown> }): Promise<string> {
    if (input.context?.apiKey) {
      return input.context.apiKey;
    }

    const useUserKey = Boolean(input.context?.useUserKey) || Boolean(agent.settings?.useUserKey);

    if (!useUserKey) {
      const platformKey = process.env.REACT_APP_GROQ_API_KEY;
      if (!platformKey) {
        throw new AgentExecutorError("مفتاح Groq غير متوفر.", "MISSING_API_KEY");
      }
      return platformKey;
    }

    if (!input.context?.userId) {
      throw new AgentExecutorError("معرف المستخدم غير متوفر.", "MISSING_API_KEY");
    }

    const { data, error } = await supabase
      .from("api_keys")
      .select("key_encrypted")
      .eq("user_id", input.context.userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single<ApiKeyRow>();

    if (error || !data?.key_encrypted) {
      throw new AgentExecutorError("مفتاح المستخدم غير متوفر.", "MISSING_API_KEY");
    }

    const { data: decrypted, error: decryptError } = await (supabase as unknown as {
      rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: string | null; error: unknown }>;
    }).rpc("decrypt_api_key", {
      encrypted_key: data.key_encrypted as string,
    });

    if (decryptError || !decrypted) {
      throw new AgentExecutorError("تعذر فك تشفير المفتاح.", "MISSING_API_KEY");
    }

    return String(decrypted);
  }

  async saveExecutionLog(
    input: AgentExecutionInput,
    result: AgentExecutionSummary,
    durationMs: number,
    status: "ناجح" | "فشل",
    errorMessage: string | null
  ): Promise<void> {
    const payload = {
      agent_id: input.agentId,
      user_id: input.context?.userId,
      input: { message: input.userMessage, context: input.context?.metadata || {} },
      output: { text: result.output },
      status,
      error_message: errorMessage,
      duration_ms: durationMs,
      tokens_used: result.tokensUsed,
      cost_usd: result.cost,
      execution_context: {
        trace_id: input.context?.traceId || null,
        metadata: input.context?.metadata || {},
        variables: input.context?.variables || {},
      },
      model_used:
        typeof input.context?.metadata?.model === "string"
          ? String(input.context?.metadata?.model)
          : null,
      started_at: new Date(Date.now() - durationMs).toISOString(),
      completed_at: new Date().toISOString(),
    };

    const { error } = await (supabase as unknown as {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      };
    })
      .from("executions")
      .insert(payload);

    if (error) {
      console.error("فشل حفظ سجل التنفيذ.", error.message);
    }
  }
}

export default new AgentExecutorRepository();
