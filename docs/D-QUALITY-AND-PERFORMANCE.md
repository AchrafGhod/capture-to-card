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

## Latest production build (2026-10-29)

Node v24.18.0, pnpm 11.18.0, Vite 8.3.5, React 19.3.1. Phase 1 Library redesign with supplied brand SVGs, category filtering, and Inter/Satoshi typography. Measured with `pnpm run build` and recursive file-length sums in PowerShell.

| Artifact                         | Size                      |
| -------------------------------- | ------------------------- |
| `dist/` total                    | 652.79 kB (decimal)       |
| `dist/assets/index-0LK9vHLz.js`  | 264.48 kB (gzip 82.56 kB) |
| `dist/assets/index-CNb9kVrj.css` | 23.35 kB (gzip 4.62 kB)   |
| Inter Variable WOFF2             | 352.24 kB                 |
| Bundled landscape PNG            | 11.52 kB                  |

**Delta vs baseline built from the same checkout before this change:** JS +5.84 kB (+2.18 kB gzip), CSS +2.35 kB (+0.50 kB gzip). Inter is the main added transfer; the original variable file is kept intact. Satoshi is served by the official Fontshare CDN and is not part of `dist/`; the browser asset inventory confirmed its 700-weight WOFF2 and local Inter loaded. No npm dependencies added. Brand SVGs are inlined by Vite; source files remain identical to the supplied originals.

## Phase 1 verification (2026-10-29)

- `pnpm run format`, `format:check`, `lint`, `test`, and `build` executed. 42 tests in 11 files, including three new catalog integration tests (category membership, empty-state recovery/focus, filter retention through navigation).
- Lint passes with five pre-existing warnings: two ref writes in Demo, missing ref dependencies in CaptureToCard, and two hook dependencies in useFileToCardMorph. Those lines are outside this redesign; no new warnings.
- Browser: Codex in-app Chromium at `http://127.0.0.1:5174/`, viewport widths 320, 390, 768, 1377, and 1920. Library has no horizontal overflow. Mobile filters wrap with 44px targets; tiles stack below 576px. Tablet uses two columns.
- Exercised all categories, Button empty state and recovery, Tab/Space selection with visible focus, Library/Docs/brand/Back navigation, study arrows, Cell reveal → reset, and Grid insert → reset. Both animation cycles also completed on narrow viewports. CSS/React tabs stay disabled.
- Visual comparison uses the supplied 1377 × 871 capture (not the stated 1920 × 991 Figma frame) and browser captures at the same size/state. See `../design-qa.md` for comparison evidence and accepted minor differences.
- Reduced-motion behavior remains covered by existing mock-based tests; OS reduced-motion and other browser engines were not manually retested. No new animation code or dependency.

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
