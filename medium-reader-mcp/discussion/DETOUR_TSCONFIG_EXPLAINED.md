# Understanding tsconfig.json - A Beginner's Guide

> **Goal**: Understand every option in our TypeScript configuration

---

## What is tsconfig.json?

It's a configuration file that tells TypeScript **how to behave**. When you run `tsc` (TypeScript compiler), it reads this file to know:

1. Which files to process
2. What JavaScript version to output
3. How strict to be with type checking
4. Where to put the compiled files

---

## Our Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Section 1: File Selection (include/exclude)

### `include`

```json
"include": ["src/**/*.ts"]
```

**What it does**: Tells TypeScript which files to compile.

**The pattern explained**:
- `src/` - Start in the src folder
- `**` - Look in all subdirectories (any depth)
- `*.ts` - Match any file ending in `.ts`

**Examples of what matches**:
```
src/index.ts           ✅ matches
src/utils/helper.ts    ✅ matches
src/a/b/c/deep.ts      ✅ matches
test/index.ts          ❌ not in src/
src/index.js           ❌ not a .ts file
```

### `exclude`

```json
"exclude": ["node_modules", "dist"]
```

**What it does**: Folders to ignore completely.

**Why exclude these?**
- `node_modules` - Contains thousands of third-party files. Checking them would be slow and pointless.
- `dist` - Our compiled output. We don't want to compile already-compiled files!

---

## Section 2: Output Settings

### `target`

```json
"target": "ES2022"
```

**What it does**: What version of JavaScript to output.

**The problem it solves**:

TypeScript has modern features. Old JavaScript engines don't understand them. `target` controls what gets "downleveled" (converted to older syntax).

```typescript
// Your TypeScript code
const greet = (name: string) => `Hello, ${name}`;

// If target: "ES5" (old browsers)
var greet = function(name) { return "Hello, " + name; };

// If target: "ES2022" (modern Node.js)
const greet = (name) => `Hello, ${name}`;
```

**Common targets**:

| Target | Use Case |
|--------|----------|
| `ES5` | Old browsers (IE11) |
| `ES2015`/`ES6` | Modern browsers |
| `ES2020` | Node.js 14+ |
| `ES2022` | Node.js 18+ (our choice) |
| `ESNext` | Latest features (bleeding edge) |

**Why we chose ES2022**: We're building for Node.js 18+, which fully supports ES2022.

---

### `outDir`

```json
"outDir": "./dist"
```

**What it does**: Where to put compiled `.js` files.

```
Before compilation:          After compilation:
src/                         dist/
├── index.ts                 ├── index.js
└── utils/                   └── utils/
    └── helper.ts                └── helper.js
```

**Why "dist"?** It's a convention meaning "distributable" - the code you ship.

---

### `rootDir`

```json
"rootDir": "./src"
```

**What it does**: The root of your source files. Affects output structure.

**Without rootDir**:
```
src/index.ts  →  dist/src/index.js  (extra "src" folder!)
```

**With rootDir: "./src"**:
```
src/index.ts  →  dist/index.js  (clean!)
```

---

### `noEmit`

```json
"noEmit": false
```

**What it does**:
- `true` = Only check types, don't create any files
- `false` = Actually compile and create `.js` files

**When we had JavaScript + JSDoc**: We used `noEmit: true` because we just wanted type checking.

**Now with TypeScript**: We use `noEmit: false` because we need to compile `.ts` → `.js`.

---

### `declaration`

```json
"declaration": true
```

**What it does**: Generate `.d.ts` files alongside `.js` files.

```
src/index.ts  →  dist/index.js      (the code)
              →  dist/index.d.ts    (the types)
```

**What's a .d.ts file?**

It's a "type definition" file - contains only type information, no code.

```typescript
// dist/index.d.ts
declare function main(): Promise<void>;
```

**Why generate them?** If someone else uses your package, their TypeScript can understand your types.

---

## Section 3: Module Settings

### `module`

```json
"module": "NodeNext"
```

**What it does**: What module system to use in the output.

**Background - JavaScript has two module systems**:

```javascript
// CommonJS (old Node.js way)
const fs = require('fs');
module.exports = { myFunc };

// ES Modules (modern standard)
import fs from 'fs';
export { myFunc };
```

**Common values**:

| Value | Output Style | Use Case |
|-------|--------------|----------|
| `CommonJS` | `require()`/`module.exports` | Old Node.js |
| `ES2020` | `import`/`export` | Modern bundlers |
| `NodeNext` | Depends on package.json `type` | Modern Node.js (our choice) |

**Why NodeNext?** It's smart - it looks at your `package.json`:
- If `"type": "module"` → uses ES Modules
- If `"type": "commonjs"` → uses CommonJS

Our `package.json` has `"type": "module"`, so we get ES Modules.

---

### `moduleResolution`

```json
"moduleResolution": "NodeNext"
```

**What it does**: How TypeScript finds imported modules.

When you write:
```typescript
import { z } from "zod";
```

TypeScript needs to find where `zod` actually is. `moduleResolution` controls the algorithm.

**Common values**:

| Value | How it finds modules |
|-------|---------------------|
| `node` | Classic Node.js algorithm |
| `node16`/`nodenext` | Modern Node.js with ES Module support |
| `bundler` | For use with bundlers like Webpack/Vite |

