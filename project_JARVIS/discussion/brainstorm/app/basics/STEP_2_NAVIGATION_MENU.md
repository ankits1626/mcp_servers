# JARVIS - Step 2: Navigation Menu

## Overview

Create a responsive navigation system that works on both desktop and mobile (iOS/Android). The menu has 2 tabs:

1. **Main** - The actual JARVIS app (recording, transcription)
2. **Playground** - Learning sandbox for React, Rust, Tauri concepts

The idea: **Learn in Playground → Apply in Main**

---

## Design Goals

| Goal                  | Desktop                        | Mobile                          |
| --------------------- | ------------------------------ | ------------------------------- |
| Navigation visibility | Sidebar (always visible)       | Bottom tab bar                  |
| Screen space          | Plenty - sidebar OK            | Limited - tabs save space       |
| Touch targets         | Small clickable areas OK       | Large tap targets (44px min)    |
| Gestures              | Hover states                   | Tap only, swipe between views   |

---

## Navigation Structure

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        JARVIS APP TABS                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌─────────────────────────────┐   ┌─────────────────────────────┐ │
│   │         🎤 MAIN             │   │       🧪 PLAYGROUND         │ │
│   │                             │   │                             │ │
│   │   The actual JARVIS app     │   │   Learning sandbox          │ │
│   │                             │   │                             │ │
│   │   • Device selection        │   │   • React experiments       │ │
│   │   • Recording controls      │   │   • Rust/Tauri commands     │ │
│   │   • Live transcription      │   │   • State management        │ │
│   │   • Settings                │   │   • Audio API tests         │ │
│   │                             │   │   • UI component tests      │ │
│   │                             │   │                             │ │
│   │   (Production ready)        │   │   (Learn & experiment)      │ │
│   │                             │   │                             │ │
│   └─────────────────────────────┘   └─────────────────────────────┘ │
│                                                                      │
│                    Learn in Playground → Apply in Main              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Responsive Layout Strategy

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    DESKTOP LAYOUT (≥768px)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────┬──────────────────────────────────────────────────┐   │
│   │          │                                                  │   │
│   │  SIDEBAR │              MAIN CONTENT                        │   │
│   │          │                                                  │   │
│   │  🎤 Main │   ┌──────────────────────────────────────────┐   │   │
│   │          │   │                                          │   │   │
│   │  🧪 Play │   │         Current View                     │   │   │
│   │          │   │                                          │   │   │
│   │          │   │                                          │   │   │
│   │          │   │                                          │   │   │
│   │          │   └──────────────────────────────────────────┘   │   │
│   │          │                                                  │   │
│   └──────────┴──────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MOBILE LAYOUT (<768px)                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                                                              │  │
│   │                                                              │  │
│   │                      MAIN CONTENT                            │  │
│   │                                                              │  │
│   │                    (Full screen height                       │  │
│   │                     minus tab bar)                           │  │
│   │                                                              │  │
│   │                                                              │  │
│   ├──────────────────────────────────────────────────────────────┤  │
│   │         🎤 Main          │         🧪 Playground             │  │
│   │                          │                                   │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                        BOTTOM TAB BAR                               │
│                    (Safe area respected)                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

After this step, you'll have:

```text
src/
├── main.tsx                    # Entry point
├── App.tsx                     # Main app with router
├── App.css                     # Global styles + responsive
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Desktop navigation
│   │   ├── BottomTabs.tsx      # Mobile navigation
│   │   └── Layout.tsx          # Responsive wrapper
│   └── ui/
│       └── NavItem.tsx         # Reusable nav item
├── pages/
│   ├── Main.tsx                # The actual JARVIS app
│   └── Playground.tsx          # Learning sandbox
├── hooks/
│   └── useMediaQuery.ts        # Detect screen size
└── styles/
    └── variables.css           # CSS custom properties
```

---

## Implementation

### Step 2.1: Create CSS Variables

**`src/styles/variables.css`**

