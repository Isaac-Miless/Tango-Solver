---
description: Research a change and write a plan document to plans/
---

Research and produce a written plan for: $ARGUMENTS

1. Explore the codebase (use the Explore agent for anything beyond 1-2 known
   files) to find existing utilities, patterns, and constraints relevant to
   this request. If the change touches puzzle logic, read
   `frontend/src/utils/solver.js`, `validator.js`, and `gameLogic.js` first —
   don't propose new logic that duplicates what's already there.
2. If anything about scope, approach, or intent is ambiguous, ask the user
   before writing the plan. Don't guess at intent.
3. Find the highest-numbered file in `plans/` and pick the next `NNNN`.
4. Write `plans/NNNN-short-slug.md` following the structure in
   `plans/TEMPLATE.md`: Context, Goals, Non-goals, Approach, Alternatives
   considered (and why rejected), Files affected, Risks/open questions,
   Verification. Leave "Review notes" empty — that's filled in during
   `/implement`.
5. Be skeptical of the obvious first approach: in "Alternatives considered",
   note what else you weighed and why you didn't pick it.
6. Do not write any implementation code in this step. Stop once the plan file
   is written and summarize it for the user.
