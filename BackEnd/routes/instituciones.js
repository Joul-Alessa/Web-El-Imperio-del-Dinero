const router = require('express').Router();
const db = require('../db/knex');
const registrarHistorial = require('../db/registrarHistorial');

router.get('/', async (req, res) => {
  const rows = await db('instituciones').select('*');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await db('instituciones').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const { nombre, tipo } = req.body;
  const [id] = await db('instituciones').insert({ nombre, tipo });
  await registrarHistorial('instituciones', id, 'creado', { id, nombre, tipo });
  res.status(201).json({ id, nombre, tipo });
});

router.put('/:id', async (req, res) => {
  const { nombre, tipo } = req.body;
  const count = await db('instituciones').where('id', req.params.id).update({ nombre, tipo });
  if (!count) return res.status(404).json({ error: 'Institución no encontrada' });
  await registrarHistorial('instituciones', Number(req.params.id), 'editado', { id: Number(req.params.id), nombre, tipo });
  res.json({ id: Number(req.params.id), nombre, tipo });
});

router.delete('/:id', async (req, res) => {
  const row = await db('instituciones').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Institución no encontrada' });
  await db('instituciones').where('id', req.params.id).del();
  await registrarHistorial('instituciones', row.id, 'eliminado', row);
  res.json({ message: 'Eliminada' });
});

module.exports = router;
