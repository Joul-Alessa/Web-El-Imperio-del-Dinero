import { Router } from 'express';
import { db } from '../db/connection.js';
import { assetHoldings, assets, accounts, users, institutions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export const portfolioRouter = Router();

portfolioRouter.get('/portfolio/summary', (req, res) => {
  const { user_id } = req.query;

  const baseQuery = db.select({
    holdingId: assetHoldings.id,
    accountId: assetHoldings.accountId,
    assetId: assetHoldings.assetId,
    quantity: assetHoldings.quantity,
    avgBuyPrice: assetHoldings.avgBuyPrice,
    ticker: assets.ticker,
    assetName: assets.name,
    assetType: assets.assetType,
    accountName: accounts.name,
    userId: accounts.userId,
    userName: users.name,
    institutionName: institutions.name,
  })
    .from(assetHoldings)
    .innerJoin(assets, eq(assetHoldings.assetId, assets.id))
    .innerJoin(accounts, eq(assetHoldings.accountId, accounts.id))
    .innerJoin(users, eq(accounts.userId, users.id))
    .innerJoin(institutions, eq(accounts.institutionId, institutions.id));

  const results = user_id
    ? baseQuery.where(eq(accounts.userId, Number(user_id))).all()
    : baseQuery.all();

  res.json(results);
});
