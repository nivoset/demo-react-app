import { useEffect, useRef, useState } from 'react';

export interface Customer {
  id: string;
  name: string;
  riskScore: number;
  country: string;
  isPep?: boolean;
  sanctionsList?: boolean;
}

interface LegacyCustomerSearchProps {
  // No direct props - legacy component only dispatches events
}

/**
 * Legacy Customer Search Component
 * This component dispatches custom events instead of using direct callbacks.
 * This matches how legacy web components or micro-frontends typically work.
 * In a real scenario, this would embed an actual web component or iframe.
 * For this demo, we'll simulate the legacy component with React.
 */
export function LegacyCustomerSearch(_props: LegacyCustomerSearchProps = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers] = useState<Customer[]>([
    {
      id: 'C-001',
      name: 'Jacob White',
      riskScore: 35,
      country: 'US',
      isPep: false,
    },
    {
      id: 'C-002',
      name: 'Emily Chen',
      riskScore: 62,
      country: 'CN',
      isPep: false,
    },
    {
      id: 'C-003',
      name: 'Samir Khan',
      riskScore: 78,
      country: 'PK',
      isPep: true,
    },
  ]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.id.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, customers]);

  const handleSearch = () => {
    // Search is already handled by useEffect
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    // Legacy component dispatches custom events instead of calling callbacks
    const event = new CustomEvent('customer:select', {
      detail: customer,
      bubbles: true,
      cancelable: true,
    });
    if (containerRef.current) {
      containerRef.current.dispatchEvent(event);
    }
  };

  // In a real implementation, this would embed the actual legacy web component
  // and listen for its custom events. For demo purposes, we create a React UI
  // that simulates the legacy component's behavior.
  return (
    <div ref={containerRef} data-component="LegacyCustomerSearch" className="legacy-customer-search">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search customer by name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        onClick={handleSearch}
        className="w-full mb-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
      >
        Search
      </button>
      <div className="space-y-2">
        {filteredCustomers.map((customer) => (
          <div
            key={customer.id}
            onClick={() => handleCustomerClick(customer)}
            className={`p-3 border rounded-md cursor-pointer transition-colors ${
              selectedCustomerId === customer.id
                ? 'bg-gray-200 border-gray-400'
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-semibold">{customer.name}</div>
            <div className="text-sm text-gray-600">ID {customer.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

