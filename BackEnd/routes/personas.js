const router = require('express').Router();
const db = require('../db/knex');

router.get('/', async (req, res) => {
  const rows = await db('personas').select('*');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await db('personas').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Persona no encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const { nombre } = req.body;
  const [id] = await db('personas').insert({ nombre });
  res.status(201).json({ id, nombre });
});

router.put('/:id', async (req, res) => {
  const { nombre } = req.body;
  const count = await db('personas').where('id', req.params.id).update({ nombre });
  if (!count) return res.status(404).json({ error: 'Persona no encontrada' });
  res.json({ id: Number(req.params.id), nombre });
});

router.delete('/:id', async (req, res) => {
  const count = await db('personas').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Persona no encontrada' });
  res.json({ message: 'Eliminada' });
});

module.exports = router;