```css
:root {
  /* Colors */
  --color-bg: #0a0a0a;
  --color-surface: #1a1a1a;
  --color-surface-hover: #252525;
  --color-border: #333333;
  --color-text: #ffffff;
  --color-text-muted: #888888;
  --color-accent: #4a9eff;
  --color-accent-hover: #6bb3ff;
  --color-danger: #ff4a4a;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Layout */
  --sidebar-width: 240px;
  --tab-bar-height: 56px;
  --safe-area-bottom: env(safe-area-inset-bottom, 0px);

  /* Breakpoints (for reference, use in media queries) */
  /* Mobile: < 768px */
  /* Desktop: ≥ 768px */

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Border radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
}
```

---

### Step 2.2: Create Media Query Hook

**`src/hooks/useMediaQuery.ts`**

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook to detect if screen matches a media query
 * @param query - CSS media query string
 * @returns boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    // Check if window is available (SSR safety)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update state when query match changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handler);

    // Set initial value
    setMatches(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
}

/**
 * Convenience hook for mobile detection
 * Mobile: < 768px
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Convenience hook for desktop detection
 * Desktop: ≥ 768px
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)');
}
```

---

### Step 2.3: Create NavItem Component

**`src/components/ui/NavItem.tsx`**

```tsx
import { ReactNode } from 'react';
import './NavItem.css';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant?: 'sidebar' | 'tab';
}

export function NavItem({
  icon,
  label,
  isActive,
  onClick,
  variant = 'sidebar'
}: NavItemProps) {
  return (
    <button
      className={`nav-item nav-item--${variant} ${isActive ? 'nav-item--active' : ''}`}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="nav-item__icon">{icon}</span>
      <span className="nav-item__label">{label}</span>
    </button>
  );
}
```

**`src/components/ui/NavItem.css`**

```css
.nav-item {
  display: flex;
  align-items: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-family);
}

.nav-item:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.nav-item--active {
  color: var(--color-accent);
}

/* Sidebar variant */
.nav-item--sidebar {
  width: 100%;
  padding: var(--spacing-md);
  gap: var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-md);
  justify-content: flex-start;
}

.nav-item--sidebar .nav-item__icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

/* Tab variant */
.nav-item--tab {
  flex: 1;
  flex-direction: column;
  padding: var(--spacing-sm) var(--spacing-xs);
  padding-bottom: calc(var(--spacing-sm) + var(--safe-area-bottom));
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  min-height: var(--tab-bar-height);
  justify-content: center;
}

.nav-item--tab .nav-item__icon {
  font-size: 1.5rem;
}

.nav-item--tab .nav-item__label {
  font-size: 0.75rem;
}

.nav-item--tab.nav-item--active {
  background: transparent;
}
```

---

### Step 2.4: Create Sidebar Component

**`src/components/layout/Sidebar.tsx`**

```tsx
import { NavItem } from '../ui/NavItem';
import './Sidebar.css';

// Icons (using emoji for simplicity - replace with icon library later)
const icons = {
  main: '🎤',
  playground: '🧪',
};

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const navItems = [
    { id: 'main', label: 'Main', icon: icons.main },
    { id: 'playground', label: 'Playground', icon: icons.playground },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar__header">
        <h1 className="sidebar__title">JARVIS</h1>
      </div>

      <nav className="sidebar__nav">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={currentPage === item.id}
            onClick={() => onNavigate(item.id)}
            variant="sidebar"
          />
        ))}
      </nav>

      <div className="sidebar__footer">
        <span className="sidebar__version">v0.1.0</span>
      </div>
    </aside>
  );
}
```

**`src/components/layout/Sidebar.css`**

```css
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
}

