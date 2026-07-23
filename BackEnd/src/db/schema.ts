import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
