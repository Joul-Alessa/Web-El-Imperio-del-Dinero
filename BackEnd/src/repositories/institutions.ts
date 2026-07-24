import { db } from '../db/connection.js';
import { institutions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const institutionRepository = {
  findAll() {
    return db.select().from(institutions).orderBy(institutions.name).all();
  },

  findById(id: number) {
    return db.select().from(institutions).where(eq(institutions.id, id)).get();
  },

  create(data: { name: string; icon?: string }) {
    return db.insert(institutions).values(data).returning().get();
  },

  update(id: number, data: { name?: string; icon?: string }) {
    return db.update(institutions).set(data).where(eq(institutions.id, id)).returning().get();
  },

  remove(id: number) {
    return db.delete(institutions).where(eq(institutions.id, id)).returning().get();
  },
};
