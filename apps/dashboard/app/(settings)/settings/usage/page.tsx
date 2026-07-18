/**
 * @brightai/dashboard — /settings/usage
 *
 * USAGE-001 (2026-07-15): AI token usage analytics for billing + cost anomaly alerts.
 *
 * OWNER+ only. يعرض:
 *   - ملخص 30 يوم (total tokens, total cost, requests count).
 *   - Cost anomaly alert (>2x daily average).
 *   - جدول per-provider breakdown (tokens, cost, requests).
 *   - جدول per-model breakdown.
 *
 * الـ data يجي من ai_usage_entries table عبر @brightai/db.
 * Service role لأن OWNER+ يحتاج يشوف usage كل الـ members (ليس نفسه فقط).
 *
 * RLS: حقل organizationId nullable. الـ anon entries (marketing site)
 * موجودة لكن ما تظهر هنا (نفلتر organizationId = ctx.tenant.id).
 */

import { runInTenantContext, requireSessionRoleAtLeast } from '@/lib/session';
import styles from './page.module.css';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────

function startOf30DaysAgo(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────

export default async function UsageSettingsPage() {
  const ctx = await requireSessionRoleAtLeast('OWNER');
  const orgId = ctx.tenant.id;

  const since = startOf30DaysAgo();
  const today = startOfToday();
  const yesterday = startOfYesterday();

  // 1. Last 30 days: aggregate usage.
  //    RLS via runInTenantContext enforces isolation; the where clause
  //    here does NOT include organizationId (RLS adds it implicitly).
  const entries30d = await runInTenantContext(ctx, (tx) =>
    tx.aiUsageEntry.findMany({
      where: { createdAt: { gte: since } },
      select: {
        provider: true,
        model: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        cost: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  );

  // 2. Aggregate by provider.
  const byProvider = new Map<string, { tokens: number; cost: number; requests: number }>();
  for (const e of entries30d) {
    const cur = byProvider.get(e.provider) ?? { tokens: 0, cost: 0, requests: 0 };
    cur.tokens += e.totalTokens;
    cur.cost += Number(e.cost);
    cur.requests += 1;
    byProvider.set(e.provider, cur);
  }

  // 3. Aggregate by model.
  const byModel = new Map<string, { tokens: number; cost: number; requests: number }>();
  for (const e of entries30d) {
    const cur = byModel.get(e.model) ?? { tokens: 0, cost: 0, requests: 0 };
    cur.tokens += e.totalTokens;
    cur.cost += Number(e.cost);
    cur.requests += 1;
    byModel.set(e.model, cur);
  }

  // 4. Totals.
  const totalTokens = entries30d.reduce((s, e) => s + e.totalTokens, 0);
  const totalCost = entries30d.reduce((s, e) => s + Number(e.cost), 0);
  const totalRequests = entries30d.length;

  // 5. Daily average + yesterday usage (anomaly detection).
  //    نحسب daily average عبر الـ 30 يوم، ثم نقارن بـ yesterday.
  const daysSpan = Math.max(1, Math.ceil((Date.now() - since.getTime()) / 86400000));
  const dailyAvgTokens = Math.round(totalTokens / daysSpan);

  const yesterdayEntries = entries30d.filter((e) => e.createdAt >= yesterday && e.createdAt < today);
  const yesterdayTokens = yesterdayEntries.reduce((s, e) => s + e.totalTokens, 0);
  const anomalyRatio = dailyAvgTokens > 0 ? yesterdayTokens / dailyAvgTokens : 0;
  const isAnomaly = anomalyRatio > 2;

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <h1 className={styles.title}>استخدام الذكاء الاصطناعي</h1>
      <p className={styles.lead}>
        تتبع استخدام التوكِنات والتكلفة عبر آخر 30 يوم. البيانات تُسجَّل تلقائياً بعد كل طلب AI.
      </p>

      {isAnomaly && (
        <div className={styles.alert} role="alert">
          <p className={styles.alertTitle}>⚠️ تنبيه تكلفة</p>
          <p className={styles.alertBody}>
            استخدام أمس ({yesterdayTokens.toLocaleString('ar-SA')} توكن) أعلى من{' '}
            {anomalyRatio.toFixed(1)}× المتوسط اليومي ({dailyAvgTokens.toLocaleString('ar-SA')} توكن).
            راجع الطلبات الأخيرة لتحديد السبب.
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <p className={styles.cardLabel}>إجمالي التوكِنات (30 يوم)</p>
          <p className={styles.cardValue}>{totalTokens.toLocaleString('ar-SA')}</p>
          <p className={styles.cardSub}>{totalRequests.toLocaleString('ar-SA')} طلب</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>إجمالي التكلفة (30 يوم)</p>
          <p className={styles.cardValue}>${totalCost.toFixed(4)}</p>
          <p className={styles.cardSub}>USD</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>المتوسط اليومي</p>
          <p className={styles.cardValue}>{dailyAvgTokens.toLocaleString('ar-SA')}</p>
          <p className={styles.cardSub}>توكن / يوم</p>
        </div>
        <div className={styles.card}>
          <p className={styles.cardLabel}>استخدام أمس</p>
          <p className={styles.cardValue}>{yesterdayTokens.toLocaleString('ar-SA')}</p>
          <p className={styles.cardSub}>توكن</p>
        </div>
      </div>

      {/* Per-provider table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>حسب المزوّد (Provider)</h2>
        {byProvider.size === 0 ? (
          <div className={styles.empty}>لا توجد طلبات مسجلة في آخر 30 يوم.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>المزوّد</th>
                <th>عدد الطلبات</th>
                <th>التوكِنات</th>
                <th>التكلفة (USD)</th>
              </tr>
            </thead>
            <tbody>
              {[...byProvider.entries()]
                .sort((a, b) => b[1].tokens - a[1].tokens)
                .map(([provider, stats]) => (
                  <tr key={provider}>
                    <td>{provider}</td>
                    <td>{stats.requests.toLocaleString('ar-SA')}</td>
                    <td>{stats.tokens.toLocaleString('ar-SA')}</td>
                    <td>${stats.cost.toFixed(4)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Per-model table */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>حسب النموذج (Model)</h2>
        {byModel.size === 0 ? (
          <div className={styles.empty}>لا توجد نماذج مستخدمة.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>النموذج</th>
                <th>عدد الطلبات</th>
                <th>التوكِنات</th>
                <th>التكلفة (USD)</th>
              </tr>
            </thead>
            <tbody>
              {[...byModel.entries()]
                .sort((a, b) => b[1].tokens - a[1].tokens)
                .map(([model, stats]) => (
                  <tr key={model}>
                    <td><code>{model}</code></td>
                    <td>{stats.requests.toLocaleString('ar-SA')}</td>
                    <td>{stats.tokens.toLocaleString('ar-SA')}</td>
                    <td>${stats.cost.toFixed(4)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}