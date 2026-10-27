# Quality and performance

## How to measure

After a change that can affect size:

```bash
pnpm build
du -sh dist
ls -la dist/assets
```

Record **date**, **tool versions** (`node -v`, `pnpm -v`), and file sizes. Split:

1. **Demo shell** — `Demo`, `App`, global CSS, `localImageImport`.
2. **Component** — `CaptureToCard` (and future motion helpers).
3. **Assets** — `src/assets/demo-capture.svg`.

Do not invent performance budgets. jsdom tests do not replace a browser check.

## Latest production build (2026-10-27)

Node v24.15.0, pnpm 11.18.0, Vite 8.3.5, React 19.3.1. Recorded after the shared-tokens pass.

| Artifact | Size |
|----------|------|
| `dist/` total | 248 KiB |
| `dist/assets/index-CC6KtcOT.js` | 230.66 KiB (gzip 72.46 KiB) |
| `dist/assets/index-CdbkLxkT.css` | 11.34 KiB (gzip 2.47 KiB) |
| `src/assets/demo-capture.svg` | 2.57 KiB |

CSS grew ~3 KiB uncompressed because custom properties now live in `:root`. Gzip +0.34 KiB. JS unchanged.

The JS bundle is mostly React + the demo shell, not the card CSS or SVG. There is no webfont download.

Earlier same-day measurements (~256 KiB then ~260 KiB) tracked explorer and import UI being added. Those hashes are obsolete.

## Current quality bar

| Area | Implemented | How it is checked |
|------|-------------|-------------------|
| Copy: **Create card**, hint, **Back to file list** | Yes | Tests + browser |
| Focus moves to back button / file row on toggle | Yes | Component tests + browser |
| Import race (stale decode) | Sequence counter in `Demo` | `Demo.importRace.test.tsx` |
| `item` required on `CaptureToCard` | Yes | Typecheck + tests |
| Vitest (`pnpm run test`) | Import validation, UI contracts, race | jsdom only |

**Not automated:** the real file picker. Cursor’s browser cannot set files on `<input type="file">` via `DOM.setFileInputFiles`. Manual fixtures: `src/test/manual-fixtures/`.

## Motion implementation principles (target)

- Reuse one image source; avoid re-capture or recompression.
- Decode images before showing (`decode()` / `decoding="async"`); local import decodes before updating item.
- Minimize layout reads during animation; batch `getBoundingClientRect` where FLIP is used.
- Prefer `transform` and `opacity`; profile blur, shadow, and masks.
- Remove temporary clones and revoke `objectURL`s after file import lands.
- Honor `prefers-reduced-motion`.
- Never gate **Create card** on animation end (only on file selection in the explorer).

## Skeleton / reveal (target — not implemented)

When added, skeleton state must:

- Preserve final card layout (media, title, detail rows).
- Match placeholders to real fields (dimensions, format · size, last modification).
- Transition to content as soon as it is ready.
- Under `prefers-reduced-motion: reduce`, avoid decorative pulse.
- Keep placeholder content non-interactive.

Detail: `docs/B-MOTION-STORYBOARD.md`.

## Accessibility

- Semantic `<button type="button">` for actions; explorer row is a selectable button with `aria-pressed`.
- Visible `:focus-visible` styles.
- File input exposed via `<label>`; focusable when tabbing.
- Status hints in demo (`role="status"`) and import errors (`role="alert"`).
- Card media decorative (`alt=""`); filename is the visible title.

## Verification commands

```bash
pnpm run lint
pnpm run test
pnpm run build
```

Manual browser checks:

- Bundled `demo-capture.svg`.
- Local image import; replace the file and confirm the previous `blob:` URL is revoked.
- Long filenames; portrait and landscape images.
- Narrow viewport.
- Keyboard: file row, **Create card**, back, file input; import error retry.
