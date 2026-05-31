import db from '../db/db';

export async function createBackup() {
  const projects = await db.projects.toArray();
  const testCases = await db.testCases.toArray();
  const testSuites = await db.testSuites.toArray();
  const settings = await db.settings.toArray();

  const backup = {
    version: 1,
    createdAt: new Date().toISOString(),
    data: { projects, testCases, testSuites, settings },
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

  await db.transaction('rw', db.projects, db.testCases, db.testSuites, db.settings, async () => {
    await db.projects.clear();
    await db.testCases.clear();
    await db.testSuites.clear();
    await db.settings.clear();

    if (backup.data.projects?.length) await db.projects.bulkAdd(backup.data.projects);
    if (backup.data.testCases?.length) await db.testCases.bulkAdd(backup.data.testCases);
    if (backup.data.testSuites?.length) await db.testSuites.bulkAdd(backup.data.testSuites);
    if (backup.data.settings?.length) await db.settings.bulkAdd(backup.data.settings);
  });

  return backup;
}
