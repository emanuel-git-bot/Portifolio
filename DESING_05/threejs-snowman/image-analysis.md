# Image Analysis — reference-snowman.png

Source: rendered screenshot of the site's own `.coder-snowman` component (`DESING_05/styles.css`,
`.coder-snowman*` rules). Because the reference was authored by the same session as this
reconstruction, exact hex/rem values are available as **confirmed material evidence**, not just
visual estimation — noted per-layer as `[source: css]`.

## Layer 1 — Identification & classification

- Work type: **stylized snowman figure** (decorative character prop), built from three stacked
  spheroids with hat, scarf, arms and a simple face.
- Broad classification: furnishing/character prop, not a mechanical or bladed object.
- `primaryDomain`: **object** (a character-*like* prop with a face, but no articulated skeleton,
  hair system, or anatomical proportions — routing through the full `character` track's
  landmark/hair/rig gates would be disproportionate; treated as a component-based object with a
  `head` sub-assembly).
- Confidence: 0.95 (unambiguous subject, own source data available).

## Layer 2 — Overall form & silhouette

- Bounding volume: three vertically stacked spheres of decreasing radius (a "snowman stack"),
  slightly overlapping at the seams, tilted as a whole rigid unit.
- Primitives observed: **sphere** ×3 (body), **cylinder** ×2 (hat top + hat brim, brim wider/flatter),
  **capsule/rounded box** ×1 (scarf band, wrapping the neck seam), thin **box/cuboid** ×2 (stick
  arms), **cone** ×1 (nose), **sphere** ×2 small (eyes) with smaller **sphere** ×2 (pupils).
- Symmetry: bilateral on the body stack and arms; the **face is deliberately asymmetric** — both
  eyes and the nose are shifted toward the proximal-right of the head (not centered), reading as a
  head turned three-quarter rather than facing the camera straight-on.
- Aspect/proportion `[source: css]`: sphere diameters bottom : middle : head ≈ **1.95 : 1.4 : 1**
  (14.8rem : 10.6rem : 7.6rem). Overall figure whole-body height : head-diameter ≈ **3.7 : 1**.
- The whole figure is rotated **−7° off vertical** (a slight lean), not upright.

## Layer 3 — Macro → meso → micro decomposition

- **Macro** (independent major parts): `bodyBottom`, `bodyMiddle`, `head`, `armLeft`, `armRight`,
  `groundShadow`.
- **Meso** (sub-assemblies): `head` carries `hatAssembly` (brim + top), `scarfAssembly` (band +
  hanging tail flap), `faceAssembly`; `bodyMiddle` carries a `buttonRow` (3 coal buttons).
- **Micro** (feature groups): `faceAssembly` → `eyeLeft` (socket + pupil), `eyeRight` (socket +
  pupil), `nose` (cone); `buttonRow` → 3 individual small dark spheres in a vertical line.

## Layer 4 — Spatial relationships (scene-graph)

- `<bodyMiddle, stacked-above, bodyBottom>` — contact type **overlap** (middle sphere's lower
  portion sinks slightly into the bottom sphere's upper portion at the seam, no visible gap).
- `<head, stacked-above, bodyMiddle>` — same overlap contact type, smaller overlap.
- `<hatAssembly, attached-to, head>`, contact **flush-with** the head's crown, brim wider than the
  head's silhouette at that height (brim overhangs on both proximal and distal sides).
- `<scarfAssembly, wraps, head-bodyMiddle-seam>` — embed/overlap contact straddling the neck seam;
  the tail flap hangs from the scarf's distal-right edge, contact **attached-to** scarf band,
  hanging freely (not touching the body).
- `<armLeft/armRight, attached-to, bodyMiddle>` — contact **socket** at a point on the middle
  sphere's upper-lateral surface (not the sphere's exact side-equator — anchored high, near the
  shoulder line, roughly at the middle sphere's upper third). Each arm is a single straight rigid
  segment (no elbow joint), angled outward and slightly downward from that socket, symmetric
  left/right.
- `<eyeLeft/eyeRight/nose, embedded-in, head>` — flush with the head's front surface, all three
  offset toward the same lateral side (proximal-right in the render), not evenly spaced across the
  head's front.
- `<groundShadow, below, bodyBottom>` — a flattened, blurred dark ellipse on the ground plane,
  not a raised part.

## Layer 5 — Materials & surface (PBR)

- **Body spheres** (bottom/middle/head): dielectric, non-metallic. Surface reads **satin-to-matte**
  (soft falloff from a bright highlight to shadow, no sharp specular hotspot) — moderate-high
  roughness, low specular but not fully matte (there IS a visible soft highlight, so roughness is
  not at maximum). No transparency.
- **Hat** (brim + top): dielectric, dark, near-matte — very little highlight visible, roughness high.
- **Scarf** (band + tail): dielectric, saturated mid-tone color, satin finish — a visible soft
  highlight gradient across its curved top edge, roughness lower than the hat but higher than a
  gloss plastic.
- **Buttons / eyes / pupils' dark parts**: near-black, matte-to-satin (eyes show a small inset
  highlight suggesting slight gloss — `box-shadow: inset` catchlight `[source: css]`).
