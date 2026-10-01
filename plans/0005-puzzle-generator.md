# 0005 - Puzzle generator (Phase B of 0003)

Status: Implemented
Date: 2026-10-01

## Context

[Plan 0003](0003-multi-mode-app-roadmap.md) Phase B: no code in this repo
generates a puzzle today — every board is hand-entered. Unlimited mode
(Phase C) needs a fresh, valid, honestly-solvable puzzle on demand, and
Learn mode's later phases may also want generated scenarios. This phase
builds that generator as a standalone utility, with no UI yet. It depends on
[plan 0002](0002-fix-unsound-solver-rules.md) (merged) because it bakes in a
correctness assumption about the deductive solver that wasn't safe to make
while rules 8-10 were unsound: a generated puzzle is only "solvable" because
we trust `solvePuzzleStepByStep` to fully and correctly resolve it. Work
happens on the `puzzle-generator` branch (off `main`, which already includes
Phase A).

## Goals

- `generatePuzzle(size = 6)` produces a starting grid + constraints that the
  existing pure-deduction solver (`solvePuzzleStepByStep`) can fully resolve,
  with zero guessing, back to a complete, valid (`checkWin`-true) grid.
- The puzzle is non-trivial: as much starting information (revealed cells,
  constraint hints) is stripped away as possible while the puzzle remains
  solvable by pure deduction — not just "the full solution with one cell
  hidden."
- Randomized: repeated calls produce different puzzles, not the same one
  every time.
- Tested: generation is randomized, so correctness is verified by generating
  many puzzles and checking invariants hold every time, not by asserting one
  fixed output.
- Every generated puzzle has exactly one valid completion. This follows from
  the solver's soundness (plan 0002): since every rule only ever fills a cell
  with the value *logically forced* by the current state, a grid the solver
  completes in full has no step that could have gone another way — so that
  completion is the only full grid consistent with the starting clues, not
  merely *a* grid the solver happens to reach. This is verified directly (not
  just argued) by brute-force enumeration in the test suite (see Review
  notes) — an earlier draft of this plan incorrectly listed uniqueness as a
  non-goal.

## Non-goals

- Difficulty tiers / configurable reveal amount — flagged as an open
  question in plan 0003, deferred. This phase produces one difficulty: as
  hard as the deductive solver can still crack unassisted.
- Any UI — Phase C.

## Approach

New module `frontend/src/utils/generator.js`, two stages:

**1. Generate a random, fully-filled, valid solution grid.**
This is the one place randomized backtracking belongs in this codebase — it
is building an *answer*, not pretending to be the deductive solver. Build the
set of all row patterns that have exactly `size/2` suns and `size/2` moons
with no 3-in-a-row (for size 6: all `C(6,3)=20` combinations, filtered), then
backtrack row-by-row: shuffle the candidate rows, try each against the
column constraints accumulated so far (count-so-far ≤ `size/2` per column,
no 3 vertically consecutive), recurse, un-try on failure. Valid full grids
are known to exist for this game, so this always terminates; it throws
rather than silently returning a broken grid if it somehow doesn't (defensive
only — not expected to fire).

**2. Minimize down to a starting position, verified via the real solver.**
Start from the *fully revealed* state: every cell filled (the solution) and
every adjacent-cell edge exposed as a constraint (`equals` if the solution
agrees on that edge, `notEquals` if it disagrees — matching how the existing
UI only ever places constraints between adjacent cells). This starting state
is trivially over-determined. Build one shuffled list mixing both removable
item types — each cell, each constraint edge — and greedily try removing
each: clear the cell (or drop the edge), then check
(`validateStartingPosition` is valid) AND (`solvePuzzleStepByStep` run to
completion reaches a `checkWin`-true grid equal to the original solution).
If both hold, keep the removal and continue from the reduced state; if not,
put it back and move to the next candidate. A single shuffled pass is enough
*in practice* (see Review notes for why "checks the current state" isn't
actually the reason, and for the caveat on when it could in principle fail).
This directly reuses
`validateStartingPosition` (`validator.js`), `solvePuzzleStepByStep`
(`solver.js`), and `checkWin` (`gameLogic.js`) rather than reimplementing any
validity/completion logic.

`generatePuzzle(size = 6)` returns `{ grid, constraints, solution }` — the
starting position, its constraints, and the full solution (kept for test
verification now; a later phase may use it for an optional "reveal answer"
feature, but nothing in this phase exposes it in UI).

## Alternatives considered

- **Hand-author a fixed bank of puzzles instead of generating them.**
  Rejected: doesn't satisfy "fresh puzzle, repeatable indefinitely" from the
  original Unlimited mode request, and every puzzle would need to be
  hand-verified solvable, which is exactly the work the solver-driven
  minimization automates.
- **Minimize by removing a random cell/constraint one-at-a-time and
  re-running the full solver from scratch, but with multiple passes until no
  single pass removes anything** (instead of one shuffled pass). Rejected:
  unnecessary — a single pass already evaluates each candidate against the
  live, already-reduced state, so it already captures cross-item dependencies
  within that one pass. Verified in review (see Review notes) rather than
  assumed.
- **Enforce a target clue count (e.g. always exactly N revealed cells)
  instead of "remove everything removable."** Rejected for a first version:
  adds a difficulty knob this phase deliberately isn't building (see
  Non-goals); "remove everything that's safe to remove" is simpler and still
  produces a real puzzle.

## Files affected

- `frontend/src/utils/generator.js` — new. Also an explicit guard requiring
  `size` be a positive even integer, added after review (see Review notes).
