import type { ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import type { TransactionsResponse, Transaction } from '../api/transactionsApi';

// Create a test QueryClient with shorter cache times for testing
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0, // Immediately garbage collect
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

/**
 * Custom render function that wraps components with React Query provider
 * 
 * Usage:
 * ```tsx
 * const { result } = render(<MyComponent />);
 * ```
 */
export function renderWithQuery(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), ...renderOptions }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient, // Return queryClient so tests can access it
  };
}

// Re-export everything from @testing-library/react
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Override render method
export { renderWithQuery as render };

/**
 * Mock API Handlers for MSW
 * Happy path handlers - these return successful responses
 */
export const happyPathHandlers = [
  // GET /api/transactions - Fetch transactions
  http.get('*/api/transactions', ({ request }) => {
    const url = new URL(request.url);
    const customerId = url.searchParams.get('customerId');
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    // Mock transactions data
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

    if (customerId) {
      filtered = filtered.filter((t) => t.customerId === customerId);
    }

    if (type) {
      filtered = filtered.filter((t) => t.type === type);
    }

    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((t) => new Date(t.date) >= fromDate);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      filtered = filtered.filter((t) => new Date(t.date) <= toDate);
    }

    // Pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginated = filtered.slice(start, end);

    const response: TransactionsResponse = {
      transactions: paginated,
      total: filtered.length,
      page,
      pageSize,
    };

    return HttpResponse.json(response);
  }),

  // POST /api/kyc/approve/:customerId - Approve KYC decision
  http.post('*/api/kyc/approve/:customerId', async ({ params }) => {
    const { customerId } = params;
    return HttpResponse.json({ 
      success: true, 
      customerId,
      message: `KYC approved for customer ${customerId}` 
    });
  }),

  // POST /api/kyc/request-documents/:customerId - Request KYC documents
  http.post('*/api/kyc/request-documents/:customerId', async ({ params }) => {
    const { customerId } = params;
    return HttpResponse.json({ 
      success: true, 
      customerId,
      message: `Documents requested for customer ${customerId}` 
    });
  }),

  // POST /api/kyc/hold/:customerId - Hold KYC decision
  http.post('*/api/kyc/hold/:customerId', async ({ params }) => {
    const { customerId } = params;
    return HttpResponse.json({ 
      success: true, 
      customerId,
      message: `KYC decision held for customer ${customerId}` 
    });
  }),
];

/**
 * Unhappy path handlers - individual exports for selective use
 * Usage in tests:
 * ```ts
 * import { server, transactionsNetworkError } from '../test/test-utils';
 * 
 * server.use(transactionsNetworkError);
 * ```
 */

// GET /api/transactions - Network error
export const transactionsNetworkError = http.get('*/api/transactions', () => {
  return HttpResponse.error();
});

// GET /api/transactions - Server error
export const transactionsServerError = http.get('*/api/transactions', () => {
  return HttpResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
});

// POST /api/kyc/approve/:customerId - Approval fails
export const approveKycFailure = http.post('*/api/kyc/approve/:customerId', () => {
  return HttpResponse.json(
    { error: 'Failed to approve KYC decision' },
    { status: 400 }
  );
});

// POST /api/kyc/request-documents/:customerId - Request fails
export const requestDocumentsFailure = http.post('*/api/kyc/request-documents/:customerId', () => {
  return HttpResponse.json(
    { error: 'Failed to request documents' },
    { status: 400 }
  );
});

// POST /api/kyc/hold/:customerId - Hold fails
export const holdKycFailure = http.post('*/api/kyc/hold/:customerId', () => {
  return HttpResponse.json(
    { error: 'Failed to hold KYC decision' },
    { status: 400 }
  );
});

/**
 * All unhappy path handlers (for convenience)
 */
export const unhappyPathHandlers = [
  transactionsNetworkError,
  transactionsServerError,
  approveKycFailure,
  requestDocumentsFailure,
  holdKycFailure,
];

/**
 * Create MSW server with handlers
 * Usage in tests:
 * ```ts
 * import { server, happyPathHandlers, transactionsNetworkError } from '../test/test-utils';
 * 
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * 
 * // Use happy path by default
 * server.use(...happyPathHandlers);
 * 
 * // Override with error scenario in specific test
 * server.use(transactionsNetworkError);
 * ```
 */
export function createMockServer(handlers = happyPathHandlers) {
  return setupServer(...handlers);
}

/**
 * Default server instance with happy path handlers
 * Usage in tests:
 * ```ts
 * import { server, transactionsNetworkError } from '../test/test-utils';
 * 
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * 
 * it('should handle network error', () => {
 *   server.use(transactionsNetworkError);
 *   // test error handling
 * });
 * ```
 */
export const server = createMockServer();

