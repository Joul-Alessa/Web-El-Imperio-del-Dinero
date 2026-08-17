exports.up = function (knex) {
  return knex.schema.createTable('historial', (t) => {
    t.increments('id');
    t.datetime('fecha').notNullable();
    t.string('entidad').notNullable();
    t.integer('entidad_id').notNullable();
    t.string('accion').notNullable();
    t.json('detalle');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('historial');
};
