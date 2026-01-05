# JARVIS - Workspace Setup Guide

## Overview

This guide covers the complete development environment setup for the JARVIS Tauri project, including package manager selection, VSCode configuration, and React basics for novices.

---

## Package Manager Recommendation

### TL;DR: Use **pnpm**

| Manager | Speed | Disk Usage | CI/CD Support | Recommendation |
|---------|-------|------------|---------------|----------------|
| **pnpm** | Fastest | 70% less | Good | **Best choice** |
| yarn | Fast | Normal | Excellent | Good alternative |
| npm | Slower | Normal | Universal | Default fallback |

### Why pnpm?

1. **Performance**: Fastest installs of all package managers
2. **Disk Efficiency**: Uses symlinks to a global store — saves GBs across projects
3. **Strict Dependencies**: Prevents accidental access to undeclared packages
4. **Tauri Recommended**: Official Tauri docs show pnpm in examples

### Install pnpm

```bash
# Using corepack (built into Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate

# Verify installation
pnpm --version
```

### pnpm Command Equivalents

| npm | pnpm |
|-----|------|
| `npm install` | `pnpm install` |
| `npm run dev` | `pnpm dev` |
| `npm run tauri dev` | `pnpm tauri dev` |
| `npm run tauri build` | `pnpm tauri build` |

---

## Project Creation (Updated)

### Recommended Method

```bash
# Navigate to project directory
cd /Users/ankit/code/learn/mcp_servers/project_JARVIS

# Create Tauri app with pnpm
pnpm create tauri-app jarvis-app

# Interactive prompts will ask:
# - Project name: jarvis-app (already specified)
# - Identifier: com.jarvis.app
# - Frontend language: TypeScript / JavaScript
# - Package manager: pnpm
# - UI template: React (react-ts)
```

### Alternative: Shell Script Method

```bash
# Official Tauri creation script (works with any package manager)
sh <(curl https://create.tauri.app/sh)
```

---

## VSCode Setup

### Required Extensions

Install these extensions in VSCode:

| Extension | ID | Purpose |
|-----------|----|---------|
| **Tauri** | `tauri-apps.tauri-vscode` | Tauri commands + config validation |
| **rust-analyzer** | `rust-lang.rust-analyzer` | Rust language support |
| **CodeLLDB** | `vadimcn.vscode-lldb` | Rust debugging |
| **ESLint** | `dbaeumer.vscode-eslint` | JavaScript/TypeScript linting |
| **Prettier** | `esbenp.prettier-vscode` | Code formatting |

#### Quick Install Command

