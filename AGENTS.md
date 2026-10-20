# SYNTHIA™ 4.0 — Design Studio Router

Where you are: the in-house design plugin of The Pauli Effect. It builds websites
(including 3D scroll-world sites), code-rendered motion videos and design audits,
and sells them as fixed offers. This file routes. It holds no doctrine.

## Read in this order, and only what the task needs
1. `EMERALD_TABLETS™/` — governance. Truth over approval. Always applies.
2. `HEART_AND_SOUL.md` — one-page design doctrine and decision order.
3. `_factory/canon/SPINE.md` — the one workflow spine every offer follows.
4. The workflow folder for the job (below). Load its `CONTEXT.md`, then the
   current stage's `CONTEXT.md`. Do not load other workflows.

## Task → workflow
| Task | Go to |
|---|---|
| Audit a site for trust, clarity, slop | `workflows/W1-trust-audit/` |
| Launch, feature or promo video rendered from code | `workflows/W4-motion-video/` |
| Landing page build or rebuild | `workflows/W2-landing-page/` (planned) |
| 3D scroll-through world site | `workflows/W3-scroll-world-3d/` (planned) |
| Mobile fix pass on an existing site | `workflows/W5-mobile-polish/` (planned) |
| Social commercial up to 30 s (UGC, product, motion) | `workflows/W7-commercial/` |
| Monthly social motion batch | `workflows/W6-motion-retainer/` (planned) |
| Prospect outreach | `sales/outreach/` |
| New client run | copy a workflow into `projects/<client>-<workflow>/` |

## Reference shelves (load a file only when a stage contract names it)
- `_factory/rubric/` — scoring profiles and release gates
- `_factory/antislop/` — banned patterns and the end-of-project gate
- `_factory/video/` — motion and AI-video doctrine
- `_factory/sources/` — the owner's original protocols, verbatim
- `_factory/knowledge/` — distilled book knowledge (in progress)
- `_factory/learn/STRUCTURE_LOG.md` — structures already shipped; read at 03_direction to avoid repeats
- `upstream/UPSTREAM.md` — external skills and pinned versions

## External production repos (call only when a stage contract names them)
- `upstream/pauli-montage-video-agent/` — assembly, reframe, captions, Remotion composer, short-form specs. AGPLv3: run its tools, never copy its code here.
- `upstream/buffer-blaster-/` — UGC and Higgsfield prompt playbooks, governed paid generation and publishing. Read in place.
- Higgsfield MCP (`higgsfield` in `.mcp.json`) — UGC, video, Ads Studio, montage, variants. Load its workflow with `get_workflow_instructions` before generating.

## CLI and MCP
- `cli/synthia.js` wraps `lib/`: motion catalog search/get/import, `new`, `status`, `gauntlet`, `video check` (ffprobe-verified video checks; W7 gauntlet checks `04_build` drafts, max 30 s).
- `mcp/server.js` (stdio, `synthia` in `.mcp.json`) exposes the same seven tools (incl. `video_check`).
- Run `npm install` once; `node --test tests/` is part of `scripts/check.sh`.

## Hard rules
- Nothing ships until `05_gauntlet` passes and a human approves at `06_approval`.
- The builder never approves its own work. Review runs in a separate session.
- Truth labels from the canon (DESIGNED … PRODUCTION VERIFIED) on every status.
- Secrets never enter this repo.
