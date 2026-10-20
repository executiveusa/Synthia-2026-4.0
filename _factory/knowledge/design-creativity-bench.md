# Design Creativity Bench — what it teaches us about slop

**Source:** Rusia, Bhole, Gupta, Dey. *Design Creativity Bench: Measuring creativity in
LLM-Generated UI.* Kombai Inc. Preprint, arXiv:2610.11539v2, 14 Oct 2026.
https://kombai.com/papers/design-creativity-bench.pdf

**Read with care:** the authors work at Kombai, which sells AI UI-design products (stated in the
paper's competing-interests note). It is a preprint. It measures desktop web UI screens
(1280×720), generated in a fresh context, at default temperature, with no creativity prompting.
Everything below marked *(our extension)* is our inference for video and commercials; the paper
did not test it.

## What they measured

| Measure | Meaning | Models (pooled) | Human reference |
|---|---|---|---|
| Originality | how different two models' designs are for the **same** brief | 0.592 | 0.764 (human vs model) |
| Creative range | how much **one** model's design changes when the domain and content change but the goal stays | 0.581 | 0.902 |
| Appropriateness | share of the brief's yes/no criteria met | every model above 90%; best 99.2% | 98.0% |

Scale: distinctiveness 1 − similarity, 0 to 1, higher means more different (paper §2, §3, Tables 2–4).

For our own builders: Claude Opus 5.5 scored highest on appropriateness (99.2%) but 13th of 15
on originality (0.557) and 11th of 15 on creative range (0.574) (Tables 2–4). **Our agents do the
brief correctly and repeat themselves.** That is the slop we have to design against.

## Principles

### 1. Correct is not the same as distinct
**Why:** every model met more than 90% of the brief's criteria while producing designs far more
alike than human designs (§3). **In our work:** passing the Krug gate and the rubric does not
prove the work isn't generic. Distinctiveness needs its own check. **Source:** abstract, §3, §5.

### 2. Changing the client does not change the agent's design
**Why:** when the goal stayed the same and only the product domain and content changed, model
designs stayed close (0.581) while human designs moved a lot (0.902). Two *unrelated* tasks from
the same model scored 0.811, so the sameness is not because the briefs were similar (§3, Fig. 4b).
**In our work:** the studio's biggest sameness risk is across clients: a dentist and a bakery
getting the same landing page with different photos. We check new directions against our own
past projects (see `_factory/learn/STRUCTURE_LOG.md`). **Source:** §3, Table 3, Fig. 4b.

### 3. A new design is a new structure, not a new skin
**Why:** the paper treats palette, copy, icons, spacing, type scale and viewport changes as edits
that do *not* make a design different, and treats deleting, duplicating or reordering parts,
changing layout direction and re-nesting the hierarchy as edits that *do* (§2.1, App. B2). Colour
gets only 10% of their final similarity score; information architecture gets 90% (App. B4).
**In our work:** three directions that differ only in colour, font or copy are one direction.
Directions must differ in structure. **Source:** §2.1, App. B2, App. B4.

### 4. A brief leaves many good structures open
**Why:** for one sample admin-screen brief they enumerated 51 defensible structures across five
open questions: how the screen is divided, which object organises it, what the user sees before
acting, how detail is revealed, and how an edit is committed (App. A1). Their probability weights
for those structures came from an LLM, not from real designers, so treat the spread as
illustrative. **In our work:** before picking a direction, list the open structural questions for
the brief and their options. That list is the design space; the default is only one point in it.
**Source:** App. A1.

### 5. "Be creative" prompts are not the fix
**Why:** the paper cites prior work in which paraphrasing, creativity system prompts, temperature
and sampling changes had limited effect on diversity (§1). The authors did not test such
prompting themselves (§4, Limitations). Re-running the identical prompt gave the least distinct
pairs of all (0.527, Fig. 4b). **In our work:** never get three directions by asking three times.
Assign each direction a different answer to the structural questions, then build. **Source:** §1, §4, Fig. 4b.

### 6. Humans got their range from references
**Why:** the human designers worked from public inspiration libraries (Behance, Kombai Gallery),
adapting references to the brief (§3). **In our work:** this matches our research-first stage.
02_research references are where structural alternatives come from, which is why Refero and the
reference ledger come before direction. **Source:** §3.

### 7. The common correctness failures
**Why:** the most frequent appropriateness failures were a missing control for a workflow the
brief names (33% of failures) and sample data whose counts and totals do not add up (26%) (§3).
Their criteria were written as yes/no statements, some tagged critical, including "any value
shown more than once is the same everywhere" (App. C). **In our work:** these become gauntlet
checks (`_factory/antislop/registry.yaml`, `sameness_and_correctness`). **Source:** §3, App. C.

### 8. An AI judge is good at "which pair is more alike", unreliable as a single score
**Why:** the best LLM judge agreed with humans most often when picking the more similar of two
pairs, but its single similarity score did not move consistently under graded edits; their
embedding metric did (App. B5, B6). **In our work:** an agent may *compare* our directions
against past projects as advice for the reviewer. It never gates delivery with a single
similarity number. Gates stay deterministic or human. **Source:** App. B5, B6, Fig. 9.

### 9. *(our extension)* The same failure exists in video
The paper tested web UI only. We apply the same rule to W4 and W7: three treatments must differ in
structure (shot order and story logic, hook device, camera grammar, where the product enters),
not only in music, colour grade or font. A treatment that is the same cut with a new palette
counts as the same treatment.
