import { Router } from 'express';
import { userService } from '../services/users.js';

export const userRouter = Router();

userRouter.get('/', (_req, res) => {
  const users = userService.list();
  res.json(users);
});

userRouter.get('/:id', (req, res) => {
  const user = userService.getById(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

userRouter.post('/', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const user = userService.create({ name });
  res.status(201).json(user);
});

userRouter.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const user = userService.update(Number(req.params.id), { name });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(user);
});

userRouter.delete('/:id', (req, res) => {
  const user = userService.remove(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado' });
});
