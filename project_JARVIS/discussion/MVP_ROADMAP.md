# JARVIS MVP Roadmap

## Scope

**Goal**: Build the simplest working version — mic input → live transcription.

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Microphone    │────▶│   Whisper.cpp   │────▶│   Transcript    │
│   (selectable)  │     │   (local STT)   │     │   Display       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

**Out of scope for MVP**:
- System audio capture (Meeting mode)
- Voice analysis / coaching
- Speaker diarization
- Session storage
- Export functionality
- Cross-platform (macOS only)

---

## MVP Features

| Feature | Description |
|---------|-------------|
| Device selection | User picks microphone (built-in, AirPods, external) |
| Live capture | Stream audio from selected device |
| Real-time transcription | whisper.cpp processes audio locally |
| Transcript display | Show text as it's transcribed |
| Start/Stop | Basic recording controls |

---

## Milestones

```text
Week 1                    Week 2                    Week 3
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  M1: Project    │      │  M2: Whisper    │      │  M3: Polish     │
│  Setup + Audio  │─────▶│  Integration    │─────▶│  + Ship         │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

---

## Milestone 1: Project Setup + Audio Capture

### Tasks

- [ ] **1.1** Initialize Tauri project with React frontend
- [ ] **1.2** Set up Rust audio capture using `cpal` crate
- [ ] **1.3** List available input devices (microphones)
- [ ] **1.4** Build device selector UI dropdown
- [ ] **1.5** Capture audio from selected device
- [ ] **1.6** Verify audio stream (log levels / simple visualization)

### Deliverable

Working audio capture with device selection. User can pick mic, click start, see audio is being captured.

### Technical Details

**Cargo.toml dependencies**:

```toml
[dependencies]
tauri = { version = "2", features = [] }
cpal = "0.15"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

**Key code: List devices**

```rust
use cpal::traits::{DeviceTrait, HostTrait};

#[tauri::command]
fn list_audio_devices() -> Vec<String> {
    let host = cpal::default_host();
    host.input_devices()
        .unwrap()
        .filter_map(|d| d.name().ok())
        .collect()
}
```

**Key code: Start capture**

```rust
#[tauri::command]
fn start_capture(device_name: String) -> Result<(), String> {
    let host = cpal::default_host();
    let device = host.input_devices()
        .unwrap()
        .find(|d| d.name().ok() == Some(device_name.clone()))
        .ok_or("Device not found")?;

    let config = device.default_input_config().unwrap();

    let stream = device.build_input_stream(
        &config.into(),
        move |data: &[f32], _| {
            // Buffer audio for whisper
        },
        |err| eprintln!("Audio error: {}", err),
        None
    ).unwrap();

    stream.play().unwrap();
    Ok(())
}
```

**Frontend: Device selector**

```tsx
function DeviceSelector() {
  const [devices, setDevices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    invoke<string[]>('list_audio_devices').then(setDevices);
  }, []);

  return (
    <select value={selected} onChange={e => setSelected(e.target.value)}>
      <option value="">Select microphone...</option>
      {devices.map(d => <option key={d} value={d}>{d}</option>)}
    </select>
  );
}
```

---

## Milestone 2: Whisper Integration

### Tasks

- [ ] **2.1** Add `whisper-rs` crate (Rust bindings for whisper.cpp)
- [ ] **2.2** Download whisper model on first run (base.en, ~142MB)
- [ ] **2.3** Create audio buffer (ring buffer for streaming)
- [ ] **2.4** Process audio chunks through whisper
- [ ] **2.5** Emit transcript segments to frontend via Tauri events
- [ ] **2.6** Display live transcript in UI

### Deliverable

Real-time transcription. User speaks, sees words appear on screen.

### Technical Details

**Add whisper dependency**:

```toml
[dependencies]
whisper-rs = "0.11"
hound = "3.5"  # For audio format handling
```

**Key code: Transcription engine**

