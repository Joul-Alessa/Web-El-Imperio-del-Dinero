import { institutionRepository } from '../repositories/institutions.js';

export const institutionService = {
  list() {
    return institutionRepository.findAll();
  },

  getById(id: number) {
    return institutionRepository.findById(id);
  },

  create(data: { name: string; icon?: string }) {
    return institutionRepository.create(data);
  },

  update(id: number, data: { name?: string; icon?: string }) {
    return institutionRepository.update(id, data);
  },

  remove(id: number) {
    return institutionRepository.remove(id);
  },
};
