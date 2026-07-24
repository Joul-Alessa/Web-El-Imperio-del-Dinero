import express from 'express';
import cors from 'cors';
import { userRouter } from './controllers/users.js';
import { institutionRouter } from './controllers/institutions.js';
import { accountRouter } from './controllers/accounts.js';
import { seedRouter } from './controllers/seed.js';
import { transactionRouter } from './controllers/transactions.js';
import { categoryRouter } from './controllers/categories.js';
import { balanceRouter } from './controllers/balance.js';

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
app.use('/api/transactions', transactionRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/seed', seedRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
