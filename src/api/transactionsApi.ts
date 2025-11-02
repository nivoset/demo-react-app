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
 * Mock API function for fetching transactions
 * In a real app, this would call an actual API endpoint
 */
export async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Mock data
  const mockTransactions: Transaction[] = [
    {
      id: 'T-001',
      customerId: 'C-002',
      customerName: 'Emily Chen',
      amount: 1250.50,
      currency: 'USD',
      type: 'payment',
      status: 'completed',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Payment for services',
    },
    {
      id: 'T-002',
      customerId: 'C-002',
      customerName: 'Emily Chen',
      amount: 3200.00,
      currency: 'USD',
      type: 'payment',
      status: 'pending',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Large payment',
    },
    {
      id: 'T-003',
      customerId: 'C-001',
      customerName: 'Jacob White',
      amount: 450.25,
      currency: 'USD',
      type: 'payment',
      status: 'completed',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Regular payment',
    },
    {
      id: 'T-004',
      customerId: 'C-003',
      customerName: 'Samir Khan',
      amount: 890.00,
      currency: 'USD',
      type: 'refund',
      status: 'completed',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Refund processed',
    },
  ];

  // Apply filters
  let filtered = mockTransactions;

  if (filters.customerId) {
    filtered = filtered.filter((t) => t.customerId === filters.customerId);
  }

  if (filters.type) {
    filtered = filtered.filter((t) => t.type === filters.type);
  }

  if (filters.status) {
    filtered = filtered.filter((t) => t.status === filters.status);
  }

  if (filters.dateFrom) {
    const fromDate = new Date(filters.dateFrom);
    filtered = filtered.filter((t) => new Date(t.date) >= fromDate);
  }

  if (filters.dateTo) {
    const toDate = new Date(filters.dateTo);
    filtered = filtered.filter((t) => new Date(t.date) <= toDate);
  }

  // Pagination
  const page = filters.page || 1;
  const pageSize = filters.pageSize || 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  return {
    transactions: paginated,
    total: filtered.length,
    page,
    pageSize,
  };
}

/**
 * Mock API function for approving a KYC decision
 */
export async function approveKycDecision(customerId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`KYC approved for customer ${customerId}`);
}

/**
 * Mock API function for requesting documents
 */
export async function requestKycDocuments(customerId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`Documents requested for customer ${customerId}`);
}

/**
 * Mock API function for placing a hold
 */
export async function holdKycDecision(customerId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log(`KYC decision held for customer ${customerId}`);
}

