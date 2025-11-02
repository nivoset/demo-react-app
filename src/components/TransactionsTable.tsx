import type { Transaction } from '../api/transactionsApi';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
}

/**
 * UI Component: Displays transactions in a table format
 * Pure presentation component - receives data as props
 */
export function TransactionsTable({ transactions, isLoading }: TransactionsTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'payment':
        return 'text-blue-600';
      case 'refund':
        return 'text-orange-600';
      case 'chargeback':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div data-component="TransactionsTable" className="p-6 bg-white rounded-lg border border-gray-200">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div data-component="TransactionsTable" className="p-6 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-400">Transactions</h3>
        <p className="text-gray-400 text-center py-8">No transactions found</p>
      </div>
    );
  }

  return (
    <div data-component="TransactionsTable" className="p-6 bg-white rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Transactions</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-2 text-sm font-semibold text-gray-700">ID</th>
              <th className="pb-2 text-sm font-semibold text-gray-700">Customer</th>
              <th className="pb-2 text-sm font-semibold text-gray-700">Amount</th>
              <th className="pb-2 text-sm font-semibold text-gray-700">Type</th>
              <th className="pb-2 text-sm font-semibold text-gray-700">Status</th>
              <th className="pb-2 text-sm font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-600">{transaction.id}</td>
                <td className="py-3 text-sm text-gray-600">{transaction.customerName}</td>
                <td className="py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount, transaction.currency)}
                </td>
                <td className={`py-3 text-sm font-medium ${getTypeColor(transaction.type)}`}>
                  {transaction.type}
                </td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                      transaction.status
                    )}`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="py-3 text-sm text-gray-600">{formatDate(transaction.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

