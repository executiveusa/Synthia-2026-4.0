# 05_gauntlet — review the report, not the site

One job: check the report is true, ranked right and useful before anyone sees it.

## Inputs
- ../02_audit/output/REPORT.md
- ../02_audit/output/FINDINGS.md
- `_factory/rubric/rubric.yaml` profile `audit`

Do NOT load: the 01_inspect raw files unless a finding is disputed.

## Process
1. Run in a separate session from the one that wrote the report.
2. Run The Extractor on REPORT.md itself. Our own report must pass.
3. Score with the `audit` profile. Any finding without evidence fails the report.
4. Check the top three fixes would actually move the owner's primary action.

## Outputs
- GAUNTLET.md (scores, evidence, pass/fail) → output/

## Human check
Read the top three findings as if you were the business owner. Would you pay to fix them?
