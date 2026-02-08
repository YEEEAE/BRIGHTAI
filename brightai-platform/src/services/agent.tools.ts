import supabase from "../lib/supabase";
import { http } from "./http";

export type ToolType =
  | "web_search"
  | "db_query"
  | "file_upload"
  | "file_delete"
  | "http_request"
  | "web_scrape"
  | "email_send"
  | "calendar_event";

export type ToolRequest = {
  type: ToolType;
  params?: Record<string, unknown>;
};

export type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: ToolErrorCode;
  meta?: Record<string, unknown>;
};

export type ToolContext = {
  userId: string;
  agentId: string;
  variables: Record<string, unknown>;
  traceId?: string;
};

export type ToolErrorCode =
  | "MISSING_ENDPOINT"
  | "INVALID_PARAMS"
  | "FAILED"
  | "RATE_LIMIT"
  | "UNAUTHORIZED";

class ToolError extends Error {
  code: ToolErrorCode;
  constructor(message: string, code: ToolErrorCode) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

const TOOL_ENDPOINTS = {
  web_search: process.env.REACT_APP_TOOL_WEBSEARCH_URL || "",
  web_scrape: process.env.REACT_APP_TOOL_SCRAPE_URL || "",
  email_send: process.env.REACT_APP_TOOL_EMAIL_URL || "",
  calendar_event: process.env.REACT_APP_TOOL_CALENDAR_URL || "",
};

const parseParams = (params?: Record<string, unknown>) => params || {};

const normalizeHeaders = (value: Record<string, unknown>) => {
  const headers: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (raw === undefined || raw === null) {
      continue;
    }
    headers[key] = String(raw);
  }
  return headers;
};

const buildBlob = (payload: unknown, contentType?: string) => {
  if (payload instanceof Blob) {
    return payload;
  }
  if (payload instanceof ArrayBuffer) {
    return new Blob([payload], { type: contentType || "application/octet-stream" });
  }
  if (payload instanceof Uint8Array) {
    return new Blob([payload], { type: contentType || "application/octet-stream" });
  }
  if (typeof payload === "string") {
    return new Blob([payload], { type: contentType || "text/plain" });
  }
  return null;
};

