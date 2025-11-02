# Payments Operations Dashboard

A modern React + TypeScript application demonstrating modular architecture, feature flags, and best practices for separating UI components from business logic. This dashboard provides customer search, KYC (Know Your Customer) decisioning, risk scoring, and transaction management capabilities.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (or the next available port).

### Building for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Architecture

This project demonstrates a clean separation of concerns with the following directory structure:

```
src/
├── legacy/            # Legacy/external system components
├── api/               # API clients and data fetching
├── components/        # Global reusable components (feature flags, etc.)
├── logic/             # Business logic and rules
├── views/             # View-level composition (UI + logic integration)
│   └── dashboard/     # Dashboard feature
│       ├── components/ # Dashboard-specific components
│       └── *.tsx       # Dashboard views
└── state/             # Global state management
```

### Key Architectural Principles

1. **Separation of Concerns**: UI components are completely separate from business logic
2. **Legacy Integration Pattern**: Legacy/external components are wrapped in view components to bridge event-based communication
3. **Feature Flags**: Runtime switching between different versions of business logic and UI layouts
4. **Custom Hooks**: Business logic encapsulated in reusable hooks
5. **Component Attributes Plugin**: Automatic injection of `data-component` and `data-business-logic` attributes for debugging

## 🤔 Business Logic Placement Decisions

Understanding where business logic lives and why is crucial to the architecture. Here's a breakdown of the decisions made:

### Components (`/components`) - Mostly Pure Presentation

**Why mostly no business logic here?**
Components in `/components` are designed to be reusable, testable, and easy to reason about. They receive data via props and communicate via callbacks, with minimal knowledge of business rules or state management, and preferably none.

**Pure Presentation Examples:**
- **`CustomerDetailsPanel`**: Receives customer data and KYC result as props. No logic, just displays what it's told.
- **`TransactionsTable`**: Pure table rendering. No knowledge of filtering, sorting, or data fetching.
- **`KycDecisionBadge`**: Just displays a badge. Color and text come from props.

**Feature-Specific Organization:**
- **Dashboard Components** (`/views/dashboard/components/`): Co-located with dashboard views because:
  - They're specific to the dashboard feature
  - Easier to discover and maintain when grouped together
  - Clear ownership - these belong to the dashboard feature
  - Still reusable within the dashboard feature scope

**Global Components** (`/components/`):
- Components used across multiple features (e.g., `FeatureFlagsPanel`)
- Truly application-wide utilities

**Benefit**: Feature-specific components are easier to find and maintain. Global components remain discoverable in the root components directory.

### Views (`/views`) - UI + Logic Integration

**Why business logic here?**
Views are responsible for orchestrating multiple components, managing state, calling APIs, and applying business rules. They're application-specific compositions.

**Examples with clear business logic needs:**

1. **`PaymentsOpsDashboard`** - **Clear Need for Business Logic**
   - **Why**: Must orchestrate data flow between customer selection, KYC evaluation, and transaction fetching
   - **Contains**: 
     - State management (selected customer, filters, processing state)
     - KYC evaluation orchestration (calling `useKycEngine` with customer data)
     - API calls (transactions, KYC actions)
     - Side effects (refetching transactions after KYC actions)
   - **Couldn't be pure**: Needs to coordinate multiple concerns and manage side effects


2. **`DashboardLayoutV1` & `DashboardLayoutV2`** - **Minimal Logic, Mostly Composition**
   - **Why**: These are layout views that compose components together
   - **Contains**: Just prop passing and layout structure
   - **Note**: These could arguably be pure components, but they're views because:
     - They're application-specific (not reusable)
     - They compose multiple concerns (search, transactions, KYC)
     - They serve as view boundaries for feature flag switching

### Design Choices (Could Go Either Way)

**Feature Flags Implementation** - **Design Choice**

The feature flag panel could be implemented in different ways:

**Current Choice**: `FeatureFlagsPanel` in `/components` reads from Zustand store
- **Why in components**: It's just displaying state and calling setters - no business rules
- **Why not pure**: Uses `useFeatureFlags()` hook
- **Alternative**: Could be a view if it had complex logic (e.g., validation, side effects)
- **Decision**: Kept in components because it's primarily UI. The business logic (what flags mean) lives in `useKycEngine` and layout views.

**CustomerSearch** - **Practical Organization Choice**

`CustomerSearch` has minimal business logic (event bridging) but lives in `/components`:
- **Why in components**: It's a reusable utility - developers should know they can just use it
- **What it does**: Bridges legacy custom events to React callbacks, hides legacy implementation
- **Why not in views**: While it has logic, it's self-contained and meant to be reusable
- **Alternative**: Could be in views, but then developers might not discover it as easily
- **Decision**: Practical organization - `/components` means "things you can use", even if they have minimal logic

