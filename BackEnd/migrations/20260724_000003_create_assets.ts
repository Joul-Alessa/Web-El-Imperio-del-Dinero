import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('assets', (table) => {
    table.increments('id').primary();
    table.string('ticker').notNullable().unique();
    table.string('name').notNullable();
    table.enum('asset_type', ['STOCK', 'ETF', 'BOND', 'CRYPTO']).notNullable();
  });

  await knex.schema.createTable('asset_holdings', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.integer('asset_id').unsigned().notNullable().references('id').inTable('assets');
    table.decimal('quantity', 14, 4).notNullable().defaultTo(0);
    table.decimal('avg_buy_price', 14, 4).notNullable().defaultTo(0);
    table.unique(['account_id', 'asset_id']);
  });

  await knex.schema.createTable('asset_transactions', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.integer('asset_id').unsigned().notNullable().references('id').inTable('assets');
    table.enum('transaction_type', ['BUY', 'SELL']).notNullable();
    table.decimal('quantity', 14, 4).notNullable();
    table.decimal('price_per_unit', 14, 4).notNullable();
    table.decimal('fee', 14, 2).notNullable().defaultTo(0);
    table.string('date').notNullable();
  });

  await knex.schema.createTable('account_revaluations', (table) => {
    table.increments('id').primary();
    table.integer('account_id').unsigned().notNullable().references('id').inTable('accounts');
    table.decimal('new_balance', 14, 2).notNullable();
    table.decimal('difference', 14, 2).notNullable();
    table.string('date').notNullable();
    table.string('notes').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_revaluations');
  await knex.schema.dropTableIfExists('asset_transactions');
  await knex.schema.dropTableIfExists('asset_holdings');
  await knex.schema.dropTableIfExists('assets');
}
