import db from '../db/db';

export const testCaseService = {
  async getAll(filters = {}) {
    let collection = db.testCases.orderBy('createdAt').reverse();
    let results = await collection.toArray();
    if (filters.projectId) results = results.filter(tc => tc.projectId === filters.projectId);
    if (filters.suiteId) results = results.filter(tc => tc.suiteId === filters.suiteId);
    if (filters.module) results = results.filter(tc => tc.module === filters.module);
    if (filters.priority) results = results.filter(tc => tc.priority === filters.priority);
    if (filters.severity) results = results.filter(tc => tc.severity === filters.severity);
    if (filters.status) results = results.filter(tc => tc.status === filters.status);
    if (filters.tag) results = results.filter(tc => tc.tags?.includes(filters.tag));
    if (filters.search) {
      const q = filters.search.toLowerCase();
      results = results.filter(tc =>
        tc.tcId?.toLowerCase().includes(q) ||
        tc.title?.toLowerCase().includes(q) ||
        tc.module?.toLowerCase().includes(q) ||
        tc.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return results;
  },
  async getById(id) {
    return db.testCases.get(id);
  },
  async create(tc) {
    const now = new Date().toISOString();
    const id = await db.testCases.add({
      ...tc,
      tags: tc.tags || [],
      steps: tc.steps || [],
      createdAt: now,
      updatedAt: now,
    });
    return { ...tc, id, createdAt: now, updatedAt: now };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    if (data.tags) data.tags = data.tags;
    if (data.steps) data.steps = data.steps;
    await db.testCases.update(id, { ...data, updatedAt: now });
    return db.testCases.get(id);
  },
  async delete(id) {
    await db.testCases.delete(id);
  },
  async bulkDelete(ids) {
    await db.testCases.bulkDelete(ids);
  },
  async bulkUpdateStatus(ids, status) {
    const now = new Date().toISOString();
    await db.transaction('rw', db.testCases, async () => {
      for (const id of ids) {
        await db.testCases.update(id, { status, updatedAt: now });
      }
    });
  },
  async getByProject(projectId) {
    return db.testCases.where('projectId').equals(projectId).toArray();
  },
  async getBySuite(suiteId) {
    return db.testCases.where('suiteId').equals(suiteId).toArray();
  },
  async getNextTcId() {
    const count = await db.testCases.count();
    return `TC-${String(count + 1).padStart(4, '0')}`;
  },
};
