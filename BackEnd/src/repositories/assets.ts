import { db } from '../db/connection.js';
import { assets } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const assetRepository = {
  findAll() {
    return db.select().from(assets).orderBy(assets.ticker).all();
  },

  findById(id: number) {
    return db.select().from(assets).where(eq(assets.id, id)).get();
  },

  findByTicker(ticker: string) {
    return db.select().from(assets).where(eq(assets.ticker, ticker)).get();
  },

  create(data: { ticker: string; name: string; assetType: string }) {
    return db.insert(assets).values(data as any).returning().get();
  },

  remove(id: number) {
    return db.delete(assets).where(eq(assets.id, id)).returning().get();
  },
};
