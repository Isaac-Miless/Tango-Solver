# 0003 - Multi-mode app roadmap (Solver / Learn / Unlimited)

Status: Draft — not to be implemented yet; this is a shape-of-the-work
proposal, to be broken into its own `/plan` per phase before any code changes.
Date: 2026-09-16

## Context

The app today is a single-purpose tool: the user hand-enters a starting
position (values + `=`/`×` constraints) and asks the deductive solver to
solve it, all/step-by-step. The user wants to grow this into three distinct
experiences:

1. **Solver** — what exists today: give the app a starting state, it solves
   it and explains why.
2. **Learn** — browse the individual solving patterns/rules, then optionally
   drill them under a timer (e.g. 30 seconds, see how many pattern-recognition
   challenges you can get right).
3. **Unlimited** — the app hands the player a fresh, valid, generated puzzle
   and they solve it themselves (no auto-solve assist), repeatable
   indefinitely.

The user was explicit: don't implement this now, and keep future commits
atomic rather than one large change. This plan exists to size the work and
propose how to split it, not to build it.

## Goals

- A clear picture of what's genuinely new work (there is no puzzle generator
  or pattern-bank/timer concept in the codebase today) versus what's a
  reframe of existing code.
- A phase breakdown small enough that each phase is a reasonable single
  `/plan` → `/implement` → review cycle on its own.
- Explicit dependencies between phases so they get tackled in an order that
  doesn't require rework.

## Non-goals (for this document)

- Writing any implementation code, component structure, or file layout in
  detail — that's for each phase's own plan, once picked up.
- Deciding routing technology (e.g. whether mode switching needs URLs/
  `react-router` or can stay client-side state) — flagged as an open question
  for Phase 1's own plan, not decided here.
- Deciding exact scoring/timer UX details for Learn mode — flagged as open
  questions for Phase 4/5's own plans.

## Approach: five phases, each its own future plan

**Phase A — App shell / mode navigation** *(depends on nothing)*
Introduce a way to switch between three top-level views (Solver / Learn /
Unlimited) from `App.jsx` — most likely simple local state and three
components, not a router, unless Phase A's own plan decides shareable URLs
are worth the dependency. Reframe the existing `GameBoard` as the "Solver"
view (functionally unchanged). Extract anything genuinely reusable across
future modes (grid rendering, `Cell` usage, win detection) out of
`GameBoard.jsx`'s ~500 lines so Unlimited mode doesn't have to duplicate it.
Learn and Unlimited can start as stubs. This is the safe, low-risk first cut.

**Phase B — Puzzle generator** *(depends on [plan 0002](0002-fix-unsound-solver-rules.md) being merged)*
No code in this repo currently generates a puzzle — every board is hand-built
by the user. New module (e.g. `frontend/src/utils/generator.js`):
- Build a random, fully-filled, rule-valid 6×6 grid (this is the one place
  randomized backtracking is appropriate — it's building an *answer*, not
  pretending to be the deductive solver).
- Remove cells/reveal a subset of constraints to form a starting position,
  then verify with `solvePuzzleStepByStep`/`isComplete` that the *existing
  pure-deduction solver* can fully resolve it back to that solution with zero
  guessing — so every generated puzzle is honestly solvable, not just
  "probably." This is precisely why Phase B must come after 0002: it bakes in
  a correctness assumption about the solver that isn't safe to make while
  rules 8/9/10 are still unsound.
- Needs its own tests: every generated puzzle round-trips through
  `validateStartingPosition` and `solvePuzzleStepByStep` to a complete,
  `checkWin`-true grid.

**Phase C — Unlimited mode UI** *(depends on A, B)*
Consumes the generator to hand the player a fresh puzzle; player solves it
by clicking cells (reusing existing `Cell`/grid-rendering pieces from Phase
A), `checkWin` reused as-is for completion, a "New Puzzle" button calls the
generator again. Purely additive UI work once A and B exist.

**Phase D — Learn mode: pattern bank** *(depends on A; benefits from 0002 so
rule names/count are final — currently 9 rules after the 0002 fix)*
A small data module of canonical mini-grid scenarios, one or more per solver
rule, each pairing a grid+constraints state with the cell/value the rule
forces. The explanation text can be reused directly from `SolvingStep` (the
solver already produces human-readable explanations — no need to write new
copy). Browsing UI shows one pattern at a time with its explanation; no timer
yet.

**Phase E — Learn mode: timed drill** *(depends on D)*
Given the Phase D pattern bank, a fixed-time (e.g. 30s, likely configurable)
round: show a random pattern, let the player pick the forced cell/value,
check instantly, track a running score, show results when time's up. This is
the most genuinely new interaction (a Timer, a different answer-input flow
than the existing click-to-cycle cell, a results screen) — worth its own
plan rather than folding into D.

## Files affected (indicative only — not binding, each phase's plan will detail this)

- Phase A: `App.jsx`, likely a new `frontend/src/components/ModeNav/` (or
  similar), refactor within `GameBoard.jsx`.
- Phase B: new `frontend/src/utils/generator.js` + tests.
- Phase C: new `frontend/src/components/UnlimitedMode/` (or similar).
- Phase D: new `frontend/src/data/patterns.js` (or similar) + new Learn
  browsing component.
- Phase E: new Timer component + drill component within Learn mode.

## Risks / open questions

- **Is "Unlimited mode" meant to be solver-assist-free (pure practice), or
  should it also offer the existing hint/step explanations on request?** This
  plan assumes pure practice (matches "they figure out the puzzle") but
  Phase C's own plan should confirm before building.
- **Puzzle difficulty**: should the generator support difficulty tiers (how
  many cells/constraints are revealed, which rules are needed to solve it),
  or is a single difficulty acceptable for a first version? Affects Phase B's
  scope non-trivially.
- **Learn mode's relationship to the live solver**: should timed-drill
  answers be checked against a fixed expected answer per pattern (simpler,
  what's assumed here), or run through the real solver at drill-time
  (more robust to pattern-bank bugs, more complex)?
- **Routing**: does switching modes need to change the URL (deep-linkable,
  browser back/forward), given this is a static GitHub Pages SPA with an
  existing base-path setup in `vite.config.js`? Affects whether Phase A pulls
  in a router dependency.
- This whole roadmap is intentionally not estimated in time — sizing in
  commits/phases instead, per the user's request to keep changes atomic.

## Verification

Not applicable to this document — verification belongs to each phase's own
plan once it's picked up for implementation.

## Review notes

Not reviewed — this is a draft roadmap for discussion, not a change to
implement. Skip the mandatory `/implement` review step for this document
itself; each phase gets reviewed when it's actually implemented.
