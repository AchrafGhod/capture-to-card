# Animated Checklist

Five native checkboxes in a real unordered list. Standalone HTML + CSS, no
JavaScript, React, font dependency or animation library. Include
AnimatedChecklist.css and paste animated-checklist.html into your page. Retain
the CompoMotion MIT license when redistributing the code.

Each label activates its checkbox. CSS :checked draws the checkmark, gives the box
a small confirmation pulse and progressively strikes the text. Unchecking reverses
the line/check drawing. Tab and Space work natively; the accessible name and
checked state remain exposed. Reduced motion applies the final state instantly;
forced colors restores the native checkbox and ordinary text decoration.

Duplicate an li to add a task. Edit its text, name and value; no IDs need changing
because each input is wrapped in a label. Put the list inside your own form to
read selected task values with FormData or use a native reset button. The component
does not persist tasks or submit data. Its demo reset belongs to the demo only.

Customize --checklist-accent (#003cff) and --checklist-duration (360ms) on the list.
For multi-line task text, keep the text span inside a wrapping container as shown
in the HTML: the inline background draws across each line fragment. Do not remove
the native input, replace it with a decorative div, or nest links/buttons in its
label. The strike is a visual enhancement; checkbox state carries the semantics.
