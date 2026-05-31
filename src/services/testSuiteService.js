import db from '../db/db';

export const testSuiteService = {
  async getAll() {
    return db.testSuites.orderBy('createdAt').reverse().toArray();
  },
  async getById(id) {
    return db.testSuites.get(id);
  },
  async create(suite) {
    const now = new Date().toISOString();
    const id = await db.testSuites.add({ ...suite, createdAt: now });
    return { ...suite, id, createdAt: now };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    await db.testSuites.update(id, { ...data, updatedAt: now });
    return db.testSuites.get(id);
  },
  async delete(id) {
    await db.transaction('rw', db.testSuites, db.testCases, async () => {
      await db.testCases.where('suiteId').equals(id).modify({ suiteId: null });
      await db.testSuites.delete(id);
    });
  },
  async getByProject(projectId) {
    return db.testSuites.where('projectId').equals(projectId).toArray();
  },
  async getCaseCount(id) {
    return db.testCases.where('suiteId').equals(id).count();
  },
};
