# Exercise 4: TypeScript Basics

> **Goal**: Use TypeScript to add type safety to your React components
> **Time**: ~20 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- Why TypeScript matters
- How to define types and interfaces
- How to type component props
- How to type the HackerNews job data

---

## Part 1: Why TypeScript?

TypeScript catches errors before you run your code:

```tsx
// Without TypeScript - bug discovered at runtime
function JobRow({ company }) {
  return <td>{company.toUppercase()}</td>  // Typo! Should be toUpperCase()
}

// With TypeScript - bug caught immediately
function JobRow({ company }: { company: string }) {
  return <td>{company.toUppercase()}</td>  // ❌ Error: Property 'toUppercase' does not exist
}
```

TypeScript = JavaScript + Types = Fewer bugs!

---

## Part 2: Basic Types

```typescript
// Primitive types
const company: string = "Stripe"
const id: number = 12345
const isRemote: boolean = true

// Arrays
const ids: number[] = [1, 2, 3, 4, 5]
const companies: string[] = ["Stripe", "Vercel", "Linear"]

// Optional (can be undefined)
const url: string | undefined = undefined
// or shorthand in objects:
// url?: string
```

---

## Part 3: Interfaces for Objects

Instead of inline types, we define **interfaces**:

```tsx
// ❌ Messy: Inline types
function JobRow({
  id,
  company,
  title
}: {
  id: number
  company: string
  title: string
}) {
  return <tr>...</tr>
}

// ✅ Clean: Interface
interface JobRowProps {
  id: number
  company: string
  title: string
}

function JobRow({ id, company, title }: JobRowProps) {
  return <tr>...</tr>
}
```

---

## Part 4: Create Types for HN Jobs

The HackerNews API returns job data like this:

```json
{
  "id": 12345678,
  "type": "job",
  "by": "stripe",
  "time": 1704067200,
  "title": "Stripe is hiring a Senior Engineer",
  "url": "https://stripe.com/jobs/123",
  "text": "<p>We're looking for...</p>"
}
```

Let's create a type for this!

### Step 1: Create Types File

Create `src/types/index.ts`:

```typescript
// The raw data from HackerNews API
export interface HNJob {
  id: number
  type: "job"
  by: string           // Username who posted
  time: number         // Unix timestamp
  title: string        // Full title like "Company is hiring..."
  url?: string         // Link to job posting (optional)
  text?: string        // Job description HTML (optional)
}

// Processed job data for our UI
export interface Job {
  id: number
  company: string      // Extracted from title
  title: string        // Job title
  postedTime: string   // Human readable "2 hours ago"
  url?: string
  description?: string // HTML content
  by: string          // Original poster
}
```

### Step 2: Update JobRow with Types

Edit `src/components/JobRow.tsx`:

```tsx
import type { Job } from '../types'

interface JobRowProps {
  job: Job
  onSelect?: (job: Job) => void
}

function JobRow({ job, onSelect }: JobRowProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer'
      }}
      onClick={() => onSelect?.(job)}
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
          <span style={{ color: '#999' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow
```

### Step 3: Update Header with Types

Edit `src/components/Header.tsx`:

```tsx
interface HeaderProps {
  jobCount: number
  lastUpdated?: string
}

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

---

## Part 5: Type vs Interface

Both work for objects, but there are conventions:

```typescript
// Interface - preferred for object shapes (like props)
interface JobRowProps {
  job: Job
  onSelect?: (job: Job) => void
}

// Type - preferred for unions, primitives, or computed types
type JobStatus = "loading" | "success" | "error"
type JobId = number
type JobOrNull = Job | null
```

**Rule of thumb**: Use `interface` for component props, `type` for everything else.

---

## Part 6: Update App with Mock Data

Let's use our types with mock job data:

```tsx
// src/App.tsx
import Header from './components/Header'
import JobRow from './components/JobRow'
import type { Job } from './types'

