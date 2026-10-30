# SVG Logo Reveal

Inline SVG + plain CSS. No JavaScript, React, font or library required. Include
`LogoReveal.css` and paste the SVG from `logo-reveal.html` into your page. The
animation runs once on insertion and leaves the original filled logo visible.

The example preserves the exact four path geometries, viewBox and fill colors
from the owner's `src/assets/brand/logo.svg`. Only animation/accessibility
attributes are added; the original asset remains untouched.

## Use another logo

Use your own inline SVG (an `<img>` does not expose its paths to page CSS).
Keep its `viewBox`, path data and original fills. Add `cm-logo-reveal` to the SVG
and `cm-logo-reveal__part` plus `pathLength="1"` to each path. Give each path a
stroke matching its fill and a zero-based `style="--part: 0"` index. Update
`aria-label` for the logo. Do not inline untrusted uploaded SVG markup.

`stroke-dashoffset` reveals each outline, then `fill-opacity` brings in the color
while the outline fades away. This traces the contours of filled shapes, rather
than drawing a handwriting-style centerline. Basic rect/circle/ellipse/line/
polygon/polyline shapes also work. For stroke-only artwork, set
`--logo-reveal-final-stroke: 1` on the shape and keep its original stroke and
`fill="none"`. The optional `--logo-reveal-stroke-width`, `--logo-reveal-linecap`,
`--logo-reveal-linejoin`, and `--logo-reveal-final-fill` variables preserve drawing
styles. Defaults retain the original filled logo.

## Try your own SVG

The demo's Change SVG control reads files locally; Use sample restores the
original. The HTML tab follows the imported logo, including the usage example.
This demo-only import logic is not required by the reusable HTML/CSS animation.

The importer rebuilds a vector-only tree with allowed elements and attributes;
it strips scripts, event handlers, external references and styles outside its
presentation allowlist. Basic shapes, transforms, common class/inline paint,
gradients, clips and masks are supported. Flatten text and linked shapes to
paths first; embedded images are not supported. CSS rules beyond common exported
presentation styles may require a plain SVG export. Limits: 1 MiB, 300 animated
shapes, 2000 elements, nesting depth 32 and 200 style rules. Imported shape delays
span at most three stagger steps, keeping complex logos within the same short
duration. Original assets remain untouched.

## Timing

Set CSS variables on the SVG or an ancestor:

```css
.my-logo {
  --logo-reveal-duration: 1600ms;
  --logo-reveal-stagger: 120ms;
}
```

Duration is per path. Total time is duration plus the last path index multiplied
by stagger (1960ms for this four-part example). Set stagger to `0ms` to draw all
paths together. Adjust the local stroke width to fit the new SVG's coordinate
scale. Size through the SVG width/height attributes or CSS.

Reduced motion shows the filled logo immediately, including when the preference
changes during a run. Without animation support the filled logo stays visible.
There is no loop. Replay is a presentation control: CompoMotion's React demo
remounts the static SVG and changes only inherited timing variables. No demo
code is required in a consuming project.
