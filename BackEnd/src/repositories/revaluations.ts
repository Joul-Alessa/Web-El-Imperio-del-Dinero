import { db } from '../db/connection.js';
import { accountRevaluations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { transactionRepository } from './transactions.js';
import { categoryRepository } from './categories.js';

export const revaluationRepository = {
  findByAccount(accountId: number) {
    return db.select()
      .from(accountRevaluations)
      .where(eq(accountRevaluations.accountId, accountId))
      .orderBy(accountRevaluations.date)
      .all();
  },

  create(data: { accountId: number; newBalance: number; difference: number; date: string; notes?: string }) {
    const result = db.insert(accountRevaluations).values(data as any).returning().get();

    const yieldCat = categoryRepository.findByName('Rendimiento');
    if (yieldCat && data.difference !== 0) {
      transactionRepository.create({
        accountId: data.accountId,
        categoryId: yieldCat.id,
        amount: data.difference,
        date: data.date,
        description: data.notes || `Revaluación: ${data.difference >= 0 ? '+' : ''}${data.difference}`,
      });
    }

    return result;
  },
};
