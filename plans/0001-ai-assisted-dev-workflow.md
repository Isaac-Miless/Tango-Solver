# 0001 - AI-assisted development workflow

Status: Implemented
Date: 2026-09-16

## Context

Work on this repo so far has happened directly, without a written record of
why a change was made or a check on whether it was the right call. The user
asked for a plan → implement → adversarial-review workflow, with plans logged
as markdown in the repo, and for skepticism by default rather than acting on
the first idea without scrutiny.

## Goals

- A durable, version-controlled place to write and read plans.
- A repeatable way to implement a plan and have it checked before it's called
  done.
- An adversarial review step that actively looks for reasons a change is
  wrong, not a rubber stamp.
- Standing behavioral guidance ("skepticism by default") that applies to all
  future work in this repo, not just this one.
- Enough automated testing that "the reviewer ran the tests" means something,
  given the repo had none.

## Non-goals

- CI enforcement of the workflow (no test/lint gate was added to
  `.github/workflows/`) — this is process discipline via `CLAUDE.md` and
  slash commands, not a hard gate. Could be added later if it's not enough.
- Full test coverage of the UI components (`GameBoard`, `Cell`, etc.) — this
  pass only covers the pure-logic utilities (`solver.js`, `validator.js`,
  `gameLogic.js`), since those are where a wrong deduction actually breaks
  the product and where UI/DOM test tooling wasn't already present.
- Bumping `vite` to a major version to close the last `npm audit` finding
  (esbuild dev-server issue) — that's a bigger, unrelated change to the build
  tool; see Risks below.

## Approach

- **Plans**: `plans/` at repo root, committed to git. `plans/TEMPLATE.md`
  defines the structure (Context, Goals, Non-goals, Approach, Alternatives
  considered, Files affected, Risks, Verification, Review notes). Plans are
  numbered `NNNN-slug.md`.
- **Workflow commands**: three project slash commands in `.claude/commands/`:
  - `/plan <description>` — research, then write a new plan file.
  - `/implement <plan-file>` — implement a plan, keep it updated as reality
    diverges, run build/tests, then trigger review.
  - `/review [target]` — run the adversarial review on demand (for changes
    made outside `/implement`).
- **Adversarial review**: `.claude/agents/adversarial-reviewer.md` defines a
  subagent whose brief is explicitly to find problems (solver-rule soundness,
  plan alignment, duplicated logic, unverified claims, scope creep, edge
  cases) rather than confirm the change is fine. `/implement` calls it
  automatically as a mandatory last step; `/review` calls it on demand.
- **Skepticism by default**: encoded in `CLAUDE.md` at repo root (loaded
  automatically every session) — question the first approach, check for
  existing utilities before writing new ones, verify claims by actually
  running things, surface tradeoffs instead of silently picking one.
- **Testing**: added Vitest (`^3.2.7` — the initial `npm install vitest` pulled
  latest v5, whose optional browser-mode peer dependencies produced an npm
  `ERESOLVE` conflict; v3.2.7 installs cleanly against the existing `vite ^5`
  tree with no such conflict and is a maintained line, unlike v1.x which was
  the first fallback tried). Added `test`/`test:watch` scripts to
  `frontend/package.json` and a `test: { environment: 'node' }` block to
  `frontend/vite.config.js` (pure logic, no DOM needed). Wrote unit tests for
  `solver.js`, `validator.js`, and `gameLogic.js` covering partial-solution
  validation, starting-position validation, move validation, win detection,
  and the *sound* solver rules (1–7). Rules 8–10 are deliberately not given
  "this is correct" tests — see the new finding under Review notes.

## Alternatives considered

- **`.claude/plans/` instead of `plans/`** — rejected per user preference:
  `plans/` at repo root is more visible/discoverable to a human browsing the
  repo, not just to Claude Code tooling.
- **Manual-only adversarial review** (a `/review` command the user runs by
  hand) — rejected in favor of making it a mandatory step inside
  `/implement`, per user preference for skepticism to be the default rather
  than opt-in.
- **CLAUDE.md guidance only, no slash commands/subagent** — considered, but
  plain-language guidance alone is easy to skip under time pressure; a
  concrete `/implement` step that mechanically spawns the reviewer is harder
  to accidentally skip than "remember to be skeptical."
- **Skipping test infra, relying on manual/code-reading review only** —
  rejected per user's explicit answer: without any test runner, "the reviewer
  ran the tests" was an empty claim. Vitest is the natural fit already being
  paired with Vite.

## Files affected

- `plans/TEMPLATE.md`, `plans/0001-ai-assisted-dev-workflow.md` — new.
- `CLAUDE.md` — new, repo-root workflow + skepticism guidance.
- `.claude/commands/plan.md`, `implement.md`, `review.md` — new slash commands.
- `.claude/agents/adversarial-reviewer.md` — new subagent definition.
- `frontend/package.json` — added `vitest` devDependency, `test`/`test:watch`
  scripts.
- `frontend/package-lock.json` — updated transitively by the `vitest` install.
- `frontend/vite.config.js` — added a `test` config block.
- `frontend/src/utils/solver.test.js`, `validator.test.js`, `gameLogic.test.js`
  — new unit tests.

## Risks / open questions

- Nothing enforces that `/plan`/`/implement`/`/review` actually get used —
  this is discipline, not a technical gate. If it's not enough in practice,
  a CI check (e.g. requiring a `plans/` file to change alongside logic
  changes, or running `npm test` in CI) is a natural follow-up.
