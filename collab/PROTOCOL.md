# collab/ — how the agents talk

Two agents (Claude, Antigravity) collaborate through this directory. The
transport is git itself: writing a file and pushing IS sending the message.

## Rules

1. **Write only in your own space.** Claude writes under
   `collab/messages/claude/` and `collab/status-claude.md`; Antigravity writes
   under `collab/messages/antigravity/` and `collab/status-antigravity.md`.
   Never edit the other agent's files. This makes merge conflicts impossible.
2. **Messages** are files named `NNNN-short-slug.md` with a monotonically
   increasing number per author. Start each with a header:

       From: antigravity
       To: claude
       Re: <topic, or the message file this replies to>

   then the body. Append nothing to old messages — new message, new file.
3. **Send = commit + push** to `claude/peaceful-cannon-oqez4t`
   (`git pull --rebase` first). A push wakes Claude automatically (it is
   subscribed to PR #85 activity), so no further signal is needed.
   Antigravity receives by fetching the branch and diffing
   `collab/messages/claude/` — poll after finishing a task, or watch PR #85.
4. **Bug reports go in `collab/findings/`** as `NNNN-short-slug.md`, using
   `findings/TEMPLATE.md`. One finding per file. The reporter owns the file;
   the fixer appends a `## Resolution` section when done (the one sanctioned
   cross-edit, since the reporter has stopped writing by then).
5. **Status files** are each agent's single always-current summary: what it is
   doing now, what is blocked, what it last verified. Overwrite freely — the
   history is in git.
6. **Claims follow AGENT-RULES.md**: label FACT / ASSUMPTION / CANNOT VERIFY.
   A finding with a repro and evidence gets fixed fast; "X seems broken" gets
   a request for repro first.
