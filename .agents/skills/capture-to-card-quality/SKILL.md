---
name: capture-to-card-quality
description: >-
  Motion quality, accessibility, performance, and measurement for capture-to-card.
  Use when implementing animation, reviewing UX, or documenting bundle impact.
---

# capture-to-card quality

## Motion (primary)

- Hero behavior: **Cell reveal** demo — **Animate** runs in-place cell-mask build (`runCellBuildReveal.ts`). Default component mode (tests) still exercises preview-row forward travel + build via **Create card** (`runMorphAnimations.ts`).
- Import updates preview only; never block import on animation or skeleton finish.
- Under `prefers-reduced-motion: reduce`, prefer instant layout swap or short opacity cross-fade — no travel.
- Storyboard: `docs/B-MOTION-STORYBOARD.md`.

## Skeleton (current)

- **Build reveal:** SVG cell masks + static matrix dots (`runCellBuildReveal.ts`, `revealOrder.ts`); one WAAPI driver timeline shared across media and text.
- **Placeholders:** original dot styling in `cell-build.css` + `mountMatrixDots.ts` (grids aligned to mask cells).

## Performance

- Single image source; no server upload or re-screenshot.
- Decode before reveal; avoid extra layout thrash during FLIP.
- Prefer `transform` and `opacity`; profile expensive filters (blur, heavy shadows).
- Clean up clones, listeners, and `objectURL`s.
- Record build sizes with the method in `docs/D-QUALITY-AND-PERFORMANCE.md` — no invented budgets.

## Interface copy (demo)

- Simple English in the UI; **Change image**, **Animate** (cell study) or **Create card** (default component), **Insert into collection**, **Reset demo** (not implementation jargon).
- No implementation status, morph notes, or promotional filler in the interface.
- Metadata labels stay exact: **Last modified** is `File.lastModified`, not creation date.
- Keep user-facing strings separate from engineering docs.

## Accessibility

- Real `<button type="button">` elements; visible `:focus-visible`.
- Drop-zone status and error text carry state — do not rely on motion alone.
- Card media decorative (`alt=""`); filename is the visible title.
- Do not rely on color alone for state; use text (demo status line is acceptable).

## Verification

After substantive changes:

```bash
pnpm run format:check
pnpm run lint
pnpm run test
pnpm run build
```

Add automated tests only for logic that is easy to get wrong (e.g. file validation), not for provisional pixel-perfect layout.

## Maintenance

- When motion or quality rules change durably, update `docs/D-QUALITY-AND-PERFORMANCE.md` and/or `docs/B-MOTION-STORYBOARD.md`.
- Distinguish **current** behavior from **planned** behavior in docs.
