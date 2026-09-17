# Project memory: read WORKLOG.md first, append when done

## Read at session start (mandatory)

1. Before doing any substantive work in this repo, read `WORKLOG.md` at the
   project root. It contains the durable session history: what shipped, why,
   key decisions, and gotchas.
2. Use it to answer "what did we do last time?" questions instead of asking
   the user to re-explain. Verify claims against git (`git log`) when precise
   details matter — the worklog is a summary, not a source of truth.
3. Treat the "Key decisions & gotchas" section as standing constraints
   (offline-first CSP, inline-SVG icons only, no inline styles, test suite
   must pass before merge).

## Append at session end (mandatory)

1. When substantive work is completed (PR merged, issue closed, significant
   design decision made), append a terse entry to the TOP of the
   **Session Log** section of `WORKLOG.md` (newest first).
2. Entry format: `### YYYY-MM-DD · Session N — short title` followed by
   bullet points with PR links, what/why, and any gotcha a future session
   would otherwise have to rediscover.
3. Commit the worklog update together with the work (or as a tiny follow-up
   commit on `main`). Keep it under ~10 lines per item; link PRs instead of
   narrating them.
4. Never put secrets, personal file paths, or reference images into the
   worklog — it is committed to a public-capable repo.
