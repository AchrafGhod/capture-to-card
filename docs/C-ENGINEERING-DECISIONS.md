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

| Concern                          | Owner                     | Notes                                                                                                                               |
| -------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Shared item type                 | `captureToCardItem.ts`    | `CaptureToCardItem` only; no demo defaults.                                                                                         |
| Preview + build + collection UI  | `CaptureToCard.tsx` + CSS | File column + build frame + optional collection grid (`showCollection`). Parent owns `presentation`, collection list, session lock. |
| Study catalog + docs shell       | `demo/demoPages.ts`       | **Cell reveal** + **Grid insert** catalog; Library / Docs copy and page helpers.                                                    |
| Collection seed + session ids    | `demo/demoCollection.ts`  | Stable seed ids; `session-*` ids for cards created in the demo run.                                                                 |
| Local file import (single image) | `demo/demoImageImport.ts` | Used by `Demo` only. User-facing import errors; creates and revokes `blob:` URLs with reference set from source + collection.       |
| Import ordering                  | `demo/Demo.tsx`           | Monotonic `importSequenceRef`; failed import keeps previous file.                                                                   |
| Demo orchestration               | `demo/Demo.tsx`           | Header (Library / Docs), catalog tiles, study well, collection owner, object URL lifecycle.                                         |
| Bundled example                  | `demo/demoDefaultItem.ts` | `defaultCaptureToCardItem` for first paint; `demoCaptureSrc` for revoke comparisons.                                                |

**Studies:** **Cell reveal** — in-place cell build only (`cellRevealInPlace`; demo **Animate**; no file→build travel). **Grid insert** — `requestCollectionInsertOnly`, no forward morph.

**Forward flyout (component default):** `runMorphAnimations.ts` still implements preview-row travel + cell build for tests and non–in-place integration; the live cell study does not use it.

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
- File preview row (thumb + name + change control); card in a second layer when `presentation === 'card'` or during morph.
- Image ratio is `--ctc-item-aspect` on the component instance, not a token.

## Animation engine (current — 2026-10-27)

**Decision:** **Web Animations API + FLIP** in `src/components/capture-to-card/morph/` — no animation library added.

| Piece                                | Role                                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `containedImageRect.ts`              | Painted rect for `object-fit: contain` (card media).                                                   |
| `cell-build.css` + `cellBuildDom.ts` | Layered placeholders + reduced-motion instant reveal; build uses cell masks (`runCellBuildReveal.ts`). |
| `mountMatrixDots.ts`                 | Static dot grids aligned to mask cells during build.                                                   |
| `revealOrder.ts`                     | Diagonal reveal order (deterministic jitter).                                                          |
| `runCollectionInsertMorph.ts`        | Build shell → grid slot FLIP + neighbor FLIP after forward hold.                                       |
| `runMorphAnimations.ts`              | Forward WAAPI (~920ms travel), surface + image flyout.                                                 |
| `useFileToCardMorph.ts`              | Forward → hold → insert phases; prebuild card for measure; interruption cleanup.                       |
| `CaptureToCard.tsx`                  | Preview layer + card destination; `.ctc-build` wrappers for text reveal.                               |

**Forward (default component / tests):** measure file preview row and thumb → card shell and contained media. Flyout: surface panel + image FLIP only. When travel settles, flyout is removed and **cell build reveal** runs (~1680ms, one timeline for media + text).

**In-place cell study:** `cellRevealInPlace` skips flyout; build runs in the build frame after **Animate**. Preview layer stays interactive until morph starts; `finishForwardMorphTravel` still restores chrome before reveal.

**Do not** FLIP the real card shell (inner media would scale). **Do not** parent the image under the surface fly.

**Reduced motion:** skip flyout; instant card layout.

**Superseded (same day):** explorer row → card forward morph and **Back to file list** fade/back height animation — removed with the fictional explorer.

**Do not** install Motion and GSAP together. **Do not** build a generic multi-field animation engine — hero is image travel + simple secondary reveal.

## Skeleton / reveal (current — 2026-10-28)

**Decision:** **Cell-mask build reveal** — SVG masks on card image and `.ctc-build__text`, synchronized with static dot grids (`cell-build.css`). Media uses an original large dot field during build.

**Requirements met:** stable `.ctc-build__text` slots; decorative placeholders `aria-hidden`; no fake network wait; reduced motion instant reveal via `instantBuildReveal`; no `aria-busy` on skeleton; cancel on interrupt removes defs/masks.

## Third-party transition CSS (2026-10-28)

**Decision:** Build-phase dot and placeholder styling is **original** (`cell-build.css`, `.ctc-build` / `.ctc-dot-grid` class names). Earlier Transitions.dev–derived files were removed because the project direction is a personal transition library; their license restricts redistributing the transitions collection as a library product.

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
