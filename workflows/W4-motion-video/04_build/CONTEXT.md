# 04_build — render drafts, then the final

One job: build the composition and render drafts before finals.

## Inputs
- ../03_direction/output/*
- ../01_inspect/output/ASSETS.md
- `_factory/video/MOTION_DOCTRINE.md`

Do NOT load: other projects.

## Process
1. Code-rendered: Remotion or HyperFrames project with tokens in one file and the script as data, so text changes don't touch animation code.
2. AI shots: draft at low resolution first; connector clips use extracted neighbor frames.
3. Compose each ordered aspect ratio separately with its own safe areas.
4. Render drafts. No final render until 06_approval.

## Outputs
- project/ (source) → output/
- drafts/ (one per aspect ratio) → output/

## Human check
Watch every draft on a phone with sound off.
