const router = require('express').Router();
const db = require('../db/knex');

router.get('/', async (req, res) => {
  const rows = await db('divisas').select('*');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const row = await db('divisas').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Divisa no encontrada' });
  res.json(row);
});

router.post('/', async (req, res) => {
  const { codigo, nombre, simbolo } = req.body;
  const [id] = await db('divisas').insert({ codigo, nombre, simbolo });
  res.status(201).json({ id, codigo, nombre, simbolo });
});

router.put('/:id', async (req, res) => {
  const { codigo, nombre, simbolo } = req.body;
  const count = await db('divisas').where('id', req.params.id).update({ codigo, nombre, simbolo });
  if (!count) return res.status(404).json({ error: 'Divisa no encontrada' });
  res.json({ id: Number(req.params.id), codigo, nombre, simbolo });
});

router.delete('/:id', async (req, res) => {
  const count = await db('divisas').where('id', req.params.id).del();
  if (!count) return res.status(404).json({ error: 'Divisa no encontrada' });
  res.json({ message: 'Eliminada' });
});

module.exports = router;
