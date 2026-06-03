import db from '../db/db';

export async function createBackup() {
  const projects = await db.projects.toArray();
  const testCases = await db.testCases.toArray();
  let apiRequests = [];
  try { apiRequests = await db.apiRequests.toArray(); } catch {}

  const backup = {
    version: 2,
    createdAt: new Date().toISOString(),
    data: { projects, testCases, apiRequests },
  };

  const date = new Date().toISOString().split('T')[0];
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qa-backup-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return backup;
}

export async function restoreBackup(file) {
  const text = await file.text();
  const backup = JSON.parse(text);

  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup file');
  }

  const tables = [db.projects, db.testCases];
  const tablesToClear = [db.projects, db.testCases];
  if (backup.data.apiRequests) { tables.push(db.apiRequests); tablesToClear.push(db.apiRequests); }

  await db.transaction('rw', ...tables, async () => {
    for (const t of tablesToClear) await t.clear();

    if (backup.data.projects?.length) await db.projects.bulkAdd(backup.data.projects);
    if (backup.data.testCases?.length) await db.testCases.bulkAdd(backup.data.testCases);
    if (backup.data.apiRequests?.length) await db.apiRequests.bulkAdd(backup.data.apiRequests);
  });

  return backup;
}
