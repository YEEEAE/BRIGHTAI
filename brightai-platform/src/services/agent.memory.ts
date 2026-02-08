import supabase from "../lib/supabase";

export type MemoryEntry = {
  id: string;
  userId: string;
  agentId: string;
  content: string;
  role: "user" | "assistant" | "system" | "tool";
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type MemorySearchResult = MemoryEntry & { score: number };

export type MemoryContext = {
  items: MemorySearchResult[];
  snippet: string;
};

const MEMORY_PREFIX = "brightai.memory";
const MAX_LOCAL_ITEMS = 200;
const MAX_SNIPPET_LENGTH = 1200;

const buildKey = (userId: string, agentId: string) =>
  `${MEMORY_PREFIX}.${userId}.${agentId}`;

const safeParse = (value: string | null): MemoryEntry[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as MemoryEntry[]) : [];
  } catch {
    return [];
  }
};

const tokenize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\\s]/g, " ")
    .split(/\\s+/)
    .filter(Boolean);

const scoreText = (query: string, target: string) => {
  const queryTokens = new Set(tokenize(query));
  const targetTokens = new Set(tokenize(target));
  if (queryTokens.size === 0 || targetTokens.size === 0) {
    return 0;
  }
  let intersection = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      intersection += 1;
    }
  }
  const union = queryTokens.size + targetTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export class AgentMemory {
  // إضافة عنصر إلى الذاكرة المحلية مع محاولة حفظه في قاعدة البيانات
  async addEntry(entry: Omit<MemoryEntry, "id" | "createdAt">): Promise<MemoryEntry> {
    const stored: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : `mem_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    };

    this.storeLocal(stored);
    await this.storeRemote(stored);
    return stored;
  }

  // استرجاع الذاكرة وفق الاستعلام مع بحث دلالي بسيط
  async search(userId: string, agentId: string, query: string, limit = 6): Promise<MemorySearchResult[]> {
    const entries = this.readLocal(userId, agentId);
    const scored = entries
      .map((entry) => ({ ...entry, score: scoreText(query, entry.content) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return scored;
  }

  // تجهيز مقطع ذاكرة للاستخدام في السياق
  async getContext(userId: string, agentId: string, query: string): Promise<MemoryContext> {
    const items = await this.search(userId, agentId, query);
    const snippet = items
      .map((item) => `• ${item.content}`)
      .join("\n")
      .slice(0, MAX_SNIPPET_LENGTH);
    return { items, snippet };
  }

  private readLocal(userId: string, agentId: string) {
    if (typeof window === "undefined") {
      return [] as MemoryEntry[];
    }
    const key = buildKey(userId, agentId);
    return safeParse(window.sessionStorage.getItem(key));
  }

  private storeLocal(entry: MemoryEntry) {
    if (typeof window === "undefined") {
      return;
    }
    const key = buildKey(entry.userId, entry.agentId);
    const current = safeParse(window.sessionStorage.getItem(key));
    const next = [...current, entry].slice(-MAX_LOCAL_ITEMS);
    window.sessionStorage.setItem(key, JSON.stringify(next));
  }

  private async storeRemote(entry: MemoryEntry) {
    try {
      const { error } = await (
        supabase as unknown as {
          from: (
            table: string
          ) => {
            insert: (
              value: Record<string, unknown>
            ) => Promise<{ error: { message: string } | null }>;
          };
        }
      )
        .from("agent_memories")
        .insert({
          user_id: entry.userId,
          agent_id: entry.agentId,
          content: entry.content,
          role: entry.role,
          metadata: entry.metadata || {},
          created_at: entry.createdAt,
        });
      if (error) {
        return;
      }
    } catch {
      return;
    }
  }
}

const agentMemory = new AgentMemory();
export default agentMemory;
