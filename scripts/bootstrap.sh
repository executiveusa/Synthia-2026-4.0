#!/usr/bin/env bash
# Clone pinned upstream skills into upstream/<name>. Safe to re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
pin() { # name repo sha
  local dir="upstream/$1"
  if [ ! -d "$dir/.git" ]; then git clone --quiet "https://github.com/$2.git" "$dir"; fi
  git -C "$dir" fetch --quiet origin "$3" 2>/dev/null || git -C "$dir" fetch --quiet origin
  git -C "$dir" -c advice.detachedHead=false checkout --quiet "$3"
  echo "pinned $1 @ ${3:0:7}"
}
pin the-extractor      executiveusa/the-extractor      ea3df3e9e31bad432d2a3e15011d8a3dbccad621
pin taste-skill        Leonxlnx/taste-skill            63aba5f43b5056758b15bbe7d683da8c86a7a7ad
pin refero             referodesign/refero_skill       2382e518f90096df607196b9a635da2d1bc142f9
pin gauntlet-loop      robonuggets/gauntlet-loop       9b1975a1b8f01981f3f1e6b667ad3aaf907178ea
pin pauli-scroll-world executiveusa/pauli-scroll-world 4c34e4a65763aa2dbdf445bfa554d61f93a5e8d4
pin scroll-craft       nateherkai/scroll-craft         75d81f74e83692add18cd7a8a8e078b8a887a579
