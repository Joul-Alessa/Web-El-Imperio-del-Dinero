import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.enum('type', ['INCOME', 'EXPENSE', 'TRANSFER']).notNullable();
  });

  await knex.schema.createTable('transactions', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.integer('category_id').unsigned().notNullable().references('id').inTable('categories');
    table.decimal('amount', 14, 2).notNullable();
    table.string('date').notNullable();
    table.string('description').nullable();
    table.integer('destination_account_id').unsigned().nullable().references('id').inTable('accounts');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('categories');
}