```bash
code --install-extension tauri-apps.tauri-vscode
code --install-extension rust-lang.rust-analyzer
code --install-extension vadimcn.vscode-lldb
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

### Workspace Configuration

Create `.vscode/` folder in your project with these files:

```text
.vscode/
├── settings.json      # Editor behavior & formatting rules
├── extensions.json    # Recommended extensions for team
├── tasks.json         # Build/run commands (Ctrl+Shift+B)
└── launch.json        # Debugger configurations (F5)
```

---

#### `.vscode/settings.json`

**Purpose:** Controls editor behavior, formatting, and language-specific settings.

| Setting                        | What It Does                       |
| ------------------------------ | ---------------------------------- |
| `editor.formatOnSave`          | Auto-format code when you save     |
| `editor.defaultFormatter`      | Which extension formats the code   |
| `[rust]`                       | Rust-specific overrides            |
| `rust-analyzer.check.command`  | Use `clippy` for better linting    |
| `typescript.tsdk`              | Use project's TypeScript version   |

**How it works:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Settings Hierarchy                                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Settings (global)                                              │
│       ↓ overridden by                                                │
│  Workspace Settings (.vscode/settings.json)  ← This file            │
│       ↓ overridden by                                                │
│  Language-specific settings ([rust], [typescript])                   │
│                                                                      │
│  Example: Prettier formats everything EXCEPT Rust files             │
│  (rust-analyzer formats those instead)                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**What each setting does:**

```json
{
  // GLOBAL SETTINGS (apply to all files)
  "editor.formatOnSave": true,              // Format when you press Cmd+S
  "editor.defaultFormatter": "esbenp.prettier-vscode",  // Use Prettier by default

  // RUST-SPECIFIC (overrides global for .rs files)
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",  // Use rust-analyzer, not Prettier
    "editor.formatOnSave": true
  },

  // TYPESCRIPT-SPECIFIC
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // TSX-SPECIFIC (React components)
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  // RUST-ANALYZER CONFIG
  "rust-analyzer.cargo.features": "all",    // Enable all Cargo features for analysis
  "rust-analyzer.check.command": "clippy",  // Use clippy (stricter) instead of cargo check

  // TYPESCRIPT CONFIG
  "typescript.tsdk": "node_modules/typescript/lib",  // Use project's TS, not VSCode's built-in

  // FILE ASSOCIATIONS
  "files.associations": {
    "*.css": "css"                          // Treat .css files as CSS (syntax highlighting)
  }
}
```

---

#### `.vscode/extensions.json`

**Purpose:** Recommends extensions to team members. When someone opens this project, VSCode prompts them to install these extensions.

```text
┌─────────────────────────────────────────────────────────────────────┐
│  When teammate opens project:                                        │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  This workspace has extension recommendations.               │   │
│  │                                                              │   │
│  │  [Install All]  [Show Recommendations]  [Ignore]             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Ensures everyone has the same development environment              │
└─────────────────────────────────────────────────────────────────────┘
```

```json
{
  "recommendations": [
    "tauri-apps.tauri-vscode",
    "rust-lang.rust-analyzer",
    "vadimcn.vscode-lldb",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ]
}
```

---

#### `.vscode/tasks.json`

**Purpose:** Defines runnable tasks accessible via `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) or the Command Palette (`Tasks: Run Task`).

**How to use:**

1. Press `Cmd+Shift+P` → type "Tasks: Run Task"
2. Select a task from the list

| Task           | What It Does                                    |
| -------------- | ----------------------------------------------- |
| `ui:dev`       | Starts Vite dev server (frontend only)          |
| `ui:build`     | Builds frontend for production                  |
| `rust:build`   | Compiles Rust code                              |
| `rust:check`   | Fast syntax/type check (no binary output)       |
| `tauri:dev`    | Runs full app (frontend + Rust + window)        |
| `tauri:build`  | Creates distributable app (.app, .dmg, .exe)    |

