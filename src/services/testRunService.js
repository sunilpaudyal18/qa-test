import db from '../db/db';

export const testRunService = {
  async getAll(projectName) {
    if (projectName) {
      return db.testRuns.where('projectName').equals(projectName).toArray();
    }
    return db.testRuns.toArray();
  },
  async getById(id) {
    return db.testRuns.get(id);
  },
  async create(run) {
    const now = new Date().toISOString();
    const payload = {
      name: run.name || `Run - ${new Date().toLocaleDateString()}`,
      description: run.description || '',
      projectName: run.projectName,
      testCaseIds: run.testCaseIds || [],
      status: 'Active',
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    const id = await db.testRuns.add(payload);

    // Pre-populate untested results
    const results = (run.testCaseIds || []).map(tcId => ({
      runId: id,
      testCaseId: tcId,
      status: 'Untested',
      notes: '',
      executedBy: '',
      executedAt: null,
      evidence: null,
      bugLink: ''
    }));
    if (results.length > 0) {
      await db.testRunResults.bulkAdd(results);
    }

    return { ...payload, id };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    await db.testRuns.update(id, { ...data, updatedAt: now });
    return db.testRuns.get(id);
  },
  async delete(id) {
    await db.transaction('rw', db.testRuns, db.testRunResults, async () => {
      await db.testRunResults.where('runId').equals(id).delete();
      await db.testRuns.delete(id);
    });
  },
  async duplicate(id) {
    const original = await this.getById(id);
    if (!original) return null;
    const now = new Date().toISOString();
    const newPayload = {
      name: `${original.name} (Copy)`,
      description: original.description || '',
      projectName: original.projectName,
      testCaseIds: [...(original.testCaseIds || [])],
      status: 'Active',
      createdAt: now,
      updatedAt: now,
      completedAt: null
    };
    const newId = await db.testRuns.add(newPayload);
    const results = (original.testCaseIds || []).map(tcId => ({
      runId: newId,
      testCaseId: tcId,
      status: 'Untested',
      notes: '',
      executedBy: '',
      executedAt: null,
      evidence: null,
      bugLink: ''
    }));
    if (results.length > 0) {
      await db.testRunResults.bulkAdd(results);
    }
    return { ...newPayload, id: newId };
  },
  async getResults(runId) {
    return db.testRunResults.where('runId').equals(runId).toArray();
  },
  async updateResult(runId, testCaseId, status, details = {}) {
    const existingList = await db.testRunResults.where('runId').equals(runId).toArray();
    const existing = existingList.find(r => r.testCaseId === testCaseId);

    const now = new Date().toISOString();
    const payload = {
      runId,
      testCaseId,
      status,
      notes: details.notes || '',
      executedBy: details.executedBy || 'QA Engineer',
      executedAt: status === 'Untested' ? null : now,
      evidence: details.evidence || null,
      bugLink: details.bugLink || ''
    };

    if (existing) {
      await db.testRunResults.update(existing.id, payload);
    } else {
      await db.testRunResults.add(payload);
    }

    // Update run's updatedAt timestamp
    await db.testRuns.update(runId, { updatedAt: now });

    // Also update the master test case status (only for non-Untested resets)
    if (status !== 'Untested') {
      const tc = await db.testCases.get(testCaseId);
      if (tc) {
        await db.testCases.update(testCaseId, {
          status,
          actualResult: details.notes || tc.actualResult || '',
          updatedAt: now
        });
      }
    }
  },
  async getStats(runId, testCaseIds) {
    const results = await db.testRunResults.where('runId').equals(runId).toArray();

    const stats = {
      pass: 0,
      fail: 0,
      blocked: 0,
      untested: 0,
      total: testCaseIds.length
    };

    const resultMap = {};
    results.forEach(r => {
      resultMap[r.testCaseId] = r.status;
    });

    testCaseIds.forEach(id => {
      const status = resultMap[id] || 'Untested';
      if (status === 'Pass') stats.pass++;
      else if (status === 'Fail') stats.fail++;
      else if (status === 'Blocked') stats.blocked++;
      else stats.untested++;
    });

    const executed = stats.pass + stats.fail + stats.blocked;
    stats.passRate = executed > 0 ? Math.round((stats.pass / executed) * 100) : 0;
    stats.completionPct = stats.total > 0 ? Math.round(((stats.pass + stats.fail + stats.blocked) / stats.total) * 100) : 0;

    return stats;
  }
};

export default testRunService;
