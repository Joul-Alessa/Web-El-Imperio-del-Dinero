exports.up = async function (knex) {
  await knex.schema.alterTable('cuentas_financieras', (table) => {
    table.integer('activo').notNullable().defaultTo(1);
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('cuentas_financieras', (table) => {
    table.dropColumn('activo');
  });
};
