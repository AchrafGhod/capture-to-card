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

## Scene model (current — 2026-10-28)

| Concern                          | Owner                     | Notes                                                                                                                         |
| -------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Shared item type                 | `captureToCardItem.ts`    | `CaptureToCardItem` only; no demo defaults.                                                                                   |
| Preview + build + collection UI  | `CaptureToCard.tsx` + CSS | In-place build (cell reveal) or ready card + grid (grid insert). Parent owns `presentation`, collection list, session lock.   |
| Study catalog + docs shell       | `demo/demoPages.ts`       | **Cell reveal** + **Grid insert** catalog; Library / Docs copy and page helpers.                                              |
| Collection seed + session ids    | `demo/demoCollection.ts`  | Stable seed ids; `session-*` ids for cards created in the demo run.                                                           |
| Local file import (single image) | `demo/demoImageImport.ts` | Used by `Demo` only. User-facing import errors; creates and revokes `blob:` URLs with reference set from source + collection. |
| Import ordering                  | `demo/Demo.tsx`           | Monotonic `importSequenceRef`; failed import keeps previous file.                                                             |
| Demo orchestration               | `demo/Demo.tsx`           | Header (Library / Docs), catalog tiles, study well, collection owner, object URL lifecycle.                                   |
| Bundled example                  | `demo/demoDefaultItem.ts` | `defaultCaptureToCardItem` for first paint; `demoCaptureSrc` for revoke comparisons.                                          |

**Studies:** **Cell reveal** (`studyScene: file-to-card`) — in-place cell build on **Animate** only. **Grid insert** (`studyScene: collection-insert`) — `requestCollectionInsertOnly`, no cell build.

**Removed (2026-10-28):** legacy File column + **Create card** + preview-row forward flyout (`buildForwardFlyout` / `runForwardMorph`). Props `showFileColumn` and `cellRevealInPlace` removed; study scene selects behavior.

**Presentation:** parent-owned `preview` | `card` only (2026-10-28 — removed in-scene collection detail / tile FLIP).

**Collection grid:** same `.capture-to-card__card` markup and CSS as the build frame (no tile modifiers).

**Data shape:** one `CaptureToCardItem` per file (preview URL, title = filename, dimensions, format · size, last modified label). No `origin` / URL field.

**Media framing:** CSS `--ctc-item-aspect` from item width/height; `object-fit: contain` in card media — no fixed aspect band obligation.

## File naming (current — 2026-10-28)

| Area                         | Pattern                                                        | Examples                                                                        |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| React components             | PascalCase base + matching `.tsx` / `.css`                     | `CaptureToCard.tsx`, `Demo.tsx`                                                 |
| Demo-only modules            | `demo` prefix + camelCase                                      | `demoPages.ts`, `demoCollection.ts`, `demoImageImport.ts`, `demoDefaultItem.ts` |
| Shared types (non-component) | camelCase next to component                                    | `captureToCardItem.ts`                                                          |
| Hooks                        | `use` + camelCase                                              | `useImageDropZone.ts`, `morph/useFileToCardMorph.ts`                            |
| Morph runners                | `run` + camelCase                                              | `runCellBuildReveal.ts`, `runMorphAnimations.ts`                                |
| Morph helpers                | camelCase (noun or verb)                                       | `revealOrder.ts`, `mountMatrixDots.ts`, `cellBuildDom.ts`                       |
| Build styling                | kebab-case, matches `.ctc-build`                               | `cell-build.css`                                                                |
| Static assets                | kebab-case under `src/assets/`                                 | `demo-capture.svg`, `landscape-960x540.png`                                     |
| Tests                        | colocated: `*.test.ts(x)`; Demo integration: `Demo.*.test.tsx` | `demoImageImport.test.ts`, `CaptureToCard.morph.test.tsx`                       |

Folder `src/components/capture-to-card/` keeps the historical repo slug; product name **CompoMotion** is UI/docs only until a GitHub rename.

## Card visual language (current)

Shared tokens in `src/styles/tokens.css`, imported once from `src/index.css`. `CaptureToCard.css` expects those custom properties on `:root`. This is not a published package; copy or import `tokens.css` if the component is reused outside this demo.

Product name in the UI is **CompoMotion**. Layout and states stay in `CaptureToCard.css` / `Demo.css`. The demo shell is a centered frame (`--ctc-shell-max`) with an airy header (**Library**, **Docs**). Library is a tile catalog; Docs is a short report (Introduction + Documentation); a study opens from a tile. **Back** returns to Library. Study view tabs are Preview (live), CSS, and React (disabled). No sidebar, playbook, or router. Study column layout lives on `CaptureToCard`. Catalog tile sketches are original CSS, not live morph instances.

- Bordered surfaces, modest radius, light shadow on the destination card.
- Title and definition-list metadata below media; restrained type scale.
- File preview row removed with legacy path; **Change image** on the in-place build frame (cell reveal).
- Image ratio is `--ctc-item-aspect` on the component instance, not a token.

