# 🚶 Codebase Walkthrough: Payments Operations Dashboard

## Overview

This walkthrough explains the Payments Operations Dashboard architecture by starting at the entry point and moving through each layer, explaining **why** each design decision was made and how it supports the Single Responsibility Principle.

**The Problem We're Solving:** How do we let different stakeholders (CFO, COO, CTO, Designers, Product Managers) change different parts of the system without breaking each other's work?

**The Solution:** Separate concerns by **reason for change** - each part of the codebase responds to a different stakeholder's needs.

---

## Walkthrough Order

### 1. Entry Point: Application Bootstrap (`main.tsx`)

**Why start here:** This is where the app initializes - it sets up the foundation that everything else builds upon.

```1:27:src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import './index.css';
import { routes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/* <ReactQueryDevtools /> */}
    </QueryClientProvider>
  </StrictMode>
);
```

**Key decisions:**

- **QueryClient configuration (5-minute stale time, no refetch on focus)**: This is a dashboard application, not a real-time trading system. Data doesn't need to be fresh every second. This configuration prevents unnecessary API calls and improves performance.
- **Router setup**: Routing is a navigation concern, completely separate from business logic. Changes to routes don't affect how transactions are fetched or KYC rules are evaluated.
- **StrictMode**: React development checks are enabled to catch potential issues early. This is development-only and doesn't affect production.

**Design principle:** Infrastructure concerns (routing, data fetching framework) are separate from business logic. The CTO can change how we fetch data (switch from TanStack Query to another library) without affecting business rules.

---

### 2. Routing Layer (`routes.tsx`)

**Why next:** Routing is a navigation concern, not a business concern. It's simple infrastructure that connects URLs to views.

```1:17:src/routes.tsx
import type { RouteObject } from 'react-router-dom';
import { PaymentsOpsDashboard } from './views/dashboard/PaymentsOpsDashboard';

export const routes: RouteObject[] = [
  {
    path: '/',
    Component: () => <PaymentsOpsDashboard view="view1" />,
  },
  {
    path: '/view1',
    Component: () => <PaymentsOpsDashboard view="view1" />,
  },
  {
    path: '/view2',
    Component: () => <PaymentsOpsDashboard view="view2" />,
  },
];
```

**Key decisions:**

- **Route definitions are simple**: They just compose views - no business logic, no state management, no API calls.
- **Views receive props (like `view="view1"`)**: Routing doesn't know about feature flags or business rules. It just passes navigation state.
- **Why this matters**: Navigation changes (new routes, route parameters) don't affect business logic. Product can change URLs without touching KYC rules or transaction fetching.

**Design principle:** Navigation is a separate concern from business rules. Adding a new route doesn't require changing how KYC decisions are made.

---

### 3. State Management Foundation (`state/featureFlags.ts`)

**Why before views:** Views depend on this, but it's independent infrastructure - global configuration that multiple parts of the app need.

```1:24:src/state/featureFlags.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeatureFlags {
  kycVersion: 'v1' | 'v2'; // Internal - controls which KYC rules to use
  showComponentOutlines: boolean;
  setKycVersion: (version: 'v1' | 'v2') => void;
  setShowComponentOutlines: (show: boolean) => void;
}

export const useFeatureFlags = create<FeatureFlags>()(
  persist(
    (set) => ({
      kycVersion: 'v1',
      showComponentOutlines: false,
      setKycVersion: (version) => set({ kycVersion: version }),
      setShowComponentOutlines: (show) => set({ showComponentOutlines: show }),
    }),
    {
      name: 'feature-flags-storage', // localStorage key
    }
  )
);
```

**Key decisions:**

- **Zustand store with persistence**: Feature flags need to persist across page refreshes. localStorage is simple and sufficient - no need for a complex state management solution.
- **Simple interface**: Just getters and setters. No complex state machines or reducers needed for configuration.
- **Used by multiple views**: Feature flags affect the entire app (which KYC version, which layout, debug mode). This is global state, not view-specific.

**Design principle:** Global configuration (feature flags) is separate from view-specific state. The COO can change rollout strategy (which version to use) without affecting individual views. This is **deployment strategy**, not business logic.

