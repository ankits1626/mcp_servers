# useMediaQuery Hook

> **Industry Standard in 2025**: Yes. Custom hooks for responsive detection are the standard React pattern. This approach is used by Material UI, Chakra UI, and recommended by the React documentation.

---

## What Is a Media Query Hook?

A **media query hook** is a custom React hook that detects screen size changes and returns a boolean. It lets your React components "know" if they're on mobile or desktop.

```tsx
// Usage
const isDesktop = useMediaQuery('(min-width: 768px)');

// Returns:
// - true  → screen is 768px or wider (desktop)
// - false → screen is narrower than 768px (mobile)
```

---

## The Problem It Solves

### CSS Media Queries Alone Aren't Enough

CSS media queries handle styling:

```css
/* CSS can show/hide elements */
.sidebar { display: block; }

@media (max-width: 767px) {
  .sidebar { display: none; }
  .bottom-tabs { display: flex; }
}
```

**But what if you need to:**
- Render completely different components (not just hide/show)
- Change behavior based on screen size
- Conditionally load heavy components only on desktop
- Pass different props based on viewport

### The React Problem

React components need to **know** the screen size to make decisions:

```tsx
// ❌ This doesn't work - React doesn't know screen size
function Layout() {
  return (
    <div>
      {/* How does React know which to render? */}
      <Sidebar />       {/* Desktop only */}
      <BottomTabs />    {/* Mobile only */}
    </div>
  );
}
```

### The Solution: useMediaQuery

```tsx
// ✅ Now React knows the screen size
function Layout() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div>
      {isDesktop ? <Sidebar /> : <BottomTabs />}
    </div>
  );
}
```

---

## How It Works

### Step 1: Browser's matchMedia API

JavaScript can detect media queries using `window.matchMedia()`:

```javascript
// Check if screen is at least 768px wide
const mediaQuery = window.matchMedia('(min-width: 768px)');

console.log(mediaQuery.matches); // true or false
```

### Step 2: Listen for Changes

The `matchMedia` object has an event listener for when the match state changes:

```javascript
mediaQuery.addEventListener('change', (event) => {
  console.log('Screen size changed!');
  console.log('Now matches:', event.matches);
});
```

### Step 3: Wrap in React Hook

Combine with `useState` and `useEffect` to make it reactive:

```tsx
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);

    // Cleanup on unmount
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
```

---

## Why We Need This in JARVIS

### Our Responsive Layout Strategy

JARVIS has two different navigation UIs:

| Screen Size | Navigation Component | Position |
|-------------|---------------------|----------|
| Desktop (≥768px) | `<Sidebar />` | Left side, vertical |
| Mobile (<768px) | `<BottomTabs />` | Bottom, horizontal |

### Without the Hook

```tsx
// ❌ Problem: Both components render, CSS just hides one
function Layout({ children }) {
  return (
    <div className="layout">
      <Sidebar className="hide-on-mobile" />      {/* Still in DOM */}
      <main>{children}</main>
      <BottomTabs className="hide-on-desktop" />  {/* Still in DOM */}
    </div>
  );
}
```

**Issues:**
- Both components are in the DOM (waste of memory)
- Both components run their effects (potential bugs)
- Event listeners attached to hidden components
- Accessibility tools see both navigations

### With the Hook

```tsx
// ✅ Only the correct component renders
function Layout({ children }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div className="layout">
      {isDesktop ? <Sidebar /> : <BottomTabs />}
      <main>{children}</main>
    </div>
  );
}
```

**Benefits:**
- Only one navigation in DOM at a time
- Clean component mounting/unmounting
- Better performance
- Correct accessibility tree

---

## The Full Implementation

### `src/hooks/useMediaQuery.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * Custom hook that listens for CSS media query changes
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean - true if query matches, false otherwise
 *
 * @example
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 * const isLandscape = useMediaQuery('(orientation: landscape)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a function to avoid SSR issues
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window exists (for SSR compatibility)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    // Early return if no window (SSR)
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);

    // Update state if it changed since initial render
    if (mediaQuery.matches !== matches) {
      setMatches(mediaQuery.matches);
    }

    // Event handler for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern API: addEventListener (supported in all modern browsers)
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup: remove listener on unmount or query change
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query, matches]);

  return matches;
}
```

---

## Common Use Cases

### 1. Responsive Navigation (Our Use Case)

```tsx
const isDesktop = useMediaQuery('(min-width: 768px)');

return isDesktop ? <Sidebar /> : <BottomTabs />;
```

### 2. Dark Mode Detection

```tsx
const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

useEffect(() => {
  document.documentElement.setAttribute(
    'data-theme',
    prefersDark ? 'dark' : 'light'
  );
}, [prefersDark]);
```

### 3. Reduced Motion (Accessibility)

```tsx
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

// Disable animations for users who prefer reduced motion
const animationDuration = prefersReducedMotion ? 0 : 300;
```

### 4. Device Orientation

```tsx
const isLandscape = useMediaQuery('(orientation: landscape)');

// Show different layout in landscape mode
```

### 5. High Resolution Displays

```tsx
const isRetina = useMediaQuery('(min-resolution: 2dppx)');

// Load higher resolution images on retina displays
const imageUrl = isRetina ? '/logo@2x.png' : '/logo.png';
```

### 6. Hover Capability (Touch vs Mouse)

```tsx
const canHover = useMediaQuery('(hover: hover)');

