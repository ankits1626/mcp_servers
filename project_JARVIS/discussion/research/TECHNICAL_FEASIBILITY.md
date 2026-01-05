# JARVIS - Technical Feasibility Analysis

## Question: Can JARVIS listen to live Google Meet conversations?

**Answer: YES — Multiple proven approaches exist.**

---

## Approaches Ranked by Complexity

| Approach | Complexity | Pros | Cons |
|----------|------------|------|------|
| **1. System Audio Loopback** | Low | Universal, no API deps, works offline | Requires driver/permission setup |
| **2. Chrome Extension** | Medium | No drivers, direct tab access | Chrome only, MV3 complexity |
| **3. Google Meet Media API** | High | Official, structured data | Preview only, requires approval |
| **4. Meeting Bot (Headless)** | High | Server-side, scalable | Complex infra, visible bot |

---

## 1. System Audio Loopback (Recommended for MVP)

### How It Works

Desktop app captures all system audio output via loopback — any sound playing through speakers (Google Meet, Zoom, Teams, etc.) gets captured.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Google Meet │────▶│   System    │────▶│   JARVIS    │
│   Audio     │     │   Mixer     │     │   Capture   │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    ┌─────────────┐
                    │  Speakers   │
                    │ (you hear)  │
                    └─────────────┘
```

### Platform APIs

| Platform | API | Requirements |
|----------|-----|--------------|
| **macOS 14.2+** | Core Audio Taps | System permission |
| **macOS 12+** | ScreenCaptureKit | Screen recording permission |
| **macOS (any)** | BlackHole driver | Driver install |
| **Windows** | WASAPI Loopback | None (built-in) |
| **Linux** | PulseAudio/PipeWire | Virtual sink config |

### Existing Products Using This Approach

- **[Jamie](https://www.meetjamie.ai/)** — "Bot-free native recorder that captures system audio on macOS and Windows"
- **[Krisp](https://krisp.ai/)** — Captures audio from Zoom, Teams, Meet without bots
- **[Slipbox](https://slipbox.app/)** — Mac-only, local transcription, no bots

### Feasibility: HIGH

This is the approach most privacy-focused meeting transcription tools use. It's proven, works with any meeting platform, and doesn't require API access.

**Sources:**
- [Jamie Meeting Transcription](https://www.meetjamie.ai/blog/meeting-transcription-software)
- [Krisp AI](https://krisp.ai/meeting-transcription/)
- [Windows WASAPI Loopback](https://learn.microsoft.com/en-us/windows/win32/coreaudio/loopback-recording)
- [Loopback + Transcription Guide](https://rogueamoeba.com/support/knowledgebase/?showArticle=Loopback-Transcription)

---

## 2. Chrome Extension (Alternative)

### How It Works

Chrome extension uses `chrome.tabCapture` API to capture audio directly from the Google Meet tab.

```
┌─────────────────────────────────────────────┐
│                Chrome Browser               │
│  ┌───────────────────────────────────────┐  │
│  │           Google Meet Tab             │  │
│  │                                       │  │
│  │    chrome.tabCapture.capture()        │──┼──▶ MediaStream ──▶ JARVIS
│  │                                       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Key APIs

- **`chrome.tabCapture.capture()`** — Get MediaStream of current tab
- **`chrome.tabCapture.getMediaStreamId()`** — Chrome 116+, works in service worker
- **Offscreen Document** — Required in Manifest V3 for MediaRecorder

### Implementation Notes

- User must click extension to activate capture
- Audio stops playing to user unless you create AudioContext bridge
- Works only in Chromium browsers (Chrome, Edge, Brave)
- Manifest V3 requires offscreen document architecture

### Feasibility: MEDIUM-HIGH

Well-documented approach with existing open-source examples.

