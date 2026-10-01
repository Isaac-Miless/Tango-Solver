# 0006 - Consolidate the "three in a row" check into one shared helper

Status: Implemented
Date: 2026-10-01

## Context

The "no three identical symbols in a row/column" check is implemented
separately in four places:

- `frontend/src/utils/solver.js` — `isValidPartialSolution`'s inline
  row/column scan (checks a sliding window of 3 cells for equality).
- `frontend/src/utils/validator.js` — `validateStartingPosition`'s inline
  row/column scan (same shape, also builds an error message per violation).
- `frontend/src/utils/gameLogic.js` — the private `hasThreeConsecutive(arr,
  index)` helper, used by `validateMove`, plus a second, differently-shaped
  inline sliding-window scan inside `checkWin`.
- `frontend/src/utils/generator.js` — the private `hasThreeConsecutive(row)`
  helper (added in [plan 0005](0005-puzzle-generator.md), Phase B of the
  [multi-mode roadmap](0003-multi-mode-app-roadmap.md)), used while building
  candidate solution rows.

CLAUDE.md already calls out the first three as existing technical debt ("A
change to one of these checks that isn't mirrored in the others is a likely
bug, not just style drift"). Plan 0005's Review notes (finding 7) flagged
`generator.js` as a fourth instance, judged out of scope for that piece of
work but worth a dedicated cleanup. This plan is that cleanup.

Note on branch: this plan and its implementation live on a new branch,
`consolidate-three-in-a-row`, created off `puzzle-generator` (the only branch
where all four files above currently coexist — `generator.js` has not yet
been merged to `main`).

## Goals

- One exported, tested helper module is the single source of truth for "is
  there a run of 3+ identical values in this line" and its two variants
  (full-line scan, and the check-around-a-just-placed-index used by
  `validateMove`).
- All four duplicate call sites listed above are replaced with calls to the
  shared helper, with no change in observable behavior (same error messages,
  same validation results, same generated-row acceptance criteria).
- A test suite for the shared helper exists such that a regression in the
  core logic is caught by one focused test file, not by hoping it happens to
  be caught by four separate call sites' own tests.

## Non-goals

- Changing the *algorithm* used by `gameLogic.js`'s index-centered check
  (run-length counting outward from an index) to match the sliding-window
  style used elsewhere. They solve different problems (the gameLogic
  helper's caller is incrementally checking a single move, not scanning a
  full line) and forcing them into one shape risks subtly changing behavior
  for no benefit. Both now live in the one module, but stay logically
  distinct.
- Touching `generator.js`'s `fitsColumns`, which has its own inline
  consecutive-count check for the column being built during row-by-row
  backtracking. It isn't shaped like any of the four named duplicates (it
  checks two already-placed cells against a row being tentatively added, not
  a scan over a complete line) and wasn't flagged by plan 0005's review. Left
  alone to keep this change tightly scoped.
- Touching `generator.test.js`'s private `hasThreeInARow` test helper
  (`frontend/src/utils/generator.test.js:142`). It is a deliberate,
  independent re-implementation used as an oracle in that file's brute-force
  enumeration tests — wiring it to the real implementation would mean a bug
  in the shared helper could no longer be caught by that test, which
  defeats its purpose. It stays a separate, intentionally-duplicated copy.
- Any change to solving/validation behavior. This is a pure refactor; if any
  test's expected output would need to change, that's a sign the refactor
  introduced a behavior change and must be fixed, not accepted.
- Merging `puzzle-generator` into `main`, or otherwise touching the
  multi-mode roadmap status. Out of scope here.

## Approach

Add a new module, `frontend/src/utils/gridLines.js`, exporting three
functions:

