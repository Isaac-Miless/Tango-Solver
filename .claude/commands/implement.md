---
description: Implement a plan from plans/, then run the mandatory adversarial review before reporting done
---

Implement the plan at: $ARGUMENTS

1. Read the plan file fully. If a step turns out to be wrong once you're in
   the code (a bad assumption, a better approach available), update the plan
   file to reflect the change and say why — don't quietly diverge from what's
   written.
2. Set the plan's `Status` to "In Progress".
3. Implement the change.
4. Run `npm run build` and `npm test` inside `frontend/`. Fix failures before
   continuing.
5. If the change is UI-facing, drive it in the browser pane and check the
   golden path plus at least one edge case — don't rely on code-reading alone.
6. Run the adversarial review: read `.claude/agents/adversarial-reviewer.md`
   and spawn it as an agent against the diff and the plan file. If your
   environment doesn't expose `adversarial-reviewer` as a selectable
   `subagent_type`, spawn a `general-purpose` (or equivalent) agent instead
   and paste the full contents of that file in as its brief — the important
   thing is that the review runs as a separate agent, with no visibility into
   your own reasoning, not that a specific subagent_type string matches. This
   step is mandatory and must come from that agent, not be written by you.
7. Address every finding it returns: fix it, or record in the plan's "Review
   notes" section why it's being accepted as-is. Don't mark the plan
   Implemented with a finding that was neither fixed nor explicitly accepted.
8. Set the plan's `Status` to "Implemented" once review findings are
   resolved, and report to the user what changed and what the reviewer found
   (including anything accepted as-is, and why).
