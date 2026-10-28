# Third-party notices

## Runtime and build dependencies

Application code depends on open-source packages listed in `package.json` and resolved in `pnpm-lock.yaml` (including React, Vite, TypeScript, and oxlint). Each package is distributed under its own license; see the corresponding `node_modules/<package>/LICENSE` after install.

## Scaffold

The app was bootstrapped with `create-vite` (MIT).

## Project assets

`src/assets/demo-capture.svg`, `src/assets/landscape-960x540.png` (collection seed), and `public/favicon.svg` are original assets for this repository.

## Build-phase motion styling

Cell-mask build reveal, dot placeholders, and media dot fields are implemented in this repository (`cell-build.css` and related morph modules). They are **not** vendored from external transition packs.

Original capture-to-card morph and layout code remains under the repository [MIT License](LICENSE) where applicable.
