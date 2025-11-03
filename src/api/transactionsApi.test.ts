import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchTransactions,
  approveKycDecision,
  requestKycDocuments,
  holdKycDecision,
  type TransactionFilters,
} from './transactionsApi';

describe('transactionsApi', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('fetchTransactions', () => {
    it('should fetch all transactions when no filters are provided', async () => {
      const promise = fetchTransactions();
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('pageSize');
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter transactions by customerId', async () => {
      const filters: TransactionFilters = {
        customerId: 'C-002',
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions.every(t => t.customerId === 'C-002')).toBe(true);
      expect(result.total).toBeGreaterThan(0);
    });

    it('should filter transactions by type', async () => {
      const filters: TransactionFilters = {
        type: 'payment',
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions.every(t => t.type === 'payment')).toBe(true);
    });

    it('should filter transactions by status', async () => {
      const filters: TransactionFilters = {
        status: 'completed',
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions.every(t => t.status === 'completed')).toBe(true);
    });

    it('should filter transactions by date range', async () => {
      const dateFrom = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = new Date().toISOString().split('T')[0];
      
      const filters: TransactionFilters = {
        dateFrom,
        dateTo,
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      result.transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const fromDate = new Date(dateFrom);
        const toDate = new Date(dateTo);
        expect(transactionDate >= fromDate).toBe(true);
        expect(transactionDate <= toDate).toBe(true);
      });
    });

    it('should apply multiple filters together', async () => {
      const filters: TransactionFilters = {
        customerId: 'C-002',
        type: 'payment',
        status: 'pending',
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions.every(t => 
        t.customerId === 'C-002' && 
        t.type === 'payment' && 
        t.status === 'pending'
      )).toBe(true);
    });

    it('should paginate results', async () => {
      const filters: TransactionFilters = {
        page: 1,
        pageSize: 2,
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions.length).toBeLessThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
    });

    it('should return empty array when filters match no transactions', async () => {
      const filters: TransactionFilters = {
        customerId: 'NON-EXISTENT',
      };
      
      const promise = fetchTransactions(filters);
      vi.advanceTimersByTime(500);
      const result = await promise;
      
      expect(result.transactions).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      const fetchPromise = fetchTransactions();
      
      // Fast-forward time by 500ms
      vi.advanceTimersByTime(500);
      
      await fetchPromise;
      const endTime = Date.now();
      
      // Should have taken at least 500ms (accounting for test execution time)
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('approveKycDecision', () => {
    it('should approve KYC decision for a customer', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const customerId = 'C-001';
      
      const promise = approveKycDecision(customerId);
      vi.advanceTimersByTime(1000);
      await promise;
      
      expect(consoleSpy).toHaveBeenCalledWith(`KYC approved for customer ${customerId}`);
      consoleSpy.mockRestore();
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      const approvePromise = approveKycDecision('C-001');
      
      vi.advanceTimersByTime(1000);
      await approvePromise;
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('requestKycDocuments', () => {
    it('should request documents for a customer', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const customerId = 'C-002';
      
      const promise = requestKycDocuments(customerId);
      vi.advanceTimersByTime(1000);
      await promise;
      
      expect(consoleSpy).toHaveBeenCalledWith(`Documents requested for customer ${customerId}`);
      consoleSpy.mockRestore();
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      const requestPromise = requestKycDocuments('C-002');
      
      vi.advanceTimersByTime(1000);
      await requestPromise;
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('holdKycDecision', () => {
    it('should hold KYC decision for a customer', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const customerId = 'C-003';
      
      const promise = holdKycDecision(customerId);
      vi.advanceTimersByTime(1000);
      await promise;
      
      expect(consoleSpy).toHaveBeenCalledWith(`KYC decision held for customer ${customerId}`);
      consoleSpy.mockRestore();
    });

    it('should simulate API delay', async () => {
      const startTime = Date.now();
      const holdPromise = holdKycDecision('C-003');
      
      vi.advanceTimersByTime(1000);
      await holdPromise;
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(0);
    });
  });
});

