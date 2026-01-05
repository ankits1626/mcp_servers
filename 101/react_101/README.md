# React 101: Learn by Building

> **Goal**: Master React fundamentals by building a **HackerNews Jobs Board**
> **React Version**: React 19 (2025)
> **Time**: ~4-5 hours of hands-on coding
> **Prerequisites**: Basic HTML, CSS, JavaScript

---

## What We're Building

A real-world app that:

1. **Fetches jobs** from the HackerNews API
2. **Stores them** in localStorage (local DB)
3. **Displays them** in a table
4. **Shows details** when you click a row

```text
┌─────────────────────────────────────────────────────────────────┐
│  🔶 HN Jobs                                    [Refresh] [Clear]│
│  45 jobs loaded · Last updated: 2 min ago                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Company          │ Title              │ Posted    │ ➜    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Stripe           │ Senior Engineer    │ 2 hrs ago │ ➜    │  │
│  │ Vercel           │ Full Stack Dev     │ 5 hrs ago │ ➜    │  │
│  │ Linear           │ React Developer    │ 1 day ago │ ➜    │  │
│  │ Anthropic        │ ML Engineer        │ 2 days ago│ ➜    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Showing 1-10 of 45 jobs          [◀ Prev] [Next ▶]             │
└─────────────────────────────────────────────────────────────────┘

Click a row → Job Detail Page:
┌─────────────────────────────────────────────────────────────────┐
│  [← Back to Jobs]                                                │
│                                                                  │
│  Senior Engineer at Stripe                                       │
│  Posted 2 hours ago by @stripe                                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  We're looking for engineers who love building...         │  │
│  │  (full job description HTML)                              │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Apply on HN ↗]                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Why This Project?

This app teaches **real-world React patterns**:

| Concept | How We Use It |
|---------|--------------|
| Components | JobRow, JobTable, JobDetail, Header |
| Props | Pass job data to components |
| State | Track jobs, loading, selected job |
| useEffect | Fetch data from API |
| Async/Await | Handle API calls |
| Conditional Rendering | Loading states, error handling |
| Lists & Keys | Render job table rows |
| Navigation | Switch between list and detail views |
| localStorage | Cache jobs for offline/fast reload |
| Custom Hooks | useFetch, useLocalStorage |

---

## HackerNews API

We'll use the [official HN API](https://github.com/HackerNews/API):

```text
Jobs list:     https://hacker-news.firebaseio.com/v0/jobstories.json
Job details:   https://hacker-news.firebaseio.com/v0/item/{id}.json
```

**No API key needed!** It's free and public.

Example job response:

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

---

## Course Philosophy

Start simple, build complexity:

```text
Simple ──────────────────────────────────────────────────────→ Complex

Hello World → Components → Props → State → Fetch → Lists → Navigation → Caching
```

---

## Setup: Create Your Project

### Step 1: Create React App with Vite

```bash
cd /Users/ankit/code/learn/mcp_servers/project_JARVIS/react_101

pnpm create vite@latest hn-jobs -- --template react-ts

cd hn-jobs
pnpm install
pnpm dev
```

Open http://localhost:5173 in your browser.

### Step 2: Clean Up the Starter Code

```bash
rm src/App.css src/index.css src/assets/react.svg
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div>
      <h1>🔶 HN Jobs</h1>
    </div>
  )
}

