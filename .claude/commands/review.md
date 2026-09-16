---
description: Run the adversarial reviewer agent against the current diff (or a given target)
---

Read `.claude/agents/adversarial-reviewer.md` and spawn it as an agent against:
$ARGUMENTS — default to the current uncommitted diff (`git diff`, plus
`git status` for new files) if nothing is specified. If `adversarial-reviewer`
isn't a selectable `subagent_type` in your environment, spawn a
`general-purpose` agent instead and paste that file's full contents in as its
brief — what matters is that the review comes from a separate agent, not the
exact subagent_type string.

If a plan file in `plans/` corresponds to this work, pass it to the reviewer
as context so it can check the implementation against the plan's stated goals
and alternatives, not just the diff in isolation.

Report the reviewer's findings to the user verbatim. Don't summarize away
disagreements or soften severity — the point of this command is skepticism,
not reassurance.
