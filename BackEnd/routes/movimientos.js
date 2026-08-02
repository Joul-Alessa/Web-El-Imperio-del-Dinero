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

router.post('/', async (req, res) => {
  const { tipo } = req.body;

  if (tipo === 'revalorizacion') {
    const { cuenta_id, valor_actual_nuevo, fecha, persona_id, divisa_id, descripcion } = req.body;

    const cuenta = await db('cuentas_financieras').where('id', cuenta_id).first();
    if (!cuenta) return res.status(404).json({ error: 'Cuenta no encontrada' });

    const valorAnterior = cuenta.valor_actual || 0;
    const monto = valor_actual_nuevo - valorAnterior;

    const [id] = await db('movimientos').insert({
      fecha,
      persona_id,
      cuenta_id,
      tipo: 'revalorizacion',
      monto,
      divisa_id: divisa_id || cuenta.divisa_id,
      descripcion: descripcion || `Revalorización: ${valorAnterior} → ${valor_actual_nuevo}`,
    });

    await db('cuentas_financieras').where('id', cuenta_id).update({
      valor_actual: valor_actual_nuevo,
    });

    res.status(201).json({ id, monto, valor_anterior: valorAnterior, valor_actual_nuevo });
  } else {
    const {
      fecha, persona_id, cuenta_id, monto, divisa_id,
      instrumento_id, cantidad, precio_unitario, descripcion,
    } = req.body;

    const [id] = await db('movimientos').insert({
      fecha, persona_id, cuenta_id, tipo, monto, divisa_id,
      instrumento_id, cantidad, precio_unitario, descripcion,
    });

    res.status(201).json({ id, ...req.body });
  }
});

router.put('/:id', async (req, res) => {
  const {
    fecha, persona_id, cuenta_id, tipo, monto, divisa_id,
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
