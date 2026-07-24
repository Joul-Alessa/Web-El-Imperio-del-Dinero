import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const userRepository = {
  findAll() {
    return db.select().from(users).orderBy(users.name).all();
  },

  findById(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  },

  create(data: { name: string }) {
    return db.insert(users).values(data).returning().get();
  },

  update(id: number, data: { name: string }) {
    return db.update(users).set(data).where(eq(users.id, id)).returning().get();
  },

  remove(id: number) {
    return db.delete(users).where(eq(users.id, id)).returning().get();
  },
};
