# 0006 - Unlimited mode UI (Phase C of 0003)

Status: Implemented
Date: 2026-10-01

## Context

[Plan 0003](0003-multi-mode-app-roadmap.md) Phase C: Unlimited mode hands the
player a fresh, generated puzzle to solve themselves, with no solver
assistance. Phases A ([0004](0004-app-shell-mode-navigation.md), merged) and
B ([0005](0005-puzzle-generator.md), merged) are both prerequisites and are
now in `main`: the mode-switching shell exists with an `UnlimitedMode`
placeholder, and `generatePuzzle()` produces verified, uniquely-solvable
puzzles. This phase replaces the placeholder with the real thing. Work
happens on the `unlimited-mode` branch (content-equivalent to current `main`,
branched from `puzzle-generator` before its PR merged — see Risks).

## Goals

- Unlimited mode shows a freshly generated puzzle on first visit.
- The player fills cells by clicking (cycle: empty → sun → moon → empty),
  same interaction as Solver mode; starting clues are locked.
- Win is detected the same way Solver mode detects it (`checkWin`), with the
  same confetti celebration. (`checkWin` itself turned out to need a fix to
  make this claim true for *either* mode — see Review notes.)
- A "New Puzzle" control generates a different puzzle. A separate "Reset"
  control restores the *current* puzzle's starting clues without generating
  a new one (undo the player's own fills).
- No solver assistance (no hints, no "Solve" button) — matches plan 0003's
  stated assumption for this phase ("they figure out the puzzle").

## Non-goals

- Hints / solver assistance in Unlimited mode — flagged as an open question
  in plan 0003, resolved here by taking its documented default (pure
  practice). A "show me the next step" feature is a plausible future
  addition but is a scope decision of its own, not bundled in here.
- Difficulty selection — `generatePuzzle()` doesn't support it yet (plan
  0005 Non-goals); nothing to wire up.
- Persisting puzzle state across page reloads — out of scope; reloading
  loses progress, same as Solver mode today.
- Learn mode — phases D/E.

## Approach

**1. Extract `PuzzleGrid`, the piece `GameBoard` and `UnlimitedMode` both
need.** `GameBoard.jsx` currently inlines its board-rendering JSX (mapping
`grid` to rows of `Cell` components, computing highlight/result/affected
state per cell). Pull this into
`frontend/src/components/PuzzleGrid/PuzzleGrid.jsx` + `.css`, taking
`grid`, `constraints`, `gridSize`, `onCellClick`, `lockedCells`, and
optional `highlightedCells`/`currentStep` (for Solver mode's step
highlighting) and optional `onEdgeDrop`/`onConstraintRemove`/
`draggingConstraint` (for Solver mode's constraint editing — `Cell.jsx`
already no-ops safely when these are `undefined`, confirmed by reading it,
so `UnlimitedMode` simply omits them to get a read-only-constraints board
for free, no new prop plumbing needed in `Cell.jsx` itself). `GameBoard.jsx`
is updated to render `<PuzzleGrid>` instead of its inline JSX, with no
behavior change. This is the extraction Phase A's plan explicitly deferred
("Phase C has the second use case") — now it does.

**2. `UnlimitedMode.jsx`**: on mount, `generatePuzzle(6)` (lazy `useState`
initializer). State: `puzzle` (the generated `{ grid, constraints, solution
}`, treated as immutable once generated) and `grid` (the live, player-edited
board, initialized as a copy of `puzzle.grid`). `lockedCells` is derived
(`useMemo`) from `puzzle.grid` — a cell is locked iff it was revealed by the
generator. Cell clicks cycle empty→sun→moon→empty exactly like
`GameBoard.handleCellClick`, check `checkWin` after every click, and trigger
`Confetti` the same way `GameBoard.handleSolve` does (no need for the
rising-edge-detection `useEffect` pattern `GameBoard` uses elsewhere — that
exists there because multiple code paths can complete the puzzle; here there
is only one, so triggering confetti inline at the point of detection is
simpler and sufficient). "New Puzzle" calls `generatePuzzle(6)` again and
replaces `puzzle`+`grid`; "Reset" copies `puzzle.grid` back into `grid`
without regenerating.

