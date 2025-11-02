import { useEffect, useRef } from 'react';
import { LegacyCustomerSearch, type Customer } from './LegacyCustomerSearch';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
}

/**
 * Customer Search - Business Logic Wrapper
 * 
 * This component wraps the embedded legacy customer search and converts
 * its event-based communication to modern React callback patterns.
 * This demonstrates how to:
 * 1. Isolate legacy components that use event-based communication
 * 2. Bridge between legacy event system and modern React patterns
 * 3. Keep business logic separate from the legacy component itself
 */
export function CustomerSearch({ onCustomerSelect }: CustomerSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Listen for the legacy component's custom event
    const handleCustomerSelect = (event: Event) => {
      const customEvent = event as CustomEvent<Customer>;
      if (customEvent.detail) {
        // Convert event to modern callback
        onCustomerSelect(customEvent.detail);
      }
    };

    container.addEventListener('customer:select', handleCustomerSelect);

    // Cleanup
    return () => {
      container.removeEventListener('customer:select', handleCustomerSelect);
    };
  }, [onCustomerSelect]);

  return (
    <div ref={containerRef}>
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Customer Search (Embedded)</h2>
        <LegacyCustomerSearch />
      </div>
    </div>
  );
}

