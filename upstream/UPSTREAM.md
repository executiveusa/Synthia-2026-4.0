# Upstream skills and tools

Pinned to the commit retrieved on 2026-10-20. `scripts/bootstrap.sh` clones each
into `upstream/<name>` at that commit. `upstream/*/` is git-ignored: we pin, we
don't copy. To update, change the SHA here and in the script, read the upstream
diff, and record why in the PR.

| Name | Repo | Pinned commit | License | Used in |
|---|---|---|---|---|
| the-extractor | executiveusa/the-extractor | `ea3df3e9e31bad432d2a3e15011d8a3dbccad621` | MIT | every 05_gauntlet (machine anti-slop check) |
| taste-skill | Leonxlnx/taste-skill | `63aba5f43b5056758b15bbe7d683da8c86a7a7ad` | MIT | 02_research, 05_gauntlet (screenshot inspector loop) |
| refero | referodesign/refero_skill | `2382e518f90096df607196b9a635da2d1bc142f9` | MIT | 02_research (styles, screens, flows; MCP needs Refero OAuth) |
| gauntlet-loop | robonuggets/gauntlet-loop | `9b1975a1b8f01981f3f1e6b667ad3aaf907178ea` | CC BY 4.0 — credit Matt Shumer / robonuggets | quality-bar prompts for builds |
| pauli-scroll-world | executiveusa/pauli-scroll-world | `4c34e4a65763aa2dbdf445bfa554d61f93a5e8d4` | see repo | W3 scroll-world sites, W6 audience engine |
| scroll-craft | nateherkai/scroll-craft | `75d81f74e83692add18cd7a8a8e078b8a887a579` | MIT | W3 (also a submodule of pauli-scroll-world) |
| pauli-montage-video-agent | executiveusa/pauli-montage-video-agent | `cc13dfcba9e20995073d47c7108a69a5ba58af31` | **AGPLv3** — run its tools as a separate program; never copy its code into this repo | W7 assembly, reframe, captions, Remotion composer, short-form specs |
| buffer-blaster- | executiveusa/buffer-blaster- | `df1327feffe8b6c439820794726a584cdbfc351c` | no LICENSE file (owner's private repo) | W7 UGC + Higgsfield prompt playbooks, governed generation and publishing |

## Vendored in `skills/` (small, owner-made or MIT, kept in this repo)

| Skill | Origin | License |
|---|---|---|
| art-of-reduction v1.0.0 | owner package `art-of-reduction-global-v1_0_0.zip` | MIT |
| grill-me | owner upload (`marketing_ai_team_skill.md`) | owner |
| icm-architect | `icm-architect-main.zip`, Jake Van Clief | MIT |

## Data sources (not code)

| Source | What we use | Terms |
|---|---|---|
| MotionVideo `https://motionvideo.xyz/api/catalog/` | public JSON of gallery videos: prompt, model, stack, media URLs (247 items on 2026-10-20) | documented for agents in their `llms.txt`; their terms forbid scraping and `/dashboard` is login-only. Read the public catalog, cache it, low rate. Bookmarks come in as a list you export by hand. Videos are other creators' work: references only. |
| Refero MCP `https://api.refero.design/mcp` | visual styles, real screens, user flows | OAuth sign-in; account terms apply |

## Notes on the video repos (checked 2026-10-20)

- `buffer-blaster-/skills/ugc-video/SKILL.md` credits `sirioberati/Seedance-2.0-AI-UGC`, which has
  **no license file**. Read the skill in place for technique; do not copy its text into this repo.
- `buffer-blaster-/skills/higgsfield/` is O-Side Media's Higgsfield prompt skill, MIT.
- `pauli-montage-video-agent` reverted a MotionVideo CLI (commit `cc13dfc`) because it matched the
  licensed MotionVideo pack, which may not be published. Never vendor the paid pack's contents anywhere.
- `pauli-montage-video-agent/tools/video/higgsfield_payperuse.py` calls fal.ai, not the Higgsfield MCP.

## MCP servers (`.mcp.json`)

| Name | Endpoint | Used for |
|---|---|---|
| refero | `https://api.refero.design/mcp` | design research (OAuth) |
| synthia | `node mcp/server.js` | this repo's catalog, project and gauntlet tools |
| higgsfield | `https://mcp.higgsfield.ai/mcp` | UGC, video, image, audio, Ads Studio, montage, variants (account sign-in; spends credits) |