```rust
use whisper_rs::{WhisperContext, WhisperContextParameters, FullParams, SamplingStrategy};
use std::sync::{Arc, Mutex};

pub struct TranscriptionEngine {
    ctx: WhisperContext,
    audio_buffer: Arc<Mutex<Vec<f32>>>,
}

impl TranscriptionEngine {
    pub fn new(model_path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let ctx = WhisperContext::new_with_params(
            model_path,
            WhisperContextParameters::default()
        )?;

        Ok(Self {
            ctx,
            audio_buffer: Arc::new(Mutex::new(Vec::new())),
        })
    }

    pub fn push_audio(&self, samples: &[f32]) {
        let mut buffer = self.audio_buffer.lock().unwrap();
        buffer.extend_from_slice(samples);
    }

    pub fn transcribe(&self) -> Option<String> {
        let mut buffer = self.audio_buffer.lock().unwrap();

        // Need at least 1 second of audio (16000 samples at 16kHz)
        if buffer.len() < 16000 {
            return None;
        }

        let audio: Vec<f32> = buffer.drain(..).collect();
        drop(buffer);

        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_language(Some("en"));
        params.set_print_special(false);
        params.set_print_realtime(false);

        let mut state = self.ctx.create_state().ok()?;
        state.full(params, &audio).ok()?;

        let num_segments = state.full_n_segments().ok()?;
        let mut result = String::new();

        for i in 0..num_segments {
            if let Ok(text) = state.full_get_segment_text(i) {
                result.push_str(&text);
            }
        }

        if result.is_empty() { None } else { Some(result) }
    }
}
```

**Key code: Model download**

```rust
const MODEL_URL: &str = "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin";

async fn ensure_model() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let data_dir = dirs::data_dir()
        .ok_or("No data dir")?
        .join("jarvis")
        .join("models");

    std::fs::create_dir_all(&data_dir)?;

    let model_path = data_dir.join("ggml-base.en.bin");

    if !model_path.exists() {
        println!("Downloading whisper model...");
        let response = reqwest::get(MODEL_URL).await?;
        let bytes = response.bytes().await?;
        std::fs::write(&model_path, bytes)?;
        println!("Model downloaded.");
    }

    Ok(model_path)
}
```

**Frontend: Live transcript**

```tsx
function Transcript() {
  const [segments, setSegments] = useState<string[]>([]);

  useEffect(() => {
    const unlisten = listen<string>('transcript', (event) => {
      setSegments(prev => [...prev, event.payload]);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  return (
    <div className="transcript">
      {segments.map((s, i) => (
        <p key={i}>{s}</p>
      ))}
    </div>
  );
}
```

---

## Milestone 3: Polish + Ship

### Tasks

- [ ] **3.1** Add loading state while model downloads
- [ ] **3.2** Handle permission errors gracefully
- [ ] **3.3** Add visual recording indicator
- [ ] **3.4** Style the UI (minimal, clean)
- [ ] **3.5** Test with different microphones (built-in, AirPods, USB)
- [ ] **3.6** Build macOS release (.dmg)
- [ ] **3.7** Test on clean macOS install

### Deliverable

Polished MVP ready for personal use.

### UI Wireframe

```text
┌─────────────────────────────────────────────────────────┐
│  JARVIS                                    [─] [□] [×]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Microphone: [▼ MacBook Pro Microphone    ]            │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │  Hello, this is a test of the transcription      │ │
│  │  system. I'm speaking into my microphone and     │ │
│  │  the words are appearing on the screen in        │ │
│  │  real time.                                      │ │
│  │                                                   │ │
│  │  This is pretty cool. Let me try speaking a      │ │
│  │  bit faster to see how it handles that.          │ │
│  │                                                   │ │
│  │  █                                                │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│           [ ● Start Recording ]                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```text
jarvis-app/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── lib.rs            # Tauri commands
│   │   ├── audio.rs          # Device listing + capture
│   │   └── transcription.rs  # Whisper integration
│   └── icons/
├── src/
│   ├── App.tsx               # Main component
│   ├── main.tsx              # Entry point
│   ├── components/
│   │   ├── DeviceSelector.tsx
│   │   ├── RecordButton.tsx
│   │   └── Transcript.tsx
│   └── styles/
│       └── app.css
├── package.json
├── tsconfig.json
└── index.html
```

---

## Commands to Start

```bash
# Create project
npm create tauri-app@latest jarvis-app -- --template react-ts
cd jarvis-app

# Install frontend deps
npm install

# Add Rust deps (edit src-tauri/Cargo.toml)

# Run in dev mode
npm run tauri dev

# Build release
npm run tauri build
```

---

## Success Criteria

| Criteria | Target |
|----------|--------|
| Device selection works | All available mics listed |
| Transcription latency | < 3 seconds |
| Accuracy | Understandable output |
| Memory usage | < 500 MB during transcription |
| Works with AirPods | Yes |
| No crashes | Stable 10+ min sessions |

---

## After MVP

Once MVP is working:

1. **Add system audio** (Meeting mode)
2. **Add coaching metrics** (WPM, fillers)
3. **Add session storage** (SQLite)
4. **Add export** (Markdown)

But first: **ship the MVP**.
