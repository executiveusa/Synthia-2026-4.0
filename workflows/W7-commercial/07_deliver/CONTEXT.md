# 07_deliver — finals, variants, handover

One job: render finals and hand over files the client controls.

## Inputs
- ../06_approval/output/APPROVAL.md
- ../04_build/output/
- ../01_inspect/output/LICENSES.md

Do NOT load: unapproved drafts.

## Process
1. Final render for every ordered aspect ratio; verify duration ≤ 30 s and dimensions with ffprobe.
2. If ordered: variants with Higgsfield `ad-multiplier` or `dubbing`, each with its own preflight and approval.
3. Package: finals, `.srt` captions, licenses, AI-disclosure note, editable source if in scope, a short note on what the client can change.
4. Publishing only if ordered, only to the client's own account, only after they approve the exact file and caption (Higgsfield `tiktok_prepare_publish` opens a review form; Buffer Blaster has its own approval gates).

## Outputs
- delivered/ → output/

## Human check
Play each final once, start to end, on a phone.