- **Nose**: dielectric, saturated orange, satin, small triangular/conical form.
- **Arms**: dielectric, brown wood-tone, matte-satin, gradient from lighter to darker along the
  length (suggesting a directional material gradient rather than flat color) `[source: css:
  linear-gradient(#8a6238,#6b4a29)]`.
- No metalness anywhere in the piece; no translucency.

## Layer 6 — Color & finish

Colors below are **confirmed from source CSS**, not estimated:

- Body sphere gradient `[source: css]`: radial, highlight stop **#FFFFFF** (pure white) at ~66%/30%
  of each sphere's face (upper-lateral, not centered — matching the light-source direction implied
  by the whole piece), through **#E6EBF1** (very pale blue-gray, ~55%) to **#C3CCD6** (pale
  blue-gray, 100% at the rim) — a cool-white gradient, not a flat white.
- Rim light `[source: css]`: a soft **lavender/purple rim-glow**, `rgba(194,164,255,.6)` ≈ **#C2A4FF**
  at 60% opacity, offset to one lateral edge of each sphere — an environmental/accent light color,
  not part of the base albedo.
- Ambient halo behind the whole figure: soft **purple radial glow** (~`#C2A4FF` → `#7F40FF` fading
  to transparent), visible in the reference as the glow surrounding the figure.
- Hat: near-black, cool dark gray gradient `[source: css: linear-gradient(#2a2d33,#17191c)]` for the
  brim, slightly lighter `linear-gradient(#33363d,#1b1d21)` for the top cylinder — i.e. the crown
  reads marginally lighter/bluer than the brim, both very low value.
- Scarf: horizontal gradient **accent-purple** `[source: css: linear-gradient(180deg, #C2A4FF,
  #7F40FF)]` — lighter lavender at top, deeper violet at bottom.
- Buttons/eye sockets/pupil-dark: **#1A1A1A / #232323** (near-black, not pure #000).
- Pupil highlight dot: **#EAE5EC** (near-white, warm-neutral).
- Nose: **#E8792E** (mid-value saturated orange).
- Arms: gradient **#8A6238 → #6B4A29** (mid-brown to dark umber).
- Ground shadow: soft black radial fading to transparent, flattened (ellipse, not circle).

## Layer 7 — Identity-defining features

These are the features that, if wrong, would make the reconstruction unrecognizable as *this*
snowman rather than a generic snowman — they become `featureReviewTargets`:

1. **Three-tier stacked-sphere body with the specific 1.95:1.4:1 diameter ratio** (not equal-size
   spheres — a common generic-snowman mistake).
2. **Off-center, same-side face** (both eyes + nose shifted toward one lateral side of the head,
   not centered) — this is what reads as "turned/looking to the side" and is a deliberate design
   choice, not noise.
3. **Purple/lavender rim-light + ambient halo** as the piece's signature accent color, distinct from
   any snowman default (no red/green holiday palette here).
4. **Purple scarf with a hanging tail flap** on one side (not a plain solid ring).
5. **Straight rigid stick arms socketed high on the middle sphere**, angled outward-down
   symmetrically, no crossing.
6. **Top hat (brim + cylinder), near-black**, sized to the head diameter with brim overhang.
7. **Whole-figure −7° tilt** (not perfectly upright) — part of the character's "casual lean" pose.

## Layer 8 — Uncertainty & single-image limits

- The reference is a **single 3/4-ish view** (the figure itself is a flat CSS/2.5D construction —
  there is no true "back" geometry to observe; the original was never rendered from another angle).
  Back-of-hat, back-of-scarf-tail, and rear of the body spheres are **undetermined** from the image
  and will be authored as continuations of the same material/gradient rather than invented detail.
- Because the source is itself a 2D box-shadow/gradient illusion of 3D (not a real 3D object
  photographed), there is no ground-truth *depth* — sphere "roundness" in Three.js is a faithful
  reconstruction of the CSS's implied lighting, not a measurement.
- Scarf tail's exact hem thickness/curvature at the back is **occluded** by the body — authored as a
  simple flat-ended box consistent with the visible portion.
- No text/marks/serials — not applicable for this subject.

## Assessment mapping

| Field | Value |
|---|---|
| `objectClass.primaryType` | "stylized snowman figure" |
| `objectClass.primaryDomain` | `object` |
| complexity tier | `moderate` (13+ sub-components, local material overrides, no repetition system beyond L/R arm mirror and 3-button row) |
| geometry strategy | primitive-composition (`SphereGeometry` ×5, `CylinderGeometry` ×2, `BoxGeometry`/`CapsuleGeometry` for arms + scarf, `ConeGeometry` nose) |
| material/lighting recipe | `MeshPhysicalMaterial`, satin dielectrics, one warm-white key + one purple rim/accent light + ambient purple halo (emissive sprite or point light) |
| chirality | armLeft/armRight is a true mirror pair (`(x,y,z)→(-x,y,z)`), socketed and angled symmetrically |