.sidebar__header {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.sidebar__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.sidebar__nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.sidebar__footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.sidebar__version {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
```

---

### Step 2.5: Create BottomTabs Component

**`src/components/layout/BottomTabs.tsx`**

```tsx
import { NavItem } from '../ui/NavItem';
import './BottomTabs.css';

const icons = {
  main: '🎤',
  playground: '🧪',
};

interface BottomTabsProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function BottomTabs({ currentPage, onNavigate }: BottomTabsProps) {
  const navItems = [
    { id: 'main', label: 'Main', icon: icons.main },
    { id: 'playground', label: 'Playground', icon: icons.playground },
  ];

  return (
    <nav className="bottom-tabs">
      {navItems.map((item) => (
        <NavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={currentPage === item.id}
          onClick={() => onNavigate(item.id)}
          variant="tab"
        />
      ))}
    </nav>
  );
}
```

**`src/components/layout/BottomTabs.css`**

```css
.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  /* iOS safe area for home indicator */
  padding-bottom: var(--safe-area-bottom);
}
```

---

### Step 2.6: Create Layout Component

**`src/components/layout/Layout.tsx`**

```tsx
import { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { Sidebar } from './Sidebar';
import { BottomTabs } from './BottomTabs';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`layout ${isMobile ? 'layout--mobile' : 'layout--desktop'}`}>
      {/* Desktop: Sidebar */}
      {!isMobile && (
        <Sidebar currentPage={currentPage} onNavigate={onNavigate} />
      )}

      {/* Main content */}
      <main className="layout__content">
        {children}
      </main>

      {/* Mobile: Bottom tabs */}
      {isMobile && (
        <BottomTabs currentPage={currentPage} onNavigate={onNavigate} />
      )}
    </div>
  );
}
```

**`src/components/layout/Layout.css`**

```css
.layout {
  min-height: 100vh;
  background: var(--color-bg);
}

/* Desktop layout */
.layout--desktop {
  display: flex;
}

.layout--desktop .layout__content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
}

/* Mobile layout */
.layout--mobile {
  display: flex;
  flex-direction: column;
}

.layout--mobile .layout__content {
  flex: 1;
  /* Account for bottom tab bar */
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-area-bottom));
  overflow-y: auto;
}
```

---

### Step 2.7: Create Page Components

**`src/pages/Main.tsx`**

```tsx
import './Pages.css';

export function Main() {
  return (
    <div className="page page--main">
      <header className="page__header">
        <h1>JARVIS</h1>
        <p className="page__subtitle">Voice Transcription</p>
      </header>

      <div className="page__content">
        {/* DeviceSelector and RecordButton will go here */}
        <div className="placeholder-card">
          <p>🎤 Recording controls will appear here</p>
        </div>

        {/* Transcript will go here */}
        <div className="placeholder-card placeholder-card--large">
          <p>📝 Live transcript will appear here</p>
        </div>
      </div>
    </div>
  );
}
```

**`src/pages/Playground.tsx`**

```tsx
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './Pages.css';

export function Playground() {
  const [greetResult, setGreetResult] = useState<string>('');
  const [inputName, setInputName] = useState<string>('');

  // Example: Call Rust backend
  const handleGreet = async () => {
    try {
      const result = await invoke<string>('greet', { name: inputName || 'World' });
      setGreetResult(result);
    } catch (err) {
      setGreetResult(`Error: ${err}`);
    }
  };

  return (
    <div className="page page--playground">
      <header className="page__header">
        <h1>Playground</h1>
        <p className="page__subtitle">Learn & Experiment</p>
      </header>

      <div className="page__content">
        {/* Section 1: Rust/Tauri Commands */}
        <section className="playground-section">
          <h2>🦀 Rust Commands</h2>
          <p className="section-description">
            Test calling Rust functions from React
          </p>

          <div className="experiment-card">
            <h3>invoke('greet')</h3>
            <div className="experiment-controls">
              <input
                type="text"
                placeholder="Enter a name..."
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
              />
              <button onClick={handleGreet}>Call Rust</button>
            </div>
            {greetResult && (
              <div className="experiment-result">
                <strong>Result:</strong> {greetResult}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: React State */}
        <section className="playground-section">
          <h2>⚛️ React State</h2>
          <p className="section-description">
            Experiment with useState, useEffect, etc.
          </p>
          <div className="placeholder-card">
            <p>Add React experiments here</p>
          </div>
        </section>

        {/* Section 3: Audio API */}
        <section className="playground-section">
          <h2>🎤 Audio API</h2>
          <p className="section-description">
            Test microphone listing and audio capture
          </p>
          <div className="placeholder-card">
            <p>Add audio experiments here</p>
          </div>
        </section>

        {/* Section 4: UI Components */}
        <section className="playground-section">
          <h2>🎨 UI Components</h2>
          <p className="section-description">
            Test and style UI components before using in Main
          </p>
          <div className="placeholder-card">
            <p>Add UI experiments here</p>
          </div>
        </section>
      </div>
    </div>
  );
}
```

**`src/pages/Pages.css`**

```css
.page {
  padding: var(--spacing-lg);
  max-width: 800px;
  margin: 0 auto;
}

.page__header {
  margin-bottom: var(--spacing-xl);
}

.page__header h1 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--spacing-xs) 0;
}