---

### 4. Business Rules: Pure Logic (`logic/kycRules.v1.ts`, `kycRules.v2.ts`)

**Why before views:** These are the "brains" - pure business rules that views will use. They're the most important part to understand because they contain the actual business logic.

```1:50:src/logic/kycRules.v1.ts
export type KycDecision = 'approve' | 'manual_review' | 'deny';

// Base input fields for v1 (without discriminator)
export interface KycInputBase {
  riskScore: number;
  country: string;
  amount?: number;
}

// Discriminated union type for v1
export interface KycInput extends KycInputBase {
  version: 'v1';
}

export interface KycResult {
  decision: KycDecision;
  reasons: string[];
}

/**
 * KYC Rules v1 - Simple rule-based evaluation
 * - riskScore >= 80 => deny
 * - riskScore 50-79 => manual_review
 * - Certain countries => deny
 */
export function evaluateKycV1(input: KycInput): KycResult {
  const reasons: string[] = [];
  let decision: KycDecision = 'approve';

  // High risk score threshold
  if (input.riskScore >= 80) {
    decision = 'deny';
    reasons.push('Risk score 80+');
    return { decision, reasons };
  }

  // Medium risk score threshold
  if (input.riskScore >= 50 && input.riskScore < 80) {
    decision = 'manual_review';
    reasons.push('Risk score 50-79');
  }

  // Country-based restrictions
  const restrictedCountries = ['XX', 'YY', 'ZZ']; // Placeholder countries
  if (restrictedCountries.includes(input.country)) {
    decision = 'deny';
    reasons.push(`Restricted country: ${input.country}`);
    return { decision, reasons };
  }

  return { decision, reasons };
}
```

**Key decisions:**

- **Pure functions**: No React, no side effects, no dependencies on UI. These functions take input and return output - that's it.
- **Testable in isolation**: You can test KYC rules without rendering React components, mocking APIs, or setting up a browser environment.
- **Versioned (v1/v2)**: We can have multiple rule versions running simultaneously. This allows gradual rollout and A/B testing.
- **No UI dependencies**: The CFO can change risk thresholds without knowing anything about React, components, or the UI.

**Design principle:** Business rules are independent of UI framework - they can be changed by business stakeholders without touching components. This is **the core of the Single Responsibility Principle**: rules change for business reasons, not technical reasons.

**Who changes this:** CFO (or compliance team) - they define risk thresholds and country restrictions.

---

### 5. Business Logic Hook (`logic/useKycEngine.ts`)

**Why here:** This bridges pure rules to React, but keeps selection logic separate from rule evaluation.

```1:52:src/logic/useKycEngine.ts
import { useMemo } from 'react';
import { useFeatureFlags } from '../state/featureFlags';
import { evaluateKycV1, type KycInput as KycInputV1, type KycInputBase, type KycResult } from './kycRules.v1';
import { evaluateKycV2, type KycInputV2, type KycInputV2Base } from './kycRules.v2';

// Discriminated union type for all KYC inputs
export type KycInput = KycInputV1 | KycInputV2;

// Input type that callers provide (without version discriminator)
// The hook will automatically add the version based on feature flags
export type KycInputWithoutVersion = KycInputBase & Partial<KycInputV2Base>;

export interface UseKycEngine {
  evaluate: (input: KycInputWithoutVersion) => KycResult;
  version: 'v1' | 'v2';
}

/**
 * Custom hook that selects the appropriate KYC rule version based on feature flag
 * and exposes an evaluate method that uses the correct rules.
 * 
 * The hook automatically adds the version discriminator to the input based on
 * the current feature flag, allowing TypeScript to properly narrow the types.
 */
export function useKycEngine(): UseKycEngine {
  const { kycVersion } = useFeatureFlags();

  const evaluate = useMemo(() => {
    return (input: KycInputWithoutVersion): KycResult => {
      // Add version discriminator based on feature flag
      if (kycVersion === 'v2') {
        const inputWithVersion: KycInputV2 = {
          ...input,
          version: 'v2',
        };
        return evaluateKycV2(inputWithVersion);
      }
      
      const inputWithVersion: KycInputV1 = {
        ...input,
        version: 'v1',
      };
      return evaluateKycV1(inputWithVersion);
    };
  }, [kycVersion]);

  return {
    evaluate,
    version: kycVersion,
  };
}
```

