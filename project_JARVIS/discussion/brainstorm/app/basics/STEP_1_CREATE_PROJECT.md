# JARVIS - Step 1: Create Tauri Project

## Overview

This guide walks through creating a Tauri project from scratch, explaining every component and what it does.

**Our choices (from WORKSPACE_SETUP.md):**

- Package manager: **pnpm** (fastest, 70% less disk space)
- Template: **React + TypeScript**
- IDE: **VSCode** with Tauri, rust-analyzer, CodeLLDB extensions

---

## Prerequisites Checklist

Before proceeding, verify your environment:

```bash
# Check each tool
rustc --version    # Expected: 1.92+
cargo --version    # Comes with Rust
node --version     # Expected: v24+
pnpm --version     # Expected: 9+ (install if missing)
```

### Install Rust (if not already done)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

After installation:

```bash
source ~/.zshrc   # Reload shell config
rustc --version   # Verify installation
```

### Install pnpm (if not already done)

```bash
# Using corepack (built into Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate

# Verify
pnpm --version
```

### Install VSCode Extensions

```bash
code --install-extension tauri-apps.tauri-vscode
code --install-extension rust-lang.rust-analyzer
code --install-extension vadimcn.vscode-lldb
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

---

## Step 1.1: Navigate to Project Directory

```bash
cd /Users/ankit/code/learn/mcp_servers/project_JARVIS
```

---

## Step 1.2: Create the Tauri Application

```bash
pnpm create tauri-app jarvis-app
```

### Interactive Prompts

The command will ask:

```text
✔ Project name · jarvis-app
✔ Identifier · com.jarvis.app
✔ Choose which language to use for your frontend · TypeScript / JavaScript
✔ Choose your package manager · pnpm
✔ Choose your UI template · React - (https://react.dev/)
✔ Choose your UI flavor · TypeScript
```

**Select these options:**

| Prompt                    | Selection                        |
| ------------------------- | -------------------------------- |
| Project name              | `jarvis-app` (already specified) |
| Identifier                | `com.jarvis.app`                 |
| Frontend language         | TypeScript / JavaScript          |
| Package manager           | **pnpm**                         |
| UI template               | **React**                        |
| UI flavor                 | **TypeScript**                   |

### What This Command Does

| Part          | Meaning                              |
| ------------- | ------------------------------------ |
| `pnpm create` | Runs a package initializer via pnpm |
| `tauri-app`   | Uses the Tauri project generator    |
| `jarvis-app`  | Project folder name                  |

---

## Step 1.3: Enter the Project Directory

```bash
cd jarvis-app
```

---

## Step 1.4: Install Dependencies

```bash
pnpm install
```

This installs:

- React and ReactDOM (UI library)
- TypeScript (type checking)
- Vite (frontend build tool)
- @tauri-apps/api (JavaScript API to talk to Rust)
- @tauri-apps/cli (Tauri development tools)

---

## Project Structure Explained

After creation, you'll have this structure:

```
jarvis-app/
│
├── src/                          # FRONTEND (React + TypeScript)
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Main React component
│   ├── App.css                   # Component styles
│   ├── styles.css                # Global styles
│   └── assets/                   # Static assets (images, fonts)
│       └── react.svg
│
├── src-tauri/                    # BACKEND (Rust + Tauri)
│   ├── Cargo.toml                # Rust dependencies (like package.json)
│   ├── tauri.conf.json           # Tauri configuration
│   ├── build.rs                  # Rust build script
│   ├── icons/                    # App icons for all platforms
│   │   ├── icon.ico              # Windows
│   │   ├── icon.icns             # macOS
│   │   └── *.png                 # Various sizes
│   └── src/
│       ├── main.rs               # Rust entry point
│       └── lib.rs                # Tauri commands and setup
│
├── public/                       # Static files served as-is
│   └── vite.svg
│
├── package.json                  # Node.js dependencies
├── package-lock.json             # Dependency lock file
├── tsconfig.json                 # TypeScript configuration
├── tsconfig.node.json            # TypeScript config for Node
├── vite.config.ts                # Vite bundler configuration
├── index.html                    # HTML entry point
└── README.md                     # Project documentation
```

---

## Key Files Deep Dive

### Frontend Files

#### `index.html`
The single HTML page that hosts the React app.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tauri + React + Typescript</title>
  </head>
  <body>
    <div id="root"></div>          <!-- React mounts here -->
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### `src/main.tsx`
React's entry point — mounts the app to the DOM.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

#### `src/App.tsx`
The main React component. This is where we'll build the JARVIS UI.

```tsx
function App() {
  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>
      {/* Your UI goes here */}
    </div>
  );
}

