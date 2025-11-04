# 🗺️ Codebase Map - Payments Operations Dashboard

A visual guide to navigating the codebase according to Zombie React Architecture principles.

## 📁 Directory Structure

```
src/
│
├── api/                          # 🌐 Data Layer (External Communication)
│   ├── transactionsApi.ts       # Transaction fetching & KYC actions
│   └── __tests__/
│
├── components/                    # 🟢 Global Zombies (Reusable UI)
│   └── FeatureFlagsPanel.tsx     # Feature flag management UI
│
├── legacy/                        # 🔌 Legacy Integration
│   └── LegacyCustomerSearch.tsx  # Event-based legacy component
│
├── logic/                         # 🧠 Brains (Business Rules)
│   ├── kycRules.v1.ts           # KYC decision rules (simple)
│   ├── kycRules.v2.ts           # KYC decision rules (enhanced)
│   ├── useKycEngine.ts          # Hook: selects rule version
│   └── __tests__/
│
├── state/                         # 🧠 Brain State (Global)
│   ├── featureFlags.ts          # Zustand store for feature flags
│   └── __tests__/
│
└── views/                         # 🧠 Brain Boundaries (Feature Orchestration)
    └── dashboard/                # Dashboard Feature
        ├── components/           # 🟢 Feature Zombies (Dashboard UI)
        │   ├── CustomerDetailsPanel.tsx
        │   ├── CustomerSearch.tsx
        │   ├── FilterPanel.tsx
        │   ├── KycDecisionBadge.tsx
        │   └── TransactionsTable.tsx
        │
        ├── PaymentsOpsDashboard.tsx   # 🧠 MAIN BRAIN BOUNDARY
        ├── DashboardLayoutV1.tsx      # Layout view (composition)
        ├── DashboardLayoutV2.tsx      # Layout view (composition)
        └── __tests__/
```

## 🎯 Feature: Dashboard

### Brain Boundary
**File**: `src/views/dashboard/PaymentsOpsDashboard.tsx`

**Responsibilities**:
- ✅ State management (customer, filters, processing state)
- ✅ API orchestration (transactions fetching)
- ✅ Business logic coordination (KYC evaluation)
- ✅ Side effects (optimistic updates, refetching)
- ✅ Props distribution to children

**What it does NOT do**:
- ❌ Render complex UI (delegates to layout views)
- ❌ Contain business rules (uses `useKycEngine`)
- ❌ Direct data fetching (uses `useQuery`)

### Zombies (UI Components)

#### `CustomerDetailsPanel.tsx` 🟢
- **Type**: Pure zombie
- **Props**: `customer`, `kycResult`, `kycVersion`, `isProcessing`, callbacks
- **Logic**: None - pure render
- **3-Click Path**: View → Component (1 click)

#### `TransactionsTable.tsx` 🟢
- **Type**: Pure zombie
- **Props**: `transactions[]`, `isLoading`
- **Logic**: None - pure render + formatting helpers
- **3-Click Path**: View → Component (1 click)

#### `FilterPanel.tsx` 🟢
- **Type**: Pure zombie (form UI)
- **Props**: `onSubmit`, `defaultValues`
- **Logic**: Form state only (React Hook Form) - no business rules
- **3-Click Path**: View → Component (1 click)

#### `KycDecisionBadge.tsx` 🟢
- **Type**: Pure zombie
- **Props**: `decision`
- **Logic**: None - pure render
- **3-Click Path**: View → Component (1 click)

#### `CustomerSearch.tsx` 🟡
- **Type**: Zombie with minimal integration logic
- **Props**: `onCustomerSelect`
- **Logic**: Event bridging (legacy → React) - justified exception
- **3-Click Path**: View → Component (1 click)

### Brains (Logic Files)

#### `useKycEngine.ts` 🧠
- **Type**: Brain hook
- **Purpose**: Selects KYC rule version based on feature flag
- **3-Click Path**: View → useKycEngine → kycRules.v1/v2 (2 clicks)

#### `kycRules.v1.ts` 🧠
- **Type**: Pure brain (domain rules)
- **Purpose**: Simple KYC decision rules
- **Testable**: Yes (no React dependencies)

#### `kycRules.v2.ts` 🧠
- **Type**: Pure brain (domain rules)
- **Purpose**: Enhanced KYC decision rules
- **Testable**: Yes (no React dependencies)

#### `featureFlags.ts` 🧠
- **Type**: Brain state (global store)
- **Purpose**: Feature flag management with persistence
- **Used by**: Dashboard view, FeatureFlagsPanel, useKycEngine

#### `transactionsApi.ts` 🌐
- **Type**: Data layer
- **Purpose**: Transaction fetching & KYC actions
- **3-Click Path**: View → transactionsApi (1 click)

