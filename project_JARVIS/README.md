# JARVIS

Real-time AI assistant for live conversation transcription and communication coaching.

Built with **Tauri 2** + **React** + **TypeScript** + **Rust**.

---

## Quick Start

```bash
cd jarvis-app
pnpm install
```

### Initialize Mobile Targets (Optional)

```bash
pnpm tauri android init
pnpm tauri ios init
```

---

## Development

### Desktop

```bash
pnpm tauri dev
```

### Android

```bash
pnpm tauri android dev
```

### iOS

```bash
# On physical device (requires Apple Developer signing)
pnpm tauri ios dev

# On simulator (specify device name)
pnpm tauri ios dev "iPhone 17 Pro"

# List available simulators
xcrun simctl list devices available
```

---

## Project Structure

```text
jarvis-app/
├── src/                    # Frontend (React + TypeScript)
│   ├── main.tsx            # React entry point
│   ├── App.tsx             # Main component
│   └── App.css             # Styles
├── src-tauri/              # Backend (Rust + Tauri)
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   └── lib.rs          # Tauri commands
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri config
├── .vscode/                # VSCode workspace config
└── package.json            # Node dependencies
```

---

## Commands

| Task                    | Command                               |
| ----------------------- | ------------------------------------- |
| Dev mode (desktop)      | `pnpm tauri dev`                      |
| Dev mode (android)      | `pnpm tauri android dev`              |
| Dev mode (iOS physical) | `pnpm tauri ios dev`                  |
| Dev mode (iOS simulator)| `pnpm tauri ios dev "iPhone 17 Pro"`  |
| Build for production    | `pnpm tauri build`                    |
| Frontend only           | `pnpm dev`                            |
| Check Rust              | `cd src-tauri && cargo check`         |
| Format Rust             | `cd src-tauri && cargo fmt`           |
| Lint Rust               | `cd src-tauri && cargo clippy`        |

---

## Tech Stack

| Layer     | Technology       | Purpose                           |
| --------- | ---------------- | --------------------------------- |
| Frontend  | React + TS       | User interface                    |
| Backend   | Rust + Tauri     | Native APIs, audio, transcription |
| Build     | Vite             | Fast frontend bundling            |
| Package   | pnpm             | Dependency management             |

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [CodeLLDB](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## Documentation

See `../discussion/brainstorm/app/` for detailed guides:

- **WORKSPACE_SETUP.md** - VSCode setup, pnpm, React 101
- **STEP_1_CREATE_PROJECT.md** - Project creation walkthrough
- **IMPLEMENTATION_PLAN.md** - Full implementation roadmap
