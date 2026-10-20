# Motion doctrine

Two production lanes. Pick one per shot; never blur them without saying so.

| Lane | Use for | Stack | Strength | Weakness |
|---|---|---|---|---|
| **Code-rendered** | product UI, kinetic type, charts, diagrams, logo reveals, launch and feature videos | Remotion, HyperFrames, HTML + Playwright, Three.js | exact brand fonts and colors, editable source, re-render any aspect ratio, text always crisp | no photoreal people or places |
| **AI-generated** | photoreal scenes, people, places, cinematic B-roll, scroll-world flights | fal.ai (Seedance, Kling, Veo, LTX) | footage nobody filmed | text renders badly, cost per attempt, drift between shots |

Default for W4 is **code-rendered**. Add AI-generated shots only where a real
scene does work that type and UI cannot.

## Laws (both lanes)

1. One message per piece. It must land with sound off within the first 3 seconds.
2. Every move explains, orients, confirms, paces or expresses the brand. Otherwise cut it.
3. One motion language per piece: one easing family, one timing range.
4. Text is readable at phone size in the smallest ordered format.
5. No invented claims, metrics, logos or testimonials on screen.
6. Every ordered aspect ratio is composed, not cropped: 16:9, 9:16 and 1:1 each
   get their own safe areas and type sizes.
7. Music, fonts and footage are licensed for the client's use. Record each license.

## Code-rendered lane

- One project, one source of truth for tokens (fonts, colors, spacing), shared
  with the client's site where one exists.
- Compositions are parameterized: headline, product screens, CTA, colors.
  A request for one video becomes a template that can render the next ten.
- Deliver the editable source with the render when the order includes it.
- References: MotionVideo public catalog (`/api/catalog/`). Search by stack and
  content tag; study the prompt and the timing; never copy the piece.

## AI-generated lane

Cost discipline (owner rules, non-negotiable):
- A draft pass at low resolution before any final render. Never skip it.
- Draft → owner approval → final render.
- Connector clips between scenes start and end on frames extracted from the
  neighboring rendered clips, never the original stills. This prevents visible pops.

Prompt structure, in this order:

1. **Scene** — one sentence: what happens, where, the mood.
2. **Camera** — where it starts, how it moves, where it ends. One move per shot.
3. **Characters** — age range, look, emotion, one small action each. Light detail;
   over-described faces break.
4. **Environment** — only what matters: time of day, place, weather if it matters.
5. **Lighting and style** — pick one style. Stacking styles confuses every model.
6. **Motion tone** — slow and elegant, fast and intense, stable, handheld, drone.

Avoid: adjective piles, conflicting moods, several camera moves in one shot, and
actions that need hard cuts. These models do continuous motion; edit cuts in post.

*(Structure distilled from a community prompting guide for Kling, Veo and LTX;
authorship unverified, so the text is not reproduced.)*
