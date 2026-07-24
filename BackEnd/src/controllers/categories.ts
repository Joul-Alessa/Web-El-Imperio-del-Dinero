import { Router } from 'express';
import { categoryService } from '../services/categories.js';

export const categoryRouter = Router();

categoryRouter.get('/', (_req, res) => {
  res.json(categoryService.list());
});

categoryRouter.get('/:id', (req, res) => {
  const cat = categoryService.getById(Number(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(cat);
});

categoryRouter.post('/', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'name y type son requeridos' });
  if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
    return res.status(400).json({ error: 'type debe ser INCOME, EXPENSE o TRANSFER' });
  }
  res.status(201).json(categoryService.create({ name, type }));
});

categoryRouter.put('/:id', (req, res) => {
  const { name, type } = req.body;
  if (type && !['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
    return res.status(400).json({ error: 'type debe ser INCOME, EXPENSE o TRANSFER' });
  }
  const cat = categoryService.update(Number(req.params.id), { name, type });
  if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(cat);
});

categoryRouter.delete('/:id', (req, res) => {
  const cat = categoryService.remove(Number(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json({ message: 'Categoría eliminada' });
});
