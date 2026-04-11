# Photo Unloader — Design Improvement Tickets

## Quick Wins — High Impact, Low Effort

- [x] **PU-01** `High` — **Unify accent color across Import button, active states, and session stats**

  **Background:** The app currently uses a yellow-green accent for the "Import Queue" active sidebar item and session file-count stats, but the Import button uses a visually inconsistent olive/khaki fill. This reads as two disconnected color systems and undermines visual coherence.

  **Acceptance Criteria:**
  - [ ] Define a single CSS/SwiftUI token for the primary accent (e.g., `--color-accent`) matching the current yellow-green used on sidebar active state and session stats.
  - [ ] Apply this token to the Import button background when files are queued (state: `queued > 0`). When queue is empty, Import button should use a muted/disabled appearance.
  - [ ] Session stat counts (e.g., "255 copied") should use this same token — confirm they already do, or update to match.
  - [ ] The active sidebar item highlight (left border or background tint) must use the same token.
  - [ ] The "Ready" status pill in the top-right should also reference this token for its dot indicator.
  - [ ] No other UI elements should introduce a second accent color. Confirm no orange, gold, or olive values remain in the stylesheet.

  *Tags: SwiftUI / CSS tokens · Visual design · No new components*

---

- [ ] **PU-02** `High` — **Add count badges to Dupes and Errors filter tabs**

  **Background:** The filter tab bar (ALL / RAW / JPG / DUPES / NEW / ERRORS) currently shows labels only. DUPES and ERRORS are actionable categories that need immediate attention — surfacing counts helps users triage without clicking into each view.

  **Acceptance Criteria:**
  - [ ] Add a numeric badge to the `DUPES` tab reflecting the current duplicate file count from the scan result.
  - [ ] Add a numeric badge to the `ERRORS` tab reflecting the current error count.
  - [ ] ERRORS badge background: red/danger semantic color. DUPES badge: amber/warning semantic color. Badge text must pass contrast (WCAG AA).
  - [ ] Badges must be hidden (not rendered) when count is 0 — do not show "0".
  - [ ] Badge values update reactively as scan results stream in — no manual refresh required.
  - [ ] ALL and RAW/JPG tabs do not receive badges.
  - [ ] Badge is a pill shape, font size 10–11px, positioned inline to the right of the label text within the tab button.

  *Tags: Reactive state · Filter bar · Badge component*

---

- [ ] **PU-03** `Medium` — **Tighten typographic hierarchy — size delta and weight system**

  **Background:** Section labels (SOURCE, DESTINATION, VIEWS, SESSIONS) and content labels compete visually because their size and weight are too similar. The current mono typeface system is correct for the aesthetic but lacks a clear hierarchy scale.

  **Type Scale Spec:**
  - [ ] **Section headers** (SOURCE, DESTINATION, VIEWS, SESSIONS, FILE INSPECTOR, IMPORT STATUS): 10px, weight 500, 0.1em letter-spacing, `text-secondary` color.
  - [ ] **Navigation items** (Import Queue, Duplicates, Imported, Errors): 13px, weight 400, `text-primary` color.
  - [ ] **Active navigation item**: 13px, weight 500, accent color.
  - [ ] **Body / metadata labels** (JPG, RAW destination labels): 12px, weight 400, `text-secondary`.
  - [ ] **Stat numbers** (0 Queued, 0 Dupes, etc.): 20px, weight 500, `text-primary`.
  - [ ] **Stat labels** (QUEUED, DUPES, IMPORTED, ERRORS): 10px, weight 400, letter-spacing 0.08em, `text-tertiary`.
  - [ ] All weights must be limited to two values: 400 and 500. Remove any 600 or 700 usages.

  *Tags: Typography · Design tokens · Global styles*

---

## Core Experience — Meaningful Improvements

- [ ] **PU-04** `High` — **Replace empty state placeholder with actionable drag-and-drop zone**

  **Background:** The current empty state shows a hexagon icon and two lines of text. This is the first thing every user sees on launch — it should communicate the primary action clearly and invite interaction. The "Browse Folder" button in the sidebar is the only affordance, making it easy to miss.

  **Acceptance Criteria:**
  - [ ] Replace the center placeholder with a large dashed drop-zone that fills the center panel. Dashed border uses `border: 1.5px dashed` in `text-tertiary` color, `border-radius: 12px`, and occupies roughly 60% of the panel width and height, centered.
  - [ ] Drop zone contains: a folder/SD card icon (20×20px, `text-tertiary`), primary label "Drop a folder or SD card" (15px, `text-secondary`), secondary label "or Browse Folder" rendered as a tappable text link that triggers the same action as the Browse Folder button in the sidebar.
  - [ ] On drag-enter (file/folder dragged over the window): drop zone border transitions to accent color, background fills with a 5% opacity tint of accent color, label updates to "Release to scan".
  - [ ] On drag-leave or drop: revert or proceed to scan depending on outcome.
  - [ ] Drop zone only accepts directories. If a user drops individual files, show an inline error: "Please drop a folder, not individual files."
  - [ ] The hexagon icon and existing placeholder text are fully removed.
  - [ ] This component is only shown when no source is selected. Once a source is active, the center panel reverts to the file grid.

  *Tags: Drag and drop · Empty state · macOS file APIs*

