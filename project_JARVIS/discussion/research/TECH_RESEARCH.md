# JARVIS - Technology Research

## Research Date: January 2026

---

## 1. Audio Capture (macOS)

### Options Evaluated

| Solution | Type | Pros | Cons |
|----------|------|------|------|
| **Core Audio Taps** | Native API | Apple-sanctioned, no drivers, macOS 14.2+ | Requires macOS 14.2+ |
| **ScreenCaptureKit** | Native API | Built-in, works with Electron | Some PyObjC issues reported |
| **BlackHole** | Virtual Driver | Zero latency, free, open source | Requires driver install |
| **Loopback** | Virtual Driver | Polished UI, flexible routing | Paid ($99), driver install |

### Recommendation: Core Audio Taps

- Native Apple API introduced in macOS 14.2
- No third-party drivers needed
- [AudioTee](https://stronglytyped.uk/articles/audiotee-capture-system-audio-output-macos) - open source reference implementation
- Works with Swift/SwiftUI natively

### Sources
- [BlackHole GitHub](https://github.com/ExistentialAudio/BlackHole)
- [Electron ScreenCaptureKit Issue](https://github.com/electron/electron/issues/47490)
- [Loopback by Rogue Amoeba](https://rogueamoeba.com/loopback/)
- [macOS Audio Routing Blog](https://blog.claranguyen.me/post/2025/03/09/lossless-loopback-audio-macos/)

---

## 2. Speech-to-Text (Local)

### Options Evaluated

| Solution | Language | Real-time | Performance | Memory |
|----------|----------|-----------|-------------|--------|
| **whisper.cpp** | C++ | Yes (streaming) | Excellent | ~140MB (tiny.en) |
| **faster-whisper** | Python | Yes | Very good | Higher |
| **SimulStreaming** | Python | Yes | Best quality 2025 | Medium |
| **MLX Whisper** | Python | Yes | Apple Silicon optimized | Medium |

### Recommendation: whisper.cpp

- Pure C++, no dependencies
- Runs on CPU efficiently (Apple Silicon optimized)
- Quantized models as small as 140MB
- Built-in VAD (Voice Activity Detection)
- Processes 10-min audio in ~3-4 min on modest hardware
- Streaming support for real-time transcription

### Key Features
- Integer quantization support
- SIMD acceleration
- Works offline
- 2-5 second latency achievable

### Sources
- [whisper.cpp GitHub](https://github.com/ggml-org/whisper.cpp)
- [faster-whisper GitHub](https://github.com/SYSTRAN/faster-whisper)
- [WhisperStreaming GitHub](https://github.com/ufal/whisper_streaming)
- [Whisper.cpp Streaming Guide](https://cppscripts.com/whispercpp-streaming)

---

## 3. Speaker Diarization

### Options Evaluated

| Solution | Type | Quality | Requirements |
|----------|------|---------|--------------|
| **pyannote community-1** | Neural | Best open-source 2025 | GPU recommended |
| **pyannote 3.1** | Neural | Very good | GPU recommended |
| **Falcon Diarization** | Neural | Good | Integrates with whisper.cpp |
| **Energy-based VAD** | Simple | Basic | CPU only |

### Recommendation: pyannote community-1

- Released with pyannote.audio 4.0
- CC-BY-4.0 license (free forever)
- Significant improvements over 3.1 in speaker counting/assignment
- Can run offline from disk
- Hardware: RTX 3060/4060 sufficient (6-8GB VRAM)

### Integration
- Combine with Whisper for speaker-labeled transcripts
- Process audio chunks, assign speakers to Whisper segments

### Sources
- [pyannote-audio GitHub](https://github.com/pyannote/pyannote-audio)
- [speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1)
- [pyannote + Whisper Integration](https://scalastic.io/en/whisper-pyannote-ultimate-speech-transcription/)
- [Whisper + Falcon Diarization](https://picovoice.ai/blog/whisper-cpp-speaker-diarization/)

---

## 4. Desktop App Framework

### Options Evaluated

| Framework | Bundle Size | Memory (idle) | Startup | Learning Curve |
|-----------|-------------|---------------|---------|----------------|
| **Tauri** | 3-10 MB | 30-50 MB | <0.5s | Rust backend |
| **Electron** | 50+ MB | 150-300 MB | 1-2s | JavaScript |
| **Swift/SwiftUI** | Native | Native | Instant | Swift |

### Recommendation: Tauri (Cross-platform from Day 1)

**Why Tauri:**
- 35% YoY adoption growth in 2025
- Cross-platform: Windows, Linux, macOS (mobile with 2.x)
- Rust backend = performance + memory safety
- Under 10MB bundle size vs 50MB+ Electron
- 30-50MB idle memory vs 150-300MB Electron
- Sub-second startup

**Trade-off:**
- WebKit on macOS (slightly behind Chromium on some features)
- Rust learning curve for backend logic
- System webview inconsistencies across platforms

**Audio Capture per Platform:**
| Platform | API |
|----------|-----|
| macOS | Core Audio Taps (14.2+) or ScreenCaptureKit |
| Windows | WASAPI Loopback |
| Linux | PulseAudio/PipeWire |

Tauri's Rust backend can abstract these platform differences.

### Sources
- [Tauri vs Electron 2025](https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html)
- [Tauri vs Electron Deep Dive](https://www.gethopp.app/blog/tauri-vs-electron)
- [SwiftUI MenuBarExtra Tutorial](https://nilcoalescing.com/blog/BuildAMacOSMenuBarUtilityInSwiftUI/)
- [Mac Menu Bar with SwiftUI](https://sarunw.com/posts/swiftui-menu-bar-app/)

---

## 5. Vector Database (Knowledge Layer)

### Options Evaluated

| Solution | Type | Deployment | Performance |
|----------|------|------------|-------------|
| **sqlite-vec** | SQLite extension | Embedded | Fast, SIMD |
| **ChromaDB** | Standalone | Local/Server | Good single query |
| **LanceDB** | Embedded | Embedded | Very fast |

### Recommendation: sqlite-vec

- Pure C, zero dependencies
- Runs anywhere SQLite runs (including WASM)
- No external server needed
- KNN search with multiple distance metrics
- SIMD-accelerated
- Perfect for local-first architecture

### Use Case
- Store embeddings of past conversations, articles, meeting transcripts
- Query during live meetings for relevant context
- Single file database, portable

### Sources
- [sqlite-vec GitHub](https://github.com/asg017/sqlite-vec)
- [sqlite-vec Tutorial](https://dev.to/stephenc222/how-to-use-sqlite-vec-to-store-and-query-vector-embeddings-58mf)
- [Local Vector Search Guide](https://www.timestretch.com/2025/05/26/local_vector_search_with_llama_cpp_embeddings_and_sqlite_vec.html)
- [ChromaDB GitHub](https://github.com/chroma-core/chroma)

---

## 6. LLM Integration

### Approach: Claude CLI

For POC, leverage existing Claude CLI for:
- Real-time analysis of transcripts
- Context retrieval suggestions
- Meeting summarization
- Question generation

### Future Considerations
- Local LLM (llama.cpp, Ollama) for offline capability
- Hybrid: local for speed-critical, cloud for quality-critical

---

## Summary: Recommended Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **App Framework** | Tauri (Rust + Web UI) | Cross-platform, small footprint, fast |
| **Audio Capture** | Platform-specific (Rust abstraction) | Core Audio / WASAPI / PulseAudio |
| **Transcription** | whisper.cpp | Local, fast, small footprint |
| **Diarization** | pyannote community-1 | Best open-source quality |
| **Vector DB** | sqlite-vec | Embedded, zero deps, fast |
| **LLM** | Claude CLI | Existing tooling, quality |
