# Copy Button

Reusable HTML + CSS + a small JavaScript module. No React dependency or animation
library. The catalog uses a thin React adapter around these same files.

1. Include `CopyButton.css` in your page.
2. Paste `copy-button.html` and set its `data-copy-text` attribute.
3. Bind each copy button from a module script:

```js
import { mountCopyButton } from './copy-button.js'
const cleanup = mountCopyButton(document.querySelector('.copy-button'))
// Call cleanup() before removing this element.
```

Options: `text` (string or getter, otherwise reads `data-copy-text` on click),
`label` (`Copy`), `resetAfter` (1800ms), and `disabled` (`false`). A getter can
read an editable field: `text: () => document.querySelector('#my-text').value`.
Bind each element only once; clean up the old binding before binding it again.
The optional `CopyButton.tsx` adapter keeps the same text/label/resetAfter/disabled
props for React consumers; vanilla users need only HTML, CSS and JavaScript.

Uses `navigator.clipboard.writeText` on activation; requires HTTPS or localhost
and browser clipboard access. No clipboard read or deprecated fallback. Only a
resolved write shows Copied. Concurrent writes are blocked. Re-copy resets the
confirmation timer. Failure displays a retry and manual-copy hint. Cleanup
invalidates pending feedback, cancels timers and removes the click listener;
already-started clipboard writes cannot be cancelled.

CSS draws the checkmark and animates confirmation/return. Reduced motion removes
these animations, including when enabled mid-run. Native keyboard activation,
visible focus, textual feedback and a persistent live status are included.
