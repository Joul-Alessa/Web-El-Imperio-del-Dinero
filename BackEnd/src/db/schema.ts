import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const institutions = sqliteTable('institutions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  icon: text('icon'),
});

export const accounts = sqliteTable('accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  institutionId: integer('institution_id').notNull().references(() => institutions.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['DEBIT', 'CREDIT', 'INVESTMENT', 'CASH'] }).notNull(),
  currency: text('currency').notNull().default('MXN'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: ['INCOME', 'EXPENSE', 'TRANSFER'] }).notNull(),
});

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  categoryId: integer('category_id').notNull().references(() => categories.id),
  amount: real('amount').notNull(),
  date: text('date').notNull(),
  description: text('description'),
  destinationAccountId: integer('destination_account_id').references(() => accounts.id),
});

export const assets = sqliteTable('assets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticker: text('ticker').notNull().unique(),
  name: text('name').notNull(),
  assetType: text('asset_type', { enum: ['STOCK', 'ETF', 'BOND', 'CRYPTO'] }).notNull(),
});

export const assetHoldings = sqliteTable('asset_holdings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  quantity: real('quantity').notNull().default(0),
  avgBuyPrice: real('avg_buy_price').notNull().default(0),
});

export const assetTransactions = sqliteTable('asset_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  assetId: integer('asset_id').notNull().references(() => assets.id),
  transactionType: text('transaction_type', { enum: ['BUY', 'SELL'] }).notNull(),
  quantity: real('quantity').notNull(),
  pricePerUnit: real('price_per_unit').notNull(),
  fee: real('fee').notNull().default(0),
  date: text('date').notNull(),
});

export const accountRevaluations = sqliteTable('account_revaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => accounts.id),
  newBalance: real('new_balance').notNull(),
  difference: real('difference').notNull(),
  date: text('date').notNull(),
  notes: text('notes'),
});
