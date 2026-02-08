import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "../lib/supabase";

const supabaseClient = supabase as unknown as {
  from: (table: string) => any;
};

type ExecutionRow = {
  id: string;
  status: "ناجح" | "فشل" | "قيد التنفيذ";
  started_at: string | null;
  tokens_used: number | null;
  cost_usd: number | null;
  agent_id: string;
};

const timeRanges = [
  { id: "7", label: "آخر ٧ أيام" },
  { id: "30", label: "آخر ٣٠ يوماً" },
  { id: "90", label: "آخر ٩٠ يوماً" },
  { id: "all", label: "كل الوقت" },
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<ExecutionRow[]>([]);
  const [range, setRange] = useState("7");
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [schedule, setSchedule] = useState("أسبوعي");

  useEffect(() => {
    document.title = "التحليلات | منصة برايت أي آي";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabaseClient
        .from("executions")
        .select("id, status, started_at, tokens_used, cost_usd, agent_id")
        .order("started_at", { ascending: false });
      setExecutions((data || []) as ExecutionRow[]);
      setLoading(false);
    };
    load();
  }, []);

  const filteredExecutions = useMemo(() => {
    if (range === "all") {
      return executions;
    }
    const days = Number(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days + 1);
    return executions.filter((execution) => {
      if (!execution.started_at) {
        return false;
      }
      return new Date(execution.started_at) >= cutoff;
    });
  }, [executions, range]);

  const metrics = useMemo(() => {
    const total = filteredExecutions.length;
    const success = filteredExecutions.filter((item) => item.status === "ناجح").length;
    const tokens = filteredExecutions.reduce((sum, item) => sum + (item.tokens_used || 0), 0);
    const cost = filteredExecutions.reduce((sum, item) => sum + (item.cost_usd || 0), 0);
    return {
      total,
      successRate: total ? Math.round((success / total) * 100) : 0,
      tokens,
      cost: Number(cost.toFixed(2)),
    };
  }, [filteredExecutions]);

  const timeSeries = useMemo(() => {
    const map = new Map<string, { date: string; count: number; success: number; tokens: number }>();
    filteredExecutions.forEach((execution) => {
      if (!execution.started_at) {
        return;
      }
      const key = new Date(execution.started_at).toISOString().slice(0, 10);
      const current = map.get(key) || {
        date: key,
        count: 0,
        success: 0,
        tokens: 0,
      };
      current.count += 1;
      if (execution.status === "ناجح") {
        current.success += 1;
      }
      current.tokens += execution.tokens_used || 0;
      map.set(key, current);
    });
    return Array.from(map.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        label: new Date(item.date).toLocaleDateString("ar-SA", { day: "numeric", month: "short" }),
        date: item.date,
        count: item.count,
        successRate: item.count ? Math.round((item.success / item.count) * 100) : 0,
        tokens: item.tokens,
      }));
  }, [filteredExecutions]);

  const selectedExecutions = useMemo(() => {
    if (!selectedDay) {
      return [];
    }
    return filteredExecutions.filter((execution) => {
      if (!execution.started_at) {
        return false;
      }
      const key = new Date(execution.started_at).toISOString().slice(0, 10);
      return key === selectedDay;
    });
  }, [filteredExecutions, selectedDay]);

  const exportCsv = () => {
    const headers = ["المعرف", "الحالة", "التاريخ", "الرموز", "التكلفة", "المعرف الوكيل"];
    const rows = filteredExecutions.map((execution) => [
      execution.id,
      execution.status,
      execution.started_at || "",
      String(execution.tokens_used || 0),
      String(execution.cost_usd || 0),
      execution.agent_id,
    ]);
    const content = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "تحليلات_برايت_أي_آي.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      return;
    }
    popup.document.write(`
      <html lang="ar" dir="rtl">
      <head><title>تقرير تحليلات برايت أي آي</title></head>
      <body style="font-family: Cairo, sans-serif; padding: 24px;">
        <h1>تقرير التحليلات</h1>
        <p>إجمالي التنفيذات: ${metrics.total}</p>
        <p>نسبة النجاح: ${metrics.successRate}%</p>
        <p>إجمالي الرموز: ${metrics.tokens}</p>
        <p>إجمالي التكلفة: ${metrics.cost}</p>
      </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  useEffect(() => {
    localStorage.setItem("brightai_reports_schedule", schedule);
  }, [schedule]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">التحليلات</h1>
          <p className="mt-1 text-sm text-slate-400">تتبّع الأداء والتكاليف بوضوح.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
          >
            {timeRanges.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            تصدير سي إس في
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200"
          >
            تصدير بي دي إف
          </button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`metric-${index}`} className="h-24 animate-pulse rounded-2xl bg-slate-800" />
            ))
          : [
              { label: "إجمالي التنفيذات", value: metrics.total },
              { label: "نسبة النجاح", value: `${metrics.successRate}%` },
              { label: "إجمالي الرموز", value: metrics.tokens },
              { label: "إجمالي التكلفة", value: `${metrics.cost} ر.س` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-xs text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-emerald-200">{item.value}</p>
              </div>
            ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-200">التنفيذات عبر الزمن</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={timeSeries}
                onClick={(data: any) => {
                  const payload = data?.activePayload?.[0]?.payload as { date?: string };
                  if (payload?.date) {
                    setSelectedDay(payload.date);
                  }
                }}
              >
                <defs>
                  <linearGradient id="execFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    color: "#e2e8f0",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#38bdf8" fill="url(#execFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-200">نسبة النجاح</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #1e293b",
                    color: "#e2e8f0",
                  }}
                />
                <Line type="monotone" dataKey="successRate" stroke="#34d399" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h2 className="text-sm font-semibold text-slate-200">استهلاك الرموز</h2>
        <div className="mt-4 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeSeries}>
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #1e293b",
                  color: "#e2e8f0",
                }}
              />
              <Bar dataKey="tokens" fill="#fbbf24" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">تحليل الإخفاقات</h2>
          <span className="text-xs text-slate-400">{filteredExecutions.filter((item) => item.status === "فشل").length} حالة</span>
        </div>
        <div className="mt-4 grid gap-3">
          {filteredExecutions.filter((item) => item.status === "فشل").slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
              {item.id} · {item.started_at ? new Date(item.started_at).toLocaleString("ar-SA") : "غير محدد"}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
        <h2 className="text-sm font-semibold text-slate-200">التقارير المجدولة</h2>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={schedule}
            onChange={(event) => setSchedule(event.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
          >
            <option>يومي</option>
            <option>أسبوعي</option>
            <option>شهري</option>
          </select>
          <span className="text-xs text-slate-400">سيتم إرسال التقرير عبر البريد الإلكتروني حسب الجدولة.</span>
        </div>
      </section>

      {selectedDay ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">تفاصيل يوم محدد</h2>
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="text-xs text-slate-400"
            >
              إلغاء التحديد
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {selectedExecutions.length === 0 ? (
              <div className="text-sm text-slate-400">لا توجد تنفيذات في هذا اليوم.</div>
            ) : (
              selectedExecutions.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                  {item.id} · {item.status} · {item.tokens_used || 0} رمز
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Analytics;
