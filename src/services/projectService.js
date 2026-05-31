import db from '../db/db';

export const projectService = {
  async getAll() {
    return db.projects.orderBy('createdAt').reverse().toArray();
  },
  async getById(id) {
    return db.projects.get(id);
  },
  async create(project) {
    const now = new Date().toISOString();
    const id = await db.projects.add({
      ...project,
      createdAt: now,
      updatedAt: now,
    });
    return { ...project, id, createdAt: now, updatedAt: now };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    await db.projects.update(id, { ...data, updatedAt: now });
    return db.projects.get(id);
  },
  async delete(id) {
    await db.transaction('rw', db.projects, db.testCases, db.testSuites, async () => {
      await db.testCases.where('projectId').equals(id).delete();
      await db.testSuites.where('projectId').equals(id).delete();
      await db.projects.delete(id);
    });
  },
  async duplicate(id) {
    const original = await db.projects.get(id);
    if (!original) return null;
    const { id: _, createdAt, updatedAt, ...rest } = original;
    return this.create({ ...rest, name: `${rest.name} (Copy)` });
  },
  async getStats(id) {
    const total = await db.testCases.where('projectId').equals(id).count();
    const pass = await db.testCases.where({ projectId: id, status: 'Pass' }).count();
    const fail = await db.testCases.where({ projectId: id, status: 'Fail' }).count();
    const blocked = await db.testCases.where({ projectId: id, status: 'Blocked' }).count();
    const notExecuted = await db.testCases.where({ projectId: id, status: 'Not Executed' }).count();
    return { total, pass, fail, blocked, notExecuted };
  },
};
