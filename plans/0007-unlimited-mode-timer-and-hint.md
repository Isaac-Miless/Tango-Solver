# 0007 - Unlimited mode: timer and hint

Status: Implemented
Date: 2026-10-01

## Context

The user asked, directly (not from the original roadmap), for two additions
to Unlimited mode ([plan 0006](0006-unlimited-mode.md), just landed): a
timer showing how long a puzzle takes to solve, and a hint button. Clarified
in conversation: the hint should check for *rule violations* (a mistake the
player has already made), not diff the board against the puzzle's hidden
solution; and hint usage needs a cooldown (~10 seconds). This supersedes
0006's Non-goals, which had assumed "no hints" as the default per plan
0003 — that assumption was explicitly correct to make at the time (no
instruction either way yet) and is explicitly overridden now by direct
request. Continues on the `unlimited-mode` branch (not yet pushed/PR'd).

## Goals

- A running timer, visible while solving, showing elapsed time since the
  current puzzle attempt started; stops and shows the final time on
  completion.
- A "Hint" button that:
  - If the current grid already violates a rule (row/column balance,
    3-in-a-row, or a broken `=`/`×` constraint), tells the player that and
    which rule/cells are involved — reusing existing validation, not new
    logic.
  - Otherwise, reveals the next logically-forced move (reusing the same
    deductive engine and highlight/explanation UI Solver mode's
    step-by-step already uses) — it *shows* the move, it doesn't place it
    for the player.
  - Is rate-limited: ~10 second cooldown between uses, visible on the
    button itself.

## Non-goals

- A shared, reusable `Timer` component. Plan 0003's Phase E (Learn mode's
  timed drill) will also want a timer, but a *count-down-to-zero-then-stop*
  timer and this *count-up-until-complete* timer are different enough in
  shape that guessing a shared interface now risks building the wrong one —
  same reasoning Phase A used to defer the `PuzzleGrid` extraction until a
  second, concrete consumer existed in code, not just in a future phase's
  plan. Keep the timer inline in `UnlimitedMode.jsx` for now; revisit
  extraction when Phase E is actually built and the real shared shape (if
  any) is known.
- Pausing the timer when the player switches to another mode. Unlimited
  mode's view stays mounted (Phase A), so a player who switches to Solver
  mid-puzzle and back will see elapsed wall-clock time, not "active" time.
  This is a real UX tradeoff, not an oversight — true pause/resume needs
  tracking mode visibility, which is more machinery than this request asked
  for. Flagged here rather than silently decided; revisit if it's not what
  the user wants once they try it.
- Scoring, hint-usage tracking/penalties, or affecting the timer when a
  hint is used — not requested.
- Any change to Solver mode's existing step-by-step feature — hint reuses
  its underlying functions, not its UI.

## Approach

**Timer**: `useState` + a manually started/stopped `setInterval` in
`UnlimitedMode.jsx` (not a `useEffect` reacting to `!isComplete` — the timer
needs explicit start points at mount/"New Puzzle"/"Reset" and an explicit
stop point the instant a click completes the puzzle, which came out simpler
as direct start/stop calls than as a dependency-driven effect), storing
elapsed seconds. Stops the instant `isComplete` becomes true, and the frozen
final time is shown in the win message (e.g. "🎉 Puzzle solved in 1:23!").
Formatted `mm:ss` via a small local helper (no existing time-formatting
utility in this codebase to reuse).

**Hint**: a new `handleHint` in `UnlimitedMode.jsx`:
1. Call `validateStartingPosition(grid, puzzle.constraints, GRID_SIZE)` from
   `validator.js` — despite its name, this is exactly "is this grid state
   rule-valid," already returns human-readable error strings (e.g. "Row 3
   has too many suns", "Constraint violation: Cells (1,1) and (2,2)..."),
   and is already used elsewhere in this codebase for this exact kind of
   check. If `!isValid`, show `errors.join('. ')` as the hint message — no
   new validation logic written.
