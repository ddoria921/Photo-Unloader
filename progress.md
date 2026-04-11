# Progress Log

## 2026-04-11

### PU-01 — Unify accent color (DONE)
- Changed `.status-pill` and `.status-dot` from `--green` / `--green-dim` to `--accent` / `--accent-dim` so the "Ready" status pill in the titlebar uses the primary accent color
- Fixed `.panel-toggle-btn--active` to use `var(--accent)` / `var(--accent-dim)` instead of the undefined `--accent-yellow` token with hardcoded fallback
- TypeScript checks pass, CSS-only change
- Branch: `feature/pu-01-accent-color`
