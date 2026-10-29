# Third-party notices

## Runtime and build dependencies

Application code depends on open-source packages listed in `package.json` and resolved in `pnpm-lock.yaml` (including React, Vite, TypeScript, and oxlint). Each package is distributed under its own license; see the corresponding `node_modules/<package>/LICENSE` after install.

## Scaffold

The app was bootstrapped with `create-vite` (MIT).

## Project assets

`src/assets/demo-capture.svg`, `src/assets/landscape-960x540.png` (collection seed), and `public/favicon.svg` are original assets for this repository.

The owner supplied `src/assets/brand/logo.svg` and `src/assets/brand/compomotion.svg`; both are preserved without modification. `public/favicon.svg` uses the supplied symbol.

## Fonts

- **Inter Variable 4.1**, The Inter Project Authors: unmodified `src/assets/fonts/inter-variable.woff2`, obtained from the [official Inter distribution](https://rsms.me/inter/). Licensed under the SIL Open Font License 1.1; full license in `src/assets/fonts/inter-OFL.txt`.
- **Satoshi**, Indian Type Foundry: loaded for the demo shell through the [official Fontshare service](https://www.fontshare.com/fonts/satoshi), under the [ITF Free Font License](https://www.fontshare.com/licenses) (download supplied FFL 2.0, 17 Aug 2026). No Satoshi font binaries are redistributed in this repository or component exports. Web embedding does not relicense the font under this project's MIT license. If Fontshare is unavailable, the UI falls back to Inter/system UI.

## Build-phase motion styling

Cell-mask build reveal, dot placeholders, and media dot fields are implemented in this repository (`cell-build.css` and related morph modules). They are **not** vendored from external transition packs.

Original capture-to-card morph and layout code remains under the repository [MIT License](LICENSE) where applicable.
