# Mobile verification note (no pixel screenshot available)

This session's headless Chrome CLI (`chrome --headless --screenshot`) has a confirmed
rendering quirk at narrow window widths: it lays out the page using desktop viewport
metrics regardless of `--window-size`, `--headless=new`, mobile user-agent spoofing, or
virtual-time-budget — producing a screenshot that shows unwrapped/clipped text at the
right edge. This was cross-checked five different ways (different headless modes, cache
busting, mobile UA, short and tall windows) and produced byte-identical or near-identical
output every time, confirming it is a fixed tooling artifact, not a function of page state.

The interactive browser tool's real rendering engine (mcp__Claude_Browser, which does
correctly emulate a 375px mobile viewport) was used instead to verify mobile layout
directly against the DOM:

- `window.innerWidth`: 375, `document.documentElement.scrollWidth`: 375 — no horizontal
  overflow anywhere on the page.
- A full sweep of every element's `getBoundingClientRect().right` against the viewport
  width found zero offenders (previously found and fixed: see below).
- The hero `<h1>` ("Sistema de Tramitação Legislativa") wraps correctly to two lines,
  right edge at 355px, well inside the 375px viewport.
- Mobile nav toggle opens/closes the `.gate-nav` panel correctly (verified by class
  toggling and `aria-expanded` state).

## Real bug found and fixed during this check

The first mobile pass *did* find a genuine defect: `.board-row`'s CSS grid content
column had no `min-width: 0`, so long paragraph/heading text inside it was not wrapping
and instead grew the grid track past the viewport (classic CSS grid "blowout": a `1fr`
track's implicit minimum is `auto`/content-size unless overridden). Fixed in
`styles.css` by adding `.board-row > div { min-width: 0; }` and `min-width: 0; flex: 1 1
auto;` on `.board-row__title`. Re-verified via the interactive tool after the fix:
overflow gone, confirmed by the scrollWidth/offender sweep above.
