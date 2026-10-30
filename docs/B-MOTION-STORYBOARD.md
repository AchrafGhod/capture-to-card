# Motion storyboard

## Studies

- **Pixel Reveal** (`pixel-reveal`) — decoded image is masked by a grid of square cells; a slightly uneven wave reveals it left-to-right (default) or right-to-left. The image gently zooms out from 106% to 100% during the sweep, with the frame and pixel mask staying fixed. No card metadata build or collection insertion. Default duration ~1200ms, approximate cell size 24px; the mask disappears after completion. Replay interrupts and starts a fresh run. Resize completes the image; reduced motion displays it instantly without zoom. No looping.

- **Cell reveal** (`file-to-card`) — poses A→C (in-place cell build on the build frame); no grid insert.
- **Grid insert** (`collection-insert`) — pose D (FLIP insert + neighbor shift); **Insert into collection** only.

## User flow — Cell reveal

1. **Source (preview)** — file on the **left**; empty **Build** on the right; **no collection** column.
2. **Animate** — in-place cell build (~1680ms); card remains in **Build** until reset.
3. **Import** — preview only; never starts morph.
4. **Reset demo** — aborts motion; keeps current source file.

## User flow — Grid insert

1. **Build** — ready card; **Collection** — three seeded tiles beside/below.
2. **Insert into collection** — FLIP to slot 0; neighbors shift; no travel or cell build.
3. **Reset demo** — restores seed grid + build card.

Reduced motion: instant card layout and instant grid insert — same functional end states.

## Key poses (desktop)

| Pose                     | Left (File)    | Build (right)                          | Collection                  | Read                          |
| ------------------------ | -------------- | -------------------------------------- | --------------------------- | ----------------------------- |
| **A — Source**           | Thumb + name   | Dashed “Card will build here”          | Seed cards visible          | Roles separated               |
| **B — Departure**        | Row dims       | Static dot media + text dot grids      | Static grid                 | Image lifts from source       |
| **C — Traverse / build** | Faded source   | Flyout travel → masked cell reveal     | Grid present                | L→R travel, then construction |
| **D — Arrival / insert** | Source present | Completed card (hold) → FLIP to slot 0 | Neighbors make room         | Collective coordination       |
| **E — Collection**       | File + actions | Empty build frame again                | New card first; stable grid | Insert complete               |

Mobile: vertical stack (file → build → collection); travel stays in viewport.

## Forward morph timing (not uniform)

| Segment                  | ~ms  | Notes                                     |
| ------------------------ | ---- | ----------------------------------------- |
| Travel (surface + image) | 920  | Ease-out emphasis at arrival              |
| Source dim               | 220  | Early                                     |
| Cell build reveal        | 1680 | Single timeline: media → title → metadata |
| Hold before insert       | 300  | Short read after reveal completes         |
| Collection insert FLIP   | 640  | New card from build shell                 |
| Neighbor FLIP            | 520  | Existing tiles only                       |

**Handoff:** flying image removed when travel settles; card media reveals through an SVG cell mask while matching dots drop out locally (no full-image fade under dots).

## Skeleton / reveal — fidelity

**Technique:** shared diagonal cell order (`revealOrder.ts`); SVG `mask` on card image and `.ctc-build__text`; static dot grids removed per cell (`runCellBuildReveal.ts`). Original media dot field during build.

Manual comparison: `http://127.0.0.1:5174/`

## Checklist

- [x] Preview → Animate (cell) / insert (grid) → collection stable → Reset demo
- [x] Import does not auto-morph
- [x] Cell reveal on media + title + three fields
- [x] Manual pass on `http://127.0.0.1:5174/` (2026-10-28 — create/insert/reset)

## Superseded

- Collection tile ↔ in-scene detail (View details / Back to collection; `runDetailMorph.ts` removed 2026-10-28).
- Stable card on build column with **View details** there (detail opens from collection only).
- Two-beat demo without collection insert.
- Blur cross-fade skeleton reveal + pulsing matrix during build (`revealAfterTravelMs` early fade).
