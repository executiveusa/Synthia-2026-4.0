# 01_inspect — capture the site as it really is

One job: collect runtime evidence of the live site before judging anything.

## Inputs
- ../00_lock/output/LOCK.md
- `_factory/canon/SPINE.md` §01_inspect (viewport matrix, wiring classes)

Do NOT load: rubric and anti-slop files (judging comes later).

## Process
1. Screenshot the first screen and the full page at 390 and 1440 CSS px, plus any other matrix widths the site type needs.
2. Extract all visible copy to `copy.txt`.
3. Walk the primary action end to end. Classify it VERIFIED, PARTIAL, BROKEN, STATIC/DEMO, DEAD or UNKNOWN. Never submit a real form with fake data on a live business site; inspect the request instead.
4. Record load behavior, console errors and horizontal overflow per viewport.

## Outputs
- screenshots/ → output/
- copy.txt → output/
- EVIDENCE.md (what was checked, how, at what time) → output/

## Human check
Open three screenshots and confirm they show the live site, not a cached or logged-in variant.