## Animation engine (current — 2026-10-27)

**Decision:** **Web Animations API + FLIP** in `src/components/capture-to-card/morph/` — no animation library added.

| Piece                                | Role                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `containedImageRect.ts`              | Painted rect for `object-fit: contain` (card media).                                                   |
| `cell-build.css` + `cellBuildDom.ts` | Layered placeholders + reduced-motion instant reveal; build uses cell masks (`runCellBuildReveal.ts`). |
| `mountMatrixDots.ts`                 | Static dot grids aligned to mask cells during build.                                                   |
| `revealOrder.ts`                     | Diagonal reveal order (deterministic jitter).                                                          |
| `runCollectionInsertMorph.ts`        | Build shell → grid slot FLIP + neighbor FLIP.                                                          |
| `runMorphAnimations.ts`              | Cell-build DOM prep/restore + reduced-motion instant reveal (no travel flyout).                        |
| `useFileToCardMorph.ts`              | Cell build + collection insert phases; interruption cleanup.                                           |
| `CaptureToCard.tsx`                  | Preview layer + card destination; `.ctc-build` wrappers for text reveal.                               |

**Cell reveal:** **Animate** runs `prepareDomForCellBuildReveal` then `runCellBuildReveal` in the build frame.

**Reduced motion:** skip WAAPI travel (none); instant cell build or collection insert swap.

**Superseded (2026-10-28):** preview-row forward flyout + File column + **Create card** — removed; only the two live studies remain.

**Do not** install Motion and GSAP together. **Do not** build a generic multi-field animation engine — hero is cell-mask build + collection FLIP.

## Skeleton / reveal (current — 2026-10-28)

**Decision:** **Cell-mask build reveal** — SVG masks on card image and `.ctc-build__text`, synchronized with static dot grids (`cell-build.css`). Media uses an original large dot field during build.

**Requirements met:** stable `.ctc-build__text` slots; decorative placeholders `aria-hidden`; no fake network wait; reduced motion instant reveal via `instantBuildReveal`; no `aria-busy` on skeleton; cancel on interrupt removes defs/masks.

## Third-party transition CSS (2026-10-28)

**Decision:** Build-phase dot and placeholder styling is **original** (`cell-build.css`, `.ctc-build` / `.ctc-dot-grid` class names). Earlier Transitions.dev–derived files were removed because the project direction is a personal transition library; their license restricts redistributing the transitions collection as a library product.

## Fonts

**Current (2026-10-29):** Inter Variable 4.1 for body/UI text, self-hosted as an unmodified WOFF2 in `src/assets/fonts/` with its SIL OFL 1.1 license. Satoshi 500/700 for display headings, loaded from Fontshare's official CSS API with `display=swap`; Inter/system UI are fallbacks. Fontshare's supplied ITF FFL 2.0 permits web use but restricts redistribution through repositories, so no Satoshi binary is committed or included in component exports. No npm font dependency.

**Superseded:** system-only stack (2026-10-28).

## Library presentation (current — 2026-10-29)

- The supplied Library screenshot is the phase 1 visual reference; no Figma inspection was needed. Header uses the supplied original symbol and wordmark SVGs; accent `#003CFF` comes from the symbol. The symbol also serves as favicon.
- `demoPages.ts` remains the typed catalog/copy owner. Category definitions and each study's category membership are data; `LibraryPage.tsx` renders the common filters, tile shell, result count, and empty state. There is no dynamic registry, router, or state library.
- Cell reveal belongs to Animations + Card; Grid insert to Transition + Card. Button is intentionally empty. Filtering derives results during render; Demo owns the selected category so it survives visits to studies and Docs.
- Plain CSS preserves the reference's static abstract tile sketches and adds hover/focus/pressed styles. Narrow layouts wrap filters, increase touch targets, and switch the grid to one column. Existing WAAPI/FLIP components and their scene orchestration stay intact.
- Copy/export tabs remain disabled. Reusable component files do not depend on catalog metadata, brand assets, or Satoshi. Phase 2 can add export metadata alongside catalog entries without changing the Library layout.

## Git / agents

- `.gitattributes` keeps text checkouts in LF, matching Prettier on Windows and other platforms; binary assets retain automatic detection. This avoids CRLF-only changes when running the required formatter.
- Commits and pushes are **human-only** (see `AGENTS.md` and `.agents/skills/capture-to-card-git-pr/SKILL.md`).
- Repo-local author identity: `Achraf Ghodbani` / `achrafghod.pro@gmail.com`.

## Superseded

### Large “source capture” layout (2026-10-27)

Full-width ~16:10 source frame, card meta including **origin URL**, fixed **5:2** card media with `object-fit: cover`. Replaced by fictional **explorer row + file metadata card** (see `A-PROJECT-BRIEF.md`).

### External transition-pack skeleton (2026-10-27)

Earlier docs referenced studying third-party skeleton/reveal examples for licensing awareness. **Superseded** by the in-project skeleton decision above — no vendored transition source in this repo.
