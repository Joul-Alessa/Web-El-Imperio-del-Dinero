const router = require('express').Router();
const db = require('../db/knex');

router.get('/', async (req, res) => {
  const rows = await db('instrumentos_financieros as i')
    .leftJoin('divisas as d', 'i.divisa_base_id', 'd.id')
    .select(
      'i.*',
      'd.codigo as divisa_codigo',
      'd.nombre as divisa_nombre'
    );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await db('instrumentos_financieros as i')
    .leftJoin('divisas as d', 'i.divisa_base_id', 'd.id')
    .where('i.id', req.params.id)
    .select(
      'i.*',
      'd.codigo as divisa_codigo',
      'd.nombre as divisa_nombre'
    )
    .first();
  if (!row) return res.status(404).json({ error: 'Instrumento no encontrado' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const { nombre, tipo, riesgo, divisa_base_id, institucion_origen, metadata } = req.body;
  const [id] = await db('instrumentos_financieros').insert({
    nombre, tipo, riesgo, divisa_base_id, institucion_origen,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
  res.status(201).json({ id, nombre, tipo, riesgo, divisa_base_id, institucion_origen, metadata });
});

router.put('/:id', async (req, res) => {
  const { nombre, tipo, riesgo, divisa_base_id, institucion_origen, metadata } = req.body;
  const data = { nombre, tipo, riesgo, divisa_base_id, institucion_origen };
  if (metadata !== undefined) data.metadata = JSON.stringify(metadata);
  const count = await db('instrumentos_financieros').where('id', req.params.id).update(data);
  if (!count) return res.status(404).json({ error: 'Instrumento no encontrado' });
  res.json({ id: Number(req.params.id), ...data });
});

router.delete('/:id', async (req, res) => {
  const count = await db('instrumentos_financieros').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Instrumento no encontrado' });
  res.json({ message: 'Eliminado' });
});

module.exports = router;
