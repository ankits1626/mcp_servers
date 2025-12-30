# Node.js and ECMAScript Version Guide (2025)

> **Goal**: Understand which Node.js and ES versions to use, and why

---

## Table of Contents

1. [Node.js Release Cycle](#1-nodejs-release-cycle)
2. [Current Node.js Versions (December 2025)](#2-current-nodejs-versions-december-2025)
3. [ECMAScript (ES) Versions Explained](#3-ecmascript-es-versions-explained)
4. [Node.js to ES Version Mapping](#4-nodejs-to-es-version-mapping)
5. [Our Choices](#5-our-choices)

---

## 1. Node.js Release Cycle

### How Node.js Versioning Works

Node.js follows a predictable release schedule:

```
       ┌─────────────────────────────────────────────────────────────┐
       │                    NODE.JS RELEASE LIFECYCLE                 │
       ├─────────────────────────────────────────────────────────────┤
       │                                                              │
       │   CURRENT ──────► ACTIVE LTS ──────► MAINTENANCE ──────► EOL │
       │   (6 months)      (12 months)        (18 months)             │
       │                                                              │
       │   Bleeding edge   Production ready   Critical fixes only     │
       │   New features    Recommended!       Security patches        │
       │                                                              │
       └─────────────────────────────────────────────────────────────┘
```

### Even vs Odd Versions

| Version Type | Example | LTS? | Use For |
|--------------|---------|------|---------|
| **Even** (v20, v22, v24) | v24.x | Yes | Production |
| **Odd** (v21, v23, v25) | v25.x | No | Testing new features |

**Rule**: Only even-numbered versions become LTS. Use even versions for production.

---

## 2. Current Node.js Versions (December 2025)

### Active Versions

| Version | Codename | Status | End of Life |
|---------|----------|--------|-------------|
| **v24** | Krypton | **Active LTS** | April 2028 |
| v22 | Jod | Maintenance LTS | April 2027 |
| v20 | Iron | Maintenance LTS | April 2026 |
| v25 | - | Current (not LTS) | June 2026 |

### Deprecated/EOL Versions

| Version | Status | End of Life |
|---------|--------|-------------|
| ~~v18~~ | **End of Life** | April 2025 |
| ~~v16~~ | End of Life | September 2023 |
| ~~v14~~ | End of Life | April 2023 |

### Which Version Should You Use?

```
┌─────────────────────────────────────────────────────────────────┐
│                    WHICH NODE VERSION TO USE?                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   New Project (2025)?                                           │
│   └── Use Node 24 (Active LTS) ✅                               │
│                                                                  │
│   Existing Project?                                              │
│   └── Node 20 or 22 still fine until their EOL dates           │
│                                                                  │
│   Testing new features?                                          │
│   └── Use Node 25 (Current), but don't deploy to production    │
│                                                                  │
│   Using Node 18 or older?                                       │
│   └── UPGRADE NOW! No longer receiving security patches ⚠️      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. ECMAScript (ES) Versions Explained

### What is ECMAScript?

ECMAScript is the **official standard** that JavaScript implements. Each year, a new version is released with new features.

```
ECMAScript (the standard)
     │
     └──► JavaScript (the implementation in browsers)
     └──► Node.js (the implementation for servers)
```

### ES Version History

| ES Version | Year | Key Features |
|------------|------|--------------|
| ES5 | 2009 | The "old JavaScript" (IE compatible) |
| ES6/ES2015 | 2015 | `let`/`const`, arrow functions, classes, Promises |
| ES2016 | 2016 | `Array.includes()`, `**` operator |
| ES2017 | 2017 | `async`/`await`, `Object.values()` |
| ES2018 | 2018 | Rest/spread for objects, `Promise.finally()` |
| ES2019 | 2019 | `Array.flat()`, `Object.fromEntries()` |
| ES2020 | 2020 | Optional chaining `?.`, nullish coalescing `??` |
| ES2021 | 2021 | `String.replaceAll()`, logical assignment |
| ES2022 | 2022 | Top-level await, class fields, `Array.at()` |
| **ES2023** | 2023 | `Array.toSorted()`, `Array.toReversed()`, `Array.findLast()` |
| ES2024 | 2024 | `Object.groupBy()`, `Promise.withResolvers()` |

### ES2022 vs ES2023 - What's New?

ES2023 added **non-mutating array methods**:

```typescript
// ES2022 - Methods mutate the original array
const arr = [3, 1, 2];
arr.sort();      // arr is now [1, 2, 3] - MUTATED!
arr.reverse();   // arr is now [3, 2, 1] - MUTATED!

// ES2023 - Methods return NEW arrays (original unchanged)
const arr = [3, 1, 2];
const sorted = arr.toSorted();     // sorted = [1, 2, 3], arr unchanged
const reversed = arr.toReversed(); // reversed = [2, 1, 3], arr unchanged
const found = arr.findLast(x => x > 1); // finds from end
```

**Why this matters**: Non-mutating methods are safer and work better with functional programming patterns.

---

## 4. Node.js to ES Version Mapping

### Official TypeScript Recommendations

From the [TypeScript Node Target Mapping](https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping):

| Node Version | target | lib | module |
|--------------|--------|-----|--------|
| **Node 24** | ES2024 | ES2024 | NodeNext |
| **Node 22** | ES2023 | ES2023 | NodeNext |
| **Node 20** | ES2023 | ES2023 | NodeNext |
| ~~Node 18~~ | ~~ES2022~~ | ~~ES2022~~ | ~~node16~~ |
| ~~Node 16~~ | ~~ES2021~~ | ~~ES2021~~ | ~~node16~~ |

### What Do These Settings Mean?

```
┌─────────────────────────────────────────────────────────────────┐
│                    tsconfig.json SETTINGS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   "target": "ES2023"                                            │
│   └── What SYNTAX to output                                     │
│       Controls: arrow functions, async/await, class fields      │
│                                                                  │
│   "lib": ["ES2023"]                                             │
│   └── What APIS are available                                   │
│       Controls: Array.toSorted(), Promise methods, etc.         │
│                                                                  │
│   "module": "NodeNext"                                          │
│   └── What MODULE SYSTEM to use                                 │
│       Controls: import/export vs require/module.exports         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Choosing the Right Target

When supporting multiple Node versions, use the **lowest common denominator**:

```
Our CI tests: Node 20, 22, 24

Node 20 supports: ES2023
Node 22 supports: ES2023
Node 24 supports: ES2024

Lowest common: ES2023 ✅
```

---

## 5. Our Choices

### CI Configuration (`.github/workflows/ci.yml`)

```yaml
strategy:
  matrix:
    node-version: [20.x, 22.x, 24.x]
```

| Version | Why Include |
|---------|-------------|
| 20.x | Maintenance LTS - many projects still use it |
| 22.x | Maintenance LTS - widely deployed |
| 24.x | **Active LTS** - recommended for new projects |

**Not included**:
- ~~18.x~~ - End of Life (April 2025)
- ~~25.x~~ - Current (not LTS, for testing only)

### TypeScript Configuration (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

| Setting | Value | Reason |
|---------|-------|--------|
| `target` | ES2023 | Lowest common for Node 20+ |
| `lib` | ES2023 | Enables ES2023 APIs |
| `module` | NodeNext | Modern ES Modules support |

---

## Quick Reference Card

### Node.js Version Decision

```
Is it December 2025?
│
├── Need maximum stability?
│   └── Use Node 22 (Maintenance LTS until April 2027)
│
├── Starting new project?
│   └── Use Node 24 (Active LTS until April 2028) ✅
│
├── Need latest features?
│   └── Use Node 25 (Current, not for production)
│
└── Using Node 18 or older?
    └── UPGRADE IMMEDIATELY (security risk!)
```

### ES Version Decision

```
What's your oldest supported Node version?
│
├── Node 24+ only?
│   └── Use ES2024
│
├── Node 20+?
│   └── Use ES2023 ✅ (our choice)
│
├── Node 18+ (if still supporting)?
│   └── Use ES2022
│
└── Need IE11 support? (very rare)
    └── Use ES5 (with polyfills)
```

---

## Timeline Visualization

```
2024        2025        2026        2027        2028        2029
  │           │           │           │           │           │
  │     ┌─────┴─────┐     │           │           │           │
  │     │  Node 18  │ EOL │           │           │           │
  │     │   (Iron)  │ Apr │           │           │           │
  │     └───────────┘     │           │           │           │
  │                       │           │           │           │
  │ ┌─────────────────────┴───────────┐           │           │
  │ │         Node 20 (Iron)          │ EOL       │           │
  │ │      Maintenance LTS            │ Apr       │           │
  │ └─────────────────────────────────┘           │           │
  │                                               │           │
  │ ┌─────────────────────────────────────────────┴───────────┐
  │ │              Node 22 (Jod)                  │ EOL       │
  │ │           Maintenance LTS                   │ Apr       │
  │ └─────────────────────────────────────────────────────────┘
  │                                                           │
  │ ┌─────────────────────────────────────────────────────────┴───┐
  │ │                   Node 24 (Krypton)                     │EOL│
  │ │                    Active LTS ✅                         │Apr│
  │ └─────────────────────────────────────────────────────────────┘
  │
  NOW (Dec 2025)
```

---

## Sources

- [Node.js Releases](https://nodejs.org/en/about/previous-releases)
- [Node.js End of Life Dates](https://endoflife.date/nodejs)
- [TypeScript Node Target Mapping (Official)](https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping)
- [TypeScript TSConfig target](https://www.typescriptlang.org/tsconfig/target.html)

---

**Status**: ✅ Complete

**Back to**: [TypeScript Guide](./DETOUR_TYPESCRIPT_GUIDE.md) | [Project Setup](./DETOUR_PROJECT_SETUP.md)