2. Otherwise, call `getNextStep(grid, puzzle.constraints, GRID_SIZE)` from
   `solver.js` — the same function Solver mode's step-by-step uses. If it
   returns a step, highlight it using `PuzzleGrid`'s existing
   `highlightedCells`/`currentStep` props (already built for Solver mode,
   not new) and show its `explanation` text, plus a caveat that the move
   assumes current entries are correct (see Review notes — this matters
   because the mistake check above only catches *rule* violations, not a
   placement that's merely wrong relative to the actual solution). If it
   returns `null` — which, given the generator's uniqueness guarantee, means
   some earlier placement doesn't match the solution even though it broke no
   rule — say so rather than implying the hint system is just out of moves.
3. Start a 10-second cooldown (`setInterval` ticking the remaining seconds
   down, same shape as the confetti-timeout fix from 0006's review, with its
   `clearInterval` moved to a `useEffect` after review — see Review notes)
   that disables the Hint button and shows the remaining seconds on it.
   Disabled once `isComplete` too, rather than handling a "hint on a solved
   board" case at click time.

## Alternatives considered

- **Diff the player's grid against `puzzle.solution` to detect mistakes**
  instead of rule-violation checking. Rejected per explicit instruction:
  rule-violation checking was specifically requested, and it also means a
  "mistake" is flagged as soon as it's actually invalid (a rule break),
  rather than only when it happens to differ from one particular (if
  unique) solution — more informative and reuses existing validation rather
  than a new solution-comparison path.
- **Auto-fill the hinted cell** instead of highlighting + explaining.
  Rejected: filling it for the player collapses the distinction between
  "hint" and "solve one step," which plan 0006 deliberately kept out of
  Unlimited mode; showing-not-doing matches "reveals what the next move
  should be."
- **Extract a shared `Timer` component now** — see Non-goals.

## Files affected

- `frontend/src/components/UnlimitedMode/UnlimitedMode.jsx` — timer state,
  hint handler, cooldown, wiring `highlightedCells`/`currentStep` into the
  existing `PuzzleGrid` props, new buttons/display, plus (added after
  review) locking the board once solved.
- `frontend/src/components/UnlimitedMode/UnlimitedMode.css` — timer/hint
  display styling.
- `frontend/src/App.css` — `.solving-explanation`/`.explanation-rule`/
  `.explanation-text`/`.error-message` moved here from `GameBoard.css`
  (both GameBoard and UnlimitedMode now genuinely use them — a real second
  consumer, not a speculative one), plus a new `.explanation-caveat` rule
  (added after review).
- `frontend/src/components/GameBoard/GameBoard.css` — the four classes
  above removed (moved, not duplicated).
- `frontend/src/utils/*` — no changes; this phase is pure reuse of
  `validateStartingPosition` and `getNextStep`, both already exported.

## Risks / open questions

- Wall-clock (not pause-on-switch) timer — see Non-goals; flagged for the
  user to react to once they try it.
- The hint's mistake-detection reuses `validateStartingPosition`, whose
  name and one check ("Grid cannot be completely empty") are about starting
  positions specifically — harmless here (mid-game grids are never empty)
  but worth noting the function is being used slightly outside its literal
  name. Not renaming/refactoring it as part of this phase (out of scope).

## Verification

- `cd frontend && npm test && npm run build` — no logic files change, so
  existing tests must stay green; build must succeed.
- Manual browser check (UI-facing):
  - Timer starts at 0:00 when a puzzle loads and counts up.
  - Timer stops and shows the final time when the puzzle is solved.
  - "Reset" restarts the timer from 0:00.
  - "New Puzzle" restarts the timer from 0:00.
  - Hint on a grid with a deliberate mistake (e.g. place a value that
    breaks a visible `×` constraint) shows a mistake message, not a move
    suggestion.
  - Hint on a mistake-free, unsolved grid highlights a cell and shows an
    explanation, matching Solver mode's step-by-step explanation style.
  - Hint button is disabled with a visible countdown for ~10s after use,
    then re-enables.
  - Hint on an already-solved grid doesn't crash or show a nonsense message.

## Review notes

Adversarial review (`adversarial-reviewer` agent) read the full diff
including the two prior CSS migrations, traced `getNextStep`/`applyAllRules`
to reason about edge cases, and verified behavior rather than just the code.
Findings and resolutions:

1. **A hint's "next move" is only forced *given* the player's current
   entries — if one of them doesn't match the solution (but breaks no
   rule), the hint confidently suggests a move that follows from the
   mistake, not from the real solution.** This is a direct, correct
   consequence of the user's explicit choice (rule-violation detection, not
   solution-diffing) — the reviewer agreed the logic shouldn't change, only
   that it should be said out loud. **Fixed**: added a caveat line under
   move-suggestion hints ("Assumes your current entries are correct...").
