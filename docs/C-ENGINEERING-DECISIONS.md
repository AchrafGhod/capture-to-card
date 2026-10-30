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

## Reusable component format (current — 2026-10-29)

- New reusable components use standalone HTML/SVG and plain CSS first; add minimal JavaScript only for behavior that needs it. React remains the catalog/demo host, not a requirement for consuming these new components. Earlier React components are retained; conversion is a separate change.
- SVG Logo Reveal is the first example: `src/components/logo-reveal/logo-reveal.html` and `LogoReveal.css` are the actual portable component. `LogoRevealDemo.tsx` owns Replay, timing selectors and local SVG import. No generic runtime or new dependency.
- SVG geometry, viewBox and fills are copied exactly from the owner's supplied logo; original asset stays untouched. `pathLength="1"` normalizes contour lengths. One finite CSS animation draws via stroke-dashoffset, fades in each original fill, then fades out the extra stroke. Per-path `--part` indices create a readable top-left → top-right → bottom-left → bottom-right stagger. Per-path duration and stagger are inherited CSS variables; default total 1960ms.
- Reduced motion disables animation, leaving original fills/strokes visible. Static CSS defaults show the logo without animation support. No loop, measurement code, WAAPI handles or animation timers. Optional per-shape CSS variables preserve imported stroke width/caps/joins and final paint opacity; defaults retain the supplied four-path logo.

## Custom SVG preview (current — 2026-10-29)

- Change SVG / Use sample are small preview-only controls. Files are read locally with no upload endpoint. A generation check discards stale reads after replacement, reset or unmount; invalid files retain the preceding valid logo. The CompoMotion wordmark below the sample is hidden for custom artwork. The canvas contains both wide and tall logos.
- `demo/logoSvgImport.ts` parses XML and rebuilds a fresh allowlisted SVG tree before any innerHTML insertion. Scripts, event attributes, external references, links, unapproved style properties and unsupported elements are not copied. IDs/internal paint/clip/mask references are renamed per import. Common inline/class presentation styles are resolved without mounting an uploaded stylesheet. Text, raster images, linked use shapes and foreignObject are rejected with a conversion hint. No sanitizer dependency or arbitrary SVG execution.
- Bounds and limits: valid viewBox (or finite width/height), at most 1 MiB, 300 animated shapes, 2000 nodes, depth 32 and 200 style rules. Paths and basic geometry receive normalized pathLength and CSS variables; definitions/masks/clips remain static. Stagger indices are normalized into at most three steps so a complex logo does not create a long animation. Common paint/transforms are retained; advanced CSS/inherited gradient definitions are not a general SVG rendering contract.
- Demo stores the sanitized markup separately from original files. StudyWorkspace passes it to the source panel: both logo-reveal.html and its usage.html example reflect the tested upload; Use sample restores both. The reusable animation remains HTML/SVG + CSS; importer code stays in the demo.

## Source browsing and copying (current — 2026-10-29)

### Animated Checklist

- `components/animated-checklist/` is HTML + scoped CSS only, with five li/label/native-checkbox rows. CSS :checked draws a small SVG check, pulses the box and grows a strike background across inline text fragments; unchecking reverses the transitions. A separate text wrapper preserves inline wrapping rather than letting the flex row turn the strike into a single block line.
- No IDs, JavaScript, React dependency or state store. Labels provide names and full-row activation, native checked values support forms, and focus-visible marks keyboard focus. Reduced motion removes transitions/pulse; forced colors exposes native checkboxes and a text-decoration fallback. Demo reset uses native form reset. Technology tabs expose only HTML/CSS.
- No persistence, task API or changes to existing studies. CSS variables expose accent and strike duration. Source metadata remains separate from the common presentation.

### Skeleton Reveal

- `components/skeleton-reveal/` provides portable HTML, scoped CSS and a small optional JavaScript module. All shimmer, fade, 6px entrance and slot stagger live in CSS. Real content reserves space below decorative overlays. Reduced motion disables shimmer and travel/transitions.
- `mountSkeletonReveal(root, {auto})` waits for all image load/decode promises, then toggles readiness, inert/aria-hidden and live status. It has reset/reveal/destroy methods for integration with actual API loading. No artificial network delay; auto mode waits two animation frames solely to establish an initial CSS state for cached images. Aborted/stale runs cannot reveal content after reset or destruction; image errors expose an inline message and stop shimmer.
- Demo-only controls let visitors hold the skeleton, reveal real content or replay. The reusable component imports no React, token sheet or demo image. The source tabs provide HTML/CSS/JavaScript, a usage example and a local sample SVG; use your own image/content in production. Existing card studies remain unchanged.

