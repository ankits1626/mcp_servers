# JARVIS - System Architecture

## High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              JARVIS SYSTEM                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         PRESENTATION LAYER                               │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │    │
│  │  │  System Tray │  │  Transcript  │  │   Overlay    │                   │    │
│  │  │   Controls   │  │    Window    │  │   Nudges     │                   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                   │    │
│  │                         Web UI (React/Vue/Svelte)                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                           TAURI BRIDGE                                   │    │
│  │              IPC Commands / Events / State Management                    │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         RUST CORE (Backend)                              │    │
│  │                                                                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │   Audio     │  │   Speech    │  │   Speaker   │  │   Session   │     │    │
│  │  │   Capture   │  │   Engine    │  │   Engine    │  │   Manager   │     │    │
│  │  │             │  │             │  │             │  │             │     │    │
│  │  │ - macOS     │  │ - whisper   │  │ - pyannote  │  │ - Start/    │     │    │
│  │  │ - Windows   │  │   .cpp      │  │ - Speaker   │  │   Stop      │     │    │
│  │  │ - Linux     │  │ - Streaming │  │   labels    │  │ - Export    │     │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │    │
│  │         │                │                │                │            │    │
│  │         ▼                ▼                ▼                ▼            │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │    │
│  │  │                      EVENT BUS / PIPELINE                        │   │    │
│  │  │         Audio Chunks → Transcripts → Speaker Labels → UI         │   │    │
│  │  └──────────────────────────────────────────────────────────────────┘   │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         KNOWLEDGE LAYER                                  │    │
│  │                                                                          │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │    │
│  │  │  sqlite-vec │  │  Embedding  │  │   Context   │  │  Knowledge  │     │    │
│  │  │  Vector DB  │  │   Engine    │  │  Retriever  │  │  Importers  │     │    │
│  │  │             │  │             │  │             │  │             │     │    │
│  │  │ - Meetings  │  │ - Local     │  │ - Semantic  │  │ - LLM Chats │     │    │
│  │  │ - Articles  │  │   embed     │  │   search    │  │ - YouTube   │     │    │
│  │  │ - LLM Chats │  │ - Chunking  │  │ - RAG       │  │ - Medium    │     │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│                                      ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         INTELLIGENCE LAYER                               │    │
│  │                                                                          │    │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │    │
│  │  │                        Claude CLI / API                         │    │    │
│  │  │                                                                 │    │    │
│  │  │  - Real-time analysis    - Fact checking                       │    │    │
│  │  │  - Question suggestions  - Meeting summarization               │    │    │
│  │  │  - Context injection     - Communication feedback              │    │    │
│  │  └─────────────────────────────────────────────────────────────────┘    │    │
│  │                                                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
                                    REAL-TIME FLOW

  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
  │  System  │      │  Audio   │      │ Whisper  │      │  UI      │
  │  Audio   │─────▶│  Buffer  │─────▶│  .cpp    │─────▶│ Update   │
  │  Stream  │      │ (chunks) │      │          │      │          │
  └──────────┘      └──────────┘      └──────────┘      └──────────┘
                                            │
                                            ▼
                                     ┌──────────┐
                                     │ Pyannote │
                                     │ Speaker  │
                                     │ Labels   │
                                     └──────────┘
                                            │
                         ┌──────────────────┴──────────────────┐
                         ▼                                     ▼
                  ┌──────────┐                          ┌──────────┐
                  │  Local   │                          │  Claude  │
                  │  Storage │                          │  Analysis│
                  │ (SQLite) │                          │          │
                  └──────────┘                          └──────────┘
                                                              │
                                                              ▼
                                                       ┌──────────┐
                                                       │  Nudges  │
                                                       │ Overlay  │
                                                       └──────────┘
```

---

## Platform Abstraction

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUDIO CAPTURE TRAIT                          │
│                                                                 │
│  trait AudioCapture {                                           │
│      fn start(&self) -> Result<AudioStream>;                    │
│      fn stop(&self);                                            │
│      fn get_devices(&self) -> Vec<AudioDevice>;                 │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  macOS Impl     │  │  Windows Impl   │  │  Linux Impl     │
│                 │  │                 │  │                 │
│  Core Audio     │  │  WASAPI         │  │  PulseAudio/    │
│  Taps           │  │  Loopback       │  │  PipeWire       │
│  (14.2+)        │  │                 │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## Component Responsibilities

### Audio Capture Module
- Capture system audio (both sides of call)
- Platform-specific implementations behind common trait
- Buffer management for streaming to transcription

### Speech Engine Module
- whisper.cpp integration
- Streaming transcription
- VAD (Voice Activity Detection)
- Configurable model sizes (tiny → large)

### Speaker Engine Module
- pyannote integration
- Speaker diarization
- Speaker label assignment to transcript segments

### Session Manager
- Start/stop recording sessions
- Persist transcripts to SQLite
- Export to markdown/JSON

### Knowledge Layer
- sqlite-vec for vector storage
- Embedding generation (local model)
- Semantic search across all stored knowledge
- Importers for external sources (YouTube, Medium, LLM exports)

### Intelligence Layer
- Claude CLI integration
- Real-time transcript analysis
- Context retrieval and injection
- Nudge generation

---

## Phased Implementation

### Phase 1: Foundation (MVP)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Audio     │────▶│   Whisper   │────▶│  Transcript │
│   Capture   │     │   .cpp      │     │  Display    │
└─────────────┘     └─────────────┘     └─────────────┘
```
- System audio capture (macOS first)
- Real-time transcription
- Basic UI showing live transcript
- Export to file

### Phase 2: Speaker Identification
```
Add: Speaker diarization with pyannote
     Speaker labels in transcript
```

### Phase 3: Knowledge Base
```
Add: sqlite-vec integration
     Store all transcripts with embeddings
     Semantic search across meetings
```

### Phase 4: Context Retrieval
```
Add: Import LLM chats, articles, videos
     Cross-reference during meetings
```

### Phase 5: Real-time Intelligence
```
Add: Claude CLI integration
     Live analysis and nudges
     Fact-checking
     Question suggestions
```

### Phase 6: Cross-platform
```
Add: Windows support (WASAPI)
     Linux support (PulseAudio/PipeWire)
```

---

## Tech Stack Summary

| Layer | Technology | Language |
|-------|------------|----------|
| UI | React/Svelte + TailwindCSS | TypeScript |
| Desktop Shell | Tauri 2.x | Rust |
| Audio Capture | Platform APIs | Rust |
| Transcription | whisper.cpp | C++ (Rust bindings) |
| Diarization | pyannote | Python (subprocess) |
| Vector DB | sqlite-vec | C (SQLite extension) |
| Storage | SQLite | SQL |
| LLM | Claude CLI/API | External |

---

## File Structure (Proposed)

```
jarvis/
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   ├── audio/          # Platform audio capture
│   │   │   ├── mod.rs
│   │   │   ├── macos.rs
│   │   │   ├── windows.rs
│   │   │   └── linux.rs
│   │   ├── speech/         # Whisper integration
│   │   ├── speaker/        # Pyannote integration
│   │   ├── knowledge/      # Vector DB & retrieval
│   │   ├── session/        # Session management
│   │   └── commands.rs     # Tauri IPC commands
│   └── Cargo.toml
├── src/                    # Web UI
│   ├── App.tsx
│   ├── components/
│   │   ├── Transcript.tsx
│   │   ├── Controls.tsx
│   │   └── Overlay.tsx
│   └── styles/
├── package.json
└── tauri.conf.json
```
