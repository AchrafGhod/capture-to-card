# Skeleton Reveal

HTML + CSS, with optional JavaScript for real image readiness. No React or library
dependency. Include SkeletonReveal.css, paste skeleton-reveal.html, and replace
the image source, alt text and content. image.svg in the HTML tab is a local
example; use your own image in production. Keep the project MIT license.

```js
import { mountSkeletonReveal } from './skeleton-reveal.js'
const skeleton = mountSkeletonReveal(document.querySelector('.cm-skeleton'))
// skeleton.reset() hides the content; skeleton.reveal() waits for the current image.
// skeleton.destroy() before removing the element cancels listeners/frames/feedback.
```

Auto mode waits for all images and decoding, then reveals content. No artificial
loading delay. For API data, mount with `{ auto: false }`, populate your content,
then call `reveal()` after fetching. For source replacement, call `reset()` first,
update img.src, then `reveal()`. Failed images keep placeholders static and expose
an error message; retry after fixing the source. Dispose before mounting again.

For CSS-only use, start from the HTML's loading state. When your application knows
the content is ready, set data-ready="true", aria-busy="false", remove inert and
aria-hidden from the body, and update the live status. A static HTML example can
start in this finished state, but CSS alone cannot detect real network readiness.

All shimmer, opacity, movement and stagger are CSS. Configure
`--skeleton-duration` (420ms) and `--skeleton-stagger` (90ms); each slot has its
own `--slot` index. Real content reserves its layout, avoiding a height jump.
Decorative placeholders are hidden from assistive technology, loading content is
inert, and live status announces completion/errors. Reduced motion removes
shimmer, travel and transitions. No animation library, timer loop or backend.
