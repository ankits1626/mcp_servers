# JARVIS - Implementation Plan

## Approach: System Audio Loopback

This document details the step-by-step implementation plan for building JARVIS using the system audio loopback approach.

---

## Two Operating Modes

JARVIS operates in two distinct modes, each with different audio sources and coaching focus.

### Mode 1: Personal (Communication Coach)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PERSONAL MODE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Audio Source: Microphone only (your voice)                         │
│                                                                      │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐   │
│  │   Your   │────▶│ Whisper  │────▶│  Voice   │────▶│ Coaching │   │
│  │   Voice  │     │  STT     │     │ Analysis │     │ Feedback │   │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘   │
│                                           │                         │
│                                           ▼                         │
│                                    ┌────────────┐                   │
│                                    │ • Pace     │                   │
│                                    │ • Filler   │                   │
│                                    │   words    │                   │
│                                    │ • Tone     │                   │
│                                    │ • Clarity  │                   │
│                                    │ • Energy   │                   │
│                                    └────────────┘                   │
│                                                                      │
│  Use Cases:                                                         │
│  • Practice presentations                                           │
│  • Rehearse pitches                                                 │
│  • Improve daily communication                                      │
│  • Voice journaling with analysis                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Mode 2: Meeting (Live Meeting Coach)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MEETING MODE                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Audio Sources: System Audio (others) + Microphone (you)            │
│                                                                      │
│  ┌──────────┐                              ┌──────────┐             │
│  │  Others  │──┐                      ┌───▶│ Their    │             │
│  │  (System │  │    ┌──────────┐      │    │ Analysis │             │
│  │   Audio) │  ├───▶│ Whisper  │──────┤    └──────────┘             │
│  └──────────┘  │    │  STT     │      │                             │
│                │    └──────────┘      │    ┌──────────┐             │
│  ┌──────────┐  │                      └───▶│ Your     │             │
│  │   You    │──┘                           │ Analysis │             │
│  │  (Mic)   │                              └──────────┘             │
│  └──────────┘                                    │                  │
│                                                  ▼                  │
│                                    ┌─────────────────────┐          │
│                                    │ Real-time Coaching  │          │
│                                    │ • Talk time balance │          │
│                                    │ • Interruption      │          │
│                                    │   patterns          │          │
│                                    │ • Question ratio    │          │
│                                    │ • Energy matching   │          │
│                                    │ • Filler words      │          │
│                                    │ • Pace vs others    │          │
│                                    └─────────────────────┘          │
│                                                                      │
│  Use Cases:                                                         │
│  • Sales calls                                                      │
│  • Client meetings                                                  │
│  • Job interviews                                                   │
│  • Team standups                                                    │
│  • Negotiations                                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Mode Comparison

| Aspect | Personal Mode | Meeting Mode |
|--------|---------------|--------------|
| **Audio Input** | Microphone only | System + Microphone |
| **Speakers** | Just you | You + others |
| **Primary Focus** | Self-improvement | Interaction dynamics |
| **Feedback Type** | Absolute metrics | Relative/comparative |
| **Privacy** | Your voice only | Full conversation |
| **Use Case** | Practice/training | Live assistance |

---

## Communication Coaching Features

Both modes share core coaching capabilities:

### Voice & Speech Analysis

| Metric | Description | Feedback Example |
|--------|-------------|------------------|
| **Speaking Pace** | Words per minute | "You're at 180 WPM — try slowing to 140" |
| **Filler Words** | um, uh, like, you know | "12 filler words in last 2 min" |
| **Pause Patterns** | Strategic vs awkward silence | "Good use of pause after key point" |
| **Vocal Energy** | Volume, pitch variation | "Energy dropped — re-engage" |
| **Clarity Score** | Articulation, mumbling | "Clearer enunciation on technical terms" |
| **Sentence Length** | Rambling vs concise | "Last answer was 45 sec — aim for 20" |

### Meeting-Specific Analysis (Mode 2 only)

| Metric | Description | Feedback Example |
|--------|-------------|------------------|
| **Talk Time Ratio** | % of conversation | "You: 70%, Others: 30% — ask more questions" |
| **Interruptions** | Cutting others off | "2 interruptions detected" |
| **Question Ratio** | Questions vs statements | "Only 1 question in 10 min" |
| **Response Latency** | Time before responding | "Avg 0.3s response — slow down, pause 1-2s" |
| **Mirror/Match** | Matching others' energy | "Others are calm, you're high-energy" |
| **Active Listening** | Acknowledgments, follow-ups | "Try 'tell me more about X'" |

---

