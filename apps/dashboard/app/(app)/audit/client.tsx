'use client';

/**
 * @brightai/dashboard — Audit Page Client Component
 *
 * AUDIT-UI-001 (2026-07-15): interactive parts of the audit page.
 *
 * Features:
 *   - Verify Chain button → POST /api/audit/verify → toast with result.
 *   - Date range + action filters → re-fetch /api/audit/list.
 *   - Export CSV button → fetches all matching rows + client-side CSV download.
 */

import { useState, useTransition } from 'react';
import styles from './page.module.css';

// ─────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────

interface AuditEntry {
  id: string;
  actorId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'SUPPORT' | 'API_KEY';
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  metadata: unknown;
  hash: string | null;
  prevHash: string | null;
  createdAt: string;
  hashShort: string;
  prevHashShort: string;
}

interface VerifyResult {
  ok: boolean;
  rowsChecked: number;
  firstFailure?: {
    id: string;
    expectedHash: string;
    actualHash: string;
  };
}

type VerifyStatus = 'idle' | 'loading' | 'ok' | 'fail';

const ACTIONS = [
  { value: '', label: 'الكل' },
  { value: 'REQUEST_CREATED', label: 'طلب جديد' },
  { value: 'REQUEST_APPROVED', label: 'موافقة على طلب' },
  { value: 'REQUEST_REJECTED', label: 'رفض طلب' },
  { value: 'POLICY_APPROVED', label: 'موافقة على سياسة' },
];

// ─────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────

export function AuditClient({
  initialEntries,
  initialTotal,
}: {
  initialEntries: AuditEntry[];
  initialTotal: number;
}) {
  const [entries, setEntries] = useState<AuditEntry[]>(initialEntries);
  const [total, setTotal] = useState<number>(initialTotal);
  const [action, setAction] = useState<string>('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>('idle');
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [pending, startTransition] = useTransition();

  // ── Filter ────────────────────────────────────────────
  async function applyFilter() {
    startTransition(async () => {
      const params = new URLSearchParams();
      if (action) params.set('action', action);
      if (from) params.set('from', new Date(from).toISOString());
      if (to) params.set('to', new Date(to).toISOString());
      const res = await fetch(`/api/audit/list?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setEntries(data.entries);
      setTotal(data.total);
    });
  }

  function resetFilter() {
    setAction('');
    setFrom('');
    setTo('');
    startTransition(async () => {
      setEntries(initialEntries);
      setTotal(initialTotal);
    });
  }

  // ── Verify chain ───────────────────────────────────────
  async function verifyChain() {
    setVerifyStatus('loading');
    setVerifyResult(null);
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      const data: VerifyResult = await res.json();
      setVerifyResult(data);
      setVerifyStatus(data.ok ? 'ok' : 'fail');
    } catch {
      setVerifyStatus('fail');
      setVerifyResult({ ok: false, rowsChecked: 0 });
    }
  }

  // ── Export CSV ─────────────────────────────────────────
  async function exportCsv() {
    const params = new URLSearchParams();
    if (action) params.set('action', action);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to).toISOString());
    params.set('limit', '200');
    const res = await fetch(`/api/audit/list?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    const rows = data.entries as AuditEntry[];
    const header = [
      'id', 'createdAt', 'action', 'actorId', 'actorType',
      'targetType', 'targetId', 'ipAddress', 'hashShort', 'metadata',
    ];
    const csv = [
      header.join(','),
      ...rows.map((r) => header.map((k) => {
        const v = k === 'metadata' ? JSON.stringify(r.metadata) : (r as unknown as Record<string, unknown>)[k];
        const s = v == null ? '' : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(',')),
    ].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Verify + export controls */}
      <div className={styles.actions}>
        <div className={styles.verifyBlock}>
          <button
            className={styles.verifyButton}
            onClick={verifyChain}
            disabled={verifyStatus === 'loading'}
            type="button"
          >
            {verifyStatus === 'loading' ? 'جاري التحقق...' : 'تحقق من سلامة السلسلة'}
          </button>
          {verifyStatus === 'ok' && verifyResult && (
            <div className={`${styles.verifyResult} ${styles.verifyResultOk}`} role="status">
              ✓ السلسلة سليمة ({verifyResult.rowsChecked.toLocaleString('ar-SA')} صف)
            </div>
          )}
          {verifyStatus === 'fail' && verifyResult && (
            <div className={`${styles.verifyResult} ${styles.verifyResultFail}`} role="alert">
              ✗ فشل التحقق —{' '}
              {verifyResult.firstFailure
                ? `الصف ${verifyResult.firstFailure.id.slice(0, 8)}... تالف`
                : `${verifyResult.rowsChecked.toLocaleString('ar-SA')} صف تم فحصها`}
            </div>
          )}
        </div>
        <button className={styles.exportButton} onClick={exportCsv} type="button">
          تصدير CSV
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-action">الإجراء:</label>
          <select
            id="filter-action"
            className={styles.filterSelect}
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-from">من:</label>
          <input
            id="filter-from"
            type="date"
            className={styles.filterInput}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="filter-to">إلى:</label>
          <input
            id="filter-to"
            type="date"
            className={styles.filterInput}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <button
          className={styles.exportButton}
          onClick={applyFilter}
          disabled={pending}
          type="button"
        >
          تطبيق
        </button>
        <button
          className={styles.exportButton}
          onClick={resetFilter}
          disabled={pending}
          type="button"
        >
          إعادة تعيين
        </button>
        <span style={{ marginInlineStart: 'auto', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
          {total.toLocaleString('ar-SA')} صف إجمالي
        </span>
      </div>

      {/* Table */}
      {entries.length === 0 ? (
        <div className={styles.empty}>لا توجد سجلات تطابق الفلاتر.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الإجراء</th>
                <th>المنفّذ</th>
                <th>الهدف</th>
                <th>عنوان IP</th>
                <th>الهاش</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className={styles.mono}>{new Date(e.createdAt).toLocaleString('ar-SA')}</td>
                  <td>{e.action}</td>
                  <td className={styles.mono}>
                    {e.actorType === 'SYSTEM' ? 'نظام' : (e.actorId ?? '—')}
                  </td>
                  <td className={styles.mono}>
                    {e.targetType ? `${e.targetType}:${(e.targetId ?? '').slice(0, 12)}` : '—'}
                  </td>
                  <td className={styles.mono}>{e.ipAddress ?? '—'}</td>
                  <td className={styles.hashCell}>{e.hashShort}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}