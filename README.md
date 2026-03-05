# Photo Unloader

Photo Unloader is a desktop app (Tauri 2 + React + TypeScript + Rust) for importing photos from an SD card into destination folders with type-aware handling (JPG/RAW/Video/Unknown).

> Current status: early scaffold with an implemented Rust scan command and a basic frontend flow to pick a folder and display scan results.

## Tech Stack

- **Desktop framework:** Tauri 2
- **Backend:** Rust
- **Frontend:** React 18 + TypeScript + Vite
- **Core Rust crates:** `walkdir`, `serde`, `chrono`, `sha2`, `kamadak-exif` (planned usage across phases)

## Project Structure

```text
.
├── src/                    # React frontend
├── src-tauri/              # Rust + Tauri backend
├── IMPLEMENTATION_PLAN.md  # Multi-phase build plan
├── package.json
└── README.md
```

## Prerequisites

Install these once on your machine before running the native app:

1. **Node.js** 18+
2. **Rust stable toolchain** (`rustup`)
3. **Tauri system dependencies** for your OS
   - Setup guide: https://tauri.app/start/prerequisites/
4. **Tauri CLI**
   - Install with: `cargo install tauri-cli --version "^2.0.0"`
5. **macOS only:** Xcode Command Line Tools
   - Install with: `xcode-select --install`

## First-Time Setup (Native App)

From the repository root, run:

```bash
npm install
cargo tauri dev
```

What this does:

- `npm install` installs frontend dependencies.
- `cargo tauri dev` starts the Rust backend, starts/uses the Vite dev server, and opens the native app window.

## Local Development

### 1) Install frontend dependencies

```bash
npm install
```

### 2) Run the web frontend only (Vite)

```bash
npm run dev
```

By default this serves on `http://localhost:1420`.

### 3) Run the Tauri desktop app in development

From the repository root:

```bash
cargo tauri dev
```

This starts the Rust backend and launches the native app window, using the Vite dev server configured in `src-tauri/tauri.conf.json`.

If you get `cargo: no such command: tauri`, install/update the CLI:

```bash
cargo install tauri-cli --version "^2.0.0"
```

## Testing & Quality Checks

This repository is still in scaffold phase; test coverage is minimal right now.

### Rust checks

```bash
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

### Frontend checks

```bash
npm run build
```

This runs TypeScript compile + Vite production build per `package.json` scripts.

## Build / "Deploy"

For desktop Tauri apps, deployment is typically done by producing distributable bundles/installers.

### Create production bundle

```bash
cargo tauri build
```

Artifacts are generated under `src-tauri/target/release/bundle/` (format depends on OS target).

### Notes for release deployment

- Configure app identifier/version in `src-tauri/tauri.conf.json`.
- Add proper signing/notarization for macOS distribution.
- Ensure runtime permissions/capabilities are correct in `src-tauri/capabilities/default.json`.

## Current Implemented Features

- Tauri app bootstrap (`src-tauri/src/lib.rs`, `main.rs`)
- `scan_card` command exposed via IPC
- Recursive scanner that:
  - walks a directory
  - ignores hidden files/directories
  - classifies JPG/RAW/Video/Unknown by extension
  - returns counts and total size
- Frontend source picker using Tauri dialog plugin
- Basic on-screen scan summary

## Troubleshooting

### crates.io / npm fetch errors

If dependency downloads fail in restricted environments, verify proxy/network settings and retry.

### Tauri command not found from frontend

- Confirm command is registered in `invoke_handler`.
- Confirm frontend invoke name matches Rust command name (e.g. `scan_card`).

### App window does not launch

- Verify Tauri prerequisites are installed for your OS.
- Check `src-tauri/tauri.conf.json` for valid dev URL and frontend dist paths.

### `manifest path ./src-tauri/Cargo.toml does not exist`

- Run from repo root (`Photo-Unloader`) using `cargo tauri dev`.
- Do not pass `--manifest-path` to `cargo tauri dev` with this CLI version.

## Roadmap

See [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md) for the full phased implementation plan (scanner, EXIF, dedup copy, progress events, UI views, settings, and polish).