---

- [ ] **PU-05** `Medium` — **Strengthen active filter tab affordance**

  **Background:** The "ALL" active state is barely distinguishable from inactive tabs. In a tool where filtering is a frequent action, the active state must be immediately apparent without careful inspection.

  **Acceptance Criteria:**
  - [ ] Active tab: solid background fill using accent color at 100% opacity, label text in a dark contrasting color (confirm WCAG AA). Pill/capsule shape with `border-radius: 6px`.
  - [ ] Inactive tabs: no background, label text in `text-secondary`, `border-radius: 6px` on hover with `background-secondary` fill.
  - [ ] Tab transition on click: 120ms ease-out background color transition.
  - [ ] Remove any border/outline styling on inactive tabs — differentiation should rely on background fill of the active tab only.
  - [ ] Keyboard navigation: tabs must be focusable and selectable via arrow keys (standard segmented control behavior).

  *Tags: Filter bar · Interaction states · Accessibility*

---

- [ ] **PU-06** `Medium` — **Enrich Sessions list items with status indicators and file breakdown**

  **Background:** The Sessions list (e.g., "103LEICA · Mar 21, 2026 · 255 copied") is plain text. This is valuable historical context that photographers use to recall past imports — it deserves richer information display without cluttering the sidebar.

  **Acceptance Criteria:**
  - [ ] **Row layout**: two lines. Line 1: session name (13px, weight 500, `text-primary`) + status dot (right-aligned, 6px circle). Line 2: date string (11px, `text-tertiary`) + compact stat summary (right-aligned, 11px).
  - [ ] **Status dot colors**: all success → accent color. Has errors → red/danger token. Has skipped/dupes → amber/warning token. Dot includes a tooltip on hover showing "X errors" or "X skipped".
  - [ ] **Compact stat summary**: show "255 copied" normally; if errors or skipped exist, show "248 copied · 7 skipped" or "248 copied · 3 errors".
  - [ ] **Left accent bar**: 2px vertical bar on the left edge of the row, colored by session status (same logic as dot). `border-radius: 0` (flush to sidebar edge). Hidden on sessions with no issues.
  - [ ] **Hover state**: row background transitions to `background-secondary`. Cursor: pointer.
  - [ ] **Click behavior**: selecting a session loads that session's file list into the center panel — confirm existing behavior is preserved.
  - [ ] Existing data model must supply: copied count, skipped count, error count per session. If not already tracked, this ticket is blocked pending a data model update — flag if so.

  *Tags: Sessions · Data model · Sidebar*

---

## Layout — Structural Improvements

- [ ] **PU-07** `Low` — **Make sidebar and file inspector panels collapsible**

  **Background:** The three-panel layout is correctly structured but uses fixed proportions. When no file is selected, the right FILE INSPECTOR panel is wasted space. Power users importing large card sets would benefit from maximizing the center file grid. The layout toggle buttons already exist in the top-right — this ticket implements their functionality.

  **Acceptance Criteria:**
  - [ ] The three toolbar buttons (top-right) map to three layout modes: (1) all panels visible, (2) sidebar collapsed, (3) inspector collapsed. Implement these as mutually exclusive toggle states.
  - [ ] Sidebar collapse: animates to 0 width in 180ms ease-in-out. Content area expands to fill. Sidebar can be re-expanded by clicking the same toolbar button or a thin reveal handle on the left edge.
  - [ ] Inspector collapse: same animation pattern on the right panel.
  - [ ] Layout preference is persisted to `UserDefaults` and restored on next launch.
  - [ ] Minimum center panel width: 400px. Panels should not collapse below this — if window is too narrow, disable the relevant collapse button with a tooltip explaining why.
  - [ ] Active layout mode button should reflect selected state (same active treatment as filter tabs).

  *Tags: Layout · Animation · UserDefaults · Panel management*
