import db from '../db/db';

export const testCaseService = {
  async getAll(projectName) {
    if (projectName) {
      return db.testCases.where('projectName').equals(projectName).toArray();
    }
    return db.testCases.orderBy('testId').toArray();
  },
  async getById(id) {
    return db.testCases.get(id);
  },
  async create(tc) {
    const now = new Date().toISOString();
    const id = await db.testCases.add({
      ...tc,
      steps: tc.steps || [''],
      testData: tc.testData || [''],
      createdAt: now,
      updatedAt: now,
    });
    return { ...tc, id, createdAt: now, updatedAt: now };
  },
  async update(id, data) {
    const now = new Date().toISOString();
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
};
