import { db } from '../db/connection.js';
import { transactions, accounts } from '../db/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

interface TransactionFilters {
  userId?: number;
  accountId?: number;
  categoryId?: number;
  type?: string;
  from?: string;
  to?: string;
}

export const transactionRepository = {
  findAll(filters?: TransactionFilters) {
    let query = db.select().from(transactions);

    const conditions: any[] = [];
    if (filters?.accountId) conditions.push(eq(transactions.accountId, filters.accountId));
    if (filters?.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId));
    if (filters?.from) conditions.push(gte(transactions.date, filters.from));
    if (filters?.to) conditions.push(lte(transactions.date, filters.to));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(sql`${transactions.date} DESC`).all();
  },

  findById(id: number) {
    return db.select().from(transactions).where(eq(transactions.id, id)).get();
  },

  create(data: {
    accountId: number;
    categoryId: number;
    amount: number;
    date: string;
    description?: string;
    destinationAccountId?: number;
  }) {
    return db.insert(transactions).values(data as any).returning().get();
  },

  remove(id: number) {
    return db.delete(transactions).where(eq(transactions.id, id)).returning().get();
  },

  getBalance(accountId: number): number {
    const result = db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`,
    }).from(transactions).where(eq(transactions.accountId, accountId)).get();
    return result?.total ?? 0;
  },

  getBalanceRange(accountId: number, from: string, to: string): number {
    const result = db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`,
    }).from(transactions)
      .where(and(
        eq(transactions.accountId, accountId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      )).get();
    return result?.total ?? 0;
  },
};
