import { CustomerSearch } from '../adapters/LegacyCustomerSearchAdapter';
import type { Customer } from '../adapters/LegacyCustomerSearch';
import { FilterPanel, type FilterFormData } from '../components/FilterPanel';
import { TransactionsTable } from '../components/TransactionsTable';
import { CustomerDetailsPanel } from '../components/CustomerDetailsPanel';
import type { KycResult } from '../logic/kycRules.v1';
import type { TransactionFilters } from '../api/transactionsApi';
import type { Transaction } from '../api/transactionsApi';

interface DashboardLayoutV2Props {
  selectedCustomer: Customer | null;
  kycResult: KycResult | null;
  kycVersion: 'v1' | 'v2';
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  filters: TransactionFilters;
  onCustomerSelect: (customer: Customer) => void;
  onFilterSubmit: (filters: FilterFormData) => void;
  onKycActionComplete: () => void;
}

/**
 * Dashboard Layout V2 - Modern vertical stack layout
 * Top customer search, middle transactions, bottom KYC decision
 * More focused workflow-oriented design
 */
export function DashboardLayoutV2({
  selectedCustomer,
  kycResult,
  kycVersion,
  transactions,
  isLoadingTransactions,
  filters,
  onCustomerSelect,
  onFilterSubmit,
  onKycActionComplete,
}: DashboardLayoutV2Props) {
  return (
    <div className="p-4">
      {/* Top Section: Customer Search and Filters side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <CustomerSearch onCustomerSelect={onCustomerSelect} />
        </div>
        <div>
          <FilterPanel
            onSubmit={onFilterSubmit}
            defaultValues={{
              dateFrom: filters.dateFrom,
              dateTo: filters.dateTo,
              type: filters.type ? (filters.type as FilterFormData['type']) : 'all',
              status: filters.status ? (filters.status as FilterFormData['status']) : 'all',
            }}
          />
        </div>
      </div>

      {/* Middle Section: Transactions - Full Width */}
      <div className="mb-6">
        <TransactionsTable
          transactions={transactions}
          isLoading={isLoadingTransactions}
        />
      </div>

      {/* Bottom Section: KYC Decision - Full Width */}
      <div>
        <CustomerDetailsPanel
          customer={selectedCustomer}
          kycResult={kycResult}
          kycVersion={kycVersion}
          onActionComplete={onKycActionComplete}
        />
      </div>
    </div>
  );
}

