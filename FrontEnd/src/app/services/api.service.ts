import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface User {
  id: number;
  name: string;
  createdAt: string;
}

export interface Institution {
  id: number;
  name: string;
  icon: string | null;
}

export interface Account {
  id: number;
  userId: number;
  institutionId: number;
  name: string;
  type: 'DEBIT' | 'CREDIT' | 'INVESTMENT' | 'CASH';
  currency: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = 'http://localhost:3000/api';

  private request<T>(path: string, init?: RequestInit): Observable<T> {
    return from(
      fetch(`${this.base}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || res.statusText);
        }
        return res.json() as T;
      })
    );
  }

  getUsers() { return this.request<User[]>('/users'); }
  createUser(name: string) { return this.request<User>('/users', { method: 'POST', body: JSON.stringify({ name }) }); }
  updateUser(id: number, name: string) { return this.request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }); }
  deleteUser(id: number) { return this.request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }); }

  getInstitutions() { return this.request<Institution[]>('/institutions'); }
  createInstitution(name: string, icon?: string) { return this.request<Institution>('/institutions', { method: 'POST', body: JSON.stringify({ name, icon }) }); }
  updateInstitution(id: number, data: Partial<Institution>) { return this.request<Institution>(`/institutions/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
  deleteInstitution(id: number) { return this.request<{ message: string }>(`/institutions/${id}`, { method: 'DELETE' }); }

  getAccounts(params?: { userId?: number; institutionId?: number; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set('user_id', String(params.userId));
    if (params?.institutionId) qs.set('institution_id', String(params.institutionId));
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString();
    return this.request<Account[]>(`/accounts${query ? '?' + query : ''}`);
  }
  createAccount(data: { user_id: number; institution_id: number; name: string; type: string; currency?: string }) {
    return this.request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) });
  }
  updateAccount(id: number, data: Partial<Account>) {
    return this.request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }
  deleteAccount(id: number) { return this.request<{ message: string }>(`/accounts/${id}`, { method: 'DELETE' }); }
  getBalance(id: number, from?: string, to?: string) {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString();
    return this.request<any>(`/accounts/${id}/balance${query ? '?' + query : ''}`);
  }

  // Categories
  getCategories() { return this.request<Category[]>('/categories'); }

  // Transactions
  getTransactions(params?: { accountId?: number; categoryId?: number; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('account_id', String(params.accountId));
    if (params?.categoryId) qs.set('category_id', String(params.categoryId));
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const query = qs.toString();
    return this.request<Transaction[]>(`/transactions${query ? '?' + query : ''}`);
  }
  createTransaction(data: { account_id: number; category_id: number; amount: number; date: string; description?: string; destination_account_id?: number }) {
    return this.request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) });
  }
  deleteTransaction(id: number) { return this.request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }); }

  // Assets
  getAssets() { return this.request<Asset[]>('/assets'); }
  createAsset(data: { ticker: string; name: string; asset_type: string }) {
    return this.request<Asset>('/assets', { method: 'POST', body: JSON.stringify(data) });
  }
  deleteAsset(id: number) { return this.request<{ message: string }>(`/assets/${id}`, { method: 'DELETE' }); }

  // Trades
  trade(data: { account_id: number; asset_id: number; transaction_type: string; quantity: number; price_per_unit: number; fee?: number; date: string }) {
    return this.request<any>('/assets/trade', { method: 'POST', body: JSON.stringify(data) });
  }
  getTrades(accountId?: number) {
    const qs = accountId ? '?account_id=' + accountId : '';
    return this.request<any[]>(`/assets/trade${qs}`);
  }

  // Revaluation
  revaluate(accountId: number, newBalance: number, notes?: string) {
    return this.request<any>(`/accounts/${accountId}/revaluate`, { method: 'POST', body: JSON.stringify({ new_balance: newBalance, notes }) });
  }
  getRevaluations(accountId: number) {
    return this.request<any[]>(`/accounts/${accountId}/revaluations`);
  }

  // Portfolio
  getPortfolio(userId?: number) {
    const qs = userId ? '?user_id=' + userId : '';
    return this.request<any[]>(`/portfolio/summary${qs}`);
  }
}

export interface Category {
  id: number;
  name: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export interface Transaction {
  id: number;
  accountId: number;
  categoryId: number;
  amount: number;
  date: string;
  description: string | null;
  destinationAccountId: number | null;
}

export interface Asset {
  id: number;
  ticker: string;
  name: string;
  assetType: string;
}
