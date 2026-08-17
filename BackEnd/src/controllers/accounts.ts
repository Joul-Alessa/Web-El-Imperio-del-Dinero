import { Router } from 'express';
import { accountService } from '../services/accounts.js';

export const accountRouter = Router();

accountRouter.get('/', (req, res) => {
  const { user_id, institution_id, type } = req.query;
  const filters = {
    userId: user_id ? Number(user_id) : undefined,
    institutionId: institution_id ? Number(institution_id) : undefined,
    type: type as string | undefined,
  };
  const accounts = accountService.list(filters);
  res.json(accounts);
});

accountRouter.get('/:id', (req, res) => {
  const account = accountService.getById(Number(req.params.id));
  if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json(account);
});

accountRouter.post('/', (req, res) => {
  const { user_id, institution_id, name, type, currency } = req.body;
  if (!user_id || !institution_id || !name || !type) {
    return res.status(400).json({ error: 'user_id, institution_id, name y type son requeridos' });
  }
  const validTypes = ['DEBIT', 'CREDIT', 'INVESTMENT', 'CASH'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `type debe ser uno de: ${validTypes.join(', ')}` });
  }
  const account = accountService.create({ userId: user_id, institutionId: institution_id, name, type, currency });
  res.status(201).json(account);
});

accountRouter.put('/:id', (req, res) => {
  const { user_id, institution_id, name, type, currency } = req.body;
  const data: any = {};
  if (user_id !== undefined) data.userId = user_id;
  if (institution_id !== undefined) data.institutionId = institution_id;
  if (name !== undefined) data.name = name;
  if (type !== undefined) {
    const validTypes = ['DEBIT', 'CREDIT', 'INVESTMENT', 'CASH'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: `type debe ser uno de: ${validTypes.join(', ')}` });
    }
    data.type = type;
  }
  if (currency !== undefined) data.currency = currency;
  const account = accountService.update(Number(req.params.id), data);
  if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json(account);
});

accountRouter.delete('/:id', (req, res) => {
  const account = accountService.remove(Number(req.params.id));
  if (!account) return res.status(404).json({ error: 'Cuenta no encontrada' });
  res.json({ message: 'Cuenta eliminada' });
});
