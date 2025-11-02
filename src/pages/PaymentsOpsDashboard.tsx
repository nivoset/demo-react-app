import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CustomerSearch } from '../adapters/LegacyCustomerSearchAdapter';
import type { Customer } from '../adapters/LegacyCustomerSearch';
import { FilterPanel, type FilterFormData } from '../components/FilterPanel';
import { TransactionsTable } from '../components/TransactionsTable';
import { CustomerDetailsPanel } from '../components/CustomerDetailsPanel';
import { useKycEngine } from '../logic/useKycEngine';
import { useFeatureFlags } from '../state/featureFlags';
import { fetchTransactions, type TransactionFilters } from '../api/transactionsApi';

/**
 * Main Dashboard Page
 * Composes UI components with business logic
 * Demonstrates separation of concerns: UI components are separate from logic
 */
export function PaymentsOpsDashboard() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
  });
  const [showComponentOutlines, setShowComponentOutlines] = useState(false);
  
  const { kycVersion, setKycVersion } = useFeatureFlags();
  const kycEngine = useKycEngine();

  // Evaluate KYC decision when customer is selected
  const kycResult = useMemo(() => {
    if (!selectedCustomer) return null;

    // Build KYC input from customer data
    // In a real app, this might include transaction history, velocity, etc.
    const kycInput = {
      riskScore: selectedCustomer.riskScore,
      country: selectedCustomer.country,
      isPep: selectedCustomer.isPep,
      sanctionsList: selectedCustomer.sanctionsList,
      amount: 0, // Could be calculated from recent transactions
      velocity: 0, // Could be calculated from recent transactions
    };

    return kycEngine.evaluate(kycInput);
  }, [selectedCustomer, kycEngine]);

  // Fetch transactions using TanStack Query
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['transactions', filters, selectedCustomer?.id],
    queryFn: () =>
      fetchTransactions({
        ...filters,
        customerId: selectedCustomer?.id,
      }),
  });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Transactions will automatically refetch due to query key including customerId
  };

  const handleFilterSubmit = (formFilters: FilterFormData) => {
    setFilters({
      dateFrom: formFilters.dateFrom,
      dateTo: formFilters.dateTo,
      type: formFilters.type === 'all' ? undefined : formFilters.type,
      status: formFilters.status === 'all' ? undefined : formFilters.status,
    });
  };

  const handleKycActionComplete = () => {
    // Refetch transactions after KYC action
    refetchTransactions();
  };

  return (
    <div 
      data-component="PaymentsOpsDashboard" 
      data-business-logic="kycRules.v1,kycRules.v2,useKycEngine" 
      className={`min-h-screen bg-gray-50 p-6 ${showComponentOutlines ? 'show-component-outlines' : ''}`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 relative">
          <div className="absolute top-0 right-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-sm text-gray-600">Show Component Outlines</span>
              <button
                onClick={() => setShowComponentOutlines(!showComponentOutlines)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showComponentOutlines ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showComponentOutlines ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payments Operations Dashboard
          </h1>
          
          {/* Feature Flag Toggle */}
          <div className="flex items-center gap-4 mb-4 p-4 bg-white rounded-lg border-2 border-gray-200">
            <span className="text-sm font-semibold text-gray-700">KYC Engine Version:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setKycVersion('v1')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  kycVersion === 'v1'
                    ? 'bg-blue-600 text-white shadow-lg scale-105 ring-2 ring-blue-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                v1
              </button>
              <button
                onClick={() => setKycVersion('v2')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
                  kycVersion === 'v2'
                    ? 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-300'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                v2
              </button>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              kycVersion === 'v1' 
                ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                : 'bg-purple-100 text-purple-800 border border-purple-300'
            }`}>
              Active: {kycVersion.toUpperCase()}
            </div>
            <span className="text-xs text-gray-500 ml-auto">
              (Toggle to see how logic changes affect decision)
            </span>
          </div>
        </div>

        {/* Filter Panel */}
        <FilterPanel
          onSubmit={handleFilterSubmit}
          defaultValues={{
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
            type: filters.type ? (filters.type as FilterFormData['type']) : 'all',
            status: filters.status ? (filters.status as FilterFormData['status']) : 'all',
          }}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Customer Search (Legacy) */}
          <div className="lg:col-span-1">
            <CustomerSearch onCustomerSelect={handleCustomerSelect} />
          </div>

          {/* Middle Panel: Transactions */}
          <div className="lg:col-span-1">
            <TransactionsTable
              transactions={transactionsData?.transactions || []}
              isLoading={isLoadingTransactions}
            />
          </div>

          {/* Right Panel: KYC Decision */}
          <div className="lg:col-span-1">
            <CustomerDetailsPanel
              customer={selectedCustomer}
              kycResult={kycResult}
              kycVersion={kycVersion}
              onActionComplete={handleKycActionComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

