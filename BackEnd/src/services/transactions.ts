import { transactionRepository } from '../repositories/transactions.js';

interface TransactionFilters {
  userId?: number;
  accountId?: number;
  categoryId?: number;
  type?: string;
  from?: string;
  to?: string;
}

export const transactionService = {
  list(filters?: TransactionFilters) {
    return transactionRepository.findAll(filters);
  },

  getById(id: number) {
    return transactionRepository.findById(id);
  },

  create(data: {
    accountId: number;
    categoryId: number;
    amount: number;
    date: string;
    description?: string;
    destinationAccountId?: number;
  }) {
    return transactionRepository.create(data);
  },

  remove(id: number) {
    return transactionRepository.remove(id);
  },
};
