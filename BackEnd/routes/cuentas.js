const router = require('express').Router();
const db = require('../db/knex');
const registrarHistorial = require('../db/registrarHistorial');
const { calcularBalance } = require('../lib/balances');

function baseQuery() {
  return db('cuentas_financieras as c')
    .join('personas as p', 'c.persona_id', 'p.id')
    .leftJoin('instituciones as inst', 'c.institucion_id', 'inst.id')
    .join('divisas as d', 'c.divisa_id', 'd.id')
    .leftJoin('instrumentos_financieros as instr', 'c.instrumento_id', 'instr.id')
    .select(
      'c.*',
      'p.nombre as persona_nombre',
      'inst.nombre as institucion_nombre',
      'inst.tipo as institucion_tipo',
      'd.codigo as divisa_codigo',
      'd.nombre as divisa_nombre',
      'd.simbolo as divisa_simbolo',
      'instr.nombre as instrumento_nombre',
      'instr.tipo as instrumento_tipo'
    )
    .orderBy('c.activo', 'desc');
}

router.get('/resumen', async (req, res) => {
  const balances = await db('movimientos')
    .select('cuenta_id')
    .sum({ ingresos: db.raw("CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END") })
    .sum({ gastos: db.raw("CASE WHEN tipo = 'gasto' THEN monto ELSE 0 END") })
    .groupBy('cuenta_id');

  const ultimosInversion = await db('movimientos as m1')
    .whereNotNull('m1.cantidad')
    .whereNotNull('m1.precio_unitario')
    .whereNotExists(
      db('movimientos as m2')
        .whereRaw('m2.cuenta_id = m1.cuenta_id')
        .whereNotNull('m2.cantidad')
        .whereNotNull('m2.precio_unitario')
        .where(function () {
          this.where('m2.fecha', '>', db.raw('m1.fecha'))
            .orWhere(function () {
              this.where('m2.fecha', '=', db.raw('m1.fecha'))
                .andWhere('m2.id', '>', db.raw('m1.id'));
            });
        })
    )
    .select('m1.cuenta_id', 'm1.cantidad', 'm1.precio_unitario');

  const invMap = {};
  for (const r of ultimosInversion) {
    invMap[r.cuenta_id] = { cantidad: r.cantidad, precio_unitario: r.precio_unitario };
  }

  const result = balances.map((r) => ({
    cuenta_id: r.cuenta_id,
    balance: Number(r.ingresos || 0) - Number(r.gastos || 0),
    cantidad: invMap[r.cuenta_id]?.cantidad ?? null,
    precio_unitario: invMap[r.cuenta_id]?.precio_unitario ?? null,
  }));

  res.json(result);
});

router.get('/', async (req, res) => {
  const query = baseQuery();

  if (req.query.persona_id) {
    const ids = [].concat(req.query.persona_id);
    query.whereIn('c.persona_id', ids);
  }
  if (req.query.institucion_id) {
    const ids = [].concat(req.query.institucion_id);
    query.whereIn('c.institucion_id', ids);
  }
  if (req.query.tipo) {
    query.where('c.tipo', req.query.tipo);
  }
  if (req.query.divisa_id) {
    query.where('c.divisa_id', req.query.divisa_id);
  }
  if (req.query.instrumento_id) {
    query.where('c.instrumento_id', req.query.instrumento_id);
  }

  const rows = await query;
  res.json(rows);
});

// Balance of a cuenta up to a given moment: sum of ingresos minus gastos over
// movements at or before `fecha`. When `excludeMovimientoId` is passed (editing),
// only movements with a lower id at the same fecha are included.
router.get('/:id/balance', async (req, res) => {
  const q = db('movimientos').where('cuenta_id', req.params.id);
  if (req.query.excludeMovimientoId) {
    q.where(function () {
      this.where('fecha', '<', req.query.fecha)
        .orWhere(function () {
          this.where('fecha', '=', req.query.fecha).andWhere('id', '<', req.query.excludeMovimientoId);
        });
    });
  } else if (req.query.fecha) {
    q.where('fecha', '<=', req.query.fecha);
  }
  const rows = await q.select('tipo', 'monto');
  res.json({ balance: calcularBalance(rows) });
});

router.get('/:id/ultimo-movimiento-inversion', async (req, res) => {
  const row = await db('movimientos')
    .where('cuenta_id', req.params.id)
    .whereNotNull('cantidad')
    .whereNotNull('precio_unitario')
    .orderBy('fecha', 'desc')
    .orderBy('id', 'desc')
    .select('cantidad', 'precio_unitario')
    .first();
  res.json(row || { cantidad: null, precio_unitario: null });
});

router.get('/:id', async (req, res) => {
  const row = await baseQuery().where('c.id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const {
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, descripcion,
  } = req.body;
  const [id] = await db('cuentas_financieras').insert({
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, descripcion,
  });
  await registrarHistorial('cuentas', id, 'creado', { id, ...req.body });
  res.status(201).json({ id, ...req.body });
});

router.put('/:id', async (req, res) => {
  const {
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, descripcion, activo,
  } = req.body;
  const count = await db('cuentas_financieras').where('id', req.params.id).update({
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, descripcion,
    activo: activo === undefined ? undefined : Number(activo),
  });
  if (!count) return res.status(404).json({ error: 'Cuenta no encontrada' });
  await registrarHistorial('cuentas', Number(req.params.id), 'editado', { id: Number(req.params.id), ...req.body });
  res.json({ id: Number(req.params.id), ...req.body });
});

router.delete('/:id', async (req, res) => {
  const row = await db('cuentas_financieras').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Cuenta no encontrada' });
  await db('cuentas_financieras').where('id', req.params.id).del();
  await registrarHistorial('cuentas', row.id, 'eliminado', row);
  res.json({ message: 'Eliminada' });
});

module.exports = router;