**Why NodeNext?** We're using modern Node.js with ES Modules. This requires:
- Explicit `.js` extensions in imports
- Respects `package.json` `exports` field

---

### `esModuleInterop`

```json
"esModuleInterop": true
```

**What it does**: Makes CommonJS and ES Module imports work together smoothly.

**The problem**:

Some packages export differently:
```javascript
// Old CommonJS package
module.exports = function() { ... }

// vs. ES Module style
export default function() { ... }
```

**Without esModuleInterop**:
```typescript
import * as express from 'express';  // Awkward
const app = express();
```

**With esModuleInterop: true**:
```typescript
import express from 'express';  // Clean!
const app = express();
```

**Always use true** - there's no good reason not to.

---

### `resolveJsonModule`

```json
"resolveJsonModule": true
```

**What it does**: Allows importing `.json` files.

```typescript
// With resolveJsonModule: true
import packageJson from './package.json';
console.log(packageJson.version);  // Works! And has type checking!

// Without it
// Error: Cannot find module './package.json'
```

---

## Section 4: Type Checking Settings

### `strict`

```json
"strict": true
```

**What it does**: Enables ALL strict type checking options at once.

It's a shorthand for:
```json
{
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true,
  "strictBindCallApply": true,
  "strictPropertyInitialization": true,
  "noImplicitThis": true,
  "alwaysStrict": true,
  "useUnknownInCatchVariables": true
}
```

**Examples of what strict mode catches**:

```typescript
// noImplicitAny - must declare types
function greet(name) { }        // ❌ Error: 'name' has implicit 'any'
function greet(name: string) { } // ✅ OK

// strictNullChecks - null/undefined are separate types
let name: string = null;         // ❌ Error: can't assign null to string
let name: string | null = null;  // ✅ OK

// strictPropertyInitialization - class properties must be initialized
class User {
  name: string;  // ❌ Error: not initialized
}
class User {
  name: string = "";  // ✅ OK
}
```

**Always use strict: true** for new projects. It catches bugs.

---

### `skipLibCheck`

```json
"skipLibCheck": true
```

**What it does**: Don't type-check `.d.ts` files from `node_modules`.

**Why?**
1. **Speed** - Checking thousands of type definition files is slow
2. **Practicality** - Some packages have minor type errors you can't fix

**Is it safe?** Yes. You still get type checking for YOUR code. You just skip checking the types inside dependencies.

---

## Section 5: Visual Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                        tsconfig.json                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FILE SELECTION                                                  │
│  ├── include: ["src/**/*.ts"]    ← What to compile              │
│  └── exclude: ["node_modules"]   ← What to ignore               │
│                                                                  │
│  OUTPUT                                                          │
│  ├── target: "ES2022"            ← JS version to output         │
│  ├── outDir: "./dist"            ← Where to put .js files       │
│  ├── rootDir: "./src"            ← Root for folder structure    │
│  ├── noEmit: false               ← Actually create files        │
│  └── declaration: true           ← Generate .d.ts files         │
│                                                                  │
│  MODULES                                                         │
│  ├── module: "NodeNext"          ← Module system to use         │
│  ├── moduleResolution: "NodeNext" ← How to find imports         │
│  ├── esModuleInterop: true       ← CommonJS/ESM compatibility   │
│  └── resolveJsonModule: true     ← Allow importing JSON         │
│                                                                  │
│  TYPE CHECKING                                                   │
│  ├── strict: true                ← Enable all strict checks     │
│  └── skipLibCheck: true          ← Skip checking node_modules   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Compilation Flow

```
1. You run: npm run build (which runs "tsc")

2. TypeScript reads tsconfig.json

3. Finds files matching include: ["src/**/*.ts"]
   → src/index.ts

4. Type-checks with strict: true
   → Catches any type errors

5. Compiles to target: "ES2022"
   → Modern JavaScript

6. Outputs to outDir: "./dist"
   → dist/index.js
   → dist/index.d.ts (because declaration: true)

7. Done! Node can now run: node dist/index.js
```

---

## Common Questions

### Q: Why do we need both `module` and `moduleResolution`?

**`module`** = What syntax to OUTPUT
```javascript
// Output with module: "NodeNext"
import { z } from "zod";
export { myTool };
```

**`moduleResolution`** = How to FIND imports during compilation
```
When you write: import { z } from "zod"
TypeScript looks in: node_modules/zod/...
```

They're related but different concerns.

---

### Q: What if I have a type error in node_modules?

With `skipLibCheck: true`, you won't see it. This is usually fine because:
1. Popular packages are well-tested
2. You can't fix their code anyway
3. Your code is still type-checked

---

### Q: Why ES2022 and not ESNext?

`ESNext` is a moving target - it means "whatever is newest." This can break your code when TypeScript updates.

`ES2022` is stable. We know exactly what features it includes.

---

## Key Takeaways

1. **target** = What JavaScript version to output (ES2022 for modern Node.js)
2. **module/moduleResolution** = How imports/exports work (NodeNext for modern Node.js)
3. **strict: true** = Catch more bugs with stricter type checking
4. **outDir** = Where compiled files go (dist/)
5. **noEmit** = Whether to create files (false = yes, create them)

---

**Status**: ✅ Complete

**Back to**: [Project Setup](./DETOUR_PROJECT_SETUP.md) | [Phase 1](./PHASE_1_HELLO_WORLD.md)
