# JARVIS MVP - Implementation Plan

## Overview

This document provides step-by-step implementation instructions for the JARVIS MVP:
**Microphone → Transcription → Display**

---

## Technology Primer

If you're new to Rust, Cargo, and Tauri, this section explains what each technology does and how they fit together.

### The Big Picture

JARVIS uses a **pluggable architecture** — the core app handles audio capture and UI, while processing backends are configurable (embedded, cloud, or custom).

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JARVIS APPLICATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        FRONTEND (What you see)                      │   │
│   │                                                                     │   │
│   │   Built with: React + TypeScript                                    │   │
│   │   Runs in: System WebView (like a browser, but native)              │   │
│   │   Package manager: npm/pnpm                                         │   │
│   │                                                                     │   │
│   │   Files: src/*.tsx, src/*.css, package.json                         │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                         │
│                                   │ IPC (Inter-Process Communication)       │
│                                   │ invoke('command_name', { args })        │
│                                   │                                         │
│   ┌───────────────────────────────▼─────────────────────────────────────┐   │
│   │                     TAURI CORE (Orchestrator)                       │   │
│   │                                                                     │   │
│   │   • Audio capture (cpal)         • State management                 │   │
│   │   • Backend routing              • Event emission                   │   │
│   │   • Configuration loading        • Session management               │   │
│   │                                                                     │   │
│   │   Files: src-tauri/src/*.rs, src-tauri/Cargo.toml                   │   │
│   └───────────────────────────────┬─────────────────────────────────────┘   │
│                                   │                                         │
│                                   │ Backend Trait (pluggable interface)     │
│                                   │                                         │
│   ┌───────────────────────────────▼─────────────────────────────────────┐   │
│   │                    CONFIGURABLE BACKENDS                            │   │
│   │                                                                     │   │
│   │   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │   │
│   │   │  EMBEDDED   │   │    CLOUD    │   │   CUSTOM    │               │   │
│   │   │  (Default)  │   │  (Optional) │   │  (Extend)   │               │   │
│   │   ├─────────────┤   ├─────────────┤   ├─────────────┤               │   │
│   │   │ whisper.cpp │   │ OpenAI API  │   │ Your Server │               │   │
│   │   │ (local STT) │   │ Whisper API │   │ Custom ASR  │               │   │
│   │   │             │   │ Deepgram    │   │ On-prem     │               │   │
│   │   │ Zero deps   │   │ AssemblyAI  │   │ Hybrid      │               │   │
│   │   │ Offline OK  │   │ Google STT  │   │             │               │   │
│   │   │ Privacy++   │   │ Azure STT   │   │             │               │   │
│   │   └─────────────┘   └─────────────┘   └─────────────┘               │   │
│   │                                                                     │   │
│   │   Selection via: config.toml or runtime toggle                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend Configuration

Backends are selected via a config file or at runtime:

```toml
# ~/.config/jarvis/config.toml

[transcription]
# Options: "embedded", "cloud", "custom"
backend = "embedded"

[transcription.embedded]
model = "base.en"           # tiny.en, base.en, small.en, medium.en
model_path = "~/.local/share/jarvis/models/"

[transcription.cloud]
provider = "openai"         # openai, deepgram, assemblyai, google, azure
api_key_env = "OPENAI_API_KEY"   # Read from environment variable
# api_key = "sk-..."        # Or hardcode (not recommended)

[transcription.custom]
endpoint = "http://localhost:8080/transcribe"
auth_header = "X-API-Key"
auth_value_env = "CUSTOM_ASR_KEY"
```

### Backend Trait (Rust)

All backends implement the same interface — swap them without changing app code:

```rust
/// Trait that all transcription backends must implement
pub trait TranscriptionBackend: Send + Sync {
    /// Transcribe audio samples and return text
    fn transcribe(&self, samples: &[f32], sample_rate: u32) -> Result<String, BackendError>;

    /// Check if the backend is ready (model loaded, API reachable, etc.)
    fn is_ready(&self) -> bool;

    /// Get backend name for logging/display
    fn name(&self) -> &str;

    /// Optional: streaming transcription for real-time
    fn transcribe_stream(&self, _receiver: AudioReceiver) -> Option<TranscriptStream> {
        None  // Default: not supported
    }
}

// Implementations
pub struct EmbeddedBackend { /* whisper.cpp */ }
pub struct CloudBackend { /* OpenAI, Deepgram, etc. */ }
pub struct CustomBackend { /* HTTP endpoint */ }