.page__subtitle {
  font-size: var(--font-size-md);
  color: var(--color-text-muted);
  margin: 0;
}

.page__content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

/* Placeholder cards (temporary) */
.placeholder-card {
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl);
  text-align: center;
  color: var(--color-text-muted);
}

.placeholder-card--large {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.text-muted {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

/* Playground specific styles */
.playground-section {
  margin-bottom: var(--spacing-xl);
}

.playground-section h2 {
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-text);
  margin: 0 0 var(--spacing-sm) 0;
}

.section-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-md) 0;
}

.experiment-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.experiment-card h3 {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-accent);
  margin: 0 0 var(--spacing-md) 0;
  font-family: monospace;
}

.experiment-controls {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.experiment-controls input {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--font-size-md);
}

.experiment-controls input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.experiment-controls button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.experiment-controls button:hover {
  background: var(--color-accent-hover);
}

.experiment-result {
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-family: monospace;
  font-size: var(--font-size-sm);
}

/* Mobile adjustments */
@media (max-width: 767px) {
  .page {
    padding: var(--spacing-md);
  }

  .page__header h1 {
    font-size: 1.5rem;
  }

  .experiment-controls {
    flex-direction: column;
  }
}
```

---

### Step 2.8: Update App.tsx

**`src/App.tsx`**

```tsx
import { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Main } from './pages/Main';
import { Playground } from './pages/Playground';
import './styles/variables.css';
import './App.css';

type Page = 'main' | 'playground';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('main');

  const renderPage = () => {
    switch (currentPage) {
      case 'main':
        return <Main />;
      case 'playground':
        return <Playground />;
      default:
        return <Main />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)}>
      {renderPage()}
    </Layout>
  );
}

export default App;
```

---

### Step 2.9: Update App.css

**`src/App.css`**

```css
/* Import variables */
@import './styles/variables.css';

/* Reset & Base */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  /* Prevent iOS text size adjustment */
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-family);
  background: var(--color-bg);
  color: var(--color-text);
  line-height: 1.5;
  /* Prevent overscroll bounce on iOS */
  overscroll-behavior: none;
}

