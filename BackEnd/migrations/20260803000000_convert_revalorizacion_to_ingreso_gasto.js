// Revalorización is no longer its own movement type — it's a UI shortcut that
// computes a delta and stores it as ingreso or gasto. Migrate legacy rows:
// monto >= 0 → ingreso; monto < 0 → gasto with abs(monto).
exports.up = async function (knex) {
  const rows = await knex('movimientos').where('tipo', 'revalorizacion').select('id', 'monto');
  for (const r of rows) {
    const monto = Number(r.monto);
    if (monto >= 0) {
      await knex('movimientos').where('id', r.id).update({ tipo: 'ingreso', monto });
    } else {
      await knex('movimientos').where('id', r.id).update({ tipo: 'gasto', monto: -monto });
    }
  }
};

exports.down = async function () {
  // The original sign was lost when we normalized to positive monto for gasto,
  // so we cannot reliably rebuild the 'revalorizacion' tipo. No-op.
};
