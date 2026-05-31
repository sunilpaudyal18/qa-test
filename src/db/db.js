import Dexie from 'dexie';

const db = new Dexie('qa_test_case_studio');

db.version(1).stores({
  projects: '++id, name, createdAt',
  testCases: '++id, projectId, suiteId, tcId, title, module, priority, severity, status, tags, createdAt',
  testSuites: '++id, projectId, name, createdAt',
  settings: '++id, theme, lastBackupDate',
});

export default db;