## Phase Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION PHASES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Audio Capture + Mode Selection                                │
│  ├── Microphone capture (Personal Mode)                                 │
│  ├── System + Mic capture (Meeting Mode)                                │
│  ├── Mode toggle UI                                                     │
│  └── Tauri shell + React frontend                                       │
│                                                                          │
│  Phase 2: Transcription Engine                                          │
│  ├── whisper.cpp integration                                            │
│  ├── Real-time streaming transcription                                  │
│  └── Live transcript display                                            │
│                                                                          │
│  Phase 3: Voice & Communication Analysis                                │
│  ├── Speaking pace (WPM)                                                │
│  ├── Filler word detection                                              │
│  ├── Pause analysis                                                     │
│  ├── Vocal energy / pitch variation                                     │
│  └── Real-time coaching feedback UI                                     │
│                                                                          │
│  Phase 4: Meeting Mode Enhancements                                     │
│  ├── Speaker diarization (You vs Others)                                │
│  ├── Talk time ratio                                                    │
│  ├── Interruption detection                                             │
│  └── Interaction dynamics analysis                                      │
│                                                                          │
│  Phase 5: Session Management                                            │
│  ├── Start/stop/pause controls                                          │
│  ├── Transcript + metrics storage (SQLite)                              │
│  ├── Session history with insights                                      │
│  └── Export (Markdown, JSON)                                            │
│                                                                          │
│  Phase 6: Cross-Platform                                                │
│  ├── Windows support (WASAPI)                                           │
│  └── Linux support (PulseAudio)                                         │
│                                                                          │
│  Phase 7: Knowledge Layer                                               │
│  ├── Vector embeddings (sqlite-vec)                                     │
│  ├── Semantic search                                                    │
│  └── Knowledge importers                                                │
│                                                                          │
│  Phase 8: Intelligence Layer                                            │
│  ├── Claude integration                                                 │
│  ├── Real-time analysis                                                 │
│  └── Nudges and suggestions                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Audio Capture + Mode Selection

### Goal

Capture audio based on selected mode and stream it to the application.

### Mode-Specific Audio Sources

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     AUDIO CAPTURE BY MODE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PERSONAL MODE                        MEETING MODE                   │
│  ──────────────                       ────────────                   │
│                                                                      │
│  ┌──────────────┐                     ┌──────────────┐              │
│  │  Microphone  │                     │  Microphone  │              │
│  │  (Your voice)│                     │  (Your voice)│              │
│  └──────┬───────┘                     └──────┬───────┘              │
│         │                                    │                       │
│         │                             ┌──────┴───────┐              │
│         │                             │              │              │
│         │                     ┌───────▼────┐  ┌──────▼───────┐      │
│         │                     │  System    │  │  Microphone  │      │
│         │                     │  Audio     │  │  Stream      │      │
│         │                     │  (Others)  │  │  (You)       │      │
│         │                     └──────┬─────┘  └──────┬───────┘      │
│         │                            │               │              │
│         ▼                            └───────┬───────┘              │
│  ┌──────────────┐                            ▼                      │
│  │  Single      │                     ┌──────────────┐              │
│  │  Audio       │                     │  Dual Stream │              │
│  │  Stream      │                     │  (labeled)   │              │
│  └──────────────┘                     └──────────────┘              │
│                                                                      │
│  Analysis:                            Analysis:                      │
│  • Your speech only                   • Your speech                  │
│  • Absolute metrics                   • Others' speech               │
│                                       • Comparative metrics          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Technical Approach

#### Core Audio Taps (macOS 14.4+)

Native API, no drivers needed.

```text
PERSONAL MODE:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Microphone    │────▶│  Core Audio     │────▶│  Audio Buffer   │
│   Input         │     │  Input Tap      │     │  (Your voice)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘

MEETING MODE:
┌─────────────────┐     ┌─────────────────┐
│  System Audio   │────▶│  Core Audio     │────┐
│  (all apps)     │     │  Output Tap     │    │
└─────────────────┘     └─────────────────┘    │    ┌─────────────┐
                                               ├───▶│  Dual       │
┌─────────────────┐     ┌─────────────────┐    │    │  Stream     │
│   Microphone    │────▶│  Core Audio     │────┘    │  Buffer     │
│   Input         │     │  Input Tap      │         └─────────────┘
└─────────────────┘     └─────────────────┘
```

#### Key Resources

