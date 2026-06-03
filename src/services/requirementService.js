import db from '../db/db';

export const requirementService = {
  async getAll(projectName) {
    if (projectName) {
      return db.requirements.where('projectName').equals(projectName).toArray();
    }
    return db.requirements.toArray();
  },
  async getById(id) {
    return db.requirements.get(id);
  },
  async create(req) {
    const now = new Date().toISOString();
    const payload = {
      reqId: req.reqId || `REQ-${Date.now().toString().slice(-4)}`,
      title: req.title || 'Untitled Requirement',
      description: req.description || '',
      priority: req.priority || 'Medium',
      status: req.status || 'Draft',
      projectName: req.projectName,
      linkedTestCaseIds: req.linkedTestCaseIds || [],
      createdAt: now,
      updatedAt: now
    };
    const id = await db.requirements.add(payload);
    return { ...payload, id };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    await db.requirements.update(id, { ...data, updatedAt: now });
    return db.requirements.get(id);
  },
  async delete(id) {
    await db.requirements.delete(id);
  },
  getCoverageStatus(req, testCases = []) {
    const linkedIds = req.linkedTestCaseIds || [];
    if (linkedIds.length === 0) return 'Not Covered';
    const linkedCases = testCases.filter(tc => linkedIds.includes(tc.id));
    if (linkedCases.length === 0) return 'Not Covered';
    const passedCount = linkedCases.filter(c => c.status === 'Pass').length;
    if (passedCount === linkedCases.length) return 'Covered';
    if (passedCount > 0) return 'Partially Covered';
    return 'Not Covered';
  },
  // Coverage stats for a list of requirements
  getCoverageStats(requirements, testCases = []) {
    const stats = { covered: 0, partial: 0, notCovered: 0, total: requirements.length };
    requirements.forEach(r => {
      const s = this.getCoverageStatus(r, testCases);
      if (s === 'Covered') stats.covered++;
      else if (s === 'Partially Covered') stats.partial++;
      else stats.notCovered++;
    });
    stats.coveragePct = stats.total > 0
      ? Math.round(((stats.covered + stats.partial * 0.5) / stats.total) * 100)
      : 0;
    return stats;
  }
};

export default requirementService;
