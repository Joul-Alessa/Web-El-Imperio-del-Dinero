exports.up = function (knex) {
  return knex.schema
    .createTable('personas', (table) => {
      table.increments('id').primary();
      table.string('nombre').notNullable();
    })
    .createTable('instituciones', (table) => {
      table.increments('id').primary();
      table.string('nombre').notNullable();
      table.string('tipo').notNullable();
    })
    .createTable('divisas', (table) => {
      table.increments('id').primary();
      table.string('codigo').notNullable().unique();
      table.string('nombre').notNullable();
      table.string('simbolo').notNullable();
    })
    .createTable('instrumentos_financieros', (table) => {
      table.increments('id').primary();
      table.string('nombre').notNullable();
      table.string('tipo').notNullable();
      table.string('riesgo');
      table.integer('divisa_base_id').unsigned().references('id').inTable('divisas');
      table.string('institucion_origen');
      table.json('metadata');
    })
    .createTable('cuentas_financieras', (table) => {
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
    })
    .createTable('movimientos', (table) => {
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
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('movimientos')
    .dropTableIfExists('cuentas_financieras')
    .dropTableIfExists('instrumentos_financieros')
    .dropTableIfExists('divisas')
    .dropTableIfExists('instituciones')
    .dropTableIfExists('personas');
};
