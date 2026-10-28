# Quality and performance

## How to measure

After a change that can affect size:

```bash
pnpm build
du -sh dist
ls -la dist/assets
```

Record **date**, **tool versions** (`node -v`, `pnpm -v`), and file sizes.

Do not invent performance budgets. jsdom tests do not replace a browser check.

## Latest production build (2026-10-28)

Node v24.15.0, pnpm 11.18.0, Vite 8.3.5, React 19.3.1. Docs-style shell (Introduction + Documentation + studies).

| Artifact                         | Size                      |
| -------------------------------- | ------------------------- |
| `dist/` total                    | 296K                      |
| `dist/assets/index-COrtmpKx.js`  | 258.59 kB (gzip 80.38 kB) |
| `dist/assets/index-9oZEp-Gw.css` | 21.00 kB (gzip 4.12 kB)   |
| Bundled PNG fixtures             | ~25 kB combined           |

**Delta vs prior build (same day, catalog shell):** JS +~4 kB (intro/docs copy), CSS −~2 kB (playbook + one-off stage sizes removed). No new npm dependencies.

## Current quality bar

| Area                                                      | Implemented              | Checked              |
| --------------------------------------------------------- | ------------------------ | -------------------- |
| File + build + collection stage                           | Yes                      | Browser @ 5174       |
| Catalog shell — **Library**, **Docs**, study preview      | Yes                      | Browser @ 5174       |
| **Animate** / **Insert into collection** / **Reset demo** | Yes                      | Tests + browser      |
| Collection FLIP                                           | WAAPI                    | Mock tests + browser |
| Cell-mask build reveal                                    | Media + title + 3 fields | Browser @ 5174       |
| Import race / multi-file / blob retention                 | Yes                      | Vitest               |
| Reduced motion                                            | Instant swap             | Manual               |

## Manual validation (browser)

On `http://127.0.0.1:5174/` (must serve **this** checkout):

- Poses A→E in `docs/B-MOTION-STORYBOARD.md` at normal speed and paused frames.
- Full cycle: create → insert → reset from each step.
- Drag any local PNG/JPEG/WebP/GIF/SVG for import and wrapping checks.
- Replace image mid-morph; resize, scroll, unmount; reduced motion.
- Compare build phase to local cell-mask behavior (partial image fragments + remaining dots). Styling is original to this repo (`cell-build.css`).

**Limits:** No screen recording in CI; no pixel diff tooling. Motion fidelity is manual.

## Accessibility

- Skeleton/matrix decorative; `aria-hidden` on prebuild measure card.
- No `aria-busy` on placeholders.

## Superseded

- Bar-only skeleton without matrix dots.
- ~520ms single-column micro-interaction as primary study.
