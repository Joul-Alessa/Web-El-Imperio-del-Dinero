import { db } from '../db/connection.js';
import { accounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

interface AccountFilters {
  userId?: number;
  institutionId?: number;
  type?: string;
}

export const accountRepository = {
  findAll(filters?: AccountFilters) {
    const conditions: any[] = [];
    if (filters?.userId) conditions.push(eq(accounts.userId, filters.userId));
    if (filters?.institutionId) conditions.push(eq(accounts.institutionId, filters.institutionId));
    if (filters?.type) conditions.push(eq(accounts.type, filters.type as any));

    const query = db.select().from(accounts);
    if (conditions.length > 0) {
      query.where(and(...conditions));
    }
    return query.orderBy(accounts.name).all();
  },

  findById(id: number) {
    return db.select().from(accounts).where(eq(accounts.id, id)).get();
  },

  create(data: { userId: number; institutionId: number; name: string; type: string; currency?: string }) {
    return db.insert(accounts).values(data as any).returning().get();
  },

  update(id: number, data: { userId?: number; institutionId?: number; name?: string; type?: string; currency?: string }) {
    return db.update(accounts).set(data as any).where(eq(accounts.id, id)).returning().get();
  },

  remove(id: number) {
    return db.delete(accounts).where(eq(accounts.id, id)).returning().get();
  },
};