**Filter Panel** - **Design Choice**

`FilterPanel` uses React Hook Form but lives in `/components`:
- **Why in components**: Form state management is presentation concern, not business logic
- **What it does**: Validates form inputs, manages form state
- **What it doesn't do**: Doesn't know what filters mean or how they're used
- **Business logic lives**: In `PaymentsOpsDashboard` where filters are converted to API calls
- **Alternative**: Could be a view if filters needed complex business rules (e.g., "can't filter future dates")

### Logic Directory (`/logic`) - Pure Business Rules

**Why separate from views?**
Business rules should be:
- Testable in isolation (no React dependencies)
- Reusable across different views
- Version-controlled (v1 vs v2)
- Independent of UI framework

**Examples:**
- **`kycRules.v1` & `kycRules.v2`**: Pure functions that evaluate KYC decisions
- **`useKycEngine`**: Hook that selects which rule version to use (feature flag logic)

**Why not in views?**: Rules can be tested without rendering, can be shared across multiple views, and versioning allows gradual rollout.

### State Directory (`/state`) - Global State

**Why separate?**
- Shared across multiple views
- Needs persistence (localStorage)
- Feature flags affect multiple parts of the app

**Example:**
- **`featureFlags`**: Zustand store that multiple views read from (`PaymentsOpsDashboard`, `FeatureFlagsPanel`, `useKycEngine`)

### Summary of Decision Matrix

| Location | Contains Business Logic? | Reason | Could Be Different? |
|----------|------------------------|--------|---------------------|
| `/components` | ⚠️ Minimal | Mostly pure presentation, reusable utilities | CustomerSearch exception for practical organization |
| `/views` | ✅ Yes | Orchestration, state, side effects | Some could be simpler (layout views) |
| `/logic` | ✅ Pure Rules | Business rules, testable | No - rules must be separate |
| `/state` | ⚠️ Configuration | Feature flags, settings | Could be in logic, but persistence is state concern |

## 📁 Directory Structure

### `/legacy`
Legacy or external system components that use event-based communication:

- **`LegacyCustomerSearch.tsx`**: Simulated legacy micro-frontend component that dispatches custom events

### `/api`
- **`transactionsApi.ts`**: API client for fetching transactions and managing KYC decisions

### `/components`
Global reusable components:

- **`FeatureFlagsPanel.tsx`**: Floating panel for managing feature flags (shared across the app)

### `/views/dashboard/components`
Dashboard-specific components (grouped with dashboard views for organization):

- **`CustomerSearch.tsx`**: Wrapper that converts legacy event-based communication to React callbacks (minimal business logic, but reusable utility)
- **`CustomerDetailsPanel.tsx`**: Displays customer information and KYC decision with action buttons
- **`FilterPanel.tsx`**: Form for filtering transactions (date range, type, status)
- **`KycDecisionBadge.tsx`**: Badge component for displaying KYC decision status
- **`TransactionsTable.tsx`**: Table component for displaying transaction data

### `/logic`
Business logic and rules:

- **`kycRules.v1.ts`**: Simple KYC rule engine (risk score, country-based decisions)
- **`kycRules.v2.ts`**: Enhanced KYC rule engine (adds PEP checks, amount thresholds, velocity, sanctions)
- **`useKycEngine.ts`**: Custom hook that selects the appropriate KYC rule version based on feature flags

### `/views/dashboard`
Dashboard feature views that compose UI with business logic:

- **`PaymentsOpsDashboard.tsx`**: Main dashboard view orchestrating all components
- **`DashboardLayoutV1.tsx`**: Classic 3-column horizontal layout
- **`DashboardLayoutV2.tsx`**: Modern vertical stack layout

**Organization Note**: Dashboard components are co-located in `/views/dashboard/components/` because they're feature-specific. This makes it clear that these components belong to the dashboard feature and are easier to find and maintain together.

### `/state`
Global state management:

- **`featureFlags.ts`**: Zustand store for feature flags with localStorage persistence

## 🎯 Features

### Customer Search
- Integration with a simulated legacy micro-frontend component
- Event-based communication pattern
- Customer selection triggers KYC evaluation and transaction filtering

### KYC Decisioning
- Two rule engine versions (v1 and v2) that can be switched at runtime
- **v1 Rules**:
  - Risk score-based decisions (≥80 deny, 50-79 manual review)
  - Country-based restrictions
- **v2 Rules** (Enhanced):
  - All v1 rules plus:
  - PEP (Politically Exposed Person) checks
  - Amount thresholds
  - Transaction velocity checks
  - Sanctions list verification

### Transaction Management
- Filter by date range, type (payment/refund/chargeback), and status
- Real-time transaction list updates based on selected customer
- Loading states and empty states

