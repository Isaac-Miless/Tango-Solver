# 0002 - Fix unsound solver rules (8, 9, 10)

Status: Implemented
Date: 2026-09-16

## Context

The adversarial review run against [plan 0001](0001-ai-assisted-dev-workflow.md)
found that solver rules 8 (`applyModifierWithTwoEqualsRule`), 9
(`applyEndWithEqualsConstraintRule`), and 10
(`applyAdjacentEqualsConstraintRule`) in `frontend/src/utils/solver.js` can
fill a cell with a value that isn't actually logically forced — they violate
the solver's core guarantee (README.md "Development Notes": no backtracking,
every fill must be forced). Two of the three were independently re-derived by
hand; this plan fixes all three and adds regression tests that would catch a
recurrence.

## Goals

- Rules 8, 9, and 10 only ever fill a cell when the value is actually forced.
- Regression tests exist for each fix, constructed the same way the bug was
  found: a concrete grid state, hand-verified as a genuine counterexample
  before the fix and a non-trigger after it.
- No new unsoundness introduced, and the existing 26 tests must still pass.
  (Not achieved as originally stated below — see Review notes: deleting Rule
  9 does lose a small number of deductions that were individually correct,
  even though the rule's general reasoning was unsound.)

## Non-goals

- A general soundness proof or formal verification of the whole rule set —
  out of scope; this fixes the three known-bad rules.
- Adding new solving power/rules beyond what's already there.

## Approach

**Rule 10 (Adjacent Equals Constraint Rule) — tighten the adjacency check.**
The rule's reasoning ("known value V, adjacent cells tied by `=`, so they
must be opposite to avoid 3-in-a-row") is only sound when the two
`=`-constrained cells are themselves adjacent to each other (forming an
unbroken run of 3 with the known cell), not merely when the nearer one is
adjacent to the known cell. Currently the code checks `minRow === row + 1` /
`maxRow === row - 1` (nearer constraint cell touches the known cell) but never
checks `Math.abs(r1 - r2) === 1` (the two constraint cells touch each other).
Fix: add that check (and the column equivalent, `Math.abs(c1 - c2) === 1`)
alongside the existing ones, for both the column and row branches.

**Rule 9 (End with Equals Constraint Rule) — remove it.**
Once Rule 10 requires genuine adjacency, Rule 9's *sound* cases (known end
cell directly touching an adjacent `=` pair, with no gap) are also caught by
the fixed Rule 10, which applies the same reasoning to any known cell, not
just cells at a row/column end. Rule 9's remaining, non-adjacent cases are
exactly the unsound ones (confirmed counterexample in plan 0001's review
notes). Fix: delete `applyEndWithEqualsConstraintRule` and its call in
`applyAllRules`.
**Correction (see Review notes): this is not a lossless subsumption.** A
handful of Rule 9 firings were forced by whole-grid satisfiability
constraints that have nothing to do with 3-in-a-row adjacency — Rule 9
reached the right answer there by coincidence of its (flawed) condition, not
because its stated reasoning was valid. Deleting it is still correct (an
unsound rule cannot be trusted to distinguish those coincidentally-right
cases from its confirmed-wrong ones), but it does mean the solver has
slightly less solving power than before this fix, not none-lost as originally
claimed.

**Rule 8 (Modifier Balance Rule) — guard the "Additional case" blocks.**
The first two blocks (cross-column/row, checking `val1 === neededSymbol &&
val2 === null`) are sound on their own merits (independent of the
col1/row1 "near capacity" precondition that gates them — that precondition
is unnecessary but not incorrect). The bug is in the two "Additional case"
blocks (same-column and same-row): they treat a `notEquals`-constrained pair
as a guaranteed future "+1 of the needed symbol" without checking that both
constraint cells are still empty. If either cell in that pair is already
filled, it's already counted in the current `colSuns`/`colMoons` total and
provides no additional guarantee. Fix: add `if (val1 !== null || val2 !==
null) continue` immediately after computing `val1`/`val2` in both
"Additional case" loops (column and row).

## Files affected

- `frontend/src/utils/solver.js` — the three fixes above, plus removal of a
  pre-existing dead loop (`solver.js`, inside the cross-column block of Rule
  8) whose every branch was a bare `continue` — found while re-reading this
  exact function for the real fix, removed as a drive-by since it's fully
  inert and directly adjacent to the change.
- `README.md` — rule 9 in "Implemented Solving Rules" described the deleted
  `End with Equals Constraint Rule`; updated to describe the actual current
  rule 9 (`Adjacent Equals Constraint Rule`).
- `frontend/src/utils/solver.test.js` — add regression tests:
  - Rule 10: reject a non-adjacent `=` pair (the row-1/row-3 counterexample
    from plan 0001) — assert it does *not* fire the wrong way; add a
    positive case for a genuinely adjacent pair to confirm the rule still
    works when it should.
  - Rule 9 removed: add a test confirming its old counterexample grid (top
    known, non-adjacent `=` pair near the bottom) now produces no step from
    that grid state (or a different, sound rule/no rule at all) instead of a
    forced fill.
  - Rule 8: reject the column-0 counterexample from plan 0001 (both
    constraint cells already filled) — assert the empty cell is *not* forced;
    add a positive case where the constraint pair is genuinely still empty to
    confirm the rule still fires correctly there.

