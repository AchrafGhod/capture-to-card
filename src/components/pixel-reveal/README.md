# Pixel Reveal

Standalone React image reveal. Import `PixelReveal.tsx`; it imports its own CSS and `pixelRevealGrid.ts`. It has no catalog, font, token, or image-asset dependency.

```tsx
import { PixelReveal } from './components/pixel-reveal/PixelReveal'

;<PixelReveal
  src="/my-image.webp"
  alt="Describe the image"
  width={1200}
  height={675}
  pixelSize={24}
  duration={1200}
  direction="left-to-right"
  replayKey={0}
/>
```

- `src`, `alt`: required image source and accessible description.
- `width`, `height`: optional intrinsic dimensions; provide them to reserve space before loading. The image scales to its parent's width and keeps its ratio.
- `pixelSize`: approximate rendered cell size in CSS pixels (default 24, minimum 8). The grid adapts to the image and is capped at 600 cells for large surfaces.
- `duration`: sweep duration in milliseconds (default 1200, minimum 100).
- `direction`: `left-to-right` (default), `right-to-left`, `top-to-bottom`, or `bottom-to-top`.
- `layerColor`: leading pixel wave color (default `#111111`). The demo also offers a dark forest green suited to its sample image; it does not sample image colors automatically.
- `replayKey`: increment a parent-owned number to replay. Changing source or motion parameters also starts a fresh reveal. There is no automatic loop.

A colored pixel wave fades in first, with varied semi-transparent pixels progressively becoming opaque; each cell reveals the image when its color ends. Both waves share the same grid and direction, within the selected total duration. The image gently zooms out from 106% to 100% over that same duration, clipped inside a stationary masked viewport so the pixel grid stays fixed. A fresh random shape on each run combines broad uneven lobes and smaller edge scatter; the leading color band stays narrow. `layerColor` changes also replay the effect. Reduced motion skips both layers and the zoom.

The effect waits for image decoding, then uses original SVG cell masks and WAAPI stepped opacity. The completed image has no mask or grid. Replay/source replacement/unmount cancel old handles; resizing or enabling reduced motion completes the image immediately. Browsers without WAAPI show the image directly. A failed source displays a short error message. React Strict Mode is supported through effect cleanup.

The demo's generated lake sample is separate from this component. Supply your own image for reuse. The Library's Code tab exposes these sources, their local dependencies and an integration example; no package installation or source download is provided by the catalog.
