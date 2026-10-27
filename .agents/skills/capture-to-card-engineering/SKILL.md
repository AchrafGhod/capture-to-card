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

| Field | Question |
|-------|----------|
| **Problem** | What user-visible behavior changes? |
| **Keep** | What must stay stable (API, composition)? |
| **Target** | What should exist after? |
| **Out of scope** | What to avoid? |

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
