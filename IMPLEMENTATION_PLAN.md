# Photo Unloader — Implementation Plan

## Overview

A native macOS app built with **Tauri 2** (Rust backend + React/TypeScript frontend) that automates importing photos from SD cards. It detects JPG and RAW files, reads EXIF metadata, deduplicates, and copies files to the correct NAS directories with a structured folder hierarchy.

---

## Architecture

```text
┌─────────────────────────────────────────────┐
│              Tauri Window                    │
│  ┌───────────────────────────────────────┐  │
│  │        React + TypeScript UI          │  │
│  │       shadcn/ui + Tailwind CSS        │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────┐  │  │
│  │  │ Import  │ │ Progress │ │ Hist. │  │  │
│  │  │  View   │ │   Bar    │ │  Log  │  │  │
│  │  └────┬────┘ └────┬─────┘ └───┬───┘  │  │
│  │       │           │           │       │  │
│  └───────┼───────────┼───────────┼───────┘  │
│          │   invoke()│    listen()│          │
│  ┌───────▼───────────▼───────────▼───────┐  │
│  │           Tauri Commands              │  │
│  │         (Rust src-tauri/)             │  │
│  │  ┌──────┐ ┌──────┐ ┌────┐ ┌───────┐  │  │
│  │  │Scan  │ │ EXIF │ │Hash│ │ Copy  │  │  │
│  │  │Files │ │Parse │ │Dup │ │+Verify│  │  │
│  │  └──────┘ └──────┘ └────┘ └───────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
   ┌──────────┐            ┌──────────────┐
   │ SD Card  │            │   NAS Shares │
   │ (source) │            │  JPG │ RAW   │
   └──────────┘            └──────────────┘
```

---

## Current Progress Snapshot

- ✅ **Completed:**
  - Base repo scaffolding for frontend + backend.
  - Tauri app bootstrap and command wiring.
  - Rust scan command + scanner module with extension classification.
  - Rust import orchestration via `start_import` with progress/completion events and notifications.
  - Basic frontend source picker flow and scan summary display.
  - Source picker error toast UX for scan failures.
  - Scan summary destination editing and import action controls.
  - Event-driven import progress view with counters and scrolling log.
  - Import complete summary card with status badges and reset actions.
  - Destination settings dialog persisted to app config JSON and hydrated on startup.
  - shadcn-style UI scaffolding (core `Button` + `Card` primitives and theme variables).
  - `cargo tauri dev` runtime verification after dependency and icon fixes.
  - Top-level README and implementation-plan documentation.
- ⏳ **Not started:**
  - Full multi-view state machine and polish phases.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Tauri 2.x | Native macOS app shell, IPC, system APIs |
| Frontend | React 18 + TypeScript | UI components, state management |
| UI Components | shadcn-style primitives | Reusable accessible primitives (`Button`, `Card`) with shadcn-compatible structure |
| Styling | CSS variables + custom CSS | Dark-mode tokenized styling (Tailwind can be layered in later) |
| Backend | Rust (stable) | File I/O, EXIF parsing, hashing, copy operations |
| EXIF | `kamadak-exif` crate | Read DateTimeOriginal from JPG and RAW files |
| Hashing | `sha2` crate | SHA-256 deduplication |
| File traversal | `walkdir` crate | Recursive directory scanning |
| Date handling | `chrono` crate | Date formatting for folder paths |
| Serialization | `serde` + `serde_json` | IPC data transfer between Rust and TS |
| Build | Vite | Frontend bundling |

---

## File Structure

```text
photo-unloader/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── scan.rs
│   │   │   └── import.rs
│   │   ├── importer/
│   │   │   ├── mod.rs
│   │   │   ├── scanner.rs
│   │   │   ├── exif.rs
│   │   │   ├── hasher.rs
│   │   │   └── copier.rs
│   │   └── config.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── types.ts
│   ├── hooks/
│   │   ├── useImport.ts
│   │   └── useScanResult.ts
│   ├── components/
│   │   ├── SourcePicker.tsx
│   │   ├── ScanSummary.tsx
│   │   ├── ProgressView.tsx
│   │   ├── ImportComplete.tsx
│   │   └── SettingsPanel.tsx
│   ├── components/ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   └── tooltip.tsx
│   └── lib/
│       ├── commands.ts
│       └── utils.ts
├── components.json
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## Phased Plan

### Phase 1 — Project Scaffolding *(✅ Completed)*
- [x] Scaffold Tauri React/TypeScript project.
- [x] Add required Rust crates.
- [x] Initialize shadcn/ui and add core components.
- [x] Configure Tauri capabilities.
- [x] Build a dark-mode app shell (basic CSS shell).
- [x] Verify `cargo tauri dev` in this environment.

### Phase 2 — File Scanner (Rust) *(✅ Completed)*
- [x] Implement recursive scanning with `walkdir`.
- [x] Classify JPG/RAW/Video/Unknown by extension.
- [x] Ignore hidden files.
- [x] Return a typed `ScanResult`.

### Phase 3 — EXIF Date Extraction (Rust) *(✅ Completed)*
- [x] Parse `DateTimeOriginal` and fallback tags.
- [x] Fallback to filesystem modified timestamp.
- [x] Build destination path `YYYY/MM/YYYY-MM-DD/filename`.

### Phase 4 — Hash Deduplication & Copy (Rust) *(✅ Completed)*
- [x] SHA-256 hash helper.
- [x] Copy with skip/rename conflict handling.
- [x] Verify post-copy hash and clean up mismatches.

### Phase 5 — Import Command + Progress Events (Rust) *(✅ Completed)*
- [x] Add `start_import` command.
- [x] Process per-file import pipeline.
- [x] Emit `import-progress` and `import-complete` events.
- [x] Send completion notification.

### Phase 6 — Source Picker View (Frontend) *(✅ Completed)*
- [x] Directory picker and scan trigger.
- [x] Loading/disabled state while scanning.
- [x] Error toast on scan failures (currently inline error text).

### Phase 7 — Scan Summary View (Frontend) *(✅ Completed)*
- [x] Render scan counts and total size in final shadcn layout.
- [x] Show/edit JPG and RAW destinations.
- [x] Cancel and Start Import actions.

### Phase 8 — Progress View (Frontend) *(✅ Completed)*
- [x] Real-time progress bar and counters.
- [x] Scrollable import log.
- [x] Event-driven updates.

### Phase 9 — Import Complete View (Frontend) *(✅ Completed)*
- [x] Final summary card with status badges.
- [x] Reset/import-another action.
- [x] Optional open-in-Finder action.

### Phase 10 — Settings Panel *(✅ Completed)*
- [x] Dialog for JPG/RAW destination settings.
- [x] Persist to app data config JSON.
- [x] Hydrate config on startup.

### Phase 11 — App State Management *(✅ Completed)*
- [x] Implement `AppView` state machine.
- [x] Wire transitions for full flow.
- [x] Ensure reset clears stale state.

### Phase 12 — Polish & Edge Cases *(✅ Completed)*
- [x] NAS missing checks + destructive toast.
- [x] Continue on per-file errors.
- [x] Empty import feedback.
- [x] Window/icon/title polish.

---

## Dependency Notes
- Phases 2, 3, and 4 are parallelizable.
- Phases 6 and 10 are parallelizable.
- Remaining phases are primarily sequential integration work.
