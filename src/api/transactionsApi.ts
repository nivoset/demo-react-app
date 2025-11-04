export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'chargeback';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description?: string;
}

export interface TransactionFilters {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch transactions from API
 * Uses MSW for mocking in tests
 */
export async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const response = await fetch(`/api/transactions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Approve a KYC decision
 * Uses MSW for mocking in tests
 */
export async function approveKycDecision(customerId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const response = await fetch(`/api/kyc/approve/${customerId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to approve KYC: ${response.statusText}`);
  }

  await response.json();
  console.log(`KYC approved for customer ${customerId}`);
}

/**
 * Request KYC documents
 * Uses MSW for mocking in tests
 */
export async function requestKycDocuments(customerId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const response = await fetch(`/api/kyc/request-documents/${customerId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to request documents: ${response.statusText}`);
  }

  await response.json();
  console.log(`Documents requested for customer ${customerId}`);
}

/**
 * Hold a KYC decision
 * Uses MSW for mocking in tests
 */
export async function holdKycDecision(customerId: string): Promise<void> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const response = await fetch(`/api/kyc/hold/${customerId}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || `Failed to hold KYC: ${response.statusText}`);
  }

  await response.json();
  console.log(`KYC decision held for customer ${customerId}`);
}

