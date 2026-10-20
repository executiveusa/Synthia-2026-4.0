#!/usr/bin/env python3
"""Structural checks only. Editorial and rendered approval remain human tasks."""
from pathlib import Path
import re
p = Path(__file__).resolve().parents[1]
skill = (p / "SKILL.md").read_text()
sources = (p / "references" / "SOURCES.md").read_text()
example = (p / "tests" / "ubuntu-example.md").read_text()
assert skill.startswith("---\nname: art-of-reduction\n")
assert all(f"R{i} —" in skill for i in range(5))
assert all(term in skill for term in ["origin unknown", "REWRITE WITH APPROVAL", "accessibility", "Ponytail", "Humanizer"])
assert all(name in sources for name in ["i-have-adhd", "blader/humanizer", "hardikpandya/stop-slop", "DietrichGebert/ponytail"])
assert "I also looked at the systems I could see publicly." in example
assert "not an approved replacement" in example
print("PASS: skill structure, source routing, provenance and approval checks")
print("Editorial outcome: proposed, not independently validated")