impl TranscriptionBackend for EmbeddedBackend { ... }
impl TranscriptionBackend for CloudBackend { ... }
impl TranscriptionBackend for CustomBackend { ... }
```

### Why This Matters

| Use Case | Best Backend | Reason |
|----------|--------------|--------|
| Privacy-sensitive | Embedded | Data never leaves device |
| Offline use | Embedded | No internet required |
| Low-latency | Embedded | No network round-trip |
| High accuracy | Cloud | Larger models, more compute |
| Enterprise | Custom | On-prem requirements |
| Experimentation | Custom | Try new ASR systems |

### Backend Selection Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│                        BACKEND SELECTION FLOW                             │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│   App Starts                                                              │
│       │                                                                   │
│       ▼                                                                   │
│   Load config.toml                                                        │
│       │                                                                   │
│       ├── backend = "embedded" ──▶ Load whisper.cpp model                 │
│       │                                                                   │
│       ├── backend = "cloud" ──▶ Validate API key, test connection         │
│       │                                                                   │
│       └── backend = "custom" ──▶ Ping custom endpoint                     │
│                                                                           │
│       │                                                                   │
│       ▼                                                                   │
│   Backend Ready ──▶ Start audio capture ──▶ Route audio to backend        │
│                                                                           │
│   Runtime Switch (optional):                                              │
│   User can switch backends via Settings UI without restarting             │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### What is Rust?

**Rust** is a systems programming language — think C/C++ but with modern safety features.

| Aspect | What it means for you |
|--------|----------------------|
| **Fast** | Compiles to native machine code, no runtime overhead |
| **Safe** | Compiler catches memory bugs before you run the code |
| **No garbage collector** | Predictable performance, important for real-time audio |

**Key Rust concepts you'll encounter:**

```rust
// 1. Variables are immutable by default
let x = 5;           // Can't change x
let mut y = 5;       // Can change y (mut = mutable)

// 2. Functions return the last expression (no 'return' needed)
fn add(a: i32, b: i32) -> i32 {
    a + b    // No semicolon = this is the return value
}

// 3. Result<T, E> for error handling (instead of exceptions)
fn might_fail() -> Result<String, String> {
    Ok("success".to_string())    // Success case
    // or
    Err("something went wrong".to_string())  // Error case
}

// Using Result with ? operator (propagates errors automatically)
fn do_stuff() -> Result<(), String> {
    let value = might_fail()?;  // If error, returns early
    println!("{}", value);
    Ok(())
}

// 4. Option<T> for nullable values (no null in Rust)
let maybe_value: Option<String> = Some("hello".to_string());
let nothing: Option<String> = None;

// 5. Structs (like classes without inheritance)
struct AudioDevice {
    name: String,
    is_default: bool,
}

// 6. impl blocks add methods to structs
impl AudioDevice {
    fn new(name: String) -> Self {
        Self { name, is_default: false }
    }
}

// 7. Traits (like interfaces)
trait Playable {
    fn play(&self);
}

// 8. References & Borrowing
let s = String::from("hello");
let r = &s;      // Borrow (read-only reference)
let m = &mut s;  // Mutable borrow (can modify)
// Rust ensures you can't have bugs from dangling pointers

// 9. Arc<Mutex<T>> for sharing data between threads
use std::sync::{Arc, Mutex};
let shared_data = Arc::new(Mutex::new(Vec::new()));
// Arc = Atomic Reference Count (thread-safe pointer)
// Mutex = Mutual Exclusion (only one thread can access at a time)
```

### What is Cargo?

**Cargo** is Rust's package manager and build system (like npm for JavaScript).

```bash
# Key Cargo commands
cargo new myproject     # Create new project
cargo build             # Compile the project
cargo run               # Compile and run
cargo test              # Run tests
cargo add cpal          # Add a dependency (like npm install)
```

**Cargo.toml** — The project manifest (like package.json):

```toml
[package]
name = "jarvis-app"        # Project name
version = "0.1.0"          # Version
edition = "2021"           # Rust edition (language version)

[dependencies]
tauri = "2"                # Dependencies (like npm packages)
cpal = "0.15"              # cpal = Cross-Platform Audio Library
serde = "1"                # Serialization (JSON <-> Rust structs)

[build-dependencies]
tauri-build = "2"          # Build-time dependencies
```

**Crates** — Rust's term for packages/libraries:
- `cpal` = Cross-Platform Audio Library (microphone access)
- `whisper-rs` = Rust bindings for whisper.cpp (speech-to-text)
- `serde` = Serialization/deserialization (convert data to/from JSON)
- `tokio` = Async runtime (handle concurrent operations)

### What is Tauri?

**Tauri** is a framework for building desktop apps with web technologies.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              TAURI vs ELECTRON                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ELECTRON                              TAURI                                │
│   ────────                              ─────                                │
│   - Ships Chromium browser              - Uses system WebView                │
│   - 150MB+ bundle size                  - 3-10MB bundle size                 │
│   - JavaScript backend                  - Rust backend                       │
│   - High memory usage                   - Low memory usage                   │
│   - Slower startup                      - Fast startup                       │
│                                                                              │
│   Same frontend: React, Vue, Svelte, vanilla JS/HTML/CSS                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**How Tauri works:**

1. **Frontend** (React/TypeScript) runs in a WebView
2. **Backend** (Rust) runs as native code
3. **Communication** happens via "commands" (like API endpoints)

```
Frontend (React)                    Backend (Rust)
────────────────                    ──────────────