- `threeInARowIndices(line)` — given a flat array (a grid row, or a column
  extracted via `grid.map(r => r[col])`), returns the array of start indices
  `i` where `line[i] !== null && line[i] === line[i+1] && line[i+1] ===
  line[i+2]`. This is the exact check `validateStartingPosition` currently
  inlines, generalized to return *all* matches (preserving its current
  behavior of reporting a separate error for each overlapping run, e.g. 4-in-
  a-row currently produces 2 error messages — this generalization keeps
  that).
- `hasThreeInARow(line)` — `threeInARowIndices(line).length > 0`, used
  wherever only a boolean is needed (`solver.js`, `generator.js`,
  `gameLogic.js`'s `checkWin`). Grids here are at most 6x6, so the lack of
  early-exit is not a performance concern.
- `wouldExceedTwoConsecutive(line, index)` — the run-length-counting
  algorithm moved verbatim from `gameLogic.js`'s private
  `hasThreeConsecutive(arr, index)`, renamed for clarity and exported. Used
  by `validateMove`.

Call site changes:

- `solver.js`: `isValidPartialSolution`'s two inline loops (row check,
  column check) become `hasThreeInARow(grid[row])` and
  `hasThreeInARow(grid.map(r => r[col]))`.
- `validator.js`: `validateStartingPosition`'s two inline loops become calls
  to `threeInARowIndices`, mapping each returned index to the same error
  message string as today (`Row ${row+1} has 3+ consecutive ... starting at
  column ${index+1}` / the column equivalent).
