---
name: synthia
description: Synthia™ in-house design studio. Use when building, rebuilding or auditing a website or landing page, building a 3D scroll-through world site, making a launch, feature or promo motion video rendered from code, doing a mobile fix pass, or running the end-of-project anti-slop review. Routes the job to a fixed workflow (lock, inspect, research, direction, build, gauntlet, approval, deliver, learn) and blocks delivery until the anti-slop audit, the rubric and a human approval pass.
---

# Synthia™ studio

1. Read `AGENTS.md` at the repo root and pick the workflow for the task.
2. For a client job, copy the workflow folder to `projects/<client>-<workflow>/`
   and work inside the copy.
3. Run stages in order. In each stage read only its `CONTEXT.md` and the inputs it
   lists. Write outputs to that stage's `output/` folder.
4. Stop at every human check. Stop at `06_approval` until approval is recorded.
5. `05_gauntlet` runs in a separate session from the builder, starting with
   The Extractor (`upstream/the-extractor`). Run `scripts/bootstrap.sh` first if
   `upstream/` is empty.

Governance: `EMERALD_TABLETS™/`. Doctrine: `HEART_AND_SOUL.md`. Spine: `_factory/canon/SPINE.md`.
