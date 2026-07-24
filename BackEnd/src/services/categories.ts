import { categoryRepository } from '../repositories/categories.js';

export const categoryService = {
  list() { return categoryRepository.findAll(); },
  getById(id: number) { return categoryRepository.findById(id); },
  create(data: { name: string; type: string }) { return categoryRepository.create(data); },
  update(id: number, data: { name?: string; type?: string }) { return categoryRepository.update(id, data); },
  remove(id: number) { return categoryRepository.remove(id); },
};
