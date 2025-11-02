import { useEffect, useRef } from 'react';
import { LegacyCustomerSearch, type Customer } from '../legacy/LegacyCustomerSearch';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
}

/**
 * Customer Search - Reusable Component with Minimal Business Logic
 * 
 * This component wraps the embedded legacy customer search and converts
 * its event-based communication to modern React callback patterns.
 * 
 * Located in /components (despite having business logic) because:
 * - It's a reusable utility that other parts of the app can use
 * - The business logic is minimal (event bridging) and self-contained
 * - It provides a clean API that hides the legacy implementation details
 * - Organizational clarity: developers know "this is a component I can use"
 * 
 * This demonstrates:
 * 1. Isolating legacy components that use event-based communication
 * 2. Bridging between legacy event system and modern React patterns
 * 3. Practical organization: sometimes reusable utilities with minimal logic
 *    belong in components for discoverability and ease of use
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

