import db from '../db/db';

export const settingsService = {
  async get() {
    const settings = await db.settings.toArray();
    return settings[0] || { id: 1, theme: 'light', lastBackupDate: null };
  },
  async update(data) {
    const existing = await db.settings.toArray();
    if (existing.length > 0) {
      await db.settings.update(existing[0].id, data);
    } else {
      await db.settings.add({ id: 1, ...data });
    }
    return this.get();
  },
};
