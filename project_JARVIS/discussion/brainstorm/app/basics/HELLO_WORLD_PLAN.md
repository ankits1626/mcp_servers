# JARVIS - Hello World Setup Plan

## Goal

Create a minimal Tauri + React app to verify the development environment works before adding audio/transcription features.

---

## What We'll Build

A simple window that:
1. Displays "Hello from JARVIS"
2. Has a button that calls a Rust backend function
3. Shows the response from Rust in the UI

```
┌─────────────────────────────────────────────────────────────────┐
│  JARVIS                                              [─] [□] [×] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      Hello from JARVIS                           │
│                                                                  │
│                    [ Greet from Rust ]                           │
│                                                                  │
│                  Response: "Hello, World!"                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites Check

Before starting, verify you have:

| Tool | Check Command | Required Version |
|------|---------------|------------------|
| Rust | `rustc --version` | 1.92+ |
| Cargo | `cargo --version` | (comes with Rust) |
| Node.js | `node --version` | 24+ |
| npm | `npm --version` | 11+ |

### Install Missing Tools

**Rust** (if not installed):
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Node.js** (if not installed):
```bash
# Using Homebrew on macOS
brew install node
```

---

## Step 1: Create Tauri Project

```bash
# Navigate to project directory
cd /Users/ankit/code/learn/mcp_servers/project_JARVIS

# Create Tauri app with React + TypeScript template
npm create tauri-app@latest jarvis-app -- --template react-ts

# Enter the created directory
cd jarvis-app
```

---

## Step 2: Project Structure (After Creation)

```
jarvis-app/
├── src/                      # Frontend (React)
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Main component
│   ├── App.css               # Styles
│   └── assets/               # Images, icons
│
├── src-tauri/                # Backend (Rust)
│   ├── Cargo.toml            # Rust dependencies
│   ├── tauri.conf.json       # Tauri config
│   ├── build.rs              # Build script
│   └── src/
│       └── main.rs           # Rust entry point
│
├── package.json              # Node dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts            # Vite bundler config
└── index.html                # HTML entry
```

---

## Step 3: Install Dependencies

```bash
# Install frontend dependencies
npm install

# This also triggers Cargo to download Rust dependencies
```

---

## Step 4: Run in Development Mode

```bash
npm run tauri dev
```

**What happens:**
1. Vite starts the frontend dev server (hot reload)
2. Cargo compiles the Rust backend (first time takes longer)
3. A native window opens with your app

---

## Step 5: Verify It Works

**Expected result:**
- A window opens
- You see the default Tauri + React template
- The window title shows the app name

---

## Step 6: Customize for JARVIS

After verifying the template works, we'll modify:

### Frontend (`src/App.tsx`)
- Change title to "JARVIS"
- Add a "Greet" button
- Display response from Rust

### Backend (`src-tauri/src/main.rs`)
- Add a `greet` command
- Return "Hello from JARVIS backend!"

### Config (`src-tauri/tauri.conf.json`)
- Set window title to "JARVIS"
- Set window size to 800x600

---

## Success Criteria

| Check | Expected |
|-------|----------|
| `npm run tauri dev` runs without errors | Yes |
| Window opens | Yes |
| Frontend displays content | Yes |
| Button click triggers Rust function | Yes |
| Response appears in UI | Yes |

---

## Troubleshooting

### "command not found: cargo"
Rust not installed or not in PATH. Run:
```bash
source ~/.cargo/env
```

### "Xcode Command Line Tools required"
On macOS, install:
```bash
xcode-select --install
```

### Build fails with WebKit error
Ensure macOS is updated (WebKit comes with the OS).

### Port 1420 already in use
Kill the process or change the port in `vite.config.ts`.

---

## Next Steps (After Hello World Works)

1. **Add audio dependencies** to Cargo.toml (cpal)
2. **List audio devices** via Rust command
3. **Display device dropdown** in React
4. **Capture audio** from selected device
5. **Add whisper-rs** for transcription

---

## Commands Reference

```bash
# Development
npm run tauri dev           # Run app in dev mode

# Build
npm run tauri build         # Build production .app

# Rust-specific
cd src-tauri
cargo check                 # Check for compile errors
cargo fmt                   # Format Rust code
cargo clippy                # Lint Rust code
```

---

## Estimated Time

| Step | Time |
|------|------|
| Prerequisites check | 2 min |
| Create project | 1 min |
| Install dependencies | 2-5 min |
| First build + run | 3-5 min |
| Customize for JARVIS | 5 min |
| **Total** | **~15 min** |
