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

db.version(3).stores({
  testCases: '++id, projectName, testId, module, status, priority, *tags',
  projects: '++id, &name, archived',
  apiRequests: '++id, name, method, collection, createdAt',
  requirements: '++id, reqId, title, projectId',
  testRuns: '++id, name, projectId, status, createdAt',
  testRunResults: '++id, runId, testCaseId, status, executedAt',
});

db.version(4).stores({
  testCases: '++id, projectName, testId, module, status, priority, *tags',
  projects: '++id, &name, archived',
  apiRequests: '++id, name, method, collection, createdAt',
  requirements: '++id, reqId, title, projectId, projectName',
  testRuns: '++id, name, projectId, projectName, status, createdAt',
  testRunResults: '++id, runId, testCaseId, status, executedAt',
});

export default db;

