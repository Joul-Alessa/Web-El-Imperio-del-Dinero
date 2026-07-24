import { Router } from 'express';
import { institutionService } from '../services/institutions.js';

export const institutionRouter = Router();

institutionRouter.get('/', (_req, res) => {
  const institutions = institutionService.list();
  res.json(institutions);
});

institutionRouter.get('/:id', (req, res) => {
  const institution = institutionService.getById(Number(req.params.id));
  if (!institution) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json(institution);
});

institutionRouter.post('/', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'El nombre es requerido' });
  const institution = institutionService.create({ name, icon });
  res.status(201).json(institution);
});

institutionRouter.put('/:id', (req, res) => {
  const { name, icon } = req.body;
  const institution = institutionService.update(Number(req.params.id), { name, icon });
  if (!institution) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json(institution);
});

institutionRouter.delete('/:id', (req, res) => {
  const institution = institutionService.remove(Number(req.params.id));
  if (!institution) return res.status(404).json({ error: 'Institución no encontrada' });
  res.json({ message: 'Institución eliminada' });
});