export class AgentTools {
  // تنفيذ أداة محددة مع سياق الوكيل
  async execute(request: ToolRequest, context: ToolContext): Promise<ToolResult> {
    try {
      switch (request.type) {
        case "web_search":
          return await this.callEndpoint("web_search", request, context);
        case "web_scrape":
          return await this.callEndpoint("web_scrape", request, context);
        case "email_send":
          return await this.callEndpoint("email_send", request, context);
        case "calendar_event":
          return await this.callEndpoint("calendar_event", request, context);
        case "db_query":
          return await this.queryDatabase(request, context);
        case "file_upload":
          return await this.uploadFile(request, context);
        case "file_delete":
          return await this.deleteFile(request, context);
        case "http_request":
          return await this.httpRequest(request, context);
        default:
          throw new ToolError("الأداة غير مدعومة.", "INVALID_PARAMS");
      }
    } catch (error) {
      if (error instanceof ToolError) {
        return {
          success: false,
          error: error.message,
          errorCode: error.code,
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : "فشل تنفيذ الأداة.",
        errorCode: "FAILED",
      };
    }
  }

  private async callEndpoint(
    key: keyof typeof TOOL_ENDPOINTS,
    request: ToolRequest,
    context: ToolContext
  ): Promise<ToolResult> {
    const endpoint = TOOL_ENDPOINTS[key];
    if (!endpoint) {
      throw new ToolError("مسار الأداة غير مهيأ.", "MISSING_ENDPOINT");
    }
    const params = parseParams(request.params);
    const response = await http.post(endpoint, {
      ...params,
      context: {
        userId: context.userId,
        agentId: context.agentId,
        traceId: context.traceId,
      },
    });
    return { success: true, data: response.data };
  }

  private async httpRequest(request: ToolRequest, context: ToolContext): Promise<ToolResult> {
    const params = parseParams(request.params);
    const url = String(params.url || "");
    if (!url) {
      throw new ToolError("عنوان الطلب غير محدد.", "INVALID_PARAMS");
    }
    const method = String(params.method || "GET").toUpperCase();
    const headers = params.headers && typeof params.headers === "object"
      ? normalizeHeaders(params.headers as Record<string, unknown>)
      : undefined;
    const response = await http.request({
      url,
      method,
      data: params.data,
      headers,
    });
    return { success: true, data: response.data, meta: { status: response.status } };
  }

  private async queryDatabase(request: ToolRequest, context: ToolContext): Promise<ToolResult> {
    const params = parseParams(request.params);
    const table = String(params.table || "");
    if (!table) {
      throw new ToolError("اسم الجدول غير محدد.", "INVALID_PARAMS");
    }
    const select = String(params.select || "*");
    let query = supabase.from(table).select(select);

    const filters = Array.isArray(params.filters) ? params.filters : [];
    for (const filter of filters) {
      if (!filter || typeof filter !== "object") {
        continue;
      }
      const filterObj = filter as Record<string, unknown>;
      const column = String(filterObj.column || "");
      const operator = String(filterObj.operator || "eq");
      const value = filterObj.value;
      if (!column) {
        continue;
      }
      switch (operator) {
        case "eq":
          query = query.eq(column, value as never);
          break;
        case "neq":
          query = query.neq(column, value as never);
          break;
        case "gt":
          query = query.gt(column, value as never);
          break;
        case "gte":
          query = query.gte(column, value as never);
          break;
        case "lt":
          query = query.lt(column, value as never);
          break;
        case "lte":
          query = query.lte(column, value as never);
          break;
        case "like":
          query = query.like(column, String(value));
          break;
        case "ilike":
          query = query.ilike(column, String(value));
          break;
        case "in":
          if (Array.isArray(value)) {
            query = query.in(column, value as never[]);
          }
          break;
        case "contains":
          query = query.contains(column, value as never);
          break;
        case "contained_by":
          query = query.containedBy(column, value as never);
          break;
        case "is":
          query = query.is(column, value as never);
          break;
        default:
          break;
      }
    }

    const limit = Math.min(Number(params.limit || 50), 200);
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      throw new ToolError(error.message || "فشل تنفيذ الاستعلام.", "FAILED");
    }
    return { success: true, data, meta: { count: Array.isArray(data) ? data.length : 0 } };
  }

  private async uploadFile(request: ToolRequest, context: ToolContext): Promise<ToolResult> {
    const params = parseParams(request.params);
    const bucket = String(params.bucket || "");
    const path = String(params.path || "");
    if (!bucket || !path) {
      throw new ToolError("بيانات التخزين غير مكتملة.", "INVALID_PARAMS");
    }
    const payload = buildBlob(params.file, params.contentType ? String(params.contentType) : undefined);
    if (!payload) {
      throw new ToolError("ملف غير صالح.", "INVALID_PARAMS");
    }
    const { data, error } = await supabase.storage.from(bucket).upload(path, payload, { upsert: true });
    if (error) {
      throw new ToolError(error.message || "فشل رفع الملف.", "FAILED");
    }
    return { success: true, data };
  }

  private async deleteFile(request: ToolRequest, context: ToolContext): Promise<ToolResult> {
    const params = parseParams(request.params);
    const bucket = String(params.bucket || "");
    const path = String(params.path || "");
    if (!bucket || !path) {
      throw new ToolError("بيانات الحذف غير مكتملة.", "INVALID_PARAMS");
    }
    const { data, error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      throw new ToolError(error.message || "فشل حذف الملف.", "FAILED");
    }
    return { success: true, data };
  }
}

const agentTools = new AgentTools();
export default agentTools;
