import { Router } from 'express';
import { db } from '../db/connection.js';
import { transactions, categories, accounts } from '../db/schema.js';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

export const analyticsRouter = Router();

analyticsRouter.get('/analytics/summary', (req, res) => {
  const { from, to, user_id, account_id, account_type, cumulative } = req.query;
  const isCumulative = cumulative === 'true';

  const filters: any[] = [];
  if (account_id) filters.push(eq(transactions.accountId, Number(account_id)));
  if (from) filters.push(gte(transactions.date, from as string));
  if (to) filters.push(lte(transactions.date, to as string));

  let query = db.select({
    id: transactions.id,
    accountId: transactions.accountId,
    categoryId: transactions.categoryId,
    amount: transactions.amount,
    date: transactions.date,
    description: transactions.description,
  })
    .from(transactions)
    .orderBy(transactions.date);

  if (filters.length > 0) query = query.where(and(...filters)) as any;

  let txList = query.all();

  if (user_id) {
    const userAccounts = db.select().from(accounts).where(eq(accounts.userId, Number(user_id))).all();
    const userAccountIds = new Set(userAccounts.map(a => a.id));
    txList = txList.filter(tx => userAccountIds.has(tx.accountId));
  }

  if (account_type) {
    const typeAccounts = db.select().from(accounts).where(eq(accounts.type, account_type as any)).all();
    const typeAccountIds = new Set(typeAccounts.map(a => a.id));
    txList = txList.filter(tx => typeAccountIds.has(tx.accountId));
  }

  const catMap = new Map(db.select().from(categories).all().map(c => [c.id, c]));

  let totalIncome = 0;
  let totalExpense = 0;
  const catTotals: Record<number, { name: string; type: string; total: number }> = {};
  const monthData: Record<string, { income: number; expense: number }> = {};

  for (const tx of txList) {
    const cat = catMap.get(tx.categoryId);
    const catType = cat?.type ?? 'EXPENSE';
    const amount = Number(tx.amount);

    if (amount > 0) totalIncome += amount;
    else totalExpense += Math.abs(amount);

    if (!catTotals[tx.categoryId]) {
      catTotals[tx.categoryId] = { name: cat?.name ?? 'Unknown', type: catType, total: 0 };
    }
    catTotals[tx.categoryId].total += Math.abs(amount);

    const month = tx.date.slice(0, 7);
    if (!monthData[month]) monthData[month] = { income: 0, expense: 0 };
    if (amount > 0) monthData[month].income += amount;
    else monthData[month].expense += Math.abs(amount);
  }

  const topCategories = Object.entries(catTotals)
    .map(([id, d]) => ({ categoryId: Number(id), categoryName: d.name, type: d.type, total: Math.round(d.total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);

  const monthlyTrend = Object.entries(monthData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, income: Math.round(d.income * 100) / 100, expense: Math.round(d.expense * 100) / 100, net: Math.round((d.income - d.expense) * 100) / 100 }));

  res.json({
    summary: {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      netFlow: Math.round((totalIncome - totalExpense) * 100) / 100,
      transactionCount: txList.length,
    },
    topCategories,
    monthlyTrend,
  });
});
