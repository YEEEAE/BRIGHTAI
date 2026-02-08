import { createClient, SupabaseClient, User } from "@supabase/supabase-js";

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  plan: string | null;
  created_at: string;
  updated_at: string;
};

export type Agent = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow: Json | null;
  settings: Json | null;
  status: "نشط" | "متوقف" | "قيد المراجعة";
  is_public: boolean;
  execution_count: number;
  success_rate: number | null;
  avg_response_time: number | null;
  tags: string[] | null;
  version: string | null;
  created_at: string;
  updated_at: string;
};

export type ApiKey = {
  id: string;
  user_id: string;
  provider: string;
  key_encrypted: string;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
};

export type Execution = {
  id: string;
  agent_id: string;
  user_id: string;
  input: Json | null;
  output: Json | null;
  status: "ناجح" | "فشل" | "قيد التنفيذ";
  error_message: string | null;
  duration_ms: number | null;
  tokens_used: number | null;
  cost_usd: number | null;
  started_at: string | null;
  completed_at: string | null;
};

export type Template = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  workflow: Json | null;
  settings: Json | null;
  preview_image_url: string | null;
  author_id: string | null;
  downloads: number;
  rating: number | null;
  is_featured: boolean;
  created_at: string;
};

type TableRow<T> = T;
type TableInsert<T> = Partial<T>;
type TableUpdate<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: TableRow<Profile>;
        Insert: TableInsert<Profile>;
        Update: TableUpdate<Profile>;
      };
      agents: {
        Row: TableRow<Agent>;
        Insert: TableInsert<Agent>;
        Update: TableUpdate<Agent>;
      };
      api_keys: {
        Row: TableRow<ApiKey>;
        Insert: TableInsert<ApiKey>;
        Update: TableUpdate<ApiKey>;
      };
      executions: {
        Row: TableRow<Execution>;
        Insert: TableInsert<Execution>;
        Update: TableUpdate<Execution>;
      };
      templates: {
        Row: TableRow<Template>;
        Insert: TableInsert<Template>;
        Update: TableUpdate<Template>;
      };
    };
  };
};

class SupabaseAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAuthError";
  }
}

class SupabaseStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseStorageError";
  }
}

class SupabaseQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseQueryError";
  }
}

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

// منع توقف الواجهة عند غياب إعدادات Supabase في بيئة التطوير
if (!hasSupabaseConfig) {
  console.warn("بيانات Supabase غير متوفرة في متغيرات البيئة.");
}

const resolvedSupabaseUrl =
  supabaseUrl || "https://placeholder.supabase.co";
const resolvedSupabaseKey =
  supabaseAnonKey || "placeholder-anon-key";

const storage =
  typeof window !== "undefined" ? window.localStorage : undefined;

const supabase: SupabaseClient<Database> = createClient<Database>(
  resolvedSupabaseUrl,
  resolvedSupabaseKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage,
      detectSessionInUrl: true,
    },
  }
);

export const isSupabaseConfigured = hasSupabaseConfig;

export const fromTable = <T extends keyof Database["public"]["Tables"]>(
  table: T
) => {
  // استعلامات مؤمنة بالأنواع لكل جدول
  return supabase.from(table);
};

export const getCurrentUser = async (): Promise<User | null> => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw new SupabaseAuthError(error.message);
  }
  return data.user;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new SupabaseAuthError(error.message);
  }
};

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) {
    throw new SupabaseStorageError(error.message);
  }

  return data;
};

export const deleteFile = async (bucket: string, path: string) => {
  const { data, error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new SupabaseStorageError(error.message);
  }

  return data;
};

export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new SupabaseStorageError("تعذر إنشاء رابط عام للملف.");
  }
  return data.publicUrl;
};

export const safeSelect = async <T>(
  queryPromise: Promise<{ data: T | null; error: { message: string } | null }>
) => {
  const { data, error } = await queryPromise;
  if (error) {
    throw new SupabaseQueryError(error.message);
  }
  return data;
};

export default supabase;