export default App
```

---

## Course Outline

### Part 1: The Basics

| # | Exercise | What You'll Learn | Build |
|---|----------|-------------------|-------|
| 1 | [Hello React](./exercises/01_hello_react.md) | JSX basics | Display "HN Jobs" |
| 2 | [Components](./exercises/02_components.md) | Reusable UI pieces | Header, JobRow |
| 3 | [Props](./exercises/03_props.md) | Passing data | JobRow with data |
| 4 | [TypeScript](./exercises/04_typescript.md) | Type safety | Job interface |

### Part 2: Data & Interactivity

| # | Exercise | What You'll Learn | Build |
|---|----------|-------------------|-------|
| 5 | [State](./exercises/05_state.md) | useState basics | Selected job highlight |
| 6 | [Lists](./exercises/06_lists.md) | Rendering arrays | Job table |
| 7 | [Events](./exercises/07_events.md) | Click handlers | Row click to select |

### Part 3: API & Async

| # | Exercise | What You'll Learn | Build |
|---|----------|-------------------|-------|
| 8 | [useEffect](./exercises/08_useeffect.md) | Side effects | Fetch on load |
| 9 | [Async Fetch](./exercises/09_fetch.md) | API calls, loading | Fetch HN jobs |
| 10 | [Error Handling](./exercises/10_errors.md) | Try/catch, error states | Error UI |

### Part 4: Navigation & Storage

| # | Exercise | What You'll Learn | Build |
|---|----------|-------------------|-------|
| 11 | [Conditional Rendering](./exercises/11_conditional.md) | Show/hide views | List vs Detail view |
| 12 | [localStorage](./exercises/12_localstorage.md) | Persist data | Cache jobs |
| 13 | [Custom Hooks](./exercises/13_custom_hooks.md) | Reusable logic | useFetch hook |
| 14 | [Styling](./exercises/14_styling.md) | CSS, polish | Final app |

---

## Folder Structure (What You'll Build)

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx         # App header
│   │   ├── JobTable.tsx       # Jobs list table
│   │   ├── JobRow.tsx         # Single job row
│   │   ├── JobDetail.tsx      # Job detail page
│   │   └── LoadingSpinner.tsx # Loading state
│   ├── hooks/
│   │   ├── useFetch.ts        # Generic fetch hook
│   │   └── useLocalStorage.ts # localStorage hook
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── api/
│   │   └── hn.ts              # HN API functions
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
├── index.html
└── package.json
```

---

## Learning Path

```text
Exercise 1-4: Static UI
┌──────────────────────────────────┐
│  Display hardcoded job data      │
│  Learn components & props        │
└──────────────────────────────────┘
            │
            ▼
Exercise 5-7: Interactivity
┌──────────────────────────────────┐
│  Click to select jobs            │
│  Render job list from array      │
└──────────────────────────────────┘
            │
            ▼
Exercise 8-10: Real Data
┌──────────────────────────────────┐
│  Fetch from HN API               │
│  Handle loading & errors         │
└──────────────────────────────────┘
            │
            ▼
Exercise 11-14: Complete App
┌──────────────────────────────────┐
│  Navigate to detail page         │
│  Cache in localStorage           │
│  Polish the UI                   │
└──────────────────────────────────┘
```

---

## Key Concepts You'll Master

### 1. Fetching Data

```tsx
useEffect(() => {
  async function fetchJobs() {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json')
    const ids = await res.json()
    // Fetch first 30 job details...
  }
  fetchJobs()
}, [])
```

### 2. Storing in localStorage

```tsx
// Save
localStorage.setItem('hn-jobs', JSON.stringify(jobs))

// Load
const cached = localStorage.getItem('hn-jobs')
if (cached) setJobs(JSON.parse(cached))
```

### 3. Navigation (List ↔ Detail)

```tsx
const [selectedJob, setSelectedJob] = useState<Job | null>(null)

// In render:
{selectedJob ? (
  <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />
) : (
  <JobTable jobs={jobs} onSelect={setSelectedJob} />
)}
```

---

## Tips for Success

1. **Type the code yourself** - Don't copy-paste
2. **Run after each change** - Vite hot-reloads instantly
3. **Check the browser console** - Errors appear there
4. **Use React DevTools** - [Install the extension](https://react.dev/learn/react-developer-tools)

---

## Resources

### HackerNews API

- [Official API Docs](https://github.com/HackerNews/API)
- [API Guide](https://www.devzery.com/post/exploring-the-hacker-news-api-a-guide-for-developers)

### React Documentation

- [React.dev - Quick Start](https://react.dev/learn)
- [React 19 Release](https://react.dev/blog/2024/12/05/react-19)

### Best Practices

- [React 19 Best Practices](https://dev.to/jay_sarvaiya_reactjs/react-19-best-practices-write-clean-modern-and-efficient-react-code-1beb)
- [React Design Patterns 2025](https://www.telerik.com/blogs/react-design-patterns-best-practices)

---

## After This Course

You'll be ready to:

1. **Build JARVIS navigation** - Apply components, state, effects
2. **Connect to Tauri backend** - Same patterns as API fetching
3. **Build any React app** - You'll know all the fundamentals

---

## Let's Start

Make sure you've completed the setup above, then:

**[→ Exercise 1: Hello React](./exercises/01_hello_react.md)**

---

*Course last updated: January 2026 | React 19 | HN Jobs App*