/* iOS safe areas */
@supports (padding: env(safe-area-inset-bottom)) {
  :root {
    --safe-area-bottom: env(safe-area-inset-bottom);
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus styles for accessibility */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* Remove tap highlight on mobile */
button,
a {
  -webkit-tap-highlight-color: transparent;
}

/* Prevent text selection on nav items */
.nav-item {
  user-select: none;
  -webkit-user-select: none;
}
```

---

## Testing

### Desktop Test

```bash
pnpm tauri dev
```

- [ ] Sidebar visible on left
- [ ] Two nav items: Main, Playground
- [ ] Clicking nav item changes content
- [ ] Active item highlighted in blue

### Mobile Test (iOS Simulator)

```bash
pnpm tauri ios dev "iPhone 17 Pro"
```

- [ ] Bottom tab bar visible
- [ ] Two tabs: Main, Playground
- [ ] Tapping tab changes content
- [ ] Safe area respected (no overlap with home indicator)
- [ ] Active tab highlighted

### Playground Test

- [ ] Navigate to Playground tab
- [ ] Enter a name in the input field
- [ ] Click "Call Rust" button
- [ ] Should see "Hello, [name]! You've been greeted from Rust!"
- [ ] Verifies React ↔ Rust communication works

### Responsive Test

- [ ] Resize desktop window below 768px
- [ ] Sidebar should hide, bottom tabs should appear
- [ ] Resize above 768px
- [ ] Bottom tabs hide, sidebar appears
- [ ] Current page preserved during resize

---

## Visual Reference

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    DESKTOP - MAIN TAB (≥768px)                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐ ┌─────────────────────────────────────────────────┐    │
│  │ JARVIS  │ │  JARVIS                                         │    │
│  │         │ │  Voice Transcription                            │    │
│  │ 🎤 Main │ │                                                 │    │
│  │         │ │  ┌─────────────────────────────────────────┐    │    │
│  │ 🧪 Play │ │  │  🎤 Recording controls will appear here │    │    │
│  │         │ │  └─────────────────────────────────────────┘    │    │
│  │         │ │                                                 │    │
│  │         │ │  ┌─────────────────────────────────────────┐    │    │
│  │         │ │  │                                         │    │    │
│  │         │ │  │     📝 Live transcript will appear here │    │    │
│  │─────────│ │  │                                         │    │    │
│  │ v0.1.0  │ │  └─────────────────────────────────────────┘    │    │
│  └─────────┘ └─────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                  DESKTOP - PLAYGROUND TAB (≥768px)                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────┐ ┌─────────────────────────────────────────────────┐    │
│  │ JARVIS  │ │  Playground                                     │    │
│  │         │ │  Learn & Experiment                             │    │
│  │ 🎤 Main │ │                                                 │    │
│  │         │ │  🦀 Rust Commands                               │    │
│  │ 🧪 Play │ │  ┌─────────────────────────────────────────┐    │    │
│  │    ^^^  │ │  │ invoke('greet')                         │    │    │
│  │         │ │  │ [Enter name... ] [Call Rust]            │    │    │
│  │         │ │  │ Result: Hello, World!...                │    │    │
│  │         │ │  └─────────────────────────────────────────┘    │    │
│  │─────────│ │                                                 │    │
│  │ v0.1.0  │ │  ⚛️ React State | 🎤 Audio API | 🎨 UI         │    │
│  └─────────┘ └─────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────┐
│       MOBILE - MAIN (<768px)      │
├───────────────────────────────────┤
│                                   │
│  JARVIS                           │
│  Voice Transcription              │
│                                   │
│  ┌─────────────────────────────┐  │
│  │ 🎤 Recording controls       │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │                             │  │
│  │   📝 Live transcript        │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│                                   │
├───────────────────────────────────┤
│    🎤 Main    │   🧪 Playground   │
│               │                   │
└───────────────────────────────────┘
```

---

## Next Steps

After navigation is working:

1. **Playground experiments**: Learn React concepts (useState, useEffect, props)
2. **Playground experiments**: Learn Tauri commands (invoke, listen, events)
3. **Playground experiments**: Test audio device listing
4. **Main app**: Apply learnings to build actual JARVIS features

**Workflow:**

```text
Playground                          Main App
──────────                          ────────
1. Experiment with invoke()    →    Apply to device listing
2. Test useState/useEffect     →    Apply to recording state
3. Build UI components         →    Move to Main when ready
4. Debug Rust commands         →    Integrate into production
```

---

## Notes

### Why No React Router?

For this MVP, we use simple state-based navigation instead of React Router because:

- Fewer dependencies
- Simpler for 3 pages
- Works identically on mobile and desktop
- No URL complexity in a desktop/mobile app

If the app grows, consider adding React Router later.

### Icon Library (Future)

Currently using emoji for icons. When ready, replace with:

- [Lucide React](https://lucide.dev/) - Recommended, tree-shakeable
- [Heroicons](https://heroicons.com/) - From Tailwind team
- [Phosphor Icons](https://phosphoricons.com/) - Large icon set

```bash
pnpm add lucide-react
```

```tsx
import { Mic, History, Settings } from 'lucide-react';
// Replace emoji with: <Mic size={24} />
```
