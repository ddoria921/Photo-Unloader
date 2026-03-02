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
  - Basic frontend source picker flow and scan summary display.
  - Top-level README and implementation-plan documentation.
- 🟡 **In progress / partial:**
  - Phase 1 UI expectations are partially done (basic shell exists, but shadcn/Tailwind setup is not complete).
  - Phase 6 is partially done (source browse + scan trigger implemented, but no shadcn/toast UX yet).
- ⏳ **Not started:**
  - EXIF extraction, dedup hash/copy, import orchestration, settings persistence, full multi-view state machine, and polish phases.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Tauri 2.x | Native macOS app shell, IPC, system APIs |
| Frontend | React 18 + TypeScript | UI components, state management |
| UI Components | shadcn/ui | Prebuilt accessible components (Button, Card, Progress, Dialog, etc.) |
| Styling | Tailwind CSS 4 | Utility-first styling, shadcn dependency |
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
├── tailwind.config.js
└── vite.config.ts
```

---

## Phased Plan

### Phase 1 — Project Scaffolding *(🟡 Partial)*
- [x] Scaffold Tauri React/TypeScript project.
- [x] Add required Rust crates.
- [ ] Initialize shadcn/ui and add core components.
- [x] Configure Tauri capabilities.
- [x] Build a dark-mode app shell (basic CSS shell).
- [ ] Verify `cargo tauri dev` in this environment.

### Phase 2 — File Scanner (Rust) *(✅ Completed)*
- [x] Implement recursive scanning with `walkdir`.
- [x] Classify JPG/RAW/Video/Unknown by extension.
- [x] Ignore hidden files.
- [x] Return a typed `ScanResult`.

### Phase 3 — EXIF Date Extraction (Rust) *(⏳ Not started)*
- [ ] Parse `DateTimeOriginal` and fallback tags.
- [ ] Fallback to filesystem modified timestamp.
- [ ] Build destination path `YYYY/MM/YYYY-MM-DD/filename`.

### Phase 4 — Hash Deduplication & Copy (Rust) *(⏳ Not started)*
- [ ] SHA-256 hash helper.
- [ ] Copy with skip/rename conflict handling.
- [ ] Verify post-copy hash and clean up mismatches.

### Phase 5 — Import Command + Progress Events (Rust) *(⏳ Not started)*
- [ ] Add `start_import` command.
- [ ] Process per-file import pipeline.
- [ ] Emit `import-progress` and `import-complete` events.
- [ ] Send completion notification.

### Phase 6 — Source Picker View (Frontend) *(🟡 Partial)*
- [x] Directory picker and scan trigger.
- [x] Loading/disabled state while scanning.
- [ ] Error toast on scan failures (currently inline error text).

### Phase 7 — Scan Summary View (Frontend) *(⏳ Not started)*
- [ ] Render scan counts and total size in final shadcn layout.
- [ ] Show/edit JPG and RAW destinations.
- [ ] Cancel and Start Import actions.

### Phase 8 — Progress View (Frontend) *(⏳ Not started)*
- [ ] Real-time progress bar and counters.
- [ ] Scrollable import log.
- [ ] Event-driven updates.

### Phase 9 — Import Complete View (Frontend) *(⏳ Not started)*
- [ ] Final summary card with status badges.
- [ ] Reset/import-another action.
- [ ] Optional open-in-Finder action.

### Phase 10 — Settings Panel *(⏳ Not started)*
- [ ] Dialog for JPG/RAW destination settings.
- [ ] Persist to app data config JSON.
- [ ] Hydrate config on startup.

### Phase 11 — App State Management *(⏳ Not started)*
- [ ] Implement `AppView` state machine.
- [ ] Wire transitions for full flow.
- [ ] Ensure reset clears stale state.

### Phase 12 — Polish & Edge Cases *(⏳ Not started)*
- [ ] NAS missing checks + destructive toast.
- [ ] Continue on per-file errors.
- [ ] Empty import feedback.
- [ ] Window/icon/title polish.

---

## Dependency Notes
- Phases 2, 3, and 4 are parallelizable.
- Phases 6 and 10 are parallelizable.
- Remaining phases are primarily sequential integration work.
