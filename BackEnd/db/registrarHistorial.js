const db = require('./knex');

async function registrarHistorial(entidad, entidad_id, accion, detalle) {
  await db('historial').insert({
    fecha: new Date().toISOString(),
    entidad,
    entidad_id,
    accion,
    detalle: JSON.stringify(detalle),
  });
}

module.exports = registrarHistorial;