- `frontend/src/utils/generator.test.js` — new: generate many puzzles (not
  one fixed case, since this is randomized) and assert, for every one: the
  starting grid validates (`validateStartingPosition`), the deductive solver
  fully resolves it to a `checkWin`-true grid equal to the recorded
  `solution`, and the starting grid reveals strictly less information than
  the full solution. Also a `generatePuzzle - uniqueness` suite, added after
  review: an independent brute-force enumeration of all 11,222 valid full
  6×6 grids, used to confirm every generated puzzle's clues + constraints are
  consistent with exactly one of them (see Review notes).

## Risks / open questions

- Backtracking performance is not a practical concern at size 6 (small
  search space, `C(6,3)=20` candidate rows per position), but the approach
  as described is specific to even `size` (since `size/2` must be a whole
  number of each symbol) — fine for this app's fixed 6×6 board; not claiming
  to generalize further.
- The minimization's single-shuffled-pass claim (no need for multiple
  passes) should be double-checked in review rather than taken on faith —
  flagged explicitly for the adversarial reviewer.

## Verification

- `cd frontend && npm test` — new `generator.test.js` passes repeatedly
  (run it a few times locally, not just once, given the randomization) and
  the full existing suite (31 prior tests) still passes.
- `cd frontend && npm run build` — succeeds.
- No UI change in this phase, so no browser verification needed.

## Review notes

Adversarial review (`adversarial-reviewer` agent, invoked directly as a
subagent type — this is the first phase where that worked without a
`general-purpose` fallback) wrote its own independent 500-puzzle stress
script (brute-force enumerating all 11,222 valid full 6×6 grids) rather than
just reading the code. Findings and resolutions:

1. **Stage 1 (solution-grid backtracking) is correct.** Confirmed
   independently: `fitsColumns`'s running column-count check guarantees
   exactly `size/2` of each symbol per column once all rows are placed, and
   checking only rows 0..row-1 is sufficient because every constraint gets
   evaluated by the time its last-involved row is placed — there's no
   forward-looking check being skipped. No action needed.
2. **The plan's stated reason for why one minimization pass suffices was
   wrong, though the conclusion happened to be right.** **CONFIRMED and
   fixed.** "Each check is against the current state" doesn't by itself
   explain why order doesn't matter. The real reason is monotonicity:
   removing information can only ever make a puzzle *harder or equal* for
   the solver, never easier — so if an item was safely removable earlier, it
   stays removable later; order only changes which items end up in the final
   kept set, not whether the process is sound. The reviewer flagged this
   isn't *guaranteed* in principle, since a rule that requires a cell to
   still be empty (e.g. the Rule 8 guard added in plan 0002) means "more
   filled-in info" could in theory make the solver deduce *less*, not more,
   from a specific cell. In practice, across 500 stress-tested puzzles plus
   every puzzle this plan's own test suite now generates, a second
   minimization pass never found anything left to remove — so the single
   pass is empirically sound for this solver's actual rule set, even though
   it isn't a property proven to hold for an arbitrary rule set. Fixed: the
   Approach section above no longer states the wrong reason; this note holds
   the real one.
3. **Reference-equality edge filtering (`e !== edge`) is safe.** Confirmed:
   `buildAllEdges` creates one fresh array per adjacent pair, each pair goes
   into exactly one of `equals`/`notEquals` (never both), and `filter`
   preserves object identity across the threaded `constraints` object. The
   stress script found zero duplicate edges across 500 generated puzzles. No
   action needed.
4. **Test gap: nothing proved generated puzzles have a *unique* solution,
   only that the solver's own output matches the recorded one.** **CONFIRMED
   and fixed** — this is exactly the gap that would hide a future unsound
   solver rule (one that fills a wrong-but-plausible value) from this test
   suite, since the existing tests only check the solver's own result against
   itself. Added a `generatePuzzle - uniqueness` suite in
   `generator.test.js`: an independent brute-force enumerator (deliberately
   not reusing `generator.js`'s internal row/column-building helpers — an
   oracle built from the same code it's checking can't catch that code's own
   bugs) that enumerates all 11,222 valid full 6×6 grids once, then for 30
   generated puzzles confirms exactly one of them is consistent with that
   puzzle's revealed cells and constraints. Passed 7 consecutive runs (210
   generated puzzles total) with no failures.
5. **The plan's Non-goals section incorrectly disclaimed uniqueness as
   unproven.** **CONFIRMED and fixed** — given solver soundness (every fill
   is logically forced, per plan 0002), a grid the solver completes in full
   is necessarily the *only* grid consistent with the starting clues, not
   merely a grid that happens to work. Moved this from Non-goals to Goals
   above, now backed by the brute-force test in finding 4, not just the
   logical argument alone.
6. **Termination/performance: no concern.** Finite search space
   (`C(6,3)=20` candidate rows per position for size 6), valid grids are
   plentiful so dead ends are rare, and the solver's iteration cap
   comfortably exceeds the cells it could ever need to fill. No action
   needed.
7. **Minor, accepted as-is**: `generator.js`'s private `hasThreeConsecutive`
   duplicates logic that already exists (differently shaped) in
   `gameLogic.js`, `validator.js`, and `solver.js`'s own consecutive-symbol
   checks — a fourth instance of the pattern CLAUDE.md already flags as
   existing technical debt in this codebase. Not fixed here: de-duplicating
   all four into one shared helper is a real, worthwhile cleanup, but it's a
   cross-cutting refactor unrelated to what this phase is building, not a
   correctness bug introduced by this change. Left as a candidate for its
   own future plan rather than folded in here.
8. **Scope matches the plan**: only `generator.js` and `generator.test.js`
   changed; no UI, no difficulty settings, consistent with Non-goals.
