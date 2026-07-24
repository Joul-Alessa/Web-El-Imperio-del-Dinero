import { db } from '../db/connection.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const categoryRepository = {
  findAll() {
    return db.select().from(categories).orderBy(categories.name).all();
  },

  findById(id: number) {
    return db.select().from(categories).where(eq(categories.id, id)).get();
  },

  create(data: { name: string; type: string }) {
    return db.insert(categories).values(data as any).returning().get();
  },

  update(id: number, data: { name?: string; type?: string }) {
    return db.update(categories).set(data as any).where(eq(categories.id, id)).returning().get();
  },

  remove(id: number) {
    return db.delete(categories).where(eq(categories.id, id)).returning().get();
  },
};
