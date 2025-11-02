import { useEffect, useRef, useState } from 'react';

export interface Customer {
  id: string;
  name: string;
  riskScore: number;
  country: string;
  isPep?: boolean;
  sanctionsList?: boolean;
}

/**
 * Legacy Customer Search Component
 * This component dispatches custom events instead of using direct callbacks.
 * This matches how legacy web components or micro-frontends typically work.
 * 
 * In a real scenario:
 * - This would embed an actual legacy application, possibly via single-spa or similar
 *   micro-frontend framework
 * - The legacy app would be mounted/rendered within this container
 * - Integration would handle lifecycle methods (mount, unmount, update) from the framework
 * - Event communication would bridge between the legacy system and modern React app
 * 
 * For this demo, we simulate the legacy component's behavior with React.
 */
export function LegacyCustomerSearch() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customers] = useState<Customer[]>([
    { id: 'C-001', name: 'Jacob White', riskScore: 35, country: 'US', isPep: false },
    { id: 'C-002', name: 'Emily Chen', riskScore: 62, country: 'CN', isPep: false },
    { id: 'C-003', name: 'Samir Khan', riskScore: 78, country: 'PK', isPep: true },
    { id: 'C-004', name: 'Michael Rodriguez', riskScore: 42, country: 'MX', isPep: false },
    { id: 'C-005', name: 'Sarah Johnson', riskScore: 28, country: 'CA', isPep: false },
    { id: 'C-006', name: 'Ahmed Hassan', riskScore: 71, country: 'EG', isPep: true },
    { id: 'C-007', name: 'Priya Patel', riskScore: 55, country: 'IN', isPep: false },
    { id: 'C-008', name: 'David Kim', riskScore: 39, country: 'KR', isPep: false },
    { id: 'C-009', name: 'Maria Garcia', riskScore: 45, country: 'ES', isPep: false },
    { id: 'C-010', name: 'James Wilson', riskScore: 33, country: 'GB', isPep: false },
    { id: 'C-011', name: 'Yuki Tanaka', riskScore: 41, country: 'JP', isPep: false },
    { id: 'C-012', name: 'Hans Mueller', riskScore: 38, country: 'DE', isPep: false },
    { id: 'C-013', name: 'Sophie Martin', riskScore: 49, country: 'FR', isPep: false },
    { id: 'C-014', name: 'Luigi Rossi', riskScore: 44, country: 'IT', isPep: false },
    { id: 'C-015', name: 'Anna Kowalski', riskScore: 52, country: 'PL', isPep: false },
    { id: 'C-016', name: 'Carlos Silva', riskScore: 58, country: 'BR', isPep: false },
    { id: 'C-017', name: 'Lisa Anderson', riskScore: 31, country: 'AU', isPep: false },
    { id: 'C-018', name: 'Mohammed Al-Rashid', riskScore: 68, country: 'SA', isPep: true },
    { id: 'C-019', name: 'Jennifer Brown', riskScore: 36, country: 'US', isPep: false },
    { id: 'C-020', name: 'Wei Zhang', riskScore: 64, country: 'CN', isPep: false },
    { id: 'C-021', name: 'Rajesh Kumar', riskScore: 59, country: 'IN', isPep: false },
    { id: 'C-022', name: 'Emma Thompson', riskScore: 43, country: 'GB', isPep: false },
    { id: 'C-023', name: 'Ivan Petrov', riskScore: 66, country: 'RU', isPep: true },
    { id: 'C-024', name: 'Amara Okafor', riskScore: 57, country: 'NG', isPep: false },
    { id: 'C-025', name: 'Tomáš Novák', riskScore: 47, country: 'CZ', isPep: false },
    { id: 'C-026', name: 'Olga Kowalczyk', riskScore: 54, country: 'PL', isPep: false },
    { id: 'C-027', name: 'Fernando Santos', riskScore: 61, country: 'PT', isPep: false },
    { id: 'C-028', name: 'Nina Bergström', riskScore: 40, country: 'SE', isPep: false },
    { id: 'C-029', name: 'Marcus Johansson', riskScore: 46, country: 'SE', isPep: false },
    { id: 'C-030', name: 'Fatima Al-Zahra', riskScore: 73, country: 'AE', isPep: true },
    { id: 'C-031', name: 'Robert Taylor', riskScore: 34, country: 'US', isPep: false },
    { id: 'C-032', name: 'Mei Lin', riskScore: 56, country: 'TW', isPep: false },
    { id: 'C-033', name: 'Diego Martinez', riskScore: 50, country: 'AR', isPep: false },
    { id: 'C-034', name: 'Chloe Dubois', riskScore: 48, country: 'FR', isPep: false },
    { id: 'C-035', name: 'Oliver Schmidt', riskScore: 37, country: 'DE', isPep: false },
    { id: 'C-036', name: 'Isabella Rossi', riskScore: 51, country: 'IT', isPep: false },
    { id: 'C-037', name: 'Hiroshi Yamamoto', riskScore: 63, country: 'JP', isPep: false },
    { id: 'C-038', name: 'Amanda Lee', riskScore: 29, country: 'SG', isPep: false },
    { id: 'C-039', name: 'Ricardo Fernandez', riskScore: 60, country: 'CO', isPep: false },
    { id: 'C-040', name: 'Katarina Novak', riskScore: 53, country: 'RS', isPep: false },
    { id: 'C-041', name: 'Viktor Ivanov', riskScore: 69, country: 'BG', isPep: true },
    { id: 'C-042', name: 'Aisha Mohammed', riskScore: 72, country: 'KE', isPep: true },
    { id: 'C-043', name: 'Lucas Andersen', riskScore: 32, country: 'DK', isPep: false },
    { id: 'C-044', name: 'Zara Khan', riskScore: 65, country: 'BD', isPep: false },
    { id: 'C-045', name: 'Sebastian Larsson', riskScore: 41, country: 'SE', isPep: false },
    { id: 'C-046', name: 'Anastasia Volkov', riskScore: 67, country: 'UA', isPep: true },
    { id: 'C-047', name: 'Daniel Torres', riskScore: 39, country: 'CL', isPep: false },
    { id: 'C-048', name: 'Sofia Hernandez', riskScore: 44, country: 'VE', isPep: false },
    { id: 'C-049', name: 'Chen Wei', riskScore: 58, country: 'HK', isPep: false },
    { id: 'C-050', name: 'Alexander Volkov', riskScore: 75, country: 'RU', isPep: true },
    { id: 'C-051', name: 'Mia Johansson', riskScore: 30, country: 'NO', isPep: false },
    { id: 'C-052', name: 'Ethan Martinez', riskScore: 35, country: 'PH', isPep: false },
    { id: 'C-053', name: 'Leila Abbas', riskScore: 70, country: 'IQ', isPep: true },
    { id: 'C-054', name: 'Nathan Brown', riskScore: 27, country: 'NZ', isPep: false },
    { id: 'C-055', name: 'Grace O\'Connor', riskScore: 46, country: 'IE', isPep: false },
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
    <div ref={containerRef} data-component="LegacyCustomerSearch" data-no-highlights className="legacy-customer-search p-4 bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 shadow-[inset_1px_1px_0_#808080,inset_-1px_-1px_0_#ffffff]">
      {/* 90's Windows-style title bar */}
      <div className="bg-[#000080] text-white px-2 py-1 mb-3 font-bold text-sm flex items-center">
        <span className="mr-2">🔍</span>
        Customer Search (Mock Embedded / Micro Frontend)
      </div>
      {/* 90's style input field */}
      <div className="mb-3">
        <label htmlFor="legacy-customer-search-input" className="block text-xs font-bold text-gray-800 mb-1">
          Search Customer:
        </label>
        <input
          id="legacy-customer-search-input"
          type="text"
          placeholder="Enter name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          className="w-full px-2 py-1.5 bg-white border-2 border-t-gray-400 border-l-gray-400 border-r-white border-b-white shadow-[inset_2px_2px_0_#000000] text-sm font-mono focus:outline-none focus:border-t-blue-700 focus:border-l-blue-700"
          aria-label="Search for customer by name or ID"
        />
      </div>
      {/* 90's style button */}
      <button
        onClick={handleSearch}
        className="w-full mb-3 px-3 py-2 bg-[#C0C0C0] border-2 border-t-white border-l-white border-r-gray-600 border-b-gray-600 text-sm font-bold text-gray-900 shadow-[2px_2px_0_#000000] active:shadow-[inset_1px_1px_0_#000000] active:border-t-gray-600 active:border-l-gray-600 active:border-r-white active:border-b-white hover:bg-[#D4D0C8]"
        aria-label="Search for customers"
      >
        [ Search ]
      </button>
      {/* 90's style list box with scrollbar */}
      <div className="legacy-scrollable bg-white border-2 border-t-gray-400 border-l-gray-400 border-r-white border-b-white p-1 shadow-[inset_2px_2px_0_#000000] max-h-64 overflow-y-auto">
        <div className="space-y-1">
          {filteredCustomers.length === 0 ? (
            <div className="p-2 text-xs text-gray-500 font-mono">No customers found</div>
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => handleCustomerClick(customer)}
                className={`px-2 py-1.5 cursor-pointer text-xs font-mono border border-dashed ${
                  selectedCustomerId === customer.id
                    ? 'bg-[#000080] text-white border-blue-300'
                    : 'bg-white text-black border-gray-300 hover:bg-[#E8E8E8]'
                }`}
              >
                <div className="font-bold">{customer.name}</div>
                <div className={selectedCustomerId === customer.id ? 'text-blue-200' : 'text-gray-600'}>
                  ID: {customer.id}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

