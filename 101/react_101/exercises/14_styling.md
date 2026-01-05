# Exercise 14: Styling

> **Goal**: Polish the HN Jobs app with professional styling
> **Time**: ~30 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- CSS approaches in React
- CSS Variables for theming
- Responsive design
- Final polish and UX improvements

---

## Part 1: CSS Options in React

### Option 1: Inline Styles (what we've been using)

```tsx
<div style={{ padding: '20px', backgroundColor: 'white' }}>
```

**Pros**: No CSS files, scoped by default
**Cons**: No pseudo-classes (:hover), no media queries

### Option 2: CSS Files

```tsx
import './App.css'

<div className="container">
```

**Pros**: Full CSS features, familiar
**Cons**: Global by default, can conflict

### Option 3: CSS Modules

```tsx
import styles from './App.module.css'

<div className={styles.container}>
```

**Pros**: Scoped automatically, full CSS
**Cons**: Requires import, slightly verbose

### Option 4: CSS-in-JS (styled-components, emotion)

```tsx
const Container = styled.div`
  padding: 20px;
  background: white;
`
```

**Pros**: Full CSS + JavaScript power
**Cons**: Additional dependency, learning curve

---

## Part 2: Set Up Global Styles

Create `src/index.css`:

```css
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
  -webkit-font-smoothing: antialiased;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  line-height: 1.5;
  color: #1a1a1a;
  background-color: #f5f5f5;
}

/* CSS Variables (Theming) */
:root {
  /* Colors */
  --color-primary: #ff6600;
  --color-primary-dark: #e65c00;
  --color-primary-light: #ff8533;

  --color-bg: #f5f5f5;
  --color-bg-elevated: #ffffff;
  --color-bg-hover: #f9f9f9;

  --color-text: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-muted: #999999;

  --color-border: #e0e0e0;
  --color-border-light: #f0f0f0;

  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}

/* Utility Classes */
.container {
  max-width: 800px;
  margin: 0 auto;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## Part 3: Style Components

### Header.tsx

```tsx
function Header({ jobCount, lastUpdated, onRefresh, onClear }: HeaderProps) {
  return (
    <header style={{
      backgroundColor: 'var(--color-primary)',
      color: 'white',
      padding: 'var(--space-md)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          <span style={{ fontSize: '24px' }}>🔶</span>
          <h1 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600
          }}>
            HN Jobs
          </h1>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)'
        }}>
          <span style={{
            fontSize: '13px',
            opacity: 0.9
          }}>
            {jobCount} jobs · {lastUpdated}
          </span>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'var(--transition-fast)'
                }}
              >
                ↻ Refresh
              </button>
            )}
            {onClear && (
              <button
                onClick={onClear}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

### JobTable.tsx

```tsx
function JobTable({ jobs, onSelectJob }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div style={{
        padding: 'var(--space-xl)',
        textAlign: 'center',
        backgroundColor: 'var(--color-bg-elevated)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <p style={{
          fontSize: '18px',
          color: 'var(--color-text-secondary)',
          margin: 0
        }}>
          No jobs found
        </p>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'var(--color-bg-elevated)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{
            backgroundColor: 'var(--color-bg-hover)',
            borderBottom: '1px solid var(--color-border)'
          }}>
            <th style={{
              padding: 'var(--space-md) var(--space-sm)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Company
            </th>
            <th style={{
              padding: 'var(--space-md) var(--space-sm)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Position
            </th>
            <th style={{
              padding: 'var(--space-md) var(--space-sm)',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '13px',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Posted
            </th>
            <th style={{ width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map(job => (
            <JobRow key={job.id} job={job} onSelect={onSelectJob} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### JobRow.tsx

```tsx
import { useState } from 'react'

function JobRow({ job, onSelect }: JobRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <tr
      onClick={() => onSelect(job)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        borderBottom: '1px solid var(--color-border-light)',
        cursor: 'pointer',
        backgroundColor: isHovered ? 'var(--color-bg-hover)' : 'transparent',
        transition: 'var(--transition-fast)'
      }}
    >
      <td style={{
        padding: 'var(--space-md) var(--space-sm)',
        fontWeight: 500,
        color: 'var(--color-text)'
      }}>
        {job.company}
      </td>
      <td style={{
        padding: 'var(--space-md) var(--space-sm)',
        color: 'var(--color-text)'
      }}>
        {job.title}
      </td>
      <td style={{
        padding: 'var(--space-md) var(--space-sm)',
        color: 'var(--color-text-muted)',
        fontSize: '14px'
      }}>
        {job.postedTime}
      </td>
      <td style={{
        padding: 'var(--space-md) var(--space-sm)',
        textAlign: 'center',
        color: isHovered ? 'var(--color-primary)' : 'var(--color-text-muted)'
      }}>
        →
      </td>
    </tr>
  )
}
```

### JobDetail.tsx

```tsx
function JobDetail({ job, onBack }: JobDetailProps) {
  return (
    <div style={{
      backgroundColor: 'var(--color-bg-elevated)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-md)',
      overflow: 'hidden'
    }}>
      <div style={{ padding: 'var(--space-lg)' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: 0,
            marginBottom: 'var(--space-lg)'
          }}
        >
          ← Back to Jobs
        </button>

        <h1 style={{
          margin: '0 0 var(--space-sm) 0',
          fontSize: '24px',
          fontWeight: 600,
          color: 'var(--color-text)'
        }}>
          {job.title}
        </h1>

        <p style={{
          margin: 0,
          fontSize: '16px',
          color: 'var(--color-text-secondary)'
        }}>
          at <strong style={{ color: 'var(--color-text)' }}>{job.company}</strong>
        </p>

        <p style={{
          margin: 'var(--space-sm) 0 0 0',
          fontSize: '14px',
          color: 'var(--color-text-muted)'
        }}>
          Posted {job.postedTime} by @{job.by}
        </p>
      </div>

      {job.description && (
        <div
          style={{
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--color-bg)',
            borderTop: '1px solid var(--color-border-light)',
            lineHeight: 1.7
          }}
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      )}

      {job.url && (
        <div style={{
          padding: 'var(--space-lg)',
          borderTop: '1px solid var(--color-border-light)'
        }}>
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
              padding: 'var(--space-md) var(--space-lg)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              transition: 'var(--transition-fast)'
            }}
          >
            View on HackerNews ↗
          </a>
        </div>
      )}
    </div>
  )
}
```

---

## Part 4: Add Responsive Design

Update `src/index.css`:

```css
/* Add responsive styles */
@media (max-width: 768px) {
  :root {
    --space-md: 12px;
    --space-lg: 16px;
  }

  html {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .hide-mobile {
    display: none !important;
  }
}
```

Make header responsive:

```tsx
function Header(props: HeaderProps) {
  return (
    <header>
      {/* On mobile, stack vertically */}
      <div style={{
        display: 'flex',
        flexDirection: window.innerWidth < 480 ? 'column' : 'row',
        alignItems: window.innerWidth < 480 ? 'flex-start' : 'center',
        gap: 'var(--space-sm)'
      }}>
        {/* ... */}
      </div>
    </header>
  )
}
```

Or better, use a hook:

```tsx
import { useMediaQuery } from './hooks/useMediaQuery'

function Header(props: HeaderProps) {
  const isMobile = useMediaQuery('(max-width: 480px)')

  return (
    <header>
      <div style={{
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* ... */}
      </div>
    </header>
  )
}
```

---

## Part 5: Loading & Error Polish

### LoadingSpinner.tsx

```tsx
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      minHeight: '200px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{
        marginTop: 'var(--space-md)',
        color: 'var(--color-text-secondary)',
        fontSize: '14px'
      }}>
        Loading jobs from HackerNews...
      </p>
    </div>
  )
}
```

### ErrorMessage.tsx

```tsx
function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      padding: 'var(--space-xl)',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      borderRadius: 'var(--radius-md)',
      border: '1px solid #fecaca'
    }}>
      <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>
        😕
      </div>
      <h2 style={{
        margin: '0 0 var(--space-sm) 0',
        color: '#dc2626',
        fontSize: '18px'
      }}>
        Something went wrong
      </h2>
      <p style={{
        margin: '0 0 var(--space-lg) 0',
        color: '#991b1b',
        fontSize: '14px'
      }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}
