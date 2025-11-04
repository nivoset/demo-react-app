# 🧟 Zombie React Architecture - Quick Reference

A quick reference guide for understanding and applying the Zombie React Architecture Canon.

## 🎯 Core Principles

```
Green = UI (Skin)    → Pure render, props-in/markup-out
Pink = Logic (Brains) → State, rules, effects, orchestration
```

## 📋 The 8 Rules

### 1. Start Undead
- ✅ Components begin as pure zombies (no brains)
- ✅ Add brains only when justified
- ❌ Don't start with hooks/state on day one

### 2. Horde Ratio
- **Target**: ≥ 7:1 UI components : Brain components
- **Signal**: If ratio drops, ask why
- **Structure**: One brain boundary per feature

### 3. 3-Click Brain Rule
- **Rule**: Must reach brain from view (or vice versa) in ≤ 3 jumps
- **Jumps**: Go to definition, find references, follow imports
- **Target**: 0-3 jumps = excellent, >3 = breach

### 4. Trial of the Three Strains
- **Process**: Design 3 distinct interface contracts
- **Test**: Against 3 different scenarios (happy, failure, async)
- **Document**: Record decision in ADR

### 5. No Tunnels
- **Avoid**: Prop drilling through 3+ layers
- **Prefer**: Explicit props from brain boundary
- **Context**: Use sparingly for deep trees with stable values

### 6. Coffin Rule (Co-location)
- **Principle**: Related code lives together
- **If**: Only used together → keep together
- **Split**: By responsibility, not ritual

### 7. No Unnamed Survivors
- **Bad**: `utils.ts`, `helpers.ts`, `common.ts`, `index.ts`
- **Good**: `useCustomerFilters.ts`, `applyRiskRules.ts`, `AccountCard.tsx`
- **Test**: Can you tell what's inside without opening it?

### 8. Silence the Living
- **No**: Console statements in production code
- **No**: Warnings in build/lint
- **Yes**: Document exceptions if you must break silence

## 🗺️ Navigation Patterns

### Finding Logic
```
View → Hook/Store → Logic File
(1-2 clicks)
```

### Finding UI
```
View → Component Import → Component File
(1-2 clicks)
```

### Tracing Data Flow
```
User Action → Component Callback → Brain Handler → API/Logic → State Update → Props → UI
```

## 📊 Component Classification

### 🟢 Zombies (UI)
- Pure render functions
- Props in, markup out
- No state, no effects, no API calls
- **Examples**: `CustomerDetailsPanel`, `TransactionsTable`

### 🧠 Brains (Logic)
- State management
- Business rules
- API orchestration
- Side effects
- **Examples**: `PaymentsOpsDashboard`, `useKycEngine`, `kycRules.v1`

### 🟡 Hybrid (Justified Exceptions)
- Minimal integration logic (event bridging)
- Configuration UI (feature flags)
- **Examples**: `CustomerSearch`, `FeatureFlagsPanel`

## 🎨 Directory Structure

```
src/
├── components/     # Global reusable zombies
├── logic/          # Pure brains (rules, hooks)
├── state/          # Brain state (stores)
└── views/          # Brain boundaries (orchestration)
    └── feature/    # Feature folder
        ├── components/  # Feature zombies
        └── FeatureView.tsx  # Brain boundary
```

## ✅ Checklist for New Features

- [ ] UI components are pure (start undead)
- [ ] Brain boundary orchestrates all logic
- [ ] Navigation paths are ≤ 3 clicks
- [ ] No prop drilling (explicit props)
- [ ] Related code co-located
- [ ] Files have purposeful names
- [ ] No console/warnings
- [ ] Horde ratio maintained (≥ 7:1)

## 🚨 Common Violations

### ❌ Starting with Brains
```tsx
// Bad: Component has brains on day one
function MyComponent() {
  const [data, setData] = useState();
  const { data: apiData } = useQuery(...);
  // ...
}
```

### ❌ Prop Drilling
```tsx
// Bad: Props passed through 4+ layers
<Parent value={value}>
  <Child value={value}>
    <GrandChild value={value}>
      <GreatGrandChild value={value} />
    </GrandChild>
  </Child>
</Parent>
```

### ❌ Generic File Names
```tsx
// Bad
utils.ts
helpers.ts
common.ts

// Good
useCustomerFilters.ts
applyRiskRules.ts
```

### ❌ Brains in Zombies
```tsx
// Bad: Zombie calling store directly
function CustomerCard() {
  const flags = useFeatureFlags(); // ❌ Brain in zombie
  // ...
}
```

## 📚 Documentation

- [Full Architecture Explanation](./ZOMBIE_ARCHITECTURE_EXPLANATION.md) - Detailed analysis
- [Codebase Map](./CODEBASE_MAP.md) - Navigation guide
- [ZOMBIE_ARCHITECTURE_REPORT.md](../ZOMBIE_ARCHITECTURE_REPORT.md) - Automated analysis

## 🛠️ Tools

Run architecture analysis:
```bash
npm run analyze:zombie
```

This generates `ZOMBIE_ARCHITECTURE_REPORT.md` with:
- Rule compliance status
- Violations and warnings
- Horde ratio calculations
- File classification

## 💡 Remember

> **A zombie doesn't plan. It obeys.**
> 
> **Thinking comes later — and only in one place.**

