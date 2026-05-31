import db from '../db/db';

export const apiRequestService = {
  async getAll(collection) {
    let query = db.apiRequests.orderBy('createdAt').reverse();
    if (collection) query = db.apiRequests.where('collection').equals(collection);
    return query.toArray();
  },
  async getById(id) {
    return db.apiRequests.get(id);
  },
  async create(req) {
    const now = new Date().toISOString();
    const id = await db.apiRequests.add({ ...req, createdAt: now, updatedAt: now });
    return { ...req, id, createdAt: now, updatedAt: now };
  },
  async update(id, data) {
    const now = new Date().toISOString();
    await db.apiRequests.update(id, { ...data, updatedAt: now });
    return db.apiRequests.get(id);
  },
  async delete(id) {
    await db.apiRequests.delete(id);
  },
  async getCollections() {
    const items = await db.apiRequests.toArray();
    const collections = new Set(items.map(r => r.collection).filter(Boolean));
    return [...collections].sort();
  },
};
