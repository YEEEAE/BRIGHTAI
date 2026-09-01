// POST /api/admin/backup — create an on-demand database backup.
// Backup files never leave the server; this endpoint returns metadata only.

import type { APIRoute } from 'astro';
import { apiJson, apiJsonError, isResponse, requireApiUser, requireCsrf } from '../../../lib/api-security';
import { BACKUP_DIR, DB_PATH } from '../../../lib/db';
import { createBackup, getBackupStatus, listBackups } from '../../../lib/backup';
import { PERMISSIONS } from '../../../lib/permissions';
import { setFlash } from '../../../lib/flash';

export const POST: APIRoute = async (context) => {
  const csrf = requireCsrf(context);
  if (csrf) return csrf;

  const actor = requireApiUser(context);
  if (isResponse(actor)) return actor;
  if (!PERMISSIONS.canManageUsers(actor.role)) return apiJsonError('Forbidden.', 403);

  // BACKUP_DIR is always resolved in lib/db.ts (QC_BACKUP_DIR or the DB
  // sibling default), so the manual trigger writes to the same directory as
  // the scheduler — otherwise status.json would report two disjoint histories.
  const backupDir = BACKUP_DIR;
  try {
    const result = await createBackup({ dbPath: DB_PATH, backupDir, trigger: 'manual' });
    if (context.request.headers.get('accept')?.includes('text/html')) {
      setFlash(context, 'success', `Backup created: ${result.name}.`);
      return context.redirect('/admin/settings');
    }
    return apiJson({
      backup: { name: result.name, size: result.size, pruned: result.pruned, metadata: result.metadata, verification: result.verification },
      status: getBackupStatus(backupDir),
      count: listBackups(backupDir).length,
    });
  } catch {
    if (context.request.headers.get('accept')?.includes('text/html')) {
      setFlash(context, 'error', 'Backup failed. Check the server logs or admin settings.');
      return context.redirect('/admin/settings');
    }
    return apiJsonError('Backup failed. Check the server logs or admin settings.', 500);
  }
};
