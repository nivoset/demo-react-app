import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer } from '../../legacy/LegacyCustomerSearch';
import type { FilterFormData } from './components/FilterPanel';
import { useKycEngine } from '../../logic/useKycEngine';
import { useFeatureFlags } from '../../state/featureFlags';
import {
  fetchTransactions,
  approveKycDecision,
  requestKycDocuments,
  holdKycDecision,
  type TransactionFilters,
  type TransactionsResponse,
  type Transaction,
} from '../../api/transactionsApi';
import { DashboardLayoutV1 } from './DashboardLayoutV1';
import { DashboardLayoutV2 } from './DashboardLayoutV2';
import { FeatureFlagsPanel } from '../../components/FeatureFlagsPanel';

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
  const [isProcessingKycAction, setIsProcessingKycAction] = useState(false);
  const [showFeatureFlagsPanel, setShowFeatureFlagsPanel] = useState(false);
  const [isHoveringCorner, setIsHoveringCorner] = useState(false);
  
  const { 
    kycVersion,
    view, 
    showComponentOutlines,
  } = useFeatureFlags();
  const kycEngine = useKycEngine();
  const queryClient = useQueryClient();

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
    // Refetch transactions after KYC action to ensure consistency
    refetchTransactions();
  };

  // Optimistically update transaction status for a customer
  const updateTransactionsOptimistically = (
    customerId: string,
    updateFn: (transaction: Transaction) => Transaction
  ) => {
    const queryKey = ['transactions', filters, customerId];
    queryClient.setQueryData<TransactionsResponse>(queryKey, (oldData) => {
      if (!oldData) return oldData;
      
      return {
        ...oldData,
        transactions: oldData.transactions.map((transaction) =>
          transaction.customerId === customerId
            ? updateFn(transaction)
            : transaction
        ),
      };
    });
  };

  // Handle KYC actions - all business logic at page level
  const handleApproveKyc = async () => {
    if (!selectedCustomer) return;
    setIsProcessingKycAction(true);
    
    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<TransactionsResponse>([
      'transactions',
      filters,
      selectedCustomer.id,
    ]);

    try {
      // Optimistically update: change pending transactions to completed
      updateTransactionsOptimistically(selectedCustomer.id, (transaction) => {
        if (transaction.status === 'pending') {
          return { ...transaction, status: 'completed' as const };
        }
        return transaction;
      });

      await approveKycDecision(selectedCustomer.id);
      // Refetch to ensure we have the latest server state
      await refetchTransactions();
    } catch (error) {
      console.error('Failed to approve KYC decision:', error);
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(
          ['transactions', filters, selectedCustomer.id],
          previousData
        );
      }
    } finally {
      setIsProcessingKycAction(false);
    }
  };

  const handleRequestKycDocuments = async () => {
    if (!selectedCustomer) return;
    setIsProcessingKycAction(true);
    try {
      await requestKycDocuments(selectedCustomer.id);
      handleKycActionComplete();
    } catch (error) {
      console.error('Failed to request documents:', error);
    } finally {
      setIsProcessingKycAction(false);
    }
  };

  const handleHoldKyc = async () => {
    if (!selectedCustomer) return;
    setIsProcessingKycAction(true);
    
    // Store the previous data for rollback
    const previousData = queryClient.getQueryData<TransactionsResponse>([
      'transactions',
      filters,
      selectedCustomer.id,
    ]);

    try {
      // Optimistically update: change pending transactions to failed (or keep as pending with visual indicator)
      // For hold, we'll mark pending transactions as failed to indicate they're blocked
      updateTransactionsOptimistically(selectedCustomer.id, (transaction) => {
        if (transaction.status === 'pending') {
          return { ...transaction, status: 'failed' as const };
        }
        return transaction;
      });

      await holdKycDecision(selectedCustomer.id);
      // Refetch to ensure we have the latest server state
      await refetchTransactions();
    } catch (error) {
      console.error('Failed to hold KYC decision:', error);
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(
          ['transactions', filters, selectedCustomer.id],
          previousData
        );
      }
    } finally {
      setIsProcessingKycAction(false);
    }
  };

  return (
    <div 
      className={`min-h-screen bg-gray-50 p-6 ${showComponentOutlines ? 'show-component-outlines' : ''}`}
    >
      <div className="max-w-7xl mx-auto">
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Payments Operations Dashboard
              </h1>
            </header>

        {/* Floating Feature Flags Button & Panel */}
        <div
          className="fixed bottom-0 right-0 z-50"
          onMouseEnter={() => setIsHoveringCorner(true)}
          onMouseLeave={() => setIsHoveringCorner(false)}
        >
          {/* Hover zone - invisible area to detect mouse in corner */}
          <div className="absolute bottom-0 right-0 w-32 h-32" />
          
          <div className="flex flex-col items-end gap-4 pr-6 pb-6">
            {/* Feature Flags Panel */}
            <FeatureFlagsPanel 
              isOpen={showFeatureFlagsPanel} 
              onClose={() => setShowFeatureFlagsPanel(false)} 
            />
            
            {/* Floating Button - Animates in when hovering corner or panel is open */}
                <button
                  onClick={() => setShowFeatureFlagsPanel(!showFeatureFlagsPanel)}
                  aria-label="Open feature flags panel"
                  aria-expanded={showFeatureFlagsPanel}
                  className={`relative z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
                    showFeatureFlagsPanel || isHoveringCorner
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4 pointer-events-none'
                  } ${
                    showFeatureFlagsPanel
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
                  }`}
                  title="Feature Flags"
                >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
          </div>
        </div>

        {/* Dynamic Layout Based on View */}
        {view === 'view1' ? (
          <DashboardLayoutV1
            selectedCustomer={selectedCustomer}
            kycResult={kycResult}
            kycVersion={kycVersion}
            transactions={transactionsData?.transactions || []}
            isLoadingTransactions={isLoadingTransactions}
            filters={filters}
            isProcessingKycAction={isProcessingKycAction}
            onCustomerSelect={handleCustomerSelect}
            onFilterSubmit={handleFilterSubmit}
            onApproveKyc={handleApproveKyc}
            onRequestKycDocuments={handleRequestKycDocuments}
            onHoldKyc={handleHoldKyc}
          />
        ) : (
          <DashboardLayoutV2
            selectedCustomer={selectedCustomer}
            kycResult={kycResult}
            kycVersion={kycVersion}
            transactions={transactionsData?.transactions || []}
            isLoadingTransactions={isLoadingTransactions}
            filters={filters}
            isProcessingKycAction={isProcessingKycAction}
            onCustomerSelect={handleCustomerSelect}
            onFilterSubmit={handleFilterSubmit}
            onApproveKyc={handleApproveKyc}
            onRequestKycDocuments={handleRequestKycDocuments}
            onHoldKyc={handleHoldKyc}
          />
        )}
      </div>
    </div>
  );
}

