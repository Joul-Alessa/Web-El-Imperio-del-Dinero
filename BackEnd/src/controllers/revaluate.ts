import { Router } from 'express';
import { transactionRepository } from '../repositories/transactions.js';
import { revaluationRepository } from '../repositories/revaluations.js';

export const revaluateRouter = Router();

revaluateRouter.post('/:id/revaluate', (req, res) => {
  const accountId = Number(req.params.id);
  const { new_balance, notes } = req.body;

  if (new_balance === undefined) {
    return res.status(400).json({ error: 'new_balance es requerido' });
  }

  const currentBalance = transactionRepository.getBalance(accountId);
  const difference = Number(new_balance) - currentBalance;

  const rev = revaluationRepository.create({
    accountId,
    newBalance: Number(new_balance),
    difference,
    date: new Date().toISOString().slice(0, 10),
    notes: notes || undefined,
  });

  res.status(201).json(rev);
});

revaluateRouter.get('/:id/revaluations', (req, res) => {
  const revs = revaluationRepository.findByAccount(Number(req.params.id));
  res.json(revs);
});