**Key decisions:**

- **Hook selects version based on feature flag**: This is **deployment strategy logic**, not business logic. The hook doesn't know how to evaluate KYC - it just selects which rule file to use.
- **Type-safe discriminated unions**: TypeScript ensures we can't mix v1 and v2 inputs. The hook automatically adds the version discriminator.
- **Single responsibility**: Version selection, not rule evaluation. The rules do the evaluation; this hook just routes to the right version.

**Design principle:** Feature flag logic is separate from rule evaluation - COO can change rollout strategy (gradual rollout, A/B testing, canary releases) without touching the actual rules. This is **deployment strategy**, not business logic.

**Who changes this:** COO (or DevOps) - they control which version is active during rollout.

---

### 6. Data Layer (`api/transactionsApi.ts`)

**Why before views:** Views depend on this, but it's infrastructure - how we communicate with external systems.

```1:57:src/api/transactionsApi.ts
export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  currency: string;
  type: 'payment' | 'refund' | 'chargeback';
  status: 'completed' | 'pending' | 'failed';
  date: string;
  description?: string;
}

export interface TransactionFilters {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Fetch transactions from API
 * Uses MSW for mocking in tests
 */
export async function fetchTransactions(
  filters: TransactionFilters = {}
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  
  if (filters.customerId) params.append('customerId', filters.customerId);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.append('dateTo', filters.dateTo);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const response = await fetch(`/api/transactions?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  return response.json();
}
```

**Key decisions:**

- **Simple fetch functions**: No complex abstractions, no magic. Just functions that call APIs and return data.
- **MSW-compatible**: These functions work with Mock Service Worker for testing. We can test the entire app without hitting real APIs.
- **Type definitions exported**: Types are shared between API layer and views. This ensures type safety across the boundary.

**Design principle:** API communication is separate from business logic - CTO can change API strategy (REST to GraphQL, add caching, change endpoints) without affecting KYC rules or UI components.

**Who changes this:** CTO (or backend team) - they control API contracts and infrastructure.

---

### 7. UI Components: Pure Presentation (`views/dashboard/components/`)

**Why before views:** These are the "zombies" - pure UI that views will compose. They're the most numerous components in the system.

#### CustomerDetailsPanel.tsx

```1:110:src/views/dashboard/components/CustomerDetailsPanel.tsx
import { KycDecisionBadge } from './KycDecisionBadge';
import type { KycResult } from '../../../logic/kycRules.v1';
import type { Customer } from '../../../legacy/LegacyCustomerSearch';

interface CustomerDetailsPanelProps {
  customer: Customer | null;
  kycResult: KycResult | null;
  kycVersion: 'v1' | 'v2';
  isProcessing?: boolean;
  onApprove?: () => void;
  onRequestDocs?: () => void;
  onHold?: () => void;
}

/**
 * UI Component: Displays customer details and KYC decision with action buttons
 * Pure presentation component - all business logic handled at page level
 */
