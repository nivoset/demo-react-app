# 🧟 Zombie React Architecture Documentation

Welcome to the Zombie React Architecture documentation for the Payments Operations Dashboard codebase.

## 📚 Documentation Index

### 🎯 Start Here

1. **[Codebase Walkthrough](./CODEBASE_WALKTHROUGH.md)** - Step-by-step architecture explanation
   - Entry point to final composition
   - Why each design decision was made
   - How Single Responsibility Principle is applied
   - Who changes what (CFO, COO, CTO, Designers, Product)
   - Design decision flows and examples

2. **[Quick Reference](./QUICK_REFERENCE.md)** - Fast lookup for the 8 rules and patterns
   - Core principles
   - Navigation patterns
   - Component classification
   - Common violations
   - Quick checklist

3. **[Codebase Map](./CODEBASE_MAP.md)** - Visual navigation guide
   - Directory structure
   - Component classification
   - Data flow diagrams
   - 3-click navigation examples
   - Health indicators

4. **[Architecture Explanation](./ZOMBIE_ARCHITECTURE_EXPLANATION.md)** - Deep dive
   - Rule-by-rule analysis
   - Implementation details
   - Architectural decisions
   - Areas for improvement

### 📊 Analysis Tools

5. **[Automated Report](../ZOMBIE_ARCHITECTURE_REPORT.md)** - Generated analysis
   - Run: `npm run analyze:zombie`
   - Rule compliance status
   - Violations and warnings
   - Horde ratio calculations

## 🚀 Quick Start

### Understanding the Codebase

1. **Read the Codebase Walkthrough** - Step-by-step explanation of architecture and design decisions
2. **Read the Quick Reference** - Get familiar with the 8 rules
3. **Check the Codebase Map** - See how everything connects
4. **Review Architecture Explanation** - Understand the decisions

### Running Analysis

```bash
# Generate automated architecture report
npm run analyze:zombie
```

This creates `ZOMBIE_ARCHITECTURE_REPORT.md` with:
- ✅ Rule compliance status
- ⚠️ Violations and warnings
- 📊 Horde ratio calculations
- 📁 File classifications

## 🧠 The 8 Zombie Laws

1. **Start Undead** - UI first, brains later
2. **Horde Ratio** - Many zombies, few brains (≥ 7:1)
3. **3-Click Brain Rule** - Navigate to brain in ≤ 3 clicks
4. **Trial of the Three Strains** - Explore 3 interfaces before committing
5. **No Tunnels** - Avoid prop drilling
6. **Coffin Rule** - Co-locate related code
7. **No Unnamed Survivors** - Purposeful file names
8. **Silence the Living** - No console/warnings

## 🗺️ Navigation Guide

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

### Example: Where does KYC decision logic live?

1. Start: `PaymentsOpsDashboard.tsx` (line 54-69)
2. Click: `useKycEngine()` → `logic/useKycEngine.ts`
3. Click: `evaluateKycV1/V2()` → `logic/kycRules.v1.ts` or `kycRules.v2.ts`

**✅ 2-3 clicks** - Compliant!

## 📊 Current Status

### ✅ Strengths
- Clear separation of concerns
- Pure UI components
- Centralized brain boundary
- Co-located feature code
- Purposeful file names
- Short navigation paths (≤ 3 clicks)

### ⚠️ Areas to Monitor
- Console.error usage (should be silenced)
- Consider splitting dashboard if it grows
- Document interface decisions (Trial of Three Strains)

## 🎨 Color Coding

- 🟢 **Green (Skin)**: Pure UI components (zombies)
- 🧠 **Pink (Brains)**: Logic, state, orchestration
- 🌐 **Blue**: Data layer (API, external communication)
- 🔌 **Orange**: Legacy/external integration

## 📖 Related Resources

- [Project README](../README.md) - Project overview
- [Zombie React Architecture Canon](../code-text.txt) - Original canon document

## 🤝 Contributing

When adding new features:

1. ✅ Start with pure UI components (zombies)
2. ✅ Add brains at view boundary only
3. ✅ Verify 3-click navigation paths
4. ✅ Run `npm run analyze:zombie` before committing
5. ✅ Keep horde ratio ≥ 7:1

## 💡 Remember

> **A zombie doesn't plan. It obeys.**
> 
> **Thinking comes later — and only in one place.**

---

**Last Updated**: 2025-11-04  
**Analysis Tool**: `scripts/analyze-zombie-architecture.js`  
**Report**: Run `npm run analyze:zombie` to generate latest report

