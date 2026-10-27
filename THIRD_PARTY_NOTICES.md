# Third-party notices

## Runtime and build dependencies

Application code depends on open-source packages listed in `package.json` and resolved in `pnpm-lock.yaml` (including React, Vite, TypeScript, and oxlint). Each package is distributed under its own license; see the corresponding `node_modules/<package>/LICENSE` after install.

## Scaffold

The app was bootstrapped with `create-vite` (MIT).

## Project assets

`src/assets/demo-capture.svg`, `public/favicon.svg`, and the files under `src/test/manual-fixtures/` are original assets for this repository.

## Skeleton / motion

No third-party transition library or skeleton implementation is vendored in this repository. Card skeleton/reveal behavior, if added, will be implemented in-project (see `docs/B-MOTION-STORYBOARD.md` and `docs/C-ENGINEERING-DECISIONS.md`).
