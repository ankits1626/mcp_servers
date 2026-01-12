# Transpile vs Compile

## Compile

**Compile** = Convert high-level code → low-level code (machine code/bytecode)

```
Human-readable                      Machine-executable
─────────────────────────────────────────────────────

C code          ───► [Compiler] ───►  Binary (0s and 1s)
Java code       ───► [Compiler] ───►  Bytecode (.class)
Go code         ───► [Compiler] ───►  Executable binary
```

The output is a **fundamentally different form** - something the CPU or VM executes directly.

```c
// C code (human reads this)
int add(int a, int b) {
    return a + b;
}

// Compiled to machine code (CPU reads this)
01010101 01001000 10001001 11100101
10001001 01111101 11111100 10001001
```

---

## Transpile

**Transpile** = Convert high-level code → high-level code (same abstraction level)

```
Source Language                     Target Language
─────────────────────────────────────────────────────

TypeScript      ───► [Transpiler] ───►  JavaScript
JSX             ───► [Transpiler] ───►  JavaScript
ES6+ JS         ───► [Transpiler] ───►  ES5 JS (older)
Sass            ───► [Transpiler] ───►  CSS
```

The output is **still human-readable code** in a similar language.

```tsx
// TypeScript (input)
const greet = (name: string): string => {
  return `Hello, ${name}`
}

// Transpiled to JavaScript (output) - still readable!
const greet = (name) => {
  return `Hello, ${name}`
}
```

---

## Side-by-Side Comparison

| Aspect | Compile | Transpile |
|--------|---------|-----------|
| **Output level** | Low-level (machine/bytecode) | High-level (another language) |
| **Output readable?** | No (binary) | Yes (source code) |
| **Example input** | C, Go, Rust | TypeScript, JSX, Sass |
| **Example output** | .exe, .class, binary | .js, .css |
| **Purpose** | Run on CPU/VM | Run in browser/runtime |

---

## Why Transpile?

### Reason 1: New Syntax → Old Syntax

Browsers update slowly. New JavaScript features don't work everywhere.

```javascript
// ES6+ (modern - some old browsers don't support)
const nums = [1, 2, 3]
const doubled = nums.map(n => n * 2)

// Transpiled to ES5 (works everywhere)
var nums = [1, 2, 3]
var doubled = nums.map(function(n) { return n * 2 })
```

### Reason 2: Extended Syntax → Standard Syntax

JSX isn't JavaScript. Browsers don't understand it.

```jsx
// JSX (not valid JavaScript)
<button onClick={handleClick}>
  Count: {count}
</button>

// Transpiled to JavaScript (valid!)
React.createElement(
  'button',
  { onClick: handleClick },
  'Count: ',
  count
)
```

### Reason 3: Type Safety → Runtime Code

TypeScript adds types for safety, but browsers only run JavaScript.

```typescript
// TypeScript (types help you catch bugs)
function add(a: number, b: number): number {
  return a + b
}

// Transpiled (types removed - JS doesn't have them)
function add(a, b) {
  return a + b
}
```

---

## In React/Vite

Vite uses **esbuild** (transpiler) under the hood:

```
Your Code                    Transpiled Output
───────────────────────────────────────────────

App.tsx (TypeScript + JSX)
    │
    ▼
[esbuild transpiler]
    │
    ▼
App.js (plain JavaScript)
    │
    ▼
Browser runs it
```

---

## Memory Aid

```
Compile   = Source code → Machine code   (human → machine)
Transpile = Source code → Source code    (human → human)
```

Or think of it as:

- **Compile**: Translate English → Binary (machine language)
- **Transpile**: Translate British English → American English (both human languages)

---

## Quick Quiz

| Input | Output | Compile or Transpile? |
|-------|--------|----------------------|
| C → Binary | Machine code | Compile |
| TypeScript → JavaScript | Source code | Transpile |
| Java → Bytecode | VM code | Compile |
| JSX → JavaScript | Source code | Transpile |
| Sass → CSS | Source code | Transpile |
| Rust → Binary | Machine code | Compile |

---

## Summary

In React development:
- **Transpile** happens constantly (TSX → JS, JSX → JS)
- **Compile** isn't really involved (browsers interpret JS, they don't compile it)

Vite is primarily a **transpiler + bundler**, not a traditional compiler.
