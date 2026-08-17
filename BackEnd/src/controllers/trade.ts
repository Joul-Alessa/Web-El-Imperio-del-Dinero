import { Router } from 'express';
import { db } from '../db/connection.js';
import { assetTransactions } from '../db/schema.js';
import { holdingRepository } from '../repositories/holdings.js';

export const tradeRouter = Router();

tradeRouter.post('/assets/trade', (req, res) => {
  const { account_id, asset_id, transaction_type, quantity, price_per_unit, fee, date } = req.body;

  if (!account_id || !asset_id || !transaction_type || !quantity || !price_per_unit || !date) {
    return res.status(400).json({ error: 'account_id, asset_id, transaction_type, quantity, price_per_unit y date son requeridos' });
  }

  if (!['BUY', 'SELL'].includes(transaction_type)) {
    return res.status(400).json({ error: 'transaction_type debe ser BUY o SELL' });
  }

  const qty = Number(quantity);
  const price = Number(price_per_unit);
  const fees = Number(fee || 0);

  const tx = db.insert(assetTransactions).values({
    accountId: account_id,
    assetId: asset_id,
    transactionType: transaction_type,
    quantity: qty,
    pricePerUnit: price,
    fee: fees,
    date,
  } as any).returning().get();

  const existing = holdingRepository.findByAccountAndAsset(account_id, asset_id);

  if (transaction_type === 'BUY') {
    const oldQty = existing?.quantity ?? 0;
    const oldAvg = existing?.avgBuyPrice ?? 0;
    const newQty = oldQty + qty;
    const newAvg = oldQty > 0
      ? ((oldAvg * oldQty) + (price * qty)) / newQty
      : price;
    holdingRepository.upsert(account_id, asset_id, newQty, newAvg);
  } else {
    const oldQty = existing?.quantity ?? 0;
    const newQty = Math.max(0, oldQty - qty);
    const newAvg = newQty > 0 ? (existing?.avgBuyPrice ?? 0) : 0;
    holdingRepository.upsert(account_id, asset_id, newQty, newAvg);
  }

  res.status(201).json(tx);
});

tradeRouter.get('/assets/trade', (req, res) => {
  const { account_id, asset_id } = req.query;
  let query = db.select().from(assetTransactions).orderBy(assetTransactions.date).all();
  if (account_id) {
    query = query.filter(t => t.accountId === Number(account_id));
  }
  if (asset_id) {
    query = query.filter(t => t.assetId === Number(asset_id));
  }
  res.json(query);
});
