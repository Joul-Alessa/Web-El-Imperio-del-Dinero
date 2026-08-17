const router = require('express').Router();
const db = require('../db/knex');
const registrarHistorial = require('../db/registrarHistorial');

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
  await registrarHistorial('divisas', id, 'creado', { id, codigo, nombre, simbolo });
  res.status(201).json({ id, codigo, nombre, simbolo });
});

router.put('/:id', async (req, res) => {
  const { codigo, nombre, simbolo } = req.body;
  const count = await db('divisas').where('id', req.params.id).update({ codigo, nombre, simbolo });
  if (!count) return res.status(404).json({ error: 'Divisa no encontrada' });
  await registrarHistorial('divisas', Number(req.params.id), 'editado', { id: Number(req.params.id), codigo, nombre, simbolo });
  res.json({ id: Number(req.params.id), codigo, nombre, simbolo });
});

router.delete('/:id', async (req, res) => {
  const row = await db('divisas').where('id', req.params.id).first();
  if (!row) return res.status(404).json({ error: 'Divisa no encontrada' });
  await db('divisas').where('id', req.params.id).del();
  await registrarHistorial('divisas', row.id, 'eliminado', row);
  res.json({ message: 'Eliminada' });
});

module.exports = router;
