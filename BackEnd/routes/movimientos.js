const router = require('express').Router();
const db = require('../db/knex');

function baseQuery() {
  return db('movimientos as m')
    .join('personas as p', 'm.persona_id', 'p.id')
    .join('cuentas_financieras as c', 'm.cuenta_id', 'c.id')
    .join('divisas as d', 'm.divisa_id', 'd.id')
    .leftJoin('instituciones as inst', 'c.institucion_id', 'inst.id')
    .leftJoin('instrumentos_financieros as instr', 'm.instrumento_id', 'instr.id')
    .select(
      'm.*',
      'p.nombre as persona_nombre',
      'c.nombre as cuenta_nombre',
      'c.tipo as cuenta_tipo',
      'inst.nombre as institucion_nombre',
      'd.codigo as divisa_codigo',
      'd.simbolo as divisa_simbolo',
      'instr.nombre as instrumento_nombre'
    );
}

router.get('/', async (req, res) => {
  const query = baseQuery();

  if (req.query.persona_id) {
    const ids = [].concat(req.query.persona_id);
    query.whereIn('m.persona_id', ids);
  }
  if (req.query.cuenta_id) {
    const ids = [].concat(req.query.cuenta_id);
    query.whereIn('m.cuenta_id', ids);
  }
  if (req.query.tipo) {
    query.where('m.tipo', req.query.tipo);
  }
  if (req.query.fecha_desde) {
    query.where('m.fecha', '>=', req.query.fecha_desde);
  }
  if (req.query.fecha_hasta) {
    query.where('m.fecha', '<=', req.query.fecha_hasta);
  }
  if (req.query.institucion_id) {
    const ids = [].concat(req.query.institucion_id);
    query.whereIn('c.institucion_id', ids);
  }
  if (req.query.instrumento_id) {
    query.where('m.instrumento_id', req.query.instrumento_id);
  }
  if (req.query.divisa_id) {
    query.where('m.divisa_id', req.query.divisa_id);
  }

  query.orderBy('m.fecha', 'desc').orderBy('m.id', 'desc');

  const rows = await query;
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await baseQuery().where('m.id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Movimiento no encontrado' });
  res.json(row);
});

// Compute the balance of a cuenta strictly before a given moment, optionally
// excluding a movement (used when editing a movement — it must not count
// against its own recomputation).
async function computeBalance(cuentaId, fecha, excludeMovimientoId = null) {
  const q = db('movimientos').where('cuenta_id', cuentaId).where('fecha', '<', fecha);
  if (excludeMovimientoId != null) q.andWhere('id', '!=', excludeMovimientoId);
  const rows = await q.select('tipo', 'monto');
  return rows.reduce(
    (a, m) => (m.tipo === 'gasto' ? a - Number(m.monto) : a + Number(m.monto)),
    0,
  );
}

// Translate a revalorización payload into a concrete {tipo, monto, ...} row.
// Returns null when the delta is zero (no adjustment to record).
async function resolveRevalorizacion(body, excludeMovimientoId = null) {
  const { cuenta_id, valor_actual_nuevo, fecha, persona_id, divisa_id, descripcion } = body;
  const cuenta = await db('cuentas_financieras').where('id', cuenta_id).first();
  if (!cuenta) return { error: { status: 404, message: 'Cuenta no encontrada' } };

  const valorAnterior = await computeBalance(cuenta_id, fecha, excludeMovimientoId);
  const delta = Number(valor_actual_nuevo) - valorAnterior;

  if (delta === 0) {
    return {
      error: {
        status: 400,
        message: `El nuevo valor actual (${valor_actual_nuevo}) iguala al balance calculado (${valorAnterior}); no hay ajuste que registrar.`,
      },
    };
  }

  return {
    row: {
      fecha,
      persona_id,
      cuenta_id,
      tipo: delta > 0 ? 'ingreso' : 'gasto',
      monto: Math.abs(delta),
      divisa_id: divisa_id || cuenta.divisa_id,
      instrumento_id: null,
      cantidad: null,
      precio_unitario: null,
      descripcion: descripcion || `Revalorización: ${valorAnterior} → ${valor_actual_nuevo}`,
    },
    valorAnterior,
  };
}

router.post('/', async (req, res) => {
  const { tipo } = req.body;

  if (tipo === 'revalorizacion') {
    const result = await resolveRevalorizacion(req.body);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    const [id] = await db('movimientos').insert(result.row);
    return res.status(201).json({
      id, tipo: result.row.tipo, monto: result.row.monto,
      valor_anterior: result.valorAnterior, valor_actual_nuevo: req.body.valor_actual_nuevo,
    });
  }

  const {
    fecha, persona_id, cuenta_id, monto, divisa_id,
    instrumento_id, cantidad, precio_unitario, descripcion,
  } = req.body;

  const [id] = await db('movimientos').insert({
    fecha, persona_id, cuenta_id, tipo, monto, divisa_id,
    instrumento_id, cantidad, precio_unitario, descripcion,
  });

  res.status(201).json({ id, ...req.body });
});

router.put('/:id', async (req, res) => {
  const { tipo } = req.body;

  if (tipo === 'revalorizacion') {
    const result = await resolveRevalorizacion(req.body, req.params.id);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    const count = await db('movimientos').where('id', req.params.id).update(result.row);
    if (!count) return res.status(404).json({ error: 'Movimiento no encontrado' });
    return res.json({
      id: Number(req.params.id), tipo: result.row.tipo, monto: result.row.monto,
      valor_anterior: result.valorAnterior, valor_actual_nuevo: req.body.valor_actual_nuevo,
    });
  }

  const {
    fecha, persona_id, cuenta_id, monto, divisa_id,
    instrumento_id, cantidad, precio_unitario, descripcion,
  } = req.body;
  const count = await db('movimientos').where('id', req.params.id).update({
    fecha, persona_id, cuenta_id, tipo, monto, divisa_id,
    instrumento_id, cantidad, precio_unitario, descripcion,
  });
  if (!count) return res.status(404).json({ error: 'Movimiento no encontrado' });
  res.json({ id: Number(req.params.id), ...req.body });
});

router.delete('/:id', async (req, res) => {
  const count = await db('movimientos').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Movimiento no encontrado' });
  res.json({ message: 'Eliminado' });
});

module.exports = router;
