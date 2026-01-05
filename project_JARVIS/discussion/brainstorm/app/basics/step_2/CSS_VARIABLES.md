# CSS Variables (Custom Properties)

> **Industry Standard in 2025**: Yes. CSS Custom Properties have 95%+ browser support and are the foundation of modern theming systems. The approach in this guide follows current best practices from MDN, CSS-Tricks, and the W3C Design Tokens Community Group.

---

## What Are CSS Variables?

CSS Variables, officially called **CSS Custom Properties**, are values you define once and reuse throughout your stylesheet. Think of them as named containers that hold CSS values.

```css
/* Define a variable */
:root {
  --primary-color: #007bff;
}

/* Use it anywhere */
.button {
  background-color: var(--primary-color);
}

.link {
  color: var(--primary-color);
}
```

---

## The Problem They Solve

### Without CSS Variables (The Old Way)

Imagine you have a blue brand color used in 50 places:

```css
.header { background: #007bff; }
.button { background: #007bff; }
.link { color: #007bff; }
.sidebar { border-color: #007bff; }
/* ... 46 more places */
```

**Problems:**

1. **Changing colors is painful** - Need to find/replace in 50 places
2. **Easy to make typos** - `#007bff` vs `#007bf` (oops!)
3. **No semantic meaning** - What does `#007bff` represent?
4. **Hard to maintain consistency** - Designers change one shade, you miss updating some

### With CSS Variables (The Modern Way)

```css
:root {
  --brand-primary: #007bff;
}

.header { background: var(--brand-primary); }
.button { background: var(--brand-primary); }
.link { color: var(--brand-primary); }
.sidebar { border-color: var(--brand-primary); }
```

**Benefits:**

1. **Change once, update everywhere** - Edit `--brand-primary`, all 50 places update
2. **No typos** - Variable names get autocomplete in VS Code
3. **Semantic naming** - `--brand-primary` is self-documenting
4. **Easy theming** - Swap variable values for dark mode

---

## Syntax Breakdown

### Defining Variables

```css
:root {
  --variable-name: value;
}
```

| Part | Meaning |
|------|---------|
| `:root` | Targets the document root (usually `<html>`). Variables defined here are **global** |
| `--` | Required prefix for custom properties (CSS standard) |
| `variable-name` | Your chosen name (use kebab-case: `my-color`, not `myColor`) |
| `value` | Any valid CSS value |

### Using Variables

```css
.element {
  property: var(--variable-name);
}
```

### With Fallback Values

```css
.element {
  /* If --accent doesn't exist, use hotpink */
  color: var(--accent, hotpink);
}
```

---

## 2025 Industry Best Practices

Based on current standards from MDN, Smashing Magazine, and CSS-Tricks:

### 1. Scoping Strategy: 70/30 Rule

A 2025 Stack Overflow survey found developers reported **30% decrease in stylesheet complexity** by balancing global and scoped variables:

```css
/* 70% Global - Shared across entire app */
:root {
  --color-primary: #667eea;
  --spacing-md: 1rem;
  --radius-md: 8px;
}

/* 30% Local - Component-specific */
.card {
  --card-padding: var(--spacing-md);
  --card-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### 2. Naming Conventions

Custom property names are **case-sensitive**. Industry standard is **kebab-case** with semantic prefixes:

```css
:root {
  /* Category prefix pattern */
  --color-primary: #667eea;
  --color-text: #1a202c;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --font-size-lg: 1.25rem;
  --radius-md: 8px;
}
```

### 3. The `@property` Rule (Type Safety)

New in 2025: **`@property`** adds type safety and enables animations on custom properties. Now has **93%+ browser support**.

```css
/* Without @property - can't animate */
:root {
  --gradient-angle: 45deg;
}

/* With @property - NOW ANIMATABLE! */
@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}

.gradient-box {
  background: linear-gradient(var(--gradient-angle), red, blue);
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  to { --gradient-angle: 360deg; }
}
```

**Why it matters:**
- **Type checking** - Browser validates values (can't assign "banana" to a color)
- **Animations** - Properties can now be animated/transitioned
- **Fallbacks** - `initial-value` provides safe default

### 4. Design Tokens Architecture

The **W3C Design Tokens Community Group** released the first stable specification (2025.10) supported by Adobe, Google, Microsoft, Figma, and others.

**Two-tier token system:**

```css
/* Tier 1: Primitive tokens (raw values) */
:root {
  --blue-500: #667eea;
  --blue-600: #5a67d8;
  --gray-100: #f7fafc;
  --gray-900: #1a202c;
}