// Call a Rust function             // Define the command
invoke('list_audio_devices')   ──►  #[tauri::command]
                                    fn list_audio_devices() -> Vec<String> {
                                        // Access microphones
                                    }
                               ◄──  Returns data as JSON

// Listen for events                // Emit events
listen('transcript', callback) ◄──  app.emit("transcript", "Hello world")
```

**Key Tauri concepts:**

```rust
// 1. Commands — Functions callable from frontend
#[tauri::command]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

// 2. State — Shared data across commands
#[tauri::command]
fn get_count(state: State<Arc<AppState>>) -> i32 {
    *state.count.lock().unwrap()
}

// 3. Events — Push data to frontend
app.emit("transcript", "New text here")?;

// 4. App setup — Register everything
tauri::Builder::default()
    .manage(AppState::new())           // Add state
    .invoke_handler(tauri::generate_handler![
        greet,                          // Register commands
        get_count,
    ])
    .run(tauri::generate_context!())
```

### Project Structure Explained

```
jarvis-app/
│
├── src/                          # FRONTEND (React/TypeScript)
│   ├── main.tsx                  # Entry point
│   ├── App.tsx                   # Main component
│   ├── App.css                   # Styles
│   └── components/               # React components
│       ├── DeviceSelector.tsx
│       ├── RecordButton.tsx
│       └── Transcript.tsx
│
├── src-tauri/                    # BACKEND (Rust/Tauri)
│   ├── Cargo.toml                # Rust dependencies (like package.json)
│   ├── tauri.conf.json           # Tauri config (window size, permissions)
│   ├── build.rs                  # Build script
│   └── src/
│       ├── main.rs               # Entry point + Tauri setup
│       ├── audio.rs              # Microphone handling
│       ├── state.rs              # Shared application state
│       └── transcription.rs      # Whisper integration
│
├── package.json                  # Node.js dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite bundler config
└── index.html                    # HTML entry point
```

### How the Pieces Connect

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DATA FLOW IN JARVIS                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER CLICKS "START RECORDING"                                            │
│     │                                                                        │
│     ▼                                                                        │
│  2. React calls: invoke('start_recording', { deviceName: '...' })            │
│     │                                                                        │
│     ▼                                                                        │
│  3. Rust command receives call, starts audio capture via cpal                │
│     │                                                                        │
│     ▼                                                                        │
│  4. Audio samples flow into buffer (Arc<Mutex<Vec<f32>>>)                    │
│     │                                                                        │
│     ▼                                                                        │
│  5. Background thread processes buffer every 2 seconds                       │
│     │                                                                        │
│     ▼                                                                        │
│  6. Whisper transcribes audio chunk to text                                  │
│     │                                                                        │
│     ▼                                                                        │
│  7. Rust emits: app.emit("transcript", "transcribed text")                   │
│     │                                                                        │
│     ▼                                                                        │
│  8. React listener receives text, updates state, re-renders UI               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Rust Syntax Quick Reference

| Syntax | Meaning | Example |
|--------|---------|---------|
| `let` | Variable declaration | `let x = 5;` |
| `mut` | Mutable variable | `let mut x = 5;` |
| `fn` | Function | `fn foo() {}` |
| `->` | Return type | `fn foo() -> i32` |
| `&` | Reference (borrow) | `&my_string` |
| `&mut` | Mutable reference | `&mut my_string` |
| `::` | Path separator | `std::sync::Mutex` |
| `?` | Propagate error | `file.read()?` |
| `.unwrap()` | Panic if error (avoid in production) | `result.unwrap()` |
| `impl` | Implementation block | `impl MyStruct {}` |
| `#[...]` | Attribute/annotation | `#[tauri::command]` |
| `pub` | Public visibility | `pub fn foo()` |
| `mod` | Module declaration | `mod audio;` |
| `use` | Import | `use std::sync::Arc;` |

### Common Patterns You'll See

```rust
// Pattern 1: Mutex for thread-safe state
let data = state.my_data.lock().map_err(|e| e.to_string())?;

// Pattern 2: Option handling
if let Some(value) = optional_value {
    // Use value
}

// Pattern 3: Result handling with match
match some_operation() {
    Ok(result) => println!("Success: {}", result),
    Err(e) => eprintln!("Error: {}", e),
}

// Pattern 4: Cloning Arc for threads
let buffer_clone = Arc::clone(&state.audio_buffer);
thread::spawn(move || {
    // Use buffer_clone in new thread
});

// Pattern 5: Converting Rust structs to JSON (via serde)
#[derive(Serialize)]  // This makes it JSON-serializable
struct AudioDevice {
    name: String,
    is_default: bool,
}
```

### Development Workflow

```bash
# Terminal 1: Run the app in dev mode
npm run tauri dev

# What happens:
# 1. Vite starts dev server for frontend (hot reload)
# 2. Cargo compiles Rust backend
# 3. Tauri launches the app window
# 4. Changes to frontend: instant reload
# 5. Changes to Rust: recompile (~5-10 seconds)

# Build for production
npm run tauri build
# Output: src-tauri/target/release/bundle/
```