- Study tabs follow the technologies declared alongside each catalog entry: Preview / HTML / CSS for SVG Logo Reveal; Preview / HTML / CSS / JavaScript for Copy Button; Preview / React / CSS for the three existing React studies. Each tab shows the corresponding source immediately, with a filename and Copy code action. A file selector appears only when that technology needs multiple files. No download, ZIP, source panel introduction, file-count summary or integration accordion.
- `StudyWorkspace` owns accessible tab selection, arrow/Home/End navigation and the shared panels. Preview stays mounted when viewing source, preserving completed demo state. `StudySourcePanel` loads sources on demand, displays them as escaped React text and handles loading/retry without evaluating source strings.
- `source/sourcePackages.ts` has a small typed study-to-folder map and Vite lazy raw imports of the actual component files, excluding tests and React-only Copy Button adapter files. Source changes therefore appear without manually maintaining snippets. React studies include their local modules, CSS, integration example, sample SVG and (for card studies) tokens/import helper. HTML studies include an inline snippet and usage.html. React dependencies remain explicit in Docs; original animations are not rewritten.
- Copy Button is now standalone HTML/CSS/JavaScript with `mountCopyButton(element, options)` returning cleanup. `CopyButton.tsx` is only a React adapter around these same files; both demo and source-copy controls use it. Existing clipboard lifecycle tests exercise this portable implementation through the adapter. No new dependency or source execution service.

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

Product name in the UI is **CompoMotion**. Layout and states stay in `CaptureToCard.css` / `Demo.css`. The demo shell is a centered frame (`--ctc-shell-max`) with an airy header (**Library**, **Docs**). Library is a tile catalog; Docs is a short report (Introduction + Documentation); a study opens from a tile. **Back** returns to Library. Study view tabs are Preview plus the available source technologies. No sidebar, playbook, or router. Study column layout lives on `CaptureToCard`. Catalog tile sketches are original CSS, not live morph instances.

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

## Pixel Reveal (current — 2026-10-29)

- New autonomous component under `src/components/pixel-reveal/`, separate from the existing card morphs. React + plain CSS + WAAPI; no npm dependency. Its CSS needs no global tokens. Source and alt text are props; intrinsic dimensions reserve layout space.
- The single HTML image is decoded before masking. A normalized SVG mask has a bounded grid (maximum 600 cells). A decorative SVG overlay paints the leading colored wave using one WAAPI handle per cell. Each pixel fades from 0 through a seeded intermediate opacity (35–65%) to 1, with varied ramp timing and ease-out, then briefly holds before the image appears. When that cell finishes, its image-mask opacity is explicitly set to 1 so the CSS mask repaints reliably. Both layers are removed at completion. Each replay uses a fresh random seed: smooth noise across lanes creates broad uneven lobes, with finer cell scatter at the edge. Delays are normalized to preserve the total duration. The colored band is narrower (11% lead plus a short cell step capped at 55ms).
- Public motion props: approximate `pixelSize` (24px default), `duration` (1200ms total), `direction` (left-to-right, right-to-left, top-to-bottom, bottom-to-top), `layerColor` (`#111111` default), and a parent-owned `replayKey`. The color wave leads the image by 11% of the selected duration, within that same total. No loop, router, global store, imperative ref API, or export/copy feature.
- The mask belongs to a stationary, overflow-clipped viewport around the image. One additional WAAPI handle scales the inner image from 1.06 to 1 with a soft ease-out during the selected duration. The viewport owns bounds/resize measurement so the zoom cannot move the grid or trigger resize cleanup. The zoom shares reveal cancellation and is skipped for reduced motion; no additional prop or control.
- Cleanup cancels animation handles on replay, prop changes and unmount. Generation checks discard stale decode completions. Resize and reduced-motion changes end the reveal; reduced motion or absent WAAPI shows the decoded image directly.
- `PixelRevealDemo.tsx` owns sample image and four controls, including Black / Forest green layer presets (manual colors, no image sampling). Catalog entry belongs to Animations; the existing shared study shell, tabs and arrows are reused. `CaptureStudyId` keeps the two legacy card scene IDs narrow while `DemoStudyId` includes the new study.
- Lake sample generated with Imagegen for this demo, resized/compressed as `pixel-reveal-lake.webp`. It is not bundled into the reusable component contract.

