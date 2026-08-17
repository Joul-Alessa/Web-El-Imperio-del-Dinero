import { db } from '../db/connection.js';
import { assetHoldings } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export const holdingRepository = {
  findByAccountAndAsset(accountId: number, assetId: number) {
    return db.select()
      .from(assetHoldings)
      .where(and(
        eq(assetHoldings.accountId, accountId),
        eq(assetHoldings.assetId, assetId),
      ))
      .get();
  },

  upsert(accountId: number, assetId: number, quantity: number, avgBuyPrice: number) {
    const existing = this.findByAccountAndAsset(accountId, assetId);
    if (existing) {
      return db.update(assetHoldings)
        .set({ quantity, avgBuyPrice })
        .where(eq(assetHoldings.id, existing.id))
        .returning()
        .get();
    }
    return db.insert(assetHoldings)
      .values({ accountId, assetId, quantity, avgBuyPrice })
      .returning()
      .get();
  },

  findByAccount(accountId: number) {
    return db.select()
      .from(assetHoldings)
      .where(eq(assetHoldings.accountId, accountId))
      .orderBy(assetHoldings.assetId)
      .all();
  },

  findAll() {
    return db.select().from(assetHoldings).all();
  },
};
