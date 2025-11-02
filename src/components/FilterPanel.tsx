import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const filterSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  type: z.enum(['payment', 'refund', 'chargeback', 'all']).optional(),
  status: z.enum(['completed', 'pending', 'failed', 'all']).optional(),
});

export type FilterFormData = z.infer<typeof filterSchema>;

interface FilterPanelProps {
  onSubmit: (filters: FilterFormData) => void;
  defaultValues?: Partial<FilterFormData>;
}

/**
 * UI Component: Filter panel with form for date range, type, and status
 * Uses React Hook Form with Zod validation
 */
export function FilterPanel({ onSubmit, defaultValues }: FilterPanelProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      type: 'all',
      status: 'all',
      ...defaultValues,
    },
  });

  const handleFormSubmit = (data: FilterFormData) => {
    // Convert 'all' to undefined for API
    const filters = {
      ...data,
      type: data.type === 'all' ? undefined : data.type,
      status: data.status === 'all' ? undefined : data.status,
    };
    onSubmit(filters);
  };

  const handleReset = () => {
    reset({
      type: 'all',
      status: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
    onSubmit({
      type: undefined,
      status: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  // Set default date range to last 7 days
  const getDefaultDateFrom = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  const getDefaultDateTo = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div data-component="FilterPanel" className="p-4 bg-white rounded-lg border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold mb-4">Filters</h3>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              {...register('dateFrom')}
              defaultValue={defaultValues?.dateFrom || getDefaultDateFrom()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              {...register('dateTo')}
              defaultValue={defaultValues?.dateTo || getDefaultDateTo()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              {...register('type')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="payment">Payment</option>
              <option value="refund">Refund</option>
              <option value="chargeback">Chargeback</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isDirty}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

