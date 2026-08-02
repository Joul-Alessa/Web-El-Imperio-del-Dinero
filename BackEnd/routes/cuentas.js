const router = require('express').Router();
const db = require('../db/knex');

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
    );
}

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

router.get('/:id', async (req, res) => {
  const row = await baseQuery().where('c.id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const {
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, cantidad, valor_compra, valor_actual, descripcion,
  } = req.body;
  const [id] = await db('cuentas_financieras').insert({
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, cantidad, valor_compra, valor_actual, descripcion,
  });
  res.status(201).json({ id, ...req.body });
});

router.put('/:id', async (req, res) => {
  const {
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, cantidad, valor_compra, valor_actual, descripcion,
  } = req.body;
  const count = await db('cuentas_financieras').where('id', req.params.id).update({
    persona_id, institucion_id, tipo, instrumento_id, divisa_id,
    nombre, plazo, cantidad, valor_compra, valor_actual, descripcion,
  });
  if (!count) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json({ id: Number(req.params.id), ...req.body });
});

router.delete('/:id', async (req, res) => {
  const count = await db('cuentas_financieras').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json({ message: 'Eliminada' });
});

module.exports = router;
