# JARVIS - macOS App Architecture

## How JARVIS Runs on Your Mac

This document explains the runtime architecture of JARVIS as a native macOS application.

---

## The Container: A Native macOS Application

When you build JARVIS, you get a standard `.app` bundle — the same format as any macOS application (Chrome, Slack, VS Code).

```
JARVIS.app/                          # The "container" - a macOS app bundle
├── Contents/
│   ├── Info.plist                   # App metadata (name, permissions, icons)
│   ├── MacOS/
│   │   └── jarvis                   # The actual executable (Rust binary)
│   ├── Resources/
│   │   ├── icons/                   # App icons
│   │   └── assets/                  # Frontend files (HTML, JS, CSS)
│   └── Frameworks/                  # Any bundled libraries
```

---

## Runtime Architecture

### What Happens When You Double-Click JARVIS.app

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JARVIS RUNTIME ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. USER DOUBLE-CLICKS JARVIS.APP                                           │
│     │                                                                        │
│     ▼                                                                        │
│  2. macOS LAUNCHES THE RUST BINARY (Contents/MacOS/jarvis)                  │
│     │                                                                        │
│     ├── Initializes Tauri runtime                                           │
│     ├── Loads configuration                                                 │
│     ├── Sets up audio capture (cpal / Core Audio)                           │
│     └── Loads whisper model (if not already cached)                         │
│     │                                                                        │
│     ▼                                                                        │
│  3. CREATES A NATIVE WINDOW WITH EMBEDDED WebKit WebView                    │
│     │                                                                        │
│     │  ┌─────────────────────────────────────────────────────────────────┐  │
│     │  │                    macOS Native Window                          │  │
│     │  │  ┌───────────────────────────────────────────────────────────┐  │  │
│     │  │  │                                                           │  │  │
│     │  │  │              WebKit WebView (WKWebView)                   │  │  │
│     │  │  │                                                           │  │  │
│     │  │  │   Loads: file:///.../Resources/index.html                 │  │  │
│     │  │  │   Runs: Your React app (compiled to JS)                   │  │  │
│     │  │  │                                                           │  │  │
│     │  │  └───────────────────────────────────────────────────────────┘  │  │
│     │  └─────────────────────────────────────────────────────────────────┘  │
│     │                                                                        │
│     ▼                                                                        │
│  4. TWO PROCESSES COMMUNICATE VIA IPC                                       │
│                                                                              │
│     ┌──────────────────────┐         ┌──────────────────────┐               │
│     │    Rust Process      │◄───────►│   WebView Process    │               │
│     │    (Native Code)     │   IPC   │   (JavaScript)       │               │
│     ├──────────────────────┤         ├──────────────────────┤               │
│     │ • Audio capture      │         │ • React UI           │               │
│     │ • Whisper inference  │         │ • User interactions  │               │
│     │ • File system access │         │ • Transcript display │               │
│     │ • System permissions │         │ • Styling/animations │               │
│     └──────────────────────┘         └──────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tauri vs Electron Comparison

| Aspect | Electron | Tauri (JARVIS) |
|--------|----------|----------------|
| **Browser Engine** | Ships Chromium (~120MB) | Uses system WebKit (0MB) |
| **Backend** | Node.js process | Rust binary |
| **Total Size** | 150-300MB | 3-10MB |
| **Memory** | 300MB+ idle | 30-50MB idle |
| **Window** | Chromium window | Native NSWindow + WKWebView |

---

## What is WebKit/WKWebView?

WebKit is the browser engine that powers Safari. On macOS, every machine already has it installed as part of the OS.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              macOS SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Already installed (part of macOS):                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  WebKit Framework (/System/Library/Frameworks/WebKit.framework)     │    │
│  │                                                                     │    │
│  │  • WKWebView - Embeddable web browser component                     │    │
│  │  • JavaScript engine (JavaScriptCore)                               │    │
│  │  • HTML/CSS renderer                                                │    │
│  │  • Hardware acceleration                                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  Your JARVIS.app just USES this, doesn't bundle it                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation & Distribution

### During Development

```bash
npm run tauri dev
# Runs directly from source, hot-reload enabled
# No .app bundle created yet
```

### For Distribution

```bash
npm run tauri build
```

**Output:**
```
src-tauri/target/release/bundle/
├── macos/
│   └── JARVIS.app              # The app bundle (drag to /Applications)
└── dmg/
    └── JARVIS_0.1.0_aarch64.dmg  # Installer disk image
```

### User Installation

