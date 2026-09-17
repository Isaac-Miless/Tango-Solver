# 0004 - App shell / mode navigation (Phase A of 0003)

Status: Implemented
Date: 2026-09-17

## Context

[Plan 0003](0003-multi-mode-app-roadmap.md) laid out a five-phase roadmap to
grow this app from a single Solver tool into three modes: Solver, Learn, and
Unlimited. This is Phase A: the app shell that lets the player switch between
modes at all. It depends on nothing else in the roadmap and is deliberately
the smallest, lowest-risk phase — everything else (the puzzle generator,
Learn's pattern bank/timer) builds on top of whatever this phase puts in
place. Work happens on the `multi-mode-revamp` branch; a PR gets opened once
this (and likely later phases) are implemented and tested.

## Goals

- The player can switch between three top-level views: Solver, Learn,
  Unlimited.
- The existing Solver experience (today's `GameBoard`) is reachable,
  unchanged in behavior, as one of those views.
- Learn and Unlimited exist as clearly-labeled placeholders (no
  functionality yet — that's phases B-E).
- The switch mechanism is simple enough not to block later phases, without
  committing to infrastructure (e.g. a router) those phases don't need yet.

## Non-goals

- Building any Learn or Unlimited functionality (generator, pattern bank,
  timer) — phases B-E.
- Extracting reusable pieces out of `GameBoard.jsx` (grid rendering, cell
  interaction) for future modes to share. **Deviation from plan 0003's
  description of Phase A**, which suggested doing this now. Reasoning: the
  only current consumer of that logic is `GameBoard` itself; extracting a
  shared component before a second consumer (Phase C's Unlimited mode)
  exists means guessing at the right shape of that abstraction. Phase C
  should do this extraction when it has a concrete second use case to
  extract for — refactoring GameBoard now would be speculative.
- URL-based routing (see Alternatives considered) — deferred until a mode
  genuinely needs to be deep-linkable/bookmarkable, which isn't a stated
  requirement yet.

## Approach

- Lift a `mode` state (`'solver' | 'learn' | 'unlimited'`, default
  `'solver'`) into `App.jsx`.
- Add a new `ModeNav` component (`frontend/src/components/ModeNav/`) rendered
  between `Header` and `main`: three buttons/tabs, one per mode, calling
  `setMode`. Styled consistently with the existing glassmorphism look
  (`Header.css`'s `backdrop-filter`/translucent-white pattern).
- `App.jsx` renders `GameBoard` when `mode === 'solver'`, and two new stub
  components otherwise:
  - `frontend/src/components/LearnMode/LearnMode.jsx` — placeholder card:
    "Learn mode is coming soon."
  - `frontend/src/components/UnlimitedMode/UnlimitedMode.jsx` — same pattern:
    "Unlimited mode is coming soon."
  Both follow the existing per-component folder convention (`.jsx` + `.css`
  colocated, see `Header/`, `GameBoard/`).
- No changes to `GameBoard.jsx`'s internals, `solver.js`, `validator.js`, or
  `gameLogic.js` — this phase is purely additive UI/navigation.
- `Header`'s subtitle ("Puzzle Solver") becomes mode-agnostic copy (e.g. drop
  it or generalize it), since the header is now shared across three modes,
  not just the solver.

## Alternatives considered

- **`react-router-dom` with per-mode URLs** (`/solver`, `/learn`,
  `/unlimited`), using `vite.config.js`'s existing `base` path as the
  router's `basename`. Rejected for this phase: adds a dependency and
  routing-config surface (a `basename` that has to stay in sync with the
  GitHub Pages base-path logic) for a benefit — deep-linking/back-forward
  between three tabs — nobody has asked for. Plain state is trivially
  upgradable to routed state later if that need shows up; the reverse
  (removing a router once pages depend on it) is more work. If the user
  wants shareable mode URLs, that's a small follow-up, not a blocker here.
- **Extracting `GameBoard`'s grid-rendering into a shared component now**
  (as plan 0003 originally suggested for Phase A) — see Non-goals above for
  why this is deferred to Phase C instead.

## Files affected

- `frontend/src/App.jsx` — add `mode` state, render `ModeNav` + all three mode
  views (see Review notes: all three stay mounted, visibility toggled via
  CSS, not conditional rendering).
- `frontend/src/App.css` — `.mode-view`/`.mode-view-hidden` (visibility
  toggle) and the shared `.mode-placeholder` styling (see Review notes).
- `frontend/src/components/ModeNav/ModeNav.jsx`, `ModeNav.css` — new.
- `frontend/src/components/LearnMode/LearnMode.jsx` — new (stub; no separate
  `.css` — see Review notes).
- `frontend/src/components/UnlimitedMode/UnlimitedMode.jsx` — new (stub; no
  separate `.css` — see Review notes).
- `frontend/src/components/Header/Header.jsx`, `Header.css` — remove the
  solver-specific subtitle and its now-unused CSS rule.
- `frontend/index.html` — `<title>` updated from "Tango - Puzzle Solver" to
  "Tango", for the same reason as the header subtitle.
- `.claude/launch.json` — new; defines the local dev server so this phase's
  manual browser verification (and future UI-facing phases') could run.
  Committed deliberately as project tooling, not a scope-creep leftover.

## Risks / open questions

- None blocking. The main risk is scope creep back into Phase C's territory
  (extraction) or Phase B's (generator) — guarded against by the Non-goals
  above.

## Verification

- `cd frontend && npm test && npm run build` — existing suite must stay
  green; no logic files touched, so no new tests are expected for this
  phase, but the build must succeed and no existing test should break.
- Manual check in the browser pane (this phase is UI-facing):
  - Load the app, confirm it opens on Solver mode with `GameBoard` behaving
    exactly as before (place symbols, add constraints, Solve All, Solve
    Step-by-Step).
  - Click Learn and Unlimited tabs, confirm the placeholder renders and the
    active tab is visually indicated.
  - Switch back to Solver, confirm any in-progress grid state is still
    intact (or note if it resets, and confirm that's acceptable for a
    placeholder-only phase).
  - Resize to mobile width, confirm the nav doesn't break layout.

## Review notes

Adversarial review (`general-purpose` agent briefed with
`.claude/agents/adversarial-reviewer.md`) drove the app in the browser and
read every changed file. Findings and resolutions:

1. **State loss on mode switch was real, not just theoretically acceptable.**
   **CONFIRMED**: reviewer placed a symbol in Solver, switched to Learn and
   back, and the grid, constraints, and step history were all gone —
   unmounting `GameBoard` (React's default behavior for conditionally
   rendered components) destroys its `useState`. The plan's original
   Verification section treated this as acceptable "for a placeholder-only
   phase," but the cost lands on Solver — the only mode that actually works
   — not on the placeholders. **Fixed**: all three mode views now stay
   mounted permanently; only CSS visibility (`.mode-view-hidden { display:
   none }`) toggles. This also makes moot a secondary note the reviewer
   raised (a pre-existing uncancelled `setTimeout` in `GameBoard.jsx`'s
   `handleSolve` confetti logic, which an unmount mid-timer would have fired
   against a dead component) — `GameBoard` no longer unmounts during mode
   switching, so that path isn't exercised here. Left as pre-existing,
   unrelated code otherwise.
2. **`frontend/index.html`'s `<title>` still said "Tango - Puzzle Solver."**
   **Fixed**: same reasoning as dropping the header subtitle — the whole app
   isn't solver-only anymore, and the tab title is user-facing branding just
   like the header. Changed to "Tango".
3. **`.mode-placeholder` was defined identically in two separate files**
   (`LearnMode.css`, `UnlimitedMode.css`), both loaded globally by Vite —
   whichever imported last would win, and an edit to one silently affects
   the other or gets silently overridden. **Fixed**: consolidated into
   `App.css` as a shared rule (it's one genuinely shared style, not two
   coincidentally-identical ones), removed both per-component `.css` files
   and their imports.
4. **`aria-current="page"` was the wrong ARIA token** for a same-page
   view-toggle button (that attribute means "this link points at the page
   you're currently on"; no navigation happens here). Reviewer judged full
   `role="tablist"`/`tab`/`tabpanel` overkill for placeholder-heavy content,
   but a one-word fix was worth it. **Fixed**: switched to `aria-pressed`,
   added `aria-label="App mode"` on the `<nav>`.
5. **Plan `Status` was still `Draft` after implementation.** **Fixed**: set
   to `Implemented` (this section).
6. **`.claude/launch.json` (added this session to drive manual browser
   testing) wasn't in Files affected and isn't covered by any `.gitignore`.**
   Not a bug, but an undocumented, undecided file risked being swept into a
   commit by accident. **Fixed**: added to Files affected above as
   deliberate, committed project tooling (there's no reason future phases'
   UI verification shouldn't reuse it).
7. **Accepted as-is**: not extracting `GameBoard` internals, and not adding
   `react-router` — reviewer judged both correct calls for the reasons
   already stated in Non-goals / Alternatives considered above.
