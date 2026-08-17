import { Router } from 'express';
import { transactionRepository } from '../repositories/transactions.js';

export const balanceRouter = Router();

balanceRouter.get('/:id/balance', (req, res) => {
  const accountId = Number(req.params.id);
  const { from, to } = req.query;

  if (from && to) {
    const historical = transactionRepository.getBalanceRange(accountId, '1900-01-01', from as string);
    const periodFlow = transactionRepository.getBalanceRange(accountId, from as string, to as string);
    const ending = transactionRepository.getBalanceRange(accountId, '1900-01-01', to as string);
    res.json({ historical, periodFlow, ending });
  } else {
    const balance = transactionRepository.getBalance(accountId);
    res.json({ balance });
  }
});
