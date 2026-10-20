# Commercial doctrine — social commercials up to 30 seconds

Used by `workflows/W7-commercial/`. Read with `MOTION_DOCTRINE.md`; this file adds
what is specific to paid and organic social ads.

## Hard limits

- **30 seconds maximum**, every cut, every aspect ratio. 6, 15 and 30 s are the default lengths.
- **One message, one action.** The message lands in the first 2 seconds with sound off.
- **Captions on every spoken word.** Burned in for social; an `.srt` is delivered too.
- **Text stays inside the platform safe zone.** Use the per-platform table in
  `upstream/pauli-montage-video-agent/skills/creative/short-form.md` ("Platform Safe Zones").
  Nothing important in the bottom UI band.

## Truth rules (zero tolerance)

- Claims on screen or in voiceover come only from the 01_inspect allowlist (PROVEN).
- **No fabricated endorsements.** A generated person never says or implies they bought,
  used or got results from the product. Generated creators *demonstrate*; they do not
  *testify*. No fake reviews, star ratings, customer counts or before/after results.
  Higgsfield's own `ugc-video` workflow excludes testimonials and impersonation for the
  same reason; advertising law in most markets treats fake endorsements as deceptive.
- **No real person's likeness or voice** without written consent on file.
- **AI disclosure:** record in the lock which parts are AI-generated. Use each
  platform's AI-content label when publishing (e.g. TikTok's AIGC flag in
  `tiktok_prepare_publish`). The client decides; we never hide it.

## Lanes — pick per shot, record the choice in the shot list

| Lane | Use for | Tool (exact names) | Prompt craft from |
|---|---|---|---|
| **A. Code-rendered** | product UI, kinetic type, price/offer cards, end cards, logo lockups | Remotion in this repo (W4 stages), or `upstream/pauli-montage-video-agent/remotion-composer/` | `MOTION_DOCTRINE.md`, MotionVideo catalog |
| **B. UGC creator** | review, unboxing, try-on, tutorial, website tour, product-only voiceover | Higgsfield MCP workflow `ugc-video` (load with `get_workflow_instructions`) | `upstream/buffer-blaster-/skills/ugc-video/SKILL.md` (niche playbooks; read in place, do not copy — see UPSTREAM.md) |
| **C. Cinematic product** | hero product shots, lifestyle scenes, b-roll | Higgsfield `generate_video` (`marketing_studio_video` for products/ads, `seedance_2_5` general, `kling3_0` multi-shot/audio) | `upstream/buffer-blaster-/skills/higgsfield/` (MCSLA: Model · Camera · Subject · Look · Action) |
| **D. Static ad set** | feed images with copy to run beside the video | Higgsfield Ads Studio (`ads-studio` workflow, `ads_studio_*` tools) | Ads Studio brand research |
| **E. Assembly & finishing** | cut, music, captions, reframe | Higgsfield `video-montage` workflow, or `upstream/pauli-montage-video-agent/tools/video/` (`auto_reframe.py`, `remotion_caption_burn.py`) | `short-form.md` (pacing, hooks, safe zones) |
| **F. Variants** | new market, language, cast or product from an approved cut (4–30 s source) | Higgsfield `ad-multiplier` workflow; `dubbing` for language only | — |

Default: **A + E** for software and services; **B or C + A end card + E** for physical products.

Note: `pauli-montage-video-agent/tools/video/higgsfield_payperuse.py` calls **fal.ai**
(`FAL_KEY`), not the Higgsfield MCP, despite the name. Its costs are fal costs.

## Spend rules

1. Every paid call is preflighted: `get_cost: true` (generate_*), `ads_studio_quote`, `shorts_studio_create` with `get_cost`.
2. The total credit budget is approved by the owner at `03_direction` and written to `COSTS.md`.
3. Agents spend inside the approved budget only. Next call would exceed it → stop and ask.
4. Drafts first (lowest resolution/duration the model allows), finals only after `06_approval`.
5. A timeout is not a failure: check the existing job before resubmitting. Never resubmit a whole batch for one failed item.
6. `use_unlim` / free generations only when the owner explicitly says so.
7. Every paid job ID, model, credits and result goes in `COSTS.md`.