**Key concepts in tasks.json:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Task Anatomy                                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  {                                                                   │
│    "label": "ui:dev",           ← Name shown in task picker          │
│    "type": "shell",             ← Run as shell command               │
│    "command": "pnpm",           ← The command to run                 │
│    "args": ["dev"],             ← Arguments passed to command        │
│    "isBackground": true,        ← Keeps running (doesn't block)      │
│    "problemMatcher": {...}      ← How to parse errors for IDE        │
│  }                                                                   │
│                                                                      │
│  problemMatcher:                                                     │
│  - Parses command output for errors/warnings                        │
│  - Shows them in VSCode's "Problems" panel                           │
│  - Allows click-to-navigate to error location                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ui:dev",
      "type": "shell",
      "command": "pnpm",
      "args": ["dev"],
      "isBackground": true,
      "problemMatcher": {
        "owner": "typescript",
        "fileLocation": "relative",
        "pattern": {
          "regexp": "^(.*):(\\d+):(\\d+): (error|warning): (.*)$",
          "file": 1,
          "line": 2,
          "column": 3,
          "severity": 4,
          "message": 5
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "VITE",
          "endsPattern": "ready in"
        }
      }
    },
    {
      "label": "ui:build",
      "type": "shell",
      "command": "pnpm",
      "args": ["build"]
    },
    {
      "label": "rust:build",
      "type": "cargo",
      "command": "build",
      "problemMatcher": ["$rustc"],
      "options": {
        "cwd": "${workspaceFolder}/src-tauri"
      }
    },
    {
      "label": "rust:check",
      "type": "cargo",
      "command": "check",
      "problemMatcher": ["$rustc"],
      "options": {
        "cwd": "${workspaceFolder}/src-tauri"
      }
    },
    {
      "label": "tauri:dev",
      "type": "shell",
      "command": "pnpm",
      "args": ["tauri", "dev"],
      "problemMatcher": []
    },
    {
      "label": "tauri:build",
      "type": "shell",
      "command": "pnpm",
      "args": ["tauri", "build"],
      "problemMatcher": []
    }
  ]
}
```

---

#### `.vscode/launch.json`

**Purpose:** Configures the debugger. Press `F5` to start debugging with breakpoints, variable inspection, and step-through execution.

**How to use:**

1. Set a breakpoint: Click left of line number in `src-tauri/src/main.rs`
2. Press `F5` or click the green play button in Debug sidebar
3. Select a configuration ("Tauri Dev Debug" or "Tauri Release Debug")

| Configuration          | When to Use                                       |
| ---------------------- | ------------------------------------------------- |
| `Tauri Dev Debug`      | Day-to-day development with hot reload            |
| `Tauri Release Debug`  | Testing production build with debug symbols       |

**Key concepts in launch.json:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Debug Configuration Anatomy                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  {                                                                   │
│    "type": "lldb",              ← Debugger type (CodeLLDB extension) │
│    "request": "launch",         ← Start new process (vs "attach")    │
│    "name": "Tauri Dev Debug",   ← Name shown in debug dropdown       │
│    "cargo": {                   ← Cargo build configuration          │
│      "args": ["build", ...]     ← Arguments for cargo build          │
│    },                                                                │
│    "preLaunchTask": "ui:dev"    ← Run this task first (from tasks)   │
│  }                                                                   │
│                                                                      │
│  Flow:                                                               │
│  1. Run "ui:dev" task (starts Vite frontend server)                 │
│  2. Build Rust with cargo                                            │
│  3. Launch app with debugger attached                                │
│  4. Hit breakpoints, inspect variables, step through code            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Debugging workflow:**

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        DEBUGGING IN VSCODE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Set breakpoint          2. Press F5              3. Debug!       │
│  ──────────────────         ─────────                ──────          │
│                                                                      │
│  fn main() {                ┌─────────────┐         Variables:       │
│  ● let x = 5;  ← click      │ ▶ Tauri Dev │         x = 5            │
│    println!(...);           │   Debug     │         name = "test"    │
│  }                          └─────────────┘                          │
│                                                                      │
│  ● = Breakpoint (red dot)   Select config           Execution pauses │
│                             from dropdown           at breakpoint    │
│                                                                      │
│  Debug Controls:  ▶ Continue  ⏭ Step Over  ⏬ Step Into  ⏹ Stop      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Dev Debug",
      "cargo": {
        "args": [
          "build",
          "--manifest-path=./src-tauri/Cargo.toml",
          "--no-default-features"
        ]
      },
      "preLaunchTask": "ui:dev"
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Release Debug",
      "cargo": {
        "args": [
          "build",
          "--release",
          "--manifest-path=./src-tauri/Cargo.toml"
        ]
      },
      "preLaunchTask": "ui:build"
    }
  ]
}
```

---

## React 101 for Novices

### TypeScript vs TSX

Before diving into React, let's clarify the file extensions:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FILE EXTENSIONS EXPLAINED                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Extension    Contains                  Use For                      │
│  ─────────    ────────                  ───────                      │
│                                                                      │
│  .js          JavaScript                Plain JavaScript code        │
│  .ts          TypeScript                TypeScript (no JSX/HTML)     │
│  .jsx         JavaScript + JSX          React components (JS)        │
│  .tsx         TypeScript + JSX          React components (TS) ✅     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why TSX?**

- `.ts` = TypeScript code, but **cannot** contain HTML-like JSX syntax
- `.tsx` = TypeScript + JSX, **can** contain HTML-like syntax

