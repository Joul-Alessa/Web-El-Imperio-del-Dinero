const router = require('express').Router();
const db = require('../db/knex');

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
  res.status(201).json({ id, nombre, tipo });
});

router.put('/:id', async (req, res) => {
  const { nombre, tipo } = req.body;
  const count = await db('instituciones').where('id', req.params.id).update({ nombre, tipo });
  if (!count) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json({ id: Number(req.params.id), nombre, tipo });
});

router.delete('/:id', async (req, res) => {
  const count = await db('instituciones').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json({ message: 'Eliminada' });
});

module.exports = router;
