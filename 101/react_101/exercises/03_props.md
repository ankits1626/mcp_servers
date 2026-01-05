# Exercise 3: Props

> **Goal**: Pass data to components to make them dynamic
> **Time**: ~25 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- What props are
- How to pass props
- Individual props vs object props (and when to use each)
- Default values for props
- Props are read-only

---

## Part 1: The Problem

Our JobRow always shows the same data:

```tsx
<JobRow />  // Always shows "Stripe" - "Senior Engineer"
<JobRow />  // Same thing
<JobRow />  // Same thing
```

We need a way to tell each JobRow what to display.

---

## Part 2: What Are Props?

**Props** = Properties = Data passed to a component

Think of props like function arguments:

```tsx
// Regular function
function greet(name) {
  return `Hello, ${name}!`
}
greet("Alice")  // "Hello, Alice!"

// Component with props (same idea!)
function JobRow({ company }) {
  return <td>{company}</td>
}
<JobRow company="Stripe" />  // Shows "Stripe"
```

---

## Part 3: Two Ways to Pass Props

Before we implement, let's understand the two approaches:

### Option A: Individual Props (Flat)

```tsx
<JobRow
  company="Stripe"
  title="Senior Engineer"
  postedTime="2 hours ago"
/>

function JobRow({ company, title, postedTime }: {
  company: string
  title: string
  postedTime: string
}) {
  return <tr>...</tr>
}
```

### Option B: Object Prop

```tsx
<JobRow job={jobData} />

function JobRow({ job }: { job: Job }) {
  return (
    <tr>
      <td>{job.company}</td>
      <td>{job.title}</td>
    </tr>
  )
}
```

### When to Use Each?

| Use Individual Props | Use Object Prop |
|---------------------|-----------------|
| 2-3 simple props | 4+ related props |
| Props are unrelated | Props form a logical entity |
| Component is generic | Props come from API/database |

**For our Job data**: Object prop is better because:

1. A "Job" is a real entity with multiple fields
2. Data comes from the HackerNews API
3. Cleaner when passing to lists

```tsx
// ❌ Verbose: Spreading fields everywhere
{jobs.map(job => (
  <JobRow
    key={job.id}
    id={job.id}
    company={job.company}
    title={job.title}
    postedTime={job.postedTime}
    url={job.url}
  />
))}

// ✅ Clean: Pass the whole object
{jobs.map(job => (
  <JobRow key={job.id} job={job} />
))}
```

---

## Part 4: Set Up Path Aliases

Instead of ugly relative imports like `'../types'` or `'../../components/Header'`, let's set up the `@` alias so we can write `'@/types'`.

### Step 1: Update `tsconfig.json`

Add the `baseUrl` and `paths` configuration:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
    // ... other options
  }
}
```

### Step 2: Update `vite.config.ts`

Vite needs to know about the alias too:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

Now you can import from anywhere:

```tsx
// ❌ Ugly relative imports
import { Job } from '../types'
import Header from '../../components/Header'

// ✅ Clean absolute imports
import { Job } from '@/types'
import Header from '@/components/Header'
```

---

## Part 5: Organize Types

Create `src/types/index.ts` with all your types in one place:

```typescript
// ===================
// Data Entities
// ===================

export interface Job {
  id: number
  company: string
  title: string
  postedTime: string
  url?: string        // Optional
  description?: string // Optional
  by: string          // Who posted it
}

// ===================
// Component Props
// ===================

export interface HeaderProps {
  jobCount: number
  lastUpdated?: string
}

// Start simple - we'll add more props later
export interface JobRowProps {
  job: Job
}
```

Now import from anywhere:

```tsx
import type { Job, HeaderProps, JobRowProps } from '@/types'
```

---

## Part 6: Update JobRow with Object Prop

Edit `src/components/JobRow.tsx`:

```tsx
import type { JobRowProps } from '@/types'

