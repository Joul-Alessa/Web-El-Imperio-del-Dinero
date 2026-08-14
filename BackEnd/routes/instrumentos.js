const router = require('express').Router();
const db = require('../db/knex');
const registrarHistorial = require('../db/registrarHistorial');

function baseQuery() {
  return db('instrumentos_financieros as i')
    .leftJoin('divisas as d', 'i.divisa_base_id', 'd.id')
    .leftJoin('instituciones as inst', 'i.institucion_id', 'inst.id')
    .select(
      'i.*',
      'd.codigo as divisa_codigo',
      'd.nombre as divisa_nombre',
      'inst.nombre as institucion_nombre'
    );
}

router.get('/', async (req, res) => {
  const rows = await baseQuery();
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await baseQuery().where('i.id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Instrumento no encontrado' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const { nombre, tipo, riesgo, divisa_base_id, institucion_id, metadata } = req.body;
  const [id] = await db('instrumentos_financieros').insert({
    nombre, tipo, riesgo, divisa_base_id, institucion_id,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
  await registrarHistorial('instrumentos', id, 'creado', { id, nombre, tipo, riesgo, divisa_base_id, institucion_id, metadata });
  res.status(201).json({ id, nombre, tipo, riesgo, divisa_base_id, institucion_id, metadata });
});

router.put('/:id', async (req, res) => {
  const { nombre, tipo, riesgo, divisa_base_id, institucion_id, metadata } = req.body;
  const data = { nombre, tipo, riesgo, divisa_base_id, institucion_id };
  if (metadata !== undefined) data.metadata = JSON.stringify(metadata);
  const count = await db('instrumentos_financieros').where('id', req.params.id).update(data);
  if (!count) return res.status(404).json({ error: 'Instrumento no encontrado' });
  await registrarHistorial('instrumentos', Number(req.params.id), 'editado', { id: Number(req.params.id), ...data });
  res.json({ id: Number(req.params.id), ...data });
});

router.delete('/:id', async (req, res) => {
  const row = await db('instrumentos_financieros').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Instrumento no encontrado' });
  await db('instrumentos_financieros').where('id', req.params.id).del();
  await registrarHistorial('instrumentos', row.id, 'eliminado', row);
  res.json({ message: 'Eliminado' });
});

module.exports = router;
