# Synthia™ 2026 4.0

The Pauli Effect's in-house design plugin for Claude Code and Codex.

It turns a client request into a finished, reviewed deliverable through fixed
workflows: site audits, landing pages, 3D scroll-world sites and code-rendered
motion videos. Every workflow ends at the same gate: the anti-slop audit, the
rubric, and a human approval.

## Status

| Part | State |
|---|---|
| Router, doctrine, canon spine | DESIGNED |
| W1 trust audit workflow | DESIGNED |
| W4 motion video workflow | DESIGNED |
| W2, W3, W5, W6 workflows | planned |
| MCP server and CLI | IMPLEMENTED + TESTED (`node --test`) |
| Book knowledge distillation | planned |

"DESIGNED" means the contracts are written. No workflow has run on a client yet.

## Install (local)

```bash
git clone https://github.com/executiveusa/Synthia-2026-4.0.git
cd Synthia-2026-4.0
bash scripts/bootstrap.sh   # clones pinned upstream skills into upstream/
bash scripts/check.sh       # validates manifests, runs the anti-slop audit and the node test suite
```

## CLI and MCP server

```bash
npm install
node cli/synthia.js motion search "kinetic type" --limit 5
node cli/synthia.js motion get <slug>
node cli/synthia.js motion import bookmarks.txt --project projects/<client>-W4
node cli/synthia.js new W1 <client-slug>
node cli/synthia.js status projects/<client>-W1
node cli/synthia.js gauntlet projects/<client>-W1
```

The same six tools are exposed over MCP stdio (`mcp/server.js`, registered as
`synthia` in `.mcp.json`). The MotionVideo catalog is cached for 24h in
`.cache/`; `--refresh` forces one refetch.

Claude Code: `/plugin marketplace add ./` then `/plugin install synthia@synthia`.
Codex: `codex plugin marketplace add ./` then `codex plugin add synthia@synthia`.

Start at `AGENTS.md`.