export default App;
```

#### `package.json`
Node.js dependencies and scripts.

```json
{
  "name": "jarvis-app",
  "scripts": {
    "dev": "vite",                    // Frontend dev server only
    "build": "tsc && vite build",     // Build frontend only
    "preview": "vite preview",        // Preview production build
    "tauri": "tauri"                  // Run Tauri commands
  },
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "@tauri-apps/api": "^2.x"         // Talk to Rust backend
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.x",        // Tauri CLI
    "typescript": "^5.x",
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x"
  }
}
```

**Key Scripts:**

| Command             | What It Does                                 |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Starts Vite dev server (frontend only)       |
| `pnpm tauri dev`    | Starts full app (frontend + Rust backend)    |
| `pnpm tauri build`  | Creates production .app bundle               |

---

### Backend Files

#### `src-tauri/Cargo.toml`
Rust's package manifest — equivalent to package.json.

```toml
[package]
name = "jarvis-app"
version = "0.1.0"
edition = "2024"
description = "JARVIS - Real-time conversation transcription and coaching"

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**Sections Explained:**

| Section | Purpose |
|---------|---------|
| `[package]` | Metadata about the project |
| `[build-dependencies]` | Dependencies needed during compilation |
| `[dependencies]` | Runtime dependencies |
| `features = []` | Optional features to enable |

**Key Dependencies:**

| Crate | Purpose |
|-------|---------|
| `tauri` | The Tauri framework itself |
| `tauri-build` | Builds the Tauri app |
| `tauri-plugin-shell` | Execute shell commands |
| `serde` | Serialize/deserialize data (JSON <-> Rust) |
| `serde_json` | JSON parsing |

#### `src-tauri/tauri.conf.json`
Tauri's configuration file — controls window, permissions, bundling.

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "jarvis-app",
  "version": "0.1.0",
  "identifier": "com.jarvis.app",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "jarvis-app",
        "width": 800,
        "height": 600,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ]
  }
}
```

**Key Sections:**

| Section | Purpose |
|---------|---------|
| `productName` | Display name of the app |
| `identifier` | Unique app ID (reverse domain notation) |
| `build.beforeDevCommand` | Command to run before `tauri dev` |
| `build.devUrl` | URL where Vite dev server runs |
| `app.windows` | Window configuration (size, title, etc.) |
| `bundle` | How to package the app for distribution |

#### `src-tauri/src/main.rs`
The Rust entry point.

```rust
// Prevents console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    jarvis_app_lib::run()  // Calls the run() function from lib.rs
}
```

#### `src-tauri/src/lib.rs`
Where you define Tauri commands and app setup.

```rust
// Define a command callable from JavaScript
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// Configure and run the app
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![greet])  // Register commands
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**How Commands Work:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TAURI COMMAND FLOW                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Frontend (React)                     Backend (Rust)                 │
│  ────────────────                     ──────────────                 │
│                                                                      │
│  import { invoke } from               #[tauri::command]              │
│    '@tauri-apps/api/core';            fn greet(name: &str) -> String │
│                                       {                              │
│  const result = await                     format!("Hello, {}!", name)│
│    invoke('greet', { name: 'World' });  }                            │
│           │                                        ▲                 │
│           │                                        │                 │
│           └────────────── IPC ─────────────────────┘                 │
│                                                                      │
│  result = "Hello, World!..."                                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### `src-tauri/build.rs`
Build script that runs before compilation.

```rust
fn main() {
    tauri_build::build()
}
```

This generates necessary code for Tauri to work.

---

## Configuration Files

#### `vite.config.ts`

**What is Vite?**

Vite (French for "fast", pronounced "veet") is the frontend build tool in your Tauri project.

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         WHAT VITE DOES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Development Mode (pnpm dev):                                        │
│  ─────────────────────────────                                       │
│  - Runs a local server at http://localhost:1420                     │
│  - Instant hot reload when you edit React/TS files                  │
│  - No waiting for rebuilds - changes appear in <100ms               │
│                                                                      │
│  Production Build (pnpm build):                                      │
│  ──────────────────────────────                                      │
│  - Bundles all JS/TS/CSS into optimized files                       │
│  - Tree-shakes unused code (smaller bundle)                         │
│  - Outputs to dist/ folder                                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Why Vite instead of Webpack?**

