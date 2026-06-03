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
      tags: tc.tags || [],
      version: '1.0',
      versionHistory: [],
      createdAt: now,
      updatedAt: now,
    });
    return { ...tc, id, version: '1.0', versionHistory: [], createdAt: now, updatedAt: now };
  },
  async update(id, data) {
    const orig = await db.testCases.get(id);
    if (!orig) return null;

    const now = new Date().toISOString();
    const currentVersion = parseFloat(orig.version || '1.0');
    const nextVersion = (currentVersion + 0.1).toFixed(1);

    const historyEntry = {
      version: orig.version || '1.0',
      title: orig.title,
      steps: orig.steps,
      testData: orig.testData,
      expectedResult: orig.expectedResult,
      actualResult: orig.actualResult,
      status: orig.status,
      priority: orig.priority,
      severity: orig.severity,
      updatedAt: orig.updatedAt || orig.createdAt || now,
      changeNotes: data.changeNotes || 'Direct modifications'
    };

    const versionHistory = orig.versionHistory ? [...orig.versionHistory, historyEntry] : [historyEntry];
    const { changeNotes, ...updateData } = data;

    await db.testCases.update(id, { 
      ...updateData, 
      version: nextVersion, 
      versionHistory, 
      updatedAt: now 
    });
    return db.testCases.get(id);
  },
  async duplicate(id) {
    const orig = await db.testCases.get(id);
    if (!orig) return null;

    const now = new Date().toISOString();
    let newTestId = orig.testId;
    if (newTestId) {
      const match = newTestId.match(/(.*?)(_copy(\d+))?$/);
      if (match) {
        const base = match[1];
        const count = match[3] ? parseInt(match[3]) + 1 : 1;
        newTestId = `${base}_copy${count}`;
      } else {
        newTestId = `${newTestId}_copy`;
      }
    }

    const { id: _, testId: __, versionHistory: ___, ...rest } = orig;
    const newId = await db.testCases.add({
      ...rest,
      testId: newTestId,
      version: '1.0',
      versionHistory: [],
      createdAt: now,
      updatedAt: now
    });
    return db.testCases.get(newId);
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
