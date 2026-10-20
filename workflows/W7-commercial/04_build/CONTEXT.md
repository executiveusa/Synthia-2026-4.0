# 04_build — drafts per lane, then assembly

One job: make every shot as a draft and cut the draft commercial.

## Inputs
- ../03_direction/output/*
- ../01_inspect/output/ASSETS.md
- `_factory/video/COMMERCIAL_DOCTRINE.md` (lanes, spend rules)
- Only the upstream skill files the chosen lanes name

Do NOT load: lanes not in SHOTS.md.

## Process
1. Lane A: Remotion composition with tokens in one file and the script as data.
2. Lane B: load Higgsfield `ugc-video` with `get_workflow_instructions`; follow its format profile and its own safety gates. Write prompts with the buffer-blaster UGC playbook for the niche.
3. Lane C: Higgsfield `generate_video` with the model from SHOTS.md; check durations with `models_explore` first. MCSLA prompt structure.
4. Every paid call: preflight, stay inside COSTS.md, log job ID and credits. Drafts at the cheapest allowed setting.
5. Assemble with Higgsfield `video-montage` or the montage repo tools: music, burned captions, end card, each ordered aspect ratio composed for its safe zone.
6. Run `synthia gauntlet` on all text outputs before handing to 05.

## Outputs
- clips/ (job IDs and URLs) → output/
- drafts/ (one per aspect ratio) → output/
- COSTS.md (updated) → output/

## Human check
Watch every draft on a phone with sound off. Does the message land by second 2?
