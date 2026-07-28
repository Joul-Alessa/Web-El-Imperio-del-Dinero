import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
  private base = '/api';

  constructor(private http: HttpClient) {}

  getUsers() { return this.http.get<User[]>(`${this.base}/users`); }
  createUser(name: string) { return this.http.post<User>(`${this.base}/users`, { name }); }
  updateUser(id: number, name: string) { return this.http.put<User>(`${this.base}/users/${id}`, { name }); }
  deleteUser(id: number) { return this.http.delete<{ message: string }>(`${this.base}/users/${id}`); }

  getInstitutions() { return this.http.get<Institution[]>(`${this.base}/institutions`); }
  createInstitution(name: string, icon?: string) { return this.http.post<Institution>(`${this.base}/institutions`, { name, icon }); }
  updateInstitution(id: number, data: Partial<Institution>) { return this.http.put<Institution>(`${this.base}/institutions/${id}`, data); }
  deleteInstitution(id: number) { return this.http.delete<{ message: string }>(`${this.base}/institutions/${id}`); }

  getAccounts(params?: { userId?: number; institutionId?: number; type?: string }) {
    const qs = new URLSearchParams();
    if (params?.userId) qs.set('user_id', String(params.userId));
    if (params?.institutionId) qs.set('institution_id', String(params.institutionId));
    if (params?.type) qs.set('type', params.type);
    const query = qs.toString();
    return this.http.get<Account[]>(`${this.base}/accounts${query ? '?' + query : ''}`);
  }
  createAccount(data: { user_id: number; institution_id: number; name: string; type: string; currency?: string }) {
    return this.http.post<Account>(`${this.base}/accounts`, data);
  }
  updateAccount(id: number, data: Partial<Account>) {
    return this.http.put<Account>(`${this.base}/accounts/${id}`, data);
  }
  deleteAccount(id: number) { return this.http.delete<{ message: string }>(`${this.base}/accounts/${id}`); }
  getBalance(id: number, from?: string, to?: string) {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const query = qs.toString();
    return this.http.get<any>(`${this.base}/accounts/${id}/balance${query ? '?' + query : ''}`);
  }

  getCategories() { return this.http.get<Category[]>(`${this.base}/categories`); }

  getTransactions(params?: { accountId?: number; categoryId?: number; from?: string; to?: string }) {
    const qs = new URLSearchParams();
    if (params?.accountId) qs.set('account_id', String(params.accountId));
    if (params?.categoryId) qs.set('category_id', String(params.categoryId));
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    const query = qs.toString();
    return this.http.get<Transaction[]>(`${this.base}/transactions${query ? '?' + query : ''}`);
  }
  createTransaction(data: { account_id: number; category_id: number; amount: number; date: string; description?: string; destination_account_id?: number }) {
    return this.http.post<Transaction>(`${this.base}/transactions`, data);
  }
  deleteTransaction(id: number) { return this.http.delete<{ message: string }>(`${this.base}/transactions/${id}`); }

  getAssets() { return this.http.get<Asset[]>(`${this.base}/assets`); }
  createAsset(data: { ticker: string; name: string; asset_type: string }) {
    return this.http.post<Asset>(`${this.base}/assets`, data);
  }
  deleteAsset(id: number) { return this.http.delete<{ message: string }>(`${this.base}/assets/${id}`); }

  trade(data: { account_id: number; asset_id: number; transaction_type: string; quantity: number; price_per_unit: number; fee?: number; date: string }) {
    return this.http.post<any>(`${this.base}/assets/trade`, data);
  }
  getTrades(accountId?: number) {
    const qs = accountId ? '?account_id=' + accountId : '';
    return this.http.get<any[]>(`${this.base}/assets/trade${qs}`);
  }

  revaluate(accountId: number, newBalance: number, notes?: string) {
    return this.http.post<any>(`${this.base}/accounts/${accountId}/revaluate`, { new_balance: newBalance, notes });
  }
  getRevaluations(accountId: number) {
    return this.http.get<any[]>(`${this.base}/accounts/${accountId}/revaluations`);
  }

  getPortfolio(userId?: number) {
    const qs = userId ? '?user_id=' + userId : '';
    return this.http.get<any[]>(`${this.base}/portfolio/summary${qs}`);
  }

  getAnalytics(params?: { from?: string; to?: string; userId?: number; accountId?: number; accountType?: string; cumulative?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.from) qs.set('from', params.from);
    if (params?.to) qs.set('to', params.to);
    if (params?.userId) qs.set('user_id', String(params.userId));
    if (params?.accountId) qs.set('account_id', String(params.accountId));
    if (params?.accountType) qs.set('account_type', params.accountType);
    if (params?.cumulative) qs.set('cumulative', 'true');
    const query = qs.toString();
    return this.http.get<any>(`${this.base}/analytics/summary${query ? '?' + query : ''}`);
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