- `gameLogic.js`:
  - `validateMove`'s two calls to the local `hasThreeConsecutive` become
    calls to `wouldExceedTwoConsecutive`, imported from `gridLines.js`. The
    local function definition is deleted.
  - `checkWin`'s two inline sliding-window loops become
    `hasThreeInARow(grid[row])` and `hasThreeInARow(grid.map(r => r[col]))`.
    This wasn't named explicitly in the originating request, but CLAUDE.md's
    own note ("gameLogic.js's `validateMove`/`checkWin` duplicate them
    again") calls out `checkWin` by name, and leaving it unconverted would
    mean this cleanup ships with one of the flagged duplicates still in
    place.
- `generator.js`: the private `hasThreeConsecutive(row)` function is deleted;
  its one call site in `buildValidRows` becomes `hasThreeInARow(row)`,
  imported from `./gridLines`.

## Alternatives considered

- **Add the export to an existing file (e.g. `gameLogic.js`) instead of a
  new `gridLines.js`.** Rejected: all four consumers (`solver`, `validator`,
  `gameLogic`, `generator`) are peers, and `generator.js` already imports
  from both `validator.js` and `solver.js` — adding the shared helper to
  either of those, or to `gameLogic.js`, would make one of the four files
  reach into another's internals for a concern (line-pattern checking) that
  isn't really that file's responsibility. A small neutral module avoids
  picking an arbitrary "owner" and avoids new cross-imports between the
  existing four files.
- **Collapse `wouldExceedTwoConsecutive` and `hasThreeInARow` into a single
  function** (e.g. always scan the whole line and ignore the index). Rejected
  — `validateMove` is called during interactive play on every cell placement;
  its existing algorithm is already correct and cheap, and reshaping it into
  a full-line scan changes working logic for a refactor that's supposed to be
  behavior-preserving. Keeping both functions, clearly named, documents that
  they intentionally answer different questions ("does this line contain a
  violation anywhere" vs. "does *this* index's just-placed value create
  one").
- **Also fix `generator.js`'s `fitsColumns` and `generator.test.js`'s
  `hasThreeInARow` oracle while in the area.** Rejected — see Non-goals.
  `fitsColumns` isn't the same duplicate pattern, and the test oracle is
  duplicated on purpose.
- **Name the module `lineChecks.js` or `consecutive.js` instead of
  `gridLines.js`.** Either naming works; `gridLines.js` was chosen because
  the shared concept across all call sites is "a line (row or column)
  extracted from the grid," which is the common vocabulary already implicit
  in how callers build the `line` argument (`grid[row]` or
  `grid.map(r => r[col])`).

## Files affected

- `frontend/src/utils/gridLines.js` — new file; exports
  `threeInARowIndices`, `hasThreeInARow`, `wouldExceedTwoConsecutive`.
- `frontend/src/utils/gridLines.test.js` — new file; unit tests for all
  three exports, including edge cases (nulls breaking a run, runs of 4+,
  boundary indices, empty/short lines).
- `frontend/src/utils/solver.js` — `isValidPartialSolution` uses
  `hasThreeInARow`.
- `frontend/src/utils/validator.js` — `validateStartingPosition` uses
  `threeInARowIndices`.
- `frontend/src/utils/gameLogic.js` — `validateMove` uses
  `wouldExceedTwoConsecutive`; `checkWin` uses `hasThreeInARow`; local
  `hasThreeConsecutive` deleted.
- `frontend/src/utils/generator.js` — `buildValidRows` uses `hasThreeInARow`;
  local `hasThreeConsecutive` deleted.
- `frontend/src/utils/solver.test.js`, `validator.test.js`,
  `gameLogic.test.js`, `generator.test.js` — unchanged in intent (still
  exercise "no three in a row" through each module's public behavior); only
  touched if the refactor requires it (it shouldn't, since behavior is
  preserved).

## Risks / open questions

- `validateStartingPosition`'s current loop pushes one error message per
  matched start index, so an existing run of 4+ identical symbols currently
  produces 2 overlapping error messages for the same row/column. Using
  `threeInARowIndices` must reproduce this exactly (not de-duplicate it) to
  keep behavior identical — verified by a test with a run of 4.
  (Collapsing to a single error per line would be a reasonable
  *improvement*, but it's a behavior change outside this refactor's scope.)
- `wouldExceedTwoConsecutive` is moved verbatim, not rewritten, specifically
  to avoid having to re-prove its correctness — the only change is its name
  and location.
- This branch (`consolidate-three-in-a-row`) is off `puzzle-generator`, which
  is itself not yet merged to `main`. Landing this work means either merging
  it back into `puzzle-generator`, or rebasing once `puzzle-generator` merges
  to `main` — a decision for whoever integrates this, not part of this
  plan's implementation step.

## Verification

- `cd frontend && npm test` — all existing suites
  (`solver.test.js`, `validator.test.js`, `gameLogic.test.js`,
  `generator.test.js`) must continue to pass unchanged, plus the new
  `gridLines.test.js`.
- `cd frontend && npm run build` — confirms no import/export wiring issues.
- Manual check: grep for `hasThreeConsecutive` across `frontend/src` after
  the change returns zero matches outside of `generator.test.js`'s
  intentionally-separate oracle.
- Mandatory adversarial review per CLAUDE.md, run via `/review` (or as the
  final step of `/implement`).

## Review notes

Adversarial review (`adversarial-reviewer` agent) ran against the staged
diff and this plan. No blocking or worth-fixing findings. It independently
verified:

- `threeInARowIndices`'s overlapping-window behavior reproduces the old
  validator.js loop exactly, including a run of 4 producing two error
  messages (not one).
- `wouldExceedTwoConsecutive` is a verbatim move of gameLogic.js's old
  private `hasThreeConsecutive(arr, index)` — same algorithm, only renamed
  and relocated.
- `hasThreeInARow` at the former inline-scan sites (`solver.js`,
  `gameLogic.js`'s `checkWin`) is logically equivalent to what was there
  before.
- `grep -rn "hasThreeConsecutive" frontend/src` returns zero matches, and
  `generator.test.js`'s independent test-oracle `hasThreeInARow` is
  untouched and does not import from `gridLines.js`, per this plan's
  Non-goals.
- Ran `npm test` (54/54 passing) and `npm run build` (succeeds) itself
  rather than trusting the implementer's report.

No findings needed fixing or recording as accepted-as-is.