### Helpful Commands

```bash
# Check Rust code compiles without running
cargo check

# Run Rust tests
cargo test

# See compiler errors with more detail
cargo build 2>&1 | head -50

# Format Rust code
cargo fmt

# Lint Rust code
cargo clippy

# Add a Rust dependency
cargo add serde --features derive

# View dependency tree
cargo tree
```

---

## Prerequisites

### Development Environment

```bash
# Required tools (as of January 2026)
- Rust (1.92+): rustup.rs
- Node.js (24+): nodejs.org
- npm (11+)
- Xcode Command Line Tools (macOS)
```

### Your Current Versions

| Tool | Your Version | Minimum Required |
|------|--------------|------------------|
| Node.js | v24.1.0 | 18+ |
| npm | 11.6.0 | 9+ |
| Rust | (installing) | 1.92+ |
| Cargo | (comes with Rust) | - |

### Verify Setup

```bash
rustc --version    # Should be 1.92+
node --version     # Should be 24+ (you have v24.1.0)
cargo --version    # Should be installed
npm --version      # Should be 11+ (you have 11.6.0)
```

---

## Phase 1: Project Scaffolding

### Step 1.1: Create Tauri Project

```bash
cd /Users/ankit/code/learn/mcp_servers/project_JARVIS

# Create Tauri app with React TypeScript template
npm create tauri-app@latest jarvis-app -- --template react-ts

cd jarvis-app
npm install
```

### Step 1.2: Verify Scaffold Works

```bash
npm run tauri dev
```

Expected: Empty React app launches in a native window.

### Step 1.3: Update Cargo.toml

Edit `src-tauri/Cargo.toml`:

```toml
[package]
name = "jarvis-app"
version = "0.1.0"
edition = "2024"  # Latest Rust edition

[dependencies]
tauri = { version = "2.9", features = ["devtools"] }
tauri-plugin-shell = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }

# Audio capture
cpal = "0.15"

# Transcription (add in Phase 2)
# whisper-rs = "0.15"   # Latest: 0.15.1 (Sep 2025)
# hound = "3.5"

[build-dependencies]
tauri-build = { version = "2", features = [] }
```

**Version Reference (January 2026):**

| Crate | Version | Notes |
|-------|---------|-------|
| tauri | 2.9.x | Latest stable |
| whisper-rs | 0.15.1 | Rust bindings for whisper.cpp |
| cpal | 0.15 | Cross-platform audio |
| tokio | 1.x | Async runtime |

### Step 1.4: Project Structure

Create this file structure in `src-tauri/src/`:

```
src-tauri/src/
├── main.rs          # Entry point
├── lib.rs           # Tauri command exports
├── audio.rs         # Audio device listing & capture
└── state.rs         # Shared state management
```

---

## Phase 2: Audio Device Listing

### Step 2.1: Create audio.rs

```rust
// src-tauri/src/audio.rs

use cpal::traits::{DeviceTrait, HostTrait};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct AudioDevice {
    pub name: String,
    pub is_default: bool,
}

/// List all available input devices (microphones)
pub fn list_input_devices() -> Vec<AudioDevice> {
    let host = cpal::default_host();
    let default_device_name = host
        .default_input_device()
        .and_then(|d| d.name().ok());

    host.input_devices()
        .map(|devices| {
            devices
                .filter_map(|device| {
                    device.name().ok().map(|name| AudioDevice {
                        is_default: Some(&name) == default_device_name.as_ref(),
                        name,
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_list_devices() {
        let devices = list_input_devices();
        println!("Found {} input devices:", devices.len());
        for d in &devices {
            println!("  - {} (default: {})", d.name, d.is_default);
        }
        // Should find at least one device on most systems
        assert!(!devices.is_empty() || cfg!(ci));
    }
}
```

### Step 2.2: Create state.rs

```rust
// src-tauri/src/state.rs

use std::sync::{Arc, Mutex};
use cpal::Stream;

/// Application state shared across commands
pub struct AppState {
    pub selected_device: Mutex<Option<String>>,
    pub is_recording: Mutex<bool>,
    pub audio_stream: Mutex<Option<Stream>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            selected_device: Mutex::new(None),
            is_recording: Mutex::new(false),
            audio_stream: Mutex::new(None),
        }
    }
}

impl AppState {
    pub fn new() -> Arc<Self> {
        Arc::new(Self::default())
    }
}
```

### Step 2.3: Create lib.rs with Commands

