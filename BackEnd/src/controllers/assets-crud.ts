import { Router } from 'express';
import { assetService } from '../services/assets.js';

export const assetCrudRouter = Router();

assetCrudRouter.get('/', (_req, res) => {
  res.json(assetService.list());
});

assetCrudRouter.get('/:id', (req, res) => {
  const asset = assetService.getById(Number(req.params.id));
  if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });
  res.json(asset);
});

assetCrudRouter.post('/', (req, res) => {
  const { ticker, name, asset_type } = req.body;
  if (!ticker || !name || !asset_type) {
    return res.status(400).json({ error: 'ticker, name y asset_type son requeridos' });
  }
  const valid = ['STOCK', 'ETF', 'BOND', 'CRYPTO'];
  if (!valid.includes(asset_type)) {
    return res.status(400).json({ error: `asset_type debe ser uno de: ${valid.join(', ')}` });
  }
  res.status(201).json(assetService.create({ ticker: ticker.toUpperCase(), name, assetType: asset_type }));
});

assetCrudRouter.delete('/:id', (req, res) => {
  const asset = assetService.remove(Number(req.params.id));
  if (!asset) return res.status(404).json({ error: 'Activo no encontrado' });
  res.json({ message: 'Activo eliminado' });
});
