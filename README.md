# capture-to-card

A small frontend demo: an image in a fictional file list becomes a card with the same preview, the filename as title, and file metadata.

This is not a published package, not a screen-capture tool, and not a clone of another product.

## Status

The explorer and card switch instantly so both layouts can be reviewed. Shared-element motion is planned (`docs/B-MOTION-STORYBOARD.md`) and is not in this build.

## How the demo works

1. Use the bundled `demo-capture.svg`, or choose one local PNG, JPEG, GIF, WebP, or SVG.
2. Select the file in the list, then **Create card**.
3. The card shows the preview, filename, dimensions, format · size, and last modified time (`File.lastModified` on imports).
4. **Back to file list** returns to the explorer.

Images stay in the browser. Nothing is uploaded. Replacing an import revokes the previous `blob:` URL. The file picker `accept` list is only a hint; the demo still checks the type and decodes the file.

## Run locally

Verified with **Node.js v24.15.0** and **pnpm 11.18.0**. Node 22.12 or newer should work (`package.json` `engines`).

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Development server |
| `pnpm test` | Vitest (jsdom) |
| `pnpm lint` | oxlint |
| `pnpm build` | Typecheck and production build |
| `pnpm preview` | Serve the production build |

## Limits

- One image at a time. No drag-and-drop, folders, or editor.
- The toggle is instant. There is no travel animation yet.
- There is no file-size or pixel cap. A very large image can stall the tab; a limit was not added without a measured threshold.
- Automated tests cover import rules, the disabled **Create card** path, focus after toggle, and a stale-import race. They do not prove real-browser file picking.
- Manual fixtures for a long name, portrait, landscape, and a non-image file live in `src/test/manual-fixtures/`.

## Layout

```
src/components/capture-to-card/   Explorer and card UI
src/demo/                         Demo shell and local import
docs/                             Brief, storyboard, decisions, quality notes
```

## License

Original code is under the [MIT License](LICENSE). Dependency and asset notes: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