**Sources:**
- [Chrome tabCapture API](https://developer.chrome.com/docs/extensions/reference/api/tabCapture)
- [Chrome Audio Capture Extension](https://github.com/teamplanes/audio-capture-extension)
- [Deepgram Tab Audio Transcription](https://deepgram.com/learn/transcribing-browser-tab-audio-chrome-extensions)
- [How to Build Chrome Recording Extension](https://www.recall.ai/blog/how-to-build-a-chrome-recording-extension)

---

## 3. Google Meet Media API (Official)

### How It Works

Google's official API provides WebRTC streams from Meet conferences.

### Current Status (2026)

- **Developer Preview** — not generally available
- All participants must be in developer preview program
- Host must approve app access in-meeting
- 3 audio streams created automatically

### Capabilities

- Access audio/video streams via WebRTC
- Meeting metadata
- Screenshare capture

### Limitations

- Preview restrictions make it impractical for personal use
- Requires Google Workspace approval
- Participants must opt-in

### Feasibility: LOW (for now)

Not viable for personal/MVP use until GA release.

**Sources:**
- [Google Meet Media API Overview](https://developers.google.com/workspace/meet/media-api/guides/overview)
- [What is Google Meet Media API](https://www.recall.ai/blog/what-is-the-google-meet-media-api)

---

## 4. Headless Browser Bot

### How It Works

Bot joins meeting via headless Chrome, captures tab audio, streams to ASR.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Server    │     │  Headless   │     │   Google    │
│  (JARVIS)   │────▶│   Chrome    │────▶│    Meet     │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          ▼
                    Virtual Audio ──▶ ffmpeg ──▶ Whisper
```

### Requirements

- Server with virtual audio (PulseAudio)
- Headless Chrome/Puppeteer
- ffmpeg for audio capture
- Visible "bot" participant in meeting

### Third-Party APIs

- **[Recall.ai](https://recall.ai)** — Prebuilt meeting bots for Zoom, Teams, Meet
- **[Nylas](https://nylas.com)** — Meeting recording APIs

### Feasibility: MEDIUM

Complex infrastructure, but proven approach. Bot visibility may be unwanted.

**Sources:**
- [Building Google Meet Bot](https://www.gladia.io/blog/how-to-build-a-google-meet-bot-for-recording-and-video-transcription)
- [Recall.ai Meet Transcripts](https://www.recall.ai/blog/how-to-get-transcripts-from-google-meet-developer-edition)
- [Nylas Meeting APIs](https://www.nylas.com/blog/best-apis-for-recording-zoom-microsoft-teams-google-meet/)

---

## Recommendation for JARVIS MVP

### Primary: System Audio Loopback

**Why:**
1. Works with ANY meeting platform (Meet, Zoom, Teams, Webex, phone calls)
2. No visible bot in meeting
3. Local processing — privacy preserved
4. Proven by Jamie, Krisp, Slipbox
5. No API dependencies or approval needed

**Implementation:**
- macOS: Core Audio Taps (14.2+) or ScreenCaptureKit (12+)
- Windows: WASAPI Loopback (built-in)
- Linux: PulseAudio monitor source

### Secondary: Chrome Extension (Optional)

Build as companion for browser-specific features:
- Detect when user joins a meeting
- Auto-start capture
- Inject UI overlays into Meet page

---

## AirPods / Bluetooth Headphones

**Question: Does it work if I'm using AirPods?**

**Answer: YES — with a small nuance.**

### How It Works

System audio loopback captures audio **before** it goes to the output device. The audio path is:

```
App (Meet) → System Mixer → [CAPTURE POINT] → Output Device (AirPods)
```

JARVIS captures at the system mixer level, so it doesn't matter if output goes to:
- Built-in speakers
- AirPods / Bluetooth headphones
- Wired headphones
- External speakers

### The Nuance: Your Voice

| Audio Source | Captured? | Method |
|--------------|-----------|--------|
| Other participants | YES | System audio loopback |
| Your voice (AirPods mic) | YES | Microphone input capture |

JARVIS needs to capture **both**:
1. **System audio** — what you hear (other people)
2. **Microphone input** — what you say

This is standard — all meeting transcription apps do this.

### AirPods-Specific Considerations

| Issue | Solution |
|-------|----------|
| AirPods mic lower sample rate | Don't use AirPods as clock source in aggregate device |
| Spatial audio causes distortion | Disable or handle in audio processing |
| Bluetooth latency | Not an issue — we capture before Bluetooth transmission |

### Tools That Handle This

- **[Loopback](https://rogueamoeba.com/loopback/)** — Combines app audio + mic, works with any output device
- **[BlackHole](https://github.com/ExistentialAudio/BlackHole)** — Free, but needs careful aggregate device setup for AirPods
- **Core Audio Taps (macOS 14.4+)** — Native API, no driver needed

**Bottom line: AirPods are fully supported.**

---

## Technical Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| macOS permissions complex | Clear onboarding flow, detect permission state |
| Enterprise policies block drivers | Use ScreenCaptureKit (no driver) on macOS |
| Single audio stream (no speaker separation) | Use pyannote diarization |
| Audio quality varies | Normalize/enhance audio before transcription |
| Meeting platform changes | System audio approach is platform-agnostic |
| Bluetooth headphones | Capture at system mixer level (before BT transmission) |

---

## Conclusion

**JARVIS can absolutely listen to live Google Meet conversations.**

The system audio loopback approach is:
- Technically proven
- Used by commercial products
- Platform-agnostic
- Privacy-preserving
- Feasible to implement

**Confidence: HIGH**
