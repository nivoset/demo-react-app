import { CustomerSearch } from '../components/CustomerSearch';
import type { Customer } from '../legacy/LegacyCustomerSearch';
import { FilterPanel, type FilterFormData } from '../components/FilterPanel';
import { TransactionsTable } from '../components/TransactionsTable';
import { CustomerDetailsPanel } from '../components/CustomerDetailsPanel';
import type { KycResult } from '../logic/kycRules.v1';
import type { TransactionFilters } from '../api/transactionsApi';
import type { Transaction } from '../api/transactionsApi';

interface DashboardLayoutV1Props {
  selectedCustomer: Customer | null;
  kycResult: KycResult | null;
  kycVersion: 'v1' | 'v2';
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  filters: TransactionFilters;
  isProcessingKycAction: boolean;
  onCustomerSelect: (customer: Customer) => void;
  onFilterSubmit: (filters: FilterFormData) => void;
  onApproveKyc: () => void;
  onRequestKycDocuments: () => void;
  onHoldKyc: () => void;
}

/**
 * Dashboard Layout V1 - Classic 3-column horizontal layout
 * Traditional sidebar + main content + details panel arrangement
 */
export function DashboardLayoutV1({
  selectedCustomer,
  kycResult,
  kycVersion,
  transactions,
  isLoadingTransactions,
  filters,
  isProcessingKycAction,
  onCustomerSelect,
  onFilterSubmit,
  onApproveKyc,
  onRequestKycDocuments,
  onHoldKyc,
}: DashboardLayoutV1Props) {
  return (
    <div className="p-4">
      {/* Filter Panel */}
      <FilterPanel
        onSubmit={onFilterSubmit}
        defaultValues={{
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          type: filters.type ? (filters.type as FilterFormData['type']) : 'all',
          status: filters.status ? (filters.status as FilterFormData['status']) : 'all',
        }}
      />

      {/* Main Content Grid - 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Customer Search */}
        <div className="lg:col-span-1">
          <CustomerSearch onCustomerSelect={onCustomerSelect} />
        </div>

        {/* Middle Panel: Transactions */}
        <div className="lg:col-span-1">
          <TransactionsTable
            transactions={transactions}
            isLoading={isLoadingTransactions}
          />
        </div>

        {/* Right Panel: KYC Decision */}
        <div className="lg:col-span-1">
          <CustomerDetailsPanel
            customer={selectedCustomer}
            kycResult={kycResult}
            kycVersion={kycVersion}
            isProcessing={isProcessingKycAction}
            onApprove={onApproveKyc}
            onRequestDocs={onRequestKycDocuments}
            onHold={onHoldKyc}
          />
        </div>
      </div>
    </div>
  );
}