### Feature Flags
Persisted feature flags (saved to localStorage) control:

1. **Dashboard View**: Switch between View 1 (3-column) and View 2 (vertical stack)
2. **KYC Engine Version**: Toggle between v1 and v2 rule engines
3. **Component Outlines**: Visual debugging tool to highlight UI vs business logic components

### Component Outlines
A visual debugging feature that displays:
- **Green outlines**: UI components (marked with `data-component`)
- **Pink outlines**: Business logic components (marked with `data-business-logic`)
- **Both**: Components that have both UI and business logic

## 🛠️ Technologies

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TanStack Query** - Data fetching, caching, and synchronization
- **Zustand** - Lightweight state management with persistence
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Tailwind CSS** - Utility-first CSS framework
- **Babel** - AST manipulation for build-time code injection

## 🔧 Custom Vite Plugin

The project includes a custom Vite plugin (`vite-plugin-component-attributes.ts`) that automatically injects attributes during build:

- **`data-component={componentName}`**: Added to the first JSX element of ALL components
- **`data-business-logic={filename}`**: Added only if the component uses hooks other than `useRef`, `useEffect`, or `useMemo`

This enables visual debugging of component boundaries and business logic placement.

## 🎨 UI Features

### Floating Feature Flags Panel
- Hover over the bottom-right corner to reveal the gear icon button
- Click to open/close the feature flags panel
- Panel stays visible when open
- Smooth animations and transitions

### Layout Switching
- **View 1**: Traditional 3-column layout (Customer Search | Transactions | KYC Decision)
- **View 2**: Vertical workflow layout (Search/Filters → Transactions → KYC Decision)

### Visual Indicators
- KYC version badges (v1/v2) displayed on decision panels
- Color-coded decision badges (approve/manual_review/deny)
- Loading states and empty states throughout

## 📝 Usage Examples

### Switching KYC Engine Versions
1. Hover over the bottom-right corner to reveal the gear icon
2. Click the gear icon to open the feature flags panel
3. Toggle between "v1" and "v2" KYC Engine Version
4. Select a customer to see how different rule engines affect the decision

### Viewing Component Outlines
1. Open the feature flags panel
2. Toggle "Show Component Outlines" to ON
3. Green outlines show UI components, pink outlines show business logic

### Testing Legacy Integration
1. Use the customer search component (left panel in View 1, top in View 2)
2. The legacy component (`LegacyCustomerSearch`) dispatches custom events
3. The `CustomerSearch` component listens to these events and converts them to React callbacks, demonstrating clean integration patterns

## 🧪 Development Notes

### Data Flow

1. User selects a customer → Legacy component dispatches event
2. CustomerSearch component catches event → Updates React state
3. Customer state changes → Triggers KYC evaluation via `useKycEngine`
4. KYC result updates → UI reflects new decision
5. Transactions refetch → Filtered by selected customer

### Feature Flag Persistence
Feature flags are automatically saved to localStorage with the key `feature-flags-storage`. Settings persist across page refreshes.

### Component Detection
The Vite plugin uses Babel AST parsing to:
- Detect React components (function declarations and arrow functions)
- Identify hook usage
- Find JSX return statements (handles multiple returns, early returns, fragments)
- Inject attributes without modifying source code manually

## 📚 Code Examples

### Using Feature Flags
```typescript
import { useFeatureFlags } from '../state/featureFlags';

const { kycVersion, view, setKycVersion } = useFeatureFlags();
```

### Using KYC Engine
```typescript
import { useKycEngine } from '../logic/useKycEngine';

const kycEngine = useKycEngine();
const result = kycEngine.evaluate({
  riskScore: 75,
  country: 'US',
  isPep: false,
  // ... other inputs
});
```

### Legacy Component Integration
```typescript
// Legacy component dispatches events
dispatchEvent(new CustomEvent('customer:select', { detail: customer }));

// CustomerSearch component listens and converts to React
useEffect(() => {
  const handler = (e: CustomEvent) => onCustomerSelect(e.detail);
  container.addEventListener('customer:select', handler);
  return () => container.removeEventListener('customer:select', handler);
}, [onCustomerSelect]);
```

## 🔍 Debugging

### React Query DevTools
The project includes React Query DevTools (currently commented out). Uncomment in `src/main.tsx` to enable:
```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// ...
<ReactQueryDevtools />
```

### Component Outlines
Enable component outlines in the feature flags panel to visually distinguish:
- Where UI components are rendered
- Where business logic is executed
- Component boundaries and data flow

## 📄 License

This project is a demonstration/example application.

## 🤝 Contributing

This is an educational example project demonstrating architectural patterns and best practices for React applications.