**3. Consolidate shared button/status styles into `App.css`.** Once
`UnlimitedMode` needs its own "New Puzzle"/"Reset" buttons and a win
message, it needs the same look as Solver mode's buttons
(`.control-buttons`, `.reset-button`, `.solve-button`, `.win-message`,
`.error-message` — currently defined only in `GameBoard.css`). Rather than
duplicate those rules into a new `UnlimitedMode.css` (the exact mistake
Phase A's review caught and fixed for `.mode-placeholder`), move the
genuinely shared ones into `App.css` (already the home for
cross-mode-shared styles since Phase A) and leave Solver-specific ones
(`.step-button`, `.solving-explanation`, `.game-rules`,
`.exit-history-button`, etc.) in `GameBoard.css`.

## Alternatives considered

- **Give `UnlimitedMode` its own copy of the button/grid CSS instead of
  extracting/sharing.** Rejected per the Phase A precedent: duplicated class
  names across separately-loaded stylesheets are a real bug waiting to
  happen (whichever loads last wins; an edit to one silently affects or gets
  overridden by the other), not a style preference.
- **Offer a "hint" button that calls `getNextStep` from `solver.js`.**
  Rejected for this phase — see Non-goals; it's a real, plausible feature
  but changes the mode's character (practice vs. assisted) and deserves its
  own decision, not a default bundled into the first version.
- **Keep `GameBoard`'s inline board JSX and duplicate it into
  `UnlimitedMode` instead of extracting `PuzzleGrid`.** Rejected: this is
  exactly the second-consumer case Phase A's plan said to wait for; now that
  it exists, duplicating ~45 lines of JSX (cell highlighting logic included)
  across two components is the premature-vs-necessary tradeoff resolving in
  favor of extracting.

## Files affected

- `frontend/src/components/PuzzleGrid/PuzzleGrid.jsx`, `PuzzleGrid.css` —
  new (extracted from `GameBoard.jsx`/`GameBoard.css`).
- `frontend/src/components/GameBoard/GameBoard.jsx` — use `PuzzleGrid`
  instead of inline board JSX; no behavior change.
- `frontend/src/components/GameBoard/GameBoard.css` — remove the
  board/row rules now in `PuzzleGrid.css`; remove the button/status rules
  now in `App.css`.
- `frontend/src/components/UnlimitedMode/UnlimitedMode.jsx`, `.css` — real
  implementation, replacing the Phase A placeholder.
- `frontend/src/App.css` — add the shared button/status rules moved out of
  `GameBoard.css` (`.win-message` only — `.error-message` turned out not to
  be shared yet; see Review notes).
- `frontend/src/components/Cell/Cell.jsx` — added after review: only show
  the "removable" cursor on a constraint symbol when `onConstraintRemove` is
  actually provided (Unlimited mode's constraints are read-only puzzle
  clues, not editable).
- `frontend/src/utils/gameLogic.js` — added after review: `checkWin` gained
  a `constraints` parameter and now actually checks them (see Review notes
  — this was a pre-existing gap affecting Solver mode too, not something
  introduced by this phase).
- `frontend/src/utils/gameLogic.test.js` — added after review: regression
  tests for the `checkWin` fix.
- `frontend/src/utils/generator.js`, `generator.test.js` — updated after
  review for `checkWin`'s new signature (no behavior change — `generator.js`
  already had `constraints` in scope at its one `checkWin` call site).

## Risks / open questions

