# 02_audit — find what costs the owner customers

One job: turn evidence into ranked findings, each with proof and a fix.

## Inputs
- ../01_inspect/output/*
- `_factory/sources/website-trust-audit.md` (7 trust areas)
- `_factory/sources/icm-awwwards-taste-gauntlet-v1.1.md` §9–12 (Krug test, Understand/Believe/Act/Trust, message architecture, anti-slop double check)
- `_factory/antislop/registry.yaml`

Do NOT load: build-stage material, W2–W6 workflows.

## Process
1. Run The Extractor on `copy.txt`. Keep its findings with rule IDs.
2. Krug test on the first screen: can a stranger say what this is, who it is for and what to do next within five seconds? Write the answer you got.
3. Score Understand / Believe / Act / Trust, each with the evidence behind the score.
4. Walk the seven trust areas from the checklist; record only findings backed by a screenshot, quote or measurement.
5. Rank findings P0 (blocks the primary action), P1 (costs trust or conversion), P2 (polish). Each finding: evidence, why it matters to the owner's goal, the fix, rough effort.

## Outputs
- FINDINGS.md → output/
- REPORT.md (owner-facing, plain language, top 3 fixes first) → output/

## Human check
Delete any finding you cannot point to in a screenshot or quote.
