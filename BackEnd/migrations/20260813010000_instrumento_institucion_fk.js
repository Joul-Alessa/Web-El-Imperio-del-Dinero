exports.up = function (knex) {
  return knex.schema.alterTable('instrumentos_financieros', (table) => {
    table.dropColumn('institucion_origen');
    table.integer('institucion_id').unsigned().references('id').inTable('instituciones');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('instrumentos_financieros', (table) => {
    table.dropColumn('institucion_id');
    table.string('institucion_origen');
  });
};