2. **The "No more hints available right now." message implied waiting would
   help, when reaching that state (given the generator's uniqueness
   guarantee) almost always means an earlier placement doesn't match the
   solution.** **Fixed**: reworded to say so directly. Also corrected the
   plan's Approach text, which claimed this branch could mean "already fully
   solved" — it can't, since `isComplete` is checked (and now the button is
   disabled) before `getNextStep` is ever called.
3. **Un-filling the puzzle's last cell after a win left the timer frozen
   while the board was visibly unsolved, and re-solving fired confetti again
   showing the stale frozen time.** The reviewer judged "keep it stopped"
   more defensible than restarting (the first solve is the real solve time)
   and recommended simply not allowing edits once solved. **Fixed**:
   `handleCellClick` now returns immediately if `isComplete`, same as it
   already does for locked cells — the board freezes on solve, matching the
   frozen timer and win message it displays.
4. **Clicking Hint on an already-solved board (reachable before fix #3, via
   the Hint button itself regardless of board-lock state) showed "Puzzle
   already solved!" in the mistake-styled red box and still consumed a
   cooldown.** **Fixed**: the Hint button is now also `disabled` when
   `isComplete`, so this state isn't reachable via normal interaction; the
   now-dead `isComplete` branch was removed from `handleHint` rather than
   left as unreachable code.
5. **Accepted as-is**: "New Puzzle" resets the hint cooldown, which could in
   principle let a player cycle puzzles for a fresh hint — but doing so also
   discards all progress and restarts the timer, so it's not a meaningful
   way to defeat the cooldown on any puzzle actually being solved. "Reset"
   (which *does* preserve the puzzle and progress-relevant state) correctly
   does not reset the cooldown.
6. **The hint cooldown's `clearInterval` lived inside the `setHintCooldown`
   updater function — a side effect in a place React (especially
   StrictMode, which double-invokes updaters in dev) doesn't expect one,
   fragile even though harmless today.** **Fixed**: the updater now only
   computes the next value; a `useEffect` watching `hintCooldown` clears the
   interval once it actually reaches 0.
7. **Plan inaccuracies found and fixed** (see Approach/Files affected
   above): the timer was described as a `useEffect` reacting to
   `!isComplete` when it's actually manually started/stopped; the cooldown
   was described as `setTimeout`-based when it's `setInterval`-based;
   `App.css`/`GameBoard.css` were missing from Files affected.
8. **Confirmed sound, no action needed**: no solution leakage beyond the one
   forced cell a hint is meant to reveal (checked `getNextStep`'s
   `affectedCells`/`resultCell` only ever mark the premise cells plus the
   one forced cell, and `PuzzleGrid` only highlights — never fills — them);
   `clearHint()` fires on every unlocked cell click, not just winning ones,
   so a stale hint never lingers after the board changes; no interval/timeout
   leaks across any path (every start clears its own prior interval, unmount
   cleanup clears all three, React StrictMode's double-mount in dev is
   safe); the CSS migration left nothing duplicated or dangling (one
   cosmetic empty line in `GameBoard.css`'s 640px block, cleaned up).
