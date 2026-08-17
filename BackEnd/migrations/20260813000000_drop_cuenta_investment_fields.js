exports.up = function (knex) {
  return knex.schema.alterTable('cuentas_financieras', (table) => {
    table.dropColumn('cantidad');
    table.dropColumn('valor_compra');
    table.dropColumn('valor_actual');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('cuentas_financieras', (table) => {
    table.decimal('cantidad', 18, 8);
    table.decimal('valor_compra', 18, 4);
    table.decimal('valor_actual', 18, 4);
  });
};
