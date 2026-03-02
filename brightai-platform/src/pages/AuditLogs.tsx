import { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "../lib/supabase";
import { isLocalAdminSessionActive } from "../lib/local-admin";
import Button from "../components/ui/Button";

type AuditLogRow = {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
};

type LogsResponse = {
  rows: AuditLogRow[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  scope: "all" | "own";
};

const DEFAULT_LIMIT = 30;
const EXPORT_LIMIT = 200;
const LOCAL_ADMIN_AUDIT_TOKEN =
  process.env.REACT_APP_AUDIT_LOCAL_ADMIN_TOKEN || "";

const actionOptions = [
  { value: "", label: "كل الإجراءات" },
  { value: "AI_REQUEST", label: "AI Request" },
  { value: "API_REQUEST", label: "API Request" },
  { value: "AUTH_EVENT", label: "Auth Event" },
  { value: "SECURITY_EVENT", label: "Security Event" },
  { value: "EXECUTION_EVENT", label: "Execution Event" },
  { value: "AUDIT_LOGS_VIEW", label: "Audit View" },
];

const levelOptions = [
  { value: "", label: "كل المستويات" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Warn" },
  { value: "error", label: "Error" },
];

const toDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("ar-SA", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getPayload = (row: AuditLogRow) => (row.payload && typeof row.payload === "object" ? row.payload : {});

const getEndpoint = (row: AuditLogRow) => {
  const payload = getPayload(row);
  const meta = payload.meta;
  const metaUrl =
    meta && typeof meta === "object"
      ? (meta as Record<string, unknown>).url
      : "";
  return String(payload.endpoint || payload.path || metaUrl || "-");
};

const getLevel = (row: AuditLogRow) => {
  const payload = getPayload(row);
  return String(payload.level || "info").toLowerCase();
};

const getRequestId = (row: AuditLogRow) => {
  const payload = getPayload(row);
  return String(payload.requestId || "-");
};

type AuditFilters = {
  action: string;
  level: string;
  userId: string;
  tableName: string;
  endpoint: string;
  requestId: string;
  dateFrom: string;
  dateTo: string;
};

const buildLogsQueryString = (filters: AuditFilters, limit: number, offset: number) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  if (filters.action) params.set("action", filters.action);
  if (filters.level) params.set("level", filters.level);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.tableName) params.set("tableName", filters.tableName);
  if (filters.endpoint) params.set("endpoint", filters.endpoint);
  if (filters.requestId) params.set("requestId", filters.requestId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params.toString();
};

const toSafeCsvCell = (value: unknown) => {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, "\"\"");
  return `"${escaped}"`;
};

const createFileStamp = () =>
  new Date().toISOString().replace(/:/g, "-").replace(/\..+$/, "");

const downloadBlob = (blob: Blob, fileName: string) => {
  if (typeof window === "undefined") {
    return;
  }
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};

const AuditLogs = () => {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [scope, setScope] = useState<"all" | "own">("own");
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);

  const [action, setAction] = useState("");
  const [level, setLevel] = useState("");
  const [userId, setUserId] = useState("");
  const [tableName, setTableName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [requestId, setRequestId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    document.title = "سجلات التدقيق | منصة برايت أي آي";
  }, []);

  const filters = useMemo(
    () => ({
      action,
      level,
      userId: userId.trim(),
      tableName: tableName.trim(),
      endpoint: endpoint.trim(),
      requestId: requestId.trim(),
      dateFrom,
      dateTo,
    }),
    [action, dateFrom, dateTo, endpoint, level, requestId, tableName, userId]
  );

  const queryString = useMemo(
    () => buildLogsQueryString(filters, DEFAULT_LIMIT, offset),
    [filters, offset]
  );

  const resolveAuditToken = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const localAdminToken = isLocalAdminSessionActive() ? LOCAL_ADMIN_AUDIT_TOKEN : "";
    return sessionData.session?.access_token || localAdminToken;
  }, []);

  const fetchLogsPage = useCallback(
    async (token: string, limit: number, pageOffset: number) => {
      const currentQuery = buildLogsQueryString(filters, limit, pageOffset);
      const response = await fetch(`/api/audit/logs?${currentQuery}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json()) as Partial<LogsResponse> & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "تعذر تحميل سجلات التدقيق.");
      }
      return {
        rows: Array.isArray(payload.rows) ? payload.rows : [],
        pagination: {
          hasMore: Boolean(payload.pagination?.hasMore),
        },
        scope: payload.scope === "all" ? "all" : "own",
      };
    },
    [filters]
  );

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const token = await resolveAuditToken();
    if (!token) {
      setLoading(false);
      setErrorMessage("يلزم تسجيل الدخول للوصول إلى سجلات التدقيق.");
      return;
    }

    try {
      const payload = await fetchLogsPage(token, DEFAULT_LIMIT, offset);
      setRows(payload.rows);
      setHasMore(payload.pagination.hasMore);
      setScope(payload.scope);
      setLoading(false);
    } catch (error) {
      setRows([]);
      setHasMore(false);
      setLoading(false);
      setErrorMessage(error instanceof Error ? error.message : "تعذر الاتصال بخدمة سجلات التدقيق.");
    }
  }, [fetchLogsPage, offset, resolveAuditToken]);

  const loadRowsForExport = useCallback(async () => {
    const token = await resolveAuditToken();
    if (!token) {
      throw new Error("يلزم تسجيل الدخول للوصول إلى سجلات التدقيق.");
    }

    const allRows: AuditLogRow[] = [];
    let exportOffset = 0;
    let pages = 0;

    // حد أمان لمنع الدوران اللانهائي إذا حدث خلل في hasMore.
    while (pages < 100) {
      const payload = await fetchLogsPage(token, EXPORT_LIMIT, exportOffset);
      allRows.push(...payload.rows);
      if (!payload.pagination.hasMore) {
        return allRows;
      }
      exportOffset += EXPORT_LIMIT;
      pages += 1;
    }

    return allRows;
  }, [fetchLogsPage, resolveAuditToken]);

  const handleExportCsv = useCallback(async () => {
    setExportingCsv(true);
    setErrorMessage("");
    try {
      const exportRows = await loadRowsForExport();
      const headers = [
        "Time",
        "Action",
        "User ID",
        "Table",
        "Endpoint",
        "Level",
        "Request ID",
        "Payload",
      ];
      const lines = [
        headers.map((cell) => toSafeCsvCell(cell)).join(","),
        ...exportRows.map((row) => {
          const payload = getPayload(row);
          return [
            toSafeCsvCell(toDateTime(row.created_at)),
            toSafeCsvCell(row.action),
            toSafeCsvCell(row.user_id || "-"),
            toSafeCsvCell(row.table_name),
            toSafeCsvCell(getEndpoint(row)),
            toSafeCsvCell(getLevel(row)),
            toSafeCsvCell(getRequestId(row)),
            toSafeCsvCell(JSON.stringify(payload)),
          ].join(",");
        }),
      ];
      const csvContent = `\uFEFF${lines.join("\r\n")}`;
      downloadBlob(
        new Blob([csvContent], { type: "text/csv;charset=utf-8" }),
        `audit-logs-${createFileStamp()}.csv`
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر تصدير CSV.");
    } finally {
      setExportingCsv(false);
    }
  }, [loadRowsForExport]);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    setErrorMessage("");
    try {
      const exportRows = await loadRowsForExport();
      const [{ jsPDF }, autoTableModule] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);
      const autoTable = autoTableModule.default;
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      pdf.setFontSize(14);
      pdf.text("Audit Logs Report", 40, 38);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toISOString()}`, 40, 56);
      pdf.text(`Rows: ${exportRows.length}`, 40, 72);

      autoTable(pdf, {
        startY: 84,
        theme: "grid",
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [241, 245, 249],
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
          valign: "top",
          overflow: "linebreak",
        },
        head: [["Time", "Action", "User ID", "Table", "Endpoint", "Level", "Request ID"]],
        body: exportRows.map((row) => [
          toDateTime(row.created_at),
          row.action,
          row.user_id || "-",
          row.table_name,
          getEndpoint(row),
          getLevel(row),
          getRequestId(row),
        ]),
        columnStyles: {
          0: { cellWidth: 105 },
          1: { cellWidth: 85 },
          2: { cellWidth: 120 },
          3: { cellWidth: 85 },
          4: { cellWidth: 180 },
          5: { cellWidth: 50 },
          6: { cellWidth: 110 },
        },
      });

      pdf.save(`audit-logs-${createFileStamp()}.pdf`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "تعذر تصدير PDF.");
    } finally {
      setExportingPdf(false);
    }
  }, [loadRowsForExport]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const onApplyFilters = () => {
    setOffset(0);
  };

  const onResetFilters = () => {
    setAction("");
    setLevel("");
    setUserId("");
    setTableName("");
    setEndpoint("");
    setRequestId("");
    setDateFrom("");
    setDateTo("");
    setOffset(0);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">سجلات التدقيق</h1>
          <p className="mt-1 text-sm text-slate-400">
            متابعة شاملة لحركة النظام: المستخدم، الإجراء، المسار، والكمون.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            نطاق العرض الحالي: {scope === "all" ? "جميع السجلات (صلاحية إدارية)" : "سجلات المستخدم الحالي"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={loadLogs} loading={loading}>
            تحديث
          </Button>
          <Button variant="outline" onClick={handleExportCsv} loading={exportingCsv}>
            تصدير CSV
          </Button>
          <Button variant="outline" onClick={handleExportPdf} loading={exportingPdf}>
            تصدير PDF
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            User ID
            <input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="UUID"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Action
            <select
              value={action}
              onChange={(event) => setAction(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            >
              {actionOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Level
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            >
              {levelOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Table Name
            <input
              value={tableName}
              onChange={(event) => setTableName(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="مثل: ai_proxy"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Endpoint
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="/api/ai/chat/completions"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Request ID
            <input
              value={requestId}
              onChange={(event) => setRequestId(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
              placeholder="req_..."
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            To
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onApplyFilters}>تطبيق الفلاتر</Button>
          <Button variant="outline" onClick={onResetFilters}>
            إعادة تعيين
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        {errorMessage ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-right text-slate-400">
                <th className="px-3 py-2 font-medium">الوقت</th>
                <th className="px-3 py-2 font-medium">الإجراء</th>
                <th className="px-3 py-2 font-medium">المستخدم</th>
                <th className="px-3 py-2 font-medium">المصدر</th>
                <th className="px-3 py-2 font-medium">Endpoint</th>
                <th className="px-3 py-2 font-medium">Level</th>
                <th className="px-3 py-2 font-medium">Request ID</th>
                <th className="px-3 py-2 font-medium">تفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={8}>
                    جارٍ تحميل السجلات...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-400" colSpan={8}>
                    لا توجد سجلات مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const payload = getPayload(row);
                  const levelText = getLevel(row);
                  return (
                    <tr key={row.id} className="border-b border-slate-900/70 align-top text-slate-200">
                      <td className="px-3 py-3">{toDateTime(row.created_at)}</td>
                      <td className="px-3 py-3">{row.action}</td>
                      <td className="px-3 py-3 text-xs text-slate-300">{row.user_id || "-"}</td>
                      <td className="px-3 py-3">{row.table_name}</td>
                      <td className="px-3 py-3 text-xs text-slate-300">{getEndpoint(row)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            levelText === "error"
                              ? "bg-rose-500/20 text-rose-200"
                              : levelText === "warn"
                              ? "bg-amber-500/20 text-amber-200"
                              : "bg-emerald-500/20 text-emerald-200"
                          }`}
                        >
                          {levelText}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400">{getRequestId(row)}</td>
                      <td className="px-3 py-3 text-xs text-slate-400">
                        <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-slate-500">Offset: {offset}</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0 || loading}
              onClick={() => setOffset((prev) => Math.max(prev - DEFAULT_LIMIT, 0))}
            >
              السابق
            </Button>
            <Button
              variant="outline"
              disabled={!hasMore || loading}
              onClick={() => setOffset((prev) => prev + DEFAULT_LIMIT)}
            >
              التالي
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuditLogs;
