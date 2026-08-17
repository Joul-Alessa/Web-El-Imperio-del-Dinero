const router = require('express').Router();
const db = require('../db/knex');

router.get('/', async (req, res) => {
  const query = db('historial').select('*');

  if (req.query.entidad) query.where('entidad', req.query.entidad);
  if (req.query.accion) query.where('accion', req.query.accion);

  query.orderBy('fecha', 'desc').orderBy('id', 'desc');

  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const offset = Number(req.query.offset) || 0;
  query.limit(limit).offset(offset);

  const rows = await query;
  res.json(rows);
});

module.exports = router;
