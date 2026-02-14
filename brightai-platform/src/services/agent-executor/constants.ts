import type { ToolType } from "../agent.tools";

export const MAX_EXECUTION_TIME_MS = 5 * 60 * 1000;
export const DEFAULT_MEMORY_LIMIT = 50;
export const DEFAULT_MODEL = "llama-3.1-70b-versatile";
export const DEFAULT_CONTEXT_WINDOW = 8000;
export const DEFAULT_MAX_DEPTH = 2;

export const TOOL_ACTIONS: ToolType[] = [
  "web_search",
  "db_query",
  "file_upload",
  "file_delete",
  "http_request",
  "web_scrape",
  "email_send",
  "calendar_event",
];
