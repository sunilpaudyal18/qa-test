import db from '../db/db';

export const projectService = {
  async getAll() {
    return db.projects.orderBy('name').toArray();
  },
  async getById(id) {
    return db.projects.get(id);
  },
  async getByName(name) {
    return db.projects.where('name').equals(name).first();
  },
  async create(name) {
    const existing = await this.getByName(name);
    if (existing) return existing;
    const id = await db.projects.add({ name, createdAt: new Date().toISOString() });
    return { id, name, createdAt: new Date().toISOString() };
  },
  async update(id, data) {
    await db.projects.update(id, data);
    return db.projects.get(id);
  },
  async duplicate(id) {
    const orig = await this.getById(id);
    if (!orig) return null;
    let newName = orig.name + ' (Copy)';
    let counter = 1;
    while (await this.getByName(newName)) {
      counter++;
      newName = `${orig.name} (Copy ${counter})`;
    }
    return this.create(newName);
  },
  async getStats(id) {
    const project = await this.getById(id);
    if (!project) return { total: 0, pass: 0, fail: 0, blocked: 0, untested: 0 };
    const tcs = await db.testCases.where('projectName').equals(project.name).toArray();
    return {
      total: tcs.length,
      pass: tcs.filter(t => t.status === 'Pass').length,
      fail: tcs.filter(t => t.status === 'Fail').length,
      blocked: tcs.filter(t => t.status === 'Blocked').length,
      untested: tcs.filter(t => !t.status || t.status === 'Untested').length,
    };
  },
  async delete(name) {
    const project = await this.getByName(name);
    if (project) {
      await db.transaction('rw', db.projects, db.testCases, async () => {
        await db.testCases.where('projectName').equals(name).delete();
        await db.projects.delete(project.id);
      });
    }
  },
};