## 🔄 Data Flow Diagrams

### KYC Decision Flow

```
User selects customer
    ↓
CustomerSearch (zombie) → onCustomerSelect callback
    ↓
PaymentsOpsDashboard (brain) → setSelectedCustomer
    ↓
PaymentsOpsDashboard → useKycEngine.evaluate()
    ↓
useKycEngine → kycRules.v1/v2 (based on flag)
    ↓
kycResult → CustomerDetailsPanel (zombie) via props
```

**Clicks**: 3 (View → Engine → Rules)

### Transaction Filtering Flow

```
User submits filters
    ↓
FilterPanel (zombie) → onSubmit callback
    ↓
PaymentsOpsDashboard (brain) → setFilters
    ↓
PaymentsOpsDashboard → useQuery refetches
    ↓
transactionsApi.ts → fetchTransactions
    ↓
Transactions data → TransactionsTable (zombie) via props
```

**Clicks**: 3 (View → Query → API)

### KYC Action Flow

```
User clicks "Approve"
    ↓
CustomerDetailsPanel (zombie) → onApprove callback
    ↓
PaymentsOpsDashboard (brain) → handleApproveKyc
    ↓
PaymentsOpsDashboard → optimistic update + approveKycDecision()
    ↓
transactionsApi.ts → API call
    ↓
PaymentsOpsDashboard → refetchTransactions
    ↓
Updated data → TransactionsTable (zombie) via props
```

**Clicks**: 3 (Zombie → Brain → API)

## 🧭 Navigation Guide

### "Where does the KYC decision logic live?"

1. Start: `PaymentsOpsDashboard.tsx` (line 54-69)
2. Click: `useKycEngine()` → opens `logic/useKycEngine.ts`
3. Click: `evaluateKycV1/V2()` → opens `logic/kycRules.v1.ts` or `kycRules.v2.ts`

**✅ 2-3 clicks** - Compliant!

### "Where does the transaction table render?"

1. Start: `PaymentsOpsDashboard.tsx` (line 314)
2. Click: `TransactionsTable` → opens `views/dashboard/components/TransactionsTable.tsx`

**✅ 1 click** - Excellent!

### "Where is the customer selection handled?"

1. Start: `PaymentsOpsDashboard.tsx` (line 85-88)
2. Click: `handleCustomerSelect` → see implementation in same file

**✅ 0 clicks** (same file) - Excellent!

### "Where is the filter state managed?"

1. Start: `PaymentsOpsDashboard.tsx` (line 32-35)
2. Click: `filters` state → see `useState` declaration
3. Click: `handleFilterSubmit` → see handler (same file)

**✅ 0-1 clicks** - Excellent!

## 🎨 Color Coding Legend

- 🟢 **Green (Skin)**: Pure UI components (zombies)
- 🧠 **Pink (Brains)**: Logic, state, orchestration
- 🌐 **Blue**: Data layer (API, external communication)
- 🔌 **Orange**: Legacy/external integration

## 📊 Component Classification

### Pure Zombies (🟢)
- ✅ `CustomerDetailsPanel.tsx`
- ✅ `TransactionsTable.tsx`
- ✅ `FilterPanel.tsx` (form UI only)
- ✅ `KycDecisionBadge.tsx`
- ✅ `DashboardLayoutV1.tsx` (composition)
- ✅ `DashboardLayoutV2.tsx` (composition)

### Zombies with Minimal Logic (🟡)
- ⚠️ `CustomerSearch.tsx` (event bridging - justified)
- ⚠️ `FeatureFlagsPanel.tsx` (config UI - justified)

### Brain Boundaries (🧠)
- 🧠 `PaymentsOpsDashboard.tsx` (main orchestration)

### Pure Brains (🧠)
- 🧠 `useKycEngine.ts`
- 🧠 `kycRules.v1.ts`
- 🧠 `kycRules.v2.ts`
- 🧠 `featureFlags.ts`

### Data Layer (🌐)
- 🌐 `transactionsApi.ts`

## 🚦 Health Indicators

### ✅ Strengths
- Clear separation of concerns
- Pure UI components
- Centralized brain boundary
- Co-located feature code
- Purposeful file names
- Short navigation paths (≤ 3 clicks)

### ⚠️ Areas to Monitor
- Horde ratio (currently 1.6:1, but acceptable for orchestration view)
- Console.error usage (should be silenced)
- Consider splitting dashboard if it grows

## 🔗 Related Documentation

- [Zombie React Architecture Explanation](./ZOMBIE_ARCHITECTURE_EXPLANATION.md) - Detailed rule analysis
- [README.md](../README.md) - Project overview
- [ZOMBIE_ARCHITECTURE_REPORT.md](../ZOMBIE_ARCHITECTURE_REPORT.md) - Automated analysis report

