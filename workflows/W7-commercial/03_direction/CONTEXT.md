# 03_direction — script, three treatments, shot list, budget

One job: write the script, propose three treatments and get the budget approved.

## Inputs
- ../00_lock/output/LOCK.md
- ../01_inspect/output/CLAIMS.md
- ../02_research/output/LEDGER.md
- `_factory/video/COMMERCIAL_DOCTRINE.md`

Do NOT load: provider tool docs beyond what the chosen lanes need.

## Process
1. Script with seconds per beat, total ≤ 30 s: hook (0–2 s) → problem or desire → product in action → one proof from CLAIMS.md → action. Spoken words must fit the time (see short-form.md 'Script Word Counts').
2. Three treatments on the same script: restrained, expressive, experimental. One key frame each.
3. Shot list: per shot the lane, model or tool, duration, aspect ratios, and the preflighted credit cost (`get_cost: true`).
4. COSTS.md: draft budget + final budget + variants (if ordered) against the ceiling in LOCK.md.
5. Run The Extractor on the script.

## Outputs
- SCRIPT.md → output/
- TREATMENTS.md → output/
- SHOTS.md → output/
- COSTS.md → output/
- frames/ → output/

## Human check
Owner picks one treatment and approves the budget in COSTS.md. No paid generation before this approval exists.
