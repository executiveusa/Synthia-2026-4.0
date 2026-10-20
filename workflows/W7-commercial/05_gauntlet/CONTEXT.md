# 05_gauntlet — prove it before anyone pays for finals

One job: independent review of the draft commercial.

## Inputs
- ../04_build/output/drafts/
- ../00_lock/output/LOCK.md
- ../01_inspect/output/CLAIMS.md
- `_factory/rubric/rubric.yaml` profile `commercial`
- `_factory/antislop/registry.yaml`

Do NOT load: the build session's notes (review blind).

## Process
1. Separate session from the builder.
2. Extractor on every on-screen and spoken word (use the caption file).
3. Check every zero-tolerance item in the `commercial` profile against the drafts. Duration, dimensions and audio track checked from the file itself (ffprobe), not from the job status.
4. Optional advisory signal: Higgsfield `virality_predictor` on the draft. It informs; it never passes or fails the work.
5. Score with the `commercial` profile, evidence per category.

## Outputs
- GAUNTLET.md → output/

## Human check
Read the zero-tolerance list against the drafts yourself.
