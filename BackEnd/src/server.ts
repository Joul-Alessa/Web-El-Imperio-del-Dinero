import express from 'express';
import cors from 'cors';
import { userRouter } from './controllers/users.js';
import { institutionRouter } from './controllers/institutions.js';
import { accountRouter } from './controllers/accounts.js';
import { seedRouter } from './controllers/seed.js';

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
app.use('/api/seed', seedRouter);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
