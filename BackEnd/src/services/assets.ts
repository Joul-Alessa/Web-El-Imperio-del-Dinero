import { assetRepository } from '../repositories/assets.js';

export const assetService = {
  list() { return assetRepository.findAll(); },
  getById(id: number) { return assetRepository.findById(id); },
  getByTicker(ticker: string) { return assetRepository.findByTicker(ticker); },
  create(data: { ticker: string; name: string; assetType: string }) { return assetRepository.create(data); },
  remove(id: number) { return assetRepository.remove(id); },
};