```
1. Download JARVIS.dmg
2. Double-click to mount
3. Drag JARVIS.app to /Applications
4. Launch from Launchpad or Spotlight
```

---

## Permissions (Info.plist)

Your app needs to declare permissions for microphone and system audio:

```xml
<!-- src-tauri/Info.plist -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Microphone access -->
    <key>NSMicrophoneUsageDescription</key>
    <string>JARVIS needs microphone access to transcribe your speech</string>

    <!-- System audio capture (Core Audio Taps) -->
    <key>NSAudioCaptureUsageDescription</key>
    <string>JARVIS needs audio capture to transcribe meeting participants</string>

    <!-- App metadata -->
    <key>CFBundleName</key>
    <string>JARVIS</string>
    <key>CFBundleIdentifier</key>
    <string>com.yourname.jarvis</string>
</dict>
</plist>
```

---

## First Launch Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FIRST LAUNCH FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User opens JARVIS.app                                                   │
│     │                                                                        │
│     ▼                                                                        │
│  2. macOS Gatekeeper check                                                  │
│     │  "JARVIS is from an unidentified developer" (if not signed)           │
│     │  User right-clicks → Open to bypass (or you sign the app)             │
│     │                                                                        │
│     ▼                                                                        │
│  3. Microphone permission prompt (automatic on first audio access)          │
│     │  ┌────────────────────────────────────────┐                           │
│     │  │ "JARVIS" would like to access the     │                           │
│     │  │ microphone.                            │                           │
│     │  │                                        │                           │
│     │  │ JARVIS needs microphone access to     │                           │
│     │  │ transcribe your speech                │                           │
│     │  │                                        │                           │
│     │  │         [Don't Allow]  [OK]           │                           │
│     │  └────────────────────────────────────────┘                           │
│     │                                                                        │
│     ▼                                                                        │
│  4. Model download (if first run)                                           │
│     │  "Downloading whisper model (142MB)..."                               │
│     │  Saved to: ~/Library/Application Support/jarvis/models/               │
│     │                                                                        │
│     ▼                                                                        │
│  5. App ready to use                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Storage Locations

```
~/Library/Application Support/jarvis/
├── models/
│   └── ggml-base.en.bin         # Whisper model (downloaded once)
├── config.toml                   # User settings
├── sessions/
│   └── 2025-01-05_meeting.db    # Session transcripts (SQLite)
└── logs/
    └── jarvis.log               # Debug logs
```

---

## Summary

| Question | Answer |
|----------|--------|
| **What is the container?** | Standard macOS `.app` bundle |
| **How do I run it?** | Double-click like any app, or `open JARVIS.app` |
| **Where does it install?** | `/Applications/JARVIS.app` (user drags it there) |
| **What renders the UI?** | System WebKit (WKWebView) — no bundled browser |
| **What runs the backend?** | Native Rust binary inside the .app |
| **Where is data stored?** | `~/Library/Application Support/jarvis/` |

---

## Code Signing & Notarization (For Distribution)

To distribute JARVIS without Gatekeeper warnings:

### 1. Apple Developer Account Required

- Enroll at developer.apple.com ($99/year)
- Create a Developer ID Application certificate

### 2. Sign the App

```bash
# In tauri.conf.json
{
  "bundle": {
    "macOS": {
      "signingIdentity": "Developer ID Application: Your Name (TEAM_ID)",
      "entitlements": "./entitlements.plist"
    }
  }
}
```

### 3. Notarize with Apple

```bash
# After building
xcrun notarytool submit JARVIS.dmg \
  --apple-id "your@email.com" \
  --team-id "TEAM_ID" \
  --password "@keychain:AC_PASSWORD"

# Staple the ticket
xcrun stapler staple JARVIS.dmg
```

### 4. Result

Users can download and run without any Gatekeeper warnings.

---

## Development vs Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Launch** | `npm run tauri dev` | Double-click .app |
| **Frontend** | Vite dev server (hot reload) | Bundled static files |
| **Backend** | Debug build (slower) | Release build (optimized) |
| **Location** | Project directory | /Applications |
| **Size** | N/A (not bundled) | 3-10MB |
| **Signing** | Not needed | Required for distribution |

---

## Why This Architecture Matters

1. **Native Feel**: Users install and run JARVIS like any other Mac app
2. **Small Size**: No bundled Chromium — uses system WebKit
3. **Fast Startup**: Rust binary loads in milliseconds
4. **Low Memory**: 30-50MB idle vs 300MB+ for Electron
5. **System Integration**: Native permissions, notifications, menu bar access
6. **Privacy**: All processing happens locally in the Rust backend
