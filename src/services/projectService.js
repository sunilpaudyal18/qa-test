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
  async create(name, description = '') {
    const existing = await this.getByName(name);
    if (existing) return existing;
    const now = new Date().toISOString();
    const id = await db.projects.add({
      name,
      description,
      archived: false,
      createdAt: now
    });
    return { id, name, description, archived: false, createdAt: now };
  },
  async update(id, data) {
    await db.projects.update(id, data);
    return db.projects.get(id);
  },
  async archive(id, archived = true) {
    await db.projects.update(id, { archived });
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
    return this.create(newName, orig.description || '');
  },
  async getStats(id) {
    const project = await this.getById(id);
    if (!project) {
      return {
        total: 0, pass: 0, fail: 0, blocked: 0, untested: 0,
        passRate: 0, healthScore: 100, warnings: [],
        priorityBreakdown: { Critical: 0, High: 0, Medium: 0, Low: 0 },
        severityBreakdown: { Critical: 0, Major: 0, Minor: 0, Low: 0 },
        modules: [], recentActivity: [],
        reqCount: 0, reqCoveragePct: 0, coverageRisk: 'No Reqs'
      };
    }
    const tcs = await db.testCases.where('projectName').equals(project.name).toArray();

    const total = tcs.length;
    const pass = tcs.filter(t => t.status === 'Pass').length;
    const fail = tcs.filter(t => t.status === 'Fail').length;
    const blocked = tcs.filter(t => t.status === 'Blocked').length;
    const untested = tcs.filter(t => !t.status || t.status === 'Untested').length;

    const priorityBreakdown = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    tcs.forEach(t => {
      if (priorityBreakdown[t.priority] !== undefined) priorityBreakdown[t.priority]++;
    });

    const severityBreakdown = { Critical: 0, Major: 0, Minor: 0, Low: 0 };
    tcs.forEach(t => {
      if (severityBreakdown[t.severity] !== undefined) severityBreakdown[t.severity]++;
    });

    const modules = [...new Set(tcs.map(t => t.module || 'Uncategorized').filter(Boolean))];

    const recentActivity = [...tcs]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);

    let healthScore = 100;
    const warnings = [];
    const passRate = total > 0 ? (pass / total) * 100 : 100;
    const failRate = total > 0 ? (fail / total) * 100 : 0;

    if (total > 0) {
      if (passRate < 80) healthScore -= 20;
      if (passRate < 50) healthScore -= 20;
      const criticalFailures = tcs.filter(t =>
        t.status === 'Fail' && (t.priority === 'Critical' || t.severity === 'Critical')
      ).length;
      if (criticalFailures > 0) {
        healthScore -= Math.min(40, criticalFailures * 15);
        warnings.push(`${criticalFailures} critical failure(s) detected`);
      }
      if (failRate > 20) warnings.push('High failure rate');
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const hasRecentExecutions = tcs.some(t => {
        const date = new Date(t.updatedAt || t.createdAt);
        return date >= sevenDaysAgo && t.status !== 'Untested';
      });
      if (!hasRecentExecutions) {
        healthScore -= 20;
        warnings.push('No recent executions');
      }
    } else {
      warnings.push('No test cases defined');
    }

    // Requirements coverage stats
    let reqCount = 0;
    let reqCoveragePct = 0;
    let coverageRisk = 'No Reqs';
    try {
      const reqs = await db.requirements.where('projectName').equals(project.name).toArray();
      reqCount = reqs.length;
      if (reqCount > 0) {
        const tcIds = new Set(tcs.map(t => t.id));
        const covered = reqs.filter(r => (r.linkedTestCaseIds || []).some(id => tcIds.has(id))).length;
        reqCoveragePct = Math.round((covered / reqCount) * 100);
        if (reqCoveragePct < 50) coverageRisk = 'High';
        else if (reqCoveragePct < 80) coverageRisk = 'Medium';
        else coverageRisk = 'Low';

        if (reqCoveragePct < 50) warnings.push('Low requirements coverage');
      }
    } catch (_) { /* requirements table may not exist yet */ }

    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      total, pass, fail, blocked, untested,
      passRate: Math.round(passRate),
      priorityBreakdown, severityBreakdown,
      modules, recentActivity,
      healthScore, warnings,
      reqCount, reqCoveragePct, coverageRisk
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