- The `unlimited-mode` branch was created from `puzzle-generator` before its
  PR (#2) was merged to `main`; GitHub now shows `main` one merge-commit
  ahead with content-identical to this branch's base (confirmed via `git
  diff origin/main unlimited-mode` — empty). No rebase performed since
  there's nothing to reconcile; noting it so the eventual PR's base diff
  isn't a surprise.
- ~~None of the solver-logic files (`solver.js`, `validator.js`,
  `gameLogic.js`, `generator.js`) are touched by this phase — purely UI and
  CSS reorganization, lower-stakes than phases A/B.~~ **Wrong, see Review
  notes**: `gameLogic.js`'s `checkWin` needed a real fix once adversarial
  review showed it didn't check constraints at all. `solver.js` and
  `validator.js` remain untouched.

## Verification

- `cd frontend && npm test && npm run build` — no logic files changed, so
  all existing tests should pass unmodified; build must succeed.
- Manual browser check (UI-facing phase):
  - Unlimited tab shows a generated puzzle with locked starting clues.
  - Clicking an unlocked cell cycles sun/moon/empty; locked cells don't
    respond to clicks.
  - Solving the puzzle triggers the win message + confetti.
  - "Reset" restores starting clues without changing the puzzle.
  - "New Puzzle" produces a different puzzle.
  - Switching to Solver and back to Unlimited doesn't regenerate the puzzle
    or lose progress (consistent with Phase A's always-mounted mode views).
  - Solver mode still behaves identically post-extraction (place symbols,
    constraints, Solve All, Solve Step-by-Step, step history).
  - Mobile width check.

## Review notes

Adversarial review (`adversarial-reviewer` agent) wrote a temporary probe
test (since deleted) to check whether generated puzzles' constraints could
actually be violated by an otherwise-complete, balanced, no-3-in-a-row grid.
Findings and resolutions:

1. **Blocks: Unlimited mode could declare a wrong answer solved.**
   **CONFIRMED.** `checkWin(grid, size)` only ever checked that the grid was
   full, row/column balanced, and free of 3-in-a-row runs — it never looked
   at `constraints` at all, despite every other validity function in this
   codebase (`isValidPartialSolution`, `validateStartingPosition`,
   `validateMove`) checking them. The reviewer's probe found 40/40 generated
   puzzles had at least one complete grid that matched the starting clues,
   broke a constraint, and still passed the old `checkWin`. This bug already
   existed in shipped Solver mode (a user could hand-enter constraints,
   fill a grid that ignores them, and see "Puzzle solved!"), but it was easy
   to not notice there since the user authored those constraints themselves;
   in Unlimited mode the constraints are the puzzle's own clues, so it's the
   mode's one job to get this right. **Fixed**: `checkWin` now takes
   `(grid, constraints, size)` — matching the parameter order already used
   by `validateStartingPosition`/`validateMove`/`solvePuzzleStepByStep`, so
   this also corrects a pre-existing inconsistency, not just adds a check —
   and verifies equals/notEquals the same way `isValidPartialSolution`/
   `validateStartingPosition` already do. Every call site updated (5 in
   `GameBoard.jsx`, 1 in `UnlimitedMode.jsx`, 1 in `generator.js`, plus
   tests). Added 2 regression tests reproducing the exact failure pattern
   (a complete, row/col-valid, no-3-in-a-row grid that breaks an equals or
   notEquals constraint) plus 1 confirming the fix doesn't produce false
   negatives on a genuinely valid win.
2. **Worth fixing: Unlimited's confetti timer was never cleared,** so
   win → New Puzzle → win again within 3 seconds could have the first
   puzzle's stale timeout cut off the second celebration early. `GameBoard`
   avoids this via a `useEffect` cleanup; `UnlimitedMode`'s simpler inline
   trigger (justified in Approach above, since it only has one completion
   path) still needed to cancel any pending timeout before starting a new
   one. **Fixed**: added a `confettiTimeoutRef` that both the trigger and
   `New Puzzle`/`Reset` clear before doing anything else.
3. **Minor: constraint symbols showed a "clickable" cursor in Unlimited
   mode** even though clicking them does nothing there (`onConstraintRemove`
   is only wired up in Solver mode). **Fixed**: `Cell.jsx` now only applies
   the `edge-has-constraint` (cursor: pointer) class when
   `onConstraintRemove` is actually provided — ties the visual affordance to
   real interactivity instead of to "a constraint happens to be here."
4. **Minor: `.error-message` was moved to `App.css` and documented as
   "shared," but only `GameBoard.jsx` actually renders one** (Unlimited mode
   has no validation-error states yet). **Fixed**: moved back to
   `GameBoard.css` (base rule + its one responsive override); `.win-message`
   stayed in `App.css` since both modes genuinely use it.
5. **Confirmed sound, no action needed**: the `PuzzleGrid` extraction is
   behaviorally equivalent to the inline JSX it replaced (the `Boolean(...)`
   guards around `highlightedCells`/`currentStep` produce the same rendered
   classes as the original code's assumption of always-non-null values; the
   dropped `cellConstraints` variable was dead code with no side effects,
   confirmed by reading every usage); no state desync between `puzzle` and
   `grid`/`lockedCells` (all updated in the same event handler, batched by
   React 18 into one render, `lockedCells` memoized on `[puzzle]`); the CSS
   migration left nothing duplicated or dangling, and responsive breakpoints
   landed in the right homes (768/640/480 for buttons/status, 768/480 for
   grid padding); no solver-logic files beyond the `checkWin` fix were
   touched; no hint/solve feature crept in despite the groundwork this phase
   laid (`puzzle.solution` existing in state, `checkWin` now correct) making
   one easy to add.
6. **Confirmed not a real bug**: `.puzzle-grid` matching both GameBoard's
   (hidden but mounted, per Phase A) and UnlimitedMode's grid elements was a
   test-script scoping bug on this session's part during manual verification
   (an unscoped `document.querySelectorAll('.puzzle-grid .cell')` returned
   72 cells instead of 36), not an application bug — nothing in the actual
   app does a global, unscoped DOM query; all cell/lock/constraint state
   flows through React props. Reviewer independently confirmed this by
   auditing every `querySelector` call in the codebase.