```

---

## Part 6: Final App Styles

```tsx
// src/App.tsx
function App() {
  const { jobs, isLoading, error, ... } = useJobs(30)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)'
    }}>
      <Header
        jobCount={filteredJobs.length}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        onClear={clearCache}
      />

      {isFromCache && (
        <div style={{
          padding: 'var(--space-sm) var(--space-md)',
          backgroundColor: '#eff6ff',
          color: '#1d4ed8',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          📦 Loaded from cache ·{' '}
          <button
            onClick={refresh}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      )}

      <main style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'var(--space-lg)'
      }}>
        {!selectedJob && !isLoading && !error && (
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <input
              type="text"
              placeholder="Search companies or titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: 'var(--space-md)',
                fontSize: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-bg-elevated)',
                transition: 'var(--transition-fast)',
                outline: 'none'
              }}
            />
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={refresh} />
        ) : selectedJob ? (
          <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />
        ) : (
          <JobTable jobs={filteredJobs} onSelectJob={setSelectedJob} />
        )}
      </main>

      <footer style={{
        padding: 'var(--space-lg)',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
        fontSize: '13px'
      }}>
        Data from{' '}
        <a
          href="https://news.ycombinator.com/jobs"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--color-primary)' }}
        >
          HackerNews
        </a>
        {' '}· Built with React
      </footer>
    </div>
  )
}
```

---

## Congratulations! 🎉

You've built a complete HackerNews Jobs Board app with:

- ✅ Component-based architecture
- ✅ TypeScript for type safety
- ✅ State management with useState
- ✅ Side effects with useEffect
- ✅ API fetching and error handling
- ✅ List/Detail navigation
- ✅ localStorage caching
- ✅ Custom hooks for reusable logic
- ✅ Professional styling

---

## Final Project Structure

```text
hn-jobs/
├── src/
│   ├── api/
│   │   └── hn.ts              # HN API functions
│   ├── components/
│   │   ├── ErrorMessage.tsx
│   │   ├── Header.tsx
│   │   ├── JobDetail.tsx
│   │   ├── JobRow.tsx
│   │   ├── JobTable.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useDebounce.ts
│   │   ├── useFetch.ts
│   │   ├── useJobs.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
└── tsconfig.json
```

---

## What's Next?

Now that you know React fundamentals, you can:

1. **Build JARVIS navigation** - Apply these patterns
2. **Add React Router** - For real URL-based navigation
3. **Try a UI library** - Tailwind CSS, shadcn/ui, Radix
4. **Add state management** - Zustand, Jotai, Redux Toolkit
5. **Server components** - Next.js, Remix

---

## Resources

- [React.dev](https://react.dev) - Official docs
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Vite Guide](https://vitejs.dev/guide/)
- [HackerNews API](https://github.com/HackerNews/API)

---

*Congratulations on completing React 101! You're now ready to build real-world React applications.*