// Mock data (we'll fetch real data in Exercise 9)
const mockJobs: Job[] = [
  {
    id: 12345,
    company: "Stripe",
    title: "Senior Engineer",
    postedTime: "2 hours ago",
    url: "https://stripe.com/jobs",
    by: "stripe"
  },
  {
    id: 12346,
    company: "Vercel",
    title: "Full Stack Developer",
    postedTime: "5 hours ago",
    by: "vercel"
  },
  {
    id: 12347,
    company: "Linear",
    title: "React Developer",
    postedTime: "1 day ago",
    url: "https://linear.app/careers",
    by: "linear"
  },
  {
    id: 12348,
    company: "Anthropic",
    title: "ML Engineer",
    postedTime: "2 days ago",
    url: "https://anthropic.com/careers",
    by: "anthropic"
  }
]

function App() {
  const handleSelectJob = (job: Job) => {
    console.log('Selected job:', job)
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={mockJobs.length} lastUpdated="just now" />

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
            {mockJobs.map(job => (
              <JobRow
                key={job.id}
                job={job}
                onSelect={handleSelectJob}
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

---

## Part 7: Function Types

When passing callbacks as props, type the function:

```typescript
// Function that takes no arguments and returns nothing
type OnClick = () => void

// Function that takes a Job and returns nothing
type OnSelectJob = (job: Job) => void

// Function that takes a string and returns a number
type ParseId = (str: string) => number

// In component props
interface JobRowProps {
  job: Job
  onSelect?: (job: Job) => void  // Optional callback
  onClick: () => void             // Required callback
}
```

---

## Part 8: Common Patterns

### Optional Props

```typescript
interface Props {
  required: string       // Must be provided
  optional?: string      // Can be omitted
}
```

### Default Values with Types

```typescript
interface Props {
  title: string
  showIcon?: boolean  // Optional in type
}

function Component({
  title,
  showIcon = true  // Default value
}: Props) {
  return <div>{showIcon && '🔶'} {title}</div>
}
```

### Array Props

```typescript
interface Props {
  jobs: Job[]              // Array of Job objects
  ids: number[]            // Array of numbers
  items: (string | number)[]  // Array of strings OR numbers
}
```

---

## Challenge: Create JobDetail Types

Create types for a job detail view:

<details>
<summary>Click to see solution</summary>

```typescript
// src/types/index.ts

// Add to existing types:

export interface JobDetailProps {
  job: Job
  onBack: () => void
}

// For loading/error states (we'll use these later)
export interface JobsState {
  jobs: Job[]
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null
}

// For the HN API response types
export interface HNJobsResponse {
  ids: number[]
}
```

```tsx
// src/components/JobDetail.tsx
import type { Job, JobDetailProps } from '../types'

function JobDetail({ job, onBack }: JobDetailProps) {
  return (
    <div style={{ padding: '20px' }}>
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          color: '#ff6600',
          cursor: 'pointer',
          fontSize: '14px',
          padding: 0,
          marginBottom: '20px'
        }}
      >
        ← Back to Jobs
      </button>

      <h1 style={{ margin: '0 0 8px 0' }}>
        {job.title} at {job.company}
      </h1>

      <p style={{ color: '#666', margin: '0 0 20px 0' }}>
        Posted {job.postedTime} by @{job.by}
      </p>

      {job.description && (
        <div
          style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px'
          }}
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      )}

      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#ff6600',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px'
          }}
        >
          Apply on HN ↗
        </a>
      )}
    </div>
  )
}

export default JobDetail
```

</details>

---

## Key Takeaways

1. **TypeScript** catches bugs at compile time, not runtime
2. Use **interface** for component props and object shapes
3. Use **type** for unions, primitives, and computed types
4. Put shared types in `src/types/index.ts`
5. Import types with `import type { X }` for clarity
6. Use `?` for optional properties

---

## Your Project Structure

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── JobRow.tsx
│   │   └── JobDetail.tsx
│   ├── types/
│   │   └── index.ts        # All TypeScript types
│   ├── App.tsx
│   └── main.tsx
└── ...
```

---

## What's Next?

We have mock data, but it's static. To make our app interactive, we need to:

- Track which job is selected
- Show different views based on selection
- Update the UI when things change

That's what **State** is for!

**[→ Exercise 5: State](./05_state.md)**
