# Project brief

## Intent

**CompoMotion** (folder still `capture-to-card` until a GitHub rename) is a **personal library of motion studies**: named transitions with live, resettable demos — same ambition as [Transitions.dev](https://transitions.dev) for polish and copy-paste maturity, but original choreography and MIT-friendly source.

Each study is **one product story** with its own slug, storyboard, and copy targets (CSS + React). Reusable animation code lives under `src/components/capture-to-card/`.

Not a capture tool, not a full app shell, not a public transition marketplace, and not a vendored transition pack.

## Studies (product names)

**Pixel Reveal** (`pixel-reveal`) is the first phase 3 addition: a standalone image reveals through a horizontal or vertical sweep of squares. Its demo supports Replay, size, duration and direction; the reusable component accepts its own image source. Existing card studies remain independent. Copy/export UI remains phase 2 work.

| Study           | Slug                | Story                                                                           | Code focus                    |
| --------------- | ------------------- | ------------------------------------------------------------------------------- | ----------------------------- |
| **Cell reveal** | `file-to-card`      | Drop or **Change image** → **Animate** → in-place cell-mask reveal in **Build** | `runCellBuildReveal.ts`       |
| **Grid insert** | `collection-insert` | Ready card in **Build** → **Insert into collection** → FLIP slot 0              | `runCollectionInsertMorph.ts` |

**Cell reveal** and **Grid insert** are separate catalog entries — one CTA each, no chained “do everything” button.

## User journey — Cell reveal

1. **Source** — bundled example or import: **File** column, empty **Build** frame (no collection).
2. Drag one image onto the row or **Change image**; import never starts the morph.
3. **Animate** — in-place cell build (~1680ms); no preview travel in this study; card stays in Build; session locks until reset.
4. **Reset demo** — same source file; no re-import.

## User journey — Grid insert

1. **Build** shows a ready card; **Collection** shows seeded tiles (same card DA).
2. **Insert into collection** — FLIP insert at front; neighbors shift. No forward travel or cell build in this study.
3. **Reset demo** restores seed grid and the build card.

## Demo constraints

- Browser-only; no backend or upload.
- Desktop: file column + build (+ collection when the study needs it); narrow viewports stack vertically.
- Catalog shell: **Library** (tile grid) and **Docs** (Introduction + Documentation). Static page state (no router). A study opens from a library tile. **Back** returns to Library.
- Study chrome lists **Preview**, **CSS**, and **React**. Only Preview is available.
- Phase 1 catalog: **All**, **Animations**, **Transition**, **Card**, and **Button** filters; a study can belong to multiple categories. Empty categories offer a return to All. The selected category survives navigation within the demo.

## Copy / prompt bar (roadmap)

Per study, target three export surfaces (not built yet):

1. **Prompt** — short product description for LLM or design handoff.
2. **CSS** — tokens + motion-related classes only (`tokens.css`, `cell-build.css`, card composition).
3. **React** — minimal integration: item type, hook entry, DOM refs contract.

Quality bar: senior-level separation (one owner per file), no hidden globals, interrupt-safe WAAPI, reduced-motion parity.

## Current status

| Area                                          | Status                                    |
| --------------------------------------------- | ----------------------------------------- |
| Catalog — **Cell reveal** + **Grid insert**   | **Done**                                  |
| Catalog shell — **Library** + **Docs**        | **Done**                                  |
| Grid insert — button-only FLIP                | **Done**                                  |
| Copy prompt / CSS / React tabs                | Chrome only (disabled)                    |
| GitHub rename `capture-to-card` → CompoMotion | Proposal — folder still `capture-to-card` |

## Out of scope

- Search, accounts, or a public marketplace.
- Dynamic study registry or plugin architecture for two demos.
- Redistributing third-party transition packs.

## Card composition

Rules in `CaptureToCard.css`: bordered card, contained media, title → metadata hierarchy, per-image `--ctc-item-aspect`. Collection grid reuses the same card markup as Build.