```rust
// src-tauri/src/lib.rs

mod audio;
mod state;

use audio::AudioDevice;
use state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
fn list_audio_devices() -> Vec<AudioDevice> {
    audio::list_input_devices()
}

#[tauri::command]
fn select_device(name: String, state: State<Arc<AppState>>) -> Result<(), String> {
    let mut selected = state.selected_device.lock().map_err(|e| e.to_string())?;
    *selected = Some(name);
    Ok(())
}

#[tauri::command]
fn get_selected_device(state: State<Arc<AppState>>) -> Option<String> {
    state.selected_device.lock().ok().and_then(|d| d.clone())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            select_device,
            get_selected_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 2.4: Update main.rs

```rust
// src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    jarvis_app_lib::run()
}
```

Wait — Tauri 2.x uses a different structure. Let me fix:

```rust
// src-tauri/src/main.rs

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod state;

use audio::AudioDevice;
use state::AppState;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
fn list_audio_devices() -> Vec<AudioDevice> {
    audio::list_input_devices()
}

#[tauri::command]
fn select_device(name: String, state: State<Arc<AppState>>) -> Result<(), String> {
    let mut selected = state.selected_device.lock().map_err(|e| e.to_string())?;
    *selected = Some(name);
    Ok(())
}

#[tauri::command]
fn get_selected_device(state: State<Arc<AppState>>) -> Option<String> {
    state.selected_device.lock().ok().and_then(|d| d.clone())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            list_audio_devices,
            select_device,
            get_selected_device,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step 2.5: Test Device Listing

```bash
cd jarvis-app
cargo test -p jarvis-app
```

---

## Phase 3: Frontend - Device Selector

### Step 3.1: Create DeviceSelector Component

```tsx
// src/components/DeviceSelector.tsx

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface AudioDevice {
  name: string;
  is_default: boolean;
}

interface Props {
  onDeviceSelect: (deviceName: string) => void;
}

export function DeviceSelector({ onDeviceSelect }: Props) {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDevices() {
      try {
        const deviceList = await invoke<AudioDevice[]>('list_audio_devices');
        setDevices(deviceList);

        // Auto-select default device
        const defaultDevice = deviceList.find(d => d.is_default);
        if (defaultDevice) {
          setSelected(defaultDevice.name);
          onDeviceSelect(defaultDevice.name);
        }
      } catch (err) {
        console.error('Failed to load devices:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDevices();
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelected(name);
    await invoke('select_device', { name });
    onDeviceSelect(name);
  };

  if (loading) {
    return <div className="device-selector">Loading devices...</div>;
  }

  return (
    <div className="device-selector">
      <label htmlFor="mic-select">Microphone:</label>
      <select
        id="mic-select"
        value={selected}
        onChange={handleChange}
      >
        <option value="">Select microphone...</option>
        {devices.map(d => (
          <option key={d.name} value={d.name}>
            {d.name} {d.is_default ? '(Default)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Step 3.2: Create RecordButton Component

```tsx
// src/components/RecordButton.tsx

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  deviceName: string | null;
  onRecordingChange: (isRecording: boolean) => void;
}

