// Change movimientos.fecha from date to datetime so we can store the time.
// SQLite lacks ALTER COLUMN, so we recreate the table and backfill existing
// date-only values with a T00:00:00 suffix.
exports.up = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.createTable('movimientos_new', (table) => {
    table.increments('id').primary();
    table.datetime('fecha').notNullable();
    table.integer('persona_id').unsigned().notNullable().references('id').inTable('personas');
    table.integer('cuenta_id').unsigned().notNullable().references('id').inTable('cuentas_financieras');
    table.string('tipo').notNullable();
    table.decimal('monto', 18, 4).notNullable();
    table.integer('divisa_id').unsigned().notNullable().references('id').inTable('divisas');
    table.integer('instrumento_id').unsigned().references('id').inTable('instrumentos_financieros');
    table.decimal('cantidad', 18, 8);
    table.decimal('precio_unitario', 18, 4);
    table.string('descripcion');
  });
  await knex.raw(`
    INSERT INTO movimientos_new (id, fecha, persona_id, cuenta_id, tipo, monto, divisa_id, instrumento_id, cantidad, precio_unitario, descripcion)
    SELECT id,
           CASE WHEN instr(fecha, 'T') > 0 THEN fecha ELSE fecha || 'T00:00:00' END,
           persona_id, cuenta_id, tipo, monto, divisa_id, instrumento_id, cantidad, precio_unitario, descripcion
    FROM movimientos
  `);
  await knex.schema.dropTable('movimientos');
  await knex.schema.renameTable('movimientos_new', 'movimientos');
  await knex.raw('PRAGMA foreign_keys = ON');
};

exports.down = async function (knex) {
  await knex.raw('PRAGMA foreign_keys = OFF');
  await knex.schema.createTable('movimientos_new', (table) => {
    table.increments('id').primary();
    table.date('fecha').notNullable();
    table.integer('persona_id').unsigned().notNullable().references('id').inTable('personas');
    table.integer('cuenta_id').unsigned().notNullable().references('id').inTable('cuentas_financieras');
    table.string('tipo').notNullable();
    table.decimal('monto', 18, 4).notNullable();
    table.integer('divisa_id').unsigned().notNullable().references('id').inTable('divisas');
    table.integer('instrumento_id').unsigned().references('id').inTable('instrumentos_financieros');
    table.decimal('cantidad', 18, 8);
    table.decimal('precio_unitario', 18, 4);
    table.string('descripcion');
  });
  await knex.raw(`
    INSERT INTO movimientos_new (id, fecha, persona_id, cuenta_id, tipo, monto, divisa_id, instrumento_id, cantidad, precio_unitario, descripcion)
    SELECT id, substr(fecha, 1, 10), persona_id, cuenta_id, tipo, monto, divisa_id, instrumento_id, cantidad, precio_unitario, descripcion
    FROM movimientos
  `);
  await knex.schema.dropTable('movimientos');
  await knex.schema.renameTable('movimientos_new', 'movimientos');
  await knex.raw('PRAGMA foreign_keys = ON');
};
