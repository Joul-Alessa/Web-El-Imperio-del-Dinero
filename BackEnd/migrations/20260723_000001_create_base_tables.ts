import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('created_at').notNullable();
  });

  await knex.schema.createTable('institutions', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('icon').nullable();
  });

  await knex.schema.createTable('accounts', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    table.integer('institution_id').unsigned().notNullable().references('id').inTable('institutions');
    table.string('name').notNullable();
    table.enum('type', ['DEBIT', 'CREDIT', 'INVESTMENT', 'CASH']).notNullable();
    table.string('currency').notNullable().defaultTo('MXN');
    table.string('created_at').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('accounts');
  await knex.schema.dropTableIfExists('institutions');
  await knex.schema.dropTableIfExists('users');
}