- [Apple Documentation: Capturing system audio with Core Audio taps](https://developer.apple.com/documentation/coreaudio/capturing-system-audio-with-core-audio-taps)
- [AudioCap Sample Code](https://github.com/insidegui/AudioCap) — Reference implementation
- [AudioTee](https://github.com/tsukimizake/AudioTee) — CLI tool using Core Audio taps

#### Implementation Steps

1. **Create Tauri project**
   ```bash
   npm create tauri-app@latest jarvis -- --template react-ts
   cd jarvis
   ```

2. **Add Rust audio capture module**

   Create `src-tauri/src/audio/mod.rs`:
   ```rust
   // Platform-specific audio capture trait
   pub trait AudioCapture {
       fn start(&mut self) -> Result<(), AudioError>;
       fn stop(&mut self);
       fn get_sample_rate(&self) -> u32;
   }

   // Audio callback for streaming samples
   pub type AudioCallback = Box<dyn Fn(&[f32]) + Send>;
   ```

3. **Implement macOS capture**

   Create `src-tauri/src/audio/macos.rs`:
   ```rust
   use coreaudio::audio_unit::AudioUnit;
   use coreaudio::sys::*;

   pub struct MacOSAudioCapture {
       tap: Option<AudioTap>,
       callback: Option<AudioCallback>,
   }

   impl MacOSAudioCapture {
       pub fn new() -> Self {
           // Initialize Core Audio tap
           // Request system audio permission
       }

       pub fn start_capture(&mut self, callback: AudioCallback) {
           // Start audio tap
           // Stream samples to callback
       }
   }
   ```

4. **Handle permissions**

   Add to `Info.plist`:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>JARVIS needs microphone access to capture your voice.</string>
   <key>NSAudioCaptureUsageDescription</key>
   <string>JARVIS needs audio capture to transcribe meetings.</string>
   ```

5. **Create Tauri commands**

   ```rust
   #[tauri::command]
   async fn start_capture(state: State<'_, AudioState>) -> Result<(), String> {
       state.capture.lock().unwrap().start()
   }

   #[tauri::command]
   async fn stop_capture(state: State<'_, AudioState>) -> Result<(), String> {
       state.capture.lock().unwrap().stop()
   }
   ```

6. **Basic UI**

   ```tsx
   // src/App.tsx
   function App() {
     const [isCapturing, setIsCapturing] = useState(false);

     const toggleCapture = async () => {
       if (isCapturing) {
         await invoke('stop_capture');
       } else {
         await invoke('start_capture');
       }
       setIsCapturing(!isCapturing);
     };

     return (
       <div>
         <button onClick={toggleCapture}>
           {isCapturing ? 'Stop' : 'Start'} Capture
         </button>
       </div>
     );
   }
   ```

### Deliverables

- [ ] Tauri project scaffolded
- [ ] Mode selection UI (Personal / Meeting toggle)
- [ ] Personal Mode: Microphone capture working
- [ ] Meeting Mode: System audio + Microphone capture working
- [ ] Audio samples streamed to Rust backend
- [ ] Basic start/stop UI with mode indicator

### Dependencies

```toml
# Cargo.toml
[dependencies]
coreaudio-rs = "0.11"  # macOS audio
cpal = "0.15"          # Cross-platform audio (fallback)
tauri = { version = "2.0", features = ["macos-private-api"] }
```

---

## Phase 2: Transcription Engine

### Goal

Real-time speech-to-text using whisper.cpp.

### Technical Approach

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Audio Buffer   │────▶│  VAD            │────▶│  Whisper.cpp    │
│  (PCM f32)      │     │  (detect speech)│     │  (transcribe)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Transcript     │
                                                │  Segments       │
                                                └─────────────────┘
```

#### Implementation Steps

1. **Add whisper.cpp Rust bindings**

   ```toml
   # Cargo.toml
   [dependencies]
   whisper-rs = "0.11"  # Rust bindings for whisper.cpp
   ```

2. **Download Whisper model**

   ```rust
   // On first run, download model
   const MODEL_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin";

   async fn ensure_model() -> PathBuf {
       let model_path = dirs::data_dir().unwrap().join("jarvis/models/whisper-base.en.bin");
       if !model_path.exists() {
           download_file(MODEL_URL, &model_path).await?;
       }
       model_path
   }
   ```

3. **Create transcription pipeline**

   ```rust
   pub struct TranscriptionEngine {
       whisper: WhisperContext,
       buffer: AudioRingBuffer,
   }

   impl TranscriptionEngine {
       pub fn new(model_path: &Path) -> Result<Self> {
           let whisper = WhisperContext::new(model_path)?;
           Ok(Self {
               whisper,
               buffer: AudioRingBuffer::new(16000 * 30), // 30 sec buffer
           })
       }

       pub fn process_audio(&mut self, samples: &[f32]) -> Option<TranscriptSegment> {
           self.buffer.push(samples);

           // Process when we have enough audio (e.g., 5 seconds)
           if self.buffer.len() >= 16000 * 5 {
               let audio = self.buffer.drain();
               let result = self.whisper.transcribe(&audio)?;
               return Some(result);
           }
           None
       }
   }
   ```

4. **Stream transcripts to UI**

   ```rust
   #[tauri::command]
   fn subscribe_transcripts(window: Window) {
       // Send transcript updates via Tauri events
       window.emit("transcript", segment)?;
   }
   ```

   ```tsx
   // Frontend
   useEffect(() => {
     const unlisten = listen<TranscriptSegment>('transcript', (event) => {
       setTranscripts(prev => [...prev, event.payload]);
     });
     return () => { unlisten.then(f => f()); };
   }, []);
   ```

5. **Streaming mode (lower latency)**

   ```rust
   // Use whisper.cpp streaming API for <2s latency
   let mut state = whisper.create_state()?;

   // Process in overlapping windows
   loop {
       let samples = audio_buffer.get_last_n_seconds(5);
       state.process_audio(&samples)?;

       // Get partial results
       if let Some(text) = state.get_text() {
           emit_transcript(text);
       }

       sleep(Duration::from_millis(500));
   }
   ```

### Deliverables

- [ ] whisper.cpp integrated
- [ ] Model auto-download on first run
- [ ] Real-time transcription (<3s latency)
- [ ] Transcripts displayed in UI
- [ ] Timestamps on each segment

### Model Options

| Model | Size | Speed | Quality |
|-------|------|-------|---------|
| tiny.en | 75 MB | Fastest | Good for English |
| base.en | 142 MB | Fast | Better accuracy |
| small.en | 466 MB | Medium | High accuracy |
| medium.en | 1.5 GB | Slow | Very high accuracy |

Start with `base.en` for balance of speed and quality.

---

## Phase 3: Voice & Communication Analysis

### Goal

Real-time analysis of speech patterns to provide coaching feedback.

### Analysis Pipeline

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Transcript +   │────▶│  Speech         │────▶│  Coaching       │
│  Audio Features │     │  Analyzer       │     │  Metrics        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌──────────────────────────┤
                              │                          │
                              ▼                          ▼
                       ┌────────────┐            ┌────────────┐
                       │  Real-time │            │  Session   │
                       │  Nudges    │            │  Summary   │
                       └────────────┘            └────────────┘
```

### Core Metrics Implementation

#### 1. Speaking Pace (Words Per Minute)

```rust
pub struct PaceAnalyzer {
    word_timestamps: Vec<(String, f64, f64)>,  // (word, start, end)
    window_seconds: f64,  // sliding window for WPM calculation
}

impl PaceAnalyzer {
    pub fn calculate_wpm(&self, window_start: f64, window_end: f64) -> f32 {
        let words_in_window = self.word_timestamps.iter()
            .filter(|(_, start, _)| *start >= window_start && *start < window_end)
            .count();

        let duration_minutes = (window_end - window_start) / 60.0;
        (words_in_window as f32) / duration_minutes as f32
    }

    pub fn get_feedback(&self, wpm: f32) -> Option<CoachingNudge> {
        match wpm {
            w if w > 180.0 => Some(CoachingNudge::SlowDown {
                current: w,
                target: 140.0,
                message: "Speaking too fast — slow down to 140 WPM".into()
            }),
            w if w < 100.0 => Some(CoachingNudge::SpeedUp {
                current: w,
                target: 130.0,
                message: "Speaking slowly — try to maintain 130 WPM".into()
            }),
            _ => None  // Good pace, no feedback needed
        }
    }
}
```

#### 2. Filler Word Detection

```rust
const FILLER_WORDS: &[&str] = &[
    "um", "uh", "ah", "er", "like", "you know", "basically",
    "actually", "literally", "right", "so", "well", "I mean"
];

pub struct FillerDetector {
    filler_counts: HashMap<String, u32>,
    total_words: u32,
}

impl FillerDetector {
    pub fn process_transcript(&mut self, text: &str) {
        let words: Vec<&str> = text.to_lowercase().split_whitespace().collect();
        self.total_words += words.len() as u32;

        for filler in FILLER_WORDS {
            let count = text.to_lowercase().matches(filler).count() as u32;
            *self.filler_counts.entry(filler.to_string()).or_insert(0) += count;
        }
    }

    pub fn get_filler_ratio(&self) -> f32 {
        let total_fillers: u32 = self.filler_counts.values().sum();
        (total_fillers as f32) / (self.total_words as f32) * 100.0
    }

    pub fn get_feedback(&self) -> Option<CoachingNudge> {
        let ratio = self.get_filler_ratio();
        if ratio > 5.0 {
            let top_filler = self.filler_counts.iter()
                .max_by_key(|(_, count)| *count)
                .map(|(word, _)| word.clone());

            Some(CoachingNudge::ReduceFillers {
                ratio,
                top_filler,
                message: format!("Filler words at {:.1}% — try pausing instead", ratio)
            })
        } else {
            None
        }
    }
}
```

#### 3. Pause Analysis

```rust
pub struct PauseAnalyzer {
    pauses: Vec<Pause>,  // (start, end, duration)
}

#[derive(Debug)]
pub struct Pause {
    start: f64,
    end: f64,
    duration: f64,
    pause_type: PauseType,
}

#[derive(Debug)]
pub enum PauseType {
    Strategic,    // 0.5-2s after key point
    Thinking,     // 2-4s mid-thought
    Awkward,      // >4s or at wrong moment
    None,         // <0.5s normal breathing
}

impl PauseAnalyzer {
    pub fn detect_pauses(&mut self, word_timestamps: &[(String, f64, f64)]) {
        for window in word_timestamps.windows(2) {
            let gap = window[1].1 - window[0].2;  // start of next - end of current

            if gap >= 0.5 {
                let pause_type = match gap {
                    d if d < 2.0 => PauseType::Strategic,
                    d if d < 4.0 => PauseType::Thinking,
                    _ => PauseType::Awkward,
                };

                self.pauses.push(Pause {
                    start: window[0].2,
                    end: window[1].1,
                    duration: gap,
                    pause_type,
                });
            }
        }
    }
}
```

#### 4. Vocal Energy (Audio Features)

```rust
pub struct VocalEnergyAnalyzer {
    rms_history: Vec<f32>,      // Root mean square (volume)
    pitch_history: Vec<f32>,    // Fundamental frequency estimates
}

impl VocalEnergyAnalyzer {
    pub fn process_audio_frame(&mut self, samples: &[f32]) {
        // Calculate RMS (volume)
        let rms = (samples.iter().map(|s| s * s).sum::<f32>() / samples.len() as f32).sqrt();
        self.rms_history.push(rms);

        // Pitch estimation would use autocorrelation or similar
        // Simplified here - would use a proper pitch detection library
    }

    pub fn get_energy_trend(&self) -> EnergyTrend {
        if self.rms_history.len() < 10 {
            return EnergyTrend::Stable;
        }

        let recent: f32 = self.rms_history.iter().rev().take(5).sum::<f32>() / 5.0;
        let earlier: f32 = self.rms_history.iter().rev().skip(5).take(5).sum::<f32>() / 5.0;

        let change = (recent - earlier) / earlier;

        match change {
            c if c < -0.2 => EnergyTrend::Dropping,
            c if c > 0.2 => EnergyTrend::Rising,
            _ => EnergyTrend::Stable,
        }
    }
}
```

### Coaching Feedback UI

```tsx
// src/components/CoachingPanel.tsx
interface CoachingMetrics {
  wpm: number;
  targetWpm: { min: number; max: number };
  fillerRatio: number;
  topFiller: string | null;
  energyTrend: 'rising' | 'stable' | 'dropping';
  pauseQuality: 'good' | 'too_few' | 'too_long';
}

function CoachingPanel({ metrics }: { metrics: CoachingMetrics }) {
  return (
    <div className="coaching-panel">
      {/* Speaking Pace */}
      <MetricGauge
        label="Pace"
        value={metrics.wpm}
        min={80}
        max={200}
        optimalRange={[120, 150]}
        unit="WPM"
      />

      {/* Filler Words */}
      <MetricBar
        label="Fillers"
        value={metrics.fillerRatio}
        max={10}
        threshold={5}
        warning={metrics.topFiller ? `Watch: "${metrics.topFiller}"` : null}
      />

      {/* Energy Indicator */}
      <EnergyIndicator trend={metrics.energyTrend} />

      {/* Real-time Nudges */}
      <NudgeList nudges={activeNudges} />
    </div>
  );
}
```

### Deliverables

- [ ] Speaking pace (WPM) calculation with real-time display
- [ ] Filler word detection and counting
- [ ] Pause pattern analysis
- [ ] Volume/energy tracking
- [ ] Real-time coaching nudge system
- [ ] Session summary with improvement suggestions

---

## Phase 4: Meeting Mode Enhancements

### Goal

Add meeting-specific analysis: speaker diarization and interaction dynamics.

### Speaker Detection (You vs Others)

For Meeting Mode, we capture two separate audio streams:

```rust
pub struct DualStreamCapture {
    system_audio: AudioStream,  // Others (from system loopback)
    microphone: AudioStream,    // You (from mic input)
}

// Label based on which stream the audio came from
fn label_transcript(segment: &TranscriptSegment, source: AudioSource) -> LabeledSegment {
    LabeledSegment {
        text: segment.text.clone(),
        speaker: match source {
            AudioSource::Microphone => "You",
            AudioSource::System => "Other",
        },
        timestamp: segment.timestamp,
    }
}
```

### Meeting Interaction Metrics

```rust
pub struct MeetingAnalyzer {
    your_talk_time: Duration,
    others_talk_time: Duration,
    interruptions: Vec<Interruption>,
    questions_asked: u32,
    statements_made: u32,
}

impl MeetingAnalyzer {
    pub fn get_talk_time_ratio(&self) -> f32 {
        let total = self.your_talk_time + self.others_talk_time;
        self.your_talk_time.as_secs_f32() / total.as_secs_f32() * 100.0
    }

    pub fn detect_interruption(&mut self, your_segment: &Segment, other_segment: &Segment) {
        // Interruption = you started speaking while other was still speaking
        if your_segment.start < other_segment.end && your_segment.start > other_segment.start {
            self.interruptions.push(Interruption {
                time: your_segment.start,
                overlap_duration: other_segment.end - your_segment.start,
            });
        }
    }

    pub fn analyze_question(&mut self, text: &str) {
        // Simple heuristic: ends with ? or starts with question words
        let question_starters = ["what", "why", "how", "when", "where", "who", "can", "could", "would", "do", "does", "is", "are"];
        let is_question = text.trim().ends_with('?') ||
            question_starters.iter().any(|q| text.to_lowercase().starts_with(q));

        if is_question {
            self.questions_asked += 1;
        } else {
            self.statements_made += 1;
        }
    }

    pub fn get_question_ratio(&self) -> f32 {
        let total = self.questions_asked + self.statements_made;
        if total == 0 { return 0.0; }
        (self.questions_asked as f32) / (total as f32) * 100.0
    }
}
```

### Meeting Mode UI

```tsx
function MeetingMetricsPanel({ metrics }: { metrics: MeetingMetrics }) {
  return (
    <div className="meeting-panel">
      {/* Talk Time Balance */}
      <TalkTimeBar
        you={metrics.yourTalkTime}
        others={metrics.othersTalkTime}
        optimalYouRange={[30, 50]}  // You should talk 30-50%
      />

      {/* Interruption Alert */}
      {metrics.recentInterruption && (
        <Alert type="warning">
          You interrupted — let them finish
        </Alert>
      )}

      {/* Question Ratio */}
      <MetricBar
        label="Questions Asked"
        value={metrics.questionRatio}
        target={30}  // Aim for 30% questions
        hint="Ask more questions to engage"
      />

      {/* Energy Match */}
      <EnergyMatch
        yourEnergy={metrics.yourEnergy}
        theirEnergy={metrics.theirEnergy}
      />
    </div>
  );
}
```

### Deliverables

- [ ] Dual-stream audio capture (You vs Others)
- [ ] Talk time ratio calculation and display
- [ ] Interruption detection
- [ ] Question vs statement ratio
- [ ] Energy/pace comparison between speakers
- [ ] pyannote integration for multi-speaker diarization (future enhancement)

---

## Phase 5: Session Management

### Goal

Manage recording sessions with storage and export.

### Technical Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   [Idle] ──Start──▶ [Recording] ──Stop──▶ [Saved]               │
│             │              │                  │                  │
│             │          [Pause]                │                  │
│             │              │                  │                  │
│             │              ▼                  │                  │
│             │          [Paused]               │                  │
│             │              │                  │                  │
│             │          [Resume]               │                  │
│             │              │                  │                  │
│             └──────────────┘                  │                  │
│                                               │                  │
│                                    ┌──────────┴──────────┐       │
│                                    │                     │       │
│                                    ▼                     ▼       │
│                               [Export MD]          [Export JSON] │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Database Schema

```sql
-- sessions table
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    title TEXT,
    meeting_platform TEXT,  -- 'google_meet', 'zoom', 'teams', 'unknown'
    status TEXT DEFAULT 'active'  -- 'active', 'completed', 'archived'
);

-- transcripts table
CREATE TABLE transcripts (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    speaker TEXT,           -- 'You', 'Speaker 1', etc.
    text TEXT NOT NULL,
    start_time REAL NOT NULL,
    end_time REAL NOT NULL,
    confidence REAL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Create FTS index for search
CREATE VIRTUAL TABLE transcripts_fts USING fts5(
    text,
    content='transcripts',
    content_rowid='rowid'
);
```

#### Implementation

```rust
pub struct SessionManager {
    db: SqliteConnection,
    current_session: Option<Session>,
}

impl SessionManager {
    pub fn start_session(&mut self) -> Result<SessionId> {
        let session = Session::new();
        sqlx::query("INSERT INTO sessions (id, started_at) VALUES (?, ?)")
            .bind(&session.id)
            .bind(Utc::now())
            .execute(&self.db)?;
        self.current_session = Some(session.clone());
        Ok(session.id)
    }

    pub fn add_transcript(&self, segment: TranscriptSegment) -> Result<()> {
        let session = self.current_session.as_ref().ok_or("No active session")?;
        sqlx::query("INSERT INTO transcripts (...) VALUES (...)")
            .bind(&session.id)
            .bind(&segment.speaker)
            .bind(&segment.text)
            .execute(&self.db)?;
        Ok(())
    }

    pub fn export_markdown(&self, session_id: &str) -> Result<String> {
        let transcripts = self.get_transcripts(session_id)?;
        let mut md = String::new();

        md.push_str(&format!("# Meeting Transcript\n\n"));
        md.push_str(&format!("**Date**: {}\n\n", session.started_at));
        md.push_str("---\n\n");

        for t in transcripts {
            md.push_str(&format!("**{}** ({}): {}\n\n",
                t.speaker,
                format_timestamp(t.start_time),
                t.text
            ));
        }

        Ok(md)
    }
}
```

### UI Components

```tsx
// Session controls
function SessionControls() {
  const [session, setSession] = useState<Session | null>(null);

  return (
    <div className="controls">
      {!session ? (
        <button onClick={startSession}>Start Recording</button>
      ) : (
        <>
          <button onClick={pauseSession}>Pause</button>
          <button onClick={stopSession}>Stop</button>
          <span className="recording-indicator" />
        </>
      )}
    </div>
  );
}

// Session history
function SessionHistory() {
  const [sessions, setSessions] = useState<Session[]>([]);

  return (
    <div className="history">
      {sessions.map(s => (
        <div key={s.id} className="session-item">
          <span>{s.title || formatDate(s.started_at)}</span>
          <button onClick={() => exportMarkdown(s.id)}>Export</button>
        </div>
      ))}
    </div>
  );
}
```

### Deliverables

- [ ] SQLite database setup
- [ ] Start/stop/pause session
- [ ] Transcripts persisted to database
- [ ] Session history view
- [ ] Export to Markdown
- [ ] Export to JSON
- [ ] Full-text search across sessions

---

## Phase 5: Cross-Platform Support

### Goal

Add Windows and Linux support.

### Platform-Specific Audio Capture

#### Windows (WASAPI Loopback)

```rust
// src-tauri/src/audio/windows.rs
use windows::Win32::Media::Audio::*;

pub struct WindowsAudioCapture {
    device: IMMDevice,
    client: IAudioClient,
}

impl WindowsAudioCapture {
    pub fn new() -> Result<Self> {
        // Get default audio endpoint
        let enumerator: IMMDeviceEnumerator = CoCreateInstance(...)?;
        let device = enumerator.GetDefaultAudioEndpoint(eRender, eConsole)?;

        // Initialize in loopback mode
        let client: IAudioClient = device.Activate(...)?;
        client.Initialize(
            AUDCLNT_SHAREMODE_SHARED,
            AUDCLNT_STREAMFLAGS_LOOPBACK,  // Key flag for loopback
            ...
        )?;

        Ok(Self { device, client })
    }
}
```

#### Linux (PulseAudio/PipeWire)

```rust
// src-tauri/src/audio/linux.rs
use libpulse_binding as pulse;

pub struct LinuxAudioCapture {
    context: pulse::context::Context,
    stream: pulse::stream::Stream,
}

impl LinuxAudioCapture {
    pub fn new() -> Result<Self> {
        // Connect to PulseAudio
        let mainloop = pulse::mainloop::standard::Mainloop::new()?;
        let context = pulse::context::Context::new(&mainloop, "jarvis")?;

        // Create monitor stream (captures output)
        let stream = pulse::stream::Stream::new(
            &context,
            "jarvis-capture",
            &spec,
            None
        )?;

        // Connect to monitor source
        stream.connect_record(Some("@DEFAULT_MONITOR@"), None, ...)?;

        Ok(Self { context, stream })
    }
}
```

#### Unified Interface

```rust
// src-tauri/src/audio/mod.rs
pub trait AudioCapture: Send {
    fn start(&mut self, callback: AudioCallback) -> Result<()>;
    fn stop(&mut self);
    fn list_devices(&self) -> Vec<AudioDevice>;
}

#[cfg(target_os = "macos")]
pub use macos::MacOSAudioCapture as PlatformAudioCapture;

#[cfg(target_os = "windows")]
pub use windows::WindowsAudioCapture as PlatformAudioCapture;

#[cfg(target_os = "linux")]
pub use linux::LinuxAudioCapture as PlatformAudioCapture;
```

### Deliverables

- [ ] Windows WASAPI loopback capture
- [ ] Linux PulseAudio monitor capture
- [ ] Unified audio trait across platforms
- [ ] Platform-specific builds (CI/CD)

---

## Phase 6: Knowledge Layer

### Goal

Store and search all knowledge for context retrieval.

### Technical Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                       KNOWLEDGE LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  │  Transcript │     │  Embedding  │     │  sqlite-vec │            │
│  │  Chunk      │────▶│  Model      │────▶│  Storage    │            │
│  └─────────────┘     └─────────────┘     └─────────────┘            │
│                                                 │                    │
│                                                 │                    │
│  ┌─────────────┐                               │                    │
│  │  Query      │                               │                    │
│  │  "What did  │──────────────────────────────▶│                    │
│  │  John say   │                               │                    │
│  │  about X?"  │                               ▼                    │
│  └─────────────┘                         ┌─────────────┐            │
│                                          │  Top K      │            │
│                                          │  Results    │            │
│                                          └─────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### sqlite-vec Setup

```sql
-- Enable sqlite-vec extension
SELECT load_extension('vec0');

-- Create embeddings table
CREATE VIRTUAL TABLE knowledge_vec USING vec0(
    embedding FLOAT[384]  -- all-MiniLM-L6-v2 dimension
);

-- Metadata table
CREATE TABLE knowledge (
    id INTEGER PRIMARY KEY,
    source_type TEXT,      -- 'transcript', 'article', 'llm_chat'
    source_id TEXT,
    chunk_text TEXT,
    metadata JSON,
    created_at DATETIME
);
```

#### Embedding Pipeline

```rust
use fastembed::{TextEmbedding, InitOptions, EmbeddingModel};

pub struct EmbeddingEngine {
    model: TextEmbedding,
}

impl EmbeddingEngine {
    pub fn new() -> Result<Self> {
        let model = TextEmbedding::try_new(InitOptions {
            model_name: EmbeddingModel::AllMiniLML6V2,
            show_download_progress: true,
            ..Default::default()
        })?;
        Ok(Self { model })
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        let embeddings = self.model.embed(vec![text], None)?;
        Ok(embeddings[0].clone())
    }

    pub fn search(&self, query: &str, limit: usize) -> Result<Vec<SearchResult>> {
        let query_embedding = self.embed(query)?;

        let results = sqlx::query_as::<_, SearchResult>(
            "SELECT k.*, vec_distance_cosine(v.embedding, ?) as distance
             FROM knowledge k
             JOIN knowledge_vec v ON k.id = v.rowid
             ORDER BY distance
             LIMIT ?"
        )
        .bind(&query_embedding)
        .bind(limit as i32)
        .fetch_all(&self.db)?;

        Ok(results)
    }
}
```

### Deliverables

- [ ] sqlite-vec integration
- [ ] Local embedding model (all-MiniLM-L6-v2)
- [ ] Transcript chunking and embedding
- [ ] Semantic search across all transcripts
- [ ] Knowledge importers (future: YouTube, Medium, LLM chats)

---

## Phase 7: Intelligence Layer

### Goal

Real-time analysis and assistance using Claude.

### Technical Approach

```
┌─────────────────────────────────────────────────────────────────────┐
│                      INTELLIGENCE LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐            │
│  │  Live       │     │  Context    │     │  Claude     │            │
│  │  Transcript │────▶│  Assembly   │────▶│  Analysis   │            │
│  └─────────────┘     └─────────────┘     └─────────────┘            │
│         │                   │                   │                    │
│         │                   │                   ▼                    │
│         │                   │            ┌─────────────┐            │
│         │                   │            │  Nudges     │            │
│         │                   │            │  - Questions│            │
│         │                   │            │  - Facts    │            │
│         │                   │            │  - Context  │            │
│         │                   │            └─────────────┘            │
│         │                   │                                        │
│         ▼                   ▼                                        │
│  ┌─────────────────────────────────────────────┐                    │
│  │           Knowledge Retrieval               │                    │
│  │  (relevant past context from sqlite-vec)    │                    │
│  └─────────────────────────────────────────────┘                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Claude Integration

```rust
use anthropic_sdk::{Client, Message};

pub struct IntelligenceEngine {
    client: Client,
    knowledge: KnowledgeLayer,
}

impl IntelligenceEngine {
    pub async fn analyze_transcript(&self, transcript: &str) -> Result<Analysis> {
        // Retrieve relevant context
        let context = self.knowledge.search(transcript, 5)?;

        // Build prompt
        let prompt = format!(
            "You are JARVIS, an AI assistant helping during a live meeting.

            Current transcript (last 2 minutes):
            {transcript}

            Relevant context from past knowledge:
            {context}

            Provide:
            1. Any facts that should be verified
            2. Suggested follow-up questions
            3. Relevant context the user might want to mention

            Be concise. This is for real-time assistance."
        );

        let response = self.client.messages()
            .create(Message {
                model: "claude-sonnet-4-20250514",
                max_tokens: 300,
                messages: vec![("user", prompt)],
            })
            .await?;

        parse_analysis(&response.content)
    }
}
```

#### Nudge System

```rust
pub enum Nudge {
    FactCheck { claim: String, status: FactStatus, source: Option<String> },
    SuggestedQuestion { question: String, context: String },
    RelevantContext { summary: String, source: String },
    SpeakingPace { wpm: u32, suggestion: String },
}

pub struct NudgeManager {
    nudges: VecDeque<Nudge>,
    last_analysis: Instant,
}

impl NudgeManager {
    pub fn should_analyze(&self) -> bool {
        // Analyze every 30 seconds of new content
        self.last_analysis.elapsed() > Duration::from_secs(30)
    }

    pub fn add_nudge(&mut self, nudge: Nudge) {
        self.nudges.push_back(nudge);
        // Emit to UI
    }
}
```

### Deliverables

- [ ] Claude API integration
- [ ] Context assembly from transcript + knowledge
- [ ] Fact-checking suggestions
- [ ] Question suggestions
- [ ] Relevant context surfacing
- [ ] Unobtrusive nudge UI

---

## Project Structure

```
jarvis/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── audio/
│   │   │   ├── mod.rs
│   │   │   ├── macos.rs
│   │   │   ├── windows.rs
│   │   │   └── linux.rs
│   │   ├── transcription/
│   │   │   ├── mod.rs
│   │   │   ├── whisper.rs
│   │   │   └── streaming.rs
│   │   ├── diarization/
│   │   │   ├── mod.rs
│   │   │   └── pyannote.rs
│   │   ├── session/
│   │   │   ├── mod.rs
│   │   │   ├── manager.rs
│   │   │   └── export.rs
│   │   ├── knowledge/
│   │   │   ├── mod.rs
│   │   │   ├── embedding.rs
│   │   │   ├── search.rs
│   │   │   └── importers/
│   │   ├── intelligence/
│   │   │   ├── mod.rs
│   │   │   ├── claude.rs
│   │   │   └── nudges.rs
│   │   ├── commands.rs
│   │   └── db.rs
│   └── migrations/
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   │   ├── Transcript.tsx
│   │   ├── Controls.tsx
│   │   ├── SessionHistory.tsx
│   │   ├── Nudges.tsx
│   │   └── Settings.tsx
│   ├── hooks/
│   │   ├── useTranscript.ts
│   │   ├── useSession.ts
│   │   └── useNudges.ts
│   ├── stores/
│   │   └── appStore.ts
│   └── styles/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Rust 1.75+
- Node.js 20+
- macOS 14.4+ (for Core Audio Taps)
- Xcode Command Line Tools

### Quick Start

```bash
# Clone and setup
git clone https://github.com/you/jarvis.git
cd jarvis

# Install dependencies
npm install
cd src-tauri && cargo build && cd ..

# Run in development
npm run tauri dev
```

### First Build

```bash
# Build for macOS
npm run tauri build

# Output: src-tauri/target/release/bundle/macos/JARVIS.app
```

---

## Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Transcription latency | <3 seconds |
| Word Error Rate | <15% (base.en model) |
| Memory usage (idle) | <100 MB |
| Memory usage (active) | <500 MB |
| App bundle size | <50 MB (excluding models) |
| Startup time | <1 second |
