import { Router } from 'express';
import { db } from '../db/connection.js';
import { users, institutions, accounts, categories, transactions } from '../db/schema.js';

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

  const categoryData = db.insert(categories).values([
    { name: 'Nómina', type: 'INCOME' },
    { name: 'Ingreso extra', type: 'INCOME' },
    { name: 'Alimentación', type: 'EXPENSE' },
    { name: 'Transporte', type: 'EXPENSE' },
    { name: 'Servicios', type: 'EXPENSE' },
    { name: 'Entretenimiento', type: 'EXPENSE' },
    { name: 'Salud', type: 'EXPENSE' },
    { name: 'Renta', type: 'EXPENSE' },
    { name: 'Transferencia', type: 'TRANSFER' },
  ]).returning().all();

  res.status(201).json({ users: userData, institutions: institutionData, categories: categoryData });
});

seedRouter.delete('/', (_req, res) => {
  db.delete(transactions).run();
  db.delete(accounts).run();
  db.delete(categories).run();
  db.delete(institutions).run();
  db.delete(users).run();
  res.json({ message: 'Datos eliminados correctamente' });
});
