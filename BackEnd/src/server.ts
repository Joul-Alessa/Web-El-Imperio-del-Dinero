import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { userRouter } from './controllers/users.js';
import { institutionRouter } from './controllers/institutions.js';
import { accountRouter } from './controllers/accounts.js';
import { seedRouter } from './controllers/seed.js';
import { transactionRouter } from './controllers/transactions.js';
import { categoryRouter } from './controllers/categories.js';
import { balanceRouter } from './controllers/balance.js';
import { assetCrudRouter } from './controllers/assets-crud.js';
import { tradeRouter } from './controllers/trade.js';
import { revaluateRouter } from './controllers/revaluate.js';
import { portfolioRouter } from './controllers/portfolio.js';
import { analyticsRouter } from './controllers/analytics.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRouter);
app.use('/api/institutions', institutionRouter);
app.use('/api/accounts', accountRouter);
app.use('/api/accounts', balanceRouter);
app.use('/api/accounts', revaluateRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/assets', assetCrudRouter);
app.use('/api', tradeRouter);
app.use('/api', portfolioRouter);
app.use('/api', analyticsRouter);
app.use('/api/seed', seedRouter);

const staticDir = process.env.STATIC_DIR;
if (staticDir) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
