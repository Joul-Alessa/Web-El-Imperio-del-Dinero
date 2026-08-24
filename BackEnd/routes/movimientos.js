const router = require('express').Router();
const db = require('../db/knex');
const registrarHistorial = require('../db/registrarHistorial');
const { calcularBalance, calcularDeltaRevalorizacion } = require('../lib/balances');

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

// Aplica los filtros de búsqueda comunes sobre una consulta de movimientos.
// La consulta debe tener el alias `m` (movimientos) y, para el filtro de
// institución, el join a `cuentas_financieras as c`.
function applyMovimientoFilters(query, q) {
  if (q.persona_id) {
    query.whereIn('m.persona_id', [].concat(q.persona_id));
  }
  if (q.cuenta_id) {
    query.whereIn('m.cuenta_id', [].concat(q.cuenta_id));
  }
  if (q.tipo) {
    query.where('m.tipo', q.tipo);
  }
  if (q.fecha_desde) {
    query.where('m.fecha', '>=', q.fecha_desde);
  }
  if (q.fecha_hasta) {
    query.where('m.fecha', '<=', q.fecha_hasta);
  }
  if (q.institucion_id) {
    query.whereIn('c.institucion_id', [].concat(q.institucion_id));
  }
  if (q.instrumento_id) {
    query.where('m.instrumento_id', q.instrumento_id);
  }
  if (q.divisa_id) {
    query.where('m.divisa_id', q.divisa_id);
  }
  // Búsqueda de coincidencias por descripción. Vacío = no filtra.
  const busqueda = (q.busqueda || '').trim();
  if (busqueda) {
    query.where('m.descripcion', 'like', `%${busqueda}%`);
  }
  return query;
}

// Consulta base solo con el join necesario para contar/agregar aplicando los
// mismos filtros (sin los select ni joins de detalle que no hacen falta).
function movimientosFilterQuery() {
  return db('movimientos as m')
    .join('cuentas_financieras as c', 'm.cuenta_id', 'c.id');
}

router.get('/', async (req, res) => {
  const query = applyMovimientoFilters(baseQuery(), req.query);
  query.orderBy('m.fecha', 'desc').orderBy('m.id', 'desc');

  const rows = await query;
  res.json(rows);
});

// Endpoint paginado: devuelve una página de resultados junto con el total de
// registros que coinciden con los filtros y los totales de ingresos/gastos
// sobre TODO el conjunto filtrado (no solo la página actual).
router.get('/paginado', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(500, Math.max(1, parseInt(req.query.pageSize, 10) || 50));
  const offset = (page - 1) * pageSize;

  const dataQuery = applyMovimientoFilters(baseQuery(), req.query)
    .orderBy('m.fecha', 'desc')
    .orderBy('m.id', 'desc')
    .limit(pageSize)
    .offset(offset);

  const totalQuery = applyMovimientoFilters(movimientosFilterQuery(), req.query)
    .count({ count: 'm.id' })
    .first();

  const totalsQuery = applyMovimientoFilters(movimientosFilterQuery(), req.query)
    .select('m.tipo')
    .sum({ total: 'm.monto' })
    .groupBy('m.tipo');

  const [data, totalRow, totalsRows] = await Promise.all([dataQuery, totalQuery, totalsQuery]);

  const total = Number(totalRow?.count ?? 0);
  let totalIngresos = 0;
  let totalGastos = 0;
  for (const r of totalsRows) {
    if (r.tipo === 'ingreso') totalIngresos = Number(r.total) || 0;
    else if (r.tipo === 'gasto') totalGastos = Number(r.total) || 0;
  }

  res.json({ data, total, page, pageSize, totalIngresos, totalGastos });
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
  return calcularBalance(rows);
}

// Translate a revalorización payload into a concrete {tipo, monto, ...} row.
// Returns null when the delta is zero (no adjustment to record).
async function resolveRevalorizacion(body, excludeMovimientoId = null) {
  const { cuenta_id, valor_actual_nuevo, fecha, persona_id, divisa_id, descripcion,
    cantidad, precio_unitario } = body;
  const cuenta = await db('cuentas_financieras').where('id', cuenta_id).first();
  if (!cuenta) return { error: { status: 404, message: 'Cuenta no encontrada' } };

  const valorAnterior = await computeBalance(cuenta_id, fecha, excludeMovimientoId);
  const resultado = calcularDeltaRevalorizacion(valorAnterior, valor_actual_nuevo);

  if (!resultado) {
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
      tipo: resultado.tipo,
      monto: resultado.monto,
      divisa_id: divisa_id || cuenta.divisa_id,
      instrumento_id: null,
      cantidad: cantidad ?? null,
      precio_unitario: precio_unitario ?? null,
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
    await registrarHistorial('movimientos', id, 'creado', { id, ...result.row });
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
  await registrarHistorial('movimientos', id, 'creado', { id, ...req.body });

  res.status(201).json({ id, ...req.body });
});

router.put('/:id', async (req, res) => {
  const { tipo } = req.body;

  if (tipo === 'revalorizacion') {
    const result = await resolveRevalorizacion(req.body, req.params.id);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    const count = await db('movimientos').where('id', req.params.id).update(result.row);
    if (!count) return res.status(404).json({ error: 'Movimiento no encontrado' });
    await registrarHistorial('movimientos', Number(req.params.id), 'editado', { id: Number(req.params.id), ...result.row });
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
  await registrarHistorial('movimientos', Number(req.params.id), 'editado', { id: Number(req.params.id), ...req.body });
  res.json({ id: Number(req.params.id), ...req.body });
});

router.delete('/:id', async (req, res) => {
  const row = await db('movimientos').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Movimiento no encontrado' });
  await db('movimientos').where('id', req.params.id).del();
  await registrarHistorial('movimientos', row.id, 'eliminado', row);
  res.json({ message: 'Eliminado' });
});

module.exports = router;