- **10-100x faster** dev server startup
- Uses native ES modules (no bundling during dev)
- Built-in TypeScript support
- Created by Vue.js author, now widely adopted

**How Tauri uses Vite:**

```text
pnpm tauri dev
      │
      ├──► Vite starts at localhost:1420 (frontend)
      │
      └──► Tauri opens WebView pointing to localhost:1420
              │
              └──► You see React app in native window
```

**Vite-related files:**

| File             | Role                                          |
| ---------------- | --------------------------------------------- |
| `vite.config.ts` | Vite configuration                            |
| `src/*.tsx`      | Vite compiles these React/TypeScript files    |
| `index.html`     | Vite's entry point (loads `src/main.tsx`)     |
| `dist/`          | Vite's production output (after build)        |

**Configuration:**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,           // Don't clear terminal for Tauri logs
  server: {
    port: 1420,                 // Dev server port
    strictPort: true,           // Fail if port is in use
    watch: {
      ignored: ["**/src-tauri/**"],  // Don't watch Rust files
    },
  },
});
```

#### `tsconfig.json`
TypeScript configuration.

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

---

## Step 1.5: Set Up VSCode Workspace

Before first run, create the `.vscode/` folder with configuration files.

See **WORKSPACE_SETUP.md** for complete file contents, or copy these files:

```bash
mkdir -p .vscode
```

Create these files (contents in WORKSPACE_SETUP.md):

- `.vscode/settings.json` - Editor formatting rules
- `.vscode/extensions.json` - Recommended extensions
- `.vscode/tasks.json` - Build/run tasks (Cmd+Shift+B)
- `.vscode/launch.json` - Debugger config (F5)

---

## Step 1.6: First Run

```bash
pnpm tauri dev
```

### What Happens

1. **Vite starts** at `http://localhost:1420` (frontend dev server)
2. **Cargo compiles** the Rust backend (first time takes 1-3 minutes)
3. **Native window opens** with the React app inside

### Expected Result

A window opens showing:

- "Welcome to Tauri + React + TypeScript"
- Default Tauri template UI

### First Run is Slow

The first `pnpm tauri dev` takes longer because:

- Cargo downloads all Rust dependencies
- Compiles the entire Rust codebase

Subsequent runs are much faster (incremental compilation).

---

## Troubleshooting

### "command not found: cargo"

Rust is not in PATH. Run:
```bash
source ~/.zshrc
# or
source ~/.cargo/env
```

### "Xcode Command Line Tools required"

On macOS, install:
```bash
xcode-select --install
```

### Port 1420 already in use

Kill the process:
```bash
lsof -i :1420
kill -9 <PID>
```

Or change the port in `vite.config.ts`.

### Rust compilation errors

Check Rust installation:
```bash
rustup update
rustc --version
```

---

## Success Criteria

| Check                    | Expected                 |
| ------------------------ | ------------------------ |
| `pnpm tauri dev` runs    | No errors                |
| Window opens             | Yes                      |
| UI displays              | Template content visible |
| No console errors        | Clean output             |

---

## What's Next

After verifying the template works:

1. **Customize the window title** → Edit `tauri.conf.json`
2. **Customize the UI** → Edit `src/App.tsx`
3. **Add Rust commands** → Edit `src-tauri/src/lib.rs`
4. **Add audio capture** → Add `cpal` to `Cargo.toml`

---

## Quick Reference

| Task                   | Command                            |
| ---------------------- | ---------------------------------- |
| Run in dev mode        | `pnpm tauri dev`                   |
| Build for production   | `pnpm tauri build`                 |
| Check Rust compiles    | `cd src-tauri && cargo check`      |
| Format Rust code       | `cd src-tauri && cargo fmt`        |
| Lint Rust code         | `cd src-tauri && cargo clippy`     |
| Add Rust dependency    | `cd src-tauri && cargo add <crate>`|
| Add JS dependency      | `pnpm add <package>`               |
| Add JS dev dependency  | `pnpm add -D <package>`            |

---

## File Quick Reference

| File | Purpose | When to Edit |
|------|---------|--------------|
| `src/App.tsx` | Main UI component | Adding UI features |
| `src-tauri/src/lib.rs` | Rust commands | Adding backend logic |
| `src-tauri/Cargo.toml` | Rust dependencies | Adding crates |
| `src-tauri/tauri.conf.json` | App config | Window/permission changes |
| `package.json` | JS dependencies | Adding npm packages |
