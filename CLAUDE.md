# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Tango Solver — a React + Vite web app (`frontend/`) that plays and solves the
LinkedIn "Tango" logic puzzle. See [README.md](README.md) for game rules and
the list of solving rules. Core logic lives in `frontend/src/utils/`:
`solver.js` (the deduction engine), `validator.js` (starting-position checks),
`gameLogic.js` (move validation / win detection).

## Workflow: plan → implement → review

Non-trivial changes — a new solver rule, a refactor, anything touching
`solver.js`/`validator.js`/`gameLogic.js`, or a multi-file change — go through
three stages below. Trivial fixes (typos, a style tweak, an obvious one-line
bug fix) can skip straight to implementation.

### 1. Plan

- Write a plan as a markdown file in [`plans/`](plans/), following
  [`plans/TEMPLATE.md`](plans/TEMPLATE.md).
- Name it `NNNN-short-slug.md`, incrementing `NNNN` from the highest existing
  plan number.
- A plan must state: the context/problem, the chosen approach, files affected,
  alternatives considered and why they were rejected, and how the result will
  be verified.
- Use `/plan <description>` to drive this stage.

### 2. Implement

- Follow the plan file. If reality diverges from it once you're in the code —
  a wrong assumption, a simpler approach turns up — update the plan file to
  say so. Don't silently drift from what's written.
- Update the plan's `Status` field as you go.
- Run `npm test` and `npm run build` inside `frontend/` before considering the
  work done.
- Use `/implement plans/NNNN-....md` to drive this stage.

### 3. Adversarial review (mandatory)

- Every `/implement` run ends by spawning the `adversarial-reviewer` agent
  (defined in [`.claude/agents/adversarial-reviewer.md`](.claude/agents/adversarial-reviewer.md))
  against the diff and the plan, before the work is reported as finished. Run
  it manually with `/review` for changes made outside `/implement`.
- The reviewer's job is to find reasons the change is wrong or the wrong
  call — not to rubber-stamp it. Resolve findings by fixing them or by
  recording, in the plan's "Review notes" section, why one is being accepted
  as-is. Don't let a finding just get silently dropped.
- For larger or higher-stakes changes, also consider the built-in
  `/code-review` skill (`ultra` for a deeper multi-agent cloud pass).

## Skepticism by default

- Don't treat your own first idea, or the literal phrasing of a request, as
  automatically correct. Before implementing: is there an existing utility in
  `frontend/src/utils/` that already does this? Does the change fit the
  solver's no-backtracking, pure-deduction design? Could a new rule produce a
  false deduction on some grid state?
- Don't report something as done because it reads correctly — verify it: run
  the build, run the tests, and if it's UI-facing, drive it in a browser
  rather than trusting your own reading of the code.
- When a decision meaningfully changes behavior or scope, surface the
  tradeoff and ask, rather than silently picking one path.

## Solver-specific notes

- `solver.js` is pure constraint propagation / logical deduction, deliberately
  with no backtracking or guessing (see README.md "Development Notes"). A new
  or changed rule must be provably sound: it may only fill a cell when that
  value is logically forced by the current grid state, never a probabilistic
  guess. When adding or changing a rule, add a test that would fail if the
  rule were unsound (i.e. produced a wrong value on some reachable grid
  state).
- `isValidPartialSolution` (`solver.js`) and `validateStartingPosition`
  (`validator.js`) duplicate similar row/column/consecutive-symbol checks, and
  `gameLogic.js`'s `validateMove`/`checkWin` duplicate them again. A change to
  one of these checks that isn't mirrored in the others is a likely bug, not
  just style drift — check all three when touching this logic.

## Testing

- `cd frontend && npm test` runs the Vitest suite
  (`frontend/src/utils/*.test.js`).
- No test suite existed before this workflow was introduced — see
  [`plans/0001-ai-assisted-dev-workflow.md`](plans/0001-ai-assisted-dev-workflow.md).
  Add tests alongside any solver/validator/gameLogic change; there's no CI
  gate enforcing this yet, so it relies on the plan → implement → review
  discipline above.