```typescript
// utils.ts - Pure TypeScript (no JSX)
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${seconds % 60}`;
}
```

```tsx
// Button.tsx - TypeScript + JSX (has HTML-like code)
function Button({ label }: { label: string }) {
  return <button className="btn">{label}</button>;  // ← This is JSX
}
```

**Rule of thumb:**
- Use `.ts` for utility functions, types, hooks without UI
- Use `.tsx` for any file that renders UI (contains `<tags>`)

---

### What is React?

React is a JavaScript library for building user interfaces. It lets you create reusable UI components.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         REACT MENTAL MODEL                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Traditional Web                      React Way                      │
│  ────────────────                     ──────────                     │
│                                                                      │
│  HTML + JS + CSS                      Components                     │
│  (separate files)                     (all-in-one)                   │
│                                                                      │
│  ┌────────────┐                       ┌────────────┐                │
│  │ index.html │                       │ App.tsx    │                │
│  ├────────────┤                       │ ┌────────┐ │                │
│  │ <div>      │                       │ │ HTML   │ │                │
│  │ <button>   │    ─────────▶         │ │ + JS   │ │                │
│  │ </div>     │                       │ │ + CSS  │ │                │
│  └────────────┘                       │ └────────┘ │                │
│  ┌────────────┐                       └────────────┘                │
│  │ script.js  │                                                      │
│  └────────────┘                       Components are                 │
│  ┌────────────┐                       self-contained                │
│  │ style.css  │                       and reusable                  │
│  └────────────┘                                                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Concepts

#### 1. Components

A component is a reusable piece of UI. Think of it like a custom HTML tag.

```tsx
// A simple component
function Greeting() {
  return <h1>Hello, JARVIS!</h1>;
}

// Using it (like an HTML tag)
<Greeting />
```

#### 2. JSX (JavaScript + HTML)

JSX lets you write HTML-like code inside JavaScript:

```tsx
// This is JSX
function App() {
  const name = "JARVIS";

  return (
    <div className="container">
      <h1>Welcome to {name}</h1>      {/* {curly braces} = JavaScript */}
      <button onClick={handleClick}>   {/* Events use camelCase */}
        Click me
      </button>
    </div>
  );
}
```

**JSX vs HTML differences:**
| HTML | JSX |
|------|-----|
| `class="..."` | `className="..."` |
| `onclick="..."` | `onClick={...}` |
| `for="..."` | `htmlFor="..."` |

#### 3. Props (Properties)

Props pass data from parent to child components:

```tsx
// Parent passes data
<DeviceSelector devices={["Mic 1", "Mic 2"]} onSelect={handleSelect} />

// Child receives it
function DeviceSelector({ devices, onSelect }) {
  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      {devices.map(device => (
        <option key={device}>{device}</option>
      ))}
    </select>
  );
}
```

#### 4. State (useState Hook)

State is data that can change. When state changes, React re-renders the UI.

```tsx
import { useState } from 'react';