/* Tier 2: Semantic tokens (purpose-based) */
:root {
  --color-primary: var(--blue-500);
  --color-primary-hover: var(--blue-600);
  --color-bg: var(--gray-100);
  --color-text: var(--gray-900);
}
```

**Benefits:**
- Primitives rarely change
- Semantic tokens map meaning to values
- Theme switching only changes semantic layer

### 5. JavaScript Integration (Runtime Updates)

Unlike SASS variables, CSS Variables are **runtime-aware**:

```javascript
// Read a variable
const primary = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary');

// Update a variable
document.documentElement.style.setProperty('--color-primary', '#10b981');

// Theme toggle
document.documentElement.setAttribute('data-theme', 'dark');
```

---

## Why We Need This in JARVIS

### 1. Consistent Design System

Our app has 2 navigation tabs (Main + Playground) and multiple UI components. CSS Variables ensure:

```css
/* variables.css */
:root {
  --color-primary: #667eea;     /* Brand purple */
  --color-surface: #ffffff;      /* Card backgrounds */
  --spacing-md: 1rem;            /* Consistent spacing */
  --radius-md: 8px;              /* Rounded corners */
}
```

Every component uses the same values:

```css
/* Sidebar.css */
.sidebar {
  background: var(--color-surface);
  padding: var(--spacing-md);
}

/* NavItem.css */
.nav-item.active {
  background: var(--color-primary);
  border-radius: var(--radius-md);
}
```

### 2. Dark Mode (Future-Ready)

With variables, adding dark mode is trivial:

```css
/* Light theme (default) */
:root {
  --color-bg: #ffffff;
  --color-text: #1a1a1a;
  --color-surface: #f5f5f5;
}

/* Dark theme - also supports prefers-color-scheme */
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;
    --color-text: #ffffff;
    --color-surface: #2d2d2d;
  }
}

/* Manual toggle override */
[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-text: #ffffff;
  --color-surface: #2d2d2d;
}
```

Toggle dark mode with one line of JavaScript:

```javascript
document.documentElement.setAttribute('data-theme', 'dark');
```

All components automatically update!

### 3. Responsive Adjustments

Variables can change based on screen size:

```css
:root {
  --nav-width: 64px;  /* Mobile: compact */
}

@media (min-width: 768px) {
  :root {
    --nav-width: 240px;  /* Desktop: full width */
  }
}

.sidebar {
  width: var(--nav-width);  /* Automatically adjusts */
}
```

### 4. Component Isolation

Each component can define local overrides:

```css
.playground-page {
  --color-primary: #10b981;  /* Green theme for Playground */
}

.main-page {
  --color-primary: #667eea;  /* Purple theme for Main */
}
```

---

## Our variables.css File

Here's what we'll create for JARVIS (following 2025 best practices):

```css
/* src/styles/variables.css */

:root {
  /* ========== Primitive Tokens ========== */
  --purple-500: #667eea;
  --purple-600: #5a67d8;
  --purple-700: #764ba2;

  --gray-50: #f7fafc;
  --gray-100: #edf2f7;
  --gray-200: #e2e8f0;
  --gray-500: #718096;
  --gray-900: #1a202c;

  --green-500: #48bb78;
  --red-500: #f56565;

  /* ========== Semantic Tokens ========== */
  --color-primary: var(--purple-500);
  --color-primary-hover: var(--purple-600);
  --color-secondary: var(--purple-700);

  --color-bg: var(--gray-50);
  --color-surface: #ffffff;
  --color-text: var(--gray-900);
  --color-text-muted: var(--gray-500);

  --color-border: var(--gray-200);
  --color-success: var(--green-500);
  --color-error: var(--red-500);

  /* ========== Spacing Scale ========== */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */

  /* ========== Typography ========== */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-md: 1rem;      /* 16px */
  --font-size-lg: 1.25rem;   /* 20px */
  --font-size-xl: 1.5rem;    /* 24px */

  /* ========== Layout ========== */
  --nav-width-mobile: 64px;
  --nav-width-desktop: 240px;
  --nav-height-mobile: 64px;

  /* ========== Effects ========== */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}

/* ========== Dark Theme ========== */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #1a1a2e;
    --color-surface: #16213e;
    --color-text: #edf2f7;
    --color-text-muted: #a0aec0;
    --color-border: #2d3748;
  }
}

