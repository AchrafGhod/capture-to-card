# Motion storyboard

## Implemented today

- **File list → card** via shared-element morph on **Create card** (WAAPI + FLIP; see `docs/C-ENGINEERING-DECISIONS.md`).
- **Back to file list** via a short opacity cross-fade (not a full reverse morph). The cross-fade is intentional; stage height settles to the file-list size when the fade completes (no empty pinned stage).
- Same `CaptureToCardItem` feeds both views — no duplicated field state between source and destination.
- **Create card** is disabled until the file row is selected (with a visible hint).
- Intro, import block, and stage keep a stable vertical position; import stays visible in card view.
- `prefers-reduced-motion: reduce` → instant layout swap (no travel).

## Primary beat (hero — current choreography)

Continuity from **explorer row** to **destination card**:

1. **Rest — explorer**  
   Thumbnail + filename in the fictional list. **Create card** available when selected.

2. **Commit**  
   User activates **Create card**. Action is not blocked on animation completion.

3. **Travel**  
   The same image moves and enlarges from thumbnail bounds to card media bounds (`object-fit: contain`, no crop). The card shell is already at its resting size in the DOM and fades in (opacity only) so width does not scale from the thumb cell. Filename travels in a fly layer from row bounds to title bounds (font size and weight only; no scale/stretch). Destination image and title stay hidden until arrival; metadata rows reveal after the shell appears.

4. **Rest — card**  
   Image sits in the card media slot at native aspect (contain). **Filename** is the title. **Secondary properties** (dimensions, then format · size, then last modified) reveal in document order as the shell settles.

5. **Reduced motion**  
   Under `prefers-reduced-motion: reduce`, skip travel; cross-fade or instant swap to the card layout.

### Mapping (source → destination)

| Explorer             | Card                                     |
| -------------------- | ---------------------------------------- |
| Thumbnail image      | Card media preview                       |
| Filename (row label) | Title                                    |
| (not shown in row)   | Dimensions, format · size, last modified |

Do **not** duplicate item fields in parallel React state for animation; morph helpers read from the same item.

## Secondary beat (optional skeleton — planned, in-project)

**Decision (2026-10-27):** implement our own skeleton/reveal in this repo. Do not import, copy, or structurally port third-party transition-pack snippets.

When content is not yet ready to paint (e.g. after **Create card** while decode or layout is still settling):

| Requirement             | Intent                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stable slots**        | Skeleton occupies the same regions as final card media, title, and detail rows so layout does not jump.                                                                               |
| **Honest placeholders** | Shapes match what will appear: media block, title line, rows for dimensions, format · size, last modification.                                                                        |
| **Reveal on readiness** | Cross-fade or swap to real content as soon as data and image are ready — **no minimum loading duration**.                                                                             |
| **Reduced motion**      | No pulse/shimmer travel required; prefer instant swap or minimal opacity change.                                                                                                      |
| **Accessibility**       | While skeleton is visible, real content is not exposed as interactive; use `aria-busy` / `aria-hidden` (or equivalent) so assistive tech does not treat placeholders as final values. |

Skeleton remains **optional** and secondary; never block **Create card** or gate navigation on skeleton finish.

**Not implemented** in this pass — framing only.

## Composition checklist (static validation)

- [x] Explorer feels compact on desktop and mobile; long filenames wrap.
- [x] Card media uses item aspect ratio; images use `object-fit: contain` (no silent crop).
- [x] Metadata hierarchy: title → property rows (dimensions, format · weight, last modification).
- [x] Focus visible on file row, **Create card**, back button, and file input.
- [x] Import block grouped above file list; disabled primary action shows a short hint.
- [x] Morph: thumbnail rect → card media rect (first pass; timings provisional).
- [ ] Skeleton/reveal (not implemented).

## Superseded storyboard (2026-10-27)

**Previous hero:** large source screenshot frame shrinking into a fixed 5:2 card band; title + origin URL + single meta line.

**Why replaced:** align motion with **file → card** continuity (thumbnail and filename as the visible anchors), and drop URL/origin from the card story.
