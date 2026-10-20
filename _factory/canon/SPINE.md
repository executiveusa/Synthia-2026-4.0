# The Spine — one workflow for every Synthia™ offer

Every workflow in `workflows/` is this spine with offer-specific detail added.
Stages are folders. A stage reads its inputs, writes its outputs as plain files,
and stops for a human check where marked. Nothing moves forward until the last
output has been read.

Sources: consolidated from the owner's Website Governor v1, Collins-Level
Protocol v1.1, Landing Page Director v1.0, ICM Awwwards Taste Gauntlet v1.1 and
Mission Mobile Polish v2 (verbatim in `_factory/sources/`). Where they disagreed,
`SOURCES.md` records the decision.

---

## Operating modes

| Mode | Allowed | Requires |
|---|---|---|
| `audit_only` (default) | read, inspect, report | nothing; no changes |
| `remediate_branch` | change source on a named branch | baseline evidence, rollback point, bounded scope |
| `release` | deploy or deliver to the client | gauntlet passed, human approval, exact revision, rollback |

A merge or a deploy request is never proof of a working release.

## Truth labels (use on every status line)

DESIGNED → IMPLEMENTED → TESTED → READY FOR PREVIEW → PREVIEW VERIFIED → PRODUCTION VERIFIED

Evidence ranks, highest first: production runtime test at the exact revision;
preview runtime test; automated or reproducible local test; source inspection;
labelled assumption. Never present a lower rank as a higher one.

---

## 00_lock — what are we doing, for whom, and how will we know

Run the `grill-me` skill. One question at a time, a recommended answer with each,
every answer written to `00_lock/LOCK.md` before the next question.

```text
MODE: greenfield | brownfield
OFFER: W1 | W2 | W3 | W4 | W5 | W6
CLASSIFICATION: SELL | USE | MERGE | PARK | ARCHIVE
OUTCOME: one measurable result
TARGET: primary audience or user
USER SITUATION: trigger and stakes
PRIMARY ACTION: the one thing the deliverable must make easiest
PROOF: evidence the client can actually claim
CONSTRAINTS: what cannot change
PROTECTED ASSETS: approved copy, logos, imagery, data, URLs, legal text
OWNER CONTROL: who owns repo, domain, hosting, data, credentials, rollback
COMMERCIAL VALUE: revenue, leads, donations, applications, retention, learning
PAID SCOPE: what the client paid for, and what is out of scope
```

**Stop** if there is no primary audience, no measurable outcome, no primary action,
unclear ownership, unknown protected assets, or the work duplicates an existing
asset without a reason. Ask; do not invent.

## 01_inspect — establish what is true before changing anything

Brownfield: map routes, components, forms, data paths, analytics, deploy target;
take baseline screenshots at the viewport matrix; build the wiring map for every
form, booking, checkout or live display, and classify each path VERIFIED, PARTIAL,
BROKEN, DUPLICATE, STATIC/DEMO, DEAD, UNSAFE or UNKNOWN. Record a rollback target.

Greenfield: state the risky assumptions and how each will be tested.

Runtime truth beats source-code assumptions. Rendered geometry beats declared CSS.

**Viewport matrix:** 320, 360, 375, 390, 414, 430, 768, 1024, 1440 CSS px;
200% text zoom; reduced motion; keyboard only.

## 02_research — evidence before visual direction

- Visual styles first, then real screens and flows: Refero MCP.
- Motion references: MotionVideo public catalog (prompts, stacks). References only.
  Other creators' videos are never resold or copied.
- Research beyond websites: editorial, architecture, packaging, cinema, title
  sequences, local culture, photography.

Every reference goes in `02_research/LEDGER.md`:

```text
REFERENCE / SOURCE / WHAT IS RELEVANT / WHAT IS NOT / PRINCIPLE TO EXTRACT / COPYING RISK
```

Write a project cliché blacklist starting from `_factory/antislop/registry.yaml`.

## 03_direction — strategy, then three directions, then a human picks

1. Job statement: *When [situation], [audience] needs to [job] because [stakes],
   but [barrier], so they can [outcome].*
2. Positioning: *For [audience], [brand] is the [category] that [distinct value],
   because [evidence]. Unlike [alternative], it [defensible difference].*
   Reject unsupported words (innovative, premium, seamless, world-class, tailored…)
   unless made concrete and proven.
3. Brand behavior: believe / behave / refuse / feel / remember / do / governing idea.
4. Content inventory: KEEP VERBATIM, KEEP AND REPOSITION, REWRITE WITH APPROVAL,
   REPLACE WITH EVIDENCE, REMOVE, MISSING AND REQUIRED.
5. Three directions that differ in idea, grid, type, imagery, pacing and motion:
   one restrained, one expressive, one experimental. All three usable.

**Human check:** the owner or client picks one. Never average the three.

## 04_build — bounded, reversible slices

Build one verified slice before expanding: primary entry → offer → proof →
primary action → confirmation. Each slice has written acceptance criteria, e.g.:

> Given a 390px screen, when the page loads, the offer, audience and primary
> action are understandable without scrolling, nothing overflows horizontally,
> and the CTA is reachable by thumb and keyboard.

Laws that apply during build:
- Content decides structure. Components serve content.
- Mobile is its own composition, not a shrunk desktop.
- Motion must explain, orient, confirm, pace or express the brand. Otherwise cut it.
  No scroll hijacking, no text reveals that delay reading, no essential hover.
  Reduced-motion is a designed experience, not a disabled one.
- Accessibility is product quality: semantics, keyboard, visible focus, contrast in
  every state, labelled and announced form errors, 44px targets.
- Never warp, regenerate or blur an approved photograph for depth.
- No fake proof: no invented testimonials, logos, metrics, prices or live status.

Each slice reports: DECISION / CHANGES / PROOF / RISKS / ROLLBACK / NEXT.

## 05_gauntlet — the end-of-project gate

Run in a **separate session** from the builder. In order:

1. **The Extractor** on all copy and rendered UI text. Zero high-severity signals.
2. **Taste-skill** inspector loop on screenshots at the viewport matrix.
3. **Art of Reduction** pass: remove what did not earn its place.
4. **Council review**, each scored 0–10 with written evidence:
   customer value, Krug usability, creative direction, accessibility, technical,
   sovereignty (ownership, rollback).
5. **Rubric** score with the offer's profile in `_factory/rubric/rubric.yaml`.

A high average never hides a critical failure. Any P0 = fail.

**Krug gate:** the work fails if a representative person would repeatedly ask
*What is this? Who is it for? Where am I? Is this clickable? What happens next?
How do I go back? Did it work?*

## 06_approval — a human approves the exact artifact

Present: the artifact (URL at exact revision, or rendered file), gauntlet
evidence, open risks, rollback. Approval is recorded in `06_approval/APPROVAL.md`
with who, what revision, and when. No approval, no delivery.

## 07_deliver — hand over something the client controls

- Package exactly what was approved.
- Handover notes: what the client can change themselves and how, what needs us,
  the support window. (Client autonomy and handover come from the trust audit.)
- Final report: DECISION / LOCK / BASELINE / FINDINGS / CHANGES / PROOF /
  RISKS / ROLLBACK / NEXT.

## 08_learn — every job makes the next one better

- Case study with before/after evidence. Client permission recorded first.
- New slop patterns found → proposed additions to `_factory/antislop/registry.yaml`.
- Price asked, price paid, hours spent → `sales/pricing-tests.md`.
- What slowed us down → an improvement task.
