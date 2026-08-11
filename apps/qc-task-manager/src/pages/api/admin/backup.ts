// POST /api/admin/backup — create an on-demand database backup.
// Backup files never leave the server; this endpoint returns metadata only.

import type { APIRoute } from 'astro';
import { apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { BACKUP_DIR, DB_PATH } from '../../../lib/db';
import { backupDirectoryForDatabase, createBackup, getBackupStatus, listBackups } from '../../../lib/backup';
import { PERMISSIONS } from '../../../lib/permissions';
import { setFlash } from '../../../lib/flash';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const actor = requireApiUser(context);
  if (isResponse(actor)) return actor;
  if (!PERMISSIONS.canManageUsers(actor.role)) return apiJsonError('Forbidden.', 403);

  const backupDir = BACKUP_DIR || backupDirectoryForDatabase(DB_PATH);
  try {
    const result = await createBackup({ dbPath: DB_PATH, backupDir, trigger: 'manual' });
    if (context.request.headers.get('accept')?.includes('text/html')) {
      setFlash(context, 'success', `Backup created: ${result.name}.`);
      return context.redirect('/admin/settings');
    }
    return new Response(
      JSON.stringify({ ok: true, backup: { name: result.name, size: result.size, pruned: result.pruned, metadata: result.metadata, verification: result.verification }, status: getBackupStatus(backupDir), count: listBackups(backupDir).length }),
      { status: 200, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } },
    );
  } catch {
    if (context.request.headers.get('accept')?.includes('text/html')) {
      setFlash(context, 'error', 'Backup failed. Check the server logs or admin settings.');
      return context.redirect('/admin/settings');
    }
    return apiJsonError('Backup failed. Check the server logs or admin settings.', 500);
  }
};
