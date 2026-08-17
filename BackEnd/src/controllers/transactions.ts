import { Router } from 'express';
import { transactionService } from '../services/transactions.js';

export const transactionRouter = Router();

transactionRouter.get('/', (req, res) => {
  const filters = {
    accountId: req.query.account_id ? Number(req.query.account_id) : undefined,
    categoryId: req.query.category_id ? Number(req.query.category_id) : undefined,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
  };
  res.json(transactionService.list(filters));
});

transactionRouter.get('/:id', (req, res) => {
  const tx = transactionService.getById(Number(req.params.id));
  if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });
  res.json(tx);
});

transactionRouter.post('/', (req, res) => {
  const { account_id, category_id, amount, date, description, destination_account_id } = req.body;

  if (!account_id || !category_id || amount === undefined || !date) {
    return res.status(400).json({ error: 'account_id, category_id, amount y date son requeridos' });
  }

  const tx = transactionService.create({
    accountId: account_id,
    categoryId: category_id,
    amount: Number(amount),
    date,
    description: description || null,
    destinationAccountId: destination_account_id || undefined,
  });

  if (destination_account_id) {
    const absAmount = Math.abs(Number(amount));
    transactionService.create({
      accountId: destination_account_id,
      categoryId: category_id,
      amount: absAmount,
      date,
      description: description ? `Transferencia: ${description}` : 'Transferencia',
      destinationAccountId: account_id,
    });
  }

  res.status(201).json(tx);
});

transactionRouter.delete('/:id', (req, res) => {
  const tx = transactionService.remove(Number(req.params.id));
  if (!tx) return res.status(404).json({ error: 'Transacción no encontrada' });
  res.json({ message: 'Transacción eliminada' });
});
