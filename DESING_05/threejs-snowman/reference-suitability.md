# Reference Suitability Verdict — reference-snowman.png

**Verdict: PASS**

- One obvious target object (the snowman figure), no competing subjects in frame.
- Object occupies a large, well-composed portion of the frame (~65% of vertical extent).
- Strong, unambiguous silhouette: three stacked spheres + hat + scarf + arms, clean edges against
  a dark background.
- Major materials are visible and distinguishable: body (satin cool-white gradient), hat (matte
  near-black), scarf (satin purple gradient), arms (satin brown gradient), nose (satin orange),
  eyes/buttons (near-black, small gloss highlight).
- Hidden side (rear) can be reasonably inferred: the form is a simple, near-bilaterally-symmetric
  stacked-primitive body; the rear is authored as a continuation of the same gradient/material,
  not invented new geometry.
- Target is fully approximable with procedural primitives (spheres, cylinders, cones, boxes) — no
  organic/liquid/hair/glass surface that would block reconstruction.
- Not a character/humanoid subject in form language (no limbs beyond simple stick arms, no
  anatomy, no hair) — stays on the standard `object` track per `validation_rubric.md`'s
  Character/Human Suitability section (a face alone does not force the character route).

No "ask for better input" items apply — the single view is sufficient for this subject's actual
complexity, and back-of-object uncertainty is already logged in `image-analysis.md` Layer 8.
