# Engineering decisions

Record **current** decisions here. Mark proposals clearly; strike or move replaced decisions to a short “Superseded” subsection with date.

## Stack (current)

| Choice     | Version (initial scaffold)          | Rationale                                                                |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------ |
| React      | 19.x                                | Stable ecosystem for a demo + future component API.                      |
| TypeScript | 6.x, `strict: true`                 | Catch layout/prop mistakes early.                                        |
| Vite       | 8.x                                 | Fast dev/build for a single-page demo.                                   |
| pnpm       | 11.x                                | Fast installs; lockfile committed.                                       |
| CSS        | Shared tokens + component files     | Small token sheet; no design-system package.                             |
| Lint       | oxlint (Vite template default)      | Lightweight check without extra config surface.                          |
| Format     | Prettier 3.9.x (`.prettierrc.json`) | Reproducible style; `pnpm run format:check` in CI. Separate from oxlint. |
| Tests      | Vitest + Testing Library + jsdom    | Unit/component tests for import, UI contracts, and import races.         |

Verified against official release channels at project init (Oct 2026).

## Scene model (current — 2026-10-27)

| Concern                          | Owner                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared item type                 | `captureToCardItem.ts`     | `CaptureToCardItem` only; no demo defaults.                                                                                                                                                                                                                                                                                                                                                                                     |
| Explorer + card UI, presentation | `CaptureToCard.tsx` + CSS  | Requires `item` and `onPresentationChange(next)`; parent owns `presentation` and must apply `next` promptly for destination measure. Optional `explorerAccessory` for demo import.                                                                                                                                                                                                                                              |
| Bundled demo file data           | `demo/demoDefaultItem.ts`  | Default `CaptureToCardItem` + `demoCaptureSrc` for the fictional folder row.                                                                                                                                                                                                                                                                                                                                                    |
| Local file import (single image) | `demo/localImageImport.ts` | Used by `Demo` only. `ImageDecodePort` is a small test seam so decode can fail or delay without mocking `Image`. Creates and revokes `blob:` URLs. The picker `accept` list is not validation. A declared non-image MIME type is rejected even if the name ends in `.png`. Extension is used only when the type is empty or `application/octet-stream`. No byte or pixel cap: a guessed limit would be arbitrary for this demo. |
| Import ordering                  | `demo/Demo.tsx`            | A monotonic `importSequenceRef` so a slower import cannot overwrite a newer choice. Incremented again on unmount so late results are discarded.                                                                                                                                                                                                                                                                                 |
| Demo import UI                   | `demo/DemoImport.tsx`      | File input, status, error + retry; no orchestration logic.                                                                                                                                                                                                                                                                                                                                                                      |
| Demo orchestration               | `demo/Demo.tsx`            | Selection + presentation state, object URL lifecycle, wires import into `CaptureToCard`.                                                                                                                                                                                                                                                                                                                                        |

**Data shape:** one `CaptureToCardItem` per file (preview URL, title = filename, dimensions, format · size, last modified label). No `origin` / URL field.

**Media framing:** CSS `--ctc-item-aspect` from item width/height; `object-fit: contain` in thumbnail and card — no fixed aspect band obligation.

## Card visual language (current)

Shared tokens in `src/styles/tokens.css`, imported once from `src/index.css`. `CaptureToCard.css` expects those custom properties on `:root`. This is not a published package; copy or import `tokens.css` if the component is reused outside this demo.

Layout and states stay in `CaptureToCard.css` / `Demo.css`.

- Bordered surfaces, modest radius, light shadow on the destination card.
- Title and definition-list metadata below media; restrained type scale.
- Explorer row: thumbnail cell + filename; selection via button semantics.
- Image ratio is `--ctc-item-aspect` on the component instance, not a token.

## Animation engine (current — 2026-10-27)

**Decision:** **Web Animations API + FLIP** in `src/components/capture-to-card/morph/` — no animation library added.

| Piece                   | Role                                                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `containedImageRect.ts` | Painted rect for `object-fit: contain` (thumbnail vs card media).                                                                                             |
| `runMorphAnimations.ts` | WAAPI keyframes, flyout DOM, forward/back helpers, `Animation.finished` cleanup.                                                                              |
| `useFileToCardMorph.ts` | React lifecycle: measure source → request `onPresentationChange('card' \| 'source')` → layout effect → animate; interruption on resize, unmount, item change. |
| `CaptureToCard.tsx`     | Controlled presentation via parent callback; layered stage during morph.                                                                                      |

**Forward:** measure painted thumbnail image + filename → parent toggles to card → measure destination image + title → image FLIP flyout, title box/font travel, card shell opacity reveal at **final** layout (no shell scale), source fade, staggered detail rows.

**Back:** opacity cross-fade between stacked layers (intentional, not a reverse FLIP). After the fade, collapse the destination layer from layout (`display: none`) and re-pin `stage` `min-height` to the source-only height before clearing it — avoids a height jump when the card layer unmounts. `finishBackMorph` commits destination `opacity: 0` before canceling `fill: forwards`.

**Reduced motion:** skip flyout; instant card layout.

**Do not** install Motion and GSAP together. **Do not** build a generic multi-field animation engine — hero is image travel + simple secondary reveal.

## Skeleton / reveal (current — 2026-10-27)

**Decision:** Build skeleton/reveal **in this repository** when needed. Plain CSS and/or WAAPI; no third-party transition library.

**Requirements:** stable layout slots aligned with card media + title + detail rows; reveal as soon as content is ready; no artificial minimum wait; `prefers-reduced-motion` respected; non-interactive, accessible placeholder state (see `docs/B-MOTION-STORYBOARD.md`).

**Status:** Framed only — not implemented.

## Fonts

The demo uses the **system UI stack**. Inter was listed but never loaded; the unused family name was removed so the page does not depend on a webfont.

## Git / agents

- Commits and pushes are **human-only** (see `AGENTS.md` and `.agents/skills/capture-to-card-git-pr/SKILL.md`).
- Repo-local author identity: `Achraf Ghodbani` / `achrafghod.pro@gmail.com`.

## Superseded

### Large “source capture” layout (2026-10-27)

Full-width ~16:10 source frame, card meta including **origin URL**, fixed **5:2** card media with `object-fit: cover`. Replaced by fictional **explorer row + file metadata card** (see `A-PROJECT-BRIEF.md`).

### External transition-pack skeleton (2026-10-27)

Earlier docs referenced studying third-party skeleton/reveal examples for licensing awareness. **Superseded** by the in-project skeleton decision above — no vendored transition source in this repo.
