---
name: capture-to-card-quality
description: >-
  Motion quality, accessibility, performance, and measurement for capture-to-card.
  Use when implementing animation, reviewing UX, or documenting bundle impact.
---

# capture-to-card quality

## Motion (primary)

- Hero behavior: one image visually travels from **explorer thumbnail** bounds to **card media** bounds; filename continuity into title; file properties reveal on the card at arrival.
- Skeleton reveal is **optional**, **in-project**, and secondary; never block **Create card** on animation or skeleton finish.
- Under `prefers-reduced-motion: reduce`, prefer instant layout swap or short opacity cross-fade — no travel.
- Storyboard: `docs/B-MOTION-STORYBOARD.md`.

## Skeleton (when implemented)

- Stable slots for media, title, and detail rows; honest placeholders; reveal as soon as content is ready (no minimum wait).
- Placeholders non-interactive; use appropriate busy/hidden semantics until real content is shown.
- No third-party transition-pack snippets or renamed clones of external skeleton APIs.

## Performance

- Single image source; no server upload or re-screenshot.
- Decode before reveal; avoid extra layout thrash during FLIP.
- Prefer `transform` and `opacity`; profile expensive filters (blur, heavy shadows).
- Clean up clones, listeners, and `objectURL`s.
- Record build sizes with the method in `docs/D-QUALITY-AND-PERFORMANCE.md` — no invented budgets.

## Interface copy (demo)

- Simple English in the UI; action verbs on buttons (`Create card`, `Back to file list`).
- Disabled primary action shows **Select an image to continue.** (not implementation jargon).
- No implementation status, morph notes, or promotional filler in the interface.
- Metadata labels stay exact: **Last modified** is `File.lastModified`, not creation date.
- Keep user-facing strings separate from engineering docs.

## Accessibility

- Real `<button type="button">` elements; visible `:focus-visible`.
- Explorer selection and demo status text carry state — do not rely on motion alone.
- Card media decorative (`alt=""`); filename is the visible title.
- Do not rely on color alone for state; use text (demo status line is acceptable).

## Verification

After substantive changes:

```bash
pnpm run lint
pnpm run test
pnpm run build
```

Add automated tests only for logic that is easy to get wrong (e.g. file validation), not for provisional pixel-perfect layout.

## Maintenance

- When motion or quality rules change durably, update `docs/D-QUALITY-AND-PERFORMANCE.md` and/or `docs/B-MOTION-STORYBOARD.md`.
- Distinguish **current** behavior from **planned** behavior in docs.
