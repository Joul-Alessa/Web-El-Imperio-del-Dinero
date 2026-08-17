// SQLite lacks ALTER COLUMN, so we recreate cuentas_financieras with
// institucion_id nullable (cash accounts have no institution).
exports.up = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.createTable('cuentas_financieras_new', (table) => {
    table.increments('id').primary();
    table.integer('persona_id').unsigned().notNullable().references('id').inTable('personas');
    table.integer('institucion_id').unsigned().references('id').inTable('instituciones');
    table.string('tipo').notNullable();
    table.integer('instrumento_id').unsigned().references('id').inTable('instrumentos_financieros');
    table.integer('divisa_id').unsigned().notNullable().references('id').inTable('divisas');
    table.string('nombre').notNullable();
    table.string('plazo');
    table.decimal('cantidad', 18, 8);
    table.decimal('valor_compra', 18, 4);
    table.decimal('valor_actual', 18, 4);
    table.string('descripcion');
  });
  await knex.raw('INSERT INTO cuentas_financieras_new SELECT * FROM cuentas_financieras');
  await knex.schema.dropTable('cuentas_financieras');
  await knex.schema.renameTable('cuentas_financieras_new', 'cuentas_financieras');
  await knex.raw('PRAGMA foreign_keys = ON');
};

exports.down = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.createTable('cuentas_financieras_new', (table) => {
    table.increments('id').primary();
    table.integer('persona_id').unsigned().notNullable().references('id').inTable('personas');
    table.integer('institucion_id').unsigned().notNullable().references('id').inTable('instituciones');
    table.string('tipo').notNullable();
    table.integer('instrumento_id').unsigned().references('id').inTable('instrumentos_financieros');
    table.integer('divisa_id').unsigned().notNullable().references('id').inTable('divisas');
    table.string('nombre').notNullable();
    table.string('plazo');
    table.decimal('cantidad', 18, 8);
    table.decimal('valor_compra', 18, 4);
    table.decimal('valor_actual', 18, 4);
    table.string('descripcion');
  });
  await knex.raw('INSERT INTO cuentas_financieras_new SELECT * FROM cuentas_financieras WHERE institucion_id IS NOT NULL');
  await knex.schema.dropTable('cuentas_financieras');
  await knex.schema.renameTable('cuentas_financieras_new', 'cuentas_financieras');
  await knex.raw('PRAGMA foreign_keys = ON');
};