function JobRow({ job }: JobRowProps) {
  return (
    <tr style={{
      borderBottom: '1px solid #f0f0f0',
      cursor: 'pointer'
    }}>
      <td style={{ padding: '12px 8px', fontWeight: 500 }}>
        {job.company}
      </td>
      <td style={{ padding: '12px 8px' }}>
        {job.title}
      </td>
      <td style={{ padding: '12px 8px', color: '#666', fontSize: '14px' }}>
        {job.postedTime}
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff6600' }}
          >
            ↗
          </a>
        ) : (
          <span style={{ color: '#ccc' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow
```

---

## Part 7: Use JobRow in App

Update `src/App.tsx`:

```tsx
import Header from '@/components/Header'
import JobRow from '@/components/JobRow'
import type { Job } from '@/types'

// Mock data (we'll fetch real data later)
const jobs: Job[] = [
  {
    id: 1,
    company: "Stripe",
    title: "Senior Engineer",
    postedTime: "2 hours ago",
    url: "https://stripe.com/jobs",
    by: "stripe"
  },
  {
    id: 2,
    company: "Vercel",
    title: "Full Stack Developer",
    postedTime: "5 hours ago",
    by: "vercel"
  },
  {
    id: 3,
    company: "Linear",
    title: "React Developer",
    postedTime: "1 day ago",
    url: "https://linear.app/careers",
    by: "linear"
  },
  {
    id: 4,
    company: "Anthropic",
    title: "ML Engineer",
    postedTime: "2 days ago",
    url: "https://anthropic.com/careers",
    by: "anthropic"
  }
]

function App() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={jobs.length} />

      <main style={{ padding: '20px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Company</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Posted</th>
              <th style={{ padding: '12px 8px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <JobRow key={job.id} job={job} />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}

export default App
```

Now each JobRow shows different data!

---

## Part 8: The Hybrid Pattern (Data + Callbacks)

Often you need to pass both data AND event handlers. The best practice:

- **Data entity** → Pass as object
- **Callbacks/UI state** → Pass individually

Let's update `JobRowProps` in `src/types/index.ts` to add interactivity:

```tsx
// src/types/index.ts - update JobRowProps
export interface JobRowProps {
  job: Job                      // Data as object
  onSelect?: (job: Job) => void // Callback separate
  isSelected?: boolean          // UI state separate
}
```

Now update the component to use these new props:

```tsx
// src/components/JobRow.tsx
import type { JobRowProps } from '@/types'

function JobRow({ job, onSelect, isSelected = false }: JobRowProps) {
  return (
    <tr
      onClick={() => onSelect?.(job)}
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#fff3e0' : 'transparent'
      }}
    >
      <td style={{ padding: '12px 8px', fontWeight: 500 }}>
        {job.company}
      </td>
      <td style={{ padding: '12px 8px' }}>
        {job.title}
      </td>
      <td style={{ padding: '12px 8px', color: '#666', fontSize: '14px' }}>
        {job.postedTime}
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff6600' }}
            onClick={(e) => e.stopPropagation()}  // Don't trigger row click
          >
            ↗
          </a>
        ) : (
          <span style={{ color: '#ccc' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow
```

Now update `App.tsx` to track selection state:

```tsx
// src/App.tsx
import { useState } from 'react'
import Header from '@/components/Header'
import JobRow from '@/components/JobRow'
import type { Job } from '@/types'

const jobs: Job[] = [
  // ... same mock data as before
]

function App() {
  // Track which job is selected (null = none)
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const handleSelectJob = (job: Job) => {
    // Toggle: click again to deselect
    setSelectedId(prev => prev === job.id ? null : job.id)
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={jobs.length} />

      <main style={{ padding: '20px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Company</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Posted</th>
              <th style={{ padding: '12px 8px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <JobRow
                key={job.id}
                job={job}
                onSelect={handleSelectJob}
                isSelected={selectedId === job.id}
              />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}

export default App
```

Now clicking a row highlights it, and clicking again deselects it.

> **Note**: We're using `useState` here - don't worry if you haven't learned it yet. We'll cover State in detail in Exercise 5. For now, just understand that `selectedId` remembers which job is clicked.

---

## Part 9: Update Header with Props

Make the Header show dynamic job counts:

```tsx
// src/components/Header.tsx
import type { HeaderProps } from '@/types'

function Header({ jobCount, lastUpdated }: HeaderProps) {
  return (
    <header style={{
      backgroundColor: '#ff6600',
      color: 'white',
      padding: '12px 16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔶</span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            HN Jobs
          </h1>
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          {jobCount} jobs {lastUpdated && `· Updated ${lastUpdated}`}
        </div>
      </div>
    </header>
  )
}

export default Header
```

Use it:

```tsx
<Header jobCount={jobs.length} lastUpdated="2 min ago" />
```

---

## Part 10: Props Are Read-Only

**Important**: Never modify props!

```tsx
// ❌ WRONG: Don't modify props
function JobRow({ job }) {
  job.title = "Modified"  // DON'T DO THIS!
  return <td>{job.title}</td>
}

// ✅ CORRECT: Props are for reading only
function JobRow({ job }) {
  return <td>{job.title}</td>
}
```

If you need to change data, you'll use **State** (Exercise 5).

---

## Part 11: Default Props

For optional props, provide defaults in the function signature:

```tsx
import type { JobRowProps } from '@/types'

function JobRow({
  job,
  onSelect,
  isSelected = false  // Default value
}: JobRowProps) {
  // ...
}
```

Now you can omit `isSelected`:

```tsx
<JobRow job={job} />  // isSelected defaults to false
<JobRow job={job} isSelected={true} />  // Explicitly true
```

---

## Challenge: Add Hover Effect

Add an `onHover` callback that fires when hovering over a job row:

<details>
<summary>Click to see solution</summary>

First, add `onHover` to your types in `src/types/index.ts`:

```tsx
export interface JobRowProps {
  job: Job
  onSelect?: (job: Job) => void
  onHover?: (job: Job | null) => void  // Add this
  isSelected?: boolean
}
```

Then update the component:

```tsx
// src/components/JobRow.tsx
import { useState } from 'react'
import type { JobRowProps } from '@/types'

function JobRow({
  job,
  onSelect,
  onHover,
  isSelected = false
}: JobRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(job)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(null)
  }

  return (
    <tr
      onClick={() => onSelect?.(job)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: isSelected
          ? '#fff3e0'
          : isHovered
            ? '#f9f9f9'
            : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
    >
      <td style={{ padding: '12px 8px', fontWeight: 500 }}>
        {job.company}
      </td>
      <td style={{ padding: '12px 8px' }}>
        {job.title}
      </td>
      <td style={{ padding: '12px 8px', color: '#666', fontSize: '14px' }}>
        {job.postedTime}
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff6600' }}
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        ) : (
          <span style={{ color: '#ccc' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow
```

</details>

---

## Key Takeaways

1. **Props** = data passed to components (like function arguments)
2. **Object props** are better for data entities (Job, User, etc.)
3. **Individual props** are better for callbacks and UI state
4. **Hybrid pattern**: `<JobRow job={job} onSelect={fn} isSelected={bool} />`
5. Props are **read-only** - never modify them!
6. Use `= defaultValue` for optional props
7. Use TypeScript interfaces for prop types

---

## Props Pattern Summary

```text
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Data entity (Job, User, Post)  →  Pass as object      │
│   UI controls (onClick, isOpen)  →  Pass individually   │
│                                                         │
│   <JobRow                                               │
│     job={job}              // Data object               │
│     onSelect={handleSelect} // Callback                 │
│     isSelected={true}       // UI state                 │
│   />                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Your Project Structure

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   └── JobRow.tsx
│   ├── types/
│   │   └── index.ts      # Job interface
│   ├── App.tsx
│   └── main.tsx
└── ...
```

---

## What's Next?

We created a `Job` type, but we're just scratching the surface of TypeScript.

Let's learn TypeScript properly to make our code safer!

**[→ Exercise 4: TypeScript Basics](./04_typescript.md)**