- `npm audit` still reports one unresolved chain (esbuild via vite, 3
  moderate + 1 high) that requires a `vite` major-version bump (`vite@8`) to
  fully close. It's a dev-server-only issue (an attacker-controlled website
  could probe the local dev server while it's running) — left as-is rather
  than bundling an unrelated breaking build-tool upgrade into this change.
  Worth its own plan if the user wants it closed.
- The custom `adversarial-reviewer` agent is not a selectable `subagent_type`
  in every Claude Code surface (confirmed in this session: it isn't in the
  fixed agent list here). `.claude/commands/implement.md` and `review.md`
  now say explicitly to fall back to a `general-purpose` agent with the
  brief's file contents pasted in when that's the case, so the review still
  happens as a genuinely separate agent even without the exact type name.

## Verification

- `cd frontend && npm test` — 26/26 tests pass across
  `solver.test.js`/`validator.test.js`/`gameLogic.test.js` (vitest 3.2.7).
- `cd frontend && npm run build` — production build succeeds unchanged
  (vite 5.4.21, 47 modules, dist emitted).
- `cd frontend && npm audit` — 4 findings remain (3 moderate, 1 high), all one
  esbuild/vite dev-server chain; the original critical finding (outdated
  `vitest@1.6.1`'s transitives) was closed by upgrading to `vitest@3.2.7`.
- Manually confirmed each solver-rule test by tracing `solver.js`'s
  `applyAllRules` order against the constructed grid. One test bug was caught
  this way during initial writing (a Gap Rule case accidentally satisfied the
  Parity Rule first on a size-4 grid — fixed by moving it to size-6, where
  parity's higher `maxAllowed` doesn't pre-empt it) and a near-vacuous
  "never overwrites" test was caught and strengthened during adversarial
  review (see below).

## Review notes

Adversarial review (run via a `general-purpose` agent briefed with
`.claude/agents/adversarial-reviewer.md`, since that name isn't a selectable
`subagent_type` in this session — see Risks) found the following. Each item
below was independently re-checked, not taken on the reviewer's word alone.

1. **Solver rules 8, 9, and 10 (`applyModifierWithTwoEqualsRule`,
   `applyEndWithEqualsConstraintRule`, `applyAdjacentEqualsConstraintRule`)
   are logically unsound** — they can fill a cell with a value that isn't
   actually forced, contradicting the "no backtracking / no guessing" design
   this solver is supposed to guarantee. **CONFIRMED**, independently
   re-derived for rules 9 and 10 by hand:
   - Rule 9: a 6×6 grid with `[0][0]='sun'` and an equals constraint tying
     rows 3–4 of column 0 gets rows 3–4 forced to `'moon'`, but `sun` at rows
     3–4 (making the column `sun,_,_,sun,sun,_`) is an equally legal
     continuation — nothing rules it out at that point.
   - Rule 10: `[0][0]='moon'` with an equals constraint tying rows 1 and 3 of
     column 0 (a non-adjacent pair) gets row 1 forced to `'sun'`, but
     `moon` at row 1 (making the column `moon,moon,_,moon,_,_`) is equally
     legal — the rule's "directly below" check only looks at the nearer
     constraint cell's distance from the known cell, not whether the two
     constraint cells are adjacent to each other.
   - Rule 8 was reported similarly unsound (unused `val1`/`val2` reads at
     several call sites are a tell — a "both cells still empty" guard is
     missing) but not independently re-derived here.
   
   **Not fixed in this change.** These are pre-existing bugs in already-shipped
   solver behavior, not something introduced by this plan, and fixing them
   changes what the solver actually deduces (risk of reducing its solving
   power if done carelessly) — exactly the kind of change that should go
   through its own `/plan` → `/implement` → review cycle rather than being
   folded into a workflow-setup change. **Recommendation: open plan
   `0002-fix-unsound-solver-rules.md` to fix rules 8–10, add regression tests
   asserting each rule only fires when its deduction is actually forced, and
   only then treat solver.js as trustworthy end to end.**
2. **The `solvePuzzleStepByStep` "never overwrites a filled cell" test was
   near-vacuous** — the original scenario produced exactly one step, so the
   "never" was never exercised across multiple iterations. **Fixed**: replaced
   with a scenario producing two chained steps (No-Three Rule, then Two
   Equals at End Rule) and asserted the rule sequence explicitly.
3. **Vitest was pinned to `^1.6.x`, an old, unmaintained major, when a current
   version (`3.2.7`) installs cleanly against this repo's `vite ^5`.**
   **Fixed**: upgraded to `vitest@^3.2.7`; tests and build re-verified after
   the bump.
4. **Audit vulnerability counts and the `--force` upgrade target cited in an
   earlier draft of this plan were stale.** **Fixed**: corrected above to the
   actual current `npm audit` output.
5. **`frontend/package-lock.json` was missing from "Files affected".**
   **Fixed**: added.
6. **`adversarial-reviewer` isn't an invocable `subagent_type` in this
   session**, so `/implement`'s step 6 as originally written couldn't be
   followed literally. **Fixed**: `.claude/commands/implement.md` and
   `review.md` now name the `general-purpose` fallback explicitly.
7. Minor: some solver tests use grid size 4, which the product's UI never
   renders (always size 6). **Accepted as-is** — the rule functions are
   generically parameterized by `size`, not size-6-specific, so a size-4 test
   is a legitimate, simpler way to exercise the same logic; each test still
   asserts the specific `ruleName` fired, so it isn't masking a
   misattribution the way the earlier Gap Rule bug was.
