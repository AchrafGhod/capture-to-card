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

Animated Checklist, standalone HTML/CSS and its demo/source tabs. Node v24.18.0, pnpm 11.18.0, Vite 8.3.5. Measured with `pnpm run build` and recursive PowerShell file-length sum.

| Artifact                   | Size                       |
| -------------------------- | -------------------------- |
| `dist/` total              | 1,044,090 bytes (39 files) |
| `index-B5zutO4e.js`        | 299.31 kB (gzip 92.18 kB)  |
| `index-BfVh-s_H.css`       | 41.85 kB (gzip 8.03 kB)    |
| Source loader chunk        | 13.82 kB (gzip 4.73 kB)    |
| Generated lake sample WebP | 202.77 kB                  |

Compared with Skeleton Reveal: initial JS +2.72 kB (+0.46 kB gzip), CSS +3.75 kB (+0.69 kB gzip), total +12,172 bytes. The JavaScript delta is demo mounting/catalog/raw HTML, not a runtime dependency of the checklist. No new dependency, image or font asset.

## Animated Checklist verification (2026-10-29)

- Format, format check, lint, tests and build pass. 63 tests in 18 files with the same five pre-existing warnings. Existing catalog/source checks include the additional Animations entry and standalone HTML/CSS files. No new layout tests for a CSS-only change.
- In-app Chromium at `http://127.0.0.1:5174/`, 1280 × 720 and 390 × 844: label click, Space activation with focus, two independent checked rows, Reset list returning all five values to false, CSS source display and preview retention. Checked styles measured blue boxes and strike background-size 100%; unchecked rows measured 0%. Mobile document width equals viewport width, with no console warning/error or framework overlay.
- Screenshot evidence outside repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/checklist-desktop.png` and `checklist-mobile.png`.
- Reduced-motion and forced-colors rules are provided but not manually toggled; no other browser engine or screen reader tested. No persistence/API behavior is promised. Existing animation sources untouched, no performance benchmark.

## Skeleton Reveal verification (2026-10-29)

- Format, format check, lint, tests and build pass. 63 tests in 18 files; same five existing lint warnings. Two new tests cover load/decode readiness, accessibility state, error handling and stale completion after reset/destroy. Relevant source-dependency/lifecycle tests repeated after final cleanup changes; no extra visual layout tests.
- In-app Chromium at `http://127.0.0.1:5174/`, 1280 × 720 and 390 × 844: loading placeholders → Reveal content → image/text, Show skeleton, JavaScript source tab → Copy code → Copied, and preview state retention. Mobile viewport/document widths both equal 390. No console errors/warnings, blank screen or framework overlay.
- All visual animation is CSS (shimmer, opacity, small entrance, per-slot stagger). JavaScript waits for real image loading/decoding, manages inert/aria-hidden/busy/status, cancellation and errors. The demo holds loading explicitly so visitors can inspect it; auto integration has no artificial network delay. The component imports no React or demo tokens.
- Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/skeleton-loading.png`, `skeleton-revealed.png`, `skeleton-mobile.png`.
- Limits: reduced-motion CSS provided, not manually toggled; no other engine, screen reader or external app integration tested. Failure paths are unit-tested. Existing animation source files remain unchanged. No performance benchmark claimed.

## Custom SVG preview verification (2026-10-29)

- Format, format check, lint, tests and build pass; 61 tests in 17 files, same five pre-existing lint warnings. Three new importer tests cover geometry/inherited paint, stroke-only artwork, internal-reference rewriting, removal of scripts/event handlers/external paint, stagger bounds, invalid XML/doctype, unsupported text and size limits. One new integration case checks custom preview → matching HTML → reset during a pending read, discarding its late completion.
- In-app Chromium at `http://127.0.0.1:5174/`: imported the owner's original `ref/CompoMotion.svg` through Change SVG and the real file chooser. Its outlined wordmark replaced the sample symbol, completed Replay and appeared in the HTML tab with its original viewBox 0 0 88 13. Use sample restored the original viewBox 0 0 28 28 in both preview and HTML.
- Desktop 977 × 780 and mobile 390 × 844 inspected; custom artwork stays inside the canvas, import controls wrap, and mobile viewport/document widths both equal 390. No blank page, framework overlay or console warning/error. Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/logo-custom-preview.png` and `logo-custom-mobile.png`.
- Limits: common vector SVG subset only, not a general rendering/sanitization service. Unsupported text/images/use/foreignObject require conversion to paths; advanced CSS/gradient inheritance may need a plain SVG export. Security cases are unit-tested and no untrusted XML is inserted directly; this is not a formal security audit. Stroke-only/basic-shape cases are automated; browser import used the supplied filled-path wordmark. Other engines, screen readers and OS motion preference were not manually tested. No benchmark or changes to existing card/Pixel Reveal animation sources.

## Technology source tabs verification (2026-10-29)

- Format, format check, lint, tests and production build pass. 57 tests in 16 files, with the same five existing card-study lint warnings. Two small new tests check dependency completeness across all studies and tab navigation/copying/retaining the mounted preview; existing clipboard lifecycle cases now run against the plain JavaScript implementation through its React adapter.
- Every React example's relative source/CSS/image imports resolve to a provided file. Source sets exclude tests, font binaries and project scaffolding. Copy Button exposes HTML, CSS and JavaScript with no React import. Its standalone script handles real clipboard results, pending-write deduplication, cleanup and retry; animation is CSS.
- In-app Chromium at `http://127.0.0.1:5174/`, 1280 × 720 and 390 × 844: Preview → HTML → CSS using mouse and arrow keys, direct source display, Copy code → Copied, and JavaScript source for Copy Button checked. No source introduction, file counts, accordion or download controls. Mobile document width equals the viewport width; source scroll stays within the code block. No blank page, framework overlay or console warning/error.
- Cell reveal → Animate → Reset available, Grid insert → Insert → Reset available, and Copy Button → Copied manually rechecked. Grid's completed state survived source/preview switching. Existing card and Pixel Reveal animation files are unchanged. Demo filters and study arrows remain functional.
- Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/library-technology-tabs.png` and `library-technology-mobile.png`. Earlier code-panel captures are superseded by these technology-tab captures.
- Limits: clipboard calls/content are verified in tests and browser confirmation; cross-application paste remains manually unverified because the browser automation clipboard is separate. No other browser engine, screen reader, or fresh external React project build was exercised. HTML/CSS/JS source reuse does not convert the three existing React studies to vanilla code.

## SVG Logo Reveal verification (2026-10-29)

- `pnpm run format`, `format:check`, `lint`, `test` and `build` pass. 55 tests in 14 files; the existing category test now includes the new Animations entry. No new test cases for this small HTML/CSS component. Same five pre-existing lint warnings; no new warning. A final CSS adjustment fades the stroke in before drawing to avoid initial round-cap dots; production build repeated after that adjustment.
- A direct XML comparison confirms all four `d` attributes and fill colors match `src/assets/brand/logo.svg` exactly. The original logo file remains untouched. The reusable component is only inline SVG markup and scoped CSS, with no React or JavaScript dependency.
- In-app Chromium at `http://127.0.0.1:5174/`, desktop 977 × 780 and mobile 390 × 844: Library → Animations → SVG Logo Reveal, duration/stagger selectors, Replay and keyboard Enter checked. Four distinct offsets observed during a run (approximately 0.10, 0.77, 0.32 and 0.99); final styles are offset 0, fill opacity 1, stroke opacity 0 on all paths. Mobile document width equals viewport width. No blank page, framework overlay or console warnings/errors.
- Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/logo-reveal-drawing.png` and `logo-reveal-mobile.png`. The desktop capture shows a partial outline before fill; the mobile capture includes wrapped controls and keyboard focus.
- Reduced motion uses a CSS media rule that removes the animation and exposes the original fills; not manually toggled for this study. Other engines, screen readers and large/complex third-party logos were not tested. Existing animation sources are unchanged. No frame-rate/GPU benchmark is claimed.

## Copy Button verification (2026-10-29)

- `pnpm run format`, `format:check`, `lint`, `test`, and `build` pass. 55 tests in 14 files; three new tests cover pending-write deduplication, success/reset, rejection/retry, stale text completion and timer cleanup. Catalog integration now checks Button membership, opening the demo and retaining the selected filter. The five existing lint warnings remain; no new warning.
- In-app Chromium at `http://127.0.0.1:5174/`: Library → Button → Copy Button → Copy/Copied → automatic return to Copy; also activated with Enter while retaining focus. Back preserves Button selection. Edited/empty text checked; empty text disables the action. Desktop screenshot at 977 × 780 and mobile at 390 × 844, with matching viewport/document widths (no horizontal overflow). No console warnings/errors, blank page or framework overlay.
- Screenshot evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/copy-button-success.png` and `copy-button-mobile.png`.
- Limits: the browser reported a successful native clipboard write, but its automation clipboard was empty when attempting a paste; cross-application paste remains manually unverified. Failure/retry is covered with mocked clipboard rejection. Reduced motion is implemented, not manually toggled for this component; other browser engines, native Windows web views and screen readers were not exercised. No dependency or changes to the existing animation sources.

## Pixel Reveal verification (2026-10-29)

- Format and format check pass. Lint passes with the same five pre-existing card-study warnings. 52 tests pass in 13 files; production build passes. The updates add two vertical-order cases and one compact test for front spread and seed variation; the existing lifecycle test also checks the color layer and cleanup.
- New tests cover grid coverage/bounds/sweep direction and jitter, cancellation during replay/unmount, stale decode completion, reduced motion, and image load errors. Catalog filtering now expects Pixel Reveal alongside Cell reveal in Animations.
- In-app Chromium at `http://127.0.0.1:5174/`: catalog → Pixel Reveal, Replay, repeated Replay while running, both directions, pixel-size and duration selectors, keyboard Enter, and returning to the selected category. CSS/React tabs remain disabled.
- The running mask was observed with 432 cells: 36 visible and 396 hidden at one early frame; after completion, the image mask is empty and no mask rects remain. The square edge is stepped, with no final grid or pixelation.
- Desktop (1280 × 720), mobile (390 × 844 and 320 × 740): controls wrap, Replay remains accessible, no horizontal overflow. Resize finishes an active reveal.
- Cell reveal → Animate → Reset and Grid insert → Insert → Reset manually rechecked after catalog integration. Their source files were not modified.
- Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/28/01a184eb-d265-7fe3-a20e-58721f286af0/pixel-reveal-sweep.png`, `pixel-reveal-desktop.png`, and `pixel-reveal-mobile.png`.
- Limits: reduced motion and image failure are checked with test mocks; other browser engines, real touch devices, screen readers and OS motion preference were not manually exercised. No frame-rate or GPU benchmark is claimed.

## Phase 1 baseline build (2026-10-29)

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

## Random-front refinement (2026-10-29)

A fresh seed changes the sweep silhouette on each Replay. Broad lane noise and smaller cell scatter replace the nearly straight front, without changing the four directions. The leading color wave is reduced from 22% to 11% of total duration, plus a step capped at 55ms. Browser spot-check: top-to-bottom, black layer, 1.8s; captured midway in `pixel-reveal-random-front.png` beside the earlier evidence. No new dependencies or animation handles.

## Progressive pixel opacity (2026-10-29)

The leading wave now fades in per cell from opacity 0 through a seeded 35–65% midpoint to full opacity. Ramp timing varies per pixel; the existing narrow-wave duration and image handoff remain unchanged. The existing lifecycle test checks transparent start/opaque end; 52 tests pass, with no new test cases. Browser spot-check at 1.8s observed 46 partly transparent cells alongside 46 fully opaque cells in one frame. Evidence: `pixel-reveal-soft-opacity.png` in the visualization directory above. No new handles or dependencies; JS +0.13 kB over the preceding build, CSS unchanged.

## Inner-image zoom-out (2026-10-29)

- The decoded image eases from scale 1.06 to 1 during the reveal. Its clipped viewport owns the SVG mask and resize measurement; the grid and frame remain stationary. One extra WAAPI handle per run shares cleanup with the pixel wave. Reduced motion skips the zoom.
- `pnpm run format`, `format:check`, `lint`, `test`, and `build` pass; 52 tests in 13 files, with the same five existing card-study lint warnings. Existing lifecycle checks now include zoom cancellation, replay and viewport-mask cleanup. No new test cases or dependencies.
- Browser plugin not available; checked with bundled Playwright and installed Chrome at `http://127.0.0.1:5174/`, 1280 × 900 and 390 × 844. The 640px viewport stayed fixed while the image measured 678.40px at the start, 643.84px halfway and 640px at the end. The final transform and mask were removed.
- Rapid Replay, direction change, resize during reveal, mobile Replay without horizontal overflow, and emulated reduced motion (enabled during a run and before Replay) pass. No page errors, console warnings/errors, or framework overlay. Mid-reveal and mobile screenshots were visually inspected.
- Evidence outside the repository: `C:/Users/KRAKEN/.codex/visualizations/2026/10/29/01a186ec-e62e-7ef0-a81c-65e2f31fdd27/pixel-zoom-mid-reveal.png`, `pixel-zoom-desktop.png`, and `pixel-zoom-mobile.png`.
- Limits: Chrome only; no real touch device, OS motion-setting change, or frame-rate/GPU benchmark.