export function CustomerDetailsPanel({
  customer,
  kycResult,
  kycVersion,
  isProcessing = false,
  onApprove,
  onRequestDocs,
  onHold,
}: CustomerDetailsPanelProps) {
  if (!customer) {
    return (
      <section className="p-6 bg-white rounded-lg border border-gray-200" aria-labelledby="kyc-decision-heading">
        <h2 id="kyc-decision-heading" className="text-lg font-semibold mb-4 text-gray-700">KYC Decision</h2>
        <p className="text-gray-600">Select a customer to view KYC decision</p>
      </section>
    );
  }

  // Visual styling based on KYC version
  const versionStyles = kycVersion === 'v1' 
    ? 'bg-blue-50 border-blue-300' 
    : 'bg-purple-50 border-purple-300';

  return (
    <section 
      className={`p-6 rounded-lg border-2 transition-colors ${versionStyles}`}
      aria-labelledby="kyc-decision-heading"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 id="kyc-decision-heading" className="text-lg font-semibold">KYC Decision</h2>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          kycVersion === 'v1' 
            ? 'bg-blue-600 text-white' 
            : 'bg-purple-600 text-white'
        }`}>
          {kycVersion.toUpperCase()}
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">{customer.name}</span>
            {kycResult && <KycDecisionBadge decision={kycResult.decision} />}
          </div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>ID {customer.id}</div>
            <div>Risk Score {customer.riskScore}</div>
            <div>Country {customer.country}</div>
          </div>
        </div>

        {kycResult && kycResult.reasons.length > 0 && (
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">Reasons</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              {kycResult.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={onRequestDocs}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Request Docs
            </button>
            <button
              onClick={onHold}
              disabled={isProcessing}
              className="col-span-2 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Hold
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
```

**Key decisions:**

- **Receives all data via props**: No API calls, no state management, no business logic. Just receives data and displays it.
- **Callbacks for actions**: `onApprove`, `onRequestDocs`, `onHold` - the component doesn't know what these do, it just calls them.
- **Why they're in `/components`**: Feature-specific, but reusable within the dashboard. They're co-located with the dashboard feature for easier discovery.
- **Why no business logic**: They're testable (just render with props), predictable (same props = same output), and can be changed by designers without affecting rules.

**Design principle:** UI components are separate from business logic - designers/UI developers can change appearance, layout, colors, spacing without touching rules or APIs.

**Who changes this:** Designers, UI developers - they control how things look.

**Other components to note:**

- **`TransactionsTable.tsx`**: Pure table rendering - just displays an array of transactions
- **`KycDecisionBadge.tsx`**: Just displays a badge - receives a decision string, returns colored badge
- **`FilterPanel.tsx`**: Form UI only - form state is presentation, not business logic. The business logic (what filters mean) lives in the view.

---

### 8. Legacy Integration Pattern (`legacy/LegacyCustomerSearch.tsx` + `CustomerSearch.tsx`)

**Why here:** Shows how to integrate external systems cleanly - a common real-world requirement.

The legacy component dispatches custom events:

```typescript
// Legacy component dispatches events
dispatchEvent(new CustomEvent('customer:select', { detail: customer }));
```

The wrapper component (`CustomerSearch.tsx`) bridges events to React:

```typescript
// CustomerSearch component listens and converts to React
useEffect(() => {
  const handler = (e: CustomEvent) => onCustomerSelect(e.detail);
  container.addEventListener('customer:select', handler);
  return () => container.removeEventListener('customer:select', handler);
}, [onCustomerSelect]);
```

**Key decisions:**

- **Legacy component uses custom events**: Event-based communication is how many legacy systems work (micro-frontends, iframes, etc.)
- **Wrapper component bridges events to React**: This isolation layer means the rest of the app doesn't need to know about custom events
- **Separation**: Legacy is isolated - it can be replaced without affecting the rest of the app

**Design principle:** Legacy systems are isolated - integration is a separate concern. The legacy component can be replaced with a modern React component without changing the rest of the app.

**Who changes this:** Integration team - they handle connecting external systems.

---

### 9. View Layer: Orchestration (`views/dashboard/PaymentsOpsDashboard.tsx`)

**Why here:** This is where everything comes together - the "brain boundary." This is the most complex file, but it's **orchestration**, not business rules.

```54:69:src/views/dashboard/PaymentsOpsDashboard.tsx
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
```

```71:83:src/views/dashboard/PaymentsOpsDashboard.tsx
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
```

```124:160:src/views/dashboard/PaymentsOpsDashboard.tsx
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
```

**Key decisions:**

- **State management (customer, filters)**: Why here, not in components? Because multiple components need this state. The view is the coordination point.
- **KYC evaluation orchestration**: The view calls `useKycEngine().evaluate()` - it doesn't contain the rules, it just coordinates the evaluation.
- **API calls via TanStack Query**: Data fetching is orchestrated here - the view knows when to fetch (when customer changes, when filters change).
- **Optimistic updates**: Side effects are managed here - the view knows how to update the UI optimistically and rollback on error.
- **Props distribution**: Views pass data down to components - this is the "brain boundary" where logic meets UI.

**Design principle:** Views are application-specific compositions - they orchestrate but don't contain business rules (those live in `/logic`). This is **workflow orchestration**, not business logic.

**Who changes this:** Product Managers - they define workflows and user journeys.

**What this file does NOT contain:**
- ❌ KYC rule evaluation logic (that's in `kycRules.v1.ts` / `kycRules.v2.ts`)
- ❌ API endpoint definitions (that's in `transactionsApi.ts`)
- ❌ Complex UI rendering (that's in components)
- ❌ Feature flag logic (that's in `useKycEngine.ts`)

**What this file DOES contain:**
- ✅ State coordination (customer, filters)
- ✅ Workflow orchestration (when to evaluate KYC, when to fetch transactions)
- ✅ Side effect management (optimistic updates, error handling)
- ✅ Props distribution (passing data to components)

---

### 10. Layout Views: Composition (`DashboardLayoutV1.tsx`, `DashboardLayoutV2.tsx`)

**Why last:** These are pure composition - they arrange components but don't add logic.

**Key decisions:**

- **Why they're separate from main dashboard**: Layout changes don't affect orchestration. You can change from 3-column to vertical stack without touching business logic.
- **Why they're views**: Application-specific, not reusable. They're specific to this dashboard.
- **Why minimal logic**: Just prop passing and layout structure. No business logic, no state management.

**Design principle:** Layout is separate from business logic - designers can change layouts (3-column, vertical stack, grid, etc.) without affecting functionality.

**Who changes this:** Designers, UI developers - they control layout and visual structure.

---

### 11. Build-Time Enhancements (`vite-plugin-component-attributes.ts`)

**Why last:** This is a tooling concern that enhances the codebase without changing its structure.

**Key decisions:**

- **Why automatic attribute injection**: Reduces manual work - developers don't need to add `data-component` attributes manually
- **Why Babel AST parsing**: Build-time analysis allows us to understand the code structure and inject attributes intelligently
- **Why `data-component` and `data-business-logic`**: Visual debugging - see which components are UI vs business logic in the browser

**Design principle:** Tooling supports the architecture without changing code structure. This is **developer experience**, not business logic.

---

## Design Decision Flow

### Example: "How does a KYC decision get made?"

1. **User selects customer** → `CustomerSearch` (UI component - zombie)
   - Component just displays UI and calls `onCustomerSelect` callback

2. **Event flows up** → `PaymentsOpsDashboard` (view - brain boundary)
   - View receives customer selection, updates state

3. **View orchestrates** → calls `useKycEngine().evaluate()` (business logic hook)
   - View builds KYC input from customer data, calls hook

4. **Hook selects version** → reads feature flag, chooses v1 or v2 (configuration)
   - Hook doesn't know how to evaluate - it just selects which rule file to use

5. **Rules execute** → `kycRules.v1.ts` or `kycRules.v2.ts` (pure business rules)
   - Pure functions evaluate risk score, country, etc. No React, no UI.

6. **Result flows back** → view receives result, passes to `CustomerDetailsPanel` (UI component - zombie)
   - Component just displays the result - it doesn't know how it was calculated

**Why this flow:**

- **UI doesn't know about rules** (zombie) - Designer can change how the result is displayed without touching rules
- **View orchestrates but doesn't contain rules** (brain boundary) - Product can change workflow without touching rules
- **Rules are pure and testable** (brain) - CFO can change thresholds without touching UI
- **Feature flags control version selection** (configuration) - COO can change rollout strategy without touching rules

**Navigation path:** View → Hook → Rules (2-3 clicks, compliant with 3-Click Brain Rule)

---

### Example: "Who changes what?"

- **CFO changes KYC rules** → Edit `kycRules.v1.ts` or `kycRules.v2.ts`
  - Pure functions, no React knowledge needed
  - Can be tested without UI
  - Can be changed by business analysts

- **COO changes rollout** → Edit `useKycEngine.ts` or feature flags
  - Deployment strategy, not business logic
  - Can change rollout percentage, A/B testing, canary releases

- **CTO changes API** → Edit `transactionsApi.ts`
  - Infrastructure concern
  - Can switch from REST to GraphQL, add caching, change endpoints

- **Designer changes UI** → Edit components in `/components`
  - Pure presentation
  - Can change colors, layout, spacing without affecting functionality

- **Product changes workflow** → Edit `PaymentsOpsDashboard.tsx`
  - Orchestration concern
  - Can change when KYC is evaluated, when transactions are fetched

**Why this works:** Each stakeholder can change their concern without affecting others. This is the **Single Responsibility Principle** in action - each module responds to one stakeholder's needs.

---

## Key Architectural Patterns

### 1. Separation of Concerns by Change Reason

- **Rules change for business reasons** → `/logic`
  - Risk thresholds, country restrictions, compliance rules
  - Changed by: CFO, Compliance Team

- **UI changes for design reasons** → `/components`
  - Colors, layout, spacing, visual design
  - Changed by: Designers, UI Developers

- **Orchestration changes for workflow reasons** → `/views`
  - When to evaluate KYC, when to fetch data, user journey
  - Changed by: Product Managers

- **API changes for infrastructure reasons** → `/api`
  - Endpoints, caching, data fetching strategy
  - Changed by: CTO, Backend Team

- **Configuration changes for deployment reasons** → `/state/featureFlags.ts`
  - Which version to use, rollout strategy
  - Changed by: COO, DevOps

### 2. Zombie React Architecture

- **Zombies (UI)**: Pure presentation, no business logic
  - Many zombies (7:1+ ratio)
  - Testable, predictable, reusable

- **Brains (Logic)**: Business rules, state, orchestration
  - Few brains
  - Centralized, testable, versioned

### 3. Feature Flag Pattern

- **Runtime switching** between versions
- **Rules versioned** (v1/v2)
- **Layouts versioned** (View1/View2)
- **Configuration drives selection**

This allows:
- Gradual rollout
- A/B testing
- Canary releases
- Easy rollback

### 4. Optimistic Updates

- **UI updates immediately** - Better UX
- **API calls happen async** - Non-blocking
- **Rollback on error** - Data consistency
- **Why**: Better UX, but managed carefully at the view layer

---

## Presentation Tips

1. **Start with the problem:** "How do we let different stakeholders change different parts without breaking each other?"

2. **Show the solution layer by layer:** Entry → Infrastructure → Rules → UI → Composition
   - Each layer has a clear responsibility
   - Each layer responds to a different stakeholder's needs

3. **Demonstrate the flow:** Pick a user action and trace it through the layers
   - Show how data flows: UI → View → Logic → Rules → Result → UI
   - Show how concerns are separated

4. **Explain the "why":** Each decision prevents a specific type of coupling
   - Rules separate from UI → CFO can change rules without breaking UI
   - API separate from rules → CTO can change API without affecting rules
   - Views orchestrate → Product can change workflow without touching rules

5. **Show the benefit:** Multiple people can work simultaneously without conflicts
   - CFO changes rules
   - Designer changes UI
   - Product changes workflow
   - All at the same time, no conflicts

---

## Summary

This architecture enables:

✅ **Independent development** - Different teams can work on different parts simultaneously  
✅ **Independent testing** - Rules can be tested without UI, UI can be tested without rules  
✅ **Independent deployment** - Can roll out new rules without redeploying UI  
✅ **Independent changes** - Stakeholders can change their concerns without affecting others  
✅ **Clear ownership** - Each file has a clear owner and reason for change  

**The key insight:** Separate code by **reason for change**, not by technical layer. Each part of the codebase responds to a different stakeholder's needs.

---

**Related Documentation:**
- [Codebase Map](./CODEBASE_MAP.md) - Visual navigation guide
- [Architecture Explanation](./ZOMBIE_ARCHITECTURE_EXPLANATION.md) - Deep dive into rules
- [Quick Reference](./QUICK_REFERENCE.md) - Fast lookup for patterns

