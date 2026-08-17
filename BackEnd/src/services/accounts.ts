import { accountRepository } from '../repositories/accounts.js';

interface AccountFilters {
  userId?: number;
  institutionId?: number;
  type?: string;
}

export const accountService = {
  list(filters?: AccountFilters) {
    return accountRepository.findAll(filters);
  },

  getById(id: number) {
    return accountRepository.findById(id);
  },

  create(data: { userId: number; institutionId: number; name: string; type: string; currency?: string }) {
    return accountRepository.create(data);
  },

  update(id: number, data: { userId?: number; institutionId?: number; name?: string; type?: string; currency?: string }) {
    return accountRepository.update(id, data);
  },

  remove(id: number) {
    return accountRepository.remove(id);
  },
};