function Counter() {
  // Declare state: [currentValue, setterFunction]
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

**Key rule:** Never modify state directly. Always use the setter:
```tsx
// ❌ WRONG
count = count + 1;

// ✅ CORRECT
setCount(count + 1);
```

#### 5. Effects (useEffect Hook)

Effects run code when something changes (like fetching data):

```tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

function DeviceList() {
  const [devices, setDevices] = useState<string[]>([]);

  // Run once when component mounts
  useEffect(() => {
    // Call Rust backend
    invoke<string[]>('list_audio_devices').then(setDevices);
  }, []);  // Empty array = run once on mount

  return (
    <ul>
      {devices.map(d => <li key={d}>{d}</li>)}
    </ul>
  );
}
```

#### 6. Events

React events are named using camelCase:

```tsx
function Button() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <button
      onClick={handleClick}           // Click event
      onMouseEnter={() => {}}         // Mouse enter
      onKeyDown={(e) => {}}           // Keyboard
    >
      Click me
    </button>
  );
}
```

### React + Tauri Communication

```
┌─────────────────────────────────────────────────────────────────────┐
│                    REACT ↔ TAURI COMMUNICATION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  React (Frontend)                     Rust (Backend)                 │
│  ────────────────                     ──────────────                 │
│                                                                      │
│  // Call Rust function                #[tauri::command]              │
│  import { invoke } from               fn greet(name: &str) -> String │
│    '@tauri-apps/api/core';            {                              │
│                                           format!("Hello, {}!", name)│
│  const result = await invoke(         }                              │
│    'greet',                                                          │
│    { name: 'World' }                  // Register in lib.rs          │
│  );                                   .invoke_handler(               │
│                                         generate_handler![greet]     │
│  // result = "Hello, World!"          )                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Example: JARVIS Device Selector

```tsx
// src/components/DeviceSelector.tsx
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface DeviceSelectorProps {
  onDeviceSelect: (device: string) => void;
}

function DeviceSelector({ onDeviceSelect }: DeviceSelectorProps) {
  // State for devices list and selected device
  const [devices, setDevices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch devices on mount
  useEffect(() => {
    invoke<string[]>('list_audio_devices')
      .then((deviceList) => {
        setDevices(deviceList);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to list devices:', err);
        setLoading(false);
      });
  }, []);

  // Handle selection change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const device = e.target.value;
    setSelected(device);
    onDeviceSelect(device);
  };

  if (loading) {
    return <p>Loading devices...</p>;
  }

  return (
    <div className="device-selector">
      <label htmlFor="device">Microphone:</label>
      <select
        id="device"
        value={selected}
        onChange={handleChange}
      >
        <option value="">Select a device...</option>
        {devices.map((device) => (
          <option key={device} value={device}>
            {device}
          </option>
        ))}
      </select>
    </div>
  );
}

export default DeviceSelector;
```

### File Structure Convention

```
src/
├── main.tsx              # Entry point (don't touch)
├── App.tsx               # Main app component
├── App.css               # App-level styles
├── components/           # Reusable components
│   ├── DeviceSelector.tsx
│   ├── RecordButton.tsx
│   └── Transcript.tsx
├── hooks/                # Custom React hooks
│   └── useAudioDevices.ts
├── types/                # TypeScript type definitions
│   └── index.ts
└── styles/               # CSS files
    └── components.css
```

---

## Quick Reference Commands

### Development

```bash
# Start development (frontend + Tauri)
pnpm tauri dev

# Just frontend (no Rust backend)
pnpm dev

# Check Rust compiles
cd src-tauri && cargo check

# Format Rust code
cd src-tauri && cargo fmt

# Lint Rust code
cd src-tauri && cargo clippy
```

### Build & Release

```bash
# Production build
pnpm tauri build

# Output location
# macOS: src-tauri/target/release/bundle/macos/JARVIS.app
# DMG:   src-tauri/target/release/bundle/dmg/JARVIS_x.x.x_aarch64.dmg
```

### Adding Dependencies

```bash
# Frontend (npm packages)
pnpm add <package-name>
pnpm add -D <dev-package>  # Dev dependency

# Backend (Rust crates)
cd src-tauri && cargo add <crate-name>
```

---

## Checklist: Before First Run

- [ ] **Rust installed**: `rustc --version` shows 1.92+
- [ ] **Node.js installed**: `node --version` shows v24+
- [ ] **pnpm installed**: `pnpm --version` works
- [ ] **VSCode extensions installed**: Tauri, rust-analyzer, CodeLLDB
- [ ] **Project created**: `pnpm create tauri-app jarvis-app`
- [ ] **Dependencies installed**: `cd jarvis-app && pnpm install`
- [ ] **VSCode config added**: `.vscode/` folder with settings

---

## Sources

- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri Create Project](https://v2.tauri.app/start/create-project/)
- [Tauri VSCode Debugging](https://v2.tauri.app/develop/debug/vscode/)
- [Tauri VSCode Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [pnpm Benchmarks](https://pnpm.io/benchmarks)
- [npm vs Yarn vs pnpm 2025](https://dev.to/hamzakhan/npm-vs-yarn-vs-pnpm-which-package-manager-should-you-use-in-2025-2f1g)
