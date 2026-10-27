---
name: capture-to-card-engineering
description: >-
  Engineering and simplicity rules for the capture-to-card personal repo.
  Use when adding code, choosing dependencies, or updating technical decisions.
---

# capture-to-card engineering

## Principles

- Smallest structure that solves the explorer-to-card demo and a future reusable component.
- **Import** stays outside `CaptureToCard` (`demo/localImageImport`, `DemoImport`); the component consumes a ready `CaptureToCardItem` (`captureToCardItem.ts`).
- Demo defaults live in `demo/demoDefaultItem.ts`, not under `components/`.
- One clear owner per concern (layout vs motion vs demo shell).
- No backend, global state library, monorepo, or plugin architecture unless the user explicitly expands scope.
- Reuse plain CSS and documented browser APIs before adding animation libraries.
- Do not install **both** Motion and GSAP.
- Skeleton/reveal is **in-project only** — no third-party transition-pack imports (see `docs/C-ENGINEERING-DECISIONS.md`).

## Before non-trivial work

State briefly:

| Field            | Question                                  |
| ---------------- | ----------------------------------------- |
| **Problem**      | What user-visible behavior changes?       |
| **Keep**         | What must stay stable (API, composition)? |
| **Target**       | What should exist after?                  |
| **Out of scope** | What to avoid?                            |

## Formatting

- **Source of truth:** `.prettierrc.json` and `.prettierignore` in the repo root.
- Apply with `pnpm run format`; CI enforces `pnpm run format:check` before oxlint.
- Do not maintain parallel manual style (indent, quotes, semicolons, trailing commas) — run the formatter instead.

## Decisions and docs

- **Current** decisions live in `docs/C-ENGINEERING-DECISIONS.md`.
- Label proposals vs accepted decisions; move superseded items with a date.
- After a durable choice (dependency, animation approach, public API shape), update that file.

## Git

See `.agents/skills/capture-to-card-git-pr/SKILL.md`. Owner commits only.

## Card composition (this repo)

- Shared foundations live in `src/styles/tokens.css` (imported once from `src/index.css`).
- Composition stays in `CaptureToCard.css` and `demo/Demo.css` — bordered card, contained media, title + metadata hierarchy.
- Use a token when the same visual decision is shared. Keep a one-off size or padding local.
- `--ctc-item-aspect` is per-image, not a design token.
- Do not add padding/gap/color props, generic Box/Stack/Text primitives, or a style library for this demo.
- A new variant or abstraction needs a real second use, not a hypothetical API.

## Code from elsewhere

Before copying code in, check: license, coupling to another product domain, and whether a short local rewrite is cheaper.

## React memoization

- Default to plain functions and values. Do **not** add `useCallback`, `useMemo`, or `memo` preemptively.
- Before memoizing, name the **consumer** (effect deps, memoized child, imperative API) and what instability would break (spurious effect runs, wasted work, stale props).
- **React Compiler** is not assumed on: check `vite.config.ts` / build plugins for `babel-plugin-react-compiler` (or equivalent) before relying on automatic memoization. In this repo, `@vitejs/plugin-react` runs without the compiler plugin unless that changes.
- Prefer colocating logic in the hook or effect that needs it (e.g. item-change morph interrupt inside `useFileToCardMorph`) over exporting stable callbacks solely for parent `useEffect` deps.
- For morph and animation handles, keep refs for DOM nodes, generation tokens, and phase when listeners or async completion must read the latest value without resubscribing every render. Update phase refs in the same helper that calls `setState`, not in a trailing `useEffect`, to avoid a post-commit lag window.
- Forward morph: one flyout for image + title FLIP; card shell opacity at final geometry (do not scale the shell from the thumb — it fights image travel and causes width jumps). Centralize DOM restore in `finishForwardMorph`; use generation tokens for async completion only.
- Do not trade one `useCallback` for extra refs, microtasks, or effects unless the net complexity clearly drops.