## Alternatives considered

- **Patch Rule 9 in place (add an adjacency requirement) instead of deleting
  it.** Rejected: once adjacency is required, Rule 9's logic becomes
  identical to Rule 10's (a known cell with an adjacent `=` pair), just
  restricted to grid-boundary cells. Keeping two rules that do the same
  thing, one of them artificially limited to the edges, adds maintenance
  surface for no solving-power benefit.
- **Leave rules 8–10 disabled entirely (remove from `applyAllRules`) rather
  than fix them**, given they're a small fraction of solving steps in
  practice. Rejected: rules 8 and 10 (once fixed) still add real solving
  power the simpler rules don't cover; deleting working logic to avoid fixing
  a bounded bug is a bigger behavior change than necessary.

## Risks / open questions

- Removing Rule 9 could make some previously-"solvable via steps" puzzles
  require one more step from Rule 10 instead, or (if a puzzle depended on
  Rule 9's specific misfire) change what the step-by-step explanation says.
  This is intended: any puzzle that only "solved" because of the unsound
  behavior wasn't actually being solved correctly.
- No corpus of real puzzles to regression-test against — verification here
  relies on the hand-constructed counterexamples plus the existing 26 tests,
  not on re-solving a large sample of real Tango boards.

## Verification

- `cd frontend && npm test` — 31/31 pass (was 26 before this plan; 5 new
  regression tests added for rules 8 and 9).
- `cd frontend && npm run build` — production build unaffected (vite 5.4.21,
  47 modules).
- Adversarial review ran an independent brute-force soundness fuzzer (not
  just hand-traced cases): for every firing of the Modifier Balance Rule or
  Adjacent Equals Constraint Rule on a random satisfiable 6×6 grid, it
  checked whether a legal completion exists with the *opposite* value in the
  filled cell. Pre-fix: 84 unsound firings out of 197. Post-fix: 0 unsound
  out of 485 firings across 30,000 random grids.

## Review notes

Adversarial review (`general-purpose` agent briefed with
`.claude/agents/adversarial-reviewer.md`) found the following. All were
independently plausible given the fuzzer methodology described above, and
addressed as noted.

1. **The plan's "no lost deductions" claim was false.** **CONFIRMED**: for
   `grid[0][0]='sun'`, `equals: [[4,0,5,0]]` (size 6), the deleted Rule 9 used
   to correctly force `[4,0]='moon'` — the fuzzer confirmed `sun` there has no
   legal full-grid completion — but the fixed solver now returns no step at
   all for that grid. Rule 9 reached that correct answer through a condition
   unrelated to its stated 3-in-a-row reasoning (it happened to overlap with
   a real whole-grid parity constraint), not because the deleted logic was
   actually sound in general. **Fixed**: corrected the Goals and Approach
   sections above rather than reverting the deletion — an unsound rule can't
   be trusted to tell its coincidentally-correct firings from its confirmed
   -wrong ones, so removing it is still the right call; the solver is
   marginally less powerful in this narrow case as a result, not fully
   lossless as first claimed.
2. **Two of the three promised regression tests were missing**: a Rule 8
   positive case (constraint pair still empty) and a test for the *deleted*
   rule 9's specific counterexample (as opposed to the already-present test
   for rule 10's own, different bug). **Fixed**: both added to
   `solver.test.js`; all 31 tests pass.
3. **`README.md` still described the deleted rule.** **Fixed**: updated rule
   9's description to the actual current `Adjacent Equals Constraint Rule`.
4. **Plan hygiene**: `Status` was left at `Draft` and "Review notes" was a
   placeholder after implementation was already done. **Fixed**: this
   section, and `Status` above.
5. **Pre-existing dead code** (`solver.js`, a `notEquals` loop in Rule 8's
   cross-column block whose every branch was a bare `continue`) sitting
   inside the function being fixed. **Fixed** as a drive-by (see Files
   affected) since it was fully inert and directly in the code already being
   touched — not scope creep, just not leaving known-dead code in a function
   this plan already needed to understand line-by-line.
6. **Accepted as-is, out of scope**: contradictory constraints (the same cell
   pair listed in both `equals` and `notEquals`) — the grid is already
   unsatisfiable in that case, and no rule claims a fill from it either
   before or after this change, so there's no new or worsened behavior here.
   Also accepted as-is: Rule 8's cross-column/cross-row blocks are gated by
   an unrelated, unnecessary "column 1 near capacity" precondition (harmless
   — just makes the rule fire less often than it soundly could) and their
   step explanations mention that precondition as if it mattered, which is
   mildly misleading copy but not incorrect. Neither is a correctness bug;
   left for a future cleanup rather than folded into this fix.