export function RecordButton({ deviceName, onRecordingChange }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleRecording = async () => {
    setError(null);

    if (!deviceName) {
      setError('Please select a microphone first');
      return;
    }

    try {
      if (isRecording) {
        await invoke('stop_recording');
        setIsRecording(false);
        onRecordingChange(false);
      } else {
        await invoke('start_recording', { deviceName });
        setIsRecording(true);
        onRecordingChange(true);
      }
    } catch (err) {
      setError(String(err));
      setIsRecording(false);
      onRecordingChange(false);
    }
  };

  return (
    <div className="record-button-container">
      <button
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={toggleRecording}
        disabled={!deviceName}
      >
        {isRecording ? '■ Stop Recording' : '● Start Recording'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Step 3.3: Create Transcript Component

```tsx
// src/components/Transcript.tsx

import { useEffect, useState, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

export function Transcript() {
  const [segments, setSegments] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unlisten = listen<string>('transcript', (event) => {
      setSegments(prev => [...prev, event.payload]);
    });

    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments]);

  return (
    <div className="transcript" ref={containerRef}>
      {segments.length === 0 ? (
        <p className="placeholder">
          Transcript will appear here when you start recording...
        </p>
      ) : (
        segments.map((text, i) => (
          <p key={i} className="segment">{text}</p>
        ))
      )}
    </div>
  );
}
```

### Step 3.4: Update App.tsx

```tsx
// src/App.tsx

import { useState } from 'react';
import { DeviceSelector } from './components/DeviceSelector';
import { RecordButton } from './components/RecordButton';
import { Transcript } from './components/Transcript';
import './App.css';

function App() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="app">
      <header>
        <h1>JARVIS</h1>
        <span className="subtitle">Voice Transcription MVP</span>
      </header>

      <main>
        <div className="controls">
          <DeviceSelector onDeviceSelect={setSelectedDevice} />
        </div>

        <Transcript />

        <div className="actions">
          <RecordButton
            deviceName={selectedDevice}
            onRecordingChange={setIsRecording}
          />
          {isRecording && (
            <div className="recording-indicator">
              <span className="pulse"></span>
              Recording...
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
```

### Step 3.5: Add Styles

```css
/* src/App.css */

:root {
  --bg: #1a1a1a;
  --surface: #2a2a2a;
  --text: #ffffff;
  --text-muted: #888888;
  --accent: #4a9eff;
  --danger: #ff4a4a;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 1rem;
}

header {
  text-align: center;
  padding: 1rem 0;
}

header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

header .subtitle {
  font-size: 0.875rem;
  color: var(--text-muted);
}

main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.device-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.device-selector label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.device-selector select {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #444;
  background: var(--surface);
  color: var(--text);
  font-size: 0.875rem;
  min-width: 200px;
}

.transcript {
  flex: 1;
  background: var(--surface);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-y: auto;
}

.transcript .placeholder {
  color: var(--text-muted);
  font-style: italic;
}

.transcript .segment {
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
}

.record-button {
  padding: 0.75rem 2rem;
  border-radius: 2rem;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--accent);
  color: white;
}

.record-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.record-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.record-button.recording {
  background: var(--danger);
}

.recording-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--danger);
}

.pulse {
  width: 8px;
  height: 8px;
  background: var(--danger);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error {
  color: var(--danger);
  font-size: 0.875rem;
}
```

---

## Phase 4: Audio Capture Implementation

### Step 4.1: Add Audio Capture to audio.rs

```rust
// Add to src-tauri/src/audio.rs

use cpal::traits::StreamTrait;
use cpal::{Device, SampleRate, StreamConfig};
use std::sync::mpsc::{self, Receiver, Sender};
use std::sync::{Arc, Mutex};

/// Audio sample buffer for streaming to transcription
pub type AudioBuffer = Arc<Mutex<Vec<f32>>>;

/// Find device by name
pub fn get_device_by_name(name: &str) -> Option<Device> {
    let host = cpal::default_host();
    host.input_devices()
        .ok()?
        .find(|d| d.name().ok().as_deref() == Some(name))
}

/// Build an input stream from a device
pub fn build_input_stream(
    device: &Device,
    buffer: AudioBuffer,
) -> Result<cpal::Stream, String> {
    // Get supported config - prefer 16kHz for Whisper
    let supported = device
        .supported_input_configs()
        .map_err(|e| e.to_string())?
        .find(|c| {
            c.min_sample_rate() <= SampleRate(16000)
            && c.max_sample_rate() >= SampleRate(16000)
        })
        .or_else(|| {
            device.supported_input_configs().ok()?.next()
        })
        .ok_or("No supported audio config")?;

    let config: StreamConfig = supported
        .with_sample_rate(SampleRate(16000))
        .into();

    let stream = device
        .build_input_stream(
            &config,
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if let Ok(mut buf) = buffer.lock() {
                    buf.extend_from_slice(data);
                }
            },
            |err| eprintln!("Audio stream error: {}", err),
            None,
        )
        .map_err(|e| e.to_string())?;

    Ok(stream)
}
```

### Step 4.2: Add Recording Commands to main.rs

```rust
// Add to main.rs

use std::sync::mpsc;
use std::thread;
use cpal::traits::StreamTrait;

// Add audio buffer to state
pub struct AppState {
    pub selected_device: Mutex<Option<String>>,
    pub is_recording: Mutex<bool>,
    pub audio_stream: Mutex<Option<cpal::Stream>>,
    pub audio_buffer: audio::AudioBuffer,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            selected_device: Mutex::new(None),
            is_recording: Mutex::new(false),
            audio_stream: Mutex::new(None),
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
        }
    }
}

#[tauri::command]
fn start_recording(
    device_name: String,
    state: State<Arc<AppState>>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    // Check if already recording
    {
        let is_rec = state.is_recording.lock().map_err(|e| e.to_string())?;
        if *is_rec {
            return Err("Already recording".to_string());
        }
    }

    // Get device
    let device = audio::get_device_by_name(&device_name)
        .ok_or("Device not found")?;

    // Clear buffer
    {
        let mut buf = state.audio_buffer.lock().map_err(|e| e.to_string())?;
        buf.clear();
    }

    // Build stream
    let buffer = Arc::clone(&state.audio_buffer);
    let stream = audio::build_input_stream(&device, buffer)?;

    stream.play().map_err(|e| e.to_string())?;

    // Store stream and update state
    {
        let mut stream_lock = state.audio_stream.lock().map_err(|e| e.to_string())?;
        *stream_lock = Some(stream);
    }
    {
        let mut is_rec = state.is_recording.lock().map_err(|e| e.to_string())?;
        *is_rec = true;
    }

    // Start transcription processing in background
    // (Phase 5 will add actual Whisper processing)
    let buffer_clone = Arc::clone(&state.audio_buffer);
    let app_clone = app.clone();

    thread::spawn(move || {
        process_audio_loop(buffer_clone, app_clone);
    });

    Ok(())
}

#[tauri::command]
fn stop_recording(state: State<Arc<AppState>>) -> Result<(), String> {
    // Stop stream
    {
        let mut stream = state.audio_stream.lock().map_err(|e| e.to_string())?;
        *stream = None; // Dropping stops the stream
    }

    // Update state
    {
        let mut is_rec = state.is_recording.lock().map_err(|e| e.to_string())?;
        *is_rec = false;
    }

    Ok(())
}

/// Placeholder for audio processing loop
fn process_audio_loop(buffer: audio::AudioBuffer, app: tauri::AppHandle) {
    use std::time::Duration;

    loop {
        thread::sleep(Duration::from_secs(1));

        // Check if still recording by trying to read buffer
        let samples: Vec<f32> = {
            match buffer.lock() {
                Ok(mut buf) => {
                    if buf.is_empty() {
                        continue;
                    }
                    buf.drain(..).collect()
                }
                Err(_) => break, // State dropped, stop loop
            }
        };

        if samples.is_empty() {
            continue;
        }

        // For now, just emit a placeholder
        // Phase 5 replaces this with actual Whisper transcription
        let _ = app.emit("transcript", format!(
            "[Captured {} samples - Whisper integration pending]",
            samples.len()
        ));
    }
}
```

### Step 4.3: Update Command Handler

```rust
// Update invoke_handler in main()
.invoke_handler(tauri::generate_handler![
    list_audio_devices,
    select_device,
    get_selected_device,
    start_recording,
    stop_recording,
])
```

### Step 4.4: Test Audio Capture

```bash
npm run tauri dev
```

1. Select a microphone
2. Click "Start Recording"
3. Speak into mic
4. Should see "[Captured X samples...]" messages
5. Click "Stop Recording"

---

## Phase 5: Whisper Integration

### Step 5.1: Add whisper-rs Dependency

Update `src-tauri/Cargo.toml`:

```toml
[dependencies]
# ... existing deps ...
whisper-rs = "0.11"
hound = "3.5"
dirs = "5"
reqwest = { version = "0.11", features = ["blocking"] }
```

### Step 5.2: Create transcription.rs

```rust
// src-tauri/src/transcription.rs

use whisper_rs::{
    FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters,
};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

const MODEL_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin";
const MODEL_NAME: &str = "ggml-base.en.bin";

/// Get path to models directory
fn models_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|p| p.join("jarvis").join("models"))
}

/// Get path to whisper model, downloading if needed
pub fn ensure_model() -> Result<PathBuf, String> {
    let dir = models_dir().ok_or("Could not find data directory")?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let model_path = dir.join(MODEL_NAME);

    if !model_path.exists() {
        println!("Downloading whisper model to {:?}...", model_path);

        let response = reqwest::blocking::get(MODEL_URL)
            .map_err(|e| format!("Download failed: {}", e))?;

        let bytes = response.bytes()
            .map_err(|e| format!("Failed to read response: {}", e))?;

        std::fs::write(&model_path, bytes)
            .map_err(|e| format!("Failed to write model: {}", e))?;

        println!("Model downloaded successfully");
    }

    Ok(model_path)
}

/// Whisper transcription engine
pub struct TranscriptionEngine {
    ctx: WhisperContext,
}

impl TranscriptionEngine {
    pub fn new() -> Result<Self, String> {
        let model_path = ensure_model()?;

        let ctx = WhisperContext::new_with_params(
            model_path.to_str().ok_or("Invalid model path")?,
            WhisperContextParameters::default(),
        ).map_err(|e| format!("Failed to load whisper model: {}", e))?;

        Ok(Self { ctx })
    }

    /// Transcribe audio samples (16kHz mono f32)
    pub fn transcribe(&self, samples: &[f32]) -> Result<String, String> {
        // Need at least 0.5 seconds of audio
        if samples.len() < 8000 {
            return Ok(String::new());
        }

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_realtime(false);
        params.set_print_progress(false);
        params.set_print_timestamps(false);

        let mut state = self.ctx.create_state()
            .map_err(|e| format!("Failed to create state: {}", e))?;

        state.full(params, samples)
            .map_err(|e| format!("Transcription failed: {}", e))?;

        let num_segments = state.full_n_segments()
            .map_err(|e| format!("Failed to get segments: {}", e))?;

        let mut result = String::new();
        for i in 0..num_segments {
            if let Ok(text) = state.full_get_segment_text(i) {
                result.push_str(&text);
            }
        }

        Ok(result.trim().to_string())
    }
}
```

### Step 5.3: Update State with Engine

```rust
// Update AppState in main.rs

use crate::transcription::TranscriptionEngine;

pub struct AppState {
    pub selected_device: Mutex<Option<String>>,
    pub is_recording: Mutex<bool>,
    pub audio_stream: Mutex<Option<cpal::Stream>>,
    pub audio_buffer: audio::AudioBuffer,
    pub transcription_engine: Mutex<Option<TranscriptionEngine>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            selected_device: Mutex::new(None),
            is_recording: Mutex::new(false),
            audio_stream: Mutex::new(None),
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
            transcription_engine: Mutex::new(None),
        }
    }
}
```

### Step 5.4: Add Model Loading Command

```rust
#[tauri::command]
async fn load_model(state: State<'_, Arc<AppState>>) -> Result<(), String> {
    // Load on background thread
    let engine = tokio::task::spawn_blocking(|| {
        TranscriptionEngine::new()
    })
    .await
    .map_err(|e| e.to_string())??;

    let mut lock = state.transcription_engine.lock().map_err(|e| e.to_string())?;
    *lock = Some(engine);

    Ok(())
}

#[tauri::command]
fn is_model_loaded(state: State<Arc<AppState>>) -> bool {
    state.transcription_engine.lock()
        .map(|e| e.is_some())
        .unwrap_or(false)
}
```

### Step 5.5: Update Audio Processing Loop

```rust
fn process_audio_loop(
    buffer: audio::AudioBuffer,
    engine: Arc<Mutex<Option<TranscriptionEngine>>>,
    app: tauri::AppHandle,
    is_recording: Arc<Mutex<bool>>,
) {
    use std::time::Duration;

    // Accumulate samples until we have ~2 seconds worth
    let mut accumulated: Vec<f32> = Vec::new();
    const SAMPLE_RATE: usize = 16000;
    const CHUNK_SECONDS: usize = 2;
    const CHUNK_SIZE: usize = SAMPLE_RATE * CHUNK_SECONDS;

    loop {
        thread::sleep(Duration::from_millis(100));

        // Check if still recording
        {
            let is_rec = match is_recording.lock() {
                Ok(r) => *r,
                Err(_) => break,
            };
            if !is_rec {
                break;
            }
        }

        // Drain buffer
        let samples: Vec<f32> = {
            match buffer.lock() {
                Ok(mut buf) => buf.drain(..).collect(),
                Err(_) => break,
            }
        };

        accumulated.extend(samples);

        // Process when we have enough audio
        if accumulated.len() >= CHUNK_SIZE {
            let chunk: Vec<f32> = accumulated.drain(..CHUNK_SIZE).collect();

            // Transcribe
            if let Ok(engine_lock) = engine.lock() {
                if let Some(ref engine) = *engine_lock {
                    match engine.transcribe(&chunk) {
                        Ok(text) if !text.is_empty() => {
                            let _ = app.emit("transcript", text);
                        }
                        Ok(_) => {} // Empty transcription
                        Err(e) => {
                            eprintln!("Transcription error: {}", e);
                        }
                    }
                }
            }
        }
    }
}
```

### Step 5.6: Update Frontend for Model Loading

```tsx
// Update App.tsx

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    async function loadModel() {
      try {
        const loaded = await invoke<boolean>('is_model_loaded');
        if (!loaded) {
          await invoke('load_model');
        }
        setModelLoaded(true);
      } catch (err) {
        console.error('Failed to load model:', err);
      } finally {
        setModelLoading(false);
      }
    }

    loadModel();
  }, []);

  if (modelLoading) {
    return (
      <div className="app loading">
        <div className="loader">
          <h2>Loading JARVIS...</h2>
          <p>Downloading transcription model (first run only)...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  // ... rest of the component
}
```

---

## Phase 6: Testing & Verification

### Step 6.1: Build and Test

```bash
# Development mode
npm run tauri dev

# Release build
npm run tauri build
```

### Step 6.2: Test Checklist

| Test | Expected Result |
|------|-----------------|
| Device list loads | All mics shown including AirPods |
| Default device selected | Built-in mic or last used |
| Start recording | Button changes, indicator pulses |
| Speak into mic | Text appears in transcript |
| Stop recording | Recording stops, indicator gone |
| Switch devices | New device used on next recording |

### Step 6.3: Common Issues

| Issue | Solution |
|-------|----------|
| No devices listed | Check System Preferences > Privacy > Microphone |
| Model download fails | Check internet connection, try manual download |
| No transcription output | Speak louder, check mic isn't muted |
| Garbled output | Check sample rate matches 16kHz |

---

## Summary

### Files Created

```
jarvis-app/
├── src-tauri/
│   ├── Cargo.toml
│   └── src/
│       ├── main.rs           # Tauri commands & app setup
│       ├── audio.rs          # Device listing & capture
│       ├── state.rs          # Shared state
│       └── transcription.rs  # Whisper integration
└── src/
    ├── App.tsx               # Main React component
    ├── App.css               # Styling
    └── components/
        ├── DeviceSelector.tsx
        ├── RecordButton.tsx
        └── Transcript.tsx
```

### Commands Available

| Command | Description |
|---------|-------------|
| `list_audio_devices` | Get available microphones |
| `select_device` | Set active microphone |
| `start_recording` | Begin audio capture + transcription |
| `stop_recording` | Stop capture |
| `load_model` | Download/load Whisper model |
| `is_model_loaded` | Check if model ready |

### Next Steps (Post-MVP)

1. Add session persistence (save transcripts)
2. Add export to markdown
3. Implement Meeting Mode (system audio capture)
4. Add communication coaching metrics
5. Integrate Claude for analysis
