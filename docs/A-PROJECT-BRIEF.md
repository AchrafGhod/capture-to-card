# Project brief

## Intent

**capture-to-card** is a small, frontend-only demonstration of **visual continuity**: an image file shown in a **fictional file explorer** (thumbnail + name) becomes an **enriched card** where the same preview, title, and file properties are composed for reading.

The reusable piece is the motion and composition between explorer row and card — not a capture tool, not a full application shell, and not a real filesystem UI.

## User journey (target)

1. A compact surface evokes a file explorer (no OS window, no folder APIs).
2. One image file is shown with thumbnail and filename.
3. The user selects the file, then activates **Create card**.
4. The thumbnail becomes the card media preview (no distortion).
5. The filename becomes the card title.
6. File metadata appears on the card: dimensions, format and size, **last modification** (`File.lastModified` — not “creation date”).

A bundled **fictional local file** (`src/assets/demo-capture.svg`) is always available. The demo may also import **one** real local image via an accessible file input (in-browser only).

## Demo constraints

- Runs entirely in the browser; no backend, accounts, or network upload.
- Does not capture pages or the OS screen.
- No drag-and-drop, multi-import, folder browser, or editor in the current scope.

## Current status

| Area | Status |
|------|--------|
| Fictional explorer + card layouts (instant toggle) | **Done** |
| Local single-image import (demo shell) | **Done** |
| Shared-element morph (thumbnail → card media, title, meta reveal) | **Not started** |
| Optional in-project skeleton/reveal | **Framed** (see storyboard; not implemented) |
| npm package API | Not defined |

## Superseded scenario (2026-10-27)

**Previous:** large “source capture” frame (~16:10) with URL/origin metadata, toggling to a fixed wide band card with `object-fit: cover`.

**Why replaced:** product intent shifted to **local image file → card**, emphasizing continuity from explorer thumbnail and filename rather than a webpage screenshot metaphor. Origin/URL was removed as irrelevant for local files; card media ratio follows the asset instead of a fixed aspect band.

## Out of scope

- Dashboards, modals, or multi-step product workflows beyond this demo.
- Copying business logic or private assets from other codebases.

## Card composition (this project)

Visual rules are defined and implemented locally in `CaptureToCard.css`:

- Bordered card surface, restrained spacing, clear title → metadata hierarchy.
- Media uses **contain** and per-image aspect ratio — no silent crop of important image areas.
- Demo UI copy in simple English: short labels, action-oriented buttons, no promotional filler or implementation jargon in the interface.
