import { Router } from 'express';
import { db } from '../db/connection.js';
import { users, institutions, accounts } from '../db/schema.js';

export const seedRouter = Router();

seedRouter.post('/', (_req, res) => {
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length > 0) {
    return res.status(400).json({ error: 'La base de datos ya tiene datos. Ejecuta DELETE /api/seed primero para reiniciar.' });
  }

  const userData = db.insert(users).values([
    { name: 'Papá' },
    { name: 'Mamá' },
    { name: 'Hermano' },
    { name: 'Yo' },
  ]).returning().all();

  const institutionData = db.insert(institutions).values([
    { name: 'BBVA', icon: 'bbva' },
    { name: 'Openbank', icon: 'openbank' },
    { name: 'Santander', icon: 'santander' },
    { name: 'GBM', icon: 'gbm' },
    { name: 'Cash', icon: 'cash' },
  ]).returning().all();

  res.status(201).json({ users: userData, institutions: institutionData });
});

seedRouter.delete('/', (_req, res) => {
  db.delete(accounts).run();
  db.delete(institutions).run();
  db.delete(users).run();
  res.json({ message: 'Datos eliminados correctamente' });
});
