#!/usr/bin/env bash
# Repo self-check. Fails on the first broken rule.
set -euo pipefail
cd "$(dirname "$0")/.."
fail() { echo "FAIL: $*"; exit 1; }

for f in .claude-plugin/plugin.json .claude-plugin/marketplace.json .codex-plugin/plugin.json .mcp.json; do
  python3 -m json.tool "$f" >/dev/null || fail "invalid JSON $f"
done
python3 - <<'PY' || exit 1
import yaml, sys
r = yaml.safe_load(open('_factory/rubric/rubric.yaml'))
for name, p in r['profiles'].items():
    s = round(sum(p['weights'].values()), 6)
    if s != 1.0: sys.exit(f"FAIL: rubric profile {name} weights sum to {s}")
yaml.safe_load(open('_factory/antislop/registry.yaml'))
print("rubric + registry ok")
PY

lines=$(wc -l < AGENTS.md); [ "$lines" -le 60 ] || fail "AGENTS.md is $lines lines (max 60)"

for wf in workflows/W*/; do
  [ -f "$wf/CONTEXT.md" ] || [ -f "$wf/README.md" ] || fail "$wf has no CONTEXT.md or README.md"
  for st in "$wf"[0-9][0-9]_*/; do
    [ -d "$st" ] || continue
    [ -f "$st/CONTEXT.md" ] || fail "$st has no CONTEXT.md"
  done
done
echo "workflow contracts ok"

EX=upstream/the-extractor/extractor.mjs
if [ -f "$EX" ]; then
  for f in README.md HEART_AND_SOUL.md sales/gigs/*.md; do
    out=$(node "$EX" audit "$f" --format json)
    high=$(printf '%s' "$out" | python3 -c "import json,sys;d=json.load(sys.stdin);print(sum(1 for x in d.get('findings',[]) if x.get('severity')=='high'))")
    [ "$high" = "0" ] || { printf '%s\n' "$out"; fail "Extractor: $high high-severity finding(s) in $f"; }
    echo "extractor ok: $f"
  done
else
  echo "SKIP extractor: run scripts/bootstrap.sh first"
fi
if [ -f package.json ]; then
  [ -d node_modules ] || npm ci --silent
  node --test tests/*.test.js || fail "node test suite"
  echo "node tests ok"
fi
echo "ALL CHECKS PASSED"