[data-theme="dark"] {
  --color-bg: #1a1a2e;
  --color-surface: #16213e;
  --color-text: #edf2f7;
  --color-text-muted: #a0aec0;
  --color-border: #2d3748;
}
```

---

## How to Use in React Components

### Method 1: Inline Styles (Not Recommended)

```tsx
// Works but verbose
<div style={{ backgroundColor: 'var(--color-surface)' }}>
```

### Method 2: CSS Modules (Recommended)

```css
/* NavItem.module.css */
.navItem {
  padding: var(--spacing-md);
  color: var(--color-text);
  border-radius: var(--radius-md);
}

.navItem:hover {
  background: var(--color-primary);
  color: white;
}
```

```tsx
// NavItem.tsx
import styles from './NavItem.module.css';

export function NavItem({ label }) {
  return <button className={styles.navItem}>{label}</button>;
}
```

### Method 3: Global CSS

```css
/* App.css */
.sidebar {
  background: var(--color-surface);
  width: var(--nav-width-desktop);
}
```

---

## Comparison: CSS Variables vs Other Approaches

| Approach | Pros | Cons | 2025 Status |
|----------|------|------|-------------|
| **CSS Variables** | Native, runtime changes, no build step, devtools support | None for modern browsers | Industry standard |
| **SASS/SCSS Variables** | Powerful features, nesting | No runtime changes, requires compilation | Still used, declining |
| **Tailwind CSS 4** | @theme with CSS variables, utility-first | Learning curve | Popular, uses CSS vars internally |
| **CSS-in-JS** | Scoped styles, TypeScript support | Runtime overhead, bundle size | Declining in favor of native CSS |

For JARVIS, **CSS Variables** are ideal because:
- Native to CSS (no extra dependencies)
- Tauri apps target modern browsers (WebKit-based)
- Easy dark mode support with `prefers-color-scheme`
- Works great with Vite's fast refresh
- Future-proof with `@property` support

---

## Key Takeaways

| Concept | Why It Matters |
|---------|----------------|
| **Single source of truth** | Change colors/spacing in ONE file |
| **Semantic naming** | `--color-primary` is clearer than `#667eea` |
| **Two-tier tokens** | Primitives + Semantic tokens = maintainable themes |
| **Dark mode ready** | Swap variable values, entire app updates |
| **Runtime changes** | JavaScript can update variables live |
| **`@property` type safety** | Validates values, enables animations |

---

## References

### Official Documentation
- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN: @property at-rule](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@property)
- [CSS-Tricks: Complete Guide to Custom Properties](https://css-tricks.com/a-complete-guide-to-custom-properties/)

### Best Practices & Strategy
- [Smashing Magazine: CSS Custom Properties Strategy Guide](https://www.smashingmagazine.com/2018/05/css-custom-properties-strategy-guide/)
- [DEV.to: Mastering CSS Custom Properties Best Practices](https://dev.to/gnwabumere/mastering-css-custom-properties-best-practices-for-efficient-styling-1h09)
- [LogRocket: How to Use CSS Variables Like a Pro](https://blog.logrocket.com/how-to-use-css-variables/)

### @property and Type Safety
- [Web Dev Simplified: @property Is One Of The Coolest New CSS Features](https://blog.webdevsimplified.com/2025-01/css-at-property/)
- [DEV.to: CSS @property Explained](https://dev.to/satyam_gupta_0d1ff2152dcc/css-property-explained-the-secret-weapon-for-dynamic-smooth-animations-2ip5)
- [6 CSS Snippets Every Front-End Developer Should Know In 2025](https://nerdy.dev/6-css-snippets-every-front-end-developer-should-know-in-2025)

### Design Tokens Standard
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Design Tokens Specification 2025.10](https://design-tokens.github.io/community-group/format/)
- [Penpot: Developer's Guide to Design Tokens and CSS Variables](https://penpot.app/blog/the-developers-guide-to-design-tokens-and-css-variables/)
- [CSS-Tricks: What Are Design Tokens?](https://css-tricks.com/what-are-design-tokens/)

### Modern CSS Trends
- [5 Emerging CSS Trends for 2025](https://thecodeaccelerator.com/blog/5-emerging-css-trends-for-2025)
- [Tailwind CSS 4 @theme: The Future of Design Tokens](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06)

---

## Next Steps

After understanding CSS Variables, continue with [STEP_2_NAVIGATION_MENU.md](../STEP_2_NAVIGATION_MENU.md) to implement:

1. Create `src/styles/variables.css` (Step 2.1)
2. Import it in `main.tsx`
3. Use variables in all components

---

*This file is part of the JARVIS learning documentation. Last updated: January 2026*
