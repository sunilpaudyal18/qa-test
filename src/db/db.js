import Dexie from 'dexie';

export const db = new Dexie('QAToolDB');

db.version(1).stores({
  testCases: '++id, projectName, testId, module, status, priority',
  projects: '++id, &name',
});

db.version(2).stores({
  testCases: '++id, projectName, testId, module, status, priority',
  projects: '++id, &name',
  apiRequests: '++id, name, method, collection, createdAt',
});

export default db;