## Copy Button (current — 2026-10-29)

- Autonomous `src/components/copy-button/` component with its own CSS and native Clipboard API. Props: `text`, `label` (Copy), `resetAfter` (1800ms), `disabled`. No dependency or demo token requirement; native Windows bridges are outside this browser component's contract.
- A user activation calls `navigator.clipboard.writeText`; only a resolved write produces the Copied confirmation. Concurrent writes are blocked. Re-copy restarts the reset timer. Failure stays visible with a retry and manual-copy hint; unavailable clipboard access follows that same path. HTTPS/localhost and clipboard access are required; no deprecated copy fallback or clipboard read.
- CSS keyframes animate confirmation/return (180ms, opacity and 4px movement) and check drawing (260ms). Minimum button width keeps default labels steady. The reduced-motion media rule removes animations if enabled before or during feedback. Native keyboard activation, focus ring and a persistent live status communicate the same result.
- Adapter prop changes/unmount dispose the previous binding and clear its feedback/timer. Actual clipboard writes cannot be cancelled. `CopyButtonDemo` owns the editable example; catalog membership is Button. The same action copies source text in the technology tabs.

## Fonts (current)

**Current (2026-10-29):** Inter Variable 4.1 for body/UI text, self-hosted as an unmodified WOFF2 in `src/assets/fonts/` with its SIL OFL 1.1 license. Satoshi 500/700 for display headings, loaded from Fontshare's official CSS API with `display=swap`; Inter/system UI are fallbacks. Fontshare's supplied ITF FFL 2.0 permits web use but restricts redistribution through repositories, so no Satoshi binary is committed or included in component exports. No npm font dependency.

**Superseded:** system-only stack (2026-10-28).

## Library presentation (current — 2026-10-29)

- The supplied Library screenshot is the phase 1 visual reference; no Figma inspection was needed. Header uses the supplied original symbol and wordmark SVGs; accent `#003CFF` comes from the symbol. The symbol also serves as favicon.
- `demoPages.ts` remains the typed catalog/copy owner. Category definitions and each study's category membership are data; `LibraryPage.tsx` renders the common filters, tile shell, result count, and empty state. There is no dynamic registry, router, or state library.
- Cell reveal belongs to Animations + Card; Grid insert to Transition + Card; Pixel Reveal to Animations; Copy Button to Button. Filtering derives results during render; Demo owns the selected category so it survives visits to studies and Docs. The empty state remains available for future categories without entries.
- Plain CSS preserves the reference's static abstract tile sketches and adds hover/focus/pressed styles. Narrow layouts wrap filters, increase touch targets, and switch the grid to one column. Existing WAAPI/FLIP components and their scene orchestration stay intact.
- Technology tabs now display the available source formats and allow copying per file. Reusable components do not depend on catalog metadata or Satoshi. SVG Logo Reveal's sample paths are the supplied brand symbol; users can replace them with their own inline SVG.

## Git / agents

- `.gitattributes` keeps text checkouts in LF, matching Prettier on Windows and other platforms; binary assets retain automatic detection. This avoids CRLF-only changes when running the required formatter.
- Commits and pushes are **human-only** (see `AGENTS.md` and `.agents/skills/capture-to-card-git-pr/SKILL.md`).
- Repo-local author identity: `Achraf Ghodbani` / `achrafghod.pro@gmail.com`.

## Superseded

### Large “source capture” layout (2026-10-27)

Full-width ~16:10 source frame, card meta including **origin URL**, fixed **5:2** card media with `object-fit: cover`. Replaced by fictional **explorer row + file metadata card** (see `A-PROJECT-BRIEF.md`).

### External transition-pack skeleton (2026-10-27)

Earlier docs referenced studying third-party skeleton/reveal examples for licensing awareness. **Superseded** by the in-project skeleton decision above — no vendored transition source in this repo.