// Only show hover effects on devices that support hover
// Useful for touch devices where hover doesn't make sense
```

---

## Common Breakpoints

| Breakpoint | Query | Use Case |
|------------|-------|----------|
| Mobile | `(max-width: 767px)` | Phones |
| Tablet | `(min-width: 768px) and (max-width: 1023px)` | iPads, tablets |
| Desktop | `(min-width: 768px)` | Tablets + Desktop |
| Large Desktop | `(min-width: 1024px)` | Desktop only |
| Extra Large | `(min-width: 1280px)` | Wide monitors |

**For JARVIS, we use:**

```tsx
const isDesktop = useMediaQuery('(min-width: 768px)');
```

768px is the standard breakpoint where:
- Below: Phone-style UI (bottom tabs)
- Above: Tablet/Desktop UI (sidebar)

---

## Why Not CSS-Only?

| Approach | Pros | Cons |
|----------|------|------|
| **CSS Media Queries** | Simple, no JS needed | Can only show/hide, both components exist in DOM |
| **useMediaQuery Hook** | Conditional rendering, only one component in DOM | Requires JS, brief flash possible |
| **CSS Container Queries** | Component-based responsive | Limited browser support, can't change component structure |

**Best Practice 2025**: Use both together:

```tsx
// React: Choose WHICH component to render
const isDesktop = useMediaQuery('(min-width: 768px)');
return isDesktop ? <Sidebar /> : <BottomTabs />;
```

```css
/* CSS: Style the component responsively */
.sidebar {
  width: var(--nav-width-desktop);
}

@media (max-width: 1023px) {
  .sidebar {
    width: var(--nav-width-compact);
  }
}
```

---

## Comparison with Libraries

| Library | Hook Name | Bundle Impact |
|---------|-----------|---------------|
| **Custom (ours)** | `useMediaQuery` | ~20 lines, 0 KB extra |
| **Material UI** | `useMediaQuery` | Part of @mui/material |
| **Chakra UI** | `useMediaQuery` | Part of @chakra-ui/react |
| **react-responsive** | `useMediaQuery` | ~3 KB |
| **usehooks-ts** | `useMediaQuery` | ~1 KB (tree-shakeable) |

For JARVIS, we write our own because:
- Zero dependencies
- Full control over implementation
- Learning opportunity
- Only ~20 lines of code

---

## Key Concepts Explained

### Why `useState` with Initializer Function?

```tsx
// ✅ Good: Function runs once on mount
const [matches, setMatches] = useState(() => {
  return window.matchMedia(query).matches;
});

// ❌ Bad: Runs on every render
const [matches, setMatches] = useState(
  window.matchMedia(query).matches
);
```

### Why Check `typeof window !== 'undefined'`?

For **Server-Side Rendering (SSR)** compatibility:

```tsx
if (typeof window !== 'undefined') {
  return window.matchMedia(query).matches;
}
return false; // Safe default for SSR
```

Note: Tauri apps don't use SSR, but it's good practice to include this check for portability.

### Why Return a Cleanup Function?

```tsx
useEffect(() => {
  mediaQuery.addEventListener('change', handler);

  // Cleanup prevents memory leaks
  return () => mediaQuery.removeEventListener('change', handler);
}, [query]);
```

If we don't remove the listener:
- Old listeners accumulate on query change
- Memory leak when component unmounts
- Potential bugs from stale closures

---

## Testing the Hook

### Manual Testing

1. Run the app: `pnpm tauri dev`
2. Open browser DevTools
3. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
4. Resize viewport and watch navigation switch

### In Playground

We'll add a test in Playground to visualize:

```tsx
function MediaQueryTest() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <div className="experiment-card">
      <h3>useMediaQuery Tests</h3>
      <p>Screen: {isDesktop ? '🖥️ Desktop' : '📱 Mobile'}</p>
      <p>Theme: {prefersDark ? '🌙 Dark' : '☀️ Light'}</p>
      <p>Window width: {window.innerWidth}px</p>
    </div>
  );
}
```

---

## References

### Official Documentation

- [MDN: Window.matchMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
- [MDN: MediaQueryList](https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList)
- [MDN: Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)

### React Patterns

- [React Docs: Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [React Docs: useState](https://react.dev/reference/react/useState)

### Library Implementations

- [Material UI: useMediaQuery](https://mui.com/material-ui/react-use-media-query/)
- [Chakra UI: useMediaQuery](https://chakra-ui.com/docs/hooks/use-media-query)
- [usehooks-ts: useMediaQuery](https://usehooks-ts.com/react-hook/use-media-query)

### Best Practices

- [CSS-Tricks: A Complete Guide to CSS Media Queries](https://css-tricks.com/a-complete-guide-to-css-media-queries/)
- [web.dev: Responsive Design](https://web.dev/learn/design/media-queries)

---

## Next Steps

After understanding useMediaQuery, continue with [STEP_2_NAVIGATION_MENU.md](../STEP_2_NAVIGATION_MENU.md) to:

1. Create `src/hooks/useMediaQuery.ts` (Step 2.2)
2. Use it in Layout.tsx (Step 2.5)
3. Test responsive behavior

---

*This file is part of the JARVIS learning documentation. Last updated: January 2026*
